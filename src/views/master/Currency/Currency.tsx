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
import { CSVLink } from 'react-csv'

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
    getCurrencyAction,
    getDocumentTypeAction,
    getPaymentTermAction,
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// --- Define CurrencyItem Type (Table Row Data) ---
export type CurrencyItem = {
    id: string
    currency_code: string
    currency_symbol: string
}
// --- End CurrencyItem Type Definition ---

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
    columns: ColumnDef<CurrencyItem>[]
    data: CurrencyItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedForms: CurrencyItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: CurrencyItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<CurrencyItem>[]) => void
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

// --- CurrencySearch Component ---
type CurrencySearchProps = {
    // Renamed component
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const CurrencySearch = React.forwardRef<
    HTMLInputElement,
    CurrencySearchProps
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
CurrencySearch.displayName = 'CurrencySearch'
// --- End CurrencySearch ---

// --- CurrencyTableTools Component ---
const CurrencyTableTools = ({
    // Renamed component
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {

    type CurrencyFilterSchema = {
        userRole : String,
        exportFrom : String,
        exportDate : Date
    }

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
    const closeFilterDrawer = ()=> setIsFilterDrawerOpen(false)
    const openFilterDrawer = ()=> setIsFilterDrawerOpen(true)

    const {control, handleSubmit} = useForm<CurrencyFilterSchema>()

    const exportFiltersSubmitHandler = (data : CurrencyFilterSchema) => {
        console.log("filter data", data)
    }

    return (
        <div className="flex items-center w-full gap-2">
            <div className="flex-grow">
                <CurrencySearch onInputChange={onSearchChange} />
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
                    <FormItem label='Currency Name'>
                        {/* <Controller
                            control={control}
                            name='userRole'
                            render={({field})=>(
                                <Input
                                    type="text"
                                    placeholder="Enter Currency Name"
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
// --- End CurrencyTableTools ---

// --- FormListActionTools Component (No functional changes needed for filter removal) ---
const FormListActionTools = ({
    allFormsData,
    openAddDrawer,
}: {
    allFormsData: CurrencyItem[];
    openAddDrawer: () => void; // Accept function as a prop
}) => {
    const navigate = useNavigate()
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Currency Symbol', key: 'currency_symbol' },
        { label: 'Currency Name', key: 'currency_code' },
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
    selectedForms: CurrencyItem[]
    setSelectedForms: React.Dispatch<React.SetStateAction<CurrencyItem[]>>
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

// --- Main Currency Component ---
const Currency = () => {

    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CurrencyItem | null>(null);

    const openEditDrawer = (item: CurrencyItem) => {
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

    useEffect(() => {
        dispatch(getCurrencyAction())
    }, [dispatch])

    const { CurrencyData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)

    const [localIsLoading, setLocalIsLoading] = useState(false)
    const [forms, setForms] = useState<CurrencyItem[]>([]) // Remains for potential local ops, not table data source

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedForms, setSelectedForms] = useState<CurrencyItem[]>([])
    // filterData state and handleApplyFilter removed

    console.log('Raw CurrencyData from Redux:', CurrencyData)

    const { pageData, total, processedDataForCsv } = useMemo(() => {
        console.log(
            '[Memo] Recalculating. Query:',
            tableData.query,
            'Sort:',
            tableData.sort,
            'Page:',
            tableData.pageIndex,
            // 'Filters:' removed from log
            'Input Data (CurrencyData) Length:',
            CurrencyData?.length ?? 0,
        )

        const sourceData: CurrencyItem[] = Array.isArray(CurrencyData)
            ? CurrencyData
            : []
        let processedData: CurrencyItem[] = cloneDeep(sourceData)

        // Product and Channel filtering logic removed

        // 1. Apply Search Query (on id and name)
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            console.log('[Memo] Applying search query:', query)
            processedData = processedData.filter((item: CurrencyItem) => {
                const itemNameLower =
                    item.currency_code?.trim().toLowerCase() ?? ''
                const itemIdString = String(item.id ?? '').trim()
                const itemIdLower = itemIdString.toLowerCase()
                return (
                    itemNameLower.includes(query) || itemIdLower.includes(query)
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
            (key === 'id' || key === 'currency_code') &&
            processedData.length > 0
        ) {
            console.log('[Memo] Applying sort. Key:', key, 'Order:', order)
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                // Ensure values are strings for localeCompare, default to empty string if not
                const aValue = String(a[key as keyof CurrencyItem] ?? '')
                const bValue = String(b[key as keyof CurrencyItem] ?? '')

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
    }, [CurrencyData, tableData]) // filterData removed from dependencies

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

    const handleRowSelect = useCallback((checked: boolean, row: CurrencyItem) => {
        setSelectedForms((prev) => {
            if (checked)
                return prev.some((f) => f.id === row.id) ? prev : [...prev, row]
            return prev.filter((f) => f.id !== row.id)
        })
    }, [])

    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<CurrencyItem>[]) => {
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
        (form: CurrencyItem) => {
            console.log('Edit item (requires navigation/modal):', form.id)
            toast.push(
                <Notification title="Edit Action" type="info">
                    Edit action for "{form.currency_code}" (ID: {form.id}).
                    Implement navigation or modal.
                </Notification>,
            )
        },
        [navigate],
    )

    const handleDelete = useCallback((formToDelete: CurrencyItem) => {
        console.log(
            'Delete item (needs Redux action):',
            formToDelete.id,
            formToDelete.currency_code,
        )
        setSelectedForms((prevSelected) =>
            prevSelected.filter((form) => form.id !== formToDelete.id),
        )
        toast.push(
            <Notification title="Delete Action" type="warning">
                Delete action for "{formToDelete.currency_code}" (ID:{' '}
                {formToDelete.id}). Implement Redux deletion.
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

    const columns: ColumnDef<CurrencyItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 100 },
            {
                header: 'Currency symbol',
                accessorKey: 'currency_symbol',
                enableSorting: true,
            },
            {
                header: 'currency code',
                accessorKey: 'currency_code',
                enableSorting: true,
            },
            {
                header: 'Action',
                id: 'action',
                meta: { HeaderClass: 'text-center' },
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)} // Open edit drawer
                        onDelete={() => handleDelete(props.row.original)}
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
                    <h5 className="mb-4 lg:mb-0">Currency</h5>
                    <FormListActionTools
                        allFormsData={processedDataForCsv}
                        openAddDrawer={openAddDrawer} // Pass the function as a prop
                    />
                </div>

                <div className="mb-4">
                    <CurrencyTableTools
                                onSearchChange={handleSearchChange}
                            />{' '}
                            {/* Use updated component */}
                        </div>

                <FormListTable
                    columns={columns}
                    data={pageData}
                    loading={
                        localIsLoading || masterLoadingStatus === 'loading'
                    }
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
        {/* Edit Drawer */}
        <Drawer
            title="Edit Currency"
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
                            console.log('Updated Currency:', selectedItem);
                            closeEditDrawer();
                        }}
                    >
                        Save
                    </Button>
                </div>
            }
        >
            <Form size="sm" containerClassName="flex flex-col">
                <FormItem label="Currency Code">
                    <Input
                        placeholder="Enter Currency Code"
                        value={selectedItem?.currency_code || ''} // Populate with selected item's currency code
                        onChange={(e) =>
                            setSelectedItem((prev) => ({
                                ...(prev || { id: '', currency_code: '', currency_symbol: '' }), // Handle null case
                                currency_code: e.target.value,
                            }))
                        }
                    />
                </FormItem>
                <FormItem label="Currency Symbol">
                    <Input
                        placeholder="Enter Currency Symbol"
                        value={selectedItem?.currency_symbol || ''} // Populate with selected item's currency symbol
                        onChange={(e) =>
                            setSelectedItem((prev) => ({
                                ...(prev || { id: '', currency_code: '', currency_symbol: '' }), // Handle null case
                                currency_symbol: e.target.value,
                            }))
                        }
                    />
                </FormItem>
            </Form>
        </Drawer>

        {/* Add New Drawer */}
        <Drawer
            title="Add New Currency"
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
                        onClick={() => {
                            console.log('New Currency Added');
                            closeAddDrawer();
                        }}
                    >
                        Add
                    </Button>
                </div>
            }
        >
            <Form size="sm" containerClassName="flex flex-col">
                <FormItem label="Currency Code">
                    <Input placeholder="Enter Currency Code" />
                </FormItem>
                <FormItem label="Currency Symbol">
                    <Input placeholder="Enter Currency Symbol" />
                </FormItem>
            </Form>
        </Drawer>
        </>
    )
}

export default Currency

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
