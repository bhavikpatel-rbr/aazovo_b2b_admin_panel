// src/views/your-path/BugReportListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'
import { useForm, Controller } from 'react-hook-form' // For filter form
import { zodResolver } from '@hookform/resolvers/zod' // For filter form
import { z } from 'zod' // For filter form
import type { ZodType } from 'zod' // For filter form

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Checkbox from '@/components/ui/Checkbox' // For filter form
import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // For filter form
import Badge from '@/components/ui/Badge'
import { TbBug, TbFilter, TbX, TbUserCircle } from 'react-icons/tb' // Icons
import { Card, Drawer, FormItem, Input, } from '@/components/ui'

// Icons
import {
    TbPencil, // Edit
    TbTrash, // Delete
    TbEye, // View Details
    TbSwitchHorizontal, // Change Status
    TbChecks, // Selected Footer
    TbSearch,
    TbCloudUpload,
    TbCloudDownload,
    TbPlus,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
type BugStatus =
    | 'new'
    | 'investigating'
    | 'confirmed'
    | 'in_progress'
    | 'resolved'
    | 'closed'
    | 'wont_fix'
export type BugReportItem = {
    id: string // Unique Bug Report ID
    status: BugStatus
    name: string // Name of the person reporting (or contact name)
    email: string
    phone: string | null
    reportedBy: string // User ID or name of the internal user who logged it (if different from contact)
    date: Date // Date the bug was reported
    // Add description if needed
    description?: string
}
// --- End Item Type ---

// --- Define Filter Schema ---
const filterValidationSchema = z.object({
    status: z.array(z.string()).default([]), // Filter by status
    // Add more filters if needed (e.g., reportedBy, date range)
})
type FilterFormSchema = z.infer<typeof filterValidationSchema>
// --- End Filter Schema ---

// --- Constants ---
const bugStatusColor: Record<BugStatus, string> = {
    new: 'bg-blue-500',
    investigating: 'bg-cyan-500',
    confirmed: 'bg-indigo-500',
    in_progress: 'bg-purple-500',
    resolved: 'bg-lime-500', // Different from 'completed'
    closed: 'bg-emerald-500',
    wont_fix: 'bg-red-500',
}

const initialDummyBugReports: BugReportItem[] = [
    {
        id: 'BUG001',
        status: 'new',
        name: 'Alice Customer',
        email: 'alice.c@email.com',
        phone: '+1-555-3001',
        reportedBy: 'SupportAgent1',
        date: new Date(2023, 10, 6, 11, 0),
        description: 'Login button unresponsive on Safari browser version X.',
    },
    {
        id: 'BUG002',
        status: 'investigating',
        name: 'Bob User',
        email: 'bob.user@mail.net',
        phone: null,
        reportedBy: 'QA_Tester2',
        date: new Date(2023, 10, 5, 15, 30),
        description:
            'Incorrect calculation displayed on the dashboard summary widget under specific conditions.',
    },
    {
        id: 'BUG003',
        status: 'confirmed',
        name: 'Charlie Dev',
        email: 'charlie.dev@internal.co',
        phone: '+44-20-1234-9999',
        reportedBy: 'Charlie Dev',
        date: new Date(2023, 10, 4, 9, 45),
        description:
            'API endpoint /users/{id} returns 500 error when ID contains special characters.',
    },
    {
        id: 'BUG004',
        status: 'in_progress',
        name: 'Diana Manager',
        email: 'diana.m@company.org',
        phone: '+1-800-555-MGR1',
        reportedBy: 'Diana Manager',
        date: new Date(2023, 10, 3, 14, 0),
        description:
            'User permission checks failing for editor role when accessing the settings page.',
    },
    {
        id: 'BUG005',
        status: 'resolved',
        name: 'Ethan Enduser',
        email: 'ethan.e@email.io',
        phone: null,
        reportedBy: 'SupportAgent2',
        date: new Date(2023, 9, 28, 10, 20),
        description: 'Typo on the pricing page headline.',
    },
    {
        id: 'BUG006',
        status: 'closed',
        name: 'Fiona Feedback',
        email: 'fiona.f@mail.co',
        phone: null,
        reportedBy: 'ProductManager1',
        date: new Date(2023, 9, 15, 13, 0),
        description:
            'Feature request submitted via feedback form, incorrectly logged as bug. Closed.',
    },
    {
        id: 'BUG007',
        status: 'wont_fix',
        name: 'George Gamer',
        email: 'george.g@email.com',
        phone: null,
        reportedBy: 'SupportAgent1',
        date: new Date(2023, 9, 10, 17, 55),
        description:
            'Minor visual glitch on loading screen for older Android devices. Low priority.',
    },
    {
        id: 'BUG008',
        status: 'new',
        name: 'Heidi Helpdesk',
        email: 'h.help@company.com',
        phone: '+1-555-3005',
        reportedBy: 'Heidi Helpdesk',
        date: new Date(2023, 10, 7, 8, 30),
        description: 'Cannot attach files larger than 5MB to support tickets.',
    },
]

// Extract unique statuses for filter options
const uniqueStatuses = Array.from(
    new Set(initialDummyBugReports.map((t) => t.status)),
).sort()
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onView,
    onEdit,
    onChangeStatus,
    onDelete,
}: {
    onView: () => void
    onEdit: () => void
    onChangeStatus: () => void
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'
    return (
        <div className="flex items-center justify-end gap-2">
            <Tooltip title="View Details">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                    )}
                    role="button"
                    onClick={onView}
                >
                    <TbEye />
                </div>
            </Tooltip>
            <Tooltip title="Edit Report">
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
            <Tooltip title="Delete Report">
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

