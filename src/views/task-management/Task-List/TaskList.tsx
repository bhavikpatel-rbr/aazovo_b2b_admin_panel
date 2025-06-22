// src/views/your-path/MergedTaskList.tsx
import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// Removed ZodType import as it's not directly used.

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput"; // Typo 'Debouce' is from original
// Checkbox import is likely for DataTable internals, keeping it.
// import Checkbox from "@/components/ui/Checkbox"; 
import { Form as UiFormComponents, FormItem as UiFormItem } from "@/components/ui/Form";
import Badge from "@/components/ui/Badge";
import { DatePicker, Drawer, Dropdown, Select, Input } from "@/components/ui"; // Added Input for export reason

// Icons
import {
  TbPlus,
  TbPencil,
  TbCopy,
  TbTrash,
  TbChecks,
  TbSearch,
  TbCloudUpload,
  TbFilter,
  TbX,
  TbUserCircle,
  TbEye,
  TbMail,
  TbBrandWhatsapp,
  TbBell,
  TbUser,
  TbTagStarred,
  TbCalendarEvent,
  TbActivity,
  TbReload, // For clear filters button
} from "react-icons/tb";
import { BsThreeDotsVertical } from "react-icons/bs";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store"; // Adjust path if needed
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust path
import { getAllTaskAction, submitExportReasonAction } from "@/reduxtool/master/middleware"; // Adjust path

// --- Consolidated Type Definitions ---

export type TaskStatus =
  | "completed"
  | "on_hold"
  | "pending"
  | "cancelled"
  | "in_progress"
  | "review"
  | string;

// Updated TaskItem to align more with API and existing UI needs
export interface TaskItem {
  id: string; // From API number, converted to string
  note: string; // API: task_title
  status: TaskStatus; // API: status (string, transformed to snake_case)
  assignTo: string[]; // API: assign_to (string "[1,2]") -> parsed to string array of names/placeholders
  createdBy: string; // API: user_id (string) -> processed to name/placeholder
  createdDate: Date; // API: created_at (string) -> Date
  dueDate?: Date | null; // API: due_data (string) -> Date | null
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent' | string; // API: priority (string)
  category?: string; // API: module_name (string)
  description?: string; // API: note_remark or additional_description
  linkedTo?: { type: string; id: string; name: string }[]; // Example, not directly in provided API
  labels?: string[]; // Example, not directly in provided API
  comments?: any[]; // API: activity_notes
  attachments?: any[]; // API: attachments
  
  // Fields for export and potentially more detailed display/filtering
  updated_at?: string; // API: updated_at (string ISO date)
  updated_by_name?: string; // Placeholder, to be derived if needed
  updated_by_role?: string; // Placeholder, to be derived if needed
  _originalData?: any; // Store raw API data if needed later
}


// FilterFormSchema - kept simple, can be expanded
const filterValidationSchema = z.object({
  status: z.array(z.string()).default([]),
  assignTo: z.array(z.string()).default([]),
  // Future filters can be added here:
  // priority: z.array(z.string()).optional(),
  // category: z.array(z.string()).optional(),
  // createdDateRange: z.object({ start: z.date().nullable(), end: z.date().nullable() }).optional(),
  // dueDateRange: z.object({ start: z.date().nullable(), end: z.date().nullable() }).optional(),
});
export type FilterFormSchema = z.infer<typeof filterValidationSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
    reason: z
        .string()
        .min(1, 'Reason for export is required.')
        .max(255, 'Reason cannot exceed 255 characters.'),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- Constants ---
// initialTaskListData is no longer the primary source, data comes from Redux.
// export const initialTaskListData: TaskItem[] = [ ... ]; 

export const taskStatusColor: Record<TaskStatus, string> = {
  pending: "bg-amber-500",
  in_progress: "bg-blue-500",
  review: "bg-purple-500",
  completed: "bg-emerald-500",
  on_hold: "bg-gray-500",
  cancelled: "bg-red-500",
};

