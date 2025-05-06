import { useState, useMemo, useCallback } from 'react'
import Avatar from '@/components/ui/Avatar' // Can remove if forms don't have images
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
    kycVerification: boolean; // KYC Verification Status
    partnerId: string; // Partner ID
    companyId: string; // Company ID
    companyName: string; // Company Name
    partnerName: string; // Partner Name
    email: string; // Email Address
    phone: string; // Phone Number
    status: 'active' | 'inactive'; // Status
};
// --- End Form Type Definition ---

// --- Updated Status Colors ---
const statusColor: Record<FormItem['status'], string> = {
    active: 'bg-emerald-200 dark:bg-emerald-200 text-gray-900 dark:text-gray-900',
    inactive: 'bg-amber-200 dark:bg-amber-200 text-gray-900 dark:text-gray-900', // Example color for inactive
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
        <div className="flex items-center justify-end gap-3">
            {' '}
            {/* Align actions to end */}
            <Tooltip title="Clone Form">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
                    role="button"
                    onClick={onClone}
                >
                    <TbCopy />
                </div>
            </Tooltip>
            <Tooltip title="Change Status">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
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
                    className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="View">
                <div
                    className={`text-xl cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400`}
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
        kycVerification: true,
        partnerId: 'P001',
        companyId: 'C001',
        companyName: 'ABC Pvt Ltd',
        partnerName: 'John Doe',
        email: 'john.doe@abc.com',
        phone: '+1-123-456-7890',
        status: 'active',
    },
    {
        id: 'F002',
        kycVerification: false,
        partnerId: 'P002',
        companyId: 'C002',
        companyName: 'XYZ Pvt Ltd',
        partnerName: 'Jane Smith',
        email: 'jane.smith@xyz.com',
        phone: '+1-987-654-3210',
        status: 'inactive',
    },
    {
        id: 'F003',
        kycVerification: true,
        partnerId: 'P003',
        companyId: 'C003',
        companyName: 'PQR Ltd',
        partnerName: 'Michael Johnson',
        email: 'michael.johnson@pqr.com',
        phone: '+44-20-7946-0958',
        status: 'active',
    },
    {
        id: 'F004',
        kycVerification: false,
        partnerId: 'P004',
        companyId: 'C004',
        companyName: 'LMN Corp',
        partnerName: 'Emily Davis',
        email: 'emily.davis@lmn.com',
        phone: '+91-98765-43210',
        status: 'inactive',
    },
    {
        id: 'F005',
        kycVerification: true,
        partnerId: 'P005',
        companyId: 'C005',
        companyName: 'EFG Enterprises',
        partnerName: 'William Brown',
        email: 'william.brown@efg.com',
        phone: '+81-3-1234-5678',
        status: 'active',
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
            const query = tableData.query.toLowerCase()
            filteredData = forms.filter(
                (form) =>
                    form.id.toLowerCase().includes(query) ||
                    form.partnerId.toLowerCase().includes(query) ||
                    form.status.toLowerCase().includes(query),
            )
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
        // Example: Add a cloned item locally for demo
        const newId = `F${Math.floor(Math.random() * 9000) + 1000}` // Generate pseudo-random ID
        const clonedForm: FormItem = {
            ...form,
            id: newId,
            email: form.email, // Keep original email
            phone: form.phone, // Keep original phone
            // Add other necessary fields for the cloned form
            status: 'inactive', // Cloned forms start as inactive
        }
        setForms((prev) => [clonedForm, ...prev]) // Add to the beginning of the list
        // Optionally navigate to the edit page of the cloned form
        // navigate(`/forms/edit/${newId}`)
    }

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
                enableSorting: true,
                cell: (props) => <span>{props.row.original.id}</span>,
            },
            {
                header: 'KYC Verification',
                accessorKey: 'kycVerification',
                enableSorting: true,
                cell: (props) => (
                    <span>{props.row.original.kycVerification ? 'Verified' : 'Pending'}</span>
                ),
            },
            {
                header: 'Partner ID',
                accessorKey: 'partnerId',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.partnerId}</span>,
            },
            {
                header: 'Company ID',
                accessorKey: 'companyId',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.companyId}</span>,
            },
            {
                header: 'Company Name',
                accessorKey: 'companyName',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.companyName}</span>,
            },
            {
                header: 'Partner Name',
                accessorKey: 'partnerName',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.partnerName}</span>,
            },
            {
                header: 'Email',
                accessorKey: 'email',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.email}</span>,
            },
            {
                header: 'Phone',
                accessorKey: 'phone',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.phone}</span>,
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                cell: (props) => {
                    const { status } = props.row.original;
                    return (
                        <div className="flex items-center">
                            <Tag className={statusColor[status]}>
                                <span className="capitalize">{status}</span>
                            </Tag>
                        </div>
                    );
                },
            },
            {
                header: '', // Action column
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onClone={() => handleCloneForm(props.row.original)}
                        onChangeStatus={() => handleChangeStatus(props.row.original)}
                        onEdit={() => handleEdit(props.row.original)}
                        onViewDetail={() => handleViewDetails(props.row.original)}
                    />
                ),
            },
        ],
        []
    );
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
