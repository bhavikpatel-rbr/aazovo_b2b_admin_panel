import React, { useState, useMemo, useEffect } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import classNames from 'classnames'

// --- UI Components ---
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import DataTable from '@/components/shared/DataTable'
import Skeleton from '@/components/ui/Skeleton'
import type { ColumnDef } from '@/components/shared/DataTable'

// --- Icons ---
import {
    TbFileText,
    TbBuildingStore,
    TbUser,
    TbListDetails,
    TbClock,
    TbAlertCircle,
    TbArrowLeft,
    TbChevronRight,
    TbCurrencyDollar,
} from 'react-icons/tb'

// --- Redux & API ---
import { useAppDispatch } from '@/reduxtool/store'

// --- TYPE DEFINITIONS ---
type SimpleUser = {
    id: number
    name: string
}

type MemberDetail = {
    id: number
    name: string
    company_actual?: string
}

type Opportunity = {
    id: number
    qty: string
    price: string | null
    location: string | null
    color: string | null
    status: string
    created_at: string
    member: MemberDetail
}

type LeadData = {
    id: number
    lead_intent: 'Buy' | 'Sell'
    qty: number
    target_price: string
    lead_status: string
    enquiry_type: string | null
    internal_remark: string | null
    product_status: string | null
    product_spec: { name: string } | null
    created_at: string
    product: {
        id: number
        name: string
    }
    lead_member_detail: MemberDetail
    source_supplier: MemberDetail
    opportunity: Opportunity[]
    created_by_user: SimpleUser
    assigned_sales_person: SimpleUser | null
}

// MOCK API FUNCTION - This is a "manual thunk"
const apiGetLeadById = (id: string) => async (dispatch: any) => {
    console.log(`Fetching lead with id: ${id}`)
    // This is a placeholder for your actual large JSON data.
    const mockLeadData = { 
        id: 1,
        lead_intent: "Buy",
        qty: 100,
        target_price: "500.00",
        lead_status: "New lead",
        enquiry_type: "Auto lead",
        internal_remark: "High priority client, needs quick response.",
        product_status: "New",
        product_spec: { name: "USA" },
        created_at: "2025-07-16T10:00:00.000000Z",
        product: {
            id: 13,
            name: "APPLE IPHONE 13 128 GB"
        },
        lead_member_detail: {
            id: 17,
            name: "MOHAMMED",
            company_actual: "SAMA BANIYAS PHONE FZE DXB"
        },
        source_supplier: {
            id: 18,
            name: "Global Electronics",
            company_actual: "Global Electronics LLC"
        },
        opportunity: [
            {
                id: 1,
                qty: "50",
                price: "510.00",
                location: "Dubai",
                color: "Midnight Green",
                status: "Available",
                created_at: "2025-07-16T11:00:00.000000Z",
                member: { id: 20, name: "TechSupplies" }
            }
        ],
        created_by_user: { id: 1, name: "Tushar Joshi" },
        assigned_sales_person: { id: 6, name: "Rajnikant Rathod" }
    };
    return { data: mockLeadData };
};

// --- REUSABLE COMPONENTS ---

const StatBox: React.FC<{
    value: string | number | React.ReactNode
    label: string
    className?: string
}> = ({ value, label, className }) => (
    <div className={`text-center px-4 py-2 border-dashed border-gray-200 dark:border-gray-600 ${className}`}>
        <h4 className="font-bold">{value}</h4>
        <p className="text-gray-500 text-sm">{label}</p>
    </div>
)

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{label}</span>
        <span className="text-gray-900 dark:text-gray-50 text-right">{children || '—'}</span>
    </div>
)

const EmptyState: React.FC<{ title: string; message: string }> = ({ title, message }) => (
    <Card>
        <div className="p-8 text-center">
            <h6 className="font-semibold">{title}</h6>
            <p className="text-gray-500">{message}</p>
        </div>
    </Card>
)

// --- HEADER CARD ---

const HeaderCard: React.FC<{ lead: LeadData }> = ({ lead }) => (
    <Card>
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-grow grid grid-cols-2 sm:grid-cols-5 gap-1 w-full">
                <StatBox value={lead.qty} label="Qty" />
                <StatBox value={`$${lead.target_price}`} label="Targeted price" className="sm:border-l" />
                <StatBox value={<Tag className="bg-blue-100 text-blue-600">{lead.lead_status}</Tag>} label="Lead Status" className="sm:border-l" />
                <StatBox value={<Tag className="bg-purple-100 text-purple-600">{lead.enquiry_type || 'Manual lead'}</Tag>} label="Enquiry type" className="sm:border-l" />
                <StatBox value={dayjs(lead.created_at).format('DD MMM YYYY')} label="Created date" className="col-span-2 sm:col-span-1 sm:border-l" />
            </div>
        </div>
    </Card>
)

// --- TAB COMPONENTS ---

const ProductDetailsTab: React.FC<{ lead: LeadData }> = ({ lead }) => (
    <Card>
        <h5 className="font-semibold mb-4">Product details</h5>
        <InfoRow label="Product name">{lead.product?.name}</InfoRow>
        <InfoRow label="Qty">{lead.qty}</InfoRow>
        <InfoRow label="Product status">{lead.product_status || 'Active'}</InfoRow>
        <InfoRow label="Product spec">{lead.product_spec?.name || 'N/A'}</InfoRow>
        <InfoRow label="Internal Remarks">{lead.internal_remark}</InfoRow>
    </Card>
)

