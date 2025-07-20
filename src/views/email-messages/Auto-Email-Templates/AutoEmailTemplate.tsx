// src/views/your-path/AutoEmailTemplatesListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
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
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected
import Select from "@/components/ui/Select";
import { Card, Drawer, Form, FormItem, Input, Tag, Checkbox, Dropdown, Avatar, Dialog, Skeleton } from "@/components/ui"; // ADDED Skeleton

// Icons
import {
  TbPencil,
  TbEye,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbMailBolt,
  TbKey,
  TbTrash,
  TbCategory2, // For Category
  TbBuildingArch,
  TbReload,
  TbCopy,
  TbMailSearch,
  TbMailForward,
  TbMailOpened,
  TbAlignBoxCenterBottom,
  TbBuildingCog,
  TbBuildingOff, // For Department
  TbColumns,
  TbX,
  TbUserCircle, // ADDED for Avatar fallback
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  // !!! REPLACE WITH YOUR ACTUAL ACTIONS !!!
  getAutoEmailTemplatesAction,
  addAutoEmailTemplateAction,
  editAutoEmailTemplateAction,
  deleteAutoEmailTemplateAction,
  deleteAllAutoEmailTemplatesAction,
  getCategoriesAction, // Action to fetch categories for templates
  getDepartmentsAction, // Action to fetch departments for templates
  submitExportReasonAction, // ADDED for export reason
} from "@/reduxtool/master/middleware"; // Adjust path
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust path
import dayjs from "dayjs";
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";


// --- Define Types ---
export type ApiAETCategory = { id: string | number; name: string; /* other fields */ };
export type ApiAETDepartment = { id: string | number; name: string; /* other fields */ };
export type SelectOption = { value: string; label: string };

export type AutoEmailTemplateItem = { // Matches your API listing data
  id: string | number;
  email_type: string;
  template_key: string;
  category_id: string;
  department_id: string | null; // API might send null for empty department_id
  status: "Active" | "Inactive"; // ADDED
  created_at: string;
  updated_at: string;
  category?: { id: number; name: string; } | null;
  department?: { id: number; name: string; } | null;
  created_by_user?: { name: string; roles: { display_name: string }[] }; // ADDED
  updated_by_user?: { name: string; roles: { display_name: string }[]; profile_pic_path?: string | null }; // ADDED profile_pic_path
  // For UI display convenience
  categoryNameDisplay?: string;
  departmentNameDisplay?: string;
};

// --- Status Options ---
const statusOptions: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];


// --- Zod Schema for Add/Edit Form ---
const autoEmailTemplateFormSchema = z.object({
  email_type: z.string().min(1, "Email Type is required.").max(100, "Email Type too long."),
  template_key: z.string().min(1, "Template Key is required.").max(50, "Template Key too long.")
    .regex(/^[A-Za-z0-9_.-]+$/, "Key can only contain alphanumeric, underscore, dot, or hyphen."),
  category_id: z.string().min(1, "Please select a category."),
  department_id: z.string().optional().or(z.literal("")),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required." }), // ADDED
});
type AutoEmailTemplateFormData = z.infer<typeof autoEmailTemplateFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterEmailTypes: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterTemplateKeys: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCategoryIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDepartmentIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // ADDED
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

// --- CSV Exporter ---
const CSV_HEADERS_AET = ["ID", "Email Type", "Template Key", "Category", "Department", "Status", "Updated By", "Updated Role", "Updated At"];

type AutoEmailTemplateExportItem = Omit<AutoEmailTemplateItem, "created_at" | "updated_at" | "created_by_user" | "updated_by_user" | "category" | "department"> & {
  categoryNameDisplay?: string;
  departmentNameDisplay?: string;
  updated_by_name?: string;
  updated_by_role?: string;
  updated_at_formatted?: string;
};

const CSV_KEYS_AET: (keyof AutoEmailTemplateExportItem)[] = [
  "id", "email_type", "template_key", "categoryNameDisplay", "departmentNameDisplay", "status", "updated_by_name", "updated_by_role", "updated_at_formatted",
];

