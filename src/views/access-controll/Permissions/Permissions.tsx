// src/views/your-path/PermissionsListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'
// Filter related imports - Keep if you plan to add filtering soon
// import { useForm, Controller } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import type { ZodType } from 'zod';

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
// import Tag from '@/components/ui/Tag'; // Not needed for these fields
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog' // Keep for potential future use
// import Avatar from '@/components/ui/Avatar'; // Likely not needed
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
// import Checkbox from '@/components/ui/Checkbox'; // For filter form
// import { Form, FormItem as UiFormItem } from '@/components/ui/Form'; // For filter form
// import Badge from '@/components/ui/Badge'; // For filter count
import { TbKey, TbFilter, TbX } from 'react-icons/tb' // Icons

// Icons
import {
    TbPencil, // Edit
    TbTrash, // Delete
    TbChecks, // Selected Footer
    TbSearch,
    TbCloudDownload, // Optional export
    TbPlus, // Add
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
export type PermissionItem = {
    id: string // Unique Permission ID (e.g., 'users:create', 'products:edit:all')
    name: string // User-friendly name (e.g., "Create Users", "Edit All Products")
    description: string // Explanation of what the permission allows
    // Optional: Add createdDate if needed
    // createdDate?: Date;
}
// --- End Item Type ---

// --- Define Filter Schema (Example - if filtering is added later) ---
/*
const filterValidationSchema = z.object({
    // Example: filter by module/group if applicable
    // module: z.array(z.string()).default([]),
});
type FilterFormSchema = z.infer<typeof filterValidationSchema>;
*/
// --- End Filter Schema ---

// --- Constants ---
const initialDummyPermissions: PermissionItem[] = [
    {
        id: 'users:create',
        name: 'Create Users',
        description: 'Allows creating new user accounts in the system.',
    },
    {
        id: 'users:read:all',
        name: 'View All Users',
        description: 'Allows viewing profiles and details of all users.',
    },
    {
        id: 'users:edit:own',
        name: 'Edit Own Profile',
        description: 'Allows a user to edit their own profile information.',
    },
    {
        id: 'users:edit:all',
        name: 'Edit All Users',
        description: 'Allows editing profiles and details of any user.',
    },
    {
        id: 'users:delete',
        name: 'Delete Users',
        description: 'Allows permanently deleting user accounts.',
    },
    {
        id: 'products:create',
        name: 'Create Products',
        description: 'Allows adding new products to the catalog.',
    },
    {
        id: 'products:edit:all',
        name: 'Edit Products',
        description: 'Allows modifying details of any existing product.',
    },
    {
        id: 'products:delete',
        name: 'Delete Products',
        description: 'Allows removing products from the catalog.',
    },
    {
        id: 'orders:read:all',
        name: 'View Orders',
        description: 'Allows viewing all customer orders.',
    },
    {
        id: 'settings:manage',
        name: 'Manage Settings',
        description:
            'Allows access to and modification of system-wide settings.',
    },
    {
        id: 'reports:view:sales',
        name: 'View Sales Reports',
        description: 'Allows viewing financial and sales performance reports.',
    },
    {
        id: 'roles:assign',
        name: 'Assign Roles',
        description: 'Allows assigning roles and permissions to users.',
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
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
        <div className="flex items-center justify-end gap-2">
            <Tooltip title="Edit Permission">
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
            <Tooltip title="Delete Permission">
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

// --- PermissionTable Component ---
const PermissionTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedPermissions,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<PermissionItem>[]
    data: PermissionItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedPermissions: PermissionItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: PermissionItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<PermissionItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedPermissions.some((selected) => selected.id === row.id)
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
// --- End PermissionTable ---

// --- PermissionSearch Component ---
type PermissionSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const PermissionSearch = React.forwardRef<
    HTMLInputElement,
    PermissionSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Search Permissions (ID, Name, Description...)"
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
PermissionSearch.displayName = 'PermissionSearch'
// --- End PermissionSearch ---

// --- PermissionTableTools Component ---
const PermissionTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (
        query: string,
    ) => void /* Add filter props if filter added */
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full">
            <div className="flex-grow">
                <PermissionSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter button would go here if added */}
            {/* <div className="flex-shrink-0"><PermissionFilter filterData={filterData} setFilterData={setFilterData} uniqueOptions={uniqueOptions} /></div> */}
        </div>
    )
}
// --- End PermissionTableTools ---

// --- ActiveFiltersDisplay Component (Placeholder if filters are added) ---
/*
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: FilterFormSchema; onRemoveFilter: (key: keyof FilterFormSchema, value: string) => void; onClearAll: () => void; }) => {
    // ... logic to display active filters ...
    if (!hasActiveFilters) return null;
    return ( <div ...> ... </div> );
};
*/
// --- End ActiveFiltersDisplay ---

// --- PermissionActionTools Component ---
const PermissionActionTools = ({
    allPermissions,
}: {
    allPermissions: PermissionItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allPermissions.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
            })),
        [allPermissions],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Description', key: 'description' },
    ]
    const handleAdd = () => navigate('/permissions/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block>
                {' '}
                Add new Permission{' '}
            </Button>{' '}
        </div>
    )
}
// --- End PermissionActionTools ---

