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
  TbKey,
  TbDownload,
  TbUser,
  TbUsers,
  TbTargetArrow,
  TbCertificate,
  TbDeviceLaptop,
  TbLogout,
  TbFileText,
  TbFileInvoice,
  TbLinkOff,
  TbBuildingBank,
  TbUsersGroup,
  TbReportMoney,
  TbLicense,
  TbArrowLeft,
  TbCoinRupee
} from 'react-icons/tb';

// Types and Data
import type { ColumnDef } from '@/components/shared/DataTable';
import { CompanyItem } from '../Company'; // Assuming CompanyItem is exported from your list file
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { getCompanyStatusClass } from '../Company'; // Assuming this is exported
import { getCompanyAction } from '@/reduxtool/master/middleware';
import { useAppDispatch } from '@/reduxtool/store';

// --- Reusable Helper Components ---

interface CompanyProfileHeaderProps {
  company: CompanyItem | null;
}
const CompanyProfileHeader = ({ company }: CompanyProfileHeaderProps) => {
  const navigate = useNavigate();

  console.log(company, 'company');

  if (!company) {
    return <p className="text-center">Company not found.</p>;
  }

  const handleEdit = () => {
    navigate(`/business-entities/company-edit/${company.id}`);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar
          size={110}
          shape="circle"
          src={company.company_logo ? `https://aazovo.codefriend.in/${company.company_logo}` : undefined}
          icon={<TbBuilding />}
        />
        <div className="flex flex-col">
          <h4 className="font-bold">{company.company_name}</h4>
          <div className="flex items-center gap-2 mb-1">
            <TbMail className="text-gray-400" /> <p>{company.primary_email_id}</p>
          </div>
          {company.primary_contact_number && (
            <div className="flex items-center gap-2">
              <TbPhone className="text-gray-400" /> <p>{company.primary_contact_number_code} {company.primary_contact_number}</p>
            </div>
          )}
          <div className="mt-2">
            <Tag className={`${getCompanyStatusClass(company.status)} capitalize`}>
              {company.status}
            </Tag>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4">
        <div className="flex items-center gap-2">
          <TbUserCircle className="text-gray-400" />
          <span className="font-semibold">Owner:</span>
          <span>{company.owner_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <TbBriefcase className="text-gray-400" />
          <span className="font-semibold">Business Type:</span>
          <span>{company.primary_business_type || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <TbCalendar className="text-gray-400" />
          <span className="font-semibold">Established:</span>
          <span>{company.establishment_year || 'N/A'}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
        <Button variant="solid" icon={<TbPencil />} onClick={handleEdit}>
          Edit Company
        </Button>
        <Button icon={<TbArrowLeft />} onClick={() => navigate('/business-entities/company')}>Back to List</Button>
      </div>
    </div>
  );
};

const companyViewNavigationList = [
  { label: "Details", link: "details", icon: <TbUser /> },
  { label: "Documents", link: "documents", icon: <TbFileText /> },
  { label: "Members & Teams", link: "members", icon: <TbUsersGroup /> },
  { label: "Bank ", link: "bank", icon: <TbBuildingBank /> },
  { label: "Billing", link: "billing", icon: <TbReportMoney /> },
  { label: "Transactions", link: "transactions", icon: <TbCoinRupee /> },
  { label: "Offices", link: "offices", icon: <TbBuildingBank /> },
];

type NavigatorComponentProps = {
  activeSection: string;
  onNavigate: (sectionKey: string) => void;
};

const CompanyViewNavigator = ({ activeSection, onNavigate }: NavigatorComponentProps) => {
  return (
    <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
      {companyViewNavigationList.map((nav) => (
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

const DetailsTab = ({ company }: { company: CompanyItem }) => {
  return (
    <div>
      <DetailSection title="Basic Information" icon={<TbBuilding size={22} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoPair label="Company Code" value={company.company_code} />
          <InfoPair label="Ownership Type" value={company.ownership_type} />
          <InfoPair label="Owner Name" value={company.owner_name} />
          <InfoPair label="Establishment Year" value={company.establishment_year} />
          <InfoPair label="No. of Employees" value={company.no_of_employees} />
          <InfoPair label="Primary Business" value={company.primary_business_type} />
        </div>
      </DetailSection>
      <DetailSection title="Contact Information" icon={<TbPhone size={22} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoPair label="Primary Email" value={company.primary_email_id} />
          <InfoPair label="Primary Contact" value={`${company.primary_contact_number_code} ${company.primary_contact_number}`} />
          <InfoPair label="Alternate Email" value={company.alternate_email_id} />
          <InfoPair label="Alternate Contact" value={company.alternate_contact_number ? `${company.alternate_contact_number_code} ${company.alternate_contact_number}` : 'N/A'} />
          <InfoPair label="Website" value={company.company_website ? <a href={company.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{company.company_website}</a> : 'N/A'} />
        </div>
      </DetailSection>
      <DetailSection title="Address" icon={<TbBuildingBank size={22} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoPair label="Full Address" value={company.company_address} />
          <InfoPair label="City" value={company.city} />
          <InfoPair label="State" value={company.state} />
          <InfoPair label="Zip Code" value={company.zip_code} />
          <InfoPair label="Country" value={company.country?.name} />
          <InfoPair label="Continent" value={company.continent?.name} />
        </div>
      </DetailSection>
      <DetailSection title="Legal & Financial IDs" icon={<TbLicense size={22} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoPair label="GST Number" value={company.gst_number} />
          <InfoPair label="PAN Number" value={company.pan_number} />
          <InfoPair label="TRN Number" value={company.trn_number} />
          <InfoPair label="TAN Number" value={company.tan_number} />
        </div>
      </DetailSection>
    </div>
  );
};

const DocumentsTab = ({ company }: { company: CompanyItem }) => {
  type DocumentRecord = { id: string; name: string; type: 'Certificate' | 'Billing'; url: string; };

  const combinedDocs: DocumentRecord[] = [
    ...(company.company_certificate || []).map(doc => ({ id: `cert-${doc.id}`, name: doc.certificate_name, type: 'Certificate' as const, url: doc.upload_certificate_path })),
    ...(company.billing_documents || []).map(doc => ({ id: `bill-${doc.id}`, name: doc.document_name, type: 'Billing' as const, url: doc.document || '' })),
  ];

  const columns = useMemo<ColumnDef<DocumentRecord>[]>(() => [
    { header: 'Document Name', accessorKey: 'name', size: 400 },
    { header: 'Type', accessorKey: 'type', cell: props => <Tag>{props.row.original.type}</Tag> },
    {
      header: 'Action', id: 'action', cell: props => (
        <Tooltip title="Download">
          <a href={props.row.original.url} target="_blank" rel="noopener noreferrer">
            <Button shape="circle" size="sm" icon={<TbDownload />} disabled={!props.row.original.url} />
          </a>
        </Tooltip>
      )
    }
  ], []);

  return <DataTable columns={columns} data={combinedDocs} noData={<p className="text-center">No documents found.</p>} />;
};

const MembersTab = ({ company }: { company: CompanyItem }) => {
  type MemberRecord = { id: number; name: string; designation: string; team: string; number: string };
  const data: MemberRecord[] = company.company_team_members?.map(m => ({ id: m.id, name: m.person_name, designation: m.designation, team: m.team_name, number: m.number })) || [];

  const columns = useMemo<ColumnDef<MemberRecord>[]>(() => [
    { header: "Name", accessorKey: "name" },
    { header: "Designation", accessorKey: "designation" },
    { header: "Team", accessorKey: "team" },
    { header: "Contact Number", accessorKey: "number" },
  ], []);

  return <DataTable columns={columns} data={data} noData={<p className="text-center">No team members found.</p>} />;
};

const BillingTab = ({ company }: { company: CompanyItem }) => {
  type BankRecord = { id: number; bankName: string; accountNumber: string; ifsc: string; type: string | null };
  const bankData: BankRecord[] = company.company_bank_details?.map(b => ({ id: b.id, bankName: b.bank_name, accountNumber: b.bank_account_number, ifsc: b.ifsc_code, type: b.type })) || [];

  const bankColumns = useMemo<ColumnDef<BankRecord>[]>(() => [
    { header: "Bank Name", accessorKey: "bankName" },
    { header: "Account Number", accessorKey: "accountNumber" },
    { header: "IFSC Code", accessorKey: "ifsc" },
    { header: "Type", accessorKey: "type", cell: props => <Tag>{props.getValue() as string || 'N/A'}</Tag> },
  ], []);

  return (
    <div>
      <DetailSection title="Billing Status" icon={<TbReportMoney size={22} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <InfoPair label="Billing Enabled" value={company.enable_billing ? <Tag className="bg-emerald-500 text-white">Yes</Tag> : <Tag className="bg-red-500 text-white">No</Tag>} />
          <InfoPair label="KYC Verified" value={company.kyc_verified ? <Tag className="bg-emerald-500 text-white">Yes</Tag> : <Tag className="bg-red-500 text-white">No</Tag>} />
          <InfoPair label="Billing Due Date" value={company.due_after_3_months_date ? dayjs(company.due_after_3_months_date).format('D MMM YYYY') : 'N/A'} />
        </div>
      </DetailSection>
      <DetailSection title="Bank Details" icon={<TbBuildingBank size={22} />}>
        <DataTable columns={bankColumns} data={bankData} noData={<p className="text-center">No bank details found.</p>} />
      </DetailSection>
    </div>
  );
};

const OfficesTab = ({ company }: { company: CompanyItem }) => {
  type OfficeRecord = { id: number; name: string; type: string; address: string; city: string; state: string; };
  const data: OfficeRecord[] = company.office_info?.map(o => ({ id: o.id, name: o.office_name, type: o.office_type, address: o.address, city: o.city, state: o.state })) || [];

  const columns = useMemo<ColumnDef<OfficeRecord>[]>(() => [
    { header: "Office Name", accessorKey: "name" },
    { header: "Type", accessorKey: "type" },
    { header: "Address", accessorKey: "address", size: 300 },
    { header: "Location", cell: props => `${props.row.original.city}, ${props.row.original.state}` },
  ], []);

  return <DataTable columns={columns} data={data} noData={<p className="text-center">No office information found.</p>} />;
};


// --- MAIN COMPANY VIEW PAGE ---
const CompanyView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>(companyViewNavigationList[0].link);

  const { CompanyData } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const company = useMemo(() => {
    if (!id || !CompanyData?.data) return null;
    return CompanyData?.data.find((c: CompanyItem) => c.id === parseInt(id));
  }, [id, CompanyData?.data]);

  useEffect(() => {
    if (CompanyData?.data) { // Data is ready
      setLoading(false);
    }
  }, [CompanyData?.data]);

  useEffect(() => { dispatch(getCompanyAction()); }, [dispatch]);
  const renderActiveSection = () => {
    if (!company) return <p>Company data is not available.</p>;

    switch (activeSection) {
      case "details": return <DetailsTab company={company} />;
      case "documents": return <DocumentsTab company={company} />;
      case "members": return <MembersTab company={company} />;
      case "billing": return <BillingTab company={company} />;
      case "offices": return <OfficesTab company={company} />;
      default: return <DetailsTab company={company} />;
    }
  };

  if (loading) {
    return <Container className="h-full flex justify-center items-center"><p>Loading company details...</p></Container>;
  }

  if (!company) {
    return (
      <Container>
        <Card className="text-center">
          <h4 className="mb-4">Company Not Found</h4>
          <p>The company you are looking for does not exist.</p>
          <Button className="mt-4" onClick={() => navigate('/business-entities/company-list')}>
            Back to List
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-4">
        <NavLink to="/business-entities/company-list">
          <h6 className="font-semibold hover:text-primary-600">Companies</h6>
        </NavLink>
        <BiChevronRight size={18} />
        <h6 className="font-semibold text-primary-600">{company.company_name}</h6>
      </div>

      <Card bodyClass="p-0">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <CompanyProfileHeader company={company} />
        </div>
        <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <CompanyViewNavigator activeSection={activeSection} onNavigate={setActiveSection} />
        </div>
        <div className="p-4 sm:p-6">{renderActiveSection()}</div>
      </Card>
    </Container>
  );
};

export default CompanyView;