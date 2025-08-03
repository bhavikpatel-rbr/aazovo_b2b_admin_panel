import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink, useParams, useNavigate, Link } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import classNames from 'classnames';
import { z } from 'zod';

// UI Components
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import Spinner from '@/components/ui/Spinner';
import toast from '@/components/ui/toast';
import { DatePicker, Select, Table, Checkbox, Dialog, FormItem, Input, Dropdown, Tooltip } from '@/components/ui';
import THead from '@/components/ui/Table/THead';
import Tr from '@/components/ui/Table/Tr';
import TBody from '@/components/ui/Table/TBody';
import Td from '@/components/ui/Table/Td';
import Th from '@/components/ui/Table/Th';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import {
    TbUserCircle, TbMail, TbPhone, TbBuilding, TbPencil, TbArrowLeft, TbUser, TbFileText,
    TbWorld, TbBox, TbTag, TbTruckDelivery, TbBuildingStore, TbNotes, TbHourglass,
    TbListDetails, TbId, TbUserSearch, TbCalendar, TbLicense,
    TbFilter, TbReload, TbBulb, TbUserPlus, TbCheck, TbCopy, TbShare, TbUserCheck, TbHandGrab, TbMailForward, TbBrandWhatsapp, TbPlus, TbDotsVertical
} from 'react-icons/tb';

// Redux
import {
    getWallItemById,
    addTaskAction,
    getMatchingOpportunitiesAction // Assuming this action exists
} from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';
import { useSelector } from 'react-redux';
import { masterSelector } from '@/reduxtool/master/masterSlice';


// --- Type Definitions ---
interface User { id: number; name: string; profile_pic_path?: string; email: string; employee_id?: string; }
interface ProductCategory { id: number; name: string; }
interface ProductSubCategory { id: number; name: string; }
interface ProductBrand { id: number; name: string; }
interface ProductInfo { id: number; name: string; description: string | null; status: string; category?: ProductCategory; sub_category?: ProductSubCategory; brand?: ProductBrand; sku_code?: string; thumb_image_full_path?: string; }
interface CustomerInfo { id: number; name: string; customer_code: string; interested_in: string; number: string; email: string; company_temp: string; company_actual: string; company_code: string; business_type: string; status: string; state: string; city: string; address: string | null; website: string | null; wall_listing_permission: string | null; trade_inquiry_permission: string | null; }
interface LeadInfo { id: number; lead_intent: string; enquiry_type: string; lead_status: string; qty: number; created_at: string; created_by_user?: User; }
interface WallEnquiryData { id: number; want_to: "Sell" | "Buy"; qty: string; price: string | null; status: string; product_status: string; device_condition: string | null; color: string | null; location: string | null; warranty: string | null; payment_term: string | null; shipping_options: string | null; dispatch_mode: string | null; delivery_details: string | null; internal_remarks: string | null; created_at: string; updated_at: string; created_by_user: User; updated_by_user: User; product: ProductInfo; customer: CustomerInfo | null; company: any | null; get_leads: LeadInfo | LeadInfo[] | null; }
interface OpportunityItem { id: number; want_to: "Sell" | "Buy"; product_id: number; product_name: string; qty: string; price: string | null; device_condition: string | null; color: string | null; member_id: number; member_name: string; member_email: string; member_phone: string; }
const taskValidationSchema = z.object({ task_title: z.string().min(3, 'Task title must be at least 3 characters.'), assign_to: z.array(z.number()).min(1, 'At least one assignee is required.'), priority: z.string().min(1, 'Please select a priority.'), due_date: z.date().nullable().optional(), description: z.string().optional(), });
type TaskFormData = z.infer<typeof taskValidationSchema>;

