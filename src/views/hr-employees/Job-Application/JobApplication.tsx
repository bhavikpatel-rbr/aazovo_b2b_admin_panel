import React, { useState, useMemo, useCallback, Ref, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import cloneDeep from 'lodash/cloneDeep'
import classNames from 'classnames'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import type { MouseEvent } from 'react'

// UI Components
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import DataTable from '@/components/shared/DataTable'
import Tooltip from '@/components/ui/Tooltip'
import Tag from '@/components/ui/Tag'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import StickyFooter from '@/components/shared/StickyFooter'
import DebouceInput from '@/components/shared/DebouceInput'
import { Input } from '@/components/ui/Input'
import { FormItem, FormContainer, Form } from '@/components/ui/Form'
import DatePicker from '@/components/ui/DatePicker'
import Select from '@/components/ui/Select'
import { Card, Drawer, Dropdown, Checkbox, Skeleton } from '@/components/ui' // Skeleton Imported

// Icons
import {
    TbPencil,
    TbEye,
    TbCalendarEvent,
    TbPlus,
    TbChecks,
    TbSearch,
    TbFilter,
    TbUserCircle,
    TbBriefcase,
    TbLink,
    TbReload,
    TbMail,
    TbMailSpark,
    TbMailUp,
    TbMailSearch,
    TbMailCheck,
    TbMailHeart,
    TbMailX,
    TbUserShare,
    TbBrandWhatsapp,
    TbUser,
    TbUserCheck,
    TbCalendarTime,
    TbDownload,
    TbBell,
    TbTagStarred,
    TbColumns,
    TbX,
    TbCheck,
} from 'react-icons/tb'
import { BsThreeDotsVertical } from 'react-icons/bs'

// Redux
import { useAppDispatch } from '@/reduxtool/store'
import { shallowEqual, useSelector } from 'react-redux'
import {
    addAllActionAction,
    addNotificationAction,
    addScheduleAction,
    addTaskAction,
    getAllUsersAction,
    getDepartmentsAction,
    getJobApplicationsAction,
    submitExportReasonAction,
} from '@/reduxtool/master/middleware'
import { masterSelector } from '@/reduxtool/master/masterSlice'
import { authSelector } from '@/reduxtool/auth/authSlice'

// Types
import type { OnSortParam, ColumnDef, Row } from '@/components/shared/DataTable'
import type { TableQueries } from '@/@types/common'
import type {
    ApplicationStatus,
    JobApplicationItem as JobApplicationItemInternal,
    ApplicationFormData,
} from './types'
import { applicationStatusOptions as appStatusOptionsConst } from './types'
import { applicationFormSchema as editApplicationFormSchema } from './types'
import { encryptStorage } from '@/utils/secureLocalStorage'
import { config } from 'localforage'
import { getMenuRights } from '@/utils/getMenuRights'

dayjs.extend(isToday)

// --- TYPE DEFINITIONS & SCHEMAS ---
interface JobApplicationApiItem { id: number; job_department_id: string | null; name: string; email: string; mobile_no: string | null; city?: string | null; state?: string | null; country?: string | null; nationality?: string | null; work_experience: string | null; job_title: string | null; application_date: string | null; status: string; resume_url?: string | null; application_link?: string | null; note?: string | null; job_id?: string | null; avatar?: string | null; is_schedule: number;[key: string]: any; }
interface DepartmentItem { id: string | number; name: string; }
interface UserItem { id: string | number; name: string; }
type SelectOption = { value: any; label: string };

const applicationStatusColor: { [key in ApplicationStatus]?: string } = { New: 'bg-blue-500', 'In Review': 'bg-yellow-500', Shortlisted: 'bg-violet-500', Hired: 'bg-emerald-500', Rejected: 'bg-red-500' };

const filterFormSchema = z.object({ filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(), filterDepartment: z.array(z.object({ value: z.string(), label: z.string() })).optional() });
type FilterFormData = z.infer<typeof filterFormSchema>;
type EditApplicationFormData = ApplicationFormData;

const scheduleSchema = z.object({ event_title: z.string().min(3, "Title must be at least 3 characters."), event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."), date_time: z.date({ required_error: "Event date & time is required." }), remind_from: z.date().nullable().optional(), notes: z.string().optional() });
type ScheduleFormData = z.infer<typeof scheduleSchema>;
const taskValidationSchema = z.object({ task_title: z.string().min(3, 'Task title must be at least 3 characters.'), assign_to: z.array(z.string()).min(1, 'At least one assignee is required.'), priority: z.string().min(1, 'Please select a priority.'), due_date: z.date().nullable().optional(), description: z.string().optional() });
type TaskFormData = z.infer<typeof taskValidationSchema>;
const notificationSchema = z.object({ notification_title: z.string().min(3, "Title must be at least 3 characters long."), send_users: z.array(z.string()).min(1, "Please select at least one user."), message: z.string().min(10, "Message must be at least 10 characters long.") });
type NotificationFormData = z.infer<typeof notificationSchema>;
const activitySchema = z.object({ item: z.string().min(3, "Activity item is required and must be at least 3 characters."), notes: z.string().optional() });
type ActivityFormData = z.infer<typeof activitySchema>;
const exportReasonSchema = z.object({ reason: z.string().min(10, 'Reason for export is required (minimum 10 characters).').max(255, 'Reason cannot exceed 255 characters.') });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- HELPER CONSTANTS & FUNCTIONS ---
const taskPriorityOptions: SelectOption[] = [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }];
const eventTypeOptions: SelectOption[] = [{ value: 'Meeting', label: 'Meeting' }, { value: 'Demo', label: 'Product Demo' }, { value: 'IntroCall', label: 'Introductory Call' }, { value: 'FollowUpCall', label: 'Follow-up Call' }, { value: 'QBR', label: 'Quarterly Business Review (QBR)' }, { value: 'CheckIn', label: 'Customer Check-in' }, { value: 'LogEmail', label: 'Log an Email' }, { value: 'Milestone', label: 'Project Milestone' }, { value: 'Task', label: 'Task' }, { value: 'FollowUp', label: 'General Follow-up' }, { value: 'ProjectKickoff', label: 'Project Kick-off' }, { value: 'OnboardingSession', label: 'Onboarding Session' }, { value: 'Training', label: 'Training Session' }, { value: 'SupportCall', label: 'Support Call' }, { value: 'Reminder', label: 'Reminder' }, { value: 'Note', label: 'Add a Note' }, { value: 'FocusTime', label: 'Focus Time (Do Not Disturb)' }, { value: 'StrategySession', label: 'Strategy Session' }, { value: 'TeamMeeting', label: 'Team Meeting' }, { value: 'PerformanceReview', label: 'Performance Review' }, { value: 'Lunch', label: 'Lunch / Break' }, { value: 'Appointment', label: 'Personal Appointment' }, { value: 'Other', label: 'Other' }, { value: 'ProjectKickoff', label: 'Project Kick-off' }, { value: 'InternalSync', label: 'Internal Team Sync' }, { value: 'ClientUpdateMeeting', label: 'Client Update Meeting' }, { value: 'RequirementsGathering', label: 'Requirements Gathering' }, { value: 'UAT', label: 'User Acceptance Testing (UAT)' }, { value: 'GoLive', label: 'Go-Live / Deployment Date' }, { value: 'ProjectSignOff', label: 'Project Sign-off' }, { value: 'PrepareReport', label: 'Prepare Report' }, { value: 'PresentFindings', label: 'Present Findings' }, { value: 'TroubleshootingCall', label: 'Troubleshooting Call' }, { value: 'BugReplication', label: 'Bug Replication Session' }, { value: 'IssueEscalation', label: 'Escalate Issue' }, { value: 'ProvideUpdate', label: 'Provide Update on Ticket' }, { value: 'FeatureRequest', label: 'Log Feature Request' }, { value: 'IntegrationSupport', label: 'Integration Support Call' }, { value: 'DataMigration', label: 'Data Migration/Import Task' }, { value: 'ColdCall', label: 'Cold Call' }, { value: 'DiscoveryCall', label: 'Discovery Call' }, { value: 'QualificationCall', label: 'Qualification Call' }, { value: 'SendFollowUpEmail', label: 'Send Follow-up Email' }, { value: 'LinkedInMessage', label: 'Log LinkedIn Message' }, { value: 'ProposalReview', label: 'Proposal Review Meeting' }, { value: 'ContractSent', label: 'Contract Sent' }, { value: 'NegotiationCall', label: 'Negotiation Call' }, { value: 'TrialSetup', label: 'Product Trial Setup' }, { value: 'TrialCheckIn', label: 'Trial Check-in Call' }, { value: 'WelcomeCall', label: 'Welcome Call' }, { value: 'ImplementationSession', label: 'Implementation Session' }, { value: 'UserTraining', label: 'User Training Session' }, { value: 'AdminTraining', label: 'Admin Training Session' }, { value: 'MonthlyCheckIn', label: 'Monthly Check-in' }, { value: 'QBR', label: 'Quarterly Business Review (QBR)' }, { value: 'HealthCheck', label: 'Customer Health Check' }, { value: 'FeedbackSession', label: 'Feedback Session' }, { value: 'RenewalDiscussion', label: 'Renewal Discussion' }, { value: 'UpsellOpportunity', label: 'Upsell/Cross-sell Call' }, { value: 'CaseStudyInterview', label: 'Case Study Interview' }, { value: 'InvoiceDue', label: 'Invoice Due' }, { value: 'SendInvoice', label: 'Send Invoice' }, { value: 'PaymentReminder', label: 'Send Payment Reminder' }, { value: 'ChaseOverduePayment', label: 'Chase Overdue Payment' }, { value: 'ConfirmPayment', label: 'Confirm Payment Received' }, { value: 'ContractRenewalDue', label: 'Contract Renewal Due' }, { value: 'DiscussBilling', label: 'Discuss Billing/Invoice' }, { value: 'SendQuote', label: 'Send Quote/Estimate' },];

function exportToCsvApplication(filename: string, rows: JobApplicationItemInternal[]) {
    if (!rows || !rows.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return;
    }
    const CSV_HEADERS = ["ID", "Applicant Name", "Email", "Mobile", "Status", "Department", "Job Title", "Work Experience", "Application Date", "Resume URL", "Notes"];
    const preparedRows = rows.map(row => {
        const escapeCsvCell = (cellData: any) => `"${String(cellData || '').replace(/"/g, '""')}"`;
        return [row.id, escapeCsvCell(row.name), escapeCsvCell(row.email), escapeCsvCell(row.mobileNo), escapeCsvCell(row.status), escapeCsvCell(row.departmentName), escapeCsvCell(row.jobTitle), escapeCsvCell(row.workExperience), escapeCsvCell(row.applicationDate ? dayjs(row.applicationDate).format('YYYY-MM-DD HH:mm:ss') : 'N/A'), escapeCsvCell(row.resumeUrl), escapeCsvCell(row.notes)].join(',');
    });
    const csvContent = [CSV_HEADERS.join(','), ...preparedRows].join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>);
}

// --- HELPER COMPONENTS (DIALOGS, TOOLS, ETC.) ---
const ApplicationActivityDialog = ({ application, onClose, onSubmit, isLoading }: { application: JobApplicationItemInternal; onClose: () => void; onSubmit: (data: ActivityFormData) => void; isLoading: boolean; }) => { const { control, handleSubmit, formState: { errors, isValid } } = useForm<ActivityFormData>({ resolver: zodResolver(activitySchema), defaultValues: { item: `Follow-up with ${application.name} for ${application.jobTitle} position`, notes: '', }, mode: 'onChange', }); return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}> <h5 className="mb-4">Add Activity for {application.name}</h5> <Form onSubmit={handleSubmit(onSubmit)}> <FormItem label="Activity" invalid={!!errors.item} errorMessage={errors.item?.message}> <Controller name="item" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Follow-up with applicant" />} /> </FormItem> <FormItem label="Notes (Optional)" invalid={!!errors.notes} errorMessage={errors.notes?.message}> <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} placeholder="Add relevant details..." />} /> </FormItem> <div className="text-right mt-6"> <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button> <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading} icon={<TbCheck />}>Save Activity</Button> </div> </Form> </Dialog>); };
const ApplicationNotificationDialog = ({ application, onClose, userOptions, onSubmit, isLoading }: { application: JobApplicationItemInternal; onClose: () => void; userOptions: SelectOption[]; onSubmit: (data: NotificationFormData) => void; isLoading: boolean; }) => { const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(notificationSchema), defaultValues: { notification_title: `Regarding Job Application: ${application.name}`, send_users: [], message: `This is a notification regarding the job application from "${application.name}" for the role of "${application.jobTitle}".\n\nPlease review the application details.`, }, mode: "onChange", }); return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}> <h5 className="mb-4">Send Notification for {application.name}</h5> <Form onSubmit={handleSubmit(onSubmit)}> <FormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem> <FormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<Select isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter((o) => field.value?.includes(o.value))} onChange={(options) => field.onChange(options?.map((o) => o.value) || [])} />)} /></FormItem> <FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={6} />} /></FormItem> <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send</Button></div> </Form> </Dialog>); };
const ApplicationScheduleDialog: React.FC<{ application: JobApplicationItemInternal; onClose: () => void; onSubmit: (data: ScheduleFormData) => void; isLoading: boolean; }> = ({ application, onClose, onSubmit, isLoading }) => { const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema), defaultValues: { event_title: `Interview with ${application.name} for ${application.jobTitle}`, event_type: 'Meeting', date_time: null as any, remind_from: null, notes: `Regarding application ID ${application.id}.`, }, mode: 'onChange', }); return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}> <h5 className="mb-4">Add Schedule for {application.name}'s Application</h5> <Form onSubmit={handleSubmit(onSubmit)}> <FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<Select placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem><FormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem></div> <FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem> <FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem> <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div> </Form> </Dialog>); };
const ApplicationAssignTaskDialog = ({ application, onClose, userOptions, onSubmit, isLoading }: { application: JobApplicationItemInternal; onClose: () => void; userOptions: SelectOption[]; onSubmit: (data: TaskFormData) => void; isLoading: boolean; }) => { const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<TaskFormData>({ resolver: zodResolver(taskValidationSchema), mode: 'onChange', }); useEffect(() => { if (application) { reset({ task_title: `Follow up with applicant ${application.name}`, assign_to: [], priority: 'Medium', due_date: null, description: `Follow up with ${application.name} (${application.email}) for the application for the "${application.jobTitle}" position.`, }); } }, [application, reset]); return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}> <h5 className="mb-4">Assign Task for {application.name}'s Application</h5> <Form onSubmit={handleSubmit(onSubmit)}> <FormItem label="Task Title" invalid={!!errors.task_title} errorMessage={errors.task_title?.message}><Controller name="task_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></FormItem> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <FormItem label="Assign To" invalid={!!errors.assign_to} errorMessage={errors.assign_to?.message}><Controller name="assign_to" control={control} render={({ field }) => (<Select isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter(o => field.value?.includes(o.value))} onChange={(opts) => field.onChange(opts?.map(o => o.value) || [])} />)} /></FormItem> <FormItem label="Priority" invalid={!!errors.priority} errorMessage={errors.priority?.message}><Controller name="priority" control={control} render={({ field }) => (<Select placeholder="Select Priority" options={taskPriorityOptions} value={taskPriorityOptions.find(p => p.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></FormItem> </div> <FormItem label="Due Date (Optional)" invalid={!!errors.due_date} errorMessage={errors.due_date?.message}><Controller name="due_date" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />} /></FormItem> <FormItem label="Description" invalid={!!errors.description} errorMessage={errors.description?.message}><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem> <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Assign Task</Button></div> </Form> </Dialog>); };
const ActionColumn = ({ item, onView, onEdit, onDownloadResume, onConvertToEmployee, onAddNotification, onAddSchedule, onAssignToTask, onMarkAsActive, onSendEmail, onSendWhatsapp, }:
    {
        item: JobApplicationItemInternal;
        onView: () => void;
        onEdit: () => void;
        onDownloadResume: () => void;
        onConvertToEmployee: () => void;
        onAddNotification: () => void; onAddSchedule: () => void; onAssignToTask: () => void; onMarkAsActive: () => void; onSendEmail: () => void; onSendWhatsapp: () => void;
    }) => { const iconButtonClass = 'text-lg p-0.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none'; const hoverBgClass = 'hover:bg-gray-100 dark:hover:bg-gray-700'; return (<div className="flex items-center justify-end"> <Tooltip title="View Details"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400')} role="button" onClick={onView}><TbEye /></div></Tooltip>{ getMenuRights("job_application")?.is_edit && <Tooltip title="Edit Application"><div className={classNames(iconButtonClass, hoverBgClass, 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400')} role="button" onClick={onEdit}><TbPencil /></div></Tooltip> } <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}> <Dropdown.Item onClick={onAddNotification} className="flex items-center gap-2"><TbBell size={18} />{' '}<span className="text-xs">Add as Notification</span></Dropdown.Item> <Dropdown.Item onClick={onMarkAsActive} className="flex items-center gap-2"><TbTagStarred size={18} />{' '}<span className="text-xs">Mark as Active</span></Dropdown.Item> <Dropdown.Item onClick={onAddSchedule} className="flex items-center gap-2"><TbCalendarEvent size={18} />{' '}<span className="text-xs">Schedule Interview</span></Dropdown.Item> <Dropdown.Item onClick={onAssignToTask} className="flex items-center gap-2"><TbUser size={18} />{' '}<span className="text-xs">Assign to Task</span></Dropdown.Item> <Dropdown.Item onClick={onDownloadResume} className="flex items-center gap-2"><TbDownload size={18} />{' '}<span className="text-xs">Download Resume</span></Dropdown.Item> <Dropdown.Item onClick={onConvertToEmployee} className="flex items-center gap-2"><TbUserShare size={18} />{' '}<span className="text-xs">Convert to Employee</span></Dropdown.Item> <Dropdown.Item onClick={onSendEmail} className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs"> Send Email</span></Dropdown.Item> <Dropdown.Item onClick={onSendWhatsapp} className="flex items-center gap-2"><TbBrandWhatsapp size={18} />{' '}<span className="text-xs">Send on Whatsapp</span></Dropdown.Item> </Dropdown> </div>); };
