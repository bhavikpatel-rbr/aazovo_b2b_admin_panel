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
    TbWorld, TbCheck, TbX, TbFileDescription, TbUserSearch, TbMessage2, TbEye,
    TbCoinRupee, TbFileInvoice, TbFile, TbFileTypePdf, TbPhoto, TbChevronLeft, TbChevronRight
} from 'react-icons/tb';

// --- Types, Redux and Helpers ---
import { getCompanyByIdAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';

// --- TYPE DEFINITIONS (Matching the provided JSON) ---
interface OfficeInfo { id: number; office_type: string; office_name: string; state: string; city: string; zip_code: string; gst_number: string; address: string; office_email: string; contact_person: string | null; office_phone: string | null; }
interface FilledForm { id: number; accountdoc_id: number; created_at: string; form_data?: { uploads_doc_s?: { [key: string]: string | undefined; } } }
interface TransactionDoc { id: number; company_document: string; invoice_number: string; status: string; created_at: string; filled_form?: FilledForm; }
interface Reference { id: number; person_name: string; designation?: string; contact_number?: string; relation?: string; company_id?: number; number?: string; remark?: string; }
interface EnableBillingDocument { id: number; document_name: string; document: string; }
interface ApiSingleCompanyItem { id: number; company_code: string; company_name: string; status: string; primary_email_id: string | null; primary_contact_number: string | null; primary_contact_number_code: string | null; alternate_contact_number?: string | null; alternate_contact_number_code?: string | null; general_contact_number?: string | null; general_contact_number_code?: string | null; ownership_type: string; owner_name: string; company_address?: string | null; country_id: number; state?: string | null; city?: string | null; zip_code?: string | null; gst_number: string; pan_number: string; trn_number?: string | null; tan_number?: string | null; establishment_year?: string | null; no_of_employees?: number | null; company_website?: string | null; primary_business_type?: string | null; kyc_verified: boolean; enable_billing: boolean; billing_due?: string | null; due_after_3_months_date?: string | null; company_logo?: string | null; primary_account_number?: string | null; primary_bank_name?: string | null; primary_ifsc_code?: string | null; primary_swift_code?: string | null; secondary_account_number?: string | null; secondary_bank_name?: string | null; secondary_ifsc_code?: string | null; secondary_swift_code?: string | null; primary_bank_verification_photo?: string | null; secondary_bank_verification_photo?: string | null; aadhar_card_file?: string | null; aadhar_card_verified?: boolean; pan_card_file?: string | null; pan_card_verified?: boolean; gst_certificate_file?: string | null; gst_certificate_verified?: boolean; office_photo_file?: string | null; office_photo_verified?: boolean; cancel_cheque_file?: string | null; cancel_cheque_verified?: boolean; visiting_card_file?: string | null; visiting_card_verified?: boolean; authority_letter_file?: string | null; authority_letter_verified?: boolean; ABCQ_file?: string | null; ABCQ_verified?: boolean; other_document_file?: string | null; other_document_verified?: boolean; created_at: string; country?: { name: string }; continent?: { name: string }; company_certificate?: Array<{ id: number; certificate_name: string; upload_certificate_path: string | null }>; company_bank_details?: Array<{ id: number; type: string; bank_account_number: string; bank_name: string; ifsc_code: string; swift_code?: string; verification_photo?: string | null }>; company_member_management?: Array<{ id: number; person_name: string; member_id: string; designation: string; number: string; }>; company_team_members?: Array<{ id: number; person_name: string; team_name: string; designation: string; number: string; }>; office_info?: OfficeInfo[]; company_spot_verification?: Array<{ id: number; verified_by_name?: string; verified: boolean; remark: string | null; photo_upload: string | null; }>; transaction_docs?: TransactionDoc[]; company_references?: Reference[]; enable_billing_documents?: EnableBillingDocument[]; }


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

// --- REUSABLE HELPER COMPONENTS ---
const getCompanyStatusClass = (status?: string) => { const s = status?.toLowerCase() || ''; switch (s) { case 'active': case 'approved': case 'verified': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100'; case 'inactive': case 'disabled': return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100'; case 'blocked': case 'non verified': return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100'; case 'pending': return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100'; default: return 'bg-gray-100 text-gray-500'; } };
const CompanyProfileHeader = ({ company }: { company: ApiSingleCompanyItem }) => { const navigate = useNavigate(); return <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="flex items-center gap-4"><div><h4 className="font-bold">({company.company_code}) - {company.company_name}</h4><div className="flex items-center gap-2 mb-1 text-sm"><TbMail className="text-gray-400" /> <p>{company.primary_email_id || 'N/A'}</p></div>{company.primary_contact_number && (<div className="flex items-center gap-2 text-sm"><TbPhone className="text-gray-400" /> <p>{company.primary_contact_number_code} {company.primary_contact_number}</p></div>)}<div className="mt-2"><Tag className={`${getCompanyStatusClass(company.status)} capitalize`}>{company.status || 'N/A'}</Tag></div></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm"><div className="flex items-center gap-2"><TbUserCircle className="text-gray-400" /><span className="font-semibold">Owner:</span><span>{company.owner_name}</span></div><div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">GST:</span><span>{company.gst_number || 'N/A'}</span></div><div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">PAN NO:</span><span>{company.pan_number || 'N/A'}</span></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm"><div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">TAN No:</span><span>{company.tan_number || 'N/A'}</span></div><div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">TRN NO:</span><span>{company.trn_number || 'N/A'}</span></div></div><div className="flex flex-col sm:flex-row lg:flex-col gap-2"><Button variant="solid" icon={<TbPencil />} onClick={() => navigate(`/business-entities/company-edit/${company.id}`)}>Edit Company</Button><Button icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/company')}>Back to List</Button></div></div> };
const companyViewNavigationList = [{ label: "Details", link: "details", icon: <TbUser /> },{ label: "Kyc Documents", link: "documents", icon: <TbFileText /> },{ label: "Bank", link: "bank", icon: <TbBuildingBank /> },{ label: "Accessibility", link: "accessibility", icon: <TbFileDescription /> },{ label: "References", link: "references", icon: <TbUserSearch /> },{ label: "Members", link: "members", icon: <TbUsersGroup /> },{ label: "Teams", link: "teams", icon: <TbUsersGroup /> },{ label: "Offices", link: "offices", icon: <TbBuilding /> },{ label: "Verification", link: "verification", icon: <TbLicense /> },{ label: "Transactions", link: "transactions", icon: <TbCoinRupee /> }];
const CompanyViewNavigator = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (s: string) => void; }) => <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">{companyViewNavigationList.map((nav) => <button type="button" key={nav.link} className={classNames("cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max flex items-center justify-center gap-2", "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none", activeSection === nav.link ? "bg-indigo-50 dark:bg-indigo-700/60 text-indigo-600 dark:text-indigo-200 font-semibold" : "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200")} onClick={() => onNavigate(nav.link)} title={nav.label}>{nav.icon}<span className="font-medium text-xs sm:text-sm truncate">{nav.label}</span></button>)}</div>;
const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) => <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-600 last:mb-0 last:pb-0 last:border-b-0"><div className="flex items-center gap-2 mb-4">{React.cloneElement(icon as React.ReactElement, { size: 22 })}<h5 className="mb-0">{title}</h5></div><div>{children}</div></div>;
const InfoPair = ({ label, value }: { label: string; value?: React.ReactNode; }) => <div className="grid grid-cols-2 py-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span><span className="break-words">{value || <span className="text-gray-400">N/A</span>}</span></div>;
const NoDataMessage = ({ message }: { message: string }) => <div className="text-center py-8 text-gray-500">{message}</div>;
const InfoCard = ({ title, data, action }: { title: string, data: { label: string, value?: React.ReactNode }[], action?: React.ReactNode }) => (
    <Card>
        <div className="flex justify-between items-start">
            <h6 className="font-semibold mb-2">{title}</h6>
            {action}
        </div>
        <div className="text-sm space-y-1.5">
            {data.map(item => (<div key={item.label} className="flex justify-between"><span className="text-gray-500">{item.label}:</span><span className="font-semibold text-right break-all">{item.value || 'N/A'}</span></div>))}
        </div>
    </Card>
);