// --- BugReportTable Component ---
const BugReportTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedReports,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<BugReportItem>[]
    data: BugReportItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedReports: BugReportItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: BugReportItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<BugReportItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedReports.some((selected) => selected.id === row.id)
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
// --- End BugReportTable ---

// --- BugReportSearch Component ---
type BugReportSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const BugReportSearch = React.forwardRef<
    HTMLInputElement,
    BugReportSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Search Bug Reports (ID, Name, Email, Reported By...)"
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
BugReportSearch.displayName = 'BugReportSearch'
// --- End BugReportSearch ---

// --- BugReportFilter Component ---
const BugReportFilter = ({
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
        reset(defaultVals)
        setFilterData(defaultVals)
        onDialogClose()
    }
    const activeFilterCount = filterData.status?.length || 0 // Add other filters here if needed

    return (
        <>
            <Button
                icon={<TbFilter />}
                onClick={openDialog}
                className="relative"
            >
                <span>Filter</span>{' '}
                {activeFilterCount > 0 && (
                    <Badge
                        content={activeFilterCount}
                        className="absolute -top-2 -right-2"
                        innerClass="text-xs"
                    />
                )}
            </Button>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h4 className="mb-4">Filter Bug Reports</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <UiFormItem label="Status" className="mb-4">
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    value={field.value || []}
                                    onChange={field.onChange}
                                >
                                    {uniqueStatuses.map((stat) => (
                                        <Checkbox
                                            key={stat}
                                            value={stat}
                                            className="mb-1 capitalize"
                                        >
                                            {stat.replace(/_/g, ' ')}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </UiFormItem>
                    {/* Add more filter fields here (e.g., Reported By dropdown) */}
                    <div className="flex justify-end items-center gap-2 mt-6">
                        <Button type="button" onClick={handleReset}>
                            {' '}
                            Reset{' '}
                        </Button>
                        <Button type="submit" variant="solid">
                            {' '}
                            Apply Filters{' '}
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    )
}
// --- End BugReportFilter ---

// --- BugReportTableTools Component ---
const BugReportTableTools = ({ onSearchChange, filterData, setFilterData }: { onSearchChange: (query: string) => void; filterData: FilterFormSchema; setFilterData: (data: FilterFormSchema) => void; }) => {
    type BugReportFilterSchema = {
         userRole : String,
         exportFrom : String,
         exportDate : Date
     }
 
     const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
     const closeFilterDrawer = ()=> setIsFilterDrawerOpen(false)
     const openFilterDrawer = ()=> setIsFilterDrawerOpen(true)
 
     const {control, handleSubmit} = useForm<BugReportFilterSchema>()
 
     const exportFiltersSubmitHandler = (data : BugReportFilterSchema) => {
         console.log("filter data", data)
     }
 return (
     <div className="flex items-center w-full gap-2">
     <div className="flex-grow">
         <BugReportSearch onInputChange={onSearchChange} />
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
 );
};
// --- End BugReportTableTools ---

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({
    filterData,
    onRemoveFilter,
    onClearAll,
}: {
    filterData: FilterFormSchema
    onRemoveFilter: (key: keyof FilterFormSchema, value: string) => void
    onClearAll: () => void
}) => {
    const activeStatuses = filterData.status || []
    // Add other active filters here: const activeAssignees = filterData.assignTo || [];
    const hasActiveFilters =
        activeStatuses.length > 0 /* || activeAssignees.length > 0 */
    if (!hasActiveFilters) return null
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
                Active Filters:
            </span>
            {activeStatuses.map((stat) => (
                <Tag
                    key={`stat-${stat}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    {' '}
                    <span className="capitalize">
                        {stat.replace(/_/g, ' ')}
                    </span>{' '}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('status', stat)}
                    />{' '}
                </Tag>
            ))}
            {/* Render other active filters here */}
            <Button
                size="xs"
                variant="plain"
                className="text-red-600 hover:text-red-500 hover:underline ml-auto"
                onClick={onClearAll}
            >
                {' '}
                Clear All{' '}
            </Button>
        </div>
    )
}
// --- End ActiveFiltersDisplay ---

// --- BugReportActionTools Component ---
const BugReportActionTools = ({
    allReports,
    openAddDrawer,
    
}: {
    allReports: BugReportItem[];
    openAddDrawer: () => void; // Accept function as a prop
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () => allReports.map((r) => ({ ...r, date: r.date.toISOString() })),
        [allReports],
    )
    const csvHeaders = [
        /* ... headers ... */
    ]
    const handleAdd = () => navigate('/bug-reports/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbBug />} onClick={openAddDrawer} block>
                {' '}
                Report New Bug{' '}
            </Button>{' '}
        </div>
    )
}
// --- End BugReportActionTools ---

// --- BugReportSelected Component ---
const BugReportSelected = ({
    selectedReports,
    setSelectedReports,
    onDeleteSelected,
}: {
    selectedReports: BugReportItem[]
    setSelectedReports: React.Dispatch<React.SetStateAction<BugReportItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedReports.length === 0) return null

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
                                {selectedReports.length}
                            </span>
                            <span>
                                Report{selectedReports.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedReports.length} Report${selectedReports.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected bug report
                    {selectedReports.length > 1 ? 's' : ''}? This action cannot
                    be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End BugReportSelected ---

// --- Detail View Dialog ---
const DetailViewDialog = ({
    isOpen,
    onClose,
    report,
}: {
    isOpen: boolean
    onClose: () => void
    report: BugReportItem | null
}) => {
    if (!report) return null
    const formatDate = (date: Date | null | undefined) =>
        date ? date.toLocaleString() : 'N/A'
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            width={700}
        >
            <h5 className="mb-4">Bug Report Details (ID: {report.id})</h5>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <p>
                    <strong>Reporter Name:</strong> {report.name}
                </p>
                <p>
                    <strong>Email:</strong> {report.email}
                </p>
                <p>
                    <strong>Phone:</strong> {report.phone ?? 'N/A'}
                </p>
                <p>
                    <strong>Reported By (Internal):</strong> {report.reportedBy}
                </p>
                <p>
                    <strong>Date Reported:</strong> {formatDate(report.date)}
                </p>
                <p>
                    <strong>Status:</strong>{' '}
                    <Tag
                        className={`${bugStatusColor[report.status]} text-white capitalize`}
                    >
                        {report.status.replace(/_/g, ' ')}
                    </Tag>
                </p>
            </div>
            <div className="mt-4">
                <h6 className="mb-2 font-semibold">
                    Description / Requirement:
                </h6>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-3 rounded-md max-h-80 overflow-y-auto">
                    {report.description ?? 'No description provided.'}
                </p>
            </div>
            <div className="text-right mt-6">
                <Button variant="solid" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Dialog>
    )
}
// --- End Dialogs ---

// --- Main BugReportListing Component ---
const BugReportListing = () => {
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<BugReportItem | null>(null);

    const openEditDrawer = (item: BugReportItem) => {
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

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [reports, setReports] = useState<BugReportItem[]>(
        initialDummyBugReports,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedReports, setSelectedReports] = useState<BugReportItem[]>([])
    const [filterData, setFilterData] = useState<FilterFormSchema>(
        filterValidationSchema.parse({}),
    )
    const [detailViewOpen, setDetailViewOpen] = useState(false)
    const [currentItem, setCurrentItem] = useState<BugReportItem | null>(null)
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...reports]

        // Apply Filtering
        if (filterData.status && filterData.status.length > 0) {
            const statusSet = new Set(filterData.status)
            processedData = processedData.filter((r) => statusSet.has(r.status))
        }
        // Add other filters here

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (r) =>
                    r.id.toLowerCase().includes(query) ||
                    r.status.toLowerCase().includes(query) ||
                    r.name.toLowerCase().includes(query) ||
                    r.email.toLowerCase().includes(query) ||
                    (r.phone?.toLowerCase().includes(query) ?? false) ||
                    r.reportedBy.toLowerCase().includes(query) ||
                    r.description?.toLowerCase().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'date') {
                    return order === 'asc'
                        ? a.date.getTime() - b.date.getTime()
                        : b.date.getTime() - a.date.getTime()
                }
                const aValue = a[key as keyof BugReportItem] ?? ''
                const bValue = b[key as keyof BugReportItem] ?? ''
                if (aValue === null && bValue === null) return 0
                if (aValue === null) return order === 'asc' ? -1 : 1
                if (bValue === null) return order === 'asc' ? 1 : -1
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
    }, [reports, tableData, filterData])
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
            setSelectedReports([])
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
            setSelectedReports([])
        },
        [tableData, handleSetTableData],
    )
    const handleRemoveFilter = useCallback(
        (key: keyof FilterFormSchema, value: string) => {
            setFilterData((prev) => {
                const currentValues = prev[key] || []
                const newValues = currentValues.filter((item) => item !== value)
                const updatedFilterData = { ...prev, [key]: newValues }
                handleSetTableData({ ...tableData, pageIndex: 1 })
                setSelectedReports([])
                return updatedFilterData
            })
        },
        [tableData, handleSetTableData],
    )
    const handleClearAllFilters = useCallback(() => {
        const defaultFilters = filterValidationSchema.parse({})
        setFilterData(defaultFilters)
        handleSetTableData({ ...tableData, pageIndex: 1 })
        setSelectedReports([])
    }, [tableData, handleSetTableData])

    const handleRowSelect = useCallback(
        (checked: boolean, row: BugReportItem) => {
            setSelectedReports((prev) => {
                if (checked) {
                    return prev.some((r) => r.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((r) => r.id !== row.id)
                }
            })
        },
        [setSelectedReports],
    )
    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<BugReportItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedReports((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((r) => r.id))
                    const newSelection = originalRows.filter(
                        (r) => !existingIds.has(r.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((r) => !rowIds.has(r.id))
                }
            })
        },
        [setSelectedReports],
    )

    const handleViewDetails = useCallback(
        (item: BugReportItem) => {
            setCurrentItem(item)
            setDetailViewOpen(true)
        },
        [setCurrentItem, setDetailViewOpen],
    )
    const handleCloseDetailView = useCallback(() => {
        setDetailViewOpen(false)
        setCurrentItem(null)
    }, [setCurrentItem, setDetailViewOpen])

    const handleEdit = useCallback(
        (report: BugReportItem) => {
            console.log('Edit report:', report.id)
            navigate(`/bug-reports/edit/${report.id}`)
        },
        [navigate],
    )

    const handleChangeStatus = useCallback(
        (report: BugReportItem) => {
            const statuses: BugStatus[] = [
                'new',
                'investigating',
                'confirmed',
                'in_progress',
                'resolved',
                'closed',
                'wont_fix',
            ]
            const currentStatusIndex = statuses.indexOf(report.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
            console.log(
                `Changing status of report ${report.id} to ${newStatus}`,
            )
            setReports((current) =>
                current.map((r) =>
                    r.id === report.id ? { ...r, status: newStatus } : r,
                ),
            )
            toast.push(
                <Notification
                    title="Status Changed"
                    type="success"
                    duration={2000}
                >{`Report ${report.id} status changed to ${newStatus.replace(/_/g, ' ')}.`}</Notification>,
            )
        },
        [setReports],
    )

    const handleDelete = useCallback(
        (reportToDelete: BugReportItem) => {
            console.log('Deleting report:', reportToDelete.id)
            setReports((current) =>
                current.filter((r) => r.id !== reportToDelete.id),
            )
            setSelectedReports((prev) =>
                prev.filter((r) => r.id !== reportToDelete.id),
            )
            toast.push(
                <Notification
                    title="Report Deleted"
                    type="success"
                    duration={2000}
                >{`Report ${reportToDelete.id} deleted.`}</Notification>,
            )
        },
        [setReports, setSelectedReports],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected reports:',
            selectedReports.map((r) => r.id),
        )
        const selectedIds = new Set(selectedReports.map((r) => r.id))
        setReports((current) => current.filter((r) => !selectedIds.has(r.id)))
        setSelectedReports([])
        toast.push(
            <Notification
                title="Reports Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} report(s) deleted.`}</Notification>,
        )
    }, [selectedReports, setReports, setSelectedReports])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<BugReportItem>[] = useMemo(
        () => [
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                width: 150,
                cell: (props) => {
                    const { status } = props.row.original
                    const displayStatus = status
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return (
                        <Tag
                            className={`${bugStatusColor[status]} text-white capitalize`}
                        >
                            {displayStatus}
                        </Tag>
                    )
                },
            },
            {
                header: 'Name',
                accessorKey: 'name',
                enableSorting: true,
                cell: (props) => {
                    const { name, email } = props.row.original
                    return (
                        <div className="flex items-center">
                            <Avatar
                                size={28}
                                shape="circle"
                                icon={<TbUserCircle />}
                            />{' '}
                            <div className="ml-2 rtl:mr-2">
                                <span className="font-semibold">{name}</span>
                                <div className="text-xs text-gray-500">
                                    {email}
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Phone',
                accessorKey: 'phone',
                enableSorting: false,
                width: 150,
                cell: (props) => <span>{props.row.original.phone ?? '-'}</span>,
            },
            {
                header: 'Reported By',
                accessorKey: 'reportedBy',
                enableSorting: true,
            },
            {
                header: 'Requirement',
                accessorKey: 'description',
                enableSorting: false,
                cell: (props) => (
                    <Tooltip
                        title={props.row.original.description}
                        wrapperClass="w-full"
                    >
                        <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
                            {props.row.original.description}
                        </span>
                    </Tooltip>
                ),
            },
            {
                header: 'Date Reported',
                accessorKey: 'date',
                enableSorting: true,
                width: 180,
                cell: (props) => {
                    const date = props.row.original.date
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
                header: '',
                id: 'action',
                width: 150, // Adjusted width
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleViewDetails(props.row.original)}
                        onEdit={() => openEditDrawer(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleViewDetails, handleEdit, handleChangeStatus, handleDelete], // Update dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    {/* Header */}
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Bug Reports</h5>
                        <BugReportActionTools allReports={reports} openAddDrawer={openAddDrawer}  />
                    </div>

                    {/* Tools */}
                    <div className="mb-2">
                        <BugReportTableTools
                            onSearchChange={handleSearchChange}
                            filterData={filterData}
                            setFilterData={handleApplyFilter}
                        />
                    </div>

                    {/* Active Filters Display Area */}
                    <ActiveFiltersDisplay
                        filterData={filterData}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                    />

                    {/* Table */}
                    <div className="flex-grow overflow-auto">
                        <BugReportTable
                            columns={columns}
                            data={pageData}
                            loading={isLoading}
                            pagingData={{
                                total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            selectedReports={selectedReports}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            onRowSelect={handleRowSelect}
                            onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>

                {/* Selected Footer */}
                <BugReportSelected
                    selectedReports={selectedReports}
                    setSelectedReports={setSelectedReports}
                    onDeleteSelected={handleDeleteSelected}
                />

                {/* Detail View Dialog */}
                <DetailViewDialog
                    isOpen={detailViewOpen}
                    onClose={handleCloseDetailView}
                    report={currentItem}
                />
            </Container>
            <Drawer
                title="Edit Bug Report"
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
                                console.log('Updated Bug Report:', selectedItem);
                                closeEditDrawer();
                            }}
                        >
                            Save
                        </Button>
                    </div>
                }
            >
                <Form>
                    <FormItem label="Status">
                        <select
                            value={selectedItem?.status || 'new'}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'new', name: '', email: '', phone: null, reportedBy: '', date: new Date(), description: '' }),
                                    status: e.target.value as BugStatus,
                                }))
                            }
                        >
                            <option value="new">New</option>
                            <option value="investigating">Investigating</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                            <option value="wont_fix">Won't Fix</option>
                        </select>
                    </FormItem>
                    <FormItem label="Name">
                        <Input
                            value={selectedItem?.name || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'new', name: '', email: '', phone: null, reportedBy: '', date: new Date(), description: '' }),
                                    name: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Email">
                        <Input
                            value={selectedItem?.email || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'new', name: '', email: '', phone: null, reportedBy: '', date: new Date(), description: '' }),
                                    email: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Phone">
                        <Input
                            value={selectedItem?.phone || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'new', name: '', email: '', phone: null, reportedBy: '', date: new Date(), description: '' }),
                                    phone: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Reported By">
                        <Input
                            value={selectedItem?.reportedBy || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'new', name: '', email: '', phone: null, reportedBy: '', date: new Date(), description: '' }),
                                    reportedBy: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Date">
                        <Input
                            type="datetime-local"
                            value={selectedItem?.date.toISOString().slice(0, 16) || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'new', name: '', email: '', phone: null, reportedBy: '', date: new Date(), description: '' }),
                                    date: new Date(e.target.value),
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Description">
                        <textarea
                            value={selectedItem?.description || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', status: 'new', name: '', email: '', phone: null, reportedBy: '', date: new Date(), description: '' }),
                                    description: e.target.value,
                                }))
                            }
                            className="input"
                            placeholder="Enter description"
                        />
                    </FormItem>
                </Form>
            </Drawer>
            <Drawer
                title="Add New Bug Report"
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
                            onClick={() => console.log('Bug Report Added')}
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
                        const newItem: BugReportItem = {
                            id: `${reports.length + 1}`,
                            status: formData.get('status') as BugStatus,
                            name: formData.get('name') as string,
                            email: formData.get('email') as string,
                            phone: formData.get('phone') as string | null,
                            reportedBy: formData.get('reportedBy') as string,
                            date: new Date(formData.get('date') as string),
                            description: formData.get('description') as string,
                        };
                        console.log('New Bug Report:', newItem);
                        // handleAdd(newItem);
                    }}
                >
                    <FormItem label="Status">
                        <select name="status" defaultValue="new">
                            <option value="new">New</option>
                            <option value="investigating">Investigating</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                            <option value="wont_fix">Won't Fix</option>
                        </select>
                    </FormItem>
                    <FormItem label="Name">
                        <Input name="name" placeholder="Enter Name" />
                    </FormItem>
                    <FormItem label="Email">
                        <Input name="email" placeholder="Enter Email" />
                    </FormItem>
                    <FormItem label="Phone">
                        <Input name="phone" placeholder="Enter Phone" />
                    </FormItem>
                    <FormItem label="Reported By">
                        <Input name="reportedBy" placeholder="Enter Reporter Name" />
                    </FormItem>
                    <FormItem label="Date">
                        <Input name="date" type="datetime-local" />
                    </FormItem>
                    <FormItem label="Description">
                        <textarea name="description" className="input" placeholder="Enter description" />
                    </FormItem>
                </Form>
            </Drawer>
        </>
    )
}
// --- End Main Component ---

export default BugReportListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
