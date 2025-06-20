import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { CSVLink } from "react-csv";
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
  DatePicker,
  Drawer,
  Dropdown,
  Form as UiForm,
  FormItem as UiFormItem,
  Input as UiInput,
  Select as UiSelect,
  Table,
  FormItem,
  Input,
  Select,
  Card,
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
  TbAffiliate,
  TbAlarm,
  TbAlertTriangle,
  TbBell,
  TbBrandWhatsapp,
  TbBuilding,
  TbCalendar,
  TbCalendarEvent,
  TbCheck,
  TbChecks,
  TbClipboardText,
  TbCloudDownload,
  TbCloudUpload,
  TbDotsVertical,
  TbDownload,
  TbEye,
  TbEyeDollar,
  TbFileSearch,
  TbFileText,
  TbFileZip,
  TbFilter,
  TbInfoCircle,
  TbKey,
  TbLink,
  TbMail,
  TbMessageCircle,
  TbMessageReport,
  TbPencil,
  TbPlus,
  TbReceipt,
  TbSearch,
  TbShare,
  TbTagStarred,
  TbUser,
  TbUserCancel,
  TbUserCheck,
  TbUserCircle,
  TbUserExclamation,
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
  deleteAllMemberAction,
  getMemberAction,
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";
import { MdCheckCircle } from "react-icons/md";
import Tr from "@/components/ui/Table/Tr";
import Td from "@/components/ui/Table/Td";

// --- MemberData Type (FormItem) ---
export type FormItem = {
  id: string;
  member_name: string;
  member_contact_number: string;
  member_email_id: string;
  member_photo: string;
  member_photo_upload: string;
  member_role: string;
  member_status: "active" | "inactive";
  member_join_date: string;
  profile_completion: number;
  success_score: number;
  trust_score: number;
  activity_score: number;
  associated_brands: string[];
  business_category: string[];
  interested_in: string;
  company_id: string;
  company_name: string;
  membership_stats: string;
  member_location: string;
  kyc_status: string;
  // Added for modal consistency
  health_score?: number;
};
// --- End MemberData Type ---

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterContinent: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBusinessType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterState: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCity: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInterestedFor: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInterestedCategory: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterBrand: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterKycVerified: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;
// --- End Filter Schema ---

// ============================================================================
// --- MODALS SECTION ---
// All modal components for Members are defined here.
// ============================================================================

// --- Type Definitions for Modals ---
export type MemberModalType =
  | "email"
  | "whatsapp"
  | "notification"
  | "task"
  | "active"
  | "calendar"
  | "alert"
  | "trackRecord"
  | "engagement"
  | "document"
  | "feedback"
  | "wallLink";

