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
    document_id: string;
    document_title: string;
    document_folder: string;
    document_type: string;
    document_size: string;
    uploaded_by: string;
    upload_date: string; // ISO date string
    last_modified_by: string;
    last_modified_date: string; // ISO date string
    file_path: string;
    document_status: 'Active' | 'Archived' | 'Deleted';
    entity_type: string;
    entity_id: string;
    access_level: 'Public' | 'Restricted' | 'Internal' | 'Private';
    document_expiry_date: string | null; // ISO date string or null if no expiry
    document_description: string;
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
        id: 'F001',
        document_id: 'D001',
        document_title: 'Company Profile',
        document_folder: 'Company_ABC',
        document_type: 'PDF',
        document_size: '2.5 MB',
        uploaded_by: 'Alice Johnson',
        upload_date: '2024-04-01T10:30:00Z',
        last_modified_by: 'Alice Johnson',
        last_modified_date: '2024-04-02T15:00:00Z',
        file_path: '/documents/company_abc/profile.pdf',
        document_status: 'Active',
        entity_type: 'Company',
        entity_id: 'C001',
        access_level: 'Internal',
        document_expiry_date: null,
        document_description: 'Official company profile brochure.',
        status: 'active',
    },
    {
        id: 'F002',
        document_id: 'D002',
        document_title: 'Annual Financial Report 2023',
        document_folder: 'Company_XYZ',
        document_type: 'Excel',
        document_size: '5.1 MB',
        uploaded_by: 'Bob Smith',
        upload_date: '2024-03-15T09:00:00Z',
        last_modified_by: 'Carol Lee',
        last_modified_date: '2024-04-10T12:30:00Z',
        file_path: '/documents/company_xyz/financial_report_2023.xlsx',
        document_status: 'Archived',
        entity_type: 'Company',
        entity_id: 'C002',
        access_level: 'Restricted',
        document_expiry_date: '2025-03-15T00:00:00Z',
        document_description: 'Detailed financial report for the fiscal year 2023.',
        status: 'inactive',
    },
    {
        id: 'F003',
        document_id: 'D003',
        document_title: 'Employee Handbook',
        document_folder: 'HR',
        document_type: 'Word',
        document_size: '1.2 MB',
        uploaded_by: 'HR_Manager',
        upload_date: '2023-11-20T11:45:00Z',
        last_modified_by: 'HR_Manager',
        last_modified_date: '2023-12-01T08:20:00Z',
        file_path: '/documents/hr/employee_handbook.docx',
        document_status: 'Active',
        entity_type: 'Team',
        entity_id: 'T001',
        access_level: 'Public',
        document_expiry_date: null,
        document_description: 'Company policies and guidelines for employees.',
        status: 'active',
    },
    {
        id: 'F004',
        document_id: 'D004',
        document_title: 'Product Design Draft',
        document_folder: 'Product_Designs',
        document_type: 'Image',
        document_size: '3.4 MB',
        uploaded_by: 'Designer_Jane',
        upload_date: '2024-02-10T14:00:00Z',
        last_modified_by: 'Designer_Jane',
        last_modified_date: '2024-02-12T10:15:00Z',
        file_path: '/documents/product_designs/design_draft.png',
        document_status: 'Active',
        entity_type: 'Product',
        entity_id: 'P123',
        access_level: 'Private',
        document_expiry_date: null,
        document_description: 'Initial draft for new product design.',
        status: 'active',
    },
    {
        id: 'F005',
        document_id: 'D005',
        document_title: 'Partner Agreement',
        document_folder: 'Legal',
        document_type: 'PDF',
        document_size: '750 KB',
        uploaded_by: 'Legal_Team',
        upload_date: '2023-09-05T13:30:00Z',
        last_modified_by: 'Legal_Team',
        last_modified_date: '2023-09-10T16:45:00Z',
        file_path: '/documents/legal/partner_agreement.pdf',
        document_status: 'Active',
        entity_type: 'Partner',
        entity_id: 'PT001',
        access_level: 'Restricted',
        document_expiry_date: '2026-09-05T00:00:00Z',
        document_description: 'Contract agreement with partner company.',
        status: 'inactive',
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
        filteredData = forms.filter((form) =>
            form.id.toLowerCase().includes(query) ||
            form.status.toLowerCase().includes(query) ||

            // Document fields filtering (if form is DocumentItem)
            ('document_id' in form && form.document_id.toLowerCase().includes(query)) ||
            ('document_title' in form && form.document_title.toLowerCase().includes(query)) ||
            ('document_folder' in form && form.document_folder.toLowerCase().includes(query)) ||
            ('document_type' in form && form.document_type.toLowerCase().includes(query)) ||
            ('uploaded_by' in form && form.uploaded_by.toLowerCase().includes(query)) ||
            ('document_status' in form && form.document_status.toLowerCase().includes(query)) ||
            ('entity_type' in form && form.entity_type.toLowerCase().includes(query)) ||
            ('access_level' in form && form.access_level.toLowerCase().includes(query))
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

        const handleCloneForm = (document: FormItem) => {
        const newId = `D${Math.floor(Math.random() * 9000) + 1000}`;
        const clonedForm: FormItem = {
            ...document,
            document_id: newId,
            document_title: `${document.document_title} (Clone)`,
            upload_date: new Date().toISOString(), // reset to current date
            last_modified_date: new Date().toISOString(), // reset to current date
            document_status: 'Archived', // set cloned documents as Archived by default
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
                header: 'Document ID',
                accessorKey: 'document_id',
                enableSorting: true,
                size: 100,
                cell: (props) => <span>{props.row.original.document_id}</span>,
            },
            {
                header: 'Title',
                accessorKey: 'document_title',
                enableSorting: true,
                size: 200,
                cell: (props) => <span>{props.row.original.document_title}</span>,
            },
            {
                header: 'Folder',
                accessorKey: 'document_folder',
                enableSorting: true,
                size: 150,
                cell: (props) => <span>{props.row.original.document_folder}</span>,
            },
            {
                header: 'Type',
                accessorKey: 'document_type',
                enableSorting: true,
                size: 100,
                cell: (props) => <span>{props.row.original.document_type}</span>,
            },
            {
                header: 'Size',
                accessorKey: 'document_size',
                enableSorting: true,
                size: 80,
                cell: (props) => <span>{props.row.original.document_size}</span>,
            },
            {
                header: 'Uploaded By',
                accessorKey: 'uploaded_by',
                enableSorting: true,
                size: 150,
                cell: (props) => <span>{props.row.original.uploaded_by}</span>,
            },
            {
                header: 'Upload Date',
                accessorKey: 'upload_date',
                enableSorting: true,
                size: 120,
                cell: (props) => (
                <span>{new Date(props.row.original.upload_date).toLocaleDateString()}</span>
            ),
            },
            {
                header: 'Last Modified By',
                accessorKey: 'last_modified_by',
                enableSorting: true,
                size: 150,
                cell: (props) => <span>{props.row.original.last_modified_by}</span>,
            },
            {
                header: 'Last Modified Date',
                accessorKey: 'last_modified_date',
                enableSorting: true,
                size: 120,
                cell: (props) => (
                <span>{new Date(props.row.original.last_modified_date).toLocaleDateString()}</span>
            ),
            },
            {
                header: 'File Path',
                accessorKey: 'file_path',
                enableSorting: false,
                size: 200,
                cell: (props) => (
                <a href={props.row.original.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                View File
                </a>
            ),
            },
            {
                header: 'Entity Type',
                accessorKey: 'entity_type',
                enableSorting: true,
                size: 130,
                cell: (props) => <span>{props.row.original.entity_type}</span>,
            },
            {
                header: 'Entity ID',
                accessorKey: 'entity_id',
                enableSorting: true,
                size: 100,
                cell: (props) => <span>{props.row.original.entity_id}</span>,
            },
            {
                header: 'Access Level',
                accessorKey: 'access_level',
                enableSorting: true,
                size: 120,
                cell: (props) => <span>{props.row.original.access_level}</span>,
            },
            {
                header: 'Expiry Date',
                accessorKey: 'document_expiry_date',
                enableSorting: true,
                size: 120,
                cell: (props) =>
                props.row.original.document_expiry_date
                ? new Date(props.row.original.document_expiry_date).toLocaleDateString()
                : 'N/A',
            },
            {
                header: 'Description',
                accessorKey: 'document_description',
                enableSorting: false,
                size: 300,
                cell: (props) => <span>{props.row.original.document_description}</span>,
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
