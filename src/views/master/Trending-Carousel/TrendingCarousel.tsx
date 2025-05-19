import React, { useState, useMemo, useCallback, Ref } from 'react'
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
import Select from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import { Drawer, Form, FormItem, Input } from '@/components/ui'
import { Segment } from '@/components/ui'

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
    TbSlideshow,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Constants ---
const statusOptionsConst = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
]
const statusColorsConst: Record<'active' | 'inactive', string> = {
    active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
}

// --- Carousel Items ---
export type TrendingCarouselItem = {
    id: string | number
    imageUrl: string
    link?: string
    date: string // YYYY-MM-DD
    status: 'active' | 'inactive'
}

const trendingCarouselFormSchema = z.object({
    imageUrl: z.string().url('Valid image URL is required.'),
    link: z.string().url('Valid link URL is optional.').optional().or(z.literal('')),
    date: z.string().min(1, 'Date is required.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    status: z.enum(['active', 'inactive']),
})
type TrendingCarouselFormData = z.infer<typeof trendingCarouselFormSchema>

const initialDummyCarouselItems: TrendingCarouselItem[] = [
    { id: 'TCI001', imageUrl: 'https://via.placeholder.com/800x400/ADD8E6/000000?text=Carousel+Image+1', link: '/products/123', date: '2024-07-28', status: 'active' },
    { id: 'TCI002', imageUrl: 'https://via.placeholder.com/800x400/FFA07A/000000?text=Carousel+Image+2', date: '2024-07-27', status: 'inactive' },
]

// --- CSV Exporter Utility ---
function exportToCsv(filename: string, rows: any[], headers: string[], keys: string[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return false;
    }
    const separator = ',';
    const csvContent =
        headers.join(separator) + '\n' +
        rows.map(row => keys.map(k => {
            let cell: any = row[k];
            if (cell === null || cell === undefined) cell = '';
            else cell = String(cell).replace(/"/g, '""');
            if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
        }).join(separator)).join('\n');

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

// --- ActionColumn Component ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'
    return (
        <div className="flex items-center justify-center gap-3">
            <Tooltip title="Edit">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400',
                    )}
                    role="button"
                    onClick={onDelete}
                >
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    )
};

// --- Search and TableTools ---
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; placeholder: string }
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
    ({ onInputChange, placeholder }, ref) => (
        <DebouceInput ref={ref} className="w-full" placeholder={placeholder} suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
    )
);
ItemSearch.displayName = 'ItemSearch';

type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; searchPlaceholder: string }
const ItemTableTools = ({ onSearchChange, onFilter, onExport, searchPlaceholder }: ItemTableToolsProps) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow">
            <ItemSearch onInputChange={onSearchChange} placeholder={searchPlaceholder} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
        </div>
    </div>
);

