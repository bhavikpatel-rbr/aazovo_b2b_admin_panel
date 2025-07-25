import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebounceInput from '@/components/shared/DebouceInput'
import Select from '@/components/ui/Select'
import Dialog from '@/components/ui/Dialog'
import {
    Card,
    DatePicker,
    Drawer,
    Dropdown,
    Form,
    FormItem,
    Input,
    Tag,
    Checkbox,
    Avatar,
    Skeleton, // Skeleton is already imported
} from '@/components/ui'

// Icons
import {
    TbPencil,
    TbTrash,
    TbChecks,
    TbSearch,
    TbFilter,
    TbPlus,
    TbCloudUpload,
    TbBriefcase,
    TbMapPin,
    TbUsers,
    TbReload,
    TbFileCheck,
    TbFileExcel,
    TbFileSmile,
    TbFileLike,
    TbLink,
    TbUser,
    TbUserCircle,
    TbMailShare,
    TbBrandWhatsapp,
    TbBell,
    TbCalendarEvent,
    TbColumns,
    TbX,
} from 'react-icons/tb'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'

// Redux
import { useAppDispatch } from '@/reduxtool/store'
import { shallowEqual, useSelector } from 'react-redux'
import {
    getJobPostsAction,
    addJobPostAction,
    editJobPostAction,
    deleteJobPostAction,
    deleteAllJobPostsAction,
    submitExportReasonAction,
    getDepartmentsAction,
    addScheduleAction,
    addNotificationAction,
    addTaskAction,
    getAllUsersAction,
} from '@/reduxtool/master/middleware'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { BsThreeDotsVertical } from 'react-icons/bs'
import classNames from 'classnames'
import { formatCustomDateTime } from '@/utils/formatCustomDateTime'
import { RichTextEditor } from '@/components/shared'

// --- Define Types ---
export type SelectOption = { value: any; label: string };
export type JobDepartmentListItem = { id: string | number; name: string }
export type JobDepartmentOption = { value: string; label: string }
export type JobPostStatusApi = 'Active' | 'Inactive' | string
export type JobPostStatusForm = 'Active' | 'Inactive'
export type JobPlatform = { id?: string | number | null; portal: string; link: string; application_count: number }
export type JobPostItem = {
    id: string | number
    job_title?: string
    status: JobPostStatusApi
    job_department_id: string | number
    description: string
    location: string
    created_by?: string
    vacancies: string | number
    experience: string
    job_plateforms?: JobPlatform[] | string
    created_at?: string
    updated_at?: string
    created_by_user?: { name: string; roles: { display_name: string }[] }
    updated_by_user?: { name: string; profile_pic_path?: string; roles: { display_name: string }[] }
}

// --- Constants for Form Selects ---
const JOB_POST_STATUS_OPTIONS_FORM: { value: JobPostStatusForm; label: string }[] = [{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }]
const jobPostStatusFormValues = JOB_POST_STATUS_OPTIONS_FORM.map((s) => s.value) as [JobPostStatusForm, ...JobPostStatusForm[]]
const jobStatusColor: Record<JobPostStatusApi, string> = { Active: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-b border-emerald-300 dark:border-emerald-700', Inactive: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-b border-red-300 dark:border-red-700' }
const PORTAL_OPTIONS = [{ label: 'Linkedin', value: 'Linkedin' }, { label: 'Naukri', value: 'Naukri' }, { label: 'Internal', value: 'Internal' }, { label: 'Glassdoor', value: 'Glassdoor' }]

