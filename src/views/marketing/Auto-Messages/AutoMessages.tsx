// src/views/your-path/AutoMessages.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar' // Keep if needed
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Checkbox from '@/components/ui/Checkbox'
import { Form, FormItem as UiFormItem } from '@/components/ui/Form'
import Badge from '@/components/ui/Badge'
import { TbMessageChatbot, TbFilter, TbX, TbCloudUpload } from 'react-icons/tb' // Icons

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
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
export type MessageTemplateItem = {
    id: string
    name: string
    type: 'SMS' | 'PushNotification' | 'InApp' | 'Webhook' | 'Other' // Channel/Type
    triggerEvent: string // e.g., 'order_shipped', 'user_registered', 'appointment_reminder'
    status: 'active' | 'inactive' | 'draft'
    createdDate: Date
}
// --- End Item Type ---

// --- Define Filter Schema ---
const filterValidationSchema = z.object({
    type: z.array(z.string()).default([]), // Filter by type/channel
    status: z.array(z.string()).default([]), // Filter by status
})

type FilterFormSchema = z.infer<typeof filterValidationSchema>
// --- End Filter Schema ---

// --- Constants ---
const templateStatusColor: Record<MessageTemplateItem['status'], string> = {
    active: 'text-green-600 bg-green-200',
    inactive: 'text-red-600 bg-red-200',
    draft: 'text-blue-600 bg-blue-200',
}

// Optional: Tag colors for message types
const messageTypeColor: Record<MessageTemplateItem['type'], string> = {
    SMS: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100 text-[10px]',
    PushNotification:
        'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-100 text-[10px]',
    InApp: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-100 text-[10px]',
    Webhook:
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100 text-[10px]',
    Other: 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-100 text-[10px]',
}

const initialDummyMessageTemplates: MessageTemplateItem[] = [
    {
        id: 'AMT001',
        name: 'SMS - Appointment Reminder (24hr)',
        type: 'SMS',
        triggerEvent: 'appointment_scheduled',
        status: 'active',
        createdDate: new Date(2023, 9, 10),
    },
    {
        id: 'AMT002',
        name: 'Push - Order Shipped',
        type: 'PushNotification',
        triggerEvent: 'order_shipped',
        status: 'active',
        createdDate: new Date(2023, 8, 15),
    },
    {
        id: 'AMT003',
        name: 'InApp - Welcome Tour Step 1',
        type: 'InApp',
        triggerEvent: 'user_registered',
        status: 'draft',
        createdDate: new Date(2023, 10, 1),
    },
    {
        id: 'AMT004',
        name: 'Webhook - New Lead Notification',
        type: 'Webhook',
        triggerEvent: 'lead_created',
        status: 'active',
        createdDate: new Date(2023, 7, 25),
    },
    {
        id: 'AMT005',
        name: 'SMS - Password Reset Code',
        type: 'SMS',
        triggerEvent: 'password_reset_request',
        status: 'active',
        createdDate: new Date(2023, 5, 1),
    },
    {
        id: 'AMT006',
        name: 'Push - Abandoned Cart (1hr)',
        type: 'PushNotification',
        triggerEvent: 'cart_abandoned',
        status: 'inactive',
        createdDate: new Date(2023, 9, 5),
    },
    {
        id: 'AMT007',
        name: 'InApp - Feature Announcement',
        type: 'InApp',
        triggerEvent: 'manual_send',
        status: 'active',
        createdDate: new Date(2023, 10, 8),
    },
    {
        id: 'AMT008',
        name: 'Other - Slack Integration Alert',
        type: 'Other',
        triggerEvent: 'support_ticket_high_priority',
        status: 'draft',
        createdDate: new Date(2023, 10, 9),
    },
]

// Extract unique types and statuses for filter options
const uniqueTypes = Array.from(
    new Set(initialDummyMessageTemplates.map((t) => t.type)),
).sort()
const uniqueStatuses = Array.from(
    new Set(initialDummyMessageTemplates.map((t) => t.status)),
).sort()
// --- End Constants ---

