import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import classNames from 'classnames';

dayjs.extend(isBetween);

// UI Components (Assuming these are imported from your project's UI library)
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import Spinner from '@/components/ui/Spinner';
import toast from '@/components/ui/toast';
import { DatePicker, Select, Table } from '@/components/ui';
import THead from '@/components/ui/Table/THead';
import Tr from '@/components/ui/Table/Tr';
import TBody from '@/components/ui/Table/TBody';
import Td from '@/components/ui/Table/Td';
import Th from '@/components/ui/Table/Th';

// Icons
import { BiChevronRight, BiSort, BiSortUp, BiSortDown } from 'react-icons/bi';
import { TbPencil, TbArrowLeft, TbBox, TbTag, TbTruckDelivery, TbFileText, TbInfoCircle, TbClipboardList, TbFilter, TbReload, TbWorld, TbKey, TbUserSearch, TbPackage } from 'react-icons/tb';

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { getProductById } from '@/reduxtool/master/middleware';
// import { getProductById } from '@/reduxtool/master/middleware'; // Assuming this is your real thunk

// --- TYPE DEFINITIONS (Updated for the new JSON structure) ---
interface User { id: number; name: string; profile_pic_path?: string; }
interface Category { id: number; name: string; }
interface Brand { id: number; name: string; }
interface Country { id: number; name: string; }
interface Unit { id: number; name: string; }
interface MemberInfo { id: number; name: string; }
interface WallEnquiryItem { id: number; want_to: "Sell" | "Buy"; qty: string | number; price: string | number | null; status: string; product_status: string; device_condition: string | null; created_at: string; member: MemberInfo | null; }
interface ProductLead { id: number; name: string; status: string; created_at: string; brand: Brand; category: Category; sub_category: Category; }
interface ProductData { id: number; name: string; sku_code: string | null; hsn_code: string | null; status: string; description: string | null; short_description: string | null; product_keywords: string | null; icon_full_path: string; created_at: string; updated_at: string; created_by_user: User | null; updated_by_user: User | null; category: Category | null; sub_category: Category | null; brand: Brand | null; country: Country | null; unit1: Unit | null; wall_enquiries: WallEnquiryItem[]; product_leads: ProductLead[]; payment_term: string | null; delivery_details: string | null; packaging_size: string | null; packaging_type: string | null; procurement_lead_time: string | null; tax_rate: string | null; meta_title: string | null; meta_descr: string | null; meta_keyword: string | null; }

