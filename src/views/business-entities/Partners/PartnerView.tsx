import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { BiChevronRight } from 'react-icons/bi';

// UI Components
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import DataTable from '@/components/shared/DataTable';
import Tooltip from '@/components/ui/Tooltip';
import {
    TbUserCircle,
    TbMail,
    TbPhone,
    TbBuilding,
    TbBriefcase,
    TbCalendar,
    TbPencil,
    TbDownload,
    TbUser,
    TbUsersGroup,
    TbLicense,
    TbLinkOff,
    TbArrowLeft
} from 'react-icons/tb';

// Types and Data
import type { ColumnDef } from '@/components/shared/DataTable';
import { PartnerItem, getPartnerStatusClass } from './Partners'; // Make sure these are exported from PartnerList.tsx
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { getpartnerAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';

// --- Reusable Helper Components ---

interface PartnerProfileHeaderProps {
    partner: PartnerItem | null;
}
const PartnerProfileHeader = ({ partner }: PartnerProfileHeaderProps) => {
    const navigate = useNavigate();

    if (!partner) {
        return <p className="text-center">Partner not found.</p>;
    }

    const handleEdit = () => {
        navigate(`/business-entities/partner-edit/${partner.id}`);
    };

    return (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
                <Avatar
                    size={110}
                    shape="circle"
                    src={partner.partner_logo ? `https://aazovo.codefriend.in/${partner.partner_logo}` : undefined}
                    icon={<TbBuilding />}
                />
                <div className="flex flex-col">
                    <h4 className="font-bold">{partner.partner_name}</h4>
                    <div className="flex items-center gap-2 mb-1">
                        <TbMail className="text-gray-400" /> <p>{partner.primary_email_id}</p>
                    </div>
                    {partner.primary_contact_number && (
                        <div className="flex items-center gap-2">
                            <TbPhone className="text-gray-400" /> <p>{partner.primary_contact_number_code} {partner.primary_contact_number}</p>
                        </div>
                    )}
                    <div className="mt-2">
                        <Tag className={`${getPartnerStatusClass(partner.status)} capitalize`}>
                            {partner.status}
                        </Tag>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4">
                <div className="flex items-center gap-2">
                    <TbUserCircle className="text-gray-400" />
                    <span className="font-semibold">Owner:</span>
                    <span>{partner.owner_name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <TbBriefcase className="text-gray-400" />
                    <span className="font-semibold">Ownership:</span>
                    <span>{partner.ownership_type || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <TbCalendar className="text-gray-400" />
                    <span className="font-semibold">Member Since:</span>
                    <span>{dayjs(partner.created_at).format('D MMM YYYY')}</span>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                <Button variant="solid" icon={<TbPencil />} onClick={handleEdit}>
                    Edit Partner
                </Button>
                 <Button icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/partner')}>Back to List</Button>
            </div>
        </div>
    );
};

const partnerViewNavigationList = [
    { label: "Details", link: "details", icon: <TbUser /> },
    { label: "Teams", link: "teams", icon: <TbUsersGroup /> },
];

type NavigatorComponentProps = {
    activeSection: string;
    onNavigate: (sectionKey: string) => void;
};

const PartnerViewNavigator = ({ activeSection, onNavigate }: NavigatorComponentProps) => {
    return (
        <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
            {partnerViewNavigationList.map((nav) => (
                <button
                    type="button"
                    key={nav.link}
                    className={classNames(
                        "cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max flex items-center justify-center gap-2",
                        "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none",
                        {
                            "bg-indigo-50 dark:bg-indigo-700/60 text-indigo-600 dark:text-indigo-200 font-semibold": activeSection === nav.link,
                            "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200": activeSection !== nav.link,
                        }
                    )}
                    onClick={() => onNavigate(nav.link)}
                    title={nav.label}
                >
                    {nav.icon}
                    <span className="font-medium text-xs sm:text-sm truncate">{nav.label}</span>
                </button>
            ))}
        </div>
    );
};

const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => (
    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-600 last:mb-0 last:pb-0 last:border-b-0">
        <div className="flex items-center gap-2 mb-4">
            {icon} <h5 className="mb-0">{title}</h5>
        </div>
        <div>{children}</div>
    </div>
);

const InfoPair = ({ label, value }: { label: string; value: React.ReactNode | string | number | undefined; }) => (
    <div className="grid grid-cols-2 py-1.5">
        <span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <span>{value || "N/A"}</span>
    </div>
);

// --- TAB COMPONENTS ---

const DetailsTab = ({ partner }: { partner: PartnerItem }) => {
    return (
        <div>
            <DetailSection title="Basic Information" icon={<TbBuilding size={22} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <InfoPair label="Partner Code" value={partner.partner_code} />
                    <InfoPair label="Ownership Type" value={partner.ownership_type} />
                    <InfoPair label="Owner Name" value={partner.owner_name} />
                </div>
            </DetailSection>
            <DetailSection title="Contact Information" icon={<TbPhone size={22} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <InfoPair label="Primary Email" value={partner.primary_email_id} />
                    <InfoPair label="Primary Contact" value={`${partner.primary_contact_number_code} ${partner.primary_contact_number}`} />
                    <InfoPair label="Website" value={partner.partner_website ? <a href={partner.partner_website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{partner.partner_website}</a> : 'N/A'} />
                </div>
            </DetailSection>
            <DetailSection title="Legal & Financial IDs" icon={<TbLicense size={22} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <InfoPair label="GST Number" value={partner.gst_number} />
                    <InfoPair label="PAN Number" value={partner.pan_number} />
                    <InfoPair label="KYC Verified" value={partner.kyc_verified ? <Tag className="bg-emerald-500 text-white">Yes</Tag> : <Tag className="bg-red-500 text-white">No</Tag>} />
                </div>
            </DetailSection>
        </div>
    );
};

const TeamsTab = ({ partner }: { partner: PartnerItem }) => {
    // This assumes the API might include team details in the future.
    // For now, we'll use a placeholder or a simple count.
    const teams = (partner.teams || []) as { id: string, name: string, memberCount: number }[];

    if (!teams.length) {
        return <p className="text-center">No team information available for this partner.</p>;
    }

    // If you had team data, you would map it here.
    return (
        <div>
            <p>Team data would be displayed here.</p>
        </div>
    );
};


// --- MAIN PARTNER VIEW PAGE ---
const PartnerView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>(partnerViewNavigationList[0].link);

    const { partnerData } = useSelector(masterSelector);

    const dispatch = useAppDispatch();
    const partner = useMemo(() => {
        if (!id || !partnerData?.data) return null;
        // Note: Partner ID from API is a string in your type, so no parseInt
        return partnerData?.data.find((p: PartnerItem) => p.id == id);
    }, [id, partnerData?.data]);

    useEffect(() => {
        if (partnerData?.data) {
            setLoading(false);
        }
    }, [partnerData?.data]);
    useEffect(() => {
        dispatch(getpartnerAction());
    }, [dispatch]);

    const renderActiveSection = () => {
        if (!partner) return <p>Partner data is not available.</p>;

        switch (activeSection) {
            case "details": return <DetailsTab partner={partner} />;
            case "teams": return <TeamsTab partner={partner} />;
            default: return <DetailsTab partner={partner} />;
        }
    };

    if (loading) {
        return <Container className="h-full flex justify-center items-center"><p>Loading partner details...</p></Container>;
    }

    if (!partner) {
        return (
            <Container>
                <Card className="text-center">
                    <h4 className="mb-4">Partner Not Found</h4>
                    <p>The partner you are looking for does not exist.</p>
                    <Button className="mt-4" onClick={() => navigate('/business-entities/partner-list')}>
                        Back to List
                    </Button>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="h-full">
            <div className="flex gap-1 items-end mb-4">
                <NavLink to="/business-entities/partner-list">
                    <h6 className="font-semibold hover:text-primary-600">Partners</h6>
                </NavLink>
                <BiChevronRight size={18} />
                <h6 className="font-semibold text-primary-600">{partner.partner_name}</h6>
            </div>

            <Card bodyClass="p-0">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                    <PartnerProfileHeader partner={partner} />
                </div>
                <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                    <PartnerViewNavigator activeSection={activeSection} onNavigate={setActiveSection} />
                </div>
                <div className="p-4 sm:p-6">{renderActiveSection()}</div>
            </Card>
        </Container>
    );
};

export default PartnerView;