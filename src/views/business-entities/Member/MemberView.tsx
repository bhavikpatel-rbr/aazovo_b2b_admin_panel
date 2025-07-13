// src/views/members/MemberViewPage.tsx

import React, { useMemo, useEffect, useState, useCallback } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch } from '@/reduxtool/store'
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    SortingState,
} from '@tanstack/react-table'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import { Avatar, Button, Card, Spinner, Tag, Input, Select } from '@/components/ui'
import { DatePicker, Table, Pagination } from '@/components/ui'
import Notification from '@/components/ui/Notification'
import Tabs from '@/components/ui/Tabs'
import toast from '@/components/ui/toast'
const { TabNav, TabList, TabContent } = Tabs
const { Tr, Th, Td, THead, TBody } = Table

// Icons
import { BiChevronRight } from 'react-icons/bi'
import {
    TbArrowLeft,
    TbGlobe,
    TbMail,
    TbPencil,
    TbPhone,
    TbUserCircle,
    TbArrowUp,
    TbArrowDown,
} from 'react-icons/tb'

// Redux
import { getMemberByIdAction } from '@/reduxtool/master/middleware'

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
    const [pageSize, setPageSize] = useState(10)
    const [pageIndex, setPageIndex] = useState(0)

    const table = useReactTable({
        data,
        columns,
        state: { sorting, pagination: { pageIndex, pageSize } },
        onSortingChange: (newSorting) => {
            setSorting(newSorting)
            onSort(newSorting)
        },
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newPage = updater({ pageIndex, pageSize });
                setPageIndex(newPage.pageIndex);
                setPageSize(newPage.pageSize);
            }
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginatedRowModel: getCoreRowModel(),
    })

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
                                No data available in table
                            </Td>
                        </Tr>
                    )}
                </TBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
                <Pagination
                    currentPage={table.getState().pagination.pageIndex + 1}
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
                        onChange={(option) => setPageSize(option?.value || pageSize)}
                    />
                </div>
            </div>
        </div>
    )
}
// --- END: Reusable and Placeholder Components ---

// --- START: Leads Tab Component ---
const LeadsTab = ({ data, loading }: { data: any[], loading: boolean }) => {
    const initialFilters = { status: null, type: null, wantTo: null, search: '' };
    const [filters, setFilters] = useState(initialFilters);
    const [sort, setSort] = useState<SortingState>([]);

    const filteredData = useMemo(() => {
        let leads = data;
        if (filters.status) {
            leads = leads.filter(d => d.status === filters.status.value);
        }
        if (filters.type) {
            // Assuming 'business_type' maps to 'enquiryType'
            leads = leads.filter(d => d.business_type === filters.type.value);
        }
        if (filters.wantTo) {
             // Assuming 'interested_in' maps to 'wantTo'
            leads = leads.filter(d => d.interested_in === filters.wantTo.value);
        }
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            leads = leads.filter(d => 
                Object.values(d).some(val => 
                    String(val).toLowerCase().includes(searchTerm)
                )
            );
        }
        return leads;
    }, [data, filters]);

    const handleFilterChange = (name: string, value: any) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleReset = () => setFilters(initialFilters);

    const columns = useMemo(() => [
        { header: 'Status', accessorKey: 'status' },
        { header: 'Enquiry Type', accessorKey: 'business_type' }, // Mapped to business_type
        { header: 'Want To?', accessorKey: 'interested_in' }, // Mapped to interested_in
        { header: 'Qty', cell: () => 'N/A' }, // Not in lead_members object
        { header: 'Target Price', cell: () => 'N/A' }, // Not in lead_members object
        { header: 'Action', id: 'action', cell: () => <Button size="xs" variant="solid">View</Button> },
    ], []);

    return (
        <Card bordered>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                <Select
                    placeholder="Select Status"
                    options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]}
                    value={filters.status}
                    onChange={(option) => handleFilterChange('status', option)}
                    isClearable
                />
                <Select
                    placeholder="Select Type"
                    options={[{ label: 'Wholesaler', value: 'Wholesaler' }]} // Example from data
                    value={filters.type}
                    onChange={(option) => handleFilterChange('type', option)}
                    isClearable
                />
                <Select
                    placeholder="Select Option"
                    options={[{ label: 'For Buy', value: 'For Buy' }, { label: 'For Sell', value: 'For Sell' }]}
                    value={filters.wantTo}
                    onChange={(option) => handleFilterChange('wantTo', option)}
                    isClearable
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                <div className="md:col-span-3">
                    <label className="block text-sm font-medium mb-1">Search:</label>
                    <Input placeholder="Search..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                </div>
                <div className="flex justify-end"><Button onClick={handleReset}>Reset</Button></div>
            </div>
            <DataTable columns={columns} data={filteredData} loading={loading} onSort={setSort} />
        </Card>
    );
};
// --- END: Leads Tab Component ---

