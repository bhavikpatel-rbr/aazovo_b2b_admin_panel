import { useState, useMemo, useCallback } from 'react'
// import Avatar from '@/components/ui/Avatar' // Not used as FormItem doesn't have image URLs
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import DataTable from '@/components/shared/DataTable'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import {
    TbPencil,
    TbEye,
    TbCopy,
    TbSwitchHorizontal,
    TbTrash,
    TbShare,
    TbDotsVertical,
} from 'react-icons/tb'
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Form Type (Using the original FormItem definition) ---
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
    inquiry_priority: string
    inquiry_status: string // e.g., 'New', 'In Progress', 'Resolved'
    assigned_to: string
    inquiry_date: string
    response_date: string
    resolution_date: string
    follow_up_date: string
    feedback_status: string
    inquiry_resolution: string
    inquiry_attachments: string[]
    status: 'active' | 'inactive' // Overall status of the record
}
// --- End Form Type Definition ---

// --- Status Colors for 'active'/'inactive' ---
const statusColor: Record<FormItem['status'], string> = {
    active: 'bg-green-200 text-green-600 dark:bg-green-700 dark:text-green-100',
    inactive: 'bg-red-200 text-red-600 dark:bg-red-700 dark:text-red-100',
}

// --- Priority and Inquiry Status Colors (Example) ---
const priorityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
    Low: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
}

const inquiryStatusColors: Record<string, string> = {
    New: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    Resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    Closed: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300',
}


// --- ActionColumn Component ---
const ActionColumn = ({ onEdit, onViewDetail, onChangeStatus, onShare, onMore }: {
    onEdit: () => void; onViewDetail: () => void; onChangeStatus: () => void; onShare: () => void; onMore: () => void;
}) => {
    return (
        <div className="flex items-center justify-center gap-1">
            <Tooltip title="Edit">
                <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400" role="button" onClick={onEdit}>
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="View">
                <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" role="button" onClick={onViewDetail}>
                    <TbEye />
                </div>
            </Tooltip>
            {/* For Share and More, you'd typically use Dropdown component */}
            <Tooltip title="Share">
                <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400" role="button" onClick={onShare}>
                    <TbShare />
                </div>
            </Tooltip>
            <Tooltip title="More">
                <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400" role="button" onClick={onMore}>
                    <TbDotsVertical />
                </div>
            </Tooltip>
        </div>
    );
};
// --- End ActionColumn ---

// --- Initial Dummy Data (Using original data) ---
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

const FormattedDate = ({ dateString }: { dateString: string }) => {
    if (!dateString) return <span className="text-xs text-gray-500 dark:text-gray-400">N/A</span>
    try {
        return <span className="text-xs">{new Date(dateString).toLocaleDateString()}</span>
    } catch (e) {
        return <span className="text-xs text-red-500">Invalid Date</span>
    }
}

