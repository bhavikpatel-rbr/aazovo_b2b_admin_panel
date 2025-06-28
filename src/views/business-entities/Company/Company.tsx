import { zodResolver } from "@hookform/resolvers/zod";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
// REMOVED: import { CSVLink } from "react-csv";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput";
import RichTextEditor from "@/components/shared/RichTextEditor";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Dropdown,
  Input,
  Select,
  Table,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import FormItem from "@/components/ui/Form/FormItem";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdCancel, MdCheckCircle } from "react-icons/md";
import {
  TbAlarm,
  TbAlertTriangle,
  TbBell,
  TbBrandWhatsapp,
  TbBuilding,
  TbBuildingBank,
  TbBuildingCommunity,
  TbCalendar,
  TbCalendarEvent,
  TbCancel,
  TbChecks,
  TbCircleCheck,
  TbCircleX,
  TbClipboardText,
  TbCloudUpload,
  TbDownload,
  TbEye,
  TbFileSearch,
  TbFileText,
  TbFileZip,
  TbFilter,
  TbMail,
  TbPencil,
  TbPlus,
  TbReceipt,
  TbSearch,
  TbShieldCheck,
  TbShieldX,
  TbTagStarred,
  TbUser,
  TbUserCircle,
  TbUserSearch,
  TbUsersGroup,
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  deleteAllcompanyAction,
  getCompanyAction,
  getContinentsAction,
  getCountriesAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- START: Detailed CompanyItem and Sub-types ---
interface UserReference {
  id: number;
  name: string;
  profile_pic_path: string | null;
  // Add other fields from UserReference if needed
}

interface ContinentReference {
  id: number;
  name: string;
  // Add other fields from ContinentReference if needed
}

interface CountryReference {
  id: number;
  name: string;
  // Add other fields from CountryReference if needed
}

interface CompanyCertificate {
  id: number;
  company_id: string;
  certificate_id: string;
  certificate_name: string;
  upload_certificate: string | null;
  upload_certificate_path: string;
  // Add other fields
}

interface CompanyBankDetail {
  id: number;
  company_id: string;
  type: string | null;
  bank_account_number: string;
  bank_name: string;
  ifsc_code: string;
  verification_photo: string | null;
  // Add other fields
}

interface CompanyReference {
  id: number;
  person_name: string;
  company_id: string;
  number: string;
  remark: string;
  // Add other fields
}

interface OfficeInfo {
  id: number;
  company_id: string;
  office_type: string;
  office_name: string;
  country_id: string; // This might be number in a normalized schema, but JSON shows string for ID value "1"
  state: string;
  city: string;
  zip_code: string;
  gst_number: string;
  address: string;
  // Add other fields
}

interface CompanySpotVerification {
  id: number;
  company_id: string;
  verified_by_name: string;
  verified: boolean;
  remark: string;
  photo_upload: string | null;
  photo_upload_path: string;
  // Add other fields
}

interface BillingDocument {
  id: number;
  company_id: string;
  document_name: string;
  document: string | null; // Path to document
  // Add other fields
}

interface CompanyMemberManagement {
  id: number;
  company_id: string;
  member_id: string;
  designation: string;
  person_name: string;
  number: string;
  // Add other fields
}

interface TeamMember {
  id: number;
  company_id: string;
  team_name: string;
  designation: string;
  person_name: string;
  number: string;
  // Add other fields
}

export type CompanyItem = {
  id: number; // Changed to number based on JSON
  company_code: string | null;
  company_name: string;
  status:
    | "Verified"
    | "Non Verified"
    | "Active"
    | "Pending"
    | "Inactive"
    | "active"
    | "inactive"; // Extended to include new statuses
  primary_email_id: string;
  primary_contact_number: string;
  primary_contact_number_code: string;
  alternate_contact_number: string | null;
  alternate_contact_number_code: string | null;
  alternate_email_id: string | null;
  general_contact_number: string | null;
  general_contact_number_code: string | null;
  ownership_type: string; // Replaces 'type'
  owner_name: string; // Replaces 'company_owner'
  company_address: string;
  continent_id: string; // Store ID, actual object is in `continent`
  country_id: string; // Store ID, actual object is in `country`
  state: string;
  city: string;
  zip_code: string;
  gst_number: string | null;
  pan_number: string | null;
  trn_number: string | null;
  tan_number: string | null;
  establishment_year: string | null;
  no_of_employees: string | null;
  company_website: string | null;
  primary_business_type: string | null; // Replaces 'business_type'
  support_email: string | null;
  general_mobile: string | null;
  notification_email: string | null;
  kyc_verified: boolean; // Changed to boolean
  enable_billing: boolean; // Changed to boolean
  facebook_url: string | null;
  instagram_url: string | null;
  linkedIn_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  company_logo: string | null; // Replaces 'company_photo'
  primary_account_number: string | null;
  primary_bank_name: string | null;
  primary_ifsc_code: string | null;
  secondary_account_number: string | null;
  secondary_bank_name: string | null;
  secondary_ifsc_code: string | null;
  primary_bank_verification_photo: string | null;
  secondary_bank_verification_photo: string | null;
  "206AB_verified": string; // Consider renaming to valid JS identifier e.g. verified_206ab
  "206AB_remark": string | null; // Consider renaming
  "206AB_file": string | null; // Consider renaming
  ABCQ_verified: string;
  ABCQ_remark: string | null;
  ABCQ_file: string | null;
  office_photo_verified: boolean;
  office_photo_remark: string | null;
  office_photo_file: string | null;
  gst_certificate_verified: boolean;
  gst_certificate_remark: string | null;
  gst_certificate_file: string | null;
  authority_letter_verified: boolean;
  authority_letter_remark: string | null;
  authority_letter_file: string | null;
  visiting_card_verified: boolean;
  visiting_card_remark: string | null;
  visiting_card_file: string | null;
  cancel_cheque_verified: boolean;
  cancel_cheque_remark: string | null;
  cancel_cheque_file: string | null;
  aadhar_card_verified: boolean;
  aadhar_card_remark: string | null;
  aadhar_card_file: string | null;
  pan_card_verified: boolean;
  pan_card_remark: string | null;
  pan_card_file: string | null;
  other_document_verified: boolean;
  other_document_remark: string | null;
  other_document_file: string | null;
  created_at: string; // Replaces 'created_date'
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
  members_count: number; // Replaces 'total_members'
  teams_count: number;
  billing_enabled: boolean; // This seems to be a duplicate of enable_billing, check API response for correct field
  due_after_3_months_date: string;
  icon_full_path: string | null;
  meta_icon_full_path: string | null;
  billing_document_path: string[];
  brands_list: any[]; // Replaces 'brands'
  category_list: any[]; // Replaces 'category'
  profile_completion: number; // Replaces 'progress'

  created_by_user: UserReference | null;
  updated_by_user: UserReference | null;
  continent: ContinentReference; // Replaces string continent
  country: CountryReference; // Replaces string country
  domain: any | null;

  company_certificate: CompanyCertificate[];
  company_bank_details: CompanyBankDetail[];
  company_references: CompanyReference[];
  office_info: OfficeInfo[];
  company_spot_verification: CompanySpotVerification[];
  billing_documents: BillingDocument[];
  company_member_management: CompanyMemberManagement[];
  company_team_members: TeamMember[];

  // Optional fields from old CompanyItem, if still needed and not covered by new structure
  interested_in?: string;
  success_score?: number;
  trust_score?: number;
  health_score?: number; // Keep this one for ViewEngagementDialog
  wallCountDisplay?: string;

  // Fields from old structure that are now covered by new names - for reference during transition
  // name: string; (use company_name)
  // type: string; (use ownership_type)
  // category: string[]; (use category_list)
  // brands: string[]; (use brands_list)
  // progress: number; (use profile_completion)
  // company_photo?: string; (use company_logo or icon_full_path)
  // total_members?: number; (use members_count)
  // business_type: string; (use primary_business_type)
  // created_date: string; (use created_at)
  // company_owner?: string; (use owner_name)
  // company_contact_number?: string; (use primary_contact_number)
  // company_email?: string; (use primary_email_id)
};
// --- END: Detailed CompanyItem and Sub-types ---

// --- Zod Schema for Company Filter Form ---
const companyFilterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // filterBusinessType: z // primary_business_type is now a string, not array of objects. Update if needed.
  //   .array(z.object({ value: z.string(), label: z.string() }))
  //   .optional(),
  filterCompanyType: z // ownership_type
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterContinent: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCountry: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterState: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCity: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // filterInterestedIn: z // This field is not in the new JSON structure
  //   .array(z.object({ value: z.string(), label: z.string() }))
  //   .optional(),
  // filterBrand: z // brands_list is now an array, adjust if filter needed
  //   .array(z.object({ value: z.string(), label: z.string() }))
  //   .optional(),
  // filterCategory: z // category_list is now an array, adjust if filter needed
  //   .array(z.object({ value: z.string(), label: z.string() }))
  //   .optional(),
  filterKycVerified: z // kyc_verified is boolean, filter value is string "Yes"/"No"
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterEnableBilling: z // enable_billing is boolean, filter value is string "Yes"/"No"
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCreatedDate: z // created_at
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
});
type CompanyFilterFormData = z.infer<typeof companyFilterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter Utility for Companies ---
const COMPANY_CSV_HEADERS = [
  "ID",
  "Name",
  "Company Code",
  "Ownership Type", // Was Type
  "Status",
  "Primary Business Type", // Was Business Type
  "Country",
  "State",
  "City",
  "KYC Verified",
  "Billing Enabled",
  "Created Date", // created_at
  "Owner", // owner_name
  "Contact Number", // primary_contact_number
  "Email", // primary_email_id
  "Website",
  "GST",
  "PAN",
  "Brands", // brands_list
  "Categories", // category_list
];

