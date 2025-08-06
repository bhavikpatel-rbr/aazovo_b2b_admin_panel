// src/views/members/MemberViewPage.tsx

import React, { useMemo, useEffect, useState, useCallback } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch } from '@/reduxtool/store'
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    useReactTable,
    SortingState,
    CellContext,
} from '@tanstack/react-table'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import { Avatar, Button, Card, Spinner, Tag, Input, Select, Dialog, Tooltip } from '@/components/ui'
import { DatePicker, Table, Pagination } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import Tabs from '@/components/ui/Tabs'
import toast from '@/components/ui/toast'
// Make sure THead and TBody are imported
const { TabNav, TabList, TabContent } = Tabs
const { Tr, Th, Td, THead, TBody } = Table

// Icons
import {
    BiChevronRight
} from 'react-icons/bi'
import {
    TbArrowLeft,
    TbGlobe,
    TbMail,
    TbPencil,
    TbPhone,
    TbUserCircle,
    TbArrowUp,
    TbArrowDown,
    TbShoppingCart,
    TbTag,
    TbUsers,
    TbBuildingStore,
    TbInfoCircle,
} from 'react-icons/tb'

// Redux
import {
    getMemberByIdAction,
    getDemandsAction,
    getOffersAction,
} from '@/reduxtool/master/middleware'


// --- All placeholder components and helper functions remain the same ---
// (DataTable, DetailItem, ListAsTags, formatDate, renderPermission, renderLink, etc.)
// ... (I've omitted them here for brevity, but they are unchanged in your file)

// --- START: Reusable and Placeholder Components ---

const DataTable = ({
    columns,
    data,
    loading,
    onSort,
}: {
    columns: any[]
    data: any[]
    loading: boolean
    onSort: (sorting: SortingState) => void
}) => {
    const [sorting, setSorting] = useState<SortingState>([])

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: (newSorting) => {
            setSorting(newSorting)
            onSort(newSorting)
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginatedRowModel: getPaginationRowModel(),
    })

    const { pageIndex, pageSize } = table.getState().pagination

    return (
        <div>
            <Table>
                <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <Th
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    className="cursor-pointer"
                                    onClick={header.column.getToggleSortingHandler()}
                                >
                                    <div className="flex items-center">
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                        {header.column.getIsSorted() === 'asc' ? (
                                            <TbArrowUp className="ml-2" />
                                        ) : header.column.getIsSorted() === 'desc' ? (
                                            <TbArrowDown className="ml-2" />
                                        ) : null}
                                    </div>
                                </Th>
                            ))}
                        </Tr>
                    ))}
                </THead>
                <TBody>
                    {loading ? (
                        <Tr>
                            <Td colSpan={columns.length}>
                                <div className="flex justify-center p-5">
                                    <Spinner />
                                </div>
                            </Td>
                        </Tr>
                    ) : table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                            <Tr key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <Td key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext(),
                                        )}
                                    </Td>
                                ))}
                            </Tr>
                        ))
                    ) : (
                        <Tr>
                            <Td colSpan={columns.length} className="text-center">
                                No data available
                            </Td>
                        </Tr>
                    )}
                </TBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
                <Pagination
                    currentPage={pageIndex + 1}
                    total={data.length}
                    pageSize={pageSize}
                    onChange={(page) => table.setPageIndex(page - 1)}
                />
                <div style={{ minWidth: 130 }}>
                    <Select
                        size="sm"
                        isSearchable={false}
                        value={{ value: pageSize, label: `${pageSize} / page` }}
                        options={[
                            { value: 10, label: '10 / page' },
                            { value: 20, label: '20 / page' },
                            { value: 50, label: '50 / page' },
                        ]}
                        onChange={(option) => table.setPageSize(option?.value || pageSize)}
                    />
                </div>
            </div>
        </div>
    )
}
// --- END: Reusable and Placeholder Components ---

