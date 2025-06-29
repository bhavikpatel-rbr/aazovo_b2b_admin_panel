// src/views/your-path/Currency.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import DebounceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import { Drawer, Form, FormItem, Input, Tag, Dropdown, Checkbox, Card, Avatar, Dialog } from '@/components/ui'

// Icons
import { TbPencil, TbSearch, TbFilter, TbPlus, TbCloudUpload, TbReload, TbX, TbColumns, TbFile, TbFileCheck, TbFileX, TbUserCircle } from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// Redux Imports
import { useAppDispatch } from '@/reduxtool/store'
import { shallowEqual, useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import {
    getCurrencyAction,
    addCurrencyAction,
    editCurrencyAction,
    getCountriesAction,
    submitExportReasonAction,
} from '@/reduxtool/master/middleware'

// --- FEATURE-SPECIFIC TYPES & SCHEMAS ---
type Country = { id: number; name: string };
export type CurrencyItem = { id: string | number; currency_code: string; currency_symbol: string; status: 'Active' | 'Inactive'; countries: Country[]; created_at?: string; updated_at?: string; updated_by_user?: { name: string; profile_pic_path?: string; roles: { display_name: string }[] }; };
export type SelectOption = { value: string | number; label: string };
type CurrencyFilterSchema = { filterCodes: string[]; filterSymbols: string[]; countryIds: string[]; status: ('Active' | 'Inactive')[]; };
const currencyFormSchema = z.object({ currency_code: z.string().min(1, 'Currency code is required.').max(10, 'Code cannot exceed 10 characters.'), currency_symbol: z.string().min(1, 'Currency symbol is required.').max(5, 'Symbol cannot exceed 5 characters.'), country_id: z.array(z.number()).min(1, "Please select at least one country."), status: z.enum(['Active', 'Inactive'], { required_error: 'Status is required.' }), });
type CurrencyFormData = z.infer<typeof currencyFormSchema>;
const exportReasonSchema = z.object({ reason: z.string().min(1, 'Reason for export is required.').max(255, 'Reason cannot exceed 255 characters.'), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
const statusOptions: SelectOption[] = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }];

// --- HELPERS ---
function exportToCsvCurrency(filename: string, rows: CurrencyItem[]) {
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    const CSV_HEADERS = ["ID", "Currency Code", "Symbol", "Countries", "Status", "Updated By", "Updated Role", "Updated At"];
    const preparedRows = (rows || []).map(row => ({ id: row.id, currency_code: row.currency_code, currency_symbol: row.currency_symbol, countries: (row.countries || []).map(c => c.name).join('; '), status: row.status, updated_by_name: row.updated_by_user?.name || "N/A", updated_by_role: row.updated_by_user?.roles[0]?.display_name || "N/A", updated_at: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A", }));
    const csvContent = [CSV_HEADERS.join(','), ...preparedRows.map(row => [row.id, `"${String(row.currency_code).replace(/"/g, '""')}"`, `"${String(row.currency_symbol).replace(/"/g, '""')}"`, `"${String(row.countries).replace(/"/g, '""')}"`, row.status, `"${String(row.updated_by_name).replace(/"/g, '""')}"`, `"${String(row.updated_by_role).replace(/"/g, '""')}"`, `"${String(row.updated_at).replace(/"/g, '""')}"`].join(','))].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>);
}

// --- REUSABLE DISPLAY & TOOL COMPONENTS ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll, countryOptions }) => {
    const activeCodes = filterData.filterCodes || []; const activeSymbols = filterData.filterSymbols || []; const activeCountries = filterData.countryIds || []; const activeStatuses = filterData.status || []; const hasActiveFilters = activeCodes.length > 0 || activeSymbols.length > 0 || activeCountries.length > 0 || activeStatuses.length > 0;
    if (!hasActiveFilters) return null;
    const getCountryName = (id: string) => (countryOptions || []).find(opt => String(opt.value) === id)?.label || id;
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeCodes.map(code => (<Tag key={`code-${code}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Code: {code}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterCodes', code)} /></Tag>))}
            {activeSymbols.map(symbol => (<Tag key={`symbol-${symbol}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Symbol: {symbol}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterSymbols', symbol)} /></Tag>))}
            {activeCountries.map(countryId => (<Tag key={`country-${countryId}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Country: {getCountryName(countryId)}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('countryIds', countryId)} /></Tag>))}
            {activeStatuses.map(status => (<Tag key={`status-${status}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Status: {status}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('status', status)} /></Tag>))}
            {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
        </div>
    );
};

const CurrencyTableTools = React.forwardRef(({ onSearchChange, onApplyFilters, onClearFilters, onExport, activeFilters, activeFilterCount, codeOptions, symbolOptions, countryOptions, columns, filteredColumns, setFilteredColumns, searchInputValue }, ref) => {
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const { control, handleSubmit, setValue } = useForm<CurrencyFilterSchema>({ defaultValues: { filterCodes: [], filterSymbols: [], countryIds: [], status: [] } });
    useEffect(() => { setValue('filterCodes', activeFilters.filterCodes || []); setValue('filterSymbols', activeFilters.filterSymbols || []); setValue('countryIds', activeFilters.countryIds || []); setValue('status', activeFilters.status || []); }, [activeFilters, setValue]);
    const onSubmit = (data: CurrencyFilterSchema) => { onApplyFilters(data); setIsFilterDrawerOpen(false); };
    const onDrawerClear = () => { onApplyFilters({}); setIsFilterDrawerOpen(false); };
    const toggleColumn = (checked: boolean, colHeader: string) => { if (checked) { setFilteredColumns((currentCols) => { const newVisibleHeaders = [...currentCols.map((c) => c.header as string), colHeader]; return columns.filter((c) => newVisibleHeaders.includes(c.header as string)); }); } else { setFilteredColumns((currentCols) => currentCols.filter((c) => c.header !== colHeader)); } };
    const isColumnVisible = (header: string) => filteredColumns.some((c) => c.header === header);
    return (
        <div className="md:flex items-center justify-between w-full gap-2">
            <div className="flex-grow mb-2 md:mb-0"><DebounceInput value={searchInputValue} placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div>
            <div className="flex gap-2">
                <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {(columns || []).map((col) => col.header && (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(checked) => toggleColumn(checked, col.header as string)} />{col.header}</div>))}
                    </div>
                </Dropdown>
                <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearFilters} />
                <Button icon={<TbFilter />} onClick={() => setIsFilterDrawerOpen(true)}>Filter{activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport}>Export</Button>
            </div>
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onDrawerClear}>Clear</Button><Button size="sm" variant="solid" type="submit" form="filterCurrencyForm">Apply</Button></div>}>
                <Form id="filterCurrencyForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Currency Code"><Controller name="filterCodes" control={control} render={({ field }) => (<Select isMulti placeholder="Select codes..." options={codeOptions} value={codeOptions.filter(o => (field.value || []).includes(o.value))} onChange={(val) => field.onChange((val || []).map(v => v.value))} />)} /></FormItem>
                    <FormItem label="Currency Symbol"><Controller name="filterSymbols" control={control} render={({ field }) => (<Select isMulti placeholder="Select symbols..." options={symbolOptions} value={symbolOptions.filter(o => (field.value || []).includes(o.value))} onChange={(val) => field.onChange((val || []).map(v => v.value))} />)} /></FormItem>
                    <FormItem label="Country"><Controller name="countryIds" control={control} render={({ field }) => (<Select isMulti placeholder="Select countries..." options={countryOptions} value={countryOptions.filter(o => (field.value || []).includes(String(o.value)))} onChange={(val) => field.onChange((val || []).map(v => String(v.value)))} />)} /></FormItem>
                    <FormItem label="Status"><Controller name="status" control={control} render={({ field }) => (<Select isMulti placeholder="Select status..." options={statusOptions} value={statusOptions.filter(o => (field.value || []).includes(o.value))} onChange={(val) => field.onChange((val || []).map(v => v.value))} />)} /></FormItem>
                </Form>
            </Drawer>
        </div>
    );
});
CurrencyTableTools.displayName = 'CurrencyTableTools';


// --- MAIN CURRENCY COMPONENT ---
const Currency = () => {
    const dispatch = useAppDispatch();
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<CurrencyItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Partial<CurrencyFilterSchema>>({});
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
    const [isImageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageToView, setImageToView] = useState<string | null>(null);

    const { CurrencyData = [], CountriesData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);
    
    const countryOptionsForSelect = useMemo(() => Array.isArray(CountriesData) ? CountriesData.map((c: Country) => ({ value: c.id, label: c.name })) : [], [CountriesData]);
    const currencyCodeOptions = useMemo(() => Array.isArray(CurrencyData) ? [...new Set(CurrencyData.map(c => c.currency_code))].sort().map(code => ({ value: code, label: code })) : [], [CurrencyData]);
    const currencySymbolOptions = useMemo(() => Array.isArray(CurrencyData) ? [...new Set(CurrencyData.map(c => c.currency_symbol))].sort().map(symbol => ({ value: symbol, label: symbol })) : [], [CurrencyData]);

    useEffect(() => { dispatch(getCurrencyAction()); dispatch(getCountriesAction()); }, [dispatch]);

    const formMethods = useForm<CurrencyFormData>({ resolver: zodResolver(currencyFormSchema), defaultValues: { currency_code: "", currency_symbol: "", country_id: [], status: 'Active' }, mode: "onChange" });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

    const openImageViewer = (imageUrl: string | null | undefined) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
    const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };

    const columns: ColumnDef<CurrencyItem>[] = useMemo(() => [
        { header: "Currency Code", accessorKey: "currency_code", enableSorting: true, size: 150 },
        { header: "Symbol", accessorKey: "currency_symbol", enableSorting: true, size: 80 },
        { header: "Countries", accessorKey: "countries", size: 250, cell: (props) => { const countries = props.row.original.countries || []; return (<div className="flex flex-wrap gap-1">{countries.map(country => <Tag key={country.id} className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100">{country.name}</Tag>)}</div>) } },
        { header: 'Updated Info', accessorKey: 'updated_at', enableSorting: true, size: 200, cell: (props) => { const { updated_at, updated_by_user } = props.row.original; const formattedDate = updated_at ? new Date(updated_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'; return (<div className="flex items-center gap-2"><Avatar src={updated_by_user?.profile_pic_path} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path)} /><div><span>{updated_by_user?.name || 'N/A'}</span><div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div><div className="text-xs text-gray-500">{formattedDate}</div></div></div>); } },
        { header: "Status", accessorKey: "status", enableSorting: true, size: 100, cell: (props) => (<Tag className={classNames({ "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100": props.row.original.status === 'Active', "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100": props.row.original.status === 'Inactive' })}>{props.row.original.status}</Tag>) },
        { header: 'Action', id: 'action', size: 80, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => (<div className="flex items-center justify-center gap-2"><Tooltip title="Edit"><div className="text-lg p-1.5 cursor-pointer hover:text-blue-500" onClick={() => openEditDrawer(props.row.original)}><TbPencil /></div></Tooltip></div>) },
    ], [countryOptionsForSelect]);

    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<CurrencyItem>[]>(columns);
    useEffect(() => { setFilteredColumns(columns); }, [columns]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData = CurrencyData || [];
        let processedData: CurrencyItem[] = cloneDeep(sourceData);
        if (activeFilters.filterCodes?.length) { const codes = new Set(activeFilters.filterCodes.map(c => c.toLowerCase())); processedData = processedData.filter(item => codes.has(item.currency_code.toLowerCase())); }
        if (activeFilters.filterSymbols?.length) { const symbols = new Set(activeFilters.filterSymbols); processedData = processedData.filter(item => symbols.has(item.currency_symbol)); }
        if (activeFilters.countryIds?.length) { const countryIds = new Set(activeFilters.countryIds.map(id => Number(id))); processedData = processedData.filter(item => (item.countries || []).some(country => countryIds.has(country.id))); }
        if (activeFilters.status?.length) { const statuses = new Set(activeFilters.status); processedData = processedData.filter(item => statuses.has(item.status)); }
        
        if (tableData.query) {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                item.currency_code?.toLowerCase().includes(query) ||
                item.currency_symbol?.toLowerCase().includes(query) ||
                (item.countries || []).some(c => c.name.toLowerCase().includes(query)) ||
                item.status?.toLowerCase().includes(query) ||
                item.updated_by_user?.name?.toLowerCase().includes(query)
            );
        }

        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) { processedData.sort((a, b) => { const aValue = a[key as keyof CurrencyItem] ?? ""; const bValue = b[key as keyof CurrencyItem] ?? ""; if (key === 'updated_at') { const dateA = aValue ? new Date(aValue as string).getTime() : 0; const dateB = bValue ? new Date(bValue as string).getTime() : 0; return order === 'asc' ? dateA - dateB : dateB - dateA; } return order === "asc" ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue)); }); }

        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
    }, [CurrencyData, tableData, activeFilters]);
    
    const activeFilterCount = useMemo(() => {
        let count = 0; if (activeFilters.filterCodes?.length) count++; if (activeFilters.filterSymbols?.length) count++; if (activeFilters.countryIds?.length) count++; if (activeFilters.status?.length) count++; return count;
    }, [activeFilters]);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectPageSizeChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }), [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => { setTableData((prev) => ({ ...prev, query: query, pageIndex: 1 })); }, []);
    const handleApplyFilters = useCallback((filters: Partial<CurrencyFilterSchema>) => { setActiveFilters(filters); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
    const handleRemoveFilter = useCallback((key: keyof CurrencyFilterSchema, value: string) => {
        setActiveFilters(prev => { const newFilters = { ...prev }; const currentValues = prev[key] as string[] | undefined; if (!currentValues) return prev; const newValues = currentValues.filter(item => item !== value); if (newValues.length > 0) { (newFilters as any)[key] = newValues; } else { delete newFilters[key]; } return newFilters; });
        handleSetTableData({ pageIndex: 1 });
    }, [handleSetTableData]);
    const onClearFiltersAndReload = () => { setActiveFilters({}); setTableData({ ...tableData, query: '', pageIndex: 1 }); dispatch(getCurrencyAction()); };
    const handleClearAllFilters = useCallback(() => onClearFiltersAndReload(), [onClearFiltersAndReload]);
    const handleCardClick = (status: 'Active' | 'Inactive' | 'All') => { handleSetTableData({ query: '', pageIndex: 1 }); if (status === 'All') { setActiveFilters({}); } else { setActiveFilters({ status: [status] }); } };

    const openAddDrawer = () => { formMethods.reset({ currency_code: "", currency_symbol: "", country_id: [], status: 'Active' }); setIsAddDrawerOpen(true); };
    const closeAddDrawer = () => { setIsAddDrawerOpen(false); };
    const onAddCurrencySubmit = async (data: CurrencyFormData) => { setIsSubmitting(true); try { await dispatch(addCurrencyAction(data)).unwrap(); toast.push(<Notification title="Currency Added" type="success">{`Currency "${data.currency_code}" was successfully added.`}</Notification>); closeAddDrawer(); dispatch(getCurrencyAction()); } catch (error: any) { toast.push(<Notification title="Failed to Add" type="danger">{error.message || "An unexpected error occurred."}</Notification>); } finally { setIsSubmitting(false); } };
    
    const openEditDrawer = (currency: CurrencyItem) => {
        setEditingCurrency(currency);
        const countryIds = (currency.countries || []).map(c => c.id);
        formMethods.reset({ currency_code: currency.currency_code, currency_symbol: currency.currency_symbol, country_id: countryIds, status: currency.status || 'Active' });
        setIsEditDrawerOpen(true);
    };
    const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingCurrency(null); };
    const onEditCurrencySubmit = async (data: CurrencyFormData) => { if (!editingCurrency?.id) return; setIsSubmitting(true); try { await dispatch(editCurrencyAction({ id: editingCurrency.id, ...data })).unwrap(); toast.push(<Notification title="Currency Updated" type="success">{`"${data.currency_code}" was successfully updated.`}</Notification>); closeEditDrawer(); dispatch(getCurrencyAction()); } catch (error: any) { toast.push(<Notification title="Failed to Update" type="danger">{error.message || "An unexpected error occurred."}</Notification>); } finally { setIsSubmitting(false); } };
    
    const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true); };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const fileName = `currencies_export_${new Date().toISOString().split('T')[0]}.csv`;
        try {
            await dispatch(submitExportReasonAction({ reason: data.reason, module: "Currency", file_name: fileName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            exportToCsvCurrency(fileName, allFilteredAndSortedData);
            setIsExportReasonModalOpen(false);
        } catch (error: any) { toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>); } finally { setIsSubmittingExportReason(false); }
    };

    const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
    const cardBodyClass = "flex items-center gap-2 p-2";

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h3 className="mb-4 lg:mb-0">Currencies</h3>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} className="w-full sm:w-auto mt-2 sm:mt-0">Add Currency</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto mb-4 gap-4">
                        <Tooltip title="Click to show all currencies"><div onClick={() => handleCardClick('All')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="p-2 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100"><TbFile size={20} /></div><div><h6 className="text-sm">{(CurrencyData || []).length}</h6><span className="text-xs">Total</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show active currencies"><div onClick={() => handleCardClick('Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-emerald-200")}><div className="p-2 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100"><TbFileCheck size={20} /></div><div><h6 className="text-sm">{(CurrencyData || []).filter(d => d.status === 'Active').length}</h6><span className="text-xs">Active</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show inactive currencies"><div onClick={() => handleCardClick('Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="p-2 rounded-md bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100"><TbFileX size={20} /></div><div><h6 className="text-sm">{(CurrencyData || []).filter(d => d.status === 'Inactive').length}</h6><span className="text-xs">Inactive</span></div></Card></div></Tooltip>
                    </div>
                    <div className="mb-4">
                        <CurrencyTableTools onSearchChange={handleSearchChange} onApplyFilters={handleApplyFilters} onClearFilters={onClearFiltersAndReload} onExport={handleOpenExportReasonModal} activeFilters={activeFilters} activeFilterCount={activeFilterCount} codeOptions={currencyCodeOptions} symbolOptions={currencySymbolOptions} countryOptions={countryOptionsForSelect} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} searchInputValue={tableData?.query} />
                    </div>
                    <ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAllFilters} countryOptions={countryOptionsForSelect} />
                    {(activeFilterCount > 0 || tableData.query) && <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching currency(ies).</div>}
                    <div className="flex-grow overflow-auto">
                        <DataTable columns={filteredColumns} data={pageData} noData={pageData.length <= 0} loading={masterLoadingStatus === "loading" || isSubmitting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} />
                    </div>
                </AdaptiveCard>
            </Container>

            <Drawer title={isEditDrawerOpen ? "Edit Currency" : "Add Currency"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} onRequestClose={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} width={480} bodyClass="relative" footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={isEditDrawerOpen ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form={isEditDrawerOpen ? "editCurrencyForm" : "addCurrencyForm"} type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (isEditDrawerOpen ? "Saving..." : "Adding...") : "Save"}</Button></div>}>
                <Form id={isEditDrawerOpen ? "editCurrencyForm" : "addCurrencyForm"} onSubmit={formMethods.handleSubmit(isEditDrawerOpen ? onEditCurrencySubmit : onAddCurrencySubmit)} className="flex flex-col gap-4">
                    <FormItem label={<div>Currency Code <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.currency_code} errorMessage={formMethods.formState.errors.currency_code?.message}><Controller name="currency_code" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="e.g., USD" />)} /></FormItem>
                    <FormItem label={<div>Currency Symbol <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.currency_symbol} errorMessage={formMethods.formState.errors.currency_symbol?.message}><Controller name="currency_symbol" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="e.g., $" />)} /></FormItem>
                    <FormItem label={<div>Countries <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.country_id} errorMessage={formMethods.formState.errors.country_id?.message as string}><Controller name="country_id" control={formMethods.control} render={({ field }) => (<Select isMulti placeholder="Select countries..." options={countryOptionsForSelect} value={countryOptionsForSelect.filter(o => (field.value || []).includes(o.value as number))} onChange={(val) => field.onChange((val || []).map(v => v.value))} />)} /></FormItem>
                    <FormItem label={<div>Status <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message}><Controller name="status" control={formMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(o => o.value === field.value) || null} onChange={(o) => field.onChange(o ? o.value : "")} />)} /></FormItem>
                </Form>
                {isEditDrawerOpen && editingCurrency && (<div className="absolute bottom-4 right-4 left-4">
                    <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                        <div><b className="font-semibold text-gray-900 dark:text-gray-100">Latest Update:</b><br /><p className="font-semibold">{editingCurrency.updated_by_user?.name || "N/A"}</p><p>{editingCurrency.updated_by_user?.roles[0]?.display_name || "N/A"}</p></div>
                        <div className="text-right"><b className="font-semibold text-gray-900 dark:text-gray-100"></b><br /><span className="font-semibold">Created:</span> <span>{editingCurrency.created_at ? new Date(editingCurrency.created_at).toLocaleString() : "N/A"}</span><br /><span className="font-semibold">Updated:</span> <span>{editingCurrency.updated_at ? new Date(editingCurrency.updated_at).toLocaleString() : "N/A"}</span></div>
                    </div>
                </div>)}
            </Drawer>
            
            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
                    <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem>
                </Form>
            </ConfirmDialog>

            <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
                <div className="flex justify-center items-center p-4">
                    {imageToView ? (<img src={imageToView} alt="User Profile" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />) : (<p>No image to display.</p>)}
                </div>
            </Dialog>
        </>
    );
};

export default Currency;