import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form' // No longer needed for filter form
// import { zodResolver } from '@hookform/resolvers/zod' // No longer needed
// import { z } from 'zod' // No longer needed
// import type { ZodType } from 'zod' // No longer needed

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
// import Dialog from '@/components/ui/Dialog' // No longer needed for filter dialog
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { Card, Drawer, Tag, Form, FormItem, Input, } from '@/components/ui'

// import Checkbox from '@/components/ui/Checkbox' // No longer needed for filter form
// import Input from '@/components/ui/Input' // No longer needed for filter form
// import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // No longer needed for filter form

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter, // Filter icon removed
    TbCloudUpload,
    TbPlus,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import {
    getContinentsAction,
    // getCountriesAction,
    getDocumentTypeAction,
    getPaymentTermAction,
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// --- Define FormItem Type (Table Row Data) ---
export type PriceListItem = {
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
// --- End FormItem Type Definition ---

// FilterFormSchema and channelList removed

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onDelete,
}: {
    onEdit: () => void
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
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

// --- PriceListSearch Component ---
type PriceListSearchProps = {
    // Renamed component
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const PriceListSearch = React.forwardRef<
    HTMLInputElement,
    PriceListSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Quick Search..." // Updated placeholder
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
PriceListSearch.displayName = 'PriceListSearch'
// --- End PriceListSearch ---

// --- PriceListTableTools Component ---
const PriceListTableTools = ({
    // Renamed component
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {

    type PriceListFilterSchema = {
        userRole : String,
        exportFrom : String,
        exportDate : Date
    }

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
    const closeFilterDrawer = ()=> setIsFilterDrawerOpen(false)
    const openFilterDrawer = ()=> setIsFilterDrawerOpen(true)

    const {control, handleSubmit} = useForm<PriceListFilterSchema>()

    const exportFiltersSubmitHandler = (data : PriceListFilterSchema) => {
        console.log("filter data", data)
    }

    return (
        <div className="flex items-center w-full gap-2">
            <div className="flex-grow">
                <PriceListSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter component removed */}
            <Button icon={<TbFilter />} className='' onClick={openFilterDrawer}>
                Filter
            </Button>
            <Button icon={<TbCloudUpload/>}>Export</Button>
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeFilterDrawer}>
                            Cancel
                        </Button>
                    </div>  
                }
            >
                <Form size='sm' onSubmit={handleSubmit(exportFiltersSubmitHandler)} containerClassName='flex flex-col'>
                    <FormItem label='Document Name'>
                        {/* <Controller
                            control={control}
                            name='userRole'
                            render={({field})=>(
                                <Input
                                    type="text"
                                    placeholder="Enter Document Name"
                                    {...field}
                                />
                            )}
                        /> */}
                    </FormItem>
                </Form>
            </Drawer>
        </div>
    )
}
// --- End PriceListTableTools ---

// --- FormListTable Component (No changes) ---
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
    columns: ColumnDef<PriceListItem>[]
    data: PriceListItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedForms: PriceListItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: PriceListItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<PriceListItem>[]) => void
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

// --- FormListSearch Component (No changes) ---
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

// FormListTableFilter component removed

// --- FormListTableTools Component (Simplified) ---
const FormListTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <FormListSearch onInputChange={onSearchChange} />
            {/* Filter button/component removed */}
        </div>
    )
}
// --- End FormListTableTools ---

// --- FormListActionTools Component (No functional changes needed for filter removal) ---
const FormListActionTools = ({
    allFormsData,
    openAddDrawer,
}: {
    allFormsData: PriceListItem[];
    openAddDrawer: () => void; // Accept function as a prop
}) => {
    const navigate = useNavigate()
    const csvHeaders = [

    ]

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/*
            <CSVLink
                className="w-full"
                filename="documentTypeList.csv"
                data={allFormsData}
                headers={csvHeaders}
            >
                <Button icon={<TbCloudDownload />} className="w-full" block>
                    Download
                </Button>
            </CSVLink>
            */}
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={openAddDrawer}
                block
            >
                Add New
            </Button>
        </div>
    )
}