type CompanyExportItem = {
  id: string; // ID is number in CompanyItem, but CSV might prefer string
  name: string; // company_name
  company_code: string;
  ownership_type: string;
  status: string;
  primary_business_type: string;
  country: string; // country.name
  state: string;
  city: string;
  kyc_verified: "Yes" | "No"; // From boolean
  enable_billing: "Yes" | "No"; // From boolean
  created_at: string;
  owner_name: string;
  primary_contact_number: string;
  primary_email_id: string;
  company_website: string;
  gst_number: string;
  pan_number: string;
  brands_list: string; // Transformed from array
  category_list: string; // Transformed from array
};

const COMPANY_CSV_KEYS: (keyof CompanyExportItem)[] = [
  "id",
  "name",
  "company_code",
  "ownership_type",
  "status",
  "primary_business_type",
  "country",
  "state",
  "city",
  "kyc_verified",
  "enable_billing",
  "created_at",
  "owner_name",
  "primary_contact_number",
  "primary_email_id",
  "company_website",
  "gst_number",
  "pan_number",
  "brands_list",
  "category_list",
];

function exportToCsv(filename: string, rows: CompanyItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }

  const transformedRows: CompanyExportItem[] = rows.map((row) => ({
    id: String(row.id) || "N/A",
    name: row.company_name || "N/A",
    company_code: row.company_code || "N/A",
    ownership_type: row.ownership_type || "N/A",
    status: row.status || "N/A",
    primary_business_type: row.primary_business_type || "N/A",
    country: row.country?.name || "N/A",
    state: row.state || "N/A",
    city: row.city || "N/A",
    kyc_verified: row.kyc_verified ? "Yes" : "No",
    enable_billing: row.enable_billing ? "Yes" : "No",
    created_at: row.created_at
      ? new Date(row.created_at).toLocaleDateString("en-GB")
      : "N/A",
    owner_name: row.owner_name || "N/A",
    primary_contact_number: row.primary_contact_number || "N/A",
    primary_email_id: row.primary_email_id || "N/A",
    company_website: row.company_website || "N/A",
    gst_number: row.gst_number || "N/A",
    pan_number: row.pan_number || "N/A",
    brands_list: Array.isArray(row.brands_list)
      ? row.brands_list.join(", ")
      : "N/A",
    category_list: Array.isArray(row.category_list)
      ? row.category_list.join(", ")
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    COMPANY_CSV_HEADERS.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return COMPANY_CSV_KEYS.map((k) => {
          let cell: any = row[k as keyof CompanyExportItem];
          if (cell === null || cell === undefined) {
            cell = "";
          } else {
            cell = String(cell).replace(/"/g, '""');
          }
          if (String(cell).search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      })
      .join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(
      <Notification title="Export Successful" type="success">
        Data exported to {filename}.
      </Notification>
    );
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

// --- Status Colors & Context ---
const companyStatusColors: Record<string, string> = {
  Active: "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
  Verified: "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
  // Verified: "bg-blue-200 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
  Pending: "border border-orange-300 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
  Inactive: "border border-red-300 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  // active: "border border-green-300 bg-green-300 text-green-600 dark:bg-green-500/20 dark:text-green-300",
  // inactive: "border border-red-300 bg-red-300 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  "Non Verified": "border border-yellow-300 bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300",
};
const getCompanyStatusClass = (statusValue?: CompanyItem["status"]): string => {
  if (!statusValue) return "bg-gray-200 text-gray-600";
  return companyStatusColors[statusValue] || "bg-gray-200 text-gray-600";
};
interface CompanyListStore {
  companyCount: {};
  companyList: CompanyItem[];
  selectedCompanies: CompanyItem[];
  CountriesData: any[]; // Consider typing this if structure is known
  ContinentsData: any[]; // Consider typing this if structure is known
  companyListTotal: number;
  setCompanyList: React.Dispatch<React.SetStateAction<CompanyItem[]>>;
  setSelectedCompanies: React.Dispatch<React.SetStateAction<CompanyItem[]>>;
  setCompanyListTotal: React.Dispatch<React.SetStateAction<number>>;
}
const CompanyListContext = React.createContext<CompanyListStore | undefined>(
  undefined
);
const useCompanyList = (): CompanyListStore => {
  const context = useContext(CompanyListContext);
  if (!context) {
    throw new Error("useCompanyList must be used within a CompanyListProvider");
  }
  return context;
};

const CompanyListProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { CompanyData, CountriesData, ContinentsData } =
    useSelector(masterSelector);
  const dispatch = useAppDispatch();

  const [companyList, setCompanyList] = useState<CompanyItem[]>(
    CompanyData?.data ?? []
  );
  const [companyCount, setCompanyCount] = useState(CompanyData?.counts ?? {});
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyItem[]>([]);
  const [companyListTotal, setCompanyListTotal] = useState<number>(
    CompanyData?.length ?? 0
  );

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
  }, [dispatch]);

  useEffect(() => {
    setCompanyCount(CompanyData?.counts ?? {});
    setCompanyList(CompanyData?.data ?? []);
    setCompanyListTotal(CompanyData?.data?.length ?? 0);
  }, [CompanyData]);

  useEffect(() => {
    dispatch(getCompanyAction());
  }, [dispatch]);

  return (
    <CompanyListContext.Provider
      value={{
        companyCount,
        companyList,
        setCompanyList,
        selectedCompanies,
        setSelectedCompanies,
        companyListTotal,
        setCompanyListTotal,
        ContinentsData: Array.isArray(ContinentsData) ? ContinentsData : [],
        CountriesData: Array.isArray(CountriesData) ? CountriesData : [],
      }}
    >
      {children}
    </CompanyListContext.Provider>
  );
};

// --- Child Components (Search, ActionTools) ---
const CompanyListSearch: React.FC<{
  onInputChange: (value: string) => void;
}> = ({ onInputChange }) => {
  return (
    <DebouceInput
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
};
const CompanyListActionTools = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button
        variant="solid"
        icon={<TbPlus className="text-lg" />}
        onClick={() => navigate("/business-entities/company-create")}
      >
        Add New
      </Button>
    </div>
  );
};

// ============================================================================
// --- MODALS SECTION ---
// ============================================================================

// --- Type Definitions for Modals ---
export type ModalType =
  | "email"
  | "whatsapp"
  | "notification"
  | "task"
  | "active"
  | "calendar"
  | "members"
  | "alert"
  | "trackRecord"
  | "engagement"
  | "transaction"
  | "document"
  | "viewDetail"; // ADDED viewDetail
export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data: CompanyItem | null;
}
interface CompanyModalsProps {
  modalState: ModalState;
  onClose: () => void;
}