// --- Helper Functions & Components ---
const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <div className="text-sm font-semibold">
            {(value === '' || value === undefined || value === null) ?
                <span className="text-gray-400 dark:text-gray-500">N/A</span> : value
            }
        </div>
    </div>
);

const ListAsTags = ({ list }: { list: (string | number)[] | undefined | null }) => {
    let items = list;
    if (typeof list === 'string') {
        try {
            items = JSON.parse(list);
        } catch (e) {
            items = [];
        }
    }

    if (!Array.isArray(items) || items.length === 0) {
        return <span className="text-gray-400 dark:text-gray-500">N/A</span>;
    }
    return (
        <div className="flex flex-wrap gap-1">
            {items.map((item, idx) => <Tag key={idx} className="text-xs">{item}</Tag>)}
        </div>
    );
};

const formatDate = (dateString?: string | null, includeTime = false) => {
    if (!dateString) return <span className="text-gray-400 dark:text-gray-500">N/A</span>;
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString('en-GB', options);
};

const renderPermission = (value?: boolean | null | string) => {
    const valStr = String(value).toLowerCase();
    if (valStr === 'true' || valStr === 'approved' || valStr === 'buy' || valStr === 'on request') {
        return <Tag className="bg-emerald-100 text-emerald-600 capitalize">{valStr}</Tag>;
    }
    if (valStr === 'false' || valStr === 'disable' || valStr === 'disabled') {
        return <Tag className="bg-red-100 text-red-600 capitalize">{valStr}</Tag>;
    }
    if (value) {
        return <span className="capitalize">{String(value)}</span>;
    }
    return <span className="text-gray-400 dark:text-gray-500">N/A</span>;
};

const renderLink = (url?: string | null, text?: string) => {
    if (!url) return <span className="text-gray-400 dark:text-gray-500">N/A</span>;
    const isUrl = url.startsWith('http://') || url.startsWith('https://');
    if (isUrl) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                {text || url}
            </a>
        );
    }
    return <span className="break-all">{url}</span>;
};

// --- START: Tab Content Components ---
const LeadsTab = ({ data, loading }: { data: any[], loading: boolean }) => {
    // ... (This component remains unchanged)
    const [filters, setFilters] = useState({ search: '' });
    const [sort, setSort] = useState<SortingState>([]);
    const filteredData = useMemo(() => {
        let leads = data;
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            leads = leads.filter(d => Object.values(d).some(val => String(val).toLowerCase().includes(searchTerm)));
        }
        return leads;
    }, [data, filters]);
    const columns = useMemo(() => [
        { header: 'Status', accessorKey: 'status' },
        { header: 'Enquiry Type', accessorKey: 'business_type' },
        { header: 'Want To?', accessorKey: 'interested_in' },
        { header: 'Company', accessorKey: 'company_actual' },
    ], []);
    return (
        <Card bordered>
            <Input className="mb-4 max-w-sm" placeholder="Search leads..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} />
            <DataTable columns={columns} data={filteredData} loading={loading} onSort={setSort} />
        </Card>
    );
};

const WallInquiryTab = ({ data, loading }: { data: any[], loading: boolean }) => {
    // ... (This component remains unchanged)
    const [filters, setFilters] = useState({ search: '' });
    const [sort, setSort] = useState<SortingState>([]);
    const navigate = useNavigate();
    const filteredData = useMemo(() => {
        let wallItems = data;
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            wallItems = wallItems.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm)) || item.product?.name.toLowerCase().includes(searchTerm));
        }
        return wallItems;
    }, [data, filters]);
    const columns = useMemo(() => [
        { header: 'Status', accessorKey: 'status' },
        { header: 'Product Name', accessorKey: 'product.name' },
        { header: 'Created Date', accessorKey: 'created_at', cell: (props: any) => formatDate(props.getValue()) },
        { header: 'Qty', accessorKey: 'qty' },
        { header: 'Type', accessorKey: 'want_to' },
        { header: 'Action', id: 'action', accessorKey: 'id', cell: (props: any) => <Button size="xs" onClick={() => navigate(`/sales-leads/wall-item/${props.getValue()}`)} variant="solid">View</Button> },
    ], [navigate]);
    return (
        <Card bordered>
            <Input className="mb-4 max-w-sm" placeholder="Search wall inquiries..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} />
            <DataTable columns={columns} data={filteredData} loading={loading} onSort={setSort} />
        </Card>
    );
};
// --- Offer/Demand Components are unchanged ---

