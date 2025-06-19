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
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);


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
// import Tag from "@/components/ui/Tag"; // Not used directly, but DataTable might use it
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Spinner from "@/components/ui/Spinner";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  // TbAffiliate, // Not used
  TbAlarm,
  TbAlertTriangle,
  TbBell,
  TbBrandWhatsapp,
  // TbBuilding, // Not used
  TbCalendar,
  TbCalendarEvent,
  TbCancel,
  TbChecks,
  TbCircleCheck,
  // TbCircleLetterX, // Not used
  // TbCircleX, // Not used
  TbClipboardText,
  // TbCloudDownload, // Not used directly
  TbCloudUpload,
  // TbDotsVertical, // Not used
  TbDownload,
  TbEye,
  // TbEyeDollar, // Not used
  // TbFileSearch, // Not used
  TbFileText,
  TbFileZip,
  TbFilter,
  // TbLink, // Not used
  TbMail,
  // TbMessageCircle, // Not used
  // TbMessageReport, // Not used
  TbPencil,
  TbPlus,
  // TbReceipt, // Not used
  TbRefresh,
  TbSearch,
  // TbShare, // Not used
  TbTagStarred,
  TbTrash,
  // TbUpload, // Not used
  TbUser,
  TbUserCircle,
  TbUserSearch,
  // TbUsersGroup, // Not used
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
import type { TableQueries as CommonTableQueries } from "@/@types/common"; 

// Define specific table queries if needed, or ensure CommonTableQueries matches
interface TableQueries extends CommonTableQueries {
    // Add any specific fields if @/@types/common is too generic
}


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
  creatorIds: z.array(z.string()).optional().default([]), // Will be sent as created_by=id1,id2
  assigneeIds: z.array(z.string()).optional().default([]), // Will be sent as assign_user=id1,id2
});
type FilterFormData = z.infer<typeof filterFormSchema>;


// --- API Item Types (Adjusted based on sample and requirements for transformation) ---
export type ApiUserShape = { 
  id: number;
  name: string;
  roles?: Array<{ display_name: string; }>;
};

export type ActualApiOfferShape = {
  id: number; 
  generate_id: string; 
  name: string;
  created_by: ApiUserShape; 
  assign_user?: ApiUserShape | null; 
  created_at: string;
  updated_at?: string;
  seller_section?: string | string[] | null;
  buyer_section?: string | string[] | null;
  groupA?: string | null;
  groupB?: string | null;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  updated_by_name?: string; 
  updated_by_role?: string; 
  // For preserving raw user objects if needed, e.g. updated_by_user for ID.
  // This depends on how Redux middleware populates 'updated_by_name/role'
  // vs. providing the full updated_by_user object.
  // For simplicity, assuming updated_by_name/role are directly on the object.
  // If not, 'originalApiItem.updated_by_user.id' would be used.
};

export type ActualApiDemandShape = {
  id: number;
  generate_id: string;
  name: string;
  created_by: ApiUserShape;
  assign_user?: ApiUserShape | null;
  created_at: string;
  updated_at?: string;
  seller_section?: Record< string, { questions: Record<string, { question: string }> } > | null;
  buyer_section?: Record< string, { questions: Record<string, { question: string }> } > | null;
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

const TABS = { ALL: "all", OFFER: "offer", DEMAND: "demand" };

// ============================================================================
// --- MODALS SECTION (ASSUMED UNCHANGED as per instructions) ---
// ============================================================================
export type OfferDemandModalType =
  | "email" | "whatsapp" | "notification" | "task" | "active" | "calendar"
  | "alert" | "trackRecord" | "engagement" | "document" | "feedback" | "wallLink";

export interface OfferDemandModalState { isOpen: boolean; type: OfferDemandModalType | null; data: OfferDemandItem | null; }
interface OfferDemandModalsProps { modalState: OfferDemandModalState; onClose: () => void; }

const dummyUsersForModals = [ // Renamed to avoid confusion with dynamic user list for filters
  { value: "user1", label: "Alice Johnson" }, { value: "user2", label: "Bob Williams" }, { value: "user3", label: "Charlie Brown" },
];
const priorityOptions = [ { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, ];
const eventTypeOptions = [ { value: "meeting", label: "Meeting" }, { value: "call", label: "Follow-up Call" }, { value: "deadline", label: "Project Deadline" }, ];
const dummyAlerts = [ { id: 1, severity: "danger", message: "Offer #OD123 has low engagement.", time: "2 days ago", }, { id: 2, severity: "warning", message: "Demand #DD456 is approaching its expiration date.", time: "5 days ago", }, ];
const dummyTimeline = [ { id: 1, icon: <TbMail />, title: "Initial Offer Created", desc: "Offer was created and sent.", time: "2023-11-01", }, { id: 2, icon: <TbCalendar />, title: "Follow-up Call Scheduled", desc: "Scheduled a call.", time: "2023-10-28", }, { id: 3, icon: <TbUser />, title: "Item Assigned", desc: "Assigned to team.", time: "2023-10-27", }, ];
const dummyDocs = [ { id: "doc1", name: "Offer_Details.pdf", type: "pdf", size: "1.2 MB", }, { id: "doc2", name: "Images.zip", type: "zip", size: "8.5 MB", }, ];

const OfferDemandModals: React.FC<OfferDemandModalsProps> = ({ modalState, onClose, }) => {
  const { type, data: item, isOpen } = modalState;
  if (!isOpen || !item) return null;
  const renderModalContent = () => {
    switch (type) {
      case "email": return <SendEmailDialog item={item} onClose={onClose} />;
      case "whatsapp": return <SendWhatsAppDialog item={item} onClose={onClose} />;
      case "notification": return <AddNotificationDialog item={item} onClose={onClose} />;
      case "task": return <AssignTaskDialog item={item} onClose={onClose} />;
      case "calendar": return <AddScheduleDialog item={item} onClose={onClose} />;
      case "alert": return <ViewAlertDialog item={item} onClose={onClose} />;
      case "trackRecord": return <TrackRecordDialog item={item} onClose={onClose} />; // Generic, can be Accept/Reject
      case "engagement": return <ViewEngagementDialog item={item} onClose={onClose} />;
      case "document": return <DownloadDocumentDialog item={item} onClose={onClose} />;
      default: return (<GenericActionDialog type={type} item={item} onClose={onClose} />);
    }
  };
  return <>{renderModalContent()}</>;
};

const SendEmailDialog: React.FC<{item: OfferDemandItem; onClose: () => void;}> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { subject: "", message: "" }, });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true); console.log("Email to", item.createdByInfo.email, ":", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Email Sent" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send Email: {item.name}</h5>
      <p className="mb-4 text-sm">To: {item.createdByInfo.userName} ({item.createdByInfo.email})</p>
      <form onSubmit={handleSubmit(onSendEmail)}>
        <FormItem label="Subject"><Controller name="subject" control={control} render={({ field }) => (<Input {...field} placeholder={`Re: ${item.type} ${item.name}`} />)}/></FormItem>
        <FormItem label="Message"><Controller name="message" control={control} render={({ field }) => (<RichTextEditor value={field.value} onChange={field.onChange} />)}/></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Send</Button></div>
      </form>
    </Dialog>
  );
};

