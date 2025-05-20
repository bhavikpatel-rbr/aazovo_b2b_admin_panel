// src/views/your-path/InquiriesListing;.tsx (Consider renaming the file to reflect its content)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'
// import { CSVLink } from 'react-csv' // Uncomment if you want CSV export

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar' // Can be used for initials or a generic icon
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'

// Icons
import {
    TbPencil,
    TbTrash,
    TbEye,
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbPlus,
    TbCopy,
    TbSwitchHorizontal,
    TbUserCircle, // For contact person
    TbBuilding, // For company
    TbMail,
    TbPhone,
    TbFileText, // For attachments or descriptions
    TbCalendarEvent,
    TbAlertTriangle, // For priority
    TbProgressCheck, // For inquiry status
    TbUserCheck, // For assigned to
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Form Type (from original FormListTable) ---
export type FormItem = {
    id: string
    inquiry_id: string
    company_name: string
    contact_person_name: string
    contact_person_email: string
    contact_person_phone: string
    inquiry_type: string
    inquiry_subject: string
    inquiry_description: string
    inquiry_priority: string // 'High', 'Medium', 'Low'
    inquiry_status: string // 'New', 'In Progress', 'Resolved', 'Closed'
    assigned_to: string
    inquiry_date: string
    response_date: string
    resolution_date: string
    follow_up_date: string
    feedback_status: string
    inquiry_resolution: string
    inquiry_attachments: string[]
    status: 'active' | 'inactive' // Overall record status
}
// --- End Form Type Definition ---

// --- Status Colors ---
const recordStatusColor: Record<FormItem['status'], string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-100',
    inactive: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100',
}

const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
    Low: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
}

const inquiryStatusColors: Record<string, string> = {
    New: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    Resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    Closed: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
    default: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
}
// --- End Status Colors ---

// --- Initial Dummy Data (from original FormListTable) ---
const initialDummyForms: FormItem[] = [
    {
        id: 'F123',
        inquiry_id: 'INQ001',
        company_name: 'TechSoft Solutions',
        contact_person_name: 'Alice Johnson',
        contact_person_email: 'alice.johnson@techsoft.com',
        contact_person_phone: '+1-555-123-4567',
        inquiry_type: 'Product',
        inquiry_subject: 'Request for product pricing',
        inquiry_description: 'We are interested in getting a quotation for your enterprise software solution. This is a detailed description that might be long and require truncation.',
        inquiry_priority: 'High',
        inquiry_status: 'New',
        assigned_to: 'Sales Team',
        inquiry_date: '2025-05-01',
        response_date: '2025-05-02',
        resolution_date: '',
        follow_up_date: '2025-05-05',
        feedback_status: 'Pending',
        inquiry_resolution: '',
        inquiry_attachments: [
        'https://example.com/attachments/inquiry001/file1.pdf',
        'https://example.com/attachments/inquiry001/file2.png',
        ],
        status: 'active',
    },
    {
        id: 'F124',
        inquiry_id: 'INQ002',
        company_name: 'GreenLeaf Corp',
        contact_person_name: 'Bob Smith',
        contact_person_email: 'bob@greenleaf.com',
        contact_person_phone: '+44-20-7946-0958',
        inquiry_type: 'Service',
        inquiry_subject: 'Technical support needed',
        inquiry_description: 'We are facing issues with our integration and need technical assistance. Another long description to test the line clamp feature.',
        inquiry_priority: 'Medium',
        inquiry_status: 'In Progress',
        assigned_to: 'Tech Support',
        inquiry_date: '2025-04-28',
        response_date: '2025-04-29',
        resolution_date: '',
        follow_up_date: '2025-05-03',
        feedback_status: 'Pending',
        inquiry_resolution: '',
        inquiry_attachments: [],
        status: 'active',
    },
    {
        id: 'F125',
        inquiry_id: 'INQ003',
        company_name: 'BlueOcean Ltd.',
        contact_person_name: 'Clara Lee',
        contact_person_email: 'clara.lee@blueocean.com',
        contact_person_phone: '+91-9876543210',
        inquiry_type: 'General',
        inquiry_subject: 'Partnership inquiry',
        inquiry_description: 'We are exploring potential partnership opportunities with your company. This inquiry has been resolved and further details are available in the resolution notes.',
        inquiry_priority: 'Low',
        inquiry_status: 'Resolved',
        assigned_to: 'Partnership Team',
        inquiry_date: '2025-03-15',
        response_date: '2025-03-16',
        resolution_date: '2025-03-18',
        follow_up_date: '2025-03-25',
        feedback_status: 'Received',
        inquiry_resolution: 'Provided details and scheduled a follow-up call. The partnership proposal was shared and accepted.',
        inquiry_attachments: [
        'https://example.com/attachments/inquiry003/proposal.pdf',
        ],
        status: 'inactive',
    },
]
// --- End Dummy Data ---

