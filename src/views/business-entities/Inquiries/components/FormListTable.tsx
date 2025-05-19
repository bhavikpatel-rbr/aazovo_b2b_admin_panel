import { useState, useMemo, useCallback } from 'react'
import Avatar from '@/components/ui/Avatar' // Can remove if forms don't have productNames
import Tag from '@/components/ui/Tag'
import Tooltip from '@/components/ui/Tooltip'
import DataTable from '@/components/shared/DataTable'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
// Import new icons
import {
    TbPencil,
    TbEye,
    TbCopy,
    TbSwitchHorizontal,
    TbTrash,
} from 'react-icons/tb'
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Form Type ---
export type FormItem = {
    id: string;
    inquiry_id: string;
    company_name: string;
    contact_person_name: string;
    contact_person_email: string;
    contact_person_phone: string;
    inquiry_type: string;
    inquiry_subject: string;
    inquiry_description: string;
    inquiry_priority: string;
    inquiry_status: string;
    assigned_to: string;
    inquiry_date: string;
    response_date: string;
    resolution_date: string;
    follow_up_date: string;
    feedback_status: string;
    inquiry_resolution: string;
    inquiry_attachments: string[];
    status: 'active' | 'inactive'; // Status
};
// --- End Form Type Definition ---

// --- Updated Status Colors ---
const statusColor: Record<FormItem['status'], string> = {
    active: 'bg-green-200 dark:bg-green-200 text-green-600 dark:text-green-600',
    inactive: 'bg-red-200 dark:bg-red-200 text-red-600 dark:text-red-600', // Example color for inactive
}

