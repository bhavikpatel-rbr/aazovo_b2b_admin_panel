// src/views/your-path/EmployeesListing.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import cloneDeep from "lodash/cloneDeep";
import React, { Ref, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
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
  Card,
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
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import {
  TbActivity,
  TbAlarm,
  TbBell,
  TbBrandWhatsapp,
  TbCalendarEvent,
  TbChecks,
  TbClipboardText,
  TbCloudUpload,
  TbDownload,
  TbEye,
  TbFileSearch,
  TbFileText,
  TbFileZip,
  TbFilter,
  TbKey,
  TbMail,
  TbPencil,
  TbPlus,
  TbReload,
  TbSearch,
  TbTagStarred,
  TbUser,
  TbUserBolt,
  TbUserCircle,
  TbUserExclamation,
  TbUsers,
  TbUserScreen,
  TbUserShare,
  TbUserSquareRounded
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { 
    addNotificationAction,
    addScheduleAction, // <-- IMPORT THE ACTION
    getDepartmentsAction, 
    getDesignationsAction, 
    getEmployeesListingAction, 
    getRolesAction, 
    getAllUsersAction 
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import dayjs from "dayjs";
import { BsThreeDotsVertical } from "react-icons/bs";
import { shallowEqual, useSelector } from "react-redux";


// --- Define Item Type ---
export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated";
export type EmployeeItem = {
  id: string;
  status: EmployeeStatus;
  name: string;
  email: string;
  mobile: string | null;
  department: string;
  designation: string;
  roles: string[];
  avatar?: string | null;
  createdAt: Date;
  role: string | null;
  joiningDate?: Date | null;
  bio?: string | null;
};

// --- Constants ---
const EMPLOYEE_STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];
const employeeStatusValues = EMPLOYEE_STATUS_OPTIONS.map((s) => s.value) as [
  EmployeeStatus,
  ...EmployeeStatus[]
];

export const employeeStatusColor: Record<EmployeeItem["status"], string> = {
  active: "bg-blue-500",
  inactive: "bg-emerald-500",
  on_leave: "bg-amber-500",
  terminated: "bg-red-500",
};

// --- Zod Schema for Add/Edit Employee Form ---
const employeeFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  email: z.string().email("Invalid email address.").min(1, "Email is required."),
  mobile: z.string().nullable().optional().refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), { message: "Invalid phone number format." }),
  department: z.string().min(1, "Department is required.").max(100),
  designation: z.string().min(1, "Designation is required.").max(100),
  status: z.enum(employeeStatusValues),
  roles: z.array(z.string()).min(1, "At least one role is required."),
  joiningDate: z.date().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
});
type EmployeeFormData = z.infer<typeof employeeFormSchema>;

