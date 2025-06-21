// src/views/your-path/Continents.tsx

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
import ConfirmDialog from '@/components/shared/ConfirmDialog'
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
    getContinentsAction,
    addContinentAction,
    editContinentAction,
    // deleteContinentAction, // Kept for potential future use, but UI trigger removed
    // deleteAllContinentsAction, // Commented out
    submitExportReasonAction, // Placeholder for future action
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// Type for Select options
type SelectOption = {
    value: string | number
    label: string
}

// --- Define ContinentItem Type ---
export type ContinentItem = {
    id: string | number
    name: string
    status: 'Active' | 'Inactive' // Added status field
    created_at?: string
    updated_at?: string
    updated_by_name?: string
    updated_by_role?: string
}

// --- Status Options ---
const statusOptions: SelectOption[] = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
]

// --- Zod Schema for Add/Edit Continent Form ---
const continentFormSchema = z.object({
    name: z
        .string()
        .min(1, 'Continent name is required.')
        .max(100, 'Name cannot exceed 100 characters.'),
    status: z.enum(['Active', 'Inactive'], {
        required_error: 'Status is required.',
    }), // Added status
})
type ContinentFormData = z.infer<typeof continentFormSchema>

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
const CSV_HEADERS_CONTINENT = [
    'ID',
    'Continent Name',
    'Status',
    'Updated By',
    'Updated Role',
    'Updated At',
]
type ContinentExportItem = Omit<ContinentItem, 'created_at' | 'updated_at'> & {
    status: 'Active' | 'Inactive' // Ensure status is part of export
    updated_at_formatted?: string
}
const CSV_KEYS_CONTINENT_EXPORT: (keyof ContinentExportItem)[] = [
    'id',
    'name',
    'status', // Added status
    'updated_by_name',
    'updated_by_role',
    'updated_at_formatted',
]

