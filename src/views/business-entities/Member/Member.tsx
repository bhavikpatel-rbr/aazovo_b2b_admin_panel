import { zodResolver } from "@hookform/resolvers/zod";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  Form as UiForm,
  FormItem as UiFormItem,
  Input,
  Select,
  Select as UiSelect,
  Table,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbAlarm,
  TbAlertTriangle,
  TbBell,
  TbBrandWhatsapp,
  TbCalendar,
  TbCalendarEvent,
  TbChecks,
  TbClipboardText,
  TbCloudUpload,
  TbColumns,
  TbDownload,
  TbEye,
  TbFileSearch,
  TbFileText,
  TbFileZip,
  TbFilter,
  TbInfoCircle,
  TbKey,
  TbLink,
  TbMail,
  TbMessageReport,
  TbPencil,
  TbPlus,
  TbReload,
  TbSearch,
  TbTagStarred,
  TbUser,
  TbUserCancel,
  TbUserCheck,
  TbUserCircle,
  TbUserExclamation,
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
import FormItem from "@/components/ui/Form/FormItem";
import Td from "@/components/ui/Table/Td";
import Tr from "@/components/ui/Table/Tr";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addScheduleAction,
  deleteAllMemberAction,
  getMemberAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import cloneDeep from "lodash/cloneDeep";
import dayjs from "dayjs";
import { MdCheckCircle } from "react-icons/md";
import { useSelector } from "react-redux";

// --- MemberData Type (FormItem) ---
export type FormItem = {
  id: string;
  member_name: string;
  member_contact_number: string;
  member_email_id: string;
  member_photo: string;
  member_photo_upload: string;
  member_role: string;
  member_status: "active" | "inactive" | "Active" | "Disabled" | "Unregistered";
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
  health_score?: number;
  [key: string]: any;
};

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterContinent: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterBusinessType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterState: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterInterestedFor: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterInterestedCategory: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterBrand: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterKycVerified: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterBusinessOpportunity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCountry: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDealing: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  memberGrade: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Zod Schema for Schedule Form ---
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS = ["Member ID", "Name", "Email", "Contact Number", "Company Name", "Company ID", "Status", "Joined Date", "Business Type", "Business Opportunity", "Member Grade", "Interested In", "Brands", "Location", "Profile Completion (%)"];
type MemberExportItem = { id: string; member_name: string; member_email_id: string; member_contact_number: string; company_name: string; company_id_actual: string; status: string; created_at_formatted: string; business_type: string; business_opportunity: string; member_grade: string; interested_in: string; associated_brands_str: string; member_location: string; profile_completion: number; };
const CSV_KEYS_EXPORT: (keyof MemberExportItem)[] = ["id", "member_name", "member_email_id", "member_contact_number", "company_name", "company_id_actual", "status", "created_at_formatted", "business_type", "business_opportunity", "member_grade", "interested_in", "associated_brands_str", "member_location", "profile_completion"];

