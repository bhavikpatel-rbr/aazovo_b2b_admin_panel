import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom'; // Keep if navigation needed for edit/view
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
import Select from '@/components/ui/Select' // Make sure this supports isMulti and single select well
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import { Drawer, Form, FormItem, Input,  } from '@/components/ui' // Added Textarea

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbPhoto, // Generic image icon
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
// --- Removed Redux imports for now, using local state ---
// import { useAppDispatch } from '@/reduxtool/store';
// import { getSlidersAction, addSliderAction, ... } from '@/reduxtool/slider/middleware';
// import { sliderSelector } from '@/reduxtool/slider/sliderSlice';

// --- Define SliderItem Type ---
export type SliderItem = {
    id: string | number
    title: string
    subtitle?: string
    buttonText?: string
    mobileIconUrl?: string // URL for mobile icon
    webIconUrl?: string // URL for web icon
    sliderColor?: string // Hex or named color
    displayPage: string // Key for display page option
    link?: string
    status: 'active' | 'disable'
    // Removed: image, domain
}

// --- Zod Schema for Add/Edit Slider Form ---
const displayPageOptionsConst = [ // For Zod enum and Select options
    { value: 'home', label: 'Home Page' },
    { value: 'products', label: 'Products Page' },
    { value: 'about', label: 'About Us Page' },
    { value: 'blog_listing', label: 'Blog Listing' },
    { value: 'contact', label: 'Contact Page' },
];
const displayPageValues = displayPageOptionsConst.map(opt => opt.value) as [string, ...string[]]; // For Zod enum

const sliderFormSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required.')
        .max(100, 'Title cannot exceed 100 characters.'),
    subtitle: z.string().max(150, 'Subtitle too long').optional(),
    buttonText: z.string().max(50, 'Button text too long').optional(),
    mobileIconUrl: z.string().url('Invalid URL for mobile icon').optional().or(z.literal('')),
    webIconUrl: z.string().url('Invalid URL for web icon').optional().or(z.literal('')),
    sliderColor: z.string().regex(/^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$|^[a-zA-Z]+$/, 'Invalid color format (hex or name)').optional().or(z.literal('')),
    displayPage: z.enum(displayPageValues, {
        errorMap: () => ({ message: 'Please select a display page.' }),
    }),
    link: z.string().url('Invalid URL for link').optional().or(z.literal('')),
    status: z.enum(['active', 'disable'], {
        errorMap: () => ({ message: 'Please select a status.' }),
    }),
})
type SliderFormData = z.infer<typeof sliderFormSchema>

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterStatus: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
    filterDisplayPage: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
})
type FilterFormData = z.infer<typeof filterFormSchema>

// --- Constants ---
const sliderStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'disable', label: 'Disabled' },
]

const sliderStatusColor: Record<SliderItem['status'], string> = {
    active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    disable: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
}

// --- CSV Exporter Utility ---
const CSV_HEADERS = ['ID', 'Title', 'Subtitle', 'Button Text', 'Display Page', 'Link', 'Status', 'Web Icon URL', 'Mobile Icon URL', 'Slider Color']
const CSV_KEYS: (keyof SliderItem)[] = ['id', 'title', 'subtitle', 'buttonText', 'displayPage', 'link', 'status', 'webIconUrl', 'mobileIconUrl', 'sliderColor']