const ApplicationSearch = React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void; }>(({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
ApplicationSearch.displayName = 'ApplicationSearch';
const ApplicationTableTools = ({ onSearchChange, onFilterOpen, onClearFilters, onExport, columns, filteredColumns, setFilteredColumns, activeFilterCount, isDataReady }: { onSearchChange: (query: string) => void; onFilterOpen: () => void; onClearFilters: () => void; onExport: () => void; columns: ColumnDef<JobApplicationItemInternal>[]; filteredColumns: ColumnDef<JobApplicationItemInternal>[]; setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<JobApplicationItemInternal>[]>>; activeFilterCount: number; isDataReady: boolean; }) => { const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId); const toggleColumn = (checked: boolean, colId: string) => { if (checked) { const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId); if (originalColumn) { setFilteredColumns(prev => { const newCols = [...prev, originalColumn]; newCols.sort((a, b) => { const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey)); const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey)); return indexA - indexB; }); return newCols; }); } } else { setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId)); } }; return (<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> <div className="flex-grow"> <ApplicationSearch onInputChange={onSearchChange} /> </div> <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"> <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end"> <div className="flex flex-col p-2"> <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div> {columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"> <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}> {col.header as string} </Checkbox> </div>); })} </div> </Dropdown> <Button title="Clear Filters" icon={<TbReload />} onClick={onClearFilters} disabled={!isDataReady} /> <Button icon={<TbFilter />} onClick={onFilterOpen} className="w-full sm:w-auto" disabled={!isDataReady}> Filter {activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>} </Button> <Button icon={<TbDownload />} onClick={onExport} className="w-full sm:w-auto" 
     menuName="job_application"

isExport={true}
disabled={!isDataReady}>Export</Button> </div> </div>); };
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: FilterFormData; onRemoveFilter: (key: keyof FilterFormData, value: string) => void; onClearAll: () => void; }) => { const { filterStatus, filterDepartment } = filterData; if (!filterStatus?.length && !filterDepartment?.length) return null; return (<div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4"> <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span> {filterStatus?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatus', item.value)} /></Tag>)} {filterDepartment?.map(item => <Tag key={`dept-${item.value}`} prefix>Dept: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterDepartment', item.value)} /></Tag>)} <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button> </div>); };
const ApplicationSelected = ({ selectedApplications, onDeleteSelected, isDeleting, }: { selectedApplications: JobApplicationItemInternal[]; onDeleteSelected: () => void; isDeleting: boolean; }) => { const [open, setOpen] = useState(false); if (selectedApplications.length === 0) return null; return (<> <StickyFooter stickyClass="-mx-4 sm:-mx-8 border-t px-8" className="py-4"> <div className="flex items-center justify-between"> <span className="flex items-center gap-2"> <TbChecks className="text-xl text-primary-500" /> <span className="font-semibold"> {selectedApplications.length} selected </span> </span> <Button size="sm" variant="plain" className="text-red-500" onClick={() => setOpen(true)} loading={isDeleting}> Delete </Button> </div> </StickyFooter> <ConfirmDialog type="danger" title="Delete Selected" isOpen={open} onClose={() => setOpen(false)} onConfirm={() => { onDeleteSelected(); setOpen(false); }} loading={isDeleting}> <p> Are you sure you want to delete the selected{' '} {selectedApplications.length} application(s)? </p> </ConfirmDialog> </>); };
const ApplicationDetailDialog = ({ isOpen, onClose, application, }: { isOpen: boolean; onClose: (e?: MouseEvent) => void; application: JobApplicationItemInternal | null; }) => { if (!application) return null; const detailItemClass = 'py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0'; const labelClass = 'text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5'; const valueClass = 'text-sm text-gray-800 dark:text-gray-200'; return (<Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} title={`Application Details: ${application.name}`} width={600} > <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-2"> <div className={detailItemClass}><p className={labelClass}>Applicant Name:</p><p className={valueClass}>{application.name}</p></div> <div className={detailItemClass}><p className={labelClass}>Email:</p><p className={valueClass}>{application.email}</p></div> <div className={detailItemClass}><p className={labelClass}>Mobile No:</p><p className={valueClass}>{application.mobileNo || 'N/A'}</p></div> <div className={detailItemClass}><p className={labelClass}>Status:</p><Tag className={`${applicationStatusColor[application.status]} text-white capitalize px-2 py-1 text-xs`}>{application.status.replace(/_/g, ' ')}</Tag></div> <div className={detailItemClass}><p className={labelClass}>Department:</p><p className={valueClass}>{application.departmentName || 'N/A'}</p></div> <div className={detailItemClass}><p className={labelClass}>Job Title:</p><p className={valueClass}>{application.jobTitle || 'N/A'}</p></div> <div className={detailItemClass}><p className={labelClass}>Work Experience:</p><p className={valueClass}>{application.workExperience || 'N/A'}</p></div> <div className={detailItemClass}><p className={labelClass}>Application Date:</p><p className={valueClass}>{application.applicationDate ? dayjs(application.applicationDate).format(' D MMM YYYY, h:mm A') : 'N/A'}</p></div> {application.resumeUrl && (<div className={detailItemClass}><p className={labelClass}>Resume URL:</p><a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{application.resumeUrl}</a></div>)} <div className={detailItemClass}><p className={labelClass}>Notes:</p><p className={valueClass} style={{ whiteSpace: 'pre-wrap' }}>{application.notes || 'N/A'}</p></div> </div> <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div> </Dialog>); };

// --- MAIN COMPONENT ---
const JobApplicationListing = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const {
        jobApplicationsData = [],
        departmentsData = { data: [] },
        getAllUserData = [],
    } = useSelector(masterSelector, shallowEqual);

    const userOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((user: UserItem) => ({ value: String(user.id), label: `(${user.employee_id}) - ${user.name || 'N/A'}` })) : [], [getAllUserData]);

    const [initialLoading, setInitialLoading] = useState(true);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: 'desc', key: 'applicationDate' }, query: '' });
    const [selectedApplications, setSelectedApplications] = useState<JobApplicationItemInternal[]>([]);
    const [detailViewOpen, setDetailViewOpen] = useState(false);
    const [currentItemForDialog, setCurrentItemForDialog] = useState<JobApplicationItemInternal | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterStatus: [], filterDepartment: [] });
    const [userData, setUserData] = useState<any>(null);
    const [showOnlyScheduled, setShowOnlyScheduled] = useState(false);
    const [showOnlyToday, setShowOnlyToday] = useState(false);
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notificationItem, setNotificationItem] = useState<JobApplicationItemInternal | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleItem, setScheduleItem] = useState<JobApplicationItemInternal | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskTargetItem, setTaskTargetItem] = useState<JobApplicationItemInternal | null>(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [activityTargetItem, setActivityTargetItem] = useState<JobApplicationItemInternal | null>(null);

    const isDataReady = !initialLoading;
    const tableLoading = initialLoading || isSubmittingAction;

    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: '' }, mode: 'onChange' });

    useEffect(() => {
        const { useEncryptApplicationStorage } = config;
        try { setUserData(encryptStorage.getItem("UserData", !useEncryptApplicationStorage)); }
        catch (error) { console.error("Error getting UserData:", error); }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setInitialLoading(true);
            try {
                await Promise.all([
                    dispatch(getJobApplicationsAction()),
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

    const transformedJobApplications = useMemo(() => {
        const apiData: JobApplicationApiItem[] = Array.isArray(jobApplicationsData?.data) ? jobApplicationsData.data : [];
        const depts: DepartmentItem[] = Array.isArray(departmentsData?.data) ? departmentsData.data : [];
        const departmentMap = new Map(depts.map((dept) => [String(dept.id), dept.name]));
        return apiData.map(
            (apiItem): JobApplicationItemInternal => ({
                id: String(apiItem.id),
                status: (apiItem.status || 'New') as ApplicationStatus,
                name: apiItem.name,
                email: apiItem.email,
                mobileNo: apiItem.mobile_no || '',
                departmentId: apiItem.job_department_id || undefined,
                departmentName: apiItem.job_department_id ? departmentMap.get(String(apiItem.job_department_id)) || 'Unknown Dept.' : 'N/A',
                jobTitle: apiItem.job_title || '',
                workExperience: apiItem.work_experience || '',
                applicationDate: apiItem.application_date ? new Date(apiItem.application_date) : new Date(),
                resumeUrl: apiItem.resume || '',
                notes: apiItem.note || '',
                isSchedule: apiItem.is_schedule || 0,
            })
        );
    }, [jobApplicationsData?.data, departmentsData?.data]);

    const { pageData, total, allFilteredData } = useMemo(() => {
        let processedDataResult = cloneDeep(transformedJobApplications);

        if (showOnlyScheduled) { processedDataResult = processedDataResult.filter(app => app.isSchedule === 1); }
        else if (showOnlyToday) { processedDataResult = processedDataResult.filter(app => dayjs(app.applicationDate).isToday()); }

        if (filterCriteria.filterStatus?.length) { const selectedStatuses = new Set(filterCriteria.filterStatus.map(opt => opt.value)); processedDataResult = processedDataResult.filter(app => selectedStatuses.has(app.status)); }
        if (filterCriteria.filterDepartment?.length) { const selectedDeptNames = new Set(filterCriteria.filterDepartment.map(opt => opt.value.toLowerCase())); processedDataResult = processedDataResult.filter(app => app.departmentName && selectedDeptNames.has(app.departmentName.toLowerCase())); }
        if (tableData.query) { const query = tableData.query.toLowerCase().trim(); processedDataResult = processedDataResult.filter(a => Object.values(a).some(value => String(value).toLowerCase().includes(query))); }

        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) {
            processedDataResult.sort((a, b) => {
                const aVal = a[key as keyof JobApplicationItemInternal] as any, bVal = b[key as keyof JobApplicationItemInternal] as any;
                if (key === 'applicationDate') { const d_a = aVal?.getTime() || 0, d_b = bVal?.getTime() || 0; return order === 'asc' ? d_a - d_b : d_b - d_a; }
                if (typeof aVal === 'string' && typeof bVal === 'string') { return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal); }
                if (typeof aVal === 'number' && typeof bVal === 'number') { return order === 'asc' ? aVal - bVal : bVal - aVal; }
                return 0;
            });
        }

        const currentTotal = processedDataResult.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        const dataForPage = processedDataResult.slice(startIndex, startIndex + pageSize);

        return { pageData: dataForPage, total: currentTotal, allFilteredData: processedDataResult };
    }, [transformedJobApplications, tableData, filterCriteria, showOnlyScheduled, showOnlyToday]);

    const activeFilterCount = useMemo(() => (filterCriteria.filterStatus?.length ? 1 : 0) + (filterCriteria.filterDepartment?.length ? 1 : 0), [filterCriteria]);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedApplications([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: JobApplicationItemInternal) => setSelectedApplications((prev) => checked ? (prev.some((a) => a.id === row.id) ? prev : [...prev, row]) : prev.filter((a) => a.id !== row.id)), []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<JobApplicationItemInternal>[]) => { const originals = currentRows.map((r) => r.original); if (checked) { setSelectedApplications((prev) => { const oldIds = new Set(prev.map((i) => i.id)); return [...prev, ...originals.filter((o) => !oldIds.has(o.id))]; }); } else { const currentIds = new Set(originals.map((o) => o.id)); setSelectedApplications((prev) => prev.filter((i) => !currentIds.has(i.id))); } }, []);

    const handleViewDetails = useCallback((item: JobApplicationItemInternal) => { setCurrentItemForDialog(item); setDetailViewOpen(true); }, []);
    const handleConvertToEmployee = useCallback((item: JobApplicationItemInternal) => navigate('/hr-employees/employees/add', { state: item }), [navigate]);
    const handleDownloadResume = useCallback((item: JobApplicationItemInternal) => { if (item.resumeUrl) window.open(item.resumeUrl, '_blank'); else toast.push(<Notification type="info" title="No Resume" children="A resume is not available for this applicant." />); }, []);
    const handleSendEmail = useCallback((app: JobApplicationItemInternal) => { const subject = `Regarding your application for ${app.jobTitle}`; const body = `Dear ${app.name},...`; window.open(`mailto:${app.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`); }, []);
    const handleSendWhatsapp = useCallback((app: JobApplicationItemInternal) => { const phone = app.mobileNo?.replace(/\D/g, ''); if (!phone) { toast.push(<Notification type="warning" title="No Mobile Number" />); return; } const message = `Hi ${app.name}, ...`; window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank'); }, []);

    const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria({ filterStatus: data.filterStatus || [], filterDepartment: data.filterDepartment || [] }); handleSetTableData({ pageIndex: 1 }); setShowOnlyScheduled(false); setShowOnlyToday(false); setIsFilterDrawerOpen(false); }, [handleSetTableData]);
    const onClearFilters = useCallback(() => { const defaults = { filterStatus: [], filterDepartment: [] }; filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1, query: '' }); setShowOnlyScheduled(false); setShowOnlyToday(false); }, [filterFormMethods, handleSetTableData]);
    const handleRemoveFilter = (key: keyof FilterFormData, valueToRemove: string) => { setFilterCriteria(prev => { const newCriteria = { ...prev }; const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined; if (currentFilterArray) { (newCriteria as any)[key] = currentFilterArray.filter(item => item.value !== valueToRemove); } return newCriteria; }); handleSetTableData({ pageIndex: 1 }); };
    const handleCardClick = useCallback((status?: ApplicationStatus) => { onClearFilters(); if (status) { const statusOption = appStatusOptionsConst.find(s => s.value === status); if (statusOption) { setFilterCriteria({ ...filterCriteria, filterStatus: [statusOption] }); } } }, [onClearFilters, filterCriteria]);
    const clearSpecialFilters = () => { const defaults = { filterStatus: [], filterDepartment: [] }; filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1, query: '' }); }
    const handleToggleScheduleView = useCallback(() => { clearSpecialFilters(); setShowOnlyToday(false); setShowOnlyScheduled(prev => !prev); }, []);
    const handleTodayClick = useCallback(() => { clearSpecialFilters(); setShowOnlyScheduled(false); setShowOnlyToday(true); }, []);

    const openNotificationModal = useCallback((item: JobApplicationItemInternal) => { setNotificationItem(item); setIsNotificationModalOpen(true); }, []);
    const closeNotificationModal = useCallback(() => { setNotificationItem(null); setIsNotificationModalOpen(false); }, []);
    const openScheduleModal = useCallback((item: JobApplicationItemInternal) => { setScheduleItem(item); setIsScheduleModalOpen(true); }, []);
    const closeScheduleModal = useCallback(() => { setScheduleItem(null); setIsScheduleModalOpen(false); }, []);
    const openAssignToTaskModal = useCallback((item: JobApplicationItemInternal) => { setTaskTargetItem(item); setIsTaskModalOpen(true); }, []);
    const closeAssignToTaskModal = useCallback(() => { setTaskTargetItem(null); setIsTaskModalOpen(false); }, []);
    const openActivityModal = useCallback((item: JobApplicationItemInternal) => { setActivityTargetItem(item); setIsActivityModalOpen(true); }, []);
    const closeActivityModal = useCallback(() => { setActivityTargetItem(null); setIsActivityModalOpen(false); }, []);

    const handleConfirmActivity = async (data: ActivityFormData) => { if (!activityTargetItem || !userData?.id) { toast.push(<Notification type="danger" title="Error" children="Invalid application or user not found." />); return; } setIsSubmittingAction(true); const payload = { item: data.item, notes: data.notes || '', module_id: activityTargetItem.id, module_name: 'JobApplication', user_id: userData.id, }; try { await dispatch(addAllActionAction(payload)).unwrap(); toast.push(<Notification type="success" title="Activity Added" />); closeActivityModal(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Add Activity" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsSubmittingAction(false); } };
    const handleConfirmNotification = async (formData: NotificationFormData) => { if (!notificationItem) return; setIsSubmittingAction(true); const payload = { ...formData, module_id: String(notificationItem.id), module_name: "JobApplication" }; try { await dispatch(addNotificationAction(payload)).unwrap(); toast.push(<Notification type="success" title="Notification Sent!" />); closeNotificationModal(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Send" children={error?.message || "An error occurred."} />); } finally { setIsSubmittingAction(false); } };
    const handleConfirmSchedule = async (data: ScheduleFormData) => { if (!scheduleItem) return; setIsSubmittingAction(true); const payload = { module_id: Number(scheduleItem.id), module_name: 'JobApplication', event_title: data.event_title, event_type: data.event_type, date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'), ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }), notes: data.notes || '', }; try { await dispatch(addScheduleAction(payload)).unwrap(); toast.push(<Notification type="success" title="Event Scheduled" />); closeScheduleModal(); } catch (error: any) { toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An error occurred.'} />); } finally { setIsSubmittingAction(false); } };
    const handleConfirmTask = async (data: TaskFormData) => { if (!taskTargetItem) return; setIsSubmittingAction(true); try { const payload = { ...data, due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined, module_id: String(taskTargetItem.id), module_name: 'JobApplication', }; await dispatch(addTaskAction(payload)).unwrap(); toast.push(<Notification type="success" title="Task Assigned!" />); closeAssignToTaskModal(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Assign Task" children={error?.message || 'An error occurred.'} />); } finally { setIsSubmittingAction(false); } };

    const handleOpenExportReasonModal = () => {
        if (!allFilteredData.length) { toast.push(<Notification title="No Data" type="info">There is no data to export.</Notification>); return; }
        exportReasonFormMethods.reset();
        setIsExportReasonModalOpen(true);
    };

    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
        setIsSubmittingExportReason(true);
        const fileName = `job-applications_export_${dayjs().format('YYYY-MM-DD')}.csv`;
        try {
            await dispatch(submitExportReasonAction({ reason: data.reason, module: "JobApplication", file_name: fileName })).unwrap();
            toast.push(<Notification title="Export Reason Submitted" type="success" />);
            exportToCsvApplication(fileName, allFilteredData);
            setIsExportReasonModalOpen(false);
        } catch (error: any) {
            toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>);
        } finally {
            setIsSubmittingExportReason(false);
        }
    };

    const columns: ColumnDef<JobApplicationItemInternal>[] = useMemo(() => [
        { header: 'Applicant', accessorKey: 'name', cell: (props) => (<div className="flex items-center"> <div className="ml-2"> <span className="font-semibold">{props.row.original.name}</span> <div className="text-xs text-gray-500">{props.row.original.email}</div> </div> </div>) },
        { header: 'Status', accessorKey: 'status', width: 120, cell: (props) => <Tag className={`${applicationStatusColor[props.row.original.status]} text-white capitalize px-2 py-1 text-xs`}>{props.row.original.status}</Tag> },
        { header: 'Mobile', accessorKey: 'mobileNo', width: 140, cell: (props) => props.row.original.mobileNo || '-' },
        { header: 'Department', accessorKey: 'departmentName', width: 160, cell: (props) => props.row.original.departmentName || '-' },
        { header: 'Job Title', accessorKey: 'jobTitle', width: 200, cell: (props) => props.row.original.jobTitle || 'N/A' },
        { header: 'Experience', accessorKey: 'workExperience', width: 150, cell: (props) => props.row.original.workExperience || 'N/A' },
        { header: 'Applied Date', accessorKey: 'applicationDate', width: 160, cell: (props) => <div className="text-xs">{props.row.original.applicationDate ? dayjs(props.row.original.applicationDate).format('DD MMM YYYY, h:mm A') : 'N/A'}</div> },
        { header: 'Action', id: 'action', width: 130, meta: { HeaderClass: 'text-center' }, cell: (props) => <ActionColumn item={props.row.original} onView={() => handleViewDetails(props.row.original)} onEdit={() => navigate('/hr-employees/job-applications/add', { state: props.row.original })} onDownloadResume={() => handleDownloadResume(props.row.original)} onConvertToEmployee={() => handleConvertToEmployee(props.row.original)} onAddNotification={() => openNotificationModal(props.row.original)} onAddSchedule={() => openScheduleModal(props.row.original)} onAssignToTask={() => openAssignToTaskModal(props.row.original)} onMarkAsActive={() => openActivityModal(props.row.original)} onSendEmail={() => handleSendEmail(props.row.original)} onSendWhatsapp={() => handleSendWhatsapp(props.row.original)} /> },
    ], [navigate, handleViewDetails, handleConvertToEmployee, handleDownloadResume, handleSendEmail, handleSendWhatsapp, openNotificationModal, openScheduleModal, openAssignToTaskModal, openActivityModal]);

    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<JobApplicationItemInternal>[]>(columns);
    useEffect(() => { setFilteredColumns(columns); }, [columns]);

    const departmentOptionsForFilter = useMemo(() => { const depts: DepartmentItem[] = Array.isArray(departmentsData?.data) ? departmentsData.data : []; return Array.from(new Set(depts.map(dept => dept.name))).filter(Boolean).map(name => ({ value: name, label: name })); }, [departmentsData?.data]);
    const cardClass = "rounded-md transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";

    const renderCardContent = (content: number | undefined) => {
        if (initialLoading) {
            return <Skeleton width={40} height={20} />;
        }
        return <h6 className="font-bold">{content ?? 0}</h6>;
    };

    return (
        <Container className="h-auto">
            <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                <div className="lg:flex items-center justify-between mb-4">
                    <h5 className="mb-4 lg:mb-0">Job Applications</h5>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Button icon={<TbCalendarTime />} className="w-full sm:w-auto" variant={showOnlyScheduled ? 'solid' : 'default'} onClick={handleToggleScheduleView} disabled={!isDataReady}> {showOnlyScheduled ? 'View All' : 'View Schedule'} </Button>
                        <Button icon={<TbUserCheck />} className="w-full sm:w-auto" onClick={() => handleCardClick('Shortlisted')} disabled={!isDataReady}>View Shortlisted</Button>
                        <Button icon={<TbBriefcase />} onClick={() => navigate('/hr-employees/job-post')} className="w-full sm:w-auto" disabled={!isDataReady}>Add New Job Post</Button>
                        <Button 
                        menuName="job_application"

isAdd={true}
                        variant="solid" icon={<TbPlus />} onClick={() => navigate('/hr-employees/job-applications/add')} className="w-full sm:w-auto" disabled={!isDataReady}>Add New Application</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 mb-4 gap-2">
                    <Tooltip title="Click to show all applications"><div onClick={onClearFilters} className={cardClass}><Card bodyClass="flex gap-2 p-2" className="rounded-md border-blue-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbMail size={24} /></div><div><div className="text-blue-500">{renderCardContent(jobApplicationsData?.counts?.total)}</div><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
                    <Tooltip title="Click to show 'New' applications"><div onClick={() => handleCardClick('New')} className={cardClass}><Card bodyClass="flex gap-2 p-2" className="rounded-md border-emerald-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbMailSpark size={24} /></div><div><div className="text-emerald-500">{renderCardContent(jobApplicationsData?.counts?.new)}</div><span className="font-semibold text-xs">New</span></div></Card></div></Tooltip>
                    <Tooltip title="Applications received today"><div onClick={handleTodayClick} className={cardClass}><Card bodyClass="flex gap-2 p-2" className={classNames('rounded-md border-pink-200')}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbMailUp size={24} /></div><div><div className="text-pink-500">{renderCardContent(jobApplicationsData?.counts?.today)}</div><span className="font-semibold text-xs">Today</span></div></Card></div></Tooltip>
                    <Tooltip title="Click to show 'In Review' applications"><div onClick={() => handleCardClick('In Review')} className={cardClass}><Card bodyClass="flex gap-2 p-2" className="rounded-md border-orange-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbMailSearch size={24} /></div><div><div className="text-orange-500">{renderCardContent(jobApplicationsData?.counts?.in_review)}</div><span className="font-semibold text-xs">In Review</span></div></Card></div></Tooltip>
                    <Tooltip title="Click to show 'Shortlisted' applications"><div onClick={() => handleCardClick('Shortlisted')} className={cardClass}><Card bodyClass="flex gap-2 p-2" className="rounded-md border-violet-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbMailCheck size={24} /></div><div><div className="text-violet-500">{renderCardContent(jobApplicationsData?.counts?.shortlisted)}</div><span className="font-semibold text-xs">Shortlisted</span></div></Card></div></Tooltip>
                    <Tooltip title="Click to show 'Hired' applications"><div onClick={() => handleCardClick('Hired')} className={cardClass}><Card bodyClass="flex gap-2 p-2" className="rounded-md border-green-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbMailHeart size={24} /></div><div><div className="text-green-500">{renderCardContent(jobApplicationsData?.counts?.hired)}</div><span className="font-semibold text-xs">Hired</span></div></Card></div></Tooltip>
                    <Tooltip title="Click to show 'Rejected' applications"><div onClick={() => handleCardClick('Rejected')} className={cardClass}><Card bodyClass="flex gap-2 p-2" className="rounded-md border-red-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbMailX size={24} /></div><div><div className="text-red-500">{renderCardContent(jobApplicationsData?.counts?.rejected)}</div><span className="font-semibold text-xs">Rejected</span></div></Card></div></Tooltip>
                </div>

                <div className="mb-4">
                    <ApplicationTableTools onSearchChange={handleSearchChange} onFilterOpen={() => setIsFilterDrawerOpen(true)} onClearFilters={onClearFilters} onExport={handleOpenExportReasonModal} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} isDataReady={isDataReady} />
                </div>

                <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />

                <div className="flex-grow overflow-auto">
                    <DataTable menuName="job_application" columns={filteredColumns} noData={pageData.length === 0} data={pageData} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
                </div>
            </AdaptiveCard>

            <ApplicationSelected selectedApplications={selectedApplications} onDeleteSelected={() => { }} isDeleting={false} />
            <ApplicationDetailDialog isOpen={detailViewOpen} onClose={() => setDetailViewOpen(false)} application={currentItemForDialog} />

            {isActivityModalOpen && activityTargetItem && (<ApplicationActivityDialog application={activityTargetItem} onClose={closeActivityModal} onSubmit={handleConfirmActivity} isLoading={isSubmittingAction} />)}
            {isNotificationModalOpen && notificationItem && (<ApplicationNotificationDialog application={notificationItem} onClose={closeNotificationModal} userOptions={userOptions} onSubmit={handleConfirmNotification} isLoading={isSubmittingAction} />)}
            {isScheduleModalOpen && scheduleItem && (<ApplicationScheduleDialog application={scheduleItem} onClose={closeScheduleModal} onSubmit={handleConfirmSchedule} isLoading={isSubmittingAction} />)}
            {isTaskModalOpen && taskTargetItem && (<ApplicationAssignTaskDialog application={taskTargetItem} onClose={closeAssignToTaskModal} userOptions={userOptions} onSubmit={handleConfirmTask} isLoading={isSubmittingAction} />)}

            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText="Submit & Export" cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
                <Form id="exportReasonForm" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 mt-2">
                    <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
                        <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => <Input textArea {...field} placeholder="Enter reason..." rows={3} />} />
                    </FormItem>
                </Form>
            </ConfirmDialog>

            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterAppForm" type="submit">Apply</Button></div>}>
                <Form id="filterAppForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
                    <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Select status..." options={appStatusOptionsConst} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
                    <FormItem label="Department"><Controller name="filterDepartment" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Select department..." options={departmentOptionsForFilter} value={field.value || []} onChange={val => field.onChange(val || [])} />} /></FormItem>
                </Form>
            </Drawer>
        </Container>
    );
};

export default JobApplicationListing;