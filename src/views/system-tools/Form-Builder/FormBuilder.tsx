// src/views/your-path/FormBuilder.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
// zodResolver, z are kept for filter form and export reason
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";

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
import DebouceInput from "@/components/shared/DebouceInput"; // Corrected name: DebounceInput
import Select from "@/components/ui/Select";
// Input, Tag, Dialog, Card, Form, FormItem from "@/components/ui" (kept for filters, dialogs)
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Dialog,
  Card,
  Dropdown,
} from "@/components/ui";
import { Controller, useForm } from "react-hook-form"; // Re-add for filter form

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbEye,
  TbSwitchHorizontal,
  TbCopy,
  TbTrash,
  TbReload,
  TbCategory2,
  TbBuildingCommunity,
  TbFileSymlink,
  TbUser,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { Link, useNavigate } from "react-router-dom";

// Redux
import { useAppDispatch } from "@/reduxtool/store"; // Added
import { shallowEqual, useSelector } from "react-redux"; // Added
import {
  // Placeholder: Define these actions in your Redux middleware
  getFormBuilderAction,
  deleteFormBuilderAction,
  deleteAllFormBuildersAction, // Assuming an action for bulk delete
  changeFormBuilderStatusAction, // Assuming an action for status change
  cloneFormBuilderAction, // Assuming an action for cloning
  getDepartmentsAction,
  getCategoriesAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware"; // Adjust path as needed, or create a new form builder middleware
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Placeholder: Define this selector
import { BsThreeDotsVertical } from "react-icons/bs";

// Store (for local simulation - some functions will be replaced by Redux)
// import {
//   getFormsFromStore, // Will be replaced by Redux selector
//   deleteFormFromStore, // Will be replaced by Redux action
//   cloneFormInStore, // Will be replaced by Redux action
//   changeFormStatusInStore, // Will be replaced by Redux action
//   subscribeToStore // May not be needed if all data comes from Redux
// } from './FormBuilderStore'; // Adjust path as needed

// --- Constants for Dropdowns (Remain the same) ---
export const FORM_STATUS_OPTIONS = [
  // Export for use in FormBuilderFormPage
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];
export const formStatusValues = FORM_STATUS_OPTIONS.map((s) => s.value) as [
  string,
  ...string[]
]; // Export

export const DEPARTMENT_OPTIONS = [
  // Export
  { value: "eng", label: "Engineering" },
  { value: "mkt", label: "Marketing" },
  { value: "hr", label: "Human Resources" },
  { value: "sales", label: "Sales" },
];
export const departmentValues = DEPARTMENT_OPTIONS.map((d) => d.value) as [
  string,
  ...string[]
]; // Export

export const CATEGORY_OPTIONS = [
  // Export
  { value: "feedback", label: "Feedback" },
  { value: "survey", label: "Survey" },
  { value: "application", label: "Application" },
  { value: "support", label: "Support Ticket" },
];
export const categoryValues = CATEGORY_OPTIONS.map((c) => c.value) as [
  string,
  ...string[]
]; // Export

export const QUESTION_TYPE_OPTIONS = [
  // Export
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "file", label: "File Upload (URL)" },
  { value: "checkbox", label: "Checkbox (Multiple Choice)" },
  { value: "radio", label: "Radio Buttons (Single Choice)" },
  { value: "select", label: "Dropdown (Single Choice)" },
  { value: "number", label: "Number Input" },
  { value: "date", label: "Date Picker" },
  { value: "time", label: "Time Picker" },
  { value: "daterange", label: "Date Range Picker" },
  { value: "rating", label: "Rating" },
  { value: "multiselect", label: "Multi-Select Dropdown" },
];
export const questionTypeValues = QUESTION_TYPE_OPTIONS.map((q) => q.value) as [
  string,
  ...string[]
]; // Export

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-100",
  published:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  archived: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

// --- Define Types (Remain the same) ---
export type QuestionItem = {
  id?: string;
  questionSectionTitle?: string;
  questionSectionDescription?: string;
  questionText: string;
  questionType: string;
  options?: { label: string; value: string }[];
  isRequired?: boolean;
};

