// src/views/your-path/BugReportListing.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import cloneDeep from "lodash/cloneDeep";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BsThreeDotsVertical } from "react-icons/bs";
import { shallowEqual, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { z } from "zod";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// --- UI Components ---
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebounceInput from "@/components/shared/DebouceInput";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Dialog,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Select,
  Tag,
  Tooltip,
} from "@/components/ui";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";

// --- Icons ---
import {
  TbBell,
  TbBrandWhatsapp,
  TbBug,
  TbCalendarClock,
  TbCalendarEvent,
  TbChecks,
  TbCircleCheck,
  TbCircleX,
  TbCloudUpload,
  TbColumns,
  TbEye,
  TbFileDescription,
  TbFilter,
  TbInfoCircle,
  TbLoader,
  TbMail,
  TbMailPlus,
  TbMailShare,
  TbPaperclip,
  TbPencil,
  TbPhone,
  TbPlus,
  TbReload,
  TbSearch,
  TbUser,
  TbUserCircle,
  TbX,
} from "react-icons/tb";

// --- Types & Redux ---
import type { TableQueries } from "@/@types/common";
import type { ColumnDef, OnSortParam, Row } from "@/components/shared/DataTable";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addBugReportAction,
  addNotificationAction,
  addScheduleAction,
  deleteAllBugReportsAction,
  deleteBugReportAction,
  editBugReportAction,
  getAllUsersAction,
  getBugReportsAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";

// --- Define Types & Constants ---
export type BugReportStatusApi = "New" | "Under Review" | "Resolved" | "Unresolved" | "Read" | "Unread" | string;
export type BugReportSeverity = "Low" | "Medium" | "High";
export type SelectOption = { value: any; label: string };

export type BugReportItem = {
  id: string | number;
  name: string;
  email: string;
  mobile_no?: string;
  report: string;
  attachment?: string | null;
  status: BugReportStatusApi;
  severity?: BugReportSeverity;
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
  updated_by_user?: { name: string; roles: { display_name: string }[] } | null;
};

const BUG_REPORT_STATUS_OPTIONS: SelectOption[] = [
  { value: "New", label: "New" },
  { value: "Under Review", label: "Under Review" },
  { value: "Resolved", label: "Resolved" },
  { value: "Unresolved", label: "Unresolved" },
];

const bugStatusColor: Record<BugReportStatusApi, string> = {
  New: "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-100",
  "Under Review": "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-100",
  Resolved: "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-100",
  Unresolved: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
  Read: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Unread: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
};

// --- Zod Schemas ---
const bugReportFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name too long"),
  email: z.string().email("Invalid email format.").min(1, "Email is required."),
  mobile_no: z.string().max(20, "Mobile number too long.").optional().or(z.literal("")),
  report: z.string().min(10, "Report description must be at least 10 characters.").max(5000, "Report too long"),
  severity: z.enum(["Low", "Medium", "High"], { required_error: "Severity is required." }),
  status: z.enum(["New", "Under Review", "Resolved", "Unresolved"], { required_error: "Status is required." }),
  attachment: z.any().optional(),
});
type BugReportFormData = z.infer<typeof bugReportFormSchema>;

const filterFormSchema = z.object({ filterStatus: z.array(z.string()).optional(), filterReportedBy: z.string().optional() });
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters.") });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

const eventTypeOptions: SelectOption[] = [
  { value: "Meeting", label: "Meeting" },
  { value: "Call", label: "Follow-up Call" },
  { value: "Deadline", label: "Project Deadline" },
  { value: "Reminder", label: "Reminder" },
];