function exportToCsv(filename: string, rows: FormItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const transformedRows: MemberExportItem[] = rows.map((row) => ({ id: row.id, member_name: row.name || "N/A", member_email_id: row.email || "N/A", member_contact_number: row.number || "N/A", company_name: row.company_name || "N/A", company_id_actual: row.company_id_actual || "N/A", status: row.status || "N/A", created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB") : "N/A", business_type: row.business_type || "N/A", business_opportunity: row.business_opportunity || "N/A", member_grade: row.member_grade || "N/A", interested_in: row.interested_in || "N/A", associated_brands_str: Array.isArray(row.associated_brands) ? row.associated_brands.join(", ") : "N/A", member_location: row.country?.name || "N/A", profile_completion: row.profile_completion || 0, }));
  const separator = ",";
  const csvContent = CSV_HEADERS.join(separator) + "\n" + transformedRows.map((row) => { return CSV_KEYS_EXPORT.map((k) => { let cell: any = row[k as keyof MemberExportItem]; if (cell === null || cell === undefined) { cell = ""; } else { cell = String(cell).replace(/"/g, '""'); } if (String(cell).search(/("|,|\n)/g) >= 0) { cell = `"${cell}"`; } return cell; }).join(separator); }).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;", });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- MODALS SECTION ---
export type MemberModalType = "email" | "whatsapp" | "notification" | "task" | "active" | "calendar" | "alert" | "trackRecord" | "engagement" | "document" | "feedback" | "wallLink" | "viewDetail" | "resetPassword";
export interface MemberModalState { isOpen: boolean; type: MemberModalType | null; data: FormItem | null; }
interface MemberModalsProps { modalState: MemberModalState; onClose: () => void; }

const dummyUsers = [{ value: "user1", label: "Alice Johnson" }, { value: "user2", label: "Bob Williams" }, { value: "user3", label: "Charlie Brown" }];
const priorityOptions = [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }];
const eventTypeOptions = [{ value: "Meeting", label: "Meeting" }, { value: "Call", label: "Follow-up Call" }, { value: "Deadline", label: "Project Deadline" }, { value: "Reminder", label: "Reminder" }];
const dummyAlerts = [{ id: 1, severity: "danger", message: "KYC verification failed. Please re-submit documents.", time: "2 days ago", }, { id: 2, severity: "warning", message: "Membership renewal is due in 7 days.", time: "5 days ago", }];
const dummyTimeline = [{ id: 1, icon: <TbMail />, title: "Email Sent", desc: "Sent welcome email and onboarding guide.", time: "2023-11-01", }, { id: 2, icon: <TbCalendar />, title: "Onboarding Call Scheduled", desc: "Scheduled a call to discuss platform features.", time: "2023-10-28", }, { id: 3, icon: <TbUser />, title: "Member Joined", desc: "Initial registration completed.", time: "2023-10-27", }];
const dummyDocs = [{ id: "doc1", name: "ID_Proof_Passport.pdf", type: "pdf", size: "1.8 MB", }, { id: "doc2", name: "Company_Registration.zip", type: "zip", size: "5.2 MB", }];

const MemberModals: React.FC<MemberModalsProps> = ({ modalState, onClose, }) => { const { type, data: member, isOpen } = modalState; if (!isOpen || !member) return null; const renderModalContent = () => { switch (type) { case "email": return <SendEmailDialog member={member} onClose={onClose} />; case "whatsapp": return <SendWhatsAppDialog member={member} onClose={onClose} />; case "notification": return <AddNotificationDialog member={member} onClose={onClose} />; case "task": return <AssignTaskDialog member={member} onClose={onClose} />; case "calendar": return <AddScheduleDialog member={member} onClose={onClose} />; case "alert": return <ViewAlertDialog member={member} onClose={onClose} />; case "trackRecord": return <TrackRecordDialog member={member} onClose={onClose} />; case "engagement": return <ViewEngagementDialog member={member} onClose={onClose} />; case "document": return <DownloadDocumentDialog member={member} onClose={onClose} />; case "viewDetail": return <ViewMemberDetailDialog member={member} onClose={onClose} />; default: return (<GenericActionDialog type={type} member={member} onClose={onClose} />); } }; return <>{renderModalContent()}</>; };
const SendEmailDialog: React.FC<{ member: FormItem; onClose: () => void }> = ({ member, onClose, }) => { const [isLoading, setIsLoading] = useState(false); const { control, handleSubmit } = useForm({ defaultValues: { subject: "", message: "" }, }); const onSendEmail = (data: { subject: string; message: string }) => { setIsLoading(true); console.log("Sending email to", member.member_email_id, "with data:", data); setTimeout(() => { toast.push(<Notification type="success" title="Email Sent Successfully" />); setIsLoading(false); onClose(); }, 1000); }; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Send Email to {member.member_name}</h5><form onSubmit={handleSubmit(onSendEmail)}><FormItem label="Subject"><Controller name="subject" control={control} render={({ field }) => <Input {...field} />} /></FormItem><FormItem label="Message"><Controller name="message" control={control} render={({ field }) => (<RichTextEditor value={field.value} onChange={field.onChange} />)} /></FormItem><div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Send</Button></div></form></Dialog>); };
const SendWhatsAppDialog: React.FC<{ member: FormItem; onClose: () => void; }> = ({ member, onClose }) => { const { control, handleSubmit } = useForm({ defaultValues: { message: `Hi ${member.member_name}, regarding your membership...`, }, }); const onSendMessage = (data: { message: string }) => { const phone = member.member_contact_number?.replace(/\D/g, ""); if (!phone) { toast.push(<Notification type="danger" title="Invalid Phone Number" />); return; } const url = `https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`; window.open(url, "_blank"); toast.push(<Notification type="success" title="Redirecting to WhatsApp" />); onClose(); }; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Send WhatsApp to {member.member_name}</h5><form onSubmit={handleSubmit(onSendMessage)}><FormItem label="Message Template"><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem><div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit">Open WhatsApp</Button></div></form></Dialog>); };
const AddNotificationDialog: React.FC<{ member: FormItem; onClose: () => void; }> = ({ member, onClose }) => { const [isLoading, setIsLoading] = useState(false); const { control, handleSubmit } = useForm({ defaultValues: { title: "", users: [], message: "" }, }); const onSend = (data: any) => { setIsLoading(true); console.log("Sending in-app notification for", member.member_name, "with data:", data); setTimeout(() => { toast.push(<Notification type="success" title="Notification Sent" />); setIsLoading(false); onClose(); }, 1000); }; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Add Notification for {member.member_name}</h5><form onSubmit={handleSubmit(onSend)}><FormItem label="Notification Title"><Controller name="title" control={control} render={({ field }) => <Input {...field} />} /></FormItem><FormItem label="Send to Users"><Controller name="users" control={control} render={({ field }) => (<Select isMulti placeholder="Select Users" options={dummyUsers} {...field} />)} /></FormItem><FormItem label="Message"><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={3} />} /></FormItem><div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Send Notification</Button></div></form></Dialog>); };
const AssignTaskDialog: React.FC<{ member: FormItem; onClose: () => void }> = ({ member, onClose, }) => { const [isLoading, setIsLoading] = useState(false); const { control, handleSubmit } = useForm({ defaultValues: { title: "", assignee: null, dueDate: null, priority: null, description: "", }, }); const onAssignTask = (data: any) => { setIsLoading(true); console.log("Assigning task for", member.member_name, "with data:", data); setTimeout(() => { toast.push(<Notification type="success" title="Task Assigned" />); setIsLoading(false); onClose(); }, 1000); }; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Assign Task for {member.member_name}</h5><form onSubmit={handleSubmit(onAssignTask)}><FormItem label="Task Title"><Controller name="title" control={control} render={({ field }) => (<Input {...field} placeholder="e.g., Follow up on KYC" />)} /></FormItem><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormItem label="Assign To"><Controller name="assignee" control={control} render={({ field }) => (<Select placeholder="Select User" options={dummyUsers} {...field} />)} /></FormItem><FormItem label="Priority"><Controller name="priority" control={control} render={({ field }) => (<Select placeholder="Select Priority" options={priorityOptions} {...field} />)} /></FormItem></div><FormItem label="Due Date"><Controller name="dueDate" control={control} render={({ field }) => (<DatePicker placeholder="Select date" value={field.value as any} onChange={field.onChange} />)} /></FormItem><FormItem label="Description"><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem><div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Assign Task</Button></div></form></Dialog>); };
const AddScheduleDialog: React.FC<{ member: FormItem; onClose: () => void }> = ({ member, onClose }) => { const dispatch = useAppDispatch(); const [isLoading, setIsLoading] = useState(false); const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema), defaultValues: { event_title: `Meeting with ${member.member_name}`, event_type: undefined, date_time: null as any, remind_from: null, notes: `Regarding member ${member.member_name} (ID: ${member.id}).` }, mode: 'onChange', }); const onAddEvent = async (data: ScheduleFormData) => { setIsLoading(true); const payload = { module_id: Number(member.id), module_name: 'Member', event_title: data.event_title, event_type: data.event_type, date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'), ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }), notes: data.notes || '', }; try { await dispatch(addScheduleAction(payload)).unwrap(); toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for ${member.member_name}.`} />); onClose(); } catch (error: any) { toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsLoading(false); } }; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Add Schedule for {member.member_name}</h5><UiForm onSubmit={handleSubmit(onAddEvent)}><UiFormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></UiFormItem><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><UiFormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></UiFormItem><UiFormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></UiFormItem></div><UiFormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></UiFormItem><UiFormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></UiFormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div></UiForm></Dialog>); };
const ViewAlertDialog: React.FC<{ member: FormItem; onClose: () => void }> = ({ member, onClose, }) => { const alertColors: Record<string, string> = { danger: "red", warning: "amber", info: "blue", }; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}><h5 className="mb-4">Alerts for {member.member_name}</h5><div className="mt-4 flex flex-col gap-3">{dummyAlerts.length > 0 ? (dummyAlerts.map((alert) => (<div key={alert.id} className={`p-3 rounded-lg border-l-4 border-${alertColors[alert.severity]}-500 bg-${alertColors[alert.severity]}-50 dark:bg-${alertColors[alert.severity]}-500/10`}><div className="flex justify-between items-start"><div className="flex items-start gap-2"><TbAlertTriangle className={`text-${alertColors[alert.severity]}-500 mt-1`} size={20} /><p className="text-sm">{alert.message}</p></div><span className="text-xs text-gray-400 whitespace-nowrap">{alert.time}</span></div></div>))) : (<p>No active alerts.</p>)}</div><div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div></Dialog>); };
const TrackRecordDialog: React.FC<{ member: FormItem; onClose: () => void; }> = ({ member, onClose }) => { return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}><h5 className="mb-4">Track Record for {member.member_name}</h5><div className="mt-4 -ml-4">{dummyTimeline.map((item, index) => (<div key={item.id} className="flex gap-4 relative">{index < dummyTimeline.length - 1 && (<div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-600"></div>)}<div className="flex-shrink-0 z-10 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 text-gray-500 flex items-center justify-center">{React.cloneElement(item.icon, { size: 24 })}</div><div className="pb-8"><p className="font-semibold">{item.title}</p><p className="text-sm text-gray-600 dark:text-gray-300">{item.desc}</p><p className="text-xs text-gray-400 mt-1">{item.time}</p></div></div>))}</div><div className="text-right mt-2"><Button variant="solid" onClick={onClose}>Close</Button></div></Dialog>); };
const ViewEngagementDialog: React.FC<{ member: FormItem; onClose: () => void; }> = ({ member, onClose }) => { return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Engagement for {member.member_name}</h5><div className="grid grid-cols-2 gap-4 mt-4 text-center"><div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-xs text-gray-500">Last Active</p><p className="font-bold text-lg">2 days ago</p></div><div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-xs text-gray-500">Health Score</p><p className="font-bold text-lg text-green-500">{member.health_score || 85}%</p></div><div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-xs text-gray-500">Logins (30d)</p><p className="font-bold text-lg">25</p></div><div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"><p className="text-xs text-gray-500">Wall Posts</p><p className="font-bold text-lg">8</p></div></div><div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div></Dialog>); };
const DownloadDocumentDialog: React.FC<{ member: FormItem; onClose: () => void; }> = ({ member, onClose }) => { const iconMap: Record<string, React.ReactElement> = { pdf: <TbFileText className="text-red-500" />, zip: <TbFileZip className="text-amber-500" />, }; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Documents for {member.member_name}</h5><div className="flex flex-col gap-3 mt-4">{dummyDocs.map((doc) => (<div key={doc.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><div className="flex items-center gap-3">{React.cloneElement(iconMap[doc.type] || <TbClipboardText />, { size: 28, })}<div><p className="font-semibold text-sm">{doc.name}</p><p className="text-xs text-gray-400">{doc.size}</p></div></div><Tooltip title="Download"><Button shape="circle" size="sm" icon={<TbDownload />} /></Tooltip></div>))}</div><div className="text-right mt-6"><Button onClick={onClose}>Close</Button></div></Dialog>); };
const GenericActionDialog: React.FC<{ type: MemberModalType | null; member: FormItem; onClose: () => void; }> = ({ type, member, onClose }) => { const [isLoading, setIsLoading] = useState(false); const title = type ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}` : "Confirm Action"; const handleConfirm = () => { setIsLoading(true); console.log(`Performing action '${type}' for member ${member.member_name}`); setTimeout(() => { toast.push(<Notification type="success" title="Action Completed" />); setIsLoading(false); onClose(); }, 1000); }; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-2">{title}</h5><p>Are you sure you want to perform this action for{" "}<span className="font-semibold">{member.member_name}</span>?</p><div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" onClick={handleConfirm} loading={isLoading}>Confirm</Button></div></Dialog>); };
const ViewMemberDetailDialog: React.FC<{ member: any; onClose: () => void; }> = ({ member, onClose }) => { const getDisplayValue = (value: any, fallback = "N/A") => value || fallback; const joinDate = member.member_join_date || member.created_at || "N/A"; const formattedJoinDate = joinDate !== "N/A" ? new Date(joinDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", }) : "N/A"; const renderDetailItem = (label: string, value: React.ReactNode) => (<div className="mb-3"><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p><p className="text-sm font-semibold">{value === "" || value === undefined || value === null ? "N/A" : value}</p></div>); const renderListAsTags = (list: (string | number)[] | undefined | null, itemClassName = "text-xs") => { if (!list || list.length === 0) return "N/A"; return (<div className="flex flex-wrap gap-1">{list.map((item, idx) => (<Tag key={idx} className={itemClassName}>{getDisplayValue(item)}</Tag>))}</div>); }; const formatDate = (dateString: string | undefined | null, includeTime = false) => { if (!dateString) return "N/A"; try { const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', }; if (includeTime) { options.hour = '2-digit'; options.minute = '2-digit'; } return new Date(dateString).toLocaleDateString("en-GB", options); } catch (error) { console.error("Error formatting date:", dateString, error); return "Invalid Date"; } }; const renderBoolean = (value: boolean | undefined | null) => { if (value === true) return "Yes"; if (value === false) return "No"; return "N/A"; }; const renderLink = (url: string | undefined | null, text?: string) => { const displayUrl = getDisplayValue(url); if (displayUrl === "N/A") return "N/A"; const isUrl = typeof displayUrl === 'string' && (displayUrl.startsWith('http://') || displayUrl.startsWith('https://')); if (isUrl) { return (<a href={displayUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{text || displayUrl}</a>); } return displayUrl; }; const statusColorMap: Record<string, string> = { active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100', blocked: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100', inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100', unregistered: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100', }; const currentStatus = (member.status || "inactive").toLowerCase(); return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={700}><div className="p-1"><h5 className="mb-6 text-xl font-semibold">Member Details: {getDisplayValue(member.name)}</h5><div className="max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar"><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Basic Information</h6><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">{renderDetailItem("Member ID", getDisplayValue(member.id))}{renderDetailItem("Name", getDisplayValue(member.name))}{renderDetailItem("Status", <Tag className={`${statusColorMap[currentStatus] || statusColorMap["inactive"]} capitalize`}>{getDisplayValue(member.status)}</Tag>)}{renderDetailItem("Interested In", getDisplayValue(member.interested_in))}{renderDetailItem("Joined Date", formattedJoinDate)}{renderDetailItem("Last Updated At", formatDate(member.updated_at, true))}{renderDetailItem("Profile Completion", <div className="flex items-center gap-2"><span>{getDisplayValue(member.profile_completion, 0)}%</span><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 flex-grow"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${getDisplayValue(member.profile_completion, 0)}%`, }}></div></div></div>)}{renderDetailItem("Profile Picture", member.full_profile_pic ? renderLink(member.full_profile_pic, "View Image") : "N/A")}</div><hr className="my-6" /><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Contact Information</h6><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">{renderDetailItem("Primary Number", `${getDisplayValue(member.number_code)} ${getDisplayValue(member.number)}`)}{renderDetailItem("Email", getDisplayValue(member.email))}{renderDetailItem("WhatsApp Number", getDisplayValue(member.whatsApp_no))}{renderDetailItem("Alternate Contact Number", `${getDisplayValue(member.alternate_contact_number_code)} ${getDisplayValue(member.alternate_contact_number)}`)}{renderDetailItem("Landline Number", getDisplayValue(member.landline_number))}{renderDetailItem("Fax Number", getDisplayValue(member.fax_number))}{renderDetailItem("Alternate Email", getDisplayValue(member.alternate_email))}</div><hr className="my-6" /><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Company Information</h6><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">{renderDetailItem("Temporary Company Name", getDisplayValue(member.company_temp))}{renderDetailItem("Actual Company Name", getDisplayValue(member.company_actual))}{renderDetailItem("Business Type", getDisplayValue(member.business_type))}</div><hr className="my-6" /><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Address & Location</h6><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">{renderDetailItem("Address", getDisplayValue(member.address))}{renderDetailItem("City", getDisplayValue(member.city))}{renderDetailItem("State", getDisplayValue(member.state))}{renderDetailItem("Pincode", getDisplayValue(member.pincode))}{renderDetailItem("Country", getDisplayValue(member.country?.name))}{renderDetailItem("Continent", getDisplayValue(member.continent?.name))}</div><hr className="my-6" /><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Social & Web Presence</h6><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">{renderDetailItem("Website", renderLink(member.website))}{renderDetailItem("LinkedIn Profile", renderLink(member.linkedIn_profile))}{renderDetailItem("Facebook Profile", renderLink(member.facebook_profile))}{renderDetailItem("Instagram Handle", renderLink(member.instagram_handle))}{renderDetailItem("Botim ID", renderLink(member.botim_id))}{renderDetailItem("Skype ID", renderLink(member.skype_id))}{renderDetailItem("WeChat ID", renderLink(member.wechat_id))}</div><hr className="my-6" /><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Business & Membership</h6><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">{renderDetailItem("Business Opportunity", getDisplayValue(member.business_opportunity))}{renderDetailItem("Member Grade", getDisplayValue(member.member_grade))}{renderDetailItem("Dealing in Bulk", getDisplayValue(member.dealing_in_bulk))}{renderDetailItem("Current Membership Plan", getDisplayValue(member.membership_plan_current))}{renderDetailItem("Upgrade Plan Suggestion", getDisplayValue(member.upgrade_your_plan))}</div><hr className="my-6" /><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Permissions</h6><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">{renderDetailItem("Product Upload Permission", renderBoolean(member.product_upload_permission))}{renderDetailItem("Wall Enquiry Permission", renderBoolean(member.wall_enquiry_permission))}{renderDetailItem("Enquiry Permission", renderBoolean(member.enquiry_permission))}{renderDetailItem("Trade Inquiry Allowed", renderBoolean(member.trade_inquiry_allowed))}</div><hr className="my-6" /><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Preferences & Miscellaneous</h6><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">{renderDetailItem("Favourite Products", member.favourite_products_list && member.favourite_products_list.length > 0 ? (<ul className="list-disc list-inside">{member.favourite_products_list.map((product: any) => (<li key={product.id}>{getDisplayValue(product.name)}</li>))}</ul>) : "N/A")}{renderDetailItem("Favourite Brands", member.favourite_brands_list && member.favourite_brands_list.length > 0 ? renderListAsTags(member.favourite_brands_list.map((brand: any) => brand.name || brand)) : "N/A")}{renderDetailItem("Top-level Brand Name", getDisplayValue(member.brand_name))}{renderDetailItem("Top-level Category", getDisplayValue(member.category))}{renderDetailItem("Top-level Subcategory", getDisplayValue(member.subcategory))}{renderDetailItem("Remarks", getDisplayValue(member.remarks))}</div><hr className="my-6" /><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Administrative Information</h6><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">{renderDetailItem("Created By", getDisplayValue(member.created_by_user?.name))}{renderDetailItem("Updated By", getDisplayValue(member.updated_by_user?.name))}{renderDetailItem("Relationship Manager", getDisplayValue(member.relationship_manager?.name))}</div>{member.dynamic_member_profiles && member.dynamic_member_profiles.length > 0 && (<><hr className="my-6" /><h6 className="mb-4 text-base font-medium text-gray-700 dark:text-gray-300">Dynamic Member Profiles</h6>{member.dynamic_member_profiles.map((profile: any, index: number) => (<div key={profile.id || index} className="mb-6 p-4 border rounded-md dark:border-gray-700"><h5 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-200">Profile {index + 1}: {getDisplayValue(profile.member_type?.name)}</h5><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">{renderDetailItem("Member Type", getDisplayValue(profile.member_type?.name))}{renderDetailItem("Brands", renderListAsTags(profile.brand_names))}{renderDetailItem("Categories", renderListAsTags(profile.category_names))}{renderDetailItem("Sub-categories", renderListAsTags(profile.sub_category_names))}{renderDetailItem("Profile Created At", formatDate(profile.created_at, true))}{renderDetailItem("Profile Updated At", formatDate(profile.updated_at, true))}</div></div>))}</>)}</div><div className="text-right mt-8"><Button variant="solid" onClick={onClose}>Close</Button></div></div></Dialog>); };
const statusColor: Record<string, string> = { active: "bg-green-200 text-green-600", inactive: "bg-red-200 text-red-600", Active: "bg-green-200 text-green-600", Disabled: "bg-red-200 text-red-600", };
const memberStatusOptions = [{ value: "Active", label: "Active" }, { value: "Disabled", label: "Disabled" }, { value: "Unregistered", label: "Unregistered" }];
const continentOptions = [{ value: "Asia", label: "Asia" }, { value: "Africa", label: "Africa" }, { value: "North America", label: "North America" }, { value: "South America", label: "South America" }, { value: "Antarctica", label: "Antarctica" }, { value: "Europe", label: "Europe" }, { value: "Australia", label: "Australia" }];
const businessTypeOptions = [{ value: "Manufacturer", label: "Manufacturer" }, { value: "Retailer", label: "Retailer" }, { value: "Service", label: "Service" }, { value: "Automotive", label: "Automotive" }, { value: "Electronics", label: "Electronics" }, { value: "Healthcare", label: "Healthcare" }, { value: "IT Services", label: "IT Services" }, { value: "FinTech", label: "FinTech" }];
const businessOpportunityOptions = [{ value: "Indian Buyer", label: "Indian Buyer" }, { value: "Indian Supplier", label: "Indian Supplier" }, { value: "Global Buyer", label: "Global Buyer" }, { value: "Global Supplier", label: "Global Supplier" }];
const stateOptions = [{ value: "NY", label: "New York" }, { value: "CA", label: "California" }, { value: "KA", label: "Karnataka" }];
const cityOptions = [{ value: "New York City", label: "New York City" }, { value: "Los Angeles", label: "Los Angeles" }, { value: "Bengaluru", label: "Bengaluru" }];
const interestedForOptions = [{ value: "For Sell", label: "For Sell" }, { value: "For Buy", label: "For Buy" }, { value: "Both", label: "Both" }];

