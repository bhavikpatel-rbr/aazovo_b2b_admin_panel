import React, {
    useState,
    useMemo,
    useCallback,
    useEffect,
    useRef,
    ChangeEvent,
} from 'react'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CSVLink } from 'react-csv'
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
import {
    Card,
    Drawer,
    Tag,
    Form,
    FormItem,
    Select,
    DatePicker,
    Input,
    Dropdown,
    Checkbox,
} from '@/components/ui'

// Redux Actions
import {
    getExportMappingsAction,
    submitExportReasonAction,
} from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'

// Icons
import { IoEyeOutline } from 'react-icons/io5'
import {
    TbSearch,
    TbCloudDownload,
    TbFilter,
    TbCloudUpload,
    TbCalendarUp,
    TbUserUp,
    TbBookUpload,
    TbReload,
    TbColumns,
    TbX,
} from 'react-icons/tb'
import userIconPlaceholder from '/img/avatars/thumb-1.jpg'

// Types
import type { OnSortParam, ColumnDef } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- 1. UPDATED API DATA STRUCTURE TYPES ---
export type ApiExportMapping = {
    id: number
    created_at: string
    updated_at: string
    exported_by: string
    exported_from: string
    reason: string | null
    deleted_at: string | null
    user: any
    roles: any
    file_name: string | null
}

// --- Frontend Item Type (This remains the same) ---
export type ExportMappingItem = {
    id: number
    userId: number | null
    userName: string
    userRole: string
    exportFrom: string
    fileName: string | null
    reason: string | null
    exportDate: Date
    profile_pic_path:  string | null
}

// --- Zod Schema for Export Reason Form (New) ---
const exportReasonSchema = z.object({
    reason: z
        .string()
        .min(10, 'Reason must be at least 10 characters long.')
        .max(255, 'Reason cannot exceed 255 characters.'),
})
type ExportReasonFormData = z.infer<typeof exportReasonSchema>

// --- 2. REVISED TRANSFORMATION FUNCTION ---
const transformApiDataToExportMappingItem = (
    apiData: ApiExportMapping,
): ExportMappingItem | null => {
    if (!apiData) {
        return null
    }
    try {
        return {
            id: apiData.id,
            userId: null,
            userName: apiData.user.name || 'System / Unknown',
            userRole: apiData.user.roles[0]?.display_name || 'N/A',
            exportFrom: apiData.exported_from || 'N/A',
            fileName: apiData.file_name,
            reason: apiData.reason,
            exportDate: new Date(apiData.created_at),
            profile_pic_path: apiData.user.profile_pic_path,
        }
    } catch (error) {
        console.error('Error transforming API data for ID:', apiData.id, error)
        return null
    }
}

// --- Reusable ActionColumn Component (No changes needed) ---
const ActionColumn = ({ data }: { data: ExportMappingItem }) => {
    const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false)
    const openViewDrawer = () => setIsViewDrawerOpen(true)
    const closeViewDrawer = () => setIsViewDrawerOpen(false)

    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
            <Tooltip title="View Record">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={openViewDrawer}
                    onKeyDown={(e) => e.key === 'Enter' && openViewDrawer()}
                >
                    <IoEyeOutline />
                </div>
            </Tooltip>

            <Drawer
                title="Export Mapping Details"
                isOpen={isViewDrawerOpen}
                onClose={closeViewDrawer}
                onRequestClose={closeViewDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={closeViewDrawer}
                            type="button"
                        >
                            Close
                        </Button>
                    </div>
                }
            >
                <div className="px-1">
                    <h6 className="text-base font-semibold">Exported By</h6>
                    <figure className="flex gap-2 items-center mt-2">
                        <img
                           src={data.profile_pic_path || userIconPlaceholder}
                            alt={data.userName}
                            className="h-9 w-9 rounded-full"
                        />
                        <figcaption className="flex flex-col">
                            <span className="font-semibold text-black dark:text-white">
                                {data.userName}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                {data.userRole}
                            </span>
                        </figcaption>
                    </figure>

                    <h6 className="text-base font-semibold mt-4">
                        Exported From
                    </h6>
                    <p className="mb-2 mt-1">
                        <span className="font-semibold text-black dark:text-white">
                            Module:{' '}
                        </span>
                        <span>{data.exportFrom}</span>
                    </p>
                    {data.exportFrom !== 'N/A' && (
                        <Tag className="border border-emerald-600 text-emerald-600 bg-transparent inline-block w-auto mt-1">
                            {data.exportFrom}
                        </Tag>
                    )}

                    <Card className="!mt-8 bg-gray-100 dark:bg-gray-700 border-none">
                        <h6 className="text-base font-semibold">
                            Exported Log
                        </h6>
                        <p className="mt-2">
                            <span className="font-semibold text-black dark:text-white">
                                Date:{' '}
                            </span>
                            <span>
                                {!isNaN(data.exportDate.getTime())
                                    ? data.exportDate.toLocaleDateString(
                                          undefined,
                                          {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          },
                                      )
                                    : 'Invalid Date'}
                            </span>
                        </p>
                        <p className="mt-1">
                            <span className="font-semibold text-black dark:text-white">
                                File Name:{' '}
                            </span>
                            <span className="break-all">{data.fileName}</span>
                        </p>
                        {data.reason && (
                            <>
                                <h6 className="text-sm font-semibold text-black dark:text-white mt-2">
                                    Reason:
                                </h6>
                                <p className="whitespace-pre-wrap text-justify">
                                    {data.reason}
                                </p>
                            </>
                        )}
                    </Card>
                </div>
            </Drawer>
        </div>
    )
}
ActionColumn.displayName = 'ActionColumn'

