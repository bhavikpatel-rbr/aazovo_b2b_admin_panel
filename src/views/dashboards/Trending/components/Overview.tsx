import { useState, useEffect, useRef, ReactNode } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { Button, Tag, Tooltip } from '@/components/ui'
import { NumericFormat } from 'react-number-format'
import classNames from 'classnames'
import { useThemeStore } from '@/store/themeStore'
import {
    TbShoppingBagCheck,
    TbEye,
    TbProgressCheck,
    TbExchange,
    TbWorld,
    TbRadar2,
    TbTargetArrow,
} from 'react-icons/tb'
import { MdOutlineBusinessCenter } from 'react-icons/md'
import { FaArrowDownLong, FaArrowUpLong } from 'react-icons/fa6'
import Opportunities from '@/views/sales-Leads/Opportunities'
import Leads from '@/views/sales-Leads/Lead'
import TaskList from '@/views/task-management/Task-List/TaskList'
import WallListing from '@/views/sales-Leads/Wall-Listing'

import type { Period, StatisticCategory } from '../types'

type StatisticCardProps = {
    title: string
    value: number | ReactNode
    icon: ReactNode
    label: StatisticCategory
    active: boolean
    onClick: (label: StatisticCategory) => void
    colorClass: string
    activeBgColor: string
    iconBg: string
}

type StatisticGroupsProps = {
    // data is no longer used directly as child components handle their own data
    // data: StatisticData
}

const StatisticCard = (props: StatisticCardProps) => {
    const {
        title,
        value,
        label,
        icon,
        active,
        onClick,
        colorClass,
        activeBgColor,
        iconBg,
    } = props

    return (
        <button
            className={classNames(
                'p-4 rounded-2xl cursor-pointer ltr:text-left rtl:text-right transition duration-150 outline-hidden',
                colorClass,
                active && `${activeBgColor} shadow-md`
            )}
            onClick={() => onClick(label)}
        >
            <div className="flex justify-between items-center relative">
                <div className="">
                    <div className="mb-4 !text-xs text-gray-900  font-bold ">
                        {title}
                    </div>
                    <h6 className="mb-1 text-gray-900">{value}</h6>
                </div>
                <div
                    className={`flex items-center justify-center min-h-8 min-w-8 max-h-8 max-w-8 ${iconBg}
                            text-white rounded-full text-2xl`}
                >
                    {icon}
                </div>
            </div>
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
            <div className="font-bold heading-text mt-1">
                {percent}% <span className="font-normal text-xs">(110)</span>
            </div>
        </div>
    )
}

