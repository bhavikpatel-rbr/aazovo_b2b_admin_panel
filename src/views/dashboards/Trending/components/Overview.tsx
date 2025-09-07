import type { TableQueries } from '@/@types/common'
import { DataTable, DebouceInput } from '@/components/shared'
import { Avatar, Table, Tag } from '@/components/ui'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import THead from '@/components/ui/Table/THead'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import Tr from '@/components/ui/Table/Tr'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { getDashboardLeadsAction, getDashboardOpportunityAction, getDashboardTaskAction, getDashboardWallAction } from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'
import classNames from '@/utils/classNames'
import dayjs from 'dayjs'
import cloneDeep from 'lodash/cloneDeep'
import {
    Fragment,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { IoChevronDown, IoChevronForward } from 'react-icons/io5'
import {
    TbArrowsRandom,
    TbEye,
    TbProgressCheck,
    TbSearch,
    TbShoppingBagCheck,
    TbUserCircle,
    TbWorld,
} from 'react-icons/tb'
import { useSelector } from 'react-redux'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Cell
} from 'recharts'


// --- START: SKELETON COMPONENTS (Glassmorphism-themed) ---
const Skeleton = ({ className }: { className?: string }) => {
    return (
        <div
            className={classNames(
                'animate-pulse bg-white/40 rounded-md',
                className
            )}
        />
    )
}

const TableSkeleton = ({
    columns,
    skeletonRow,
    rowCount = 5,
}: {
    columns: any[]
    skeletonRow: ReactNode
    rowCount?: number
}) => {
    return (
        <Table>
            <THead className="bg-white/30">
                <Tr>
                    {columns.map((col) => (
                        <Th
                            key={col.id || col.header}
                            style={{ width: col.size }}
                        >
                            {col.header}
                        </Th>
                    ))}
                </Tr>
            </THead>
            <tbody>
                {Array.from({ length: rowCount }).map((_, i) => (
                    <Tr key={i}>{skeletonRow}</Tr>
                ))}
            </tbody>
        </Table>
    )
}

const SalespersonSkeletonRow = () => (
    <>
        <Tr className="bg-white/20">
            <Td colSpan={6}>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-44" />
                </div>
            </Td>
        </Tr>
        <Tr>
            <Td className="pl-12"><Skeleton className="h-4 w-12" /></Td>
            <Td><Skeleton className="h-4 w-32" /></Td>
            <Td><Skeleton className="h-4 w-28" /></Td>
            <Td><Skeleton className="h-4 w-24" /></Td>
            <Td><Skeleton className="h-4 w-24" /></Td>
            <Td><Skeleton className="h-4 w-28" /></Td>
        </Tr>
    </>
)

const TaskRowSkeleton = () => (
    <>
        <Td><div className="flex flex-col gap-1.5 pl-12"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-24" /></div></Td>
        <Td><div className="flex -space-x-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-8 w-8 rounded-full" /></div></Td>
        <Td><Skeleton className="h-5 w-20" /></Td>
        <Td><Skeleton className="h-4 w-28" /></Td>
        <Td><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-24" /></div></Td>
    </>
);

const TaskTableSkeleton = () => (
    <Table>
        <THead className="bg-white/30">
            <Tr>
                <Th>Task / Module</Th><Th>Assigned To</Th><Th>Priority</Th><Th>Due Date</Th><Th>Created By</Th>
            </Tr>
        </THead>
        <tbody>
            {[1, 2].map(i => (
                <Fragment key={i}>
                    <Tr className="bg-white/20"><Td colSpan={5}><div className="flex items-center justify-between"><Skeleton className="h-5 w-32" /><Skeleton className="h-5 w-24" /></div></Td></Tr>
                    <Tr><TaskRowSkeleton /></Tr>
                    <Tr><TaskRowSkeleton /></Tr>
                </Fragment>
            ))}
        </tbody>
    </Table>
);

const ProductOpportunitySkeleton = () => (
    <Table>
        <THead className="bg-white/30">
            <Tr>
                <Th>Product</Th>
                <Th>Buy Leads</Th>
                <Th>Sell Leads</Th>
                <Th>Match Score</Th>
            </Tr>
        </THead>
        <tbody>
            {Array.from({ length: 3 }).map((_, i) => (
                <Tr key={i}>
                    <Td><div className="flex items-center gap-2"><Skeleton className="h-4 w-4" /><Skeleton className="h-5 w-48" /></div></Td>
                    <Td><Skeleton className="h-6 w-20" /></Td>
                    <Td><Skeleton className="h-6 w-20" /></Td>
                    <Td><Skeleton className="h-6 w-32" /></Td>
                </Tr>
            ))}
        </tbody>
    </Table>
);

const WallListingSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <GlassCard>
                    <Skeleton className="h-5 w-48 mb-4" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center mb-2 pb-2 border-b border-white/20 last:border-b-0">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    ))}
                </GlassCard>
            </div>
            <div>
                <GlassCard>
                    <Skeleton className="h-5 w-40 mb-4" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center mb-2 pb-2 border-b border-white/20 last:border-b-0">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    ))}
                </GlassCard>
            </div>
        </div>
        <GlassCard>
            <Skeleton className="h-5 w-48 mb-4" />
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-64 w-full" />
        </GlassCard>
    </div>
);
// --- END: SKELETON COMPONENTS ---

// Wrapper for the glass effect on cards
const GlassCard = ({ children, className }: { children: ReactNode, className?: string }) => (
    <div className={classNames("bg-white/60 dark:bg-black/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30 dark:border-white/10 shadow-lg", className)}>
        {children}
    </div>
);

type StatisticCategory =
    | 'ProductOpportunities'
    | 'Leads'
    | 'Tasks'
    | 'WallListing'
    | 'Company'

// --- UI Sub-components ---
type StatisticCardProps = {
    title: string
    value: number | string
    icon: ReactNode
    label: StatisticCategory
    active: boolean
    onClick: (label: StatisticCategory) => void
    themeColor: string
}

const StatisticCard = (props: StatisticCardProps) => {
    const { title, value, label, icon, active, onClick, themeColor } = props

    const cardState = active
        ? `bg-white/80 dark:bg-black/30 border-cyan-400 dark:border-cyan-400 shadow-xl`
        : 'bg-white/50 dark:bg-black/10 border-white/30 dark:border-white/10 hover:bg-white/70 dark:hover:bg-black/20 hover:shadow-xl'
    const iconState = active
        ? `text-white bg-gradient-to-br from-cyan-500 to-blue-600`
        : 'bg-white/70 dark:bg-white/10 text-slate-600 dark:text-slate-300'
    const textState = active ? `text-cyan-600 dark:text-cyan-300` : 'text-slate-800 dark:text-slate-100'

    return (
        <button
            className={classNames(
                'p-4 rounded-2xl cursor-pointer text-left w-full border transition-all duration-300 backdrop-blur-md',
                cardState
            )}
            onClick={() => onClick(label)}
        >
            <div className="flex justify-between items-center relative">
                <div className="flex items-center gap-4">
                    <div
                        className={classNames(
                            'flex items-center justify-center p-3 rounded-xl text-2xl transition-all duration-300',
                            iconState
                        )}
                    >
                        {icon}
                    </div>
                    <div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {title}
                        </div>
                        <h4 className={classNames('font-bold text-2xl transition-colors duration-200', textState)}>
                            {value}
                        </h4>
                    </div>
                </div>
            </div>
        </button>
    )
}

type SummaryChartProps = {
    data: { name: string; value: number; fill: string }[]
}

