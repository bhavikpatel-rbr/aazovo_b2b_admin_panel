// src/views/your-path/Emailtemplates.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar' // Can use for role/dept icons if available
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbMail, TbVariable } from 'react-icons/tb' // Placeholder icons

// Icons
import {
    TbPencil,
    TbCopy, // Optional clone
    TbSwitchHorizontal, // Status change
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
interface TemplateVariable {
    name: string
    type: 'string' | 'number' | 'date' | 'boolean' | 'array'
    exampleValue: string | number | boolean | string[] | Date | null
}

export type EmailTemplateItem = {
    id: string // Unique ID for the template record
    templateId: string // The ID used in the system (e.g., 'welcome_email_v2')
    status: 'active' | 'inactive' | 'draft'
    name: string // User-friendly name (e.g., "Welcome Email - New User")
    role: string[] | null // Target roles (e.g., ['Admin', 'Manager'])
    department: string[] | null // Target departments (e.g., ['Sales', 'Marketing'])
    designation: string[] | null // Target designations (e.g., ['Sales Rep', 'Support Agent'])
    category: string | null // e.g., 'Onboarding', 'Marketing', 'Transactional'
    subCategory: string | null // e.g., 'Welcome', 'Password Reset', 'Promo Blast'
    brand: string | null // e.g., 'Brand A', 'Brand B'
    variables: TemplateVariable[] | null // List of variables used
    createdDate: Date
}
// --- End Item Type ---

// --- Constants ---
const templateStatusColor: Record<EmailTemplateItem['status'], string> = {
    active: 'bg-emerald-500',
    inactive: 'bg-amber-500',
    draft: 'bg-gray-500',
}

const initialDummyTemplates: EmailTemplateItem[] = [
    {
        id: 'ET001',
        templateId: 'welcome_new_user',
        status: 'active',
        name: 'Welcome - New User Signup',
        role: ['Customer'],
        department: null,
        designation: null,
        category: 'Onboarding',
        subCategory: 'Welcome',
        brand: 'Brand A',
        variables: [
            { name: 'firstName', type: 'string', exampleValue: 'John' },
            { name: 'signupDate', type: 'date', exampleValue: new Date() },
        ],
        createdDate: new Date(2023, 9, 1),
    },
    {
        id: 'ET002',
        templateId: 'pwd_reset_request',
        status: 'active',
        name: 'Password Reset Request',
        role: null,
        department: null,
        designation: null,
        category: 'Transactional',
        subCategory: 'Password Reset',
        brand: null,
        variables: [
            { name: 'resetLink', type: 'string', exampleValue: 'https://...' },
            { name: 'userName', type: 'string', exampleValue: 'JaneDoe' },
        ],
        createdDate: new Date(2023, 8, 15),
    },
    {
        id: 'ET003',
        templateId: 'promo_q4_sale',
        status: 'draft',
        name: 'Q4 Holiday Promotion',
        role: ['Customer'],
        department: ['Marketing'],
        designation: null,
        category: 'Marketing',
        subCategory: 'Promotion',
        brand: 'Brand B',
        variables: [
            { name: 'discountCode', type: 'string', exampleValue: 'HOLIDAY20' },
            {
                name: 'saleEndDate',
                type: 'date',
                exampleValue: new Date(2023, 11, 31),
            },
        ],
        createdDate: new Date(2023, 10, 1),
    },
    {
        id: 'ET004',
        templateId: 'order_confirmation',
        status: 'active',
        name: 'Order Confirmation',
        role: ['Customer'],
        department: null,
        designation: null,
        category: 'Transactional',
        subCategory: 'Order',
        brand: 'Brand A',
        variables: [
            { name: 'orderNumber', type: 'string', exampleValue: 'ORD-12345' },
            { name: 'totalAmount', type: 'number', exampleValue: 99.99 },
            {
                name: 'items',
                type: 'array',
                exampleValue: ['Item A', 'Item B'],
            },
        ],
        createdDate: new Date(2023, 7, 20),
    },
    {
        id: 'ET005',
        templateId: 'support_ticket_update',
        status: 'inactive',
        name: 'Support Ticket Update',
        role: ['Customer'],
        department: ['Support'],
        designation: ['Support Agent'],
        category: 'Support',
        subCategory: 'Ticket Update',
        brand: null,
        variables: [
            { name: 'ticketId', type: 'string', exampleValue: 'TKT-6789' },
            { name: 'agentName', type: 'string', exampleValue: 'SupportBot' },
        ],
        createdDate: new Date(2023, 6, 10),
    },
    {
        id: 'ET006',
        templateId: 'internal_memo_hr',
        status: 'active',
        name: 'Internal Memo - HR Policy',
        role: ['Employee'],
        department: ['HR'],
        designation: null,
        category: 'Internal',
        subCategory: 'Announcement',
        brand: null,
        variables: [
            {
                name: 'policyName',
                type: 'string',
                exampleValue: 'Remote Work Policy v2',
            },
        ],
        createdDate: new Date(2023, 10, 5),
    },
    {
        id: 'ET007',
        templateId: 'newsletter_weekly',
        status: 'active',
        name: 'Weekly Newsletter',
        role: ['Subscriber'],
        department: ['Marketing'],
        designation: null,
        category: 'Marketing',
        subCategory: 'Newsletter',
        brand: 'Brand B',
        variables: [
            {
                name: 'featuredArticleTitle',
                type: 'string',
                exampleValue: 'Top 5 Gadgets',
            },
        ],
        createdDate: new Date(2023, 5, 1),
    },
]
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
        <div className="flex items-center justify-end gap-2">
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
    columns: ColumnDef<EmailTemplateItem>[]
    data: EmailTemplateItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedTemplates: EmailTemplateItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: EmailTemplateItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<EmailTemplateItem>[]) => void
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
                placeholder="Search Templates (Name, ID, Category...)"
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
TemplateSearch.displayName = 'TemplateSearch'
// --- End TemplateSearch ---

