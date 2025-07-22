// src/views/your-path/Countries.tsx

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
import { Drawer, Form, FormItem, Input, Tag, Dropdown, Checkbox, Card, Avatar, Dialog, Skeleton } from '@/components/ui' // Import Skeleton

// Icons
import { TbPencil, TbTrash, TbSearch, TbFilter, TbPlus, TbCloudUpload, TbReload, TbX, TbColumns, TbWorld, TbWorldCheck, TbWorldX, TbUserCircle } from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// Redux Imports
import { useAppDispatch } from '@/reduxtool/store'
import { shallowEqual, useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import {
    getCountriesAction,
    addCountryAction,
    editCountryAction,
    deleteCountryAction,
    submitExportReasonAction,
    getContinentsAction,
} from '@/reduxtool/master/middleware'
import { formatCustomDateTime } from '@/utils/formatCustomDateTime'

// --- FEATURE-SPECIFIC TYPES & SCHEMAS ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];

export type CountryItem = { id: string | number; name: string; iso_code: string; phone_code: string; continent_id: number | null; flag_path?: string | null; status: 'Active' | 'Inactive'; created_at?: string; updated_at?: string; updated_by_user?: { name: string; profile_pic_path?: string; roles: { display_name: string }[] } };
export type SelectOption = { value: string; label: string };
type CountryFilterSchema = { names: string[]; regions: string[]; isoCodes: string[]; status: ('Active' | 'Inactive')[]; };

const countryFormSchema = z.object({
    name: z.string().min(1, "Country name is required.").max(100, "Name cannot exceed 100 characters."),
    continent_id: z.number().min(1, 'Continent is required.'),
    iso_code: z.string().min(1, 'ISO code is required.').max(3, "ISO code max 3 characters."),
    phone_code: z.string().min(1, 'Phone code is required.').max(5, "Phone code max 5 characters."),
    flag: z.any()
        .refine((value) => !value || (value instanceof File && value.size <= MAX_FILE_SIZE), `Max image size is 5MB.`)
        .refine(
            (value) => !value || (value instanceof File && ACCEPTED_IMAGE_TYPES.includes(value.type)),
            "Only .jpg, .jpeg, .png, .svg and .webp formats are supported."
        ).optional().nullable(),
    status: z.enum(['Active', 'Inactive'], { required_error: "Status is required." })
});
type CountryFormData = z.infer<typeof countryFormSchema>;

const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
const statusOptions: SelectOption[] = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }];

