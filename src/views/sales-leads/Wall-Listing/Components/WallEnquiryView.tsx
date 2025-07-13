import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import classNames from 'classnames';

// UI Components
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import Spinner from '@/components/ui/Spinner';
import toast from '@/components/ui/toast';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import {
  TbUserCircle, TbMail, TbPhone, TbBuilding, TbPencil, TbArrowLeft, TbUser, TbFileText,
  TbWorld, TbBox, TbTag, TbTruckDelivery, TbBuildingStore, TbNotes, TbHourglass,
  TbListDetails, TbId, TbUserSearch, TbCalendar, TbLicense,
  TbFilter,
  TbEraser,
  TbReload
} from 'react-icons/tb';

// Redux (Assuming similar structure)
import { getWallItemById } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';
import { DatePicker, Select, Table } from '@/components/ui';
import THead from '@/components/ui/Table/THead';
import Tr from '@/components/ui/Table/Tr';
import TBody from '@/components/ui/Table/TBody';
import Td from '@/components/ui/Table/Td';
import Th from '@/components/ui/Table/Th';


// --- Type Definitions for Wall Enquiry API Response ---
interface User {
    id: number;
    name: string;
    profile_pic_path?: string;
    email: string;
    employee_id?: string;
}

interface ProductCategory {
    id: number;
    name:string;
}

interface ProductSubCategory {
    id: number;
    name: string;
}

interface ProductBrand {
    id: number;
    name: string;
}

interface ProductInfo {
    id: number;
    name: string;
    description: string | null;
    status: string;
    category?: ProductCategory;
    sub_category?: ProductSubCategory;
    brand?: ProductBrand;
    sku_code?:string;
    thumb_image_full_path?: string;
}

interface CustomerInfo {
    id: number;
    name: string;
    member_code: string;
    interested_in: string;
    number: string;
    email: string;
    company_temp: string;
    company_actual: string;
    company_code: string;
    business_type: string;
    status: string;
    state: string;
    city: string;
    address: string | null;
    website: string | null;
    wall_listing_permission: string | null;
    trade_inquiry_permission: string | null;
}

interface LeadInfo {
    id: number;
    lead_intent: string;
    enquiry_type: string; // <-- ADD THIS LINE
    lead_status: string;
    qty: number;
    created_at: string;
    created_by_user?: User;
}

interface WallEnquiryData {
    id: number;
    want_to: "Sell" | "Buy";
    qty: string;
    price: string | null;
    status: string;
    product_status: string;
    device_condition: string | null;
    location: string | null;
    warranty: string | null;
    payment_term: string | null;
    shipping_options: string | null;
    dispatch_mode: string | null;
    delivery_details: string | null;
    internal_remarks: string | null;
    created_at: string;
    updated_at: string;
    created_by_user: User;
    updated_by_user: User;
    product: ProductInfo;
    customer: CustomerInfo | null;
    company: any | null; // This is null in the example, Customer has company info
    get_leads: LeadInfo | LeadInfo[] | null;
}

interface WallEnquiryApiResponse {
    status: boolean;
    message: string;
    data: WallEnquiryData;
}

