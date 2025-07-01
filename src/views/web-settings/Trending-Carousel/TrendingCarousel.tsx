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
import Avatar from '@/components/ui/Avatar'
import {
    Dialog,
    Drawer,
    Form,
    FormItem,
    Input,
    Select,
    Tag,
    Card,
    Dropdown,
    Checkbox,
} from '@/components/ui'

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbPhoto,
    TbReload,
    TbUser,
    TbFileText,
    TbMessageStar,
    TbMessageCheck,
    TbMessage2X,
    TbColumns,
    TbX,
    TbUserCircle
} from 'react-icons/tb'

// Redux
import { useAppDispatch } from '@/reduxtool/store'
import {
    getTrendingCarouselAction,
    addTrendingCarouselAction,
    editTrendingCarouselAction,
    deleteTrendingCarouselAction,
    deleteMultipleTrendingCarouselAction,
    submitExportReasonAction,
} from '@/reduxtool/master/middleware'

import { masterSelector } from '@/reduxtool/master/masterSlice'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

// --- Type Definitions ---
export type TrendingCarouselItemData = {
    id: number
    images: string
    links: string | null
    created_at: string
    updated_at?: string
    status: 'Active' | 'Inactive'
    images_full_path: string
    updated_by_name?: string
    updated_by_role?: string
    updated_by_user?: {
        name: string
        roles: { display_name: string }[]
    }
    [key: string]: any
}
type SelectOption = {
    value: string | number
    label: string
}
const statusOptions: SelectOption[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
]

// --- Zod Schemas ---
const trendingCarouselFormSchema = z.object({
    imageFile: z.instanceof(File, { message: 'Image is required.' }).optional().nullable()
        .refine((file) => !file || file.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
        .refine((file) => !file || ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type), 'Only .jpg, .jpeg, .png, .webp, .gif files are accepted.'),
    links: z.string().url({ message: 'Please enter a valid URL (e.g., https://example.com).' }).optional().nullable().or(z.literal('')),
    status: z.enum(['Active', 'Inactive'], { required_error: 'Status is required.' }),
})
type TrendingCarouselFormData = z.infer<typeof trendingCarouselFormSchema>

const filterFormSchema = z.object({
  filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
    reason: z.string().min(10, 'Reason for export is required.').max(255, 'Reason cannot exceed 255 characters.'),
})
type ExportReasonFormData = z.infer<typeof exportReasonSchema>

