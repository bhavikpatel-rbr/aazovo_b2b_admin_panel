// src/views/your-path/Products.tsx

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom' // Ensure useNavigate is imported
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames' // Import classnames

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast' // Make sure toast is configured in your app
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbBox } from 'react-icons/tb' // Placeholder icon for product image

// Icons
import {
    TbPencil,
    TbCopy,
    TbSwitchHorizontal,
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbCategoryPlus, // Using as placeholder for add product
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type (Table Row Data) ---
export type ProductItem = {
    id: string
    status: 'active' | 'inactive' | 'draft' | 'archived'
    name: string
    sku: string
    categoryName: string
    subcategoryName: string | null
    brandName: string
    image: string | null
}
// --- End Item Type Definition ---

// --- Constants ---
const statusColor: Record<ProductItem['status'], string> = {
    active: 'bg-emerald-500',
    inactive: 'bg-amber-500',
    draft: 'bg-gray-500',
    archived: 'bg-red-500',
}

const initialDummyProducts: ProductItem[] = [
    {
        id: 'PROD001',
        status: 'active',
        name: 'Smartphone X',
        sku: 'SPX-1000',
        categoryName: 'Electronics',
        subcategoryName: 'Mobile Phones',
        brandName: 'Alpha Gadgets',
        image: '/img/products/phone_x.jpg',
    },
    {
        id: 'PROD002',
        status: 'active',
        name: 'Laptop Pro 15"',
        sku: 'LPP-15-G2',
        categoryName: 'Electronics',
        subcategoryName: 'Laptops',
        brandName: 'Beta Solutions',
        image: '/img/products/laptop_pro.jpg',
    },
    {
        id: 'PROD003',
        status: 'draft',
        name: 'Wireless Earbuds',
        sku: 'WEB-001',
        categoryName: 'Electronics',
        subcategoryName: 'Accessories',
        brandName: 'Alpha Gadgets',
        image: null,
    },
    {
        id: 'PROD004',
        status: 'active',
        name: "Men's Casual T-Shirt",
        sku: 'MCT-BL-L',
        categoryName: 'Clothing',
        subcategoryName: "Men's Wear",
        brandName: 'Gamma Apparel',
        image: '/img/products/tshirt_men.jpg',
    },
    {
        id: 'PROD005',
        status: 'inactive',
        name: "Women's Running Shoes",
        sku: 'WRS-PNK-8',
        categoryName: 'Clothing',
        subcategoryName: 'Shoes',
        brandName: 'Eta Fitness',
        image: '/img/products/shoes_women.jpg',
    },
    {
        id: 'PROD006',
        status: 'active',
        name: 'Organic Coffee Beans',
        sku: 'OCB-1KG',
        categoryName: 'Groceries',
        subcategoryName: 'Beverages',
        brandName: 'Delta Foods',
        image: null,
    },
    {
        id: 'PROD007',
        status: 'archived',
        name: 'Old Model TV 42"',
        sku: 'TV-OLD-42',
        categoryName: 'Home Appliances',
        subcategoryName: 'Televisions',
        brandName: 'Epsilon Home',
        image: '/img/products/tv_old.jpg',
    },
    {
        id: 'PROD008',
        status: 'active',
        name: 'Gaming Chair',
        sku: 'GC-RED-01',
        categoryName: 'Furniture',
        subcategoryName: 'Chairs',
        brandName: 'Zeta Toys',
        image: '/img/products/gaming_chair.jpg',
    },
    {
        id: 'PROD009',
        status: 'active',
        name: 'Sci-Fi Novel "Cosmos"',
        sku: 'BOOK-SF-CSMS',
        categoryName: 'Books',
        subcategoryName: 'Fiction',
        brandName: 'Lambda Books',
        image: '/img/products/book_cosmos.jpg',
    },
    {
        id: 'PROD010',
        status: 'active',
        name: 'Bluetooth Speaker',
        sku: 'BTSPK-BLK',
        categoryName: 'Electronics',
        subcategoryName: 'Audio Equipment',
        brandName: 'Alpha Gadgets',
        image: '/img/products/bt_speaker.jpg',
    },
    {
        id: 'PROD011',
        status: 'draft',
        name: 'Leather Handbag',
        sku: 'LHB-BRN',
        categoryName: 'Clothing',
        subcategoryName: "Women's Wear",
        brandName: 'Iota Beauty',
        image: null,
    },
    {
        id: 'PROD012',
        status: 'active',
        name: 'Sedan Car Model',
        sku: 'CAR-SDN-BLU',
        categoryName: 'Automotive',
        subcategoryName: null,
        brandName: 'Kappa Auto',
        image: '/img/products/car_sedan.jpg',
    },
    {
        id: 'PROD013',
        status: 'inactive',
        name: 'Documentary DVD Set',
        sku: 'DVD-DOC-SET',
        categoryName: 'Media',
        subcategoryName: null,
        brandName: 'Mu Media',
        image: null,
    },
    {
        id: 'PROD014',
        status: 'draft',
        name: 'Smart Watch SE',
        sku: 'SW-SE-GRY',
        categoryName: 'Electronics',
        subcategoryName: 'Accessories',
        brandName: 'Beta Solutions',
        image: '/img/products/smartwatch_se.jpg',
    },
    {
        id: 'PROD015',
        status: 'draft',
        name: 'Running Shorts',
        sku: 'RNSH-BLK-M',
        categoryName: 'Clothing',
        subcategoryName: "Men's Wear",
        brandName: 'Eta Fitness',
        image: null,
    },
]

// Tab Definitions
const TABS = {
    ALL: 'all',
    PENDING: 'pending', // Using 'draft' status for pending
}
// --- End Constants ---

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
        <div className="flex items-center justify-end gap-2">
            {onClone && (
                <Tooltip title="Clone Product">
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
                    {' '}
                    <TbSwitchHorizontal />{' '}
                </div>
            </Tooltip>
            <Tooltip title="Edit Product">
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
            <Tooltip title="Delete Product">
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

// --- ProductTable Component ---
const ProductTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedProducts,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<ProductItem>[]
    data: ProductItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedProducts: ProductItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: ProductItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<ProductItem>[]) => void
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
                selectedProducts.some((selected) => selected.id === row.id)
            }
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            onCheckBoxChange={onRowSelect}
            onIndeterminateCheckBoxChange={onAllRowSelect}
        />
    )
}
// --- End ProductTable ---

