// src/views/your-path/EmailCampaignListing.tsx (New file name)

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
import Dialog from '@/components/ui/Dialog' // Needed for viewing details
// import Avatar from '@/components/ui/Avatar'; // Likely not needed
// import Notification from '@/components/ui/Notification'; // Likely not needed
// import toast from '@/components/ui/toast'; // Likely not needed
import ConfirmDialog from '@/components/shared/ConfirmDialog' // Keep if bulk delete is wanted
import StickyFooter from '@/components/shared/StickyFooter' // Keep if bulk delete is wanted
import DebouceInput from '@/components/shared/DebouceInput'
import { TbEye, TbMail, TbFileText } from 'react-icons/tb' // View icon

// Icons
import {
    TbChecks, // For selected footer
    TbSearch,
    TbCloudDownload, // Optional export
    TbPlus, // Optional Add
    TbTrash, // Optional Delete
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
export type EmailCampaignItem = {
    id: string // Unique ID for the campaign record
    dateTime: Date // Date and Time the campaign was sent/scheduled
    templateId: string // ID of the email template used
    templateName: string // Name of the email template used
    details: string // Details of the campaign (e.g., target audience, subject line, summary)
}
// --- End Item Type ---

// --- Constants ---
const initialDummyCampaigns: EmailCampaignItem[] = [
    {
        id: 'CAMP001',
        dateTime: new Date(2023, 10, 5, 10, 0),
        templateId: 'promo_q4_sale',
        templateName: 'Q4 Holiday Promotion',
        details:
            'Sent to all subscribers in US/CA regions. Subject: Biggest Sale Yet! 🎁',
    },
    {
        id: 'CAMP002',
        dateTime: new Date(2023, 10, 1, 9, 0),
        templateId: 'welcome_new_user',
        templateName: 'Welcome - New User Signup',
        details: 'Triggered on new user registration. Sent via standard flow.',
    },
    {
        id: 'CAMP003',
        dateTime: new Date(2023, 9, 28, 14, 30),
        templateId: 'newsletter_weekly',
        templateName: 'Weekly Newsletter - Oct Week 4',
        details: 'Sent to Newsletter segment. Featured article: Top 5 Gadgets.',
    },
    {
        id: 'CAMP004',
        dateTime: new Date(2023, 9, 25, 11, 0),
        templateId: 'abandoned_cart_1hr',
        templateName: 'Abandoned Cart - 1 Hour',
        details:
            'Triggered 1 hour after cart abandonment. Includes 10% off coupon.',
    },
    {
        id: 'CAMP005',
        dateTime: new Date(2023, 9, 20, 16, 0),
        templateId: 'feature_update_v3',
        templateName: 'Feature Update Announcement',
        details: 'Sent to active users. Subject: New Reporting Features Live!',
    },
    {
        id: 'CAMP006',
        dateTime: new Date(2023, 9, 10, 8, 0),
        templateId: 'trial_ending_soon',
        templateName: 'Trial Ending Soon (3 days)',
        details: 'Sent to trial users with 3 days remaining.',
    },
]
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({ onView }: { onView: () => void }) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    return (
        <div className="flex items-center justify-center">
            {/* View Button */}
            <Tooltip title="View Details">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400',
                    )}
                    role="button"
                    onClick={onView}
                >
                    <TbEye />
                </div>
            </Tooltip>
            {/* Other actions like Re-send, Analyze could go here */}
        </div>
    )
}
// --- End ActionColumn ---

// --- CampaignTable Component ---
const CampaignTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedCampaigns,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    columns: ColumnDef<EmailCampaignItem>[]
    data: EmailCampaignItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedCampaigns: EmailCampaignItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: EmailCampaignItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<EmailCampaignItem>[]) => void
}) => {
    return (
        <DataTable
            selectable={false}
            /* Disable row selection if not needed */ columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            //   checkboxChecked={(row) => selectedCampaigns.some((selected) => selected.id === row.id)} // Remove if not selectable
            onPaginationChange={onPaginationChange}
            onSelectChange={onSelectChange}
            onSort={onSort}
            //   onCheckBoxChange={onRowSelect} // Remove if not selectable
            //   onIndeterminateCheckBoxChange={onAllRowSelect} // Remove if not selectable
            noData={!loading && data.length === 0}
        />
    )
}
// --- End CampaignTable ---

