// src/views/your-path/DomainManagementListing.tsx (New file name)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag' // Can use for countries
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog' // Keep for potential future use
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbWorldWww } from 'react-icons/tb' // Icon for domain

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
export type DomainItem = {
    id: string // Unique ID for the domain record
    domain: string // The domain name (e.g., example.com, store.example.co.uk)
    countries: string[] // Array of country codes/names associated
    // Optional: Add status, registrar, expiry date etc. later
    // status?: 'active' | 'inactive' | 'pending_verification';
    // registrar?: string;
    // expiryDate?: Date;
    // createdDate?: Date;
}
// --- End Item Type ---

// --- Constants ---
const initialDummyDomains: DomainItem[] = [
    { id: 'DOM001', domain: 'aazovo-global.com', countries: ['Global'] },
    { id: 'DOM002', domain: 'aazovo.co.uk', countries: ['GB', 'UK'] },
    { id: 'DOM003', domain: 'aazovo.de', countries: ['DE'] },
    { id: 'DOM004', domain: 'shop.aazovo.fr', countries: ['FR'] },
    { id: 'DOM005', domain: 'aazovo.ca', countries: ['CA'] },
    { id: 'DOM006', domain: 'aazovo.com.au', countries: ['AU', 'NZ'] },
    { id: 'DOM007', domain: 'aazovo.jp', countries: ['JP'] },
    { id: 'DOM008', domain: 'legacy-store.com', countries: ['US', 'CA', 'MX'] }, // Example old domain
    { id: 'DOM009', domain: 'aazovo.in', countries: ['IN'] },
    { id: 'DOM010', domain: 'dev.aazovo.internal', countries: ['Internal'] },
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
            <Tooltip title="Edit Domain">
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
            <Tooltip title="Delete Domain">
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
            {/* Add other actions like Verify DNS, Set Primary etc. if needed */}
        </div>
    )
}
// --- End ActionColumn ---

// --- DomainTable Component ---
const DomainTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedDomains,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<DomainItem>[]
    data: DomainItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedDomains: DomainItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: DomainItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<DomainItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedDomains.some((selected) => selected.id === row.id)
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
// --- End DomainTable ---

// --- DomainSearch Component ---
type DomainSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const DomainSearch = React.forwardRef<HTMLInputElement, DomainSearchProps>(
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
DomainSearch.displayName = 'DomainSearch'
// --- End DomainSearch ---

// --- DomainTableTools Component ---
const DomainTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <DomainSearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
    // Filter could be added here (e.g., by country, status)
}
// --- End DomainTableTools ---

// --- DomainActionTools Component ---
const DomainActionTools = ({ allDomains }: { allDomains: DomainItem[] }) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allDomains.map((d) => ({
                id: d.id,
                domain: d.domain,
                countries: d.countries.join('; '),
            })),
        [allDomains],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Domain', key: 'domain' },
        { label: 'Countries', key: 'countries' },
    ]
    const handleAdd = () => navigate('/domain-management/add') // Adjust route

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
// --- End DomainActionTools ---

// --- DomainSelected Component ---
const DomainSelected = ({
    selectedDomains,
    setSelectedDomains,
    onDeleteSelected,
}: {
    selectedDomains: DomainItem[]
    setSelectedDomains: React.Dispatch<React.SetStateAction<DomainItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedDomains.length === 0) return null

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
                                {selectedDomains.length}
                            </span>
                            <span>
                                Domain{selectedDomains.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedDomains.length} Domain${selectedDomains.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected domain
                    {selectedDomains.length > 1 ? 's' : ''}? This action cannot
                    be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End DomainSelected ---

// --- Main DomainManagementListing Component ---
const DomainManagementListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [domains, setDomains] = useState<DomainItem[]>(initialDummyDomains)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedDomains, setSelectedDomains] = useState<DomainItem[]>([])
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...domains]

        // Apply Filtering (if added)

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (d) =>
                    d.id.toLowerCase().includes(query) ||
                    d.domain.toLowerCase().includes(query) ||
                    d.countries.some((c) => c.toLowerCase().includes(query)),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                // Sort by number of countries
                if (key === 'countries') {
                    const lenA = a.countries?.length ?? 0
                    const lenB = b.countries?.length ?? 0
                    return order === 'asc' ? lenA - lenB : lenB - lenA
                }
                const aValue = a[key as keyof DomainItem] ?? ''
                const bValue = b[key as keyof DomainItem] ?? ''
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
    }, [domains, tableData])
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
            setSelectedDomains([])
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
        (checked: boolean, row: DomainItem) => {
            setSelectedDomains((prev) => {
                if (checked) {
                    return prev.some((d) => d.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((d) => d.id !== row.id)
                }
            })
        },
        [setSelectedDomains],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<DomainItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setSelectedDomains((prev) => {
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
        [setSelectedDomains],
    )

    const handleEdit = useCallback(
        (domain: DomainItem) => {
            console.log('Edit domain:', domain.id)
            navigate(`/domain-management/edit/${domain.id}`) // Adjust route
        },
        [navigate],
    )

    const handleDelete = useCallback(
        (domainToDelete: DomainItem) => {
            console.log('Deleting domain:', domainToDelete.id)
            setDomains((current) =>
                current.filter((d) => d.id !== domainToDelete.id),
            )
            setSelectedDomains((prev) =>
                prev.filter((d) => d.id !== domainToDelete.id),
            )
            toast.push(
                <Notification
                    title="Domain Deleted"
                    type="success"
                    duration={2000}
                >{`Domain '${domainToDelete.domain}' deleted.`}</Notification>,
            )
        },
        [setDomains, setSelectedDomains],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected domains:',
            selectedDomains.map((d) => d.id),
        )
        const selectedIds = new Set(selectedDomains.map((d) => d.id))
        setDomains((current) => current.filter((d) => !selectedIds.has(d.id)))
        setSelectedDomains([])
        toast.push(
            <Notification
                title="Domains Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} domain(s) deleted.`}</Notification>,
        )
    }, [selectedDomains, setDomains, setSelectedDomains])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<DomainItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                width: 150,
            },
            {
                header: 'Domain Name',
                accessorKey: 'domain',
                enableSorting: true,
            },
            {
                header: 'Countries',
                accessorKey: 'countries',
                enableSorting: true, // Sorts by count
                cell: (props) => (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                        {' '}
                        {/* Limit width */}
                        {props.row.original.countries.map((country) => (
                            <Tag
                                key={country}
                                className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100"
                            >
                                {country}
                            </Tag>
                        ))}
                    </div>
                ),
                sortingFn: (rowA, rowB, columnId) => {
                    // Sort by number of countries
                    const lenA = rowA.original.countries?.length ?? 0
                    const lenB = rowB.original.countries?.length ?? 0
                    return lenA - lenB
                },
            },
            {
                header: 'Action',
                id: 'action',
                size: 100,
                meta:{ HeaderClass: "text-center" },
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
                    <h5 className="mb-4 lg:mb-0">Domain Management</h5>
                    <DomainActionTools allDomains={domains} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <DomainTableTools onSearchChange={handleSearchChange} />
                    {/* Filter component removed */}
                </div>

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <DomainTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedDomains={selectedDomains}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <DomainSelected
                selectedDomains={selectedDomains}
                setSelectedDomains={setSelectedDomains}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default DomainManagementListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
