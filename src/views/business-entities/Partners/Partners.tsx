import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
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
import RichTextEditor from '@/components/shared/RichTextEditor';
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Spinner,
  Tag,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import { MdCancel, MdCheckCircle } from "react-icons/md";
import {
  TbAlarm,
  TbBell,
  TbBellRinging,
  TbBrandWhatsapp,
  TbBuilding,
  TbBuildingBank,
  TbCalendarEvent,
  TbCalendarTime,
  TbCancel,
  TbCheck,
  TbChecks,
  TbCircleCheck,
  TbCircleX,
  TbCloudUpload,
  TbColumns,
  TbDownload,
  TbEye,
  TbFileDescription,
  TbFilter,
  TbMail,
  TbNotesOff,
  TbPencil,
  TbPencilPlus,
  TbPlus,
  TbReload,
  TbSearch,
  TbTagStarred,
  TbTrash,
  TbUser,
  TbUserCircle,
  TbX
} from "react-icons/tb";

// Types & Redux
import type { TableQueries } from "@/@types/common";
import type {
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addAllActionAction,
  addAllAlertsAction,
  addNotificationAction,
  addScheduleAction,
  addTaskAction,
  deleteAllpartnerAction,
  getAlertsAction, // Assuming a single delete action exists, or using deleteAll for one
  getAllUsersAction,
  getContinentsAction,
  getCountriesAction,
  getpartnerAction,
  submitExportReasonAction
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { encryptStorage } from "@/utils/secureLocalStorage";
import dayjs from "dayjs";
import { config } from "localforage";
import { useSelector } from "react-redux";


// --- MODIFIED: PartnerItem Type (Data Structure) ---
export type PartnerItem = {
  id: string;
  partner_name: string;
  company_name?: string; // --- ADDED ---
  industrial_expertise?: string; // --- ADDED ---
  join_us_as?: string; // --- ADDED ---
  owner_name: string;
  // ownership_type: string; // --- REMOVED ---
  partner_code?: string;
  primary_contact_number: string;
  primary_contact_number_code: string;
  primary_email_id: string;
  partner_website?: string;
  status: "Active" | "Pending" | "Inactive" | "Verified" | "active" | "inactive" | "Non Verified";
  country: { name: string };
  continent: { name: string };
  state: string;
  city: string;
  gst_number?: string;
  pan_number?: string;
  partner_logo?: string;
  teams_count: number;
  profile_completion: number;
  kyc_verified: boolean;
  due_after_3_months_date: string;
  created_at: string;
  partner_team_members: {
    id: number;
    person_name: string;
    designation: string;
    number: string;
  }[];
  partner_certificate: {
    id: number;
    certificate_name: string;
    upload_certificate_path: string;
  }[];
  [key: string]: any;
};
export type SelectOption = { value: any; label: string; };

// --- MODIFIED: Zod Schemas ---
const partnerFilterFormSchema = z.object({
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterIndustryExpertise: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // --- ADDED ---
  filterContinent: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCountry: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterState: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterKycVerified: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCreatedDate: z.array(z.date().nullable()).optional().default([null, null]),
});
type PartnerFilterFormData = z.infer<typeof partnerFilterFormSchema>;

const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
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

const notificationSchema = z.object({
  notification_title: z.string().min(3, 'Title must be at least 3 characters long.'),
  send_users: z.array(z.number()).min(1, 'Please select at least one user.'),
  message: z.string().min(10, 'Message must be at least 10 characters long.'),
});
type NotificationFormData = z.infer<typeof notificationSchema>;

const activitySchema = z.object({
  item: z.string().min(3, "Activity item is required and must be at least 3 characters."),
  notes: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;

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


const taskPriorityOptions: SelectOption[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

// --- CSV Exporter Utility ---
const PARTNER_CSV_HEADERS = ["ID", "Name", "Partner Code", "Company Name", "Industry Expertise", "Joined As", "Status", "Country", "State", "City", "KYC Verified", "Created Date", "Owner", "Contact Number", "Email", "Website", "GST", "PAN"];

function exportToCsv(filename: string, rows: PartnerItem[]) {
  if (!rows || !rows.length) {
    toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
    return false;
  }
  const transformedRows = rows.map(row => ({
    id: String(row.id) || "N/A",
    name: row.partner_name || "N/A",
    partner_code: row.partner_code || "N/A",
    company_name: row.company_name || "N/A",
    industrial_expertise: row.industrial_expertise || "N/A",
    join_us_as: row.join_us_as || "N/A",
    status: row.status || "N/A",
    country: row.country?.name || "N/A",
    state: row.state || "N/A",
    city: row.city || "N/A",
    kyc_verified: row.kyc_verified ? "Yes" : "No",
    created_at: row.created_at ? new Date(row.created_at).toLocaleDateString("en-GB") : "N/A",
    owner_name: row.owner_name || "N/A",
    primary_contact_number: row.primary_contact_number || "N/A",
    primary_email_id: row.primary_email_id || "N/A",
    partner_website: row.partner_website || "N/A",
    gst_number: row.gst_number || "N/A",
    pan_number: row.pan_number || "N/A",
  }));

  const headerToKeyMap: Record<string, keyof typeof transformedRows[0]> = {
    "ID": 'id', "Name": 'name', "Partner Code": 'partner_code', "Company Name": 'company_name',
    "Industry Expertise": 'industrial_expertise', "Joined As": 'join_us_as', "Status": 'status',
    "Country": 'country', "State": 'state', "City": 'city', "KYC Verified": 'kyc_verified',
    "Created Date": 'created_at', "Owner": 'owner_name', "Contact Number": 'primary_contact_number',
    "Email": 'primary_email_id', "Website": 'partner_website', "GST": 'gst_number', "PAN": 'pan_number'
  };

  const csvContent = [
    PARTNER_CSV_HEADERS.join(','),
    ...transformedRows.map(row => PARTNER_CSV_HEADERS.map(header => JSON.stringify(row[headerToKeyMap[header]] ?? '')).join(','))
  ].join('\n');
  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>);
    return true;
  }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- Status Colors & Context ---
export const getPartnerStatusClass = (statusValue?: PartnerItem["status"]): string => {
  if (!statusValue) return "bg-gray-200 text-gray-600";
  const lowerCaseStatus = statusValue.toLowerCase();
  const partnerStatusColors: Record<string, string> = {
    active: "border border-green-300 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-300",
    verified: "border border-blue-300 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300",
    pending: "border border-orange-300 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300",
    inactive: "border border-red-300 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300",
    "non verified": "border border-yellow-300 bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-300",
  };
  return partnerStatusColors[lowerCaseStatus] || "bg-gray-200 text-gray-600";
};

interface PartnerListStore {
  partnerList: PartnerItem[];
  selectedPartners: PartnerItem[];
  partnerCount: any;
  CountriesData: any[];
  ContinentsData: any[];
  getAllUserData: SelectOption[];
  setPartnerList: React.Dispatch<React.SetStateAction<PartnerItem[]>>;
  setSelectedPartners: React.Dispatch<React.SetStateAction<PartnerItem[]>>;
}
const PartnerListContext = React.createContext<PartnerListStore | undefined>(undefined);
const usePartnerList = (): PartnerListStore => {
  const context = useContext(PartnerListContext);
  if (!context) throw new Error("usePartnerList must be used within a PartnerListProvider");
  return context;
};

const PartnerListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { partnerData, CountriesData, ContinentsData, getAllUserData = [] } = useSelector(masterSelector);
  const dispatch = useAppDispatch();
  const [partnerList, setPartnerList] = useState<PartnerItem[]>(partnerData?.data ?? []);
  const [selectedPartners, setSelectedPartners] = useState<PartnerItem[]>([]);
  const [partnerCount, setPartnerCount] = useState(partnerData?.counts ?? {});
  const getAllUserDataOptionsData = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map(b => ({ value: b.id, label: `(${b.employee_id}) - ${b.name || 'N/A'}` })) : [], [getAllUserData]);

  useEffect(() => {
    dispatch(getCountriesAction());
    dispatch(getContinentsAction());
    dispatch(getAllUsersAction());
    dispatch(getpartnerAction());
  }, [dispatch]);

  useEffect(() => {
    setPartnerList(partnerData?.data ?? []);
    setPartnerCount(partnerData?.counts ?? {});
  }, [partnerData]);

  return (
    <PartnerListContext.Provider value={{
      partnerList, setPartnerList,
      selectedPartners, setSelectedPartners,
      partnerCount,
      ContinentsData: Array.isArray(ContinentsData) ? ContinentsData : [],
      CountriesData: Array.isArray(CountriesData) ? CountriesData : [],
      getAllUserData: getAllUserDataOptionsData,
    }}
    >
      {children}
    </PartnerListContext.Provider>
  );
};


// --- MODALS SECTION ---
export type ModalType = 'email' | 'whatsapp' | 'schedule' | 'notification' | 'task' | 'members' | 'alert' | 'transaction' | 'document' | 'activity' | 'viewDetail';
export interface ModalState { isOpen: boolean; type: ModalType | null; data: PartnerItem | null; }

const ViewPartnerDetailDialog: React.FC<{ partner: PartnerItem; onClose: () => void }> = ({ partner, onClose }) => {
  const renderDetailItem = (label: string, value: any, isLink = false) => {
    if (value === null || value === undefined || value === "") return null;
    return (
      <div className="mb-3">
        <span className="font-semibold text-gray-700 dark:text-gray-200">{label}: </span>
        {isLink ? (
          <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{String(value)}</a>
        ) : (
          <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
        )}
      </div>
    );
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={800}>
      <div className="max-h-[80vh] overflow-y-auto pr-4">
        <h4 className="mb-6">Partner Details: {partner.partner_name}</h4>
        <Card className="mb-4" bordered>
          <h5 className="mb-2">Basic Information</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {renderDetailItem("Partner Code", partner.partner_code)}
            {renderDetailItem("Company Name", partner.company_name)}
            {renderDetailItem("Industry Expertise", partner.industrial_expertise)}
            {renderDetailItem("Joined As", partner.join_us_as)}
            {renderDetailItem("Owner Name", partner.owner_name)}
            <div className="mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-200">Status: </span>
              <span className="text-gray-600 dark:text-gray-400"><Tag className={`${getPartnerStatusClass(partner.status)} capitalize`}>{partner.status}</Tag></span>
            </div>
            {renderDetailItem("Profile Completion", `${partner.profile_completion}%`)}
          </div>
        </Card>
        <Card className="mb-4" bordered>
          <h5 className="mb-2">Contact Information</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {renderDetailItem("Primary Email", partner.primary_email_id)}
            {renderDetailItem("Primary Contact", `${partner.primary_contact_number_code} ${partner.primary_contact_number}`)}
            {renderDetailItem("Website", partner.partner_website, true)}
          </div>
        </Card>
        <Card className="mb-4" bordered>
          <h5 className="mb-2">Address</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {renderDetailItem("City", partner.city)}
            {renderDetailItem("State", partner.state)}
            {renderDetailItem("Country", partner.country?.name)}
            {renderDetailItem("Continent", partner.continent?.name)}
          </div>
        </Card>
        <Card className="mb-4" bordered>
          <h5 className="mb-2">Legal & Financial</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            {renderDetailItem("GST Number", partner.gst_number)}
            {renderDetailItem("PAN Number", partner.pan_number)}
            <div className="mb-3">
              <span className="font-semibold text-gray-700 dark:text-gray-200">KYC Verified: </span>
              <span className="text-gray-600 dark:text-gray-400">{partner.kyc_verified ? <MdCheckCircle className="text-green-500 text-xl inline-block" /> : <MdCancel className="text-red-500 text-xl inline-block" />}</span>
            </div>
          </div>
        </Card>
        {partner.partner_team_members?.length > 0 && (
          <Card className="mb-4" bordered>
            <h5 className="mb-2">Team Members</h5>
            {partner.partner_team_members.map((member) => (
              <div key={member.id} className="mb-3 p-2 border rounded-md dark:border-gray-600">
                {renderDetailItem("Name", member.person_name)}
                {renderDetailItem("Designation", member.designation)}
                {renderDetailItem("Contact", member.number)}
              </div>
            ))}
          </Card>
        )}
        {partner.partner_certificate?.length > 0 && (
          <Card className="mb-4" bordered>
            <h5 className="mb-2">Certificates</h5>
            {partner.partner_certificate.map((cert) => (
              <div key={cert.id} className="mb-2 flex justify-between items-center">
                <span>{cert.certificate_name}</span>
                {cert.upload_certificate_path && (
                  <a href={cert.upload_certificate_path} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">View Certificate</a>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>
      <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};

const AddPartnerActivityDialog: React.FC<{ partner: PartnerItem; onClose: () => void; user: any; }> = ({ partner, onClose, user }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: { item: `Follow up on ${partner.partner_name}`, notes: '' },
    mode: 'onChange',
  });

  const onAddActivity = async (data: ActivityFormData) => {
    setIsLoading(true);
    const payload = {
      item: data.item,
      notes: data.notes || '',
      module_id: String(partner.id),
      module_name: 'Partner',
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
      <h5 className="mb-4">Add Activity Log for "{partner.partner_name}"</h5>
      <UiForm onSubmit={handleSubmit(onAddActivity)}>
        <UiFormItem label="Activity" invalid={!!errors.item} errorMessage={errors.item?.message}>
          <Controller name="item" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Followed up with partner" />} />
        </UiFormItem>
        <UiFormItem label="Notes (Optional)" invalid={!!errors.notes} errorMessage={errors.notes?.message}>
          <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} placeholder="Add relevant details..." />} />
        </UiFormItem>
        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading} icon={<TbCheck />}>Save Activity</Button>
        </div>
      </UiForm>
    </Dialog>
  );
};


const AddPartnerScheduleDialog: React.FC<{ partner: PartnerItem; onClose: () => void }> = ({ partner, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const eventTypeOptions = [
    { value: 'Meeting', label: 'Meeting' }, { value: 'Demo', label: 'Product Demo' }, { value: 'IntroCall', label: 'Introductory Call' }, { value: 'FollowUpCall', label: 'Follow-up Call' }, { value: 'QBR', label: 'Quarterly Business Review (QBR)' }, { value: 'CheckIn', label: 'Customer Check-in' }, { value: 'LogEmail', label: 'Log an Email' }, { value: 'Milestone', label: 'Project Milestone' }, { value: 'Task', label: 'Task' }, { value: 'FollowUp', label: 'General Follow-up' }, { value: 'ProjectKickoff', label: 'Project Kick-off' }, { value: 'OnboardingSession', label: 'Onboarding Session' }, { value: 'Training', label: 'Training Session' }, { value: 'SupportCall', label: 'Support Call' }, { value: 'Reminder', label: 'Reminder' }, { value: 'Note', label: 'Add a Note' }, { value: 'FocusTime', label: 'Focus Time (Do Not Disturb)' }, { value: 'StrategySession', label: 'Strategy Session' }, { value: 'TeamMeeting', label: 'Team Meeting' }, { value: 'PerformanceReview', label: 'Performance Review' }, { value: 'Lunch', label: 'Lunch / Break' }, { value: 'Appointment', label: 'Personal Appointment' }, { value: 'Other', label: 'Other' },
  ];

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { event_title: `Meeting with ${partner.partner_name}`, event_type: undefined, date_time: null as any, remind_from: null, notes: `Regarding partner ${partner.partner_name} (${partner.partner_code}).` },
    mode: 'onChange',
  });

  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = {
      module_id: Number(partner.id),
      module_name: 'Partner',
      event_title: data.event_title,
      event_type: data.event_type,
      date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'),
      ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }),
      notes: data.notes || '',
    };

    try {
      await dispatch(addScheduleAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for ${partner.partner_name}.`} />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for {partner.partner_name}</h5>
      <UiForm onSubmit={handleSubmit(onAddEvent)}>
        <UiFormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}>
          <Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} />
        </UiFormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiFormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}>
            <Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} />
          </UiFormItem>
          <UiFormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}>
            <Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} />
          </UiFormItem>
        </div>
        <UiFormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}>
          <Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} />
        </UiFormItem>
        <UiFormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}>
          <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} />
        </UiFormItem>
        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button>
        </div>
      </UiForm>
    </Dialog>
  );
};

const AddPartnerNotificationDialog: React.FC<{ partner: PartnerItem; onClose: () => void; userOptions: SelectOption[]; }> = ({ partner, onClose, userOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      notification_title: `Regarding Partner: ${partner.partner_name}`,
      send_users: [],
      message: `This is a notification regarding partner "${partner.partner_name}" (${partner.partner_code}). Please review their details.`,
    },
    mode: 'onChange',
  });

  const onSend = async (formData: NotificationFormData) => {
    setIsLoading(true);
    const payload = { ...formData, module_id: String(partner.id), module_name: 'Partner' };
    try {
      await dispatch(addNotificationAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Notification Sent!" />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Failed to Send" children={error?.message || 'An error occurred.'} />);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Notify User about: {partner.partner_name}</h5>
      <UiForm onSubmit={handleSubmit(onSend)}>
        <UiFormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></UiFormItem>
        <UiFormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />)} /></UiFormItem>
        <UiFormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></UiFormItem>
        <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send</Button></div>
      </UiForm>
    </Dialog>
  );
};

const AssignPartnerTaskDialog: React.FC<{ partner: PartnerItem; onClose: () => void; userOptions: SelectOption[] }> = ({ partner, onClose, userOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<TaskFormData>({
    resolver: zodResolver(taskValidationSchema),
    defaultValues: { task_title: `Follow up with ${partner.partner_name}`, assign_to: [], priority: 'Medium', due_date: null, description: `Follow up with partner ${partner.partner_name} (${partner.primary_email_id}).` },
    mode: 'onChange',
  });

  const onAssignTask = async (data: TaskFormData) => {
    setIsLoading(true);
    const payload = { ...data, due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined, module_id: String(partner.id), module_name: 'Partner' };
    try {
      await dispatch(addTaskAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Task Assigned!" />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Failed to Assign Task" children={error?.message || 'An error occurred.'} />);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for {partner.partner_name}</h5>
      <UiForm onSubmit={handleSubmit(onAssignTask)}>
        <UiFormItem label="Task Title" invalid={!!errors.task_title} errorMessage={errors.task_title?.message}><Controller name="task_title" control={control} render={({ field }) => <Input {...field} autoFocus />} /></UiFormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiFormItem label="Assign To" invalid={!!errors.assign_to} errorMessage={errors.assign_to?.message}><Controller name="assign_to" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={userOptions} value={userOptions.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />)} /></UiFormItem>
          <UiFormItem label="Priority" invalid={!!errors.priority} errorMessage={errors.priority?.message}><Controller name="priority" control={control} render={({ field }) => (<UiSelect placeholder="Select Priority" options={taskPriorityOptions} value={taskPriorityOptions.find(p => p.value === field.value)} onChange={opt => field.onChange(opt?.value)} />)} /></UiFormItem>
        </div>
        <UiFormItem label="Due Date (Optional)" invalid={!!errors.due_date} errorMessage={errors.due_date?.message}><Controller name="due_date" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />} /></UiFormItem>
        <UiFormItem label="Description" invalid={!!errors.description} errorMessage={errors.description?.message}><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></UiFormItem>
        <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Assign Task</Button></div>
      </UiForm>
    </Dialog>
  );
};

const ViewPartnerMembersDialog: React.FC<{ partner: PartnerItem; onClose: () => void; }> = ({ partner, onClose }) => (
  <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
    <h5 className="mb-4">Team Members of {partner.partner_name}</h5>
    <div className="max-h-96 overflow-y-auto">
      {partner.partner_team_members && partner.partner_team_members.length > 0 ? (
        <div className="space-y-3">
          {partner.partner_team_members.map(member => (
            <div key={member.id} className="p-3 border rounded-md dark:border-gray-600">
              <p className="font-semibold">{member.person_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{member.designation}</p>
              <p className="text-xs text-gray-500">{member.number}</p>
            </div>
          ))}
        </div>
      ) : <p>No team members found for this partner.</p>}
    </div>
    <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
  </Dialog>
);

const DownloadPartnerDocumentDialog: React.FC<{ partner: PartnerItem; onClose: () => void; }> = ({ partner, onClose }) => {
  const documents = useMemo(() => {
    return partner.partner_certificate?.map(cert => ({
      name: cert.certificate_name,
      url: cert.upload_certificate_path,
    })) || [];
  }, [partner]);

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
      <h5 className="mb-4">Download Documents for {partner.partner_name}</h5>
      <div className="max-h-96 overflow-y-auto">
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <a key={index} href={doc.url!} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
                <span className="flex items-center gap-2"><TbFileDescription className="text-lg" />{doc.name}</span>
                <TbDownload className="text-lg text-blue-500" />
              </a>
            ))}
          </div>
        ) : <p>No documents available for download.</p>}
      </div>
      <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};

const ViewPartnerDataDialog: React.FC<{ title: string; message: string; onClose: () => void; }> = ({ title, message, onClose }) => (
  <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
    <h5 className="mb-4">{title}</h5><p>{message}</p>
    <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
  </Dialog>
);


const SendPartnerEmailAction: React.FC<{ partner: PartnerItem; onClose: () => void }> = ({ partner, onClose }) => {
  useEffect(() => {
    if (!partner.primary_email_id) {
      toast.push(<Notification type="warning" title="Missing Email" children="Primary email is not available for this partner." />);
      onClose();
      return;
    }
    const subject = `Regarding Your Partnership: ${partner.partner_name}`;
    const body = `Hello ${partner.owner_name || partner.partner_name},\n\nWe are contacting you regarding your partnership profile (ID: ${partner.partner_code}).\n\nThank you.`;

    window.open(`mailto:${partner.primary_email_id}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    onClose();
  }, [partner, onClose]);

  return null;
};

const SendPartnerWhatsAppAction: React.FC<{ partner: PartnerItem; onClose: () => void }> = ({ partner, onClose }) => {
  useEffect(() => {
    const phone = partner.primary_contact_number?.replace(/\D/g, '');
    const countryCode = partner.primary_contact_number_code?.replace(/\D/g, '');

    if (!phone || !countryCode) {
      toast.push(<Notification type="warning" title="Missing Number" children="Primary contact number is not available for this partner." />);
      onClose();
      return;
    }

    const fullPhoneNumber = `${countryCode}${phone}`;
    const message = `Hello ${partner.owner_name || partner.partner_name},\nThis is a message regarding your partnership with us.`;

    window.open(`https://wa.me/${fullPhoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    onClose();
  }, [partner, onClose]);

  return null;
};

const PartnerAlertModal: React.FC<{ partner: PartnerItem; onClose: () => void }> = ({ partner, onClose }) => {
  // --- State and Hooks ---
  const [alerts, setAlerts] = useState<AlertNote[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const { control, handleSubmit, formState: { errors, isValid }, reset } = useForm<AlertNoteFormData>({
    resolver: zodResolver(alertNoteSchema),
    defaultValues: { newNote: '' },
    mode: 'onChange'
  });

  // --- Helper functions and API calls ---
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
    dispatch(getAlertsAction({ module_id: partner.id, module_name: 'Partner' }))
      .unwrap()
      .then((data) => setAlerts(data.data || []))
      .catch(() => toast.push(<Notification type="danger" title="Failed to fetch alerts." />))
      .finally(() => setIsFetching(false));
  }, [partner.id, dispatch]);

  useEffect(() => {
    fetchAlerts();
    reset({ newNote: '' });
  }, [fetchAlerts, reset]);

  const onAddNote = async (data: AlertNoteFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(addAllAlertsAction({ note: data.newNote, module_id: partner.id, module_name: 'Partner' })).unwrap();
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
            <h5 className="mb-0 text-white font-bold text-base sm:text-xl">{partner.partner_name}</h5>
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


const PartnerModals: React.FC<{ modalState: ModalState; onClose: () => void; userOptions: SelectOption[] }> = ({ modalState, onClose, userOptions }) => {
  const { type, data: partner, isOpen } = modalState;
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const { useEncryptApplicationStorage } = config;
    try { setUserData(encryptStorage.getItem("UserData", !useEncryptApplicationStorage)); }
    catch (error) { console.error("Error getting UserData:", error); }
  }, []);

  if (!isOpen || !partner) return null;

  switch (type) {
    case 'email': return <SendPartnerEmailAction partner={partner} onClose={onClose} />;
    case 'whatsapp': return <SendPartnerWhatsAppAction partner={partner} onClose={onClose} />;
    case 'schedule': return <AddPartnerScheduleDialog partner={partner} onClose={onClose} />;
    case 'notification': return <AddPartnerNotificationDialog partner={partner} onClose={onClose} userOptions={userOptions} />;
    case 'task': return <AssignPartnerTaskDialog partner={partner} onClose={onClose} userOptions={userOptions} />;
    case 'members': return <ViewPartnerMembersDialog partner={partner} onClose={onClose} />;
    case 'alert': return <PartnerAlertModal partner={partner} onClose={onClose} />;
    case 'transaction': return <ViewPartnerDataDialog title={`Transactions for ${partner.partner_name}`} message="No transactions found for this partner." onClose={onClose} />;
    case 'document': return <DownloadPartnerDocumentDialog partner={partner} onClose={onClose} />;
    case 'activity': return <AddPartnerActivityDialog partner={partner} onClose={onClose} user={userData} />;
    case 'viewDetail': return <ViewPartnerDetailDialog partner={partner} onClose={onClose} />;
    default: console.warn(`Unhandled modal type: ${type}`); return null;
  }
};

// --- Child Components ---
const PartnerListSearch: React.FC<{ onInputChange: (value: string) => void; value: string; }> = ({ onInputChange, value }) => {
  return <DebouceInput placeholder="Quick Search..." value={value} suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />;
};


const PartnerActionColumn = ({ rowData, onEdit, onOpenModal, onDelete }: {
  rowData: PartnerItem;
  onEdit: (id: string) => void;
  onOpenModal: (type: ModalType, data: PartnerItem) => void;
  onDelete: () => void;
}) => {
  const navigate = useNavigate();
  const handleAction = (e: React.MouseEvent, action: () => void) => { e.stopPropagation(); action(); };

  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit"><div className="text-xl cursor-pointer hover:text-emerald-600" role="button" onClick={() => onEdit(rowData.id)}><TbPencil /></div></Tooltip>
      <Tooltip title="View"><div className="text-xl cursor-pointer hover:text-blue-600" role="button" onClick={() => navigate(`/business-entities/partner-view/${rowData.id}`)}><TbEye /></div></Tooltip>
      {/* <Tooltip title="Delete">
        <div
          className={`text-xl p-1.5 cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip> */}
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item onClick={(e) => handleAction(e, () => onOpenModal('email', rowData))} className="flex items-center gap-2"><TbMail /> Send Email</Dropdown.Item>
        <Dropdown.Item onClick={(e) => handleAction(e, () => onOpenModal('whatsapp', rowData))} className="flex items-center gap-2"><TbBrandWhatsapp /> Send WhatsApp</Dropdown.Item>
        <Dropdown.Item onClick={(e) => handleAction(e, () => onOpenModal('notification', rowData))} className="flex items-center gap-2"><TbBell /> Add Notification</Dropdown.Item>
        <Dropdown.Item onClick={(e) => handleAction(e, () => onOpenModal('schedule', rowData))} className="flex items-center gap-2"><TbCalendarEvent /> Add Schedule</Dropdown.Item>
        <Dropdown.Item onClick={(e) => handleAction(e, () => onOpenModal('task', rowData))} className="flex items-center gap-2"><TbUser /> Assign Task</Dropdown.Item>
        <Dropdown.Item onClick={(e) => handleAction(e, () => onOpenModal('activity', rowData))} className="flex items-center gap-2"><TbTagStarred size={18} /> Add Activity</Dropdown.Item>
        <Dropdown.Item onClick={(e) => handleAction(e, () => onOpenModal('alert', rowData))} className="flex items-center gap-2"><TbAlarm /> View Alert</Dropdown.Item>
        <Dropdown.Item onClick={(e) => handleAction(e, () => onOpenModal('document', rowData))} className="flex items-center gap-2"><TbDownload /> Download Document</Dropdown.Item>

      </Dropdown>
    </div>
  );
};

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: PartnerFilterFormData;
  onRemoveFilter: (key: keyof PartnerFilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const filterKeyToLabelMap: Record<string, string> = {
    filterStatus: 'Status', filterIndustryExpertise: 'Expertise', filterContinent: 'Continent',
    filterCountry: 'Country', filterState: 'State', filterCity: 'City',
    filterKycVerified: 'KYC',
  };
  const activeFiltersList = Object.entries(filterData).flatMap(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return [];
    if (key === 'filterCreatedDate') {
      const dateArray = value as [Date | null, Date | null];
      if (dateArray[0] && dateArray[1]) {
        return [{ key, value: 'date-range', label: `Date: ${dateArray[0].toLocaleDateString()} - ${dateArray[1].toLocaleDateString()}` }];
      }
      return [];
    }
    if (Array.isArray(value)) {
      return value.filter(item => item !== null && item !== undefined).map((item: { value: string; label: string }) => ({
        key, value: item.value, label: `${filterKeyToLabelMap[key] || 'Filter'}: ${item.label}`,
      }));
    }
    return [];
  });
  if (activeFiltersList.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {activeFiltersList.map(filter => (
        <Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">
          {filter.label}
          <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key as keyof PartnerFilterFormData, filter.value)} />
        </Tag>
      ))}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};

const PartnerListTable = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { partnerList, setSelectedPartners, partnerCount, ContinentsData, CountriesData, getAllUserData } = usePartnerList();
  const [isLoading, setIsLoading] = useState(false);
  const PARTNER_STATE_STORAGE_KEY = 'partnerListStatePersistence';

  const getInitialState = () => {
    try {
      const savedStateJSON = sessionStorage.getItem(PARTNER_STATE_STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        if (savedState.filterCriteria?.filterCreatedDate) {
          savedState.filterCriteria.filterCreatedDate = savedState.filterCriteria.filterCreatedDate.map((d: string | null) => d ? new Date(d) : null);
        }
        return savedState;
      }
    } catch (error) {
      console.error("Failed to parse saved state, clearing it.", error);
      sessionStorage.removeItem(PARTNER_STATE_STORAGE_KEY);
    }
    return {
      tableData: { pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" },
      filterCriteria: { filterCreatedDate: [null, null] }
    };
  };

  const initialState = getInitialState();
  const [tableData, setTableData] = useState<TableQueries>(initialState.tableData);
  const [filterCriteria, setFilterCriteria] = useState<PartnerFilterFormData>(initialState.filterCriteria);

  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PartnerItem | null>(null);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    try {
      const stateToSave = { tableData, filterCriteria };
      sessionStorage.setItem(PARTNER_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (error) {
      console.error("Could not save state to sessionStorage:", error);
    }
  }, [tableData, filterCriteria]);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });

  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), mode: 'onChange' });
  const filterFormMethods = useForm<PartnerFilterFormData>({ resolver: zodResolver(partnerFilterFormSchema) });

  const handleOpenModal = (type: ModalType, partnerData: PartnerItem) => setModalState({ isOpen: true, type, data: partnerData });
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

  const handleDeleteClick = useCallback((item: PartnerItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteAllpartnerAction({ ids: itemToDelete.id })).unwrap();
      toast.push(<Notification title="Partner Deleted" type="success" >{`Partner "${itemToDelete.partner_name}" has been deleted.`}</Notification>);
      dispatch(getpartnerAction());
      setSelectedPartners((prev) => prev.filter((p) => p.id !== itemToDelete.id));
    } catch (error: any) {
      toast.push(<Notification title="Delete Failed" type="danger">{error?.message || "Could not delete partner."}</Notification>);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete, setSelectedPartners]);


  // --- START: Filter Drawer Handlers ---
  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria); // Load current filters into the form
    setIsFilterDrawerOpen(true);
  };

  const closeFilterDrawer = () => {
    setIsFilterDrawerOpen(false);
  };

  const onApplyFiltersSubmit = (data: PartnerFilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 }); // Reset to page 1 on new filter
    closeFilterDrawer();
  };

  // --- MODIFIED: onClearFilters ---
  const onClearFilters = () => {
    const defaultFilters: PartnerFilterFormData = { filterCreatedDate: [null, null], filterStatus: [], filterIndustryExpertise: [], filterContinent: [], filterCountry: [], filterState: [], filterCity: [], filterKycVerified: [] };
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1, query: "", sort: { order: "", key: "" } });
    sessionStorage.removeItem(PARTNER_STATE_STORAGE_KEY);
  };

  const handleRemoveFilter = (key: keyof PartnerFilterFormData, valueToRemove: string) => {
    setFilterCriteria(prev => {
      const newCriteria = { ...prev };
      if (key === 'filterCreatedDate') {
        (newCriteria as any)[key] = [null, null];
      } else {
        const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined;
        if (currentFilterArray) {
          (newCriteria as any)[key] = currentFilterArray.filter(item => item.value !== valueToRemove);
        }
      }
      return newCriteria;
    });
    handleSetTableData({ pageIndex: 1 }); // Reset to page 1 when a filter is removed
  };
  // --- END: Filter Drawer Handlers ---

  const onRefreshData = () => {
    onClearFilters();
    dispatch(getpartnerAction());
    toast.push(<Notification title="Data Refreshed" type="success" duration={2000} />);
  };

  const statusOptions = useMemo(() => Array.from(new Set(partnerList.map((c) => c.status))).filter(Boolean).map((s) => ({ value: s, label: s })), [partnerList]);
  const kycOptions = [{ value: "Yes", label: "Yes" }, { value: "No", label: "No" }];
  // --- ADDED: Industry Expertise Filter Options ---
  const industryExpertiseOptions = useMemo(() => Array.from(new Set(partnerList.map((c) => c.industrial_expertise))).filter(Boolean).map((t) => ({ value: t, label: t })), [partnerList]);


  const handleCardClick = (filterType: 'status' | 'kyc', value: string) => {
    onClearFilters(); // Start with a clean slate

    if (filterType === 'status') {
      const statusOption = statusOptions.find(opt => opt.value.toLowerCase() === value.toLowerCase());
      if (statusOption) {
        setFilterCriteria(prev => ({ ...prev, filterStatus: [statusOption] }));
      }
    } else if (filterType === 'kyc') {
      const kycOption = kycOptions.find(opt => opt.value === value); // Find { value: 'Yes', ... } or { value: 'No', ... }
      if (kycOption) {
        setFilterCriteria(prev => ({ ...prev, filterKycVerified: [kycOption] }));
      }
    }

    handleSetTableData({ pageIndex: 1, query: "" });
  };

  // --- MODIFIED: useMemo for filtering logic ---
  const { pageData, total, allFilteredAndSortedData, activeFilterCount } = useMemo(() => {
    let filteredData = [...partnerList];

    // --- Apply all active filters ---
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) { const selected = filterCriteria.filterStatus.map(s => s.value.toLowerCase()); filteredData = filteredData.filter(p => p.status && selected.includes(p.status.toLowerCase())); }
    if (filterCriteria.filterIndustryExpertise && filterCriteria.filterIndustryExpertise.length > 0) { const selected = filterCriteria.filterIndustryExpertise.map(s => s.value); filteredData = filteredData.filter(p => p.industrial_expertise && selected.includes(p.industrial_expertise)); } // --- ADDED ---
    if (filterCriteria.filterContinent && filterCriteria.filterContinent.length > 0) { const selected = filterCriteria.filterContinent.map(s => s.value); filteredData = filteredData.filter(p => p.continent && selected.includes(p.continent.name)); }
    if (filterCriteria.filterCountry && filterCriteria.filterCountry.length > 0) { const selected = filterCriteria.filterCountry.map(s => s.value); filteredData = filteredData.filter(p => p.country && selected.includes(p.country.name)); }
    if (filterCriteria.filterState && filterCriteria.filterState.length > 0) { const selected = filterCriteria.filterState.map(s => s.value); filteredData = filteredData.filter(p => selected.includes(p.state)); }
    if (filterCriteria.filterCity && filterCriteria.filterCity.length > 0) { const selected = filterCriteria.filterCity.map(s => s.value); filteredData = filteredData.filter(p => selected.includes(p.city)); }
    if (filterCriteria.filterKycVerified && filterCriteria.filterKycVerified.length > 0) { const selected = filterCriteria.filterKycVerified.map(k => k.value === "Yes"); filteredData = filteredData.filter(p => selected.includes(p.kyc_verified)); }
    if (filterCriteria.filterCreatedDate?.[0] && filterCriteria.filterCreatedDate?.[1]) { const [start, end] = filterCriteria.filterCreatedDate; end.setHours(23, 59, 59, 999); filteredData = filteredData.filter(p => { const date = new Date(p.created_at); return date >= start && date <= end; }); }

    // --- Apply search query ---
    if (tableData.query) {
      const lowerCaseQuery = tableData.query.toLowerCase();
      filteredData = filteredData.filter(i =>
        Object.values(i).some(v => String(v).toLowerCase().includes(lowerCaseQuery))
      );
    }

    // --- Count active filters for the badge ---
    let count = 0;
    count += (filterCriteria.filterStatus?.length ?? 0) > 0 ? 1 : 0;
    count += (filterCriteria.filterIndustryExpertise?.length ?? 0) > 0 ? 1 : 0; // --- ADDED ---
    count += (filterCriteria.filterContinent?.length ?? 0) > 0 ? 1 : 0;
    count += (filterCriteria.filterCountry?.length ?? 0) > 0 ? 1 : 0;
    count += (filterCriteria.filterState?.length ?? 0) > 0 ? 1 : 0;
    count += (filterCriteria.filterCity?.length ?? 0) > 0 ? 1 : 0;
    count += (filterCriteria.filterKycVerified?.length ?? 0) > 0 ? 1 : 0;
    count += (filterCriteria.filterCreatedDate?.[0] && filterCriteria.filterCreatedDate?.[1]) ? 1 : 0;

    // --- Apply sorting ---
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { filteredData.sort((a, b) => { const av = a[key as keyof PartnerItem] ?? ""; const bv = b[key as keyof PartnerItem] ?? ""; if (typeof av === "string" && typeof bv === "string") return order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av); return 0; }); }

    // --- Paginate the final data ---
    const pI = tableData.pageIndex as number, pS = tableData.pageSize as number;
    return { pageData: filteredData.slice((pI - 1) * pS, pI * pS), total: filteredData.length, allFilteredAndSortedData: filteredData, activeFilterCount: count };
  }, [partnerList, tableData, filterCriteria]);

  const handleSetTableData = useCallback((d: Partial<TableQueries>) => setTableData(p => ({ ...p, ...d })), []);
  const handlePaginationChange = useCallback((p: number) => handleSetTableData({ pageIndex: p }), [handleSetTableData]);
  const handleSelectChange = useCallback((v: number) => handleSetTableData({ pageSize: v, pageIndex: 1 }), [handleSetTableData]);
  const handleSort = useCallback((s: OnSortParam) => handleSetTableData({ sort: s, pageIndex: 1 }), [handleSetTableData]);

  const handleRowSelect = (checked: boolean, row: PartnerItem) => {
    setSelectedPartners(prev => checked ? [...prev, row] : prev.filter(p => p.id !== row.id));
  };
  const handleAllRowSelect = (checked: boolean, rows: Row<PartnerItem>[]) => {
    setSelectedPartners(checked ? rows.map(r => r.original) : []);
  };

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData.length) {
      toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
      return;
    }
    exportReasonFormMethods.reset();
    setIsExportReasonModalOpen(true);
  };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const fileName = `partners_export_${new Date().toISOString().split('T')[0]}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Partner', file_name: fileName })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      const success = exportToCsv(fileName, allFilteredAndSortedData);
      if (success) {
        setIsExportReasonModalOpen(false);
      }
    } catch (error: any) {
      toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message}</Notification>);
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const openImageViewer = (imageUrl: string | null) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
  const closeImageViewer = () => setImageViewerOpen(false);

  // --- MODIFIED: columns definition for the listing view ---
  const columns: ColumnDef<PartnerItem>[] = useMemo(() => [
    {
      header: "Partner Info", accessorKey: "partner_name", id: 'partnerInfo', size: 220, cell: ({ row }) => {
        const { partner_name, id, company_name, industrial_expertise, join_us_as, country } = row.original;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div>
                <h6 className="text-xs font-semibold"><em className="text-blue-600">{String(id).padStart(5, '0') || "Partner Code"}</em></h6>
                <span className="text-xs font-semibold leading-1">{partner_name}</span>
                {company_name && <span className="text-xs text-gray-500 block">({company_name})</span>}
              </div>
            </div>
            {industrial_expertise && <span className="text-xs mt-1"><b>Expertise:</b> {industrial_expertise}</span>}
            {join_us_as && <span className="text-xs mt-1"><b>Joined As:</b> {join_us_as}</span>}
            <div className="text-xs text-gray-500 mt-1">{country?.name || "N/A"}</div>
          </div>
        )
      },
    },
    {
      header: "Contact", accessorKey: "owner_name", id: 'contact', size: 180, cell: ({ row }) => {
        const { owner_name, primary_contact_number, primary_email_id, partner_website, primary_contact_number_code } = row.original;
        return (
          <div className="text-xs flex flex-col gap-0.5">
            {owner_name && (<span><b>Owner: </b> {owner_name}</span>)}
            {primary_contact_number && (<span>{primary_contact_number_code} {primary_contact_number}</span>)}
            {primary_email_id && (<a href={`mailto:${primary_email_id}`} className="text-blue-600 hover:underline">{primary_email_id}</a>)}
            {partner_website && (<a href={partner_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{partner_website}</a>)}
          </div>
        )
      },
    },
    {
      header: "Identity & Status", size: 180, accessorKey: 'status', id: 'legal', cell: ({ row }) => (
        <div className="flex flex-col gap-1 text-[11px]">
          {row.original.gst_number && <div><b>GST:</b> <span className="break-all">{row.original.gst_number}</span></div>}
          {row.original.pan_number && <div><b>PAN:</b> <span className="break-all">{row.original.pan_number}</span></div>}
          <Tag className={`${getPartnerStatusClass(row.original.status)} capitalize mt-1 self-start !text-[11px] px-2 py-1`}>{row.original.status}</Tag>
        </div>
      )
    },
    {
      header: "Profile & Scores", size: 190, accessorKey: 'profile_completion', id: 'profile', cell: ({ row }) => (
        <div className="flex flex-col gap-1.5 text-xs">
          <span><b>Teams:</b> {row.original.teams_count || 0}</span>
          <div className="flex gap-1 items-center"><b>KYC Verified:</b><Tooltip title={`KYC: ${row.original.kyc_verified ? 'Yes' : 'No'}`}>{row.original.kyc_verified ? <MdCheckCircle className="text-green-500 text-lg" /> : <MdCancel className="text-red-500 text-lg" />}</Tooltip></div>
          <Tooltip title={`Profile Completion ${row.original.profile_completion}%`}>
            <div className="h-2.5 w-full rounded-full bg-gray-300"><div className="rounded-full h-2.5 bg-blue-500" style={{ width: `${row.original.profile_completion}%` }}></div></div>
          </Tooltip>
        </div>
      )
    },
    { header: "Actions", id: "action", meta: { HeaderClass: "text-center" }, size: 80, cell: (props) => <PartnerActionColumn rowData={props.row.original} onEdit={(id) => navigate(`/business-entities/partner-edit/${id}`)} onDelete={() => handleDeleteClick(props.row.original)} onOpenModal={handleOpenModal} />, },
  ], [navigate, openImageViewer, handleOpenModal, handleDeleteClick]);

  const [filteredColumns, setFilteredColumns] = useState(columns);
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

  const isColumnVisible = (colId: string) => {
    return filteredColumns.some(c => (c.id || c.accessorKey) === colId);
  };

  const continentOptions = useMemo(() => ContinentsData.map((co) => ({ value: co.name, label: co.name })), [ContinentsData]);
  const countryOptions = useMemo(() => CountriesData.map((ct) => ({ value: ct.name, label: ct.name })), [CountriesData]);
  const stateOptions = useMemo(() => Array.from(new Set(partnerList.map((c) => c.state))).filter(Boolean).map((st) => ({ value: st, label: st })), [partnerList]);
  const cityOptions = useMemo(() => Array.from(new Set(partnerList.map((c) => c.city))).filter(Boolean).map((ci) => ({ value: ci, label: ci })), [partnerList]);
  const { DatePickerRange } = DatePicker;
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-1";

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 mb-4 gap-2">
        <Tooltip title="Click to show all partners"><div onClick={onClearFilters}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbBuilding size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm">{partnerCount?.total ?? 0}</b><span className="text-[9px] font-semibold">Total</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Active status"><div onClick={() => handleCardClick('status', 'Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbBuildingBank size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm">{partnerCount?.active ?? 0}</b><span className="text-[9px] font-semibold">Active</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by Disable status"><div onClick={() => handleCardClick('status', 'Disabled')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCancel size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm">{partnerCount?.disabled ?? 0}</b><span className="text-[9px] font-semibold">Disabled</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by KYC Verified"><div onClick={() => handleCardClick('kyc', 'Yes')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-emerald-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbCircleCheck size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm">{partnerCount?.verified ?? 0}</b><span className="text-[9px] font-semibold">Verified</span></div></Card></div></Tooltip>
        <Tooltip title="Click to filter by KYC Unverified"><div onClick={() => handleCardClick('kyc', 'No')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-yellow-200")}><div className="h-8 w-8 rounded-md flex items-center justify-center bg-yellow-100 text-yellow-500"><TbCircleX size={16} /></div><div className="flex flex-col gap-0"><b className="text-sm">{partnerCount?.non_verified ?? 0}</b><span className="text-[9px] font-semibold">Unverified</span></div></Card></div></Tooltip>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <PartnerListSearch onInputChange={(val) => handleSetTableData({ query: val, pageIndex: 1 })} value={tableData.query} />
        <div className="flex gap-2">
          <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
            <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>{columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}</div>
          </Dropdown>
          <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onRefreshData} /></Tooltip>
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>
            Filter
            {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}
          </Button>
          <Button icon={<TbCloudUpload />} onClick={handleOpenExportReasonModal} disabled={!allFilteredAndSortedData.length}>Export</Button>
        </div>
      </div>
      <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
      <DataTable selectable columns={filteredColumns} data={pageData} loading={isLoading} noData={pageData.length <= 0} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} />

      {/* --- MODIFIED: Filter Drawer UI --- */}
      <Drawer
        title="Partner Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={() => { onClearFilters(); closeFilterDrawer(); }}>Clear All</Button>
            <Button size="sm" variant="solid" form="filterPartnerForm" type="submit">Apply</Button>
          </div>
        }
      >
        <UiForm id="filterPartnerForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2">
            <UiFormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={statusOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="Industry Expertise"><Controller name="filterIndustryExpertise" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Expertise" options={industryExpertiseOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="Continent"><Controller name="filterContinent" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Continent" options={continentOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Country" options={countryOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="State"><Controller name="filterState" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select State" options={stateOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="City"><Controller name="filterCity" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select City" options={cityOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="KYC Verified"><Controller name="filterKycVerified" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={kycOptions} {...field} />} /></UiFormItem>
            <UiFormItem label="Created Date" className="col-span-2"><Controller name="filterCreatedDate" control={filterFormMethods.control} render={({ field }) => <DatePickerRange placeholder="Select Date Range" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />} /></UiFormItem>
          </div>
        </UiForm>
      </Drawer>

      <PartnerModals modalState={modalState} onClose={handleCloseModal} userOptions={getAllUserData} />
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
        <UiForm id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
          <UiFormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </UiFormItem>
        </UiForm>
      </ConfirmDialog>
      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
        <div className="flex justify-center items-center p-4">
          {imageToView ? <img src={`${imageToView}`} alt="Partner Logo Full View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} /> : <p>No image to display.</p>}
        </div>
      </Dialog>
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Partner"
        onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the partner "<strong>{itemToDelete?.partner_name}</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};


const PartnerListSelected = () => {
  const { selectedPartners, setSelectedPartners } = usePartnerList();
  const dispatch = useAppDispatch();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleConfirmDelete = async () => {
    if (!selectedPartners.length) return;
    setIsDeleting(true);
    try {
      const ids = selectedPartners.map((d) => d.id);
      await dispatch(deleteAllpartnerAction({ ids: ids.join(",") })).unwrap();
      toast.push(<Notification title="Partners Deleted" type="success" />);
      dispatch(getpartnerAction());
      setSelectedPartners([]);
    } catch (error: any) {
      toast.push(<Notification title="Failed to Delete" type="danger">{error.message}</Notification>);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationOpen(false);
    }
  };

  const handleSend = () => {
    setSendMessageLoading(true);
    // This is a mock send action
    setTimeout(() => {
      toast.push(<Notification type="success" title="Message Sent" />);
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedPartners([]);
    }, 1000);
  };


  if (selectedPartners.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="container mx-auto flex items-center justify-between">
          <span>
            <span className="flex items-center gap-2">
              <TbChecks className="text-lg text-primary-600" />
              <span className="font-semibold">{selectedPartners.length} Partners selected</span>
            </span>
          </span>
          <div className="flex items-center">
            <Button size="sm" className="ltr:mr-3 rtl:ml-3" customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50"} onClick={handleDelete}>Delete</Button>
            <Button size="sm" variant="solid" onClick={() => setSendMessageDialogOpen(true)}>Message</Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title="Remove Partners" onClose={() => setDeleteConfirmationOpen(false)} onConfirm={handleConfirmDelete} loading={isDeleting}>
        <p>Are you sure you want to remove these partners? This action can't be undone.</p>
      </ConfirmDialog>
      <Dialog isOpen={sendMessageDialogOpen} onClose={() => setSendMessageDialogOpen(false)}>
        <h5 className="mb-2">Send Message</h5>
        <div className="my-4">
          <Avatar.Group chained omittedAvatarTooltip className="mt-4" maxCount={4}>
            {selectedPartners.map((p) => (<Tooltip key={p.id} title={p.partner_name}><Avatar src={p.partner_logo || undefined} icon={<TbUserCircle />} /></Tooltip>))}
          </Avatar.Group>
        </div>
        <div className="my-4"><RichTextEditor /></div>
        <div className="text-right flex items-center gap-2">
          <Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>Cancel</Button>
          <Button size="sm" variant="solid" loading={sendMessageLoading} onClick={handleSend}>Send</Button>
        </div>
      </Dialog>
    </>
  );
};

const Partner = () => {
  const navigate = useNavigate();
  return (
    <PartnerListProvider>
      <Container>
        <AdaptiveCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h5>Partner</h5>
              <div className="flex flex-col md:flex-row gap-3">
                <Button variant="solid" icon={<TbPlus className="text-lg" />} onClick={() => navigate("/business-entities/create-partner")}>
                  Add New Partner
                </Button>
              </div>
            </div>
            <PartnerListTable />
          </div>
        </AdaptiveCard>
      </Container>
      <PartnerListSelected />
    </PartnerListProvider>
  );
};

export default Partner;