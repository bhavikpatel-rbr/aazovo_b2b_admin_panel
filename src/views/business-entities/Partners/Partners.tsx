import { zodResolver } from "@hookform/resolvers/zod";
import cloneDeep from "lodash/cloneDeep"; // Added for partner table logic
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CSVLink } from "react-csv";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput"; // For Partner Search
import RichTextEditor from "@/components/shared/RichTextEditor";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Dropdown,
  Form as UiForm,
  FormItem as UiFormItem,
  Input,
  Select as UiSelect,
  Table,
  FormItem,
  Select,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";
import axiosInstance from "@/services/api/api";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  MdCancel,
  MdCheckCircle,
  MdErrorOutline,
  MdHourglassEmpty,
  MdLink,
} from "react-icons/md";
import {
  TbAlarm,
  TbAlertTriangle,
  TbBell,
  TbBrandWhatsapp,
  TbBriefcase,
  TbCalendarEvent,
  TbCertificate,
  TbChecks,
  TbClipboardText,
  TbClockHour4,
  TbCloudDownload,
  TbCloudUpload,
  TbCreditCard,
  TbDownload,
  TbExternalLink,
  TbEye,
  TbFileDescription,
  TbFileSearch,
  TbFileText,
  TbFileZip,
  TbFilter,
  TbMail,
  TbMapPin,
  TbMessageCircle,
  TbMessageReport,
  TbPencil,
  TbPlus,
  TbReceipt,
  TbSearch,
  TbShare,
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
  deleteAllpartnerAction,
  getpartnerAction, // Ensure these actions exist or are created
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- PartnerListItem Type (Data Structure) ---
export type PartnerListItem = {
  id: string;
  partner_name: string;
  partner_logo: string;
  partner_email_id: string;
  partner_contact_number: string;
  partner_reference_id?: string;
  status: "active" | "inactive"; // Overall status of the entry for list management

  partner_business_type: string;
  business_category: string[];
  partner_service_offerings: string[];
  partner_interested_in: "Buy" | "Sell" | "Both" | "None";

  partner_status_orig: "Active" | "Inactive" | "Pending"; // Partner's operational status
  partner_kyc_status: string; // e.g., 'Verified', 'Pending', 'Under Review', 'Not Submitted'
  partner_profile_completion: number;
  partner_join_date: string;
  partner_trust_score: number;
  partner_activity_score: number;

  partner_location: string; // e.g., "City, Country" or "Country / State / City"
  partner_website?: string;
  partner_profile_link?: string;
  partner_certifications: string[];

  partner_payment_terms?: string;
  partner_lead_time?: number; // In days
  partner_document_upload?: string;

  // Add fields that might be used by modals, similar to CompanyItem
  health_score?: number; // Example
};
// --- End PartnerListItem Type ---

// --- Zod Schema for Partner Filter Form ---
const partnerFilterFormSchema = z.object({
  filterPartnerStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterKycStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBusinessType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCategory: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCountry: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // Add more partner-specific filters if needed:
  // filterInterestedIn: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  // filterLeadTime: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(), // Example for range
});
type PartnerFilterFormData = z.infer<typeof partnerFilterFormSchema>;
// --- End Partner Filter Schema ---

// --- Partner Status Colors ---
const partnerDisplayStatusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  Inactive: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Pending:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  Verified: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "Under Review":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  "Not Submitted":
    "bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-400",
  // For the `status` field (overall list management)
  active: "bg-green-200 text-green-600",
  inactive: "bg-red-200 text-red-600",
};

const getPartnerDisplayStatusClass = (statusValue?: string): string => {
  if (!statusValue) return "bg-gray-100 text-gray-500";
  return partnerDisplayStatusColors[statusValue] || "bg-gray-100 text-gray-500";
};
// --- End Partner Status Colors ---

// --- MOCK PARTNER FILTER OPTIONS (Replace/derive from actual data) ---
const partnerStatusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Pending", label: "Pending" },
];
const partnerKycStatusOptions = [
  { value: "Verified", label: "Verified" },
  { value: "Pending", label: "Pending" },
  { value: "Under Review", label: "Under Review" },
  { value: "Not Submitted", label: "Not Submitted" },
];
// Example: derive from data if possible, or use mocks
const partnerCountryOptions = [
  { value: "USA", label: "USA" },
  { value: "UK", label: "UK" },
  { value: "India", label: "India" },
];
// --- END MOCK PARTNER FILTER OPTIONS ---

// --- Partner List Store ---
interface PartnerListStore {
  partnerList: PartnerListItem[];
  selectedPartners: PartnerListItem[];
  partnerListTotal: number;
  setPartnerList: React.Dispatch<React.SetStateAction<PartnerListItem[]>>;
  setSelectedPartners: React.Dispatch<React.SetStateAction<PartnerListItem[]>>;
  setPartnerListTotal: React.Dispatch<React.SetStateAction<number>>;
}

const PartnerListContext = React.createContext<PartnerListStore | undefined>(
  undefined
);

