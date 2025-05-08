// src/views/your-path/SubscribersListing.tsx (Updated)

import React, {
    useState,
    useMemo,
    useCallback,
    Ref,
    lazy,
    Suspense,
} from 'react' // Added lazy, Suspense
import { Link, useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import { IoEyeOutline } from "react-icons/io5";
// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import Checkbox from '@/components/ui/Checkbox'
import Badge from '@/components/ui/Badge'
import { Card, Drawer, Tag, Form, FormItem, Input, Select, DatePicker, Table, Dropdown } from '@/components/ui'
import { HiOutlineCalendar } from 'react-icons/hi'
import {
    TbMail,
    TbFilter,
    TbX,
    TbUserCheck,
    TbCloudDownload,
} from 'react-icons/tb' // Added TbCloudDownload

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbEdit,
    TbPlus, // Keep if Add button might be needed later
} from 'react-icons/tb'
import { SlOptionsVertical } from "react-icons/sl";

import userIcon from "/img/avatars/thumb-1.jpg"

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
    import('react-csv').then((module) => ({ default: module.CSVLink })),
)
// --- End Lazy Load ---

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// --- Define Item Type ---
export type SubscriberItem = {
    id: string
    name : string
    email: string
    subscribedDate: Date
    // status?: 'subscribed' | 'unsubscribed';
    status: string
    source?: string
}
// --- End Item Type ---
// --- Updated Status Colors ---
const statusColor: Record<SubscriberItem['status'], string> = {
    Active: 'bg-green-200 dark:bg-green-200 text-green-600 dark:text-green-600',
    Inactive: 'bg-red-200 dark:bg-red-200 text-red-600 dark:text-red-600', // Example color for inactive
    Unsubscriber: 'bg-orange-200 dark:bg-orange-200 text-orange-600 dark:text-orange-600', // Example color for inactive
}

// --- Define Filter Schema ---
const filterValidationSchema = z.object({
    dateRange: z
        .tuple([z.date().nullable(), z.date().nullable()])
        .default([null, null]),
    // status: z.array(z.string()).default([]),
})
type FilterFormSchema = z.infer<typeof filterValidationSchema>
// --- End Filter Schema ---

// --- Constants ---
const initialDummySubscribers: SubscriberItem[] = [
    // ... (dummy data remains the same)
    {
        id: 'SUB001',
        name: "Alice",
        email: 'alice.subscriber@email.com',
        subscribedDate: new Date(2023, 10, 1, 9, 0),
        status: "Active",
        source: "Website" ,
    },
    {
        id: 'SUB002',
        name: "Bob",
        email: 'bob.fan@mail.net',
        subscribedDate: new Date(2023, 9, 15, 14, 30),
        status: "Inactive",
        source: "Manual" ,
    },
    {
        id: 'SUB003',
        name: "charlie",
        email: 'charlie.reader@domain.org',
        subscribedDate: new Date(2023, 8, 20, 11, 5),
        status: "Unsubscriber",
        source: "Manual" ,
    },
    {
        id: 'SUB004',
        name: "Diana",
        email: 'diana.interested@web.co',
        subscribedDate: new Date(2023, 7, 10, 16, 0),
        status: "Active",
        source: "Website" ,
    },
    {
        id: 'SUB005',
        name: "Ethan",
        email: 'ethan.updates@email.io',
        subscribedDate: new Date(2023, 10, 5, 8, 45),
        status: "Active",
        source: "Website" ,
    },
    {
        id: 'SUB006',
        name: "Fiona",
        email: 'fiona.news@mail.co',
        subscribedDate: new Date(2023, 6, 5, 10, 0),
        status: "Active",
        source: "Website" ,
    },
    {
        id: 'SUB007',
        name: "George",
        email: 'george.alerts@domain.com',
        subscribedDate: new Date(2023, 9, 1, 13, 20),
        status: "Active",
        source: "Website" ,
    },
    {
        id: 'SUB008',
        name: "Heidi",
        email: 'heidi.insider@email.com',
        subscribedDate: new Date(2023, 8, 1, 17, 10),
        status: "Active",
        source: "Website" ,
    },
]

// Extract unique values for filters if needed
// const uniqueStatuses = ...
// --- End Constants ---

