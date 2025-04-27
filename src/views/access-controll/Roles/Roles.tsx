// src/views/your-path/RolesListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
// import Tag from '@/components/ui/Tag'; // Could be used for display name vs role name difference
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog' // Keep for potential future use (e.g., view permissions)
// import Avatar from '@/components/ui/Avatar'; // Likely not needed
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbUserShield, TbLockAccess } from 'react-icons/tb' // Icons

// Icons
import {
    TbPencil, // Edit
    TbTrash, // Delete
    TbChecks, // Selected Footer
    TbSearch,
    TbCloudDownload, // Optional export
    TbPlus, // Add
    // TbCopy, // Clone might be useful
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
export type RoleItem = {
    id: string // Unique Role ID (e.g., 'admin', 'editor', 'support_lvl1')
    displayName: string // User-friendly name (e.g., "Administrator", "Content Editor", "Support Agent L1")
    roleName: string // System name/key (e.g., 'admin', 'editor', 'support_lvl1') - often same as ID but not always
    description: string // Explanation of the role's purpose
    addedDate: Date // When the role was created
    // Optional: Count of users with this role, permissions array etc.
    // userCount?: number;
    // permissions?: string[];
}
// --- End Item Type ---

// --- Constants ---
const initialDummyRoles: RoleItem[] = [
    {
        id: 'admin',
        displayName: 'Administrator',
        roleName: 'admin',
        description: 'Full access to all system features and settings.',
        addedDate: new Date(2022, 0, 1),
    },
    {
        id: 'editor',
        displayName: 'Content Editor',
        roleName: 'editor',
        description:
            'Can create, edit, and publish content (e.g., blogs, pages).',
        addedDate: new Date(2022, 1, 15),
    },
    {
        id: 'support_agent',
        displayName: 'Support Agent',
        roleName: 'support_agent',
        description: 'Can view and respond to customer support tickets.',
        addedDate: new Date(2022, 3, 10),
    },
    {
        id: 'sales_rep',
        displayName: 'Sales Representative',
        roleName: 'sales_rep',
        description: 'Manages leads, opportunities, and customer accounts.',
        addedDate: new Date(2022, 4, 5),
    },
    {
        id: 'marketing_mgr',
        displayName: 'Marketing Manager',
        roleName: 'marketing_mgr',
        description:
            'Manages marketing campaigns, email templates, and analytics.',
        addedDate: new Date(2022, 6, 20),
    },
    {
        id: 'viewer',
        displayName: 'Viewer',
        roleName: 'viewer',
        description: 'Read-only access to specific dashboards and reports.',
        addedDate: new Date(2023, 0, 5),
    },
    {
        id: 'finance_user',
        displayName: 'Finance User',
        roleName: 'finance_user',
        description: 'Access to billing, invoices, and financial reports.',
        addedDate: new Date(2023, 2, 1),
    },
    {
        id: 'hr_admin',
        displayName: 'HR Administrator',
        roleName: 'hr_admin',
        description: 'Manages employee records and HR-related settings.',
        addedDate: new Date(2023, 5, 18),
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onDelete,
    onViewPermissions, // New action
}: {
    onEdit: () => void
    onDelete: () => void
    onViewPermissions: () => void // New action prop
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-end gap-2">
            {/* View Permissions Button */}
            <Tooltip title="View/Edit Permissions">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400',
                    )}
                    role="button"
                    onClick={onViewPermissions}
                >
                    <TbLockAccess />
                </div>
            </Tooltip>
            {/* Edit Role Details Button */}
            <Tooltip title="Edit Role Details">
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
            {/* Delete Role Button */}
            <Tooltip title="Delete Role">
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

// --- RoleTable Component ---
const RoleTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedRoles,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<RoleItem>[]
    data: RoleItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedRoles: RoleItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: RoleItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<RoleItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedRoles.some((selected) => selected.id === row.id)
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
// --- End RoleTable ---

// --- RoleSearch Component ---
type RoleSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const RoleSearch = React.forwardRef<HTMLInputElement, RoleSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Search Roles (ID, Name, Description...)"
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
RoleSearch.displayName = 'RoleSearch'
// --- End RoleSearch ---

// --- RoleTableTools Component ---
const RoleTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <RoleSearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
    // Filter component removed for now
}
// --- End RoleTableTools ---

// --- RoleActionTools Component ---
const RoleActionTools = ({ allRoles }: { allRoles: RoleItem[] }) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allRoles.map((r) => ({
                id: r.id,
                displayName: r.displayName,
                roleName: r.roleName,
                description: r.description,
                addedDate: r.addedDate.toISOString(),
            })),
        [allRoles],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Display Name', key: 'displayName' },
        { label: 'Role Name', key: 'roleName' },
        { label: 'Description', key: 'description' },
        { label: 'Date Added', key: 'addedDate' },
    ]
    const handleAdd = () => navigate('/roles/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block>
                {' '}
                Add new Role{' '}
            </Button>{' '}
        </div>
    )
}
// --- End RoleActionTools ---

