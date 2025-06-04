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
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui"; // Tag might be used if status is added

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
  TbReload, // For Department
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
} from "@/reduxtool/master/middleware"; // Adjust path
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust path


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
  created_at: string;
  updated_at: string;
  category?: { id: number; name: string; } | null;
  department?: { id: number; name: string; } | null;
  // For UI display convenience
  categoryNameDisplay?: string;
  departmentNameDisplay?: string;
};

// --- Zod Schema for Add/Edit Form ---
// Note: category_id and department_id will store IDs from fetched dropdowns
const autoEmailTemplateFormSchema = z.object({
  email_type: z.string().min(1, "Email Type is required.").max(100, "Email Type too long."),
  template_key: z.string().min(1, "Template Key is required.").max(50, "Template Key too long.")
    .regex(/^[A-Za-z0-9_.-]+$/, "Key can only contain alphanumeric, underscore, dot, or hyphen."), // Adjusted regex
  category_id: z.string().min(1, "Please select a category."),
  department_id: z.string().optional().or(z.literal("")), // Optional, can be empty string for "All"
});
type AutoEmailTemplateFormData = z.infer<typeof autoEmailTemplateFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterEmailTypes: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterTemplateKeys: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCategoryIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDepartmentIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter ---
const CSV_HEADERS_AET = ["ID", "Email Type", "Template Key", "Category", "Department", "Created At"];
const CSV_KEYS_AET: (keyof Pick<AutoEmailTemplateItem, 'id' | 'email_type' | 'template_key' | 'created_at'> | 'categoryNameDisplay' | 'departmentNameDisplay')[] = [
  "id", "email_type", "template_key", "categoryNameDisplay", "departmentNameDisplay", "created_at",
];

function exportAutoEmailTemplatesToCsv(filename: string, rows: AutoEmailTemplateItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const preparedRows = rows.map((row) => ({
    id: row.id,
    email_type: row.email_type,
    template_key: row.template_key,
    categoryNameDisplay: row.category?.name || String(row.category_id),
    departmentNameDisplay: row.department?.name || (row.department_id ? String(row.department_id) : "N/A"),
    created_at: row.created_at,
  }));
  const separator = ",";
  const csvContent = CSV_HEADERS_AET.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_AET.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

// --- ActionColumn, Search, TableTools, SelectedFooter (UI remains same) ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => { // Removed onViewDetail if not used for now
  return (<div className="flex items-center justify-center gap-1"> <Tooltip title="Edit"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div></Tooltip> <Tooltip title="Delete"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`} role="button" onClick={onDelete}><TbTrash /></div></Tooltip> </div>);
};
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(({ onInputChange }, ref) => (<DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: ItemTableToolsProps) => (<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"><Tooltip title="Clear Filters"><Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button></Tooltip> <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div>);
type AutoEmailTemplatesTableProps = { columns: ColumnDef<AutoEmailTemplateItem>[]; data: AutoEmailTemplateItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: AutoEmailTemplateItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: AutoEmailTemplateItem) => void; onAllRowSelect: (checked: boolean, rows: Row<AutoEmailTemplateItem>[]) => void; };
const AutoEmailTemplatesTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: AutoEmailTemplatesTableProps) => (<DataTable selectable columns={columns} data={data} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} noData={!loading && data.length === 0} />);
type AutoEmailTemplatesSelectedFooterProps = { selectedItems: AutoEmailTemplateItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const AutoEmailTemplatesSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: AutoEmailTemplatesSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; return (<> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold"> {selectedItems.length} Template{selectedItems.length > 1 ? "s" : ""} selected </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Template(s)`} onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }}> <p>Are you sure you want to delete the selected template(s)?</p> </ConfirmDialog> </>); };

