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
  TbWorld, TbCheck, TbX, TbFileDescription, TbUserSearch, TbMessage2,
  TbCoinRupee, TbFileInvoice
} from 'react-icons/tb';

// Types, Redux and Helpers
import { getCompanyByIdAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';

// --- Corrected Type Definitions (Matching the provided JSON) ---
interface OfficeInfo {
    id: number;
    office_type: string;
    office_name: string;
    state: string;
    city: string;
    zip_code: string;
    gst_number: string;
    address: string;
    office_email: string;
    contact_person: string | null;
    office_phone: string | null;
}

interface FilledForm {
    id: number;
    accountdoc_id: number;
    created_at: string;
    form_data?: {
      uploads_doc_s?: {
        [key: string]: string | undefined;
      }
    }
}

interface TransactionDoc {
  id: number;
  company_document: string;
  invoice_number: string;
  status: string;
  created_at: string;
  filled_form?: FilledForm;
}

interface ApiSingleCompanyItem {
  id: number;
  company_code: string;
  company_name: string;
  status: string;
  primary_email_id: string;
  primary_contact_number: string;
  primary_contact_number_code: string;
  alternate_contact_number?: string | null;
  alternate_contact_number_code?: string | null;
  alternate_email_id?: string | null;
  general_contact_number?: string | null;
  general_contact_number_code?: string | null;
  ownership_type: string;
  owner_name: string;
  company_address?: string | null;
  country_id: number;
  state?: string | null;
  city?: string | null;
  zip_code?: string | null;
  gst_number: string;
  pan_number: string;
  trn_number?: string | null;
  tan_number?: string | null;
  establishment_year?: string | null;
  no_of_employees?: number | null;
  company_website?: string | null;
  primary_business_type?: string | null;
  kyc_verified: boolean;
  enable_billing: boolean;
  billing_due?: string;
  company_logo?: string | null;
  primary_account_number?: string | null;
  primary_bank_name?: string | null;
  primary_ifsc_code?: string | null;
  primary_swift_code?: string | null;
  secondary_account_number?: string | null;
  secondary_bank_name?: string | null;
  secondary_ifsc_code?: string | null;
  secondary_swift_code?: string | null;
  aadhar_card_file?: string | null;
  aadhar_card_verified?: boolean;
  pan_card_file?: string | null;
  pan_card_verified?: boolean;
  gst_certificate_file?: string | null;
  gst_certificate_verified?: boolean;
  office_photo_file?: string | null;
  office_photo_verified?: boolean;
  cancel_cheque_file?: string | null;
  cancel_cheque_verified?: boolean;
  visiting_card_file?: string | null;
  visiting_card_verified?: boolean;
  authority_letter_file?: string | null;
  authority_letter_verified?: boolean;
  ABCQ_file?: string | null;
  ABCQ_verified?: boolean;
  other_document_file?: string | null;
  other_document_verified?: boolean;
  created_at: string;
  country?: { name: string };
  continent?: { name: string };
  company_certificate?: Array<{ id: number; certificate_name: string; upload_certificate_path: string | null }>;
  company_bank_details?: Array<{ id: number; type: string; bank_account_number: string; bank_name: string; ifsc_code: string; swift_code?: string }>;
  company_member_management?: Array<{ id: number; person_name: string; member_id: string; designation: string; number: string; }>;
  company_team_members?: Array<{ id: number; person_name: string; team_name: string; designation: string; number: string; }>;
  office_info?: OfficeInfo[];
  company_spot_verification?: Array<{ id: number; verified_by_name?: string; verified: boolean; remark: string | null; photo_upload: string | null; }>;
  transaction_docs?: TransactionDoc[];
}

// --- Reusable Helper Components ---

const getCompanyStatusClass = (status?: string) => {
  const s = status?.toLowerCase() || '';
  switch (s) {
    case 'active':
    case 'approved':
    case 'verified':
      return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100';
    case 'inactive':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100';
    case 'blocked':
    case 'non verified':
      return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100';
    case 'pending':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

const CompanyProfileHeader = ({ company }: { company: ApiSingleCompanyItem }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div>
          <h4 className="font-bold">({company.company_code}) - {company.company_name}</h4>
          <div className="flex items-center gap-2 mb-1 text-sm"><TbMail className="text-gray-400" /> <p>{company.primary_email_id}</p></div>
          {company.primary_contact_number && (<div className="flex items-center gap-2 text-sm"><TbPhone className="text-gray-400" /> <p>{company.primary_contact_number_code} {company.primary_contact_number}</p></div>)}
          <div className="mt-2"><Tag className={`${getCompanyStatusClass(company.status)} capitalize`}>{company.status || 'N/A'}</Tag></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm">
        <div className="flex items-center gap-2"><TbUserCircle className="text-gray-400" /><span className="font-semibold">Owner:</span><span>{company.owner_name}</span></div>
        <div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">GST:</span><span>{company.gst_number || 'N/A'}</span></div>
        <div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">PAN NO:</span><span>{company.pan_number || 'N/A'}</span></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4 text-sm">
        <div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">TAN No:</span><span>{company.tan_number || 'N/A'}</span></div>
        <div className="flex items-center gap-2"><TbLicense className='text-gray-400' /><span className="font-semibold">TRN NO:</span><span>{company.trn_number || 'N/A'}</span></div>
      </div>
      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
        <Button variant="solid" icon={<TbPencil />} onClick={() => navigate(`/business-entities/company-edit/${company.id}`)}>Edit Company</Button>
        <Button icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/company')}>Back to List</Button>
      </div>
    </div>
  );
};

const companyViewNavigationList = [
  { label: "Details", link: "details", icon: <TbUser /> },
  { label: "Kyc Documents", link: "documents", icon: <TbFileText /> },
  { label: "Bank & Billing", link: "bank", icon: <TbBuildingBank /> },
  { label: "Members", link: "members", icon: <TbUsersGroup /> },
  { label: "Teams", link: "teams", icon: <TbUsersGroup /> },
  { label: "Offices", link: "offices", icon: <TbBuilding /> },
  { label: "Verification", link: "verification", icon: <TbLicense /> },
  { label: "Transactions", link: "transactions", icon: <TbCoinRupee /> },
];

const CompanyViewNavigator = ({ activeSection, onNavigate }: { activeSection: string; onNavigate: (s: string) => void; }) => (
  <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
    {companyViewNavigationList.map((nav) => (
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
    <div className='flex items-center gap-3'><TbFileDescription size={24} className='text-gray-400' /><p className="font-semibold">{name}</p></div>
    <div className='flex items-center gap-3'>
      {verified ? <Tag className="bg-emerald-100 text-emerald-700"><TbCheck className='mr-1' />Verified</Tag> : <Tag className="bg-red-100 text-red-700"><TbX className='mr-1' />Not Verified</Tag>}
      <Button size="sm" shape="circle" icon={<TbDownload />} disabled={!url} onClick={() => window.open(url || '', '_blank')} />
    </div>
  </Card>
);

// --- TAB VIEW COMPONENTS ---

const DetailsTabView = ({ company }: { company: ApiSingleCompanyItem }) => (
  <div>
    <DetailSection title="Basic Information" icon={<TbBuilding />}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
        <InfoPair label="Ownership Type" value={company.ownership_type} />
        <InfoPair label="No. of Employees" value={company.no_of_employees} />
        <InfoPair label="Primary Business" value={company.primary_business_type} />
        <InfoPair label="Establishment Year" value={company.establishment_year} />
      </div>
    </DetailSection>
    <DetailSection title="Contact Information" icon={<TbPhone />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <InfoPair label="Alternate Email" value={company.alternate_email_id} />
        <InfoPair label="Alternate Contact" value={company.alternate_contact_number ? `${company.alternate_contact_number_code} ${company.alternate_contact_number}` : 'N/A'} />
        <InfoPair label="Landline" value={company.general_contact_number ? `${company.general_contact_number_code} ${company.general_contact_number}` : 'N/A'} />
        <InfoPair label="Website" value={company.company_website ? <a href={company.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{company.company_website}</a> : 'N/A'} />
      </div>
    </DetailSection>
    <DetailSection title="Address" icon={<TbWorld />}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <InfoPair label="Full Address" value={company.company_address} />
        <InfoPair label="City" value={company.city} />
        <InfoPair label="State" value={company.state} />
        <InfoPair label="Zip Code" value={company.zip_code} />
        <InfoPair label="Country" value={company.country?.name} />
        <InfoPair label="Continent" value={company.continent?.name} />
      </div>
    </DetailSection>
  </div>
);

const DocumentsTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const kycDocsList = useMemo(() => [
        { name: "Aadhar Card", fileKey: "aadhar_card_file", verifiedKey: "aadhar_card_verified" },
        { name: "PAN Card", fileKey: "pan_card_file", verifiedKey: "pan_card_verified" },
        { name: "GST Certificate", fileKey: "gst_certificate_file", verifiedKey: "gst_certificate_verified" },
        { name: "Office Photo", fileKey: "office_photo_file", verifiedKey: "office_photo_verified" },
        { name: "Cancel Cheque", fileKey: "cancel_cheque_file", verifiedKey: "cancel_cheque_verified" },
        { name: "Visiting Card", fileKey: "visiting_card_file", verifiedKey: "visiting_card_verified" },
        { name: "Authority Letter", fileKey: "authority_letter_file", verifiedKey: "authority_letter_verified" },
        { name: "194Q Declaration", fileKey: "ABCQ_file", verifiedKey: "ABCQ_verified" },
        { name: "Other Document", fileKey: "other_document_file", verifiedKey: "other_document_verified" },
    ], []);

    const allDocumentUrls = useMemo(() => {
        const urls: { url: string; name: string }[] = [];
        
        kycDocsList.forEach(doc => {
            const url = company[doc.fileKey as keyof ApiSingleCompanyItem] as string | null;
            if (url) {
                urls.push({ url, name: doc.name });
            }
        });

        (company.company_certificate || []).forEach(cert => {
            if (cert.upload_certificate_path) {
                urls.push({ url: cert.upload_certificate_path, name: cert.certificate_name });
            }
        });

        return urls;
    }, [company, kycDocsList]);
    
    const handleDownloadAll = async () => {
        if (allDocumentUrls.length === 0) {
            toast.push(<Notification type="info" title="No Documents">There are no documents to download.</Notification>);
            return;
        }

        setIsDownloading(true);
        toast.push(<Notification type="success" title="Download Started" duration={3000}>Your documents will be downloaded shortly.</Notification>);
        
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        for (const doc of allDocumentUrls) {
            try {
                const link = document.createElement('a');
                link.href = doc.url;
                const fileName = doc.url.substring(doc.url.lastIndexOf('/') + 1) || `${doc.name.replace(/\s+/g, '_')}.file`;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                await delay(300);
            } catch (error) {
                console.error(`Failed to download ${doc.name}:`, error);
                toast.push(<Notification type="danger" title="Download Error">{`Could not download ${doc.name}`}</Notification>);
            }
        }
        setIsDownloading(false);
    };

    const visibleKycDocs = kycDocsList.filter(doc => company[doc.fileKey as keyof ApiSingleCompanyItem]);
    const companyCertificates = company.company_certificate || [];

    return (
        <div className='space-y-4'>
           {(visibleKycDocs.length === 0 && companyCertificates.length === 0) ? (
                <NoDataMessage message="No KYC or company certificates are available." />
            ) : (
                <>
                    {visibleKycDocs.map(doc => (
                        <DocumentCard
                            key={doc.fileKey}
                            name={doc.name}
                            url={company[doc.fileKey as keyof ApiSingleCompanyItem] as string | null}
                            verified={company[doc.verifiedKey as keyof ApiSingleCompanyItem]}
                        />
                    ))}
                    {companyCertificates.map(cert => (
                        <DocumentCard
                            key={cert.id}
                            name={cert.certificate_name}
                            url={cert.upload_certificate_path}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

const BankAndBillingTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
  const allBanks = [
    { id: -1, type: 'Primary', bank_account_number: company.primary_account_number, bank_name: company.primary_bank_name, ifsc_code: company.primary_ifsc_code, swift_code: company.primary_swift_code },
    { id: -2, type: 'Secondary', bank_account_number: company.secondary_account_number, bank_name: company.secondary_bank_name, ifsc_code: company.secondary_ifsc_code, swift_code: company.secondary_swift_code },
    ...(company.company_bank_details || []).map(b => ({ ...b, type: b.type || 'Other' })),
  ].filter(b => b && b.bank_account_number);

  return (
    <div>
      <DetailSection title="Billing Status" icon={<TbReportMoney />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
          <InfoPair label="KYC Verified" value={company.kyc_verified ? <Tag className="bg-emerald-500 text-white">Yes</Tag> : <Tag className="bg-red-500 text-white">No</Tag>} />
          <InfoPair label="Enabled Billing" value={company.enable_billing ? <Tag className="bg-emerald-500 text-white">Yes</Tag> : <Tag className="bg-red-500 text-white">No</Tag>} />
          <InfoPair label="Enabled Billing Due Date" value={company.billing_due ? dayjs(company.billing_due).format('D MMM YYYY, h:mm A') : 'N/A'} />
        </div>
      </DetailSection>
      <DetailSection title="Bank Details" icon={<TbBuildingBank />}>
        {allBanks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allBanks.map(bank => (<InfoCard key={bank.id} title={`${bank.type} Bank`} data={[{ label: "Account No.", value: bank.bank_account_number }, { label: "Bank Name", value: bank.bank_name }, { label: "IFSC Code", value: bank.ifsc_code }, { label: "Swift Code", value: bank.swift_code }]} />))}
          </div>
        ) : <NoDataMessage message="No bank details found." />}
      </DetailSection>
    </div>
  );
};

const MembersTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
  const members = company.company_member_management || [];
  if (members.length === 0) return <NoDataMessage message="No members are assigned." />;
  return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{members.map(m => (<InfoCard key={m.id} title={m.person_name} data={[{ label: 'Designation', value: m.designation }, { label: 'Member ID', value: m.member_id }, { label: 'Contact', value: m.number }]} />))}</div>);
};

const TeamsTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
  const teams = company.company_team_members || [];
  if (teams.length === 0) return <NoDataMessage message="No team members found." />;
  return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{teams.map(t => (<InfoCard key={t.id} title={t.person_name} data={[{ label: 'Team', value: t.team_name }, { label: 'Designation', value: t.designation }, { label: 'Contact', value: t.number }]} />))}</div>);
};

const OfficesTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
  const offices = company.office_info || [];
  if (offices.length === 0) return <NoDataMessage message="No office locations found." />;
  return (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{offices.map(o => (<InfoCard key={o.id} title={o.office_name} data={[{ label: 'Type', value: o.office_type }, { label: 'Address', value: o.address }, { label: 'Location', value: `${o.city}, ${o.state}` }, { label: 'Contact Person', value: o.contact_person }]} />))}</div>);
};

const VerificationTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
  const verifications = company.company_spot_verification || [];
  if (verifications.length === 0) return <NoDataMessage message="No spot verifications found." />;
  return (
    <div className="space-y-4">
      {verifications.map(v => (
        <Card key={v.id} bodyClass='p-4'>
          <div className="flex justify-between items-center"><h6 className="font-semibold">Verified by {v.verified_by_name || 'Unknown'}</h6>{v.verified ? <Tag className='bg-emerald-100 text-emerald-700'>Verified</Tag> : <Tag className='bg-red-100 text-red-700'>Not Verified</Tag>}</div>
          {v.remark && <p className="text-sm mt-2 text-gray-600"><TbMessage2 className='inline-block mr-2' />{v.remark}</p>}
          {v.photo_upload && <Button size='sm' className='mt-2' onClick={() => window.open(v.photo_upload || '', '_blank')}>View Photo</Button>}
        </Card>
      ))}
    </div>
  );
};

const TransactionsTabView = ({ company }: { company: ApiSingleCompanyItem }) => {
    const allTransactions = useMemo(() => company.transaction_docs || [], [company]);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

    const filteredTransactions = useMemo(() => {
        const [startDate, endDate] = dateRange;
        if (!startDate || !endDate) {
            return allTransactions;
        }
        return allTransactions.filter(transaction => {
            const transactionDate = dayjs(transaction.created_at);
            return transactionDate.isAfter(dayjs(startDate).startOf('day')) && transactionDate.isBefore(dayjs(endDate).endOf('day'));
        });
    }, [allTransactions, dateRange]);

    const handleResetFilter = () => {
        setDateRange([null, null]);
    };

    const formatDocTitle = (key: string) => {
        const customTitles: Record<string, string> = {
            pi_upload: "PO",
            imei_excel_sheet_miracle: "IMEI Sheet",
            invoice_upload: "Purchase Invoice",
            e_way_bill: "E-Way Bill"
        };
        return customTitles[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };
    
    const formatTransactionId = (id: number | undefined | null): string => {
        if (id === null || id === undefined) {
            return 'N/A';
        }
        return String(id).padStart(5, '0');
    };

    const documentOrder: string[] = ['pi_upload', 'imei_excel_sheet_miracle', 'invoice_upload', 'e_way_bill'];

    if (allTransactions.length === 0) {
        return <NoDataMessage message="No transaction documents found." />;
    }

    return (
        <div className='space-y-6'>
            <Card>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className='flex items-center gap-2'>
                        <label className='font-semibold'>Date:</label>
                        <DatePicker.DatePickerRange
                            value={dateRange}
                            onChange={setDateRange}
                            placeholder="Pick date range"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleResetFilter}>Reset</Button>
                    </div>
                </div>
            </Card>

            {filteredTransactions.length > 0 ? filteredTransactions.map(transaction => {
                const uploadedDocs = transaction.filled_form?.form_data?.uploads_doc_s;
                
                if (!transaction.filled_form || !uploadedDocs) return null;

                const sortedDocs = Object.entries(uploadedDocs)
                    .filter(([_, url]) => !!url)
                    .sort(([keyA], [keyB]) => {
                        const indexA = documentOrder.indexOf(keyA);
                        const indexB = documentOrder.indexOf(keyB);
                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;
                        return keyA.localeCompare(keyB);
                    });

                return (
                    <Card key={transaction.id} bodyClass="p-0">
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/60 p-3 rounded-t-lg">
                            <h5 className="font-semibold">
                                Form ID: #{formatTransactionId(transaction.filled_form?.accountdoc_id)}
                            </h5>
                            <span className="text-sm text-gray-500">
                                {dayjs(transaction.filled_form.created_at).format('DD MMM YYYY, hh:mm A')}
                            </span>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {sortedDocs.map(([docKey, docUrl]) => (
                                    <a href={docUrl} target="_blank" rel="noopener noreferrer" key={docKey}>
                                        <Card clickable className="h-full">
                                            <div className="flex flex-col items-center justify-center text-center gap-2 py-4">
                                                <TbFileInvoice size={36} className='text-gray-400' />
                                                <h6 className="font-semibold uppercase">{formatDocTitle(docKey)}</h6>
                                                <p className="text-xs text-gray-500">{dayjs(transaction.created_at).format('DD-MM-YYYY HH:mm:ss')}</p>
                                            </div>
                                        </Card>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </Card>
                )
            }) : <NoDataMessage message="No transactions found for the selected date range." />}
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
      case "bank": return <BankAndBillingTabView company={company} />;
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
    return (
      <Container>
        <Card className="text-center p-8">
          <h4 className="mb-4">Company Not Found</h4>
          <p>The company you are looking for does not exist or could not be loaded.</p>
          <Button className="mt-4" onClick={() => navigate('/business-entities/company')}>Back to List</Button>
        </Card>
      </Container>
    );
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