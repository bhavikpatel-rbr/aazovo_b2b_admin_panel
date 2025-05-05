// src/views/your-path/MessageSenderListing.tsx (New file name)

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
import Avatar from '@/components/ui/Avatar' // Could represent channel type
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import {
    TbMail,
    TbPhone,
    TbBellRinging,
    TbBrandWhatsapp,
    TbAppWindow,
    TbAlertTriangle,
    TbCircleCheck,
    TbFilter,
    TbCloudUpload, // Icons
} from 'react-icons/tb'

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
type SenderType =
    | 'Email'
    | 'SMS'
    | 'Push-iOS'
    | 'Push-Android'
    | 'WhatsApp'
    | 'Other'
type SenderStatus = 'active' | 'inactive' | 'pending_verification'

export type MessageSenderItem = {
    id: string
    name: string // e.g., "Marketing Email", "Support SMS"
    type: SenderType
    identifier: string // e.g., "marketing@acme.com", "+15551234567"
    status: SenderStatus
    createdDate: Date
}
// --- End Item Type ---

// --- Constants ---
const senderStatusColor: Record<SenderStatus, string> = {
    active: 'text-green-600 bg-green-200',
    inactive: 'text-red-600 bg-red-200',
    pending_verification: 'text-blue-600 bg-blue-200',
}

// Map types to icons
const typeIcons: Record<SenderType, React.ElementType> = {
    Email: TbMail,
    SMS: TbPhone,
    'Push-iOS': TbBellRinging, // Example, use specific icons if available
    'Push-Android': TbBellRinging,
    WhatsApp: TbBrandWhatsapp,
    Other: TbAppWindow,
}

const initialDummySenders: MessageSenderItem[] = [
    {
        id: 'SND001',
        name: 'Marketing Email',
        type: 'Email',
        identifier: 'marketing@example.com',
        status: 'active',
        createdDate: new Date(2023, 8, 1),
    },
    {
        id: 'SND002',
        name: 'Support SMS Number',
        type: 'SMS',
        identifier: '+15559876543',
        status: 'active',
        createdDate: new Date(2023, 8, 5),
    },
    {
        id: 'SND003',
        name: 'iOS App Push Service',
        type: 'Push-iOS',
        identifier: 'com.example.app.prod',
        status: 'active',
        createdDate: new Date(2023, 7, 10),
    },
    {
        id: 'SND004',
        name: 'Android App Push Service',
        type: 'Push-Android',
        identifier: 'com.example.app.prod',
        status: 'active',
        createdDate: new Date(2023, 9, 15),
    },
    {
        id: 'SND005',
        name: 'Transactional Email',
        type: 'Email',
        identifier: 'noreply@example.com',
        status: 'active',
        createdDate: new Date(2023, 6, 20),
    },
    {
        id: 'SND006',
        name: 'Sales WhatsApp',
        type: 'WhatsApp',
        identifier: '+15551112233',
        status: 'inactive',
        createdDate: new Date(2023, 9, 25),
    },
    {
        id: 'SND007',
        name: 'Backup SMS Number',
        type: 'SMS',
        identifier: '+15553334444',
        status: 'active',
        createdDate: new Date(2023, 10, 1),
    },
    {
        id: 'SND008',
        name: 'Dev Test Email',
        type: 'Email',
        identifier: 'dev-test@example.com',
        status: 'inactive',
        createdDate: new Date(2023, 5, 5),
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone,
    onChangeStatus,
    onDelete,
    // onVerify, // Example for specific actions
}: {
    onEdit: () => void
    onClone?: () => void
    onChangeStatus: () => void
    onDelete: () => void
    // onVerify?: () => void;
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
            {/* {onVerify && ( <Tooltip title="Verify Sender"><Button shape="circle" variant="plain" size="sm" icon={<TbCircleCheck />} onClick={onVerify} /> </Tooltip> )} */}
            {/* {onClone && (
                <Tooltip title="Clone Sender">
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
            )} */}
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
            <Tooltip title="Edit Sender">
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
            <Tooltip title="Delete Sender">
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

// --- SenderTable Component ---
const SenderTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedSenders,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<MessageSenderItem>[]
    data: MessageSenderItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedSenders: MessageSenderItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: MessageSenderItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<MessageSenderItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedSenders.some((selected) => selected.id === row.id)
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
// --- End SenderTable ---

// --- SenderSearch Component ---
type SenderSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const SenderSearch = React.forwardRef<HTMLInputElement, SenderSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Quick Search..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
SenderSearch.displayName = 'SenderSearch'
// --- End SenderSearch ---

// --- SenderTableTools Component ---
const SenderTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <div className="flex-grow">
                <SenderSearch onInputChange={onSearchChange} />
            </div>
            <Button icon={<TbFilter />} className=''>
                Filter
            </Button>
            <Button icon={<TbCloudUpload/>}>Export</Button>
        </div>
    )
    // Filters could be added here
}
// --- End SenderTableTools ---