const AutoEmailTemplatesListing = () => {
  const dispatch = useAppDispatch();
  const {
    autoEmailTemplatesData = [], // Data for the table
    CategoriesData = [],    // Data for category dropdown
    departmentsData = [],   // Data for department dropdown
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);


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

  const categoryOptions = useMemo(() => Array.isArray(CategoriesData) ? CategoriesData.map((c: ApiAETCategory) => ({ value: String(c.id), label: c.name })) : [], [CategoriesData]);
  const departmentOptions = useMemo(() => Array.isArray(departmentsData) ? departmentsData.map((d: ApiAETDepartment) => ({ value: String(d.id), label: d.name })) : [], [departmentsData]);

  useEffect(() => {
    dispatch(getAutoEmailTemplatesAction());
    dispatch(getCategoriesAction());
    dispatch(getDepartmentsAction());
  }, [dispatch]);

  const formMethods = useForm<AutoEmailTemplateFormData>({
    resolver: zodResolver(autoEmailTemplateFormSchema),
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset({
      email_type: "",
      template_key: "",
      category_id: categoryOptions[0]?.value || "",
      department_id: departmentOptions[0]?.value || "",
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
      department_id: String(item.department_id || ""), // Handle null department_id
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
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer, filterFormMethods]);
  const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1 })); }, [filterFormMethods]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataWithDisplayNames: AutoEmailTemplateItem[] =
      Array.isArray(autoEmailTemplatesData) ? autoEmailTemplatesData.map(item => ({
        ...item,
        categoryNameDisplay: item.category?.name || categoryOptions.find(c => c.value === String(item.category_id))?.label || String(item.category_id),
        departmentNameDisplay: item.department?.name || departmentOptions.find(d => d.value === String(item.department_id))?.label || (item.department_id ? String(item.department_id) : "N/A"),
      })) : [];

    let processedData = cloneDeep(sourceDataWithDisplayNames);
    if (filterCriteria.filterEmailTypes?.length) { const v = filterCriteria.filterEmailTypes.map(et => et.value.toLowerCase()); processedData = processedData.filter(item => v.includes(item.email_type.toLowerCase())); }
    if (filterCriteria.filterTemplateKeys?.length) { const v = filterCriteria.filterTemplateKeys.map(tk => tk.value.toLowerCase()); processedData = processedData.filter(item => v.includes(item.template_key.toLowerCase())); }
    if (filterCriteria.filterCategoryIds?.length) { const v = filterCriteria.filterCategoryIds.map(c => c.value); processedData = processedData.filter(item => v.includes(String(item.category_id))); }
    if (filterCriteria.filterDepartmentIds?.length) { const v = filterCriteria.filterDepartmentIds.map(d => d.value); processedData = processedData.filter(item => v.includes(String(item.department_id))); }

    if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => String(item.id).toLowerCase().includes(q) || item.email_type.toLowerCase().includes(q) || item.template_key.toLowerCase().includes(q) || item.categoryNameDisplay?.toLowerCase().includes(q) || item.departmentNameDisplay?.toLowerCase().includes(q)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === 'category_id') { aVal = a.categoryNameDisplay; bVal = b.categoryNameDisplay; }
        else if (key === 'department_id') { aVal = a.departmentNameDisplay; bVal = b.departmentNameDisplay; }
        else { aVal = a[key as keyof AutoEmailTemplateItem]; bVal = b[key as keyof AutoEmailTemplateItem]; }
        if (key === "created_at" || key === "updated_at") { return order === "asc" ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime(); }
        const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    const dataToExport = [...processedData]; const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [autoEmailTemplatesData, tableData, filterCriteria, categoryOptions, departmentOptions]);

  const handleExportData = useCallback(() => { exportAutoEmailTemplatesToCsv("auto_email_templates.csv", allFilteredAndSortedData); }, [allFilteredAndSortedData]);
  const handlePaginationChange = useCallback((page: number) => setTableData(prev => ({ ...prev, pageIndex: page })), []);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData(prev => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleSearchInputChange = useCallback((query: string) => { setTableData(prev => ({ ...prev, query: query, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: AutoEmailTemplateItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<AutoEmailTemplateItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<AutoEmailTemplateItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", size: 80, enableSorting: true },
    { header: "Email Type", accessorKey: "email_type", size: 250, enableSorting: true },
    // { header: "Template Key", accessorKey: "template_key", size: 250, enableSorting: true },
    { header: "Category", accessorKey: "category_id", size: 180, enableSorting: true, cell: props => props.row.original.category?.name || categoryOptions.find(c => c.value === String(props.getValue()))?.label || String(props.getValue()) },
    { header: "Department", accessorKey: "department_id", size: 180, enableSorting: true, cell: props => props.row.original.department?.name || departmentOptions.find(d => d.value === String(props.getValue()))?.label || (props.getValue() ? String(props.getValue()) : "N/A") },
    { header: "Created At", accessorKey: "created_at", size: 150, 
      cell: props => 
      props.getValue() ? new Date(props.getValue<string>()).toLocaleDateString() : '-' 
    },
    { header: "Actions", id: "actions", size: 100, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onViewDetail={() => { /* Implement if needed */ }} /> },
  ], [categoryOptions, departmentOptions, openEditDrawer, handleDeleteClick]);

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem label="Email Type" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.email_type} errorMessage={currentFormMethods.formState.errors.email_type?.message}>
        <Controller name="email_type" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbMailBolt />} placeholder="e.g., Welcome Email, Order Confirmation" />)} />
      </FormItem>
      <FormItem label="Template Key" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.template_key} errorMessage={currentFormMethods.formState.errors.template_key?.message}>
        <Controller name="template_key" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbKey />} placeholder="UNIQUE_TEMPLATE_KEY (e.g., WELCOME_V1)" />)} />
      </FormItem>
      <FormItem label="Category" invalid={!!currentFormMethods.formState.errors.category_id} errorMessage={currentFormMethods.formState.errors.category_id?.message}>
        <Controller name="category_id" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Category" options={categoryOptions} value={categoryOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbCategory2 />} />)} />
      </FormItem>
      <FormItem label="Department" invalid={!!currentFormMethods.formState.errors.department_id} errorMessage={currentFormMethods.formState.errors.department_id?.message}>
        <Controller name="department_id" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Department (Optional)" options={[{ value: "", label: "None / All Departments" }, ...departmentOptions]} value={departmentOptions.find(o => o.value === field.value) || (field.value === "" ? { value: "", label: "None / All Departments" } : null)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbBuildingArch />} />)} />
      </FormItem>
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Auto Email Templates</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Template</Button>
          </div>
          <ItemTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchInputChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4">
            <AutoEmailTemplatesTable columns={columns} data={pageData} loading={masterLoadingStatus === "idle" || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>
      <AutoEmailTemplatesSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <Drawer title={editingItem ? "Edit Auto Email Template" : "Add New Auto Email Template"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={700}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> <Button size="sm" variant="solid" form="autoEmailTemplateForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button> </div>} >
        <Form id="autoEmailTemplateForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-4"> {renderDrawerForm(formMethods)} </Form>
      </Drawer>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear All</Button> <Button size="sm" variant="solid" form="filterAutoEmailTemplateForm" type="submit">Apply Filters</Button> </div>}
      >
        <Form id="filterAutoEmailTemplateForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Email Type"><Controller name="filterEmailTypes" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Email Type" options={autoEmailTemplatesData.map(t => ({ value: t.email_type, label: t.email_type })).filter((v, i, a) => a.findIndex(item => item.value === v.value) === i)} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Template Key"><Controller name="filterTemplateKeys" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Template Key" options={autoEmailTemplatesData.map(t => ({ value: t.template_key, label: t.template_key })).filter((v, i, a) => a.findIndex(item => item.value === v.value) === i)} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Category"><Controller name="filterCategoryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Category" options={categoryOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Department"><Controller name="filterDepartmentIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Department" options={departmentOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Auto Email Template" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} >
        <p>Are you sure you want to delete the template "<strong>{itemToDelete?.email_type} - {itemToDelete?.template_key}</strong>"?</p>
      </ConfirmDialog>
    </>
  );
};

export default AutoEmailTemplatesListing;