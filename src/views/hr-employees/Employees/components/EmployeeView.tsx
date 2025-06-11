import React, { useState, useMemo, useEffect, SyntheticEvent } from "react";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import classNames from "classnames";

// UI Components
import Container from "@/components/shared/Container";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import DebouceInput from "@/components/shared/DebouceInput";
import Dropdown from "@/components/ui/Dropdown";

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
  TbChevronDown,
  TbUser,
  TbUsers,
  TbHeartHandshake,
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
  TbCash,
  TbTag,
  TbUserShare,
} from "react-icons/tb";

// Types
import type { ColumnDef } from "@/components/shared/DataTable";
import { EmployeeItem, employeeStatusColor } from "../Employees";
import { BiChevronRight } from "react-icons/bi";

// --- DUMMY DATA ---
const DUMMY_EMPLOYEES: EmployeeItem[] = [
  {
    id: "EMP001",
    status: "active",
    name: "Alice Wonderland",
    email: "alice.w@company.com",
    mobile: "+1-555-1001",
    department: "Engineering",
    designation: "Software Engineer II",
    roles: ["Developer", "Code Reviewer"],
    avatar: "/img/avatars/thumb-1.jpg",
    createdAt: new Date(2022, 5, 15),
    joiningDate: new Date(2022, 5, 15),
    bio: "Loves coding and tea parties.",
  },
  {
    id: "EMP002",
    status: "active",
    name: "Bob The Builder",
    email: "bob.b@company.com",
    mobile: "+1-555-1002",
    department: "Marketing",
    designation: "Marketing Manager",
    roles: ["Manager", "Campaign Planner"],
    avatar: "/img/avatars/thumb-2.jpg",
    createdAt: new Date(2021, 8, 1),
    joiningDate: new Date(2021, 8, 1),
  },
];

// --- HELPER & REUSABLE COMPONENTS ---

// Employee Detail Header (Top Banner)
interface EmployeeDetailSectionProps {
  employee: EmployeeItem | null;
}
const EmployeeDetailSection = ({ employee }: EmployeeDetailSectionProps) => {
  const navigate = useNavigate();
  if (!employee) {
    return (
      <Card>
        {" "}
        <p className="text-center">Employee not found.</p>{" "}
      </Card>
    );
  }
  const handleEdit = () => {
    navigate(`/hr-employees/employees/edit/${employee.id}`);
  };
  return (
    <Card>
      {" "}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <Avatar
            size={80}
            shape="circle"
            src={employee.avatar}
            icon={<TbUserCircle />}
          />{" "}
          <div className="flex flex-col">
            {" "}
            <h4 className="font-bold">{employee.name}</h4>{" "}
            <div className="flex items-center gap-2 mb-1">
              {" "}
              <TbMail className="text-gray-400" /> <p>{employee.email}</p>{" "}
            </div>{" "}
            {employee.mobile && (
              <div className="flex items-center gap-2">
                {" "}
                <TbPhone className="text-gray-400" /> <p>{employee.mobile}</p>{" "}
              </div>
            )}{" "}
            <div className="mt-2">
              {" "}
              <Tag
                className={`${
                  employeeStatusColor[employee.status]
                } text-white capitalize`}
              >
                {" "}
                {employee.status.replace(/_/g, " ")}{" "}
              </Tag>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-2 gap-x-4">
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <TbBuildingSkyscraper className="text-gray-400" />{" "}
            <span className="font-semibold">Department:</span>{" "}
            <span>{employee.department}</span>{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <TbBriefcase className="text-gray-400" />{" "}
            <span className="font-semibold">Designation:</span>{" "}
            <span>{employee.designation}</span>{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <TbCalendar className="text-gray-400" />{" "}
            <span className="font-semibold">Joined:</span>{" "}
            <span>{dayjs(employee.joiningDate).format("D MMM YYYY")}</span>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
          {" "}
          <Button variant="solid" icon={<TbPencil />} onClick={handleEdit}>
            {" "}
            Edit Profile{" "}
          </Button>{" "}
          <Button icon={<TbKey />}>Change Password</Button>{" "}
          <Button icon={<TbTrash />} color="red-600">
            {" "}
            Deactivate{" "}
          </Button>{" "}
        </div>{" "}
      </div>{" "}
    </Card>
  );
};

// Navigator for Main Tabs
const employeeViewNavigationList = [
  { label: "Employee Details", link: "details" },
  { label: "Documents", link: "documents" },
  { label: "Wall Inquiry", link: "inquiry" },
  { label: "Offer & Demands", link: "offers" },
  { label: "Team / Subordinates", link: "team" },
  { label: "Associated Members", link: "members" },
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
      {" "}
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
          {" "}
          <span className="font-medium text-xs sm:text-sm truncate">
            {" "}
            {nav.label}{" "}
          </span>{" "}
        </button>
      ))}{" "}
    </div>
  );
};

