// src/views/your-path/EmailTemplatesListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, useFieldArray, FieldError }  from "react-hook-form";
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
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbEye,
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
  getSubcategoriesByCategoryIdAction, // Added
  // getSubCategoriesForTemplatesAction, // This might be for fetching ALL subcategories for filter
  getBrandAction,
  getRolesAction,
  getDepartmentsAction,
  getDesignationsAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";


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
  created_at: string;
  updated_at: string;
  categoryName?: string;
  subCategoryName?: string;
  brandName?: string;
  roleName?: string;
  departmentName?: string;
  designationName?: string;
  // For Add/Edit, not in list typically
  title?: string;
  variables?: TemplateVariable[];
  category?: { id: string | number; name: string }; // If API nests category object
  department?: { id: string | number; name: string }; // If API nests department object
};

// --- Zod Schema for Add/Edit Email Template Form ---
const variableSchema = z.object({
  name: z.string().min(1, "Variable name is required.").max(50, "Name too long"),
  type: z.enum(["string", "number", "date", "boolean", "array"], { required_error: "Variable type is required." }),
});

const emailTemplateFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  template_id: z.string().min(1, "Template ID is required.").max(50, "Template ID cannot exceed 50 characters."),
  category_id: z.string().min(1, "Category is required."),
  sub_category_id: z.string().nullable().optional(),
  brand_id: z.string().nullable().optional(),
  role_id: z.string().nullable().optional(),
  department_id: z.string().nullable().optional(),
  designation_id: z.string().nullable().optional(),
  title: z.string().min(1, "Title is required.").max(200, "Title too long."),
  variables: z.array(variableSchema).optional().default([]),
});
type EmailTemplateFormData = z.infer<typeof emailTemplateFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z.array(z.object({value: z.string(), label: z.string()})).optional(),
  filterTemplateIds: z.array(z.object({value: z.string(), label: z.string()})).optional(),
  filterCategoryIds: z.array(z.object({value: z.string(), label: z.string()})).optional(),
  filterSubCategoryIds: z.array(z.object({value: z.string(), label: z.string()})).optional(),
  filterBrandIds: z.array(z.object({value: z.string(), label: z.string()})).optional(),
  filterRoleIds: z.array(z.object({value: z.string(), label: z.string()})).optional(),
  filterDepartmentIds: z.array(z.object({value: z.string(), label: z.string()})).optional(),
  filterDesignationIds: z.array(z.object({value: z.string(), label: z.string()})).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;


const variableTypeOptions: SelectOption[] = [
  { value: "string", label: "String" }, { value: "number", label: "Number" },
  { value: "date", label: "Date" }, { value: "boolean", label: "Boolean" },
  { value: "array", label: "Array" },
];

const CSV_HEADERS = ["ID", "Name", "Template ID", "Category", "SubCategory", "Brand", "Role", "Department", "Designation", "Created At"];
const CSV_KEYS: (keyof Pick<EmailTemplateItem, 'id'|'name'|'template_id'|'created_at'> | 'categoryName'|'subCategoryName'|'brandName'|'roleName'|'departmentName'|'designationName')[] = [
  "id", "name", "template_id", "categoryName", "subCategoryName", "brandName", "roleName", "departmentName", "designationName", "created_at",
];

function exportToCsv(filename: string, rows: EmailTemplateItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const preparedRows = rows.map(row => ({
    ...row,
    categoryName: row.categoryName || String(row.category_id),
    subCategoryName: row.subCategoryName || (row.sub_category_id ? String(row.sub_category_id) : "N/A"),
    brandName: row.brandName || (row.brand_id ? String(row.brand_id) : "N/A"),
    roleName: row.roleName || (row.role_id ? String(row.role_id) : "N/A"),
    departmentName: row.departmentName || (row.department_id ? String(row.department_id) : "N/A"),
    designationName: row.designationName || (row.designation_id ? String(row.designation_id) : "N/A"),
  }));
  const separator = ",";
  const csvContent = CSV_HEADERS.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support.</Notification>); return false;
}

