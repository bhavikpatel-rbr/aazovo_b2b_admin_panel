// src/views/your-path/Blogs.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames' // Ensure classnames is installed or helper is defined
import { useForm, Controller } from 'react-hook-form' // For filter form
import { zodResolver } from '@hookform/resolvers/zod' // For filter form
import { z } from 'zod' // For filter form
import type { ZodType } from 'zod' // For filter form

// UI Components (Ensure these paths are correct for your project)
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar' // For Icon column
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast' // Ensure toast setup exists
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Checkbox from '@/components/ui/Checkbox' // For filter form
// import Input from '@/components/ui/Input'; // Not needed for status filter
import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // For filter form
import { TbPhoto, TbFileText } from 'react-icons/tb' // Placeholder icons

// Icons
import {
    TbPencil,
    TbCopy, // Optional: Clone action
    TbSwitchHorizontal, // For status change
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbPlus,
    TbFilter, // Filter Icon
} from 'react-icons/tb' // Ensure react-icons is installed

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common' // Ensure this type path is correct

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
    published: '!text-green-600 !bg-green-200 rounded-lg py-1 px-2',
    draft: '!text-blue-600 !bg-blue-200 rounded-lg py-1 px-2',
    archived: '!text-red-600 !bg-red-200 rounded-lg py-1 px-2',
}

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

// Filter specific constant
const statusList: BlogItem['status'][] = ['published', 'draft', 'archived']
// --- End Constants ---

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
        'text-lg rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-start gap-2">
            {onClone && (
                <Tooltip title="Clone Blog">
                    <div
                        className={classNames(
                            iconButtonClass,
                            hoverBgClass,
                            'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                        )}
                        role="button"
                        onClick={onClone}
                    >
                        <TbCopy />
                    </div>
                </Tooltip>
            )}
            <Tooltip title="Change Status">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400',
                    )}
                    role="button"
                    onClick={onChangeStatus}
                >
                    <TbSwitchHorizontal />
                </div>
            </Tooltip>
            <Tooltip title="Edit Blog">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete Blog">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400',
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

// --- BlogTable Component ---
const BlogTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedBlogs,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    /* ... props ... */
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedBlogs.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
            noData={!loading && data.length === 0}
        />
    )
}
// Type definition for BlogTable props
type BlogTableProps = {
    columns: ColumnDef<BlogItem>[]
    data: BlogItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedBlogs: BlogItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: BlogItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<BlogItem>[]) => void
}
// --- End BlogTable ---

// --- BlogSearch Component ---
type BlogSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const BlogSearch = React.forwardRef<HTMLInputElement, BlogSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Quick search..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
BlogSearch.displayName = 'BlogSearch'
// --- End BlogSearch ---

