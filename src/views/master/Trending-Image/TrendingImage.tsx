import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom';
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
import { Drawer, Form, FormItem, Input, } from '@/components/ui'
import { Segment } from '@/components/ui' // For switching views

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
    TbSlideshow, // For Carousel section
    TbArticle,   // For Page Image section
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import Textarea from '@/views/ui-components/forms/Input/Textarea'
// Redux (Keep commented if using local state first)
// import { useAppDispatch } from '@/reduxtool/store';
// import {
//     getTrendingImagesAction, addTrendingImageAction, ...
//     getTrendingCarouselsAction, addTrendingCarouselAction, ...
// } from '@/reduxtool/trending/middleware'; // Placeholder
// import { trendingSelector } from '@/reduxtool/trending/trendingSlice'; // Placeholder

// --- Constants for both sections ---
const statusOptionsConst = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
]
const statusColorsConst: Record<'active' | 'inactive', string> = {
    active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
}
const pageNameOptionsConst = [ // Example page names for dropdown
    { value: 'home', label: 'Home Page' },
    { value: 'category_fashion', label: 'Fashion Category' },
    { value: 'category_electronics', label: 'Electronics Category' },
    { value: 'blog_detail', label: 'Blog Detail Page' },
    { value: 'landing_promo_xyz', label: 'Promo XYZ Landing Page' },
];
const pageNameValues = pageNameOptionsConst.map(opt => opt.value) as [string, ...string[]];


// --- SECTION 1: Trending Page Images ---
export type TrendingPageImageItem = {
    id: string | number
    pageName: string // Corresponds to a key from pageNameOptionsConst
    trendingProducts?: string // Could be comma-separated IDs/SKUs or a JSON string
    date: string // Store as YYYY-MM-DD string for easier date input handling
    status: 'active' | 'inactive'
    // Optional: Add an actual imageURL for the page's "trending image" if needed
    // pageImageUrl?: string
}

const trendingPageImageFormSchema = z.object({
    pageName: z.enum(pageNameValues, {
        errorMap: () => ({ message: 'Please select a page name.' }),
    }),
    trendingProducts: z.string().optional(), // Free text for now
    date: z.string().min(1, 'Date is required.').regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    status: z.enum(['active', 'inactive']),
})
type TrendingPageImageFormData = z.infer<typeof trendingPageImageFormSchema>

const initialDummyPageImages: TrendingPageImageItem[] = [
    { id: 'TPI001', pageName: 'home', date: '2024-07-28', status: 'active', trendingProducts: 'SKU001, SKU002' },
    { id: 'TPI002', pageName: 'category_fashion', date: '2024-07-27', status: 'inactive', trendingProducts: 'SKU003' },
]

// --- SECTION 2: Trending Carousel Items ---
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


// --- CSV Exporter Utility (Generic, adapt headers/keys per section) ---
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

// --- ActionColumn Component (Reusable) ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
    // ... (ActionColumn component remains the same)
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

// --- Generic Search and TableTools ---
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

