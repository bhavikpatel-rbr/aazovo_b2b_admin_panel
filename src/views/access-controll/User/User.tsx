// src/views/your-path/UserListing.tsx (Replacing RolesListing content)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag' // Needed for Status and Roles
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Input from '@/components/ui/Input' // For ResetPasswordDialog
import { FormContainer, FormItem as UiFormItem } from '@/components/ui/Form' // For ResetPasswordDialog
import { TbUserCircle, TbKey } from 'react-icons/tb' // Icons

// Icons
import {
    TbPencil,
    TbTrash,
    TbEye,
    TbSwitchHorizontal, // Status Change
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbUserPlus,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
type UserStatus = 'active' | 'inactive' | 'pending_invitation' | 'locked'
export type UserItem = {
    id: string
    name: string
    email: string
    avatar?: string | null
    roles: string[]
    status: UserStatus
    lastLogin: Date | null
    createdDate: Date // Renamed from addedDate
    mobile?: string | null
    // department?: string; // Uncomment if needed
    // designation?: string; // Uncomment if needed
}
// --- End Item Type ---

// --- Constants ---
const userStatusColor: Record<UserStatus, string> = {
    active: 'bg-emerald-500',
    inactive: 'bg-gray-500',
    pending_invitation: 'bg-amber-500',
    locked: 'bg-red-500',
}

// Dummy Data for Users
const initialDummyUsers: UserItem[] = [
    {
        id: 'U001',
        name: 'Alice Admin',
        email: 'alice.admin@company.com',
        avatar: '/img/avatars/thumb-1.jpg',
        roles: ['Administrator'],
        status: 'active',
        mobile: '+1-555-1111',
        lastLogin: new Date(2023, 10, 5, 14, 30),
        createdDate: new Date(2022, 1, 1),
    },
    {
        id: 'U002',
        name: 'Bob Editor',
        email: 'bob.editor@company.com',
        avatar: '/img/avatars/thumb-2.jpg',
        roles: ['Content Editor'],
        status: 'active',
        mobile: '+1-555-2222',
        lastLogin: new Date(2023, 10, 4, 9, 0),
        createdDate: new Date(2022, 2, 10),
    },
    {
        id: 'U003',
        name: 'Charlie Viewer',
        email: 'charlie.viewer@company.com',
        avatar: '/img/avatars/thumb-3.jpg',
        roles: ['Viewer'],
        status: 'inactive',
        mobile: null,
        lastLogin: new Date(2023, 8, 15, 11, 0),
        createdDate: new Date(2022, 3, 20),
    },
    {
        id: 'U004',
        name: 'Diana Invited',
        email: 'diana.invite@mail.com',
        avatar: null,
        roles: ['Sales Rep'],
        status: 'pending_invitation',
        mobile: '+1-555-4444',
        lastLogin: null,
        createdDate: new Date(2023, 10, 6, 10, 0),
    },
    {
        id: 'U005',
        name: 'Ethan Locked',
        email: 'ethan.locked@company.com',
        avatar: '/img/avatars/thumb-5.jpg',
        roles: ['Developer'],
        status: 'locked',
        mobile: '+1-555-5555',
        lastLogin: new Date(2023, 9, 1, 8, 0),
        createdDate: new Date(2022, 5, 5),
    },
    {
        id: 'U006',
        name: 'Fiona Finance',
        email: 'fiona.finance@company.com',
        avatar: '/img/avatars/thumb-6.jpg',
        roles: ['Finance User', 'Viewer'],
        status: 'active',
        mobile: null,
        lastLogin: new Date(2023, 10, 5, 16, 15),
        createdDate: new Date(2022, 7, 12),
    },
    {
        id: 'U007',
        name: 'George Support',
        email: 'george.support@company.com',
        avatar: '/img/avatars/thumb-7.jpg',
        roles: ['Support Agent'],
        status: 'active',
        mobile: '+1-555-7777',
        lastLogin: new Date(2023, 10, 6, 11, 45),
        createdDate: new Date(2023, 1, 18),
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onView,
    onEdit,
    onDelete,
    onChangePassword,
    onChangeStatus,
}: {
    onView: () => void
    onEdit: () => void
    onDelete: () => void
    onChangePassword: () => void
    onChangeStatus: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'
    return (
        <div className="flex items-center justify-end gap-2">
            <Tooltip title="View Details">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                    )}
                    role="button"
                    onClick={onView}
                >
                    <TbEye />
                </div>
            </Tooltip>
            <Tooltip title="Edit User">
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
            <Tooltip title="Reset Password">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400',
                    )}
                    role="button"
                    onClick={onChangePassword}
                >
                    <TbKey />
                </div>
            </Tooltip>
            <Tooltip title="Delete User">
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

