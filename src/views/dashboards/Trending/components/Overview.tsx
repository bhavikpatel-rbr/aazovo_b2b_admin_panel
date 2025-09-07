import { DataTable, DebouceInput } from '@/components/shared'
import { Avatar, Table, Tag } from '@/components/ui'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import THead from '@/components/ui/Table/THead'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import Tr from '@/components/ui/Table/Tr'
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
import {
    MdCancel,
    MdCheckCircle,
    MdOutlineBusinessCenter,
} from 'react-icons/md'
import { IoChevronDown, IoChevronForward } from 'react-icons/io5'
import {
    TbEye,
    TbProgressCheck,
    TbSearch,
    TbShoppingBagCheck,
    TbUserCircle,
    TbWorld,
} from 'react-icons/tb'
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
} from 'recharts'
import type { TableQueries } from '@/@types/common'
import { useAppDispatch } from '@/reduxtool/store'
import { useSelector } from 'react-redux'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { getDashboardLeadsAction } from '@/reduxtool/master/middleware'

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

const OpportunitySkeletonRow = () => (
    <>
        <Td><Skeleton className="h-4 w-12 rounded" /></Td>
        <Td><div className="flex flex-col gap-1.5"><Skeleton className="h-3 w-32 rounded" /><Skeleton className="h-3 w-24 rounded" /></div></Td>
        <Td><div className="flex flex-col gap-1.5"><Skeleton className="h-3 w-28 rounded" /><Skeleton className="h-3 w-20 rounded" /></div></Td>
        <Td><Skeleton className="h-5 w-20 rounded-md" /></Td>
        <Td><div className="flex flex-col gap-1.5"><Skeleton className="h-3 w-24 rounded" /><Skeleton className="h-3 w-16 rounded" /></div></Td>
        <Td><Skeleton className="h-4 w-28 rounded" /></Td>
    </>
)

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

const TaskSkeletonRow = OpportunitySkeletonRow
const WallListingSkeletonRow = OpportunitySkeletonRow
const AccountDocumentSkeletonRow = OpportunitySkeletonRow

// --- END: SKELETON COMPONENTS ---

type StatisticCategory =
    | 'Opportunity'
    | 'Leads'
    | 'Tasks'
    | 'WallListing'
    | 'Company'

// --- START: STATIC DATA MOCK ---

const staticData = {
    response1: { // Opportunities
        data: {
            counts: { total: 128, Active: 95, Pending: 33 },
            data: Array.from({ length: 128 }, (_, i) => ({ id: 1001 + i, opportunity_name: `Project Phoenix ${i + 1}`, customer_name: `Globex Corp ${i % 10}`, status: i % 4 === 0 ? 'Pending' : 'Active', created_at: dayjs().subtract(i, 'day').toISOString(), value: 5000 + i * 150 })),
        },
    },
    response3: { // Tasks
        data: {
            counts: { total: 88, pending: 20, in_progress: 45, completed: 23 },
            data: Array.from({ length: 88 }, (_, i) => ({ id: 3001 + i, task_name: `Deploy server updates ${i + 1}`, assignee: `Alice Johnson`, status: i % 3 === 0 ? 'pending' : (i % 3 === 1 ? 'in_progress' : 'completed'), due_date: dayjs().add(i, 'day').toISOString(), priority: i % 2 === 0 ? 'High' : 'Medium' })),
        },
    },
    response4: { // Wall Listings
        data: {
            counts: { total: 320, buy: 180, sell: 140, active: 290, pending: 30 },
            data: Array.from({ length: 320 }, (_, i) => ({ sku: `SKU-00${4001 + i}`, product_name: `iPhone 15 Pro Max - ${i + 1}`, type: i % 2 === 0 ? 'Buy' : 'Sell', status: i % 10 === 0 ? 'Pending' : 'Active', price: 1200 + i * 10, listed_at: dayjs().subtract(i, 'day').toISOString() })),
        },
    },
    response5: { // Company / Account Documents
        counts: { total: 42, pending: 12, completed: 30 },
        data: Array.from({ length: 42 }, (_, i) => ({ id: 5001 + i, document_name: `KYC Document ${i + 1}`, company_name: `Stark Industries ${i % 5}`, completed: i % 3 !== 0, submitted_at: dayjs().subtract(i, 'week').toISOString() })),
    },
}