const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; /* onViewDetail: () => void; */ }) => { return ( <div className="flex items-center justify-center gap-2"> <Tooltip title="Edit"><div className="text-xl cursor-pointer text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-500" role="button" onClick={onEdit}><TbPencil /></div></Tooltip> <Tooltip title="Delete"><div className="text-xl cursor-pointer text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500" role="button" onClick={onDelete}><TbTrash /></div></Tooltip> </div> ); };
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>( ({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void };
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: ItemTableToolsProps) => ( 
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> 
    <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div> 
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"> 
      <Tooltip title="Clear Filters">
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button>
      </Tooltip>
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> 
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> 
    </div> 
  </div> 
);

type EmailTemplatesTableProps = { columns: ColumnDef<EmailTemplateItem>[]; data: EmailTemplateItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: EmailTemplateItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: EmailTemplateItem) => void; onAllRowSelect: (checked: boolean, rows: Row<EmailTemplateItem>[]) => void; };
const EmailTemplatesTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: EmailTemplatesTableProps) => ( <DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} /> );
type EmailTemplatesSelectedFooterProps = { selectedItems: EmailTemplateItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const EmailTemplatesSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: EmailTemplatesSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; return ( <> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold"> {selectedItems.length} Template{selectedItems.length > 1 ? "s" : ""} selected </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Template(s)`} onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }}> <p>Are you sure you want to delete selected template(s)?</p> </ConfirmDialog> </> ); };


const EmailTemplatesListing = () => {
  const dispatch = useAppDispatch();
  const {
    emailTemplatesData = [],
    CategoriesData = [],
    // This will hold subcategories fetched by getSubcategoriesByCategoryIdAction
    subCategoriesForSelectedCategoryData = [], 
    // This might hold ALL subcategories if you have an action for that (for filter drawer)
    aetSubCategories = [], // Used for filter drawer, assumes it has all subcategories
    BrandData = [],
    Roles = [], // Ensure 'Roles' is the correct key from masterSlice
    departmentsData = [],
    designationsData = [],
    status: masterLoadingStatus = "idle",
    // Add a loading status specific to subcategory fetching if needed
    // statusSubCategoryFetch: masterLoadingStatusSubCategory = "idle", 
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplateItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<EmailTemplateItem[]>([]);
  
  // Options for general purpose (e.g., filter drawer)
  const categoryOptions = useMemo(() => Array.isArray(CategoriesData) ? CategoriesData.map((c: ApiLookupItem) => ({ value: String(c.id), label: c.name })) : [], [CategoriesData]);
  const allSubCategoryOptionsForFilter = useMemo(() => Array.isArray(aetSubCategories) ? aetSubCategories.map((sc: ApiLookupItem) => ({ value: String(sc.id), label: sc.name })) : [], [aetSubCategories]);
  const brandOptions = useMemo(() => Array.isArray(BrandData) ? BrandData.map((b: ApiLookupItem) => ({ value: String(b.id), label: b.name })) : [], [BrandData]);
    const roleOptions = useMemo(() => 
    Array.isArray(Roles) 
      ? Roles.map((r: ApiLookupItem) => ({ value: String(r.id), label: r.name })) 
      : [], 
  [Roles]);
  const departmentOptions = useMemo(() => Array.isArray(departmentsData) ? departmentsData.map((d: ApiLookupItem) => ({ value: String(d.id), label: d.name })) : [], [departmentsData]);
  const designationOptions = useMemo(() => Array.isArray(designationsData) ? designationsData.map((d: ApiLookupItem) => ({ value: String(d.id), label: d.name })) : [], [designationsData]);

  // Specific for Add/Edit Drawer - dynamically populated subcategories
  const subCategoryOptionsForForm = useMemo(() => Array.isArray(subCategoriesForSelectedCategoryData) ? subCategoriesForSelectedCategoryData.map((sc: ApiLookupItem) => ({ value: String(sc.id), label: sc.name })) : [], [subCategoriesForSelectedCategoryData]);


  useEffect(() => {
    dispatch(getRolesAction());
    dispatch(getEmailTemplatesAction());
    dispatch(getCategoriesAction());
    // Dispatch action to get ALL subcategories if needed for filter, e.g.,
    // dispatch(getSubCategoriesForTemplatesAction()); // Or a new action like getAllSubCategoriesAction()
    dispatch(getBrandAction());
    dispatch(getDepartmentsAction());
    dispatch(getDesignationsAction());
  }, [dispatch]);
  
  const formMethods = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateFormSchema),
    mode: "onChange",
  });
  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = formMethods; // Added setValue
  const variablesFieldArray = useFieldArray({ control, name: "variables" });
  const selectedCategoryIdForForm = watch("category_id"); // Watch selected category in the form

  // Effect to fetch subcategories when category_id changes in the form
  useEffect(() => {
    if (selectedCategoryIdForForm && (isAddDrawerOpen || isEditDrawerOpen)) {
        dispatch(getSubcategoriesByCategoryIdAction(selectedCategoryIdForForm));
        // Reset sub_category_id when category changes, directly in the form's context
        setValue("sub_category_id", null, { shouldValidate: true, shouldDirty: true });
    }
  }, [selectedCategoryIdForForm, dispatch, isAddDrawerOpen, isEditDrawerOpen, setValue]);
  
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    reset({
      name: "", template_id: "",
      category_id: categoryOptions[0]?.value || "", 
      sub_category_id: null, brand_id: null, role_id: null, department_id: null, designation_id: null,
      title: "", variables: [],
    });
    variablesFieldArray.replace([]);
    setEditingTemplate(null); 
    if (categoryOptions[0]?.value) {
        dispatch(getSubcategoriesByCategoryIdAction(categoryOptions[0].value));
        setValue("sub_category_id", null, { shouldValidate: true, shouldDirty: true }); // Ensure subcategory is reset
    } else {
        // If no default category, ensure subCategoryOptionsForForm is cleared if dependent on it
        // This is usually handled by subCategoriesForSelectedCategoryData becoming empty
    }
    setIsAddDrawerOpen(true);
  }, [reset, categoryOptions, variablesFieldArray, dispatch, setValue]);

  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(async (template: EmailTemplateItem) => {
    setEditingTemplate(template);
    const initialCategoryId = String(template.category_id);
    
    if (initialCategoryId) {
        await dispatch(getSubcategoriesByCategoryIdAction(initialCategoryId)).unwrap();
    }

    reset({
      name: template.name,
      template_id: template.template_id,
      category_id: initialCategoryId,
      sub_category_id: template.sub_category_id ? String(template.sub_category_id) : null,
      brand_id: template.brand_id ? String(template.brand_id) : null,
      role_id: template.role_id ? String(template.role_id) : null, // This should correctly set the role_id string for the form
      department_id: template.department_id ? String(template.department_id) : null,
      designation_id: template.designation_id ? String(template.designation_id) : null,
      title: template.title || `Edit - ${template.name}`, 
      variables: template.variables || [],
    });
    variablesFieldArray.replace(template.variables || []);
    setIsEditDrawerOpen(true);
    console.log(template.sub_category_id);
  }, [reset, variablesFieldArray, dispatch]);

  const closeEditDrawer = useCallback(() => { setEditingTemplate(null); setIsEditDrawerOpen(false); }, []);

  const onSubmitHandler = async (data: EmailTemplateFormData) => {
    setIsSubmitting(true);
    const apiPayload: any = { // Use 'any' temporarily or a more specific type for the payload
      ...data,
      category_id: data.category_id ? parseInt(data.category_id) : undefined, // Use undefined for optional fields if API expects them to be absent
      sub_category_id: data.sub_category_id ? parseInt(data.sub_category_id) : undefined,
      brand_id: data.brand_id ? parseInt(data.brand_id) : undefined,
      role_id: data.role_id ? parseInt(data.role_id) : undefined,
      department_id: data.department_id ? parseInt(data.department_id) : undefined,
      designation_id: data.designation_id ? parseInt(data.designation_id) : undefined,
      variables: data.variables?.map(v => ({ name: v.name, type: v.type })) || []
    };
    // Remove undefined keys before sending to API if necessary
    Object.keys(apiPayload).forEach(key => apiPayload[key] === undefined && delete apiPayload[key]);


    try {
      if (editingTemplate) {
        await dispatch(editEmailTemplateAction({ id: editingTemplate.id, ...apiPayload })).unwrap();
        toast.push(<Notification title="Template Updated" type="success" duration={2000}/>);
        closeEditDrawer();
      } else {
        await dispatch(addEmailTemplateAction(apiPayload)).unwrap();
        toast.push(<Notification title="Template Added" type="success" duration={2000}/>);
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
  const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1 })); }, [filterFormMethods]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataWithDisplayNames: EmailTemplateItem[] = 
        Array.isArray(emailTemplatesData) ? emailTemplatesData.map(item => ({
            ...item,
            categoryName: item.category?.name || categoryOptions.find(c => c.value === String(item.category_id))?.label || String(item.category_id),
            subCategoryName: (item as any).sub_category?.name || allSubCategoryOptionsForFilter.find(sc => sc.value === String(item.sub_category_id))?.label || (item.sub_category_id ? String(item.sub_category_id) : "N/A"),
            brandName: (item as any).brand?.name || brandOptions.find(b => b.value === String(item.brand_id))?.label || (item.brand_id ? String(item.brand_id) : "N/A"),
            roleName: (item as any).role?.name || roleOptions.find(r => r.value === String(item.role_id))?.label || (item.role_id ? String(item.role_id) : "N/A"),
            departmentName: item.department?.name || departmentOptions.find(d => d.value === String(item.department_id))?.label || (item.department_id ? String(item.department_id) : "N/A"),
            designationName: (item as any).designation?.name || designationOptions.find(d => d.value === String(item.designation_id))?.label || (item.designation_id ? String(item.designation_id) : "N/A"),
        })) : [];

    let processedData = cloneDeep(sourceDataWithDisplayNames);
    // Apply Filters
    if (filterCriteria.filterNames?.length) { const v = filterCriteria.filterNames.map(o => o.label.toLowerCase()); processedData = processedData.filter(item => v.includes(item.name.toLowerCase())); }
    if (filterCriteria.filterTemplateIds?.length) { const v = filterCriteria.filterTemplateIds.map(o => o.label.toLowerCase()); processedData = processedData.filter(item => v.includes(item.template_id.toLowerCase())); }
    if (filterCriteria.filterCategoryIds?.length) { const v = filterCriteria.filterCategoryIds.map(o => o.value); processedData = processedData.filter(item => v.includes(String(item.category_id))); }
    if (filterCriteria.filterSubCategoryIds?.length) { const v = filterCriteria.filterSubCategoryIds.map(o => o.value); processedData = processedData.filter(item => item.sub_category_id && v.includes(String(item.sub_category_id))); }
    if (filterCriteria.filterBrandIds?.length) { const v = filterCriteria.filterBrandIds.map(o => o.value); processedData = processedData.filter(item => item.brand_id && v.includes(String(item.brand_id))); }
    if (filterCriteria.filterRoleIds?.length) { const v = filterCriteria.filterRoleIds.map(o => o.value); processedData = processedData.filter(item => item.role_id && v.includes(String(item.role_id))); }
    if (filterCriteria.filterDepartmentIds?.length) { const v = filterCriteria.filterDepartmentIds.map(o => o.value); processedData = processedData.filter(item => item.department_id && v.includes(String(item.department_id))); }
    if (filterCriteria.filterDesignationIds?.length) { const v = filterCriteria.filterDesignationIds.map(o => o.value); processedData = processedData.filter(item => item.designation_id && v.includes(String(item.designation_id))); }

    if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => String(item.id).toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.template_id.toLowerCase().includes(q) || item.categoryName?.toLowerCase().includes(q) || item.departmentName?.toLowerCase().includes(q)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any = a[key as keyof EmailTemplateItem]; let bVal: any = b[key as keyof EmailTemplateItem];
        if (key === 'category_id') { aVal = a.categoryName; bVal = b.categoryName; }
        else if (key === 'sub_category_id') { aVal = a.subCategoryName; bVal = b.subCategoryName; }
        else if (key === 'brand_id') { aVal = a.brandName; bVal = b.brandName; }
        else if (key === 'role_id') { aVal = a.roleName; bVal = b.roleName; }
        else if (key === 'department_id') { aVal = a.departmentName; bVal = b.departmentName; }
        else if (key === 'designation_id') { aVal = a.designationName; bVal = b.designationName; }
        else if (key === "created_at" || key === "updated_at") { return order === "asc" ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime(); }
        
        const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [emailTemplatesData, tableData, filterCriteria, categoryOptions, allSubCategoryOptionsForFilter, brandOptions, roleOptions, departmentOptions, designationOptions]);

  const handleExportData = useCallback(() => { exportToCsv("email_templates.csv", allFilteredAndSortedData); }, [allFilteredAndSortedData]);
  const handlePaginationChange = useCallback((page: number) => setTableData(prev => ({ ...prev, pageIndex: page })), []);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData(prev => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleSearchInputChange = useCallback((query: string) => { setTableData(prev => ({ ...prev, query: query, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: EmailTemplateItem) => {setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); });}, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<EmailTemplateItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<EmailTemplateItem>[] = useMemo(() => [
    { header: "Name / ID", accessorKey: "name", size: 200, cell: props => <div><span className="font-semibold">{props.row.original.name}</span><div className="text-xs text-gray-500 dark:text-gray-400">{props.row.original.template_id}</div></div> },
    { header: "Category", accessorKey: "category_id", cell: props => <Tooltip title={props.row.original.categoryName || String(props.getValue())}><span className="truncate block max-w-[120px]">{props.row.original.categoryName || String(props.getValue())}</span></Tooltip> },
    { header: "SubCategory", accessorKey: "sub_category_id", cell: props => <Tooltip title={props.row.original.subCategoryName || (props.getValue() ? String(props.getValue()) : "N/A")}><span className="truncate block max-w-[120px]">{props.row.original.subCategoryName || (props.getValue() ? String(props.getValue()) : "N/A")}</span></Tooltip> },
    // { header: "Brand", accessorKey: "brand_id", cell: props => <Tooltip title={props.row.original.brandName || (props.getValue() ? String(props.getValue()) : "N/A")}><span className="truncate block max-w-[100px]">{props.row.original.brandName || (props.getValue() ? String(props.getValue()) : "N/A")}</span></Tooltip> },
    // { header: "Role", accessorKey: "role_id", cell: props => <Tooltip title={props.row.original.roleName || (props.getValue() ? String(props.getValue()) : "N/A")}><span className="truncate block max-w-[100px]">{props.row.original.roleName || (props.getValue() ? String(props.getValue()) : "N/A")}</span></Tooltip> },
    { header: "Department", accessorKey: "department_id", cell: props => <Tooltip title={props.row.original.departmentName || (props.getValue() ? String(props.getValue()) : "N/A")}><span className="truncate block max-w-[120px]">{props.row.original.departmentName || (props.getValue() ? String(props.getValue()) : "N/A")}</span></Tooltip> },
    // { header: "Designation", accessorKey: "designation_id", cell: props => <Tooltip title={props.row.original.designationName || (props.getValue() ? String(props.getValue()) : "N/A")}><span className="truncate block max-w-[100px]">{props.row.original.designationName || (props.getValue() ? String(props.getValue()) : "N/A")}</span></Tooltip> },
    { header: "Created At", accessorKey: "created_at", size: 120, cell: props => new Date(props.getValue<string>()).toLocaleDateString() },
    { header: "Actions", id: "actions", size: 100, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /* onViewDetail={() => {}} */ /> },
  ], [categoryOptions, allSubCategoryOptionsForFilter, brandOptions, roleOptions, departmentOptions, designationOptions, openEditDrawer, handleDeleteClick]);

  const renderDrawerForm = (currentFormMethods: typeof formMethods, currentVariablesArray: typeof variablesFieldArray) => {
    const { control: currentControl, formState: { errors: currentErrors }, setValue: currentSetValue, watch: currentWatch } = currentFormMethods;
    const watchedCategoryIdInForm = currentWatch("category_id"); // Renamed to avoid conflict with selectedCategoryIdForForm from outer scope

    // Effect to reset sub_category_id in the form when category_id changes
    // This was moved to the outer scope's useEffect that watches selectedCategoryIdForForm (which is formMethods.watch("category_id"))
    // to avoid nested useEffect if renderDrawerForm is called frequently.
    // However, for clarity and direct context, placing it here with currentSetValue is also valid if renderDrawerForm is stable.
    // The current setup using the outer scope `setValue` linked to `formMethods.watch("category_id")` is fine.

    return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem label="Name*" invalid={!!currentErrors.name} errorMessage={currentErrors.name?.message}>
        <Controller name="name" control={currentControl} render={({ field }) => (<Input {...field} prefix={<TbMailBolt />} placeholder="Internal Template Name" />)} />
      </FormItem>
      <FormItem label="Template ID (Unique)*" invalid={!!currentErrors.template_id} errorMessage={currentErrors.template_id?.message}>
        <Controller name="template_id" control={currentControl} render={({ field }) => (<Input {...field} prefix={<TbKey />} placeholder="e.g., WELCOME_EMAIL_V1" />)} />
      </FormItem>
      <FormItem label="Title (Email Subject/Header)*" className="md:col-span-2" invalid={!!currentErrors.title} errorMessage={currentErrors.title?.message}>
          <Controller name="title" control={currentControl} render={({ field }) => (<Input {...field} prefix={<TbFileDescription />} placeholder="Actual Email Title/Subject" />)}/>
      </FormItem>
      <FormItem label="Category*" invalid={!!currentErrors.category_id} errorMessage={currentErrors.category_id?.message}>
        <Controller name="category_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Category" options={categoryOptions} value={categoryOptions.find(o => o.value === field.value)} onChange={(opt) => { field.onChange(opt?.value);}} prefix={<TbCategory2/>} />)} />
      </FormItem>
      <FormItem label="SubCategory (Optional)" invalid={!!currentErrors.sub_category_id} errorMessage={currentErrors.sub_category_id?.message}>
        <Controller name="sub_category_id" control={currentControl} render={({ field }) => (<Select placeholder="Select SubCategory" options={subCategoryOptionsForForm} value={subCategoryOptionsForForm.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbApps/>} isDisabled={!watchedCategoryIdInForm || subCategoryOptionsForForm.length === 0} loading={masterLoadingStatus === "idle" /* && specific subcategory loading status */} />)} />
      </FormItem>
      <FormItem label="Brand (Optional)" invalid={!!currentErrors.brand_id} errorMessage={currentErrors.brand_id?.message}>
        <Controller name="brand_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Brand" options={brandOptions} value={brandOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbBuildingArch/>} />)} />
      </FormItem>
      <FormItem label="Role (Optional)" invalid={!!currentErrors.role_id} errorMessage={currentErrors.role_id?.message}>
        <Controller name="role_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Role" options={roleOptions} value={roleOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbUsersGroup/>} />)} />
      </FormItem>
      <FormItem label="Department (Optional)" invalid={!!currentErrors.department_id} errorMessage={currentErrors.department_id?.message}>
        <Controller name="department_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Department" options={departmentOptions} value={departmentOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbBuildingCommunity/>} />)} />
      </FormItem>
      <FormItem label="Designation (Optional)" invalid={!!currentErrors.designation_id} errorMessage={currentErrors.designation_id?.message}>
        <Controller name="designation_id" control={currentControl} render={({ field }) => (<Select placeholder="Select Designation" options={designationOptions} value={designationOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbBriefcase/>} />)} />
      </FormItem>
      
      <div className="md:col-span-2 mt-4">
        <label className="form-label mb-2 block font-semibold">Template Variables</label>
        {currentVariablesArray.fields.map((item, index) => (
          <div key={item.id} className="flex items-start gap-2 mb-3 p-3 border rounded-md dark:border-gray-700">
            <FormItem label={`Name ${index + 1}*`} className="flex-grow" invalid={!!currentErrors.variables?.[index]?.name} errorMessage={currentErrors.variables?.[index]?.name?.message}>
              <Controller name={`variables.${index}.name`} control={currentControl} render={({ field }) => (<Input {...field} placeholder="e.g., userName" />)}/>
            </FormItem>
            <FormItem label={`Type ${index + 1}*`} className="flex-grow" invalid={!!currentErrors.variables?.[index]?.type} errorMessage={currentErrors.variables?.[index]?.type?.message}>
              <Controller name={`variables.${index}.type`} control={currentControl} render={({ field }) => (<Select {...field} options={variableTypeOptions} placeholder="Select Type" value={variableTypeOptions.find(opt => opt.value === field.value)} onChange={(option) => field.onChange(option?.value)} />)}/>
            </FormItem>
            <Button shape="circle" size="sm" icon={<TbX />} className="mt-7" onClick={() => currentVariablesArray.remove(index)} type="button"/>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => currentVariablesArray.append({ name: "", type: "string" })} icon={<TbVariable/>}>Add Variable</Button>
      </div>
    </div>
    )};

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Email Templates</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Template</Button>
          </div>
          <ItemTableTools onSearchChange={handleSearchInputChange} onFilter={openFilterDrawer} onExport={handleExportData} onClearFilters={onClearFilters}/>
          <div className="mt-4">
            <EmailTemplatesTable columns={columns} data={pageData} loading={masterLoadingStatus === "idle" || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>
      <EmailTemplatesSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      
      <Drawer title={editingTemplate ? "Edit Email Template" : "Add New Email Template"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingTemplate ? closeEditDrawer : closeAddDrawer} onRequestClose={editingTemplate ? closeEditDrawer : closeAddDrawer} width={700}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={editingTemplate ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> <Button size="sm" variant="solid" form={editingTemplate ? "editEmailTemplateForm" : "addEmailTemplateForm"} type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button> </div> } >
        <Form id={editingTemplate ? "editEmailTemplateForm" : "addEmailTemplateForm"} onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-4">
          {/* Added asterisks for required fields in the drawer form for visual cue */}
          {renderDrawerForm(formMethods, variablesFieldArray)}
        </Form>
      </Drawer>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400}
        footer={ <div className="text-right w-full flex justify-end gap-2"> <Button size="sm" onClick={onClearFilters} type="button">Clear All</Button> <Button size="sm" variant="solid" form="filterEmailTemplatesForm" type="submit">Apply Filters</Button> </div> }
      >
        <Form id="filterEmailTemplatesForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Name"><Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Name" options={emailTemplatesData.map(t=>({value: t.name, label:t.name})).filter((v,i,a)=>a.findIndex(item=>item.value === v.value)===i)} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
          <FormItem label="Template ID"><Controller name="filterTemplateIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Template ID" options={emailTemplatesData.map(t=>({value: t.template_id, label:t.template_id})).filter((v,i,a)=>a.findIndex(item=>item.value === v.value)===i)} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
          <FormItem label="Category"><Controller name="filterCategoryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Category" options={categoryOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
          <FormItem label="SubCategory"><Controller name="filterSubCategoryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any SubCategory" options={allSubCategoryOptionsForFilter} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
          <FormItem label="Brand"><Controller name="filterBrandIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Brand" options={brandOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
          <FormItem label="Role"><Controller name="filterRoleIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Role" options={roleOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
          <FormItem label="Department"><Controller name="filterDepartmentIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Department" options={departmentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
          <FormItem label="Designation"><Controller name="filterDesignationIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Designation" options={designationOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])}/>)}/></FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Email Template" onClose={() => { setSingleDeleteConfirmOpen(false); setTemplateToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setTemplateToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setTemplateToDelete(null); }} >
        <p>Are you sure you want to delete template "<strong>{templateToDelete?.name} ({templateToDelete?.template_id})</strong>"? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

export default EmailTemplatesListing;