// --- UserTable Component ---
const UserTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedUsers,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<UserItem>[]
    data: UserItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedUsers: UserItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: UserItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<UserItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedUsers.some((selected) => selected.id === row.id)
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
// --- End UserTable ---

// --- UserSearch Component ---
type UserSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const UserSearch = React.forwardRef<HTMLInputElement, UserSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Search Users (Name, Email, Role, Status...)"
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
UserSearch.displayName = 'UserSearch'
// --- End UserSearch ---

// --- UserTableTools Component ---
const UserTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <UserSearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
}
// --- End UserTableTools ---

// --- UserActionTools Component ---
const UserActionTools = ({ allUsers }: { allUsers: UserItem[] }) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allUsers.map((u) => ({
                ...u,
                roles: u.roles.join(', '),
                lastLogin: u.lastLogin?.toISOString() ?? 'Never',
                createdDate: u.createdDate.toISOString(),
            })),
        [allUsers],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Roles', key: 'roles' },
        { label: 'Status', key: 'status' },
        { label: 'Last Login', key: 'lastLogin' },
        { label: 'Created At', key: 'createdDate' },
    ]
    const handleAdd = () => navigate('/users/create')

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button
                variant="solid"
                icon={<TbUserPlus />}
                onClick={handleAdd}
                block
            >
                {' '}
                Add new User{' '}
            </Button>{' '}
        </div>
    )
}
// --- End UserActionTools ---