const FormListTable = () => {
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

    const { pageData, total } = useMemo(() => {
        let filteredData = [...forms]

        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            filteredData = forms.filter((form) =>
                Object.values(form).some((value) => {
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(query)
                    }
                    if (Array.isArray(value)) {
                        return value.some((item) =>
                            String(item).toLowerCase().includes(query),
                        )
                    }
                    return false
                }),
            )
        }

        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            filteredData.sort((a, b) => {
                const aValue = a[key as keyof FormItem] ?? ''
                const bValue = b[key as keyof FormItem] ?? ''

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
        const dataTotal = filteredData.length
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = filteredData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return { pageData: dataForPage, total: dataTotal }
    }, [forms, tableData])

    const handleEdit = (form: FormItem) => {
        console.log('Navigating to edit form:', form.id)
        // navigate(`/app/inquiries/edit/${form.id}`) // Example navigation
    }

    const handleViewDetails = (form: FormItem) => {
        console.log('Navigating to view form details:', form.id)
        // navigate(`/app/inquiries/details/${form.id}`) // Example navigation
    }

    const handleCloneForm = (form: FormItem) => {
        const newId = `F${Math.floor(Math.random() * 9000) + 1000}`
        const clonedForm: FormItem = {
            ...cloneDeep(form), // Deep clone to avoid issues with nested objects/arrays
            id: newId,
            inquiry_id: `${form.inquiry_id}-CLONE`,
            inquiry_subject: `${form.inquiry_subject} (Clone)`,
            status: 'inactive', // Cloned forms are inactive by default
            inquiry_date: new Date().toISOString().split('T')[0], // Set to today
            response_date: '',
            resolution_date: '',
            follow_up_date: '',
            inquiry_resolution: '',
            feedback_status: 'Pending',
            // inquiry_attachments: [], // Optionally clear or handle attachments
        }
        setForms((prev) => [clonedForm, ...prev])
        console.log('Cloned form:', clonedForm.id)
    }

    const handleChangeStatus = (form: FormItem) => {
        const newStatus = form.status === 'active' ? 'inactive' : 'active'
        setForms((currentForms) =>
            currentForms.map((f) =>
                f.id === form.id ? { ...f, status: newStatus } : f,
            ),
        )
        console.log(`Changed status of form ${form.id} to ${newStatus}`)
    }

    const handleShare = (form: FormItem) => { console.log("Share:", form.id) };
    const handleMore = (form: FormItem) => { console.log("More options for:", form.id) };
    
    const handleDelete = (form: FormItem) => {
        // Add confirmation dialog here in a real app
        setForms((currentForms) =>
            currentForms.filter((f) => f.id !== form.id),
        )
        console.log('Deleted form:', form.id)
    }

    const columns: ColumnDef<FormItem>[] = useMemo(
        () => [
            {
                header: 'Inquiry Overview',
                accessorKey: 'inquiry_id',
                enableSorting: true,
                size: 280,
                cell: ({ row }) => {
                    const {
                        inquiry_id,
                        company_name,
                        inquiry_subject,
                        inquiry_type,
                        status,
                    } = row.original
                    return (
                        <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                {inquiry_id}
                            </span>
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                                {company_name}
                            </span>
                            <Tooltip title={inquiry_subject}>
                                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                    {inquiry_subject}
                                </span>
                            </Tooltip>
                            <div className="flex items-center gap-2 mt-1">
                                <Tag className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                                    {inquiry_type}
                                </Tag>
                                <Tag className={`${statusColor[status]} capitalize text-[10px] px-1.5 py-0.5`}>
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
                    const {
                        contact_person_name,
                        contact_person_email,
                        contact_person_phone,
                    } = row.original
                    return (
                        <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                                {contact_person_name}
                            </span>
                            <a
                                href={`mailto:${contact_person_email}`}
                                className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                                {contact_person_email}
                            </a>
                            <span className="text-gray-600 dark:text-gray-300">
                                {contact_person_phone}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: 'Inquiry Details',
                accessorKey: 'inquiry_priority',
                enableSorting: true,
                size: 280,
                cell: ({ row }) => {
                    const {
                        inquiry_priority,
                        inquiry_status,
                        assigned_to,
                        inquiry_description,
                    } = row.original
                    return (
                        <div className="flex flex-col gap-1 text-xs">
                             <div className="flex items-center gap-2">
                                <Tag className={`${priorityColors[inquiry_priority] || 'bg-gray-100 text-gray-700'} capitalize text-[10px] px-1.5 py-0.5`}>
                                    {inquiry_priority} Priority
                                </Tag>
                                <Tag className={`${inquiryStatusColors[inquiry_status] || 'bg-gray-100 text-gray-700'} capitalize text-[10px] px-1.5 py-0.5`}>
                                    {inquiry_status}
                                </Tag>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Assigned:</span> {assigned_to}
                            </span>
                            <Tooltip title={inquiry_description}>
                                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {inquiry_description}
                                </p>
                            </Tooltip>
                        </div>
                    )
                },
            },
            {
                header: 'Timeline',
                accessorKey: 'inquiry_date',
                enableSorting: true,
                size: 180,
                cell: ({ row }) => {
                    const {
                        inquiry_date,
                        response_date,
                        resolution_date,
                        follow_up_date,
                    } = row.original
                    return (
                        <div className="flex flex-col gap-0.5 text-xs">
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Inquired: </span>
                                <FormattedDate dateString={inquiry_date} />
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Responded: </span>
                                <FormattedDate dateString={response_date} />
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Resolved: </span>
                                <FormattedDate dateString={resolution_date} />
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Follow-up: </span>
                                <FormattedDate dateString={follow_up_date} />
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Resolution & Files',
                accessorKey: 'feedback_status',
                size: 280,
                cell: ({ row }) => {
                    const {
                        feedback_status,
                        inquiry_resolution,
                        inquiry_attachments,
                    } = row.original
                    return (
                        <div className="flex flex-col gap-1 text-xs">
                            <span className="text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Feedback:</span> {feedback_status}
                            </span>
                            {inquiry_resolution && (
                                <Tooltip title={inquiry_resolution}>
                                    <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                                        <span className="font-semibold">Notes:</span> {inquiry_resolution}
                                    </p>
                                </Tooltip>
                            )}
                             {inquiry_attachments.length > 0 && (
                                <div className="mt-1">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">Attachments:</span>
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        {inquiry_attachments.map((url, i) => (
                                            <a
                                                key={i}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline dark:text-blue-400 truncate"
                                            >
                                                File {i + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {inquiry_attachments.length === 0 && !inquiry_resolution && (
                                <span className="text-gray-500 dark:text-gray-400">No resolution notes or attachments.</span>
                            )}
                        </div>
                    )
                },
            },
            {
                header: 'Actions', id: 'action', size:130, meta: { HeaderClass: 'text-center' },
                cell: (props) => (
                    <ActionColumn
                        onChangeStatus={() => handleChangeStatus(props.row.original)}
                        onEdit={() => handleEdit(props.row.original)}
                        onViewDetail={() => handleViewDetails(props.row.original)}
                        onShare={() => handleShare(props.row.original)}
                        onMore={() => handleMore(props.row.original)}
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [], // Handlers are stable due to useCallback or defined outside
    )

    const handleSetTableData = useCallback(
        (data: TableQueries) => {
            setTableData(data)
            if (selectedForms.length > 0) {
                setSelectedForms([])
            }
        },
        [selectedForms.length],
    )

    const handlePaginationChange = useCallback(
        (page: number) => {
            const newTableData = cloneDeep(tableData)
            newTableData.pageIndex = page
            handleSetTableData(newTableData)
        },
        [tableData, handleSetTableData],
    )

    const handleSelectChange = useCallback(
        (value: number) => {
            const newTableData = cloneDeep(tableData)
            newTableData.pageSize = Number(value)
            newTableData.pageIndex = 1
            handleSetTableData(newTableData)
        },
        [tableData, handleSetTableData],
    )

    const handleSort = useCallback(
        (sort: OnSortParam) => {
            const newTableData = cloneDeep(tableData)
            newTableData.sort = sort
            handleSetTableData(newTableData)
        },
        [tableData, handleSetTableData],
    )

    const handleRowSelect = useCallback((checked: boolean, row: FormItem) => {
        setSelectedForms((prev) => {
            if (checked) {
                return prev.some((f) => f.id === row.id) ? prev : [...prev, row]
            } else {
                return prev.filter((f) => f.id !== row.id)
            }
        })
    }, [])

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<FormItem>[]) => {
            if (checked) {
                const originalRows = rows.map((row) => row.original)
                setSelectedForms(originalRows)
            } else {
                setSelectedForms([])
            }
        },
        [],
    )

    return (
        <DataTable
            selectable
            columns={columns}
            data={pageData}
            noData={!isLoading && forms.length === 0}
            loading={isLoading}
            pagingData={{
                total: total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
            }}
            checkboxChecked={(row) =>
                selectedForms.some((selected) => selected.id === row.id)
            }
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onCheckBoxChange={handleRowSelect}
            onIndeterminateCheckBoxChange={handleAllRowSelect}
        />
    )
}

export default FormListTable