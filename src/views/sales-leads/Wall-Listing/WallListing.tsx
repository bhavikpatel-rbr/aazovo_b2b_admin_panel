// src/views/your-path/WallListing.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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
  Card,
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Select from "@/components/ui/Select";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbAlarm,
  TbAlertTriangle,
  TbBell,
  TbBookmark,
  TbBox,
  TbBoxOff,
  TbBrandWhatsapp,
  TbBulb,
  TbCalendar,
  TbCalendarEvent,
  TbCancel,
  TbChecks,
  TbCircleCheck,
  TbCloudDownload,
  TbCloudUpload,
  TbColumns,
  TbCopy,
  TbCurrencyDollar,
  TbEye,
  TbFilter,
  TbListDetails,
  TbMail,
  TbMessageCircle,
  TbPackageExport,
  TbPencil,
  TbPhoto,
  TbPlus,
  TbProgress,
  TbReload,
  TbSearch,
  TbShare,
  TbStack2,
  TbTagStarred,
  TbUser,
  TbX,
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  CellContext,
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addNotificationAction,
  addScheduleAction,
  deleteAllWallAction,
  getAllCompany,
  getAllUsersAction,
  getBrandAction,
  getCategoriesData,
  getEmployeesAction,
  getMemberTypeAction,
  getProductsDataAsync,
  getProductSpecificationsAction,
  getSubcategoriesByCategoryIdAction,
  getWallListingAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import { z } from "zod";

// --- Type Definitions ---
export type ApiWallItemFromSource = any;

export type WallRecordStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Expired"
  | "Fulfilled"
  | "Active"
  | string;
export type WallIntent = "Buy" | "Sell" | "Exchange";
export type WallProductCondition = "New" | "Used" | "Refurbished" | string;

export type WallItem = {
  id: number;
  product_name: string;
  company_name: string;
  companyId?: string;
  member_name: string;
  memberId?: string;
  member_email: string;
  member_phone: string;
  product_category: string;
  productCategoryId?: number;
  product_subcategory: string;
  subCategoryId?: number;
  product_description: string;
  product_specs: string;
  product_status: string;
  quantity: number;
  price: number;
  want_to: WallIntent | string;
  listing_type: string;
  shipping_options: string;
  payment_method: string;
  warranty: string;
  return_policy: string;
  listing_url: string;
  brand: string;
  brandId?: number;
  product_images: string[];
  created_date: Date;
  updated_at: Date;
  visibility: string;
  priority: string;
  assigned_to: string;
  interaction_type: string;
  action: string;
  recordStatus?: WallRecordStatus;
  cartoonTypeId?: number | null;
  deviceCondition?: WallProductCondition | null;
  inquiry_count: number;
  share_count: number;
  is_bookmarked: boolean;
  updated_by_name?: string;
  updated_by_role?: string;
  productId?: number;
  productSpecId?: number;
  memberTypeId?: number;
  createdById?: number;
  member?: any;
};

