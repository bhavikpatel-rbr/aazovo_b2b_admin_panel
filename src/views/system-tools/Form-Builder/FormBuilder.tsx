// src/views/your-path/FormBuilder.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
// import Textarea from "@/views/ui-components/forms/Input/Textarea"; // Replaced by Input textArea prop
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Dialog,
  Card,
} from "@/components/ui";

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbEye,
  TbFileDescription,
  TbListDetails,
  TbSwitchHorizontal,
  TbCopy,
  // TbShare, // Commented out
  TbTrash,
  TbX,
  TbReload,
  TbSettingsCog, // For consistency
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useNavigate } from "react-router-dom";

// Redux (Optional - Assuming submitExportReasonAction is available like in DomainManagement)
// import { useAppDispatch } from '@/reduxtool/store';
// import { submitExportReasonAction } from '@/reduxtool/master/middleware'; // Or your form builder specific middleware

// --- Constants for Dropdowns ---
const FORM_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];
const formStatusValues = FORM_STATUS_OPTIONS.map((s) => s.value) as [string,...string[]];

const DEPARTMENT_OPTIONS = [
  { value: "eng", label: "Engineering" },
  { value: "mkt", label: "Marketing" },
  { value: "hr", label: "Human Resources" },
  { value: "sales", label: "Sales" },
];
const departmentValues = DEPARTMENT_OPTIONS.map((d) => d.value) as [string,...string[]];

const CATEGORY_OPTIONS = [
  { value: "feedback", label: "Feedback" },
  { value: "survey", label: "Survey" },
  { value: "application", label: "Application" },
  { value: "support", label: "Support Ticket" },
];
const categoryValues = CATEGORY_OPTIONS.map((c) => c.value) as [string,...string[]];

const QUESTION_TYPE_OPTIONS = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "file", label: "File Upload (URL)" },
  { value: "checkbox", label: "Checkbox (Multiple Choice)" },
  { value: "radio", label: "Radio Buttons (Single Choice)" },
  { value: "select", label: "Dropdown (Single Choice)" },
];
const questionTypeValues = QUESTION_TYPE_OPTIONS.map((q) => q.value) as [string,...string[]];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-100",
  published: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  archived: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

// --- Define Types ---
export type QuestionItem = {
  id?: string;
  questionSectionTitle?: string;
  questionText: string;
  questionType: string;
};

