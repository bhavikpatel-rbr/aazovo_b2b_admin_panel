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
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx'; // <-- ADD THIS IMPORT
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
  Form,
  FormItem,
  Input,
  Spinner,
  Table,
  Tag,
  Tooltip,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import Td from "@/components/ui/Table/Td";
import Tr from "@/components/ui/Table/Tr";
import toast from "@/components/ui/toast";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbAlarm, TbBell, TbBellRinging, TbBrandWhatsapp, TbCalendarEvent, TbCalendarTime, TbChecks, TbCloudUpload, TbColumns, TbEye, TbFileSearch, TbFilter, TbInfoCircle, TbMail, TbNotesOff, TbPencil, TbPencilPlus, TbPlus,
  TbReload,
  TbTagStarred, TbUser, TbUserCancel, TbUserCheck, TbUserCircle, TbUserExclamation, TbUsersGroup, TbX
} from "react-icons/tb";

// Types & Utils
import type { TableQueries } from "@/@types/common";
import type { ColumnDef, OnSortParam, Row } from "@/components/shared/DataTable";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addAllActionAction,
  addAllAlertsAction,
  addNotificationAction,
  addScheduleAction,
  addTaskAction,
  deleteAllMemberAction,
  getAlertsAction,
  getAllUsersAction,
  getMemberlistingAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";
import { encryptStorage } from "@/utils/secureLocalStorage";
import dayjs from "dayjs";
import { config } from "localforage";
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
  customer_code: string;
  interested_in: string | null;
  number: string;
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
  whatsapp_country_code: string | null;
  whatsApp_no: string | null;
  alternate_contact_number_code: string | null;
  alternate_contact_number: string | null;
  alternate_email: string | null;
  website: string | null;
  dealing_in_bulk: string | null;
  created_by_user: UserReference | null;
  updated_by_user: UserReference | null;
  category?: string; // ADDED: Used in cell rendering
  subcategory?: string; // ADDED: Used in cell rendering
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
  filterRM: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterMemberType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCreatedAt: z.array(z.date().nullable()).optional().default([]),
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

// --- Alert Note Types & Schema (Added) ---
const alertNoteSchema = z.object({
  newNote: z.string().min(1, "Note cannot be empty"),
});
type AlertNoteFormData = z.infer<typeof alertNoteSchema>;
interface AlertNote {
  id: string | number;
  note: string;
  created_at: string;
  created_by_user?: {
    name: string;
  };
}

