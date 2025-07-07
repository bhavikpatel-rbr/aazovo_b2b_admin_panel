import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";
import dayjs from "dayjs";
import type { MouseEvent } from "react";
import * as XLSX from "xlsx";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebounceInput from "@/components/shared/DebouceInput";
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
  Checkbox,
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
  TbDownload,
  TbFileText,
  TbFileZip,
  TbUserQuestion,
  TbEyeClosed,
  TbBellMinus,
  TbPencilPin,
  TbFileTime,
  TbStars,
  TbColumns,
  TbX,
  TbCheck,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
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
  submitExportReasonAction,
  addNotificationAction,
  getAllUsersAction,
  addScheduleAction,
  addTaskAction,
  addAllActionAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { authSelector } from "@/reduxtool/auth/authSlice";

// --- Define Types ---
export type SelectOption = { value: any; label: string };
export type RequestFeedbackApiStatus = "Unread" | "Read" | "In Progress" | "Resolved" | "Closed" | string;
export type RequestFeedbackFormStatus = "Unread" | "Read" | "In Progress" | "Resolved" | "Closed";
export type RequestFeedbackType = "Feedback" | "Request" | "Complaint" | "Query" | string;

export type RequestFeedbackItem = {
  id: string | number;
  customer_id: string;
  name: string;
  email: string;
  mobile_no: string;
  company_name?: string | null;
  feedback_details: string;
  attachment?: string | null;
  type: RequestFeedbackType;
  status: RequestFeedbackApiStatus;
  created_at: string;
  updated_at: string;
  subject?: string | null;
  rating?: number | string | null;
  deleted_at?: string | null;
  health_score?: number;
  updated_by_user?: {
    name: string;
    roles: [{ display_name: string }];
    profile_pic_path?: string | null;
  };
};

// --- Zod Schemas for Action Dialogs ---
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