// --- Zod Schemas ---
const scheduleSchema = z.object({
    event_title: z.string().min(3, "Title must be at least 3 characters."),
    event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
    date_time: z.date({ required_error: "Event date & time is required." }),
    remind_from: z.date().nullable().optional(),
    notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

const notificationSchema = z.object({
    notification_title: z.string().min(3, "Title must be at least 3 characters long."),
    send_users: z.array(z.string()).min(1, "Please select at least one user."),
    message: z.string().min(10, "Message must be at least 10 characters long."),
});
type NotificationFormData = z.infer<typeof notificationSchema>;

const taskSchema = z.object({
    task_title: z.string().min(3, 'Task title must be at least 3 characters.'),
    assign_to: z.array(z.string()).min(1, 'At least one assignee is required.'),
    priority: z.string().min(1, 'Please select a priority.'),
    due_date: z.date().nullable().optional(),
    description: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskSchema>;

const jobPlatformSchema = z.object({ id: z.union([z.string(), z.number(), z.null()]).optional().nullable(), portal: z.string().optional().nullable(), link: z.string().url('Must be a valid URL (e.g., https://...).'), application_count: z.coerce.number({ invalid_type_error: 'Count must be a number.' }).int('Count must be a whole number.').min(0, 'Count must be non-negative.') })
const jobPostFormSchema = z.object({
    job_title: z.string().min(1, 'Job Title is required.').max(150, 'Title too long (max 150 chars).'),
    job_department_id: z.string().min(1, 'Please select a department.'),
    description: z.string().optional().or(z.literal('')),
    location: z.string().optional().nullable(),
    experience: z.string().optional().nullable(),
    vacancies: z.string().optional().nullable(),
    status: z.enum(jobPostStatusFormValues, { errorMap: () => ({ message: 'Please select a status.' }) }),
    job_plateforms: z.any().optional().nullable(),
})
type JobPostFormData = z.infer<typeof jobPostFormSchema>
const filterFormSchema = z.object({ filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(), filterDepartment: z.array(z.object({ value: z.string(), label: z.string() })).optional() })
type FilterFormData = z.infer<typeof filterFormSchema>
const exportReasonSchema = z.object({ reason: z.string().min(1, 'Reason for export is required.').max(255, 'Reason cannot exceed 255 characters.') })
type ExportReasonFormData = z.infer<typeof exportReasonSchema>

// --- CSV Exporter Utility ---
const CSV_HEADERS_JOB = ['ID', 'Job Title', 'Status', 'Department Name', 'Location', 'Experience', 'Vacancies', 'Created At', 'Updated At', 'Updated By']
type JobPostExportItem = Omit<JobPostItem, 'created_at' | 'updated_at' | 'description' | 'job_plateforms' | 'created_by_user' | 'updated_by_user'> & { job_department_name?: string; created_at_formatted?: string; updated_at_formatted?: string; updated_by_name?: string }
const CSV_KEYS_JOB: (keyof JobPostExportItem)[] = ['id', 'job_title', 'status', 'job_department_name', 'location', 'experience', 'vacancies', 'created_at_formatted', 'updated_at_formatted', 'updated_by_name']
function exportJobPostsToCsv(filename: string, rows: JobPostItem[], departmentOptions: JobDepartmentOption[]) { if (!rows || !rows.length) { return false } const transformedRows: JobPostExportItem[] = rows.map((row) => ({ id: row.id, job_title: row.job_title, status: row.status, job_department_name: departmentOptions.find((d) => String(d.value) === String(row.job_department_id))?.label || String(row.job_department_id), location: row.location, experience: row.experience, vacancies: String(row.vacancies), created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A', updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : 'N/A', updated_by_name: row.updated_by_user?.name || 'N/A' })); const separator = ','; const csvContent = CSV_HEADERS_JOB.join(separator) + '\n' + transformedRows.map((row) => { return CSV_KEYS_JOB.map((k) => { let cell = row[k as keyof JobPostExportItem]; if (cell === null || cell === undefined) { cell = '' } else { cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) { cell = `"${cell}"` } } return cell }).join(separator) }).join('\n'); const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute('href', url); link.setAttribute('download', filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true } return false }

// ============================================================================
// --- MODALS SECTION ---
// ============================================================================
export type ModalType = 'email' | 'whatsapp' | 'notification' | 'task' | 'schedule' | 'share'
export interface ModalState { isOpen: boolean; type: ModalType | null; data: JobPostItem | null }
interface JobPostModalsProps { modalState: ModalState; onClose: () => void; userOptions: SelectOption[] }
const taskPriorityOptions: SelectOption[] = [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }];
const eventTypeOptions: SelectOption[] = [{ value: 'Meeting', label: 'Meeting' }, { value: 'Demo', label: 'Product Demo' }, { value: 'IntroCall', label: 'Introductory Call' }, { value: 'FollowUpCall', label: 'Follow-up Call' }, { value: 'Task', label: 'Task' }, { value: 'Reminder', label: 'Reminder' }];

// --- Individual Dialog Components ---
const SendEmailDialog: React.FC<{ jobPost: JobPostItem; onClose: () => void }> = ({ jobPost, onClose }) => {
    const onSendEmail = () => {
        const subject = `Regarding Job Post: ${jobPost.job_title}`;
        const body = `Hi,\n\nI wanted to share this job opportunity with you: "${jobPost.job_title}".\n\nDescription: ${jobPost.description}\n\nYou can find more details and apply via the official links.\n\nBest regards.`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        toast.push(<Notification type="success" title="Opening Email Client" />);
        onClose();
    };
    return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Send Email about "{jobPost.job_title}"</h5><p>This will open your default email client with a pre-filled template. Are you sure you want to proceed?</p><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" onClick={onSendEmail}>Proceed</Button></div></Dialog>)
}

const SendWhatsAppDialog: React.FC<{ jobPost: JobPostItem; onClose: () => void }> = ({ jobPost, onClose }) => {
    const onSendMessage = () => {
        const jobLink = typeof jobPost.job_plateforms === 'string' ? '' : jobPost.job_plateforms?.[0]?.link || '';
        const message = `Hi, check out this job opportunity: ${jobPost.job_title}. Learn more and apply here: ${jobLink}`;
        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        toast.push(<Notification type="success" title="Opening WhatsApp" />);
        onClose();
    };
    return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Share "{jobPost.job_title}" on WhatsApp</h5><p>This will open WhatsApp in a new tab with a pre-filled message. Continue?</p><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" onClick={onSendMessage}>Open WhatsApp</Button></div></Dialog>)
}

const AddNotificationDialog: React.FC<{ jobPost: JobPostItem; onClose: () => void; userOptions: SelectOption[] }> = ({ jobPost, onClose, userOptions }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({
        resolver: zodResolver(notificationSchema),
        defaultValues: { notification_title: `Regarding Job Post: ${jobPost.job_title}`, send_users: [], message: `Please take a look at the job post: ${jobPost.job_title} (ID: ${jobPost.id})` },
        mode: "onChange",
    });
    const onSend = async (formData: NotificationFormData) => {
        setIsLoading(true);
        const payload = { ...formData, module_id: String(jobPost.id), module_name: "JobPost" };
        try {
            await dispatch(addNotificationAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Notification Sent" />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Failed to Send" children={error?.message || "An unknown error occurred."} />);
        } finally {
            setIsLoading(false);
        }
    };
    return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Add Notification for "{jobPost.job_title}"</h5><Form onSubmit={handleSubmit(onSend)}><FormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem><FormItem label="Notify Users" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<Select isMulti options={userOptions} value={userOptions.filter((o) => field.value?.includes(o.value))} onChange={(opts) => field.onChange(opts?.map((o) => o.value))} placeholder="Select users..." />)} /></FormItem><FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => (<Input textArea {...field} placeholder="Enter notification message..." />)} /></FormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid}>Create</Button></div></Form></Dialog>)
}

const AssignTaskDialog: React.FC<{ jobPost: JobPostItem; onClose: () => void; userOptions: SelectOption[] }> = ({ jobPost, onClose, userOptions }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: { task_title: `Follow up on job post: ${jobPost.job_title}`, assign_to: [], priority: 'Medium', due_date: null, description: `Task related to job post ID: ${jobPost.id}. Description: ${jobPost.description}` },
        mode: "onChange",
    });
    const onSubmit = async (data: TaskFormData) => {
        setIsLoading(true);
        const payload = { ...data, module_id: String(jobPost.id), module_name: "JobPost", due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined };
        try {
            await dispatch(addTaskAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Task Assigned" />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Assignment Failed" children={error?.message} />);
        } finally {
            setIsLoading(false);
        }
    };
    return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Assign Task for "{jobPost.job_title}"</h5><Form onSubmit={handleSubmit(onSubmit)}><FormItem label="Task Title" invalid={!!errors.task_title} errorMessage={errors.task_title?.message}><Controller name="task_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></FormItem><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormItem label="Assign To" invalid={!!errors.assign_to} errorMessage={errors.assign_to?.message}><Controller name="assign_to" control={control} render={({ field }) => (<Select isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter(o => field.value?.includes(o.value))} onChange={(opts) => field.onChange(opts?.map(o => o.value) || [])} />)} /></FormItem><FormItem label="Priority" invalid={!!errors.priority} errorMessage={errors.priority?.message}><Controller name="priority" control={control} render={({ field }) => (<Select placeholder="Select Priority" options={taskPriorityOptions} value={taskPriorityOptions.find(p => p.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></FormItem></div><FormItem label="Due Date (Optional)"><Controller name="due_date" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />} /></FormItem><FormItem label="Description"><Controller name="description" control={control} render={({ field }) => (<Input textArea {...field} rows={4} />)} /></FormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Assign Task</Button></div></Form></Dialog>)
}