const SendWhatsAppDialog: React.FC<{ item: OfferDemandItem; onClose: () => void; }> = ({ item, onClose }) => {
  const { control, handleSubmit } = useForm({ defaultValues: { message: `Hi ${item.createdByInfo.userName}, re: ${item.type} "${item.name}"...`}, });
  const onSendMessage = (data: { message: string }) => {
    const phone = "1234567890"; // Placeholder
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`, "_blank");
    toast.push(<Notification type="success" title="Redirecting to WhatsApp" />); onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send WhatsApp: {item.name}</h5>
      <form onSubmit={handleSubmit(onSendMessage)}>
        <FormItem label="Message"><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />}/></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit">Open WhatsApp</Button></div>
      </form>
    </Dialog>
  );
};

const AddNotificationDialog: React.FC<{ item: OfferDemandItem; onClose: () => void; }> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { title: "", users: [], message: "" }, });
  const onSend = (data: any) => {
    setIsLoading(true); console.log("Notification for", item.name, ":", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Notification Sent" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for {item.name}</h5>
      <form onSubmit={handleSubmit(onSend)}>
        <FormItem label="Title"><Controller name="title" control={control} render={({ field }) => <Input {...field} />}/></FormItem>
        <FormItem label="Send to Users"><Controller name="users" control={control} render={({ field }) => (<Select isMulti placeholder="Select Users" options={dummyUsersForModals} {...field}/>)}/></FormItem>
        <FormItem label="Message"><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={3} />}/></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Send</Button></div>
      </form>
    </Dialog>
  );
};

const AssignTaskDialog: React.FC<{ item: OfferDemandItem; onClose: () => void; }> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { title: `Follow up: ${item.type} ${item.name}`, assignee: null, dueDate: null, priority: null, description: "",}, });
  const onAssignTask = (data: any) => {
    setIsLoading(true); console.log("Assign task for", item.name, ":", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Task Assigned" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for {item.name}</h5>
      <form onSubmit={handleSubmit(onAssignTask)}>
        <FormItem label="Title"><Controller name="title" control={control} render={({ field }) => <Input {...field} />}/></FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Assign To"><Controller name="assignee" control={control} render={({ field }) => (<Select placeholder="Select User" options={dummyUsersForModals} {...field}/>)}/></FormItem>
          <FormItem label="Priority"><Controller name="priority" control={control} render={({ field }) => (<Select placeholder="Select Priority" options={priorityOptions} {...field}/>)}/></FormItem>
        </div>
        <FormItem label="Due Date"><Controller name="dueDate" control={control} render={({ field }) => (<DatePicker placeholder="Select date" value={field.value} onChange={field.onChange}/> )}/></FormItem>
        <FormItem label="Description"><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} />}/></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Assign Task</Button></div>
      </form>
    </Dialog>
  );
};

const AddScheduleDialog: React.FC<{ item: OfferDemandItem; onClose: () => void; }> = ({ item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { title: "", eventType: null, startDate: null, notes: "" }, });
  const onAddEvent = (data: any) => {
    setIsLoading(true); console.log("Add event for", item.name, ":", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Event Scheduled" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for {item.name}</h5>
      <form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title"><Controller name="title" control={control} render={({ field }) => (<Input {...field} placeholder={`e.g., Review ${item.type}`} />)}/></FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Event Type"><Controller name="eventType" control={control} render={({ field }) => (<Select placeholder="Select Type" options={eventTypeOptions} {...field}/>)}/></FormItem>
          <FormItem label="Date & Time"><Controller name="startDate" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date & time" value={field.value} onChange={field.onChange}/> )}/></FormItem>
        </div>
        <FormItem label="Notes"><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />}/></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Save Event</Button></div>
      </form>
    </Dialog>
  );
};

const ViewAlertDialog: React.FC<{ item: OfferDemandItem; onClose: () => void; }> = ({ item, onClose }) => {
  const alertColors: Record<string, string> = { danger: "red", warning: "amber", info: "blue" };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
      <h5 className="mb-4">Alerts for {item.name}</h5>
      <div className="mt-4 flex flex-col gap-3">
        {dummyAlerts.length > 0 ? ( dummyAlerts.map((alert) => (
            <div key={alert.id} className={`p-3 rounded-lg border-l-4 border-${alertColors[alert.severity]}-500 bg-${alertColors[alert.severity]}-50 dark:bg-${alertColors[alert.severity]}-500/10`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2"><TbAlertTriangle className={`text-${alertColors[alert.severity]}-500 mt-1`} size={20}/> <p className="text-sm">{alert.message}</p></div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{alert.time}</span>
              </div>
            </div>))
        ) : (<p>No active alerts.</p>)}
      </div>
      <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};

const TrackRecordDialog: React.FC<{ item: OfferDemandItem; onClose: () => void; }> = ({ item, onClose }) => {
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
      <h5 className="mb-4">Track Record for {item.name}</h5>
      <div className="mt-4 -ml-4">
        {dummyTimeline.map((tlItem, index) => (
          <div key={tlItem.id} className="flex gap-4 relative">
            {index < dummyTimeline.length - 1 && (<div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-600"></div>)}
            <div className="flex-shrink-0 z-10 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 text-gray-500 flex items-center justify-center">
              {React.cloneElement(tlItem.icon, { size: 24 })}</div>
            <div className="pb-8"><p className="font-semibold">{tlItem.title}</p><p className="text-sm text-gray-600 dark:text-gray-300">{tlItem.desc}</p><p className="text-xs text-gray-400 mt-1">{tlItem.time}</p></div>
          </div>))}
      </div>
      <div className="text-right mt-2"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};

const ViewEngagementDialog: React.FC<{item: OfferDemandItem; onClose: () => void;}> = ({ item, onClose }) => {
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Engagement for {item.name}</h5>
      <div className="grid grid-cols-2 gap-4 mt-4 text-center">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-xs text-gray-500">Last Updated</p><p className="font-bold text-lg">{item.updated_at ? dayjs(item.updated_at).fromNow() : 'N/A'}</p></div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-xs text-gray-500">Health Score</p><p className="font-bold text-lg text-green-500">{item.health_score || 85}%</p></div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-xs text-gray-500">Views (30d)</p><p className="font-bold text-lg">125</p></div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-xs text-gray-500">Interactions</p><p className="font-bold text-lg">18</p></div>
      </div>
      <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};

const DownloadDocumentDialog: React.FC<{ item: OfferDemandItem; onClose: () => void; }> = ({ item, onClose }) => {
  const iconMap: Record<string, React.ReactElement> = { pdf: <TbFileText className="text-red-500" />, zip: <TbFileZip className="text-amber-500" />, };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Documents for {item.name}</h5>
      <div className="flex flex-col gap-3 mt-4">
        {dummyDocs.map((doc) => (
          <div key={doc.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-3">{React.cloneElement(iconMap[doc.type] || <TbClipboardText />, { size: 28, })}<div><p className="font-semibold text-sm">{doc.name}</p><p className="text-xs text-gray-400">{doc.size}</p></div></div>
            <Tooltip title="Download"><Button shape="circle" size="sm" icon={<TbDownload />} /></Tooltip>
          </div>))}
      </div>
      <div className="text-right mt-6"><Button onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};

const GenericActionDialog: React.FC<{ type: OfferDemandModalType | null; item: OfferDemandItem; onClose: () => void; }> = ({ type, item, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}` : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true); console.log(`Action '${type}' for ${item.name}`);
    setTimeout(() => { toast.push(<Notification type="success" title="Action Completed" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-2">{title}</h5><p>Perform this action for <span className="font-semibold">{item.name}</span>?</p>
      <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" onClick={handleConfirm} loading={isLoading}>Confirm</Button></div>
    </Dialog>
  );
};
// ============================================================================
// --- END MODALS SECTION ---
// ============================================================================

// --- CSV Export Helpers ---
type OfferDemandExportItem = Omit< OfferDemandItem, | "createdDate" | "updated_at" | "createdByInfo" | "assignedToInfo" | "originalApiItem" | "groups" > & 
{ created_by_name: string; assigned_to_name: string; created_date_formatted: string; updated_date_formatted: string; };

const CSV_HEADERS_OFFERS_DEMANDS = [ "ID", "Type", "Name", "Number of Buyers", "Number of Sellers", "Created By", "Assigned To", "Created Date", "Last Updated", "Updated By", "Updated Role", ];
const CSV_KEYS_OFFERS_DEMANDS_EXPORT: (keyof OfferDemandExportItem)[] = [ "id", "type", "name", "numberOfBuyers", "numberOfSellers", "created_by_name", "assigned_to_name", "created_date_formatted", "updated_date_formatted", "updated_by_name", "updated_by_role", ];

function exportToCsvOffersDemands(filename: string, rows: OfferDemandItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const transformedRows: OfferDemandExportItem[] = rows.map((row) => ({
    id: row.id, type: row.type, name: row.name, numberOfBuyers: row.numberOfBuyers, numberOfSellers: row.numberOfSellers,
    created_by_name: row.createdByInfo.userName, assigned_to_name: row.assignedToInfo?.userName || "N/A",
    created_date_formatted: dayjs(row.createdDate).format('YYYY-MM-DD HH:mm:ss'),
    updated_date_formatted: row.updated_at ? dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss') : "N/A",
    updated_by_name: row.updated_by_name, updated_by_role: row.updated_by_role,
  }));
  const separator = ",";
  const csvContent = CSV_HEADERS_OFFERS_DEMANDS.join(separator) + "\n" + transformedRows.map((row) => {
    return CSV_KEYS_OFFERS_DEMANDS_EXPORT.map((k) => {
      let cell = row?.[k as keyof OfferDemandExportItem];
      if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""');
      if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell;
    }).join(separator);
  }).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename);
    link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    return true;
  }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

const transformApiOffer = (apiOffer: ActualApiOfferShape): OfferDemandItem => {
  const offerGroups: ApiGroupItem[] = [];
  let sellerItems: string[] = [];
  if (typeof apiOffer.seller_section === 'string') { try { const p = JSON.parse(apiOffer.seller_section); if (Array.isArray(p)) sellerItems = p.map(String); } catch (e) { console.warn("Failed to parse seller_section", e); }
  } else if (Array.isArray(apiOffer.seller_section)) { sellerItems = apiOffer.seller_section.map(String); }
  if (sellerItems.length > 0) offerGroups.push({ groupName: "Seller Section", items: sellerItems });

  let buyerItems: string[] = [];
  if (typeof apiOffer.buyer_section === 'string') { try { const p = JSON.parse(apiOffer.buyer_section); if (Array.isArray(p)) buyerItems = p.map(String); } catch (e) { console.warn("Failed to parse buyer_section", e); }
  } else if (Array.isArray(apiOffer.buyer_section)) { buyerItems = apiOffer.buyer_section.map(String); }
  if (buyerItems.length > 0) offerGroups.push({ groupName: "Buyer Section", items: buyerItems });
  
  if (apiOffer.groupA) offerGroups.push({ groupName: "Group A", items: [apiOffer.groupA] });
  if (apiOffer.groupB) offerGroups.push({ groupName: "Group B", items: [apiOffer.groupB] });

  return {
    id: apiOffer.generate_id, type: "Offer", name: apiOffer.name,
    createdByInfo: { userId: String(apiOffer.created_by.id), userName: apiOffer.created_by.name, email: `${apiOffer.created_by.name?.replace(/\s+/g, ".").toLowerCase()}@example.com`, },
    assignedToInfo: apiOffer.assign_user ? { userId: String(apiOffer.assign_user.id), userName: apiOffer.assign_user.name, } : undefined,
    createdDate: new Date(apiOffer.created_at), updated_at: apiOffer.updated_at ? new Date(apiOffer.updated_at) : undefined,
    numberOfBuyers: apiOffer.numberOfBuyers, numberOfSellers: apiOffer.numberOfSellers,
    groups: offerGroups.length > 0 ? offerGroups : undefined,
    updated_by_name: apiOffer.updated_by_name, updated_by_role: apiOffer.updated_by_role,
    originalApiItem: apiOffer,
  };
};

const transformApiDemand = (apiDemand: ActualApiDemandShape): OfferDemandItem => {
  const demandGroups: ApiGroupItem[] = [];
  if (apiDemand.seller_section) { const i: string[] = []; Object.values(apiDemand.seller_section).forEach(sP => { if (sP?.questions) Object.values(sP.questions).forEach(q => { if (q?.question) i.push(q.question); }); }); if (i.length > 0) demandGroups.push({ groupName: "Seller Section", items: i });}
  if (apiDemand.buyer_section) { const i: string[] = []; Object.values(apiDemand.buyer_section).forEach(sP => { if (sP?.questions) Object.values(sP.questions).forEach(q => { if (q?.question) i.push(q.question); }); }); if (i.length > 0) demandGroups.push({ groupName: "Buyer Section", items: i });}
  if (apiDemand.groupA) demandGroups.push({ groupName: "Group A", items: [apiDemand.groupA] });
  if (apiDemand.groupB) demandGroups.push({ groupName: "Group B", items: [apiDemand.groupB] });
  return {
    id: apiDemand.generate_id, type: "Demand", name: apiDemand.name,
    createdByInfo: { userId: String(apiDemand.created_by.id), userName: apiDemand.created_by.name, email: `${apiDemand.created_by.name.replace(/\s+/g, ".").toLowerCase()}@example.com`, },
    assignedToInfo: apiDemand.assign_user ? { userId: String(apiDemand.assign_user.id), userName: apiDemand.assign_user.name, } : undefined,
    createdDate: new Date(apiDemand.created_at), updated_at: apiDemand.updated_at ? new Date(apiDemand.updated_at) : undefined,
    numberOfBuyers: apiDemand.numberOfBuyers, numberOfSellers: apiDemand.numberOfSellers,
    groups: demandGroups.length > 0 ? demandGroups : undefined,
    updated_by_name: apiDemand.updated_by_name, updated_by_role: apiDemand.updated_by_role,
    originalApiItem: apiDemand,
  };
};

const ActionColumn = React.memo(({ rowData, onEdit, onDelete, onOpenModal, }: { rowData: OfferDemandItem; onEdit: () => void; onDelete: () => void; onOpenModal: (type: OfferDemandModalType, data: OfferDemandItem) => void; }) => (
    <div className="flex items-center justify-center gap-0">
      <Tooltip title="Edit / View"><div role="button" onClick={onEdit} className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"><TbPencil /></div></Tooltip>
      <Tooltip title="View Details"><div role="button" onClick={onEdit} className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"><TbEye /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add Notification</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("active", rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Mark Active</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("calendar", rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Add to Calendar</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("task", rowData)} className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign Task</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("alert", rowData)} className="flex items-center gap-2"><TbAlarm size={18} /> <span className="text-xs">View Alert</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("trackRecord", rowData)} className="flex items-center gap-2 text-green-600 hover:text-green-700"><TbCircleCheck size={18} /> <span className="text-xs">Accept</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("trackRecord", rowData)} className="flex items-center gap-2 text-red-600 hover:text-red-700"><TbCancel size={18} /> <span className="text-xs">Reject</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("engagement", rowData)} className="flex items-center gap-2"><TbUserSearch size={18} /> <span className="text-xs">Convert to Lead</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("email", rowData)} className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("whatsapp", rowData)} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send WhatsApp</span></Dropdown.Item>
        <Dropdown.Item onClick={onDelete} className="flex items-center gap-2 text-red-600 hover:text-red-700"><TbTrash size={18} /> <span className="text-xs">Delete</span></Dropdown.Item>
      </Dropdown>
    </div>
));
ActionColumn.displayName = "ActionColumn";

const ItemTable = React.memo(({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect, }: { columns: ColumnDef<OfferDemandItem>[]; data: OfferDemandItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: OfferDemandItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: OfferDemandItem) => void; onAllRowSelect: (checked: boolean, rows: Row<OfferDemandItem>[]) => void; }) => (
    <DataTable selectable columns={columns} data={data} loading={loading} pagingData={pagingData}
      checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)}
      onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort}
      onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
));
ItemTable.displayName = "ItemTable";