// --- REUSABLE UTILS ---
const getStatusClass = (status?: string) => {
  const s = status?.toLowerCase() || '';
  switch (s) {
    case 'active': case 'approved': case 'buy':
      return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100';
    case 'inactive': case 'closed':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100';
    case 'sell':
      return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100';
    case 'pending': case 'open':
      return 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

// --- CUSTOM HOOKS (Made more robust for nested objects) ---
type SortDirection = 'asc' | 'desc';
type SortConfig<T> = { key: keyof T; direction: SortDirection } | null;

const useSortableData = <T extends Record<string, any>>(items: T[], initialConfig: SortConfig<T> = null) => {
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>(initialConfig);

    const sortedItems = useMemo(() => {
        if (!items) return [];
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                
                // Handle nested objects with a 'name' property for sorting
                if (typeof aValue === 'object' && aValue !== null && 'name' in aValue) aValue = aValue.name;
                if (typeof bValue === 'object' && bValue !== null && 'name' in bValue) bValue = bValue.name;

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key: keyof T) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
};

// --- SHARED UI COMPONENTS ---
const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => (
  <div className="pb-6 border-b border-gray-200 dark:border-gray-600 last:pb-0 last:border-b-0">
    <div className="flex items-center gap-2 mb-4">
      {React.cloneElement(icon as React.ReactElement, { size: 22, className: "text-gray-600 dark:text-gray-300" })}
      <h5 className="mb-0">{title}</h5>
    </div>
    <div>{children}</div>
  </div>
);

const InfoPair = ({ label, value }: { label: string; value?: React.ReactNode; }) => (
  <div className="grid grid-cols-2 py-1.5">
    <span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span>
    <span className="break-words">{value || <span className="text-gray-400">N/A</span>}</span>
  </div>
);

const NoDataMessage = ({ message, icon }: { message: string, icon?: React.ReactNode }) => (
    <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-4">
        {icon || <TbPackage size={40} className="text-gray-400" />}
        <span>{message}</span>
    </div>
);

const SortableTh = <T extends Record<string, any>>({ children, sortKey, sortConfig, requestSort }: { children: React.ReactNode; sortKey: keyof T; sortConfig: SortConfig<T>; requestSort: (key: keyof T) => void; }) => {
    const isSorted = sortConfig?.key === sortKey;
    const Icon = isSorted ? (sortConfig?.direction === 'asc' ? BiSortUp : BiSortDown) : BiSort;
    return (
        <Th>
            <span className="cursor-pointer flex items-center gap-2" onClick={() => requestSort(sortKey)}>
                {children}
                <Icon className={isSorted ? 'text-indigo-600' : 'text-gray-400'} />
            </span>
        </Th>
    );
};

// --- FEATURE COMPONENTS ---

const ProductHeader = ({ product }: { product: ProductData }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-grow">
            <Avatar size={60} src={product.icon_full_path} shape="square" icon={<TbBox />} />
            <div>
                <h4 className="font-bold">{product.name || 'Unnamed Product'}</h4>
                <p className="text-sm text-gray-500">SKU: {product.sku_code || 'N/A'}</p>
                <div className="mt-2 flex items-center gap-2">
                    <Tag className={`${getStatusClass(product.status)} capitalize`}>{product.status}</Tag>
                    {product.brand?.name && <Tag>{product.brand.name}</Tag>}
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm flex-shrink-0">
            <InfoPair label="Created By" value={product?.created_by_user?.name} />
            <InfoPair label="Last Updated" value={dayjs(product?.updated_at).format('DD MMM YYYY')} />
        </div>
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 flex-shrink-0">
            <Button icon={<TbPencil />} onClick={() => navigate(`/product-management/products/edit/${product.id}`)}>Edit Product</Button>
            <Button variant="plain" icon={<TbArrowLeft />} onClick={() => navigate('/product-management/products')}>Back to List</Button>
        </div>
    </div>
  );
};

const productNavigationList = [
  { label: "Product Details", link: "details", icon: <TbInfoCircle /> },
  { label: "Wall Enquiries", link: "enquiries", icon: <TbClipboardList /> },
  { label: "Related Leads", link: "leads", icon: <TbUserSearch /> },
  { label: "Keywords & SEO", link: "keywords", icon: <TbKey /> },
];

const ProductNavigator = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (s: string) => void; }) => (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
      {productNavigationList.map((nav) => (
        <button type="button" key={nav.link} className={classNames("cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max flex items-center justify-center gap-2", "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none", activeSection === nav.link ? "bg-indigo-50 dark:bg-indigo-700/60 text-indigo-600 dark:text-indigo-200 font-semibold" : "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200")} onClick={() => onNavigate(nav.link)} title={nav.label}>
          {nav.icon}<span className="font-medium text-xs sm:text-sm truncate">{nav.label}</span>
        </button>
      ))}
    </div>
);

