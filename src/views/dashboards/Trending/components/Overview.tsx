import { useState, useEffect, useRef, ReactNode, FC, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { NumericFormat } from 'react-number-format'
import classNames from 'classnames'
import { useThemeStore } from '@/store/themeStore'
import {
    TbShoppingBagCheck,
    TbEye,
    TbProgressCheck,
    TbWorld,
} from 'react-icons/tb'
import { MdOutlineBusinessCenter } from 'react-icons/md'

// Child-view components
import Opportunities from '@/views/sales-Leads/Opportunities'
import Leads from '@/views/sales-Leads/Lead'
import TaskList from '@/views/task-management/Task-List/TaskList'
import WallListing from '@/views/sales-Leads/Wall-Listing'
import AccountDocument from '@/views/Account-Documents'

import type { StatisticCategory } from '../types'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import shallowEqual from '@/components/ui/utils/shallowEqual'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '@/reduxtool/store'
import { getAllCountAction } from '@/reduxtool/master/middleware'

// --- Component Props ---

type StatisticCardProps = {
    title: string
    value: ReactNode
    icon: ReactNode
    label: StatisticCategory
    active: boolean
    onClick: (label: StatisticCategory) => void
    colorClass: string
    activeBgColor: string
    iconBg: string
}

type BarProps = {
    percent: number
    className?: string
    field: string
    color: string
    count: number // Added count to show the actual number
}

// --- UI Sub-components ---

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
                <div>
                    <div className="mb-4 !text-xs text-gray-900 font-bold">
                        {title}
                    </div>
                    <h6 className="mb-1 text-gray-900">{value}</h6>
                </div>
                <div
                    className={`flex items-center justify-center min-h-8 min-w-8 max-h-8 max-w-8 ${iconBg} text-white rounded-full text-2xl`}
                >
                    {icon}
                </div>
            </div>
        </button>
    )
}

const Bar = ({ percent, className, field, color, count }: BarProps) => {
    return (
        <div className="flex-1" style={{ width: `${percent}%`, minWidth: '80px' }}>
            <span className={`${color} dark:text-white text-xs`}>{field}</span>
            <div className={classNames('h-1.5 rounded-full', className)} />
            <div className="font-bold heading-text mt-1">
                {Math.round(percent)}%{' '}
                <span className="font-normal text-xs">({count})</span>
            </div>
        </div>
    )
}

// --- Main Component ---