// --- ExportMappingTableTools Component (Modified) ---
type ExportMappingFilterSchema = {
    userRole: string[]
    exportFrom: string[]
    fileExtensions: string[]
    exportDate: [Date | null, Date | null] | null
}

const ExportMappingTableTools = ({
    columns,
    filteredColumns,
    setFilteredColumns,
    onSearchChange,
    allExportMappings,
    onApplyFilters,
    onClearFilters,
    onExport,
    isDataReady,
}: {
    columns: ColumnDef<ExportMappingItem>[]
    filteredColumns: ColumnDef<ExportMappingItem>[]
    setFilteredColumns: React.Dispatch<
        React.SetStateAction<ColumnDef<ExportMappingItem>[]>
    >
    onSearchChange: (query: string) => void
    allExportMappings: ExportMappingItem[]
    onApplyFilters: (filters: Partial<ExportMappingFilterSchema>) => void
    onClearFilters: () => void
    onExport: () => void
    isDataReady: boolean
}) => {
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false)
    const openFilterDrawer = () => setIsFilterDrawerOpen(true)

    const { control, handleSubmit, reset } = useForm<ExportMappingFilterSchema>(
        {
            defaultValues: {
                userRole: [],
                exportFrom: [],
                fileExtensions: [],
                exportDate: null,
            },
        },
    )

    const exportFiltersSubmitHandler = (data: ExportMappingFilterSchema) => {
        onApplyFilters(data)
        closeFilterDrawer()
    }

    const handleClearFormInDrawer = () => {
        reset({
            userRole: [],
            exportFrom: [],
            fileExtensions: [],
            exportDate: null,
        })
        onApplyFilters({})
        closeFilterDrawer()
    }

    const userRoles = useMemo(() => {
        if (!isDataReady || !allExportMappings || allExportMappings.length === 0)
            return []
        const roles = new Set(
            allExportMappings.map((item) => item.userRole).filter(Boolean),
        )
        return Array.from(roles)
            .sort()
            .map((role) => ({ value: role, label: role }))
    }, [allExportMappings, isDataReady])

    const exportFromOptions = useMemo(() => {
        if (!isDataReady || !allExportMappings || allExportMappings.length === 0)
            return []
        const froms = new Set(
            allExportMappings.map((item) => item.exportFrom).filter(Boolean),
        )
        return Array.from(froms)
            .sort()
            .map((from) => ({ value: from, label: from }))
    }, [allExportMappings, isDataReady])

    const fileExtensionsOptions = useMemo(
        () => [
            { value: '.csv', label: 'CSV (.csv)' },
            { value: '.xlsx', label: 'Excel (.xlsx)' },
            { value: '.json', label: 'JSON (.json)' },
            { value: '.pdf', label: 'PDF (.pdf)' },
            { value: '.log', label: 'Log (.log)' },
            { value: '.bak', label: 'Backup (.bak)' },
        ],
        [],
    )

    const toggleColumn = (checked: boolean, colHeader: string) => {
        if (checked) {
            // Re-add the column, preserving the original order
            setFilteredColumns((currentCols) => {
                const newVisibleHeaders = [
                    ...currentCols.map((c) => c.header as string),
                    colHeader,
                ]
                return columns.filter((c) =>
                    newVisibleHeaders.includes(c.header as string),
                )
            })
        } else {
            // Remove the column
            setFilteredColumns((currentCols) =>
                currentCols.filter((c) => c.header !== colHeader),
            )
        }
    }

    const isColumnVisible = (header: string) =>
        filteredColumns.some((c) => c.header === header)

    return (
        <div className="md:flex items-center justify-between w-full gap-2">
            <div className="flex-grow mb-2 md:mb-0">
                <DebouceInput
                    placeholder="Quick Search..."
                    suffix={<TbSearch className="text-lg" />}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        onSearchChange(e.target.value)
                    }
                />
            </div>
            <div className="flex gap-2">
                <Dropdown
                    renderTitle={
                        <Button title="Filter Columns" icon={<TbColumns />} />
                    }
                    placement="bottom-end"
                >
                    <div className="flex flex-col p-2">
                        <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {columns.map(
                            (col) =>
                                col.header && (
                                    <div
                                        key={col.header as string}
                                        className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"
                                    >
                                        <Checkbox
                                            name={col.header as string}
                                            checked={isColumnVisible(
                                                col.header as string,
                                            )}
                                            onChange={(checked) =>
                                                toggleColumn(
                                                    checked,
                                                    col.header as string,
                                                )
                                            }
                                        />
                                        {col.header}
                                    </div>
                                ),
                        )}
                    </div>
                </Dropdown>
                <Button
                    title="Clear Filters & Reload"
                    icon={<TbReload />}
                    onClick={onClearFilters}
                    disabled={!isDataReady}
                />
                <Button
                    icon={<TbFilter />}
                    onClick={openFilterDrawer}
                    disabled={!isDataReady}
                >
                    Filter
                </Button>
                <Button
                    icon={<TbCloudDownload />}
                    onClick={onExport}
                    disabled={!isDataReady || allExportMappings.length === 0}
                >
                    Export
                </Button>
            </div>
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                bodyClass="flex flex-col overflow-hidden"
                footer={
                    <div className="text-right w-full ">
                        <Button
                            size="sm"
                            className="mr-2"
                            onClick={handleClearFormInDrawer}
                            type="button"
                        >
                            Clear
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            type="submit"
                            form="filterForm"
                        >
                            Apply
                        </Button>
                    </div>
                }
            >
                <Form
                    id="filterForm"
                    size="sm"
                    onSubmit={handleSubmit(exportFiltersSubmitHandler)}
                >
                    <FormItem label="User Role">
                        <Controller
                            control={control}
                            name="userRole"
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select roles"
                                    options={userRoles}
                                    value={userRoles.filter((option) =>
                                        field.value?.includes(option.value),
                                    )}
                                    onChange={(selected) =>
                                        field.onChange(
                                            selected
                                                ? selected.map((opt) => opt.value)
                                                : [],
                                        )
                                    }
                                    isLoading={!isDataReady && userRoles.length === 0}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Exported From (Module)">
                        <Controller
                            control={control}
                            name="exportFrom"
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select modules"
                                    options={exportFromOptions}
                                    value={exportFromOptions.filter((option) =>
                                        field.value?.includes(option.value),
                                    )}
                                    onChange={(selected) =>
                                        field.onChange(
                                            selected
                                                ? selected.map((opt) => opt.value)
                                                : [],
                                        )
                                    }
                                    isLoading={
                                        !isDataReady && exportFromOptions.length === 0
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="File Type (Extension)">
                        <Controller
                            control={control}
                            name="fileExtensions"
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    placeholder="Select file types"
                                    options={fileExtensionsOptions}
                                    value={fileExtensionsOptions.filter((option) =>
                                        field.value?.includes(option.value),
                                    )}
                                    onChange={(selected) =>
                                        field.onChange(
                                            selected
                                                ? selected.map((opt) => opt.value)
                                                : [],
                                        )
                                    }
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem label="Export Date Range">
                        <Controller
                            control={control}
                            name="exportDate"
                            render={({ field }) => (
                                <DatePicker.DatePickerRange
                                    placeholder="Select date range"
                                    value={field.value ?? undefined}
                                    onChange={(dateRange) =>
                                        field.onChange(dateRange)
                                    }
                                    inputFormat="MM/DD/YYYY"
                                />
                            )}
                        />
                    </FormItem>
                </Form>
            </Drawer>
        </div>
    )
}
ExportMappingTableTools.displayName = 'ExportMappingTableTools'

