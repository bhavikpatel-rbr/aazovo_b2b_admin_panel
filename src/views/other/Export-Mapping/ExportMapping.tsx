// src/views/your-path/ExportMapping.tsx (Renamed file)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
// import Tag from '@/components/ui/Tag'; // Likely not needed now
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog' // Keep for potential edit/view modals
import Avatar from '@/components/ui/Avatar' // Keep if userName might link to profile
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
// import RichTextEditor from '@/components/shared/RichTextEditor'; // Remove if not used
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'

// Icons
import {
    TbPencil,
    TbCopy,
    // TbSwitchHorizontal, // Removed status change icon
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload, // Keep for potential future export
    TbUserPlus,
} from 'react-icons/tb'

// Types
import type {
    OnSortParam,
    ColumnDef,
    Row,
    SortingFnOption,
} from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type (Table Row Data) ---
export type ExportMappingItem = {
    id: string // Unique ID for the mapping/export record
    userName: string
    userRole: string
    exportFrom: string // e.g., "User List", "Product Catalog", "Order History"
    fileName: string // e.g., "users_export_2023-10-27.csv"
    reason: string // e.g., "Monthly Backup", "Audit Request"
    exportDate: Date // Use Date object for sorting/formatting
}
// --- End Item Type Definition ---

// --- Constants ---
const initialDummyData: ExportMappingItem[] = [
    {
        id: 'EM001',
        userName: 'Alice Johnson',
        userRole: 'Admin',
        exportFrom: 'User List',
        fileName: 'users_2023-10-27.csv',
        reason: 'Audit Request',
        exportDate: new Date(2023, 9, 27, 10, 30),
    },
    {
        id: 'EM002',
        userName: 'Bob Williams',
        userRole: 'Manager',
        exportFrom: 'Order History',
        fileName: 'orders_Q3_2023.xlsx',
        reason: 'Quarterly Report',
        exportDate: new Date(2023, 9, 15, 14, 0),
    },
    {
        id: 'EM003',
        userName: 'Charlie Brown',
        userRole: 'Support Agent',
        exportFrom: 'Support Tickets',
        fileName: 'tickets_oct_week3.csv',
        reason: 'Weekly Review',
        exportDate: new Date(2023, 9, 23, 9, 0),
    },
    {
        id: 'EM004',
        userName: 'Alice Johnson',
        userRole: 'Admin',
        exportFrom: 'Product Catalog',
        fileName: 'products_full_2023-10-20.json',
        reason: 'Data Migration Prep',
        exportDate: new Date(2023, 9, 20, 16, 45),
    },
    {
        id: 'EM005',
        userName: 'David Miller',
        userRole: 'Sales Rep',
        exportFrom: 'Customer List',
        fileName: 'leads_active.csv',
        reason: 'Campaign Planning',
        exportDate: new Date(2023, 9, 26, 11, 15),
    },
    {
        id: 'EM006',
        userName: 'Eve Davis',
        userRole: 'Analyst',
        exportFrom: 'Website Analytics',
        fileName: 'traffic_report_2023-10.pdf',
        reason: 'Performance Analysis',
        exportDate: new Date(2023, 10, 1, 8, 55),
    }, // Nov 1st
    {
        id: 'EM007',
        userName: 'Frank Garcia',
        userRole: 'Developer',
        exportFrom: 'API Logs',
        fileName: 'api_errors_2023-10-25.log',
        reason: 'Debugging Issue #123',
        exportDate: new Date(2023, 9, 25, 17, 30),
    },
    {
        id: 'EM008',
        userName: 'Alice Johnson',
        userRole: 'Admin',
        exportFrom: 'User List',
        fileName: 'users_2023-09-30.csv',
        reason: 'Monthly Backup',
        exportDate: new Date(2023, 8, 30, 23, 50),
    }, // Sep 30th
    {
        id: 'EM009',
        userName: 'Grace Rodriguez',
        userRole: 'Marketing',
        exportFrom: 'Campaign Results',
        fileName: 'fall_promo_summary.xlsx',
        reason: 'Post-Campaign Analysis',
        exportDate: new Date(2023, 9, 28, 13, 20),
    },
    {
        id: 'EM010',
        userName: 'Heidi Martinez',
        userRole: 'HR Manager',
        exportFrom: 'Employee Data',
        fileName: 'headcount_oct23.csv',
        reason: 'Compliance Reporting',
        exportDate: new Date(2023, 9, 18, 10, 0),
    },
    {
        id: 'EM011',
        userName: 'Alice Johnson',
        userRole: 'Admin',
        exportFrom: 'System Settings',
        fileName: 'config_backup_2023-10-27.bak',
        reason: 'Pre-Update Backup',
        exportDate: new Date(2023, 9, 27, 9, 0),
    },
    {
        id: 'EM012',
        userName: 'Ivan Hernandez',
        userRole: 'Finance',
        exportFrom: 'Invoice Data',
        fileName: 'invoices_pending_approval.csv',
        reason: 'AP Processing',
        exportDate: new Date(2023, 9, 26, 15, 10),
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone, // Keep clone? Might not be relevant for exports. Remove if not needed.
    // onChangeStatus removed
    onDelete,
}: {
    onEdit: () => void
    onClone?: () => void // Make clone optional
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-end gap-2">
            {/* Optional Clone Button */}
            {onClone && (
                <Tooltip title="Clone Record (if applicable)">
                    <div
                        className={classNames(
                            iconButtonClass,
                            hoverBgClass,
                            'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                        )}
                        role="button"
                        onClick={onClone}
                    >
                        {' '}
                        <TbCopy />{' '}
                    </div>
                </Tooltip>
            )}
            <Tooltip title="Edit Record">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    {' '}
                    <TbPencil />{' '}
                </div>
            </Tooltip>
            <Tooltip title="Delete Record">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400',
                    )}
                    role="button"
                    onClick={onDelete}
                >
                    {' '}
                    <TbTrash />{' '}
                </div>
            </Tooltip>
        </div>
    )
}
// --- End ActionColumn ---