// START: Activity Schema
const activitySchema = z.object({
  item: z.string().min(3, "Activity item is required and must be at least 3 characters."),
  notes: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;
// END: Activity Schema

const taskPriorityOptions: SelectOption[] = [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' },];
const eventTypeOptions = [{ value: 'Meeting', label: 'Meeting' }, { value: 'FollowUpCall', label: 'Follow-up Call' }, { value: 'Other', label: 'Other' }, { value: 'IntroCall', label: 'Introductory Call' }, { value: 'QBR', label: 'Quarterly Business Review (QBR)' }, { value: 'CheckIn', label: 'Customer Check-in' }, { value: 'OnboardingSession', label: 'Onboarding Session' }];


// --- START: NEW DATA TRANSFORMATION LOGIC ---
// This function transforms the new API data structure into the `FormItem` format used by the UI components.
// In a real application, this logic would live inside the Redux middleware or slice.
const transformApiData = (apiResponse: any): { status: boolean; message: string; counts: any; data: { data: FormItem[], total: number; pageIndex: number; pageSize: number; } } => {
  const transformedItems = (apiResponse?.data?.data || []).map((apiItem: any): FormItem => ({
    id: apiItem.id,
    name: apiItem.name,
    customer_code: apiItem.customer_code,
    interested_in: apiItem.interested_for,
    number: apiItem.mobile_no,
    email: apiItem.email,
    company_temp: apiItem.company_name_tmp,
    company_actual: apiItem.company_name,
    company_code: apiItem.customer_code_permanent,
    business_type: apiItem.business_type,
    status: apiItem.status as "Active" | "Disabled" | "Unregistered",
    country: apiItem.country,
    continent: apiItem.continent,
    relationship_manager: apiItem.relationship_manager,
    dynamic_member_profiles: apiItem.dynamic_member_profiles || [],
    profile_completion: apiItem.profile_completion,
    business_opportunity: apiItem.business_opportunity,
    member_grade: apiItem.member_grade,
    created_at: apiItem.created_at,
    full_profile_pic: apiItem.full_profile_pic,
    brand_name: apiItem.brand_name,
    whatsapp_country_code: apiItem.phonecode,
    whatsApp_no: apiItem.whatsapp_no,
    alternate_contact_number_code: '', // Not in API response
    alternate_contact_number: apiItem.alt_mobile,
    alternate_email: apiItem.alt_email,
    website: apiItem.website,
    dealing_in_bulk: apiItem.dealing_in_bulk,
    created_by_user: apiItem.created_by_user,
    updated_by_user: apiItem.updated_by_user,
    category: apiItem.category,
    subcategory: apiItem.subcategory,
  }));

  return {
    status: apiResponse.status,
    message: apiResponse.message,
    counts: apiResponse.counts,
    data: {
      data: transformedItems,
      total: apiResponse.data?.total || 0,
      pageIndex: apiResponse.data?.current_page || 1,
      pageSize: apiResponse.data?.per_page || 10,
    }
  };
};

// --- END: NEW DATA TRANSFORMATION LOGIC ---


// --- CSV Exporter Utility ---
function exportToCsv(filename: string, rows: FormItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const CSV_HEADERS = ["Member ID", "Member Code", "Name", "Email", "Contact", "Status", "Company (Temp)", "Company (Actual)", "Business Type", "Business Opportunity", "Member Grade", "Interested In", "Country", "Profile Completion (%)", "Joined Date"];
  const preparedRows = rows.map(row => ({
    id: row.id, customer_code: row.customer_code, name: row.name, email: row.email, contact: `${row.customer_code || ''} ${row.number || ''}`.trim(), status: row.status, company_temp: row.company_temp || 'N/A', company_actual: row.company_actual || 'N/A', business_type: row.business_type || 'N/A', business_opportunity: row.business_opportunity || 'N/A', member_grade: row.member_grade || 'N/A', interested_in: row.interested_in || 'N/A', country: row.country?.name || 'N/A', profile_completion: row.profile_completion, created_at: row.created_at ? dayjs(row.created_at).format('DD MMM YYYY') : 'N/A'
  }));
  const csvContent = [CSV_HEADERS.join(','), ...preparedRows.map(row => CSV_HEADERS.map(header => { const key = header.toLowerCase().replace(/ \(.+\)/, '').replace(/ /g, '_') as keyof typeof row; const cell = row[key] ?? ''; const cellString = String(cell).replace(/"/g, '""'); return `"${cellString}"`; }).join(','))].join('\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); toast.push(<Notification title="Export Successful" type="success">Current page exported to {filename}.</Notification>); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

// --- START: NEW Excel Viewer Modal ---
interface ExcelSheet {
  name: string;
  data: any[][];
}

// --- START: NEW Excel Viewer Modal (UPDATED with better error handling) ---
interface ExcelSheet {
  name: string;
  data: any[][];
}

// --- START: NEW Excel Viewer Modal (UPDATED - Lenient Content-Type) ---
interface ExcelSheet {
  name: string;
  data: any[][];
}

const ExcelViewerModal: React.FC<{ isOpen: boolean; onClose: () => void; fileUrl: string; title: string }> = ({ isOpen, onClose, fileUrl, title }) => {
  const [sheets, setSheets] = useState<ExcelSheet[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadExcelFile = async () => {
        setIsLoading(true);
        setError(null);
        setSheets([]);
        setActiveSheetIndex(0);

        try {
          const response = await fetch(fileUrl);

          if (!response.ok) {
            throw new Error(`Could not find the file at '${fileUrl}'. (HTTP Status: ${response.status}). Please ensure the file is in the 'public' directory and the dev server has been restarted.`);
          }

          // The strict content-type check has been removed.
          // We will now rely on sheetjs to parse the binary data directly.

          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });

          const parsedSheets: ExcelSheet[] = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            // Using { defval: "" } ensures that empty cells are represented as empty strings instead of being omitted.
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            return { name: sheetName, data: jsonData as any[][] };
          });

          if (parsedSheets.length === 0 || workbook.SheetNames.length === 0) {
            throw new Error("The Excel file is empty or could not be parsed. Please check if the file is a valid .xlsx file.");
          }

          setSheets(parsedSheets);
        } catch (err: any) {
          console.error("Error loading or parsing Excel file:", err);
          setError(err.message || "An unknown error occurred while processing the file.");
        } finally {
          setIsLoading(false);
        }
      };

      loadExcelFile();
    }
  }, [isOpen, fileUrl]);

  const activeSheet = sheets[activeSheetIndex];
  const headers = activeSheet?.data[0] || [];
  const bodyRows = activeSheet?.data.slice(1) || [];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      width="95vw"
      height="95vh"
      contentClassName="flex flex-col p-0"
    >
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h5 className="mb-0">{title}</h5>
        <Button shape="circle" variant="plain" icon={<TbX />} onClick={onClose} />
      </div>

      <div className="flex-grow flex flex-col min-h-0">
        {isLoading && (
          <div className="flex-grow flex items-center justify-center">
            <Spinner size="lg" />
            <p className="ml-4">Loading Excel data...</p>
          </div>
        )}

        {error && (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
            <TbFileSearch className="text-6xl text-red-400 mb-4" />
            <h6 className="text-red-500">Error Loading File</h6>
            <p className="max-w-md text-gray-600 dark:text-gray-300">{error}</p>
            <p className="mt-4 text-xs text-gray-400">Please verify the file <code>{fileUrl}</code> in your project's <code>public</code> folder is a valid, uncorrupted Excel file.</p>
          </div>
        )}

        {!isLoading && !error && sheets.length > 0 && (
          <>
            {sheets.length > 1 && (
              <div className="flex-shrink-0 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm mr-2">Sheets:</span>
                  {sheets.map((sheet, index) => (
                    <Button
                      key={sheet.name}
                      size="xs"
                      variant={index === activeSheetIndex ? 'solid' : 'default'}
                      onClick={() => setActiveSheetIndex(index)}
                    >
                      {sheet.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-grow overflow-auto">
              <Table className="min-w-full">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700 z-10">
                  <Tr>
                    {headers.map((header, index) => (
                      <Td key={index} className="font-bold whitespace-nowrap">{header}</Td>
                    ))}
                  </Tr>
                </thead>
                <tbody>
                  {bodyRows.length > 0 ? bodyRows.map((row, rowIndex) => (
                    <Tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      {/* Using headers.length ensures we render a consistent number of cells per row, even if a row has missing data */}
                      {Array.from({ length: headers.length }).map((_, cellIndex) => (
                        <Td key={cellIndex} className="whitespace-nowrap">{row[cellIndex]}</Td>
                      ))}
                    </Tr>
                  )) : (
                    <Tr><Td colSpan={headers.length || 1} className="text-center py-8">No data found in this sheet.</Td></Tr>
                  )}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};
// --- END: NEW Excel Viewer Modal ---
// --- END: NEW Excel Viewer Modal ---
// --- END: NEW Excel Viewer Modal ---

// --- START: MODALS SECTION ---
export type MemberModalType = "notification" | "task" | "calendar" | "viewDetail" | "alert" | "transaction" | "activity";
export interface MemberModalState { isOpen: boolean; type: MemberModalType | null; data: FormItem | null; }

const AddNotificationDialog: React.FC<{ member: FormItem; onClose: () => void; userOptions: SelectOption[] }> = ({ member, onClose, userOptions }) => {
  const dispatch = useAppDispatch(); const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(z.object({ notification_title: z.string().min(3), send_users: z.array(z.number()).min(1), message: z.string().min(10) })), defaultValues: { notification_title: `Regarding Member: ${member.name}`, send_users: [], message: `This is a notification for member "${member.name}" (${member.customer_code}). Please review their details.`, }, mode: 'onChange', });
  const onSend = async (formData: any) => { setIsLoading(true); const payload = { ...formData, module_id: String(member.id), module_name: 'Member' }; try { await dispatch(addNotificationAction(payload)).unwrap(); toast.push(<Notification type="success" title="Notification Sent!" />); onClose(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed" children={error?.message} />); } finally { setIsLoading(false); } };
  return (<Dialog isOpen={true} onClose={onClose}> <h5 className="mb-4">Notify User about: {member.name}</h5> <UiForm onSubmit={handleSubmit(onSend)}> <UiFormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></UiFormItem> <UiFormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter((o) => field.value?.includes(o.value))} onChange={(options) => field.onChange(options?.map((o) => o.value) || [])} />)} /></UiFormItem> <UiFormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></UiFormItem> <div className="text-right mt-6"><Button type="button" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid}>Send</Button></div> </UiForm> </Dialog>);
};

const AssignTaskDialog: React.FC<{ member: FormItem; onClose: () => void; userOptions: SelectOption[] }> = ({ member, onClose, userOptions }) => {
  const dispatch = useAppDispatch(); const [isLoading, setIsLoading] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<TaskFormData>({ resolver: zodResolver(taskValidationSchema), defaultValues: { task_title: `Follow up with ${member.name}`, assign_to: [], priority: 'Medium', }, mode: 'onChange' });
  const onAssignTask = async (data: TaskFormData) => { setIsLoading(true); const payload = { ...data, due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined, module_id: String(member.id), module_name: 'Member', }; try { await dispatch(addTaskAction(payload)).unwrap(); toast.push(<Notification type="success" title="Task Assigned!" />); onClose(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Assign Task" children={error?.message} />); } finally { setIsLoading(false); } };
  return (<Dialog isOpen={true} onClose={onClose}> <h5 className="mb-4">Assign Task for {member.name}</h5> <UiForm onSubmit={handleSubmit(onAssignTask)}> <UiFormItem label="Task Title" invalid={!!errors.task_title} errorMessage={errors.task_title?.message}><Controller name="task_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></UiFormItem> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <UiFormItem label="Assign To" invalid={!!errors.assign_to} errorMessage={errors.assign_to?.message}><Controller name="assign_to" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter(o => field.value?.includes(o.value))} onChange={(opts) => field.onChange(opts?.map(o => o.value) || [])} />)} /></UiFormItem> <UiFormItem label="Priority" invalid={!!errors.priority} errorMessage={errors.priority?.message}><Controller name="priority" control={control} render={({ field }) => (<UiSelect placeholder="Select Priority" options={taskPriorityOptions} value={taskPriorityOptions.find(p => p.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></UiFormItem> </div> <UiFormItem label="Due Date (Optional)" invalid={!!errors.due_date} errorMessage={errors.due_date?.message}><Controller name="due_date" control={control} render={({ field }) =>
    <DatePicker minDate={today} placeholder="Select date" value={field.value} onChange={field.onChange} />} />
  </UiFormItem> <UiFormItem label="Description" invalid={!!errors.description} errorMessage={errors.description?.message}><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></UiFormItem> <div className="text-right mt-6"><Button type="button" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid}>Assign Task</Button></div> </UiForm> </Dialog>);
};

const AddScheduleDialog: React.FC<{ member: FormItem; onClose: () => void; onSubmit: (data: ScheduleFormData) => void; isLoading: boolean; }> = ({ member, onClose, onSubmit, isLoading }) => {
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { event_title: `Meeting with ${member.name}`, date_time: null as any, notes: `Regarding member ${member.name} (ID: ${member.id}).`, remind_from: null, event_type: undefined },
    mode: "onChange",
  });

  return (
    <Dialog isOpen={true} onClose={onClose}>
      <h5 className="mb-4">Add Schedule for {member.name}</h5>
      <UiForm onSubmit={handleSubmit(onSubmit)}>
        <UiFormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}>
          <Controller name="event_title" control={control} render={({ field }) => <Input {...field} autoFocus />} />
        </UiFormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiFormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}>
            <Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} />
          </UiFormItem>
          <UiFormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}>
            <Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date & time" value={field.value} onChange={field.onChange} />)} />
          </UiFormItem>
        </div>
        <UiFormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}>
          <Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select reminder date & time" value={field.value} onChange={field.onChange} />)} />
        </UiFormItem>
        <UiFormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}>
          <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} value={field.value ?? ""} />} />
        </UiFormItem>
        <div className="text-right mt-6">
          <Button type="button" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid}>Save Event</Button>
        </div>
      </UiForm>
    </Dialog>
  );
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
            {renderDetailItem("Member Code", getDisplayValue(member.customer_code))}
            {renderDetailItem("Name", getDisplayValue(member.name))}
            {renderDetailItem("Status", <Tag className="capitalize">{getDisplayValue(member.status)}</Tag>)}
            {renderDetailItem("Joined Date", formatDate(member.created_at))}
            {renderDetailItem("Profile Completion", `${getDisplayValue(member.profile_completion, 0)}%`)}
          </div>
        </Card>
        <Card className="mb-4" bordered>
          <h6 className="mb-2 font-semibold">Contact Information</h6>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
            {renderDetailItem("Primary Number", `${getDisplayValue(member.customer_code)} ${getDisplayValue(member.number)}`)}
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