// Reusable Search/Filter Tools for Tables
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
      {" "}
      <DebouceInput
        placeholder="Quick Search..."
        suffix={<TbSearch className="text-lg" />}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />{" "}
      <div className="flex items-center gap-2">
        {" "}
        {filterOptions && onFilterChange && (
          <Dropdown
            renderTitle={
              <Button
                size="sm"
                icon={<TbFilter />}
                className="w-[100px] justify-between"
              >
                {" "}
                <span>{currentFilterLabel}</span>{" "}
              </Button>
            }
          >
            {" "}
            <Dropdown.Item eventKey="_all" onSelect={handleDropdownSelect}>
              {" "}
              All{" "}
            </Dropdown.Item>{" "}
            <Dropdown.Item variant="divider" />{" "}
            {filterOptions.map((option) => (
              <Dropdown.Item
                key={option.value}
                eventKey={option.value}
                onSelect={handleDropdownSelect}
              >
                {" "}
                {option.label}{" "}
              </Dropdown.Item>
            ))}{" "}
          </Dropdown>
        )}{" "}
        <Tooltip title="Clear Search & Filters">
          {" "}
          <Button
            size="sm"
            icon={<TbX />}
            onClick={onClearFilters}
            variant="plain"
          />{" "}
        </Tooltip>{" "}
      </div>{" "}
    </div>
  );
};

// --- MAIN TABS ---

