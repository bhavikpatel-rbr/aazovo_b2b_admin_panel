import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
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
  Checkbox,
  DatePicker,
  Dialog,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Spinner,
  Tag,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdCancel, MdCheckCircle } from "react-icons/md";
import {
  TbAlarm,
  TbBell,
  TbBellRinging,
  TbBrandWhatsapp,
  TbBuilding,
  TbBuildingBank,
  TbCalendarEvent,
  TbCalendarTime,
  TbCancel,
  TbCheck,
  TbChecks,
  TbChevronLeft,
  TbChevronRight,
  TbCircleCheck,
  TbCircleX,
  TbCloudUpload,
  TbColumns,
  TbDownload,
  TbEye,
  TbFile,
  TbFileDescription,
  TbFileTypePdf,
  TbFilter,
  TbMail,
  TbMessageCircle,
  TbNotesOff,
  TbPencil,
  TbPencilPlus,
  TbPlus,
  TbReceipt,
  TbReload,
  TbSearch,
  TbShieldCheck,
  TbShieldX,
  TbTagStarred,
  TbTrash,
  TbUser,
  TbUserCircle,
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
  addAllActionAction,
  addAllAlertsAction,
  addNotificationAction,
  addScheduleAction,
  addTaskAction,
  deleteAllcompanyAction,
  getAlertsAction,
  getAllUsersAction,
  getCompanyAction,
  getContinentsAction,
  getCountriesAction,
  getDocumentTypeAction,
  getPendingBillAction,
  setenablebillingAction,
  setsavedocAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "localforage";
import { BiNotification } from "react-icons/bi";
import { useSelector } from "react-redux";

// --- START: Detailed Type Definitions ---
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
  company_id: number;
  certificate_id: number;
  certificate_name: string;
  upload_certificate: string | null;
  upload_certificate_path: string;
}
interface CompanyBankDetail {
  id: number;
  company_id: number;
  type: string | null;
  bank_account_number: string;
  bank_name: string;
  ifsc_code: string;
  swift_code: string | null;
  verification_photo: string | null;
}
interface CompanyReference {
  id: number;
  person_name: string;
  company_id: number;
  number: string;
  remark: string;
}
interface OfficeInfo {
  id: number;
  company_id: number;
  office_type: string;
  office_name: string;
  country_id: number;
  state: string;
  city: string;
  zip_code: string;
  gst_number: string;
  address: string;
}
interface CompanySpotVerification {
  id: number;
  company_id: number;
  verified_by_name: string;
  verified: boolean;
  remark: string;
  photo_upload: string | null;
  photo_upload_path: string;
}
interface BillingDocument {
  id: number;
  company_id: number;
  document_name: string;
  document: string | null;
}
interface CompanyMemberManagement {
  id: number;
  company_id: number;
  member_id: number;
  designation: string;
  person_name: string;
  number: string;
}
interface TeamMember {
  id: number;
  company_id: number;
  team_name: string;
  designation: string;
  person_name: string;
  number: string;
}

// START: Alert Note Type Definition
interface AlertNote {
  id: number;
  note: string; // HTML content from RichTextEditor
  created_by: string;
  created_at: string; // ISO date string
}
// END: Alert Note Type Definition

export type CompanyItem = {
  id: number;
  company_code: string | null;
  company_name: string;
  status:
    | "Verified"
    | "Non Verified"
    | "Active"
    | "Pending"
    | "Inactive"
    | "active"
    | "inactive";
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
  continent_id: number;
  country_id: number;
  state: string;
  city: string;
  zip_code: string;
  gst_number: string | null;
  pan_number: string | null;
  trn_number: string | null;
  tan_number: string | null;
  establishment_year: string | null;
  no_of_employees: number | null;
  company_website: string | null;
  primary_business_type: string | null;
  support_email: string | null;
  general_mobile: string | null;
  notification_email: string | null;
  kyc_verified: boolean;
  enable_billing: boolean;
  need_enable?: boolean; // Field to control the new dropdown option
  facebook_url: string | null;
  instagram_url: string | null;
  linkedIn_url: string | null;
  youtube_url: string | null;
  twitter_url: string | null;
  company_logo: string | null;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  deleted_at: string | null;
  members_count: number;
  teams_count: number;
  due_after_3_months_date: string;
  created_by_user: UserReference | null;
  updated_by_user: UserReference | null;
  continent: ContinentReference;
  country: CountryReference;
  company_certificate: CompanyCertificate[];
  company_bank_details: CompanyBankDetail[];
  company_references: CompanyReference[];
  office_info: OfficeInfo[];
  company_spot_verification: CompanySpotVerification[];
  billing_documents: BillingDocument[];
  company_member_management: CompanyMemberManagement[];
  company_team_members: TeamMember[];
  profile_completion: number;
  "206AB_file": string | null;
  "206AB_remark": string | null;
  "206AB_verified": boolean | number;
  ABCQ_file: string | null;
  ABCQ_remark: string | null;
  ABCQ_verified: boolean | number;
  office_photo_file: string | null;
  office_photo_remark: string | null;
  office_photo_verified: boolean | number;
  gst_certificate_file: string | null;
  gst_certificate_remark: string | null;
  gst_certificate_verified: boolean | number;
  authority_letter_file: string | null;
  authority_letter_remark: string | null;
  authority_letter_verified: boolean | number;
  visiting_card_file: string | null;
  visiting_card_remark: string | null;
  visiting_card_verified: boolean | number;
  cancel_cheque_file: string | null;
  cancel_cheque_remark: string | null;
  cancel_cheque_verified: boolean | number;
  aadhar_card_file: string | null;
  aadhar_card_remark: string | null;
  aadhar_card_verified: boolean | number;
  pan_card_file: string | null;
  pan_card_remark: string | null;
  pan_card_verified: boolean | number;
  other_document_file: string | null;
  other_document_remark: string | null;
  other_document_verified: boolean | number;
  wall: { buy: number; sell: number; total: number };
  opportunities: { offers: number; demands: number; total: number };
  leads: { total: number };
};
// --- END: Detailed Type Definitions ---

// --- Zod Schemas ---
const companyFilterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCompanyType: z
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
  filterKycVerified: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterEnableBilling: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCreatedDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
});
type CompanyFilterFormData = z.infer<typeof companyFilterFormSchema>;
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z
    .string({ required_error: "Event type is required." })
    .min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;