// --- Zod Schemas ---
const selectOptionSchema = z.object({ value: z.any(), label: z.string() });
const filterFormSchema = z.object({
  filterRecordStatuses: z.array(selectOptionSchema).optional().default([]),
  filterProductIds: z.array(selectOptionSchema).optional().default([]),
  filterCompanyIds: z.array(selectOptionSchema).optional().default([]),
  filterIntents: z.array(selectOptionSchema).optional().default([]),
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
  categories: z.array(selectOptionSchema).optional().default([]),
  subcategories: z.array(selectOptionSchema).optional().default([]),
  brands: z.array(selectOptionSchema).optional().default([]),
  productStatus: z.array(selectOptionSchema).optional().default([]),
  source: z.array(selectOptionSchema).optional().default([]),
  productSpec: z.array(selectOptionSchema).optional().default([]),
  memberType: z.array(selectOptionSchema).optional().default([]),
  createdBy: z.array(selectOptionSchema).optional().default([]),
  quickFilters: z.object({ type: z.string(), value: z.string() }).nullable().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// Zod Schema for Schedule Form
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;


// --- Status Colors and Options ---
const recordStatusColor: Record<WallRecordStatus, string> = {
  Pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100",
  Approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  Expired: "bg-gray-100 text-gray-700 dark:bg-gray-600/20 dark:text-gray-100",
  Fulfilled: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100",
  Active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
};
const recordStatusOptions = Object.keys(recordStatusColor).map((s) => ({
  value: s,
  label: s,
}));

const intentTagColor: Record<WallIntent, string> = {
  Sell: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Buy: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100",
  Exchange:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
};
const intentOptions: { value: WallIntent; label: string }[] = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
  { value: "Exchange", label: "Exchange" },
];

const productApiStatusColor: Record<string, string> = {
  available:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-100",
  "low stock":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100",
  "out of stock":
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  discontinued: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  "non-active":
    "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-100",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-100",
};

export const dummyCartoonTypes = [{ id: 1, name: "Master Carton" }, { id: 2, name: "Inner Carton" }];

// ============================================================================
// --- MODALS SECTION ---
// ============================================================================
export type WallModalType = "email" | "whatsapp" | "notification" | "task" | "active" | "calendar" | "alert" | "share";
export interface WallModalState { isOpen: boolean; type: WallModalType | null; data: WallItem | null; }
interface WallModalsProps { modalState: WallModalState; onClose: () => void; getAllUserDataOptions: { value: any, label: string }[]; }

const dummyUsers = [{ value: "user1", label: "Alice Johnson" }, { value: "user2", label: "Bob Williams" }, { value: "user3", label: "Charlie Brown" },];
const priorityOptions = [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" },];
const eventTypeOptions = [
  // Customer Engagement & Sales
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Demo', label: 'Product Demo' },
  { value: 'IntroCall', label: 'Introductory Call' },
  { value: 'FollowUpCall', label: 'Follow-up Call' },
  { value: 'QBR', label: 'Quarterly Business Review (QBR)' },
  { value: 'CheckIn', label: 'Customer Check-in' },
  { value: 'LogEmail', label: 'Log an Email' },

  // Project & Task Management
  { value: 'Milestone', label: 'Project Milestone' },
  { value: 'Task', label: 'Task' },
  { value: 'FollowUp', label: 'General Follow-up' },
  { value: 'ProjectKickoff', label: 'Project Kick-off' },

  // Customer Onboarding & Support
  { value: 'OnboardingSession', label: 'Onboarding Session' },
  { value: 'Training', label: 'Training Session' },
  { value: 'SupportCall', label: 'Support Call' },

  // General & Administrative
  { value: 'Reminder', label: 'Reminder' },
  { value: 'Note', label: 'Add a Note' },
  { value: 'FocusTime', label: 'Focus Time (Do Not Disturb)' },
  { value: 'StrategySession', label: 'Strategy Session' },
  { value: 'TeamMeeting', label: 'Team Meeting' },
  { value: 'PerformanceReview', label: 'Performance Review' },
  { value: 'Lunch', label: 'Lunch / Break' },
  { value: 'Appointment', label: 'Personal Appointment' },
  { value: 'Other', label: 'Other' },
  { value: 'ProjectKickoff', label: 'Project Kick-off' },
  { value: 'InternalSync', label: 'Internal Team Sync' },
  { value: 'ClientUpdateMeeting', label: 'Client Update Meeting' },
  { value: 'RequirementsGathering', label: 'Requirements Gathering' },
  { value: 'UAT', label: 'User Acceptance Testing (UAT)' },
  { value: 'GoLive', label: 'Go-Live / Deployment Date' },
  { value: 'ProjectSignOff', label: 'Project Sign-off' },
  { value: 'PrepareReport', label: 'Prepare Report' },
  { value: 'PresentFindings', label: 'Present Findings' },
  { value: 'TroubleshootingCall', label: 'Troubleshooting Call' },
  { value: 'BugReplication', label: 'Bug Replication Session' },
  { value: 'IssueEscalation', label: 'Escalate Issue' },
  { value: 'ProvideUpdate', label: 'Provide Update on Ticket' },
  { value: 'FeatureRequest', label: 'Log Feature Request' },
  { value: 'IntegrationSupport', label: 'Integration Support Call' },
  { value: 'DataMigration', label: 'Data Migration/Import Task' },
  { value: 'ColdCall', label: 'Cold Call' },
  { value: 'DiscoveryCall', label: 'Discovery Call' },
  { value: 'QualificationCall', label: 'Qualification Call' },
  { value: 'SendFollowUpEmail', label: 'Send Follow-up Email' },
  { value: 'LinkedInMessage', label: 'Log LinkedIn Message' },
  { value: 'ProposalReview', label: 'Proposal Review Meeting' },
  { value: 'ContractSent', label: 'Contract Sent' },
  { value: 'NegotiationCall', label: 'Negotiation Call' },
  { value: 'TrialSetup', label: 'Product Trial Setup' },
  { value: 'TrialCheckIn', label: 'Trial Check-in Call' },
  { value: 'WelcomeCall', label: 'Welcome Call' },
  { value: 'ImplementationSession', label: 'Implementation Session' },
  { value: 'UserTraining', label: 'User Training Session' },
  { value: 'AdminTraining', label: 'Admin Training Session' },
  { value: 'MonthlyCheckIn', label: 'Monthly Check-in' },
  { value: 'QBR', label: 'Quarterly Business Review (QBR)' },
  { value: 'HealthCheck', label: 'Customer Health Check' },
  { value: 'FeedbackSession', label: 'Feedback Session' },
  { value: 'RenewalDiscussion', label: 'Renewal Discussion' },
  { value: 'UpsellOpportunity', label: 'Upsell/Cross-sell Call' },
  { value: 'CaseStudyInterview', label: 'Case Study Interview' },
  { value: 'InvoiceDue', label: 'Invoice Due' },
  { value: 'SendInvoice', label: 'Send Invoice' },
  { value: 'PaymentReminder', label: 'Send Payment Reminder' },
  { value: 'ChaseOverduePayment', label: 'Chase Overdue Payment' },
  { value: 'ConfirmPayment', label: 'Confirm Payment Received' },
  { value: 'ContractRenewalDue', label: 'Contract Renewal Due' },
  { value: 'DiscussBilling', label: 'Discuss Billing/Invoice' },
  { value: 'SendQuote', label: 'Send Quote/Estimate' },
]
const dummyAlerts = [{ id: 1, severity: "warning", message: "Listing will expire in 3 days.", time: "4 days ago", }, { id: 2, severity: "info", message: "New inquiry received from John Doe.", time: "2 hours ago", },];

const SendEmailDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { subject: "", message: "" }, });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true);
    console.log("Sending email to", wallItem.member_email, "with data:", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Email Sent Successfully" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send Email to {wallItem.member_name}</h5>
      <form onSubmit={handleSubmit(onSendEmail)}>
        <FormItem label="Subject"><Controller name="subject" control={control} render={({ field }) => (<Input {...field} placeholder={`Regarding: ${wallItem.product_name}`} />)} /></FormItem>
        <FormItem label="Message"><Controller name="message" control={control} render={({ field }) => (<RichTextEditor value={field.value} onChange={field.onChange} />)} /></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Send</Button></div>
      </form>
    </Dialog>
  );
};
const SendWhatsAppDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const { control, handleSubmit } = useForm({ defaultValues: { message: `Hi ${wallItem.member_name}, I'm interested in your listing for "${wallItem.product_name}".`, }, });
  const onSendMessage = (data: { message: string }) => {
    const phone = wallItem.member_phone?.replace(/\D/g, "");
    if (!phone) { toast.push(<Notification type="danger" title="Invalid Phone Number" />); return; }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`;
    window.open(url, "_blank");
    toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
    onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send WhatsApp to {wallItem.member_name}</h5>
      <form onSubmit={handleSubmit(onSendMessage)}>
        <FormItem label="Message Template"><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit">Open WhatsApp</Button></div>
      </form>
    </Dialog>
  );
};
const AddNotificationDialog: React.FC<{ wallItem: WallItem; onClose: () => void; getAllUserDataOptions: { value: any, label: string }[]; }> = ({ wallItem, onClose, getAllUserDataOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const notificationSchema = z.object({ notification_title: z.string().min(3, "Title must be at least 3 characters long."), send_users: z.array(z.number()).min(1, "Please select at least one user."), message: z.string().min(10, "Message must be at least 10 characters long."), });
  type NotificationFormData = z.infer<typeof notificationSchema>;
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(notificationSchema), defaultValues: { notification_title: `Regarding Wall Listing: ${wallItem.product_name}`, send_users: [], message: `This is a notification for the wall listing: "${wallItem.product_name}".` }, mode: 'onChange' });
  const onSend = async (formData: NotificationFormData) => {
    setIsLoading(true);
    const payload = { send_users: formData.send_users, notification_title: formData.notification_title, message: formData.message, module_id: String(wallItem.id), module_name: 'WallListing', };
    try {
      await dispatch(addNotificationAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Notification Sent Successfully!" />);
      onClose();
    } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsLoading(false); }
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for "{wallItem.product_name}"</h5>
      <Form onSubmit={handleSubmit(onSend)}>
        <FormItem label="Notification Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
        <FormItem label="Send to Users" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select Users" options={getAllUserDataOptions} value={getAllUserDataOptions.filter(o => field.value?.includes(o.value))} onChange={(options: any) => field.onChange(options?.map((o: any) => o.value) || [])} />)} /></FormItem>
        <FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={3} />} /></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button></div>
      </Form>
    </Dialog>
  );
};
const AssignTaskDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { title: "", assignee: null, dueDate: null, priority: null, description: "", }, });
  const onAssignTask = (data: any) => {
    setIsLoading(true);
    console.log("Assigning task for", wallItem.product_name, "with data:", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Task Assigned" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for "{wallItem.product_name}"</h5>
      <form onSubmit={handleSubmit(onAssignTask)}>
        <FormItem label="Task Title"><Controller name="title" control={control} render={({ field }) => (<Input {...field} placeholder="e.g., Follow up on listing" />)} /></FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Assign To"><Controller name="assignee" control={control} render={({ field }) => (<Select placeholder="Select User" options={dummyUsers} {...field} />)} /></FormItem>
          <FormItem label="Priority"><Controller name="priority" control={control} render={({ field }) => (<Select placeholder="Select Priority" options={priorityOptions} {...field} />)} /></FormItem>
        </div>
        <FormItem label="Due Date"><Controller name="dueDate" control={control} render={({ field }) => (<DatePicker placeholder="Select date" value={field.value as Date} onChange={field.onChange} />)} /></FormItem>
        <FormItem label="Description"><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Assign Task</Button></div>
      </form>
    </Dialog>
  );
};
const AddScheduleDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema), defaultValues: { event_title: `Regarding Wall Item: ${wallItem.product_name}`, event_type: undefined, date_time: null as any, remind_from: null, notes: `Details for wall item "${wallItem.product_name}" (ID: ${wallItem.id}).`, }, mode: 'onChange', });
  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = { module_id: Number(wallItem.id), module_name: 'WallListing', event_title: data.event_title, event_type: data.event_type, date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'), ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }), notes: data.notes || '', };
    try {
      await dispatch(addScheduleAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for "${wallItem.product_name}".`} />);
      onClose();
    } catch (error: any) { toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsLoading(false); }
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for "{wallItem.product_name}"</h5>
      <Form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem>
          <FormItem label="Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
        </div>
        <FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
        <FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
        <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div>
      </Form>
    </Dialog>
  );
};
const ViewAlertDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const alertColors: Record<string, string> = { danger: "red", warning: "amber", info: "blue", };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
      <h5 className="mb-4">Alerts for "{wallItem.product_name}"</h5>
      <div className="mt-4 flex flex-col gap-3">
        {dummyAlerts.length > 0 ? (dummyAlerts.map((alert) => (<div key={alert.id} className={`p-3 rounded-lg border-l-4 border-${alertColors[alert.severity]}-500 bg-${alertColors[alert.severity]}-50 dark:bg-${alertColors[alert.severity]}-500/10`}>
          <div className="flex justify-between items-start"><div className="flex items-start gap-2"><TbAlertTriangle className={`text-${alertColors[alert.severity]}-500 mt-1`} size={20} /><p className="text-sm">{alert.message}</p></div><span className="text-xs text-gray-400 whitespace-nowrap">{alert.time}</span></div>
        </div>))) : (<p>No active alerts for this item.</p>)}
      </div>
      <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};
const ShareWallLinkDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const linkToShare = wallItem.listing_url || "No URL available for this item.";
  const handleCopy = () => { if (wallItem.listing_url) { navigator.clipboard.writeText(linkToShare).then(() => { toast.push(<Notification title="Copied to Clipboard" type="success" />); }); } };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Share Link for "{wallItem.product_name}"</h5>
      <p className="mb-2 text-sm">Use the link below to share this listing:</p>
      <div className="flex items-center gap-2"><Input readOnly value={linkToShare} /><Tooltip title="Copy Link"><Button shape="circle" icon={<TbCopy />} onClick={handleCopy} disabled={!wallItem.listing_url} /></Tooltip></div>
      <div className="text-right mt-6"><Button onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};
const GenericActionDialog: React.FC<{ type: WallModalType | null; wallItem: WallItem; onClose: () => void; }> = ({ type, wallItem, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}` : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true);
    console.log(`Performing action '${type}' for wall item ${wallItem.product_name}`);
    setTimeout(() => { toast.push(<Notification type="success" title="Action Completed" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-2">{title}</h5>
      <p>Are you sure you want to perform this action for <span className="font-semibold">{wallItem.product_name}</span>?</p>
      <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" onClick={handleConfirm} loading={isLoading}>Confirm</Button></div>
    </Dialog>
  );
};
const WallModals: React.FC<WallModalsProps> = ({ modalState, onClose, getAllUserDataOptions }) => {
  const { type, data: wallItem, isOpen } = modalState;
  if (!isOpen || !wallItem) return null;
  const renderModalContent = () => {
    switch (type) {
      case "email": return <SendEmailDialog wallItem={wallItem} onClose={onClose} />;
      case "whatsapp": return <SendWhatsAppDialog wallItem={wallItem} onClose={onClose} />;
      case "notification": return <AddNotificationDialog wallItem={wallItem} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
      case "task": return <AssignTaskDialog wallItem={wallItem} onClose={onClose} />;
      case "calendar": return <AddScheduleDialog wallItem={wallItem} onClose={onClose} />;
      case "alert": return <ViewAlertDialog wallItem={wallItem} onClose={onClose} />;
      case "share": return <ShareWallLinkDialog wallItem={wallItem} onClose={onClose} />;
      default: return (<GenericActionDialog type={type} wallItem={wallItem} onClose={onClose} />);
    }
  };
  return <>{renderModalContent()}</>;
};

// --- CSV Export ---
const CSV_WALL_HEADERS = ["ID", "Product Name", "Company Name", "Member Name", "Category", "Subcategory", "Product Status", "Quantity", "Price", "Intent", "Created Date", "Record Status",];
const CSV_WALL_KEYS: (keyof WallItem)[] = ["id", "product_name", "company_name", "member_name", "product_category", "product_subcategory", "product_status", "quantity", "price", "want_to", "created_date", "recordStatus",];
function exportWallItemsToCsv(filename: string, rows: WallItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const separator = ",";
  const csvContent = CSV_WALL_HEADERS.join(separator) + "\n" + rows.map((row) => {
    return CSV_WALL_KEYS.map((k) => {
      let cell = row[k] as any;
      if (cell === null || cell === undefined) cell = "";
      else if (k === "created_date" && cell instanceof Date) cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss");
      else cell = String(cell).replace(/"/g, '""');
      if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(separator);
  }).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;", });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>);
    return true;
  }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- Child Components ---
const StyledActionColumn = ({ onEdit, onViewDetail, onOpenModal, rowData }: { onEdit: () => void; onViewDetail: () => void; onOpenModal: (type: WallModalType, data: WallItem) => void; rowData: WallItem; }) => (
  <div className="flex items-center justify-center">
    <Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 rounded-md" role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
    <Tooltip title="View"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-md" role="button" onClick={onViewDetail}><TbEye /></div></Tooltip>
    <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
      <Dropdown.Item onClick={() => onOpenModal("email", rowData)} className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("whatsapp", rowData)} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add Notification</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("task", rowData)} className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign Task</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("calendar", rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Add Schedule</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("active", rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Add Active</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("alert", rowData)} className="flex items-center gap-2"><TbBulb size={18} /> <span className="text-xs">Match Opportunity</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("share", rowData)} className="flex items-center gap-2"><TbShare size={18} /> <span className="text-xs">Share Wall Link</span></Dropdown.Item>
    </Dropdown>
  </div>
);
interface WallSearchProps { onInputChange: (value: string) => void; }
const WallSearch = React.forwardRef<HTMLInputElement, WallSearchProps>(({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch />} onChange={(e) => onInputChange(e.target.value)} />));
WallSearch.displayName = "WallSearch";

const WallTableTools = ({ onSearchChange, onFilter, onExport, onImport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount, isDashboard }: {
  onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onImport: () => void; onClearFilters: () => void;
  columns: ColumnDef<WallItem>[];
  filteredColumns: ColumnDef<WallItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<WallItem>[]>>;
  isDashboard: boolean;
  activeFilterCount: number;
}) => {
  const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId);
      if (originalColumn) {
        setFilteredColumns(prev => {
          const newCols = [...prev, originalColumn];
          newCols.sort((a, b) => {
            const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey));
            const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey));
            return indexA - indexB;
          });
          return newCols;
        });
      }
    } else {
      setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId));
    }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <WallSearch onInputChange={onSearchChange} />
      </div>
      {!isDashboard && <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
          <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
            {columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}
          </div>
        </Dropdown>
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload"></Button>
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
        <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
        <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
      </div>}
    </div>
  )
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData,
  onRemoveFilter: (key: keyof FilterFormData, value: any) => void;
  onClearAll: () => void;
}) => {
  const { filterRecordStatuses, filterIntents, quickFilters } = filterData;
  const hasFilters = filterRecordStatuses?.length || filterIntents?.length || quickFilters;
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {filterRecordStatuses?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterRecordStatuses', item)} /></Tag>)}
      {filterIntents?.map(item => <Tag key={`intent-${item.value}`} prefix>Intent: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterIntents', item)} /></Tag>)}
      {quickFilters && <Tag prefix className="capitalize">{quickFilters.type}: {quickFilters.value} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('quickFilters', quickFilters)} /></Tag>}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};
interface WallTableProps {
  columns: ColumnDef<WallItem>[]; data: WallItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: WallItem[];
  onPaginationChange: (page: number) => void; onSelectChange: (size: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: WallItem) => void; onAllRowSelect: (checked: boolean, rows: Row<WallItem>[]) => void;
}
const WallTable = (props: WallTableProps) => (<DataTable selectable columns={props.columns} data={props.data} loading={props.loading} pagingData={props.pagingData} checkboxChecked={(row) => props.selectedItems.some((s) => s.id === row.id)} onPaginationChange={props.onPaginationChange} onSelectChange={props.onSelectChange} onSort={props.onSort} onCheckBoxChange={props.onRowSelect} onIndeterminateCheckBoxChange={props.onAllRowSelect} noData={!props.loading && props.data.length === 0} />);
interface WallSelectedFooterProps { selectedItems: WallItem[]; deleteConfirmOpen: boolean; setDeleteConfirmOpen: (open: boolean) => void; onConfirmDelete: () => void; isDeleting: boolean; }
const WallSelectedFooter = ({ selectedItems, deleteConfirmOpen, setDeleteConfirmOpen, onConfirmDelete, isDeleting }: WallSelectedFooterProps) => {
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t px-8">
        <div className="flex items-center justify-between w-full"><span className="flex items-center gap-2"><TbChecks className="text-xl text-primary-500" /><span className="font-semibold">{selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}selected</span></span><Button size="sm" variant="plain" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirmOpen(true)}>Delete Selected</Button></div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title="Delete Selected Wall Items" onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={onConfirmDelete} loading={isDeleting}>
        <p>Are you sure you want to delete {selectedItems.length} selected item{selectedItems.length > 1 ? "s" : ""}?{" "}</p>
      </ConfirmDialog>
    </>
  );
};

const BookmarkButton = React.memo(({ is_bookmarked }: { is_bookmarked: boolean }) => (
  <Tooltip title={is_bookmarked ? "Bookmarked" : "Not Bookmarked"}>
    <button
      onClick={(e) => e.stopPropagation()}
      className="p-0 m-0 bg-transparent border-none cursor-pointer"
    >
      <TbBookmark
        size={14}
        className={is_bookmarked ? "text-amber-500 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}
      />
    </button>
  </Tooltip>
));
BookmarkButton.displayName = 'BookmarkButton';


// --- Main Component ---
const WallListing = ({ isDashboard }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { wallListing, AllProductsData, AllCategorysData, subCategoriesForSelectedCategoryData, BrandData, MemberTypeData, ProductSpecificationsData, Employees, AllCompanyData, getAllUserData, status: masterLoadingStatus } = useSelector(masterSelector, shallowEqual);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WallItem | null>(null);
  const [deleteSelectedConfirmOpen, setDeleteSelectedConfirmOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [selectedItems, setSelectedItems] = useState<WallItem[]>([]);
  const [modalState, setModalState] = useState<WallModalState>({ isOpen: false, type: null, data: null });
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(filterFormSchema.parse({}));
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_date" }, query: "" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

  const mapApiToWallItem = useCallback(
    (apiItem: ApiWallItemFromSource): WallItem => ({
      id: apiItem.id as number, productId: apiItem.product_id, product_name: apiItem.product_name, company_name: apiItem.company_name || "", companyId: apiItem.company_id_from_api || undefined, member_name: apiItem.member_name, memberId: String(apiItem.member_id_from_api || ""), memberTypeId: apiItem.member_type_id, member_email: apiItem.member_email || "", member_phone: apiItem.member_phone || "", product_category: apiItem.product_category || "", productCategoryId: apiItem.product_category_id, product_subcategory: apiItem.product_subcategory || "", subCategoryId: apiItem.subcategory_id, product_description: apiItem.product_description || "", product_specs: apiItem.product_specs || "", productSpecId: apiItem.product_spec_id, product_status: apiItem.product_status, quantity: Number(apiItem.quantity) || 0, price: Number(apiItem.price) || 0, want_to: apiItem.want_to as WallIntent | string, listing_type: apiItem.listing_type || "", shipping_options: apiItem.shipping_options || "", payment_method: apiItem.payment_method || "", warranty: apiItem.warranty || "", return_policy: apiItem.return_policy || "", listing_url: apiItem.listing_url || "", brand: apiItem.brand || "", brandId: apiItem.brand_id, product_images: apiItem.product_images || [], created_date: new Date(apiItem.created_date), updated_at: new Date(apiItem.updated_at), visibility: apiItem.visibility || "", priority: apiItem.priority || "", assigned_to: apiItem.assigned_to || "", interaction_type: apiItem.interaction_type || "", action: apiItem.action || "", recordStatus: apiItem.status as WallRecordStatus, cartoonTypeId: apiItem.cartoon_type_id, deviceCondition: (apiItem.device_condition as WallProductCondition | null) || null, inquiry_count: Number(apiItem.inquiry_count) || 0, share_count: Number(apiItem.share_count) || 0, is_bookmarked: apiItem.is_bookmarked, updated_by_name: apiItem.updated_by_name, updated_by_role: apiItem.updated_by_role, createdById: apiItem.created_by, member: apiItem?.member || null,
    }),
    []
  );

  const apiParams = useMemo(() => {
    const formatMultiSelect = (items: { value: any }[] | undefined) => { if (!items || items.length === 0) return undefined; return items.map((item) => item.value).join(","); };
    const params: any = { page: tableData.pageIndex, per_page: tableData.pageSize, search: tableData.query || undefined, sort_by: tableData.sort?.key || undefined, sort_order: tableData.sort?.order || undefined, status: formatMultiSelect(filterCriteria.filterRecordStatuses), company_ids: formatMultiSelect(filterCriteria.filterCompanyIds), want_to: formatMultiSelect(filterCriteria.filterIntents), product_ids: formatMultiSelect(filterCriteria.filterProductIds), category_ids: formatMultiSelect(filterCriteria.categories), subcategory_ids: formatMultiSelect(filterCriteria.subcategories), brand_ids: formatMultiSelect(filterCriteria.brands), product_status: formatMultiSelect(filterCriteria.productStatus), member_type_ids: formatMultiSelect(filterCriteria.memberType), created_by_ids: formatMultiSelect(filterCriteria.createdBy), product_spec_ids: formatMultiSelect(filterCriteria.productSpec), source: formatMultiSelect(filterCriteria.source) };
    if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) {
      params.start_date = filterCriteria.dateRange[0] ? dayjs(filterCriteria.dateRange[0]).format("YYYY-MM-DD") : undefined;
      params.end_date = filterCriteria.dateRange[1] ? dayjs(filterCriteria.dateRange[1]).format("YYYY-MM-DD") : undefined;
    }
    if (filterCriteria.quickFilters) {
      if (filterCriteria.quickFilters.type === 'intent') params.want_to = filterCriteria.quickFilters.value;
      if (filterCriteria.quickFilters.type === 'status') params.status = filterCriteria.quickFilters.value;
    }
    Object.keys(params).forEach((key) => { if (params[key] === undefined || params[key] === null) { delete params[key]; } });
    return params;
  }, [tableData, filterCriteria]);

  useEffect(() => { dispatch(getWallListingAction(apiParams)); }, [dispatch, apiParams]);
  useEffect(() => {
    dispatch(getProductsDataAsync()); dispatch(getCategoriesData()); dispatch(getSubcategoriesByCategoryIdAction(0)); dispatch(getBrandAction()); dispatch(getMemberTypeAction()); dispatch(getProductSpecificationsAction()); dispatch(getEmployeesAction()); dispatch(getAllCompany()); dispatch(getAllUsersAction());
  }, [dispatch]);

  const pageData = useMemo(() => { return Array.isArray(wallListing?.data?.data) ? wallListing.data.data.map(mapApiToWallItem) : []; }, [wallListing, mapApiToWallItem]);
  const total = wallListing?.data?.total || 0;

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const openAddDrawer = useCallback(() => navigate("/sales-leads/wall-item/add"), [navigate]);
  const openEditDrawer = useCallback((item: WallItem) => navigate("/sales-leads/wall-item/add", { state: item?.id }), [navigate]);
  const openViewDrawer = useCallback((item: WallItem) => { setEditingItem(item); setIsViewDrawerOpen(true); }, []);
  const closeViewDrawer = useCallback(() => { setIsViewDrawerOpen(false); setEditingItem(null); }, []);
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleOpenModal = (type: WallModalType, wallItem: WallItem) => setModalState({ isOpen: true, type, data: wallItem });
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

  const onConfirmDeleteSelectedItems = useCallback(async () => {
    if (selectedItems.length === 0) { toast.push(<Notification title="No items selected" type="info">Please select items to delete.</Notification>); return; }
    setDeleteSelectedConfirmOpen(false);
    const ids = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatch(deleteAllWallAction({ ids })).unwrap();
      toast.push(<Notification title="Success" type="success">{selectedItems.length} item(s) deleted.</Notification>);
      setSelectedItems([]); dispatch(getWallListingAction(apiParams));
    } catch (error: any) { toast.push(<Notification title="Error" type="danger">{error.message || "Bulk delete failed."}</Notification>); }
  }, [dispatch, selectedItems, apiParams]);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(prev => ({ ...prev, ...data, quickFilters: null })); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
  const onClearFilters = useCallback(() => { const defaults = filterFormSchema.parse({}); filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ query: "", pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);

  const handleCardClick = (type: string, value: string) => {
    onClearFilters();
    if (type === 'status') {
      const statusOption = recordStatusOptions.find(opt => opt.value.toLowerCase() === value.toLowerCase());
      if (statusOption) setFilterCriteria({ filterRecordStatuses: [statusOption] });
    } else if (type === 'intent') {
      const intentOption = intentOptions.find(opt => opt.value.toLowerCase() === value.toLowerCase());
      if (intentOption) setFilterCriteria({ filterIntents: [intentOption] });
    }
  };
  const handleRemoveFilter = (key: keyof FilterFormData, value: any) => {
    setFilterCriteria(prev => {
      const newFilters = { ...prev };
      const currentValues = prev[key] as { value: any }[] | undefined;
      if (Array.isArray(currentValues)) {
        (newFilters as any)[key] = currentValues.filter(item => item.value !== value.value);
      } else {
        (newFilters as any)[key] = null; // for quickFilters
      }
      return newFilters;
    });
  };

  const handleOpenExportReasonModal = useCallback(() => {
    if (total === 0) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true);
  }, [total, exportReasonFormMethods]);
  const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "WallListing"; const timestamp = dayjs().format("YYYY-MM-DD"); const fileName = `wall_listing_export_${timestamp}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName, })).unwrap();
      toast.push(<Notification title="Reason Submitted" type="info" duration={2000} message="Now fetching data for export..." />);
      const exportParams = { ...apiParams, per_page: 0, page: 1 };
      const exportDataResponse = await dispatch(getWallListingAction(exportParams)).unwrap();
      if (!exportDataResponse?.status) { throw new Error(exportDataResponse?.message || "Failed to fetch data for export."); }
      const allFilteredData = (exportDataResponse?.data?.data || []).map(mapApiToWallItem);
      const success = exportWallItemsToCsv(fileName, allFilteredData);
      if (success) { setIsExportReasonModalOpen(false); }
    } catch (error: any) { toast.push(<Notification title="Failed to Export" type="danger" message={error.message || "An unknown error occurred"} />); } finally { setIsSubmittingExportReason(false); }
  }, [apiParams, dispatch, mapApiToWallItem]);

  const handlePaginationChange = (page: number) => handleSetTableData({ pageIndex: page });
  const handlePageSizeChange = (value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]); };
  const handleSort = (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 });
  const handleSearchChange = (query: string) => handleSetTableData({ query, pageIndex: 1 });
  const handleRowSelect = (checked: boolean, row: WallItem) => setSelectedItems((prev) => checked ? [...prev, row] : prev.filter((item) => item.id !== row.id));
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<WallItem>[]) => {
    const originals = currentRows.map((r) => r.original);
    if (checked) { setSelectedItems((prev) => { const oldIds = new Set(prev.map((i) => i.id)); return [...prev, ...originals.filter((o) => !oldIds.has(o.id))]; }); } else { const currentIds = new Set(originals.map((o) => o.id)); setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id))); }
  }, []);
  const handleImportData = useCallback(() => setImportDialogOpen(true), []);
  const handleImportFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { toast.push(<Notification title="Import Started" type="info">File processing initiated. (Dummy)</Notification>); setImportDialogOpen(false); }
    if (event.target) event.target.value = "";
  }, []);

  // --- Columns Definition ---
  const columns: ColumnDef<WallItem>[] = useMemo(
    () => [
      {
        header: "Overview", accessorKey: "product_name", size: 280, cell: ({ row }) => {
          const { product_images, product_name, id, want_to } = row?.original || {}; const intent = want_to as WallIntent;
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-2"><Avatar size={33} shape="circle" src={product_images?.[0]} icon={!product_images?.[0] && (<TbPhoto className="text-gray-400" />)} />
                <div className="font-semibold leading-normal text-xs text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">{product_name}</div>
              </div>
              <span className="text-xs mt-2"><span className="font-semibold">ID :</span> {id || "N/A"}</span>
              <span className="text-xs">{want_to && (<span><b>Want To: </b><Tag className={`capitalize text-xs px-1 py-0.5 ${intentTagColor[intent] || productApiStatusColor.default}`}>{want_to}</Tag></span>)}</span>
            </div>
          );
        },
      },
      {
        header: "Company & Member", accessorKey: "company_name", size: 260, cell: ({ row }) => {
          const { name, id, member_email, member_phone } = row.original?.member || {};
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <div className="mt-1 pt-1 dark:border-gray-700 w-full">
                {id && (<span className="font-semibold text-gray-500 dark:text-gray-400">{id} | </span>)}
                {name && (<span className="font-semibold text-gray-800 dark:text-gray-100">{name}</span>)}
                {member_email && (<a href={`mailto:${member_email}`} className="block text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">{member_email}</a>)}
                {member_phone && (<span className="block text-gray-600 dark:text-gray-300">{member_phone}</span>)}
              </div>
            </div>
          );
        },
      },
      {
        header: "Details", accessorKey: "product_category", size: 280, cell: ({ row }) => {
          const { product_category, product_subcategory, product_specs, product_status, cartoonTypeId, deviceCondition, } = row?.original || {};
          const currentProductApiStatus = product_status?.toLowerCase() || "default";
          const cartoonTypeName = dummyCartoonTypes.find((ct) => ct.id === cartoonTypeId)?.name;
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <span><span className="font-semibold text-gray-700 dark:text-gray-300">Category:</span>{" "}{product_category || "N/A"}{product_subcategory ? ` / ${product_subcategory}` : ""}</span>
              {product_specs && (<Tooltip title={product_specs}><span className="truncate max-w-[250px]"><span className="font-semibold text-gray-700 dark:text-gray-300">Specs:</span>{" "}{product_specs.length > 30 ? product_specs.substring(0, 30) + "..." : product_specs}</span></Tooltip>)}
              {product_status && (<span><span className="font-semibold text-gray-700 dark:text-gray-300">Avail. Status:</span>{" "}<Tag className={`capitalize text-xs px-1 py-0.5 ${productApiStatusColor[currentProductApiStatus] || productApiStatusColor.default}`}>{product_status}</Tag></span>)}
              {cartoonTypeName && (<span><span className="font-semibold text-gray-700 dark:text-gray-300">Cartoon:</span>{" "}{cartoonTypeName}</span>)}
              {deviceCondition && (<span><span className="font-semibold text-gray-700 dark:text-gray-300">Condition:</span>{" "}{deviceCondition}</span>)}
            </div>
          );
        },
      },
      {
        header: "Engagement", accessorKey: "price", size: 220, cell: ({ row }) => {
          const { price, quantity, inquiry_count, share_count, is_bookmarked, created_date, } = row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center"><TbCurrencyDollar className="text-base text-emerald-500 dark:text-emerald-400" /><span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">{price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2, }) ?? "N/A"}</span><TbStack2 className="text-base text-blue-500 dark:text-blue-400 ml-2" /><span className="text-gray-700 dark:text-gray-300" style={{ minWidth: 35 }}>Qty: {quantity ?? "N/A"}</span></div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mt-1">
                <Tooltip title="Inquiries"><span className="flex items-center gap-0.5"><TbMessageCircle className="text-gray-500 dark:text-gray-400" />{inquiry_count}</span></Tooltip>
                <Tooltip title="Shares"><span className="flex items-center gap-0.5"><TbShare className="text-gray-500 dark:text-gray-400" />{share_count}</span></Tooltip>
                <BookmarkButton is_bookmarked={is_bookmarked} />
              </div>
              {created_date && (<span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1"><TbCalendarEvent />{dayjs(created_date).format("MMM D, YYYY")}</span>)}
            </div>
          );
        },
      },
      {
        header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 180, cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } = props.row.original || {};
          const formattedDate = updated_at ? dayjs(updated_at).format("MMM D, YYYY h:mm A") : "N/A";
          return (<div className="text-xs"><span>{updated_by_name || "N/A"}{updated_by_role && (<><br /><b>{updated_by_role}</b></>)}</span><br /><span>{formattedDate}</span></div>);
        },
      },
      {
        header: "Workflow Status", accessorKey: "recordStatus", enableSorting: true, size: 180, cell: ({ row }) => {
          const { recordStatus } = row.original;
          return (<div className="flex flex-col gap-1 text-xs">{recordStatus && (<div><Tag className={`${recordStatusColor[recordStatus] || recordStatusColor.Pending} font-semibold capitalize`}>{recordStatus}</Tag></div>)}</div>);
        },
      },
      {
        header: "Actions", id: "actions", size: 120, meta: { HeaderClass: "text-center" }, cell: (props: CellContext<WallItem, any>) => (<StyledActionColumn onViewDetail={() => openViewDrawer(props.row.original)} onEdit={() => openEditDrawer(props.row.original)} onOpenModal={handleOpenModal} rowData={props.row.original} />),
      },
    ],
    [openViewDrawer, openEditDrawer, handleOpenModal]
  );

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<WallItem>[]>(columns);
  // useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterRecordStatuses?.length) count++;
    if (filterCriteria.filterIntents?.length) count++;
    if (filterCriteria.filterProductIds?.length) count++;
    if (filterCriteria.filterCompanyIds?.length) count++;
    if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) count++;
    if (filterCriteria.quickFilters) count++;
    return count;
  }, [filterCriteria]);

  const counts = wallListing?.counts || { active: 0, buy: 0, non_active: 0, pending: 0, rejected: 0, sell: 0, today: 0, total: 0 };
  const cardClass = "rounded-sm border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            {!isDashboard && <h5 className="mb-2 sm:mb-0">Wall Listing</h5>}
            {!isDashboard && <div className="flex gap-2"><Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button><Button variant="solid" icon={<TbPlus />}>Add Multiple</Button></div>}
          </div>
          {!isDashboard && <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-4 mt-4 gap-2 ">
            <Tooltip title="Click to show all listings"><div onClick={onClearFilters}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-blue-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbListDetails size={20} /></div><div className="flex flex-col"><b className="text-blue-500">{counts.total}</b><span className="font-semibold text-[11px]">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show listings created today"><div onClick={() => handleCardClick('status', 'today')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-emerald-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbCalendar size={20} /></div><div className="flex flex-col"><b className="text-emerald-500">{counts.today}</b><span className="font-semibold text-[11px]">Today</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show 'Buy' listings"><div onClick={() => handleCardClick('intent', 'Buy')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-violet-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbBox size={20} /></div><div className="flex flex-col"><b className="text-violet-500">{counts.buy}</b><span className="font-semibold text-[11px]">Buy</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show 'Sell' listings"><div onClick={() => handleCardClick('intent', 'Sell')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-pink-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbPackageExport size={20} /></div><div className="flex flex-col"><b className="text-pink-500">{counts.sell}</b><span className="font-semibold text-[11px]">Sell</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show active listings"><div onClick={() => handleCardClick('status', 'Active')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-green-300")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbCircleCheck size={20} /></div><div className="flex flex-col"><b className="text-green-500">{counts.active}</b><span className="font-semibold text-[11px]">Active</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show non-active listings"><div onClick={() => handleCardClick('status', 'Non-Active')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-red-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCancel size={20} /></div><div className="flex flex-col"><b className="text-red-500">{counts.non_active}</b><span className="font-semibold text-[11px]">Non Active</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show pending listings"><div onClick={() => handleCardClick('status', 'Pending')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-orange-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbProgress size={20} /></div><div className="flex flex-col"><b className="text-orange-500">{counts.pending}</b><span className="font-semibold text-[11px]">Pending</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show rejected listings"><div onClick={() => handleCardClick('status', 'Rejected')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-red-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbBoxOff size={20} /></div><div className="flex flex-col"><b className="text-red-500">{counts.rejected}</b><span className="font-semibold text-[11px]">Rejected</span></div></Card></div></Tooltip>
          </div>}
          <WallTableTools isDashboard={isDashboard} onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onImport={handleImportData} onClearFilters={onClearFilters} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4">
            <WallTable
              columns={filteredColumns} data={pageData} loading={masterLoadingStatus === "loading"}
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} onSort={handleSort} />
          </div>
        </AdaptiveCard>
      </Container>
      <WallSelectedFooter selectedItems={selectedItems} deleteConfirmOpen={deleteSelectedConfirmOpen} setDeleteConfirmOpen={setDeleteSelectedConfirmOpen} onConfirmDelete={onConfirmDeleteSelectedItems} isDeleting={masterLoadingStatus === "loading"} />
      <WallModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={useMemo(() => getAllUserData?.map((user: any) => ({ value: user?.id, label: user?.name })), [getAllUserData])} />
      <Drawer title="View Wall Item Details" isOpen={isViewDrawerOpen} onClose={closeViewDrawer} onRequestClose={closeViewDrawer} width={700}>
        {editingItem && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {Object.entries(editingItem).filter(([key]) => !["product_images", "product_name", "id"].includes(key)).map(([key, value]) => (
                <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <strong className="capitalize text-gray-700 dark:text-gray-200">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:</strong>{" "}
                  <span className="text-gray-600 dark:text-gray-400">{value instanceof Date ? dayjs(value).format("MMM D, YYYY h:mm A") : value !== null && value !== "" ? String(value) : "N/A"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear All</Button>
            <Button size="sm" variant="solid" form="filterWallForm" type="submit">Apply</Button>
          </div>
        }
      >
        <Form id="filterWallForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col h-full">
          <div className="overflow-y-auto p-1 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem label="Workflow Status"><Controller name="filterRecordStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status..." options={recordStatusOptions} {...field} />)} /></FormItem>
              <FormItem label="Companies"><Controller name="filterCompanyIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select companies..." options={AllCompanyData?.map((p: any) => ({ value: p.id, label: p.company_name }))} {...field} />)} /></FormItem>
              <FormItem label="Intent (Want to)"><Controller name="filterIntents" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select intents..." options={intentOptions} {...field} />)} /></FormItem>
              <FormItem label="Products"><Controller name="filterProductIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select products..." options={AllProductsData?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Categories"><Controller name="categories" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Categories..." options={AllCategorysData.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Sub Categories"><Controller name="subcategories" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Sub Categories..." options={subCategoriesForSelectedCategoryData?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Brands"><Controller name="brands" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Brands..." options={BrandData?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Availability Status"><Controller name="productStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Availability..." options={Object.keys(productApiStatusColor).filter((k) => k !== "default").map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))} {...field} />)} /></FormItem>
              <FormItem label="Created Date Range" className="col-span-2"><Controller name="dateRange" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange value={field.value as [Date | null, Date | null] | null} onChange={field.onChange} placeholder="Select date range" />)} /></FormItem>
              <FormItem label="Source (Example)"><Controller name="source" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Source..." options={[{ label: "Web", value: "web" }, { label: "App", value: "app" }]} {...field} />)} /></FormItem>
              <FormItem label="Product Spec (Example)"><Controller name="productSpec" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Product Spec..." options={ProductSpecificationsData?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Member Type (Example)"><Controller name="memberType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Member Type..." options={MemberTypeData?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Created By (Example)"><Controller name="createdBy" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Employee..." options={Employees?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
            </div>
          </div>
        </Form>
      </Drawer>
      <Dialog isOpen={importDialogOpen} onClose={() => setImportDialogOpen(false)} onRequestClose={() => setImportDialogOpen(false)} title="Import Wall Items">
        <div className="p-4">
          <p>Upload a CSV file to import Wall Items. (This is a dummy import)</p>
          <FormItem label="CSV File"><Input type="file" accept=".csv" onChange={handleImportFileSelect} /></FormItem>
          <div className="text-right mt-4"><Button size="sm" onClick={() => setImportDialogOpen(false)}>Cancel</Button></div>
        </div>
      </Dialog>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
        <Form id="exportReasonForm" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 mt-2">
          <FormItem label="Please provide a reason for exporting this data:" isRequired invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default WallListing;