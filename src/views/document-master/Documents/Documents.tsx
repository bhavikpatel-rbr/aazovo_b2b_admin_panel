// src/views/your-path/Continents.tsx

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form' // Added for filter form
import { zodResolver } from '@hookform/resolvers/zod' // Added for filter form
import { z } from 'zod' // Added for filter form
import type { ZodType } from 'zod' // Added for filter form

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import RichTextEditor from '@/components/shared/RichTextEditor'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Checkbox from '@/components/ui/Checkbox' // Added for filter form
import Input from '@/components/ui/Input' // Added for filter form
import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // Added for filter form & renamed FormItem

// Icons
import {
    TbPencil,
    TbCopy,
    TbSwitchHorizontal,
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbPlus,
    TbFilter, // Added for filter button
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define FormItem Type (Table Row Data) ---
export type FormItem = {
    id: string
    name: string
    status: 'active' | 'inactive'
    // Add fields corresponding to filter schema
    purchasedProducts?: string // Optional product associated with form
    purchaseChannel?: string // Optional channel associated with form
}
// --- End FormItem Type Definition ---

// --- Define Filter Schema Type (Matches the provided filter component) ---
type FilterFormSchema = {
    purchasedProducts: string | any
    purchaseChannel: Array<string> | any
}
// --- End Filter Schema Type ---

// --- Constants ---
const statusColor: Record<FormItem['status'], string> = {
    active: 'bg-green-200 dark:bg-green-200 text-green-900 dark:text-green-900',
    inactive: 'bg-red-200 dark:bg-red-200 text-red-900 dark:text-red-900',
}

const initialDummyForms: FormItem[] = [
    {
        id: 'F001',
        name: 'User Registration Form',
        status: 'active',
        purchasedProducts: 'Premium Plan',
        purchaseChannel: 'Online Retailers',
    },
    {
        id: 'F002',
        name: 'Contact Request',
        status: 'active',
        purchaseChannel: 'Direct Sales',
    },
    {
        id: 'F003',
        name: 'Product Feedback Survey',
        status: 'inactive',
        purchasedProducts: 'Basic Widget',
    },
    {
        id: 'F004',
        name: 'Support Ticket Submission',
        status: 'active',
        purchaseChannel: 'Mobile Apps',
    },
    {
        id: 'F005',
        name: 'Newsletter Subscription',
        status: 'active',
        purchaseChannel: 'Online Retailers',
    },
    { id: 'F006', name: 'Job Application Portal', status: 'inactive' },
    {
        id: 'F007',
        name: 'Event Registration',
        status: 'active',
        purchaseChannel: 'Resellers',
    },
    { id: 'F008', name: 'Password Recovery', status: 'active' },
    {
        id: 'F009',
        name: 'Feature Suggestion Box',
        status: 'inactive',
        purchasedProducts: 'Advanced Gadget',
    },
    {
        id: 'F010',
        name: 'Beta Program Application',
        status: 'active',
        purchaseChannel: 'Direct Sales',
    },
    { id: 'F011', name: 'Company Onboarding', status: 'active' },
    {
        id: 'F012',
        name: 'Satisfaction Poll',
        status: 'inactive',
        purchasedProducts: 'Premium Plan',
        purchaseChannel: 'Mobile Apps',
    },
]

// Filter specific constant from the provided filter component
const channelList = [
    'Retail Stores',
    'Online Retailers',
    'Resellers',
    'Mobile Apps',
    'Direct Sales',
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone,
    onChangeStatus,
    onDelete,
}: {
    onEdit: () => void
    onClone: () => void
    onChangeStatus: () => void
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
            {/* <Tooltip title="Clone Form">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400',
                    )}
                    role="button"
                    onClick={onClone}
                >
                    <TbCopy />
                </div>
            </Tooltip> */}
            <Tooltip title="Change Status">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400',
                    )}
                    role="button"
                    onClick={onChangeStatus}
                >
                    <TbSwitchHorizontal />
                </div>
            </Tooltip>
            <Tooltip title="Edit">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400',
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

// --- FormListTable Component ---
const FormListTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedForms,
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
    selectedForms: FormItem[]
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
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedForms.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}
// --- End FormListTable ---

// --- FormListSearch Component ---
type FormListSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const FormListSearch = React.forwardRef<HTMLInputElement, FormListSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                className="w-full "
                placeholder="Quick search..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
FormListSearch.displayName = 'FormListSearch'
// --- End FormListSearch ---