// --- ExportMappingTable Component ---
const ExportMappingTable = ({
    // Renamed component
    columns,
    data,
    loading,
    pagingData,
    selectedMappings, // Renamed prop
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<ExportMappingItem>[]
    data: ExportMappingItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedMappings: ExportMappingItem[] // Use new type
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: ExportMappingItem) => void // Use new type
    onAllRowSelect: (checked: boolean, rows: Row<ExportMappingItem>[]) => void // Use new type
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={
                (row) =>
                    selectedMappings.some((selected) => selected.id === row.id) // Use selectedMappings
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}
// --- End ExportMappingTable ---

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
            placeholder="Search Exports (User, Role, File, Reason...)" // Updated placeholder
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
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <ExportMappingSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter component removed */}
        </div>
    )
}
// --- End ExportMappingTableTools ---

// --- ExportMappingActionTools Component ---
const ExportMappingActionTools = ({
    allMappings,
}: {
    allMappings: ExportMappingItem[]
}) => {
    // Renamed prop and component
    const navigate = useNavigate()

    // Prepare data for CSV
    const csvData = useMemo(() => {
        return allMappings.map((item) => ({
            ...item,
            // Format date for CSV
            exportDate: item.exportDate.toISOString(), // Or use another format
        }))
    }, [allMappings])

    const csvHeaders = [
        { label: 'Record ID', key: 'id' },
        { label: 'User Name', key: 'userName' },
        { label: 'User Role', key: 'userRole' },
        { label: 'Exported From', key: 'exportFrom' },
        { label: 'File Name', key: 'fileName' },
        { label: 'Reason', key: 'reason' },
        { label: 'Date', key: 'exportDate' },
    ]

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink filename="export_mappings.csv" data={csvData} headers={csvHeaders} >
                <Button icon={<TbCloudDownload />} className="w-full" block> Download </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbUserPlus />} // Icon might need changing e.g., TbFileExport
                onClick={() =>
                    console.log('Navigate to Create Export Mapping page')
                }
                block
            >
                Create Export Record {/* Updated Text */}
            </Button>
        </div>
    )
}
// --- End ExportMappingActionTools ---