// --- 1. Employee Details Tab (Complex View) ---
const SectionCard = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card>
    {" "}
    <div className="flex items-center gap-2 mb-4">
      {" "}
      {icon} <h5 className="mb-0">{title}</h5>{" "}
    </div>{" "}
    <div>{children}</div>{" "}
  </Card>
);
const InfoPair = ({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) => (
  <div className="grid grid-cols-2 py-1">
    {" "}
    <span className="font-semibold text-gray-700 dark:text-gray-300">
      {label}
    </span>{" "}
    <span>{value || "N/A"}</span>{" "}
  </div>
);
const RegistrationInfo = () => (
  <SectionCard title="Registration Information" icon={<TbUser size={22} />}>
    {" "}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
      {" "}
      <InfoPair label="Employee ID" value="EMP001" />{" "}
      <InfoPair label="Joining Date" value="15 Jun 2022" />{" "}
      <InfoPair label="Employment Type" value="Permanent" />{" "}
      <InfoPair label="Probation End Date" value="14 Sep 2022" />{" "}
    </div>{" "}
  </SectionCard>
);
const PersonalInfo = () => (
  <SectionCard title="Personal Information" icon={<TbUserCircle size={22} />}>
    {" "}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
      {" "}
      <InfoPair label="Date of Birth" value="10 Jan 1995" />{" "}
      <InfoPair label="Gender" value="Female" />{" "}
      <InfoPair label="Marital Status" value="Single" />{" "}
      <InfoPair label="Nationality" value="Indian" />{" "}
      <InfoPair label="Blood Group" value="O+" />{" "}
    </div>{" "}
  </SectionCard>
);
const EmergencyContact = () => (
  <SectionCard title="Emergency Contact" icon={<TbPhoneCall size={22} />}>
    {" "}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
      {" "}
      <InfoPair label="Contact Name" value="Mr. Hatter" />{" "}
      <InfoPair label="Relationship" value="Father" />{" "}
      <InfoPair label="Phone Number" value="+1-555-2001" />{" "}
    </div>{" "}
  </SectionCard>
);
const RoleAndResponsibility = () => (
  <SectionCard title="Role & Responsibility" icon={<TbTargetArrow size={22} />}>
    {" "}
    <ul>
      {" "}
      <li className="list-disc ml-4">
        Develop and maintain web applications.
      </li>{" "}
      <li className="list-disc ml-4">Conduct code reviews for peers.</li>{" "}
      <li className="list-disc ml-4">
        Collaborate with the design team on new features.
      </li>{" "}
    </ul>{" "}
  </SectionCard>
);
// In EmployeeView.tsx, inside the "Employee Details Tab" section

// ... (Other helper components like SectionCard, InfoPair remain the same)

const OffBoardingInfo = ({ employee }: { employee: EmployeeItem | null }) => {
    // Check if the employee is terminated
    if (employee?.status == 'terminated') {
        return (
            <SectionCard title="Off-Boarding" icon={<TbLogout size={22}/>}> 
                <div className="text-gray-500">No off-boarding information available for this active employee.</div> 
            </SectionCard>
        );
    }
    
    // If terminated, show detailed information
    return (
        <SectionCard title="Off-Boarding Information" icon={<TbLogout size={22}/>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <InfoPair label="Resignation Date" value="15 Oct 2023"/> 
                <InfoPair label="Last Working Day" value="14 Nov 2023"/>
                <InfoPair label="Reason for Leaving" value="Better Opportunity"/>
                <InfoPair label="Exit Interview Date" value="10 Nov 2023"/>

                <div className="col-span-full">
                    <h6 className="font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-2">Clearance Status</h6>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="flex items-center gap-2">
                            <TbCheck className="text-emerald-500" /> <span>IT Department</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TbCheck className="text-emerald-500" /> <span>Finance</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TbCheck className="text-emerald-500" /> <span>HR Department</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TbCheck className="text-emerald-500" /> <span>Manager</span>
                        </div>
                    </div>
                </div>

                <div className="col-span-full mt-4">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Manager's Remark</span>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">Eve was a valuable member of the team and we wish her the best in her future endeavors.</p>
                </div>

                <div className="col-span-full mt-4">
                     <Button variant="solid" size="sm" icon={<TbFileText />}>
                        Download Full & Final Settlement
                    </Button>
                </div>
            </div>
        </SectionCard>
    );
};
const FamilyDetailsTable = () => {
  type Record = {
    name: string;
    relationship: string;
    dob: string;
    contact: string;
  };
  const data: Record[] = [
    {
      name: "Mr. Hatter",
      relationship: "Father",
      dob: "01 Jan 1965",
      contact: "+1-555-2001",
    },
    {
      name: "Mrs. Hatter",
      relationship: "Mother",
      dob: "01 Feb 1968",
      contact: "+1-555-2002",
    },
  ];
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      { header: "Name", accessorKey: "name" },
      { header: "Relationship", accessorKey: "relationship" },
      { header: "Date of Birth", accessorKey: "dob" },
      { header: "Contact No.", accessorKey: "contact" },
    ],
    []
  );
  return (
    <SectionCard title="Family Details" icon={<TbUsers size={22} />}>
      <DataTable columns={columns} data={data} />
    </SectionCard>
  );
};
const EducationDetailsTable = () => {
  type Record = {
    degree: string;
    institution: string;
    year: number;
    score: string;
  };
  const data: Record[] = [
    {
      degree: "B.Tech in Computer Science",
      institution: "Wonderland University",
      year: 2021,
      score: "8.5 CGPA",
    },
  ];
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      { header: "Degree / Certificate", accessorKey: "degree" },
      { header: "Institution", accessorKey: "institution" },
      { header: "Year of Completion", accessorKey: "year" },
      { header: "Score / Grade", accessorKey: "score" },
    ],
    []
  );
  return (
    <SectionCard title="Education Details" icon={<TbSchool size={22} />}>
      <DataTable columns={columns} data={data} />
    </SectionCard>
  );
};
const EmploymentHistoryTable = () => {
  type Record = { company: string; designation: string; period: string };
  const data: Record[] = [
    {
      company: "Cheshire Cat Inc.",
      designation: "Jr. Software Intern",
      period: "Jan 2020 - Dec 2020",
    },
  ];
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      { header: "Company Name", accessorKey: "company" },
      { header: "Designation", accessorKey: "designation" },
      { header: "Period", accessorKey: "period" },
    ],
    []
  );
  return (
    <SectionCard title="Employment History" icon={<TbHistory size={22} />}>
      <DataTable columns={columns} data={data} />
    </SectionCard>
  );
};
const TrainingTable = () => {
  type Record = { name: string; date: string; conductedBy: string };
  const data: Record[] = [
    {
      name: "Advanced React Patterns",
      date: "10 Aug 2023",
      conductedBy: "The Mad Hatter",
    },
  ];
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      { header: "Training Name", accessorKey: "name" },
      { header: "Date", accessorKey: "date" },
      { header: "Conducted By", accessorKey: "conductedBy" },
    ],
    []
  );
  return (
    <SectionCard title="Training" icon={<TbCertificate size={22} />}>
      <DataTable columns={columns} data={data} />
    </SectionCard>
  );
};
const AssetsTable = () => {
  type Record = {
    name: string;
    serial: string;
    issuedOn: string;
    status: "In Use" | "Returned";
  };
  const data: Record[] = [
    {
      name: "Dell XPS 15 Laptop",
      serial: "ASSET-12345",
      issuedOn: "15 Jun 2022",
      status: "In Use",
    },
    {
      name: "Logitech Wireless Mouse",
      serial: "ASSET-12346",
      issuedOn: "15 Jun 2022",
      status: "In Use",
    },
  ];
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      { header: "Asset Name", accessorKey: "name" },
      { header: "Serial No.", accessorKey: "serial" },
      { header: "Issued On", accessorKey: "issuedOn" },
      { header: "Status", accessorKey: "status" },
    ],
    []
  );
  return (
    <SectionCard
      title="Equipments & Assets Provided"
      icon={<TbDeviceLaptop size={22} />}
    >
      <DataTable columns={columns} data={data} />
    </SectionCard>
  );
};
const EmployeeDetailsTab = ({ employee }: { employee: EmployeeItem | null }) => {
    return (
        <div className="flex flex-col gap-6">
            <RegistrationInfo />
            <PersonalInfo />
            <FamilyDetailsTable />
            <EmergencyContact />
            <EducationDetailsTable />
            <EmploymentHistoryTable />
            <RoleAndResponsibility />
            <TrainingTable />
            <AssetsTable />
            {/* Pass the employee prop here */}
            <OffBoardingInfo employee={employee} /> 
        </div>
    );
};