// --- PermissionSelected Component ---
const PermissionSelected = ({
    selectedPermissions,
    setSelectedPermissions,
    onDeleteSelected,
}: {
    selectedPermissions: PermissionItem[]
    setSelectedPermissions: React.Dispatch<
        React.SetStateAction<PermissionItem[]>
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

    if (selectedPermissions.length === 0) return null

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
                                {selectedPermissions.length}
                            </span>
                            <span>
                                Permission
                                {selectedPermissions.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedPermissions.length} Permission${selectedPermissions.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected permission
                    {selectedPermissions.length > 1 ? 's' : ''}? This action
                    cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End PermissionSelected ---

// --- Main PermissionsListing Component ---
const PermissionsListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [permissions, setPermissions] = useState<PermissionItem[]>(
        initialDummyPermissions,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedPermissions, setSelectedPermissions] = useState<
        PermissionItem[]
    >([])
    // Filter state (uncomment if adding filter)
    // const [filterData, setFilterData] = useState<FilterFormSchema>(filterValidationSchema.parse({}));
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...permissions]

        // Apply Filtering (if added)
        // if (filterData.someFilterField && filterData.someFilterField.length > 0) { ... }

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (p) =>
                    p.id.toLowerCase().includes(query) ||
                    p.name.toLowerCase().includes(query) ||
                    p.description.toLowerCase().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                // Add date sorting if createdDate is added
                // if (key === 'createdDate' && a.createdDate && b.createdDate) { ... }
                const aValue = a[key as keyof PermissionItem] ?? ''
                const bValue = b[key as keyof PermissionItem] ?? ''
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
    }, [permissions, tableData /*, filterData */]) // Add filterData dependency if used
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
            setSelectedPermissions([])
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
    // Filter handlers would go here if added
    // const handleApplyFilter = useCallback((newFilterData: FilterFormSchema) => { ... });
    // const handleRemoveFilter = useCallback((key: keyof FilterFormSchema, value: string) => { ... });
    // const handleClearAllFilters = useCallback(() => { ... });

    const handleRowSelect = useCallback(
        (checked: boolean, row: PermissionItem) => {
            setSelectedPermissions((prev) => {
                if (checked) {
                    return prev.some((p) => p.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((p) => p.id !== row.id)
                }
            })
        },
        [setSelectedPermissions],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<PermissionItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedPermissions((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((p) => p.id))
                    const newSelection = originalRows.filter(
                        (p) => !existingIds.has(p.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((p) => !rowIds.has(p.id))
                }
            })
        },
        [setSelectedPermissions],
    )

    const handleEdit = useCallback(
        (permission: PermissionItem) => {
            console.log('Edit permission:', permission.id)
            navigate(`/permissions/edit/${permission.id}`) // Adjust route
        },
        [navigate],
    )

    const handleDelete = useCallback(
        (permissionToDelete: PermissionItem) => {
            console.log('Deleting permission:', permissionToDelete.id)
            setPermissions((current) =>
                current.filter((p) => p.id !== permissionToDelete.id),
            )
            setSelectedPermissions((prev) =>
                prev.filter((p) => p.id !== permissionToDelete.id),
            )
            toast.push(
                <Notification
                    title="Permission Deleted"
                    type="success"
                    duration={2000}
                >{`Permission '${permissionToDelete.name}' deleted.`}</Notification>,
            )
        },
        [setPermissions, setSelectedPermissions],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected permissions:',
            selectedPermissions.map((p) => p.id),
        )
        const selectedIds = new Set(selectedPermissions.map((p) => p.id))
        setPermissions((current) =>
            current.filter((p) => !selectedIds.has(p.id)),
        )
        setSelectedPermissions([])
        toast.push(
            <Notification
                title="Permissions Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} permission(s) deleted.`}</Notification>,
        )
    }, [selectedPermissions, setPermissions, setSelectedPermissions])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<PermissionItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                width: 200,
            }, // Give ID more space potentially
            { header: 'Name', accessorKey: 'name', enableSorting: true },
            {
                header: 'Description',
                accessorKey: 'description',
                enableSorting: false, // Less common to sort description
                cell: (props) => (
                    <Tooltip
                        title={props.row.original.description}
                        wrapperClass="w-full"
                    >
                        <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-md">
                            {' '}
                            {/* Adjust max-w */}
                            {props.row.original.description}
                        </span>
                    </Tooltip>
                ),
            },
            // { header: 'Created Date', ... }, // Optional
            {
                header: '',
                id: 'action',
                width: 100,
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
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
                    <h3 className="mb-4 lg:mb-0">Permissions Listing</h3>
                    <PermissionActionTools allPermissions={permissions} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <PermissionTableTools
                        onSearchChange={handleSearchChange}
                        // Pass filter props if filter added
                        // filterData={filterData}
                        // setFilterData={handleApplyFilter}
                    />
                </div>

                {/* Active Filters Display Area (if filter added) */}
                {/* <ActiveFiltersDisplay ... /> */}

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <PermissionTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedPermissions={selectedPermissions}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <PermissionSelected
                selectedPermissions={selectedPermissions}
                setSelectedPermissions={setSelectedPermissions}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default PermissionsListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
