import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form' // No longer needed for filter form
// import { zodResolver } from '@hookform/resolvers/zod' // No longer needed
import { z } from 'zod' // No longer needed
// import type { ZodType } from 'zod' // No longer needed
import Avatar from '@/components/ui/Avatar' // For Icon column

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
// import Dialog from '@/components/ui/Dialog' // No longer needed for filter dialog
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { Card, Drawer, Tag, Form, FormItem, Input, } from '@/components/ui'
import { TbPhoto, TbFileText } from 'react-icons/tb' // Placeholder icons

// import Checkbox from '@/components/ui/Checkbox' // No longer needed for filter form
// import Input from '@/components/ui/Input' // No longer needed for filter form
// import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // No longer needed for filter form

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter, // Filter icon removed
    TbCloudUpload,
    TbPlus,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import {
    getContinentsAction,
    getCountriesAction,
    getDocumentTypeAction,
    getPaymentTermAction,
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// --- Define Item Type (Table Row Data) ---
export type BlogItem = {
    id: string
    status: 'published' | 'draft' | 'archived'
    title: string
    icon: string | null // URL for icon/featured image
    createdDate: Date // Added for sorting/display
}
// --- End Item Type Definition ---

// --- Define Filter Schema ---
const filterValidationSchema = z.object({
    status: z.array(z.string()).default([]), // Filter by status (multi-select)
})

type FilterFormSchema = z.infer<typeof filterValidationSchema>
// --- End Filter Schema ---

// --- Constants ---
const blogStatusColor: Record<BlogItem['status'], string> = {
    published: 'text-green-600 bg-green-200 rounded-lg py-1 px-2',
    draft: 'text-blue-600 bg-blue-200 rounded-lg py-1 px-2',
    archived: 'text-red-600 bg-red-200 rounded-lg py-1 px-2',
}

// Filter specific constant
const statusList: BlogItem['status'][] = ['published', 'draft', 'archived']
// --- End Constants ---

const initialDummyBlogs: BlogItem[] = [
    {
        id: 'BLOG001',
        status: 'published',
        title: 'Getting Started with Our Platform',
        icon: '/img/blogs/getting_started.jpg',
        createdDate: new Date(2023, 10, 1, 10, 0),
    },
    {
        id: 'BLOG002',
        status: 'draft',
        title: 'Advanced Features Deep Dive',
        icon: null,
        createdDate: new Date(2023, 10, 3, 14, 30),
    },
    {
        id: 'BLOG003',
        status: 'published',
        title: 'Top 5 Security Tips for 2023',
        icon: '/img/blogs/security.png',
        createdDate: new Date(2023, 9, 28, 9, 15),
    },
    {
        id: 'BLOG004',
        status: 'archived',
        title: 'Old Announcement: Summer Sale',
        icon: null,
        createdDate: new Date(2023, 6, 15, 11, 0),
    },
    {
        id: 'BLOG005',
        status: 'published',
        title: 'Understanding Our New API',
        icon: '/img/blogs/api.svg',
        createdDate: new Date(2023, 9, 20, 16, 45),
    },
    {
        id: 'BLOG006',
        status: 'draft',
        title: 'Case Study: Company X Success',
        icon: null,
        createdDate: new Date(2023, 10, 4, 9, 0),
    },
    {
        id: 'BLOG007',
        status: 'published',
        title: 'How to Integrate with Zapier',
        icon: '/img/blogs/zapier.png',
        createdDate: new Date(2023, 9, 10, 13, 25),
    },
    {
        id: 'BLOG008',
        status: 'archived',
        title: 'Welcome Blog Post (2022)',
        icon: null,
        createdDate: new Date(2022, 0, 15, 10, 0),
    },
    {
        id: 'BLOG009',
        status: 'published',
        title: 'Mobile App Update v2.1 Released',
        icon: '/img/blogs/mobile_app.jpg',
        createdDate: new Date(2023, 10, 2, 11, 5),
    },
    {
        id: 'BLOG010',
        status: 'draft',
        title: 'Year-End Review Planning',
        icon: null,
        createdDate: new Date(2023, 10, 5, 10, 30),
    },
]

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone,
    onChangeStatus,
    onDelete,
}: {
    onEdit: () => void
    onClone?: () => void
    onChangeStatus: () => void
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
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
// --- End ActionColumn ---

// --- ExportMappingSearch Component ---
type ExportMappingSearchProps = {
    // Renamed component
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const ExportMappingSearch = React.forwardRef<
    HTMLInputElement,
    ExportMappingSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Quick Search..." // Updated placeholder
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
ExportMappingSearch.displayName = 'ExportMappingSearch'
// --- End ExportMappingSearch ---

// --- ExportMappingTableTools Component ---
const ExportMappingTableTools = ({
    // Renamed component
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {

    type ExportMappingFilterSchema = {
        userRole : String,
        exportFrom : String,
        exportDate : Date
    }

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
    const closeFilterDrawer = ()=> setIsFilterDrawerOpen(false)
    const openFilterDrawer = ()=> setIsFilterDrawerOpen(true)

    const {control, handleSubmit} = useForm<ExportMappingFilterSchema>()

    const exportFiltersSubmitHandler = (data : ExportMappingFilterSchema) => {
        console.log("filter data", data)
    }

    return (
        <div className="flex items-center w-full gap-2">
            <div className="flex-grow">
                <ExportMappingSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter component removed */}
            <Button icon={<TbFilter />} className='' onClick={openFilterDrawer}>
                Filter
            </Button>
            <Button icon={<TbCloudUpload/>}>Export</Button>
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeFilterDrawer}>
                            Cancel
                        </Button>
                    </div>  
                }
            >
                <Form size='sm' onSubmit={handleSubmit(exportFiltersSubmitHandler)} containerClassName='flex flex-col'>
                    <FormItem label='Document Name'>
                        {/* <Controller
                            control={control}
                            name='userRole'
                            render={({field})=>(
                                <Input
                                    type="text"
                                    placeholder="Enter Document Name"
                                    {...field}
                                />
                            )}
                        /> */}
                    </FormItem>
                </Form>
            </Drawer>
        </div>
    )
}
// --- End ExportMappingTableTools ---

// --- FormListTable Component (No changes) ---
const FormListTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedForms,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<BlogItem>[]
    data: BlogItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedForms: BlogItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: BlogItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<BlogItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedForms.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}

