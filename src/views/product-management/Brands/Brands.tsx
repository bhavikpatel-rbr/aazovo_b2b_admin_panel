// src/views/your-path/Brands.tsx

import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    useEffect,
    Suspense,
    lazy,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
// import { useForm, Controller } from 'react-hook-form' // No longer needed if filter is removed/simplified
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'
// import type { ZodType } from 'zod'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
// import Dialog from '@/components/ui/Dialog' // Keep if edit/add uses a dialog
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
// import Checkbox from '@/components/ui/Checkbox' // No longer needed if filter removed
// import Input from '@/components/ui/Input' // No longer needed if filter removed
// import { Form, FormItem as UiFormItem } from '@/components/ui/Form' // No longer needed if filter removed

// Icons
import {
    TbPencil,
    TbCopy,
    TbSwitchHorizontal,
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudUpload,
    TbCloudDownload,
    // TbFilter, // Removing for now, can be re-added with relevant filters
    TbPlus,
    TbBuildingStore,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import { getBrandAction } from '@/reduxtool/master/middleware' // Use getBrandAction
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
    import('react-csv').then((module) => ({ default: module.CSVLink })),
)

// --- Define BrandItem Type (Table Row Data - Mapped from API) ---
export type BrandItem = {
    id: number // API provides number
    name: string
    slug: string
    icon: string | null // Filename or null
    showHeader: number // 0 or 1
    status: 'active' | 'inactive' // Mapped from "Active"/"Inactive"
    metaTitle: string | null
    metaDescription: string | null
    metaKeyword: string | null
    createdAt: string
    updatedAt: string
    mobileNo: string | null
}

// Type for data coming directly from API before mapping
type ApiBrandItem = {
    id: number
    name: string
    slug: string
    icon: string | null
    show_header: number
    status: string // "Active" or "Inactive"
    meta_title: string | null
    meta_descr: string | null
    meta_keyword: string | null
    created_at: string
    updated_at: string
    mobile_no: string | null
}
// --- End BrandItem Type Definition ---

// FilterFormSchema removed as specific product/channel filters are removed.
// A new filter schema can be defined if filtering on actual BrandData fields is needed.

// --- Constants ---
const statusColor: Record<BrandItem['status'], string> = {
    active: 'text-green-600 bg-green-100 dark:text-green-100 dark:bg-green-500/20',
    inactive: 'text-red-600 bg-red-100 dark:text-red-100 dark:bg-red-500/20',
}

// Placeholder for your actual base URL for brand icons
const BRAND_ICON_BASE_URL = 'https://aazovo.codefriend.in/storage/' // CHANGE THIS

// initialDummyBrands removed

// channelList removed

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone,
    onChangeStatus,
    onDelete,
}: {
    onEdit: () => void
    onClone?: () => void
    onChangeStatus: () => void
    onDelete: () => void
}) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
            {onClone && (
                <Tooltip title="Clone Brand">
                    <div
                        className={classNames(
                            iconButtonClass,
                            hoverBgClass,
                            'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                        )}
                        role="button"
                        onClick={onClone}
                    >
                        <TbCopy />
                    </div>
                </Tooltip>
            )}
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
            <Tooltip title="Edit Brand">
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
            <Tooltip title="Delete Brand">
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

// --- BrandTable Component (No changes needed in its definition) ---
const BrandTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedBrands,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<BrandItem>[]
    data: BrandItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedBrands: BrandItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: BrandItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<BrandItem>[]) => void
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
                selectedBrands.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}

// --- BrandSearch Component (No changes needed in its definition) ---
type BrandSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const BrandSearch = React.forwardRef<HTMLInputElement, BrandSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                className="w-full md:w-auto"
                placeholder="Search brands..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
BrandSearch.displayName = 'BrandSearch'

// BrandTableFilter component removed as the previous filter fields are not in the new data.
// A new filter component can be created if needed for fields like 'name' or 'status'.