// --- Reusable Helper Components ---
const getStatusClass = (status?: string) => {
    const s = status?.toLowerCase() || '';
    switch (s) { case 'active': case 'approved': case 'verified': case 'buy': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100'; case 'inactive': case 'new': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100'; case 'blocked': case 'rejected': case 'sell': return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100'; case 'pending': return 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-100'; default: return 'bg-gray-100 text-gray-500'; }
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
const WallEnquiryHeader = ({ enquiry, onAssignTask, onCopyLink }: { enquiry: WallEnquiryData, onAssignTask: () => void; onCopyLink: () => void; }) => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
                <h4 className="font-bold">{enquiry.product?.name || 'Wall Listing'}</h4>
                <div className="mt-2 flex items-center gap-2">
                    <Tag className={`${getStatusClass(enquiry.want_to)} font-bold`}>{enquiry.want_to}</Tag>
                    <Tag className={`${getStatusClass(enquiry.status)} capitalize`}>{enquiry.status}</Tag>
                    <span className="text-sm text-gray-500">Qty: <strong>{enquiry.qty}</strong></span>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Button icon={<TbArrowLeft />} onClick={() => navigate('/sales-leads/wall-listing')}>Back</Button>
                <Button variant="solid" icon={<TbPencil />} onClick={() => navigate("/sales-leads/wall-item/add", { state: enquiry.id })}>Edit</Button>
                <Button variant="twoTone" icon={<TbCopy />} onClick={onCopyLink}>Copy Link</Button>
                <Dropdown renderTitle={<Button variant="twoTone" icon={<TbDotsVertical />} />} placement="bottom-end">
                    <Dropdown.Item onSelect={onAssignTask} eventKey="assignTask" className="flex items-center gap-2"><TbUserCheck size={18} /><span>Assign Task</span></Dropdown.Item>
                </Dropdown>
            </div>
        </div>
    );
};

