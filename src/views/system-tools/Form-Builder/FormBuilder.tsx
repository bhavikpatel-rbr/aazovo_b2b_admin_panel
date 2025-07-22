import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";
import dayjs from "dayjs";

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
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Checkbox,
  Card,
  Dropdown,
  Radio,
  Dialog,
  Avatar,
  DatePicker,
  Skeleton,
} from "@/components/ui";
import { Controller, useForm } from "react-hook-form";

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbEye,
  TbCopy,
  TbReload,
  TbCategory2,
  TbBuildingCommunity,
  TbUser,
  TbColumns,
  TbX,
  TbFileText,
  TbCircleCheck,
  TbCircleX,
  TbHome,
  TbWorld,
  TbUserCircle,
} from "react-icons/tb";
import { BsThreeDotsVertical } from "react-icons/bs";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { Link, useNavigate } from "react-router-dom";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getFormBuilderAction,
  deleteFormBuilderAction,
  deleteAllFormBuildersAction,
  cloneFormBuilderAction,
  getDepartmentsAction,
  getCategoriesAction,
  submitExportReasonAction,
  addTaskAction,
  getAllUsersAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Constants and Type Definitions ---
export const FORM_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Draft", label: "Draft" },
];

const statusColors: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-500 border-1",
  Active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500 border-1",
  Inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500 border-1",
};

export type FormQuestion = {
  question: string;
  question_type: string;
  required?: boolean;
  question_label?: string | null;
  question_option?: string | null;
};

export type FormSection = {
  title: string;
  description?: string;
  questions: FormQuestion[];
};

export type FormBuilderItem = {
  id: number;
  form_name: string;
  section: string;
  department_ids: string;
  category_ids: string;
  is_external: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: string;
  form_title: string | null;
  form_description: string | null;
  created_by_user: { id: number; name: string; roles: { id: number; display_name: string }[]; profile_pic_path?: string };
  updated_by_user: { id: number; name: string; roles: { id: number; display_name: string }[]; profile_pic_path?: string };
  departments: string[];
  categories: string[];
  department_ids_array?: (string | number)[];
  category_ids_array?: (string | number)[];
  parsedSections?: FormSection[];
  questionCount?: number;
};

export type GeneralCategoryListItem = { id: string | number; name: string };
export type DepartmentListItem = { id: string | number; name: string };
export type SelectOption = { value: any; label: string };