// --- ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone,
    onChangeStatus,
    onDelete,
}: {
    onEdit: () => void
    onClone?: () => void
    onChangeStatus: () => void
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'
    return (
        <div className="flex items-center justify-center">
            {/* {onClone && (
                <Tooltip title="Clone Template">
                    <div
                        className={classNames(
                            iconButtonClass,
                            hoverBgClass,
                            'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                        )}
                        role="button"
                        onClick={onClone}
                    >
                        <TbCopy />
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
                    <TbSwitchHorizontal />
                </div>
            </Tooltip>
            <Tooltip title="Edit Template">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete Template">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400',
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

// --- TemplateTable Component ---
const TemplateTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedTemplates,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<MessageTemplateItem>[]
    data: MessageTemplateItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedTemplates: MessageTemplateItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: MessageTemplateItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<MessageTemplateItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedTemplates.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
            noData={!loading && data.length === 0}
        />
    )
}
// --- End TemplateTable ---

// --- TemplateSearch Component ---
type TemplateSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const TemplateSearch = React.forwardRef<HTMLInputElement, TemplateSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Quick Search..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
TemplateSearch.displayName = 'TemplateSearch'
// --- End TemplateSearch ---

// --- TemplateFilter Component ---
const TemplateFilter = ({
    filterData,
    setFilterData,
}: {
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
}) => {
    const [dialogIsOpen, setIsOpen] = useState(false)
    const openDialog = () => setIsOpen(true)
    const onDialogClose = () => setIsOpen(false)

    const { control, handleSubmit, reset } = useForm<FilterFormSchema>({
        defaultValues: filterData,
        resolver: zodResolver(filterValidationSchema),
    })

    React.useEffect(() => {
        reset(filterData)
    }, [filterData, reset])

    const onSubmit = (values: FilterFormSchema) => {
        setFilterData(values)
        onDialogClose()
    }
    const handleReset = () => {
        const defaultVals = filterValidationSchema.parse({})
        reset(defaultVals)
        setFilterData(defaultVals)
        onDialogClose()
    }
    const activeFilterCount =
        (filterData.type?.length || 0) + (filterData.status?.length || 0)

    return (
        <>
            <Button
                icon={<TbFilter />}
                onClick={openDialog}
                className="relative"
            >
                <span>Filter</span>{' '}
                {activeFilterCount > 0 && (
                    <Badge
                        content={activeFilterCount}
                        className="absolute -top-2 -right-2"
                        innerClass="text-xs"
                    />
                )}
            </Button>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h4 className="mb-4">Filter Message Templates</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <UiFormItem label="Type / Channel" className="mb-4">
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    value={field.value || []}
                                    onChange={field.onChange}
                                >
                                    {uniqueTypes.map((type) => (
                                        <Checkbox
                                            key={type}
                                            value={type}
                                            className="mb-1"
                                        >
                                            {type
                                                .replace(/([A-Z])/g, ' $1')
                                                .trim()}
                                        </Checkbox>
                                    ))}{' '}
                                    {/* Add spaces */}
                                </Checkbox.Group>
                            )}
                        />
                    </UiFormItem>
                    <UiFormItem label="Status">
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    value={field.value || []}
                                    onChange={field.onChange}
                                >
                                    {uniqueStatuses.map((stat) => (
                                        <Checkbox
                                            key={stat}
                                            value={stat}
                                            className="mb-1 capitalize"
                                        >
                                            {stat}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </UiFormItem>
                    <div className="flex justify-end items-center gap-2 mt-6">
                        <Button type="button" onClick={handleReset}>
                            {' '}
                            Reset{' '}
                        </Button>
                        <Button type="submit" variant="solid">
                            {' '}
                            Apply Filters{' '}
                        </Button>
                    </div>
                </Form>
            </Dialog>
        </>
    )
}
// --- End TemplateFilter ---

// --- TemplateTableTools Component ---
const TemplateTableTools = ({
    onSearchChange,
    filterData,
    setFilterData,
}: {
    onSearchChange: (query: string) => void
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <div className="flex-grow">
                <TemplateSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex-shrink-0">
                <TemplateFilter
                    filterData={filterData}
                    setFilterData={setFilterData}
                />
            </div>
            <Button icon={<TbCloudUpload/>}>Export</Button>

        </div>
    )
}
// --- End TemplateTableTools ---

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({
    filterData,
    onRemoveFilter,
    onClearAll,
}: {
    filterData: FilterFormSchema
    onRemoveFilter: (key: keyof FilterFormSchema, value: string) => void
    onClearAll: () => void
}) => {
    const activeTypes = filterData.type || []
    const activeStatuses = filterData.status || []
    const hasActiveFilters = activeTypes.length > 0 || activeStatuses.length > 0

    if (!hasActiveFilters) return null

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
                Active Filters:
            </span>
            {activeTypes.map((type) => (
                <Tag
                    key={`type-${type}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    {' '}
                    {type.replace(/([A-Z])/g, ' $1').trim()}{' '}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('type', type)}
                    />{' '}
                </Tag>
            ))}
            {activeStatuses.map((stat) => (
                <Tag
                    key={`stat-${stat}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    {' '}
                    <span className="capitalize">{stat}</span>{' '}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('status', stat)}
                    />{' '}
                </Tag>
            ))}
            <Button
                size="xs"
                variant="plain"
                className="text-red-600 hover:text-red-500 hover:underline ml-auto"
                onClick={onClearAll}
            >
                {' '}
                Clear All{' '}
            </Button>
        </div>
    )
}
// --- End ActiveFiltersDisplay ---

