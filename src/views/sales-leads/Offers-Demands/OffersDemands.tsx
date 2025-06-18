// src/views/your-path/OffersDemands.tsx

import React, {
  useState,
  useMemo,
  useCallback,
  Ref,
  useEffect,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from 'dayjs';

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
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
  Form,
  FormItem,
  Input,
  Select,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Spinner from "@/components/ui/Spinner";

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
  TbCancel,
  TbChecks,
  TbCircleCheck,
  TbCircleLetterX,
  TbCircleX,
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
  TbLink,
  TbMail,
  TbMessageCircle,
  TbMessageReport,
  TbPencil,
  TbPlus,
  TbReceipt,
  TbRefresh,
  TbSearch,
  TbShare,
  TbTagStarred,
  TbTrash,
  TbUpload,
  TbUser,
  TbUserCircle,
  TbUserSearch,
  TbUsersGroup,
} from "react-icons/tb";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
  getOffersAction,
  getDemandsAction,
  submitExportReasonAction,
  deleteOfferAction,
  deleteAllOffersAction,
  deleteDemandAction,
  deleteAllDemandsAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Form Schemas ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const filterFormSchema = z.object({
  createdDateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
  updatedDateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
  itemType: z.enum(["Offer", "Demand"]).nullable().optional(),
  creatorIds: z.array(z.string()).optional().default([]),
  assigneeIds: z.array(z.string()).optional().default([]),
});
type FilterFormData = z.infer<typeof filterFormSchema>;


// --- API Item Types (Actual shapes from API response.data.data) ---
export type ActualApiCreatorShape = {
  id: number;
  name: string;
};

export type ActualApiOfferShape = {
  id: number;
  generate_id: string;
  name: string;
  created_by: ActualApiCreatorShape;
  assign_user?: ActualApiCreatorShape | null;
  created_at: string;
  updated_at?: string;
  seller_section?: any | null;
  buyer_section?: any | null;
  groupA?: string | null;
  groupB?: string | null;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  updated_by_name?: string;
  updated_by_role?: string;
};

export type ActualApiDemandShape = {
  id: number;
  generate_id: string;
  name: string;
  created_by: ActualApiCreatorShape;
  assign_user?: ActualApiCreatorShape | null;
  created_at: string;
  updated_at?: string;
  seller_section?: Record<
    string,
    { questions: Record<string, { question: string }> }
  > | null;
  buyer_section?: Record<
    string,
    { questions: Record<string, { question: string }> }
  > | null;
  groupA?: string | null;
  groupB?: string | null;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  updated_by_name?: string;
  updated_by_role?: string;
};

export type ApiGroupItem = {
  groupName: string;
  items: string[];
};

// --- Unified Table Row Data (OfferDemandItem) ---
export type OfferDemandItem = {
  id: string;
  type: "Offer" | "Demand";
  name: string;
  createdByInfo: {
    userId: string;
    userName: string;
    email: string;
  };
  assignedToInfo?: {
    userId: string;
    userName: string;
  };
  createdDate: Date;
  updated_at?: Date;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  groups?: ApiGroupItem[];
  updated_by_name?: string;
  updated_by_role?: string;
  originalApiItem: ActualApiOfferShape | ActualApiDemandShape;
  health_score?: number;
};

// --- Constants ---
const TABS = { ALL: "all", OFFER: "offer", DEMAND: "demand" };

// ============================================================================
// --- MODALS SECTION ---
// ============================================================================
export type OfferDemandModalType =
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

export interface OfferDemandModalState {
  isOpen: boolean;
  type: OfferDemandModalType | null;
  data: OfferDemandItem | null;
}
interface OfferDemandModalsProps {
  modalState: OfferDemandModalState;
  onClose: () => void;
}

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
    message: "Offer #OD123 has low engagement. Needs follow-up.",
    time: "2 days ago",
  },
  {
    id: 2,
    severity: "warning",
    message: "Demand #DD456 is approaching its expiration date.",
    time: "5 days ago",
  },
];
const dummyTimeline = [
  {
    id: 1,
    icon: <TbMail />,
    title: "Initial Offer Created",
    desc: "Offer was created and sent to potential buyers.",
    time: "2023-11-01",
  },
  {
    id: 2,
    icon: <TbCalendar />,
    title: "Follow-up Call Scheduled",
    desc: "Scheduled a call with the creator to discuss progress.",
    time: "2023-10-28",
  },
  {
    id: 3,
    icon: <TbUser />,
    title: "Item Assigned",
    desc: "Assigned to internal team for review.",
    time: "2023-10-27",
  },
];
const dummyDocs = [
  {
    id: "doc1",
    name: "Offer_Details.pdf",
    type: "pdf",
    size: "1.2 MB",
  },
  {
    id: "doc2",
    name: "Related_Images.zip",
    type: "zip",
    size: "8.5 MB",
  },
];