// --- RoleSelected Component ---
const RoleSelected = ({
    selectedRoles,
    setSelectedRoles,
    onDeleteSelected,
}: {
    selectedRoles: RoleItem[]
    setSelectedRoles: React.Dispatch<React.SetStateAction<RoleItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedRoles.length === 0) return null

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
                                {selectedRoles.length}
                            </span>
                            <span>
                                Role{selectedRoles.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedRoles.length} Role${selectedRoles.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected role
                    {selectedRoles.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End RoleSelected ---

// --- Main RolesListing Component ---
const RolesListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [roles, setRoles] = useState<RoleItem[]>(initialDummyRoles)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedRoles, setSelectedRoles] = useState<RoleItem[]>([])
    // Filter state could be added here if needed
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...roles]

        // Apply Filtering (if added)

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (r) =>
                    r.id.toLowerCase().includes(query) ||
                    r.displayName.toLowerCase().includes(query) ||
                    r.roleName.toLowerCase().includes(query) ||
                    r.description.toLowerCase().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'addedDate') {
                    return order === 'asc'
                        ? a.addedDate.getTime() - b.addedDate.getTime()
                        : b.addedDate.getTime() - a.addedDate.getTime()
                }
                const aValue = a[key as keyof RoleItem] ?? ''
                const bValue = b[key as keyof RoleItem] ?? ''
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
    }, [roles, tableData])
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
            setSelectedRoles([])
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
    // Filter handlers would go here

    const handleRowSelect = useCallback(
        (checked: boolean, row: RoleItem) => {
            setSelectedRoles((prev) => {
                if (checked) {
                    return prev.some((r) => r.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((r) => r.id !== row.id)
                }
            })
        },
        [setSelectedRoles],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<RoleItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedRoles((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((r) => r.id))
                    const newSelection = originalRows.filter(
                        (r) => !existingIds.has(r.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((r) => !rowIds.has(r.id))
                }
            })
        },
        [setSelectedRoles],
    )

    const handleEdit = useCallback(
        (role: RoleItem) => {
            console.log('Edit role:', role.id)
            navigate(`/roles/edit/${role.id}`) // Adjust route
        },
        [navigate],
    )

    const handleViewPermissions = useCallback(
        (role: RoleItem) => {
            console.log('View/Edit permissions for role:', role.id)
            navigate(`/roles/permissions/${role.id}`) // Navigate to a dedicated permissions page for this role
            // Or: Open a modal here to display/edit permissions directly
        },
        [navigate],
    )

    const handleDelete = useCallback(
        (roleToDelete: RoleItem) => {
            console.log('Deleting role:', roleToDelete.id)
            setRoles((current) =>
                current.filter((r) => r.id !== roleToDelete.id),
            )
            setSelectedRoles((prev) =>
                prev.filter((r) => r.id !== roleToDelete.id),
            )
            toast.push(
                <Notification
                    title="Role Deleted"
                    type="success"
                    duration={2000}
                >{`Role '${roleToDelete.displayName}' deleted.`}</Notification>,
            )
        },
        [setRoles, setSelectedRoles],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected roles:',
            selectedRoles.map((r) => r.id),
        )
        const selectedIds = new Set(selectedRoles.map((r) => r.id))
        setRoles((current) => current.filter((r) => !selectedIds.has(r.id)))
        setSelectedRoles([])
        toast.push(
            <Notification
                title="Roles Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} role(s) deleted.`}</Notification>,
        )
    }, [selectedRoles, setRoles, setSelectedRoles])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<RoleItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                width: 150,
            },
            {
                header: 'Display Name',
                accessorKey: 'displayName',
                enableSorting: true,
            },
            {
                header: 'Role Name (System)',
                accessorKey: 'roleName',
                enableSorting: true,
            },
            {
                header: 'Description',
                accessorKey: 'description',
                enableSorting: false,
                cell: (props) => (
                    <Tooltip
                        title={props.row.original.description}
                        wrapperClass="w-full"
                    >
                        <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-md">
                            {props.row.original.description}
                        </span>
                    </Tooltip>
                ),
            },
            {
                header: 'Date Added',
                accessorKey: 'addedDate',
                enableSorting: true,
                width: 180,
                cell: (props) => {
                    const date = props.row.original.addedDate
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
                width: 120,
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                        onViewPermissions={() =>
                            handleViewPermissions(props.row.original)
                        } // Pass new handler
                    />
                ),
            },
        ],
        [handleEdit, handleDelete, handleViewPermissions], // Update dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Roles Listing</h3>
                    <RoleActionTools allRoles={roles} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <RoleTableTools onSearchChange={handleSearchChange} />
                    {/* Filter component could be added here */}
                </div>

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <RoleTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedRoles={selectedRoles}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <RoleSelected
                selectedRoles={selectedRoles}
                setSelectedRoles={setSelectedRoles}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default RolesListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