// --- Main Component: Trending Carousel Only ---
const TrendingCarousel = () => {
    const [carouselItemsData, setCarouselItemsData] = useState<TrendingCarouselItem[]>(initialDummyCarouselItems);
    const [isAddCarouselDrawerOpen, setIsAddCarouselDrawerOpen] = useState(false);
    const [isEditCarouselDrawerOpen, setIsEditCarouselDrawerOpen] = useState(false);
    const [editingCarouselItem, setEditingCarouselItem] = useState<TrendingCarouselItem | null>(null);
    const [carouselItemToDelete, setCarouselItemToDelete] = useState<TrendingCarouselItem | null>(null);

    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<TrendingCarouselItem[]>([]);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<{ filterStatus?: any[] }>({});

    // --- React Hook Forms ---
    const carouselForm = useForm<TrendingCarouselFormData>({
        resolver: zodResolver(trendingCarouselFormSchema),
        defaultValues: { imageUrl: '', date: new Date().toISOString().split('T')[0], status: 'active', link: '' },
        mode: 'onChange',
    });
    const filterForm = useForm<{ filterStatus?: any[] }>({
        defaultValues: {},
    });

    // --- CRUD and State Handlers ---
    const openAddDrawer = () => {
        carouselForm.reset();
        setIsAddCarouselDrawerOpen(true);
    };
    const closeAddDrawer = () => {
        setIsAddCarouselDrawerOpen(false);
    };

    const openEditDrawer = (item: TrendingCarouselItem) => {
        setEditingCarouselItem(item);
        carouselForm.reset(item as TrendingCarouselFormData);
        setIsEditCarouselDrawerOpen(true);
    };
    const closeEditDrawer = () => {
        setIsEditCarouselDrawerOpen(false);
        setEditingCarouselItem(null);
    };

    const onAddSubmit = async (data: TrendingCarouselFormData) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            const newItem: TrendingCarouselItem = { ...data, id: `TCI${Date.now()}` };
            setCarouselItemsData(prev => [...prev, newItem]);
            toast.push(<Notification title="Carousel Item Added" type="success">Item added to Trending Carousel.</Notification>);
            closeAddDrawer();
        } catch (error: any) {
            toast.push(<Notification title="Failed to Add" type="danger">{error?.message || 'Could not add item.'}</Notification>);
        } finally {
            setIsSubmitting(false);
            setMasterLoadingStatus('idle');
        }
    };

    const onEditSubmit = async (data: TrendingCarouselFormData) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            if (editingCarouselItem) {
                const updatedItem: TrendingCarouselItem = { ...editingCarouselItem, ...data };
                setCarouselItemsData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
                toast.push(<Notification title="Carousel Item Updated" type="success">Item updated.</Notification>);
            }
            closeEditDrawer();
        } catch (error: any) {
            toast.push(<Notification title="Failed to Update" type="danger">{error?.message || 'Could not update item.'}</Notification>);
        } finally {
            setIsSubmitting(false);
            setMasterLoadingStatus('idle');
        }
    };

    const handleDeleteClick = (item: TrendingCarouselItem) => {
        setCarouselItemToDelete(item);
        setSingleDeleteConfirmOpen(true);
    };

    const onConfirmSingleDelete = async () => {
        setIsDeleting(true);
        setMasterLoadingStatus('loading');
        setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            let idToDelete: string | number | undefined;
            let itemTitle: string = "Carousel Item";
            if (carouselItemToDelete) {
                idToDelete = carouselItemToDelete.id;
                itemTitle = `Carousel for ${carouselItemToDelete.date}`;
                setCarouselItemsData(prev => prev.filter(item => item.id !== idToDelete));
            }
            if (idToDelete) {
                toast.push(<Notification title="Item Deleted" type="success">{`${itemTitle} deleted.`}</Notification>);
                setSelectedItems(prev => prev.filter(item => item.id !== idToDelete));
            }
        } catch (error: any) {
            toast.push(<Notification title="Failed to Delete" type="danger">{error?.message || 'Could not delete item.'}</Notification>);
        } finally {
            setIsDeleting(false);
            setMasterLoadingStatus('idle');
            setCarouselItemToDelete(null);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        setIsDeleting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            const idsToDelete = selectedItems.map(item => item.id);
            setCarouselItemsData(prev => prev.filter(item => !idsToDelete.includes(item.id)));
            toast.push(<Notification title="Deletion Successful" type="success">{selectedItems.length} item(s) deleted.</Notification>);
            setSelectedItems([]);
        } catch (error: any) {
            toast.push(<Notification title="Deletion Failed" type="danger">{error?.message || 'Failed to delete selected items.'}</Notification>);
        } finally {
            setIsDeleting(false);
            setMasterLoadingStatus('idle');
        }
    };

    // --- Filter Handlers ---
    const openFilterDrawer = () => {
        filterForm.reset(filterCriteria);
        setIsFilterDrawerOpen(true);
    };
    const onApplyFiltersSubmit = (data: { filterStatus?: any[] }) => {
        setFilterCriteria(data);
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
        setIsFilterDrawerOpen(false);
    };
    const onClearFilters = () => {
        filterForm.reset({});
        setFilterCriteria({});
        setTableData(prev => ({ ...prev, pageIndex: 1 }));
    };

    // --- Data Processing (Memoized) ---
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: TrendingCarouselItem[] = cloneDeep(carouselItemsData);

        // Apply Filters
        if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
            const selectedStatuses = filterCriteria.filterStatus.map((opt: any) => opt.value);
            processedData = processedData.filter(item => selectedStatuses.includes(item.status));
        }

        // Apply Search Query
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item => {
                const itemTitleLower = String(item.imageUrl).toLowerCase();
                const itemIdString = String(item.id ?? '').toLowerCase();
                return itemTitleLower.includes(query) || itemIdString.includes(query);
            });
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
            processedData.sort((a, b) => {
                const aValue = a[key as keyof any];
                const bValue = b[key as keyof any];
                const aStr = String(aValue ?? '').toLowerCase();
                const bStr = String(bValue ?? '').toLowerCase();
                return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
            });
        }

        const dataToExport = [...processedData];
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

        return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
    }, [carouselItemsData, tableData, filterCriteria]);

    // --- Export Handler ---
    const handleExportData = () => {
        const headers = ['ID', 'Image URL', 'Link', 'Date', 'Status'];
        const keys = ['id', 'imageUrl', 'link', 'date', 'status'];
        const filename = 'trending_carousel_items.csv';
        const success = exportToCsv(filename, allFilteredAndSortedData, headers, keys);
        if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
    };

    // --- Table Interaction Handlers ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: TrendingCarouselItem) => {
        setSelectedItems(prev => {
            if (checked) return prev.some(item => item.id === row.id) ? prev : [...prev, row];
            return prev.filter(item => item.id !== row.id);
        });
    }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<any>[]) => {
        const originals = currentRows.map(r => r.original);
        if (checked) {
            setSelectedItems(prev => {
                const prevIds = new Set(prev.map(item => item.id));
                const newToAdd = originals.filter(r => !prevIds.has(r.id));
                return [...prev, ...newToAdd];
            });
        } else {
            const currentIds = new Set(originals.map(r => r.id));
            setSelectedItems(prev => prev.filter(item => !currentIds.has(item.id)));
        }
    }, []);

    // --- Column Definitions ---
    const columns = useMemo(() => [
        { header: 'ID', accessorKey: 'id', enableSorting: true, size: 100 },
        {
            header: 'Image', accessorKey: 'imageUrl', enableSorting: false, size: 100, meta: { cellClass: 'p-1' },
            cell: (props: any) => <Avatar size={60} shape="square" src={props.row.original.imageUrl || undefined} icon={<TbPhoto />} />,
        },
        {
            header: 'Link', accessorKey: 'link', enableSorting: false, size: 200,
            cell: (props: any) => props.row.original.link ? <a href={props.row.original.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">{props.row.original.link}</a> : '-'
        },
        { header: 'Date', accessorKey: 'date', enableSorting: true, size: 120 },
        {
            header: 'Status', accessorKey: 'status', enableSorting: true, size: 100,
            cell: (props: any) => <Tag className={classNames('rounded-md capitalize font-semibold border-0', statusColorsConst[props.row.original.status])}>{props.row.original.status}</Tag>,
        },
        {
            header: 'Actions', id: 'action', meta: { headerClass: 'text-center', cellClass: 'text-center' }, size: 100,
            cell: (props: any) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />,
        },
    ] as ColumnDef<TrendingCarouselItem>[], [openEditDrawer, handleDeleteClick]);

    // --- Segmented Control for View (Only Carousel) ---
    const viewOptions = [
        { value: 'carouselItems', label: 'Carousel Items', icon: <TbSlideshow /> },
    ];

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Trending Carousel</h5>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
                            Add New Carousel Item
                        </Button>
                    </div>

                    <ItemTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleExportData}
                        searchPlaceholder="Search image URLs..."
                    />

                    <div className="mt-4">
                        <DataTable
                            columns={columns as ColumnDef<any>[]}
                            data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{
                                total: total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            selectable
                            checkboxChecked={(row: any) => selectedItems.some(selected => selected.id === row.id)}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            onCheckBoxChange={handleRowSelect}
                            onIndeterminateCheckBoxChange={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <StickyFooter
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
                hidden={selectedItems.length === 0}
            >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400">
                            <TbChecks />
                        </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">
                                {selectedItems.length}
                            </span>
                            <span>
                                Item{selectedItems.length > 1 ? 's' : ''}{' '}
                                selected
                            </span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="plain"
                            className="text-red-600 hover:text-red-500"
                            onClick={handleDeleteSelected}
                        >
                            Delete Selected
                        </Button>
                    </div>
                </div>
            </StickyFooter>

            {/* Drawer for Trending Carousel Items (Add) */}
            <Drawer
                title="Add Trending Carousel Item"
                isOpen={isAddCarouselDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="addCarouselItemForm" type="submit" loading={isSubmitting} disabled={!carouselForm.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Carousel Item'}
                        </Button>
                    </div>
                }
            >
                <Form id="addCarouselItemForm" onSubmit={carouselForm.handleSubmit(onAddSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Image URL" invalid={!!carouselForm.formState.errors.imageUrl} errorMessage={carouselForm.formState.errors.imageUrl?.message}>
                        <Controller name="imageUrl" control={carouselForm.control} render={({ field }) => <Input {...field} type="url" placeholder="https://example.com/image.jpg" />} />
                    </FormItem>
                    <FormItem label="Link (Optional)" invalid={!!carouselForm.formState.errors.link} errorMessage={carouselForm.formState.errors.link?.message}>
                        <Controller name="link" control={carouselForm.control} render={({ field }) => <Input {...field} type="url" placeholder="https://example.com/product" />} />
                    </FormItem>
                    <FormItem label="Date" invalid={!!carouselForm.formState.errors.date} errorMessage={carouselForm.formState.errors.date?.message}>
                        <Controller name="date" control={carouselForm.control} render={({ field }) => <Input {...field} type="date" />} />
                    </FormItem>
                    <FormItem label="Status" invalid={!!carouselForm.formState.errors.status} errorMessage={carouselForm.formState.errors.status?.message}>
                        <Controller name="status" control={carouselForm.control} render={({ field }) => (
                            <Select placeholder="Select status" options={statusOptionsConst} value={statusOptionsConst.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
                        )} />
                    </FormItem>
                </Form>
            </Drawer>

            {/* Drawer for Trending Carousel Items (Edit) */}
            <Drawer
                title="Edit Trending Carousel Item"
                isOpen={isEditCarouselDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="editCarouselItemForm" type="submit" loading={isSubmitting} disabled={!carouselForm.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                }
            >
                <Form id="editCarouselItemForm" onSubmit={carouselForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Image URL" invalid={!!carouselForm.formState.errors.imageUrl} errorMessage={carouselForm.formState.errors.imageUrl?.message}>
                        <Controller name="imageUrl" control={carouselForm.control} render={({ field }) => <Input {...field} type="url" placeholder="https://example.com/image.jpg" />} />
                    </FormItem>
                    <FormItem label="Link (Optional)" invalid={!!carouselForm.formState.errors.link} errorMessage={carouselForm.formState.errors.link?.message}>
                        <Controller name="link" control={carouselForm.control} render={({ field }) => <Input {...field} type="url" placeholder="https://example.com/product" />} />
                    </FormItem>
                    <FormItem label="Date" invalid={!!carouselForm.formState.errors.date} errorMessage={carouselForm.formState.errors.date?.message}>
                        <Controller name="date" control={carouselForm.control} render={({ field }) => <Input {...field} type="date" />} />
                    </FormItem>
                    <FormItem label="Status" invalid={!!carouselForm.formState.errors.status} errorMessage={carouselForm.formState.errors.status?.message}>
                        <Controller name="status" control={carouselForm.control} render={({ field }) => (
                            <Select placeholder="Select status" options={statusOptionsConst} value={statusOptionsConst.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />
                        )} />
                    </FormItem>
                </Form>
            </Drawer>

            {/* Filter Drawer */}
            <Drawer
                title="Filter Carousel Items"
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                onRequestClose={() => setIsFilterDrawerOpen(false)}
                footer={
                    <div className="flex justify-between w-full">
                        <Button size="sm" onClick={onClearFilters} type="button">Clear All</Button>
                        <div>
                            <Button size="sm" className="mr-2" onClick={() => setIsFilterDrawerOpen(false)} type="button">Cancel</Button>
                            <Button size="sm" variant="solid" form="filterItemsForm" type="submit">Apply Filters</Button>
                        </div>
                    </div>
                }
            >
                <Form id="filterItemsForm" onSubmit={filterForm.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Status">
                        <Controller name="filterStatus" control={filterForm.control} render={({ field }) => (
                            <Select isMulti placeholder="Select status(es)..." options={statusOptionsConst} value={field.value || []} onChange={val => field.onChange(val || [])} />
                        )} />
                    </FormItem>
                </Form>
            </Drawer>

            {/* Single Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen}
                type="danger"
                title="Delete Item"
                onClose={() => { setSingleDeleteConfirmOpen(false); setCarouselItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setCarouselItemToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setCarouselItemToDelete(null); }}
                confirmButtonColor="red-600"
                onConfirm={onConfirmSingleDelete}
                loading={isDeleting}
            >
                <p>
                    Are you sure you want to delete this item?
                    {carouselItemToDelete && ` (Carousel Image for ${carouselItemToDelete.date})`}
                    This action cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    );
};

export default TrendingCarousel;

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}