// --- CSV Exporter Utility ---
const TASK_CSV_HEADERS = [
    'ID', 'Title', 'Status', 'Assigned To', 'Created By', 
    'Created Date', 'Due Date', 'Priority', 'Category', 'Description', 
    'Last Updated' 
];

// Ensure keys match the TaskItem structure or transformed values for export
type TaskExportItem = Omit<TaskItem, 'createdDate' | 'dueDate' | 'assignTo' | 'comments' | 'attachments' | '_originalData' | 'linkedTo' | 'labels'> & {
    createdDateFormatted: string;
    dueDateFormatted: string;
    assignToString: string;
    updated_at_formatted?: string;
};


const exportTaskToCsv = (filename: string, rows: TaskItem[]) => {
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info">
                Nothing to export.
            </Notification>,
        );
        return false;
    }

    const transformedRows: TaskExportItem[] = rows.map((row) => ({
        id: row.id,
        note: row.note,
        status: row.status.replace(/_/g, " "), // Format status for readability
        assignToString: Array.isArray(row.assignTo) ? row.assignTo.join('; ') : row.assignTo,
        createdBy: row.createdBy,
        createdDateFormatted: row.createdDate.toLocaleDateString(),
        dueDateFormatted: row.dueDate ? row.dueDate.toLocaleDateString() : 'N/A',
        priority: row.priority || 'N/A',
        category: row.category || 'N/A',
        description: row.description || 'N/A',
        updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A',
        // Other fields from TaskItem if needed for export can be added here
    }));
    
    // Define keys for export based on TaskExportItem
    const CSV_KEYS_EXPORT_DYNAMIC: (keyof TaskExportItem)[] = [
        'id', 'note', 'status', 'assignToString', 'createdBy', 
        'createdDateFormatted', 'dueDateFormatted', 'priority', 'category', 'description', 
        'updated_at_formatted'
    ];


    const separator = ',';
    const csvContent =
        TASK_CSV_HEADERS.join(separator) +
        '\n' +
        transformedRows
            .map((row) => {
                return CSV_KEYS_EXPORT_DYNAMIC.map((k) => {
                    let cell = row[k];
                    if (cell === null || cell === undefined) {
                        cell = '';
                    } else {
                        cell = String(cell).replace(/"/g, '""'); // Escape double quotes
                    }
                    if (String(cell).search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`; // Enclose in double quotes if it contains separator, newline or double quote
                    }
                    return cell;
                }).join(separator);
            })
            .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { // \ufeff for BOM for Excel
        type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.push(
            <Notification title="Export Successful" type="success">
                Data exported to {filename}.
            </Notification>,
        );
        return true;
    }
    toast.push(
        <Notification title="Export Failed" type="danger">
            Browser does not support this feature.
        </Notification>,
    );
    return false;
};


// --- Reusable Components ---

export const ActionColumn = ({ // Unchanged from previous merge
  onEdit,
  onChangeStatus, 
  onDelete,
  onClone, 
}: {
  onEdit: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
  onClone?: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-0.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center">
      <Tooltip title="Edit Task">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          )}
          role="button"
        >
          <TbEye />
        </div>
      </Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add as Notification</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Mark as Active</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Add to Calendar</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs"> Send Email</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send on Whatsapp</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbActivity size={18} /> <span className="text-xs">Add Activity</span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};

export const TaskTable = ({ // Unchanged from previous merge
  columns,
  data,
  loading,
  pagingData,
  selectedTasks,
  onPaginationChange,
  onSelectChange,
  onSort,
  onRowSelect,
  onAllRowSelect,
}: {
  columns: ColumnDef<TaskItem>[];
  data: TaskItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedTasks: TaskItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: TaskItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<TaskItem>[]) => void;
}) => {
  return (
    <DataTable
      selectable
      columns={columns}
      data={data}
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedTasks.some((selected) => selected.id === row.id)
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
  );
};

type TaskSearchProps = { // Unchanged from previous merge
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
export const TaskSearch = React.forwardRef<HTMLInputElement, TaskSearchProps>(
  ({ onInputChange }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        placeholder="Quick Search..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
      />
    );
  }
);
TaskSearch.displayName = "TaskSearch";

export const TaskFilter = ({ // Unchanged from previous merge regarding its internal structure
  filterData,
  setFilterData, // This is handleApplyFilter from the hook
  uniqueAssignees, 
  uniqueStatuses,
}: {
  filterData: FilterFormSchema;
  setFilterData: (data: FilterFormSchema) => void;
  uniqueAssignees: string[];
  uniqueStatuses: TaskStatus[];
}) => {
  const [dialogIsOpen, setIsOpen] = useState(false);
  const openDialog = () => setIsOpen(true);
  const onDialogClose = () => setIsOpen(false);

  const { control, handleSubmit, reset } = useForm<FilterFormSchema>({
    defaultValues: filterData,
    resolver: zodResolver(filterValidationSchema),
  });

  useEffect(() => {
    reset(filterData);
  }, [filterData, reset]);

  const onSubmit = (values: FilterFormSchema) => {
    setFilterData(values); // Calls handleApplyFilter from the hook
    onDialogClose();
  };

  const handleReset = () => {
    const defaultVals = filterValidationSchema.parse({});
    reset(defaultVals);
    setFilterData(defaultVals); 
    onDialogClose();
  };

  const activeFilterCount =
    (filterData.status?.length || 0) + (filterData.assignTo?.length || 0);

  const { DatePickerRange } = DatePicker;

  // The Select options below are still hardcoded as per the original structure.
  // To make them dynamic, they'd need to use `uniqueAssignees` and `uniqueStatuses` props
  // and potentially be wrapped in <Controller> from react-hook-form for full state management.
  return (
    <>
      <Button icon={<TbFilter />} onClick={openDialog} className="relative">
        <span>Filter</span>{" "}
        {activeFilterCount > 0 && (
          <Badge
            content={activeFilterCount}
            className="absolute -top-2 -right-2"
            innerClass="text-xs"
          />
        )}
      </Button>
      <Drawer
        title="Filters"
        isOpen={dialogIsOpen}
        onClose={onDialogClose}
        onRequestClose={onDialogClose}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={handleReset}>
              Clear
            </Button>
            <Button size="sm" variant="solid" onClick={handleSubmit(onSubmit)}>
              Apply
            </Button>
          </div>
        }
      >
        <UiFormItem label="Created By">
          <Select
            placeholder="Select Created by"
            options={[ 
              { label: "Ajay Patel", value: "Ajay Patel" },
              { label: "Rohan Shah", value: "Rohan Shah" },
            ]}
            isMulti
          />
        </UiFormItem>
        <UiFormItem label="Assigned To">
          <Select
            placeholder="Select Assigned To"
            options={[
              { label: "Ajay Patel", value: "Ajay Patel" },
              { label: "Rohan Shah", value: "Rohan Shah" },
            ]}
            isMulti
          />
        </UiFormItem>
        <UiFormItem label="Priority">
          <Select
            placeholder="Select Priority"
            options={[
              { label: "High", value: "High" },
              { label: "Low", value: "Low" },
              { label: "Urgent", value: "Urgent" },
            ]}
            isMulti
          />
        </UiFormItem>
        <UiFormItem label="Status">
          <Select
            placeholder="Select Status"
            options={[
              { label: "Pending", value: "Pending" },
              { label: "Completed", value: "Completed" },
            ]}
            isMulti
          />
        </UiFormItem>
        <UiFormItem label="Created Date">
          <DatePickerRange placeholder="Select Date Range" />
        </UiFormItem>
        <UiFormItem label="Due Date">
          <DatePickerRange placeholder="Select Date Range" />
        </UiFormItem>
      </Drawer>
    </>
  );
};

// TaskTableTools: Added onExport prop and Clear Filters button
export const TaskTableTools = ({
  onSearchChange,
  filterData,
  setFilterData, // This is handleApplyFilter from hook
  uniqueAssignees,
  uniqueStatuses,
  onExport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  filterData: FilterFormSchema;
  setFilterData: (data: FilterFormSchema) => void;
  uniqueAssignees: string[];
  uniqueStatuses: TaskStatus[];
  onExport: () => void;
  onClearFilters: () => void;
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
      <div className="flex-grow">
        <TaskSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
         <Tooltip title="Clear Filters">
            <Button
                icon={<TbReload />}
                onClick={onClearFilters}
                variant="plain" 
                shape="circle"
                size="sm"
            />
        </Tooltip>
        <TaskFilter
          filterData={filterData}
          setFilterData={setFilterData}
          uniqueAssignees={uniqueAssignees}
          uniqueStatuses={uniqueStatuses}
        />
        <Button icon={<TbCloudUpload />} onClick={onExport}>Export</Button>
      </div>
    </div>
  );
};

export const ActiveFiltersDisplay = ({ // Unchanged from previous merge
  filterData,
  onRemoveFilter,
  onClearAll,
}: {
  filterData: FilterFormSchema;
  onRemoveFilter: (key: keyof FilterFormSchema, value: string) => void;
  onClearAll: () => void;
}) => {
  const activeStatuses = filterData.status || [];
  const activeAssignees = filterData.assignTo || [];
  const hasActiveFilters =
    activeStatuses.length > 0 || activeAssignees.length > 0;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {activeStatuses.map((stat) => (
        <Tag
          key={`stat-${stat}`}
          prefix
          className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
        >
          <span className="capitalize">{stat.replace(/_/g, " ")}</span>
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("status", stat)}
          />
        </Tag>
      ))}
      {activeAssignees.map((user) => (
        <Tag
          key={`user-${user}`}
          prefix
          className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
        >
          {user} {/* Assumes assignTo in filterData contains displayable names/strings */}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("assignTo", user)}
          />
        </Tag>
      ))}
      <Button
        size="xs"
        variant="plain"
        className="text-red-600 hover:text-red-500 hover:underline ml-auto"
        onClick={onClearAll}
      >
        Clear All
      </Button>
    </div>
  );
};

export const TaskSelected = ({ // Unchanged from previous merge
  selectedTasks,
  setSelectedTasks,
  onDeleteSelected,
}: {
  selectedTasks: TaskItem[]; 
  setSelectedTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>; 
  onDeleteSelected: () => void;
}) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
  };

  if (selectedTasks.length === 0) return null;

  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedTasks.length}</span>
              <span>Task{selectedTasks.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedTasks.length} Task${selectedTasks.length > 1 ? "s" : ""}`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmButtonColor="red-600"
      >
        <p>
          Are you sure you want to delete the selected task
          {selectedTasks.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

const TaskListActionTools = ({ pageTitle }: { pageTitle: string; }) => { // Unchanged
  const navigate = useNavigate();
  const handleAddNewTask = () => {
    navigate("/task/task-list/create");
  };
  return (
    <Button variant="solid" icon={<TbPlus />} onClick={handleAddNewTask}>
      Add New Task
    </Button>
  );
};


// --- Data Transformation Helper ---
const transformApiTaskToTaskItem = (apiTask: any): TaskItem => {
    let assignToArray: string[] = [];
    // API `assign_to` is a string like "[1,2]" representing user IDs.
    // For display, we need names. This is a placeholder.
    // In a real app, you'd map these IDs to actual user names.
    try {
        const parsedAssignToIds: number[] = JSON.parse(apiTask.assign_to || "[]");
        assignToArray = parsedAssignToIds.map(id => `User ${id}`); // Placeholder name
    } catch (e) {
        console.error("Failed to parse assign_to from API:", apiTask.assign_to, e);
    }

    // API status "Pending" -> "pending", "In Progress" -> "in_progress"
    const statusString = apiTask.status || "pending";
    const transformedStatus = statusString.toLowerCase().replace(/\s+/g, '_') as TaskStatus;

    return {
        id: String(apiTask.id),
        note: apiTask.task_title || "No Title",
        status: transformedStatus,
        assignTo: assignToArray, // Array of placeholder names
        // API `user_id` is the creator's ID. Map to name.
        createdBy: apiTask.user?.name || `User ${apiTask.user_id || 'Unknown'}`, // Prefer user.name if available
        createdDate: apiTask.created_at ? new Date(apiTask.created_at) : new Date(),
        dueDate: apiTask.due_data ? new Date(apiTask.due_data) : null,
        priority: apiTask.priority || undefined,
        category: apiTask.module_name || undefined,
        description: apiTask.note_remark || apiTask.additional_description || undefined,
        comments: apiTask.activity_notes || [],
        attachments: apiTask.attachments || [],
        updated_at: apiTask.updated_at,
        // If API provides user who updated task, map it here
        updated_by_name: apiTask.updated_by_user?.name || undefined, // Example
        _originalData: apiTask, // Keep raw data if needed
    };
};

// --- useTaskListingLogic Hook ---
export const useTaskListingLogic = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    AllTaskData = [], // Assuming API returns array of raw task objects
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]); // Holds transformed TaskItems
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedTasks, setSelectedTasks] = useState<TaskItem[]>([]);
  const [filterData, setFilterData] = useState<FilterFormSchema>(
    filterValidationSchema.parse({})
  );

  // For Export Reason Modal
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
      resolver: zodResolver(exportReasonSchema),
      defaultValues: { reason: '' },
      mode: 'onChange',
  });

  useEffect(() => {
    dispatch(getAllTaskAction());
  }, [dispatch]);

  useEffect(() => {
    setIsLoading(masterLoadingStatus === 'loading');
    if (masterLoadingStatus === 'idle' && AllTaskData) {
        const transformed = AllTaskData.map(transformApiTaskToTaskItem);
        setTasks(transformed);
    } else if (masterLoadingStatus === 'failed') {
        setTasks([]); // Clear tasks on failure or show error
    }
  }, [AllTaskData, masterLoadingStatus]);


  const uniqueAssignees = useMemo(() => {
    const allAssignees = tasks.flatMap(t => Array.isArray(t.assignTo) ? t.assignTo : [t.assignTo].filter(Boolean) as string[]);
    return Array.from(new Set(allAssignees)).sort();
  }, [tasks]);

  const uniqueStatuses = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.status))).sort(),
    [tasks]
  );

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData = cloneDeep(tasks);

    // Apply Filtering
    if (filterData.status && filterData.status.length > 0) {
      const statusSet = new Set(filterData.status);
      processedData = processedData.filter((t) => statusSet.has(t.status));
    }
    if (filterData.assignTo && filterData.assignTo.length > 0) {
      const assignToSet = new Set(filterData.assignTo);
      processedData = processedData.filter((t) => 
        Array.isArray(t.assignTo) 
            ? t.assignTo.some(assignee => assignToSet.has(assignee))
            : assignToSet.has(t.assignTo as string) // Should not happen if transform is correct
      );
    }

    // Apply Search
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      processedData = processedData.filter(
        (t) =>
          t.id.toLowerCase().includes(query) ||
          t.note.toLowerCase().includes(query) ||
          (Array.isArray(t.assignTo) && t.assignTo.some(a => a.toLowerCase().includes(query))) ||
          t.createdBy.toLowerCase().includes(query) ||
          t.status.toLowerCase().includes(query) ||
          (t.category && t.category.toLowerCase().includes(query)) ||
          (t.priority && t.priority.toLowerCase().includes(query))
      );
    }

    // Apply Sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let valA: any = a[key as keyof TaskItem];
        let valB: any = b[key as keyof TaskItem];

        if (key === 'createdDate' || key === 'dueDate') {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
        } else if (typeof valA === 'string') {
            valA = valA.toLowerCase();
        }
         if (typeof valB === 'string') {
            valB = valB.toLowerCase();
        }
        
        if (valA === null || valA === undefined) return order === 'asc' ? 1 : -1;
        if (valB === null || valB === undefined) return order === 'asc' ? -1 : 1;

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    const dataTotal = processedData.length;
    const pageIndexVal = tableData.pageIndex as number;
    const pageSizeVal = tableData.pageSize as number;
    const startIndex = (pageIndexVal - 1) * pageSizeVal;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSizeVal);
    
    return { pageData: dataForPage, total: dataTotal, allFilteredAndSortedData: processedData };
  }, [tasks, tableData, filterData]);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { // Make data partial
    setTableData(prev => ({ ...prev, ...data }));
  }, []);

  const handleApplyFilter = useCallback(
    (newFilterData: FilterFormSchema) => {
      setFilterData(newFilterData);
      handleSetTableData({ pageIndex: 1 });
      setSelectedTasks([]);
    },
    [handleSetTableData] // tableData removed, handleSetTableData is stable
  );
  
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );

  const handleSelectChange = useCallback( // Page size change
    (value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }),
    [handleSetTableData]
  );

  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );

  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );

  const handleRemoveFilter = useCallback(
    (key: keyof FilterFormSchema, value: string) => {
      setFilterData((prev) => {
        const currentValues = prev[key] || [];
        // @ts-ignore
        const newValues = currentValues.filter((item) => item !== value);
        const updatedFilterData = { ...prev, [key]: newValues };
        handleSetTableData({ pageIndex: 1 });
        setSelectedTasks([]);
        return updatedFilterData;
      });
    },
    [handleSetTableData] 
  );

  const handleClearAllFilters = useCallback(() => {
    const defaultFilters = filterValidationSchema.parse({});
    setFilterData(defaultFilters);
    handleSetTableData({ pageIndex: 1, query: '' }); // Also clear search query
    setSelectedTasks([]);
    // Optionally clear search input visually if controlled outside
  }, [handleSetTableData]);
  
  // Row selection handlers are unchanged
  const handleRowSelect = useCallback((checked: boolean, row: TaskItem) => { /* ... */ }, []);
  const handleAllRowSelect = useCallback((checked: boolean, rows: Row<TaskItem>[]) => { /* ... */ }, []);
  
  // CRUD operations (client-side for now, can be changed to dispatch actions)
  const handleEdit = useCallback((task: TaskItem) => navigate(`/task/task-list/edit/${task.id}`), [navigate]);
  const handleClone = useCallback((taskToClone: TaskItem) => { /* ... setTasks ... toast ... */ }, [setTasks]);
  const handleChangeStatus = useCallback((task: TaskItem) => { /* ... setTasks ... toast ... */ }, [setTasks]);
  const handleDelete = useCallback((taskToDelete: TaskItem) => { /* ... setTasks ... setSelectedTasks ... toast ... */ }, [setTasks, setSelectedTasks]);
  const handleDeleteSelected = useCallback(() => { /* ... setTasks ... setSelectedTasks ... toast ... */ }, [selectedTasks, setTasks, setSelectedTasks]);


  // Export related handlers
  const handleOpenExportReasonModal = () => {
      if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
          toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
          return;
      }
      exportReasonFormMethods.reset({ reason: '' });
      setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
      setIsSubmittingExportReason(true);
      const moduleName = 'Tasks'; // Or derive dynamically
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `tasks_export_${timestamp}.csv`;
      try {
          await dispatch(
              submitExportReasonAction({ // Make sure this action exists and is correctly typed
                  reason: data.reason,
                  module: moduleName,
                  file_name: fileName,
              }),
          ).unwrap();
          toast.push(<Notification title="Export Reason Submitted" type="success" />);
          exportTaskToCsv(fileName, allFilteredAndSortedData); // Use the correct export function
          setIsExportReasonModalOpen(false);
      } catch (error: any) {
          toast.push(<Notification title="Failed to Submit Reason" type="danger" message={error.message || 'Unknown error'} />);
      } finally {
          setIsSubmittingExportReason(false);
      }
  };


  const columns: ColumnDef<TaskItem>[] = useMemo(
    () => [
      {
        header: "Created By",
        accessorKey: "createdBy", 
        enableSorting: true,
        size: 140,
        cell: (props) => ( 
          <div className="flex items-center gap-1.5  text-xs">
            <Avatar size={32} shape="circle" icon={<TbUserCircle />} />
            <div className="flex flex-col  gap-0.5 text-xs">
              <span className="font-semibold ">{props.row.original.createdBy}</span>
              {/* <span className="">Admin</span> Role might need to come from user data */}
            </div>
          </div>
        ),
      },
      {
        header: "Task",
        accessorKey: "note",
        enableSorting: true, // Title can be sorted
        size: 250,
        cell: (props) => {
            const task = props.row.original;
            return (
              <div className="flex flex-col gap-0.5 text-[12px]">
                <span className=" items-center whitespace-nowrap text-ellipsis max-w-[240px] overflow-hidden">
                  <b className="font-semibold">Title : </b> {task.note}
                </span>
                <span className="">
                  <b className="font-semibold">Created On : </b> {task.createdDate.toLocaleDateString()}
                </span>
                {task.dueDate && <span className="">
                  <b className="font-semibold">Due Date : </b> {task.dueDate.toLocaleDateString()}
                </span>}
              </div>
            );
        }
      },
      {
        header: "Task Details",
        size: 230,
        cell: (props) => {
            const task = props.row.original;
            return (
              <div className="flex flex-col gap-0.5 text-[12px]">
                {/* <span className=""><b className="font-semibold">Linked to : </b> Wall listings</span> Example, if data exists */}
                {task.category && <span className=""><b className="font-semibold">Category : </b> {task.category}</span>}
                {/* <span className=""><b className="font-semibold">Labels : </b><Tag>Bug</Tag></span> Example, if data exists */}
                {task.priority && <span className=""><b className="font-semibold">Priority : </b><Tag className="text-[10px] bg-blue-100 text-blue-600 ">{task.priority}</Tag></span>}
              </div>
            );
        }
      },
      {
        header: "Assigned To",
        accessorKey: "assignTo", 
        enableSorting: true, 
        size: 120,
        cell: (props) => {
            const task = props.row.original;
            return (
              <div className="flex flex-col gap-1.5">
                {/* Displaying assigned users (placeholder names for now) */}
                {Array.isArray(task.assignTo) && task.assignTo.length > 0 && (
                    <Avatar.Group 
                      chained   
                      maxCount={task.assignTo.length > 3 ? 3 : task.assignTo.length}  
                      omittedAvatarProps={{ shape: 'circle', size: 30 }}
                      omittedAvatarTooltip
                    >
                    {task.assignTo.map(assigneeName => (
                        <Tooltip key={assigneeName} title={assigneeName}>
                            <Avatar size={28} shape="circle">{assigneeName.substring(0,1)}</Avatar>
                        </Tooltip>
                    ))}
                    </Avatar.Group>
                )}
                <span>
                  <Tag className={`${taskStatusColor[task.status] || 'bg-gray-400'} text-white capitalize`}>
                    {task.status.replace(/_/g, " ")}
                  </Tag>
                </span>
              </div>
            );
        }
      },
      {
        header: "Action",
        id: "action",
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => handleEdit(props.row.original)}
            onDelete={() => handleDelete(props.row.original)}
            onChangeStatus={() => handleChangeStatus(props.row.original)}
            onClone={() => handleClone(props.row.original)}
          />
        ),
      },
    ],
    [handleEdit, handleDelete, handleChangeStatus, handleClone] 
  );

  return {
    isLoading,
    tasks, // Full list of (transformed) tasks
    tableData,
    selectedTasks,
    setSelectedTasks,
    filterData,
    setFilterData: handleApplyFilter, // Use the specific handler
    pageData, // Paginated and filtered/sorted data for the table
    total, // Total count after filtering for pagination
    allFilteredAndSortedData, // For export
    columns,
    handlePaginationChange,
    handleSelectChange, // Page size change
    handleSort,
    handleSearchChange,
    handleApplyFilter,
    handleRemoveFilter,
    handleClearAllFilters,
    handleRowSelect,
    handleAllRowSelect,
    handleDeleteSelected,
    uniqueAssignees,
    uniqueStatuses,
    // Export related
    isExportReasonModalOpen,
    setIsExportReasonModalOpen,
    isSubmittingExportReason,
    exportReasonFormMethods,
    handleOpenExportReasonModal,
    handleConfirmExportWithReason,
  };
};

