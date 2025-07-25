import React, { useState, useMemo, useCallback, useEffect } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { Drawer, Form, FormItem, Input, Select, Tag, Card, Dropdown, Checkbox, Avatar, Dialog } from '@/components/ui'

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbReload,
    TbUser,
    TbMessageStar,
    TbMessageCheck,
    TbMessage2X,
    TbColumns,
    TbX,
    TbUserCircle
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// Redux
import { useAppDispatch } from '@/reduxtool/store'
import { useSelector } from 'react-redux'
import {
    getTrendingImagesAction,
    addTrendingImageAction,
    editTrendingImageAction,
    deleteTrendingImageAction,
    deleteMultipleTrendingImagesAction,
    getAllProductAction,
    submitExportReasonAction,
    getPageAction,
} from '@/reduxtool/master/middleware'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { Link } from 'react-router-dom'

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

export type ProductOption = { value: string; label: string; id?: string | number, name?: string };
export type TrendingPageImageItem =
    {
        id: string | number;
        page_name: string; status: 'Active' | 'Inactive';
        product_ids?: string;
        created_at: string;
        updated_at?: string; updated_by_name?: string; updated_by_role?: string; updated_by_user?: { name: string; roles: { display_name: string }[], profile_pic_path: string | null } | null;[key: string]: any;
    };

// --- Zod Schemas ---


const filterFormSchema = z.object({
    filterPageNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters.") });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Utility Functions ---
function exportTrendingImagesToCsv(filename: string, rows: TrendingPageImageItem[], productNameMap: Map<string, string>) {
    if (!rows || !rows.length) return false;
    const CSV_HEADERS = ['ID', 'Page Name', 'Status', 'Product IDs', 'Product Names', 'Created At', 'Updated By', 'Updated Role', 'Updated At',];
    const preparedRows = rows.map(row => {
        const productIds = row.product_ids?.split(',') || [];
        const productNames = productIds.map(id => productNameMap.get(id) || `ID:${id}`).join('; ');
        return {
            ...row,
            productNames,
            created_at_formatted: formatCustomDateTime(row.created_at),
            updated_at_formatted: formatCustomDateTime(row.updated_at),
        };
    });

    const csvContent = [
        CSV_HEADERS.join(','),
        ...preparedRows.map(row => [
            `"${String(row.id).replace(/"/g, '""')}"`,
            `"${String(row.page_name).replace(/"/g, '""')}"`,
            `"${String(row.status).replace(/"/g, '""')}"`,
            `"${String(row.product_ids || '').replace(/"/g, '""')}"`,
            `"${String(row.productNames).replace(/"/g, '""')}"`,
            `"${row.created_at_formatted}"`,
            `"${String(row.updated_by_name || 'N/A').replace(/"/g, '""')}"`,
            `"${String(row.updated_by_role || 'N/A').replace(/"/g, '""')}"`,
            `"${row.updated_at_formatted}"`,
        ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
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
    toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
    return false;
}
function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(' ') }


// --- Child Components ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center justify-center">
        <Tooltip title="Edit"><div className="text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400" role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
        <Tooltip title="Delete"><div className="text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
    </div>
);

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: Partial<FilterFormData>; onRemoveFilter: (key: keyof FilterFormData, value: string) => void; onClearAll: () => void; }) => {
    const filters = Object.entries(filterData).flatMap(([key, values]) => (Array.isArray(values) ? values.map(v => ({ key: key as keyof FilterFormData, ...v })) : []));
    if (filters.length === 0) return null;
    const keyToLabelMap = { filterStatus: 'Status', filterPageNames: 'Page' };
    return (<div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4"> <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span> {filters.map((filter) => (<Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"> {(keyToLabelMap as any)[filter.key]}: {filter.label} <TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter(filter.key, filter.value)} /> </Tag>))} <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button> </div>);
};

