import { zodResolver } from "@hookform/resolvers/zod";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Card,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
  Checkbox,
  DatePicker,
  Skeleton // Skeleton Imported
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
  TbBell,
  TbBrandWhatsapp,
  TbCalendarEvent,
  TbCheck,
  TbChecks,
  TbCloudUpload,
  TbColumns,
  TbEye,
  TbFilter,
  TbKey,
  TbMail,
  TbPencil,
  TbPlus,
  TbReload,
  TbSearch,
  TbTagStarred,
  TbUserBolt,
  TbUserCircle,
  TbUserExclamation,
  TbUsers,
  TbUserScreen,
  TbUserShare,
  TbUserSquareRounded,
  TbUserX,
  TbX,
} from "react-icons/tb";
import { BsThreeDotsVertical } from "react-icons/bs";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";

// Redux & Utils
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addNotificationAction,
  addScheduleAction,
  addAllActionAction,
  getDepartmentsAction,
  getDesignationsAction,
  getEmployeesListingAction,
  getRolesAction,
  getAllUsersAction,
  submitExportReasonAction
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import dayjs from "dayjs";
import { shallowEqual, useSelector } from "react-redux";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "localforage";


// --- Type Definitions ---
export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated";
export type EmployeeItem = {
  id: string;
  employeeId: string;
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
export type SelectOption = { value: any; label: string };
export type ModalType = | "email" | "whatsapp" | "notification" | "schedule" | "activity";
export interface ModalState { isOpen: boolean; type: ModalType | null; data: EmployeeItem | null; }

// --- Constants ---
const EMPLOYEE_STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [ { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "on_leave", label: "On Leave" }, { value: "terminated", label: "Terminated" } ];
export const employeeStatusColor: Record<EmployeeStatus, string> = { active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100", inactive: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100", on_leave: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100", terminated: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100" };
const eventTypeOptions: SelectOption[] = [ { value: 'Meeting', label: 'Meeting' }, { value: 'Task', label: 'Task' }, { value: 'Reminder', label: 'Reminder' }, { value: 'Other', label: 'Other' } ];

// --- Zod Schemas ---
const employeeFilterFormSchema = z.object({ filterDepartments: z.array(z.object({ value: z.string(), label: z.string() })).optional(), filterDesignations: z.array(z.object({ value: z.string(), label: z.string() })).optional(), filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(), filterRoles: z.array(z.object({ value: z.string(), label: z.string() })).optional() });
type EmployeeFilterFormData = z.infer<typeof employeeFilterFormSchema>;
const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason must be at least 10 characters.").max(255, "Reason cannot exceed 255 characters.") });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
const notificationSchema = z.object({ subject: z.string().min(3, "Subject is required."), message: z.string().min(10, "Message must be at least 10 characters."), send_users: z.array(z.string()).min(1, "At least one recipient is required.") });
type NotificationFormData = z.infer<typeof notificationSchema>;
const scheduleSchema = z.object({ event_title: z.string().min(3, "Title is required."), event_type: z.string().min(1, "Event type is required."), date_time: z.date({ required_error: "Event date & time is required." }), remind_from: z.date().nullable().optional(), notes: z.string().optional() });
type ScheduleFormData = z.infer<typeof scheduleSchema>;
const activitySchema = z.object({ item: z.string().min(3, "Activity item is required."), notes: z.string().optional() });
type ActivityFormData = z.infer<typeof activitySchema>;

// --- Helper & Utility Functions ---
const headerToKeyMap: Record<string, keyof EmployeeItem | string> = { "ID": "id", "Employee ID": "employeeId", "Name": "name", "Email": "email", "Mobile": "mobile", "Status": "status", "Department": "department", "Designation": "designation", "Roles": "roles", "Joining Date": "joiningDate" };
const EMPLOYEE_CSV_HEADERS = Object.keys(headerToKeyMap);
function exportEmployeesToCsv(filename: string, rows: EmployeeItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const transformedRows = rows.map(row => { const statusText = row.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); return { id: String(row.id) || "N/A", employeeId: row.employeeId || "N/A", name: row.name || "N/A", email: row.email || "N/A", mobile: row.mobile || "N/A", status: statusText, department: row.department || "N/A", designation: row.designation || "N/A", roles: Array.isArray(row.roles) ? row.roles.join(', ') : 'N/A', joiningDate: row.joiningDate ? dayjs(row.joiningDate).format("DD-MMM-YYYY") : "N/A" }; });
  const csvContent = [ EMPLOYEE_CSV_HEADERS.join(','), ...transformedRows.map(row => EMPLOYEE_CSV_HEADERS.map(header => JSON.stringify(row[headerToKeyMap[header] as keyof typeof row] ?? '')).join(',')) ].join('\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- Reusable Dialog Components ---
const AddNotificationDialog = ({ isOpen, onClose, employee, onSubmit, isLoading, userOptions }: { isOpen: boolean; onClose: () => void; employee: EmployeeItem; onSubmit: (data: NotificationFormData) => void; isLoading: boolean; userOptions: SelectOption[]; }) => {
    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(notificationSchema), mode: 'onChange' });
    useEffect(() => { if (!isOpen) { reset({ subject: '', message: '', send_users: [] }); } else { reset({ subject: `Regarding Employee: ${employee.name}`, message: `This is a notification for ${employee.name} (ID: ${employee.employeeId}).`, send_users: [employee.id] }) } }, [isOpen, reset, employee]);
    return (<Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose}> <h5 className="mb-4">Add Notification for {employee.name}</h5> <Form onSubmit={handleSubmit(onSubmit)}> <FormItem label="Subject" invalid={!!errors.subject} errorMessage={errors.subject?.message}><Controller name="subject" control={control} render={({ field }) => <Input {...field} autoFocus />} /></FormItem> <FormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter((o) => field.value?.includes(o.value))} onChange={(options) => field.onChange(options?.map((o) => o.value) || [])} />)} /></FormItem> <FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem> <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send</Button></div> </Form> </Dialog>);
};
const AddScheduleDialog = ({ isOpen, onClose, employee, onSubmit, isLoading }: { isOpen: boolean; onClose: () => void; employee: EmployeeItem; onSubmit: (data: ScheduleFormData) => void; isLoading: boolean; }) => {
    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema), mode: 'onChange' });
    useEffect(() => { if (!isOpen) { reset({ event_title: '', event_type: '', date_time: undefined, remind_from: null, notes: '' }); } else { reset({ event_title: `Meeting with ${employee.name}`, event_type: 'Meeting', date_time: undefined, remind_from: null, notes: '' }) } }, [isOpen, reset, employee]);
    return (<Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose}> <h5 className="mb-4">Add Schedule for {employee.name}</h5> <Form onSubmit={handleSubmit(onSubmit)}> <FormItem label="Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></FormItem> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem><FormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem></div> <FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select reminder date & time" value={field.value} onChange={field.onChange} />)} /></FormItem> <FormItem label="Notes (Optional)" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem> <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div> </Form> </Dialog>);
};
const AddActivityDialog = ({ isOpen, onClose, employee, onSubmit, isLoading }: { isOpen: boolean; onClose: () => void; employee: EmployeeItem; onSubmit: (data: ActivityFormData) => void; isLoading: boolean; }) => {
    const { control, handleSubmit, reset, formState: { errors, isValid } } = useForm<ActivityFormData>({ resolver: zodResolver(activitySchema), mode: 'onChange' });
    useEffect(() => { if (!isOpen) { reset({ item: '', notes: '' }); } else { reset({ item: `Followed up with ${employee.name}`, notes: '' }) } }, [isOpen, reset, employee]);
    return (<Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose}> <h5 className="mb-4">Add Activity Log for "{employee.name}"</h5> <Form onSubmit={handleSubmit(onSubmit)}> <FormItem label="Activity" invalid={!!errors.item} errorMessage={errors.item?.message}><Controller name="item" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Followed up on performance" autoFocus />} /></FormItem> <FormItem label="Notes (Optional)" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} placeholder="Add relevant details..." />} /></FormItem> <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading} icon={<TbCheck />}>Save Activity</Button></div> </Form> </Dialog>);
};

