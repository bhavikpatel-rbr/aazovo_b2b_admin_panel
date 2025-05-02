// src/views/your-path/BrandListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref, Suspense, lazy } from 'react'
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
import Dialog from '@/components/ui/Dialog' // Keep for potential edit/view modals
import Avatar from '@/components/ui/Avatar' // Use for Icon column
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
// import RichTextEditor from '@/components/shared/RichTextEditor'; // Remove if not used
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbBuildingStore } from 'react-icons/tb' // Placeholder icon for brand icon
import Checkbox from '@/components/ui/Checkbox' // Added for filter form
import Input from '@/components/ui/Input' // Added for filter form
import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // Added for filter form & renamed FormItem

// Icons
import {
    TbPencil,
    TbCopy, // Keep clone if needed
    TbSwitchHorizontal, // For status change
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudUpload ,
    TbCloudDownload, // Keep for potential future export
    // TbUserPlus, // Replace with a more suitable icon
    TbFilter, // Added for filter button
} from 'react-icons/tb'

// Types
import type {
    OnSortParam,
    ColumnDef,
    Row,
    // SortingFnOption,
} from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
    import('react-csv').then((module) => ({ default: module.CSVLink })),
)
// --- End Lazy Load ---

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
type BrandFilterFormSchema = {
    purchasedProducts: string | any
    purchaseChannel: Array<string> | any
}
// --- End Filter Schema Type ---

// --- Define Item Type (Table Row Data) ---
export type BrandItem = {
    id: string
    status: 'active' | 'inactive'
    name: string
    mobileNo: string | null // Store as string, allow null
    icon: string | null // URL for icon/logo, allow null
}
// --- End Item Type Definition ---

// --- Constants ---
const statusColor: Record<BrandItem['status'], string> = {
    active: 'text-green-600 bg-green-200', // Use solid colors for tags
    inactive: 'text-red-600 bg-red-200',
}

const initialDummyBrands: BrandItem[] = [
    {
        id: 'BRD001',
        status: 'active',
        name: 'Alpha Gadgets',
        mobileNo: '+1-555-123-4567',
        icon: '/img/brands/alpha.png',
    },
    {
        id: 'BRD002',
        status: 'active',
        name: 'Beta Solutions',
        mobileNo: '+44-20-7946-0987',
        icon: '/img/brands/beta.svg',
    },
    {
        id: 'BRD003',
        status: 'inactive',
        name: 'Gamma Apparel',
        mobileNo: null,
        icon: '/img/brands/gamma.jpg',
    },
    {
        id: 'BRD004',
        status: 'active',
        name: 'Delta Foods',
        mobileNo: '+1-800-555-FOOD',
        icon: null,
    }, // No icon
    {
        id: 'BRD005',
        status: 'active',
        name: 'Epsilon Home',
        mobileNo: '+33-1-4567-8901',
        icon: '/img/brands/epsilon.png',
    },
    {
        id: 'BRD006',
        status: 'inactive',
        name: 'Zeta Toys',
        mobileNo: null,
        icon: null,
    },
    {
        id: 'BRD007',
        status: 'active',
        name: 'Eta Fitness',
        mobileNo: '+49-30-123456',
        icon: '/img/brands/eta.png',
    },
    {
        id: 'BRD008',
        status: 'active',
        name: 'Theta Travel',
        mobileNo: '+61-2-9876-5432',
        icon: '/img/brands/theta.svg',
    },
    {
        id: 'BRD009',
        status: 'inactive',
        name: 'Iota Beauty',
        mobileNo: '+1-212-555-7890',
        icon: '/img/brands/iota.jpg',
    },
    {
        id: 'BRD010',
        status: 'active',
        name: 'Kappa Auto',
        mobileNo: null,
        icon: '/img/brands/kappa.png',
    },
    {
        id: 'BRD011',
        status: 'active',
        name: 'Lambda Books',
        mobileNo: '+81-3-1111-2222',
        icon: null,
    },
    {
        id: 'BRD012',
        status: 'active',
        name: 'Mu Media',
        mobileNo: '+1-310-555-3344',
        icon: '/img/brands/mu.svg',
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
    onClone?: () => void // Keep clone optional
    onChangeStatus: () => void // Status change seems relevant
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
            {/* Optional Clone Button */}
            {/* {onClone && (
                <Tooltip title="Clone Brand">
                    <div
                        className={classNames(
                            iconButtonClass,
                            hoverBgClass,
                            'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                        )}
                        role="button"
                        onClick={onClone}
                    >
                        {' '}
                        <TbCopy />{' '}
                    </div>
                </Tooltip>
            )} */}
            <Tooltip title="Change Status">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400',
                    )}
                    role="button"
                    onClick={onChangeStatus}
                >
                    {' '}
                    <TbSwitchHorizontal />{' '}
                </div>
            </Tooltip>
            <Tooltip title="Edit Brand">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    {' '}
                    <TbPencil />{' '}
                </div>
            </Tooltip>
            <Tooltip title="Delete Brand">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400',
                    )}
                    role="button"
                    onClick={onDelete}
                >
                    {' '}
                    <TbTrash />{' '}
                </div>
            </Tooltip>
        </div>
    )
}
// --- End ActionColumn ---