// --- HELPERS ---
function exportToCsvCountry(filename: string, rows: CountryItem[]) {
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    const CSV_HEADERS = ["ID", "Country Name", "Continent", "ISO Code", "Phone Code", "Flag URL", "Status", "Updated By", "Updated Role", "Updated At"];
    const preparedRows = rows.map(row => ({ id: row.id, name: row.name, regionName: row.continent_id || "N/A", iso_code: row.iso_code, phone_code: row.phone_code, flag_url: row.flag_path || "N/A", status: row.status, updated_by_name: row.updated_by_user?.name || "N/A", updated_by_role: row.updated_by_user?.roles[0]?.display_name || "N/A", updated_at: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A", }));
    const csvContent = [CSV_HEADERS.join(','), ...preparedRows.map(row => [row.id, `"${String(row.name).replace(/"/g, '""')}"`, `"${String(row.regionName).replace(/"/g, '""')}"`, `"${String(row.iso_code).replace(/"/g, '""')}"`, `"${String(row.phone_code).replace(/"/g, '""')}"`, `"${String(row.flag_path).replace(/"/g, '""')}"`, row.status, `"${String(row.updated_by_name).replace(/"/g, '""')}"`, `"${String(row.updated_by_role).replace(/"/g, '""')}"`, `"${String(row.updated_at).replace(/"/g, '""')}"`].join(','))].join('\n');
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
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }) => {
    const activeNames = filterData.names || []; const activeRegions = filterData.regions || []; const activeIsos = filterData.isoCodes || []; const activeStatuses = filterData.status || [];
    const hasActiveFilters = activeNames.length > 0 || activeRegions.length > 0 || activeIsos.length > 0 || activeStatuses.length > 0;
    if (!hasActiveFilters) return null;
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeNames.map(name => (<Tag key={`name-${name}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Name: {name}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('names', name)} /></Tag>))}
            {activeRegions.map(region => (<Tag key={`region-${region}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Continent: {region}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('regions', region)} /></Tag>))}
            {activeIsos.map(iso => (<Tag key={`iso-${iso}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">ISO: {iso}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('isoCodes', iso)} /></Tag>))}
            {activeStatuses.map(status => (<Tag key={`status-${status}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Status: {status}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('status', status)} /></Tag>))}
            {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
        </div>
    );
};

const CountryTableTools = React.forwardRef(({ onSearchChange, onApplyFilters, onClearFilters, onExport, activeFilters, activeFilterCount, countryNameOptions, regionOptions, countryIsoOptions, columns, filteredColumns, setFilteredColumns, searchInputValue, isDataReady }, ref) => {
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const { control, handleSubmit, setValue } = useForm<CountryFilterSchema>({ defaultValues: { names: [], regions: [], isoCodes: [], status: [] }, });
    useEffect(() => { setValue('names', activeFilters.names || []); setValue('regions', activeFilters.regions || []); setValue('isoCodes', activeFilters.isoCodes || []); setValue('status', activeFilters.status || []); }, [activeFilters, setValue]);
    const onSubmit = (data: CountryFilterSchema) => { onApplyFilters(data); setIsFilterDrawerOpen(false); };
    const onDrawerClear = () => { onApplyFilters({}); setIsFilterDrawerOpen(false); };
    const toggleColumn = (checked: boolean, colHeader: string) => { if (checked) { setFilteredColumns((currentCols) => { const newVisibleHeaders = [...currentCols.map((c) => c.header as string), colHeader]; return columns.filter((c) => newVisibleHeaders.includes(c.header as string)); }); } else { setFilteredColumns((currentCols) => currentCols.filter((c) => c.header !== colHeader)); } };
    const isColumnVisible = (header: string) => filteredColumns.some((c) => c.header === header);
    return (
        <div className="md:flex items-center justify-between w-full gap-2">
            <div className="flex-grow mb-2 md:mb-0"><DebounceInput value={searchInputValue} placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div>
            <div className="flex gap-2">
                <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {columns.map((col) => col.header && (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(checked) => toggleColumn(checked, col.header as string)} />{col.header}</div>))}
                    </div>
                </Dropdown>
                <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearFilters} disabled={!isDataReady} />
                <Button icon={<TbFilter />} onClick={() => setIsFilterDrawerOpen(true)} disabled={!isDataReady}>Filter{activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} disabled={!isDataReady}>Export</Button>
            </div>
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onDrawerClear}>Clear</Button><Button size="sm" variant="solid" type="submit" form="filterCountryForm">Apply</Button></div>}>
                <Form id="filterCountryForm" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Country Name"><Controller name="names" control={control} render={({ field }) => (<Select isMulti placeholder="Select names..." options={countryNameOptions} value={countryNameOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                    <FormItem label="Continent"><Controller name="regions" control={control} render={({ field }) => (<Select isMulti placeholder="Select regions..." options={regionOptions} value={regionOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                    <FormItem label="ISO Code"><Controller name="isoCodes" control={control} render={({ field }) => (<Select isMulti placeholder="Select ISOs..." options={countryIsoOptions} value={countryIsoOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                    <FormItem label="Status"><Controller name="status" control={control} render={({ field }) => (<Select isMulti placeholder="Select status..." options={statusOptions} value={statusOptions.filter(o => field.value?.includes(o.value))} onChange={(val) => field.onChange(val.map(v => v.value))} />)} /></FormItem>
                </Form>
            </Drawer>
        </div>
    );
});
CountryTableTools.displayName = 'CountryTableTools';