// --- TemplateTableTools Component ---
const TemplateTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <TemplateSearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
}
// --- End TemplateTableTools ---

// --- TemplateActionTools Component ---
const TemplateActionTools = ({
    allTemplates,
}: {
    allTemplates: EmailTemplateItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allTemplates.map((t) => ({
                /* ... format for csv ... */
            })),
        [allTemplates],
    )
    const csvHeaders = [
        /* ... headers ... */
    ]
    const handleAdd = () => navigate('/email-templates/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbMail />} onClick={handleAdd} block>
                {' '}
                Add new Template{' '}
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
    selectedTemplates: EmailTemplateItem[]
    setSelectedTemplates: React.Dispatch<
        React.SetStateAction<EmailTemplateItem[]>
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

// --- Main Emailtemplates Component ---
const Emailtemplates = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [templates, setTemplates] = useState<EmailTemplateItem[]>(
        initialDummyTemplates,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedTemplates, setSelectedTemplates] = useState<
        EmailTemplateItem[]
    >([])
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...templates]

        // Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (t) =>
                    t.id.toLowerCase().includes(query) ||
                    t.templateId.toLowerCase().includes(query) ||
                    t.name.toLowerCase().includes(query) ||
                    t.status.toLowerCase().includes(query) ||
                    (t.category?.toLowerCase().includes(query) ?? false) ||
                    (t.subCategory?.toLowerCase().includes(query) ?? false) ||
                    (t.brand?.toLowerCase().includes(query) ?? false) ||
                    (t.role?.some((r) => r.toLowerCase().includes(query)) ??
                        false) ||
                    (t.department?.some((d) =>
                        d.toLowerCase().includes(query),
                    ) ??
                        false) ||
                    (t.designation?.some((d) =>
                        d.toLowerCase().includes(query),
                    ) ??
                        false) ||
                    (t.variables?.some(
                        (v) =>
                            v.name.toLowerCase().includes(query) ||
                            v.type.toLowerCase().includes(query),
                    ) ??
                        false),
            )
        }

        // Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'createdDate') {
                    return order === 'asc'
                        ? a.createdDate.getTime() - b.createdDate.getTime()
                        : b.createdDate.getTime() - a.createdDate.getTime()
                }
                // Sort by first item in array fields, handle nulls
                if (
                    key === 'role' ||
                    key === 'department' ||
                    key === 'designation'
                ) {
                    const valA = a[key]?.[0] ?? null
                    const valB = b[key]?.[0] ?? null
                    if (valA === null && valB === null) return 0
                    if (valA === null) return order === 'asc' ? -1 : 1
                    if (valB === null) return order === 'asc' ? 1 : -1
                    return order === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA)
                }
                // Sort by variable count
                if (key === 'variables') {
                    const lenA = a.variables?.length ?? 0
                    const lenB = b.variables?.length ?? 0
                    return order === 'asc' ? lenA - lenB : lenB - lenA
                }
                // Default string sort (handle nulls for category etc.)
                const aValue = a[key as keyof EmailTemplateItem] ?? ''
                const bValue = b[key as keyof EmailTemplateItem] ?? ''
                if (aValue === null && bValue === null) return 0
                if (aValue === null) return order === 'asc' ? -1 : 1
                if (bValue === null) return order === 'asc' ? 1 : -1
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                return 0
            })
            processedData = sortedData
        }

        // Pagination
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const dataTotal = processedData.length
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return { pageData: dataForPage, total: dataTotal }
    }, [templates, tableData])
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

    const handleRowSelect = useCallback(
        (checked: boolean, row: EmailTemplateItem) => {
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
        (checked: boolean, rows: Row<EmailTemplateItem>[]) => {
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
        (template: EmailTemplateItem) => {
            console.log('Edit template:', template.id)
            navigate(`/email-templates/edit/${template.id}`) // Adjust route
        },
        [navigate],
    )

    const handleClone = useCallback(
        (templateToClone: EmailTemplateItem) => {
            console.log('Cloning template:', templateToClone.id)
            const newId = `ET${Math.floor(Math.random() * 9000) + 1000}`
            const clonedTemplate: EmailTemplateItem = {
                ...templateToClone,
                id: newId,
                templateId: `${templateToClone.templateId}_copy`,
                name: `${templateToClone.name} (Copy)`,
                status: 'draft',
                createdDate: new Date(),
            }
            setTemplates((prev) => [clonedTemplate, ...prev])
            toast.push(
                <Notification
                    title="Template Cloned"
                    type="success"
                    duration={2000}
                />,
            )
        },
        [setTemplates],
    )

    const handleChangeStatus = useCallback(
        (template: EmailTemplateItem) => {
            const statuses: EmailTemplateItem['status'][] = [
                'draft',
                'active',
                'inactive',
                'archived',
            ] // Include archived if needed
            const currentStatusIndex = statuses.indexOf(template.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
            console.log(
                `Changing status of template ${template.templateId} to ${newStatus}`,
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
        (templateToDelete: EmailTemplateItem) => {
            console.log('Deleting template:', templateToDelete.id)
            setTemplates((current) =>
                current.filter((t) => t.id !== templateToDelete.id),
            )
            setSelectedTemplates((prev) =>
                prev.filter((t) => t.id !== templateToDelete.id),
            )
            toast.push(
                <Notification
                    title="Template Deleted"
                    type="success"
                    duration={2000}
                >{`Template '${templateToDelete.name}' deleted.`}</Notification>,
            )
        },
        [setTemplates, setSelectedTemplates],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected templates:',
            selectedTemplates.map((t) => t.id),
        )
        const selectedIds = new Set(selectedTemplates.map((t) => t.id))
        setTemplates((current) => current.filter((t) => !selectedIds.has(t.id)))
        setSelectedTemplates([])
        toast.push(
            <Notification
                title="Templates Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} template(s) deleted.`}</Notification>,
        )
    }, [selectedTemplates, setTemplates, setSelectedTemplates])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<EmailTemplateItem>[] = useMemo(
        () => [
            { header: 'Name', accessorKey: 'name', enableSorting: true },
            {
                header: 'Template ID',
                accessorKey: 'templateId',
                enableSorting: true,
                width: 200,
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                width: 120,
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <Tag
                            className={`${templateStatusColor[status]} text-white capitalize`}
                        >
                            {status}
                        </Tag>
                    )
                },
            },
            {
                header: 'Targeting', // Combine Role/Dept/Designation
                // Create a combined accessor or use a custom cell
                id: 'targeting', // Important to have a unique ID if no accessorKey
                enableSorting: false, // Sorting is complex
                cell: (props) => {
                    const { role, department, designation } = props.row.original
                    const items: string[] = []
                    if (role?.length) items.push(`Roles: ${role.join(', ')}`)
                    if (department?.length)
                        items.push(`Depts: ${department.join(', ')}`)
                    if (designation?.length)
                        items.push(`Desigs: ${designation.join(', ')}`)
                    const displayString = items.join(' | ')
                    return displayString ? (
                        <Tooltip
                            title={displayString}
                            wrapperClass="whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] block"
                        >
                            <span>{displayString}</span>
                        </Tooltip>
                    ) : (
                        <span>-</span>
                    )
                },
            },
            {
                header: 'Category',
                accessorKey: 'category',
                enableSorting: true,
                cell: (props) => (
                    <span>{props.row.original.category ?? '-'}</span>
                ),
            },
            {
                header: 'Subcategory',
                accessorKey: 'subCategory',
                enableSorting: true,
                cell: (props) => (
                    <span>{props.row.original.subCategory ?? '-'}</span>
                ),
            },
            {
                header: 'Brand',
                accessorKey: 'brand',
                enableSorting: true,
                cell: (props) => <span>{props.row.original.brand ?? '-'}</span>,
            },
            {
                header: 'Variables',
                accessorKey: 'variables',
                enableSorting: true,
                width: 100,
                cell: (props) => {
                    const vars = props.row.original.variables
                    const count = vars?.length ?? 0
                    const tooltipContent =
                        vars?.map((v) => `${v.name} (${v.type})`).join('\n') ||
                        'No variables'
                    return count > 0 ? (
                        <Tooltip
                            title={
                                <pre className="max-w-xs whitespace-pre-wrap">
                                    {tooltipContent}
                                </pre>
                            }
                        >
                            <span className="cursor-default">
                                {count} Var(s)
                            </span>
                        </Tooltip>
                    ) : (
                        <span>-</span>
                    )
                },
                // Sort by number of variables
                sortingFn: (rowA, rowB, columnId) => {
                    const lenA = rowA.original.variables?.length ?? 0
                    const lenB = b.original.variables?.length ?? 0
                    return lenA - lenB
                },
            },
            {
                header: 'Created Date',
                accessorKey: 'createdDate',
                enableSorting: true,
                width: 180,
                cell: (props) => {
                    const date = props.row.original.createdDate
                    return (
                        <span>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    )
                },
            },
            {
                header: '',
                id: 'action',
                width: 130,
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
        [handleClone, handleChangeStatus, handleEdit, handleDelete],
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Email Templates Listing</h3>
                    <TemplateActionTools allTemplates={templates} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    {/* Add Filter component if desired */}
                    <TemplateTableTools onSearchChange={handleSearchChange} />
                    {/* <BlogFilter filterData={filterData} setFilterData={handleApplyFilter} /> */}
                </div>

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

export default Emailtemplates

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