// --- ActionColumn Component ---
// Added onClone and onChangeStatus props
const ActionColumn = ({
    onEdit,
    onViewDetail,
    onClone,
    onChangeStatus,
}: {
    onEdit: () => void
    onViewDetail: () => void
    onClone: () => void
    onChangeStatus: () => void
}) => {
    return (
        <div className="flex items-center justify-center gap-1">
            {' '}
            {/* Align actions to end */}
            {/* <Tooltip title="Clone Form">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
                    role="button"
                    onClick={onClone}
                >
                    <TbCopy />
                </div>
            </Tooltip> */}
            <Tooltip title="Change Status">
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400`}
                    role="button"
                    onClick={onChangeStatus}
                >
                    <TbSwitchHorizontal />
                </div>
            </Tooltip>
            <Tooltip title="Edit">
                {' '}
                {/* Keep Edit/View if needed */}
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="View">
                <div
                    className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
                    role="button"
                    onClick={onViewDetail}
                >
                    <TbTrash />
                </div>
            </Tooltip>
        </div>
    )
}

// --- Initial Dummy Data ---
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
        inquiry_description: 'We are interested in getting a quotation for your enterprise software solution.',
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
        status: 'active', // Example status
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
        inquiry_description: 'We are facing issues with our integration and need technical assistance.',
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
        status: 'active', // Example status
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
        inquiry_description: 'We are exploring potential partnership opportunities with your company.',
        inquiry_priority: 'Low',
        inquiry_status: 'Resolved',
        assigned_to: 'Partnership Team',
        inquiry_date: '2025-03-15',
        response_date: '2025-03-16',
        resolution_date: '2025-03-18',
        follow_up_date: '2025-03-25',
        feedback_status: 'Received',
        inquiry_resolution: 'Provided details and scheduled a follow-up call.',
        inquiry_attachments: [
        'https://example.com/attachments/inquiry003/proposal.pdf',
        ],
        status: 'inactive', // Example status
    },
];
// --- End Dummy Data ---

const FormListTable = () => {
    const navigate = useNavigate()

    // --- Local State for Table Data and Selection ---
    const [isLoading, setIsLoading] = useState(false)
    const [forms, setForms] = useState<FormItem[]>(initialDummyForms) // Make forms stateful
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedForms, setSelectedForms] = useState<FormItem[]>([]) // Renamed state
    // --- End Local State ---

    // Simulate data fetching and processing based on tableData
    const { pageData, total } = useMemo(() => {
        let filteredData = [...forms] // Use the stateful forms data

        // --- Filtering ---
        if (tableData.query) {
            const query = tableData.query.toLowerCase();
            filteredData = forms.filter(
                (form) =>
                    form.id.toLowerCase().includes(query) ||
                    (form.id?.toLowerCase() ?? '').includes(query) ||
                    (form.inquiry_id?.toLowerCase() ?? '').includes(query) ||
                    (form.company_name?.toLowerCase() ?? '').includes(query) ||
                    (form.contact_person_name?.toLowerCase() ?? '').includes(query) ||
                    (form.contact_person_email?.toLowerCase() ?? '').includes(query) ||
                    (form.contact_person_phone?.toLowerCase() ?? '').includes(query) ||
                    (form.inquiry_type?.toLowerCase() ?? '').includes(query) ||
                    (form.inquiry_subject?.toLowerCase() ?? '').includes(query) ||
                    form.status.toLowerCase().includes(query)
            );
        }

        // --- Sorting ---
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
                // Add number comparison if forms have numeric fields to sort
                return 0
            })
        }

        // --- Pagination ---
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const dataTotal = filteredData.length // Use filtered length for total
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = filteredData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return { pageData: dataForPage, total: dataTotal }
    }, [forms, tableData]) // Depend on forms state and tableData

    // --- Action Handlers ---
    const handleEdit = (form: FormItem) => {
        // Navigate to a hypothetical form edit page
        console.log('Navigating to edit form:', form.id)
        // navigate(`/forms/edit/${form.id}`) // Example navigation
    }

    const handleViewDetails = (form: FormItem) => {
        // Navigate to a hypothetical form details page
        console.log('Navigating to view form:', form.id)
        // navigate(`/forms/details/${form.id}`) // Example navigation
    }

    const handleCloneForm = (form: FormItem) => {
        const newId = `F${Math.floor(Math.random() * 9000) + 1000}`;
        const clonedForm: FormItem = {
            ...form,
            id: newId,
            // Append "(Clone)" to some key string fields to indicate cloning
            inquiry_id: `${form.inquiry_id} (Clone)`,
            company_name: `${form.company_name} (Clone)`,
            contact_person_name: `${form.contact_person_name} (Clone)`,

            // Keep emails, phones as is
            contact_person_email: form.contact_person_email,
            contact_person_phone: form.contact_person_phone,

            // Append "(Clone)" to inquiry subject to distinguish
            inquiry_subject: `${form.inquiry_subject} (Clone)`,

            // Reset status to inactive for cloned forms
            status: 'inactive',

            // Optionally, reset or clear dates and other fields as needed
            inquiry_date: '',
            response_date: '',
            resolution_date: '',
            follow_up_date: '',

            // Clear resolution and feedback for cloned form
            inquiry_resolution: '',
            feedback_status: '',

            // Leave attachments empty or clone as needed (here we clear)
            inquiry_attachments: [],

            // Keep other string fields as they were
            inquiry_type: form.inquiry_type,
            inquiry_description: form.inquiry_description,
            inquiry_priority: form.inquiry_priority,
            inquiry_status: form.inquiry_status,
            assigned_to: form.assigned_to,
        };
        setForms((prev) => [clonedForm, ...prev]);
    };

    const handleChangeStatus = (form: FormItem) => {
        // Logic to change the status (e.g., API call and update state)
        const newStatus = form.status === 'active' ? 'inactive' : 'active'
        console.log(`Changing status of form ${form.id} to ${newStatus}`)

        // Update the status in the local state for visual feedback
        setForms((currentForms) =>
            currentForms.map((f) =>
                f.id === form.id ? { ...f, status: newStatus } : f,
            ),
        )
    }
    // --- End Action Handlers ---

    // --- Columns Definition ---
    const columns: ColumnDef<FormItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                // Simple cell to display ID, enable sorting
                enableSorting: true,
                size:70,
                cell: (props) => <span>{props.row.original.id}</span>,
            },
            {
                header: 'Inquiry ID',
                accessorKey: 'inquiry_id',
                size: 100,
            },
            {
                header: 'Company Name',
                accessorKey: 'company_name',
                size: 160,
            },
            {
                header: 'Contact Person',
                accessorKey: 'contact_person_name',
                size: 160,
            },
            {
                header: 'Email',
                accessorKey: 'contact_person_email',
                size: 200,
            },
            {
                header: 'Phone',
                accessorKey: 'contact_person_phone',
                size: 140,
            },
            {
                header: 'Inquiry Type',
                accessorKey: 'inquiry_type',
                size: 140,
            },
            {
                header: 'Subject',
                accessorKey: 'inquiry_subject',
                size: 200,
            },
            {
                header: 'Description',
                accessorKey: 'inquiry_description',
                size: 300,
                cell: ({ row }) => (
                <div className="line-clamp-2 text-sm text-gray-700">
                    {row.original.inquiry_description}
                </div>
                ),
            },
            {
                header: 'Priority',
                accessorKey: 'inquiry_priority',
                size: 100,
            },
            {
                header: 'Assigned To',
                accessorKey: 'assigned_to',
                size: 160,
            },
            {
                header: 'Inquiry Date',
                accessorKey: 'inquiry_date',
                size: 140,
                cell: ({ row }) =>
                new Date(row.original.inquiry_date).toLocaleDateString(),
            },
            {
                header: 'Response Date',
                accessorKey: 'response_date',
                size: 140,
                cell: ({ row }) =>
                new Date(row.original.response_date).toLocaleDateString(),
            },
            {
                header: 'Resolution Date',
                accessorKey: 'resolution_date',
                size: 140,
                cell: ({ row }) =>
                new Date(row.original.resolution_date).toLocaleDateString(),
            },
            {
                header: 'Follow-up Date',
                accessorKey: 'follow_up_date',
                size: 140,
                cell: ({ row }) =>
                new Date(row.original.follow_up_date).toLocaleDateString(),
            },
            {
                header: 'Feedback Status',
                accessorKey: 'feedback_status',
                size: 150,
            },
            {
                header: 'Resolution Notes',
                accessorKey: 'inquiry_resolution',
                size: 300,
                cell: ({ row }) => (
                <div className="line-clamp-2 text-sm text-gray-700">
                    {row.original.inquiry_resolution}
                </div>
                ),
            },
            {
                header: 'Attachments',
                accessorKey: 'inquiry_attachments',
                size: 200,
                cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    {row.original.inquiry_attachments.map((url, i) => (
                    <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-sm"
                    >
                        File {i + 1}
                    </a>
                    ))}
                </div>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'status',
                // Enable sorting
                enableSorting: true,
                size:120,
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <div className="flex items-center">
                            <Tag className={statusColor[status]}>
                                <span className="capitalize">{status}</span>
                            </Tag>
                        </div>
                    )
                },
            },
            {
                header: 'Action', // Keep header empty for actions
                id: 'action',
                size: 160, // Adjust width for actions
                meta:{HeaderClass: "text-center"},
                cell: (props) => (
                    <ActionColumn
                        // Pass new handlers
                        onClone={() => handleCloneForm(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        // Keep existing handlers if needed
                        onEdit={() => handleEdit(props.row.original)}
                        onViewDetail={() =>
                            handleViewDetails(props.row.original)
                        }
                    />
                ),
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [], // Handlers are defined outside, state dependency handled by component re-render
    )
    // --- End Columns Definition ---

    // --- Table Interaction Handlers (Pagination, Selection, etc.) ---
    const handleSetTableData = useCallback(
        (data: TableQueries) => {
            setTableData(data)
            if (selectedForms.length > 0) {
                setSelectedForms([]) // Clear selection on data change
            }
        },
        [selectedForms.length], // Dependency needed
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
    // --- End Table Interaction Handlers ---

    return (
        <DataTable
            selectable
            columns={columns}
            data={pageData} // Use processed page data
            noData={!isLoading && forms.length === 0} // Check stateful forms length
            // Remove skeleton avatar if not used
            // skeletonAvatarColumns={[0]}
            // skeletonAvatarProps={{ width: 28, height: 28 }}
            loading={isLoading}
            pagingData={{
                total: total, // Use calculated total from filtered data
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
            }}
            checkboxChecked={
                (row) =>
                    selectedForms.some((selected) => selected.id === row.id) // Use selectedForms state
            }
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onCheckBoxChange={handleRowSelect} // Pass correct handler
            onIndeterminateCheckBoxChange={handleAllRowSelect} // Pass correct handler
        />
    )
}

export default FormListTable