const AddActivityDialog: React.FC<{ member: FormItem; onClose: () => void; user: any; }> = ({ member, onClose, user }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: { item: `Follow up with ${member.name}`, notes: '' },
    mode: 'onChange',
  });

  const onAddActivity = async (data: ActivityFormData) => {
    setIsLoading(true);
    const payload = {
      item: data.item,
      notes: data.notes || '',
      module_id: String(member.id),
      module_name: 'Member',
      user_id: user.id,
    };
    try {
      await dispatch(addAllActionAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Activity Added" />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Failed to Add Activity" children={error?.message || 'An unknown error occurred.'} />);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Activity Log for "{member.name}"</h5>
      <Form onSubmit={handleSubmit(onAddActivity)}>
        <FormItem label="Activity" invalid={!!errors.item} errorMessage={errors.item?.message}>
          <Controller name="item" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Followed up with member" />} />
        </FormItem>
        <FormItem label="Notes (Optional)" invalid={!!errors.notes} errorMessage={errors.notes?.message}>
          <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} placeholder="Add relevant details..." />} />
        </FormItem>
        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Activity</Button>
        </div>
      </Form>
    </Dialog>
  );
};

const MemberAlertModal: React.FC<{ member: FormItem; onClose: () => void }> = ({ member, onClose }) => {
  const [alerts, setAlerts] = useState<AlertNote[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const { control, handleSubmit, formState: { errors, isValid }, reset } = useForm<AlertNoteFormData>({
    resolver: zodResolver(alertNoteSchema),
    defaultValues: { newNote: '' },
    mode: 'onChange'
  });

  const stringToColor = (str: string) => {
    let hash = 0;
    if (!str) return '#cccccc';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  const fetchAlerts = useCallback(() => {
    setIsFetching(true);
    dispatch(getAlertsAction({ module_id: member.id, module_name: 'Member' }))
      .unwrap()
      .then((data) => setAlerts(data.data || []))
      .catch(() => toast.push(<Notification type="danger" title="Failed to fetch alerts." />))
      .finally(() => setIsFetching(false));
  }, [member.id, dispatch]);

  useEffect(() => {
    fetchAlerts();
    reset({ newNote: '' });
  }, [fetchAlerts, reset]);

  const onAddNote = async (data: AlertNoteFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(addAllAlertsAction({ note: data.newNote, module_id: member.id, module_name: 'Member' })).unwrap();
      toast.push(<Notification type="success" title="Alert Note Added" />);
      reset({ newNote: '' });
      fetchAlerts(); // Re-fetch alerts to show the new one
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Failed to Add Note" children={error?.message} />);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={1200}
      contentClassName="p-0 flex flex-col max-h-[90vh] h-full bg-gray-50 dark:bg-gray-900 rounded-lg"
    >
      {/* --- Header --- */}
      <header className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 flex-shrink-0 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TbBellRinging className="text-2xl text-white" />
            <h5 className="mb-0 text-white font-bold text-base sm:text-xl">{member.name}</h5>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
            <TbX className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* --- Main Content: Grid for two columns --- */}
      <main className="flex-grow min-h-0 p-4 sm:p-6 lg:grid lg:grid-cols-2 lg:gap-x-8 overflow-hidden">

        {/* --- Left Column: Activity Timeline (This column scrolls internally) --- */}
        <div className="relative flex flex-col h-full overflow-hidden">
          <h6 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
            Activity Timeline
          </h6>

          {/* The scrollable container for the timeline */}
          <div className="flex-grow overflow-y-auto lg:pr-4 lg:-mr-4">
            {isFetching ? (
              <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>
            ) : alerts.length > 0 ? (
              <div className="space-y-8">
                {alerts.map((alert, index) => {
                  const userName = alert?.created_by_user?.name || 'N/A';
                  const userInitial = userName.charAt(0).toUpperCase();
                  return (
                    <div key={`${alert.id}-${index}`} className="relative flex items-start gap-4 pl-12">
                      <div className="absolute left-0 top-0 z-10 flex flex-col items-center h-full">
                        <Avatar shape="circle" size="md" style={{ backgroundColor: stringToColor(userName) }}>
                          {userInitial}
                        </Avatar>
                        {index < alerts.length - 1 && (
                          <div className="mt-2 flex-grow w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                        )}
                      </div>
                      <Card className="flex-grow shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="p-4">
                          <header className="flex justify-between items-center mb-2">
                            <p className="font-bold text-gray-800 dark:text-gray-100">{userName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <TbCalendarTime />
                              <span>{dayjs(alert.created_at).format('DD MMM YYYY, h:mm A')}</span>
                            </div>
                          </header>
                          <div
                            className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300"
                            dangerouslySetInnerHTML={{ __html: alert.note }}
                          />
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-center py-10 bg-white dark:bg-gray-800/50 rounded-lg">
                <TbNotesOff className="text-6xl text-gray-300 dark:text-gray-500 mb-4" />
                <p className="text-xl font-semibold text-gray-600 dark:text-gray-300">No Activity Yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Be the first to add a note.</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Right Column: Add New Note (Stays in place) --- */}
        <div className="flex flex-col mt-8 lg:mt-0 h-full">
          <Card className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
            <header className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-t-lg border-b dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <TbPencilPlus className="text-xl text-blue-600 dark:text-blue-400" />
                <h6 className="font-semibold text-gray-800 dark:text-gray-200 mb-0">Add New Note</h6>
              </div>
            </header>
            <Form onSubmit={handleSubmit(onAddNote)} className="p-4 flex-grow flex flex-col">
              <FormItem invalid={!!errors.newNote} errorMessage={errors.newNote?.message} className="flex-grow flex flex-col">
                <Controller
                  name="newNote"
                  control={control}
                  render={({ field }) => (
                    <div className="border dark:border-gray-700 rounded-md flex-grow flex flex-col">
                      <RichTextEditor
                        {...field}
                        onChange={(val) => field.onChange(val.html)}
                        className="flex-grow min-h-[150px] sm:min-h-[200px]"
                      />
                    </div>
                  )}
                />
              </FormItem>
              <footer className="flex items-center justify-end mt-4 pt-4 border-t dark:border-gray-700 flex-shrink-0">
                <Button type="button" className="mr-3" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button variant="solid" color="blue" type="submit" loading={isSubmitting} disabled={!isValid || isSubmitting}>Submit Note</Button>
              </footer>
            </Form>
          </Card>
        </div>
      </main>
    </Dialog>
  );
};

const MemberModals: React.FC<{ modalState: MemberModalState; onClose: () => void; userOptions: SelectOption[]; }> = ({ modalState, onClose, userOptions }) => {
  const { type, data: member, isOpen } = modalState;
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { useEncryptApplicationStorage } = config;
  useEffect(() => {
    const getUserData = () => {
      try {
        return encryptStorage.getItem("UserData", !useEncryptApplicationStorage);
      } catch (error) {
        console.error("Error getting UserData:", error);
        return null;
      }
    };
    setUserData(getUserData());
  }, []);

  const handleConfirmSchedule = async (data: ScheduleFormData) => {
    if (!member) return;
    setIsSubmitting(true);
    const payload = {
      module_id: Number(member.id),
      module_name: "Member",
      event_title: data.event_title,
      event_type: data.event_type,
      date_time: dayjs(data.date_time).format("YYYY-MM-DDTHH:mm:ss"),
      ...(data.remind_from && { remind_from: dayjs(data.remind_from).format("YYYY-MM-DDTHH:mm:ss") }),
      notes: data.notes || ""
    };
    try {
      await dispatch(addScheduleAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Event Scheduled" />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message} />);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !member) return null;

  switch (type) {
    case "calendar": return <AddScheduleDialog member={member} onClose={onClose} onSubmit={handleConfirmSchedule} isLoading={isSubmitting} />;
    case "task": return <AssignTaskDialog member={member} onClose={onClose} userOptions={userOptions} />;
    case "notification": return <AddNotificationDialog member={member} onClose={onClose} userOptions={userOptions} />;
    case "viewDetail": return <ViewMemberDetailDialog member={member} onClose={onClose} />;
    case "alert": return <MemberAlertModal member={member} onClose={onClose} />;
    case "transaction": return <GenericInfoDialog title={`Transactions for ${member.name}`} onClose={onClose} />;
    case "activity": return <AddActivityDialog member={member} onClose={onClose} user={userData} />;
    default: return null;
  }
};
// --- END: MODALS SECTION ---

const statusColor: Record<string, string> = {
  active: "border border-emerald-200 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  disabled: "border border-red-300 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
  unregistered: "border border-orange-300 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300"
};

const MemberListContext = createContext<{ memberList: FormItem[]; selectedMembers: FormItem[]; setSelectedMembers: React.Dispatch<React.SetStateAction<FormItem[]>>; userOptions: SelectOption[]; } | undefined>(undefined);
const useMemberList = () => { const context = useContext(MemberListContext); if (!context) throw new Error("useMemberList must be used within a MemberListProvider"); return context; };

// MODIFIED: This provider no longer fetches data. It only provides state from Redux.
const MemberListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { MemberlistData: MemberData, getAllUserData } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const [selectedMembers, setSelectedMembers] = useState<FormItem[]>([]);

  // Fetch users list once for dropdowns in modals
  useEffect(() => {
    dispatch(getAllUsersAction());
  }, [dispatch]);

  // The member list is now the paginated data from the store
  const memberList = useMemo(() => MemberData?.data?.data || [], [MemberData]);



  const userOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((u: any) => ({ value: u.id, label: `(${u.employee_id}) - ${u.name || 'N/A'}` })) : [], [getAllUserData]);

  return (<MemberListContext.Provider value={{ memberList, setSelectedMembers, selectedMembers, userOptions }}>{children}</MemberListContext.Provider>);
};

const ActionColumn = ({ rowData, onOpenModal }: { rowData: FormItem; onOpenModal: (type: MemberModalType, data: FormItem) => void; }) => {
  const navigate = useNavigate();

  const handleSendEmail = (member: FormItem) => {
    if (!member.email) {
      toast.push(<Notification type="warning" title="Missing Email" children="Primary email is not available." />);
      return;
    }
    window.open(`mailto:${member.email}`);
  };

  const handleSendWhatsapp = (member: FormItem) => {
    if (!member.number) {
      toast.push(<Notification type="warning" title="Missing Number" children="Primary contact number is not available." />);
      return;
    }
    const fullNumber = (member.customer_code || '').replace(/\D/g, '') + member.number.replace(/\D/g, '');
    window.open(`https://wa.me/${fullNumber}`, '_blank');
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600" role="button" onClick={() => navigate(`/business-entities/member-edit/${rowData.id}`)}><TbPencil /></div></Tooltip>
      <Tooltip title="View Page"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600" role="button" onClick={() => navigate(`/business-entities/member-view/${rowData.id}`)}><TbEye /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item onClick={() => handleSendEmail(rowData)} className="flex items-center gap-2"><TbMail /> Send Email</Dropdown.Item>
        <Dropdown.Item onClick={() => handleSendWhatsapp(rowData)} className="flex items-center gap-2"><TbBrandWhatsapp /> Send WhatsApp</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"><TbBell /> Add Notification</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("task", rowData)} className="flex items-center gap-2"><TbUser /> Assign Task</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("calendar", rowData)} className="flex items-center gap-2"><TbCalendarEvent /> Add Schedule</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("alert", rowData)} className="flex items-center gap-2"><TbAlarm /> View Alert</Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("activity", rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /> Add Activity</Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: FilterFormData; onRemoveFilter: (key: keyof FilterFormData, value: string) => void; onClearAll: () => void; }) => {
  const filterKeyToLabelMap: Record<string, string> = { filterStatus: "Status", filterBusinessType: "Business Type", filterBusinessOpportunity: "Opportunity", filterCountry: "Country", filterInterestedFor: "Interest", memberGrade: "Grade", filterRM: "RM", filterMemberType: "Member Type" };
  const activeFiltersList = Object.entries(filterData).flatMap(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return [];
    if (key === 'filterCreatedAt') {
      const dateArray = value as [Date | null, Date | null];
      if (dateArray[0] && dateArray[1]) {
        return [{ key, value: 'date-range', label: `Created: ${dateArray[0].toLocaleDateString()} - ${dateArray[1].toLocaleDateString()}` }];
      }
      return [];
    }
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

// MODIFIED: This component is heavily refactored for server-side operations.
const FormListTable = ({ filterCriteria, setFilterCriteria }: { filterCriteria: FilterFormData; setFilterCriteria: React.Dispatch<React.SetStateAction<FilterFormData>>; }) => {
  const dispatch = useAppDispatch();
  const { MemberlistData: MemberData } = useSelector(masterSelector);
  const [isLoading, setIsLoading] = useState(false);
  const { setSelectedMembers, userOptions } = useMemberList();

  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [modalState, setModalState] = useState<MemberModalState>({ isOpen: false, type: null, data: null });

  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

  useEffect(() => { filterFormMethods.reset(filterCriteria); }, [filterCriteria, filterFormMethods]);

  useEffect(() => {
    setIsLoading(true);
    const timerId = setTimeout(() => {
      const fetchMembers = () => {
        const formatFilterForApi = (data: any[] | undefined) => {
          if (!data || data.length === 0) return undefined;
          return data.map((d: { value: any }) => d.value).join(',');
        };

        const [startDate, endDate] = filterCriteria.filterCreatedAt || [null, null];

        const params: any = {
          page: tableData.pageIndex,
          per_page: tableData.pageSize,
          search: tableData.query || undefined,
          sort_key: tableData.sort.key || undefined,
          sort_order: tableData.sort.order || undefined,
          status: formatFilterForApi(filterCriteria.filterStatus),
          business_type: formatFilterForApi(filterCriteria.filterBusinessType),
          country: formatFilterForApi(filterCriteria.filterCountry),
          business_opportunity: formatFilterForApi(filterCriteria.filterBusinessOpportunity),
          interested_in: formatFilterForApi(filterCriteria.filterInterestedFor),
          grade: formatFilterForApi(filterCriteria.memberGrade),
          relationship_manager: formatFilterForApi(filterCriteria.filterRM),
          member_type: formatFilterForApi(filterCriteria.filterMemberType),
          created_date: (startDate && endDate) ? `${dayjs(startDate).format('YYYY-MM-DD')} ~ ${dayjs(endDate).format('YYYY-MM-DD')}` : undefined,
        };

        // Clean up undefined params before dispatching
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        setIsLoading(true);
        dispatch(getMemberlistingAction(params));
      };
      fetchMembers();
    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, [dispatch, tableData, filterCriteria]);
  useEffect(() => { if (MemberData?.data?.data) setIsLoading(false) }, [MemberData]);
  const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria(data); setTableData(prev => ({ ...prev, pageIndex: 1 })); setFilterDrawerOpen(false); };

  const onClearFilters = useCallback(() => {
    setFilterCriteria({});
    filterFormMethods.reset({});
    setTableData((prev) => ({ ...prev, query: '', pageIndex: 1, sort: { order: '', key: '' } }));
    sessionStorage.removeItem('memberFilterState');
  }, [setFilterCriteria, filterFormMethods]);

  const handleRemoveFilter = (key: keyof FilterFormData, valueToRemove: string) => {
    setFilterCriteria(prev => {
      const newCriteria = { ...prev };
      if (key === 'filterCreatedAt') {
        (newCriteria as any)[key] = [];
      } else {
        const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined;
        if (currentFilterArray) (newCriteria as any)[key] = currentFilterArray.filter(item => item.value !== valueToRemove);
      }
      return newCriteria;
    });
    setTableData(prev => ({ ...prev, pageIndex: 1 }));
  };

  const onRefreshData = () => { onClearFilters(); }; // Clearing filters will trigger a re-fetch

  // Data for the table is now directly from the Redux store
  const pageData = useMemo(() => MemberData?.data?.data || [], [MemberData]);
  const total = useMemo(() => MemberData?.data?.total || 0, [MemberData]);
  const navigate = useNavigate();

  const columns: ColumnDef<FormItem>[] = useMemo(() => [

    {
      header: "Member", accessorKey: "name", id: "member", size: 200, cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {/* <Avatar src={row.original.full_profile_pic || undefined} shape="circle" size="sm" icon={<TbUserCircle />} /> */}
            <Link
              to={
                `/business-entities/member-view/${row.original.id}`
              }
              className="text-xs">
              <b className="text-xs text-blue-500"><em>{row.original.customer_code}</em></b> <br />
              <b className="text-sm">{row.original.name}</b>
            </Link>
          </div>
          <div className="text-xs text-gray-500 ">
            <div>{row.original.number_code}{row.original.number}</div>
            <div>{row.original.email}</div>
            <div>{row.original.country?.name}</div>
          </div>
        </div>
      )
    },
    {
      header: "Company", accessorKey: 'company_actual', id: "company", size: 200, cell: ({ row }) => {

        const { company_actual, company_temp, company_code, } = row.original;

        return (
          <div className="text-xs">
            {company_actual && <div className="font-semibold text-emerald-600 dark:text-emerald-400">
              <b>Actual: </b>{company_code} | {company_actual}
            </div>}
            <div className="font-semibold text-amber-600 dark:text-amber-400">
              <b>Temp: </b>{company_temp || "N/A"}
            </div>
          </div>
        );
      }
    },
    {
      header: "Status", accessorKey: "status", id: "status", size: 140, cell: ({ row }) => (
        <div className="flex flex-col text-xs">
          <Tag className={`${statusColor[row.original.status.toLowerCase()] || ''} inline capitalize`}>{row.original.status}</Tag>
          <div className="text-[10px] text-gray-500 mt-1">Joined: {formatCustomDateTime(row.original.created_at)}</div>
        </div>
      )
    },
    {
      header: "Profile", accessorKey: "profile_completion", id: "profile", size: 220, cell: ({ row }) => (
        <div className="text-xs flex flex-col gap-0.5">
          <span><b>RM: </b>{row.original.relationship_manager?.name || "N/A"}</span>
          <span><b>Grade: </b>{row.original.member_grade || "N/A"}</span>

          <span className="truncate"><b>Opportunity: </b>{row.original.business_opportunity || "N/A"}</span>
          <span><b></b>{row.original.category || "N/A"} / {row.original.subcategory || "N/A"}  </span>
          <Tooltip title={`Profile: ${row.original.profile_completion}%`}>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${row.original.profile_completion}%` }}></div></div>
          </Tooltip>
        </div>
      )
    },
    {
      header: "Preferences", accessorKey: 'interested_in', id: "preferences", size: 250, cell: ({ row }) => {
        const [isOpen, setIsOpen] = useState(false);
        const { dynamic_member_profiles, brand_name, business_type, interested_in } = row.original;
        const brandDisplay = (dynamic_member_profiles?.[0]?.brand_names?.[0]) ? dynamic_member_profiles[0].brand_names.join(', ') : (brand_name || "N/A");

        return (
          <div className="flex flex-col gap-1 text-xs">
            <span><b>Business Type: </b>{business_type || 'N/A'}</span>
            <span className="flex items-center gap-1 truncate">
              <Tooltip title="View Dynamic Profiles"><TbInfoCircle size={16} className="text-blue-500 cursor-pointer flex-shrink-0" onClick={() => setIsOpen(true)} /></Tooltip>
              <b>View Dynamic Profiles</b>
            </span>
            <span><b>Interested: </b>{interested_in || 'N/A'}</span>
            <Dialog width={620} isOpen={isOpen} onClose={() => setIsOpen(false)}>
              <h6>Dynamic Profiles for {row.original.name}</h6>
              <Table className="mt-4">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <Tr><Td>Member Type</Td><Td>Brands</Td><Td>Sub Categories</Td></Tr>
                </thead>
                <tbody>
                  {dynamic_member_profiles?.length > 0 ? (
                    dynamic_member_profiles.map(p => (
                      <Tr key={p.id}><Td>{p.member_type?.name || 'N/A'}</Td><Td>{p.brand_names?.join(', ') || 'N/A'}</Td><Td>{p.sub_category_names?.join(', ') || 'N/A'}</Td></Tr>
                    ))
                  ) : <Tr><Td colSpan={4} className="text-center">No dynamic profiles available.</Td></Tr>}
                </tbody>
              </Table>
            </Dialog>
          </div>
        );
      }
    },
    { header: "Actions", id: "action", size: 120, meta: { HeaderClass: "text-center" }, cell: props => <ActionColumn rowData={props.row.original} onOpenModal={(type, data) => setModalState({ isOpen: true, type, data })} /> },
  ], []);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<FormItem>[]>(columns);
  useEffect(() => setFilteredColumns(columns), [columns]);

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

  const activeFilterCount = useMemo(() => {
    return Object.values(filterCriteria).reduce((count, value) => {
      const criteriaValue = Array.isArray(value) ? value.filter(v => v !== null && v !== undefined) : value;
      if (Array.isArray(criteriaValue) && criteriaValue.length > 0) return count + 1;
      return count;
    }, 0);
  }, [filterCriteria]);


  const handleOpenExportReasonModal = () => { if (total === 0) { toast.push(<Notification title="No Data To Export" type="info" />); return; } exportReasonFormMethods.reset(); setIsExportReasonModalOpen(true); };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const fileName = `members_export_${dayjs().format('YYYYMMDD')}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Member', file_name: fileName, filters: filterCriteria })).unwrap();
      exportToCsv(fileName, pageData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) { toast.push(<Notification title="Submission Failed" type="danger" children={error.message} />); } finally { setIsSubmittingExportReason(false); }
  };

  const handleSetTableData = (d: Partial<TableQueries>) => setTableData(p => ({ ...p, ...d }));
  const handlePaginationChange = (p: number) => handleSetTableData({ pageIndex: p });
  const handleSelectChange = (v: number) => handleSetTableData({ pageSize: v, pageIndex: 1 });
  const handleSort = (s: OnSortParam) => handleSetTableData({ sort: s, pageIndex: 1 });
  const handleRowSelect = (c: boolean, r: FormItem) => setSelectedMembers(p => c ? [...p, r] : p.filter(i => i.id !== r.id));
  const handleAllRowSelect = (c: boolean, r: Row<FormItem>[]) => setSelectedMembers(c ? r.map(i => i.original) : []);

  const { businessTypeOptions, businessOpportunityOptions, memberGradeOptions, countryOptions, rmOptions, memberTypeOptions } = useMemo(() => {
    const unique = (arr: (string | null | undefined)[]) => [...new Set(arr.filter(Boolean))].map(item => ({ value: item as string, label: item as string }));
    return {
      businessTypeOptions: unique(pageData.map(f => f.business_type)),
      businessOpportunityOptions: unique(pageData.flatMap(f => f.business_opportunity?.split(',').map(s => s.trim()))),
      memberGradeOptions: unique(pageData.map(f => f.member_grade)),
      countryOptions: unique(pageData.map(f => f.country?.name)),
      rmOptions: unique(pageData.map(f => f.relationship_manager?.name)),
      memberTypeOptions: unique(pageData.flatMap(f => f.dynamic_member_profiles.map(p => p.member_type?.name))),
    }
  }, [pageData]);


  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <DebouceInput value={tableData.query} placeholder="Quick Search..." onChange={e => handleSetTableData({ query: e.target.value, pageIndex: 1 })} />
        <div className="flex gap-2">
          <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
            <div className="flex flex-col p-2">
              <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
              {columns.map((col) => {
                const id = col.id || col.accessorKey as string;
                if (!col.header || id === 'action') return null;
                return (
                  <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2">
                    <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>
                      {col.header as string}
                    </Checkbox>
                  </div>
                );
              })}
            </div>
          </Dropdown>
          <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onRefreshData} /></Tooltip>
          <Button icon={<TbFilter />} onClick={() => setFilterDrawerOpen(true)}>Filter{activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
          <Button isExport={true} menuName="member"
            icon={<TbCloudUpload />} onClick={handleOpenExportReasonModal} disabled={total === 0}>Export</Button>
        </div>
      </div>
      <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
      <DataTable menuName="member" selectable columns={filteredColumns} data={pageData} noData={!isLoading && pageData.length === 0} loading={isLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} />
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} width={500} onClose={() => setFilterDrawerOpen(false)} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterMemberForm" type="submit">Apply</Button></div>}>
        <UiForm id="filterMemberForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <UiFormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={[{ value: "Active", label: "Active" }, { value: "Disabled", label: "Disabled" }, { value: "Unregistered", label: "Unregistered" }]} {...field} />)} /></UiFormItem>
            <UiFormItem label="Business Type"><Controller name="filterBusinessType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Type" options={businessTypeOptions} {...field} />)} /></UiFormItem>
            <UiFormItem label="Business Opportunity"><Controller name="filterBusinessOpportunity" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Opportunity" options={businessOpportunityOptions} {...field} />)} /></UiFormItem>
            <UiFormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Country" options={countryOptions} {...field} />)} /></UiFormItem>
            <UiFormItem label="Interested In"><Controller name="filterInterestedFor" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Interest" options={[{ value: "For Sell", label: "For Sell" }, { value: "For Buy", label: "For Buy" }, { value: "Both", label: "Both" }]} {...field} />)} /></UiFormItem>
            <UiFormItem label="Grade"><Controller name="memberGrade" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Grade" options={memberGradeOptions} {...field} />)} /></UiFormItem>
            <UiFormItem label="Relationship Manager"><Controller name="filterRM" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select RM" options={rmOptions} {...field} />)} /></UiFormItem>
            <UiFormItem label="Member Type"><Controller name="filterMemberType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Member Type" options={memberTypeOptions} {...field} />)} /></UiFormItem>
            <UiFormItem label="Created Date" className="col-span-2"><Controller name="filterCreatedAt" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange placeholder="Select Date Range" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />)} /></UiFormItem>
          </div>
        </UiForm>
      </Drawer>
      <MemberModals modalState={modalState} onClose={() => setModalState({ isOpen: false, type: null, data: null })} userOptions={userOptions} />
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText="Submit & Export" >
        <p className="mb-2">You are about to export the currently visible page of members. For a full report, please contact an administrator.</p>
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
      dispatch(getMemberlistingAction({ page: 1, per_page: 20 })); // Re-fetch the first page after deletion
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

// MODIFIED: Main component updated to handle persisted filters and read counts from API.
const Member = () => {
  const navigate = useNavigate();
  const { MemberlistData: MemberData } = useSelector(masterSelector);
  const [isExcelViewerOpen, setIsExcelViewerOpen] = useState(false); // <-- ADD THIS STATE

  const MEMBER_FILTER_STORAGE_KEY = 'memberFilterState';

  const getInitialState = (): FilterFormData => {
    try {
      const savedStateJSON = sessionStorage.getItem(MEMBER_FILTER_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.filterCreatedAt) {
          savedState.filterCreatedAt = savedState.filterCreatedAt.map((d: string | null) => d ? new Date(d) : null);
        }
        return savedState;
      }
    } catch (error) {
      console.error("Failed to parse saved member filters, clearing it.", error);
      sessionStorage.removeItem(MEMBER_FILTER_STORAGE_KEY);
    }
    return {};
  };

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(getInitialState());

  useEffect(() => {
    try {
      sessionStorage.setItem(MEMBER_FILTER_STORAGE_KEY, JSON.stringify(filterCriteria));
    } catch (error) {
      console.error("Could not save member filters to sessionStorage:", error);
    }
  }, [filterCriteria]);

  const setAndPersistFilters = useCallback((filters: FilterFormData | ((prevState: FilterFormData) => FilterFormData)) => {
    setFilterCriteria(filters);
  }, []);

  // MODIFIED: Counts are now taken directly from the API response via the Redux store.
  const counts = useMemo(() => {
    return MemberData?.counts || {
      total: 0,
      active: 0,
      disabled: 0,
      unregistered: 0,
    };
  }, [MemberData?.counts]);

  const handleCardClick = useCallback((status: "Active" | "Disabled" | "Unregistered" | "All") => {
    const newFilters = status === "All" ? {} : { ...getInitialState(), filterStatus: [{ value: status, label: status }] };
    setAndPersistFilters(newFilters);
  }, [setAndPersistFilters]);

  // MODIFIED: This function now opens the modal
  const handleViewBitRouteClick = () => {
    setIsExcelViewerOpen(true);
  };


  return (
    <MemberListProvider>
      <Container>
        <AdaptiveCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-0">
              <h5>Members</h5>
              <div className="flex items-center gap-2">
                <Button
                  icon={<TbEye />}
                  onClick={handleViewBitRouteClick} // <-- MODIFIED
                  clickFeedback={false}
                  color="green-600"
                >
                  View Bit Route
                </Button>
                <Button menuName="member"
                  isAdd={true} variant="solid" icon={<TbPlus />} onClick={() => navigate("/business-entities/member-create")}>Add New</Button>


              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 mb-4 gap-3">
              <Tooltip title="Click to show all members">
                <div onClick={() => handleCardClick("All")} className="cursor-pointer">
                  <Card bodyClass="flex gap-2 p-2"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbUsersGroup size={24} /></div><div><h6>{counts.total}</h6><span className="text-xs font-semibold">Total</span></div></Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show active members">
                <div onClick={() => handleCardClick("Active")} className="cursor-pointer">
                  <Card bodyClass="flex gap-2 p-2"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUserCheck size={24} /></div><div><h6>{counts.active}</h6><span className="text-xs font-semibold">Active</span></div></Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show disabled members">
                <div onClick={() => handleCardClick("Disabled")} className="cursor-pointer">
                  <Card bodyClass="flex gap-2 p-2"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbUserCancel size={24} /></div><div><h6>{counts.disabled}</h6><span className="text-xs font-semibold">Disabled</span></div></Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show unregistered members">
                <div onClick={() => handleCardClick("Unregistered")} className="cursor-pointer">
                  <Card bodyClass="flex gap-2 p-2"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbUserExclamation size={24} /></div><div><h6>{counts.unregistered}</h6><span className="text-xs font-semibold">Unregistered</span></div></Card>
                </div>
              </Tooltip>
            </div>
            <FormListTable filterCriteria={filterCriteria} setFilterCriteria={setAndPersistFilters} />
          </div>
        </AdaptiveCard>
      </Container>
      <FormListSelected />
      {/* ADD THIS MODAL RENDER */}
      <ExcelViewerModal
        isOpen={isExcelViewerOpen}
        onClose={() => setIsExcelViewerOpen(false)}
        fileUrl="/public/bit_route_rm_wise_data.xlsx"
        title="Bit Route Data"
      />
    </MemberListProvider>
  );
};

export default Member;