// --- Helper Data for Modal Demos ---
const dummyUsers = [
  { value: "user1", label: "Alice Johnson" },
  { value: "user2", label: "Bob Williams" },
  { value: "user3", label: "Charlie Brown" },
];
const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const eventTypeOptions = [
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Follow-up Call" },
  { value: "deadline", label: "Project Deadline" },
];
const dummyMembers = [
  {
    id: "m1",
    name: "Eleanor Vance",
    role: "CEO",
    avatar: "/img/avatars/thumb-1.jpg",
  },
  {
    id: "m2",
    name: "Cedric Diggory",
    role: "CTO",
    avatar: "/img/avatars/thumb-2.jpg",
  },
  {
    id: "m3",
    name: "Frank Bryce",
    role: "Lead Developer",
    avatar: "/img/avatars/thumb-3.jpg",
  },
];
const dummyAlerts = [
  {
    id: 1,
    severity: "danger",
    message: "Invoice #INV-0012 is 30 days overdue.",
    time: "2 days ago",
  },
  {
    id: 2,
    severity: "warning",
    message: "Subscription ends in 7 days.",
    time: "5 days ago",
  },
];
const dummyTimeline = [
  {
    id: 1,
    icon: <TbMail />,
    title: "Email Sent",
    desc: "Sent Q4 proposal.",
    time: "2023-10-25",
  },
  {
    id: 2,
    icon: <TbCalendar />,
    title: "Meeting Scheduled",
    desc: "Discovery call with their tech lead.",
    time: "2023-10-20",
  },
  {
    id: 3,
    icon: <TbUser />,
    title: "Member Added",
    desc: "Jane Doe joined as a contact.",
    time: "2023-10-18",
  },
];
const dummyTransactions = [
  {
    id: "tx1",
    date: "2023-10-15",
    desc: "Invoice #INV-0012",
    amount: "$5,000.00",
    status: "Overdue",
  },
  {
    id: "tx2",
    date: "2023-09-20",
    desc: "Subscription Fee",
    amount: "$500.00",
    status: "Paid",
  },
];
const dummyDocs = [
  { id: "doc1", name: "Service_Agreement.pdf", type: "pdf", size: "2.5 MB" },
  { id: "doc2", name: "Onboarding_Kit.zip", type: "zip", size: "10.1 MB" },
];

