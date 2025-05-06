// src/views/your-path/.tsx (New file name)

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
import Dialog from '@/components/ui/Dialog' // Keep for potential future use (e.g., adding description)
import Avatar from '@/components/ui/Avatar' // Keep if needed (e.g., generic icon)
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbBriefcase, TbCloudUpload, TbFilter } from 'react-icons/tb' // Placeholder icon

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
export type DesignationItem = {
    id: string // Unique Designation ID
    name: string // e.g., "Software Engineer", "Marketing Manager", "Sales Representative"
    // Optional: Add description or other relevant fields later
    // description?: string;
    // createdDate?: Date;
}
// --- End Item Type ---

// --- Constants ---
const initialDummyDepartments: DesignationItem[] = [
    { id: 'DEPT001', name: 'Engineering' },
    { id: 'DEPT002', name: 'Marketing' },
    { id: 'DEPT003', name: 'Sales' },
    { id: 'DEPT004', name: 'Human Resources (HR)' },
    { id: 'DEPT005', name: 'Operations' },
    { id: 'DEPT006', name: 'Finance' },
    { id: 'DEPT007', name: 'Customer Support' },
    { id: 'DEPT008', name: 'Product Management' },
    { id: 'DEPT009', name: 'Design' },
    { id: 'DEPT010', name: 'Data Science & Analytics' },
    { id: 'DEPT011', name: 'Information Technology (IT)' },
    { id: 'DEPT012', name: 'Legal' },
    { id: 'DEPT013', name: 'Administration' },
    { id: 'DEPT014', name: 'Research & Development (R&D)' },
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
        <div className="flex items-center justify-center">
            {/* Edit Button */}
            <Tooltip title="Edit Departments">
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
            {/* Delete Button */}
            <Tooltip title="Delete Departments">
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

// --- DesignationTable Component ---
const DesignationTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedDesignations,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<DesignationItem>[]
    data: DesignationItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedDesignations: DesignationItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: DesignationItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<DesignationItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedDesignations.some((selected) => selected.id === row.id)
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
// --- End DesignationTable ---

// --- DesignationSearch Component ---
type DesignationSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const DesignationSearch = React.forwardRef<
    HTMLInputElement,
    DesignationSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Quick Search..."
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
DesignationSearch.displayName = 'DesignationSearch'
// --- End DesignationSearch ---

// --- DesignationTableTools Component ---
const DesignationTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <div className="flex-grow">
                <DesignationSearch onInputChange={onSearchChange} />
            </div>
            <Button icon={<TbFilter />} className=''>
                Filter
            </Button>
            <Button icon={<TbCloudUpload/>}>Export</Button>
        </div>
    )
    // Filter component removed
}
// --- End DesignationTableTools ---

// --- DesignationActionTools Component ---
const DesignationActionTools = ({
    allDesignations,
}: {
    allDesignations: DesignationItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () => allDesignations.map((d) => ({ id: d.id, name: d.name })),
        [allDesignations],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
    ]
    const handleAdd = () => navigate('/designations/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbPlus />} onClick={handleAdd} block>
                {' '}
                Add New{' '}
            </Button>{' '}
        </div>
    )
}
// --- End DesignationActionTools ---

// --- DesignationSelected Component ---
const DesignationSelected = ({
    selectedDesignations,
    setSelectedDesignations,
    onDeleteSelected,
}: {
    selectedDesignations: DesignationItem[]
    setSelectedDesignations: React.Dispatch<
        React.SetStateAction<DesignationItem[]>
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

    if (selectedDesignations.length === 0) return null

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
                                {selectedDesignations.length}
                            </span>
                            <span>
                                Departments
                                {selectedDesignations.length > 1
                                    ? 's'
                                    : ''}{' '}
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
                title={`Delete ${selectedDesignations.length} Departments${selectedDesignations.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected designation
                    {selectedDesignations.length > 1 ? 's' : ''}? This action
                    cannot be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End DesignationSelected ---

// --- Main DesignationListing Component ---
const RawData = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [designations, setDesignations] = useState<DesignationItem[]>(
        initialDummyDepartments,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedDesignations, setSelectedDesignations] = useState<
        DesignationItem[]
    >([])
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...designations]

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
                const aValue = a[key as keyof DesignationItem] ?? ''
                const bValue = b[key as keyof DesignationItem] ?? ''
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
    }, [designations, tableData])
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
            setSelectedDesignations([])
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
        (checked: boolean, row: DesignationItem) => {
            setSelectedDesignations((prev) => {
                if (checked) {
                    return prev.some((d) => d.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((d) => d.id !== row.id)
                }
            })
        },
        [setSelectedDesignations],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<DesignationItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedDesignations((prev) => {
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
        [setSelectedDesignations],
    )

    const handleEdit = useCallback(
        (designation: DesignationItem) => {
            console.log('Edit designation:', designation.id)
            navigate(`/designations/edit/${designation.id}`) // Adjust route
        },
        [navigate],
    )

    const handleDelete = useCallback(
        (designationToDelete: DesignationItem) => {
            console.log('Deleting designation:', designationToDelete.id)
            // Add confirmation dialog maybe
            setDesignations((current) =>
                current.filter((d) => d.id !== designationToDelete.id),
            )
            setSelectedDesignations((prev) =>
                prev.filter((d) => d.id !== designationToDelete.id),
            )
            toast.push(
                <Notification
                    title="Departments Deleted"
                    type="success"
                    duration={2000}
                >{`Departments '${designationToDelete.name}' deleted.`}</Notification>,
            )
        },
        [setDesignations, setSelectedDesignations],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected designations:',
            selectedDesignations.map((d) => d.id),
        )
        const selectedIds = new Set(selectedDesignations.map((d) => d.id))
        setDesignations((current) =>
            current.filter((d) => !selectedIds.has(d.id)),
        )
        setSelectedDesignations([])
        toast.push(
            <Notification
                title="Departments Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} designation(s) deleted.`}</Notification>,
        )
    }, [selectedDesignations, setDesignations, setSelectedDesignations])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<DesignationItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                width: 120,
            },
            { header: 'Name', accessorKey: 'name', enableSorting: true },
            // Add other columns like description if needed
            {
                header: 'Action',
                id: 'action',
                width: 100,
                meta:{HeaderClass: "text-center"},
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
                    <h5 className="mb-4 lg:mb-0">Departments Listing</h5>
                    <DesignationActionTools allDesignations={designations} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <DesignationTableTools
                        onSearchChange={handleSearchChange}
                    />
                    {/* Filter component removed */}
                </div>

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <DesignationTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedDesignations={selectedDesignations}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <DesignationSelected
                selectedDesignations={selectedDesignations}
                setSelectedDesignations={setSelectedDesignations}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default RawData

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