// --- BrandTable Component ---
const BrandTable = ({
    // Renamed component
    columns,
    data,
    loading,
    pagingData,
    selectedBrands, // Renamed prop
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<BrandItem>[]
    data: BrandItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedBrands: BrandItem[] // Use new type
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: BrandItem) => void // Use new type
    onAllRowSelect: (checked: boolean, rows: Row<BrandItem>[]) => void // Use new type
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={
                (row) =>
                    selectedBrands.some((selected) => selected.id === row.id) // Use selectedBrands
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}
// --- End BrandTable ---

// --- BrandSearch Component ---
type BrandSearchProps = {
    // Renamed component
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const BrandSearch = React.forwardRef<HTMLInputElement, BrandSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Quick search..." // Updated placeholder
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
BrandSearch.displayName = 'BrandSearch'
// --- End BrandSearch ---

// --- BrandTableFilter Component (As provided by user, adapted for props) ---
const BrandTableFilter = ({
    // Mimic the data structure the original hook would provide
    filterData,
    setFilterData,
}: {
    filterData: BrandFilterFormSchema
    setFilterData: (data: BrandFilterFormSchema) => void
}) => {
    const [dialogIsOpen, setIsOpen] = useState(false)

    // Zod validation schema from the provided code
    const validationSchema: ZodType<BrandFilterFormSchema> = z.object({
        purchasedProducts: z.string().optional().default(''), // Made optional for better reset
        purchaseChannel: z.array(z.string()).optional().default([]), // Made optional for better reset
    })

    const openDialog = () => {
        setIsOpen(true)
    }

    const onDialogClose = () => {
        setIsOpen(false)
    }

    const { handleSubmit, reset, control } = useForm<BrandFilterFormSchema>({
        // Use the filterData passed from the parent as default values
        defaultValues: filterData,
        resolver: zodResolver(validationSchema),
    })

    // Watch for prop changes to reset the form if external state changes
    React.useEffect(() => {
        reset(filterData)
    }, [filterData, reset])

    const onSubmit = (values: BrandFilterFormSchema) => {
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
            <Button icon={<TbFilter />} onClick={openDialog} className=''>
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

// --- BrandTableTools Component ---
const BrandTableTools = ({
    // Renamed component
    onSearchChange,
    filterData,
    setFilterData,
    allBrands,
}: {
    onSearchChange: (query: string) => void
    filterData: BrandFilterFormSchema
    setFilterData: (data: BrandFilterFormSchema) => void // Prop type for setter
    allBrands: BrandItem[] // Pass all subscribers for export
}) => {

    // Prepare data for CSV
    const csvData = useMemo(
        () =>
            allBrands.map((s) => ({
                id: s.id,
                name: s.name,
                icon: s.icon,
                mobileNo: s.mobileNo,
                status: s.status,
            })),
        [allBrands],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Icon', key: 'icon' },
        { label: 'Mobile No', key: 'mobileNo' },
        { label: 'status', key: 'status' },
    ]
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            {/* <div className="flex-grow"> */}
                <BrandSearch onInputChange={onSearchChange} />
                <BrandTableFilter
                    filterData={filterData}
                    setFilterData={setFilterData}
                />
                <Button icon={<TbCloudDownload/>}>Import</Button>
                <Suspense fallback={<Button loading>Loading Export...</Button>}>
                    <CSVLink
                        filename="brands.csv"
                        data={csvData}
                        headers={csvHeaders}
                    >
                        <Button icon={<TbCloudUpload/>}>Export</Button>
                    </CSVLink>
                </Suspense>
            {/* </div> */}
            {/* Filter button could be added here if needed */}
        </div>
    )
}
// --- End BrandTableTools ---

// --- BrandActionTools Component ---
const BrandActionTools = ({ allBrands }: { allBrands: BrandItem[] }) => {
    // Renamed prop and component
    const navigate = useNavigate()

    // Prepare data for CSV
    const csvData = useMemo(() => {
        return allBrands.map((item) => ({
            id: item.id,
            name: item.name,
            status: item.status,
            mobileNo: item.mobileNo ?? 'N/A',
            iconUrl: item.icon ?? 'No Icon',
        }))
    }, [allBrands])

    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Status', key: 'status' },
        { label: 'Mobile No', key: 'mobileNo' },
        { label: 'Icon URL', key: 'iconUrl' }, // Match prepared data key
    ]

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink filename="brands.csv" data={csvData} headers={csvHeaders} >
                <Button icon={<TbCloudDownload />} className="w-full" block> Download </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbBuildingStore className="text-lg" />} // Changed icon
                onClick={() => console.log('Navigate to Add New Brand page')}
                // onClick={() => navigate('/brands/create')}
                block
            >
                Add New {/* Updated Text */}
            </Button>
        </div>
    )
}
// --- End BrandActionTools ---