// --- START: Wall Inquiry Tab Component ---
const WallInquiryTab = ({ data, products, loading }: { data: any[], products: any[], loading: boolean }) => {
    const productMap = useMemo(() => {
        return new Map(products.map(p => [p.id, p.name]));
    }, [products]);

    const initialFilters = { createdDate: null, product: null, status: null, wantTo: null, search: '' };
    const [filters, setFilters] = useState(initialFilters);
    const [sort, setSort] = useState<SortingState>([]);

    const filteredData = useMemo(() => {
        let wallItems = data.map(item => ({...item, productName: productMap.get(item.product_id) || `Product ID: ${item.product_id}`}));

        if (filters.product) {
            wallItems = wallItems.filter(item => item.product_id === filters.product.value);
        }
        if (filters.status) {
            wallItems = wallItems.filter(item => item.status === filters.status.value);
        }
        if (filters.wantTo) {
            wallItems = wallItems.filter(item => item.want_to === filters.wantTo.value);
        }
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            wallItems = wallItems.filter(item =>
                Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm))
            );
        }
        return wallItems;
    }, [data, filters, productMap]);
    
    const productOptions = useMemo(() => 
        products.map(p => ({ label: p.name, value: p.id })),
        [products]
    );

    const handleFilterChange = (name: string, value: any) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleReset = () => setFilters(initialFilters);
    
    const columns = useMemo(() => [
        { header: 'Status', accessorKey: 'status' },
        { header: 'Product Name', accessorKey: 'productName' },
        { header: 'Created Date', accessorKey: 'created_at', cell: (props: any) => formatDate(props.getValue()) },
        { header: 'Qty', accessorKey: 'qty' },
        { header: 'Product Status', accessorKey: 'product_status' },
        { header: 'Want To?', accessorKey: 'want_to' },
        { header: 'Action', id: 'action', cell: () => <Button size="xs" variant="solid">View</Button> },
    ], []);

    return (
        <Card bordered>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
                <DatePicker placeholder="Pick date range" value={filters.createdDate} onChange={(date) => handleFilterChange('createdDate', date)} />
                <Select placeholder="Select Product Name" options={productOptions} value={filters.product} onChange={(option) => handleFilterChange('product', option)} isClearable/>
                <Select
                    placeholder="Select Status"
                    options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]}
                    value={filters.status}
                    onChange={(option) => handleFilterChange('status', option)}
                    isClearable
                />
                 <Select
                    placeholder="Select Option"
                    options={[{ label: 'Buy', value: 'Buy' }, { label: 'Sell', value: 'Sell' }]}
                    value={filters.wantTo}
                    onChange={(option) => handleFilterChange('wantTo', option)}
                    isClearable
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Search:</label>
                    <Input placeholder="Search..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} />
                </div>
                <div className="flex justify-end"><Button onClick={handleReset}>Reset</Button></div>
            </div>
            <DataTable columns={columns} data={filteredData} loading={loading} onSort={setSort} />
        </Card>
    );
};
// --- END: Wall Inquiry Tab Component ---

// --- Helper Functions & Components ---
const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="mb-3">
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
    // Safely parse if the list is a JSON string
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