const MemberDetailsTab: React.FC<{ title: string; member: MemberDetail | null }> = ({ title, member }) => (
    <Card>
        <h5 className="font-semibold mb-4">{title}</h5>
        {member ? (
            <>
                <InfoRow label="Name">{member.name}</InfoRow>
                <InfoRow label="Company">{member.company_actual || 'N/A'}</InfoRow>
                <InfoRow label="Member ID">{member.id}</InfoRow>
            </>
        ) : (
            <p>No details available.</p>
        )}
    </Card>
)

const OpportunityDetailsTab: React.FC<{ opportunities: Opportunity[] }> = ({ opportunities }) => {
    const columns = useMemo<ColumnDef<Opportunity>[]>(() => [
        { header: 'Opp. ID', accessorKey: 'id' },
        { header: 'Seller', cell: props => props.row.original.member.name },
        { header: 'Qty', accessorKey: 'qty' },
        { header: 'Price', cell: props => props.row.original.price ? `$${props.row.original.price}` : 'N/A' },
        { header: 'Location', accessorKey: 'location' },
        { header: 'Status', cell: props => <Tag className="bg-amber-100 text-amber-600">{props.row.original.status}</Tag> },
    ], []);

    if (!opportunities || opportunities.length === 0) {
        return <EmptyState title="No Opportunities Found" message="There are no matching sell opportunities for this lead yet." />;
    }

    return (
        <Card>
            <DataTable columns={columns} data={opportunities} />
        </Card>
    )
}

// --- MAIN VIEW COMPONENT ---

const LeadView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [lead, setLead] = useState<LeadData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('product_details');

    const tabList = [
        { key: 'product_details', label: 'Product details' },
        { key: 'seller_details', label: 'Seller details' },
        { key: 'buyer_details', label: 'Buyer details' },
        { key: 'opportunity_details', label: 'Opportunity details' },
        { key: 'account', label: 'Account' },
        { key: 'lead_logs', label: 'Lead Logs' },
    ];

    useEffect(() => {
        const fetchLeadData = async () => {
            if (!id) {
                setError('No Lead ID found.');
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // QUICK FIX APPLIED HERE:
                // We await the dispatch call directly, as it's a manual thunk.
                // The .unwrap() method is removed.
                const response = await dispatch(apiGetLeadById(id));
                
                if (response && response.data) {
                    setLead(response.data);
                } else {
                    setError('Lead data could not be loaded.');
                }
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        fetchLeadData();
    }, [id, dispatch]);

    const renderActiveTabContent = () => {
        if (!lead) return null;
        switch (activeTab) {
            case 'product_details':
                return <ProductDetailsTab lead={lead} />;
            case 'seller_details':
                return <MemberDetailsTab title="Seller Details" member={lead.source_supplier} />;
            case 'buyer_details':
                return <MemberDetailsTab title="Buyer Details" member={lead.lead_member_detail} />;
            case 'opportunity_details':
                return <OpportunityDetailsTab opportunities={lead.opportunity} />;
            case 'account':
                return <EmptyState title="Account Information" message="Account and financial details will be displayed here." />;
            case 'lead_logs':
                return <EmptyState title="Lead Logs" message="A complete history of actions taken on this lead will appear here." />;
            default:
                return <ProductDetailsTab lead={lead} />;
        }
    };

    if (loading) {
        return <Container><Skeleton paragraph={{ rows: 8 }} /></Container>;
    }

    if (error) {
        return (
            <Container>
                <Card className="p-8 text-center">
                    <TbAlertCircle className="text-4xl text-red-500 mx-auto mb-4" />
                    <h5 className="mb-2">An Error Occurred</h5>
                    <p className="text-gray-600">{error}</p>
                    <Button className="mt-6" icon={<TbArrowLeft />} onClick={() => navigate(-1)}>Go Back</Button>
                </Card>
            </Container>
        );
    }

    if (!lead) {
        return <Container><EmptyState title="Lead Not Found" message="We couldn't find any data for this lead ID." /></Container>;
    }

    return (
        <Container>
            <div className="flex items-center gap-2 mb-4">
                <NavLink to="/home">Home</NavLink>
                <TbChevronRight />
                <NavLink to="/leads">Leads</NavLink>
                <TbChevronRight />
                <span className="font-semibold">{`Lead #${lead.id}`}</span>
            </div>

            <div className="mb-6">
                <HeaderCard lead={lead} />
            </div>

            <div className="flex flex-row items-center border-b border-gray-200 dark:border-gray-600 mb-6 flex-wrap">
                {tabList.map((tab) => (
                    <button
                        type="button"
                        key={tab.key}
                        className={classNames('px-4 py-3 -mb-px font-semibold focus:outline-none whitespace-nowrap', {
                            'text-indigo-600 border-b-2 border-indigo-600': activeTab === tab.key,
                            'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200': activeTab !== tab.key,
                        })}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div>
                {renderActiveTabContent()}
            </div>
        </Container>
    )
}

export default LeadView