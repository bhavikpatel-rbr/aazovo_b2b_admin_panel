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
    company_name: string // Added billing status
    company_code: string // Added company name
    gst_number: string // Added company ID
    pan_number: string // Added GST number
    company_photo: string // Added PAN number
    expiry_date: string // Added expiry_date URL
    company_type: string // Added expiry date
    country: string // Added country
    brands: Array<string> // Added brands
    category: Array<string> // Added category
    interested_in : string // Added interested_in
    active_member: number // Added active_member
    total_members: number // Added total_members
    member_participation: number // Added member_participation
    success_score: number // Added success_score
    trust_score: number // Added trust_score
    health_score: number // Added health_score
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
  {
    id: '1',
    company_name: 'TechNova Ltd.',
    company_code: 'TNL001',
    gst_number: '27AAACT2727Q1Z5',
    pan_number: 'AAACT2727Q',
    company_photo: 'https://via.placeholder.com/80',
    expiry_date: 'https://via.placeholder.com/80',
    company_type: 'Private Limited',
    country: 'India',
    brands: ['TechNova', 'NovaGear'],
    category: ['Electronics', 'Automation'],
    interested_in: 'Partnership',
    active_member: 25,
    total_members: 100,
    member_participation: 85,
    success_score: 92,
    trust_score: 88,
    health_score: 90,
    status: 'active',
  },
  {
    id: '2',
    company_name: 'GreenField Corp.',
    company_code: 'GFC002',
    gst_number: '29AACCG1234H1Z6',
    pan_number: 'AACCG1234H',
    company_photo: 'https://via.placeholder.com/80',
    expiry_date: 'https://via.placeholder.com/80',
    company_type: 'LLP',
    country: 'USA',
    brands: ['GreenField', 'EcoBuild'],
    category: ['Construction', 'Sustainability'],
    interested_in: 'Investment',
    active_member: 40,
    total_members: 150,
    member_participation: 70,
    success_score: 78,
    trust_score: 82,
    health_score: 75,
    status: 'inactive',
  },
  {
    id: '3',
    company_name: 'AutoSync Pvt. Ltd.',
    company_code: 'ASPL003',
    gst_number: '07AABCU9603R1ZV',
    pan_number: 'AABCU9603R',
    company_photo: 'https://via.placeholder.com/80',
    expiry_date: 'https://via.placeholder.com/80',
    company_type: 'Pvt Ltd',
    country: 'Germany',
    brands: ['AutoSync', 'SyncDrive'],
    category: ['Automobile', 'Technology'],
    interested_in: 'Collaboration',
    active_member: 10,
    total_members: 60,
    member_participation: 50,
    success_score: 65,
    trust_score: 70,
    health_score: 60,
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
            const query = tableData.query.toLowerCase();
            filteredData = forms.filter(
                (form) =>
                    form.id.toLowerCase().includes(query) ||
                    form.company_name.toLowerCase().includes(query) ||
                    form.company_code.toLowerCase().includes(query) ||
                    form.gst_number.toLowerCase().includes(query) ||
                    form.pan_number.toLowerCase().includes(query) ||
                    form.company_photo.toLowerCase().includes(query) ||
                    form.expiry_date.toLowerCase().includes(query) ||
                    form.company_type.toLowerCase().includes(query) ||
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
        // Example: Add a cloned item locally for demo
        const newId = `F${Math.floor(Math.random() * 9000) + 1000}` // Generate pseudo-random ID
        const clonedForm: FormItem = {
            ...form,
            id: newId,
            company_name: `${form.company_name} (Clone)`,
            company_code: `${form.company_code} (Clone)`,
            gst_number: `${form.gst_number} (Clone)`,
            pan_number: `${form.pan_number} (Clone)`,
            company_photo: `${form.company_photo} (Clone)`,
            expiry_date: `${form.expiry_date}`, // Keep the same expiry_date URL
            company_type: `${form.company_type}`, // Keep the same expiry date
            status: 'inactive', // Cloned forms start as inactive
        };
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
            size: 70,
            cell: (props) => <span>{props.row.original.id}</span>,
            },
            {
            header: 'Company Name',
            accessorKey: 'company_name',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.company_name}</span>,
            },
            {
            header: 'Company Code',
            accessorKey: 'company_code',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.company_code}</span>,
            },
            {
            header: 'GST Number',
            accessorKey: 'gst_number',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.gst_number}</span>,
            },
            {
            header: 'PAN Number',
            accessorKey: 'pan_number',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.pan_number}</span>,
            },
            {
            header: 'Company Photo URL',
            accessorKey: 'company_photo',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.company_photo}</span>,
            },
            {
            header: 'Company Photo',
            accessorKey: 'expiry_date',
            // cell: (props) => (
            //     <Avatar
            //     src={props.row.original.expiry_date}
            //     alt="Company Photo"
            //     size="sm"
            //     />
            // ),
            },
            {
            header: 'Company Type',
            accessorKey: 'company_type',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.company_type}</span>,
            },
            {
            header: 'Country',
            accessorKey: 'country',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.country}</span>,
            },
            {
            header: 'Brands',
            accessorKey: 'brands',
            cell: (props) => <span>{props.row.original.brands.join(', ')}</span>,
            },
            {
            header: 'Categories',
            accessorKey: 'category',
            cell: (props) => <span>{props.row.original.category.join(', ')}</span>,
            },
            {
            header: 'Interested In',
            accessorKey: 'interested_in',
            cell: (props) => <span>{props.row.original.interested_in}</span>,
            },
            {
            header: 'Active Members',
            accessorKey: 'active_member',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.active_member}</span>,
            },
            {
            header: 'Total Members',
            accessorKey: 'total_members',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.total_members}</span>,
            },
            {
            header: 'Member Participation',
            accessorKey: 'member_participation',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.member_participation}</span>,
            },
            {
            header: 'Success Score',
            accessorKey: 'success_score',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.success_score}</span>,
            },
            {
            header: 'Trust Score',
            accessorKey: 'trust_score',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.trust_score}</span>,
            },
            {
            header: 'Health Score',
            accessorKey: 'health_score',
            enableSorting: true,
            cell: (props) => <span>{props.row.original.health_score}</span>,
            },
            {
            header: 'Status',
            accessorKey: 'status',
            enableSorting: true,
            size: 120,
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
            header: 'Actions',
            id: 'action',
            size: 160,
            meta: { HeaderClass: 'text-center' },
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