const CategorySummaryChart = ({ data }: SummaryChartProps) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-[250px] flex items-center justify-center">
                <div className='text-center'>
                    <p className='text-lg font-semibold text-slate-600 dark:text-slate-300'>No Summary Data</p>
                    <p className='text-sm text-slate-400'>There is no data to display in the chart.</p>
                </div>
            </div>
        )
    }
    return (
        <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        stroke="rgba(100, 116, 139, 0.2)" 
                    />
                    <XAxis 
                        dataKey="name" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        stroke="#475569"
                    />
                    <YAxis 
                        allowDecimals={false} 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        stroke="#475569"
                    />
                    <RechartsTooltip
                        cursor={{ fill: 'rgba(255, 255, 255, 0.3)' }}
                        contentStyle={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(255, 255, 255, 0.5)',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ color: '#334155', fontWeight: '600' }}
                    />
                    <Bar dataKey="value" barSize={35} radius={[6, 6, 0, 0]}>
                       {data.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}


// Custom Glassmorphism Input Component
const GlassDebounceInput = (props: any) => (
    <DebouceInput 
        {...props}
        className={classNames(
            "bg-white/40 backdrop-blur-md border border-white/30 rounded-lg focus:bg-white/70 focus:border-cyan-500 transition-all placeholder:text-slate-500",
            props.className
        )}
    />
)

// --- START: PRODUCT OPPORTUNITIES COMPONENTS ---
const ScoreBar = ({ score }: { score: number }) => {
    const getScoreColor = (s: number) => {
        if (s > 75) return 'bg-emerald-500';
        if (s > 40) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="w-32 flex flex-col items-start">
             <span className={`font-bold text-xs mb-1.5 text-slate-600`}>{score.toFixed(1)}% Match</span>
            <div className="w-full bg-white/50 rounded-full h-2.5">
                <div className={`${getScoreColor(score)} h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
            </div>
        </div>
    );
};

const EnquirySubTable = ({ title, enquiries }: { title: string, enquiries: any[] }) => {
    if (!enquiries || enquiries.length === 0) {
        return (
            <div className='p-4 bg-white/20 rounded-xl'>
                <h6 className="mb-2 text-sm font-semibold text-slate-700">{title}</h6>
                <div className="text-center text-slate-400 text-sm py-4">No recent enquiries.</div>
            </div>
        )
    }
    return (
        <div className='p-4 bg-white/20 rounded-xl'>
            <h6 className="mb-2 text-sm font-semibold text-slate-700">{title}</h6>
            <div className="overflow-x-auto">
                <Table className="min-w-full text-xs" compact>
                    <THead className="bg-transparent">
                        <Tr className="border-b border-white/30">
                            <Th>Customer</Th>
                            <Th>Qty</Th>
                            <Th>Date</Th>
                        </Tr>
                    </THead>
                    <tbody>
                        {enquiries.map(enquiry => (
                            <Tr key={enquiry.id}>
                                <Td className="py-2 px-3">
                                    <div className="font-semibold text-slate-700">{enquiry.customer_name}</div>
                                    <div className="text-slate-500">{enquiry.company_temp}</div>
                                </Td>
                                <Td className="py-2 px-3 font-semibold text-slate-700">{enquiry.qty}</Td>
                                <Td className="py-2 px-3 whitespace-nowrap text-slate-600">{dayjs(enquiry.created_at).format('DD MMM')}</Td>
                            </Tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    )
}

const ProductOpportunitiesTable = ({ data, onSearch }: { data: any[], onSearch: (query: string) => void }) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const toggleRow = (id: number) => { const newExpandedRows = new Set(expandedRows); if (newExpandedRows.has(id)) { newExpandedRows.delete(id); } else { newExpandedRows.add(id); } setExpandedRows(newExpandedRows); };

    if (!data || data.length === 0) {
        return <div className="text-center p-8 border-2 border-dashed border-white/30 rounded-lg"><p className="text-slate-500">No product opportunities found.</p></div>;
    }

    return (
        <div>
            <GlassDebounceInput className="w-full md:w-1/3 mb-4" placeholder="Search by product name..." prefix={<TbSearch className="text-lg text-slate-500" />} onChange={(e) => onSearch(e.target.value)} />
            <div className="rounded-lg overflow-hidden border border-white/30">
                <Table>
                    <THead className="bg-white/30">
                        <Tr><Th>Product</Th><Th>Buy Leads</Th><Th>Sell Leads</Th><Th>Match Score</Th></Tr>
                    </THead>
                    <tbody>
                        {data.map((product) => (
                            <Fragment key={product.product_id}>
                                <Tr className="cursor-pointer hover:bg-white/40 transition-colors" onClick={() => toggleRow(product.product_id)}>
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg text-slate-400">{expandedRows.has(product.product_id) ? <IoChevronDown /> : <IoChevronForward />}</span>
                                            <span className="font-semibold text-slate-700">{product.product_name}</span>
                                        </div>
                                    </Td>
                                    <Td><Tag className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">{product.buy_count}</Tag></Td>
                                    <Td><Tag className="bg-amber-500/10 text-amber-700 border border-amber-500/20">{product.sell_count}</Tag></Td>
                                    <Td><ScoreBar score={product.score} /></Td>
                                </Tr>
                                {expandedRows.has(product.product_id) && (
                                    <Tr>
                                        <Td colSpan={4} className="p-0 !border-0">
                                            <div className="p-4 bg-white/30 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <EnquirySubTable title={`Top 10 Buyers (${product.buy.length} of ${product.buy_count})`} enquiries={product.buy} />
                                                <EnquirySubTable title={`Top 10 Sellers (${product.sell.length} of ${product.sell_count})`} enquiries={product.sell} />
                                            </div>
                                        </Td>
                                    </Tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    )
};
// --- END: PRODUCT OPPORTUNITIES COMPONENTS ---

// --- START: LEADS TABLE COMPONENT ---
type Lead = { lead_id: number; lead_intent: string | null; status: string; product_name: string; buyer: string | null; supplier: string | null; created_at: string }
type SalespersonData = { sales_person_id: number; sales_person_name: string; lead_count: number; latest_10_leads: Lead[] }

// Glassmorphism-friendly Tag colors
const statusColorMapping: { [key: string]: string } = {
    'New': 'bg-blue-500/10 text-blue-600 border border-blue-500/20', 'Assigned': 'bg-amber-500/10 text-amber-600 border border-amber-500/20', 'Approved': 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20',
    'Completed': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20', 'Deal Done': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20', 'Rejected': 'bg-red-500/10 text-red-600 border border-red-500/20',
    'Cancelled': 'bg-rose-500/10 text-rose-600 border border-rose-500/20', 'Approval Waiting': 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20', 'Accepted': 'bg-green-500/10 text-green-600 border border-green-500/20',
    'Active': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20', 'Pending': 'bg-amber-500/10 text-amber-600 border border-amber-500/20', 'default': 'bg-slate-500/10 text-slate-600 border border-slate-500/20',
}

const LeadsBySalespersonTable = ({ data }: { data: SalespersonData[] }) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
    const toggleRow = (id: number) => { const newExpandedRows = new Set(expandedRows); if (newExpandedRows.has(id)) { newExpandedRows.delete(id) } else { newExpandedRows.add(id) } setExpandedRows(newExpandedRows) }
    if (!data || data.length === 0) { return <div className="text-center p-8 border-2 border-dashed border-white/30 rounded-lg"><p className="text-slate-500">No leads found.</p></div> }
    
    return (
        <div className="rounded-lg overflow-hidden border border-white/30">
            <Table className="w-full">
                <THead className="bg-white/30"><Tr><Th>Salesperson / ID</Th><Th>Product</Th><Th>Status</Th><Th>Buyer</Th><Th>Supplier</Th><Th>Created At</Th></Tr></THead>
                <tbody className="align-top">
                    {data.map((salesperson) => (
                        <Fragment key={salesperson.sales_person_id}>
                            <Tr className="cursor-pointer bg-white/20 hover:bg-white/30 transition-colors border-b border-white/30" onClick={() => toggleRow(salesperson.sales_person_id)}>
                                <Td colSpan={6} className="py-3">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg text-slate-400">{expandedRows.has(salesperson.sales_person_id) ? <IoChevronDown /> : <IoChevronForward />}</span>
                                            <Avatar size="sm" shape="circle" icon={<TbUserCircle />} />
                                            <span className="font-semibold text-slate-700">{salesperson.sales_person_name}</span>
                                        </div>
                                        <Tag className="bg-slate-500/10 text-slate-600 border border-slate-500/20">{salesperson.lead_count} Lead{salesperson.lead_count !== 1 ? 's' : ''}</Tag>
                                    </div>
                                </Td>
                            </Tr>
                            {expandedRows.has(salesperson.sales_person_id) && salesperson.latest_10_leads.map((lead) => (
                                <Tr key={lead.lead_id} className="hover:bg-white/20 transition-colors border-b border-white/20 last:border-b-0">
                                    <Td className="pl-14"><span className="font-mono text-sm text-slate-600">#{lead.lead_id}</span></Td>
                                    <Td><span className="font-medium text-slate-700">{lead.product_name}</span></Td>
                                    <Td><Tag className={statusColorMapping[lead.status] || statusColorMapping.default}>{lead.status}</Tag></Td>
                                    <Td className="text-slate-600">{lead.buyer || <em className="text-slate-400">N/A</em>}</Td>
                                    <Td className="text-slate-600">{lead.supplier || <em className="text-slate-400">N/A</em>}</Td>
                                    <Td><div className="text-sm whitespace-nowrap text-slate-600"><div>{dayjs(lead.created_at).format('DD MMM YYYY')}</div><div className="text-xs text-slate-500">{dayjs(lead.created_at).format('hh:mm A')}</div></div></Td>
                                </Tr>
                            ))}
                        </Fragment>
                    ))}
                </tbody>
            </Table>
        </div>
    )
}
// --- END: LEADS TABLE COMPONENT ---

// --- START OF TASKS BY STATUS TABLE COMPONENT ---
const formatStatusName = (status: string) => {
    if (!status) return 'Unknown'
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()).trim();
};

const taskStatusColorMapping: { [key: string]: string } = {
    'not_started': 'bg-slate-500/10 text-slate-600 border border-slate-500/20', 'pending': 'bg-amber-500/10 text-amber-600 border border-amber-500/20', 'in_progress': 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
    'on_hold': 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20', 'completed': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20', 'cancelled': 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
    'review': 'bg-purple-500/10 text-purple-600 border border-purple-500/20',
};

const TasksByStatusTable = ({ data }: { data: any }) => {
    const [expandedRows, setExpandedRows] = useState(new Set(['in_progress', 'not_started']))
    const [searchQuery, setSearchQuery] = useState('')

    if (!data || !data.status_wise_tasks) {
        return <div className="text-center p-8 border-2 border-dashed border-white/30 rounded-lg"><p className="text-slate-500">No task data available.</p></div>
    }

    const { status_wise_tasks, counts } = data
    const toggleRow = (statusKey: string) => { const newExpandedRows = new Set(expandedRows); if (newExpandedRows.has(statusKey)) { newExpandedRows.delete(statusKey) } else { newExpandedRows.add(statusKey) } setExpandedRows(newExpandedRows) }

    const statusOrder = ['in_progress', 'pending', 'not_started', 'on_hold', 'review', 'completed', 'cancelled'];
    const filteredTasksByStatus = useMemo(() => {
        if (!searchQuery) return status_wise_tasks;
        const lowercasedQuery = searchQuery.toLowerCase()
        const filtered: { [key: string]: any[] } = {}
        for (const status in status_wise_tasks) { filtered[status] = status_wise_tasks[status].filter((task: any) => task.task_title.toLowerCase().includes(lowercasedQuery) || task.assign_to_users.some((user: any) => user.name.toLowerCase().includes(lowercasedQuery))); }
        return filtered
    }, [status_wise_tasks, searchQuery])
    const statusKeysToRender = statusOrder.filter(key => filteredTasksByStatus[key] && filteredTasksByStatus[key].length > 0)

    return (
        <div>
            <GlassDebounceInput className="w-full md:w-1/3 mb-4" placeholder="Search Tasks by title or assignee..." prefix={<TbSearch className="text-lg text-slate-500" />} onChange={(e) => setSearchQuery(e.target.value)} />
            <div className="rounded-lg overflow-hidden border border-white/30">
                <Table>
                    <THead className="bg-white/30"><Tr><Th style={{ width: '40%' }}>Task / Module</Th><Th style={{ width: '20%' }}>Assigned To</Th><Th style={{ width: '10%' }}>Priority</Th><Th style={{ width: '15%' }}>Due Date</Th><Th style={{ width: '15%' }}>Created By</Th></Tr></THead>
                    <tbody className="align-top">
                        {statusKeysToRender.length > 0 ? statusKeysToRender.map((statusKey) => {
                            const tasks = filteredTasksByStatus[statusKey].slice(0, 10);
                            const count = filteredTasksByStatus[statusKey].length;
                            return (
                                <Fragment key={statusKey}>
                                    <Tr className="cursor-pointer bg-white/20 hover:bg-white/30 border-y border-white/30" onClick={() => toggleRow(statusKey)}>
                                        <Td colSpan={5} className="py-3">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg text-slate-400">{expandedRows.has(statusKey) ? <IoChevronDown /> : <IoChevronForward />}</span>
                                                    <span className="font-semibold text-slate-700">{formatStatusName(statusKey)}</span>
                                                </div>
                                                <Tag className={taskStatusColorMapping[statusKey]}>{count} Task{count !== 1 ? 's' : ''}</Tag>
                                            </div>
                                        </Td>
                                    </Tr>
                                    {expandedRows.has(statusKey) && tasks.map((task: any) => (
                                        <Tr key={task.id} className="hover:bg-white/20">
                                            <Td className="pl-14"><div className="font-medium text-slate-700">{task.task_title}</div><div className="text-xs text-slate-500">{task.module_name}</div></Td>
                                            <Td><div className="flex -space-x-2 items-center">{task.assign_to_users.length > 0 ? task.assign_to_users.map((user: any) => (<Avatar key={user.id} src={user.profile_pic_path} size="sm" shape="circle" title={user.name} />)) : <span className="text-slate-400 italic text-sm">Unassigned</span>}</div></Td>
                                            <Td><Tag className="bg-slate-500/10 text-slate-600">{task.priority}</Tag></Td>
                                            <Td><span className="text-sm text-slate-600">{task.due_date ? dayjs(task.due_date).format('DD MMM YYYY') : 'N/A'}</span></Td>
                                            <Td><div className="flex items-center gap-2"><Avatar src={task.created_by_user.profile_pic_path} size="sm" shape="circle" /><span className="text-sm text-slate-600">{task.created_by_user.name}</span></div></Td>
                                        </Tr>
                                    ))}
                                </Fragment>
                            )
                        }) : (<Tr><Td colSpan={5} className="text-center py-10 text-slate-500">No tasks found for your search query.</Td></Tr>)}
                    </tbody>
                </Table>
                <div className="p-4 bg-white/20 border-t border-white/30 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><div className="text-sm text-slate-500">Unassigned</div><div className="font-bold text-lg text-slate-700">{counts.unassigned || 0}</div></div>
                    <div><div className="text-sm text-slate-500">No Status</div><div className="font-bold text-lg text-red-500">{counts.no_status || 0}</div></div>
                    <div><div className="text-sm text-slate-500">New Today</div><div className="font-bold text-lg text-slate-700">{counts.today || 0}</div></div>
                    <div><div className="text-sm text-slate-500">Completed Total</div><div className="font-bold text-lg text-emerald-500">{counts.completed || 0}</div></div>
                </div>
            </div>
        </div>
    );
};
// --- END OF TASKS BY STATUS TABLE COMPONENT ---

// --- START: Wall Listing Component ---
const WallSummaryCard = ({ title, data, dataKey, nameKey }: { title: string, data: any[], dataKey: string, nameKey: string }) => {
    if (!data || data.length === 0) {
        return <GlassCard><h6 className="font-semibold text-slate-700 mb-4">{title}</h6><div className="text-center p-4 text-slate-400">No data available.</div></GlassCard>
    }
    return (
        <GlassCard>
            <h6 className="font-semibold text-slate-700 mb-4">{title}</h6>
            <div className="max-h-80 overflow-y-auto">
                {data.map((item, index) => (
                    <div key={index} className="flex justify-between items-center mb-2 pb-2 border-b border-white/20 last:border-b-0">
                        <span className="text-sm font-medium text-slate-600">{item[nameKey]}</span>
                        <Tag className="bg-slate-500/10 text-slate-600 border border-slate-500/20">{(item[dataKey] || 0).toLocaleString()}</Tag>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
};

const WallListingDetails = ({ data }: { data: any }) => {
    const { latest100 = [] } = data;
    const [queries, setQueries] = useState<TableQueries>({ total: latest100.length, pageIndex: 1, pageSize: 10, query: '', sort: { order: '', key: '' } });
    const handlePaginationChange = (page: number) => { const newTable = cloneDeep(queries); newTable.pageIndex = page; setQueries(newTable); };
    const handleSelectChange = (value: number) => { const newTable = cloneDeep(queries); newTable.pageSize = value; newTable.pageIndex = 1; setQueries(newTable); };
    const handleInputChange = (val: string) => { const newTable = cloneDeep(queries); newTable.query = val; newTable.pageIndex = 1; setQueries(newTable); }
    const { paginatedData, total } = useMemo(() => {
        const { pageIndex, pageSize, query } = queries;
        const lowercasedQuery = query.toLowerCase();
        let filteredData = latest100;
        if (lowercasedQuery) { filteredData = filteredData.filter((item: any) => item?.product?.name?.toLowerCase().includes(lowercasedQuery) || item?.customer?.name?.toLowerCase().includes(lowercasedQuery) || item?.customer?.country?.name?.toLowerCase().includes(lowercasedQuery)); }
        const start = (pageIndex - 1) * pageSize;
        const end = start + pageSize;
        return { paginatedData: filteredData.slice(start, end), total: filteredData.length };
    }, [queries, latest100]);

    const columns = useMemo(() => [
        { header: 'Product', accessorKey: 'product.name', cell: (props: any) => <span className="font-semibold text-slate-700">{props.row.original.product?.name || 'N/A'}</span> },
        { header: 'Customer', accessorKey: 'customer.name', cell: (props: any) => <span className="text-slate-600">{props.row.original.customer?.name || 'N/A'}</span> },
        { header: 'Country', accessorKey: 'customer.country.name', cell: (props: any) => <span className="text-slate-600">{props.row.original.customer?.country?.name || 'N/A'}</span> },
        { header: 'Type', accessorKey: 'want_to', cell: (props: any) => <Tag className={props.row.original.want_to === 'Buy' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}>{props.row.original.want_to}</Tag> },
        { header: 'Qty', accessorKey: 'qty', cell: (props: any) => <span className="text-slate-600">{props.row.original.qty}</span> },
        { header: 'Status', accessorKey: 'status', cell: (props: any) => <Tag className={statusColorMapping[props.row.original.status] || statusColorMapping.default}>{props.row.original.status}</Tag> },
        { header: 'Date', accessorKey: 'created_at', cell: (props: any) => <span className="text-slate-600">{dayjs(props.row.original.created_at).format('DD MMM YYYY')}</span> },
    ], []);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><WallSummaryCard title="Geographic Insights (By Country)" data={data.countryWise} nameKey="country_name" dataKey="total" /></div>
                <div><WallSummaryCard title="Product Insights (By Category)" data={data.categoryWise} nameKey="category_name" dataKey="total" /></div>
            </div>
            <GlassCard>
                <h5 className="mb-4 text-slate-700">Latest 100 Enquiries</h5>
                <GlassDebounceInput className="w-full md:w-1/3 mb-4" placeholder="Search by product, customer, country..." prefix={<TbSearch className="text-lg text-slate-500" />} onChange={(e) => handleInputChange(e.target.value)} />
                <DataTable
                    columns={columns}
                    data={paginatedData}
                    skeletonAvatarColumns={[0]}
                    skeletonAvatarProps={{ className: 'rounded-md' }}
                    loading={!latest100}
                    pagingData={{ total: total, pageIndex: queries.pageIndex, pageSize: queries.pageSize }}
                    onPaginationChange={handlePaginationChange}
                    onSelectChange={handleSelectChange}
                />
            </GlassCard>
        </div>
    );
};
// --- END: Wall Listing Component ---

const CHART_COLORS = ['#06b6d4', '#14b8a6', '#3b82f6', '#6366f1', '#22d3ee', '#60a5fa'];

// --- MAIN COMPONENT ---
const Overview = () => {
    const [selectedCategory, setSelectedCategory] = useState<StatisticCategory>('ProductOpportunities')
    const dispatch = useAppDispatch()
    const { DashboardLeadsData, DashboardTaskData, loading, DashboardOpportunityData, DashboardWallData } = useSelector(masterSelector)
    const [leadSearchQuery, setLeadSearchQuery] = useState('')
    const [opportunitySearchQuery, setOpportunitySearchQuery] = useState('')

    useEffect(() => {
        dispatch(getDashboardLeadsAction())
        dispatch(getDashboardTaskAction())
        dispatch(getDashboardOpportunityAction())
        dispatch(getDashboardWallAction())
    }, [dispatch])

    const isLoading = loading;

    const handleOpportunitySearch = (query: string) => { setOpportunitySearchQuery(query.toLowerCase()); };
    const filteredOpportunityData = useMemo(() => {
        if (!DashboardOpportunityData?.data) return [];
        if (!opportunitySearchQuery) return DashboardOpportunityData.data;
        return DashboardOpportunityData.data.filter((product: any) => product.product_name.toLowerCase().includes(opportunitySearchQuery));
    }, [DashboardOpportunityData, opportunitySearchQuery]);

    const handleLeadSearch = (query: string) => { setLeadSearchQuery(query); }
    const leadsAPIData = useMemo(() => {
        const rawData = DashboardLeadsData?.data || []
        const totalCount = rawData.reduce((acc: number, curr: SalespersonData) => acc + curr.lead_count, 0)
        const allLeads = rawData.flatMap((sp: SalespersonData) => sp.latest_10_leads)
        const statusCounts = allLeads.reduce((acc: { [key: string]: number }, lead: Lead) => { acc[lead.status] = (acc[lead.status] || 0) + 1; return acc; }, {});
        const summaryData = Object.entries(statusCounts).map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));
        const filteredSalespersonData = rawData.filter((sp: SalespersonData) => sp.sales_person_name.toLowerCase().includes(leadSearchQuery.toLowerCase()) || sp.latest_10_leads.some(l => l.product_name.toLowerCase().includes(leadSearchQuery.toLowerCase()))).map((sp: SalespersonData) => ({ ...sp, latest_10_leads: leadSearchQuery ? sp.latest_10_leads.filter(l => l.product_name.toLowerCase().includes(leadSearchQuery.toLowerCase())) : sp.latest_10_leads }))
        return { totalCount, summaryData, tableData: filteredSalespersonData }
    }, [DashboardLeadsData, leadSearchQuery])

    const categoryDetails = useMemo(() => {
        const taskCounts = DashboardTaskData?.counts || {}
        const opportunityChartData = (DashboardOpportunityData?.data || []).slice(0, 5).map((p: any, i: number) => ({ name: p.product_name.replace('IPHONE', 'IP').substring(0, 15), value: p.score, fill: CHART_COLORS[i % CHART_COLORS.length] }));
        const wallListingChartData = (DashboardWallData?.country_wise || []).slice(0, 5).map((c: any, i: number) => ({ name: c.country_name, value: c.total, fill: CHART_COLORS[i % CHART_COLORS.length] }));

        return {
            ProductOpportunities: { label: 'ProductOpportunities' as StatisticCategory, title: 'Product Opportunities', icon: <TbArrowsRandom />, themeColor: 'purple-500', totalCount: DashboardOpportunityData?.data?.length || 0, summaryData: opportunityChartData, tableData: filteredOpportunityData },
            Leads: { label: 'Leads' as StatisticCategory, title: 'Leads', icon: <TbShoppingBagCheck />, themeColor: 'green-500', totalCount: leadsAPIData.totalCount || 0, summaryData: leadsAPIData.summaryData, tableData: leadsAPIData.tableData },
            Tasks: { label: 'Tasks' as StatisticCategory, title: 'Tasks', icon: <TbProgressCheck />, themeColor: 'pink-500', totalCount: taskCounts.total || 0, summaryData: Object.entries(taskCounts).map(([key, value], i) => ({ name: formatStatusName(key), value, fill: CHART_COLORS[i % CHART_COLORS.length] })).filter(d => ['Not Started', 'Pending', 'In Progress', 'On Hold', 'Completed'].includes(d.name) && d.value > 0), fullData: DashboardTaskData },
            WallListing: { label: 'WallListing' as StatisticCategory, title: 'Wall Enquiries', icon: <TbEye />, themeColor: 'orange-500', totalCount: DashboardWallData?.counts?.total || 0, summaryData: wallListingChartData, wallData: { countryWise: DashboardWallData?.country_wise || [], categoryWise: DashboardWallData?.category_wise || [], latest100: DashboardWallData?.latest_100 || [] } },
            Company: { label: 'Company' as StatisticCategory, title: 'Account Document', icon: <TbWorld />, themeColor: 'blue-500', totalCount: 0, summaryData: [] },
        }
    }, [DashboardTaskData, DashboardOpportunityData, DashboardWallData, leadsAPIData, filteredOpportunityData])

    const currentCategory: any = categoryDetails[selectedCategory]

    return (
        // Main wrapper with gradient background for the glass effect to pop
        <div className="p-4 sm:p-6 bg-gradient-to-br from-cyan-50 to-blue-200 dark:from-slate-900 dark:to-blue-900 min-h-screen">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h3 className='text-3xl font-bold text-slate-800 dark:text-slate-100'>Dashboard Overview</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {Object.values(categoryDetails).map((cat: any) => (
                        <StatisticCard key={cat.label} title={cat.title || cat.label} value={(cat.totalCount || 0).toLocaleString()} icon={cat.icon} label={cat.label} active={selectedCategory === cat.label} onClick={setSelectedCategory} themeColor={cat.themeColor} />
                    ))}
                </div>

                <GlassCard>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h5 className="capitalize text-slate-700 dark:text-slate-200">{currentCategory.title || currentCategory.label} Summary</h5>
                        <Select className="min-w-[160px]" size="sm" defaultValue={{ label: 'All Time', value: 'All' }} options={[{ label: 'All Time', value: 'All' }, { label: 'Today', value: 'Today' }, { label: 'This Week', value: 'Weekly' }, { label: 'This Month', value: 'Monthly' }]} />
                    </div>
                    <CategorySummaryChart data={currentCategory.summaryData} />
                </GlassCard>

                <GlassCard>
                    <div className="mb-4">
                        <h5 className="mb-1 text-slate-700 dark:text-slate-200">{currentCategory.title || currentCategory.label} Details</h5>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {selectedCategory === 'ProductOpportunities' ? "Hot products with both buyers and sellers. Expand a row to see top enquiries." :
                             selectedCategory === 'Tasks' ? "List of all tasks, grouped by current status." :
                             selectedCategory === 'Leads' ? "List of leads grouped by salesperson" :
                             selectedCategory === 'WallListing' ? "Breakdown of wall enquiries by region, category, and recent activity." :
                             `Detailed list of all ${currentCategory.label.toLowerCase()}`}
                        </p>
                    </div>

                    {isLoading ? (
                        selectedCategory === 'ProductOpportunities' ? <ProductOpportunitySkeleton /> :
                        selectedCategory === 'Tasks' ? <TaskTableSkeleton /> :
                        selectedCategory === 'Leads' ? <TableSkeleton columns={[{ header: 'Salesperson' }]} skeletonRow={<SalespersonSkeletonRow />} rowCount={2} /> :
                        selectedCategory === 'WallListing' ? <WallListingSkeleton /> :
                        <Skeleton className="h-64 w-full" />
                    ) : (
                        selectedCategory === 'ProductOpportunities' ? <ProductOpportunitiesTable data={currentCategory.tableData} onSearch={handleOpportunitySearch} /> :
                        selectedCategory === 'Tasks' ? <TasksByStatusTable data={currentCategory.fullData} /> :
                        selectedCategory === 'Leads' ? (
                            <>
                                <GlassDebounceInput className="w-full md:w-1/3 mb-4" placeholder="Search by Salesperson or Product..." prefix={<TbSearch className="text-slate-500" />} onChange={(e) => handleLeadSearch(e.target.value)} />
                                <LeadsBySalespersonTable data={currentCategory.tableData} />
                            </>
                        ) :
                        selectedCategory === 'WallListing' ? <WallListingDetails data={currentCategory.wallData} /> :
                        <div className="text-center p-8 border-2 border-dashed border-white/30 rounded-lg"><p className="text-slate-500">Component for {currentCategory.title || currentCategory.label} is not implemented yet.</p></div>
                    )}
                </GlassCard>
            </div>
        </div>
    )
}

export default Overview