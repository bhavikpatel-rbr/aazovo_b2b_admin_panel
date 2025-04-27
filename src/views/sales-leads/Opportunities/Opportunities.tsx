// src/views/your-path/Opportunities.tsx (Or appropriate file path)

import React, { useState, useMemo, useCallback, Ref } from 'react'
import { Link, useNavigate } from 'react-router-dom' // Make sure react-router-dom is installed
import cloneDeep from 'lodash/cloneDeep' // Make sure lodash is installed
import classNames from 'classnames' // Make sure classnames is installed

// UI Components (Ensure these paths are correct for your project)
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast' // Ensure toast setup exists
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { TbBox, TbUser } from 'react-icons/tb'

// Icons
import {
    TbPencil,
    TbCopy,
    TbSwitchHorizontal,
    TbTrash,
    TbChecks,
    TbSearch,
    TbCloudDownload,
    TbPlus,
} from 'react-icons/tb' // Ensure react-icons is installed

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common' // Ensure this type path is correct

// --- Define Item Type (Table Row Data) ---
export type OpportunityItem = {
    id: string
    status: 'pending' | 'active' | 'on_hold' | 'closed'
    productName: string
    productImage: string | null
    memberId: string // Generic Member ID
    role: 'Seller' | 'Buyer' // Differentiate role
    mobileNo: string | null
    qty: number
    productStatus:
        | 'new'
        | 'used_like_new'
        | 'used_good'
        | 'used_fair'
        | 'for_parts'
    intent: 'for_sale' | 'auction' | 'trade_offer' | 'looking_to_buy' | 'bid'
    productSpecs: string
    createdDate: Date
}
// --- End Item Type Definition ---

// --- Constants ---
const recordStatusColor: Record<OpportunityItem['status'], string> = {
    pending: 'bg-amber-500',
    active: 'bg-emerald-500',
    on_hold: 'bg-gray-500',
    closed: 'bg-red-500',
}

const productConditionColor: Record<OpportunityItem['productStatus'], string> =
    {
        new: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100 border border-sky-300 dark:border-sky-500/30',
        used_like_new:
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-500/30',
        used_good:
            'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-100 border border-lime-300 dark:border-lime-500/30',
        used_fair:
            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100 border border-amber-300 dark:border-amber-500/30',
        for_parts:
            'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100 border border-red-300 dark:border-red-500/30',
    }