// --- Zod Schema for Filter Form ---
const employeeFilterFormSchema = z.object({
  filterDepartments: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDesignations: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterRoles: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type EmployeeFilterFormData = z.infer<typeof employeeFilterFormSchema>;

// --- Zod Schema for Schedule Form ---
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// --- Constants ---
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
  { value: "Meeting", label: "Meeting" },
  { value: "Call", label: "Follow-up Call" },
  { value: "Deadline", label: "Project Deadline" },
  { value: "Reminder", label: "Reminder" },
];

// --- End Constants ---

// --- Modal Type Definitions ---
export type ModalType = 'email' | 'whatsapp' | 'notification' | 'task' | 'schedule' | 'active' | 'documents' | 'activityLog' | 'alert';
export interface ModalState { isOpen: boolean; type: ModalType | null; data: EmployeeItem | null; }
export type SelectOption = { value: any; label: string };

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
  rowData,
  onEdit,
  onDelete,
  onChangePassword,
  onView,
  onOpenModal,
}: {
  rowData: EmployeeItem;
  onEdit: () => void;
  onDelete: () => void;
  onChangePassword: () => void;
  onView: () => void;
  onOpenModal: (type: ModalType, data: EmployeeItem) => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
      <Tooltip title="View"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={onView}><TbEye /></div></Tooltip>
      <Tooltip title="Change Password"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`} role="button" onClick={onChangePassword}><TbKey /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item onClick={() => onOpenModal('email', rowData)} className="flex items-center gap-2"><TbMail size={18} /><span className="text-xs">Send Email</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('whatsapp', rowData)} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /><span className="text-xs">Send Whatsapp</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('notification', rowData)} className="flex items-center gap-2"><TbBell size={18} /><span className="text-xs">Add Notification</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('task', rowData)} className="flex items-center gap-2"><TbUser size={18} /><span className="text-xs">Assign Task</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('schedule', rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /><span className="text-xs">Add Schedule</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('active', rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /><span className="text-xs">Add Activity</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('documents', rowData)} className="flex items-center gap-2"><TbDownload size={18} /><span className="text-xs">Download Documents</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('activityLog', rowData)} className="flex items-center gap-2"><TbActivity size={18} /><span className="text-xs">View Activity Log</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('alert', rowData)} className="flex items-center gap-2"><TbAlarm size={18} /><span className="text-xs">View Alerts</span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};
const EmployeeTable = ({ columns, data, loading, pagingData, selectedEmployees, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: { columns: ColumnDef<EmployeeItem>[]; data: EmployeeItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedEmployees: EmployeeItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: EmployeeItem) => void; onAllRowSelect: (checked: boolean, rows: Row<EmployeeItem>[]) => void; }) => {
  return (<DataTable selectable columns={columns} data={data} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedEmployees.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} noData={!loading && data.length === 0} />);
};
type EmployeeSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const EmployeeSearch = React.forwardRef<HTMLInputElement, EmployeeSearchProps>(({ onInputChange }, ref) => { return (<DebouceInput ref={ref} placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />); });
EmployeeSearch.displayName = "EmployeeSearch";
const EmployeeSelected = ({ selectedEmployees, setSelectedEmployees, onDeleteSelected }: { selectedEmployees: EmployeeItem[]; setSelectedEmployees: React.Dispatch<React.SetStateAction<EmployeeItem[]>>; onDeleteSelected: () => void; }) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };
  if (selectedEmployees.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedEmployees.length}</span><span>Employee{selectedEmployees.length > 1 ? "s" : ""} selected</span></span></span>
          <div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick}>Delete</Button></div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedEmployees.length} Employee${selectedEmployees.length > 1 ? "s" : ""}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete}>
        <p>Are you sure you want to delete the selected employee{selectedEmployees.length > 1 ? "s" : ""}? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};
// ============================================================================
// --- MODALS SECTION ---
// ============================================================================
const dummyTimeline = [{ id: 1, icon: <TbMail />, title: "Onboarding Email Sent", desc: "Sent welcome kit and setup instructions.", time: "2023-10-25" }, { id: 2, icon: <TbCalendarEvent />, title: "Performance Review", desc: "Scheduled Q3 performance review.", time: "2023-09-15" }, { id: 3, icon: <TbPencil />, title: "Role Changed", desc: "Promoted to Senior Developer.", time: "2023-07-01" }];
const dummyDocs = [{ id: "doc1", name: "Offer_Letter.pdf", type: "pdf", size: "1.2 MB" }, { id: "doc2", name: "Employee_Handbook.pdf", type: "pdf", size: "3.5 MB" }, { id: "doc3", name: "ID_Documents.zip", type: "zip", size: "5.1 MB" }];

const SendEmailDialog: React.FC<{ employee: EmployeeItem; onClose: () => void }> = ({ employee, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { subject: "", message: "" } });
  const onSendEmail = (data: { subject: string; message: string }) => { setIsLoading(true); console.log("Sending email to", employee.email, "with data:", data); setTimeout(() => { toast.push(<Notification type="success" title="Email Sent Successfully" />); setIsLoading(false); onClose(); }, 1000); };
  return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Send Email to {employee.name}</h5><form onSubmit={handleSubmit(onSendEmail)}><FormItem label="Subject"><Controller name="subject" control={control} render={({ field }) => <Input {...field} />} /></FormItem><FormItem label="Message"><Controller name="message" control={control} render={({ field }) => (<RichTextEditor value={field.value} onChange={field.onChange} />)} /></FormItem><div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Send</Button></div></form></Dialog>);
};
const SendWhatsAppDialog: React.FC<{ employee: EmployeeItem; onClose: () => void }> = ({ employee, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { message: `Hi ${employee.name}, ` } });
  const onSendMessage = (data: { message: string }) => { setIsLoading(true); const phone = employee.mobile?.replace(/\D/g, ""); if (!phone) { toast.push(<Notification type="danger" title="Invalid Phone Number" />); setIsLoading(false); return; } const url = `https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`; window.open(url, "_blank"); toast.push(<Notification type="success" title="Redirecting to WhatsApp" />); setIsLoading(false); onClose(); };
  return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Send WhatsApp to {employee.name}</h5><form onSubmit={handleSubmit(onSendMessage)}><FormItem label="Message Template"><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem><div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading}>Open WhatsApp</Button></div></form></Dialog>);
};
const AddNotificationDialog: React.FC<{ employee: EmployeeItem; onClose: () => void; getAllUserDataOptions: SelectOption[] }> = ({ employee, onClose, getAllUserDataOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const notificationSchema = z.object({ notification_title: z.string().min(3, "Title must be at least 3 characters long."), send_users: z.array(z.number()).min(1, "Please select at least one user."), message: z.string().min(10, "Message must be at least 10 characters long.") });
  type NotificationFormData = z.infer<typeof notificationSchema>;
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(notificationSchema), defaultValues: { notification_title: `Notification regarding: ${employee.name}`, send_users: [], message: `This is a notification concerning employee ${employee.name}.` }, mode: 'onChange' });
  const onSend = async (formData: NotificationFormData) => { setIsLoading(true); const payload = { send_users: formData.send_users, notification_title: formData.notification_title, message: formData.message, module_id: String(employee.id), module_name: 'Employee', }; try { await dispatch(addNotificationAction(payload)).unwrap(); toast.push(<Notification type="success" title="Notification Sent Successfully!" />); onClose(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsLoading(false); } };
  return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Notify about: {employee.name}</h5><Form onSubmit={handleSubmit(onSend)}><FormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem><FormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={getAllUserDataOptions} value={getAllUserDataOptions.filter(o => field.value?.includes(o.value))} onChange={(options: any) => field.onChange(options?.map((o: any) => o.value) || [])} />)} /></FormItem><FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button></div></Form></Dialog>);
};
const AssignTaskDialog: React.FC<{ employee: EmployeeItem; onClose: () => void }> = ({ employee, onClose }) => {
  return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Assign Task to {employee.name}</h5><FormItem label="Task Title"><Input placeholder="e.g., Complete Q3 report" /></FormItem><FormItem label="Assign To"><UiSelect placeholder="Select a team member" options={dummyUsers} /></FormItem><FormItem label="Priority"><UiSelect placeholder="Select priority" options={priorityOptions} /></FormItem><div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" onClick={onClose}>Assign</Button></div></Dialog>);
};

// --- AddScheduleDialog Component ---
const AddScheduleDialog: React.FC<{ employee: EmployeeItem; onClose: () => void }> = ({ employee, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_title: `Meeting with ${employee.name}`,
      event_type: undefined,
      date_time: null as any,
      remind_from: null,
      notes: `Regarding employee ${employee.name} (${employee.designation}).`,
    },
    mode: 'onChange',
  });

  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = {
      module_id: Number(employee.id),
      module_name: 'Employee',
      event_title: data.event_title,
      event_type: data.event_type,
      date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'),
      ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }),
      notes: data.notes || '',
    };

    try {
      await dispatch(addScheduleAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for ${employee.name}.`} />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for {employee.name}</h5>
      <Form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}>
          <Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}>
            <Controller name="event_type" control={control} render={({ field }) => (
              <UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />
            )} />
          </FormItem>
          <FormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}>
            <Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} />
          </FormItem>
        </div>
        <FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}>
          <Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} />
        </FormItem>
        <FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}>
          <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} />
        </FormItem>
        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button>
        </div>
      </Form>
    </Dialog>
  );
};

