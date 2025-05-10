import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate was unused, Link might be if not used in breadcrumbs
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog' // Import Props
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import { Drawer, Form, FormItem, Input } from '@/components/ui'

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import {
    getUnitAction,
    addUnitAction,
    editUnitAction,
    deletUnitAction,
    deletAllUnitAction, // Corrected spelling
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// --- Define Unit Type ---
export type UnitItem = {
    id: string | number
    name: string
}

// --- Zod Schema for Add/Edit Unit Form ---
const unitFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Unit name is required.')
        .max(100, 'Name cannot exceed 100 characters.'),
})
type UnitFormData = z.infer<typeof unitFormSchema>

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterNames: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
})
type FilterFormData = z.infer<typeof filterFormSchema>

// --- CSV Exporter Utility ---
// Define specific headers and keys for export
const CSV_HEADERS = ['ID', 'Unit Name']
const CSV_KEYS: (keyof UnitItem)[] = ['id', 'name']

function exportToCsv(filename: string, rows: UnitItem[]) {
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
                    let cell = row[k]
                    if (cell === null || cell === undefined) {
                        cell = ''
                    } else {
                        // For UnitItem, id and name are string/number, no Date expected
                        cell = String(cell).replace(/"/g, '""') // Ensure string and escape double quotes
                    }
                    if (String(cell).search(/("|,|\n)/g) >= 0) {
                        // Ensure cell is string for search
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
            {' '}
            <Tooltip title="Edit">
                {' '}
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    {' '}
                    <TbPencil />{' '}
                </div>{' '}
            </Tooltip>{' '}
            <Tooltip title="Delete">
                {' '}
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400',
                    )}
                    role="button"
                    onClick={onDelete}
                >
                    {' '}
                    <TbTrash />{' '}
                </div>{' '}
            </Tooltip>{' '}
        </div>
    )
}

// --- UnitsSearch Component ---
type UnitsSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const UnitsSearch = React.forwardRef<HTMLInputElement, UnitsSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                className="w-full"
                placeholder="Quick search units..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
UnitsSearch.displayName = 'UnitsSearch'

// --- UnitsTableTools Component ---
const UnitsTableTools = ({
    onSearchChange,
    onFilter,
    onExport,
}: {
    onSearchChange: (query: string) => void
    onFilter: () => void
    onExport: () => void
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            {' '}
            <div className="flex-grow">
                {' '}
                <UnitsSearch onInputChange={onSearchChange} />{' '}
            </div>{' '}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {' '}
                <Button
                    icon={<TbFilter />}
                    onClick={onFilter}
                    className="w-full sm:w-auto"
                >
                    {' '}
                    Filter{' '}
                </Button>{' '}
                <Button
                    icon={<TbCloudUpload />}
                    onClick={onExport}
                    className="w-full sm:w-auto"
                >
                    {' '}
                    Export{' '}
                </Button>{' '}
            </div>{' '}
        </div>
    )
}

// --- UnitsTable Component ---
type UnitsTableProps = {
    columns: ColumnDef<UnitItem>[]
    data: UnitItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedItems: UnitItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: UnitItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<UnitItem>[]) => void
}
const UnitsTable = ({
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
}: UnitsTableProps) => {
    return (
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
}

// --- UnitsSelectedFooter Component ---
type UnitsSelectedFooterProps = {
    selectedItems: UnitItem[]
    onDeleteSelected: () => void
}
const UnitsSelectedFooter = ({
    selectedItems,
    onDeleteSelected,
}: UnitsSelectedFooterProps) => {
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
            {' '}
            <StickyFooter
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
            >
                {' '}
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    {' '}
                    <span className="flex items-center gap-2">
                        {' '}
                        <span className="text-lg text-primary-600 dark:text-primary-400">
                            {' '}
                            <TbChecks />{' '}
                        </span>{' '}
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            {' '}
                            <span className="heading-text">
                                {' '}
                                {selectedItems.length}{' '}
                            </span>{' '}
                            <span>
                                {' '}
                                Item{selectedItems.length > 1 ? 's' : ''}{' '}
                                selected{' '}
                            </span>{' '}
                        </span>{' '}
                    </span>{' '}
                    <div className="flex items-center gap-3">
                        {' '}
                        <Button
                            size="sm"
                            variant="plain"
                            className="text-red-600 hover:text-red-500"
                            onClick={handleDeleteClick}
                        >
                            {' '}
                            Delete Selected{' '}
                        </Button>{' '}
                    </div>{' '}
                </div>{' '}
            </StickyFooter>{' '}
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedItems.length} Unit${selectedItems.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                {' '}
                <p>
                    {' '}
                    Are you sure you want to delete the selected unit
                    {selectedItems.length > 1 ? 's' : ''}? This action cannot be
                    undone.{' '}
                </p>{' '}
            </ConfirmDialog>{' '}
        </>
    )
}

