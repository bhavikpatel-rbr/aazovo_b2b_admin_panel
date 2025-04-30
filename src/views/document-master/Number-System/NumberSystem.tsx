import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag' // Keep if needed for future use (e.g., status)
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog' // Keep if needed (e.g., edit dialog)
import Avatar from '@/components/ui/Avatar' // Keep if needed
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import RichTextEditor from '@/components/shared/RichTextEditor' // Keep if needed (e.g., message dialog)
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'

// Icons
import {
    TbPencil,
    TbCopy,
    TbSwitchHorizontal, // Keep if status might be added later
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload, // Keep for potential future export
    TbPlus,
} from 'react-icons/tb'

// Types
import type {
    OnSortParam,
    ColumnDef,
    Row,
    SortingFnOption,
} from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type (Table Row Data) ---
export type NumberSystemItem = {
    id: string
    name: string
    countries: string[] // Array of country names
}
// --- End Item Type Definition ---

// --- Constants ---
const initialDummyData: NumberSystemItem[] = [
    {
        id: 'NS001',
        name: 'North America Region',
        countries: ['USA', 'Canada', 'Mexico'],
    },
    {
        id: 'NS002',
        name: 'European Union System',
        countries: [
            'Germany',
            'France',
            'Italy',
            'Spain',
            'Poland',
            'Romania',
            'Netherlands',
            'Belgium',
            'Greece',
            'Portugal',
            'Sweden',
            'Hungary',
            'Austria',
            'Bulgaria',
            'Denmark',
            'Finland',
            'Slovakia',
            'Ireland',
            'Croatia',
            'Lithuania',
            'Slovenia',
            'Latvia',
            'Estonia',
            'Cyprus',
            'Luxembourg',
            'Malta',
        ],
    }, // Truncated for brevity
    {
        id: 'NS003',
        name: 'ASEAN Bloc',
        countries: [
            'Indonesia',
            'Malaysia',
            'Philippines',
            'Singapore',
            'Thailand',
            'Vietnam',
            'Brunei',
            'Cambodia',
            'Laos',
            'Myanmar',
        ],
    },
    {
        id: 'NS004',
        name: 'South American Alliance',
        countries: [
            'Brazil',
            'Argentina',
            'Colombia',
            'Peru',
            'Chile',
            'Ecuador',
            'Bolivia',
            'Paraguay',
            'Uruguay',
            'Guyana',
            'Suriname',
            'Venezuela',
        ],
    },
    {
        id: 'NS005',
        name: 'African Union',
        countries: [
            'Nigeria',
            'Ethiopia',
            'Egypt',
            'DR Congo',
            'Tanzania',
            'South Africa',
            'Kenya',
            'Uganda',
            'Algeria',
            'Sudan',
            'Morocco',
            'Angola',
            'Ghana',
            'Mozambique',
            'Madagascar' /* ... many more */,
        ],
    }, // Truncated
    {
        id: 'NS006',
        name: 'Oceania Cooperative',
        countries: [
            'Australia',
            'Papua New Guinea',
            'New Zealand',
            'Fiji',
            'Solomon Islands',
            'Vanuatu',
            'Samoa',
            'Kiribati',
            'Tonga',
            'Micronesia',
            'Palau',
            'Marshall Islands',
            'Tuvalu',
            'Nauru',
        ],
    },
    {
        id: 'NS007',
        name: 'Central Asian Network',
        countries: [
            'Kazakhstan',
            'Uzbekistan',
            'Turkmenistan',
            'Kyrgyzstan',
            'Tajikistan',
        ],
    },
    {
        id: 'NS008',
        name: 'Middle East Consortium',
        countries: [
            'Saudi Arabia',
            'Iran',
            'Turkey',
            'Iraq',
            'UAE',
            'Israel',
            'Jordan',
            'Lebanon',
            'Oman',
            'Kuwait',
            'Qatar',
            'Bahrain',
            'Yemen',
            'Syria',
            'Palestine',
        ],
    }, // Political grouping may vary
    {
        id: 'NS009',
        name: 'East Asia Economic Zone',
        countries: ['China', 'Japan', 'South Korea'],
    },
    {
        id: 'NS010',
        name: 'Caribbean Community (CARICOM)',
        countries: [
            'Jamaica',
            'Trinidad and Tobago',
            'Haiti',
            'Bahamas',
            'Barbados',
            'St. Lucia',
            'Guyana',
            'Suriname',
            'Belize',
            'Grenada',
            'St. Vincent',
            'Antigua and Barbuda',
            'Dominica',
            'St. Kitts and Nevis',
            'Montserrat',
        ],
    },
    {
        id: 'NS011',
        name: 'Nordic Council',
        countries: ['Sweden', 'Denmark', 'Finland', 'Norway', 'Iceland'],
    },
    {
        id: 'NS012',
        name: 'Visegrád Group',
        countries: ['Poland', 'Hungary', 'Czech Republic', 'Slovakia'],
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
    onClone: () => void
    onChangeStatus?: () => void // Keep optional
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-end gap-2">
            <Tooltip title="Clone Item">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                    )}
                    role="button"
                    onClick={onClone}
                >
                    {' '}
                    <TbCopy />{' '}
                </div>
            </Tooltip>
            {/* Example: Conditionally render status change if needed */}
            {/* {onChangeStatus && (
                 <Tooltip title="Change Status">
                    <div className={classNames( iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400' )} role="button" onClick={onChangeStatus} > <TbSwitchHorizontal /> </div>
                 </Tooltip>
            )} */}
            <Tooltip title="Edit">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    {' '}
                    <TbPencil />{' '}
                </div>
            </Tooltip>
            <Tooltip title="Delete">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400',
                    )}
                    role="button"
                    onClick={onDelete}
                >
                    {' '}
                    <TbTrash />{' '}
                </div>
            </Tooltip>
        </div>
    )
}
// --- End ActionColumn ---