// --- 2. Documents Tab ---
const DocumentsTab = () => {
  type Record = {
    name: string;
    type: "Onboarding" | "KYC" | "Review";
    uploadedAt: Date;
    url: string;
  };
  const data: Record[] = [
    {
      name: "Offer Letter",
      type: "Onboarding",
      uploadedAt: new Date(2022, 5, 1),
      url: "/docs/offer.pdf",
    },
    {
      name: "Passport Copy",
      type: "KYC",
      uploadedAt: new Date(2022, 5, 2),
      url: "/docs/passport.pdf",
    },
    {
      name: "Performance Appraisal 2023",
      type: "Review",
      uploadedAt: new Date(2023, 6, 1),
      url: "/docs/appraisal_2023.pdf",
    },
  ];
  const [searchQuery, setSearchQuery] = useState("");
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      { header: "Document Name", accessorKey: "name" },
      { header: "Type", accessorKey: "type" },
      {
        header: "Uploaded At",
        accessorKey: "uploadedAt",
        cell: (props) => dayjs(props.getValue() as Date).format("D MMM YYYY"),
      },
      {
        header: "Action",
        id: "action",
        cell: (props) => (
          <Tooltip title="Download">
            {" "}
            <a
              href={props.row.original.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {" "}
              <Button shape="circle" size="sm" icon={<TbDownload />} />{" "}
            </a>{" "}
          </Tooltip>
        ),
      },
    ],
    []
  );
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);
  return (
    <Card>
      {" "}
      <div className="mb-4">
        {" "}
        <SubTableTools
          searchQuery={searchQuery}
          onSearchChange={(val) => setSearchQuery(val)}
          onClearFilters={() => setSearchQuery("")}
        />{" "}
      </div>{" "}
      <DataTable columns={columns} data={filteredData} />{" "}
    </Card>
  );
};