// --- TAB VIEW COMPONENTS ---
const DetailsTabView = ({ company }: { company: ApiSingleCompanyItem }) => <div><DetailSection title="Basic Information" icon={<TbBuilding />}><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8"><InfoPair label="Ownership Type" value={company.ownership_type} /><InfoPair label="No. of Employees" value={company.no_of_employees} /><InfoPair label="Primary Business" value={company.primary_business_type} /><InfoPair label="Establishment Year" value={company.establishment_year} /></div></DetailSection><DetailSection title="Contact Information" icon={<TbPhone />}><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8"><InfoPair label="Alternate Email" value={company.alternate_email_id} /><InfoPair label="Alternate Contact" value={company.alternate_contact_number ? `${company.alternate_contact_number_code || ''} ${company.alternate_contact_number}` : 'N/A'} /><InfoPair label="Landline" value={company.general_contact_number ? `${company.general_contact_number_code || ''} ${company.general_contact_number}` : 'N/A'} /><InfoPair label="Website" value={company.company_website ? <a href={company.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{company.company_website}</a> : 'N/A'} /></div></DetailSection><DetailSection title="Address" icon={<TbWorld />}><div className="grid grid-cols-1 md:grid-cols-2 gap-x-8"><InfoPair label="Full Address" value={company.company_address} /><InfoPair label="City" value={company.city} /><InfoPair label="State" value={company.state} /><InfoPair label="Zip Code" value={company.zip_code} /><InfoPair label="Country" value={company.country?.name} /><InfoPair label="Continent" value={company.continent?.name} /></div></DetailSection></div>;

const BankTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
    const [viewerState, setViewerState] = useState({ isOpen: false, index: 0 });

    const getFileType = (url: string | null): 'image' | 'pdf' | 'other' => {
        if (!url) return 'other';
        const extension = url.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
        if (extension === 'pdf') return 'pdf';
        return 'other';
    };

    const allBanks = [
        { id: -1, type: 'Primary', bank_account_number: company.primary_account_number, bank_name: company.primary_bank_name, ifsc_code: company.primary_ifsc_code, swift_code: company.primary_swift_code, verification_photo: company.primary_bank_verification_photo },
        { id: -2, type: 'Secondary', bank_account_number: company.secondary_account_number, bank_name: company.secondary_bank_name, ifsc_code: company.secondary_ifsc_code, swift_code: company.secondary_swift_code, verification_photo: company.secondary_bank_verification_photo },
        ...(company.company_bank_details || []).map(b => ({ ...b, type: b.type || 'Other' }))
    ].filter(b => b && b.bank_account_number);

    const bankDocs: DocumentRecord[] = useMemo(() => {
        return allBanks
            .filter(bank => bank.verification_photo)
            .map(bank => ({
                name: `${bank.type} Bank Verification`,
                url: bank.verification_photo!,
                type: getFileType(bank.verification_photo),
                verified: true
            }));
    }, [allBanks]);

    const handlePreview = (url: string) => {
        const docIndex = bankDocs.findIndex(doc => doc.url === url);
        if (docIndex !== -1) {
            setViewerState({ isOpen: true, index: docIndex });
        }
    };

    const handleCloseViewer = () => setViewerState({ isOpen: false, index: 0 });
    const handleNext = () => setViewerState(prev => ({ ...prev, index: Math.min(prev.index + 1, bankDocs.length - 1) }));
    const handlePrev = () => setViewerState(prev => ({ ...prev, index: Math.max(prev.index - 1, 0) }));

    return (
        <div>
            <DetailSection title="Bank Details" icon={<TbBuildingBank />}>
                {allBanks.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allBanks.map(bank => (
                                <InfoCard 
                                    key={bank.id} 
                                    title={`${bank.type} Bank`} 
                                    data={[
                                        { label: "Account No.", value: bank.bank_account_number },
                                        { label: "Bank Name", value: bank.bank_name },
                                        { label: "IFSC Code", value: bank.ifsc_code },
                                        { label: "Swift Code", value: bank.swift_code }
                                    ]}
                                    action={bank.verification_photo ? (
                                        <Button size="xs" variant="twoTone" icon={<TbEye />} onClick={() => handlePreview(bank.verification_photo!)}>
                                            View Verification
                                        </Button>
                                    ) : undefined}
                                />
                            ))}
                        </div>
                        <DocumentViewer
                            isOpen={viewerState.isOpen}
                            onClose={handleCloseViewer}
                            documents={bankDocs}
                            currentIndex={viewerState.index}
                            onNext={handleNext}
                            onPrev={handlePrev}
                        />
                    </>
                ) : (
                    <NoDataMessage message="No bank details found." />
                )}
            </DetailSection>
        </div>
    );
};

const AccessibilityTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
    const [viewerState, setViewerState] = useState({ isOpen: false, index: 0 });

    const getFileType = (url: string | null): 'image' | 'pdf' | 'other' => {
        if (!url) return 'other';
        const extension = url.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
        if (extension === 'pdf') return 'pdf';
        return 'other';
    };

    const billingDocs = useMemo((): DocumentRecord[] => {
        return (company.enable_billing_documents || []).map((doc, index) => ({
            name: `Billing Document ${doc.document_name || index + 1}`,
            url: doc.document,
            type: getFileType(doc.document),
            verified: true, // Assuming these are verified
        }));
    }, [company]);

    const handlePreview = (index: number) => setViewerState({ isOpen: true, index });
    const handleCloseViewer = () => setViewerState({ isOpen: false, index: 0 });
    const handleNext = () => setViewerState(prev => ({ ...prev, index: Math.min(prev.index + 1, billingDocs.length - 1) }));
    const handlePrev = () => setViewerState(prev => ({ ...prev, index: Math.max(prev.index - 1, 0) }));
    
    const formatDueDateInDays = (dueDateString?: string | null) => {
        if (!dueDateString) return "N/A";
        const dueDate = dayjs(dueDateString);
        const today = dayjs().startOf('day');
        const diffDays = dueDate.startOf('day').diff(today, 'day');

        if (diffDays > 1) return `in ${diffDays} days`;
        if (diffDays === 1) return `Tomorrow`;
        if (diffDays === 0) return `Today`;
        if (diffDays === -1) return `Yesterday (${Math.abs(diffDays)} day overdue)`;
        if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
        return dayjs(dueDateString).format("D MMM, YYYY");
    };

    return (
        <div className="space-y-6">
            <DetailSection title="Billing & KYC Status" icon={<TbReportMoney />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
                    <InfoPair label="KYC Verified" value={company.kyc_verified ? <Tag className="bg-emerald-100 text-emerald-700">Yes</Tag> : <Tag className="bg-red-100 text-red-700">No</Tag>} />
                    <InfoPair label="Enabled Billing" value={company.enable_billing ? <Tag className="bg-emerald-100 text-emerald-700">Yes</Tag> : <Tag className="bg-red-100 text-red-700">No</Tag>} />
                    <InfoPair label="Billing Due Date" value={formatDueDateInDays(company.billing_due)} />
                </div>
            </DetailSection>

            <DetailSection title="Enable Billing Documents" icon={<TbFileDescription />}>
                {billingDocs.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {billingDocs.map((doc, index) => (
                                <DocumentCard key={index} document={doc} onPreview={() => handlePreview(index)} />
                            ))}
                        </div>
                        <DocumentViewer
                            isOpen={viewerState.isOpen}
                            onClose={handleCloseViewer}
                            documents={billingDocs}
                            currentIndex={viewerState.index}
                            onNext={handleNext}
                            onPrev={handlePrev}
                        />
                    </>
                ) : (
                    <NoDataMessage message="No billing documents are available." />
                )}
            </DetailSection>
        </div>
    );
};

const ReferencesTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
    const references = company.company_references || [];
    if (references.length === 0) {
        return <NoDataMessage message="No references found for this company." />;
    }
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {references.map(ref => (
                <InfoCard
                    key={ref.id}
                    title={ref.person_name || 'Reference'}
                    data={[
                        { label: 'Company ID', value: ref.company_id },
                        { label: 'Contact', value: ref.number },
                        { label: 'Remark', value: ref.remark },
                    ]}
                />
            ))}
        </div>
    );
};

const MembersTabView = ({ company }: { company: ApiSingleCompanyItem }) => { const members = company.company_member_management || []; if (members.length === 0) return <NoDataMessage message="No members are assigned." />; return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{members.map(m => (<InfoCard key={m.id} title={m.person_name} data={[{ label: 'Designation', value: m.designation },{ label: 'Member ID', value: m.member_id },{ label: 'Contact', value: m.number }]} />))}</div> };
const TeamsTabView = ({ company }: { company: ApiSingleCompanyItem }) => { const teams = company.company_team_members || []; if (teams.length === 0) return <NoDataMessage message="No team members found." />; return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{teams.map(t => (<InfoCard key={t.id} title={t.person_name} data={[{ label: 'Team', value: t.team_name },{ label: 'Designation', value: t.designation },{ label: 'Contact', value: t.number }]} />))}</div> };
const OfficesTabView = ({ company }: { company: ApiSingleCompanyItem }) => { const offices = company.office_info || []; if (offices.length === 0) return <NoDataMessage message="No office locations found." />; return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{offices.map(o => (<InfoCard key={o.id} title={o.office_name} data={[{ label: 'Type', value: o.office_type },{ label: 'Address', value: o.address },{ label: 'Location', value: `${o.city}, ${o.state}` },{ label: 'Contact Person', value: o.contact_person }]} />))}</div> };
const VerificationTabView = ({ company }: { company: ApiSingleCompanyItem }) => { const verifications = company.company_spot_verification || []; if (verifications.length === 0) return <NoDataMessage message="No spot verifications found." />; return <div className="space-y-4">{verifications.map(v => <Card key={v.id} bodyClass='p-4'><div className="flex justify-between items-center"><h6 className="font-semibold">Verified by {v.verified_by_name || 'Unknown'}</h6>{v.verified ? <Tag className='bg-emerald-100 text-emerald-700'>Verified</Tag> : <Tag className='bg-red-100 text-red-700'>Not Verified</Tag>}</div>{v.remark && <p className="text-sm mt-2 text-gray-600"><TbMessage2 className='inline-block mr-2' />{v.remark}</p>}{v.photo_upload && <Button size='sm' className='mt-2' onClick={() => window.open(v.photo_upload || '', '_blank')}>View Photo</Button>}</Card>)}</div> };
const TransactionsTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
    const allTransactions = useMemo(() => company.transaction_docs || [], [company]);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

    const [viewerState, setViewerState] = useState<{
        isOpen: boolean;
        docs: DocumentRecord[];
        index: number;
    }>({ isOpen: false, docs: [], index: 0 });

    const filteredTransactions = useMemo(() => {
        const [startDate, endDate] = dateRange;
        if (!startDate || !endDate) return allTransactions;
        return allTransactions.filter(transaction => {
            const transactionDate = dayjs(transaction.created_at);
            return transactionDate.isAfter(dayjs(startDate).startOf('day')) && transactionDate.isBefore(dayjs(endDate).endOf('day'));
        });
    }, [allTransactions, dateRange]);

    const handleResetFilter = () => setDateRange([null, null]);

    const getFileType = (url: string | null): 'image' | 'pdf' | 'other' => {
        if (!url) return 'other';
        const extension = url.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
        if (extension === 'pdf') return 'pdf';
        return 'other';
    };

    const formatDocTitle = (key: string) => {
        const customTitles: Record<string, string> = { pi_upload: "PO", imei_excel_sheet_miracle: "IMEI Sheet", invoice_upload: "Purchase Invoice", e_way_bill: "E-Way Bill" };
        return customTitles[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatTransactionId = (id: number | undefined | null): string => {
        if (id === null || id === undefined) return 'N/A';
        return String(id).padStart(5, '0');
    };

    const handlePreview = (docs: DocumentRecord[], index: number) => {
        setViewerState({ isOpen: true, docs, index });
    };
    const handleCloseViewer = () => setViewerState({ isOpen: false, docs: [], index: 0 });
    const handleNext = () => setViewerState(prev => ({ ...prev, index: Math.min(prev.index + 1, prev.docs.length - 1) }));
    const handlePrev = () => setViewerState(prev => ({ ...prev, index: Math.max(prev.index - 1, 0) }));

    if (allTransactions.length === 0) {
        return <NoDataMessage message="No transaction documents found." />;
    }

    return (
        <div className='space-y-6'>
            <Card>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className='flex items-center gap-2'><label className='font-semibold'>Date:</label><DatePicker.DatePickerRange value={dateRange} onChange={setDateRange} placeholder="Pick date range" /></div>
                    <div className="flex gap-2"><Button onClick={handleResetFilter}>Reset</Button></div>
                </div>
            </Card>

            {filteredTransactions.length > 0 ? filteredTransactions.map(transaction => {
                const uploadedDocs = transaction.filled_form?.form_data?.uploads_doc_s;
                if (!transaction.filled_form || !uploadedDocs) return null;

                const transactionDocs: DocumentRecord[] = Object.entries(uploadedDocs)
                    .filter(([_, url]) => !!url)
                    .map(([docKey, docUrl]) => ({
                        name: formatDocTitle(docKey),
                        url: docUrl as string,
                        type: getFileType(docUrl),
                        verified: true, // Assuming transaction docs are verified
                    }));

                if (transactionDocs.length === 0) return null;

                return (
                    <Card key={transaction.id} bodyClass="p-0">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/60 p-3 rounded-t-lg">
                            <h5 className="font-semibold">Form ID: #{formatTransactionId(transaction.filled_form?.accountdoc_id)}</h5>
                            <span className="text-sm text-gray-500">{dayjs(transaction.filled_form.created_at).format('DD MMM YYYY, hh:mm A')}</span>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {transactionDocs.map((doc, index) => (
                                    <DocumentCard
                                        key={doc.url}
                                        document={doc}
                                        onPreview={() => handlePreview(transactionDocs, index)}
                                    />
                                ))}
                            </div>
                        </div>
                    </Card>
                )
            }) : <NoDataMessage message="No transactions found for the selected date range." />}
            
            <DocumentViewer
                isOpen={viewerState.isOpen}
                onClose={handleCloseViewer}
                documents={viewerState.docs}
                currentIndex={viewerState.index}
                onNext={handleNext}
                onPrev={handlePrev}
            />
        </div>
    );
};

const DocumentsTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
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

        const addDoc = (name: string, url: string | null | undefined, verified?: boolean) => {
            if (url) {
                docs.push({ name, url, type: getFileType(url), verified });
            }
        };

        addDoc("Aadhar Card", company.aadhar_card_file, company.aadhar_card_verified);
        addDoc("PAN Card", company.pan_card_file, company.pan_card_verified);
        addDoc("GST Certificate", company.gst_certificate_file, company.gst_certificate_verified);
        addDoc("Office Photo", company.office_photo_file, company.office_photo_verified);
        addDoc("Cancel Cheque", company.cancel_cheque_file, company.cancel_cheque_verified);
        addDoc("Visiting Card", company.visiting_card_file, company.visiting_card_verified);
        addDoc("Authority Letter", company.authority_letter_file, company.authority_letter_verified);
        addDoc("194Q Declaration", company.ABCQ_file, company.ABCQ_verified);
        addDoc("Other Document", company.other_document_file, company.other_document_verified);
        
        (company.company_certificate || []).forEach(cert => {
            addDoc(cert.certificate_name, cert.upload_certificate_path, true);
        });

        return docs;
    }, [company]);

    if (documentList.length === 0) {
        return <NoDataMessage message="No KYC or company certificates are available." />;
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

// --- MAIN COMPANY VIEW PAGE ---
const CompanyView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [company, setCompany] = useState<ApiSingleCompanyItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<string>(companyViewNavigationList[0].link);

    useEffect(() => {
        if (!id) {
            toast.push(<Notification type="danger" title="Error">No Company ID provided.</Notification>);
            navigate('/business-entities/company');
            return;
        }
        const fetchCompany = async () => {
            setLoading(true);
            try {
                const response = await dispatch(getCompanyByIdAction(id)).unwrap();
                setCompany(response);
            } catch (error: any) {
                toast.push(<Notification type="danger" title="Fetch Error">{error?.message || 'Failed to load company data.'}</Notification>);
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, [id, dispatch, navigate]);

    const renderActiveSection = () => {
        if (!company) return <NoDataMessage message="Company data is not available." />;

        switch (activeSection) {
            case "details": return <DetailsTabView company={company} />;
            case "documents": return <DocumentsTabView company={company} />;
            case "bank": return <BankTabView company={company} />;
            case "accessibility": return <AccessibilityTabView company={company} />;
            case "references": return <ReferencesTabView company={company} />;
            case "members": return <MembersTabView company={company} />;
            case "teams": return <TeamsTabView company={company} />;
            case "offices": return <OfficesTabView company={company} />;
            case "verification": return <VerificationTabView company={company} />;
            case "transactions": return <TransactionsTabView company={company} />;
            default: return <DetailsTabView company={company} />;
        }
    };

    if (loading) {
        return <Container className="h-full flex justify-center items-center"><Spinner size={40} /></Container>;
    }

    if (!company) {
        return <Container><Card className="text-center p-8"><h4 className="mb-4">Company Not Found</h4><p>The company you are looking for does not exist or could not be loaded.</p><Button className="mt-4" onClick={() => navigate('/business-entities/company')}>Back to List</Button></Card></Container>;
    }

    return (
        <Container className="h-full">
            <div className="flex gap-1 items-end mb-4">
                <NavLink to="/business-entities/company"><h6 className="font-semibold hover:text-primary-600">Companies</h6></NavLink>
                <BiChevronRight size={18} />
                <h6 className="font-semibold text-primary-600">{company.company_name}</h6>
            </div>
            <Card bodyClass="p-0">
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700"><CompanyProfileHeader company={company} /></div>
                <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700"><CompanyViewNavigator activeSection={activeSection} onNavigate={setActiveSection} /></div>
                <div className="p-4 sm:p-6">{renderActiveSection()}</div>
            </Card>
        </Container>
    );
};

export default CompanyView;