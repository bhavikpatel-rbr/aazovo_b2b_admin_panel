// src/views/your-path/Units.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog' // Kept for export reason modal
import DebouceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import { Drawer, Form, FormItem, Input, Tag } from '@/components/ui' // Added Tag

// Icons
import {
    TbPencil,
    // TbTrash, // Commented out
    // TbChecks, // Commented out
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbReload,
} from 'react-icons/tb'

// Types
import type {
    OnSortParam,
    ColumnDef,
    // Row, // Commented out
} from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import {
    getUnitAction,
    addUnitAction,
    editUnitAction,
    getCategoriesAction,
    // deleteUnitAction, // Commented out
    // deleteAllUnitAction, // Commented out
    submitExportReasonAction,
    getParentCategoriesAction, // Placeholder for future action
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// Type for Select options
type SelectOption = {
    value: string | number
    label: string
}

// --- Define Unit Type ---
export type UnitItem = {
    id: string | number
    name: string
    status: 'Active' | 'Inactive' // Added status field
    created_at?: string
    updated_at?: string
    updated_by_name?: string
    updated_by_role?: string
    category_id: any
    category_name: any
}

// --- Status Options ---
const statusOptions: SelectOption[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
]

// --- Zod Schema for Add/Edit Unit Form ---
const unitFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Unit name is required.')
        .max(100, 'Name cannot exceed 100 characters.'),
    status: z.enum(['Active', 'Inactive'], {
        required_error: 'Status is required.',
    }), // Added status
    category_id: z
        .number({ invalid_type_error: 'Category is required.' })
        .positive('Category is required.')
        .nullable(),
    // Added status
})
type UnitFormData = z.infer<typeof unitFormSchema>

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
    filterNames: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
    filterStatus: z // Added status filter
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
})
type FilterFormData = z.infer<typeof filterFormSchema>

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
    reason: z
        .string()
        .min(1, 'Reason for export is required.')
        .max(255, 'Reason cannot exceed 255 characters.'),
})
type ExportReasonFormData = z.infer<typeof exportReasonSchema>

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
    'ID',
    'Unit Name',
    'Status',
    'Updated By',
    'Updated Role',
    'Updated At',
]
type UnitExportItem = Omit<UnitItem, 'created_at' | 'updated_at'> & {
    status: 'Active' | 'Inactive' // Ensure status is part of export
    updated_at_formatted?: string
}
const CSV_KEYS_EXPORT: (keyof UnitExportItem)[] = [
    'id',
    'name',
    'status', // Added status
    'updated_by_name',
    'updated_by_role',
    'updated_at_formatted',
]