// --- Main View Component ---
const MemberViewPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [memberData, setMemberData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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
            <div className="flex gap-1 items-center mb-3">
                <NavLink to="/business-entities/member"><h6 className="font-semibold hover:text-primary-600">Member</h6></NavLink>
                <BiChevronRight size={22} />
                <h6 className="font-semibold text-primary">Member Profile</h6>
            </div>
            <AdaptiveCard>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar size={90} shape="circle" src={memberData.full_profile_pic} icon={<TbUserCircle />} />
                        <div>
                            <h5 className="font-bold">{memberData.name || 'N/A'}</h5>
                            <div className="flex items-center gap-2 mb-1 text-sm"><TbMail className="text-gray-400" /><p>{memberData.email || 'N/A'}</p></div>
                            <div className="flex items-center gap-2 mb-1 text-sm"><TbPhone className="text-gray-400" /><p>{memberData.number_code} {memberData.number}</p></div>
                            <div className="flex items-center gap-2 text-sm"><TbGlobe className="text-gray-400" /><p>{memberData.country?.name || 'N/A'}</p></div>
                            <Tag className={`mt-2 ${statusColorMap[currentStatus] || ''} capitalize`}>{memberData.status}</Tag>
                        </div>
                    </div>
                    <div className="text-xs space-y-1">
                        <p><b>Temp. Company:</b> {memberData.company_temp}</p>
                        <p><b>Actual Company:</b> {memberData.company_actual}</p>
                        <p><b>Business Type:</b> {memberData.business_type}</p>
                        <p><b>Business Opportunity:</b> <ListAsTags list={memberData.business_opportunity} /></p>
                    </div>
                    <div className="text-xs space-y-1">
                        <p><b>Manager:</b> {memberData.relationship_manager?.name || 'N/A'}</p>
                        <p><b>Interested In:</b> {memberData.interested_in}</p>
                        <p><b>Grade:</b> {memberData.member_grade}</p>
                        <p><b>Dealing in Bulk:</b> {memberData.dealing_in_bulk}</p>
                    </div>
                    <div className="flex flex-col md:flex-row lg:flex-col gap-2">
                        <Button icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/member')}>Back</Button>
                        <Button variant="solid" icon={<TbPencil />} onClick={() => navigate(`/business-entities/member-edit/${id}`)}>Edit Member</Button>
                    </div>
                </div>

                {/* Body Content */}
                <Tabs className="mt-4" defaultValue="member-details">
                    <TabList>
                        <TabNav value="member-details">Member details</TabNav>
                        <TabNav value="wall-inquiry">Wall inquiry</TabNav>
                        <TabNav value="leads">Leads</TabNav>
                        <TabNav value="favorite-products">Favorite Products</TabNav>
                        <TabNav value="assign-brand">Assign Brand</TabNav>
                    </TabList>
                    <div className="mt-6">
                        <TabContent value="member-details">
                            <div className="flex flex-col gap-6">
                                <Card bordered>
                                    <h5 className="mb-4">Basic Information</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6">
                                        <DetailItem label="Member Code" value={memberData.member_code} />
                                        <DetailItem label="Joined Date" value={formatDate(memberData.created_at)} />
                                        <DetailItem label="Last Updated" value={formatDate(memberData.updated_at, true)} />
                                        <DetailItem label="Profile Completion" value={`${memberData.profile_completion}%`} />
                                    </div>
                                </Card>
                                <Card bordered>
                                    <h5 className="mb-4">Contact & Socials</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6">
                                        <DetailItem label="WhatsApp" value={`${memberData.whatsapp_country_code || ''} ${memberData.whatsApp_no || ''}`} />
                                        <DetailItem label="Alternate Email" value={memberData.alternate_email} />
                                        <DetailItem label="Website" value={renderLink(memberData.website)} />
                                        <DetailItem label="LinkedIn" value={renderLink(memberData.linkedIn_profile)} />
                                    </div>
                                </Card>
                                <Card bordered>
                                    <h5 className="mb-4">Address</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6">
                                        <DetailItem label="Address" value={memberData.address} />
                                        <DetailItem label="City" value={memberData.city} />
                                        <DetailItem label="State" value={memberData.state} />
                                        <DetailItem label="Country" value={memberData.country?.name} />
                                    </div>
                                </Card>
                                <Card bordered>
                                    <h5 className="mb-4">Permissions</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6">
                                        <DetailItem label="Product Upload" value={renderPermission(memberData.product_upload_permission)} />
                                        <DetailItem label="Wall Enquiry" value={renderPermission(memberData.wall_enquiry_permission)} />
                                        <DetailItem label="General Enquiry" value={renderPermission(memberData.enquiry_permission)} />
                                        <DetailItem label="Trade Inquiry" value={renderPermission(memberData.trade_inquiry_allowed)} />
                                    </div>
                                </Card>
                            </div>
                        </TabContent>

                        <TabContent value="wall-inquiry">
                            <WallInquiryTab 
                                data={memberData.wall_items || []} 
                                products={memberData.favourite_products_list || []}
                                loading={isLoading} 
                            />
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
                                                    <Avatar shape="square" size={60} src={product.thumb_image_full_path} />
                                                    <div><p className="font-semibold">{product.name}</p></div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-500">No favourite products listed.</p>}
                            </Card>
                        </TabContent>

                        <TabContent value="assign-brand">
                            <Card bordered>
                                <h5 className="mb-4">Assigned Brands & Categories</h5>
                                {memberData.dynamic_member_profiles?.length > 0 ? (
                                    <div className="flex flex-col gap-6">
                                        {memberData.dynamic_member_profiles.map((profile: any, index: number) => (
                                            <div key={profile.id || index} className="p-4 border rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                                <h6 className="font-semibold mb-3">{profile.member_type?.name || `Profile ${index + 1}`}</h6>
                                                <DetailItem label="Brands" value={<ListAsTags list={profile.brand_names} />} />
                                                <div className="mt-2"><DetailItem label="Categories" value={<ListAsTags list={profile.category_names} />} /></div>
                                                <div className="mt-2"><DetailItem label="Sub-Categories" value={<ListAsTags list={profile.sub_category_names} />} /></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-gray-500">No assigned brands or dynamic profiles found.</p>}
                            </Card>
                        </TabContent>
                    </div>
                </Tabs>
            </AdaptiveCard>
        </Container>
    )
}

export default MemberViewPage