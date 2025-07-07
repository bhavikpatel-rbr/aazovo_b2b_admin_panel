// src/views/your-path/EmailTemplatesListing.tsx

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
import DebounceInput from "@/components/shared/DebouceInput";
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
  TbX,
  TbMailBolt,
  TbKey,
  TbCategory2,
  TbApps,
  TbBuildingArch,
  TbUsersGroup,
  TbBuildingCommunity,
  TbBriefcase,
  TbVariable,
  TbTrash,
  TbFileDescription,
  TbReload,
  TbMailForward,
  TbAlignBoxCenterBottom,
  TbBuildingCog,
  TbBuildingOff,
  TbColumns,
  TbUserCircle,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getEmailTemplatesAction,
  addEmailTemplateAction,
  editEmailTemplateAction,
  deleteEmailTemplateAction,
  deleteAllEmailTemplatesAction,
  getCategoriesAction,
  getSubcategoriesByCategoryIdAction,
  getBrandAction,
  getRolesAction,
  getDepartmentsAction,
  getDesignationsAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import dayjs from "dayjs";
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";

// --- Define Types ---
export type SelectOption = { value: string; label: string; };
export type ApiLookupItem = { id: string | number; name: string; };

export interface TemplateVariable {
  name: string;
  type: "string" | "number" | "date" | "boolean" | "array";
}

