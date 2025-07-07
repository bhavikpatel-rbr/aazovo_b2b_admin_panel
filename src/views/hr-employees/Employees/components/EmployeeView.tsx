import React, { useState, useMemo, useEffect, SyntheticEvent } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import classNames from 'classnames'

// UI Components
import Container from '@/components/shared/Container'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import DebouceInput from '@/components/shared/DebouceInput'
import Dropdown from '@/components/ui/Dropdown'

// Icons
import {
    TbUserCircle,
    TbMail,
    TbPhone,
    TbBuildingSkyscraper,
    TbBriefcase,
    TbCalendar,
    TbPencil,
    TbTrash,
    TbKey,
    TbChevronRight,
    TbDownload,
    TbSearch,
    TbX,
    TbFilter,
    TbUser,
    TbUsers,
    TbPhoneCall,
    TbSchool,
    TbHistory,
    TbTargetArrow,
    TbCertificate,
    TbDeviceLaptop,
    TbLogout,
    TbWall,
    TbCheck,
    TbFileText,
    TbLinkOff,
    TbUserShare,
    TbArrowLeft,
} from 'react-icons/tb'

// Types & Services
import { apiGetHREmployee } from '@/services/HRService' // Assuming this service exists
import type { ColumnDef } from '@/components/shared/DataTable'
import { BiChevronRight } from 'react-icons/bi'

// Define a more specific type based on your JSON response
export type Employee = {
    id: number;
    name: string;
    profile_pic_path: string | null;
    email: string;
    maritual_status: string | null;
    employee_id: string | null;
    date_of_joining: string | null;
    mobile_number: string;
    mobile_number_code: string | null;
    status: 'Active' | 'Inactive' | 'Terminated' | 'On Leave';
    date_of_birth: string | null;
    gender: string | null;
    nationality: { name: string } | null;
    blood_group: string | null;
    permanent_address: string | null;
    local_address: string | null;
    department: { name: string } | null;
    designation: { name: string } | null;
    roles: { display_name: string }[];
    assets: { id: number; name: string; serial_number: string; issued_on: string; status: string }[];
    // Document paths
    identity_proof_path: string | null;
    address_proof_path: string | null;
    offer_letter_path: string | null;
    past_offer_letter_path: string | null;
    relieving_letter_path: string | null;
    designation_letter_path: string | null;
    educational_certificates_path: string[];
    experience_certificates_path: string[];
    salary_slips_path: string[];
    bank_account_proof_path: string | null;
    pan_card_path: string | null;
    passport_size_photograph_path: string | null;
    [key: string]: any; // Allow other fields
};

export const employeeStatusColor: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100',
    inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    terminated: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100',
    on_leave: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100',
};


// --- HELPER & REUSABLE COMPONENTS ---

