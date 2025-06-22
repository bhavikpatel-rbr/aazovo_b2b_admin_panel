import { zodResolver } from "@hookform/resolvers/zod";
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
import DebouceInput from "@/components/shared/DebouceInput";
import RichTextEditor from "@/components/shared/RichTextEditor";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Dropdown,
  FormItem,
  Input,
  Select,
  Table,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
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
  TbCalendar,
  TbCalendarEvent,
  TbChecks,
  TbClipboardText,
  TbCloudDownload,
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
  TbTagStarred,
  TbUser,
  TbUserCancel,
  TbUserCheck,
  TbUserCircle,
  TbUserMinus,
  TbUserSearch,
  TbUsersGroup,
  TbUserX
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
  getContinentsAction,
  getCountriesAction,
  getpartnerAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- CompanyItem Type (Data Structure) ---
export type CompanyItem = {
  id: string;
  name: string;
  company_code?: string;
  type: string;
  interested_in: string;
  category: string[];
  brands: string[];
  country: string;
  status:
    | "Active"
    | "Pending"
    | "Inactive"
    | "Verified"
    | "active"
    | "inactive";
  progress: number;
  gst_number?: string;
  pan_number?: string;
  company_photo?: string;
  total_members?: number;
  member_participation?: number;
  success_score?: number;
  trust_score?: number;
  health_score?: number;
  wallCountDisplay?: string;
  business_type: string;
  continent: string;
  state: string;
  city: string;
  kyc_verified: "Yes" | "No";
  enable_billing: "Yes" | "No";
  created_date: string;
  company_owner?: string;
  company_contact_number?: string;
  company_email?: string;
  company_website?: string;
};

// --- Zod Schema for Partner Filter Form ---
const companyFilterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBusinessType: z
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
  filterInterestedIn: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBrand: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCategory: z
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

// --- Status Colors & Context ---
const companyStatusColors: Record<string, string> = {
  Active:
    "bg-green-200 text-green-600 dark:bg-green-500/20 dark:text-green-300",
  Verified: "bg-blue-200 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
  Pending:
    "bg-orange-200 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
  Inactive: "bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  active:
    "bg-green-200 text-green-600 dark:bg-green-500/20 dark:text-green-300",
  inactive: "bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-300",
};
const getCompanyStatusClass = (statusValue?: CompanyItem["status"]): string => {
  if (!statusValue) return "bg-gray-200 text-gray-600";
  return companyStatusColors[statusValue] || "bg-gray-200 text-gray-600";
};
interface CompanyListStore {
  companyList: CompanyItem[];
  selectedCompanies: CompanyItem[];
  CountriesData: any[];
  ContinentsData: any[];
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

// =========================================================================
// --- FIX: The entire CompanyListProvider is updated to match the working MemberListProvider ---
// =========================================================================
const CompanyListProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { partnerData, CountriesData, ContinentsData } =
    useSelector(masterSelector);
  const dispatch = useAppDispatch();
  console.log("partnerData?.data", partnerData);
  
  // FIX: Initialize state assuming partnerData?.data is an object like { data: [], total: 0 }
  const [companyList, setCompanyList] = useState<CompanyItem[]>(
    partnerData ?? []
  );
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyItem[]>([]);
  const [companyListTotal, setCompanyListTotal] = useState<number>(
    partnerData?.length ?? 0
  );

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
  }, [dispatch]);

  // FIX: Update local state correctly when partnerData?.data from Redux changes.
  useEffect(() => {
    setCompanyList(partnerData ?? []);
    setCompanyListTotal(partnerData?.length ?? 0);
  }, [partnerData?.data]);

  useEffect(() => {
    dispatch(getpartnerAction());
  }, [dispatch]);

  return (
    <CompanyListContext.Provider
      value={{
        companyList,
        setCompanyList,
        selectedCompanies,
        setSelectedCompanies,
        companyListTotal,
        setCompanyListTotal,
        // Ensure these are always arrays to prevent downstream errors
        ContinentsData: Array.isArray(ContinentsData) ? ContinentsData : [],
        CountriesData: Array.isArray(CountriesData) ? CountriesData : [],
      }}
    >
      {children}
    </CompanyListContext.Provider>
  );
};

