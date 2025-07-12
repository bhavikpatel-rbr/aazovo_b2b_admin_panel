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
    TbUserCircle, TbMail, TbPhone, TbBuilding, TbBriefcase, TbCalendar, TbPencil, TbDownload,
    TbUser, TbFileText, TbBuildingBank, TbReportMoney, TbArrowLeft, TbUsersGroup, TbLicense,
    TbWorld, TbCheck, TbX, TbFileDescription, TbUserSearch, TbMessage2, TbNotes
} from 'react-icons/tb';

// Types, Redux and Helpers
import type { ApiSingleCompanyItem as PartnerItem } from './CreatePartner'; // Re-using the detailed type from your create file
import { getpartnerByIdAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';


// --- Reusable Helper Components ---

export const getPartnerStatusClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'verified':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100';
      case 'inactive':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100';
      case 'blocked':
      case 'non verified':
        return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-500';
    }
};

const PartnerProfileHeader = ({ partner }: { partner: PartnerItem }) => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Avatar size={90} shape="circle" src={partner.partner_logo || undefined} icon={<TbBuilding />} />
                <div>
                    <h4 className="font-bold">{partner.partner_name}</h4>
                    <div className="flex items-center gap-2 mb-1 text-sm"><TbMail className="text-gray-400" /> <p>{partner.primary_email_id}</p></div>
                    {partner.primary_contact_number && (
                        <div className="flex items-center gap-2 text-sm"><TbPhone className="text-gray-400" /> <p>{partner.primary_contact_number_code} {partner.primary_contact_number}</p></div>
                    )}
                    <div className="mt-2"><Tag className={`${getPartnerStatusClass(partner.status)} capitalize`}>{partner.status || 'N/A'}</Tag></div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm">
                <div className="flex items-center gap-2"><TbUserCircle className="text-gray-400" /><span className="font-semibold">Owner:</span><span>{partner.owner_name}</span></div>
                <div className="flex items-center gap-2"><TbBriefcase className="text-gray-400" /><span className="font-semibold">Ownership:</span><span>{partner.ownership_type || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><TbCalendar className="text-gray-400" /><span className="font-semibold">Member Since:</span><span>{dayjs(partner.created_at).format('D MMM YYYY')}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                <Button variant="solid" icon={<TbPencil />} onClick={() => navigate(`/business-entities/partner-edit/${partner.id}`)}>Edit Partner</Button>
                <Button icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/partner')}>Back to List</Button>
            </div>
        </div>
    );
};

const partnerViewNavigationList = [
    { label: "Details", link: "details", icon: <TbUser /> },
    { label: "Documents", link: "documents", icon: <TbFileText /> },
    { label: "Bank Details", link: "bank", icon: <TbBuildingBank /> },
    { label: "Team", link: "team", icon: <TbUsersGroup /> },
    { label: "Offices", link: "offices", icon: <TbBuilding /> },
    { label: "References", link: "references", icon: <TbUserSearch /> },
    { label: "Accessibility", link: "accessibility", icon: <TbLicense /> },
];

const PartnerViewNavigator = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (s: string) => void; }) => (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
        {partnerViewNavigationList.map((nav) => (
            <button type="button" key={nav.link} className={classNames("cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max flex items-center justify-center gap-2", "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none", activeSection === nav.link ? "bg-indigo-50 dark:bg-indigo-700/60 text-indigo-600 dark:text-indigo-200 font-semibold" : "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200")} onClick={() => onNavigate(nav.link)} title={nav.label}>
                {nav.icon}<span className="font-medium text-xs sm:text-sm truncate">{nav.label}</span>
            </button>
        ))}
    </div>
);