const usePartnerList = (): PartnerListStore => {
  const context = useContext(PartnerListContext);
  if (!context) {
    throw new Error(
      "usePartnerList must be used within a PartnerListProvider"
    );
  }
  return context;
};

const PartnerListProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { partnerData = { data: [], total: 0 } } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const [partnerList, setPartnerList] = useState<PartnerListItem[]>(
    partnerData.data
  );
  const [selectedPartners, setSelectedPartners] = useState<PartnerListItem[]>(
    []
  );
  const [partnerListTotal, setPartnerListTotal] = useState(partnerData.total);
  useEffect(() => {
    setPartnerList(partnerData.data);
    setPartnerListTotal(partnerData.total);
  }, [partnerData]);

  useEffect(() => {
    dispatch(getpartnerAction()); // Fetch continents for select dropdown
  }, [dispatch]);

  return (
    <PartnerListContext.Provider
      value={{
        partnerList,
        setPartnerList,
        selectedPartners,
        setSelectedPartners,
        partnerListTotal,
        setPartnerListTotal,
      }}
    >
      {children}
    </PartnerListContext.Provider>
  );
};
// --- End Partner List Store ---

// ============================================================================
// --- MODALS SECTION ---
// All modal components for Partners are defined here.
// ============================================================================

// --- Type Definitions for Modals ---
export type PartnerModalType =
  | "email"
  | "whatsapp"
  | "notification"
  | "task"
  | "active"
  | "calendar"
  | "alert"
  | "document"
  | "feedback"
  | "engagement"
  | "trackRecord"
  | "transaction"
  | "members"; // Added from company for consistency

export interface PartnerModalState {
  isOpen: boolean;
  type: PartnerModalType | null;
  data: PartnerListItem | null;
}
interface PartnerModalsProps {
  modalState: PartnerModalState;
  onClose: () => void;
}

// --- Helper Data for Modal Demos (Reused from Company Module) ---
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
const dummyAlerts = [
  {
    id: 1,
    severity: "danger",
    message: "Invoice #INV-P008 is 15 days overdue.",
    time: "3 days ago",
  },
  {
    id: 2,
    severity: "warning",
    message: "Partnership agreement renewal due in 10 days.",
    time: "1 week ago",
  },
];
const dummyDocs = [
  { id: "doc1", name: "Partner_NDA.pdf", type: "pdf", size: "1.2 MB" },
  { id: "doc2", name: "Service_Catalog.zip", type: "zip", size: "8.4 MB" },
];
const dummyFeedback = [
  { id: "f1", type: "Request", subject: "API Integration Help", status: "Open" },
  { id: "f2", type: "Feedback", subject: "Positive Onboarding Experience", status: "Closed" },
];

// --- PartnerModals Manager Component ---
const PartnerModals: React.FC<PartnerModalsProps> = ({
  modalState,
  onClose,
}) => {
  const { type, data: partner, isOpen } = modalState;
  if (!isOpen || !partner) return null;

  const renderModalContent = () => {
    switch (type) {
      case "email":
        return <SendEmailDialog partner={partner} onClose={onClose} />;
      case "whatsapp":
        return <SendWhatsAppDialog partner={partner} onClose={onClose} />;
      case "notification":
        return <AddNotificationDialog partner={partner} onClose={onClose} />;
      case "task":
        return <AssignTaskDialog partner={partner} onClose={onClose} />;
      case "calendar":
        return <AddScheduleDialog partner={partner} onClose={onClose} />;
      case "alert":
        return <ViewAlertDialog partner={partner} onClose={onClose} />;
      case "document":
        return <DownloadDocumentDialog partner={partner} onClose={onClose} />;
      case "feedback":
        return <ViewRequestFeedbackDialog partner={partner} onClose={onClose} />;
      default:
        return (
          <GenericActionDialog
            type={type}
            partner={partner}
            onClose={onClose}
          />
        );
    }
  };
  return <>{renderModalContent()}</>;
};