// --- ItemListTable Component ---
const ItemListTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedItems,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<NumberSystemItem>[]
    data: NumberSystemItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedItems: NumberSystemItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: NumberSystemItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<NumberSystemItem>[]) => void
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            noData={!loading && data.length === 0}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedItems.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}
// --- End ItemListTable ---

// --- ItemListSearch Component ---
type ItemListSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const ItemListSearch = React.forwardRef<HTMLInputElement, ItemListSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Quick search..." // Updated placeholder
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
ItemListSearch.displayName = 'ItemListSearch'
// --- End ItemListSearch ---

// --- ItemListTableTools Component ---
const ItemListTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            {/* Search takes full width */}
            <div className="flex-grow">
                <ItemListSearch onInputChange={onSearchChange} />
            </div>
            {/* No Filter button */}
        </div>
    )
}
// --- End ItemListTableTools ---

// --- ItemListActionTools Component ---
const ItemListActionTools = ({
    allItems,
}: {
    allItems: NumberSystemItem[]
}) => {
    const navigate = useNavigate()

    // Prepare data for CSV, joining the countries array
    const csvData = useMemo(() => {
        return allItems.map((item) => ({
            ...item,
            countries: item.countries.join('; '), // Join array with semicolon+space for CSV
        }))
    }, [allItems])

    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Countries', key: 'countries' }, // Header matches the transformed key
    ]

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* Uncomment CSVLink if needed */}
            {/* <CSVLink filename="numberSystemList.csv" data={csvData} headers={csvHeaders} >
                <Button icon={<TbCloudDownload />} className="w-full" block> Download </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbPlus className="text-lg" />}
                onClick={() =>
                    console.log('Navigate to Add New Number System page')
                } // Replace with actual navigation
                // onClick={() => navigate('/number-systems/create')}
                block // Ensure button takes full width if needed in flex-col
            >
                Add New
            </Button>
        </div>
    )
}
// --- End ItemListActionTools ---

// --- ItemListSelected Component ---
const ItemListSelected = ({
    selectedItems,
    setSelectedItems,
    onDeleteSelected,
}: {
    selectedItems: NumberSystemItem[]
    setSelectedItems: React.Dispatch<React.SetStateAction<NumberSystemItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    // Don't render if nothing is selected
    if (selectedItems.length === 0) {
        return null
    }

    return (
        <>
            <StickyFooter
                className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
                stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
            >
                <div className="flex items-center justify-between w-full px-4 sm:px-8">
                    <span className="flex items-center gap-2">
                        <span className="text-lg text-primary-600 dark:text-primary-400">
                            {' '}
                            <TbChecks />{' '}
                        </span>
                        <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                            <span className="heading-text">
                                {selectedItems.length}
                            </span>
                            <span>
                                Item{selectedItems.length > 1 ? 's' : ''}{' '}
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
                        {/* Add other bulk actions here if needed */}
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedItems.length} Item${selectedItems.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected item
                    {selectedItems.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End ItemListSelected ---

// --- Main NumberSystem Component ---
const NumberSystem = () => {
    const navigate = useNavigate()

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false)
    const [items, setItems] = useState<NumberSystemItem[]>(initialDummyData)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedItems, setSelectedItems] = useState<NumberSystemItem[]>([])
    // --- End Lifted State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...items]

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (item) =>
                    item.id.toLowerCase().includes(query) ||
                    item.name.toLowerCase().includes(query) ||
                    item.countries.some((country) =>
                        country.toLowerCase().includes(query),
                    ),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'countries') {
                    const lenA = a.countries?.length ?? 0
                    const lenB = b.countries?.length ?? 0
                    return order === 'asc' ? lenA - lenB : lenB - lenA
                }
                const aValue = a[key as keyof NumberSystemItem] ?? ''
                const bValue = b[key as keyof NumberSystemItem] ?? ''
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
    }, [items, tableData])
    // --- End Memoized Data Processing ---

    // --- Lifted Handlers ---
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
            setSelectedItems([])
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
        (checked: boolean, row: NumberSystemItem) => {
            setSelectedItems((prev) => {
                if (checked) {
                    return prev.some((i) => i.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((i) => i.id !== row.id)
                }
            })
        },
        [],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<NumberSystemItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            if (checked) {
                const originalRows = rows.map((row) => row.original)
                setSelectedItems((prev) => {
                    const existingIds = new Set(prev.map((i) => i.id))
                    const newSelection = originalRows.filter(
                        (i) => !existingIds.has(i.id),
                    )
                    return [...prev, ...newSelection]
                })
            } else {
                setSelectedItems((prev) =>
                    prev.filter((i) => !rowIds.has(i.id)),
                )
            }
        },
        [], // Might need setSelectedItems if linting complains
    )

    const handleEdit = useCallback(
        (item: NumberSystemItem) => {
            console.log('Edit item:', item.id)
            // Example navigation: navigate(`/number-systems/edit/${item.id}`);
        },
        [navigate],
    )

    const handleClone = useCallback((itemToClone: NumberSystemItem) => {
        console.log('Cloning item:', itemToClone.id, itemToClone.name)
        const newId = `NS${Math.floor(Math.random() * 9000) + 1000}`
        const clonedItem: NumberSystemItem = {
            ...itemToClone,
            id: newId,
            name: `${itemToClone.name} (Clone)`,
            countries: [...itemToClone.countries], // Clone the array
        }
        setItems((prev) => [clonedItem, ...prev]) // Add to list
    }, []) // Add setItems if linting complains

    const handleDelete = useCallback((itemToDelete: NumberSystemItem) => {
        // Add confirmation dialog in real app before deleting
        console.log('Deleting item:', itemToDelete.id, itemToDelete.name)
        setItems((currentItems) =>
            currentItems.filter((item) => item.id !== itemToDelete.id),
        )
        setSelectedItems((prevSelected) =>
            prevSelected.filter((item) => item.id !== itemToDelete.id),
        )
    }, []) // Add setItems, setSelectedItems if linting complains

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected items:',
            selectedItems.map((i) => i.id),
        )
        const selectedIds = new Set(selectedItems.map((i) => i.id))
        setItems((currentItems) =>
            currentItems.filter((i) => !selectedIds.has(i.id)),
        )
        setSelectedItems([])
    }, [selectedItems]) // Add setItems, setSelectedItems if linting complains
    // --- End Lifted Handlers ---

    // --- Define Columns in Parent ---
    const columns: ColumnDef<NumberSystemItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true },
            { header: 'Name', accessorKey: 'name', enableSorting: true },
            {
                header: 'Countries',
                accessorKey: 'countries',
                enableSorting: true,
                cell: (props) => {
                    const countries = props.row.original.countries
                    const count = countries.length
                    const countryList = countries.join(', ')
                    return (
                        <Tooltip
                            title={
                                count > 0 ? countryList : 'No countries listed'
                            }
                            wrap
                        >
                            <span className="cursor-default whitespace-nowrap">
                                {count} {count === 1 ? 'Country' : 'Countries'}
                            </span>
                        </Tooltip>
                    )
                },
                sortingFn: (rowA, rowB, columnId) => {
                    const lenA = rowA.original[columnId]?.length ?? 0
                    const lenB = rowB.original[columnId]?.length ?? 0
                    return lenA - lenB
                },
            },
            {
                header: '',
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onClone={() => handleClone(props.row.original)}
                        // onChangeStatus optional based on ActionColumn definition
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleClone, handleEdit, handleDelete], // Ensure handlers are dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {' '}
                {/* Ensure flex column */}
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Number System Management</h5>
                    <ItemListActionTools allItems={items} />
                </div>
                {/* Tools Section */}
                <div className="mb-4">
                    <ItemListTableTools onSearchChange={handleSearchChange} />
                </div>
                {/* Table Section - Allow table to grow */}
                <div className="flex-grow overflow-auto">
                    {' '}
                    {/* Add overflow for safety */}
                    <ItemListTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedItems={selectedItems}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Actions Footer */}
            <ItemListSelected
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default NumberSystem

// Helper Function
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