export type EmailTemplateItem = {
  id: string | number;
  name: string;
  template_id: string;
  category_id: string;
  sub_category_id: string | null;
  brand_id: string | null;
  role_id: string | null;
  department_id: string | null;
  designation_id: string | null;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  title?: string;
  variables?: TemplateVariable[];
  category?: { id: string | number; name: string };
  sub_category?: { id: string | number; name: string };
  brand?: { id: string | number; name: string };
  role?: { id: string | number; name: string };
  department?: { id: string | number; name: string };
  designation?: { id: string | number; name: string };
  updated_by_user?: { name: string; roles: { display_name: string }[] } | null;
  created_by_user?: { name: string; roles: { display_name: string }[] } | null;
  // UI Display helpers
  categoryName?: string;
  subCategoryName?: string;
  brandName?: string;
  roleName?: string;
  departmentName?: string;
  designationName?: string;
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Status Options ---
const statusOptions: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const variableTypeOptions: SelectOption[] = [
  { value: "string", label: "String" }, { value: "number", label: "Number" },
  { value: "date", label: "Date" }, { value: "boolean", label: "Boolean" },
  { value: "array", label: "Array" },
];

// --- Zod Schema for Add/Edit Email Template Form ---
const variableSchema = z.object({
  name: z.string().min(1, "Variable name is required.").max(50, "Name too long"),
  type: z.enum(["string", "number", "date", "boolean", "array"], { required_error: "Variable type is required." }),
});

const emailTemplateFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  template_id: z.string().min(1, "Template ID is required.").max(50, "Template ID cannot exceed 50 characters.").regex(/^[A-Za-z0-9_.-]+$/, "ID can only contain alphanumeric, underscore, dot, or hyphen."),
  category_id: z.string().min(1, "Category is required."),
  sub_category_id: z.string().nullable().optional(),
  brand_id: z.string().nullable().optional(),
  role_id: z.string().nullable().optional(),
  department_id: z.string().nullable().optional(),
  designation_id: z.string().nullable().optional(),
  title: z.string().min(1, "Title is required.").max(200, "Title too long."),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required." }),
  variables: z.array(variableSchema).optional().default([]),
});
type EmailTemplateFormData = z.infer<typeof emailTemplateFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterTemplateIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCategoryIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterSubCategoryIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterBrandIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterRoleIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDepartmentIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDesignationIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter ---
const CSV_HEADERS = ["ID", "Name", "Template ID", "Category", "SubCategory", "Brand", "Role", "Department", "Designation", "Status", "Updated By", "Updated Role", "Updated At"];
type EmailTemplateExportItem = Omit<EmailTemplateItem, 'created_at' | 'updated_at' | 'created_by_user' | 'updated_by_user' | 'category' | 'sub_category' | 'brand' | 'role' | 'department' | 'designation'> & { updated_at_formatted?: string; };
const CSV_KEYS: (keyof EmailTemplateExportItem)[] = ["id", "name", "template_id", "categoryName", "subCategoryName", "brandName", "roleName", "departmentName", "designationName", "status", "updated_by_name", "updated_by_role", "updated_at_formatted",];
function exportToCsv(filename: string, rows: EmailTemplateItem[]) { if (!rows || !rows.length) { return false; } const preparedRows: EmailTemplateExportItem[] = rows.map(row => ({ id: row.id, name: row.name, template_id: row.template_id, categoryName: row.categoryName, subCategoryName: row.subCategoryName, brandName: row.brandName, roleName: row.roleName, departmentName: row.departmentName, designationName: row.designationName, status: row.status, updated_by_name: row.updated_by_user?.name || "N/A", updated_by_role: row.updated_by_user?.roles?.[0]?.display_name || "N/A", updated_at_formatted: row.updated_at ? dayjs(row.updated_at).format('DD/MM/YYYY hh:mm A') : "N/A", })); const separator = ","; const csvContent = CSV_HEADERS.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n"); const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); const link = document.createElement("a"); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; } toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false; }

// --- Components (ActionColumn, etc.) ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => (<div className="flex items-center justify-center gap-2"><Tooltip title="Edit"><div className="text-xl cursor-pointer text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500" role="button" onClick={onEdit}><TbPencil /></div></Tooltip><Tooltip title="Send test email"><div className="text-xl cursor-pointer text-gray-500 hover:text-orange-600" role="button"><TbMailForward size={18} /></div></Tooltip><Tooltip title="View Template"><div className="text-xl cursor-pointer text-gray-500 hover:text-blue-600" role="button"><TbAlignBoxCenterBottom size={18} /></div></Tooltip><Tooltip title="Delete"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" role="button" onClick={onDelete}><TbTrash /></div></Tooltip></div>);
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(({ onInputChange }, ref) => (<DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
ItemSearch.displayName = "ItemSearch";

const EmailTemplatesTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<EmailTemplateItem>[];
  filteredColumns: ColumnDef<EmailTemplateItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<EmailTemplateItem>[]>>;
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
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload"></Button>
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">
          Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
        </Button>
        <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
      </div>
    </div>
  );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData,
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const { filterNames, filterTemplateIds, filterCategoryIds, filterSubCategoryIds, filterBrandIds, filterRoleIds, filterDepartmentIds, filterDesignationIds, filterStatus } = filterData;
  const hasFilters = [filterNames, filterTemplateIds, filterCategoryIds, filterSubCategoryIds, filterBrandIds, filterRoleIds, filterDepartmentIds, filterDesignationIds, filterStatus].some(f => f && f.length > 0);
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {filterNames?.map(item => <Tag key={`name-${item.value}`} prefix>Name: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterNames', item.value)} /></Tag>)}
      {filterTemplateIds?.map(item => <Tag key={`id-${item.value}`} prefix>ID: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterTemplateIds', item.value)} /></Tag>)}
      {filterCategoryIds?.map(item => <Tag key={`cat-${item.value}`} prefix>Cat: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterCategoryIds', item.value)} /></Tag>)}
      {filterDepartmentIds?.map(item => <Tag key={`dept-${item.value}`} prefix>Dept: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterDepartmentIds', item.value)} /></Tag>)}
      {filterStatus?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatus', item.value)} /></Tag>)}
      {/* Add other filters as needed */}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};

type EmailTemplatesTableProps = { columns: ColumnDef<EmailTemplateItem>[]; data: EmailTemplateItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: EmailTemplateItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: EmailTemplateItem) => void; onAllRowSelect: (checked: boolean, rows: Row<EmailTemplateItem>[]) => void; };
const EmailTemplatesTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: EmailTemplatesTableProps) => (<DataTable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} />);
type EmailTemplatesSelectedFooterProps = { selectedItems: EmailTemplateItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const EmailTemplatesSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: EmailTemplatesSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; return (<> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold"> {selectedItems.length} Template{selectedItems.length > 1 ? "s" : ""} selected </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Template(s)`} onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }}> <p>Are you sure you want to delete selected template(s)?</p> </ConfirmDialog> </>); };

const EmailTemplatesListing = () => {
  const dispatch = useAppDispatch();
  const {
    emailTemplatesData: rawEmailTemplatesData = {},
    CategoriesData = [],
    subCategoriesForSelectedCategoryData,
    aetSubCategories = [],
    BrandData = [],
    Roles = [],
    departmentsData = [],
    designationsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingExport, setIsSubmittingExport] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplateItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "updated_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<EmailTemplateItem[]>([]);

  const emailTemplatesData = useMemo(() => (rawEmailTemplatesData as any)?.data || [], [rawEmailTemplatesData]);
  const counts = useMemo(() => (rawEmailTemplatesData as any)?.counts || {}, [rawEmailTemplatesData]);

  const categoryOptions = useMemo(() => Array.isArray(CategoriesData) ? CategoriesData?.map((c: ApiLookupItem) => ({ value: String(c.id), label: c.name })) : [], [CategoriesData]);
  const allSubCategoryOptionsForFilter = useMemo(() => Array.isArray(aetSubCategories) ? aetSubCategories.map((sc: ApiLookupItem) => ({ value: String(sc.id), label: sc.name })) : [], [aetSubCategories]);
  const brandOptions = useMemo(() => Array.isArray(BrandData) ? BrandData.map((b: ApiLookupItem) => ({ value: String(b.id), label: b.name })) : [], [BrandData]);
  const roleOptions = useMemo(() => Array.isArray(Roles) ? Roles.map((r: ApiLookupItem) => ({ value: String(r.id), label: r.display_name })) : [], [Roles]);
  const departmentOptions = useMemo(() => Array.isArray(departmentsData?.data) ? departmentsData?.data.map((d: ApiLookupItem) => ({ value: String(d.id), label: d.name })) : [], [departmentsData?.data]);
  const designationOptions = useMemo(() => Array.isArray(designationsData?.data) ? designationsData?.data.map((d: ApiLookupItem) => ({ value: String(d.id), label: d.name })) : [], [designationsData?.data]);

  const [subCategoryOptionsForForm, setSubcategoryOptions] = useState<{ value: number; label: string }[]>([]);
  
  useEffect(() => {
    if (subCategoriesForSelectedCategoryData) {
      setSubcategoryOptions(subCategoriesForSelectedCategoryData?.map((sc: any) => ({ value: sc.id, label: sc.name, })) || []);
    }
  }, [subCategoriesForSelectedCategoryData]);
  useEffect(() => {
    dispatch(getEmailTemplatesAction());
    dispatch(getCategoriesAction());
    dispatch(getBrandAction());
    dispatch(getRolesAction());
    dispatch(getDepartmentsAction());
    dispatch(getDesignationsAction());
    // dispatch(getSubcategoriesByCategoryIdAction());
  }, [dispatch]);

  const formMethods = useForm<EmailTemplateFormData>({ resolver: zodResolver(emailTemplateFormSchema), mode: "onChange" });
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = formMethods;
  const variablesFieldArray = useFieldArray({ control, name: "variables" });
  const selectedCategoryIdForForm = watch("category_id");

  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: 'onChange' });

  useEffect(() => {
    if (selectedCategoryIdForForm && (isAddDrawerOpen || isEditDrawerOpen)) {
      setSubcategoryOptions([]);
      dispatch(getSubcategoriesByCategoryIdAction(selectedCategoryIdForForm));
      setValue("sub_category_id", null, { shouldValidate: true, shouldDirty: true });
    }
  }, [selectedCategoryIdForForm, dispatch, isAddDrawerOpen, isEditDrawerOpen, setValue]);

  const openAddDrawer = useCallback(() => {
    reset({ name: "", template_id: "", category_id: categoryOptions[0]?.value || "", sub_category_id: null, brand_id: null, role_id: null, department_id: null, designation_id: null, title: "", status: "Active", variables: [], });
    variablesFieldArray.replace([]);
    setEditingTemplate(null);
    if (categoryOptions[0]?.value) { dispatch(getSubcategoriesByCategoryIdAction(categoryOptions[0].value)); }
    setIsAddDrawerOpen(true);
  }, [reset, categoryOptions, variablesFieldArray, dispatch]);

  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  // --- REFACTORED Edit Drawer Logic ---
  const openEditDrawer = useCallback((template: EmailTemplateItem) => {
    setEditingTemplate(template);
    setIsEditDrawerOpen(true);
  }, []);

  useEffect(() => {
    if (isEditDrawerOpen && editingTemplate) {
      const populateForm = async () => {
        const initialCategoryId = String(editingTemplate.category_id);
        try {
          if (initialCategoryId) {
            await dispatch(getSubcategoriesByCategoryIdAction(initialCategoryId)).unwrap();
          }
        } catch (error) {
          console.error("Failed to fetch subcategories for edit form:", error);
        }

        reset({
          name: editingTemplate.name,
          template_id: editingTemplate.template_id,
          category_id: initialCategoryId,
          sub_category_id: editingTemplate.sub_category_id ? String(editingTemplate.sub_category_id) : null,
          brand_id: editingTemplate.brand_id ? String(editingTemplate.brand_id) : null,
          role_id: editingTemplate.role_id ? String(editingTemplate.role_id) : null,
          department_id: editingTemplate.department_id ? String(editingTemplate.department_id) : null,
          designation_id: editingTemplate.designation_id ? String(editingTemplate.designation_id) : null,
          title: editingTemplate.title || "",
          status: editingTemplate.status || 'Active',
          variables: editingTemplate.variables || [],
        });
      };
      populateForm();
    }
  }, [isEditDrawerOpen, editingTemplate, dispatch, reset]);

  const closeEditDrawer = useCallback(() => { setEditingTemplate(null); setIsEditDrawerOpen(false); }, []);

  const onSubmitHandler = async (data: EmailTemplateFormData) => {
    setIsSubmitting(true);
    const apiPayload = { ...data };
    try {
      if (editingTemplate) {
        await dispatch(editEmailTemplateAction({ id: editingTemplate.id, ...apiPayload })).unwrap();
        toast.push(<Notification title="Template Updated" type="success" duration={2000} />);
        closeEditDrawer();
      } else {
        await dispatch(addEmailTemplateAction(apiPayload)).unwrap();
        toast.push(<Notification title="Template Added" type="success" duration={2000} />);
        closeAddDrawer();
      }
      dispatch(getEmailTemplatesAction());
    } catch (e: any) {
      const errorMessage = e?.data?.message || e?.message || (editingTemplate ? "Update Failed" : "Add Failed");
      toast.push(<Notification title={editingTemplate ? "Update Failed" : "Add Failed"} type="danger" duration={3000}>{errorMessage}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = useCallback((item: EmailTemplateItem) => { setTemplateToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!templateToDelete) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteEmailTemplateAction({ id: templateToDelete.id })).unwrap(); toast.push(<Notification title="Template Deleted" type="success" duration={2000}>{`Template "${templateToDelete.name}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((d) => d.id !== templateToDelete!.id)); dispatch(getEmailTemplatesAction()); } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{(e as Error).message}</Notification>); } finally { setIsDeleting(false); setTemplateToDelete(null); } }, [dispatch, templateToDelete]);
  const handleDeleteSelected = useCallback(async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const idsToDelete = selectedItems.map((item) => String(item.id)); try { await dispatch(deleteAllEmailTemplatesAction({ ids: idsToDelete.join(',') })).unwrap(); toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{`${idsToDelete.length} template(s) deleted.`}</Notification>); setSelectedItems([]); dispatch(getEmailTemplatesAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{(e as Error).message}</Notification>); } finally { setIsDeleting(false); } }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer]);
  const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); dispatch(getEmailTemplatesAction()); setIsFilterDrawerOpen(false); }, [filterFormMethods, dispatch]);

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

  const handleOpenExportModal = () => { if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportModalOpen(true); };
  const handleConfirmExport = async (data: ExportReasonFormData) => { setIsSubmittingExport(true); const moduleName = "Email Templates"; const date = new Date().toISOString().split("T")[0]; const fileName = `email_templates_${date}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap(); const success = exportToCsv(fileName, allFilteredAndSortedData); if (success) { toast.push(<Notification title="Data Exported" type="success">Templates exported successfully.</Notification>); } setIsExportModalOpen(false); } catch (error: any) { toast.push(<Notification title="Operation Failed" type="danger">{error.message || "Could not complete export."}</Notification>); } finally { setIsSubmittingExport(false); } };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataWithDisplayNames: EmailTemplateItem[] =
      Array.isArray(emailTemplatesData) ? emailTemplatesData.map(item => ({ ...item, status: item.status || "Inactive", categoryName: item.category?.name || categoryOptions.find(c => c.value === String(item.category_id))?.label || String(item.category_id), subCategoryName: item.sub_category?.name || allSubCategoryOptionsForFilter.find(sc => sc.value === String(item.sub_category_id))?.label || (item.sub_category_id ? String(item.sub_category_id) : "N/A"), brandName: item.brand?.name || brandOptions.find(b => b.value === String(item.brand_id))?.label || (item.brand_id ? String(item.brand_id) : "N/A"), roleName: item.role?.name || roleOptions.find(r => r.value === String(item.role_id))?.label || (item.role_id ? String(item.role_id) : "N/A"), departmentName: item.department?.name || departmentOptions.find(d => d.value === String(item.department_id))?.label || (item.department_id ? String(item.department_id) : "N/A"), designationName: item.designation?.name || designationOptions.find(d => d.value === String(item.designation_id))?.label || (item.designation_id ? String(item.designation_id) : "N/A"), })) : [];

    let processedData = cloneDeep(sourceDataWithDisplayNames);
    if (filterCriteria.filterStatus?.length) { const statuses = filterCriteria.filterStatus.map(s => s.value); processedData = processedData.filter(item => statuses.includes(item.status)); }
    if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(q))); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { processedData.sort((a, b) => { const aVal = a[key as keyof EmailTemplateItem]; const bVal = b[key as keyof EmailTemplateItem]; if (key === 'updated_at' || key === 'created_at') { return order === 'asc' ? dayjs(aVal as string).diff(dayjs(bVal as string)) : dayjs(bVal as string).diff(dayjs(aVal as string)); } return order === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal)); }); }

    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [emailTemplatesData, tableData, filterCriteria, categoryOptions, allSubCategoryOptionsForFilter, brandOptions, roleOptions, departmentOptions, designationOptions]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filterCriteria).filter(value => Array.isArray(value) && value.length > 0).length;
  }, [filterCriteria]);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [viewerImageSrc, setViewerImageSrc] = useState<string | null>(null);

  const openImageViewer = useCallback((src?: string) => { if (src) { setViewerImageSrc(src); setIsImageViewerOpen(true); } }, []);
  const closeImageViewer = useCallback(() => { setIsImageViewerOpen(false); setViewerImageSrc(null); }, []);

  const handlePaginationChange = useCallback((page: number) => setTableData(prev => ({ ...prev, pageIndex: page })), []);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData(prev => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleSearchInputChange = useCallback((query: string) => { setTableData(prev => ({ ...prev, query: query, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: EmailTemplateItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<EmailTemplateItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<EmailTemplateItem>[] = useMemo(() => [
    { header: "Name / ID", accessorKey: "name", size: 200, cell: props => <div><span className="font-semibold">{props.row.original.name}</span><div className="text-xs text-gray-500 dark:text-gray-400">{props.row.original.template_id}</div></div> },
    { header: "Category", accessorKey: "category_id", size: 130, cell: props => <Tooltip title={props.row.original.categoryName || String(props.getValue())}><span className="truncate block max-w-[120px]">{props.row.original.categoryName || String(props.getValue())}</span></Tooltip> },
    { header: "SubCategory", accessorKey: "sub_category_id", size: 130, cell: props => <Tooltip title={props.row.original.subCategoryName || (props.getValue() ? String(props.getValue()) : "N/A")}><span className="truncate block max-w-[120px]">{props.row.original.subCategoryName || (props.getValue() ? String(props.getValue()) : "N/A")}</span></Tooltip> },
    { header: "Department", accessorKey: "department_id", size: 130, cell: props => <Tooltip title={props.row.original.departmentName || (props.getValue() ? String(props.getValue()) : "N/A")}><span className="truncate block max-w-[120px]">{props.row.original.departmentName || (props.getValue() ? String(props.getValue()) : "N/A")}</span></Tooltip> },
    { header: "Status", accessorKey: "status", enableSorting: true, size: 100, cell: (props) => { const status = props.row.original.status; return (<Tag className={classNames("capitalize font-semibold whitespace-nowrap", { "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500": status === "Active", "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500": status === "Inactive", })}>{status}</Tag>); } },
    {
      header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 220, cell: (props) => {
        const { updated_at, updated_by_user } = props.row.original;
        return (
          <div className="flex items-center gap-2">
            <Avatar src={updated_by_user?.profile_pic_path} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path)} />
            <div>
              <span className='font-semibold'>{updated_by_user?.name || 'N/A'}</span>
              <div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div>
              <div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div>
            </div>
          </div>
        );
      }
    }, { header: "Actions", id: "actions", size: 120, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
  ], [openEditDrawer, handleDeleteClick]);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<EmailTemplateItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const renderDrawerForm = (currentFormMethods: typeof formMethods, currentVariablesArray: typeof variablesFieldArray) => {
    const { control: currentControl, formState: { errors: currentErrors }, watch: currentWatch } = currentFormMethods;
    const watchedCategoryIdInForm = currentWatch("category_id");
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormItem label={<div>Name<span className="text-red-500"> * </span></div>} invalid={!!currentErrors.name} errorMessage={currentErrors.name?.message}><Controller name="name" control={currentControl} render={({ field }) => (<Input {...field} prefix={<TbMailBolt />} placeholder="Internal Template Name" />)} /></FormItem>
        <FormItem label={<div>Template ID<span className="text-red-500"> * </span></div>} invalid={!!currentErrors.template_id} errorMessage={currentErrors.template_id?.message}><Controller name="template_id" control={currentControl} render={({ field }) => (<Input {...field} prefix={<TbKey />} placeholder="e.g., WELCOME_EMAIL_V1" />)} /></FormItem>
        <FormItem label={<div>Title (Email Subject / Header)<span className="text-red-500"> * </span></div>} className="md:col-span-2" invalid={!!currentErrors.title} errorMessage={currentErrors.title?.message}><Controller name="title" control={currentControl} render={({ field }) => (<Input {...field} prefix={<TbFileDescription />} placeholder="Actual Email Title/Subject" />)} /></FormItem>
        <FormItem label={<div>Category<span className="text-red-500"> * </span></div>} invalid={!!currentErrors.category_id} errorMessage={currentErrors.category_id?.message}><Controller name="category_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Category" options={categoryOptions} value={categoryOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbCategory2 />} />)} /></FormItem>
        <FormItem label="SubCategory" invalid={!!currentErrors.sub_category_id} errorMessage={currentErrors.sub_category_id?.message}><Controller name="sub_category_id" control={currentControl} render={({ field }) => (<Select placeholder="Select SubCategory" options={subCategoryOptionsForForm} value={subCategoryOptionsForForm.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbApps />} isDisabled={!watchedCategoryIdInForm || subCategoryOptionsForForm.length === 0} loading={masterLoadingStatus === "loading"} />)} /></FormItem>
        <FormItem label="Brand" invalid={!!currentErrors.brand_id} errorMessage={currentErrors.brand_id?.message}><Controller name="brand_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Brand" options={brandOptions} value={brandOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbBuildingArch />} />)} /></FormItem>
        <FormItem label="Role" invalid={!!currentErrors.role_id} errorMessage={currentErrors.role_id?.message}><Controller name="role_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Role" options={roleOptions} value={roleOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbUsersGroup />} />)} /></FormItem>
        <FormItem label="Department" invalid={!!currentErrors.department_id} errorMessage={currentErrors.department_id?.message}><Controller name="department_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Department" options={departmentOptions} value={departmentOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbBuildingCommunity />} />)} /></FormItem>
        <FormItem label="Designation" invalid={!!currentErrors.designation_id} errorMessage={currentErrors.designation_id?.message}><Controller name="designation_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Designation" options={designationOptions} value={designationOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbBriefcase />} />)} /></FormItem>
        <FormItem label={<div>Status<span className="text-red-500"> * </span></div>} className="md:col-span-2" invalid={!!currentErrors.status} errorMessage={currentErrors.status?.message}><Controller name="status" control={currentControl} render={({ field }) => (<Select placeholder="Select Status" options={statusOptions} value={statusOptions.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></FormItem>
        <div className="md:col-span-2 mt-4"><label className="form-label mb-2 block font-semibold">Template Variables</label>{currentVariablesArray.fields.map((item, index) => (<div key={item.id} className="flex items-start gap-2 mb-3 p-3 border rounded-md dark:border-gray-700"><FormItem label={`Name ${index + 1}*`} className="flex-grow" invalid={!!currentErrors.variables?.[index]?.name} errorMessage={currentErrors.variables?.[index]?.name?.message}><Controller name={`variables.${index}.name`} control={currentControl} render={({ field }) => (<Input {...field} placeholder="e.g., userName" />)} /></FormItem><FormItem label={`Type ${index + 1}*`} className="flex-grow" invalid={!!currentErrors.variables?.[index]?.type} errorMessage={currentErrors.variables?.[index]?.type?.message}><Controller name={`variables.${index}.type`} control={currentControl} render={({ field }) => (<Select {...field} options={variableTypeOptions} placeholder="Select Type" value={variableTypeOptions.find(opt => opt.value === field.value)} onChange={(option) => field.onChange(option?.value)} />)} /></FormItem><Button shape="circle" size="sm" icon={<TbX />} className="mt-7" onClick={() => currentVariablesArray.remove(index)} type="button" /></div>))}<Button type="button" variant="outline" size="sm" onClick={() => currentVariablesArray.append({ name: "", type: "string" })} icon={<TbVariable />}>Add Variable</Button></div>
      </div>
    );
  };

  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Email Templates</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
          </div>
          <div className="grid grid-cols-4 mb-4 gap-2">
            <Tooltip title="Click to show all templates"><div onClick={() => handleCardClick('all')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbAlignBoxCenterBottom size={24} /></div><div><h6 className="text-blue-500">{counts.total ?? '0'}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show active templates"><div onClick={() => handleCardClick('Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbBuildingCog size={24} /></div><div><h6 className="text-violet-500">{counts.active ?? '0'}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show inactive templates"><div onClick={() => handleCardClick('Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbBuildingOff size={24} /></div><div><h6 className="text-red-500">{counts.inactive ?? '0'}</h6><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
            <Tooltip title="Total times templates were used"><Card bodyClass={cardBodyClass} className="rounded-md border border-green-200 cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbMailForward size={24} /></div><div><h6 className="text-green-500">{counts.total_used_count ?? '0'}</h6><span className="font-semibold text-xs">Count Used</span></div></Card></Tooltip>
          </div>
          <div className="mb-4">
            <EmailTemplatesTableTools
              onSearchChange={handleSearchInputChange}
              onFilter={openFilterDrawer}
              onExport={handleOpenExportModal}
              onClearFilters={onClearFilters}
              columns={columns}
              filteredColumns={filteredColumns}
              setFilteredColumns={setFilteredColumns}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4">
            <EmailTemplatesTable columns={filteredColumns} data={pageData} loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>
      <EmailTemplatesSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <Drawer title={editingTemplate ? "Edit Email Template" : "Add New Email Template"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingTemplate ? closeEditDrawer : closeAddDrawer} onRequestClose={editingTemplate ? closeEditDrawer : closeAddDrawer} width={600}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={editingTemplate ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> <Button size="sm" variant="solid" form="emailTemplateForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button> </div>} >
        <Form id="emailTemplateForm" onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-4 relative">
          {renderDrawerForm(formMethods, variablesFieldArray)}
          {isEditDrawerOpen && editingTemplate && (
            <div className="">
              <div className="grid grid-cols-[2fr_3fr] text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                <div>
                  <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
                  <p className="text-sm font-semibold">{editingTemplate.updated_by_user?.name || "N/A"}</p>
                  <p>{editingTemplate.updated_by_user?.roles?.[0]?.display_name || "N/A"}</p>
                </div>
                <div className="text-right">
                  <br />
                  <span className="font-semibold">Created At:</span>{" "}<span>{editingTemplate.created_at ? dayjs(editingTemplate.created_at).format("D MMM YYYY, h:mm A") : "N/A"}</span><br />
                  <span className="font-semibold">Updated At:</span>{" "}<span>{editingTemplate.updated_at ? dayjs(editingTemplate.updated_at).format("D MMM YYYY, h:mm A") : "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </Form>
      </Drawer>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400}
        footer={<div className="text-right w-full flex justify-end gap-2"> <Button size="sm" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterEmailTemplatesForm" type="submit">Apply</Button> </div>}
      >
        <Form id="filterEmailTemplatesForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Name"><Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Name" options={emailTemplatesData.map(t => ({ value: t.name, label: t.name })).filter((v, i, a) => a.findIndex(item => item.value === v.value) === i)} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Template ID"><Controller name="filterTemplateIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Template ID" options={emailTemplatesData.map(t => ({ value: t.template_id, label: t.template_id })).filter((v, i, a) => a.findIndex(item => item.value === v.value) === i)} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Category"><Controller name="filterCategoryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Category" options={categoryOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="SubCategory"><Controller name="filterSubCategoryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any SubCategory" options={allSubCategoryOptionsForFilter} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Status" options={statusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Department"><Controller name="filterDepartmentIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Department" options={departmentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Email Template" onClose={() => { setSingleDeleteConfirmOpen(false); setTemplateToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setTemplateToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setTemplateToDelete(null); }} ><p>Are you sure you want to delete template "<strong>{templateToDelete?.name} ({templateToDelete?.template_id})</strong>"? This action cannot be undone.</p></ConfirmDialog>
      <ConfirmDialog isOpen={isExportModalOpen} type="info" title="Reason for Exporting" onClose={() => setIsExportModalOpen(false)} onRequestClose={() => setIsExportModalOpen(false)} onCancel={() => setIsExportModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExport)} loading={isSubmittingExport} confirmText={isSubmittingExport ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExport }} >
        <Form id="exportTemplatesReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExport)(); }} className="flex flex-col gap-4 mt-2">
          <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>

      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} width={600}>
        <div className="flex justify-center items-center p-4">{viewerImageSrc ? <img src={viewerImageSrc} alt="User" className="max-w-full max-h-[80vh]" /> : <p>No image.</p>}</div>
      </Dialog>
    </>
  );
};

export default EmailTemplatesListing;