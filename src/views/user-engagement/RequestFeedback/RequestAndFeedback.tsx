// src/views/your-path/RequestAndFeedbackListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebounceInput from "@/components/shared/DebouceInput"; // Assuming DebouceInput is the correct name
import RichTextEditor from "@/components/shared/RichTextEditor";
import Select from "@/components/ui/Select";
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Dialog,
  Dropdown,
  Card,
  Button,
  Tooltip,
  Notification,
  DatePicker,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbEye,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbUserCircle,
  TbMail,
  TbPhone,
  TbBuilding,
  TbMessageDots,
  TbClipboardText,
  TbStar,
  TbPaperclip,
  TbToggleRight,
  TbReload,
  TbUser,
  TbBrandWhatsapp,
  TbBell,
  TbTagStarred,
  TbCalendarEvent,
  TbAlarm,
  TbFileSearch,
  TbUserSearch,
  TbDownload,
  TbMessageReport,
  TbLink,
  TbAlertTriangle,
  TbFileText,
  TbFileZip,
  TbCalendar,
  TbUserQuestion,
  TbEyeClosed,
  TbBellMinus,
  TbPencilPin,
  TbFileTime,
  TbStars,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getRequestFeedbacksAction,
  addRequestFeedbackAction,
  editRequestFeedbackAction,
  deleteRequestFeedbackAction,
  deleteAllRequestFeedbacksAction,
  submitExportReasonAction, // Added for export reason
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define Types ---
export type SelectOption = { value: string; label: string };
export type RequestFeedbackApiStatus =
  | "Unread"
  | "Read"
  | "In Progress"
  | "Resolved"
  | "Closed"
  | string;
export type RequestFeedbackFormStatus =
  | "Unread"
  | "Read"
  | "In Progress"
  | "Resolved"
  | "Closed";
export type RequestFeedbackType =
  | "Feedback"
  | "Request"
  | "Complaint"
  | "Query"
  | string;

export type RequestFeedbackItem = {
  id: string | number;
  customer_id: string; // Assuming '0' or actual ID
  name: string;
  email: string;
  mobile_no: string;
  company_name?: string | null;
  feedback_details: string;
  attachment?: string | null; // Path to the file from API
  type: RequestFeedbackType;
  status: RequestFeedbackApiStatus;
  created_at: string;
  updated_at: string;
  subject?: string | null;
  rating?: number | string | null;
  deleted_at?: string | null;
  // icon_full_path?: File | string; // This field seems redundant if `attachment` holds the path.
                                  // If it serves a different purpose, it can be kept.
                                  // For now, focusing on `attachment` for file handling.
  health_score?: number; // Added for modal consistency
  updated_by_user?: { name: string, roles: [{ display_name: string }] }; // Added for consistency
};

// ============================================================================
// --- MODALS SECTION ---
// All modal components for Requests & Feedbacks are defined here.
// ============================================================================

export type RequestFeedbackModalType =
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

export interface RequestFeedbackModalState {
  isOpen: boolean;
  type: RequestFeedbackModalType | null;
  data: RequestFeedbackItem | null;
}
interface RequestFeedbackModalsProps {
  modalState: RequestFeedbackModalState;
  onClose: () => void;
}

const dummyUsers = [
  { value: "user1", label: "Support Team" },
  { value: "user2", label: "Product Manager" },
  { value: "user3", label: "Admin User" },
];
const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const eventTypeOptions = [
  { value: "meeting", label: "Review Meeting" },
  { value: "call", label: "Follow-up Call" },
  { value: "deadline", label: "Resolution Deadline" },
];
const dummyAlerts = [
  {
    id: 1,
    severity: "danger",
    message: "Complaint has been Unread for more than 48 hours.",
    time: "1 day ago",
  },
  {
    id: 2,
    severity: "warning",
    message: "Request is 'In Progress' for over 5 days.",
    time: "3 days ago",
  },
];
const dummyTimeline = [
  {
    id: 1,
    icon: <TbUser />,
    title: "Status changed to 'In Progress'",
    desc: "Assigned to the support team for investigation.",
    time: "2023-11-01",
  },
  {
    id: 2,
    icon: <TbMail />,
    title: "Acknowledgement Email Sent",
    desc: "Sent an automated email to the user.",
    time: "2023-10-31",
  },
  {
    id: 3,
    icon: <TbMessageDots />,
    title: "Feedback Submitted",
    desc: "Initial submission by the user.",
    time: "2023-10-31",
  },
];

const RequestFeedbackModals: React.FC<RequestFeedbackModalsProps> = ({
  modalState,
  onClose,
}) => {
  const { type, data: item, isOpen } = modalState;
  if (!isOpen || !item) return null;

  const renderModalContent = () => {
    switch (type) {
      case "email":
        return <SendEmailDialog item={item} onClose={onClose} />;
      case "whatsapp":
        return <SendWhatsAppDialog item={item} onClose={onClose} />;
      case "notification":
        return <AddNotificationDialog item={item} onClose={onClose} />;
      case "task":
        return <AssignTaskDialog item={item} onClose={onClose} />;
      case "calendar":
        return <AddScheduleDialog item={item} onClose={onClose} />;
      case "alert":
        return <ViewAlertDialog item={item} onClose={onClose} />;
      case "trackRecord":
        return <TrackRecordDialog item={item} onClose={onClose} />;
      case "engagement":
        return <ViewEngagementDialog item={item} onClose={onClose} />;
      case "document":
        return <DownloadDocumentDialog item={item} onClose={onClose} />;
      default:
        return (
          <GenericActionDialog type={type} item={item} onClose={onClose} />
        );
    }
  };
  return <>{renderModalContent()}</>;
};

