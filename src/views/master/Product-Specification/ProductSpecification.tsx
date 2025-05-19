import React, { useState, useMemo, useCallback, useEffect } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { Drawer, Form, FormItem, Input } from '@/components/ui'

import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
} from 'react-icons/tb'

import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import {
    // getProductSpecificationsAction,
    // addProductSpecificationAction,
    // editProductSpecificationAction,
    // deleteProductSpecificationAction,
    // deleteAllProductSpecificationsAction,
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// --- Define ProductSpecificationItem Type ---
export type ProductSpecificationItem = {
    id: string | number
    icon: string
    name: string
    country_name: string
}

// --- Zod Schema for Add/Edit Product Specification Form ---
const productSpecificationFormSchema = z.object({
    icon: z.string().min(1, 'Icon is required.'),
    name: z.string().min(1, 'Specification name is required.').max(100),
    country_name: z.string().min(1, 'Country name is required.').max(100),
})
type ProductSpecificationFormData = z.infer<typeof productSpecificationFormSchema>

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterCountryNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
})
type FilterFormData = z.infer<typeof filterFormSchema>

// --- CSV Exporter Utility ---
const CSV_HEADERS = ['ID', 'Icon', 'Specification Name', 'Country Name']
const CSV_KEYS = ['id', 'icon', 'name', 'country_name']

function exportToCsv(filename: string, rows: ProductSpecificationItem[]) {
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info">
                Nothing to export.
            </Notification>,
        )
        return false
    }
    const separator = ','
    const csvContent =
        CSV_HEADERS.join(separator) +
        '\n' +
        rows
            .map((row) => {
                return CSV_KEYS.map((k) => {
                    let cell = row[k as keyof ProductSpecificationItem]
                    if (cell === null || cell === undefined) {
                        cell = ''
                    } else {
                        cell = String(cell).replace(/"/g, '""')
                    }
                    if (String(cell).search(/("|,|\n)/g) >= 0) {
                        cell = `"${cell}"`
                    }
                    return cell
                }).join(separator)
            })
            .join('\n')
    const blob = new Blob(['\ufeff' + csvContent], {
        type: 'text/csv;charset=utf-8;',
    })
    const link = document.createElement('a')
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        return true
    }
    toast.push(
        <Notification title="Export Failed" type="danger">
            Browser does not support this feature.
        </Notification>,
    )
    return false
}

// --- ActionColumn Component ---
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
        <div className="flex items-center justify-center gap-3">
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

// --- ProductSpecificationSearch Component ---
type ProductSpecificationSearchProps = {
    onInputChange: (value: string) => void
}
const ProductSpecificationSearch = React.forwardRef<
    HTMLInputElement,
    ProductSpecificationSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            className="w-full"
            placeholder="Quick search specifications..."
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
ProductSpecificationSearch.displayName = 'ProductSpecificationSearch'

// --- TableTools Component ---
const TableTools = ({
    onSearchChange,
    onFilter,
    onExport,
}: {
    onSearchChange: (query: string) => void
    onFilter: () => void
    onExport: () => void
}) => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow">
            <ProductSpecificationSearch onInputChange={onSearchChange} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">
                Filter
            </Button>
            <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">
                Export
            </Button>
        </div>
    </div>
)

