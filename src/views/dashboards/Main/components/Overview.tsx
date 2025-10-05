import { DataTable, DebouceInput } from '@/components/shared'
import { Avatar, Dialog, Table, Tag, Tooltip } from '@/components/ui'
import Card from '@/components/ui/Card'
import THead from '@/components/ui/Table/THead'
import Td from '@/components/ui/Table/Td'
import Th from '@/components/ui/Table/Th'
import Tr from '@/components/ui/Table/Tr'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import {
    getAllActionAction,
    getDashboardCompanyAction,
    getDashboardCountsAction,
    getDashboardMemberAction,
    getDashboardPartnerAction,
    getDashboardProductAction,
    getDashboardTeamsAction,
    getEmployeesListingAction,
} from '@/reduxtool/master/middleware'
import { useAppDispatch } from '@/reduxtool/store'
import classNames from '@/utils/classNames'
import dayjs from 'dayjs'
import cloneDeep from 'lodash/cloneDeep'
import {
    BarChart4,
    Boxes,
    Building2,
    CheckCircle2,
    Handshake,
    Info,
    Search,
    UserCircle,
    Users,
    XCircle
} from 'lucide-react'
import {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
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

// --- Type Definitions ---
import type { TableQueries } from '@/@types/common'

// --- START: SKELETON COMPONENTS (Unchanged) ---
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

const CompanySkeletonRow = () => (
    <>
        <Td>
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex flex-col gap-1.5 w-full">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3 w-40 rounded" />
                </div>
            </div>
        </Td>
        <Td>
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-32 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
            </div>
        </Td>
        <Td>
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-5 w-16 rounded-md mt-1" />
            </div>
        </Td>
        <Td>
            <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
        </Td>
        <Td>
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
            </div>
        </Td>
    </>
)

const MemberSkeletonRow = () => (
    <>
        <Td>
            <div className="flex flex-col gap-1.5 w-full">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
            </div>
        </Td>
        <Td>
            <div className="flex flex-col gap-1.5 w-full">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-3 w-40 rounded" />
            </div>
        </Td>
        <Td>
            <Skeleton className="h-5 w-16 rounded-md" />
        </Td>
        <Td>
            <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
        </Td>
        <Td>
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-3 w-36 rounded" />
            </div>
        </Td>
        <Td>
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
            </div>
        </Td>
    </>
)

const ProductSkeletonRow = () => (
    <>
        <Td>
            <Skeleton className="h-4 w-10 mx-auto rounded" />
        </Td>
        <Td>
            <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-48 rounded" />
            </div>
        </Td>
        <Td>
            <Skeleton className="h-4 w-24 rounded" />
        </Td>
        <Td>
            <Skeleton className="h-4 w-24 rounded" />
        </Td>
        <Td>
            <Skeleton className="h-4 w-20 rounded" />
        </Td>
        <Td>
            <Skeleton className="h-5 w-16 rounded-md" />
        </Td>
        <Td>
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
            </div>
        </Td>
    </>
)

const PartnerSkeletonRow = () => <CompanySkeletonRow />

const TeamSkeletonRow = () => (
    <>
        <Td>
            <Skeleton className="h-5 w-16 rounded-md" />
        </Td>
        <Td>
            <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-24 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                </div>
            </div>
        </Td>
        <Td>
            <Skeleton className="h-4 w-28 rounded" />
        </Td>
        <Td>
            <Skeleton className="h-4 w-28 rounded" />
        </Td>
        <Td>
            <div className="flex gap-1">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
            </div>
        </Td>
        <Td>
            <Skeleton className="h-4 w-32 rounded" />
        </Td>
        <Td>
            <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
                <Skeleton className="h-6 w-36 rounded-md" />
            </div>
        </Td>
    </>
)
// --- END: SKELETON COMPONENTS ---

type StatisticCategory =
    | 'Companies'
    | 'Members'
    | 'Products'
    | 'Partners'
    | 'Teams'

// --- NEW & IMPROVED UI COMPONENTS ---
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
                <div className="h-[250px] w-full mt-4 px-4 pb-6 flex items-end justify-around">
                    <Skeleton className="w-8 h-[60%] rounded-t" />
                    <Skeleton className="w-8 h-[80%] rounded-t" />
                    <Skeleton className="w-8 h-[50%] rounded-t" />
                    <Skeleton className="w-8 h-[70%] rounded-t" />
                    <Skeleton className="w-8 h-[90%] rounded-t" />
                    <Skeleton className="w-8 h-[40%] rounded-t" />
                    <Skeleton className="w-8 h-[75%] rounded-t" />
                </div>
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

// --- MAIN COMPONENT ---
const categoryThemes = {
    Companies: { base: 'text-rose-500', gradient: 'bg-gradient-to-br from-rose-400 to-pink-500', color: '#F43F5E' },
    Members: { base: 'text-emerald-500', gradient: 'bg-gradient-to-br from-emerald-400 to-green-500', color: '#10B981' },
    Products: { base: 'text-sky-500', gradient: 'bg-gradient-to-br from-sky-400 to-blue-500', color: '#0EA5E9' },
    Partners: { base: 'text-violet-500', gradient: 'bg-gradient-to-br from-violet-400 to-purple-500', color: '#8B5CF6' },
    Teams: { base: 'text-amber-500', gradient: 'bg-gradient-to-br from-amber-400 to-orange-500', color: '#F59E0B' },
};

// NEW: Color map for different chart statuses
const STATUS_CHART_COLORS: Record<string, string> = {
    // General
    total: '#3B82F6',        // Blue (Primary)
    active: '#10B981',       // Green (Success)
    inactive: '#64748B',     // Slate (Muted)
    disabled: '#EF4444',     // Red (Danger)
    pending: '#F97316',      // Orange (Warning)

    // Verification & Registration
    verified: '#22C55E',     // Strong Green
    unverified: '#EAB308',   // Amber
    unregistered: '#78716C', // Stone

    // Product specific
    categories: '#06B6D4',   // Cyan
    brands: '#6366F1',       // Indigo

    // Team specific
    'on notice': '#F59E0B',    // Amber (different shade)
};


const Overview = () => {
    const [selectedCategory, setSelectedCategory] =
        useState<StatisticCategory>('Companies')
    const dispatch = useAppDispatch()
    const {
        DashboardCompanyData: CompanyData,
        DashboardMemberData: MemberData,
        DashboardProductData: ProductsData,
        DashboardPartnerData: partnerData,
        DashboardTeamData: Employees,
        DashBoardCount,
        loading,
    } = useSelector(masterSelector)

    const [isLoading, setIsLoading] = useState(true)

    const [tableQueries, setTableQueries] = useState({
        Companies: { pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' } as TableQueries,
        Members: { pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' } as TableQueries,
        Products: { pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' } as TableQueries,
        Partners: { pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' } as TableQueries,
        Teams: { pageIndex: 1, pageSize: 10, sort: { order: '', key: '' }, query: '' } as TableQueries,
    });

    // --- DATA FETCHING ---
    useEffect(() => {
        dispatch(getDashboardCountsAction())
        const fetchInitialData = async () => {
            await Promise.all([dispatch(getAllActionAction())])
        }
        fetchInitialData()
    }, [dispatch])

    useEffect(() => {
        const fetchCategoryData = async () => {
            setIsLoading(true)
            let fetchPromise

            switch (selectedCategory) {
                case 'Companies': fetchPromise = dispatch(getDashboardCompanyAction()); break;
                case 'Members': fetchPromise = dispatch(getDashboardMemberAction()); break;
                case 'Products': fetchPromise = dispatch(getDashboardProductAction()); break;
                case 'Partners': fetchPromise = dispatch(getDashboardPartnerAction()); break;
                case 'Teams':
                    fetchPromise = Promise.all([
                        dispatch(getDashboardTeamsAction()),
                        dispatch(getEmployeesListingAction()),
                    ]);
                    break;
            }
            if (fetchPromise) { await fetchPromise }
            setIsLoading(false)
        }
        fetchCategoryData()
    }, [selectedCategory, dispatch])

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
        handleTableQueryChange(category, { query, pageIndex: 1 })
    }

    // --- DATA PROCESSING ---
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

    const { pageData: companyPageData, total: companyTotal } = useMemo(() => processData(CompanyData?.companies || [], tableQueries.Companies, (c, q) => c.company_name?.toLowerCase().includes(q) || c.company_code?.toLowerCase().includes(q) || c.owner_name?.toLowerCase().includes(q) || c.primary_email_id?.toLowerCase().includes(q)), [CompanyData?.companies, tableQueries?.Companies]);
    const { pageData: memberPageData, total: memberTotal } = useMemo(() => processData(MemberData?.members || [], tableQueries.Members, (m, q) => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.number?.toLowerCase().includes(q) || m.company_name?.toLowerCase().includes(q)), [MemberData?.members, tableQueries?.Members]);
    const { pageData: productPageData, total: productTotal } = useMemo(() => processData(ProductsData?.products || [], tableQueries.Products, (p, q) => p.name?.toLowerCase().includes(q) || p.sku_code?.toLowerCase().includes(q) || p.category?.name?.toLowerCase().includes(q)), [ProductsData?.products, tableQueries?.Products]);
    const { pageData: partnerPageData, total: partnerTotal } = useMemo(() => processData(partnerData?.partners || [], tableQueries.Partners, (p, q) => p.partner_name?.toLowerCase().includes(q) || p.partner_code?.toLowerCase().includes(q) || p.primary_email_id?.toLowerCase().includes(q)), [partnerData?.partners, tableQueries.Partners]);
    const { pageData: teamPageData, total: teamTotal } = useMemo(() => processData(Employees?.data || [], tableQueries.Teams, (t, q) => t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.mobile_number?.toLowerCase().includes(q) || t.designation?.name?.toLowerCase().includes(q)), [Employees?.data, tableQueries?.Teams]);

    // --- COLUMN DEFINITIONS (with improved styling) ---
    const getStatusClass = (statusValue?: string, type: 'company' | 'member' | 'partner' = 'company'): string => {
        if (!statusValue) return 'bg-gray-100 text-gray-700 border border-gray-200';
        const s = statusValue.toLowerCase();
        const statusColors: Record<string, string> = {
            active: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            verified: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            pending: 'bg-amber-100 text-amber-700 border border-amber-200',
            inactive: 'bg-rose-100 text-rose-700 border border-rose-200',
            'non verified': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
            disabled: 'bg-stone-100 text-stone-700 border border-stone-200',
            unregistered: 'bg-rose-100 text-rose-700 border border-rose-200'
        };
        return `${statusColors[s] || 'bg-gray-100 text-gray-700 border border-gray-200'} dark:bg-opacity-20 dark:border-opacity-30`;
    };

    const companyColumns = useMemo(() => [{ header: 'Company Info', accessorKey: 'company_name', id: 'companyInfo', size: 220, cell: ({ row }: any) => { const { company_name, ownership_type, primary_business_type, city, state, company_logo, company_code } = row.original; const addressParts = [city, state].filter(Boolean); const addressString = addressParts.length > 0 ? addressParts.join(', ') : ''; return (<div className="flex flex-col"> <div className="flex items-center gap-2"> <Avatar src={company_logo ? `${company_logo}` : undefined} size="sm" shape="circle" icon={<UserCircle />} /> <div> <h6 className="text-xs font-semibold"><em className="text-blue-600">{company_code || " "}</em></h6> <span className="text-xs font-semibold leading-1">{company_name}</span> </div> </div> <span className="text-xs mt-1"><b>Ownership Type:</b> {ownership_type || " "}</span> <span className="text-xs mt-1"><b>Primary Business Type:</b> {primary_business_type || " "}</span> <div className="text-xs text-gray-500">{addressString}</div> </div>); }, }, { header: 'Contact', accessorKey: 'owner_name', id: 'contact', size: 180, cell: (props: any) => { const { owner_name, primary_contact_number, primary_email_id, company_website, primary_contact_number_code } = props.row.original; return (<div className="text-xs flex flex-col gap-0.5"> {owner_name && (<span><b>Owner: </b> {owner_name}</span>)} {primary_contact_number && (<span>{primary_contact_number_code} {primary_contact_number}</span>)} {primary_email_id && (<a href={`mailto:${primary_email_id}`} className="text-blue-600 hover:underline">{primary_email_id}</a>)} {company_website && (<a href={company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{company_website}</a>)} </div>); }, }, { header: 'Legal IDs & Status', accessorKey: 'status', id: 'legal', size: 180, cell: ({ row }: any) => { const { gst_number, pan_number, status } = row.original; return (<div className="flex flex-col gap-0.5 text-[11px]"> {gst_number && <div><b>GST:</b> <span className="break-all">{gst_number}</span></div>} {pan_number && <div><b>PAN:</b> <span className="break-all">{pan_number}</span></div>} <Tag className={`${getStatusClass(status, 'company')} capitalize mt-1 self-start !text-[11px] px-2 py-1`}>{status}</Tag> </div>); }, }, { header: 'Profile & Scores', accessorKey: 'profile_completion', id: 'profile', size: 190, cell: ({ row }: any) => { const { teams_count = 0, kyc_verified, enable_billing, billing_due, members_summary } = row.original; const members_count = members_summary?.total || 0; const profile_completion = members_summary?.profile_completion || 0; const formattedDate = billing_due ? dayjs(billing_due).format('D MMM, YYYY') : " "; return (<div className="flex flex-col gap-1 text-xs"> <span><b>Members:</b> {members_count}</span> <span><b>Teams:</b> {teams_count}</span> <div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${kyc_verified ? "Yes" : "No"}`}>{kyc_verified ? (<CheckCircle2 className="text-green-500 text-lg" />) : (<XCircle className="text-red-500 text-lg" />)}</Tooltip></div> <div className="flex gap-1 items-center"><b>Billing:</b><Tooltip title={`Billing: ${enable_billing ? "Yes" : "No"}`}>{enable_billing ? (<CheckCircle2 className="text-green-500 text-lg" />) : (<XCircle className="text-red-500 text-lg" />)}</Tooltip></div> <span><b>Billing Due:</b> {formattedDate}</span> <Tooltip title={`Profile Completion ${profile_completion}%`}> <div className="h-2.5 w-full rounded-full bg-gray-300"> <div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${profile_completion}%` }}></div> </div> </Tooltip> </div>); }, }, { header: 'Business', accessorKey: 'wallCount', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => { return (<div className='flex flex-col gap-2 text-center items-center '> <Tooltip title={`Buy: ${props.row.original?.walls?.buy || 0} | Sell: ${props.row.original?.walls?.sell || 0} | Total: ${props.row.original?.walls?.total || 0}`} className='text-xs'> <div className='bg-sky-100 text-sky-700 rounded-md p-1.5 text-xs inline-block border border-sky-200'> Wall: {props?.row?.original?.walls?.buy || 0} | {props?.row?.original?.walls?.sell || 0} | {props?.row?.original?.walls?.total || 0} </div> </Tooltip> <Tooltip title={`Offers: ${props.row.original?.opportunities?.offers || 0} | Demands: ${props.row.original?.opportunities?.demands || 0} | Total: ${props.row.original?.opportunities?.total || 0}`} className='text-xs'> <div className='bg-amber-100 text-amber-700 rounded-md p-1.5 text-xs inline-block border border-amber-200'> Ops: {props?.row?.original?.opportunities?.offers || 0} | {props?.row?.original?.opportunities?.demands || 0} | {props?.row?.original?.opportunities?.total || 0} </div> </Tooltip> <Tooltip title={`Success: ${props.row.original?.leads?.success || 0} | Lost: ${props.row.original?.leads?.lost || 0} | Total: ${props.row.original?.leads?.total || 0}`} className='text-xs'> <div className='bg-emerald-100 text-emerald-700 rounded-md p-1.5 text-xs inline-block border border-emerald-200'> Leads: {props?.row?.original?.leads?.success || 0} | {props?.row?.original?.leads?.lost || 0} | {props?.row?.original?.leads?.total || 0} </div> </Tooltip> </div>) } },], [])
    const memberColumns = useMemo(() => [{ header: "Member", accessorKey: "name", id: 'member', size: 180, cell: (props: any) => (<div className="flex flex-col gap-1"><div className="flex items-center gap-1.5"><div className="text-xs"><b className="text-xs text-blue-500"><em>{props.row.original.id || ""}</em></b><br /><b className="texr-xs">{props.row.original.name || ""}</b></div></div><div className="text-xs"><div className="text-xs text-gray-500">{props.row.original.email || "No Email"}</div><div className="text-xs text-gray-500">{props.row.original.number || ""}</div><div className="text-xs text-gray-500">{props.row.original.country?.name || ""}</div></div></div>), }, { header: "Company", accessorKey: "company_name", id: 'company', size: 200, cell: (props: any) => (<div className="ml-2 rtl:mr-2 text-xs"><b className="text-xs "><em className="text-blue-500">{props.row.original.customer_code || ""}</em></b><div className="text-xs flex gap-1"><CheckCircle2 size={20} className="text-green-500" /><b className="">{props.row.original.company_name || "N/A"}</b></div></div>), }, { header: "Status", accessorKey: "status", id: 'status', size: 140, cell: (props: any) => { const { status, created_at } = props.row.original; return (<div className="flex flex-col text-xs"><Tag className={`${getStatusClass(status, 'member')} inline capitalize`}>{status || ""}</Tag><span className="mt-0.5"><div className="text-[10px] text-gray-500 mt-0.5">Joined: {dayjs(created_at).format('D MMM, YYYY') || " "}</div></span></div>); }, }, { header: "Profile", accessorKey: "grade", id: 'profile', size: 220, cell: (props: any) => (<div className="text-xs flex flex-col"><span><b>RM: </b>{props.row.original.name || ""}</span><span><b>Grade: {props.row.original.grade || "N/A"}</b></span><span><b>Business Opportunity: {props.row.original.business_opportunity || "N/A"}</b></span><Tooltip title={`Profile: ${props.row.original.profile_completion || 0}%`}><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${props.row.original.profile_completion || 0}%` }}></div></div></Tooltip></div>), }, { header: "Preferences", accessorKey: "business_type", id: 'preferences', size: 300, cell: (props: any) => { const [isOpen, setIsOpen] = useState<boolean>(false); const openDialog = () => setIsOpen(true); const closeDialog = () => setIsOpen(false); return (<div className="flex flex-col gap-1"><span className="text-xs"><b className="text-xs">Business Type: {props.row.original.business_type || "N/A"}</b></span><span className="text-xs flex items-center gap-1"><span onClick={openDialog}><Info size={16} className="text-blue-500 cursor-pointer" /></span><b className="text-xs">Brands: {props.row.original.favourite_brands || "N/A"}</b></span><span className="text-xs"><span className="text-[11px]"><b className="text-xs">Interested: </b>{props.row.original.interested_in || "N/A"}</span></span><Dialog width={620} isOpen={isOpen} onRequestClose={closeDialog} onClose={closeDialog}><h6>Dynamic Profile</h6><Table className="mt-6"><thead className="bg-gray-100 rounded-md"><Tr><Td width={130}>Member Type</Td><Td>Brands</Td><Td>Category</Td><Td>Sub Category</Td></Tr></thead><tbody><Tr><Td>INS - PREMIUM</Td><Td><span className="flex gap-0.5 flex-wrap"><Tag>Apple</Tag><Tag>Samsung</Tag><Tag>POCO</Tag></span></Td><Td><Tag>Electronics</Tag></Td><Td><span className="flex gap-0.5 flex-wrap"><Tag>Mobile</Tag><Tag>Laptop</Tag></span></Td></Tr></tbody></Table></Dialog></div>); }, }, { header: 'Business', accessorKey: 'wall_total', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => (<div className='flex flex-col gap-2 text-center items-center '><Tooltip title={`Buy: ${props.row.original?.wall_buy || 0} | Sell: ${props.row.original?.wall_sell || 0} | Total: ${props.row.original?.wall_total || 0}`} className='text-xs'><div className='bg-sky-100 text-sky-700 rounded-md p-1.5 text-xs inline-block border border-sky-200'> Wall: {props?.row?.original?.wall_buy || 0} | {props?.row?.original?.wall_sell || 0} | {props?.row?.original?.wall_total || 0} </div></Tooltip><Tooltip title={`Offers: ${props.row.original?.opportunities?.offers || 0} | Demands: ${props.row.original?.opportunities?.demands || 0} | Total: ${props.row.original?.opportunities?.total || 0}`} className='text-xs'><div className='bg-amber-100 text-amber-700 rounded-md p-1.5 text-xs inline-block border border-amber-200'> Ops: {props?.row?.original?.opportunities?.offers || 0} | {props?.row?.original?.opportunities?.demands || 0} | {props?.row?.original?.opportunities?.total || 0} </div></Tooltip><Tooltip title={`Success: ${props.row.original?.lead_success || 0} | Lost: ${props.row.original?.lead_lost || 0} | Total: ${props.row.original?.lead_total || 0}`} className='text-xs'><div className='bg-emerald-100 text-emerald-700 rounded-md p-1.5 text-xs inline-block border border-emerald-200'> Leads: {props?.row?.original?.lead_success || 0} | {props?.row?.original?.lead_lost || 0} | {props?.row?.original?.lead_total || 0} </div></Tooltip></div>) },], [])
    const productColumns = useMemo(() => { const productStatusColor: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700 border border-emerald-200', inactive: 'bg-slate-100 text-slate-700 border border-slate-200', pending: 'bg-amber-100 text-amber-700 border border-amber-200', draft: 'bg-violet-100 text-violet-700 border border-violet-200', rejected: 'bg-rose-100 text-rose-700 border border-rose-200', }; return [{ header: "ID", accessorKey: "id", size: 60, meta: { tdClass: "text-center", thClass: "text-center" }, cell: ({ getValue }: any) => getValue().toString().padStart(6, '0'), }, { header: "Product", id: "productInfo", size: 300, cell: (props: any) => (<div className="flex items-center gap-3"><Avatar size={30} shape="circle" src={props.row.original.icon_full_path || undefined} icon={<Boxes />} /><Tooltip title={props.row.original.name}><div className="truncate"><span className="font-semibold">{props.row.original.name}</span><div className="text-xs text-gray-500">SKU: {props.row.original.sku_code || "-"}</div></div></Tooltip></div>), }, { header: "Category", accessorKey: "category.name", cell: (props: any) => props.row.original.category?.name || "-", }, { header: "Sub Cat", accessorKey: "sub_category.name", cell: (props: any) => props.row.original.sub_category?.name || "-", }, { header: "Brand", accessorKey: "brand.name", cell: (props: any) => props.row.original.brand?.name || "-", }, { header: "Status", accessorKey: "status", cell: (props: any) => { const statusKey = props.row.original.status?.toLowerCase() || ''; return (<Tag className={`${productStatusColor[statusKey] || "bg-gray-100 text-gray-700 border border-gray-200"} capitalize font-semibold dark:bg-opacity-20 dark:border-opacity-30`}>{props.row.original.status}</Tag>) }, }, { header: 'Business', accessorKey: 'walls.total', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => (<div className='flex flex-col gap-2 text-center items-center '><Tooltip title={`Buy: ${props.row.original?.walls?.buy || 0} | Sell: ${props.row.original?.walls?.sell || 0} | Total: ${props.row.original?.walls?.total || 0}`} className='text-xs'><div className='bg-sky-100 text-sky-700 rounded-md p-1.5 text-xs inline-block border border-sky-200'> Wall: {props?.row?.original?.walls?.buy || 0} | {props?.row?.original?.walls?.sell || 0} | {props?.row?.original?.walls?.total || 0} </div></Tooltip><Tooltip title={`Offers: ${props.row.original?.opportunities?.offers || 0} | Demands: ${props.row.original?.opportunities?.demands || 0} | Total: ${props.row.original?.opportunities?.total || 0}`} className='text-xs'><div className='bg-amber-100 text-amber-700 rounded-md p-1.5 text-xs inline-block border border-amber-200'> Ops: {props?.row?.original?.opportunities?.offers || 0} | {props?.row?.original?.opportunities?.demands || 0} | {props?.row?.original?.opportunities?.total || 0} </div></Tooltip><Tooltip title={`Success: ${props.row.original?.leads?.success || 0} | Lost: ${props.row.original?.leads?.lost || 0} | Total: ${props.row.original?.leads?.total || 0}`} className='text-xs'><div className='bg-emerald-100 text-emerald-700 rounded-md p-1.5 text-xs inline-block border border-emerald-200'> Leads: {props?.row?.original?.leads?.success || 0} | {props?.row?.original?.leads?.lost || 0} | {props?.row?.original?.leads?.total || 0} </div></Tooltip></div>) },]; }, [])
    const partnerColumns = useMemo(() => [{ header: "Partner Info", accessorKey: "partner_name", id: 'partnerInfo', size: 220, cell: ({ row }: any) => { const { partner_logo, partner_code, partner_name, ownership_type, city, state } = row.original; const address = [city, state].filter(Boolean).join(', '); return (<div className="flex flex-col"><div className="flex items-center gap-2"><Avatar src={partner_logo || ''} size="md" shape="circle" icon={<UserCircle />} /><div><h6 className="text-xs font-semibold">{partner_code || 'N/A'}</h6><span className="text-xs font-semibold">{partner_name}</span></div></div><span className="text-xs mt-1"><b>Type:</b> {ownership_type}</span><div className="text-xs text-gray-500">{address}</div></div>); }, }, { header: "Contact", id: 'contact', size: 180, cell: ({ row }: any) => { const { partner_name, primary_contact_number, primary_contact_number_code, primary_email_id, partner_website } = row.original; return (<div className="text-xs flex flex-col gap-0.5">{partner_name && <span><b>Contact:</b> {partner_name}</span>}{primary_contact_number && <span>{primary_contact_number_code} {primary_contact_number}</span>}{primary_email_id && <a href={`mailto:${primary_email_id}`} className="text-blue-600 hover:underline">{primary_email_id}</a>}{partner_website && <a href={partner_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{partner_website}</a>}</div>); }, }, { header: "Legal IDs & Status", size: 180, accessorKey: 'status', id: 'legal', cell: ({ row }: any) => { const { gst_number, pan_number, status } = row.original; return (<div className="flex flex-col gap-1 text-[10px]">{gst_number && <div><b>GST:</b> <span className="break-all">{gst_number}</span></div>}{pan_number && <div><b>PAN:</b> <span className="break-all">{pan_number}</span></div>}<Tag className={`${getStatusClass(status, 'partner')} capitalize mt-1 self-start !text-[10px] px-1.5 py-0.5`}>{status}</Tag></div>); }, }, { header: "Profile & Scores", size: 190, id: 'profile', cell: ({ row }: any) => { const teams_count = row.original.team_summary?.total || 0; const kyc_verified = row.original.kyc_verified; const profile_completion = row.original.profile_completion || 0; return (<div className="flex flex-col gap-1.5 text-xs"><span><b>Teams:</b> {teams_count}</span><div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${kyc_verified ? 'Yes' : 'No'}`}>{kyc_verified ? <CheckCircle2 className="text-green-500 text-lg" /> : <XCircle className="text-red-500 text-lg" />}</Tooltip></div><Tooltip title={`Profile Completion ${profile_completion}%`}><div className="h-2.5 w-full rounded-full bg-gray-300"><div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${profile_completion}%` }}></div></div></Tooltip></div>); }, }, { header: 'Business', accessorKey: 'wallCount', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => (<div className='flex flex-col gap-2 text-center items-center '><Tooltip title={`Buy: ${props.row.original?.walls?.buy || 0} | Sell: ${props.row.original?.walls?.sell || 0} | Total: ${props.row.original?.walls?.total || 0}`} className='text-xs'><div className='bg-sky-100 text-sky-700 rounded-md p-1.5 text-xs inline-block border border-sky-200'> Wall: {props?.row?.original?.walls?.buy || 0} | {props?.row?.original?.walls?.sell || 0} | {props?.row?.original?.walls?.total || 0} </div></Tooltip><Tooltip title={`Offers: ${props.row.original?.opportunities?.offers || 0} | Demands: ${props.row.original?.opportunities?.demands || 0} | Total: ${props.row.original?.opportunities?.total || 0}`} className='text-xs'><div className='bg-amber-100 text-amber-700 rounded-md p-1.5 text-xs inline-block border border-amber-200'> Ops: {props?.row?.original?.opportunities?.offers || 0} | {props?.row?.original?.opportunities?.demands || 0} | {props?.row?.original?.opportunities?.total || 0} </div></Tooltip><Tooltip title={`Success: ${props.row.original?.leads?.success || 0} | Lost: ${props.row.original?.leads?.lost || 0} | Total: ${props.row.original?.leads?.total || 0}`} className='text-xs'><div className='bg-emerald-100 text-emerald-700 rounded-md p-1.5 text-xs inline-block border border-emerald-200'> Leads: {props?.row?.original?.leads?.success || 0} | {props?.row?.original?.leads?.lost || 0} | {props?.row?.original?.leads?.total || 0} </div></Tooltip></div>) },], [])
    const teamColumns = useMemo(() => { const employeeStatusColor = { active: 'bg-blue-500', inactive: 'bg-emerald-500', on_leave: 'bg-amber-500', terminated: 'bg-red-500', }; return [{ header: "Status", accessorKey: "status", cell: (props: any) => { const status = props.row.original?.status || 'Unknown'; const statusKey = status.toLowerCase().replace(/ /g, '_'); const colorClass = employeeStatusColor[statusKey as keyof typeof employeeStatusColor] || 'bg-gray-500'; return (<Tag className={`${colorClass} text-white capitalize`}>{status}</Tag>); }, }, { header: "Name", accessorKey: "name", cell: (props: any) => { const { name, email, mobile_number, profile_pic_path } = props.row.original || {}; return (<div className="flex items-center"><Avatar size={28} shape="circle" src={profile_pic_path} icon={<UserCircle />}>{!profile_pic_path && name ? name.charAt(0).toUpperCase() : ""}</Avatar><div className="ml-2 rtl:mr-2"><span className="font-semibold">{name ?? 'N/A'}</span><div className="text-xs text-gray-500">{email ?? 'No Email'}</div><div className="text-xs text-gray-500">{mobile_number ?? 'No Mobile'}</div></div></div>); }, }, { header: "Designation", accessorKey: "designation.name", size: 200, cell: (props: any) => { const designationName = props.row.original?.designation?.name; return (<div className="font-semibold">{designationName ?? 'N/A'}</div>); }, }, { header: "Department", accessorKey: "department.name", size: 200, cell: (props: any) => { const departmentName = props.row.original?.department?.name; return (<div className="font-semibold">{departmentName ?? 'N/A'}</div>); }, }, { header: "Roles", accessorKey: "roles", cell: (props: any) => { const categoryRole = props.row.original?.category?.name; const roleId = props.row.original?.role_id; if (categoryRole) { return <Tag className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 text-[10px]">{categoryRole}</Tag> } if (roleId) { return <span className="text-xs">Role ID: {roleId}</span> } return <span className="text-xs text-gray-500">No Role Assigned</span> }, }, { header: "Joined At", accessorKey: "date_of_joining", size: 200, cell: (props: any) => { const joinDate = props.row.original?.date_of_joining; return joinDate ? (<span className="text-xs">{dayjs(joinDate).format("D MMM YYYY, h:mm A")}</span>) : ('-'); }, }, { header: 'Business', accessorKey: 'wall.total', size: 180, meta: { HeaderClass: 'text-center' }, cell: (props: any) => { const wall = props.row.original?.wall || { buy: 0, sell: 0, total: 0 }; const opportunities = props.row.original?.opportunities || { offers: 0, demands: 0, total: 0 }; const leads = props.row.original?.leads || { total: 0 }; return (<div className='flex flex-col gap-2 text-center items-center'><Tooltip title={`Buy: ${wall.buy} | Sell: ${wall.sell} | Total: ${wall.total}`} className='text-xs'><div className='bg-sky-100 text-sky-700 rounded-md p-1.5 text-xs inline-block border border-sky-200'>Wall: {wall.buy} | {wall.sell} | {wall.total}</div></Tooltip><Tooltip title={`Offers: ${opportunities.offers} | Demands: ${opportunities.demands} | Total: ${opportunities.total}`} className='text-xs'><div className='bg-amber-100 text-amber-700 rounded-md p-1.5 text-xs inline-block border border-amber-200'>Ops: {opportunities.offers} | {opportunities.demands} | {opportunities.total}</div></Tooltip><Tooltip title={`Total: ${leads.total}`} className='text-xs'><div className='bg-emerald-100 text-emerald-700 rounded-md p-1.5 text-xs inline-block border border-emerald-200'>Leads: {leads.total}</div></Tooltip></div>); }, },]; }, [])

    // --- REFACTORED: Central Configuration for Categories ---
    const categoryDetails = useMemo(() => ({
        Companies: {
            label: 'Companies' as StatisticCategory,
            icon: <Building2 size={28} strokeWidth={1.5} />,
            theme: categoryThemes.Companies,
            totalCount: DashBoardCount?.companies || '...',
            // UPDATED: Dynamically assign colors based on status name
            summaryData: (CompanyData ? [
                { name: 'Total', value: CompanyData.total || 0 },
                { name: 'Verified', value: CompanyData.verified || 0 },
                { name: 'Unverified', value: CompanyData.unverified || 0 },
            ] : []).map(d => ({
                ...d,
                fill: STATUS_CHART_COLORS[d.name.toLowerCase()] || categoryThemes.Companies.color,
            })),
            tableColumns: companyColumns,
            tableData: companyPageData,
            tableTotal: companyTotal,
            tableQueries: tableQueries.Companies,
            skeletonRow: <CompanySkeletonRow />,
        },
        Members: {
            label: 'Members' as StatisticCategory,
            icon: <UserCircle size={28} strokeWidth={1.5} />,
            theme: categoryThemes.Members,
            totalCount: DashBoardCount?.customers || '...',
            // UPDATED: Dynamically assign colors based on status name
            summaryData: (MemberData ? [
                { name: 'Total', value: MemberData.total || 0 },
                { name: 'Active', value: MemberData.active || 0 },
                { name: 'Disabled', value: MemberData.disabled || 0 },
                { name: 'Unregistered', value: MemberData.unregistered || 0 },
            ] : []).map(d => ({
                ...d,
                fill: STATUS_CHART_COLORS[d.name.toLowerCase()] || categoryThemes.Members.color,
            })),
            tableColumns: memberColumns,
            tableData: memberPageData,
            tableTotal: memberTotal,
            tableQueries: tableQueries.Members,
            skeletonRow: <MemberSkeletonRow />,
        },
        Products: {
            label: 'Products' as StatisticCategory,
            icon: <Boxes size={28} strokeWidth={1.5} />,
            theme: categoryThemes.Products,
            totalCount: DashBoardCount?.products || '...',
            // UPDATED: Dynamically assign colors based on status name
            summaryData: (ProductsData ? [
                { name: 'Total', value: ProductsData.total || 0 },
                { name: 'Active', value: ProductsData.active || 0 },
                { name: 'Inactive', value: ProductsData.inactive || 0 },
                { name: 'Categories', value: ProductsData.category_count || 0 },
                { name: 'Brands', value: ProductsData.brand_count || 0 },
            ] : []).map(d => ({
                ...d,
                fill: STATUS_CHART_COLORS[d.name.toLowerCase()] || categoryThemes.Products.color,
            })),
            tableColumns: productColumns,
            tableData: productPageData,
            tableTotal: productTotal,
            tableQueries: tableQueries.Products,
            skeletonRow: <ProductSkeletonRow />,
        },
        Partners: {
            label: 'Partners' as StatisticCategory,
            icon: <Handshake size={28} strokeWidth={1.5} />,
            theme: categoryThemes.Partners,
            totalCount: DashBoardCount?.partners || '...',
            // UPDATED: Dynamically assign colors based on status name
            summaryData: (partnerData ? [
                { name: 'Total', value: partnerData.total || 0 },
                { name: 'Active', value: partnerData.active || 0 },
                { name: 'Verified', value: partnerData.verified || 0 },
                { name: 'Unverified', value: partnerData.unverified || 0 },
            ] : []).map(d => ({
                ...d,
                fill: STATUS_CHART_COLORS[d.name.toLowerCase()] || categoryThemes.Partners.color,
            })),
            tableColumns: partnerColumns,
            tableData: partnerPageData,
            tableTotal: partnerTotal,
            tableQueries: tableQueries.Partners,
            skeletonRow: <PartnerSkeletonRow />,
        },
        Teams: {
            label: 'Teams' as StatisticCategory,
            icon: <Users size={28} strokeWidth={1.5} />,
            theme: categoryThemes.Teams,
            totalCount: DashBoardCount?.users || '...',
            // UPDATED: Dynamically assign colors based on status name
            summaryData: (Employees?.counts ? [
                { name: 'Active', value: Employees.counts.active },
                { name: 'Inactive', value: Employees.counts.inactive },
                { name: 'On Notice', value: Employees.counts.on_notice },
            ] : []).map(d => ({
                ...d,
                fill: STATUS_CHART_COLORS[d.name.toLowerCase()] || categoryThemes.Teams.color,
            })),
            tableColumns: teamColumns,
            tableData: teamPageData,
            tableTotal: teamTotal,
            tableQueries: tableQueries.Teams,
            skeletonRow: <TeamSkeletonRow />,
        },
    }), [DashBoardCount, CompanyData, MemberData, ProductsData, partnerData, Employees, companyPageData, memberPageData, productPageData, partnerPageData, teamPageData, tableQueries, companyColumns, memberColumns, productColumns, partnerColumns, teamColumns, companyTotal, memberTotal, productTotal, partnerTotal, teamTotal]);

    const currentCategory = categoryDetails[selectedCategory];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3>Dashboard Overview</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {Object.values(categoryDetails).map((cat) => (
                    <StatisticCard
                        key={cat.label}
                        title={cat.label}
                        value={(cat.totalCount || 0).toLocaleString()}
                        icon={cat.icon}
                        label={cat.label}
                        active={selectedCategory === cat.label}
                        onClick={setSelectedCategory}
                        theme={cat.theme}
                    />
                ))}
            </div>

            <Card>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h5 className="capitalize">
                        {selectedCategory} Summary
                    </h5>
                    {/* <Select
                        className="min-w-[160px]"
                        size="sm"
                        defaultValue={{ label: 'All Time', value: 'All' }}
                        options={[
                            { label: 'All Time', value: 'All' },
                            { label: 'Today', value: 'Today' },
                            { label: 'This Week', value: 'Weekly' },
                            { label: 'This Month', value: 'Monthly' },
                        ]}
                    /> */}
                </div>

                <CategorySummaryChart data={currentCategory.summaryData} />
            </Card>

            <Card>
                <div className="mb-4">
                    <h5 className="mb-1">{currentCategory.label} Leaderboard</h5>
                    <p className="text-gray-500 text-sm">
                        Detailed list of all {currentCategory.label.toLowerCase()}
                    </p>
                </div>
                <DebouceInput
                    className="w-full md:w-1/3 mb-4"
                    placeholder={`Search ${currentCategory.label}...`}
                    prefix={<Search className="text-lg" />}
                    onChange={(e) => handleSearch(currentCategory.label, e.target.value)}
                />
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {isLoading ? (
                        <TableSkeleton
                            columns={currentCategory.tableColumns}
                            skeletonRow={currentCategory.skeletonRow}
                        />
                    ) : (
                        <DataTable
                            columns={currentCategory.tableColumns}
                            data={currentCategory.tableData}
                            loading={loading}
                            pagingData={{ ...currentCategory.tableQueries, total: currentCategory.tableTotal }}
                            onPaginationChange={(page) => handleTableQueryChange(currentCategory.label, { pageIndex: page })}
                            onSelectChange={(size) => handleTableQueryChange(currentCategory.label, { pageSize: size, pageIndex: 1 })}
                            onSort={(sort) => handleTableQueryChange(currentCategory.label, { sort, pageIndex: 1 })}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Overview;