// --- START: ViewCompanyDetailDialog ---
const ViewCompanyDetailDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  const renderDetailItem = (label: string, value: any, isHtml = false) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <div className="mb-3">
        <span className="font-semibold text-gray-700 dark:text-gray-200">
          {label}:{" "}
        </span>
        {isHtml ? (
          <span
            className="text-gray-600 dark:text-gray-400"
            dangerouslySetInnerHTML={{ __html: String(value) }}
          />
        ) : (
          <span className="text-gray-600 dark:text-gray-400">
            {String(value)}
          </span>
        )}
      </div>
    );
  };

  const renderVerificationStatus = (
    label: string,
    verified: boolean,
    remark?: string | null,
    file?: string | null
  ) => {
    return (
      <div className="mb-3 p-2 border rounded-md dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold">{label}: </span>
            {verified ? (
              <Tag prefix prefixClass="bg-emerald-500">
                Verified
              </Tag>
            ) : (
              <Tag prefix prefixClass="bg-red-500">
                Not Verified
              </Tag>
            )}
          </div>
          {file && (
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              View File
            </a>
          )}
        </div>
        {remark && (
          <p className="text-xs text-gray-500 mt-1">Remark: {remark}</p>
        )}
      </div>
    );
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={800}
    >
      <div className="max-h-[80vh] overflow-y-auto pr-4">
        <h4 className="mb-6">Company Details: {company.company_name}</h4>

        <Card className="mb-4" bordered>
          <h5 className="mb-2">Basic Information</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {renderDetailItem("Company Code", company.company_code)}
            {renderDetailItem("Ownership Type", company.ownership_type)}
            {renderDetailItem("Owner Name", company.owner_name)}
            {renderDetailItem(
              "Status",
              <Tag
                className={`${getCompanyStatusClass(
                  company.status
                )} capitalize`}
              >
                {company.status}
              </Tag>
            )}
            {renderDetailItem("Establishment Year", company.establishment_year)}
            {renderDetailItem("No. of Employees", company.no_of_employees)}
            {renderDetailItem(
              "Primary Business Type",
              company.primary_business_type
            )}
            {renderDetailItem(
              "Profile Completion",
              `${company.profile_completion}%`
            )}
          </div>
        </Card>

        <Card className="mb-4" bordered>
          <h5 className="mb-2">Contact Information</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {renderDetailItem("Primary Email", company.primary_email_id)}
            {renderDetailItem(
              "Primary Contact",
              `${company.primary_contact_number_code} ${company.primary_contact_number}`
            )}
            {renderDetailItem("Alternate Email", company.alternate_email_id)}
            {renderDetailItem(
              "Alternate Contact",
              company.alternate_contact_number
                ? `${company.alternate_contact_number_code} ${company.alternate_contact_number}`
                : "N/A"
            )}
            {renderDetailItem(
              "General Contact",
              company.general_contact_number
                ? `${company.general_contact_number_code} ${company.general_contact_number}`
                : "N/A"
            )}
            {renderDetailItem("Support Email", company.support_email)}
            {renderDetailItem("Notification Email", company.notification_email)}
            {renderDetailItem(
              "Website",
              company.company_website ? (
                <a
                  href={company.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {company.company_website}
                </a>
              ) : (
                "N/A"
              )
            )}
          </div>
        </Card>

        <Card className="mb-4" bordered>
          <h5 className="mb-2">Address & Location</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {renderDetailItem("Address", company.company_address)}
            {renderDetailItem("City", company.city)}
            {renderDetailItem("State", company.state)}
            {renderDetailItem("Zip Code", company.zip_code)}
            {renderDetailItem("Country", company.country?.name)}
            {renderDetailItem("Continent", company.continent?.name)}
          </div>
        </Card>

        <Card className="mb-4" bordered>
          <h5 className="mb-2">Legal & Financial</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {renderDetailItem("GST Number", company.gst_number)}
            {renderDetailItem("PAN Number", company.pan_number)}
            {renderDetailItem("TRN Number", company.trn_number)}
            {renderDetailItem("TAN Number", company.tan_number)}
            {renderDetailItem(
              "KYC Verified",
              company.kyc_verified ? (
                <MdCheckCircle className="text-green-500 text-xl inline-block" />
              ) : (
                <MdCancel className="text-red-500 text-xl inline-block" />
              )
            )}
            {renderDetailItem(
              "Billing Enabled",
              company.enable_billing ? (
                <MdCheckCircle className="text-green-500 text-xl inline-block" />
              ) : (
                <MdCancel className="text-red-500 text-xl inline-block" />
              )
            )}
            {renderDetailItem(
              "Billing Due Date",
              company.due_after_3_months_date
                ? new Date(company.due_after_3_months_date).toLocaleDateString()
                : "N/A"
            )}
          </div>
        </Card>

        {company.company_bank_details &&
          company.company_bank_details.length > 0 && (
            <Card className="mb-4" bordered>
              <h5 className="mb-2">Bank Details</h5>
              {company.company_bank_details.map((bank) => (
                <div
                  key={bank.id}
                  className="mb-3 p-2 border rounded-md dark:border-gray-600"
                >
                  {renderDetailItem("Bank Name", bank.bank_name)}
                  {renderDetailItem("Account Number", bank.bank_account_number)}
                  {renderDetailItem("IFSC Code", bank.ifsc_code)}
                  {renderDetailItem("Type", bank.type || "N/A")}
                  {bank.verification_photo &&
                    renderDetailItem(
                      "Verification Photo",
                      <a
                        href={bank.verification_photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline"
                      >
                        View Photo
                      </a>
                    )}
                </div>
              ))}
            </Card>
          )}

        <Card className="mb-4" bordered>
          <h5 className="mb-2">Document Verification Status</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {renderVerificationStatus(
              "Office Photo",
              company.office_photo_verified,
              company.office_photo_remark,
              company.office_photo_file
            )}
            {renderVerificationStatus(
              "GST Certificate",
              company.gst_certificate_verified,
              company.gst_certificate_remark,
              company.gst_certificate_file
            )}
            {renderVerificationStatus(
              "Authority Letter",
              company.authority_letter_verified,
              company.authority_letter_remark,
              company.authority_letter_file
            )}
            {renderVerificationStatus(
              "Visiting Card",
              company.visiting_card_verified,
              company.visiting_card_remark,
              company.visiting_card_file
            )}
            {renderVerificationStatus(
              "Cancel Cheque",
              company.cancel_cheque_verified,
              company.cancel_cheque_remark,
              company.cancel_cheque_file
            )}
            {renderVerificationStatus(
              "Aadhar Card",
              company.aadhar_card_verified,
              company.aadhar_card_remark,
              company.aadhar_card_file
            )}
            {renderVerificationStatus(
              "PAN Card",
              company.pan_card_verified,
              company.pan_card_remark,
              company.pan_card_file
            )}
            {/* Add 206AB and ABCQ if needed, handle key names */}
          </div>
        </Card>

        {company.office_info && company.office_info.length > 0 && (
          <Card className="mb-4" bordered>
            <h5 className="mb-2">Office Information</h5>
            {company.office_info.map((office) => (
              <div
                key={office.id}
                className="mb-3 p-2 border rounded-md dark:border-gray-600"
              >
                {renderDetailItem("Office Name", office.office_name)}
                {renderDetailItem("Office Type", office.office_type)}
                {renderDetailItem("Address", office.address)}
                {renderDetailItem("City", office.city)}
                {renderDetailItem("State", office.state)}
                {renderDetailItem("Zip Code", office.zip_code)}
                {renderDetailItem("GST Number", office.gst_number)}
              </div>
            ))}
          </Card>
        )}

        {company.company_certificate &&
          company.company_certificate.length > 0 && (
            <Card className="mb-4" bordered>
              <h5 className="mb-2">Certificates</h5>
              {company.company_certificate.map((cert) => (
                <div
                  key={cert.id}
                  className="mb-2 flex justify-between items-center"
                >
                  <span>
                    {cert.certificate_name} ({cert.certificate_id})
                  </span>
                  {cert.upload_certificate_path && (
                    <a
                      href={cert.upload_certificate_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      View Certificate
                    </a>
                  )}
                </div>
              ))}
            </Card>
          )}

        {/* Add more sections for:
            - company_references
            - company_spot_verification
            - billing_documents
            - company_member_management
            - company_team_members
            - social media links (facebook_url etc.)
            - created_by_user, updated_by_user
        */}
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};
// --- END: ViewCompanyDetailDialog ---

const CompanyModals: React.FC<CompanyModalsProps> = ({
  modalState,
  onClose,
}) => {
  const { type, data: company, isOpen } = modalState;
  if (!isOpen || !company) return null;

  const renderModalContent = () => {
    switch (type) {
      case "email":
        return <SendEmailDialog company={company} onClose={onClose} />;
      case "whatsapp":
        return <SendWhatsAppDialog company={company} onClose={onClose} />;
      case "notification":
        return <AddNotificationDialog company={company} onClose={onClose} />;
      case "calendar":
        return <AddScheduleDialog company={company} onClose={onClose} />;
      case "task":
        return <AssignTaskDialog company={company} onClose={onClose} />;
      case "members":
        return <ViewMembersDialog company={company} onClose={onClose} />; // This might need update based on new company_member_management
      case "alert":
        return <ViewAlertDialog company={company} onClose={onClose} />;
      case "trackRecord":
        return <TrackRecordDialog company={company} onClose={onClose} />;
      case "engagement":
        return <ViewEngagementDialog company={company} onClose={onClose} />;
      case "transaction":
        return <ViewTransactionDialog company={company} onClose={onClose} />;
      case "document":
        return <DownloadDocumentDialog company={company} onClose={onClose} />; // This might relate to billing_documents or company_certificate
      case "viewDetail": // ADDED
        return <ViewCompanyDetailDialog company={company} onClose={onClose} />;
      default:
        return (
          <GenericActionDialog
            type={type}
            company={company}
            onClose={onClose}
          />
        );
    }
  };
  return <>{renderModalContent()}</>;
};

// --- Individual Dialog Components (SendEmailDialog, etc. remain mostly the same, but company.name would be company.company_name) ---
const SendEmailDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { subject: "", message: "" },
  });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true);
    console.log(
      "Sending email to",
      company.primary_email_id,
      "with data:",
      data
    ); // Updated to primary_email_id
    setTimeout(() => {
      toast.push(
        <Notification type="success" title="Email Sent Successfully" />
      );
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send Email to {company.company_name}</h5>{" "}
      {/* Updated to company_name */}
      <form onSubmit={handleSubmit(onSendEmail)}>
        <FormItem label="Subject">
          <Controller
            name="subject"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormItem>
        <FormItem label="Message">
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <RichTextEditor value={field.value} onChange={field.onChange} />
            )}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading}>
            Send
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const SendWhatsAppDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      message: `Hi ${company.company_name}, following up on our conversation.`, // Updated
    },
  });
  const onSendMessage = (data: { message: string }) => {
    setIsLoading(true);
    const phone = company.primary_contact_number?.replace(/\D/g, ""); // Updated
    if (!phone) {
      toast.push(<Notification type="danger" title="Invalid Phone Number" />);
      setIsLoading(false);
      return;
    }
    // Assuming primary_contact_number_code is like "+91" and phone is "9876543210"
    // WhatsApp typically needs the full number including country code without '+'
    const fullPhone = `${company.primary_contact_number_code?.replace(
      "+",
      ""
    )}${phone}`;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(
      data.message
    )}`;
    window.open(url, "_blank");
    toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
    setIsLoading(false);
    onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send WhatsApp to {company.company_name}</h5>{" "}
      {/* Updated */}
      <form onSubmit={handleSubmit(onSendMessage)}>
        <FormItem label="Message Template">
          <Controller
            name="message"
            control={control}
            render={({ field }) => <Input textArea {...field} rows={4} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading}>
            Open WhatsApp
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

// ... (AddNotificationDialog, AssignTaskDialog, AddScheduleDialog to be updated similarly if they use company.name)
// For brevity, I'll assume similar updates for company.company_name in other dialog titles.
// ViewMembersDialog, ViewAlertDialog, TrackRecordDialog, ViewEngagementDialog,
// ViewTransactionDialog, DownloadDocumentDialog would need to be updated to use
// the new detailed fields from CompanyItem if their dummy data is replaced by real data.
// E.g., ViewMembersDialog would use company.company_member_management or company.company_team_members

const AddNotificationDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  /* ... uses company.company_name ... */ return (
    <Dialog isOpen={true}>
      <h5 className="mb-4">Add Notification for {company.company_name}</h5>{" "}
      {/* ...rest of the dialog... */}{" "}
    </Dialog>
  );
};
const AssignTaskDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  /* ... uses company.company_name ... */ return (
    <Dialog isOpen={true}>
      <h5 className="mb-4">Assign Task for {company.company_name}</h5>{" "}
      {/* ...rest of the dialog... */}{" "}
    </Dialog>
  );
};
const AddScheduleDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  /* ... uses company.company_name ... */ return (
    <Dialog isOpen={true}>
      <h5 className="mb-4">Add Schedule for {company.company_name}</h5>{" "}
      {/* ...rest of the dialog... */}{" "}
    </Dialog>
  );
};
const ViewMembersDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  // TODO: Update to use company.company_member_management or company.company_team_members
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Members of {company.company_name}</h5>
      {/* Replace dummyMembers with actual data from company object */}
      <div className="mt-4 flex flex-col gap-4">
        {company.company_team_members &&
        company.company_team_members.length > 0 ? (
          company.company_team_members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <Avatar shape="circle" icon={<TbUserCircle />} />
                <div>
                  <div className="font-semibold">{member.person_name}</div>
                  <div className="text-xs text-gray-500">
                    {member.designation} ({member.team_name})
                  </div>
                </div>
              </div>
              <Button size="xs">View Profile</Button>{" "}
              {/* This might be a future feature */}
            </div>
          ))
        ) : (
          <p>No team members listed.</p>
        )}
      </div>
      <div className="text-right mt-6">
        {" "}
        <Button variant="solid" onClick={onClose}>
          {" "}
          Close{" "}
        </Button>{" "}
      </div>
    </Dialog>
  );
};
const ViewAlertDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  /* ... uses company.company_name ... */ return (
    <Dialog isOpen={true}>
      <h5 className="mb-4">Alerts for {company.company_name}</h5>{" "}
      {/* ...rest of the dialog... */}{" "}
    </Dialog>
  );
};
const TrackRecordDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  /* ... uses company.company_name ... */ return (
    <Dialog isOpen={true}>
      <h5 className="mb-4">Track Record for {company.company_name}</h5>{" "}
      {/* ...rest of the dialog... */}{" "}
    </Dialog>
  );
};
const ViewEngagementDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  /* ... uses company.company_name ... */ return (
    <Dialog isOpen={true}>
      <h5 className="mb-4">Engagement for {company.company_name}</h5>{" "}
      {/* ...rest of the dialog... */}{" "}
    </Dialog>
  );
};
const ViewTransactionDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  /* ... uses company.company_name ... */ return (
    <Dialog isOpen={true}>
      <h5 className="mb-4">Transactions for {company.company_name}</h5>{" "}
      {/* ...rest of the dialog... */}{" "}
    </Dialog>
  );
};
const DownloadDocumentDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  // TODO: Update to use company.billing_documents or company.company_certificate
  const iconMap: Record<string, React.ReactElement> = {
    pdf: <TbFileText className="text-red-500" />,
    zip: <TbFileZip className="text-amber-500" />,
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Documents for {company.company_name}</h5>
      <div className="flex flex-col gap-3 mt-4">
        {company.billing_documents &&
          company.billing_documents.map((doc) => (
            <div
              key={doc.id}
              className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                {React.cloneElement(iconMap["pdf"] || <TbClipboardText />, {
                  size: 28,
                })}{" "}
                {/* Assuming PDF for now */}
                <div>
                  <p className="font-semibold text-sm">{doc.document_name}</p>
                  {/* <p className="text-xs text-gray-400">{doc.size}</p> File size not available in new structure */}
                </div>
              </div>
              {doc.document && (
                <Tooltip title="Download">
                  <a
                    href={doc.document}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button shape="circle" size="sm" icon={<TbDownload />} />
                  </a>
                </Tooltip>
              )}
            </div>
          ))}
        {company.company_certificate &&
          company.company_certificate.map((cert) => (
            <div
              key={cert.id}
              className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                {React.cloneElement(iconMap["pdf"] || <TbClipboardText />, {
                  size: 28,
                })}{" "}
                {/* Assuming PDF */}
                <div>
                  <p className="font-semibold text-sm">
                    {cert.certificate_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    ID: {cert.certificate_id}
                  </p>
                </div>
              </div>
              {cert.upload_certificate_path && (
                <Tooltip title="Download">
                  <a
                    href={cert.upload_certificate_path}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button shape="circle" size="sm" icon={<TbDownload />} />
                  </a>
                </Tooltip>
              )}
            </div>
          ))}
        {company.billing_documents?.length === 0 &&
          company.company_certificate?.length === 0 && (
            <p>No documents available.</p>
          )}
      </div>
      <div className="text-right mt-6">
        {" "}
        <Button onClick={onClose}>Close</Button>{" "}
      </div>
    </Dialog>
  );
};

const GenericActionDialog: React.FC<{
  type: ModalType | null;
  company: CompanyItem;
  onClose: () => void;
}> = ({ type, company, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type
    ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}`
    : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true);
    console.log(
      `Performing action '${type}' for company ${company.company_name}`
    ); // Updated
    setTimeout(() => {
      toast.push(<Notification type="success" title="Action Completed" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-2">{title}</h5>
      <p>
        Are you sure you want to perform this action for{" "}
        <span className="font-semibold">{company.company_name}</span>?{" "}
        {/* Updated */}
      </p>
      <div className="text-right mt-6">
        <Button className="mr-2" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isLoading}>
          Confirm
        </Button>
      </div>
    </Dialog>
  );
};

