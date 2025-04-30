// src/views/your-path/SubscribersListing.tsx (Updated)

import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    lazy,
    Suspense,
} from 'react' // Added lazy, Suspense
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import { IoEyeOutline } from "react-icons/io5";
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
import Checkbox from '@/components/ui/Checkbox'
import { Form, FormItem as UiFormItem } from '@/components/ui/Form'
import Badge from '@/components/ui/Badge'
import DatePicker from '@/components/ui/DatePicker'
import { HiOutlineCalendar } from 'react-icons/hi'
import {
    TbMail,
    TbFilter,
    TbX,
    TbUserCheck,
    TbCloudDownload,
} from 'react-icons/tb' // Added TbCloudDownload

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbPlus, // Keep if Add button might be needed later
} from 'react-icons/tb'

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
    import('react-csv').then((module) => ({ default: module.CSVLink })),
)
// --- End Lazy Load ---

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
export type SubscriberItem = {
    id: string
    email: string
    subscribedDate: Date
    // status?: 'subscribed' | 'unsubscribed';
    // source?: string;
}
// --- End Item Type ---

// --- Define Filter Schema ---
const filterValidationSchema = z.object({
    dateRange: z
        .tuple([z.date().nullable(), z.date().nullable()])
        .default([null, null]),
    // status: z.array(z.string()).default([]),
})
type FilterFormSchema = z.infer<typeof filterValidationSchema>
// --- End Filter Schema ---

// --- Constants ---
const initialDummySubscribers: SubscriberItem[] = [
    // ... (dummy data remains the same)
    {
        id: 'SUB001',
        email: 'alice.subscriber@email.com',
        subscribedDate: new Date(2023, 10, 1, 9, 0),
    },
    {
        id: 'SUB002',
        email: 'bob.fan@mail.net',
        subscribedDate: new Date(2023, 9, 15, 14, 30),
    },
    {
        id: 'SUB003',
        email: 'charlie.reader@domain.org',
        subscribedDate: new Date(2023, 8, 20, 11, 5),
    },
    {
        id: 'SUB004',
        email: 'diana.interested@web.co',
        subscribedDate: new Date(2023, 7, 10, 16, 0),
    },
    {
        id: 'SUB005',
        email: 'ethan.updates@email.io',
        subscribedDate: new Date(2023, 10, 5, 8, 45),
    },
    {
        id: 'SUB006',
        email: 'fiona.news@mail.co',
        subscribedDate: new Date(2023, 6, 5, 10, 0),
    },
    {
        id: 'SUB007',
        email: 'george.alerts@domain.com',
        subscribedDate: new Date(2023, 9, 1, 13, 20),
    },
    {
        id: 'SUB008',
        email: 'heidi.insider@email.com',
        subscribedDate: new Date(2023, 8, 1, 17, 10),
    },
]

// Extract unique values for filters if needed
// const uniqueStatuses = ...
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({ onDelete }: { onDelete: () => void }) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'
    return (
        <div className="flex items-center justify-center">
            <Tooltip title="View Subscriber">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-600',
                    )}
                    role="button">
                    <IoEyeOutline />
                </div>
            </Tooltip>
            <Tooltip title="Delete Subscriber">
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

// --- SubscriberTable Component ---
const SubscriberTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedSubscribers,
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
                selectedSubscribers.some((selected) => selected.id === row.id)
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
// Type definition
type SubscriberTableProps = {
    columns: ColumnDef<SubscriberItem>[]
    data: SubscriberItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedSubscribers: SubscriberItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: SubscriberItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<SubscriberItem>[]) => void
}
// --- End SubscriberTable ---

// --- SubscriberSearch Component ---
type SubscriberSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const SubscriberSearch = React.forwardRef<
    HTMLInputElement,
    SubscriberSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Quick search..."
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
SubscriberSearch.displayName = 'SubscriberSearch'
// --- End SubscriberSearch ---