// --- Reusable Helper Components ---
const getStatusClass = (status?: string) => {
  const s = status?.toLowerCase() || '';
  switch (s) {
    case 'active':
    case 'approved':
    case 'verified':
    case 'buy':
      return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100';
    case 'inactive':
    case 'new':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100';
    case 'blocked':
    case 'rejected':
    case 'sell':
      return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100';
    case 'pending':
      return 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => (
  <div className="pb-6 border-b border-gray-200 dark:border-gray-600 last:pb-0 last:border-b-0">
    <div className="flex items-center gap-2 mb-4">
      {React.cloneElement(icon as React.ReactElement, { size: 22 })}
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

const NoDataMessage = ({ message }: { message: string }) => <div className="text-center py-8 text-gray-500">{message}</div>;

// --- HEADER & NAVIGATION ---
const WallEnquiryHeader = ({ enquiry }: { enquiry: WallEnquiryData }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {/* {enquiry.product?.thumb_image_full_path ? (
          <Avatar size={60} src={enquiry.product.thumb_image_full_path} shape="square" />
        ) : (
          <Avatar size={60} icon={<TbBox />} shape="square" />
        )} */}
        <div>
          <h4 className="font-bold">{enquiry.product?.name || 'N/A'}</h4>
          <p className="text-sm text-gray-500">Quantity: {enquiry.qty}</p>
          <div className="mt-2 flex items-center gap-2">
            <Tag className={`${getStatusClass(enquiry.want_to)} font-bold`}>{enquiry.want_to}</Tag>
            <Tag className={`${getStatusClass(enquiry.status)} capitalize`}>{enquiry.status}</Tag>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm">
        <InfoPair label="Created By" value={enquiry.created_by_user?.name} />
        <InfoPair label="Created At" value={dayjs(enquiry.created_at).format('DD MMM YYYY')} />
      </div>
      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
        {/* <Button variant="solid" icon={<TbPencil />} onClick={() => navigate('/sales-leads/wall-listing')}>Edit Enquiry</Button> */}
        <Button icon={<TbArrowLeft />} onClick={() => navigate('/sales-leads/wall-listing')}>Back to List</Button>
      </div>
    </div>
  );
};

const wallEnquiryNavigationList = [
  { label: "Product Details", link: "product", icon: <TbBox /> },
  { label: "Company Details", link: "company", icon: <TbBuildingStore /> },
  { label: "Leads", link: "leads", icon: <TbUserSearch /> },
];

const WallEnquiryNavigator = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (s: string) => void; }) => (
  <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
    {wallEnquiryNavigationList.map((nav) => (
      <button type="button" key={nav.link} className={classNames("cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max flex items-center justify-center gap-2", "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none", activeSection === nav.link ? "bg-indigo-50 dark:bg-indigo-700/60 text-indigo-600 dark:text-indigo-200 font-semibold" : "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200")} onClick={() => onNavigate(nav.link)} title={nav.label}>
        {nav.icon}<span className="font-medium text-xs sm:text-sm truncate">{nav.label}</span>
      </button>
    ))}
  </div>
);

