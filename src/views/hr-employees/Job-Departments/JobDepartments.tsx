// src/views/your-path/JobDepartmentsListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog' // Keep for potential future use
import Avatar from '@/components/ui/Avatar' // Keep if needed (e.g., generic icon)
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbBuildingCommunity } from 'react-icons/tb' // Placeholder icon

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
export type JobDepartmentItem = {
    id: string // Unique Department ID
    name: string // e.g., "Engineering", "Marketing", "Sales"
    // Optional: Add description or other relevant fields later
    // description?: string;
    // createdDate?: Date;
}
// --- End Item Type ---

// --- Constants ---
const initialDummyJobDepartments: JobDepartmentItem[] = [
    { id: 'JOBDEPT001', name: 'Engineering & Technology' },
    { id: 'JOBDEPT002', name: 'Marketing & Communications' },
    { id: 'JOBDEPT003', name: 'Sales & Business Development' },
    { id: 'JOBDEPT004', name: 'Human Resources (People Ops)' },
    { id: 'JOBDEPT005', name: 'Operations & Logistics' },
    { id: 'JOBDEPT006', name: 'Finance & Accounting' },
    { id: 'JOBDEPT007', name: 'Customer Success & Support' },
    { id: 'JOBDEPT008', name: 'Product Management' },
    { id: 'JOBDEPT009', name: 'Design & UX/UI' },
    { id: 'JOBDEPT010', name: 'Data Science & Analytics' },
    { id: 'JOBDEPT011', name: 'IT Infrastructure' },
    { id: 'JOBDEPT012', name: 'Legal & Compliance' },
    { id: 'JOBDEPT013', name: 'Administration & Office Management' },
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
            <Tooltip title="Edit Department">
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
            <Tooltip title="Delete Department">
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

// --- DepartmentTable Component ---
const DepartmentTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedDepartments,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<JobDepartmentItem>[]
    data: JobDepartmentItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedDepartments: JobDepartmentItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: JobDepartmentItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<JobDepartmentItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedDepartments.some((selected) => selected.id === row.id)
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
// --- End DepartmentTable ---

// --- DepartmentSearch Component ---
type DepartmentSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const DepartmentSearch = React.forwardRef<
    HTMLInputElement,
    DepartmentSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Search Job Departments (ID, Name...)"
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
DepartmentSearch.displayName = 'DepartmentSearch'
// --- End DepartmentSearch ---

// --- DepartmentTableTools Component ---
const DepartmentTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <DepartmentSearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
}
// --- End DepartmentTableTools ---

// --- DepartmentActionTools Component ---
const DepartmentActionTools = ({
    allDepartments,
}: {
    allDepartments: JobDepartmentItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () => allDepartments.map((d) => ({ id: d.id, name: d.name })),
        [allDepartments],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
    ]
    const handleAdd = () => navigate('/job-departments/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block>
                {' '}
                Add new Department{' '}
            </Button>{' '}
        </div>
    )
}
// --- End DepartmentActionTools ---

// --- DepartmentSelected Component ---
const DepartmentSelected = ({
    selectedDepartments,
    setSelectedDepartments,
    onDeleteSelected,
}: {
    selectedDepartments: JobDepartmentItem[]
    setSelectedDepartments: React.Dispatch<
        React.SetStateAction<JobDepartmentItem[]>
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

    if (selectedDepartments.length === 0) return null

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
                                {selectedDepartments.length}
                            </span>
                            <span>
                                Department
                                {selectedDepartments.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedDepartments.length} Department${selectedDepartments.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected department
                    {selectedDepartments.length > 1 ? 's' : ''}? This action
                    cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End DepartmentSelected ---

// --- Main JobDepartmentsListing Component ---
const JobDepartmentsListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [departments, setDepartments] = useState<JobDepartmentItem[]>(
        initialDummyJobDepartments,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedDepartments, setSelectedDepartments] = useState<
        JobDepartmentItem[]
    >([])
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...departments]

        // Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (d) =>
                    d.id.toLowerCase().includes(query) ||
                    d.name.toLowerCase().includes(query),
            )
        }

        // Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                const aValue = a[key as keyof JobDepartmentItem] ?? ''
                const bValue = b[key as keyof JobDepartmentItem] ?? ''
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
    }, [departments, tableData])
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
            setSelectedDepartments([])
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
        (checked: boolean, row: JobDepartmentItem) => {
            setSelectedDepartments((prev) => {
                if (checked) {
                    return prev.some((d) => d.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((d) => d.id !== row.id)
                }
            })
        },
        [setSelectedDepartments],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<JobDepartmentItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedDepartments((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((d) => d.id))
                    const newSelection = originalRows.filter(
                        (d) => !existingIds.has(d.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((d) => !rowIds.has(d.id))
                }
            })
        },
        [setSelectedDepartments],
    )

    const handleEdit = useCallback(
        (department: JobDepartmentItem) => {
            console.log('Edit department:', department.id)
            navigate(`/job-departments/edit/${department.id}`) // Adjust route
        },
        [navigate],
    )

    const handleDelete = useCallback(
        (departmentToDelete: JobDepartmentItem) => {
            console.log('Deleting department:', departmentToDelete.id)
            setDepartments((current) =>
                current.filter((d) => d.id !== departmentToDelete.id),
            )
            setSelectedDepartments((prev) =>
                prev.filter((d) => d.id !== departmentToDelete.id),
            )
            toast.push(
                <Notification
                    title="Department Deleted"
                    type="success"
                    duration={2000}
                >{`Department '${departmentToDelete.name}' deleted.`}</Notification>,
            )
        },
        [setDepartments, setSelectedDepartments],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected departments:',
            selectedDepartments.map((d) => d.id),
        )
        const selectedIds = new Set(selectedDepartments.map((d) => d.id))
        setDepartments((current) =>
            current.filter((d) => !selectedIds.has(d.id)),
        )
        setSelectedDepartments([])
        toast.push(
            <Notification
                title="Departments Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} department(s) deleted.`}</Notification>,
        )
    }, [selectedDepartments, setDepartments, setSelectedDepartments])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<JobDepartmentItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                width: 120,
            },
            {
                header: 'Department Name',
                accessorKey: 'name',
                enableSorting: true,
            },
            // Add other columns like description if needed
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
                    <h3 className="mb-4 lg:mb-0">Job Departments</h3>
                    <DepartmentActionTools allDepartments={departments} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <DepartmentTableTools onSearchChange={handleSearchChange} />
                    {/* Filter component removed */}
                </div>

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <DepartmentTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedDepartments={selectedDepartments}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <DepartmentSelected
                selectedDepartments={selectedDepartments}
                setSelectedDepartments={setSelectedDepartments}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default JobDepartmentsListing // Renamed export

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