const OfferDemandTab = ({ data, loading, onRowClick, type }: { data: any[], loading: boolean, onRowClick: (item: any) => void, type: string }) => {
    const [sort, setSort] = useState<SortingState>([]);
    const columns = useMemo(() => [
        { header: `${type} Name`, accessorKey: 'offer_name' },
        { header: 'Product Name', accessorKey: 'product' },
        { header: 'Product ID', accessorKey: 'product_id' },
        {
            header: 'Action',
            id: 'action',
            cell: ({ row }: CellContext<any, any>) => (
                <Button size="xs" onClick={() => onRowClick(row.original)} variant="solid">
                    View Details
                </Button>
            )
        },
    ], [onRowClick, type]);

    return (
        <Card bordered>
            <DataTable columns={columns} data={data} loading={loading} onSort={setSort} />
        </Card>
    );
};

const OfferDemandDetailDialog = ({ item, type, isOpen, onClose }: { item: any, type: 'Offer' | 'Demand', isOpen: boolean, onClose: () => void }) => {
    const dispatch = useAppDispatch();
    const [detailedData, setDetailedData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!item || !isOpen) return;

        const fetchDetails = async () => {
            setIsLoading(true);
            setDetailedData(null);
            try {
                const action = type === 'Offer'
                    ? getOffersAction()
                    // @ts-ignore
                    : getDemandsAction();

                const response = await dispatch(action).unwrap();
                const Result = response?.data || response || [];
                setDetailedData(Result.find((d: any) => d.id == item.offer_id) || null);
            } catch (error) {
                toast.push(<Notification type="danger" title={`Error fetching ${type} details.`} />);
                console.error(`Error fetching ${type} details:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [item, isOpen, type, dispatch]);

    const renderUser = (user: any, label: string) => (
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{label}</p>
            {user ? (
                <div className="flex items-center gap-2 mt-1">
                    <Avatar size="sm" shape="circle" src={user.profile_pic_path} icon={<TbUserCircle />} />
                    <span className="font-semibold">{user.name}</span>
                </div>
            ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
            )}
        </div>
    );

    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={700}>
            <div className='mb-4'>
                <h5 className="mb-1">{type} Details</h5>
                <p className='text-sm'>Viewing full details for ID: {item.offer_id}</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-10"><Spinner size="lg" /></div>
            ) : !detailedData ? (
                <p>Could not load details for this {type.toLowerCase()}.</p>
            ) : (
                <div className="max-h-[70vh] overflow-y-auto pr-4 -mr-4 space-y-4">
                    <Card bordered>
                        <DetailItem label="Name" value={detailedData.name} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <DetailItem label="Product Name" value={item.product} />
                            <DetailItem label="Product ID" value={detailedData.product_id} />
                            <DetailItem label="Generated ID" value={detailedData.generate_id} />
                            <DetailItem label="Type" value={<Tag className="capitalize">{detailedData.type || type}</Tag>} />
                        </div>
                    </Card>

                    <Card bordered>
                        <h6 className="font-semibold mb-3">People</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {renderUser(detailedData.created_by_user || detailedData.created_by, "Created By")}
                            {renderUser(detailedData.assign_user_data || detailedData.assign_user, "Assigned To")}
                        </div>
                    </Card>

                    <Card bordered>
                        <h6 className="font-semibold mb-3">Group Information</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DetailItem label="Group A" value={detailedData.groupA} />
                            <DetailItem label="Group B" value={detailedData.groupB} />
                        </div>
                    </Card>

                    <Card bordered>
                        <h6 className="font-semibold mb-3">Section Data</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <h6 className="text-sm font-bold mb-1">Sellers ({detailedData.numberOfSellers || 0})</h6>
                                {detailedData.seller_section_data?.length > 0 ? (
                                    <ListAsTags list={detailedData.seller_section_data.map((s: any) => s.name)} />
                                ) : <p className="text-xs text-gray-500">None</p>}
                            </div>
                            <div>
                                <h6 className="text-sm font-bold mb-1">Buyers ({detailedData.numberOfBuyers || 0})</h6>
                                {detailedData.buyer_section_data?.length > 0 ? (
                                    <ListAsTags list={detailedData.buyer_section_data.map((b: any) => b.name)} />
                                ) : <p className="text-xs text-gray-500">None</p>}
                            </div>
                        </div>
                    </Card>

                    <Card bordered>
                        <h6 className="font-semibold mb-3">Timestamps</h6>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DetailItem label="Created At" value={formatDate(detailedData.created_at, true)} />
                            <DetailItem label="Last Updated At" value={formatDate(detailedData.updated_at, true)} />
                        </div>
                    </Card>
                </div>
            )}
            <div className="text-right mt-6">
                <Button variant="solid" onClick={onClose}>Close</Button>
            </div>
        </Dialog>
    );
}

// --- END: Tab Content Components ---

// --- Main View Component ---
const MemberViewPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [memberData, setMemberData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingOfferDemand, setViewingOfferDemand] = useState<{ item: any, type: 'Offer' | 'Demand' } | null>(null);

    // --- STEP 1: Add state for the dynamic profile dialog ---
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

    useEffect(() => {
        if (!id) {
            toast.push(<Notification type="danger" title="Error">No member ID provided.</Notification>);
            navigate('/business-entities/member');
            return;
        }

        const fetchMemberData = async () => {
            setIsLoading(true);
            try {
                const response = await dispatch(getMemberByIdAction(id)).unwrap();
                setMemberData(response);
            } catch (error: any) {
                toast.push(<Notification type="danger" title="Fetch Error">{error?.message || 'Failed to load member data.'}</Notification>);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMemberData();
    }, [id, dispatch, navigate]);

    if (isLoading || !id) {
        return <div className="flex justify-center items-center h-screen"><Spinner size={40} /></div>;
    }

    if (!memberData) {
        return (
            <Container>
                <Card className="text-center p-8">
                    <p>Member not found or failed to load.</p>
                    <Button className="mt-4" onClick={() => navigate('/business-entities/member')}>Back to List</Button>
                </Card>
            </Container>
        );
    }

    const statusColorMap: Record<string, string> = {
        active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
        inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    };
    const currentStatus = (memberData.status || 'inactive').toLowerCase();

    return (
        <Container>
            {/* Header and Member Info Card remain the same */}
            <div className="flex gap-1 items-center mb-3">
                <NavLink to="/business-entities/member"><h6 className="font-semibold hover:text-primary-600">Members</h6></NavLink>
                <BiChevronRight size={22} />
                <h6 className="font-semibold text-primary">Member Profile</h6>
            </div>

            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="flex items-center gap-4 md:col-span-1">
                        <div>
                            <h5 className="font-bold">{memberData.customer_code || 'N/A'} - {memberData.name || 'N/A'}</h5>
                            <Tag className={`mt-2 ${statusColorMap[currentStatus] || ''} capitalize`}>{memberData.status}</Tag>
                            <div className="text-sm mt-2 space-y-1">
                                <div className="flex items-center gap-2"><TbMail className="text-gray-400" /><p>{memberData.email || 'N/A'}</p></div>
                                <div className="flex items-center gap-2"><TbPhone className="text-gray-400" /><p>{memberData.number_code}{memberData.number}</p></div>
                                <div className="flex items-center gap-2"><TbGlobe className="text-gray-400" /><p>{memberData.country?.name || 'N/A'}</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-xs space-y-1.5 md:col-span-1 mt-5">
                        <p><b>Temp. Company:</b> {memberData.company_temp || 'N/A'}</p>
                        <p><b>Actual Company:</b> {memberData.company_actual || 'N/A'}</p>
                        <p><b>Business Type:</b> {memberData.business_type || 'N/A'}</p>
                        <p><b>RM:</b> {memberData.relationship_manager?.name || 'N/A'}</p>
                        
                    </div>
                     <div className="text-xs space-y-1.5 md:col-span-1">
                       
                        <p><b>Business Opportunity:</b> <ListAsTags list={memberData.business_opportunity} /></p>
                        <p> {memberData.category?.split(',').map(s => s.trim())}{memberData.subcategory ?? '/' + memberData.subcategory?.split(',').map(s => s.trim())}</p>

                         <span className="flex items-center gap-1 ">
                                      <Tooltip title="View Dynamic Profiles"><TbInfoCircle size={16} className="text-blue-500 cursor-pointer flex-shrink-0" onClick={() => setIsProfileDialogOpen(true)} /></Tooltip>
                                      <b>View Dynamic Profiles</b>
                                    </span>
                    </div>
                    <div className="flex flex-col md:items-end md:col-span-1 gap-2">
                        <div className="flex flex-row md:flex-col lg:flex-row gap-2 w-full">
                            <Button className="w-full" icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/member')}>Back to List</Button>
                            <Button className="w-full" variant="solid" icon={<TbPencil />} onClick={() => navigate(`/business-entities/member-edit/${id}`)}>Edit Member</Button>
                        </div>
                    </div>
                </div>
            </Card>


            <AdaptiveCard>
                <Tabs defaultValue="member-details">
                    <TabList>
                        <TabNav value="member-details">Member Details</TabNav>
                        <TabNav value="offers">Offers</TabNav>
                        <TabNav value="demands">Demands</TabNav>
                        <TabNav value="wall-inquiry">Wall Inquiry</TabNav>
                        <TabNav value="leads">Leads</TabNav>
                        <TabNav value="favorite-products">Favorite Products</TabNav>
                        {/* <TabNav value="assign-brand">Assign Brand</TabNav> */}
                    </TabList>
                    <div className="mt-6">
                        {/* Member Details Tab remains the same */}
                        <TabContent value="member-details">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card bordered>
                                    <h5 className="mb-4">Basic Information</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                        <DetailItem label="Member Code" value={memberData.customer_code} />
                                        <DetailItem label="Joined Date" value={formatDate(memberData.created_at)} />
                                        <DetailItem label="Last Updated" value={formatDate(memberData.updated_at, true)} />
                                        <DetailItem label="Profile Completion" value={`${memberData.profile_completion}%`} />
                                        <DetailItem label="Interested In" value={memberData.interested_in} />
                                        <DetailItem label="Grade" value={memberData.member_grade} />
                                        <DetailItem label="Dealing in Bulk" value={memberData.dealing_in_bulk} />
                                    </div>
                                </Card>
                                <Card bordered>
                                    <h5 className="mb-4">Contact & Socials</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                        <DetailItem label="WhatsApp" value={`${memberData.whatsapp_country_code || ''} ${memberData.whatsApp_no || ''}`} />
                                        <DetailItem label="Alternate Email" value={memberData.alternate_email} />
                                        <DetailItem label="Website" value={renderLink(memberData.website)} />
                                        <DetailItem label="LinkedIn" value={renderLink(memberData.linkedIn_profile)} />
                                    </div>
                                </Card>
                                <Card bordered className="lg:col-span-2">
                                    <h5 className="mb-4">Address</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                                        <DetailItem label="Address" value={memberData.address} />
                                        <DetailItem label="City" value={memberData.city} />
                                        <DetailItem label="State" value={memberData.state} />
                                        <DetailItem label="Country" value={memberData.country?.name} />
                                    </div>
                                </Card>
                                <Card bordered className="lg:col-span-2">
                                    <h5 className="mb-4">Permissions</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                                        <DetailItem label="Product Upload" value={renderPermission(memberData.product_upload_permission)} />
                                        <DetailItem label="Wall Enquiry" value={renderPermission(memberData.wall_enquiry_permission)} />
                                       
                                        <DetailItem label="Trade Inquiry" value={renderPermission(memberData.trade_inquiry_allowed)} />
                                    </div>
                                </Card>
                            </div>
                        </TabContent>
                        
                        {/* Other tabs remain the same */}
                        <TabContent value="offers">
                            <OfferDemandTab data={memberData.offer_demands?.offers || []} loading={isLoading} type="Offers" onRowClick={(item) => setViewingOfferDemand({ item, type: 'Offer' })} />
                        </TabContent>
                        <TabContent value="demands">
                            <OfferDemandTab data={memberData.offer_demands?.demands || []} loading={isLoading} type="Demands" onRowClick={(item) => setViewingOfferDemand({ item, type: 'Demand' })} />
                        </TabContent>
                        <TabContent value="wall-inquiry">
                            <WallInquiryTab data={memberData.wall_items || []} loading={isLoading} />
                        </TabContent>
                        <TabContent value="leads">
                            <LeadsTab data={memberData.lead_members || []} loading={isLoading} />
                        </TabContent>
                        <TabContent value="favorite-products">
                            <Card bordered>
                                <h5 className="mb-4">Favourite Products</h5>
                                {memberData.favourite_products_list?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {memberData.favourite_products_list.map((product: any) => (
                                            <Card key={product.id} className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar shape="square" size={60} src={product.thumb_image_full_path} icon={<TbBuildingStore />} />
                                                    <div><p className="font-semibold">{product.name}</p></div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-500">No favourite products listed.</p>}
                            </Card>
                        </TabContent>

                        {/* --- STEP 3: Replace the "Assign Brand" tab content --- */}
                       
                    </div>
                </Tabs>
            </AdaptiveCard>

            {/* Other dialogs remain */}
            {viewingOfferDemand && (
                <OfferDemandDetailDialog
                    isOpen={!!viewingOfferDemand}
                    onClose={() => setViewingOfferDemand(null)}
                    item={viewingOfferDemand.item}
                    type={viewingOfferDemand.type}
                />
            )}

            {/* --- STEP 2: Add the new Dynamic Profiles Dialog --- */}
            {isProfileDialogOpen && (
                 <Dialog
                    width={800}
                    isOpen={isProfileDialogOpen}
                    onClose={() => setIsProfileDialogOpen(false)}
                    onRequestClose={() => setIsProfileDialogOpen(false)}
                 >
                    <h5 className="mb-4">Dynamic Profiles for {memberData.name}</h5>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <THead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                                <Tr>
                                    <Th>Member Type</Th>
                                    <Th>Brands</Th>
                                
                                    <Th>Sub Categories</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {memberData.dynamic_member_profiles?.length > 0 ? (
                                    memberData.dynamic_member_profiles.map((p: any) => (
                                        <Tr key={p.id}>
                                            <Td>{p.member_type?.name || 'N/A'}</Td>
                                            <Td><ListAsTags list={p.brand_names} /></Td>
                                            
                                            <Td><ListAsTags list={p.sub_category_names} /></Td>
                                        </Tr>
                                    ))
                                ) : (
                                    <Tr>
                                        <Td colSpan={4} className="text-center py-8">
                                            No dynamic profiles available.
                                        </Td>
                                    </Tr>
                                )}
                            </TBody>
                        </Table>
                    </div>
                    <div className="text-right mt-6">
                        <Button variant="solid" onClick={() => setIsProfileDialogOpen(false)}>
                            Close
                        </Button>
                    </div>
                </Dialog>
            )}
        </Container>
    )
}

export default MemberViewPage