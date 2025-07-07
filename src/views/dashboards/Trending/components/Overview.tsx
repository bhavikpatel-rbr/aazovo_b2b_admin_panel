import { useState, useEffect, useRef, ReactNode, FC } from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import { NumericFormat } from 'react-number-format'
import classNames from 'classnames'
import { useThemeStore } from '@/store/themeStore'
import {
    TbShoppingBagCheck,
    TbEye,
    TbProgressCheck,
    TbWorld, // Added for Company
} from 'react-icons/tb'
import { MdOutlineBusinessCenter } from 'react-icons/md'

// Child-view components
import Opportunities from '@/views/sales-Leads/Opportunities'
import Leads from '@/views/sales-Leads/Lead'
import TaskList from '@/views/task-management/Task-List/TaskList'
import WallListing from '@/views/sales-Leads/Wall-Listing'
import AccountDocument from '@/views/Account-Documents'

import type { StatisticCategory } from '../types'

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

const Bar = ({ percent, className, field, color }: BarProps) => {
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

// --- Central Configuration Object ---

const categoryConfig = {
    Opportunity: {
        title: 'Opportunity',
        value: '12',
        icon: <MdOutlineBusinessCenter className="h-5" />,
        colorClass: 'bg-red-100',
        activeBgColor: 'bg-red-200',
        iconBg: 'bg-red-400',
        summaryTitle: 'Opportunity summary',
        leaderboardTitle: 'Opportunity Leaderboard',
        Component: Opportunities,
        bars: [
            { field: 'Total', percent: 20, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
            { field: 'Active', percent: 20, color: 'text-[#28a745]', className: 'bg-[#28a745]' },
            { field: 'Inactive', percent: 28, color: 'text-[#6c757d]', className: 'bg-[#6c757d]' },
            { field: 'Converted', percent: 32, color: 'text-[#ffc107]', className: 'bg-[#ffc107]' },
            { field: 'Lost', percent: 20, color: 'text-[#e74c3c]', className: 'bg-[#e74c3c]' },
            { field: 'Dropped', percent: 20, color: 'text-[#2ecc71]', className: 'bg-[#2ecc71]' },
            { field: 'Offers', percent: 20, color: 'text-[#007bff]', className: 'bg-[#007bff]' },
            { field: 'Demands', percent: 20, color: 'text-[#fd7e14]', className: 'bg-[#fd7e14]' },
            { field: 'Avg Conversion', percent: 20, color: 'text-[#20c997]', className: 'bg-[#20c997]' },
            { field: 'Avg Score', percent: 20, color: 'text-gray-500', className: 'bg-gray-500' },
        ],
    },
    Leads: {
        title: 'Leads',
        value: '12',
        icon: <TbShoppingBagCheck className="h-5" />,
        colorClass: 'bg-green-100',
        activeBgColor: 'bg-green-200',
        iconBg: 'bg-green-400',
        summaryTitle: 'Leads summary',
        leaderboardTitle: 'Leads Leaderboard',
        Component: Leads,
        bars: [
            { field: 'Total', percent: 20, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
            { field: 'Recently', percent: 20, color: 'text-[#2ecc71]', className: 'bg-[#2ecc71]' },
            { field: 'Completed', percent: 20, color: 'text-[#e74c3c]', className: 'bg-[#e74c3c]' },
            { field: 'Cancelled', percent: 20, color: 'text-[#28a745]', className: 'bg-[#28a745]' },
            { field: 'In-Progress', percent: 28, color: 'text-[#6c757d]', className: 'bg-[#6c757d]' },
            { field: 'Converted', percent: 32, color: 'text-[#ffc107]', className: 'bg-[#ffc107]' },
            { field: 'Follow-ups', percent: 20, color: 'text-[#fd7e14]', className: 'bg-[#fd7e14]' },
            { field: 'Top Products', percent: 20, color: 'text-[#007bff]', className: 'bg-[#007bff]' },
            { field: 'Top Category', percent: 20, color: 'text-gray-500', className: 'bg-gray-500' },
            { field: 'Top Brands', percent: 20, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
        ],
    },
    Tasks: {
        title: 'Tasks',
        value: '23',
        icon: <TbProgressCheck className="h-5" />,
        colorClass: 'bg-pink-100',
        activeBgColor: 'bg-pink-200',
        iconBg: 'bg-pink-400',
        summaryTitle: 'Tasks summary',
        leaderboardTitle: 'Tasks Leaderboard',
        Component: TaskList,
        bars: [
            { field: 'Total', percent: 20, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
            { field: 'Verified', percent: 20, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
            { field: 'Active', percent: 20, color: 'text-[#2ecc71]', className: 'bg-[#2ecc71]' },
            { field: 'Inactive', percent: 20, color: 'text-[#e74c3c]', className: 'bg-[#e74c3c]' },
            { field: 'Pending', percent: 32, color: 'text-[#ffc107]', className: 'bg-[#ffc107]' },
            { field: 'Blocked', percent: 20, color: 'text-[#fd7e14]', className: 'bg-[#fd7e14]' },
            { field: 'Category', percent: 20, color: 'text-[#007bff]', className: 'bg-[#007bff]' },
            { field: 'Type', percent: 20, color: 'text-[#28a745]', className: 'bg-[#28a745]' },
            { field: 'Recent', percent: 28, color: 'text-[#6c757d]', className: 'bg-[#6c757d]' },
            { field: 'International', percent: 20, color: 'text-[#007bff]', className: 'bg-[#007bff]' },
            { field: 'National', percent: 20, color: 'text-[#007bff]', className: 'bg-[#007bff]' },
        ],
    },
    WallListing: {
        title: 'Wall Listing',
        value: '12',
        icon: <TbEye className="h-5" />,
        colorClass: 'bg-orange-100',
        activeBgColor: 'bg-orange-200',
        iconBg: 'bg-orange-400',
        summaryTitle: 'Wall Listing summary',
        leaderboardTitle: 'Wall Listing Leaderboard',
        Component: WallListing,
        bars: [
            { field: 'Total', percent: 20, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
            { field: 'Active', percent: 20, color: 'text-[#2ecc71]', className: 'bg-[#2ecc71]' },
            { field: 'Inactive', percent: 20, color: 'text-[#e74c3c]', className: 'bg-[#e74c3c]' },
            { field: 'On Leave', percent: 32, color: 'text-[#ffc107]', className: 'bg-[#ffc107]' },
            { field: 'Unapproved', percent: 20, color: 'text-[#fd7e14]', className: 'bg-[#fd7e14]' },
            { field: 'New Joinee', percent: 20, color: 'text-[#007bff]', className: 'bg-[#007bff]' },
            { field: 'Resigned', percent: 20, color: 'text-[#28a745]', className: 'bg-[#28a745]' },
            { field: 'Departments', percent: 28, color: 'text-[#6c757d]', className: 'bg-[#6c757d]' },
            { field: 'Task', percent: 20, color: 'text-[#007bff]', className: 'bg-[#007bff]' },
            { field: 'Performance', percent: 20, color: 'text-gray-500', className: 'bg-gray-500' },
        ],
    },
    Company: {
        title: 'Account Document',
        value: '12',
        icon: <TbWorld className="h-5" />, // New icon
        colorClass: 'bg-blue-100', // New colors
        activeBgColor: 'bg-blue-200',
        iconBg: 'bg-blue-400',
        summaryTitle: 'Account Document Summary',
        leaderboardTitle: 'Account Document Leaderboard',
        Component: AccountDocument,
        bars: [ // More relevant summary bars for documents/company
            { field: 'Total', percent: 20, color: 'text-[#6610f2]', className: 'bg-[#6610f2]' },
            { field: 'Verified', percent: 20, color: 'text-[#2ecc71]', className: 'bg-[#2ecc71]' },
            { field: 'Pending', percent: 20, color: 'text-[#ffc107]', className: 'bg-[#ffc107]' },
            { field: 'Rejected', percent: 32, color: 'text-[#e74c3c]', className: 'bg-[#e74c3c]' },
            { field: 'Contracts', percent: 20, color: 'text-[#007bff]', className: 'bg-[#007bff]' },
            { field: 'Invoices', percent: 20, color: 'text-[#fd7e14]', className: 'bg-[#fd7e14]' },
            { field: 'Reports', percent: 20, color: 'text-[#28a745]', className: 'bg-[#28a745]' },
            { field: 'Tier 1', percent: 28, color: 'text-[#6c757d]', className: 'bg-[#6c757d]' },
            { field: 'Tier 2', percent: 20, color: 'text-gray-500', className: 'bg-gray-500' },
        ],
    },
}

// --- Main Component ---

const Overview = () => {
    const [selectedCategory, setSelectedCategory] =
        useState<StatisticCategory>('Opportunity')

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

    const activeCategoryData = categoryConfig[selectedCategory]
    const { Component: ActiveComponent } = activeCategoryData

    return (
        <Card>
            <div className="flex items-center justify-between">
                <h4>Overview</h4>
                {/* Filters can be re-added here if needed */}
            </div>

            <section className="block gap-4 w-full">
                {/* Statistic Cards - Generated Dynamically */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 rounded-2xl py-3 mt-4">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                        <StatisticCard
                            key={key}
                            label={key as StatisticCategory}
                            title={config.title}
                            value={
                                <NumericFormat
                                    displayType="text"
                                    value={config.value}
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
                    ))}
                </div>

                {/* Details Section - Generated Dynamically */}
                <Card bodyClass="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h6 className="capitalize">{activeCategoryData.summaryTitle}</h6>
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
                            <div className="lg:pl-4 flex items-center gap-1 w-full">
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
                                <h6>{activeCategoryData.leaderboardTitle}</h6>
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