// --- BlogFilter Component ---
const BlogFilter = ({
    filterData,
    setFilterData,
}: {
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
}) => {
    const [dialogIsOpen, setIsOpen] = useState(false)
    const openDialog = () => setIsOpen(true)
    const onDialogClose = () => setIsOpen(false)

    const { control, handleSubmit, reset } = useForm<FilterFormSchema>({
        defaultValues: filterData,
        resolver: zodResolver(filterValidationSchema),
    })

    React.useEffect(() => {
        reset(filterData)
    }, [filterData, reset])

    const onSubmit = (values: FilterFormSchema) => {
        setFilterData(values)
        onDialogClose()
    }
    const handleReset = () => {
        const defaultVals = filterValidationSchema.parse({})
        reset(defaultVals) /* setFilterData(defaultVals); */
    }

    return (
        <>
            <Button icon={<TbFilter />} onClick={openDialog}>
                {' '}
                Filter{' '}
            </Button>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h4 className="mb-4">Filter Blogs</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <UiFormItem label="Status">
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    value={field.value || []}
                                    onChange={field.onChange}
                                >
                                    {statusList.map((stat) => (
                                        <Checkbox
                                            key={stat}
                                            value={stat}
                                            className="mb-1 capitalize"
                                        >
                                            {stat}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </UiFormItem>
                    <div className="flex justify-end items-center gap-2 mt-6">
                        <Button type="button" onClick={handleReset}>
                            {' '}
                            Reset{' '}
                        </Button>
                        <Button type="submit" variant="solid">
                            {' '}
                            Apply{' '}
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    )
}
// --- End BlogFilter ---

// --- BlogTableTools Component ---
const BlogTableTools = ({
    onSearchChange,
    filterData,
    setFilterData,
}: {
    onSearchChange: (query: string) => void
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <div className="flex-grow">
                <BlogSearch onInputChange={onSearchChange} />
            </div>
            <div>
                <BlogFilter
                    filterData={filterData}
                    setFilterData={setFilterData}
                />
            </div>
        </div>
    )
}
// --- End BlogTableTools ---

// --- BlogActionTools Component ---
const BlogActionTools = ({ allBlogs }: { allBlogs: BlogItem[] }) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allBlogs.map((b) => ({
                id: b.id,
                title: b.title,
                status: b.status,
                createdDate: b.createdDate.toISOString(),
                iconUrl: b.icon ?? 'N/A',
            })),
        [allBlogs],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Title', key: 'title' },
        { label: 'Status', key: 'status' },
        { label: 'Created Date', key: 'createdDate' },
        { label: 'Icon URL', key: 'iconUrl' },
    ]
    const handleAdd = () => navigate('/blogs/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink filename="blogs.csv" data={csvData} headers={csvHeaders}><Button icon={<TbCloudDownload />} block>Download</Button></CSVLink> */}
            <Button
                variant="solid"
                icon={<TbFileText />}
                onClick={handleAdd}
                block
            >
                {' '}
                Add New{' '}
            </Button>
        </div>
    )
}
// --- End BlogActionTools ---

// --- BlogSelected Component ---
const BlogSelected = ({
    selectedBlogs,
    setSelectedBlogs,
    onDeleteSelected,
}: {
    selectedBlogs: BlogItem[]
    setSelectedBlogs: React.Dispatch<React.SetStateAction<BlogItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedBlogs.length === 0) return null

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
                                {selectedBlogs.length}
                            </span>
                            <span>
                                Blog{selectedBlogs.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedBlogs.length} Blog${selectedBlogs.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected blog post
                    {selectedBlogs.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End BlogSelected ---

// --- Main Blogs Component ---
const Blogs = () => {
    const navigate = useNavigate()

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false)
    const [blogs, setBlogs] = useState<BlogItem[]>(initialDummyBlogs)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedBlogs, setSelectedBlogs] = useState<BlogItem[]>([])
    const [filterData, setFilterData] = useState<FilterFormSchema>(
        filterValidationSchema.parse({}),
    )
    // --- End Lifted State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...blogs]

        // Apply Filtering by Status
        if (filterData.status && filterData.status.length > 0) {
            const statusSet = new Set(filterData.status)
            processedData = processedData.filter((blog) =>
                statusSet.has(blog.status),
            )
        }

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (blog) =>
                    blog.id.toLowerCase().includes(query) ||
                    blog.title.toLowerCase().includes(query) ||
                    blog.status.toLowerCase().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'createdDate') {
                    const timeA = a.createdDate.getTime()
                    const timeB = b.createdDate.getTime()
                    return order === 'asc' ? timeA - timeB : timeB - timeA
                }
                const aValue = a[key as keyof BlogItem] ?? ''
                const bValue = b[key as keyof BlogItem] ?? ''
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                return 0
            })
            processedData = sortedData
        }

        // Apply Pagination
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const dataTotal = processedData.length
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return { pageData: dataForPage, total: dataTotal }
    }, [blogs, tableData, filterData]) // Added filterData dependency
    // --- End Memoized Data Processing ---

    // --- Lifted Handlers ---
    const handleSetTableData = useCallback((data: TableQueries) => {
        setTableData(data)
    }, [])
    const handlePaginationChange = useCallback(
        (page: number) => {
            handleSetTableData({ ...tableData, pageIndex: page })
        },
        [tableData, handleSetTableData],
    )
    const handleSelectChange = useCallback(
        (value: number) => {
            handleSetTableData({
                ...tableData,
                pageSize: Number(value),
                pageIndex: 1,
            })
            setSelectedBlogs([])
        },
        [tableData, handleSetTableData],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => {
            handleSetTableData({ ...tableData, sort: sort, pageIndex: 1 })
        },
        [tableData, handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => {
            handleSetTableData({ ...tableData, query: query, pageIndex: 1 })
        },
        [tableData, handleSetTableData],
    )
    const handleApplyFilter = useCallback(
        (newFilterData: FilterFormSchema) => {
            setFilterData(newFilterData)
            handleSetTableData({ ...tableData, pageIndex: 1 })
            setSelectedBlogs([])
        },
        [tableData, handleSetTableData],
    ) // Reset page on filter apply

    const handleRowSelect = useCallback(
        (checked: boolean, row: BlogItem) => {
            setSelectedBlogs((prev) => {
                if (checked) {
                    return prev.some((b) => b.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((b) => b.id !== row.id)
                }
            })
        },
        [setSelectedBlogs],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<BlogItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedBlogs((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((b) => b.id))
                    const newSelection = originalRows.filter(
                        (b) => !existingIds.has(b.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((b) => !rowIds.has(b.id))
                }
            })
        },
        [setSelectedBlogs],
    )

    const handleEdit = useCallback(
        (blog: BlogItem) => {
            console.log('Edit blog:', blog.id)
            navigate(`/blogs/edit/${blog.id}`) // Adjust route
        },
        [navigate],
    )

    const handleClone = useCallback(
        (blogToClone: BlogItem) => {
            console.log('Cloning blog:', blogToClone.id)
            const newId = `BLOG${Math.floor(Math.random() * 9000) + 1000}`
            const clonedBlog: BlogItem = {
                ...blogToClone,
                id: newId,
                title: `${blogToClone.title} (Clone)`,
                status: 'draft',
                createdDate: new Date(),
            }
            setBlogs((prev) => [clonedBlog, ...prev])
            toast.push(
                <Notification
                    title="Blog Cloned"
                    type="success"
                    duration={2000}
                />,
            )
        },
        [setBlogs],
    )

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

    const handleDelete = useCallback(
        (blogToDelete: BlogItem) => {
            console.log('Deleting blog:', blogToDelete.id)
            setBlogs((currentBlogs) =>
                currentBlogs.filter((blog) => blog.id !== blogToDelete.id),
            )
            setSelectedBlogs((prevSelected) =>
                prevSelected.filter((blog) => blog.id !== blogToDelete.id),
            )
            toast.push(
                <Notification
                    title="Blog Deleted"
                    type="success"
                    duration={2000}
                >{`Blog '${blogToDelete.title}' deleted.`}</Notification>,
            )
        },
        [setBlogs, setSelectedBlogs],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected blogs:',
            selectedBlogs.map((b) => b.id),
        )
        const selectedIds = new Set(selectedBlogs.map((b) => b.id))
        setBlogs((currentBlogs) =>
            currentBlogs.filter((b) => !selectedIds.has(b.id)),
        )
        setSelectedBlogs([])
        toast.push(
            <Notification
                title="Blogs Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} blog post(s) deleted.`}</Notification>,
        )
    }, [selectedBlogs, setBlogs, setSelectedBlogs])
    // --- End Lifted Handlers ---

    // --- Define Columns in Parent ---
    const columns: ColumnDef<BlogItem>[] = useMemo(
        () => [
            {
                header: 'Icon',
                accessorKey: 'icon',
                enableSorting: false,
                meta: {HeaderClass :'text-center'},
                cell: (props) => {
                    const { icon, title } = props.row.original
                    return (
                        <span className='text-center block'>
                        <Avatar
                            size={40}
                            shape="circle"
                            src={icon}
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
                enableSorting: true,
                meta: {HeaderClass :'text-left'},
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                meta: {HeaderClass :'text-center'},
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <span className='!
                        -center'>
                        <Tag
                            className={`${blogStatusColor[status]} text-white capitalize`}
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
                cell: (props) => (
                    <ActionColumn
                        // onClone={() => handleClone(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [ 
            // handleClone, 
            handleChangeStatus, handleEdit, handleDelete],
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Blogs</h5>
                    <BlogActionTools allBlogs={blogs} />
                </div>

                {/* Tools Section */}
                <div className="mb-4">
                    {/* Pass filter state and handler */}
                    <BlogTableTools
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter}
                    />
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto">
                    <BlogTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedBlogs={selectedBlogs}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Actions Footer */}
            <BlogSelected
                selectedBlogs={selectedBlogs}
                setSelectedBlogs={setSelectedBlogs}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default Blogs // Updated export name

// Helper Function (ensure defined or imported)
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