const Overview = ({ data }: StatisticGroupsProps) => {
    const [selectedCategory, setSelectedCategory] =
        useState<StatisticCategory>('Opportunity')

    // This state is kept in case it's needed for future filter implementations
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('thisMonth')

    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse
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
                <div className="flex gap-2">
                    {/* <Select
                        className="w-auto"
                        size="sm"
                        defaultValue={{ label: 'All Country', value: 'All Country' }}
                        options={[
                            { label: 'All Country', value: 'AllCountry' },
                            {
                                label: (
                                    <div className="flex items-center gap-2 mr-6">
                                        <img
                                            src="/img/countries/IN.png"
                                            className="h-6 w-6"
                                        />
                                        <span>India</span>
                                    </div>
                                ),
                                value: 'India',
                            },
                            {
                                label: (
                                    <div className="flex items-center gap-2 mr-6">
                                        <img
                                            src="/img/countries/UK.png"
                                            className="h-6 w-6"
                                        />
                                        <span>UK</span>
                                    </div>
                                ),
                                value: 'UK',
                            },
                            {
                                label: (
                                    <div className="flex items-center gap-2 mr-6">
                                        <img
                                            src="/img/countries/US.png"
                                            className="h-6 w-6"
                                        />
                                        <span>US</span>
                                    </div>
                                ),
                                value: 'US',
                            },
                        ]}
                    />
                    <Select
                        className="min-w-[140px]"
                        size="sm"
                        defaultValue={{ label: 'All Category', value: 'All' }}
                        options={[
                            { label: 'All Category', value: 'AllCategory' },
                            { label: 'Electronics', value: 'Electronics' },
                            { label: 'Engineering', value: 'Engineering' },
                            { label: 'Plastic', value: 'Plastic' },
                            { label: 'Food', value: 'Food' },
                        ]}
                    /> */}
                </div>
            </div>

            <section className="block  gap-4 w-full">
                <section>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl py-3 mt-4 ">
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
                            icon={<MdOutlineBusinessCenter className="h-5" />}
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
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            icon={<TbShoppingBagCheck className="h-5" />}
                            label="Leads"
                            active={selectedCategory === 'Leads'}
                            onClick={() => setSelectedCategory('Leads')}
                            colorClass="bg-green-100"
                            activeBgColor="bg-green-200"
                            iconBg="bg-green-400"
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
                            icon={<TbProgressCheck className="h-5" />}
                            label="Tasks"
                            active={selectedCategory === 'Tasks'}
                            onClick={() => setSelectedCategory('Tasks')}
                            colorClass="bg-pink-100"
                            activeBgColor="bg-pink-200"
                            iconBg="bg-pink-400"
                        />
                        <StatisticCard
                            title="Wall Listing"
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value="12"
                                    prefix={''}
                                    thousandSeparator={true}
                                />
                            }
                            icon={<TbEye className="h-5" />}
                            label="WallListing"
                            active={selectedCategory === 'WallListing'}
                            onClick={() => setSelectedCategory('WallListing')}
                            colorClass="bg-orange-100"
                            activeBgColor="bg-orange-200"
                            iconBg="bg-orange-400"
                        />
                    </div>
                    <Card bodyClass="px-4 py-3">
                        <div className="flex items-center justify-between">
                            <h6 className="capitalize">
                                {selectedCategory === 'WallListing' ? 'Wall Listing' : selectedCategory} summary
                            </h6>
                            <Select
                                className="min-w-[140px]"
                                size="sm"
                                defaultValue={{ label: 'All', value: 'All' }}
                                options={[
                                    { label: 'All', value: 'All' },
                                    { label: 'Today', value: 'Today' },
                                    { label: 'Weekly', value: 'Weekly' },
                                    { label: 'Monthly', value: 'Monthly' },
                                    { label: '3 Months', value: '3 Months' },
                                    { label: '6 Months', value: '6 Months' },
                                    { label: 'This Year', value: 'This Year' },
                                ]}
                            />
                        </div>

                        {/* Opportunity Section */}
                        {selectedCategory === 'Opportunity' && (
                            <div>
                                <div className="lg:flex  gap-2 justify-between mt-4">
                                    <div className="whitespace-nowrap pr-4 border-r border-r-gray-200">
                                        <span className=" font-semibold text-black dark:text-white">
                                            Growth Rate
                                        </span>
                                        <div className="flex gap-1 items-center">
                                            <h3>22%</h3>
                                            <span className="text-green-600 text-lg">
                                                <FaArrowUpLong />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar field="Total" percent={20} color="text-[#6610f2]" className="bg-[#6610f2] dark:opacity-70" />
                                        <Bar field="Active" percent={20} color="text-[#28a745]" className="bg-[#28a745] dark:opacity-70" />
                                        <Bar field="Inactive" percent={28} color="text-[#6c757d]" className="bg-[#6c757d] dark:opacity-70" />
                                        <Bar field="Converted" percent={32} color="text-[#ffc107]" className="bg-[#ffc107] dark:opacity-70" />
                                        <Bar field="Lost" percent={20} color="text-[#e74c3c]" className="bg-[#e74c3c] dark:opacity-70" />
                                        <Bar field="Dropped" percent={20} color="text-[#2ecc71]" className="bg-[#2ecc71] dark:opacity-70" />
                                        <Bar field="Offers" percent={20} color="text-[#007bff]" className="bg-[#007bff] dark:opacity-70" />
                                        <Bar field="Demands" percent={20} color="text-[#fd7e14]" className="bg-[#fd7e14] dark:opacity-70" />
                                        <Bar field="Avg Conversion" percent={20} color="text-[#20c997]" className="bg-[#20c997] dark:opacity-70" />
                                        <Bar field="Avg Score" percent={20} color="text-gray-500" className="bg-gray-500 dark:opacity-70" />
                                    </div>
                                </div>
                                <div className="mt-8 block  gap-2">
                                    <div className="flex justify-between items-center mb-6">
                                        <h6>Opportunity Leaderboard</h6>
                                        {/* <div className="flex gap-2 items-center text-sm">
                                            <h6 className="text-sm">Match Score</h6>
                                        </div> */}
                                    </div>
                                    <Opportunities isDashboard={true} />
                                </div>
                            </div>
                        )}

                        {/* Leads Section */}
                        {selectedCategory === 'Leads' && (
                            <div>
                                <div className="lg:flex gap-2 justify-between mt-4">
                                    <div className="whitespace-nowrap pr-4 border-r border-r-gray-200">
                                        <span className=" font-semibold text-black dark:text-white">
                                            Growth Rate
                                        </span>
                                        <div className="flex gap-1 items-center">
                                            <h3>2%</h3>
                                            <span className="text-red-600 text-lg">
                                                <FaArrowDownLong />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar field="Total" percent={20} color="text-[#6610f2]" className="bg-[#6610f2] dark:opacity-70" />
                                        <Bar field="Recently" percent={20} color="text-[#2ecc71]" className="bg-[#2ecc71] dark:opacity-70" />
                                        <Bar field="Completed" percent={20} color="text-[#e74c3c]" className="bg-[#e74c3c] dark:opacity-70" />
                                        <Bar field="Cancelled" percent={20} color="text-[#28a745]" className="bg-[#28a745] dark:opacity-70" />
                                        <Bar field="In-Progress" percent={28} color="text-[#6c757d]" className="bg-[#6c757d] dark:opacity-70" />
                                        <Bar field="Converted" percent={32} color="text-[#ffc107]" className="bg-[#ffc107] dark:opacity-70" />
                                        <Bar field="Follow-ups" percent={20} color="text-[#fd7e14]" className="bg-[#fd7e14] dark:opacity-70" />
                                        <Bar field="Top Products" percent={20} color="text-[#007bff]" className="bg-[#007bff] dark:opacity-70" />
                                        <Bar field="Top Category" percent={20} color="text-gray-500" className="bg-gray-500 dark:opacity-70" />
                                        <Bar field="Top Brands" percent={20} color="text-[#6610f2]" className="bg-[#6610f2] dark:opacity-70" />
                                    </div>
                                </div>

                                <div className="mt-8 block  gap-2">
                                    <div className="flex justify-between items-center mb-6">
                                        <h6>Leads Leaderboard</h6>
                                        <div className="flex gap-2 items-center text-sm">
                                            {/* <h6 className="text-sm">
                                                Conversion Rate
                                            </h6> */}
                                        </div>
                                    </div>
                                    <Leads isDashboard={true} />
                                </div>
                            </div>
                        )}
                        
                        {/* Tasks Section */}
                        {selectedCategory === 'Tasks' && (
                            <div>
                                <div className="lg:flex gap-2 justify-between mt-4">
                                    <div className="whitespace-nowrap pr-4 border-r border-r-gray-200">
                                        <span className=" font-semibold text-black dark:text-white">
                                            Growth Rate
                                        </span>
                                        <div className="flex gap-1 items-center">
                                            <h3>13%</h3>
                                            <span className="text-green-600 text-lg">
                                                <FaArrowUpLong />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar field="Total" percent={20} color="text-[#6610f2]" className="bg-[#6610f2] dark:opacity-70" />
                                        <Bar field="Verified" percent={20} color="text-[#6610f2]" className="bg-[#6610f2] dark:opacity-70" />
                                        <Bar field="Active" percent={20} color="text-[#2ecc71]" className="bg-[#2ecc71] dark:opacity-70" />
                                        <Bar field="Inactive" percent={20} color="text-[#e74c3c]" className="bg-[#e74c3c] dark:opacity-70" />
                                        <Bar field="Pending" percent={32} color="text-[#ffc107]" className="bg-[#ffc107] dark:opacity-70" />
                                        <Bar field="Blocked" percent={20} color="text-[#fd7e14]" className="bg-[#fd7e14] dark:opacity-70" />
                                        <Bar field="Category" percent={20} color="text-[#007bff]" className="bg-[#007bff] dark:opacity-70" />
                                        <Bar field="Type" percent={20} color="text-[#28a745]" className="bg-[#28a745] dark:opacity-70" />
                                        <Bar field="Recent" percent={28} color="text-[#6c757d]" className="bg-[#6c757d] dark:opacity-70" />
                                        <Bar field="International" percent={20} color="text-[#007bff]" className="bg-[#007bff] dark:opacity-70" />
                                        <Bar field="National" percent={20} color="text-[#007bff]" className="bg-[#007bff] dark:opacity-70" />
                                    </div>
                                </div>

                                <div className="mt-8 block  gap-2">
                                    <div className="flex justify-between items-center mb-6">
                                        <h6>Tasks Leaderboard</h6>
                                        {/* <div className="flex gap-2 items-center text-sm">
                                            <h6 className="text-sm">Trust Score</h6>
                                        </div> */}
                                    </div>
                                    <TaskList isDashboard={true} />
                                </div>
                            </div>
                        )}

                        {/* Wall Listing Section */}
                        {selectedCategory === 'WallListing' && (
                            <div>
                                <div className="lg:flex gap-2 justify-between mt-4">
                                    <div className="whitespace-nowrap pr-4 border-r border-r-gray-200">
                                        <span className=" font-semibold text-black dark:text-white">
                                            Growth Rate
                                        </span>
                                        <div className="flex gap-1 items-center">
                                            <h3>17%</h3>
                                            <span className="text-green-600 text-lg">
                                                <FaArrowUpLong />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="lg:pl-4 flex items-center gap-1 w-full">
                                        <Bar field="Total" percent={20} color="text-[#6610f2]" className="bg-[#6610f2] dark:opacity-70" />
                                        <Bar field="Active" percent={20} color="text-[#2ecc71]" className="bg-[#2ecc71] dark:opacity-70" />
                                        <Bar field="Inactive" percent={20} color="text-[#e74c3c]" className="bg-[#e74c3c] dark:opacity-70" />
                                        <Bar field="On Leave" percent={32} color="text-[#ffc107]" className="bg-[#ffc107] dark:opacity-70" />
                                        <Bar field="Unapproved" percent={20} color="text-[#fd7e14]" className="bg-[#fd7e14] dark:opacity-70" />
                                        <Bar field="New Joinee" percent={20} color="text-[#007bff]" className="bg-[#007bff] dark:opacity-70" />
                                        <Bar field="Resigned" percent={20} color="text-[#28a745]" className="bg-[#28a745] dark:opacity-70" />
                                        <Bar field="Departments" percent={28} color="text-[#6c757d]" className="bg-[#6c757d] dark:opacity-70" />
                                        <Bar field="Task" percent={20} color="text-[#007bff]" className="bg-[#007bff] dark:opacity-70" />
                                        <Bar field="Performance" percent={20} color="text-[#007bff]" className="bg-[#007bff] dark:opacity-70" />
                                    </div>
                                </div>

                                <div className="mt-8 block  gap-2">
                                    <div className="flex justify-between items-center mb-6">
                                        <h6>Wall Listing Leaderboard</h6>
                                        {/* <div className="flex gap-2 items-center text-sm">
                                            <h6 className="text-sm">
                                                Performance Score
                                            </h6>
                                        </div> */}
                                    </div>
                                    <WallListing isDashboard={true} />
                                </div>
                            </div>
                        )}
                    </Card>
                </section>
            </section>
        </Card>
    )
}

export default Overview