const itemPathUtil = (filename: string | null | undefined): string => {
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000"; // Ensure a default
  return filename ? `${baseUrl}/storage/${filename}` : "#";
};

const SendEmailDialog: React.FC<{
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit: RHFHandleSubmit } = useForm({ // Renamed to avoid conflict
    defaultValues: {
      subject: `Re: Your ${item.type}: ${item.subject || `(ID: ${item.id})`}`,
      message: "",
    },
  });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true);
    console.log("Sending email to", item.email, "with data:", data);
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
      <h5 className="mb-4">Send Email to {item.name}</h5>
      <form onSubmit={RHFHandleSubmit(onSendEmail)}>
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
          <Button className="mr-2" onClick={onClose} type="button">
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
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const { control, handleSubmit: RHFHandleSubmit } = useForm({
    defaultValues: {
      message: `Hi ${item.name}, regarding your recent ${item.type} (ID: ${item.id})...`,
    },
  });
  const onSendMessage = (data: { message: string }) => {
    const phone = item.mobile_no?.replace(/\D/g, "");
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
      <h5 className="mb-4">Send WhatsApp to {item.name}</h5>
      <form onSubmit={RHFHandleSubmit(onSendMessage)}>
        <FormItem label="Message Template">
          <Controller
            name="message"
            control={control}
            render={({ field }) => <Input textArea {...field} rows={4} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose} type="button">
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
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit: RHFHandleSubmit } = useForm({
    defaultValues: {
      title: `Update on your ${item.type}`,
      users: [] as SelectOption[],
      message: "",
    },
  });
  const onSend = (data: any) => {
    setIsLoading(true);
    console.log("Sending in-app notification for", item.id, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Notification Sent" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for {item.name}</h5>
      <form onSubmit={RHFHandleSubmit(onSend)}>
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
          <Button className="mr-2" onClick={onClose} type="button">
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
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit: RHFHandleSubmit } = useForm({
    defaultValues: {
      title: `Follow up on ${item.type} from ${item.name}`,
      assignee: null as SelectOption | null,
      dueDate: null as Date | null,
      priority: null as SelectOption | null,
      description: item.feedback_details,
    },
  });
  const onAssignTask = (data: any) => {
    setIsLoading(true);
    console.log("Assigning task for item", item.id, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Task Assigned" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for Item #{item.id}</h5>
      <form onSubmit={RHFHandleSubmit(onAssignTask)}>
        <FormItem label="Task Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => <Input {...field} />}
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
          <Button className="mr-2" onClick={onClose} type="button">
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
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit: RHFHandleSubmit } = useForm({
    defaultValues: {
      title: `Review ${item.type} from ${item.name}`,
      eventType: null as SelectOption | null,
      startDate: null as Date | null,
      notes: "",
    },
  });
  const onAddEvent = (data: any) => {
    setIsLoading(true);
    console.log("Adding event for item", item.id, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Event Scheduled" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for Item #{item.id}</h5>
      <form onSubmit={RHFHandleSubmit(onAddEvent)}>
        <FormItem label="Event Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => <Input {...field} />}
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
          <Button className="mr-2" onClick={onClose} type="button">
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
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
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
      <h5 className="mb-4">Alerts for Item #{item.id}</h5>
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
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Track Record for Item #{item.id}</h5>
      <div className="mt-4 -ml-4">
        {dummyTimeline.map((timelineItem, index) => (
          <div key={timelineItem.id} className="flex gap-4 relative">
            {index < dummyTimeline.length - 1 && (
              <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-600"></div>
            )}
            <div className="flex-shrink-0 z-10 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 text-gray-500 flex items-center justify-center">
              {React.cloneElement(timelineItem.icon, { size: 24 })}
            </div>
            <div className="pb-8">
              <p className="font-semibold">{timelineItem.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {timelineItem.desc}
              </p>
              <p className="text-xs text-gray-400 mt-1">{timelineItem.time}</p>
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
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Engagement for Item #{item.id}</h5>
      <div className="grid grid-cols-2 gap-4 mt-4 text-center">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Last Updated</p>
          <p className="font-bold text-lg">
            {new Date(item.updated_at).toLocaleDateString()}
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Response Time</p>
          <p className="font-bold text-lg text-green-500">~2 Hrs</p> {/* Placeholder */}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Interactions</p>
          <p className="font-bold text-lg">4</p> {/* Placeholder */}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">User Rating</p>
          <p className="font-bold text-lg">{item.rating || "N/A"}</p>
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
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const getFileExtension = (filename: string | null | undefined) =>
    filename?.split(".").pop()?.toLowerCase() || "";

  const iconMap: Record<string, React.ReactElement> = {
    pdf: <TbFileText className="text-red-500" />,
    zip: <TbFileZip className="text-amber-500" />,
    png: <TbFileText className="text-blue-500" />, // Using TbFileText as placeholder
    jpg: <TbFileText className="text-blue-500" />,
    jpeg: <TbFileText className="text-blue-500" />,
    doc: <TbFileText className="text-sky-500" />,
    docx: <TbFileText className="text-sky-500" />,
  };
  const attachmentName = item.attachment?.split("/").pop() || "Attachment";

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Documents for Item #{item.id}</h5>
      <div className="flex flex-col gap-3 mt-4">
        {item.attachment ? (
          <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-3">
              {React.cloneElement(
                iconMap[getFileExtension(item.attachment)] || (
                  <TbClipboardText />
                ),
                { size: 28 }
              )}
              <div>
                <p className="font-semibold text-sm">
                  {attachmentName}
                </p>
              </div>
            </div>
            <a
              href={itemPathUtil(item.attachment)}
              target="_blank"
              rel="noopener noreferrer"
              download={attachmentName}
            >
              <Tooltip title="Download">
                <Button shape="circle" size="sm" icon={<TbDownload />} />
              </Tooltip>
            </a>
          </div>
        ) : (
          <p>No attachment available for this item.</p>
        )}
      </div>
      <div className="text-right mt-6">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Dialog>
  );
};

const GenericActionDialog: React.FC<{
  type: RequestFeedbackModalType | null;
  item: RequestFeedbackItem;
  onClose: () => void;
}> = ({ type, item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type
    ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}`
    : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true);
    console.log(`Performing action '${type}' for item ${item.id}`);
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
        Are you sure you want to perform this action for item #
        <span className="font-semibold">{item.id}</span> from{" "}
        <span className="font-semibold">{item.name}</span>?
      </p>
      <div className="text-right mt-6">
        <Button className="mr-2" onClick={onClose} type="button">
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

const TYPE_OPTIONS: SelectOption[] = [
  { value: "Feedback", label: "Feedback" },
  { value: "Request", label: "Request" },
  { value: "Complaint", label: "Complaint" },
  { value: "Query", label: "General Query" },
];
const typeValues = TYPE_OPTIONS.map((t) => t.value) as [string, ...string[]]; // For Zod enum
const STATUS_OPTIONS_FORM: {
  value: RequestFeedbackFormStatus;
  label: string;
}[] = [
  { value: "Unread", label: "Unread" },
  { value: "Read", label: "Read" },
  { value: "In Progress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
];
const statusFormValues = STATUS_OPTIONS_FORM.map((s) => s.value) as [ // For Zod enum
  RequestFeedbackFormStatus,
  ...RequestFeedbackFormStatus[]
];
const statusColors: Record<RequestFeedbackApiStatus, string> = {
  Unread:
    "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  Read: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
  "In Progress": "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-100", // Added In Progress
  Resolved: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-100",
  Closed:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};
const RATING_OPTIONS: SelectOption[] = [
  { value: "1", label: "1 Star (Poor)" },
  { value: "2", label: "2 Stars (Fair)" },
  { value: "3", label: "3 Stars (Average)" },
  { value: "4", label: "4 Stars (Good)" },
  { value: "5", label: "5 Stars (Excellent)" },
];
const ratingValues = RATING_OPTIONS.map((r) => r.value) as [ // For Zod enum
  string,
  ...string[]
];

const requestFeedbackFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  email: z
    .string()
    .email("Invalid email address.")
    .min(1, "Email is required."),
  mobile_no: z.string().min(1, "Mobile number is required.").max(20),
  company_name: z.string().max(150).optional().or(z.literal("")).nullable(),
  feedback_details: z
    .string()
    .min(10, "Details must be at least 10 characters.")
    .max(5000),
  type: z.enum(typeValues, { // Use derived typeValues
    errorMap: () => ({ message: "Please select a type." }),
  }),
  status: z.enum(statusFormValues, { // Use derived statusFormValues
    errorMap: () => ({ message: "Please select a status." }),
  }),
  subject: z.string().max(255).optional().or(z.literal("")).nullable(),
  rating: z.enum(ratingValues).optional().nullable(), // Use derived ratingValues
  attachment: z.any().optional(), // For file input
});
type RequestFeedbackFormData = z.infer<typeof requestFeedbackFormSchema>;

const filterFormSchema = z.object({
  filterType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterRating: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const CSV_HEADERS_RF = [
  "ID", "Name", "Email", "Mobile No", "Company", "Type", "Subject",
  "Details", "Rating", "Status", "Attachment", "Date",
];
const CSV_KEYS_RF: (keyof Pick<RequestFeedbackItem, 'id' | 'name' | 'email' | 'mobile_no' | 'company_name' | 'type' | 'subject' | 'feedback_details' | 'rating' | 'status' | 'attachment' | 'created_at'>)[] = [
  "id", "name", "email", "mobile_no", "company_name", "type", "subject",
  "feedback_details", "rating", "status", "attachment", "created_at",
];
function exportRequestFeedbacksToCsv(
  filename: string,
  rows: RequestFeedbackItem[]
) {
  if (!rows || !rows.length) {
    toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
    return false;
  }
  const preparedRows = rows.map((row) => ({
    ...row,
    type: TYPE_OPTIONS.find((t) => t.value === row.type)?.label || row.type,
    status: STATUS_OPTIONS_FORM.find((s) => s.value === row.status)?.label || row.status,
    rating: RATING_OPTIONS.find((r) => r.value === String(row.rating || ""))?.label || (row.rating ? String(row.rating) : "N/A"),
    created_at: new Date(row.created_at).toLocaleDateString(),
    attachment: row.attachment ? row.attachment.split("/").pop() : "N/A", // Only filename for CSV
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_RF.join(separator) + "\n" +
    preparedRows.map((row: any) =>
        CSV_KEYS_RF.map((k) => {
          let cell: any = row[k];
          if (cell === null || cell === undefined) cell = "";
          else cell = String(cell).replace(/"/g, '""');
          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator)
      ).join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
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
    return true;
  }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

const ItemActionColumn = ({
  rowData,
  onEdit,
  onViewDetail,
  onDelete,
  onOpenModal,
}: {
  rowData: RequestFeedbackItem;
  onEdit: () => void;
  onViewDetail: () => void;
  onDelete: () => void;
  onOpenModal: (type: RequestFeedbackModalType, data: RequestFeedbackItem) => void;
}) => (
  <div className="flex items-center justify-center gap-1">
    <Tooltip title="Edit">
      <div className="text-xl p-1 cursor-pointer text-gray-500 hover:text-emerald-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" role="button" onClick={onEdit}><TbPencil /></div>
    </Tooltip>
    <Tooltip title="View">
      <div className="text-xl p-1 cursor-pointer text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" role="button" onClick={onViewDetail}><TbEye /></div>
    </Tooltip>
    <Dropdown renderTitle={<BsThreeDotsVertical className="text-xl p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
      <Dropdown.Item onClick={() => onOpenModal("email", rowData)} className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("whatsapp", rowData)} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send on Whatsapp</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add as Notification</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("task", rowData)} className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign to Task</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("active", rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Add to Active</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("calendar", rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Add to Calendar</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("alert", rowData)} className="flex items-center gap-2"><TbAlarm size={18} /> <span className="text-xs">View Alert</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("trackRecord", rowData)} className="flex items-center gap-2"><TbFileSearch size={18} /> <span className="text-xs">Track Record</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("engagement", rowData)} className="flex items-center gap-2"><TbUserSearch size={18} /> <span className="text-xs">Engagement</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("document", rowData)} className="flex items-center gap-2"><TbDownload size={18} /> <span className="text-xs">Download Document</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("feedback", rowData)} className="flex items-center gap-2"><TbMessageReport size={18} /> <span className="text-xs">View Request & Feedback</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("wallLink", rowData)} className="flex items-center gap-2"><TbLink size={18} /> <span className="text-xs">Add Wall Link</span></Dropdown.Item>
      
    </Dropdown>
  </div>
);
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> )
);
ItemSearch.displayName = "ItemSearch";

type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Tooltip title="Clear Filters"><Button icon={<TbReload />} onClick={onClearFilters}></Button></Tooltip>
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

type RequestFeedbacksTableProps = {
  columns: ColumnDef<RequestFeedbackItem>[]; data: RequestFeedbackItem[]; loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: RequestFeedbackItem[]; onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: RequestFeedbackItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<RequestFeedbackItem>[]) => void;
};
const RequestFeedbacksTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: RequestFeedbacksTableProps) => (
  <DataTable
    selectable
    columns={columns} data={data} noData={!loading && data.length === 0}
    loading={loading} pagingData={pagingData}
    checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)}
    onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
    onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect}
  />
);

type RequestFeedbacksSelectedFooterProps = { selectedItems: RequestFeedbackItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const RequestFeedbacksSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: RequestFeedbacksSelectedFooterProps) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
            <span className="font-semibold">{selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""} selected</span>
          </span>
          <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Item(s)`}
        onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }}
        loading={isDeleting}
      >
        <p>Are you sure you want to delete the selected item(s)? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};


const RequestAndFeedbackListing = () => {
  const dispatch = useAppDispatch();
  const { requestFeedbacksData = { data: [], counts: {} }, status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RequestFeedbackItem | null>(null);
  const [viewingItem, setViewingItem] = useState<RequestFeedbackItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RequestFeedbackItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<RequestFeedbackItem[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);

  const [modalState, setModalState] = useState<RequestFeedbackModalState>({ isOpen: false, type: null, data: null });
  // State for export reason modal
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  const handleOpenModal = (type: RequestFeedbackModalType, itemData: RequestFeedbackItem) => setModalState({ isOpen: true, type, data: itemData });
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

  useEffect(() => {
    dispatch(getRequestFeedbacksAction());
  }, [dispatch]);

  const formMethods = useForm<RequestFeedbackFormData>({ resolver: zodResolver(requestFeedbackFormSchema), mode: "onChange" });
  const { control, handleSubmit, reset, formState: { errors, isValid } } = formMethods;

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

  const defaultFormValues: RequestFeedbackFormData = useMemo(() => ({
    name: "", email: "", mobile_no: "", company_name: "", feedback_details: "",
    type: TYPE_OPTIONS[0]?.value as RequestFeedbackType, // Ensure type cast if needed
    status: STATUS_OPTIONS_FORM[0]?.value, subject: "", rating: null, attachment: undefined,
  }), []);

  const openAddDrawer = useCallback(() => {
    reset(defaultFormValues);
    setSelectedFile(null);
    setRemoveExistingAttachment(false);
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [reset, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback((item: RequestFeedbackItem) => {
    setEditingItem(item);
    setSelectedFile(null);
    setRemoveExistingAttachment(false);
    reset({
      name: item.name, email: item.email, mobile_no: item.mobile_no,
      company_name: item.company_name || "", feedback_details: item.feedback_details,
      type: item.type, status: item.status as RequestFeedbackFormStatus,
      subject: item.subject || "", rating: item.rating ? String(item.rating) : null,
      attachment: undefined, // File input is not pre-filled for security
    });
    setIsEditDrawerOpen(true);
  }, [reset]);
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);
  const openViewDialog = useCallback((item: RequestFeedbackItem) => setViewingItem(item), []);
  const closeViewDialog = useCallback(() => setViewingItem(null), []);

  const onSubmitHandler = async (data: RequestFeedbackFormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        const value = data[key as keyof RequestFeedbackFormData];
        if (key === 'attachment') return; // Skip attachment here, handle separately
        if (value !== null && value !== undefined && value !== '') {
            formData.append(key, String(value));
        }
    });

    if (editingItem) {
      formData.append("_method", "PUT");
      formData.append("customer_id", String(editingItem.customer_id)); // Use existing customer_id
      if (selectedFile instanceof File) {
        formData.append("attachment", selectedFile);
      } else if (removeExistingAttachment && editingItem.attachment) { // Ensure there was an attachment to remove
        formData.append("delete_attachment", "true");
      }
    } else {
      formData.append("customer_id", "0"); // Default for new, or get from context if available
      if (selectedFile instanceof File) {
        formData.append("attachment", selectedFile);
      }
    }
  
    try {
      if (editingItem) {
        await dispatch(editRequestFeedbackAction({ id: editingItem.id, formData })).unwrap();
        toast.push(<Notification title="Entry Updated" type="success" />);
        closeEditDrawer();
      } else {
        await dispatch(addRequestFeedbackAction(formData)).unwrap();
        toast.push(<Notification title="Entry Added" type="success" />);
        closeAddDrawer();
      }
      dispatch(getRequestFeedbacksAction());
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || (editingItem ? "Update Failed" : "Add Failed");
      toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{errorMessage}</Notification>);
    } finally {
      setIsSubmitting(false);
      setRemoveExistingAttachment(false); // Reset this flag
      setSelectedFile(null); // Reset selected file
    }
  };

  const handleDeleteClick = useCallback((item: RequestFeedbackItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true); setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteRequestFeedbackAction({ id: itemToDelete.id })).unwrap();
      toast.push(<Notification title="Entry Deleted" type="success">{`Entry from "${itemToDelete.name}" deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getRequestFeedbacksAction());
    } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>); }
    finally { setIsDeleting(false); setItemToDelete(null); }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
    try {
      await dispatch(deleteAllRequestFeedbacksAction({ ids: idsToDelete.join(",") })).unwrap();
      toast.push(<Notification title="Deletion Successful" type="success">{`${idsToDelete.length} item(s) deleted.`}</Notification>);
      setSelectedItems([]); dispatch(getRequestFeedbacksAction());
    } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{(e as Error).message}</Notification>); }
    finally { setIsDeleting(false); }
  }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer]);
  const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); }, [filterFormMethods]);

  
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: RequestFeedbackItem[] = cloneDeep(Array.isArray(requestFeedbacksData?.data) ? requestFeedbacksData?.data : []);
    if (filterCriteria.filterType?.length) { const v = filterCriteria.filterType.map((o) => o.value); processedData = processedData.filter((item) => v.includes(item.type)); }
    if (filterCriteria.filterStatus?.length) { const v = filterCriteria.filterStatus.map((o) => o.value); processedData = processedData.filter((item) => v.includes(item.status)); }
    if (filterCriteria.filterRating?.length) { const v = filterCriteria.filterRating.map((o) => o.value); processedData = processedData.filter((item) => v.includes(String(item.rating || ""))); }
    if (tableData.query) {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(item =>
        String(item.id).toLowerCase().includes(q) || item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) || item.mobile_no.toLowerCase().includes(q) ||
        (item.company_name && item.company_name.toLowerCase().includes(q)) ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        item.feedback_details.toLowerCase().includes(q)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && typeof key === 'string') {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof RequestFeedbackItem]; const bVal = b[key as keyof RequestFeedbackItem];
        if (key === "created_at" || key === "updated_at") { return order === "asc" ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime(); }
        const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [requestFeedbacksData?.data, tableData, filterCriteria]);

  const handleOpenExportReasonModal = useCallback(() => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  }, [allFilteredAndSortedData, exportReasonFormMethods]);

  const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Request & Feedback";
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `request_feedbacks_export_${timestamp}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      exportRequestFeedbacksToCsv(fileName, allFilteredAndSortedData);
      toast.push(<Notification title="Data Exported" type="success">Request & Feedback data exported.</Notification>);
      setIsExportReasonModalOpen(false);
    } catch (error: any) { toast.push(<Notification title="Operation Failed" type="danger" message={(error as Error).message || "Could not complete export."} />); }
    finally { setIsSubmittingExportReason(false); }
  }, [dispatch, allFilteredAndSortedData, exportReasonFormMethods]);

  const handlePaginationChange = useCallback((page: number) => setTableData((prev) => ({ ...prev, pageIndex: page })), []);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData((prev) => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleSearchInputChange = useCallback((query: string) => { setTableData((prev) => ({ ...prev, query: query, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: RequestFeedbackItem) => { setSelectedItems((prev) => checked ? (prev.some(item => item.id === row.id) ? prev : [...prev, row]) : prev.filter(item => item.id !== row.id)); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<RequestFeedbackItem>[]) => {
    const cPOR = currentRows.map(r => r.original);
    if (checked) { setSelectedItems(pS => { const pSIds = new Set(pS.map(i => i.id)); const nRTA = cPOR.filter(r => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); }
    else { const cPRIds = new Set(cPOR.map(r => r.id)); setSelectedItems(pS => pS.filter(i => !cPRIds.has(i.id))); }
  }, []);
  
  const columns: ColumnDef<RequestFeedbackItem>[] = useMemo(() => [
    { header: "User Info", accessorKey: "name", size: 180, cell: props => (
        <div className="flex items-center gap-2">
            <Avatar size="sm" shape="circle" className="mr-1">{props.getValue<string>()?.[0]?.toUpperCase()}</Avatar>
            <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-semibold text-sm">{props.getValue<string>() || "N/A"}</span>
                <span className="text-gray-600 dark:text-gray-400">{props.row.original.email || "N/A"}</span>
                <span className="text-gray-600 dark:text-gray-400">{props.row.original.mobile_no || "N/A"}</span>
            </div>
        </div>
    )},
    { header: "Type", accessorKey: "type", size: 100, cell: props => <Tag className="capitalize">{TYPE_OPTIONS.find(t => t.value === props.getValue())?.label || props.getValue() || "N/A"}</Tag> },
    { header: "Subject", accessorKey: "subject", size: 200, cell: props => <div className="truncate w-48" title={props.getValue() as string}>{(props.getValue() as string) || "N/A"}</div> },
    { header: "Status", accessorKey: "status", size: 110, cell: props => { const s = props.getValue<RequestFeedbackApiStatus>(); return <Tag className={classNames("capitalize whitespace-nowrap min-w-[90px] text-center", statusColors[s] || statusColors.default)}>{STATUS_OPTIONS_FORM.find(opt => opt.value === s)?.label || s || "N/A"}</Tag>; }},
    { header: "Rating", accessorKey: "rating", size: 90, cell: props => props.getValue() ? <span className="flex items-center gap-1"><TbStar className="text-amber-500" />{`${props.getValue()}`}</span> : "N/A" },
    {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,

        size: 120,
        cell: (props) => { const { updated_at, updated_by_user } =
            props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", { month: "long" })} ${new Date(
                updated_at
              ).getFullYear()}, ${new Date(updated_at).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}`
            : "N/A";
          return (
            <div className="text-xs">
              <span>
                {updated_by_user?.name || "N/A"}
                {updated_by_user?.roles?.[0]?.display_name && (
                  <>
                    <br />
                    <b>{updated_by_user?.roles[0]?.display_name}</b>
                  </>
                )}
              </span>
              <br />
              <span>{formattedDate}</span>
            </div>
          );
        },
      },
    { header: "Actions", id: "actions", meta: { headerClass: "text-center", cellClass: "text-center" }, size: 100, cell: props => <ItemActionColumn rowData={props.row.original} onEdit={() => openEditDrawer(props.row.original)} onViewDetail={() => openViewDialog(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onOpenModal={handleOpenModal} /> },
  ], [openEditDrawer, openViewDialog, handleDeleteClick, handleOpenModal]);

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem label={<div>Name<span className="text-red-500"> *</span></div>} invalid={!!errors.name} errorMessage={errors.name?.message}>
        <Controller name="name" control={control} render={({ field }) => <Input {...field} prefix={<TbUserCircle />} placeholder="Full Name" />} />
      </FormItem>
      <FormItem label={<div>Email<span className="text-red-500"> *</span></div>} invalid={!!errors.email} errorMessage={errors.email?.message}>
        <Controller name="email" control={control} render={({ field }) => <Input {...field} type="email" prefix={<TbMail />} placeholder="example@domain.com" />} />
      </FormItem>
      <FormItem label={<div>Mobile No.<span className="text-red-500"> *</span></div>} invalid={!!errors.mobile_no} errorMessage={errors.mobile_no?.message}>
        <Controller name="mobile_no" control={control} render={({ field }) => <Input {...field} type="tel" prefix={<TbPhone />} placeholder="+XX XXXXXXXXXX" />} />
      </FormItem>
      <FormItem label="Company Name" invalid={!!errors.company_name} errorMessage={errors.company_name?.message}>
        <Controller name="company_name" control={control} render={({ field }) => <Input {...field} prefix={<TbBuilding />} placeholder="Your Company" />} />
      </FormItem>
      <FormItem label={<div>Type<span className="text-red-500"> *</span></div>} invalid={!!errors.type} errorMessage={errors.type?.message}>
        <Controller name="type" control={control} render={({ field }) => (
          <Select placeholder="Select Type" options={TYPE_OPTIONS} value={TYPE_OPTIONS.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} prefix={<TbMessageDots />} />
        )} />
      </FormItem>
      <FormItem label={<div>Status<span className="text-red-500"> *</span></div>} invalid={!!errors.status} errorMessage={errors.status?.message}>
        <Controller name="status" control={control} render={({ field }) => (
          <Select placeholder="Select Status" options={STATUS_OPTIONS_FORM} value={STATUS_OPTIONS_FORM.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} prefix={<TbToggleRight />} />
        )} />
      </FormItem>
      <FormItem label="Subject" className="md:col-span-2" invalid={!!errors.subject} errorMessage={errors.subject?.message}>
        <Controller name="subject" control={control} render={({ field }) => <Input {...field} prefix={<TbClipboardText />} placeholder="Brief subject of your message" />} />
      </FormItem>
      <FormItem label="Rating" className="md:col-span-2" invalid={!!errors.rating} errorMessage={errors.rating?.message}>
        <Controller name="rating" control={control} render={({ field }) => (
          <Select placeholder="Select Rating (Optional)" options={RATING_OPTIONS} value={RATING_OPTIONS.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable prefix={<TbStar />} />
        )} />
      </FormItem>
      <FormItem label={<div>Feedback / Request Details<span className="text-red-500"> *</span></div>} className="md:col-span-2" invalid={!!errors.feedback_details} errorMessage={errors.feedback_details?.message}>
        <Controller name="feedback_details" control={control} render={({ field }) => <Input textArea {...field} rows={5} placeholder="Describe your feedback or request in detail..." />} />
      </FormItem>
      <FormItem label="Attachment (Optional)" className="md:col-span-2" invalid={!!errors.attachment} errorMessage={errors.attachment?.message as string}>
        <Controller name="attachment" control={control}
          render={({ field: { onChange, onBlur, name, ref }}) => (
            <Input type="file" name={name} ref={ref} onBlur={onBlur}
              onChange={e => {
                const file = e.target.files?.[0];
                onChange(file); // RHF internal state for file object
                setSelectedFile(file || null);
                if (file) setRemoveExistingAttachment(false); // If new file selected, don't remove existing yet (backend will replace)
              }}
              prefix={<TbPaperclip />}
            />
          )}
        />
        {editingItem?.attachment && !selectedFile && (
          <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
            <span className="truncate max-w-[calc(100%-100px)]">
              Current: <a href={itemPathUtil(editingItem.attachment)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={editingItem.attachment.split('/').pop()}>{editingItem.attachment.split('/').pop()}</a>
            </span>
            {!removeExistingAttachment && (
              <Button size="xs" variant="plain" className="text-red-500 hover:text-red-700 whitespace-nowrap"
                onClick={() => {
                  setRemoveExistingAttachment(true);
                  // formMethods.setValue("attachment", undefined); // RHF state for file input is cleared by selecting new or by form reset
                  // No need to clear selectedFile here as it's for new uploads
                }}
              >Remove</Button>
            )}
            {removeExistingAttachment && <span className="text-red-500 text-xs whitespace-nowrap">Marked for removal</span>}
          </div>
        )}
         {selectedFile && (
            <div className="mt-1 text-xs text-gray-500">New file selected: {selectedFile.name}</div>
        )}
      </FormItem>
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Requests & Feedbacks</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200 dark:border-blue-700/60"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-200"><TbUserQuestion size={24} /></div><div><h6 className="text-blue-500 dark:text-blue-200">{requestFeedbacksData?.counts?.total|| 0}</h6><span className="font-semibold text-xs">Total</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300 dark:border-green-700/60"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-200"><TbEyeClosed size={24} /></div><div><h6 className="text-green-500 dark:text-green-200">{requestFeedbacksData?.counts?.unread || 0}</h6><span className="font-semibold text-xs">Unread</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200 dark:border-pink-700/60"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 dark:bg-pink-500/20 text-pink-500 dark:text-pink-200"><TbBellMinus size={24} /></div><div><h6 className="text-pink-500 dark:text-pink-200">{requestFeedbacksData?.counts?.resolved|| 0}</h6><span className="font-semibold text-xs">Resolved</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200 dark:border-red-700/60"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-200"><TbPencilPin size={24} /></div><div><h6 className="text-red-500 dark:text-red-200">{requestFeedbacksData?.counts?.pending|| 0}</h6><span className="font-semibold text-xs">Pending</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-300 dark:border-violet-700/60"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 text-violet-500 dark:text-violet-200"><TbFileTime size={24} /></div><div><h6 className="text-violet-500 dark:text-violet-200">{requestFeedbacksData?.counts?.avg_time|| 0 }</h6><span className="font-semibold text-xs">Avg Time</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200 dark:border-orange-700/60"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 dark:bg-orange-500/20 text-orange-500 dark:text-orange-200"><TbStars size={24} /></div><div><h6 className="text-orange-500 dark:text-orange-200">{requestFeedbacksData?.counts?.avg_rating|| 0}</h6><span className="font-semibold text-xs">Avg Rating </span></div></Card>
          </div>
          <ItemTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchInputChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} />
          <div className="mt-4"><RequestFeedbacksTable columns={columns} data={pageData} loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /></div>
        </AdaptiveCard>
      </Container>
      <RequestFeedbacksSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <Drawer title={editingItem ? "Edit Entry" : "Add New Entry"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={520}
        footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button><Button size="sm" variant="solid" form="requestFeedbackForm" type="submit" loading={isSubmitting} disabled={!isValid || isSubmitting}>{isSubmitting ? (editingItem ? "Saving..." : "Adding...") : (editingItem ? "Save Changes" : "Submit Entry")}</Button></div>}
      ><Form id="requestFeedbackForm" onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-4 pb-28"> {/* Increased pb for footer space */}
        {renderDrawerForm(formMethods)}
         {editingItem && (
             <div className=""> {/* Ensure full width and padding consistency */}
                <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                    <div>
                        <b className="mt-3 mb-3 font-semibold text-primary-600 dark:text-primary-400">Latest Update:</b><br />
                        <p className="text-sm font-semibold">{editingItem.updated_by_user?.name || "N/A"}</p>
                        <p>{editingItem.updated_by_user?.roles?.[0]?.display_name || "N/A"}</p>
                    </div>
                    <div>
                        <br />
                        <span className="font-semibold">Created At:</span>{" "}
                        <span>{editingItem.created_at ? new Date(editingItem.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}</span>
                        <br />
                        <span className="font-semibold">Updated At:</span>{" "}
                        <span>{editingItem.updated_at ? new Date(editingItem.updated_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}</span>
                    </div>
                </div>
            </div>
          )}
        </Form></Drawer>
      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={600}>
        <div className="p-1">
          <h5 className="mb-6 border-b pb-4 dark:border-gray-600">Details: {viewingItem?.subject || `Entry by ${viewingItem?.name}`}</h5>
          {viewingItem && (<div className="space-y-3 text-sm">
            <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">ID:</span><span className="w-2/3">{viewingItem.id}</span></div>
            <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Customer ID:</span><span className="w-2/3">{viewingItem.customer_id === "0" ? "N/A (Guest)" : viewingItem.customer_id}</span></div>
            <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Name:</span><span className="w-2/3">{viewingItem.name}</span></div>
            <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Email:</span><span className="w-2/3">{viewingItem.email}</span></div>
            <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Mobile No:</span><span className="w-2/3">{viewingItem.mobile_no || "N/A"}</span></div>
            <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Company:</span><span className="w-2/3">{viewingItem.company_name || "N/A"}</span></div>
            <div className="flex items-center"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Type:</span><Tag className="capitalize">{TYPE_OPTIONS.find(t => t.value === viewingItem.type)?.label || viewingItem.type}</Tag></div>
            <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Subject:</span><span className="w-2/3">{viewingItem.subject || "N/A"}</span></div>
            <div className="flex items-center"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Status:</span><Tag className={classNames("capitalize", statusColors[viewingItem.status] || statusColors.default)}>{STATUS_OPTIONS_FORM.find(s => s.value === viewingItem.status)?.label || viewingItem.status}</Tag></div>
            <div className="flex items-center"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Rating:</span><span className="w-2/3 flex items-center gap-1">{viewingItem.rating ? <><TbStar className="text-amber-500" /> {RATING_OPTIONS.find(r => r.value === String(viewingItem.rating))?.label || `${viewingItem.rating} Stars`}</> : "N/A"}</span></div>
            {viewingItem.attachment && <div className="flex items-start"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200 pt-1">Attachment:</span><span className="w-2/3"><a href={itemPathUtil(viewingItem.attachment)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{viewingItem.attachment.split("/").pop()}</a></span></div>}
            <div className="flex flex-col"><span className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Details:</span><p className="w-full bg-gray-50 dark:bg-gray-700/60 p-3 rounded whitespace-pre-wrap break-words">{viewingItem.feedback_details}</p></div>
            <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Reported On:</span><span className="w-2/3">{new Date(viewingItem.created_at).toLocaleString()}</span></div>
            <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Last Updated:</span><span className="w-2/3">{new Date(viewingItem.updated_at).toLocaleString()}</span></div>
          </div>)}
          <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div>
        </div>
      </Dialog>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400}
        footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterReqFeedbackForm" type="submit">Apply</Button></div>}
      ><Form id="filterReqFeedbackForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
        <FormItem label="Type"><Controller name="filterType" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Any Type" options={TYPE_OPTIONS} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
        <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Any Status" options={STATUS_OPTIONS_FORM} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
        <FormItem label="Rating"><Controller name="filterRating" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Any Rating" options={RATING_OPTIONS} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
      </Form></Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Entry" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}>
        <p>Are you sure you want to delete the entry from "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p>
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
        cancelText="Cancel"
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}
      >
        <Form
          id="exportRequestFeedbackReasonForm"
          onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
          >
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>
      <RequestFeedbackModals modalState={modalState} onClose={handleCloseModal} />
    </>
  );
};

export default RequestAndFeedbackListing;