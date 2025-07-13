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
import { DatePicker } from '@/components/ui';

// Icons
import { BiChevronRight } from 'react-icons/bi';
import {
    TbUserCircle, TbMail, TbPhone, TbBuilding, TbBriefcase, TbCalendar, TbPencil, TbDownload,
    TbUser, TbFileText, TbBuildingBank, TbReportMoney, TbArrowLeft, TbUsersGroup, TbLicense,
    TbWorld, TbCheck, TbX, TbFileDescription, TbMessage2, TbStar, TbUserCheck,
    TbFile, TbFileSpreadsheet, TbFileTypePdf, TbPhoto, TbChevronLeft, TbChevronRight
} from 'react-icons/tb';

// Types, Redux and Helpers
import { getpartnerByIdAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';


// --- START: Full-Screen Viewer Helper Components ---
interface ImageViewerProps {
  images: { src: string; alt: string }[];
  startIndex: number;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const handleNext = () => setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  const handlePrev = () => setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!images || images.length === 0) return null;
  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-[100] transition-opacity duration-300 p-4" onClick={onClose}>
      <Button type="button" shape="circle" variant="solid" icon={<TbX />} className="absolute top-4 right-4 z-[102] bg-black/50 hover:bg-black/80" onClick={onClose} />
      <div className="w-full h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <div className="relative flex-grow flex items-center justify-center w-full max-w-6xl overflow-hidden">
          <Button type="button" shape="circle" variant="solid" size="lg" icon={<TbChevronLeft />} className="absolute left-2 md:left-4 opacity-70 hover:opacity-100 transition-opacity z-[101] bg-black/50 hover:bg-black/80" onClick={handlePrev} />
          <div className="flex flex-col items-center justify-center h-full">
            <img src={currentImage.src} alt={currentImage.alt} className="max-h-[calc(100%-4rem)] max-w-full object-contain select-none transition-transform duration-300" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1.5 rounded-md">{currentImage.alt} ({currentIndex + 1} / {images.length})</div>
          </div>
          <Button type="button" shape="circle" variant="solid" size="lg" icon={<TbChevronRight />} className="absolute right-2 md:right-4 opacity-70 hover:opacity-100 transition-opacity z-[101] bg-black/50 hover:bg-black/80" onClick={handleNext} />
        </div>
        <div className="w-full max-w-5xl flex-shrink-0 mt-4">
          <div className="flex justify-center p-2"><div className="flex gap-3 overflow-x-auto pb-2">{images.map((image, index) => (<button type="button" key={index} onClick={() => setCurrentIndex(index)} className={classNames("w-24 h-16 flex-shrink-0 rounded-md border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white", currentIndex === index ? 'border-white opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100')}><img src={image.src} alt={image.alt} className="w-full h-full object-cover rounded-sm" /></button>))}</div></div>
        </div>
      </div>
    </div>
  );
};

const GenericFileViewer = ({ fileUrl, fileName, onClose }: { fileUrl: string; fileName: string; onClose: () => void; }) => {
  const fileExtension = useMemo(() => fileName.split('.').pop()?.toLowerCase(), [fileName]);
  const isPdf = fileExtension === 'pdf';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getFileIcon = () => {
    switch (fileExtension) {
      case 'pdf': return <TbFileTypePdf className="text-red-500" size={64} />;
      case 'xls': case 'xlsx': return <TbFileSpreadsheet className="text-green-500" size={64} />;
      default: return <TbFile className="text-gray-500" size={64} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-[100] transition-opacity duration-300 p-4" onClick={onClose}>
      <Button type="button" shape="circle" variant="solid" icon={<TbX />} className="absolute top-4 right-4 z-[102] bg-black/50 hover:bg-black/80" onClick={onClose} />
      <div className="w-full h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        {isPdf ? <iframe src={fileUrl} title={fileName} className="w-full h-full border-none rounded-lg bg-white" /> : <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center flex flex-col items-center justify-center max-w-md">{getFileIcon()}<h4 className="mb-2 mt-4">Preview not available</h4><p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xs">You can open this file in a new tab to view or download it.</p><Button variant="solid" onClick={() => window.open(fileUrl, '_blank')}>Open '{fileName}'</Button></div>}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-sm px-3 py-1.5 rounded-md">{fileName}</div>
      </div>
    </div>
  );
};
// --- END: Full-Screen Viewer Helper Components ---


// --- Type Definitions for a Single Partner ---
interface CountryReference { id: number; name: string; }
interface ContinentReference { id: number; name: string; }
interface PartnerCertificate { id: number; certificate_name: string; upload_certificate_path: string | null; }
interface PartnerBankDetail { id: number; type: string; bank_account_number: string; bank_name: string; ifsc_code: string; swift_code?: string; }
interface PartnerTeamMember { id: number; person_name: string; team_name: string; designation: string; number: string; }
interface PartnerSpotVerification { id: number; verified_by_name?: string; verified: boolean; remark: string | null; photo_upload: string | null; }

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
}