// --- Table Component ---
type TableProps = {
    columns: ColumnDef<ProductSpecificationItem>[]
    data: ProductSpecificationItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedItems: ProductSpecificationItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: ProductSpecificationItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<ProductSpecificationItem>[]) => void
}
const Table = ({
    columns,
    data,
    loading,
    pagingData,
    selectedItems,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: TableProps) => (
    <DataTable
        selectable
        columns={columns}
        data={data}
        noData={!loading && data.length === 0}
        loading={loading}
        pagingData={pagingData}
        checkboxChecked={(row) =>
            selectedItems.some((selected) => selected.id === row.id)
        }
        onPaginationChange={onPaginationChange}
        onSelectChange={onSelectChange}
        onSort={onSort}
        onCheckBoxChange={onRowSelect}
        onIndeterminateCheckBoxChange={onAllRowSelect}
    />
)

// --- SelectedFooter Component ---
type SelectedFooterProps = {
    selectedItems: ProductSpecificationItem[]
    onDeleteSelected: () => void
}
const SelectedFooter = ({
    selectedItems,
    onDeleteSelected,
}: SelectedFooterProps) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }
    if (selectedItems.length === 0) return null
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
                                {selectedItems.length}
                            </span>
                            <span>
                                Item{selectedItems.length > 1 ? 's' : ''} selected
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
                            Delete Selected
                        </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedItems.length} Specification${selectedItems.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected specification
                    {selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

// --- Main ProductSpecification Component ---
const ProductSpecification = () => {
    const dispatch = useAppDispatch()

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<ProductSpecificationItem | null>(null)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<ProductSpecificationItem | null>(null)
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
        filterNames: [],
        filterCountryNames: [],
    })

    const {
        ProductSpecificationsData = [],
        status: masterLoadingStatus = 'idle'
    } = useSelector(masterSelector)

    useEffect(() => {
        // dispatch(getProductSpecificationsAction())
    }, [dispatch])

    const addFormMethods = useForm<ProductSpecificationFormData>({
        resolver: zodResolver(productSpecificationFormSchema),
        defaultValues: { icon: '', name: '', country_name: '' },
        mode: 'onChange',
    })
    const editFormMethods = useForm<ProductSpecificationFormData>({
        resolver: zodResolver(productSpecificationFormSchema),
        defaultValues: { icon: '', name: '', country_name: '' },
        mode: 'onChange',
    })
    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        defaultValues: filterCriteria,
    })

    const openAddDrawer = () => {
        addFormMethods.reset({ icon: '', name: '', country_name: '' })
        setIsAddDrawerOpen(true)
    }
    const closeAddDrawer = () => {
        addFormMethods.reset({ icon: '', name: '', country_name: '' })
        setIsAddDrawerOpen(false)
    }
    const onAddSubmit = async (data: ProductSpecificationFormData) => {
        setIsSubmitting(true)
        // try {
        //     await dispatch(addProductSpecificationAction(data)).unwrap()
        //     toast.push(
        //         <Notification title="Specification Added" type="success" duration={2000}>
        //             Specification "{data.name}" added.
        //         </Notification>,
        //     )
        //     closeAddDrawer()
        //     dispatch(getProductSpecificationsAction())
        // } catch (error: any) {
        //     toast.push(
        //         <Notification title="Failed to Add" type="danger" duration={3000}>
        //             {error.message || 'Could not add specification.'}
        //         </Notification>,
        //     )
        // } finally {
        //     setIsSubmitting(false)
        // }
    }

    const openEditDrawer = (item: ProductSpecificationItem) => {
        setEditingItem(item)
        editFormMethods.setValue('icon', item.icon)
        editFormMethods.setValue('name', item.name)
        editFormMethods.setValue('country_name', item.country_name)
        setIsEditDrawerOpen(true)
    }
    const closeEditDrawer = () => {
        setEditingItem(null)
        editFormMethods.reset({ icon: '', name: '', country_name: '' })
        setIsEditDrawerOpen(false)
    }
    const onEditSubmit = async (data: ProductSpecificationFormData) => {
        if (!editingItem || editingItem.id === undefined || editingItem.id === null) {
            toast.push(
                <Notification title="Error" type="danger">
                    Cannot edit: ID is missing.
                </Notification>,
            )
            setIsSubmitting(false)
            return
        }
        setIsSubmitting(true)
        // try {
        //     await dispatch(
        //         editProductSpecificationAction({
        //             id: editingItem.id,
        //             ...data,
        //         }),
        //     ).unwrap()
        //     toast.push(
        //         <Notification title="Specification Updated" type="success" duration={2000}>
        //             Specification "{data.name}" updated.
        //         </Notification>,
        //     )
        //     closeEditDrawer()
        //     dispatch(getProductSpecificationsAction())
        // } catch (error: any) {
        //     toast.push(
        //         <Notification title="Failed to Update" type="danger" duration={3000}>
        //             {error.message || 'Could not update specification.'}
        //         </Notification>,
        //     )
        // } finally {
        //     setIsSubmitting(false)
        // }
    }

    const handleDeleteClick = (item: ProductSpecificationItem) => {
        if (item.id === undefined || item.id === null) {
            toast.push(
                <Notification title="Error" type="danger">
                    Cannot delete: ID is missing.
                </Notification>,
            )
            return
        }
        setItemToDelete(item)
        setSingleDeleteConfirmOpen(true)
    }

    const onConfirmSingleDelete = async () => {
        if (!itemToDelete || itemToDelete.id === undefined || itemToDelete.id === null) {
            toast.push(
                <Notification title="Error" type="danger">
                    Cannot delete: ID is missing.
                </Notification>,
            )
            setIsDeleting(false)
            setItemToDelete(null)
            setSingleDeleteConfirmOpen(false)
            return
        }
        setIsDeleting(true)
        setSingleDeleteConfirmOpen(false)
        // try {
        //     await dispatch(deleteProductSpecificationAction(itemToDelete)).unwrap()
        //     toast.push(
        //         <Notification title="Specification Deleted" type="success" duration={2000}>
        //             Specification "{itemToDelete.name}" deleted.
        //         </Notification>,
        //     )
        //     setSelectedItems((prev) =>
        //         prev.filter((item) => item.id !== itemToDelete!.id),
        //     )
        //     dispatch(getProductSpecificationsAction())
        // } catch (error: any) {
        //     toast.push(
        //         <Notification title="Failed to Delete" type="danger" duration={3000}>
        //             {error.message || `Could not delete specification.`}
        //         </Notification>,
        //     )
        // } finally {
        //     setIsDeleting(false)
        //     setItemToDelete(null)
        // }
    }
    const [selectedItems, setSelectedItems] = useState<ProductSpecificationItem[]>([])
    const handleDeleteSelected = async () => {
        if (selectedItems.length === 0) {
            toast.push(
                <Notification title="No Selection" type="info">
                    Please select items to delete.
                </Notification>,
            )
            return
        }
        setIsDeleting(true)
        const validItemsToDelete = selectedItems.filter(
            (item) => item.id !== undefined && item.id !== null,
        )
        if (validItemsToDelete.length === 0) {
            toast.push(
                <Notification title="No Valid Items" type="info">
                    No valid items to delete.
                </Notification>,
            )
            setIsDeleting(false)
            return
        }
        const idsToDelete = validItemsToDelete.map((item) => item.id)
        const commaSeparatedIds = idsToDelete.join(',')
        // try {
        //     await dispatch(
        //         deleteAllProductSpecificationsAction({ ids: commaSeparatedIds }),
        //     ).unwrap()
        //     toast.push(
        //         <Notification title="Deletion Successful" type="success" duration={2000}>
        //             {validItemsToDelete.length} specification{validItemsToDelete.length > 1 ? 's' : ''} deleted.
        //         </Notification>,
        //     )
        // } catch (error: any) {
        //     toast.push(
        //         <Notification title="Deletion Failed" type="danger" duration={3000}>
        //             {error.message || 'Failed to delete selected specifications.'}
        //         </Notification>,
        //     )
        // } finally {
        //     setSelectedItems([])
        //     dispatch(getProductSpecificationsAction())
        //     setIsDeleting(false)
        // }
    }

    const openFilterDrawer = () => {
        filterFormMethods.reset(filterCriteria)
        setIsFilterDrawerOpen(true)
    }
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false)
    const onApplyFiltersSubmit = (data: FilterFormData) => {
        setFilterCriteria({
            filterNames: data.filterNames || [],
            filterCountryNames: data.filterCountryNames || [],
        })
        handleSetTableData({ pageIndex: 1 })
        closeFilterDrawer()
    }
    const onClearFilters = () => {
        const defaultFilters = { filterNames: [], filterCountryNames: [] }
        filterFormMethods.reset(defaultFilters)
        setFilterCriteria(defaultFilters)
        handleSetTableData({ pageIndex: 1 })
    }

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })

    const nameOptions = useMemo(() => {
        if (!Array.isArray(ProductSpecificationsData)) return []
        const uniqueNames = new Set(
            ProductSpecificationsData.map((item) => item.name),
        )
        return Array.from(uniqueNames).map((name) => ({
            value: name,
            label: name,
        }))
    }, [ProductSpecificationsData])

    const countryNameOptions = useMemo(() => {
        if (!Array.isArray(ProductSpecificationsData)) return []
        const uniqueCountries = new Set(
            ProductSpecificationsData.map((item) => item.country_name),
        )
        return Array.from(uniqueCountries).map((name) => ({
            value: name,
            label: name,
        }))
    }, [ProductSpecificationsData])

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData: ProductSpecificationItem[] = Array.isArray(ProductSpecificationsData)
            ? ProductSpecificationsData
            : []
        let processedData: ProductSpecificationItem[] = cloneDeep(sourceData)

        if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
            const selectedNames = filterCriteria.filterNames.map((opt) =>
                opt.value.toLowerCase(),
            )
            processedData = processedData.filter((item) =>
                selectedNames.includes(item.name?.trim().toLowerCase() ?? ''),
            )
        }
        if (filterCriteria.filterCountryNames && filterCriteria.filterCountryNames.length > 0) {
            const selectedCountries = filterCriteria.filterCountryNames.map((opt) =>
                opt.value.toLowerCase(),
            )
            processedData = processedData.filter((item) =>
                selectedCountries.includes(item.country_name?.trim().toLowerCase() ?? ''),
            )
        }
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            processedData = processedData.filter((item) => {
                const nameLower = item.name?.trim().toLowerCase() ?? ''
                const iconLower = item.icon?.trim().toLowerCase() ?? ''
                const countryLower = item.country_name?.trim().toLowerCase() ?? ''
                const idString = String(item.id ?? '').trim().toLowerCase()
                return (
                    nameLower.includes(query) ||
                    iconLower.includes(query) ||
                    countryLower.includes(query) ||
                    idString.includes(query)
                )
            })
        }
        const { order, key } = tableData.sort as OnSortParam
        if (
            order &&
            key &&
            (key === 'id' || key === 'name' || key === 'icon' || key === 'country_name') &&
            processedData.length > 0
        ) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                let aValue = String(a[key as keyof ProductSpecificationItem] ?? '')
                let bValue = String(b[key as keyof ProductSpecificationItem] ?? '')
                return order === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            })
            processedData = sortedData
        }
        const dataToExport = [...processedData]
        const currentTotal = processedData.length
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )
        return {
            pageData: dataForPage,
            total: currentTotal,
            allFilteredAndSortedData: dataToExport,
        }
    }, [ProductSpecificationsData, tableData, filterCriteria])

    const handleExportData = () => {
        const success = exportToCsv(
            'product_specifications_export.csv',
            allFilteredAndSortedData,
        )
        if (success) {
            toast.push(
                <Notification title="Export Successful" type="success">
                    Data exported.
                </Notification>,
            )
        }
    }

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
            setSelectedItems([])
        },
        [handleSetTableData],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => {
            handleSetTableData({ sort: sort, pageIndex: 1 })
        },
        [handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
        [handleSetTableData],
    )
    const handleRowSelect = useCallback((checked: boolean, row: ProductSpecificationItem) => {
        setSelectedItems((prev) => {
            if (checked)
                return prev.some((item) => item.id === row.id)
                    ? prev
                    : [...prev, row]
            return prev.filter((item) => item.id !== row.id)
        })
    }, [])
    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<ProductSpecificationItem>[]) => {
            const currentPageRowOriginals = currentRows.map((r) => r.original)
            if (checked) {
                setSelectedItems((prevSelected) => {
                    const prevSelectedIds = new Set(
                        prevSelected.map((item) => item.id),
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
                setSelectedItems((prevSelected) =>
                    prevSelected.filter(
                        (item) => !currentPageRowIds.has(item.id),
                    ),
                )
            }
        },
        [],
    )

    const columns: ColumnDef<ProductSpecificationItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 80 },
            {
                header: 'Icon',
                accessorKey: 'icon',
                enableSorting: true,
                cell: props => (
                    <span>
                        {/* You can render an <img> if icon is a URL, or an icon font otherwise */}
                        {props.row.original.icon}
                    </span>
                ),
            },
            {
                header: 'Specification Name',
                accessorKey: 'name',
                enableSorting: true,
            },
            {
                header: 'Country Name',
                accessorKey: 'country_name',
                enableSorting: true,
            },
            {
                header: 'Actions',
                id: 'action',
                meta: { HeaderClass: 'text-center' },
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)}
                        onDelete={() => handleDeleteClick(props.row.original)}
                    />
                ),
            },
        ],
        [],
    )

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Product Specifications</h5>
                        <Button
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={openAddDrawer}
                        >
                            Add New
                        </Button>
                    </div>
                    <TableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleExportData}
                    />
                    <div className="mt-4">
                        <Table
                            columns={columns}
                            data={pageData}
                            loading={
                                masterLoadingStatus === 'loading' ||
                                isSubmitting ||
                                isDeleting
                            }
                            pagingData={{
                                total: total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            selectedItems={selectedItems}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                            onRowSelect={handleRowSelect}
                            onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <SelectedFooter
                selectedItems={selectedItems}
                onDeleteSelected={handleDeleteSelected}
            />

            <Drawer
                title="Add Product Specification"
                isOpen={isAddDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={closeAddDrawer}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            form="addProductSpecificationForm"
                            type="submit"
                            loading={isSubmitting}
                            disabled={
                                !addFormMethods.formState.isValid ||
                                isSubmitting
                            }
                        >
                            {isSubmitting ? 'Adding...' : 'Save'}
                        </Button>
                    </div>
                }
            >
                <Form
                    id="addProductSpecificationForm"
                    onSubmit={addFormMethods.handleSubmit(onAddSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormItem
                        label="Icon"
                        invalid={!!addFormMethods.formState.errors.icon}
                        errorMessage={addFormMethods.formState.errors.icon?.message}
                    >
                        <Controller
                            name="icon"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Enter icon name or URL" />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Specification Name"
                        invalid={!!addFormMethods.formState.errors.name}
                        errorMessage={addFormMethods.formState.errors.name?.message}
                    >
                        <Controller
                            name="name"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Enter specification name" />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Country Name"
                        invalid={!!addFormMethods.formState.errors.country_name}
                        errorMessage={addFormMethods.formState.errors.country_name?.message}
                    >
                        <Controller
                            name="country_name"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Enter country name" />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer
                title="Edit Product Specification"
                isOpen={isEditDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={closeEditDrawer}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            form="editProductSpecificationForm"
                            type="submit"
                            loading={isSubmitting}
                            disabled={
                                !editFormMethods.formState.isValid ||
                                isSubmitting
                            }
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                }
            >
                <Form
                    id="editProductSpecificationForm"
                    onSubmit={editFormMethods.handleSubmit(onEditSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormItem
                        label="Icon"
                        invalid={!!editFormMethods.formState.errors.icon}
                        errorMessage={editFormMethods.formState.errors.icon?.message}
                    >
                        <Controller
                            name="icon"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Enter icon name or URL" />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Specification Name"
                        invalid={!!editFormMethods.formState.errors.name}
                        errorMessage={editFormMethods.formState.errors.name?.message}
                    >
                        <Controller
                            name="name"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Enter specification name" />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label="Country Name"
                        invalid={!!editFormMethods.formState.errors.country_name}
                        errorMessage={editFormMethods.formState.errors.country_name?.message}
                    >
                        <Controller
                            name="country_name"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Enter country name" />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer
                title="Filter Specifications"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={onClearFilters}
                        >
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            form="filterProductSpecificationForm"
                            type="submit"
                        >
                            Apply
                        </Button>
                    </div>
                }
            >
                <Form
                    id="filterProductSpecificationForm"
                    onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormItem label="Filter by Specification Name(s)">
                        <Controller
                            name="filterNames"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    // {...field}
                                    placeholder="Type or select specification names..."
                                    list="spec-names"
                                />
                            )}
                        />
                        <datalist id="spec-names">
                            {nameOptions.map(opt => (
                                <option key={opt.value} value={opt.value} />
                            ))}
                        </datalist>
                    </FormItem>
                    <FormItem label="Filter by Country Name(s)">
                        <Controller
                            name="filterCountryNames"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Type or select country names..."
                                    list="country-names"
                                />
                            )}
                        />
                        <datalist id="country-names">
                            {countryNameOptions.map(opt => (
                                <option key={opt.value} value={opt.value} />
                            ))}
                        </datalist>
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen}
                type="danger"
                title="Delete Specification"
                onClose={() => {
                    setSingleDeleteConfirmOpen(false)
                    setItemToDelete(null)
                }}
                onRequestClose={() => {
                    setSingleDeleteConfirmOpen(false)
                    setItemToDelete(null)
                }}
                onCancel={() => {
                    setSingleDeleteConfirmOpen(false)
                    setItemToDelete(null)
                }}
                onConfirm={onConfirmSingleDelete}
                loading={isDeleting}
            >
                <p>
                    Are you sure you want to delete the specification "
                    <strong>{itemToDelete?.name}</strong>"?
                </p>
            </ConfirmDialog>
        </>
    )
}

export default ProductSpecification

function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