// --- Utility Functions ---
function exportCarouselItemsToCsv(filename: string, rows: TrendingCarouselItemData[]) {
    if (!rows || !rows.length) return false
    const CSV_HEADERS = [ 'ID', 'Image Path (Server)', 'Link', 'Image Full URL', 'Status', 'Created At', 'Updated By', 'Updated Role', 'Updated At', ]
    type TrendingCarouselExportItem = Omit<TrendingCarouselItemData, 'created_at' | 'updated_at'> & { created_at_formatted?: string; updated_at_formatted?: string }
    const CSV_KEYS: (keyof TrendingCarouselExportItem)[] = [ 'id', 'images', 'links', 'images_full_path', 'status', 'created_at_formatted', 'updated_by_name', 'updated_by_role', 'updated_at_formatted', ]
    
    const preparedRows: TrendingCarouselExportItem[] = rows.map((row) => ({
        ...row,
        links: row.links || 'N/A',
        created_at_formatted: new Date(row.created_at).toLocaleString(),
        updated_by_name: row.updated_by_name || 'N/A',
        updated_by_role: row.updated_by_role || 'N/A',
        updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A',
    }))

    const csvContent = [
        CSV_HEADERS.join(','),
        ...preparedRows.map(row => CSV_KEYS.map(k => {
            let cell = (row as any)[k]
            if (cell === null || cell === undefined) cell = ''
            else cell = String(cell).replace(/"/g, '""')
            if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`
            return cell
        }).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        return true
    }
    toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>)
    return false
}
function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(' ') }

// --- Child Components ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => (
    <div className="flex items-center justify-center">
        <Tooltip title="Edit"><div className="text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400" role="button" tabIndex={0} onClick={onEdit}><TbPencil /></div></Tooltip>
        <Tooltip title="Delete"><div className="text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" role="button" tabIndex={0} onClick={onDelete}><TbTrash /></div></Tooltip>
    </div>
)

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: Partial<FilterFormData>; onRemoveFilter: (key: keyof FilterFormData, value: string) => void; onClearAll: () => void; }) => {
    const filters = Object.entries(filterData).flatMap(([key, values]) => (Array.isArray(values) ? values.map(v => ({ key: key as keyof FilterFormData, ...v })) : []));
    if (filters.length === 0) return null;
    return ( <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4"> <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span> {filters.map((filter) => (<Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"> Status: {filter.label} <TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter(filter.key, filter.value)} /> </Tag>))} <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button> </div> );
};

const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearAll, columns, filteredColumns, setFilteredColumns, activeFilterCount }: { onSearchChange: (q: string) => void; onFilter: () => void; onExport: () => void; onClearAll: () => void; columns: ColumnDef<TrendingCarouselItemData>[]; filteredColumns: ColumnDef<TrendingCarouselItemData>[]; setFilteredColumns: (cols: ColumnDef<TrendingCarouselItemData>[]) => void; activeFilterCount: number; }) => {
    const toggleColumn = (checked: boolean, colHeader: string) => setFilteredColumns(checked ? [...filteredColumns, columns.find(c => c.header === colHeader)!].sort((a,b) => columns.indexOf(a) - columns.indexOf(b)) : filteredColumns.filter(c => c.header !== colHeader));
    const isColumnVisible = (header: string) => filteredColumns.some(c => c.header === header);
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow">
                <DebouceInput className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} />
            </div>
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                <Dropdown renderTitle={<Button title="Toggle Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2">
                        <div className="font-semibold mb-1 border-b pb-1">Toggle Columns</div>
                        {columns.filter(c => c.id !== 'select' && c.header).map(col => (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(c) => toggleColumn(c, col.header as string)} />{col.header}</div>))}
                    </div>
                </Dropdown>
                <Button title="Clear Filters & Reload" icon={<TbReload />} onClick={onClearAll} />
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    )
}

const SelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: { selectedItems: TrendingCarouselItemData[], onDeleteSelected: () => void; isDeleting?: boolean }) => {
    const [deleteOpen, setDeleteOpen] = useState(false)
    if (selectedItems.length === 0) return null
    return (
        <>
            <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Item{selectedItems.length > 1 ? 's' : ''} selected</span></span>
                    </span>
                    <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)} loading={isDeleting}>Delete Selected</Button>
                </div>
            </StickyFooter>
            <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} Carousel Item${selectedItems.length > 1 ? 's' : ''}`} onClose={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }} loading={isDeleting}>
                <p>Are you sure you want to delete the selected carousel items? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    )
}

// --- Main Component: Trending Carousel ---
const TrendingCarousel = () => {
    const dispatch = useAppDispatch()
    const { trendingCarouselData = [], status: masterLoadingStatus = 'idle' } = useSelector(masterSelector)

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<TrendingCarouselItemData | null>(null)
    const [itemToDelete, setItemToDelete] = useState<TrendingCarouselItemData | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false)
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: 'desc', key: 'created_at' }, query: '' })
    const [selectedItems, setSelectedItems] = useState<TrendingCarouselItemData[]>([])
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
    const [imageToView, setImageToView] = useState<string | null>(null)
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false)
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false)
    const [activeFilters, setActiveFilters] = useState<Partial<FilterFormData>>({});

    const addFormMethods = useForm<TrendingCarouselFormData>({ resolver: zodResolver(trendingCarouselFormSchema), defaultValues: { links: '', imageFile: null, status: 'Active' }, mode: 'onChange' })
    const editFormMethods = useForm<TrendingCarouselFormData>({ resolver: zodResolver(trendingCarouselFormSchema), defaultValues: { links: '', imageFile: null, status: 'Active' }, mode: 'onChange' })
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: activeFilters })
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: '' }, mode: 'onChange' })

    useEffect(() => { dispatch(getTrendingCarouselAction()) }, [dispatch])
    useEffect(() => { return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl) } }, [imagePreviewUrl])

    const { pageData, total, allFilteredAndSortedData, counts } = useMemo(() => {
        const sourceData: TrendingCarouselItemData[] = Array.isArray(trendingCarouselData) ? trendingCarouselData : []
        let processedData: TrendingCarouselItemData[] = cloneDeep(sourceData)
        
        const initialCounts = {
            total: sourceData.length,
            active: sourceData.filter(i => i.status === 'Active').length,
            inactive: sourceData.filter(i => i.status === 'Inactive').length,
        };

        if (activeFilters.filterStatuses?.length) {
            const selected = new Set(activeFilters.filterStatuses.map(s => s.value));
            processedData = processedData.filter(item => selected.has(item.status));
        }

        if (tableData.query) {
            const query = tableData.query.toLowerCase().trim()
            processedData = processedData.filter(item => String(item.links || '').toLowerCase().includes(query) || String(item.id).toLowerCase().includes(query))
        }

        const { order, key } = tableData.sort
        if (order && key) {
            processedData.sort((a, b) => {
                let aValue: any = (a as any)[key], bValue: any = (b as any)[key]
                if (key === 'created_at' || key === 'updated_at') {
                    aValue = a[key] ? new Date(a[key]).getTime() : 0
                    bValue = b[key] ? new Date(b[key]).getTime() : 0
                }
                if (aValue < bValue) return order === 'asc' ? -1 : 1
                if (aValue > bValue) return order === 'asc' ? 1 : -1
                return 0
            })
        }

        return {
            pageData: processedData.slice((tableData.pageIndex - 1) * tableData.pageSize, tableData.pageIndex * tableData.pageSize),
            total: processedData.length,
            allFilteredAndSortedData: processedData,
            counts: initialCounts,
        }
    }, [trendingCarouselData, tableData, activeFilters])

    const activeFilterCount = useMemo(() => Object.values(activeFilters).filter(v => Array.isArray(v) ? v.length > 0 : !!v).length, [activeFilters]);
    const tableLoading = masterLoadingStatus === 'loading' || isSubmitting || isDeleting;

    // --- Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); setSelectedItems([]); }, [])
    const onClearAllFilters = () => { setActiveFilters({}); handleSetTableData({ query: '', pageIndex: 1 }); dispatch(getTrendingCarouselAction()); }
    const handleCardClick = (filterType: 'status' | 'all', value?: string) => { handleSetTableData({ pageIndex: 1, query: '' }); if (filterType === 'all') setActiveFilters({}); else if (filterType === 'status') { const option = statusOptions.find(o => o.value === value); setActiveFilters(option ? { filterStatuses: [option] } : {}); } }
    const handleRemoveFilter = useCallback((key: keyof FilterFormData, valueToRemove: string) => { setActiveFilters(prev => { const newFilters = { ...prev }; const currentValues = (prev[key] || []) as {value: string}[]; const newValues = currentValues.filter(item => item.value !== valueToRemove); if (newValues.length > 0) (newFilters as any)[key] = newValues; else delete (newFilters as any)[key]; return newFilters; }); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
    const openAddDrawer = () => { addFormMethods.reset({ links: '', imageFile: null, status: 'Active' }); setImagePreviewUrl(null); setIsAddDrawerOpen(true) }
    const closeAddDrawer = () => { setIsAddDrawerOpen(false); if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(null); }
    const onAddItemSubmit = async (data: TrendingCarouselFormData) => { if (!data.imageFile) { addFormMethods.setError('imageFile', { type: 'manual', message: 'Image is required.' }); return; } setIsSubmitting(true); const formData = new FormData(); formData.append('links', data.links || ''); formData.append('status', data.status); formData.append('images', data.imageFile); try { await dispatch(addTrendingCarouselAction(formData)).unwrap(); toast.push(<Notification title="Item Added" type="success" />); closeAddDrawer(); dispatch(getTrendingCarouselAction()); } catch (error: any) { toast.push(<Notification title="Failed to Add" type="danger">{error?.message || 'Could not add item.'}</Notification>); } finally { setIsSubmitting(false); } }
    const openEditDrawer = (item: TrendingCarouselItemData) => { setEditingItem(item); editFormMethods.reset({ links: item.links || '', imageFile: null, status: item.status }); setImagePreviewUrl(null); setIsEditDrawerOpen(true); }
    const closeEditDrawer = () => { setIsEditDrawerOpen(false); setEditingItem(null); if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(null); }
    const onEditItemSubmit = async (data: TrendingCarouselFormData) => { if (!editingItem) return; setIsSubmitting(true); const formData = new FormData(); formData.append('_method', 'PUT'); formData.append('links', data.links || ''); formData.append('status', data.status); if (data.imageFile) formData.append('images', data.imageFile); try { await dispatch(editTrendingCarouselAction({ id: editingItem.id, formData })).unwrap(); toast.push(<Notification title="Item Updated" type="success" />); closeEditDrawer(); dispatch(getTrendingCarouselAction()); } catch (error: any) { toast.push(<Notification title="Failed to Update" type="danger">{error?.message || 'Could not update item.'}</Notification>); } finally { setIsSubmitting(false); } }
    const handleDeleteClick = (item: TrendingCarouselItemData) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }
    const onConfirmSingleDelete = async () => { if (!itemToDelete) return; setIsDeleting(true); try { await dispatch(deleteTrendingCarouselAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Item Deleted" type="success" />); setSelectedItems(p => p.filter(i => i.id !== itemToDelete.id)); dispatch(getTrendingCarouselAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{e?.message || 'Could not delete item.'}</Notification>); } finally { setIsDeleting(false); setSingleDeleteConfirmOpen(false); setItemToDelete(null); } }
    const handleDeleteSelected = async () => { if (selectedItems.length === 0) return; setIsDeleting(true); try { await dispatch(deleteMultipleTrendingCarouselAction({ ids: selectedItems.map(i => i.id).join(',') })).unwrap(); toast.push(<Notification title="Items Deleted" type="success" />); setSelectedItems([]); dispatch(getTrendingCarouselAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{e?.message || 'Failed to delete.'}</Notification>); } finally { setIsDeleting(false); } }
    const handleOpenExportModal = () => { if (!allFilteredAndSortedData?.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: '' }); setIsExportReasonModalOpen(true); }
    const handleConfirmExport = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const fileName = `trending_carousel_${new Date().toISOString().split('T')[0]}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Trending Carousel', file_name: fileName })).unwrap(); toast.push(<Notification title="Reason Submitted" type="success" />); exportCarouselItemsToCsv(fileName, allFilteredAndSortedData); setIsExportReasonModalOpen(false); } catch (e: any) { toast.push(<Notification title="Export Failed" type="danger">{e?.message || 'Could not complete export.'}</Notification>); } finally { setIsSubmittingExportReason(false); } }
    const openImageViewer = (src: string | null) => { if (src) { setImageToView(src); setIsImageViewerOpen(true); } }
    
    const baseColumns: ColumnDef<TrendingCarouselItemData>[] = useMemo(() => [
        { header: 'Image', accessorKey: 'images_full_path', enableSorting: false, size: 60, cell: (props) => (<Avatar size={40} shape="circle" src={props.row.original.images_full_path || undefined} icon={!props.row.original.images_full_path ? <TbFileText /> : undefined} onClick={() => openImageViewer(props.row.original.images_full_path)} className={props.row.original.images_full_path ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500' : ''} />)},
        { header: 'Link', accessorKey: 'links', enableSorting: true, size: 280, cell: (props) => props.row.original.links ? (<a href={props.row.original.links} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-[230px]" title={props.row.original.links}>{props.row.original.links}</a>) : (<span className="text-gray-500">No Link</span>)},
        { header: 'Status', accessorKey: 'status', enableSorting: true, size: 100, cell: (props) => (<Tag className={classNames('capitalize font-semibold', props.row.original.status === 'Active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100')}>{props.row.original.status}</Tag>)},
        { header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 200, cell: (props) => { const { updated_at, updated_by_user } = props.row.original; const formattedDate = updated_at ? new Date(updated_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'; return (<div className="flex items-center gap-2"><Avatar src={updated_by_user?.profile_pic_path || undefined} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path || null)} /><div><span>{updated_by_user?.name || 'N/A'}</span><div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div><div className="text-xs text-gray-500">{formattedDate}</div></div></div>); } },
        { header: 'Actions', id: 'action', meta: { cellClass: 'text-center' }, size: 80, cell: (props) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />)},
    ], []);
    const [filteredColumns, setFilteredColumns] = useState(baseColumns);
    useEffect(() => { setFilteredColumns(baseColumns); }, []);

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Trending Carousel</h5>
                        <div>
                            <Link to="/task/task-list/create"><Button className="mr-2" icon={<TbUser />} clickFeedback={false}>Assign to Task</Button></Link>
                            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>Add New</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <Tooltip title="Click to show all items"><div className="cursor-pointer" onClick={() => handleCardClick('all')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbMessageStar size={24} /></div><div><h6 className="text-blue-500">{counts.total}</h6><span className="font-semibold text-xs">Total Items</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show Active items"><div className="cursor-pointer" onClick={() => handleCardClick('status', 'Active')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbMessageCheck size={24} /></div><div><h6 className="text-green-500">{counts.active}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show Inactive items"><div className="cursor-pointer" onClick={() => handleCardClick('status', 'Inactive')}><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200 hover:shadow-lg"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbMessage2X size={24} /></div><div><h6 className="text-red-500">{counts.inactive}</h6><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
                    </div>
                    <ItemTableTools onSearchChange={(q) => handleSetTableData({ query: q, pageIndex: 1 })} onFilter={() => setIsFilterDrawerOpen(true)} onExport={handleOpenExportModal} onClearAll={onClearAllFilters} columns={baseColumns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
                    <div className="mt-4"><ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={onClearAllFilters} /></div>
                    <div className="mt-4 flex-grow overflow-y-auto">
                        <DataTable selectable columns={filteredColumns} data={pageData} noData={!tableLoading && pageData.length === 0} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} checkboxChecked={(row) => selectedItems.some(s => s.id === row.id)} onPaginationChange={(p) => handleSetTableData({ pageIndex: p })} onSelectChange={(s) => handleSetTableData({ pageSize: s, pageIndex: 1 })} onSort={(s) => handleSetTableData({ sort: s })} onCheckBoxChange={(c, r) => setSelectedItems(p => c ? [...p, r] : p.filter(i => i.id !== r.id))} onIndeterminateCheckBoxChange={(c, rs) => { const rIds = new Set(rs.map(r => r.original.id)); setSelectedItems(p => c ? [...p, ...rs.map(r => r.original).filter(r => !p.some(i => i.id === r.id))] : p.filter(i => !rIds.has(i.id))); }}/>
                    </div>
                </AdaptiveCard>
            </Container>

            <SelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />

            {/* Add Drawer */}
            <Drawer title="Add Trending Carousel" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} width={520} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="addCarouselItemForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Adding...' : 'Save'}</Button></div>}>
                <Form id="addCarouselItemForm" onSubmit={addFormMethods.handleSubmit(onAddItemSubmit)} className="flex flex-col gap-y-6">
                    <FormItem label={<div>Image<span className="text-red-500"> *</span></div>} invalid={!!addFormMethods.formState.errors.imageFile} errorMessage={addFormMethods.formState.errors.imageFile?.message}><Controller name="imageFile" control={addFormMethods.control} render={({ field: { onChange } }) => (<Input type="file" onChange={(e) => { const file = e.target.files?.[0] || null; onChange(file); if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(file ? URL.createObjectURL(file) : null); }} accept="image/*" />)} /></FormItem>
                    {imagePreviewUrl && <Avatar src={imagePreviewUrl} className="w-full h-auto border p-1 rounded-md" shape="square" />}
                    <FormItem label="Link" invalid={!!addFormMethods.formState.errors.links} errorMessage={addFormMethods.formState.errors.links?.message}><Controller name="links" control={addFormMethods.control} render={({ field }) => (<Input {...field} value={field.value ?? ''} type="url" placeholder="https://example.com" />)} /></FormItem>
                    <FormItem label={<div>Status<span className="text-red-500"> *</span></div>} invalid={!!addFormMethods.formState.errors.status} errorMessage={addFormMethods.formState.errors.status?.message}><Controller name="status" control={addFormMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(o => o.value === field.value)} onChange={o => field.onChange(o?.value)} />)} /></FormItem>
                </Form>
            </Drawer>

            {/* Edit Drawer */}
            <Drawer title="Edit Trending Carousel" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} width={520} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="editCarouselItemForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button></div>}>
                <Form id="editCarouselItemForm" onSubmit={editFormMethods.handleSubmit(onEditItemSubmit)} className="flex flex-col gap-y-6">
                    <FormItem label="Current Image">{editingItem?.images_full_path ? <Avatar src={editingItem.images_full_path} className="w-full h-auto border p-1 rounded-md" shape="square" /> : <p>No image.</p>}</FormItem>
                    <FormItem label="New Image (Optional)" invalid={!!editFormMethods.formState.errors.imageFile} errorMessage={editFormMethods.formState.errors.imageFile?.message}><Controller name="imageFile" control={editFormMethods.control} render={({ field: { onChange } }) => (<Input type="file" onChange={(e) => { const file = e.target.files?.[0] || null; onChange(file); if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(file ? URL.createObjectURL(file) : null); }} accept="image/*" />)} /></FormItem>
                    {imagePreviewUrl && <Avatar src={imagePreviewUrl} className="w-full h-auto border p-1 rounded-md" shape="square" />}
                    <FormItem label="Link" invalid={!!editFormMethods.formState.errors.links} errorMessage={editFormMethods.formState.errors.links?.message}><Controller name="links" control={editFormMethods.control} render={({ field }) => (<Input {...field} value={field.value ?? ''} type="url" placeholder="https://example.com" />)} /></FormItem>
                    <FormItem label={<div>Status<span className="text-red-500"> *</span></div>} invalid={!!editFormMethods.formState.errors.status} errorMessage={editFormMethods.formState.errors.status?.message}><Controller name="status" control={editFormMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={statusOptions} value={statusOptions.find(o => o.value === field.value)} onChange={o => field.onChange(o?.value)} />)} /></FormItem>
                </Form>
            </Drawer>
            
            {/* Filter Drawer */}
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} width={400} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearAllFilters}>Clear</Button><Button size="sm" variant="solid" form="filterForm" type="submit">Apply</Button></div>}>
              <Form id="filterForm" onSubmit={filterFormMethods.handleSubmit((data) => { setActiveFilters(data); handleSetTableData({ pageIndex: 1 }); setIsFilterDrawerOpen(false); })} className="flex flex-col gap-4">
                  <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select status..." options={statusOptions} value={field.value || []} onChange={(v) => field.onChange(v || [])} />)} /></FormItem>
              </Form>
            </Drawer>

            <Dialog isOpen={isImageViewerOpen} onClose={() => setIsImageViewerOpen(false)} width={600}><div className="flex justify-center items-center p-4">{imageToView ? <img src={imageToView} alt="Full View" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} /> : <p>No image.</p>}</div></Dialog>
            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Carousel Item" onClose={() => setSingleDeleteConfirmOpen(false)} onConfirm={onConfirmSingleDelete} loading={isDeleting}><p>Are you sure you want to delete this item?</p></ConfirmDialog>
            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExport)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? 'Submitting...' : 'Submit & Export'} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={(e) => e.preventDefault()} className="mt-2"><FormItem label="Reason:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form>
            </ConfirmDialog>
        </>
    )
}

export default TrendingCarousel