// --- SubscriberFilter Component ---
const SubscriberFilter = ({
    filterData,
    setFilterData,
}: {
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
}) => {
    const [dialogIsOpen, setIsOpen] = useState(false)
    const openDialog = () => setIsOpen(true)
    const onDialogClose = () => setIsOpen(false)
    const { control, handleSubmit, reset, watch } = useForm<FilterFormSchema>({
        defaultValues: filterData,
        resolver: zodResolver(filterValidationSchema),
    })
    const dateRange = watch('dateRange')
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
    const activeFilterCount =
        filterData.dateRange?.[0] || filterData.dateRange?.[1] ? 1 : 0

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
                width={500}
            >
                <h4 className="mb-4">Filter Subscribers</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <UiFormItem
                        label="Subscription Date Range"
                        className="mb-4"
                    >
                        <Controller
                            name="dateRange"
                            control={control}
                            render={({ field }) => (
                                <DatePicker.RangePicker
                                    placeholder="Select date range"
                                    value={field.value}
                                    onChange={field.onChange}
                                    inputFormat="YYYY-MM-DD"
                                    inputPrefix={
                                        <HiOutlineCalendar className="text-lg" />
                                    }
                                />
                            )}
                        />
                    </UiFormItem>
                    {/* Status filter could be added here */}
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
// --- End SubscriberFilter ---

// --- SubscriberTableTools Component (Modified) ---
const SubscriberTableTools = ({
    onSearchChange,
    filterData,
    setFilterData,
    allSubscribers,
}: {
    onSearchChange: (query: string) => void
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
    allSubscribers: SubscriberItem[] // Pass all subscribers for export
}) => {
    // Prepare data for CSV
    const csvData = useMemo(
        () =>
            allSubscribers.map((s) => ({
                id: s.id,
                email: s.email,
                subscribedDate: s.subscribedDate.toISOString(),
            })),
        [allSubscribers],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Email', key: 'email' },
        { label: 'Subscribed Date', key: 'subscribedDate' },
    ]

    return (
        // Use flex row, align items vertically, add gap
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
            {/* Search takes most space */}
            <div className="flex-grow">
                <SubscriberSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter button and Export button grouped */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-shrink-0">
                <SubscriberFilter
                    filterData={filterData}
                    setFilterData={setFilterData}
                />
                <Suspense fallback={<Button loading>Loading Export...</Button>}>
                    <CSVLink
                        filename="subscribers.csv"
                        data={csvData}
                        headers={csvHeaders}
                    >
                        <Button icon={<TbCloudDownload />}> Export CSV </Button>
                    </CSVLink>
                </Suspense>
            </div>
        </div>
    )
}
// --- End SubscriberTableTools ---

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({
    filterData,
    onRemoveFilter,
    onClearAll,
}: {
    filterData: FilterFormSchema
    onRemoveFilter: (key: keyof FilterFormSchema, value: any) => void
    onClearAll: () => void
}) => {
    const activeDateRange = filterData.dateRange || [null, null]
    const hasDateRange = activeDateRange[0] || activeDateRange[1]
    // Add other active filters here: const activeStatuses = ...
    const hasActiveFilters = hasDateRange /* || activeStatuses.length > 0 */

    if (!hasActiveFilters) return null

    const formatDate = (date: Date | null) =>
        date ? date.toLocaleDateString() : ''

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
                Active Filters:
            </span>
            {hasDateRange && (
                <Tag prefix className="...">
                    {' '}
                    Date: {formatDate(activeDateRange[0])} -{' '}
                    {formatDate(activeDateRange[1])}{' '}
                    <TbX
                        className="ml-1 ..."
                        onClick={() =>
                            onRemoveFilter('dateRange', [null, null])
                        }
                    />{' '}
                </Tag>
            )}
            {/* Render other active filters (e.g., status) here */}
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

// --- SubscriberActionTools Component (Simplified - only Add button if needed) ---
const SubscriberActionTools = () => {
    const navigate = useNavigate()
    const handleAdd = () => console.log('Add Subscriber action needed') // navigate('/subscribers/add');

    // Decide if manual adding is needed. If not, this component can be removed.
    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block> Add Subscriber </Button> */}
        </div>
    )
}
// --- End SubscriberActionTools ---