// --- TAB VIEW COMPONENTS ---
const ProductDetailsTabView = ({ product }: { product: ProductData }) => (
    <div className="space-y-8">
        <DetailSection title="Basic Information" icon={<TbInfoCircle />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                <InfoPair label="Product Name" value={product.name} />
                <InfoPair label="SKU Code" value={product.sku_code} />
                <InfoPair label="HSN Code" value={product.hsn_code} />
                <InfoPair label="Status" value={<Tag className={`${getStatusClass(product.status)} capitalize`}>{product.status}</Tag>} />
                <InfoPair label="Base Unit" value={product?.unit1?.name} />
                <InfoPair label="Country of Origin" value={product?.country?.name} />
            </div>
        </DetailSection>
        <DetailSection title="Categorization" icon={<TbTag />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                <InfoPair label="Category" value={product?.category?.name} />
                <InfoPair label="Sub-Category" value={product?.sub_category?.name} />
                <InfoPair label="Brand" value={product?.brand?.name} />
            </div>
        </DetailSection>
        {(product.description && product.description !== '<p>-</p>' || product.short_description && product.short_description !== '<p>-</p>') && (
            <DetailSection title="Description" icon={<TbFileText />}>
                {product.short_description && product.short_description !== '<p>-</p>' && (<><h6 className="font-semibold text-gray-700 dark:text-gray-300">Short Description</h6><div className="mt-1 text-sm mb-4 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.short_description }} /></>)}
                {product.description && product.description !== '<p>-</p>' && (<><h6 className="font-semibold text-gray-700 dark:text-gray-300">Full Description</h6><div className="mt-1 text-sm prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} /></>)}
            </DetailSection>
        )}
        <DetailSection title="Commercial & Logistics" icon={<TbTruckDelivery />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                <InfoPair label="Tax Rate (%)" value={product.tax_rate} />
                <InfoPair label="Payment Term" value={product.payment_term} />
                <InfoPair label="Delivery Details" value={product.delivery_details} />
                <InfoPair label="Packaging Size" value={product.packaging_size} />
                <InfoPair label="Packaging Type" value={product.packaging_type} />
                <InfoPair label="Procurement Lead Time" value={product.procurement_lead_time} />
            </div>
        </DetailSection>
    </div>
);

const WallEnquiriesTabView = ({ enquiries }: { enquiries: WallEnquiryItem[] }) => {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [companyFilter, setCompanyFilter] = useState<{ label: string, value: string } | null>(null);
    const [statusFilter, setStatusFilter] = useState<{ label: string, value: string } | null>(null);
    const [wantToFilter, setWantToFilter] = useState<{ label: string, value: string } | null>(null);

    const companyOptions = useMemo(() => [...new Set(enquiries.filter(e => e.member).map(e => e.member!.name))].map(name => ({ label: name, value: name })), [enquiries]);
    const statusOptions = useMemo(() => [...new Set(enquiries.map(e => e.status))].map(status => ({ label: status, value: status })), [enquiries]);
    const wantToOptions = useMemo(() => [...new Set(enquiries.map(e => e.want_to))].map(type => ({ label: type, value: type })), [enquiries]);

    const filteredEnquiries = useMemo(() => {
        let filtered = [...enquiries];
        const [startDate, endDate] = dateRange;
        if (startDate && endDate) filtered = filtered.filter(e => dayjs(e.created_at).isBetween(dayjs(startDate).startOf('day'), dayjs(endDate).endOf('day')));
        if (companyFilter?.value) filtered = filtered.filter(e => e.member?.name === companyFilter.value);
        if (statusFilter?.value) filtered = filtered.filter(e => e.status === statusFilter.value);
        if (wantToFilter?.value) filtered = filtered.filter(e => e.want_to === wantToFilter.value);
        return filtered;
    }, [enquiries, dateRange, companyFilter, statusFilter, wantToFilter]);
    
    const { items: sortedEnquiries, requestSort, sortConfig } = useSortableData(filteredEnquiries, { key: 'created_at', direction: 'desc' });

    const handleResetFilters = () => {
        setDateRange([null, null]);
        setCompanyFilter(null);
        setStatusFilter(null);
        setWantToFilter(null);
    };
    
    if (!enquiries || enquiries.length === 0) {
        return <NoDataMessage message="No wall enquiries found for this product." />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2"><TbFilter size={20} /><h5 className="mb-0">Filters</h5></div>
                    <Button size="sm" icon={<TbReload />} onClick={handleResetFilters} disabled={!dateRange[0] && !companyFilter && !statusFilter && !wantToFilter}>Reset</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DatePicker.DatePickerRange value={dateRange} onChange={setDateRange} placeholder="Filter by date"/>
                    <Select isClearable placeholder="Filter by company" options={companyOptions} value={companyFilter} onChange={setCompanyFilter} />
                    <Select isClearable placeholder="Filter by status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
                    <Select isClearable placeholder="Filter by Want To" options={wantToOptions} value={wantToFilter} onChange={setWantToFilter} />
                </div>
            </Card>

            <Card>
                <Table>
                    <THead>
                        <Tr>
                            <SortableTh sortKey="id" {...{ requestSort, sortConfig }}>Enquiry ID</SortableTh>
                            <SortableTh sortKey="member" {...{ requestSort, sortConfig }}>Company</SortableTh>
                            <SortableTh sortKey="want_to" {...{ requestSort, sortConfig }}>Type</SortableTh>
                            <SortableTh sortKey="qty" {...{ requestSort, sortConfig }}>Qty</SortableTh>
                            <SortableTh sortKey="status" {...{ requestSort, sortConfig }}>Status</SortableTh>
                            <SortableTh sortKey="created_at" {...{ requestSort, sortConfig }}>Created</SortableTh>
                            {/* <Th>Actions</Th> */}
                        </Tr>
                    </THead>
                    <TBody>
                        {sortedEnquiries.length > 0 ? (
                            sortedEnquiries.map(enquiry => (
                                <Tr key={enquiry.id}>
                                    <Td>#{enquiry.id}</Td>
                                    <Td><span className="font-semibold">{enquiry.member?.name || 'Unknown'}</span></Td>
                                    <Td><Tag className={`${getStatusClass(enquiry.want_to)} font-semibold`}>{enquiry.want_to}</Tag></Td>
                                    <Td>{enquiry.qty}</Td>
                                    <Td><Tag className={getStatusClass(enquiry.status)}>{enquiry.status}</Tag></Td>
                                    <Td>{dayjs(enquiry.created_at).format('DD MMM YYYY')}</Td>
                                    {/* <Td><Button size="sm" onClick={() => navigate(`/wall-enquiries/${enquiry.id}`)}>View</Button></Td> */}
                                </Tr>
                            ))
                        ) : (
                            <Tr><Td colSpan={7}><NoDataMessage message="No enquiries match the current filters." /></Td></Tr>
                        )}
                    </TBody>
                </Table>
            </Card>
        </div>
    );
};

const ProductLeadsTabView = ({ leads }: { leads: ProductLead[] }) => {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [statusFilter, setStatusFilter] = useState<{ label: string, value: string } | null>(null);
    
    const statusOptions = useMemo(() => [...new Set(leads.map(l => l.status))].map(s => ({ label: s, value: s })), [leads]);

    const filteredLeads = useMemo(() => {
        let filtered = [...leads];
        const [startDate, endDate] = dateRange;
        if (startDate && endDate) filtered = filtered.filter(l => dayjs(l.created_at).isBetween(dayjs(startDate).startOf('day'), dayjs(endDate).endOf('day')));
        if (statusFilter?.value) filtered = filtered.filter(l => l.status === statusFilter.value);
        return filtered;
    }, [leads, dateRange, statusFilter]);
    
    const { items: sortedLeads, requestSort, sortConfig } = useSortableData(filteredLeads, { key: 'created_at', direction: 'desc' });

    const handleResetFilters = () => {
        setDateRange([null, null]);
        setStatusFilter(null);
    };

    if (!leads || leads.length === 0) {
        return <NoDataMessage message="No related product leads found for this product." icon={<TbUserSearch size={40} className="text-gray-400" />}/>;
    }

    return (
        <div className="space-y-6">
             <Card>
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2"><TbFilter size={20} /><h5 className="mb-0">Filters</h5></div>
                    <Button size="sm" icon={<TbReload />} onClick={handleResetFilters} disabled={!dateRange[0] && !statusFilter}>Reset</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DatePicker.DatePickerRange value={dateRange} onChange={setDateRange} placeholder="Filter by date"/>
                    <Select isClearable placeholder="Filter by status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
                </div>
            </Card>
            <Card>
                <Table>
                    <THead>
                        <Tr>
                            <SortableTh sortKey="id" {...{ requestSort, sortConfig }}>Lead ID</SortableTh>
                            <SortableTh sortKey="name" {...{ requestSort, sortConfig }}>Product Name</SortableTh>
                            <SortableTh sortKey="brand" {...{ requestSort, sortConfig }}>Brand</SortableTh>
                            <SortableTh sortKey="status" {...{ requestSort, sortConfig }}>Status</SortableTh>
                            <SortableTh sortKey="created_at" {...{ requestSort, sortConfig }}>Created At</SortableTh>
                            {/* <Th>Actions</Th> */}
                        </Tr>
                    </THead>
                    <TBody>
                        {sortedLeads.length > 0 ? (
                            sortedLeads.map(lead => (
                                <Tr key={lead.id}>
                                    <Td>#{lead.id}</Td>
                                    <Td className="font-semibold">{lead.name}</Td>
                                    <Td>{lead.brand?.name || 'N/A'}</Td>
                                    <Td><Tag className={getStatusClass(lead.status)}>{lead.status}</Tag></Td>
                                    <Td>{dayjs(lead.created_at).format('DD MMM YYYY, h:mm A')}</Td>
                                    {/* <Td><Button size="sm" onClick={() => navigate(`/leads/${lead.id}`)}>View</Button></Td> */}
                                </Tr>
                            ))
                        ) : (
                             <Tr><Td colSpan={6}><NoDataMessage message="No leads match the current filters." /></Td></Tr>
                        )}
                    </TBody>
                </Table>
            </Card>
        </div>
    );
};

const ProductKeywordsTabView = ({ product }: { product: ProductData }) => {
    const keywords = useMemo(() => product.product_keywords?.split(',').map(k => k.trim()).filter(Boolean) || [], [product.product_keywords]);
    return (
        <div className="space-y-8">
            <DetailSection title="Search Keywords" icon={<TbKey />}>
                {keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (<Tag key={`${keyword}-${index}`} className="!text-sm">{keyword}</Tag>))}
                    </div>
                ) : ( <NoDataMessage message="No product keywords have been added." /> )}
            </DetailSection>
            <DetailSection title="Meta / SEO Details" icon={<TbWorld />}>
                <div className="space-y-4">
                    <InfoPair label="Meta Title" value={product.meta_title} />
                    <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Meta Description</span>
                        <p className="mt-1 break-words text-sm">{product.meta_descr || <span className="text-gray-400">N/A</span>}</p>
                    </div>
                     <div>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Meta Keywords</span>
                        <p className="mt-1 break-words text-sm">{product.meta_keyword || <span className="text-gray-400">N/A</span>}</p>
                    </div>
                </div>
            </DetailSection>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
const ProductView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [product, setProduct] = useState<ProductData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>(productNavigationList[0].link);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                toast.push(<Notification type="danger" title="Error">No Product ID provided.</Notification>);
                navigate('/product-management/products');
                return;
            }
            setLoading(true);

            try {
                // In a real app, this would be a network request.
                const response = await dispatch(getProductById(id));
                setProduct(response.payload);

                // --- MOCK API SIMULATION with the provided JSON ---
                // const getProductById_Mock = (productId: string) => {
                //     return new Promise((resolve) => {
                //         const apiResponse = {"id":3993,"category_id":1,"sub_category_id":5,"brand_id":1,"sku_code":"-","name":"MACBOOK AIR M4 24GB 512GB MC6C4 (MIDNIGHT)","unit":0,"country_id":0,"color":null,"hsn_code":null,"shelf_life":null,"packaging_size":null,"packaging_type":null,"tax_rate":null,"procurement_lead_time":null,"slug":"macbook-air-m4-24gb-512gb-mc6c4-midnight-","description":"<p>-</p>","short_description":"<p>-</p>","payment_term":null,"delivery_details":null,"thumb_image":null,"icon":"product_icon_1751887840.jpg","product_images":"","status":"Active","unit_id":null,"licence":null,"currency_id":null,"product_specification":null,"meta_title":"-","meta_descr":"-","meta_keyword":"-","created_at":"2025-07-07T06:00:40.000000Z","updated_at":"2025-07-07T06:00:40.000000Z","domain_ids":null,"time":null,"time_type":"1","product_material":null,"minimum_order_quantity":null,"user_id":null,"product_keywords":null,"supplier_product_code":null,"created_by":null,"updated_by":null,"thumb_image_full_path":"https://api.omcommunication.co/product_thumb_images","icon_full_path":"https://api.omcommunication.co/product_icons/product_icon_1751887840.jpg","product_images_array":[],"domains":[],"product_leads":[{"id":44,"category_id":1,"sub_category_id":2,"brand_id":1,"sku_code":"IP001","name":"IPHONE 12 128GB","status":"Active","created_at":"2023-06-14T17:44:09.000000Z","category":{"id":1,"name":"ELECTRONICS"},"sub_category":{"id":2,"name":"MOBILE"},"brand":{"id":1,"name":"APPLE"}},{"id":45,"name":"IPHONE 13 128GB","status":"Active","created_at":"2023-06-14T17:47:26.000000Z","category":{"id":1,"name":"ELECTRONICS"},"sub_category":{"id":2,"name":"MOBILE"},"brand":{"id":1,"name":"APPLE"}}],"created_by_user":null,"updated_by_user":null,"category":{"id":1,"name":"ELECTRONICS"},"sub_category":{"id":5,"name":"LAPTOPS"},"brand":{"id":1,"name":"APPLE"},"country":null,"user":null,"unit1":null,"currency":null,"wall_enquiries":[{"id":276088,"want_to":"Buy","qty":100,"price":0,"status":"Active","product_status":"Active","device_condition":null,"created_at":"2025-07-08T01:58:29.000000Z","member":{"id":17127,"name":"RAHMAT"}},{"id":277926,"want_to":"Sell","qty":1,"price":51000,"status":"Pending","product_status":"Active","device_condition":"New","created_at":"2025-07-23T20:25:45.000000Z","member":null}]};
                //         setTimeout(() => resolve({ payload: apiResponse }), 500);
                //     });
                // };
                
                // const response: any = await getProductById_Mock(id);
                // setProduct(response.payload as ProductData);

            } catch (error) {
                console.error("Failed to fetch product:", error);
                toast.push(<Notification type="danger" title="Error">Could not load product data.</Notification>);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate, dispatch]);

    const renderActiveSection = () => {
        if (!product) return <NoDataMessage message="Product data is not available." />;
        switch (activeSection) {
            case "details": return <ProductDetailsTabView product={product} />;
            case "enquiries": return <WallEnquiriesTabView enquiries={product.wall_enquiries} />;
            case "leads": return <ProductLeadsTabView leads={product.product_leads} />;
            case "keywords": return <ProductKeywordsTabView product={product} />;
            default: return <ProductDetailsTabView product={product} />;
        }
    };

    if (loading) {
        return <Container className="h-full flex justify-center items-center"><Spinner size={40} /></Container>;
    }

    if (!product) {
        return (
            <Container>
                <Card className="text-center p-8">
                    <h4 className="mb-4">Product Not Found</h4>
                    <p>The product you are looking for does not exist or could not be loaded.</p>
                    <Button className="mt-4" onClick={() => navigate('/product-management/products')}>Back to List</Button>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="h-full">
            <div className="flex gap-1 items-end mb-4">
                <NavLink to="/dashboard"><h6 className="font-semibold hover:text-primary-600">Dashboard</h6></NavLink>
                <BiChevronRight size={18} />
                <NavLink to="/product-management/products"><h6 className="font-semibold hover:text-primary-600">Products</h6></NavLink>
                <BiChevronRight size={18} />
                <h6 className="font-semibold text-primary-600">{product.name || `Product #${id}`}</h6>
            </div>
            <Card bodyClass="p-0">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700"><ProductHeader product={product} /></div>
                <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700"><ProductNavigator activeSection={activeSection} onNavigate={setActiveSection} /></div>
                <div className="p-4 sm:p-6">{renderActiveSection()}</div>
            </Card>
        </Container>
    );
};

export default ProductView;