// --- MAIN COUNTRIES COMPONENT ---
const Countries = () => {
    const dispatch = useAppDispatch();
    const formMethods = useForm<CountryFormData>({ resolver: zodResolver(countryFormSchema), defaultValues: { name: "", continent_id: "", iso_code: "", phone_code: "", flag: null, status: 'Active' }, mode: "onChange" });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

    const [initialLoading, setInitialLoading] = useState(true);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingCountry, setEditingCountry] = useState<CountryItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [countryToDelete, setCountryToDelete] = useState<CountryItem | null>(null);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Partial<CountryFilterSchema>>({});
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [imageToView, setImageToView] = useState<string | null>(null);
    const [addFormFlagPreviewUrl, setAddFormFlagPreviewUrl] = useState<string | null>(null);
    const [editFormFlagPreviewUrl, setEditFormFlagPreviewUrl] = useState<string | null>(null);

    const { ContinentsData = [], CountriesData = [] } = useSelector(masterSelector, shallowEqual);

    const isDataReady = !initialLoading;

    const totalCount = useMemo(() => CountriesData.length, [CountriesData]);
    const activeCount = useMemo(() => CountriesData.length > 0 && CountriesData?.filter((c: CountryItem) => c.status === 'Active').length, [CountriesData]);
    const inactiveCount = useMemo(() => CountriesData.length > 0 && CountriesData?.filter((c: CountryItem) => c.status === 'Inactive').length, [CountriesData]);

    const countryNameOptionsForFilter = useMemo(() => Array.isArray(CountriesData) ? [...new Set(CountriesData?.map(c => c.name))].sort().map(name => ({ value: name, label: name })) : [], [CountriesData]);
    const countryIsoOptionsForFilter = useMemo(() => Array.isArray(CountriesData) ? [...new Set(CountriesData?.map(c => c.iso_code))].sort().map(iso => ({ value: iso, label: iso })) : [], [CountriesData]);
    const regionOptions = useMemo(() => Array.isArray(ContinentsData) ? [...new Set(ContinentsData?.map(c => { return { name: c.name, id: c.id } }).filter(Boolean))].sort().map(region => ({ value: region.id as string, label: region.name as string })) : [], [ContinentsData]);

    const refreshData = useCallback(async () => {
        setInitialLoading(true);
        try {
            await dispatch(getCountriesAction());
            await dispatch(getContinentsAction());
        } catch (error) {
            console.error("Failed to refresh data:", error);
            toast.push(<Notification title="Data Refresh Failed" type="danger">Could not reload country data.</Notification>);
        } finally {
            setInitialLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    useEffect(() => {
        return () => {
            if (addFormFlagPreviewUrl) URL.revokeObjectURL(addFormFlagPreviewUrl);
            if (editFormFlagPreviewUrl) URL.revokeObjectURL(editFormFlagPreviewUrl);
        };
    }, [addFormFlagPreviewUrl, editFormFlagPreviewUrl]);

    const openImageViewer = useCallback((imageUrl: string | null | undefined) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } }, []);
    const closeImageViewer = useCallback(() => { setImageViewerOpen(false); setImageToView(null); }, []);

    const openEditDrawer = useCallback((country: CountryItem) => {
        setEditingCountry(country);
        formMethods.reset({ name: country.name, continent_id: country.continent_id || "", iso_code: country.iso_code, phone_code: country.phone_code, flag: null, status: country.status });
        if (editFormFlagPreviewUrl) URL.revokeObjectURL(editFormFlagPreviewUrl);
        setEditFormFlagPreviewUrl(null);
        setIsEditDrawerOpen(true);
    }, [formMethods, editFormFlagPreviewUrl]);

    const handleDeleteClick = useCallback((country: CountryItem) => { setCountryToDelete(country); setSingleDeleteConfirmOpen(true); }, []);

    const columns: ColumnDef<CountryItem>[] = useMemo(() => [
        {
            header: 'Flag',
            accessorKey: 'flag_path',
            enableSorting: false,
            size: 80,
            cell: (props) => {
                const { flag_path } = props.row.original
                return flag_path ? (
                    <Avatar
                        src={flag_path}
                        size={30}
                        shape="circle"
                        icon={<TbWorld />}
                        className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                        onClick={() => openImageViewer(flag_path)}
                    />
                ) : (
                    <Avatar size={30} shape="circle" icon={<TbWorld />} />
                )
            },
        },
        { header: "Country Name", accessorKey: "name", enableSorting: true, size: 200 },
        { header: "Continent", accessorKey: "region", enableSorting: true, size: 150 },
        { header: "ISO", accessorKey: "iso_code", enableSorting: true, size: 80 },
        { header: "Phone Code", accessorKey: "phone_code", enableSorting: true, size: 120 },
        {
            header: "Updated Info",
            accessorKey: "updated_at",
            enableSorting: true,
            size: 200,
            cell: (props) => {
                const { updated_at, updated_by_user } = props.row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Avatar
                            src={updated_by_user?.profile_pic_path}
                            shape="circle"
                            size="sm"
                            icon={<TbUserCircle />}
                            className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                            onClick={() =>
                                openImageViewer(updated_by_user?.profile_pic_path)
                            }
                        />
                        <div>
                            <span>{updated_by_user?.name || "N/A"}</span>
                            <div className="text-xs">
                                <b>{updated_by_user?.roles?.[0]?.display_name || ""}</b>
                            </div>
                            <div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div>
                        </div>
                    </div>
                );
            },
        },
        { header: "Status", accessorKey: "status", enableSorting: true, size: 100, cell: (props) => (<Tag className={classNames({ "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-b border-emerald-300 dark:border-emerald-700": props.row.original.status === 'Active', "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-b border-red-300 dark:border-red-700": props.row.original.status === 'Inactive' })}>{props.row.original.status}</Tag>) },
        { header: 'Action', id: 'action', size: 80, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => (<div className="flex items-center justify-center gap-2"><Tooltip title="Edit"><div className="text-lg p-1.5 cursor-pointer hover:text-blue-500" onClick={() => openEditDrawer(props.row.original)}><TbPencil /></div></Tooltip><Tooltip title="Delete"><div className="text-lg p-1.5 cursor-pointer hover:text-red-500" onClick={() => handleDeleteClick(props.row.original)}><TbTrash /></div></Tooltip></div>) },
    ], [openImageViewer, openEditDrawer, handleDeleteClick]);

    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<CountryItem>[]>(columns);
    useEffect(() => { setFilteredColumns(columns); }, [columns]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: CountryItem[] = cloneDeep(CountriesData || []);
        if (activeFilters.names?.length) { const names = new Set(activeFilters.names.map(n => n.toLowerCase())); processedData = processedData.filter(item => names.has(item.name.toLowerCase())); }
        if (activeFilters.regions?.length) { const regions = new Set(activeFilters.regions); processedData = processedData.filter(item => item.continent_id && regions.has(item.continent_id)); }
        if (activeFilters.isoCodes?.length) { const isoCodes = new Set(activeFilters.isoCodes.map(i => i.toLowerCase())); processedData = processedData.filter(item => isoCodes.has(item.iso_code.toLowerCase())); }
        if (activeFilters.status?.length) { const statuses = new Set(activeFilters.status); processedData = processedData.filter(item => statuses.has(item.status)); }
        if (tableData.query) {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item =>
                item.name?.toLowerCase().includes(query) ||
                item.continent_id?.toLowerCase().includes(query) ||
                item.iso_code?.toLowerCase().includes(query) ||
                item.phone_code?.toLowerCase().includes(query) ||
                item.status?.toLowerCase().includes(query) ||
                item.updated_by_user?.name?.toLowerCase().includes(query)
            );
        }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0) {
            processedData.sort((a, b) => {
                const aValue = a[key as keyof CountryItem] ?? "";
                const bValue = b[key as keyof CountryItem] ?? "";
                if (key === 'updated_at') { const dateA = aValue ? new Date(aValue as string).getTime() : 0; const dateB = bValue ? new Date(bValue as string).getTime() : 0; return order === 'asc' ? dateA - dateB : dateB - dateA; }
                return order === "asc" ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
            });
        }
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
    }, [CountriesData, tableData, activeFilters]);

    const activeFilterCount = useMemo(() => {
        let count = 0; if (activeFilters.names?.length) count++; if (activeFilters.regions?.length) count++; if (activeFilters.isoCodes?.length) count++; if (activeFilters.status?.length) count++; return count;
    }, [activeFilters]);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectPageSizeChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }), [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => { setTableData((prev) => ({ ...prev, query: query, pageIndex: 1, })); }, []);
    const handleApplyFilters = useCallback((filters: Partial<CountryFilterSchema>) => { setActiveFilters(filters); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
    const handleRemoveFilter = useCallback((key: keyof CountryFilterSchema, value: string) => {
        setActiveFilters(prev => { const newFilters = { ...prev }; const currentValues = prev[key] as string[] | undefined; if (!currentValues) return prev; const newValues = currentValues.filter(item => item !== value); if (newValues.length > 0) { (newFilters as any)[key] = newValues; } else { delete newFilters[key]; } return newFilters; });
        handleSetTableData({ pageIndex: 1 });
    }, [handleSetTableData]);

    const onClearFiltersAndReload = useCallback(() => {
        setActiveFilters({});
        setTableData(prev => ({ ...prev, query: '', pageIndex: 1 }));
        refreshData();
    }, [refreshData]);

    const handleClearAllFilters = useCallback(() => onClearFiltersAndReload(), [onClearFiltersAndReload]);

    const handleCardClick = (status: 'Active' | 'Inactive' | 'All') => {
        handleSetTableData({ query: '', pageIndex: 1 });
        if (status === 'All') { setActiveFilters({}); }
        else { setActiveFilters({ status: [status] }); }
    };

    const openAddDrawer = () => {
        formMethods.reset({ name: "", continent_id: "", iso_code: "", phone_code: "", flag: null, status: 'Active' });
        if (addFormFlagPreviewUrl) URL.revokeObjectURL(addFormFlagPreviewUrl);
        setAddFormFlagPreviewUrl(null);
        setIsAddDrawerOpen(true);
    };
    const closeAddDrawer = () => {
        if (addFormFlagPreviewUrl) URL.revokeObjectURL(addFormFlagPreviewUrl);
        setAddFormFlagPreviewUrl(null);
        setIsAddDrawerOpen(false);
    };

    const prepareFormData = (data: CountryFormData) => {
        const formData = new FormData();

        (Object.keys(data) as Array<keyof CountryFormData>).forEach((key) => {
            const value = data[key];
            if (key === 'flag') {
                if (value instanceof File) {
                    formData.append('flag', value);
                }
            } else if (key === 'iso_code') {
                formData.append('iso_code', value);
            } else if (key === 'continent_id') {
                formData.append('continent_id', value);
            } else if (value !== null && value !== undefined) {
                formData.append(key, value as string);
            }
        });
        return formData;
    };

    const onAddCountrySubmit = async (data: CountryFormData) => {
        setIsSubmitting(true);
        const formData = prepareFormData(data);
        try {
            await dispatch(addCountryAction(formData as any)).unwrap();
            toast.push(<Notification title="Country Added" type="success">{`Country "${data.name}" was successfully added.`}</Notification>);
            closeAddDrawer();
            refreshData();
        } catch (error: any) {
            toast.push(<Notification title="Failed to Add Country" type="danger">{error.message || "An unexpected error occurred."}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeEditDrawer = () => {
        if (editFormFlagPreviewUrl) URL.revokeObjectURL(editFormFlagPreviewUrl);
        setEditFormFlagPreviewUrl(null);
        setIsEditDrawerOpen(false);
        setEditingCountry(null);
    };

    const onEditCountrySubmit = async (data: CountryFormData) => {
        if (!editingCountry?.id) return;
        setIsSubmitting(true);
        const formData = prepareFormData(data);

        formData.append('_method', 'PUT');

        try {
            await dispatch(editCountryAction({ id: editingCountry.id, data: formData })).unwrap();
            toast.push(<Notification title="Country Updated" type="success">{`"${data.name}" was successfully updated.`}</Notification>);
            closeEditDrawer();
            refreshData();
        } catch (error: any) {
            toast.push(<Notification title="Failed to Update Country" type="danger">{error.message || "An unexpected error occurred."}</Notification>);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onConfirmSingleDelete = async () => {
        if (!countryToDelete?.id) return;
        setIsDeleting(true);
        try {
            await dispatch(deleteCountryAction({ id: countryToDelete.id })).unwrap();
            toast.push(<Notification title="Country Deleted" type="success">{`"${countryToDelete.name}" was successfully deleted.`}</Notification>);
            refreshData();
        } catch (error: any) {
            toast.push(<Notification title="Failed to Delete Country" type="danger">{error.message || "An unexpected error occurred."}</Notification>);
        } finally {
            setIsDeleting(false);
            setSingleDeleteConfirmOpen(false);
            setCountryToDelete(null);
        }
    };

    const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true); };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const fileName = `countries_export_${new Date().toISOString().split('T')[0]}.csv`;
        try {
            await dispatch(submitExportReasonAction({ reason: data.reason, module: "Countries", file_name: fileName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            exportToCsvCountry(fileName, allFilteredAndSortedData);
            setIsExportReasonModalOpen(false);
        } catch (error: any) { toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>); } finally { setIsSubmittingExportReason(false); }
    };

    const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
    const cardBodyClass = "flex items-center gap-2 p-2";

    const renderCardContent = (count: number | false) => {
        if (initialLoading) {
            return <Skeleton width={40} height={20} />;
        }
        return <h6 className="text-sm">{typeof count === 'number' ? count : 0}</h6>;
    };

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h3 className="mb-4 lg:mb-0">Countries</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} className="w-full sm:w-auto mt-2 sm:mt-0">Add Country</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <Tooltip title="Click to show all countries"><div onClick={() => handleCardClick('All')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="p-2 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100"><TbWorld size={20} /></div><div>{renderCardContent(totalCount)}<span className="text-xs">Total</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show active countries"><div onClick={() => handleCardClick('Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-emerald-200")}><div className="p-2 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100"><TbWorldCheck size={20} /></div><div>{renderCardContent(activeCount)}<span className="text-xs">Active</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show inactive countries"><div onClick={() => handleCardClick('Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="p-2 rounded-md bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100"><TbWorldX size={20} /></div><div>{renderCardContent(inactiveCount)}<span className="text-xs">Inactive</span></div></Card></div></Tooltip>
                    </div>
                    <div className="mb-4">
                        <CountryTableTools onSearchChange={handleSearchChange} onApplyFilters={handleApplyFilters} onClearFilters={onClearFiltersAndReload} onExport={handleOpenExportReasonModal} activeFilters={activeFilters} activeFilterCount={activeFilterCount} countryNameOptions={countryNameOptionsForFilter} regionOptions={regionOptions} countryIsoOptions={countryIsoOptionsForFilter} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} searchInputValue={tableData?.query} isDataReady={isDataReady} />
                    </div>
                    <ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAllFilters} />
                    {(activeFilterCount > 0 || tableData.query) && <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching countr(y/ies).</div>}
                    <div className="flex-grow overflow-auto">
                        <DataTable columns={filteredColumns} data={pageData} noData={pageData.length <= 0} loading={initialLoading || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} />
                    </div>
                </AdaptiveCard>
            </Container>

            {/* --- ADD/EDIT DRAWERS --- */}
            {[{ isEdit: false, isOpen: isAddDrawerOpen, closeFn: closeAddDrawer, onSubmit: onAddCountrySubmit, title: 'Add Country', formId: 'addCountryForm', submitText: 'Adding...', saveText: 'Save' }, { isEdit: true, isOpen: isEditDrawerOpen, closeFn: closeEditDrawer, onSubmit: onEditCountrySubmit, title: 'Edit Country', formId: 'editCountryForm', submitText: 'Saving...', saveText: 'Save' }].map(d => {
                const previewUrl = d.isEdit ? editFormFlagPreviewUrl : addFormFlagPreviewUrl;
                const setPreviewUrl = d.isEdit ? setEditFormFlagPreviewUrl : setAddFormFlagPreviewUrl;

                return (
                    <Drawer key={d.formId} title={d.title} isOpen={d.isOpen} onClose={d.closeFn} onRequestClose={d.closeFn} width={480} bodyClass="relative" footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={d.closeFn} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form={d.formId} type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? d.submitText : d.saveText}</Button></div>}>
                        <Form id={d.formId} onSubmit={formMethods.handleSubmit(d.onSubmit as any)} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-2">
                                <FormItem label={<div>Country Name <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}><Controller name="name" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter Country Name" />)} /></FormItem>
                                <FormItem label={<div>Continent <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.continent_id} errorMessage={formMethods.formState.errors.continent_id?.message}><Controller name="continent_id" control={formMethods.control} render={({ field }) => (<Select placeholder="Select Continent" options={regionOptions} value={regionOptions.find(o => o.value === field.value) || null} onChange={(o) => field.onChange(o ? o.value : "")} />)} /></FormItem>
                                <FormItem label={<div>ISO Code <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.iso_code} errorMessage={formMethods.formState.errors.iso_code?.message}><Controller name="iso_code" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="e.g., USA" />)} /></FormItem>
                                <FormItem label={<div>Phone Code <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.phone_code} errorMessage={formMethods.formState.errors.phone_code?.message}><Controller name="phone_code" control={formMethods.control} render={({ field }) => (<Input {...field} placeholder="e.g., +1" />)} /></FormItem>
                            </div>
                            <FormItem
                                label="Flag Image"
                                invalid={!!formMethods.formState.errors.flag}
                                errorMessage={formMethods.formState.errors.flag?.message as string}
                            >
                                {d.isEdit && editingCountry?.flag_path && !previewUrl && (
                                    <div className="mb-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Flag:</p>
                                        <Avatar src={editingCountry.flag_path} size={60} shape="circle" icon={<TbWorld />} />
                                    </div>
                                )}
                                {previewUrl && (
                                    <div className="mt-2 mb-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                            {d.isEdit ? 'New Flag Preview:' : 'Flag Preview:'}
                                        </p>
                                        <Avatar src={previewUrl} size={60} shape="circle" icon={<TbWorld />} />
                                    </div>
                                )}
                                <Controller
                                    name="flag"
                                    control={formMethods.control}
                                    render={({ field: { onChange: rhfOnChange, onBlur, name, ref: fieldRef } }) => (
                                        <Input
                                            type="file"
                                            name={name}
                                            ref={fieldRef}
                                            onBlur={onBlur}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const file = e.target.files?.[0] || null;
                                                rhfOnChange(file);
                                                if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                setPreviewUrl(file ? URL.createObjectURL(file) : null);
                                                formMethods.trigger('flag');
                                            }}
                                            accept="image/png, image/jpeg, image/svg+xml, image/webp"
                                        />
                                    )}
                                />
                                {d.isEdit && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {editingCountry?.flag_path
                                            ? 'Leave blank to keep current flag, or select a new file to replace it.'
                                            : 'Upload a flag image.'}
                                    </p>
                                )}
                            </FormItem>
                            <FormItem label={<div>Status <span className="text-red-500">*</span></div>} invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message}><Controller name="status" control={formMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(o => o.value === field.value) || null} onChange={(o) => field.onChange(o ? o.value : "")} />)} /></FormItem>
                        </Form>
                        {d.isEdit && editingCountry && (
                            <div className=" grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                                <div>
                                    <b className="mt-3 mb-3 font-semibold text-primary">
                                        Latest Update:
                                    </b>
                                    <br />
                                    <p className="text-sm font-semibold">
                                        {editingCountry.updated_by_user?.name || "N/A"}
                                    </p>
                                    <p>
                                        {editingCountry.updated_by_user?.roles[0]?.display_name ||
                                            "N/A"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <br />
                                    <span className="font-semibold">Created At:</span>{" "}
                                    <span>
                                        {editingCountry.created_at
                                            ? `${new Date(
                                                editingCountry.created_at
                                            ).getDate()} ${new Date(
                                                editingCountry.created_at
                                            ).toLocaleString("en-US", {
                                                month: "short",
                                            })} ${new Date(
                                                editingCountry.created_at
                                            ).getFullYear()}, ${new Date(
                                                editingCountry.created_at
                                            ).toLocaleTimeString("en-US", {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true,
                                            })}`
                                            : "N/A"}
                                    </span>
                                    <br />
                                    <span className="font-semibold">Updated At:</span>{" "}
                                    <span>
                                        { }
                                        {editingCountry.updated_at
                                            ? `${new Date(
                                                editingCountry.updated_at
                                            ).getDate()} ${new Date(
                                                editingCountry.updated_at
                                            ).toLocaleString("en-US", {
                                                month: "short",
                                            })} ${new Date(
                                                editingCountry.updated_at
                                            ).getFullYear()}, ${new Date(
                                                editingCountry.updated_at
                                            ).toLocaleTimeString("en-US", {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true,
                                            })}`
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </Drawer>
                )
            })}

            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
                    <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem>
                </Form>
            </ConfirmDialog>
            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Country" onClose={() => { setSingleDeleteConfirmOpen(false); setCountryToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setCountryToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setCountryToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting}>
                <p>Are you sure you want to delete the country "<strong>{countryToDelete?.name}</strong>"? This action cannot be undone.</p>
            </ConfirmDialog>
            <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
                <div className="flex justify-center items-center p-4">
                    {imageToView ? (<img src={imageToView} alt="User Profile" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />) : (<p>No image to display.</p>)}
                </div>
            </Dialog>
        </>
    );
};

export default Countries;