// --- UserSelected Component ---
const UserSelected = ({
    selectedUsers,
    setSelectedUsers,
    onDeleteSelected,
}: {
    selectedUsers: UserItem[]
    setSelectedUsers: React.Dispatch<React.SetStateAction<UserItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedUsers.length === 0) return null

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
                                {selectedUsers.length}
                            </span>
                            <span>
                                User{selectedUsers.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected user
                    {selectedUsers.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End UserSelected ---

// --- Dialogs ---
const UserDetailViewDialog = ({
    isOpen,
    onClose,
    user,
}: {
    isOpen: boolean
    onClose: () => void
    user: UserItem | null
}) => {
    if (!user) return null
    const formatDate = (date: Date | null | undefined) =>
        date ? date.toLocaleString() : 'N/A'
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            width={600}
        >
            <h5 className="mb-4">User Details: {user.name}</h5>
            <div className="space-y-2 text-sm">
                <p>
                    <strong>ID:</strong> {user.id}
                </p>
                <p>
                    <strong>Name:</strong> {user.name}
                </p>
                <p>
                    <strong>Email:</strong> {user.email}
                </p>
                <p>
                    <strong>Mobile:</strong> {user.mobile ?? 'N/A'}
                </p>
                <p>
                    <strong>Roles:</strong> {user.roles.join(', ')}
                </p>
                <p>
                    <strong>Status:</strong>{' '}
                    <Tag
                        className={`${userStatusColor[user.status]} text-white capitalize`}
                    >
                        {user.status.replace(/_/g, ' ')}
                    </Tag>
                </p>
                <p>
                    <strong>Last Login:</strong> {formatDate(user.lastLogin)}
                </p>
                <p>
                    <strong>Created At:</strong> {formatDate(user.createdDate)}
                </p>
            </div>
            <div className="text-right mt-6">
                <Button variant="solid" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Dialog>
    )
}

const ResetPasswordDialog = ({
    isOpen,
    onClose,
    user,
}: {
    isOpen: boolean
    onClose: () => void
    user: UserItem | null
}) => {
    const [isResetting, setIsResetting] = useState(false)

    const handleResetPassword = () => {
        if (!user) return
        setIsResetting(true)
        console.log(`Resetting password for ${user.email}`)
        // Simulate API call
        setTimeout(() => {
            toast.push(
                <Notification
                    title="Password Reset"
                    type="success"
                >{`Password reset link sent to ${user.name}.`}</Notification>,
            )
            setIsResetting(false)
            onClose()
        }, 1000)
    }

    if (!user) return null

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            width={400}
        >
            <h5 className="mb-4">Reset Password</h5>
            <p className="mb-6">
                Are you sure you want to trigger a password reset for{' '}
                <strong>{user.name}</strong> ({user.email})?
            </p>
            <div className="text-right">
                <Button
                    size="sm"
                    className="mr-2"
                    onClick={onClose}
                    disabled={isResetting}
                >
                    Cancel
                </Button>
                <Button
                    size="sm"
                    variant="solid"
                    color="orange-600"
                    onClick={handleResetPassword}
                    loading={isResetting}
                >
                    Send Reset Link
                </Button>
            </div>
        </Dialog>
    )
}
// --- End Dialogs ---

// --- Main UserListing Component ---
const UserListing = () => {
    // Renamed Component
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [users, setUsers] = useState<UserItem[]>(initialDummyUsers) // Use user state name
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedUsers, setSelectedUsers] = useState<UserItem[]>([]) // Use user state name
    const [detailViewOpen, setDetailViewOpen] = useState(false)
    const [resetPwdOpen, setResetPwdOpen] = useState(false)
    const [currentItem, setCurrentItem] = useState<UserItem | null>(null)
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...users] // Use user state name
        // Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (u) =>
                    u.id.toLowerCase().includes(query) ||
                    u.name.toLowerCase().includes(query) ||
                    u.email.toLowerCase().includes(query) ||
                    (u.mobile?.toLowerCase().includes(query) ?? false) ||
                    u.roles.some((role) =>
                        role.toLowerCase().includes(query),
                    ) ||
                    u.status.toLowerCase().includes(query),
            )
        }
        // Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'createdDate' || key === 'lastLogin') {
                    const timeA =
                        a[key]?.getTime() ??
                        (order === 'asc' ? Infinity : -Infinity)
                    const timeB =
                        b[key]?.getTime() ??
                        (order === 'asc' ? Infinity : -Infinity)
                    return order === 'asc' ? timeA - timeB : timeB - timeA
                }
                if (key === 'roles') {
                    const roleA = a.roles?.[0] ?? ''
                    const roleB = b.roles?.[0] ?? ''
                    return order === 'asc'
                        ? roleA.localeCompare(roleB)
                        : roleB.localeCompare(roleA)
                }
                const aValue = a[key as keyof UserItem] ?? ''
                const bValue = b[key as keyof UserItem] ?? ''
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
    }, [users, tableData]) // Use user state name
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
            setSelectedUsers([])
        },
        [tableData, handleSetTableData, setSelectedUsers],
    ) // Corrected setter
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
        (checked: boolean, row: UserItem) => {
            setSelectedUsers((prev) => {
                // Corrected setter
                if (checked) {
                    return prev.some((u) => u.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((u) => u.id !== row.id)
                }
            })
        },
        [setSelectedUsers],
    ) // Corrected dependency

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<UserItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedUsers((prev) => {
                // Corrected setter
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((u) => u.id))
                    const newSelection = originalRows.filter(
                        (u) => !existingIds.has(u.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((u) => !rowIds.has(u.id))
                }
            })
        },
        [setSelectedUsers],
    ) // Corrected dependency

    const handleViewDetails = useCallback(
        (user: UserItem) => {
            setCurrentItem(user)
            setDetailViewOpen(true)
        },
        [setCurrentItem, setDetailViewOpen],
    )
    const handleCloseDetailView = useCallback(() => {
        setDetailViewOpen(false)
        setCurrentItem(null)
    }, [setCurrentItem, setDetailViewOpen])
    const handleOpenResetPwd = useCallback(
        (user: UserItem) => {
            setCurrentItem(user)
            setResetPwdOpen(true)
        },
        [setCurrentItem, setResetPwdOpen],
    )
    const handleCloseResetPwd = useCallback(() => {
        setResetPwdOpen(false)
        setCurrentItem(null)
    }, [setCurrentItem, setResetPwdOpen])

    const handleEdit = useCallback(
        (user: UserItem) => {
            console.log('Edit user:', user.id)
            navigate(`/users/edit/${user.id}`)
        },
        [navigate],
    )

    const handleChangeStatus = useCallback(
        (user: UserItem) => {
            const statuses: UserStatus[] = [
                'active',
                'inactive',
                'pending_invitation',
                'locked',
            ]
            const currentStatusIndex = statuses.indexOf(user.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
            console.log(`Changing status of user ${user.id} to ${newStatus}`)
            setUsers((current) =>
                current.map((u) =>
                    u.id === user.id ? { ...u, status: newStatus } : u,
                ),
            ) // Use correct setter
            toast.push(
                <Notification
                    title="Status Changed"
                    type="success"
                    duration={2000}
                >{`User '${user.name}' status changed to ${newStatus}.`}</Notification>,
            )
        },
        [setUsers],
    ) // Corrected dependency

    const handleDelete = useCallback(
        (userToDelete: UserItem) => {
            console.log('Deleting user:', userToDelete.id)
            setUsers((current) =>
                current.filter((u) => u.id !== userToDelete.id),
            ) // Use correct setter
            setSelectedUsers((prev) =>
                prev.filter((u) => u.id !== userToDelete.id),
            ) // Corrected setter
            toast.push(
                <Notification
                    title="User Deleted"
                    type="success"
                    duration={2000}
                >{`User '${userToDelete.name}' deleted.`}</Notification>,
            )
        },
        [setUsers, setSelectedUsers],
    ) // Corrected dependencies

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected users:',
            selectedUsers.map((u) => u.id),
        ) // Corrected state variable
        const selectedIds = new Set(selectedUsers.map((u) => u.id)) // Corrected state variable
        setUsers((current) => current.filter((u) => !selectedIds.has(u.id))) // Use correct setter
        setSelectedUsers([]) // Corrected setter
        toast.push(
            <Notification
                title="Users Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} user(s) deleted.`}</Notification>,
        )
    }, [selectedUsers, setUsers, setSelectedUsers]) // Corrected dependencies
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<UserItem>[] = useMemo(
        () => [
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                width: 180,
                cell: (props) => {
                    const { status } = props.row.original
                    const displayStatus = status
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return (
                        <Tag
                            className={`${userStatusColor[status]} text-white capitalize`}
                        >
                            {displayStatus}
                        </Tag>
                    )
                },
            },
            {
                header: 'Name',
                accessorKey: 'name',
                enableSorting: true,
                cell: (props) => {
                    const { name, email, avatar } = props.row.original
                    return (
                        <div className="flex items-center">
                            <Avatar
                                size={28}
                                shape="circle"
                                src={avatar}
                                icon={<TbUserCircle />}
                            >
                                {' '}
                                {!avatar
                                    ? name.charAt(0).toUpperCase()
                                    : ''}{' '}
                            </Avatar>
                            <div className="ml-2 rtl:mr-2">
                                <span className="font-semibold">{name}</span>
                                <div className="text-xs text-gray-500">
                                    {email}
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: 'Mobile',
                accessorKey: 'mobile',
                enableSorting: false,
                width: 150,
                cell: (props) => (
                    <span>{props.row.original.mobile ?? '-'}</span>
                ),
            },
            // { header: 'Department', ... }, // Uncomment if added
            // { header: 'Designation', ... }, // Uncomment if added
            {
                header: 'Roles',
                accessorKey: 'roles',
                enableSorting: true,
                cell: (props) => (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {props.row.original.roles.map((role) => (
                            <Tag
                                key={role}
                                className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100"
                            >
                                {role}
                            </Tag>
                        ))}
                    </div>
                ),
            },
            {
                header: 'Last Login',
                accessorKey: 'lastLogin',
                enableSorting: true,
                width: 180,
                cell: (props) => {
                    const date = props.row.original.lastLogin
                    return date ? (
                        <span>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    ) : (
                        <span className="italic text-gray-400">Never</span>
                    )
                },
            },
            {
                header: 'Created At',
                accessorKey: 'createdAt',
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
                width: 180,
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleViewDetails(props.row.original)}
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onChangePassword={() =>
                            handleOpenResetPwd(props.row.original)
                        }
                    />
                ),
            },
        ],
        [
            handleViewDetails,
            handleEdit,
            handleDelete,
            handleChangeStatus,
            handleOpenResetPwd,
        ],
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">User Management</h3>
                    <UserActionTools allUsers={users} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <UserTableTools onSearchChange={handleSearchChange} />
                    {/* Filter component could be added here */}
                </div>

                {/* Active Filters Display (if filter added) */}
                {/* <ActiveFiltersDisplay ... /> */}

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <UserTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedUsers={selectedUsers} // Correct prop
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <UserSelected
                selectedUsers={selectedUsers} // Correct prop
                setSelectedUsers={setSelectedUsers} // Correct prop
                onDeleteSelected={handleDeleteSelected}
            />

            {/* Detail View Dialog */}
            <UserDetailViewDialog
                isOpen={detailViewOpen}
                onClose={handleCloseDetailView}
                user={currentItem}
            />

            {/* Reset Password Dialog */}
            <ResetPasswordDialog
                isOpen={resetPwdOpen}
                onClose={handleCloseResetPwd}
                user={currentItem}
            />
        </Container>
    )
}
// --- End Main Component ---

export default UserListing // Corrected export name

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
