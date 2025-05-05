// src/views/your-path/AutoEmailListing.tsx (Corrected)

import React, { useState, useMemo, useCallback, Ref, Suspense, lazy } from 'react'
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
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Checkbox from '@/components/ui/Checkbox'
import { Form, FormItem as UiFormItem } from '@/components/ui/Form'
import Badge from '@/components/ui/Badge'
import {
    TbMailForward,
    TbUserCircle,
    TbFilter,
    TbX,
    TbFileText,
    TbCloudUpload,
} from 'react-icons/tb'

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

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
    import('react-csv').then((module) => ({ default: module.CSVLink })),
)
// --- End Lazy Load ---

// --- Define Item Type ---
export type AutoEmailItem = {
    id: string
    emailType: string
    userName: string
    status: 'active' | 'inactive' | 'draft'
    createdDate?: Date
}
// --- End Item Type ---

// --- Define Filter Schema ---
const filterValidationSchema = z.object({
    emailType: z.array(z.string()).default([]),
    status: z.array(z.string()).default([]),
})
type FilterFormSchema = z.infer<typeof filterValidationSchema>
// --- End Filter Schema ---

// --- Constants ---
const templateStatusColor: Record<AutoEmailItem['status'], string> = {
    active: 'text-green-600 bg-green-200',
    inactive: 'text-red-600 bg-red-200',
    draft: 'text-blue-600 bg-blue-200',
}

const initialDummyAutoEmails: AutoEmailItem[] = [
    // (Dummy data remains the same)
    {
        id: 'AE001',
        emailType: 'Welcome Series',
        userName: 'Alice Marketing',
        status: 'active',
        createdDate: new Date(2023, 9, 1),
    },
    {
        id: 'AE002',
        emailType: 'Onboarding Flow - Step 1',
        userName: 'Bob Product',
        status: 'draft',
        createdDate: new Date(2023, 9, 15),
    },
    {
        id: 'AE003',
        emailType: 'Weekly Product Digest',
        userName: 'Alice Marketing',
        status: 'active',
        createdDate: new Date(2023, 8, 20),
    },
    {
        id: 'AE004',
        emailType: 'Abandoned Cart - 1 Hour',
        userName: 'Charlie Sales',
        status: 'active',
        createdDate: new Date(2023, 10, 1),
    },
    {
        id: 'AE005',
        emailType: 'Feature Update Announcement',
        userName: 'Bob Product',
        status: 'inactive',
        createdDate: new Date(2023, 9, 25),
    },
    {
        id: 'AE006',
        emailType: 'Subscription Renewal Reminder',
        userName: 'Finance Team',
        status: 'active',
        createdDate: new Date(2023, 8, 10),
    },
    {
        id: 'AE007',
        emailType: 'Trial Ending Soon',
        userName: 'Charlie Sales',
        status: 'active',
        createdDate: new Date(2023, 10, 5),
    },
    {
        id: 'AE008',
        emailType: 'Internal Team Update',
        userName: 'HR Dept',
        status: 'draft',
        createdDate: new Date(2023, 7, 1),
    },
    {
        id: 'AE009',
        emailType: 'Password Reset Confirmation',
        userName: 'IT Security',
        status: 'active',
        createdDate: new Date(2023, 6, 1),
    },
    {
        id: 'AE010',
        emailType: 'Order Shipped Notification',
        userName: 'Logistics Bot',
        status: 'active',
        createdDate: new Date(2023, 5, 15),
    },
]

const uniqueEmailTypes = Array.from(
    new Set(initialDummyAutoEmails.map((t) => t.emailType)),
).sort()
const uniqueStatuses = Array.from(
    new Set(initialDummyAutoEmails.map((t) => t.status)),
).sort()
// --- End Constants ---

