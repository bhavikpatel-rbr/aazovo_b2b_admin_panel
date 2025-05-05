// src/views/your-path/AutoEmailTemplatesListing.tsx (Complete Code)

import React, { useState, useMemo, useCallback, Ref, Suspense, lazy } from 'react'
import { Link, useNavigate } from 'react-router-dom' // Ensure react-router-dom is installed
import cloneDeep from 'lodash/cloneDeep' // Ensure lodash is installed
import classNames from 'classnames' // Ensure classnames is installed
import { useForm, Controller } from 'react-hook-form' // For filter form
import { zodResolver } from '@hookform/resolvers/zod' // For filter form
import { z } from 'zod' // For filter form
import type { ZodType } from 'zod' // For filter form

// UI Components (Ensure these paths are correct for your project)
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast' // Ensure toast setup exists
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Checkbox from '@/components/ui/Checkbox' // For filter form
// import Input from '@/components/ui/Input'; // Not currently needed for filter
import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // For filter form
import Badge from '@/components/ui/Badge' // Added Badge import

// Icons
import {
    TbPencil,
    TbCopy, // Optional: Clone action
    // TbSwitchHorizontal, // No status field in this version
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbPlus,
    TbFilter, // Filter Icon
    TbX, // Icon for dismissing tags
    TbMailForward, // Icon for add button
    TbFileText, // Icon for Avatar placeholder
    TbCloudUpload,
} from 'react-icons/tb' // Ensure react-icons is installed

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common' // Ensure this type path is correct

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
    import('react-csv').then((module) => ({ default: module.CSVLink })),
)
// --- End Lazy Load ---

// --- Define Item Type ---
export type AutoEmailTemplateItem = {
    id: string
    emailType: string
    categoryName: string | null
    departmentName: string | null
    createdDate?: Date
}
// --- End Item Type ---

// --- Define Filter Schema ---
const filterValidationSchema = z.object({
    categoryName: z.array(z.string()).default([]),
    departmentName: z.array(z.string()).default([]),
})

type FilterFormSchema = z.infer<typeof filterValidationSchema>
// --- End Filter Schema ---

// --- Constants ---
const initialDummyAutoTemplates: AutoEmailTemplateItem[] = [
    {
        id: 'AUTOET001',
        emailType: 'Welcome Email',
        categoryName: 'Onboarding',
        departmentName: 'Marketing',
        createdDate: new Date(2023, 9, 1),
    },
    {
        id: 'AUTOET002',
        emailType: 'Password Reset Confirmation',
        categoryName: 'Transactional',
        departmentName: null,
        createdDate: new Date(2023, 8, 15),
    },
    {
        id: 'AUTOET003',
        emailType: 'Order Shipped Notification',
        categoryName: 'Transactional',
        departmentName: 'Logistics',
        createdDate: new Date(2023, 7, 20),
    },
    {
        id: 'AUTOET004',
        emailType: 'Invoice Attached',
        categoryName: 'Transactional',
        departmentName: 'Finance',
        createdDate: new Date(2023, 10, 1),
    },
    {
        id: 'AUTOET005',
        emailType: 'Abandoned Cart Reminder',
        categoryName: 'Marketing',
        departmentName: 'Marketing',
        createdDate: new Date(2023, 9, 25),
    },
    {
        id: 'AUTOET006',
        emailType: 'Support Ticket Created',
        categoryName: 'Support',
        departmentName: 'Support',
        createdDate: new Date(2023, 8, 10),
    },
    {
        id: 'AUTOET007',
        emailType: 'Internal Policy Update',
        categoryName: 'Internal',
        departmentName: 'HR',
        createdDate: new Date(2023, 10, 5),
    },
    {
        id: 'AUTOET008',
        emailType: 'Subscription Renewal Success',
        categoryName: 'Transactional',
        departmentName: 'Billing',
        createdDate: new Date(2023, 9, 5),
    },
    {
        id: 'AUTOET009',
        emailType: 'Feature Update Newsletter',
        categoryName: 'Marketing',
        departmentName: 'Product',
        createdDate: new Date(2023, 10, 8),
    },
    {
        id: 'AUTOET010',
        emailType: 'Password Change Confirmation',
        categoryName: 'Transactional',
        departmentName: null,
        createdDate: new Date(2023, 10, 9),
    },
]

// Extract unique categories and departments for filter options
const uniqueCategories = Array.from(
    new Set(
        initialDummyAutoTemplates
            .map((t) => t.categoryName)
            .filter((c): c is string => c !== null),
    ),
).sort()
const uniqueDepartments = Array.from(
    new Set(
        initialDummyAutoTemplates
            .map((t) => t.departmentName)
            .filter((d): d is string => d !== null),
    ),
).sort()

// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone,
    // onChangeStatus, // Removed
    onDelete,
}: {
    onEdit: () => void
    onClone?: () => void
    // onChangeStatus?: () => void;
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
            {onClone && (
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
            )}
            {/* Status change removed */}
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
    columns: ColumnDef<AutoEmailTemplateItem>[]
    data: AutoEmailTemplateItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedTemplates: AutoEmailTemplateItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: AutoEmailTemplateItem) => void
    onAllRowSelect: (
        checked: boolean,
        rows: Row<AutoEmailTemplateItem>[],
    ) => void
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
        // Apply reset immediately
        setFilterData(defaultVals)
        onDialogClose()
    }

    // Calculate active filter count
    const activeFilterCount =
        (filterData.categoryName?.length || 0) +
        (filterData.departmentName?.length || 0)

    return (
        <>
            <Button
                icon={<TbFilter />}
                onClick={openDialog}
                className="relative" // Needed for badge positioning
            >
                <span>Filter</span>
                {activeFilterCount > 0 && (
                    <Badge
                        content={activeFilterCount}
                        className="absolute -top-2 -right-2" // Position the badge
                        innerClass="text-xs"
                    />
                )}
            </Button>
            <Dialog
                isOpen={dialogIsOpen}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
            >
                <h4 className="mb-4">Filter Templates</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <UiFormItem label="Category" className="mb-4">
                        {' '}
                        {/* Add margin between sections */}
                        <Controller
                            name="categoryName"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    value={field.value || []}
                                    onChange={field.onChange}
                                >
                                    {uniqueCategories.map((cat) => (
                                        <Checkbox
                                            key={cat}
                                            value={cat}
                                            className="mb-1"
                                        >
                                            {cat}
                                        </Checkbox>
                                    ))}
                                </Checkbox.Group>
                            )}
                        />
                    </UiFormItem>
                    <UiFormItem label="Department">
                        <Controller
                            name="departmentName"
                            control={control}
                            render={({ field }) => (
                                <Checkbox.Group
                                    vertical
                                    value={field.value || []}
                                    onChange={field.onChange}
                                >
                                    {uniqueDepartments.map((dept) => (
                                        <Checkbox
                                            key={dept}
                                            value={dept}
                                            className="mb-1"
                                        >
                                            {dept}
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
    allAutoEmailTemplates
}: {
    onSearchChange: (query: string) => void
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
    allAutoEmailTemplates: AutoEmailTemplateItem[]
}) => {

    // Prepare data for CSV
    const csvData = useMemo(
        () =>
            allAutoEmailTemplates.map((s) => ({
                id: s.id,
                emailType: s.emailType,
                categoryName: s.categoryName,
                departmentName: s.departmentName,
            })),
        [allAutoEmailTemplates],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Email Type', key: 'emailType' },
        { label: 'Category', key: 'categoryName' },
        { label: 'Department', key: 'departmentName' },
    ]
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            {' '}
            {/* Increased gap */}
            <div className="flex-grow">
                <TemplateSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex-shrink-0">
                <TemplateFilter
                    filterData={filterData}
                    setFilterData={setFilterData}
                />
            </div>
            <Suspense fallback={<Button loading>Loading Export...</Button>}>
                <CSVLink
                    filename="AutoEmailTemplates.csv"
                    data={csvData}
                    headers={csvHeaders}
                >
                    <Button icon={<TbCloudUpload/>}>Export</Button>
                </CSVLink>
            </Suspense>
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
    const activeCategories = filterData.categoryName || []
    const activeDepartments = filterData.departmentName || []
    const hasActiveFilters =
        activeCategories.length > 0 || activeDepartments.length > 0

    if (!hasActiveFilters) {
        return null
    }

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            {' '}
            {/* Added border/padding */}
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
                Active Filters:
            </span>
            {activeCategories.map((cat) => (
                <Tag
                    key={`cat-${cat}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    {cat}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('categoryName', cat)}
                    />
                </Tag>
            ))}
            {activeDepartments.map((dept) => (
                <Tag
                    key={`dept-${dept}`}
                    prefix
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
                >
                    {dept}
                    <TbX
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => onRemoveFilter('departmentName', dept)}
                    />
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
    allTemplates: AutoEmailTemplateItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allTemplates.map((t) => ({
                id: t.id,
                emailType: t.emailType,
                categoryName: t.categoryName ?? 'N/A',
                departmentName: t.departmentName ?? 'N/A',
                createdDate: t.createdDate?.toISOString() ?? '',
            })),
        [allTemplates],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Email Type', key: 'emailType' },
        { label: 'Category', key: 'categoryName' },
        { label: 'Department', key: 'departmentName' },
        { label: 'Created Date', key: 'createdDate' },
    ]
    const handleAdd = () => navigate('/auto-email-templates/create') // Adjust route

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
    selectedTemplates: AutoEmailTemplateItem[]
    setSelectedTemplates: React.Dispatch<
        React.SetStateAction<AutoEmailTemplateItem[]>
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

// --- Main AutoEmailTemplatesListing Component ---
const AutoEmailTemplatesListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [templates, setTemplates] = useState<AutoEmailTemplateItem[]>(
        initialDummyAutoTemplates,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedTemplates, setSelectedTemplates] = useState<
        AutoEmailTemplateItem[]
    >([])
    const [filterData, setFilterData] = useState<FilterFormSchema>(
        filterValidationSchema.parse({}),
    )
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...templates]

        // Apply Filtering
        if (filterData.categoryName && filterData.categoryName.length > 0) {
            const categorySet = new Set(filterData.categoryName)
            processedData = processedData.filter(
                (t) => t.categoryName && categorySet.has(t.categoryName),
            )
        }
        if (filterData.departmentName && filterData.departmentName.length > 0) {
            const departmentSet = new Set(filterData.departmentName)
            processedData = processedData.filter(
                (t) => t.departmentName && departmentSet.has(t.departmentName),
            )
        }

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (t) =>
                    t.id.toLowerCase().includes(query) ||
                    t.emailType.toLowerCase().includes(query) ||
                    (t.categoryName?.toLowerCase().includes(query) ?? false) ||
                    (t.departmentName?.toLowerCase().includes(query) ?? false),
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
                if (key === 'categoryName' || key === 'departmentName') {
                    const valA = a[key] ?? ''
                    const valB = b[key] ?? '' // Treat null as empty string
                    if (valA === null && valB === null) return 0
                    if (valA === null) return order === 'asc' ? -1 : 1
                    if (valB === null) return order === 'asc' ? 1 : -1
                    // Now both are non-null strings
                    return order === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA)
                }
                const aValue = a[key as keyof AutoEmailTemplateItem] ?? ''
                const bValue = b[key as keyof AutoEmailTemplateItem] ?? ''
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
        (checked: boolean, row: AutoEmailTemplateItem) => {
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
        (checked: boolean, rows: Row<AutoEmailTemplateItem>[]) => {
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
        (template: AutoEmailTemplateItem) => {
            console.log('Edit auto template:', template.id)
            navigate(`/auto-email-templates/edit/${template.id}`)
        },
        [navigate],
    )

    // Clone handler (optional)
    // const handleClone = useCallback((templateToClone: AutoEmailTemplateItem) => { ... }, [setTemplates]);

    const handleDelete = useCallback(
        (templateToDelete: AutoEmailTemplateItem) => {
            console.log('Deleting auto template:', templateToDelete.id)
            // Add confirmation dialog if needed for single delete
            setTemplates((current) =>
                current.filter((t) => t.id !== templateToDelete.id),
            )
            setSelectedTemplates((prev) =>
                prev.filter((t) => t.id !== templateToDelete.id),
            )
            toast.push(
                <Notification
                    title="Auto Template Deleted"
                    type="success"
                    duration={2000}
                >{`Template '${templateToDelete.emailType}' deleted.`}</Notification>,
            )
        },
        [setTemplates, setSelectedTemplates],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected auto templates:',
            selectedTemplates.map((t) => t.id),
        )
        const selectedIds = new Set(selectedTemplates.map((t) => t.id))
        setTemplates((current) => current.filter((t) => !selectedIds.has(t.id)))
        setSelectedTemplates([])
        toast.push(
            <Notification
                title="Auto Templates Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} template(s) deleted.`}</Notification>,
        )
    }, [selectedTemplates, setTemplates, setSelectedTemplates])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<AutoEmailTemplateItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                width: 120,
            },
            {
                header: 'Email Type',
                accessorKey: 'emailType',
                enableSorting: true,
            },
            {
                header: 'Category',
                accessorKey: 'categoryName',
                enableSorting: true,
                cell: (props) => (
                    <span>{props.row.original.categoryName ?? '-'}</span>
                ),
            },
            {
                header: 'Department',
                accessorKey: 'departmentName',
                enableSorting: true,
                cell: (props) => (
                    <span>{props.row.original.departmentName ?? '-'}</span>
                ),
            },
            // { header: 'Created Date', accessorKey: 'createdDate', ... }, // Optional
            {
                header: 'Action',
                id: 'action',
                width: 100,
                meta : { HeaderClass : "text-center" },
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                        // onClone optional
                    />
                ),
            },
        ],
        [handleEdit, handleDelete], // Update dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Auto Email Templates</h5>
                    <TemplateActionTools allTemplates={templates} />
                </div>

                {/* Tools */}
                <div className="mb-2">
                    {' '}
                    {/* Reduced margin */}
                    <TemplateTableTools
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter} // Pass filter handler
                        allAutoEmailTemplates={templates} // Pass data for export
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

export default AutoEmailTemplatesListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