const Overview = () => {
    const [selectedCategory, setSelectedCategory] =
        useState<StatisticCategory>('Opportunity')

    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse
    )

    const { AllCountData = {} } = useSelector(masterSelector, shallowEqual)

    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(getAllCountAction())
    }, [dispatch])

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

    // --- Dynamic Configuration based on API Data ---
    const dynamicCategoryConfig = useMemo(() => {
        // Helper function to calculate percentage safely
        const calculatePercent = (count: number, total: number) => {
            if (total === 0 || count === 0) return 0
            return (count / total) * 100
        }

        // --- Safely extract counts from the API response ---
        
        // 1. Opportunity Data
        const opportunityData = AllCountData?.response1?.data?.data || []
        const opportunityTotal = opportunityData.length
        const opportunityStatusCounts = opportunityData.reduce(
            (acc, curr) => {
                const status = curr.status || 'Unknown'
                acc[status] = (acc[status] || 0) + 1
                return acc
            },
            {} as Record<string, number>
        )

        // 2. Leads Data
        const leadCounts = AllCountData?.response2?.data?.counts || {}
        const leadTotal = leadCounts.total || 0

        // 3. Tasks Data
        const taskCounts = AllCountData?.response3?.data?.counts || {}
        const taskTotal = taskCounts.total || 0

        // 4. Wall Listing Data
        const wallListingCounts = AllCountData?.response4?.data?.counts || {}
        const wallListingTotal = wallListingCounts.total || 0

        // 5. Company / Account Document Data
        const companyCounts = AllCountData?.response5?.counts || {}
        const companyTotal = companyCounts.total || 0


        // --- Return the dynamic configuration object ---
        return {
            Opportunity: {
                title: 'Opportunity',
                value: opportunityTotal,
                icon: <MdOutlineBusinessCenter className="h-5" />,
                colorClass: 'bg-red-100',
                activeBgColor: 'bg-red-200',
                iconBg: 'bg-red-400',
                summaryTitle: 'Opportunity summary',
                leaderboardTitle: 'Opportunity Leaderboard',
                Component: Opportunities,
                bars: [
                    { field: 'Total', count: opportunityTotal, percent: opportunityTotal > 0 ? 100 : 0, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
                    { field: 'Active', count: opportunityStatusCounts.Active || 0, percent: calculatePercent(opportunityStatusCounts.Active || 0, opportunityTotal), color: 'text-[#28a745]', className: 'bg-[#28a745]' },
                    { field: 'Pending', count: opportunityStatusCounts.Pending || 0, percent: calculatePercent(opportunityStatusCounts.Pending || 0, opportunityTotal), color: 'text-[#ffc107]', className: 'bg-[#ffc107]' },
                ],
            },
            Leads: {
                title: 'Leads',
                value: leadTotal,
                icon: <TbShoppingBagCheck className="h-5" />,
                colorClass: 'bg-green-100',
                activeBgColor: 'bg-green-200',
                iconBg: 'bg-green-400',
                summaryTitle: 'Leads summary',
                leaderboardTitle: 'Leads Leaderboard',
                Component: Leads,
                bars: [
                    { field: 'Total', count: leadCounts.total || 0, percent: leadTotal > 0 ? 100 : 0, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
                    { field: 'New', count: leadCounts.new || 0, percent: calculatePercent(leadCounts.new || 0, leadTotal), color: 'text-[#007bff]', className: 'bg-[#007bff]' },
                    { field: 'Completed', count: leadCounts.completed || 0, percent: calculatePercent(leadCounts.completed || 0, leadTotal), color: 'text-[#28a745]', className: 'bg-[#28a745]' },
                    { field: 'Cancelled', count: leadCounts.cancelled || 0, percent: calculatePercent(leadCounts.cancelled || 0, leadTotal), color: 'text-[#e74c3c]', className: 'bg-[#e74c3c]' },
                ],
            },
            Tasks: {
                title: 'Tasks',
                value: taskTotal,
                icon: <TbProgressCheck className="h-5" />,
                colorClass: 'bg-pink-100',
                activeBgColor: 'bg-pink-200',
                iconBg: 'bg-pink-400',
                summaryTitle: 'Tasks summary',
                leaderboardTitle: 'Tasks Leaderboard',
                Component: TaskList,
                bars: [
                    { field: 'Total', count: taskCounts.total || 0, percent: taskTotal > 0 ? 100 : 0, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
                    { field: 'Pending', count: taskCounts.pending || 0, percent: calculatePercent(taskCounts.pending || 0, taskTotal), color: 'text-[#ffc107]', className: 'bg-[#ffc107]' },
                    { field: 'In Progress', count: taskCounts.in_progress || 0, percent: calculatePercent(taskCounts.in_progress || 0, taskTotal), color: 'text-[#007bff]', className: 'bg-[#007bff]' },
                    { field: 'Completed', count: taskCounts.completed || 0, percent: calculatePercent(taskCounts.completed || 0, taskTotal), color: 'text-[#28a745]', className: 'bg-[#28a745]' },
                ],
            },
            WallListing: {
                title: 'Wall Listing',
                value: wallListingTotal,
                icon: <TbEye className="h-5" />,
                colorClass: 'bg-orange-100',
                activeBgColor: 'bg-orange-200',
                iconBg: 'bg-orange-400',
                summaryTitle: 'Wall Listing summary',
                leaderboardTitle: 'Wall Listing Leaderboard',
                Component: WallListing,
                bars: [
                    { field: 'Total', count: wallListingCounts.total || 0, percent: wallListingTotal > 0 ? 100 : 0, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
                    { field: 'Buy', count: wallListingCounts.buy || 0, percent: calculatePercent(wallListingCounts.buy || 0, wallListingTotal), color: 'text-[#28a745]', className: 'bg-[#28a745]' },
                    { field: 'Sell', count: wallListingCounts.sell || 0, percent: calculatePercent(wallListingCounts.sell || 0, wallListingTotal), color: 'text-[#fd7e14]', className: 'bg-[#fd7e14]' },
                    { field: 'Active', count: wallListingCounts.active || 0, percent: calculatePercent(wallListingCounts.active || 0, wallListingTotal), color: 'text-[#2ecc71]', className: 'bg-[#2ecc71]' },
                    { field: 'Pending', count: wallListingCounts.pending || 0, percent: calculatePercent(wallListingCounts.pending || 0, wallListingTotal), color: 'text-[#ffc107]', className: 'bg-[#ffc107]' },
                ],
            },
            Company: {
                title: 'Account Document',
                value: companyTotal,
                icon: <TbWorld className="h-5" />,
                colorClass: 'bg-blue-100',
                activeBgColor: 'bg-blue-200',
                iconBg: 'bg-blue-400',
                summaryTitle: 'Account Document Summary',
                leaderboardTitle: 'Account Document Leaderboard',
                Component: AccountDocument,
                bars: [
                    { field: 'Total', count: companyCounts.total || 0, percent: companyTotal > 0 ? 100 : 0, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
                    { field: 'Pending', count: companyCounts.pending || 0, percent: calculatePercent(companyCounts.pending || 0, companyTotal), color: 'text-[#ffc107]', className: 'bg-[#ffc107]' },
                    { field: 'Completed', count: companyCounts.completed || 0, percent: calculatePercent(companyCounts.completed || 0, companyTotal), color: 'text-[#28a745]', className: 'bg-[#28a745]' },
                ],
            },
        }
    }, [AllCountData])

    const activeCategoryData = dynamicCategoryConfig[selectedCategory]
    const { Component: ActiveComponent } = activeCategoryData

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>Overview</h4>
                {/* Filters can be re-added here if needed */}
            </div>

            <section className="block gap-4 w-full">
                {/* Statistic Cards - Generated Dynamically */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 rounded-2xl py-3 mt-4">
                    {Object.entries(dynamicCategoryConfig).map(
                        ([key, config]) => (
                            <StatisticCard
                                key={key}
                                label={key as StatisticCategory}
                                title={config.title}
                                value={
                                    <NumericFormat
                                        displayType="text"
                                        value={config.value || 0}
                                        thousandSeparator={true}
                                    />
                                }
                                icon={config.icon}
                                active={selectedCategory === key}
                                onClick={setSelectedCategory}
                                colorClass={config.colorClass}
                                activeBgColor={config.activeBgColor}
                                iconBg={config.iconBg}
                            />
                        )
                    )}
                </div>

                {/* Details Section - Generated Dynamically */}
                <Card bodyClass="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h6 className="capitalize">
                            {activeCategoryData.summaryTitle}
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
                            ]}
                        />
                    </div>

                    <div>
                        {/* Summary Bars */}
                        <div className="lg:flex gap-2 justify-between mt-4">
                            <div className="lg:pl-4 flex items-center gap-2 w-full overflow-x-auto">
                                {activeCategoryData.bars.map((barProps) => (
                                    <Bar
                                        key={barProps.field}
                                        {...barProps}
                                        className={`${barProps.className} dark:opacity-70`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Leaderboard Table */}
                        <div className="mt-8 block gap-2">
                            <div className="flex justify-between items-center mb-6">
                                <h6>
                                    {activeCategoryData.leaderboardTitle}
                                </h6>
                            </div>
                            <ActiveComponent isDashboard={true} />
                        </div>
                    </div>
                </Card>
            </section>
        </Card>
    )
}

export default Overview