const initialDummySellerData: OpportunityItem[] = [
    {
        id: 'SD001',
        role: 'Seller',
        status: 'active',
        productName: 'Gaming Laptop RTX 4070',
        productImage: '/img/products/laptop_gaming.jpg',
        memberId: 'SellerA',
        mobileNo: '+1-555-111-2222',
        qty: 1,
        productStatus: 'used_like_new',
        intent: 'for_sale',
        productSpecs: '16GB RAM, 1TB SSD, Black',
        createdDate: new Date(2023, 10, 2, 10, 0),
    },
    {
        id: 'SD002',
        role: 'Seller',
        status: 'pending',
        productName: 'Vintage Camera AE-1',
        productImage: '/img/products/camera_ae1.jpg',
        memberId: 'SellerB',
        mobileNo: null,
        qty: 1,
        productStatus: 'used_good',
        intent: 'auction',
        productSpecs: 'Canon, 50mm lens included',
        createdDate: new Date(2023, 10, 1, 14, 30),
    },
    {
        id: 'SD003',
        role: 'Seller',
        status: 'active',
        productName: 'Office Chair Ergonomic',
        productImage: null,
        memberId: 'SellerC',
        mobileNo: '+44-20-1234-5678',
        qty: 5,
        productStatus: 'new',
        intent: 'for_sale',
        productSpecs: 'Mesh back, Lumbar support',
        createdDate: new Date(2023, 9, 30, 9, 0),
    },
    {
        id: 'SD004',
        role: 'Seller',
        status: 'on_hold',
        productName: 'Smartphone Pixel 7',
        productImage: '/img/products/phone_pixel7.jpg',
        memberId: 'SellerA',
        mobileNo: '+1-555-111-2222',
        qty: 1,
        productStatus: 'used_good',
        intent: 'trade_offer',
        productSpecs: '128GB, Obsidian',
        createdDate: new Date(2023, 9, 29, 11, 15),
    },
    {
        id: 'SD005',
        role: 'Seller',
        status: 'closed',
        productName: 'Broken PS5 Console',
        productImage: null,
        memberId: 'SellerD',
        mobileNo: null,
        qty: 1,
        productStatus: 'for_parts',
        intent: 'for_sale',
        productSpecs: 'No power, Disc drive issue',
        createdDate: new Date(2023, 9, 15, 18, 0),
    },
    {
        id: 'SD006',
        role: 'Seller',
        status: 'active',
        productName: 'Designer Handbag',
        productImage: '/img/products/handbag_designer.jpg',
        memberId: 'SellerE',
        mobileNo: '+1-212-555-0000',
        qty: 1,
        productStatus: 'used_like_new',
        intent: 'for_sale',
        productSpecs: 'Leather, Tan',
        createdDate: new Date(2023, 10, 3, 8, 45),
    },
    {
        id: 'SD007',
        role: 'Seller',
        status: 'pending',
        productName: 'Bulk T-Shirts',
        productImage: null,
        memberId: 'SellerF',
        mobileNo: '+1-888-555-BULK',
        qty: 100,
        productStatus: 'new',
        intent: 'for_sale',
        productSpecs: 'White, Size L, Cotton',
        createdDate: new Date(2023, 10, 2, 16, 20),
    },
    {
        id: 'SD008',
        role: 'Seller',
        status: 'active',
        productName: 'Collectible Action Figure',
        productImage: '/img/products/figure_action.jpg',
        memberId: 'SellerB',
        mobileNo: null,
        qty: 1,
        productStatus: 'new',
        intent: 'auction',
        productSpecs: 'Limited Edition, Boxed',
        createdDate: new Date(2023, 9, 28, 20, 0),
    },
]

const initialDummyBuyerData: OpportunityItem[] = [
    {
        id: 'BD001',
        role: 'Buyer',
        status: 'active',
        productName: 'Used Smartphone Pixel 6',
        productImage: null,
        memberId: 'BuyerX',
        mobileNo: '+1-555-999-8888',
        qty: 1,
        productStatus: 'used_good',
        intent: 'looking_to_buy',
        productSpecs: '128GB, Any color',
        createdDate: new Date(2023, 10, 3, 11, 0),
    },
    {
        id: 'BD002',
        role: 'Buyer',
        status: 'pending',
        productName: 'RTX 3080 Graphics Card',
        productImage: null,
        memberId: 'BuyerY',
        mobileNo: null,
        qty: 1,
        productStatus: 'new',
        intent: 'bid',
        productSpecs: 'Non-LHR preferred',
        createdDate: new Date(2023, 10, 2, 18, 15),
    },
    {
        id: 'BD003',
        role: 'Buyer',
        status: 'active',
        productName: 'Bulk USB Cables',
        productImage: null,
        memberId: 'BuyerZ',
        mobileNo: '+1-800-555-CBLS',
        qty: 50,
        productStatus: 'new',
        intent: 'looking_to_buy',
        productSpecs: 'USB-A to USB-C, 1m',
        createdDate: new Date(2023, 9, 28, 10, 5),
    },
    {
        id: 'BD004',
        role: 'Buyer',
        status: 'closed',
        productName: 'Mechanical Keyboard - Parts',
        productImage: null,
        memberId: 'BuyerX',
        mobileNo: '+1-555-999-8888',
        qty: 1,
        productStatus: 'for_parts',
        intent: 'looking_to_buy',
        productSpecs: 'Need specific keycaps',
        createdDate: new Date(2023, 9, 25, 13, 40),
    },
    {
        id: 'BD005',
        role: 'Buyer',
        status: 'active',
        productName: 'Vintage Camera AE-1',
        productImage: null,
        memberId: 'BuyerW',
        mobileNo: null,
        qty: 1,
        productStatus: 'used_good',
        intent: 'looking_to_buy',
        productSpecs: 'Working condition, 50mm lens',
        createdDate: new Date(2023, 10, 4, 9, 0),
    },
    {
        id: 'BD006',
        role: 'Buyer',
        status: 'pending',
        productName: 'Office Chair Ergonomic',
        productImage: null,
        memberId: 'BuyerV',
        mobileNo: '+44-20-8765-4321',
        qty: 2,
        productStatus: 'new',
        intent: 'bid',
        productSpecs: 'Mesh back, Headrest',
        createdDate: new Date(2023, 10, 3, 17, 30),
    },
]

