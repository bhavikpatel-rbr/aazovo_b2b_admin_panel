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
import classNames from "classnames";

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
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Input,
  Select,
  Table,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
  Tag,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import FormItem from "@/components/ui/Form/FormItem";
import Notification from "@/components/ui/Notification";
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
  TbColumns,
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
  TbReload,
  TbSearch,
  TbShieldCheck,
  TbShieldX,
  TbTagStarred,
  TbUser,
  TbUserCircle,
  TbUserSearch,
  TbUsersGroup,
  TbX,
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
}
interface ContinentReference {
  id: number;
  name: string;
}
interface CountryReference {
  id: number;
  name: string;
}
interface CompanyCertificate {
  id: number;
  company_id: string;
  certificate_id: string;
  certificate_name: string;
  upload_certificate: string | null;
  upload_certificate_path: string;
}
interface CompanyBankDetail {
  id: number;
  company_id: string;
  type: string | null;
  bank_account_number: string;
  bank_name: string;
  ifsc_code: string;
  verification_photo: string | null;
}
interface CompanyReference {
  id: number;
  person_name: string;
  company_id: string;
  number: string;
  remark: string;
}
interface OfficeInfo {
  id: number;
  company_id: string;
  office_type: string;
  office_name: string;
  country_id: string;
  state: string;
  city: string;
  zip_code: string;
  gst_number: string;
  address: string;
}
interface CompanySpotVerification {
  id: number;
  company_id: string;
  verified_by_name: string;
  verified: boolean;
  remark: string;
  photo_upload: string | null;
  photo_upload_path: string;
}
interface BillingDocument {
  id: number;
  company_id: string;
  document_name: string;
  document: string | null;
}
interface CompanyMemberManagement {
  id: number;
  company_id: string;
  member_id: string;
  designation: string;
  person_name: string;
  number: string;
}
interface TeamMember {
  id: number;
  company_id: string;
  team_name: string;
  designation: string;
  person_name: string;
  number: string;
}

export type CompanyItem = {
  id: number;
  company_code: string | null;
  company_name: string;
  status:
  | "Verified" | "Non Verified" | "Active" | "Pending" | "Inactive" | "active" | "inactive";
  primary_email_id: string;
  primary_contact_number: string;
  primary_contact_number_code: string;
  alternate_contact_number: string | null;
  alternate_contact_number_code: string | null;
  alternate_email_id: string | null;
  general_contact_number: string | null;
  general_contact_number_code: string | null;
  ownership_type: string;
  owner_name: string;
  company_address: string;
  continent_id: string;
  country_id: string;
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
  primary_business_type: string | null;
  support_email: string | null;
  general_mobile: string | null;
  notification_email: string | null;
  kyc_verified: boolean;
  enable_billing: boolean;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedIn_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  company_logo: string | null;
  primary_account_number: string | null;
  primary_bank_name: string | null;
  primary_ifsc_code: string | null;
  secondary_account_number: string | null;
  secondary_bank_name: string | null;
  secondary_ifsc_code: string | null;
  primary_bank_verification_photo: string | null;
  secondary_bank_verification_photo: string | null;
  "206AB_verified": string;
  "206AB_remark": string | null;
  "206AB_file": string | null;
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
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
  members_count: number;
  teams_count: number;
  billing_enabled: boolean;
  due_after_3_months_date: string;
  icon_full_path: string | null;
  meta_icon_full_path: string | null;
  billing_document_path: string[];
  brands_list: any[];
  category_list: any[];
  profile_completion: number;
  created_by_user: UserReference | null;
  updated_by_user: UserReference | null;
  continent: ContinentReference;
  country: CountryReference;
  domain: any | null;
  company_certificate: CompanyCertificate[];
  company_bank_details: CompanyBankDetail[];
  company_references: CompanyReference[];
  office_info: OfficeInfo[];
  company_spot_verification: CompanySpotVerification[];
  billing_documents: BillingDocument[];
  company_member_management: CompanyMemberManagement[];
  company_team_members: TeamMember[];
  interested_in?: string;
  success_score?: number;
  trust_score?: number;
  health_score?: number;
  wallCountDisplay?: string;
};
// --- END: Detailed CompanyItem and Sub-types ---

