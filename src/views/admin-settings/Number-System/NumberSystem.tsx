import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import DebouceInput from "@/components/shared/DebouceInput";
import { Drawer, Form, FormItem, Input, Select, Tag, Card, Dropdown, Checkbox, Avatar, Dialog } from "@/components/ui";

// Icons
import { TbPencil, TbSearch, TbFilter, TbPlus, TbCloudUpload, TbReload, TbMessageStar, TbMessageCheck, TbMessage2X, TbColumns, TbX, TbUserCircle, TbTrash } from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import { getNumberSystemsAction, addNumberSystemAction, editNumberSystemAction, getCountriesAction, submitExportReasonAction, deleteNumberSystemAction } from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Utility Functions ---
function formatCustomDateTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    } catch (e) {
        return 'Invalid Date';
    }
}


// --- Constants & Types ---
const apiStatusOptions: { value: 'Active' | 'Inactive'; label: string }[] = [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" } ];
const statusColor: Record<"Active" | "Inactive", string> = { Active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100", Inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100" };

export type CountryListItem = { id: string | number; name: string };
export type CountryOption = { value: string; label: string };
export type NumberSystemItem = { id: string | number; name: string; status: "Active" | "Inactive"; prefix?: string; country_ids: string; customer_code_starting?: string; current_customer_code?: string; non_kyc_customer_code_starting?: string; non_kyc_current_customer_code?: string; company_code_starting?: string; current_company_code?: string; non_kyc_company_code_starting?: string; non_kyc_current_company_code?: string; created_at?: string; updated_at?: string; updated_by_name?: string; updated_by_role?: string; updated_by_user?: { name: string; roles: { display_name: string }[], profile_pic_path: string | null } | null; };

// --- Zod Schemas ---
const numberSystemFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name cannot exceed 100 characters."),
  status: z.enum(["Active", "Inactive"], { required_error: "Status is required." }),
  prefix: z.string().max(10, "Prefix too long (max 10 chars).").optional().or(z.literal("")),
  customer_code_starting: z.coerce.number().int().min(0, "Start Number must be non-negative."),
  // REMOVED: current_customer_code
  non_kyc_customer_code_starting: z.coerce.number().int().min(0, "Temp Start Number must be non-negative."),
  // REMOVED: non_kyc_current_customer_code
  company_code_starting: z.coerce.number().int().min(0, "Verified Company Start Number must be non-negative."),
  // REMOVED: current_company_code
  non_kyc_company_code_starting: z.coerce.number().int().min(0, "Temporary Company Start Number must be non-negative."),
  // REMOVED: non_kyc_current_company_code
  country_ids: z.array(z.string()).min(1, "At least one country must be selected."),
});
type NumberSystemFormData = z.infer<typeof numberSystemFormSchema>;