export type FormBuilderItem = {
  id: string | number;
  form_name: string;
  status: string;
  departmentName: string;
  categoryName: string;
  form_title?: string;
  form_description?: string;
  questions: QuestionItem[];
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
};

export type GeneralCategoryListItem = {
  id: string | number;
  name: string;
};

export type DepartmentListingItem = { id: string | number; name: string };

// --- Zod Schemas ---
const filterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterDepartment: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCategory: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Initial Dummy Data (No longer primary source for component if using Redux) ---
// This might be used by FormBuilderStore.ts or for seeding if API is not ready
export const initialDummyForms: FormBuilderItem[] = [
  {
    id: "FORM001",
    form_name: "Employee Feedback Survey Q3",
    status: "published",
    departmentName: "hr",
    categoryName: "survey",
    form_title: "Q3 Employee Feedback",
    // form_description: "A survey to gather feedback from employees for Q3.", // Example addition
    questions: [
      {
        questionSectionTitle: "General Feedback",
        questionText: "Overall satisfaction with Q3?",
        questionType: "radio",
        options: [
          { label: "Good", value: "good" },
          { label: "Bad", value: "bad" },
        ],
        isRequired: true,
      },
    ],
    created_at: new Date(Date.now() - 100000000).toISOString(),
    updated_at: new Date().toISOString(),
    updated_by_name: "Admin User",
    updated_by_role: "Administrator",
  },
  // ... other dummy data
];

// --- CSV Exporter Utility (Remains the same) ---
type FormExportItem = Omit<
  FormBuilderItem,
  "created_at" | "updated_at" | "questions"
> & {
  questionCount: number;
  created_at_formatted?: string;
  updated_at_formatted?: string;
  departmentNameDisplay?: string;
  categoryNameDisplay?: string;
  statusDisplay?: string;
};

const CSV_HEADERS_FORM = [
  "ID",
  "Form Name",
  "Form Title",
  "Status",
  "Department",
  "Category",
  "Question Count",
  "Created At",
  "Updated By",
  "Updated Role",
  "Updated At",
];
const CSV_KEYS_FORM_EXPORT: (keyof FormExportItem | "form_title")[] = [
  "id",
  "form_name",
  "form_title",
  "statusDisplay",
  "departmentNameDisplay",
  "categoryNameDisplay",
  "questionCount",
  "created_at_formatted",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];

