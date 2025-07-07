import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Card, Drawer, Form, FormItem, Input, Tag, Checkbox, Dropdown, Avatar, Dialog } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbReload,
  TbUsers,
  TbPresentation,
  TbPresentationAnalytics,
  TbPresentationOff,
  TbUserX,
  TbUser,
  TbTrash,
  TbColumns,
  TbX,
  TbUserCircle,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
  getDesignationsAction,
  addDesignationAction,
  editDesignationAction,
  deleteDesignationAction,
  deleteAllDesignationsAction,
  getEmployeesAction,
  getDepartmentsAction,
  submitExportReasonAction,
  getReportingTo,
} from "@/reduxtool/master/middleware";
import { useSelector, shallowEqual } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import classNames from "classnames";
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";

// --- Define Types ---
export type DesignationItem = {
  id: string | number;
  name: string;
  department: { id: number; name: string }[];
  reporting_manager: { id: number; name: string } | null;
  total_employees?: number;
  status?: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
  updated_by_user?: {
    name: string;
    profile_pic_path?: string;
    roles: { display_name: string }[];
  } | null;
};
export type GeneralListItem = { id: string | number; name: string };
export type SelectOption = { value: string; label: string };

const STATUS_OPTIONS: SelectOption[] = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

const statusColors: Record<string, string> = {
  Active:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

// --- Zod Schema for Add/Edit Designation Form ---
const designationFormSchema = z.object({
  name: z
    .string()
    .min(1, "Designation name is required.")
    .max(150, "Designation name cannot exceed 150 characters."),
  department_id: z.array(z.string()).min(1, "At least one department is required."),
  reporting_manager: z.string().min(1, "Reporting person is required."),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required.",
  }),
});
type DesignationFormData = z.infer<typeof designationFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_DES = [
  "ID",
  "Designation Name",
  "Department",
  "Reporting To",
  "Status",
  "Total Employees",
  "Date Created",
  "Last Updated By",
  "Last Updated At",
];
type DesignationExportItem = Omit<
  DesignationItem,
  "created_at" | "updated_at" | 'department'
> & {
  department: string;
  created_at_formatted?: string;
  updated_at_formatted?: string;
  updated_by_name?: string;
};
const CSV_KEYS_DES: (keyof DesignationExportItem)[] = [
  "id",
  "name",
  "department",
  "reporting_manager",
  "status",
  "total_employees",
  "created_at_formatted",
  "updated_by_name",
  "updated_at_formatted",
];