const wallEnquiryNavigationList = [
    { label: "Listing Details", link: "listing", icon: <TbListDetails /> },
    { label: "Member Details", link: "member", icon: <TbUserCircle /> },
    // { label: "Opportunity", link: "opportunity", icon: <TbBulb /> },
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
const ListingDetailsView = ({ enquiry }: { enquiry: WallEnquiryData }) => (
    <div className="space-y-6">
        <DetailSection title="Listing Details" icon={<TbListDetails />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                <InfoPair label="Want to" value={<Tag className={`${getStatusClass(enquiry.want_to)} font-bold`}>{enquiry.want_to}</Tag>} />
                <InfoPair label="Quantity" value={<strong className="text-lg">{enquiry.qty}</strong>} />
                <InfoPair label="Price" value={enquiry.price ? `$${enquiry.price}` : 'Not Specified'} />
                <InfoPair label="Listing Status" value={<Tag className={`${getStatusClass(enquiry.status)} capitalize`}>{enquiry.status}</Tag>} />
                <InfoPair label="Product Status" value={enquiry.product_status} />
                <InfoPair label="Device Condition" value={enquiry.device_condition} />
                <InfoPair label="Color" value={enquiry.color} />
                <InfoPair label="Warranty" value={enquiry.warranty} />
                <InfoPair label="Location" value={enquiry.location} />
            </div>
        </DetailSection>
        <DetailSection title="Product Information" icon={<TbBox />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                <InfoPair label="Product Name" value={enquiry.product?.name} />
                <InfoPair label="Brand" value={enquiry.product?.brand?.name} />
                <InfoPair label="Category" value={enquiry.product?.category?.name} />
                <InfoPair label="Sub-Category" value={enquiry.product?.sub_category?.name} />
                <InfoPair label="SKU Code" value={enquiry.product?.sku_code} />
            </div>
        </DetailSection>
        <DetailSection title="Record Information" icon={<TbCalendar />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <InfoPair label="Created By" value={
                    <div className="flex items-center gap-2">
                        <Avatar size={24} src={enquiry.created_by_user?.profile_pic_path} shape="circle" />
                        <span className="font-semibold">{enquiry.created_by_user?.name}</span>
                    </div>
                } />
                <InfoPair label="Created At" value={dayjs(enquiry.created_at).format('DD MMM YYYY, h:mm A')} />
                <InfoPair label="Last Updated By" value={
                    <div className="flex items-center gap-2">
                        <Avatar size={24} src={enquiry.updated_by_user?.profile_pic_path} shape="circle" />
                        <span className="font-semibold">{enquiry.updated_by_user?.name}</span>
                    </div>
                } />
                <InfoPair label="Last Updated At" value={dayjs(enquiry.updated_at).format('DD MMM YYYY, h:mm A')} />
            </div>
        </DetailSection>
    </div>
);

const MemberDetailsView = ({ customer }: { customer: CustomerInfo | null }) => {
    if (!customer) { return <NoDataMessage message="No member details available for this listing." />; }
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card bodyClass="flex flex-col gap-4" className="lg:col-span-2">
                <div className="flex items-start justify-between">
                    <div>
                        <h5 className="font-bold">{customer.name}</h5>
                        <p className="text-gray-500">{customer.customer_code}</p>
                    </div>
                    <Tag className={`${getStatusClass(customer.status)} capitalize`}>{customer.status}</Tag>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <InfoPair label="Company Name" value={customer.company_actual || customer.company_temp} />
                    <InfoPair label="Business Type" value={customer.business_type} />
                    <InfoPair label="Email" value={<a href={`mailto:${customer.email}`} className="text-blue-500 hover:underline">{customer.email}</a>} />
                    <InfoPair label="Phone" value={customer.number} />
                    <InfoPair label="Website" value={customer.website ? <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{customer.website}</a> : 'N/A'} />
                </div>
            </Card>
            <div className="space-y-6">
                <Card>
                    <h6 className="font-semibold mb-2">Location</h6>
                    <p>{customer.address || 'No address specified'}</p>
                    <p>{customer.city}{customer.city && customer.state ? ', ' : ''}{customer.state}</p>
                </Card>
                <Card>
                    <h6 className="font-semibold mb-2">Platform Permissions</h6>
                    <InfoPair label="Wall Listing" value={customer.wall_listing_permission || 'Not Set'} />
                    <InfoPair label="Trade Inquiry" value={customer.trade_inquiry_permission || 'Not Set'} />
                </Card>
            </div>
        </div>
    );
};

const LeadsTabView = ({ leadsData }: { leadsData: LeadInfo | LeadInfo[] | null; }) => {
    const leads = useMemo(() => {
        if (!leadsData) return [];
        return Array.isArray(leadsData) ? leadsData : [leadsData];
    }, [leadsData]);

    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [statusFilter, setStatusFilter] = useState<{ label: string, value: string } | null>(null);
    const [intentFilter, setIntentFilter] = useState<{ label: string, value: string } | null>(null);
    const [enquiryTypeFilter, setEnquiryTypeFilter] = useState<{ label: string, value: string } | null>(null);

    const statusOptions = useMemo(() => [...new Set(leads.map(lead => lead.lead_status))].map(status => ({ label: status, value: status })), [leads]);
    const intentOptions = useMemo(() => [...new Set(leads.map(lead => lead.lead_intent))].map(intent => ({ label: intent, value: intent })), [leads]);
    const enquiryTypeOptions = useMemo(() => [...new Set(leads.map(lead => lead.enquiry_type).filter(Boolean))].map(type => ({ label: type, value: type })), [leads]);

    const filteredLeads = useMemo(() => {
        let filtered = [...leads];
        const [startDate, endDate] = dateRange;
        if (startDate && endDate) { filtered = filtered.filter(lead => dayjs(lead.created_at).isAfter(dayjs(startDate).startOf('day')) && dayjs(lead.created_at).isBefore(dayjs(endDate).endOf('day'))); }
        if (statusFilter?.value) { filtered = filtered.filter(lead => lead.lead_status === statusFilter.value); }
        if (intentFilter?.value) { filtered = filtered.filter(lead => lead.lead_intent === intentFilter.value); }
        if (enquiryTypeFilter?.value) { filtered = filtered.filter(lead => lead.enquiry_type === enquiryTypeFilter.value); }
        return filtered;
    }, [leads, dateRange, statusFilter, intentFilter, enquiryTypeFilter]);

    const handleResetFilters = () => { setDateRange([null, null]); setStatusFilter(null); setIntentFilter(null); setEnquiryTypeFilter(null); };

    if (leads.length === 0) { return <NoDataMessage message="No leads have been generated from this listing yet." />; }

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2"><TbFilter size={20} /><h5 className="mb-0">Filters</h5></div>
                    <Button icon={<TbReload />} onClick={handleResetFilters} title="Clear Filters" disabled={!dateRange[0] && !statusFilter && !intentFilter && !enquiryTypeFilter} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <DatePicker.DatePickerRange value={dateRange} onChange={setDateRange} placeholder="Filter by date" />
                    <Select isClearable placeholder="Filter by status" options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
                    <Select isClearable placeholder="Filter by intent" options={intentOptions} value={intentFilter} onChange={setIntentFilter} />
                    <Select isClearable placeholder="Filter by inquiry type" options={enquiryTypeOptions} value={enquiryTypeFilter} onChange={setEnquiryTypeFilter} />
                </div>
            </Card>
            <Card>
                <Table>
                    <THead><Tr><Th>Lead ID</Th><Th>Want To</Th><Th>Inquiry Type</Th><Th>Qty</Th><Th>Status</Th><Th>Created By</Th><Th>Created At</Th></Tr></THead>
                    <TBody>
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map(lead => (
                                <Tr key={lead.id}>
                                    <Td>#{lead.id}</Td>
                                    <Td><Tag className={`${getStatusClass(lead.lead_intent)} font-semibold`}>{lead.lead_intent}</Tag></Td>
                                    <Td>{lead.enquiry_type || 'N/A'}</Td>
                                    <Td>{lead.qty}</Td>
                                    <Td><Tag className={getStatusClass(lead.lead_status)}>{lead.lead_status}</Tag></Td>
                                    <Td><div className="flex items-center gap-2"><Avatar size={28} src={lead.created_by_user?.profile_pic_path} shape="circle" /><span className="font-semibold">{lead.created_by_user?.name || 'N/A'}</span></div></Td>
                                    <Td>{dayjs(lead.created_at).format('DD MMM YYYY, h:mm A')}</Td>
                                </Tr>
                            ))
                        ) : (<Tr><Td colSpan={7}><NoDataMessage message="No leads match the current filters." /></Td></Tr>)}
                    </TBody>
                </Table>
            </Card>
        </div>
    );
};