const DownloadDocumentDialog: React.FC<{ employee: EmployeeItem; onClose: () => void }> = ({ employee, onClose }) => {
  const iconMap: Record<string, React.ReactElement> = { pdf: <TbFileText className="text-red-500" />, zip: <TbFileZip className="text-amber-500" /> };
  return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Documents for {employee.name}</h5><div className="flex flex-col gap-3 mt-4">{dummyDocs.map(doc => (<div key={doc.id} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"><div className="flex items-center gap-3">{React.cloneElement(iconMap[doc.type] || <TbClipboardText />, { size: 28 })}<div><p className="font-semibold text-sm">{doc.name}</p><p className="text-xs text-gray-400">{doc.size}</p></div></div><Tooltip title="Download"><Button shape="circle" size="sm" icon={<TbDownload />} /></Tooltip></div>))}</div><div className="text-right mt-6"> <Button onClick={onClose}>Close</Button> </div></Dialog>);
};
const ActivityLogDialog: React.FC<{ employee: EmployeeItem; onClose: () => void }> = ({ employee, onClose }) => {
  return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Activity Log for {employee.name}</h5><div className="mt-4">{dummyTimeline.map(item => (<div key={item.id} className="flex gap-4 relative"><div className="bg-gray-200 dark:bg-gray-600 w-10 h-10 rounded-full flex items-center justify-center">{React.cloneElement(item.icon, { size: 20 })}</div><div className="pb-8"><p className="font-semibold">{item.title}</p><p className="text-sm">{item.desc}</p><p className="text-xs text-gray-400 mt-1">{item.time}</p></div>{dummyTimeline[dummyTimeline.length - 1].id !== item.id && (<div className="absolute left-5 top-10 h-full w-px bg-gray-200 dark:bg-gray-600"></div>)}</div>))}</div><div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div></Dialog>);
};
const GenericActionDialog: React.FC<{ type: ModalType | null; employee: EmployeeItem; onClose: () => void; }> = ({ type, employee, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}` : "Confirm Action";
  const handleConfirm = () => { setIsLoading(true); console.log(`Performing action '${type}' for employee ${employee.name}`); setTimeout(() => { toast.push(<Notification type="success" title="Action Completed" />); setIsLoading(false); onClose(); }, 1000); };
  return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-2">{title}</h5><p>Are you sure you want to perform this action for <span className="font-semibold">{employee.name}</span>?</p><div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" onClick={handleConfirm} loading={isLoading}>Confirm</Button></div></Dialog>);
};
const EmployeeModals: React.FC<{ modalState: ModalState; onClose: () => void; getAllUserDataOptions: SelectOption[] }> = ({ modalState, onClose, getAllUserDataOptions }) => {
  const { type, data: employee, isOpen } = modalState;
  if (!isOpen || !employee) return null;
  switch (type) {
    case 'email': return <SendEmailDialog employee={employee} onClose={onClose} />;
    case 'whatsapp': return <SendWhatsAppDialog employee={employee} onClose={onClose} />;
    case 'notification': return <AddNotificationDialog employee={employee} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
    case 'schedule': return <AddScheduleDialog employee={employee} onClose={onClose} />;
    case 'task': return <AssignTaskDialog employee={employee} onClose={onClose} />;
    case 'documents': return <DownloadDocumentDialog employee={employee} onClose={onClose} />;
    case 'activityLog': return <ActivityLogDialog employee={employee} onClose={onClose} />;
    case 'alert':
    case 'active':
    default: return <GenericActionDialog type={type} employee={employee} onClose={onClose} />;
  }
};
const EmployeeDetailViewDialog = ({ isOpen, onClose, employee, }: { isOpen: boolean; onClose: () => void; employee: EmployeeItem | null; }) => {
  if (!employee) return null;
  return (<Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={600}><h5 className="mb-4">Employee Details: {employee.name}</h5><pre className="text-xs bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">{JSON.stringify(employee, null, 2)}</pre><div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div></Dialog>);
};
const ChangePasswordDialog = ({ isOpen, onClose, employee, }: { isOpen: boolean; onClose: () => void; employee: EmployeeItem | null; }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const handlePasswordChange = () => { if (!employee) return; if (newPassword !== confirmPassword || newPassword.length < 8) { toast.push(<Notification title="Password Error" type="danger">Passwords do not match or are too short.</Notification>); return; } setIsChanging(true); console.log(`Changing password for ${employee.email} to ${newPassword}`); setTimeout(() => { toast.push(<Notification title="Password Changed" type="success">{`Password for ${employee.name} updated.`}</Notification>); setIsChanging(false); onClose(); setNewPassword(""); setConfirmPassword(""); }, 1000); };
  React.useEffect(() => { if (!isOpen) { setNewPassword(""); setConfirmPassword(""); } }, [isOpen]);
  if (!employee) return null;
  return (<Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={400}><h5 className="mb-4">Change Password for {employee.name}</h5><div className="mb-4"><label className="block text-sm font-medium mb-1">New Password</label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div><div className="mb-4"><label className="block text-sm font-medium mb-1">Confirm New Password</label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div><div className="text-right mt-6"><Button size="sm" className="mr-2" onClick={onClose} disabled={isChanging}>Cancel</Button><Button size="sm" variant="solid" onClick={handlePasswordChange} loading={isChanging}>Change Password</Button></div></Dialog>);
};
const EmployeeTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow"><EmployeeSearch onInputChange={onSearchChange} /></div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"><Tooltip title="Clear Filters"><Button icon={<TbReload />} onClick={() => onClearFilters()} /></Tooltip><Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button><Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button></div>
  </div>
);
const CSV_HEADERS_EMPLOYEE = ["ID", "Name", "Email", "Mobile", "Department", "Designation", "Roles", "Status", "Joining Date", "Created At"];
type EmployeeExportItem = Omit<EmployeeItem, "roles" | "createdAt" | "joiningDate"> & { rolesCsv: string; createdAtCsv: string; joiningDateCsv?: string };
function exportToCsvEmployees(filename: string, rows: EmployeeItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const transformedRows: EmployeeExportItem[] = rows.map((row) => ({ ...row, rolesCsv: row.roles.join(", "), joiningDateCsv: row.joiningDate ? new Date(row.joiningDate).toLocaleDateString() : "N/A", createdAtCsv: new Date(row.createdAt).toLocaleDateString() }));
  const csvKeysEmployeeExport: (keyof EmployeeExportItem)[] = ["id", "name", "email", "mobile", "department", "designation", "rolesCsv", "status", "joiningDateCsv", "createdAtCsv"];
  const separator = ",";
  const csvContent = CSV_HEADERS_EMPLOYEE.join(separator) + "\n" + transformedRows.map((row) => { return csvKeysEmployeeExport.map((k) => { let cell = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator); }).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

// --- Main EmployeesListing Component ---
const EmployeesListing = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [employeescount, setEmployeescount] = useState({});
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<"idle" | "loading">("idle");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EmployeeItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<EmployeeFilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeItem[]>([]);
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentItemForDialog, setCurrentItemForDialog] = useState<EmployeeItem | null>(null);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
  const dispatch = useAppDispatch();
  const filterFormMethods = useForm<EmployeeFilterFormData>({ resolver: zodResolver(employeeFilterFormSchema), defaultValues: filterCriteria });
  const { EmployeesList: Employees, Roles = [], departmentsData = [], designationsData = [], getAllUserData = [] } = useSelector(masterSelector, shallowEqual);
  const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((b: any) => ({ value: b.id, label: b.name })) : [], [getAllUserData]);

  useEffect(() => { if (Employees && Employees?.data?.data?.length > 0) { setEmployees(Employees?.data?.data); setEmployeescount(Employees?.counts) } }, [Employees]);
  useEffect(() => { dispatch(getEmployeesListingAction()); dispatch(getRolesAction()); dispatch(getDepartmentsAction()); dispatch(getDesignationsAction()); dispatch(getAllUsersAction()); }, [dispatch])

  const handleOpenModal = (type: ModalType, employee: EmployeeItem) => { setModalState({ isOpen: true, type, data: employee }); };
  const handleCloseModal = () => { setModalState({ isOpen: false, type: null, data: null }); };
  const openEditPage = (employee: EmployeeItem) => { navigate(`/hr-employees/employees/edit/${employee.id}`); };
  const handleDeleteClick = (employee: EmployeeItem) => { setItemToDelete(employee); setSingleDeleteConfirmOpen(true); };
  const onConfirmSingleDelete = async () => { if (!itemToDelete) return; setIsDeleting(true); setMasterLoadingStatus("loading"); setSingleDeleteConfirmOpen(false); await new Promise((resolve) => setTimeout(resolve, 500)); setEmployees((current) => current.filter((e) => e.id !== itemToDelete.id)); setSelectedEmployees((prev) => prev.filter((e) => e.id !== itemToDelete.id)); toast.push(<Notification title="Employee Deleted" type="success">{`Employee '${itemToDelete.name}' deleted.`}</Notification>); setIsDeleting(false); setMasterLoadingStatus("idle"); setItemToDelete(null); };
  const handleDeleteSelected = async () => { if (selectedEmployees.length === 0) { toast.push(<Notification title="No Selection" type="info">Please select employees.</Notification>); return; } setIsDeleting(true); setMasterLoadingStatus("loading"); await new Promise((resolve) => setTimeout(resolve, 1000)); const selectedIds = new Set(selectedEmployees.map((e) => e.id)); setEmployees((current) => current.filter((e) => !selectedIds.has(e.id))); toast.push(<Notification title="Employees Deleted" type="success">{`${selectedIds.size} employee(s) deleted.`}</Notification>); setSelectedEmployees([]); setIsDeleting(false); setMasterLoadingStatus("idle"); };
  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: EmployeeFilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); };
  const onClearFilters = () => { const defaultFilters = { filterDepartments: [], filterDesignations: [], filterStatuses: [], filterRoles: [] }; filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); setTableData((prev) => ({ ...prev, pageIndex: 1 })); };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    
    let processedData = cloneDeep(employees);
    if (filterCriteria.filterDepartments?.length) { const v = filterCriteria.filterDepartments.map((o) => o.value.toLowerCase()); processedData = processedData.filter((e: any) => v.includes(e.department?.name?.toLowerCase())); }
    if (filterCriteria.filterDesignations?.length) { const v = filterCriteria.filterDesignations.map((o) => o.value.toLowerCase()); processedData = processedData.filter((e: any) => v.includes(e.designation?.toLowerCase())); }
    if (filterCriteria.filterStatuses?.length) { const v = filterCriteria.filterStatuses.map((o) => o.value); processedData = processedData.filter((e) => v.includes(e.status)); }
    if (filterCriteria.filterRoles?.length) { const v = filterCriteria.filterRoles.map((o) => o.value?.toLowerCase()); processedData = processedData.filter((e: any) => e.roles.some((role: any) => v.includes(role?.name?.toLowerCase()))); }
    if (tableData.query) { const query = tableData.query.toLowerCase(); processedData = processedData.filter((e: any) => e.id.toLowerCase().includes(query) || e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query) || (e.mobile?.toLowerCase().includes(query) ?? false) || e.department.toLowerCase().includes(query) || e.designation.toLowerCase().includes(query) || e.roles.some((role: any) => role.toLowerCase().includes(query)) || e.status.toLowerCase().includes(query)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a: any, b: any) => {
        let aVal = a[key as keyof EmployeeItem] as any;
        let bVal = b[key as keyof EmployeeItem] as any;
        if (key === "createdAt" || key === "joiningDate") { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0; }
        else if (key === "roles") { aVal = a.roles.join(", "); bVal = b.roles.join(", "); }
        if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc" ? String(aVal ?? "").localeCompare(String(bVal ?? "")) : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport, };
  }, [employees, tableData, filterCriteria]);

  const handleExportData = () => { const success = exportToCsvEmployees("employees_export.csv", allFilteredAndSortedData); if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>); };
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedEmployees([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: EmployeeItem) => { setSelectedEmployees((prev) => checked ? prev.some((e) => e.id === row.id) ? prev : [...prev, row] : prev.filter((e) => e.id !== row.id)); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<EmployeeItem>[]) => { const originals = currentRows.map((r) => r.original); if (checked) setSelectedEmployees((prev) => { const oldIds = new Set(prev.map((i) => i.id)); return [...prev, ...originals.filter((o) => !oldIds.has(o.id))]; }); else { const currentIds = new Set(originals.map((o) => o.id)); setSelectedEmployees((prev) => prev.filter((i) => !currentIds.has(i.id))); } }, []);
  const handleViewDetails = useCallback((employee: EmployeeItem) => { navigate(`/hr-employees/employees/view/${employee.id}`); }, [navigate]);
  const handleCloseDetailView = useCallback(() => { setDetailViewOpen(false); setCurrentItemForDialog(null); }, []);
  const handleChangePassword = useCallback((employee: EmployeeItem) => { setCurrentItemForDialog(employee); setChangePwdOpen(true); }, []);
  const handleCloseChangePwd = useCallback(() => { setChangePwdOpen(false); setCurrentItemForDialog(null); }, []);
  const columns: ColumnDef<EmployeeItem>[] = useMemo(() => [
    { header: "Status", accessorKey: "status", cell: (props) => { const { status } = props.row.original || {}; const displayStatus = status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toLowerCase()); return (<Tag className={`${employeeStatusColor[displayStatus as keyof typeof employeeStatusColor]} text-white capitalize`}>{displayStatus}</Tag>); }, },
    { header: "Name", accessorKey: "name", cell: (props) => { const { name, email, mobile, avatar } = props.row.original || {}; return (<div className="flex items-center"><Avatar size={28} shape="circle" src={avatar} icon={<TbUserCircle />}>{!avatar ? name.charAt(0).toUpperCase() : ""}</Avatar><div className="ml-2 rtl:mr-2"><span className="font-semibold">{name}</span><div className="text-xs text-gray-500">{email}</div><div className="text-xs text-gray-500">{mobile}</div></div></div>); }, },
    { header: "Designation", accessorKey: "designation", size: 200, cell: (props: any) => { const data = props.row.original || {}; return (<div className="flex items-center"><div className="ml-2 rtl:mr-2"><span className="font-semibold">{data?.designation_id ?? ""}</span></div></div>); }, },
    { header: "Department", accessorKey: "department", size: 200, cell: (props: any) => { const { department } = props.row.original || {}; return (<div className="flex items-center"><div className="ml-2 rtl:mr-2"><span className="font-semibold">{department?.name ?? ""}</span></div></div>); }, },
    { header: "Roles", accessorKey: "roles", cell: (props: any) => { const { roles } = props.row.original || {}; return (<div className="flex flex-wrap gap-1 text-xs">{props?.row?.original?.roles?.map((role: any) => (<Tag key={role} className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 text-[10px]">{role?.name || ""}</Tag>))}</div>) }, },
    { header: "Joined At", accessorKey: "joiningDate", size: 200, cell: (props: any) => props?.row?.original?.date_of_joining ? <span className="text-xs"> {dayjs(props?.row?.original?.date_of_joining).format("D MMM YYYY, h:mm A")}</span> : '-' },
    { header: "Action", id: "action", size: 120, meta: { HeaderClass: "text-center" }, cell: (props) => (<ActionColumn rowData={props.row.original} onView={() => handleViewDetails(props.row.original)} onEdit={() => openEditPage(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onChangePassword={() => handleChangePassword(props.row.original)} onOpenModal={handleOpenModal} />) },
  ], [handleViewDetails, handleChangePassword, openEditPage, handleDeleteClick, handleOpenModal]);

  const roleOptions = useMemo(() => Array.isArray(Roles) ? Roles.map((r: any) => ({ value: String(r.id), label: r.display_name })) : [], [Roles]);
  const departmentOptions = useMemo(() => Array.isArray(departmentsData?.data) ? departmentsData?.data.map((d: any) => ({ value: String(d.id), label: d.name })) : [], [departmentsData?.data]);
  const designationOptions = useMemo(() => Array.isArray(designationsData?.data) ? designationsData?.data.map((d: any) => ({ value: String(d.id), label: d.name })) : [], [designationsData?.data]);
  const statusOptionsForFilter = useMemo(() => EMPLOYEE_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })), []);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4"><h5 className="mb-4 lg:mb-0">Employees Listing</h5><Button variant="solid" icon={<TbPlus />} onClick={() => navigate('/hr-employees/employees/add')}>Add New</Button></div>
          <div className="grid grid-cols-6 mb-4 gap-2">
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbUsers size={24} /></div><div><h6 className="text-blue-500">{employeescount?.total || 0}</h6><span className="font-semibold text-xs">Total</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbUserSquareRounded size={24} /></div><div><h6 className="text-violet-500">{employeescount?.this_month || 0}</h6><span className="font-semibold text-xs">This Month</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbUserBolt size={24} /></div><div><h6 className="text-pink-500">{employeescount?.avg_present_percent || 0}%</h6><span className="font-semibold text-xs">Avg. Present</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbUserExclamation size={24} /></div><div><h6 className="text-orange-500">{employeescount?.late_arrivals || 0}</h6><span className="font-semibold text-xs">Late Arrivals</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300" ><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUserScreen size={24} /></div><div><h6 className="text-green-500">{employeescount?.training_rate || 0}</h6><span className="font-semibold text-xs">Training Rate</span></div></Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbUserShare size={24} /></div><div><h6 className="text-red-500">{employeescount?.offboarding || 0}</h6><span className="font-semibold text-xs">Offboarding</span></div></Card>
          </div>
          <div className="mb-4"><EmployeeTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} /></div>
          <div className="flex-grow overflow-auto"><EmployeeTable columns={columns} data={pageData} loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedEmployees={selectedEmployees} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /></div>
        </AdaptiveCard>
      </Container>
      <EmployeeSelected selectedEmployees={selectedEmployees} setSelectedEmployees={setSelectedEmployees} onDeleteSelected={handleDeleteSelected} />
      <EmployeeDetailViewDialog isOpen={detailViewOpen} onClose={handleCloseDetailView} employee={currentItemForDialog} />
      <ChangePasswordDialog isOpen={changePwdOpen} onClose={handleCloseChangePwd} employee={currentItemForDialog} />
      <EmployeeModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={getAllUserDataOptions} />
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterEmployeeForm" type="submit">Apply</Button></div>}>
        <Form id="filterEmployeeForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Department"><Controller name="filterDepartments" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Department" options={departmentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Designation"><Controller name="filterDesignations" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Designation" options={designationOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Status" options={statusOptionsForFilter} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Role"><Controller name="filterRoles" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Role" options={roleOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Employee" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting}>
        <p>Are you sure you want to delete employee "<strong>{itemToDelete?.name}</strong>"?</p>
      </ConfirmDialog>
    </>
  );
};

export default EmployeesListing;