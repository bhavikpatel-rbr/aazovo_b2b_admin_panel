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
import { Card, Drawer, FormItem, Input, } from '@/components/ui'
import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // For filter form

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
    country?: string // Optional: e.g., "USA", "Canada", etc.
    category?: string // Optional: e.g., "Engineering", "Marketing", etc.
    brand?: string // Optional: e.g., "Brand A", "Brand B", etc.
    mobile?: string // Optional: e.g., "+1-234-567-8900"
    quality?: string // Optional: e.g., "High", "Medium", "Low"
    // status only hold and identified
    status?: 'hold' | 'identified' // Optional: e.g., "active", "inactive", etc.
    remark?: string // Optional: e.g., "Urgent", "Pending", etc.
    date?: string // Optional: e.g., "2023-10-01"
}
// --- End Item Type ---

// --- Constants ---
const initialDummyDepartments: DesignationItem[] = [
    {
      id: 'DES001',
      country: 'India',
      category: 'Engineering',
      brand: 'Brand A',
      mobile: '+91-9876543210',
      quality: 'High',
      status: 'identified',
      remark: 'Urgent',
      date: '2025-05-06',
    },
    {
      id: 'DES002',
      country: 'USA',
      category: 'Marketing',
      brand: 'Brand B',
      mobile: '+1-234-567-8900',
      quality: 'Medium',
      status: 'hold',
      remark: 'Pending approval',
      date: '2025-05-05',
    },
    {
      id: 'DES003',
      country: 'Canada',
      category: 'Sales',
      brand: 'Brand C',
      mobile: '+1-987-654-3210',
      quality: 'Low',
      status: 'identified',
      remark: 'Follow-up needed',
      date: '2025-05-04',
    },
    {
      id: 'DES004',
      country: 'Germany',
      category: 'Human Resources (HR)',
      brand: 'Brand D',
      mobile: '+49-123-456789',
      quality: 'High',
      status: 'hold',
      remark: 'On hold for review',
      date: '2025-05-03',
    },
    {
      id: 'DES005',
      country: 'UK',
      category: 'Operations',
      brand: 'Brand E',
      mobile: '+44-20-7946-0958',
      quality: 'Medium',
      status: 'identified',
      remark: 'Reviewed',
      date: '2025-05-02',
    },
    {
      id: 'DES006',
      country: 'Australia',
      category: 'Finance',
      brand: 'Brand F',
      mobile: '+61-2-1234-5678',
      quality: 'Low',
      status: 'hold',
      remark: 'Awaiting confirmation',
      date: '2025-05-01',
    },
    {
      id: 'DES007',
      country: 'India',
      category: 'Customer Support',
      brand: 'Brand G',
      mobile: '+91-7000000000',
      quality: 'High',
      status: 'identified',
      remark: 'Escalated',
      date: '2025-04-30',
    },
    {
      id: 'DES008',
      country: 'USA',
      category: 'Product Management',
      brand: 'Brand H',
      mobile: '+1-555-678-1234',
      quality: 'Medium',
      status: 'hold',
      remark: 'In progress',
      date: '2025-04-29',
    },
    {
      id: 'DES009',
      country: 'France',
      category: 'Design',
      brand: 'Brand I',
      mobile: '+33-1-2345-6789',
      quality: 'High',
      status: 'identified',
      remark: 'Priority',
      date: '2025-04-28',
    },
    {
      id: 'DES010',
      country: 'Singapore',
      category: 'Data Science & Analytics',
      brand: 'Brand J',
      mobile: '+65-6123-4567',
      quality: 'Medium',
      status: 'hold',
      remark: 'Awaiting data',
      date: '2025-04-27',
    }
  ];
  
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
    openAddDrawer,
}: {
    allDesignations: DesignationItem[];
    openAddDrawer: () => void; // Accept function as a prop
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () => allDesignations.map((d) => ({ id: d.id, name: d.mobile })),
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
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} block>
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
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DesignationItem | null>(null);

    const openEditDrawer = (item: DesignationItem) => {
        setSelectedItem(item); // Set the selected item's data
        setIsEditDrawerOpen(true); // Open the edit drawer
    };

    const closeEditDrawer = () => {
        setSelectedItem(null); // Clear the selected item's data
        setIsEditDrawerOpen(false); // Close the edit drawer
    };

    const openAddDrawer = () => {
        setSelectedItem(null); // Clear any selected item
        setIsAddDrawerOpen(true); // Open the add drawer
    };

    const closeAddDrawer = () => {
        setIsAddDrawerOpen(false); // Close the add drawer
    };
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
                    d.id.toLowerCase().includes(query)
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
                >{`Departments '${designationToDelete.mobile}' deleted.`}</Notification>,
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
              {
                header: 'Country',
                accessorKey: 'country',
                enableSorting: true,
              },
              {
                header: 'Category',
                accessorKey: 'category',
                enableSorting: true,
              },
              {
                header: 'Brand',
                accessorKey: 'brand',
                enableSorting: true,
              },
              {
                header: 'Mobile',
                accessorKey: 'mobile',
                enableSorting: false,
              },
              {
                header: 'Quality',
                accessorKey: 'quality',
                enableSorting: true,
              },
              {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
              },
              {
                header: 'Remark',
                accessorKey: 'remark',
                enableSorting: false,
              },
              {
                header: 'Date',
                accessorKey: 'date',
                enableSorting: true,
              },
            // Add other columns like description if needed
            {
                header: 'Action',
                id: 'action',
                width: 100,
                meta:{HeaderClass: "text-center"},
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)}
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
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    {/* Header */}
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Departments Listing</h5>
                        <DesignationActionTools allDesignations={designations} openAddDrawer={openAddDrawer} />
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
            <Drawer
                title="Edit Designation"
                isOpen={isEditDrawerOpen}
                onClose={closeEditDrawer}
                onRequestClose={closeEditDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeEditDrawer}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={() => {
                                console.log('Updated Designation:', selectedItem);
                                closeEditDrawer();
                            }}
                        >
                            Save
                        </Button>
                    </div>
                }
            >
                <Form>
                    <FormItem label="Country">
                        <Input
                            value={selectedItem?.country || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', country: '', category: '', brand: '', mobile: '', quality: '', status: 'hold', remark: '', date: '' }),
                                    country: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Category">
                        <Input
                            value={selectedItem?.category || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', country: '', category: '', brand: '', mobile: '', quality: '', status: 'hold', remark: '', date: '' }),
                                    category: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Brand">
                        <Input
                            value={selectedItem?.brand || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', country: '', category: '', brand: '', mobile: '', quality: '', status: 'hold', remark: '', date: '' }),
                                    brand: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Mobile">
                        <Input
                            value={selectedItem?.mobile || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', country: '', category: '', brand: '', mobile: '', quality: '', status: 'hold', remark: '', date: '' }),
                                    mobile: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Quality">
                        <Input
                            value={selectedItem?.quality || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', country: '', category: '', brand: '', mobile: '', quality: '', status: 'hold', remark: '', date: '' }),
                                    quality: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Status">
                        <select
                            value={selectedItem?.status || 'hold'}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', country: '', category: '', brand: '', mobile: '', quality: '', status: 'hold', remark: '', date: '' }),
                                    status: e.target.value as 'hold' | 'identified',
                                }))
                            }
                        >
                            <option value="hold">Hold</option>
                            <option value="identified">Identified</option>
                        </select>
                    </FormItem>
                    <FormItem label="Remark">
                        <Input
                            value={selectedItem?.remark || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', country: '', category: '', brand: '', mobile: '', quality: '', status: 'hold', remark: '', date: '' }),
                                    remark: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Date">
                        <Input
                            type="date"
                            value={selectedItem?.date || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', country: '', category: '', brand: '', mobile: '', quality: '', status: 'hold', remark: '', date: '' }),
                                    date: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                </Form>
            </Drawer>
            <Drawer
                title="Add New Designation"
                isOpen={isAddDrawerOpen}
                onClose={closeAddDrawer}
                onRequestClose={closeAddDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeAddDrawer}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            onClick={() => console.log('Designation Added')}
                        >
                            Add
                        </Button>
                    </div>
                }
            >
                <Form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        const newItem: DesignationItem = {
                            id: `${designations.length + 1}`,
                            country: formData.get('country') as string,
                            category: formData.get('category') as string,
                            brand: formData.get('brand') as string,
                            mobile: formData.get('mobile') as string,
                            quality: formData.get('quality') as string,
                            status: formData.get('status') as 'hold' | 'identified',
                            remark: formData.get('remark') as string,
                            date: formData.get('date') as string,
                        };
                        console.log('New Designation:', newItem);
                        // handleAdd(newItem);
                    }}
                >
                    <FormItem label="Country">
                        <Input name="country" placeholder="Enter Country" />
                    </FormItem>
                    <FormItem label="Category">
                        <Input name="category" placeholder="Enter Category" />
                    </FormItem>
                    <FormItem label="Brand">
                        <Input name="brand" placeholder="Enter Brand" />
                    </FormItem>
                    <FormItem label="Mobile">
                        <Input name="mobile" placeholder="Enter Mobile" />
                    </FormItem>
                    <FormItem label="Quality">
                        <Input name="quality" placeholder="Enter Quality" />
                    </FormItem>
                    <FormItem label="Status">
                        <select name="status" defaultValue="hold">
                            <option value="hold">Hold</option>
                            <option value="identified">Identified</option>
                        </select>
                    </FormItem>
                    <FormItem label="Remark">
                        <Input name="remark" placeholder="Enter Remark" />
                    </FormItem>
                    <FormItem label="Date">
                        <Input name="date" type="date" />
                    </FormItem>
                </Form>
            </Drawer>
        </>
    )
}
// --- End Main Component ---

export default RawData

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
