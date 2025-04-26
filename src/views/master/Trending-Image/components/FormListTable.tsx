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
    id: string
    pageName: string
    date: string
    status: 'active' | 'inactive' // Changed status options
    // Add other form-specific fields if needed later
}
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
    { id: 'F001', pageName: 'User Registration', date: '12-12-2024', status: 'active' },
    { id: 'F002', pageName: 'Contact Us', date: '12-12-2024', status: 'active' },
    { id: 'F003', pageName: 'Product Feedback V1', date: '12-12-2024', status: 'inactive' },
    { id: 'F004', pageName: 'Support Ticket', date: '12-12-2024', status: 'active' },
    { id: 'F005', pageName: 'Newsletter Signup', date: '12-12-2024', status: 'active' },
    { id: 'F006', pageName: 'Job Application', date: '12-12-2024', status: 'inactive' },
    { id: 'F007', pageName: 'Event RSVP', date: '12-12-2024', status: 'active' },
    { id: 'F008', pageName: 'Password Reset', date: '12-12-2024', status: 'active' },
    { id: 'F009', pageName: 'Feature Request', date: '12-12-2024', status: 'inactive' },
    { id: 'F010', pageName: 'Beta Program Signup', date: '12-12-2024', status: 'active' },
    { id: 'F011', pageName: 'Onboarding Checklist', date: '12-12-2024', status: 'active' },
    {
        id: 'F012',
        pageName: 'Customer Satisfaction Survey',
        date: '12-12-2024', status: 'inactive',
    },
]
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
                    form.pageName.toLowerCase().includes(query) ||
                    form.date.toLowerCase().includes(query) ||
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
        // Logic to clone the form (e.g., API call or local duplication)
        console.log('Cloning form:', form.id, form.pageName)
        // Example: date: '12-12-2024', Add a cloned item locally for demo
        const newId = `F${Math.floor(Math.random() * 9000) + 1000}` // Generate pseudo-random ID
        const clonedForm: FormItem = {
            ...form,
            id: newId,
            pageName: `${form.pageName} (Clone)`,
            date: `${form.date} (Clone)`,
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
                // Simple cell to display ID, enable sorting
                enableSorting: true,
                cell: (props) => <span>{props.row.original.id}</span>,
            },
            {
                header: 'Page Name',
                accessorKey: 'pageName',
                // Enable sorting
                date: '12-12-2024', enableSorting: true,
            },
            {
                header: 'Date',
                accessorKey: 'date',
                // Enable sorting
                date: '12-12-2024', enableSorting: true,
            },
            {
                header: 'Status',
                accessorKey: 'status',
                // Enable sorting
                enableSorting: true,
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
                header: '', // Keep header empty for actions
                id: 'action',
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