// --- CampaignSearch Component ---
type CampaignSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const CampaignSearch = React.forwardRef<HTMLInputElement, CampaignSearchProps>(
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
CampaignSearch.displayName = 'CampaignSearch'
// --- End CampaignSearch ---

// --- CampaignTableTools Component ---
const CampaignTableTools = ({
    onSearchChange,
}: {
    onSearchChange: (query: string) => void
}) => {
    return (
        <div className="flex items-center w-full">
            <div className="flex-grow">
                <CampaignSearch onInputChange={onSearchChange} />
            </div>
        </div>
    )
}
// --- End CampaignTableTools ---

// --- CampaignActionTools Component ---
const CampaignActionTools = ({
    allCampaigns,
}: {
    allCampaigns: EmailCampaignItem[]
}) => {
    const navigate = useNavigate()
    const csvData = useMemo(
        () =>
            allCampaigns.map((c) => ({
                id: c.id,
                dateTime: c.dateTime.toISOString(),
                templateId: c.templateId,
                templateName: c.templateName,
                details: c.details,
            })),
        [allCampaigns],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Date & Time', key: 'dateTime' },
        { label: 'Template ID', key: 'templateId' },
        { label: 'Template Name', key: 'templateName' },
        { label: 'Details', key: 'details' },
    ]
    const handleAdd = () => navigate('/email-campaigns/create') // Adjust route

    return (
        <div className="flex flex-col md:flex-row gap-3">
            {' '}
            {/* <CSVLink ... /> */}{' '}
            <Button variant="solid" icon={<TbMail />} onClick={handleAdd} block>
                {' '}
                Create Campaign{' '}
            </Button>{' '}
        </div>
    )
}
// --- End CampaignActionTools ---

// --- Detail View Dialog ---
const DetailViewDialog = ({
    isOpen,
    onClose,
    campaign,
}: {
    isOpen: boolean
    onClose: () => void
    campaign: EmailCampaignItem | null
}) => {
    if (!campaign) return null

    return (
        <Dialog
            isOpen={isOpen}
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
            width={600} // Adjust width as needed
            onClose={onClose}
            onRequestClose={onClose}
        >
            <h5 className="mb-4">
                Campaign Details: {campaign.templateName} ({campaign.templateId}
                )
            </h5>
            <div className="mb-4">
                <p>
                    <strong>Sent/Scheduled:</strong>{' '}
                    {campaign.dateTime.toLocaleString()}
                </p>
                <p>
                    <strong>Record ID:</strong> {campaign.id}
                </p>
            </div>
            <div>
                <h6 className="mb-2 font-semibold">Details:</h6>
                {/* Render details - could be plain text or richer content */}
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {campaign.details}
                </p>
            </div>
            <div className="text-right mt-6">
                <Button variant="solid" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Dialog>
    )
}
// --- End Detail View Dialog ---

// --- Main EmailCampaignListing Component ---
const EmailCampaignListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [campaigns, setCampaigns] = useState<EmailCampaignItem[]>(
        initialDummyCampaigns,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: '', key: '' },
        query: '',
    })
    // const [selectedCampaigns, setSelectedCampaigns] = useState<EmailCampaignItem[]>([]); // Selection might not be needed
    const [detailViewOpen, setDetailViewOpen] = useState(false)
    const [currentItemForView, setCurrentItemForView] =
        useState<EmailCampaignItem | null>(null)
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...campaigns]

        // Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (c) =>
                    c.id.toLowerCase().includes(query) ||
                    c.templateId.toLowerCase().includes(query) ||
                    c.templateName.toLowerCase().includes(query) ||
                    c.details.toLowerCase().includes(query),
            )
        }

        // Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            const sortedData = [...processedData]
            sortedData.sort((a, b) => {
                if (key === 'dateTime') {
                    const timeA = a.dateTime.getTime()
                    const timeB = b.dateTime.getTime()
                    return order === 'asc' ? timeA - timeB : timeB - timeA
                }
                const aValue = a[key as keyof EmailCampaignItem] ?? ''
                const bValue = b[key as keyof EmailCampaignItem] ?? ''
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
    }, [campaigns, tableData])
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
            }) /* setSelectedCampaigns([]); */
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

    // Row/All Row Select handlers removed if table is not selectable

    const handleViewDetails = useCallback((item: EmailCampaignItem) => {
        setCurrentItemForView(item)
        setDetailViewOpen(true)
    }, [])

    const handleCloseDetailView = useCallback(() => {
        setDetailViewOpen(false)
        setCurrentItemForView(null)
    }, [])

    // Delete handlers removed if not applicable
    // const handleDelete = useCallback((itemToDelete: EmailCampaignItem) => { ... }, [setCampaigns, setSelectedCampaigns]);
    // const handleDeleteSelected = useCallback(() => { ... }, [selectedCampaigns, setCampaigns, setSelectedCampaigns]);
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<EmailCampaignItem>[] = useMemo(
        () => [
           
            {
                header: 'Template ID',
                accessorKey: 'templateId',
                enableSorting: true,
                width: 200,
            },
            {
                header: 'Template Name',
                accessorKey: 'templateName',
                enableSorting: true,
            },
            {
                header: 'Details',
                accessorKey: 'details',
                enableSorting: false, // Usually don't sort by long details
                // Show truncated details, view full in modal
                cell: (props) => (
                    <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">
                        {props.row.original.details}
                    </span>
                ),
            },
            {
                header: 'Date & Time',
                accessorKey: 'dateTime',
                enableSorting: true,
                width: 180,
                cell: (props) => {
                    const date = props.row.original.dateTime
                    return (
                        <span>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    )
                },
            },
            {
                header: 'Action',
                id: 'action',
                size: 80, // Adjusted width for single action
                meta : {HeaderClass : "text-center"},
                cell: (props) => (
                    <ActionColumn
                        onView={() => handleViewDetails(props.row.original)}
                        // Edit/Delete/Clone/Status removed
                    />
                ),
            },
        ],
        [handleViewDetails], // Update dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Email Campaign Listing</h5>
                    <CampaignActionTools allCampaigns={campaigns} />
                </div>

                {/* Tools */}
                <div className="mb-4">
                    <CampaignTableTools onSearchChange={handleSearchChange} />
                </div>

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <CampaignTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        // selectedCampaigns={selectedCampaigns} // Remove if not selectable
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        // onRowSelect={handleRowSelect} // Remove if not selectable
                        // onAllRowSelect={handleAllRowSelect} // Remove if not selectable
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer - Removed if table is not selectable */}
            {/*
            <CampaignSelected
                selectedCampaigns={selectedCampaigns}
                setSelectedCampaigns={setSelectedCampaigns}
                onDeleteSelected={handleDeleteSelected}
            />
             */}

            {/* Detail View Dialog */}
            <DetailViewDialog
                isOpen={detailViewOpen}
                onClose={handleCloseDetailView}
                campaign={currentItemForView}
            />
        </Container>
    )
}
// --- End Main Component ---

export default EmailCampaignListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