// --- Helper Components ---
const FormattedDate = ({ dateString, label }: { dateString?: string, label?: string }) => {
    if (!dateString) return <span className="text-xs text-gray-500 dark:text-gray-400">{label ? `${label}: N/A` : 'N/A'}</span>
    try {
        return (
            <span className="text-xs">
                {label && <span className="font-semibold text-gray-700 dark:text-gray-300">{label}: </span>}
                {new Date(dateString).toLocaleDateString()}
            </span>
        )
    } catch (e) {
        return <span className="text-xs text-red-500">{label ? `${label}: Invalid Date` : 'Invalid Date'}</span>
    }
}

const InfoLine = ({ icon, text, href, title }: { icon?: React.ReactNode, text?: string | null, href?: string, title?: string }) => {
    if (!text) return null
    const content = (
        <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
            {icon && <span className="text-gray-500 dark:text-gray-400">{icon}</span>}
            <span className="truncate" title={title || text}>{text}</span>
        </span>
    )
    if (href) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 dark:text-blue-400">{content}</a>
    }
    return content
}
// --- End Helper Components ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onView,
    onEdit,
    onClone,
    onChangeStatus,
    onDelete,
}: {
    onView: () => void
    onEdit: () => void
    onClone: () => void
    onChangeStatus: () => void
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-end gap-1">
             <Tooltip title="View Details">
                <div
                    className={classNames(
                        iconButtonClass, hoverBgClass,
                        'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                    )} role="button" onClick={onView} >
                    <TbEye />
                </div>
            </Tooltip>
            <Tooltip title="Edit Inquiry">
                <div
                    className={classNames(
                        iconButtonClass, hoverBgClass,
                        'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400',
                    )} role="button" onClick={onEdit} >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Clone Inquiry">
                <div
                    className={classNames(
                        iconButtonClass, hoverBgClass,
                        'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400',
                    )} role="button" onClick={onClone} >
                    <TbCopy />
                </div>
            </Tooltip>
            <Tooltip title="Change Record Status">
                <div
                    className={classNames(
                        iconButtonClass, hoverBgClass,
                        'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400',
                    )} role="button" onClick={onChangeStatus} >
                    <TbSwitchHorizontal />
                </div>
            </Tooltip>
            <Tooltip title="Delete Inquiry">
                <div
                    className={classNames(
                        iconButtonClass, hoverBgClass,
                        'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400',
                    )} role="button" onClick={onDelete} >
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    )
}
// --- End ActionColumn ---

// --- FormTable Component (Wrapper for DataTable) ---
const FormsTable = ({
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
}: {
    columns: ColumnDef<FormItem>[]
    data: FormItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedItems: FormItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: FormItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<FormItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
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
            noData={!loading && data.length === 0}
        />
    )
}
// --- End FormTable ---

// --- FormSearch Component ---
type FormSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const FormSearch = React.forwardRef<HTMLInputElement, FormSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Search Inquiries (ID, Company, Contact, Subject...)"
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
FormSearch.displayName = 'FormSearch'
// --- End FormSearch ---

// --- FormTableTools Component ---
const FormTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <FormSearch onInputChange={onSearchChange} />
            </div>
            {/* Future filter button can go here */}
        </div>
    )
}
// --- End FormTableTools ---