// --- TAB VIEW COMPONENTS ---
const ProductDetailsTabView = ({ enquiry }: { enquiry: WallEnquiryData }) => (
    <div className="space-y-6">
      <DetailSection title="Listing Details" icon={<TbListDetails />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
          <InfoPair label="Want to" value={<Tag className={`${getStatusClass(enquiry.want_to)} font-bold`}>{enquiry.want_to}</Tag>} />
          <InfoPair label="Quantity" value={enquiry.qty} />
          {/* <InfoPair label="Price" value={enquiry.price || 'Not Specified'} /> */}
          <InfoPair label="Listing Status" value={<Tag className={`${getStatusClass(enquiry.status)} capitalize`}>{enquiry.status}</Tag>} />
          <InfoPair label="Product Status" value={enquiry.product_status} />
          {/* <InfoPair label="Location" value={enquiry.location} />
          <InfoPair label="Warranty" value={enquiry.warranty} />
          <InfoPair label="Device Condition" value={enquiry.device_condition} /> */}
        </div>
      </DetailSection>
  
      <DetailSection title="Product Information" icon={<TbBox />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
          <InfoPair label="Product Name" value={enquiry.product?.name} />
          <InfoPair label="Brand" value={enquiry.product?.brand?.name} />
          <InfoPair label="SKU Code" value={enquiry.product?.sku_code} />
          <InfoPair label="Category" value={enquiry.product?.category?.name} />
          <InfoPair label="Sub-Category" value={enquiry.product?.sub_category?.name} />
        </div>
         {enquiry.product?.description && (
            <div className="mt-4">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Description</span>
              <p className="mt-1 text-sm">{enquiry.product.description}</p>
            </div>
         )}
      </DetailSection>
  
      {/* <DetailSection title="Logistics & Terms" icon={<TbTruckDelivery />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
          <InfoPair label="Payment Term" value={enquiry.payment_term} />
          <InfoPair label="Shipping Options" value={enquiry.shipping_options} />
          <InfoPair label="Dispatch Mode" value={enquiry.dispatch_mode} />
          <InfoPair label="Delivery Details" value={enquiry.delivery_details} />
        </div>
      </DetailSection> */}
  
      {enquiry.internal_remarks && (
        <DetailSection title="Internal Remarks" icon={<TbNotes />}>
          <p className="text-sm">{enquiry.internal_remarks}</p>
        </DetailSection>
      )}
    </div>
);

const CompanyDetailsTabView = ({ customer }: { customer: CustomerInfo | null }) => {
    if (!customer) {
      return <NoDataMessage message="No company or customer details available for this enquiry." />;
    }
  
    return (
      <div className="space-y-6">
        <DetailSection title="Primary Information" icon={<TbId />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            <InfoPair label="Customer Name" value={customer.name} />
            <InfoPair label="Company Name" value={customer.company_actual || customer.company_temp} />
            <InfoPair label="Member Code" value={customer.member_code} />
            <InfoPair label="Business Type" value={customer.business_type} />
            <InfoPair label="Status" value={<Tag className={`${getStatusClass(customer.status)} capitalize`}>{customer.status}</Tag>} />
          </div>
        </DetailSection>
  
        <DetailSection title="Contact Information" icon={<TbPhone />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            <InfoPair label="Email" value={customer.email ? <a href={`mailto:${customer.email}`} className="text-blue-500 hover:underline">{customer.email}</a> : 'N/A'} />
            <InfoPair label="Phone Number" value={customer.number} />
            <InfoPair label="Website" value={customer.website ? <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{customer.website}</a> : 'N/A'} />
          </div>
        </DetailSection>
        
        <DetailSection title="Location" icon={<TbWorld />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            <InfoPair label="Address" value={customer.address} />
            <InfoPair label="City" value={customer.city} />
            <InfoPair label="State" value={customer.state} />
          </div>
        </DetailSection>
  
        <DetailSection title="Platform Permissions" icon={<TbLicense />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            <InfoPair label="Wall Listing" value={customer.wall_listing_permission} />
            <InfoPair label="Trade Inquiry" value={customer.trade_inquiry_permission} />
          </div>
        </DetailSection>
      </div>
    );
};

// Replace the existing LeadsTabView with this one

const LeadsTabView = ({ leadsData, customer }: { leadsData: LeadInfo | LeadInfo[] | null; customer: CustomerInfo | null }) => {
    const leads = useMemo(() => {
        if (!leadsData) return [];
        return Array.isArray(leadsData) ? leadsData : [leadsData];
    }, [leadsData]);

    // --- Filter States ---
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [statusFilter, setStatusFilter] = useState<{ label: string, value: string } | null>(null);
    const [intentFilter, setIntentFilter] = useState<{ label: string, value: string } | null>(null);
    const [enquiryTypeFilter, setEnquiryTypeFilter] = useState<{ label: string, value: string } | null>(null); // New state for inquiry type

    // --- Dynamic options for filters ---
    const statusOptions = useMemo(() =>
        [...new Set(leads.map(lead => lead.lead_status))]
        .map(status => ({ label: status, value: status })),
        [leads]
    );

    const intentOptions = useMemo(() =>
        [...new Set(leads.map(lead => lead.lead_intent))]
        .map(intent => ({ label: intent, value: intent })),
        [leads]
    );
    
    // New options for inquiry type
    const enquiryTypeOptions = useMemo(() =>
        [...new Set(leads.map(lead => lead.enquiry_type).filter(Boolean))]
        .map(type => ({ label: type, value: type })),
        [leads]
    );

    // --- Filtering Logic ---
    const filteredLeads = useMemo(() => {
        let filtered = [...leads];
        const [startDate, endDate] = dateRange;

        if (startDate && endDate) {
            filtered = filtered.filter(lead => {
                const leadDate = dayjs(lead.created_at);
                return leadDate.isAfter(dayjs(startDate).startOf('day')) && leadDate.isBefore(dayjs(endDate).endOf('day'));
            });
        }
        if (statusFilter?.value) {
            filtered = filtered.filter(lead => lead.lead_status === statusFilter.value);
        }
        if (intentFilter?.value) {
            filtered = filtered.filter(lead => lead.lead_intent === intentFilter.value);
        }
        // Add new filter logic
        if (enquiryTypeFilter?.value) {
            filtered = filtered.filter(lead => lead.enquiry_type === enquiryTypeFilter.value);
        }

        return filtered;
    }, [leads, dateRange, statusFilter, intentFilter, enquiryTypeFilter]); // Add dependency

    const handleResetFilters = () => {
        setDateRange([null, null]);
        setStatusFilter(null);
        setIntentFilter(null);
        setEnquiryTypeFilter(null); // Reset new filter
    };

    if (leads.length === 0) {
        return <NoDataMessage message="No leads have been generated from this enquiry yet." />;
    }

    return (
        <div className="space-y-6">
            {/* --- Filter Section --- */}
            <Card>
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <TbFilter size={20} />
                        <h5 className="mb-0">Filters</h5>
                    </div>
                    <Button
                        icon={<TbReload />}
                        onClick={handleResetFilters}
                        title="Clear Filters & Reload"
                        disabled={!dateRange[0] && !statusFilter && !intentFilter && !enquiryTypeFilter}
                    />
                </div>
                {/* Updated grid to fit new filter */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <DatePicker.DatePickerRange
                        value={dateRange}
                        onChange={setDateRange}
                        placeholder="Filter by created date"
                    />
                    <Select
                        isClearable
                        placeholder="Filter by status"
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                    />
                    <Select
                        isClearable
                        placeholder="Filter by type (Want to)"
                        options={intentOptions}
                        value={intentFilter}
                        onChange={setIntentFilter}
                    />
                    {/* New Select component for Inquiry Type */}
                    <Select
                        isClearable
                        placeholder="Filter by inquiry type"
                        options={enquiryTypeOptions}
                        value={enquiryTypeFilter}
                        onChange={setEnquiryTypeFilter}
                    />
                     {/* <Button
                        icon={<TbEraser />}
                        onClick={handleResetFilters}
                        // Update disabled condition
                        disabled={!dateRange[0] && !statusFilter && !intentFilter && !enquiryTypeFilter}
                    >
                        Reset
                    </Button> */}                    
                </div>
            </Card>

            {/* --- Leads Table --- */}
            <Card>
                <Table>
                    <THead>
                        <Tr>
                            <Th>Lead ID</Th>
                            <Th>Company</Th>
                            <Th>Want To</Th>
                            <Th>Inquiry Type</Th> {/* New Column Header */}
                            <Th>Quantity</Th>
                            <Th>Status</Th>
                            <Th>Created By</Th>
                            <Th>Created At</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map(lead => (
                                <Tr key={lead.id}>
                                    <Td>#{lead.id}</Td>
                                    <Td>{customer?.company_actual || 'N/A'}</Td>
                                    <Td>
                                        <Tag className={`${getStatusClass(lead.lead_intent)} font-semibold`}>
                                            {lead.lead_intent}
                                        </Tag>
                                    </Td>
                                    <Td>{lead.enquiry_type}</Td> {/* New Column Data */}
                                    <Td>{lead.qty}</Td>
                                    <Td>
                                        <Tag className={getStatusClass(lead.lead_status)}>
                                            {lead.lead_status}
                                        </Tag>
                                    </Td>
                                    <Td>
                                        <div className="flex items-center gap-2">
                                            <Avatar size={28} src={lead.created_by_user?.profile_pic_path} shape="circle" />
                                            <span className="font-semibold">{lead.created_by_user?.name || 'N/A'}</span>
                                        </div>
                                    </Td>
                                    <Td>{dayjs(lead.created_at).format('DD MMM YYYY, h:mm A')}</Td>
                                </Tr>
                            ))
                        ) : (
                           <Tr>
                               <Td colSpan={8}> {/* Updated colSpan */}
                                   <NoDataMessage message="No leads match the current filters." />
                               </Td>
                           </Tr>
                        )}
                    </TBody>
                </Table>
            </Card>
        </div>
    );
};
// --- MAIN WALL ENQUIRY VIEW PAGE ---
const WallEnquiryView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [enquiry, setEnquiry] = useState<WallEnquiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>(wallEnquiryNavigationList[0].link);

  useEffect(() => {
    const fetchEnquiry = async () => {
      if (!id) {
        toast.push(<Notification type="danger" title="Error">No Enquiry ID provided.</Notification>);
        navigate('/wall/listings');
        return;
      }
      setLoading(true);
      try {
        // --- REAL IMPLEMENTATION ---
        const response = await dispatch(getWallItemById(id)).unwrap();
        setEnquiry(response);

        // --- MOCK IMPLEMENTATION ---
        // const mockApiResponse: WallEnquiryApiResponse = {"status":true,"message":"WallEnquiry found","data":{"id":1,"want_to":"Sell","qty":"250","price":null,"status":"Active","product_status":"Active","device_condition":null,"location":null,"warranty":null,"payment_term":null,"shipping_options":null,"dispatch_mode":null,"delivery_details":null,"internal_remarks":null,"created_at":"2025-07-11T12:26:04.000000Z","updated_at":"2025-07-11T12:26:04.000000Z","created_by_user":{"id":1,"name":"Tushar Joshi","profile_pic_path":"https://aazovo.omcommunication.co/storage/users/profile_pics/686e018a3d879.jpg","email":"admin@admin.com"},"updated_by_user":{"id":1,"name":"Tushar Joshi","profile_pic_path":"https://aazovo.omcommunication.co/storage/users/profile_pics/686e018a3d879.jpg","email":"admin@admin.com"},"product":{"id":1,"name":"IPHONE 16E 5G 8GB 256GB","description":null,"status":"Active","thumb_image_full_path":"https://aazovo.omcommunication.co/product_thumb_images","category":{"id":1,"name":"ELECTRONICS"},"sub_category":{"id":5,"name":"MOBILE"},"brand":{"id":1,"name":"APPLE"}},"customer":{"id":14,"name":"MANISH SHARAMA","member_code":"7000003","interested_in":"For Sell","number":"7210619000","email":"tradelinkhub32@gmail.com","company_temp":"TRADELINK HUB","company_actual":"TRADELINK HUB","company_code":"100002","business_type":"Distributor","status":"Active","state":"","city":"","address":null,"website":null,"wall_listing_permission":null,"trade_inquiry_permission":null},"company":null,"get_leads":{"id":1,"lead_intent":"Buy","lead_status":"New","qty":100,"created_at":"2025-07-10T19:20:28.000000Z","created_by_user":{"id":1,"name":"Tushar Joshi","profile_pic_path":"https://aazovo.omcommunication.co/storage/users/profile_pics/686e018a3d879.jpg","email":"admin@admin.com"}}}};
        // setEnquiry(mockApiResponse.data);

      } catch (error: any) {
        toast.push(<Notification type="danger" title="Fetch Error">{error?.message || 'Failed to load enquiry data.'}</Notification>);
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiry();
  }, [id, navigate]);

    const renderActiveSection = () => {
    if (!enquiry) return <NoDataMessage message="Enquiry data is not available." />;

    switch (activeSection) {
      case "product": return <ProductDetailsTabView enquiry={enquiry} />;
      case "company": return <CompanyDetailsTabView customer={enquiry.customer} />;
      // Update this line
      case "leads": return <LeadsTabView leadsData={enquiry.get_leads} customer={enquiry.customer} />;
      default: return <ProductDetailsTabView enquiry={enquiry} />;
    }
  };

  if (loading) {
    return <Container className="h-full flex justify-center items-center"><Spinner size={40} /></Container>;
  }

  if (!enquiry) {
    return (
      <Container>
        <Card className="text-center p-8">
          <h4 className="mb-4">Enquiry Not Found</h4>
          <p>The wall enquiry you are looking for does not exist or could not be loaded.</p>
          <Button className="mt-4" onClick={() => navigate('/wall/listings')}>Back to List</Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-4">
        <NavLink to="/wall/listings"><h6 className="font-semibold hover:text-primary-600">Wall Listings</h6></NavLink>
        <BiChevronRight size={18} />
        <h6 className="font-semibold text-primary-600">{enquiry.product?.name || `Enquiry #${id}`}</h6>
      </div>
      <Card bodyClass="p-0">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700"><WallEnquiryHeader enquiry={enquiry} /></div>
        <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700"><WallEnquiryNavigator activeSection={activeSection} onNavigate={setActiveSection} /></div>
        <div className="p-4 sm:p-6">{renderActiveSection()}</div>
      </Card>
    </Container>
  );
};

export default WallEnquiryView;