import type { TableQueries } from '@/@types/common'
import { DataTable, DebouceInput } from '@/components/shared'
import { Avatar, Badge, Table, Tag } from '@/components/ui'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import THead from '@/components/ui/Table/THead'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import Tr from '@/components/ui/Table/Tr'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { getDashboardAccountDocAction, getDashboardLeadsAction, getDashboardOpportunityAction, getDashboardTaskAction, getDashboardWallAction } from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'
import classNames from '@/utils/classNames'
import dayjs from 'dayjs'
import cloneDeep from 'lodash/cloneDeep'
import {
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    LayoutGrid,
    ListChecks,
    Search,
    Shuffle,
    ShoppingBag,
    UserCircle,
    BarChart4
} from 'lucide-react'
import {
    Fragment,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useSelector } from 'react-redux'
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts'


// --- START: SKELETON COMPONENTS ---
const Skeleton = ({ className }: { className?: string }) => {
    return (
        <div
            className={classNames(
                'animate-pulse bg-gray-200 dark:bg-gray-700/50',
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
            <THead>
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
        <Tr>
            <Td colSpan={6}>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-44 rounded" />
                </div>
            </Td>
        </Tr>
        <Tr>
            <Td className="pl-14"><Skeleton className="h-4 w-12 rounded" /></Td>
            <Td><Skeleton className="h-4 w-32 rounded" /></Td>
            <Td><Skeleton className="h-4 w-28 rounded" /></Td>
            <Td><Skeleton className="h-4 w-24 rounded" /></Td>
            <Td><Skeleton className="h-4 w-24 rounded" /></Td>
            <Td><Skeleton className="h-4 w-28 rounded" /></Td>
        </Tr>
    </>
)

const TaskRowSkeleton = () => (
    <>
        <Td><div className="flex flex-col gap-1.5 pl-14"><Skeleton className="h-4 w-48 rounded" /><Skeleton className="h-3 w-24 rounded" /></div></Td>
        <Td><div className="flex -space-x-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-8 w-8 rounded-full" /></div></Td>
        <Td><Skeleton className="h-5 w-20 rounded-md" /></Td>
        <Td><Skeleton className="h-4 w-28 rounded" /></Td>
        <Td><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-24 rounded" /></div></Td>
    </>
);

const TaskTableSkeleton = () => (
    <Table>
        <THead>
            <Tr>
                <Th>Task / Module</Th><Th>Assigned To</Th><Th>Priority</Th><Th>Due Date</Th><Th>Created By</Th>
            </Tr>
        </THead>
        <tbody>
            {[1, 2].map(i => (
                <Fragment key={i}>
                    <Tr><Td colSpan={5}><div className="flex items-center justify-between"><Skeleton className="h-5 w-32 rounded" /><Skeleton className="h-5 w-24 rounded-md" /></div></Td></Tr>
                    <Tr><TaskRowSkeleton /></Tr>
                    <Tr><TaskRowSkeleton /></Tr>
                </Fragment>
            ))}
        </tbody>
    </Table>
);

const ProductOpportunitySkeleton = () => (
    <Table>
        <THead>
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
                    <Td><div className="flex items-center gap-3"><Skeleton className="h-4 w-4" /><Skeleton className="h-5 w-48 rounded" /></div></Td>
                    <Td><Skeleton className="h-6 w-20 rounded-md" /></Td>
                    <Td><Skeleton className="h-6 w-20 rounded-md" /></Td>
                    <Td><Skeleton className="h-6 w-32 rounded-md" /></Td>
                </Tr>
            ))}
        </tbody>
    </Table>
);

const WallListingSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <Skeleton className="h-5 w-48 mb-4 rounded" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center mb-2 pb-2 border-b dark:border-gray-700 last:border-b-0">
                            <Skeleton className="h-4 w-32 rounded" />
                            <Skeleton className="h-6 w-16 rounded-md" />
                        </div>
                    ))}
                </Card>
            </div>
            <div>
                <Card>
                    <Skeleton className="h-5 w-40 mb-4 rounded" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center mb-2 pb-2 border-b dark:border-gray-700 last:border-b-0">
                            <Skeleton className="h-4 w-24 rounded" />
                            <Skeleton className="h-6 w-16 rounded-md" />
                        </div>
                    ))}
                </Card>
            </div>
        </div>
        <Card>
            <Skeleton className="h-5 w-48 mb-4 rounded" />
            <Skeleton className="h-8 w-1/3 mb-4 rounded" />
            <Skeleton className="h-64 w-full rounded" />
        </Card>
    </div>
);

