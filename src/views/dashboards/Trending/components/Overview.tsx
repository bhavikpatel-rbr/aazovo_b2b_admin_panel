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
    useEffect,
    useMemo,
    useState
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
} from 'recharts'

// --- START: SKELETON COMPONENTS ---
const Skeleton = ({ className }: { className?: string }) => {
    return (
        <div
            className={classNames(
                'animate-pulse bg-gray-200 dark:bg-gray-600',
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
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col gap-1.5 w-full">
                        <Skeleton className="h-4 w-40 rounded" />
                    </div>
                </div>
            </Td>
        </Tr>
        <Tr>
            <Td className="pl-12"><Skeleton className="h-4 w-12 rounded" /></Td>
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
        <Td><div className="flex flex-col gap-1.5 pl-12"><Skeleton className="h-4 w-48 rounded" /><Skeleton className="h-3 w-24 rounded" /></div></Td>
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
                    <Td><div className="flex items-center gap-2"><Skeleton className="h-4 w-4" /><Skeleton className="h-5 w-48 rounded" /></div></Td>
                    <Td><Skeleton className="h-6 w-20 rounded-md" /></Td>
                    <Td><Skeleton className="h-6 w-20 rounded-md" /></Td>
                    <Td><Skeleton className="h-6 w-32 rounded-md" /></Td>
                </Tr>
            ))}
        </tbody>
    </Table>
);

// NEW: Skeleton for the Wall Listing component
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
    themeColor: string
}