// --- Direct Action Components (no UI) ---
const SendEmailAction = ({ employee, onClose }: { employee: EmployeeItem; onClose: () => void; }) => {
    useEffect(() => { const subject = `Regarding Your Profile`; const body = `Hello ${employee.name},\n\nWe are contacting you regarding...\n\nRegards.`; window.open(`mailto:${employee.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`); onClose(); }, [employee, onClose]);
    return null;
};
const SendWhatsAppAction = ({ employee, onClose }: { employee: EmployeeItem; onClose: () => void; }) => {
    useEffect(() => { if (!employee.mobile) { toast.push(<Notification type="warning" title="Missing Number" children="This employee does not have a mobile number." />); onClose(); return; } const message = `Hello ${employee.name},\nThis is a message from our company...`; const url = `https://wa.me/${employee.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`; window.open(url, '_blank'); onClose(); }, [employee, onClose]);
    return null;
};

// --- Centralized Modal Router ---
const EmployeeModals = ({ modalState, onClose, userData, userOptions }: { modalState: ModalState; onClose: () => void; userData: any; userOptions: SelectOption[]; }) => {
    const { isOpen, type, data: employee } = modalState;
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirmNotification = async (data: NotificationFormData) => {
        if (!employee) return;
        setIsSubmitting(true);
        try {
            await dispatch(addNotificationAction({ ...data, module_id: String(employee.id), module_name: 'Employee' })).unwrap();
            toast.push(<Notification title="Notification Sent" type="success" />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification title="Failed to Send" type="danger" children={error.message || 'An unknown error occurred'} />);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleConfirmSchedule = async (data: ScheduleFormData) => {
        if (!employee) return;
        setIsSubmitting(true);
        const payload = { module_id: Number(employee.id), module_name: 'Employee', event_title: data.event_title, event_type: data.event_type, date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'), ...(data.remind_from && { remind_from: dayjs(data.remind_from).format("YYYY-MM-DDTHH:mm:ss") }), notes: data.notes || '' };
        try {
            await dispatch(addScheduleAction(payload)).unwrap();
            toast.push(<Notification title="Event Scheduled" type="success" />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification title="Scheduling Failed" type="danger" children={error.message || 'An unknown error occurred'} />);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleConfirmActivity = async (data: ActivityFormData) => {
        if (!employee || !userData?.id) return;
        setIsSubmitting(true);
        try {
            await dispatch(addAllActionAction({ item: data.item, notes: data.notes || '', module_id: String(employee.id), module_name: 'Employee', user_id: userData.id })).unwrap();
            toast.push(<Notification type="success" title="Activity Added" />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Failed to Add Activity" children={error?.message || 'An unknown error occurred.'} />);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !employee) return null;

    switch (type) {
        case 'email': return <SendEmailAction employee={employee} onClose={onClose} />;
        case 'whatsapp': return <SendWhatsAppAction employee={employee} onClose={onClose} />;
        case 'notification': return <AddNotificationDialog isOpen={true} onClose={onClose} employee={employee} onSubmit={handleConfirmNotification} isLoading={isSubmitting} userOptions={userOptions} />;
        case 'schedule': return <AddScheduleDialog isOpen={true} onClose={onClose} employee={employee} onSubmit={handleConfirmSchedule} isLoading={isSubmitting} />;
        case 'activity': return <AddActivityDialog isOpen={true} onClose={onClose} employee={employee} onSubmit={handleConfirmActivity} isLoading={isSubmitting} />;
        default: return null;
    }
};

const ActionColumn = ({ rowData, onOpenModal }: { 
    rowData: EmployeeItem; onOpenModal: (type: ModalType, data: EmployeeItem) => void;
}) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="View"><div className={`text-xl p-1.5 cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={() => navigate(`/hr-employees/employees/view/${rowData.id}`)}><TbEye /></div></Tooltip>
      <Tooltip title="Edit"><div className={`text-xl p-1.5 cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={() => navigate(`/hr-employees/employees/edit/${rowData.id}`)}><TbPencil /></div></Tooltip>

      <Dropdown renderTitle={<BsThreeDotsVertical className="text-xl p-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />} placement="bottom-end">
        <Dropdown.Item onClick={() => onOpenModal('email', rowData)} className="flex items-center gap-2"><TbMail size={18} /><span className="text-sm">Send Email</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('whatsapp', rowData)} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /><span className="text-sm">Send Whatsapp</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('notification', rowData)} className="flex items-center gap-2"><TbBell size={18} /><span className="text-sm">Add Notification</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('schedule', rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /><span className="text-sm">Add Schedule</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('activity', rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /><span className="text-sm">Add Activity</span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const EmployeeSelected = ({ selectedEmployees, onDeleteSelected }: { selectedEmployees: EmployeeItem[]; onDeleteSelected: () => void; }) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  if (selectedEmployees.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedEmployees.length}</span><span>Employee{selectedEmployees.length > 1 ? "s" : ""} selected</span></span></span>
          <div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmationOpen(true)}>Delete</Button></div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedEmployees.length} Employee${selectedEmployees.length > 1 ? "s" : ""}`} onClose={() => setDeleteConfirmationOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmationOpen(false); }}><p>Are you sure you want to delete the selected employee{selectedEmployees.length > 1 ? "s" : ""}? This action cannot be undone.</p></ConfirmDialog>
    </>
  );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: EmployeeFilterFormData; onRemoveFilter: (key: keyof EmployeeFilterFormData, value: string) => void; onClearAll: () => void; }) => {
  const filterKeyToLabelMap: Record<string, string> = { filterDepartments: 'Dept', filterDesignations: 'Designation', filterStatuses: 'Status', filterRoles: 'Role' };
  const activeFiltersList = Object.entries(filterData).flatMap(([key, value]) => { if (!value || (Array.isArray(value) && value.length === 0)) return []; return value.map((item: { value: string; label: string }) => ({ key, value: item.value, label: `${filterKeyToLabelMap[key] || 'Filter'}: ${item.label}` })); });
  if (activeFiltersList.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {activeFiltersList.map(filter => (<Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">{filter.label}<TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key as keyof EmployeeFilterFormData, filter.value)} /></Tag>))}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};

const EmployeeTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount, isDataReady }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; columns: ColumnDef<EmployeeItem>[]; filteredColumns: ColumnDef<EmployeeItem>[]; setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<EmployeeItem>[]>>; activeFilterCount: number; isDataReady: boolean; }) => {
  const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => { if (checked) { const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId); if (originalColumn) { setFilteredColumns(prev => { const newCols = [...prev, originalColumn]; newCols.sort((a, b) => { const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey)); const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey)); return indexA - indexB; }); return newCols; }); } } else { setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId)); } };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow"><DebouceInput className="w-full" placeholder="Quick Search..." onChange={(e) => onSearchChange(e.target.value)} /></div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end"><div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>{columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}</div></Dropdown>
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload" disabled={!isDataReady}></Button>
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto" disabled={!isDataReady}>Filter {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
        <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto" disabled={!isDataReady}>Export</Button>
      </div>
    </div>
  );
};

// --- Main EmployeesListing Component ---
const EmployeesListing = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { EmployeesList: Employees, Roles = [], departmentsData = [], designationsData = [], getAllUserData = [] } = useSelector(masterSelector, shallowEqual);
    
    // Data & Loading State
    const [employees, setEmployees] = useState<EmployeeItem[]>([]);
    const [employeesCount, setEmployeesCount] = useState<any>({});
    const [initialLoading, setInitialLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Table & Filter State
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<EmployeeFilterFormData>({});
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
    const [selectedEmployees, setSelectedEmployees] = useState<EmployeeItem[]>([]);
    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<EmployeeItem>[]>([]);
    
    // Modal & Dialog State
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
    const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [viewerImageSrc, setViewerImageSrc] = useState<string | null>(null);
    
    // Derived states
    const isDataReady = !initialLoading;
    const tableLoading = initialLoading || isSubmitting;

    // Forms
    const filterFormMethods = useForm<EmployeeFilterFormData>({ resolver: zodResolver(employeeFilterFormSchema) });
    const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), mode: 'onChange' });

    // Initial Data Fetch
    useEffect(() => {  
        const fetchData = async () => {
            setInitialLoading(true);
            try {
                await Promise.all([
                    dispatch(getEmployeesListingAction()),
                    dispatch(getRolesAction()),
                    dispatch(getDepartmentsAction()),
                    dispatch(getDesignationsAction()),
                    dispatch(getAllUsersAction())
                ]);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                toast.push(<Notification title="Error" type="danger">Failed to load necessary data.</Notification>)
            } finally {
                setInitialLoading(false);
            }
        }
        fetchData();
    }, [dispatch]);
    
    // Get Logged In User Data
    useEffect(() => {
        const { useEncryptApplicationStorage } = config;
        try { setUserData(encryptStorage.getItem("UserData", !useEncryptApplicationStorage)); } 
        catch (error) { console.error("Error getting UserData:", error); }
    }, []);

    // Data Formatting
    useEffect(() => {
        if (Employees?.data) {
            const formattedData = Employees.data.map((emp: any) => ({
                id: String(emp.id),
                employeeId: emp.employee_id || 'N/A',
                status: (emp.status?.toLowerCase().replace(' ', '_') || 'inactive') as EmployeeStatus,
                name: emp.name || 'Unknown',
                email: emp.email || 'No Email',
                mobile: emp.mobile_number ? `${emp.mobile_number_code || ''}${emp.mobile_number}`.trim() : null,
                department: emp.department?.name || 'N/A',
                designation: emp.designation?.name || 'N/A',
                roles: Array.isArray(emp.roles) ? emp.roles.map((r: any) => r.display_name) : [],
                avatar: emp.profile_pic_path ? emp.profile_pic_path.replace(/([^:]\/)\/+/g, "$1") : null,
                createdAt: new Date(emp.created_at),
                joiningDate: emp.created_at ? new Date(emp.created_at) : null,
            }));
            setEmployees(formattedData);
            setEmployeesCount(Employees?.counts || {});
        }
    }, [Employees]);

    // --- Action Handlers ---
    const handleOpenModal = (type: ModalType, employeeData: EmployeeItem) => setModalState({ isOpen: true, type, data: employeeData });
    const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });
    
    // UI & Table Handlers
    const openImageViewer = useCallback((src?: string | null) => { if (src) { setViewerImageSrc(src); setIsImageViewerOpen(true); } }, []);
    const closeImageViewer = useCallback(() => { setIsImageViewerOpen(false); setViewerImageSrc(null); }, []);
    const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); };
    const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
    const onApplyFiltersSubmit = (data: EmployeeFilterFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); };
    const onClearFilters = () => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); };
    const handleRemoveFilter = (key: keyof EmployeeFilterFormData, valueToRemove: string) => { setFilterCriteria(prev => { const newCriteria = { ...prev }; const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined; if (currentFilterArray) { (newCriteria as any)[key] = currentFilterArray.filter(item => item.value !== valueToRemove); } return newCriteria; }); handleSetTableData({ pageIndex: 1 }); };
    
    // Memoized Data Processing
    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData = [...employees];
        if (filterCriteria.filterDepartments?.length) { const v = filterCriteria.filterDepartments.map((o) => o.label.toLowerCase()); processedData = processedData.filter((e: any) => v.includes(e.department?.toLowerCase())); }
        if (filterCriteria.filterDesignations?.length) { const v = filterCriteria.filterDesignations.map((o) => o.label.toLowerCase()); processedData = processedData.filter((e: any) => v.includes(e.designation?.toLowerCase())); }
        if (filterCriteria.filterStatuses?.length) { const v = filterCriteria.filterStatuses.map((o) => o.value); processedData = processedData.filter((e) => v.includes(e.status)); }
        if (filterCriteria.filterRoles?.length) { const v = filterCriteria.filterRoles.map((o) => o.label.toLowerCase()); processedData = processedData.filter((e: any) => e.roles.some((role: any) => v.includes(role?.toLowerCase()))); }
        if (tableData.query) { const query = tableData.query.toLowerCase(); processedData = processedData.filter((e: any) => e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query)); }
        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) { processedData.sort((a: any, b: any) => { let aVal = a[key as keyof EmployeeItem] as any; let bVal = b[key as keyof EmployeeItem] as any; if (key === "createdAt" || key === "joiningDate") { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0; } else if (key === "roles") { aVal = a.roles.join(", "); bVal = b.roles.join(", "); } if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal; return order === "asc" ? String(aVal ?? "").localeCompare(String(bVal ?? "")) : String(bVal ?? "").localeCompare(String(aVal ?? "")); }); }
        return { pageData: processedData.slice((tableData.pageIndex - 1) * tableData.pageSize, tableData.pageIndex * tableData.pageSize), total: processedData.length, allFilteredAndSortedData: processedData };
    }, [employees, tableData, filterCriteria]);

    const activeFilterCount = useMemo(() => Object.values(filterCriteria).filter(value => Array.isArray(value) && value.length > 0).length, [filterCriteria]);
    const handleOpenExportReasonModal = () => { if (allFilteredAndSortedData.length > 0) { exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true); } else { toast.push(<Notification title="No Data" type="info">There is no data to export.</Notification>); } };
    const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { setIsSubmitting(true); const fileName = `employees_export_${dayjs().format('YYYY-MM-DD')}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Employee', file_name: fileName })).unwrap(); const exportSuccessful = exportEmployeesToCsv(fileName, allFilteredAndSortedData); if (exportSuccessful) setIsExportReasonModalOpen(false); } catch (error: any) { toast.push(<Notification title="Operation Failed" type="danger" children={error.message || 'Could not submit reason or export data.'} />); } finally { setIsSubmitting(false); } };
    
    // Table Callbacks
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedEmployees([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: EmployeeItem) => { setSelectedEmployees((prev) => checked ? [...prev, row] : prev.filter((e) => e.id !== row.id)); }, []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<EmployeeItem>[]) => { const originals = currentRows.map((r) => r.original); if (checked) { setSelectedEmployees((prev) => [...prev, ...originals.filter((o) => !prev.some(p => p.id === o.id))]); } else { const currentIds = new Set(originals.map((o) => o.id)); setSelectedEmployees((prev) => prev.filter((i) => !currentIds.has(i.id))); } }, []);

    // Table Columns
    const columns: ColumnDef<EmployeeItem>[] = useMemo(() => [
        { header: "Status", accessorKey: "status", cell: (props) => { const { status } = props.row.original || {}; const validStatus: EmployeeStatus = EMPLOYEE_STATUS_OPTIONS.some(o => o.value === status) ? status : 'inactive'; const displayStatus = validStatus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()); return (<Tag className={`${employeeStatusColor[validStatus]} capitalize font-semibold border-0`}>{displayStatus}</Tag>); } },
        { header: "Name", accessorKey: "name", cell: (props) => { const { name, email, mobile, avatar, employeeId } = props.row.original || {}; return (<div className="flex items-center"><Avatar size={40} shape="circle" src={avatar} icon={<TbUserCircle />} className={classNames('cursor-pointer hover:ring-2 hover:ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800', !avatar && 'bg-gray-200 dark:bg-gray-600')} onClick={() => openImageViewer(avatar)}>{!avatar && name ? name.charAt(0).toUpperCase() : ""}</Avatar><div className="ml-3 rtl:mr-3"><span className="font-semibold heading-text">{name}</span><div className="text-xs text-gray-500">{email}</div><div className="flex items-center gap-2 mt-1"><Tag className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 text-[10px] font-semibold">ID: {employeeId}</Tag>{mobile && (<span className="text-xs text-gray-500 flex items-center gap-1"><TbBrandWhatsapp className="text-green-500"/>{mobile}</span>)}</div></div></div>); } },
        { header: "Designation", accessorKey: "designation", size: 200, cell: (props) => (<div className="font-semibold">{props.row.original?.designation ?? ""}</div>) },
        { header: "Department", accessorKey: "department", size: 200, cell: (props) => (<div className="font-semibold">{props.row.original?.department ?? ""}</div>) },
        { header: "Roles", accessorKey: "roles", cell: (props) => (<div className="flex flex-wrap gap-1">{props.row.original?.roles?.map((role: any) => (<Tag key={role} className="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100 text-[10px] font-semibold border-0">{role || ""}</Tag>))}</div>) },
        { header: "Joined At", accessorKey: "joiningDate", size: 150, cell: (props) => props.row.original?.joiningDate ? <span className="text-sm">{dayjs(props.row.original.joiningDate).format("D MMM YYYY")}</span> : '-' },
        { header: "Action", id: "action", size: 120, meta: { HeaderClass: "text-center" }, cell: (props) => (<ActionColumn rowData={props.row.original} onOpenModal={handleOpenModal} />) },
    ], [openImageViewer]);
    
    useEffect(() => { setFilteredColumns(columns) }, [columns]);

    // Data for UI Selects
    const userOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((u: any) => ({ value: String(u.id), label: `(${u.employee_id}) - ${u.name || 'N/A'}` })) : [], [getAllUserData]);
    const roleOptions = useMemo(() => Array.isArray(Roles) ? Roles.map((r: any) => ({ value: String(r.id), label: r.display_name })) : [], [Roles]);
    const departmentOptions = useMemo(() => Array.isArray(departmentsData?.data) ? departmentsData?.data.map((d: any) => ({ value: d.name, label: d.name })) : [], [departmentsData?.data]);
    const designationOptions = useMemo(() => Array.isArray(designationsData?.data) ? designationsData?.data.map((d: any) => ({ value: d.name, label: d.name })) : [], [designationsData?.data]);
    
    const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out hover:shadow-lg";
    const cardBodyClass = "flex gap-2 p-2";

    const renderCardContent = (content: number | undefined) => {
        if (initialLoading) {
            return <Skeleton width={40} height={20} />;
        }
        return <h6 className="font-bold">{content ?? 0}</h6>;
    };

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="lg:flex items-center justify-between mb-4"><h5 className="mb-4 lg:mb-0">Employees Listing</h5><Button variant="solid" icon={<TbPlus />} onClick={() => navigate('/hr-employees/employees/add')} disabled={!isDataReady}>Add New</Button></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
                        <Tooltip title="Click to show all employees"><div onClick={onClearFilters} className="cursor-pointer"><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbUsers size={24} /></div><div><div className="text-blue-500">{renderCardContent(employeesCount?.total)}</div><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
                        <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200 cursor-default")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbUserSquareRounded size={24} /></div><div><div className="text-violet-500">{renderCardContent(employeesCount?.this_month)}</div><span className="font-semibold text-xs">This Month</span></div></Card>
                        <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-pink-200 cursor-default")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbUserBolt size={24} /></div><div><div className="text-pink-500">{renderCardContent(employeesCount?.avg_present_percent)}</div><span className="font-semibold text-xs"> % Avg. Present</span></div></Card>
                        <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-orange-200 cursor-default")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbUserExclamation size={24} /></div><div><div className="text-orange-500">{renderCardContent(employeesCount?.late_arrivals)}</div><span className="font-semibold text-xs">Late Arrivals</span></div></Card>
                        <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-200 cursor-default")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUserScreen size={24} /></div><div><div className="text-green-500">{renderCardContent(employeesCount?.training_rate)}</div><span className="font-semibold text-xs">Training Rate</span></div></Card>
                        <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200 cursor-default")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbUserShare size={24} /></div><div><div className="text-red-500">{renderCardContent(employeesCount?.offboarding)}</div><span className="font-semibold text-xs">Offboarding</span></div></Card>
                    </div>
                    <div className="mb-4"><EmployeeTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} isDataReady={isDataReady} /></div>
                    <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
                    <div className="flex-grow overflow-auto"><DataTable selectable columns={filteredColumns} data={pageData} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex, pageSize: tableData.pageSize }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} noData={!isDataReady && pageData.length === 0} /></div>
                </AdaptiveCard>
            </Container>
            
            <EmployeeSelected selectedEmployees={selectedEmployees} onDeleteSelected={() => { /* Implement bulk delete logic */ }} />
            
            {/* Dialogs, Modals & Drawers */}
            <EmployeeModals modalState={modalState} onClose={handleCloseModal} userData={userData} userOptions={userOptions} />
            <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600} bodyOpenClassName="overflow-hidden"><div className="flex justify-center items-center p-4">{viewerImageSrc ? (<img src={viewerImageSrc} alt="Employee Profile View" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}/>) : (<p>No image to display.</p>)}</div></Dialog>
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterEmployeeForm" type="submit">Apply</Button></div>}><Form id="filterEmployeeForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4"><FormItem label="Department"><Controller name="filterDepartments" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Department" options={departmentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem><FormItem label="Designation"><Controller name="filterDesignations" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Designation" options={designationOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem><FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Status" options={EMPLOYEE_STATUS_OPTIONS} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem><FormItem label="Role"><Controller name="filterRoles" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Role" options={roleOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem></Form></Drawer>
            <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmitting} confirmText={isSubmitting ? 'Submitting...' : 'Submit & Export'} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmitting }}><Form id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)() }}><FormItem label="Please provide a reason for exporting the data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3}/>)}/></FormItem></Form></ConfirmDialog>
        </>
    );
};

export default EmployeesListing;