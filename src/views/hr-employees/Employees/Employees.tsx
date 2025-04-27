// src/views/your-path/EmployeesListing.tsx (New file name)

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
import Dialog from '@/components/ui/Dialog' // Keep for potential view/change pwd modals
import Avatar from '@/components/ui/Avatar' // For Name/initials
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbUserCircle, TbKey } from 'react-icons/tb' // Icons

// Icons
import {
    TbPencil, // Edit
    TbTrash, // Delete
    TbEye, // View
    // TbSwitchHorizontal, // Status change (can be handled differently or removed if status is simple active/inactive)
    TbChecks, // Selected Footer
    TbSearch,
    TbCloudDownload, // Optional export
    TbUserPlus, // Add user
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { Input } from '@/components/ui'

// --- Define Item Type ---
export type EmployeeItem = {
    id: string // Unique Employee ID
    status: 'active' | 'inactive' | 'on_leave' | 'terminated' // Employee statuses
    name: string
    email: string
    mobile: string | null
    department: string
    designation: string
    roles: string[] // Array of role names/IDs
    avatar?: string | null // Optional avatar image URL
    createdAt: Date
}
// --- End Item Type ---

// --- Constants ---
const employeeStatusColor: Record<EmployeeItem['status'], string> = {
    active: 'bg-emerald-500',
    inactive: 'bg-gray-500',
    on_leave: 'bg-amber-500',
    terminated: 'bg-red-500',
}

const initialDummyEmployees: EmployeeItem[] = [
    {
        id: 'EMP001',
        status: 'active',
        name: 'Alice Wonderland',
        email: 'alice.w@company.com',
        mobile: '+1-555-1001',
        department: 'Engineering',
        designation: 'Software Engineer II',
        roles: ['Developer', 'Code Reviewer'],
        avatar: '/img/avatars/thumb-1.jpg',
        createdAt: new Date(2022, 5, 15),
    },
    {
        id: 'EMP002',
        status: 'active',
        name: 'Bob The Builder',
        email: 'bob.b@company.com',
        mobile: '+1-555-1002',
        department: 'Marketing',
        designation: 'Marketing Manager',
        roles: ['Manager', 'Campaign Planner'],
        avatar: '/img/avatars/thumb-2.jpg',
        createdAt: new Date(2021, 8, 1),
    },
    {
        id: 'EMP003',
        status: 'on_leave',
        name: 'Charlie Chaplin',
        email: 'charlie.c@company.com',
        mobile: null,
        department: 'Sales',
        designation: 'Sales Representative',
        roles: ['Sales Rep'],
        avatar: '/img/avatars/thumb-3.jpg',
        createdAt: new Date(2022, 11, 10),
    },
    {
        id: 'EMP004',
        status: 'active',
        name: 'Diana Prince',
        email: 'diana.p@company.com',
        mobile: '+1-555-1004',
        department: 'HR',
        designation: 'HR Specialist',
        roles: ['HR Admin', 'Recruiter'],
        avatar: '/img/avatars/thumb-4.jpg',
        createdAt: new Date(2023, 2, 20),
    },
    {
        id: 'EMP005',
        status: 'inactive',
        name: 'Ethan Hunt',
        email: 'ethan.h@company.com',
        mobile: '+1-555-1005',
        department: 'Operations',
        designation: 'Logistics Coordinator',
        roles: ['Logistics'],
        avatar: '/img/avatars/thumb-5.jpg',
        createdAt: new Date(2022, 1, 5),
    },
    {
        id: 'EMP006',
        status: 'terminated',
        name: 'Fiona Shrek',
        email: 'fiona.s@company.com',
        mobile: null,
        department: 'Finance',
        designation: 'Accountant',
        roles: ['Finance User'],
        avatar: '/img/avatars/thumb-6.jpg',
        createdAt: new Date(2021, 3, 12),
    },
    {
        id: 'EMP007',
        status: 'active',
        name: 'George Jungle',
        email: 'george.j@company.com',
        mobile: '+1-555-1007',
        department: 'Support',
        designation: 'Support Team Lead',
        roles: ['Support Lead', 'Agent'],
        avatar: '/img/avatars/thumb-7.jpg',
        createdAt: new Date(2023, 0, 30),
    },
    {
        id: 'EMP008',
        status: 'active',
        name: 'Hermione Granger',
        email: 'hermione.g@company.com',
        mobile: '+44-20-1111-2222',
        department: 'Engineering',
        designation: 'Senior Software Engineer',
        roles: ['Developer', 'Architect'],
        avatar: '/img/avatars/thumb-8.jpg',
        createdAt: new Date(2020, 10, 22),
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onView,
    onEdit,
    onDelete,
    onChangePassword,
    // Add onChangeStatus if needed
}: {
    onView: () => void
    onEdit: () => void
    onDelete: () => void
    onChangePassword: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-end gap-2">
            {/* View Button */}
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
            {/* Edit Button */}
            <Tooltip title="Edit Employee">
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
            {/* Change Password Button */}
            <Tooltip title="Change Password">
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
            {/* Delete Button */}
            <Tooltip title="Delete Employee">
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

// --- EmployeeTable Component ---
const EmployeeTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedEmployees,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<EmployeeItem>[]
    data: EmployeeItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedEmployees: EmployeeItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: EmployeeItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<EmployeeItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedEmployees.some((selected) => selected.id === row.id)
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
// --- End EmployeeTable ---

// --- EmployeeSearch Component ---
type EmployeeSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const EmployeeSearch = React.forwardRef<HTMLInputElement, EmployeeSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Search Employees (Name, Email, Dept, Role...)"
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
EmployeeSearch.displayName = 'EmployeeSearch'
// --- End EmployeeSearch ---

// --- EmployeeTableTools Component ---
const EmployeeTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <EmployeeSearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
    // Filter button could be added here
}
// --- End EmployeeTableTools ---

// --- EmployeeActionTools Component ---
const EmployeeActionTools = ({
    allEmployees,
}: {
    allEmployees: EmployeeItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allEmployees.map((e) => ({
                ...e,
                roles: e.roles.join(', '),
                createdAt: e.createdAt.toISOString(),
            })),
        [allEmployees],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Status', key: 'status' },
        { label: 'Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Mobile', key: 'mobile' },
        { label: 'Department', key: 'department' },
        { label: 'Designation', key: 'designation' },
        { label: 'Roles', key: 'roles' },
        { label: 'Created At', key: 'createdAt' },
    ]
    const handleAdd = () => navigate('/employees/create') // Adjust route

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
                Add new Employee{' '}
            </Button>{' '}
        </div>
    )
}
// --- End EmployeeActionTools ---

// --- EmployeeSelected Component ---
const EmployeeSelected = ({
    selectedEmployees,
    setSelectedEmployees,
    onDeleteSelected,
}: {
    selectedEmployees: EmployeeItem[]
    setSelectedEmployees: React.Dispatch<React.SetStateAction<EmployeeItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedEmployees.length === 0) return null

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
                                {selectedEmployees.length}
                            </span>
                            <span>
                                Employee
                                {selectedEmployees.length > 1 ? 's' : ''}{' '}
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
                        {/* Add other bulk actions like "Change Status", "Assign Role" */}
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedEmployees.length} Employee${selectedEmployees.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected employee
                    {selectedEmployees.length > 1 ? 's' : ''}? This action
                    cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End EmployeeSelected ---

// --- Detail/Password Change Dialogs (Example placeholders) ---
const EmployeeDetailViewDialog = ({
    isOpen,
    onClose,
    employee,
}: {
    isOpen: boolean
    onClose: () => void
    employee: EmployeeItem | null
}) => {
    if (!employee) return null
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            width={600}
        >
            <h5 className="mb-4">Employee Details: {employee.name}</h5>
            {/* Display employee details here */}
            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">
                {JSON.stringify(employee, null, 2)}
            </pre>
            <div className="text-right mt-6">
                <Button variant="solid" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Dialog>
    )
}

const ChangePasswordDialog = ({
    isOpen,
    onClose,
    employee,
}: {
    isOpen: boolean
    onClose: () => void
    employee: EmployeeItem | null
}) => {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isChanging, setIsChanging] = useState(false)

    const handlePasswordChange = () => {
        if (!employee) return
        if (newPassword !== confirmPassword || newPassword.length < 8) {
            toast.push(
                <Notification title="Password Error" type="danger">
                    Passwords do not match or are too short.
                </Notification>,
            )
            return
        }
        setIsChanging(true)
        console.log(`Changing password for ${employee.email} to ${newPassword}`)
        // Simulate API call
        setTimeout(() => {
            toast.push(
                <Notification
                    title="Password Changed"
                    type="success"
                >{`Password for ${employee.name} updated.`}</Notification>,
            )
            setIsChanging(false)
            onClose()
            setNewPassword('')
            setConfirmPassword('')
        }, 1000)
    }

    // Reset fields when dialog closes or employee changes
    React.useEffect(() => {
        if (!isOpen) {
            setNewPassword('')
            setConfirmPassword('')
        }
    }, [isOpen])

    if (!employee) return null

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            onRequestClose={onClose}
            width={400}
        >
            <h5 className="mb-4">Change Password for {employee.name}</h5>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                    New Password
                </label>
                <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                    Confirm New Password
                </label>
                <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
            <div className="text-right mt-6">
                <Button
                    size="sm"
                    className="mr-2"
                    onClick={onClose}
                    disabled={isChanging}
                >
                    Cancel
                </Button>
                <Button
                    size="sm"
                    variant="solid"
                    onClick={handlePasswordChange}
                    loading={isChanging}
                >
                    Change Password
                </Button>
            </div>
        </Dialog>
    )
}
// --- End Dialogs ---