const AccountDocSkeleton = () => (
    <Table>
        <THead>
            <Tr>
                <Th>Doc No.</Th>
                <Th>Firm Name</Th>
                <Th>Progress</Th>
                <Th>Created At</Th>
            </Tr>
        </THead>
        <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
                <Tr key={i}>
                    <Td><Skeleton className="h-4 w-24 rounded" /></Td>
                    <Td><Skeleton className="h-4 w-48 rounded" /></Td>
                    <Td><Skeleton className="h-4 w-32 rounded" /></Td>
                    <Td><Skeleton className="h-4 w-28 rounded" /></Td>
                </Tr>
            ))}
        </tbody>
    </Table>
)
// --- END: SKELETON COMPONENTS ---

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
    theme: {
        base: string
        gradient: string
        color: string
    }
}

const StatisticCard = (props: StatisticCardProps) => {
    const { title, value, label, icon, active, onClick, theme } = props

    const cardColor = active
        ? `border-gray-300 dark:border-gray-600 shadow-lg ${theme.gradient}`
        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/60 border-gray-200 dark:border-gray-700'
    const iconColor = active ? 'text-white' : `dark:text-white ${theme.base}`
    const iconBg = active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-900/50'
    const valueColor = active ? 'text-white' : 'text-gray-900 dark:text-gray-100'

    return (
        <button
            className={classNames(
                'p-4 rounded-xl cursor-pointer ltr:text-left rtl:text-right transition-all duration-300 outline-none w-full border',
                cardColor
            )}
            onClick={() => onClick(label)}
        >
            <div className="flex items-center gap-4">
                <div
                    className={classNames(
                        'flex items-center justify-center p-3 rounded-lg text-2xl transition-colors duration-300',
                        iconBg
                    )}
                >
                    <span className={iconColor}>{icon}</span>
                </div>
                <div>
                    <div className={classNames('text-sm font-medium transition-colors duration-300', active ? 'text-white/90' : 'text-gray-500 dark:text-gray-400')}>
                        {title}
                    </div>
                    <h4 className={classNames('font-bold text-2xl transition-colors duration-300', valueColor)}>
                        {value}
                    </h4>
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
            <div className="h-[250px] flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500">
                <BarChart4 className="w-16 h-16 mb-2" strokeWidth={1.5} />
                <p className='text-lg font-semibold text-gray-600 dark:text-gray-300'>No Summary Data</p>
                <p className='text-sm'>There is no data to display in the chart.</p>
            </div>
        )
    }
    return (
        <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tw-border-gray-200)" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                        cursor={{ fill: 'rgba(100, 100, 100, 0.1)' }}
                        contentStyle={{
                            background: 'var(--tw-bg-gray-50)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--tw-border-gray-200)',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Bar dataKey="value" barSize={35} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

// --- START: PRODUCT OPPORTUNITIES COMPONENTS ---
const ScoreBar = ({ score }: { score: number }) => {
    const getScoreClasses = (s: number) => {
        if (s > 75) return { bg: 'from-green-400 to-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
        if (s > 40) return { bg: 'from-yellow-400 to-amber-500', text: 'text-amber-600 dark:text-amber-400' };
        return { bg: 'from-red-400 to-rose-500', text: 'text-rose-600 dark:text-rose-400' };
    };
    const scoreClasses = getScoreClasses(score);

    return (
        <div className="w-32 flex flex-col items-start">
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div className={`bg-gradient-to-r ${scoreClasses.bg} h-2 rounded-full`} style={{ width: `${score}%` }}></div>
            </div>
            <span className={`font-bold text-xs mt-1.5 ${scoreClasses.text}`}>{score.toFixed(1)}% Match</span>
        </div>
    );
};

const EnquirySubTable = ({ title, enquiries }: { title: string, enquiries: any[] }) => {
    if (!enquiries || enquiries.length === 0) {
        return (
            <div className='p-4 bg-gray-100 dark:bg-gray-800/60 rounded-lg'>
                <h6 className="mb-2 text-sm font-semibold">{title}</h6>
                <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">No recent enquiries.</div>
            </div>
        )
    }
    return (
        <div className='p-4 bg-gray-100 dark:bg-gray-800/60 rounded-lg'>
            <h6 className="mb-2 text-sm font-semibold">{title}</h6>
            <div className="overflow-x-auto">
                <Table className="min-w-full text-xs" compact>
                    <THead variant='light'>
                        <Tr>
                            <Th>Customer</Th>
                            <Th>Qty</Th>
                            <Th>Date</Th>
                        </Tr>
                    </THead>
                    <tbody>
                        {enquiries.map(enquiry => (
                            <Tr key={enquiry.id}>
                                <Td className="py-2 px-3">
                                    <div className="font-semibold">{enquiry.customer_name}</div>
                                    <div className="text-gray-500 dark:text-gray-400">{enquiry.company_temp}</div>
                                </Td>
                                <Td className="py-2 px-3 font-semibold">{enquiry.qty}</Td>
                                <Td className="py-2 px-3 whitespace-nowrap">{dayjs(enquiry.created_at).format('DD MMM')}</Td>
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

    const toggleRow = (id: number) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(id)) {
            newExpandedRows.delete(id);
        } else {
            newExpandedRows.add(id);
        }
        setExpandedRows(newExpandedRows);
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-gray-500">No product opportunities found.</p>
            </div>
        );
    }

    return (
        <div>
            <DebouceInput
                className="w-full md:w-1/3 mb-4"
                placeholder="Search by product name..."
                prefix={<Search className="text-lg" />}
                onChange={(e) => onSearch(e.target.value)}
            />
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <Table>
                    <THead>
                        <Tr>
                            <Th>Product</Th>
                            <Th>Buy Leads</Th>
                            <Th>Sell Leads</Th>
                            <Th>Match Score</Th>
                        </Tr>
                    </THead>
                    <tbody>
                        {data.map((product) => (
                            <Fragment key={product.product_id}>
                                <Tr
                                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    onClick={() => toggleRow(product.product_id)}
                                >
                                    <Td>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg text-gray-400 transition-transform duration-200" style={{ transform: expandedRows.has(product.product_id) ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                                                <ChevronRight size={16} />
                                            </span>
                                            <span className="font-semibold">{product.product_name}</span>
                                        </div>
                                    </Td>
                                    <Td>
                                        <Tag className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">{product.buy_count}</Tag>
                                    </Td>
                                    <Td>
                                        <Tag className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">{product.sell_count}</Tag>
                                    </Td>
                                    <Td><ScoreBar score={product.score} /></Td>
                                </Tr>
                                {expandedRows.has(product.product_id) && (
                                    <Tr>
                                        <Td colSpan={4} className="p-0 !border-0">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 grid grid-cols-1 lg:grid-cols-2 gap-4">
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

const statusColorMapping: { [key: string]: string } = {
    'New': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30', 'Assigned': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30', 'Approved': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30',
    'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30', 'Deal Done': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30', 'Rejected': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30',
    'Cancelled': 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30', 'Approval Waiting': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30', 'Accepted': 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300 border border-green-200 dark:border-green-500/30',
    'Active': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30', 'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30', 'default': 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300 border border-gray-200 dark:border-gray-500/30',
}

const LeadsBySalespersonTable = ({ data }: { data: SalespersonData[] }) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
    const toggleRow = (id: number) => { const newExpandedRows = new Set(expandedRows); if (newExpandedRows.has(id)) { newExpandedRows.delete(id) } else { newExpandedRows.add(id) } setExpandedRows(newExpandedRows) }
    if (!data || data.length === 0) { return <div className="text-center p-8 border border-dashed rounded-lg"><p className="text-gray-500">No leads found.</p></div> }
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <Table className="w-full">
                <THead><Tr><Th>Salesperson / ID</Th><Th>Product</Th><Th>Status</Th><Th>Buyer</Th><Th>Supplier</Th><Th>Created At</Th></Tr></THead>
                <tbody className="align-top">
                    {data.map((salesperson) => (
                        <Fragment key={salesperson.sales_person_id}>
                            <Tr className="cursor-pointer bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700" onClick={() => toggleRow(salesperson.sales_person_id)}>
                                <Td colSpan={6} className="py-3">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg text-gray-400">{expandedRows.has(salesperson.sales_person_id) ? <ChevronDown /> : <ChevronRight />}</span>
                                            <Avatar size={36} shape="circle" icon={<UserCircle />} />
                                            <span className="font-semibold">{salesperson.sales_person_name}</span>
                                        </div>
                                        <Tag>{salesperson.lead_count} Lead{salesperson.lead_count !== 1 ? 's' : ''}</Tag>
                                    </div>
                                </Td>
                            </Tr>
                            {expandedRows.has(salesperson.sales_person_id) && salesperson.latest_10_leads.map((lead) => (
                                <Tr key={lead.lead_id} className="bg-white dark:bg-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                    <Td className="pl-16"><span className="font-mono text-sm">#{lead.lead_id}</span></Td>
                                    <Td><span className="font-medium">{lead.product_name}</span></Td>
                                    <Td><Tag className={statusColorMapping[lead.status] || statusColorMapping.default}>{lead.status}</Tag></Td>
                                    <Td>{lead.buyer || <em className="text-gray-400">N/A</em>}</Td>
                                    <Td>{lead.supplier || <em className="text-gray-400">N/A</em>}</Td>
                                    <Td><div className="text-sm whitespace-nowrap"><div>{dayjs(lead.created_at).format('DD MMM YYYY')}</div><div className="text-xs text-gray-500">{dayjs(lead.created_at).format('hh:mm A')}</div></div></Td>
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
    'not_started': 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300 border border-gray-200 dark:border-gray-500/30',
    'pending': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30',
    'in_progress': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30',
    'on_hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-500/30',
    'completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
    'cancelled': 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30',
    'review': 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30',
};

const TasksByStatusTable = ({ data }: { data: any }) => {
    const [expandedRows, setExpandedRows] = useState(new Set(['in_progress', 'not_started']))
    const [searchQuery, setSearchQuery] = useState('')

    if (!data || !data.status_wise_tasks) {
        return <div className="text-center p-8 border border-dashed rounded-lg"><p className="text-gray-500">No task data available.</p></div>
    }

    const { status_wise_tasks, counts } = data

    const toggleRow = (statusKey: string) => {
        const newExpandedRows = new Set(expandedRows)
        if (newExpandedRows.has(statusKey)) {
            newExpandedRows.delete(statusKey)
        } else {
            newExpandedRows.add(statusKey)
        }
        setExpandedRows(newExpandedRows)
    }

    const statusOrder = ['in_progress', 'pending', 'not_started', 'on_hold', 'review', 'completed', 'cancelled'];

    const filteredTasksByStatus = useMemo(() => {
        if (!searchQuery) {
            return status_wise_tasks
        }
        const lowercasedQuery = searchQuery.toLowerCase()
        const filtered: { [key: string]: any[] } = {}
        for (const status in status_wise_tasks) {
            filtered[status] = status_wise_tasks[status].filter(
                (task: any) =>
                    task.task_title.toLowerCase().includes(lowercasedQuery) ||
                    task.assign_to_users.some((user: any) => user.name.toLowerCase().includes(lowercasedQuery))
            );
        }
        return filtered
    }, [status_wise_tasks, searchQuery])

    const statusKeysToRender = statusOrder.filter(key => filteredTasksByStatus[key] && filteredTasksByStatus[key].length > 0)

    return (
        <div>
            <DebouceInput
                className="w-full md:w-1/3 mb-4"
                placeholder="Search Tasks by title or assignee..."
                prefix={<Search className="text-lg" />}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <Table>
                    <THead>
                        <Tr>
                            <Th style={{ width: '40%' }}>Task / Module</Th>
                            <Th style={{ width: '20%' }}>Assigned To</Th>
                            <Th style={{ width: '10%' }}>Priority</Th>
                            <Th style={{ width: '15%' }}>Due Date</Th>
                            <Th style={{ width: '15%' }}>Created By</Th>
                        </Tr>
                    </THead>
                    <tbody className="align-top">
                        {statusKeysToRender.length > 0 ? statusKeysToRender.map((statusKey) => {
                            const tasks = filteredTasksByStatus[statusKey].slice(0, 10)
                            const count = filteredTasksByStatus[statusKey].length

                            return (
                                <Fragment key={statusKey}>
                                    <Tr className="cursor-pointer bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800/80 border-y border-gray-200 dark:border-gray-700" onClick={() => toggleRow(statusKey)}>
                                        <Td colSpan={5} className="py-3">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg text-gray-400">{expandedRows.has(statusKey) ? <ChevronDown /> : <ChevronRight />}</span>
                                                    <span className="font-semibold">{formatStatusName(statusKey)}</span>
                                                </div>
                                                <Tag className={taskStatusColorMapping[statusKey]}>{count} Task{count !== 1 ? 's' : ''}</Tag>
                                            </div>
                                        </Td>
                                    </Tr>
                                    {expandedRows.has(statusKey) && tasks.map((task: any) => (
                                        <Tr key={task.id} className="bg-white dark:bg-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                                            <Td className="pl-16">
                                                <div className="font-medium">{task.task_title}</div><div className="text-xs text-gray-500">{task.module_name}</div>
                                            </Td>
                                            <Td>
                                                <div className="flex -space-x-2 items-center">{task.assign_to_users.length > 0 ? task.assign_to_users.map((user: any) => (<Avatar key={user.id} src={user.profile_pic_path} size="sm" shape="circle" title={user.name} />)) : <span className="text-gray-400 italic text-sm">Unassigned</span>}</div>
                                            </Td>
                                            <Td><Tag>{task.priority}</Tag></Td>
                                            <Td><span className="text-sm">{task.due_date ? dayjs(task.due_date).format('DD MMM YYYY') : 'N/A'}</span></Td>
                                            <Td><div className="flex items-center gap-2"><Avatar src={task.created_by_user.profile_pic_path} size="sm" shape="circle" /><span className="text-sm">{task.created_by_user.name}</span></div></Td>
                                        </Tr>
                                    ))}
                                </Fragment>
                            )
                        }) : (
                            <Tr><Td colSpan={5} className="text-center py-10 text-gray-500">No tasks found for your search query.</Td></Tr>
                        )}
                    </tbody>
                </Table>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div><div className="text-sm text-gray-500">Unassigned</div><div className="font-bold text-lg">{counts.unassigned || 0}</div></div>
                    <div><div className="text-sm text-gray-500">No Status</div><div className="font-bold text-lg text-red-500">{counts.no_status || 0}</div></div>
                    <div><div className="text-sm text-gray-500">New Today</div><div className="font-bold text-lg">{counts.today || 0}</div></div>
                    <div><div className="text-sm text-gray-500">Completed Total</div><div className="font-bold text-lg text-emerald-500">{counts.completed || 0}</div></div>
                </div>
            </div>
        </div>
    );
};
// --- END OF TASKS BY STATUS TABLE COMPONENT ---

// --- START: Wall Listing Component ---
const WallSummaryCard = ({ title, data, dataKey, nameKey }: { title: string, data: any[], dataKey: string, nameKey: string }) => {
    if (!data || data.length === 0) {
        return (
            <Card>
                <h6 className="font-semibold mb-4">{title}</h6>
                <div className="text-center p-4 text-gray-400">No data available.</div>
            </Card>
        )
    }

    return (
        <Card>
            <h6 className="font-semibold mb-4">{title}</h6>
            <div className="max-h-80 overflow-y-auto">
                {data.map((item, index) => (
                    <div key={index} className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                        <span className="text-sm font-medium">{item[nameKey]}</span>
                        <Tag>{(item[dataKey] || 0).toLocaleString()}</Tag>
                    </div>
                ))}
            </div>
        </Card>
    );
};

const WallListingDetails = ({ data }: { data: any }) => {
    const { latest100 = [] } = data;

    const [queries, setQueries] = useState<TableQueries>({
        total: latest100.length,
        pageIndex: 1,
        pageSize: 10,
        query: '',
        sort: { order: '', key: '' },
    });

    const handlePaginationChange = (page: number) => {
        const newTable = cloneDeep(queries);
        newTable.pageIndex = page;
        setQueries(newTable);
    };

    const handleSelectChange = (value: number) => {
        const newTable = cloneDeep(queries);
        newTable.pageSize = value;
        newTable.pageIndex = 1;
        setQueries(newTable);
    };

    const handleInputChange = (val: string) => {
        const newTable = cloneDeep(queries)
        newTable.query = val
        newTable.pageIndex = 1
        setQueries(newTable)
    }

    const { paginatedData, total } = useMemo(() => {
        const { pageIndex, pageSize, query } = queries;
        const lowercasedQuery = query.toLowerCase();

        let filteredData = latest100;

        if (lowercasedQuery) {
            filteredData = filteredData.filter((item: any) =>
                item?.product?.name?.toLowerCase().includes(lowercasedQuery) ||
                item?.customer?.name?.toLowerCase().includes(lowercasedQuery) ||
                item?.customer?.country?.name?.toLowerCase().includes(lowercasedQuery)
            );
        }

        const start = (pageIndex - 1) * pageSize;
        const end = start + pageSize;
        return {
            paginatedData: filteredData.slice(start, end),
            total: filteredData.length
        };
    }, [queries, latest100]);

    const columns = useMemo(() => [
        { header: 'Product', accessorKey: 'product.name', cell: (props: any) => <span className="font-semibold">{props.row.original.product?.name || 'N/A'}</span> },
        { header: 'Customer', accessorKey: 'customer.name', cell: (props: any) => <span>{props.row.original.customer?.name || 'N/A'}</span> },
        { header: 'Country', accessorKey: 'customer.country.name', cell: (props: any) => <span>{props.row.original.customer?.country?.name || 'N/A'}</span> },
        { header: 'Type', accessorKey: 'want_to', cell: (props: any) => <Tag className={props.row.original.want_to === 'Buy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'}>{props.row.original.want_to}</Tag> },
        { header: 'Qty', accessorKey: 'qty' },
        { header: 'Status', accessorKey: 'status', cell: (props: any) => <Tag className={statusColorMapping[props.row.original.status] || statusColorMapping.default}>{props.row.original.status}</Tag> },
        { header: 'Date', accessorKey: 'created_at', cell: (props: any) => <span>{dayjs(props.row.original.created_at).format('DD MMM YYYY')}</span> },
    ], []);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <WallSummaryCard title="Geographic Insights (By Country)" data={data.countryWise} nameKey="country_name" dataKey="total" />
                </div>
                <div>
                    <WallSummaryCard title="Product Insights (By Category)" data={data.categoryWise} nameKey="category_name" dataKey="total" />
                </div>
            </div>

            <Card>
                <h5 className="mb-4">Latest 100 Enquiries</h5>
                <DebouceInput
                    className="w-full md:w-1/3 mb-4"
                    placeholder="Search by product, customer, country..."
                    prefix={<Search className="text-lg" />}
                    onChange={(e) => handleInputChange(e.target.value)}
                />
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={paginatedData}
                        skeletonAvatarColumns={[0]}
                        skeletonAvatarProps={{ className: 'rounded-md' }}
                        loading={!latest100}
                        pagingData={{
                            total: total,
                            pageIndex: queries.pageIndex,
                            pageSize: queries.pageSize,
                        }}
                        onPaginationChange={handlePaginationChange}
                        onSelectChange={handleSelectChange}
                    />
                </div>
            </Card>
        </div>
    );
};
// --- END: Wall Listing Component ---

// --- START: Account Documents Component ---
const AccountDocumentsTable = ({ data, loading }: { data: any[], loading: boolean }) => {
    const [queries, setQueries] = useState<TableQueries>({
        total: data.length,
        pageIndex: 1,
        pageSize: 10,
        query: '',
        sort: { order: '', key: '' },
    });

    const handleInputChange = (val: string) => {
        setQueries(prev => ({ ...prev, query: val, pageIndex: 1 }));
    };

    const handlePaginationChange = (page: number) => {
        setQueries(prev => ({ ...prev, pageIndex: page }));
    };

    const handleSelectChange = (value: number) => {
        setQueries(prev => ({ ...prev, pageSize: value, pageIndex: 1 }));
    };

    const { paginatedData, total } = useMemo(() => {
        const { pageIndex, pageSize, query } = queries;
        let filteredData = data;
        if (query) {
            const lowercasedQuery = query.toLowerCase();
            filteredData = filteredData.filter(doc =>
                doc.firm_name.toLowerCase().includes(lowercasedQuery) ||
                doc.doc_no.toLowerCase().includes(lowercasedQuery)
            );
        }
        const start = (pageIndex - 1) * pageSize;
        const end = start + pageSize;
        return {
            paginatedData: filteredData.slice(start, end),
            total: filteredData.length
        };
    }, [data, queries]);

    const columns = useMemo(() => [
        {
            header: 'Doc No.',
            accessorKey: 'doc_no',
            cell: (props: any) => <span className="font-mono">{props.row.original.doc_no}</span>,
        },
        {
            header: 'Firm Name',
            accessorKey: 'firm_name',
        },
        {
            header: 'Progress',
            accessorKey: 'total_filled_questions',
            cell: (props: any) => {
                const { total_filled_questions, total_questions } = props.row.original;
                const percentage = total_questions > 0 ? (total_filled_questions / total_questions) * 100 : 0;
                const isCompleted = total_filled_questions === total_questions;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{`${total_filled_questions}/${total_questions}`}</span>
                        <Badge className={isCompleted ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}>
                            {isCompleted && <CheckCircle2 size={12} className="mr-1" />}
                            {percentage.toFixed(0)}%
                        </Badge>
                    </div>
                );
            },
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: (props: any) => dayjs(props.row.original.created_at).format('DD MMM YYYY, hh:mm A'),
        },
    ], []);

    return (
        <div>
            <DebouceInput
                className="w-full md:w-1/3 mb-4"
                placeholder="Search by Firm Name or Doc No..."
                prefix={<Search className="text-lg" />}
                onChange={(e) => handleInputChange(e.target.value)}
            />
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <DataTable
                    columns={columns}
                    data={paginatedData}
                    loading={loading}
                    pagingData={{
                        total: total,
                        pageIndex: queries.pageIndex,
                        pageSize: queries.pageSize,
                    }}
                    onPaginationChange={handlePaginationChange}
                    onSelectChange={handleSelectChange}
                />
            </div>
        </div>
    );
};
// --- END: Account Documents Component ---

const CHART_COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#6366F1', '#F59E0B', '#06B6D4'];
const categoryThemes = {
    ProductOpportunities: { base: 'text-purple-500', gradient: 'bg-gradient-to-br from-purple-400 to-indigo-500', color: '#8B5CF6' },
    Leads: { base: 'text-emerald-500', gradient: 'bg-gradient-to-br from-emerald-400 to-green-500', color: '#10B981' },
    Tasks: { base: 'text-rose-500', gradient: 'bg-gradient-to-br from-rose-400 to-pink-500', color: '#F43F5E' },
    WallListing: { base: 'text-amber-500', gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', color: '#F59E0B' },
    Company: { base: 'text-sky-500', gradient: 'bg-gradient-to-br from-sky-400 to-blue-500', color: '#0EA5E9' },
};


// --- MAIN COMPONENT ---
const Overview = () => {
    const [selectedCategory, setSelectedCategory] =
        useState<StatisticCategory>('ProductOpportunities')

    const dispatch = useAppDispatch()
    const { DashboardLeadsData, DashboardTaskData, loading, DashboardOpportunityData, DashboardWallData, DashboardAccountDocData } = useSelector(masterSelector)

    const [leadSearchQuery, setLeadSearchQuery] = useState('')
    const [opportunitySearchQuery, setOpportunitySearchQuery] = useState('')

    useEffect(() => {
        dispatch(getDashboardLeadsAction())
        dispatch(getDashboardTaskAction())
        dispatch(getDashboardOpportunityAction())
        dispatch(getDashboardWallAction())
        dispatch(getDashboardAccountDocAction())
    }, [dispatch])

    const isLoading = loading;

    const handleOpportunitySearch = (query: string) => {
        setOpportunitySearchQuery(query.toLowerCase());
    };

    const filteredOpportunityData = useMemo(() => {
        if (!DashboardOpportunityData?.data) return [];
        if (!opportunitySearchQuery) return DashboardOpportunityData.data;
        return DashboardOpportunityData.data.filter(
            (product: any) => product.product_name.toLowerCase().includes(opportunitySearchQuery)
        );
    }, [DashboardOpportunityData, opportunitySearchQuery]);

    const handleLeadSearch = (query: string) => {
        setLeadSearchQuery(query)
    }

    const leadsAPIData = useMemo(() => {
        const rawData = DashboardLeadsData?.data || []
        const totalCount = rawData.reduce((acc: number, curr: SalespersonData) => acc + curr.lead_count, 0)
        const allLeads = rawData.flatMap((sp: SalespersonData) => sp.latest_10_leads)
        const statusCounts = allLeads.reduce((acc: { [key: string]: number }, lead: Lead) => { acc[lead.status] = (acc[lead.status] || 0) + 1; return acc; }, {});
        const summaryData = Object.entries(statusCounts).map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }));
        const filteredSalespersonData = rawData.filter((sp: SalespersonData) => sp.sales_person_name.toLowerCase().includes(leadSearchQuery.toLowerCase()) || sp.latest_10_leads.some(l => l.product_name.toLowerCase().includes(leadSearchQuery.toLowerCase()))).map((sp: SalespersonData) => ({ ...sp, latest_10_leads: leadSearchQuery ? sp.latest_10_leads.filter(l => l.product_name.toLowerCase().includes(leadSearchQuery.toLowerCase())) : sp.latest_10_leads }))
        return { totalCount, summaryData, tableData: filteredSalespersonData }
    }, [DashboardLeadsData, leadSearchQuery])
    
    const accountDocAPIData = useMemo(() => {
        const counts = DashboardAccountDocData?.counts || {};
        const summaryData = [
            { name: 'Active', value: counts.active || 0, fill: CHART_COLORS[0] },
            { name: 'Pending', value: counts.pending || 0, fill: CHART_COLORS[2] },
            { name: 'Completed', value: counts.completed || 0, fill: CHART_COLORS[1] },
        ];
        return {
            totalCount: counts.total || 0,
            summaryData,
            tableData: DashboardAccountDocData?.data || [],
        };
    }, [DashboardAccountDocData]);


    const categoryDetails = useMemo(() => {
        const taskCounts = DashboardTaskData?.counts || {}

        const opportunityChartData = (DashboardOpportunityData?.data || [])
            .slice(0, 10) 
            .map((p: any) => ({
                name: p.product_name.replace('IPHONE', 'IP').substring(0, 15),
                value: p.score,
                fill: categoryThemes.ProductOpportunities.color,
            }));

        const wallListingChartData = (DashboardWallData?.country_wise || [])
            .slice(0, 10) 
            .map((c: any) => ({
                name: c.country_name,
                value: c.total,
                fill: categoryThemes.WallListing.color
            }));

        return {
            ProductOpportunities: {
                label: 'ProductOpportunities' as StatisticCategory,
                title: 'Product Opportunities',
                icon: <Shuffle size={28} strokeWidth={1.5}/>,
                theme: categoryThemes.ProductOpportunities,
                totalCount: DashboardOpportunityData?.data?.length || 0,
                summaryData: opportunityChartData,
                tableData: filteredOpportunityData,
            },
            Leads: {
                label: 'Leads' as StatisticCategory,
                title: 'Leads',
                icon: <ShoppingBag size={28} strokeWidth={1.5} />,
                theme: categoryThemes.Leads,
                totalCount: leadsAPIData.totalCount || 0,
                summaryData: leadsAPIData.summaryData,
                tableData: leadsAPIData.tableData,
            },
            Tasks: {
                label: 'Tasks' as StatisticCategory,
                title: 'Tasks',
                icon: <ListChecks size={28} strokeWidth={1.5} />,
                theme: categoryThemes.Tasks,
                totalCount: taskCounts.total || 0,
                summaryData: Object.entries(taskCounts).map(([key, value], i) => ({ name: formatStatusName(key), value, fill: CHART_COLORS[i % CHART_COLORS.length] })).filter(d => ['Not Started', 'Pending', 'In Progress', 'On Hold', 'Completed'].includes(d.name) && d.value > 0),
                fullData: DashboardTaskData,
            },
            WallListing: {
                label: 'WallListing' as StatisticCategory,
                title: 'Wall Enquiries',
                icon: <LayoutGrid size={28} strokeWidth={1.5}/>,
                theme: categoryThemes.WallListing,
                totalCount: DashboardWallData?.counts?.total || 0,
                summaryData: wallListingChartData,
                wallData: {
                    countryWise: DashboardWallData?.country_wise || [],
                    categoryWise: DashboardWallData?.category_wise || [],
                    latest100: DashboardWallData?.latest_100 || [],
                }
            },
            Company: {
                label: 'Company' as StatisticCategory,
                title: 'Account Document',
                icon: <Building2 size={28} strokeWidth={1.5}/>,
                theme: categoryThemes.Company,
                totalCount: accountDocAPIData.totalCount,
                summaryData: accountDocAPIData.summaryData,
                tableData: accountDocAPIData.tableData,
            },
        }
    }, [DashboardTaskData, DashboardOpportunityData, DashboardWallData, leadsAPIData, filteredOpportunityData, accountDocAPIData])

    const currentCategory: any = categoryDetails[selectedCategory]

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className='mb-2'>Dashboard Overview</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {Object.values(categoryDetails).map((cat: any) => (
                    <StatisticCard key={cat.label} title={cat.title || cat.label} value={(cat.totalCount || 0).toLocaleString()} icon={cat.icon} label={cat.label} active={selectedCategory === cat.label} onClick={setSelectedCategory} theme={cat.theme} />
                ))}
            </div>

            <Card>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h5 className="capitalize">{currentCategory.title || currentCategory.label} Summary</h5>
                    {/* <Select className="min-w-[160px]" size="sm" defaultValue={{ label: 'All Time', value: 'All' }} options={[{ label: 'All Time', value: 'All' }, { label: 'Today', value: 'Today' }, { label: 'This Week', value: 'Weekly' }, { label: 'This Month', value: 'Monthly' }]} /> */}
                </div>
                <CategorySummaryChart data={currentCategory.summaryData} />
            </Card>

            <Card>
                <div className="mb-4">
                    <h5 className="mb-1">{currentCategory.title || currentCategory.label} Details</h5>
                    <p className="text-gray-500 text-sm">
                        {selectedCategory === 'ProductOpportunities' ? "Hot products with both buyers and sellers. Expand a row to see top enquiries." :
                            selectedCategory === 'Tasks' ? "List of all tasks, grouped by current status." :
                                selectedCategory === 'Leads' ? "List of leads grouped by salesperson" :
                                    selectedCategory === 'WallListing' ? "Breakdown of wall enquiries by region, category, and recent activity." :
                                        selectedCategory === 'Company' ? "List of all company account documents and their completion status." :
                                            `Detailed list of all ${currentCategory.label.toLowerCase()}`}
                    </p>
                </div>

                {isLoading ? (
                    selectedCategory === 'ProductOpportunities' ? <ProductOpportunitySkeleton /> :
                        selectedCategory === 'Tasks' ? <TaskTableSkeleton /> :
                            selectedCategory === 'Leads' ? <TableSkeleton columns={[{ header: 'Salesperson' }]} skeletonRow={<SalespersonSkeletonRow />} rowCount={2} /> :
                                selectedCategory === 'WallListing' ? <WallListingSkeleton /> :
                                    selectedCategory === 'Company' ? <AccountDocSkeleton /> :
                                        <Skeleton className="h-64 w-full" />
                ) : (
                    selectedCategory === 'ProductOpportunities' ? (
                        <ProductOpportunitiesTable data={currentCategory.tableData} onSearch={handleOpportunitySearch} />
                    ) :
                        selectedCategory === 'Tasks' ? (
                            <TasksByStatusTable data={currentCategory.fullData} />
                        ) :
                            selectedCategory === 'Leads' ? (
                                <>
                                    <DebouceInput className="w-full md:w-1/3 mb-4" placeholder="Search by Salesperson or Product..." prefix={<Search />} onChange={(e) => handleLeadSearch(e.target.value)} />
                                    <LeadsBySalespersonTable data={currentCategory.tableData} />
                                </>
                            ) :
                                selectedCategory === 'WallListing' ? (
                                    <WallListingDetails data={currentCategory.wallData} />
                                ) :
                                    selectedCategory === 'Company' ? (
                                        <AccountDocumentsTable data={currentCategory.tableData} loading={isLoading} />
                                    ) : (
                                        <div className="text-center p-8 border border-dashed rounded-lg">
                                            <p className="text-gray-500">Component for {currentCategory.title || currentCategory.label} is not implemented yet.</p>
                                        </div>
                                    )
                )}
            </Card>
        </div>
    )
}

export default Overview