function exportToCsvContinent(filename: string, rows: ContinentItem[]) {
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info">
                Nothing to export.
            </Notification>,
        )
        return false
    }
    const transformedRows: ContinentExportItem[] = rows.map((row) => ({
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
        CSV_HEADERS_CONTINENT.join(separator) +
        '\n' +
        transformedRows
            .map((row) => {
                return CSV_KEYS_CONTINENT_EXPORT.map((k) => {
                    let cell = row[k as keyof ContinentExportItem]
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

// --- ContinentSearch Component ---
type ContinentSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const ContinentSearch = React.forwardRef<
    HTMLInputElement,
    ContinentSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            className="w-full"
            placeholder="Quick Search..."
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
ContinentSearch.displayName = 'ContinentSearch'

// --- ContinentTableTools Component ---
const ContinentTableTools = ({
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
                <ContinentSearch onInputChange={onSearchChange} />
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

// --- ContinentTable Component ---
type ContinentTableProps = {
    columns: ColumnDef<ContinentItem>[]
    data: ContinentItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
}
const ContinentTable = ({
    columns,
    data,
    loading,
    pagingData,
    onPaginationChange,
    onSelectChange,
    onSort,
}: ContinentTableProps) => {
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

// --- Main Continents Component ---
const Continents = () => {
    const dispatch = useAppDispatch()

    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
    const [editingContinent, setEditingContinent] =
        useState<ContinentItem | null>(null)
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

    const { ContinentsData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)

    const defaultFormValues: ContinentFormData = useMemo(
        () => ({
            name: '',
            status: 'Active', // Default status
        }),
        [],
    )

    useEffect(() => {
        dispatch(getContinentsAction())
    }, [dispatch])

    const addFormMethods = useForm<ContinentFormData>({
        resolver: zodResolver(continentFormSchema),
        defaultValues: defaultFormValues,
        mode: 'onChange',
    })
    const editFormMethods = useForm<ContinentFormData>({
        resolver: zodResolver(continentFormSchema),
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
    const onAddContinentSubmit = async (data: ContinentFormData) => {
        setIsSubmitting(true)
        try {
            // API expected to handle audit fields, only send name and status
            await dispatch(
                addContinentAction({ name: data.name, status: data.status }),
            ).unwrap()
            toast.push(
                <Notification
                    title="Continent Added"
                    type="success"
                    duration={2000}
                >
                    Continent "{data.name}" added.
                </Notification>,
            )
            closeAddDrawer()
            dispatch(getContinentsAction())
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Add"
                    type="danger"
                    duration={3000}
                >
                    {error.message || 'Could not add continent.'}
                </Notification>,
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditDrawer = useCallback(
        (continent: ContinentItem) => {
            setEditingContinent(continent)
            editFormMethods.reset({
                name: continent.name,
                status: continent.status || 'Active', // Set status, default to Active
            })
            setIsEditDrawerOpen(true)
        },
        [editFormMethods],
    )

    const closeEditDrawer = () => {
        setEditingContinent(null)
        editFormMethods.reset(defaultFormValues)
        setIsEditDrawerOpen(false)
    }
    const onEditContinentSubmit = async (data: ContinentFormData) => {
        if (!editingContinent?.id) return
        setIsSubmitting(true)
        try {
            // API expected to handle audit fields, only send id, name and status
            await dispatch(
                editContinentAction({
                    id: editingContinent.id,
                    name: data.name,
                    status: data.status,
                }),
            ).unwrap()
            toast.push(
                <Notification
                    title="Continent Updated"
                    type="success"
                    duration={2000}
                >
                    Continent "{data.name}" updated.
                </Notification>,
            )
            closeEditDrawer()
            dispatch(getContinentsAction())
        } catch (error: any) {
            toast.push(
                <Notification
                    title="Failed to Update"
                    type="danger"
                    duration={3000}
                >
                    {error.message || 'Could not update continent.'}
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
        dispatch(getContinentsAction())
    }

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })

    const continentNameOptions = useMemo(() => {
        if (!Array.isArray(ContinentsData)) return []
        const uniqueNames = new Set(
            ContinentsData.map((continent) => continent.name),
        )
        return Array.from(uniqueNames).map((name) => ({
            value: name,
            label: name,
        }))
    }, [ContinentsData])

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        const sourceData: ContinentItem[] = Array.isArray(ContinentsData)
            ? ContinentsData.map((item) => ({
                  ...item,
                  status: item.status || 'Inactive', // Ensure status has a default
              }))
            : []
        let processedData: ContinentItem[] = cloneDeep(sourceData)

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
                    aValue = a[key as keyof ContinentItem] ?? ''
                    bValue = b[key as keyof ContinentItem] ?? ''
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
    }, [ContinentsData, tableData, filterCriteria])

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
        const moduleName = 'Continents'
        const timestamp = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
        const fileName = `continents_export_${timestamp}.csv`
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
            // After successful reason submit, download CSV
            exportToCsvContinent(fileName, allFilteredAndSortedData)
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

    const columns: ColumnDef<ContinentItem>[] = useMemo(
        () => [
            // { header: "ID", accessorKey: "id", enableSorting: true, size: 100 },
            {
                header: 'Continent Name',
                accessorKey: 'name',
                enableSorting: true,
                size: 320,
            },
            {
                header: 'Updated Info',
                accessorKey: 'updated_at', // For sorting by date
                enableSorting: true,

                size: 120,
                cell: (props) => {
                    const { updated_at, updated_by_user, updated_by_role } =
                        props.row.original
                    const formattedDate = updated_at
                        ? `${new Date(updated_at).getDate()} ${new Date(
                              updated_at,
                          ).toLocaleString('en-US', {
                              month: 'short',
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
            // {
            //     header: 'Actions',
            //     id: 'action',
            //     meta: { HeaderClass: 'text-center', cellClass: 'text-center' },
            //     size: 60,
            //     cell: (props) => (
            //         <ActionColumn
            //             onEdit={() => openEditDrawer(props.row.original)}
            //         />
            //     ),
            // },
        ],
        [openEditDrawer],
    )

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <h5 className="mb-2 sm:mb-0">Continents</h5>
                        <Button
                            variant="solid"
                            icon={<TbPlus />}
                            onClick={openAddDrawer}
                        >
                            Add New
                        </Button>
                    </div>
                    <ContinentTableTools
                        onSearchChange={handleSearchChange}
                        onFilter={openFilterDrawer}
                        onExport={handleOpenExportReasonModal} // Changed to open reason modal
                        onClearFilters={onClearFilters}
                    />
                    <div className="mt-4">
                        <ContinentTable
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
                    onSubmit: onAddContinentSubmit,
                    isOpen: isAddDrawerOpen,
                    closeFn: closeAddDrawer,
                    title: 'Add Continent',
                    formId: 'addContinentForm',
                    submitText: 'Adding...',
                    saveText: 'Save',
                    isEdit: false,
                },
                {
                    formMethods: editFormMethods,
                    onSubmit: onEditContinentSubmit,
                    isOpen: isEditDrawerOpen,
                    closeFn: closeEditDrawer,
                    title: 'Edit Continent',
                    formId: 'editContinentForm',
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
                                disabled={
                                    !drawerProps.formMethods.formState
                                        .isValid || isSubmitting
                                }
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
                                    Continent Name
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
                                        placeholder="Enter Continent Name"
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
                    {drawerProps.isEdit && editingContinent && (
                        <div className="absolute bottom-[3%] w-[90%]">
                            <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                                {/* First div (will be narrower) - Removed inline style={{flex:0.4}} */}
                                <div>
                                    <b className="mt-3 mb-3 font-semibold text-primary">
                                        Latest Update:
                                    </b>
                                    <br />
                                    <p className="text-sm font-semibold">
                                        {editingContinent.updated_by_user
                                            ?.name || 'N/A'}
                                    </p>
                                    <p>
                                        {editingContinent.updated_by_user
                                            ?.roles[0]?.display_name || 'N/A'}
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
                                        {editingContinent.created_at
                                            ? `${new Date(editingContinent.created_at).getDate()} ${new Date(
                                                  editingContinent.created_at,
                                              ).toLocaleString('en-US', {
                                                  month: 'short',
                                              })} ${new Date(editingContinent.created_at).getFullYear()}, ${new Date(
                                                  editingContinent.created_at,
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
                                        {editingContinent.updated_at
                                            ? `${new Date(editingContinent.updated_at).getDate()} ${new Date(
                                                  editingContinent.updated_at,
                                              ).toLocaleString('en-US', {
                                                  month: 'short',
                                              })} ${new Date(editingContinent.updated_at).getFullYear()}, ${new Date(
                                                  editingContinent.updated_at,
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
                            form="filterContinentForm"
                            type="submit"
                        >
                            Apply
                        </Button>
                    </div>
                }
            >
                <Form
                    id="filterContinentForm"
                    onSubmit={filterFormMethods.handleSubmit(
                        onApplyFiltersSubmit,
                    )}
                    className="flex flex-col gap-4"
                >
                    <FormItem label="Continent Name">
                        <Controller
                            name="filterNames"
                            control={filterFormMethods.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select continent names..."
                                    options={continentNameOptions}
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
                type="info" // Using info type for a form dialog
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
                {/* Form directly inside ConfirmDialog's children for layout */}
                <Form
                    id="exportReasonForm" // ID can be useful for external submit triggers if needed
                    onSubmit={(e) => {
                        e.preventDefault() // Prevent native form submission
                        exportReasonFormMethods.handleSubmit(
                            handleConfirmExportWithReason,
                        )() // Trigger RHF submit
                    }}
                    className="flex flex-col gap-4 mt-2" // Added mt-2 for spacing
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
            {/* 
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Continent"
        onClose={() => { setSingleDeleteConfirmOpen(false); setContinentToDelete(null); }}
        onRequestClose={() => { setSingleDeleteConfirmOpen(false); setContinentToDelete(null); }}
        onCancel={() => { setSingleDeleteConfirmOpen(false); setContinentToDelete(null); }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the continent "
          <strong>{continentToDelete?.name}</strong>"?
        </p>
      </ConfirmDialog>
      */}
        </>
    )
}

export default Continents
