import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import classNames from 'classnames';

// --- UI Components ---
import Container from '@/components/shared/Container';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import Notification from '@/components/ui/Notification';
import Spinner from '@/components/ui/Spinner';
import toast from '@/components/ui/toast';
import { DatePicker } from '@/components/ui';
import Dialog from '@/components/ui/Dialog';
import Tooltip from '@/components/ui/Tooltip';


// --- Icons ---
import { BiChevronRight } from 'react-icons/bi';
import {
    TbUserCircle, TbMail, TbPhone, TbBuilding, TbBriefcase, TbCalendar, TbPencil, TbDownload,
    TbUser, TbFileText, TbBuildingBank, TbReportMoney, TbArrowLeft, TbUsersGroup, TbLicense,
    TbWorld, TbCheck, TbX, TbFileDescription, TbMessage2, TbStar, TbUserCheck, TbEye,
    TbFile, TbFileSpreadsheet, TbFileTypePdf, TbPhoto, TbChevronLeft, TbChevronRight, TbAddressBook
} from 'react-icons/tb';

// --- Types, Redux and Helpers ---
import { getpartnerByIdAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';


// --- VIEWER & CARD COMPONENTS ---
interface DocumentRecord {
    name: string;
    type: 'image' | 'pdf' | 'other';
    url: string;
    verified?: boolean;
}

const DocumentViewer: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    documents: DocumentRecord[];
    currentIndex: number;
    onNext: () => void;
    onPrev: () => void;
}> = ({ isOpen, onClose, documents, currentIndex, onNext, onPrev }) => {
    const [isContentLoaded, setIsContentLoaded] = useState(false);
    const document = documents[currentIndex];

    useEffect(() => {
        setIsContentLoaded(false);
    }, [currentIndex]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onNext, onPrev, onClose]);

    if (!document) return null;

    const renderContent = () => {
        switch (document.type) {
            case 'image':
                return <img src={document.url} alt={document.name} className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${isContentLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setIsContentLoaded(true)} />;
            case 'pdf':
                return <iframe src={document.url} title={document.name} className={`w-full h-full border-0 transition-opacity duration-300 ${isContentLoaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setIsContentLoaded(true)}></iframe>;
            default:
                if (!isContentLoaded) setIsContentLoaded(true);
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <TbFile size={60} className="mx-auto mb-4 text-gray-500" />
                        <h5 className="mb-2">{document.name}</h5>
                        <p className="mb-4 text-gray-600 dark:text-gray-300">Preview is not available for this file type.</p>
                        <a href={document.url} download target="_blank" rel="noopener noreferrer"><Button variant="solid" icon={<TbDownload />}>Download File</Button></a>
                    </div>
                );
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width="auto" height="85vh" closable={false}  contentClassName="top-0 p-0 bg-transparent">
            <div className="w-full h-full bg-black/80 backdrop-blur-sm flex flex-col">
                <header className="flex-shrink-0 h-16 bg-gray-800/50 text-white flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <h6 className="font-semibold truncate" title={document.name}>{document.name}</h6>
                        <span className="text-sm text-gray-400">{currentIndex + 1} / {documents.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <a href={document.url} download target="_blank" rel="noopener noreferrer"><Button shape="circle" variant="subtle" size="sm" icon={<TbDownload />} /></a>
                        <Button shape="circle" variant="subtle" size="sm" icon={<TbX />} onClick={onClose} />
                    </div>
                </header>
                <main className="relative flex-grow flex items-center justify-center ">
                    {!isContentLoaded && <Spinner size={40} className="absolute" />}
                    {renderContent()}
                </main>
                {documents.length > 1 && (
                    <>
                        <Button shape="circle" size="lg" icon={<TbChevronLeft />} className="!absolute left-4 top-1/2 -translate-y-1/2" onClick={onPrev} disabled={currentIndex === 0} />
                        <Button shape="circle" size="lg" icon={<TbChevronRight />} className="!absolute right-4 top-1/2 -translate-y-1/2" onClick={onNext} disabled={currentIndex === documents.length - 1} />
                    </>
                )}
            </div>
        </Dialog>
    );
};

const DocumentCard: React.FC<{ document: DocumentRecord; onPreview: () => void }> = ({ document, onPreview }) => {
    const renderPreviewIcon = () => {
        switch (document.type) {
            case 'image':
                return <img src={document.url} alt={document.name} className="w-full h-full object-cover" />;
            case 'pdf':
                return <TbFileTypePdf className="w-12 h-12 text-red-500" />;
            default:
                return <TbFile className="w-12 h-12 text-gray-500" />;
        }
    };

    return (
        <Card bodyClass="p-0" className="hover:shadow-lg transition-shadow flex flex-col">
            <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center  cursor-pointer" onClick={onPreview}>{renderPreviewIcon()}</div>
            <div className="p-4 flex flex-col flex-grow">
                <p className="font-semibold truncate flex-grow" title={document.name}>{document.name}</p>
                <div className="flex justify-between items-center mt-3">
                   {document.verified ?
                        <Tag className="bg-emerald-100 text-emerald-700"><TbCheck className='mr-1' />Verified</Tag> :
                        <Tag className="bg-red-100 text-red-700"><TbX className='mr-1' />Not Verified</Tag>
                    }
                    <div className="flex gap-2">
                        <Tooltip title="Preview"><Button shape="circle" size="sm" icon={<TbEye />} onClick={onPreview} /></Tooltip>
                        <Tooltip title="Download"><a href={document.url} download target="_blank" rel="noopener noreferrer"><Button shape="circle" size="sm" icon={<TbDownload />} /></a></Tooltip>
                    </div>
                </div>
            </div>
        </Card>
    );
};

// --- TYPE DEFINITIONS for a Single Partner ---
interface CountryReference { id: number; name: string; }
interface ContinentReference { id: number; name: string; }
interface PartnerCertificate { id: number; certificate_name: string; upload_certificate_path: string | null; }
interface PartnerBankDetail { id: number; type: string; bank_account_number: string; bank_name: string; ifsc_code: string; swift_code?: string; }
interface PartnerTeamMember { id: number; person_name: string; team_name: string; designation: string; number: string; }
interface PartnerSpotVerification { id: number; verified_by_name?: string; verified: boolean; remark: string | null; photo_upload: string | null; }
interface PartnerReference { id: number; person_name: string; contact_number: string; }

interface ApiSinglePartnerItem {
  id: number;
  partner_code: string | null;
  partner_name: string;
  status: string;
  primary_email_id: string;
  primary_contact_number: string;
  primary_contact_number_code: string;
  alternate_contact_number: string | null;
  alternate_contact_number_code: string | null;
  alternate_email_id: string | null;
  ownership_type: string;
  company_name: string;
  partner_address: string;
  country_id: number;
  state: string;
  city: string;
  zip_code: string;
  gst_number: string | null;
  pan_number: string | null;
  establishment_year: string | null;
  no_of_employees: number | null;
  partner_website: string | null;
  kyc_verified: boolean;
  enable_billing: boolean;
  partner_logo: string | null;
  primary_account_number: string | null;
  primary_bank_name: string | null;
  primary_ifsc_code: string | null;
  secondary_account_number: string | null;
  secondary_bank_name: string | null;
  secondary_ifsc_code: string | null;
  agreement_file: string | null;
  agreement_verified: boolean;
  office_photo_file: string | null;
  office_photo_verified: boolean;
  gst_certificate_file: string | null;
  gst_certificate_verified: boolean;
  visiting_card_file: string | null;
  visiting_card_verified: boolean;
  authority_letter_file: string | null;
  authority_letter_verified: boolean;
  cancel_cheque_file: string | null;
  cancel_cheque_verified: boolean;
  aadhar_card_file: string | null;
  aadhar_card_verified: boolean;
  pan_card_file: string | null;
  pan_card_verified: boolean;
  other_document_file: string | null;
  other_document_verified: boolean;
  industrial_expertise: string;
  join_us_as: string;
  created_at: string;
  country?: CountryReference;
  continent?: ContinentReference | null;
  partner_certificate?: PartnerCertificate[];
  partner_bank_details?: PartnerBankDetail[];
  partner_team_members?: PartnerTeamMember[];
  partner_spot_verification?: PartnerSpotVerification[];
  partner_references?: PartnerReference[];
}

// --- REUSABLE HELPER COMPONENTS ---
const getPartnerStatusClass = (status?: string) => { const s = status?.toLowerCase() || ''; switch (s) { case 'active': case 'approved': case 'verified': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100'; case 'inactive': return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100'; case 'non verified': return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100'; case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100'; default: return 'bg-gray-100 text-gray-500'; } };
const PartnerProfileHeader = ({ partner }: { partner: ApiSinglePartnerItem }) => {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div>
                    <h4 className="font-bold">({String(partner.id).padStart(5, '0') || 'N/A'}) - {partner.partner_name}</h4>
                    <div className="flex items-center gap-2 mb-1 text-sm"><TbMail className="text-gray-400" /> <p>{partner.primary_email_id}</p></div>
                    {partner.primary_contact_number && (<div className="flex items-center gap-2 text-sm"><TbPhone className="text-gray-400" /> <p>{partner.primary_contact_number_code} {partner.primary_contact_number}</p></div>)}
                    <div className="mt-2 flex items-center gap-2">
                        <Tag className={`${getPartnerStatusClass(partner.status)} capitalize`}>{partner.status || 'N/A'}</Tag>
                        {partner.kyc_verified ? (
                            <Tag className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"><TbUserCheck className='mr-1' />KYC Verified</Tag>
                        ) : (
                            <Tag className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100"><TbUserCheck className='mr-1' />KYC Not Verified</Tag>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm">
                <div className="flex items-center gap-2"><TbBuilding className="text-gray-400" /><span className="font-semibold">Company Name:</span><span>{partner.company_name}</span></div>
                <div className="flex items-center gap-2"><TbStar className="text-gray-400" /><span className="font-semibold">Industry Expertise:</span><span>{partner.industrial_expertise}</span></div>
                <div className="flex items-center gap-2"><TbUser className="text-gray-400" /><span className="font-semibold">Joined As:</span><span>{partner.join_us_as}</span></div>
                <div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">GST Number:</span><span>{partner.gst_number || 'N/A'}</span></div>
                <div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">PAN Number:</span><span>{partner.pan_number || 'N/A'}</span></div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                <Button variant="solid" icon={<TbPencil />} onClick={() => navigate(`/business-entities/partner-edit/${partner.id}`)}>Edit Partner</Button>
                <Button icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/partner')}>Back to List</Button>
            </div>
        </div>
    );
};
const partnerViewNavigationList = [
    { label: "Primary View", link: "details", icon: <TbUser /> },
    { label: "Kyc Documents", link: "documents", icon: <TbFileText /> },
    { label: "Bank Details", link: "bank", icon: <TbBuildingBank /> },
    { label: "Team View", link: "teams", icon: <TbUsersGroup /> },
    { label: "References", link: "references", icon: <TbAddressBook /> }
];
const PartnerViewNavigator = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (s: string) => void; }) => <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">{partnerViewNavigationList.map((nav) => <button type="button" key={nav.link} className={classNames("cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max flex items-center justify-center gap-2", "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none", activeSection === nav.link ? "bg-indigo-50 dark:bg-indigo-700/60 text-indigo-600 dark:text-indigo-200 font-semibold" : "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200")} onClick={() => onNavigate(nav.link)} title={nav.label}>{nav.icon}<span className="font-medium text-xs sm:text-sm truncate">{nav.label}</span></button>)}</div>;
const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-600 last:mb-0 last:pb-0 last:border-b-0"><div className="flex items-center gap-2 mb-4">{React.cloneElement(icon as React.ReactElement, { size: 22 })}<h5 className="mb-0">{title}</h5></div><div>{children}</div></div>;
const InfoPair = ({ label, value }: { label: string; value?: React.ReactNode; }) => <div className="grid grid-cols-2 py-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span><span className="break-words">{value || <span className="text-gray-400">N/A</span>}</span></div>;
const NoDataMessage = ({ message }: { message: string }) => <div className="text-center py-8 text-gray-500">{message}</div>;
const InfoCard = ({ title, data }: { title: string, data: { label: string, value?: React.ReactNode }[] }) => <Card><h6 className="font-semibold mb-2">{title}</h6><div className="text-sm space-y-1.5">{data.map(item => (<div key={item.label} className="flex justify-between"><span className="text-gray-500">{item.label}:</span><span className="font-semibold text-right break-all">{item.value || 'N/A'}</span></div>))}</div></Card>;

// --- TAB VIEW COMPONENTS ---
const DetailsTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => <div><DetailSection title="Basic Information" icon={<TbBriefcase />}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8"><InfoPair label="Ownership Type" value={partner.ownership_type} /><InfoPair label="No. of Employees" value={partner.no_of_employees} /><InfoPair label="Establishment Year" value={partner.establishment_year} /></div></DetailSection><DetailSection title="Contact Information" icon={<TbPhone />}><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8"><InfoPair label="Alternate Email" value={partner.alternate_email_id} /><InfoPair label="Alternate Contact" value={partner.alternate_contact_number ? `${partner.alternate_contact_number_code} ${partner.alternate_contact_number}` : 'N/A'} /><InfoPair label="Website" value={partner.partner_website ? <a href={partner.partner_website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{partner.partner_website}</a> : 'N/A'} /></div></DetailSection><DetailSection title="Address" icon={<TbWorld />}><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8"><InfoPair label="Full Address" value={partner.partner_address} /><InfoPair label="City" value={partner.city} /><InfoPair label="State" value={partner.state} /><InfoPair label="Zip Code" value={partner.zip_code} /><InfoPair label="Country" value={partner.country?.name} /><InfoPair label="Continent" value={partner.continent?.name} /></div></DetailSection></div>;
const BankAndBillingTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => {
    const allBanks = [
        { id: -1, type: 'Primary', bank_account_number: partner.primary_account_number, bank_name: partner.primary_bank_name, ifsc_code: partner.primary_ifsc_code, swift_code: null },
        { id: -2, type: 'Secondary', bank_account_number: partner.secondary_account_number, bank_name: partner.secondary_bank_name, ifsc_code: partner.secondary_ifsc_code, swift_code: null },
        ...(partner.partner_bank_details || []).map(b => ({ ...b, type: b.type || 'Other' }))
    ].filter(b => b && b.bank_account_number);

    return (
        <div>
            <DetailSection title="Bank Details" icon={<TbBuildingBank />}>
                {allBanks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allBanks.map(bank => (
                            <InfoCard
                                key={bank.id}
                                title={`${bank.type} Bank`}
                                data={[
                                    { label: "Account No.", value: bank.bank_account_number },
                                    { label: "Bank Name", value: bank.bank_name },
                                    { label: "IFSC Code", value: bank.ifsc_code }
                                ]}
                            />
                        ))}
                    </div>
                ) : (
                    <NoDataMessage message="No bank details found." />
                )}
            </DetailSection>
        </div>
    );
};
const TeamsTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => { const teams = partner.partner_team_members || []; if (teams.length === 0) return <NoDataMessage message="No team members found." />; return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{teams.map(t => (<InfoCard key={t.id} title={t.person_name} data={[{ label: 'Team', value: t.team_name },{ label: 'Designation', value: t.designation },{ label: 'Contact', value: t.number }]} />))}</div> };

const ReferencesTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => {
    const references = partner.partner_references || [];
    if (references.length === 0) return <NoDataMessage message="No references found." />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {references.map(r => (
                <InfoCard
                    key={r.id}
                    title={r.person_name}
                    data={[{ label: 'Contact', value: r.contact_number }]}
                />
            ))}
        </div>
    );
};

const DocumentsTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => {
    const [viewerState, setViewerState] = useState({ isOpen: false, index: 0 });

    const documentList = useMemo((): DocumentRecord[] => {
        const docs: DocumentRecord[] = [];
        const getFileType = (url: string | null): 'image' | 'pdf' | 'other' => {
            if (!url) return 'other';
            const extension = url.split('.').pop()?.toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
            if (extension === 'pdf') return 'pdf';
            return 'other';
        };

        const addDoc = (name: string, url: string | null, verified?: boolean) => {
            if (url) {
                docs.push({ name, url, type: getFileType(url), verified });
            }
        };

        addDoc("Aadhar Card", partner.aadhar_card_file, partner.aadhar_card_verified);
        addDoc("PAN Card", partner.pan_card_file, partner.pan_card_verified);
        addDoc("GST Certificate", partner.gst_certificate_file, partner.gst_certificate_verified);
        addDoc("Office Photo", partner.office_photo_file, partner.office_photo_verified);
        addDoc("Cancel Cheque", partner.cancel_cheque_file, partner.cancel_cheque_verified);
        addDoc("Visiting Card", partner.visiting_card_file, partner.visiting_card_verified);
        addDoc("Authority Letter", partner.authority_letter_file, partner.authority_letter_verified);
        addDoc("Agreement", partner.agreement_file, partner.agreement_verified);
        addDoc("Other Document", partner.other_document_file, partner.other_document_verified);
        
        (partner.partner_certificate || []).forEach(cert => {
            addDoc(cert.certificate_name, cert.upload_certificate_path, true);
        });

        return docs;
    }, [partner]);

    if (documentList.length === 0) {
        return <NoDataMessage message="No KYC documents or certificates are available." />;
    }

    const handlePreview = (index: number) => setViewerState({ isOpen: true, index });
    const handleCloseViewer = () => setViewerState({ isOpen: false, index: 0 });
    const handleNext = () => setViewerState(prev => ({ ...prev, index: Math.min(prev.index + 1, documentList.length - 1) }));
    const handlePrev = () => setViewerState(prev => ({ ...prev, index: Math.max(prev.index - 1, 0) }));

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {documentList.map((doc, index) => (
                    <DocumentCard key={index} document={doc} onPreview={() => handlePreview(index)} />
                ))}
            </div>
            <DocumentViewer
                isOpen={viewerState.isOpen}
                onClose={handleCloseViewer}
                documents={documentList}
                currentIndex={viewerState.index}
                onNext={handleNext}
                onPrev={handlePrev}
            />
        </div>
    );
};


// --- MAIN PARTNER VIEW PAGE ---
const PartnerView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
  
    const [partner, setPartner] = useState<ApiSinglePartnerItem | null>(null);
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
            case "bank": return <BankAndBillingTabView partner={partner} />;
            case "teams": return <TeamsTabView partner={partner} />;
            case "references": return <ReferencesTabView partner={partner} />;
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