const filterFormSchema = z.object({
  filterCountryIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters.") });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Utility & Child Components ---
function exportNumberSystemsToCsv(filename: string, rows: NumberSystemItem[]) {
  if (!rows || !rows.length) return false;
  const CSV_HEADERS_NS = ["ID", "Name", "Status", "Prefix", "Country IDs", "Member Start", "Members Current", "Members Temp Start", "Members Temp Current", "Verified Company Start", "Verified Company Current", "Temporary Company Start", "Temporary Company Current", "Created At", "Updated By", "Updated Role", "Updated At" ];
  type NumberSystemExportItem = Omit<NumberSystemItem, "created_at" | "updated_at"> & { created_at_formatted?: string; updated_at_formatted?: string };
  const CSV_KEYS_NS_EXPORT: (keyof NumberSystemExportItem)[] = ["id", "name", "status", "prefix", "country_ids", "customer_code_starting", "current_customer_code", "non_kyc_customer_code_starting", "non_kyc_current_customer_code", "company_code_starting", "current_company_code", "non_kyc_company_code_starting", "non_kyc_current_company_code", "created_at_formatted", "updated_by_name", "updated_by_role", "updated_at_formatted" ];
  const preparedRows: NumberSystemExportItem[] = rows.map((row) => ({ ...row, status: row.status || "Inactive", prefix: row.prefix || "N/A", country_ids: row.country_ids || "N/A", customer_code_starting: row.customer_code_starting || "0", current_customer_code: row.current_customer_code || "0", non_kyc_customer_code_starting: row.non_kyc_customer_code_starting || "0", non_kyc_current_customer_code: row.non_kyc_current_customer_code || "0", company_code_starting: row.company_code_starting || "0", current_company_code: row.current_company_code || "0", non_kyc_company_code_starting: row.non_kyc_company_code_starting || "0", non_kyc_current_company_code: row.non_kyc_current_company_code || "0", created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString() : "N/A", updated_by_name: row.updated_by_name || "N/A", updated_by_role: row.updated_by_role || "N/A", updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A" }));
  const csvContent = [ CSV_HEADERS_NS.join(','), ...preparedRows.map(row => CSV_KEYS_NS_EXPORT.map(k => { let cell = (row as any)[k]; if (cell === null || cell === undefined) cell = ''; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(',')) ].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>);
  return false;
}
function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(' ') }

const ActionColumn = ({ onEdit }: { onEdit: () => void }) => (<div className="flex items-center justify-center gap-1"><Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400" role="button" onClick={onEdit}><TbPencil /></div></Tooltip></div>);

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll, countryOptions }: { filterData: Partial<FilterFormData>; onRemoveFilter: (key: keyof FilterFormData, value: string) => void; onClearAll: () => void; countryOptions: CountryOption[] }) => {
    const countryMap = useMemo(() => new Map(countryOptions.map(c => [c.value, c.label])), [countryOptions]);
    const filters = Object.entries(filterData).flatMap(([key, values]) => (Array.isArray(values) ? values.map(v => ({ key: key as keyof FilterFormData, ...v, label: key === 'filterCountryIds' ? countryMap.get(v.value) || v.value : v.label })) : []));
    if (filters.length === 0) return null;
    const keyToLabelMap = { filterStatus: 'Status', filterCountryIds: 'Country' };
    return (<div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4"><span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>{filters.map((filter) => (<Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">{(keyToLabelMap as any)[filter.key]}: {filter.label}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter(filter.key, filter.value)} /></Tag>))}<Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button></div>);
};

const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearAll, allColumns, visibleColumnKeys, setVisibleColumnKeys, activeFilterCount }: { onSearchChange: (q: string) => void; onFilter: () => void; onExport: () => void; onClearAll: () => void; allColumns: ColumnDef<NumberSystemItem>[]; visibleColumnKeys: string[]; setVisibleColumnKeys: (keys: string[]) => void; activeFilterCount: number; }) => {
    const toggleColumn = (checked: boolean, columnKey: string) => { if (checked) { setVisibleColumnKeys([...visibleColumnKeys, columnKey]); } else { setVisibleColumnKeys(visibleColumnKeys.filter((key) => key !== columnKey)); } };
    const isColumnVisible = (columnKey: string) => visibleColumnKeys.includes(columnKey);
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow"><DebouceInput className="w-full" placeholder="Quick Search by Name..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div>
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                <Dropdown renderTitle={<Button title="Toggle Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2">
                        <div className="font-semibold mb-1 border-b pb-1">Toggle Columns</div>
                        {allColumns.filter(c => (c.accessorKey || c.id) && c.header).map(col => { const key = (col.accessorKey || col.id) as string; return (<div key={key} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={key} checked={isColumnVisible(key)} onChange={(c) => toggleColumn(c, key)} />{col.header}</div>)})}
                    </div>
                </Dropdown>
                <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearAll} />
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    )
};

const SelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: { selectedItems: NumberSystemItem[], onDeleteSelected: () => void; isDeleting: boolean; }) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
                <div className="flex items-center justify-between w-full px-4 sm:px-8"><span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>System{selectedItems.length > 1 ? 's' : ''} selected</span></span></span><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)} loading={isDeleting}>Delete Selected</Button></div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} System${selectedItems.length > 1 ? 's' : ''}`} onCancel={() => setDeleteOpen(false)} onClose={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }} loading={isDeleting}><p>Are you sure you want to delete the selected numbering system{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p></ConfirmDialog>
        </>
    );
};

// --- Main Component: NumberSystems ---
const NumberSystems = () => {
  const dispatch = useAppDispatch();
  const { numberSystemsData: rawNumberSystemsData = [], CountriesData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NumberSystemItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<NumberSystemItem | null>(null);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "updated_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<NumberSystemItem[]>([]);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Partial<FilterFormData>>({});
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  useEffect(() => { dispatch(getNumberSystemsAction()); dispatch(getCountriesAction()); }, [dispatch]);
  
  const countryOptions: CountryOption[] = useMemo(() => Array.isArray(CountriesData) ? CountriesData.map((c: CountryListItem) => ({ value: String(c.id), label: c.name })) : [], [CountriesData]);
  const numberSystemsData: NumberSystemItem[] = useMemo(() => Array.isArray(rawNumberSystemsData) ? rawNumberSystemsData.map((item: any) => ({ ...item, status: item.status || "Inactive", updated_by_name: item.updated_by_user?.name || item.updated_by_name, updated_by_role: item.updated_by_user?.roles?.[0]?.display_name || item.updated_by_role })) : [], [rawNumberSystemsData]);

  const addCountryOptions = useMemo(() => {
    const assignedCountryIds = new Set<string>();
    numberSystemsData.forEach(system => system.country_ids?.split(',').forEach(id => assignedCountryIds.add(id.trim())));
    return countryOptions.filter(c => !assignedCountryIds.has(c.value));
  }, [countryOptions, numberSystemsData]);

  const countriesOptionsForFilter = useMemo(() => {
    if (!numberSystemsData.length || !countryOptions.length) return [];
    const usedCountryIds = new Set<string>();
    numberSystemsData.forEach(system => system.country_ids?.split(',').map(id => id.trim()).filter(Boolean).forEach(id => usedCountryIds.add(id)));
    const countryNameMap = new Map(countryOptions.map(c => [c.value, c.label]));
    return Array.from(usedCountryIds).map(id => ({ value: id, label: countryNameMap.get(id) || `ID:${id}` })).filter(Boolean).sort((a, b) => a.label.localeCompare(b.label));
  }, [numberSystemsData, countryOptions]);

  const defaultFormValues: NumberSystemFormData = { name: "", prefix: "", status: "Active", customer_code_starting: 0, current_customer_code: 0, non_kyc_customer_code_starting: 0, non_kyc_current_customer_code: 0, company_code_starting: 0, current_company_code: 0, non_kyc_company_code_starting: 0, non_kyc_current_company_code: 0, country_ids: [], };
  const formMethods = useForm<NumberSystemFormData>({ resolver: zodResolver(numberSystemFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: activeFilters });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" } });

  const { pageData, total, allFilteredAndSortedData, counts } = useMemo(() => {
    let processedData: NumberSystemItem[] = cloneDeep(numberSystemsData);
    const initialCounts = { total: numberSystemsData.length, active: numberSystemsData.filter(i => i.status === 'Active').length, inactive: numberSystemsData.filter(i => i.status === 'Inactive').length };

    if (activeFilters.filterCountryIds?.length) {
      const selected = new Set(activeFilters.filterCountryIds.map(opt => opt.value));
      processedData = processedData.filter(item => item.country_ids?.split(',').map(id => id.trim()).some(id => selected.has(id)));
    }
    if (activeFilters.filterStatus?.length) {
      const selected = new Set(activeFilters.filterStatus.map(opt => opt.value));
      processedData = processedData.filter(item => selected.has(item.status));
    }
    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(item => (item.name?.toLowerCase() ?? "").includes(query));
    }

    const { order, key } = tableData.sort;
    if (order && key) {
        processedData.sort((a, b) => {
            let aVal: any, bVal: any;
            if (key === 'created_at' || key === 'updated_at') { aVal = a[key as keyof NumberSystemItem] ? new Date(a[key as keyof NumberSystemItem]!).getTime() : 0; bVal = b[key as keyof NumberSystemItem] ? new Date(b[key as keyof NumberSystemItem]!).getTime() : 0; }
            else if (key === 'countriesCount') { aVal = a.country_ids?.split(',').length || 0; bVal = b.country_ids?.split(',').length || 0; }
            else { aVal = a[key as keyof NumberSystemItem] ?? ''; bVal = b[key as keyof NumberSystemItem] ?? ''; }
            if (typeof aVal === 'number' && typeof bVal === 'number') return order === 'asc' ? aVal - bVal : bVal - aVal;
            return order === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
        });
    }
    return { pageData: processedData.slice((tableData.pageIndex - 1) * tableData.pageSize, tableData.pageIndex * tableData.pageSize), total: processedData.length, allFilteredAndSortedData: processedData, counts: initialCounts };
  }, [numberSystemsData, tableData, activeFilters]);

  const activeFilterCount = useMemo(() => Object.values(activeFilters).flat().length, [activeFilters]);
  const tableLoading = masterLoadingStatus === "loading" || isSubmitting;

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
  const onClearAllFilters = useCallback(() => { setActiveFilters({}); filterFormMethods.reset({}); handleSetTableData({ query: '', pageIndex: 1 }); }, [handleSetTableData, filterFormMethods]);
  const handleCardClick = useCallback((status?: 'Active' | 'Inactive') => { handleSetTableData({ pageIndex: 1, query: '' }); if (!status) { setActiveFilters({}); } else { const option = apiStatusOptions.find(o => o.value === status); setActiveFilters(option ? { filterStatus: [option] } : {}); } }, [handleSetTableData]);
  const handleRemoveFilter = useCallback((key: keyof FilterFormData, valueToRemove: string) => { setActiveFilters(prev => { const newFilters = { ...prev }; const currentValues = (prev[key] || []) as {value: string}[]; const newValues = currentValues.filter(item => item.value !== valueToRemove); if (newValues.length > 0) (newFilters as any)[key] = newValues; else delete (newFilters as any)[key]; return newFilters; }); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
  const openAddDrawer = () => { formMethods.reset(defaultFormValues); setIsAddDrawerOpen(true); };
  const closeAddDrawer = () => setIsAddDrawerOpen(false);
  
  const openEditDrawer = (item: NumberSystemItem) => { setEditingItem(item); const countryIds = item.country_ids?.split(',').map(id => id.trim()).filter(Boolean) || []; formMethods.reset({ name: item.name, status: item.status, prefix: item.prefix || "", country_ids: countryIds, customer_code_starting: Number(item.customer_code_starting || 0), current_customer_code: Number(item.current_customer_code || 0), non_kyc_customer_code_starting: Number(item.non_kyc_customer_code_starting || 0), non_kyc_current_customer_code: Number(item.non_kyc_current_customer_code || 0), company_code_starting: Number(item.company_code_starting || 0), current_company_code: Number(item.current_company_code || 0), non_kyc_company_code_starting: Number(item.non_kyc_company_code_starting || 0), non_kyc_current_company_code: Number(item.non_kyc_current_company_code || 0) }); setIsEditDrawerOpen(true); };
  const closeEditDrawer = () => { setEditingItem(null); setIsEditDrawerOpen(false); };
  const onSubmitHandler = async (data: NumberSystemFormData) => {
    setIsSubmitting(true);
    
    // Base payload from form data
    const apiPayload: any = {
        name: data.name,
        status: data.status,
        prefix: data.prefix || null,
        country_ids: data.country_ids.join(','),
        customer_code_starting: String(data.customer_code_starting),
        non_kyc_customer_code_starting: String(data.non_kyc_customer_code_starting),
        company_code_starting: String(data.company_code_starting),
        non_kyc_company_code_starting: String(data.non_kyc_company_code_starting),
    };

    try {
        if (editingItem) {
            // EDIT: Add existing current codes back to the payload
            apiPayload.id = editingItem.id;
            apiPayload.current_customer_code = String(editingItem.current_customer_code || 0);
            apiPayload.non_kyc_current_customer_code = String(editingItem.non_kyc_current_customer_code || 0);
            apiPayload.current_company_code = String(editingItem.current_company_code || 0);
            apiPayload.non_kyc_current_company_code = String(editingItem.non_kyc_current_company_code || 0);

            await dispatch(editNumberSystemAction(apiPayload)).unwrap();
            toast.push(<Notification title="System Updated" type="success" />);
            closeEditDrawer();
        } else {
            // ADD: Statically add "0" for current codes
            apiPayload.current_customer_code = "0";
            apiPayload.non_kyc_current_customer_code = "0";
            apiPayload.current_company_code = "0";
            apiPayload.non_kyc_current_company_code = "0";

            await dispatch(addNumberSystemAction(apiPayload)).unwrap();
            toast.push(<Notification title="System Added" type="success" />);
            closeAddDrawer();
        }
        dispatch(getNumberSystemsAction());
    } catch (error: any) {
        toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{error?.message || 'Error'}</Notification>);
    } finally {
        setIsSubmitting(false);
    }
};
  const handleDeleteClick = (item: NumberSystemItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
  const onConfirmSingleDelete = async () => { if (!itemToDelete) return; setIsDeleting(true); try { await dispatch(deleteNumberSystemAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="System Deleted" type="success" />); setSelectedItems(p => p.filter(i => i.id !== itemToDelete.id)); dispatch(getNumberSystemsAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{e?.message || 'Error'}</Notification>); } finally { setIsDeleting(false); setSingleDeleteConfirmOpen(false); setItemToDelete(null); } };
  const handleDeleteSelected = async () => { if (selectedItems.length === 0) return; setIsDeleting(true); try { await dispatch(deleteNumberSystemAction({ ids: selectedItems.map(i => i.id).join(',') })).unwrap(); toast.push(<Notification title="Systems Deleted" type="success" />); setSelectedItems([]); dispatch(getNumberSystemsAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{e?.message || 'Error'}</Notification>); } finally { setIsDeleting(false); } };
  const onApplyFiltersSubmit = (data: FilterFormData) => { setActiveFilters({ filterCountryIds: data.filterCountryIds || [], filterStatus: data.filterStatus || [] }); handleSetTableData({ pageIndex: 1 }); setIsFilterDrawerOpen(false); };
  const handleOpenExportModal = () => { if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); };
  const handleConfirmExport = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const fileName = `numbering-systems_${new Date().toISOString().split('T')[0]}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Numbering Systems', file_name: fileName })).unwrap(); toast.push(<Notification title="Reason Submitted" type="success" />); exportNumberSystemsToCsv(fileName, allFilteredAndSortedData); setIsExportReasonModalOpen(false); } catch (e: any) { toast.push(<Notification title="Export Failed" type="danger">{e?.message || 'Error'}</Notification>); } finally { setIsSubmittingExportReason(false); } };
  const openImageViewer = (src: string | null) => { if (src) { setImageToView(src); setIsImageViewerOpen(true); } };
  
  const baseColumns: ColumnDef<NumberSystemItem>[] = useMemo(() => [
      { header: "Name", accessorKey: "name", enableSorting: true, size: 160, cell: (props) => <span className="font-semibold">{props.row.original.name}</span> },
      { header: "Countries", accessorKey: "country_ids", id: "countriesCount", enableSorting: true, size: 360, cell: (props) => { const ids = props.row.original.country_ids?.split(',').map(id => id.trim()).filter(Boolean) || []; if (ids.length === 0) return <Tag>N/A</Tag>; const names = ids.map(id => countryOptions.find(c => c.value === id)?.label || `ID:${id}`); return (<div className="flex flex-wrap gap-1">{names.slice(0, 2).map((n, i) => <Tag key={i} className="bg-gray-100 dark:bg-gray-600">{n}</Tag>)}{names.length > 2 && <Tooltip title={names.join(', ')}><Tag className="bg-gray-200 dark:bg-gray-500">+{names.length - 2} more</Tag></Tooltip>}</div>); }},
      { header: 'Updated Info', accessorKey: 'updated_at', enableSorting: true, size: 200, cell: (props) => { const { updated_at, updated_by_user } = props.row.original; return (<div className="flex items-center gap-2"><Avatar src={updated_by_user?.profile_pic_path || undefined} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path || null)} /><div><span>{updated_by_user?.name || 'N/A'}</span><div className="text-xs"><b>{updated_by_user?.roles?.[0]?.display_name || ''}</b></div><div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div></div></div>); } },
      { header: "Status", accessorKey: "status", enableSorting: true, size: 100, cell: (props) => <Tag className={`${statusColor[props.row.original.status]} capitalize font-semibold border-0`}>{props.row.original.status}</Tag> },
      { header: "Actions", id: "action", size: 60, meta: { cellClass: "text-center" }, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
  ], [countryOptions]);

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => baseColumns.map(c => (c.accessorKey || c.id) as string));
  const visibleColumns = useMemo(() => baseColumns.filter(c => visibleColumnKeys.includes((c.accessorKey || c.id) as string)), [baseColumns, visibleColumnKeys]);
 
 const renderDrawerForm = (isEdit: boolean) => {
    const applicableCountryOptions = isEdit ? countryOptions : addCountryOptions;
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem label={<div>System Name<span className="text-red-500"> *</span></div>} invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}><Controller name="name" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="e.g., European System" />} /></FormItem>
                <FormItem label="Prefix" invalid={!!formMethods.formState.errors.prefix} errorMessage={formMethods.formState.errors.prefix?.message}><Controller name="prefix" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="e.g., EU" />} /></FormItem>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h6 className="text-sm font-semibold mb-3">Member Numbering</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Verified Members</p>
                        <FormItem label="Start No." invalid={!!formMethods.formState.errors.customer_code_starting} errorMessage={formMethods.formState.errors.customer_code_starting?.message}><Controller name="customer_code_starting" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 10001" />} /></FormItem>
                    </div>
                     <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Temporary Members</p>
                        <FormItem label="Start No." invalid={!!formMethods.formState.errors.non_kyc_customer_code_starting} errorMessage={formMethods.formState.errors.non_kyc_customer_code_starting?.message}><Controller name="non_kyc_customer_code_starting" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 5001" />} /></FormItem>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h6 className="text-sm font-semibold mb-3">Company Numbering</h6>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Verified Companies</p>
                        <FormItem label="Start No." invalid={!!formMethods.formState.errors.company_code_starting} errorMessage={formMethods.formState.errors.company_code_starting?.message}><Controller name="company_code_starting" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 70001" />} /></FormItem>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Temporary Companies</p>
                        <FormItem label="Start No." invalid={!!formMethods.formState.errors.non_kyc_company_code_starting} errorMessage={formMethods.formState.errors.non_kyc_company_code_starting?.message}><Controller name="non_kyc_company_code_starting" control={formMethods.control} render={({ field }) => <Input {...field} type="number" placeholder="e.g., 80001" />} /></FormItem>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 space-y-4">
                <FormItem label={<div>Status<span className="text-red-500"> *</span></div>} invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message as string}><Controller name="status" control={formMethods.control} render={({ field }) => <Select placeholder="Select status" options={apiStatusOptions} value={apiStatusOptions.find(o => o.value === field.value)} onChange={o => field.onChange(o?.value)} />} /></FormItem>
                <FormItem label="Applicable Countries" invalid={!!formMethods.formState.errors.country_ids} errorMessage={formMethods.formState.errors.country_ids?.message as string}><Controller name="country_ids" control={formMethods.control} render={({ field }) => <Select isMulti placeholder="Select countries..." options={applicableCountryOptions} value={applicableCountryOptions.filter(o => field.value?.includes(o.value))} onChange={v => field.onChange(v ? v.map(o => o.value) : [])} />} /></FormItem>
            </div>
        </div>
    )
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Numbering System</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>Add New</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Tooltip title="Click to show all systems"><div className="cursor-pointer" onClick={() => handleCardClick()}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbMessageStar size={24} /></div><div><h6 className="text-blue-500">{counts.total}</h6><span className="font-semibold text-xs">Total Systems</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show Active systems"><div className="cursor-pointer" onClick={() => handleCardClick('Active')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbMessageCheck size={24} /></div><div><h6 className="text-green-500">{counts.active}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show Inactive systems"><div className="cursor-pointer" onClick={() => handleCardClick('Inactive')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbMessage2X size={24} /></div><div><h6 className="text-red-500">{counts.inactive}</h6><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
          </div>
          <ItemTableTools onSearchChange={(q) => handleSetTableData({ query: q, pageIndex: 1 })} onFilter={() => setIsFilterDrawerOpen(true)} onExport={handleOpenExportModal} onClearAll={onClearAllFilters} allColumns={baseColumns} visibleColumnKeys={visibleColumnKeys} setVisibleColumnKeys={setVisibleColumnKeys} activeFilterCount={activeFilterCount} />
          <div className="mt-4"><ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={onClearAllFilters} countryOptions={countryOptions} /></div>
          {(activeFilterCount > 0 || tableData.query) && <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching system(s).</div>}
          <div className="mt-2 flex-grow overflow-y-auto">
            <DataTable selectable columns={visibleColumns} data={pageData} noData={!tableLoading && pageData.length === 0} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex, pageSize: tableData.pageSize }} onPaginationChange={(p) => handleSetTableData({ pageIndex: p })} onSelectChange={(s) => handleSetTableData({ pageSize: s, pageIndex: 1 })} onSort={(s) => handleSetTableData({ sort: s })} checkboxChecked={(row) => selectedItems.some(s => s.id === row.id)} onCheckBoxChange={(c,r) => setSelectedItems(p => c ? [...p,r] : p.filter(i => i.id !== r.id))} onIndeterminateCheckBoxChange={(c,rs) => { const rIds = new Set(rs.map(r=>r.original.id)); setSelectedItems(p => c ? [...p, ...rs.map(r=>r.original).filter(r => !p.some(i => i.id === r.id))] : p.filter(i => !rIds.has(i.id)))}}/>
          </div>
        </AdaptiveCard>
      </Container>
      
      <SelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      
      <Drawer title={editingItem ? "Edit Number System" : "Add New Number System"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} width={700} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="numberSystemForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (editingItem ? "Saving..." : "Adding...") : "Save"}</Button></div>}>
        <Form id="numberSystemForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-2 relative pb-20">{renderDrawerForm(!!editingItem)}{editingItem && (<div className="absolute bottom-0 w-full"><div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3"><div><b className="font-semibold text-gray-800 dark:text-gray-100">Latest Update:</b><br /><p className="font-semibold">{editingItem.updated_by_user?.name || "N/A"}</p><p>{editingItem.updated_by_user?.roles?.[0]?.display_name || "N/A"}</p></div><div className='text-right'><span className="font-semibold">Created At:</span>{" "}<span>{formatCustomDateTime(editingItem.created_at)}</span><br /><span className="font-semibold">Updated At:</span>{" "}<span>{formatCustomDateTime(editingItem.updated_at)}</span></div></div></div>)}</Form>
      </Drawer>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} width={400} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearAllFilters}>Clear</Button><Button size="sm" variant="solid" form="filterNumberSystemForm" type="submit">Apply</Button></div>}>
        <Form id="filterNumberSystemForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Countries"><Controller name="filterCountryIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Filter by countries..." options={countriesOptionsForFilter} value={field.value || []} onChange={(v) => field.onChange(v || [])} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Filter by status..." options={apiStatusOptions} value={field.value || []} onChange={(v) => field.onChange(v || [])} />)} /></FormItem>
        </Form>
      </Drawer>
      
      <Dialog isOpen={isImageViewerOpen} onClose={() => setIsImageViewerOpen(false)} onRequestClose={() => setIsImageViewerOpen(false)} width={600}><div className="flex justify-center items-center p-4">{imageToView ? (<img src={imageToView} alt="User" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />) : (<p>No image.</p>)}</div></Dialog>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete System" onCancel={() => setSingleDeleteConfirmOpen(false)} onClose={() => setSingleDeleteConfirmOpen(false)} onConfirm={onConfirmSingleDelete} loading={isDeleting}><p>Are you sure you want to delete the system <strong>"{itemToDelete?.name}"</strong>?</p></ConfirmDialog>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onCancel={() => setIsExportReasonModalOpen(false)} onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExport)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? 'Submitting...' : 'Submit & Export'} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
          <Form id="exportNumberSystemsReasonForm" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 mt-2"><FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form>
      </ConfirmDialog>
    </>
  );
};

export default NumberSystems;