const taskValidationSchema = z.object({
    task_title: z.string().min(3, 'Task title must be at least 3 characters.'),
    assign_to: z.array(z.number()).min(1, 'At least one assignee is required.'),
    priority: z.string().min(1, 'Please select a priority.'),
    due_date: z.date().nullable().optional(),
    description: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskValidationSchema>;

const notificationSchema = z.object({
    notification_title: z.string().min(3, "Title must be at least 3 characters long."),
    send_users: z.array(z.number()).min(1, "Please select at least one user."),
    message: z.string().min(10, "Message must be at least 10 characters long."),
});
type NotificationFormData = z.infer<typeof notificationSchema>;

const activitySchema = z.object({
    item: z.string().min(3, "Activity item is required and must be at least 3 characters."),
    notes: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;

// ============================================================================
// --- ACTION DIALOG COMPONENTS ---
// ============================================================================
const taskPriorityOptions: SelectOption[] = [{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" },];
const eventTypeOptions = [{ value: 'Meeting', label: 'Meeting' }, { value: 'Demo', label: 'Product Demo' }, { value: 'IntroCall', label: 'Introductory Call' }, { value: 'FollowUpCall', label: 'Follow-up Call' }, { value: 'QBR', label: 'Quarterly Business Review (QBR)' }, { value: 'CheckIn', label: 'Customer Check-in' }, { value: 'LogEmail', label: 'Log an Email' }, { value: 'Milestone', label: 'Project Milestone' }, { value: 'Task', label: 'Task' }, { value: 'FollowUp', label: 'General Follow-up' }, { value: 'ProjectKickoff', label: 'Project Kick-off' }, { value: 'OnboardingSession', label: 'Onboarding Session' }, { value: 'Training', label: 'Training Session' }, { value: 'SupportCall', label: 'Support Call' }, { value: 'Reminder', label: 'Reminder' }, { value: 'Note', label: 'Add a Note' }, { value: 'FocusTime', label: 'Focus Time (Do Not Disturb)' }, { value: 'StrategySession', label: 'Strategy Session' }, { value: 'TeamMeeting', label: 'Team Meeting' }, { value: 'PerformanceReview', label: 'Performance Review' }, { value: 'Lunch', label: 'Lunch / Break' }, { value: 'Appointment', label: 'Personal Appointment' }, { value: 'Other', label: 'Other' }, { value: 'ProjectKickoff', label: 'Project Kick-off' }, { value: 'InternalSync', label: 'Internal Team Sync' }, { value: 'ClientUpdateMeeting', label: 'Client Update Meeting' }, { value: 'RequirementsGathering', label: 'Requirements Gathering' }, { value: 'UAT', label: 'User Acceptance Testing (UAT)' }, { value: 'GoLive', label: 'Go-Live / Deployment Date' }, { value: 'ProjectSignOff', label: 'Project Sign-off' }, { value: 'PrepareReport', label: 'Prepare Report' }, { value: 'PresentFindings', label: 'Present Findings' }, { value: 'TroubleshootingCall', label: 'Troubleshooting Call' }, { value: 'BugReplication', label: 'Bug Replication Session' }, { value: 'IssueEscalation', label: 'Escalate Issue' }, { value: 'ProvideUpdate', label: 'Provide Update on Ticket' }, { value: 'FeatureRequest', label: 'Log Feature Request' }, { value: 'IntegrationSupport', label: 'Integration Support Call' }, { value: 'DataMigration', label: 'Data Migration/Import Task' }, { value: 'ColdCall', label: 'Cold Call' }, { value: 'DiscoveryCall', label: 'Discovery Call' }, { value: 'QualificationCall', label: 'Qualification Call' }, { value: 'SendFollowUpEmail', label: 'Send Follow-up Email' }, { value: 'LinkedInMessage', label: 'Log LinkedIn Message' }, { value: 'ProposalReview', label: 'Proposal Review Meeting' }, { value: 'ContractSent', label: 'Contract Sent' }, { value: 'NegotiationCall', label: 'Negotiation Call' }, { value: 'TrialSetup', label: 'Product Trial Setup' }, { value: 'TrialCheckIn', label: 'Trial Check-in Call' }, { value: 'WelcomeCall', label: 'Welcome Call' }, { value: 'ImplementationSession', label: 'Implementation Session' }, { value: 'UserTraining', label: 'User Training Session' }, { value: 'AdminTraining', label: 'Admin Training Session' }, { value: 'MonthlyCheckIn', label: 'Monthly Check-in' }, { value: 'HealthCheck', label: 'Customer Health Check' }, { value: 'FeedbackSession', label: 'Feedback Session' }, { value: 'RenewalDiscussion', label: 'Renewal Discussion' }, { value: 'UpsellOpportunity', label: 'Upsell/Cross-sell Call' }, { value: 'CaseStudyInterview', label: 'Case Study Interview' }, { value: 'InvoiceDue', label: 'Invoice Due' }, { value: 'SendInvoice', label: 'Send Invoice' }, { value: 'PaymentReminder', label: 'Send Payment Reminder' }, { value: 'ChaseOverduePayment', label: 'Chase Overdue Payment' }, { value: 'ConfirmPayment', label: 'Confirm Payment Received' }, { value: 'ContractRenewalDue', label: 'Contract Renewal Due' }, { value: 'DiscussBilling', label: 'Discuss Billing/Invoice' }, { value: 'SendQuote', label: 'Send Quote/Estimate' },]

const itemPathUtil = (filename: string | null | undefined): string => { const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000"; return filename ? `${baseUrl}/storage/${filename}` : "#"; };
const AddNotificationDialog: React.FC<{ item: RequestFeedbackItem; onClose: () => void; userOptions: SelectOption[]; onSubmit: (data: NotificationFormData) => void; isLoading: boolean }> = ({ item, onClose, userOptions, onSubmit, isLoading }) => { const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(notificationSchema), defaultValues: { notification_title: `Update on your ${item.type}: ${item.subject || item.id}`, send_users: [], message: `This is a notification regarding your recent ${item.type.toLowerCase()}: "${item.subject || 'General Inquiry'}".`, }, mode: 'onChange' }); return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Notify about: {item.subject || `Item #${item.id}`}</h5><Form onSubmit={handleSubmit(onSubmit)}><FormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem><FormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<Select isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter(o => field.value?.includes(o.value))} onChange={(options: any) => field.onChange(options?.map((o: any) => o.value) || [])} />)} /></FormItem><FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button></div></Form></Dialog>); };
const AssignTaskDialog: React.FC<{ item: RequestFeedbackItem; onClose: () => void; userOptions: SelectOption[]; onSubmit: (data: TaskFormData) => void; isLoading: boolean; }> = ({ item, onClose, userOptions, onSubmit, isLoading }) => { const { control, handleSubmit, formState: { errors, isValid } } = useForm<TaskFormData>({ resolver: zodResolver(taskValidationSchema), defaultValues: { task_title: `Follow up on ${item.type} from ${item.name}`, assign_to: [], priority: 'Medium', due_date: null, description: item.feedback_details, }, mode: 'onChange' }); return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Assign Task for Item #{item.id}</h5><Form onSubmit={handleSubmit(onSubmit)}><FormItem label="Task Title" invalid={!!errors.task_title} errorMessage={errors.task_title?.message}><Controller name="task_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></FormItem><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormItem label="Assign To" invalid={!!errors.assign_to} errorMessage={errors.assign_to?.message}><Controller name="assign_to" control={control} render={({ field }) => (<Select isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter(o => field.value?.includes(o.value))} onChange={(opts: any) => field.onChange(opts?.map((o: any) => o.value) || [])} />)} /></FormItem><FormItem label="Priority" invalid={!!errors.priority} errorMessage={errors.priority?.message}><Controller name="priority" control={control} render={({ field }) => (<Select placeholder="Select Priority" options={taskPriorityOptions} value={taskPriorityOptions.find(p => p.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem></div><FormItem label="Due Date (Optional)" invalid={!!errors.due_date} errorMessage={errors.due_date?.message}><Controller name="due_date" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />} /></FormItem><FormItem label="Description" invalid={!!errors.description} errorMessage={errors.description?.message}><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Assign Task</Button></div></Form></Dialog>); };
const AddScheduleDialog: React.FC<{ item: RequestFeedbackItem; onClose: () => void; onSubmit: (data: ScheduleFormData) => void; isLoading: boolean; }> = ({ item, onClose, onSubmit, isLoading }) => { const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema), defaultValues: { event_title: `Follow-up on ${item.type} from ${item.name}`, event_type: undefined, date_time: null as any, remind_from: null, notes: `Regarding ${item.type.toLowerCase()}: "${item.subject || 'General Inquiry'}" (ID: ${item.id})`, }, mode: 'onChange' }); return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Add Schedule for Item #{item.id}</h5><Form onSubmit={handleSubmit(onSubmit)}><FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<Select placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem><FormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem></div><FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem><FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div></Form></Dialog>);};
const AddActivityDialog: React.FC<{ item: RequestFeedbackItem; onClose: () => void; onSubmit: (data: ActivityFormData) => void; isLoading: boolean; }> = ({ item, onClose, onSubmit, isLoading }) => { const { control, handleSubmit, formState: { errors, isValid } } = useForm<ActivityFormData>({ resolver: zodResolver(activitySchema), defaultValues: { item: `Follow-up on ${item.type} from ${item.name}`, notes: '' }, mode: 'onChange' }); return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Add Activity Log for Item #{item.id}</h5><Form onSubmit={handleSubmit(onSubmit)}><FormItem label="Activity" invalid={!!errors.item} errorMessage={errors.item?.message}><Controller name="item" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Followed up with customer" />} /></FormItem><FormItem label="Notes (Optional)" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} placeholder="Add relevant details..." />} /></FormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading} icon={<TbCheck />}>Save Activity</Button></div></Form></Dialog>);};
const DownloadDocumentDialog: React.FC<{ item: RequestFeedbackItem; onClose: () => void; }> = ({ item, onClose }) => { const getFileExtension = (filename: string | null | undefined) => filename?.split(".").pop()?.toLowerCase() || ""; const iconMap: Record<string, React.ReactElement> = { pdf: <TbFileText className="text-red-500" />, zip: <TbFileZip className="text-amber-500" />, png: <TbFileText className="text-blue-500" />, jpg: <TbFileText className="text-blue-500" />, jpeg: <TbFileText className="text-blue-500" />, doc: <TbFileText className="text-sky-500" />, docx: <TbFileText className="text-sky-500" />, }; const attachmentName = item.attachment?.split("/").pop() || "Attachment"; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Documents for Item #{item.id}</h5><div className="flex flex-col gap-3 mt-4">{item.attachment ? (<div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><div className="flex items-center gap-3">{React.cloneElement(iconMap[getFileExtension(item.attachment)] || (<TbClipboardText />), { size: 28 })}<div><p className="font-semibold text-sm">{attachmentName}</p></div></div><a href={itemPathUtil(item.attachment)} target="_blank" rel="noopener noreferrer" download={attachmentName}><Tooltip title="Download"><Button shape="circle" size="sm" icon={<TbDownload />} /></Tooltip></a></div>) : (<p>No attachment available for this item.</p>)}</div><div className="text-right mt-6"><Button onClick={onClose}>Close</Button></div></Dialog>); };

const TYPE_OPTIONS: SelectOption[] = [{ value: "Feedback", label: "Feedback" }, { value: "Request", label: "Request" }, { value: "Complaint", label: "Complaint" }, { value: "Query", label: "General Query" },];
const typeValues = TYPE_OPTIONS.map((t) => t.value) as [string, ...string[]];
const STATUS_OPTIONS_FORM: { value: RequestFeedbackFormStatus; label: string; }[] = [{ value: "Unread", label: "Unread" }, { value: "Read", label: "Read" }, { value: "In Progress", label: "In Progress" }, { value: "Resolved", label: "Resolved" }, { value: "Closed", label: "Closed" },];
const statusFormValues = STATUS_OPTIONS_FORM.map((s) => s.value) as [RequestFeedbackFormStatus, ...RequestFeedbackFormStatus[]];
const statusColors: Record<RequestFeedbackApiStatus, string> = { Unread: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100", Read: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100", "In Progress": "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-100", Resolved: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-100", Closed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100", default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300", };
const RATING_OPTIONS: SelectOption[] = [{ value: "1", label: "1 Star (Poor)" }, { value: "2", label: "2 Stars (Fair)" }, { value: "3", label: "3 Stars (Average)" }, { value: "4", label: "4 Stars (Good)" }, { value: "5", label: "5 Stars (Excellent)" },];
const ratingValues = RATING_OPTIONS.map((r) => r.value) as [string, ...string[]];
const requestFeedbackFormSchema = z.object({ name: z.string().min(1, "Name is required.").max(100), email: z.string().email("Invalid email address.").min(1, "Email is required."), mobile_no: z.string().min(1, "Mobile number is required.").max(20), company_name: z.string().max(150).optional().or(z.literal("")).nullable(), feedback_details: z.string().min(10, "Details must be at least 10 characters.").max(5000), type: z.enum(typeValues, { errorMap: () => ({ message: "Please select a type." }), }), status: z.enum(statusFormValues, { errorMap: () => ({ message: "Please select a status." }), }), subject: z.string().max(255).optional().or(z.literal("")).nullable(), rating: z.enum(ratingValues).optional().nullable(), attachment: z.any().optional(), });
type RequestFeedbackFormData = z.infer<typeof requestFeedbackFormSchema>;
const filterFormSchema = z.object({ filterType: z.array(z.object({ value: z.string(), label: z.string() })).optional(), filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(), filterRating: z.array(z.object({ value: z.string(), label: z.string() })).optional(), });
type FilterFormData = z.infer<typeof filterFormSchema>;
const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
const CSV_HEADERS_RF = ["ID", "Name", "Email", "Mobile No", "Company", "Type", "Subject", "Details", "Rating", "Status", "Attachment", "Date",];
const CSV_KEYS_RF: (keyof Pick<RequestFeedbackItem, "id" | "name" | "email" | "mobile_no" | "company_name" | "type" | "subject" | "feedback_details" | "rating" | "status" | "attachment" | "created_at">)[] = ["id", "name", "email", "mobile_no", "company_name", "type", "subject", "feedback_details", "rating", "status", "attachment", "created_at",];
function exportRequestFeedbacksToCsv(filename: string, rows: RequestFeedbackItem[]) { if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; } const preparedRows = rows.map((row) => ({ ...row, type: TYPE_OPTIONS.find((t) => t.value === row.type)?.label || row.type, status: STATUS_OPTIONS_FORM.find((s) => s.value === row.status)?.label || row.status, rating: RATING_OPTIONS.find((r) => r.value === String(row.rating || ""))?.label || (row.rating ? String(row.rating) : "N/A"), created_at: new Date(row.created_at).toLocaleDateString(), attachment: row.attachment ? row.attachment.split("/").pop() : "N/A", })); const separator = ","; const csvContent = CSV_HEADERS_RF.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_RF.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n"); const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;", }); const link = document.createElement("a"); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; } toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false; }