const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => (
    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-600 last:mb-0 last:pb-0 last:border-b-0">
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
const InfoCard = ({ title, data }: { title: string, data: { label: string, value?: React.ReactNode }[] }) => (
    <Card>
        <h6 className="font-semibold mb-2">{title}</h6>
        <div className="text-sm space-y-1.5">
            {data.map(item => (<div key={item.label} className="flex justify-between"><span className="text-gray-500">{item.label}:</span><span className="font-semibold text-right break-all">{item.value || 'N/A'}</span></div>))}
        </div>
    </Card>
);

const DocumentCard = ({ name, url, verified }: { name: string, url: string | null, verified?: boolean | number | string | null }) => (
    <Card bodyClass="p-4" className="flex items-center justify-between">
        <div className='flex items-center gap-3'><TbFileDescription size={24} className='text-gray-400'/><p className="font-semibold">{name}</p></div>
        <div className='flex items-center gap-3'>
            {verified ? <Tag className="bg-emerald-100 text-emerald-700"><TbCheck className='mr-1'/>Verified</Tag> : <Tag className="bg-red-100 text-red-700"><TbX className='mr-1'/>Not Verified</Tag>}
            <Button size="sm" shape="circle" icon={<TbDownload />} disabled={!url} onClick={() => window.open(url || '', '_blank')} />
        </div>
    </Card>
);

// --- TAB VIEW COMPONENTS ---

const DetailsTabView = ({ partner }: { partner: PartnerItem }) => (
    <div>
        <DetailSection title="Basic Information" icon={<TbBuilding />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
                <InfoPair label="Partner Code" value={partner.partner_code} />
                <InfoPair label="Ownership Type" value={partner.ownership_type} />
                <InfoPair label="Join Us As" value={partner.join_us_as} />
                <InfoPair label="Industrial Expertise" value={partner.industrial_expertise} />
                <InfoPair label="No. of Employees" value={partner.no_of_employees} />
            </div>
        </DetailSection>
        <DetailSection title="Contact & Address" icon={<TbWorld />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <InfoPair label="Full Address" value={partner.partner_address} />
                <InfoPair label="City" value={partner.city} />
                <InfoPair label="State" value={partner.state} />
                <InfoPair label="Zip Code" value={partner.zip_code} />
                <InfoPair label="Country" value={partner.country?.name} />
                <InfoPair label="Continent" value={partner.continent?.name} />
            </div>
        </DetailSection>
        <DetailSection title="Legal & Financial IDs" icon={<TbLicense />}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
                <InfoPair label="GST Number" value={partner.gst_number} />
                <InfoPair label="PAN Number" value={partner.pan_number} />
                <InfoPair label="TRN Number" value={partner.trn_number} />
                <InfoPair label="TAN Number" value={partner.tan_number} />
            </div>
        </DetailSection>
    </div>
);

const DocumentsTabView = ({ partner }: { partner: PartnerItem }) => {
    const kycDocs = [
        { name: "Agreement", fileKey: "agreement_file", verifiedKey: "agreement_verified" },
        { name: "Aadhar Card", fileKey: "aadhar_card_file", verifiedKey: "aadhar_card_verified" },
        { name: "PAN Card", fileKey: "pan_card_file", verifiedKey: "pan_card_verified" },
        { name: "GST Certificate", fileKey: "gst_certificate_file", verifiedKey: "gst_certificate_verified" },
        { name: "Office Photo", fileKey: "office_photo_file", verifiedKey: "office_photo_verified" },
        { name: "Cancel Cheque", fileKey: "cancel_cheque_file", verifiedKey: "cancel_cheque_verified" },
        { name: "Visiting Card", fileKey: "visiting_card_file", verifiedKey: "visiting_card_verified" },
        { name: "Authority Letter", fileKey: "authority_letter_file", verifiedKey: "authority_letter_verified" },
        { name: "Other Document", fileKey: "other_document_file", verifiedKey: "other_document_verified" },
    ].filter(doc => partner[doc.fileKey as keyof PartnerItem]);

    const partnerCertificates = partner.partner_certificate || [];

    if (kycDocs.length === 0 && partnerCertificates.length === 0) {
        return <NoDataMessage message="No documents are available for this partner." />;
    }

    return (
        <div className='space-y-4'>
            {kycDocs.map(doc => <DocumentCard key={doc.fileKey} name={doc.name} url={partner[doc.fileKey as keyof PartnerItem] as string | null} verified={partner[doc.verifiedKey as keyof PartnerItem]} />)}
            {partnerCertificates.map(cert => <DocumentCard key={cert.id} name={cert.certificate_name} url={cert.upload_certificate_path || null} />)}
        </div>
    );
};

const BankDetailsTabView = ({ partner }: { partner: PartnerItem }) => {
    const allBanks = [
        { id: -1, type: 'Primary', bank_account_number: partner.primary_account_number, bank_name: partner.primary_bank_name, ifsc_code: partner.primary_ifsc_code },
        { id: -2, type: 'Secondary', bank_account_number: partner.secondary_account_number, bank_name: partner.secondary_bank_name, ifsc_code: partner.secondary_ifsc_code },
        ...(partner.partner_bank_details || []).map(b => ({ ...b, type: b.type || 'Other' })),
    ].filter(b => b && b.bank_account_number);

    if (allBanks.length === 0) return <NoDataMessage message="No bank details found." />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allBanks.map(bank => <InfoCard key={bank.id} title={`${bank.type} Bank`} data={[{ label: "Account No.", value: bank.bank_account_number },{ label: "Bank Name", value: bank.bank_name },{ label: "IFSC Code", value: bank.ifsc_code }]} />)}
        </div>
    );
};

const TeamManagementTabView = ({ partner }: { partner: PartnerItem }) => {
    const members = partner.partner_team_members || [];
    if (members.length === 0) return <NoDataMessage message="No team members found." />;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m, i) => <InfoCard key={i} title={m.person_name} data={[{ label: 'Designation', value: m.designation },{ label: 'Company', value: m.company_name },{ label: 'Email', value: m.email },{ label: 'Contact', value: m.number }]} />)}
        </div>
    );
};