const AddScheduleDialog: React.FC<{ jobPost: JobPostItem; onClose: () => void; }> = ({ jobPost, onClose }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: { event_title: `Interview for ${jobPost.job_title}`, event_type: undefined, date_time: null as any, remind_from: null, notes: `Schedule regarding job post ID: ${jobPost.id}` },
        mode: 'onChange',
    });
    const onAddEvent = async (data: ScheduleFormData) => {
        setIsLoading(true);
        const payload = { module_id: Number(jobPost.id), module_name: 'JobPost', event_title: data.event_title, event_type: data.event_type, date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'), ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }), notes: data.notes || '' };
        try {
            await dispatch(addScheduleAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for ${jobPost.job_title}.`} />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
        } finally {
            setIsLoading(false);
        }
    };
    return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Add Schedule for "{jobPost.job_title}"</h5><Form onSubmit={handleSubmit(onAddEvent)}><FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<Select placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem><FormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem></div><FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem><FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div></Form></Dialog>);
};

const SharePostLinksDialog: React.FC<{ jobPost: JobPostItem; onClose: () => void }> = ({ jobPost, onClose }) => { let parsedPlatforms: JobPlatform[] = []; if (jobPost.job_plateforms) { if (typeof jobPost.job_plateforms === 'string') { try { parsedPlatforms = JSON.parse(jobPost.job_plateforms) } catch (e) { } } else if (Array.isArray(jobPost.job_plateforms)) { parsedPlatforms = jobPost.job_plateforms } } const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text).then(() => { toast.push(<Notification type="success" title="Link Copied!" />) }, () => { toast.push(<Notification type="danger" title="Failed to copy." />) }) }; return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Share Links for "{jobPost.job_title}"</h5><div className="flex flex-col gap-3 mt-4">{parsedPlatforms.length > 0 ? (parsedPlatforms.map((platform, index) => (<div key={index} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><div className="flex flex-col"><span className="font-semibold">{platform.portal}</span><a href={platform.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline break-all">{platform.link}</a></div><Button size="sm" onClick={() => copyToClipboard(platform.link)}>Copy</Button></div>))) : (<p>No shareable links available for this job post.</p>)}</div><div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div></Dialog>) }

const JobPostModals: React.FC<JobPostModalsProps> = ({ modalState, onClose, userOptions }) => {
    const { type, data: jobPost, isOpen } = modalState;
    if (!isOpen || !jobPost) return null;
    switch (type) {
        case 'email': return <SendEmailDialog jobPost={jobPost} onClose={onClose} />;
        case 'whatsapp': return <SendWhatsAppDialog jobPost={jobPost} onClose={onClose} />;
        case 'notification': return <AddNotificationDialog jobPost={jobPost} onClose={onClose} userOptions={userOptions} />;
        case 'task': return <AssignTaskDialog jobPost={jobPost} onClose={onClose} userOptions={userOptions} />;
        case 'schedule': return <AddScheduleDialog jobPost={jobPost} onClose={onClose} />;
        case 'share': return <SharePostLinksDialog jobPost={jobPost} onClose={onClose} />;
        default: return null;
    }
};

const ActionColumn = ({ item, onEdit, onOpenModal }: { item: JobPostItem; onEdit: (item: JobPostItem) => void; onOpenModal: (type: ModalType, data: JobPostItem) => void; }) => {
    const iconButtonClass = 'text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none';
    const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700';
    return (<div className="flex items-center justify-center gap-1"><Tooltip title="Edit Job Post"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400')} role="button" onClick={() => onEdit(item)}><TbPencil /></div></Tooltip><Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-lg" />}><Dropdown.Item onClick={() => onOpenModal('email', item)} className="flex items-center gap-2"><TbMailShare size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item><Dropdown.Item onClick={() => onOpenModal('whatsapp', item)} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span></Dropdown.Item><Dropdown.Item onClick={() => onOpenModal('notification', item)} className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add Notification</span></Dropdown.Item><Dropdown.Item onClick={() => onOpenModal('task', item)} className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign Task</span></Dropdown.Item><Dropdown.Item onClick={() => onOpenModal('schedule', item)} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Add Schedule</span></Dropdown.Item><Dropdown.Item onClick={() => onOpenModal('share', item)} className="flex items-center gap-2"><TbLink size={18} /> <span className="text-xs">Share Post Links</span></Dropdown.Item></Dropdown></div>)
}

type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement> }
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(({ onInputChange }, ref) => (<DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
ItemSearch.displayName = 'ItemSearch'

const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount, isDataReady }: {
    onSearchChange: (query: string) => void;
    onFilter: () => void;
    onExport: () => void;
    onClearFilters: () => void;
    columns: ColumnDef<JobPostItem>[];
    filteredColumns: ColumnDef<JobPostItem>[];
    setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<JobPostItem>[]>>;
    activeFilterCount: number;
    isDataReady: boolean;
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
                <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters" disabled={!isDataReady} />
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto" disabled={!isDataReady}>
                    Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}
                </Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto" disabled={!isDataReady}>Export</Button>
            </div>
        </div>
    );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll, departmentOptions }: {
    filterData: FilterFormData;
    onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
    onClearAll: () => void;
    departmentOptions: JobDepartmentOption[];
}) => {
    const { filterStatus, filterDepartment } = filterData;
    if (!filterStatus?.length && !filterDepartment?.length) return null;

    const departmentLabelMap = new Map(departmentOptions.map(d => [d.value, d.label]));

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {filterStatus?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatus', item.value)} /></Tag>)}
            {filterDepartment?.map(item => <Tag key={`dept-${item.value}`} prefix>Dept: {departmentLabelMap.get(item.value) || item.value} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterDepartment', item.value)} /></Tag>)}
            <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
        </div>
    );
};

type JobPostsTableProps = { columns: ColumnDef<JobPostItem>[]; data: JobPostItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: JobPostItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: JobPostItem) => void; onAllRowSelect: (checked: boolean, rows: Row<JobPostItem>[]) => void }
const JobPostsTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: JobPostsTableProps) => (<DataTable selectable columns={columns} data={data} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} noData={!loading && data.length === 0} />)

type JobPostsSelectedFooterProps = { selectedItems: JobPostItem[]; onDeleteSelected: () => void; isDeleting: boolean }
const JobPostsSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: JobPostsSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; const handleDeleteClick = () => setDeleteConfirmOpen(true); const handleCancelDelete = () => setDeleteConfirmOpen(false); const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmOpen(false) }; return (<><StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"><div className="flex items-center justify-between w-full px-4 sm:px-8"><span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Job Post{selectedItems.length > 1 ? 's' : ''} selected</span></span></span><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}>Delete Selected</Button></div></StickyFooter><ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Job Post${selectedItems.length > 1 ? 's' : ''}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} loading={isDeleting}><p>Are you sure you want to delete the selected job post{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.</p></ConfirmDialog></>) }


const JobPostsListing = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { jobPostsData = { data: [], counts: {} }, departmentsData = { data: [] }, getAllUserData = [] } = useSelector(masterSelector, shallowEqual);
    const departmentOptions = useMemo(() => Array.isArray(departmentsData?.data) ? departmentsData.data.map((dept: JobDepartmentListItem) => ({ value: String(dept.id), label: dept.name })) : [], [departmentsData?.data]);
    const userOptions: SelectOption[] = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map(user => ({ value: String(user.id), label: `(${user.employee_id}) - ${user.name || 'N/A'}` })) : [], [getAllUserData]);
    console.log("departmentsData", departmentsData?.data);

    const [initialLoading, setInitialLoading] = useState(true);
    const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
    const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<JobPostItem | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<JobPostItem | null>(null);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
    const [imageViewerSrc, setImageViewerSrc] = useState<string | null>(null);

    const isDataReady = !initialLoading;
    const tableLoading = initialLoading || isSubmitting || isDeleting;

    const handleOpenModal = (type: ModalType, jobPostData: JobPostItem) => setModalState({ isOpen: true, type, data: jobPostData });
    const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

    const openImageViewer = (src?: string) => {
        if (src) {
            setImageViewerSrc(src);
        }
    };

    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterStatus: [], filterDepartment: [] });
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: 'desc', key: 'created_at' }, query: '' });
    const [selectedItems, setSelectedItems] = useState<JobPostItem[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setInitialLoading(true);
            try {
                await Promise.all([
                    dispatch(getJobPostsAction()),
                    dispatch(getDepartmentsAction()),
                    dispatch(getAllUsersAction())
                ]);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                toast.push(<Notification title="Data Fetch Failed" type="danger">Could not load required data.</Notification>);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [dispatch]);

    const defaultFormValues: JobPostFormData = useMemo(() => ({ job_title: '', job_department_id: departmentOptions[0]?.value || '', description: '', location: '', experience: '', vacancies: '1', status: 'Active', job_plateforms: [{ portal: '', link: '', application_count: 0, id: null }] }), [departmentOptions]);
    const formMethods = useForm<JobPostFormData>({ resolver: zodResolver(jobPostFormSchema), defaultValues: defaultFormValues, mode: 'onChange' });
    useEffect(() => { if ((isAddDrawerOpen || isEditDrawerOpen) && departmentOptions.length > 0 && !formMethods.getValues('job_department_id')) { formMethods.setValue('job_department_id', defaultFormValues.job_department_id, { shouldValidate: true }) } }, [departmentOptions, isAddDrawerOpen, isEditDrawerOpen, formMethods, defaultFormValues.job_department_id]);
    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: '' }, mode: 'onChange' });
    const openAddDrawer = useCallback(() => { formMethods.reset(defaultFormValues); setEditingItem(null); setIsAddDrawerOpen(true) }, [formMethods, defaultFormValues]);
    const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
    const openEditDrawer = useCallback((item: JobPostItem) => {
        setEditingItem(item);
        let parsedPlatforms: JobPlatform[] = [{ portal: '', link: '', application_count: 0, id: null }];
        if (item.job_plateforms) {
            let tempPlatforms: any[] = [];
            if (typeof item.job_plateforms === 'string') { try { tempPlatforms = JSON.parse(item.job_plateforms) } catch (e) { console.error('Failed to parse job_plateforms string:', e) } }
            else if (Array.isArray(item.job_plateforms)) { tempPlatforms = item.job_plateforms }
            if (Array.isArray(tempPlatforms) && tempPlatforms.length > 0) { parsedPlatforms = tempPlatforms.map((p) => ({ id: p.id || null, portal: p.portal || '', link: p.link || '', application_count: Number(p.application_count) || 0 })) }
            else { parsedPlatforms = [{ portal: '', link: '', application_count: 0, id: null }] }
        }
        formMethods.reset({ job_title: item.job_title || '', job_department_id: String(item.job_department_id), description: item.description || '', location: item.location || '', experience: item.experience || '', vacancies: String(item.vacancies || ''), status: (item.status as JobPostStatusForm) || 'Active', job_plateforms: parsedPlatforms });
        setIsEditDrawerOpen(true)
    }, [formMethods]);
    const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false) }, []);
    const onSubmitHandler = async (data: JobPostFormData) => {
        setIsSubmitting(true);
        const loggedInUserId = '1';
        const jobPlatformsString = JSON.stringify(data.job_plateforms);
        const baseApiPayload = { status: data.status as JobPostStatusApi, job_title: data.job_title, description: data.description, location: data.location, vacancies: data.vacancies, experience: data.experience, job_plateforms: jobPlatformsString, job_department_id: parseInt(data.job_department_id, 10) };
        try {
            if (editingItem && editingItem.id) {
                const editPayload = { ...baseApiPayload, id: editingItem.id, _method: 'PUT', created_by: editingItem.created_by || loggedInUserId };
                await dispatch(editJobPostAction(editPayload)).unwrap();
                toast.push(<Notification title="Job Post Updated" type="success" duration={2000}>Job post saved.</Notification>);
                closeEditDrawer()
            } else {
                const addPayload = { ...baseApiPayload, created_by: loggedInUserId };
                await dispatch(addJobPostAction(addPayload)).unwrap();
                toast.push(<Notification title="Job Post Added" type="success" duration={2000}>New job post created.</Notification>);
                closeAddDrawer()
            }
            dispatch(getJobPostsAction())
        } catch (error: any) {
            toast.push(<Notification title={editingItem ? 'Update Failed' : 'Add Failed'} type="danger" duration={3000}>{error?.message || 'Operation failed.'}</Notification>);
            console.error('Job Post Submit Error:', error)
        } finally {
            setIsSubmitting(false)
        }
    };
    const handleDeleteClick = useCallback((item: JobPostItem) => { if (!item.id) return; setItemToDelete(item); setSingleDeleteConfirmOpen(true) }, []);
    const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete?.id) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteJobPostAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Job Post Deleted" type="success" duration={2000}>{`Job post "${itemToDelete.job_title || itemToDelete.id}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id)); dispatch(getJobPostsAction()) } catch (error: any) { toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{error.message || 'Failed to delete job post.'}</Notification>) } finally { setIsDeleting(false); setItemToDelete(null) } }, [dispatch, itemToDelete]);
    const handleDeleteSelected = useCallback(async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const idsToDelete = selectedItems.map((item) => String(item.id)).filter((id) => id); if (idsToDelete.length === 0) { setIsDeleting(false); return } try { await dispatch(deleteAllJobPostsAction({ ids: idsToDelete.join(',') })).unwrap(); toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{`${idsToDelete.length} job post(s) deleted.`}</Notification>); setSelectedItems([]); dispatch(getJobPostsAction()) } catch (error: any) { toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || 'Failed to delete selected job posts.'}</Notification>) } finally { setIsDeleting(false) } }, [dispatch, selectedItems]);
    const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true) }, [filterFormMethods, filterCriteria]);
    const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })) }, []);
    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria({ filterStatus: data.filterStatus || [], filterDepartment: data.filterDepartment || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer() }, [closeFilterDrawer, handleSetTableData]);
    const onClearFilters = useCallback(() => { const defaultFilters = { filterStatus: [], filterDepartment: [] }; filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); handleSetTableData({ pageIndex: 1, query: '' }); dispatch(getJobPostsAction()); setIsFilterDrawerOpen(false) }, [filterFormMethods, dispatch, handleSetTableData]);
    const handleCardClick = (status?: JobPostStatusForm | 'all') => { onClearFilters(); if (status && status !== 'all') { const statusOption = JOB_POST_STATUS_OPTIONS_FORM.find(opt => opt.value === status); if (statusOption) { setFilterCriteria({ filterStatus: [statusOption] }); } } };
    const handleRemoveFilter = (key: keyof FilterFormData, value: string) => { setFilterCriteria(prev => { const newFilters = { ...prev }; const currentValues = prev[key] as { value: string; label: string }[] | undefined; if (currentValues) { const newValues = currentValues.filter(item => item.value !== value); (newFilters as any)[key] = newValues.length > 0 ? newValues : undefined; } return newFilters; }); setTableData(prev => ({ ...prev, pageIndex: 1 })); };
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => { const sourceData: JobPostItem[] = Array.isArray(jobPostsData?.data) ? jobPostsData?.data : []; let processedData: JobPostItem[] = cloneDeep(sourceData); if (filterCriteria.filterStatus?.length) { const statusValues = filterCriteria.filterStatus.map((s) => s.value); processedData = processedData.filter((item) => statusValues.includes(item.status)) } if (filterCriteria.filterDepartment?.length) { const deptValues = filterCriteria.filterDepartment.map((d) => d.value); processedData = processedData.filter((item) => deptValues.includes(String(item.job_department_id))) } if (tableData.query && tableData.query.trim() !== '') { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter((item) => Object.values(item).some((val) => String(val).toLowerCase().includes(query))) } const { order, key } = tableData.sort as OnSortParam; if (order && key && processedData.length > 0 && typeof key === 'string') { processedData.sort((a, b) => { const aVal = a[key as keyof JobPostItem]; const bVal = b[key as keyof JobPostItem]; if (key === 'created_at' || key === 'updated_at') { const dateA = aVal ? new Date(aVal as string).getTime() : 0; const dateB = bVal ? new Date(bVal as string).getTime() : 0; return order === 'asc' ? dateA - dateB : dateB - dateA } if (key === 'vacancies') { const numA = parseInt(String(aVal), 10); const numB = parseInt(String(bVal), 10); if (!isNaN(numA) && !isNaN(numB)) { return order === 'asc' ? numA - numB : numB - numA } } const aStr = String(aVal ?? '').toLowerCase(); const bStr = String(bVal ?? '').toLowerCase(); return order === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr) }) } const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize; return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData } }, [jobPostsData?.data, tableData, filterCriteria]);
    const activeFilterCount = useMemo(() => { return Object.values(filterCriteria).filter(value => Array.isArray(value) && value.length > 0).length; }, [filterCriteria]);
    const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return } exportReasonFormMethods.reset({ reason: '' }); setIsExportReasonModalOpen(true) };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const moduleName = 'JobPosts'; const timestamp = new Date().toISOString().split('T')[0]; const fileName = `job_posts_export_${timestamp}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap(); toast.push(<Notification title="Export Reason Submitted" type="success" />); const exportSuccess = exportJobPostsToCsv(fileName, allFilteredAndSortedData, departmentOptions); if (exportSuccess) { toast.push(<Notification title="Export Successful" type="success">Data exported to {fileName}.</Notification>) } else if (allFilteredAndSortedData && allFilteredAndSortedData.length > 0) { toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>) } setIsExportReasonModalOpen(false) } catch (error: any) { toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message || 'Could not submit export reason.'}</Notification>) } finally { setIsSubmittingExportReason(false) } };
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]) }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }) }, [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: JobPostItem) => { setSelectedItems((prev) => checked ? prev.some((item) => item.id === row.id) ? prev : [...prev, row] : prev.filter((item) => item.id !== row.id)) }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<JobPostItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA] }); else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))) } }, []);

    const columns: ColumnDef<JobPostItem>[] = useMemo(() => [
        { header: 'Job Title', accessorKey: 'job_title', size: 150, enableSorting: true, cell: (props) => { const value = props.getValue<string>() || ''; const maxLength = 20; const isTrimmed = value.length > maxLength; const displayValue = isTrimmed ? `${value.slice(0, maxLength)}...` : value; return (<Tooltip title={isTrimmed ? value : ''}><span className="font-semibold cursor-help">{displayValue}</span></Tooltip>) } },
        { header: 'Department', accessorKey: 'job_department_id', size: 160, enableSorting: true, cell: (props) => { return props?.row?.original?.job_department?.name || "" } },
        { header: 'Location', accessorKey: 'location', size: 130, enableSorting: true },
        { header: 'Vacancies', accessorKey: 'vacancies', size: 90, enableSorting: true, meta: { cellClass: 'text-center', headerClass: 'text-center' } },
        { header: 'Status', accessorKey: 'status', size: 100, enableSorting: true, cell: (props) => { const statusVal = props.getValue<JobPostStatusApi>(); return (<Tag className={classNames('capitalize whitespace-nowrap text-center', jobStatusColor[statusVal] || 'bg-gray-100 text-gray-600')}>{statusVal}</Tag>) } },
        {
            header: 'Updated Info',
            accessorKey: 'updated_at',
            enableSorting: true,
            size: 200,
            cell: (props) => {
                const { updated_at, updated_by_user } = props.row.original;
                const formattedDate = updated_at ? formatCustomDateTime(updated_at) : 'N/A';
                return (
                    <div className="flex items-center gap-2">
                        <Avatar
                            src={updated_by_user?.profile_pic_path}
                            shape="circle"
                            size="sm"
                            icon={<TbUserCircle />}
                            className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                            onClick={() => openImageViewer(updated_by_user?.profile_pic_path)}
                        />
                        <div>
                            <span className='font-semibold'>{updated_by_user?.name || 'N/A'}</span>
                            <div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ''}</div>
                            <div className="text-xs text-gray-500">{formattedDate}</div>
                        </div>
                    </div>
                );
            }
        },
        { header: 'Actions', id: 'actions', meta: { HeaderClass: "text-center", cellClass: "text-center" }, size: 100, cell: (props) => (<ActionColumn item={props.row.original} onEdit={openEditDrawer} onOpenModal={handleOpenModal} />) },
    ], [departmentOptions, openEditDrawer, handleOpenModal]);

    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<JobPostItem>[]>(columns);


    const renderDrawerForm = (currentFormMethods: typeof formMethods, currentEditingItem: JobPostItem | null) => {
        const { fields, append, remove } = useFieldArray({ control: currentFormMethods.control, name: 'job_plateforms' });
        return (<>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <FormItem label={<div>Job Title<span className="text-red-500"> *</span></div>} className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.job_title} errorMessage={currentFormMethods.formState.errors.job_title?.message}><Controller name="job_title" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbBriefcase />} placeholder="e.g., Software Engineer" />)} /></FormItem>
                <FormItem label={<div>Job Department<span className="text-red-500"> *</span></div>} invalid={!!currentFormMethods.formState.errors.job_department_id} errorMessage={currentFormMethods.formState.errors.job_department_id?.message}><Controller name="job_department_id" control={currentFormMethods.control} render={({ field }) => (<Select placeholder={departmentOptions.length > 0 ? 'Select Department' : 'Loading...'} options={departmentOptions} value={departmentOptions.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} disabled={initialLoading} />)} /></FormItem>
                <FormItem label={<div>Status<span className="text-red-500"> *</span></div>} invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message}><Controller name="status" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={JOB_POST_STATUS_OPTIONS_FORM} value={JOB_POST_STATUS_OPTIONS_FORM.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></FormItem>
                <FormItem label="Location" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.location} errorMessage={currentFormMethods.formState.errors.location?.message}><Controller name="location" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbMapPin />} placeholder="e.g., Remote, New York" />)} /></FormItem>
                <FormItem label="Experience Required" invalid={!!currentFormMethods.formState.errors.experience} errorMessage={currentFormMethods.formState.errors.experience?.message}><Controller name="experience" control={currentFormMethods.control} render={({ field }) => (<Input {...field} placeholder="e.g., 2+ Years, Entry Level" />)} /></FormItem>
                <FormItem label="Total Vacancies" invalid={!!currentFormMethods.formState.errors.vacancies} errorMessage={currentFormMethods.formState.errors.vacancies?.message}><Controller name="vacancies" control={currentFormMethods.control} render={({ field }) => (<Input {...field} type="text" prefix={<TbUsers />} placeholder="e.g., 5 or 'Multiple'" />)} /></FormItem>
                <FormItem label="Description" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.description} errorMessage={currentFormMethods.formState.errors.description?.message}>
                    <Controller name="description" control={currentFormMethods.control} render={({ field }) => (<RichTextEditor {...field} content={field.value} onChange={(val) => field.onChange(val.html)} placeholder="Detailed job description..." />)} /></FormItem>
            </div>
            <div className="md:col-span-2 mt-4">
                <div className="flex justify-between items-center mb-2"><h6 className="text-gray-700 dark:text-gray-200">Job Platforms</h6><Button type="button" size="sm" variant="outline" onClick={() => append({ portal: '', link: '', application_count: 0, id: null })}>Add Platform</Button></div>
                {currentFormMethods.formState.errors.job_plateforms && !currentFormMethods.formState.errors.job_plateforms.root && !Array.isArray(currentFormMethods.formState.errors.job_plateforms) && (<div className="text-red-500 text-xs mb-2">{currentFormMethods.formState.errors.job_plateforms.message}</div>)}
                {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto] gap-x-3 gap-y-2 border p-3 rounded-md mb-3 items-end border-gray-200">
                        <FormItem label="Portal" className="mb-0" invalid={!!currentFormMethods.formState.errors.job_plateforms?.[index]?.portal} errorMessage={currentFormMethods.formState.errors.job_plateforms?.[index]?.portal?.message}><Controller name={`job_plateforms.${index}.portal`} control={currentFormMethods.control} render={({ field: controllerField }) => (<Select {...controllerField} placeholder="Select Portal" options={PORTAL_OPTIONS} value={PORTAL_OPTIONS.find((o) => o.value === controllerField.value)} onChange={(opt) => controllerField.onChange(opt?.value)} />)} /></FormItem>
                        <FormItem label="Link" className="mb-0" invalid={!!currentFormMethods.formState.errors.job_plateforms?.[index]?.link} errorMessage={currentFormMethods.formState.errors.job_plateforms?.[index]?.link?.message}><Controller name={`job_plateforms.${index}.link`} control={currentFormMethods.control} render={({ field: controllerField }) => (<Input {...controllerField} placeholder="https://linkedin.com/jobs/..." />)} /></FormItem>
                        <FormItem label="App. Count" className="mb-0 md:w-32" invalid={!!currentFormMethods.formState.errors.job_plateforms?.[index]?.application_count} errorMessage={currentFormMethods.formState.errors.job_plateforms?.[index]?.application_count?.message}><Controller name={`job_plateforms.${index}.application_count`} control={currentFormMethods.control} render={({ field: controllerField }) => (<Input {...controllerField} type="number" min={0} placeholder="0" />)} /></FormItem>
                        <Button type="button" size="sm" variant="plain" icon={<TbTrash />} onClick={() => remove(index)} className="text-red-500 self-center mb-1 md:mb-0" disabled={fields.length <= 1}></Button>
                    </div>
                ))}
            </div>
            {currentEditingItem && (<div className=""><div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded"><div><b className="font-semibold text-primary">Latest Update:</b><p className="text-sm font-semibold mt-1">{currentEditingItem.updated_by_user?.name || 'N/A'}</p><p>{currentEditingItem.updated_by_user?.roles?.[0]?.display_name || 'N/A'}</p></div><div className="text-right"><br /><span className="font-semibold">Created At:</span> <span>{currentEditingItem.created_at ? `${new Date(currentEditingItem.created_at).getDate()} ${new Date(currentEditingItem.created_at).toLocaleString('en-US', { month: 'short' })} ${new Date(currentEditingItem.created_at).getFullYear()}, ${new Date(currentEditingItem.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : 'N/A'}</span><br /><span className="font-semibold">Updated At:</span> <span>{currentEditingItem.updated_at ? `${new Date(currentEditingItem.updated_at).getDate()} ${new Date(currentEditingItem.updated_at).toLocaleString('en-US', { month: 'short' })} ${new Date(currentEditingItem.updated_at).getFullYear()}, ${new Date(currentEditingItem.updated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : 'N/A'}</span></div></div></div>)}
        </>)
    }

    const cardClass = "rounded-md transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";

    const renderCardContent = (content: number | undefined) => {
        if (initialLoading) {
            return <Skeleton width={50} height={20} />;
        }
        return <h6 className="font-bold">{content ?? 0}</h6>;
    };

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"><h5 className="mb-2 sm:mb-0">Job Posts</h5><Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={!isDataReady}>Add New</Button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-4 gap-4">
                        <Tooltip title="Click to show all job posts"><div onClick={() => handleCardClick('all')} className={cardClass}><Card bodyClass="flex gap-2 p-3" className="rounded-md border-blue-200 dark:border-blue-700"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-200"><TbBriefcase size={24} /></div><div><div className="text-blue-500 dark:text-blue-200">{renderCardContent(jobPostsData?.counts?.total)}</div><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show active job posts"><div onClick={() => handleCardClick('Active')} className={cardClass}><Card bodyClass="flex gap-2 p-3" className="rounded-md border-violet-200 dark:border-violet-700"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 text-violet-500 dark:text-violet-200"><TbFileCheck size={24} /></div><div><div className="text-violet-500 dark:text-violet-200">{renderCardContent(jobPostsData?.counts?.active)}</div><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show Inactive posts"><div onClick={() => handleCardClick('Inactive')} className={cardClass}><Card bodyClass="flex gap-2 p-3" className="rounded-md border-red-200 dark:border-red-700"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-200"><TbFileExcel size={24} /></div><div><div className="text-red-500 dark:text-red-200">{renderCardContent(jobPostsData?.counts?.expired)}</div><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
                        <Card bodyClass="flex gap-2 p-3" className="rounded-md border border-orange-200 dark:border-orange-700 cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 dark:bg-orange-500/20 text-orange-500 dark:text-orange-200"><TbFileSmile size={24} /></div><div><div className="text-orange-500 dark:text-orange-200">{renderCardContent(jobPostsData?.counts?.views)}</div><span className="font-semibold text-xs">Total Views</span></div></Card>
                        <Card bodyClass="flex gap-2 p-3" className="rounded-md border border-green-200 dark:border-green-700 cursor-default"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-200"><TbFileLike size={24} /></div><div><div className="text-green-500 dark:text-green-200">{renderCardContent(jobPostsData?.counts?.applicants)}</div><span className="font-semibold text-xs">Applicants</span></div></Card>
                    </div>
                    <div className="mb-4">
                        <ItemTableTools
                            onSearchChange={handleSearchChange}
                            onFilter={openFilterDrawer}
                            onExport={handleOpenExportReasonModal}
                            onClearFilters={onClearFilters}
                            columns={columns}
                            filteredColumns={filteredColumns}
                            setFilteredColumns={setFilteredColumns}
                            activeFilterCount={activeFilterCount}
                            isDataReady={isDataReady}
                        />
                    </div>
                    <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} departmentOptions={departmentOptions} />
                    <div className="mt-4"><JobPostsTable columns={filteredColumns} data={pageData} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /></div>
                </AdaptiveCard>
            </Container>

            <JobPostsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
            <JobPostModals modalState={modalState} onClose={handleCloseModal} userOptions={userOptions} />

            <Drawer title={editingItem ? 'Edit Job Post' : 'Add New Job Post'} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={700} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button><Button size="sm" variant="solid" form="jobPostForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? editingItem ? 'Saving...' : 'Adding...' : editingItem ? 'Save' : 'Save'}</Button></div>}>
                <Form id="jobPostForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-1">{renderDrawerForm(formMethods, editingItem)}</Form>
            </Drawer>
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="text-right w-full flex justify-end gap-2"><Button size="sm" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterJobPostForm" type="submit">Apply</Button></div>}>
                <Form id="filterJobPostForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Filter by Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Status" options={JOB_POST_STATUS_OPTIONS_FORM.map((s) => ({ value: s.value, label: s.label }))} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
                    <FormItem label="Filter by Department"><Controller name="filterDepartment" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder={departmentOptions.length > 0 ? 'Any Department' : 'Loading...'} options={departmentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} disabled={initialLoading} />)} /></FormItem>
                </Form>
            </Drawer>

            <Dialog isOpen={!!imageViewerSrc} onClose={() => setImageViewerSrc(null)} onRequestClose={() => setImageViewerSrc(null)}>
                <img src={imageViewerSrc || ''} alt="User Profile" className="max-w-full max-h-[80vh] mx-auto" />
            </Dialog>

            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? 'Submitting...' : 'Submit & Export'} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)() }} className="flex flex-col gap-4 mt-2">
                    <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem>
                </Form>
            </ConfirmDialog>
            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Job Post" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null) }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null) }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null) }} onConfirm={onConfirmSingleDelete} loading={isDeleting}>
                <p>Are you sure you want to delete the job post "<strong>{itemToDelete?.job_title || itemToDelete?.id}</strong>"? This action cannot be undone.</p>
            </ConfirmDialog>
        </>
    )
}

export default JobPostsListing