// --- END: STATIC DATA MOCK ---

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

// --- START: ENHANCED COMPONENT for Expandable Leads Table ---
type Lead = {
    lead_id: number
    lead_intent: string | null
    status: string
    product_name: string
    buyer: string | null
    supplier: string | null
    created_at: string
}

type SalespersonData = {
    sales_person_id: number
    sales_person_name: string
    lead_count: number
    latest_10_leads: Lead[]
}

const statusColorMapping: { [key: string]: string } = {
    'New': 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
    'Assigned': 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
    'Approved': 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-100',
    'Completed': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    'Deal Done': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    'Rejected': 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    'Cancelled': 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-100',
    'Approval Waiting': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100',
    'Accepted': 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-100',
    'default': 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100',
}

const LeadsBySalespersonTable = ({ data }: { data: SalespersonData[] }) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

    const toggleRow = (id: number) => {
        const newExpandedRows = new Set(expandedRows)
        if (newExpandedRows.has(id)) {
            newExpandedRows.delete(id)
        } else {
            newExpandedRows.add(id)
        }
        setExpandedRows(newExpandedRows)
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed rounded-lg">
                <p className="text-gray-500">No leads found for the current filter.</p>
            </div>
        )
    }

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <Table className="w-full">
                <THead className="bg-gray-50 dark:bg-gray-800 rounded-t-lg">
                    <Tr>
                        <Th style={{ width: '25%' }}>Salesperson / ID</Th>
                        <Th style={{ width: '28%' }}>Product</Th>
                        <Th style={{ width: '12%' }}>Status</Th>
                        <Th style={{ width: '12%' }}>Buyer</Th>
                        <Th style={{ width: '12%' }}>Supplier</Th>
                        <Th style={{ width: '11%' }}>Created At</Th>
                    </Tr>
                </THead>
                <tbody className="align-top divide-y divide-gray-200 dark:divide-gray-700">
                    {data.map((salesperson) => (
                        <Fragment key={salesperson.sales_person_id}>
                            <Tr
                                className="cursor-pointer bg-white dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => toggleRow(salesperson.sales_person_id)}
                            >
                                <Td colSpan={6}>
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg text-gray-400">
                                                {expandedRows.has(salesperson.sales_person_id) ? <IoChevronDown /> : <IoChevronForward />}
                                            </span>
                                            <Avatar size="sm" shape="circle" icon={<TbUserCircle />} />
                                            <span className="font-semibold text-gray-800 dark:text-gray-100">{salesperson.sales_person_name}</span>
                                        </div>
                                        <Tag>{salesperson.lead_count} Lead{salesperson.lead_count !== 1 ? 's' : ''}</Tag>
                                    </div>
                                </Td>
                            </Tr>
                            {expandedRows.has(salesperson.sales_person_id) &&
                                (salesperson.latest_10_leads.length > 0 ? (
                                    salesperson.latest_10_leads.map((lead) => (
                                        <Tr key={lead.lead_id} className="bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                                            <Td className="pl-14">
                                                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">#{lead.lead_id}</span>
                                            </Td>
                                            <Td>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{lead.product_name}</span>
                                            </Td>
                                            <Td>
                                                <Tag className={statusColorMapping[lead.status] || statusColorMapping.default}>{lead.status}</Tag>
                                            </Td>
                                            <Td>
                                                {lead.buyer ? <span>{lead.buyer}</span> : <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>}
                                            </Td>
                                            <Td>
                                                {lead.supplier ? <span>{lead.supplier}</span> : <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>}
                                            </Td>
                                            <Td>
                                                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                    <div>{dayjs(lead.created_at).format('DD MMM YYYY')}</div>
                                                    <div className="text-xs">{dayjs(lead.created_at).format('hh:mm A')}</div>
                                                </div>
                                            </Td>
                                        </Tr>
                                    ))
                                ) : (
                                    <Tr><Td colSpan={6} className="text-center text-gray-400 py-6 bg-gray-50/50 dark:bg-gray-900/50">No recent leads to display for this salesperson.</Td></Tr>
                                ))}
                        </Fragment>
                    ))}
                </tbody>
            </Table>
        </div>
    )
}
// --- END: ENHANCED COMPONENT ---