function exportDesignationsToCsv(filename: string, rows: DesignationItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const preparedRows: DesignationExportItem[] = rows.map((row) => ({
    ...row,
    department: row.department.map(d => d.name).join(', '),
    reporting_manager: row.reporting_manager?.name || "N/A",
    created_at_formatted: row.created_at
      ? new Date(row.created_at).toLocaleString()
      : "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
    updated_by_name: row.updated_by_user?.name || "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_DES.join(separator) +
    "\n" +
    preparedRows
      .map((row) =>
        CSV_KEYS_DES.map((k) => {
          let cell: any = row[k as keyof DesignationExportItem];
          if (cell === null || cell === undefined) cell = "";
          else {
              let strCell = String(cell);
              if (strCell.includes(separator) || strCell.includes('"') || strCell.includes('\n')) {
                strCell = `"${strCell.replace(/"/g, '""')}"`;
              }
              cell = strCell;
          }
          return cell;
        }).join(separator)
      )
      .join("\n");
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

// --- ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip title="Edit">
        <div
          className={`text-xl p-1.5 cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Delete">
        <div
          className={`text-xl p-1.5 cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  );
};

const DesignationsSearch = React.forwardRef<
  HTMLInputElement,
  { onInputChange: (value: string) => void }
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
DesignationsSearch.displayName = "DesignationsSearch";


const DesignationsTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<DesignationItem>[];
  filteredColumns: ColumnDef<DesignationItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<DesignationItem>[]>>;
  activeFilterCount: number;
}) => {
    const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
    const toggleColumn = (checked: boolean, colId: string) => {
      if (checked) {
          const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId);
          if (originalColumn) {
              setFilteredColumns(prev => {
                  const newCols = [...prev, originalColumn];
                  newCols.sort((a, b) => {
                      const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey));
                      const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey));
                      return indexA - indexB;
                  });
                  return newCols;
              });
          }
      } else {
          setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId));
      }
    };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow">
                <DesignationsSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2">
                        <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {columns.map((col) => {
                            const id = col.id || col.accessorKey as string;
                            return col.header && (
                                <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2">
                                    <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>
                                        {col.header as string}
                                    </Checkbox>
                                </div>
                            );
                        })}
                    </div>
                </Dropdown>
                <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload" />
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">
                    Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
                </Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
    const { filterNames, filterStatuses } = filterData;
    if (!filterNames?.length && !filterStatuses?.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {filterNames?.map(item => <Tag key={`name-${item.value}`} prefix>Name: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterNames', item.value)} /></Tag>)}
            {filterStatuses?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatuses', item.value)} /></Tag>)}
            <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
        </div>
    );
};

const DesignationsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  disabled,
}: {
  selectedItems: DesignationItem[];
  onDeleteSelected: () => void;
  disabled?: boolean;
}) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
  };
  if (selectedItems.length === 0) return null;
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
              <span className="heading-text">{selectedItems.length}</span>
              <span>
                Designation{selectedItems.length > 1 ? "s" : ""} selected
              </span>
            </span>
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-600 hover:text-red-500"
            onClick={handleDeleteClick}
            disabled={disabled}
          >
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Designation${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={disabled}
      >
        <p>
          Are you sure you want to delete the selected designation
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

const DesignationListing = () => {
  const dispatch = useAppDispatch();
  const {
    designationsData: rawDesignationsData = {},
    reportingTo = [],
    Employees = [],
    departmentsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DesignationItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DesignationItem | null>(
    null
  );
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<DesignationItem[]>([]);
  
  // --- MODIFIED: Standardized image viewer state and handlers ---
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewerImageSrc, setViewerImageSrc] = useState<string | null>(null);
  
  const openImageViewer = useCallback((src?: string) => {
    if (src) {
        setViewerImageSrc(src);
        setIsImageViewerOpen(true);
    }
  }, []);

  const closeImageViewer = useCallback(() => {
      setIsImageViewerOpen(false);
      setViewerImageSrc(null);
  }, []);
  // --- END MODIFICATION ---

  useEffect(() => {
    dispatch(getDesignationsAction());
    dispatch(getEmployeesAction());
    dispatch(getDepartmentsAction());
  }, [dispatch]);

  const departmentOptions: SelectOption[] = useMemo(
    () =>
      Array.isArray(departmentsData?.data)
        ? departmentsData?.data.map((dep: GeneralListItem) => ({
            value: String(dep.id),
            label: dep.name,
          }))
        : [],
    [departmentsData?.data]
  );

  const designationsData = useMemo(() => {
    const data = rawDesignationsData?.data;
    if (!Array.isArray(data)) return [];

    const departmentMap = new Map(departmentOptions.map(opt => [opt.value, opt.label]));
    
    return data.map((item: any): DesignationItem => {
        let departments: { id: number; name: string }[] = [];
        if (typeof item.department_id === 'string') {
            try {
                const parsedIds: string[] = JSON.parse(item.department_id);
                if (Array.isArray(parsedIds)) {
                    departments = parsedIds.map(id => ({
                        id: Number(id),
                        name: departmentMap.get(id) || 'Unknown Department'
                    })).filter(d => d.name !== 'Unknown Department');
                }
            } catch (e) {
                console.error("Failed to parse department_id:", item.department_id, e);
            }
        } else if (Array.isArray(item.department)) {
             departments = item.department;
        }

        const reportingManager = item.reporting_manager_user 
          ? { id: item.reporting_manager_user.id, name: item.reporting_manager_user.name }
          : null;

        return {
            ...item,
            department: departments,
            reporting_manager: reportingManager,
        };
    });
  }, [rawDesignationsData?.data, departmentOptions]);

  const employeeOptions: SelectOption[] = useMemo(
    () =>
      Array.isArray(Employees)
        ? Employees?.map((emp: GeneralListItem) => ({
            value: String(emp.id),
            label: emp.name,
          }))
        : [],
    [Employees]
  );

  const formMethods = useForm<DesignationFormData>({
    resolver: zodResolver(designationFormSchema),
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  const watchedDepartmentId = formMethods.watch("department_id");
  useEffect(() => {
    if (watchedDepartmentId && watchedDepartmentId.length > 0) {
      dispatch(getReportingTo(watchedDepartmentId[watchedDepartmentId.length - 1]));
    }
  }, [watchedDepartmentId, dispatch]);

  const openAddDrawer = useCallback(() => {
    formMethods.reset({
      name: "",
      department_id: [],
      reporting_manager: undefined,
      status: "Active",
    });
    setIsAddDrawerOpen(true);
  }, [formMethods]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: DesignationItem) => {
      setEditingItem(item);
      const departmentIds = item.department.map(d => String(d.id));
      
      formMethods.reset({
        name: item.name,
        department_id: departmentIds,
        reporting_manager: String(item.reporting_manager?.id || ""),
        status: item.status || "Active",
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);

  const onSubmitHandler = useCallback(
    async (data: DesignationFormData) => {
      setIsSubmitting(true);
      try {
        if (editingItem) {
          await dispatch(
            editDesignationAction({ id: editingItem.id, ...data })
          ).unwrap();
          toast.push(<Notification title="Designation Updated" type="success" />);
          closeEditDrawer();
        } else {
          await dispatch(addDesignationAction(data)).unwrap();
          toast.push(<Notification title="Designation Added" type="success" />);
          closeAddDrawer();
        }
        dispatch(getDesignationsAction());
      } catch (error: any) {
        toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger" >{error?.message || "An error occurred."}</Notification>);
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatch, editingItem, closeAddDrawer, closeEditDrawer]
  );

  const handleDeleteClick = useCallback((item: DesignationItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteDesignationAction({ id: itemToDelete.id })).unwrap();
      toast.push(<Notification title="Designation Deleted" type="success" >{`Designation "${itemToDelete.name}" deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((item) => item.id !== itemToDelete!.id));
      dispatch(getDesignationsAction());
    } catch (error: any) {
      toast.push(<Notification title="Delete Failed" type="danger">{error?.message || "Could not delete designation."}</Notification>);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
    try {
      await dispatch(deleteAllDesignationsAction({ ids: idsToDelete.join(",") })).unwrap();
      toast.push(<Notification title="Deletion Successful" type="success">{`${idsToDelete.length} designation(s) deleted.`}</Notification>);
      setSelectedItems([]);
      dispatch(getDesignationsAction());
    } catch (error: any) {
      toast.push(<Notification title="Deletion Failed" type="danger">{error?.message || "Failed to delete selected designations."}</Notification>);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );

  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria(data);
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [closeFilterDrawer, handleSetTableData]
  );
  const onClearFilters = useCallback(() => {
    filterFormMethods.reset({});
    setFilterCriteria({});
    handleSetTableData({ pageIndex: 1, query: "" });
    dispatch(getDesignationsAction());
    setIsFilterDrawerOpen(false);
  }, [filterFormMethods, dispatch, handleSetTableData]);

  const handleCardClick = useCallback((status: 'Active' | 'Inactive' | 'all') => {
      onClearFilters();
      if(status !== 'all') {
          const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
          if(statusOption) {
            setFilterCriteria({ ...filterCriteria, filterStatuses: [statusOption] });
          }
      }
  }, [onClearFilters, filterCriteria]);

  const handleRemoveFilter = useCallback((key: keyof FilterFormData, value: string) => {
    setFilterCriteria(prev => {
        const newFilters = { ...prev };
        const currentValues = prev[key] as { value: string; label: string }[] | undefined;
        if (currentValues) {
            const newValues = currentValues.filter(item => item.value !== value);
            (newFilters as any)[key] = newValues.length > 0 ? newValues : undefined;
        }
        return newFilters;
    });
    setTableData(prev => ({ ...prev, pageIndex: 1 }));
  }, []);

  const designationNameOptions = useMemo(
    () =>
      Array.from(new Set(designationsData.map((item) => item.name))).map(
        (name) => ({ value: name, label: name })
      ),
    [designationsData]
  );

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: DesignationItem[] = cloneDeep(designationsData);
    if (filterCriteria.filterNames?.length) {
      const selectedNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        selectedNames.includes(item.name.toLowerCase())
      );
    }
     if (filterCriteria.filterStatuses?.length) {
      const selectedStatuses = filterCriteria.filterStatuses.map(opt => opt.value);
      processedData = processedData.filter(item => item.status && selectedStatuses.includes(item.status));
    }
    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.department.some(d => d.name.toLowerCase().includes(query)) ||
          (item.reporting_manager?.name.toLowerCase().includes(query)) ||
          (item.updated_by_user?.name.toLowerCase().includes(query))
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any = a[key as keyof DesignationItem];
        let bVal: any = b[key as keyof DesignationItem];
        if (key === "created_at" || key === "updated_at") {
          const dateA = aVal ? new Date(aVal).getTime() : 0;
          const dateB = bVal ? new Date(bVal).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (typeof aVal === "number" && typeof bVal === "number")
          return order === "asc" ? aVal - bVal : bVal - aVal;
        if (key === 'reporting_manager') {
            aVal = a.reporting_manager?.name || '';
            bVal = b.reporting_manager?.name || '';
        }
        return order === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    return {
      pageData: processedData.slice(
        (tableData.pageIndex - 1) * tableData.pageSize,
        tableData.pageIndex * tableData.pageSize
      ),
      total: processedData.length,
      allFilteredAndSortedData: processedData,
    };
  }, [designationsData, tableData, filterCriteria]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filterCriteria).filter(value => Array.isArray(value) && value.length > 0).length;
  }, [filterCriteria]);


  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Designations";
    const date = new Date().toISOString().split("T")[0];
    const fileName = `designations_${date}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap();
      const success = exportDesignationsToCsv(fileName, allFilteredAndSortedData);
      if (success) {
        toast.push(<Notification title="Data Exported" type="success">Designations exported successfully.</Notification>);
      }
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Operation Failed" type="danger">{error?.message || "Could not complete export."}</Notification>);
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: DesignationItem) => setSelectedItems((prev) => checked ? [...prev, row] : prev.filter((item) => item.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<DesignationItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<DesignationItem>[] = useMemo(
    () => [
      { header: "Designation", accessorKey: "name", enableSorting: true },
      {
        header: "Department",
        accessorKey: "department",
        enableSorting: false, 
        cell: (props) => {
          const depts = props.getValue() as DesignationItem['department'];
          if (Array.isArray(depts) && depts.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {depts.map(d => <Tag key={d.id} className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200">{d.name}</Tag>)}
              </div>
            )
          }
          return "N/A";
        },
      },
      {
        header: "Reporting to",
        accessorKey: "reporting_manager",
        enableSorting: true,
        cell: (props) => props.row.original.reporting_manager?.name || "N/A",
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 100,
        cell: (props) => (<Tag className={classNames("capitalize", statusColors[props.getValue<string>()])}>{props.getValue<string>() || "N/A"}</Tag>),
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        size: 220,
        cell: (props) => {
            const { updated_at, updated_by_user } = props.row.original;
            const formattedDate = updated_at ? formatCustomDateTime(updated_at) : "N/A";
            
            return (
                <div className="flex items-center gap-2">
                    <Avatar 
                        src={updated_by_user?.profile_pic_path} 
                        shape="circle" 
                        size="sm" 
                        icon={<TbUserCircle />} 
                        className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                        // --- MODIFIED: Call correct handler ---
                        onClick={() => openImageViewer(updated_by_user?.profile_pic_path)}
                    />
                    <div>
                        <span className='font-semibold'>{updated_by_user?.name || 'N/A'}</span>
                        <div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div>
                        <div className="text-xs text-gray-500">{formattedDate}</div>
                    </div>
                </div>
            );
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 120,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />),
      },
    ],
    [openEditDrawer, handleDeleteClick, openImageViewer]
  );

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<DesignationItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <>
      <FormItem label={<div>Designation Name<span className="text-red-500"> *</span></div>} invalid={!!currentFormMethods.formState.errors.name} errorMessage={currentFormMethods.formState.errors.name?.message}>
        <Controller name="name" control={currentFormMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter Designation Name" />)} />
      </FormItem>
      <FormItem label={<div>Department<span className="text-red-500"> *</span></div>} invalid={!!currentFormMethods.formState.errors.department_id} errorMessage={currentFormMethods.formState.errors.department_id?.message}>
        <Controller name="department_id" control={currentFormMethods.control} render={({ field }) => (
          <Select
            ref={field.ref}
            isMulti
            placeholder="Select Department(s)"
            options={departmentOptions}
            value={departmentOptions.filter((o) => Array.isArray(field.value) && field.value.includes(o.value))}
            onChange={(options) => field.onChange(options ? options.map(o => o.value) : [])}
            onBlur={field.onBlur}
          />
        )} />
      </FormItem>
      <FormItem label={<div>Reporting To<span className="text-red-500"> *</span></div>} invalid={!!currentFormMethods.formState.errors.reporting_manager} errorMessage={currentFormMethods.formState.errors.reporting_manager?.message}>
        <Controller name="reporting_manager" control={currentFormMethods.control} render={({ field }) => (
            <Select
                ref={field.ref}
                placeholder="Select Reporting Person"
                options={employeeOptions}
                value={employeeOptions.find((o) => o.value === field.value) || null}
                onChange={(opt) => field.onChange(opt?.value)}
                onBlur={field.onBlur}
            />
        )} />
      </FormItem>
      <FormItem label={<div>Status<span className="text-red-500"> *</span></div>} invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message}>
        <Controller name="status" control={currentFormMethods.control} render={({ field }) => (
            <Select
                ref={field.ref}
                placeholder="Select Status"
                options={STATUS_OPTIONS}
                value={STATUS_OPTIONS.find((o) => o.value === field.value) || null}
                onChange={(opt) => field.onChange(opt?.value)}
                onBlur={field.onBlur}
            />
        )} />
      </FormItem>
    </>
  );

  const tableIsLoading = masterLoadingStatus === "loading" || isSubmitting || isDeleting;
  const counts = rawDesignationsData?.counts || {};
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Designations</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableIsLoading}>Add New</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
            <Tooltip title="Click to show all designations"><div onClick={() => handleCardClick('all')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbPresentation size={24} /></div><div><h6 className="text-blue-500">{counts.total ?? "..."}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show active designations"><div onClick={() => handleCardClick('Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbPresentationAnalytics size={24} /></div><div><h6 className="text-violet-500">{counts.active ?? "..."}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show inactive designations"><div onClick={() => handleCardClick('Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-pink-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbPresentationOff size={24} /></div><div><h6 className="text-pink-500">{counts.inactive ?? "..."}</h6><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
            <Card bodyClass={cardBodyClass} className="rounded-md border border-orange-200 cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbUsers size={24} /></div><div><h6 className="text-orange-500">{counts.total_employees ?? "..."}</h6><span className="font-semibold text-xs">Total Emp.</span></div></Card>
            <Card bodyClass={cardBodyClass} className="rounded-md border border-green-200 cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUser size={24} /></div><div><h6 className="text-green-500">{counts.active_employees ?? "..."}</h6><span className="font-semibold text-xs">Active Emp.</span></div></Card>
            <Card bodyClass={cardBodyClass} className="rounded-md border border-red-200 cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbUserX size={24} /></div><div><h6 className="text-red-500">{counts.inactive_employees ?? "..."}</h6><span className="font-semibold text-xs">Inactive Emp.</span></div></Card>
          </div>
          <div className="mb-4">
            <DesignationsTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onClearFilters={onClearFilters} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4 flex-grow overflow-auto">
            <DataTable columns={filteredColumns} data={pageData} loading={tableIsLoading} pagingData={{ total, pageIndex: tableData.pageIndex, pageSize: tableData.pageSize }} selectable checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} noData={!tableIsLoading && pageData.length === 0} />
          </div>
        </AdaptiveCard>
      </Container>
      <DesignationsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} disabled={tableIsLoading} />
      
      {/* --- MODIFIED: Replaced frameless dialog with a proper one --- */}
      <Dialog
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        onRequestClose={closeImageViewer}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        width={600}
        bodyOpenClassName="overflow-hidden"
      >
          <div className="flex justify-center items-center p-4">
              {viewerImageSrc ? (
                  <img
                      src={viewerImageSrc}
                      alt="Profile View"
                      style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                  />
              ) : (
                  <p>No image to display.</p>
              )}
          </div>
      </Dialog>
      {/* --- END MODIFICATION --- */}
      
      <Drawer title="Add Designation" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="designationForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Adding..." : "Save"}</Button></div>}>
        <Form id="designationForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-y-6">{renderDrawerForm(formMethods)}</Form>
      </Drawer>
      <Drawer title="Edit Designation" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} width={480} onRequestClose={closeEditDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="editDesignationForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting || !formMethods.formState.isDirty}>{isSubmitting ? "Saving..." : "Save"}</Button></div>}>
        <Form id="editDesignationForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-y-6 relative pb-28">{renderDrawerForm(formMethods)}
          {editingItem && (<div className="absolute bottom-0 w-full"><div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3"><div><b className="font-semibold text-primary">Latest Update:</b><br /><p className="text-sm font-semibold">{editingItem.updated_by_user?.name || "N/A"}</p><p>{editingItem.updated_by_user?.roles?.[0]?.display_name || "N/A"}</p></div><div className="text-right"><br /><span className="font-semibold">Created At:</span> <span>{editingItem.created_at ? formatCustomDateTime(editingItem.created_at) : "N/A"}</span><br /><span className="font-semibold">Updated At:</span> <span>{editingItem.updated_at ? formatCustomDateTime(editingItem.updated_at) : "N/A"}</span></div></div></div>)}
        </Form>
      </Drawer>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterDesignationForm" type="submit">Apply</Button></div>}>
        <Form id="filterDesignationForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-y-6"><FormItem label="Designation Name"><Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select names..." options={designationNameOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem><FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select status..." options={STATUS_OPTIONS} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem></Form>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Designation" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null) }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null) }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null) }} onConfirm={onConfirmSingleDelete} loading={isDeleting}><p>Are you sure you want to delete the designation "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p></ConfirmDialog>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Exporting Designations" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}><Form id="exportDesignationsReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)() }} className="flex flex-col gap-4 mt-2"><FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form></ConfirmDialog>
    </>
  );
};

export default DesignationListing;