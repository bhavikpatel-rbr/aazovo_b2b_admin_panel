// src/views/your-path/FormBuilder.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
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
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Dialog,
  Dropdown,
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
  TbTrash,
  TbReload,
  TbCategory2,
  TbBuildingCommunity,
  TbFileSymlink,
  TbUser,
} from "react-icons/tb";
import { BsThreeDotsVertical } from "react-icons/bs";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { Link, useNavigate } from "react-router-dom";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getFormBuilderAction,
  deleteFormBuilderAction,
  deleteAllFormBuildersAction,
  changeFormBuilderStatusAction,
  cloneFormBuilderAction,
  getDepartmentsAction,
  getCategoriesAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

export const FORM_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft" },
  { value: "Published", label: "Published" },
  { value: "Archived", label: "Archived" },
];

const statusColors: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-100",
  Published: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Archived: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
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
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: string;
  form_title: string | null;
  form_description: string | null;
  created_by_user: {
    id: number;
    name: string;
    roles: { id: number; display_name: string }[];
  };
  updated_by_user: {
    id: number;
    name: string;
    roles: { id: number; display_name: string }[];
  };
  departments: string[]; // Expecting array of department names directly from API
  categories: string[]; // Expecting array of category names directly from API
  department_ids_array?: (string | number)[]; // Parsed for filtering
  category_ids_array?: (string | number)[];   // Parsed for filtering
  parsedSections?: FormSection[];
  questionCount?: number;
};

export type GeneralCategoryListItem = { id: string | number; name: string };
export type DepartmentListItem = { id: string | number; name: string };

const filterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDepartmentIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCategoryIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

type FormExportItem = {
  id: number;
  form_name: string;
  form_title: string | null;
  status: string;
  department_names_display: string;
  category_names_display: string;
  question_count: number;
  created_at_formatted: string;
  updated_by_name: string;
  updated_by_role: string;
  updated_at_formatted: string;
};

const CSV_HEADERS_FORM = ["ID", "Form Name", "Form Title", "Status", "Departments", "Categories", "Question Count", "Created At", "Updated By", "Updated Role", "Updated At"];
const CSV_KEYS_FORM_EXPORT: (keyof FormExportItem)[] = ["id", "form_name", "form_title", "status", "department_names_display", "category_names_display", "question_count", "created_at_formatted", "updated_by_name", "updated_by_role", "updated_at_formatted"];

const parseStringifiedArray = (str: string): (string | number)[] => {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed.map(String) : []; // Ensure IDs are strings for comparison
  } catch (e) {
    return [];
  }
};