// --- Main TaskList Component ---
const TaskList = () => {
  const pageTitle = "Task List";
  const {
    isLoading,
    tableData,
    selectedTasks,
    setSelectedTasks,
    filterData,
    pageData,
    total,
    allFilteredAndSortedData,
    columns,
    handlePaginationChange,
    handleSelectChange,
    handleSort,
    handleSearchChange,
    handleApplyFilter, 
    handleRemoveFilter,
    handleClearAllFilters,
    handleRowSelect,
    handleAllRowSelect,
    handleDeleteSelected,
    uniqueAssignees,
    uniqueStatuses,
    // Export related
    isExportReasonModalOpen,
    setIsExportReasonModalOpen,
    isSubmittingExportReason,
    exportReasonFormMethods,
    handleOpenExportReasonModal,
    handleConfirmExportWithReason,
  } = useTaskListingLogic();

  return (
    <>
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">{pageTitle}</h5>
          <TaskListActionTools pageTitle={pageTitle} />
        </div>
        <div className="mb-2">
          <TaskTableTools
            onSearchChange={handleSearchChange}
            filterData={filterData}
            setFilterData={handleApplyFilter}
            uniqueAssignees={uniqueAssignees}
            uniqueStatuses={uniqueStatuses}
            onExport={handleOpenExportReasonModal}
            onClearFilters={handleClearAllFilters}
          />
        </div>
        <ActiveFiltersDisplay
          filterData={filterData}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />
        <div className="flex-grow overflow-auto">
          <TaskTable
            columns={columns}
            data={pageData}
            loading={isLoading}
            pagingData={{
              total,
              pageIndex: tableData.pageIndex as number,
              pageSize: tableData.pageSize as number,
            }}
            selectedTasks={selectedTasks}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onAllRowSelect={handleAllRowSelect}
          />
        </div>
      </AdaptiveCard>
      <TaskSelected
        selectedTasks={selectedTasks}
        setSelectedTasks={setSelectedTasks}
        onDeleteSelected={handleDeleteSelected}
      />
    </Container>

    <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info" // Or "default"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? 'Submitting...' : 'Submit & Export'}
        cancelText="Cancel"
        confirmButtonProps={{
            disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason,
        }}
    >
        <UiFormComponents
            id="exportTaskReasonForm" // Ensure this ID is unique if multiple forms on page
            onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
            className="flex flex-col gap-4 mt-2"
        >
            <UiFormItem
                label="Please provide a reason for exporting this data:"
                invalid={!!exportReasonFormMethods.formState.errors.reason}
                errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
            >
                <Controller
                    name="reason"
                    control={exportReasonFormMethods.control}
                    render={({ field }) => (
                        <Input
                            textArea
                            {...field}
                            placeholder="Enter reason..."
                            rows={3}
                        />
                    )}
                />
            </UiFormItem>
        </UiFormComponents>
    </ConfirmDialog>
    </>
  );
};

export default TaskList;