// --- BrandSelected Component ---
const BrandSelected = ({
    // Renamed component
    selectedBrands, // Renamed prop
    setSelectedBrands, // Renamed prop
    onDeleteSelected,
}: {
    selectedBrands: BrandItem[] // Use new type
    setSelectedBrands: React.Dispatch<React.SetStateAction<BrandItem[]>> // Use new type
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedBrands.length === 0) return null

    return (
        <>
            <StickyFooter
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
            >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400">
                            {' '}
                            <TbChecks />{' '}
                        </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">
                                {selectedBrands.length}
                            </span>{' '}
                            {/* Use selectedBrands */}
                            <span>
                                Brand{selectedBrands.length > 1 ? 's' : ''}{' '}
                                selected
                            </span>{' '}
                            {/* Updated text */}
                        </span>
                    </span>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant="plain"
                            className="text-red-600 hover:text-red-500"
                            onClick={handleDeleteClick}
                        >
                            {' '}
                            Delete{' '}
                        </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedBrands.length} Brand${selectedBrands.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected brand
                    {selectedBrands.length > 1 ? 's' : ''}? This action cannot
                    be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End BrandSelected ---

// --- Main BrandListing Component ---
const Brands = () => {
    // Renamed Component
    const navigate = useNavigate()

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false)
    const [brands, setBrands] = useState<BrandItem[]>(initialDummyBrands) // Renamed state
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedBrands, setSelectedBrands] = useState<BrandItem[]>([]) // Renamed state

    const [selectedForms, setSelectedForms] = useState<FormItem[]>([])
    // State for Filters (matching the provided filter component schema)
    const [filterData, setFilterData] = useState<BrandFilterFormSchema>({
        purchasedProducts: '',
        purchaseChannel: [],
    })
    // --- End Lifted State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...brands] // Use brands state

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (brand) =>
                    brand.id.toLowerCase().includes(query) ||
                    brand.name.toLowerCase().includes(query) ||
                    (brand.mobileNo?.toLowerCase().includes(query) ?? false) || // Search mobile safely
                    brand.status.toLowerCase().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                const aValue = a[key as keyof BrandItem] ?? ''
                const bValue = b[key as keyof BrandItem] ?? ''

                // Handle nulls for mobileNo sorting
                if (key === 'mobileNo') {
                    if (aValue === null && bValue === null) return 0
                    if (aValue === null) return order === 'asc' ? -1 : 1
                    if (bValue === null) return order === 'asc' ? 1 : -1
                }

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
    }, [brands, tableData]) // Use brands state
    // --- End Memoized Data Processing ---

    // --- Lifted Handlers (Update parameter types and state setters) ---

    // Handler to update filter state (passed to filter component)
    const handleApplyFilter = useCallback((newFilterData: BrandFilterFormSchema) => {
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
            setSelectedBrands([])
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

    const handleRowSelect = useCallback((checked: boolean, row: BrandItem) => {
        // Use new type
        setSelectedBrands((prev) => {
            // Use new state setter
            if (checked) {
                return prev.some((brand) => brand.id === row.id)
                    ? prev
                    : [...prev, row]
            } else {
                return prev.filter((brand) => brand.id !== row.id)
            }
        })
    }, []) // Add setSelectedBrands if linting complains

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<BrandItem>[]) => {
            // Use new type
            const rowIds = new Set(rows.map((r) => r.original.id))
            if (checked) {
                const originalRows = rows.map((row) => row.original)
                setSelectedBrands((prev) => {
                    // Use new state setter
                    const existingIds = new Set(prev.map((brand) => brand.id))
                    const newSelection = originalRows.filter(
                        (brand) => !existingIds.has(brand.id),
                    )
                    return [...prev, ...newSelection]
                })
            } else {
                setSelectedBrands((prev) =>
                    prev.filter((brand) => !rowIds.has(brand.id)),
                ) // Use new state setter
            }
        },
        [],
    ) // Add setSelectedBrands if linting complains

    const handleEdit = useCallback(
        (brand: BrandItem) => {
            // Use new type
            console.log('Edit brand:', brand.id)
            // navigate(`/brands/edit/${brand.id}`);
        },
        [navigate],
    )

    const handleClone = useCallback((brandToClone: BrandItem) => {
        // Use new type
        console.log('Cloning brand:', brandToClone.id, brandToClone.name)
        const newId = `BRD${Math.floor(Math.random() * 9000) + 1000}`
        const clonedBrand: BrandItem = {
            ...brandToClone,
            id: newId,
            name: `${brandToClone.name} (Clone)`,
            status: 'inactive', // Cloned items often start inactive
        }
        setBrands((prev) => [clonedBrand, ...prev]) // Use new state setter
    }, []) // Add setBrands if linting complains

    const handleChangeStatus = useCallback((brand: BrandItem) => {
        // Use new type
        const newStatus = brand.status === 'active' ? 'inactive' : 'active'
        console.log(`Changing status of brand ${brand.id} to ${newStatus}`)
        setBrands(
            (
                currentBrands, // Use new state setter
            ) =>
                currentBrands.map((b) =>
                    b.id === brand.id ? { ...b, status: newStatus } : b,
                ),
        )
    }, []) // Add setBrands if linting complains

    const handleDelete = useCallback((brandToDelete: BrandItem) => {
        // Use new type
        console.log('Deleting brand:', brandToDelete.id, brandToDelete.name)
        setBrands(
            (
                currentBrands, // Use new state setter
            ) => currentBrands.filter((brand) => brand.id !== brandToDelete.id),
        )
        setSelectedBrands(
            (
                prevSelected, // Use new state setter
            ) => prevSelected.filter((brand) => brand.id !== brandToDelete.id),
        )
    }, []) // Add setBrands, setSelectedBrands if linting complains

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected brands:',
            selectedBrands.map((brand) => brand.id),
        ) // Use new state
        const selectedIds = new Set(selectedBrands.map((brand) => brand.id))
        setBrands((currentBrands) =>
            currentBrands.filter((brand) => !selectedIds.has(brand.id)),
        ) // Use new state setter
        setSelectedBrands([]) // Use new state setter
    }, [selectedBrands]) // Add setBrands, setSelectedBrands if linting complains
    // --- End Lifted Handlers ---

    // --- Define Columns in Parent ---
    const columns: ColumnDef<BrandItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                size: 30,
            },
            {
                header : "Brand",
                id: "brand",
                enableSorting: true,
                size: 200,
                cell: (props)=>{
                    const { icon, name } = props.row.original
                    return (
                        <div className='flex gap-2 items-center'>
                            <Avatar
                                size={40}
                                shape="circle"
                                src={icon}
                                icon={<TbBuildingStore />} // Placeholder icon
                            >
                                {!icon ? name.charAt(0).toUpperCase() : ''}
                            </Avatar>
                            <span>{name}</span>
                        </div>
                    )
                }
            },
            // {
            //     header: 'Icon',
            //     accessorKey: 'icon',
            //     enableSorting: false,
            //     cell: (props) => {
            //         const { icon, name } = props.row.original
            //         return (
            //             <Avatar
            //                 size={40}
            //                 shape="circle"
            //                 src={icon}
            //                 icon={<TbBuildingStore />} // Placeholder icon
            //             >
            //                 {!icon ? name.charAt(0).toUpperCase() : ''}
            //             </Avatar>
            //         )
            //     },
            // },
            
            // { header: 'Name', accessorKey: 'name', enableSorting: true },
            {
                header: 'Mobile No',
                accessorKey: 'mobileNo',
                enableSorting: true,
                cell: (props) => (
                    <span className='block min-w-[120px]'>{props.row.original.mobileNo ?? '-'}</span>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                size: "20",
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <Tag
                            className={`${statusColor[status]} capitalize`}
                            prefix={false}
                            // prefixClass={statusColor[status]} // Alt style
                        >
                            {status}
                        </Tag>
                    )
                },
            },
            {
                header: 'Action',
                id: 'action', // Actions column
                meta: {HeaderClass : "text-center", className : "justify-center"},
                cell: (props) => (
                    <ActionColumn
                        onClone={() => handleClone(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        // Update dependencies
        [handleClone, handleChangeStatus, handleEdit, handleDelete],
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Brands</h5>{' '}
                    {/* Updated title */}
                    <BrandActionTools 
                        allBrands={brands} 
                    />{' '}
                    {/* Use updated component/prop */}
                </div>

                {/* Tools Section */}
                <div className="mb-4">
                    <BrandTableTools 
                        onSearchChange={handleSearchChange}  
                        filterData={filterData}
                        setFilterData={handleApplyFilter} // Pass the handler to update filter state
                        allBrands={brands} // Pass data for export
                    />{' '}
                    {/* Use updated component */}
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto">
                    <BrandTable // Use updated component
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedBrands={selectedBrands} // Use updated prop
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Actions Footer */}
            <BrandSelected // Use updated component
                selectedBrands={selectedBrands} // Use updated prop
                setSelectedBrands={setSelectedBrands} // Use updated prop
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default Brands // Updated export name

// Helper Function
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