// --- Main Component: Trending ---
const Trending = () => {
    type ViewMode = 'pageImages' | 'carouselItems';
    const [currentView, setCurrentView] = useState<ViewMode>('pageImages');

    // --- State for Page Images ---
    const [pageImagesData, setPageImagesData] = useState<TrendingPageImageItem[]>(initialDummyPageImages);
    const [isAddPageImageDrawerOpen, setIsAddPageImageDrawerOpen] = useState(false);
    const [isEditPageImageDrawerOpen, setIsEditPageImageDrawerOpen] = useState(false);
    const [editingPageImage, setEditingPageImage] = useState<TrendingPageImageItem | null>(null);
    const [pageImageToDelete, setPageImageToDelete] = useState<TrendingPageImageItem | null>(null);

    // --- State for Carousel Items ---
    const [carouselItemsData, setCarouselItemsData] = useState<TrendingCarouselItem[]>(initialDummyCarouselItems);
    const [isAddCarouselDrawerOpen, setIsAddCarouselDrawerOpen] = useState(false);
    const [isEditCarouselDrawerOpen, setIsEditCarouselDrawerOpen] = useState(false);
    const [editingCarouselItem, setEditingCarouselItem] = useState<TrendingCarouselItem | null>(null);
    const [carouselItemToDelete, setCarouselItemToDelete] = useState<TrendingCarouselItem | null>(null);

    // --- Common State ---
    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<(TrendingPageImageItem | TrendingCarouselItem)[]>([]); // Union type
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<{ filterStatus?: any[], filterPageName?: any[] }>({}); // Generic filter

    // --- React Hook Forms ---
    const pageImageForm = useForm<TrendingPageImageFormData>({
        resolver: zodResolver(trendingPageImageFormSchema),
        defaultValues: { pageName: pageNameValues[0], date: new Date().toISOString().split('T')[0], status: 'active', trendingProducts: '' },
        mode: 'onChange',
    });
    const carouselForm = useForm<TrendingCarouselFormData>({
        resolver: zodResolver(trendingCarouselFormSchema),
        defaultValues: { imageUrl: '', date: new Date().toISOString().split('T')[0], status: 'active', link: '' },
        mode: 'onChange',
    });
    const filterForm = useForm<{ filterStatus?: any[], filterPageName?: any[] }>({ // Simplified filter form
        defaultValues: {},
    });


    // --- CRUD and State Handlers (adapted for currentView) ---
    const openAddDrawer = () => {
        if (currentView === 'pageImages') {
            pageImageForm.reset();
            setIsAddPageImageDrawerOpen(true);
        } else {
            carouselForm.reset();
            setIsAddCarouselDrawerOpen(true);
        }
    };
    const closeAddDrawer = () => {
        setIsAddPageImageDrawerOpen(false);
        setIsAddCarouselDrawerOpen(false);
    };

    const openEditDrawer = (item: TrendingPageImageItem | TrendingCarouselItem) => {
        if (currentView === 'pageImages' && 'pageName' in item) {
            setEditingPageImage(item as TrendingPageImageItem);
            pageImageForm.reset(item as TrendingPageImageFormData); // Cast might be needed if Zod schema and Item type differ slightly
            setIsEditPageImageDrawerOpen(true);
        } else if (currentView === 'carouselItems' && 'imageUrl' in item) {
            setEditingCarouselItem(item as TrendingCarouselItem);
            carouselForm.reset(item as TrendingCarouselFormData);
            setIsEditCarouselDrawerOpen(true);
        }
    };
    const closeEditDrawer = () => {
        setIsEditPageImageDrawerOpen(false);
        setIsEditCarouselDrawerOpen(false);
        setEditingPageImage(null);
        setEditingCarouselItem(null);
    };

    const onAddSubmit = async (data: TrendingPageImageFormData | TrendingCarouselFormData) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API

        try {
            if (currentView === 'pageImages') {
                const newItem: TrendingPageImageItem = { ...(data as TrendingPageImageFormData), id: `TPI${Date.now()}` };
                setPageImagesData(prev => [...prev, newItem]);
                toast.push(<Notification title="Page Image Added" type="success">Item added to Trending Page Images.</Notification>);
            } else {
                const newItem: TrendingCarouselItem = { ...(data as TrendingCarouselFormData), id: `TCI${Date.now()}` };
                setCarouselItemsData(prev => [...prev, newItem]);
                toast.push(<Notification title="Carousel Item Added" type="success">Item added to Trending Carousel.</Notification>);
            }
            closeAddDrawer();
        } catch (error: any) {
            toast.push(<Notification title="Failed to Add" type="danger">{error?.message || 'Could not add item.'}</Notification>);
        } finally {
            setIsSubmitting(false);
            setMasterLoadingStatus('idle');
        }
    };

    const onEditSubmit = async (data: TrendingPageImageFormData | TrendingCarouselFormData) => {
        setIsSubmitting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API

        try {
            if (currentView === 'pageImages' && editingPageImage) {
                const updatedItem: TrendingPageImageItem = { ...editingPageImage, ...(data as TrendingPageImageFormData) };
                setPageImagesData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
                toast.push(<Notification title="Page Image Updated" type="success">Item updated.</Notification>);
            } else if (currentView === 'carouselItems' && editingCarouselItem) {
                const updatedItem: TrendingCarouselItem = { ...editingCarouselItem, ...(data as TrendingCarouselFormData) };
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

    const handleDeleteClick = (item: TrendingPageImageItem | TrendingCarouselItem) => {
        if (currentView === 'pageImages') setPageImageToDelete(item as TrendingPageImageItem);
        else setCarouselItemToDelete(item as TrendingCarouselItem);
        setSingleDeleteConfirmOpen(true);
    };

    const onConfirmSingleDelete = async () => {
        setIsDeleting(true);
        setMasterLoadingStatus('loading');
        setSingleDeleteConfirmOpen(false);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API

        try {
            let idToDelete: string | number | undefined;
            let itemTitle: string = "Item";

            if (currentView === 'pageImages' && pageImageToDelete) {
                idToDelete = pageImageToDelete.id;
                itemTitle = pageNameOptionsConst.find(p=>p.value === pageImageToDelete.pageName)?.label || pageImageToDelete.pageName;
                setPageImagesData(prev => prev.filter(item => item.id !== idToDelete));
            } else if (currentView === 'carouselItems' && carouselItemToDelete) {
                idToDelete = carouselItemToDelete.id;
                itemTitle = `Carousel for ${carouselItemToDelete.date}`; // Or a better title
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
            setPageImageToDelete(null);
            setCarouselItemToDelete(null);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return;
        setIsDeleting(true);
        setMasterLoadingStatus('loading');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API
        try {
            const idsToDelete = selectedItems.map(item => item.id);
            if (currentView === 'pageImages') {
                setPageImagesData(prev => prev.filter(item => !idsToDelete.includes(item.id)));
            } else {
                setCarouselItemsData(prev => prev.filter(item => !idsToDelete.includes(item.id)));
            }
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
    const onApplyFiltersSubmit = (data: { filterStatus?: any[], filterPageName?: any[] }) => {
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
        const sourceData = currentView === 'pageImages' ? pageImagesData : carouselItemsData;
        let processedData: any[] = cloneDeep(sourceData);

        // Apply Filters
        if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
            const selectedStatuses = filterCriteria.filterStatus.map((opt: any) => opt.value);
            processedData = processedData.filter(item => selectedStatuses.includes(item.status));
        }
        if (currentView === 'pageImages' && filterCriteria.filterPageName && filterCriteria.filterPageName.length > 0) {
            const selectedPageNames = filterCriteria.filterPageName.map((opt: any) => opt.value);
            processedData = processedData.filter(item => selectedPageNames.includes(item.pageName));
        }

        // Apply Search Query
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim();
            processedData = processedData.filter(item => {
                const itemTitleLower = String(currentView === 'pageImages' ? item.pageName : item.imageUrl).toLowerCase();
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
    }, [currentView, pageImagesData, carouselItemsData, tableData, filterCriteria]);


    // --- Export Handlers ---
    const handleExportData = () => {
        let headers: string[], keys: string[], filename: string;
        if (currentView === 'pageImages') {
            headers = ['ID', 'Page Name', 'Date', 'Status', 'Trending Products'];
            keys = ['id', 'pageName', 'date', 'status', 'trendingProducts'];
            filename = 'trending_page_images.csv';
        } else {
            headers = ['ID', 'Image URL', 'Link', 'Date', 'Status'];
            keys = ['id', 'imageUrl', 'link', 'date', 'status'];
            filename = 'trending_carousel_items.csv';
        }
        const success = exportToCsv(filename, allFilteredAndSortedData, headers, keys);
        if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
    };


    // --- Table Interaction Handlers (Generic) ---
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: any) => { // `any` due to union type
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

    // --- Column Definitions (Dynamic based on currentView) ---
    const columns = useMemo(() => {
        const commonActionColumn = {
            header: 'Actions', id: 'action', meta: { headerClass: 'text-center', cellClass: 'text-center' }, size: 100,
            cell: (props: any) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />,
        };
        const commonStatusColumn = {
            header: 'Status', accessorKey: 'status', enableSorting: true, size: 100,
            cell: (props: any) => <Tag className={classNames('rounded-md capitalize font-semibold border-0', statusColorsConst[props.row.original.status])}>{props.row.original.status}</Tag>,
        };
        const commonDateColumn = { header: 'Date', accessorKey: 'date', enableSorting: true, size: 120 };

        if (currentView === 'pageImages') {
            return [
                { header: 'ID', accessorKey: 'id', enableSorting: true, size: 100 },
                {
                    header: 'Page Name', accessorKey: 'pageName', enableSorting: true, size: 200,
                    cell: (props: any) => {
                        const page = pageNameOptionsConst.find(p => p.value === props.row.original.pageName);
                        return <span className="font-semibold">{page ? page.label : props.row.original.pageName}</span>;
                    }
                },
                commonDateColumn,
                commonStatusColumn,
                commonActionColumn,
            ] as ColumnDef<TrendingPageImageItem>[];
        } else { // carouselItems
            return [
                { header: 'ID', accessorKey: 'id', enableSorting: true, size: 100 },
                {
                    header: 'Image', accessorKey: 'imageUrl', enableSorting: false, size: 100, meta: { cellClass: 'p-1' },
                    cell: (props: any) => <Avatar size={60} shape="square" src={props.row.original.imageUrl || undefined} icon={<TbPhoto />} />,
                },
                {
                    header: 'Link', accessorKey: 'link', enableSorting: false, size: 200,
                    cell: (props: any) => props.row.original.link ? <a href={props.row.original.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">{props.row.original.link}</a> : '-'
                },
                commonDateColumn,
                commonStatusColumn,
                commonActionColumn,
            ] as ColumnDef<TrendingCarouselItem>[];
        }
    }, [currentView, openEditDrawer, handleDeleteClick]); // Dependencies for memoization

    // --- Segmented Control for View Switching ---
    const viewOptions = [
        { value: 'pageImages', label: 'Page Images', icon: <TbArticle /> },
        { value: 'carouselItems', label: 'Carousel Items', icon: <TbSlideshow /> },
    ];
    const handleViewChange = (val: ViewMode) => {
        setCurrentView(val);
        setSelectedItems([]); // Clear selection when view changes
        setTableData({ pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' }); // Reset table
        setFilterCriteria({}); // Reset filters
    };

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <Segment value={currentView} onChange={val => handleViewChange(val as ViewMode)} className="mb-4 sm:mb-0">
                            {viewOptions.map(option => (
                                <Segment.Item value={option.value} key={option.value}>
                                    <span className="flex items-center gap-2">
                                        {option.icon} {option.label}
                                    </span>
                                </Segment.Item>
                            ))}
                        </Segment>
                        <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
                            Add New {currentView === 'pageImages' ? 'Page Image' : 'Carousel Item'}
                        </Button>
                    </div>

                    <ItemTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleExportData}
                        searchPlaceholder={`Search ${currentView === 'pageImages' ? 'page names' : 'image URLs'}...`}
                    />

                    <div className="mt-4">
                        <DataTable
                            columns={columns as ColumnDef<any>[]} // Cast as ColumnDef<any>[]
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

            {/* Drawer for Trending Page Images (Add) */}
            <Drawer
                title="Add Trending Page Image"
                isOpen={isAddPageImageDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                footer={ /* Footer for Add Page Image */
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="addPageImageForm" type="submit" loading={isSubmitting} disabled={!pageImageForm.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Page Image'}
                        </Button>
                    </div>
                }
            >
                <Form id="addPageImageForm" onSubmit={pageImageForm.handleSubmit(onAddSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Page Name" invalid={!!pageImageForm.formState.errors.pageName} errorMessage={pageImageForm.formState.errors.pageName?.message}>
                        <Controller name="pageName" control={pageImageForm.control} render={({ field }) => (
                            <Select placeholder="Select page" options={pageNameOptionsConst} value={pageNameOptionsConst.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />
                        )} />
                    </FormItem>
                    <FormItem label="Trending Products (Optional, e.g., SKUs)" invalid={!!pageImageForm.formState.errors.trendingProducts} errorMessage={pageImageForm.formState.errors.trendingProducts?.message}>
                        <Controller name="trendingProducts" control={pageImageForm.control} render={({ field }) => (
                            <Textarea {...field} placeholder="Enter product SKUs or identifiers, comma-separated" />
                        )} />
                    </FormItem>
                    <FormItem label="Date" invalid={!!pageImageForm.formState.errors.date} errorMessage={pageImageForm.formState.errors.date?.message}>
                        <Controller name="date" control={pageImageForm.control} render={({ field }) => <Input {...field} type="date" />} />
                    </FormItem>
                    <FormItem label="Status" invalid={!!pageImageForm.formState.errors.status} errorMessage={pageImageForm.formState.errors.status?.message}>
                        <Controller name="status" control={pageImageForm.control} render={({ field }) => (
                             <Select placeholder="Select status" options={statusOptionsConst} value={statusOptionsConst.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />
                        )} />
                    </FormItem>
                </Form>
            </Drawer>

             {/* Drawer for Trending Page Images (Edit) */}
            <Drawer
                title="Edit Trending Page Image"
                isOpen={isEditPageImageDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                footer={ /* Footer for Edit Page Image */
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting} type="button">Cancel</Button>
                        <Button size="sm" variant="solid" form="editPageImageForm" type="submit" loading={isSubmitting} disabled={!pageImageForm.formState.isValid || isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                }
            >
                <Form id="editPageImageForm" onSubmit={pageImageForm.handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
                     <FormItem label="Page Name" invalid={!!pageImageForm.formState.errors.pageName} errorMessage={pageImageForm.formState.errors.pageName?.message}>
                        <Controller name="pageName" control={pageImageForm.control} render={({ field }) => (
                            <Select placeholder="Select page" options={pageNameOptionsConst} value={pageNameOptionsConst.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />
                        )} />
                    </FormItem>
                    <FormItem label="Trending Products (Optional, e.g., SKUs)" invalid={!!pageImageForm.formState.errors.trendingProducts} errorMessage={pageImageForm.formState.errors.trendingProducts?.message}>
                        <Controller name="trendingProducts" control={pageImageForm.control} render={({ field }) => (
                            <Textarea {...field} placeholder="Enter product SKUs or identifiers, comma-separated" />
                        )} />
                    </FormItem>
                    <FormItem label="Date" invalid={!!pageImageForm.formState.errors.date} errorMessage={pageImageForm.formState.errors.date?.message}>
                        <Controller name="date" control={pageImageForm.control} render={({ field }) => <Input {...field} type="date" />} />
                    </FormItem>
                    <FormItem label="Status" invalid={!!pageImageForm.formState.errors.status} errorMessage={pageImageForm.formState.errors.status?.message}>
                        <Controller name="status" control={pageImageForm.control} render={({ field }) => (
                             <Select placeholder="Select status" options={statusOptionsConst} value={statusOptionsConst.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />
                        )} />
                    </FormItem>
                </Form>
            </Drawer>


            {/* Drawer for Trending Carousel Items (Add) */}
            <Drawer
                title="Add Trending Carousel Item"
                isOpen={isAddCarouselDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                 footer={ /* Footer for Add Carousel */
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
                           <Select placeholder="Select status" options={statusOptionsConst} value={statusOptionsConst.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />
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
                 footer={ /* Footer for Edit Carousel */
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
                           <Select placeholder="Select status" options={statusOptionsConst} value={statusOptionsConst.find(o=>o.value===field.value)} onChange={opt=>field.onChange(opt?.value)} />
                        )} />
                    </FormItem>
                </Form>
            </Drawer>

            {/* Filter Drawer (Generic) */}
            <Drawer
                title={`Filter ${currentView === 'pageImages' ? 'Page Images' : 'Carousel Items'}`}
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
                    {currentView === 'pageImages' && (
                        <FormItem label="Filter by Page Name">
                            <Controller name="filterPageName" control={filterForm.control} render={({ field }) => (
                                <Select isMulti placeholder="Select page name(s)..." options={pageNameOptionsConst} value={field.value || []} onChange={val => field.onChange(val || [])} />
                            )} />
                        </FormItem>
                    )}
                </Form>
            </Drawer>

            {/* Single Delete Confirmation Dialog (Generic) */}
            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen}
                type="danger"
                title="Delete Item"
                onClose={() => { setSingleDeleteConfirmOpen(false); setPageImageToDelete(null); setCarouselItemToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setPageImageToDelete(null); setCarouselItemToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setPageImageToDelete(null); setCarouselItemToDelete(null); }}
                confirmButtonColor="red-600"
                onConfirm={onConfirmSingleDelete}
                loading={isDeleting}
            >
                <p>
                    Are you sure you want to delete this item?
                    {(pageImageToDelete && ` (Page: ${pageNameOptionsConst.find(p=>p.value === pageImageToDelete.pageName)?.label || pageImageToDelete.pageName})`) ||
                     (carouselItemToDelete && ` (Carousel Image for ${carouselItemToDelete.date})`)}
                     This action cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    );
};

export default Trending;

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
}