// --- Zod Schema for Company Filter Form ---
const companyFilterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCompanyType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterContinent: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCountry: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterState: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterKycVerified: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterEnableBilling: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCreatedDate: z.array(z.date().nullable()).optional().default([null, null]),
});
type CompanyFilterFormData = z.infer<typeof companyFilterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter Utility for Companies ---
const exportToCsv = (filename: string, rows: CompanyItem[]) => { /* ... existing code ... */ };

// --- Status Colors & Context ---
export const getCompanyStatusClass = (statusValue?: CompanyItem["status"]): string => {
    if (!statusValue) return "bg-gray-200 text-gray-600";
    const lowerCaseStatus = statusValue.toLowerCase();
    const companyStatusColors: Record<string, string> = {
        active: "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
        verified: "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
        pending: "border border-orange-300 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
        inactive: "border border-red-300 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
        "non verified": "border border-yellow-300 bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300",
    };
    return companyStatusColors[lowerCaseStatus] || "bg-gray-200 text-gray-600";
};

const CompanyListContext = React.createContext<any>(undefined);
const useCompanyList = () => useContext(CompanyListContext);
const CompanyListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { CompanyData, CountriesData, ContinentsData } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const [companyList, setCompanyList] = useState<CompanyItem[]>(CompanyData?.data ?? []);
  const [companyCount, setCompanyCount] = useState(CompanyData?.counts ?? {});
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyItem[]>([]);
  const [companyListTotal, setCompanyListTotal] = useState<number>(CompanyData?.length ?? 0);
  useEffect(() => { dispatch(getCountriesAction()); dispatch(getContinentsAction()); }, [dispatch]);
  useEffect(() => {
    setCompanyCount(CompanyData?.counts ?? {}); 
    setCompanyList(CompanyData?.data ?? []);
    setCompanyListTotal(CompanyData?.data?.length ?? 0);
  }, [CompanyData]);
  useEffect(() => { dispatch(getCompanyAction()); }, [dispatch]);
  return (
    <CompanyListContext.Provider value={{
      companyCount, companyList, setCompanyList, selectedCompanies, setSelectedCompanies,
      companyListTotal, setCompanyListTotal, ContinentsData: Array.isArray(ContinentsData) ? ContinentsData : [],
      CountriesData: Array.isArray(CountriesData) ? CountriesData : [],
    }}>{children}</CompanyListContext.Provider>
  );
};

