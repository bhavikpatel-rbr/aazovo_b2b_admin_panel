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
import DataTable1 from './DataTable1'
import { NumericFormat } from 'react-number-format'
import { TbCoin, TbShoppingBagCheck, TbEye } from 'react-icons/tb'
import type { ReactNode } from 'react'
import type { StatisticData, Period, StatisticCategory } from '../types'
import { COLORS } from '@/constants/chart.constant'
import { Tag } from '@/components/ui'
import IndiaIcon from "/img/countries/IN.png"
import { MdCancel, MdCheckCircle, MdOutlineBusinessCenter } from 'react-icons/md'
import { DataTable } from '@/components/shared'
import { FaBookmark, FaCircle } from 'react-icons/fa'
import { FaArrowDownLong, FaArrowUpLong } from 'react-icons/fa6'
import { BsCake } from 'react-icons/bs'
import { IoMdShare } from 'react-icons/io'
import { HiOutlineMinusCircle, HiOutlinePlusCircle } from 'react-icons/hi'

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
    const [selectedCategory, setSelectedCategory] = useState<StatisticCategory>('Opportunity')

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
            subRows: [
                {
                    productName: 'Iphone 14 Pro Max',
                    brand: 'Apple',
                    category: 'Electronics',
                    subCategory: 'Mobile',
                    status: 'Active',
                },
                {
                    productName: 'Iphone 14 Pro Max',
                    brand: 'Apple',
                    category: 'Electronics',
                    subCategory: 'Mobile',
                    status: 'Active',
                },
            ]
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
            id: 'expander',
            header: "",
            cell: (props) => {
                return (
                    <>
                        <button
                            className="text-xl"
                            {...{
                                onClick: props.row.getToggleExpandedHandler(),
                            }}
                        >
                            {props.row.getIsExpanded() ? (
                                <HiOutlineMinusCircle />
                            ) : (
                                <HiOutlinePlusCircle />
                            )}
                        </button>
                    </>
                )
            },
        },
        {
            header: 'Products',
            accessorKey: 'name',
            enableSorting: true,
            size: 230,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <h6 className="text-xs">Macbook M4</h6>
                    <span className="text-xs flex gap-1">
                        ({"Matches: 5"})
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Buyers: </h6> 3/3
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Sellers: </h6> 2/3
                    </span>
                </div>
            )
        },
        {
            header: 'Matched',
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
            header: 'Verified', accessorKey: 'verified',
            size: 100,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="flex flex-wrap gap-1 text-xs">
                        <h6 className="text-sm">Members:</h6> {props.row.original.noOfMember}/43 (34%)
                    </span>
                    <div className='flex gap-1 items-center'>
                        <Tooltip title="KYC Verification : 48%" className='text-xs'>
                            <div className=' border border-gray-300 rounded-md py-1 px-1.5 text-xs flex items-center gap-1'>
                                <MdCheckCircle className='text-green-500 text-lg' />
                                <span>13/27</span>
                            </div>
                        </Tooltip>
                        <Tooltip title="Enable Billing" className='text-xs'><MdCancel className='text-red-500 text-lg' /></Tooltip>
                    </div>
                    <Tooltip className='text-xs' title={`Profile Completion ${props.row.original.progress}%`}>
                        <div className='h-1.5 w-28 rounded-full bg-gray-300'>
                            <div className={`font-bold rounded-full h-1.5 bg-blue-500 heading-text mt-1`}
                                style={{ width: props.row.original.progress + "%" }}
                            ></div>
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Walls', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            13 | 12 | 25
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Opportunities', accessorKey: 'opportunity',
            size: 170,
            cell: props => (
                <div>
                    <Tooltip title="Offers: 34 | Demands: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Leads', accessorKey: 'leads',
            size: 180,
            cell: props => (
                <div>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Ratio', accessorKey: 'trustRatio',
            size: 180,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Success:</h6> {props.row.original.successRatio}
                    </Tag>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Trust:</h6> {props.getValue()}
                    </Tag>
                    <Tag className="flex gap-1 text-[10px] flex-wrap">
                        <h6 className="text-[10px]">Health Score:</h6> 80%
                    </Tag>
                </div>
            )
        },

    ]

    const memberData = [
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

    const memberColumns = [

        {
            header: 'Sales Person (RM)',
            accessorKey: 'name',
            enableSorting: true,
            size: 230,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <h6 className="text-xs">Janhvi Kapoor</h6>
                    <span className="text-xs flex">
                        <h6 className="text-xs"></h6> ({"XYZ Company Name"})
                    </span>
                    <span className="text-xs flex gap-1">9582850192</span>
                    <span className="text-xs flex gap-1">xyz@gmail.com</span>
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
                    <span className="text-xs ">
                        <h6 className="text-xs inline">Brands:</h6> {props.row.original.brands?.map(val => {
                            return <span>{val}, </span>
                        })}
                    </span>
                    <span className="text-xs ">
                        <h6 className="text-xs inline">Category:</h6> {props.row.original.category}
                    </span>
                    <span className="text-xs ">
                        <h6 className="text-xs inline">Products: </h6>Iphone, Airpods, Macbook
                    </span>
                </div>
            )
        },
        {
            header: 'Count', accessorKey: 'leads',
            size: 180,
            cell: props => (
                <div>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Follow-Ups', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="New: 13 | Follow-Up: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            13 | 12 | 25
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Total', accessorKey: 'opportunity',
            size: 160,
            cell: props => (
                <div>
                    <Tooltip title="Qty: 34 | Value: $15,67,832" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | $15,67,832
                        </div>
                    </Tooltip>
                </div>
            )
        },

        {
            header: 'Average & Ratio', accessorKey: 'trustRatio',
            size: 190,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Response Time :</h6>3.2 hours
                    </Tag>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Closing Time :</h6>4.5 days
                    </Tag>
                    <Tag className="flex gap-1 text-[10px] flex-wrap">
                        <h6 className="text-[10px]">Conversion Rate :</h6> 70%
                    </Tag>
                    <Tag className="flex gap-1 text-[10px] flex-wrap bg-green-200">
                        <h6 className="text-[10px]">Grade :</h6> A
                    </Tag>
                </div>
            )
        },

    ]

    const productData = [
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

    const productColumns = [
        {
            header: 'Product Info',
            accessorKey: 'name',
            enableSorting: true,
            size: 230,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    {/* Product Name */}
                    <div className="flex items-start gap-2">
                        <Avatar src={IndiaIcon} size="sm" />
                        <div>
                            <h6 className="text-xs mb-0.5">Product Name</h6>
                            <span className="text-xs">
                                <Tag className={statusColor[props.row.original.status]}> {props.row.original.status}</Tag>
                            </span>
                        </div>
                    </div>
                    {/* <span >Status: {props.row.original.status}</span> */}
                </div>
            )
        },
        {
            header: 'Brand/Category',
            accessorKey: 'brand',
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
                        <h6 className="text-xs">Subcategory:</h6> {props.row.original.interested}
                    </span>
                </div>
            )
        },
        {
            header: 'Walls', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            13 | 12 | 25
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Opportunities', accessorKey: 'opportunity',
            size: 160,
            cell: props => (
                <div>
                    <Tooltip title="Offers: 34 | Demands: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Leads', accessorKey: 'leads',
            size: 180,
            cell: props => (
                <div>
                    <Tooltip title="Success: 34 | Lost: 12 | Total: 46" className='text-xs'>
                        <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            34 | 12 | 46
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Ratio', accessorKey: 'trustRatio',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-[10px]">
                        <h6 className="text-[10px]">Success:</h6> {props.row.original.successRatio}
                    </Tag>
                    <Tag className="flex gap-1 text-[10px] flex-wrap">
                        <h6 className="text-[10px]">Engagement:</h6> 80%
                    </Tag>
                </div>
            )
        },

    ]

    const wallListingData = [
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

    const wallListingColumns = [
        {
            header: 'Member Info',
            accessorKey: 'name',
            enableSorting: true,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <h6 className="text-xs">{props.getValue()}</h6>
                    <span className="text-xs flex">
                        <h6 className="text-xs"></h6> ({"XYZ Company Name"})
                    </span>
                    <span className="text-xs flex gap-1">9582850192</span>
                    <span className="text-xs flex gap-1">xyz@gmail.com</span>
                </div>
            )
        },
        {
            header: 'Frequent Walls',
            accessorKey: 'brand',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs flex gap-1">
                        <b className="text-xs text-black dark:text-white font-semibold">Brands:</b> {props.row.original.brands?.map(val => {
                            return <span>{val}, </span>
                        })}
                    </span>
                    <span className="text-xs flex gap-1">
                        <b className="text-xs text-black dark:text-white font-semibold">Category:</b> {props.row.original.category}
                    </span>
                    <span className="text-xs flex gap-1">
                        <b className="text-xs text-black dark:text-white font-semibold">Subcategory:</b> {props.row.original.interested}
                    </span>
                    <span className="text-xs  gap-1">
                        <b className="text-xs text-black dark:text-white font-semibold">Products: </b>Iphone 14, Samsung s25
                    </span>
                </div>
            )
        },
        {
            header: 'Count', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="Buy: 13 | Sell: 12 | Total: 25 " className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            13 | 12 | 25
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Qty', accessorKey: 'wallCount',
            cell: props => (
                <div>
                    <Tooltip title="Buy: 23 | Sell: 8 | Total: 31" className='text-xs'>
                        <div className=' bg-stone-200 text-stone-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            23 | 8 | 31
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Opportunity', accessorKey: 'verified',
            cell: props => (
                <div className='flex flex-col gap-2.5'>
                    <div className='flex gap-1 items-center mb-0.5'>
                        <Tooltip title="Matched: 18 | Total Walls: 31" className='text-xs'>
                            <div className=' bg-violet-100 text-violet-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                18 | 27
                            </div>
                        </Tooltip>
                    </div>
                    <div className='flex gap-1 items-center mb-0.5'>
                        <Tooltip title="Offers: 18 | Demands: 31" className='text-xs'>
                            <div className=' bg-pink-100 text-pink-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                18 | 27
                            </div>
                        </Tooltip>
                    </div>
                    <div className='flex gap-1 items-center mb-0.5'>
                        <Tooltip title="Leads: 18 | Deals: 31" className='text-xs'>
                            <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                18 | 27
                            </div>
                        </Tooltip>
                    </div>
                </div>
            )
        },
        {
            header: 'Connect', accessorKey: 'leads',
            cell: props => (
                <div className='flex flex-col gap-0.5'>
                    <Tooltip title="Buy: 23 | Sell: 8 | Total Enquiry: 31" className='text-xs'>
                        <div className=' bg-orange-100 text-orange-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            23 | 8 | 31
                        </div>
                    </Tooltip>
                    <div className='flex gap-2 items-center mt-3 text-orange-400'>
                        <Tooltip title="Total Shares: 12" wrapperClass="flex gap-1 text-xs">
                            <IoMdShare className="text-base" />
                            <span>12</span>
                        </Tooltip>
                        <Tooltip title="Total Bookmarks: 8" wrapperClass="flex flex-row gap-1 text-xs">
                            <FaBookmark className="text-base" />
                            <span>8</span>
                        </Tooltip>
                    </div>
                </div>
            )
        },
        {
            header: 'Ratio', accessorKey: 'trustRatio',
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-xs flex-wrap">
                        <h6 className="text-xs">Approach:</h6> 80%
                    </Tag>
                    <Tag className="flex gap-1 text-xs">
                        <h6 className="text-xs">Conversion:</h6> {props.row.original.successRatio}
                    </Tag>
                    <span className="flex gap-1 text-xs flex-wrap">
                        Minimum Buying strong seller profile, focus on selling
                    </span>
                </div>
            )
        },

    ]
    const partnerColumns = [
        {
            header: 'Partner Info',
            accessorKey: 'name',
            enableSorting: true,
            size: 230,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <h6 className="text-xs">{props.getValue()}</h6>
                    <span className="text-xs flex">
                        <h6 className="text-xs"></h6> ({"XYZ Company Name"})
                    </span>
                    <span className="text-xs flex gap-1">{props.row.original.type}</span>
                    <span className="text-xs flex gap-1">xyz@gmail.com</span>
                    <span className="text-xs flex gap-1">India</span>
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
            header: 'Status',
            accessorKey: 'status',
            cell: props => (
                <span className="text-xs">
                    <Tag className={statusColor[props.row.original.status]}> {props.row.original.status}</Tag>
                </span>
            )
        },
        {
            header: 'Verified',
            accessorKey: 'status',
            size: 100,
            cell: props => (
                <span className="text-xs">
                    <Tag className={statusColor[props.row.original.status]}> Yes</Tag>
                </span>
            )
        },
        {
            header: 'Team',
            accessorKey: 'status',
            size: 80,
            cell: props => (
                <span className="text-xs flex items-center justify-center rounded-full bg-blue-100 
                text-blue-600 font-semibold w-8 h-8">7</span>
            )
        },
        {
            header: 'Joined Date',
            accessorKey: 'status',
            cell: props => (
                <span className="text-xs">10 May, 2025</span>
            )
        },
        {
            header: 'Score', accessorKey: 'trustRatio',
            size: 180,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <Tag className="flex gap-1 text-[10px] flex-wrap">
                        <h6 className="text-[10px]">Trust Score:</h6> 80%
                    </Tag>
                    <span className="flex gap-1 text-xs flex-wrap">
                        Minimum Buying strong seller profile, focus on selling
                    </span>
                </div>
            )
        },

    ]
    const teamColumns = [
        {
            header: 'Team Info',
            accessorKey: 'name',
            enableSorting: true,
            size: 190,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <div className='flex gap-2 items-center'>
                        <Tooltip title="Birthday : 23 May">
                            <BsCake className=" bg-red-200 h-5 w-5 p-1 text-red-600 rounded-sm " />
                        </Tooltip>
                        <h6 className="text-xs">Raman Ojha</h6>
                    </div>
                    <span className="text-xs flex">
                        <h6 className="text-xs"></h6> {"IT Department"}
                    </span>
                    <span className="text-xs flex gap-1">Frontend Developer</span>
                    <span className="text-xs flex gap-1">xyz@gmail.com</span>
                    <span className="text-xs flex gap-1">+91 8923572494</span>
                </div>
            )
        },
        {
            header: 'Assigned',
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
                        <h6 className="text-xs">Subcategory:</h6> {props.row.original.subcategory}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Country:</h6> {props.row.original.country}
                    </span>
                    <span className="text-xs flex gap-1">
                        <h6 className="text-xs">Product:</h6> {props.row.original.product}
                    </span>
                </div>
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            size: 110,
            cell: props => (
                <span className="text-xs">
                    <span className="text-xs">
                        <h6 className="text-xs mt-1">Joined:</h6> 10 Mar, 2025
                    </span>
                    <br />
                    <Tag className={statusColor[props.row.original.status]}> {props.row.original.status}</Tag>
                </span>
            )
        },
        {
            header: 'Activity',
            accessorKey: 'status',
            size: 150,
            cell: props => (
                <div className='flex flex-col gap-1'>
                    <span className="text-xs mb-1">
                        <h6 className="text-xs">Last Active : </h6> 12 Mar, 2024 10:00 PM
                    </span>
                    <Tooltip title="Present: 24 | Leaves: 2" className='text-xs'>
                        <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                            shadow-md inline'>
                            P: 24 | L: 2
                        </div>
                    </Tooltip>
                </div>
            )
        },
        {
            header: 'Performance',
            accessorKey: 'status',
            size: 150,
            cell: props => (
                <div className='flex flex-col gap-3'>
                    <div>
                        <Tooltip title="Completed: 23 | Pending: 4" className='text-xs'>
                            <div className=' bg-blue-100 text-blue-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                Task : 23 | 4
                            </div>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip title="Buy: 12 | Sell: 11 | Total: 23" className='text-xs'>
                            <div className=' bg-pink-100 text-pink-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                Listing : 12 | 11 | 23
                            </div>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip title="Offer: 12 | Demand: 11 | Total: 23" className='text-xs'>
                            <div className=' bg-violet-100 text-violet-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                O & D : 12 | 11 | 23
                            </div>
                        </Tooltip>
                    </div>
                    <div>
                        <Tooltip title="Success: 4 | Lost: 10 | Total: 14" className='text-xs'>
                            <div className=' bg-green-100 text-green-600 rounded-md p-1.5 text-xs 
                                shadow-md inline'>
                                Leads : 4 | 10 | 14
                            </div>
                        </Tooltip>
                    </div>
                    <Tag className="text-xs flex flex-wrap text-[10px]">
                        <h6 className="text-[10px]">Performance Score : </h6>
                        <span> 79%</span>
                    </Tag>
                </div>
            )
        },

    ]

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
                            title="Opportunity"
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
                            label="Opportunity"
                            active={selectedCategory === 'Opportunity'}
                            onClick={() => setSelectedCategory('Opportunity')}
                            colorClass="bg-red-100"
                            activeBgColor="bg-red-200"
                            iconBg="bg-red-400"
                        />
                        <StatisticCard
                            title="Leads"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="68"
                                    thousandSeparator={true}
                                />
                            }
                            iconClass="bg-emerald-200"
                            icon={<TbShoppingBagCheck className='h-5' />}
                            label="Leads"
                            active={selectedCategory === 'Leads'}
                            onClick={() => setSelectedCategory('Leads')}
                            colorClass="bg-green-100"
                            activeBgColor="bg-green-200"
                            iconBg="bg-green-400"
                        />
                        <StatisticCard
                            title="Accounts"
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
                            label="Accounts"
                            active={selectedCategory === 'Accounts'}
                            onClick={() => setSelectedCategory('Accounts')}
                            colorClass="bg-blue-100"
                            activeBgColor="bg-blue-200"
                            iconBg="bg-blue-400"
                        />
                        <StatisticCard
                            title="Tasks"
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
                            label="Tasks"
                            active={selectedCategory === 'Tasks'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Tasks')}
                            colorClass="bg-pink-100"
                            activeBgColor="bg-pink-200"
                            iconBg="bg-pink-400"
                        />
                        <StatisticCard
                            title="Web Analytics"
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
                            label="Web Analytics"
                            active={selectedCategory === 'Web Analytics'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Web Analytics')}
                            colorClass="bg-violet-100"
                            activeBgColor="bg-violet-200"
                            iconBg="bg-violet-400"
                        />
                        <StatisticCard
                            title="Marketing"
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
                            label="Marketing"
                            active={selectedCategory === 'Marketing'}
                            // compareFrom={data.totalProfit[selectedPeriod].comparePeriod}
                            onClick={() => setSelectedCategory('Marketing')}
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

                        {/* Opportunity Starts */}
                        {selectedCategory === 'Opportunity' && (
                            <div>
                                <div className='lg:flex  gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>22%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
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
                                            field="Converted"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Lost"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Dropped"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Offers"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Demands"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Avg Conversion"
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
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Opportunity Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Match Score</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable1
                                        columns={companyColumns}
                                        data={companyData}
                                        getRowCanExpand={() => true}
                                        renderSubComponent={({ row }) => (
                                            <div className="p-4 bg-gray-50">
                                                {/* Render whatever you want for expanded row */}
                                                <strong>Products:</strong>
                                                <ul>
                                                    {row.original.products?.map((p, idx) => (
                                                        <li key={idx}>
                                                            {p.productName} - {p.brand} ({p.status})
                                                        </li>
                                                    )) ?? <li>No products</li>}
                                                </ul>
                                            </div>
                                        )}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>

                        )}
                        {/* Opportunity Ends */}

                        {/* Leads  */}
                        {selectedCategory === 'Leads' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>2%</h3>
                                            <span className='text-red-600 text-lg'><FaArrowDownLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Recently"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Completed"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Cancelled"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="In-Progress"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Converted"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Follow-ups"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Top Products"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Top Category"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                        <Bar
                                            field="Top Brands"
                                            percent={20}
                                            color="text-[#6610f2]"
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Leads Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Conversion Rate</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={memberColumns}
                                        data={memberData}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Leads Ends */}

                        {/* Accounts  */}
                        {selectedCategory === 'Accounts' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>17%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
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
                                            field="Categories(3/5)"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Brands(2/6)"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Wall"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Leads"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Opportunity"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Activity Score"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Products Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Engagement Score</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={productColumns}
                                        data={productData}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Accounts Ends */}

                        {/* Tasks  */}
                        {selectedCategory === 'Tasks' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>13%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Verified"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Inactive"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Pending"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Blocked"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Category"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Type"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Recent"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="International"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="National"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Partners Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Trust Score</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={partnerColumns}
                                        data={wallListingData}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Tasks */}

                        {/* Web Analytics  */}
                        {selectedCategory === 'Web Analytics' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>34%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Buy"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Sell"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Inactive"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Pending"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Reject"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Category"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Subcat"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Brand"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Product"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                        <Bar
                                            field="Members"
                                            percent={20}
                                            color='text-gray-500'
                                            className="bg-gray-500 dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Wall Listings Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Conversion Ratio</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "High", value: "" },
                                                    { label: "Medium", value: "" },
                                                    { label: "Low", value: "" },
                                                    { label: "High Buyers", value: "" },
                                                    { label: "Pure Seller", value: "" },
                                                    { label: "Balanced", value: "" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={wallListingColumns}
                                        data={wallListingData}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Web Analytics Ends */}

                        {/* Marketing  */}
                        {selectedCategory === 'Marketing' && (
                            <div>
                                <div className='lg:flex gap-2 justify-between mt-4'>
                                    <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                        <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                        <div className='flex gap-1 items-center'>
                                            <h3>17%</h3>
                                            <span className='text-green-600 text-lg'><FaArrowUpLong /></span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar
                                            field="Total"
                                            percent={20}
                                            color='text-[#6610f2]'
                                            className="bg-[#6610f2] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Active"
                                            percent={20}
                                            color='text-[#2ecc71]'
                                            className="bg-[#2ecc71] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Inactive"
                                            percent={20}
                                            color='text-[#e74c3c]'
                                            className="bg-[#e74c3c] dark:opacity-70"
                                        />
                                        <Bar
                                            field="On Leave"
                                            percent={32}
                                            color='text-[#ffc107]'
                                            className="bg-[#ffc107] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Unapproved"
                                            percent={20}
                                            color='text-[#fd7e14]'
                                            className="bg-[#fd7e14] dark:opacity-70"
                                        />
                                        <Bar
                                            field="New Joinee"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Resigned"
                                            percent={20}
                                            color='text-[#28a745]'
                                            className="bg-[#28a745] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Departments"
                                            percent={28}
                                            color='text-[#6c757d]'
                                            className="bg-[#6c757d] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Task"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                        <Bar
                                            field="Performance"
                                            percent={20}
                                            color='text-[#007bff]'
                                            className="bg-[#007bff] dark:opacity-70"
                                        />
                                    </div>
                                </div>

                                <div className='mt-8 block  gap-2'>
                                    <div className='flex justify-between items-center'>
                                        <h6 className='mb-6'>Team Leaderboard</h6>
                                        <div className='flex gap-2 items-center text-sm'>
                                            <h6 className='text-sm'>Performance Score</h6>
                                            <Select
                                                className="min-w-[140px]"
                                                size="sm"
                                                defaultValue={{ label: "All", value: "All" }}
                                                options={[
                                                    { label: "75% - 100%", value: "75-100" },
                                                    { label: "50% - 74%", value: "50-74" },
                                                    { label: "25% - 49%", value: "25-49" },
                                                    { label: "0% - 24%", value: "0-24" },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                    <DataTable
                                        columns={teamColumns}
                                        data={wallListingData}
                                    // loading={isLoading}
                                    />

                                    {/* Note :- Success (%) = ( Success / Total Leads ) * 100 */}
                                    {/* Note :- Trust  = ( Company Activity, response rate and verification */}
                                </div>
                            </div>
                        )}
                        {/* Marketing */}


                    </Card>
                </section>

            </section>
        </Card>
    )
}

export default Overview