// --- FormActionTools Component ---
const FormActionTools = ({
    allItems, // For potential export
}: {
    allItems: FormItem[]
}) => {
    const navigate = useNavigate()
    // const csvData = useMemo(() => allItems.map(item => ({ ...item, inquiry_attachments: item.inquiry_attachments.join('; ') })), [allItems]);
    // const csvHeaders = Object.keys(initialDummyForms[0] || {}).map(key => ({ label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), key: key }));

    const handleAdd = () => {
        console.log('Navigate to Add New Inquiry Page')
        // navigate('/app/inquiries/new'); // Example navigation
        toast.push(
            <Notification title="Action Required" type="info">
                Navigation to 'Add New Inquiry' page is not yet implemented.
            </Notification>
        )
    }

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink data={csvData} headers={csvHeaders} filename="inquiries_export.csv">
                <Button variant="default" icon={<TbCloudDownload />}>Export CSV</Button>
            </CSVLink> */}
            <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block>
                Add New Inquiry
            </Button>
        </div>
    )
}
// --- End FormActionTools ---

// --- FormSelectedFooter Component ---
const FormSelectedFooter = ({
    selectedItems,
    onDeleteSelected,
}: {
    selectedItems: FormItem[]
    onDeleteSelected: () => void
}) => {
    const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
    const handleDeleteClick = () => setBulkDeleteConfirmOpen(true)
    const handleCancelDelete = () => setBulkDeleteConfirmOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setBulkDeleteConfirmOpen(false)
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
                                Inquir{selectedItems.length > 1 ? 'ies' : 'y'} selected
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
                isOpen={bulkDeleteConfirmOpen}
                type="danger"
                title={`Delete ${selectedItems.length} Inquir${selectedItems.length > 1 ? 'ies' : 'y'}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected {selectedItems.length > 1 ? 'inquiries' : 'inquiry'}? This action cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End FormSelectedFooter ---

// --- DetailViewDialog ---
const DetailViewDialog = ({
    isOpen,
    onClose,
    item,
}: {
    isOpen: boolean
    onClose: () => void
    item: FormItem | null
}) => {
    if (!item) return null

    const DetailSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
        <div className="mb-3">
            <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">{title}</h6>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">{children}</div>
        </div>
    );

    return (
        <Dialog
            isOpen={isOpen}
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
            width={700}
            onClose={onClose}
            onRequestClose={onClose}
        >
            <div className="p-1">
                <h5 className="mb-4">Inquiry Details - {item.inquiry_id}</h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    <DetailSection title="Inquiry Info">
                        <p><strong>ID:</strong> {item.id}</p>
                        <p><strong>Subject:</strong> {item.inquiry_subject}</p>
                        <p><strong>Type:</strong> {item.inquiry_type}</p>
                        <p><strong>Record Status:</strong> <Tag className={`${recordStatusColor[item.status]} capitalize`}>{item.status}</Tag></p>
                    </DetailSection>

                    <DetailSection title="Company & Contact">
                        <p><strong>Company:</strong> {item.company_name}</p>
                        <p><strong>Contact:</strong> {item.contact_person_name}</p>
                        <p><strong>Email:</strong> <a href={`mailto:${item.contact_person_email}`} className="text-blue-600 hover:underline">{item.contact_person_email}</a></p>
                        <p><strong>Phone:</strong> {item.contact_person_phone || 'N/A'}</p>
                    </DetailSection>

                    <DetailSection title="Status & Assignment">
                        <p><strong>Priority:</strong> <Tag className={`${priorityColors[item.inquiry_priority] || priorityColors.default} capitalize`}>{item.inquiry_priority}</Tag></p>
                        <p><strong>Inquiry Status:</strong> <Tag className={`${inquiryStatusColors[item.inquiry_status] || inquiryStatusColors.default} capitalize`}>{item.inquiry_status}</Tag></p>
                        <p><strong>Assigned To:</strong> {item.assigned_to}</p>
                        <p><strong>Feedback Status:</strong> {item.feedback_status}</p>
                    </DetailSection>

                    <DetailSection title="Dates">
                        <FormattedDate label="Inquiry Date" dateString={item.inquiry_date} />
                        <FormattedDate label="Response Date" dateString={item.response_date} />
                        <FormattedDate label="Resolution Date" dateString={item.resolution_date} />
                        <FormattedDate label="Follow-up Date" dateString={item.follow_up_date} />
                    </DetailSection>
                </div>

                <DetailSection title="Description">
                    <p className="whitespace-pre-wrap p-2 bg-gray-50 dark:bg-gray-700 rounded">{item.inquiry_description || 'N/A'}</p>
                </DetailSection>

                <DetailSection title="Resolution Notes">
                    <p className="whitespace-pre-wrap p-2 bg-gray-50 dark:bg-gray-700 rounded">{item.inquiry_resolution || 'N/A'}</p>
                </DetailSection>

                <DetailSection title="Attachments">
                    {item.inquiry_attachments.length > 0 ? (
                        <ul className="list-disc list-inside">
                            {item.inquiry_attachments.map((url, index) => (
                                <li key={index}>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        Attachment {index + 1}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : <p>No attachments.</p>}
                </DetailSection>

                <div className="text-right mt-6">
                    <Button variant="solid" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}
// --- End DetailViewDialog ---

// --- Main InquiriesListing; Component ---
const InquiriesListing; = () => {
    const navigate = useNavigate()

    const [isLoading, setIsLoading] = useState(false)
    const [forms, setForms] = useState<FormItem[]>(initialDummyForms)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedForms, setSelectedForms] = useState<FormItem[]>([])
    const [detailViewOpen, setDetailViewOpen] = useState(false)
    const [currentItemForView, setCurrentItemForView] = useState<FormItem | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<FormItem | null>(null)


    const { pageData, total } = useMemo(() => {
        let processedData = [...forms]
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = forms.filter((form) =>
                Object.values(form).some((value) => {
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(query)
                    }
                    if (Array.isArray(value)) { // For inquiry_attachments
                        return value.some((item) => String(item).toLowerCase().includes(query))
                    }
                    return false
                }),
            )
        }

        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            processedData.sort((a, b) => {
                const aValue = a[key as keyof FormItem] ?? ''
                const bValue = b[key as keyof FormItem] ?? ''
                if (key === 'inquiry_date' || key === 'response_date' || key === 'resolution_date' || key === 'follow_up_date') {
                     // Date sorting needs actual Date objects or careful string comparison (YYYY-MM-DD format helps)
                    const dateA = new Date(aValue as string).getTime();
                    const dateB = new Date(bValue as string).getTime();
                    if (isNaN(dateA) && isNaN(dateB)) return 0;
                    if (isNaN(dateA)) return order === 'asc' ? 1 : -1; // empty dates last on asc
                    if (isNaN(dateB)) return order === 'asc' ? -1 : 1; // empty dates first on desc
                    return order === 'asc' ? dateA - dateB : dateB - dateA;
                }
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                return 0
            })
        }

        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const dataTotal = processedData.length
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(startIndex, startIndex + pageSize)
        return { pageData: dataForPage, total: dataTotal }
    }, [forms, tableData])

    const handleSetTableData = useCallback((data: TableQueries) => {
        setTableData(data)
    }, [])

    const handlePaginationChange = useCallback((page: number) => {
        handleSetTableData(cloneDeep({ ...tableData, pageIndex: page }))
    }, [tableData, handleSetTableData])

    const handleSelectChange = useCallback((value: number) => {
        handleSetTableData(cloneDeep({ ...tableData, pageSize: Number(value), pageIndex: 1 }))
        setSelectedForms([])
    }, [tableData, handleSetTableData])

    const handleSort = useCallback((sort: OnSortParam) => {
        handleSetTableData(cloneDeep({ ...tableData, sort: sort, pageIndex: 1 }))
    }, [tableData, handleSetTableData])

    const handleSearchChange = useCallback((query: string) => {
        handleSetTableData(cloneDeep({ ...tableData, query: query, pageIndex: 1 }))
    }, [tableData, handleSetTableData])

    const handleRowSelect = useCallback((checked: boolean, row: FormItem) => {
        setSelectedForms((prev) => {
            if (checked) {
                return prev.some((f) => f.id === row.id) ? prev : [...prev, row]
            } else {
                return prev.filter((f) => f.id !== row.id)
            }
        })
    }, [])

    const handleAllRowSelect = useCallback((checked: boolean, rows: Row<FormItem>[]) => {
        // This logic ensures that "select all" only applies to the current page's visible and filtered data if that's the desired UX
        // For true "select all across pages", you'd need different state management or pass all data to DataTable.
        const currentDataIds = new Set(pageData.map(item => item.id));
        if (checked) {
            const rowsToAdd = rows.map((row) => row.original).filter(item => currentDataIds.has(item.id));
            setSelectedForms(prev => {
                const newSelected = [...prev];
                rowsToAdd.forEach(rowToAdd => {
                    if (!newSelected.find(sf => sf.id === rowToAdd.id)) {
                        newSelected.push(rowToAdd);
                    }
                });
                return newSelected;
            });
        } else {
             setSelectedForms(prev => prev.filter(item => !currentDataIds.has(item.id)));
        }
    }, [pageData])


    const handleViewDetails = useCallback((item: FormItem) => {
        setCurrentItemForView(item)
        setDetailViewOpen(true)
    }, [])
    const handleCloseDetailView = useCallback(() => {
        setDetailViewOpen(false)
        setCurrentItemForView(null)
    }, [])

    const handleEdit = useCallback((form: FormItem) => {
        console.log('Edit form:', form.id)
        // navigate(`/app/inquiries/edit/${form.id}`)
        toast.push(<Notification title="Action" type="info">Edit for {form.inquiry_id} clicked.</Notification>)
    }, [navigate])

    const handleCloneForm = useCallback((formToClone: FormItem) => {
        const newId = `F${Math.floor(Math.random() * 90000) + 10000}` // 5-digit random
        const clonedForm: FormItem = {
            ...cloneDeep(formToClone),
            id: newId,
            inquiry_id: `${formToClone.inquiry_id}-CLONE-${newId.slice(-3)}`,
            inquiry_subject: `${formToClone.inquiry_subject} (Clone)`,
            status: 'inactive',
            inquiry_date: new Date().toISOString().split('T')[0],
            response_date: '',
            resolution_date: '',
            follow_up_date: '',
            feedback_status: 'Pending',
            inquiry_resolution: '',
        }
        setForms((prev) => [clonedForm, ...prev])
        toast.push(<Notification title="Inquiry Cloned" type="success" duration={2500}>{`New inquiry ${clonedForm.inquiry_id} created.`}</Notification>)
    }, [])

    const handleChangeStatus = useCallback((formToChange: FormItem) => {
        const newStatus = formToChange.status === 'active' ? 'inactive' : 'active'
        setForms((currentForms) =>
            currentForms.map((f) =>
                f.id === formToChange.id ? { ...f, status: newStatus } : f,
            ),
        )
        toast.push(<Notification title="Status Changed" type="success" duration={2500}>{`Status of ${formToChange.inquiry_id} changed to ${newStatus}.`}</Notification>)
    }, [])

    const handleDelete = useCallback((formToDelete: FormItem) => {
        setItemToDelete(formToDelete)
        setDeleteConfirmOpen(true)
    }, [])
    const confirmDelete = () => {
        if (itemToDelete) {
            setForms((current) => current.filter((i) => i.id !== itemToDelete.id))
            setSelectedForms((prev) => prev.filter((i) => i.id !== itemToDelete.id))
            toast.push(<Notification title="Inquiry Deleted" type="success" duration={2500}>{`Inquiry ${itemToDelete.inquiry_id} deleted.`}</Notification>)
        }
        setDeleteConfirmOpen(false)
        setItemToDelete(null)
    }
    const cancelDelete = () => {
        setDeleteConfirmOpen(false)
        setItemToDelete(null)
    }

    const handleDeleteSelected = useCallback(() => {
        const selectedIds = new Set(selectedForms.map((f) => f.id))
        setForms((current) => current.filter((f) => !selectedIds.has(f.id)))
        setSelectedForms([])
        toast.push(<Notification title="Inquiries Deleted" type="success" duration={2500}>{`${selectedIds.size} inquiry(s) deleted.`}</Notification>)
    }, [selectedForms])


    const columns: ColumnDef<FormItem>[] = useMemo(
        () => [
            {
                header: 'Inquiry & Company',
                accessorKey: 'inquiry_id',
                enableSorting: true,
                size: 280,
                cell: ({ row }) => {
                    const { inquiry_id, company_name, inquiry_subject, inquiry_type, status } = row.original
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-blue-600 cursor-pointer" onClick={() => handleViewDetails(row.original)}>
                                {inquiry_id}
                            </span>
                            <InfoLine icon={<TbBuilding size={14}/>} text={company_name} />
                            <Tooltip title={inquiry_subject}>
                                <InfoLine icon={<TbFileText size={14}/>} text={inquiry_subject} />
                            </Tooltip>
                            <div className="flex items-center gap-2 mt-1">
                                <Tag className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                                    {inquiry_type}
                                </Tag>
                                <Tag className={`${recordStatusColor[status]} capitalize text-[10px] px-1.5 py-0.5`}>
                                    {status}
                                </Tag>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Contact Person',
                accessorKey: 'contact_person_name',
                enableSorting: true,
                size: 240,
                cell: ({ row }) => {
                    const { contact_person_name, contact_person_email, contact_person_phone } = row.original
                    return (
                        <div className="flex flex-col gap-0.5">
                             <InfoLine icon={<TbUserCircle size={14}/>} text={contact_person_name} title={contact_person_name}/>
                             <InfoLine icon={<TbMail size={14}/>} text={contact_person_email} href={`mailto:${contact_person_email}`} title={contact_person_email} />
                             <InfoLine icon={<TbPhone size={14}/>} text={contact_person_phone} title={contact_person_phone} />
                        </div>
                    )
                },
            },
            {
                header: 'Status & Priority',
                accessorKey: 'inquiry_priority', // Main sort key for this group
                enableSorting: true,
                size: 200,
                cell: ({ row }) => {
                    const { inquiry_priority, inquiry_status, assigned_to } = row.original
                    return (
                        <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-1">
                                <TbAlertTriangle className="text-gray-500" size={14}/>
                                <Tag className={`${priorityColors[inquiry_priority] || priorityColors.default} capitalize text-[10px] px-1.5 py-0.5`}>
                                    {inquiry_priority}
                                </Tag>
                            </div>
                             <div className="flex items-center gap-1">
                                <TbProgressCheck className="text-gray-500" size={14}/>
                                <Tag className={`${inquiryStatusColors[inquiry_status] || inquiryStatusColors.default} capitalize text-[10px] px-1.5 py-0.5`}>
                                    {inquiry_status}
                                </Tag>
                            </div>
                            <InfoLine icon={<TbUserCheck size={14}/>} text={assigned_to} title={`Assigned to: ${assigned_to}`} />
                        </div>
                    )
                },
            },
            {
                header: 'Dates',
                accessorKey: 'inquiry_date',
                enableSorting: true,
                size: 170,
                cell: ({ row }) => {
                    const { inquiry_date, response_date, resolution_date, follow_up_date } = row.original
                    return (
                        <div className="flex flex-col gap-0.5 text-xs">
                            <FormattedDate label="Inquired" dateString={inquiry_date} />
                            <FormattedDate label="Responded" dateString={response_date} />
                            <FormattedDate label="Resolved" dateString={resolution_date} />
                            <FormattedDate label="Follow-up" dateString={follow_up_date} />
                        </div>
                    )
                },
            },
            {
                header: 'Actions',
                id: 'action',
                size: 140, // Adjusted for more icons
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleViewDetails(props.row.original)}
                        onEdit={() => handleEdit(props.row.original)}
                        onClone={() => handleCloneForm(props.row.original)}
                        onChangeStatus={() => handleChangeStatus(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleViewDetails, handleEdit, handleCloneForm, handleChangeStatus, handleDelete],
    )

    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Inquiry Management</h3>
                    <FormActionTools allItems={forms} />
                </div>

                <div className="mb-4">
                    <FormTableTools onSearchChange={handleSearchChange} />
                </div>

                <div className="flex-grow overflow-auto">
                    <FormsTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedItems={selectedForms}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            <FormSelectedFooter
                selectedItems={selectedForms}
                onDeleteSelected={handleDeleteSelected}
            />

            <DetailViewDialog
                isOpen={detailViewOpen}
                onClose={handleCloseDetailView}
                item={currentItemForView}
            />
            <ConfirmDialog
                isOpen={deleteConfirmOpen}
                type="danger"
                title="Delete Inquiry"
                onClose={cancelDelete}
                onRequestClose={cancelDelete}
                onCancel={cancelDelete}
                onConfirm={confirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete inquiry{' '}
                    <strong>{itemToDelete?.inquiry_id}</strong>? This action cannot be undone.
                </p>
            </ConfirmDialog>
        </Container>
    )
}

export default InquiriesListing;