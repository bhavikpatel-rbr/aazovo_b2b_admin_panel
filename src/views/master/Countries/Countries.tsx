import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller } from 'react-hook-form' // No longer needed for filter form
// import { zodResolver } from '@hookform/resolvers/zod' // No longer needed
// import { z } from 'zod' // No longer needed
// import type { ZodType } from 'zod' // No longer needed

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
// import Dialog from '@/components/ui/Dialog' // No longer needed for filter dialog
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { Card, Drawer, Tag, Form, FormItem, Input, } from '@/components/ui'

// import Checkbox from '@/components/ui/Checkbox' // No longer needed for filter form
// import Input from '@/components/ui/Input' // No longer needed for filter form
// import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // No longer needed for filter form

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    // TbFilter, // Filter icon removed
    TbPlus,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import {
    getContinentsAction,
    getCountriesAction,
    getDocumentTypeAction,
    getPaymentTermAction,
} from '@/reduxtool/master/middleware'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// --- Define FormItem Type (Table Row Data) ---
export type FormItem = {
    id: string
    continent_id: string
    name: string
    iso: string
    phonecode: string

}
// --- End FormItem Type Definition ---

// FilterFormSchema and channelList removed

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
            <Tooltip title="Edit">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400',
                    )}
                    role="button"
                    onClick={onEdit}
                >
                    <TbPencil />
                </div>
            </Tooltip>
            <Tooltip title="Delete">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400',
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

// --- FormListTable Component (No changes) ---
const FormListTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedForms,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<FormItem>[]
    data: FormItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedForms: FormItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: FormItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<FormItem>[]) => void
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
                selectedForms.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}

// --- FormListSearch Component (No changes) ---
type FormListSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const FormListSearch = React.forwardRef<HTMLInputElement, FormListSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                className="w-full "
                placeholder="Quick search..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
FormListSearch.displayName = 'FormListSearch'

// FormListTableFilter component removed

// --- FormListTableTools Component (Simplified) ---
const FormListTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <FormListSearch onInputChange={onSearchChange} />
            {/* Filter button/component removed */}
        </div>
    )
}
// --- End FormListTableTools ---

// --- FormListActionTools Component (No functional changes needed for filter removal) ---
const FormListActionTools = ({
    allFormsData,
    openAddDrawer,
}: {
    allFormsData: FormItem[];
    openAddDrawer: () => void; // Accept function as a prop
}) => {
    const navigate = useNavigate()
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Continent', key: 'continent_id' },
        { label: 'Country', key: 'name' },
        { label: 'Short Code', key: 'iso' },
        { label: 'Phone Code', key: 'phonecode' },

    ]

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/*
            <CSVLink
                className="w-full"
                filename="documentTypeList.csv"
                data={allFormsData}
                headers={csvHeaders}
            >
                <Button icon={<TbCloudDownload />} className="w-full" block>
                    Download
                </Button>
            </CSVLink>
            */}
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={openAddDrawer}
                block
            >
                Add New
            </Button>
        </div>
    )
}