// Tab Definitions
const TABS = {
    SELLER: 'seller',
    BUYER: 'buyer',
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
                <Tooltip title="Copy Record">
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
            <Tooltip title="Edit Record">
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
            <Tooltip title="Delete Record">
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

// --- ItemTable Component ---
const ItemTable = ({
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
    columns: ColumnDef<OpportunityItem>[]
    data: OpportunityItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedItems: OpportunityItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: OpportunityItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<OpportunityItem>[]) => void
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
// --- End ItemTable ---

// --- ItemSearch Component ---
type ItemSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
    ({ onInputChange }, ref) => {
        return (
            <DebouceInput
                ref={ref}
                placeholder="Search Opportunities (Product, Member ID, Mobile...)"
                suffix={<TbSearch className="text-lg" />}
                onChange={(e) => onInputChange(e.target.value)}
            />
        )
    },
)
ItemSearch.displayName = 'ItemSearch'
// --- End ItemSearch ---

// --- ItemTableTools Component ---
const ItemTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <ItemSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter component could be added here */}
        </div>
    )
}
// --- End ItemTableTools ---

// --- ItemActionTools Component ---
const ItemActionTools = ({
    allItems,
    activeTab,
}: {
    allItems: OpportunityItem[]
    activeTab: string
}) => {
    const navigate = useNavigate()
    // CSV Data prep
    const csvData = useMemo(() => {
        return allItems.map((item) => ({
            id: item.id,
            status: item.status,
            productName: item.productName,
            memberId: item.memberId,
            role: item.role,
            mobileNo: item.mobileNo ?? 'N/A',
            qty: item.qty,
            productStatus: item.productStatus,
            intent: item.intent,
            productSpecs: item.productSpecs,
            createdDate: item.createdDate.toISOString(),
        }))
    }, [allItems])
    const csvHeaders = [
        { label: 'Record ID', key: 'id' },
        { label: 'Status', key: 'status' },
        { label: 'Product', key: 'productName' },
        { label: 'Member ID', key: 'memberId' },
        { label: 'Role', key: 'role' },
        { label: 'Mobile No', key: 'mobileNo' },
        { label: 'Qty', key: 'qty' },
        { label: 'Product Status', key: 'productStatus' },
        { label: 'Intent', key: 'intent' },
        { label: 'Specs', key: 'productSpecs' },
        { label: 'Created Date', key: 'createdDate' },
    ]

    const handleAddItem = () => {
        const targetRoute =
            activeTab === TABS.SELLER
                ? '/opportunities/seller/create'
                : '/opportunities/buyer/create'
        console.log(
            `Navigate to Add New ${activeTab === TABS.SELLER ? 'Seller' : 'Buyer'} Data page: ${targetRoute}`,
        )
        navigate(targetRoute) // Use navigate
    }

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* <CSVLink filename={`opportunities_${activeTab}.csv`} data={csvData} headers={csvHeaders} >
                <Button icon={<TbCloudDownload />} className="w-full" block> Download </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={handleAddItem}
                block
            >
                Add new{' '}
                {activeTab === TABS.SELLER ? 'Seller Record' : 'Buyer Request'}
            </Button>
        </div>
    )
}
// --- End ItemActionTools ---