// --- FormListTableFilter Component (As provided by user, adapted for props) ---
const FormListTableFilter = ({
    // Mimic the data structure the original hook would provide
    filterData,
    setFilterData,
}: {
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
}) => {
    const [dialogIsOpen, setIsOpen] = useState(false)

    // Zod validation schema from the provided code
    const validationSchema: ZodType<FilterFormSchema> = z.object({
        purchasedProducts: z.string().optional().default(''), // Made optional for better reset
        purchaseChannel: z.array(z.string()).optional().default([]), // Made optional for better reset
    })

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {
        setIsOpen(false)
    }

    const { handleSubmit, reset, control } = useForm<FilterFormSchema>({
        // Use the filterData passed from the parent as default values
        defaultValues: filterData,
        resolver: zodResolver(validationSchema),
    })

    // Watch for prop changes to reset the form if external state changes
    React.useEffect(() => {
        reset(filterData)
    }, [filterData, reset])

    const onSubmit = (values: FilterFormSchema) => {
        setFilterData(values) // Call the setter function passed from parent
        setIsOpen(false)
    }

    const handleReset = () => {
        // Reset form using react-hook-form's reset
        const defaultVals = validationSchema.parse({}) // Get default values from schema
        reset(defaultVals)
        // Optionally also immediately apply the reset filter state to the parent
        // setFilterData(defaultVals);
        // onDialogClose(); // Close after resetting if desired
    }

    return (
        <>
            <Button icon={<TbFilter />} onClick={openDialog}>
                Filter
            </Button>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h4 className="mb-4">Filter Forms</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    {/* Input from the provided filter component */}
                    <UiFormItem label="Products">
                        <Controller
                            name="purchasedProducts"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="Search by purchased product"
                                    {...field}
                                />
                            )}
                        />
                    </UiFormItem>
                    {/* Checkboxes from the provided filter component */}
                    <UiFormItem label="Purchase Channel">
                        <Controller
                            name="purchaseChannel"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    value={field.value || []} // Ensure value is array
                                    onChange={field.onChange}
                                >
                                    {channelList.map((source, index) => (
                                        <Checkbox
                                            key={source + index}
                                            // name={field.name} // Not needed when using Controller value/onChange
                                            value={source}
                                            className="mb-1" // Use mb-1 for spacing
                                        >
                                            {source}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </UiFormItem>
                    <div className="flex justify-end items-center gap-2 mt-6">
                        <Button type="button" onClick={handleReset}>
                            Reset
                        </Button>
                        <Button type="submit" variant="solid">
                            Apply
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    )
}
// --- End FormListTableFilter ---

// --- FormListTableTools Component ---
// Passes filter state and setter down to FormListTableFilter
const FormListTableTools = ({
    onSearchChange,
    filterData,
    setFilterData, // Pass the setter down
}: {
    onSearchChange: (query: string) => void
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void // Prop type for setter
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <FormListSearch onInputChange={onSearchChange} />
            {/* Render the filter component, passing props */}
            <FormListTableFilter
                filterData={filterData}
                setFilterData={setFilterData}
            />
        </div>
    )
}
// --- End FormListTableTools ---

// --- FormListActionTools Component ---
const FormListActionTools = ({ allForms }: { allForms: FormItem[] }) => {
    const navigate = useNavigate()
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Status', key: 'status' },
        { label: 'Associated Product', key: 'purchasedProducts' },
        { label: 'Purchase Channel', key: 'purchaseChannel' },
    ]

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink
                className="w-full"
                filename="formList.csv"
                data={allForms}
                headers={csvHeaders}
            >
                <Button icon={<TbCloudDownload />} className="w-full" block>
                    Download
                </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={() => console.log('Navigate to Add New Form page')}
                block
            >
                Add New
            </Button>
        </div>
    )
}
// --- End FormListActionTools ---

