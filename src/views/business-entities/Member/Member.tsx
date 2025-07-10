import { zodResolver } from "@hookform/resolvers/zod";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  Checkbox,
  DatePicker,
  Dialog,
  Drawer,
  Dropdown,
  Form as UiForm,
  FormItem as UiFormItem,
  Input,
  Select as UiSelect,
  Table,
  Tag,
  Tooltip,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Td from "@/components/ui/Table/Td";
import Tr from "@/components/ui/Table/Tr";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbAlarm, TbBell, TbBrandWhatsapp, TbCalendarEvent, TbChecks, TbCloudUpload, TbColumns, TbDownload, TbEye, TbFileDescription, TbFileSearch, TbFilter, TbMail, TbPencil, TbPlus, TbReceipt, TbReload, TbSearch, TbUser, TbUserCancel, TbUserCheck, TbUserExclamation, TbUserCircle, TbUsersGroup, TbX,
  TbInfoCircle
} from "react-icons/tb";

// Types & Utils
import type { TableQueries } from "@/@types/common";
import type { ColumnDef, OnSortParam, Row } from "@/components/shared/DataTable";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addNotificationAction,
  addScheduleAction,
  addTaskAction,
  deleteAllMemberAction,
  getAllUsersAction,
  getMemberAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";
import cloneDeep from "lodash/cloneDeep";
import dayjs from "dayjs";
import { useSelector } from "react-redux";

// --- START: Detailed Type Definitions (Matching API Response) ---
interface UserReference { id: number; name: string; }
interface CountryReference { id: number; name: string; }
interface ContinentReference { id: number; name: string; }
interface RelationshipManager { id: number; name: string; }
interface DynamicMemberProfile { id: number; member_type?: { name: string }; brand_names?: string[]; category_names?: string[]; sub_category_names?: string[]; }
export type SelectOption = { value: any; label: string };

export type FormItem = {
  id: number;
  name: string;
  member_code: string;
  interested_in: string | null;
  number: string;
  number_code: string;
  email: string;
  company_temp: string | null;
  company_actual: string | null;
  company_code: string | null;
  business_type: string | null;
  status: "Active" | "Disabled" | "Unregistered";
  country: CountryReference | null;
  continent: ContinentReference | null;
  relationship_manager: RelationshipManager | null;
  dynamic_member_profiles: DynamicMemberProfile[];
  profile_completion: number;
  business_opportunity: string;
  member_grade: string | null;
  created_at: string;
  full_profile_pic: string | null;
  brand_name: string | null;
  [key: string]: any;
};
// --- END: Detailed Type Definitions ---