const taskValidationSchema = z.object({
  task_title: z.string().min(3, "Task title must be at least 3 characters."),
  assign_to: z.array(z.number()).min(1, "At least one assignee is required."),
  priority: z.string().min(1, "Please select a priority."),
  due_date: z.date().nullable().optional(),
  description: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskValidationSchema>;
type NotificationFormData = {
  notification_title: string;
  send_users: number[];
  message: string;
}; // Added for notification form
// START: Zod Schema for Alert Note
const alertNoteSchema = z.object({
  newNote: z.string().min(10, "Note must contain at least 10 characters."),
});
type AlertNoteFormData = z.infer<typeof alertNoteSchema>;
// END: Zod Schema for Alert Note
const taskPriorityOptions: SelectOption[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

// --- Utility Functions & Constants ---
function exportToCsv(filename: string, rows: CompanyItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const CSV_HEADERS = [
    "ID",
    "Company Code",
    "Company Name",
    "Owner Name",
    "Ownership Type",
    "Status",
    "Contact",
    "Email",
    "Country",
    "State",
    "City",
    "KYC Verified",
    "gst_number",
    "pan_number",
    "Created Date",
  ];
  const preparedRows = rows.map((row) => ({
    id: row.id,
    company_code: row.company_code,
    company_name: row.company_name,
    owner_name: row.owner_name,
    ownership_type: row.ownership_type,
    status: row.status,
    primary_contact_number: `${row.primary_contact_number_code} ${row.primary_contact_number}`,
    primary_email_id: row.primary_email_id,
    country: row.country?.name || "N/A",
    state: row.state,
    city: row.city,
    kyc_verified: row.kyc_verified ? "Yes" : "No",
    gst_number: row.gst_number,
    pan_number: row.pan_number,
    created_at: row.created_at
      ? dayjs(row.created_at).format("DD MMM YYYY")
      : "N/A",
  }));
  const csvContent = [
    CSV_HEADERS.join(","),
    ...preparedRows.map((row) =>
      CSV_HEADERS.map((header) =>
        JSON.stringify(
          row[header.toLowerCase().replace(/ /g, "_") as keyof typeof row] ??
            "",
          (key, value) => (value === null ? "" : value)
        )
      ).join(",")
    ),
  ].join("\n");
  const blob = new Blob([`\ufeff${csvContent}`], {
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

export const getCompanyStatusClass = (
  statusValue?: CompanyItem["status"]
): string => {
  if (!statusValue) return "bg-gray-200 text-gray-600";
  const lowerCaseStatus = statusValue.toLowerCase();
  const companyStatusColors: Record<string, string> = {
    active:
      "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
    verified:
      "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
    pending:
      "border border-orange-300 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
    inactive:
      "border border-red-300 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
    "non verified":
      "border border-yellow-300 bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300",
  };
  return companyStatusColors[lowerCaseStatus] || "bg-gray-200 text-gray-600";
};

// --- START: DOCUMENT VIEWER COMPONENTS AND HELPERS ---

interface DocumentRecord {
  name: string;
  type: "image" | "pdf" | "other";
  url: string;
  verified?: boolean;
}

const getFileType = (url: string | null): "image" | "pdf" | "other" => {
  if (!url) return "other";
  const extension = url.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || ""))
    return "image";
  if (extension === "pdf") return "pdf";
  return "other";
};

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
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onNext, onPrev, onClose]);

  if (!document) return null;

  const renderContent = () => {
    switch (document.type) {
      case "image":
        return (
          <img
            src={document.url}
            alt={document.name}
            className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
              isContentLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsContentLoaded(true)}
          />
        );
      case "pdf":
        return (
          <iframe
            src={document.url}
            title={document.name}
            className={`w-full h-full border-0 transition-opacity duration-300 ${
              isContentLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsContentLoaded(true)}
          ></iframe>
        );
      default:
        if (!isContentLoaded) setIsContentLoaded(true);
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-10 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <TbFile size={60} className="mx-auto mb-4 text-gray-500" />
            <h5 className="mb-2">{document.name}</h5>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Preview is not available for this file type.
            </p>
            <a
              href={document.url}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="solid" icon={<TbDownload />}>
                Download File
              </Button>
            </a>
          </div>
        );
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      width="auto"
      height="85vh"
      closable={false}
      contentClassName="top-0 p-0 bg-transparent"
    >
      <div className="w-full h-full bg-black/80 backdrop-blur-sm flex flex-col">
        <header className="flex-shrink-0 h-16 bg-gray-800/50 text-white flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h6 className="font-semibold truncate" title={document.name}>
              {document.name}
            </h6>
            <span className="text-sm text-gray-400">
              {currentIndex + 1} / {documents.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={document.url}
              download
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                shape="circle"
                variant="subtle"
                size="sm"
                icon={<TbDownload />}
              />
            </a>
            <Button
              shape="circle"
              variant="subtle"
              size="sm"
              icon={<TbX />}
              onClick={onClose}
            />
          </div>
        </header>
        <main className="relative flex-grow flex items-center justify-center ">
          {!isContentLoaded && <Spinner size={40} className="absolute" />}
          {renderContent()}
        </main>
        {documents.length > 1 && (
          <>
            <Button
              shape="circle"
              size="lg"
              icon={<TbChevronLeft />}
              className="!absolute left-4 top-1/2 -translate-y-1/2"
              onClick={onPrev}
              disabled={currentIndex === 0}
            />
            <Button
              shape="circle"
              size="lg"
              icon={<TbChevronRight />}
              className="!absolute right-4 top-1/2 -translate-y-1/2"
              onClick={onNext}
              disabled={currentIndex === documents.length - 1}
            />
          </>
        )}
      </div>
    </Dialog>
  );
};
// --- END: DOCUMENT VIEWER COMPONENTS AND HELPERS ---

// --- START: MODALS SECTION ---
export type SelectOption = { value: any; label: string };
export type ModalType =
  | "email"
  | "whatsapp"
  | "notification"
  | "task"
  | "schedule"
  | "members"
  | "alert"
  | "activity"
  | "transaction"
  | "document"
  | "viewDetail";
export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data: CompanyItem | null;
}
interface CompanyModalsProps {
  modalState: ModalState;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}

const CompanyAlertModal: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  // --- State and Hooks (no changes needed) ---
  const [alerts, setAlerts] = useState<AlertNote[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<AlertNoteFormData>({
    resolver: zodResolver(alertNoteSchema),
    defaultValues: { newNote: "" },
    mode: "onChange",
  });

  // --- Helper functions and API calls (no changes needed) ---
  const stringToColor = (str: string) => {
    let hash = 0;
    if (!str) return "#cccccc";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }
    return color;
  };

  useEffect(() => {
    setIsFetching(true);
    dispatch(getAlertsAction({ module_id: company.id, module_name: "Company" }))
      .unwrap()
      .then((data) => setAlerts(data.data || []))
      .catch(() =>
        toast.push(
          <Notification type="danger" title="Failed to fetch alerts." />
        )
      )
      .finally(() => setIsFetching(false));
    reset({ newNote: "" });
  }, [company.id, dispatch]);

  const onAddNote = async (data: AlertNoteFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(
        addAllAlertsAction({
          note: data.newNote,
          module_id: company.id,
          module_name: "Company",
        })
      ).unwrap();
      toast.push(<Notification type="success" title="Alert Note Added" />);
      reset({ newNote: "" });
      dispatch(
        getAlertsAction({ module_id: company.id, module_name: "Company" })
      )
        .unwrap()
        .then((data) => setAlerts(data.data || []));
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Failed to Add Note"
          children={error?.message}
        />
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={1200}
      contentClassName="p-0 flex flex-col max-h-[90vh] h-full bg-gray-50 dark:bg-gray-900 rounded-lg"
    >
      {/* --- Header --- */}
      <header className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 flex-shrink-0 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TbBellRinging className="text-2xl text-white" />
            <h5 className="mb-0 text-white font-bold text-base sm:text-xl">
              {company.company_name}
            </h5>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* --- Main Content: Grid for two columns --- */}
      <main className="flex-grow min-h-0 p-4 sm:p-6 lg:grid lg:grid-cols-2 lg:gap-x-8 overflow-hidden">
        {/* --- Left Column: Activity Timeline (This column scrolls internally) --- */}
        <div className="relative flex flex-col h-full overflow-hidden">
          <h6 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
            Activity Timeline
          </h6>

          {/* The scrollable container for the timeline */}
          <div className="flex-grow overflow-y-auto lg:pr-4 lg:-mr-4">
            {isFetching ? (
              <div className="flex justify-center items-center h-full">
                <Spinner size="lg" />
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-8">
                {alerts.map((alert, index) => {
                  const userName = alert?.created_by_user?.name || "N/A";
                  const userInitial = userName.charAt(0).toUpperCase();
                  return (
                    <div
                      key={`${alert.id}-${index}`}
                      className="relative flex items-start gap-4 pl-12"
                    >
                      <div className="absolute left-0 top-0 z-10 flex flex-col items-center h-full">
                        <Avatar
                          shape="circle"
                          size="md"
                          style={{ backgroundColor: stringToColor(userName) }}
                        >
                          {userInitial}
                        </Avatar>
                        {index < alerts.length - 1 && (
                          <div className="mt-2 flex-grow w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                        )}
                      </div>
                      <Card className="flex-grow shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="p-4">
                          <header className="flex justify-between items-center mb-2">
                            <p className="font-bold text-gray-800 dark:text-gray-100">
                              {userName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <TbCalendarTime />
                              <span>
                                {dayjs(alert.created_at).format(
                                  "DD MMM YYYY, h:mm A"
                                )}
                              </span>
                            </div>
                          </header>
                          <div
                            className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300"
                            dangerouslySetInnerHTML={{ __html: alert.note }}
                          />
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-center py-10 bg-white dark:bg-gray-800/50 rounded-lg">
                <TbNotesOff className="text-6xl text-gray-300 dark:text-gray-500 mb-4" />
                <p className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                  No Activity Yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Be the first to add a note.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* --- Right Column: Add New Note (Stays in place) --- */}
        <div className="flex flex-col mt-8 lg:mt-0 h-full">
          <Card className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
            <header className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-t-lg border-b dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <TbPencilPlus className="text-xl text-blue-600 dark:text-blue-400" />
                <h6 className="font-semibold text-gray-800 dark:text-gray-200 mb-0">
                  Add New Note
                </h6>
              </div>
            </header>
            <Form
              onSubmit={handleSubmit(onAddNote)}
              className="p-4 flex-grow flex flex-col"
            >
              <FormItem
                invalid={!!errors.newNote}
                errorMessage={errors.newNote?.message}
                className="flex-grow flex flex-col"
              >
                <Controller
                  name="newNote"
                  control={control}
                  render={({ field }) => (
                    <div className="border dark:border-gray-700 rounded-md flex-grow flex flex-col">
                      <RichTextEditor
                        {...field}
                        onChange={(val) => field.onChange(val.html)}
                        className="flex-grow min-h-[150px] sm:min-h-[200px]"
                      />
                    </div>
                  )}
                />
              </FormItem>
              <footer className="flex items-center justify-end mt-4 pt-4 border-t dark:border-gray-700 flex-shrink-0">
                <Button
                  type="button"
                  className="mr-3"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="blue"
                  type="submit"
                  loading={isSubmitting}
                  disabled={!isValid || isSubmitting}
                >
                  Submit Note
                </Button>
              </footer>
            </Form>
          </Card>
        </div>
      </main>
    </Dialog>
  );
};

const ViewCompanyDetailDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  const renderDetailItem = (label: string, value: any, isLink = false) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <div className="mb-3">
        {" "}
        <span className="font-semibold text-gray-700 dark:text-gray-200">
          {label}:{" "}
        </span>{" "}
        {isLink ? (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {String(value)}
          </a>
        ) : (
          <span className="text-gray-600 dark:text-gray-400">
            {String(value)}
          </span>
        )}{" "}
      </div>
    );
  };
  const renderVerificationStatus = (
    label: string,
    verified: boolean | number,
    remark?: string | null,
    file?: string | null
  ) => {
    return (
      <div className="mb-3 p-2 border rounded-md dark:border-gray-600">
        {" "}
        <div className="flex items-center justify-between">
          {" "}
          <div>
            {" "}
            <span className="font-semibold">{label}: </span>{" "}
            {verified ? (
              <Tag prefix prefixClass="bg-emerald-500">
                Verified
              </Tag>
            ) : (
              <Tag prefix prefixClass="bg-red-500">
                Not Verified
              </Tag>
            )}{" "}
          </div>{" "}
          {file && (
            <a
              href={file}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              View File
            </a>
          )}{" "}
        </div>{" "}
        {remark && (
          <p className="text-xs text-gray-500 mt-1">Remark: {remark}</p>
        )}{" "}
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
          {" "}
          <h5 className="mb-2">Basic Information</h5>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {" "}
            {renderDetailItem("Company Code", company.company_code)}{" "}
            {renderDetailItem("Ownership Type", company.ownership_type)}{" "}
            {renderDetailItem("Owner Name", company.owner_name)}{" "}
            <div className="mb-3">
              {" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Status:{" "}
              </span>{" "}
              <span className="text-gray-600 dark:text-gray-400">
                <Tag
                  className={`${getCompanyStatusClass(
                    company.status
                  )} capitalize`}
                >
                  {company.status}
                </Tag>
              </span>{" "}
            </div>{" "}
            {renderDetailItem("Establishment Year", company.establishment_year)}{" "}
            {renderDetailItem("No. of Employees", company.no_of_employees)}{" "}
            {renderDetailItem(
              "Primary Business Type",
              company.primary_business_type
            )}{" "}
            {renderDetailItem(
              "Profile Completion",
              `${company.profile_completion}%`
            )}{" "}
          </div>{" "}
        </Card>
        <Card className="mb-4" bordered>
          {" "}
          <h5 className="mb-2">Contact Information</h5>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {" "}
            {renderDetailItem("Primary Email", company.primary_email_id)}{" "}
            {renderDetailItem(
              "Primary Contact",
              `${company.primary_contact_number_code} ${company.primary_contact_number}`
            )}{" "}
            {renderDetailItem("Alternate Email", company.alternate_email_id)}{" "}
            {renderDetailItem(
              "Alternate Contact",
              company.alternate_contact_number
                ? `${company.alternate_contact_number_code} ${company.alternate_contact_number}`
                : "N/A"
            )}{" "}
            {renderDetailItem("Website", company.company_website, true)}{" "}
          </div>{" "}
        </Card>
        <Card className="mb-4" bordered>
          {" "}
          <h5 className="mb-2">Legal & Financial</h5>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {" "}
            {renderDetailItem("GST Number", company.gst_number)}{" "}
            {renderDetailItem("PAN Number", company.pan_number)}{" "}
            {renderDetailItem("TRN Number", company.trn_number)}{" "}
            {renderDetailItem("TAN Number", company.tan_number)}{" "}
            <div className="mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                KYC Verified:{" "}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {company.kyc_verified ? (
                  <MdCheckCircle className="text-green-500 text-xl inline-block" />
                ) : (
                  <MdCancel className="text-red-500 text-xl inline-block" />
                )}
              </span>
            </div>{" "}
            <div className="mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                Billing Enabled:{" "}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {company.enable_billing ? (
                  <MdCheckCircle className="text-green-500 text-xl inline-block" />
                ) : (
                  <MdCancel className="text-red-500 text-xl inline-block" />
                )}
              </span>
            </div>{" "}
            {renderDetailItem(
              "Billing Due Date",
              company.due_after_3_months_date
                ? dayjs(company.due_after_3_months_date).format("D MMM YYYY")
                : "N/A"
            )}{" "}
          </div>{" "}
        </Card>
        {company.company_bank_details?.length > 0 && (
          <Card className="mb-4" bordered>
            {" "}
            <h5 className="mb-2">Bank Details</h5>{" "}
            {company.company_bank_details.map((bank) => (
              <div
                key={bank.id}
                className="mb-3 p-2 border rounded-md dark:border-gray-600"
              >
                {" "}
                {renderDetailItem("Bank Name", bank.bank_name)}{" "}
                {renderDetailItem("Account Number", bank.bank_account_number)}{" "}
                {renderDetailItem("IFSC Code", bank.ifsc_code)}{" "}
                {renderDetailItem("SWIFT Code", bank.swift_code)}{" "}
                {renderDetailItem("Type", bank.type || "N/A")}{" "}
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
                  )}{" "}
              </div>
            ))}{" "}
          </Card>
        )}
        <Card className="mb-4" bordered>
          {" "}
          <h5 className="mb-2">Document Verification Status</h5>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {" "}
            {renderVerificationStatus(
              "Office Photo",
              company.office_photo_verified,
              company.office_photo_remark,
              company.office_photo_file
            )}{" "}
            {renderVerificationStatus(
              "GST Certificate",
              company.gst_certificate_verified,
              company.gst_certificate_remark,
              company.gst_certificate_file
            )}{" "}
            {renderVerificationStatus(
              "Authority Letter",
              company.authority_letter_verified,
              company.authority_letter_remark,
              company.authority_letter_file
            )}{" "}
            {renderVerificationStatus(
              "Visiting Card",
              company.visiting_card_verified,
              company.visiting_card_remark,
              company.visiting_card_file
            )}{" "}
            {renderVerificationStatus(
              "Cancel Cheque",
              company.cancel_cheque_verified,
              company.cancel_cheque_remark,
              company.cancel_cheque_file
            )}{" "}
            {renderVerificationStatus(
              "Aadhar Card",
              company.aadhar_card_verified,
              company.aadhar_card_remark,
              company.aadhar_card_file
            )}{" "}
            {renderVerificationStatus(
              "PAN Card",
              company.pan_card_verified,
              company.pan_card_remark,
              company.pan_card_file
            )}{" "}
          </div>{" "}
        </Card>
        {company.office_info?.length > 0 && (
          <Card className="mb-4" bordered>
            {" "}
            <h5 className="mb-2">Office Information</h5>{" "}
            {company.office_info.map((office) => (
              <div
                key={office.id}
                className="mb-3 p-2 border rounded-md dark:border-gray-600"
              >
                {" "}
                {renderDetailItem("Office Name", office.office_name)}{" "}
                {renderDetailItem("Office Type", office.office_type)}{" "}
                {renderDetailItem("Address", office.address)}{" "}
                {renderDetailItem("City", office.city)}{" "}
                {renderDetailItem("State", office.state)}{" "}
                {renderDetailItem("Zip Code", office.zip_code)}{" "}
                {renderDetailItem("GST Number", office.gst_number)}{" "}
              </div>
            ))}{" "}
          </Card>
        )}
        {company.company_certificate?.length > 0 && (
          <Card className="mb-4" bordered>
            {" "}
            <h5 className="mb-2">Certificates</h5>{" "}
            {company.company_certificate.map((cert) => (
              <div
                key={cert.id}
                className="mb-2 flex justify-between items-center"
              >
                {" "}
                <span>
                  {" "}
                  {cert.certificate_name} ({cert.certificate_id}){" "}
                </span>{" "}
                {cert.upload_certificate_path && (
                  <a
                    href={cert.upload_certificate_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {" "}
                    View Certificate{" "}
                  </a>
                )}{" "}
              </div>
            ))}{" "}
          </Card>
        )}
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          {" "}
          Close{" "}
        </Button>
      </div>
    </Dialog>
  );
};
const AddCompanyNotificationDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}> = ({ company, onClose, getAllUserDataOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(
      z.object({
        notification_title: z.string().min(3),
        send_users: z.array(z.number()).min(1),
        message: z.string().min(10),
      })
    ),
    defaultValues: {
      notification_title: `Regarding Company: ${company.company_name}`,
      send_users: [],
      message: `This is a notification for company "${company.company_name}" (${company.company_code}). Please review the details.`,
    },
    mode: "onChange",
  });
  const onSend = async (formData: any) => {
    setIsLoading(true);
    const payload = {
      ...formData,
      module_id: String(company.id),
      module_name: "Company",
    };
    try {
      await dispatch(addNotificationAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Notification Sent!" />);
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification type="danger" title="Failed" children={error?.message} />
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog isOpen={true} onClose={onClose}>
      {" "}
      <h5 className="mb-4">Notify User about: {company.company_name}</h5>{" "}
      <UiForm onSubmit={handleSubmit(onSend)}>
        {" "}
        <UiFormItem
          label="Title"
          invalid={!!errors.notification_title}
          errorMessage={errors.notification_title?.message}
        >
          <Controller
            name="notification_title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </UiFormItem>{" "}
        <UiFormItem
          label="Send To"
          invalid={!!errors.send_users}
          errorMessage={errors.send_users?.message}
        >
          <Controller
            name="send_users"
            control={control}
            render={({ field }) => (
              <UiSelect
                isMulti
                placeholder="Select User(s)"
                options={getAllUserDataOptions}
                value={getAllUserDataOptions.filter((o) =>
                  field.value?.includes(o.value)
                )}
                onChange={(options) =>
                  field.onChange(options?.map((o) => o.value) || [])
                }
              />
            )}
          />
        </UiFormItem>{" "}
        <UiFormItem
          label="Message"
          invalid={!!errors.message}
          errorMessage={errors.message?.message}
        >
          <Controller
            name="message"
            control={control}
            render={({ field }) => <Input textArea {...field} rows={4} />}
          />
        </UiFormItem>{" "}
        <div className="text-right mt-6">
          <Button type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            loading={isLoading}
            disabled={!isValid}
          >
            Send
          </Button>
        </div>{" "}
      </UiForm>{" "}
    </Dialog>
  );
};

const AddCompanyScheduleDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => void;
  isLoading: boolean;
}> = ({ company, onClose, onSubmit, isLoading }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_title: `Meeting with ${company.company_name}`,
      date_time: null as any,
      notes: `Regarding company ${company.company_name} (${company.company_code}).`,
      remind_from: null,
      event_type: undefined,
    },
    mode: "onChange",
  });

  return (
    <Dialog isOpen={true} onClose={onClose}>
      <h5 className="mb-4">Add Schedule for {company.company_name}</h5>
      <UiForm onSubmit={handleSubmit(onSubmit)}>
        <UiFormItem
          label="Event Title"
          invalid={!!errors.event_title}
          errorMessage={errors.event_title?.message}
        >
          <Controller
            name="event_title"
            control={control}
            render={({ field }) => <Input {...field} autoFocus />}
          />
        </UiFormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiFormItem
            label="Event Type"
            invalid={!!errors.event_type}
            errorMessage={errors.event_type?.message}
          >
            <Controller
              name="event_type"
              control={control}
              render={({ field }) => (
                <UiSelect
                  placeholder="Select Type"
                  options={eventTypeOptions}
                  value={eventTypeOptions.find((o) => o.value === field.value)}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
          </UiFormItem>
          <UiFormItem
            label="Event Date & Time"
            invalid={!!errors.date_time}
            errorMessage={errors.date_time?.message}
          >
            <Controller
              name="date_time"
              control={control}
              render={({ field }) => (
                <DatePicker.DateTimepicker
                  placeholder="Select date & time"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </UiFormItem>
        </div>
        <UiFormItem
          label="Reminder Date & Time (Optional)"
          invalid={!!errors.remind_from}
          errorMessage={errors.remind_from?.message}
        >
          <Controller
            name="remind_from"
            control={control}
            render={({ field }) => (
              <DatePicker.DateTimepicker
                placeholder="Select reminder date & time"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </UiFormItem>
        <UiFormItem
          label="Notes"
          invalid={!!errors.notes}
          errorMessage={errors.notes?.message}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input textArea {...field} value={field.value ?? ""} />
            )}
          />
        </UiFormItem>
        <div className="text-right mt-6">
          <Button type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            loading={isLoading}
            disabled={!isValid}
          >
            Save Event
          </Button>
        </div>
      </UiForm>
    </Dialog>
  );
};
const eventTypeOptions = [
  { value: "Meeting", label: "Meeting" },
  { value: "FollowUpCall", label: "Follow-up Call" },
  { value: "Other", label: "Other" },
  { value: "IntroCall", label: "Introductory Call" },
  { value: "QBR", label: "Quarterly Business Review (QBR)" },
  { value: "CheckIn", label: "Customer Check-in" },
  { value: "OnboardingSession", label: "Onboarding Session" },
];

const AssignCompanyTaskDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
  userOptions: SelectOption[];
}> = ({ company, onClose, userOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskValidationSchema),
    defaultValues: {
      task_title: `Follow up with ${company.company_name}`,
      assign_to: [],
      priority: "Medium",
    },
    mode: "onChange",
  });
  const onAssignTask = async (data: TaskFormData) => {
    setIsLoading(true);
    const payload = {
      ...data,
      due_date: data.due_date
        ? dayjs(data.due_date).format("YYYY-MM-DD")
        : undefined,
      module_id: String(company.id),
      module_name: "Company",
    };
    try {
      await dispatch(addTaskAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Task Assigned!" />);
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Failed to Assign Task"
          children={error?.message}
        />
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog isOpen={true} onClose={onClose}>
      {" "}
      <h5 className="mb-4">Assign Task for {company.company_name}</h5>{" "}
      <UiForm onSubmit={handleSubmit(onAssignTask)}>
        {" "}
        <UiFormItem
          label="Task Title"
          invalid={!!errors.task_title}
          errorMessage={errors.task_title?.message}
        >
          <Controller
            name="task_title"
            control={control}
            render={({ field }) => <Input {...field} autoFocus />}
          />
        </UiFormItem>{" "}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {" "}
          <UiFormItem
            label="Assign To"
            invalid={!!errors.assign_to}
            errorMessage={errors.assign_to?.message}
          >
            <Controller
              name="assign_to"
              control={control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select User(s)"
                  options={userOptions}
                  value={userOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) =>
                    field.onChange(opts?.map((o) => o.value) || [])
                  }
                />
              )}
            />
          </UiFormItem>{" "}
          <UiFormItem
            label="Priority"
            invalid={!!errors.priority}
            errorMessage={errors.priority?.message}
          >
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <UiSelect
                  placeholder="Select Priority"
                  options={taskPriorityOptions}
                  value={taskPriorityOptions.find(
                    (p) => p.value === field.value
                  )}
                  onChange={(opt) => field.onChange(opt?.value)}
                />
              )}
            />
          </UiFormItem>{" "}
        </div>{" "}
        <UiFormItem
          label="Due Date (Optional)"
          invalid={!!errors.due_date}
          errorMessage={errors.due_date?.message}
        >
          <Controller
            name="due_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                placeholder="Select date"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </UiFormItem>{" "}
        <UiFormItem
          label="Description"
          invalid={!!errors.description}
          errorMessage={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => <Input textArea {...field} rows={4} />}
          />
        </UiFormItem>{" "}
        <div className="text-right mt-6">
          <Button type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            loading={isLoading}
            disabled={!isValid}
          >
            Assign Task
          </Button>
        </div>{" "}
      </UiForm>{" "}
    </Dialog>
  );
};
const ViewCompanyMembersDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => (
  <Dialog isOpen={true} onClose={onClose} width={600}>
    {" "}
    <h5 className="mb-4">Members of {company.company_name}</h5>{" "}
    <div className="max-h-96 overflow-y-auto">
      {" "}
      {company.company_member_management?.length > 0 ? (
        <div className="space-y-3">
          {company.company_member_management.map((member) => (
            <div
              key={member.id}
              className="p-3 border rounded-md dark:border-gray-600"
            >
              <p className="font-semibold">{member.person_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {member.designation}
              </p>
              <p className="text-xs text-gray-500">{member.number}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No members found.</p>
      )}{" "}
    </div>{" "}
    <div className="text-right mt-6">
      <Button variant="solid" onClick={onClose}>
        Close
      </Button>
    </div>{" "}
  </Dialog>
);
const ViewCompanyDataDialog: React.FC<{
  title: string;
  message: string;
  onClose: () => void;
}> = ({ title, message, onClose }) => (
  <Dialog isOpen={true} onClose={onClose}>
    {" "}
    <h5 className="mb-4">{title}</h5> <p>{message}</p>{" "}
    <div className="text-right mt-6">
      <Button variant="solid" onClick={onClose}>
        Close
      </Button>
    </div>{" "}
  </Dialog>
);
const DownloadDocumentDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  const documents = useMemo(() => {
    const allDocs: { name: string; url: string }[] = [];
    const addDoc = (name: string, path: string | null | undefined) => {
      if (path) {
        allDocs.push({ name, url: path });
      }
    };
    addDoc("206AB Form", company["206AB_file"]);
    addDoc("ABCQ Form", company.ABCQ_file);
    addDoc("Office Photo", company.office_photo_file);
    addDoc("GST Certificate", company.gst_certificate_file);
    addDoc("Authority Letter", company.authority_letter_file);
    addDoc("Visiting Card", company.visiting_card_file);
    addDoc("Cancel Cheque", company.cancel_cheque_file);
    addDoc("Aadhar Card", company.aadhar_card_file);
    addDoc("PAN Card", company.pan_card_file);
    addDoc("Other Document", company.other_document_file);
    company.company_certificate?.forEach((cert) =>
      addDoc(
        cert.certificate_name || `Certificate #${cert.id}`,
        cert.upload_certificate_path
      )
    );
    company.billing_documents?.forEach((doc) =>
      addDoc(doc.document_name, doc.document)
    );
    company.company_bank_details?.forEach((bank, index) =>
      addDoc(
        `Bank Verification Photo (${bank.bank_name || index + 1})`,
        bank.verification_photo
      )
    );
    return allDocs.sort((a, b) => a.name.localeCompare(b.name));
  }, [company]);
  return (
    <Dialog isOpen={true} onClose={onClose} width={600}>
      {" "}
      <h5 className="mb-4">
        Download Documents for {company.company_name}
      </h5>{" "}
      <div className="max-h-96 overflow-y-auto">
        {" "}
        {documents.length > 0 ? (
          <div className="space-y-2">
            {" "}
            {documents.map((doc, index) => (
              <a
                key={index}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
              >
                {" "}
                <span className="flex items-center gap-2">
                  <TbFileDescription className="text-lg" />
                  {doc.name}
                </span>{" "}
                <TbDownload className="text-lg text-blue-500" />{" "}
              </a>
            ))}{" "}
          </div>
        ) : (
          <p>No documents available for download.</p>
        )}{" "}
      </div>{" "}
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>{" "}
    </Dialog>
  );
};
const activitySchema = z.object({
  item: z
    .string()
    .min(3, "Activity item is required and must be at least 3 characters."),
  notes: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;

const AddActivityDialog: React.FC<{
  company: CompanyItem;
  onClose: () => void;
  user: any;
}> = ({ company, onClose, user }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: { item: `Follow up on ${company.company_name}`, notes: "" },
    mode: "onChange",
  });

  const onAddActivity = async (data: ActivityFormData) => {
    setIsLoading(true);
    const payload = {
      item: data.item,
      notes: data.notes || "",
      module_id: String(company.id),
      module_name: "Company",
      user_id: user.id,
    };
    try {
      await dispatch(addAllActionAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Activity Added" />);
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Failed to Add Activity"
          children={error?.message || "An unknown error occurred."}
        />
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Activity Log for "{company.company_name}"</h5>
      <Form onSubmit={handleSubmit(onAddActivity)}>
        <FormItem
          label="Activity"
          invalid={!!errors.item}
          errorMessage={errors.item?.message}
        >
          <Controller
            name="item"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Followed up with member" />
            )}
          />
        </FormItem>
        <FormItem
          label="Notes (Optional)"
          invalid={!!errors.notes}
          errorMessage={errors.notes?.message}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input
                textArea
                {...field}
                placeholder="Add relevant details..."
              />
            )}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button
            type="button"
            className="mr-2"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            loading={isLoading}
            disabled={!isValid || isLoading}
            icon={<TbCheck />}
          >
            Save Activity
          </Button>
        </div>
      </Form>
    </Dialog>
  );
};
const SendEmailAction: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  useEffect(() => {
    if (!company.primary_email_id) {
      toast.push(
        <Notification
          type="warning"
          title="Missing Email"
          children="Primary email is not available."
        />
      );
      onClose();
      return;
    }
    const subject = `Regarding Company: ${company.company_name}`;
    const body = `Hello ${
      company.owner_name || company.company_name
    },\n\nThis is regarding your company profile (ID: ${company.id}).`;
    window.open(
      `mailto:${company.primary_email_id}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`
    );
    onClose();
  }, [company, onClose]);
  return null;
};
const SendWhatsAppAction: React.FC<{
  company: CompanyItem;
  onClose: () => void;
}> = ({ company, onClose }) => {
  useEffect(() => {
    const phone = company.primary_contact_number?.replace(/\D/g, "");
    const countryCode = company.primary_contact_number_code?.replace(/\D/g, "");
    if (!phone || !countryCode) {
      toast.push(
        <Notification
          type="warning"
          title="Missing Number"
          children="Primary contact number is not available."
        />
      );
      onClose();
      return;
    }
    const fullPhoneNumber = `${countryCode}${phone}`;
    const message = `Hello ${
      company.owner_name || company.company_name
    },\n\nThis is regarding your company profile with us.`;
    window.open(
      `https://wa.me/${fullPhoneNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
    onClose();
  }, [company, onClose]);
  return null;
};

const CompanyModals: React.FC<CompanyModalsProps> = ({
  modalState,
  onClose,
  getAllUserDataOptions,
}) => {
  const { type, data: company, isOpen } = modalState;
  const dispatch = useAppDispatch();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const { useEncryptApplicationStorage } = config;
    try {
      setUserData(
        encryptStorage.getItem("UserData", !useEncryptApplicationStorage)
      );
    } catch (error) {
      console.error("Error getting UserData:", error);
    }
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmSchedule = async (data: ScheduleFormData) => {
    if (!company) return;
    setIsSubmitting(true);
    const payload = {
      module_id: Number(company.id),
      module_name: "Member",
      event_title: data.event_title,
      event_type: data.event_type,
      date_time: dayjs(data.date_time).format("YYYY-MM-DDTHH:mm:ss"),
      ...(data.remind_from && {
        remind_from: dayjs(data.remind_from).format("YYYY-MM-DDTHH:mm:ss"),
      }),
      notes: data.notes || "",
    };
    try {
      await dispatch(addScheduleAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Event Scheduled" />);
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Scheduling Failed"
          children={error?.message}
        />
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !company) return null;
  switch (type) {
    case "email":
      return <SendEmailAction company={company} onClose={onClose} />;
    case "whatsapp":
      return <SendWhatsAppAction company={company} onClose={onClose} />;
    case "viewDetail":
      return <ViewCompanyDetailDialog company={company} onClose={onClose} />;
    case "notification":
      return (
        <AddCompanyNotificationDialog
          company={company}
          onClose={onClose}
          getAllUserDataOptions={getAllUserDataOptions}
        />
      );
    case "schedule":
      return (
        <AddCompanyScheduleDialog
          company={company}
          onClose={onClose}
          onSubmit={handleConfirmSchedule}
          isLoading={isSubmitting}
        />
      );
    case "task":
      return (
        <AssignCompanyTaskDialog
          company={company}
          onClose={onClose}
          userOptions={getAllUserDataOptions}
        />
      );
    case "members":
      return <ViewCompanyMembersDialog company={company} onClose={onClose} />;
    case "alert":
      return (
        <CompanyAlertModal
          company={company}
          onClose={onClose}
          user={userData}
        />
      );
    case "activity":
      return (
        <AddActivityDialog
          company={company}
          onClose={onClose}
          user={userData}
        />
      );
    case "transaction":
      return (
        <ViewCompanyDataDialog
          title={`Transactions for ${company.company_name}`}
          message="No transactions found for this company."
          onClose={onClose}
        />
      );
    case "document":
      return <DownloadDocumentDialog company={company} onClose={onClose} />;
    default:
      return null;
  }
};

// --- Child Components ---
const CompanyListContext = createContext<
  | {
      companyList: CompanyItem[];
      setSelectedCompanies: React.Dispatch<React.SetStateAction<CompanyItem[]>>;
      companyCount: any;
      ContinentsData: any[];
      CountriesData: any[];
      getAllUserData: SelectOption[];
      selectedCompanies: CompanyItem[];
    }
  | undefined
>(undefined);
const useCompanyList = () => {
  const context = useContext(CompanyListContext);
  if (!context)
    throw new Error("useCompanyList must be used within a CompanyListProvider");
  return context;
};
const CompanyListProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    CompanyData,
    CountriesData,
    ContinentsData,
    getAllUserData = [],
  } = useSelector(masterSelector);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyItem[]>([]);
  const getAllUserDataOptions = useMemo(
    () =>
      Array.isArray(getAllUserData)
        ? getAllUserData.map((b) => ({ value: b.id, label: b.name }))
        : [],
    [getAllUserData]
  );
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getCompanyAction());
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
    dispatch(getAllUsersAction());
    dispatch(getDocumentTypeAction());
  }, [dispatch]);
  return (
    <CompanyListContext.Provider
      value={{
        companyList: CompanyData?.data ?? [],
        setSelectedCompanies,
        companyCount: CompanyData?.counts ?? {},
        selectedCompanies,
        ContinentsData: Array.isArray(ContinentsData) ? ContinentsData : [],
        CountriesData: Array.isArray(CountriesData) ? CountriesData : [],
        getAllUserData: getAllUserDataOptions,
      }}
    >
      {children}
    </CompanyListContext.Provider>
  );
};

// --- EnableBillingDialog Component ---
const enableBillingSchema = z.object({
  enable_billing_documents: z
    .array(
      z.object({
        document_name: z.object(
          { value: z.string(), label: z.string() },
          { required_error: "Document type is required" }
        ),
        document: z
          .any()
          .refine((file) => file instanceof File, "File is required"),
      })
    )
    .min(1, "At least one document is required.")
    .max(4, "You can upload a maximum of 4 documents."),
});
type EnableBillingFormData = z.infer<typeof enableBillingSchema>;

interface EnableBillingDialogProps {
  company: CompanyItem;
  onClose: () => void;
  onSubmit: (data: EnableBillingFormData) => void;
  isSubmitting: boolean;
  documentTypeOptions: SelectOption[];
}

const EnableBillingDialog: React.FC<EnableBillingDialogProps> = ({
  company,
  onClose,
  onSubmit,
  isSubmitting,
  documentTypeOptions,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EnableBillingFormData>({
    resolver: zodResolver(enableBillingSchema),
    defaultValues: { enable_billing_documents: [{}] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "enable_billing_documents",
  });

  return (
    <Dialog isOpen={true} onClose={onClose} width={600}>
      <h5 className="mb-4">
        Enable Billing Documents for: {company.company_name}
      </h5>
      <UiForm id="enableBillingForm" onSubmit={handleSubmit(onSubmit)}>
        <div className="max-h-[50vh] overflow-y-auto pr-4">
          <div className="space-y-4">
            {fields.map((field, index) => (
              <Card
                key={field.id}
                className="p-4 border dark:border-gray-600 relative"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <FormItem
                    label={`Document Type ${index + 1}`}
                    invalid={
                      !!errors.enable_billing_documents?.[index]?.document_name
                    }
                    errorMessage={
                      errors.enable_billing_documents?.[index]?.document_name
                        ?.message as string
                    }
                  >
                    <Controller
                      name={`enable_billing_documents.${index}.document_name`}
                      control={control}
                      render={({ field }) => (
                        <UiSelect
                          placeholder="Select type..."
                          options={documentTypeOptions}
                          {...field}
                          menuPortalTarget={document.body}
                          styles={{
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      )}
                    />
                  </FormItem>
                  <FormItem
                    label={`Upload File ${index + 1}`}
                    invalid={
                      !!errors.enable_billing_documents?.[index]?.document
                    }
                    errorMessage={
                      errors.enable_billing_documents?.[index]?.document
                        ?.message as string
                    }
                  >
                    <Controller
                      name={`enable_billing_documents.${index}.document`}
                      control={control}
                      render={({ field: { onChange } }) => (
                        <Input
                          type="file"
                          onChange={(e) => onChange(e.target.files?.[0])}
                        />
                      )}
                    />
                  </FormItem>
                </div>
                {fields.length > 1 && (
                  <Button
                    shape="circle"
                    size="sm"
                    variant="plain"
                    icon={<TbTrash />}
                    className="absolute top-2 right-2 text-red-500"
                    onClick={() => remove(index)}
                  />
                )}
              </Card>
            ))}
          </div>
        </div>

        {fields.length < 4 && (
          <Button
            type="button"
            icon={<TbPlus />}
            onClick={() => append({ document_name: undefined, document: null })}
            size="sm"
            className="mt-4"
          >
            Add More
          </Button>
        )}
      </UiForm>
      <div className="text-right mt-6">
        <Button className="mr-2" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="solid"
          type="submit"
          form="enableBillingForm"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Submit
        </Button>
      </div>
    </Dialog>
  );
};

const CompanyActionColumn = ({
  rowData,
  onEdit,
  onOpenModal,
  onOpenEnableBillingModal,
}: {
  rowData: CompanyItem;
  onEdit: (id: number) => void;
  onOpenModal: (type: ModalType, data: CompanyItem) => void;
  onOpenEnableBillingModal: (data: CompanyItem) => void;
}) => {
  const navigate = useNavigate();
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
          onClick={() =>
            navigate(`/business-entities/company-view/${rowData.id}`)
          }
        >
          <TbEye />
        </div>
      </Tooltip>
      <Dropdown
        renderTitle={
          <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
        }
      >
        <Dropdown.Item
          onClick={() => onOpenModal("email", rowData)}
          className="flex items-center gap-2"
        >
          <TbMail size={18}/> Send Email
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("whatsapp", rowData)}
          className="flex items-center gap-2"
        >
          <TbBrandWhatsapp size={18}/> Send WhatsApp
        </Dropdown.Item>
        {rowData.need_enable ? (
          <Dropdown.Item
            onClick={() => onOpenEnableBillingModal(rowData)}
            className="flex items-center gap-2"
          >
            <TbShieldCheck size={18}/> Check Eligibility
          </Dropdown.Item>
        ) : null}
        <Dropdown.Item
          onClick={() => onOpenModal("notification", rowData)}
          className="flex items-center gap-2"
        >
          <TbBell size={18}/> Add Notification
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("schedule", rowData)}
          className="flex items-center gap-2"
        >
          <TbCalendarEvent size={18}/> Add Schedule
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("task", rowData)}
          className="flex items-center gap-2"
        >
          <TbUser size={18}/> Assign Task
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("members", rowData)}
          className="flex items-center gap-2"
        >
          <TbUsersGroup size={18}/> View Members
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("alert", rowData)}
          className="flex items-center gap-2"
        >
          <TbAlarm size={18}/> View Alert
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("activity", rowData)}
          className="flex items-center gap-2"
        >
          <TbTagStarred  /> Add Activity
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("document", rowData)}
          className="flex items-center gap-2"
        >
          <TbDownload size={18}/> Download Document
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};
const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
}: {
  filterData: CompanyFilterFormData;
  onRemoveFilter: (key: keyof CompanyFilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const filterKeyToLabelMap: Record<string, string> = {
    filterStatus: "Status",
    filterCompanyType: "Type",
    filterContinent: "Continent",
    filterCountry: "Country",
    filterState: "State",
    filterCity: "City",
    filterKycVerified: "KYC",
    filterEnableBilling: "Billing",
  };
  const activeFiltersList = Object.entries(filterData).flatMap(
    ([key, value]) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return [];
      if (key === "filterCreatedDate") {
        const dateArray = value as [Date | null, Date | null];
        if (dateArray[0] && dateArray[1]) {
          return [
            {
              key,
              value: "date-range",
              label: `Date: ${dateArray[0].toLocaleDateString()} - ${dateArray[1].toLocaleDateString()}`,
            },
          ];
        }
        return [];
      }
      if (key === "customFilter") {
        return [{ key, value: "custom", label: `Custom Filter: ${value}` }];
      }
      if (Array.isArray(value)) {
        return value
          .filter((item) => item !== null && item !== undefined)
          .map((item: { value: string; label: string }) => ({
            key,
            value: item.value,
            label: `${filterKeyToLabelMap[key] || "Filter"}: ${item.label}`,
          }));
      }
      return [];
    }
  );
  if (activeFiltersList.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {activeFiltersList.map((filter) => (
        <Tag
          key={`${filter.key}-${filter.value}`}
          prefix
          className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
        >
          {filter.label}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() =>
              onRemoveFilter(
                filter.key as keyof CompanyFilterFormData,
                filter.value
              )
            }
          />
        </Tag>
      ))}
      <Button
        size="xs"
        variant="plain"
        className="text-red-600 hover:text-red-500 hover:underline ml-auto"
        onClick={onClearAll}
      >
        Clear All
      </Button>
    </div>
  );
};

const CompanyListTable = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    companyList,
    setSelectedCompanies,
    companyCount,
    ContinentsData,
    CountriesData,
    getAllUserData,
  } = useCompanyList();
  const { PendingBillData = [], DocumentTypeData } =
    useSelector(masterSelector);
  const [isLoading, setIsLoading] = useState(false);
  const COMPANY_STATE_STORAGE_KEY = "companyListStatePersistence";

  const [isEnableBillingModalOpen, setEnableBillingModalOpen] = useState(false);
  const [selectedCompanyForBilling, setSelectedCompanyForBilling] =
    useState<CompanyItem | null>(null);
  const [isSubmittingBilling, setIsSubmittingBilling] = useState(false);

  // --- START: State and handlers for the Document Viewer ---
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    docs: DocumentRecord[];
    index: number;
  }>({
    isOpen: false,
    docs: [],
    index: 0,
  });

  const handleOpenViewer = (docs: DocumentRecord[], index: number) => {
    setViewerState({ isOpen: true, docs, index });
  };
  const handleCloseViewer = () => {
    setViewerState({ isOpen: false, docs: [], index: 0 });
  };
  const handleNext = () => {
    setViewerState((prev) => ({
      ...prev,
      index: Math.min(prev.index + 1, prev.docs.length - 1),
    }));
  };
  const handlePrev = () => {
    setViewerState((prev) => ({
      ...prev,
      index: Math.max(prev.index - 1, 0),
    }));
  };
  // --- END: State and handlers for the Document Viewer ---

  const documentTypeOptions = useMemo(() => {
    return Array.isArray(DocumentTypeData)
      ? DocumentTypeData.map((d: any) => ({
          value: String(d.id),
          label: d.name,
        }))
      : [];
  }, [DocumentTypeData]);

  const getInitialState = () => {
    try {
      const savedStateJSON = sessionStorage.getItem(COMPANY_STATE_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.filterCriteria?.filterCreatedDate) {
          savedState.filterCriteria.filterCreatedDate =
            savedState.filterCriteria.filterCreatedDate.map(
              (d: string | null) => (d ? new Date(d) : null)
            );
        }
        return savedState;
      }
    } catch (error) {
      console.error("Failed to parse saved state, clearing it.", error);
      sessionStorage.removeItem(COMPANY_STATE_STORAGE_KEY);
    }
    return {
      tableData: {
        pageIndex: 1,
        pageSize: 10,
        sort: { order: "", key: "" },
        query: "",
      },
      filterCriteria: { filterCreatedDate: [null, null] },
    };
  };

  const initialState = getInitialState();
  const [tableData, setTableData] = useState<TableQueries>(
    initialState.tableData
  );
  const [filterCriteria, setFilterCriteria] = useState<
    CompanyFilterFormData & { customFilter?: string }
  >(initialState.filterCriteria);

  useEffect(() => {
    try {
      const stateToSave = { tableData, filterCriteria };
      sessionStorage.setItem(
        COMPANY_STATE_STORAGE_KEY,
        JSON.stringify(stateToSave)
      );
    } catch (error) {
      console.error("Could not save state to sessionStorage:", error);
    }
  }, [tableData, filterCriteria]);

  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const [isPendingRequestModalOpen, setPendingRequestModalOpen] =
    useState(false);

  const handleOpenPendingRequestModal = () => {
    dispatch(getPendingBillAction());
    setPendingRequestModalOpen(true);
  };

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });
  const filterFormMethods = useForm<CompanyFilterFormData>({
    resolver: zodResolver(companyFilterFormSchema),
  });

  const handleSetTableData = (d: Partial<TableQueries>) =>
    setTableData((p) => ({ ...p, ...d }));
  const handleOpenModal = (type: ModalType, companyData: CompanyItem) =>
    setModalState({ isOpen: true, type, data: companyData });
  const handleCloseModal = () =>
    setModalState({ isOpen: false, type: null, data: null });

  const handleOpenEnableBillingModal = (companyData: CompanyItem) => {
    setSelectedCompanyForBilling(companyData);
    setEnableBillingModalOpen(true);
  };

  const handleCloseEnableBillingModal = () => {
    setSelectedCompanyForBilling(null);
    setEnableBillingModalOpen(false);
  };

  const handleEnableBillingSubmit = async (formData: EnableBillingFormData) => {
    if (!selectedCompanyForBilling) return;
    setIsSubmittingBilling(true);

    const payload = new FormData();

    formData.enable_billing_documents.forEach((doc, index) => {
      if (doc.document_name?.value && doc.document) {
        payload.append(
          `enable_billing_documents[${index}][document_name]`,
          doc.document_name.value
        );
        payload.append(
          `enable_billing_documents[${index}][document]`,
          doc.document
        );
      }
    });

    try {
      await dispatch(
        setsavedocAction({ id: selectedCompanyForBilling.id, data: payload })
      ).unwrap();
      toast.push(
        <Notification
          type="success"
          title="Documents Submitted"
          duration={3000}
        >
          Billing documents saved successfully.
        </Notification>
      );
      dispatch(getCompanyAction());
      handleCloseEnableBillingModal();
    } catch (error: any) {
      toast.push(
        <Notification type="danger" title="Submission Failed" duration={3000}>
          {error?.message || "Failed to submit documents."}
        </Notification>
      );
    } finally {
      setIsSubmittingBilling(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setFilterDrawerOpen(true);
  };
  const onApplyFiltersSubmit = (data: CompanyFilterFormData) => {
    setFilterCriteria({ ...data, customFilter: undefined });
    handleSetTableData({ pageIndex: 1 });
    setFilterDrawerOpen(false);
  };

  const onClearFilters = () => {
    const defaultFilters = {
      customFilter: undefined,
      filterCreatedDate: [null, null] as [Date | null, Date | null],
      filterStatus: [],
      filterCompanyType: [],
      filterContinent: [],
      filterCountry: [],
      filterState: [],
      filterCity: [],
      filterKycVerified: [],
      filterEnableBilling: [],
    };
    setFilterCriteria(defaultFilters);
    handleSetTableData({
      pageIndex: 1,
      query: "",
      sort: { order: "", key: "" },
    });
    sessionStorage.removeItem(COMPANY_STATE_STORAGE_KEY);
  };

  const handleRemoveFilter = (
    key: keyof CompanyFilterFormData,
    valueToRemove: string
  ) => {
    setFilterCriteria((prev) => {
      const newCriteria = { ...prev, customFilter: undefined };
      if (key === "filterCreatedDate") {
        (newCriteria as any)[key] = [null, null];
      } else {
        const currentFilterArray = newCriteria[key] as
          | { value: string; label: string }[]
          | undefined;
        if (currentFilterArray) {
          (newCriteria as any)[key] = currentFilterArray.filter(
            (item) => item.value !== valueToRemove
          );
        }
      }
      return newCriteria;
    });
    handleSetTableData({ pageIndex: 1 });
  };

  const onRefreshData = () => {
    onClearFilters();
    dispatch(getCompanyAction());
    toast.push(
      <Notification title="Data Refreshed" type="success" duration={2000} />
    );
  };

  const handleCardClick = (
    cardType:
      | "active"
      | "inactive"
      | "disabled"
      | "verified"
      | "non_verified"
      | "eligible"
      | "not_eligible"
  ) => {
    const defaultFilters = {
      filterCreatedDate: [null, null] as [Date | null, Date | null],
      filterStatus: [],
      filterCompanyType: [],
      filterContinent: [],
      filterCountry: [],
      filterState: [],
      filterCity: [],
      filterKycVerified: [],
      filterEnableBilling: [],
      customFilter: undefined,
    };
    let newCriteria: CompanyFilterFormData & { customFilter?: string } = {
      ...defaultFilters,
    };

    switch (cardType) {
      case "active":
        newCriteria.filterStatus = [{ value: "Active", label: "Active" }];
        break;
      case "inactive":
        newCriteria.filterStatus = [{ value: "Inactive", label: "Inactive" }];
        break;
      case "disabled":
        newCriteria.filterStatus = [{ value: "disabled", label: "Disabled" }];
        break;
      case "verified":
        newCriteria.filterKycVerified = [{ value: "Yes", label: "Yes" }];
        break;
      case "non_verified":
        newCriteria.filterKycVerified = [{ value: "No", label: "No" }];
        break;
      case "eligible":
        newCriteria.filterKycVerified = [{ value: "Yes", label: "Yes" }];
        newCriteria.filterEnableBilling = [{ value: "Yes", label: "Yes" }];
        break;
      case "not_eligible":
        newCriteria.customFilter = "not_eligible";
        break;
    }
    setFilterCriteria(newCriteria);
    handleSetTableData({ pageIndex: 1, query: "" });
  };

  const { pageData, total, allFilteredAndSortedData, activeFilterCount } =
    useMemo(() => {
      let filteredData = [...companyList];

      if (filterCriteria.customFilter === "not_eligible") {
        filteredData = filteredData.filter(
          (company) => !company.kyc_verified || !company.enable_billing
        );
      } else {
        if (
          filterCriteria.filterStatus &&
          filterCriteria.filterStatus.length > 0
        ) {
          const selectedStatuses = filterCriteria.filterStatus.map((s) =>
            s.value.toLowerCase()
          );
          filteredData = filteredData.filter(
            (company) =>
              company.status &&
              selectedStatuses.includes(company.status.toLowerCase())
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
              company.country &&
              selectedCountries.includes(company.country.name)
          );
        }
        if (
          filterCriteria.filterState &&
          filterCriteria.filterState.length > 0
        ) {
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
              createdDate >= (startDate as Date) &&
              createdDate <= inclusiveEndDate
            );
          });
        }
      }

      if (tableData.query) {
        const lowerCaseQuery = tableData.query?.toLowerCase();
        filteredData = filteredData.filter((company) => {
          const searchableFields = [
            company.company_name,
            company.company_code,
            company.owner_name,
            company.primary_email_id,
            company.primary_contact_number,
            company.gst_number,
            company.pan_number,
            company.city,
            company.state,
            company.country?.name,
          ];
          return searchableFields.some(
            (field) =>
              field && String(field).toLowerCase().includes(lowerCaseQuery)
          );
        });
      }

      let count = 0;
      if (filterCriteria.customFilter) count++;
      count += (filterCriteria.filterStatus?.length ?? 0) > 0 ? 1 : 0;
      count += (filterCriteria.filterCompanyType?.length ?? 0) > 0 ? 1 : 0;
      count += (filterCriteria.filterContinent?.length ?? 0) > 0 ? 1 : 0;
      count += (filterCriteria.filterCountry?.length ?? 0) > 0 ? 1 : 0;
      count += (filterCriteria.filterState?.length ?? 0) > 0 ? 1 : 0;
      count += (filterCriteria.filterCity?.length ?? 0) > 0 ? 1 : 0;
      count += (filterCriteria.filterKycVerified?.length ?? 0) > 0 ? 1 : 0;
      count += (filterCriteria.filterEnableBilling?.length ?? 0) > 0 ? 1 : 0;
      count +=
        filterCriteria.filterCreatedDate?.[0] &&
        filterCriteria.filterCreatedDate?.[1]
          ? 1
          : 0;

      const { order, key } = tableData.sort as OnSortParam;
      if (order && key) {
        filteredData.sort((a, b) => {
          let av = a[key as keyof CompanyItem] as any;
          let bv = b[key as keyof CompanyItem] as any;
          if (key.includes(".")) {
            const keys = key.split(".");
            av = keys.reduce(
              (obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined),
              a
            );
            bv = keys.reduce(
              (obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined),
              b
            );
          }
          av = av ?? "";
          bv = bv ?? "";
          if (typeof av === "string" && typeof bv === "string")
            return order === "asc"
              ? av.localeCompare(bv)
              : bv.localeCompare(av);
          if (typeof av === "number" && typeof bv === "number")
            return order === "asc" ? av - bv : bv - av;
          if (typeof av === "boolean" && typeof bv === "boolean")
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
          return 0;
        });
      }

      const pI = tableData.pageIndex as number;
      const pS = tableData.pageSize as number;
      return {
        pageData: filteredData.slice((pI - 1) * pS, pI * pS),
        total: filteredData.length,
        allFilteredAndSortedData: filteredData,
        activeFilterCount: count,
      };
    }, [companyList, tableData, filterCriteria]);

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData.length) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset();
    setIsExportReasonModalOpen(true);
  };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const fileName = `companies_export_${dayjs().format("YYYYMMDD")}.csv`;
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: "Company",
          file_name: fileName,
        })
      ).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );
      const exportSuccess = exportToCsv(fileName, allFilteredAndSortedData);
      if (exportSuccess) setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Submit Reason" type="danger">
          {error.message}
        </Notification>
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };
  const handleEditCompany = (id: number) =>
    navigate(`/business-entities/company-edit/${id}`);
  const handlePaginationChange = (p: number) =>
    handleSetTableData({ pageIndex: p });
  const handleSelectChange = (v: number) =>
    handleSetTableData({ pageSize: v, pageIndex: 1 });
  const handleSort = (s: OnSortParam) =>
    handleSetTableData({ sort: s, pageIndex: 1 });
  const handleRowSelect = (c: boolean, r: CompanyItem) =>
    setSelectedCompanies((p) =>
      c ? [...p, r] : p.filter((i) => i.id !== r.id)
    );
  const handleAllRowSelect = (c: boolean, r: Row<CompanyItem>[]) =>
    setSelectedCompanies(c ? r.map((i) => i.original) : []);

  const handleApprovePendingRequest = async (company: {
    id: number;
    company_name: string;
  }) => {
    try {
      await dispatch(setenablebillingAction(company.id)).unwrap();
      dispatch(getCompanyAction());
      toast.push(
        <Notification
          title={`Billing approved for ${company.company_name}`}
          type="success"
        />
      );
    } catch (e: any) {
      toast.push(
        <Notification
          title={`Failed to approve billing for ${company.company_name}`}
          type="danger"
        />
      );
    }
  };

  const handleRejectPendingRequest = (companyData: any) => {
    setPendingRequestModalOpen(false);
    const companyForItem: Partial<CompanyItem> = {
      id: companyData.id,
      company_name: companyData.company_name,
      company_code: companyData.company_code,
    };
    handleOpenModal("notification", companyForItem as CompanyItem);
  };

  const columns: ColumnDef<CompanyItem>[] = useMemo(
    () => [
      {
        header: "Company Info",
        accessorKey: "company_name",
        id: "companyInfo",
        size: 220,
        cell: ({ row }: { row: Row<CompanyItem> }) => {
          const {
            company_name,
            ownership_type,
            primary_business_type,
            country,
            city,
            state,
            company_logo,
            company_code,
            id,
          } = row.original;
          return (
            <div className="flex flex-col">
              {" "}
              <div className="flex items-center gap-2">
                <div>
                  <Link
                    to={`/business-entities/company-view/${id}`}
                    className="no-underline hover:underline"
                  >
                    <h6 className="text-xs font-semibold text-blue-600">
                      {company_code || "Company Code"}
                    </h6>
                    <span className="text-xs font-semibold leading-1">
                      {company_name}
                    </span>
                  </Link>
                </div>
              </div>
              <span className="text-xs mt-1">
                <b>Ownership Type:</b> {ownership_type || "N/A"}
              </span>{" "}
              <div className="text-xs text-gray-500">
                {country?.name || "N/A"}
              </div>{" "}
            </div>
          );
        },
      },
      {
        header: "Contact",
        accessorKey: "owner_name",
        id: "contact",
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
              {" "}
              {owner_name && (
                <span>
                  <b>Owner: </b> {owner_name}
                </span>
              )}{" "}
              {primary_contact_number && (
                <span>
                  {primary_contact_number_code} {primary_contact_number}
                </span>
              )}{" "}
              {primary_email_id && (
                <a
                  href={`mailto:${primary_email_id}`}
                  className="text-blue-600 hover:underline"
                >
                  {primary_email_id}
                </a>
              )}{" "}
              {company_website && (
                <a
                  href={company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {company_website}
                </a>
              )}{" "}
            </div>
          );
        },
      },
      {
        header: "Identity & Status",
        accessorKey: "status",
        id: "legal",
        size: 180,
        cell: ({ row }) => {
          const { gst_number, pan_number, status } = row.original;
          return (
            <div className="flex flex-col gap-0.5 text-[11px]">
              {" "}
              {gst_number && (
                <div>
                  <b>GST:</b> <span className="break-all">{gst_number}</span>
                </div>
              )}{" "}
              {pan_number && (
                <div>
                  <b>PAN:</b> <span className="break-all">{pan_number}</span>
                </div>
              )}{" "}
              <Tag
                className={`${getCompanyStatusClass(
                  status
                )} capitalize mt-1 self-start !text-[11px] px-2 py-1`}
              >
                {status}
              </Tag>{" "}
            </div>
          );
        },
      },
      {
        header: "Profile & Scores",
        accessorKey: "profile_completion",
        id: "profile",
        size: 190,
        cell: ({ row }) => {
          const {
            members_count = 0,
            teams_count = 0,
            profile_completion = 0,
            kyc_verified,
            enable_billing,
            due_after_3_months_date,
          } = row.original;
          const formattedDate = due_after_3_months_date
            ? dayjs(due_after_3_months_date).format("D MMM, YYYY")
            : "N/A";

            function formatDueDateInDays(dueDateString :any) {
  // Create Date objects for the due date and today
  const dueDate = new Date(dueDateString);
  const today = new Date();

  // To ensure we're comparing days, not times, reset the time part to midnight
  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  // Calculate the difference in milliseconds
  const diffTime = dueDate.getTime() - today.getTime();

  // Convert the difference from milliseconds to days
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Return a formatted string based on the difference
  if (diffDays > 1) {
    return `in ${diffDays} days`;
  } else if (diffDays === 1) {
    return `Tomorrow`;
  } else if (diffDays === 0) {
    return `Today`;
  } else if (diffDays === -1) {
    return `Yesterday (1 day overdue)`;
  } else {
    // The date is in the past
    return `N/A`;
  }
}
          return (
            <div className="flex flex-col gap-1 text-xs">
              {" "}
              <span>
                <b>Members:</b> {members_count}
              </span>{" "}
              <span>
                <b>Teams:</b> {teams_count}
              </span>{" "}
              <div className="flex gap-1 items-center">
                <b>KYC Verified:</b>
                <Tooltip title={`KYC: ${kyc_verified ? "Yes" : "No"}`}>
                  {kyc_verified ? (
                    <MdCheckCircle className="text-green-500 text-lg" />
                  ) : (
                    <MdCancel className="text-red-500 text-lg" />
                  )}
                </Tooltip>
              </div>{" "}
              <div className="flex gap-1 items-center">
                <b>Enable Billing:</b>
                <Tooltip title={`Billing: ${enable_billing ? "Yes" : "No"}`}>
                  {enable_billing ? (
                    <MdCheckCircle className="text-green-500 text-lg" />
                  ) : (
                    <MdCancel className="text-red-500 text-lg" />
                  )}
                </Tooltip>
              </div>{" "}
              <span>
                <b>Enable Billing Due:</b> {formatDueDateInDays(formattedDate)}
              </span>{" "}
              <Tooltip title={`Profile Completion ${profile_completion}%`}>
                {" "}
                <div className="h-2.5 w-full rounded-full bg-gray-300">
                  {" "}
                  <div
                    className="rounded-full h-2.5 bg-blue-500"
                    style={{ width: `${profile_completion}%` }}
                  ></div>{" "}
                </div>{" "}
              </Tooltip>{" "}
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
            onOpenModal={handleOpenModal}
            onOpenEnableBillingModal={handleOpenEnableBillingModal}
          />
        ),
      },
    ],
    [handleOpenModal, navigate]
  );

  const [filteredColumns, setFilteredColumns] = useState(columns);
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const isColumnVisible = (colId: string) =>
    filteredColumns.some((c) => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      const originalColumn = columns.find(
        (c) => (c.id || c.accessorKey) === colId
      );
      if (originalColumn) {
        setFilteredColumns((prev) => {
          const newCols = [...prev, originalColumn];
          newCols.sort((a, b) => {
            const indexA = columns.findIndex(
              (c) => (c.id || c.accessorKey) === (a.id || a.accessorKey)
            );
            const indexB = columns.findIndex(
              (c) => (c.id || c.accessorKey) === (b.id || b.accessorKey)
            );
            return indexA - indexB;
          });
          return newCols;
        });
      }
    } else {
      setFilteredColumns((prev) =>
        prev.filter((c) => (c.id || c.accessorKey) !== colId)
      );
    }
  };

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.status)))
        .filter(Boolean)
        .map((s) => ({ value: s, label: s })),
    [companyList]
  );
  const companyTypeOptions = useMemo(
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
  const cardClass =
    "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-1";

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h5>Company</h5>

        <div className="flex flex-col md:flex-row gap-3">
          <Button
            icon={<TbUsersGroup />}
            onClick={handleOpenPendingRequestModal}
            className="w-full sm:w-auto"
          >
            Pending Request
          </Button>
          <Button
            variant="solid"
            icon={<TbPlus className="text-lg" />}
            onClick={() => navigate("/business-entities/company-create")}
          >
            Add New
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 mb-4 gap-2">
        <Tooltip title="Click to show all companies">
          <div onClick={onClearFilters}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-blue-200")}
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbBuilding size={16} />
              </div>
              <div className="flex flex-col gap-0">
                <b className="text-sm ">{companyCount?.total ?? 0}</b>
                <span className="text-[9px] font-semibold">Total</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show Active companies">
          <div onClick={() => handleCardClick("active")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-green-200")}
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbBuildingBank size={16} />
              </div>
              <div className="flex flex-col gap-0">
                <b className="text-sm pb-0 mb-0">{companyCount?.active ?? 0}</b>
                <span className="text-[9px] font-semibold">Active</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show Inactive companies">
          <div onClick={() => handleCardClick("inactive")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-red-200")}
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbCancel size={16} />
              </div>
              <div className="flex flex-col gap-0">
                <b className="text-sm pb-0 mb-0">
                  {companyCount?.inactive ?? 0}
                </b>
                <span className="text-[9px] font-semibold">Inactive</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show Disabled companies">
          <div onClick={() => handleCardClick("disabled")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-red-200")}
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbCancel size={16} />
              </div>
              <div className="flex flex-col gap-0">
                <b className="text-sm pb-0 mb-0">
                  {companyCount?.disabled ?? 0}
                </b>
                <span className="text-[9px] font-semibold">Disabled</span>
              </div>
            </Card>
          </div>
        </Tooltip>

        <Tooltip title="Click to show KYC Verified companies">
          <div onClick={() => handleCardClick("verified")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-emerald-200")}
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500">
                <TbCircleCheck size={16} />
              </div>
              <div className="flex flex-col gap-0">
                <b className="text-sm pb-0 mb-0">
                  {companyCount?.verified ?? 0}
                </b>
                <span className="text-[9px] font-semibold">Verified</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show Non-KYC Verified companies">
          <div onClick={() => handleCardClick("non_verified")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-yellow-200")}
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-yellow-100 text-yellow-500">
                <TbCircleX size={16} />
              </div>
              <div className="flex flex-col gap-0">
                <b className="text-sm pb-0 mb-0">
                  {companyCount?.non_verified ?? 0}
                </b>
                <span className="text-[9px] font-semibold">Non Verified</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show Eligible companies (KYC and Billing enabled)">
          <div onClick={() => handleCardClick("eligible")}>
            <Card
              bodyClass={cardBodyClass}
              className="rounded-md border border-violet-200"
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbShieldCheck size={16} />
              </div>
              <div className="flex flex-col gap-0">
                <b className="text-sm pb-0 mb-0">
                  {companyCount?.eligible ?? 0}
                </b>
                <span className="text-[9px] font-semibold">Eligible</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show Not Eligible companies (KYC or Billing disabled)">
          <div onClick={() => handleCardClick("not_eligible")}>
            <Card
              bodyClass={cardBodyClass}
              className="rounded-md border border-red-200"
            >
              <div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbShieldX size={16} />
              </div>
              <div className="flex flex-col gap-0">
                <b className="text-sm pb-0 mb-0">
                  {companyCount?.not_eligible ?? 0}
                </b>
                <span className="text-[9px] font-semibold">Not Eligible</span>
              </div>
            </Card>
          </div>
        </Tooltip>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <DebouceInput
          placeholder="Quick Search..."
          suffix={<TbSearch className="text-lg" />}
          onChange={(val) =>
            handleSetTableData({ query: val.target.value, pageIndex: 1 })
          }
          value={tableData.query}
        />
        <div className="flex gap-2">
          <Dropdown
            renderTitle={<Button icon={<TbColumns />} />}
            placement="bottom-end"
          >
            <div className="flex flex-col p-2">
              <div className="font-semibold mb-1 border-b pb-1">
                Toggle Columns
              </div>
              {columns.map((col) => {
                const id = col.id || (col.accessorKey as string);
                if (!col.header) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"
                  >
                    {" "}
                    <Checkbox
                      checked={isColumnVisible(id)}
                      onChange={(checked) => toggleColumn(checked, id)}
                    >
                      {col.header as string}
                    </Checkbox>{" "}
                  </div>
                );
              })}
            </div>
          </Dropdown>
          <Tooltip title="Clear Filters & Reload">
            <Button icon={<TbReload />} onClick={onRefreshData} />
          </Tooltip>
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            icon={<TbCloudUpload />}
            onClick={handleOpenExportReasonModal}
            disabled={
              !allFilteredAndSortedData || allFilteredAndSortedData.length === 0
            }
          >
            Export
          </Button>
        </div>
      </div>
      <ActiveFiltersDisplay
        filterData={filterCriteria}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={onClearFilters}
      />
      <DataTable
        columns={filteredColumns}
        data={pageData}
        noData={pageData.length === 0}
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
        selectable
      />
      <Drawer
        title="Company Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={500}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={() => {
                onClearFilters();
                closeFilterDrawer();
              }}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterCompanyForm"
              type="submit"
            >
              Apply
            </Button>
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
                  <DatePicker.DatePickerRange
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
      <CompanyModals
        modalState={modalState}
        onClose={handleCloseModal}
        getAllUserDataOptions={getAllUserData}
      />
      {isEnableBillingModalOpen && selectedCompanyForBilling && (
        <EnableBillingDialog
          company={selectedCompanyForBilling}
          onClose={handleCloseEnableBillingModal}
          onSubmit={handleEnableBillingSubmit}
          isSubmitting={isSubmittingBilling}
          documentTypeOptions={documentTypeOptions}
        />
      )}
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
      <Dialog
        isOpen={isPendingRequestModalOpen}
        onClose={() => setPendingRequestModalOpen(false)}
        width={800}
      >
        <h5 className="mb-4">Pending Enable Billing Requests</h5>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Company Code
                </th>
                <th className="py-2 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Documents
                </th>
                <th className="py-2 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {PendingBillData?.data && PendingBillData.data.length > 0 ? (
                PendingBillData.data.map((item: any) => (
                  <tr key={item.id} className="border-b dark:border-gray-700">
                    <td className="py-3 px-4 text-sm font-medium">
                      {item.company_name}
                    </td>
                    <td className="py-3 px-4 text-sm text-blue-500">
                      {item.company_code}
                    </td>
                    <td className="py-3 px-4">
                      {(() => {
                        const itemDocs: DocumentRecord[] =
                          item.enable_billing_documents?.map((doc: any) => ({
                            name: doc.document_name || "Document",
                            url: doc.document,
                            type: getFileType(doc.document),
                          })) || [];

                        if (itemDocs.length === 0) {
                          return (
                            <span className="text-xs text-gray-500">
                              No docs
                            </span>
                          );
                        }

                        return (
                          <div className="flex gap-2 items-center">
                            {itemDocs.map((doc, index) => (
                              <Tooltip
                                key={index}
                                title={`View: ${doc.name}`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenViewer(itemDocs, index)
                                  }
                                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                  <TbFileDescription className="text-blue-500 text-xl" />
                                </button>
                              </Tooltip>
                            ))}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Tooltip title="Approve">
                          <Button
                            shape="circle"
                            size="sm"
                            variant="solid"
                            color="emerald"
                            icon={<TbCheck />}
                            onClick={() => handleApprovePendingRequest(item)}
                          />
                        </Tooltip>
                        <Tooltip title="Notification">
                          <Button
                            shape="circle"
                            size="sm"
                            variant="solid"
                            color="red"
                            icon={<BiNotification />}
                            onClick={() => handleRejectPendingRequest(item)}
                          />
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No pending requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="text-right mt-6">
          <Button
            variant="solid"
            onClick={() => setPendingRequestModalOpen(false)}
          >
            Close
          </Button>
        </div>
      </Dialog>
      <DocumentViewer
        isOpen={viewerState.isOpen}
        onClose={handleCloseViewer}
        documents={viewerState.docs}
        currentIndex={viewerState.index}
        onNext={handleNext}
        onPrev={handlePrev}
      />
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
      const ids = selectedCompanies.map((d) => String(d.id));
      await dispatch(deleteAllcompanyAction({ ids: ids.join(",") })).unwrap();
      toast.push(<Notification title="Companies Deleted" type="success" />);
      dispatch(getCompanyAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger">
          {error.message}
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
              <TbChecks className="text-lg text-primary-600" />
              <span className="font-semibold">
                {selectedCompanies.length} Companies selected
              </span>
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
              Delete
            </Button>
            <Button
              size="sm"
              variant="solid"
              onClick={() => setSendMessageDialogOpen(true)}
            >
              Message
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
              <Avatar
                src={c.company_logo ? c.company_logo : undefined}
                icon={<TbUserCircle />}
              />
            </Tooltip>
          ))}
        </Avatar.Group>
        <div className="my-4">
          <RichTextEditor />
        </div>
        <div className="text-right flex items-center gap-2">
          <Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="solid"
            loading={sendMessageLoading}
            onClick={handleSend}
          >
            Send
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