// --- FormListSelected Component (No functional changes needed for filter removal) ---
const FormListSelected = ({
    selectedForms,
    setSelectedForms,
    onDeleteSelected,
}: {
    selectedForms: FormItem[]
    setSelectedForms: React.Dispatch<React.SetStateAction<FormItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedForms.length === 0) return null

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
                                {selectedForms.length}
                            </span>
                            <span>
                                Item{selectedForms.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedForms.length} Item${selectedForms.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected item
                    {selectedForms.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

// --- Main Continents Component ---
const Countries = () => {

    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FormItem | null>(null);

    const openEditDrawer = (item: FormItem) => {
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
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(getCountriesAction())
    }, [dispatch])

    const { CountriesData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)

    const [localIsLoading, setLocalIsLoading] = useState(false)
    const [forms, setForms] = useState<FormItem[]>([]) // Remains for potential local ops, not table data source

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedForms, setSelectedForms] = useState<FormItem[]>([])
    // filterData state and handleApplyFilter removed

    console.log('Raw CountriesData from Redux:', CountriesData)

    const { pageData, total, processedDataForCsv } = useMemo(() => {
        console.log(
            '[Memo] Recalculating. Query:',
            tableData.query,
            'Sort:',
            tableData.sort,
            'Page:',
            tableData.pageIndex,
            // 'Filters:' removed from log
            'Input Data (CountriesData) Length:',
            CountriesData?.length ?? 0,
        )

        const sourceData: FormItem[] = Array.isArray(CountriesData)
            ? CountriesData
            : []
        let processedData: FormItem[] = cloneDeep(sourceData)

        // Product and Channel filtering logic removed

        // 1. Apply Search Query (on id and name)
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            console.log('[Memo] Applying search query:', query)
            processedData = processedData.filter((item: FormItem) => {
                const itemNameLower = item.iso?.trim().toLowerCase() ?? ''
                const continentNameLower = item.iso?.trim().toLowerCase() ?? ''
                const itemIdString = String(item.id ?? '').trim()
                const itemIdLower = itemIdString.toLowerCase()
                return (
                    itemNameLower.includes(query) ||
                    itemIdLower.includes(query) ||
                    continentNameLower.includes(query)
                )
            })
            console.log(
                '[Memo] After search query filter. Count:',
                processedData.length,
            )
        }

        // 2. Apply Sorting (on id and name)
        const { order, key } = tableData.sort as OnSortParam
        if (
            order &&
            key &&
            (key === 'id' || key === 'name') &&
            processedData.length > 0
        ) {
            console.log('[Memo] Applying sort. Key:', key, 'Order:', order)
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                // Ensure values are strings for localeCompare, default to empty string if not
                const aValue = String(a[key as keyof FormItem] ?? '')
                const bValue = String(b[key as keyof FormItem] ?? '')

                return order === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            })
            processedData = sortedData
        }

        const dataBeforePagination = [...processedData] // For CSV export

        // 3. Apply Pagination
        const currentTotal = processedData.length
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        console.log(
            '[Memo] Returning. PageData Length:',
            dataForPage.length,
            'Total Items (after all filters/sort):',
            currentTotal,
        )
        return {
            pageData: dataForPage,
            total: currentTotal,
            processedDataForCsv: dataBeforePagination,
        }
    }, [CountriesData, tableData]) // filterData removed from dependencies

    // --- Handlers ---
    // handleApplyFilter removed

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
        setTableData((prev) => ({ ...prev, ...data }))
    }, [])

    const handlePaginationChange = useCallback(
        (page: number) => handleSetTableData({ pageIndex: page }),
        [handleSetTableData],
    )
    const handleSelectChange = useCallback(
        (value: number) => {
            handleSetTableData({ pageSize: Number(value), pageIndex: 1 })
            setSelectedForms([])
        },
        [handleSetTableData],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
        [handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
        [handleSetTableData],
    )

    const handleRowSelect = useCallback((checked: boolean, row: FormItem) => {
        setSelectedForms((prev) => {
            if (checked)
                return prev.some((f) => f.id === row.id) ? prev : [...prev, row]
            return prev.filter((f) => f.id !== row.id)
        })
    }, [])

    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<FormItem>[]) => {
            const currentPageRowOriginals = currentRows.map((r) => r.original)
            if (checked) {
                setSelectedForms((prevSelected) => {
                    const prevSelectedIds = new Set(
                        prevSelected.map((f) => f.id),
                    )
                    const newRowsToAdd = currentPageRowOriginals.filter(
                        (r) => !prevSelectedIds.has(r.id),
                    )
                    return [...prevSelected, ...newRowsToAdd]
                })
            } else {
                const currentPageRowIds = new Set(
                    currentPageRowOriginals.map((r) => r.id),
                )
                setSelectedForms((prevSelected) =>
                    prevSelected.filter((f) => !currentPageRowIds.has(f.id)),
                )
            }
        },
        [],
    )

    // --- Action Handlers (remain the same, need Redux integration for persistence) ---
    const handleEdit = useCallback(
        (form: FormItem) => {
            console.log('Edit item (requires navigation/modal):', form.id)
            toast.push(
                <Notification title="Edit Action" type="info">
                    Edit action for "{form.iso}" (ID: {form.id}). Implement
                    navigation or modal.
                </Notification>,
            )
        },
        [navigate],
    )

    const handleDelete = useCallback((formToDelete: FormItem) => {
        console.log(
            'Delete item (needs Redux action):',
            formToDelete.id,
            formToDelete.iso,
        )
        setSelectedForms((prevSelected) =>
            prevSelected.filter((form) => form.id !== formToDelete.id),
        )
        toast.push(
            <Notification title="Delete Action" type="warning">
                Delete action for "{formToDelete.iso}" (ID: {formToDelete.id}).
                Implement Redux deletion.
            </Notification>,
        )
    }, [])

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected items (needs Redux action):',
            selectedForms.map((f) => f.id),
        )
        setSelectedForms([])
        toast.push(
            <Notification title="Selected Items Delete Action" type="warning">
                {selectedForms.length} item(s) delete action. Implement Redux
                deletion.
            </Notification>,
        )
    }, [selectedForms])
    // --- End Action Handlers ---

    const columns: ColumnDef<FormItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                // Simple cell to display ID, enable sorting
                enableSorting: true,
                cell: (props) => <span>{props.row.original.id}</span>,
            },
            {
                header: 'Continent',
                accessorKey: 'continent_id',
                // Enable sorting
                enableSorting: true,
            },
            {
                header: 'Country',
                accessorKey: 'name',
                // Enable sorting
                enableSorting: true,
            },
            {
                header: 'Short Code',
                accessorKey: 'iso',
                // Enable sorting
                enableSorting: true,
            },
            {
                header: 'Phone Code',
                accessorKey: 'phonecode',
                // Enable sorting
                enableSorting: true,
            },
            {
                header: 'Action',
                id: 'action',
                meta: { HeaderClass: 'text-center' },
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)} // Open edit drawer
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleEdit, handleDelete],
    )

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="lg:flex items-center justify-between mb-4">
                        <h5 className="mb-4 lg:mb-0">Countries</h5>
                        <FormListActionTools
                            allFormsData={processedDataForCsv}
                            openAddDrawer={openAddDrawer} // Pass the function as a prop
                        />
                    </div>

                    <div className="mb-4 w-full">
                        <FormListTableTools
                            onSearchChange={handleSearchChange}
                            // filterData and setFilterData props removed
                        />
                    </div>

                    <FormListTable
                        columns={columns}
                        data={pageData}
                        loading={
                            localIsLoading || masterLoadingStatus === 'loading'
                        }
                        pagingData={{
                            total: total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedForms={selectedForms}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </AdaptiveCard>

                <FormListSelected
                    selectedForms={selectedForms}
                    setSelectedForms={setSelectedForms}
                    onDeleteSelected={handleDeleteSelected}
                />
            </Container>
            <Drawer
                    title="Edit Country"
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
                                    console.log('Updated Country:', selectedItem);
                                    closeEditDrawer();
                                }}
                            >
                                Save
                            </Button>
                        </div>
                    }
                >
                    <Form size="sm" containerClassName="flex flex-col">
                        <FormItem label="ID">
                            <Input
                                placeholder="ID"
                                value={selectedItem?.id || ''} // Populate with selected item's ID
                                readOnly // Make the ID field read-only
                            />
                        </FormItem>
                        <FormItem label="Continent">
                            <Input
                                placeholder="Enter Continent"
                                value={selectedItem?.continent_id || ''} // Populate with selected item's continent
                                onChange={(e) =>
                                    setSelectedItem((prev) => ({
                                        ...(prev || { id: '', continent_id: '', name: '', iso: '', phonecode: '' }),
                                        continent_id: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="Country">
                            <Input
                                placeholder="Enter Country"
                                value={selectedItem?.name || ''} // Populate with selected item's country
                                onChange={(e) =>
                                    setSelectedItem((prev) => ({
                                        ...(prev || { id: '', continent_id: '', name: '', iso: '', phonecode: '' }),
                                        name: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="Short Code">
                            <Input
                                placeholder="Enter Short Code"
                                value={selectedItem?.iso || ''} // Populate with selected item's short code
                                onChange={(e) =>
                                    setSelectedItem((prev) => ({
                                        ...(prev || { id: '', continent_id: '', name: '', iso: '', phonecode: '' }),
                                        iso: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                        <FormItem label="Phone Code">
                            <Input
                                placeholder="Enter Phone Code"
                                value={selectedItem?.phonecode || ''} // Populate with selected item's phone code
                                onChange={(e) =>
                                    setSelectedItem((prev) => ({
                                        ...(prev || { id: '', continent_id: '', name: '', iso: '', phonecode: '' }),
                                        phonecode: e.target.value,
                                    }))
                                }
                            />
                        </FormItem>
                    </Form>
                </Drawer>

                <Drawer
                    title="Add New Country"
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
                                onClick={() => {
                                    console.log('New Country Added');
                                    closeAddDrawer();
                                }}
                            >
                                Add
                            </Button>
                        </div>
                    }
                >
                    <Form size="sm" containerClassName="flex flex-col">
                        <FormItem label="Continent">
                            <Input placeholder="Enter Continent" />
                        </FormItem>
                        <FormItem label="Country">
                            <Input placeholder="Enter Country" />
                        </FormItem>
                        <FormItem label="Short Code">
                            <Input placeholder="Enter Short Code" />
                        </FormItem>
                        <FormItem label="Phone Code">
                            <Input placeholder="Enter Phone Code" />
                        </FormItem>
                    </Form>
                </Drawer>
        </>
    )
}

export default Countries

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