function exportFormsToCsvLogic(
  filename: string,
  rows: FormBuilderItem[],
  allDepartmentsMasterList: DepartmentListItem[], // Master list for fallback
  allCategoriesMasterList: GeneralCategoryListItem[] // Master list for fallback
) {
  if (!rows || !rows.length) return false;

  const preparedRows: FormExportItem[] = rows.map((row) => {
    let departmentNamesDisplay: string;
    if (Array.isArray(row.departments) && row.departments.length > 0) {
      departmentNamesDisplay = row.departments.join(', ');
    } else {
      const deptIds = parseStringifiedArray(row.department_ids);
      departmentNamesDisplay = deptIds.map(id => allDepartmentsMasterList.find(d => String(d.id) === id)?.name).filter(Boolean).join(', ') || "N/A";
    }

    let categoryNamesDisplay: string;
    if (Array.isArray(row.categories) && row.categories.length > 0) {
      categoryNamesDisplay = row.categories.join(', ');
    } else {
      const catIds = parseStringifiedArray(row.category_ids);
      categoryNamesDisplay = catIds.map(id => allCategoriesMasterList.find(c => String(c.id) === id)?.name).filter(Boolean).join(', ') || "N/A";
    }
    
    return {
      id: row.id,
      form_name: row.form_name,
      form_title: row.form_title || "N/A",
      status: row.status,
      department_names_display: departmentNamesDisplay,
      category_names_display: categoryNamesDisplay,
      question_count: row.questionCount || 0,
      created_at_formatted: new Date(row.created_at).toLocaleString(),
      updated_by_name: row.updated_by_user.name,
      updated_by_role: row.updated_by_user.roles[0]?.display_name || "N/A",
      updated_at_formatted: new Date(row.updated_at).toLocaleString(),
    };
  });

  const separator = ",";
  const csvContent = CSV_HEADERS_FORM.join(separator) + "\n" +
    preparedRows.map(row => CSV_KEYS_FORM_EXPORT.map(k => {
      let cell = row[k as keyof FormExportItem];
      cell = (cell === null || cell === undefined) ? "" : String(cell).replace(/"/g, '""');
      if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(separator)).join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
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
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

const ActionColumn = ({ item, onEdit, onViewDetail, onClone }: { item: FormBuilderItem; onEdit: (id: number) => void; onViewDetail: (item: FormBuilderItem) => void; onClone: (item: FormBuilderItem) => void; }) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={() => onEdit(item.id)}><TbPencil /></div></Tooltip>
      <Tooltip title="Preview"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={() => onViewDetail(item)}><TbEye /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item className="flex items-center gap-2" onClick={() => onClone(item)}><TbCopy size={18} /> <span className="text-xs">Clone Form</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><Link to="/task/task-list/create" className="flex items-center gap-2 w-full"><TbUser size={18} /> <span className="text-xs">Assign to Task</span></Link></Dropdown.Item>
      </Dropdown>
    </div>
  );
};

type FormBuilderSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const FormBuilderSearch = React.forwardRef<HTMLInputElement, FormBuilderSearchProps>(({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
FormBuilderSearch.displayName = "FormBuilderSearch";

type FormBuilderTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; };
const FormBuilderTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: FormBuilderTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow"><FormBuilderSearch onInputChange={onSearchChange} /></div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button title="Clear Filters" icon={<TbReload />} onClick={onClearFilters} />
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

const FormBuilder = () => {
  const dispatch = useAppDispatch();
  const {
    formsData: rawFormsData = [],
    status: masterLoadingStatus = "idle",
    CategoriesData = [],
    departmentsData = [],
  } = useSelector(masterSelector, shallowEqual);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<FormBuilderItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FormBuilderItem | null>(null);
  const navigate = useNavigate();
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "updated_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<FormBuilderItem[]>([]);

  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

  const categoryFilterOptions = useMemo(() => CategoriesData.map((cat: GeneralCategoryListItem) => ({ value: String(cat.id), label: cat.name })), [CategoriesData]);
  const departmentFilterOptions = useMemo(() => departmentsData?.data.map((dept: DepartmentListItem) => ({ value: String(dept.id), label: dept.name })), [departmentsData?.data]);
  const statusFilterOptions = useMemo(() => FORM_STATUS_OPTIONS, []);

  useEffect(() => {
    dispatch(getFormBuilderAction());
    dispatch(getCategoriesAction());
    dispatch(getDepartmentsAction());
  }, [dispatch]);

  const handleEdit = (id: number) => navigate(`/system-tools/formbuilder-edit/${id}`);
  // const openViewDialog = (item: FormBuilderItem) => setViewingItem(item);

  const openViewDialog = (item: FormBuilderItem) => navigate(`/system-tools/formbuilder-edit/${item.id}?preview=true`);
  const closeViewDialog = () => setViewingItem(null);
  const handleDeleteClick = (item: FormBuilderItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };

  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true); setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteFormBuilderAction({ id: itemToDelete.id })).unwrap();
      toast.push(<Notification title="Form Deleted" type="success">{`Form "${itemToDelete.form_name}" deleted.`}</Notification>);
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger">{e.message || "Could not delete form."}</Notification>);
    } finally {
      setIsProcessing(false); setItemToDelete(null);
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
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger">{e.message || "Could not delete selected forms."}</Notification>);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeStatus = async (item: FormBuilderItem, newStatus: string) => { /* ... */ };
  const handleCloneForm = (itemToClone: FormBuilderItem) => {
    // Navigate to create page, passing the ID of the form to clone as a query parameter
    navigate(`/system-tools/formbuilder-create?cloneFrom=${itemToClone.id}`);
  };
  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); };
  const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); setIsFilterDrawerOpen(false); };
  const onClearFilters = () => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); dispatch(getFormBuilderAction()); setIsFilterDrawerOpen(false); };
  const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData?.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Form Builder";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `forms_export_${timestamp}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      exportFormsToCsvLogic(fileName, allFilteredAndSortedData, departmentsData?.data, CategoriesData); // Pass master lists
      toast.push(<Notification title="Data Exported" type="success">Forms data exported.</Notification>);
    } catch (error: any) {
      toast.push(<Notification title="Operation Failed" type="danger" message={error.message || "Could not complete export."} />);
    } finally {
      setIsExportReasonModalOpen(false); setIsSubmittingExportReason(false);
    }
  };

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: FormBuilderItem) => setSelectedItems(prev => checked ? [...prev, row] : prev.filter(item => item.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<FormBuilderItem>[]) => {
    const currentPageIds = new Set(currentRows.map(r => r.original.id));
    if (checked) setSelectedItems(prev => { const newItems = currentRows.map(r => r.original).filter(item => !prev.find(pi => pi.id === item.id)); return [...prev, ...newItems]; });
    else setSelectedItems(prev => prev.filter(item => !currentPageIds.has(item.id)));
  }, []);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const processedFormsData: FormBuilderItem[] = rawFormsData.map(form => {
        let qCount = 0; let parsedSecs: FormSection[] = [];
        try {
            const sections: FormSection[] = JSON.parse(form.section);
            if(Array.isArray(sections)){ parsedSecs = sections; sections.forEach(sec => qCount += sec.questions?.length || 0); }
        } catch (e) { /* ignore */ }
        return { ...form, questionCount: qCount, parsedSections: parsedSecs, department_ids_array: parseStringifiedArray(form.department_ids), category_ids_array: parseStringifiedArray(form.category_ids) };
    });

    let filteredData: FormBuilderItem[] = cloneDeep(processedFormsData);
    if (filterCriteria.filterStatus?.length) {
      const statusValues = filterCriteria.filterStatus.map(s => s.value);
      filteredData = filteredData.filter(item => statusValues.includes(item.status));
    }
    if (filterCriteria.filterDepartmentIds?.length) {
      const selectedDeptIds = filterCriteria.filterDepartmentIds.map(d => d.value);
      filteredData = filteredData.filter(item => item.department_ids_array?.some(id => selectedDeptIds.includes(String(id))));
    }
    if (filterCriteria.filterCategoryIds?.length) {
      const selectedCatIds = filterCriteria.filterCategoryIds.map(c => c.value);
      filteredData = filteredData.filter(item => item.category_ids_array?.some(id => selectedCatIds.includes(String(id))));
    }
    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      filteredData = filteredData.filter(item =>
        String(item.id).toLowerCase().includes(query) ||
        item.form_name.toLowerCase().includes(query) ||
        (item.form_title?.toLowerCase() || "").includes(query) ||
        item.status.toLowerCase().includes(query) ||
        (item.updated_by_user.name?.toLowerCase() ?? "").includes(query) ||
        (Array.isArray(item.departments) && item.departments.join(', ').toLowerCase().includes(query)) || // Search in pre-fetched names
        (Array.isArray(item.categories) && item.categories.join(', ').toLowerCase().includes(query))    // Search in pre-fetched names
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === "created_at" || key === "updated_at") { aVal = new Date(a[key]!).getTime(); bVal = new Date(b[key]!).getTime(); }
        else if (key === "questionCount") { aVal = a.questionCount || 0; bVal = b.questionCount || 0; }
        else { aVal = (a as any)[key] ?? ""; bVal = (b as any)[key] ?? ""; }
        if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }
    const currentTotal = filteredData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: filteredData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: filteredData };
  }, [rawFormsData, tableData, filterCriteria]);

  const columns: ColumnDef<FormBuilderItem>[] = useMemo(
    () => [
      {
        header: "Form Name / Title", accessorKey: "form_name", size: 260, enableSorting: true,
        cell: props => (<div onClick={() => openViewDialog(props.row.original)} className="cursor-pointer"><span className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">{props.row.original.form_name}</span><br /><span className="text-xs text-gray-500">{props.row.original.form_title || "-"}</span></div>),
      },
      {
        header: "Status", accessorKey: "status", size: 120, enableSorting: true,
        cell: props => (<Tag className={classNames("capitalize", statusColors[props.row.original.status] || statusColors.Draft)}>{props.row.original.status}</Tag>),
      },
      {
        header: "Departments", id: "departments", size: 180, enableSorting: false,
        cell: props => {
          const item = props.row.original;
          let displayNames: string[];
          if (Array.isArray(item.departments) && item.departments.length > 0) {
            displayNames = item.departments;
          } else {
            const ids = item.department_ids_array || [];
            displayNames = ids.map(id => departmentsData?.data.find(d => String(d.id) === String(id))?.name || `ID:${id}`);
          }
          if (!displayNames.length) return <Tag>N/A</Tag>;
          return (<div className="flex flex-wrap gap-1">{displayNames.slice(0,2).map(name => <Tag key={name}>{name}</Tag>)}{displayNames.length > 2 && <Tag>+{displayNames.length-2}</Tag>}</div>);
        }
      },
      {
        header: "Categories", id: "categories", size: 180, enableSorting: false,
        cell: props => {
          const item = props.row.original;
          let displayNames: string[];
          if (Array.isArray(item.categories) && item.categories.length > 0) {
            displayNames = item.categories;
          } else {
            const ids = item.category_ids_array || [];
            displayNames = ids.map(id => CategoriesData.find(c => String(c.id) === String(id))?.name || `ID:${id}`);
          }
          if (!displayNames.length) return <Tag>N/A</Tag>;
          return (<div className="flex flex-wrap gap-1">{displayNames.slice(0,2).map(name => <Tag key={name}>{name}</Tag>)}{displayNames.length > 2 && <Tag>+{displayNames.length-2}</Tag>}</div>);
        }
      },
      {
        header: "Questions", accessorKey: "questionCount", size: 90, enableSorting: true, meta: { tdClass: "text-center", thClass: "text-center" },
        cell: props => <span>{props.row.original.questionCount || 0}</span>,
      },
      {
        header: "Updated Info", accessorKey: "updated_at", size: 170, enableSorting: true,
        cell: props => { const { updated_at, updated_by_user } = props.row.original; const date = new Date(updated_at); const formattedDate = `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`; return (<div className="text-xs"><span>{updated_by_user.name || "N/A"}<br /><b>{updated_by_user.roles[0]?.display_name || "N/A"}</b></span><br /><span>{formattedDate}</span></div>); },
      },
      {
        header: "Actions", id: "action", size: 120, meta: { HeaderClass: "text-center", cellClass: "text-center" },
        cell: props => (
        <ActionColumn item={props.row.original} onEdit={handleEdit} onViewDetail={openViewDialog} onClone={handleCloneForm} />),
      },
    ], [departmentsData?.data, CategoriesData] // Dependencies for name lookups
  );

  const tableLoading = masterLoadingStatus === "pending" || isProcessing;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Form Builder</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={() => navigate("/system-tools/formbuilder-create")} disabled={tableLoading}>Add New Form</Button>
          </div>
          <FormBuilderTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} />
          <div className="mt-4"><DataTable columns={columns} data={pageData} noData={!tableLoading && pageData.length === 0} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectable checkboxChecked={(row: FormBuilderItem) => selectedItems.some(selected => selected.id === row.id)} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} /></div>
        </AdaptiveCard>
      </Container>

      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8" hidden={selectedItems.length === 0}>
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Form{selectedItems.length > 1 ? "s" : ""} selected</span></span></span>
          <div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteSelected} loading={isProcessing && selectedItems.length > 0}>Delete Selected</Button></div>
        </div>
      </StickyFooter>

      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={800} contentClassName="pb-0">
        <Dialog.Header title={`Form Details: ${viewingItem?.form_name}`} />
        <Dialog.Body className="p-4 max-h-[70vh] overflow-y-auto">
          {viewingItem && (
            <div className="space-y-4">
              <p><strong>ID:</strong> {viewingItem.id}</p>
              <p><strong>Form Name:</strong> {viewingItem.form_name}</p>
              <p><strong>Form Title:</strong> {viewingItem.form_title || "N/A"}</p>
              <p><strong>Form Description:</strong> {viewingItem.form_description || "N/A"}</p>
              <p><strong>Status:</strong> <Tag className={classNames("capitalize", statusColors[viewingItem.status] || statusColors.Draft)}>{viewingItem.status}</Tag></p>
              <p><strong>Departments:</strong> { (Array.isArray(viewingItem.departments) && viewingItem.departments.length > 0) ? viewingItem.departments.join(', ') : (viewingItem.department_ids_array || []).map(id => departmentsData?.data.find(d => String(d.id) === String(id))?.name || `ID:${id}`).join(', ') || "N/A" }</p>
              <p><strong>Categories:</strong> { (Array.isArray(viewingItem.categories) && viewingItem.categories.length > 0) ? viewingItem.categories.join(', ') : (viewingItem.category_ids_array || []).map(id => CategoriesData.find(c => String(c.id) === String(id))?.name || `ID:${id}`).join(', ') || "N/A" }</p>
              <p><strong>Created At:</strong> {new Date(viewingItem.created_at).toLocaleString()}</p>
              <p><strong>Updated At:</strong> {new Date(viewingItem.updated_at).toLocaleString()}</p>
              <p><strong>Updated By:</strong> {viewingItem.updated_by_user.name} ({viewingItem.updated_by_user.roles[0]?.display_name || "N/A"})</p>
              <h6 className="font-semibold mt-3">Questions ({viewingItem.questionCount || 0}):</h6>
              {viewingItem.parsedSections && viewingItem.parsedSections.length > 0 ? (viewingItem.parsedSections.map((section, secIdx) => (<div key={`sec-${secIdx}`} className="mb-3 p-2 border rounded"><p className="font-medium">{section.title}</p>{section.description && <p className="text-sm text-gray-600">{section.description}</p>}<ul className="list-disc pl-5 space-y-1 mt-1">{section.questions.map((q, qIdx) => (<li key={`q-${secIdx}-${qIdx}`}>{q.question} <Tag className="ml-1 text-xs">{q.question_type}</Tag>{q.required && <span className="text-red-500 text-xs ml-1">(Required)</span>}{q.question_option && <span className="text-xs ml-1">Options: {q.question_option}</span>}</li>))}</ul></div>))) : <p>No questions defined.</p>}
            </div>
          )}
        </Dialog.Body>
        <Dialog.Footer><Button variant="solid" onClick={closeViewDialog}>Close</Button></Dialog.Footer>
      </Dialog>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} onRequestClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full flex justify-end gap-2"><Button size="sm" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterFormBuilderForm" type="submit">Apply</Button></div>}>
        <Form id="filterFormBuilderForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Status" options={statusFilterOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Department"><Controller name="filterDepartmentIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Departments" options={departmentFilterOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} prefix={<TbBuildingCommunity />} />)} /></FormItem>
          <FormItem label="Category"><Controller name="filterCategoryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Categories" options={categoryFilterOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} prefix={<TbCategory2 className="text-lg" />} />)} /></FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Form" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isProcessing && !!itemToDelete} confirmButtonColor="red-600"><p>Are you sure you want to delete the form "<strong>{itemToDelete?.form_name}</strong>"?</p></ConfirmDialog>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}><Form id="exportFormsReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2"><FormItem label="Reason:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form></ConfirmDialog>
    </>
  );
};

export default FormBuilder;