// --- Main EmployeesListing Component ---
const EmployeesListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [employees, setEmployees] = useState<EmployeeItem[]>(
        initialDummyEmployees,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedEmployees, setSelectedEmployees] = useState<EmployeeItem[]>(
        [],
    )
    const [detailViewOpen, setDetailViewOpen] = useState(false)
    const [changePwdOpen, setChangePwdOpen] = useState(false)
    const [currentItem, setCurrentItem] = useState<EmployeeItem | null>(null) // For both view and pwd change
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...employees]
        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (e) =>
                    e.id.toLowerCase().includes(query) ||
                    e.name.toLowerCase().includes(query) ||
                    e.email.toLowerCase().includes(query) ||
                    (e.mobile?.toLowerCase().includes(query) ?? false) ||
                    e.department.toLowerCase().includes(query) ||
                    e.designation.toLowerCase().includes(query) ||
                    e.roles.some((role) =>
                        role.toLowerCase().includes(query),
                    ) ||
                    e.status.toLowerCase().includes(query),
            )
        }
        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'createdAt') {
                    return order === 'asc'
                        ? a.createdAt.getTime() - b.createdAt.getTime()
                        : b.createdAt.getTime() - a.createdAt.getTime()
                }
                if (key === 'roles') {
                    // Sort by first role alphabetically
                    const roleA = a.roles?.[0] ?? ''
                    const roleB = b.roles?.[0] ?? ''
                    return order === 'asc'
                        ? roleA.localeCompare(roleB)
                        : roleB.localeCompare(roleA)
                }
                const aValue = a[key as keyof EmployeeItem] ?? ''
                const bValue = b[key as keyof EmployeeItem] ?? ''
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
    }, [employees, tableData])
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
            setSelectedEmployees([])
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
        (checked: boolean, row: EmployeeItem) => {
            setSelectedEmployees((prev) => {
                if (checked) {
                    return prev.some((e) => e.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((e) => e.id !== row.id)
                }
            })
        },
        [setSelectedEmployees],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<EmployeeItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedEmployees((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((e) => e.id))
                    const newSelection = originalRows.filter(
                        (e) => !existingIds.has(e.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((e) => !rowIds.has(e.id))
                }
            })
        },
        [setSelectedEmployees],
    )

    const handleViewDetails = useCallback((employee: EmployeeItem) => {
        setCurrentItem(employee)
        setDetailViewOpen(true)
    }, [])
    const handleCloseDetailView = useCallback(() => {
        setDetailViewOpen(false)
        setCurrentItem(null)
    }, [])
    const handleChangePassword = useCallback((employee: EmployeeItem) => {
        setCurrentItem(employee)
        setChangePwdOpen(true)
    }, [])
    const handleCloseChangePwd = useCallback(() => {
        setChangePwdOpen(false)
        setCurrentItem(null)
    }, [])

    const handleEdit = useCallback(
        (employee: EmployeeItem) => {
            console.log('Edit employee:', employee.id)
            navigate(`/employees/edit/${employee.id}`) // Adjust route
        },
        [navigate],
    )

    // Status change handler (if simple toggle is needed)
    // const handleChangeStatus = useCallback((employee: EmployeeItem) => { ... }, [setEmployees]);

    const handleDelete = useCallback(
        (employeeToDelete: EmployeeItem) => {
            console.log('Deleting employee:', employeeToDelete.id)
            // Confirmation should happen before this in a real app
            setEmployees((current) =>
                current.filter((e) => e.id !== employeeToDelete.id),
            )
            setSelectedEmployees((prev) =>
                prev.filter((e) => e.id !== employeeToDelete.id),
            )
            toast.push(
                <Notification
                    title="Employee Deleted"
                    type="success"
                    duration={2000}
                >{`Employee '${employeeToDelete.name}' deleted.`}</Notification>,
            )
        },
        [setEmployees, setSelectedEmployees],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected employees:',
            selectedEmployees.map((e) => e.id),
        )
        const selectedIds = new Set(selectedEmployees.map((e) => e.id))
        setEmployees((current) => current.filter((e) => !selectedIds.has(e.id)))
        setSelectedEmployees([])
        toast.push(
            <Notification
                title="Employees Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} employee(s) deleted.`}</Notification>,
        )
    }, [selectedEmployees, setEmployees, setSelectedEmployees])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<EmployeeItem>[] = useMemo(
        () => [
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                width: 120,
                cell: (props) => {
                    const { status } = props.row.original
                    const displayStatus = status
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return (
                        <Tag
                            className={`${employeeStatusColor[status]} text-white capitalize`}
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
                                {!avatar ? name.charAt(0).toUpperCase() : ''}
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
                enableSorting: true,
                cell: (props) => (
                    <span>{props.row.original.mobile ?? '-'}</span>
                ),
            },
            {
                header: 'Department',
                accessorKey: 'department',
                enableSorting: true,
            },
            {
                header: 'Designation',
                accessorKey: 'designation',
                enableSorting: true,
            },
            {
                header: 'Roles',
                accessorKey: 'roles',
                enableSorting: true, // Sorts by first role
                cell: (props) => (
                    <div className="flex flex-wrap gap-1">
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
                header: 'Created At',
                accessorKey: 'createdAt',
                enableSorting: true,
                width: 180,
                cell: (props) => {
                    const date = props.row.original.createdAt
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
                width: 150, // Wider for more actions
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleViewDetails(props.row.original)}
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                        onChangePassword={() =>
                            handleChangePassword(props.row.original)
                        }
                        // Add onChangeStatus if needed
                    />
                ),
            },
        ],
        [handleViewDetails, handleEdit, handleDelete, handleChangePassword], // Update dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Employees Listing</h3>
                    <EmployeeActionTools allEmployees={employees} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <EmployeeTableTools onSearchChange={handleSearchChange} />
                    {/* Filter component could be added here */}
                </div>

                {/* Active Filters Display (if filter added) */}
                {/* <ActiveFiltersDisplay ... /> */}

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <EmployeeTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedEmployees={selectedEmployees}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <EmployeeSelected
                selectedEmployees={selectedEmployees}
                setSelectedEmployees={setSelectedEmployees}
                onDeleteSelected={handleDeleteSelected}
            />

            {/* Detail View Dialog */}
            <EmployeeDetailViewDialog
                isOpen={detailViewOpen}
                onClose={handleCloseDetailView}
                employee={currentItem}
            />

            {/* Change Password Dialog */}
            <ChangePasswordDialog
                isOpen={changePwdOpen}
                onClose={handleCloseChangePwd}
                employee={currentItem}
            />
        </Container>
    )
}
// --- End Main Component ---

export default EmployeesListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