// --- Reusable ActionColumn Component ---
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
    columns: ColumnDef<AutoEmailItem>[]
    data: AutoEmailItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedTemplates: AutoEmailItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: AutoEmailItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<AutoEmailItem>[]) => void
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
        (filterData.emailType?.length || 0) + (filterData.status?.length || 0)

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
                <h4 className="mb-4">Filter Auto Emails</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <UiFormItem label="Email Type" className="mb-4">
                        <Controller
                            name="emailType"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    value={field.value || []}
                                    onChange={field.onChange}
                                >
                                    {uniqueEmailTypes.map((type) => (
                                        <Checkbox
                                            key={type}
                                            value={type}
                                            className="mb-1"
                                        >
                                            {type}
                                        </Checkbox>
                                    ))}
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
    allAutoEmails
}: {
    onSearchChange: (query: string) => void
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
    allAutoEmails: AutoEmailItem[]
}) => {

    // Prepare data for CSV
    const csvData = useMemo(
        () =>
            allAutoEmails.map((s) => ({
                id: s.id,
                emailType: s.emailType,
                userName: s.userName,
                status: s.status,
            })),
        [allAutoEmails],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Email Type', key: 'emailType' },
        { label: 'User Name', key: 'userName' },
        { label: 'Status', key: 'status' },
    ]
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <div className="flex-grow">
                <TemplateSearch onInputChange={onSearchChange} />
            </div>
            <Suspense fallback={<Button loading>Loading Export...</Button>}>
                <CSVLink
                    filename="AutEmail.csv"
                    data={csvData}
                    headers={csvHeaders}
                >
                    <Button icon={<TbCloudUpload/>}>Export</Button>
                </CSVLink>
            </Suspense>
            <div className="flex-shrink-0">
                <TemplateFilter
                    filterData={filterData}
                    setFilterData={setFilterData}
                />
            </div>
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
    const activeEmailTypes = filterData.emailType || []
    const activeStatuses = filterData.status || []
    const hasActiveFilters =
        activeEmailTypes.length > 0 || activeStatuses.length > 0

    if (!hasActiveFilters) return null

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
                Active Filters:
            </span>
            {activeEmailTypes.map((type) => (
                <Tag
                    key={`type-${type}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    {' '}
                    {type}{' '}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('emailType', type)}
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
    allTemplates: AutoEmailItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allTemplates.map((t) => ({
                id: t.id,
                emailType: t.emailType,
                userName: t.userName,
                status: t.status,
                createdDate: t.createdDate?.toISOString() ?? '',
            })),
        [allTemplates],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Email Type', key: 'emailType' },
        { label: 'User Name', key: 'userName' },
        { label: 'Status', key: 'status' },
        { label: 'Created Date', key: 'createdDate' },
    ]
    const handleAdd = () => navigate('/auto-emails/create') // Adjust route

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
    selectedTemplates: AutoEmailItem[]
    setSelectedTemplates: React.Dispatch<React.SetStateAction<AutoEmailItem[]>>
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
                    Are you sure you want to delete the selected auto email
                    template{selectedTemplates.length > 1 ? 's' : ''}? This
                    action cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End TemplateSelected ---

// --- Main AutoEmailListing Component ---
const AutoEmailListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [templates, setTemplates] = useState<AutoEmailItem[]>(
        initialDummyAutoEmails,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedTemplates, setSelectedTemplates] = useState<AutoEmailItem[]>(
        [],
    ) // Corrected: Use selectedTemplates state
    const [filterData, setFilterData] = useState<FilterFormSchema>(
        filterValidationSchema.parse({}),
    )
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...templates]

        // Apply Filtering
        if (filterData.emailType && filterData.emailType.length > 0) {
            const typeSet = new Set(filterData.emailType)
            processedData = processedData.filter((t) =>
                typeSet.has(t.emailType),
            )
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
                    t.emailType.toLowerCase().includes(query) ||
                    t.userName.toLowerCase().includes(query) || // Search userName
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
                // Default string sort
                const aValue = a[key as keyof AutoEmailItem] ?? ''
                const bValue = b[key as keyof AutoEmailItem] ?? ''
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
                handleSetTableData({ ...tableData, pageIndex: 1 })
                setSelectedTemplates([])
                return updatedFilterData
            })
        },
        [tableData, handleSetTableData],
    ) // Corrected dependency

    const handleClearAllFilters = useCallback(() => {
        const defaultFilters = filterValidationSchema.parse({})
        setFilterData(defaultFilters)
        handleSetTableData({ ...tableData, pageIndex: 1 })
        setSelectedTemplates([])
    }, [tableData, handleSetTableData]) // Corrected dependency

    const handleRowSelect = useCallback(
        (checked: boolean, row: AutoEmailItem) => {
            // Corrected state setter
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
    ) // Corrected dependency

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<AutoEmailItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            // Corrected state setter
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
    ) // Corrected dependency

    const handleEdit = useCallback(
        (template: AutoEmailItem) => {
            console.log('Edit auto email:', template.id)
            navigate(`/auto-emails/edit/${template.id}`)
        },
        [navigate],
    )

    // Optional Clone handler
    const handleClone = useCallback(
        (templateToClone: AutoEmailItem) => {
            console.log('Cloning auto email:', templateToClone.id)
            const newId = `AE${Math.floor(Math.random() * 9000) + 1000}`
            const clonedTemplate: AutoEmailItem = {
                ...templateToClone,
                id: newId,
                emailType: `${templateToClone.emailType} (Copy)`,
                status: 'draft',
                createdDate: new Date(),
            }
            setTemplates((prev) => [clonedTemplate, ...prev])
            toast.push(
                <Notification
                    title="Auto Email Cloned"
                    type="success"
                    duration={2000}
                />,
            )
        },
        [setTemplates],
    )

    const handleChangeStatus = useCallback(
        (template: AutoEmailItem) => {
            const statuses: AutoEmailItem['status'][] = [
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
                >{`Template '${template.emailType}' status changed to ${newStatus}.`}</Notification>,
            )
        },
        [setTemplates],
    )

    const handleDelete = useCallback(
        (templateToDelete: AutoEmailItem) => {
            console.log('Deleting auto email:', templateToDelete.id)
            setTemplates((current) =>
                current.filter((t) => t.id !== templateToDelete.id),
            )
            // Corrected state setter
            setSelectedTemplates((prev) =>
                prev.filter((t) => t.id !== templateToDelete.id),
            )
            toast.push(
                <Notification
                    title="Auto Email Deleted"
                    type="success"
                    duration={2000}
                >{`Template '${templateToDelete.emailType}' deleted.`}</Notification>,
            )
        },
        [setTemplates, setSelectedTemplates],
    ) // Corrected dependency

    const handleDeleteSelected = useCallback(() => {
        // Corrected state variable
        console.log(
            'Deleting selected auto emails:',
            selectedTemplates.map((t) => t.id),
        )
        // Corrected state variable
        const selectedIds = new Set(selectedTemplates.map((t) => t.id))
        setTemplates((current) => current.filter((t) => !selectedIds.has(t.id)))
        // Corrected state setter
        setSelectedTemplates([])
        toast.push(
            <Notification
                title="Auto Emails Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} template(s) deleted.`}</Notification>,
        )
    }, [selectedTemplates, setTemplates, setSelectedTemplates]) // Corrected dependencies
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<AutoEmailItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                size: 70,
            },
            {
                header: 'Email Type',
                accessorKey: 'emailType',
                enableSorting: true,
                size: 250,
            },
            {
                header: 'User Name',
                accessorKey: 'userName',
                enableSorting: true,
                cell: (props) => (
                    <div className="flex items-center gap-2">
                        <Avatar
                            size={28}
                            shape="circle"
                            icon={<TbUserCircle />}
                        />
                        <span>{props.row.original.userName}</span>
                    </div>
                ),
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                size: 80,
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
            // { header: 'Created Date', ... }, // Optional
            {
                header: 'Action',
                id: 'action',
                width: 130, // Adjusted width for more actions
                meta:{HeaderClass : "text-center"},
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        } // Pass status change handler
                        onClone={() => handleClone(props.row.original)} // Pass optional clone handler
                    />
                ),
            },
        ],
        [handleEdit, handleDelete, handleChangeStatus, handleClone], // Corrected dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Auto Emails</h5>
                    <TemplateActionTools allTemplates={templates} />
                </div>

                {/* Tools */}
                <div className="mb-2">
                    <TemplateTableTools
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter}
                        allAutoEmails={templates} // Pass data for export
                    />
                </div>

                {/* Active Filters Display Area */}
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
                        selectedTemplates={selectedTemplates} // Correct state variable
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
                selectedTemplates={selectedTemplates} // Correct state variable
                setSelectedTemplates={setSelectedTemplates} // Correct state setter
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default AutoEmailListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