function exportToCsv(filename: string, rows: UnitItem[]) {
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info">
                Nothing to export.
            </Notification>,
        )
        return false
    }
    const transformedRows: UnitExportItem[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status, // Added status
        updated_by_name: row.updated_by_name || 'N/A',
        updated_by_role: row.updated_by_role || 'N/A',
        updated_at_formatted: row.updated_at
            ? new Date(row.updated_at).toLocaleString()
            : 'N/A',
    }))

    const separator = ','
    const csvContent =
        CSV_HEADERS.join(separator) +
        '\n' +
        transformedRows
            .map((row) => {
                return CSV_KEYS_EXPORT.map((k) => {
                    let cell = row[k as keyof UnitExportItem]
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
        toast.push(
            <Notification title="Export Successful" type="success">
                Data exported to {filename}.
            </Notification>,
        )
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
const ActionColumn = ({ onEdit }: { onEdit: () => void }) => {
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
                placeholder="Quick Search..."
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
    onClearFilters,
}: {
    onSearchChange: (query: string) => void
    onFilter: () => void
    onExport: () => void
    onClearFilters: () => void
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow">
                <UnitsSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                <Button
                    title="Clear Filters"
                    icon={<TbReload />}
                    onClick={() => onClearFilters()}
                ></Button>
                <Button
                    icon={<TbFilter />}
                    onClick={onFilter}
                    className="w-full sm:w-auto"
                >
                    Filter
                </Button>
                <Button
                    icon={<TbCloudUpload />}
                    onClick={onExport} // This will now open the reason modal
                    className="w-full sm:w-auto"
                >
                    Export
                </Button>
            </div>
        </div>
    )
}

// --- UnitsTable Component ---
type UnitsTableProps = {
    columns: ColumnDef<UnitItem>[]
    data: UnitItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
}
const UnitsTable = ({
    columns,
    data,
    loading,
    pagingData,
    onPaginationChange,
    onSelectChange,
    onSort,
}: UnitsTableProps) => {
    return (
        <DataTable
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
        />
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

    // State for export reason modal
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] =
        useState(false)
    const [isSubmittingExportReason, setIsSubmittingExportReason] =
        useState(false)

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
        filterNames: [],
        filterStatus: [], // Added
    })

    const {
        unitData = [],
        ParentCategories = [],
        status: masterLoadingStatus = 'idle',
    } = useSelector(masterSelector)

    const defaultFormValues: UnitFormData = useMemo(
        () => ({
            name: '',
            status: 'Active', // Default status
        }),
        [],
    )

    useEffect(() => {
        dispatch(getUnitAction())
        dispatch(getParentCategoriesAction())
    }, [dispatch])

    const CategoryOptions =
        ParentCategories.length > 0 &&
        ParentCategories?.map((sc: any) => ({
            value: sc.id,
            label: sc.name,
        }))

    const addFormMethods = useForm<UnitFormData>({
        resolver: zodResolver(unitFormSchema),
        defaultValues: defaultFormValues,
        mode: 'onChange',
    })
    const editFormMethods = useForm<UnitFormData>({
        resolver: zodResolver(unitFormSchema),
        defaultValues: defaultFormValues,
        mode: 'onChange',
    })
    const filterFormMethods = useForm<FilterFormData>({
        resolver: zodResolver(filterFormSchema),
        defaultValues: filterCriteria,
    })
    const exportReasonFormMethods = useForm<ExportReasonFormData>({
        resolver: zodResolver(exportReasonSchema),
        defaultValues: { reason: '' },
        mode: 'onChange',
    })

    const openAddDrawer = () => {
        addFormMethods.reset(defaultFormValues)
        setIsAddDrawerOpen(true)
    }
    const closeAddDrawer = () => {
        addFormMethods.reset(defaultFormValues)
        setIsAddDrawerOpen(false)
    }
    const onAddUnitSubmit = async (data: UnitFormData) => {
        console.log('bhavik', data)

        setIsSubmitting(true)
        try {
            // API expected to handle audit fields, only send name and status
            await dispatch(
                addUnitAction({
                    name: data.name,
                    status: data.status,
                    category_id: data.category_id,
                }),
            ).unwrap()
            toast.push(
                <Notification title="Unit Added" type="success" duration={2000}>
                    Unit "{data.name}" added.
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
                    {error.message || 'Could not add unit.'}
                </Notification>,
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditDrawer = useCallback(
        (unit: UnitItem) => {
            setEditingUnit(unit)
            console.log('category_id: unit.category_id,')

            editFormMethods.reset({
                name: unit.name,
                category_id: parseInt(unit.category_id),
                status: unit.status || 'Active', // Set status, default to Active
            })
            setIsEditDrawerOpen(true)
        },
        [editFormMethods],
    )

    const closeEditDrawer = () => {
        setEditingUnit(null)
        editFormMethods.reset(defaultFormValues)
        setIsEditDrawerOpen(false)
    }
    const onEditUnitSubmit = async (data: UnitFormData) => {
        if (!editingUnit?.id) return
        setIsSubmitting(true)
        try {
            // API expected to handle audit fields, only send id, name and status
            await dispatch(
                editUnitAction({
                    id: editingUnit.id,
                    name: data.name,
                    category_id: data.category_id,
                    status: data.status,
                }),
            ).unwrap()
            toast.push(
                <Notification
                    title="Unit Updated"
                    type="success"
                    duration={2000}
                >
                    Unit "{data.name}" updated.
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
                    {error.message || 'Could not update unit.'}
                </Notification>,
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const openFilterDrawer = () => {
        filterFormMethods.reset(filterCriteria)
        setIsFilterDrawerOpen(true)
    }
    const closeFilterDrawerCb = useCallback(
        () => setIsFilterDrawerOpen(false),
        [],
    )
    const onApplyFiltersSubmit = (data: FilterFormData) => {
        setFilterCriteria({
            filterNames: data.filterNames || [],
            filterStatus: data.filterStatus || [], // Added
        })
        handleSetTableData({ pageIndex: 1 })
        closeFilterDrawerCb()
    }
    const onClearFilters = () => {
        const defaultFilters = {
            filterNames: [],
            filterStatus: [], // Added
        }
        filterFormMethods.reset(defaultFilters)
        setFilterCriteria(defaultFilters)
        handleSetTableData({ pageIndex: 1 })
        dispatch(getUnitAction())
    }

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })

    const unitNameOptions = useMemo(() => {
        if (!Array.isArray(unitData)) return []
        const uniqueNames = new Set(unitData.map((unit) => unit.name))
        return Array.from(uniqueNames).map((name) => ({
            value: name,
            label: name,
        }))
    }, [unitData])

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData: UnitItem[] = Array.isArray(unitData)
            ? unitData.map((item) => ({
                  ...item,
                  status: item.status || 'Inactive', // Ensure status has a default
              }))
            : []
        let processedData: UnitItem[] = cloneDeep(sourceData)

        if (filterCriteria.filterNames?.length) {
            const selectedFilterNames = filterCriteria.filterNames.map((opt) =>
                opt.value.toLowerCase(),
            )
            processedData = processedData.filter((item) =>
                selectedFilterNames.includes(
                    item.name?.trim().toLowerCase() ?? '',
                ),
            )
        }
        if (filterCriteria.filterStatus?.length) {
            // Added status filter
            const statuses = filterCriteria.filterStatus.map((opt) => opt.value)
            processedData = processedData.filter((item) =>
                statuses.includes(item.status),
            )
        }

        if (tableData.query) {
            const query = tableData.query.toLowerCase().trim()
            processedData = processedData.filter(
                (item) =>
                    (item.name?.trim().toLowerCase() ?? '').includes(query) ||
                    (item.status?.trim().toLowerCase() ?? '').includes(query) || // Search by status
                    (item.updated_by_name?.trim().toLowerCase() ?? '').includes(
                        query,
                    ) ||
                    String(item.id ?? '')
                        .trim()
                        .toLowerCase()
                        .includes(query),
            )
        }
        const { order, key } = tableData.sort as OnSortParam
        if (
            order &&
            key &&
            ['id', 'name', 'status', 'updated_at', 'updated_by_name'].includes(
                key,
            ) && // Added status to sortable keys
            processedData.length > 0
        ) {
            processedData.sort((a, b) => {
                let aValue: any, bValue: any
                if (key === 'updated_at') {
                    const dateA = a.updated_at
                        ? new Date(a.updated_at).getTime()
                        : 0
                    const dateB = b.updated_at
                        ? new Date(b.updated_at).getTime()
                        : 0
                    return order === 'asc' ? dateA - dateB : dateB - dateA
                } else if (key === 'status') {
                    // Added status sorting
                    aValue = a.status ?? ''
                    bValue = b.status ?? ''
                } else {
                    aValue = a[key as keyof UnitItem] ?? ''
                    bValue = b[key as keyof UnitItem] ?? ''
                }

                return order === 'asc'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue))
            })
        }

        const currentTotal = processedData.length
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        return {
            pageData: processedData.slice(startIndex, startIndex + pageSize),
            total: currentTotal,
            allFilteredAndSortedData: processedData,
        }
    }, [unitData, tableData, filterCriteria])

    const handleOpenExportReasonModal = () => {
        if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
            toast.push(
                <Notification title="No Data" type="info">
                    Nothing to export.
                </Notification>,
            )
            return
        }
        exportReasonFormMethods.reset({ reason: '' })
        setIsExportReasonModalOpen(true)
    }

    const handleConfirmExportWithReason = async (
        data: ExportReasonFormData,
    ) => {
        setIsSubmittingExportReason(true)
        const moduleName = 'Units'
        const timestamp = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const fileName = `units_export_${timestamp}.csv`
        try {
            await dispatch(
                submitExportReasonAction({
                    reason: data.reason,
                    module: moduleName,
                    file_name: fileName,
                }),
            ).unwrap()
            toast.push(
                <Notification title="Export Reason Submitted" type="success" />,
            )

            // Proceed with export
            exportToCsv(fileName, allFilteredAndSortedData)
            setIsExportReasonModalOpen(false)
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Submit Reason"
                    type="danger"
                    message={error.message}
                />,
            )
        } finally {
            setIsSubmittingExportReason(false)
        }
    }

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }))
    }, [])
    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData],
    )
    const handleSelectPageSizeChange = useCallback(
        (value: number) => {
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 })
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

    const columns: ColumnDef<UnitItem>[] = useMemo(
        () => [
            // { header: "ID", accessorKey: "id", enableSorting: true, size: 100 },
            {
                header: 'Unit Name',
                accessorKey: 'name',
                enableSorting: true,
                size: 320,
            },
            {
                header: 'Category',
                accessorKey: 'category.name',
                enableSorting: true,
                size: 320,
            },
            {
                header: 'Updated Info',
                accessorKey: 'updated_at',
                enableSorting: true,

                size: 250,
                cell: (props) => {
                    const { updated_at, updated_by_user, updated_by_role } =
                        props.row.original
                    const formattedDate = updated_at
                        ? `${new Date(updated_at).getDate()} ${new Date(
                              updated_at,
                          ).toLocaleString('en-US', {
                              month: 'long',
                          })} ${new Date(updated_at).getFullYear()}, ${new Date(
                              updated_at,
                          ).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                          })}`
                        : 'N/A'
                    return (
                        <div className="text-xs">
                            <span>
                                {updated_by_user?.name || 'N/A'}
                                {updated_by_user?.roles[0]?.display_name && (
                                    <>
                                        <br />
                                        <b>
                                            {
                                                updated_by_user?.roles[0]
                                                    ?.display_name
                                            }
                                        </b>
                                    </>
                                )}
                            </span>
                            <br />
                            <span>{formattedDate}</span>
                        </div>
                    )
                },
            },
            {
                // Added Status Column
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                size: 80,
                cell: (props) => {
                    const status = props.row.original.status
                    return (
                        <Tag
                            className={classNames(
                                'capitalize font-semibold whitespace-nowrap',
                                {
                                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500':
                                        status === 'Active',
                                    'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500':
                                        status === 'Inactive',
                                },
                            )}
                        >
                            {status}
                        </Tag>
                    )
                },
            },
            {
                header: 'Actions',
                id: 'action',
                meta: { HeaderClass: 'text-center', cellClass: 'text-center' },
                size: 80,
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)}
                    />
                ),
            },
        ],
        [openEditDrawer],
    )

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Units</h5>
                        <Button
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={openAddDrawer}
                        >
                            Add New
                        </Button>
                    </div>
                    <UnitsTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleOpenExportReasonModal} // Changed to open reason modal
                        onClearFilters={onClearFilters}
                    />
                    <div className="mt-4">
                        <UnitsTable
                            columns={columns}
                            data={pageData}
                            loading={
                                masterLoadingStatus === 'loading' ||
                                isSubmitting
                            }
                            pagingData={{
                                total: total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectPageSizeChange}
                            onSort={handleSort}
                        />
                    </div>
                </AdaptiveCard>
            </Container>

            {[
                {
                    formMethods: addFormMethods,
                    onSubmit: onAddUnitSubmit,
                    isOpen: isAddDrawerOpen,
                    closeFn: closeAddDrawer,
                    title: 'Add Unit',
                    formId: 'addUnitForm',
                    submitText: 'Adding...',
                    saveText: 'Save',
                    isEdit: false,
                },
                {
                    formMethods: editFormMethods,
                    onSubmit: onEditUnitSubmit,
                    isOpen: isEditDrawerOpen,
                    closeFn: closeEditDrawer,
                    title: 'Edit Unit',
                    formId: 'editUnitForm',
                    submitText: 'Saving...',
                    saveText: 'Save',
                    isEdit: true,
                },
            ].map((drawerProps) => (
                <Drawer
                    key={drawerProps.formId}
                    title={drawerProps.title}
                    isOpen={drawerProps.isOpen}
                    onClose={drawerProps.closeFn}
                    onRequestClose={drawerProps.closeFn}
                    width={480}
                    bodyClass='relative'
                    footer={
                        <div className="text-right w-full">
                            <Button
                                size="sm"
                                className="mr-2"
                                onClick={drawerProps.closeFn}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                variant="solid"
                                form={drawerProps.formId}
                                type="submit"
                                loading={isSubmitting}
                                // disabled={
                                //   !drawerProps.formMethods.formState.isValid || isSubmitting
                                // }
                            >
                                {isSubmitting
                                    ? drawerProps.submitText
                                    : drawerProps.saveText}
                            </Button>
                        </div>
                    }
                >
                    <Form
                        id={drawerProps.formId}
                        onSubmit={drawerProps.formMethods.handleSubmit(
                            drawerProps.onSubmit as any,
                        )}
                        className="flex flex-col gap-4 relative pb-28"
                    >
                        <FormItem
                            label={
                                <div>
                                    Unit Name
                                    <span className="text-red-500"> * </span>
                                </div>
                            }
                            invalid={
                                !!drawerProps.formMethods.formState.errors.name
                            }
                            errorMessage={
                                drawerProps.formMethods.formState.errors.name
                                    ?.message as string | undefined
                            }
                        >
                            <Controller
                                name="name"
                                control={drawerProps.formMethods.control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        placeholder="Enter Unit Name"
                                    />
                                )}
                            />
                        </FormItem>
                        {/* <FormItem
              label={
                <div>
                  Category<span className="text-red-500"> * </span>
                </div>
              }
              invalid={!!drawerProps.formMethods.formState.errors.category}
              errorMessage={
                drawerProps.formMethods.formState.errors.category?.message as
                  | string
                  | undefined
              }
            >
              <Controller
                name="category_id"
                control={drawerProps.formMethods.control}
                render={({ field }) => (
                <Select
                {...field}
                isMulti
                placeholder="Select interested sub categories"
                options={CategoryOptions}
                isClearable
              />
                )}
              />
            </FormItem> */}
                        <FormItem
                            label="Category"
                            invalid={
                                !!drawerProps.formMethods.formState.errors
                                    .category_id
                            }
                            errorMessage={
                                drawerProps.formMethods.formState.errors
                                    .category_id?.message as string | undefined
                            }
                        >
                            <Controller
                                name="category_id"
                                control={drawerProps.formMethods.control}
                                render={({ field }) => (
                                    <Select
                                        options={CategoryOptions}
                                        value={CategoryOptions.find(
                                            (o: any) => o.value === field.value,
                                        )}
                                        onChange={(opt) =>
                                            field.onChange(opt?.value)
                                        }
                                        isClearable
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem // Added Status Field
                            label={
                                <div>
                                    Status
                                    <span className="text-red-500"> * </span>
                                </div>
                            }
                            invalid={
                                !!drawerProps.formMethods.formState.errors
                                    .status
                            }
                            errorMessage={
                                drawerProps.formMethods.formState.errors.status
                                    ?.message as string | undefined
                            }
                        >
                            <Controller
                                name="status"
                                control={drawerProps.formMethods.control}
                                render={({ field }) => (
                                    <Select
                                        placeholder="Select Status"
                                        options={statusOptions}
                                        value={
                                            statusOptions.find(
                                                (option) =>
                                                    option.value ===
                                                    field.value,
                                            ) || null
                                        }
                                        onChange={(option) =>
                                            field.onChange(
                                                option ? option.value : '',
                                            )
                                        }
                                    />
                                )}
                            />
                        </FormItem>
                    </Form>
                    {drawerProps.isEdit && editingUnit && (
                        <div className="absolute bottom-[3%] w-[90%]">
                            <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                                {/* First div (will be narrower) - Removed inline style={{flex:0.4}} */}
                                <div>
                                    <b className="mt-3 mb-3 font-semibold text-primary">
                                        Latest Update:
                                    </b>
                                    <br />
                                    <p className="text-sm font-semibold">
                                        {editingUnit.updated_by_user?.name ||
                                            'N/A'}
                                    </p>
                                    <p>
                                        {editingUnit.updated_by_user?.roles[0]
                                            ?.display_name || 'N/A'}
                                    </p>
                                </div>
                                {/* Second div (will be wider) - Removed inline style={{flex:0.6}} */}
                                <div className='text-right'>
                                    <br />{' '}
                                    {/* This <br /> is for spacing, consider if padding/margin is more appropriate */}
                                    <span className="font-semibold">
                                        Created At:
                                    </span>{' '}
                                    <span>
                                        {editingUnit.created_at
                                            ? `${new Date(editingUnit.created_at).getDate()} ${new Date(
                                                  editingUnit.created_at,
                                              ).toLocaleString('en-US', {
                                                  month: 'short',
                                              })} ${new Date(editingUnit.created_at).getFullYear()}, ${new Date(
                                                  editingUnit.created_at,
                                              ).toLocaleTimeString('en-US', {
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  hour12: true,
                                              })}`
                                            : 'N/A'}
                                    </span>
                                    <br />
                                    <span className="font-semibold">
                                        Updated At:
                                    </span>{' '}
                                    <span>
                                        {editingUnit.updated_at
                                            ? `${new Date(editingUnit.updated_at).getDate()} ${new Date(
                                                  editingUnit.updated_at,
                                              ).toLocaleString('en-US', {
                                                  month: 'short',
                                              })} ${new Date(editingUnit.updated_at).getFullYear()}, ${new Date(
                                                  editingUnit.updated_at,
                                              ).toLocaleTimeString('en-US', {
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  hour12: true,
                                              })}`
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </Drawer>
            ))}

            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawerCb}
                onRequestClose={closeFilterDrawerCb}
                width={400}
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
                            form="filterUnitForm"
                            type="submit"
                        >
                            Apply
                        </Button>
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
                    <FormItem label="Unit Name">
                        <Controller
                            name="filterNames"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select unit names..."
                                    options={unitNameOptions}
                                    value={field.value || []}
                                    onChange={(selectedVal) =>
                                        field.onChange(selectedVal || [])
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Status">
                        {' '}
                        {/* Added Status Filter */}
                        <Controller
                            name="filterStatus"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select status..."
                                    options={statusOptions}
                                    value={field.value || []}
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
                isOpen={isExportReasonModalOpen}
                type="info"
                title="Reason for Export"
                onClose={() => setIsExportReasonModalOpen(false)}
                onRequestClose={() => setIsExportReasonModalOpen(false)}
                onCancel={() => setIsExportReasonModalOpen(false)}
                onConfirm={exportReasonFormMethods.handleSubmit(
                    handleConfirmExportWithReason,
                )}
                loading={isSubmittingExportReason}
                confirmText={
                    isSubmittingExportReason
                        ? 'Submitting...'
                        : 'Submit & Export'
                }
                cancelText="Cancel"
                confirmButtonProps={{
                    disabled:
                        !exportReasonFormMethods.formState.isValid ||
                        isSubmittingExportReason,
                }}
            >
                <Form
                    id="exportReasonForm"
                    onSubmit={(e) => {
                        e.preventDefault()
                        exportReasonFormMethods.handleSubmit(
                            handleConfirmExportWithReason,
                        )()
                    }}
                    className="flex flex-col gap-4 mt-2"
                >
                    <FormItem
                        label="Please provide a reason for exporting this data:"
                        invalid={
                            !!exportReasonFormMethods.formState.errors.reason
                        }
                        errorMessage={
                            exportReasonFormMethods.formState.errors.reason
                                ?.message
                        }
                    >
                        <Controller
                            name="reason"
                            control={exportReasonFormMethods.control}
                            render={({ field }) => (
                                <Input
                                    textArea
                                    {...field}
                                    placeholder="Enter reason..."
                                    rows={3}
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </ConfirmDialog>

            {/* Individual delete ConfirmDialog remains commented out as per template */}
        </>
    )
}

export default Units