// --- Helper Functions and Reusable Components ---
function exportBugReportsToCsv(filename: string, rows: BugReportItem[]) {
  if (!rows || rows.length === 0) {
    toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
    return false;
  }
  const preparedRows = rows.map((row) => ({
    ID: row.id,
    Name: row.name,
    Email: row.email,
    MobileNo: row.mobile_no || "N/A",
    Report: `"${(row.report || "").replace(/"/g, '""')}"`,
    Attachment: row.attachment || "N/A",
    Status: row.status,
    CreatedAt: row.created_at ? new Date(row.created_at).toLocaleString() : "N/A",
    UpdatedBy: row.updated_by_user?.name || "N/A",
    UpdatedRole: row.updated_by_user?.roles?.[0]?.display_name || 'N/A',
    UpdatedAt: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
  }));
  const csvContent = [
    Object.keys(preparedRows[0]).join(','),
    ...preparedRows.map(row => Object.values(row).map(value => `${value}`).join(','))
  ].join('\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

const itemPath = (filename: any) => {
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
  return filename ? `${baseUrl}/storage/attachments/bug_reports/${filename}` : "#";
};

const ActionColumn = ({ onEdit, onViewDetail, onAddNotification, onAddSchedule }: { onEdit: () => void; onViewDetail: () => void; onAddNotification: () => void; onAddSchedule: () => void; }) => (
    <div className="flex items-center justify-center text-center">
      <Tooltip title="View Details"><button className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`} role="button" onClick={onViewDetail}><TbEye /></button></Tooltip>
      <Tooltip title="Edit Report"><button className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`} role="button" onClick={onEdit}><TbPencil /></button></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item className="flex items-center gap-2" onClick={onAddNotification}><TbBell size={18} /> <span className="text-xs">Add Notification </span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><Link to="/task/task-list/create" className="flex w-full items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign to Task</span></Link></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbMailShare size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2" onClick={onAddSchedule}><TbCalendarClock size={18} /> <span className="text-xs">Add Schedule </span></Dropdown.Item>
      </Dropdown>
    </div>
);

const ItemSearch = React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void; value: string }>(({ onInputChange, value }, ref) => (
  <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} value={value} onChange={(e) => onInputChange(e.target.value)} />
));
ItemSearch.displayName = "ItemSearch";

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: Partial<FilterFormData>, onRemoveFilter: (key: keyof FilterFormData, value: any) => void, onClearAll: () => void }) => {
    const activeStatuses = filterData.filterStatus || [];
    const activeReportedBy = filterData.filterReportedBy;
    const hasActiveFilters = activeStatuses.length > 0 || !!activeReportedBy;
    if (!hasActiveFilters) return null;
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeStatuses.map(status => (<Tag key={`status-${status}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Status: {status}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('filterStatus', status)} /></Tag>))}
            {activeReportedBy && (<Tag prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">Reported By: {activeReportedBy}<TbX className="ml-1 h-3 w-3 cursor-pointer" onClick={() => onRemoveFilter('filterReportedBy', activeReportedBy)} /></Tag>)}
            {hasActiveFilters && <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>}
        </div>
    );
};

const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, searchVal, columns, filteredColumns, setFilteredColumns, activeFilterCount }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; searchVal: string; columns: ColumnDef<BugReportItem>[]; filteredColumns: ColumnDef<BugReportItem>[]; setFilteredColumns: (cols: ColumnDef<BugReportItem>[]) => void; activeFilterCount: number; }) => {
    const toggleColumn = (checked: boolean, colHeader: string) => {
        const newCols = checked
            ? [...filteredColumns, columns.find(c => c.header === colHeader)!].sort((a, b) => columns.indexOf(a as any) - columns.indexOf(b as any))
            : filteredColumns.filter(c => c.header !== colHeader);
        setFilteredColumns(newCols);
    };
    const isColumnVisible = (header: string) => filteredColumns.some(c => c.header === header);
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} value={searchVal} /></div>
            <div className="flex items-center gap-2">
                <Dropdown renderTitle={<Button title="Filter Columns" icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>{columns.filter(c => c.id !== 'select' && c.header).map(col => (<div key={col.header as string} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox name={col.header as string} checked={isColumnVisible(col.header as string)} onChange={(checked) => toggleColumn(checked, col.header as string)} />{col.header}</div>))}</div>
                </Dropdown>
                <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload"></Button>
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter{activeFilterCount > 0 && <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    );
};

const BugReportsSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: { selectedItems: BugReportItem[]; onDeleteSelected: () => void; isDeleting: boolean; }) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Report{selectedItems.length > 1 ? "s" : ""} selected</span></span></span>
          <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Report${selectedItems.length > 1 ? "s" : ""}`} onClose={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }} loading={isDeleting}>
        <p>Are you sure you want to delete the selected report{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

const BugReportNotificationDialog = ({ bugReport, onClose, getAllUserDataOptions }: { bugReport: BugReportItem; onClose: () => void; getAllUserDataOptions: SelectOption[]; }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const notificationSchema = z.object({
    notification_title: z.string().min(3, "Title must be at least 3 characters long."),
    send_users: z.array(z.number()).min(1, "Please select at least one user."),
    message: z.string().min(10, "Message must be at least 10 characters long."),
  });
  type NotificationFormData = z.infer<typeof notificationSchema>;
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      notification_title: `Warning: Regarding Bug Report by ${bugReport.name}`,
      send_users: [],
      message: `A bug report has been submitted by "${bugReport.name}" with the following details:\n\nReport: ${bugReport.report}\nSeverity: ${bugReport.severity}\nStatus: ${bugReport.status}\n\nPlease review.`,
    },
    mode: "onChange",
  });
  const onSend = async (formData: NotificationFormData) => {
    setIsLoading(true);
    const payload = { send_users: formData.send_users, notification_title: formData.notification_title, message: formData.message, module_id: String(bugReport.id), module_name: "BugReport", };
    try {
      await dispatch(addNotificationAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Notification Sent Successfully!" />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || "An unknown error occurred."} />);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Notify User about Bug: {bugReport.name}</h5>
      <Form onSubmit={handleSubmit(onSend)}>
        <FormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
        <FormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<Select isMulti placeholder="Select User(s)" options={getAllUserDataOptions} value={getAllUserDataOptions.filter((o) => field.value?.includes(o.value))} onChange={(options) => field.onChange(options?.map((o) => o.value) || [])} />)} /></FormItem>
        <FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={6} />} /></FormItem>
        <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button></div>
      </Form>
    </Dialog>
  );
};

