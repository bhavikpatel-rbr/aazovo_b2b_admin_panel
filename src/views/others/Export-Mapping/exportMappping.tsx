// src/views/your-path/ExportMapping.tsx

import { masterSelector } from '@/reduxtool/master/masterSlice'
import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { CSVLink } from 'react-csv'
import { Controller, useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { z } from 'zod'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import DebounceInput from '@/components/shared/DebouceInput'
import {
    Avatar,
    Card,
    Checkbox,
    DatePicker,
    Dialog,
    Drawer,
    Dropdown,
    Form,
    FormItem,
    Input,
    Select,
    Tag,
} from '@/components/ui'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import Tooltip from '@/components/ui/Tooltip'

// Redux Actions
import {
    deleteAllExportMappingsAction,
    getExportMappingsAction,
    submitExportReasonAction,
} from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'

// Icons
import { IoEyeOutline } from 'react-icons/io5'
import {
    TbBookUpload,
    TbCalendarUp,
    TbCloudUpload,
    TbColumns,
    TbFilter,
    TbReload,
    TbSearch,
    TbTrash,
    TbUserCircle,
    TbUserUp,
    TbX
} from 'react-icons/tb'
import userIconPlaceholder from '/img/avatars/thumb-1.jpg'

// Types
import type { TableQueries } from '@/@types/common'
import type { ColumnDef, OnSortParam } from '@/components/shared/DataTable'
import { formatCustomDateTime } from '@/utils/formatCustomDateTime'

// --- API & Frontend Types ---
export type ApiExportMapping = {
    id: number
    created_at: string
    updated_at: string
    exported_by: string
    exported_from: string
    reason: string | null
    deleted_at: string | null
    user: any
    roles: any
    file_name: string | null
}

export type ExportMappingItem = {
    id: number
    userId: number | null
    userName: string
    userRole: string
    exportFrom: string
    fileName: string | null
    reason: string | null
    exportDate: Date
    profile_pic_path: string | null
}

// --- Zod Schemas ---
const exportReasonSchema = z.object({
    reason: z
        .string()
        .min(10, 'Reason must be at least 10 characters long.')
        .max(255, 'Reason cannot exceed 255 characters.'),
})
type ExportReasonFormData = z.infer<typeof exportReasonSchema>

type ExportMappingFilterSchema = {
    userRole: string[]
    exportFrom: string[]
    fileExtensions: string[]
    exportDate: [Date | null, Date | null] | null
}

// --- Data Transformation ---
const transformApiDataToExportMappingItem = (
    apiData: ApiExportMapping,
): ExportMappingItem | null => {
    if (!apiData) return null
    try {
        return {
            id: apiData.id,
            userId: null,
            userName: apiData.user.name || 'System / Unknown',
            userRole: apiData.user.roles[0]?.display_name || 'N/A',
            exportFrom: apiData.exported_from || 'N/A',
            fileName: apiData.file_name,
            reason: apiData.reason,
            exportDate: new Date(apiData.created_at),
            profile_pic_path: apiData.user.profile_pic_path,
        }
    } catch (error) {
        console.error('Error transforming API data for ID:', apiData.id, error)
        return null
    }
}

// --- ActionColumn Component ---
const ActionColumn = ({ data }: { data: ExportMappingItem }) => {
    const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false)
    const openViewDrawer = () => setIsViewDrawerOpen(true)
    const closeViewDrawer = () => setIsViewDrawerOpen(false)

    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
            <Tooltip title="View Record">
                <div
                    className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400')}
                    role="button"
                    tabIndex={0}
                    onClick={openViewDrawer}
                    onKeyDown={(e) => e.key === 'Enter' && openViewDrawer()}
                >
                    <IoEyeOutline />
                </div>
            </Tooltip>
            <Drawer title="Export Mapping Details" isOpen={isViewDrawerOpen} onClose={closeViewDrawer} onRequestClose={closeViewDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeViewDrawer} type="button">Close</Button></div>}>
                <div className="px-1">
                    <h6 className="text-base font-semibold">Exported By</h6>
                    <figure className="flex gap-2 items-center mt-2">
                        <img src={data.profile_pic_path || userIconPlaceholder} alt={data.userName} className="h-9 w-9 rounded-full" />
                        <figcaption className="flex flex-col"><span className="font-semibold text-black dark:text-white">{data.userName}</span><span className="text-xs text-gray-600 dark:text-gray-400">{data.userRole}</span></figcaption>
                    </figure>
                    <h6 className="text-base font-semibold mt-4">Exported From</h6>
                    <p className="mb-2 mt-1"><span className="font-semibold text-black dark:text-white">Module:{' '}</span><span>{data.exportFrom}</span></p>
                    {data.exportFrom !== 'N/A' && (<Tag className="border border-emerald-600 text-emerald-600 bg-transparent inline-block w-auto mt-1">{data.exportFrom}</Tag>)}
                    <Card className="!mt-8 bg-gray-100 dark:bg-gray-700 border-none">
                        <h6 className="text-base font-semibold">Exported Log</h6>
                        <p className="mt-2"><span className="font-semibold text-black dark:text-white">Date:{' '}</span><span>{!isNaN(data.exportDate.getTime()) && formatCustomDateTime(data.exportDate)}</span></p>
                        <p className="mt-1"><span className="font-semibold text-black dark:text-white">File Name:{' '}</span><span className="break-all">{data.fileName}</span></p>
                        {data.reason && (<><h6 className="text-sm font-semibold text-black dark:text-white mt-2">Reason:</h6><p className="whitespace-pre-wrap text-justify">{data.reason}</p></>)}
                    </Card>
                </div>
            </Drawer>
        </div>
    )
}
ActionColumn.displayName = 'ActionColumn'