function exportFormsToCsvLogic(filename: string, rows: FormBuilderItem[]) {
  if (!rows || !rows.length) {
    return false;
  }
  const preparedRows: FormExportItem[] = rows.map((row) => ({
    ...row,
    form_title: row.form_title || "N/A",
    departmentNameDisplay:
      DEPARTMENT_OPTIONS.find((d) => d.value === row.departmentName)?.label ||
      row.departmentName,
    categoryNameDisplay:
      CATEGORY_OPTIONS.find((c) => c.value === row.categoryName)?.label ||
      row.categoryName,
    statusDisplay:
      FORM_STATUS_OPTIONS.find((s) => s.value === row.status)?.label ||
      row.status,
    questionCount: row.questions.length,
    created_at_formatted: row.created_at
      ? new Date(row.created_at).toLocaleString()
      : "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_FORM.join(separator) +
    "\n" +
    preparedRows
      .map((row) =>
        CSV_KEYS_FORM_EXPORT.map((k) => {
          let cell = row[k as keyof FormExportItem];
          if (cell === null || cell === undefined) cell = "";
          else cell = String(cell).replace(/"/g, '""');
          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
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

// --- ActionColumn ---
const ActionColumn = ({
  item,
  onEdit,
  onViewDetail,
  onChangeStatus,
  onClone,
  onDelete,
}: {
  item: FormBuilderItem;
  onEdit: (id: string | number) => void;
  onViewDetail: (item: FormBuilderItem) => void;
  onChangeStatus: (item: FormBuilderItem) => void;
  onClone: (item: FormBuilderItem) => void;
  onDelete: (item: FormBuilderItem) => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={() => onEdit(item.id)}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Preview">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
          onClick={() => onViewDetail(item)}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item className="flex items-center gap-2"><TbCopy size={18} onClick={() => onClone(item)} /> <span className="text-xs">Clone Form</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbFileSymlink size={18} onClick={() => onClone(item)} /> <span className="text-xs">Publish Link</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbUser size={18} /> <Link to="/task/task-list/create" ><span className="text-xs">Assigned to Task</span></Link></Dropdown.Item>
      </Dropdown>
    </div>
  );
};

// --- Search and TableTools (Remain the same) ---
type FormBuilderSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const FormBuilderSearch = React.forwardRef<
  HTMLInputElement,
  FormBuilderSearchProps
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
FormBuilderSearch.displayName = "FormBuilderSearch";

type FormBuilderTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
};
const FormBuilderTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: FormBuilderTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <FormBuilderSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button
        title="Clear Filters"
        icon={<TbReload />}
        onClick={onClearFilters}
      />
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>
    </div>
  </div>
);

// --- Main FormBuilder Component ---
const FormBuilder = () => {
  const dispatch = useAppDispatch();
  const {
    formsData = [], // Data from Redux store, expected to be FormBuilderItem[]
    status: masterLoadingStatus = "idle", // Loading status from Redux store
    CategoriesData = [],
    departmentsData = [],
  } = useSelector(masterSelector, shallowEqual); // Using placeholder selector

  const generalCategoryOptions = useMemo(() => {
    if (!Array.isArray(CategoriesData)) return [];
    return CategoriesData.map((cat: GeneralCategoryListItem) => ({
      value: String(cat.id),
      label: cat.name,
    }));
  }, [CategoriesData]);
  const departmentOptions = useMemo(
    () =>
      Array.isArray(departmentsData)
        ? departmentsData.map((d: DepartmentListingItem) => ({
            value: String(d.id),
            label: d.name,
          }))
        : [],
    [departmentsData]
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<FormBuilderItem | null>(null);

  const [isProcessing, setIsProcessing] = useState(false); // For specific actions like delete, clone, status change

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FormBuilderItem | null>(
    null
  );
  const navigate = useNavigate();

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<FormBuilderItem[]>([]);

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  useEffect(() => {
    dispatch(getFormBuilderAction()); // Fetch initial data
    dispatch(getCategoriesAction());
    dispatch(getDepartmentsAction());
  }, [dispatch]);

  const handleEdit = (id: string | number) => {
    navigate(`/system-tools/formbuilder-edit/${id}`);
  };

  const openViewDialog = (item: FormBuilderItem) => setViewingItem(item);
  const closeViewDialog = () => setViewingItem(null);

  const handleDeleteClick = (item: FormBuilderItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteFormBuilderAction({ id: itemToDelete.id })).unwrap(); // Redux action
      toast.push(
        <Notification
          title="Form Deleted"
          type="success"
          duration={2000}
        >{`Form "${itemToDelete.form_name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((f) => f.id !== itemToDelete!.id));
      // Optionally, dispatch getFormBuilderAction() again if the slice doesn't auto-update the list
      // dispatch(getFormBuilderAction());
    } catch (e: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {e.message || "Could not delete form."}
        </Notification>
      );
    } finally {
      setIsProcessing(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.push(
        <Notification title="No Selection" type="info">
          Please select forms to delete.
        </Notification>
      );
      return;
    }
    setIsProcessing(true);
    try {
      const idsToDelete = selectedItems.map((item) => item.id);
      await dispatch(
        deleteAllFormBuildersAction({ ids: idsToDelete })
      ).unwrap(); // Redux action
      toast.push(
        <Notification title="Forms Deleted" type="success" duration={2000}>
          {selectedItems.length} form(s) deleted.
        </Notification>
      );
      setSelectedItems([]);
      // Optionally, dispatch getFormBuilderAction()
      // dispatch(getFormBuilderAction());
    } catch (e: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {e.message || "Could not delete selected forms."}
        </Notification>
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeStatus = async (item: FormBuilderItem) => {
    setIsProcessing(true);
    const currentStatusIndex = FORM_STATUS_OPTIONS.findIndex(
      (s) => s.value === item.status
    );
    const nextStatusValue =
      FORM_STATUS_OPTIONS[(currentStatusIndex + 1) % FORM_STATUS_OPTIONS.length]
        .value;
    try {
      await dispatch(
        changeFormBuilderStatusAction({ id: item.id, status: nextStatusValue })
      ).unwrap(); // Redux action
      toast.push(
        <Notification
          title="Status Changed"
          type="success"
          duration={2000}
        >{`Form "${item.form_name}" status changed to ${
          FORM_STATUS_OPTIONS.find((s) => s.value === nextStatusValue)?.label
        }.`}</Notification>
      );
      // Optionally, dispatch getFormBuilderAction()
      // dispatch(getFormBuilderAction());
    } catch (e: any) {
      toast.push(
        <Notification
          title="Status Change Failed"
          type="danger"
          duration={3000}
        >
          {e.message || "Could not change form status."}
        </Notification>
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloneForm = async (itemToClone: FormBuilderItem) => {
    setIsProcessing(true);
    try {
      // The cloneFormBuilderAction should handle creating a new form with copied data
      // It might need a payload like { ...itemToClone, form_name: `${itemToClone.form_name} (Clone)` }
      // or the backend might handle naming.
      const clonedPayload = {
        ...cloneDeep(itemToClone),
        id: undefined, // Or let backend generate new ID
        form_name: `${itemToClone.form_name} (Clone) - ${new Date().getTime()}`, // Ensure unique name
        status: "draft", // Cloned forms usually start as draft
      };
      // Remove fields that should be reset or generated anew by backend for a new entity
      delete clonedPayload.id;
      delete clonedPayload.created_at;
      delete clonedPayload.updated_at;
      delete clonedPayload.updated_by_name;
      delete clonedPayload.updated_by_role;

      await dispatch(cloneFormBuilderAction(clonedPayload)).unwrap(); // Redux action
      toast.push(
        <Notification
          title="Form Cloned"
          type="success"
          duration={2000}
        >{`Form "${itemToClone.form_name}" cloned successfully.`}</Notification>
      );
      // Optionally, dispatch getFormBuilderAction()
      // dispatch(getFormBuilderAction());
    } catch (e: any) {
      toast.push(
        <Notification title="Clone Failed" type="danger" duration={3000}>
          {e.message || "Could not clone form."}
        </Notification>
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    setIsFilterDrawerOpen(false);
  };
  const onClearFilters = () => {
    const defaultFilters = filterFormSchema.parse({});
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
  };

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Form Builder";
    try {
      await dispatch(
        submitExportReasonAction({ reason: data.reason, module: moduleName })
      ).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );
      const success = exportFormsToCsvLogic(
        "forms_export.csv",
        allFilteredAndSortedData
      );
      if (success) {
        toast.push(
          <Notification title="Data Exported" type="success">
            Forms data exported.
          </Notification>
        );
      }
    } catch (error: any) {
      toast.push(
        <Notification
          title="Operation Failed"
          type="danger"
          message={
            error.message || "Could not complete export reason submission."
          }
        />
      );
    } finally {
      setIsExportReasonModalOpen(false);
      setIsSubmittingExportReason(false);
    }
  };

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
      setSelectedItems([]);
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => {
      handleSetTableData({ sort: sort, pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: FormBuilderItem) => {
      setSelectedItems((prev) => {
        if (checked)
          return prev.some((item) => item.id === row.id)
            ? prev
            : [...prev, row];
        return prev.filter((item) => item.id !== row.id);
      });
    },
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<FormBuilderItem>[]) => {
      const currentPageRowOriginals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prevSelected) => {
          const prevSelectedIds = new Set(prevSelected.map((item) => item.id));
          const newRowsToAdd = currentPageRowOriginals.filter(
            (r) => !prevSelectedIds.has(r.id)
          );
          return [...prevSelected, ...newRowsToAdd];
        });
      } else {
        const currentPageRowIds = new Set(
          currentPageRowOriginals.map((r) => r.id)
        );
        setSelectedItems((prevSelected) =>
          prevSelected.filter((item) => !currentPageRowIds.has(item.id))
        );
      }
    },
    []
  );

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: FormBuilderItem[] = cloneDeep(formsData); // formsData now comes from Redux store
    if (filterCriteria.filterStatus?.length) {
      const statusValues = filterCriteria.filterStatus.map((s) => s.value);
      processedData = processedData.filter((item) =>
        statusValues.includes(item.status)
      );
    }
    if (filterCriteria.filterDepartment?.length) {
      const deptValues = filterCriteria.filterDepartment.map((d) => d.value);
      processedData = processedData.filter((item) =>
        deptValues.includes(item.departmentName)
      );
    }
    if (filterCriteria.filterCategory?.length) {
      const catValues = filterCriteria.filterCategory.map((c) => c.value);
      processedData = processedData.filter((item) =>
        catValues.includes(item.categoryName)
      );
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          item.form_name.toLowerCase().includes(query) ||
          (item.form_title?.toLowerCase() || "").includes(query) ||
          (item.form_description?.toLowerCase() || "").includes(query) ||
          item.status.toLowerCase().includes(query) ||
          (
            DEPARTMENT_OPTIONS.find(
              (d) => d.value === item.departmentName
            )?.label.toLowerCase() || ""
          ).includes(query) ||
          (
            CATEGORY_OPTIONS.find(
              (c) => c.value === item.categoryName
            )?.label.toLowerCase() || ""
          ).includes(query) ||
          (item.updated_by_name?.toLowerCase() ?? "").includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    const validSortKeys: (keyof FormBuilderItem | "questionCount")[] = [
      "id",
      "form_name",
      "form_title",
      "status",
      "departmentName",
      "categoryName",
      "created_at",
      "updated_at",
      "updated_by_name",
      "questionCount",
    ];
    if (order && key && validSortKeys.includes(String(key) as any)) {
      processedData.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === "created_at" || key === "updated_at") {
          const dateA = a[key as "created_at" | "updated_at"]
            ? new Date(a[key as "created_at" | "updated_at"]!).getTime()
            : 0;
          const dateB = b[key as "created_at" | "updated_at"]
            ? new Date(b[key as "created_at" | "updated_at"]!).getTime()
            : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        } else if (key === "questionCount") {
          aVal = a.questions.length;
          bVal = b.questions.length;
        } else {
          aVal = a[key as keyof FormBuilderItem] ?? "";
          bVal = b[key as keyof FormBuilderItem] ?? "";
        }
        if (typeof aVal === "number" && typeof bVal === "number")
          return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return {
      pageData: dataForPage,
      total: currentTotal,
      allFilteredAndSortedData: dataToExport,
    };
  }, [formsData, tableData, filterCriteria]);

  const columns: ColumnDef<FormBuilderItem>[] = useMemo(
    () => [
      // {
      //   header: "ID",
      //   accessorKey: "id",
      //   size: 60,
      //   enableSorting: true,
      //   meta: { tdClass: "text-center", thClass: "text-center" },
      // },
      {
        header: "Form Name",
        accessorKey: "form_name",
        size: 260,
        enableSorting: true,
        cell: (props) => (
          <div> 
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {props.row.original.form_name}
            </span><br/> 
            <span>
              {props.row.original.form_title || "-" }
            </span>
          </div> 
          
        ),
      },
      // {
      //   header: "Form Title",
      //   accessorKey: "form_title",
      //   size: 200,
      //   enableSorting: true,
      //   cell: (props) => props.row.original.form_title || "-",
      // },
      {
        header: "Status",
        accessorKey: "status",
        size: 120,
        enableSorting: true,
        cell: (props) => {
          const status = props.row.original.status;
          const label = FORM_STATUS_OPTIONS.find(
            (o) => o.value === status
          )?.label;
          return (
            <Tag className={classNames("capitalize", statusColors[status])}>
              {label || status}
            </Tag>
          );
        },
      },
      {
        header: "Department",
        accessorKey: "departmentName",
        size: 140,
        enableSorting: true,
        cell: (props) =>
          DEPARTMENT_OPTIONS.find(
            (o) => o.value === props.row.original.departmentName
          )?.label || String(props.row.original.departmentName),
      },
      {
        header: "Category",
        accessorKey: "categoryName",
        size: 140,
        enableSorting: true,
        cell: (props) =>
          CATEGORY_OPTIONS.find(
            (o) => o.value === props.row.original.categoryName
          )?.label || String(props.row.original.categoryName),
      },
      {
        header: "Questions",
        id: "questionCount",
        size: 90,
        enableSorting: false,
        meta: { tdClass: "text-center", thClass: "text-center" },
        cell: (props) => {
          const rawSection = props.row.original.section;
          let count = 0;
          try {
            const section = JSON.parse(rawSection);
            Object.values(section).forEach((sec: any) => {
              Object.keys(sec).forEach((k) => {
                if (
                  ![
                    "questionSectionTitle",
                    "questionSectionDescription",
                  ].includes(k)
                ) {
                  count++;
                }
              });
            });
          } catch (err) {
            count = 0;
          }
          return <span>{count}</span>;
        },
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        size: 170,
        enableSorting: true,
        meta: { HeaderClass: "text-red-500" },
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } =
            props.row.original;
          const date = new Date(updated_at);
          const formattedDate = updated_at
            ? `${date.getDate()} ${date.toLocaleString("en-US", {
                month: "short",
              })} ${date.getFullYear()}, ${date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}`
            : "N/A";
          return (
            <div className="text-xs">
              <span>
                {updated_by_name || "N/A"}
                {updated_by_role && (
                  <>
                    <br />
                    <b>{updated_by_role}</b>
                  </>
                )}
              </span>
              <br />
              <span>{formattedDate}</span>
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 180,
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            item={props.row.original}
            onEdit={() => handleEdit(props.row.original.id)}
            onViewDetail={() => openViewDialog(props.row.original)}
            onChangeStatus={() => handleChangeStatus(props.row.original)}
            onClone={() => handleCloneForm(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [
      handleChangeStatus,
      handleCloneForm,
      handleDeleteClick,
      handleEdit,
      openViewDialog,
    ]
  );

  const tableLoading = masterLoadingStatus === "pending" || isProcessing; // isProcessing can be used for optimistic updates or specific button loading

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Form Builder</h5>
            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={() => navigate("/system-tools/formbuilder-create")}
              disabled={tableLoading}
            >
              Add New Form
            </Button>
          </div>
          <FormBuilderTableTools
            onClearFilters={onClearFilters}
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
          />
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={pageData}
              loading={tableLoading} // Use masterLoadingStatus for overall table load
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectable
              checkboxChecked={(row: FormBuilderItem) =>
                selectedItems.some((selected) => selected.id === row.id)
              }
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
        hidden={selectedItems.length === 0}
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span>Form{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteSelected}
              loading={isProcessing && selectedItems.length > 0}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>

      <Dialog
        isOpen={!!viewingItem}
        onClose={closeViewDialog}
        onRequestClose={closeViewDialog}
        width={800}
        contentClassName="pb-0"
      >
        <Dialog.Header title={`Form Details: ${viewingItem?.form_name}`} />
        <Dialog.Body className="p-4 max-h-[70vh] overflow-y-auto">
          {viewingItem && (
            <div className="space-y-4">
              <p>
                <strong>ID:</strong> {viewingItem.id}
              </p>
              <p>
                <strong>Form Name:</strong> {viewingItem.form_name}
              </p>
              <p>
                <strong>Form Title:</strong> {viewingItem.form_title || "N/A"}
              </p>
              <p>
                <strong>Form Description:</strong>{" "}
                {viewingItem.form_description || "N/A"}
              </p>{" "}
              {/* Added form_description */}
              <p>
                <strong>Status:</strong>{" "}
                <Tag
                  className={classNames(
                    "capitalize",
                    statusColors[viewingItem.status]
                  )}
                >
                  {
                    FORM_STATUS_OPTIONS.find(
                      (s) => s.value === viewingItem.status
                    )?.label
                  }
                </Tag>
              </p>
              <p>
                <strong>Department:</strong>{" "}
                {DEPARTMENT_OPTIONS.find(
                  (d) => d.value === viewingItem.departmentName
                )?.label || viewingItem.departmentName}
              </p>
              <p>
                <strong>Category:</strong>{" "}
                {CATEGORY_OPTIONS.find(
                  (c) => c.value === viewingItem.categoryName
                )?.label || viewingItem.categoryName}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {viewingItem.created_at
                  ? new Date(viewingItem.created_at).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                <strong>Updated At:</strong>{" "}
                {viewingItem.updated_at
                  ? new Date(viewingItem.updated_at).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                <strong>Updated By:</strong>{" "}
                {viewingItem.updated_by_name || "N/A"} (
                {viewingItem.updated_by_role || "N/A"})
              </p>
              <h6 className="font-semibold mt-3">
                Questions ({viewingItem.questions.length}):
              </h6>
              {viewingItem.questions.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {viewingItem.questions.map((q, idx) => (
                    <li key={q.id || idx}>
                      {q.questionSectionTitle && (
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Section: {q.questionSectionTitle}
                        </p>
                      )}
                      {q.questionSectionDescription && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Desc: {q.questionSectionDescription}
                        </p>
                      )}
                      <p>
                        {q.questionText}{" "}
                        <Tag className="ml-2 text-xs">
                          {QUESTION_TYPE_OPTIONS.find(
                            (qt) => qt.value === q.questionType
                          )?.label || q.questionType}
                        </Tag>
                      </p>
                      {q.isRequired && (
                        <span className="text-red-500 text-xs ml-1">
                          (Required)
                        </span>
                      )}
                      {q.options && q.options.length > 0 && (
                        <ul className="list-circle pl-5 text-xs">
                          {q.options.map((opt) => (
                            <li key={opt.value}>{opt.label}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No questions defined.</p>
              )}
            </div>
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="solid" onClick={closeViewDialog}>
            Close
          </Button>
        </Dialog.Footer>
      </Dialog>

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onRequestClose={() => setIsFilterDrawerOpen(false)}
        footer={
          <div className="text-right w-full flex justify-end gap-2">
            <Button size="sm" onClick={onClearFilters} type="button">
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterFormBuilderForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterFormBuilderForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Status"
                  options={FORM_STATUS_OPTIONS}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Department">
            <Controller
              name="department_id"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Department"
                  options={departmentOptions}
                  value={departmentOptions.find((o) => o.value === field.value)}
                  onChange={(opt) => field.onChange(opt?.value)}
                  isClearable
                  prefix={<TbBuildingCommunity />}
                />
              )}
            />
          </FormItem>
          <FormItem label="Category">
            <Controller
              name="category_id"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select Category"
                  options={generalCategoryOptions}
                  value={
                    generalCategoryOptions.find(
                      (o) => o.value === field.value
                    ) || null
                  }
                  onChange={(opt) => field.onChange(opt?.value)}
                  prefix={<TbCategory2 className="text-lg" />}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Form"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isProcessing && !!itemToDelete}
        confirmButtonColor="red-600"
      >
        <p>
          Are you sure you want to delete the form "
          <strong>{itemToDelete?.form_name}</strong>"? This action cannot be
          undone.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(
          handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <Form
          id="exportFormsReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={
              exportReasonFormMethods.formState.errors.reason?.message
            }
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
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default FormBuilder;
