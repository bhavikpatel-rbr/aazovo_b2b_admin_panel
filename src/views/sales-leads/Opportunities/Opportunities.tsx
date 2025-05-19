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
import CreateSellerForm from './SellerCreate/CreateSeller'
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
  
    opportunity_id: string // Unique identifier for the opportunity record.
    buy_listing_id: string // Listing ID of the Buy intent product.
    sell_listing_id: string // Listing ID of the Sell intent product.
    product_name: string // Common product name matched between listings.
    product_category: string // Product category.
    product_subcategory: string // Product subcategory.
    brand: string // Brand name matched between listings.
    price_match_type: 'Exact' | 'Range' | 'Not Matched' // Price Range Match.
    quantity_match: 'Sufficient' | 'Partial' | 'Not Matched' // Quantity Match.
    location_match?: 'Local' | 'National' | 'Not Matched' // Location Match (optional).
    match_score: number // Match Score (%).
    opportunity_status: 'New' | 'Shortlisted' | 'Converted' | 'Rejected' // Opportunity Status.
    created_date: string // ISO date string for when the opportunity was created.
    last_updated: string // ISO date string for last update.
    assigned_to: string // Team or person managing this opportunity.
    notes?: string // Notes or remarks (optional).
  }
  
// --- End Item Type Definition ---

// --- Constants ---
const recordStatusColor: Record<OpportunityItem['status'], string> = {
    pending: 'bg-amber-500',
    active: 'bg-emerald-500',
    on_hold: 'bg-gray-500',
    closed: 'bg-red-500',
}

// const productConditionColor: Record<OpportunityItem['productStatus'], string> =
//     {
//         new: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100 border border-sky-300 dark:border-sky-500/30',
//         used_like_new:
//             'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-500/30',
//         used_good:
//             'bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-100 border border-lime-300 dark:border-lime-500/30',
//         used_fair:
//             'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100 border border-amber-300 dark:border-amber-500/30',
//         for_parts:
//             'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100 border border-red-300 dark:border-red-500/30',
//     }

const initialDummySellerData: OpportunityItem[] = [
    {
      id: 'OPP001',
      status: 'active',
  
      opportunity_id: 'opportunity-001',
      buy_listing_id: 'BUY123',
      sell_listing_id: 'SELL456',
      product_name: 'Gaming Laptop RTX 4070',
      product_category: 'Electronics',
      product_subcategory: 'Laptops',
      brand: 'ASUS',
      price_match_type: 'Exact',
      quantity_match: 'Sufficient',
      location_match: 'Local',
      match_score: 95.5,
      opportunity_status: 'Shortlisted',
      created_date: '2023-10-02T10:00:00Z',
      last_updated: '2023-10-04T15:30:00Z',
      assigned_to: 'Team A',
      notes: 'High match score. Customer interested in purchase.'
    },
    {
      id: 'OPP002',
      status: 'pending',
  
      opportunity_id: 'opportunity-002',
      buy_listing_id: 'BUY124',
      sell_listing_id: 'SELL457',
      product_name: 'Wireless Earbuds Pro',
      product_category: 'Electronics',
      product_subcategory: 'Audio',
      brand: 'Sony',
      price_match_type: 'Range',
      quantity_match: 'Partial',
      location_match: 'National',
      match_score: 80.0,
      opportunity_status: 'New',
      created_date: '2023-11-15T09:00:00Z',
      last_updated: '2023-11-15T10:00:00Z',
      assigned_to: 'Team B',
      notes: 'Location differs, but specs and price match closely.'
    }
  ]
  

  const initialDummyBuyerData: OpportunityItem[] = [
    {
      id: 'OPP003',
      status: 'active',
      opportunity_id: 'opportunity-003',
      buy_listing_id: 'BUY789',
      sell_listing_id: 'SELL321',
      product_name: 'Used Smartphone Pixel 6',
      product_category: 'Electronics',
      product_subcategory: 'Smartphones',
      brand: 'Google',
      price_match_type: 'Range',
      quantity_match: 'Sufficient',
      location_match: 'National',
      match_score: 88.2,
      opportunity_status: 'New',
      created_date: '2023-10-03T11:00:00Z',
      last_updated: '2023-10-05T09:45:00Z',
      assigned_to: 'Team C',
      notes: 'Customer prefers unlocked models. Price range is flexible.'
    },
    {
      id: 'OPP004',
      status: 'pending',
      opportunity_id: 'opportunity-004',
      buy_listing_id: 'BUY890',
      sell_listing_id: 'SELL432',
      product_name: 'Office Desk Chair',
      product_category: 'Furniture',
      product_subcategory: 'Office Chairs',
      brand: 'IKEA',
      price_match_type: 'Exact',
      quantity_match: 'Sufficient',
      location_match: 'Local',
      match_score: 92.5,
      opportunity_status: 'Shortlisted',
      created_date: '2023-10-06T14:30:00Z',
      last_updated: '2023-10-06T16:15:00Z',
      assigned_to: 'Team A',
      notes: 'Buyer looking for bulk purchase of ergonomic models.'
    },
    {
      id: 'OPP005',
      status: 'on_hold',
      opportunity_id: 'opportunity-005',
      buy_listing_id: 'BUY901',
      sell_listing_id: 'SELL543',
      product_name: 'Air Conditioner 1.5 Ton',
      product_category: 'Home Appliances',
      product_subcategory: 'Air Conditioners',
      brand: 'Samsung',
      price_match_type: 'Not Matched',
      quantity_match: 'Partial',
      location_match: 'Not Matched',
      match_score: 61.3,
      opportunity_status: 'Rejected',
      created_date: '2023-10-07T10:15:00Z',
      last_updated: '2023-10-08T08:00:00Z',
      assigned_to: 'Team D',
      notes: 'Mismatch in quantity and shipping constraints.'
    }
  ]
  