// --- ExportMappingSelected Component ---
const ExportMappingSelected = ({
    // Renamed component
    selectedMappings, // Renamed prop
    setSelectedMappings, // Renamed prop
    onDeleteSelected,
}: {
    selectedMappings: ExportMappingItem[] // Use new type
    setSelectedMappings: React.Dispatch<
        React.SetStateAction<ExportMappingItem[]>
    > // Use new type
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedMappings.length === 0) return null

    return (
        <>
            <StickyFooter
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
            >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400">
                            {' '}
                            <TbChecks />{' '}
                        </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">
                                {selectedMappings.length}
                            </span>{' '}
                            {/* Use selectedMappings */}
                            <span>
                                Record{selectedMappings.length > 1 ? 's' : ''}{' '}
                                selected
                            </span>{' '}
                            {/* Updated text */}
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="plain"
                            className="text-red-600 hover:text-red-500"
                            onClick={handleDeleteClick}
                        >
                            {' '}
                            Delete{' '}
                        </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedMappings.length} Record${selectedMappings.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected export record
                    {selectedMappings.length > 1 ? 's' : ''}? This action cannot
                    be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End ExportMappingSelected ---

// --- Main ExportMapping Component ---
const ExportMapping = () => {
    // Renamed Component
    const navigate = useNavigate()

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false)
    const [exportMappings, setExportMappings] =
        useState<ExportMappingItem[]>(initialDummyData) // Renamed state
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedMappings, setSelectedMappings] = useState<
        ExportMappingItem[]
    >([]) // Renamed state
    // Filter state removed
    // --- End Lifted State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...exportMappings] // Use new state name

        // --- Apply Search ---
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            // Search across relevant fields
            processedData = processedData.filter(
                (item) =>
                    item.id.toLowerCase().includes(query) ||
                    item.userName.toLowerCase().includes(query) ||
                    item.userRole.toLowerCase().includes(query) ||
                    item.exportFrom.toLowerCase().includes(query) ||
                    item.fileName.toLowerCase().includes(query) ||
                    item.reason.toLowerCase().includes(query),
                // Don't search date as string directly unless needed
            )
        }

        // --- Apply Sorting ---
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                // Sort by Date
                if (key === 'exportDate') {
                    const timeA = a.exportDate.getTime()
                    const timeB = b.exportDate.getTime()
                    return order === 'asc' ? timeA - timeB : timeB - timeA
                }

                // Default string sort for other keys
                const aValue = a[key as keyof ExportMappingItem] ?? ''
                const bValue = b[key as keyof ExportMappingItem] ?? ''

                // Ensure comparison is between strings if accessing properties like name, role etc.
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                // Add other type comparisons if needed (e.g., numbers)
                return 0
            })
            processedData = sortedData
        }

        // --- Apply Pagination ---
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const dataTotal = processedData.length
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return { pageData: dataForPage, total: dataTotal }
    }, [exportMappings, tableData]) // Use new state name in dependency
    // --- End Memoized Data Processing ---

    // --- Lifted Handlers (Update parameter types and state setters) ---
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
            setSelectedMappings([])
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

    const handleRowSelect = useCallback(
        (checked: boolean, row: ExportMappingItem) => {
            // Use new type
            setSelectedMappings((prev) => {
                // Use new state setter
                if (checked) {
                    return prev.some((i) => i.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((i) => i.id !== row.id)
                }
            })
        },
        [],
    ) // Add setSelectedMappings if linting complains

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<ExportMappingItem>[]) => {
            // Use new type
            const rowIds = new Set(rows.map((r) => r.original.id))
            if (checked) {
                const originalRows = rows.map((row) => row.original)
                setSelectedMappings((prev) => {
                    // Use new state setter
                    const existingIds = new Set(prev.map((i) => i.id))
                    const newSelection = originalRows.filter(
                        (i) => !existingIds.has(i.id),
                    )
                    return [...prev, ...newSelection]
                })
            } else {
                setSelectedMappings((prev) =>
                    prev.filter((i) => !rowIds.has(i.id)),
                ) // Use new state setter
            }
        },
        [],
    ) // Add setSelectedMappings if linting complains

    const handleEdit = useCallback(
        (mapping: ExportMappingItem) => {
            // Use new type
            console.log('Edit mapping:', mapping.id)
            // navigate(`/export-mappings/edit/${mapping.id}`);
        },
        [navigate],
    )

    const handleClone = useCallback((mappingToClone: ExportMappingItem) => {
        // Use new type
        console.log('Cloning mapping:', mappingToClone.id)
        // Decide if cloning makes sense and implement logic if kept
        // const newId = `EM${Math.floor(Math.random() * 9000) + 1000}`;
        // const clonedMapping: ExportMappingItem = { ... };
        // setExportMappings((prev) => [clonedMapping, ...prev]);
        toast.push(
            <Notification
                title="Clone not implemented"
                type="info"
                duration={2000}
            />,
        )
    }, []) // Add setExportMappings if cloning implemented

    const handleDelete = useCallback((mappingToDelete: ExportMappingItem) => {
        // Use new type
        console.log('Deleting mapping:', mappingToDelete.id)
        setExportMappings(
            (
                currentMappings, // Use new state setter
            ) =>
                currentMappings.filter(
                    (mapping) => mapping.id !== mappingToDelete.id,
                ),
        )
        setSelectedMappings(
            (
                prevSelected, // Use new state setter
            ) =>
                prevSelected.filter(
                    (mapping) => mapping.id !== mappingToDelete.id,
                ),
        )
    }, []) // Add setExportMappings, setSelectedMappings if linting complains

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected mappings:',
            selectedMappings.map((i) => i.id),
        ) // Use new state
        const selectedIds = new Set(selectedMappings.map((i) => i.id))
        setExportMappings((currentMappings) =>
            currentMappings.filter((i) => !selectedIds.has(i.id)),
        ) // Use new state setter
        setSelectedMappings([]) // Use new state setter
    }, [selectedMappings]) // Add setExportMappings, setSelectedMappings if linting complains
    // --- End Lifted Handlers ---

    // --- Define Columns in Parent ---
    const columns: ColumnDef<ExportMappingItem>[] = useMemo(
        () => [
            {
                header: 'User Name',
                accessorKey: 'userName',
                enableSorting: true,
            },
            { header: 'Role', accessorKey: 'userRole', enableSorting: true },
            {
                header: 'Exported From',
                accessorKey: 'exportFrom',
                enableSorting: true,
            },
            {
                header: 'File Name',
                accessorKey: 'fileName',
                enableSorting: true,
            },
            { header: 'Reason', accessorKey: 'reason', enableSorting: false }, // Maybe don't sort reason?
            {
                header: 'Date',
                accessorKey: 'exportDate',
                enableSorting: true,
                // Format the date for display
                cell: (props) => {
                    const date = props.row.original.exportDate
                    return (
                        <span>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString()}
                        </span>
                    )
                },
                // Sorting logic is handled in useMemo or can use a sortingFn:
                // sortingFn: (rowA, rowB, columnId) => {
                //     const timeA = rowA.original[columnId].getTime();
                //     const timeB = rowB.original[columnId].getTime();
                //     return timeA - timeB;
                // }
            },
        ],
        [handleClone, handleEdit, handleDelete], // Update dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Export Mappings</h3>{' '}
                    {/* Updated title */}
                    <ExportMappingActionTools
                        allMappings={exportMappings}
                    />{' '}
                    {/* Use updated component/prop */}
                </div>

                {/* Tools Section */}
                <div className="mb-4">
                    <ExportMappingTableTools
                        onSearchChange={handleSearchChange}
                    />{' '}
                    {/* Use updated component */}
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto">
                    <ExportMappingTable // Use updated component
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedMappings={selectedMappings} // Use updated prop
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Actions Footer */}
            <ExportMappingSelected // Use updated component
                selectedMappings={selectedMappings} // Use updated prop
                setSelectedMappings={setSelectedMappings} // Use updated prop
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default ExportMapping // Updated export name

// Helper Function
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