// --- FormListSelected Component (No functional changes needed for filter removal) ---
const FormListSelected = ({
    selectedForms,
    setSelectedForms,
    onDeleteSelected,
}: {
    selectedForms: PriceListItem[]
    setSelectedForms: React.Dispatch<React.SetStateAction<PriceListItem[]>>
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
                                Item{selectedForms.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedForms.length} Item${selectedForms.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected item
                    {selectedForms.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

// --- Main Continents Component ---
const PriceList = () => {

    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PriceListItem | null>(null);

    const openEditDrawer = (item: PriceListItem) => {
        setSelectedItem(item); // Set the selected item's data
        setIsEditDrawerOpen(true); // Open the edit drawer
    };

    const closeEditDrawer = () => {
        setSelectedItem(null); // Clear the selected item's data
        setIsEditDrawerOpen(false); // Close the edit drawer
    };

    const openAddDrawer = () => {
        setSelectedItem(null); // Clear any selected item
        setIsAddDrawerOpen(true); // Open the add drawer
    };

    const closeAddDrawer = () => {
        setIsAddDrawerOpen(false); // Close the add drawer
    };

    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    // useEffect(() => {
    //     dispatch(getCountriesAction())
    // }, [dispatch])

    const { PriceListData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)
 // Use the provided dummy data

// --- Initial Dummy Data ---
const initialDummyForms: PriceListItem[] = [
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
];
// --- End Dummy Data ---

const [forms, setForms] = useState<PriceListItem[]>(initialDummyForms); // Initialize with dummy data
const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: '', key: '' },
    query: '',
});
const [selectedForms, setSelectedForms] = useState<PriceListItem[]>([]);
    const [localIsLoading, setLocalIsLoading] = useState(false)
    // filterData state and handleApplyFilter removed

    console.log('Raw CountriesData from Redux:', PriceListData)

    const { pageData, total, processedDataForCsv } = useMemo(() => {
        console.log(
            '[Memo] Recalculating. Query:',
            tableData.query,
            'Sort:',
            tableData.sort,
            'Page:',
            tableData.pageIndex,
            // 'Filters:' removed from log
            'Input Data (CountriesData) Length:',
            PriceListData?.length ?? 0,
        )

        const sourceData: PriceListItem[] = Array.isArray(PriceListData)
            ? PriceListData
            : []
        let processedData: PriceListItem[] = cloneDeep(sourceData)

        // Product and Channel filtering logic removed

        // 1. Apply Search Query (on id and name)
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            console.log('[Memo] Applying search query:', query)
            processedData = processedData.filter((item: PriceListItem) => {
                const itemNameLower = item.id?.trim().toLowerCase() ?? ''
                const continentNameLower = item.id?.trim().toLowerCase() ?? ''
                const itemIdString = String(item.id ?? '').trim()
                const itemIdLower = itemIdString.toLowerCase()
                return (
                    itemNameLower.includes(query) ||
                    itemIdLower.includes(query) ||
                    continentNameLower.includes(query)
                )
            })
            console.log(
                '[Memo] After search query filter. Count:',
                processedData.length,
            )
        }

        // 2. Apply Sorting (on id and name)
        const { order, key } = tableData.sort as OnSortParam
        if (
            order &&
            key &&
            (key === 'id' || key === 'name') &&
            processedData.length > 0
        ) {
            console.log('[Memo] Applying sort. Key:', key, 'Order:', order)
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                // Ensure values are strings for localeCompare, default to empty string if not
                const aValue = String(a[key as keyof PriceListItem] ?? '')
                const bValue = String(b[key as keyof PriceListItem] ?? '')

                return order === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            })
            processedData = sortedData
        }

        const dataBeforePagination = [...processedData] // For CSV export

        // 3. Apply Pagination
        const currentTotal = processedData.length
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        console.log(
            '[Memo] Returning. PageData Length:',
            dataForPage.length,
            'Total Items (after all filters/sort):',
            currentTotal,
        )
        return {
            pageData: dataForPage,
            total: currentTotal,
            processedDataForCsv: dataBeforePagination,
        }
    }, [PriceListData, tableData]) // filterData removed from dependencies

    // --- Handlers ---
    // handleApplyFilter removed

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }))
    }, [])

    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData],
    )
    const handleSelectChange = useCallback(
        (value: number) => {
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 })
            setSelectedForms([])
        },
        [handleSetTableData],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
        [handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
        [handleSetTableData],
    )

    const handleRowSelect = useCallback((checked: boolean, row: PriceListItem) => {
        setSelectedForms((prev) => {
            if (checked)
                return prev.some((f) => f.id === row.id) ? prev : [...prev, row]
            return prev.filter((f) => f.id !== row.id)
        })
    }, [])

    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<PriceListItem>[]) => {
            const currentPageRowOriginals = currentRows.map((r) => r.original)
            if (checked) {
                setSelectedForms((prevSelected) => {
                    const prevSelectedIds = new Set(
                        prevSelected.map((f) => f.id),
                    )
                    const newRowsToAdd = currentPageRowOriginals.filter(
                        (r) => !prevSelectedIds.has(r.id),
                    )
                    return [...prevSelected, ...newRowsToAdd]
                })
            } else {
                const currentPageRowIds = new Set(
                    currentPageRowOriginals.map((r) => r.id),
                )
                setSelectedForms((prevSelected) =>
                    prevSelected.filter((f) => !currentPageRowIds.has(f.id)),
                )
            }
        },
        [],
    )

    // --- Action Handlers (remain the same, need Redux integration for persistence) ---
    const handleEdit = useCallback(
        (form: PriceListItem) => {
            console.log('Edit item (requires navigation/modal):', form.id)
            toast.push(
                <Notification title="Edit Action" type="info">
                    Edit action for "{form.id}" (ID: {form.id}). Implement
                    navigation or modal.
                </Notification>,
            )
        },
        [navigate],
    )

    const handleDelete = useCallback((formToDelete: PriceListItem) => {
        console.log(
            'Delete item (needs Redux action):',
            formToDelete.id,
            formToDelete.id,
        )
        setSelectedForms((prevSelected) =>
            prevSelected.filter((form) => form.id !== formToDelete.id),
        )
        toast.push(
            <Notification title="Delete Action" type="warning">
                Delete action for "{formToDelete.id}" (ID: {formToDelete.id}).
                Implement Redux deletion.
            </Notification>,
        )
    }, [])

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected items (needs Redux action):',
            selectedForms.map((f) => f.id),
        )
        setSelectedForms([])
        toast.push(
            <Notification title="Selected Items Delete Action" type="warning">
                {selectedForms.length} item(s) delete action. Implement Redux
                deletion.
            </Notification>,
        )
    }, [selectedForms])
    // --- End Action Handlers ---

    const columns: ColumnDef<PriceListItem>[] = useMemo(
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
                enableSorting: true,
                cell: (props) => (
                    <Tag
                        className={
                            props.row.original.status === 'active'
                                ? 'bg-green-200 text-green-600'
                                : 'bg-red-200 text-red-600'
                        }
                    >
                        {props.row.original.status}
                    </Tag>
                ),
            },
            {
                header: 'Action',
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)} // Open edit drawer
                        onDelete={() => console.log('Delete', props.row.original)}
                    />
                ),
            },
        ],
        [handleEdit, handleDelete],
    )

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">CMS Management</h5>
                        <FormListActionTools
                            allFormsData={forms}
                            openAddDrawer={openAddDrawer} // Pass the function as a prop
                        />
                    </div>

                    <div className="mb-4">
                        <PriceListTableTools
                            onSearchChange={(query) =>
                                setTableData((prev) => ({ ...prev, query }))
                            }
                        />
                    </div>

                    <FormListTable
                        columns={columns}
                        data={forms}
                        loading={false}
                        pagingData={{
                            total: forms.length,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedForms={selectedForms}
                        onPaginationChange={(page) =>
                            setTableData((prev) => ({ ...prev, pageIndex: page }))
                        }
                        onSelectChange={(value) =>
                            setTableData((prev) => ({
                                ...prev,
                                pageSize: Number(value),
                                pageIndex: 1,
                            }))
                        }
                        onSort={(sort) =>
                            setTableData((prev) => ({ ...prev, sort }))
                        }
                        onRowSelect={(checked, row) =>
                            setSelectedForms((prev) =>
                                checked
                                    ? [...prev, row]
                                    : prev.filter((form) => form.id !== row.id)
                            )
                        }
                        onAllRowSelect={(checked, rows) => {
                            const rowIds = rows.map((row) => row.original.id);
                            setSelectedForms((prev) =>
                                checked
                                    ? [...prev, ...rows.map((row) => row.original)]
                                    : prev.filter((form) => !rowIds.includes(form.id))
                            );
                        }}
                    />
                </AdaptiveCard>

                <FormListSelected
                    selectedForms={selectedForms}
                    setSelectedForms={setSelectedForms}
                    onDeleteSelected={() =>
                        setForms((prev) =>
                            prev.filter(
                                (form) =>
                                    !selectedForms.some(
                                        (selected) => selected.id === form.id
                                    )
                            )
                        )
                    }
                />
            </Container>

            {/* Edit Drawer */}
            <Drawer
                title="Edit Price List Item"
                isOpen={isEditDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={() => {
                                console.log('Updated Price List Item:', selectedItem);
                                closeEditDrawer();
                            }}
                        >
                            Save
                        </Button>
                    </div>
                }
            >
                <Form>
                    <FormItem label="Product Name">
                        <Input
                            value={selectedItem?.productName || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    productName: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Price">
                        <Input
                            value={selectedItem?.price || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    price: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Base Price">
                        <Input
                            value={selectedItem?.basePrice || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    basePrice: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="GST Price">
                        <Input
                            value={selectedItem?.gstPrice || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    gstPrice: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="USD">
                        <Input
                            value={selectedItem?.usd || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    usd: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Expense">
                        <Input
                            value={selectedItem?.expance || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    expance: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Margin">
                        <Input
                            value={selectedItem?.margin || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    margin: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Interest">
                        <Input
                            value={selectedItem?.interest || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    interest: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="NLC">
                        <Input
                            value={selectedItem?.nlc || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    nlc: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Sales Price">
                        <Input
                            value={selectedItem?.salesPrice || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    salesPrice: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Quantity">
                        <Input
                            value={selectedItem?.qty || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    qty: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Status">
                        <select
                            value={selectedItem?.status || 'active'}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', productName: '', price: '', basePrice: '', gstPrice: '', usd: '', expance: '', margin: '', interest: '', nlc: '', salesPrice: '', qty: '', status: 'active' }),
                                    status: e.target.value as 'active' | 'inactive',
                                }))
                            }
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </FormItem>
                </Form>
            </Drawer>


            <Drawer
                title="Add New Price List Item"
                isOpen={isAddDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={() => console.log('Price List Item Added')}
                        >
                            Add
                        </Button>
                    </div>
                }
            >
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        const newItem: PriceListItem = {
                            id: `${forms.length + 1}`,
                            productName: formData.get('productName') as string,
                            price: formData.get('price') as string,
                            basePrice: formData.get('basePrice') as string,
                            gstPrice: formData.get('gstPrice') as string,
                            usd: formData.get('usd') as string,
                            expance: formData.get('expance') as string,
                            margin: formData.get('margin') as string,
                            interest: formData.get('interest') as string,
                            nlc: formData.get('nlc') as string,
                            salesPrice: formData.get('salesPrice') as string,
                            qty: formData.get('qty') as string,
                            status: formData.get('status') as 'active' | 'inactive',
                        };
                        console.log('New Price List Item:', newItem);
                        // handleAdd(newItem);
                    }}
                >
                    <FormItem label="Product Name">
                        <Input name="productName" placeholder="Enter Product Name" />
                    </FormItem>
                    <FormItem label="Price">
                        <Input name="price" placeholder="Enter Price" />
                    </FormItem>
                    <FormItem label="Base Price">
                        <Input name="basePrice" placeholder="Enter Base Price" />
                    </FormItem>
                    <FormItem label="GST Price">
                        <Input name="gstPrice" placeholder="Enter GST Price" />
                    </FormItem>
                    <FormItem label="USD">
                        <Input name="usd" placeholder="Enter USD" />
                    </FormItem>
                    <FormItem label="Expense">
                        <Input name="expance" placeholder="Enter Expense" />
                    </FormItem>
                    <FormItem label="Margin">
                        <Input name="margin" placeholder="Enter Margin" />
                    </FormItem>
                    <FormItem label="Interest">
                        <Input name="interest" placeholder="Enter Interest" />
                    </FormItem>
                    <FormItem label="NLC">
                        <Input name="nlc" placeholder="Enter NLC" />
                    </FormItem>
                    <FormItem label="Sales Price">
                        <Input name="salesPrice" placeholder="Enter Sales Price" />
                    </FormItem>
                    <FormItem label="Quantity">
                        <Input name="qty" placeholder="Enter Quantity" />
                    </FormItem>
                    <FormItem label="Status">
                        <select name="status" defaultValue="active">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </FormItem>
                </Form>
            </Drawer>
        </>
    )
}

export default PriceList

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