// --- 3. Wall Inquiry Tab ---
const WallInquiryTab = () => {
  type Record = {
    id: string;
    inquiry: string;
    postedBy: string;
    date: Date;
    status: "Open" | "Resolved" | "Closed";
  };
  const data: Record[] = [
    {
      id: "INQ01",
      inquiry: 'Inquiry about project deadline for "Project X"',
      postedBy: "Bob The Builder",
      date: new Date(2023, 10, 15),
      status: "Resolved",
    },
    {
      id: "INQ02",
      inquiry: "Question regarding new HR policy on leaves",
      postedBy: "Charlie Chaplin",
      date: new Date(2023, 11, 1),
      status: "Open",
    },
  ];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const statusOptions = [
    { value: "Open", label: "Open" },
    { value: "Resolved", label: "Resolved" },
    { value: "Closed", label: "Closed" },
  ];
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      { header: "Inquiry ID", accessorKey: "id" },
      { header: "Inquiry", accessorKey: "inquiry", size: 400 },
      { header: "Posted By", accessorKey: "postedBy" },
      {
        header: "Date",
        accessorKey: "date",
        cell: (props) => dayjs(props.getValue() as Date).format("D MMM YYYY"),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (props) => <Tag>{props.getValue() as string}</Tag>,
      },
    ],
    []
  );
  const filteredData = useMemo(() => {
    let filtered = [...data];
    if (statusFilter) {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.inquiry.toLowerCase().includes(q) ||
          item.postedBy.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [data, searchQuery, statusFilter]);
  return (
    <Card>
      {" "}
      <div className="mb-4">
        {" "}
        <SubTableTools
          searchQuery={searchQuery}
          onSearchChange={(val) => setSearchQuery(val)}
          filterValue={statusFilter}
          filterOptions={statusOptions}
          onFilterChange={(sel) => setStatusFilter(sel?.value || "")}
          onClearFilters={() => {
            setSearchQuery("");
            setStatusFilter("");
          }}
        />{" "}
      </div>{" "}
      <DataTable columns={columns} data={filteredData} />{" "}
    </Card>
  );
};

// --- 4. Offer & Demands Tab ---
const OfferDemandsTab = () => {
  type Record = {
    id: string;
    type: "Offer" | "Demand";
    item: string;
    value: number;
    date: Date;
    status: "Accepted" | "Pending" | "Rejected";
  };
  const data: Record[] = [
    {
      id: "OD01",
      type: "Offer",
      item: "Laptops (50 units)",
      value: 2500000,
      date: new Date(2023, 8, 20),
      status: "Accepted",
    },
    {
      id: "OD02",
      type: "Demand",
      item: "Office Chairs (20 units)",
      value: 80000,
      date: new Date(2023, 9, 5),
      status: "Pending",
    },
    {
      id: "OD03",
      type: "Offer",
      item: "Software License Renewal",
      value: 150000,
      date: new Date(2023, 10, 1),
      status: "Accepted",
    },
  ];
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const typeOptions = [
    { value: "Offer", label: "Offer" },
    { value: "Demand", label: "Demand" },
  ];
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      {
        header: "Type",
        accessorKey: "type",
        cell: (props) => {
          const type = props.getValue() as string;
          return (
            <Tag
              className={
                type === "Offer"
                  ? "bg-emerald-500 text-white"
                  : "bg-amber-500 text-white"
              }
            >
              {type}
            </Tag>
          );
        },
      },
      { header: "Item Description", accessorKey: "item", size: 300 },
      {
        header: "Value (₹)",
        accessorKey: "value",
        cell: (props) => (props.getValue() as number).toLocaleString("en-IN"),
      },
      {
        header: "Date",
        accessorKey: "date",
        cell: (props) => dayjs(props.getValue() as Date).format("D MMM YYYY"),
      },
      { header: "Status", accessorKey: "status" },
    ],
    []
  );
  const filteredData = useMemo(() => {
    let filtered = [...data];
    if (typeFilter) {
      filtered = filtered.filter((item) => item.type === typeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => item.item.toLowerCase().includes(q));
    }
    return filtered;
  }, [data, searchQuery, typeFilter]);
  return (
    <Card>
      {" "}
      <div className="mb-4">
        {" "}
        <SubTableTools
          searchQuery={searchQuery}
          onSearchChange={(val) => setSearchQuery(val)}
          filterValue={typeFilter}
          filterOptions={typeOptions}
          onFilterChange={(sel) => setTypeFilter(sel?.value || "")}
          onClearFilters={() => {
            setSearchQuery("");
            setTypeFilter("");
          }}
        />{" "}
      </div>{" "}
      <DataTable columns={columns} data={filteredData} />{" "}
    </Card>
  );
};

// --- 5. Team / Subordinates Tab ---
const EmployeeTeamTab = () => {
  type Record = {
    id: string;
    name: string;
    designation: string;
    email: string;
    status: "active" | "on_leave";
  };
  const data: Record[] = [
    {
      id: "EMP003",
      name: "Charlie Chaplin",
      designation: "Software Engineer I",
      email: "charlie.c@company.com",
      status: "active",
    },
    {
      id: "EMP004",
      name: "David Copperfield",
      designation: "UI/UX Designer",
      email: "david.c@company.com",
      status: "on_leave",
    },
  ];
  const [searchQuery, setSearchQuery] = useState("");
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      { header: "Employee ID", accessorKey: "id" },
      { header: "Name", accessorKey: "name" },
      { header: "Designation", accessorKey: "designation" },
      { header: "Email", accessorKey: "email" },
      {
        header: "Status",
        accessorKey: "status",
        cell: (props) => (
          <Tag
            className={
              props.row.original.status === "active"
                ? "bg-emerald-100 text-emerald-600"
                : "bg-amber-100 text-amber-600"
            }
          >
            {props.getValue() as string}
          </Tag>
        ),
      },
    ],
    []
  );
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.designation.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);
  return (
    <Card>
      {" "}
      <div className="mb-4">
        {" "}
        <SubTableTools
          searchQuery={searchQuery}
          onSearchChange={(val) => setSearchQuery(val)}
          onClearFilters={() => setSearchQuery("")}
        />{" "}
      </div>{" "}
      <DataTable columns={columns} data={filteredData} />{" "}
    </Card>
  );
};