function exportAutoEmailTemplatesToCsv(filename: string, rows: AutoEmailTemplateItem[]) {
  if (!rows || !rows.length) {
    return false;
  }
  const preparedRows: AutoEmailTemplateExportItem[] = rows.map((row) => ({
    id: row.id,
    email_type: row.email_type,
    template_key: row.template_key,
    categoryNameDisplay: row.category?.name || String(row.category_id),
    departmentNameDisplay: row.department?.name || (row.department_id ? String(row.department_id) : "N/A"),
    status: row.status,
    updated_by_name: row.updated_by_user?.name || "N/A",
    updated_by_role: row.updated_by_user?.roles?.[0]?.display_name || "N/A",
    updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A',
  }));
  const separator = ",";
  const csvContent = CSV_HEADERS_AET.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_AET.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

// --- ActionColumn, Search, TableTools, SelectedFooter (UI remains same) ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 
          dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Send test email">
        <div className="text-xl cursor-pointer text-gray-500 hover:text-orange-600" role="button">
          <TbMailForward size={18} />
        </div>
      </Tooltip>
      <Tooltip title="View Template">
        <div className="text-xl cursor-pointer text-gray-500 hover:text-blue-600" role="button">
          <TbAlignBoxCenterBottom size={18} />
        </div>
      </Tooltip>
      <Tooltip title="Delete">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>);
};
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(({ onInputChange }, ref) => (<DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
ItemSearch.displayName = "ItemSearch";

const AutoEmailTemplatesTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount, isDataReady }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<AutoEmailTemplateItem>[];
  filteredColumns: ColumnDef<AutoEmailTemplateItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<AutoEmailTemplateItem>[]>>;
  activeFilterCount: number;
  isDataReady: boolean;
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
        <ItemSearch onInputChange={onSearchChange} />
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
        <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onClearFilters} disabled={!isDataReady} /></Tooltip>
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto" disabled={!isDataReady}>
          Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
        </Button>
        <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto" disabled={!isDataReady}>Export</Button>
      </div>
    </div>
  );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData,
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const { filterEmailTypes, filterTemplateKeys, filterCategoryIds, filterDepartmentIds, filterStatus } = filterData;
  const hasFilters = filterEmailTypes?.length || filterTemplateKeys?.length || filterCategoryIds?.length || filterDepartmentIds?.length || filterStatus?.length;
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {filterEmailTypes?.map(item => <Tag key={`type-${item.value}`} prefix>Type: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterEmailTypes', item.value)} /></Tag>)}
      {filterTemplateKeys?.map(item => <Tag key={`key-${item.value}`} prefix>Key: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterTemplateKeys', item.value)} /></Tag>)}
      {filterCategoryIds?.map(item => <Tag key={`cat-${item.value}`} prefix>Cat: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterCategoryIds', item.value)} /></Tag>)}
      {filterDepartmentIds?.map(item => <Tag key={`dept-${item.value}`} prefix>Dept: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterDepartmentIds', item.value)} /></Tag>)}
      {filterStatus?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatus', item.value)} /></Tag>)}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};

type AutoEmailTemplatesTableProps = { columns: ColumnDef<AutoEmailTemplateItem>[]; data: AutoEmailTemplateItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: AutoEmailTemplateItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: AutoEmailTemplateItem) => void; onAllRowSelect: (checked: boolean, rows: Row<AutoEmailTemplateItem>[]) => void; };
const AutoEmailTemplatesTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: AutoEmailTemplatesTableProps) => (<DataTable columns={columns} data={data} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} noData={!loading && data.length === 0} />);
type AutoEmailTemplatesSelectedFooterProps = { selectedItems: AutoEmailTemplateItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const AutoEmailTemplatesSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: AutoEmailTemplatesSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; return (<> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold"> {selectedItems.length} Template{selectedItems.length > 1 ? "s" : ""} selected </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Template(s)`} onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }}> <p>Are you sure you want to delete the selected template(s)?</p> </ConfirmDialog> </>); };

const AutoEmailTemplatesListing = () => {
  const dispatch = useAppDispatch();
  const {
    autoEmailTemplatesData = {}, // Data for the table
    CategoriesData = [],    // Data for category dropdown
    departmentsData = [],   // Data for department dropdown
  } = useSelector(masterSelector, shallowEqual);

  const [initialLoading, setInitialLoading] = useState(true);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AutoEmailTemplateItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AutoEmailTemplateItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<AutoEmailTemplateItem[]>([]);

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [imageView, setImageView] = useState('');
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const isDataReady = !initialLoading;
  const tableLoading = initialLoading || isSubmitting || isDeleting;

  const openImageViewer = useCallback((path: string | null | undefined) => {
    if (path) {
      setImageView(path);
      setIsImageViewerOpen(true);
    } else {
      toast.push(<Notification title="No Image" type="info">User has no profile picture.</Notification>);
    }
  }, []);

  const closeImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
    setImageView('');
  }, []);


  const categoryOptions = useMemo(() => Array.isArray(CategoriesData) ? CategoriesData.map((c: ApiAETCategory) => ({ value: String(c.id), label: c.name })) : [], [CategoriesData]);
  const departmentOptions = useMemo(() => Array.isArray(departmentsData?.data) ? departmentsData?.data.map((d: ApiAETDepartment) => ({ value: String(d.id), label: d.name })) : [], [departmentsData?.data]);

  useEffect(() => {
    const fetchData = async () => {
        setInitialLoading(true);
        try {
            await Promise.all([
                dispatch(getAutoEmailTemplatesAction()),
                dispatch(getCategoriesAction()),
                dispatch(getDepartmentsAction()),
            ]);
        } catch (error) {
            console.error("Failed to load initial data", error);
            toast.push(<Notification title="Data Load Failed" type="danger">Could not load necessary data.</Notification>)
        } finally {
            setInitialLoading(false);
        }
    };
    fetchData();
  }, [dispatch]);

  const formMethods = useForm<AutoEmailTemplateFormData>({
    resolver: zodResolver(autoEmailTemplateFormSchema),
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

  const openAddDrawer = useCallback(() => {
    formMethods.reset({
      email_type: "",
      template_key: "",
      category_id: categoryOptions[0]?.value || "",
      department_id: departmentOptions[0]?.value || "",
      status: "Active",
    });
    setEditingItem(null); setIsAddDrawerOpen(true);
  }, [formMethods, categoryOptions, departmentOptions]);

  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback((item: AutoEmailTemplateItem) => {
    setEditingItem(item);
    formMethods.reset({
      email_type: item.email_type,
      template_key: item.template_key,
      category_id: String(item.category_id),
      department_id: String(item.department_id || ""),
      status: item.status || "Active",
    });
    setIsEditDrawerOpen(true);
  }, [formMethods]
  );
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

  const onSubmitHandler = async (data: AutoEmailTemplateFormData) => {
    setIsSubmitting(true);
    const apiPayload = {
      ...data,
      department_id: data.department_id === "" ? null : data.department_id, // Send null if empty string
    };
    try {
      if (editingItem) {
        await dispatch(editAutoEmailTemplateAction({ id: editingItem.id, ...apiPayload })).unwrap();
        toast.push(<Notification title="Template Updated" type="success" />);
        closeEditDrawer();
      } else {
        await dispatch(addAutoEmailTemplateAction(apiPayload)).unwrap();
        toast.push(<Notification title="Template Added" type="success" />);
        closeAddDrawer();
      }
      dispatch(getAutoEmailTemplatesAction());
    } catch (e: any) {
      toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{(e as Error).message}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = useCallback((item: AutoEmailTemplateItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteAutoEmailTemplateAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Template Deleted" type="success">{`Template "${itemToDelete.email_type} - ${itemToDelete.template_key}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id)); dispatch(getAutoEmailTemplatesAction()); } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>); } finally { setIsDeleting(false); setItemToDelete(null); } }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const idsToDelete = selectedItems.map((item) => String(item.id)); try { await dispatch(deleteAllAutoEmailTemplatesAction({ ids: idsToDelete.join(',') })).unwrap(); toast.push(<Notification title="Deletion Successful" type="success">{`${idsToDelete.length} template(s) deleted.`}</Notification>); setSelectedItems([]); dispatch(getAutoEmailTemplatesAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{(e as Error).message}</Notification>); } finally { setIsDeleting(false); } }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer]);
  const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1, query: '' })); dispatch(getAutoEmailTemplatesAction()); setIsFilterDrawerOpen(false); }, [filterFormMethods, dispatch]);

  const handleCardClick = useCallback((status: 'Active' | 'Inactive' | 'all') => {
    onClearFilters();
    if (status !== 'all') {
      const statusOption = statusOptions.find(opt => opt.value === status);
      if (statusOption) {
        setFilterCriteria({ filterStatus: [statusOption] });
      }
    }
  }, [onClearFilters]);

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
    const moduleName = "AutoEmailTemplates";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `auto_email_templates_export_${timestamp}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName, })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      const exportSuccess = exportAutoEmailTemplatesToCsv(fileName, allFilteredAndSortedData);
      if (exportSuccess) {
        toast.push(<Notification title="Export Successful" type="success">Data exported to {fileName}.</Notification>);
      } else if (allFilteredAndSortedData && allFilteredAndSortedData.length > 0) {
        toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
      }
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message || "Could not submit export reason."}</Notification>);
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataWithDisplayNames: AutoEmailTemplateItem[] =
      Array.isArray((autoEmailTemplatesData as any)?.data) ? (autoEmailTemplatesData as any)?.data.map((item: any) => ({
        ...item,
        status: item.status || "Inactive",
        categoryNameDisplay: item.category?.name || categoryOptions.find(c => c.value === String(item.category_id))?.label || String(item.category_id),
        departmentNameDisplay: item.department?.name || departmentOptions.find(d => d.value === String(item.department_id))?.label || (item.department_id ? String(item.department_id) : "N/A"),
      })) : [];

    let processedData = cloneDeep(sourceDataWithDisplayNames);
    if (filterCriteria.filterEmailTypes?.length) { const v = filterCriteria.filterEmailTypes.map(et => et.value.toLowerCase()); processedData = processedData.filter(item => v.includes(item.email_type.toLowerCase())); }
    if (filterCriteria.filterTemplateKeys?.length) { const v = filterCriteria.filterTemplateKeys.map(tk => tk.value.toLowerCase()); processedData = processedData.filter(item => v.includes(item.template_key.toLowerCase())); }
    if (filterCriteria.filterCategoryIds?.length) { const v = filterCriteria.filterCategoryIds.map(c => c.value); processedData = processedData.filter(item => v.includes(String(item.category_id))); }
    if (filterCriteria.filterDepartmentIds?.length) { const v = filterCriteria.filterDepartmentIds.map(d => d.value); processedData = processedData.filter(item => v.includes(String(item.department_id))); }
    if (filterCriteria.filterStatus?.length) { const statuses = filterCriteria.filterStatus.map(s => s.value); processedData = processedData.filter(item => statuses.includes(item.status)); }
    if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => String(item.id).toLowerCase().includes(q) || item.email_type.toLowerCase().includes(q) || item.template_key.toLowerCase().includes(q) || item.categoryNameDisplay?.toLowerCase().includes(q) || item.departmentNameDisplay?.toLowerCase().includes(q) || item.status.toLowerCase().includes(q)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === 'category_id') { aVal = a.categoryNameDisplay; bVal = b.categoryNameDisplay; }
        else if (key === 'department_id') { aVal = a.departmentNameDisplay; bVal = b.departmentNameDisplay; }
        else if (key === 'updated_at') { return order === "asc" ? new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime() : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(); }
        else { aVal = a[key as keyof AutoEmailTemplateItem]; bVal = b[key as keyof AutoEmailTemplateItem]; }
        const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    const dataToExport = [...processedData]; const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [autoEmailTemplatesData?.data, tableData, filterCriteria, categoryOptions, departmentOptions]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterEmailTypes?.length) count++;
    if (filterCriteria.filterTemplateKeys?.length) count++;
    if (filterCriteria.filterCategoryIds?.length) count++;
    if (filterCriteria.filterDepartmentIds?.length) count++;
    if (filterCriteria.filterStatus?.length) count++;
    return count;
  }, [filterCriteria]);

  const handlePaginationChange = useCallback((page: number) => setTableData(prev => ({ ...prev, pageIndex: page })), []);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData(prev => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleSearchInputChange = useCallback((query: string) => { setTableData(prev => ({ ...prev, query: query, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: AutoEmailTemplateItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<AutoEmailTemplateItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<AutoEmailTemplateItem>[] = useMemo(() => [
    { header: "Email Type", accessorKey: "email_type", size: 250, enableSorting: true },
    { header: "Category", accessorKey: "category_id", size: 180, enableSorting: true, cell: props => props.row.original.category?.name || categoryOptions.find(c => c.value === String(props.getValue()))?.label || String(props.getValue()) },
    { header: "Department", accessorKey: "department_id", size: 180, enableSorting: true, cell: props => props.row.original.department?.name || departmentOptions.find(d => d.value === String(props.getValue()))?.label || (props.getValue() ? String(props.getValue()) : "N/A") },
    {
      header: "Status", accessorKey: "status", enableSorting: true, size: 100,
      cell: (props) => {
        const status = props.row.original.status;
        return (
          <Tag
            className={classNames("capitalize font-semibold whitespace-nowrap", {
              "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500": status === "Active",
              "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500": status === "Inactive",
            })}
          >{status}</Tag>
        )
      }
    },
    {
      header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 220, cell: (props) => {
        const { updated_at, updated_by_user } = props.row.original;
        return (
          <div className="flex items-center gap-2">
            <Tooltip title="View Profile Picture">
              <Avatar
                src={updated_by_user?.profile_pic_path || undefined}
                shape="circle"
                size="sm"
                icon={<TbUserCircle />}
                className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                onClick={() => openImageViewer(updated_by_user?.profile_pic_path)} />
            </Tooltip>
            <div>
              <span className='font-semibold'>{updated_by_user?.name || 'N/A'}</span>
              <div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div>
              <div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div>
            </div>
          </div>
        );
      }
    },
    { header: "Actions", id: "actions", size: 100, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
  ], [categoryOptions, departmentOptions, openEditDrawer, handleDeleteClick, openImageViewer]);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<AutoEmailTemplateItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem label={<div>Email Type<span className="text-red-500"> * </span></div>} className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.email_type} errorMessage={currentFormMethods.formState.errors.email_type?.message}>
        <Controller name="email_type" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbMailBolt />} placeholder="e.g., Welcome Email, Order Confirmation" />)} />
      </FormItem>
      <FormItem label={<div>Template ID<span className="text-red-500"> * </span></div>} className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.template_key} errorMessage={currentFormMethods.formState.errors.template_key?.message}>
        <Controller name="template_key" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbKey />} placeholder="UNIQUE_TEMPLATE_KEY (e.g., WELCOME_V1)" />)} />
      </FormItem>
      <FormItem label={<div>Category<span className="text-red-500"> * </span></div>} invalid={!!currentFormMethods.formState.errors.category_id} errorMessage={currentFormMethods.formState.errors.category_id?.message}>
        <Controller name="category_id" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Category" options={categoryOptions} value={categoryOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbCategory2 />} />)} />
      </FormItem>
      <FormItem label="Department" invalid={!!currentFormMethods.formState.errors.department_id} errorMessage={currentFormMethods.formState.errors.department_id?.message}>
        <Controller name="department_id" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Department (Optional)" options={departmentOptions} value={departmentOptions.find(o => o.value === field.value) || (field.value === "" ? { value: "", label: "None / All Departments" } : null)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbBuildingArch />} />)} />
      </FormItem>
      <FormItem label={<div>Status<span className="text-red-500"> * </span></div>} invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message} className="md:col-span-2">
        <Controller name="status" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={statusOptions} value={statusOptions.find((o) => o.value === field.value) || null} onChange={(opt) => field.onChange(opt?.value)} />)} />
      </FormItem>
    </div>
  );

  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  const renderCardContent = (content: number | undefined) => {
    if (initialLoading) {
      return <Skeleton width={40} height={20} />;
    }
    return <h6 className="font-bold">{content ?? 0}</h6>;
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Auto Email Templates</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={!isDataReady}>Add New</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4 gap-2">
            <Tooltip title="Click to show all templates"><div onClick={() => handleCardClick('all')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbAlignBoxCenterBottom size={24} /></div><div><div className="text-blue-500">{renderCardContent((autoEmailTemplatesData as any)?.counts?.total)}</div><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show active templates"><div onClick={() => handleCardClick('Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbBuildingCog size={24} /></div><div><div className="text-violet-500">{renderCardContent((autoEmailTemplatesData as any)?.counts?.active)}</div><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show inactive templates"><div onClick={() => handleCardClick('Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbBuildingOff size={24} /></div><div><div className="text-red-500">{renderCardContent((autoEmailTemplatesData as any)?.counts?.inactive)}</div><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
            <Tooltip title="Total times templates were used"><Card bodyClass={cardBodyClass} className="rounded-md border border-green-200 cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbMailForward size={24} /></div><div><div className="text-green-500">{renderCardContent((autoEmailTemplatesData as any)?.counts?.count_used)}</div><span className="font-semibold text-xs">Count Used</span></div></Card></Tooltip>
          </div>
          <div className="mb-4">
            <AutoEmailTemplatesTableTools
              onClearFilters={onClearFilters}
              onSearchChange={handleSearchInputChange}
              onFilter={openFilterDrawer}
              onExport={handleOpenExportReasonModal}
              columns={columns}
              filteredColumns={filteredColumns}
              setFilteredColumns={setFilteredColumns}
              activeFilterCount={activeFilterCount}
              isDataReady={isDataReady}
            />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4">
            <AutoEmailTemplatesTable columns={filteredColumns} data={pageData} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>
      <AutoEmailTemplatesSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <Drawer title={editingItem ? "Edit Auto Email Template" : "Add New Auto Email Template"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={480}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> <Button size="sm" variant="solid" form="autoEmailTemplateForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button> </div>} >
        <Form id="autoEmailTemplateForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-4 relative">
          {renderDrawerForm(formMethods)}
        </Form>
        {isEditDrawerOpen && editingItem && (
          <div className="">
            <div className="grid grid-cols-[2fr_3fr] text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
              <div>
                <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
                <p className="text-sm font-semibold">{editingItem.updated_by_user?.name || "N/A"}</p>
                <p>{editingItem.updated_by_user?.roles?.[0]?.display_name || "N/A"}</p>
              </div>
              <div className="text-right">
                <br />
                <span className="font-semibold">Created At:</span>{" "}<span>{editingItem.created_at ? dayjs(editingItem.created_at).format("D MMM YYYY, h:mm A") : "N/A"}</span><br />
                <span className="font-semibold">Updated At:</span>{" "}<span>{editingItem.updated_at ? dayjs(editingItem.updated_at).format("D MMM YYYY, h:mm A") : "N/A"}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterAutoEmailTemplateForm" type="submit">Apply</Button> </div>}
      >
        <Form id="filterAutoEmailTemplateForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Email Type"><Controller name="filterEmailTypes" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Email Type" options={(autoEmailTemplatesData as any)?.data?.map((t: any) => ({ value: t.email_type, label: t.email_type })).filter((v: any, i: any, a: any) => a.findIndex((item: any) => item.value === v.value) === i)} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Template Key"><Controller name="filterTemplateKeys" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Template Key" options={(autoEmailTemplatesData as any)?.data?.map((t: any) => ({ value: t.template_key, label: t.template_key })).filter((v: any, i: any, a: any) => a.findIndex((item: any) => item.value === v.value) === i)} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Category"><Controller name="filterCategoryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Category" options={categoryOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Department"><Controller name="filterDepartmentIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Department" options={departmentOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Status" options={statusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Auto Email Template" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} >
        <p>Are you sure you want to delete the template "<strong>{itemToDelete?.email_type} - {itemToDelete?.template_key}</strong>"?</p>
      </ConfirmDialog>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
        <Form id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
          <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>
      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} width={600}>
        <div className="flex justify-center items-center p-4">{imageView ? <img src={imageView} alt="User" className="max-w-full max-h-[80vh]" /> : <p>No image.</p>}</div>
      </Dialog>
    </>
  );
};

export default AutoEmailTemplatesListing;