// --- SenderActionTools Component ---
const SenderActionTools = ({
    allSenders,
}: {
    allSenders: MessageSenderItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allSenders.map((s) => ({
                ...s,
                createdDate: s.createdDate.toISOString(),
            })),
        [allSenders],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Type', key: 'type' },
        { label: 'Identifier', key: 'identifier' },
        { label: 'Status', key: 'status' },
        { label: 'Created Date', key: 'createdDate' },
    ]
    const handleAdd = () => navigate('/message-senders/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block>
                {' '}
                Add New{' '}
            </Button>{' '}
        </div>
    )
}
// --- End SenderActionTools ---

// --- SenderSelected Component ---
const SenderSelected = ({
    selectedSenders,
    setSelectedSenders,
    onDeleteSelected,
}: {
    selectedSenders: MessageSenderItem[]
    setSelectedSenders: React.Dispatch<
        React.SetStateAction<MessageSenderItem[]>
    >
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedSenders.length === 0) return null

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
                                {selectedSenders.length}
                            </span>
                            <span>
                                Sender{selectedSenders.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedSenders.length} Sender${selectedSenders.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected sender
                    {selectedSenders.length > 1 ? 's' : ''}? This action cannot
                    be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End SenderSelected ---

// --- Main MessageSenderListing Component ---
const MessageSenderListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [senders, setSenders] =
        useState<MessageSenderItem[]>(initialDummySenders)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedSenders, setSelectedSenders] = useState<MessageSenderItem[]>(
        [],
    )
    // Filter state could be added here
    // const [filterData, setFilterData] = useState<FilterFormSchema>(filterValidationSchema.parse({}));
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...senders]

        // Apply Filtering (if added)
        // if (filterData.status && filterData.status.length > 0) { ... }
        // if (filterData.type && filterData.type.length > 0) { ... }

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (s) =>
                    s.id.toLowerCase().includes(query) ||
                    s.name.toLowerCase().includes(query) ||
                    s.type.toLowerCase().includes(query) ||
                    s.identifier.toLowerCase().includes(query) ||
                    s.status.toLowerCase().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'createdDate') {
                    return order === 'asc'
                        ? a.createdDate.getTime() - b.createdDate.getTime()
                        : b.createdDate.getTime() - a.createdDate.getTime()
                }
                const aValue = a[key as keyof MessageSenderItem] ?? ''
                const bValue = b[key as keyof MessageSenderItem] ?? ''
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
    }, [senders, tableData /*, filterData */]) // Add filterData dependency if filter added
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
            setSelectedSenders([])
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
    // Filter handler would go here
    // const handleApplyFilter = useCallback((newFilterData: FilterFormSchema) => { ... }, [tableData, handleSetTableData]);

    const handleRowSelect = useCallback(
        (checked: boolean, row: MessageSenderItem) => {
            setSelectedSenders((prev) => {
                if (checked) {
                    return prev.some((s) => s.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((s) => s.id !== row.id)
                }
            })
        },
        [setSelectedSenders],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<MessageSenderItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedSenders((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((s) => s.id))
                    const newSelection = originalRows.filter(
                        (s) => !existingIds.has(s.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((s) => !rowIds.has(s.id))
                }
            })
        },
        [setSelectedSenders],
    )

    const handleEdit = useCallback(
        (sender: MessageSenderItem) => {
            console.log('Edit sender:', sender.id)
            navigate(`/message-senders/edit/${sender.id}`)
        },
        [navigate],
    )

    const handleClone = useCallback(
        (senderToClone: MessageSenderItem) => {
            console.log('Cloning sender:', senderToClone.id)
            const newId = `SND${Math.floor(Math.random() * 9000) + 1000}`
            const clonedSender: MessageSenderItem = {
                ...senderToClone,
                id: newId,
                name: `${senderToClone.name} (Copy)`,
                status: 'inactive',
                createdDate: new Date(),
            }
            setSenders((prev) => [clonedSender, ...prev])
            toast.push(
                <Notification
                    title="Sender Cloned"
                    type="success"
                    duration={2000}
                />,
            )
        },
        [setSenders],
    )

    const handleChangeStatus = useCallback(
        (sender: MessageSenderItem) => {
            const statuses: SenderStatus[] = [
                'active',
                'inactive',
                'pending_verification',
            ]
            const currentStatusIndex = statuses.indexOf(sender.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
            console.log(
                `Changing status of sender ${sender.id} to ${newStatus}`,
            )
            setSenders((current) =>
                current.map((s) =>
                    s.id === sender.id ? { ...s, status: newStatus } : s,
                ),
            )
            toast.push(
                <Notification
                    title="Status Changed"
                    type="success"
                    duration={2000}
                >{`Sender '${sender.name}' status changed to ${newStatus}.`}</Notification>,
            )
        },
        [setSenders],
    )

    const handleDelete = useCallback(
        (senderToDelete: MessageSenderItem) => {
            console.log('Deleting sender:', senderToDelete.id)
            setSenders((current) =>
                current.filter((s) => s.id !== senderToDelete.id),
            )
            setSelectedSenders((prev) =>
                prev.filter((s) => s.id !== senderToDelete.id),
            )
            toast.push(
                <Notification
                    title="Sender Deleted"
                    type="success"
                    duration={2000}
                >{`Sender '${senderToDelete.name}' deleted.`}</Notification>,
            )
        },
        [setSenders, setSelectedSenders],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected senders:',
            selectedSenders.map((s) => s.id),
        )
        const selectedIds = new Set(selectedSenders.map((s) => s.id))
        setSenders((current) => current.filter((s) => !selectedIds.has(s.id)))
        setSelectedSenders([])
        toast.push(
            <Notification
                title="Senders Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} sender(s) deleted.`}</Notification>,
        )
    }, [selectedSenders, setSenders, setSelectedSenders])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<MessageSenderItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                size: 70,
            },
            {
                header: 'Message Title',
                accessorKey: 'name',
                enableSorting: true,
                cell: (props) => {
                    const { name, type } = props.row.original
                    const Icon = typeIcons[type] || TbAppWindow // Fallback icon
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar
                                size={28}
                                shape="circle"
                                className="bg-gray-200 dark:bg-gray-600"
                            >
                                {' '}
                                <Icon className="text-lg" />{' '}
                            </Avatar>
                            <span className="font-semibold">{name}</span>
                        </div>
                    )
                },
            },
            {
                header: 'Type',
                accessorKey: 'type',
                enableSorting: true,
                size: 140,
            },
            {
                header: 'Sender',
                accessorKey: 'identifier',
                enableSorting: true,
            }, // e.g., email, phone number
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                size: 100,
                cell: (props) => {
                    const { status } = props.row.original
                    const displayStatus = status
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return (
                        <Tag
                            className={`${senderStatusColor[status]} capitalize`}
                        >
                            {displayStatus}
                        </Tag>
                    )
                },
            },
            // { header: 'Created Date', ... }, // Optional
            {
                header: 'Action',
                id: 'action',
                size: 130,
                meta : {HeaderClass : "text-center"},
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onClone={() => handleClone(props.row.original)} // Pass optional clone
                    />
                ),
            },
        ],
        [handleEdit, handleDelete, handleChangeStatus, handleClone], // Dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Message Senders</h5>
                    <SenderActionTools allSenders={senders} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <SenderTableTools
                        onSearchChange={handleSearchChange}
                        // Pass filter props if filter is added
                        // filterData={filterData}
                        // setFilterData={handleApplyFilter}
                    />
                </div>

                {/* Active Filters Display Area (if filter added later) */}
                {/* <ActiveFiltersDisplay ... /> */}

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <SenderTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedSenders={selectedSenders}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <SenderSelected
                selectedSenders={selectedSenders}
                setSelectedSenders={setSelectedSenders}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default MessageSenderListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