// --- Reusable ActionColumn Component ---
const ActionColumn = ({ onDelete, data }: { onDelete: () => void, data: SubscriberItem }) => {
    const iconButtonClass =
        'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'

    const [isViewDrawerOpen , setIsViewDrawerOpen] = useState<boolean>(false)
    const openViewDrawer = ()=> setIsViewDrawerOpen(true)
    const closeViewDrawer = ()=> setIsViewDrawerOpen(false)

    const { Tr, Th, Td, THead, TBody } = Table

    const moreOptionsDropdown = [
        { key: 'welcome', name: 'Welcome' },
        { key: 'reminder', name: 'Reminder' },
        { key: 'newsletter', name: 'Newsletter' },
    ]

    return (
        <div className="flex items-center justify-center">
            <Tooltip title="View Subscriber">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-600',
                    )}
                    onClick={openViewDrawer}
                    role="button">
                    <IoEyeOutline />
                </div>
            </Tooltip>
            <Drawer
                width={600}
                title="Subscriber Details"
                isOpen={isViewDrawerOpen}
                onClose={closeViewDrawer}
                onRequestClose={closeViewDrawer}
                footer={
                    <div className="text-right w-full">
                        <Button size="sm" className="mr-2" onClick={closeViewDrawer}>
                            Cancel
                        </Button>
                    </div>  
                }
            >
                <div className=''>
                    <Card className='bg-gray-100 dark:bg-gray-700 border-none flex flex-col gap-2'>
                        {/* <h6 className="text-base font-semibold ">Exported Log</h6> */}
                        <div className="flex flex-col gap-2">
                            <figure className='flex gap-3 mt-2 items-center'>
                                <img src={userIcon} alt="icon" className='border h-10 w-10 aspect-square rounded-full'/>
                                <figcaption className='flex flex-col gap-1'>
                                    <div className="flex gap-2">
                                        <h6 className='font-semibold text-black dark:text-white'>{data.name}</h6>
                                        <Tag className={` ${statusColor[data.status]} text-xs inline w-auto`}>{data.status}</Tag>
                                    </div>
                                    <span className="text-xs">{data?.email}</span>

                                </figcaption>
                            </figure>
                            <div className="mt-1">
                                <p className='text-xs'>
                                    <span className='font-semibold text-black  dark:text-white'>Subscribed Date: </span>
                                    <span>{data?.subscribedDate?.toLocaleDateString()+" "+"20:00 PM"}</span>
                                </p>
                                <p className='text-xs' >
                                    <span className='font-semibold text-black  dark:text-white'>Source: </span>
                                    <span>{data?.source}</span>
                                </p>
                                <p className='text-xs' >
                                    <span className='font-semibold text-black  dark:text-white'>Note: </span>
                                    <span>{data?.note}</span>
                                </p>
                            </div>
                        </div>
                    </Card>
                    
                    <Card className="mt-4">
                        <h5>Mail History</h5>
                        <Table className="mt-4 w-full">
                            <THead>
                                <Tr>
                                    <Th>Template</Th>
                                    <Th>Type</Th>
                                    <Th>Status</Th>
                                    <Th>Sent at</Th>
                                    <Th>Action</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                <Tr>
                                    <Td>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">Welcome Email</span>
                                            <span className="text-xs">welcome_email_001</span>
                                        </div>
                                    </Td>
                                    <td>Auto</td>
                                    <td><Tag>Sent</Tag></td>
                                    <td className="text-xs">07 May, 2025 16:00 PM</td>
                                    <td>
                                        <Button size="xs">Resend</Button>
                                    </td>
                                </Tr>
                                <Tr>
                                    <Td>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">Welcome Email</span>
                                            <span className="text-xs">welcome_email_001</span>
                                        </div>
                                    </Td>
                                    <td>Auto</td>
                                    <td><Tag>Sent</Tag></td>
                                    <td className="text-xs">07 May, 2025 16:00 PM</td>
                                    <td>
                                        <Button size="xs">Resend</Button>
                                    </td>
                                </Tr>
                                <Tr>
                                    <Td>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">Welcome Email</span>
                                            <span className="text-xs">welcome_email_001</span>
                                        </div>
                                    </Td>
                                    <td>Auto</td>
                                    <td><Tag>Sent</Tag></td>
                                    <td className="text-xs">07 May, 2025 16:00 PM</td>
                                    <td>
                                        <Button size="xs">Resend</Button>
                                    </td>
                                </Tr>
                                <Tr>
                                    <Td>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">Welcome Email</span>
                                            <span className="text-xs">welcome_email_001</span>
                                        </div>
                                    </Td>
                                    <td>Auto</td>
                                    <td><Tag>Sent</Tag></td>
                                    <td className="text-xs">07 May, 2025 16:00 PM</td>
                                    <td>
                                        <Button size="xs">Resend</Button>
                                    </td>
                                </Tr>
                            </TBody>
                        </Table>
                    </Card>
                </div>
            </Drawer>

            <Tooltip title="Edit Subscriber">
                <div
                    className={classNames(
                        iconButtonClass,
                        hoverBgClass,
                        'text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400',
                    )}
                    role="button"
                >
                    <TbEdit />
                </div>
            </Tooltip>
            <Tooltip title="Delete Subscriber">
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
            <Dropdown renderTitle={<SlOptionsVertical className="mx-1 hover:text-blue-600 cursor-pointer"/>} >
                <Dropdown.Item key="welcome" eventKey="welcome" className="!text-xs !h-8">Welcome</Dropdown.Item>
                <Dropdown.Item key="reminder" eventKey="reminder" className="!text-xs !h-8">Reminder</Dropdown.Item>
                <Dropdown.Item key="newsletter" eventKey="newsletter" className="!text-xs !h-8">Newsletter</Dropdown.Item>
            </Dropdown>

        </div>
        
    )
}
// --- End ActionColumn ---