// --- FormListSelected Component ---
const FormListSelected = ({
    selectedForms,
    setSelectedForms,
    onDeleteSelected,
}: {
    selectedForms: FormItem[]
    setSelectedForms: React.Dispatch<React.SetStateAction<FormItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedForms.length === 0) return null

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
                                {selectedForms.length}
                            </span>
                            <span>
                                Form{selectedForms.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedForms.length} Form${selectedForms.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected form
                    {selectedForms.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End FormListSelected ---

// --- Main Continents Component ---
const Documents = () => {
    const navigate = useNavigate()

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false)
    const [forms, setForms] = useState<FormItem[]>(initialDummyForms)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedForms, setSelectedForms] = useState<FormItem[]>([])
    // State for Filters (matching the provided filter component schema)
    const [filterData, setFilterData] = useState<FilterFormSchema>({
        purchasedProducts: '',
        purchaseChannel: [],
    })
    // --- End Lifted State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...forms]

        // --- Apply Filtering ---
        // Filter by Purchase Channel (multi-select)
        if (
            filterData.purchaseChannel &&
            filterData.purchaseChannel.length > 0
        ) {
            const channelSet = new Set(filterData.purchaseChannel)
            processedData = processedData.filter(
                (form) =>
                    form.purchaseChannel &&
                    channelSet.has(form.purchaseChannel),
            )
        }
        // Filter by Purchased Product (text search)
        if (filterData.purchasedProducts) {
            const productQuery = filterData.purchasedProducts.toLowerCase()
            processedData = processedData.filter((form) =>
                form.purchasedProducts?.toLowerCase().includes(productQuery),
            )
        }

        // --- Apply Search (on remaining fields) ---
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (form) =>
                    form.id.toLowerCase().includes(query) ||
                    form.name.toLowerCase().includes(query) ||
                    form.status.toLowerCase().includes(query),
            )
        }

        // --- Apply Sorting ---
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                const aValue = a[key as keyof FormItem] ?? ''
                const bValue = b[key as keyof FormItem] ?? ''
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                return 0
            })
            processedData = sortedData
        }

        // --- Apply Pagination ---
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const dataTotal = processedData.length
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return { pageData: dataForPage, total: dataTotal }
    }, [forms, tableData, filterData]) // Added filterData dependency
    // --- End Memoized Data Processing ---

    // --- Lifted Handlers ---
    // Handler to update filter state (passed to filter component)
    const handleApplyFilter = useCallback((newFilterData: FilterFormSchema) => {
        setFilterData(newFilterData)
        setTableData((prevTableData) => ({ ...prevTableData, pageIndex: 1 }))
        setSelectedForms([])
    }, []) // No dependencies needed as it only sets state

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
            setSelectedForms([])
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
        [tableData, handleSetTableData], // Depend on tableData
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
            const rowIds = new Set(rows.map((r) => r.original.id))
            if (checked) {
                const originalRows = rows.map((row) => row.original)
                setSelectedForms((prev) => {
                    const existingIds = new Set(prev.map((f) => f.id))
                    const newSelection = originalRows.filter(
                        (f) => !existingIds.has(f.id),
                    )
                    return [...prev, ...newSelection]
                })
            } else {
                setSelectedForms((prev) =>
                    prev.filter((f) => !rowIds.has(f.id)),
                )
            }
        },
        [],
    )

    const handleEdit = useCallback(
        (form: FormItem) => {
            console.log('Edit form:', form.id)
            // navigate(`/forms/edit/${form.id}`);
        },
        [navigate],
    )

    const handleCloneForm = useCallback((form: FormItem) => {
        console.log('Cloning form:', form.id, form.name)
        const newId = `F${Math.floor(Math.random() * 9000) + 1000}`
        const clonedForm: FormItem = {
            ...form,
            id: newId,
            name: `${form.name} (Clone)`,
            status: 'inactive',
        }
        setForms((prev) => [clonedForm, ...prev])
    }, [])

    const handleChangeStatus = useCallback((form: FormItem) => {
        const newStatus = form.status === 'active' ? 'inactive' : 'active'
        console.log(`Changing status of form ${form.id} to ${newStatus}`)
        setForms((currentForms) =>
            currentForms.map((f) =>
                f.id === form.id ? { ...f, status: newStatus } : f,
            ),
        )
    }, [])

    const handleDelete = useCallback((formToDelete: FormItem) => {
        console.log('Deleting form:', formToDelete.id, formToDelete.name)
        setForms((currentForms) =>
            currentForms.filter((form) => form.id !== formToDelete.id),
        )
        setSelectedForms((prevSelected) =>
            prevSelected.filter((form) => form.id !== formToDelete.id),
        )
    }, [])

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected forms:',
            selectedForms.map((f) => f.id),
        )
        const selectedIds = new Set(selectedForms.map((f) => f.id))
        setForms((currentForms) =>
            currentForms.filter((f) => !selectedIds.has(f.id)),
        )
        setSelectedForms([])
    }, [selectedForms])
    // --- End Lifted Handlers ---

    // --- Define Columns in Parent ---
    const columns: ColumnDef<FormItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size:70 },
            { header: 'Documents Name', accessorKey: 'name', enableSorting: true, size:260 },
            // Example column using one of the new fields
            {
                header: 'Documents Type',
                accessorKey: 'purchaseChannel',
                enableSorting: true,
                size:160
            },
            {
                header: 'Status',
                accessorKey: 'status',
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
                header: 'Action',
                id: 'action',
                size: 100, // Adjust width for actions
                meta:{HeaderClass: "text-center"},
                cell: (props) => (
                    <ActionColumn
                        onClone={() => handleCloneForm(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleCloneForm, handleChangeStatus, handleEdit, handleDelete],
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full">
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Document</h5>
                    <FormListActionTools allForms={forms} />
                </div>

                <div className="mb-4 w-full">
                    <FormListTableTools
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter} // Pass the handler to update filter state
                    />
                </div>

                <FormListTable
                    columns={columns}
                    data={pageData}
                    loading={isLoading}
                    pagingData={{
                        total: total,
                        pageIndex: tableData.pageIndex as number,
                        pageSize: tableData.pageSize as number,
                    }}
                    selectedForms={selectedForms}
                    onPaginationChange={handlePaginationChange}
                    onSelectChange={handleSelectChange}
                    onSort={handleSort}
                    onRowSelect={handleRowSelect}
                    onAllRowSelect={handleAllRowSelect}
                />
            </AdaptiveCard>

            <FormListSelected
                selectedForms={selectedForms}
                setSelectedForms={setSelectedForms}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default Documents

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