// --- 6. Associated Members Tab ---
const AssociatedMembersTab = () => {
  type Record = {
    id: string;
    name: string;
    company: string;
    role: "Client" | "Vendor" | "Partner";
    contact: string;
  };
  const data: Record[] = [
    {
      id: "MEM01",
      name: "The Mad Hatter",
      company: "Tea Party Supplies",
      role: "Vendor",
      contact: "mad.h@teaparty.com",
    },
    {
      id: "MEM02",
      name: "Queen of Hearts",
      company: "Royal Court Inc.",
      role: "Client",
      contact: "queen@royal.court",
    },
  ];
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const roleOptions = [
    { value: "Client", label: "Client" },
    { value: "Vendor", label: "Vendor" },
    { value: "Partner", label: "Partner" },
  ];
  const columns = useMemo<ColumnDef<Record>[]>(
    () => [
      { header: "Member ID", accessorKey: "id" },
      { header: "Name", accessorKey: "name" },
      { header: "Company", accessorKey: "company" },
      { header: "Role", accessorKey: "role" },
      { header: "Contact", accessorKey: "contact" },
    ],
    []
  );
  const filteredData = useMemo(() => {
    let filtered = [...data];
    if (roleFilter) {
      filtered = filtered.filter((item) => item.role === roleFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.company.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [data, searchQuery, roleFilter]);
  return (
    <Card>
      {" "}
      <div className="mb-4">
        {" "}
        <SubTableTools
          searchQuery={searchQuery}
          onSearchChange={(val) => setSearchQuery(val)}
          filterValue={roleFilter}
          filterOptions={roleOptions}
          onFilterChange={(sel) => setRoleFilter(sel?.value || "")}
          onClearFilters={() => {
            setSearchQuery("");
            setRoleFilter("");
          }}
        />{" "}
      </div>{" "}
      <DataTable columns={columns} data={filteredData} />{" "}
    </Card>
  );
};

// --- MAIN EMPLOYEE VIEW PAGE ---
const EmployeeView = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<EmployeeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>(
    employeeViewNavigationList[0].link
  );

  useEffect(() => {
    setLoading(true);
    const foundEmployee = DUMMY_EMPLOYEES.find((emp) => emp.id === id);
    setTimeout(() => {
      setEmployee(foundEmployee || null);
      setLoading(false);
    }, 500);
  }, [id]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case "details":
        return <EmployeeDetailsTab employee={employee} />;
      case "documents":
        return <DocumentsTab />;
      case "inquiry":
        return <WallInquiryTab />;
      case "offers":
        return <OfferDemandsTab />;
      case "team":
        return <EmployeeTeamTab />;
      case "members":
        return <AssociatedMembersTab />;
      default:
        return <EmployeeDetailsTab employee={employee}/>;
    }
  };

  if (loading) {
    return (
      <Container className="h-full flex justify-center items-center">
        {" "}
        <p>Loading employee details...</p>{" "}
      </Container>
    );
  }

  return (
    <Container className="h-full">
      <div className="flex gap-1 items-end mb-4">
        <NavLink to="/hr-employees/employees">
          {" "}
          <h6 className="font-semibold hover:text-primary-600">
            Employees
          </h6>{" "}
        </NavLink>
        <BiChevronRight size={18} />
        <h6 className="font-semibold text-primary-600">
          {" "}
          {employee ? employee.name : "View Employee"}{" "}
        </h6>
      </div>
      <div className="flex flex-col gap-4">
        <EmployeeDetailSection employee={employee} />
        <Card bodyClass="px-4 py-2 md:px-6">
          <EmployeeViewNavigator
            activeSection={activeSection}
            onNavigate={setActiveSection}
          />
        </Card>
        <div>{renderActiveSection()}</div>
      </div>
    </Container>
  );
};

export default EmployeeView;