const ItemSearch = React.memo(React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void, initialValue?: string }>(({ onInputChange, initialValue }, ref) => (
    <DebouceInput ref={ref} placeholder="Quick Search (ID, Name, Creator)..." suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
      // DebounceInput value is internally managed; initialValue prop isn't standard for DebounceInput here
      // To set initial value, the parent would need to manage the input field itself or DebounceInput needs enhancement
    />
)));
ItemSearch.displayName = "ItemSearch";

const ItemTableTools = React.memo(({ onSearchChange, onExport, searchQuery, }: { onSearchChange: (query: string) => void; onExport: () => void; searchQuery: string; }) => (
    <div className="flex items-center w-full gap-2">
      <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} initialValue={searchQuery} /></div>
      <Button icon={<TbCloudUpload />} onClick={onExport}>Export</Button>
    </div>
));
ItemTableTools.displayName = "ItemTableTools";

const ItemActionTools = React.memo(({ onRefresh, onOpenFilter }: { onRefresh: () => void; onOpenFilter: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row gap-2">
      <Button icon={<TbRefresh />} onClick={onRefresh} title="Refresh Data">Refresh</Button>
      <Button icon={<TbFilter />} onClick={onOpenFilter} block>Filter</Button>
      <Button variant="solid" icon={<TbPlus />} onClick={() => navigate("/sales-leads/offers/create")} block>Add Offer</Button>
      <Button icon={<TbPlus />} variant="solid" onClick={() => navigate("/sales-leads/demands/create")} block>Add Demand</Button>
    </div>
  );
});
ItemActionTools.displayName = "ItemActionTools";