const OfficesTabView = ({ partner }: { partner: PartnerItem }) => {
    const offices = partner.office_info || [];
    if (offices.length === 0) return <NoDataMessage message="No office locations found." />;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offices.map(o => <InfoCard key={o.id} title={o.office_name} data={[{ label: 'Type', value: o.office_type },{ label: 'Address', value: o.address },{ label: 'Location', value: `${o.city}, ${o.state}` },{ label: 'Contact', value: o.contact_person }]} />)}
        </div>
    );
};

const ReferencesTabView = ({ partner }: { partner: PartnerItem }) => {
    const references = partner.partner_references || [];
    if (references.length === 0) return <NoDataMessage message="No references found." />;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {references.map(r => <InfoCard key={r.id} title={`Ref ID: ${r.referenced_partner_id}`} data={[{ label: 'Company ID', value: r.company_id },{ label: 'Email', value: r.email },{ label: 'Contact', value: r.number },{ label: 'Remark', value: r.remark }]} />)}
        </div>
    );
};

const AccessibilityTabView = ({ partner }: { partner: PartnerItem }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
        <InfoPair label="KYC Verified" value={partner.kyc_verified ? <Tag className="bg-emerald-500 text-white">Yes</Tag> : <Tag className="bg-red-500 text-white">No</Tag>} />
        <InfoPair label="Billing Enabled" value={partner.enable_billing ? <Tag className="bg-emerald-500 text-white">Yes</Tag> : <Tag className="bg-red-500 text-white">No</Tag>} />
        <InfoPair label="Billing Cycle (Days)" value={partner.billing_cycle} />
    </div>
);


// --- MAIN PARTNER VIEW PAGE ---
const PartnerView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [partner, setPartner] = useState<PartnerItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>(partnerViewNavigationList[0].link);

    useEffect(() => {
        if (!id) {
            toast.push(<Notification type="danger" title="Error">No Partner ID provided.</Notification>);
            navigate('/business-entities/partner');
            return;
        }

        const fetchPartner = async () => {
            setLoading(true);
            try {
                const response = await dispatch(getpartnerByIdAction(id)).unwrap();
                setPartner(response);
            } catch (error: any) {
                toast.push(<Notification type="danger" title="Fetch Error">{error?.message || 'Failed to load partner data.'}</Notification>);
            } finally {
                setLoading(false);
            }
        };
        fetchPartner();
    }, [id, dispatch, navigate]);

    const renderActiveSection = () => {
        if (!partner) return <NoDataMessage message="Partner data is not available." />;

        switch (activeSection) {
            case "details": return <DetailsTabView partner={partner} />;
            case "documents": return <DocumentsTabView partner={partner} />;
            case "bank": return <BankDetailsTabView partner={partner} />;
            case "team": return <TeamManagementTabView partner={partner} />;
            case "offices": return <OfficesTabView partner={partner} />;
            case "references": return <ReferencesTabView partner={partner} />;
            case "accessibility": return <AccessibilityTabView partner={partner} />;
            default: return <DetailsTabView partner={partner} />;
        }
    };

    if (loading) {
        return <Container className="h-full flex justify-center items-center"><Spinner size={40} /></Container>;
    }

    if (!partner) {
        return (
            <Container>
                <Card className="text-center p-8">
                    <h4 className="mb-4">Partner Not Found</h4>
                    <p>The partner you are looking for does not exist or could not be loaded.</p>
                    <Button className="mt-4" onClick={() => navigate('/business-entities/partner')}>Back to List</Button>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="h-full">
            <div className="flex gap-1 items-end mb-4">
                <NavLink to="/business-entities/partner"><h6 className="font-semibold hover:text-primary-600">Partners</h6></NavLink>
                <BiChevronRight size={18} />
                <h6 className="font-semibold text-primary-600">{partner.partner_name}</h6>
            </div>
            <Card bodyClass="p-0">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700"><PartnerProfileHeader partner={partner} /></div>
                <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700"><PartnerViewNavigator activeSection={activeSection} onNavigate={setActiveSection} /></div>
                <div className="p-4 sm:p-6">{renderActiveSection()}</div>
            </Card>
        </Container>
    );
};

export default PartnerView;