// --- ProductSearch Component ---
type ProductSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const ProductSearch = React.forwardRef<HTMLInputElement, ProductSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Quick search..."
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
ProductSearch.displayName = 'ProductSearch'
// --- End ProductSearch ---

// --- ProductTableTools Component ---
const ProductTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <ProductSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter button could be added here */}
        </div>
    )
}
// --- End ProductTableTools ---

// --- ProductActionTools Component ---
const ProductActionTools = ({
    allProducts,
}: {
    allProducts: ProductItem[]
}) => {
    const navigate = useNavigate()
    // Prepare data for CSV
    const csvData = useMemo(() => {
        return allProducts.map((item) => ({
            id: item.id,
            name: item.name,
            status: item.status,
            sku: item.sku,
            categoryName: item.categoryName,
            subcategoryName: item.subcategoryName ?? 'N/A',
            brandName: item.brandName,
            imageUrl: item.image ?? 'No Image',
        }))
    }, [allProducts])
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Name', key: 'name' },
        { label: 'Status', key: 'status' },
        { label: 'SKU', key: 'sku' },
        { label: 'Category', key: 'categoryName' },
        { label: 'Subcategory', key: 'subcategoryName' },
        { label: 'Brand', key: 'brandName' },
        { label: 'Image URL', key: 'imageUrl' },
    ]

    const handleAddProduct = () => {
        navigate('/products/create') // Adjust route as needed
    }

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink filename="products.csv" data={csvData} headers={csvHeaders} >
                <Button icon={<TbCloudDownload />} className="w-full" block> Download </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbBox className="text-lg" />}
                onClick={handleAddProduct}
                block
            >
                Add New
            </Button>
        </div>
    )
}
// --- End ProductActionTools ---