// --- ItemSelected Component ---
const ItemSelected = ({
    selectedItems,
    setSelectedItems,
    onDeleteSelected,
    activeTab,
}: {
    selectedItems: OpportunityItem[]
    setSelectedItems: React.Dispatch<React.SetStateAction<OpportunityItem[]>>
    onDeleteSelected: () => void
    activeTab: string // To customize text
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const handleDeleteClick = () => setDeleteConfirmationOpen(true)
    const handleCancelDelete = () => setDeleteConfirmationOpen(false)
    const handleConfirmDelete = () => {
        onDeleteSelected()
        setDeleteConfirmationOpen(false)
    }

    if (selectedItems.length === 0) return null

    const recordType = activeTab === TABS.SELLER ? 'Record' : 'Request'

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
                                {recordType}
                                {selectedItems.length > 1 ? 's' : ''} selected
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
                title={`Delete ${selectedItems.length} ${recordType}${selectedItems.length > 1 ? 's' : ''}`}
                onClose={handleCancelDelete}
                onRequestClose={handleCancelDelete}
                onCancel={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                confirmButtonColor="red-600"
            >
                <p>
                    Are you sure you want to delete the selected{' '}
                    {recordType.toLowerCase()}
                    {selectedItems.length > 1 ? 's' : ''}? This action cannot be
                    undone.
                </p>
            </ConfirmDialog>
        </>
    )
}
// --- End ItemSelected ---

// --- Main Opportunities Component ---
const Opportunities = () => {
    const navigate = useNavigate()

    // --- Lifted State ---
    const [isLoading, setIsLoading] = useState(false)
    const [sellerData, setSellerData] = useState<OpportunityItem[]>(
        initialDummySellerData,
    )
    const [buyerData, setBuyerData] = useState<OpportunityItem[]>(
        initialDummyBuyerData,
    )
    const [sellerTableData, setSellerTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [buyerTableData, setBuyerTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    const [selectedSellerItems, setSelectedSellerItems] = useState<
        OpportunityItem[]
    >([])
    const [selectedBuyerItems, setSelectedBuyerItems] = useState<
        OpportunityItem[]
    >([])
    const [currentTab, setCurrentTab] = useState<string>(TABS.SELLER)
    // --- End Lifted State ---

    // --- Derived State ---
    const currentItems = useMemo(
        () => (currentTab === TABS.SELLER ? sellerData : buyerData),
        [currentTab, sellerData, buyerData],
    )
    const currentTableData = useMemo(
        () => (currentTab === TABS.SELLER ? sellerTableData : buyerTableData),
        [currentTab, sellerTableData, buyerTableData],
    )
    const currentSelectedItems = useMemo(
        () =>
            currentTab === TABS.SELLER
                ? selectedSellerItems
                : selectedBuyerItems,
        [currentTab, selectedSellerItems, selectedBuyerItems],
    )
    const setCurrentItems = useMemo(
        () => (currentTab === TABS.SELLER ? setSellerData : setBuyerData),
        [currentTab],
    )
    const setCurrentTableData = useMemo(
        () =>
            currentTab === TABS.SELLER ? setSellerTableData : setBuyerTableData,
        [currentTab],
    )
    const setCurrentSelectedItems = useMemo(
        () =>
            currentTab === TABS.SELLER
                ? setSelectedSellerItems
                : setSelectedBuyerItems,
        [currentTab],
    )
    // --- End Derived State ---

    // --- Memoized Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...currentItems]

        // Apply Search
        if (currentTableData.query) {
            const query = currentTableData.query.toLowerCase()
            processedData = processedData.filter(
                (item) =>
                    item.id.toLowerCase().includes(query) ||
                    item.status.toLowerCase().includes(query) ||
                    item.productName.toLowerCase().includes(query) ||
                    item.productSpecs.toLowerCase().includes(query) ||
                    item.memberId.toLowerCase().includes(query) ||
                    (item.mobileNo?.toLowerCase().includes(query) ?? false) ||
                    item.qty.toString().includes(query) ||
                    item.productStatus.toLowerCase().includes(query) ||
                    item.intent.toLowerCase().includes(query),
            )
        }

        // Apply Sorting
        const { order, key } = currentTableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'createdDate') {
                    const timeA = a.createdDate.getTime()
                    const timeB = b.createdDate.getTime()
                    return order === 'asc' ? timeA - timeB : timeB - timeA
                }
                if (key === 'qty') {
                    const qtyA = a.qty ?? 0
                    const qtyB = b.qty ?? 0
                    return order === 'asc' ? qtyA - qtyB : qtyB - qtyA
                }
                if (key === 'mobileNo') {
                    const aValue = a[key] ?? ''
                    const bValue = b[key] ?? ''
                    if (aValue === null && bValue === null) return 0
                    if (aValue === null) return order === 'asc' ? -1 : 1
                    if (bValue === null) return order === 'asc' ? 1 : -1
                    return order === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue)
                }
                const aValue = a[key as keyof OpportunityItem] ?? ''
                const bValue = b[key as keyof OpportunityItem] ?? ''
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
        const pageIndex = currentTableData.pageIndex as number
        const pageSize = currentTableData.pageSize as number
        const dataTotal = processedData.length
        const startIndex = (pageIndex - 1) * pageSize
        const dataForPage = processedData.slice(
            startIndex,
            startIndex + pageSize,
        )

        return { pageData: dataForPage, total: dataTotal }
    }, [currentItems, currentTableData])
    // --- End Memoized Data Processing ---

    // --- Lifted Handlers ---
    const handleSetTableData = useCallback(
        (data: TableQueries) => {
            setCurrentTableData(data)
        },
        [setCurrentTableData],
    )
    const handlePaginationChange = useCallback(
        (page: number) => {
            handleSetTableData({ ...currentTableData, pageIndex: page })
        },
        [currentTableData, handleSetTableData],
    )
    const handleSelectChange = useCallback(
        (value: number) => {
            handleSetTableData({
                ...currentTableData,
                pageSize: Number(value),
                pageIndex: 1,
            })
            setCurrentSelectedItems([])
        },
        [currentTableData, handleSetTableData, setCurrentSelectedItems],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => {
            handleSetTableData({
                ...currentTableData,
                sort: sort,
                pageIndex: 1,
            })
        },
        [currentTableData, handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => {
            handleSetTableData({
                ...currentTableData,
                query: query,
                pageIndex: 1,
            })
        },
        [currentTableData, handleSetTableData],
    )

    const handleRowSelect = useCallback(
        (checked: boolean, row: OpportunityItem) => {
            setCurrentSelectedItems((prev) => {
                if (checked) {
                    return prev.some((i) => i.id === row.id)
                        ? prev
                        : [...prev, row]
                } else {
                    return prev.filter((i) => i.id !== row.id)
                }
            })
        },
        [setCurrentSelectedItems],
    )

    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<OpportunityItem>[]) => {
            const rowIds = new Set(rows.map((r) => r.original.id))
            setCurrentSelectedItems((prev) => {
                if (checked) {
                    const originalRows = rows.map((row) => row.original)
                    const existingIds = new Set(prev.map((i) => i.id))
                    const newSelection = originalRows.filter(
                        (i) => !existingIds.has(i.id),
                    )
                    return [...prev, ...newSelection]
                } else {
                    return prev.filter((i) => !rowIds.has(i.id))
                }
            })
        },
        [setCurrentSelectedItems],
    )

    const handleEdit = useCallback(
        (item: OpportunityItem) => {
            console.log(`Edit ${item.role} item:`, item.id)
            const editRoute = `/opportunities/${currentTab}/edit/${item.id}`
            navigate(editRoute) // Use navigate
        },
        [navigate, currentTab],
    )

    const handleClone = useCallback(
        (itemToClone: OpportunityItem) => {
            console.log(`Cloning ${itemToClone.role} item:`, itemToClone.id)
            const newId = `${currentTab === TABS.SELLER ? 'SD' : 'BD'}${Math.floor(Math.random() * 9000) + 1000}`
            const clonedItem: OpportunityItem = {
                ...itemToClone,
                id: newId,
                status: 'pending',
                createdDate: new Date(),
            }
            setCurrentItems((prev: OpportunityItem[]) => [clonedItem, ...prev])
            toast.push(
                <Notification
                    title="Record Copied"
                    type="success"
                    duration={2000}
                />,
            )
        },
        [setCurrentItems, currentTab],
    )

    const handleChangeStatus = useCallback(
        (item: OpportunityItem) => {
            const statuses: OpportunityItem['status'][] = [
                'pending',
                'active',
                'completed',
                'rejected',
                'on_hold',
            ]
            const currentStatusIndex = statuses.indexOf(item.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
            console.log(
                `Changing status of ${item.role} item ${item.id} from ${item.status} to ${newStatus}`,
            )
            setCurrentItems((currentItems: OpportunityItem[]) =>
                currentItems.map((i) =>
                    i.id === item.id ? { ...i, status: newStatus } : i,
                ),
            )
            toast.push(
                <Notification
                    title="Status Changed"
                    type="success"
                    duration={2000}
                >{`Record ${item.id} status changed to ${newStatus}.`}</Notification>,
            )
        },
        [setCurrentItems],
    )

    const handleDelete = useCallback(
        (itemToDelete: OpportunityItem) => {
            console.log(`Deleting ${itemToDelete.role} item:`, itemToDelete.id)
            setCurrentItems((currentItems: OpportunityItem[]) =>
                currentItems.filter((item) => item.id !== itemToDelete.id),
            )
            setCurrentSelectedItems((prevSelected: OpportunityItem[]) =>
                prevSelected.filter((item) => item.id !== itemToDelete.id),
            )
            toast.push(
                <Notification
                    title="Record Deleted"
                    type="success"
                    duration={2000}
                >{`Record ${itemToDelete.id} deleted.`}</Notification>,
            )
        },
        [setCurrentItems, setCurrentSelectedItems],
    )

    const handleDeleteSelected = useCallback(() => {
        console.log(
            `Deleting selected ${currentTab} items:`,
            currentSelectedItems.map((i) => i.id),
        )
        const selectedIds = new Set(currentSelectedItems.map((i) => i.id))
        setCurrentItems((currentItems: OpportunityItem[]) =>
            currentItems.filter((i) => !selectedIds.has(i.id)),
        )
        setCurrentSelectedItems([])
        toast.push(
            <Notification
                title="Records Deleted"
                type="success"
                duration={2000}
            >{`${selectedIds.size} record(s) deleted.`}</Notification>,
        )
    }, [
        currentSelectedItems,
        setCurrentItems,
        setCurrentSelectedItems,
        currentTab,
    ])

    const handleTabChange = (tabKey: string) => {
        if (tabKey === currentTab) return // Do nothing if clicking the active tab
        setCurrentTab(tabKey)
        // Reset the *other* tab's table state, but keep the active one
        if (tabKey === TABS.SELLER) {
            setBuyerTableData({
                pageIndex: 1,
                pageSize: 10,
                sort: { order: '', key: '' },
                query: '',
            })
            setSelectedBuyerItems([])
        } else {
            setSellerTableData({
                pageIndex: 1,
                pageSize: 10,
                sort: { order: '', key: '' },
                query: '',
            })
            setSelectedSellerItems([])
        }
        // Clear selection for the newly active tab
        setCurrentSelectedItems([]) // This setter points to the correct state slice now
    }
    // --- End Lifted Handlers ---

    // --- Define Columns in Parent ---
    const columns: ColumnDef<OpportunityItem>[] = useMemo(
        () => [
            {
                header: 'Status',
                accessorKey: 'status',
                enableSorting: true,
                width: 120,
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <Tag
                            className={`${recordStatusColor[status]} text-white capitalize`}
                        >
                            {status}
                        </Tag>
                    )
                },
            },
            {
                header: 'Product',
                accessorKey: 'productName',
                enableSorting: true,
                cell: (props) => {
                    const { productName, productImage } = props.row.original
                    return (
                        <div className="flex items-center gap-2">
                            <Avatar
                                size={30}
                                shape="square"
                                src={productImage}
                                icon={<TbBox />}
                            />
                            <span className="font-semibold">{productName}</span>
                        </div>
                    )
                },
            },
            {
                header: 'Specs',
                accessorKey: 'productSpecs',
                enableSorting: false,
                width: 180,
            },
            // Show 'Seller ID' or 'Buyer ID' based on tab - can be done here or use a generic 'Member ID'
            {
                header: currentTab === TABS.SELLER ? 'Seller ID' : 'Buyer ID',
                accessorKey: 'memberId',
                enableSorting: true,
                width: 120,
            },
            {
                header: 'Mobile No',
                accessorKey: 'mobileNo',
                enableSorting: true,
                width: 150,
                cell: (props) => (
                    <span>{props.row.original.mobileNo ?? '-'}</span>
                ),
            },
            {
                header: 'Qty',
                accessorKey: 'qty',
                enableSorting: true,
                width: 80,
            },
            {
                header: 'Prod. Status',
                accessorKey: 'productStatus',
                enableSorting: true,
                width: 140,
                cell: (props) => {
                    const { productStatus } = props.row.original
                    const displayStatus = productStatus
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return (
                        <Tag
                            className={`${productConditionColor[productStatus]} font-semibold border ${productConditionColor[productStatus].replace('bg-', 'border-').replace('/20', '')}`}
                        >
                            {displayStatus}
                        </Tag>
                    )
                },
            },
            {
                header: 'Intent',
                accessorKey: 'intent',
                enableSorting: true,
                width: 130,
                cell: (props) => {
                    const displayIntent = props.row.original.intent
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())
                    return <span>{displayIntent}</span>
                },
            },
            {
                header: 'Created Date',
                accessorKey: 'createdDate',
                enableSorting: true,
                width: 180,
                cell: (props) => {
                    const date = props.row.original.createdDate
                    return (
                        <span>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    )
                }, // Shorten time format
            },
            {
                header: '',
                id: 'action',
                width: 130,
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
        [handleClone, handleChangeStatus, handleEdit, handleDelete, currentTab], // Add currentTab as dependency for column header change
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h3 className="mb-4 lg:mb-0">Opportunities</h3>
                    <ItemActionTools
                        allItems={currentItems}
                        activeTab={currentTab}
                    />
                </div>

                {/* Tabs Section */}
                <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            key={TABS.SELLER}
                            onClick={() => handleTabChange(TABS.SELLER)}
                            className={classNames(
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                                currentTab === TABS.SELLER
                                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600',
                            )}
                        >
                            Seller Data
                        </button>
                        <button
                            key={TABS.BUYER}
                            onClick={() => handleTabChange(TABS.BUYER)}
                            className={classNames(
                                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                                currentTab === TABS.BUYER
                                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600',
                            )}
                        >
                            Buyer Data
                        </button>
                    </nav>
                </div>

                {/* Tools Section (Search) */}
                <div className="mb-4">
                    <ItemTableTools onSearchChange={handleSearchChange} />
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-auto">
                    <ItemTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: currentTableData.pageIndex as number,
                            pageSize: currentTableData.pageSize as number,
                        }}
                        selectedItems={currentSelectedItems}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Actions Footer */}
            <ItemSelected
                selectedItems={currentSelectedItems}
                setSelectedItems={setCurrentSelectedItems}
                onDeleteSelected={handleDeleteSelected}
                activeTab={currentTab}
            />
        </Container>
    )
}
// --- End Main Component ---

export default Opportunities

// Helper Function (ensure defined or imported)
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