// --- Child Components (Search, ActionTools) (unchanged) ---
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
        onClick={() => navigate("/business-entities/create-partner")}
      >
        Add New
      </Button>
    </div>
  );
};

// ============================================================================
// --- MODALS SECTION ---
// This section is well-structured and appears correct. No changes needed.
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
  | "document";
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

const CompanyModals: React.FC<CompanyModalsProps> = ({
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
      case "members":
        return <ViewMembersDialog partner={partner} onClose={onClose} />;
      case "alert":
        return <ViewAlertDialog partner={partner} onClose={onClose} />;
      case "trackRecord":
        return <TrackRecordDialog partner={partner} onClose={onClose} />;
      case "engagement":
        return <ViewEngagementDialog partner={partner} onClose={onClose} />;
      case "transaction":
        return <ViewTransactionDialog partner={partner} onClose={onClose} />;
      case "document":
        return <DownloadDocumentDialog partner={partner} onClose={onClose} />;
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

// --- Individual Dialog Components (Unchanged) ---
const SendEmailDialog: React.FC<{
  partner: CompanyItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { subject: "", message: "" },
  });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true);
    console.log("Sending email to", partner.company_email, "with data:", data);
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
      <h5 className="mb-4">Send Email to {partner.name}</h5>
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
  partner: CompanyItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      message: `Hi ${partner.name}, following up on our conversation.`,
    },
  });
  const onSendMessage = (data: { message: string }) => {
    setIsLoading(true);
    const phone = partner.company_contact_number?.replace(/\D/g, "");
    if (!phone) {
      toast.push(<Notification type="danger" title="Invalid Phone Number" />);
      setIsLoading(false);
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      data.message
    )}`;
    window.open(url, "_blank");
    toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
    setIsLoading(false);
    onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send WhatsApp to {partner.name}</h5>
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

const AddNotificationDialog: React.FC<{
  partner: CompanyItem;
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
      partner.name,
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
      <h5 className="mb-4">Add Notification for {partner.name}</h5>
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
  partner: CompanyItem;
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
    console.log("Assigning task for", partner.name, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Task Assigned" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for {partner.name}</h5>
      <form onSubmit={handleSubmit(onAssignTask)}>
        <FormItem label="Task Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Follow up on quote" />
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
  partner: CompanyItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { title: "", eventType: null, startDate: null, notes: "" },
  });
  const onAddEvent = (data: any) => {
    setIsLoading(true);
    console.log("Adding event for", partner.name, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Event Scheduled" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for {partner.name}</h5>
      <form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Q4 Business Review" />
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

const ViewMembersDialog: React.FC<{
  partner: CompanyItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Members of {partner.name}</h5>
      <div className="mt-4 flex flex-col gap-4">
        {dummyMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={member.avatar}
                shape="circle"
                icon={<TbUserCircle />}
              />
              <div>
                <div className="font-semibold">{member.name}</div>
                <div className="text-xs text-gray-500">{member.role}</div>
              </div>
            </div>
            <Button size="xs">View Profile</Button>
          </div>
        ))}
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};

const ViewAlertDialog: React.FC<{
  partner: CompanyItem;
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
      <h5 className="mb-4">Alerts for {partner.name}</h5>
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

const TrackRecordDialog: React.FC<{
  partner: CompanyItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Track Record for {partner.name}</h5>
      <div className="mt-4 -ml-4">
        {dummyTimeline.map((item, index) => (
          <div key={item.id} className="flex gap-4 relative">
            {index < dummyTimeline.length - 1 && (
              <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-600"></div>
            )}
            <div className="flex-shrink-0 z-10 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 text-gray-500 flex items-center justify-center">
              {React.cloneElement(item.icon, { size: 24 })}
            </div>
            <div className="pb-8">
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {item.desc}
              </p>
              <p className="text-xs text-gray-400 mt-1">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-right mt-2">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};

const ViewEngagementDialog: React.FC<{
  partner: CompanyItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Engagement for {partner.name}</h5>
      <div className="grid grid-cols-2 gap-4 mt-4 text-center">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Last Contact</p>
          <p className="font-bold text-lg">5 days ago</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Health Score</p>
          <p className="font-bold text-lg text-green-500">
            {partner.health_score}%
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Emails Opened</p>
          <p className="font-bold text-lg">12 / 15</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Meetings Attended</p>
          <p className="font-bold text-lg">3</p>
        </div>
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};

const ViewTransactionDialog: React.FC<{
  partner: CompanyItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const statusColors: Record<string, string> = {
    Paid: "bg-emerald-500",
    Overdue: "bg-red-500",
  };
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={700}
    >
      <h5 className="mb-4">Transactions for {partner.name}</h5>
      <div className="max-h-[400px] overflow-y-auto">
        <Table>
          <Table.THead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Amount</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.THead>
          <Table.TBody>
            {dummyTransactions.map((tx) => (
              <Table.Tr key={tx.id}>
                <Table.Td>{tx.date}</Table.Td>
                <Table.Td>{tx.desc}</Table.Td>
                <Table.Td>{tx.amount}</Table.Td>
                <Table.Td>
                  <Tag
                    className="text-white"
                    prefix
                    prefixClass={statusColors[tx.status]}
                  >
                    {tx.status}
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

const DownloadDocumentDialog: React.FC<{
  partner: CompanyItem;
  onClose: () => void;
}> = ({ partner, onClose }) => {
  const iconMap: Record<string, React.ReactElement> = {
    pdf: <TbFileText className="text-red-500" />,
    zip: <TbFileZip className="text-amber-500" />,
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Documents for {partner.name}</h5>
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

const GenericActionDialog: React.FC<{
  type: ModalType | null;
  partner: CompanyItem;
  onClose: () => void;
}> = ({ type, partner, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type
    ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}`
    : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true);
    console.log(`Performing action '${type}' for partner ${partner.name}`);
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
        <span className="font-semibold">{partner.name}</span>?
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