// --- Child Components (Search, ActionTools) ---
const CompanyListSearch: React.FC<{onInputChange: (value: string) => void; value: string;}> = ({ onInputChange, value }) => {
    return (
        <DebouceInput
          placeholder="Quick Search..."
          suffix={<TbSearch className="text-lg" />}
          onChange={(e) => onInputChange(e.target.value)}
          value={value}
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

export type ModalType = | "email" | "whatsapp" | "notification" | "task" | "active" | "calendar" | "members" | "alert" | "trackRecord" | "engagement" | "transaction" | "document" | "viewDetail";
export interface ModalState { isOpen: boolean; type: ModalType | null; data: CompanyItem | null; }
interface CompanyModalsProps { modalState: ModalState; onClose: () => void; }

const ViewCompanyDetailDialog: React.FC<{ company: CompanyItem; onClose: () => void; }> = ({ company, onClose }) => {
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
            <div className="mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Status:{" "}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                <Tag
                  className={`${getCompanyStatusClass(
                    company.status
                  )} capitalize`}
                >
                  {company.status}
                </Tag>
              </span>

            </div>
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
             <div className="mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Website:{" "}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
               {company.company_website ? (
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
              )}
              </span>
           
          </div>
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
            <div className="mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                KYC Verified:{" "}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
               { company.kyc_verified ? (
                <MdCheckCircle className="text-green-500 text-xl inline-block" />
              ) : (
                <MdCancel className="text-red-500 text-xl inline-block" />
              )}
              </span>
           
          </div>
              <div className="mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Billing Enabled:{" "}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
               {  company.enable_billing ? (
                <MdCheckCircle className="text-green-500 text-xl inline-block" />
              ) : (
                <MdCancel className="text-red-500 text-xl inline-block" />
              )}
              </span>
           
          </div>
           
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
            {renderVerificationStatus( "Office Photo", company.office_photo_verified, company.office_photo_remark, company.office_photo_file )}
            {renderVerificationStatus( "GST Certificate", company.gst_certificate_verified, company.gst_certificate_remark, company.gst_certificate_file )}
            {renderVerificationStatus( "Authority Letter", company.authority_letter_verified, company.authority_letter_remark, company.authority_letter_file )}
            {renderVerificationStatus( "Visiting Card", company.visiting_card_verified, company.visiting_card_remark, company.visiting_card_file )}
            {renderVerificationStatus( "Cancel Cheque", company.cancel_cheque_verified, company.cancel_cheque_remark, company.cancel_cheque_file )}
            {renderVerificationStatus( "Aadhar Card", company.aadhar_card_verified, company.aadhar_card_remark, company.aadhar_card_file )}
            {renderVerificationStatus( "PAN Card", company.pan_card_verified, company.pan_card_remark, company.pan_card_file )}
          </div>
        </Card>

        {company.office_info && company.office_info.length > 0 && (
          <Card className="mb-4" bordered>
            <h5 className="mb-2">Office Information</h5>
            {company.office_info.map((office) => (
              <div key={office.id} className="mb-3 p-2 border rounded-md dark:border-gray-600">
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

        {company.company_certificate && company.company_certificate.length > 0 && (
            <Card className="mb-4" bordered>
              <h5 className="mb-2">Certificates</h5>
              {company.company_certificate.map((cert) => (
                <div key={cert.id} className="mb-2 flex justify-between items-center">
                  <span> {cert.certificate_name} ({cert.certificate_id}) </span>
                  {cert.upload_certificate_path && (
                    <a href={cert.upload_certificate_path} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                      View Certificate
                    </a>
                  )}
                </div>
              ))}
            </Card>
          )}
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}> Close </Button>
      </div>
    </Dialog>
  );
};

const CompanyModals: React.FC<CompanyModalsProps> = ({ modalState, onClose, }) => {
  const { type, data: company, isOpen } = modalState;
  if (!isOpen || !company) return null;

  switch (type) {
    case "viewDetail": return <ViewCompanyDetailDialog company={company} onClose={onClose} />;
    // Other cases for other modals
    default: return <Dialog isOpen={true}><p>Unhandled modal type: {type}</p></Dialog>;
  }
};

const CompanyActionColumn = ({ rowData, onEdit, onOpenModal, }: { rowData: CompanyItem; onEdit: (id: number) => void; onOpenModal: (type: ModalType, data: CompanyItem) => void; }) => {
   const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600" role="button" onClick={() => onEdit(rowData.id)}>
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600" role="button" onClick={() => navigate(`/business-entities/company-view/${rowData.id}`)}>
          <TbEye />
        </div>
      </Tooltip>
      <Dropdown renderTitle={ <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" /> }>
        <Dropdown.Item onClick={() => onOpenModal("email", rowData)} className="flex items-center gap-2"> <TbMail size={18} /> <span className="text-xs">Send Email</span> </Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("whatsapp", rowData)} className="flex items-center gap-2"> <TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span> </Dropdown.Item>
      </Dropdown>
    </div>
  );
};
// --- END MODALS SECTION ---

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: CompanyFilterFormData;
  onRemoveFilter: (key: keyof CompanyFilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const filterKeyToLabelMap: Record<string, string> = {
    filterStatus: 'Status', filterCompanyType: 'Type', filterContinent: 'Continent',
    filterCountry: 'Country', filterState: 'State', filterCity: 'City',
    filterKycVerified: 'KYC', filterEnableBilling: 'Billing',
  };
  const activeFiltersList = Object.entries(filterData).flatMap(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return [];
    if (key === 'filterCreatedDate') {
      const dateArray = value as [Date | null, Date | null];
      if (dateArray[0] && dateArray[1]) {
        return [{ key, value: 'date-range', label: `Date: ${dateArray[0].toLocaleDateString()} - ${dateArray[1].toLocaleDateString()}` }];
      }
      return [];
    }
    if (Array.isArray(value)) {
      return value.filter(item => item !== null && item !== undefined).map((item: { value: string; label: string }) => ({
        key, value: item.value, label: `${filterKeyToLabelMap[key] || 'Filter'}: ${item.label}`,
      }));
    }
    return [];
  });
  if (activeFiltersList.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {activeFiltersList.map(filter => (
        <Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">
          {filter.label}
          <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key as keyof CompanyFilterFormData, filter.value)} />
        </Tag>
      ))}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};

const CompanyListTable = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { companyList, setSelectedCompanies, companyCount, ContinentsData, CountriesData, } = useCompanyList();
  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "",
  });
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<CompanyFilterFormData>({
    filterCreatedDate: [null, null],
  });
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null, });

  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange", });
  const filterFormMethods = useForm<CompanyFilterFormData>({ resolver: zodResolver(companyFilterFormSchema) });

  const handleOpenModal = (type: ModalType, companyData: CompanyItem) => setModalState({ isOpen: true, type, data: companyData });
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

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
      filterStatus: [], filterCompanyType: [], filterContinent: [], filterCountry: [],
      filterState: [], filterCity: [], filterKycVerified: [], filterEnableBilling: [],
    };
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1, query: "" });
  };

  const handleRemoveFilter = (key: keyof CompanyFilterFormData, valueToRemove: string) => {
    setFilterCriteria(prev => {
        const newCriteria = { ...prev };
        if (key === 'filterCreatedDate') {
          (newCriteria as any)[key] = [null, null];
        } else {
          const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined;
          if (currentFilterArray) {
            const newFilterArray = currentFilterArray.filter(item => item.value !== valueToRemove);
            (newCriteria as any)[key] = newFilterArray;
          }
        }
        return newCriteria;
    });
    handleSetTableData({ pageIndex: 1 });
  };

  const onRefreshData = () => {
    onClearFilters();
    dispatch(getCompanyAction());
    toast.push(<Notification title="Data Refreshed" type="success" duration={2000} />);
  };

  const handleCardClick = (filterType: string, value: string) => {
    const newCriteria: CompanyFilterFormData = {
      filterCreatedDate: [null, null],
      filterStatus: [], filterCompanyType: [], filterContinent: [], filterCountry: [],
      filterState: [], filterCity: [], filterKycVerified: [], filterEnableBilling: [],
    };

    if (filterType === 'status') {
        newCriteria.filterStatus = [{ value, label: value }];
    }
    
    setFilterCriteria(newCriteria);
    handleSetTableData({ pageIndex: 1, query: "" });
  };
  
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let filteredData = [...companyList];
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) { const selectedStatuses = filterCriteria.filterStatus.map((s) => s.value.toLowerCase()); filteredData = filteredData.filter((company) => company.status && selectedStatuses.includes(company.status.toLowerCase())); }
    if (filterCriteria.filterCompanyType && filterCriteria.filterCompanyType.length > 0) { const selectedTypes = filterCriteria.filterCompanyType.map((t) => t.value); filteredData = filteredData.filter((company) => selectedTypes.includes(company.ownership_type)); }
    if (filterCriteria.filterContinent && filterCriteria.filterContinent.length > 0) { const selectedContinents = filterCriteria.filterContinent.map((c) => c.value); filteredData = filteredData.filter((company) => company.continent && selectedContinents.includes(company.continent.name)); }
    if (filterCriteria.filterCountry && filterCriteria.filterCountry.length > 0) { const selectedCountries = filterCriteria.filterCountry.map((c) => c.value); filteredData = filteredData.filter((company) => company.country && selectedCountries.includes(company.country.name)); }
    if (filterCriteria.filterState && filterCriteria.filterState.length > 0) { const selectedStates = filterCriteria.filterState.map((s) => s.value); filteredData = filteredData.filter((company) => selectedStates.includes(company.state)); }
    if (filterCriteria.filterCity && filterCriteria.filterCity.length > 0) { const selectedCities = filterCriteria.filterCity.map((c) => c.value); filteredData = filteredData.filter((company) => selectedCities.includes(company.city)); }
    if (filterCriteria.filterKycVerified && filterCriteria.filterKycVerified.length > 0) { const selectedKycValues = filterCriteria.filterKycVerified.map((k) => k.value === "Yes"); filteredData = filteredData.filter((company) => selectedKycValues.includes(company.kyc_verified)); }
    if (filterCriteria.filterEnableBilling && filterCriteria.filterEnableBilling.length > 0) { const selectedBillingValues = filterCriteria.filterEnableBilling.map((b) => b.value === "Yes"); filteredData = filteredData.filter((company) => selectedBillingValues.includes(company.enable_billing)); }
    if (filterCriteria.filterCreatedDate && filterCriteria.filterCreatedDate[0] && filterCriteria.filterCreatedDate[1]) { const [startDate, endDate] = filterCriteria.filterCreatedDate; const inclusiveEndDate = new Date(endDate as Date); inclusiveEndDate.setHours(23, 59, 59, 999); filteredData = filteredData.filter((company) => { const createdDate = new Date(company.created_at); return (createdDate >= (startDate as Date) && createdDate <= inclusiveEndDate); }); }
    if (tableData.query) { filteredData = filteredData.filter((i) => Object.values(i).some((v) => { if (typeof v === "object" && v !== null) { return Object.values(v).some((nestedV) => String(nestedV).toLowerCase().includes(tableData.query.toLowerCase())); } return String(v).toLowerCase().includes(tableData.query.toLowerCase()); })); }
    
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
        filteredData.sort((a, b) => {
            let av = a[key as keyof CompanyItem] as any;
            let bv = b[key as keyof CompanyItem] as any;
            if (key.includes(".")) {
                const keys = key.split(".");
                av = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), a);
                bv = keys.reduce((obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined), b);
            }
            av = av ?? "";
            bv = bv ?? "";
            if (typeof av === "string" && typeof bv === "string") return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            if (typeof av === "number" && typeof bv === "number") return order === "asc" ? av - bv : bv - av;
            if (typeof av === "boolean" && typeof bv === "boolean") return order === "asc" ? (av === bv ? 0 : av ? -1 : 1) : (av === bv ? 0 : av ? 1 : -1);
            return 0;
        });
    }
    
    const pI = tableData.pageIndex as number; 
    const pS = tableData.pageSize as number;
    return { pageData: filteredData.slice((pI - 1) * pS, pI * pS), total: filteredData.length, allFilteredAndSortedData: filteredData };
  }, [companyList, tableData, filterCriteria]);

  const closeFilterDrawer = () => setFilterDrawerOpen(false);
  const handleOpenExportReasonModal = () => { /* ... */ };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { /* ... */ };
  const handleEditCompany = (id: number) => navigate(`/business-entities/company-edit/${id}`);
  const handleSetTableData = useCallback((d: Partial<TableQueries>) => setTableData((p) => ({ ...p, ...d })), []);
  const handlePaginationChange = useCallback((p: number) => handleSetTableData({ pageIndex: p }), [handleSetTableData]);
  const handleSelectChange = useCallback((v: number) => handleSetTableData({ pageSize: v, pageIndex: 1 }), [handleSetTableData]);
  const handleSort = useCallback((s: OnSortParam) => handleSetTableData({ sort: s, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((c: boolean, r: CompanyItem) => setSelectedCompanies((p) => c ? [...p, r] : p.filter((i) => i.id !== r.id)), [setSelectedCompanies]);
  const handleAllRowSelect = useCallback((c: boolean, r: Row<CompanyItem>[]) => setSelectedCompanies(c ? r.map((i) => i.original) : []), [setSelectedCompanies]);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };
  const openImageViewer = (imageUrl: string | null) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
  
  const columns: ColumnDef<CompanyItem>[] = useMemo(() => [
    { header: "Company Info", accessorKey: "company_name", id: "companyInfo", size: 220, cell: ({ row }) => {
        const { company_name, ownership_type, primary_business_type, country, city, state, company_logo, company_code } = row.original;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Avatar src={company_logo ? `https://aazovo.codefriend.in/${company_logo}` : undefined} size="sm" shape="circle" className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => company_logo && openImageViewer(company_logo)} icon={<TbUserCircle />} />
              <div>
                <h6 className="text-xs font-semibold"><em className="text-blue-600">{company_code || "Company Code"}</em></h6>
                <span className="text-xs font-semibold leading-1">{company_name}</span>
              </div>
            </div>
            <span className="text-xs mt-1"><b>Ownership Type:</b> {ownership_type || "N/A"}</span>
            <span className="text-xs mt-1"><b>Primary Business Type:</b> {primary_business_type || "N/A"}</span>
            <div className="text-xs text-gray-500">{city}, {state}, {country?.name || "N/A"}</div>
          </div>
        );
      },
    },
    { header: "Contact", accessorKey: "owner_name", id: "contact", size: 180, cell: (props) => {
        const { owner_name, primary_contact_number, primary_email_id, company_website, primary_contact_number_code } = props.row.original;
        return (
          <div className="text-xs flex flex-col gap-0.5">
            {owner_name && (<span><b>Owner: </b> {owner_name}</span>)}
            {primary_contact_number && (<span>{primary_contact_number_code} {primary_contact_number}</span>)}
            {primary_email_id && (<a href={`mailto:${primary_email_id}`} className="text-blue-600 hover:underline">{primary_email_id}</a>)}
            {company_website && (<a href={company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{company_website}</a>)}
          </div>
        );
      },
    },
    { header: "Legal IDs & Status", accessorKey: "status", id: "legal", size: 180, cell: ({ row }) => {
        const { gst_number, pan_number, status } = row.original;
        return (
          <div className="flex flex-col gap-0.5 text-[11px]">
            {gst_number && <div><b>GST:</b> <span className="break-all">{gst_number}</span></div>}
            {pan_number && <div><b>PAN:</b> <span className="break-all">{pan_number}</span></div>}
            <Tag className={`${getCompanyStatusClass(status)} capitalize mt-1 self-start !text-[11px] px-2 py-1`}>{status}</Tag>
          </div>
        );
      },
    },
    { header: "Profile & Scores", accessorKey: "profile_completion", id: "profile", size: 190, cell: ({ row }) => {
        const { members_count = 0, teams_count = 0, profile_completion = 0, kyc_verified, enable_billing, due_after_3_months_date } = row.original;
        const formattedDate = due_after_3_months_date ? `${new Date(due_after_3_months_date).getDate()} ${new Date(due_after_3_months_date).toLocaleString("en-US", { month: "short" })}, ${new Date(due_after_3_months_date).getFullYear()}` : "N/A";
        return (
          <div className="flex flex-col gap-1 text-xs">
            <span><b>Members:</b> {members_count}</span>
            <span><b>Teams:</b> {teams_count}</span>
            <div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${kyc_verified ? "Yes" : "No"}`}>{kyc_verified ? (<MdCheckCircle className="text-green-500 text-lg" />) : (<MdCancel className="text-red-500 text-lg" />)}</Tooltip></div>
            <div className="flex gap-1 items-center"><b>Billing:</b><Tooltip title={`Billing: ${enable_billing ? "Yes" : "No"}`}>{enable_billing ? (<MdCheckCircle className="text-green-500 text-lg" />) : (<MdCancel className="text-red-500 text-lg" />)}</Tooltip></div>
            <span><b>Billing Due:</b> {formattedDate}</span>
            <Tooltip title={`Profile Completion ${profile_completion}%`}>
              <div className="h-2.5 w-full rounded-full bg-gray-300">
                <div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${profile_completion}%` }}></div>
              </div>
            </Tooltip>
          </div>
        );
      },
    },
    { header: "Actions", id: "action", meta: { HeaderClass: "text-center" }, size: 80, cell: (props) => <CompanyActionColumn rowData={props.row.original} onEdit={handleEditCompany} onOpenModal={handleOpenModal} /> },
  ], [handleOpenModal, openImageViewer]);
  
  const [filteredColumns, setFilteredColumns] = useState(columns);

  const toggleColumn = (checked: boolean, colId: string) => { /* ... */ };
  const isColumnVisible = (colId: string) => { /* ... */ };
  const statusOptions = useMemo(() => Array.from(new Set(companyList.map((c) => c.status))).filter(Boolean).map((s) => ({ value: s, label: s })), [companyList]);
  const companyTypeOptions = useMemo(() => Array.from(new Set(companyList.map((c) => c.ownership_type))).filter(Boolean).map((ct) => ({ value: ct, label: ct })), [companyList]);
  const continentOptions = useMemo(() => ContinentsData.map((co) => ({ value: co.name, label: co.name })), [ContinentsData]);
  const countryOptions = useMemo(() => CountriesData.map((ct) => ({ value: ct.name, label: ct.name })), [CountriesData]);
  const stateOptions = useMemo(() => Array.from(new Set(companyList.map((c) => c.state))).filter(Boolean).map((st) => ({ value: st, label: st })), [companyList]);
  const cityOptions = useMemo(() => Array.from(new Set(companyList.map((c) => c.city))).filter(Boolean).map((ci) => ({ value: ci, label: ci })), [companyList]);
  const kycOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  const billingOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  const { DatePickerRange } = DatePicker;
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-1";

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h5>Company</h5>
        <CompanyListActionTools />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-4 gap-2">
        <Tooltip title="Click to show all companies"><div onClick={onClearFilters}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbBuilding size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm ">{companyCount?.total ?? 0}</b><span className="text-[9px] font-semibold">Total</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Active status"><div onClick={() => handleCardClick('status', 'Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbBuildingBank size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.active ?? companyList.filter((c) => c.status === "Active" || c.status === "active").length}</b><span className="text-[9px] font-semibold">Active</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Inactive status"><div onClick={() => handleCardClick('status', 'Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCancel size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.disable ?? companyList.filter((c) => c.status === "Inactive" || c.status === "inactive").length}</b><span className="text-[9px] font-semibold">Disabled</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Verified status"><div onClick={() => handleCardClick('status', 'Verified')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-emerald-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbCircleCheck size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.verified ?? companyList.filter((c) => c.status === "Verified").length}</b><span className="text-[9px] font-semibold">Verified</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Non Verified status"><div onClick={() => handleCardClick('status', 'Non Verified')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-yellow-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-yellow-100 text-yellow-500"><TbCircleX size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.unverified ?? companyList.filter((c) => c.status === "Non Verified").length}</b><span className="text-[9px] font-semibold">Non Verified</span></div></Card></div></Tooltip>
        <Card bodyClass={cardBodyClass} className="rounded-md border border-violet-200"><div className="h-8 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbShieldCheck size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.registered ?? 0}</b><span className="text-[9px] font-semibold">Eligible</span></div></Card>
        <Card bodyClass={cardBodyClass} className="rounded-md border border-red-200"><div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbShieldX size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.unregistered ?? 0}</b><span className="text-[9px] font-semibold">Not Eligible</span></div></Card>
        <Card bodyClass={cardBodyClass} className="rounded-md border border-orange-200"><div className="h-8 w-8 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbBuildingCommunity size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm pb-0 mb-0">{companyCount?.members ?? 0}</b><span className="text-[9px] font-semibold">Members</span></div></Card>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <CompanyListSearch onInputChange={(val) => handleSetTableData({ query: val, pageIndex: 1 })} value={tableData.query} />
        <div className="flex gap-2">
          <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
            <div className="flex flex-col p-2">
              <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
              {columns.map((col) => { const id = col.id || col.accessorKey as string; if (!col.header) return null; return ( <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"> <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox> </div> ) })}
            </div>
          </Dropdown>
          <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onRefreshData} /></Tooltip>
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
          <Button icon={<TbCloudUpload />} onClick={handleOpenExportReasonModal} disabled={!allFilteredAndSortedData || allFilteredAndSortedData.length === 0}>Export</Button>
        </div>
      </div>
      <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
      <DataTable columns={filteredColumns} data={pageData} noData={pageData.length === 0} loading={isLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} selectable />
      <Drawer title="Company Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={480} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={() => { onClearFilters(); closeFilterDrawer(); }}>Clear All</Button><Button size="sm" variant="solid" form="filterCompanyForm" type="submit">Apply</Button></div>} >
        <UiForm id="filterCompanyForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2">
            <UiFormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={statusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Ownership Type"><Controller name="filterCompanyType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Type" options={companyTypeOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Continent"><Controller name="filterContinent" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Continent" options={continentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Country" options={countryOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="State"><Controller name="filterState" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select State" options={stateOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="City"><Controller name="filterCity" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select City" options={cityOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="KYC Verified"><Controller name="filterKycVerified" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={kycOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Enable Billing"><Controller name="filterEnableBilling" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={billingOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Created Date" className="col-span-2"><Controller name="filterCreatedDate" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange placeholder="Select Date Range" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />)} /></UiFormItem>
          </div>
        </UiForm>
      </Drawer>
      <CompanyModals modalState={modalState} onClose={handleCloseModal} />
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
        <UiForm id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
          <UiFormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </UiFormItem>
        </UiForm>
      </ConfirmDialog>
      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
        <div className="flex justify-center items-center p-4">
          {imageToView ? (<img src={`https://aazovo.codefriend.in/${imageToView}`} alt="Company Logo Full View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />) : (<p>No image to display.</p>)}
        </div>
      </Dialog>
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
      toast.push(<Notification title="Failed to Delete" type="danger">{error.message}</Notification>);
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
      <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="container mx-auto flex items-center justify-between">
          <span>
            <span className="flex items-center gap-2"><TbChecks className="text-lg text-primary-600" /><span className="font-semibold">{selectedCompanies.length} Companies selected</span></span>
          </span>
          <div className="flex items-center">
            <Button size="sm" className="ltr:mr-3 rtl:ml-3" customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50"} onClick={handleDelete}>Delete</Button>
            <Button size="sm" variant="solid" onClick={() => setSendMessageDialogOpen(true)}>Message</Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title="Remove Companies" onClose={handleCancelDelete} onConfirm={handleConfirmDelete} loading={isDeleting}>
        <p>Are you sure you want to remove these companies? This action can't be undone.</p>
      </ConfirmDialog>
      <Dialog isOpen={sendMessageDialogOpen} onClose={() => setSendMessageDialogOpen(false)}>
        <h5 className="mb-2">Send Message</h5>
        <Avatar.Group chained omittedAvatarTooltip className="mt-4" maxCount={4}>
          {selectedCompanies.map((c) => (<Tooltip key={c.id} title={c.company_name}><Avatar src={c.company_logo ? `https://aazovo.codefriend.in/${c.company_logo}` : undefined} icon={<TbUserCircle />} /></Tooltip>))}
        </Avatar.Group>
        <div className="my-4"><RichTextEditor /></div>
        <div className="text-right flex items-center gap-2">
          <Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>Cancel</Button>
          <Button size="sm" variant="solid" loading={sendMessageLoading} onClick={handleSend}>Send</Button>
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