// --- CompanyActionColumn Component ---
const CompanyActionColumn = ({
  rowData,
  onEdit,
  onOpenModal, // Changed from onViewDetail
}: {
  rowData: CompanyItem;
  onEdit: (id: number) => void; // id is now number
  onOpenModal: (type: ModalType, data: CompanyItem) => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600"
          role="button"
          onClick={() => onEdit(rowData.id)}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600"
          role="button"
          onClick={() => onOpenModal("viewDetail", rowData)} // MODIFIED
        >
          <TbEye />
        </div>
      </Tooltip>
      <Dropdown
        renderTitle={
          <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
        }
      >
        {/* ... other dropdown items ... */}
        <Dropdown.Item
          onClick={() => onOpenModal("email", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbMail size={18} /> <span className="text-xs">Send Email</span>{" "}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("whatsapp", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbBrandWhatsapp size={18} />{" "}
          <span className="text-xs">Send Whatsapp</span>{" "}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("notification", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbBell size={18} />{" "}
          <span className="text-xs">Add Notification</span>{" "}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("task", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbUser size={18} /> <span className="text-xs">Assign Task</span>{" "}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("calendar", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbCalendarEvent size={18} />{" "}
          <span className="text-xs">Add Schedule</span>{" "}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("active", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbTagStarred size={18} />{" "}
          <span className="text-xs">Add Active</span>{" "}
        </Dropdown.Item>

        <Dropdown.Item
          onClick={() => onOpenModal("members", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbUsersGroup size={18} />{" "}
          <span className="text-xs">View Members</span>{" "}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("alert", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbAlarm size={18} /> <span className="text-xs">View Alert</span>{" "}
        </Dropdown.Item>
        {/* <Dropdown.Item
          onClick={() => onOpenModal("trackRecord", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbFileSearch size={18} />{" "}
          <span className="text-xs">Track Record</span>{" "}
        </Dropdown.Item> */}
        {/* <Dropdown.Item
          onClick={() => onOpenModal("engagement", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbUserSearch size={18} /> <span className="text-xs">Engagement</span>{" "}
        </Dropdown.Item> */}
        <Dropdown.Item
          onClick={() => onOpenModal("transaction", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbReceipt size={18} />{" "}
          <span className="text-xs">View Transaction</span>{" "}
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("document", rowData)}
          className="flex items-center gap-2"
        >
          {" "}
          <TbDownload size={18} />{" "}
          <span className="text-xs">Download Document</span>{" "}
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const CompanyListTable = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    companyList,
    // selectedCompanies, // This is already in context
    setSelectedCompanies,
    companyCount,
    ContinentsData,
    CountriesData,
  } = useCompanyList();
  const [isLoading, setIsLoading] = useState(false); // Consider connecting to Redux loading state
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<CompanyFilterFormData>({
    filterCreatedDate: [null, null],
  });

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const handleOpenModal = (type: ModalType, companyData: CompanyItem) =>
    setModalState({ isOpen: true, type, data: companyData });
  const handleCloseModal = () =>
    setModalState({ isOpen: false, type: null, data: null });

  const filterFormMethods = useForm<CompanyFilterFormData>({
    resolver: zodResolver(companyFilterFormSchema),
    defaultValues: filterCriteria,
  });
  useEffect(() => {
    filterFormMethods.reset(filterCriteria);
  }, [filterCriteria, filterFormMethods]);

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setFilterDrawerOpen(true);
  };
  const onApplyFiltersSubmit = (data: CompanyFilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 });
    setFilterDrawerOpen(false);
  };
  const onClearFilters = () => {
    const defaultFilters = {
      filterCreatedDate: [null, null] as [Date | null, Date | null],
      filterStatus: [],
      // filterBusinessType: [],
      filterCompanyType: [],
      filterContinent: [],
      filterCountry: [],
      filterState: [],
      filterCity: [],
      // filterInterestedIn: [],
      // filterBrand: [],
      // filterCategory: [],
      filterKycVerified: [],
      filterEnableBilling: [],
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let filteredData = [...companyList];

    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterStatus.map((s) => s.value);
      filteredData = filteredData.filter((company) =>
        selectedStatuses.includes(company.status)
      );
    }
    if (
      filterCriteria.filterCompanyType &&
      filterCriteria.filterCompanyType.length > 0
    ) {
      const selectedTypes = filterCriteria.filterCompanyType.map(
        (t) => t.value
      );
      filteredData = filteredData.filter((company) =>
        selectedTypes.includes(company.ownership_type)
      );
    }
    if (
      filterCriteria.filterContinent &&
      filterCriteria.filterContinent.length > 0
    ) {
      const selectedContinents = filterCriteria.filterContinent.map(
        (c) => c.value
      );
      filteredData = filteredData.filter(
        (company) =>
          company.continent &&
          selectedContinents.includes(company.continent.name)
      );
    }
    if (
      filterCriteria.filterCountry &&
      filterCriteria.filterCountry.length > 0
    ) {
      const selectedCountries = filterCriteria.filterCountry.map(
        (c) => c.value
      );
      filteredData = filteredData.filter(
        (company) =>
          company.country && selectedCountries.includes(company.country.name)
      );
    }
    if (filterCriteria.filterState && filterCriteria.filterState.length > 0) {
      const selectedStates = filterCriteria.filterState.map((s) => s.value);
      filteredData = filteredData.filter((company) =>
        selectedStates.includes(company.state)
      );
    }
    if (filterCriteria.filterCity && filterCriteria.filterCity.length > 0) {
      const selectedCities = filterCriteria.filterCity.map((c) => c.value);
      filteredData = filteredData.filter((company) =>
        selectedCities.includes(company.city)
      );
    }
    if (
      filterCriteria.filterKycVerified &&
      filterCriteria.filterKycVerified.length > 0
    ) {
      const selectedKycValues = filterCriteria.filterKycVerified.map(
        (k) => k.value === "Yes"
      );
      filteredData = filteredData.filter((company) =>
        selectedKycValues.includes(company.kyc_verified)
      );
    }
    if (
      filterCriteria.filterEnableBilling &&
      filterCriteria.filterEnableBilling.length > 0
    ) {
      const selectedBillingValues = filterCriteria.filterEnableBilling.map(
        (b) => b.value === "Yes"
      );
      filteredData = filteredData.filter((company) =>
        selectedBillingValues.includes(company.enable_billing)
      );
    }
    if (
      filterCriteria.filterCreatedDate &&
      filterCriteria.filterCreatedDate[0] &&
      filterCriteria.filterCreatedDate[1]
    ) {
      const [startDate, endDate] = filterCriteria.filterCreatedDate;
      const inclusiveEndDate = new Date(endDate as Date);
      inclusiveEndDate.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter((company) => {
        const createdDate = new Date(company.created_at);
        return (
          createdDate >= (startDate as Date) && createdDate <= inclusiveEndDate
        );
      });
    }

    if (tableData.query) {
      filteredData = filteredData.filter((i) =>
        Object.values(i).some((v) => {
          if (typeof v === "object" && v !== null) {
            // Handle nested objects like country, continent
            return Object.values(v).some((nestedV) =>
              String(nestedV)
                .toLowerCase()
                .includes(tableData.query.toLowerCase())
            );
          }
          return String(v)
            .toLowerCase()
            .includes(tableData.query.toLowerCase());
        })
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        let av = a[key as keyof CompanyItem] as any;
        let bv = b[key as keyof CompanyItem] as any;

        // Handle nested properties for sorting (e.g., country.name)
        if (key.includes(".")) {
          const keys = key.split(".");
          av = keys.reduce(
            (obj, k) => (obj && obj[k] !== "undefined" ? obj[k] : undefined),
            a
          );
          bv = keys.reduce(
            (obj, k) => (obj && obj[k] !== "undefined" ? obj[k] : undefined),
            b
          );
        }

        av = av ?? "";
        bv = bv ?? "";

        if (typeof av === "string" && typeof bv === "string") {
          return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        if (typeof av === "number" && typeof bv === "number") {
          return order === "asc" ? av - bv : bv - av;
        }
        if (typeof av === "boolean" && typeof bv === "boolean") {
          return order === "asc"
            ? av === bv
              ? 0
              : av
              ? -1
              : 1
            : av === bv
            ? 0
            : av
            ? 1
            : -1;
        }
        return 0;
      });
    }

    const pI = tableData.pageIndex as number;
    const pS = tableData.pageSize as number;
    return {
      pageData: filteredData.slice((pI - 1) * pS, pI * pS),
      total: filteredData.length,
      allFilteredAndSortedData: filteredData,
    };
  }, [companyList, tableData, filterCriteria]);

  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(
        <Notification title="No Data" type="info">
          {" "}
          Nothing to export.{" "}
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Companies";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `companies_export_${timestamp}.csv`;
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: moduleName,
          file_name: fileName,
        })
      ).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );
      exportToCsv(fileName, allFilteredAndSortedData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Failed to Submit Reason"
          type="danger"
          message={error.message}
        />
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const handleEditCompany = (
    id: number // id is now number
  ) => navigate(`/business-entities/company-edit/${id}`);

  // This function is now replaced by handleOpenModal for view action
  // const handleViewCompanyDetails = (id: number) =>
  //   handleOpenModal('viewDetail', companyList.find(c => c.id === id) as CompanyItem);

  const handleSetTableData = useCallback(
    (d: Partial<TableQueries>) => setTableData((p) => ({ ...p, ...d })),
    []
  );
  const handlePaginationChange = useCallback(
    (p: number) => handleSetTableData({ pageIndex: p }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (v: number) => handleSetTableData({ pageSize: v, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (s: OnSortParam) => handleSetTableData({ sort: s, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (c: boolean, r: CompanyItem) =>
      setSelectedCompanies((p) =>
        c ? [...p, r] : p.filter((i) => i.id !== r.id)
      ),
    [setSelectedCompanies]
  );
  const handleAllRowSelect = useCallback(
    (c: boolean, r: Row<CompanyItem>[]) =>
      setSelectedCompanies(c ? r.map((i) => i.original) : []),
    [setSelectedCompanies]
  );

  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageToView(null);
  };
  const openImageViewer = (imageUrl: string | null) => {
    if (imageUrl) {
      setImageToView(imageUrl);
      setImageViewerOpen(true);
    }
  };

  const columns: ColumnDef<CompanyItem>[] = useMemo(
    () => [
      {
        header: "Company Info",
        accessorKey: "company_name", // UPDATED
        size: 220,
        cell: ({ row }) => {
          const {
            company_name,
            ownership_type,
            primary_business_type,
            country,
            city,
            state,
            company_logo,
            company_code,
          } = row.original;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Avatar
                  src={company_logo ? `https://aazovo.codefriend.in/${company_logo}` : undefined} // UPDATED src logic
                  size="sm"
                  shape="circle"
                  className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                  onClick={() => company_logo && openImageViewer(company_logo)}
                  icon={<TbUserCircle />}
                />
                <div>
                  <h6 className="text-xs font-semibold"><em className="text-blue-600">{company_code || "Company Code"}</em></h6>
                  <span className="text-xs font-semibold leading-1">{company_name}</span>
                </div>
              </div>
              <span className="text-xs mt-1">
                <b>Ownership Type:</b> {ownership_type|| "N/A"}
              </span>
              <span className="text-xs mt-1">
                <b>Primary Business Type:</b> {primary_business_type || "N/A"}
              </span>
              <div className="text-xs text-gray-500">
                {city}, {state}, {country?.name || "N/A"}{" "}
                {/* UPDATED country access */}
              </div>
            </div>
          );
        },
      },
      {
        header: "Contact",
        accessorKey: "owner_name", // UPDATED
        size: 180,
        cell: (props) => {
          const {
            owner_name,
            primary_contact_number,
            primary_email_id,
            company_website,
            primary_contact_number_code,
          } = props.row.original;
          return (
            <div className="text-xs flex flex-col gap-0.5">
              {owner_name && (
                <span>
                  <b>Owner: </b> {owner_name}
                </span>
              )}
              {primary_contact_number && (
                <span>
                  {primary_contact_number_code} {primary_contact_number}
                </span>
              )}
              {primary_email_id && (
                <a
                  href={`mailto:${primary_email_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {primary_email_id}
                </a>
              )}
              {company_website && (
                <a
                  href={company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {company_website}
                </a>
              )}
            </div>
          );
        },
      },
      {
        header: "Legal IDs & Status",
        accessorKey: "status", // Keep status for sorting
        size: 180,
        cell: ({ row }) => {
          const { gst_number, pan_number, status } = row.original;
          return (
            <div className="flex flex-col gap-0.5 text-[11px]">
              {gst_number && <div><b>GST:</b> <span className="break-all">{gst_number}</span></div>}
              {pan_number && <div><b>PAN:</b> <span className="break-all">{pan_number}</span></div>}
              <Tag className={`${getCompanyStatusClass(status)} capitalize mt-1 self-start !text-[11px] px-2 py-1`}>
                {status}
              </Tag>
            </div>
          );
        },
      },
      {
        header: "Profile & Scores",
        accessorKey: "profile_completion", // UPDATED
        size: 190,
        cell: ({ row }) => {
          const { members_count = 0, teams_count = 0, profile_completion = 0, kyc_verified, enable_billing, due_after_3_months_date } = row.original;
          const formattedDate = due_after_3_months_date
            ? `${new Date(due_after_3_months_date).getDate()} 
              ${new Date(due_after_3_months_date).toLocaleString("en-US", { month: "short" })}, 
              ${new Date(due_after_3_months_date).getFullYear()}`
            : "N/A";
          return (
            <div className="flex flex-col gap-1 text-xs">
              <span><b>Members:</b> {members_count}</span>
              <span><b>Teams:</b> {teams_count}</span>
              <div className="flex gap-1 items-center">
                <b>KYC Verified:</b>
                <Tooltip title={`KYC: ${kyc_verified ? "Yes" : "No"}`}>
                  {kyc_verified ? (
                    <MdCheckCircle className="text-green-500 text-lg" />
                  ) : (
                    <MdCancel className="text-red-500 text-lg" />
                  )}
                </Tooltip>
              </div>
              <div className="flex gap-1 items-center">
                <b>Billing:</b>
                <Tooltip title={`Billing: ${enable_billing ? "Yes" : "No"}`}>
                  {enable_billing ? (
                    <MdCheckCircle className="text-green-500 text-lg" />
                  ) : (
                    <MdCancel className="text-red-500 text-lg" />
                  )}
                </Tooltip>
              </div>
              <span>
                <b>Billing Due:</b> 
                {/* {due_after_3_months_date ? 
                new Date(due_after_3_months_date).toLocaleDateString("en-GB", 
                { day: "numeric", month: "short", year: "numeric" }).replace(/ /g, "/") : "N/A"} */}
                {formattedDate}
              </span>
              <Tooltip title={`Profile Completion ${profile_completion}%`}>
                <div className="h-2.5 w-full rounded-full bg-gray-300">
                  <div
                    className="rounded-full h-2.5 bg-blue-500"
                    style={{ width: `${profile_completion}%` }}
                  ></div>
                </div>
              </Tooltip>
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center" },
        size: 80,
        cell: (props) => (
          <CompanyActionColumn
            rowData={props.row.original}
            onEdit={handleEditCompany}
            onOpenModal={handleOpenModal} // UPDATED
          />
        ),
      },
    ],
    [handleOpenModal, openImageViewer] // Added openImageViewer dependency
  );

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.status)))
        .filter(Boolean)
        .map((s) => ({ value: s, label: s })),
    [companyList]
  );

  const companyTypeOptions = useMemo(
    // ownership_type
    () =>
      Array.from(new Set(companyList.map((c) => c.ownership_type)))
        .filter(Boolean)
        .map((ct) => ({ value: ct, label: ct })),
    [companyList]
  );

  const continentOptions = useMemo(
    () => ContinentsData.map((co) => ({ value: co.name, label: co.name })),
    [ContinentsData]
  );

  const countryOptions = useMemo(
    () => CountriesData.map((ct) => ({ value: ct.name, label: ct.name })),
    [CountriesData]
  );

  const stateOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.state)))
        .filter(Boolean)
        .map((st) => ({ value: st, label: st })),
    [companyList]
  );
  const cityOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.city)))
        .filter(Boolean)
        .map((ci) => ({ value: ci, label: ci })),
    [companyList]
  );
  const kycOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];
  const billingOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];
  const { DatePickerRange } = DatePicker;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h5>Company</h5>
        <CompanyListActionTools />
      </div>
      {/* Count Cards - Assumes companyCount keys match the new detailed structure if backend sends them */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-4 gap-2">
        <Card
          bodyClass="flex gap-2 p-1"
          className="rounded-md border border-blue-200"
        >
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
            {" "}
            <TbBuilding size={16} />{" "}
          </div>
          <div className="flex flex-col gap-0">
            {" "}
            <b className="text-sm ">{companyCount?.total ?? 0}</b>{" "}
            <span className="text-[9px] font-semibold">Total</span>{" "}
          </div>
        </Card>
        <Card
          bodyClass="flex gap-2 p-1"
          className="rounded-md border border-green-200"
        >
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500">
            {" "}
            <TbBuildingBank size={16} />{" "}
          </div>
          <div className="flex flex-col gap-0">
            {" "}
            <b className="text-sm pb-0 mb-0">
              {companyCount?.active ??
                companyList.filter(
                  (c) => c.status === "Active" || c.status === "active"
                ).length}
            </b>{" "}
            <span className="text-[9px] font-semibold">Active</span>{" "}
          </div>
        </Card>
        <Card
          bodyClass="flex gap-2 p-1"
          className="rounded-md border border-red-200"
        >
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500">
            {" "}
            <TbCancel size={16} />{" "}
          </div>
          <div className="flex flex-col gap-0">
            {" "}
            <b className="text-sm pb-0 mb-0">
              {companyCount?.disable ??
                companyList.filter(
                  (c) => c.status === "Inactive" || c.status === "inactive"
                ).length}
            </b>{" "}
            <span className="text-[9px] font-semibold">Disabled</span>{" "}
          </div>
        </Card>
        <Card
          bodyClass="flex gap-2 p-1"
          className="rounded-md border border-emerald-200"
        >
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500">
            {" "}
            <TbCircleCheck size={16} />{" "}
          </div>
          <div className="flex flex-col gap-0">
            {" "}
            <b className="text-sm pb-0 mb-0">
              {companyCount?.verified ??
                companyList.filter((c) => c.status === "Verified").length}
            </b>{" "}
            <span className="text-[9px] font-semibold">Verified</span>{" "}
          </div>
        </Card>
        <Card
          bodyClass="flex gap-2 p-1"
          className="rounded-md border border-yellow-200"
        >
          {" "}
          {/* Changed color for Non Verified */}
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-yellow-100 text-yellow-500">
            {" "}
            <TbCircleX size={16} />{" "}
          </div>
          <div className="flex flex-col gap-0">
            {" "}
            <b className="text-sm pb-0 mb-0">
              {companyCount?.unverified ??
                companyList.filter((c) => c.status === "Non Verified").length}
            </b>{" "}
            <span className="text-[9px] font-semibold">Non Verified</span>{" "}
          </div>
        </Card>
        <Card
          bodyClass="flex gap-2 p-1"
          className="rounded-md border border-violet-200"
        >
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
            {" "}
            <TbShieldCheck size={16} />{" "}
          </div>
          <div className="flex flex-col gap-0">
            {" "}
            <b className="text-sm pb-0 mb-0">
              {companyCount?.registered ?? 0}
            </b>{" "}
            <span className="text-[9px] font-semibold">Eligible</span>{" "}
          </div>
        </Card>
        <Card
          bodyClass="flex gap-2 p-1"
          className="rounded-md border border-red-200"
        >
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500">
            {" "}
            <TbShieldX size={16} />{" "}
          </div>
          <div className="flex flex-col gap-0">
            {" "}
            <b className="text-sm pb-0 mb-0">
              {companyCount?.unregistered ?? 0}
            </b>{" "}
            <span className="text-[9px] font-semibold">Not Eligible</span>{" "}
          </div>
        </Card>
        <Card
          bodyClass="flex gap-2 p-1"
          className="rounded-md border border-orange-200"
        >
          <div className="h-8 w-8 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
            {" "}
            <TbBuildingCommunity size={16} />{" "}
          </div>
          <div className="flex flex-col gap-0">
            {" "}
            <b className="text-sm pb-0 mb-0">
              {companyCount?.members ?? 0}
            </b>{" "}
            <span className="text-[9px] font-semibold">Members</span>{" "}
          </div>
        </Card>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <CompanyListSearch
          onInputChange={(val) =>
            handleSetTableData({ query: val, pageIndex: 1 })
          }
        />
        <div className="flex gap-2">
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>
            {" "}
            Filter{" "}
          </Button>
          <Button
            icon={<TbCloudUpload />}
            onClick={handleOpenExportReasonModal}
            disabled={
              !allFilteredAndSortedData || allFilteredAndSortedData.length === 0
            }
          >
            {" "}
            Export{" "}
          </Button>
        </div>
      </div>
      <Dialog
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        onRequestClose={closeImageViewer}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        width={600}
      >
        <div className="flex justify-center items-center p-4">
          {imageToView ? (
            <img
              src={`https://aazovo.codefriend.in/${imageToView}`}
              alt="Company Logo Full View"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          ) : (
            <p>No image to display.</p>
          )}
        </div>
      </Dialog>
      <DataTable
        selectable
        columns={columns}
        data={pageData}
        noData={pageData.length === 0} // Corrected noData condition
        loading={isLoading}
        pagingData={{
          total,
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={handleRowSelect}
        onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      <Drawer
        title="Company Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              {" "}
              Clear All{" "}
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="filterCompanyForm"
              type="submit"
            >
              {" "}
              Apply{" "}
            </Button>{" "}
          </div>
        }
      >
        <UiForm
          id="filterCompanyForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
        >
          <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2">
            <UiFormItem label="Status">
              <Controller
                name="filterStatus"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={statusOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Ownership Type">
              {" "}
              {/* Was Company Type */}
              <Controller
                name="filterCompanyType"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Type"
                    options={companyTypeOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Continent">
              <Controller
                name="filterContinent"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Continent"
                    options={continentOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Country">
              <Controller
                name="filterCountry"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Country"
                    options={countryOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="State">
              <Controller
                name="filterState"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select State"
                    options={stateOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="City">
              <Controller
                name="filterCity"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select City"
                    options={cityOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="KYC Verified">
              <Controller
                name="filterKycVerified"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={kycOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Enable Billing">
              <Controller
                name="filterEnableBilling"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={billingOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Created Date" className="col-span-2">
              <Controller
                name="filterCreatedDate"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <DatePickerRange
                    placeholder="Select Date Range"
                    value={field.value as [Date | null, Date | null]}
                    onChange={field.onChange}
                  />
                )}
              />
            </UiFormItem>
          </div>
        </UiForm>
      </Drawer>
      <CompanyModals modalState={modalState} onClose={handleCloseModal} />
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(
          handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <UiForm
          id="exportReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <UiFormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={
              exportReasonFormMethods.formState.errors.reason?.message
            }
          >
            <Controller
              name="reason"
              control={exportReasonFormMethods.control}
              render={({ field }) => (
                <Input
                  textArea
                  {...field}
                  placeholder="Enter reason..."
                  rows={3}
                />
              )}
            />
          </UiFormItem>
        </UiForm>
      </ConfirmDialog>
    </>
  );
};

const CompanyListSelected = () => {
  const { selectedCompanies, setSelectedCompanies } = useCompanyList();
  const dispatch = useAppDispatch();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = async () => {
    if (!selectedCompanies) return;
    setIsDeleting(true);
    try {
      const ids = selectedCompanies.map((d) => String(d.id)); // Ensure IDs are strings
      await dispatch(deleteAllcompanyAction({ ids: ids.join(",") })).unwrap(); // Send as comma-separated string
      toast.push(<Notification title="Company Deleted" type="success" />);
      dispatch(getCompanyAction()); // Refresh list
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger">
          {" "}
          {error.message}{" "}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setSelectedCompanies([]);
      setDeleteConfirmationOpen(false);
    }
  };
  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Message Sent" />);
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedCompanies([]);
    }, 500);
  };
  if (selectedCompanies.length === 0) return null;
  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="container mx-auto flex items-center justify-between">
          <span>
            <span className="flex items-center gap-2">
              {" "}
              <TbChecks className="text-lg text-primary-600" />{" "}
              <span className="font-semibold">
                {selectedCompanies.length} Companies selected
              </span>{" "}
            </span>
          </span>
          <div className="flex items-center">
            <Button
              size="sm"
              className="ltr:mr-3 rtl:ml-3"
              customColorClass={() =>
                "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50"
              }
              onClick={handleDelete}
            >
              {" "}
              Delete{" "}
            </Button>
            <Button
              size="sm"
              variant="solid"
              onClick={() => setSendMessageDialogOpen(true)}
            >
              {" "}
              Message{" "}
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title="Remove Companies"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to remove these companies? This action can't be
          undone.
        </p>
      </ConfirmDialog>
      <Dialog
        isOpen={sendMessageDialogOpen}
        onClose={() => setSendMessageDialogOpen(false)}
      >
        <h5 className="mb-2">Send Message</h5>
        <Avatar.Group
          chained
          omittedAvatarTooltip
          className="mt-4"
          maxCount={4}
        >
          {selectedCompanies.map((c) => (
            <Tooltip key={c.id} title={c.company_name}>
              {" "}
              {/* Updated */}
              <Avatar
                src={
                  c.company_logo
                    ? `https://aazovo.codefriend.in/${c.company_logo}`
                    : undefined
                }
                icon={<TbUserCircle />}
              />{" "}
              {/* Updated */}
            </Tooltip>
          ))}
        </Avatar.Group>
        <div className="my-4">
          {" "}
          <RichTextEditor />{" "}
        </div>
        <div className="text-right flex items-center gap-2">
          <Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>
            {" "}
            Cancel{" "}
          </Button>
          <Button
            size="sm"
            variant="solid"
            loading={sendMessageLoading}
            onClick={handleSend}
          >
            {" "}
            Send{" "}
          </Button>
        </div>
      </Dialog>
    </>
  );
};

const Company = () => {
  return (
    <CompanyListProvider>
      <Container>
        <AdaptiveCard>
          <div className="flex flex-col gap-4">
            <CompanyListTable />
          </div>
        </AdaptiveCard>
      </Container>
      <CompanyListSelected />
    </CompanyListProvider>
  );
};

export default Company;