// --- Main Units Component ---
const Units = () => {
    const dispatch = useAppDispatch()

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null)
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] =
        useState(false)
    const [unitToDelete, setUnitToDelete] = useState<UnitItem | null>(null)

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
        filterNames: [],
    })

    const { unitData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)

    useEffect(() => {
        dispatch(getUnitAction())
    }, [dispatch])

    const addFormMethods = useForm<UnitFormData>({
        resolver: zodResolver(unitFormSchema),
        defaultValues: { name: '' },
        mode: 'onChange',
    })
    const editFormMethods = useForm<UnitFormData>({
        resolver: zodResolver(unitFormSchema),
        defaultValues: { name: '' },
        mode: 'onChange',
    })
    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        defaultValues: filterCriteria,
    })

    const openAddDrawer = () => {
        addFormMethods.reset({ name: '' })
        setIsAddDrawerOpen(true)
    }
    const closeAddDrawer = () => {
        addFormMethods.reset({ name: '' })
        setIsAddDrawerOpen(false)
    }
    const onAddUnitSubmit = async (data: UnitFormData) => {
        setIsSubmitting(true)
        try {
            await dispatch(addUnitAction({ name: data.name })).unwrap()
            toast.push(
                <Notification title="Unit Added" type="success" duration={2000}>
                    {' '}
                    Unit "{data.name}" added.{' '}
                </Notification>,
            )
            closeAddDrawer()
            dispatch(getUnitAction())
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Add"
                    type="danger"
                    duration={3000}
                >
                    {' '}
                    {error.message || 'Could not add unit.'}{' '}
                </Notification>,
            )
            console.error('Add Unit Error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditDrawer = (unit: UnitItem) => {
        setEditingUnit(unit)
        editFormMethods.setValue('name', unit.name)
        setIsEditDrawerOpen(true)
    }
    const closeEditDrawer = () => {
        setEditingUnit(null)
        editFormMethods.reset({ name: '' })
        setIsEditDrawerOpen(false)
    }
    const onEditUnitSubmit = async (data: UnitFormData) => {
        if (
            !editingUnit ||
            editingUnit.id === undefined ||
            editingUnit.id === null
        ) {
            toast.push(
                <Notification title="Error" type="danger">
                    Cannot edit: Unit ID is missing.
                </Notification>,
            )
            setIsSubmitting(false)
            return
        }
        setIsSubmitting(true)
        try {
            await dispatch(
                editUnitAction({ id: editingUnit.id, name: data.name }),
            ).unwrap()
            toast.push(
                <Notification
                    title="Unit Updated"
                    type="success"
                    duration={2000}
                >
                    {' '}
                    Unit "{data.name}" updated.{' '}
                </Notification>,
            )
            closeEditDrawer()
            dispatch(getUnitAction())
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Update"
                    type="danger"
                    duration={3000}
                >
                    {' '}
                    {error.message || 'Could not update unit.'}{' '}
                </Notification>,
            )
            console.error('Edit Unit Error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteClick = (unit: UnitItem) => {
        if (unit.id === undefined || unit.id === null) {
            toast.push(
                <Notification title="Error" type="danger">
                    Cannot delete: Unit ID is missing.
                </Notification>,
            )
            return
        }
        setUnitToDelete(unit)
        setSingleDeleteConfirmOpen(true)
    }
    const onConfirmSingleDelete = async () => {
        if (
            !unitToDelete ||
            unitToDelete.id === undefined ||
            unitToDelete.id === null
        ) {
            toast.push(
                <Notification title="Error" type="danger">
                    Cannot delete: Unit ID is missing.
                </Notification>,
            )
            setIsDeleting(false)
            setUnitToDelete(null)
            setSingleDeleteConfirmOpen(false)
            return
        }
        setIsDeleting(true)
        setSingleDeleteConfirmOpen(false)
        try {
            await dispatch(deletUnitAction(unitToDelete)).unwrap() // Ensure deletUnitAction takes only ID
            toast.push(
                <Notification
                    title="Unit Deleted"
                    type="success"
                    duration={2000}
                >
                    {' '}
                    Unit "{unitToDelete.name}" deleted.{' '}
                </Notification>,
            )
            setSelectedItems((prev) =>
                prev.filter((item) => item.id !== unitToDelete!.id),
            ) // Use non-null assertion if confident it's set
            dispatch(getUnitAction())
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Delete"
                    type="danger"
                    duration={3000}
                >
                    {' '}
                    {error.message || `Could not delete unit.`}{' '}
                </Notification>,
            )
            console.error('Delete Unit Error:', error)
        } finally {
            setIsDeleting(false)
            setUnitToDelete(null)
        }
    }
    const handleDeleteSelected = async () => {
        console.log("bhavik");
        
        if (selectedItems.length === 0) {
            toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>);
            return;
        }
        setIsDeleting(true);

        const validItemsToDelete = selectedItems.filter(
            (item) => item.id !== undefined && item.id !== null,
        );

        if (validItemsToDelete.length !== selectedItems.length) {
            const skippedCount = selectedItems.length - validItemsToDelete.length;
            toast.push(
                <Notification title="Deletion Warning" type="warning" duration={3000}>
                    {skippedCount} item(s) could not be processed due to missing IDs and were skipped.
                </Notification>,
            );
        }

        if (validItemsToDelete.length === 0) {
            toast.push(<Notification title="No Valid Items" type="info">No valid items to delete.</Notification>);
            setIsDeleting(false);
            return;
        }

        const idsToDelete = validItemsToDelete.map((item) => item.id);
        const commaSeparatedIds = idsToDelete.join(',');

        console.log("Attempting to delete multiple units with IDs:", commaSeparatedIds); // For debugging

        try {
            // Dispatch the new action for bulk delete
            await dispatch(deletAllUnitAction({ ids: commaSeparatedIds })).unwrap(); // Pass as an object or string based on your action's expectation

            toast.push(
                <Notification
                    title="Deletion Successful"
                    type="success"
                    duration={2000}
                >
                    {validItemsToDelete.length} unit(s) successfully processed for deletion.
                </Notification>,
            );
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Deletion Failed"
                    type="danger"
                    duration={3000}
                >
                    {error.message || 'Failed to delete selected units.'}
                </Notification>,
            );
            console.error('Delete selected units error:', error);
        } finally {
            setSelectedItems([]); // Clear selection
            dispatch(getUnitAction()); // Refresh the list
            setIsDeleting(false);
        }
    };

    const openFilterDrawer = () => {
        filterFormMethods.reset(filterCriteria)
        setIsFilterDrawerOpen(true)
    }
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false)
    const onApplyFiltersSubmit = (data: FilterFormData) => {
        setFilterCriteria({ filterNames: data.filterNames || [] })
        handleSetTableData({ pageIndex: 1 })
        closeFilterDrawer()
    }
    const onClearFilters = () => {
        const defaultFilters = { filterNames: [] }
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
    const [selectedItems, setSelectedItems] = useState<UnitItem[]>([])

    const unitNameOptions = useMemo(() => {
        if (!Array.isArray(unitData)) return []
        const uniqueNames = new Set(unitData.map((unit) => unit.name))
        return Array.from(uniqueNames).map((name) => ({
            value: name,
            label: name,
        }))
    }, [unitData])

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData: UnitItem[] = Array.isArray(unitData) ? unitData : []
        let processedData: UnitItem[] = cloneDeep(sourceData)

        if (
            filterCriteria.filterNames &&
            filterCriteria.filterNames.length > 0
        ) {
            const selectedFilterNames = filterCriteria.filterNames.map((opt) =>
                opt.value.toLowerCase(),
            )
            processedData = processedData.filter((item: UnitItem) =>
                selectedFilterNames.includes(
                    item.name?.trim().toLowerCase() ?? '',
                ),
            )
        }

        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            processedData = processedData.filter((item: UnitItem) => {
                const itemNameLower = item.name?.trim().toLowerCase() ?? ''
                const itemIdString = String(item.id ?? '').trim()
                const itemIdLower = itemIdString.toLowerCase()
                return (
                    itemNameLower.includes(query) || itemIdLower.includes(query)
                )
            })
        }
        const { order, key } = tableData.sort as OnSortParam
        if (
            order &&
            key &&
            (key === 'id' || key === 'name') &&
            processedData.length > 0
        ) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                const aValue = String(a[key as keyof UnitItem] ?? '')
                const bValue = String(b[key as keyof UnitItem] ?? '')
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
    }, [unitData, tableData, filterCriteria])

    const handleExportData = () => {
        const success = exportToCsv(
            'units_export.csv',
            allFilteredAndSortedData,
        )
        if (success) {
            toast.push(
                <Notification title="Export Successful" type="success">
                    Data exported.
                </Notification>,
            )
        }
        // The exportToCsv function already handles the "No Data" toast.
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
            // Ensure this is used if DataTable has onSort
            handleSetTableData({ sort: sort, pageIndex: 1 })
        },
        [handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
        [handleSetTableData],
    )
    const handleRowSelect = useCallback((checked: boolean, row: UnitItem) => {
        setSelectedItems((prev) => {
            if (checked)
                return prev.some((item) => item.id === row.id)
                    ? prev
                    : [...prev, row]
            return prev.filter((item) => item.id !== row.id)
        })
    }, [])
    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<UnitItem>[]) => {
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

    const columns: ColumnDef<UnitItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 100 },
            { header: 'Unit Name', accessorKey: 'name', enableSorting: true },
            {
                header: 'Actions',
                id: 'action',
                meta:{HeaderClass: "text-center"},
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)}
                        onDelete={() => handleDeleteClick(props.row.original)}
                    />
                ),
            },
        ],
        [openEditDrawer, handleDeleteClick], // Added dependencies that might change if component re-renders for other reasons
    )

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Units</h5>
                        <Button
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={openAddDrawer}
                        >
                            {' '}
                            Add New{' '}
                        </Button>
                    </div>
                    <UnitsTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleExportData}
                    />
                    <div className="mt-4">
                        <UnitsTable
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
                            onSort={handleSort} // Pass handleSort to DataTable
                            onRowSelect={handleRowSelect}
                            onAllRowSelect={handleAllRowSelect}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            <UnitsSelectedFooter
                selectedItems={selectedItems}
                onDeleteSelected={handleDeleteSelected}
            />

            <Drawer
                title="Add Unit"
                isOpen={isAddDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        {' '}
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={closeAddDrawer}
                            disabled={isSubmitting}
                        >
                            {' '}
                            Cancel{' '}
                        </Button>{' '}
                        <Button
                            size="sm"
                            variant="solid"
                            form="addUnitForm"
                            type="submit"
                            loading={isSubmitting}
                            disabled={
                                !addFormMethods.formState.isValid ||
                                isSubmitting
                            }
                        >
                            {' '}
                            {isSubmitting ? 'Adding...' : 'Save'}{' '}
                        </Button>{' '}
                    </div>
                }
            >
                <Form
                    id="addUnitForm"
                    onSubmit={addFormMethods.handleSubmit(onAddUnitSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormItem
                        label="Unit Name"
                        invalid={!!addFormMethods.formState.errors.name}
                        errorMessage={
                            addFormMethods.formState.errors.name?.message
                        }
                    >
                        <Controller
                            name="name"
                            control={addFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Enter Unit Name"
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer
                title="Edit Unit"
                isOpen={isEditDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        {' '}
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={closeEditDrawer}
                            disabled={isSubmitting}
                        >
                            {' '}
                            Cancel{' '}
                        </Button>{' '}
                        <Button
                            size="sm"
                            variant="solid"
                            form="editUnitForm"
                            type="submit"
                            loading={isSubmitting}
                            disabled={
                                !editFormMethods.formState.isValid ||
                                isSubmitting
                            }
                        >
                            {' '}
                            {isSubmitting ? 'Saving...' : 'Save'}{' '}
                        </Button>{' '}
                    </div>
                }
            >
                <Form
                    id="editUnitForm"
                    onSubmit={editFormMethods.handleSubmit(onEditUnitSubmit)}
                    className="flex flex-col gap-4"
                >
                    <FormItem
                        label="Unit Name"
                        invalid={!!editFormMethods.formState.errors.name}
                        errorMessage={
                            editFormMethods.formState.errors.name?.message
                        }
                    >
                        <Controller
                            name="name"
                            control={editFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    placeholder="Enter Unit Name"
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>

            <Drawer
                title="Filter Units"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        {' '}
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={onClearFilters}
                        >
                            {' '}
                            Clear{' '}
                        </Button>{' '}
                        <Button
                            size="sm"
                            variant="solid"
                            form="filterUnitForm"
                            type="submit"
                        >
                            {' '}
                            Apply{' '}
                        </Button>{' '}
                    </div>
                }
            >
                <Form
                    id="filterUnitForm"
                    onSubmit={filterFormMethods.handleSubmit(
                        onApplyFiltersSubmit,
                    )}
                    className="flex flex-col gap-4"
                >
                    <FormItem label="Filter by Unit Name(s)">
                        <Controller
                            name="filterNames"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select unit names..."
                                    options={unitNameOptions}
                                    value={field.value || []} // Ensure value is always an array for MultiSelect
                                    onChange={(selectedVal) =>
                                        field.onChange(selectedVal || [])
                                    }
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>

            <ConfirmDialog
                isOpen={singleDeleteConfirmOpen}
                type="danger"
                title="Delete Unit"
                onClose={() => {
                    setSingleDeleteConfirmOpen(false)
                    setUnitToDelete(null)
                }}
                onRequestClose={() => {
                    setSingleDeleteConfirmOpen(false)
                    setUnitToDelete(null)
                }}
                onCancel={() => {
                    setSingleDeleteConfirmOpen(false)
                    setUnitToDelete(null)
                }}
                onConfirm={onConfirmSingleDelete}
                // Add loading prop to ConfirmDialogProps if your component supports it
                // For now, I'm removing it to avoid the TypeScript error.
                // You'll need to handle the visual loading state inside ConfirmDialog if desired.
                // loading={isDeleting}
            >
                <p>
                    {' '}
                    Are you sure you want to delete the unit "
                    <strong>{unitToDelete?.name}</strong>"? {' '}
                </p>
            </ConfirmDialog>
        </>
    )
}

export default Units

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
