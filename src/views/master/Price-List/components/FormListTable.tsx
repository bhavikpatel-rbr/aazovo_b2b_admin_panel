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
    id: string
    productName: string
    price: string
    basePrice: string
    gstPrice: string
    usd: string // Added USD field
    expance: string // Added expense field
    margin: string // Added margin field
    interest: string // Added interest field
    nlc: string // Added NLC field
    salesPrice: string // Added sales price field
    qty: string // Added quantity field
    status: 'active' | 'inactive' // Changed status options
    // Add other form-specific fields if needed later
}
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
    { id: 'F001', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active' },
    { id: 'F002', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active'},
    { id: 'F003', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active' },
    { id: 'F004', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active'},
    { id: 'F005', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active'},
    { id: 'F006', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active'},
    { id: 'F007', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active'},
    { id: 'F008', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active'},
    { id: 'F009', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active'},
    { id: 'F010', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active' },
    { id: 'F011', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active'},
    { id: 'F012', productName: 'Test', price: 'test', basePrice: 'Home', gstPrice: '₹10', usd: 'test', expance: 'test', margin: 'test', interest: 'test', nlc: 'test', salesPrice: 'price' , qty: '10', status: 'active'},
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
                    form.productName.toLowerCase().includes(query) ||
                    form.price.toLowerCase().includes(query) ||
                    form.basePrice.toLowerCase().includes(query) ||
                    form.gstPrice.toLowerCase().includes(query) ||
                    form.usd.toLowerCase().includes(query) ||
                    form.expance.toLowerCase().includes(query) ||
                    form.margin.toLowerCase().includes(query) ||
                    form.interest.toLowerCase().includes(query) ||
                    form.nlc.toLowerCase().includes(query) ||
                    form.salesPrice.toLowerCase().includes(query) ||
                    form.qty.toLowerCase().includes(query) ||
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
        console.log('Cloning form:', form.id, form.productName)
        // Example: Add a cloned item locally for demo
        const newId = `F${Math.floor(Math.random() * 9000) + 1000}` // Generate pseudo-random ID
        const clonedForm: FormItem = {
            ...form,
            id: newId,
            productName: `${form.productName} (Clone)`,
            price: `${form.price} (Clone)`,
            basePrice: `${form.basePrice} (Clone)`,
            gstPrice: `${form.gstPrice} (Clone)`,
            usd: `${form.usd} (Clone)`,
            expance: `${form.expance} (Clone)`,
            margin: `${form.margin} (Clone)`,
            interest: `${form.interest} (Clone)`,
            nlc: `${form.nlc} (Clone)`,
            salesPrice: `${form.salesPrice} (Clone)`,
            qty: `${form.qty} (Clone)`,
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
                // Simple cell to display ID, enable sorting
                enableSorting: true,
                size:70,
                cell: (props) => <span>{props.row.original.id}</span>,
            },
            {
                header: 'Product Name',
                accessorKey: 'productName',
                // Enable sorting
                enableSorting: true,
                size:260
            },
            {
                header: 'Price Breakup',
                id: 'pricing',
                enableSorting: true,
                size:260,
                cell: (props) => {
                    const {basePrice, gstPrice, usd } = props.row.original
                    return (
                        <div className='flex flex-col'>
                            <span className='font-semibold'>Base Price: {basePrice}</span>
                            <span className='text-xs'>GST: {gstPrice}</span>
                            <span className='text-xs'>IN USD: {usd}</span>
                        </div>
                    )
                }
            },
            {
                header: 'Cost Split',
                id: 'costsplit',
                enableSorting: true,
                size:260,
                cell: (props) => {
                    const {expance, margin, interest, nlc } = props.row.original
                    return (
                        <div className='flex flex-col'>
                            <span className='font-semibold'>Expance: {expance}</span>
                            <span className='text-xs'>Margin: {margin}</span>
                            <span className='text-xs'>Interest: {interest}</span>
                            <span className='text-xs'>NLC: {nlc}</span>
                        </div>
                    )
                }
            },
            // {
            //     header: 'Base Page',
            //     accessorKey: 'basePrice',
            //     // Enable sorting
            //     enableSorting: true,
            // },
            // {
            //     header: 'GST Price',
            //     accessorKey: 'gstPrice',
            //     // Enable sorting
            //     enableSorting: true,
            // },
            // {
            //     header: 'USD',
            //     accessorKey: 'usd',
            //     // Enable sorting
            //     enableSorting: true,
            // },
            // {
            //     header: 'Expance',
            //     accessorKey: 'expance',
            //     // Enable sorting
            //     enableSorting: true,
            // },
            // {
            //     header: 'Margin',
            //     accessorKey: 'margin',
            //     // Enable sorting
            //     enableSorting: true,
            // },
            // {
            //     header: 'Interest',
            //     accessorKey: 'interest',
            //     // Enable sorting
            //     enableSorting: true,
            // },
            // {
            //     header: 'NLC',
            //     accessorKey: 'nlc',
            //     // Enable sorting
            //     enableSorting: true,
            // },
            {
                header: 'Sales Price',
                accessorKey: 'salesPrice',
                // Enable sorting
                enableSorting: true,
                size:220
            },
            {
                header: 'Qty',
                accessorKey: 'qty',
                // Enable sorting
                enableSorting: true,
                size:100
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