// --- ProductSelected Component ---
const ProductSelected = ({
    selectedProducts,
    setSelectedProducts,
    onDeleteSelected,
}: {
    selectedProducts: ProductItem[]
    setSelectedProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedProducts.length === 0) return null

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
                                {selectedProducts.length}
                            </span>
                            <span>
                                Product{selectedProducts.length > 1 ? 's' : ''}{' '}
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
                            {' '}
                            Delete{' '}
                        </Button>
                    </div>
                </div>
            </StickyFooter>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title={`Delete ${selectedProducts.length} Product${selectedProducts.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to delete the selected product
                    {selectedProducts.length > 1 ? 's' : ''}? This action cannot
                    be undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End ProductSelected ---

// --- Main Products Component ---
const Products = () => {
    const navigate = useNavigate()

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false)
    const [products, setProducts] =
        useState<ProductItem[]>(initialDummyProducts)
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([])
    const [currentTab, setCurrentTab] = useState<string>(TABS.ALL)
    // --- End Lifted State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...products]

        // Apply Tab Filter FIRST
        if (currentTab === TABS.PENDING) {
            processedData = processedData.filter(
                (prod) => prod.status === 'draft',
            )
        }

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (prod) =>
                    prod.id.toLowerCase().includes(query) ||
                    prod.name.toLowerCase().includes(query) ||
                    prod.sku.toLowerCase().includes(query) ||
                    prod.categoryName.toLowerCase().includes(query) ||
                    (prod.subcategoryName?.toLowerCase().includes(query) ??
                        false) ||
                    prod.brandName.toLowerCase().includes(query) ||
                    prod.status.toLowerCase().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                const aValue = a[key as keyof ProductItem] ?? ''
                const bValue = b[key as keyof ProductItem] ?? ''
                if (key === 'subcategoryName') {
                    if (aValue === null && bValue === null) return 0
                    if (aValue === null) return order === 'asc' ? -1 : 1
                    if (bValue === null) return order === 'asc' ? 1 : -1
                }
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
    }, [products, tableData, currentTab])
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
            setSelectedProducts([])
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
        (checked: boolean, row: ProductItem) => {
            setSelectedProducts((prev) => {
                if (checked) {
                    return prev.some((prod) => prod.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((prod) => prod.id !== row.id)
                }
            })
        },
        [setSelectedProducts],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<ProductItem>[]) => {
            const currentPageRowIds = new Set(rows.map((r) => r.original.id))
            if (checked) {
                const rowsToAdd = rows.map((row) => row.original)
                setSelectedProducts((prev) => {
                    const existingIds = new Set(prev.map((p) => p.id))
                    const newSelection = rowsToAdd.filter(
                        (p) => !existingIds.has(p.id),
                    )
                    return [...prev, ...newSelection]
                })
            } else {
                setSelectedProducts((prev) =>
                    prev.filter((p) => !currentPageRowIds.has(p.id)),
                )
            }
        },
        [setSelectedProducts],
    )

    const handleEdit = useCallback(
        (product: ProductItem) => {
            console.log('Edit product:', product.id)
            navigate(`/products/edit/${product.id}`) // Adjust route
        },
        [navigate],
    )

    const handleClone = useCallback(
        (productToClone: ProductItem) => {
            console.log(
                'Cloning product:',
                productToClone.id,
                productToClone.name,
            )
            const newId = `PROD${Math.floor(Math.random() * 9000) + 1000}`
            const clonedProduct: ProductItem = {
                ...productToClone,
                id: newId,
                name: `${productToClone.name} (Clone)`,
                status: 'draft',
                sku: `${productToClone.sku}-CLONE`,
            }
            setProducts((prev) => [clonedProduct, ...prev])
            toast.push(
                <Notification
                    title="Product Cloned"
                    type="success"
                    duration={2000}
                >
                    Cloned product added as draft.
                </Notification>,
            )
        },
        [setProducts],
    )

    const handleChangeStatus = useCallback(
        (product: ProductItem) => {
            const statuses: ProductItem['status'][] = [
                'active',
                'inactive',
                'draft',
                'archived',
            ]
            const currentStatusIndex = statuses.indexOf(product.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
            console.log(
                `Changing status of product ${product.id} from ${product.status} to ${newStatus}`,
            )
            setProducts((currentProducts) =>
                currentProducts.map((p) =>
                    p.id === product.id ? { ...p, status: newStatus } : p,
                ),
            )
            toast.push(
                <Notification
                    title="Status Changed"
                    type="success"
                    duration={2000}
                >{`Product ${product.name} status changed to ${newStatus}.`}</Notification>,
            )
        },
        [setProducts],
    )

    const handleDelete = useCallback(
        (productToDelete: ProductItem) => {
            console.log(
                'Deleting product:',
                productToDelete.id,
                productToDelete.name,
            )
            // Consider adding a confirmation dialog specifically for single delete too
            setProducts((currentProducts) =>
                currentProducts.filter(
                    (prod) => prod.id !== productToDelete.id,
                ),
            )
            setSelectedProducts((prevSelected) =>
                prevSelected.filter((prod) => prod.id !== productToDelete.id),
            )
            toast.push(
                <Notification
                    title="Product Deleted"
                    type="success"
                    duration={2000}
                >{`Product ${productToDelete.name} deleted.`}</Notification>,
            )
        },
        [setProducts, setSelectedProducts],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            'Deleting selected products:',
            selectedProducts.map((prod) => prod.id),
        )
        const selectedIds = new Set(selectedProducts.map((prod) => prod.id))
        setProducts((currentProducts) =>
            currentProducts.filter((prod) => !selectedIds.has(prod.id)),
        )
        setSelectedProducts([])
        toast.push(
            <Notification
                title="Products Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} product(s) deleted.`}</Notification>,
        )
    }, [selectedProducts, setProducts, setSelectedProducts])

    const handleTabChange = (tabKey: string) => {
        setCurrentTab(tabKey)
        handleSetTableData({ ...tableData, pageIndex: 1 }) // Reset page index
        setSelectedProducts([]) // Clear selection
    }
    // --- End Lifted Handlers ---

    // --- Define Columns in Parent ---
    const columns: ColumnDef<ProductItem>[] = useMemo(
        () => [
            {
                header: 'ID',
                accessorKey: 'id',
                enableSorting: true,
                width: 120,
            },
            {
                header: 'Image',
                accessorKey: 'image',
                enableSorting: false,
                width: 80, // Adjust width
                cell: (props) => {
                    const { image, name } = props.row.original
                    return (
                        <Avatar
                            size={40}
                            shape="square"
                            src={image}
                            icon={<TbBox />}
                        >
                            {!image ? name.charAt(0).toUpperCase() : ''}
                        </Avatar>
                    )
                },
            },
            { header: 'Name', accessorKey: 'name', enableSorting: true },
            { header: 'SKU', accessorKey: 'sku', enableSorting: true },
            {
                header: 'Category',
                accessorKey: 'categoryName',
                enableSorting: true,
            },
            {
                header: 'Subcategory',
                accessorKey: 'subcategoryName',
                enableSorting: true,
                cell: (props) => (
                    <span>{props.row.original.subcategoryName ?? '-'}</span>
                ),
            },
            { header: 'Brand', accessorKey: 'brandName', enableSorting: true },
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <Tag
                            className={`${statusColor[status]} text-white capitalize`}
                            prefix
                        >
                            {status}
                        </Tag>
                    )
                },
            },
            {
                header: '',
                id: 'action',
                width: 130, // Adjust width for actions
                cell: (props) => (
                    <ActionColumn
                        onClone={() => handleClone(props.row.original)}
                        onChangeStatus={() =>
                            handleChangeStatus(props.row.original)
                        }
                        onEdit={() => handleEdit(props.row.original)}
                        onDelete={() => handleDelete(props.row.original)}
                    />
                ),
            },
        ],
        [handleClone, handleChangeStatus, handleEdit, handleDelete], // Dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Products</h5>
                    <ProductActionTools allProducts={products} />
                </div>

                {/* Tabs Section */}
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            key={TABS.ALL}
                            onClick={() => handleTabChange(TABS.ALL)}
                            className={classNames(
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                                currentTab === TABS.ALL
                                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600',
                            )}
                        >
                            All Products
                        </button>
                        <button
                            key={TABS.PENDING}
                            onClick={() => handleTabChange(TABS.PENDING)}
                            className={classNames(
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                                currentTab === TABS.PENDING
                                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600',
                            )}
                        >
                            Pending Products
                        </button>
                    </nav>
                </div>

                {/* Tools Section (Search) */}
                <div className="mb-4">
                    <ProductTableTools onSearchChange={handleSearchChange} />
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto">
                    <ProductTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedProducts={selectedProducts}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Actions Footer */}
            <ProductSelected
                selectedProducts={selectedProducts}
                setSelectedProducts={setSelectedProducts}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default Products

// Helper Function (make sure it's defined or imported)
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
