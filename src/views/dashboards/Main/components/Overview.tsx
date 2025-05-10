import { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { Avatar, Checkbox, Tooltip } from '@/components/ui'
import GrowShrinkValue from '@/components/shared/GrowShrinkValue'
import AbbreviateNumber from '@/components/shared/AbbreviateNumber'
import Chart from '@/components/shared/Chart'
import { useThemeStore } from '@/store/themeStore'
import classNames from '@/utils/classNames'
import { COLOR_1, COLOR_2, COLOR_4 } from '@/constants/chart.constant'
import { options } from '../constants'
import { NumericFormat } from 'react-number-format'
import { TbCoin, TbShoppingBagCheck, TbEye } from 'react-icons/tb'
import type { ReactNode } from 'react'
import type { StatisticData, Period, StatisticCategory } from '../types'
import { COLORS } from '@/constants/chart.constant'
import { Tag } from '@/components/ui'
import IndiaIcon from "/img/countries/IN.png"
import { MdOutlineBusinessCenter } from 'react-icons/md'
import { DataTable } from '@/components/shared'
import { FaCircle } from 'react-icons/fa'

type StatisticCardProps = {
    title: string
    value: number | ReactNode
    icon: ReactNode
    iconClass: string
    label: StatisticCategory
    active: boolean
    onClick: (label: StatisticCategory) => void
    colorClass: string,
    activeBgColor: string,
    iconBg: string,
}

type StatisticGroupsProps = {
    data: StatisticData
}

const chartColors: Record<StatisticCategory, string> = {
    totalProfit: COLOR_1,
    totalOrder: COLOR_2,
    totalImpression: COLOR_4,
}

const StatisticCard = (props: StatisticCardProps) => {
    const {
        title,
        value,
        label,
        icon,
        iconClass,
        active,
        onClick,
        colorClass,
        activeBgColor,
        iconBg
    } = props

    return (
        <button
            className={classNames(
                'p-4 rounded-2xl cursor-pointer ltr:text-left rtl:text-right transition duration-150 outline-hidden',
                colorClass,
                active && `${activeBgColor} shadow-md`,
            )}
            onClick={() => onClick(label)}
        >
            {/* <div
                className={classNames(
                    'rounded-2xl p-4 flex flex-col justify-center',
                )}
            > */}
            <div className="flex justify-between items-center relative">
                <div className=''>
                    <div className="mb-4 !text-xs text-gray-900  font-bold ">{title}</div>
                    <h6 className="mb-1 text-gray-900">{value}</h6>
                </div>
                <div
                    className={
                        `flex items-center justify-center min-h-8 min-w-8 max-h-8 max-w-8 ${iconBg}
                            text-white rounded-full text-2xl`
                    }
                >
                    {icon}
                </div>
            </div>
            {/* </div> */}
        </button>
    )
}

const Bar = ({
    percent,
    className,
    field,
    color,
}: {
    percent: number
    className?: string
    field: string
    color: string
}) => {
    return (
        <div className="flex-1" style={{ width: `${percent}%` }}>
            <span className={`${color} dark:text-white text-xs`}>{field}</span>
            <div className={classNames('h-1.5 rounded-full', className)} />
            <div className="font-bold heading-text mt-1">{percent}% <span className='font-normal text-xs'>(110)</span></div>
        </div>
    )
}

const Overview = ({ data }: StatisticGroupsProps) => {
    const [selectedCategory, setSelectedCategory] = useState<StatisticCategory>('Companies')

    const [selectedPeriod, setSelectedPeriod] = useState<Period>('thisMonth')

    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse,
    )

    const statusColor = {
        Active: "bg-green-200 text-green-600",
        Verified: "bg-blue-200 text-blue-600",
        Pending: "bg-orange-200 text-orange-600",
        Inactive: "bg-red-200 text-red-600",
    }

    const isFirstRender = useRef(true)

    const companyData = [
    {
        name: 'Global Tech Supplies',
        type: 'Manufacture',
        interested: 'Sell',
        category: 'Electronics',
        brands: ['Apple', 'Samsung'],
        country: 'India',
        trustRatio: '87%',
        successRatio: '87%',
        noOfMember: 12,
        wallCount: 3,
        success: 3,
        lost: 4,
        buy: 2,
        sell: 1,
        opportunity: 7,
        offers: 3,
        demands: 4,
        leads: 14,
        deals: 6,
        risk: 'Low',
        action: 'View',
        status: 'Active',
        progress: 85,
    },
    {
        name: 'Nova Agro Imports',
        type: 'Distributor',
        interested: 'Buy',
        category: 'Agriculture',
        brands: ['Bayer', 'Syngenta'],
        country: 'Brazil',
        trustRatio: '92%',
        successRatio: '90%',
        noOfMember: 8,
        wallCount: 2,
        success: 5,
        lost: 1,
        buy: 3,
        sell: 0,
        opportunity: 6,
        offers: 2,
        demands: 4,
        leads: 11,
        deals: 7,
        risk: 'Very Low',
        action: 'View',
        status: 'Active',
        progress: 78,
    },
    {
        name: 'IronShield Industries',
        type: 'Manufacturer',
        interested: 'Sell',
        category: 'Metals',
        brands: ['JSW', 'Tata Steel'],
        country: 'India',
        trustRatio: '80%',
        successRatio: '76%',
        noOfMember: 15,
        wallCount: 4,
        success: 6,
        lost: 3,
        buy: 0,
        sell: 4,
        opportunity: 9,
        offers: 5,
        demands: 4,
        leads: 18,
        deals: 9,
        risk: 'Medium',
        action: 'View',
        status: 'Pending',
        progress: 68,
    },
    {
        name: 'Medico HealthCare Pvt Ltd',
        type: 'Retailer',
        interested: 'Buy',
        category: 'Pharmaceuticals',
        brands: ['Cipla', 'Dr. Reddy'],
        country: 'India',
        trustRatio: '85%',
        successRatio: '82%',
        noOfMember: 6,
        wallCount: 1,
        success: 2,
        lost: 2,
        buy: 2,
        sell: 0,
        opportunity: 4,
        offers: 1,
        demands: 3,
        leads: 6,
        deals: 3,
        risk: 'Low',
        action: 'View',
        status: 'Active',
        progress: 71,
    },
    {
        name: 'AutoTech Exporters Ltd',
        type: 'Exporter',
        interested: 'Sell',
        category: 'Automobile Parts',
        brands: ['Bosch', 'Denso'],
        country: 'Germany',
        trustRatio: '90%',
        successRatio: '88%',
        noOfMember: 10,
        wallCount: 2,
        success: 7,
        lost: 2,
        buy: 1,
        sell: 5,
        opportunity: 10,
        offers: 6,
        demands: 4,
        leads: 20,
        deals: 12,
        risk: 'Very Low',
        action: 'View',
        status: 'Inactive',
        progress: 89,
    },
];


    const companyColumns = [
        {
            header: 'Company Info',
            accessorKey: 'name',
            enableSorting:true,
            size: 230,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <h6 className="text-sm">{props.getValue()}</h6>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Type:</h6> {props.row.original.type}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Country:</h6> {props.row.original.country}
                    </span>
                    <span className="text-xs">
                        <Tag className={statusColor[props.row.original.status]}> {props.row.original.status}</Tag>
                    </span>
                    {/* <span >Status: {props.row.original.status}</span> */}
                </div>
            )
        },
        {
            header: 'Preferences',
            accessorKey: 'brands',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Brands:</h6> {props.row.original.brands?.map(val => {
                            return <span>{val}, </span>
                        })}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Category:</h6> {props.row.original.category}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Interested:</h6> {props.row.original.interested}
                    </span>
                </div>
            )
        },
        {
            header: 'Team & Verified', accessorKey: 'verified',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="flex gap-1">
                        <h6 className="text-sm">Members:</h6> {props.row.original.noOfMember}
                    </span>
                    <div className='flex gap-1'>
                        <Tooltip title="GST" className='text-xs'><FaCircle className='text-green-500'/></Tooltip>
                        <Tooltip title="PAN" className='text-xs'><FaCircle className='text-red-500'/></Tooltip>
                        <Tooltip title="KYC" className='text-xs'><FaCircle className='text-green-500'/></Tooltip>
                        <Tooltip title="Bank" className='text-xs'><FaCircle className='text-red-500'/></Tooltip>
                        <Tooltip title="Certificates" className='text-xs'><FaCircle className='text-green-500'/></Tooltip>
                    </div>
                    <Tooltip className='text-xs' title={`Profile Completion ${props.row.original.progress}%`}>
                        <div className='h-1.5 w-28 rounded-full bg-gray-400'>
                            <div className={`font-bold rounded-full h-1.5 bg-blue-400 heading-text mt-1`}
                                style={{width : props.row.original.progress+"%"}}
                            ></div>
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Wall Count', accessorKey: 'wallCount',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Total:</h6> {props.getValue()}
                    </span>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Buy:</h6> {props.row.original.buy}
                    </span>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Sell:</h6> {props.row.original.sell}
                    </span>
                </div>
            )
        },
        {
            header: 'Opportunities', accessorKey: 'opportunity',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Total:</h6> {props.getValue()}
                    </span>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Offers:</h6> {props.row.original.offers}
                    </span>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Demands:</h6> {props.row.original.demands}
                    </span>
                </div>
            )
        },
        {
            header: 'Leads', accessorKey: 'leads',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Total:</h6> {props.getValue()}
                    </span>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Success:</h6> {props.row.original.success}
                    </span>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Lost:</h6> {props.row.original.lost}
                    </span>
                </div>
            )
        },
        {
            header: 'Ratio', accessorKey: 'trustRatio',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Success:</h6> {props.row.original.successRatio}
                    </span>
                    <span className="flex gap-1 text-xs">
                        <h6 className="text-xs">Trust:</h6> {props.getValue()}
                    </span>
                </div>
            )
        },
        
    ]

    // const companyData = [
    //     {   rank: 1, company: "ABC Exports Pvt Ltd",type: "Seller",deals:218,transactionValue: "3.8 Cr",
    //         rating:4.8, kycStatus: "Verified", lastOrder: "08 May 2025", contactPerson : "Raj Mehta"
    //     },
    //     {   rank: 2, company: "Zed Global Traders",type: "Buyer",deals:205,transactionValue: "3.2 Cr",
    //         rating:4.5, kycStatus: "Verified", lastOrder: "06 May 2025", contactPerson : "Kavita Sharma"
    //     },
    //     {   rank: 3, company: "TradeLink Logistics",type: "Both",deals:190,transactionValue: "2.7 Cr",
    //         rating:4.6, kycStatus: "Verified", lastOrder: "07 May 2025", contactPerson : "S. Iqbal"
    //     },
    //     {   rank: 4, company: "DuraSteel Supplies",type: "Seller",deals:170,transactionValue: "2.4 Cr",
    //         rating:4.4, kycStatus: "Pending", lastOrder: "05 May 2025", contactPerson : "Nidhi Bansal"
    //     },
    //     {   rank: 5, company: "Nova Wholesale Hub",type: "Buyer",deals:165,transactionValue: "2.0 Cr",
    //         rating:4.3, kycStatus: "Verified", lastOrder: "04 May 2025", contactPerson : "Akshay Jha"
    //     },
    // ]

    // const companyColumns = [
    //     {   header: '🏆 Rank',accessorKey: 'rank', enableSorting: false, size: 80, 
    //         cell : (props) => <span className='text-center block'>{props.getValue(0)}</span>
    //     },
    //     {   header: '🏢 Company',accessorKey: 'company', enableSorting: false, size: 150},
    //     {   header: '📂 Type',accessorKey: 'type', enableSorting: false, size: 90, meta : {HeaderClass : "text-center"},
    //         cell : (props) => <span className='text-center block'>{props.getValue(0)}</span>
    //     },
    //     {   header: '📦 Deals',accessorKey: 'deals', enableSorting: false, size: 80, meta : {HeaderClass : "text-center"},
    //         cell : (props) => <span className='text-center block'>{props.getValue(0)}</span>
    //     },
    //     { header: '💰 Transaction',accessorKey: 'transactionValue', enableSorting: false, meta : {HeaderClass : "text-center"},
    //         cell : (props) => <span className='text-center block'>{props.getValue(0)}</span>
    //     },
    //     { header: '⭐ Rating',accessorKey: 'rating', enableSorting: false, size: 80,
    //         cell : (props) => <span className='text-center block'>{props.getValue(0)}</span>
    //     },
    //     { header: '🧾 KYC',accessorKey: 'kycStatus', enableSorting: false, size: 70, meta : {HeaderClass : "text-center"},
    //         cell : (props) => <span className='text-center block'>{props.getValue(0)}</span>
    //     },
    //     { header: '📅 Last Order',accessorKey: 'lastOrder', enableSorting: false, size: 120,  meta : {HeaderClass : "text-center"},
    //         cell : (props) => <span className='text-center block'>{props.getValue(0)}</span>
    //     },
    //     { header: '👤 Contact Person',accessorKey: 'contactPerson', enableSorting: false,
    //         cell : (props) => <span className=' block'>{props.getValue(0)}</span>
    //     },
    // ]

    useEffect(() => {
        if (!sideNavCollapse && isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        if (!isFirstRender.current) {
            window.dispatchEvent(new Event('resize'))
        }
    }, [sideNavCollapse])

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>Overview</h4>
                <div className='flex gap-2'>
                    <Select
                        className="w-auto"
                        size="sm"
                        defaultValue={{ label: "All Country", value: "All Country" }}
                        options={[
                            { label: "All Country", value: "AllCountry" },
                            {
                                label: (
                                    <div className='flex items-center gap-2 mr-6'>
                                        <img src="/img/countries/IN.png" className='h-6 w-6' />
                                        <span>India</span>
                                    </div>
                                ),
                                value: "India"
                            },
                            {
                                label: (
                                    <div className='flex items-center gap-2 mr-6'>
                                        <img src="/img/countries/UK.png" className='h-6 w-6' />
                                        <span>UK</span>
                                    </div>
                                ),
                                value: "UK"
                            },
                            {
                                label: (
                                    <div className='flex items-center gap-2 mr-6'>
                                        <img src="/img/countries/US.png" className='h-6 w-6' />
                                        <span>US</span>
                                    </div>
                                ),
                                value: "US"
                            },
                        ]}
                    />
                    <Select
                        className="min-w-[140px]"
                        size="sm"
                        defaultValue={{ label: "All Category", value: "All" }}
                        options={[
                            { label: "All Category", value: "AllCategory" },
                            { label: "Electronics", value: "Electronics" },
                            { label: "Engineering", value: "Engineering" },
                            { label: "Plastic", value: "Plastic" },
                            { label: "Food", value: "Food" },
                        ]}
                    />
                </div>
            </div>

            <section className='block  gap-4 w-full'>
                <section >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-2 rounded-2xl py-3 mt-4 ">
                        <StatisticCard
                            title="Companies"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-sky-200"
                            icon={<MdOutlineBusinessCenter className='h-5' />}
                            label="Companies"
                            active={selectedCategory === 'Companies'}
                            onClick={() => setSelectedCategory('Companies')}
                            colorClass="bg-red-100"
                            activeBgColor="bg-red-200"
                            iconBg="bg-red-400"
                        />
                        <StatisticCard
                            title="Members"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="68"
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-emerald-200"
                            icon={<TbShoppingBagCheck className='h-5' />}
                            label="Members"
                            active={selectedCategory === 'Members'}
                            onClick={() => setSelectedCategory('Members')}
                            colorClass="bg-green-100"
                            activeBgColor="bg-green-200"
                            iconBg="bg-green-400"
                        />
                        <StatisticCard
                            title="Products"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-purple-200"
                            icon={<TbEye className='h-5' />}
                            label="Products"
                            active={selectedCategory === 'Products'}
                            onClick={() => setSelectedCategory('Products')}
                            colorClass="bg-blue-100"
                            activeBgColor="bg-blue-200"
                            iconBg="bg-blue-400"
                        />
                        <StatisticCard
                            title="Wall Listings"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            // growShrink={data.totalProfit[selectedPeriod].growShrink}
                            iconClass="bg-sky-200"
                            icon={<TbCoin className='h-5' />}
                            label="Wall Listings"
                            active={selectedCategory === 'Wall Listings'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Wall Listings')}
                            colorClass="bg-violet-100"
                            activeBgColor="bg-violet-200"
                            iconBg="bg-violet-400"
                        />
                        <StatisticCard
                            title="Partners"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="23"
                                    thousandSeparator={true}
                                />
                            }
                            // growShrink={data.totalOrder[selectedPeriod].growShrink}
                            iconClass="bg-emerald-200"
                            icon={<TbShoppingBagCheck className='h-5' />}
                            label="Partners"
                            active={selectedCategory === 'Partners'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Partners')}
                            colorClass="bg-pink-100"
                            activeBgColor="bg-pink-200"
                            iconBg="bg-pink-400"
                        />
                        <StatisticCard
                            title="Teams"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            // growShrink={data.totalImpression[selectedPeriod].growShrink}
                            iconClass="bg-purple-200"
                            icon={<TbEye className='h-5' />}
                            label="Teams"
                            active={selectedCategory === 'Teams'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Teams')}
                            colorClass="bg-orange-100"
                            activeBgColor="bg-orange-200"
                            iconBg="bg-orange-400"
                        />
                    </div>
                    <Card bodyClass='px-4 py-3'>
                        <div className="flex items-center justify-between">
                            <h6 className='capitalize'>{selectedCategory} summary</h6>
                            <Select
                                className="min-w-[140px]"
                                size="sm"
                                defaultValue={{ label: "All", value: "All" }}
                                options={[
                                    { label: "All", value: "All" },
                                    { label: "Today", value: "Today" },
                                    { label: "Weekly", value: "Weekly" },
                                    { label: "Monthly", value: "Monthly" },
                                    { label: "3 Months", value: "3 Months" },
                                    { label: "6 Months", value: "6 Months" },
                                    { label: "This Year", value: "This Year" },
                                ]}
                            />
                        </div>

                        {selectedCategory === 'Companies' && (
                            <div>
                                <div className='flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <h3>22%</h3>
                                    </div>
                                    <div className="pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Inactive"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Pending"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Verified"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Unverified"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Buyer"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Seller"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Both"
                                            percent={20}
                                            color='text-[#20c997]'
                                            className="bg-[#20c997] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Avg Score"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <h6 className='mb-6'>Company Leaderboard</h6>
                                    <DataTable
                                        columns={companyColumns}
                                        data={companyData}
                                    // loading={isLoading}
                                    />
                                </div>
                            </div>

                        )}
                        {selectedCategory === 'Members' && (
                            <div className='flex gap-2 w-full mt-4'>

                            </div>
                        )}
                        {selectedCategory === 'Products' && (
                            <div className='flex gap-2 w-full mt-4'>

                            </div>
                        )}


                    </Card>
                </section>

            </section>
        </Card>
    )
}

export default Overview