// --- Individual Dialog Components for Partners ---
const SendEmailDialog: React.FC<{
  partner: PartnerListItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { subject: "", message: "" },
  });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true);
    console.log("Sending email to", partner.partner_email_id, "with data:", data);
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
      <h5 className="mb-4">Send Email to {partner.partner_name}</h5>
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
  partner: PartnerListItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      message: `Hi ${partner.partner_name}, regarding our partnership...`,
    },
  });
  const onSendMessage = (data: { message: string }) => {
    const phone = partner.partner_contact_number?.replace(/\D/g, "");
    if (!phone) {
      toast.push(<Notification type="danger" title="Invalid Phone Number" />);
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      data.message
    )}`;
    window.open(url, "_blank");
    toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
    onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send WhatsApp to {partner.partner_name}</h5>
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
          <Button variant="solid" type="submit">
            Open WhatsApp
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const AddNotificationDialog: React.FC<{
  partner: PartnerListItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { title: "", users: [], message: "" },
  });
  const onSend = (data: any) => {
    setIsLoading(true);
    console.log(
      "Sending in-app notification for",
      partner.partner_name,
      "with data:",
      data
    );
    setTimeout(() => {
      toast.push(<Notification type="success" title="Notification Sent" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for {partner.partner_name}</h5>
      <form onSubmit={handleSubmit(onSend)}>
        <FormItem label="Notification Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormItem>
        <FormItem label="Send to Users">
          <Controller
            name="users"
            control={control}
            render={({ field }) => (
              <Select
                isMulti
                placeholder="Select Users"
                options={dummyUsers}
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem label="Message">
          <Controller
            name="message"
            control={control}
            render={({ field }) => <Input textArea {...field} rows={3} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading}>
            Send Notification
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const AssignTaskDialog: React.FC<{
  partner: PartnerListItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      title: "",
      assignee: null,
      dueDate: null,
      priority: null,
      description: "",
    },
  });
  const onAssignTask = (data: any) => {
    setIsLoading(true);
    console.log(
      "Assigning task for",
      partner.partner_name,
      "with data:",
      data
    );
    setTimeout(() => {
      toast.push(<Notification type="success" title="Task Assigned" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for {partner.partner_name}</h5>
      <form onSubmit={handleSubmit(onAssignTask)}>
        <FormItem label="Task Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Follow up on partnership" />
            )}
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Assign To">
            <Controller
              name="assignee"
              control={control}
              render={({ field }) => (
                <Select
                  placeholder="Select User"
                  options={dummyUsers}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Priority">
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select
                  placeholder="Select Priority"
                  options={priorityOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
        </div>
        <FormItem label="Due Date">
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                placeholder="Select date"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormItem>
        <FormItem label="Description">
          <Controller
            name="description"
            control={control}
            render={({ field }) => <Input textArea {...field} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading}>
            Assign Task
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const AddScheduleDialog: React.FC<{
  partner: PartnerListItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { title: "", eventType: null, startDate: null, notes: "" },
  });
  const onAddEvent = (data: any) => {
    setIsLoading(true);
    console.log("Adding event for", partner.partner_name, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Event Scheduled" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for {partner.partner_name}</h5>
      <form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Partnership Review" />
            )}
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Event Type">
            <Controller
              name="eventType"
              control={control}
              render={({ field }) => (
                <Select
                  placeholder="Select Type"
                  options={eventTypeOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Date & Time">
            <Controller
              name="startDate"
              control={control}
              render={({ field }) => (
                <DatePicker.DateTimepicker
                  placeholder="Select date and time"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormItem>
        </div>
        <FormItem label="Notes">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => <Input textArea {...field} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading}>
            Save Event
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const ViewAlertDialog: React.FC<{
  partner: PartnerListItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const alertColors: Record<string, string> = {
    danger: "red",
    warning: "amber",
    info: "blue",
  };
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Alerts for {partner.partner_name}</h5>
      <div className="mt-4 flex flex-col gap-3">
        {dummyAlerts.length > 0 ? (
          dummyAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-l-4 border-${
                alertColors[alert.severity]
              }-500 bg-${alertColors[alert.severity]}-50 dark:bg-${
                alertColors[alert.severity]
              }-500/10`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <TbAlertTriangle
                    className={`text-${alertColors[alert.severity]}-500 mt-1`}
                    size={20}
                  />
                  <p className="text-sm">{alert.message}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {alert.time}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p>No active alerts.</p>
        )}
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};

const DownloadDocumentDialog: React.FC<{
  partner: PartnerListItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const iconMap: Record<string, React.ReactElement> = {
    pdf: <TbFileText className="text-red-500" />,
    zip: <TbFileZip className="text-amber-500" />,
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Documents for {partner.partner_name}</h5>
      <div className="flex flex-col gap-3 mt-4">
        {dummyDocs.map((doc) => (
          <div
            key={doc.id}
            className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="flex items-center gap-3">
              {React.cloneElement(iconMap[doc.type] || <TbClipboardText />, {
                size: 28,
              })}
              <div>
                <p className="font-semibold text-sm">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.size}</p>
              </div>
            </div>
            <Tooltip title="Download">
              <Button shape="circle" size="sm" icon={<TbDownload />} />
            </Tooltip>
          </div>
        ))}
      </div>
      <div className="text-right mt-6">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Dialog>
  );
};