// --- RESTORED COMPONENT: ActiveFiltersDisplay ---
const ActiveFiltersDisplay = ({
    filterData,
    onRemoveFilter,
    onClearAll,
}: {
    filterData: Partial<ExportMappingFilterSchema>
    onRemoveFilter: (
        key: keyof ExportMappingFilterSchema,
        value: string,
    ) => void
    onClearAll: () => void
}) => {
    const activeRoles = filterData.userRole || []
    const activeModules = filterData.exportFrom || []
    const activeExtensions = filterData.fileExtensions || []
    const activeDateRange = filterData.exportDate

    const formatDate = (date: Date | null) => {
        if (!date) return ''
        return new Date(date).toLocaleDateString()
    }

    const hasActiveFilters =
        activeRoles.length > 0 ||
        activeModules.length > 0 ||
        activeExtensions.length > 0 ||
        (activeDateRange && (activeDateRange[0] || activeDateRange[1]))

    if (!hasActiveFilters) {
        return null
    }

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4  border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2 ">
                Active Filters:
            </span>
            {activeRoles.map((role) => (
                <Tag
                    key={`role-${role}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    Role: {role}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('userRole', role)}
                    />
                </Tag>
            ))}
            {activeModules.map((module) => (
                <Tag
                    key={`module-${module}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    Module: {module}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('exportFrom', module)}
                    />
                </Tag>
            ))}
            {activeExtensions.map((ext) => (
                <Tag
                    key={`ext-${ext}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    Type: {ext}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('fileExtensions', ext)}
                    />
                </Tag>
            ))}
            {activeDateRange && (activeDateRange[0] || activeDateRange[1]) && (
                <Tag
                    key="date-range-filter"
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    Date: {formatDate(activeDateRange[0])} -{' '}
                    {formatDate(activeDateRange[1])}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('exportDate', '')} // Value doesn't matter for date removal
                    />
                </Tag>
            )}

            {hasActiveFilters && (
                <Button
                    size="xs"
                    variant="plain"
                    className="text-red-600 hover:text-red-500 hover:underline ml-auto"
                    onClick={onClearAll}
                >
                    Clear All
                </Button>
            )}
        </div>
    )
}

// --- Main ExportMapping Component (Heavily Modified) ---
const ExportMapping = () => {
    const dispatch = useAppDispatch()
    const csvLinkRef = useRef<any>(null)

    const [exportMappings, setExportMappings] = useState<ExportMappingItem[]>([])
    const { apiExportMappings = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)

    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false)
    const [isSubmittingExportReason, setIsSubmittingExportReason] =
        useState(false)
    const [
        exportData,
        setExportData,
    ] = useState<{ data: any[]; filename: string }>({
        data: [],
        filename: '',
    })

    const exportReasonFormMethods = useForm<ExportReasonFormData>({
        resolver: zodResolver(exportReasonSchema),
        defaultValues: { reason: '' },
        mode: 'onChange',
    })

    useEffect(() => {
        dispatch(getExportMappingsAction())
    }, [dispatch])

    useEffect(() => {
        if (masterLoadingStatus === 'idle') {
            const transformedData = (
                apiExportMappings?.data as ApiExportMapping[]
            )
                ?.map(transformApiDataToExportMappingItem)
                .filter((item): item is ExportMappingItem => item !== null)
            setExportMappings(transformedData)
        } else if (masterLoadingStatus === 'failed') {
            toast.push(
                <Notification
                    title="Failed to Load Data"
                    type="danger"
                    duration={4000}
                >
                    There was an error fetching the export logs.
                </Notification>,
            )
            setExportMappings([])
        }
    }, [apiExportMappings?.data, masterLoadingStatus])

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })

    const [
        activeFilters,
        setActiveFilters,
    ] = useState<Partial<ExportMappingFilterSchema>>({})

    const tableLoading = masterLoadingStatus === 'loading'
    const isDataReady = masterLoadingStatus === 'idle'

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        if (!isDataReady) {
            return { pageData: [], total: 0, allFilteredAndSortedData: [] }
        }
        let processedData = [...exportMappings]

        // Filtering logic
        if (activeFilters.userRole && activeFilters.userRole.length > 0) {
            const roles = new Set(activeFilters.userRole)
            processedData = processedData.filter((item) =>
                roles.has(item.userRole),
            )
        }
        if (activeFilters.exportFrom && activeFilters.exportFrom.length > 0) {
            const froms = new Set(activeFilters.exportFrom)
            processedData = processedData.filter((item) =>
                froms.has(item.exportFrom),
            )
        }
        if (
            activeFilters.fileExtensions &&
            activeFilters.fileExtensions.length > 0
        ) {
            const extensions = new Set(
                activeFilters.fileExtensions.map((ext) => ext.toLowerCase()),
            )
            processedData = processedData.filter((item) => {
                if (!item.fileName) return false
                const fileExt = item.fileName
                    .slice(item.fileName.lastIndexOf('.'))
                    .toLowerCase()
                return extensions.has(fileExt)
            })
        }
        if (activeFilters.exportDate) {
            const [startDate, endDate] = activeFilters.exportDate
            processedData = processedData.filter((item) => {
                if (isNaN(item.exportDate.getTime())) return false
                const itemTime = item.exportDate.getTime()
                const start = startDate
                    ? new Date(new Date(startDate).setHours(0, 0, 0, 0)).getTime()
                    : null
                const end = endDate
                    ? new Date(
                          new Date(endDate).setHours(23, 59, 59, 999),
                      ).getTime()
                    : null
                if (start && end) return itemTime >= start && itemTime <= end
                if (start) return itemTime >= start
                if (end) return itemTime <= end
                return true
            })
        }

        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (item) =>
                    item.id.toString().includes(query) ||
                    item.userName.toLowerCase().includes(query) ||
                    item.userRole.toLowerCase().includes(query) ||
                    item.exportFrom.toLowerCase().includes(query) ||
                    (item.fileName &&
                        item.fileName.toLowerCase().includes(query)) ||
                    (item.reason && item.reason.toLowerCase().includes(query)),
            )
        }

        // Sorting logic
        const { order, key } = tableData.sort as OnSortParam
        if (
            order &&
            key &&
            processedData.length > 0 &&
            processedData[0].hasOwnProperty(key)
        ) {
            processedData.sort((a, b) => {
                let aValue = a[key as keyof ExportMappingItem]
                let bValue = b[key as keyof ExportMappingItem]

                if (key === 'exportDate') {
                    const timeA = !isNaN((aValue as Date)?.getTime())
                        ? (aValue as Date).getTime()
                        : order === 'asc'
                        ? Infinity
                        : -Infinity
                    const timeB = !isNaN((bValue as Date)?.getTime())
                        ? (bValue as Date).getTime()
                        : order === 'asc'
                        ? Infinity
                        : -Infinity
                    return order === 'asc' ? timeA - timeB : timeB - timeA
                }
                if (
                    key === 'id' &&
                    typeof aValue === 'number' &&
                    typeof bValue === 'number'
                ) {
                    return order === 'asc' ? aValue - bValue : bValue - aValue
                }

                aValue =
                    aValue === null || aValue === undefined
                        ? ''
                        : String(aValue).toLowerCase()
                bValue =
                    bValue === null || bValue === undefined
                        ? ''
                        : String(bValue).toLowerCase()
                return order === 'asc'
                    ? (aValue as string).localeCompare(bValue as string)
                    : (bValue as string).localeCompare(aValue as string)
            })
        }

        const dataTotal = processedData.length
        const allDataForExport = [...processedData]

        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return {
            pageData: dataForPage,
            total: dataTotal,
            allFilteredAndSortedData: allDataForExport,
        }
    }, [exportMappings, tableData, activeFilters, isDataReady])

    useEffect(() => {
        if (
            exportData.data.length > 0 &&
            exportData.filename &&
            csvLinkRef.current
        ) {
            csvLinkRef.current.link.click()
            setExportData({ data: [], filename: '' })
        }
    }, [exportData])

    const handleSetTableData = useCallback(
        (
            data:
                | Partial<TableQueries>
                | ((prevState: TableQueries) => TableQueries),
        ) => {
            setTableData((prev) =>
                typeof data === 'function' ? data(prev) : { ...prev, ...data },
            )
        },
        [],
    )

    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData],
    )
    const handleSelectChange = useCallback(
        (value: number) => {
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 })
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
    const handleApplyFilters = useCallback(
        (filters: Partial<ExportMappingFilterSchema>) => {
            setActiveFilters(filters)
            handleSetTableData({ pageIndex: 1 })
        },
        [handleSetTableData],
    )

    // --- HANDLERS FOR ActiveFiltersDisplay ---
    const handleRemoveFilter = useCallback(
        (key: keyof ExportMappingFilterSchema, value: string) => {
            setActiveFilters((prev) => {
                const newFilters = { ...prev }
                if (key === 'exportDate') {
                    delete newFilters.exportDate
                    return newFilters
                }
                const currentValues = prev[key] as string[] | undefined
                if (!currentValues) return prev

                const newValues = currentValues.filter((item) => item !== value)
                if (newValues.length > 0) {
                    ;(newFilters as any)[key] = newValues
                } else {
                    delete newFilters[key]
                }
                return newFilters
            })
            handleSetTableData({ pageIndex: 1 })
        },
        [handleSetTableData],
    )

    const handleClearAllFilters = useCallback(() => {
        setActiveFilters({})
        handleSetTableData({ pageIndex: 1 })
    }, [handleSetTableData])
    
    // --- RELOAD BUTTON HANDLER ---
    const onClearFiltersAndReload = () => {
        setActiveFilters({})
        setTableData((prev) => ({ ...prev, pageIndex: 1, query: '' }))
        dispatch(getExportMappingsAction())
    }

    const handleOpenExportReasonModal = () => {
        if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
            toast.push(
                <Notification title="No Data" type="info">
                    There is no data to export.
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
        const moduleName = 'Export Mapping Log'
        const timestamp = new Date().toISOString().split('T')[0]
        const fileName = `export_mappings_log_${timestamp}.csv`

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

            const dataToExport = allFilteredAndSortedData.map((item) => ({
                id: item.id,
                userName: item.userName,
                userRole: item.userRole,
                exportFrom: item.exportFrom,
                fileName: item.fileName,
                reason: item.reason || '',
                exportDate: !isNaN(item.exportDate.getTime())
                    ? item.exportDate.toISOString()
                    : 'Invalid Date',
            }))

            setExportData({ data: dataToExport, filename: fileName })
            setIsExportReasonModalOpen(false)
            dispatch(getExportMappingsAction())
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

    const csvHeaders = useMemo(
        () => [
            { label: 'Record ID', key: 'id' },
            { label: 'User Name', key: 'userName' },
            { label: 'User Role', key: 'userRole' },
            { label: 'Exported From Module', key: 'exportFrom' },
            { label: 'File Name', key: 'fileName' },
            { label: 'Reason', key: 'reason' },
            { label: 'Export Date (UTC)', key: 'exportDate' },
        ],
        [],
    )

    const columns: ColumnDef<ExportMappingItem>[] = useMemo(
        () => [
            {
                header: 'Exported By',
                accessorKey: 'userName',
                enableSorting: true,
                size: 200,
                cell: (props) => {
                    const { userName, userRole ,profile_pic_path } = props.row.original
                    return (
                        <div className="flex items-center gap-2">
                            <img
                                src={profile_pic_path || userIconPlaceholder}
                                alt={userName}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                                <span className="font-semibold block truncate max-w-[150px]">
                                    {userName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                                    {userRole}
                                </span>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Exported From',
                accessorKey: 'exportFrom',
                enableSorting: true,
                size: 220,
                cell: (props) => {
                    const { exportFrom, fileName } = props.row.original
                    return (
                        <div className="flex flex-col">
                            <span className="font-semibold truncate max-w-[180px]">
                                {exportFrom}
                            </span>
                            <Tooltip title={fileName} placement="top">
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px] block">
                                    {fileName || 'N/A'}
                                </span>
                            </Tooltip>
                        </div>
                    )
                },
            },
            {
                header: 'Reason',
                accessorKey: 'reason',
                enableSorting: false,
                size: 250,
                cell: (props) => (
                    <Tooltip
                        title={props.row.original.reason || ''}
                        placement="top"
                    >
                        <span className="truncate block max-w-[230px] text-justify">
                            {props.row.original.reason || '–'}
                        </span>
                    </Tooltip>
                ),
            },
            {
                header: 'Date',
                accessorKey: 'exportDate',
                enableSorting: true,
                size: 220,
                cell: (props) => {
                    const date = new Date(props.row.original.exportDate)
                    return (
                        <span className="text-sm">
                            {!isNaN(date.getTime())
                                ? `${date.getDate()} ${date.toLocaleString('en-US', {
                                      month: 'short',
                                  })} ${date.getFullYear()}, ${date.toLocaleTimeString(
                                      'en-US',
                                      {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          hour12: true,
                                      },
                                  )}`
                                : 'Invalid Date'}
                        </span>
                    )
                },
            },

            {
                header: 'Action',
                id: 'action',
                size: 80,
                meta: { cellClass: 'text-center' },
                cell: (props) => <ActionColumn data={props.row.original} />,
            },
        ],
        [],
    )
    const [filteredColumns, setFilteredColumns] = useState(columns)
    
    // Reset filtered columns when the base columns definition changes
    useEffect(() => {
        setFilteredColumns(columns)
    }, [columns])

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard
                    className="h-full"
                    bodyClass="h-full flex flex-col"
                >
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Export Mapping Log</h5>
                    </div>
                    <div className="grid grid-cols-4 mb-4 gap-2">
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-blue-200"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                                <TbCloudUpload size={24} />
                            </div>
                            <div>
                                <h6 className="text-blue-500">
                                    {apiExportMappings?.counts?.total}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Total Exports
                                </span>
                            </div>
                        </Card>
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-violet-300"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                                <TbCalendarUp size={24} />
                            </div>
                            <div>
                                <h6 className="text-violet-500">
                                    {apiExportMappings?.counts?.today}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Exports Today
                                </span>
                            </div>
                        </Card>
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-pink-200"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                                <TbUserUp size={24} />
                            </div>
                            <div>
                                <h6 className="text-pink-500">
                                    {apiExportMappings?.counts?.top_user}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Top User
                                </span>
                            </div>
                        </Card>
                        <Card
                            bodyClass="flex gap-2 p-2"
                            className="rounded-md border border-green-200"
                        >
                            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                                <TbBookUpload size={24} />
                            </div>
                            <div>
                                <h6 className="text-green-500">
                                    {apiExportMappings?.counts?.top_module}
                                </h6>
                                <span className="font-semibold text-xs">
                                    Top Module
                                </span>
                            </div>
                        </Card>
                    </div>
                    <div className="mb-4">
                        <ExportMappingTableTools
                            columns={columns}
                            filteredColumns={filteredColumns}
                            setFilteredColumns={setFilteredColumns}
                            onSearchChange={handleSearchChange}
                            allExportMappings={exportMappings}
                            onApplyFilters={handleApplyFilters}
                            onClearFilters={onClearFiltersAndReload}
                            onExport={handleOpenExportReasonModal}
                            isDataReady={isDataReady}
                        />
                    </div>

                    {/* RENDER THE ActiveFiltersDisplay COMPONENT */}
                    <ActiveFiltersDisplay
                        filterData={activeFilters}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                    />

                    <div className="flex-grow overflow-auto">
                        <DataTable
                            columns={filteredColumns}
                            data={pageData}
                            loading={tableLoading}
                            pagingData={{
                                total: total,
                                pageIndex: tableData.pageIndex as number,
                                pageSize: tableData.pageSize as number,
                            }}
                            onPaginationChange={handlePaginationChange}
                            onSelectChange={handleSelectChange}
                            onSort={handleSort}
                        />
                    </div>
                </AdaptiveCard>

                <CSVLink
                    ref={csvLinkRef}
                    data={exportData.data}
                    headers={csvHeaders}
                    filename={exportData.filename}
                    className="hidden"
                    uFEFF={true}
                />
            </Container>

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
                    isSubmittingExportReason ? 'Submitting...' : 'Submit & Export'
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
        </>
    )
}

export default ExportMapping