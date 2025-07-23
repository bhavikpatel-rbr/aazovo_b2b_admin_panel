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
import { DatePicker, Select, Table } from '@/components/ui';
import THead from '@/components/ui/Table/THead';
import Tr from '@/components/ui/Table/Tr';
import TBody from '@/components/ui/Table/TBody';
import Td from '@/components/ui/Table/Td';
import Th from '@/components/ui/Table/Th';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import {
    TbPencil, TbArrowLeft, TbBox, TbTag, TbTruckDelivery, TbNotes,
    TbListDetails, TbId, TbUserSearch, TbKey, TbInfoCircle,
    TbClipboardList, TbFilter, TbReload, TbWorld,
    TbFileText,
} from 'react-icons/tb';

// Redux (Assuming similar structure)
// import { getProductById } from '@/reduxtool/master/middleware'; // This would be the real thunk
import { useAppDispatch } from '@/reduxtool/store';


// --- Type Definitions for Product API Response ---
interface User {
    id: number;
    name: string;
    profile_pic_path?: string;
}

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Country {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
}

interface MemberInfo {
    id: number;
    name: string;
}

interface WallEnquiryItem {
    id: number;
    want_to: "Sell" | "Buy";
    qty: string;
    price: string | null;
    status: string;
    product_status: string;
    device_condition: string | null;
    created_at: string;
    created_by_user: User | null;
    member: MemberInfo;
}

interface ProductLead {
    id: number;
    name: string;
    status: string;
    created_at: string;
    brand: Brand;
    category: Category;
    sub_category: Category;
}

interface ProductData {
    id: number;
    name: string;
    sku_code: string;
    hsn_code: string;
    status: string;
    description: string | null;
    short_description: string | null;
    product_keywords: string | null;
    icon_full_path: string;
    created_at: string;
    updated_at: string;
    created_by_user: User | null;
    updated_by_user: User | null;
    category: Category;
    sub_category: Category;
    brand: Brand;
    country: Country;
    unit1: Unit;
    wall_enquiries: WallEnquiryItem[];
    product_leads: ProductLead[];
    payment_term: string | null;
    delivery_details: string | null;
    packaging_size: string | null;
    packaging_type: string | null;
    procurement_lead_time: string | null;
    tax_rate: string | null;
    meta_title: string | null;
    meta_descr: string | null;
    meta_keyword: string | null;
}