const OfferDemandModals: React.FC<OfferDemandModalsProps> = ({
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

const SendEmailDialog: React.FC<{
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { subject: "", message: "" },
  });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true);
    console.log("Sending email to", item.createdByInfo.email, "with data:", data);
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
      <h5 className="mb-4">Send Email regarding {item.name}</h5>
      <p className="mb-4 text-sm">
        Recipient: {item.createdByInfo.userName} ({item.createdByInfo.email})
      </p>
      <form onSubmit={handleSubmit(onSendEmail)}>
        <FormItem label="Subject">
          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder={`Regarding your ${item.type}: ${item.name}`} />
            )}
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
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      message: `Hi ${item.createdByInfo.userName}, regarding your ${item.type} "${item.name}"...`,
    },
  });
  const onSendMessage = (data: { message: string }) => {
    const phone = "1234567890";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      data.message
    )}`;
    window.open(url, "_blank");
    toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
    onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send WhatsApp about {item.name}</h5>
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
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { title: "", users: [], message: "" },
  });
  const onSend = (data: any) => {
    setIsLoading(true);
    console.log("Sending in-app notification for", item.name, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Notification Sent" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for {item.name}</h5>
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
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      title: `Follow up on ${item.type}: ${item.name}`,
      assignee: null,
      dueDate: null,
      priority: null,
      description: "",
    },
  });
  const onAssignTask = (data: any) => {
    setIsLoading(true);
    console.log("Assigning task for", item.name, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Task Assigned" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for {item.name}</h5>
      <form onSubmit={handleSubmit(onAssignTask)}>
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
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
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
    console.log("Adding event for", item.name, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Event Scheduled" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for {item.name}</h5>
      <form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder={`e.g., Review ${item.type}`} />
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
  item: OfferDemandItem;
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
      <h5 className="mb-4">Alerts for {item.name}</h5>
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
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Track Record for {item.name}</h5>
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
              <p className="text-xs text-gray-400 mt-1">
                {timelineItem.time}
              </p>
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
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Engagement for {item.name}</h5>
      <div className="grid grid-cols-2 gap-4 mt-4 text-center">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Last Updated</p>
          <p className="font-bold text-lg">2 days ago</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Health Score</p>
          <p className="font-bold text-lg text-green-500">
            {item.health_score || 85}%
          </p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Views (30d)</p>
          <p className="font-bold text-lg">125</p>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500">Interactions</p>
          <p className="font-bold text-lg">18</p>
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
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const iconMap: Record<string, React.ReactElement> = {
    pdf: <TbFileText className="text-red-500" />,
    zip: <TbFileZip className="text-amber-500" />,
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Documents for {item.name}</h5>
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
  type: OfferDemandModalType | null;
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ type, item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type
    ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}`
    : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true);
    console.log(`Performing action '${type}' for item ${item.name}`);
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
        <span className="font-semibold">{item.name}</span>?
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

// --- CSV Export Helpers ---
type OfferDemandExportItem = Omit<
  OfferDemandItem,
  | "createdDate"
  | "updated_at"
  | "createdByInfo"
  | "assignedToInfo"
  | "originalApiItem"
  | "groups"
> & {
  created_by_name: string;
  assigned_to_name: string;
  created_date_formatted: string;
  updated_date_formatted: string;
};
const CSV_HEADERS_OFFERS_DEMANDS = [
  "ID",
  "Type",
  "Name",
  "Number of Buyers",
  "Number of Sellers",
  "Created By",
  "Assigned To",
  "Created Date",
  "Last Updated",
  "Updated By",
  "Updated Role",
];
const CSV_KEYS_OFFERS_DEMANDS_EXPORT: (keyof OfferDemandExportItem)[] = [
  "id",
  "type",
  "name",
  "numberOfBuyers",
  "numberOfSellers",
  "created_by_name",
  "assigned_to_name",
  "created_date_formatted",
  "updated_date_formatted",
  "updated_by_name",
  "updated_by_role",
];