const filterFormSchema = z.object({
  filterStatus: z.array(z.string()).optional(),
  filterDepartmentIds: z.array(z.string()).optional(),
  filterCategoryIds: z.array(z.string()).optional(),
  filterType: z.string().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const taskValidationSchema = z.object({
  task_title: z.string().min(3, 'Task title must be at least 3 characters.'),
  assign_to: z.array(z.string()).min(1, 'At least one assignee is required.'),
  priority: z.string().min(1, 'Please select a priority.'),
  due_date: z.date().nullable().optional(),
  description: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskValidationSchema>;

const taskPriorityOptions: SelectOption[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
];

const parseStringifiedArray = (str: string): (string | number)[] => {
  try {
    if (!str) return [];
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (e) {
    return [];
  }
};

function exportFormsToCsvLogic(filename: string, rows: FormBuilderItem[]) {
    if (!rows || rows.length === 0) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }
    const preparedRows = rows.map(row => ({
        ID: row.id,
        FormName: row.form_name,
        FormTitle: row.form_title || 'N/A',
        Status: row.status,
        Type: row.is_external ? 'External' : 'Internal',
        Departments: Array.isArray(row.departments) ? `"${row.departments.join(', ')}"` : 'N/A',
        Categories: Array.isArray(row.categories) ? `"${row.categories.join(', ')}"` : 'N/A',
        QuestionCount: row.questionCount || 0,
        CreatedBy: row.created_by_user?.name || 'N/A',
        UpdatedBy: row.updated_by_user?.name || 'N/A',
        UpdatedAt: new Date(row.updated_at).toLocaleString(),
    }));

    const csvContent = [
        Object.keys(preparedRows[0]).join(','),
        ...preparedRows.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
}

const ActionColumn = ({ item, onEdit, onViewDetail, onClone, onAssignToTask }: { item: FormBuilderItem; onEdit: (id: number) => void; onViewDetail: (item: FormBuilderItem) => void; onClone: (item: FormBuilderItem) => void; onAssignToTask: () => void; }) => (
    <div className="flex items-center justify-center gap-1">
        <Tooltip title="Edit"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600`} role="button" onClick={() => onEdit(item.id)}><TbPencil /></div></Tooltip>
        <Tooltip title="Preview"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600`} role="button" onClick={() => onViewDetail(item)}><TbEye /></div></Tooltip>
        <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer" />}>
            <Dropdown.Item className="flex items-center gap-2" onClick={() => onClone(item)}><TbCopy size={18} /> <span className="text-xs">Clone Form</span></Dropdown.Item>
            <Dropdown.Item className="flex items-center gap-2" onClick={onAssignToTask}><TbUser size={18} /> <span className="text-xs">Assign to Task</span></Dropdown.Item>
        </Dropdown>
    </div>
);

const FormBuilderSearch = React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void; value: string }>(({ onInputChange, value }, ref) => (
    <DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} value={value} onChange={(e) => onInputChange(e.target.value)} />
));
FormBuilderSearch.displayName = "FormBuilderSearch";

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll, departmentOptions, categoryOptions }: { filterData: Partial<FilterFormData>, onRemoveFilter: (key: keyof FilterFormData, value: any) => void, onClearAll: () => void, departmentOptions: any[], categoryOptions: any[] }) => {
  const activeStatuses = filterData.filterStatus || [];
  const activeDepartments = filterData.filterDepartmentIds?.map(id => ({ value: id, label: departmentOptions.find(o => o.value === id)?.label || id })) || [];
  const activeCategories = filterData.filterCategoryIds?.map(id => ({ value: id, label: categoryOptions.find(o => o.value === id)?.label || id })) || [];
  const activeType = filterData.filterType;
  const hasActiveFilters = activeStatuses.length > 0 || activeDepartments.length > 0 || activeCategories.length > 0 || !!activeType;
  if (!hasActiveFilters) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {activeStatuses.map(status => <Tag key={`status-${status}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100">Status: {status}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('filterStatus', status)} /></Tag>)}
      {activeDepartments.map(item => <Tag key={`dept-${item.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100">Dept: {item.label}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('filterDepartmentIds', item.value)} /></Tag>)}
      {activeCategories.map(item => <Tag key={`cat-${item.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100">Cat: {item.label}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('filterCategoryIds', item.value)} /></Tag>)}
      {activeType && <Tag prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100">Type: {activeType}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('filterType', activeType)} /></Tag>}
      {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
    </div>
  );
};

const FormBuilderTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, searchVal, columns, filteredColumns, setFilteredColumns, activeFilterCount, isDataReady }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; searchVal: string; columns: ColumnDef<FormBuilderItem>[]; filteredColumns: ColumnDef<FormBuilderItem>[]; setFilteredColumns: (cols: ColumnDef<FormBuilderItem>[]) => void; activeFilterCount: number; isDataReady: boolean; }) => {
    const toggleColumn = (checked: boolean, colHeader: string) => {
        if (checked) {
             const newCols = [...filteredColumns, columns.find(c => c.header === colHeader)!].sort((a, b) => columns.findIndex(c => c.header === a.header) - columns.findIndex(c => c.header === b.header));
             setFilteredColumns(newCols);
        } else {
             setFilteredColumns(filteredColumns.filter(c => c.header !== colHeader));
        }
    };
    const isColumnVisible = (header: string) => filteredColumns.some(c => c.header === header);
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow"><FormBuilderSearch onInputChange={onSearchChange} value={searchVal} /></div>
            <div className="flex items-center gap-2">
                <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>{columns.filter(c => c.id !== 'select' && c.header).map(col => (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(checked) => toggleColumn(checked, col.header as string)} >{col.header}</Checkbox></div>))}</div>
                </Dropdown>
                <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload" disabled={!isDataReady}></Button>
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto" disabled={!isDataReady}>Filter{activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto" disabled={!isDataReady}>Export</Button>
            </div>
        </div>
    );
};

const AssignTaskDialog = ({ 
    isOpen, 
    onClose, 
    formItem, 
    onSubmit, 
    employeeOptions,
    isLoading,
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    formItem: FormBuilderItem | null;
    onSubmit: (data: TaskFormData) => void;
    employeeOptions: SelectOption[];
    isLoading: boolean;
}) => {
    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<TaskFormData>({
        resolver: zodResolver(taskValidationSchema),
        mode: 'onChange',
    });

    useEffect(() => {
        if (formItem) {
            reset({
                task_title: `Handle Form: ${formItem.form_name}`,
                assign_to: [],
                priority: 'Medium',
                due_date: null,
                description: formItem.form_description || `Action required for the form titled "${formItem.form_title || formItem.form_name}".`,
            });
        }
    }, [formItem, reset]);

    const handleDialogClose = () => {
        reset();
        onClose();
    };

    if (!formItem) return null;

    return (
        <Dialog isOpen={isOpen} onClose={handleDialogClose} onRequestClose={handleDialogClose}>
            <h5 className="mb-4">Assign Task for Form</h5>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormItem label="Task Title" invalid={!!errors.task_title} errorMessage={errors.task_title?.message}>
                    <Controller name="task_title" control={control} render={({ field }) => <Input {...field} autoFocus />} />
                </FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem label="Assign To" invalid={!!errors.assign_to} errorMessage={errors.assign_to?.message}>
                        <Controller name="assign_to" control={control} render={({ field }) => (
                            <Select isMulti placeholder="Select User(s)" options={employeeOptions} value={employeeOptions.filter(o => field.value?.includes(o.value))} onChange={(opts) => field.onChange(opts?.map(o => o.value) || [])} />
                        )} />
                    </FormItem>
                    <FormItem label="Priority" invalid={!!errors.priority} errorMessage={errors.priority?.message}>
                        <Controller name="priority" control={control} render={({ field }) => (
                            <Select placeholder="Select Priority" options={taskPriorityOptions} value={taskPriorityOptions.find(p => p.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />
                        )} />
                    </FormItem>
                </div>
                <FormItem label="Due Date (Optional)" invalid={!!errors.due_date} errorMessage={errors.due_date?.message}>
                    <Controller name="due_date" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />} />
                </FormItem>
                <FormItem label="Description" invalid={!!errors.description} errorMessage={errors.description?.message}>
                    <Controller name="description" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} />
                </FormItem>
                <div className="text-right mt-6">
                    <Button type="button" className="mr-2" onClick={handleDialogClose} disabled={isLoading}>Cancel</Button>
                    <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Assign Task</Button>
                </div>
            </Form>
        </Dialog>
    );
};

const FormBuilder = () => {
  const dispatch = useAppDispatch();
  const { formsData: rawFormsData = [], status: masterLoadingStatus = "idle", CategoriesData = [], departmentsData = { data: [] }, getAllUserData = [] } = useSelector(masterSelector, shallowEqual);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<Partial<FilterFormData>>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "updated_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<FormBuilderItem[]>([]);
  const [itemToDelete, setItemToDelete] = useState<FormBuilderItem | null>(null);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTargetItem, setTaskTargetItem] = useState<FormBuilderItem | null>(null);
  const isDataReady = !initialLoading;

  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });
  
  const allUserOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map(b => ({ value: String(b.id), label: `(${b.employee_id}) - ${b.name || 'N/A'}` })) : [], [getAllUserData]);
  const categoryFilterOptions = useMemo(() => (CategoriesData || []).map((cat: GeneralCategoryListItem) => ({ value: String(cat.id), label: cat.name })), [CategoriesData]);
  const departmentFilterOptions = useMemo(() => (departmentsData?.data || []).map((dept: DepartmentListItem) => ({ value: String(dept.id), label: dept.name })), [departmentsData?.data]);
  const statusFilterOptions = useMemo(() => FORM_STATUS_OPTIONS, []);

  const refreshData = useCallback(async () => {
    setInitialLoading(true);
    try {
        await Promise.all([
            dispatch(getFormBuilderAction()),
            dispatch(getCategoriesAction()),
            dispatch(getDepartmentsAction()),
            dispatch(getAllUsersAction())
        ]);
    } catch (error) {
        console.error("Failed to refresh form builder data:", error);
        toast.push(<Notification title="Data Load Failed" type="danger">Could not load necessary data.</Notification>);
    } finally {
        setInitialLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleEdit = (id: number) => navigate(`/system-tools/formbuilder-edit/${id}`);
  const openViewDialog = (item: FormBuilderItem) => navigate(`/system-tools/formbuilder-edit/${item.id}?preview=true`);
  
  const handleDeleteClick = (item: FormBuilderItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  };
  
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteFormBuilderAction({ id: itemToDelete.id })).unwrap();
      toast.push(<Notification title="Form Deleted" type="success">{`Form "${itemToDelete.form_name}" deleted.`}</Notification>);
      refreshData();
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger" children={e.message || "Could not delete form."} />);
    } finally {
      setIsProcessing(false);
      setItemToDelete(null);
    }
  };
  
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);
    try {
      const idsToDelete = selectedItems.map((item) => item.id);
      await dispatch(deleteAllFormBuildersAction({ ids: idsToDelete })).unwrap();
      toast.push(<Notification title="Forms Deleted" type="success">{`${selectedItems.length} form(s) deleted.`}</Notification>);
      setSelectedItems([]);
      refreshData();
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger" children={e.message || "Could not delete selected forms."} />);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloneForm = (itemToClone: FormBuilderItem) => navigate(`/system-tools/formbuilder-create?cloneFrom=${itemToClone.id}`);
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
        filterStatus: data.filterStatus || [],
        filterDepartmentIds: data.filterDepartmentIds || [],
        filterCategoryIds: data.filterCategoryIds || [],
        filterType: data.filterType,
    });
    handleSetTableData({ pageIndex: 1 });
    setIsFilterDrawerOpen(false);
  };
  
  const onClearFilters = () => {
    filterFormMethods.reset({});
    setFilterCriteria({});
    handleSetTableData({ pageIndex: 1, query: "" });
    refreshData();
  };
  
  const handleRemoveFilter = useCallback((key: keyof FilterFormData, value: any) => {
    setFilterCriteria(prev => {
        const newFilters = { ...prev };
        if (key === 'filterStatus' || key === 'filterDepartmentIds' || key === 'filterCategoryIds') {
            const currentValues = prev[key] as any[] || [];
            const newValues = currentValues.filter(item => item !== value);
            newValues.length > 0 ? (newFilters as any)[key] = newValues : delete (newFilters as any)[key];
        } else {
            delete (newFilters as any)[key];
        }
        return newFilters;
    });
    handleSetTableData({ pageIndex: 1 });
  }, [handleSetTableData]);

  const handleCardClick = (status?: string) => {
    setFilterCriteria(status ? { filterStatus: [status] } : {});
    handleSetTableData({ pageIndex: 1, query: "" });
  };
  
  const openAssignToTaskModal = useCallback((item: FormBuilderItem) => {
    setTaskTargetItem(item);
    setIsTaskModalOpen(true);
  }, []);

  const closeAssignToTaskModal = useCallback(() => {
    setTaskTargetItem(null);
    setIsTaskModalOpen(false);
  }, []);
  
  const handleConfirmAddTask = async (data: TaskFormData) => {
    if (!taskTargetItem) return;
    setIsProcessing(true);
    try {
        const payload = {
            ...data,
            due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined,
            module_id: String(taskTargetItem.id),
            module_name: 'FormBuilder',
        };
        await dispatch(addTaskAction(payload)).unwrap();
        toast.push(<Notification type="success" title="Task Assigned Successfully!" />);
        closeAssignToTaskModal();
    } catch (error: any) {
        toast.push(<Notification title="Failed to Assign Task" children={error?.message || 'An unknown error occurred.'} />);
    } finally {
        setIsProcessing(false);
    }
  };


  const { pageData, total, allFilteredAndSortedData, counts } = useMemo(() => {
    const processedFormsData: FormBuilderItem[] = (rawFormsData || []).map(form => ({
        ...form,
        questionCount: (() => {
            try { return JSON.parse(form.section || '[]').reduce((acc: number, sec: FormSection) => acc + (sec.questions?.length || 0), 0); } catch { return 0; }
        })(),
        department_ids_array: parseStringifiedArray(form.department_ids),
        category_ids_array: parseStringifiedArray(form.category_ids),
    }));
    
    const statusCounts = {
        total: processedFormsData.length,
        Active: processedFormsData.filter(f => f.status === 'Active').length,
        Inactive: processedFormsData.filter(f => f.status === 'Inactive').length,
        Draft: processedFormsData.filter(f => f.status === 'Draft').length,
    };
    
    let filteredData: FormBuilderItem[] = cloneDeep(processedFormsData);
    if (filterCriteria.filterStatus?.length) { filteredData = filteredData.filter(item => filterCriteria.filterStatus!.includes(item.status)); }
    if (filterCriteria.filterDepartmentIds?.length) { filteredData = filteredData.filter(item => item.department_ids_array?.some(id => filterCriteria.filterDepartmentIds!.includes(String(id)))); }
    if (filterCriteria.filterCategoryIds?.length) { filteredData = filteredData.filter(item => item.category_ids_array?.some(id => filterCriteria.filterCategoryIds!.includes(String(id)))); }
    if (filterCriteria.filterType) { const isExternal = filterCriteria.filterType === 'External'; filteredData = filteredData.filter(item => item.is_external === isExternal); }
    
    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      filteredData = filteredData.filter(item => String(item.id || "").toLowerCase().includes(query) || (item.form_name || "").toLowerCase().includes(query) || (item.form_title?.toLowerCase() || "").includes(query) || (item.status || "").toLowerCase().includes(query) || (item.updated_by_user?.name?.toLowerCase() ?? "").includes(query) || (Array.isArray(item.departments) && item.departments.join(", ").toLowerCase().includes(query)) || (Array.isArray(item.categories) && item.categories.join(", ").toLowerCase().includes(query)));
    }
    
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData?.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === "created_at" || key === "updated_at") { aVal = a[key] ? new Date(a[key]!).getTime() : 0; bVal = b[key] ? new Date(b[key]!).getTime() : 0; } 
        else if (key === "questionCount") { aVal = a.questionCount || 0; bVal = b.questionCount || 0; } 
        else { aVal = (a as any)[key] ?? ""; bVal = (b as any)[key] ?? ""; }
        if (aVal === null || aVal === undefined) aVal = order === "asc" ? Infinity : -Infinity;
        if (bVal === null || bVal === undefined) bVal = order === "asc" ? Infinity : -Infinity;
        if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }

    const currentTotal = filteredData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: filteredData.slice(startIndex, startIndex + pageSize),
      total: currentTotal,
      allFilteredAndSortedData: filteredData,
      counts: statusCounts,
    };
  }, [rawFormsData, tableData, filterCriteria]);

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: FormBuilderItem) => setSelectedItems((prev) => checked ? [...prev, row] : prev.filter((item) => item.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<FormBuilderItem>[]) => { const currentPageIds = new Set(currentRows.map((r) => r.original.id)); if (checked) setSelectedItems((prev) => { const newItems = currentRows.map((r) => r.original).filter((item) => !prev.find((pi) => pi.id === item.id)); return [...prev, ...newItems]; }); else setSelectedItems((prev) => prev.filter((item) => !currentPageIds.has(item.id))); }, []);
  const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData?.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const fileName = `forms_export_${new Date().toISOString().split("T")[0]}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: "Form Builder", file_name: fileName })).unwrap(); toast.push(<Notification title="Export Reason Submitted" type="success" />); exportFormsToCsvLogic(fileName, allFilteredAndSortedData); } catch (error: any) { toast.push(<Notification title="Operation Failed" type="danger" children={error.message || "Could not complete export."} />); } finally { setIsExportReasonModalOpen(false); setIsSubmittingExportReason(false); } };
  const openImageViewer = (imageUrl: string | null | undefined) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
  const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };

  const baseColumns: ColumnDef<FormBuilderItem>[] = useMemo(() => [
    { header: "Form Name / Title", accessorKey: "form_name", size: 260, enableSorting: true, cell: (props) => (<div onClick={() => openViewDialog(props.row.original)} className="cursor-pointer"><span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">{props.row.original.form_name || "N/A"}</span><br /><span className="text-xs text-gray-500">{props.row.original.form_title || "-"}</span></div>), },
    { header: "Departments", id: "departments", size: 180, enableSorting: false, cell: (props) => { const item = props.row.original; let displayNames: string[]; if (Array.isArray(item.departments) && item.departments.length > 0) { displayNames = item.departments; } else { const ids = item.department_ids_array || []; displayNames = ids.map(id => (departmentsData?.data || []).find(d => String(d.id) === String(id))?.name || `ID:${id}`); } if (!displayNames.length) return <Tag className="capitalize font-semibold border-gray-300 dark:border-gray-500 border-1 ">N/A</Tag>; return (<div className="flex flex-wrap gap-1">{displayNames.slice(0, 2).map((name) => (<Tag className="capitalize font-semibold border-gray-300 dark:border-gray-500 border-1" key={name}>{name}</Tag>))}{displayNames.length > 2 && <Tag className="capitalize font-semibold border-gray-300 dark:border-gray-500 border-1">+{displayNames.length - 2}</Tag>}</div>); }, },
    { header: "Categories", id: "categories", size: 180, enableSorting: false, cell: (props) => { const item = props.row.original; let displayNames: string[]; if (Array.isArray(item.categories) && item.categories.length > 0) { displayNames = item.categories; } else { const ids = item.category_ids_array || []; displayNames = ids.map(id => (CategoriesData || []).find(c => String(c.id) === String(id))?.name || `ID:${id}`); } if (!displayNames.length) return <Tag className="capitalize font-semibold border-gray-300 dark:border-gray-500 border-1">N/A</Tag>; return (<div className="flex flex-wrap gap-1">{displayNames.slice(0, 2).map((name) => (<Tag className="capitalize font-semibold border-gray-300 dark:border-gray-500 border-1" key={name}>{name}</Tag>))}{displayNames.length > 2 && <Tag className="capitalize font-semibold border-gray-300 dark:border-gray-500 border-1">+{displayNames.length - 2}</Tag>}</div>); }, },
    { header: "Que", accessorKey: "questionCount", size: 90, enableSorting: true, meta: { tdClass: "text-center", thClass: "text-center" }, cell: (props) => <Tag className="capitalize font-semibold border-emerald-300 dark:border-emerald-500 border-1 bg-emerald-100 dark:bg-emerald-700">{props.row.original.questionCount || 0}</Tag> },
    { header: "Status", accessorKey: "status", size: 120, enableSorting: true, cell: (props) => (<Tag className={classNames("capitalize", statusColors[props.row.original.status] || statusColors.Draft)}>{props.row.original.status || "N/A"}</Tag>) },
    { header: "Type", accessorKey: "is_external", size: 120, cell: (props) => { const isExternal = props.row.original.is_external; return (<Tag className={classNames("capitalize", isExternal ? "border-sky-300 dark:border-sky-500 border-1 bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100" : "border-fuchsia-300 dark:border-fuchsia-500 border-1 bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-100")}>{isExternal ? "External" : "Internal"}</Tag>); }, },
    { header: "Actions", id: "action", size: 120, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => (<ActionColumn 
        item={props.row.original} 
        onEdit={handleEdit} 
        onViewDetail={openViewDialog} 
        onClone={handleCloneForm} 
        onAssignToTask={() => openAssignToTaskModal(props.row.original)}
    />) },
  ], [departmentsData?.data, CategoriesData, handleEdit, openViewDialog, handleCloneForm, openImageViewer, openAssignToTaskModal]);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<FormBuilderItem>[]>(baseColumns);
  useEffect(() => { setFilteredColumns(baseColumns) }, []);

  const activeFilterCount = useMemo(() => Object.values(filterCriteria).filter(v => (Array.isArray(v) ? v.length > 0 : !!v)).length, [filterCriteria]);
  const tableLoading = isProcessing;

  const renderCardContent = (content: number | undefined) => {
    if (initialLoading) {
      return <Skeleton width={50} height={20} />;
    }
    return <h6>{content ?? '...'}</h6>;
  };
  
  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Form Builder</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={() => navigate("/system-tools/formbuilder-create")} disabled={!isDataReady}>Add New Form</Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 mb-4 gap-4">
            <Tooltip title="View All Forms"><div className="cursor-pointer" onClick={() => handleCardClick()}><Card bodyClass="flex gap-2 p-2 hover:shadow-lg transition-shadow" className="rounded-md border border-blue-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbFileText size={24}/></div><div><div className="text-blue-500">{renderCardContent(counts?.total)}</div><span className="font-semibold text-xs">Total Forms</span></div></Card></div></Tooltip>
            <Tooltip title="Filter by Status: Active"><div className="cursor-pointer" onClick={() => handleCardClick('Active')}><Card bodyClass="flex gap-2 p-2 hover:shadow-lg transition-shadow" className="rounded-md border border-emerald-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-600"><TbCircleCheck size={24}/></div><div><div className="text-emerald-600">{renderCardContent(counts?.Active)}</div><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
            <Tooltip title="Filter by Status: Inactive"><div className="cursor-pointer" onClick={() => handleCardClick('Inactive')}><Card bodyClass="flex gap-2 p-2 hover:shadow-lg transition-shadow" className="rounded-md border border-red-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-600"><TbCircleX size={24}/></div><div><div className="text-red-500">{renderCardContent(counts?.Inactive)}</div><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
            <Tooltip title="Filter by Status: Draft"><div className="cursor-pointer" onClick={() => handleCardClick('Draft')}><Card bodyClass="flex gap-2 p-2 hover:shadow-lg transition-shadow" className="rounded-md border border-gray-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-gray-100 text-gray-600"><TbPencil size={24}/></div><div><div className="text-gray-600">{renderCardContent(counts?.Draft)}</div><span className="font-semibold text-xs">Drafts</span></div></Card></div></Tooltip>
          </div>

          <FormBuilderTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilter={() => setIsFilterDrawerOpen(true)} onExport={handleOpenExportReasonModal} searchVal={tableData.query as string} columns={baseColumns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} isDataReady={isDataReady} />
          
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} departmentOptions={departmentFilterOptions} categoryOptions={categoryFilterOptions} />
          
          {(activeFilterCount > 0 || tableData.query) && <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching form.</div>}
          
          <div className="mt-4">
            <DataTable columns={filteredColumns} data={pageData} noData={!isDataReady && pageData.length === 0} loading={initialLoading || tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number, }} selectable checkboxChecked={(row) => selectedItems.some((item) => item.id === row.id)} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>

      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8" hidden={selectedItems.length === 0}>
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Form{selectedItems.length > 1 ? "s" : ""} selected</span></span></span>
          <div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteSelected} loading={isProcessing && selectedItems.length > 0}>Delete Selected</Button></div>
        </div>
      </StickyFooter>
      
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} onRequestClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full flex justify-end gap-2"><Button size="sm" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterFormBuilderForm" type="submit">Apply</Button></div>}>
        <Form id="filterFormBuilderForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Status" options={statusFilterOptions} value={statusFilterOptions.filter(opt => field.value?.includes(opt.value))} onChange={(val) => field.onChange(val?.map(v => v.value) || [])} />)} /></FormItem>
          <FormItem label="Form Type">
            <Controller name="filterType" control={filterFormMethods.control} render={({ field }) => (
                <Radio.Group value={field.value} onChange={field.onChange}>
                  <Radio value="Internal">Internal</Radio>
                  <Radio value="External">External</Radio>
                </Radio.Group>
            )}/>
          </FormItem>
          <FormItem label="Department"><Controller name="filterDepartmentIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Departments" options={departmentFilterOptions} value={departmentFilterOptions.filter(opt => field.value?.includes(opt.value))} onChange={(val) => field.onChange(val?.map(v => v.value) || [])} prefix={<TbBuildingCommunity />} />)} /></FormItem>
          <FormItem label="Category"><Controller name="filterCategoryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Categories" options={categoryFilterOptions} value={categoryFilterOptions.filter(opt => field.value?.includes(opt.value))} onChange={(val) => field.onChange(val?.map(v => v.value) || [])} prefix={<TbCategory2 className="text-lg" />} />)} /></FormItem>
        </Form>
      </Drawer>
      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
          <div className="flex justify-center items-center p-4">
              {imageToView ? (<img src={imageToView} alt="User Profile" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />) : (<p>No image to display.</p>)}
          </div>
      </Dialog>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Form" onClose={() => setSingleDeleteConfirmOpen(false)} onConfirm={onConfirmSingleDelete} loading={isProcessing} confirmButtonColor="red-600"><p>Are you sure you want to delete the form "<strong>{itemToDelete?.form_name}</strong>"?</p></ConfirmDialog>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}><Form id="exportFormsReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2"><FormItem label="Reason:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form></ConfirmDialog>
    
      <AssignTaskDialog
        isOpen={isTaskModalOpen}
        onClose={closeAssignToTaskModal}
        formItem={taskTargetItem}
        onSubmit={handleConfirmAddTask}
        employeeOptions={allUserOptions}
        isLoading={isProcessing}
      />
    </>
  );
};

export default FormBuilder;