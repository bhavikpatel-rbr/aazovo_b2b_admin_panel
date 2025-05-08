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
    TbFilter, // Filter icon removed
    TbCloudUpload,
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
export type SliderItem = {
    id: string
    image: string
    domain: string
    displayPage: string
    link: string
    status: 'active' | 'inactive' // Changed status options
    // Add other form-specific fields if needed later
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

// --- SliderItemSearch Component ---
type SliderItemSearchProps = {
    // Renamed component
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const SliderItemSearch = React.forwardRef<
    HTMLInputElement,
    SliderItemSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Quick Search..." // Updated placeholder
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
SliderItemSearch.displayName = 'SliderItemSearch'
// --- End SliderItemSearch ---

// --- SliderItemTableTools Component ---
const SliderItemTableTools = ({
    // Renamed component
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {

    type SliderItemFilterSchema = {
        userRole : String,
        exportFrom : String,
        exportDate : Date
    }

    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
    const closeFilterDrawer = ()=> setIsFilterDrawerOpen(false)
    const openFilterDrawer = ()=> setIsFilterDrawerOpen(true)

    const {control, handleSubmit} = useForm<SliderItemFilterSchema>()

    const exportFiltersSubmitHandler = (data : SliderItemFilterSchema) => {
        console.log("filter data", data)
    }

    return (
        <div className="flex items-center w-full gap-2">
            <div className="flex-grow">
                <SliderItemSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter component removed */}
            <Button icon={<TbFilter />} className='' onClick={openFilterDrawer}>
                Filter
            </Button>
            <Button icon={<TbCloudUpload/>}>Export</Button>
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeFilterDrawer}>
                            Cancel
                        </Button>
                    </div>  
                }
            >
                <Form size='sm' onSubmit={handleSubmit(exportFiltersSubmitHandler)} containerClassName='flex flex-col'>
                    <FormItem label='Document Name'>
                        {/* <Controller
                            control={control}
                            name='userRole'
                            render={({field})=>(
                                <Input
                                    type="text"
                                    placeholder="Enter Document Name"
                                    {...field}
                                />
                            )}
                        /> */}
                    </FormItem>
                </Form>
            </Drawer>
        </div>
    )
}
// --- End SliderItemTableTools ---

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
    columns: ColumnDef<SliderItem>[]
    data: SliderItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedForms: SliderItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: SliderItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<SliderItem>[]) => void
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
    allFormsData: SliderItem[];
    openAddDrawer: () => void; // Accept function as a prop
}) => {
    const navigate = useNavigate()
    const csvHeaders = [

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
    selectedForms: SliderItem[]
    setSelectedForms: React.Dispatch<React.SetStateAction<SliderItem[]>>
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
const Sliders = () => {

    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SliderItem | null>(null);

    const openEditDrawer = (item: SliderItem) => {
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

    const { SlidersData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)
 // Use the provided dummy data

// --- Initial Dummy Data ---
const initialDummyForms: SliderItem[] = [
    { id: 'F001', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active' },
    { id: 'F002', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active'},
    { id: 'F003', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active' },
    { id: 'F004', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active'},
    { id: 'F005', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active'},
    { id: 'F006', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active'},
    { id: 'F007', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active'},
    { id: 'F008', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active'},
    { id: 'F009', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active'},
    { id: 'F010', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active' },
    { id: 'F011', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active'},
    { id: 'F012', image: 'Test', domain: 'test', displayPage: 'Home', link: 'Click Here', status: 'active'},
]
// --- End Dummy Data ---

const [forms, setForms] = useState<SliderItem[]>(initialDummyForms); // Initialize with dummy data
const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: '', key: '' },
    query: '',
});
const [selectedForms, setSelectedForms] = useState<SliderItem[]>([]);
    const [localIsLoading, setLocalIsLoading] = useState(false)
    // filterData state and handleApplyFilter removed

    console.log('Raw CountriesData from Redux:', SlidersData)

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
            SlidersData?.length ?? 0,
        )

        const sourceData: SliderItem[] = Array.isArray(SlidersData)
            ? SlidersData
            : []
        let processedData: SliderItem[] = cloneDeep(sourceData)

        // Product and Channel filtering logic removed

        // 1. Apply Search Query (on id and name)
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            console.log('[Memo] Applying search query:', query)
            processedData = processedData.filter((item: SliderItem) => {
                const itemNameLower = item.domain?.trim().toLowerCase() ?? ''
                const continentNameLower = item.domain?.trim().toLowerCase() ?? ''
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
                const aValue = String(a[key as keyof SliderItem] ?? '')
                const bValue = String(b[key as keyof SliderItem] ?? '')

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
    }, [SlidersData, tableData]) // filterData removed from dependencies

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

    const handleRowSelect = useCallback((checked: boolean, row: SliderItem) => {
        setSelectedForms((prev) => {
            if (checked)
                return prev.some((f) => f.id === row.id) ? prev : [...prev, row]
            return prev.filter((f) => f.id !== row.id)
        })
    }, [])

    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<SliderItem>[]) => {
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
        (form: SliderItem) => {
            console.log('Edit item (requires navigation/modal):', form.id)
            toast.push(
                <Notification title="Edit Action" type="info">
                    Edit action for "{form.domain}" (ID: {form.id}). Implement
                    navigation or modal.
                </Notification>,
            )
        },
        [navigate],
    )

    const handleDelete = useCallback((formToDelete: SliderItem) => {
        console.log(
            'Delete item (needs Redux action):',
            formToDelete.id,
            formToDelete.domain,
        )
        setSelectedForms((prevSelected) =>
            prevSelected.filter((form) => form.id !== formToDelete.id),
        )
        toast.push(
            <Notification title="Delete Action" type="warning">
                Delete action for "{formToDelete.domain}" (ID: {formToDelete.id}).
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

    const columns: ColumnDef<SliderItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                // Simple cell to display ID, enable sorting
                enableSorting: true,
                cell: (props) => <span>{props.row.original.id}</span>,
            },
            {
                header: 'Image',
                accessorKey: 'image',
                // Enable sorting
                enableSorting: true,
            },
            {
                header: 'Domain',
                accessorKey: 'domain',
                // Enable sorting
                enableSorting: true,
            },
            {
                header: 'Display Page',
                accessorKey: 'displayPage',
                // Enable sorting
                enableSorting: true,
            },
            {
                header: 'Link',
                accessorKey: 'link',
                // Enable sorting
                enableSorting: true,
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                cell: (props) => (
                    <Tag
                        className={
                            props.row.original.status === 'active'
                                ? 'bg-green-200 text-green-600'
                                : 'bg-red-200 text-red-600'
                        }
                    >
                        {props.row.original.status}
                    </Tag>
                ),
            },
            {
                header: 'Action',
                id: 'action',
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => openEditDrawer(props.row.original)} // Open edit drawer
                        onDelete={() => console.log('Delete', props.row.original)}
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
                        <h5 className="mb-4 lg:mb-0">Slider's Page</h5>
                        <FormListActionTools
                            allFormsData={forms}
                            openAddDrawer={openAddDrawer} // Pass the function as a prop
                        />
                    </div>

                    <div className="mb-4">
                        <SliderItemTableTools
                            onSearchChange={(query) =>
                                setTableData((prev) => ({ ...prev, query }))
                            }
                        />
                    </div>

                    <FormListTable
                        columns={columns}
                        data={forms}
                        loading={false}
                        pagingData={{
                            total: forms.length,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedForms={selectedForms}
                        onPaginationChange={(page) =>
                            setTableData((prev) => ({ ...prev, pageIndex: page }))
                        }
                        onSelectChange={(value) =>
                            setTableData((prev) => ({
                                ...prev,
                                pageSize: Number(value),
                                pageIndex: 1,
                            }))
                        }
                        onSort={(sort) =>
                            setTableData((prev) => ({ ...prev, sort }))
                        }
                        onRowSelect={(checked, row) =>
                            setSelectedForms((prev) =>
                                checked
                                    ? [...prev, row]
                                    : prev.filter((form) => form.id !== row.id)
                            )
                        }
                        onAllRowSelect={(checked, rows) => {
                            const rowIds = rows.map((row) => row.original.id);
                            setSelectedForms((prev) =>
                                checked
                                    ? [...prev, ...rows.map((row) => row.original)]
                                    : prev.filter((form) => !rowIds.includes(form.id))
                            );
                        }}
                    />
                </AdaptiveCard>

                <FormListSelected
                    selectedForms={selectedForms}
                    setSelectedForms={setSelectedForms}
                    onDeleteSelected={() =>
                        setForms((prev) =>
                            prev.filter(
                                (form) =>
                                    !selectedForms.some(
                                        (selected) => selected.id === form.id
                                    )
                            )
                        )
                    }
                />
            </Container>

            {/* Edit Drawer */}
            <Drawer
                title="Edit Slider"
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
                                console.log('Updated Slider:', selectedItem);
                                closeEditDrawer();
                            }}
                        >
                            Save
                        </Button>
                    </div>
                }
            >
                <Form>
                    <FormItem label="Image">
                        <Input
                            value={selectedItem?.image || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', image: '', domain: '', displayPage: '', link: '', status: 'active' }),
                                    image: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Domain">
                        <Input
                            value={selectedItem?.domain || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', image: '', domain: '', displayPage: '', link: '', status: 'active' }),
                                    domain: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Display Page">
                        <Input
                            value={selectedItem?.displayPage || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', image: '', domain: '', displayPage: '', link: '', status: 'active' }),
                                    displayPage: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Link">
                        <Input
                            value={selectedItem?.link || ''}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', image: '', domain: '', displayPage: '', link: '', status: 'active' }),
                                    link: e.target.value,
                                }))
                            }
                        />
                    </FormItem>
                    <FormItem label="Status">
                        <select
                            value={selectedItem?.status || 'active'}
                            onChange={(e) =>
                                setSelectedItem((prev) => ({
                                    ...(prev || { id: '', image: '', domain: '', displayPage: '', link: '', status: 'active' }),
                                    status: e.target.value as 'active' | 'inactive',
                                }))
                            }
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </FormItem>
                </Form>
            </Drawer>


            <Drawer
                title="Add New Slider"
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
                            onClick={() => console.log('Slider Added')}
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
                        const newItem: SliderItem = {
                            id: `${forms.length + 1}`,
                            image: formData.get('image') as string,
                            domain: formData.get('domain') as string,
                            displayPage: formData.get('displayPage') as string,
                            link: formData.get('link') as string,
                            status: formData.get('status') as 'active' | 'inactive',
                        };
                        console.log('New Slider:', newItem);
                        // handleAdd(newItem);
                    }}
                >
                    <FormItem label="Image">
                        <Input name="image" placeholder="Enter Image URL" />
                    </FormItem>
                    <FormItem label="Domain">
                        <Input name="domain" placeholder="Enter Domain" />
                    </FormItem>
                    <FormItem label="Display Page">
                        <Input name="displayPage" placeholder="Enter Display Page" />
                    </FormItem>
                    <FormItem label="Link">
                        <Input name="link" placeholder="Enter Link" />
                    </FormItem>
                    <FormItem label="Status">
                        <select name="status" defaultValue="active">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </FormItem>
                </Form>
            </Drawer>
        </>
    )
}

export default Sliders

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