function exportToCsv(filename: string, rows: SliderItem[]) {
    // ... (exportToCsv function remains the same as in your Blogs component)
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info">
                Nothing to export.
            </Notification>,
        );
        return false;
    }
    const separator = ',';

    const csvContent =
        CSV_HEADERS.join(separator) +
        '\n' +
        rows
            .map((row) => {
                return CSV_KEYS.map((k) => {
                    let cell: any = row[k];
                    if (cell === null || cell === undefined) {
                        cell = '';
                    } else if (cell instanceof Date) { // Should not happen for SliderItem
                        cell = cell.toISOString();
                    } else {
                        cell = String(cell).replace(/"/g, '""');
                    }
                    if (String(cell).search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`;
                    }
                    return cell;
                }).join(separator);
            })
            .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
    });
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
    toast.push(
        <Notification title="Export Failed" type="danger">
            Browser does not support this feature.
        </Notification>,
    );
    return false;
}

// --- Initial Dummy Data ---
const initialDummySliders: SliderItem[] = [
    {
        id: 'SLD001',
        title: 'Summer Collection Out Now!',
        subtitle: 'Up to 50% off on selected items.',
        buttonText: 'Shop Now',
        webIconUrl: 'https://via.placeholder.com/1920x1080/FFA07A/000000?text=Web+Slider+1',
        mobileIconUrl: 'https://via.placeholder.com/500x300/FFA07A/000000?text=Mobile+Slider+1',
        sliderColor: '#FFA07A',
        displayPage: 'home',
        link: '/shop/summer-collection',
        status: 'active',
    },
    {
        id: 'SLD002',
        title: 'New Arrivals: Tech Gadgets',
        subtitle: 'Explore the latest innovations.',
        webIconUrl: 'https://via.placeholder.com/1920x1080/ADD8E6/000000?text=Web+Slider+2',
        displayPage: 'products',
        link: '/products/tech',
        status: 'active',
        sliderColor: 'lightblue',
    },
    {
        id: 'SLD003',
        title: 'Read Our Latest Blog Post',
        buttonText: 'Read More',
        webIconUrl: 'https://via.placeholder.com/1920x1080/90EE90/000000?text=Web+Slider+3',
        displayPage: 'blog_listing',
        link: '/blog/latest-post',
        status: 'disable',
        sliderColor: '#90EE90',
    },
     {
        id: 'SLD004',
        title: 'Contact Us For Support',
        subtitle: 'We are here to help you 24/7',
        buttonText: 'Get In Touch',
        webIconUrl: 'https://via.placeholder.com/1920x1080/FFFFE0/000000?text=Web+Slider+4',
        mobileIconUrl: 'https://via.placeholder.com/500x300/FFFFE0/000000?text=Mobile+Slider+4',
        sliderColor: 'lightyellow',
        displayPage: 'contact',
        link: '/contact-us',
        status: 'active',
    },
];

// --- ActionColumn Component (remains the same) ---
const ActionColumn = ({
    onEdit,
    onDelete,
}: {
    onEdit: () => void
    onDelete: () => void
}) => {
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
}

// --- SlidersSearch Component ---
type SlidersSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const SlidersSearch = React.forwardRef<HTMLInputElement, SlidersSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                className="w-full"
                placeholder="Quick search sliders (title, id)..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
SlidersSearch.displayName = 'SlidersSearch'

// --- SlidersTableTools Component ---
const SlidersTableTools = ({
    onSearchChange,
    onFilter,
    onExport,
}: {
    onSearchChange: (query: string) => void
    onFilter: () => void
    onExport: () => void
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="flex-grow">
                <SlidersSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button
                    icon={<TbFilter />}
                    onClick={onFilter}
                    className="w-full sm:w-auto"
                >
                    Filter
                </Button>
                <Button
                    icon={<TbCloudUpload />}
                    onClick={onExport}
                    className="w-full sm:w-auto"
                >
                    Export
                </Button>
            </div>
        </div>
    )
}

// --- SlidersTable Component ---
type SlidersTableProps = {
    columns: ColumnDef<SliderItem>[]
    data: SliderItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedItems: SliderItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: SliderItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<SliderItem>[]) => void
}
const SlidersTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedItems,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: SlidersTableProps) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedItems.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}

// --- SlidersSelectedFooter Component (remains the same) ---
type SlidersSelectedFooterProps = {
    selectedItems: SliderItem[]
    onDeleteSelected: () => void
}
const SlidersSelectedFooter = ({
    selectedItems,
    onDeleteSelected,
}: SlidersSelectedFooterProps) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }
    if (selectedItems.length === 0) return null
    return (
        <>
            <StickyFooter
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
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
                                Slider{selectedItems.length > 1 ? 's' : ''}{' '}
                                selected
                            </span>
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="plain"
                            className="text-red-600 hover:text-red-500"
                            onClick={handleDeleteClick}
                        >
                            Delete Selected
                        </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedItems.length} Slider${selectedItems.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected slider
                    {selectedItems.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

// --- Main Sliders Component ---
const Sliders = () => {
    // const dispatch = useAppDispatch(); // Uncomment for Redux

    const [slidersData, setSlidersData] = useState<SliderItem[]>(initialDummySliders)
    const [masterLoadingStatus, setMasterLoadingStatus] = useState<'idle' | 'loading'>('idle')

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
    const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false)
    const [sliderToDelete, setSliderToDelete] = useState<SliderItem | null>(null)

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
        filterStatus: [],
        filterDisplayPage: [],
    })

    // useEffect(() => { // Example Redux fetch
    //     dispatch(getSlidersAction());
    // }, [dispatch]);
    // const { slidersData = [], status: masterLoadingStatus = 'idle' } =
    //     useSelector(sliderSelector);

    const addFormMethods = useForm<SliderFormData>({
        resolver: zodResolver(sliderFormSchema),
        defaultValues: {
            title: '',
            subtitle: '',
            buttonText: '',
            mobileIconUrl: '',
            webIconUrl: '',
            sliderColor: '#FFFFFF', // Default color
            displayPage: displayPageOptionsConst[0].value, // Default display page
            link: '',
            status: 'active',
        },
        mode: 'onChange',
    })
    const editFormMethods = useForm<SliderFormData>({
        resolver: zodResolver(sliderFormSchema),
        defaultValues: {}, // Will be set on openEditDrawer
        mode: 'onChange',
    })
    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        defaultValues: filterCriteria,
    })

    const openAddDrawer = () => {
        addFormMethods.reset() // Reset to default values
        setIsAddDrawerOpen(true)
    }
    const closeAddDrawer = () => {
        addFormMethods.reset()
        setIsAddDrawerOpen(false)
    }
    const onAddSliderSubmit = async (data: SliderFormData) => {
        setIsSubmitting(true)
        setMasterLoadingStatus('loading')
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API

        try {
            const newSlider: SliderItem = {
                ...data,
                id: `SLD${Date.now()}`, // Simple unique ID
            }
            setSlidersData((prev) => [...prev, newSlider])
            // await dispatch(addSliderAction(newSlider)).unwrap(); // Redux
            toast.push(
                <Notification title="Slider Added" type="success" duration={2000}>
                    Slider "{data.title}" added.
                </Notification>,
            )
            closeAddDrawer()
        } catch (error: any) {
            toast.push(
                <Notification title="Failed to Add" type="danger" duration={3000}>
                    {error?.message || 'Could not add slider.'}
                </Notification>,
            )
        } finally {
            setIsSubmitting(false)
            setMasterLoadingStatus('idle')
        }
    }

    const openEditDrawer = (slider: SliderItem) => {
        setEditingSlider(slider)
        editFormMethods.reset({
            title: slider.title,
            subtitle: slider.subtitle ?? '',
            buttonText: slider.buttonText ?? '',
            mobileIconUrl: slider.mobileIconUrl ?? '',
            webIconUrl: slider.webIconUrl ?? '',
            sliderColor: slider.sliderColor ?? '#FFFFFF',
            displayPage: slider.displayPage,
            link: slider.link ?? '',
            status: slider.status,
        })
        setIsEditDrawerOpen(true)
    }
    const closeEditDrawer = () => {
        setEditingSlider(null)
        editFormMethods.reset()
        setIsEditDrawerOpen(false)
    }
    const onEditSliderSubmit = async (data: SliderFormData) => {
        if (!editingSlider?.id) return
        setIsSubmitting(true)
        setMasterLoadingStatus('loading')
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API

        try {
            const updatedSlider: SliderItem = {
                ...editingSlider,
                ...data,
            }
            setSlidersData((prev) =>
                prev.map((s) => (s.id === updatedSlider.id ? updatedSlider : s)),
            )
            // await dispatch(editSliderAction(updatedSlider)).unwrap(); // Redux
            toast.push(
                <Notification title="Slider Updated" type="success" duration={2000}>
                    Slider "{data.title}" updated.
                </Notification>,
            )
            closeEditDrawer()
        } catch (error: any) {
            toast.push(
                <Notification title="Failed to Update" type="danger" duration={3000}>
                     {error?.message || 'Could not update slider.'}
                </Notification>,
            )
        } finally {
            setIsSubmitting(false)
            setMasterLoadingStatus('idle')
        }
    }

    const handleDeleteClick = (slider: SliderItem) => {
        setSliderToDelete(slider)
        setSingleDeleteConfirmOpen(true)
    }
    const onConfirmSingleDelete = async () => {
        if (!sliderToDelete?.id) return
        setIsDeleting(true)
        setMasterLoadingStatus('loading')
        setSingleDeleteConfirmOpen(false)
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API

        try {
            const idToDelete = sliderToDelete.id
            setSlidersData((prev) => prev.filter((s) => s.id !== idToDelete))
            // await dispatch(deleteSliderAction({ id: idToDelete })).unwrap(); // Redux
            toast.push(
                <Notification title="Slider Deleted" type="success" duration={2000}>
                    Slider "{sliderToDelete.title}" deleted.
                </Notification>,
            )
            setSelectedItems((prev) =>
                prev.filter((item) => item.id !== idToDelete),
            )
        } catch (error: any) {
            toast.push(
                <Notification title="Failed to Delete" type="danger" duration={3000}>
                    {error?.message || 'Could not delete slider.'}
                </Notification>,
            )
        } finally {
            setIsDeleting(false)
            setMasterLoadingStatus('idle')
            setSliderToDelete(null)
        }
    }
    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) return
        setIsDeleting(true)
        setMasterLoadingStatus('loading')
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API

        try {
            const idsToDelete = selectedItems.map((item) => item.id)
            setSlidersData((prev) => prev.filter((s) => !idsToDelete.includes(s.id)))
            // await dispatch(deleteAllSlidersAction({ ids: idsToDelete })).unwrap(); // Redux
            toast.push(
                <Notification title="Deletion Successful" type="success" duration={2000}>
                    {selectedItems.length} slider(s) deleted.
                </Notification>,
            )
            setSelectedItems([])
        } catch (error: any) {
            toast.push(
                <Notification title="Deletion Failed" type="danger" duration={3000}>
                    {error?.message || 'Failed to delete selected sliders.'}
                </Notification>,
            )
        } finally {
            setIsDeleting(false)
            setMasterLoadingStatus('idle')
        }
    }

    const openFilterDrawer = () => {
        filterFormMethods.reset(filterCriteria)
        setIsFilterDrawerOpen(true)
    }
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false)
    const onApplyFiltersSubmit = (data: FilterFormData) => {
        setFilterCriteria({
            filterStatus: data.filterStatus || [],
            filterDisplayPage: data.filterDisplayPage || [],
        })
        handleSetTableData({ pageIndex: 1 })
        closeFilterDrawer()
    }
    const onClearFilters = () => {
        const defaultFilters = { filterStatus: [], filterDisplayPage: [] }
        filterFormMethods.reset(defaultFilters)
        setFilterCriteria(defaultFilters)
        handleSetTableData({ pageIndex: 1 })
    }

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedItems, setSelectedItems] = useState<SliderItem[]>([])

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: SliderItem[] = cloneDeep(slidersData)

        if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
            const selectedStatuses = filterCriteria.filterStatus.map((opt) => opt.value)
            processedData = processedData.filter((item) =>
                selectedStatuses.includes(item.status),
            )
        }
        if (filterCriteria.filterDisplayPage && filterCriteria.filterDisplayPage.length > 0) {
            const selectedPages = filterCriteria.filterDisplayPage.map((opt) => opt.value)
            processedData = processedData.filter((item) =>
                selectedPages.includes(item.displayPage),
            )
        }

        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            processedData = processedData.filter((item) => {
                const itemTitleLower = item.title?.trim().toLowerCase() ?? ''
                const itemIdString = String(item.id ?? '').trim().toLowerCase()
                return itemTitleLower.includes(query) || itemIdString.includes(query)
            })
        }

        const { order, key } = tableData.sort as OnSortParam
        if (order && key && ['id', 'title', 'status', 'displayPage'].includes(key)) {
            processedData.sort((a, b) => {
                const aValue = a[key as keyof SliderItem]
                const bValue = b[key as keyof SliderItem]
                const aStr = String(aValue ?? '').toLowerCase()
                const bStr = String(bValue ?? '').toLowerCase()
                return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
            })
        }

        const dataToExport = [...processedData]
        const currentTotal = processedData.length
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize)

        return {
            pageData: dataForPage,
            total: currentTotal,
            allFilteredAndSortedData: dataToExport,
        }
    }, [slidersData, tableData, filterCriteria])

    const handleExportData = () => {
        const success = exportToCsv('sliders_export.csv', allFilteredAndSortedData)
        if (success) {
            toast.push(
                <Notification title="Export Successful" type="success">
                    Data exported.
                </Notification>,
            )
        }
    }

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }))
    }, [])
    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData],
    )
    const handleSelectChange = useCallback(
        (value: number) => {
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 })
            setSelectedItems([])
        },
        [handleSetTableData],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
        [handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
        [handleSetTableData],
    )
    const handleRowSelect = useCallback((checked: boolean, row: SliderItem) => {
        setSelectedItems((prev) => {
            if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]
            return prev.filter((item) => item.id !== row.id)
        })
    }, [])
    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<SliderItem>[]) => {
            const currentPageRowOriginals = currentRows.map((r) => r.original)
            if (checked) {
                setSelectedItems((prev) => {
                    const prevIds = new Set(prev.map(item => item.id));
                    const newToAdd = currentPageRowOriginals.filter(r => !prevIds.has(r.id));
                    return [...prev, ...newToAdd];
                })
            } else {
                const currentPageIds = new Set(currentPageRowOriginals.map(r => r.id));
                setSelectedItems((prev) => prev.filter(item => !currentPageIds.has(item.id)));
            }
        }, [])

    const columns: ColumnDef<SliderItem>[] = useMemo(
        () => [
            {
                header: 'Icon', // Using Web Icon for display
                accessorKey: 'webIconUrl',
                enableSorting: false,
                size: 80,
                meta: { headerClass: 'text-center', cellClass: 'text-center' },
                cell: (props) => {
                    const { webIconUrl, title } = props.row.original
                    return (
                        <Avatar
                            size={40} // Adjusted size
                            shape="square" // Sliders are often rectangular
                            src={webIconUrl || undefined}
                            icon={<TbPhoto />}
                        >
                            {!webIconUrl ? title?.charAt(0).toUpperCase() : ''}
                        </Avatar>
                    )
                },
            },
            { header: 'Title', accessorKey: 'title', enableSorting: true, size: 200,
                cell: props => <span className="font-semibold">{props.row.original.title}</span>
             },
            {
                header: 'Display Page',
                accessorKey: 'displayPage',
                enableSorting: true,
                size: 150,
                cell: (props) => {
                    const pageLabel = displayPageOptionsConst.find(
                        (p) => p.value === props.row.original.displayPage,
                    )?.label
                    return <span>{pageLabel || props.row.original.displayPage}</span>
                },
            },
            {
                header: 'Link',
                accessorKey: 'link',
                enableSorting: false, // Links are usually not sorted
                size: 180,
                cell: props => props.row.original.link ? <a href={props.row.original.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">{props.row.original.link}</a> : '-'
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                size: 100,
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <Tag
                            className={classNames(
                                'rounded-md capitalize font-semibold border-0',
                                sliderStatusColor[status],
                            )}
                        >
                            {status}
                        </Tag>
                    )
                },
            },
            {
                header: 'Actions',
                id: 'action',
                meta: { headerClass: 'text-center', cellClass: 'text-center' },
                size: 100,
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)}
                        onDelete={() => handleDeleteClick(props.row.original)}
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [], // openEditDrawer, handleDeleteClick will be stable due to useCallback
    )

    const renderFormFields = (formMethods: typeof addFormMethods | typeof editFormMethods) => (
        <>
            <FormItem
                label="Title"
                invalid={!!formMethods.formState.errors.title}
                errorMessage={formMethods.formState.errors.title?.message}
            >
                <Controller
                    name="title"
                    control={formMethods.control}
                    render={({ field }) => <Input {...field} placeholder="Enter Slider Title" />}
                />
            </FormItem>
            <FormItem
                label="Subtitle (Optional)"
                invalid={!!formMethods.formState.errors.subtitle}
                errorMessage={formMethods.formState.errors.subtitle?.message}
            >
                <Controller
                    name="subtitle"
                    control={formMethods.control}
                    render={({ field }) => <Input {...field} placeholder="Enter Subtitle" />}
                />
            </FormItem>
            <FormItem
                label="Button Text (Optional)"
                invalid={!!formMethods.formState.errors.buttonText}
                errorMessage={formMethods.formState.errors.buttonText?.message}
            >
                <Controller
                    name="buttonText"
                    control={formMethods.control}
                    render={({ field }) => <Input {...field} placeholder="e.g., Shop Now, Learn More" />}
                />
            </FormItem>
            <FormItem
                label="Web Icon URL (1920x1080, Optional)"
                invalid={!!formMethods.formState.errors.webIconUrl}
                errorMessage={formMethods.formState.errors.webIconUrl?.message}
            >
                <Controller
                    name="webIconUrl"
                    control={formMethods.control}
                    render={({ field }) => <Input {...field} type="url" placeholder="https://example.com/web-icon.jpg" />}
                />
            </FormItem>
            <FormItem
                label="Mobile Icon URL (500x300, Optional)"
                invalid={!!formMethods.formState.errors.mobileIconUrl}
                errorMessage={formMethods.formState.errors.mobileIconUrl?.message}
            >
                <Controller
                    name="mobileIconUrl"
                    control={formMethods.control}
                    render={({ field }) => <Input {...field} type="url" placeholder="https://example.com/mobile-icon.jpg" />}
                />
            </FormItem>
             <FormItem
                label="Slider Color (Optional)"
                invalid={!!formMethods.formState.errors.sliderColor}
                errorMessage={formMethods.formState.errors.sliderColor?.message}
            >
                <div className="flex items-center gap-2">
                     <Controller
                        name="sliderColor"
                        control={formMethods.control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="color"
                                className="w-12 h-10 p-1" // Basic styling for color input
                            />
                        )}
                    />
                    <Controller
                        name="sliderColor"
                        control={formMethods.control}
                        render={({ field }) => (
                             <Input
                                {...field}
                                type="text"
                                placeholder="#RRGGBB or color name"
                                className="flex-grow"
                            />
                        )}
                    />
                </div>
            </FormItem>
            <FormItem
                label="Display Page"
                invalid={!!formMethods.formState.errors.displayPage}
                errorMessage={formMethods.formState.errors.displayPage?.message}
            >
                <Controller
                    name="displayPage"
                    control={formMethods.control}
                    render={({ field }) => (
                        <Select
                            placeholder="Select display page"
                            options={displayPageOptionsConst}
                            value={displayPageOptionsConst.find(opt => opt.value === field.value)}
                            onChange={(option) => field.onChange(option?.value)}
                        />
                    )}
                />
            </FormItem>
            <FormItem
                label="Link (Optional)"
                invalid={!!formMethods.formState.errors.link}
                errorMessage={formMethods.formState.errors.link?.message}
            >
                <Controller
                    name="link"
                    control={formMethods.control}
                    render={({ field }) => <Input {...field} type="url" placeholder="https://example.com/target-page" />}
                />
            </FormItem>
            <FormItem
                label="Status"
                invalid={!!formMethods.formState.errors.status}
                errorMessage={formMethods.formState.errors.status?.message}
            >
                <Controller
                    name="status"
                    control={formMethods.control}
                    render={({ field }) => (
                        <Select
                            placeholder="Select status"
                            options={sliderStatusOptions}
                            value={sliderStatusOptions.find(opt => opt.value === field.value)}
                            onChange={(option) => field.onChange(option?.value)}
                        />
                    )}
                />
            </FormItem>
        </>
    )


    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h3 className="mb-2 sm:mb-0">Manage Sliders</h3>
                        <Button
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={openAddDrawer}
                        >
                            Add New Slider
                        </Button>
                    </div>

                    <SlidersTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleExportData}
                    />

                    <div className="mt-4">
                        <SlidersTable
                            columns={columns}
                            data={pageData}
                            loading={masterLoadingStatus === 'loading' || isSubmitting || isDeleting}
                            pagingData={{
                                total: total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            selectedItems={selectedItems}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            onRowSelect={handleRowSelect}
                            onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <SlidersSelectedFooter
                selectedItems={selectedItems}
                onDeleteSelected={handleDeleteSelected}
            />

            {/* Add Slider Drawer */}
            <Drawer
                title="Add New Slider"
                isOpen={isAddDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                width={600} // Adjust width as needed
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting} type="button">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            form="addSliderForm"
                            type="submit"
                            loading={isSubmitting}
                            disabled={!addFormMethods.formState.isValid || isSubmitting}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Slider'}
                        </Button>
                    </div>
                }
            >
                <Form
                    id="addSliderForm"
                    onSubmit={addFormMethods.handleSubmit(onAddSliderSubmit)}
                    className="flex flex-col gap-4"
                >
                    {renderFormFields(addFormMethods)}
                </Form>
            </Drawer>

            {/* Edit Slider Drawer */}
            <Drawer
                title="Edit Slider"
                isOpen={isEditDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                width={600} // Adjust width
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting} type="button">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            form="editSliderForm"
                            type="submit"
                            loading={isSubmitting}
                            disabled={!editFormMethods.formState.isValid || isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                }
            >
                <Form
                    id="editSliderForm"
                    onSubmit={editFormMethods.handleSubmit(onEditSliderSubmit)}
                    className="flex flex-col gap-4"
                >
                    {renderFormFields(editFormMethods)}
                </Form>
            </Drawer>

            {/* Filter Drawer */}
            <Drawer
                title="Filter Sliders"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="flex justify-between w-full">
                        <Button size="sm" onClick={onClearFilters} type="button">
                            Clear All
                        </Button>
                        <div>
                            <Button size="sm" className="mr-2" onClick={closeFilterDrawer} type="button">
                                Cancel
                            </Button>
                            <Button size="sm" variant="solid" form="filterSliderForm" type="submit">
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                }
            >
                <Form
                    id="filterSliderForm"
                    onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormItem label="Filter by Status">
                        <Controller
                            name="filterStatus"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select status(es)..."
                                    options={sliderStatusOptions}
                                    value={field.value || []}
                                    onChange={(selectedVal) => field.onChange(selectedVal || [])}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Filter by Display Page">
                        <Controller
                            name="filterDisplayPage"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select display page(s)..."
                                    options={displayPageOptionsConst}
                                    value={field.value || []}
                                    onChange={(selectedVal) => field.onChange(selectedVal || [])}
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>

            {/* Single Delete Confirmation */}
            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen}
                type="danger"
                title="Delete Slider"
                onClose={() => { setSingleDeleteConfirmOpen(false); setSliderToDelete(null); }}
                onRequestClose={() => { setSingleDeleteConfirmOpen(false); setSliderToDelete(null); }}
                onCancel={() => { setSingleDeleteConfirmOpen(false); setSliderToDelete(null); }}
                confirmButtonColor="red-600"
                onConfirm={onConfirmSingleDelete}
                loading={isDeleting}
            >
                <p>
                    Are you sure you want to delete the slider "
                    <strong>{sliderToDelete?.title}</strong>"? This action cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default Sliders

// Helper (keep if not globally available)
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}