const ViewRequestFeedbackDialog: React.FC<{
  partner: PartnerListItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
    const statusColors: Record<string, string> = {
        Open: "bg-emerald-500",
        Closed: "bg-red-500",
      };
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={700}
    >
      <h5 className="mb-4">Requests & Feedback for {partner.partner_name}</h5>
      <div className="max-h-[400px] overflow-y-auto">
        <Table>
          <Table.THead>
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Th>Subject</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.THead>
          <Table.TBody>
            {dummyFeedback.map((fb) => (
              <Table.Tr key={fb.id}>
                <Table.Td>{fb.type}</Table.Td>
                <Table.Td>{fb.subject}</Table.Td>
                <Table.Td>
                  <Tag
                    className="text-white"
                    prefix
                    prefixClass={statusColors[fb.status]}
                  >
                    {fb.status}
                  </Tag>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.TBody>
        </Table>
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};


const GenericActionDialog: React.FC<{
  type: PartnerModalType | null;
  partner: PartnerListItem;
  onClose: () => void;
}> = ({ type, partner, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type
    ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}`
    : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true);
    console.log(`Performing action '${type}' for partner ${partner.partner_name}`);
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
        <span className="font-semibold">{partner.partner_name}</span>?
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

// ============================================================================
// --- END MODALS SECTION ---
// ============================================================================

// --- PartnerListSearch Component ---
interface PartnerListSearchProps {
  onInputChange: (value: string) => void;
}
const PartnerListSearch: React.FC<PartnerListSearchProps> = ({
  onInputChange,
}) => {
  return (
    <DebouceInput
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
};
// --- End PartnerListSearch ---

// --- PartnerListActionTools Component (for Page Header) ---
const PartnerListActionTools = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button
        variant="solid"
        icon={<TbPlus className="text-lg" />}
        onClick={() => navigate("/business-entities/create-partner")}
      >
        Add New
      </Button>
    </div>
  );
};
// --- End PartnerListActionTools ---

// --- PartnerActionColumn Component (for DataTable) ---
const PartnerActionColumn = ({
  rowData,
  onEdit,
  onViewDetail,
  onShare,
  onOpenModal,
}: {
  rowData: PartnerListItem;
  onEdit: (id: string) => void;
  onViewDetail: (id: string) => void;
  onShare: (id: string) => void;
  onOpenModal: (type: PartnerModalType, data: PartnerListItem) => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400">
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer select-none hover:text-emerald-600 dark:hover:text-emerald-400"
          role="button"
          onClick={() => onEdit(rowData.id)}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View Details">
        <div
          className="text-xl cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400"
          role="button"
          onClick={() => onViewDetail(rowData.id)}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className="text-xl cursor-pointer select-none hover:text-orange-600 dark:hover:text-orange-400"
          role="button"
          onClick={() => onShare(rowData.id)}
        >
          <TbShare />
        </div>
      </Tooltip>
      <Dropdown
        renderTitle={
          <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
        }
      >
        <Dropdown.Item
          onClick={() => onOpenModal("notification", rowData)}
          className="flex items-center gap-2"
        >
          <TbBell size={18} />{" "}
          <span className="text-xs">Add as Notification</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("active", rowData)}
          className="flex items-center gap-2"
        >
          <TbTagStarred size={18} />{" "}
          <span className="text-xs">Mark as Active</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("calendar", rowData)}
          className="flex items-center gap-2"
        >
          <TbCalendarEvent size={18} />{" "}
          <span className="text-xs">Add to Calendar</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("task", rowData)}
          className="flex items-center gap-2"
        >
          <TbUser size={18} /> <span className="text-xs">Assign to Task</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("alert", rowData)}
          className="flex items-center gap-2"
        >
          <TbAlarm size={18} /> <span className="text-xs">View Alert</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("feedback", rowData)}
          className="flex items-center gap-2"
        >
          <TbMessageReport size={18} />{" "}
          <span className="text-xs">View Request & Feedback</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("document", rowData)}
          className="flex items-center gap-2"
        >
          <TbDownload size={18} />{" "}
          <span className="text-xs">Download Document</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("email", rowData)}
          className="flex items-center gap-2"
        >
          <TbMail size={18} /> <span className="text-xs">Send Email</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("whatsapp", rowData)}
          className="flex items-center gap-2"
        >
          <TbBrandWhatsapp size={18} />{" "}
          <span className="text-xs">Send on Whatsapp</span>
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};
// --- End PartnerActionColumn ---

// --- PartnerListTable Component ---
const PartnerListTable = () => {
  const navigate = useNavigate();
  const {
    partnerList = [],
    selectedPartners,
    setSelectedPartners,
    partnerListTotal,
    setPartnerList,
    setPartnerListTotal,
  } = usePartnerList();

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<PartnerFilterFormData>(
    {}
  );

  // --- MODAL STATE AND HANDLERS ---
  const [modalState, setModalState] = useState<PartnerModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const handleOpenModal = (type: PartnerModalType, partnerData: PartnerListItem) =>
    setModalState({ isOpen: true, type, data: partnerData });
  const handleCloseModal = () =>
    setModalState({ isOpen: false, type: null, data: null });
  // --- END MODAL STATE AND HANDLERS ---

  const filterFormMethods = useForm<PartnerFilterFormData>({
    resolver: zodResolver(partnerFilterFormSchema),
    defaultValues: filterCriteria,
  });

  useEffect(() => {
    filterFormMethods.reset(filterCriteria);
  }, [filterCriteria, filterFormMethods]);

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria); // Ensure form resets to current applied filters
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const onApplyFiltersSubmit = (data: PartnerFilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 }); // Reset to first page on new filter
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters: PartnerFilterFormData = {};
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 }); // Reset to first page
    closeFilterDrawer(); // Optional: keep drawer open or close
  };

  const { pageData, total } = useMemo(() => {
    let filteredData = [...partnerList];

    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      filteredData = filteredData.filter(
        (partner) =>
          partner?.partner_name?.toLowerCase().includes(query) ||
          partner.partner_email_id?.toLowerCase().includes(query) ||
          partner.partner_contact_number?.toLowerCase().includes(query) ||
          partner.partner_business_type?.toLowerCase().includes(query) ||
          (partner.partner_reference_id &&
            partner.partner_reference_id.toLowerCase().includes(query)) ||
          partner.business_category?.some((cat) =>
            cat.toLowerCase().includes(query)
          ) ||
          partner.partner_location?.toLowerCase().includes(query)
      );
    }

    // Apply partner-specific filters
    if (
      filterCriteria.filterPartnerStatus &&
      filterCriteria.filterPartnerStatus.length > 0
    ) {
      const selectedStatuses = filterCriteria.filterPartnerStatus.map(
        (opt) => opt.value
      );
      filteredData = filteredData.filter((partner) =>
        selectedStatuses.includes(partner.partner_status_orig)
      );
    }
    if (
      filterCriteria.filterKycStatus &&
      filterCriteria.filterKycStatus.length > 0
    ) {
      const selectedKyc = filterCriteria.filterKycStatus.map(
        (opt) => opt.value
      );
      filteredData = filteredData.filter((partner) =>
        selectedKyc.includes(partner.partner_kyc_status)
      );
    }
    if (
      filterCriteria.filterBusinessType &&
      filterCriteria.filterBusinessType.length > 0
    ) {
      const selectedTypes = filterCriteria.filterBusinessType.map((opt) =>
        opt.value.toLowerCase()
      );
      filteredData = filteredData.filter((partner) =>
        selectedTypes.includes(partner.partner_business_type.toLowerCase())
      );
    }
    if (
      filterCriteria.filterCategory &&
      filterCriteria.filterCategory.length > 0
    ) {
      const selectedCategories = filterCriteria.filterCategory.map((opt) =>
        opt.value.toLowerCase()
      );
      filteredData = filteredData.filter((partner) =>
        partner.business_category.some((cat) =>
          selectedCategories.includes(cat.toLowerCase())
        )
      );
    }
    if (
      filterCriteria.filterCountry &&
      filterCriteria.filterCountry.length > 0
    ) {
      const selectedCountries = filterCriteria.filterCountry.map((opt) =>
        opt.value.toLowerCase()
      );
      filteredData = filteredData.filter((partner) => {
        // Assuming country is the last part of "City, Country" or parsable
        const locationParts = partner.partner_location.split(/,\s*|\s*\/\s*/);
        const country = locationParts.pop()?.toLowerCase();
        return country && selectedCountries.includes(country);
      });
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        const aValue = a[key as keyof PartnerListItem] ?? "";
        const bValue = b[key as keyof PartnerListItem] ?? "";
        if (
          [
            "partner_profile_completion",
            "partner_trust_score",
            "partner_activity_score",
            "partner_lead_time",
          ].includes(key)
        ) {
          const numA = Number(aValue);
          const numB = Number(bValue);
          if (!isNaN(numA) && !isNaN(numB))
            return order === "asc" ? numA - numB : numB - numA;
        }
        if (key === "partner_join_date") {
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }

    return { pageData: filteredData, total: partnerListTotal };
  }, [partnerList, tableData, filterCriteria, partnerListTotal]);

  const handleEditPartner = (id: string) => {
    navigate(`/business-entities/create-partner`, { state: id });
  };
  const handleViewPartnerDetails = (id: string) => {
    navigate(`/business-entities/create-partner`, { state: id });
  };
  const handleSharePartner = (id: string) => {
    console.log("Share Partner:", id);
  };

  const columns: ColumnDef<PartnerListItem>[] = useMemo(
    () => [
      {
        header: "Partner Details",
        accessorKey: "partner_name",
        enableSorting: true,
        size: 280,
        cell: ({ row }) => {
          const {
            partner_name,
            partner_logo,
            partner_email_id,
            partner_contact_number,
            partner_reference_id,
            id,
          } = row.original;
          return (
            <div className="flex items-start gap-3">
              <Avatar
                src={partner_logo}
                size="lg"
                shape="circle"
                icon={<TbUserCircle />}
              />
              <div className="flex flex-col text-xs min-w-0">
                <span
                  className="font-semibold text-sm text-gray-800 dark:text-gray-100 hover:text-blue-600 cursor-pointer truncate"
                  onClick={() => handleViewPartnerDetails(id)}
                  title={partner_name}
                >
                  {partner_name}
                </span>
                <span
                  className="text-gray-500 dark:text-gray-400 truncate"
                  title={partner_email_id}
                >
                  {partner_email_id}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {partner_contact_number}
                </span>
                {partner_reference_id && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Ref: {partner_reference_id}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        header: "Business Focus",
        accessorKey: "partner_business_type",
        enableSorting: true,
        size: 250,
        cell: ({ row }) => {
          const {
            partner_business_type,
            business_category,
            partner_interested_in,
            partner_service_offerings,
          } = row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center">
                <TbBriefcase className="inline mr-1.5 text-gray-500 flex-shrink-0" />
                <span className="font-semibold mr-1">Type:</span>
                <span
                  className="text-gray-600 dark:text-gray-400 truncate"
                  title={partner_business_type}
                >
                  {partner_business_type}
                </span>
              </div>
              {business_category?.length > 0 && (
                <div className="flex items-start">
                  <span className="font-semibold mr-1.5">Category: </span>
                  <Tooltip placement="top" title={business_category.join(" | ")}>
                    <span className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {business_category.join(", ")}
                    </span>
                  </Tooltip>
                </div>
              )}
              {partner_service_offerings?.length > 0 && (
                <div className="flex items-start">
                  <span className="font-semibold mr-1.5">Services: </span>
                  <Tooltip
                    placement="top"
                    title={partner_service_offerings.join(" | ")}
                  >
                    <span className="text-gray-600 dark:text-gray-400 line-clamp-2">
                      {partner_service_offerings.join(", ")}
                    </span>
                  </Tooltip>
                </div>
              )}
              <div className="flex items-start">
                <span className="font-semibold mr-1.5">Interested In: </span>
                <Tooltip placement="top" title={partner_interested_in}>
                  <span className="text-gray-600 dark:text-gray-400">
                    {partner_interested_in}
                  </span>
                </Tooltip>
              </div>
            </div>
          );
        },
      },
      {
        header: "Status & Scores",
        accessorKey: "partner_status_orig",
        enableSorting: true,
        size: 220,
        cell: ({ row }) => {
          const {
            partner_status_orig,
            partner_kyc_status,
            partner_profile_completion,
            partner_trust_score,
            partner_activity_score,
            partner_join_date,
          } = row.original;
          let kycIcon = (
            <MdHourglassEmpty
              className="text-orange-500 inline mr-0.5"
              size={12}
            />
          );
          if (partner_kyc_status === "Verified")
            kycIcon = (
              <MdCheckCircle
                className="text-green-500 inline mr-0.5"
                size={12}
              />
            );
          else if (["Not Submitted", "Rejected"].includes(partner_kyc_status))
            kycIcon = (
              <MdErrorOutline
                className="text-red-500 inline mr-0.5"
                size={12}
              />
            );

          return (
            <div className="flex flex-col gap-1 text-xs">
              <Tag
                className={`${getPartnerDisplayStatusClass(
                  partner_status_orig
                )} capitalize font-semibold border-0 self-start px-2 py-0.5 !text-[10px]`}
              >
                Partner: {partner_status_orig}
              </Tag>
              <Tooltip title={`KYC: ${partner_kyc_status}`} className="text-xs mt-0.5">
                <Tag
                  className={`${getPartnerDisplayStatusClass(
                    partner_kyc_status
                  )} capitalize !text-[9px] px-1.5 py-0.5 border self-start flex items-center`}
                >
                  {kycIcon}
                  {partner_kyc_status}
                </Tag>
              </Tooltip>
              <Tooltip title={`Profile: ${partner_profile_completion}%`}>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 my-1">
                  <div
                    className="bg-blue-500 h-full rounded-full flex items-center justify-end text-white pr-1 text-[8px]"
                    style={{ width: `${partner_profile_completion}%` }}
                  >
                    {partner_profile_completion > 15 &&
                      `${partner_profile_completion}%`}
                  </div>
                </div>
              </Tooltip>
              <div className="flex justify-between items-center text-[10px] gap-1">
                <Tooltip title={`Trust: ${partner_trust_score}%`}>
                  <Tag className="flex-1 text-center !py-0.5 bg-blue-100 text-blue-700">
                    T: {partner_trust_score}%
                  </Tag>
                </Tooltip>
                <Tooltip title={`Activity: ${partner_activity_score}%`}>
                  <Tag className="flex-1 text-center !py-0.5 bg-purple-100 text-purple-700">
                    A: {partner_activity_score}%
                  </Tag>
                </Tooltip>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                Joined:{" "}
                {new Date(partner_join_date)
                  .toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                  .replace(/ /g, "/")}
              </div>
            </div>
          );
        },
      },
      {
        header: "Location & Links",
        accessorKey: "partner_location",
        enableSorting: true,
        size: 220,
        cell: ({ row }) => {
          const {
            partner_location,
            partner_website,
            partner_profile_link,
            partner_certifications,
            partner_document_upload,
            partner_payment_terms,
            partner_lead_time,
          } = row.original;
          const getShortCertificationsDisplay = (
            certs: string[] | undefined
          ): string => {
            if (!certs || certs.length === 0) return "N/A";
            if (certs.length === 1)
              return certs[0].length > 15
                ? certs[0].substring(0, 12) + "..."
                : certs[0];
            const firstFew = certs
              .slice(0, 1)
              .map((cert) => cert.substring(0, 8) + (cert.length > 8 ? ".." : ""));
            let display = firstFew.join(", ");
            if (certs.length > 1) display += `, +${certs.length - 1}`;
            return display;
          };
          return (
            <div className="flex flex-col gap-1 text-xs">
              {partner_location && (
                <div className="flex items-center">
                  <TbMapPin className="text-gray-500 mr-1.5 flex-shrink-0" />{" "}
                  {partner_location}
                </div>
              )}
              {partner_website && (
                <a
                  href={partner_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex items-center"
                >
                  <TbExternalLink className="mr-1.5 flex-shrink-0" /> Website
                </a>
              )}
              {partner_profile_link && (
                <a
                  href={partner_profile_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex items-center"
                >
                  <MdLink className="mr-1.5 flex-shrink-0" size={14} /> Profile
                </a>
              )}
              {partner_certifications && partner_certifications.length > 0 && (
                <Tooltip
                  placement="top"
                  title={partner_certifications.join(" | ")}
                >
                  <div className="text-gray-600 dark:text-gray-400 truncate flex items-center">
                    <TbCertificate className="text-gray-500 mr-1.5 flex-shrink-0" />{" "}
                    {getShortCertificationsDisplay(partner_certifications)}
                  </div>
                </Tooltip>
              )}
              {partner_document_upload && (
                <a
                  href={partner_document_upload}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex items-center"
                >
                  <TbFileDescription className="mr-1.5 flex-shrink-0" /> Document
                </a>
              )}
              {partner_payment_terms && (
                <div className="flex items-center">
                  <TbCreditCard className="text-gray-500 mr-1.5 flex-shrink-0" />{" "}
                  {partner_payment_terms}
                </div>
              )}
              {partner_lead_time !== undefined && (
                <div className="flex items-center">
                  <TbClockHour4 className="text-gray-500 mr-1.5 flex-shrink-0" />{" "}
                  Lead: {partner_lead_time} days
                </div>
              )}
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <PartnerActionColumn
            rowData={props.row.original}
            onEdit={handleEditPartner}
            onViewDetail={handleViewPartnerDetails}
            onShare={handleSharePartner}
            onOpenModal={handleOpenModal}
          />
        ),
      },
    ],
    [handleOpenModal]
  );

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  // API fetching logic
  const fetchPageData = useCallback(
    async (
      pageIdx: number,
      limit: number,
      currentSort?: OnSortParam
      // Add other server-side filter/query params here if API supports
    ) => {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", String(pageIdx));
      params.append("limit", String(limit)); // Assuming API uses 'limit' for page size

      try {
        const response = await axiosInstance.get(`/partner?${params.toString()}`);
        setPartnerList(response.data?.data?.data ?? []);
        setPartnerListTotal(response.data?.data?.total ?? 0);
      } catch (error) {
        console.error("Failed to fetch member data:", error);
        toast.push(
          <Notification title="Error" type="danger" duration={3000}>
            Failed to load members.
          </Notification>
        );
      } finally {
        setIsLoading(false);
      }
    },
    [setPartnerList, setPartnerListTotal]
  );

  // Effect to fetch data when server-relevant parameters change
  useEffect(() => {
    fetchPageData(
      tableData.pageIndex as number,
      tableData.pageSize as number,
      tableData.sort as OnSortParam
    );
  }, [tableData.pageIndex, tableData.pageSize, tableData.sort, fetchPageData]);
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: PartnerListItem) => {
      setSelectedPartners((prevSelected) => {
        if (checked) {
          return [...prevSelected, row];
        } else {
          return prevSelected.filter((item) => item.id !== row.id);
        }
      });
    },
    [setSelectedPartners]
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<PartnerListItem>[]) => {
      if (checked) {
        const allOriginalRows = rows.map((r) => r.original);
        setSelectedPartners(allOriginalRows);
      } else {
        setSelectedPartners([]);
      }
    },
    [setSelectedPartners]
  );

  const handleImport = () => {
    console.log("Import clicked"); /* Implement import logic */
  };

  const csvData = useMemo(() => {
    if (partnerList.length === 0) return [];
    return partnerList.map((partner) => {
      const newPartner: any = { ...partner };
      Object.keys(newPartner).forEach((key) => {
        if (Array.isArray(newPartner[key as keyof PartnerListItem])) {
          newPartner[key] = (
            newPartner[key as keyof PartnerListItem] as string[]
          ).join("; "); // Use semicolon for multi-value fields
        }
      });
      return newPartner;
    });
  }, [partnerList]);

  // Dynamic filter options (example for business types and categories)
  const getPartnerBusinessTypeOptions = useMemo(() => {
    return partnerList
      .map((p) => p.partner_business_type)
      .filter((v, i, a) => a.indexOf(v) === i && v) // Unique and non-empty
      .map((type) => ({ value: type, label: type }));
  }, [partnerList]);

  const getPartnerCategoryOptions = useMemo(() => {
    return partnerList
      .flatMap((p) => p.business_category)
      .filter((v, i, a) => a.indexOf(v) === i && v) // Unique and non-empty
      .map((cat) => ({ value: cat, label: cat }));
  }, [partnerList]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <PartnerListSearch
          onInputChange={(val) => handleSetTableData({ query: val, pageIndex: 1 })}
        />
        <div className="flex gap-2">
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>
            Filter
          </Button>
          <Button icon={<TbCloudDownload />} onClick={handleImport}>
            Import
          </Button>
          {partnerList.length > 0 ? (
            <CSVLink data={csvData} filename="partners_export.csv">
              <Button icon={<TbCloudUpload />}>Export</Button>
            </CSVLink>
          ) : (
            <Button icon={<TbCloudUpload />} disabled>
              Export
            </Button>
          )}
        </div>
      </div>
      <DataTable
        selectable
        columns={columns}
        data={pageData}
        noData={!isLoading && partnerList.length === 0}
        loading={isLoading}
        pagingData={{
          total: total,
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        checkboxChecked={(row) =>
          selectedPartners.some((selected) => selected.id === row.id)
        }
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={handleRowSelect}
        onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      <Drawer
        title="Partner Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterPartnerForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <UiForm
          id="filterPartnerForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
        >
          <div className="sm:grid grid-cols-2 gap-2">
            <UiFormItem label="Partner Status">
              <Controller
                name="filterPartnerStatus"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={partnerStatusOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="KYC Status">
              <Controller
                name="filterKycStatus"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select KYC Status"
                    options={partnerKycStatusOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Business Type">
              <Controller
                name="filterBusinessType"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Type"
                    options={getPartnerBusinessTypeOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Business Category">
              <Controller
                name="filterCategory"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Category"
                    options={getPartnerCategoryOptions}
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
                    options={partnerCountryOptions} // Or derive dynamically
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
          </div>
        </UiForm>
      </Drawer>
      <PartnerModals modalState={modalState} onClose={handleCloseModal} />
    </>
  );
};
// --- End PartnerListTable ---

// --- PartnerListSelected Component (for bulk actions) ---
const PartnerListSelected = () => {
  const { selectedPartners, setSelectedPartners, setPartnerList, setPartnerListTotal } =
    usePartnerList();

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);

  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const dispatch = useAppDispatch();

  const handleConfirmDelete = async () => {
    if (!selectedPartners || selectedPartners.length === 0) {
      toast.push(
        <Notification title="Error" type="danger">
          No partners selected for deletion.
        </Notification>
      );
      setDeleteConfirmationOpen(false);
      return;
    }
    setDeleteConfirmationOpen(false);
    try {
      const ids = selectedPartners.map((data) => data.id);
      await dispatch(deleteAllpartnerAction({ ids: ids.toString() })).unwrap();
      toast.push(
        <Notification title="Partners Deleted" type="success" duration={2000}>
          {selectedPartners.length} partner(s) deleted.
        </Notification>
      );
      dispatch(getpartnerAction()); // Refresh the list from the server
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete partners.`}
        </Notification>
      );
      console.error("Delete partners Error:", error);
    } finally {
      setSelectedPartners([]);
    }
  };

  // Example bulk message action
  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      toast.push(
        <Notification type="success" title="Message Sent">
          Message sent to selected partners!
        </Notification>,
        {
          placement: "top-center",
        }
      );
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedPartners([]);
    }, 500);
  };

  if (selectedPartners.length === 0) {
    return null;
  }

  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <span>
              <span className="flex items-center gap-2">
                <span className="text-lg text-primary-600 dark:text-primary-400">
                  <TbChecks />
                </span>
                <span className="font-semibold flex items-center gap-1">
                  <span className="heading-text">
                    {selectedPartners.length} Partners
                  </span>
                  <span>selected</span>
                </span>
              </span>
            </span>
            <div className="flex items-center">
              <Button
                size="sm"
                className="ltr:mr-3 rtl:ml-3"
                type="button"
                customColorClass={() =>
                  "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
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
                Message {/* Or other bulk action */}
              </Button>
            </div>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title="Remove Partners"
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to remove these partners? This action can't be
          undone.
        </p>
      </ConfirmDialog>
      <Dialog
        isOpen={sendMessageDialogOpen}
        onRequestClose={() => setSendMessageDialogOpen(false)}
        onClose={() => setSendMessageDialogOpen(false)}
      >
        <h5 className="mb-2">Send Message to Partners</h5>
        <p>Send message to the following partners:</p>
        <Avatar.Group
          chained
          omittedAvatarTooltip
          className="mt-4"
          maxCount={4}
          omittedAvatarProps={{ size: 30 }}
        >
          {selectedPartners.map((partner) => (
            <Tooltip key={partner.id} title={partner.partner_name}>
              <Avatar
                size={30}
                src={partner.partner_logo}
                alt={partner.partner_name}
                icon={<TbUserCircle />}
              />
            </Tooltip>
          ))}
        </Avatar.Group>
        <div className="my-4">
          <RichTextEditor /> {/* Manage content state if needed */}
        </div>
        <div className="ltr:justify-end flex items-center gap-2">
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
// --- End PartnerListSelected ---

// --- Main Partner Page Component ---
const Partner = () => {
  return (
    <PartnerListProvider>
      {" "}
      {/* Wrap components with Provider */}
      <>
        <Container>
          <AdaptiveCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h5>Partners</h5>
                <PartnerListActionTools />
              </div>
              <PartnerListTable />
            </div>
          </AdaptiveCard>
        </Container>
        <PartnerListSelected />
      </>
    </PartnerListProvider>
  );
};

export default Partner;