// --- CompanyActionColumn Component (Unchanged) ---
const CompanyActionColumn = ({
  rowData,
  onEdit,
  onViewDetail,
  onOpenModal,
}: {
  rowData: CompanyItem;
  onEdit: (id: string) => void;
  onViewDetail: (id: string) => void;
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
          onClick={() => onViewDetail(rowData.id)}
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
          <TbMail size={18} /> <span className="text-xs">Send Email</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("whatsapp", rowData)}
          className="flex items-center gap-2"
        >
          <TbBrandWhatsapp size={18} />{" "}
          <span className="text-xs">Send on Whatsapp</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("notification", rowData)}
          className="flex items-center gap-2"
        >
          <TbBell size={18} />{" "}
          <span className="text-xs">Add as Notification</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("task", rowData)}
          className="flex items-center gap-2"
        >
          <TbUser size={18} /> <span className="text-xs">Assign to Task</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("active", rowData)}
          className="flex items-center gap-2"
        >
          <TbTagStarred size={18} />{" "}
          <span className="text-xs">Add to Active</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("calendar", rowData)}
          className="flex items-center gap-2"
        >
          <TbCalendarEvent size={18} />{" "}
          <span className="text-xs">Add to Calendar</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("members", rowData)}
          className="flex items-center gap-2"
        >
          <TbUsersGroup size={18} />{" "}
          <span className="text-xs">View Members</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("alert", rowData)}
          className="flex items-center gap-2"
        >
          <TbAlarm size={18} /> <span className="text-xs">View Alert</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("trackRecord", rowData)}
          className="flex items-center gap-2"
        >
          <TbFileSearch size={18} />{" "}
          <span className="text-xs">Track Record</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("engagement", rowData)}
          className="flex items-center gap-2"
        >
          <TbUserSearch size={18} /> <span className="text-xs">Engagement</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("transaction", rowData)}
          className="flex items-center gap-2"
        >
          <TbReceipt size={18} />{" "}
          <span className="text-xs">View Transaction</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("document", rowData)}
          className="flex items-center gap-2"
        >
          <TbDownload size={18} />{" "}
          <span className="text-xs">Download Document</span>
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};

