// src/views/your-path/JobPostsListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar' // Keep if needed (e.g., dept icon)
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import {
    TbBriefcase,
    TbMapPin,
    TbUsers,
    TbFileDescription,
} from 'react-icons/tb' // Icons

// Icons
import {
    TbPencil,
    TbCopy, // Optional: Clone action
    TbSwitchHorizontal, // Status change
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbPlus,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
export type JobPostStatus = 'open' | 'closed' | 'draft' | 'on_hold'
export type JobPostItem = {
    id: string // Unique Job Post ID
    status: JobPostStatus
    jobTitle: string // Added Job Title for clarity
    department: string
    description: string // Potentially long description
    location: string // e.g., "Remote", "New York, NY", "Hybrid (London)"
    experience: string // e.g., "2+ Years", "Entry Level", "Senior (5-8 Years)"
    totalVacancy: number
    createdDate?: Date // Optional but useful
}
// --- End Item Type ---

// --- Constants ---
const jobStatusColor: Record<JobPostStatus, string> = {
    open: 'bg-emerald-500',
    closed: 'bg-red-500',
    draft: 'bg-gray-500',
    on_hold: 'bg-amber-500',
}

const initialDummyJobPosts: JobPostItem[] = [
    {
        id: 'JP001',
        status: 'open',
        jobTitle: 'Senior Frontend Engineer',
        department: 'Engineering',
        description:
            'Looking for an experienced React developer to lead our frontend team. Responsibilities include architecting new features, mentoring junior developers, and ensuring high code quality. Must have strong experience with TypeScript, Next.js, and modern testing frameworks. Familiarity with UI/UX principles is a plus.',
        location: 'Remote',
        experience: '5+ Years',
        totalVacancy: 1,
        createdDate: new Date(2023, 10, 1),
    },
    {
        id: 'JP002',
        status: 'open',
        jobTitle: 'Marketing Content Writer',
        department: 'Marketing',
        description:
            'Create compelling blog posts, website copy, and social media content to drive engagement. Requires excellent writing skills, SEO knowledge, and ability to research various topics. Portfolio required.',
        location: 'New York, NY',
        experience: '2-4 Years',
        totalVacancy: 2,
        createdDate: new Date(2023, 10, 3),
    },
    {
        id: 'JP003',
        status: 'draft',
        jobTitle: 'Product Manager - Mobile',
        department: 'Product Management',
        description:
            'Define the roadmap and strategy for our mobile applications. Work closely with design and engineering teams. Experience with agile methodologies and user research needed.',
        location: 'Hybrid (London)',
        experience: '4+ Years',
        totalVacancy: 1,
        createdDate: new Date(2023, 10, 5),
    },
    {
        id: 'JP004',
        status: 'closed',
        jobTitle: 'Junior Accountant',
        department: 'Finance',
        description:
            'Assisted with accounts payable/receivable, bank reconciliations, and month-end closing procedures. Position filled.',
        location: 'Chicago, IL',
        experience: 'Entry Level (0-2 Years)',
        totalVacancy: 1,
        createdDate: new Date(2023, 9, 15),
    },
    {
        id: 'JP005',
        status: 'on_hold',
        jobTitle: 'Customer Support Specialist',
        department: 'Customer Support',
        description:
            'Provide excellent customer service via email and chat. Troubleshoot issues and escalate complex problems. Hiring paused pending budget review.',
        location: 'Remote (US Only)',
        experience: '1+ Year',
        totalVacancy: 3,
        createdDate: new Date(2023, 9, 20),
    },
    {
        id: 'JP006',
        status: 'open',
        jobTitle: 'Data Scientist',
        department: 'Data Science & Analytics',
        description:
            'Develop machine learning models, perform statistical analysis, and create data visualizations to drive business insights. Proficiency in Python/R and SQL required. Advanced degree preferred.',
        location: 'Austin, TX',
        experience: '3+ Years',
        totalVacancy: 1,
        createdDate: new Date(2023, 10, 6),
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onChangeStatus,
    onDelete,
    onClone,
}: {
    onEdit: () => void
    onChangeStatus: () => void
    onDelete: () => void
    onClone?: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'
    return (
        <div className="flex items-center justify-end gap-2">
            {onClone && (
                <Tooltip title="Clone Job Post">
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
            <Tooltip title="Edit Job Post">
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
            <Tooltip title="Delete Job Post">
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

// --- JobPostTable Component ---
const JobPostTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedPosts,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<JobPostItem>[]
    data: JobPostItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedPosts: JobPostItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: JobPostItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<JobPostItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedPosts.some((selected) => selected.id === row.id)
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
// --- End JobPostTable ---

// --- JobPostSearch Component ---
type JobPostSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const JobPostSearch = React.forwardRef<HTMLInputElement, JobPostSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Search Job Posts (Title, Dept, Location...)"
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
JobPostSearch.displayName = 'JobPostSearch'
// --- End JobPostSearch ---

// --- JobPostTableTools Component ---
const JobPostTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <JobPostSearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
    // Filter button could be added here
}
// --- End JobPostTableTools ---

// --- JobPostActionTools Component ---
const JobPostActionTools = ({ allPosts }: { allPosts: JobPostItem[] }) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allPosts.map((p) => ({
                ...p,
                createdAt: p.createdDate?.toISOString() ?? '',
            })),
        [allPosts],
    )
    const csvHeaders = [
        /* ... headers ... */
    ]
    const handleAdd = () => navigate('/job-posts/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block>
                {' '}
                Add new Job Post{' '}
            </Button>{' '}
        </div>
    )
}
// --- End JobPostActionTools ---

// --- JobPostSelected Component ---
const JobPostSelected = ({
    selectedPosts,
    setSelectedPosts,
    onDeleteSelected,
}: {
    selectedPosts: JobPostItem[]
    setSelectedPosts: React.Dispatch<React.SetStateAction<JobPostItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedPosts.length === 0) return null

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
                                {selectedPosts.length}
                            </span>
                            <span>
                                Job Post{selectedPosts.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedPosts.length} Job Post${selectedPosts.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected job post
                    {selectedPosts.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End JobPostSelected ---

// --- Main JobPostsListing Component ---
const JobPostsListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [jobPosts, setJobPosts] =
        useState<JobPostItem[]>(initialDummyJobPosts)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedPosts, setSelectedPosts] = useState<JobPostItem[]>([])
    // Filter state could be added here
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...jobPosts]

        // Apply Filtering (if added)

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (j) =>
                    j.id.toLowerCase().includes(query) ||
                    j.status.toLowerCase().includes(query) ||
                    j.jobTitle.toLowerCase().includes(query) ||
                    j.department.toLowerCase().includes(query) ||
                    j.description.toLowerCase().includes(query) ||
                    j.location.toLowerCase().includes(query) ||
                    j.experience.toLowerCase().includes(query) ||
                    j.totalVacancy.toString().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'createdDate' && a.createdDate && b.createdDate) {
                    return order === 'asc'
                        ? a.createdDate.getTime() - b.createdDate.getTime()
                        : b.createdDate.getTime() - a.createdDate.getTime()
                }
                if (key === 'totalVacancy') {
                    return order === 'asc'
                        ? a.totalVacancy - b.totalVacancy
                        : b.totalVacancy - a.totalVacancy
                }

                const aValue = a[key as keyof JobPostItem] ?? ''
                const bValue = b[key as keyof JobPostItem] ?? ''
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
    }, [jobPosts, tableData /*, filterData */]) // Add filterData dependency if used
    // --- End Data Processing ---

    // --- Handlers ---
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
            setSelectedPosts([])
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
    // Filter handlers would go here if filter added

    const handleRowSelect = useCallback(
        (checked: boolean, row: JobPostItem) => {
            setSelectedPosts((prev) => {
                if (checked) {
                    return prev.some((p) => p.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((p) => p.id !== row.id)
                }
            })
        },
        [setSelectedPosts],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<JobPostItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedPosts((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((p) => p.id))
                    const newSelection = originalRows.filter(
                        (p) => !existingIds.has(p.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((p) => !rowIds.has(p.id))
                }
            })
        },
        [setSelectedPosts],
    )

    const handleEdit = useCallback(
        (post: JobPostItem) => {
            console.log('Edit job post:', post.id)
            navigate(`/job-posts/edit/${post.id}`) // Adjust route
        },
        [navigate],
    )

    const handleClone = useCallback(
        (postToClone: JobPostItem) => {
            console.log('Cloning job post:', postToClone.id)
            const newId = `JP${Math.floor(Math.random() * 9000) + 1000}`
            const clonedPost: JobPostItem = {
                ...postToClone,
                id: newId,
                jobTitle: `${postToClone.jobTitle} (Copy)`,
                status: 'draft',
                createdDate: new Date(),
            }
            setJobPosts((prev) => [clonedPost, ...prev])
            toast.push(
                <Notification
                    title="Job Post Cloned"
                    type="success"
                    duration={2000}
                />,
            )
        },
        [setJobPosts],
    )

    const handleChangeStatus = useCallback(
        (post: JobPostItem) => {
            const statuses: JobPostStatus[] = [
                'draft',
                'open',
                'on_hold',
                'closed',
            ]
            const currentStatusIndex = statuses.indexOf(post.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
            console.log(`Changing status of post ${post.id} to ${newStatus}`)
            setJobPosts((current) =>
                current.map((p) =>
                    p.id === post.id ? { ...p, status: newStatus } : p,
                ),
            )
            toast.push(
                <Notification
                    title="Status Changed"
                    type="success"
                    duration={2000}
                >{`Job Post '${post.jobTitle}' status changed to ${newStatus}.`}</Notification>,
            )
        },
        [setJobPosts],
    )

    const handleDelete = useCallback(
        (postToDelete: JobPostItem) => {
            console.log('Deleting job post:', postToDelete.id)
            setJobPosts((current) =>
                current.filter((p) => p.id !== postToDelete.id),
            )
            setSelectedPosts((prev) =>
                prev.filter((p) => p.id !== postToDelete.id),
            )
            toast.push(
                <Notification
                    title="Job Post Deleted"
                    type="success"
                    duration={2000}
                >{`Job Post '${postToDelete.jobTitle}' deleted.`}</Notification>,
            )
        },
        [setJobPosts, setSelectedPosts],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected job posts:',
            selectedPosts.map((p) => p.id),
        )
        const selectedIds = new Set(selectedPosts.map((p) => p.id))
        setJobPosts((current) => current.filter((p) => !selectedIds.has(p.id)))
        setSelectedPosts([])
        toast.push(
            <Notification
                title="Job Posts Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} job post(s) deleted.`}</Notification>,
        )
    }, [selectedPosts, setJobPosts, setSelectedPosts])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<JobPostItem>[] = useMemo(
        () => [
            // { header: 'ID', accessorKey: 'id', ... }, // Optional ID column
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                width: 120,
                cell: (props) => {
                    const { status } = props.row.original
                    const displayStatus = status
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return (
                        <Tag
                            className={`${jobStatusColor[status]} text-white capitalize`}
                        >
                            {displayStatus}
                        </Tag>
                    )
                },
            },
            {
                header: 'Job Title',
                accessorKey: 'jobTitle',
                enableSorting: true,
            },
            {
                header: 'Department',
                accessorKey: 'department',
                enableSorting: true,
            },
            {
                header: 'Description',
                accessorKey: 'description',
                enableSorting: false, // Sorting by long text is usually not helpful
                width: 300, // You might need to adjust this width
                cell: (props) => (
                    <Tooltip title={props.row.original.description} wrap>
                        {' '}
                        {/* Tooltip shows full description */}
                        {/* Span displays truncated text */}
                        <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-xs md:max-w-sm lg:max-w-md">
                            {' '}
                            {/* Adjust max-w-* as needed */}
                            {props.row.original.description}
                        </span>
                    </Tooltip>
                ),
            },
            {
                header: 'Location',
                accessorKey: 'location',
                enableSorting: true,
            },
            {
                header: 'Experience',
                accessorKey: 'experience',
                enableSorting: true,
            },
            {
                header: 'Vacancies',
                accessorKey: 'totalVacancy',
                enableSorting: true,
                width: 100,
            },
            // { header: 'Created Date', ... }, // Optional
            {
                header: '',
                id: 'action',
                width: 130,
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onClone={() => handleClone(props.row.original)} // Optional
                    />
                ),
            },
        ],
        [handleEdit, handleDelete, handleChangeStatus, handleClone], // Update dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Job Posts Listing</h3>
                    <JobPostActionTools allPosts={jobPosts} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <JobPostTableTools onSearchChange={handleSearchChange} />
                    {/* Filter component could be added here */}
                </div>

                {/* Active Filters Display (if filter added) */}
                {/* <ActiveFiltersDisplay ... /> */}

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <JobPostTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedPosts={selectedPosts}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <JobPostSelected
                selectedPosts={selectedPosts}
                setSelectedPosts={setSelectedPosts}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default JobPostsListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