// --- Reusable Helper Components ---
const getPartnerStatusClass = (status?: string) => { const s = status?.toLowerCase() || ''; switch (s) { case 'active': case 'approved': case 'verified': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100'; case 'inactive': return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100'; case 'non verified': return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100'; case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100'; default: return 'bg-gray-100 text-gray-500'; } };
const PartnerProfileHeader = ({ partner }: { partner: ApiSinglePartnerItem }) => { const navigate = useNavigate(); return <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="flex items-center gap-4"><div><h4 className="font-bold">({String(partner.id).padStart(5, '0') || 'N/A'}) - {partner.partner_name}</h4><div className="flex items-center gap-2 mb-1 text-sm"><TbMail className="text-gray-400" /> <p>{partner.primary_email_id}</p></div>{partner.primary_contact_number && (<div className="flex items-center gap-2 text-sm"><TbPhone className="text-gray-400" /> <p>{partner.primary_contact_number_code} {partner.primary_contact_number}</p></div>)}<div className="mt-2"><Tag className={`${getPartnerStatusClass(partner.status)} capitalize`}>{partner.status || 'N/A'}</Tag></div></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm"><div className="flex items-center gap-2"><TbUser className="text-gray-400" /><span className="font-semibold">Associated Co:</span><span>{partner.company_name}</span></div><div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">GST:</span><span>{partner.gst_number || 'N/A'}</span></div><div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">PAN NO:</span><span>{partner.pan_number || 'N/A'}</span></div></div><div className="flex flex-col sm:flex-row lg:flex-col gap-2"><Button variant="solid" icon={<TbPencil />} onClick={() => navigate(`/business-entities/partner-edit/${partner.id}`)}>Edit Partner</Button><Button icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/partner')}>Back to List</Button></div></div> };
const partnerViewNavigationList = [{ label: "Details", link: "details", icon: <TbUser /> },{ label: "Kyc Documents", link: "documents", icon: <TbFileText /> },{ label: "Bank & Billing", link: "bank", icon: <TbBuildingBank /> },{ label: "Teams", link: "teams", icon: <TbUsersGroup /> },{ label: "Expertise", link: "expertise", icon: <TbStar /> },];
const PartnerViewNavigator = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (s: string) => void; }) => <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">{partnerViewNavigationList.map((nav) => <button type="button" key={nav.link} className={classNames("cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max flex items-center justify-center gap-2", "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none", activeSection === nav.link ? "bg-indigo-50 dark:bg-indigo-700/60 text-indigo-600 dark:text-indigo-200 font-semibold" : "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200")} onClick={() => onNavigate(nav.link)} title={nav.label}>{nav.icon}<span className="font-medium text-xs sm:text-sm truncate">{nav.label}</span></button>)}</div>;
const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-600 last:mb-0 last:pb-0 last:border-b-0"><div className="flex items-center gap-2 mb-4">{React.cloneElement(icon as React.ReactElement, { size: 22 })}<h5 className="mb-0">{title}</h5></div><div>{children}</div></div>;
const InfoPair = ({ label, value }: { label: string; value?: React.ReactNode; }) => <div className="grid grid-cols-2 py-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span><span className="break-words">{value || <span className="text-gray-400">N/A</span>}</span></div>;
const NoDataMessage = ({ message }: { message: string }) => <div className="text-center py-8 text-gray-500">{message}</div>;
const InfoCard = ({ title, data }: { title: string, data: { label: string, value?: React.ReactNode }[] }) => <Card><h6 className="font-semibold mb-2">{title}</h6><div className="text-sm space-y-1.5">{data.map(item => (<div key={item.label} className="flex justify-between"><span className="text-gray-500">{item.label}:</span><span className="font-semibold text-right break-all">{item.value || 'N/A'}</span></div>))}</div></Card>;