// --- TemplateActionTools Component ---
const TemplateActionTools = ({
    allTemplates,
}: {
    allTemplates: MessageTemplateItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allTemplates.map((t) => ({
                id: t.id,
                name: t.name,
                type: t.type,
                triggerEvent: t.triggerEvent,
                status: t.status,
                createdDate: t.createdDate?.toISOString() ?? '',
            })),
        [allTemplates],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Type', key: 'type' },
        { label: 'Trigger Event', key: 'triggerEvent' },
        { label: 'Status', key: 'status' },
        { label: 'Created Date', key: 'createdDate' },
    ]
    const handleAdd = () => navigate('/message-templates/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={handleAdd}
                block
            >
                {' '}
                Add New{' '}
            </Button>{' '}
        </div>
    )
}
// --- End TemplateActionTools ---

// --- TemplateSelected Component ---
const TemplateSelected = ({
    selectedTemplates,
    setSelectedTemplates,
    onDeleteSelected,
}: {
    selectedTemplates: MessageTemplateItem[]
    setSelectedTemplates: React.Dispatch<
        React.SetStateAction<MessageTemplateItem[]>
    >
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedTemplates.length === 0) return null

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
                                {selectedTemplates.length}
                            </span>
                            <span>
                                Template
                                {selectedTemplates.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedTemplates.length} Template${selectedTemplates.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected template
                    {selectedTemplates.length > 1 ? 's' : ''}? This action
                    cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End TemplateSelected ---

// --- Main AutoMessages Component ---
const AutoMessages = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [templates, setTemplates] = useState<MessageTemplateItem[]>(
        initialDummyMessageTemplates,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedTemplates, setSelectedTemplates] = useState<
        MessageTemplateItem[]
    >([])
    const [filterData, setFilterData] = useState<FilterFormSchema>(
        filterValidationSchema.parse({}),
    )
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...templates]

        // Apply Filtering
        if (filterData.type && filterData.type.length > 0) {
            const typeSet = new Set(filterData.type)
            processedData = processedData.filter((t) => typeSet.has(t.type))
        }
        if (filterData.status && filterData.status.length > 0) {
            const statusSet = new Set(filterData.status)
            processedData = processedData.filter((t) => statusSet.has(t.status))
        }

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (t) =>
                    t.id.toLowerCase().includes(query) ||
                    t.name.toLowerCase().includes(query) ||
                    t.type.toLowerCase().includes(query) ||
                    t.triggerEvent.toLowerCase().includes(query) ||
                    t.status.toLowerCase().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'createdDate' && a.createdDate && b.createdDate) {
                    return order === 'asc'
                        ? a.createdDate.getTime() - b.createdDate.getTime()
                        : b.createdDate.getTime() - a.createdDate.getTime()
                }
                const aValue = a[key as keyof MessageTemplateItem] ?? ''
                const bValue = b[key as keyof MessageTemplateItem] ?? ''
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
    }, [templates, tableData, filterData])
    // --- End Data Processing ---

    // --- Handlers ---
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
            setSelectedTemplates([])
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
    const handleApplyFilter = useCallback(
        (newFilterData: FilterFormSchema) => {
            setFilterData(newFilterData)
            handleSetTableData({ ...tableData, pageIndex: 1 })
            setSelectedTemplates([])
        },
        [tableData, handleSetTableData],
    )

    const handleRemoveFilter = useCallback(
        (key: keyof FilterFormSchema, value: string) => {
            setFilterData((prev) => {
                const currentValues = prev[key] || []
                const newValues = currentValues.filter((item) => item !== value)
                const updatedFilterData = { ...prev, [key]: newValues }
                handleSetTableData({ ...tableData, pageIndex: 1 }) // Trigger data refresh
                setSelectedTemplates([])
                return updatedFilterData
            })
        },
        [tableData, handleSetTableData],
    )

    const handleClearAllFilters = useCallback(() => {
        const defaultFilters = filterValidationSchema.parse({})
        setFilterData(defaultFilters)
        handleSetTableData({ ...tableData, pageIndex: 1 })
        setSelectedTemplates([])
    }, [tableData, handleSetTableData])

    const handleRowSelect = useCallback(
        (checked: boolean, row: MessageTemplateItem) => {
            setSelectedTemplates((prev) => {
                if (checked) {
                    return prev.some((t) => t.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((t) => t.id !== row.id)
                }
            })
        },
        [setSelectedTemplates],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<MessageTemplateItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedTemplates((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((t) => t.id))
                    const newSelection = originalRows.filter(
                        (t) => !existingIds.has(t.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((t) => !rowIds.has(t.id))
                }
            })
        },
        [setSelectedTemplates],
    )

    const handleEdit = useCallback(
        (template: MessageTemplateItem) => {
            console.log('Edit message template:', template.id)
            navigate(`/message-templates/edit/${template.id}`)
        },
        [navigate],
    )

    const handleClone = useCallback(
        (templateToClone: MessageTemplateItem) => {
            console.log('Cloning message template:', templateToClone.id)
            const newId = `AMT${Math.floor(Math.random() * 9000) + 1000}`
            const clonedTemplate: MessageTemplateItem = {
                ...templateToClone,
                id: newId,
                name: `${templateToClone.name} (Copy)`,
                status: 'draft',
                createdDate: new Date(),
            }
            setTemplates((prev) => [clonedTemplate, ...prev])
            toast.push(
                <Notification
                    title="Message Template Cloned"
                    type="success"
                    duration={2000}
                />,
            )
        },
        [setTemplates],
    )

    const handleChangeStatus = useCallback(
        (template: MessageTemplateItem) => {
            const statuses: MessageTemplateItem['status'][] = [
                'draft',
                'active',
                'inactive',
            ]
            const currentStatusIndex = statuses.indexOf(template.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
            console.log(
                `Changing status of template ${template.id} to ${newStatus}`,
            )
            setTemplates((current) =>
                current.map((t) =>
                    t.id === template.id ? { ...t, status: newStatus } : t,
                ),
            )
            toast.push(
                <Notification
                    title="Status Changed"
                    type="success"
                    duration={2000}
                >{`Template '${template.name}' status changed to ${newStatus}.`}</Notification>,
            )
        },
        [setTemplates],
    )

    const handleDelete = useCallback(
        (templateToDelete: MessageTemplateItem) => {
            console.log('Deleting message template:', templateToDelete.id)
            setTemplates((current) =>
                current.filter((t) => t.id !== templateToDelete.id),
            )
            setSelectedTemplates((prev) =>
                prev.filter((t) => t.id !== templateToDelete.id),
            )
            toast.push(
                <Notification
                    title="Message Template Deleted"
                    type="success"
                    duration={2000}
                >{`Template '${templateToDelete.name}' deleted.`}</Notification>,
            )
        },
        [setTemplates, setSelectedTemplates],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected message templates:',
            selectedTemplates.map((t) => t.id),
        )
        const selectedIds = new Set(selectedTemplates.map((t) => t.id))
        setTemplates((current) => current.filter((t) => !selectedIds.has(t.id)))
        setSelectedTemplates([])
        toast.push(
            <Notification
                title="Message Templates Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} template(s) deleted.`}</Notification>,
        )
    }, [selectedTemplates, setTemplates, setSelectedTemplates])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<MessageTemplateItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                size: 70,
            },
            { header: 'Message Title', accessorKey: 'name', size: 200, enableSorting: true },
            {
                header: 'Trigger Event',
                id: 'triggerEvent',
                enableSorting: true,
                size: 220,
                cell: (props) => {
                    const { type , triggerEvent } = props.row.original
                    const displayType = type.replace(/([A-Z])/g, ' $1').trim() // Add spaces
                    const displayTrigger = props.row.original.triggerEvent
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return (
                        <div className=''>
                            <span className='font-semibold'>{displayTrigger}</span>
                            <br />
                            <Tag
                                className={`${messageTypeColor[type]} mt-1 inline-block font-semibold border
                                ${messageTypeColor[type].replace('bg-', 'border-').replace('/20', '')}`}
                            >
                                {displayType}
                            </Tag>
                        </div>
                    )
                },
            },
            // {
            //     header: 'Type/Channel',
            //     accessorKey: 'type',
            //     enableSorting: true,
            //     width: 160,
            //     cell: (props) => {
            //         const type = props.row.original.type
            //         const displayType = type.replace(/([A-Z])/g, ' $1').trim() // Add spaces
            //         return (
            //             <Tag
            //                 className={`${messageTypeColor[type]} font-semibold border ${messageTypeColor[type].replace('bg-', 'border-').replace('/20', '')}`}
            //             >
            //                 {displayType}
            //             </Tag>
            //         )
            //     },
            // },
            // {
            //     header: 'Trigger Event',
            //     accessorKey: 'triggerEvent',
            //     enableSorting: true,
            //     cell: (props) => {
            //         const displayTrigger = props.row.original.triggerEvent
            //             .replace(/_/g, ' ')
            //             .replace(/\b\w/g, (l) => l.toUpperCase())
            //         return <span>{displayTrigger}</span>
            //     },
            // },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                size: 100,
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <Tag
                            className={`${templateStatusColor[status]} capitalize`}
                        >
                            {status}
                        </Tag>
                    )
                },
            },
            {
                header: 'Created Date',
                accessorKey: 'createdDate',
                enableSorting: true,
                size: 160,
                cell: (props) => {
                    const date = props.row.original.createdDate
                    return date ? (
                        <span>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    ) : (
                        <span>-</span>
                    )
                },
            },
            {
                header: 'Action',
                id: 'action',
                meta : {HeaderClass : "text-center"},
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
        [handleClone, handleChangeStatus, handleEdit, handleDelete], // Dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Auto Message Templates</h5>
                    <TemplateActionTools allTemplates={templates} />
                </div>

                {/* Tools */}
                <div className="mb-2">
                    <TemplateTableTools
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter}
                    />
                </div>

                {/* Active Filters Display */}
                <ActiveFiltersDisplay
                    filterData={filterData}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                />

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <TemplateTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedTemplates={selectedTemplates}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <TemplateSelected
                selectedTemplates={selectedTemplates}
                setSelectedTemplates={setSelectedTemplates}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default AutoMessages

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
