// src/views/your-path/InquiriesListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
// import Tag from '@/components/ui/Tag'; // Might be used for status later
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog' // Keep for potential view details modal
import Avatar from '@/components/ui/Avatar' // Use for Name initial
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbUserCircle, TbMessageQuestion } from 'react-icons/tb' // Icons

// Icons
import {
    TbPencil, // Edit
    TbTrash, // Delete
    TbEye, // View Details
    TbChecks, // Selected Footer
    TbSearch,
    TbCloudDownload, // Optional export
    TbPlus, // Optional Add
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
export type InquiryItem = {
    id: string // Unique ID for the inquiry
    name: string
    email: string
    phone: string | null
    quantity: number | string | null // Can be a number or text like 'Bulk', 'Undecided'
    requirement: string // The actual inquiry message/details
    date: Date // Date the inquiry was received
    // Optional: Add a status field later if needed (e.g., 'new', 'contacted', 'closed')
    // status?: 'new' | 'contacted' | 'closed';
}
// --- End Item Type ---

// --- Constants ---
// Status colors could be added here if status field is included

const initialDummyInquiries: InquiryItem[] = [
    {
        id: 'INQ001',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1-555-123-4567',
        quantity: 100,
        requirement:
            'Need pricing for bulk order of Model X widgets for Q1 delivery.',
        date: new Date(2023, 10, 5, 10, 30),
    },
    {
        id: 'INQ002',
        name: 'Maria Garcia',
        email: 'maria.g@mail.net',
        phone: null,
        quantity: 1,
        requirement:
            'Interested in learning more about the Pro subscription features.',
        date: new Date(2023, 10, 4, 15, 0),
    },
    {
        id: 'INQ003',
        name: 'Ahmed Khan',
        email: 'akhan@company.co',
        phone: '+44-20-7777-8888',
        quantity: 'Undecided',
        requirement: 'Requesting a demo of the enterprise software solution.',
        date: new Date(2023, 10, 4, 9, 15),
    },
    {
        id: 'INQ004',
        name: 'Chen Wei',
        email: 'chen.wei@domain.org',
        phone: '+86-10-1234-5678',
        quantity: 5,
        requirement:
            'Enquiring about customization options for the gaming chair.',
        date: new Date(2023, 10, 3, 17, 40),
    },
    {
        id: 'INQ005',
        name: 'Fatima Al Fassi',
        email: 'fatima.fassi@mail.ae',
        phone: null,
        quantity: null,
        requirement:
            'Partnership inquiry regarding distribution in the MENA region.',
        date: new Date(2023, 10, 3, 11, 25),
    },
    {
        id: 'INQ006',
        name: 'David Lee',
        email: 'dlee@techcorp.io',
        phone: '+1-650-555-0011',
        quantity: 'Bulk',
        requirement:
            'Require detailed specifications and volume discount for component Z.',
        date: new Date(2023, 10, 2, 14, 10),
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onView,
    onEdit,
    onDelete,
}: {
    onView: () => void // View details action
    onEdit: () => void
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-end gap-2">
            <Tooltip title="View Inquiry">
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
            <Tooltip title="Edit Inquiry">
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
            <Tooltip title="Delete Inquiry">
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

// --- InquiryTable Component ---
const InquiryTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedInquiries,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<InquiryItem>[]
    data: InquiryItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedInquiries: InquiryItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: InquiryItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<InquiryItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedInquiries.some((selected) => selected.id === row.id)
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
// --- End InquiryTable ---

// --- InquirySearch Component ---
type InquirySearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const InquirySearch = React.forwardRef<HTMLInputElement, InquirySearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Search Inquiries (Name, Email, Phone, Req...)"
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
InquirySearch.displayName = 'InquirySearch'
// --- End InquirySearch ---

// --- InquiryTableTools Component ---
const InquiryTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <InquirySearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
    // Filter button could be added here
}
// --- End InquiryTableTools ---

// --- InquiryActionTools Component ---
const InquiryActionTools = ({
    allInquiries,
}: {
    allInquiries: InquiryItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () => allInquiries.map((i) => ({ ...i, date: i.date.toISOString() })),
        [allInquiries],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Requirement', key: 'requirement' },
        { label: 'Date', key: 'date' },
    ]
    const handleAdd = () => console.log('Add Inquiry action needed') //navigate('/inquiries/create');

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block>
                {' '}
                Add new Inquiry{' '}
            </Button>{' '}
        </div>
    )
}
// --- End InquiryActionTools ---

// --- InquirySelected Component ---
const InquirySelected = ({
    selectedInquiries,
    setSelectedInquiries,
    onDeleteSelected,
}: {
    selectedInquiries: InquiryItem[]
    setSelectedInquiries: React.Dispatch<React.SetStateAction<InquiryItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedInquiries.length === 0) return null

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
                                {selectedInquiries.length}
                            </span>
                            <span>
                                Inquir
                                {selectedInquiries.length > 1 ? 'ies' : 'y'}{' '}
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
                title={`Delete ${selectedInquiries.length} Inquir${selectedInquiries.length > 1 ? 'ies' : 'y'}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected inquiry
                    {selectedInquiries.length > 1 ? 's' : ''}? This action
                    cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End InquirySelected ---

// --- Detail View Dialog ---
const DetailViewDialog = ({
    isOpen,
    onClose,
    inquiry,
}: {
    isOpen: boolean
    onClose: () => void
    inquiry: InquiryItem | null
}) => {
    if (!inquiry) return null

    return (
        <Dialog
            isOpen={isOpen}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
            width={600} // Adjust width
            onClose={onClose}
            onRequestClose={onClose}
        >
            <h5 className="mb-4">Inquiry Details (ID: {inquiry.id})</h5>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <p>
                    <strong>Name:</strong> {inquiry.name}
                </p>
                <p>
                    <strong>Email:</strong> {inquiry.email}
                </p>
                <p>
                    <strong>Phone:</strong> {inquiry.phone ?? 'N/A'}
                </p>
                <p>
                    <strong>Quantity:</strong>{' '}
                    {inquiry.quantity?.toString() ?? 'N/A'}
                </p>
                <p>
                    <strong>Received:</strong> {inquiry.date.toLocaleString()}
                </p>
                {/* Add Status here if implemented */}
                {/* <p><strong>Status:</strong> <Tag>{inquiry.status}</Tag></p> */}
            </div>
            <div className="mt-4">
                <h6 className="mb-2 font-semibold">Requirement:</h6>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    {inquiry.requirement}
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
// --- End Detail View Dialog ---

// --- Main InquiriesListing Component ---
const InquiriesListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [inquiries, setInquiries] = useState<InquiryItem[]>(
        initialDummyInquiries,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedInquiries, setSelectedInquiries] = useState<InquiryItem[]>(
        [],
    )
    const [detailViewOpen, setDetailViewOpen] = useState(false)
    const [currentItemForView, setCurrentItemForView] =
        useState<InquiryItem | null>(null)
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...inquiries]

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (i) =>
                    i.id.toLowerCase().includes(query) ||
                    i.name.toLowerCase().includes(query) ||
                    i.email.toLowerCase().includes(query) ||
                    (i.phone?.toLowerCase().includes(query) ?? false) ||
                    i.requirement.toLowerCase().includes(query) ||
                    i.quantity?.toString().toLowerCase().includes(query),
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
                // Handle potential number/string quantity sort
                if (key === 'quantity') {
                    const valA = a.quantity
                    const valB = b.quantity
                    if (typeof valA === 'number' && typeof valB === 'number') {
                        return order === 'asc' ? valA - valB : valB - valA
                    }
                    // Basic string sort for 'Bulk' etc., numbers first
                    if (typeof valA === 'number') return -1
                    if (typeof valB === 'number') return 1
                    return order === 'asc'
                        ? String(valA ?? '').localeCompare(String(valB ?? ''))
                        : String(valB ?? '').localeCompare(String(valA ?? ''))
                }

                const aValue = a[key as keyof InquiryItem] ?? ''
                const bValue = b[key as keyof InquiryItem] ?? ''
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
    }, [inquiries, tableData])
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
            setSelectedInquiries([])
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
        (checked: boolean, row: InquiryItem) => {
            setSelectedInquiries((prev) => {
                if (checked) {
                    return prev.some((i) => i.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((i) => i.id !== row.id)
                }
            })
        },
        [setSelectedInquiries],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<InquiryItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedInquiries((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((i) => i.id))
                    const newSelection = originalRows.filter(
                        (i) => !existingIds.has(i.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((i) => !rowIds.has(i.id))
                }
            })
        },
        [setSelectedInquiries],
    )

    const handleViewDetails = useCallback((item: InquiryItem) => {
        setCurrentItemForView(item)
        setDetailViewOpen(true)
    }, [])

    const handleCloseDetailView = useCallback(() => {
        setDetailViewOpen(false)
        setCurrentItemForView(null)
    }, [])

    const handleEdit = useCallback(
        (inquiry: InquiryItem) => {
            console.log('Edit inquiry:', inquiry.id)
            // navigate(`/inquiries/edit/${inquiry.id}`); // Example route
        },
        [navigate],
    )

    const handleDelete = useCallback(
        (inquiryToDelete: InquiryItem) => {
            console.log('Deleting inquiry:', inquiryToDelete.id)
            setInquiries((current) =>
                current.filter((i) => i.id !== inquiryToDelete.id),
            )
            setSelectedInquiries((prev) =>
                prev.filter((i) => i.id !== inquiryToDelete.id),
            )
            toast.push(
                <Notification
                    title="Inquiry Deleted"
                    type="success"
                    duration={2000}
                >{`Inquiry from ${inquiryToDelete.name} deleted.`}</Notification>,
            )
        },
        [setInquiries, setSelectedInquiries],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected inquiries:',
            selectedInquiries.map((i) => i.id),
        )
        const selectedIds = new Set(selectedInquiries.map((i) => i.id))
        setInquiries((current) => current.filter((i) => !selectedIds.has(i.id)))
        setSelectedInquiries([])
        toast.push(
            <Notification
                title="Inquiries Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} inquiry(s) deleted.`}</Notification>,
        )
    }, [selectedInquiries, setInquiries, setSelectedInquiries])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<InquiryItem>[] = useMemo(
        () => [
            {
                header: 'Name',
                accessorKey: 'name',
                enableSorting: true,
                cell: (props) => {
                    const { name } = props.row.original
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar
                                size={28}
                                shape="circle"
                                icon={<TbUserCircle />}
                            />
                            <span>{name}</span>
                        </div>
                    )
                },
            },
            { header: 'Email', accessorKey: 'email', enableSorting: true },
            {
                header: 'Phone',
                accessorKey: 'phone',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.phone ?? '-'}</span>,
            },
            {
                header: 'Quantity',
                accessorKey: 'quantity',
                enableSorting: true,
                width: 100,
                cell: (props) => (
                    <span>
                        {props.row.original.quantity?.toString() ?? '-'}
                    </span>
                ),
            },
            {
                header: 'Requirement',
                accessorKey: 'requirement',
                enableSorting: false, // Usually don't sort by long text
                cell: (props) => (
                    <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
                        {props.row.original.requirement}
                    </span>
                ),
            },
            {
                header: 'Date Received',
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
            // { header: 'Status', ... }, // Add Status column if implemented
            {
                header: '',
                id: 'action',
                width: 100,
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleViewDetails(props.row.original)}
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleViewDetails, handleEdit, handleDelete], // Dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Inquiries Listing</h3>
                    <InquiryActionTools allInquiries={inquiries} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <InquiryTableTools onSearchChange={handleSearchChange} />
                </div>

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <InquiryTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedInquiries={selectedInquiries} // Use correct state variable
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <InquirySelected
                selectedInquiries={selectedInquiries} // Use correct state variable
                setSelectedInquiries={setSelectedInquiries} // Use correct state setter
                onDeleteSelected={handleDeleteSelected}
            />

            {/* Detail View Dialog */}
            <DetailViewDialog
                isOpen={detailViewOpen}
                onClose={handleCloseDetailView}
                inquiry={currentItemForView}
            />
        </Container>
    )
}
// --- End Main Component ---

export default InquiriesListing // Updated export name

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