function exportToCsvOffersDemands(filename: string, rows: OfferDemandItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: OfferDemandExportItem[] = rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    numberOfBuyers: row.numberOfBuyers,
    numberOfSellers: row.numberOfSellers,
    created_by_name: row.createdByInfo.userName,
    assigned_to_name: row.assignedToInfo?.userName || "N/A",
    created_date_formatted: row.createdDate.toLocaleString(),
    updated_date_formatted: row.updated_at
      ? row.updated_at.toLocaleString()
      : "N/A",
    updated_by_name: row.updated_by_name,
    updated_by_role: row.updated_by_role,
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_OFFERS_DEMANDS.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
          return CSV_KEYS_OFFERS_DEMANDS_EXPORT.map((k) => {
            let cell = row?.[k as keyof OfferDemandExportItem];

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
        }).join("\n");


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
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

const transformApiOffer = (apiOffer: ActualApiOfferShape): OfferDemandItem => {
  const offerGroups: ApiGroupItem[] = [];
  if (apiOffer.groupA)
    offerGroups.push({ groupName: "Group A", items: [apiOffer.groupA] });
  if (apiOffer.groupB)
    offerGroups.push({ groupName: "Group B", items: [apiOffer.groupB] });

  return {
    id: apiOffer.generate_id,
    type: "Offer",
    name: apiOffer.name,
    createdByInfo: {
      userId: String(apiOffer.created_by.id),
      userName: apiOffer.created_by.name,
      email:
        typeof apiOffer.created_by.name === "string"
          ? `${apiOffer.created_by.name.replace(/\s+/g, ".").toLowerCase()}@example.com`
          : "unknown@example.com",
    },
    assignedToInfo: apiOffer.assign_user
      ? {
          userId: String(apiOffer.assign_user.id),
          userName: apiOffer.assign_user.name,
        }
      : undefined,
    createdDate: new Date(apiOffer.created_at),
    updated_at: apiOffer.updated_at ? new Date(apiOffer.updated_at) : undefined,
    numberOfBuyers: apiOffer.numberOfBuyers,
    numberOfSellers: apiOffer.numberOfSellers,
    groups: offerGroups.length > 0 ? offerGroups : undefined,
    updated_by_name: apiOffer.updated_by_name,
    updated_by_role: apiOffer.updated_by_role,
    originalApiItem: apiOffer,
  };
};

const transformApiDemand = (
  apiDemand: ActualApiDemandShape
): OfferDemandItem => {
  const demandGroups: ApiGroupItem[] = [];

  if (apiDemand.seller_section) {
    const items: string[] = [];
    Object.values(apiDemand.seller_section).forEach((sectionPart) => {
      if (sectionPart?.questions) {
        Object.values(sectionPart.questions).forEach((q) => {
          if (q?.question) items.push(q.question);
        });
      }
    });
    if (items.length > 0)
      demandGroups.push({ groupName: "Seller Section", items });
  }
  if (apiDemand.buyer_section) {
    const items: string[] = [];
    Object.values(apiDemand.buyer_section).forEach((sectionPart) => {
      if (sectionPart?.questions) {
        Object.values(sectionPart.questions).forEach((q) => {
          if (q?.question) items.push(q.question);
        });
      }
    });
    if (items.length > 0)
      demandGroups.push({ groupName: "Buyer Section", items });
  }
  if (apiDemand.groupA)
    demandGroups.push({ groupName: "Group A", items: [apiDemand.groupA] });
  if (apiDemand.groupB)
    demandGroups.push({ groupName: "Group B", items: [apiDemand.groupB] });

  return {
    id: apiDemand.generate_id,
    type: "Demand",
    name: apiDemand.name,
    createdByInfo: {
      userId: String(apiDemand.created_by.id),
      userName: apiDemand.created_by.name,
      email:
        typeof apiDemand.created_by?.name === "string"
          ? `${apiDemand.created_by.name.replace(/\s+/g, ".").toLowerCase()}@example.com`
          : "unknown@example.com",
    },
    assignedToInfo: apiDemand.assign_user
      ? {
          userId: String(apiDemand.assign_user.id),
          userName: apiDemand.assign_user.name,
        }
      : undefined,
    createdDate: new Date(apiDemand.created_at),
    updated_at: apiDemand.updated_at
      ? new Date(apiDemand.updated_at)
      : undefined,
    numberOfBuyers: apiDemand.numberOfBuyers,
    numberOfSellers: apiDemand.numberOfSellers,
    groups: demandGroups.length > 0 ? demandGroups : undefined,
    updated_by_name: apiDemand.updated_by_name,
    updated_by_role: apiDemand.updated_by_role,
    originalApiItem: apiDemand,
  };
};

const ActionColumn = React.memo(
  ({
    rowData,
    onEdit,
    onDelete,
    onOpenModal,
  }: {
    rowData: OfferDemandItem;
    onEdit: () => void;
    onDelete: () => void;
    onOpenModal: (type: OfferDemandModalType, data: OfferDemandItem) => void;
  }) => (
    <div className="flex items-center justify-center gap-0">
      <Tooltip title="Edit / View">
        <div
          role="button"
          onClick={onEdit}
          className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Edit / View">
        <div
          role="button"
          className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
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
        <Dropdown.Item
          onClick={() => onOpenModal("trackRecord", rowData)}
          className="flex items-center gap-2"
        >
          <TbCircleCheck size={18} />{" "}
          <span className="text-xs">Accept</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("trackRecord", rowData)}
          className="flex items-center gap-2"
        >
          <TbCancel size={18} />{" "}
          <span className="text-xs">Reject</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("engagement", rowData)}
          className="flex items-center gap-2"
        >
          <TbUserSearch size={18} /> <span className="text-xs">Convert to Lead</span>
        </Dropdown.Item>
        {/* <Dropdown.Item
          onClick={() => onOpenModal("document", rowData)}
          className="flex items-center gap-2"
        >
          <TbUpload size={18} />{" "}
          <span className="text-xs">Upload Document</span>
        </Dropdown.Item> */}
        {/* <Dropdown.Item
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
        </Dropdown.Item> */}
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
  )
);
ActionColumn.displayName = "ActionColumn";

const ItemTable = React.memo(
  ({
    columns,
    data,
    loading,
    pagingData,
    selectedItems,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
  }: {
    columns: ColumnDef<OfferDemandItem>[];
    data: OfferDemandItem[];
    loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems: OfferDemandItem[];
    onPaginationChange: (page: number) => void;
    onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect: (checked: boolean, row: OfferDemandItem) => void;
    onAllRowSelect: (checked: boolean, rows: Row<OfferDemandItem>[]) => void;
  }) => (
    <DataTable
      selectable
      columns={columns}
      data={data}
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedItems.some((selected) => selected.id === row.id)
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
  )
);
ItemTable.displayName = "ItemTable";