interface EmployeeProfileHeaderProps {
  employee: Employee | null;
}
const EmployeeProfileHeader = ({ employee }: EmployeeProfileHeaderProps) => {
  const navigate = useNavigate();

  if (!employee) {
    return <p className="text-center">Employee not found.</p>;
  }

  const handleEdit = () => {
    navigate(`/hr-employees/employees/edit/${employee.id}`);
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex items-center gap-4">
        <Avatar
          size={110}
          shape="circle"
          src={employee.profile_pic_path || ''}
          icon={<TbUserCircle />}
        />
        <div className="flex flex-col">
          <h4 className="font-bold">{employee.name}</h4>
          <div className="flex items-center gap-2 mb-1">
            <TbMail className="text-gray-400" /> <p>{employee.email}</p>
          </div>
          {employee.mobile_number && (
            <div className="flex items-center gap-2">
              <TbPhone className="text-gray-400" /> <p>{employee.mobile_number_code} {employee.mobile_number}</p>
            </div>
          )}
          <div className="mt-2">
            <Tag
              className={`${
                employeeStatusColor[employee.status.toLowerCase()]
              } text-white capitalize`}
            >
              {employee.status.replace(/_/g, " ")}
            </Tag>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4">
        <div className="flex items-center gap-2">
          <TbUserShare className="text-gray-400" />
          <span className="font-semibold">Role:</span>
          <span>{employee.roles?.[0]?.display_name || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <TbBuildingSkyscraper className="text-gray-400" />
          <span className="font-semibold">Department:</span>
          <span>{employee.department?.name || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <TbBriefcase className="text-gray-400" />
          <span className="font-semibold">Designation:</span>
          <span>{employee.designation?.name || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <TbCalendar className="text-gray-400" />
          <span className="font-semibold">Joined:</span>
          <span>{employee.date_of_joining ? dayjs(employee.date_of_joining).format("D MMM YYYY") : 'N/A'}</span>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
         <Button variant="solid" icon={<TbPencil />} onClick={handleEdit}>
          Edit Employee
        </Button>
        <Button icon={<TbArrowLeft />} onClick={() => navigate('/hr-employees/employees')}>Back to List</Button>
   
      </div>
    </div>
  );
};

// ... (EmployeeViewNavigator remains the same)
const employeeViewNavigationList = [
    { label: "Employee Details", link: "details" },
    { label: "Documents", link: "documents" },
    { label: "Wall Inquiry", link: "inquiry" },
    { label: "Offer & Demands", link: "offers" },
    { label: "Employee", link: "team" },
    { label: "Member", link: "members" },
  ];
  type NavigatorComponentProps = {
    activeSection: string;
    onNavigate: (sectionKey: string) => void;
  };
  const EmployeeViewNavigator = ({
    activeSection,
    onNavigate,
  }: NavigatorComponentProps) => {
    return (
      <div className="flex flex-row items-center justify-between gap-x-1 md:gap-x-2 py-2 flex-nowrap overflow-x-auto">
        {employeeViewNavigationList.map((nav) => (
          <button
            type="button"
            key={nav.link}
            className={classNames(
              "cursor-pointer px-2 md:px-3 py-2 rounded-md group text-center transition-colors duration-150 flex-1 basis-0 min-w-max",
              "hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none",
              {
                "bg-indigo-50 dark:bg-indigo-700/60 text-indigo-600 dark:text-indigo-200 font-semibold":
                  activeSection === nav.link,
                "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200":
                  activeSection !== nav.link,
              }
            )}
            onClick={() => onNavigate(nav.link)}
            title={nav.label}
          >
            <span className="font-medium text-xs sm:text-sm truncate">
              {nav.label}
            </span>
          </button>
        ))}
      </div>
    );
  };
// ... (SubTableTools remains the same)
interface SubTableToolsProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    filterValue?: string;
    filterOptions?: { value: string; label: string }[];
    onFilterChange?: (selected: { value: string; label: string } | null) => void;
    onClearFilters: () => void;
  }
  const SubTableTools = ({
    searchQuery,
    onSearchChange,
    filterValue,
    filterOptions,
    onFilterChange,
    onClearFilters,
  }: SubTableToolsProps) => {
    const handleDropdownSelect = (eventKey: string, e: SyntheticEvent) => {
      if (!onFilterChange || !filterOptions) return;
      if (eventKey === "_all") {
        onFilterChange(null);
      } else {
        const selectedOption = filterOptions.find(
          (opt) => opt.value === eventKey
        );
        if (selectedOption) {
          onFilterChange(selectedOption);
        }
      }
    };
    const currentFilterLabel =
      filterOptions?.find((opt) => opt.value === filterValue)?.label || "Filter";
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <DebouceInput
          placeholder="Quick Search..."
          suffix={<TbSearch className="text-lg" />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="flex items-center gap-2">
          {filterOptions && onFilterChange && (
            <Dropdown
              renderTitle={
                <Button
                  size="sm"
                  icon={<TbFilter />}
                  className="w-[100px] justify-between"
                >
                  <span>{currentFilterLabel}</span>
                </Button>
              }
            >
              <Dropdown.Item eventKey="_all" onSelect={handleDropdownSelect}>
                All
              </Dropdown.Item>
              <Dropdown.Item variant="divider" />
              {filterOptions.map((option) => (
                <Dropdown.Item
                  key={option.value}
                  eventKey={option.value}
                  onSelect={handleDropdownSelect}
                >
                  {option.label}
                </Dropdown.Item>
              ))}
            </Dropdown>
          )}
          <Tooltip title="Clear Search & Filters">
            <Button
              size="sm"
              icon={<TbX />}
              onClick={onClearFilters}
              variant="plain"
            />
          </Tooltip>
        </div>
      </div>
    );
  };

// --- MAIN TABS ---

// --- 1. Employee Details Tab (Complex View) ---
const DetailSection = ({ title, icon, children, noDataMessage }: { title: string; icon: React.ReactNode; children: React.ReactNode; noDataMessage?: string; }) => (
    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-600 last:mb-0 last:pb-0 last:border-b-0">
        <div className="flex items-center gap-2 mb-4">
            {icon} <h5 className="mb-0">{title}</h5>
        </div>
        <div>{noDataMessage ? <p className="text-gray-500">{noDataMessage}</p> : children}</div>
    </div>
);
const InfoPair = ({ label, value }: { label: string; value: string | number | undefined | null; }) => (
    <div className="grid grid-cols-2 py-1">
        <span className="font-semibold text-gray-700 dark:text-gray-300">{label}</span>
        <span>{value || 'N/A'}</span>
    </div>
);
const RegistrationInfo = ({ employee }: { employee: Employee }) => (
  <DetailSection title="Registration Information" icon={<TbUser size={22} />}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
      <InfoPair label="Employee ID" value={employee.employee_id} />
      <InfoPair label="Joining Date" value={employee.date_of_joining ? dayjs(employee.date_of_joining).format("D MMM YYYY") : 'N/A'} />
      <InfoPair label="Employment Type" value={"Permanent"} />
      <InfoPair label="Probation End Date" value={employee.date_of_joining ? dayjs(employee.date_of_joining).add(3, 'month').format("D MMM YYYY") : 'N/A'} />
    </div>
  </DetailSection>
);
const PersonalInfo = ({ employee }: { employee: Employee }) => (
  <DetailSection title="Personal Information" icon={<TbUserCircle size={22} />}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
      <InfoPair label="Date of Birth" value={employee.date_of_birth ? dayjs(employee.date_of_birth).format("D MMM YYYY") : 'N/A'} />
      <InfoPair label="Gender" value={employee.gender} />
      <InfoPair label="Marital Status" value={employee.maritual_status} />
      <InfoPair label="Nationality" value={employee.nationality?.name} />
      <InfoPair label="Blood Group" value={employee.blood_group} />
    </div>
  </DetailSection>
);
const EmergencyContact = () => (
    <DetailSection title="Emergency Contact" icon={<TbPhoneCall size={22} />} noDataMessage="No emergency contact details available." >
        {/* This will be hidden due to noDataMessage */}
    </DetailSection>
);
const RoleAndResponsibility = () => (
  <DetailSection title="Role & Responsibility" icon={<TbTargetArrow size={22} />} noDataMessage="No roles and responsibilities defined.">
  </DetailSection>
);
const OffBoardingInfo = ({ employee }: { employee: Employee }) => {
    // Show this section only if the employee status is something other than 'Active'
    if (employee.status.toLowerCase() === 'active') {
        return null;
    }
    return (
        <DetailSection title="Off-Boarding Information" icon={<TbLogout size={22} />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <InfoPair label="Resignation Date" value={employee.resignation_date} />
                <InfoPair label="Last Working Day" value={employee.last_working_day} />
                <div className="col-span-full">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Resignation Remark</span>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">{employee.resignation_letter_remark || 'N/A'}</p>
                </div>
                 <div className="col-span-full">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Exit Interview Remark</span>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">{employee.exit_interview_remark || 'N/A'}</p>
                </div>
                <div className="col-span-full mt-4">
                    <h6 className="font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">Clearance Status</h6>
                    <InfoPair label="Full & Final Settlement" value={employee.full_and_final_settlement ? "Completed" : "Pending"} />
                    <InfoPair label="Assets Returned" value={employee.company_assets_returned ? "Yes" : "No"} />
                </div>
            </div>
        </DetailSection>
    );
};
const FamilyDetailsTable = () => (
    <DetailSection title="Family Details" icon={<TbUsers size={22} />} noDataMessage="No family details have been added.">
    </DetailSection>
);
const EducationDetailsTable = () => (
    <DetailSection title="Education Details" icon={<TbSchool size={22} />} noDataMessage="No education details have been added.">
    </DetailSection>
);
const EmploymentHistoryTable = () => (
    <DetailSection title="Employment History" icon={<TbHistory size={22} />} noDataMessage="No employment history has been added.">
    </DetailSection>
);
const TrainingTable = ({ employee }: { employee: Employee }) => (
    <DetailSection title="Training" icon={<TbCertificate size={22} />}>
        <InfoPair label="General Training Completion" value={employee.training_date_of_completion ? dayjs(employee.training_date_of_completion).format("D MMM YYYY") : 'N/A'}/>
        <InfoPair label="General Training Remark" value={employee.training_remark}/>
        <InfoPair label="Specific Training Completion" value={employee.specific_training_date_of_completion ? dayjs(employee.specific_training_date_of_completion).format("D MMM YYYY") : 'N/A'}/>
        <InfoPair label="Specific Training Remark" value={employee.specific_training_remark}/>
    </DetailSection>
);

const AssetsTable = ({ assets }: { assets: Employee['assets'] }) => {
    type Record = Employee['assets'][0];
    const columns = useMemo<ColumnDef<Record>[]>(() => [ { header: "Asset Name", accessorKey: "name" }, { header: "Serial No.", accessorKey: "serial_number" }, { header: "Issued On", cell: (props) => dayjs(props.row.original.issued_on).format("D MMM YYYY") }, { header: "Status", accessorKey: "status" }, ], []);
    return (
        <DetailSection title="Equipments & Assets Provided" icon={<TbDeviceLaptop size={22} />} noDataMessage={!assets || assets.length === 0 ? "No assets have been assigned." : ""}>
            {assets && assets.length > 0 && <DataTable columns={columns} data={assets} />}
        </DetailSection>
    );
};

const EmployeeDetailsTab = ({ employee }: { employee: Employee | null }) => {
  if(!employee) return null;
  return (
    <div>
      <RegistrationInfo employee={employee} />
      <PersonalInfo employee={employee} />
      <FamilyDetailsTable />
      <EmergencyContact />
      <EducationDetailsTable />
      <EmploymentHistoryTable />
      <RoleAndResponsibility />
      <TrainingTable employee={employee} />
      <AssetsTable assets={employee.assets} />
      <OffBoardingInfo employee={employee} />
    </div>
  );
};


const DocumentsTab = ({ employee }: { employee: Employee | null }) => {
    const documentList = useMemo(() => {
        if (!employee) return [];
        const docs = [];
        if (employee.identity_proof_path) docs.push({ name: 'Identity Proof', type: 'KYC', url: employee.identity_proof_path, uploadedAt: employee.updated_at });
        if (employee.address_proof_path) docs.push({ name: 'Address Proof', type: 'KYC', url: employee.address_proof_path, uploadedAt: employee.updated_at });
        if (employee.offer_letter_path) docs.push({ name: 'Offer Letter', type: 'Onboarding', url: employee.offer_letter_path, uploadedAt: employee.created_at });
        if (employee.relieving_letter_path) docs.push({ name: 'Relieving Letter', type: 'Experience', url: employee.relieving_letter_path, uploadedAt: employee.updated_at });
        employee.educational_certificates_path?.forEach((url, i) => docs.push({ name: `Educational Certificate ${i + 1}`, type: 'Education', url, uploadedAt: employee.updated_at }));
        employee.experience_certificates_path?.forEach((url, i) => docs.push({ name: `Experience Certificate ${i + 1}`, type: 'Experience', url, uploadedAt: employee.updated_at }));
        employee.salary_slips_path?.forEach((url, i) => docs.push({ name: `Salary Slip ${i + 1}`, type: 'Financial', url, uploadedAt: employee.updated_at }));
        
        return docs;
    }, [employee]);
    
    type Record = typeof documentList[0];
    const [searchQuery, setSearchQuery] = useState('');
    const columns = useMemo<ColumnDef<Record>[]>(() => [ { header: 'Document Name', accessorKey: 'name' }, { header: 'Type', accessorKey: 'type' }, { header: 'Uploaded At', accessorKey: 'uploadedAt', cell: (props) => dayjs(props.getValue() as Date).format('D MMM YYYY') }, { header: 'Action', id: 'action', cell: (props) => <Tooltip title="Download"> <a href={props.row.original.url} target="_blank" rel="noopener noreferrer"> <Button shape="circle" size="sm" icon={<TbDownload />} /> </a> </Tooltip> } ], []);
    const filteredData = useMemo(() => { if (!searchQuery) return documentList; const q = searchQuery.toLowerCase(); return documentList.filter(item => item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q)); }, [documentList, searchQuery]);
    return (<> <div className="mb-4"> <SubTableTools searchQuery={searchQuery} onSearchChange={(val) => setSearchQuery(val)} onClearFilters={() => setSearchQuery('')} /> </div> <DataTable columns={columns} data={filteredData} /> </>);
};
// Other placeholder tabs
const WallInquiryTab = () => <p>Wall Inquiry data will be displayed here.</p>;
const OfferDemandsTab = () => <p>Offer & Demands data will be displayed here.</p>;
const EmployeeTeamTab = () => <p>Team members reporting to this employee will be displayed here.</p>;
const AssociatedMembersTab = () => <p>Associated members (clients, vendors) will be displayed here.</p>;

// --- MAIN EMPLOYEE VIEW PAGE ---
const EmployeeView = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeSection, setActiveSection] = useState<string>(employeeViewNavigationList[0].link);

  useEffect(() => {
    const fetchEmployeeData = async () => {
        if (!id) return;
        try {
            // This is where you'd call your API
            // const response = await apiGetHREmployee(id);
            // For now, using the provided JSON as a mock response
            const mockResponse = {
                "data": {
                    "id": 7, "name": "User", "profile_pic": null, "portal_email": null, "email": "user@gmail.com", "maritual_status": null, "email_verified": "false", "email_verified_token": null, "employee_id": "EMP-007", "timezone": "Asia/Kolkata", "last_login_at": null, "logout_at": null, "deleted_at": null, "created_at": "2025-07-05T06:58:24.000000Z", "updated_at": "2025-07-05T06:58:24.000000Z", "created_by": null, "temporarily_block_time": null, "date_of_joining": "2024-01-15T00:00:00.000000Z", "mobile_number": "9537897620", "mobile_number_code": "+91", "experience": null, "status": "Active", "date_of_birth": "1998-05-20T00:00:00.000000Z", "age": null, "gender": "Male", "nationality_id": null, "blood_group": "A+", "permanent_address": "123 Main St, Anytown", "local_address": "456 Park Ave, Anytown", "role_id": 2, "department_id": 1, "designation_id": 1, "country_id": null, "category_id": null, "subcategory_id": null, "brand_id": null, "product_service_id": null, "reporting_hr_id": null, "reporting_head_id": null, "training_date_of_completion": null, "specific_training_date_of_completion": null, "training_remark": null, "specific_training_remark": null, "identity_proof": "path/to/identity.pdf", "address_proof": "path/to/address.pdf", "educational_certificates": null, "experience_certificates": null, "offer_letter": "path/to/offer_letter.pdf", "past_offer_letter": null, "relieving_letter": null, "designation_letter": null, "salary_slips": null, "bank_account_proof": null, "pan_card": null, "passport_size_photograph": null, "exit_interview_conducted": false, "exit_interview_remark": null, "resignation_letter_received": false, "resignation_letter_remark": null, "company_assets_returned": null, "full_and_final_settlement": false, "assets_returned_remarks": null, "assets_returned": null, "fnf_remarks": null, "notice_period_status": null, "notice_period_remarks": null, "updated_by": null, "profile_pic_path": "/img/avatars/thumb-1.jpg", "identity_proof_path": "/docs/dummy.pdf", "address_proof_path": "/docs/dummy.pdf", "offer_letter_path": "/docs/dummy.pdf", "past_offer_letter_path": null, "relieving_letter_path": null, "designation_letter_path": null, "educational_certificates_path": ["/docs/dummy.pdf", "/docs/dummy2.pdf"], "experience_certificates_path": [], "salary_slips_path": [], "bank_account_proof_path": null, "pan_card_path": null, "passport_size_photograph_path": null, "assets": [{ "id": 1, "name": "MacBook Pro 16\"", "serial_number": "ASSET-MBP-001", "issued_on": "2024-01-15T00:00:00.000000Z", "status": "In Use" }],
                    "roles": [{ "id": 4, "name": "user", "display_name": "User", "pivot": { "model_type": "App\\Models\\User", "model_id": 7, "role_id": 4 } }],
                    "department": { "name": "Technology" }, "designation": { "name": "Senior Software Engineer" }, "country": null, "category": null, "sub_category": null, "brand": null, "product": null, "nationality": { "name": "Indian" }, "reporting_hr": null, "reporting_head": null
                }
            };
            setEmployee(mockResponse.data);
        } catch (error) {
            console.error("Failed to fetch employee", error);
            setEmployee(null);
        } finally {
            
        }
    }
    fetchEmployeeData();
  }, [id]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "details": return <EmployeeDetailsTab employee={employee} />;
      case "documents": return <DocumentsTab employee={employee} />;
      case "inquiry": return <WallInquiryTab />;
      case "offers": return <OfferDemandsTab />;
      case "team": return <EmployeeTeamTab />;
      case "members": return <AssociatedMembersTab />;
      default: return <EmployeeDetailsTab employee={employee} />;
    }
  };


  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-4">
        <NavLink to="/hr-employees/employees">
          <h6 className="font-semibold hover:text-primary-600">
            Employees
          </h6>
        </NavLink>
        <BiChevronRight size={18} />
        <h6 className="font-semibold text-primary-600">
          {employee ? employee.name : "View Employee"}
        </h6>
      </div>
      <Card bodyClass="p-0">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <EmployeeProfileHeader employee={employee} />
        </div>
        <div className="px-4 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <EmployeeViewNavigator activeSection={activeSection} onNavigate={setActiveSection} />
        </div>
        <div className="p-4 sm:p-6">{renderActiveSection()}</div>
      </Card>
    </Container>
  );
};

export default EmployeeView;