const CHART_COLORS = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F97316', // orange-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#6366F1', // indigo-500
    '#F59E0B', // amber-500
    '#06B6D4', // cyan-500
]

// --- MAIN COMPONENT ---
const Overview = () => {
    const [selectedCategory, setSelectedCategory] =
        useState<StatisticCategory>('Leads')

    const dispatch = useAppDispatch()
    const { DashboardLeadsData, loading } = useSelector(masterSelector)
    const [leadSearchQuery, setLeadSearchQuery] = useState('')

    useEffect(() => {
        dispatch(getDashboardLeadsAction())
    }, [dispatch])

    const AllCountData = staticData;

    const [tableQueries, setTableQueries] = useState({
        Opportunity: { pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' } as TableQueries,
        Tasks: { pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' } as TableQueries,
        WallListing: { pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' } as TableQueries,
        Company: { pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' } as TableQueries,
    });
    
    const isLoading = (selectedCategory === 'Leads' && loading) || (selectedCategory !== 'Leads' && false)

    const handleTableQueryChange = useCallback(
        (category: StatisticCategory, newQuery: Partial<TableQueries>) => {
            setTableQueries((prev) => ({
                ...prev,
                [category]: { ...prev[category], ...newQuery },
            }))
        },
        [],
    )

    const handleSearch = (category: StatisticCategory, query: string) => {
        if (category === 'Leads') {
            setLeadSearchQuery(query)
        } else {
            handleTableQueryChange(category, { query, pageIndex: 1 })
        }
    }

    const processData = (rawData: any[], queries: TableQueries, searchLogic: (item: any, query: string) => boolean) => {
        if (!rawData) return { pageData: [], total: 0 };
        const { query = '', pageIndex = 1, pageSize = 10, sort = { order: '', key: '' } } = queries;
        let processedData = cloneDeep(rawData);

        if (query) {
            const lowerCaseQuery = query.toLowerCase();
            processedData = processedData.filter(item => searchLogic(item, lowerCaseQuery));
        }

        const { order, key } = sort;
        if (order && key && processedData.length > 0) {
            processedData.sort((a, b) => {
                let aValue = a[key as keyof typeof a];
                let bValue = b[key as keyof typeof b];
                if (aValue === null || aValue === undefined) aValue = "" as any;
                if (bValue === null || bValue === undefined) bValue = "" as any;

                if (typeof aValue === "string" && typeof bValue === "string") {
                    return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                if (typeof aValue === "number" && typeof bValue === "number") {
                    return order === "asc" ? aValue - bValue : bValue - aValue;
                }
                return 0;
            });
        }

        const total = processedData.length;
        const startIndex = (pageIndex - 1) * pageSize;
        const pageData = processedData.slice(startIndex, startIndex + pageSize);
        return { pageData, total };
    };

    const opportunityData = AllCountData?.response1?.data?.data || []
    const tasksData = AllCountData?.response3?.data?.data || []
    const wallListingData = AllCountData?.response4?.data?.data || []
    const companyData = AllCountData?.response5?.data || []

    const { pageData: opportunityPageData, total: opportunityTotal } = useMemo(() => processData(opportunityData, tableQueries.Opportunity, (item, q) => item.opportunity_name?.toLowerCase().includes(q) || item.customer_name?.toLowerCase().includes(q)), [opportunityData, tableQueries.Opportunity]);
    const { pageData: tasksPageData, total: tasksTotal } = useMemo(() => processData(tasksData, tableQueries.Tasks, (item, q) => item.task_name?.toLowerCase().includes(q) || item.assignee?.toLowerCase().includes(q)), [tasksData, tableQueries.Tasks]);
    const { pageData: wallListingPageData, total: wallListingTotal } = useMemo(() => processData(wallListingData, tableQueries.WallListing, (item, q) => item.product_name?.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q)), [wallListingData, tableQueries.WallListing]);
    const { pageData: companyPageData, total: companyTotal } = useMemo(() => processData(companyData, tableQueries.Company, (item, q) => item.document_name?.toLowerCase().includes(q) || item.company_name?.toLowerCase().includes(q)), [companyData, tableQueries.Company]);

    const opportunityColumns = useMemo(() => [{ header: 'ID', accessorKey: 'id' }, { header: 'Opportunity Name', accessorKey: 'opportunity_name' }, { header: 'Customer Name', accessorKey: 'customer_name' }, { header: 'Status', accessorKey: 'status', cell: ({ row }: any) => <Tag className="capitalize">{row.original.status}</Tag> }, { header: 'Created At', accessorKey: 'created_at', cell: ({ row }: any) => dayjs(row.original.created_at).format('DD MMM YYYY') }, { header: 'Value', accessorKey: 'value', cell: ({ row }: any) => `$${Number(row.original.value || 0).toLocaleString()}` },], [])
    const taskColumns = useMemo(() => [{ header: 'ID', accessorKey: 'id' }, { header: 'Task Name', accessorKey: 'task_name' }, { header: 'Assignee', accessorKey: 'assignee' }, { header: 'Status', accessorKey: 'status', cell: ({ row }: any) => <Tag className="capitalize">{row.original.status}</Tag> }, { header: 'Due Date', accessorKey: 'due_date', cell: ({ row }: any) => dayjs(row.original.due_date).format('DD MMM YYYY') }, { header: 'Priority', accessorKey: 'priority' },], [])
    const wallListingColumns = useMemo(() => [{ header: 'SKU', accessorKey: 'sku' }, { header: 'Product Name', accessorKey: 'product_name' }, { header: 'Type', accessorKey: 'type', cell: ({ row }: any) => <Tag className={row.original.type === 'Buy' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}>{row.original.type}</Tag> }, { header: 'Status', accessorKey: 'status', cell: ({ row }: any) => <Tag>{row.original.status}</Tag> }, { header: 'Price', accessorKey: 'price', cell: ({ row }: any) => `$${Number(row.original.price || 0).toLocaleString()}` }, { header: 'Listed At', accessorKey: 'listed_at', cell: ({ row }: any) => dayjs(row.original.listed_at).format('DD MMM YYYY') },], [])
    const companyColumns = useMemo(() => [{ header: 'ID', accessorKey: 'id' }, { header: 'Document Name', accessorKey: 'document_name' }, { header: 'Company Name', accessorKey: 'company_name' }, { header: 'Status', accessorKey: 'status', cell: ({ row }: any) => (row.original.completed ? <MdCheckCircle className="text-green-500 text-xl" /> : <MdCancel className="text-red-500 text-xl" />) }, { header: 'Submitted At', accessorKey: 'submitted_at', cell: ({ row }: any) => dayjs(row.original.submitted_at).format('DD MMM YYYY') },], [])

    const leadsAPIData = useMemo(() => {
        const rawData = DashboardLeadsData?.data || []
        const totalCount = rawData.reduce((acc: number, curr: SalespersonData) => acc + curr.lead_count, 0)
        
        const allLeads = rawData.flatMap((sp: SalespersonData) => sp.latest_10_leads)
        const statusCounts = allLeads.reduce((acc: { [key: string]: number }, lead: Lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
        }, {});
        
        const statusColorMap: { [key: string]: string } = {}
        let colorIndex = 0
        Object.keys(statusCounts).forEach(status => {
            statusColorMap[status] = CHART_COLORS[colorIndex % CHART_COLORS.length]
            colorIndex++
        })

        const summaryData = Object.entries(statusCounts).map(([name, value]) => ({
            name,
            value,
            fill: statusColorMap[name] || '#6B7280'
        }));

        const filteredSalespersonData = rawData.filter((salesperson: SalespersonData) => {
            const query = leadSearchQuery.toLowerCase()
            if (!query) return true
            const nameMatch = salesperson.sales_person_name.toLowerCase().includes(query)
            const leadMatch = salesperson.latest_10_leads.some(lead => lead.product_name.toLowerCase().includes(query))
            return nameMatch || leadMatch
        }).map((salesperson: SalespersonData) => {
            const query = leadSearchQuery.toLowerCase()
            if (query && !salesperson.sales_person_name.toLowerCase().includes(query)) {
                return {
                    ...salesperson,
                    latest_10_leads: salesperson.latest_10_leads.filter(lead => 
                        lead.product_name.toLowerCase().includes(query)
                    )
                }
            }
            return salesperson
        })
        
        return { totalCount, summaryData, tableData: filteredSalespersonData }
    }, [DashboardLeadsData, leadSearchQuery])

    const categoryDetails = useMemo(() => {
        const opportunityCounts = AllCountData?.response1?.data?.counts || {}
        const taskCounts = AllCountData?.response3?.data?.counts || {}
        const wallListingCounts = AllCountData?.response4?.data?.counts || {}
        const companyCounts = AllCountData?.response5?.counts || {}

        return {
            Opportunity: {
                label: 'Opportunity' as StatisticCategory,
                icon: <MdOutlineBusinessCenter />,
                themeColor: 'red-500',
                totalCount: opportunityCounts.total || 0,
                summaryData: [
                    { name: 'Active', value: opportunityCounts.Active || 0, fill: '#28a745' },
                    { name: 'Pending', value: opportunityCounts.Pending || 0, fill: '#ffc107' },
                ],
                tableColumns: opportunityColumns,
                tableData: opportunityPageData,
                tableTotal: opportunityTotal,
                tableQueries: tableQueries.Opportunity,
                skeletonRow: <OpportunitySkeletonRow />,
            },
            Leads: {
                label: 'Leads' as StatisticCategory,
                icon: <TbShoppingBagCheck />,
                themeColor: 'green-500',
                totalCount: leadsAPIData.totalCount || 0,
                summaryData: leadsAPIData.summaryData,
                tableData: leadsAPIData.tableData,
            },
            Tasks: {
                label: 'Tasks' as StatisticCategory,
                icon: <TbProgressCheck />,
                themeColor: 'pink-500',
                totalCount: taskCounts.total || 0,
                summaryData: [
                    { name: 'Pending', value: taskCounts.pending || 0, fill: '#ffc107' },
                    { name: 'In Progress', value: taskCounts.in_progress || 0, fill: '#007bff' },
                    { name: 'Completed', value: taskCounts.completed || 0, fill: '#28a745' },
                ],
                tableColumns: taskColumns,
                tableData: tasksPageData,
                tableTotal: tasksTotal,
                tableQueries: tableQueries.Tasks,
                skeletonRow: <TaskSkeletonRow />,
            },
            WallListing: {
                label: 'WallListing' as StatisticCategory,
                title: 'Wall Listing',
                icon: <TbEye />,
                themeColor: 'orange-500',
                totalCount: wallListingCounts.total || 0,
                summaryData: [
                    { name: 'Buy', value: wallListingCounts.buy || 0, fill: '#28a745' },
                    { name: 'Sell', value: wallListingCounts.sell || 0, fill: '#fd7e14' },
                    { name: 'Active', value: wallListingCounts.active || 0, fill: '#2ecc71' },
                    { name: 'Pending', value: wallListingCounts.pending || 0, fill: '#ffc107' },
                ],
                tableColumns: wallListingColumns,
                tableData: wallListingPageData,
                tableTotal: wallListingTotal,
                tableQueries: tableQueries.WallListing,
                skeletonRow: <WallListingSkeletonRow />,
            },
            Company: {
                label: 'Company' as StatisticCategory,
                title: 'Account Document',
                icon: <TbWorld />,
                themeColor: 'blue-500',
                totalCount: companyCounts.total || 0,
                summaryData: [
                    { name: 'Pending', value: companyCounts.pending || 0, fill: '#ffc107' },
                    { name: 'Completed', value: companyCounts.completed || 0, fill: '#28a745' },
                ],
                tableColumns: companyColumns,
                tableData: companyPageData,
                tableTotal: companyTotal,
                tableQueries: tableQueries.Company,
                skeletonRow: <AccountDocumentSkeletonRow />,
            },
        }
    }, [AllCountData, leadsAPIData, opportunityColumns, taskColumns, wallListingColumns, companyColumns, opportunityPageData, tasksPageData, wallListingPageData, companyPageData, tableQueries, opportunityTotal, tasksTotal, wallListingTotal, companyTotal])

    const currentCategory: any = categoryDetails[selectedCategory]

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3>Dashboard Overview</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {Object.values(categoryDetails).map((cat: any) => (
                    <StatisticCard
                        key={cat.label}
                        title={cat.title || cat.label}
                        value={cat.totalCount.toLocaleString()}
                        icon={cat.icon}
                        label={cat.label}
                        active={selectedCategory === cat.label}
                        onClick={setSelectedCategory}
                        themeColor={cat.themeColor}
                    />
                ))}
            </div>

            <Card>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h5 className="capitalize">
                        {currentCategory.title || currentCategory.label} Summary
                    </h5>
                    <Select
                        className="min-w-[160px]"
                        size="sm"
                        defaultValue={{ label: 'All Time', value: 'All' }}
                        options={[
                            { label: 'All Time', value: 'All' },
                            { label: 'Today', value: 'Today' },
                            { label: 'This Week', value: 'Weekly' },
                            { label: 'This Month', value: 'Monthly' },
                        ]}
                    />
                </div>
                <CategorySummaryChart data={currentCategory.summaryData} />
            </Card>

            <Card>
                <div className="mb-4">
                    <h5 className="mb-1">{currentCategory.title || currentCategory.label} Leaderboard</h5>
                    <p className="text-gray-500">
                        {selectedCategory === 'Leads' 
                            ? "List of leads grouped by salesperson" 
                            : `Detailed list of all ${currentCategory.label.toLowerCase()}`
                        }
                    </p>
                </div>
                <DebouceInput
                    className="w-full md:w-1/3 mb-4"
                    placeholder={`Search ${currentCategory.label}...`}
                    prefix={<TbSearch className="text-lg" />}
                    onChange={(e) => handleSearch(currentCategory.label, e.target.value)}
                />
                
                {isLoading ? (
                    selectedCategory === 'Leads' ? (
                        <Table>
                           <THead>
                               <Tr>
                                    <Th>Salesperson</Th>
                                    <Th>Product</Th>
                                    <Th>Status</Th>
                                    <Th>Buyer</Th>
                                    <Th>Supplier</Th>
                                    <Th>Created At</Th>
                               </Tr>
                           </THead>
                           <tbody>
                                <SalespersonSkeletonRow />
                                <SalespersonSkeletonRow />
                           </tbody>
                        </Table>
                    ) : (
                        <TableSkeleton
                            columns={currentCategory.tableColumns}
                            skeletonRow={currentCategory.skeletonRow}
                        />
                    )
                ) : selectedCategory === 'Leads' ? (
                    <LeadsBySalespersonTable data={currentCategory.tableData} />
                ) : (
                    <DataTable
                        columns={currentCategory.tableColumns}
                        data={currentCategory.tableData}
                        pagingData={{ ...currentCategory.tableQueries, total: currentCategory.tableTotal }}
                        onPaginationChange={(page) => handleTableQueryChange(currentCategory.label, { pageIndex: page })}
                        onSelectChange={(size) => handleTableQueryChange(currentCategory.label, { pageSize: size, pageIndex: 1 })}
                        onSort={(sort) => handleTableQueryChange(currentCategory.label, { sort, pageIndex: 1 })}
                    />
                )}
            </Card>
        </div>
    )
}

export default Overview