// --- CompanyListTable Component (Unchanged logic, but will now work) ---
const CompanyListTable = () => {
  const navigate = useNavigate();
  // With the provider fixed, companyList is now a guaranteed array.
  const { companyList, selectedCompanies, setSelectedCompanies } =
    useCompanyList();
  const [isLoading, setIsLoading] = useState(false);
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

  // --- MODAL STATE AND HANDLERS ---
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
    filterFormMethods.reset({ filterCreatedDate: [null, null] });
    setFilterCriteria({ filterCreatedDate: [null, null] });
    handleSetTableData({ pageIndex: 1 });
  };

  // This useMemo will now work without crashing.
  const { pageData, total } = useMemo(() => {
    let f = [...companyList];
    if (tableData.query) {
      f = f.filter((i) =>
        Object.values(i).some((v) =>
          String(v).toLowerCase().includes(tableData.query.toLowerCase())
        )
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      f.sort((a, b) => {
        const av = a[key as keyof CompanyItem] ?? "";
        const bv = b[key as keyof CompanyItem] ?? "";
        if (typeof av === "string" && typeof bv === "string") {
          return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return 0;
      });
    }
    const pI = tableData.pageIndex as number;
    const pS = tableData.pageSize as number;
    return { pageData: f.slice((pI - 1) * pS, pI * pS), total: f.length };
  }, [companyList, tableData, filterCriteria]);

  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const handleEditCompany = (id: string) =>
    navigate(`/business-entities/partner-edit/${id}`);
  const handleViewCompanyDetails = (id: string) =>
    navigate("/business-entities/partner-create", { state: id });
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
  const csvData = useMemo(
    () =>
      companyList.map((i) => ({
        ...i,
        category: i.category,
        brands: i.brands,
      })),
    [companyList]
  );

  const columns: ColumnDef<CompanyItem>[] = useMemo(
    () => [
      {
        header: "Partner Info",
        accessorKey: "name",
        size: 220,
        cell: ({ row }) => {
          const {
            name,
            type,
            country,
            city,
            state,
            company_photo,
            company_code,
          } = row.original;
          return (
            <div className="flex flex-col">
              {" "}
              <div className="flex items-center gap-2">
                {" "}
                <Avatar
                  src={company_photo}
                  size="md"
                  shape="circle"
                  icon={<TbUserCircle />}
                />{" "}
                <div>
                  {" "}
                  <h6 className="text-xs font-semibold">{company_code}</h6>{" "}
                  <span className="text-xs font-semibold">{name}</span>{" "}
                </div>{" "}
              </div>{" "}
              <span className="text-xs mt-1">
                <b>Type:</b> {type}
              </span>{" "}
              <span className="text-xs">
                <b>Business:</b> {row.original.business_type}
              </span>{" "}
              <div className="text-xs text-gray-500">
                {city?.name}, {state?.name}, {country?.name}
              </div>{" "}
            </div>
          );
        },
      },
      {
        header: "Contact",
        accessorKey: "company_owner",
        size: 180,
        cell: (props) => {
          const {
            company_owner,
            company_contact_number,
            company_email,
            company_website,
          } = props.row.original;
          return (
            <div className="text-xs flex flex-col gap-0.5">
              {" "}
              {company_owner && (
                <span>
                  <b>Owner: </b> {company_owner}
                </span>
              )}{" "}
              {company_contact_number && <span>{company_contact_number}</span>}{" "}
              {company_email && (
                <a
                  href={`mailto:${company_email}`}
                  className="text-blue-600 hover:underline"
                >
                  {company_email}
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
        header: "Legal IDs & Status",
        size: 180,
        cell: ({ row }) => {
          const { gst_number, pan_number, status } = row.original;
          return (
            <div className="flex flex-col gap-1 text-[10px]">
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
                )} capitalize mt-1 self-start !text-[10px] px-1.5 py-0.5`}
              >
                {status}
              </Tag>{" "}
            </div>
          );
        },
      },
      // {
      //   header: "Preferences",
      //   size: 180,
      //   cell: ({ row }) => {
      //     const { brands, category, interested_in } = row.original;
      //     return (
      //       <div className="flex flex-col gap-1 text-xs">
      //         {" "}
      //         <span>
      //           <b>Brands:</b> {brands || "N/A"}
      //         </span>{" "}
      //         <span>
      //           <b>Category:</b> {category || "N/A"}
      //         </span>{" "}
      //         <span>
      //           <b>Interested In:</b> {interested_in}
      //         </span>{" "}
      //       </div>
      //     );
      //   },
      // },
      {
        header: "Profile & Scores",
        size: 190,
        cell: ({ row }) => {
          const {
            total_members = 0,
            member_participation = 0,
            progress = 0,
            success_score = 0,
            trust_score = 0,
            health_score = 0,
            kyc_verified,
            enable_billing,
          } = row.original;
          return (
            <div className="flex flex-col gap-1.5 text-xs">
              {" "}
              <span>
                <b>Members:</b> {total_members} ({member_participation}%)
              </span>{" "}
              <div className="flex gap-1 items-center">
                {" "}
                <Tooltip title={`KYC: ${kyc_verified}`}>
                  {kyc_verified === "Yes" ? (
                    <MdCheckCircle className="text-green-500 text-lg" />
                  ) : (
                    <MdCancel className="text-red-500 text-lg" />
                  )}
                </Tooltip>{" "}
                <Tooltip title={`Billing: ${enable_billing}`}>
                  {enable_billing === "Yes" ? (
                    <MdCheckCircle className="text-green-500 text-lg" />
                  ) : (
                    <MdCancel className="text-red-500 text-lg" />
                  )}
                </Tooltip>{" "}
              </div>{" "}
              <Tooltip title={`Profile Completion ${progress}%`}>
                <div className="h-1.5 w-full rounded-full bg-gray-300">
                  <div
                    className="rounded-full h-1.5 bg-blue-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </Tooltip>{" "}
              <div className="grid grid-cols-3 gap-x-1 text-center mt-1">
                {" "}
                <Tooltip title={`Success: ${success_score}%`}>
                  <div className="bg-green-100 dark:bg-green-500/20 text-green-700 p-0.5 rounded text-[10px]">
                    S: {success_score}%
                  </div>
                </Tooltip>{" "}
                <Tooltip title={`Trust: ${trust_score}%`}>
                  <div className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 p-0.5 rounded text-[10px]">
                    T: {trust_score}%
                  </div>
                </Tooltip>{" "}
                <Tooltip title={`Health: ${health_score}%`}>
                  <div className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 p-0.5 rounded text-[10px]">
                    H: {health_score}%
                  </div>
                </Tooltip>{" "}
              </div>{" "}
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
            onViewDetail={handleViewCompanyDetails}
            onOpenModal={handleOpenModal}
          />
        ),
      },
    ],
    [handleOpenModal] // Keep handleOpenModal dependency
  );

  const handleImport = () => {
    console.log("Import Companies Clicked"); /* Implement import */
  };

  // Dynamic Filter Options
  const statusOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.status))).map((s) => ({
        value: s,
        label: s,
      })),
    [companyList]
  );
  const businessTypeOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.business_type))).map(
        (bt) => ({ value: bt, label: bt })
      ),
    [companyList]
  );
  const companyTypeOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.type))).map((ct) => ({
        value: ct,
        label: ct,
      })),
    [companyList]
  );
  const continentOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.continent))).map((co) => ({
        value: co,
        label: co,
      })),
    [companyList]
  );
  const countryOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.country))).map((cy) => ({
        value: cy,
        label: cy,
      })),
    [companyList]
  );
  const stateOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.state))).map((st) => ({
        value: st,
        label: st,
      })),
    [companyList]
  );
  const cityOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.city))).map((ci) => ({
        value: ci,
        label: ci,
      })),
    [companyList]
  );
  const interestedInOptions = useMemo(
    () =>
      Array.from(new Set(companyList.map((c) => c.interested_in))).map(
        (ii) => ({ value: ii, label: ii })
      ),
    [companyList]
  );
  const brandOptions = useMemo(
    () =>
      Array.from(new Set(companyList.flatMap((c) => c.brands))).map((b) => ({
        value: b,
        label: b,
      })),
    [companyList]
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(new Set(companyList.flatMap((c) => c.category))).map(
        (cat) => ({ value: cat, label: cat })
      ),
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <CompanyListSearch
          onInputChange={(val) =>
            handleSetTableData({ query: val, pageIndex: 1 })
          }
        />
        <div className="flex gap-2">
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>
            Filter
          </Button>
          <Button icon={<TbCloudDownload />} onClick={handleImport}>
            Import
          </Button>
          {companyList.length > 0 ? (
            <CSVLink data={csvData} filename="companies_export.csv">
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
            <UiFormItem label="Business Type">
              <Controller
                name="filterBusinessType"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Type"
                    options={businessTypeOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Partner Type">
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
            <UiFormItem label="Interested In">
              <Controller
                name="filterInterestedIn"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Interest"
                    options={interestedInOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Brand">
              <Controller
                name="filterBrand"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Brand"
                    options={brandOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Category">
              <Controller
                name="filterCategory"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Category"
                    options={categoryOptions}
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
      {/* --- RENDER THE MODAL MANAGER --- */}
      <CompanyModals modalState={modalState} onClose={handleCloseModal} />
    </>
  );
};

// --- CompanyListSelected & Main Partner Component (Unchanged) ---
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
      const ids = selectedCompanies.map((d) => d.id);
      await dispatch(deleteAllpartnerAction({ ids: ids.toString() })).unwrap();
      toast.push(<Notification title="Partner Deleted" type="success" />);
      dispatch(getpartnerAction());
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
      {" "}
      <StickyFooter
        className="flex items-center justify-between py-4"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        {" "}
        <div className="container mx-auto flex items-center justify-between">
          {" "}
          <span>
            <span className="flex items-center gap-2">
              <TbChecks className="text-lg text-primary-600" />
              <span className="font-semibold">
                {selectedCompanies.length} Companies selected
              </span>
            </span>
          </span>{" "}
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
          </div>{" "}
        </div>{" "}
      </StickyFooter>{" "}
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title="Remove Companies"
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to remove these companies? This action can't be
          undone.
        </p>
      </ConfirmDialog>{" "}
      <Dialog
        isOpen={sendMessageDialogOpen}
        onClose={() => setSendMessageDialogOpen(false)}
      >
        {" "}
        <h5 className="mb-2">Send Message</h5>{" "}
        <Avatar.Group
          chained
          omittedAvatarTooltip
          className="mt-4"
          maxCount={4}
        >
          {selectedCompanies.map((c) => (
            <Tooltip key={c.id} title={c.name}>
              <Avatar src={c.company_photo} icon={<TbUserCircle />} />
            </Tooltip>
          ))}
        </Avatar.Group>{" "}
        <div className="my-4">
          <RichTextEditor />
        </div>{" "}
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
        </div>{" "}
      </Dialog>{" "}
    </>
  );
};

const Partner = () => {
  return (
    <CompanyListProvider>
      <Container>
        <AdaptiveCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h5>Partner</h5>
              <CompanyListActionTools />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                  <TbUsersGroup size={24} />
                </div>
                <div>
                  <h6>8</h6>
                  <span className="text-xs font-semibold">Total</span>
                </div>
              </Card>
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                  <TbUser size={24} />
                </div>
                <div>
                  <h6>2</h6>
                  <span className="text-xs font-semibold">Active</span>
                </div>
              </Card>
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                  <TbUserX size={24} />
                </div>
                <div>
                  <h6>34</h6>
                  <span className="text-xs font-semibold">Unregistered</span>
                </div>
              </Card>
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                  <TbUserCancel size={24} />
                </div>
                <div>
                  <h6>20</h6>
                  <span className="text-xs font-semibold">Disabled</span>
                </div>
              </Card>
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                  <TbUserCheck size={24} />
                </div>
                <div>
                  <h6>4</h6>
                  <span className="text-xs font-semibold">Verified</span>
                </div>
              </Card>
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                  <TbUserMinus size={24} />
                </div>
                <div>
                  <h6>4</h6>
                  <span className="text-xs font-semibold">Unverified</span>
                </div>
              </Card>
              
            </div>
            <CompanyListTable />
          </div>
        </AdaptiveCard>
      </Container>
      <CompanyListSelected />
    </CompanyListProvider>
  );
};

export default Partner;