// --- SubscriberSelected Component ---
const SubscriberSelected = ({
    selectedSubscribers,
    setSelectedSubscribers,
    onDeleteSelected,
}: {
    selectedSubscribers: SubscriberItem[]
    setSelectedSubscribers: React.Dispatch<
        React.SetStateAction<SubscriberItem[]>
    >
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    // ... (rest of component implementation remains the same) ...
    if (selectedSubscribers.length === 0) return null
    return <> {/* ... StickyFooter and ConfirmDialog ... */} </>
}
// --- End SubscriberSelected ---

// --- Main SubscribersListing Component ---
const SubscribersListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [subscribers, setSubscribers] = useState<SubscriberItem[]>(
        initialDummySubscribers,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: 'desc', key: 'subscribedDate' },
        query: '',
    })
    const [selectedSubscribers, setSelectedSubscribers] = useState<
        SubscriberItem[]
    >([])
    const [filterData, setFilterData] = useState<FilterFormSchema>(
        filterValidationSchema.parse({}),
    )
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...subscribers]

        // Apply Filtering
        if (
            filterData.dateRange &&
            (filterData.dateRange[0] || filterData.dateRange[1])
        ) {
            const startDate = filterData.dateRange[0]?.getTime()
            const endDate = filterData.dateRange[1]
                ? new Date(
                      filterData.dateRange[1].getTime() + 86399999,
                  ).getTime()
                : null
            processedData = processedData.filter((sub) => {
                const subTime = sub.subscribedDate.getTime()
                const startMatch = startDate ? subTime >= startDate : true
                const endMatch = endDate ? subTime <= endDate : true
                return startMatch && endMatch
            })
        }
        // Add status filter logic here

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (s) =>
                    s.id.toLowerCase().includes(query) ||
                    s.email.toLowerCase().includes(query),
                // Add status search if implemented
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            /* ... sort logic ... */
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
    }, [subscribers, tableData, filterData])
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
            setSelectedSubscribers([])
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
            setSelectedSubscribers([])
        },
        [tableData, handleSetTableData],
    )
    const handleRemoveFilter = useCallback(
        (key: keyof FilterFormSchema, value: any) => {
            setFilterData((prev) => {
                let newValues
                if (key === 'dateRange') {
                    newValues = [null, null]
                } else {
                    const currentValues = prev[key] || []
                    newValues = currentValues.filter((item) => item !== value)
                }
                const updatedFilterData = { ...prev, [key]: newValues }
                handleSetTableData({ ...tableData, pageIndex: 1 })
                setSelectedSubscribers([])
                return updatedFilterData
            })
        },
        [tableData, handleSetTableData],
    )
    const handleClearAllFilters = useCallback(() => {
        const defaultFilters = filterValidationSchema.parse({})
        setFilterData(defaultFilters)
        handleSetTableData({ ...tableData, pageIndex: 1 })
        setSelectedSubscribers([])
    }, [tableData, handleSetTableData])

    const handleRowSelect = useCallback(
        (checked: boolean, row: SubscriberItem) => {
            /* ... */
        },
        [setSelectedSubscribers],
    )
    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<SubscriberItem>[]) => {
            /* ... */
        },
        [setSelectedSubscribers],
    )
    // Edit handler removed
    const handleDelete = useCallback(
        (subscriberToDelete: SubscriberItem) => {
            /* ... */
        },
        [setSubscribers, setSelectedSubscribers],
    )
    const handleDeleteSelected = useCallback(() => {
        /* ... */
    }, [selectedSubscribers, setSubscribers, setSelectedSubscribers])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<SubscriberItem>[] = useMemo(
        () => [
            // { header: 'ID', accessorKey: 'id', ... }, // Optional ID
            { header: 'Email', accessorKey: 'email', enableSorting: true, meta: {HeaderClass :'text-left'}, },
            {
                header: 'Subscribed Date',
                accessorKey: 'subscribedDate',
                enableSorting: true,
                meta: {HeaderClass :'text-right'},
                cell: (props) => {
                    const date = props.row.original.subscribedDate
                    return (
                        <span className='text-right block'>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    )
                },
            },
            // { header: 'Status', ... }, // Optional Status
            {
                header: 'Action',
                id: 'action',
                meta: {HeaderClass :'text-center'},
                cell: (props) => (
                    <ActionColumn
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleDelete], // Update dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Subscribers</h5>
                    {/* Action Tools removed from header, Export moved to Table Tools */}
                    {/* <SubscriberActionTools allSubscribers={subscribers} /> */}
                </div>

                {/* Tools - Search, Filter, Export */}
                <div className="mb-2">
                    <SubscriberTableTools
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter}
                        allSubscribers={subscribers} // Pass data for export
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
                    <SubscriberTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedSubscribers={selectedSubscribers}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <SubscriberSelected
                selectedSubscribers={selectedSubscribers}
                setSelectedSubscribers={setSelectedSubscribers}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default SubscribersListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