interface MemberListStore { memberList: FormItem[]; selectedMembers: FormItem[]; setMemberList: React.Dispatch<React.SetStateAction<FormItem[]>>; setSelectedMembers: React.Dispatch<React.SetStateAction<FormItem[]>>; }
const MemberListContext = React.createContext<MemberListStore | undefined>(undefined);
const useMemberList = (): MemberListStore => { const context = useContext(MemberListContext); if (!context) { throw new Error("useMemberList must be used within a MemberListProvider"); } return context; };
const MemberListProvider: React.FC<{ children: React.ReactNode }> = ({ children, }) => { const { MemberData } = useSelector(masterSelector); const dispatch = useAppDispatch(); const [memberList, setMemberList] = useState<FormItem[]>(MemberData?.data ?? []); const [selectedMembers, setSelectedMembers] = useState<FormItem[]>([]); useEffect(() => { if (MemberData?.data) { setMemberList(MemberData.data); } }, [MemberData?.data]); useEffect(() => { dispatch(getMemberAction()); }, [dispatch]); return (<MemberListContext.Provider value={{ memberList, setMemberList, selectedMembers, setSelectedMembers, }}>{children}</MemberListContext.Provider>); };
interface FormListSearchProps { onInputChange: (value: string) => void; value: string }
const FormListSearch: React.FC<FormListSearchProps> = ({ onInputChange, value }) => { return (<DebouceInput value={value} placeholder="Quick Search..." onChange={(e) => onInputChange((e.target as HTMLInputElement).value)} suffix={<TbSearch />} />); };
const FormListActionTools = () => { const navigate = useNavigate(); return (<div className="flex flex-col md:flex-row gap-3"><Button className="mr-2" icon={<TbEye />} clickFeedback={false} color="green-600">View Bit Route</Button><Button variant="solid" icon={<TbPlus className="text-lg" />} onClick={() => navigate("/business-entities/member-create")}>Add New</Button></div>); };
const ActionColumn = ({ rowData, onEdit, onViewDetail, onOpenModal, }: { rowData: FormItem; onEdit: () => void; onViewDetail: () => void; onOpenModal: (type: MemberModalType, data: FormItem) => void; }) => { return (<div className="flex items-center justify-center gap-1"><Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600" role="button" onClick={onEdit}><TbPencil /></div></Tooltip><Tooltip title="View"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600" role="button" onClick={() => onViewDetail(rowData)}><TbEye /></div></Tooltip><Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}><Dropdown.Item onClick={() => onOpenModal("email", rowData)} className="flex items-center gap-2"> <TbMail size={18} /> <span className="text-xs">Send Email</span> </Dropdown.Item><Dropdown.Item onClick={() => onOpenModal("whatsapp", rowData)} className="flex items-center gap-2"> <TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span> </Dropdown.Item><Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"> <TbBell size={18} /> <span className="text-xs">Add Notification</span> </Dropdown.Item><Dropdown.Item onClick={() => onOpenModal("task", rowData)} className="flex items-center gap-2"> <TbUser size={18} /> <span className="text-xs">Assign Task</span> </Dropdown.Item><Dropdown.Item onClick={() => onOpenModal("calendar", rowData)} className="flex items-center gap-2"> <TbCalendarEvent size={18} /> <span className="text-xs">Add Schedule</span> </Dropdown.Item><Dropdown.Item onClick={() => onOpenModal("active", rowData)} className="flex items-center gap-2"> <TbTagStarred size={18} /> <span className="text-xs">Add Active</span> </Dropdown.Item><Dropdown.Item onClick={() => onOpenModal("trackRecord", rowData)} className="flex items-center gap-2"> <TbFileSearch size={18} /> <span className="text-xs">View Company</span> </Dropdown.Item><Dropdown.Item onClick={() => onOpenModal("trackRecord", rowData)} className="flex items-center gap-2"> <TbUserSearch size={18} /> <span className="text-xs">View Brand Profile</span> </Dropdown.Item><Dropdown.Item className="flex items-center gap-2"> <TbKey size={18} /> <span className="text-xs">Reset Password</span> </Dropdown.Item></Dropdown></div>); };

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const filterKeyToLabelMap: Record<string, string> = {
    filterStatus: 'Status', filterBusinessType: 'Business Type', filterBusinessOpportunity: 'Opportunity',
    filterContinent: 'Continent', filterCountry: 'Country', filterState: 'State',
    filterCity: 'City', filterInterestedFor: 'Interest', filterBrand: 'Brand', memberGrade: 'Grade'
  };

  const activeFiltersList = Object.entries(filterData).flatMap(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return [];
    return (value as { value: string, label: string }[]).map((item: { value: string; label: string }) => ({
      key, value: item.value, label: `${filterKeyToLabelMap[key] || 'Filter'}: ${item.label}`,
    }));
  });

  if (activeFiltersList.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {activeFiltersList.map(filter => (
        <Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">
          {filter.label}
          <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key as keyof FilterFormData, filter.value)} />
        </Tag>
      ))}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};