// --- BrandTableTools Component ---
const BrandTableTools = ({
    onSearchChange,
    allBrandsData,
}: {
    onSearchChange: (query: string) => void
    allBrandsData: BrandItem[]
}) => {
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Status', key: 'status' },
        { label: 'Mobile No', key: 'mobileNo' },
        { label: 'Icon Filename', key: 'icon' },
        { label: 'Slug', key: 'slug' },
        { label: 'Created At', key: 'createdAt' },
        { label: 'Updated At', key: 'updatedAt' },
    ]

    const csvExportData = useMemo(
        () =>
            allBrandsData.map((brand) => ({
                id: brand.id,
                name: brand.name,
                status: brand.status,
                mobileNo: brand.mobileNo ?? 'N/A',
                icon: brand.icon ?? 'N/A',
                slug: brand.slug,
                createdAt: brand.createdAt,
                updatedAt: brand.updatedAt,
            })),
        [allBrandsData],
    )

    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
            <div className="flex-grow">
                <BrandSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex items-center gap-2">
                {/* Filter button removed for now. Can be re-added.
                <BrandTableFilter
                    filterData={filterData}
                    setFilterData={setFilterData}
                /> */}
                <Button
                    icon={<TbCloudDownload />}
                    onClick={() =>
                        alert('Import functionality to be implemented.')
                    }
                >
                    Import
                </Button>
                <Suspense fallback={<Button loading>Exporting...</Button>}>
                    <CSVLink
                        filename="brands_list.csv"
                        data={csvExportData}
                        headers={csvHeaders}
                    >
                        <Button icon={<TbCloudUpload />}>Export</Button>
                    </CSVLink>
                </Suspense>
            </div>
        </div>
    )
}

// --- BrandActionTools Component ---
const BrandActionTools = () => {
    const navigate = useNavigate()
    return (
        <div className="flex flex-col md:flex-row gap-3">
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={() => console.log('Navigate to Add New Brand page')}
                block
            >
                Add New Brand
            </Button>
        </div>
    )
}