// --- NEW OPPORTUNITY TAB ---
const OpportunityTabView = ({ wallItem }: { wallItem: WallEnquiryData }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<number[]>([]);

    useEffect(() => {
        const fetchOpportunities = async () => {
            setLoading(true);
            try {
                // Find opposite listings from the last 3 days
                const payload = {
                    product_id: wallItem.product.id,
                    intent: wallItem.want_to === 'Buy' ? 'Sell' : 'Buy', // Find the opposite
                    days: 3
                };
                const result = await dispatch(getMatchingOpportunitiesAction(payload)).unwrap();
                setOpportunities(result?.data || []);
            } catch (error) {
                toast.push(<Notification type="danger" title="Error">Could not load opportunities.</Notification>);
            } finally {
                setLoading(false);
            }
        };
        fetchOpportunities();
    }, [dispatch, wallItem]);

    const handleSelect = (id: number, checked: boolean) => {
        setSelected(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
    };

    const handleSelectAll = (checked: boolean) => {
        setSelected(checked ? opportunities.map(op => op.id) : []);
    };

    const handleAction = (type: 'offer' | 'demand' | 'lead' | 'email' | 'whatsapp') => {
        const selectedOps = opportunities.filter(op => selected.includes(op.id));
        if (selectedOps.length === 0) {
            toast.push(<Notification title="No Selection" type="warning">Please select at least one opportunity.</Notification>);
            return;
        }

        switch (type) {
            case 'offer':
                // Assuming first selected is enough to pre-fill
                navigate('/sales-leads/wall-item/offers/create', { state: { supplierId: selectedOps[0].member_id, productId: selectedOps[0].product_id, ...selectedOps[0] } });
                break;
            case 'demand':
                navigate('/sales-leads/wall-item/demands/create', { state: { buyerId: selectedOps[0].member_id, productId: selectedOps[0].product_id, ...selectedOps[0] } });
                break;
            case 'lead':
                navigate('/sales-leads/wall-item/lead/add', { state: { supplierId: selectedOps[0].member_id, buyerId: wallItem.customer?.id, productId: selectedOps[0].product_id, ...selectedOps[0] } });
                break;

            case 'email':
                const emails = selectedOps.map(op => op.member_email).join(',');
                window.open(`mailto:${emails}?subject=Regarding ${wallItem.product.name}`, '_blank');

                break;
            case 'whatsapp':
                // Note: This only opens the first number in a new tab
                const phone = selectedOps[0].member_phone.replace(/\D/g, '');
                window.open(`https://wa.me/${phone}?text=Hi, I'm interested in your listing for ${wallItem.product.name}`, '_blank');
                break;
        }
    };

    if (loading) return <div className="flex justify-center items-center py-10"><Spinner size={40} /></div>;
    if (opportunities.length === 0) return <NoDataMessage message="No matching opportunities found from the last 3 days." />;

    return (
        <Card>
            <Table>
                <THead>
                    <Tr>
                        <Th><Checkbox onChange={handleSelectAll} checked={selected.length === opportunities.length && opportunities.length > 0} /></Th>
                        <Th>Member</Th>
                        <Th>Details</Th>
                        <Th>Contact</Th>
                    </Tr>
                </THead>
                <TBody>
                    {opportunities.map(op => (
                        <Tr key={op.id}>
                            <Td><Checkbox checked={selected.includes(op.id)} onChange={e => handleSelect(op.id, e)} /></Td>
                            <Td><span className="font-semibold">{op.member_name}</span></Td>
                            <Td>
                                <div className="flex flex-col text-xs">
                                    <span>Qty: <strong>{op.qty}</strong></span>
                                    <span>Price: <strong>{op.price ? `$${op.price}` : 'N/A'}</strong></span>
                                    <span>{op.color}, {op.device_condition}</span>
                                </div>
                            </Td>
                            <Td>
                                <div className="flex flex-col text-xs">
                                    <a href={`mailto:${op.member_email}`} className="text-blue-500 hover:underline">{op.member_email}</a>
                                    <span>{op.member_phone}</span>
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </TBody>
            </Table>
            {selected.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-gray-200 dark:border-gray-600">
                    <span className="font-semibold">{selected.length} selected</span>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" icon={<TbHandGrab />} onClick={() => handleAction(wallItem.want_to === 'Buy' ? 'offer' : 'demand')}>Create {wallItem.want_to === 'Buy' ? 'Offer' : 'Demand'}</Button>
                        <Button size="sm" icon={<TbUserPlus />} onClick={() => handleAction('lead')}>Create Lead</Button>
                        <Button size="sm" icon={<TbMailForward />} onClick={() => handleAction('email')}>Email</Button>
                        <Button size="sm" icon={<TbBrandWhatsapp />} onClick={() => handleAction('whatsapp')}>WhatsApp</Button>
                    </div>
                </div>
            )}
        </Card>
    );
};


// --- ASSIGN TASK DIALOG ---
const AssignTaskDialog = ({ isOpen, onClose, wallItem }: { isOpen: boolean, onClose: () => void, wallItem: WallEnquiryData }) => {
    const dispatch = useAppDispatch();
    const { Employees } = useSelector(masterSelector);
    const [isLoading, setIsLoading] = useState(false);

    const employeeOptions = useMemo(() => Employees?.map((e: any) => ({ value: e.id, label: e.name })) || [], [Employees]);
    const priorityOptions = [{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }];

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<TaskFormData>({
        resolver: zodResolver(taskValidationSchema),
        defaultValues: {
            task_title: `Follow up on wall listing: ${wallItem.product.name}`,
            assign_to: [],
            priority: 'Medium',
            due_date: null,
            description: `Regarding wall item from ${wallItem.customer?.name} for product "${wallItem.product.name}".`,
        },
        mode: 'onChange'
    });

    const onAssignTask = async (data: TaskFormData) => {
        setIsLoading(true);
        try {
            const payload = { ...data, due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined, module_id: String(wallItem.id), module_name: 'WallListing', };
            await dispatch(addTaskAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Task Assigned" />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Failed to Assign Task" children={error?.message || 'An error occurred.'} />);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Assign Task for "{wallItem.product.name}"</h5>
            <Form onSubmit={handleSubmit(onAssignTask)}>
                <FormItem label="Task Title" invalid={!!errors.task_title} errorMessage={errors.task_title?.message}><Controller name="task_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem label="Assign To" invalid={!!errors.assign_to} errorMessage={errors.assign_to?.message}><Controller name="assign_to" control={control} render={({ field }) => (<Select isMulti placeholder="Select User(s)" options={employeeOptions} value={employeeOptions.filter(o => field.value?.includes(o.value))} onChange={(opts: any) => field.onChange(opts?.map((o: any) => o.value) || [])} />)} /></FormItem>
                    <FormItem label="Priority" invalid={!!errors.priority} errorMessage={errors.priority?.message}><Controller name="priority" control={control} render={({ field }) => (<Select placeholder="Select Priority" options={priorityOptions} value={priorityOptions.find(p => p.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem>
                </div>
                <FormItem label="Due Date (Optional)" invalid={!!errors.due_date} errorMessage={errors.due_date?.message}><Controller name="due_date" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value as Date} onChange={field.onChange} />} /></FormItem>
                <FormItem label="Description" invalid={!!errors.description} errorMessage={errors.description?.message}><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem>
                <div className="text-right mt-6">
                    <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Assign Task</Button>
                </div>
            </Form>
        </Dialog>
    );
};


// --- MAIN VIEW PAGE ---
const WallEnquiryView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [enquiry, setEnquiry] = useState<WallEnquiryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>(wallEnquiryNavigationList[0].link);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    useEffect(() => {
        const fetchEnquiry = async () => {
            if (!id) { toast.push(<Notification type="danger" title="Error">No Enquiry ID provided.</Notification>); navigate('/sales-leads/wall-listing'); return; }
            setLoading(true);
            try {
                const response = await dispatch(getWallItemById(id)).unwrap();
                console.log(response, 'response');

                setEnquiry(response);
            } catch (error: any) {
                toast.push(<Notification type="danger" title="Fetch Error">{error?.message || 'Failed to load enquiry data.'}</Notification>);
            } finally {
                setLoading(false);
            }
        };
        fetchEnquiry();
    }, [id, navigate, dispatch]);

    const handleCopyLink = useCallback(() => {
        const link = `${window.location.origin}/wall-listing/view/${id}`;
        navigator.clipboard.writeText(link).then(() => {
            toast.push(<Notification title="Link Copied" type="success" />);
        });
    }, [id]);

    const renderActiveSection = () => {
        if (!enquiry) return <NoDataMessage message="Enquiry data is not available." />;
        switch (activeSection) {
            case "listing": return <ListingDetailsView enquiry={enquiry} />;
            case "member": return <MemberDetailsView customer={enquiry.customer} />;
            case "leads": return <LeadsTabView leadsData={enquiry.get_leads} />;
            case "opportunity": return <OpportunityTabView wallItem={enquiry} />;
            default: return <ListingDetailsView enquiry={enquiry} />;
        }
    };

    if (loading) { return <Container className="h-full flex justify-center items-center"><Spinner size={40} /></Container>; }
    if (!enquiry) { return (<Container><Card className="text-center p-8"><h4 className="mb-4">Enquiry Not Found</h4><p>The wall enquiry you are looking for does not exist.</p><Button className="mt-4" onClick={() => navigate('/sales-leads/wall-listing')}>Back to List</Button></Card></Container>); }

    return (
        <Container className="h-full">
            <div className="flex gap-1 items-end mb-4">
                <NavLink to="/sales-leads/wall-listing"><h6 className="font-semibold hover:text-primary-600">Wall Listings</h6></NavLink>
                <BiChevronRight size={18} />
                <h6 className="font-semibold text-primary-600">{enquiry.product?.name || `Enquiry #${id}`}</h6>
            </div>
            <Card bodyClass="p-0">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <WallEnquiryHeader enquiry={enquiry} onAssignTask={() => setIsTaskModalOpen(true)} onCopyLink={handleCopyLink} />
                </div>
                <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700"><WallEnquiryNavigator activeSection={activeSection} onNavigate={setActiveSection} /></div>
                <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/60">{renderActiveSection()}</div>
            </Card>
            {isTaskModalOpen && <AssignTaskDialog isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} wallItem={enquiry} />}
        </Container>
    );
};

export default WallEnquiryView;