export type FormBuilderItem = {
  id: string | number;
  formName: string;
  status: string;
  departmentName: string;
  categoryName: string;
  questions: QuestionItem[];
  created_at?: string; // Changed from createdDate
  updated_at?: string; // Changed from updatedDate
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Zod Schemas ---
const questionSchema = z.object({
  id: z.string().optional(),
  questionSectionTitle: z.string().max(150, "Section title too long").optional().or(z.literal("")),
  questionText: z.string().min(1, "Question text is required.").max(500, "Question text too long"),
  questionType: z.enum(questionTypeValues, { errorMap: () => ({ message: "Select a question type." }) }),
});

const formBuilderFormSchema = z.object({
  formName: z.string().min(1, "Form name is required.").max(150, "Form name too long"),
  status: z.enum(formStatusValues, { errorMap: () => ({ message: "Please select a status." }) }),
  departmentName: z.enum(departmentValues, { errorMap: () => ({ message: "Please select a department." }) }),
  categoryName: z.enum(categoryValues, { errorMap: () => ({ message: "Please select a category." }) }),
  questions: z.array(questionSchema).min(1, "At least one question section is required."),
});
type FormBuilderFormData = z.infer<typeof formBuilderFormSchema>;

const filterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDepartment: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCategory: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form (Same as DomainManagement) ---
const exportReasonSchema = z.object({
  reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- Initial Dummy Data (Updated) ---
const initialDummyForms: FormBuilderItem[] = [
  {
    id: "FORM001",
    formName: "Employee Feedback Survey Q3",
    status: "published",
    departmentName: "hr",
    categoryName: "survey",
    questions: [{ questionSectionTitle: "General Feedback", questionText: "Overall satisfaction with Q3?", questionType: "radio" }],
    created_at: new Date(Date.now() - 100000000).toISOString(),
    updated_at: new Date().toISOString(),
    updated_by_name: "Admin User",
    updated_by_role: "Administrator",
  },
  {
    id: "FORM002",
    formName: "New Feature Request Form",
    status: "draft",
    departmentName: "eng",
    categoryName: "feedback",
    questions: [{ questionText: "Please describe the new feature you would like to see.", questionType: "textarea" }],
    created_at: new Date(Date.now() - 50000000).toISOString(),
    updated_at: new Date(Date.now() - 20000000).toISOString(),
    updated_by_name: "Dev Team Lead",
    updated_by_role: "Manager",
  },
  {
    id: "FORM003",
    formName: "Job Application - Senior Frontend Developer",
    status: "published",
    departmentName: "eng",
    categoryName: "application",
    questions: [{ questionText: "Upload Your Resume/CV", questionType: "file" }, { questionText: "Years of experience with React?", questionType: "text" }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updated_by_name: "HR Manager",
    updated_by_role: "HR",
  },
];

// --- CSV Exporter Utility (Updated) ---
type FormExportItem = Omit<FormBuilderItem, 'created_at' | 'updated_at' | 'questions'> & {
    questionCount: number;
    created_at_formatted?: string;
    updated_at_formatted?: string;
    departmentNameDisplay?: string;
    categoryNameDisplay?: string;
    statusDisplay?: string;
};

const CSV_HEADERS_FORM = ["ID", "Form Name", "Status", "Department", "Category", "Question Count", "Created At", "Updated By", "Updated Role", "Updated At"];
const CSV_KEYS_FORM_EXPORT: (keyof FormExportItem)[] = [
  "id", "formName", "statusDisplay", "departmentNameDisplay", "categoryNameDisplay", "questionCount", "created_at_formatted", "updated_by_name", "updated_by_role", "updated_at_formatted",
];

function exportFormsToCsvLogic(filename: string, rows: FormBuilderItem[]) {
  if (!rows || !rows.length) { return false; }
  const preparedRows: FormExportItem[] = rows.map((row) => ({
    ...row,
    departmentNameDisplay: DEPARTMENT_OPTIONS.find((d) => d.value === row.departmentName)?.label || row.departmentName,
    categoryNameDisplay: CATEGORY_OPTIONS.find((c) => c.value === row.categoryName)?.label || row.categoryName,
    statusDisplay: FORM_STATUS_OPTIONS.find((s) => s.value === row.status)?.label || row.status,
    questionCount: row.questions.length,
    created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString() : "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
  }));

  const separator = ",";
  const csvContent = CSV_HEADERS_FORM.join(separator) + "\n" + preparedRows.map((row) => CSV_KEYS_FORM_EXPORT.map((k) => { let cell = row[k as keyof FormExportItem]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- ActionColumn ---
const ActionColumn = ({ item, onEdit, onViewDetail, onChangeStatus, onClone, onDelete,}: { item: FormBuilderItem; onEdit: (formId: string | number) => void; onViewDetail: (item: FormBuilderItem) => void; onChangeStatus: (item: FormBuilderItem) => void; onClone: (item: FormBuilderItem) => void; onDelete: (item: FormBuilderItem) => void; }) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={() => onEdit(item.id)}><TbPencil /></div></Tooltip>
      <Tooltip title="View"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={() => onViewDetail(item)}><TbEye /></div></Tooltip>
      <Tooltip title="Change Status"><div className={classNames("text-xl cursor-pointer select-none text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400")} role="button" onClick={() => onChangeStatus(item)}><TbSwitchHorizontal /></div></Tooltip>
      <Tooltip title="Clone Form"><div className={classNames('text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400')} role="button" onClick={() => onClone(item)}><TbCopy /></div></Tooltip>
      <Tooltip title="Delete"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-800 dark:text-gray-400 dark:hover:text-red-400`} role="button" onClick={() => onDelete(item)}><TbTrash /></div></Tooltip>
    </div>
  );
};

// --- Search and TableTools ---
type FormBuilderSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const FormBuilderSearch = React.forwardRef<HTMLInputElement,FormBuilderSearchProps>(({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)}/>));
FormBuilderSearch.displayName = "FormBuilderSearch";

type FormBuilderTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; };
const FormBuilderTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: FormBuilderTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow"><FormBuilderSearch onInputChange={onSearchChange} /></div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button title="Clear Filters" icon={<TbReload/>} onClick={onClearFilters}/>
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

// --- Main FormBuilder Component ---
const FormBuilder = () => {
  // const dispatch = useAppDispatch(); // Uncomment if using Redux
  const [formsData, setFormsData] = useState<FormBuilderItem[]>(initialDummyForms);
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<"idle" | "pending">("idle"); // Simplified loading

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false); // This might be replaced by navigate for create
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false); // This might be replaced by navigate for edit
  const [editingItem, setEditingItem] = useState<FormBuilderItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<FormBuilderItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FormBuilderItem | null>(null);
  const navigate = useNavigate();

  // --- Export Reason Modal State ---
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<FormBuilderItem[]>([]);

  const formMethods = useForm<FormBuilderFormData>({
    resolver: zodResolver(formBuilderFormSchema),
    defaultValues: {
      formName: "", status: formStatusValues[0], departmentName: departmentValues[0], categoryName: categoryValues[0],
      questions: [{ questionSectionTitle: "", questionText: "", questionType: questionTypeValues[0] }],
    },
    mode: "onChange",
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({ control: formMethods.control, name: "questions" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });


  const handleEdit = (formId: string | number) => {
    // If you have a dedicated edit page:
    navigate(`/system-tools/formbuilder-edit/${formId}`);
    // Or if using a drawer for edit (as per original structure):
    // const itemToEdit = formsData.find(form => form.id === formId);
    // if (itemToEdit) openEditDrawer(itemToEdit);
  };

  // openAddDrawer/closeAddDrawer might not be needed if navigating to a create page
  const openAddDrawer = () => {
    formMethods.reset({
      formName: "", status: formStatusValues[0], departmentName: departmentValues[0], categoryName: categoryValues[0],
      questions: [{ questionSectionTitle: "", questionText: "", questionType: questionTypeValues[0] }],
    });
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => setIsAddDrawerOpen(false);


  const openEditDrawer = (item: FormBuilderItem) => {
    setEditingItem(item);
    formMethods.reset({ ...item, questions: item.questions.length > 0 ? item.questions : [{ questionSectionTitle: "", questionText: "", questionType: questionTypeValues[0] }] });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingItem(null); };

  const openViewDialog = (item: FormBuilderItem) => setViewingItem(item);
  const closeViewDialog = () => setViewingItem(null);

  const onSubmit = async (data: FormBuilderFormData, addAnother?: boolean) => {
    setIsSubmitting(true);
    setMasterLoadingStatus("pending");
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
    const now = new Date().toISOString();
    try {
      if (editingItem) {
        const updatedItem: FormBuilderItem = { ...editingItem, ...data, updated_at: now, updated_by_name: "Current User", updated_by_role: "Editor" };
        setFormsData((prev) => prev.map((f) => (f.id === updatedItem.id ? updatedItem : f)));
        toast.push(<Notification title="Form Updated" type="success" duration={2000} />);
        closeEditDrawer();
      } else {
        const newItem: FormBuilderItem = { ...data, id: `FORM${Date.now()}`, created_at: now, updated_at: now, updated_by_name: "Current User", updated_by_role: "Creator" };
        setFormsData((prev) => [newItem, ...prev]);
        toast.push(<Notification title="Form Created" type="success" duration={2000} />);
        if (addAnother) {
          formMethods.reset({
            formName: "", status: formStatusValues[0], departmentName: departmentValues[0], categoryName: categoryValues[0],
            questions: [{ questionSectionTitle: "", questionText: "", questionType: questionTypeValues[0] }],
          });
        } else {
          closeAddDrawer(); // Or navigate away if using separate create page
        }
      }
    } catch (e: any) {
      toast.push(<Notification title={editingItem ? "Update Failed" : "Create Failed"} type="danger" duration={3000}>{e.message}</Notification>);
    } finally {
      setIsSubmitting(false);
      setMasterLoadingStatus("idle");
    }
  };

  const handleDeleteClick = (item: FormBuilderItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true); setMasterLoadingStatus("pending"); setSingleDeleteConfirmOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      setFormsData((prev) => prev.filter((f) => f.id !== itemToDelete!.id));
      toast.push(<Notification title="Form Deleted" type="success" duration={2000}>{`Form "${itemToDelete.formName}" deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((f) => f.id !== itemToDelete!.id));
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{e.message}</Notification>);
    } finally {
      setIsDeleting(false); setMasterLoadingStatus("idle"); setItemToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) { toast.push(<Notification title="No Selection" type="info">Please select forms to delete.</Notification>); return; }
    setIsDeleting(true); setMasterLoadingStatus("pending");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const idsToDelete = selectedItems.map((item) => item.id);
      setFormsData((prev) => prev.filter((f) => !idsToDelete.includes(f.id)));
      toast.push(<Notification title="Forms Deleted" type="success" duration={2000}>{selectedItems.length} form(s) deleted.</Notification>);
      setSelectedItems([]);
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{e.message}</Notification>);
    } finally {
      setIsDeleting(false); setMasterLoadingStatus("idle");
    }
  };

  const handleChangeStatus = async (item: FormBuilderItem) => {
    setIsChangingStatus(true); setMasterLoadingStatus("pending");
    const currentStatusIndex = FORM_STATUS_OPTIONS.findIndex((s) => s.value === item.status);
    const nextStatusValue = FORM_STATUS_OPTIONS[(currentStatusIndex + 1) % FORM_STATUS_OPTIONS.length].value;
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      setFormsData((prev) => prev.map((f) => f.id === item.id ? { ...f, status: nextStatusValue, updated_at: new Date().toISOString(), updated_by_name: "Status Changer" } : f));
      toast.push(<Notification title="Status Changed" type="success" duration={2000}>{`Form "${item.formName}" status changed to ${FORM_STATUS_OPTIONS.find((s) => s.value === nextStatusValue)?.label}.`}</Notification>);
    } catch (e: any) {
      toast.push(<Notification title="Status Change Failed" type="danger" duration={3000}>{e.message}</Notification>);
    } finally {
      setIsChangingStatus(false); setMasterLoadingStatus("idle");
    }
  };

  const handleCloneForm = async (itemToClone: FormBuilderItem) => {
    setIsCloning(true); setMasterLoadingStatus("pending");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const now = new Date().toISOString();
    try {
      const clonedForm: FormBuilderItem = {
        ...cloneDeep(itemToClone), id: `FORM${Date.now()}_CLONE`, formName: `${itemToClone.formName} (Clone)`, status: "draft",
        created_at: now, updated_at: now, updated_by_name: "Cloner User", updated_by_role: "User"
      };
      setFormsData((prev) => [clonedForm, ...prev]);
      toast.push(<Notification title="Form Cloned" type="success" duration={2000}>{`Form "${itemToClone.formName}" cloned successfully.`}</Notification>);
    } catch (e: any) {
      toast.push(<Notification title="Clone Failed" type="danger" duration={3000}>{e.message}</Notification>);
    } finally {
      setIsCloning(false); setMasterLoadingStatus("idle");
    }
  };

  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); };
  const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); setIsFilterDrawerOpen(false); };
  const onClearFilters = () => { const defaultFilters = filterFormSchema.parse({}); filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); };


  // --- Export Functionality (Reason Modal) ---
  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Form Builder";
    // Simulate API call for submitting reason (replace with actual dispatch if using Redux)
    await new Promise(resolve => setTimeout(resolve, 500));
    // dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName })).unwrap(); // If using Redux
    console.log("Export Reason Submitted:", data.reason, "Module:", moduleName); // Placeholder

    toast.push(<Notification title="Export Reason Submitted" type="success" />);
    const success = exportFormsToCsvLogic("forms_export.csv", allFilteredAndSortedData);
    if (success) {
      toast.push(<Notification title="Data Exported" type="success">Forms data exported.</Notification>);
    }
    setIsExportReasonModalOpen(false);
    setIsSubmittingExportReason(false);
  };


  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: FormBuilderItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<FormBuilderItem>[]) => { const currentPageRowOriginals = currentRows.map((r) => r.original); if (checked) { setSelectedItems((prevSelected) => { const prevSelectedIds = new Set(prevSelected.map((item) => item.id)); const newRowsToAdd = currentPageRowOriginals.filter((r) => !prevSelectedIds.has(r.id)); return [...prevSelected, ...newRowsToAdd]; }); } else { const currentPageRowIds = new Set(currentPageRowOriginals.map((r) => r.id)); setSelectedItems((prevSelected) => prevSelected.filter((item) => !currentPageRowIds.has(item.id))); } }, []);


  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: FormBuilderItem[] = cloneDeep(formsData);
    if (filterCriteria.filterStatus?.length) { const statusValues = filterCriteria.filterStatus.map((s) => s.value); processedData = processedData.filter((item) => statusValues.includes(item.status)); }
    if (filterCriteria.filterDepartment?.length) { const deptValues = filterCriteria.filterDepartment.map((d) => d.value); processedData = processedData.filter((item) => deptValues.includes(item.departmentName)); }
    if (filterCriteria.filterCategory?.length) { const catValues = filterCriteria.filterCategory.map((c) => c.value); processedData = processedData.filter((item) => catValues.includes(item.categoryName)); }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) => String(item.id).toLowerCase().includes(query) || item.formName.toLowerCase().includes(query) || item.status.toLowerCase().includes(query) || (DEPARTMENT_OPTIONS.find((d) => d.value === item.departmentName)?.label.toLowerCase() || "").includes(query) || (CATEGORY_OPTIONS.find((c) => c.value === item.categoryName)?.label.toLowerCase() || "").includes(query) || (item.updated_by_name?.toLowerCase() ?? "").includes(query));
    }
    const { order, key } = tableData.sort as OnSortParam;
    const validSortKeys: (keyof FormBuilderItem | 'questionCount')[] = ["id", "formName", "status", "departmentName", "categoryName", "created_at", "updated_at", "updated_by_name", "questionCount"];
    if (order && key && validSortKeys.includes(String(key) as any)) {
        processedData.sort((a, b) => {
            let aVal: any, bVal: any;
            if (key === "created_at" || key === "updated_at") {
                const dateA = a[key as 'created_at' | 'updated_at'] ? new Date(a[key as 'created_at' | 'updated_at']!).getTime() : 0;
                const dateB = b[key as 'created_at' | 'updated_at'] ? new Date(b[key as 'created_at' | 'updated_at']!).getTime() : 0;
                return order === "asc" ? dateA - dateB : dateB - dateA;
            } else if (key === "questionCount") {
                 aVal = a.questions.length; bVal = b.questions.length;
            } else {
                aVal = a[key as keyof FormBuilderItem] ?? "";
                bVal = b[key as keyof FormBuilderItem] ?? "";
            }
            if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
            return order === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
        });
    }
    const dataToExport = [...processedData]; const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize; const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [formsData, tableData, filterCriteria]);

  const columns: ColumnDef<FormBuilderItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", size: 100, enableSorting: true },
    { header: "Form Name", accessorKey: "formName", size: 250, enableSorting: true, cell: (props) => (<span className="font-semibold">{props.getValue<string>()}</span>) },
    { header: "Status", accessorKey: "status", size: 120, enableSorting: true, cell: (props) => (<Tag className={classNames("capitalize", statusColors[props.getValue<string>()])}>{FORM_STATUS_OPTIONS.find((o) => o.value === props.getValue())?.label}</Tag>) },
    { header: "Department", accessorKey: "departmentName", size: 150, enableSorting: true, cell: (props) => DEPARTMENT_OPTIONS.find((o) => o.value === props.getValue())?.label || props.getValue() },
    { header: "Category", accessorKey: "categoryName", size: 150, enableSorting: true, cell: (props) => CATEGORY_OPTIONS.find((o) => o.value === props.getValue())?.label || props.getValue() },
    { header: "Questions", id: "questionCount", size: 100, enableSorting: true, cell: (props) => props.row.original.questions.length, meta: { tdClass: "text-center", thClass: "text-center" } },
    { header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 170,
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } = props.row.original;
          const formattedDate = updated_at ? `${new Date(updated_at).getDate()} ${new Date(updated_at).toLocaleString("en-US", { month: "long" })} ${new Date(updated_at).getFullYear()}, ${new Date(updated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` : "N/A";
          return (<div className="text-xs"><span>{updated_by_name || "N/A"}{updated_by_role && (<><br /><b>{updated_by_role}</b></>)}</span><br /><span>{formattedDate}</span></div>);
        },
    },
    { header: "Actions", id: "action", size: 200, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => (<ActionColumn item={props.row.original} onEdit={handleEdit} onViewDetail={openViewDialog} onChangeStatus={handleChangeStatus} onClone={handleCloneForm} onDelete={handleDeleteClick} />) },
  ], [handleChangeStatus, handleCloneForm, handleDeleteClick, handleEdit, openViewDialog]);


  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormItem label="Form Name" invalid={!!currentFormMethods.formState.errors.formName} errorMessage={currentFormMethods.formState.errors.formName?.message}><Controller name="formName" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbFileDescription />} placeholder="e.g., Customer Satisfaction Survey"/>)}/></FormItem>
        <FormItem label="Status" invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message}><Controller name="status" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select status" options={FORM_STATUS_OPTIONS} value={FORM_STATUS_OPTIONS.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)}/>)}/></FormItem>
        <FormItem label="Department Name" invalid={!!currentFormMethods.formState.errors.departmentName} errorMessage={currentFormMethods.formState.errors.departmentName?.message}><Controller name="departmentName" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select department" options={DEPARTMENT_OPTIONS} value={DEPARTMENT_OPTIONS.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)}/>)}/></FormItem>
        <FormItem label="Category Name" invalid={!!currentFormMethods.formState.errors.categoryName} errorMessage={currentFormMethods.formState.errors.categoryName?.message}><Controller name="categoryName" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select category" options={CATEGORY_OPTIONS} value={CATEGORY_OPTIONS.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)}/>)}/></FormItem>
      </div>
      <div className="border-t my-4 dark:border-gray-600"></div>
      <h5 className="mb-2 text-base font-semibold flex items-center gap-2"><TbListDetails /> Questions Section</h5>
      {currentFormMethods.formState.errors.questions && !Array.isArray(currentFormMethods.formState.errors.questions) && (<p className="text-red-500 text-xs mb-2">{currentFormMethods.formState.errors.questions.message}</p>)}
      <div className="space-y-6">
        {questionFields.map((field, index) => (
          <Card key={field.id} bodyClass="p-4" className="relative bg-gray-50 dark:bg-gray-700/50 border dark:border-gray-600 rounded-lg">
            {questionFields.length > 1 && (<Tooltip title="Remove Question Section"><Button shape="circle" size="xs" icon={<TbX />} onClick={() => removeQuestion(index)} className="absolute top-2 right-2 !bg-red-100 hover:!bg-red-200 dark:!bg-red-500/30 dark:hover:!bg-red-500/50 text-red-600 dark:text-red-400 !border-red-300 dark:!border-red-500"/></Tooltip>)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormItem label={`Question Section Title ${index + 1} (Optional)`} className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.questions?.[index]?.questionSectionTitle} errorMessage={currentFormMethods.formState.errors.questions?.[index]?.questionSectionTitle?.message}><Controller name={`questions.${index}.questionSectionTitle`} control={currentFormMethods.control} render={({ field: qField }) => (<Input {...qField} placeholder="e.g., Personal Information"/>)}/></FormItem>
              <FormItem label={`Question ${index + 1}`} className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.questions?.[index]?.questionText} errorMessage={currentFormMethods.formState.errors.questions?.[index]?.questionText?.message}><Controller name={`questions.${index}.questionText`} control={currentFormMethods.control} render={({ field: qField }) => (<Input textArea {...qField} rows={2} placeholder="Enter your question here..."/>)}/></FormItem>
              <FormItem label={`Question Type ${index + 1}`} invalid={!!currentFormMethods.formState.errors.questions?.[index]?.questionType} errorMessage={currentFormMethods.formState.errors.questions?.[index]?.questionType?.message}><Controller name={`questions.${index}.questionType`} control={currentFormMethods.control} render={({ field: qField }) => (<Select placeholder="Select type" options={QUESTION_TYPE_OPTIONS} value={QUESTION_TYPE_OPTIONS.find((o) => o.value === qField.value)} onChange={(opt) => qField.onChange(opt?.value)}/>)}/></FormItem>
              {["checkbox", "radio", "select"].includes(formMethods.watch(`questions.${index}.questionType`)) && (<div className="md:col-span-2 p-3 bg-gray-100 dark:bg-gray-800 rounded"><p className="text-xs text-gray-500 dark:text-gray-400">Dynamic options editor for Checkbox/Radio/Select types would go here. (Not implemented in this example).</p></div>)}
            </div>
          </Card>
        ))}
      </div>
      <Button type="button" variant="dashed" icon={<TbPlus />} onClick={() => appendQuestion({ questionSectionTitle: "", questionText: "", questionType: questionTypeValues[0] })} className="mt-4 self-start">Add Question Section</Button>
    </div>
  );

  const tableLoading = masterLoadingStatus === "pending" || isSubmitting || isDeleting || isCloning || isChangingStatus;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Form Builder</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={() => navigate("/system-tools/formbuilder-create")} disabled={tableLoading}>Add New</Button>
          </div>
          <FormBuilderTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal}/>
          <div className="mt-4">
            <DataTable
              columns={columns} data={pageData} loading={tableLoading}
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectable checkboxChecked={(row: FormBuilderItem) => selectedItems.some((selected) => selected.id === row.id)}
              onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8" hidden={selectedItems.length === 0}>
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Form{selectedItems.length > 1 ? "s" : ""} selected</span></span></span>
          <div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteSelected} loading={isDeleting && selectedItems.length > 0}>Delete Selected</Button></div>
        </div>
      </StickyFooter>

      {/* Drawer for Add/Edit - Note: Edit navigation might replace this for 'Edit' */}
      <Drawer
        title={editingItem ? "Edit Form Configuration" : "Create New Form"} // Adjusted title
        isOpen={isAddDrawerOpen || isEditDrawerOpen} // Control based on Add or Edit state
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={900}
        footer={
          <div className="text-right w-full">
            {!editingItem && isAddDrawerOpen && ( // Show "Save & Create Another" only for Add mode
              <Button size="sm" variant="outline" type="button" className="mr-2" onClick={() => formMethods.handleSubmit((data) => onSubmit(data, true))()} loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>Save & Create Another</Button>
            )}
            <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
            <Button size="sm" variant="solid" form="formBuilderForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (editingItem ? "Saving..." : "Creating...") : (editingItem ? "Save" : "Create Form")}</Button>
          </div>
        }
      >
        <Form id="formBuilderForm" onSubmit={formMethods.handleSubmit((data) => onSubmit(data, false))} className="flex flex-col gap-4 relative pb-28">
          {renderDrawerForm(formMethods)}
          {editingItem && (
             <div className="absolute bottom-[4%] w-[92%] left-1/2 transform -translate-x-1/2">
                <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                    <div>
                        <b className="mt-3 mb-3 font-semibold text-primary">Latest Update By:</b><br />
                        <p className="text-sm font-semibold">{editingItem.updated_by_name || "N/A"}</p>
                        <p>{editingItem.updated_by_role || "N/A"}</p>
                    </div>
                    <div>
                        <br />
                        <span className="font-semibold">Created At:</span>{" "}
                        <span>{editingItem.created_at ? new Date(editingItem.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}</span>
                        <br />
                        <span className="font-semibold">Updated At:</span>{" "}
                        <span>{editingItem.updated_at ? new Date(editingItem.updated_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}</span>
                    </div>
                </div>
            </div>
          )}
        </Form>
      </Drawer>

      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={800}>
        <h4 className="mb-4">Form Details: {viewingItem?.formName} (ID: {viewingItem?.id})</h4>
        {/* ... Dialog content remains the same ... */}
        <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div>
      </Dialog>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} onRequestClose={() => setIsFilterDrawerOpen(false)}
        footer={<div className="text-right w-full flex justify-end gap-2"><Button size="sm" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterFormBuilderForm" type="submit">Apply</Button></div>}>
        <Form id="filterFormBuilderForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Status" options={FORM_STATUS_OPTIONS} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
          <FormItem label="Department"><Controller name="filterDepartment" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Department" options={DEPARTMENT_OPTIONS} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
          <FormItem label="Category"><Controller name="filterCategory" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Category" options={CATEGORY_OPTIONS} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Form" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting && !!itemToDelete} confirmButtonColor="red-600">
        <p>Are you sure you want to delete the form "<strong>{itemToDelete?.formName}</strong>"? This action cannot be undone.</p>
      </ConfirmDialog>

      {/* --- Export Reason Modal (Same as DomainManagement) --- */}
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
        cancelText="Cancel"
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}
      >
        <Form
          id="exportFormsReasonForm" // Unique ID
          onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
          >
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default FormBuilder;