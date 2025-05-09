import { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { Avatar } from '@/components/ui'
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

import IndiaIcon from "/img/countries/IN.png"
import { MdOutlineBusinessCenter } from 'react-icons/md'

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
            <div className="font-bold heading-text mt-1">{percent}%</div>
        </div>
    )
}

const Overview = ({ data }: StatisticGroupsProps) => {
    const [selectedCategory, setSelectedCategory] = useState<StatisticCategory>('Companies')
    const [selectedCategory1, setSelectedCategory1] = useState<StatisticCategory>('Wall Listings')

    const [selectedPeriod, setSelectedPeriod] = useState<Period>('thisMonth')

    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse,
    )

    const isFirstRender = useRef(true)

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

            <section className='block lg:grid grid-cols-2 gap-4 w-full'>
                <section >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-2xl py-3 mt-4 ">
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
                        
                        <div className='flex gap-2 w-full mt-4'>
                            <div className='whitespace-nowrap pr-4 border-r border-r-gray-200'>
                                <span className=' font-semibold text-black dark:text-white'>Growth Rate</span>
                                <h3>22%</h3>
                            </div>
                            <div className="pl-4 flex items-center gap-1 w-full">
                                <Bar
                                    field="Active"
                                    percent={20}
                                    color='text-green-600'
                                    className="bg-green-400 dark:opacity-70"
                                />
                                <Bar
                                    field="Inactive"
                                    percent={28}
                                    color='text-red-600'
                                    className="bg-red-400 dark:opacity-70"
                                />
                                <Bar
                                    field="Pending"
                                    percent={32}
                                    color='text-orange-600'
                                    className="bg-orange-400 dark:opacity-70"
                                />
                                <Bar
                                    field="Verified"
                                    percent={20}
                                    color='text-blue-600'
                                    className="bg-blue-400 dark:opacity-70"
                                />
                            </div>
                        </div>
                    </Card>
                </section>
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-2xl py-3 mt-4">
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
                            onClick={() => setSelectedCategory1('Wall Listings')}
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
                            onClick={() => setSelectedCategory1('Partners')}
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
                            onClick={() => setSelectedCategory1('Teams')}
                            colorClass="bg-orange-100"
                            activeBgColor="bg-orange-200"
                            iconBg="bg-orange-400"
                        />
                    </div>
                    <Card bodyClass='px-4 py-3'>
                        <div className="flex items-center justify-between">
                            <h6 className='capitalize'>{selectedCategory1} summary</h6>
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
                    </Card>
                </section>
            </section>
        </Card>
    )
}

export default Overview