const BugReportScheduleDialog: React.FC<{ bugReport: BugReportItem; onClose: () => void; }> = ({ bugReport, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_title: `Review bug report from ${bugReport.name}`,
      event_type: undefined,
      date_time: null as any,
      remind_from: null,
      notes: `Regarding bug report: "${bugReport.report.substring(0, 50)}..."`,
    },
    mode: 'onChange',
  });
  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = {
      module_id: Number(bugReport.id),
      module_name: 'BugReport',
      event_title: data.event_title,
      event_type: data.event_type,
      date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'),
      ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }),
      notes: data.notes || '',
    };
    try {
      await dispatch(addScheduleAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for bug report.`} />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for Bug Report</h5>
      <Form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<Select placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem><FormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem></div>
        <FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
        <FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
        <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div>
      </Form>
    </Dialog>
  );
};

// --- Main Component: BugReportListing ---
const BugReportListing = () => {
  const dispatch = useAppDispatch();
  const { bugReportsData: rawBugReportsData = { data: [], counts: {} }, status: masterLoadingStatus = "idle", getAllUserData = [] } = useSelector(masterSelector, shallowEqual);

  const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map(b => ({ value: b.id, label: b.name })) : [], [getAllUserData]);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BugReportItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<BugReportItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BugReportItem | null>(null);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationItem, setNotificationItem] = useState<BugReportItem | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleItem, setScheduleItem] = useState<BugReportItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<Partial<FilterFormData>>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<BugReportItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<BugReportItem>[]>([]);

  useEffect(() => {
    dispatch(getAllUsersAction());
    dispatch(getBugReportsAction());
  }, [dispatch]);

  const bugReportsData: BugReportItem[] = useMemo(() => {
    if (!Array.isArray(rawBugReportsData?.data)) return [];
    return rawBugReportsData?.data.map((item: any) => ({ ...item, updated_by_name: item.updated_by_user?.name || item.updated_by_name, updated_by_role: item.updated_by_user?.roles?.[0]?.display_name || item.updated_by_role }));
  }, [rawBugReportsData?.data]);
  
  const defaultAddFormValues: BugReportFormData = { name: "", email: "", mobile_no: "", report: "", severity: "Low", status: "New", attachment: undefined };
  const formMethods = useForm<BugReportFormData>({ resolver: zodResolver(bugReportFormSchema), defaultValues: defaultAddFormValues, mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });
  
  const openAddDrawer = useCallback(() => { formMethods.reset(defaultAddFormValues); setSelectedFile(null); setEditingItem(null); setIsAddDrawerOpen(true); }, [formMethods, defaultAddFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
  const openEditDrawer = useCallback((item: BugReportItem) => { setEditingItem(item); setSelectedFile(null); formMethods.reset({ name: item.name, email: item.email, mobile_no: item.mobile_no || "", report: item.report, severity: item.severity || "Low", status: item.status as BugReportFormData['status'], attachment: undefined }); setIsEditDrawerOpen(true); }, [formMethods]);
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);
  const openViewModal = useCallback((item: BugReportItem) => { setViewingItem(item); setIsViewModalOpen(true); }, []);
  const closeViewModal = useCallback(() => { setViewingItem(null); setIsViewModalOpen(false); }, []);
  const openNotificationModal = useCallback((item: BugReportItem) => { setNotificationItem(item); setIsNotificationModalOpen(true); }, []);
  const closeNotificationModal = useCallback(() => { setNotificationItem(null); setIsNotificationModalOpen(false); }, []);
  const openScheduleModal = useCallback((item: BugReportItem) => { setScheduleItem(item); setIsScheduleModalOpen(true); }, []);
  const closeScheduleModal = useCallback(() => { setScheduleItem(null); setIsScheduleModalOpen(false); }, []);
  
  const onSubmitHandler = async (data: BugReportFormData) => {
    setIsSubmitting(true);
    const formDataPayload = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'attachment' && value != null) {
        formDataPayload.append(key, value as string);
      }
    });
    if (selectedFile) formDataPayload.append("attachment", selectedFile);
    try {
      if (editingItem) {
        formDataPayload.append("_method", "PUT");
        await dispatch(editBugReportAction({ id: editingItem.id, formData: formDataPayload })).unwrap();
        toast.push(<Notification title="Bug Report Updated" type="success" />);
        closeEditDrawer();
      } else {
        await dispatch(addBugReportAction(formDataPayload)).unwrap();
        toast.push(<Notification title="Bug Report Submitted" type="success">Thank you for your report!</Notification>);
        closeAddDrawer();
      }
      dispatch(getBugReportsAction());
    } catch (error: any) {
      toast.push(<Notification title={editingItem ? "Update Failed" : "Submission Failed"} type="danger" children={(error as Error).message || "Operation failed."} />);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = useCallback(async (item: BugReportItem, newStatus: BugReportItem['status']) => {
    setIsChangingStatus(true);
    const formData = new FormData();
    formData.append("name", item.name);
    formData.append("email", item.email);
    if (item.mobile_no) formData.append("mobile_no", item.mobile_no);
    formData.append("report", item.report);
    formData.append("severity", item.severity || "Low");
    formData.append("status", newStatus);
    formData.append("_method", "PUT");
    try {
      await dispatch(editBugReportAction({ id: item.id, formData })).unwrap();
      toast.push(<Notification title="Status Changed" type="success">{`Report status changed to ${newStatus}.`}</Notification>);
      dispatch(getBugReportsAction());
      if (viewingItem?.id === item.id) {
        setViewingItem((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error: any) {
      toast.push(<Notification title="Status Change Failed" type="danger" children={(error as Error).message} />);
    } finally {
      setIsChangingStatus(false);
    }
  }, [dispatch, viewingItem]);

  const handleDeleteClick = useCallback((item: BugReportItem) => { if (!item.id) return; setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteBugReportAction({ id: itemToDelete.id })).unwrap();
      toast.push(<Notification title="Report Deleted" type="success">{`Report by "${itemToDelete.name}" deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getBugReportsAction());
    } catch (error: any) {
      toast.push(<Notification title="Delete Failed" type="danger" children={(error as Error).message} />);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
    try {
      await dispatch(deleteAllBugReportsAction({ ids: idsToDelete.join(",") })).unwrap();
      toast.push(<Notification title="Deletion Successful" type="success">{`${idsToDelete.length} report(s) deleted.`}</Notification>);
      setSelectedItems([]);
      dispatch(getBugReportsAction());
    } catch (error: any) {
      toast.push(<Notification title="Deletion Failed" type="danger" children={(error as Error).message} />);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria({ filterStatus: data.filterStatus || [], filterReportedBy: data.filterReportedBy || "" }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [closeFilterDrawer, handleSetTableData]);
  const onClearFilters = useCallback(() => { setFilterCriteria({}); filterFormMethods.reset({ filterStatus: [], filterReportedBy: "" }); handleSetTableData({ query: "", pageIndex: 1 }),dispatch(getBugReportsAction()) }, [filterFormMethods, handleSetTableData]);
  const handleRemoveFilter = useCallback((key: keyof FilterFormData, value: any) => { setFilterCriteria(prev => { const newFilters = { ...prev }; if (key === 'filterStatus') { const currentValues = prev.filterStatus || []; const newValues = currentValues.filter(item => item !== value); newValues.length > 0 ? newFilters.filterStatus = newValues : delete newFilters.filterStatus; } else { delete newFilters[key]; } return newFilters; }); handleSetTableData({ pageIndex: 1 }); }, [handleSetTableData]);
  const handleCardClick = (status?: BugReportStatusApi) => { setFilterCriteria(status ? { filterStatus: [status] } : {}); handleSetTableData({ pageIndex: 1, query: '' }); };
  
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: BugReportItem[] = cloneDeep(bugReportsData);
    if (filterCriteria.filterStatus?.length) {
      const statusValues = new Set(filterCriteria.filterStatus);
      processedData = processedData.filter((item) => statusValues.has(item.status));
    }
    if (filterCriteria.filterReportedBy) {
      const reportedByQuery = filterCriteria.filterReportedBy.toLowerCase().trim();
      processedData = processedData.filter((item) => item.name.toLowerCase().includes(reportedByQuery) || item.email.toLowerCase().includes(reportedByQuery));
    }
    if (tableData.query) {
      const queryLower = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) => item.name.toLowerCase().includes(queryLower) || item.email.toLowerCase().includes(queryLower) || item.report.toLowerCase().includes(queryLower) || (item.mobile_no && item.mobile_no.toLowerCase().includes(queryLower)) || (item.updated_by_name?.toLowerCase() ?? "").includes(queryLower));
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === "created_at" || key === "updated_at") {
          const dateA = a[key as "created_at" | "updated_at"] ? new Date(a[key as "created_at" | "updated_at"]!).getTime() : 0;
          const dateB = b[key as "created_at" | "updated_at"] ? new Date(b[key as "created_at" | "updated_at"]!).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          aVal = (a as any)[key as keyof BugReportItem] ?? "";
          bVal = (b as any)[key as keyof BugReportItem] ?? "";
        }
        return order === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    }
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const totalCount = processedData.length;
    const slicedData = processedData.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
    return {
      pageData: slicedData,
      total: totalCount,
      allFilteredAndSortedData: processedData
    };
  }, [bugReportsData, tableData, filterCriteria]);

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const fileName = `bug-reports_${new Date().toISOString().split("T")[0]}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: "Bug Reports", file_name: fileName })).unwrap(); if (exportBugReportsToCsv(fileName, allFilteredAndSortedData)) { toast.push(<Notification title="Data Exported" type="success">Bug reports data exported successfully.</Notification>); } setIsExportReasonModalOpen(false); } catch (error: any) { toast.push(<Notification title="Operation Failed" type="danger" children={error.message || "Could not complete export."} />); } finally { setIsSubmittingExportReason(false); } };
  const handleRowSelect = useCallback((checked: boolean, row: BugReportItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<BugReportItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => r.id && !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id).filter((id) => id !== undefined)); setSelectedItems((pS) => pS.filter((i) => i.id && !cPRIds.has(i.id))); } }, []);
  
  const baseColumns: ColumnDef<BugReportItem>[] = useMemo(() => [
    { header: "Reported By", accessorKey: "name", size: 180, enableSorting: true, cell: (props) => (<span className="font-semibold">{props.getValue<string>()}</span>) },
    { header: "Contact", accessorKey: "email", size: 200, cell: (props) => (<div><span>{props.row.original.email}</span> <br /><span className="text-xs text-gray-500">{props.row.original.mobile_no}</span></div>) },
    { header: "Reported On", accessorKey: "created_at", size: 200, enableSorting: true, cell: (props) => (<div className="text-xs">{dayjs(props.getValue<string>()).format("DD MMM YYYY, h:mm A")}</div>) },
    { header: "Severity", accessorKey: "severity", size: 120, cell: (props) => (<span>{props.row.original.severity}</span>) },
    { header: "Status", accessorKey: "status", size: 120, enableSorting: true, cell: (props) => { const statusVal = props.getValue<BugReportStatusApi>(); return (<Tag className={classNames("capitalize whitespace-nowrap min-w-[60px] text-center", bugStatusColor[statusVal] || "bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100")}>{statusVal || "N/A"}</Tag>); } },
    { header: "Actions", id: "actions", meta: { HeaderClass: "text-center", cellClass: "text-center" }, size: 100, cell: (props) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} onViewDetail={() => openViewModal(props.row.original)} onAddNotification={() => openNotificationModal(props.row.original)} onAddSchedule={() => openScheduleModal(props.row.original)} />) },
  ], [openEditDrawer, openViewModal, openNotificationModal, openScheduleModal]);

  useEffect(() => { setFilteredColumns(baseColumns) }, [baseColumns]);

  const activeFilterCount = useMemo(() => Object.values(filterCriteria).filter(v => (Array.isArray(v) ? v.length > 0 : !!v)).length, [filterCriteria]);
  
  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormItem label={<div>Name<span className="text-red-500"> *</span></div>} className="md:col-span-1" invalid={!!currentFormMethods.formState.errors.name} errorMessage={currentFormMethods.formState.errors.name?.message}><Controller name="name" control={currentFormMethods.control} render={({ field }) => (<Input {...field} prefix={<TbUserCircle className="text-lg" />} placeholder="Your Name" />)} /></FormItem>
      <FormItem label={<div>Email<span className="text-red-500"> *</span></div>} className="md:col-span-1" invalid={!!currentFormMethods.formState.errors.email} errorMessage={currentFormMethods.formState.errors.email?.message}><Controller name="email" control={currentFormMethods.control} render={({ field }) => (<Input {...field} type="email" prefix={<TbMail className="text-lg" />} placeholder="your.email@example.com" />)} /></FormItem>
      <FormItem label="Mobile No." className="md:col-span-1" invalid={!!currentFormMethods.formState.errors.mobile_no} errorMessage={currentFormMethods.formState.errors.mobile_no?.message}><Controller name="mobile_no" control={currentFormMethods.control} render={({ field }) => (<Input {...field} type="tel" prefix={<TbPhone className="text-lg" />} placeholder="+XX-XXXXXXXXXX" />)} /></FormItem>
      <FormItem label="Severity" className="md:col-span-1" invalid={!!currentFormMethods.formState.errors.severity} errorMessage={currentFormMethods.formState.errors.severity?.message}><Controller name="severity" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Severity" value={[{ label: "Low", value: "Low" }, { label: "Medium", value: "Medium" }, { label: "High", value: "High" }].find((opt) => opt.value === field.value)} options={[{ label: "Low", value: "Low" }, { label: "Medium", value: "Medium" }, { label: "High", value: "High" }]} onChange={(opt) => field.onChange(opt?.value)} />)} /></FormItem>
      <FormItem label={<div>Status<span className="text-red-500"> *</span></div>} className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message}>
          <Controller name="status" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Status" value={BUG_REPORT_STATUS_OPTIONS.find((opt) => opt.value === field.value)} options={BUG_REPORT_STATUS_OPTIONS} onChange={(opt) => field.onChange(opt?.value)} />)} />
      </FormItem>
      <FormItem label="Report Description" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.report} errorMessage={currentFormMethods.formState.errors.report?.message}><Controller name="report" control={currentFormMethods.control} render={({ field }) => (<Input textArea {...field} rows={6} prefix={<TbFileDescription className="text-lg mt-2.5" />} placeholder="Please describe the bug in detail..." />)} /></FormItem>
      <FormItem label="Attachment" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.attachment} errorMessage={currentFormMethods.formState.errors.attachment?.message as string}><Controller name="attachment" control={currentFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) => (<Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e) => { const file = e.target.files?.[0]; onChange(file); setSelectedFile(file || null); }} prefix={<TbPaperclip className="text-lg" />} />)} />{editingItem?.attachment && !selectedFile && (<div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Current:{" "}<a href={itemPath(editingItem.attachment)} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{editingItem.attachment}</a></div>)}</FormItem>
    </div>
  );

  const renderViewDetails = (item: BugReportItem) => (
    <div className="p-1 space-y-5">
      <div className="flex items-center justify-between"><div className="flex items-start"><TbInfoCircle className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" /><div><h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Status</h6><Tag className={classNames("capitalize text-sm", bugStatusColor[item.status] || "bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100")}>{item.status}</Tag></div></div><Dropdown renderTitle={<Button size="xs" variant="twoTone" disabled={isChangingStatus}>Change Status</Button>}>{BUG_REPORT_STATUS_OPTIONS.map(opt => (<Dropdown.Item key={opt.value} onClick={() => handleChangeStatus(item, opt.value)}>Mark as {opt.label}</Dropdown.Item>))}</Dropdown></div>
      <div className="flex items-start"><TbUserCircle className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" /><div><h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Name</h6><p className="text-gray-800 dark:text-gray-100 text-base">{item.name}</p></div></div>
      <div className="flex items-start"><TbMail className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" /><div><h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email</h6><p className="text-gray-800 dark:text-gray-100 text-base">{item.email}</p></div></div>
      {item.mobile_no && (<div className="flex items-start"><TbPhone className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" /><div><h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Mobile No.</h6><p className="text-gray-800 dark:text-gray-100 text-base">{item.mobile_no}</p></div></div>)}
      <div className="flex items-start"><TbFileDescription className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" /><div><h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Report Description</h6><p className="text-gray-800 dark:text-gray-100 text-base whitespace-pre-wrap">{item.report}</p></div></div>
      {item.attachment && (<div className="flex items-start"><TbPaperclip className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" /><div><h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Attachment</h6><a href={itemPath(item.attachment)} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all text-base">{item.attachment}</a></div></div>)}
      {item.created_at && (<div className="flex items-start"><TbCalendarEvent className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" /><div><h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Reported On</h6><p className="text-gray-800 dark:text-gray-100 text-base">{new Date(item.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}</p></div></div>)}
    </div>
  );
  
  const tableLoading = masterLoadingStatus === "pending" || isSubmitting || isDeleting || isChangingStatus;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"><h5 className="mb-2 sm:mb-0">Bug Reports</h5><Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>Add New</Button></div>
         <div className="grid grid-cols-5 gap-2 w-full sm:w-auto mb-4 gap-4">
            <Tooltip title="View All Reports (Clear Filters)"><div className="cursor-pointer" onClick={() => handleCardClick()}><Card bodyClass="flex gap-2 p-2 hover:shadow-lg transition-shadow" className="rounded-md border border-blue-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbBug size={24} /></div><div><h6 className="text-blue-500">{rawBugReportsData?.counts?.total ?? "..."}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Filter by Status: New"><div className="cursor-pointer" onClick={() => handleCardClick("New")}><Card bodyClass="flex gap-2 p-2 hover:shadow-lg transition-shadow" className="rounded-md border border-pink-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbMailPlus size={24} /></div><div><h6 className="text-pink-500">{rawBugReportsData?.counts?.new ?? "..."}</h6><span className="font-semibold text-xs">New</span></div></Card></div></Tooltip>
            <Tooltip title="Filter by Status: Under Review"><div className="cursor-pointer" onClick={() => handleCardClick("Under Review")}><Card bodyClass="flex gap-2 p-2 hover:shadow-lg transition-shadow" className="rounded-md border border-orange-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbLoader size={24} /></div><div><h6 className="text-orange-500">{rawBugReportsData?.counts?.under_review ?? "..."}</h6><span className="font-semibold text-xs">Under Review</span></div></Card></div></Tooltip>
            <Tooltip title="Filter by Status: Resolved"><div className="cursor-pointer" onClick={() => handleCardClick("Resolved")}><Card bodyClass="flex gap-2 p-2 hover:shadow-lg transition-shadow" className="rounded-md border border-green-300"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbCircleCheck size={24} /></div><div><h6 className="text-green-500">{rawBugReportsData?.counts?.resolved ?? "..."}</h6><span className="font-semibold text-xs">Resolved</span></div></Card></div></Tooltip>
            <Tooltip title="Filter by Status: Unresolved"><div className="cursor-pointer" onClick={() => handleCardClick("Unresolved")}><Card bodyClass="flex gap-2 p-2 hover:shadow-lg transition-shadow" className="rounded-md border border-red-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCircleX size={24} /></div><div><h6 className="text-red-500">{rawBugReportsData?.counts?.unresolved ?? "..."}</h6><span className="font-semibold text-xs">Unresolved</span></div></Card></div></Tooltip>
          </div>
          <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onClearFilters={onClearFilters} searchVal={tableData.query as string} columns={baseColumns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          {(activeFilterCount > 0 || tableData.query) && <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">Found <strong>{total}</strong> matching report(s).</div>}
          <div className="mt-4"><DataTable columns={filteredColumns} noData={!tableLoading && pageData.length === 0} data={pageData} loading={tableLoading} pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectable checkboxChecked={(row: BugReportItem) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} /></div>
        </AdaptiveCard>
      </Container>
      <BugReportsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <Drawer title={editingItem ? "Edit Bug Report" : "Report New Bug"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} width={520} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button><Button size="sm" variant="solid" form="bugReportForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? editingItem ? "Saving..." : "Submitting..." : editingItem ? "Save" : "Submit"}</Button></div>}>
        <Form id="bugReportForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-4 relative pb-28">{renderDrawerForm(formMethods)}</Form>
      </Drawer>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterBugReportForm" type="submit">Apply</Button></div>}>
        <Form id="filterBugReportForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Status" options={BUG_REPORT_STATUS_OPTIONS} value={field.value?.map(v => ({ value: v, label: v })) || []} onChange={(val) => field.onChange(val.map(v => v.value) || [])} />)} /></FormItem>
          <FormItem label="Reported By (Name/Email)"><Controller name="filterReportedBy" control={filterFormMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter name or email to filter" />)} /></FormItem>
        </Form>
      </Drawer>
      <Dialog isOpen={isViewModalOpen} onClose={closeViewModal} onRequestClose={closeViewModal} width={600}>
        <h5 className="mb-4">Bug Report Details</h5>{viewingItem && renderViewDetails(viewingItem)}<div className="text-right mt-6"><Button variant="solid" onClick={closeViewModal}>Close</Button></div>
      </Dialog>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Bug Report" onClose={() => setSingleDeleteConfirmOpen(false)} onConfirm={onConfirmSingleDelete} loading={isDeleting} confirmButtonColor="red-600"><p>Are you sure you want to delete the report by "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p></ConfirmDialog>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Exporting Bug Reports" onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}><Form id="exportBugReportsReasonForm" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 mt-2"><FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form></ConfirmDialog>
      {isNotificationModalOpen && notificationItem && (<BugReportNotificationDialog bugReport={notificationItem} onClose={closeNotificationModal} getAllUserDataOptions={getAllUserDataOptions} />)}
      {isScheduleModalOpen && scheduleItem && (<BugReportScheduleDialog bugReport={scheduleItem} onClose={closeScheduleModal} />)}
    </>
  );
};

export default BugReportListing;