// --- TAB VIEW COMPONENTS ---
const DetailsTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => <div><DetailSection title="Basic Information" icon={<TbBriefcase />}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8"><InfoPair label="Ownership Type" value={partner.ownership_type} /><InfoPair label="No. of Employees" value={partner.no_of_employees} /><InfoPair label="Associated Company" value={partner.company_name} /><InfoPair label="Establishment Year" value={partner.establishment_year} /></div></DetailSection><DetailSection title="Contact Information" icon={<TbPhone />}><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8"><InfoPair label="Alternate Email" value={partner.alternate_email_id} /><InfoPair label="Alternate Contact" value={partner.alternate_contact_number ? `${partner.alternate_contact_number_code} ${partner.alternate_contact_number}` : 'N/A'} /><InfoPair label="Website" value={partner.partner_website ? <a href={partner.partner_website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{partner.partner_website}</a> : 'N/A'} /></div></DetailSection><DetailSection title="Address" icon={<TbWorld />}><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8"><InfoPair label="Full Address" value={partner.partner_address} /><InfoPair label="City" value={partner.city} /><InfoPair label="State" value={partner.state} /><InfoPair label="Zip Code" value={partner.zip_code} /><InfoPair label="Country" value={partner.country?.name} /><InfoPair label="Continent" value={partner.continent?.name} /></div></DetailSection></div>;
const BankAndBillingTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => { const allBanks = [{ id: -1, type: 'Primary', bank_account_number: partner.primary_account_number, bank_name: partner.primary_bank_name, ifsc_code: partner.primary_ifsc_code, swift_code: null },{ id: -2, type: 'Secondary', bank_account_number: partner.secondary_account_number, bank_name: partner.secondary_bank_name, ifsc_code: partner.secondary_ifsc_code, swift_code: null }, ...(partner.partner_bank_details || []).map(b => ({ ...b, type: b.type || 'Other' }))].filter(b => b && b.bank_account_number); return <div><DetailSection title="Billing Status" icon={<TbReportMoney />}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8"><InfoPair label="KYC Verified" value={partner.kyc_verified ? <Tag className="bg-emerald-500 text-white">Yes</Tag> : <Tag className="bg-red-500 text-white">No</Tag>} /><InfoPair label="Billing Enabled" value={partner.enable_billing ? <Tag className="bg-emerald-500 text-white">Yes</Tag> : <Tag className="bg-red-500 text-white">No</Tag>} /></div></DetailSection><DetailSection title="Bank Details" icon={<TbBuildingBank />}>{allBanks.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{allBanks.map(bank => (<InfoCard key={bank.id} title={`${bank.type} Bank`} data={[{ label: "Account No.", value: bank.bank_account_number },{ label: "Bank Name", value: bank.bank_name },{ label: "IFSC Code", value: bank.ifsc_code }]} />))}</div> : <NoDataMessage message="No bank details found." />}</DetailSection></div> };
const TeamsTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => { const teams = partner.partner_team_members || []; if (teams.length === 0) return <NoDataMessage message="No team members found." />; return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{teams.map(t => (<InfoCard key={t.id} title={t.person_name} data={[{ label: 'Team', value: t.team_name },{ label: 'Designation', value: t.designation },{ label: 'Contact', value: t.number }]} />))}</div> };
const ExpertiseTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => <DetailSection title="Area of Expertise" icon={<TbStar />}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8"><InfoPair label="Joining As" value={partner.join_us_as} /><InfoPair label="Industrial Expertise" value={partner.industrial_expertise} /></div></DetailSection>;
const VerificationTabView = ({ partner }: { partner: ApiSinglePartnerItem }) => { const verifications = partner.partner_spot_verification || []; if (verifications.length === 0) return <NoDataMessage message="No spot verifications found." />; return <div className="space-y-4">{verifications.map(v => <Card key={v.id} bodyClass='p-4'><div className="flex justify-between items-center"><h6 className="font-semibold">Verified by {v.verified_by_name || 'Unknown'}</h6>{v.verified ? <Tag className='bg-emerald-100 text-emerald-700'>Verified</Tag> : <Tag className='bg-red-100 text-red-700'>Not Verified</Tag>}</div>{v.remark && <p className="text-sm mt-2 text-gray-600"><TbMessage2 className='inline-block mr-2' />{v.remark}</p>}{v.photo_upload && <Button size='sm' className='mt-2' onClick={() => window.open(v.photo_upload || '', '_blank')}>View Photo</Button>}</Card>)}</div> };

const DocumentsTabView = ({ partner, onPreviewClick }: { partner: ApiSinglePartnerItem; onPreviewClick: (doc: { name: string; url: string | null }) => void; }) => {
    const allDocs = useMemo(() => {
        const kycDocsList = [
            { name: "Aadhar Card", url: partner.aadhar_card_file, verified: partner.aadhar_card_verified },
            { name: "PAN Card", url: partner.pan_card_file, verified: partner.pan_card_verified },
            { name: "GST Certificate", url: partner.gst_certificate_file, verified: partner.gst_certificate_verified },
            { name: "Office Photo", url: partner.office_photo_file, verified: partner.office_photo_verified },
            { name: "Cancel Cheque", url: partner.cancel_cheque_file, verified: partner.cancel_cheque_verified },
            { name: "Visiting Card", url: partner.visiting_card_file, verified: partner.visiting_card_verified },
            { name: "Authority Letter", url: partner.authority_letter_file, verified: partner.authority_letter_verified },
            { name: "Agreement", url: partner.agreement_file, verified: partner.agreement_verified },
            { name: "Other Document", url: partner.other_document_file, verified: partner.other_document_verified },
        ];
        const partnerCerts = (partner.partner_certificate || []).map(cert => ({
            name: cert.certificate_name,
            url: cert.upload_certificate_path,
            verified: true
        }));
        return [...kycDocsList, ...partnerCerts].filter(doc => doc.url);
    }, [partner]);

    const isImageUrl = (url: string | null): boolean => !!url && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(url);

    if (allDocs.length === 0) {
        return <NoDataMessage message="No KYC documents or certificates are available." />;
    }

    return (
        <div className='space-y-6'>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {allDocs.map((doc, index) => (
                    <Card key={index} clickable className="h-full" onClick={() => onPreviewClick(doc)}>
                        <div className="flex flex-col items-center justify-center text-center gap-3 py-4 h-full">
                            {isImageUrl(doc.url) ? (
                                <img src={doc.url!} alt={doc.name} className="w-16 h-16 object-cover rounded-md bg-gray-100" />
                            ) : (
                                <TbFileDescription size={36} className='text-gray-400' />
                            )}
                            <h6 className="font-semibold uppercase text-sm">{doc.name}</h6>
                            {doc.verified ? 
                                <Tag className="bg-emerald-100 text-emerald-700"><TbCheck className='mr-1' />Verified</Tag> : 
                                <Tag className="bg-red-100 text-red-700"><TbX className='mr-1' />Not Verified</Tag>
                            }
                             <Button
                                size="xs"
                                variant="outline"
                                icon={<TbDownload />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(doc.url || '', '_blank');
                                }}
                            >
                                Download
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
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
  
    // --- STATE LIFTED UP FOR VIEWERS ---
    const [viewerIsOpen, setViewerIsOpen] = useState(false);
    const [viewingFile, setViewingFile] = useState<{ url: string, name: string } | null>(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
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
  
    const allDocs = useMemo(() => {
        if (!partner) return [];
        const kycDocsList = [
            { name: "Aadhar Card", url: partner.aadhar_card_file },
            { name: "PAN Card", url: partner.pan_card_file },
            { name: "GST Certificate", url: partner.gst_certificate_file },
            { name: "Office Photo", url: partner.office_photo_file },
            { name: "Cancel Cheque", url: partner.cancel_cheque_file },
            { name: "Visiting Card", url: partner.visiting_card_file },
            { name: "Authority Letter", url: partner.authority_letter_file },
            { name: "Agreement", url: partner.agreement_file },
            { name: "Other Document", url: partner.other_document_file },
        ];
        const partnerCerts = (partner.partner_certificate || []).map(cert => ({
            name: cert.certificate_name,
            url: cert.upload_certificate_path,
        }));
        return [...kycDocsList, ...partnerCerts].filter(doc => doc.url);
    }, [partner]);
    
    const imageDocsForViewer = useMemo(() => allDocs
        .filter(doc => doc.url && /\.(jpeg|jpg|gif|png|svg|webp)$/i.test(doc.url))
        .map(doc => ({ src: doc.url!, alt: doc.name })),
        [allDocs]
    );
    
    const handlePreviewClick = (doc: { name: string; url: string | null }) => {
        if (!doc.url) return;
        if (/\.(jpeg|jpg|gif|png|svg|webp)$/i.test(doc.url)) {
            const index = imageDocsForViewer.findIndex(img => img.src === doc.url);
            if (index > -1) {
                setSelectedImageIndex(index);
                setViewerIsOpen(true);
            }
        } else {
            setViewingFile({ url: doc.url, name: doc.name });
        }
    };
  
    const renderActiveSection = () => {
        if (!partner) return <NoDataMessage message="Partner data is not available." />;
  
        switch (activeSection) {
            case "details": return <DetailsTabView partner={partner} />;
            case "documents": return <DocumentsTabView partner={partner} onPreviewClick={handlePreviewClick} />;
            case "bank": return <BankAndBillingTabView partner={partner} />;
            case "teams": return <TeamsTabView partner={partner} />;
            case "expertise": return <ExpertiseTabView partner={partner} />;
            case "verification": return <VerificationTabView partner={partner} />;
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
            
            {/* Viewers are now rendered at the top level */}
            {viewerIsOpen && (
                <ImageViewer
                    images={imageDocsForViewer}
                    startIndex={selectedImageIndex}
                    onClose={() => setViewerIsOpen(false)}
                />
            )}
            {viewingFile && (
                <GenericFileViewer
                    fileUrl={viewingFile.url}
                    fileName={viewingFile.name}
                    onClose={() => setViewingFile(null)}
                />
            )}
        </Container>
    );
};

export default PartnerView;