const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearAll, allColumns, visibleColumnKeys, setVisibleColumnKeys, activeFilterCount }: { onSearchChange: (q: string) => void; onFilter: () => void; onExport: () => void; onClearAll: () => void; allColumns: ColumnDef<TrendingPageImageItem>[]; visibleColumnKeys: string[]; setVisibleColumnKeys: (keys: string[]) => void; activeFilterCount: number; }) => {
    const toggleColumn = (checked: boolean, columnKey: string) => { if (checked) { setVisibleColumnKeys([...visibleColumnKeys, columnKey]); } else { setVisibleColumnKeys(visibleColumnKeys.filter((key) => key !== columnKey)); } };
    const isColumnVisible = (columnKey: string) => visibleColumnKeys.includes(columnKey);
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow"><DebouceInput className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div>
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                <Dropdown renderTitle={<Button title="Toggle Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2">
                        <div className="font-semibold mb-1 border-b pb-1">Toggle Columns</div>
                        {allColumns.filter(c => (c.accessorKey || c.id) && c.header).map(col => { const key = (col.accessorKey || col.id) as string; return (<div key={key} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={key} checked={isColumnVisible(key)} onChange={(c) => toggleColumn(c, key)} />{col.header}</div>) })}
                    </div>
                </Dropdown>
                <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearAll} />
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    )
}

const SelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: { selectedItems: TrendingPageImageItem[], onDeleteSelected: () => void; isDeleting: boolean; }) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Item{selectedItems.length > 1 ? 's' : ''} selected</span></span></span>
                    <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)} loading={isDeleting}>Delete Selected</Button>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} Image Group${selectedItems.length > 1 ? 's' : ''}`} onCancel={() => setDeleteOpen(false)} onClose={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }} loading={isDeleting}><p>Are you sure you want to delete the selected image group{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p></ConfirmDialog>
        </>
    );
};


// --- Main Component: Trending Images ---
const TrendingImages = () => {
    const dispatch = useAppDispatch();
    const { PageData: pageName = [], trendingImagesData = [], productsMasterData = [], status: masterLoadingStatus = 'idle' } = useSelector(masterSelector);

    const pageNameOptionsConst =  useMemo(() => Array.from(new Set((Array.isArray(pageName?.data) ? pageName?.data : []).map(p => p.name))).map(name => ({ value: name, label: name })), [pageName?.data]);;
    const pageNameValues = pageNameOptionsConst.map(opt => opt.value) as [string, ...string[]];
    const apiStatusOptions: { value: 'Active' | 'Inactive'; label: string }[] = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' },];
    const statusColor: Record<'Active' | 'Inactive', string> = { Active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-b border-emerald-300 dark:border-emerald-700", Inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-b border-red-300 dark:border-red-700" };

    const trendingPageImageFormSchema = z.object({
        page_name: z.enum(pageNameValues, { errorMap: () => ({ message: 'Please select a page name.' }) }),
        status: z.enum(['Active', 'Inactive'], { required_error: "Status is required." }),
        trendingProducts: z.array(z.string()).min(1, 'Please select at least one product.').optional().default([]),
    });
    type TrendingPageImageFormData = z.infer<typeof trendingPageImageFormSchema>;
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<TrendingPageImageItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<TrendingPageImageItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: 'desc', key: 'updated_at' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<TrendingPageImageItem[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Partial<FilterFormData>>({});
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
    const [imageToView, setImageToView] = useState<string | null>(null)

    useEffect(() => { dispatch(getTrendingImagesAction()); dispatch(getAllProductAction()); dispatch(getPageAction()); }, [dispatch]);

    const addFormMethods = useForm<TrendingPageImageFormData>({ resolver: zodResolver(trendingPageImageFormSchema), defaultValues: { page_name: pageNameValues[0], trendingProducts: [], status: 'Active' }, mode: 'onChange' });
    const editFormMethods = useForm<TrendingPageImageFormData>({ resolver: zodResolver(trendingPageImageFormSchema), mode: 'onChange' });
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: activeFilters });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" } });

    const productSelectOptions: ProductOption[] = useMemo(() => Array.isArray(productsMasterData) ? productsMasterData.map((p: ProductOption) => ({ value: String(p.id), label: `${p.name}`.trim() })) : [], [productsMasterData]);
    const productNameMap = useMemo(() => new Map(productSelectOptions.map(opt => [opt.value, opt.label])), [productSelectOptions]);
    const dynamicPageNameOptions = useMemo(() => Array.from(new Set((Array.isArray(pageName?.data) ? pageName?.data : []).map(p => p.name))).map(name => ({ value: name, label: name })), [pageName?.data]);
    const addPageNameOptions = useMemo(() => {
        const existingPageNames = new Set((Array.isArray(pageName?.data) ? pageName?.data : []).map(item => item.name));
        return pageNameOptionsConst.filter(option => !existingPageNames.has(option.value));
    }, [pageName?.data]);

    const { pageData, total, allFilteredAndSortedData, counts } = useMemo(() => {
        const sourceData: TrendingPageImageItem[] = Array.isArray(trendingImagesData) ? trendingImagesData : [];
        let processedData: TrendingPageImageItem[] = cloneDeep(sourceData);

        
        const initialCounts = { total: sourceData.length, active: sourceData.filter(i => i.status === 'Active').length, inactive: sourceData.filter(i => i.status === 'Inactive').length, };

        if (activeFilters.filterPageNames?.length) {
            const selected = new Set(activeFilters.filterPageNames.map(opt => opt.value));
            processedData = processedData.filter(item => selected.has(item.page_name));
        }
        if (activeFilters.filterStatus?.length) {
            const selected = new Set(activeFilters.filterStatus.map(opt => opt.value));
            processedData = processedData.filter(item => selected.has(item.status));
        }
        if (tableData.query) {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item => String(item.page_name).toLowerCase().includes(query) || String(item.id).toLowerCase().includes(query) || String(Object.keys(item.product_names)).toLowerCase().includes(query) || String(item.status).toLowerCase().includes(query));
        }

        const { order, key } = tableData.sort;
        if (order && key) {
            processedData.sort((a, b) => {
                let aValue: any = a[key as keyof TrendingPageImageItem] ?? '', bValue: any = b[key as keyof TrendingPageImageItem] ?? '';
                if (key === 'created_at' || key === 'updated_at') { aValue = aValue ? new Date(aValue).getTime() : 0; bValue = bValue ? new Date(bValue).getTime() : 0; }
                if (typeof aValue === 'number' && typeof bValue === 'number') return order === "asc" ? aValue - bValue : bValue - aValue;
                return order === "asc" ? String(aValue).localeCompare(String(bValue)) : String(bValue).localeCompare(String(aValue));
            });
        }

        return { pageData: processedData.slice((tableData.pageIndex - 1) * tableData.pageSize, tableData.pageIndex * tableData.pageSize), total: processedData.length, allFilteredAndSortedData: processedData, counts: initialCounts };
    }, [trendingImagesData, tableData, activeFilters]);

    const activeFilterCount = useMemo(() => Object.values(activeFilters).flat().length, [activeFilters]);
    const tableLoading = masterLoadingStatus === 'loading' || isSubmitting || isDeleting;

    // --- Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData(prev => ({ ...prev, ...data })); setSelectedItems([]); }, []);
    const onClearAllFilters = useCallback(() => { setActiveFilters({}); filterFormMethods.reset({}); handleSetTableData({ query: '', pageIndex: 1 }); }, [handleSetTableData, filterFormMethods]);
    const handleCardClick = useCallback((status?: 'Active' | 'Inactive') => { handleSetTableData({ pageIndex: 1, query: '' }); if (!status) { setActiveFilters({}); } else { const option = apiStatusOptions.find(o => o.value === status); setActiveFilters(option ? { filterStatus: [option] } : {}); } }, [handleSetTableData]);
    const handleRemoveFilter = useCallback((key: keyof FilterFormData, valueToRemove: string) => { setActiveFilters(prev => { const newFilters = { ...prev }; const currentValues = (prev[key] || []) as { value: string }[]; const newValues = currentValues.filter(item => item.value !== valueToRemove); if (newValues.length > 0) (newFilters as any)[key] = newValues; else delete (newFilters as any)[key]; return newFilters; }); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
    const openAddDrawer = () => { addFormMethods.reset({ page_name: pageNameValues[0], trendingProducts: [], status: 'Active' }); setIsAddDrawerOpen(true); }
    const closeAddDrawer = () => setIsAddDrawerOpen(false);
    const onAddItemSubmit = async (data: TrendingPageImageFormData) => { setIsSubmitting(true); try { const payload = { ...data, product_ids: data.trendingProducts?.join(','), img_1: "{}", img_2: "{}", img_3: "{}", summary_text: "{}", multimedia_content: "{}" }; delete (payload as any).trendingProducts; await dispatch(addTrendingImageAction(payload)).unwrap(); toast.push(<Notification title="Trending Images Added" type="success" />); closeAddDrawer(); dispatch(getTrendingImagesAction()); } catch (error: any) { toast.push(<Notification title="Failed to Add" type="danger">{error?.message || 'Error'}</Notification>); } finally { setIsSubmitting(false); } };
    const openEditDrawer = (item: TrendingPageImageItem) => { setEditingItem(item); const productIds = item.product_ids?.split(',').map(id => id.trim()).filter(Boolean) || []; editFormMethods.reset({ page_name: item.page_name, trendingProducts: productIds, status: item.status }); setIsEditDrawerOpen(true); };
    const closeEditDrawer = () => { setEditingItem(null); setIsEditDrawerOpen(false); };
    const onEditItemSubmit = async (data: TrendingPageImageFormData) => { if (!editingItem) return; setIsSubmitting(true); try { const payload = { ...editingItem, ...data, product_ids: data.trendingProducts?.join(','), status: data.status }; delete (payload as any).trendingProducts; await dispatch(editTrendingImageAction(payload)).unwrap(); toast.push(<Notification title="Trending Images Updated" type="success" />); closeEditDrawer(); dispatch(getTrendingImagesAction()); } catch (error: any) { toast.push(<Notification title="Failed to Update" type="danger">{error?.message || 'Error'}</Notification>); } finally { setIsSubmitting(false); } };
    const handleDeleteClick = (item: TrendingPageImageItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
    const onConfirmSingleDelete = async () => { if (!itemToDelete) return; setIsDeleting(true); try { await dispatch(deleteTrendingImageAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Item Deleted" type="success" />); setSelectedItems(p => p.filter(i => i.id !== itemToDelete.id)); dispatch(getTrendingImagesAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{e?.message || 'Error'}</Notification>); } finally { setIsDeleting(false); setSingleDeleteConfirmOpen(false); setItemToDelete(null); } };
    const handleDeleteSelected = async () => { if (selectedItems.length === 0) return; setIsDeleting(true); try { await dispatch(deleteMultipleTrendingImagesAction({ ids: selectedItems.map(i => i.id).join(',') })).unwrap(); toast.push(<Notification title="Items Deleted" type="success" />); setSelectedItems([]); dispatch(getTrendingImagesAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{e?.message || 'Error'}</Notification>); } finally { setIsDeleting(false); } };
    const handleOpenExportModal = () => { if (!allFilteredAndSortedData?.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: '' }); setIsExportReasonModalOpen(true); };
    const handleConfirmExport = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const fileName = `trending-images_${new Date().toISOString().split('T')[0]}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: "Trending Images", file_name: fileName })).unwrap(); toast.push(<Notification title="Reason Submitted" type="success" />); exportTrendingImagesToCsv(fileName, allFilteredAndSortedData, productNameMap); setIsExportReasonModalOpen(false); } catch (e: any) { toast.push(<Notification title="Export Failed" type="danger">{e?.message || 'Error'}</Notification>); } finally { setIsSubmittingExportReason(false); } };
    const openImageViewer = useCallback((src: string | null) => { if (src) { setImageToView(src); setIsImageViewerOpen(true); } }, []);

    const baseColumns: ColumnDef<TrendingPageImageItem>[] = useMemo(() => [
        { header: 'Page Name', accessorKey: 'page_name', enableSorting: true, size: 250, cell: (props) => <span className="font-semibold">{props.row.original.page_name}</span> },
        { header: 'Trending Products', id: 'trending_products', size: 350, cell: (props) => { const ids = props.row.original.product_ids?.split(',').map(id => id.trim()) || []; if (ids.length === 0) return <span className="text-gray-400">None</span>; const names = ids.map(id => productNameMap.get(id) || `ID:${id}`); const display = names.slice(0, 3).join(', '); const remaining = names.length - 3; return (<Tooltip title={names.join(', ')}><span>{display}{remaining > 0 && ` +${remaining} more`}</span></Tooltip>); } },
        { header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 200, cell: (props) => { const { updated_at, updated_by_user } = props.row.original; return (<div className="flex items-center gap-2"><Avatar src={updated_by_user?.profile_pic_path || undefined} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path || null)} /><div><span>{updated_by_user?.name || 'N/A'}</span><div className="text-xs"><b>{updated_by_user?.roles?.[0]?.display_name || ''}</b></div><div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div></div></div>); } },
        { header: "Status", accessorKey: "status", enableSorting: true, size: 100, cell: (props) => (<Tag className={`${statusColor[props.row.original.status]} capitalize font-semibold`}>{props.row.original.status}</Tag>) },
        { header: 'Actions', id: 'action', meta: { cellClass: 'text-center' }, size: 80, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
    ], [productNameMap, openImageViewer]);

    const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => baseColumns.map(c => (c.accessorKey || c.id) as string));
    const visibleColumns = useMemo(() => baseColumns.filter(c => visibleColumnKeys.includes((c.accessorKey || c.id) as string)), [baseColumns, visibleColumnKeys]);

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Trending Images</h5>
                        <div>
                            <Link to='/task/task-list/create'><Button className="mr-2" icon={<TbUser />}>Assign to Task</Button></Link>
                            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>Add New</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <Tooltip title="Click to show all items"><div className="cursor-pointer" onClick={() => handleCardClick()}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbMessageStar size={24} /></div><div><h6 className="text-blue-500">{counts.total}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show Active items"><div className="cursor-pointer" onClick={() => handleCardClick('Active')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbMessageCheck size={24} /></div><div><h6 className="text-green-500">{counts.active}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show Inactive items"><div className="cursor-pointer" onClick={() => handleCardClick('Inactive')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbMessage2X size={24} /></div><div><h6 className="text-red-500">{counts.inactive}</h6><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
                    </div>
                    <ItemTableTools onSearchChange={(q) => handleSetTableData({ query: q, pageIndex: 1 })} onFilter={() => setIsFilterDrawerOpen(true)} onExport={handleOpenExportModal} onClearAll={onClearAllFilters} allColumns={baseColumns} visibleColumnKeys={visibleColumnKeys} setVisibleColumnKeys={setVisibleColumnKeys} activeFilterCount={activeFilterCount} />
                    <div className="mt-4"><ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={onClearAllFilters} /></div>
                    {(activeFilterCount > 0 || tableData.query) && <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching item.</div>}
                    <div className="mt-4 flex-grow overflow-y-auto">
                        <DataTable selectable columns={visibleColumns} data={pageData} noData={!tableLoading && pageData.length === 0} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} checkboxChecked={(row) => selectedItems.some(s => s.id === row.id)} onPaginationChange={(p) => handleSetTableData({ pageIndex: p })} onSelectChange={(s) => handleSetTableData({ pageSize: s, pageIndex: 1 })} onSort={(s) => handleSetTableData({ sort: s })} onCheckBoxChange={(c, r) => setSelectedItems(p => c ? [...p, r] : p.filter(i => i.id !== r.id))} onIndeterminateCheckBoxChange={(c, rs) => { const rIds = new Set(rs.map(r => r.original.id)); setSelectedItems(p => c ? [...p, ...rs.map(r => r.original).filter(r => !p.some(i => i.id === r.id))] : p.filter(i => !rIds.has(i.id))) }} />
                    </div>
                </AdaptiveCard>
            </Container>

            <SelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />

            {/* Add Drawer */}
            <Drawer title="Add Trending Image Group" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} width={480} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="addPageImageForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Adding...' : 'Save'}</Button></div>}>
                <Form id="addPageImageForm" onSubmit={addFormMethods.handleSubmit(onAddItemSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Page Name" invalid={!!addFormMethods.formState.errors.page_name} errorMessage={addFormMethods.formState.errors.page_name?.message}>
                        <Controller
                            name="page_name"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                // Use the new filtered options list here
                                <Select
                                    placeholder="Select page"
                                    options={addPageNameOptions}
                                    value={addPageNameOptions.find(o => o.value === field.value)}
                                    onChange={opt => field.onChange(opt?.value)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Status" invalid={!!addFormMethods.formState.errors.status} errorMessage={addFormMethods.formState.errors.status?.message}><Controller name="status" control={addFormMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={apiStatusOptions} value={apiStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} /></FormItem>
                    <FormItem label={<div>Trending Products<span className="text-red-500"> *</span></div>} invalid={!!addFormMethods.formState.errors.trendingProducts} errorMessage={addFormMethods.formState.errors.trendingProducts?.message as string}><Controller name="trendingProducts" control={addFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select products..." options={productSelectOptions} value={productSelectOptions.filter(o => field.value?.includes(o.value))} onChange={(v) => field.onChange(v?.map(o => o.value))} />)} /></FormItem>
                </Form>
            </Drawer>

            {/* Edit Drawer */}
            <Drawer title="Edit Trending Image Group" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} width={480} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="editPageImageForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button></div>}>
                <Form id="editPageImageForm" onSubmit={editFormMethods.handleSubmit(onEditItemSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Page Name" invalid={!!editFormMethods.formState.errors.page_name} errorMessage={editFormMethods.formState.errors.page_name?.message}>
                        <Controller
                            name="page_name"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                // The Edit drawer still uses the full, original list
                                <Select
                                    placeholder="Select page"
                                    options={addPageNameOptions}
                                    value={pageNameOptionsConst.find(o => o.value === field.value)}
                                    onChange={opt => field.onChange(opt?.value)}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Status" invalid={!!editFormMethods.formState.errors.status} errorMessage={editFormMethods.formState.errors.status?.message}><Controller name="status" control={editFormMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={apiStatusOptions} value={apiStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} /></FormItem>
                    <FormItem label="Trending Products" invalid={!!editFormMethods.formState.errors.trendingProducts} errorMessage={editFormMethods.formState.errors.trendingProducts?.message as string}><Controller name="trendingProducts" control={editFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select products..." options={productSelectOptions} value={productSelectOptions.filter(o => field.value?.includes(o.value))} onChange={(v) => field.onChange(v?.map(o => o.value))} />)} /></FormItem>
                    {editingItem && (
                        <div className=" grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                            <div>
                                <b className="font-semibold text-primary">Latest Update:</b><br />
                                <p className="font-semibold">{editingItem.updated_by_user?.name || "N/A"}</p>
                                <p>{editingItem.updated_by_user?.roles?.[0]?.display_name || "N/A"}</p>
                            </div>
                            <div className="text-right">
                                <br />
                                <span className="font-semibold">Created At:</span> <span>{formatCustomDateTime(editingItem.created_at)}</span><br />
                                <span className="font-semibold">Updated At:</span> <span>{formatCustomDateTime(editingItem.updated_at)}</span>
                            </div>
                        </div>
                    )}
                </Form>
            </Drawer>

            <Dialog isOpen={isImageViewerOpen} onClose={() => setIsImageViewerOpen(false)} onRequestClose={() => setIsImageViewerOpen(false)} width={600}><div className="flex justify-center items-center p-4">{imageToView ? <img src={imageToView} alt="Full View" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} /> : <p>No image.</p>}</div></Dialog>

            {/* Filter Drawer */}
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} width={400} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearAllFilters}>Clear</Button><Button size="sm" variant="solid" form="filterForm" type="submit">Apply</Button></div>}>
                <Form id="filterForm" onSubmit={filterFormMethods.handleSubmit((data) => { setActiveFilters(data); handleSetTableData({ pageIndex: 1 }); setIsFilterDrawerOpen(false); })} className="flex flex-col gap-4">
                    <FormItem label="Page Name"><Controller name="filterPageNames" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select pages..." options={dynamicPageNameOptions} value={field.value || []} onChange={(v) => field.onChange(v || [])} />)} /></FormItem>
                    <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select status..." options={apiStatusOptions} value={field.value || []} onChange={(v) => field.onChange(v || [])} />)} /></FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Group" onCancel={() => setSingleDeleteConfirmOpen(false)} onClose={() => setSingleDeleteConfirmOpen(false)} onConfirm={onConfirmSingleDelete} loading={isDeleting}><p>Are you sure you want to delete this group?</p></ConfirmDialog>
            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onCancel={() => setIsExportReasonModalOpen(false)} onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExport)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? 'Submitting...' : 'Submit & Export'} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={(e) => e.preventDefault()} className="mt-2"><FormItem label="Reason:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form>
            </ConfirmDialog>
        </>
    );
};

export default TrendingImages;