// --- BrandSelected Component (No changes needed in its definition) ---
const BrandSelected = ({
    selectedBrands,
    setSelectedBrands,
    onDeleteSelected,
}: {
    selectedBrands: BrandItem[]
    setSelectedBrands: React.Dispatch<React.SetStateAction<BrandItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedBrands.length === 0) return null

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
                                {selectedBrands.length}
                            </span>
                            <span>
                                Brand{selectedBrands.length > 1 ? 's' : ''}{' '}
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
                title={`Delete ${selectedBrands.length} Brand${selectedBrands.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected brand
                    {selectedBrands.length > 1 ? 's' : ''}? This action cannot
                    be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}

// --- Main Brands Component ---
const Brands = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    // Fetch Brand Data from Redux
    useEffect(() => {
        dispatch(getBrandAction())
    }, [dispatch])

    const { BrandData = [], status: masterLoadingStatus = 'idle' } =
        useSelector(masterSelector)

    // This local 'brands' state will hold the mapped data from Redux.
    // Actions like clone, delete, status change will modify this local state for UI responsiveness.
    // For persistence, these actions would need to dispatch Redux actions.
    const [brands, setBrands] = useState<BrandItem[]>([])

    useEffect(() => {
        if (BrandData && BrandData.length > 0) {
            const mappedData = BrandData.map((apiItem: ApiBrandItem) => ({
                id: apiItem.id,
                name: apiItem.name,
                slug: apiItem.slug,
                icon: apiItem.icon,
                showHeader: apiItem.show_header,
                status: apiItem.status === 'Active' ? 'active' : 'inactive', // Map status
                metaTitle: apiItem.meta_title,
                metaDescription: apiItem.meta_descr,
                metaKeyword: apiItem.meta_keyword,
                createdAt: apiItem.created_at,
                updatedAt: apiItem.updated_at,
                mobileNo: apiItem.mobile_no,
            }))
            setBrands(mappedData)
        } else {
            setBrands([]) // Clear local state if Redux data is empty
        }
    }, [BrandData])

    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedBrands, setSelectedBrands] = useState<BrandItem[]>([])
    // Filter state removed as the specific filter UI was removed.
    // const [filterData, setFilterData] = useState<BrandFilterFormSchema>({
    //     purchasedProducts: '',
    //     purchaseChannel: [],
    // })

    const { pageData, total, processedDataForCsv } = useMemo(() => {
        console.log(
            '[Memo] Recalculating Brands. Query:',
            tableData.query,
            'Sort:',
            tableData.sort,
            'Page:',
            tableData.pageIndex,
            'Input Data (local brands state) Length:',
            brands?.length ?? 0,
        )

        let processedData: BrandItem[] = cloneDeep(brands) // Use the local 'brands' state derived from Redux

        // Filter logic for purchasedProducts/purchaseChannel removed.
        // Add new filter logic here if needed, based on BrandItem fields.

        // Apply Search Query (on id, name, mobileNo, status)
        if (tableData.query && tableData.query.trim() !== '') {
            const query = tableData.query.toLowerCase().trim()
            processedData = processedData.filter((item: BrandItem) => {
                const nameLower = item.name?.trim().toLowerCase() ?? ''
                const idStringLower = String(item.id ?? '')
                    .trim()
                    .toLowerCase() // ID is number
                const mobileLower = item.mobileNo?.trim().toLowerCase() ?? ''
                const statusLower = item.status?.trim().toLowerCase() ?? ''
                const slugLower = item.slug?.trim().toLowerCase() ?? ''
                return (
                    nameLower.includes(query) ||
                    idStringLower.includes(query) ||
                    mobileLower.includes(query) ||
                    statusLower.includes(query) ||
                    slugLower.includes(query)
                )
            })
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key && processedData.length > 0) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                const aValue = a[key as keyof BrandItem]
                const bValue = b[key as keyof BrandItem]

                if (aValue === null && bValue === null) return 0
                if (aValue === null) return order === 'asc' ? -1 : 1
                if (bValue === null) return order === 'asc' ? 1 : -1

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return order === 'asc' ? aValue - bValue : bValue - aValue
                }
                // For date strings (createdAt, updatedAt)
                if (key === 'createdAt' || key === 'updatedAt') {
                    return order === 'asc'
                        ? new Date(aValue as string).getTime() -
                              new Date(bValue as string).getTime()
                        : new Date(bValue as string).getTime() -
                              new Date(aValue as string).getTime()
                }
                return 0
            })
            processedData = sortedData
        }

        const dataBeforePagination = [...processedData]

        // Apply Pagination
        const currentTotal = processedData.length
        const pageIndex = tableData.pageIndex as number
        const pageSize = tableData.pageSize as number
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return {
            pageData: dataForPage,
            total: currentTotal,
            processedDataForCsv: dataBeforePagination,
        }
    }, [brands, tableData]) // Dependency on local 'brands' state

    // --- Handlers ---
    // handleApplyFilter removed as filter UI is removed. Can be re-added.
    // const handleApplyFilter = useCallback((newFilterData: BrandFilterFormSchema) => {
    //     setFilterData(newFilterData)
    //     setTableData((prev) => ({ ...prev, pageIndex: 1 }))
    //     setSelectedBrands([])
    // }, [])

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
            setSelectedBrands([])
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

    const handleRowSelect = useCallback((checked: boolean, row: BrandItem) => {
        setSelectedBrands((prev) => {
            if (checked)
                return prev.some((b) => b.id === row.id) ? prev : [...prev, row]
            return prev.filter((b) => b.id !== row.id)
        })
    }, [])

    const handleAllRowSelect = useCallback(
        (checked: boolean, currentRows: Row<BrandItem>[]) => {
            const currentPageRowOriginals = currentRows.map((r) => r.original)
            if (checked) {
                setSelectedBrands((prevSelected) => {
                    const prevSelectedIds = new Set(
                        prevSelected.map((b) => b.id),
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
                setSelectedBrands((prevSelected) =>
                    prevSelected.filter((b) => !currentPageRowIds.has(b.id)),
                )
            }
        },
        [],
    )

    // --- Action Handlers (modify local 'brands' state; need Redux for persistence) ---
    const handleEdit = useCallback(
        (brand: BrandItem) => {
            console.log('Edit brand:', brand.id)
            toast.push(
                <Notification title="Edit Brand" type="info">
                    Edit action for "{brand.name}" (ID: {brand.id}). Implement
                    navigation or modal.
                </Notification>,
            )
            // navigate(`/app/brands/edit/${brand.id}`);
        },
        [navigate],
    )

    const handleClone = useCallback((brandToClone: BrandItem) => {
        const newId = Math.floor(Math.random() * 100000) + 10000 // Example new ID
        const clonedBrand: BrandItem = {
            ...cloneDeep(brandToClone),
            id: newId,
            name: `${brandToClone.name} (Clone)`,
            status: 'inactive',
            // Reset dates or handle as needed
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        setBrands((prev) => [clonedBrand, ...prev]) // Modifies local state
        toast.push(
            <Notification title="Brand Cloned (Locally)" type="success">
                Brand "{brandToClone.name}" cloned locally.
            </Notification>,
        )
    }, [])

    const handleChangeStatus = useCallback((brandToChange: BrandItem) => {
        const newStatus =
            brandToChange.status === 'active' ? 'inactive' : 'active'
        setBrands((prevBrands) =>
            prevBrands.map((b) =>
                b.id === brandToChange.id
                    ? {
                          ...b,
                          status: newStatus,
                          updatedAt: new Date().toISOString(),
                      }
                    : b,
            ),
        ) // Modifies local state
        toast.push(
            <Notification title="Status Changed (Locally)" type="info">
                Status of "{brandToChange.name}" changed locally.
            </Notification>,
        )
    }, [])

    const handleDelete = useCallback((brandToDelete: BrandItem) => {
        setBrands((prevBrands) =>
            prevBrands.filter((b) => b.id !== brandToDelete.id),
        ) // Modifies local state
        setSelectedBrands((prevSelected) =>
            prevSelected.filter((b) => b.id !== brandToDelete.id),
        )
        toast.push(
            <Notification title="Brand Deleted (Locally)" type="warning">
                Brand "{brandToDelete.name}" deleted locally.
            </Notification>,
        )
    }, [])

    const handleDeleteSelected = useCallback(() => {
        const selectedIds = new Set(selectedBrands.map((b) => b.id))
        setBrands((prevBrands) =>
            prevBrands.filter((b) => !selectedIds.has(b.id)),
        ) // Modifies local state
        setSelectedBrands([])
        toast.push(
            <Notification
                title="Selected Brands Deleted (Locally)"
                type="warning"
            >
                {selectedBrands.length} brand(s) deleted locally.
            </Notification>,
        )
    }, [selectedBrands])
    // --- End Action Handlers ---

    const columns: ColumnDef<BrandItem>[] = useMemo(
        () => [
            { header: 'ID', accessorKey: 'id', enableSorting: true, size: 60 },
            {
                header: 'Brand',
                accessorKey: 'name', // Sort by name by default
                enableSorting: true,
                cell: (props) => {
                    const { icon, name } = props.row.original
                    let iconUrl: string | undefined = undefined

                    if (icon) {
                        // Check if 'icon' is already a full URL
                        if (
                            icon.startsWith('http://') ||
                            icon.startsWith('https://')
                        ) {
                            iconUrl = icon
                        } else {
                            // Prepend base URL if it's just a filename
                            // Ensure no double slashes if BRAND_ICON_BASE_URL ends with / and icon starts with /
                            const baseUrlEndsWithSlash =
                                BRAND_ICON_BASE_URL.endsWith('/')
                            const iconStartsWithSlash = icon.startsWith('/')
                            if (baseUrlEndsWithSlash && iconStartsWithSlash) {
                                iconUrl = `${BRAND_ICON_BASE_URL.slice(0, -1)}${icon}`
                            } else if (
                                !baseUrlEndsWithSlash &&
                                !iconStartsWithSlash
                            ) {
                                iconUrl = `${BRAND_ICON_BASE_URL}/${icon}`
                            } else {
                                iconUrl = `${BRAND_ICON_BASE_URL}${icon}`
                            }
                        }
                    }
                    // For debugging:
                    console.log(
                        `Brand: ${name}, Icon Filename: ${icon}, Constructed URL: ${iconUrl}`,
                    )

                    return (
                        <div className="flex items-center gap-2 min-w-[200px]">
                            <Avatar
                                size={30}
                                shape="circle"
                                src={iconUrl} // Pass the constructed URL or undefined
                                icon={<TbBuildingStore />} // Fallback icon
                            >
                                {/* Show first letter of name if no image URL */}
                                {!iconUrl && name
                                    ? name.charAt(0).toUpperCase()
                                    : ''}
                            </Avatar>
                            <span>{name}</span>
                        </div>
                    )
                },
            },
            {
                header: 'Mobile No',
                accessorKey: 'mobileNo',
                enableSorting: true,
                cell: (props) => props.row.original.mobileNo ?? '-',
            },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                cell: (props) => {
                    const status = props.row.original.status
                    return (
                        <Tag className={`${statusColor[status]} capitalize`}>
                            {status}
                        </Tag>
                    )
                },
            },
            {
                header: 'Action',
                id: 'action',
                meta: { className: 'text-center' },
                cell: (props) => (
                    <ActionColumn
                        onEdit={() => handleEdit(props.row.original)}
                        onClone={() => handleClone(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleEdit, handleClone, handleChangeStatus, handleDelete],
    )

    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Brands</h5>
                    <BrandActionTools />
                </div>

                <div className="mb-4">
                    <BrandTableTools
                        onSearchChange={handleSearchChange}
                        allBrandsData={processedDataForCsv}
                        // filterData and setFilterData props removed as filter UI is removed
                    />
                </div>

                <div className="flex-grow overflow-auto">
                    <BrandTable
                        columns={columns}
                        data={pageData}
                        loading={masterLoadingStatus === 'loading'} // Use Redux loading status
                        pagingData={{
                            total: total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedBrands={selectedBrands}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            <BrandSelected
                selectedBrands={selectedBrands}
                setSelectedBrands={setSelectedBrands}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}

export default Brands

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ')
}