// --- ExportMappingTableTools Component ---
const ExportMappingTableTools = React.forwardRef(({
    columns, filteredColumns, setFilteredColumns,
    onSearchChange, onApplyFilters, onClearFilters, onExport, onDeleteAll,
    isDataReady, activeFilterCount, activeFilters,
    allExportMappings, searchInputValue,
}, ref) => {
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const { control, handleSubmit, setValue } = useForm<ExportMappingFilterSchema>({ defaultValues: { userRole: [], exportFrom: [], fileExtensions: [], exportDate: null } });
    useEffect(() => { setValue('userRole', activeFilters.userRole || []); setValue('exportFrom', activeFilters.exportFrom || []); setValue('fileExtensions', activeFilters.fileExtensions || []); setValue('exportDate', activeFilters.exportDate || null); }, [activeFilters, setValue]);
    const exportFiltersSubmitHandler = (data: ExportMappingFilterSchema) => { onApplyFilters(data); setIsFilterDrawerOpen(false); };
    const handleClearFormInDrawer = () => { onApplyFilters({}); setIsFilterDrawerOpen(false); };
    const userRoles = useMemo(() => { if (!isDataReady || !allExportMappings.length) return []; const roles = new Set(allExportMappings.map(item => item.userRole).filter(Boolean)); return Array.from(roles).sort().map(role => ({ value: role, label: role })); }, [allExportMappings, isDataReady]);
    const exportFromOptions = useMemo(() => { if (!isDataReady || !allExportMappings.length) return []; const froms = new Set(allExportMappings.map(item => item.exportFrom).filter(Boolean)); return Array.from(froms).sort().map(from => ({ value: from, label: from })); }, [allExportMappings, isDataReady]);
    const fileExtensionsOptions = useMemo(() => [ { value: '.xlsx', label: 'Excel (.xlsx)' }, { value: '.json', label: 'JSON (.json)' }, { value: '.pdf', label: 'PDF (.pdf)' }, { value: '.log', label: 'Log (.log)' }, { value: '.bak', label: 'Backup (.bak)' },], []);
    const toggleColumn = (checked: boolean, colHeader: string) => { if (checked) { setFilteredColumns(currentCols => { const newVisibleHeaders = [...currentCols.map(c => c.header as string), colHeader]; return columns.filter(c => newVisibleHeaders.includes(c.header as string)); }); } else { setFilteredColumns(currentCols => currentCols.filter(c => c.header !== colHeader)); } };
    const isColumnVisible = (header: string) => filteredColumns.some(c => c.header === header);

    return (
        <div className="md:flex items-center justify-between w-full gap-2">
            <div className="flex-grow mb-2 md:mb-0">
                <DebounceInput value={searchInputValue} placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => {
                    onSearchChange(e.target.value)
                }
                } />
            </div>
            <div className="flex gap-2">
                <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {columns.map((col) => col.header && (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(checked) => toggleColumn(checked, col.header as string)} />{col.header}</div>))}
                    </div>
                </Dropdown>
                <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearFilters} disabled={!isDataReady} />
                <Button icon={<TbFilter />} onClick={() => setIsFilterDrawerOpen(true)} disabled={!isDataReady}>
                    Filter
                    {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
                </Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} disabled={!isDataReady || !allExportMappings.length}>Export</Button>
                <Button variant="danger" icon={<TbTrash />} onClick={onDeleteAll} disabled={!isDataReady || !allExportMappings.length}>Delete All</Button>
            </div>
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} onRequestClose={() => setIsFilterDrawerOpen(false)} bodyClass="flex flex-col overflow-hidden" footer={<div className="text-right w-full "><Button size="sm" className="mr-2" onClick={handleClearFormInDrawer} type="button">Clear</Button><Button size="sm" variant="solid" type="submit" form="filterForm">Apply</Button></div>}>
                <Form id="filterForm" size="sm" onSubmit={handleSubmit(exportFiltersSubmitHandler)}>
                    <FormItem label="User Role"><Controller control={control} name="userRole" render={({ field }) => (<Select isMulti placeholder="Select roles" options={userRoles} value={userRoles.filter((option) => field.value?.includes(option.value))} onChange={(selected) => field.onChange(selected ? selected.map((opt) => opt.value) : [])} isLoading={!isDataReady && userRoles.length === 0} />)} /></FormItem>
                    <FormItem label="Exported From (Module)"><Controller control={control} name="exportFrom" render={({ field }) => (<Select isMulti placeholder="Select modules" options={exportFromOptions} value={exportFromOptions.filter((option) => field.value?.includes(option.value))} onChange={(selected) => field.onChange(selected ? selected.map((opt) => opt.value) : [])} isLoading={!isDataReady && exportFromOptions.length === 0} />)} /></FormItem>
                    {/* <FormItem label="File Type (Extension)"><Controller control={control} name="fileExtensions" render={({ field }) => (<Select isMulti placeholder="Select file types" options={fileExtensionsOptions} value={fileExtensionsOptions.filter((option) => field.value?.includes(option.value))} onChange={(selected) => field.onChange(selected ? selected.map((opt) => opt.value) : [])} />)} /></FormItem> */}
                    <FormItem label="Export Date Range"><Controller control={control} name="exportDate" render={({ field }) => (<DatePicker.DatePickerRange placeholder="Select date range" value={field.value ?? undefined} onChange={(dateRange) => field.onChange(dateRange)} inputFormat="MM/DD/YYYY" />)} /></FormItem>
                </Form>
            </Drawer>
        </div>
    );
});
ExportMappingTableTools.displayName = 'ExportMappingTableTools';

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }) => {
    const activeRoles = filterData.userRole || []
    const activeModules = filterData.exportFrom || []
    const activeExtensions = filterData.fileExtensions || []
    const activeDateRange = filterData.exportDate
    const formatDate = (date: Date | null) => { if (!date) return ''; return new Date(date).toLocaleDateString() }
    const hasActiveFilters = activeRoles.length > 0 || activeModules.length > 0 || activeExtensions.length > 0 || (activeDateRange && (activeDateRange[0] || activeDateRange[1]))
    if (!hasActiveFilters) return null
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2 ">Active Filters:</span>
            {activeRoles.map((role) => (<Tag key={`role-${role}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Role: {role}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('userRole', role)} /></Tag>))}
            {activeModules.map((module) => (<Tag key={`module-${module}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Module: {module}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('exportFrom', module)} /></Tag>))}
            {activeExtensions.map((ext) => (<Tag key={`ext-${ext}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Type: {ext}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('fileExtensions', ext)} /></Tag>))}
            {activeDateRange && (activeDateRange[0] || activeDateRange[1]) && (<Tag key="date-range-filter" prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Date: {formatDate(activeDateRange[0])} - {formatDate(activeDateRange[1])}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('exportDate', '')} /></Tag>)}
            {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
        </div>
    )
}

// --- MAIN EXPORT MAPPING COMPONENT ---
const ExportMapping = () => {
    const dispatch = useAppDispatch();
    const csvLinkRef = useRef<any>(null);
    const [exportMappings, setExportMappings] = useState<ExportMappingItem[]>([]);
    const { apiExportMappings = {}, status: masterLoadingStatus = 'idle' } = useSelector(masterSelector);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [exportData, setExportData] = useState<{ data: any[]; filename: string }>({ data: [], filename: '' });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: '' }, mode: 'onChange' });
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [activeFilters, setActiveFilters] = useState<Partial<ExportMappingFilterSchema>>({});
    const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const tableLoading = masterLoadingStatus === 'loading';
    const isDataReady = masterLoadingStatus === 'idle';

    useEffect(() => { dispatch(getExportMappingsAction()) }, [dispatch]);

    useEffect(() => {
        if (masterLoadingStatus === 'idle' && apiExportMappings?.data) {
            const transformedData = (apiExportMappings.data as ApiExportMapping[]).map(transformApiDataToExportMappingItem).filter((item): item is ExportMappingItem => item !== null);
            setExportMappings(transformedData || []);
        } else if (masterLoadingStatus === 'failed') {
            toast.push(<Notification title="Failed to Load Data" type="danger" duration={4000}>There was an error fetching the export logs.</Notification>);
            setExportMappings([]);
        }
    }, [apiExportMappings?.data, masterLoadingStatus]);

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        if (!isDataReady) { return { pageData: [], total: 0, allFilteredAndSortedData: [] } }
        let processedData = [...exportMappings];
        if (activeFilters.userRole?.length) { const roles = new Set(activeFilters.userRole); processedData = processedData.filter((item) => roles.has(item.userRole)); }
        if (activeFilters.exportFrom?.length) { const froms = new Set(activeFilters.exportFrom); processedData = processedData.filter((item) => froms.has(item.exportFrom)); }
        if (activeFilters.fileExtensions?.length) { const extensions = new Set(activeFilters.fileExtensions.map((ext) => ext.toLowerCase())); processedData = processedData.filter((item) => { if (!item.fileName) return false; const fileExt = item.fileName.slice(item.fileName.lastIndexOf('.')).toLowerCase(); return extensions.has(fileExt); }); }
        if (activeFilters.exportDate) { const [startDate, endDate] = activeFilters.exportDate; processedData = processedData.filter((item) => { if (isNaN(item.exportDate.getTime())) return false; const itemTime = item.exportDate.getTime(); const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)).getTime() : null; const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)).getTime() : null; if (start && end) return itemTime >= start && itemTime <= end; if (start) return itemTime >= start; if (end) return itemTime <= end; return true; }); }
        if (tableData.query) { const query = tableData.query.toLowerCase(); processedData = processedData.filter((item) => item.id.toString().includes(query) || item.userName.toLowerCase().includes(query) || item.userRole.toLowerCase().includes(query) || item.exportFrom.toLowerCase().includes(query) || (item.fileName && item.fileName.toLowerCase().includes(query)) || (item.reason && item.reason.toLowerCase().includes(query))); }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && processedData.length > 0 && processedData[0].hasOwnProperty(key)) { processedData.sort((a, b) => { let aValue = a[key as keyof ExportMappingItem]; let bValue = b[key as keyof ExportMappingItem]; if (key === 'exportDate') { const timeA = !isNaN((aValue as Date)?.getTime()) ? (aValue as Date).getTime() : order === 'asc' ? Infinity : -Infinity; const timeB = !isNaN((bValue as Date)?.getTime()) ? (bValue as Date).getTime() : order === 'asc' ? Infinity : -Infinity; return order === 'asc' ? timeA - timeB : timeB - timeA; } if (key === 'id' && typeof aValue === 'number' && typeof bValue === 'number') { return order === 'asc' ? aValue - bValue : bValue - aValue; } aValue = aValue === null || aValue === undefined ? '' : String(aValue).toLowerCase(); bValue = bValue === null || bValue === undefined ? '' : String(bValue).toLowerCase(); return order === 'asc' ? (aValue as string).localeCompare(bValue as string) : (bValue as string).localeCompare(aValue as string); }); }
        const dataTotal = processedData.length; const allDataForExport = [...processedData]; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize; const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData: dataForPage, total: dataTotal, allFilteredAndSortedData: allDataForExport };
    }, [exportMappings, tableData, activeFilters, isDataReady]);

    const activeFilterCount = useMemo(() => {
        let count = 0; if (activeFilters.userRole?.length) count++; if (activeFilters.exportFrom?.length) count++; if (activeFilters.fileExtensions?.length) count++; if (activeFilters.exportDate) count++; return count;
    }, [activeFilters]);

    useEffect(() => { if (exportData.data.length > 0 && exportData.filename && csvLinkRef.current) { csvLinkRef.current.link.click(); setExportData({ data: [], filename: '' }); } }, [exportData]);

    const handleSetTableData = useCallback((data: Partial<TableQueries> | ((prevState: TableQueries) => TableQueries)) => { setTableData(prev => typeof data === 'function' ? data(prev) : { ...prev, ...data }); }, []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }), [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = (query: string) => { handleSetTableData(prev => ({ ...prev, query, pageIndex: 1 })) }
    const handleApplyFilters = useCallback((filters: Partial<ExportMappingFilterSchema>) => { setActiveFilters(filters); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
    const handleRemoveFilter = useCallback((key: keyof ExportMappingFilterSchema, value: string) => {
        setActiveFilters(prev => { const newFilters = { ...prev }; if (key === 'exportDate') { delete newFilters.exportDate; } else { const currentValues = prev[key] as string[] | undefined; if (currentValues) { const newValues = currentValues.filter(item => item !== value); if (newValues.length > 0) { (newFilters as any)[key] = newValues; } else { delete newFilters[key]; } } } return newFilters; });
        handleSetTableData({ pageIndex: 1 });
    }, [handleSetTableData]);
    const onClearFiltersAndReload = () => { setActiveFilters({}); handleSetTableData({ pageIndex: 1, query: '' }); dispatch(getExportMappingsAction()); };
    const handleClearAllFilters = useCallback(() => onClearFiltersAndReload(), [onClearFiltersAndReload]);
    const handleCardClick = (filterType: 'today' | 'topUser' | 'topModule' | 'total') => {
        setActiveFilters({});
        handleSetTableData({ query: '', pageIndex: 1 });
        switch (filterType) {
            case 'today': { const today = new Date(); setActiveFilters({ exportDate: [today, today] }); break; }
            case 'topUser': { const topUser = apiExportMappings?.counts?.top_user; if (topUser) { handleSetTableData({ query: topUser, pageIndex: 1 }); } break; }
            case 'topModule': { const topModule = apiExportMappings?.counts?.top_module; if (topModule) { setActiveFilters({ exportFrom: [topModule] }); } break; }
            default: break;
        }
    };

    const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">There is no data to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: '' }); setIsExportReasonModalOpen(true); };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const fileName = `export_mappings_log_${new Date().toISOString().split('T')[0]}.csv`;
        try {
            await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Export Mapping Log', file_name: fileName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            const dataToExport = allFilteredAndSortedData.map((item) => ({ id: item.id, userName: item.userName, userRole: item.userRole, exportFrom: item.exportFrom, fileName: item.fileName, reason: item.reason || '', exportDate: !isNaN(item.exportDate.getTime()) ? item.exportDate.toISOString() : 'Invalid Date', }));
            setExportData({ data: dataToExport, filename: fileName });
            setIsExportReasonModalOpen(false);
            dispatch(getExportMappingsAction());
        } catch (error: any) {
            toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>);
        } finally { setIsSubmittingExportReason(false); }
    };

    const handleDeleteAllClick = () => {
        setIsDeleteAllConfirmOpen(true);
    };

    const onConfirmDeleteAll = async () => {
        setIsDeletingAll(true);
        try {
            await dispatch(deleteAllExportMappingsAction({ id: 1 })).unwrap();
            toast.push(<Notification title="All Logs Deleted" type="success">All export mapping logs have been successfully deleted.</Notification>);
            dispatch(getExportMappingsAction()); // Re-fetch the now empty list
        } catch (error: any) {
            toast.push(<Notification title="Deletion Failed" type="danger">{error.message || "Could not delete all logs."}</Notification>);
        } finally {
            setIsDeletingAll(false);
            setIsDeleteAllConfirmOpen(false);
        }
    };

    const csvHeaders = useMemo(() => [{ label: 'Record ID', key: 'id' }, { label: 'User Name', key: 'userName' }, { label: 'User Role', key: 'userRole' }, { label: 'Exported From Module', key: 'exportFrom' }, { label: 'File Name', key: 'fileName' }, { label: 'Reason', key: 'reason' }, { label: 'Export Date (UTC)', key: 'exportDate' },], []);
    const [isImageViewerOpen, setImageViewerOpen] = useState(false);
    const [imageToView, setImageToView] = useState<string | null>(null);
    const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };
    const openImageViewer = (imageUrl: string | null) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };

    const columns: ColumnDef<ExportMappingItem>[] = useMemo(() => [
        { header: 'Exported By', accessorKey: 'userName', enableSorting: true, size: 200, cell: (props) => { const { userName, userRole, profile_pic_path } = props.row.original; return (<div className="flex items-center gap-2"><Avatar src={profile_pic_path || userIconPlaceholder} size="sm" shape="circle" className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(profile_pic_path || userIconPlaceholder)} icon={<TbUserCircle />} /><div><span className="font-semibold block truncate max-w-[150px]">{userName}</span><span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{userRole}</span></div></div>) }, },
        { header: 'Exported From', accessorKey: 'exportFrom', enableSorting: true, size: 220, cell: (props) => { const { exportFrom, fileName } = props.row.original; return (<div className="flex flex-col"><span className="font-semibold truncate max-w-[180px]">{exportFrom}</span><Tooltip title={fileName} placement="top"><span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px] block">{fileName || 'N/A'}</span></Tooltip></div>) }, },
        { header: 'Reason', accessorKey: 'reason', enableSorting: false, size: 250, cell: (props) => (<Tooltip title={props.row.original.reason || ''} placement="top"><span className="truncate block max-w-[230px] text-justify">{props.row.original.reason || '–'}</span></Tooltip>), },
        { header: 'Date', accessorKey: 'exportDate', enableSorting: true, size: 220, cell: (props) => { const date = new Date(props.row.original.exportDate); return (<span className="text-sm">{!isNaN(date.getTime()) && formatCustomDateTime(date)}</span>) }, },
        { header: 'Action', id: 'action', size: 80, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => <ActionColumn data={props.row.original} />, },
    ], []);

    const [filteredColumns, setFilteredColumns] = useState(columns);
    useEffect(() => { setFilteredColumns(columns) }, [columns]);

    const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
    const cardBodyClass = "flex gap-2 p-2";

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Export Mapping Log</h5>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4 gap-4">
                        <Tooltip title="Click to show all exports"><div onClick={() => handleCardClick('total')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbCloudUpload size={24} /></div><div><h6 className="text-blue-500">{apiExportMappings?.counts?.total}</h6><span className="font-semibold text-xs">Total Exports</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show today's exports"><div onClick={() => handleCardClick('today')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-300")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbCalendarUp size={24} /></div><div><h6 className="text-violet-500">{apiExportMappings?.counts?.today}</h6><span className="font-semibold text-xs">Exports Today</span></div></Card></div></Tooltip>
                        <Tooltip title={`Click to search for user: ${apiExportMappings?.counts?.top_user || ''}`}><div onClick={() => handleCardClick('topUser')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-pink-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbUserUp size={24} /></div><div><h6 className="text-pink-500 truncate">{apiExportMappings?.counts?.top_user || "N/A"}</h6><span className="font-semibold text-xs">Top User</span></div></Card></div></Tooltip>
                        <Tooltip title={`Click to filter by module: ${apiExportMappings?.counts?.top_module || ''}`}><div onClick={() => handleCardClick('topModule')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbBookUpload size={24} /></div><div><h6 className="text-green-500 truncate">{apiExportMappings?.counts?.top_module || "N/A"}</h6><span className="font-semibold text-xs">Top Module</span></div></Card></div></Tooltip>
                    </div>
                    <div className="mb-4">
                        <ExportMappingTableTools
                            columns={columns}
                            filteredColumns={filteredColumns}
                            setFilteredColumns={setFilteredColumns}
                            onSearchChange={handleSearchChange}
                            allExportMappings={exportMappings}
                            onApplyFilters={handleApplyFilters}
                            onClearFilters={onClearFiltersAndReload}
                            onExport={handleOpenExportReasonModal}
                            onDeleteAll={handleDeleteAllClick}
                            isDataReady={isDataReady}
                            activeFilterCount={activeFilterCount}
                            activeFilters={activeFilters}
                            searchInputValue={tableData.query}
                        />
                    </div>
                    <ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearAllFilters} />
                    {(activeFilterCount > 0 || tableData.query) && isDataReady && (
                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching record(s).</div>
                    )}
                    <div className="flex-grow overflow-auto">
                        <DataTable
                            columns={filteredColumns}
                            data={pageData}
                            noData={pageData.length <= 0}
                            loading={tableLoading || isDeletingAll}
                            pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                        />
                    </div>
                </AdaptiveCard>
                <CSVLink ref={csvLinkRef} data={exportData.data} headers={csvHeaders} filename={exportData.filename} className="hidden" uFEFF={true} />
            </Container>

            <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
                <div className="flex justify-center items-center p-4">
                    {imageToView ? (<img src={imageToView} alt="Profile" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />) : (<p>No image to display.</p>)}
                </div>
            </Dialog>
            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? 'Submitting...' : 'Submit & Export'} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
                    <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
                        <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
                    </FormItem>
                </Form>
            </ConfirmDialog>

            <ConfirmDialog
                isOpen={isDeleteAllConfirmOpen}
                type="danger"
                title="Delete All Export Logs"
                onClose={() => setIsDeleteAllConfirmOpen(false)}
                onRequestClose={() => setIsDeleteAllConfirmOpen(false)}
                onCancel={() => setIsDeleteAllConfirmOpen(false)}
                onConfirm={onConfirmDeleteAll}
                loading={isDeletingAll}
                confirmButtonColor="red-600"
            >
                <p className="mt-2">
                    Are you sure you want to delete <strong>ALL</strong> export mapping records?
                    This action is permanent and cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default ExportMapping;