// --- FormListTable Component ---
const FormListTable = ({ filterCriteria, setFilterCriteria }: { filterCriteria: FilterFormData, setFilterCriteria: React.Dispatch<React.SetStateAction<FilterFormData>> }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { memberList: forms, setSelectedMembers } = useMemberList();

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "", });
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [modalState, setModalState] = useState<MemberModalState>({ isOpen: false, type: null, data: null, });

  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange", });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria, });

  useEffect(() => { filterFormMethods.reset(filterCriteria); }, [filterCriteria, filterFormMethods]);

  const openFilterDrawer = () => setFilterDrawerOpen(true);
  const closeFilterDrawer = () => setFilterDrawerOpen(false);

  const handleQueryChange = (newQuery: string) => { setTableData((prev) => ({ ...prev, query: newQuery, pageIndex: 1 })); };
  const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); };

  const onClearFilters = () => {
    const defaultFilters: FilterFormData = {};
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, query: "", pageIndex: 1 }));
  };

  const handleRemoveFilter = (key: keyof FilterFormData, valueToRemove: string) => {
    setFilterCriteria(prev => {
      const newCriteria = { ...prev };
      const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined;
      if (currentFilterArray) {
        (newCriteria as any)[key] = currentFilterArray.filter(item => item.value !== valueToRemove);
      }
      return newCriteria;
    });
    setTableData(prev => ({ ...prev, pageIndex: 1 }));
  };

  const handleOpenModal = (type: MemberModalType, memberData: FormItem) => setModalState({ isOpen: true, type, data: memberData });
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

  const { activeFilterCount, pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: FormItem[] = forms ? cloneDeep(forms) : [];
    const { filterStatus, filterBusinessType, filterBusinessOpportunity, filterContinent, filterCountry, filterState, filterCity, filterInterestedFor, filterBrand, memberGrade, } = filterCriteria;
    if (filterStatus?.length) { const values = filterStatus.map((opt) => opt.value); processedData = processedData.filter((item) => values.includes(item.status)); }
    if (filterBusinessType?.length) { const values = filterBusinessType.map((opt) => opt.value); processedData = processedData.filter((item) => item.business_type && values.includes(item.business_type as string)); }
    if (filterBusinessOpportunity?.length) { const values = filterBusinessOpportunity.map((opt) => opt.value); processedData = processedData.filter((item) => item.business_opportunity && values.includes(item.business_opportunity)); }
    if (filterContinent?.length) { const values = filterContinent.map((opt) => opt.value.toLowerCase()); processedData = processedData.filter((item) => item.member_location && values.some((v) => item.member_location.toLowerCase().includes(v))); }
    if (filterCountry?.length) { const values = filterCountry.map((opt) => opt.value.toLowerCase()); processedData = processedData.filter((item) => item.country?.name && values.includes(item.country.name.toLowerCase())); }
    if (filterState?.length) { const values = filterState.map((opt) => opt.value.toLowerCase()); processedData = processedData.filter((item) => item.member_location && values.some((v) => item.member_location.toLowerCase().includes(v))); }
    if (filterCity?.length) { const values = filterCity.map((opt) => opt.value.toLowerCase()); processedData = processedData.filter((item) => item.member_location && values.some((v) => item.member_location.toLowerCase().includes(v))); }
    if (filterInterestedFor?.length) { const values = filterInterestedFor.map((opt) => opt.value); processedData = processedData.filter((item) => item.interested_in && values.includes(item.interested_in)); }
    if (filterBrand?.length) { const values = filterBrand.map((opt) => opt.value); processedData = processedData.filter((item) => item.associated_brands && item.associated_brands.some((brand) => values.includes(brand))); }
    if (memberGrade?.length) { const values = memberGrade.map((opt) => opt.value); processedData = processedData.filter((item) => item.member_grade && values.includes(item.member_grade)); }
    if (tableData.query) { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter((item) => item.name?.toLowerCase().includes(query) || item.email?.toLowerCase().includes(query) || item.company_name?.toLowerCase().includes(query) || String(item.id).includes(query)); }


    let count = 0;

    if (filterStatus?.length) count++;
    if (filterBusinessType?.length) count++;
    if (filterBusinessOpportunity?.length) count++;
    if (filterContinent?.length) count++;
    if (filterCountry?.length) count++;
    if (filterState?.length) count++;
    if (filterCity?.length) count++;
    if (filterInterestedFor?.length) count++;
    if (filterBrand?.length) count++;
    if (memberGrade?.length) count++;




    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { processedData.sort((a, b) => { const aValue = a[key as keyof FormItem] ?? ""; const bValue = b[key as keyof FormItem] ?? ""; if (typeof aValue === "string" && typeof bValue === "string") { return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue); } if (typeof aValue === "number" && typeof bValue === "number") { return order === "asc" ? aValue - bValue : bValue - aValue; } return 0; }); }
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return { activeFilterCount: count, pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData, };
  }, [forms, tableData, filterCriteria]);

  const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const moduleName = "Members"; const timestamp = new Date().toISOString().split("T")[0]; const fileName = `members_export_${timestamp}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName, })).unwrap(); toast.push(<Notification title="Export Reason Submitted" type="success" />); exportToCsv(fileName, allFilteredAndSortedData); setIsExportReasonModalOpen(false); } catch (error: any) { toast.push(<Notification title="Failed to Submit Reason" type="danger" message={error.message} />); } finally { setIsSubmittingExportReason(false); } };

  const handleEdit = (form: FormItem) => navigate(`/business-entities/member-edit/${form.id}`, { state: form });
  const handleViewDetails = (form: FormItem) => navigate(`/business-entities/member-view/${form.id}`);

  const columns: ColumnDef<FormItem>[] = useMemo(() => [
    { header: "Member", accessorKey: "member_name", id: 'member', size: 180, cell: (props) => (<div className="flex flex-col gap-1"><div className="flex items-center gap-1.5"><div className="text-xs"><b className="text-xs text-blue-500"><em>70892{props.row.original.id || ""}</em></b> <br /><b className="texr-xs">{props.row.original.name || ""}</b></div></div><div className="text-xs"><div className="text-xs text-gray-500">{props.row.original.email || ""}</div><div className="text-xs text-gray-500">{props.row.original.number || ""}</div><div className="text-xs text-gray-500">{props.row.original.country?.name || ""}</div></div></div>), },
    { header: "Company", accessorKey: "company_name", id: 'company', size: 200, cell: (props) => (<div className="ml-2 rtl:mr-2 text-xs"><b className="text-xs "><em className="text-blue-500">{props.row.original.company_id_actual || ""}</em></b><div className="text-xs flex gap-1"><MdCheckCircle size={20} className="text-green-500" /><b className="">{props.row.original.company_name || "Unique Enterprise"}</b></div></div>), },
    { header: "Status", accessorKey: "member_status", id: 'status', size: 140, cell: (props) => { const { status: member_status, created_at } = props.row.original; return (<div className="flex flex-col text-xs"><Tag className={`${statusColor[member_status as keyof typeof statusColor]} inline capitalize`}>{member_status || ""}</Tag><span className="mt-0.5"><div className="text-[10px] text-gray-500 mt-0.5">Joined Date: {new Date(created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", }).replace(/ /g, "/") || "N/A"}</div></span></div>); }, },
    { header: "Profile", accessorKey: "profile_completion", id: 'profile', size: 220, cell: (props) => (<div className="text-xs flex flex-col"><div><Tag className="text-[10px] mb-1 bg-orange-100 text-orange-400">{props.row.original.status || ""}</Tag></div><span><b>RM: </b>{props.row.original.name || ""}</span><span><b>Grade: {props.row.original.member_grade || ""}</b></span><span><b>Business Opportunity: {props.row.original.business_opportunity || ""}</b></span><Tooltip title={`Profile: ${props.row.original.profile_completion || 0}%`}><div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${props.row.original.profile_completion || 0}%`, }}></div></div></Tooltip></div>), },
    { header: "Preferences", accessorKey: "associated_brands", id: 'preferences', size: 300, cell: (props) => { const [isOpen, setIsOpen] = useState<boolean>(false); const openDialog = () => setIsOpen(true); const closeDialog = () => setIsOpen(false); return (<div className="flex flex-col gap-1"><span className="text-xs"><b className="text-xs">Business Type: {props.row.original.business_type || ""}</b></span><span className="text-xs flex items-center gap-1"><span onClick={openDialog}><TbInfoCircle size={16} className="text-blue-500 cursor-pointer" /></span><b className="text-xs">Brands: {props.row.original.brand_name || ""}</b></span><span className="text-xs"><span className="text-[11px]"><b className="text-xs">Interested: </b>{props.row.original.interested_in}</span></span><Dialog width={620} isOpen={isOpen} onRequestClose={closeDialog} onClose={closeDialog}><h6>Dynamic Profile</h6><Table className="mt-6"><thead className="bg-gray-100 rounded-md"><Tr><Td width={130}>Member Type</Td><Td>Brands</Td><Td>Category</Td><Td>Sub Category</Td></Tr></thead><tbody><Tr><Td>INS - PREMIUM</Td><Td><span className="flex gap-0.5 flex-wrap"><Tag>Apple</Tag><Tag>Samsung</Tag><Tag>POCO</Tag></span></Td><Td><Tag>Electronics</Tag></Td><Td><span className="flex gap-0.5 flex-wrap"><Tag>Mobile</Tag><Tag>Laptop</Tag></span></Td></Tr></tbody></Table></Dialog></div>); }, },
    { header: "Actions", id: "action", size: 130, meta: { HeaderClass: "text-center" }, cell: (props) => (<ActionColumn rowData={props.row.original} onEdit={() => handleEdit(props.row.original)} onViewDetail={() => handleViewDetails(props.row.original)} onOpenModal={handleOpenModal} />), },
  ], [handleOpenModal]
  );

  const [filteredColumns, setFilteredColumns] = useState(columns);
  const toggleColumn = (checked: boolean, colId: string) => { if (checked) { const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId); if (originalColumn) { setFilteredColumns(prev => { const newCols = [...prev, originalColumn]; newCols.sort((a, b) => { const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey)); const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey)); return indexA - indexB; }); return newCols; }); } } else { setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId)); } };
  const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);

  const handlePaginationChange = useCallback((page: number) => { setTableData((prev) => ({ ...prev, pageIndex: page })); }, []);
  const handleSelectChange = useCallback((value: number) => { setTableData((prev) => ({ ...prev, pageSize: Number(value), pageIndex: 1, })); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData((prev) => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: FormItem) => { setSelectedMembers((prevSelected) => { if (checked) { return [...prevSelected, row]; } else { return prevSelected.filter((item) => item.id !== row.id); } }); }, [setSelectedMembers]);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<FormItem>[]) => { const originalItemsOnPage = currentRows.map((r) => r.original); if (checked) { setSelectedMembers((prevSelected) => { const newSelections = originalItemsOnPage.filter((pageItem) => !prevSelected.some((selItem) => selItem.id === pageItem.id)); return [...prevSelected, ...newSelections]; }); } else { setSelectedMembers((prevSelected) => prevSelected.filter((selItem) => !originalItemsOnPage.some((pageItem) => pageItem.id === selItem.id))); } }, [setSelectedMembers]);
  const getBrandOptions = useMemo(() => { if (!forms) return []; return forms.flatMap((f) => f.associated_brands).filter((v, i, a) => a.indexOf(v) === i && v).map((b) => ({ value: b, label: b })); }, [forms]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <FormListSearch onInputChange={handleQueryChange} value={tableData.query} />
        <div className="flex gap-2">
          <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
            <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
              {columns.map((col) => col.header && (<div key={col.id || col.accessorKey as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(col.id || col.accessorKey as string)} onChange={(checked) => toggleColumn(checked, col.id || col.accessorKey as string)} >{col.header as string}</Checkbox></div>))}
            </div>
          </Dropdown>
          <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onClearFilters} /></Tooltip>
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter{activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
          <Button icon={<TbCloudUpload />} onClick={handleOpenExportReasonModal} disabled={!allFilteredAndSortedData || allFilteredAndSortedData.length === 0}>Export</Button>
        </div>
      </div>
      <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
      <DataTable selectable columns={filteredColumns} data={pageData} noData={!isLoading && (!pageData || pageData.length === 0)} loading={isLoading} pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number, }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} />
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={480} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterMemberForm" type="submit">Apply</Button></div>}>
        <UiForm id="filterMemberForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-2">
            <UiFormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={memberStatusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Business Type"><Controller name="filterBusinessType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Type" options={businessTypeOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Business Opportunity"><Controller name="filterBusinessOpportunity" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Opportunity" options={businessOpportunityOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Continent"><Controller name="filterContinent" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Continent" options={continentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Country" options={[{ label: "India", value: "India" }]} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="State"><Controller name="filterState" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select State" options={stateOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="City"><Controller name="filterCity" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select City" options={cityOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Interested For"><Controller name="filterInterestedFor" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Interest" options={interestedForOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Interested Category"><Controller name="filterInterestedCategory" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Category" options={businessTypeOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Brand"><Controller name="filterBrand" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Brand" options={getBrandOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Dealing in Bulk"><Controller name="filterDealing" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select" options={[{ label: "Yes", value: "Yes" }, { label: "No", value: "No" },]} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
            <UiFormItem label="Grade"><Controller name="memberGrade" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Grade" options={[{ label: "A", value: "A" }, { label: "B", value: "B" }, { label: "C", value: "C" },]} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></UiFormItem>
          </div>
        </UiForm>
      </Drawer>
      <MemberModals modalState={modalState} onClose={handleCloseModal} />
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason, }}>
        <UiForm id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
          <UiFormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </UiFormItem>
        </UiForm>
      </ConfirmDialog>
    </>
  );
};

const FormListSelected = () => { const { selectedMembers, setSelectedMembers } = useMemberList(); const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false); const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false); const [sendMessageLoading, setSendMessageLoading] = useState(false); const [messageContent, setMessageContent] = useState(""); const handleDelete = () => setDeleteConfirmationOpen(true); const handleCancelDelete = () => setDeleteConfirmationOpen(false); const dispatch = useAppDispatch(); const handleConfirmDelete = async () => { if (!selectedMembers || selectedMembers.length === 0) { toast.push(<Notification title="Error" type="danger">No members selected for deletion.</Notification>); setDeleteConfirmationOpen(false); return; } setDeleteConfirmationOpen(false); try { const ids = selectedMembers.map((data) => data.id); await dispatch(deleteAllMemberAction({ ids: ids.join(",") })).unwrap(); toast.push(<Notification title="Members Deleted" type="success" duration={2000}>{selectedMembers.length} member(s) deleted.</Notification>); dispatch(getMemberAction()); setSelectedMembers([]); } catch (error: any) { const errorMessage = error.message || "Could not delete members."; toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{errorMessage}</Notification>); console.error("Delete members Error:", error); } }; const handleSend = () => { setSendMessageLoading(true); setTimeout(() => { toast.push(<Notification type="success" title="Message Sent">Message sent to {selectedMembers.length} member(s)!</Notification>, { placement: "top-center", }); setSendMessageLoading(false); setSendMessageDialogOpen(false); setSelectedMembers([]); setMessageContent(""); }, 1000); }; if (selectedMembers.length === 0) { return null; } return (<><StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"><div className="container mx-auto"><div className="flex items-center justify-between"><span><span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1"><span className="heading-text">{selectedMembers.length} Members</span><span>selected</span></span></span></span><div className="flex items-center"><Button size="sm" className="ltr:mr-3 rtl:ml-3" type="button" color="red-600" onClick={handleDelete}>Delete</Button><Button size="sm" variant="solid" onClick={() => setSendMessageDialogOpen(true)}>Message</Button></div></div></div></StickyFooter><ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Remove ${selectedMembers.length} Member(s)`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} confirmButtonColor="red-600"><p>Are you sure you want to remove {selectedMembers.length} selected member(s)? This action can't be undone.</p></ConfirmDialog><Dialog isOpen={sendMessageDialogOpen} onRequestClose={() => setSendMessageDialogOpen(false)} onClose={() => setSendMessageDialogOpen(false)} width={600}><h5 className="mb-2">Send Message</h5><p>Send message to the following {selectedMembers.length} member(s):</p><Avatar.Group chained omittedAvatarTooltip className="my-4" maxCount={6} omittedAvatarProps={{ size: 30 }}>{selectedMembers.map((member) => (<Tooltip key={member.id} title={member.member_name}><Avatar size={30} src={member.member_photo || undefined} icon={!member.member_photo ? <TbUserCircle /> : undefined} /></Tooltip>))}</Avatar.Group><div className="my-4"><RichTextEditor value={messageContent} onChange={setMessageContent} /></div><div className="ltr:justify-end flex items-center gap-2 mt-4"><Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>Cancel</Button><Button size="sm" variant="solid" loading={sendMessageLoading} onClick={handleSend}>Send</Button></div></Dialog></>); };

const Member = () => {
  const { MemberData } = useSelector(masterSelector);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});

  const counts = useMemo(() => {
    const list = MemberData?.data || [];
    const total = list.length || 0;
    const active = list.filter((m: any) => m.status === "Active").length;
    const disabled = list.filter((m: any) => m.status === "Disabled").length;
    const unregistered = list.filter((m: any) => m.status === "Unregistered").length;
    return { total, active, disabled, unregistered };
  }, [MemberData?.data]);

  const handleCardClick = useCallback((status: 'Active' | 'Disabled' | 'Unregistered' | 'All') => {
    const newCriteria: FilterFormData = {};
    if (status !== 'All') {
      const statusOption = memberStatusOptions.find(opt => opt.value === status);
      if (statusOption) {
        newCriteria.filterStatus = [statusOption];
      }
    }
    setFilterCriteria(newCriteria);
  }, []);

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
                <Tooltip title="Click to show all Member"><div onClick={() => handleCardClick('All')} className="cursor-pointer"><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbUsersGroup size={24} /></div><div><h6 className="text-blue-500">{counts.total}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
                <Tooltip title="Click to filter by Active status"><div onClick={() => handleCardClick('Active')} className="cursor-pointer"><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUserCheck size={24} /></div><div><h6 className="text-green-500">{counts.active}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
                <Tooltip title="Click to filter by Disabled status"><div onClick={() => handleCardClick('Disabled')} className="cursor-pointer"><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbUserCancel size={24} /></div><div><h6 className="text-red-500">{counts.disabled}</h6><span className="font-semibold text-xs">Disabled</span></div></Card></div></Tooltip>
                <Tooltip title="Click to filter by Unregistered status"><div onClick={() => handleCardClick('Unregistered')} className="cursor-pointer"><Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbUserExclamation size={24} /></div><div><h6 className="text-pink-500">{counts.unregistered}</h6><span className="font-semibold text-xs">Unregistered</span></div></Card></div></Tooltip>
              </div>
              <FormListTable filterCriteria={filterCriteria} setFilterCriteria={setFilterCriteria} />
            </div>
          </AdaptiveCard>
        </Container>
        <FormListSelected />
      </>
    </MemberListProvider>
  );
};

export default Member;