// --- FormListSearch Component (No changes) ---
type FormListSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const FormListSearch = React.forwardRef<HTMLInputElement, FormListSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                className="w-full "
                placeholder="Quick search..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
FormListSearch.displayName = 'FormListSearch'

// FormListTableFilter component removed

// --- FormListTableTools Component (Simplified) ---
const FormListTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <FormListSearch onInputChange={onSearchChange} />
            {/* Filter button/component removed */}
        </div>
    )
}
// --- End FormListTableTools ---

// --- FormListActionTools Component (No functional changes needed for filter removal) ---
const FormListActionTools = ({
    allFormsData,
    openAddDrawer,
}: {
    allFormsData: BlogItem[];
    openAddDrawer: () => void; // Accept function as a prop
}) => {
    const navigate = useNavigate()
    const csvHeaders = [

    ]

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/*
            <CSVLink
                className="w-full"
                filename="documentTypeList.csv"
                data={allFormsData}
                headers={csvHeaders}
            >
                <Button icon={<TbCloudDownload />} className="w-full" block>
                    Download
                </Button>
            </CSVLink>
            */}
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={openAddDrawer}
                block
            >
                Add New
            </Button>
        </div>
    )
}

// --- FormListSelected Component (No functional changes needed for filter removal) ---
const FormListSelected = ({
    selectedForms,
    setSelectedForms,
    onDeleteSelected,
}: {
    selectedForms: BlogItem[]
    setSelectedForms: React.Dispatch<React.SetStateAction<BlogItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedForms.length === 0) return null

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
                                {selectedForms.length}
                            </span>
                            <span>
                                Item{selectedForms.length > 1 ? 's' : ''}{' '}
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
                            Delete
                        </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedForms.length} Item${selectedForms.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected item
                    {selectedForms.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

// --- Main Continents Component ---
const Blogs = () => {
    const [blogs, setBlogs] = useState<BlogItem[]>(initialDummyBlogs)
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<BlogItem | null>(null);

    const openEditDrawer = (item: BlogItem) => {
        setSelectedItem(item); // Set the selected item's data
        setIsEditDrawerOpen(true); // Open the edit drawer
    };

    const closeEditDrawer = () => {
        setSelectedItem(null); // Clear the selected item's data
        setIsEditDrawerOpen(false); // Close the edit drawer
    };

    const openAddDrawer = () => {
        setSelectedItem(null); // Clear any selected item
        setIsAddDrawerOpen(true); // Open the add drawer
    };

    const closeAddDrawer = () => {
        setIsAddDrawerOpen(false); // Close the add drawer
    };

    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(getCountriesAction())
    }, [dispatch])

    const { BlogsData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)
 // Use the provided dummy data

// --- Initial Dummy Data ---
const initialDummyForms: BlogItem[] = [
    {
        id: 'BLOG001',
        status: 'published',
        title: 'Getting Started with Our Platform',
        icon: '/img/blogs/getting_started.jpg',
        createdDate: new Date(2023, 10, 1, 10, 0),
    },
    {
        id: 'BLOG002',
        status: 'draft',
        title: 'Advanced Features Deep Dive',
        icon: null,
        createdDate: new Date(2023, 10, 3, 14, 30),
    },
    {
        id: 'BLOG003',
        status: 'published',
        title: 'Top 5 Security Tips for 2023',
        icon: '/img/blogs/security.png',
        createdDate: new Date(2023, 9, 28, 9, 15),
    },
    {
        id: 'BLOG004',
        status: 'archived',
        title: 'Old Announcement: Summer Sale',
        icon: null,
        createdDate: new Date(2023, 6, 15, 11, 0),
    },
    {
        id: 'BLOG005',
        status: 'published',
        title: 'Understanding Our New API',
        icon: '/img/blogs/api.svg',
        createdDate: new Date(2023, 9, 20, 16, 45),
    },
    {
        id: 'BLOG006',
        status: 'draft',
        title: 'Case Study: Company X Success',
        icon: null,
        createdDate: new Date(2023, 10, 4, 9, 0),
    },
    {
        id: 'BLOG007',
        status: 'published',
        title: 'How to Integrate with Zapier',
        icon: '/img/blogs/zapier.png',
        createdDate: new Date(2023, 9, 10, 13, 25),
    },
    {
        id: 'BLOG008',
        status: 'archived',
        title: 'Welcome Blog Post (2022)',
        icon: null,
        createdDate: new Date(2022, 0, 15, 10, 0),
    },
    {
        id: 'BLOG009',
        status: 'published',
        title: 'Mobile App Update v2.1 Released',
        icon: '/img/blogs/mobile_app.jpg',
        createdDate: new Date(2023, 10, 2, 11, 5),
    },
    {
        id: 'BLOG010',
        status: 'draft',
        title: 'Year-End Review Planning',
        icon: null,
        createdDate: new Date(2023, 10, 5, 10, 30),
    },
]
// --- End Dummy Data ---

const [forms, setForms] = useState<BlogItem[]>(initialDummyForms); // Initialize with dummy data
const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: '', key: '' },
    query: '',
});
const [selectedForms, setSelectedForms] = useState<BlogItem[]>([]);
    const [localIsLoading, setLocalIsLoading] = useState(false)
    // filterData state and handleApplyFilter removed

    console.log('Raw CountriesData from Redux:', BlogsData)

    const { pageData, total, processedDataForCsv } = useMemo(() => {
        console.log(
            '[Memo] Recalculating. Query:',
            tableData.query,
            'Sort:',
            tableData.sort,
            'Page:',
            tableData.pageIndex,
            // 'Filters:' removed from log
            'Input Data (CountriesData) Length:',
            BlogsData?.length ?? 0,
        )

        const sourceData: BlogItem[] = Array.isArray(BlogsData)
            ? BlogsData
            : []
        let processedData: BlogItem[] = cloneDeep(sourceData)

        // Product and Channel filtering logic removed

        // 1. Apply Search Query (on id and name)
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            console.log('[Memo] Applying search query:', query)
            processedData = processedData.filter((item: BlogItem) => {
                const itemNameLower = item.title?.trim().toLowerCase() ?? ''
                const continentNameLower = item.title?.trim().toLowerCase() ?? ''
                const itemIdString = String(item.id ?? '').trim()
                const itemIdLower = itemIdString.toLowerCase()
                return (
                    itemNameLower.includes(query) ||
                    itemIdLower.includes(query) ||
                    continentNameLower.includes(query)
                )
            })
            console.log(
                '[Memo] After search query filter. Count:',
                processedData.length,
            )
        }

        // 2. Apply Sorting (on id and name)
        const { order, key } = tableData.sort as OnSortParam
        if (
            order &&
            key &&
            (key === 'id' || key === 'name') &&
            processedData.length > 0
        ) {
            console.log('[Memo] Applying sort. Key:', key, 'Order:', order)
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                // Ensure values are strings for localeCompare, default to empty string if not
                const aValue = String(a[key as keyof BlogItem] ?? '')
                const bValue = String(b[key as keyof BlogItem] ?? '')

                return order === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            })
            processedData = sortedData
        }

        const dataBeforePagination = [...processedData] // For CSV export

        // 3. Apply Pagination
        const currentTotal = processedData.length
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        console.log(
            '[Memo] Returning. PageData Length:',
            dataForPage.length,
            'Total Items (after all filters/sort):',
            currentTotal,
        )
        return {
            pageData: dataForPage,
            total: currentTotal,
            processedDataForCsv: dataBeforePagination,
        }
    }, [BlogsData, tableData]) // filterData removed from dependencies

    // --- Handlers ---
    // handleApplyFilter removed

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
            setSelectedForms([])
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

    const handleRowSelect = useCallback((checked: boolean, row: BlogItem) => {
        setSelectedForms((prev) => {
            if (checked)
                return prev.some((f) => f.id === row.id) ? prev : [...prev, row]
            return prev.filter((f) => f.id !== row.id)
        })
    }, [])

    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<BlogItem>[]) => {
            const currentPageRowOriginals = currentRows.map((r) => r.original)
            if (checked) {
                setSelectedForms((prevSelected) => {
                    const prevSelectedIds = new Set(
                        prevSelected.map((f) => f.id),
                    )
                    const newRowsToAdd = currentPageRowOriginals.filter(
                        (r) => !prevSelectedIds.has(r.id),
                    )
                    return [...prevSelected, ...newRowsToAdd]
                })
            } else {
                const currentPageRowIds = new Set(
                    currentPageRowOriginals.map((r) => r.id),
                )
                setSelectedForms((prevSelected) =>
                    prevSelected.filter((f) => !currentPageRowIds.has(f.id)),
                )
            }
        },
        [],
    )

    // --- Action Handlers (remain the same, need Redux integration for persistence) ---
    const handleEdit = useCallback(
        (form: BlogItem) => {
            console.log('Edit item (requires navigation/modal):', form.id)
            toast.push(
                <Notification title="Edit Action" type="info">
                    Edit action for "{form.title}" (ID: {form.id}). Implement
                    navigation or modal.
                </Notification>,
            )
        },
        [navigate],
    )

    const handleDelete = useCallback((formToDelete: BlogItem) => {
        console.log(
            'Delete item (needs Redux action):',
            formToDelete.id,
            formToDelete.title,
        )
        setSelectedForms((prevSelected) =>
            prevSelected.filter((form) => form.id !== formToDelete.id),
        )
        toast.push(
            <Notification title="Delete Action" type="warning">
                Delete action for "{formToDelete.title}" (ID: {formToDelete.id}).
                Implement Redux deletion.
            </Notification>,
        )
    }, [])

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected items (needs Redux action):',
            selectedForms.map((f) => f.id),
        )
        setSelectedForms([])
        toast.push(
            <Notification title="Selected Items Delete Action" type="warning">
                {selectedForms.length} item(s) delete action. Implement Redux
                deletion.
            </Notification>,
        )
    }, [selectedForms])
    // --- End Action Handlers ---

    const handleChangeStatus = useCallback(
        (blog: BlogItem) => {
            const statuses: BlogItem['status'][] = [
                'draft',
                'published',
                'archived',
            ]
            const currentStatusIndex = statuses.indexOf(blog.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
            console.log(
                `Changing status of blog ${blog.id} from ${blog.status} to ${newStatus}`,
            )
            setBlogs((currentBlogs) =>
                currentBlogs.map((b) =>
                    b.id === blog.id ? { ...b, status: newStatus } : b,
                ),
            )
            toast.push(
                <Notification
                    title="Status Changed"
                    type="success"
                    duration={2000}
                >{`Blog '${blog.title}' status changed to ${newStatus}.`}</Notification>,
            )
        },
        [setBlogs],
    )

    const columns: ColumnDef<BlogItem>[] = useMemo(
        () => [
            {
                header: 'Icon',
                accessorKey: 'icon',
                enableSorting: false,
                size: 100,
                meta: {HeaderClass :'text-center'},
                cell: (props) => {
                    const { icon, title } = props.row.original
                    return (
                        <span className='text-center block'>
                        <Avatar
                            size={40}
                            shape="circle"
                            // src={icon}
                            icon={<TbFileText />}
                        >
                            {!icon ? title.charAt(0).toUpperCase() : ''}
                        </Avatar>
                        </span>
                    )
                },
            },
            {
                header: 'ID',
                accessorKey: 'id',
                size: 100,
                enableSorting: true,
                meta: {HeaderClass :'text-left'},
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                size: 100,
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <span>
                        <Tag
                            className={`${blogStatusColor[status]} capitalize`}
                        >
                            {status}
                        </Tag>
                        </span>
                    )
                },
            },
            { header: 'Title', accessorKey: 'title', enableSorting: true },
            {
                header: 'Created Date',
                accessorKey: 'createdDate',
                enableSorting: true,
                cell: (props) => {
                    const date = props.row.original.createdDate
                    return (
                        <span>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    )
                },
            },
            {
                header: 'Action',
                id: 'action',
                meta: { HeaderClass : "text-center" },
                cell: (props) => (
                    <ActionColumn
                        // onClone={() => handleClone(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onEdit={() => openEditDrawer(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleEdit, handleDelete],
    )

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Blogs</h5>
                        <FormListActionTools
                            allFormsData={forms}
                            openAddDrawer={openAddDrawer} // Pass the function as a prop
                        />
                    </div>

                    <div className="mb-4">
                        <ExportMappingTableTools
                            onSearchChange={(query) =>
                                setTableData((prev) => ({ ...prev, query }))
                            }
                        />
                    </div>

                    <FormListTable
                        columns={columns}
                        data={forms}
                        loading={false}
                        pagingData={{
                            total: forms.length,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedForms={selectedForms}
                        onPaginationChange={(page) =>
                            setTableData((prev) => ({ ...prev, pageIndex: page }))
                        }
                        onSelectChange={(value) =>
                            setTableData((prev) => ({
                                ...prev,
                                pageSize: Number(value),
                                pageIndex: 1,
                            }))
                        }
                        onSort={(sort) =>
                            setTableData((prev) => ({ ...prev, sort }))
                        }
                        onRowSelect={(checked, row) =>
                            setSelectedForms((prev) =>
                                checked
                                    ? [...prev, row]
                                    : prev.filter((form) => form.id !== row.id)
                            )
                        }
                        onAllRowSelect={(checked, rows) => {
                            const rowIds = rows.map((row) => row.original.id);
                            setSelectedForms((prev) =>
                                checked
                                    ? [...prev, ...rows.map((row) => row.original)]
                                    : prev.filter((form) => !rowIds.includes(form.id))
                            );
                        }}
                    />
                </AdaptiveCard>

                <FormListSelected
                    selectedForms={selectedForms}
                    setSelectedForms={setSelectedForms}
                    onDeleteSelected={() =>
                        setForms((prev) =>
                            prev.filter(
                                (form) =>
                                    !selectedForms.some(
                                        (selected) => selected.id === form.id
                                    )
                            )
                        )
                    }
                />
            </Container>

            {/* Edit Drawer */}
            <Drawer
                title="Edit Blog"
                isOpen={isEditDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={() => {
                                console.log('Updated Blog:', selectedItem);
                                closeEditDrawer();
                            }}
                        >
                            Save
                        </Button>
                    </div>
                }
            >
                <Form>
                    <FormItem label="Title">
                        <Input
                            value={selectedItem?.title || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'draft', title: '', icon: null, createdDate: new Date() }),
                                    title: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Icon URL">
                        <Input
                            value={selectedItem?.icon || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'draft', title: '', icon: null, createdDate: new Date() }),
                                    icon: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Status">
                        <select
                            value={selectedItem?.status || 'draft'}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'draft', title: '', icon: null, createdDate: new Date() }),
                                    status: e.target.value as 'published' | 'draft' | 'archived',
                                }))
                            }
                        >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                    </FormItem>
                    <FormItem label="Created Date">
                        <Input
                            type="date"
                            value={selectedItem?.createdDate?.toISOString().split('T')[0] || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'draft', title: '', icon: null, createdDate: new Date() }),
                                    createdDate: new Date(e.target.value),
                                }))
                            }
                        />
                    </FormItem>
                </Form>
            </Drawer>


            <Drawer
                title="Add New Blog"
                isOpen={isAddDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={() => console.log('Blog Added')}
                        >
                            Add
                        </Button>
                    </div>
                }
            >
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        const newItem: BlogItem = {
                            id: `${blogs.length + 1}`,
                            title: formData.get('title') as string,
                            icon: formData.get('icon') as string | null,
                            status: formData.get('status') as 'published' | 'draft' | 'archived',
                            createdDate: new Date(formData.get('createdDate') as string),
                        };
                        console.log('New Blog:', newItem);
                        // handleAdd(newItem);
                    }}
                >
                    <FormItem label="Title">
                        <Input name="title" placeholder="Enter Blog Title" />
                    </FormItem>
                    <FormItem label="Icon URL">
                        <Input name="icon" placeholder="Enter Icon URL" />
                    </FormItem>
                    <FormItem label="Status">
                        <select name="status" defaultValue="draft">
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                    </FormItem>
                    <FormItem label="Created Date">
                        <Input name="createdDate" type="date" />
                    </FormItem>
                </Form>
            </Drawer>
        </>
    )
}

export default Blogs

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