// Tab Definitions
const TABS = {
    SELLER: 'seller',
    BUYER: 'buyer',
}
// --- End Constants ---

// --- Updated Status Colors ---
const statusColor: Record<OpportunityItem['status'], string> = {
    active: 'bg-green-200 dark:bg-green-200 text-green-600 dark:text-green-600',
    closed: 'bg-red-200 dark:bg-red-200 text-red-600 dark:text-red-600', // Example color for inactive
    pending: 'bg-red-200 dark:bg-yellow-200 text-red-600 dark:text-red-600',
    on_hold: 'bg-red-200 :bg-yellow-200 text-red-600 dark:text-red-600',
}

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
    onEdit,
    onClone,
    onChangeStatus,
    onViewDetail,
    onDelete,
}: {
    onEdit: () => void
    onClone?: () => void
    onChangeStatus: () => void
    onViewDetail: () => void
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
                placeholder="Quick search..."
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
// --- ItemActionTools Component ---
const ItemActionTools = ({
    allItems,
    activeTab,
}: {
    allItems: OpportunityItem[]
    activeTab: string
}) => {
    const navigate = useNavigate()

    // CSV Data prep with full OpportunityItem fields
    const csvData = useMemo(() => {
        return allItems.map((item) => ({
            id: item.id,
            opportunity_id: item.opportunity_id,
            buy_listing_id: item.buy_listing_id,
            sell_listing_id: item.sell_listing_id,
            product_name: item.product_name,
            product_category: item.product_category,
            product_subcategory: item.product_subcategory,
            brand: item.brand,
            price_match_type: item.price_match_type,
            quantity_match: item.quantity_match,
            location_match: item.location_match,
            match_score: item.match_score,
            opportunity_status: item.opportunity_status,
            created_date: item.created_date,
            last_updated: item.last_updated,
            assigned_to: item.assigned_to,
            notes: item.notes,
            status: item.status,
        }))
    }, [allItems])

    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Opportunity ID', key: 'opportunity_id' },
        { label: 'Buy Listing ID', key: 'buy_listing_id' },
        { label: 'Sell Listing ID', key: 'sell_listing_id' },
        { label: 'Product Name', key: 'product_name' },
        { label: 'Category', key: 'product_category' },
        { label: 'Subcategory', key: 'product_subcategory' },
        { label: 'Brand', key: 'brand' },
        { label: 'Price Match Type', key: 'price_match_type' },
        { label: 'Quantity Match', key: 'quantity_match' },
        { label: 'Location Match', key: 'location_match' },
        { label: 'Match Score (%)', key: 'match_score' },
        { label: 'Opportunity Status', key: 'opportunity_status' },
        { label: 'Created Date', key: 'created_date' },
        { label: 'Last Updated', key: 'last_updated' },
        { label: 'Assigned To', key: 'assigned_to' },
        { label: 'Notes/Remarks', key: 'notes' },
        { label: 'Status', key: 'status' },
    ]

    const handleAddItem = () => {
        const targetRoute =
            activeTab === TABS.SELLER
                ? '/sales-leads/seller/create'
                : '/sales-leads/buyer/create'
        console.log(
            `Navigate to Add New ${activeTab === TABS.SELLER ? 'Seller' : 'Buyer'} Data page: ${targetRoute}`,
        )
        navigate(targetRoute)
    }

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {/* Uncomment to enable CSV export */}
            {/* <CSVLink filename={`opportunities_${activeTab}.csv`} data={csvData} headers={csvHeaders} >
                <Button icon={<TbCloudDownload />} className="w-full" block> Download </Button>
            </CSVLink> */}
            <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={handleAddItem}
                block
            >
                Add New{' '}
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
                // confirmButtonColor="red-600"
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
    const [forms, setForms] = useState<OpportunityItem[]>(initialDummySellerData) // Make forms stateful

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
            processedData = processedData.filter((item) =>
                item.id.toLowerCase().includes(query) ||
                item.opportunity_id?.toLowerCase().includes(query) ||
                item.buy_listing_id?.toLowerCase().includes(query) ||
                item.sell_listing_id?.toLowerCase().includes(query) ||
                item.product_name?.toLowerCase().includes(query) ||
                item.product_category?.toLowerCase().includes(query) ||
                item.product_subcategory?.toLowerCase().includes(query) ||
                item.brand?.toLowerCase().includes(query) ||
                item.price_match_type?.toLowerCase().includes(query) ||
                item.quantity_match?.toLowerCase().includes(query) ||
                item.location_match?.toLowerCase().includes(query) ||
                item.match_score?.toString().toLowerCase().includes(query) ||
                item.opportunity_status?.toLowerCase().includes(query) ||
                item.created_date?.toString().toLowerCase().includes(query) ||
                item.last_updated?.toString().toLowerCase().includes(query) ||
                item.assigned_to?.toLowerCase().includes(query) ||
                item.notes?.toLowerCase().includes(query) ||
                item.status?.toLowerCase().includes(query)
            )
        }
        

        // Apply Sorting
        const { order, key } = currentTableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                // Handle date fields (support both camelCase and snake_case keys)
                if (key === 'createdDate' || key === 'created_date') {
                    const timeA = new Date(a[key as keyof OpportunityItem] as any).getTime()
                    const timeB = new Date(b[key as keyof OpportunityItem] as any).getTime()
                    return order === 'asc' ? timeA - timeB : timeB - timeA
                }
                if (key === 'lastUpdated' || key === 'last_updated') {
                    const timeA = new Date(a[key as keyof OpportunityItem] as any).getTime()
                    const timeB = new Date(b[key as keyof OpportunityItem] as any).getTime()
                    return order === 'asc' ? timeA - timeB : timeB - timeA
                }

                // Handle numeric fields
                if (key === 'qty' || key === 'match_score') {
                    const numA = (a[key as keyof OpportunityItem] as number) ?? 0
                    const numB = (b[key as keyof OpportunityItem] as number) ?? 0
                    return order === 'asc' ? numA - numB : numB - numA
                }

                // Handle mobileNo or other string fields (null-safe)
                const aValue = (a[key as keyof OpportunityItem] ?? '') as string
                const bValue = (b[key as keyof OpportunityItem] ?? '') as string

                if (aValue === null && bValue === null) return 0
                if (aValue === null) return order === 'asc' ? -1 : 1
                if (bValue === null) return order === 'asc' ? 1 : -1

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
            console.log(`Edit ${item.product_name} item:`, item.id)
            const editRoute = `/opportunities/${currentTab}/edit/${item.id}`
            navigate(editRoute)
        },
        [navigate, currentTab],
    )
    
    const handleClone = useCallback(
        (itemToClone: OpportunityItem) => {
            console.log(`Cloning ${itemToClone.product_name} item:`, itemToClone.id)
    
            // Generate new ID: prefix + random 4-digit number
            const newIdPrefix = currentTab === TABS.SELLER ? 'SD' : 'BD'
            const newId = `${newIdPrefix}${Math.floor(Math.random() * 9000) + 1000}`
    
            const clonedItem: OpportunityItem = {
                ...itemToClone,
                id: newId,
                status: 'pending', // reset status for cloned item
                // createdDate: new Date(), // reset createdDate to now
            }
    
            setCurrentItems((prev) => [clonedItem, ...prev])
    
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
                // 'completed',
                // 'rejected',
                'on_hold',
            ]
            const currentStatusIndex = statuses.indexOf(item.status)
            const nextStatusIndex = (currentStatusIndex + 1) % statuses.length
            const newStatus = statuses[nextStatusIndex]
    
            console.log(
                `Changing status of ${item.product_name} item ${item.id} from ${item.status} to ${newStatus}`,
            )
    
            setCurrentItems((currentItems) =>
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
            console.log(`Deleting ${itemToDelete.product_name} item:`, itemToDelete.id)
    
            setCurrentItems((currentItems) =>
                currentItems.filter((item) => item.id !== itemToDelete.id),
            )
    
            setCurrentSelectedItems((prevSelected) =>
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
    
    const handleViewDetails = (form: OpportunityItem) => {
        // Navigate to a hypothetical form details page
        console.log('Navigating to view form:', form.id)
        // navigate(`/forms/details/${form.id}`) // Example navigation
    }

    const handleCloneForm = (item: OpportunityItem) => {
        // Generate a new ID (e.g. with 'F' prefix + random number)
        const newId = `F${Math.floor(Math.random() * 9000) + 1000}`
      
        const clonedItem: OpportunityItem = {
          ...item,
          id: newId,
          status: 'pending', // or 'inactive' if you want, but your type doesn't have 'inactive'
          opportunity_status: 'New', // reset status to 'New' on clone
          created_date: new Date().toISOString(), // reset creation date to now
          last_updated: new Date().toISOString(), // reset last updated date to now
          notes: item.notes ? `${item.notes} (Clone)` : undefined,
          // You can reset or adjust other fields as needed, e.g., assigned_to
          assigned_to: '', // reset assigned user/team
        }
      
        setForms((prev) => [clonedItem, ...prev])
      
        // Optionally navigate to the edit page of the cloned item
        // navigate(`/forms/edit/${newId}`)
      }
      

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
    const columns: ColumnDef<OpportunityItem>[] = useMemo(() => [
        {
          header: 'ID',
          accessorKey: 'id',
          size: 100,
          enableSorting: true,
          cell: (props) => <span>{props.row.original.id}</span>,
        },
        {
          header: 'Opportunity ID',
          accessorKey: 'opportunity_id',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.opportunity_id}</span>,
        },
        {
          header: 'Buy Listing ID',
          accessorKey: 'buy_listing_id',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.buy_listing_id}</span>,
        },
        {
          header: 'Sell Listing ID',
          accessorKey: 'sell_listing_id',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.sell_listing_id}</span>,
        },
        {
          header: 'Product Name',
          accessorKey: 'product_name',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.product_name}</span>,
        },
        {
          header: 'Category',
          accessorKey: 'product_category',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.product_category}</span>,
        },
        {
          header: 'Subcategory',
          accessorKey: 'product_subcategory',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.product_subcategory}</span>,
        },
        {
          header: 'Brand',
          accessorKey: 'brand',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.brand}</span>,
        },
        {
          header: 'Price Match',
          accessorKey: 'price_match_type',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.price_match_type}</span>,
        },
        {
          header: 'Quantity Match',
          accessorKey: 'quantity_match',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.quantity_match}</span>,
        },
        {
          header: 'Location Match',
          accessorKey: 'location_match',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.location_match ?? '-'}</span>,
        },
        {
          header: 'Match Score (%)',
          accessorKey: 'match_score',
          enableSorting: true,
          cell: (props) => <span>{Math.ceil(props.row.original.match_score)}%</span>,
        },
        {
          header: 'Opportunity Status',
          accessorKey: 'opportunity_status',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.opportunity_status}</span>,
        },
        {
          header: 'Created Date',
          accessorKey: 'created_date',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.created_date}</span>,
        },
        {
          header: 'Last Updated',
          accessorKey: 'last_updated',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.last_updated}</span>,
        },
        {
          header: 'Assigned To',
          accessorKey: 'assigned_to',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.assigned_to}</span>,
        },
        {
          header: 'Notes',
          accessorKey: 'notes',
          enableSorting: true,
          cell: (props) => <span>{props.row.original.notes ?? '-'}</span>,
        },
        {
            header: 'Status',
            accessorKey: 'status',
            size: 120,
            enableSorting: true,
            cell: (props) => (
              <div className="flex items-center">
                <Tag className={statusColor[props.row.original.status]}>
                  <span className="capitalize">{props.row.original.status}</span>
                </Tag>
              </div>
            ),
          },
        {
          header: 'Actions',
          id: 'action',
          size: 160,
          meta: { HeaderClass: 'text-center' },
          cell: (props) => (
            <ActionColumn
              onClone={() => handleCloneForm(props.row.original)}
              onChangeStatus={() => handleChangeStatus(props.row.original)}
              onEdit={() => handleEdit(props.row.original)}
              onViewDetail={() => handleViewDetails(props.row.original)}
              onDelete={() => handleDelete(props.row.original)}
            />
          ),
        },
      ], [
        handleCloneForm,
        handleChangeStatus,
        handleEdit,
        handleViewDetails,
        handleDelete,
        currentTab,
      ])
      
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <>
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header Section */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Opportunities</h5>
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
        <CreateSellerForm/>
        </>
    )
}
// --- End Main Component ---

export default Opportunities

// Helper Function (ensure defined or imported)
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