const ItemSelected = React.memo(({ selectedItems, onDeleteSelected, activeTab, isDeleting, }: { selectedItems: OfferDemandItem[]; onDeleteSelected: () => void; activeTab: string; isDeleting: boolean; }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  const itemType = activeTab === TABS.OFFER ? "Offer" : activeTab === TABS.DEMAND ? "Demand" : "Item";
  return ( <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2"><TbChecks className="text-lg text-primary-600 dark:text-primary-400" /><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>{itemType}{selectedItems.length > 1 ? "s" : ""} selected</span></span></span>
          <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)} loading={isDeleting}>Delete Selected</Button>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} ${itemType}${selectedItems.length > 1 ? "s" : ""}`}
        onClose={() => setDeleteOpen(false)} onRequestClose={() => setDeleteOpen(false)} onCancel={() => setDeleteOpen(false)}
        onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }} loading={isDeleting}
      ><p>Are you sure you want to delete the selected {itemType.toLowerCase()}{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p></ConfirmDialog>
  </>);
});
ItemSelected.displayName = "ItemSelected";


const OffersDemands = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const offersStoreData = useSelector(masterSelector).Offers; 
  const demandsStoreData = useSelector(masterSelector).Demands; 
  const offersStatus = useSelector(masterSelector).offersStatus;
  const demandsStatus = useSelector(masterSelector).demandsStatus;
  const offersError = useSelector(masterSelector).offersError;
  const demandsError = useSelector(masterSelector).demandsError;

  console.log("offersStoreData",offersStoreData);
  
  const [currentTab, setCurrentTab] = useState<string>(TABS.OFFER);
  const initialTableQueries: TableQueries = { pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" };
  const [offerTableConfig, setOfferTableConfig] = useState<TableQueries>(initialTableQueries);
  const [demandTableConfig, setDemandTableConfig] = useState<TableQueries>(initialTableQueries);
  const [allTableConfig, setAllTableConfig] = useState<TableQueries>(initialTableQueries);

  const [selectedOffers, setSelectedOffers] = useState<OfferDemandItem[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<OfferDemandItem[]>([]);
  const [selectedAll, setSelectedAll] = useState<OfferDemandItem[]>([]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDeleteConfirm, setItemToDeleteConfirm] = useState<OfferDemandItem | null>(null);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [dataForExportLoading, setDataForExportLoading] = useState(false);

  const [modalState, setModalState] = useState<OfferDemandModalState>({ isOpen: false, type: null, data: null });
  const handleOpenModal = (type: OfferDemandModalType, itemData: OfferDemandItem) => setModalState({ isOpen: true, type, data: itemData });
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(filterFormSchema.parse({}));
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

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

  const prepareApiParams = useCallback((tableConfig: TableQueries, filters: FilterFormData, forExport: boolean = false) => {
    const params: any = {
      search: tableConfig.query,
    };

    if (forExport) {
        params.fetch_all = true; // Or use a very large per_page if fetch_all is not supported
    } else {
        params.page = tableConfig.pageIndex;
        params.per_page = tableConfig.pageSize; // Use per_page
        if (tableConfig.sort.key && tableConfig.sort.order) {
            params.sortBy = tableConfig.sort.key; // Ensure these match backend (e.g., created_at)
            params.sortOrder = tableConfig.sort.order;
        }
    }
    
    if (filters.createdDateRange?.[0]) params.created_from = dayjs(filters.createdDateRange[0]).format('YYYY-MM-DD');
    if (filters.createdDateRange?.[1]) params.created_to = dayjs(filters.createdDateRange[1]).format('YYYY-MM-DD');
    if (filters.updatedDateRange?.[0]) params.updated_from = dayjs(filters.updatedDateRange[0]).format('YYYY-MM-DD');
    if (filters.updatedDateRange?.[1]) params.updated_to = dayjs(filters.updatedDateRange[1]).format('YYYY-MM-DD');
    
    // Send as comma-separated strings
    if (filters.creatorIds?.length) params.created_by = filters.creatorIds.join(','); 
    if (filters.assigneeIds?.length) params.assign_user = filters.assigneeIds.join(','); 
    
    // Item type filter is mainly for TABS.ALL. For specific tabs, it's implicit.
    // If backend supports type filter even on specific endpoints, you can add it:
    // if (filters.itemType) params.item_type = filters.itemType;
    
    return params;
  }, []);


  const fetchData = useCallback(() => {
    const params = prepareApiParams(currentTableConfig, filterCriteria);

    if (currentTab === TABS.OFFER || (currentTab === TABS.ALL && (!filterCriteria.itemType || filterCriteria.itemType === "Offer"))) {
      dispatch(getOffersAction(params));
    }
    if (currentTab === TABS.DEMAND || (currentTab === TABS.ALL && (!filterCriteria.itemType || filterCriteria.itemType === "Demand"))) {
      dispatch(getDemandsAction(params));
    }
  }, [dispatch, currentTab, currentTableConfig, filterCriteria, prepareApiParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); 

  useEffect(() => { if (offersStatus === "failed" && offersError) toast.push(<Notification title="Error Fetching Offers" type="danger">{String(offersError)}</Notification>); }, [offersStatus, offersError]);
  useEffect(() => { if (demandsStatus === "failed" && demandsError) toast.push(<Notification title="Error Fetching Demands" type="danger">{String(demandsError)}</Notification>); }, [demandsStatus, demandsError]);

  const { pageData, totalItems } = useMemo(() => {
    let itemsToDisplay: OfferDemandItem[] = [];
    let currentTotal = 0;

    const safeOffersItems = Array.isArray(offersStoreData?.data) ? offersStoreData.data : []; // Assuming API response is data.data
    const safeDemandsItems = Array.isArray(demandsStoreData?.data) ? demandsStoreData.data : [];
    const safeOffersTotal = typeof offersStoreData?.total === 'number' ? offersStoreData.total : 0; // API total
    const safeDemandsTotal = typeof demandsStoreData?.total === 'number' ? demandsStoreData.total : 0;

    if (currentTab === TABS.OFFER) {
      itemsToDisplay = safeOffersItems.map(transformApiOffer);
      currentTotal = safeOffersTotal;
    } else if (currentTab === TABS.DEMAND) {
      itemsToDisplay = safeDemandsItems.map(transformApiDemand);
      currentTotal = safeDemandsTotal;
    } else { // TABS.ALL
      let combined = [];
      if (!filterCriteria.itemType || filterCriteria.itemType === "Offer") { combined.push(...safeOffersItems.map(transformApiOffer)); }
      if (!filterCriteria.itemType || filterCriteria.itemType === "Demand") { combined.push(...safeDemandsItems.map(transformApiDemand)); }
      
      itemsToDisplay = combined;
      if (filterCriteria.itemType === "Offer") currentTotal = safeOffersTotal;
      else if (filterCriteria.itemType === "Demand") currentTotal = safeDemandsTotal;
      else currentTotal = safeOffersTotal + safeDemandsTotal; // This sum is an approximation if pages are fetched separately

      // Client-side sort for ALL tab if sort key is present, as server sorts per type
      const { order, key } = allTableConfig.sort as OnSortParam;
        if (order && key && itemsToDisplay.length > 0) {
            itemsToDisplay.sort((a, b) => {
                let aValue: any, bValue: any;
                if (key === "createdDate" || key === "updated_at") { const dA = a[key] ? new Date(a[key]!).getTime():0; const dB = b[key] ? new Date(b[key]!).getTime():0; return order === "asc" ? dA - dB : dB - dA; } 
                else if (key === "name" || key === "id") { aValue = a[key]; bValue = b[key]; } 
                else if (key === "createdBy") { aValue = a.createdByInfo.userName; bValue = b.createdByInfo.userName; } 
                else { aValue = (a as any)[key]; bValue = (b as any)[key]; }
                if (aValue === null || aValue === undefined) aValue = ""; if (bValue === null || bValue === undefined) bValue = "";
                if (typeof aValue === "string" && typeof bValue === "string") return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                if (typeof aValue === "number" && typeof bValue === "number") return order === "asc" ? aValue - bValue : bValue - aValue;
                return 0;
            });
        }
    }
    return { pageData: itemsToDisplay, totalItems: currentTotal };
  }, [offersStoreData, demandsStoreData, currentTab, filterCriteria.itemType, allTableConfig.sort]);

  const handleSetTableConfig = useCallback((data: Partial<TableQueries>) => { setCurrentTableConfig((prev) => ({ ...prev, ...data, pageIndex: data.pageIndex !== undefined ? data.pageIndex : 1 })); }, [setCurrentTableConfig]);
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); handleSetTableConfig({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableConfig, closeFilterDrawer]);
  const onClearFilters = useCallback(() => { const d = filterFormSchema.parse({}); filterFormMethods.reset(d); setFilterCriteria(d); handleSetTableConfig({ pageIndex: 1, query: currentTableConfig.query }); closeFilterDrawer(); }, [filterFormMethods, handleSetTableConfig, closeFilterDrawer, currentTableConfig.query]);

  const handlePaginationChange = useCallback((page: number) => handleSetTableConfig({ pageIndex: page }), [handleSetTableConfig]);
  const handlePageSizeChange = useCallback((value: number) => { handleSetTableConfig({ pageSize: value, pageIndex: 1 }); setCurrentSelectedItems([]); }, [handleSetTableConfig, setCurrentSelectedItems]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableConfig({ sort, pageIndex: 1 }), [handleSetTableConfig]);
  const handleSearchChange = useCallback((query: string) => handleSetTableConfig({ query, pageIndex: 1 }), [handleSetTableConfig]);
  
  const handleRowSelect = useCallback((checked: boolean, row: OfferDemandItem) => { setCurrentSelectedItems((prev) => checked ? (prev.some(i => i.id === row.id) ? prev : [...prev, row]) : prev.filter((i) => i.id !== row.id)); }, [setCurrentSelectedItems]);
  const handleAllRowSelect = useCallback((checked: boolean, currentTableRows: Row<OfferDemandItem>[]) => {
    const cVIds = new Set(currentTableRows.map((r) => r.original.id));
    if (checked) { setCurrentSelectedItems((prev) => { const nI = currentTableRows.map((r) => r.original).filter(i => !prev.some(pI => pI.id === i.id)); return [...prev, ...nI]; });
    } else { setCurrentSelectedItems((prev) => prev.filter(i => !cVIds.has(i.id))); }
  },[setCurrentSelectedItems]);

  const handleEdit = useCallback((item: OfferDemandItem) => { const bP = item.type === "Offer" ? "offers" : "demands"; navigate(`/sales-leads/${bP}/edit/${(item.originalApiItem as ActualApiOfferShape | ActualApiDemandShape).id}`); }, [navigate]);
  const handleDeleteClick = useCallback((item: OfferDemandItem) => setItemToDeleteConfirm(item), []);

  const onConfirmDelete = useCallback(async () => {
    if (!itemToDeleteConfirm) return; setIsDeleting(true);
    try {
      const { originalApiItem, type, name } = itemToDeleteConfirm; const idTD = (originalApiItem as ActualApiOfferShape | ActualApiDemandShape).id;
      if (type === "Offer") await dispatch(deleteOfferAction(idTD)).unwrap(); else if (type === "Demand") await dispatch(deleteDemandAction(idTD)).unwrap();
      toast.push(<Notification title="Deleted" type="success">{`${name} deleted.`}</Notification>); fetchData(); setCurrentSelectedItems((prev) => prev.filter((i) => i.id !== itemToDeleteConfirm.id));
    } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{e?.message || `Failed to delete.`}</Notification>); } 
    finally { setIsDeleting(false); setItemToDeleteConfirm(null); }
  }, [dispatch, itemToDeleteConfirm, fetchData, setCurrentSelectedItems]);

  const handleDeleteSelected = useCallback(async () => {
    if (currentSelectedItems.length === 0) return; setIsDeleting(true);
    const offersToDel = currentSelectedItems.filter(i => i.type === "Offer").map(i => Number((i.originalApiItem as ActualApiOfferShape).id));
    const demandsToDel = currentSelectedItems.filter(i => i.type === "Demand").map(i => Number((i.originalApiItem as ActualApiDemandShape).id));
    const delPromises: Promise<any>[] = [];
    if (offersToDel.length > 0) delPromises.push(dispatch(deleteAllOffersAction(offersToDel)).unwrap()); 
    if (demandsToDel.length > 0) delPromises.push(dispatch(deleteAllDemandsAction(demandsToDel)).unwrap());
    try { await Promise.all(delPromises); toast.push(<Notification title="Bulk Delete OK" type="success">{`${currentSelectedItems.length} items deleted.`}</Notification>); fetchData(); setCurrentSelectedItems([]); } 
    catch (e: any) { toast.push(<Notification title="Bulk Delete Failed" type="danger">{e?.message || "Error."}</Notification>); } 
    finally { setIsDeleting(false); }
  }, [dispatch, currentSelectedItems, fetchData, setCurrentSelectedItems]);

  const handleTabChange = useCallback((tabKey: string) => {
    if (tabKey === currentTab) return; setCurrentTab(tabKey);
    const d = filterFormSchema.parse({}); filterFormMethods.reset(d); setFilterCriteria(d); setCurrentSelectedItems([]);
    if (tabKey === TABS.ALL) setAllTableConfig(initialTableQueries); else if (tabKey === TABS.OFFER) setOfferTableConfig(initialTableQueries); else if (tabKey === TABS.DEMAND) setDemandTableConfig(initialTableQueries);
  }, [currentTab, filterFormMethods, setCurrentSelectedItems]);

  const handleOpenExportReasonModal = useCallback(async () => {
    const totalO = offersStoreData?.total ?? 0; const totalD = demandsStoreData?.total ?? 0;
    let exportable = false;
    if (currentTab === TABS.OFFER) exportable = totalO > 0; else if (currentTab === TABS.DEMAND) exportable = totalD > 0; else exportable = (totalO + totalD) > 0;
    if (!exportable && !(filterCriteria.creatorIds?.length || filterCriteria.assigneeIds?.length || filterCriteria.createdDateRange?.[0] || filterCriteria.updatedDateRange?.[0] || currentTableConfig.query)) { // Check if filters might yield results
        toast.push(<Notification title="No Data" type="info">Nothing to export based on current view.</Notification>); return;
    }
    exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true);
  }, [offersStoreData, demandsStoreData, currentTab, exportReasonFormMethods, filterCriteria, currentTableConfig.query]);

  const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true); setDataForExportLoading(true);
    const moduleName = "Offers & Demands"; const date = dayjs().format('YYYYMMDD'); const filename = `offers_demands_export_${date}.csv`;
    try { await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: filename })).unwrap(); } 
    catch (e) { /* Optional: log reason submission error */ }

    const exportParams = prepareApiParams(currentTableConfig, filterCriteria, true); // true for export

    let allOffersForExport: ActualApiOfferShape[] = []; let allDemandsForExport: ActualApiDemandShape[] = [];
    try {
        if (currentTab === TABS.OFFER || (currentTab === TABS.ALL && (!filterCriteria.itemType || filterCriteria.itemType === "Offer"))) {
            const offerRes = await dispatch(getOffersAction(exportParams)).unwrap(); allOffersForExport = offerRes?.data || []; // Assuming data.data
        }
        if (currentTab === TABS.DEMAND || (currentTab === TABS.ALL && (!filterCriteria.itemType || filterCriteria.itemType === "Demand"))) {
            const demandRes = await dispatch(getDemandsAction(exportParams)).unwrap(); allDemandsForExport = demandRes?.data || []; // Assuming data.data
        }
        const transformedO = allOffersForExport.map(transformApiOffer); const transformedD = allDemandsForExport.map(transformApiDemand);
        let dataToExport: OfferDemandItem[] = [];
        if (currentTab === TABS.OFFER) dataToExport = transformedO; else if (currentTab === TABS.DEMAND) dataToExport = transformedD;
        else { if (!filterCriteria.itemType || filterCriteria.itemType === "Offer") dataToExport.push(...transformedO); if (!filterCriteria.itemType || filterCriteria.itemType === "Demand") dataToExport.push(...transformedD); }
        
        const success = exportToCsvOffersDemands(filename, dataToExport);
        if (success) toast.push(<Notification title="Export OK" type="success">Data exported.</Notification>);
    } catch (err) { toast.push(<Notification title="Export Failed" type="danger">Could not fetch all data.</Notification>); } 
    finally { setIsSubmittingExportReason(false); setIsExportReasonModalOpen(false); setDataForExportLoading(false); fetchData(); }
  }, [dispatch, filterCriteria, currentTableConfig, currentTab, fetchData, prepareApiParams]);

  const columns: ColumnDef<OfferDemandItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", enableSorting: true, size: 70, cell: (props: CellContext<OfferDemandItem, any>) => (<span className="font-mono text-xs">{props.getValue<string>()}</span>), },
    { header: "Name", accessorKey: "name", enableSorting: true, size: 180, cell: (props: CellContext<OfferDemandItem, any>) => (<div><div className="font-semibold">{props.row.original.name}</div>{(props.row.original.numberOfBuyers !== undefined || props.row.original.numberOfSellers !== undefined) && (<><div className="text-xs text-gray-600 dark:text-gray-300">Buyers: {props.row.original.numberOfBuyers ?? "N/A"}</div><div className="text-xs text-gray-600 dark:text-gray-300">Sellers: {props.row.original.numberOfSellers ?? "N/A"}</div></>)}</div>), },
    { header: "Section Details", id: "sectionDetails", size: 220, cell: ({ row }: CellContext<OfferDemandItem, any>) => { const { groups } = row.original; if (!groups || groups.length === 0) return (<span className="text-xs text-gray-500">No group details</span>); return (<div className="space-y-1">{groups.map((group, index) => (<div key={index} className="text-xs"><b className="text-gray-700 dark:text-gray-200">{group.groupName}: </b><div className="pl-2 flex flex-col gap-0.5 text-gray-600 dark:text-gray-400">{group.items.slice(0, 3).map((item, itemIdx) => (<span key={itemIdx}>{item}</span>))}{group.items.length > 3 && (<span className="italic">...and {group.items.length - 3} more</span>)}</div></div>))}</div>); }, },
    { header: "Created By / Assigned", accessorKey: "createdByInfo.userName", id: "createdBy", enableSorting: true, size: 180, cell: (props: CellContext<OfferDemandItem, any>) => { const item = props.row.original; const fCD = dayjs(item.createdDate).format('D MMM YYYY, h:mm A'); return (<div className="flex flex-col gap-1"><div className="flex items-center gap-2"><Avatar size={28} shape="circle" icon={<TbUserCircle />} /><span className="font-semibold">{item.createdByInfo.userName}</span></div>{item.assignedToInfo && (<div className="text-xs text-gray-600 dark:text-gray-300"><b>Assigned: </b> {item.assignedToInfo.userName}</div>)}<div className="text-xs text-gray-500 dark:text-gray-400"><span>{fCD}</span></div></div>); }, },
    { header: "Updated Info", accessorKey: "updated_at", id: "updatedInfo", enableSorting: true, size: 120, cell: (props) => { const { updated_at, updated_by_name, updated_by_role } = props.row.original; const fD = updated_at ? dayjs(updated_at).format('D MMM YYYY, h:mm A') : "N/A"; return (<div className="text-xs"><span>{updated_by_name || "N/A"}{updated_by_role && (<><br /><b>{updated_by_role}</b></>)}</span> <br /><span>{fD}</span></div>); }, },
    { header: "Actions", id: "action", meta: { HeaderClass: "text-center" }, size: 120, cell: (props: CellContext<OfferDemandItem, any>) => (<ActionColumn rowData={props.row.original} onEdit={() => handleEdit(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onOpenModal={handleOpenModal} />), },
  ], [handleEdit, handleDeleteClick, handleOpenModal]);

  const isLoadingO = offersStatus === 'loading' || offersStatus === 'idle'; const isLoadingD = demandsStatus === 'loading' || demandsStatus === 'idle';
  let isOverallLoading = false;
  if (currentTab === TABS.OFFER) isOverallLoading = isLoadingO; else if (currentTab === TABS.DEMAND) isOverallLoading = isLoadingD; else isOverallLoading = isLoadingO || isLoadingD;

  const allApiUsersForFilterDropdown = useMemo(() => {
    const users = new Map<string, string>();
    const safeOItems = Array.isArray(offersStoreData?.data) ? offersStoreData.data : [];
    const safeDItems = Array.isArray(demandsStoreData?.data) ? demandsStoreData.data : [];
    
    // This assumes offersStoreData.data items are ActualApiOfferShape-like
    safeOItems.forEach((o: ActualApiOfferShape) => {
        if (o.created_by) users.set(String(o.created_by.id), o.created_by.name);
        if (o.assign_user) users.set(String(o.assign_user.id), o.assign_user.name);
        // Add updated_by users if available and relevant for filtering
    });
    safeDItems.forEach((d: ActualApiDemandShape) => {
        if (d.created_by) users.set(String(d.created_by.id), d.created_by.name);
        if (d.assign_user) users.set(String(d.assign_user.id), d.assign_user.name);
    });
    return Array.from(users.entries()).map(([value, label]) => ({ value, label }));
  }, [offersStoreData, demandsStoreData]);

  const itemTypeOptions = [{ value: "Offer" as const, label: "Offer" }, { value: "Demand" as const, label: "Demand" }];

  if ((isOverallLoading || dataForExportLoading) && pageData.length === 0 && !currentTableConfig.query && Object.values(filterCriteria).every(v => !v || (Array.isArray(v) && v.length === 0))) {
    return (<Container className="h-full"><div className="h-full flex flex-col items-center justify-center"><Spinner size="xl" /><p className="mt-2">{dataForExportLoading ? 'Preparing export...' : 'Loading Data...'}</p></div></Container>);
  }

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4"><h5 className="mb-4 lg:mb-0">Offers & Demands</h5><ItemActionTools onRefresh={() => fetchData()} onOpenFilter={openFilterDrawer} /></div>
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700"><nav className="-mb-px flex space-x-8" aria-label="Tabs">{[TABS.ALL, TABS.OFFER, TABS.DEMAND].map((tabKey) => (<button key={tabKey} onClick={() => handleTabChange(tabKey)} className={classNames("whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize", currentTab === tabKey ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600")}>{tabKey === TABS.ALL ? "All Items" : `${tabKey} Listing`}</button>))}</nav></div>
          <div className="mb-4"><ItemTableTools onSearchChange={handleSearchChange} onExport={handleOpenExportReasonModal} searchQuery={currentTableConfig.query}/></div>
          <div className="flex-grow overflow-auto">
            <ItemTable columns={columns} data={pageData} loading={isOverallLoading || dataForExportLoading}
              pagingData={{ total: totalItems, pageIndex: currentTableConfig.pageIndex as number, pageSize: currentTableConfig.pageSize as number }}
              selectedItems={currentSelectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange}
              onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
        <ItemSelected selectedItems={currentSelectedItems} onDeleteSelected={handleDeleteSelected} activeTab={currentTab} isDeleting={isDeleting} />
        <ConfirmDialog isOpen={!!itemToDeleteConfirm} type="danger" title={`Delete ${itemToDeleteConfirm?.type || "Item"}`}
          onClose={() => setItemToDeleteConfirm(null)} onRequestClose={() => setItemToDeleteConfirm(null)} onCancel={() => setItemToDeleteConfirm(null)}
          onConfirm={onConfirmDelete} loading={isDeleting}
        ><p>Delete "<strong>{itemToDeleteConfirm?.name}</strong>"? Cannot be undone.</p></ConfirmDialog>
      </Container>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason || dataForExportLoading}
        confirmText={isSubmittingExportReason ? "Submitting..." : (dataForExportLoading ? "Fetching..." : "Submit & Export")} cancelText="Cancel"
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason || dataForExportLoading }}
      ><Form id="exportReasonForm" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 mt-2"><FormItem label="Reason for exporting:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3}/>)} /></FormItem></Form></ConfirmDialog>
      <Drawer title="Filter Options" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="flex justify-end gap-2 w-full"><Button size="sm" onClick={onClearFilters}>Clear All</Button><Button size="sm" variant="solid" form="filterForm" type="submit">Apply</Button></div>}>
        <Form id="filterForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-y-6 p-4 h-full overflow-y-auto">
            <FormItem label="Type"><Controller name="itemType" control={filterFormMethods.control} render={({ field }) => (<Select placeholder="Offer/Demand" options={itemTypeOptions} value={itemTypeOptions.find(opt => opt.value === field.value)} onChange={(option) => field.onChange(option?.value || null)} isClearable />)}/></FormItem>
            <FormItem label="Created Date"><Controller name="createdDateRange" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange value={field.value as any} onChange={field.onChange} placeholder="Start - End" inputFormat="DD MMM YYYY" />)}/></FormItem>
            <FormItem label="Updated Date"><Controller name="updatedDateRange" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange value={field.value as any} onChange={field.onChange} placeholder="Start - End" inputFormat="DD MMM YYYY" />)}/></FormItem>
            <FormItem label="Creator"><Controller name="creatorIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Creator(s)" options={allApiUsersForFilterDropdown} value={allApiUsersForFilterDropdown.filter(opt => field.value?.includes(opt.value))} onChange={(options) => field.onChange(options?.map(opt => opt.value) || [])} />)}/></FormItem>
            <FormItem label="Assignee"><Controller name="assigneeIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Assignee(s)" options={allApiUsersForFilterDropdown} value={allApiUsersForFilterDropdown.filter(opt => field.value?.includes(opt.value))} onChange={(options) => field.onChange(options?.map(opt => opt.value) || [])} />)}/></FormItem>
        </Form>
    </Drawer>
      <OfferDemandModals modalState={modalState} onClose={handleCloseModal} />
    </>
  );
};

export default OffersDemands;