// --- SubscriberTable Component ---
const SubscriberTable = ({
    columns,
    data,
    loading,
    pagingData,
    selectedSubscribers,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
}: {
    /* ... props ... */
    columns: ColumnDef<SubscriberItem>[]
    data: SubscriberItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedSubscribers: SubscriberItem[] // Use new type
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: SubscriberItem) => void // Use new type
    onAllRowSelect: (checked: boolean, rows: Row<SubscriberItem>[]) => void // Use new type
}) => {
    return (
        <DataTable
            selectable
            columns={columns}
            data={data}
            loading={loading}
            pagingData={pagingData}
            checkboxChecked={(row) =>
                selectedSubscribers.some((selected) => selected.id === row.id)
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
// Type definition
type SubscriberTableProps = {
    columns: ColumnDef<SubscriberItem>[]
    data: SubscriberItem[]
    loading: boolean
    pagingData: { total: number; pageIndex: number; pageSize: number }
    selectedSubscribers: SubscriberItem[]
    onPaginationChange: (page: number) => void
    onSelectChange: (value: number) => void
    onSort: (sort: OnSortParam) => void
    onRowSelect: (checked: boolean, row: SubscriberItem) => void
    onAllRowSelect: (checked: boolean, rows: Row<SubscriberItem>[]) => void
}
// --- End SubscriberTable ---

// --- SubscriberSearch Component ---
type SubscriberSearchProps = {
    onInputChange: (value: string) => void
    ref?: Ref<HTMLInputElement>
}
const SubscriberSearch = React.forwardRef<
    HTMLInputElement,
    SubscriberSearchProps
>(({ onInputChange }, ref) => {
    return (
        <DebouceInput
            ref={ref}
            placeholder="Quick search..."
            suffix={<TbSearch className="text-lg" />}
            onChange={(e) => onInputChange(e.target.value)}
        />
    )
})
SubscriberSearch.displayName = 'SubscriberSearch'
// --- End SubscriberSearch ---

// --- SubscriberFilter Component ---
const SubscriberFilter = ({
    filterData,
    setFilterData,
}: {
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
}) => {

    const [isFilterDrawerOpen , setIsFilterDrawerOpen] = useState<boolean>(false)
    const {control, handleSubmit}  = useForm()
    const { DatePickerRange } = DatePicker
    const statusOptions = [{label:"Active",value:"Active"}, {label:"Inactive", value:"Inactive"} , {label:"Unsubscribed",value:"Unsubscribed"}]
    const sourceOptions = [{label:"Manual", value:"Manual"}, {label:"Website",value:"Website"}]
    const openFilterDrawer = ()=> setIsFilterDrawerOpen(true)
    const closeFilterDrawer = ()=> setIsFilterDrawerOpen(false)
    
    type FilterFormSchema = {
        status : object
        source : object
        subscriberDate : object
    } 

    const filterFormSubmit = async (data: FilterFormSchema)=>{
        console.log("filters", data)
        setFilterData(data)
        closeFilterDrawer()
    }
    return (
        <>
            <Button
                icon={<TbFilter />}
                className="relative"
                onClick={openFilterDrawer}
            >
                <span>Filter</span>{' '}
            </Button>
            <Drawer
                title="Filters"
                isOpen={isFilterDrawerOpen}
                onClose={closeFilterDrawer}
                onRequestClose={closeFilterDrawer}
                bodyClass=""
            >
                <Form size='sm' onSubmit={handleSubmit(filterFormSubmit)} containerClassName='grid grid-rows-[auto_80px]'>
                    <div>
                        <FormItem label="Status">
                            <Controller
                                name='status'
                                control={control}
                                render={({field})=>{
                                    return (
                                        <Select
                                            placeholder="Select Status"
                                            isMulti={true}
                                            options={statusOptions}
                                            onChange={(options)=>{
                                                const values = options.map(option => option.value)
                                                field.onChange(values)
                                            }}
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                        <FormItem label="Source">
                            <Controller
                                name='source'
                                control={control}
                                render={({field})=>{
                                    return (
                                        <Select
                                            placeholder="Select Source"
                                            isMulti={true}
                                            options={sourceOptions}
                                            onChange={(options)=>{
                                                const values = options.map(option => option.value)
                                                field.onChange(values)
                                            }}
                                        />
                                    )
                                }}
                            />
                        </FormItem>
                        <FormItem label='Date range'>
                            <Controller
                                control={control}
                                name='subscribedDate'
                                render={({field})=>(
                                    <DatePickerRange
                                        className=''
                                        placeholder="Select date range"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                    <div className="text-right border-t border-t-gray-200 w-full absolute bottom-0 py-4 right-0 pr-6 bg-white dark:bg-gray-700">
                        <Button size="sm" className="mr-2" type='button' onClick={closeFilterDrawer}>
                            Cancel
                        </Button>
                        <Button size="sm" variant="solid" type='submit'>
                            Apply
                        </Button>
                    </div> 
                </Form>
            </Drawer>
        </>
    )
}
// --- End SubscriberFilter ---

// --- SubscriberTableTools Component (Modified) ---
const SubscriberTableTools = ({
    onSearchChange,
    filterData,
    setFilterData,
    allSubscribers,
}: {
    onSearchChange: (query: string) => void
    filterData: FilterFormSchema
    setFilterData: (data: FilterFormSchema) => void
    allSubscribers: SubscriberItem[] // Pass all subscribers for export
}) => {
    // Prepare data for CSV
    const csvData = useMemo(
        () =>
            allSubscribers.map((s) => ({
                id: s.id,
                email: s.email,
                subscribedDate: s.subscribedDate.toISOString(),
            })),
        [allSubscribers],
    )
    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Email', key: 'email' },
        { label: 'Subscribed Date', key: 'subscribedDate' },
    ]

    return (
        // Use flex row, align items vertically, add gap
        <div className="flex flex-col md:flex-row md:items-center gap-2 w-full">
            {/* Search takes most space */}
            <div className="flex-grow"> 
                <SubscriberSearch onInputChange={onSearchChange} />
            </div>
            {/* Filter button and Export button grouped */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-shrink-0">
                <SubscriberFilter
                    filterData={filterData}
                    setFilterData={setFilterData}
                />
                <Suspense fallback={<Button loading>Loading Export...</Button>}>
                    <CSVLink
                        filename="subscribers.csv"
                        data={csvData}
                        headers={csvHeaders}
                    >
                        <Button icon={<TbCloudDownload />}> Export </Button>
                    </CSVLink>
                </Suspense>
            </div>
        </div>
    )
}
// --- End SubscriberTableTools ---

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({
    filterData,
    onRemoveFilter,
    onClearAll,
}: {
    filterData: FilterFormSchema
    onRemoveFilter: (key: keyof FilterFormSchema, value: any) => void
    onClearAll: () => void
}) => {
    const activeDateRange = filterData.dateRange || [null, null]
    const hasDateRange = activeDateRange[0] || activeDateRange[1]
    // Add other active filters here: const activeStatuses = ...
    const hasActiveFilters = hasDateRange /* || activeStatuses.length > 0 */

    if (!hasActiveFilters) return null

    const formatDate = (date: Date | null) =>
        date ? date.toLocaleDateString() : ''

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 pt-2 border-t border-gray-200 dark:border-gray-700 mt-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
                Active Filters:
            </span>
            {hasDateRange && (
                <Tag prefix className="...">
                    {' '}
                    Date: {formatDate(activeDateRange[0])} -{' '}
                    {formatDate(activeDateRange[1])}{' '}
                    <TbX
                        className="ml-1 ..."
                        onClick={() =>
                            onRemoveFilter('dateRange', [null, null])
                        }
                    />{' '}
                </Tag>
            )}
            {/* Render other active filters (e.g., status) here */}
            <Button
                size="xs"
                variant="plain"
                className="text-red-600 hover:text-red-500 hover:underline ml-auto"
                onClick={onClearAll}
            >
                {' '}
                Clear All{' '}
            </Button>
        </div>
    )
}
// --- End ActiveFiltersDisplay ---

// --- SubscriberActionTools Component (Simplified - only Add button if needed) ---
const SubscriberActionTools = () => {
    const navigate = useNavigate()
    const handleAdd = () => console.log('Add Subscriber action needed') // navigate('/subscribers/add');

    const [isAddNewDrawerOpen , setIsAddNewDrawerOpen] = useState<boolean>(false)
    const {control, handleSubmit}  = useForm()
    const statusOptions = [{label:"Active",value:"Active"}, {label:"Inactive", value:"Inactive"} , {label:"Unsubscribed",value:"Unsubscribed"}]
    const sourceOptions = [{label:"Manual", value:"Manual"}, {label:"Website",value:"Website"}]
    const openAddNewDrawer = ()=> setIsAddNewDrawerOpen(true)
    const closeAddNewDrawer = ()=> setIsAddNewDrawerOpen(false)
    
    const AddNewFormSubmit = async (data: SubscriberItem)=>{
        console.log("Add New Form Data", data)
        closeAddNewDrawer()
    }

    // Decide if manual adding is needed. If not, this component can be removed.
    return (
        <>
            <div className="flex flex-col md:flex-row gap-3">
                <Button variant="solid" icon={<TbPlus />} onClick={openAddNewDrawer} block> Add New </Button>
            </div>
            <Drawer
                title="Add New Subscriber"
                isOpen={isAddNewDrawerOpen}
                onClose={closeAddNewDrawer}
                onRequestClose={closeAddNewDrawer}
            >
                <Form size='sm' onSubmit={handleSubmit(AddNewFormSubmit)} containerClassName='grid grid-rows-[auto_80px]'>
                    <div className="">
                        <FormItem label="Name">
                            <Controller
                                name="name"
                                control={control}
                                render={({field})=>(
                                    <Input
                                        type="text"
                                        placeholder="Enter Name"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label="Email">
                            <Controller
                                name="email"
                                control={control}
                                render={({field})=>(
                                    <Input
                                        type="text"
                                        placeholder="Enter Email"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <div className="flex flex-col lg:flex-row gap-2">
                            <FormItem label="Status" className="w-1/2">
                                <Controller
                                    name='status'
                                    control={control}
                                    render={({field})=>{
                                        return (
                                            <Select
                                                placeholder="Select Status"
                                                options={statusOptions}
                                                onChange={(option)=>{
                                                    field.onChange(option.value)
                                                }}
                                            />
                                        )
                                    }}
                                />
                            </FormItem>
                            <FormItem label="Source" className="w-1/2">
                                <Controller
                                    name='source'
                                    control={control}
                                    render={({field})=>{
                                        return (
                                            <Select
                                                placeholder="Select Source"
                                                options={sourceOptions}
                                                onChange={(option)=>{
                                                    field.onChange(option.value)
                                                }}
                                            />
                                        )
                                    }}
                                />
                            </FormItem>
                        </div>
                        <FormItem label='Subscribed Date'>
                            <Controller
                                control={control}
                                name='dataRange'
                                render={({field})=>(
                                    <DatePicker
                                        placeholder="Select date range"
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                        <FormItem label='Notes'>
                            <Controller
                                control={control}
                                name='note'
                                render={({field})=>(
                                    <Input
                                        textArea
                                        placeholder="Add Note..."
                                        {...field}
                                    />
                                )}
                            />
                        </FormItem>
                    </div>
                    <div className="text-right border-t border-t-gray-200 w-full absolute bottom-0 py-4 right-0 pr-6 bg-white dark:bg-gray-700">
                        <Button size="sm" className="mr-2" type='button' onClick={closeAddNewDrawer}>
                            Cancel
                        </Button>
                        <Button size="sm" variant="solid" type='submit'>
                            Apply
                        </Button>
                    </div> 
                </Form>
            </Drawer>
        </>
    )
}
// --- End SubscriberActionTools ---

// --- SubscriberSelected Component ---
const SubscriberSelected = ({
    selectedSubscribers,
    setSelectedSubscribers,
    onDeleteSelected,
}: {
    selectedSubscribers: SubscriberItem[]
    setSelectedSubscribers: React.Dispatch<
        React.SetStateAction<SubscriberItem[]>
    >
    onDeleteSelected: () => void
}) => {
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    // ... (rest of component implementation remains the same) ...
    if (selectedSubscribers.length === 0) return null
    return <> {/* ... StickyFooter and ConfirmDialog ... */} </>
}
// --- End SubscriberSelected ---

// --- Main SubscribersListing Component ---
const SubscribersListing = () => {
    const navigate = useNavigate()

    // --- State ---
    const [isLoading, setIsLoading] = useState(false)
    const [subscribers, setSubscribers] = useState<SubscriberItem[]>(
        initialDummySubscribers,
    )
    const [tableData, setTableData] = useState<TableQueries>({
        pageIndex: 1,
        pageSize: 10,
        sort: { order: 'desc', key: 'subscribedDate' },
        query: '',
    })
    const [selectedSubscribers, setSelectedSubscribers] = useState<
        SubscriberItem[]
    >([])
    const [filterData, setFilterData] = useState<FilterFormSchema>(
        filterValidationSchema.parse({}),
    )
    // --- End State ---

    // --- Data Processing ---
    const { pageData, total } = useMemo(() => {
        let processedData = [...subscribers]

        // Apply Filtering
        if (
            filterData.dateRange &&
            (filterData.dateRange[0] || filterData.dateRange[1])
        ) {
            const startDate = filterData.dateRange[0]?.getTime()
            const endDate = filterData.dateRange[1]
                ? new Date(
                      filterData.dateRange[1].getTime() + 86399999,
                  ).getTime()
                : null
            processedData = processedData.filter((sub) => {
                const subTime = sub.subscribedDate.getTime()
                const startMatch = startDate ? subTime >= startDate : true
                const endMatch = endDate ? subTime <= endDate : true
                return startMatch && endMatch
            })
        }
        // Add status filter logic here

        // Apply Search
        if (tableData.query) {
            const query = tableData.query.toLowerCase()
            processedData = processedData.filter(
                (s) =>
                    s.id.toLowerCase().includes(query) ||
                    s.email.toLowerCase().includes(query),
                // Add status search if implemented
            )
        }

        // Apply Sorting
        const { order, key } = tableData.sort as OnSortParam
        if (order && key) {
            /* ... sort logic ... */
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
    }, [subscribers, tableData, filterData])
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
            setSelectedSubscribers([])
        },
        [tableData, handleSetTableData],
    )
    const handleSort = useCallback(
        (sort: OnSortParam) => {
            // handleSetTableData({ ...tableData, sort: sort, pageIndex: 1 })
            const newTableData = cloneDeep(tableData)
            newTableData.sort = sort
            handleSetTableData(newTableData)
        },
        [tableData, handleSetTableData],
    )
    const handleSearchChange = useCallback(
        (query: string) => {
            handleSetTableData({ ...tableData, query: query, pageIndex: 1 })
        },
        [tableData, handleSetTableData],
    )
    const handleApplyFilter = useCallback(
        (newFilterData: FilterFormSchema) => {
            setFilterData(newFilterData)
            handleSetTableData({ ...tableData, pageIndex: 1 })
            setSelectedSubscribers([])
        },
        [tableData, handleSetTableData],
    )
    // const handleRemoveFilter = useCallback(
    //     (key: keyof FilterFormSchema, value: any) => {
    //         setFilterData((prev) => {
    //             let newValues
    //             if (key === 'dateRange') {
    //                 newValues = [null, null]
    //             } else {
    //                 const currentValues = prev[key] || []
    //                 newValues = currentValues.filter((item) => item !== value)
    //             }
    //             const updatedFilterData = { ...prev, [key]: newValues }
    //             handleSetTableData({ ...tableData, pageIndex: 1 })
    //             setSelectedSubscribers([])
    //             return updatedFilterData
    //         })
    //     },
    //     [tableData, handleSetTableData],
    // )
    const handleClearAllFilters = useCallback(() => {
        const defaultFilters = filterValidationSchema.parse({})
        setFilterData(defaultFilters)
        handleSetTableData({ ...tableData, pageIndex: 1 })
        setSelectedSubscribers([])
    }, [tableData, handleSetTableData])

    const handleRowSelect = useCallback(
        (checked: boolean, row: SubscriberItem) => {
            /* ... */
        },
        [setSelectedSubscribers],
    )
    const handleAllRowSelect = useCallback(
        (checked: boolean, rows: Row<SubscriberItem>[]) => {
            /* ... */
        },
        [setSelectedSubscribers],
    )
    // Edit handler removed
    const handleDelete = useCallback(
        (subscriberToDelete: SubscriberItem) => {
            /* ... */
        },
        [setSubscribers, setSelectedSubscribers],
    )
    const handleDeleteSelected = useCallback(() => {
        /* ... */
    }, [selectedSubscribers, setSubscribers, setSelectedSubscribers])
    // --- End Handlers ---

    // --- Define Columns ---
    const columns: ColumnDef<SubscriberItem>[] = useMemo(
        () => [
            // { header: 'ID', accessorKey: 'id', ... }, // Optional ID
            { header: 'Name', accessorKey: 'name', enableSorting: true, size:120 },
            { header: 'Email', accessorKey: 'email', enableSorting: true, size: 200, meta: {HeaderClass :'text-left'}, },
            { header: 'Source', accessorKey: 'source', enableSorting: true, size: 90 },
            {
                header: 'Status',
                accessorKey: 'status',
                // Enable sorting
                enableSorting: true,
                size:120, 
                cell: (props) => {
                    const { status } = props.row.original
                    return (
                        <div className="flex items-center">
                            <Tag className={statusColor[status]}>
                                <span className="capitalize">{status}</span>
                            </Tag>
                        </div>
                    )
                },
            },
            {
                header: 'Subscribed Date',
                accessorKey: 'subscribedDate',
                enableSorting: true,
                meta: {HeaderClass :'text-right'},
                cell: (props) => {
                    const date = props.row.original.subscribedDate
                    return (
                        <span className='text-right block'>
                            {date.toLocaleDateString()}{' '}
                            {date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </span>
                    )
                },
            },
            // { header: 'Status', ... }, // Optional Status
            {
                header: 'Action',
                id: 'action',
                meta: {HeaderClass :'text-center'},
                cell: (props) => (
                    <ActionColumn
                        onDelete={() => handleDelete(props.row.original)}
                        data={props.row.original}
                    />
                ),
            },
        ],
        [handleDelete], // Update dependencies
    )
    // --- End Define Columns ---

    // --- Render Main Component ---
    return (
        <Container className="h-full">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Subscribers</h5>
                    {/* Action Tools removed from header, Export moved to Table Tools */}
                    <SubscriberActionTools />
                </div>

                {/* Tools - Search, Filter, Export */}
                <div className="mb-2">
                    <SubscriberTableTools
                        onSearchChange={handleSearchChange}
                        filterData={filterData}
                        setFilterData={handleApplyFilter}
                        allSubscribers={subscribers} // Pass data for export
                    />
                </div>

                {/* Active Filters Display Area */}
                {/* <ActiveFiltersDisplay
                    filterData={filterData}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                /> */}

                {/* Table */}
                <div className="flex-grow overflow-auto">
                    <SubscriberTable
                        columns={columns}
                        data={pageData}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: tableData.pageIndex as number,
                            pageSize: tableData.pageSize as number,
                        }}
                        selectedSubscribers={selectedSubscribers}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                        onSort={handleSort}
                        onRowSelect={handleRowSelect}
                        onAllRowSelect={handleAllRowSelect}
                    />
                </div>
            </AdaptiveCard>

            {/* Selected Footer */}
            <SubscriberSelected
                selectedSubscribers={selectedSubscribers}
                setSelectedSubscribers={setSelectedSubscribers}
                onDeleteSelected={handleDeleteSelected}
            />
        </Container>
    )
}
// --- End Main Component ---

export default SubscribersListing

// Helper Function
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