export interface MemberModalState {
  isOpen: boolean;
  type: MemberModalType | null;
  data: FormItem | null;
}
interface MemberModalsProps {
  modalState: MemberModalState;
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
const dummyAlerts = [
  {
    id: 1,
    severity: "danger",
    message: "KYC verification failed. Please re-submit documents.",
    time: "2 days ago",
  },
  {
    id: 2,
    severity: "warning",
    message: "Membership renewal is due in 7 days.",
    time: "5 days ago",
  },
];
const dummyTimeline = [
  {
    id: 1,
    icon: <TbMail />,
    title: "Email Sent",
    desc: "Sent welcome email and onboarding guide.",
    time: "2023-11-01",
  },
  {
    id: 2,
    icon: <TbCalendar />,
    title: "Onboarding Call Scheduled",
    desc: "Scheduled a call to discuss platform features.",
    time: "2023-10-28",
  },
  {
    id: 3,
    icon: <TbUser />,
    title: "Member Joined",
    desc: "Initial registration completed.",
    time: "2023-10-27",
  },
];
const dummyTransactions = [
  {
    id: "tx1",
    date: "2023-10-15",
    desc: "Membership Fee",
    amount: "$1,200.00",
    status: "Paid",
  },
];
const dummyDocs = [
  {
    id: "doc1",
    name: "ID_Proof_Passport.pdf",
    type: "pdf",
    size: "1.8 MB",
  },
  {
    id: "doc2",
    name: "Company_Registration.zip",
    type: "zip",
    size: "5.2 MB",
  },
];

const MemberModals: React.FC<MemberModalsProps> = ({
  modalState,
  onClose,
}) => {
  const { type, data: member, isOpen } = modalState;
  if (!isOpen || !member) return null;

  const renderModalContent = () => {
    switch (type) {
      case "email":
        return <SendEmailDialog member={member} onClose={onClose} />;
      case "whatsapp":
        return <SendWhatsAppDialog member={member} onClose={onClose} />;
      case "notification":
        return <AddNotificationDialog member={member} onClose={onClose} />;
      case "task":
        return <AssignTaskDialog member={member} onClose={onClose} />;
      case "calendar":
        return <AddScheduleDialog member={member} onClose={onClose} />;
      case "alert":
        return <ViewAlertDialog member={member} onClose={onClose} />;
      case "trackRecord":
        return <TrackRecordDialog member={member} onClose={onClose} />;
      case "engagement":
        return <ViewEngagementDialog member={member} onClose={onClose} />;
      case "document":
        return <DownloadDocumentDialog member={member} onClose={onClose} />;
      // Add other cases as needed
      default:
        return (
          <GenericActionDialog
            type={type}
            member={member}
            onClose={onClose}
          />
        );
    }
  };
  return <>{renderModalContent()}</>;
};

// --- Individual Dialog Components ---
const SendEmailDialog: React.FC<{ member: FormItem; onClose: () => void }> = ({
  member,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { subject: "", message: "" },
  });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true);
    console.log("Sending email to", member.member_email_id, "with data:", data);
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
      <h5 className="mb-4">Send Email to {member.member_name}</h5>
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
  member: FormItem;
  onClose: () => void;
}> = ({ member, onClose }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      message: `Hi ${member.member_name}, regarding your membership...`,
    },
  });
  const onSendMessage = (data: { message: string }) => {
    const phone = member.member_contact_number?.replace(/\D/g, "");
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
      <h5 className="mb-4">Send WhatsApp to {member.member_name}</h5>
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
  member: FormItem;
  onClose: () => void;
}> = ({ member, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { title: "", users: [], message: "" },
  });
  const onSend = (data: any) => {
    setIsLoading(true);
    console.log(
      "Sending in-app notification for",
      member.member_name,
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
      <h5 className="mb-4">Add Notification for {member.member_name}</h5>
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

const AssignTaskDialog: React.FC<{ member: FormItem; onClose: () => void }> = ({
  member,
  onClose,
}) => {
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
    console.log("Assigning task for", member.member_name, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Task Assigned" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for {member.member_name}</h5>
      <form onSubmit={handleSubmit(onAssignTask)}>
        <FormItem label="Task Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Follow up on KYC" />
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

const AddScheduleDialog: React.FC<{ member: FormItem; onClose: () => void }> =
  ({ member, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit } = useForm({
      defaultValues: {
        title: "",
        eventType: null,
        startDate: null,
        notes: "",
      },
    });
    const onAddEvent = (data: any) => {
      setIsLoading(true);
      console.log("Adding event for", member.member_name, "with data:", data);
      setTimeout(() => {
        toast.push(<Notification type="success" title="Event Scheduled" />);
        setIsLoading(false);
        onClose();
      }, 1000);
    };
    return (
      <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
        <h5 className="mb-4">Add Schedule for {member.member_name}</h5>
        <form onSubmit={handleSubmit(onAddEvent)}>
          <FormItem label="Event Title">
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., Onboarding Call" />
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

const ViewAlertDialog: React.FC<{ member: FormItem; onClose: () => void }> = ({
  member,
  onClose,
}) => {
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
      <h5 className="mb-4">Alerts for {member.member_name}</h5>
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
  member: FormItem;
  onClose: () => void;
}> = ({ member, onClose }) => {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Track Record for {member.member_name}</h5>
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
  member: FormItem;
  onClose: () => void;
}> = ({ member, onClose }) => {
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Engagement for {member.member_name}</h5>
      <div className="grid grid-cols-2 gap-4 mt-4 text-center">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Last Active</p>
          <p className="font-bold text-lg">2 days ago</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Health Score</p>
          <p className="font-bold text-lg text-green-500">
            {member.health_score || 85}%
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Logins (30d)</p>
          <p className="font-bold text-lg">25</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Wall Posts</p>
          <p className="font-bold text-lg">8</p>
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

const DownloadDocumentDialog: React.FC<{
  member: FormItem;
  onClose: () => void;
}> = ({ member, onClose }) => {
  const iconMap: Record<string, React.ReactElement> = {
    pdf: <TbFileText className="text-red-500" />,
    zip: <TbFileZip className="text-amber-500" />,
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Documents for {member.member_name}</h5>
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
  type: MemberModalType | null;
  member: FormItem;
  onClose: () => void;
}> = ({ type, member, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type
    ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}`
    : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true);
    console.log(`Performing action '${type}' for member ${member.member_name}`);
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
        <span className="font-semibold">{member.member_name}</span>?
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

// --- Status Colors ---
const statusColor: Record<FormItem["member_status"], string> = {
  active: "bg-green-200 dark:bg-green-200 text-green-600 dark:text-green-600",
  inactive: "bg-red-200 dark:bg-red-200 text-red-600 dark:text-red-600",
};

// --- MOCK FILTER OPTIONS (Replace with dynamic/actual data) ---
const memberStatusOptions = [
  { value: "active", label: "Active" },
  { value: "disbled", label: "Disabled" },
  { value: "unregistered", label: "Unregistered" },
];
const continentOptions = [
  { value: "Asia", label: "Asia" },
  { value: "Africa", label: "Africa" },
  { value: "North America", label: "North America" },
  { value: "South America", label: "South America" },
  { value: "Antarctica", label: "Antarctica" },
  { value: "Europe", label: "Europe" },
  { value: "Australia", label: "Australia" },
];
const businessTypeOptions = [
  { value: "Manufacturer", label: "Manufacturer" },
  { value: "Retailer", label: "Retailer" },
  { value: "Service", label: "Service" },
  { value: "Automotive", label: "Automotive" },
  { value: "Electronics", label: "Electronics" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "IT Services", label: "IT Services" },
  { value: "FinTech", label: "FinTech" },
];
 const businessOpportunityOptions = [
    { value: "Indian Buyer", label: "Indian Buyer" },
    { value: "Indian Supplier", label: "Indian Supplier" },
    { value: "Global Buyer", label: "Global Buyer" },
    { value: "Global Supplier", label: "Global Supplier" },
  ];
const stateOptions = [
  { value: "NY", label: "New York" },
  { value: "CA", label: "California" },
  { value: "KA", label: "Karnataka" },
];
const cityOptions = [
  { value: "New York City", label: "New York City" },
  { value: "Los Angeles", label: "Los Angeles" },
  { value: "Bengaluru", label: "Bengaluru" },
];
const interestedForOptions = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
  { value: "Both", label: "Both" },
];
const kycStatusOptions = [
  { value: "Verified", label: "Verified" },
  { value: "Pending", label: "Pending" },
  { value: "Not Submitted", label: "Not Submitted" },
];
// --- END MOCK FILTER OPTIONS ---

// --- Simplified Member List Store ---
interface MemberListStore {
  memberList: FormItem[];
  selectedMembers: FormItem[];
  memberListTotal: number;
  setMemberList: React.Dispatch<React.SetStateAction<FormItem[]>>;
  setSelectedMembers: React.Dispatch<React.SetStateAction<FormItem[]>>;
  setMemberListTotal: React.Dispatch<React.SetStateAction<number>>;
}

const MemberListContext = React.createContext<MemberListStore | undefined>(
  undefined
);

const useMemberList = (): MemberListStore => {
  const context = useContext(MemberListContext);
  if (!context) {
    throw new Error("useMemberList must be used within a MemberListProvider");
  }
  return context;
};

const MemberListProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { MemberData } = useSelector(masterSelector);
  const dispatch = useAppDispatch();

  const [memberList, setMemberList] = useState<FormItem[]>(
    MemberData?.data ?? []
  );
  const [selectedMembers, setSelectedMembers] = useState<FormItem[]>([]);
  const [memberListTotal, setMemberListTotal] = useState<number>(
    MemberData?.total ?? 0
  );

  useEffect(() => {
    setMemberList(MemberData?.data ?? []);
    setMemberListTotal(MemberData?.total ?? 0);
  }, [MemberData]);

  useEffect(() => {
    dispatch(getMemberAction());
  }, [dispatch]);

  return (
    <MemberListContext.Provider
      value={{
        memberList,
        setMemberList,
        selectedMembers,
        setSelectedMembers,
        memberListTotal,
        setMemberListTotal,
      }}
    >
      {children}
    </MemberListContext.Provider>
  );
};
// --- End Member List Store ---

// --- FormListSearch Component ---
interface FormListSearchProps {
  onInputChange: (value: string) => void;
}
const FormListSearch: React.FC<FormListSearchProps> = ({ onInputChange }) => {
  return (
    <DebouceInput
      placeholder="Quick Search..."
      onChange={(e) => onInputChange(e.target.value)}
      suffix={<TbSearch />}
    />
  );
};
// --- End FormListSearch ---

// --- FormListActionTools Component ---
const FormListActionTools = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button
        className="mr-2"
        icon={<TbEye />}
        clickFeedback={false}
        customColorClass={({ active, unclickable }) =>
          classNames(
            "hover:text-green-800 dark:hover:bg-green-600 border-0 hover:ring-0",
            active ? "bg-green-200" : "bg-green-100",
            unclickable && "opacity-50 cursor-not-allowed",
            !active && !unclickable && "hover:bg-green-200"
          )
        }
      >
        View Bit Route
      </Button>
      <Button
        variant="solid"
        icon={<TbPlus className="text-lg" />}
        onClick={() => navigate("/business-entities/member-create")}
      >
        Add New
      </Button>
    </div>
  );
};
// --- End FormListActionTools ---

// --- ActionColumn Component ---
const ActionColumn = ({
  rowData,
  onEdit,
  onViewDetail,
  onOpenModal,
}: {
  rowData: FormItem;
  onEdit: () => void;
  onViewDetail: () => void;
  onOpenModal: (type: MemberModalType, data: FormItem) => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          role="button"
          onClick={onViewDetail}
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

        {/* Replace Track Record with View Company */}
        <Dropdown.Item
          onClick={() => onOpenModal("trackRecord", rowData)}
          className="flex items-center gap-2"
        >
          <TbFileSearch size={18} />{" "}
          <span className="text-xs">View Company</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("engagement", rowData)}
          className="flex items-center gap-2"
        >
          <TbUserSearch size={18} /> <span className="text-xs">Engagement</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("document", rowData)}
          className="flex items-center gap-2"
        >
          <TbDownload size={18} />{" "}
          <span className="text-xs">Download Document</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("feedback", rowData)}
          className="flex items-center gap-2"
        >
          <TbMessageReport size={18} />{" "}
          <span className="text-xs">View Request & Feedback</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("wallLink", rowData)}
          className="flex items-center gap-2"
        >
          <TbLink size={18} /> <span className="text-xs">Add Wall Link</span>
        </Dropdown.Item>
        <Dropdown.Item
          className="flex items-center gap-2"
        >
          <TbKey size={18} /> <span className="text-xs">Reset Password</span>
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
// --- End ActionColumn ---

// --- FormListTable Component ---
const FormListTable = () => {
  const navigate = useNavigate();
  const {
    memberList: forms,
    setMemberList,
    selectedMembers,
    setSelectedMembers,
    memberListTotal,
    setMemberListTotal,
  } = useMemberList();

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});

  // --- MODAL STATE AND HANDLERS ---
  const [modalState, setModalState] = useState<MemberModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const handleOpenModal = (type: MemberModalType, memberData: FormItem) =>
    setModalState({ isOpen: true, type, data: memberData });
  const handleCloseModal = () =>
    setModalState({ isOpen: false, type: null, data: null });
  // --- END MODAL STATE AND HANDLERS ---

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  useEffect(() => {
    filterFormMethods.reset(filterCriteria);
  }, [filterCriteria, filterFormMethods.reset]);

  const openFilterDrawer = () => {
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const fetchPageData = useCallback(
    async (pageIdx: number, limit: number, currentSort?: OnSortParam) => {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", String(pageIdx));
      params.append("limit", String(limit));

      try {
        const response = await axiosInstance.get(
          `/customer?${params.toString()}`
        );
        setMemberList(response.data?.data?.data ?? []);
        setMemberListTotal(response.data?.data?.total ?? 0);
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
    [setMemberList, setMemberListTotal]
  );

  useEffect(() => {
    fetchPageData(
      tableData.pageIndex as number,
      tableData.pageSize as number,
      tableData.sort as OnSortParam
    );
  }, [tableData.pageIndex, tableData.pageSize, tableData.sort, fetchPageData]);

  const handleQueryChange = (newQuery: string) => {
    setTableData((prev) => ({ ...prev, query: newQuery, pageIndex: 1 }));
  };

  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters: FilterFormData = {};
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  };

  const { pageData, total } = useMemo(() => {
    if (!forms) {
      return { pageData: [], total: 0 };
    }
    let processedData = [...forms];
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      processedData = processedData.filter(
        (form) =>
          form.member_name?.toLowerCase().includes(query) ||
          form.member_email_id?.toLowerCase().includes(query) ||
          form.company_name?.toLowerCase().includes(query)
      );
    }
    if (
      filterCriteria.filterStatus &&
      filterCriteria.filterStatus.length > 0
    ) {
      const selectedStatuses = filterCriteria.filterStatus.map(
        (opt) => opt.value
      );
      processedData = processedData.filter((form) =>
        selectedStatuses.includes(form.member_status)
      );
    }
    // ... other client-side filters
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        const aValue = a[key as keyof FormItem] ?? "";
        const bValue = b[key as keyof FormItem] ?? "";
        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }

    return { pageData: processedData, total: memberListTotal };
  }, [forms, tableData, filterCriteria, memberListTotal]);

  const handleEdit = (form: FormItem) => {
    navigate(`/business-entities/member-edit/${form.id}`);
  };
  const handleViewDetails = (form: FormItem) => {
    navigate("/business-entities/member-create", { state: form });
  };

  const columns: ColumnDef<FormItem>[] = useMemo(
    () => [
      {
        header: "Member",
        accessorKey: "member_name",
        size: 180,
        cell: (props) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {/* <Avatar
                size={32}
                shape="circle"
                src={props.row.original.member_photo}
                icon={<TbUserCircle />}
              /> */}
              <div className="text-xs">
                <b className="text-xs text-blue-500"><em>70892{props.row.original.id}</em></b> <br />
                <b className="texr-xs">{props.row.original.member_name || "Ajay Patel"}</b>
              </div>
            </div>
            <div className="text-xs">
              <div className="text-xs text-gray-500">
                {props.row.original.member_email_id || "xyz@gmail.com"}
              </div>
              <div className="text-xs text-gray-500">
                {props.row.original.member_contact_number || "+91 8972940112"}
              </div>
              <div className="text-xs text-gray-500">
                {props.row.original.member_location || "India"}
              </div>
            </div>
          </div>
        ),
      },
      {
        header: "Company",
        accessorKey: "company_name",
        size: 200,
        cell: (props) => (
          <div className="ml-2 rtl:mr-2 text-xs">
            <b className="text-xs ">
              <em className="text-blue-500">{props.row.original.company_id || 5067892}</em>
              
            </b>
            <div className="text-xs flex gap-1">
              <MdCheckCircle size={20} className="text-green-500"/>
              <b className="">{props.row.original.company_name || "Unique Enterprise"}</b>
            </div>
          </div>
        ),
      },
      {
        header: "Status",
        accessorKey: "member_status",
        size: 140,
        cell: (props) => {
          const { member_status, member_join_date } = props.row.original;
          return (
            <div className="flex flex-col text-xs">
              <Tag className={`${statusColor[member_status]} inline capitalize`}>
                {member_status || "Active"}
              </Tag>
              <span className="mt-0.5">
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Joined Date:    {" "}
                  {new Date(member_join_date)
                    .toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                    .replace(/ /g, "/")}
                </div>
              </span>
            </div>
          );
        },
      },
      {
        header: "Profile",
        accessorKey: "profile_completion",
        size: 220,
        cell: (props) => (
          <div className="text-xs flex flex-col">
            <div>
              <Tag className="text-[10px] mb-1 bg-orange-100 text-orange-400">
                {props.row.original.membership_stats}
              </Tag>
            </div>
            <span>
              <b>RM: </b>
              {props.row.original.member_name}
            </span>
            <span>
              <b>Grade: </b>A
            </span>
            <span>
              <b>Business Opportunity: </b> 
              <span>Indian Buyer</span>
              {/* Can be Multiple , below are the options */}
              {/* <span>Indian Supplier</span>
              <span>Global Buyer</span>
              <span>Global Buyer</span> */}
            </span>
            <Tooltip
              title={`Profile: ${props.row.original.profile_completion}%`}
            >
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{
                    width: `${props.row.original.profile_completion}%`,
                  }}
                ></div>
              </div>
            </Tooltip>
          </div>
        ),
      },
      {
        header: "Preferences",
        accessorKey: "associated_brands",
        size: 300,
        cell: (props) => {
          const [isOpen , setIsOpen] = useState<boolean>(false)
          const openDialog = ()=> setIsOpen(true)
          const closeDialog = ()=> setIsOpen(false)
          return (
          <div className="flex flex-col gap-1">
            <span className="text-xs">
              <b className="text-xs">Business Type: </b>
              <span className="text-[11px]">
                Manufacturer 
              </span>
            </span>
            <span className="text-xs">
              <div className="flex gap-1">
                {/* <span className="h-4 w-4 flex items-center justify-center rounded-full bg-blue-500 text-white">i</span> */}
                <span onClick={openDialog}><TbInfoCircle size={16} className="text-blue-500 cursor-pointer"/></span>
                <b className="text-xs">Brands: </b>
              </div>
              <span className="text-[11px]">
                {props.row.original.associated_brands}
              </span>
            </span>
            <span className="text-xs">
              <b className="text-xs">Category: </b>
              <span className="text-[11px]">
                {props.row.original.business_category}
              </span>
            </span>
            <span className="text-xs">
              <span className="text-[11px]">
                <b className="text-xs">Interested: </b>
                {props.row.original.interested_in}
              </span>
            </span>
            <Dialog width={620} isOpen={isOpen} onRequestClose={closeDialog} onClose={closeDialog}>
                <h6>Dynamic Profile</h6>
                <Table className="mt-6">
                  <Tr className="bg-gray-100">
                    <Td width={130}>Member Type</Td>
                    <Td>Brands</Td>
                    <Td>Category</Td>
                    <Td>Sub Category</Td>
                  </Tr>
                  <Tr className="">
                    <Td>INS - PREMIUM</Td>
                    <Td><span className="flex gap-0.5 flex-wrap"><Tag>Apple</Tag><Tag>Samsung</Tag><Tag>POCO</Tag></span></Td>
                    <Td><Tag>Electronics</Tag></Td>
                    <Td><span className="flex gap-0.5 flex-wrap"><Tag>Mobile</Tag><Tag>Laptop</Tag></span></Td>
                  </Tr>
                </Table>
            </Dialog>
          </div>)
        },
      },
      // {
      //   header: "Ratio",
      //   accessorKey: "trust_score",
      //   size: 110,
      //   cell: (props) => (
      //     <div className="flex flex-col gap-1">
      //       <Tag className="flex gap-1 text-[10px]">
      //         <b>Success:</b> {props.row.original.success_score}%
      //       </Tag>
      //       <Tag className="flex gap-1 text-[10px]">
      //         <b>Trust:</b> {props.row.original.trust_score}%
      //       </Tag>
      //       <Tag className="flex gap-1 text-[10px] flex-wrap">
      //         <b>Activity:</b> {props.row.original.activity_score}%
      //       </Tag>
      //     </div>
      //   ),
      // },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            rowData={props.row.original}
            onEdit={() => handleEdit(props.row.original)}
            onViewDetail={() => handleViewDetails(props.row.original)}
            onOpenModal={handleOpenModal}
          />
        ),
      },
    ],
    [handleOpenModal]
  );

  const handlePaginationChange = useCallback((page: number) => {
    setTableData((prev) => ({ ...prev, pageIndex: page }));
  }, []);
  const handleSelectChange = useCallback((value: number) => {
    setTableData((prev) => ({
      ...prev,
      pageSize: Number(value),
      pageIndex: 1,
    }));
  }, []);
  const handleSort = useCallback((sort: OnSortParam) => {
    setTableData((prev) => ({ ...prev, sort: sort, pageIndex: 1 }));
  }, []);

  const handleRowSelect = useCallback(
    (checked: boolean, row: FormItem) => {
      setSelectedMembers((prevSelected) => {
        if (checked) {
          return [...prevSelected, row];
        } else {
          return prevSelected.filter((item) => item.id !== row.id);
        }
      });
    },
    [setSelectedMembers]
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<FormItem>[]) => {
      const originalItemsOnPage = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedMembers((prevSelected) => {
          const newSelections = originalItemsOnPage.filter(
            (pageItem) =>
              !prevSelected.some((selItem) => selItem.id === pageItem.id)
          );
          return [...prevSelected, ...newSelections];
        });
      } else {
        setSelectedMembers((prevSelected) =>
          prevSelected.filter(
            (selItem) =>
              !originalItemsOnPage.some(
                (pageItem) => pageItem.id === selItem.id
              )
          )
        );
      }
    },
    [setSelectedMembers]
  );

  const handleImport = () => {
    console.log("Import clicked");
  };

  const csvData = useMemo(() => {
    if (!forms || forms.length === 0) return [];
    return forms.map((form) => {
      const newForm: Record<string, any> = { ...form };
      Object.keys(newForm).forEach((key) => {
        if (Array.isArray(newForm[key])) {
          newForm[key] = (newForm[key] as string[]);
        }
      });
      return newForm;
    });
  }, [forms]);

  const getBrandOptions = useMemo(() => {
    if (!forms) return [];
    return forms
      .flatMap((f) => f.associated_brands)
      .filter((v, i, a) => a.indexOf(v) === i && v)
      .map((b) => ({ value: b, label: b }));
  }, [forms]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <FormListSearch onInputChange={handleQueryChange} />
        <div className="flex gap-2">
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>
            Filter
          </Button>
          {/* <Button icon={<TbCloudDownload />} onClick={handleImport}>
            Import
          </Button> */}
          {forms && forms.length > 0 ? (
            <CSVLink data={csvData} filename="members_export.csv">
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
        noData={!isLoading && (!pageData || pageData.length === 0)}
        loading={isLoading}
        pagingData={{
          total: total,
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        checkboxChecked={(row) =>
          selectedMembers.some((selected) => selected.id === row.original.id)
        }
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={(checked, row) =>
          handleRowSelect(checked, row.original)
        }
        onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      <Drawer
        title="Filters"
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
              form="filterMemberForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <UiForm
          id="filterMemberForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
        >
          <div className="sm:grid grid-cols-2 gap-2">
            <UiFormItem label="Status">
              <Controller
                name="filterStatus"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={memberStatusOptions}
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
            <UiFormItem label="Business Opportunity">
              <Controller
                name="filterBusinessOpportunity"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Opportunity"
                    options={businessOpportunityOptions}
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
                    options={[
                      {label: "India", value: "India"}
                    ]}
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
            <UiFormItem label="Interested For">
              <Controller
                name="filterInterestedFor"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Interest"
                    options={interestedForOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Interested Category">
              <Controller
                name="filterInterestedCategory"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Category"
                    options={businessTypeOptions}
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
                    options={getBrandOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Dealing in Bulk">
              <Controller
                name="filterDealing"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select"
                    options={[
                      {label:"Yes", value: "Yes"},
                      {label:"No", value: "No"},
                    ]}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Grade">
              <Controller
                name="memberGrade"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Grade"
                    options={[
                      {label:"A", value: "A"},
                      {label:"B", value: "B"},
                      {label:"C", value: "C"},
                    ]}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            {/* <UiFormItem label="KYC Verified">
              <Controller
                name="filterKycVerified"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={kycStatusOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem> */}
          </div>
        </UiForm>
      </Drawer>
      <MemberModals modalState={modalState} onClose={handleCloseModal} />
    </>
  );
};
// --- End FormListTable ---

// --- FormListSelected Component ---
const FormListSelected = () => {
  const { selectedMembers, setSelectedMembers } = useMemberList();

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const dispatch = useAppDispatch();

  const handleConfirmDelete = async () => {
    if (!selectedMembers || selectedMembers.length === 0) {
      toast.push(
        <Notification title="Error" type="danger">
          No members selected for deletion.
        </Notification>
      );
      setDeleteConfirmationOpen(false);
      return;
    }

    setDeleteConfirmationOpen(false);
    try {
      const ids = selectedMembers.map((data) => data.id);
      await dispatch(deleteAllMemberAction({ ids: ids.join(",") })).unwrap();
      toast.push(
        <Notification title="Members Deleted" type="success" duration={2000}>
          {selectedMembers.length} member(s) deleted.
        </Notification>
      );
      dispatch(getMemberAction());
      setSelectedMembers([]);
    } catch (error: any) {
      const errorMessage = error.message || "Could not delete members.";
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {errorMessage}
        </Notification>
      );
      console.error("Delete members Error:", error);
    }
  };

  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      toast.push(
        <Notification type="success" title="Message Sent">
          Message sent to {selectedMembers.length} member(s)!
        </Notification>,
        {
          placement: "top-center",
        }
      );
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedMembers([]);
      setMessageContent("");
    }, 1000);
  };

  if (selectedMembers.length === 0) {
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
                    {selectedMembers.length} Members
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
                Message
              </Button>
            </div>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Remove ${selectedMembers.length} Member(s)`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmButtonColor="red-600"
      >
        <p>
          Are you sure you want to remove {selectedMembers.length} selected
          member(s)? This action can't be undone.
        </p>
      </ConfirmDialog>
      <Dialog
        isOpen={sendMessageDialogOpen}
        onRequestClose={() => setSendMessageDialogOpen(false)}
        onClose={() => setSendMessageDialogOpen(false)}
        width={600}
      >
        <h5 className="mb-2">Send Message</h5>
        <p>
          Send message to the following {selectedMembers.length} member(s):
        </p>
        <Avatar.Group
          chained
          omittedAvatarTooltip
          className="my-4"
          maxCount={6}
          omittedAvatarProps={{ size: 30 }}
        >
          {selectedMembers.map((member) => (
            <Tooltip key={member.id} title={member.member_name}>
              <Avatar
                size={30}
                src={member.member_photo || undefined}
                icon={!member.member_photo ? <TbUserCircle /> : undefined}
                alt={member.member_name}
              />
            </Tooltip>
          ))}
        </Avatar.Group>
        <div className="my-4">
          <RichTextEditor value={messageContent} onChange={setMessageContent} />
        </div>
        <div className="ltr:justify-end flex items-center gap-2 mt-4">
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
// --- End FormListSelected ---

// --- Main Member Page Component ---
const Member = () => {
  return (
    <MemberListProvider>
      <>
        <Container>
          <AdaptiveCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h5>Member</h5>
                <FormListActionTools />
              </div>
              <div className="grid grid-cols-4 mb-4 gap-2">
                <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                    <TbUsersGroup size={24}/>
                  </div>
                  <div>
                    <h6 className="text-blue-500">12</h6>
                    <span className="font-semibold text-xs">Total</span>
                  </div>
                </Card>
                <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300" >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                    <TbUserCheck size={24}/>
                  </div>
                  <div>
                    <h6 className="text-green-500">12</h6>
                    <span className="font-semibold text-xs">Active</span>
                  </div>
                </Card>
                <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                    <TbUserCancel size={24}/>
                  </div>
                  <div>
                    <h6 className="text-red-500">12</h6>
                    <span className="font-semibold text-xs">Disabled</span>
                  </div>
                </Card>
                <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                    <TbUserExclamation size={24}/>
                  </div>
                  <div>
                    <h6 className="text-pink-500">12</h6>
                    <span className="font-semibold text-xs">Unregistered</span>
                  </div>
                </Card>
              </div>
              <FormListTable />
            </div>
          </AdaptiveCard>
        </Container>
        <FormListSelected />
      </>
    </MemberListProvider>
  );
};

export default Member;