const ItemActionColumn = ({
    onEdit,
    onViewDetail,
    onSendEmail,
    onSendWhatsapp,
    onAddNotification,
    onAssignTask,
    onAddSchedule,
    onAddActive,
    onDownloadDocument,
}: {
    onEdit: () => void;
    onViewDetail: () => void;
    onSendEmail: () => void;
    onSendWhatsapp: () => void;
    onAddNotification: () => void;
    onAssignTask: () => void;
    onAddSchedule: () => void;
    onAddActive: () => void;
    onDownloadDocument: () => void;
}) => (
    <div className="flex items-center justify-center gap-1">
        <Tooltip title="Edit">
            <div
                className="text-xl p-1 cursor-pointer text-gray-500 hover:text-emerald-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                role="button"
                onClick={onEdit}
            >
                <TbPencil />
            </div>
        </Tooltip>
        <Tooltip title="View">
            <div
                className="text-xl p-1 cursor-pointer text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                role="button"
                onClick={onViewDetail}
            >
                <TbEye />
            </div>
        </Tooltip>
        <Dropdown renderTitle={<BsThreeDotsVertical className="text-xl p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
            <Dropdown.Item onClick={onSendEmail} className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
            <Dropdown.Item onClick={onSendWhatsapp} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span></Dropdown.Item>
            <Dropdown.Item onClick={onAddNotification} className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add Notification</span></Dropdown.Item>
            <Dropdown.Item onClick={onAssignTask} className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign Task</span></Dropdown.Item>
            <Dropdown.Item onClick={onAddSchedule} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Add Schedule</span></Dropdown.Item>
            <Dropdown.Item onClick={onAddActive} className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Add Active</span></Dropdown.Item>
            <Dropdown.Item onClick={onDownloadDocument} className="flex items-center gap-2"><TbDownload size={18} /> <span className="text-xs">Download Document</span></Dropdown.Item>
        </Dropdown>
    </div>
);
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(({ onInputChange }, ref) => (<DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
ItemSearch.displayName = "ItemSearch";
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<RequestFeedbackItem>[];
  filteredColumns: ColumnDef<RequestFeedbackItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<RequestFeedbackItem>[]>>;
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
        <ItemSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
          <div className="flex flex-col p-2">
            <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
            {columns.map((col) => {
              const id = col.id || col.accessorKey as string;
              return col.header && (
                <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2">
                  <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>
                    {col.header as string}
                  </Checkbox>
                </div>
              );
            })}
          </div>
        </Dropdown>
        <Tooltip title="Clear Filters"><Button icon={<TbReload />} onClick={onClearFilters}></Button></Tooltip>
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">
          Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
        </Button>
        <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
      </div>
    </div>
  );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const { filterType, filterStatus, filterRating } = filterData;
  if (!filterType?.length && !filterStatus?.length && !filterRating?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {filterType?.map(item => <Tag key={`type-${item.value}`} prefix>Type: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterType', item.value)} /></Tag>)}
      {filterStatus?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatus', item.value)} /></Tag>)}
      {filterRating?.map(item => <Tag key={`rating-${item.value}`} prefix>Rating: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterRating', item.value)} /></Tag>)}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};


type RequestFeedbacksTableProps = { columns: ColumnDef<RequestFeedbackItem>[]; data: RequestFeedbackItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: RequestFeedbackItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: RequestFeedbackItem) => void; onAllRowSelect: (checked: boolean, rows: Row<RequestFeedbackItem>[]) => void; };
const RequestFeedbacksTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect, }: RequestFeedbacksTableProps) => (<DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} />);
type RequestFeedbacksSelectedFooterProps = { selectedItems: RequestFeedbackItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const RequestFeedbacksSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting, }: RequestFeedbacksSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; return (<><StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"><div className="flex items-center justify-between w-full px-4 sm:px-8"><span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold">{selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""} selected</span></span><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button></div></StickyFooter><ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Item(s)`} onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }} loading={isDeleting}><p>Are you sure you want to delete the selected item(s)? This action cannot be undone.</p></ConfirmDialog></>); };

const RequestAndFeedbackListing = () => {
  const dispatch = useAppDispatch();
  const { requestFeedbacksData = { data: [], counts: {} }, status: masterLoadingStatus = "idle", getAllUserData = [] } = useSelector(masterSelector, shallowEqual);
  const { user } = useSelector(authSelector);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RequestFeedbackItem | null>(null);
  const [viewingItem, setViewingItem] = useState<RequestFeedbackItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RequestFeedbackItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<RequestFeedbackItem[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  // --- ADDED for Image Viewer ---
  const [imageView, setImageView] = useState('');
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  // --- States for individual modals ---
  const [actionTargetItem, setActionTargetItem] = useState<RequestFeedbackItem | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  const openImageViewer = useCallback((path: string | null | undefined) => {
    if (path) {
      setImageView(path);
      setIsImageViewerOpen(true);
    } else {
      toast.push(<Notification title="No Image" type="info">User has no profile picture.</Notification>);
    }
  }, []);

  const closeImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
    setImageView('');
  }, []);

  const formatCustomDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return dayjs(dateStr).format("D MMM YYYY, h:mm A");
  };

  // --- Direct Action Handlers (Email & WhatsApp) ---
  const handleSendEmail = useCallback((item: RequestFeedbackItem) => {
      const subject = `Regarding your ${item.type}: ${item.subject || `(ID: ${item.id})`}`;
      const body = `Dear ${item.name},\n\n`;
      window.open(`mailto:${item.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      toast.push(<Notification type="success" title="Opening Email Client" />);
  }, []);

  const handleSendWhatsapp = useCallback((item: RequestFeedbackItem) => {
      const phone = item.mobile_no?.replace(/\D/g, "");
      if (!phone) {
          toast.push(<Notification type="danger" title="Invalid Phone Number" />);
          return;
      }
      const message = `Hi ${item.name}, regarding your recent ${item.type} (ID: ${item.id})...`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
      toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
  }, []);

  // --- Handlers for Dialog-based Modals ---
  const openNotificationModal = useCallback((item: RequestFeedbackItem) => { setActionTargetItem(item); setIsNotificationModalOpen(true); }, []);
  const closeNotificationModal = useCallback(() => { setActionTargetItem(null); setIsNotificationModalOpen(false); }, []);

  const openTaskModal = useCallback((item: RequestFeedbackItem) => { setActionTargetItem(item); setIsTaskModalOpen(true); }, []);
  const closeTaskModal = useCallback(() => { setActionTargetItem(null); setIsTaskModalOpen(false); }, []);

  const openScheduleModal = useCallback((item: RequestFeedbackItem) => { setActionTargetItem(item); setIsScheduleModalOpen(true); }, []);
  const closeScheduleModal = useCallback(() => { setActionTargetItem(null); setIsScheduleModalOpen(false); }, []);

  const openActivityModal = useCallback((item: RequestFeedbackItem) => { setActionTargetItem(item); setIsActivityModalOpen(true); }, []);
  const closeActivityModal = useCallback(() => { setActionTargetItem(null); setIsActivityModalOpen(false); }, []);

  const openDocumentModal = useCallback((item: RequestFeedbackItem) => { setActionTargetItem(item); setIsDocumentModalOpen(true); }, []);
  const closeDocumentModal = useCallback(() => { setActionTargetItem(null); setIsDocumentModalOpen(false); }, []);
  
  // --- Action Submission Handlers ---
  const handleConfirmNotification = async (formData: NotificationFormData) => { if (!actionTargetItem) return; setIsSubmittingAction(true); const payload = { send_users: formData.send_users, notification_title: formData.notification_title, message: formData.message, module_id: String(actionTargetItem.id), module_name: 'RequestFeedback', }; try { await dispatch(addNotificationAction(payload)).unwrap(); toast.push(<Notification type="success" title="Notification Sent Successfully!" />); closeNotificationModal(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsSubmittingAction(false); } };
  const handleConfirmTask = async (data: TaskFormData) => { if (!actionTargetItem) return; setIsSubmittingAction(true); try { const payload = { ...data, due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined, module_id: String(actionTargetItem.id), module_name: 'RequestFeedback', }; await dispatch(addTaskAction(payload)).unwrap(); toast.push(<Notification type="success" title="Task Assigned!" />); closeTaskModal(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Assign Task" children={error?.message || 'An error occurred.'} />); } finally { setIsSubmittingAction(false); } };
  const handleConfirmSchedule = async (data: ScheduleFormData) => { if (!actionTargetItem) return; setIsSubmittingAction(true); const payload = { module_id: Number(actionTargetItem.id), module_name: 'RequestFeedback', event_title: data.event_title, event_type: data.event_type, date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'), ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }), notes: data.notes || '', }; try { await dispatch(addScheduleAction(payload)).unwrap(); toast.push(<Notification type="success" title="Event Scheduled" />); closeScheduleModal(); } catch (error: any) { toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An error occurred.'} />); } finally { setIsSubmittingAction(false); } };
  const handleConfirmActivity = async (data: ActivityFormData) => { if (!actionTargetItem || !user?.id) return; setIsSubmittingAction(true); const payload = { item: data.item, notes: data.notes || '', module_id: String(actionTargetItem.id), module_name: 'RequestFeedback', user_id: user.id, }; try { await dispatch(addAllActionAction(payload)).unwrap(); toast.push(<Notification type="success" title="Activity Added" />); closeActivityModal(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Add Activity" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsSubmittingAction(false); } };

  const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((b: any) => ({ value: b.id, label: b.name })) : [], [getAllUserData]);
  useEffect(() => { dispatch(getRequestFeedbacksAction()); dispatch(getAllUsersAction()) }, [dispatch]);
  const formMethods = useForm<RequestFeedbackFormData>({ resolver: zodResolver(requestFeedbackFormSchema), mode: "onChange", });
  const { control, handleSubmit, reset, formState: { errors, isValid }, } = formMethods;
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange", });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria, });
  const defaultFormValues: RequestFeedbackFormData = useMemo(() => ({ name: "", email: "", mobile_no: "", company_name: "", feedback_details: "", type: TYPE_OPTIONS[0]?.value as RequestFeedbackType, status: STATUS_OPTIONS_FORM[0]?.value, subject: "", rating: null, attachment: undefined, }), []);
  const openAddDrawer = useCallback(() => { reset(defaultFormValues); setSelectedFile(null); setRemoveExistingAttachment(false); setEditingItem(null); setIsAddDrawerOpen(true); }, [reset, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
  const openEditDrawer = useCallback((item: RequestFeedbackItem) => { setEditingItem(item); setSelectedFile(null); setRemoveExistingAttachment(false); reset({ name: item.name, email: item.email, mobile_no: item.mobile_no, company_name: item.company_name || "", feedback_details: item.feedback_details, type: item.type, status: item.status as RequestFeedbackFormStatus, subject: item.subject || "", rating: item.rating ? String(item.rating) : null, attachment: undefined, }); setIsEditDrawerOpen(true); }, [reset]);
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);
  const openViewDialog = useCallback((item: RequestFeedbackItem) => setViewingItem(item), []);
  const closeViewDialog = useCallback(() => setViewingItem(null), []);
  const onSubmitHandler = async (data: RequestFeedbackFormData) => { setIsSubmitting(true); const formData = new FormData(); Object.keys(data).forEach((key) => { const value = data[key as keyof RequestFeedbackFormData]; if (key === "attachment") return; if (value !== null && value !== undefined && value !== "") { formData.append(key, String(value)); } }); if (editingItem) { formData.append("_method", "PUT"); formData.append("customer_id", String(editingItem.customer_id)); if (selectedFile instanceof File) { formData.append("attachment", selectedFile); } else if (removeExistingAttachment && editingItem.attachment) { formData.append("delete_attachment", "true"); } } else { formData.append("customer_id", "0"); if (selectedFile instanceof File) { formData.append("attachment", selectedFile); } } try { if (editingItem) { await dispatch(editRequestFeedbackAction({ id: editingItem.id, formData })).unwrap(); toast.push(<Notification title="Entry Updated" type="success" />); closeEditDrawer(); } else { await dispatch(addRequestFeedbackAction(formData)).unwrap(); toast.push(<Notification title="Entry Added" type="success" />); closeAddDrawer(); } dispatch(getRequestFeedbacksAction()); } catch (e: any) { const errorMessage = e?.response?.data?.message || e?.message || (editingItem ? "Update Failed" : "Add Failed"); toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{errorMessage}</Notification>); } finally { setIsSubmitting(false); setRemoveExistingAttachment(false); setSelectedFile(null); } };
  const handleDeleteClick = useCallback((item: RequestFeedbackItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteRequestFeedbackAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Entry Deleted" type="success">{`Entry from "${itemToDelete.name}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id)); dispatch(getRequestFeedbacksAction()); } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>); } finally { setIsDeleting(false); setItemToDelete(null); } }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const idsToDelete = selectedItems.map((item) => String(item.id)); try { await dispatch(deleteAllRequestFeedbacksAction({ ids: idsToDelete.join(",") })).unwrap(); toast.push(<Notification title="Deletion Successful" type="success">{`${idsToDelete.length} item(s) deleted.`}</Notification>); setSelectedItems([]); dispatch(getRequestFeedbacksAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{(e as Error).message}</Notification>); } finally { setIsDeleting(false); } }, [dispatch, selectedItems]);
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer]);
  const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); }, [filterFormMethods]);

  const handleCardClick = useCallback((status?: RequestFeedbackFormStatus | 'all') => {
    onClearFilters();
    if (status && status !== 'all') {
      const statusOption = STATUS_OPTIONS_FORM.find(opt => opt.value === status);
      if (statusOption) {
        setFilterCriteria({ filterStatus: [statusOption] });
      }
    }
  }, [onClearFilters]);

  const handleRemoveFilter = (key: keyof FilterFormData, value: string) => {
    setFilterCriteria(prev => {
      const newFilters = { ...prev };
      const currentValues = prev[key] as { value: string; label: string }[] | undefined;
      if (currentValues) {
        const newValues = currentValues.filter(item => item.value !== value);
        (newFilters as any)[key] = newValues.length > 0 ? newValues : undefined;
      }
      return newFilters;
    });
    setTableData(prev => ({ ...prev, pageIndex: 1 }));
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => { let processedData: RequestFeedbackItem[] = cloneDeep(Array.isArray(requestFeedbacksData?.data) ? requestFeedbacksData?.data : []); if (filterCriteria.filterType?.length) { const v = filterCriteria.filterType.map((o) => o.value); processedData = processedData.filter((item) => v.includes(item.type)); } if (filterCriteria.filterStatus?.length) { const v = filterCriteria.filterStatus.map((o) => o.value); processedData = processedData.filter((item) => v.includes(item.status)); } if (filterCriteria.filterRating?.length) { const v = filterCriteria.filterRating.map((o) => o.value); processedData = processedData.filter((item) => v.includes(String(item.rating || ""))); } if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter((item) => String(item.id).toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q) || item.mobile_no.toLowerCase().includes(q) || (item.company_name && item.company_name.toLowerCase().includes(q)) || (item.subject && item.subject.toLowerCase().includes(q)) || item.feedback_details.toLowerCase().includes(q)); } const { order, key } = tableData.sort as OnSortParam; if (order && key && typeof key === "string") { processedData.sort((a, b) => { const aVal = a[key as keyof RequestFeedbackItem]; const bVal = b[key as keyof RequestFeedbackItem]; if (key === "created_at" || key === "updated_at") { return order === "asc" ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime(); } const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase(); return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr); }); } const dataToExport = [...processedData]; const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize; return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: dataToExport, }; }, [requestFeedbacksData?.data, tableData, filterCriteria]);
  const activeFilterCount = useMemo(() => { return Object.values(filterCriteria).filter(value => Array.isArray(value) && value.length > 0).length; }, [filterCriteria]);

  const handleOpenExportReasonModal = useCallback(() => { if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); }, [allFilteredAndSortedData, exportReasonFormMethods]);
  const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const moduleName = "Request & Feedback"; const timestamp = new Date().toISOString().split("T")[0]; const fileName = `request_feedbacks_export_${timestamp}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName, })).unwrap(); toast.push(<Notification title="Export Reason Submitted" type="success" />); exportRequestFeedbacksToCsv(fileName, allFilteredAndSortedData); toast.push(<Notification title="Data Exported" type="success">Request & Feedback data exported.</Notification>); setIsExportReasonModalOpen(false); } catch (error: any) { toast.push(<Notification title="Operation Failed" type="danger" >{(error as Error).message || "Could not complete export."}</Notification>); } finally { setIsSubmittingExportReason(false); } }, [dispatch, allFilteredAndSortedData, exportReasonFormMethods]);
  const handlePaginationChange = useCallback((page: number) => setTableData((prev) => ({ ...prev, pageIndex: page })), []);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 1, })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData((prev) => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleSearchInputChange = useCallback((query: string) => { setTableData((prev) => ({ ...prev, query: query, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: RequestFeedbackItem) => { setSelectedItems((prev) => checked ? prev.some((item) => item.id === row.id) ? prev : [...prev, row] : prev.filter((item) => item.id !== row.id)); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<RequestFeedbackItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<RequestFeedbackItem>[] = useMemo(() => [
    { header: "User Info", accessorKey: "name", size: 180, cell: (props: CellContext<RequestFeedbackItem, unknown>) => (<div className="flex items-center gap-2"><Avatar size="sm" shape="circle" className="mr-1">{props.row.original.name?.[0]?.toUpperCase()}</Avatar><div className="flex flex-col gap-0.5 text-xs"><span className="font-semibold text-sm">{props.row.original.name || "N/A"}</span><span className="text-gray-600 dark:text-gray-400">{props.row.original.email || "N/A"}</span><span className="text-gray-600 dark:text-gray-400">{props.row.original.mobile_no || "N/A"}</span></div></div>), },
    { header: "Type", accessorKey: "type", size: 100, cell: (props) => (<Tag className="capitalize">{TYPE_OPTIONS.find((t) => t.value === props.getValue())?.label || props.getValue() || "N/A"}</Tag>), },
    { header: "Subject", accessorKey: "subject", size: 200, cell: (props) => (<div className="truncate w-48" title={props.getValue() as string}>{(props.getValue() as string) || "N/A"}</div>), },
    { header: "Status", accessorKey: "status", size: 110, cell: (props) => { const s = props.getValue<RequestFeedbackApiStatus>(); return (<Tag className={classNames("capitalize whitespace-nowrap  text-center", statusColors[s] || statusColors.default)}>{STATUS_OPTIONS_FORM.find((opt) => opt.value === s)?.label || s || "N/A"}</Tag>); }, },
    { header: "Rating", accessorKey: "rating", size: 90, cell: (props) => props.getValue() ? (<span className="flex items-center gap-1"><TbStar className="text-amber-500" />{`${props.getValue()}`}</span>) : ("N/A"), },
    {
      header: 'Updated Info', accessorKey: 'updated_at', enableSorting: true, size: 220, cell: props => {
        const { updated_at, updated_by_user } = props.row.original;
        return (
          <div className="flex items-center gap-2">
            <Tooltip title="View Profile Picture">
              <Avatar
                src={updated_by_user?.profile_pic_path}
                shape="circle"
                size="sm"
                icon={<TbUserCircle />}
                className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                onClick={() => openImageViewer(updated_by_user?.profile_pic_path)}
              />
            </Tooltip>
            <div>
              <span className='font-semibold'>{updated_by_user?.name || 'N/A'}</span>
              <div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div>
              <div className="text-xs text-gray-500">{formatCustomDateTime(updated_at)}</div>
            </div>
          </div>
        );
      }
    },
    {
        header: "Actions", id: "actions", meta: { headerClass: "text-center", cellClass: "text-center" }, size: 100,
        cell: (props) => (
            <ItemActionColumn
                onEdit={() => openEditDrawer(props.row.original)}
                onViewDetail={() => openViewDialog(props.row.original)}
                onSendEmail={() => handleSendEmail(props.row.original)}
                onSendWhatsapp={() => handleSendWhatsapp(props.row.original)}
                onAddNotification={() => openNotificationModal(props.row.original)}
                onAssignTask={() => openTaskModal(props.row.original)}
                onAddSchedule={() => openScheduleModal(props.row.original)}
                onAddActive={() => openActivityModal(props.row.original)}
                onDownloadDocument={() => openDocumentModal(props.row.original)}
            />
        ),
    },
  ], [
    openEditDrawer, openViewDialog, openImageViewer, handleDeleteClick,
    handleSendEmail, handleSendWhatsapp, openNotificationModal, openTaskModal,
    openScheduleModal, openActivityModal, openDocumentModal
  ]);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<RequestFeedbackItem>[]>(columns);

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"><FormItem label={<div>Name<span className="text-red-500"> *</span></div>} invalid={!!errors.name} errorMessage={errors.name?.message}><Controller name="name" control={control} render={({ field }) => (<Input {...field} prefix={<TbUserCircle />} placeholder="Full Name" />)} /></FormItem><FormItem label={<div>Email<span className="text-red-500"> *</span></div>} invalid={!!errors.email} errorMessage={errors.email?.message}><Controller name="email" control={control} render={({ field }) => (<Input {...field} type="email" prefix={<TbMail />} placeholder="example@domain.com" />)} /></FormItem><FormItem label={<div>Mobile No.<span className="text-red-500"> *</span></div>} invalid={!!errors.mobile_no} errorMessage={errors.mobile_no?.message}><Controller name="mobile_no" control={control} render={({ field }) => (<Input {...field} type="tel" prefix={<TbPhone />} placeholder="+XX XXXXXXXXXX" />)} /></FormItem><FormItem label="Company Name" invalid={!!errors.company_name} errorMessage={errors.company_name?.message}><Controller name="company_name" control={control} render={({ field }) => (<Input {...field} prefix={<TbBuilding />} placeholder="Your Company" />)} /></FormItem><FormItem label={<div>Type<span className="text-red-500"> *</span></div>} invalid={!!errors.type} errorMessage={errors.type?.message}><Controller name="type" control={control} render={({ field }) => (<Select placeholder="Select Type" options={TYPE_OPTIONS} value={TYPE_OPTIONS.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbMessageDots />} />)} /></FormItem><FormItem label={<div>Status<span className="text-red-500"> *</span></div>} invalid={!!errors.status} errorMessage={errors.status?.message}><Controller name="status" control={control} render={({ field }) => (<Select placeholder="Select Status" options={STATUS_OPTIONS_FORM} value={STATUS_OPTIONS_FORM.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbToggleRight />} />)} /></FormItem><FormItem label="Subject" className="md:col-span-2" invalid={!!errors.subject} errorMessage={errors.subject?.message}><Controller name="subject" control={control} render={({ field }) => (<Input {...field} prefix={<TbClipboardText />} placeholder="Brief subject of your message" />)} /></FormItem><FormItem label="Rating" className="md:col-span-2" invalid={!!errors.rating} errorMessage={errors.rating?.message}><Controller name="rating" control={control} render={({ field }) => (<Select placeholder="Select Rating (Optional)" options={RATING_OPTIONS} value={RATING_OPTIONS.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbStar />} />)} /></FormItem><FormItem label={<div>Feedback / Request Details<span className="text-red-500"> *</span></div>} className="md:col-span-2" invalid={!!errors.feedback_details} errorMessage={errors.feedback_details?.message}><Controller name="feedback_details" control={control} render={({ field }) => (<Input textArea {...field} rows={5} placeholder="Describe your feedback or request in detail..." />)} /></FormItem><FormItem label="Attachment (Optional)" className="md:col-span-2" invalid={!!errors.attachment} errorMessage={errors.attachment?.message as string}><Controller name="attachment" control={control} render={({ field: { onChange, onBlur, name, ref } }) => (<Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e) => { const file = e.target.files?.[0]; onChange(file); setSelectedFile(file || null); if (file) setRemoveExistingAttachment(false); }} prefix={<TbPaperclip />} />)} />{editingItem?.attachment && !selectedFile && (<div className="mt-2 text-sm text-gray-500 flex items-center justify-between"><span className="truncate max-w-[calc(100%-100px)]">Current: <a href={itemPathUtil(editingItem.attachment)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={editingItem.attachment.split("/").pop()}>{editingItem.attachment.split("/").pop()}</a></span>{!removeExistingAttachment && (<Button size="xs" variant="plain" className="text-red-500 hover:text-red-700 whitespace-nowrap" onClick={() => { setRemoveExistingAttachment(true); }}>Remove</Button>)}{removeExistingAttachment && (<span className="text-red-500 text-xs whitespace-nowrap">Marked for removal</span>)}</div>)}{selectedFile && (<div className="mt-1 text-xs text-gray-500">New file selected: {selectedFile.name}</div>)}</FormItem></div>);
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";

  return (<>
    <Container className="h-auto"><AdaptiveCard className="h-full" bodyClass="h-full"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"><h5 className="mb-2 sm:mb-0">Requests & Feedbacks</h5><Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
      <Tooltip title="Click to show all entries"><div onClick={() => handleCardClick('all')}><Card bodyClass="flex gap-2 p-2" className={classNames(cardClass, "border-blue-200 dark:border-blue-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-200"><TbUserQuestion size={24} /></div><div><h6 className="text-blue-500 dark:text-blue-200">{requestFeedbacksData?.counts?.total || 0}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
      <Tooltip title="Click to show Unread entries"><div onClick={() => handleCardClick('Unread')}><Card bodyClass="flex gap-2 p-2" className={classNames(cardClass, "border-green-300 dark:border-green-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-200"><TbEyeClosed size={24} /></div><div><h6 className="text-green-500 dark:text-green-200">{requestFeedbacksData?.counts?.unread || 0}</h6><span className="font-semibold text-xs">Unread</span></div></Card></div></Tooltip>
      <Tooltip title="Click to show Resolved entries"><div onClick={() => handleCardClick('Resolved')}><Card bodyClass="flex gap-2 p-2" className={classNames(cardClass, "border-pink-200 dark:border-pink-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 dark:bg-pink-500/20 text-pink-500 dark:text-pink-200"><TbBellMinus size={24} /></div><div><h6 className="text-pink-500 dark:text-pink-200">{requestFeedbacksData?.counts?.resolved || 0}</h6><span className="font-semibold text-xs">Resolved</span></div></Card></div></Tooltip>
      <Tooltip title="Click to show In Progress entries"><div onClick={() => handleCardClick('In Progress')}><Card bodyClass="flex gap-2 p-2" className={classNames(cardClass, "border-red-200 dark:border-red-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-200"><TbPencilPin size={24} /></div><div><h6 className="text-red-500 dark:text-red-200">{requestFeedbacksData?.counts?.pending || 0}</h6><span className="font-semibold text-xs">Pending</span></div></Card></div></Tooltip>
      <Tooltip title="Average resolution time"><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-300 dark:border-violet-700/60 cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 text-violet-500 dark:text-violet-200"><TbFileTime size={24} /></div><div><h6 className="text-violet-500 dark:text-violet-200">{requestFeedbacksData?.counts?.avg_time || 0}</h6><span className="font-semibold text-xs">Avg Time</span></div></Card></Tooltip>
      <Tooltip title="Average customer rating"><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200 dark:border-orange-700/60 cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 dark:bg-orange-500/20 text-orange-500 dark:text-orange-200"><TbStars size={24} /></div><div><h6 className="text-orange-500 dark:text-orange-200">{requestFeedbacksData?.counts?.avg_rating || 0}</h6><span className="font-semibold text-xs">Avg Rating </span></div></Card></Tooltip>
    </div>
      <div className="mb-4">
        <ItemTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchInputChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
      </div>
      <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
      <div className="mt-4"><RequestFeedbacksTable columns={filteredColumns} data={pageData} loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number, }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /></div></AdaptiveCard></Container>
    <RequestFeedbacksSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
    <Drawer title={editingItem ? "Edit Entry" : "Add New Entry"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={520} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button><Button size="sm" variant="solid" form="requestFeedbackForm" type="submit" loading={isSubmitting} disabled={!isValid || isSubmitting}>{isSubmitting ? editingItem ? "Saving..." : "Adding..." : editingItem ? "Save Changes" : "Submit Entry"}</Button></div>}>
      <Form id="requestFeedbackForm" onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-4"> {renderDrawerForm(formMethods)} {editingItem && (<div className=""><div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3"><div><b className="mt-3 mb-3 font-semibold text-primary-600 dark:text-primary-400">Latest Update:</b><br /><p className="text-sm font-semibold">{editingItem.updated_by_user?.name || "N/A"}</p><p>{editingItem.updated_by_user?.roles?.[0]?.display_name || "N/A"}</p></div><div className="text-right"><br /><span className="font-semibold">Created At:</span> <span>{editingItem.created_at ? new Date(editingItem.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, }) : "N/A"}</span><br /><span className="font-semibold">Updated At:</span> <span>{editingItem.updated_at ? new Date(editingItem.updated_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, }) : "N/A"}</span></div></div></div>)}</Form>
    </Drawer>
    <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={600}><div className="p-1"><h5 className="mb-6 border-b pb-4 dark:border-gray-600">Details: {viewingItem?.subject || `Entry by ${viewingItem?.name}`}</h5>{viewingItem && (<div className="space-y-3 text-sm"><div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">ID:</span><span className="w-2/3">{viewingItem.id}</span></div><div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Customer ID:</span><span className="w-2/3">{viewingItem.customer_id === "0" ? "N/A (Guest)" : viewingItem.customer_id}</span></div><div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Name:</span><span className="w-2/3">{viewingItem.name}</span></div><div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Email:</span><span className="w-2/3">{viewingItem.email}</span></div><div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Mobile No:</span><span className="w-2/3">{viewingItem.mobile_no || "N/A"}</span></div><div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Company:</span><span className="w-2/3">{viewingItem.company_name || "N/A"}</span></div><div className="flex items-center"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Type:</span><Tag className="capitalize">{TYPE_OPTIONS.find((t) => t.value === viewingItem.type)?.label || viewingItem.type}</Tag></div><div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Subject:</span><span className="w-2/3">{viewingItem.subject || "N/A"}</span></div><div className="flex items-center"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Status:</span><Tag className={classNames("capitalize", statusColors[viewingItem.status] || statusColors.default)}>{STATUS_OPTIONS_FORM.find((s) => s.value === viewingItem.status)?.label || viewingItem.status}</Tag></div><div className="flex items-center"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Rating:</span><span className="w-2/3 flex items-center gap-1">{viewingItem.rating ? (<><TbStar className="text-amber-500" /> {RATING_OPTIONS.find((r) => r.value === String(viewingItem.rating))?.label || `${viewingItem.rating} Stars`}</>) : ("N/A")}</span></div>{viewingItem.attachment && (<div className="flex items-start"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200 pt-1">Attachment:</span><span className="w-2/3"><a href={itemPathUtil(viewingItem.attachment)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{viewingItem.attachment.split("/").pop()}</a></span></div>)}<div className="flex flex-col"><span className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Details:</span><p className="w-full bg-gray-50 dark:bg-gray-700/60 p-3 rounded whitespace-pre-wrap break-words">{viewingItem.feedback_details}</p></div><div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Reported On:</span><span className="w-2/3">{new Date(viewingItem.created_at).toLocaleString()}</span></div><div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Last Updated:</span><span className="w-2/3">{new Date(viewingItem.updated_at).toLocaleString()}</span></div></div>)}<div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div></div></Dialog>
    <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterReqFeedbackForm" type="submit">Apply</Button></div>}>
      <Form id="filterReqFeedbackForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4"><FormItem label="Type"><Controller name="filterType" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Type" options={TYPE_OPTIONS} value={field.value || []} onChange={(val: any) => field.onChange(val || [])} />)} /></FormItem><FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Status" options={STATUS_OPTIONS_FORM} value={field.value || []} onChange={(val: any) => field.onChange(val || [])} />)} /></FormItem><FormItem label="Rating"><Controller name="filterRating" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Rating" options={RATING_OPTIONS} value={field.value || []} onChange={(val: any) => field.onChange(val || [])} />)} /></FormItem></Form>
    </Drawer>
    <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Entry" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}><p>Are you sure you want to delete the entry from "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p></ConfirmDialog>
    <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason, }}>
      <Form id="exportRequestFeedbackReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2"><FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form>
    </ConfirmDialog>
    
    {/* --- Conditionally rendered dialogs for actions --- */}
    {isNotificationModalOpen && actionTargetItem && (
        <AddNotificationDialog
            item={actionTargetItem}
            onClose={closeNotificationModal}
            userOptions={getAllUserDataOptions}
            onSubmit={handleConfirmNotification}
            isLoading={isSubmittingAction}
        />
    )}
    {isTaskModalOpen && actionTargetItem && (
        <AssignTaskDialog
            item={actionTargetItem}
            onClose={closeTaskModal}
            userOptions={getAllUserDataOptions}
            onSubmit={handleConfirmTask}
            isLoading={isSubmittingAction}
        />
    )}
    {isScheduleModalOpen && actionTargetItem && (
        <AddScheduleDialog 
            item={actionTargetItem}
            onClose={closeScheduleModal}
            onSubmit={handleConfirmSchedule}
            isLoading={isSubmittingAction}
        />
    )}
    {isActivityModalOpen && actionTargetItem && (
        <AddActivityDialog
            item={actionTargetItem}
            onClose={closeActivityModal}
            onSubmit={handleConfirmActivity}
            isLoading={isSubmittingAction}
        />
    )}
    {isDocumentModalOpen && actionTargetItem && (
        <DownloadDocumentDialog item={actionTargetItem} onClose={closeDocumentModal} />
    )}

    {/* --- Image Viewer Dialog --- */}
    <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} width={600}>
      <div className="flex justify-center items-center p-4">{imageView ? <img src={imageView} alt="User" className="max-w-full max-h-[80vh]" /> : <p>No image.</p>}</div>
    </Dialog>
  </>);
};

export default RequestAndFeedbackListing;