const ItemSearch = React.memo(
  React.forwardRef<
    HTMLInputElement,
    { onInputChange: (value: string) => void }
  >(({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      placeholder="Quick Search (ID, Name, Creator)..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  ))
);
ItemSearch.displayName = "ItemSearch";

const ItemTableTools = React.memo(
  ({
    onSearchChange,
    onExport,
  }: {
    onSearchChange: (query: string) => void;
    onExport: () => void;
  }) => (
    <div className="flex items-center w-full gap-2">
      <div className="flex-grow">
        <ItemSearch onInputChange={onSearchChange} />
      </div>
      <Button icon={<TbCloudUpload />} onClick={onExport}>
        Export
      </Button>
    </div>
  )
);
ItemTableTools.displayName = "ItemTableTools";

const ItemActionTools = React.memo(
  ({ onRefresh, onOpenFilter }: { onRefresh: () => void; onOpenFilter: () => void }) => {
    const navigate = useNavigate();
    return (
      <div className="flex flex-col md:flex-row gap-2">
        <Button icon={<TbRefresh />} onClick={onRefresh} title="Refresh Data">
          Refresh
        </Button>
        <Button icon={<TbFilter />} onClick={onOpenFilter} block>
          Filter
        </Button>
        <Button
          variant="solid"
          icon={<TbPlus />}
          onClick={() => navigate("/sales-leads/offers/create")}
          block
        >
          Add Offer
        </Button>
        <Button
          icon={<TbPlus />}
          variant="solid"
          onClick={() => navigate("/sales-leads/demands/create")}
          block
        >
          Add Demand
        </Button>
      </div>
    );
  }
);
ItemActionTools.displayName = "ItemActionTools";

const ItemSelected = React.memo(
  ({
    selectedItems,
    onDeleteSelected,
    activeTab,
    isDeleting,
  }: {
    selectedItems: OfferDemandItem[];
    onDeleteSelected: () => void;
    activeTab: string;
    isDeleting: boolean;
  }) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    const itemType =
      activeTab === TABS.OFFER
        ? "Offer"
        : activeTab === TABS.DEMAND
        ? "Demand"
        : "Item";
    return (
      <>
        <StickyFooter
          className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
          stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
        >
          <div className="flex items-center justify-between w-full px-4 sm:px-8">
            <span className="flex items-center gap-2">
              <TbChecks className="text-lg text-primary-600 dark:text-primary-400" />
              <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                <span className="heading-text">{selectedItems.length}</span>
                <span>
                  {itemType}
                  {selectedItems.length > 1 ? "s" : ""} selected
                </span>
              </span>
            </span>
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={() => setDeleteOpen(true)}
              loading={isDeleting}
            >
              Delete Selected
            </Button>
          </div>
        </StickyFooter>
        <ConfirmDialog
          isOpen={deleteOpen}
          type="danger"
          title={`Delete ${selectedItems.length} ${itemType}${
            selectedItems.length > 1 ? "s" : ""
          }`}
          onClose={() => setDeleteOpen(false)}
          onRequestClose={() => setDeleteOpen(false)}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            onDeleteSelected();
            setDeleteOpen(false);
          }}
          loading={isDeleting}
        >
          <p>
            Are you sure you want to delete the selected{" "}
            {itemType.toLowerCase()}
            {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
          </p>
        </ConfirmDialog>
      </>
    );
  }
);
ItemSelected.displayName = "ItemSelected";

const OffersDemands = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    Offers: rawOffers = [],
    Demands: rawDemands = [],
    offersStatus,
    demandsStatus,
    offersError,
    demandsError,
  } = useSelector(masterSelector);

  const [offerTableConfig, setOfferTableConfig] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [demandTableConfig, setDemandTableConfig] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [allTableConfig, setAllTableConfig] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const [selectedOffers, setSelectedOffers] = useState<OfferDemandItem[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<OfferDemandItem[]>([]);
  const [selectedAll, setSelectedAll] = useState<OfferDemandItem[]>([]);

  const [currentTab, setCurrentTab] = useState<string>(TABS.OFFER);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDeleteConfirm, setItemToDeleteConfirm] =
    useState<OfferDemandItem | null>(null);

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [modalState, setModalState] = useState<OfferDemandModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const handleOpenModal = (
    type: OfferDemandModalType,
    itemData: OfferDemandItem
  ) => setModalState({ isOpen: true, type, data: itemData });
  const handleCloseModal = () =>
    setModalState({ isOpen: false, type: null, data: null });

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
    filterFormSchema.parse({})
  );

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const currentTableConfig = useMemo(() => {
    if (currentTab === TABS.ALL) return allTableConfig;
    if (currentTab === TABS.OFFER) return offerTableConfig;
    if (currentTab === TABS.DEMAND) return demandTableConfig;
    return offerTableConfig;
  }, [currentTab, allTableConfig, offerTableConfig, demandTableConfig]);

  const setCurrentTableConfig = useMemo(() => {
    if (currentTab === TABS.ALL) return setAllTableConfig;
    if (currentTab === TABS.OFFER) return setOfferTableConfig;
    if (currentTab === TABS.DEMAND) return setDemandTableConfig;
    return setOfferTableConfig;
  }, [currentTab]);

  const currentSelectedItems = useMemo(() => {
    if (currentTab === TABS.ALL) return selectedAll;
    if (currentTab === TABS.OFFER) return selectedOffers;
    if (currentTab === TABS.DEMAND) return selectedDemands;
    return [];
  }, [currentTab, selectedAll, selectedOffers, selectedDemands]);

  const setCurrentSelectedItems = useMemo(() => {
    if (currentTab === TABS.ALL) return setSelectedAll;
    if (currentTab === TABS.OFFER) return setSelectedOffers;
    if (currentTab === TABS.DEMAND) return setSelectedDemands;
    return setSelectedOffers;
  }, [currentTab]);

  const fetchData = useCallback(() => {
    dispatch(getOffersAction());
    dispatch(getDemandsAction());
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (offersStatus === "failed" && offersError)
      toast.push(
        <Notification title="Error Fetching Offers" type="danger">
          {String(offersError)}
        </Notification>
      );
  }, [offersStatus, offersError]);
  useEffect(() => {
    if (demandsStatus === "failed" && demandsError)
      toast.push(
        <Notification title="Error Fetching Demands" type="danger">
          {String(demandsError)}
        </Notification>
      );
  }, [demandsStatus, demandsError]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let transformedData: OfferDemandItem[] = [];
    if (currentTab === TABS.OFFER) {
      transformedData = (Array.isArray(rawOffers) ? rawOffers : []).map(
        transformApiOffer
      );
    } else if (currentTab === TABS.DEMAND) {
      transformedData = (Array.isArray(rawDemands) ? rawDemands : []).map(
        transformApiDemand
      );
    } else {
      const transformedO = (Array.isArray(rawOffers) ? rawOffers : []).map(
        transformApiOffer
      );
      const transformedD = (Array.isArray(rawDemands) ? rawDemands : []).map(
        transformApiDemand
      );
      transformedData = [...transformedO, ...transformedD];
    }

    let processedData = [...transformedData];

    if (filterCriteria.createdDateRange?.[0] || filterCriteria.createdDateRange?.[1]) {
        const [start, end] = filterCriteria.createdDateRange.map((d) => d ? new Date(new Date(d).setHours(0,0,0,0)) : null);
        const endOfDay = end ? new Date(new Date(end).setHours(23,59,59,999)) : null;
        processedData = processedData.filter((item) => {
          const itemDate = item.createdDate;
          if (start && endOfDay) return itemDate >= start && itemDate <= endOfDay;
          if (start) return itemDate >= start;
          if (endOfDay) return itemDate <= endOfDay;
          return true;
        });
    }
    if (filterCriteria.updatedDateRange?.[0] || filterCriteria.updatedDateRange?.[1]) {
        const [start, end] = filterCriteria.updatedDateRange.map((d) => d ? new Date(new Date(d).setHours(0,0,0,0)) : null);
        const endOfDay = end ? new Date(new Date(end).setHours(23,59,59,999)) : null;
        processedData = processedData.filter((item) => {
          const itemDate = item.updated_at;
          if (!itemDate) return false;
          if (start && endOfDay) return itemDate >= start && itemDate <= endOfDay;
          if (start) return itemDate >= start;
          if (endOfDay) return itemDate <= endOfDay;
          return true;
        });
    }
    if (filterCriteria.itemType) {
        processedData = processedData.filter(item => item.type === filterCriteria.itemType);
    }
    if (filterCriteria.creatorIds?.length) {
        const creatorIdSet = new Set(filterCriteria.creatorIds);
        processedData = processedData.filter(item => creatorIdSet.has(item.createdByInfo.userId));
    }
    if (filterCriteria.assigneeIds?.length) {
        const assigneeIdSet = new Set(filterCriteria.assigneeIds);
        processedData = processedData.filter(item => item.assignedToInfo && assigneeIdSet.has(item.assignedToInfo.userId));
    }

    if (currentTableConfig.query) {
      const query = currentTableConfig.query.toLowerCase();
      processedData = processedData.filter(
        (item) =>
          item.id.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query) ||
          item.createdByInfo.userName.toLowerCase().includes(query) ||
          (item.assignedToInfo?.userName.toLowerCase().includes(query) ?? false)
      );
    }

    const { order, key } = currentTableConfig.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "createdDate" || key === "updated_at") {
          const dateA = a[key]
            ? new Date(a[key]!).getTime()
            : order === "asc"
            ? Infinity
            : -Infinity;
          const dateB = b[key]
            ? new Date(b[key]!).getTime()
            : order === "asc"
            ? Infinity
            : -Infinity;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        } else if (key === "name" || key === "id") {
          aValue = a[key];
          bValue = b[key];
        } else if (key === "createdBy") {
          aValue = a.createdByInfo.userName;
          bValue = b.createdByInfo.userName;
        } else {
          aValue = (a as any)[key];
          bValue = (b as any)[key];
        }

        if (typeof aValue === "string" && typeof bValue === "string")
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        if (typeof aValue === "number" && typeof bValue === "number")
          return order === "asc" ? aValue - bValue : bValue - aValue;
        return 0;
      });
    }

    const allData = processedData;
    const dataTotal = allData.length;
    const pageIndex = currentTableConfig.pageIndex as number;
    const pageSize = currentTableConfig.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;

    return {
      pageData: allData.slice(startIndex, startIndex + pageSize),
      total: dataTotal,
      allFilteredAndSortedData: allData,
    };
  }, [rawOffers, rawDemands, currentTab, currentTableConfig, filterCriteria]);

  const handleSetTableConfig = useCallback(
    (data: Partial<TableQueries>) => {
      setCurrentTableConfig((prev) => ({
        ...prev,
        ...data,
        pageIndex: data.pageIndex !== undefined ? data.pageIndex : 1,
      }));
    },
    [setCurrentTableConfig]
  );

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);

  const closeFilterDrawer = useCallback(() => {
    setIsFilterDrawerOpen(false);
  }, []);

  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    setFilterCriteria(data);
    handleSetTableConfig({ pageIndex: 1 });
    closeFilterDrawer();
  }, [handleSetTableConfig, closeFilterDrawer]);

  const onClearFilters = useCallback(() => {
    const defaults = filterFormSchema.parse({});
    filterFormMethods.reset(defaults);
    setFilterCriteria(defaults);
    handleSetTableConfig({ pageIndex: 1, query: '' });
    closeFilterDrawer();
  }, [filterFormMethods, handleSetTableConfig, closeFilterDrawer]);


  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableConfig({ pageIndex: page }),
    [handleSetTableConfig]
  );
  const handlePageSizeChange = useCallback(
    (value: number) => {
      handleSetTableConfig({ pageSize: value, pageIndex: 1 });
      setCurrentSelectedItems([]);
    },
    [handleSetTableConfig, setCurrentSelectedItems]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableConfig({ sort, pageIndex: 1 }),
    [handleSetTableConfig]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableConfig({ query, pageIndex: 1 }),
    [handleSetTableConfig]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: OfferDemandItem) => {
      setCurrentSelectedItems((prev) =>
        checked
          ? prev.some((i) => i.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((i) => i.id !== row.id)
      );
    },
    [setCurrentSelectedItems]
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, currentTableRows: Row<OfferDemandItem>[]) => {
      const currentVisibleIds = new Set(
        currentTableRows.map((r) => r.original.id)
      );
      if (checked) {
        setCurrentSelectedItems((prev) => {
          const newItemsToAdd = currentTableRows
            .map((r) => r.original)
            .filter((item) => !prev.some((pItem) => pItem.id === item.id));
          return [...prev, ...newItemsToAdd];
        });
      } else {
        setCurrentSelectedItems((prev) =>
          prev.filter((item) => !currentVisibleIds.has(item.id))
        );
      }
    },
    [setCurrentSelectedItems]
  );

  const handleEdit = useCallback(
    (item: OfferDemandItem) => {
      const basePath = item.type === "Offer" ? "offers" : "demands";
      navigate(`/sales-leads/${basePath}/edit/${item.originalApiItem.id}`);
    },
    [navigate]
  );

  const handleDeleteClick = useCallback(
    (item: OfferDemandItem) => setItemToDeleteConfirm(item),
    []
  );

  const onConfirmDelete = useCallback(async () => {
    if (!itemToDeleteConfirm) return;
    setIsDeleting(true);

    try {
      const { originalApiItem, type, name } = itemToDeleteConfirm;
      const idToDelete = originalApiItem.id;

      if (type === "Offer") {
        await dispatch(deleteOfferAction(idToDelete)).unwrap();
      } else if (type === "Demand") {
        await dispatch(deleteDemandAction(idToDelete)).unwrap();
      }

      toast.push(
        <Notification
          title="Deleted"
          type="success"
        >{`${name} has been deleted.`}</Notification>
      );
      fetchData();
      setCurrentSelectedItems((prev) => prev.filter((i) => i.id !== itemToDeleteConfirm.id));
    } catch (error: any) {
      const errorMessage =
        error?.message || `Failed to delete ${itemToDeleteConfirm.type}.`;
      toast.push(
        <Notification title="Delete Failed" type="danger">
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDeleteConfirm(null);
    }
  }, [dispatch, itemToDeleteConfirm, fetchData, setCurrentSelectedItems]);

  const handleDeleteSelected = useCallback(async () => {
    if (currentSelectedItems.length === 0) return;
    setIsDeleting(true);

    const offersToDelete = currentSelectedItems
      .filter((item) => item.type === "Offer")
      .map(item => ({...item.originalApiItem, id: Number(item.originalApiItem.id)} as ActualApiOfferShape));
    const demandsToDelete = currentSelectedItems
      .filter((item) => item.type === "Demand")
      .map(item => ({...item.originalApiItem, id: Number(item.originalApiItem.id)} as ActualApiDemandShape));


    const deletePromises: Promise<any>[] = [];

    if (offersToDelete.length > 0) {
      deletePromises.push(
        dispatch(deleteAllOffersAction(offersToDelete)).unwrap()
      );
    }

    if (demandsToDelete.length > 0) {
      deletePromises.push(
        dispatch(deleteAllDemandsAction(demandsToDelete)).unwrap()
      );
    }

    try {
      await Promise.all(deletePromises);
      toast.push(
        <Notification
          title="Bulk Delete Successful"
          type="success"
        >{`${currentSelectedItems.length} items have been deleted.`}</Notification>
      );
      fetchData();
      setCurrentSelectedItems([]);
    } catch (error: any) {
      const errorMessage =
        error?.message || "An error occurred during bulk deletion.";
      toast.push(
        <Notification title="Bulk Delete Failed" type="danger">
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, currentSelectedItems, fetchData, setCurrentSelectedItems]);

  const handleTabChange = useCallback(
    (tabKey: string) => {
      if (tabKey === currentTab) return;
      setCurrentTab(tabKey);
      const defaults = filterFormSchema.parse({});
      filterFormMethods.reset(defaults);
      setFilterCriteria(defaults);

      if (tabKey === TABS.ALL) {
        setSelectedAll([]);
        setAllTableConfig({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
      } else if (tabKey === TABS.OFFER) {
        setSelectedOffers([]);
        setOfferTableConfig({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
      } else if (tabKey === TABS.DEMAND) {
        setSelectedDemands([]);
        setDemandTableConfig({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
      }
    },
    [currentTab, filterFormMethods]
  );

  const handleOpenExportReasonModal = useCallback(() => {
    if (!allFilteredAndSortedData || allFilteredAndSortedData.length === 0) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  }, [allFilteredAndSortedData, exportReasonFormMethods]);

  const handleConfirmExportWithReason = useCallback(
    async (data: ExportReasonFormData) => {
      setIsSubmittingExportReason(true);
      const moduleName = "Offers & Demands";
      const date = dayjs().format('YYYYMMDD');
      const filename = `offers_demands_export_${date}.csv`;
      try {
        await dispatch(
          submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: filename })
        ).unwrap();
      } catch (error) {
        /* Optional error handling */
      }
      const success = exportToCsvOffersDemands(
        filename,
        allFilteredAndSortedData
      );
      if (success) {
        toast.push(
          <Notification title="Export Successful" type="success">
            Data exported.
          </Notification>
        );
      }
      setIsSubmittingExportReason(false);
      setIsExportReasonModalOpen(false);
    },
    [dispatch, allFilteredAndSortedData]
  );

  const columns: ColumnDef<OfferDemandItem>[] = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        enableSorting: true,
        size: 70,
        cell: (props: CellContext<OfferDemandItem, any>) => (
          <span className="font-mono text-xs">{props.getValue<string>()}</span>
        ),
      },
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        size: 180,
        cell: (props: CellContext<OfferDemandItem, any>) => (
          <div>
            <div className="font-semibold">{props.row.original.name}</div>
            {(props.row.original.numberOfBuyers !== undefined ||
              props.row.original.numberOfSellers !== undefined) && (
              <>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Buyers: {props.row.original.numberOfBuyers ?? "N/A"}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Sellers: {props.row.original.numberOfSellers ?? "N/A"}
                </div>
              </>
            )}
          </div>
        ),
      },
      {
        header: "Section Details",
        id: "sectionDetails",
        size: 220,
        cell: ({ row }: CellContext<OfferDemandItem, any>) => {
          const { groups } = row.original;
          if (!groups || groups.length === 0)
            return (
              <span className="text-xs text-gray-500">No group details</span>
            );
          return (
            <div className="space-y-1">
              {groups.map((group, index) => (
                <div key={index} className="text-xs">
                  <b className="text-gray-700 dark:text-gray-200">
                    {group.groupName}:{" "}
                  </b>
                  <div className="pl-2 flex flex-col gap-0.5 text-gray-600 dark:text-gray-400">
                    {group.items.slice(0, 3).map((item, itemIdx) => (
                      <span key={itemIdx}>{item}</span>
                    ))}
                    {group.items.length > 3 && (
                      <span className="italic">
                        ...and {group.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        header: "Created By / Assigned",
        accessorKey: "createdByInfo.userName",
        id: "createdBy",
        enableSorting: true,
        size: 180,
        cell: (props: CellContext<OfferDemandItem, any>) => {
          const item = props.row.original;
          const formattedCreatedDate = item.createdDate
            ? `${new Date(item.createdDate).getDate()} ${new Date(
                item.createdDate
              ).toLocaleString("en-US", { month: "long" })} ${new Date(
                item.createdDate
              ).getFullYear()}, ${new Date(item.createdDate).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}`
            : "N/A";
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Avatar size={28} shape="circle" icon={<TbUserCircle />} />
                <span className="font-semibold">
                  {item.createdByInfo.userName}
                </span>
              </div>
              {item.assignedToInfo && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  <b>Assigned: </b> {item.assignedToInfo.userName}
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span>{formattedCreatedDate}</span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,

        size: 120,
        cell: (props) => {
          const { updated_at, updated_by_user, updated_by_role } =
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
                {updated_by_user?.roles[0]?.display_name && (
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
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center" },
        size: 120,
        cell: (props: CellContext<OfferDemandItem, any>) => (
          <ActionColumn
            rowData={props.row.original}
            onEdit={() => handleEdit(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onOpenModal={handleOpenModal}
          />
        ),
      },
    ],
    [handleEdit, handleDeleteClick, handleOpenModal]
  );

  const isOverallLoading =
    offersStatus === "loading" ||
    demandsStatus === "loading" ||
    offersStatus === "idle" ||
    demandsStatus === "idle";

  const dummyUserOptions = useMemo(() => {
    const users = new Map<string, string>();
    rawOffers.forEach(o => {
        if (o.created_by) users.set(String(o.created_by.id), o.created_by.name);
        if (o.assign_user) users.set(String(o.assign_user.id), o.assign_user.name);
    });
    rawDemands.forEach(d => {
        if (d.created_by) users.set(String(d.created_by.id), d.created_by.name);
        if (d.assign_user) users.set(String(d.assign_user.id), d.assign_user.name);
    });
    return Array.from(users.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, [rawOffers, rawDemands]);

  const itemTypeOptions = [
    { value: "Offer" as const, label: "Offer" },
    { value: "Demand" as const, label: "Demand" },
  ];

  if (isOverallLoading && !pageData.length) {
    return (
      <Container className="h-full">
        <div className="h-full flex flex-col items-center justify-center">
          <Spinner size="xl" />
          <p className="mt-2">Loading Data...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4">
            <h5 className="mb-4 lg:mb-0">Offers & Demands</h5>
            <ItemActionTools onRefresh={fetchData} onOpenFilter={openFilterDrawer} />
          </div>

          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[TABS.ALL, TABS.OFFER, TABS.DEMAND].map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => handleTabChange(tabKey)}
                  className={classNames(
                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize",
                    currentTab === tabKey
                      ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  {tabKey === TABS.ALL ? "All Items" : `${tabKey} Listing`}
                </button>
              ))}
            </nav>
          </div>

          <div className="mb-4">
            <ItemTableTools
              onSearchChange={handleSearchChange}
              onExport={handleOpenExportReasonModal}
            />
          </div>

          <div className="flex-grow overflow-auto">
            <ItemTable
              columns={columns}
              data={pageData}
              loading={isOverallLoading && pageData.length > 0}
              pagingData={{
                total,
                pageIndex: currentTableConfig.pageIndex as number,
                pageSize: currentTableConfig.pageSize as number,
              }}
              selectedItems={currentSelectedItems}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handlePageSizeChange}
              onSort={handleSort}
              onRowSelect={handleRowSelect}
              onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>

        <ItemSelected
          selectedItems={currentSelectedItems}
          onDeleteSelected={handleDeleteSelected}
          activeTab={currentTab}
          isDeleting={isDeleting}
        />
        <ConfirmDialog
          isOpen={!!itemToDeleteConfirm}
          type="danger"
          title={`Delete ${itemToDeleteConfirm?.type || "Item"}`}
          onClose={() => setItemToDeleteConfirm(null)}
          onRequestClose={() => setItemToDeleteConfirm(null)}
          onCancel={() => setItemToDeleteConfirm(null)}
          onConfirm={onConfirmDelete}
          loading={isDeleting}
        >
          <p>
            Are you sure you want to delete "
            <strong>{itemToDeleteConfirm?.name}</strong>"? This action cannot be
            undone.
          </p>
        </ConfirmDialog>
      </Container>

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
        <Form
          id="exportReasonForm"
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
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
          </FormItem>
        </Form>
      </ConfirmDialog>

      <Drawer
        title="Filter"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button size="sm" onClick={onClearFilters}>Clear All</Button>
            <Button size="sm" variant="solid" form="filterForm" type="submit">Apply Filters</Button>
          </div>
        }
    >
        <Form
            id="filterForm"
            onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
            className="flex flex-col gap-y-6 p-4 h-full overflow-y-auto" // Added overflow-y-auto
        >
            <FormItem label="Filter by Type">
                <Controller
                    name="itemType"
                    control={filterFormMethods.control}
                    render={({ field }) => (
                        <Select
                            placeholder="Select Type (Offer/Demand)"
                            options={itemTypeOptions}
                            value={itemTypeOptions.find(opt => opt.value === field.value)}
                            onChange={(option) => field.onChange(option?.value || null)}
                            isClearable
                        />
                    )}
                />
            </FormItem>
            <FormItem label="Created Date Range">
                <Controller
                    name="createdDateRange"
                    control={filterFormMethods.control}
                    render={({ field }) => (
                        <DatePicker.DatePickerRange
                            value={field.value as any}
                            onChange={field.onChange}
                            placeholder="Start Date - End Date"
                            inputFormat="DD MMM YYYY"
                        />
                    )}
                />
            </FormItem>
             <FormItem label="Updated Date Range">
                <Controller
                    name="updatedDateRange"
                    control={filterFormMethods.control}
                    render={({ field }) => (
                        <DatePicker.DatePickerRange
                            value={field.value as any}
                            onChange={field.onChange}
                            placeholder="Start Date - End Date"
                            inputFormat="DD MMM YYYY"
                        />
                    )}
                />
            </FormItem>
            <FormItem label="Filter by Creator">
                <Controller
                    name="creatorIds"
                    control={filterFormMethods.control}
                    render={({ field }) => (
                        <Select
                            isMulti
                            placeholder="Select Creator(s)"
                            options={dummyUserOptions}
                            value={dummyUserOptions.filter(opt => field.value?.includes(opt.value))}
                            onChange={(options) => field.onChange(options?.map(opt => opt.value) || [])}
                        />
                    )}
                />
            </FormItem>
            <FormItem label="Filter by Assignee">
                <Controller
                    name="assigneeIds"
                    control={filterFormMethods.control}
                    render={({ field }) => (
                        <Select
                            isMulti
                            placeholder="Select Assignee(s)"
                            options={dummyUserOptions}
                            value={dummyUserOptions.filter(opt => field.value?.includes(opt.value))}
                            onChange={(options) => field.onChange(options?.map(opt => opt.value) || [])}
                        />
                    )}
                />
            </FormItem>
        </Form>
    </Drawer>

      <OfferDemandModals modalState={modalState} onClose={handleCloseModal} />
    </>
  );
};

export default OffersDemands;