// --- Zod Schemas ---
const filterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterBusinessType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterBusinessOpportunity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCountry: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterInterestedFor: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  memberGrade: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason must be at least 10 characters.").max(255, "Reason cannot exceed 255 characters."), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

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
type NotificationFormData = { notification_title: string; send_users: number[]; message: string; }
const taskPriorityOptions: SelectOption[] = [ { value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, ];

// --- CSV Exporter Utility ---
function exportToCsv(filename: string, rows: FormItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const CSV_HEADERS = ["Member ID", "Member Code", "Name", "Email", "Contact", "Status", "Company (Temp)", "Company (Actual)", "Business Type", "Business Opportunity", "Member Grade", "Interested In", "Country", "Profile Completion (%)", "Joined Date"];
  const preparedRows = rows.map(row => ({
    id: row.id, member_code: row.member_code, name: row.name, email: row.email, contact: `${row.number_code || ''} ${row.number || ''}`.trim(), status: row.status, company_temp: row.company_temp || 'N/A', company_actual: row.company_actual || 'N/A', business_type: row.business_type || 'N/A', business_opportunity: row.business_opportunity || 'N/A', member_grade: row.member_grade || 'N/A', interested_in: row.interested_in || 'N/A', country: row.country?.name || 'N/A', profile_completion: row.profile_completion, created_at: row.created_at ? dayjs(row.created_at).format('DD MMM YYYY') : 'N/A'
  }));
  const csvContent = [ CSV_HEADERS.join(','), ...preparedRows.map(row => CSV_HEADERS.map(header => { const key = header.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_') as keyof typeof row; const cell = row[key] ?? ''; const cellString = String(cell).replace(/"/g, '""'); return `"${cellString}"`; }).join(',')) ].join('\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

// --- START: MODALS SECTION ---
export type MemberModalType = "notification" | "task" | "calendar" | "viewDetail" | "alert" | "transaction" | "document";
export interface MemberModalState { isOpen: boolean; type: MemberModalType | null; data: FormItem | null; }

const AddNotificationDialog: React.FC<{ member: FormItem; onClose: () => void; userOptions: SelectOption[] }> = ({ member, onClose, userOptions }) => {
    const dispatch = useAppDispatch(); const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(z.object({ notification_title: z.string().min(3), send_users: z.array(z.number()).min(1), message: z.string().min(10) })), defaultValues: { notification_title: `Regarding Member: ${member.name}`, send_users: [], message: `This is a notification for member "${member.name}" (${member.member_code}). Please review their details.`, }, mode: 'onChange', });
    const onSend = async (formData: any) => { setIsLoading(true); const payload = { ...formData, module_id: String(member.id), module_name: 'Member' }; try { await dispatch(addNotificationAction(payload)).unwrap(); toast.push(<Notification type="success" title="Notification Sent!" />); onClose(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed" children={error?.message} />); } finally { setIsLoading(false); } };
    return ( <Dialog isOpen={true} onClose={onClose}> <h5 className="mb-4">Notify User about: {member.name}</h5> <UiForm onSubmit={handleSubmit(onSend)}> <UiFormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></UiFormItem> <UiFormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter((o) => field.value?.includes(o.value))} onChange={(options) => field.onChange(options?.map((o) => o.value) || [])} />)} /></UiFormItem> <UiFormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></UiFormItem> <div className="text-right mt-6"><Button type="button" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid}>Send</Button></div> </UiForm> </Dialog> );
};

const AssignTaskDialog: React.FC<{ member: FormItem; onClose: () => void; userOptions: SelectOption[] }> = ({ member, onClose, userOptions }) => {
    const dispatch = useAppDispatch(); const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<TaskFormData>({ resolver: zodResolver(taskValidationSchema), defaultValues: { task_title: `Follow up with ${member.name}`, assign_to: [], priority: 'Medium', }, mode: 'onChange' });
    const onAssignTask = async (data: TaskFormData) => { setIsLoading(true); const payload = { ...data, due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined, module_id: String(member.id), module_name: 'Member', }; try { await dispatch(addTaskAction(payload)).unwrap(); toast.push(<Notification type="success" title="Task Assigned!" />); onClose(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Assign Task" children={error?.message} />); } finally { setIsLoading(false); } };
    return ( <Dialog isOpen={true} onClose={onClose}> <h5 className="mb-4">Assign Task for {member.name}</h5> <UiForm onSubmit={handleSubmit(onAssignTask)}> <UiFormItem label="Task Title" invalid={!!errors.task_title} errorMessage={errors.task_title?.message}><Controller name="task_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></UiFormItem> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <UiFormItem label="Assign To" invalid={!!errors.assign_to} errorMessage={errors.assign_to?.message}><Controller name="assign_to" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter(o => field.value?.includes(o.value))} onChange={(opts) => field.onChange(opts?.map(o => o.value) || [])} />)} /></UiFormItem> <UiFormItem label="Priority" invalid={!!errors.priority} errorMessage={errors.priority?.message}><Controller name="priority" control={control} render={({ field }) => (<UiSelect placeholder="Select Priority" options={taskPriorityOptions} value={taskPriorityOptions.find(p => p.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></UiFormItem> </div> <UiFormItem label="Due Date (Optional)" invalid={!!errors.due_date} errorMessage={errors.due_date?.message}><Controller name="due_date" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />} /></UiFormItem> <UiFormItem label="Description" invalid={!!errors.description} errorMessage={errors.description?.message}><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></UiFormItem> <div className="text-right mt-6"><Button type="button" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid}>Assign Task</Button></div> </UiForm> </Dialog> );
};

const AddScheduleDialog: React.FC<{ member: FormItem; onClose: () => void; }> = ({ member, onClose }) => {
  const dispatch = useAppDispatch(); const [isLoading, setIsLoading] = useState(false); const eventTypeOptions = [ { value: 'Meeting', label: 'Meeting' }, { value: 'FollowUpCall', label: 'Follow-up Call' }, { value: 'Other', label: 'Other' }, ];
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema), defaultValues: { event_title: `Meeting with ${member.name}`, date_time: null as any, notes: `Regarding member ${member.name} (ID: ${member.id}).` }, mode: "onChange", });
  const onAddEvent = async (data: ScheduleFormData) => { setIsLoading(true); const payload = { module_id: Number(member.id), module_name: "Member", event_title: data.event_title, event_type: data.event_type, date_time: dayjs(data.date_time).format("YYYY-MM-DDTHH:mm:ss"), ...(data.remind_from && { remind_from: dayjs(data.remind_from).format("YYYY-MM-DDTHH:mm:ss") }), notes: data.notes || "" }; try { await dispatch(addScheduleAction(payload)).unwrap(); toast.push(<Notification type="success" title="Event Scheduled" />); onClose(); } catch (error: any) { toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message} />); } finally { setIsLoading(false); } };
  return ( <Dialog isOpen={true} onClose={onClose}> <h5 className="mb-4">Add Schedule for {member.name}</h5> <UiForm onSubmit={handleSubmit(onAddEvent)}> <UiFormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></UiFormItem> <UiFormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></UiFormItem> <UiFormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date & time" value={field.value} onChange={field.onChange} />)} /></UiFormItem> <div className="text-right mt-6"><Button type="button" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid}>Save Event</Button></div> </UiForm> </Dialog> );
};

const ViewMemberDetailDialog: React.FC<{ member: FormItem; onClose: () => void; }> = ({ member, onClose }) => {
    const getDisplayValue = (value: any, fallback = "N/A") => (value !== null && value !== undefined && value !== '') ? value : fallback;
    const renderDetailItem = (label: string, value: React.ReactNode) => (<div className="mb-3"><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p><p className="text-sm font-semibold">{getDisplayValue(value)}</p></div>);
    const renderListAsTags = (list: (string | number)[] | undefined | null) => !list || list.length === 0 ? "N/A" : <div className="flex flex-wrap gap-1">{list.map((item, idx) => (<Tag key={idx} className="text-xs">{getDisplayValue(item)}</Tag>))}</div>;
    const formatDate = (dateString: string | undefined | null) => dateString ? dayjs(dateString).format('DD MMM YYYY') : "N/A";
    const renderLink = (url: string | undefined | null, text?: string) => (url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{text || url}</a> : "N/A");
    
    return (
        <Dialog isOpen={true} onClose={onClose} width={800}>
            <h5 className="mb-6">Member Details: {getDisplayValue(member.name)}</h5>
            <div className="max-h-[70vh] overflow-y-auto pr-4">
                <Card className="mb-4" bordered>
                    <h6 className="mb-2 font-semibold">Basic Information</h6>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                        {renderDetailItem("Member ID", getDisplayValue(member.id))}
                        {renderDetailItem("Member Code", getDisplayValue(member.member_code))}
                        {renderDetailItem("Name", getDisplayValue(member.name))}
                        {renderDetailItem("Status", <Tag className="capitalize">{getDisplayValue(member.status)}</Tag>)}
                        {renderDetailItem("Joined Date", formatDate(member.created_at))}
                        {renderDetailItem("Profile Completion", `${getDisplayValue(member.profile_completion, 0)}%`)}
                    </div>
                </Card>
                <Card className="mb-4" bordered>
                    <h6 className="mb-2 font-semibold">Contact Information</h6>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                        {renderDetailItem("Primary Number", `${getDisplayValue(member.number_code)} ${getDisplayValue(member.number)}`)}
                        {renderDetailItem("Email", getDisplayValue(member.email))}
                        {renderDetailItem("WhatsApp", `${getDisplayValue(member.whatsapp_country_code)} ${getDisplayValue(member.whatsApp_no)}`)}
                        {renderDetailItem("Alternate Number", `${getDisplayValue(member.alternate_contact_number_code)} ${getDisplayValue(member.alternate_contact_number)}`)}
                        {renderDetailItem("Alternate Email", getDisplayValue(member.alternate_email))}
                        {renderDetailItem("Website", renderLink(member.website))}
                    </div>
                </Card>
                <Card className="mb-4" bordered>
                    <h6 className="mb-2 font-semibold">Company & Business</h6>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                        {renderDetailItem("Temp Company Name", getDisplayValue(member.company_temp))}
                        {renderDetailItem("Actual Company Name", getDisplayValue(member.company_actual))}
                        {renderDetailItem("Business Type", getDisplayValue(member.business_type))}
                        {renderDetailItem("Business Opportunity", getDisplayValue(member.business_opportunity))}
                        {renderDetailItem("Interested In", getDisplayValue(member.interested_in))}
                        {renderDetailItem("Member Grade", getDisplayValue(member.member_grade))}
                        {renderDetailItem("Dealing in Bulk", getDisplayValue(member.dealing_in_bulk))}
                    </div>
                </Card>
                {member.dynamic_member_profiles && member.dynamic_member_profiles.length > 0 && (
                    <Card className="mb-4" bordered>
                        <h6 className="mb-2 font-semibold">Dynamic Member Profiles</h6>
                        {member.dynamic_member_profiles.map((profile, index) => (
                            <div key={profile.id} className={`p-3 border rounded-md dark:border-gray-600 ${index > 0 ? 'mt-3' : ''}`}>
                                <h5 className="text-sm font-semibold mb-2">{getDisplayValue(profile.member_type?.name)}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                                    {renderDetailItem("Brands", renderListAsTags(profile.brand_names))}
                                    {renderDetailItem("Categories", renderListAsTags(profile.category_names))}
                                    {renderDetailItem("Sub-categories", renderListAsTags(profile.sub_category_names))}
                                </div>
                            </div>
                        ))}
                    </Card>
                )}
                <Card className="mb-4" bordered>
                    <h6 className="mb-2 font-semibold">Administrative</h6>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
                        {renderDetailItem("Relationship Manager", getDisplayValue(member.relationship_manager?.name))}
                        {renderDetailItem("Created By", getDisplayValue(member.created_by_user?.name))}
                        {renderDetailItem("Last Updated By", getDisplayValue(member.updated_by_user?.name))}
                     </div>
                </Card>
            </div>
            <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
        </Dialog>
    );
};

const GenericInfoDialog: React.FC<{ title: string; onClose: () => void; }> = ({ title, onClose }) => (
    <Dialog isOpen={true} onClose={onClose}>
        <h5 className="mb-4">{title}</h5>
        <p>This feature is not yet implemented or no data is available for this member.</p>
        <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
);

const MemberModals: React.FC<{ modalState: MemberModalState; onClose: () => void; userOptions: SelectOption[]; }> = ({ modalState, onClose, userOptions }) => {
  const { type, data: member, isOpen } = modalState;
  if (!isOpen || !member) return null;

  switch (type) {
    case "calendar": return <AddScheduleDialog member={member} onClose={onClose} />;
    case "task": return <AssignTaskDialog member={member} onClose={onClose} userOptions={userOptions} />;
    case "notification": return <AddNotificationDialog member={member} onClose={onClose} userOptions={userOptions} />;
    case "viewDetail": return <ViewMemberDetailDialog member={member} onClose={onClose} />;
    case "alert": return <GenericInfoDialog title={`Alerts for ${member.name}`} onClose={onClose} />;
    case "transaction": return <GenericInfoDialog title={`Transactions for ${member.name}`} onClose={onClose} />;
    case "document": return <GenericInfoDialog title={`Documents for ${member.name}`} onClose={onClose} />;
    default: return null;
  }
};

const statusColor: Record<string, string> = {
  active: "border border-emerald-200 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  disabled: "border border-red-300 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  unregistered: "border border-orange-300 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300"
};

const MemberListContext = createContext<{ memberList: FormItem[]; selectedMembers: FormItem[]; setSelectedMembers: React.Dispatch<React.SetStateAction<FormItem[]>>; userOptions: SelectOption[]; } | undefined>(undefined);
const useMemberList = () => { const context = useContext(MemberListContext); if (!context) throw new Error("useMemberList must be used within a MemberListProvider"); return context; };

const MemberListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { MemberData, getAllUserData } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const [memberList, setMemberList] = useState<FormItem[]>(MemberData?.data ?? []);
  const [selectedMembers, setSelectedMembers] = useState<FormItem[]>([]);
  
  useEffect(() => { if (MemberData?.data) setMemberList(MemberData.data); }, [MemberData?.data]);
  useEffect(() => { dispatch(getMemberAction()); dispatch(getAllUsersAction()); }, [dispatch]);

  const userOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((u: any) => ({ value: u.id, label: u.name })) : [], [getAllUserData]);

  return (<MemberListContext.Provider value={{ memberList, setSelectedMembers, selectedMembers, userOptions }}>{children}</MemberListContext.Provider>);
};

const ActionColumn = ({ rowData, onOpenModal }: { rowData: FormItem; onOpenModal: (type: MemberModalType, data: FormItem) => void; }) => {
  const navigate = useNavigate();
  const handleSendEmail = (member: FormItem) => { if (!member.email) { toast.push(<Notification type="warning" title="Missing Email" />); return; } window.open(`mailto:${member.email}`); };
  const handleSendWhatsapp = (member: FormItem) => { if (!member.number) { toast.push(<Notification type="warning" title="Missing Number" />); return; } const fullNumber = (member.number_code || '').replace(/\D/g, '') + member.number.replace(/\D/g, ''); window.open(`https://wa.me/${fullNumber}`, '_blank'); };

  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600" role="button" onClick={() => navigate(`/business-entities/member-edit/${rowData.id}`)}><TbPencil /></div></Tooltip>
      <Tooltip title="View Page"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600" role="button" onClick={() => navigate(`/business-entities/member-view/${rowData.id}`)}><TbEye /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item onClick={() => onOpenModal("viewDetail", rowData)} className="flex items-center gap-2"><TbFileSearch /> View Details</Dropdown.Item>
        <Dropdown.Item onClick={() => handleSendEmail(rowData)} className="flex items-center gap-2"><TbMail /> Send Email</Dropdown.Item>
        <Dropdown.Item onClick={() => handleSendWhatsapp(rowData)} className="flex items-center gap-2"><TbBrandWhatsapp /> Send WhatsApp</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"><TbBell /> Add Notification</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("task", rowData)} className="flex items-center gap-2"><TbUser /> Assign Task</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("calendar", rowData)} className="flex items-center gap-2"><TbCalendarEvent /> Add Schedule</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("alert", rowData)} className="flex items-center gap-2"><TbAlarm /> View Alert</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("transaction", rowData)} className="flex items-center gap-2"><TbReceipt /> View Transaction</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("document", rowData)} className="flex items-center gap-2"><TbDownload /> Download Document</Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: FilterFormData; onRemoveFilter: (key: keyof FilterFormData, value: string) => void; onClearAll: () => void; }) => {
  const filterKeyToLabelMap: Record<string, string> = { filterStatus: "Status", filterBusinessType: "Business Type", filterBusinessOpportunity: "Opportunity", filterCountry: "Country", filterInterestedFor: "Interest", memberGrade: "Grade" };
  const activeFiltersList = Object.entries(filterData).flatMap(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return [];
    return (value as { value: string; label: string }[]).map((item: { value: string; label: string }) => ({ key, value: item.value, label: `${filterKeyToLabelMap[key] || "Filter"}: ${item.label}` }));
  });
  if (activeFiltersList.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {activeFiltersList.map(filter => (<Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">{filter.label}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key as keyof FilterFormData, filter.value)} /></Tag>))}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};

const FormListTable = ({ filterCriteria, setFilterCriteria }: { filterCriteria: FilterFormData; setFilterCriteria: React.Dispatch<React.SetStateAction<FilterFormData>>; }) => {
  const dispatch = useAppDispatch();
  const { memberList: forms, setSelectedMembers, userOptions } = useMemberList();
  const [isLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [modalState, setModalState] = useState<MemberModalState>({ isOpen: false, type: null, data: null });

  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

  useEffect(() => { filterFormMethods.reset(filterCriteria); }, [filterCriteria, filterFormMethods]);

  const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria(data); setTableData(prev => ({ ...prev, pageIndex: 1 })); setFilterDrawerOpen(false); };
  const onClearFilters = () => { setFilterCriteria({}); setTableData(prev => ({ ...prev, query: "", pageIndex: 1 })); };
  const handleRemoveFilter = (key: keyof FilterFormData, valueToRemove: string) => { setFilterCriteria(prev => { const newCriteria = { ...prev }; const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined; if (currentFilterArray) (newCriteria as any)[key] = currentFilterArray.filter(item => item.value !== valueToRemove); return newCriteria; }); setTableData(prev => ({ ...prev, pageIndex: 1 })); };

  const { activeFilterCount, pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: FormItem[] = forms ? cloneDeep(forms) : [];
    const { filterStatus, filterBusinessType, filterBusinessOpportunity, filterCountry, filterInterestedFor, memberGrade } = filterCriteria;
    
    if (filterStatus?.length) { const values = filterStatus.map(opt => opt.value); processedData = processedData.filter(item => values.includes(item.status)); }
    if (filterBusinessType?.length) { const values = filterBusinessType.map(opt => opt.value); processedData = processedData.filter(item => item.business_type && values.includes(item.business_type)); }
    if (filterBusinessOpportunity?.length) { const values = filterBusinessOpportunity.map(opt => opt.value); processedData = processedData.filter(item => item.business_opportunity && values.some(v => item.business_opportunity.includes(v))); }
    if (filterCountry?.length) { const values = filterCountry.map(opt => opt.value); processedData = processedData.filter(item => item.country?.name && values.includes(item.country.name)); }
    if (filterInterestedFor?.length) { const values = filterInterestedFor.map(opt => opt.value); processedData = processedData.filter(item => item.interested_in && values.includes(item.interested_in)); }
    if (memberGrade?.length) { const values = memberGrade.map(opt => opt.value); processedData = processedData.filter(item => item.member_grade && values.includes(item.member_grade)); }
    
    if (tableData.query) { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => item.name?.toLowerCase().includes(query) || item.email?.toLowerCase().includes(query) || item.company_temp?.toLowerCase().includes(query) || item.company_actual?.toLowerCase().includes(query) || String(item.id).includes(query)); }

    const count = Object.values(filterCriteria).filter(v => Array.isArray(v) && v.length > 0).length;
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { processedData.sort((a, b) => { const aValue = a[key as keyof FormItem] ?? ""; const bValue = b[key as keyof FormItem] ?? ""; if (typeof aValue === 'string' && typeof bValue === 'string') return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue); if (typeof aValue === 'number' && typeof bValue === 'number') return order === 'asc' ? aValue - bValue : bValue - aValue; return 0; }); }
    const pageIndex = tableData.pageIndex as number, pageSize = tableData.pageSize as number, startIndex = (pageIndex - 1) * pageSize;
    return { activeFilterCount: count, pageData: processedData.slice(startIndex, startIndex + pageSize), total: processedData.length, allFilteredAndSortedData: processedData };
  }, [forms, tableData, filterCriteria]);

  const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info" />); return; } exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true); };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const fileName = `members_export_${dayjs().format('YYYYMMDD')}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Member', file_name: fileName })).unwrap();
      toast.push(<Notification title="Reason Submitted" type="success" />);
      exportToCsv(fileName, allFilteredAndSortedData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) { toast.push(<Notification title="Submission Failed" type="danger" children={error.message} />); } finally { setIsSubmittingExportReason(false); }
  };

  const columns: ColumnDef<FormItem>[] = useMemo(() => [
    { header: "Member", accessorKey: "name", id: "member", size: 200, cell: ({ row }) => (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <Avatar src={row.original.full_profile_pic || undefined} shape="circle" size="sm" icon={<TbUserCircle/>}/>
                <div className="text-xs">
                    <b className="text-xs text-blue-500"><em>{row.original.member_code}</em></b> <br />
                    <b className="text-sm">{row.original.name}</b>
                </div>
            </div>
            <div className="text-xs text-gray-500 pl-10">
                <div>{row.original.email}</div>
                <div>{row.original.number_code} {row.original.number}</div>
                <div>{row.original.country?.name}</div>
            </div>
        </div>
    )},
    { header: "Company", accessorKey: "company_actual", id: "company", size: 200, cell: ({ row }) => (
        <div className="text-xs">
            {row.original.company_actual ? 
                <div><b>Actual: </b>{row.original.company_code} | {row.original.company_actual}</div> :
                <div><b>Temp: </b>{row.original.company_temp || "N/A"}</div>
            }
        </div>
    )},
    { header: "Status", accessorKey: "status", id: "status", size: 140, cell: ({ row }) => (
        <div className="flex flex-col text-xs">
            <Tag className={`${statusColor[row.original.status.toLowerCase()] || ''} inline capitalize`}>{row.original.status}</Tag>
            <div className="text-[10px] text-gray-500 mt-1">Joined: {formatCustomDateTime(row.original.created_at)}</div>
        </div>
    )},
    { header: "Profile", accessorKey: "profile_completion", id: "profile", size: 220, cell: ({ row }) => (
        <div className="text-xs flex flex-col gap-0.5">
            <span><b>RM: </b>{row.original.relationship_manager?.name || "N/A"}</span>
            <span><b>Grade: </b>{row.original.member_grade || "N/A"}</span>
            <span className="truncate"><b>Opportunity: </b>{row.original.business_opportunity || "N/A"}</span>
            <Tooltip title={`Profile: ${row.original.profile_completion}%`}>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${row.original.profile_completion}%` }}></div></div>
            </Tooltip>
        </div>
    )},
    { header: "Preferences", id: "preferences", size: 250, cell: ({ row }) => {
        const [isOpen, setIsOpen] = useState(false);
        const { dynamic_member_profiles, brand_name, business_type, interested_in } = row.original;
        const brandDisplay = (dynamic_member_profiles?.[0]?.brand_names?.[0]) ? dynamic_member_profiles[0].brand_names.join(', ') : (brand_name || "N/A");
        
        return (
            <div className="flex flex-col gap-1 text-xs">
                <span><b>Business Type: </b>{business_type || 'N/A'}</span>
                <span className="flex items-center gap-1 truncate">
                    <Tooltip title="View Dynamic Profiles"><TbInfoCircle size={16} className="text-blue-500 cursor-pointer flex-shrink-0" onClick={() => setIsOpen(true)} /></Tooltip>
                    <b>Brands: </b><span className="truncate">{brandDisplay}</span>
                </span>
                <span><b>Interested: </b>{interested_in || 'N/A'}</span>
                <Dialog width={620} isOpen={isOpen} onClose={() => setIsOpen(false)}>
                    <h6>Dynamic Profiles for {row.original.name}</h6>
                    <Table className="mt-4">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <Tr><Td>Member Type</Td><Td>Brands</Td><Td>Categories</Td><Td>Sub Categories</Td></Tr>
                        </thead>
                        <tbody>
                            {dynamic_member_profiles?.length > 0 ? (
                                dynamic_member_profiles.map(p => (
                                    <Tr key={p.id}><Td>{p.member_type?.name || 'N/A'}</Td><Td>{p.brand_names?.join(', ') || 'N/A'}</Td><Td>{p.category_names?.join(', ') || 'N/A'}</Td><Td>{p.sub_category_names?.join(', ') || 'N/A'}</Td></Tr>
                                ))
                            ) : <Tr><Td colSpan={4} className="text-center">No dynamic profiles available.</Td></Tr>}
                        </tbody>
                    </Table>
                </Dialog>
            </div>
        );
    }},
    { header: "Actions", id: "action", size: 120, meta: { HeaderClass: "text-center" }, cell: props => <ActionColumn rowData={props.row.original} onOpenModal={(type, data) => setModalState({ isOpen: true, type, data })} /> },
  ], []);

  const handleSetTableData = (d: Partial<TableQueries>) => setTableData(p => ({ ...p, ...d }));
  const handlePaginationChange = (p: number) => handleSetTableData({ pageIndex: p });
  const handleSelectChange = (v: number) => handleSetTableData({ pageSize: v, pageIndex: 1 });
  const handleSort = (s: OnSortParam) => handleSetTableData({ sort: s, pageIndex: 1 });
  const handleRowSelect = (c: boolean, r: FormItem) => setSelectedMembers(p => c ? [...p, r] : p.filter(i => i.id !== r.id));
  const handleAllRowSelect = (c: boolean, r: Row<FormItem>[]) => setSelectedMembers(c ? r.map(i => i.original) : []);

  const { businessTypeOptions, businessOpportunityOptions, memberGradeOptions, countryOptions } = useMemo(() => {
        const unique = (arr: (string | null | undefined)[]) => [...new Set(arr.filter(Boolean))].map(item => ({ value: item as string, label: item as string }));
        return {
            businessTypeOptions: unique(forms.map(f => f.business_type)),
            businessOpportunityOptions: unique(forms.flatMap(f => f.business_opportunity?.split(',').map(s => s.trim()))),
            memberGradeOptions: unique(forms.map(f => f.member_grade)),
            countryOptions: unique(forms.map(f => f.country?.name)),
        }
  }, [forms]);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <DebouceInput value={tableData.query} placeholder="Quick Search..." onChange={e => handleSetTableData({ query: e, pageIndex: 1 })} />
        <div className="flex gap-2">
            <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onClearFilters} /></Tooltip>
            <Button icon={<TbFilter />} onClick={() => setFilterDrawerOpen(true)}>Filter{activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
            <Button icon={<TbCloudUpload />} onClick={handleOpenExportReasonModal} disabled={!allFilteredAndSortedData.length}>Export</Button>
        </div>
      </div>
      <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
      <DataTable selectable columns={columns} data={pageData} noData={!isLoading && pageData.length === 0} loading={isLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} />
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterMemberForm" type="submit">Apply</Button></div>}>
        <UiForm id="filterMemberForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2">
            <UiFormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={[{ value: "Active", label: "Active" }, { value: "Disabled", label: "Disabled" }, { value: "Unregistered", label: "Unregistered" }]} {...field} />)} /></UiFormItem>
            <UiFormItem label="Business Type"><Controller name="filterBusinessType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Type" options={businessTypeOptions} {...field} />)} /></UiFormItem>
            <UiFormItem label="Business Opportunity"><Controller name="filterBusinessOpportunity" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Opportunity" options={businessOpportunityOptions} {...field} />)} /></UiFormItem>
            <UiFormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Country" options={countryOptions} {...field} />)} /></UiFormItem>
            <UiFormItem label="Interested In"><Controller name="filterInterestedFor" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Interest" options={[{ value: "For Sell", label: "For Sell" }, { value: "For Buy", label: "For Buy" }, { value: "Both", label: "Both" }]} {...field} />)} /></UiFormItem>
            <UiFormItem label="Grade"><Controller name="memberGrade" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Grade" options={memberGradeOptions} {...field} />)} /></UiFormItem>
          </div>
        </UiForm>
      </Drawer>
      <MemberModals modalState={modalState} onClose={() => setModalState({ isOpen: false, type: null, data: null })} userOptions={userOptions} />
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText="Submit & Export" >
          <UiFormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
              <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </UiFormItem>
      </ConfirmDialog>
    </>
  );
};

const FormListSelected = () => {
  const { selectedMembers, setSelectedMembers } = useMemberList();
  const dispatch = useAppDispatch();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!selectedMembers.length) return;
    try {
      const ids = selectedMembers.map(data => data.id);
      await dispatch(deleteAllMemberAction({ ids: ids.join(",") })).unwrap();
      toast.push(<Notification title="Members Deleted" type="success" />);
      dispatch(getMemberAction());
      setSelectedMembers([]);
    } catch (error: any) {
      toast.push(<Notification title="Failed to Delete" type="danger" children={error.message} />);
    } finally {
      setDeleteConfirmationOpen(false);
    }
  };

  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Message Sent" />);
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedMembers([]);
    }, 1000);
  };
  
  if (selectedMembers.length === 0) return null;

  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="container mx-auto flex items-center justify-between">
            <span><span className="flex items-center gap-2"><TbChecks className="text-lg text-primary-600" /><span className="font-semibold">{selectedMembers.length} Members selected</span></span></span>
            <div className="flex items-center"><Button size="sm" className="ltr:mr-3 rtl:ml-3" color="red-600" onClick={() => setDeleteConfirmationOpen(true)}>Delete</Button><Button size="sm" variant="solid" onClick={() => setSendMessageDialogOpen(true)}>Message</Button></div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title="Remove Members" onClose={() => setDeleteConfirmationOpen(false)} onConfirm={handleConfirmDelete}><p>Are you sure you want to remove these members?</p></ConfirmDialog>
      <Dialog isOpen={sendMessageDialogOpen} onClose={() => setSendMessageDialogOpen(false)}>
        <h5 className="mb-2">Send Message</h5>
        <Avatar.Group chained maxCount={6}>{selectedMembers.map(m => (<Tooltip key={m.id} title={m.name}><Avatar src={m.full_profile_pic || undefined} icon={<TbUserCircle />} /></Tooltip>))}</Avatar.Group>
        <div className="my-4"><RichTextEditor /></div>
        <div className="text-right gap-2"><Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>Cancel</Button><Button size="sm" variant="solid" loading={sendMessageLoading} onClick={handleSend}>Send</Button></div>
      </Dialog>
    </>
  );
};

const Member = () => {
  const navigate = useNavigate();
  const { MemberData } = useSelector(masterSelector);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const memberStatusOptions = [ { value: "Active", label: "Active" }, { value: "Disabled", label: "Disabled" }, { value: "Unregistered", label: "Unregistered" }];

  const counts = useMemo(() => {
    const list = MemberData?.data || [];
    return {
      total: list.length,
      active: list.filter((m: any) => m.status === "Active").length,
      disabled: list.filter((m: any) => m.status === "Disabled").length,
      unregistered: list.filter((m: any) => m.status === "Unregistered").length,
    };
  }, [MemberData?.data]);

  const handleCardClick = useCallback((status: "Active" | "Disabled" | "Unregistered" | "All") => {
    setFilterCriteria(status === "All" ? {} : { filterStatus: [{ value: status, label: status }] });
  }, []);

  return (
    <MemberListProvider>
        <Container>
          <AdaptiveCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h5>Members</h5>
                <Button variant="solid" icon={<TbPlus />} onClick={() => navigate("/business-entities/member-create")}>Add New</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 mb-4 gap-3">
                <div onClick={() => handleCardClick("All")} className="cursor-pointer"><Card bodyClass="flex gap-2 p-2"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbUsersGroup size={24} /></div><div><h6>{counts.total}</h6><span className="text-xs font-semibold">Total</span></div></Card></div>
                <div onClick={() => handleCardClick("Active")} className="cursor-pointer"><Card bodyClass="flex gap-2 p-2"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUserCheck size={24} /></div><div><h6>{counts.active}</h6><span className="text-xs font-semibold">Active</span></div></Card></div>
                <div onClick={() => handleCardClick("Disabled")} className="cursor-pointer"><Card bodyClass="flex gap-2 p-2"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbUserCancel size={24} /></div><div><h6>{counts.disabled}</h6><span className="text-xs font-semibold">Disabled</span></div></Card></div>
                <div onClick={() => handleCardClick("Unregistered")} className="cursor-pointer"><Card bodyClass="flex gap-2 p-2"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbUserExclamation size={24} /></div><div><h6>{counts.unregistered}</h6><span className="text-xs font-semibold">Unregistered</span></div></Card></div>
              </div>
              <FormListTable filterCriteria={filterCriteria} setFilterCriteria={setFilterCriteria} />
            </div>
          </AdaptiveCard>
        </Container>
        <FormListSelected />
    </MemberListProvider>
  );
};

export default Member;