// --- Reusable Helper Components ---
const getStatusClass = (status?: string) => {
  const s = status?.toLowerCase() || '';
  switch (s) {
    case 'active': case 'approved': case 'buy':
      return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100';
    case 'inactive':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100';
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
const ProductHeader = ({ product }: { product: ProductData }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar size={60} src={product.icon_full_path} shape="square" icon={<TbBox />} />
        <div>
          <h4 className="font-bold">{product.name}</h4>
          <p className="text-sm text-gray-500">SKU: {product.sku_code}</p>
          <div className="mt-2 flex items-center gap-2">
            <Tag className={`${getStatusClass(product.status)} capitalize`}>{product.status}</Tag>
            <Tag>{product.brand.name}</Tag>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm">
        <InfoPair label="Created By" value={product?.created_by_user?.name} />
        <InfoPair label="Created At" value={dayjs(product?.created_at).format('DD MMM YYYY')} />
      </div>
      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
        <Button icon={<TbArrowLeft />} onClick={() => navigate('/product-management/products')}>Back to List</Button>
      </div>
    </div>
  );
};

const productNavigationList = [
  { label: "Product Details", link: "details", icon: <TbBox /> },
  { label: "Wall Enquiries", link: "enquiries", icon: <TbClipboardList /> },
  { label: "Related Product Leads", link: "leads", icon: <TbUserSearch /> },
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
    <div className="space-y-6">
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
                <InfoPair label="Category" value={product?.category.name} />
                <InfoPair label="Sub-Category" value={product?.sub_category?.name || "N/A"} />
                <InfoPair label="Brand" value={product?.brand.name} />
            </div>
        </DetailSection>
        
        {(product.description || product.short_description) && (
            <DetailSection title="Description" icon={<TbFileText />}>
                {product.short_description && (
                    <>
                        <h6 className="font-semibold text-gray-700 dark:text-gray-300">Short Description</h6>
                        <div className="mt-1 text-sm mb-4 prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: product.short_description }} />
                    </>
                )}
                {product.description && (
                    <>
                        <h6 className="font-semibold text-gray-700 dark:text-gray-300">Full Description</h6>
                        <div className="mt-1 text-sm prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: product.description }} />
                    </>
                )}
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
    // --- Filter States ---
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [companyFilter, setCompanyFilter] = useState<{ label: string, value: string } | null>(null);
    const [statusFilter, setStatusFilter] = useState<{ label: string, value: string } | null>(null);
    const [wantToFilter, setWantToFilter] = useState<{ label: string, value: string } | null>(null);

    // --- Dynamic options for filters ---
    const companyOptions = useMemo(() =>
        [...new Set(enquiries.map(e => e.member.name))]
        .map(name => ({ label: name, value: name })),
        [enquiries]
    );
    const statusOptions = useMemo(() =>
        [...new Set(enquiries.map(e => e.status))]
        .map(status => ({ label: status, value: status })),
        [enquiries]
    );
    const wantToOptions = useMemo(() =>
        [...new Set(enquiries.map(e => e.want_to))]
        .map(type => ({ label: type, value: type })),
        [enquiries]
    );

    // --- Filtering Logic ---
    const filteredEnquiries = useMemo(() => {
        let filtered = [...enquiries];
        const [startDate, endDate] = dateRange;

        if (startDate && endDate) {
            filtered = filtered.filter(e => {
                const enquiryDate = dayjs(e.created_at);
                return enquiryDate.isAfter(dayjs(startDate).startOf('day')) && enquiryDate.isBefore(dayjs(endDate).endOf('day'));
            });
        }
        if (companyFilter?.value) {
            filtered = filtered.filter(e => e.member.name === companyFilter.value);
        }
        if (statusFilter?.value) {
            filtered = filtered.filter(e => e.status === statusFilter.value);
        }
        if (wantToFilter?.value) {
            filtered = filtered.filter(e => e.want_to === wantToFilter.value);
        }
        return filtered;
    }, [enquiries, dateRange, companyFilter, statusFilter, wantToFilter]);

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
                    <div className="flex items-center gap-2">
                        <TbFilter size={20} /> <h5 className="mb-0">Filters</h5>
                    </div>
                    <Button icon={<TbReload />} onClick={handleResetFilters} title="Reset Filters" disabled={!dateRange[0] && !companyFilter && !statusFilter && !wantToFilter}/>
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
                            <Th>Enquiry ID</Th> <Th>Company</Th> <Th>Want To</Th>
                            <Th>Qty</Th> <Th>Condition</Th> <Th>Status</Th>
                            <Th>Created At</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {filteredEnquiries.length > 0 ? (
                            filteredEnquiries.map(enquiry => (
                                <Tr key={enquiry.id}>
                                    <Td>#{enquiry.id}</Td>
                                    <Td><span className="font-semibold">{enquiry.member.name}</span></Td>
                                    <Td><Tag className={`${getStatusClass(enquiry.want_to)} font-semibold`}>{enquiry.want_to}</Tag></Td>
                                    <Td>{enquiry.qty}</Td>
                                    <Td>{enquiry.device_condition || 'N/A'}</Td>
                                    <Td><Tag className={getStatusClass(enquiry.status)}>{enquiry.status}</Tag></Td>
                                    <Td>{dayjs(enquiry.created_at).format('DD MMM YYYY, h:mm A')}</Td>
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
    // --- Filter States ---
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [statusFilter, setStatusFilter] = useState<{ label: string, value: string } | null>(null);
    const [brandFilter, setBrandFilter] = useState<{ label: string, value: string } | null>(null);
    
    // --- Dynamic options ---
    const createOptions = (key: keyof ProductLead) => useMemo(() =>
        [...new Set(leads.map(lead => lead[key]).filter(Boolean))]
        .map(value => ({ label: (value as { name: string }).name || value, value: (value as { name: string }).name || value })), [leads]);
    
    const statusOptions = createOptions('status');
    const brandOptions = createOptions('brand');

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
        if (statusFilter?.value) filtered = filtered.filter(l => l.status === statusFilter.value);
        if (brandFilter?.value) filtered = filtered.filter(l => l.brand.name === brandFilter.value);

        return filtered;
    }, [leads, dateRange, statusFilter, brandFilter]);

    const handleResetFilters = () => {
        setDateRange([null, null]);
        setStatusFilter(null);
        setBrandFilter(null);
    };

    if (!leads || leads.length === 0) {
        return <NoDataMessage message="No related product leads found." />;
    }

    return (
        <div className="space-y-6">
             <Card>
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <TbFilter size={20} /> <h5 className="mb-0">Filters</h5>
                    </div>
                    <Button icon={<TbReload />} onClick={handleResetFilters} title="Reset Filters" disabled={!dateRange[0] && !statusFilter && !brandFilter}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DatePicker.DatePickerRange value={dateRange} onChange={setDateRange} placeholder="Filter by date"/>
                    <Select isClearable placeholder="Filter by status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
                    <Select isClearable placeholder="Filter by brand" options={brandOptions} value={brandFilter} onChange={setBrandFilter} />
                </div>
            </Card>
            <Card>
                <Table>
                    <THead>
                        <Tr>
                            <Th>Lead Product ID</Th>
                            <Th>Product Name</Th>
                            <Th>Brand</Th>
                            <Th>Category</Th>
                            <Th>Status</Th>
                            <Th>Created At</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map(lead => (
                                <Tr key={lead.id}>
                                    <Td>#{lead.id}</Td>
                                    <Td className="font-semibold">{lead.name}</Td>
                                    <Td>{lead.brand?.name || 'N/A'}</Td>
                                    <Td>{lead.category?.name || 'N/A'}</Td>
                                    <Td><Tag className={getStatusClass(lead.status)}>{lead.status}</Tag></Td>
                                    <Td>{dayjs(lead.created_at).format('DD MMM YYYY, h:mm A')}</Td>
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
    const keywords = useMemo(() => {
        return product.product_keywords?.split(',').map(k => k.trim()).filter(Boolean) || [];
    }, [product.product_keywords]);

    return (
        <div className="space-y-6">
            <DetailSection title="Search Keywords" icon={<TbKey />}>
                {keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {keywords.map((keyword, index) => (
                            <Tag key={`${keyword}-${index}`} className="!text-sm">{keyword}</Tag>
                        ))}
                    </div>
                ) : (
                    <NoDataMessage message="No product keywords have been added." />
                )}
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


// --- MAIN PRODUCT VIEW PAGE ---
const ProductView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [product, setProduct] = useState<ProductData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>(productNavigationList[0].link);

    useEffect(() => {
        const fetchProduct = () => {
            if (!id) {
                toast.push(<Notification type="danger" title="Error">No Product ID provided.</Notification>);
                navigate('/products/list');
                return;
            }
            setLoading(true);
            
            // --- MOCK API RESPONSE ---
            // In a real app, this would be an API call e.g., dispatch(getProductById(id))
            const apiResponse = {"id":3924,"category_id":8,"sub_category_id":13,"brand_id":113,"sku_code":"test","name":"test1","unit":0,"country_id":1,"color":"Red","hsn_code":"12345","shelf_life":"Lef","packaging_size":"xl","packaging_type":"Pack","tax_rate":"12","procurement_lead_time":"12","slug":"test1","description":"<p>test</p>","short_description":"<p>test</p>","payment_term":"test","delivery_details":"test","thumb_image":null,"icon":"product_icon_1746708750.jpg","product_images":"","status":"Pending","unit_id":1,"licence":null,"currency_id":null,"product_specification":"[{\"name\":null,\"value\":null}]","meta_title":null,"meta_descr":null,"meta_keyword":null,"created_at":"2025-05-08T07:22:30.000000Z","updated_at":"2025-07-23T17:17:03.000000Z","domain_ids":null,"time":10,"time_type":"2","product_material":"test","minimum_order_quantity":null,"user_id":10774,"product_keywords":"Demo","supplier_product_code":"Demo","created_by":null,"updated_by":1,"thumb_image_full_path":"https://api.omcommunication.co/product_thumb_images","icon_full_path":"https://api.omcommunication.co/product_icons/product_icon_1746708750.jpg","product_images_array":[],"domains":[],"product_leads":[],"created_by_user":null,"updated_by_user":{"id":1,"name":"Super Admin","profile_pic":"687e86b59d4aa.png","profile_pic_path":"https://api.omcommunication.co/storage/users/profile_pics/687e86b59d4aa.png","roles":[{"id":1,"display_name":"Super Admin","pivot":{"user_id":1,"role_id":1}}]},"category":{"id":8,"name":"ENGINEERING"},"sub_category":{"id":13,"name":"AGRICULTURE EQUIPMENTS AND PARTS"},"brand":{"id":113,"name":"Demo-1"},"country":{"id":1,"name":"India"},"user":null,"unit1":{"id":1,"name":"Pcs"},"currency":null,
                "wall_enquiries":[
                    {"id":1,"want_to":"Sell","qty":"250","price":null,"status":"Active","product_status":"Active","device_condition":"New","created_at":"2025-07-11T12:26:04.000000Z","created_by_user":null,"member":{"id":6,"name":"North America Traders"}},
                    {"id":2,"want_to":"Sell","qty":"1","price":"1200","status":"Active","product_status":"Active","device_condition":"Used - Like New","created_at":"2025-07-10T12:26:04.000000Z","created_by_user":{"id":1,"name":"Tushar Joshi"},"member":{"id":7,"name":"European Distributors"}},
                    {"id":3,"want_to":"Buy","qty":"300","price":null,"status":"Pending","product_status":"Active","device_condition":"New","created_at":"2025-07-09T12:26:04.000000Z","created_by_user":{"id":1,"name":"Tushar Joshi"},"member":{"id":8,"name":"Asia Pacific Imports"}}
                ]};
            
            setTimeout(() => { // Simulate network delay
                setProduct(apiResponse as unknown as ProductData);
                setLoading(false);
            }, 500);
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