const StatisticCard = (props: StatisticCardProps) => {
    const { title, value, label, icon, active, onClick, themeColor } = props

    const cardColor = active
        ? `bg-gray-100 dark:bg-gray-700`
        : 'bg-white dark:bg-gray-800'
    const iconActiveColor = `text-white bg-${themeColor}`
    const textActiveColor = `text-${themeColor}`

    return (
        <button
            className={classNames(
                'p-4 rounded-xl cursor-pointer ltr:text-left rtl:text-right transition duration-150 outline-none w-full border',
                cardColor,
                active ? `border-${themeColor}` : 'border-gray-200 dark:border-gray-600'
            )}
            onClick={() => onClick(label)}
        >
            <div className="flex justify-between items-center relative">
                <div className="flex items-center gap-4">
                    <div
                        className={classNames(
                            'flex items-center justify-center p-2 rounded-lg text-2xl',
                            active ? iconActiveColor : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                        )}
                    >
                        {icon}
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {title}
                        </div>
                        <h4 className={classNames('font-bold', active && textActiveColor)}>
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
            <div className="h-[250px] flex items-center justify-center text-gray-400">
                No summary data available.
            </div>
        )
    }
    return (
        <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip
                        cursor={{ fill: 'rgba(100, 100, 100, 0.1)' }}
                        contentStyle={{
                            background: 'var(--tw-bg-gray-50)',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--tw-border-gray-200)',
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
    const getScoreColor = (s: number) => {
        if (s > 75) return 'bg-emerald-500';
        if (s > 40) return 'bg-amber-500';
        return 'bg-red-500';
    };
    const textColor = getScoreColor(score).replace('bg-', 'text-');

    return (
        <div className="w-28 flex flex-col items-start">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className={`${getScoreColor(score)} h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
            </div>
            <span className={`font-bold text-xs mt-1 ${textColor}`}>{score.toFixed(1)}% Match</span>
        </div>
    );
};

const EnquirySubTable = ({ title, enquiries }: { title: string, enquiries: any[] }) => {
    if (!enquiries || enquiries.length === 0) {
        return (
            <div>
                <h6 className="mb-2 text-sm font-semibold">{title}</h6>
                <div className="border rounded-lg p-4 text-center text-gray-400 text-sm">No recent enquiries.</div>
            </div>
        )
    }
    return (
        <div>
            <h6 className="mb-2 text-sm font-semibold">{title}</h6>
            <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-full text-xs">
                    <THead>
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
                                    <div className="text-gray-500">{enquiry.company_temp}</div>
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
                prefix={<TbSearch className="text-lg" />}
                onChange={(e) => onSearch(e.target.value)}
            />
            <div className="border rounded-lg">
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
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg text-gray-400">
                                                {expandedRows.has(product.product_id) ? <IoChevronDown /> : <IoChevronForward />}
                                            </span>
                                            <span className="font-semibold">{product.product_name}</span>
                                        </div>
                                    </Td>
                                    <Td>
                                        <Tag className="bg-emerald-100 text-emerald-600">{product.buy_count}</Tag>
                                    </Td>
                                    <Td>
                                        <Tag className="bg-amber-100 text-amber-600">{product.sell_count}</Tag>
                                    </Td>
                                    <Td><ScoreBar score={product.score} /></Td>
                                </Tr>
                                {expandedRows.has(product.product_id) && (
                                    <Tr>
                                        <Td colSpan={4} className="p-0 !border-0">
                                            <div className="p-4 pl-12 bg-gray-50 dark:bg-gray-900/50 grid grid-cols-1 lg:grid-cols-2 gap-4">
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
    'New': 'bg-blue-100 text-blue-600', 'Assigned': 'bg-amber-100 text-amber-600', 'Approved': 'bg-cyan-100 text-cyan-600',
    'Completed': 'bg-emerald-100 text-emerald-600', 'Deal Done': 'bg-emerald-100 text-emerald-600', 'Rejected': 'bg-red-100 text-red-600',
    'Cancelled': 'bg-rose-100 text-rose-600', 'Approval Waiting': 'bg-yellow-100 text-yellow-600', 'Accepted': 'bg-green-100 text-green-600',
    'Active': 'bg-emerald-100 text-emerald-600', 'Pending': 'bg-amber-100 text-amber-600', 'default': 'bg-gray-100 text-gray-600',
}

const LeadsBySalespersonTable = ({ data }: { data: SalespersonData[] }) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
    const toggleRow = (id: number) => { const newExpandedRows = new Set(expandedRows); if (newExpandedRows.has(id)) { newExpandedRows.delete(id) } else { newExpandedRows.add(id) } setExpandedRows(newExpandedRows) }
    if (!data || data.length === 0) { return <div className="text-center p-8 border border-dashed rounded-lg"><p className="text-gray-500">No leads found.</p></div> }
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table className="w-full">
                <THead className="bg-gray-50 dark:bg-gray-800 rounded-t-lg"><Tr><Th>Salesperson / ID</Th><Th>Product</Th><Th>Status</Th><Th>Buyer</Th><Th>Supplier</Th><Th>Created At</Th></Tr></THead>
                <tbody className="align-top divide-y divide-gray-200 dark:divide-gray-700">
                    {data.map((salesperson) => (
                        <Fragment key={salesperson.sales_person_id}>
                            <Tr className="cursor-pointer bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => toggleRow(salesperson.sales_person_id)}>
                                <Td colSpan={6}>
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3"><span className="text-lg text-gray-400">{expandedRows.has(salesperson.sales_person_id) ? <IoChevronDown /> : <IoChevronForward />}</span><Avatar size="sm" shape="circle" icon={<TbUserCircle />} /><span className="font-semibold">{salesperson.sales_person_name}</span></div><Tag>{salesperson.lead_count} Lead{salesperson.lead_count !== 1 ? 's' : ''}</Tag>
                                    </div>
                                </Td>
                            </Tr>
                            {expandedRows.has(salesperson.sales_person_id) && salesperson.latest_10_leads.map((lead) => (
                                <Tr key={lead.lead_id} className="bg-gray-50/50 dark:bg-gray-900/50"><Td className="pl-14"><span className="font-mono text-sm">#{lead.lead_id}</span></Td><Td><span className="font-medium">{lead.product_name}</span></Td><Td><Tag className={statusColorMapping[lead.status] || statusColorMapping.default}>{lead.status}</Tag></Td><Td>{lead.buyer || <em className="text-gray-400">N/A</em>}</Td><Td>{lead.supplier || <em className="text-gray-400">N/A</em>}</Td><Td><div className="text-sm whitespace-nowrap"><div>{dayjs(lead.created_at).format('DD MMM YYYY')}</div><div className="text-xs">{dayjs(lead.created_at).format('hh:mm A')}</div></div></Td></Tr>
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
    return status.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/\b\w/g, (l) => l.toUpperCase()).trim();
};

const taskStatusColorMapping: { [key: string]: string } = {
    'not_started': 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100',
    'pending': 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
    'in_progress': 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
    'on_hold': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100',
    'completed': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    'cancelled': 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-100',
    'review': 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100',
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
                prefix={<TbSearch className="text-lg" />}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <Table>
                    <THead className="bg-gray-50 dark:bg-gray-800">
                        <Tr>
                            <Th style={{ width: '40%' }}>Task / Module</Th>
                            <Th style={{ width: '20%' }}>Assigned To</Th>
                            <Th style={{ width: '10%' }}>Priority</Th>
                            <Th style={{ width: '15%' }}>Due Date</Th>
                            <Th style={{ width: '15%' }}>Created By</Th>
                        </Tr>
                    </THead>
                    <tbody className="align-top divide-y divide-gray-200 dark:divide-gray-700">
                        {statusKeysToRender.length > 0 ? statusKeysToRender.map((statusKey) => {
                            const tasks = filteredTasksByStatus[statusKey].slice(0, 10)
                            const count = filteredTasksByStatus[statusKey].length

                            return (
                                <Fragment key={statusKey}>
                                    <Tr className="cursor-pointer bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => toggleRow(statusKey)}>
                                        <Td colSpan={5}>
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3"><span className="text-lg text-gray-400">{expandedRows.has(statusKey) ? <IoChevronDown /> : <IoChevronForward />}</span><span className="font-semibold">{formatStatusName(statusKey)}</span></div>
                                                <Tag className={taskStatusColorMapping[statusKey]}>{count} Task{count !== 1 ? 's' : ''}</Tag>
                                            </div>
                                        </Td>
                                    </Tr>
                                    {expandedRows.has(statusKey) && tasks.map((task: any) => (
                                        <Tr key={task.id} className="bg-gray-50/50 dark:bg-gray-900/50">
                                            <Td className="pl-14">
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
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
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

// NEW: --- START: Wall Listing Component ---
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
        { header: 'Product', accessorKey: 'product.name', cell: (props: any) => <span>{props.row.original.product?.name || 'N/A'}</span> },
        { header: 'Customer', accessorKey: 'customer.name', cell: (props: any) => <span>{props.row.original.customer?.name || 'N/A'}</span> },
        { header: 'Country', accessorKey: 'customer.country.name', cell: (props: any) => <span>{props.row.original.customer?.country?.name || 'N/A'}</span> },
        { header: 'Type', accessorKey: 'want_to', cell: (props: any) => <Tag className={props.row.original.want_to === 'Buy' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}>{props.row.original.want_to}</Tag> },
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
                    prefix={<TbSearch className="text-lg" />}
                    onChange={(e) => handleInputChange(e.target.value)}
                />
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
            </Card>
        </div>
    );
};
// NEW: --- END: Wall Listing Component ---


const CHART_COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#6366F1', '#F59E0B', '#06B6D4'];

// --- MAIN COMPONENT ---
const Overview = () => {
    const [selectedCategory, setSelectedCategory] =
        useState<StatisticCategory>('ProductOpportunities')

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

    const categoryDetails = useMemo(() => {
        const taskCounts = DashboardTaskData?.counts || {}

        const opportunityChartData = (DashboardOpportunityData?.data || [])
            .slice(0, 5)
            .map((p: any, i: number) => ({
                name: p.product_name.replace('IPHONE', 'IP').substring(0, 15),
                value: p.score,
                fill: CHART_COLORS[i % CHART_COLORS.length],
            }));

        // NEW: Prepare data for Wall Listing chart and details
        const wallListingChartData = (DashboardWallData?.country_wise || [])
            .slice(0, 5)
            .map((c: any, i: number) => ({
                name: c.country_name,
                value: c.total,
                fill: CHART_COLORS[i % CHART_COLORS.length]
            }));

        return {
            ProductOpportunities: {
                label: 'ProductOpportunities' as StatisticCategory,
                title: 'Product Opportunities',
                icon: <TbArrowsRandom />,
                themeColor: 'purple-500',
                totalCount: DashboardOpportunityData?.data?.length || 0,
                summaryData: opportunityChartData,
                tableData: filteredOpportunityData,
            },
            Leads: {
                label: 'Leads' as StatisticCategory,
                title: 'Leads',
                icon: <TbShoppingBagCheck />,
                themeColor: 'green-500',
                totalCount: leadsAPIData.totalCount || 0,
                summaryData: leadsAPIData.summaryData,
                tableData: leadsAPIData.tableData,
            },
            Tasks: {
                label: 'Tasks' as StatisticCategory,
                title: 'Tasks',
                icon: <TbProgressCheck />,
                themeColor: 'pink-500',
                totalCount: taskCounts.total || 0,
                summaryData: Object.entries(taskCounts).map(([key, value], i) => ({ name: formatStatusName(key), value, fill: CHART_COLORS[i % CHART_COLORS.length] })).filter(d => ['Not Started', 'Pending', 'In Progress', 'On Hold', 'Completed'].includes(d.name) && d.value > 0),
                fullData: DashboardTaskData,
            },
            WallListing: {
                label: 'WallListing' as StatisticCategory,
                title: 'Wall Enquiries',
                icon: <TbEye />,
                themeColor: 'orange-500',
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
                icon: <TbWorld />,
                themeColor: 'blue-500',
                totalCount: 0,
                summaryData: [],
            },
        }
    }, [DashboardTaskData, DashboardOpportunityData, DashboardWallData, leadsAPIData, filteredOpportunityData])

    const currentCategory: any = categoryDetails[selectedCategory]

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3>Dashboard Overview</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {Object.values(categoryDetails).map((cat: any) => (
                    <StatisticCard key={cat.label} title={cat.title || cat.label} value={(cat.totalCount || 0).toLocaleString()} icon={cat.icon} label={cat.label} active={selectedCategory === cat.label} onClick={setSelectedCategory} themeColor={cat.themeColor} />
                ))}
            </div>

            <Card>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h5 className="capitalize">{currentCategory.title || currentCategory.label} Summary</h5>
                    <Select className="min-w-[160px]" size="sm" defaultValue={{ label: 'All Time', value: 'All' }} options={[{ label: 'All Time', value: 'All' }, { label: 'Today', value: 'Today' }, { label: 'This Week', value: 'Weekly' }, { label: 'This Month', value: 'Monthly' }]} />
                </div>
                <CategorySummaryChart data={currentCategory.summaryData} />
            </Card>

            <Card>
                <div className="mb-4">
                    <h5 className="mb-1">{currentCategory.title || currentCategory.label} Details</h5>
                    <p className="text-gray-500">
                        {selectedCategory === 'ProductOpportunities' ? "Hot products with both buyers and sellers. Expand a row to see top enquiries." :
                            selectedCategory === 'Tasks' ? "List of all tasks, grouped by current status." :
                                selectedCategory === 'Leads' ? "List of leads grouped by salesperson" :
                                    selectedCategory === 'WallListing' ? "Breakdown of wall enquiries by region, category, and recent activity." : // NEW: Description for Wall Listing
                                        `Detailed list of all ${currentCategory.label.toLowerCase()}`}
                    </p>
                </div>

                {isLoading ? (
                    selectedCategory === 'ProductOpportunities' ? <ProductOpportunitySkeleton /> :
                        selectedCategory === 'Tasks' ? <TaskTableSkeleton /> :
                            selectedCategory === 'Leads' ? <TableSkeleton columns={[{ header: 'Salesperson' }]} skeletonRow={<SalespersonSkeletonRow />} rowCount={2} /> :
                                selectedCategory === 'WallListing' ? <WallListingSkeleton /> : // NEW: Loading skeleton for Wall Listing
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
                                    <DebouceInput className="w-full md:w-1/3 mb-4" placeholder="Search Leads..." prefix={<TbSearch />} onChange={(e) => handleLeadSearch(e.target.value)} />
                                    <LeadsBySalespersonTable data={currentCategory.tableData} />
                                </>
                            ) :
                                selectedCategory === 'WallListing' ? ( // NEW: Render the WallListingDetails component
                                    <WallListingDetails data={currentCategory.wallData} />
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