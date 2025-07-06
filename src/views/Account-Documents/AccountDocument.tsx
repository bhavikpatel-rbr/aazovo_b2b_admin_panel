import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import cloneDeep from "lodash/cloneDeep";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Card,
  Checkbox,
  DatePicker,
  Dialog,
  Drawer,
  Input,
  Select,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
} from "@/components/ui";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import {
  TbBell,
  TbBrandGoogleDrive,
  TbBrandWhatsapp,
  TbCalendarClock,
  TbChecklist,
  TbCloudDownload,
  TbCloudUpload,
  TbColumns,
  TbEye,
  TbFileAlert,
  TbFileCertificate,
  TbFileCheck,
  TbFileExcel,
  TbFilter,
  TbMailShare,
  TbPencil,
  TbPlus,
  TbReload,
  TbTagStarred,
  TbUser,
  TbX
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  CellContext,
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";
import {
  AccountDocumentListItem,
  AccountDocumentStatus,
  EnquiryType,
} from "./types";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addaccountdocAction,
  addNotificationAction, addScheduleAction,
  editaccountdocAction,
  getaccountdocAction,
  getAllCompany,
  getAllUsersAction,
  getbyIDaccountdocAction,
  getDocumentTypeAction,
  getEmployeesListingAction,
  getFormBuilderAction,
  getfromIDcompanymemberAction,
  getMemberAction,
  submitExportReasonAction
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { BsThreeDotsVertical } from "react-icons/bs";
import { shallowEqual, useSelector } from "react-redux";

// --- Define Types ---
export type SelectOption = { value: any; label: string };
export type ModalType = 'notification' | 'schedule' | 'view';
export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data: any; // Use `any` to accommodate both list item and full detail object
}
type FilterFormData = {
  filterStatus?: SelectOption[];
  doc_type?: SelectOption[];
  comp_doc?: SelectOption[];
};

// --- Zod Schema for Schedule Form ---
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Zod Schema for Add/Edit Document Form ---
const addEditDocumentSchema = z.object({
  company_document: z.string({ required_error: "Company Document is required." }).min(1, "Company Document is required."),
  document_type: z.number({ required_error: "Document Type is required." }).min(1, "Document Type is required."),
  document_number: z.string().min(1, "Document Number is required."),
  invoice_number: z.string().min(1, "Invoice Number is required."),
  form_id: z.number({ required_error: "Token Form is required." }),
  employee_id: z.number({ required_error: "Employee is required." }),
  member_id: z.number({ required_error: "Member is required." }),
  company_id: z.string({ required_error: "Company is required." }),
});
type AddEditDocumentFormData = z.infer<typeof addEditDocumentSchema>;


// --- CSV Exporter Utility ---
const ACCOUNT_DOC_CSV_HEADERS = [
  "Lead Number",
  "Company",
  "Member",
  "Status",
  "Document Form",
  "Document Number",
  "Invoice Number",
  "Assigned To",
  "Creation Date",
];
type AccountDocExportItem = {
  leadNumber: string;
  companyName: string;
  memberName: string;
  status: string;
  formType: string;
  documentNumber: string;
  invoiceNumber: string;
  userName: string;
  createdAtFormatted: string;
};
const ACCOUNT_DOC_CSV_KEYS_EXPORT: (keyof AccountDocExportItem)[] = [
  "leadNumber",
  "companyName",
  "memberName",
  "status",
  "formType",
  "documentNumber",
  "invoiceNumber",
  "userName",
  "createdAtFormatted",
];

function exportToCsv(filename: string, rows: AccountDocumentListItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }

  const transformedRows: AccountDocExportItem[] = rows.map((row) => ({
    leadNumber: row.leadNumber || "N/A",
    companyName: row.companyName || "N/A",
    memberName: row.memberName || "N/A",
    status: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : "N/A",
    formType: row.formType || "N/A",
    documentNumber: row.documentNumber || "N/A",
    invoiceNumber: row.invoiceNumber || "N/A",
    userName: row.userName || "N/A",
    createdAtFormatted: row.createdAt
      ? dayjs(row.createdAt).format('DD/MM/YYYY HH:mm')
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    ACCOUNT_DOC_CSV_HEADERS.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return ACCOUNT_DOC_CSV_KEYS_EXPORT.map((k) => {
          let cell: any = row[k as keyof AccountDocExportItem];
          if (cell === null || cell === undefined) {
            cell = "";
          } else {
            cell = String(cell).replace(/"/g, '""');
          }
          if (String(cell).search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      })
      .join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(
      <Notification title="Export Successful" type="success">
        Data exported to {filename}.
      </Notification>
    );
    return true;
  }

  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

const eventTypeOptions = [
  // Customer Engagement & Sales
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Demo', label: 'Product Demo' },
  { value: 'IntroCall', label: 'Introductory Call' },
  { value: 'FollowUpCall', label: 'Follow-up Call' },
  { value: 'QBR', label: 'Quarterly Business Review (QBR)' },
  { value: 'CheckIn', label: 'Customer Check-in' },
  { value: 'LogEmail', label: 'Log an Email' },

  // Project & Task Management
  { value: 'Milestone', label: 'Project Milestone' },
  { value: 'Task', label: 'Task' },
  { value: 'FollowUp', label: 'General Follow-up' },
  { value: 'ProjectKickoff', label: 'Project Kick-off' },

  // Customer Onboarding & Support
  { value: 'OnboardingSession', label: 'Onboarding Session' },
  { value: 'Training', label: 'Training Session' },
  { value: 'SupportCall', label: 'Support Call' },

  // General & Administrative
  { value: 'Reminder', label: 'Reminder' },
  { value: 'Note', label: 'Add a Note' },
  { value: 'FocusTime', label: 'Focus Time (Do Not Disturb)' },
  { value: 'StrategySession', label: 'Strategy Session' },
  { value: 'TeamMeeting', label: 'Team Meeting' },
  { value: 'PerformanceReview', label: 'Performance Review' },
  { value: 'Lunch', label: 'Lunch / Break' },
  { value: 'Appointment', label: 'Personal Appointment' },
  { value: 'Other', label: 'Other' },
  { value: 'ProjectKickoff', label: 'Project Kick-off' },
  { value: 'InternalSync', label: 'Internal Team Sync' },
  { value: 'ClientUpdateMeeting', label: 'Client Update Meeting' },
  { value: 'RequirementsGathering', label: 'Requirements Gathering' },
  { value: 'UAT', label: 'User Acceptance Testing (UAT)' },
  { value: 'GoLive', label: 'Go-Live / Deployment Date' },
  { value: 'ProjectSignOff', label: 'Project Sign-off' },
  { value: 'PrepareReport', label: 'Prepare Report' },
  { value: 'PresentFindings', label: 'Present Findings' },
  { value: 'TroubleshootingCall', label: 'Troubleshooting Call' },
  { value: 'BugReplication', label: 'Bug Replication Session' },
  { value: 'IssueEscalation', label: 'Escalate Issue' },
  { value: 'ProvideUpdate', label: 'Provide Update on Ticket' },
  { value: 'FeatureRequest', label: 'Log Feature Request' },
  { value: 'IntegrationSupport', label: 'Integration Support Call' },
  { value: 'DataMigration', label: 'Data Migration/Import Task' },
  { value: 'ColdCall', label: 'Cold Call' },
  { value: 'DiscoveryCall', label: 'Discovery Call' },
  { value: 'QualificationCall', label: 'Qualification Call' },
  { value: 'SendFollowUpEmail', label: 'Send Follow-up Email' },
  { value: 'LinkedInMessage', label: 'Log LinkedIn Message' },
  { value: 'ProposalReview', label: 'Proposal Review Meeting' },
  { value: 'ContractSent', label: 'Contract Sent' },
  { value: 'NegotiationCall', label: 'Negotiation Call' },
  { value: 'TrialSetup', label: 'Product Trial Setup' },
  { value: 'TrialCheckIn', label: 'Trial Check-in Call' },
  { value: 'WelcomeCall', label: 'Welcome Call' },
  { value: 'ImplementationSession', label: 'Implementation Session' },
  { value: 'UserTraining', label: 'User Training Session' },
  { value: 'AdminTraining', label: 'Admin Training Session' },
  { value: 'MonthlyCheckIn', label: 'Monthly Check-in' },
  { value: 'QBR', label: 'Quarterly Business Review (QBR)' },
  { value: 'HealthCheck', label: 'Customer Health Check' },
  { value: 'FeedbackSession', label: 'Feedback Session' },
  { value: 'RenewalDiscussion', label: 'Renewal Discussion' },
  { value: 'UpsellOpportunity', label: 'Upsell/Cross-sell Call' },
  { value: 'CaseStudyInterview', label: 'Case Study Interview' },
  { value: 'InvoiceDue', label: 'Invoice Due' },
  { value: 'SendInvoice', label: 'Send Invoice' },
  { value: 'PaymentReminder', label: 'Send Payment Reminder' },
  { value: 'ChaseOverduePayment', label: 'Chase Overdue Payment' },
  { value: 'ConfirmPayment', label: 'Confirm Payment Received' },
  { value: 'ContractRenewalDue', label: 'Contract Renewal Due' },
  { value: 'DiscussBilling', label: 'Discuss Billing/Invoice' },
  { value: 'SendQuote', label: 'Send Quote/Estimate' },
]

const accountDocumentStatusColor: Record<AccountDocumentStatus, string> = {
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  uploaded: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100",
  not_uploaded: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-100",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100",
  force_completed: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-100",
};

const enquiryTypeColor: Record<EnquiryType | "default", string> = {
  purchase: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  sales: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  service: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};

// --- Helper Components ---
const AccountDocumentActionColumn = ({ onDelete, onOpenModal, onView, onEdit, rowData }: any) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Fillup Form"><div className="text-xl cursor-pointer" onClick={() => navigate("/fill-up-form")}><TbChecklist /></div></Tooltip>
      <Tooltip title="Edit"><div className="text-xl cursor-pointer" onClick={onEdit}><TbPencil /></div></Tooltip>
      <Tooltip title="View"><div className="text-xl cursor-pointer" onClick={onView}><TbEye /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign to Task</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbMailShare size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbBrandWhatsapp size={18} /><span className="text-xs">Send Whatsapp</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbTagStarred size={18} /><span className="text-xs">Add to Active </span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2" onClick={() => onOpenModal('schedule', rowData)}><TbCalendarClock size={18} /><span className="text-xs">Add Schedule </span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2" onClick={() => onOpenModal('notification', rowData)}><TbBell size={18} /><span className="text-xs">Add Notification </span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbChecklist size={18} /><span className="text-xs">Verify Document </span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbCloudDownload size={18} /><span className="text-xs">Download Document </span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const AddNotificationDialog = ({ document, onClose, getAllUserDataOptions }: any) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const notificationSchema = z.object({ notification_title: z.string().min(3, "Title must be at least 3 characters long."), send_users: z.array(z.number()).min(1, "Please select at least one user."), message: z.string().min(10, "Message must be at least 10 characters long."), });
  type NotificationFormData = z.infer<typeof notificationSchema>;
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(notificationSchema), defaultValues: { notification_title: `Regarding Document: ${document.documentNumber}`, send_users: [], message: `This is a notification for document number "${document.documentNumber}" for company "${document.companyName}".` }, mode: 'onChange' });
  const onSend = async (formData: NotificationFormData) => { setIsLoading(true); const payload = { send_users: formData.send_users, notification_title: formData.notification_title, message: formData.message, module_id: String(document.id), module_name: 'AccountDocument', }; try { await dispatch(addNotificationAction(payload)).unwrap(); toast.push(<Notification type="success" title="Notification Sent Successfully!" />); onClose(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsLoading(false); } };
  return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Notify about: {document.documentNumber}</h5><UiForm onSubmit={handleSubmit(onSend)}><UiFormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></UiFormItem><UiFormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={getAllUserDataOptions} value={getAllUserDataOptions.filter((o: any) => field.value?.includes(o.value))} onChange={(options: any) => field.onChange(options?.map((o: any) => o.value) || [])} />)} /></UiFormItem><UiFormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></UiFormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button></div></UiForm></Dialog>);
};

const AddScheduleDialog: React.FC<any> = ({ document, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_title: `Follow-up on Document ${document.documentNumber}`,
      event_type: undefined,
      date_time: null as any,
      remind_from: null,
      notes: `Regarding document for ${document.companyName} (Lead: ${document.leadNumber})`,
    },
    mode: 'onChange',
  });
  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = {
      module_id: Number(document.id),
      module_name: 'AccountDocument',
      event_title: data.event_title,
      event_type: data.event_type,
      date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'),
      ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }),
      notes: data.notes || '',
    };
    try {
      await dispatch(addScheduleAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for document ${document.documentNumber}.`} />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for Document {document.documentNumber}</h5>
      <UiForm onSubmit={handleSubmit(onAddEvent)}>
        <UiFormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></UiFormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiFormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></UiFormItem>
          <UiFormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></UiFormItem>
        </div>
        <UiFormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></UiFormItem>
        <UiFormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></UiFormItem>
        <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div>
      </UiForm>
    </Dialog>
  );
};

const DetailItem = ({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start mb-3">
      <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 w-full sm:w-1/3 shrink-0">
        {label}
      </span>
      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-0 w-full">
        {children || value || <span className="italic text-gray-400">N/A</span>}
      </div>
    </div>
  );
};

// --- [NEW] Helper component for the redesigned view dialog ---
const InfoItem = ({
    icon,
    label,
    value,
    children,
    className,
}: {
    icon: React.ReactNode
    label: string
    value?: React.ReactNode
    children?: React.ReactNode
    className?: string
}) => {
    return (
        <div className={classNames('flex items-start gap-3', className)}>
            <div className="text-gray-400 mt-1">{icon}</div>
            <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {label}
                </p>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {children || value || (
                        <span className="italic text-gray-400">N/A</span>
                    )}
                </div>
            </div>
        </div>
    )
}

// --- [IMPROVED UI] ViewDocumentDialog Component ---
// --- [CORRECTED UI] ViewDocumentDialog Component ---
const ViewDocumentDialog = ({
    document,
    onClose,
}: {
    document: any
    onClose: () => void
}) => {
    if (!document) return null

    const {
        status,
        document_number,
        invoice_number,
        company_document,
        created_at,
        updated_at,
        created_by_user,
        updated_by_user,
        member,
        company,
        form,
        document: docTypeInfo,
    } = document

    const statusKey = (
        status?.toLowerCase().replace(/ /g, '_') ?? 'pending'
    ) as keyof typeof accountDocumentStatusColor
    const statusColor = accountDocumentStatusColor[statusKey] || 'bg-gray-100'
    const statusLabel = status?.replace(/_/g, ' ') || 'N/A'

    return (
        <Dialog
            isOpen={true}
            onClose={onClose}
            onRequestClose={onClose}
            width={900}
            bodyOpenClassName="overflow-y-hidden"
        >
            <div className="flex flex-col h-full">
                {/* --- Dialog Header --- */}
                <div className="flex justify-between items-start p-4 border-b dark:border-gray-700">
                    <div>
                        <div className="flex items-center gap-3">
                            <h4 className="font-bold text-xl mb-0">
                                {document_number}
                            </h4>
                            <Tag className={classNames(statusColor, 'capitalize')}>
                                {statusLabel}
                            </Tag>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Document details for{' '}
                            <span className="font-semibold text-gray-700 dark:text-gray-200">
                                {company?.company_name || member?.name || 'N/A'}
                            </span>
                        </p>
                    </div>
                    {/* <Button
                        shape="circle"
                        size="sm"
                        icon={<TbX />}
                        onClick={onClose}
                    /> */}
                </div>

                {/* --- Dialog Body --- */}
                <div className="p-6 max-h-[75vh] overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content (2/3 width) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <Card bodyClass="p-4">
                            <h6 className="font-semibold mb-4 border-b dark:border-gray-700 pb-3">
                                Document Information
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InfoItem
                                    icon={<TbFileCertificate size={20} />}
                                    label="Document Type"
                                    value={docTypeInfo?.name}
                                />
                                <InfoItem
                                    icon={<TbFileCheck size={20} />}
                                    label="Company Document"
                                    value={company_document}
                                />
                                <InfoItem
                                    icon={<TbFileExcel size={20} />}
                                    label="Invoice Number"
                                    value={invoice_number}
                                />
                                {form && (
                                    <InfoItem
                                        icon={<TbChecklist size={20} />}
                                        label="Token Form"
                                        value={form.form_name}
                                    />
                                )}
                            </div>
                        </Card>

                        {/* Client Details Card */}
                        {(company || member) && (
                            <Card bodyClass="p-4">
                                <h6 className="font-semibold mb-4 border-b dark:border-gray-700 pb-3">
                                    Client Information
                                </h6>
                                <div className="flex flex-col gap-6">
                                    {company && (
                                        <div>
                                            <h6 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                                                <TbBrandGoogleDrive size={18} />{' '}
                                                Company Details
                                            </h6>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                <DetailItem
                                                    label="Name"
                                                    value={company.company_name}
                                                />
                                                <DetailItem
                                                    label="Email"
                                                    value={
                                                        company.primary_email_id
                                                    }
                                                />
                                                <DetailItem
                                                    label="Phone"
                                                    value={`${
                                                        company.primary_contact_number_code ||
                                                        ''
                                                    } ${
                                                        company.primary_contact_number ||
                                                        ''
                                                    }`.trim()}
                                                />
                                                <DetailItem
                                                    label="GST"
                                                    value={company.gst_number}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {company && member && (
                                        <div className="border-t dark:border-gray-600 -mx-4 my-2"></div>
                                    )}
                                    {member && (
                                        <div className={company ? 'pt-0' : ''}>
                                            <h6 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                                                <TbUser size={18} /> Member
                                                Details
                                            </h6>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                                <DetailItem
                                                    label="Name"
                                                    value={member.name}
                                                />
                                                <DetailItem
                                                    label="Email"
                                                    value={member.email}
                                                />
                                                <DetailItem
                                                    label="Phone"
                                                    value={`${
                                                        member.number_code || ''
                                                    } ${
                                                        member.number || ''
                                                    }`.trim()}
                                                />
                                                <DetailItem
                                                    label="Business Type"
                                                    value={
                                                        member.business_type
                                                    }
                                                />
                                                <DetailItem
                                                    label="Interested In"
                                                    value={
                                                        member.interested_in
                                                    }
                                                />
                                                {!company && (
                                                    <DetailItem
                                                        label="Company Name"
                                                        value={
                                                            member?.company_actual ||
                                                            member?.company_temp
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar (1/3 width) */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <Card bodyClass="p-4">
                            <h6 className="font-semibold mb-4 border-b dark:border-gray-700 pb-3">
                                Ownership & History
                            </h6>
                            <div className="flex flex-col gap-5">
                                <InfoItem
                                    icon={<TbUser size={20} />}
                                    label="Assigned To"
                                    value={created_by_user?.name}
                                />
                                <InfoItem
                                    icon={<TbUser size={20} />}
                                    label="Created By"
                                    value={created_by_user?.name}
                                />
                                <InfoItem
                                    icon={<TbCalendarClock size={20} />}
                                    label="Created On"
                                >
                                    {dayjs(created_at).format(
                                        'DD MMM YYYY, hh:mm A',
                                    )}
                                </InfoItem>
                                <InfoItem
                                    icon={<TbPencil size={20} />}
                                    label="Last Updated By"
                                    value={updated_by_user?.name}
                                />
                                <InfoItem
                                    icon={<TbCalendarClock size={20} />}
                                    label="Last Updated On"
                                >
                                    {dayjs(updated_at).format(
                                        'DD MMM YYYY, hh:mm A',
                                    )}
                                </InfoItem>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Dialog>
    )
}


// --- Add/Edit Document Drawer Component ---
const AddEditDocumentDrawer = ({ isOpen, onClose, editingId }: any) => {
  const dispatch = useAppDispatch();
  const title = editingId ? 'Edit Document' : 'Add New Document';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // --- MODIFICATION: Added `setValue` to reset member field ---
  const { control, handleSubmit, reset, setValue, formState: { errors, isValid } } = useForm<AddEditDocumentFormData>({
    resolver: zodResolver(addEditDocumentSchema),
    mode: 'onChange',
    defaultValues: {
      company_document: undefined,
      document_type: undefined,
      document_number: '',
      invoice_number: '',
      form_id: undefined,
      employee_id: undefined,
      member_id: undefined,
      company_id: undefined,
    },
  });


  const { DocumentTypeData = [], formsData: tokenForm = [], EmployeesList = [], AllCompanyData = [], getfromIDcompanymemberData = [] } = useSelector(masterSelector);

  const DocumentTypeDataOptions = DocumentTypeData?.map((p: any) => ({
    value: p.id,
    label: p.name,
  }));

  const tokenFormDataOptions = tokenForm?.map((p: any) => ({
    value: p.id,
    label: p.form_title,
  }));

  const EmployyDataOptions = EmployeesList.data?.data?.map((p: any) => ({
    value: p.id,
    label: p.name,
  }));

  const AllCompanyDataOptions = AllCompanyData?.map((p: any) => ({
    value: String(p.id),
    label: p.company_name,
  }));

  const companyMemberOptions = useMemo(() =>
    getfromIDcompanymemberData?.map((p: any) => ({
      value: p.id,
      label: p.name,
    })) || [],
    [getfromIDcompanymemberData]);


  useEffect(() => {
    dispatch(getDocumentTypeAction())
    dispatch(getFormBuilderAction())
    dispatch(getEmployeesListingAction())
    dispatch(getAllCompany())
  }, [dispatch])

  useEffect(() => {
    if (isOpen && editingId) {
      setIsLoadingData(true);
      dispatch(getbyIDaccountdocAction(editingId))
        .unwrap()
        .then((data) => {
          const companyId = data?.data?.company_id;
          const formData = {
            company_document: data?.data?.company_document,
            document_type: data?.data?.document_type,
            document_number: data?.data?.document_number,
            invoice_number: data?.data?.invoice_number,
            form_id: data?.data?.form_id,
            employee_id: data?.data?.employee_id,
            member_id: data?.data?.member_id,
            company_id: companyId ? String(companyId) : undefined,
          };
          reset(formData);

          if (companyId) {
            dispatch(getfromIDcompanymemberAction(companyId));
          }
        })
        .catch((err: any) => {
          toast.push(<Notification type="danger" title="Fetch Error" children={err?.message || 'Could not fetch document details.'} />);
          onClose();
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (isOpen && !editingId) {
      reset({
        company_document: undefined,
        document_type: undefined,
        document_number: "",
        invoice_number: "",
        form_id: undefined,
        employee_id: undefined,
        member_id: undefined,
        company_id: undefined,
      });
    }
  }, [isOpen, editingId, dispatch, reset]);

  const onSave = async (data: AddEditDocumentFormData) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await dispatch(editaccountdocAction({ id: editingId, ...data })).unwrap();
        toast.push(<Notification type="success" title="Document Updated" />);
      } else {
        await dispatch(addaccountdocAction(data)).unwrap();
        toast.push(<Notification type="success" title="Document Added" />);
      }
      dispatch(getaccountdocAction()); // Refresh the main table
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title={editingId ? 'Update Failed' : 'Add Failed'} children={error?.message || 'An unknown error occurred.'} />);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer title={title} width={520} isOpen={isOpen} onClose={onClose} onRequestClose={onClose}
      footer={
        <div className="text-right w-full">
          <Button size="sm" className="mr-2" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button size="sm" variant="solid" form="addEditDocumentForm" type="submit" loading={isSubmitting || isLoadingData} disabled={!isValid || isSubmitting || isLoadingData}>Save</Button>
        </div>
      }>
      {isLoadingData ? <div className="p-4 text-center">Loading...</div> : (
        <UiForm id="addEditDocumentForm" onSubmit={handleSubmit(onSave)}>
          <UiFormItem label="Company Document" invalid={!!errors.company_document} errorMessage={errors.company_document?.message}>
            <Controller control={control} name="company_document" render={({ field }) => (
              <Select {...field} placeholder="Select Company Document" options={[{ label: "Aazovo", value: "Aazovo" }, { label: "OMC", value: "OMC" }]}
                value={[{ label: "Aazovo", value: "Aazovo" }, { label: "OMC", value: "OMC" }].find(o => o.value === field.value)}
                onChange={(opt: any) => field.onChange(opt?.value)} />
            )} />
          </UiFormItem>
          <UiFormItem label="Company" invalid={!!errors.company_id} errorMessage={errors.company_id?.message}>
            <Controller control={control} name="company_id" render={({ field }) => (
              <Select {...field} placeholder="Select Company"
                options={AllCompanyDataOptions}
                value={AllCompanyDataOptions?.find(o => o.value === field.value)}
                onChange={(opt: any) => {
                  field.onChange(opt?.value);
                  if (opt?.value) {
                    dispatch(getfromIDcompanymemberAction(opt.value));
                  }
                  setValue('member_id', 0, { shouldValidate: true });
                }} />
            )} />
          </UiFormItem>
          <UiFormItem label="Document Type" invalid={!!errors.document_type} errorMessage={errors.document_type?.message}>
            <Controller control={control} name="document_type" render={({ field }) => (
              <Select {...field}
                placeholder="Select Document Type"
                options={DocumentTypeDataOptions}
                value={DocumentTypeDataOptions?.find(o => o.value === field.value)}
                onChange={(opt: any) => field.onChange(opt?.value)}
              />
            )} />
          </UiFormItem>
          <div className="md:grid grid-cols-2 gap-3">
            <UiFormItem label="Document Number" invalid={!!errors.document_number} errorMessage={errors.document_number?.message}>
              <Controller control={control} name="document_number" render={({ field }) => (<Input type="text" placeholder="Enter Document Number" {...field} />)} />
            </UiFormItem>
            <UiFormItem label="Invoice Number" invalid={!!errors.invoice_number} errorMessage={errors.invoice_number?.message}>
              <Controller control={control} name="invoice_number" render={({ field }) => (<Input type="text" placeholder="Enter Invoice Number" {...field} />)} />
            </UiFormItem>
          </div>
          <UiFormItem label="Token Form" invalid={!!errors.form_id} errorMessage={errors.form_id?.message}>
            <Controller control={control} name="form_id" render={({ field }) => (
              <Select {...field} placeholder="Select Form Type"
                options={tokenFormDataOptions}
                value={tokenFormDataOptions?.find(o => o.value === field.value)}
                onChange={(opt: any) => field.onChange(opt?.value)}
              />
            )} />
          </UiFormItem>
          <UiFormItem label="Employee" invalid={!!errors.employee_id} errorMessage={errors.employee_id?.message}>
            <Controller control={control} name="employee_id" render={({ field }) => (
              <Select {...field} placeholder="Select Employee"
                options={EmployyDataOptions}
                value={EmployyDataOptions?.find(o => o.value === field.value)}
                onChange={(opt: any) => field.onChange(opt?.value)}
              />
            )} />
          </UiFormItem>
          <UiFormItem label="Member" invalid={!!errors.member_id} errorMessage={errors.member_id?.message}>
            <Controller control={control} name="member_id" render={({ field }) => (
              <Select {...field} placeholder="Select Member"
                options={companyMemberOptions}
                value={companyMemberOptions?.find(o => o.value === field.value)}
                onChange={(opt: any) => field.onChange(opt?.value)}
              />
            )} />
          </UiFormItem>
        </UiForm>
      )}
    </Drawer>
  );
};


const AccountDocumentModals = ({ modalState, onClose, getAllUserDataOptions }: any) => {
  const { type, data: document, isOpen } = modalState;
  if (!isOpen || !document) return null;
  switch (type) {
    case 'notification': return <AddNotificationDialog document={document} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
    case 'schedule': return <AddScheduleDialog document={document} onClose={onClose} />;
    case 'view': return <ViewDocumentDialog document={document} onClose={onClose} />;
    default: return null;
  }
};

const AccountDocumentSearch = React.forwardRef<any, any>((props, ref) => <DebouceInput {...props} ref={ref} />);
AccountDocumentSearch.displayName = "AccountDocumentSearch";

const AccountDocumentTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: any) => {
  const isColumnVisible = (colId: string) => filteredColumns.some((c: any) => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      const originalColumn = columns.find((c: any) => (c.id || c.accessorKey) === colId);
      if (originalColumn) {
        setFilteredColumns((prev: any) => {
          const newCols = [...prev, originalColumn];
          newCols.sort((a, b) => {
            const indexA = columns.findIndex((c: any) => (c.id || c.accessorKey) === (a.id || a.accessorKey));
            const indexB = columns.findIndex((c: any) => (c.id || c.accessorKey) === (b.id || b.accessorKey));
            return indexA - indexB;
          });
          return newCols;
        });
      }
    } else {
      setFilteredColumns((prev: any) => prev.filter((c: any) => (c.id || c.accessorKey) !== colId));
    }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow"><AccountDocumentSearch onChange={onSearchChange} placeholder="Quick Search..." /></div>
      <div className="flex gap-1">
        <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
          <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
            {columns.map((col: any) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}
          </div>
        </Dropdown>
        <Button icon={<TbReload />} onClick={onClearFilters}></Button>
        <Button icon={<TbFilter />} onClick={onFilter}>Filter {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
        <Button icon={<TbCloudUpload />} onClick={onExport}>Export</Button>
      </div>
    </div>
  )
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: any) => {
  const allFilters = [
    ...(filterData.filterStatus || []).map((f: SelectOption) => ({ key: 'filterStatus', label: `Status: ${f.label}`, value: f })),
    ...(filterData.doc_type || []).map((f: SelectOption) => ({ key: 'doc_type', label: `Doc Type: ${f.label}`, value: f })),
    ...(filterData.comp_doc || []).map((f: SelectOption) => ({ key: 'comp_doc', label: `Company Doc: ${f.label}`, value: f })),
  ];

  if (allFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {allFilters.map(filter => (
        <Tag key={`${filter.key}-${filter.value.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">
          {filter.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key, filter.value)} />
        </Tag>
      ))}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};

const AccountDocumentTable = (props: any) => <DataTable {...props} />;

const AccountDocumentSelectedFooter = ({ selectedItems, onDeleteSelected }: any) => {
  const [open, setOpen] = useState(false); if (!selectedItems || selectedItems.length === 0) return null; return (<><StickyFooter className="p-4 border-t" stickyClass="-mx-4 sm:-mx-8"><div className="flex items-center justify-between"><span>{selectedItems.length} selected</span><Button size="sm" color="red-500" onClick={() => setOpen(true)}>Delete Selected</Button></div></StickyFooter><ConfirmDialog isOpen={open} type="danger" onConfirm={() => { onDeleteSelected(); setOpen(false); }} onClose={() => setOpen(false)} title="Delete Selected"><p>Sure?</p></ConfirmDialog></>);
};

// --- Main Account Document Component ---
const AccountDocument = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { getAllUserData = [], getaccountdoc } = useSelector(masterSelector, shallowEqual)

  const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filterForm = useForm<FilterFormData>();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AccountDocumentListItem | null>(null);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "createdAt" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<AccountDocumentListItem[]>([]);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  useEffect(() => { dispatch(getAllUsersAction()); dispatch(getaccountdocAction()); }, [dispatch]);

  const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((b: any) => ({ value: b.id, label: b.name })) : [], [getAllUserData]);
  const handleOpenModal = useCallback((type: ModalType, itemData: AccountDocumentListItem) => { setModalState({ isOpen: true, type, data: itemData }); }, []);
  const handleCloseModal = useCallback(() => { setModalState({ isOpen: false, type: null, data: null }); }, []);

  const handleOpenAddDrawer = () => {
    setEditingId(null);
    setIsAddEditDrawerOpen(true);
  };

  const handleOpenEditDrawer = (rowData: AccountDocumentListItem) => {
    setEditingId(rowData.id);
    setIsAddEditDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsAddEditDrawerOpen(false);
    setEditingId(null);
  };

  const handleViewClick = useCallback((item: AccountDocumentListItem) => {
    const fullItemData = getaccountdoc?.data?.find(
      (d: any) => String(d.id) === item.id,
    );
    if (fullItemData) {
      setModalState({ isOpen: true, type: 'view', data: fullItemData });
    } else {
      toast.push(
        <Notification type="danger" title="Error">
          Could not find document details.
        </Notification>
      );
    }
  }, [getaccountdoc?.data]);

  const filterOptions = useMemo(() => {
    const rawData = getaccountdoc?.data || [];
    const uniqueDocTypes = new Set<string>();
    const uniqueCompanyDocs = new Set<string>();

    rawData.forEach((item: any) => {
      const formType = item.form?.form_name;
      const companyDoc = item.company_document;

      if (formType) {
        uniqueDocTypes.add(formType);
      }
      if (companyDoc) {
        uniqueCompanyDocs.add(companyDoc);
      }
    });

    const docTypeOptions = Array.from(uniqueDocTypes)
      .sort()
      .map(doc => ({ label: doc, value: doc }));

    const companyDocOptions = Array.from(uniqueCompanyDocs)
      .sort()
      .map(doc => ({ label: doc, value: doc }));

    const statusOptions = Object.keys(accountDocumentStatusColor).map(s => ({ label: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' '), value: s }));

    return {
      docTypeOptions,
      companyDocOptions,
      statusOptions,
    };
  }, [getaccountdoc]);

  const { pageData, total, allFilteredAndSortedData } = useMemo((): { pageData: AccountDocumentListItem[]; total: number; allFilteredAndSortedData: AccountDocumentListItem[]; } => {
    const rawData = getaccountdoc?.data || [];

    const mappedData: AccountDocumentListItem[] = rawData.map((item: any) => ({
      id: String(item.id),
      status: (item.status?.toLowerCase() || 'pending') as AccountDocumentStatus,
      leadNumber: item.lead_id ? `LD-${item.lead_id}` : 'N/A',
      enquiryType: item.member?.interested_in?.toLowerCase().includes('sell') ? 'sales' : 'purchase',
      memberName: item.member?.name || 'Unknown Member',
      companyId: item.company_id ? String(item.company_id) : null,
      companyName: item.company?.company_name || item.member?.company_actual || item.member?.company_temp || item.member?.name || 'Unknown Company',
      userId: item.created_by_user?.employee_id || String(item.created_by_user?.id) || null,
      userName: item.created_by_user?.name || 'System',
      companyDocumentType: item.company_document || 'N/A',
      documentType: String(item.document_type),
      documentNumber: item.document_number || 'N/A',
      invoiceNumber: item.invoice_number || 'N/A',
      formType: item.form?.form_name || 'N/A',
      createdAt: item.created_at,
    }));

    let processedData: AccountDocumentListItem[] = cloneDeep(mappedData);

    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(query))
      );
    }

    if (filterCriteria.filterStatus?.length) {
      const selectedStatuses = new Set(filterCriteria.filterStatus.map((s: SelectOption) => s.value));
      processedData = processedData.filter(item => selectedStatuses.has(item.status));
    }
    if (filterCriteria.comp_doc?.length) {
      const selectedCompDocs = new Set(filterCriteria.comp_doc.map((s: SelectOption) => s.value));
      processedData = processedData.filter(item => selectedCompDocs.has(item.companyDocumentType));
    }
    if (filterCriteria.doc_type?.length) {
      const selectedDocTypes = new Set(filterCriteria.doc_type.map((s: SelectOption) => s.value));
      processedData = processedData.filter(item => selectedDocTypes.has(item.formType));
    }


    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof AccountDocumentListItem] as any;
        let bVal = b[key as keyof AccountDocumentListItem] as any;
        if (key === "createdAt" || key === "updatedAt") {
          return order === "asc" ? dayjs(aVal).valueOf() - dayjs(bVal).valueOf() : dayjs(bVal).valueOf() - dayjs(aVal).valueOf();
        }
        if (typeof aVal === "number") {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
        return order === "asc" ? String(aVal ?? "").localeCompare(String(bVal ?? "")) : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }

    const currentTotal = processedData.length;
    const { pageIndex = 1, pageSize = 10 } = tableData;
    const startIndex = (pageIndex - 1) * pageSize;

    return {
      pageData: processedData.slice(startIndex, startIndex + pageSize),
      total: currentTotal,
      allFilteredAndSortedData: processedData,
    };
  }, [getaccountdoc, tableData, filterCriteria]);

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Account_Documents";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `${moduleName}_export_${timestamp}.csv`;
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: moduleName,
          file_name: fileName,
        })
      ).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );
      exportToCsv(fileName, allFilteredAndSortedData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Failed to Submit Reason"
          type="danger"
          children={error.message || "An error occurred while submitting the reason."}
        />
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };


  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handleDeleteClick = useCallback((item: AccountDocumentListItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handlePageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query.target.value, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: AccountDocumentListItem) => setSelectedItems((prev) => checked ? prev.some((i) => i.id === row.id) ? prev : [...prev, row] : prev.filter((i) => i.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<AccountDocumentListItem>[]) => { const originals = currentRows.map((r) => r.original); if (checked) setSelectedItems((prev) => { const oldIds = new Set(prev.map((i) => i.id)); return [...prev, ...originals.filter((o) => !oldIds.has(o.id))]; }); else { const currentIds = new Set(originals.map((o) => o.id)); setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id))); } }, []);
  const openFilterDrawer = useCallback(() => setIsFilterDrawerOpen(true), []);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);


  const onApplyFilters = (data: FilterFormData) => {
    const newCriteria = Object.entries(data).reduce((acc, [key, value]) => {
      if (value && (!Array.isArray(value) || value.length > 0)) {
        acc[key as keyof FilterFormData] = value;
      }
      return acc;
    }, {} as FilterFormData);

    setFilterCriteria(newCriteria);
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    setFilterCriteria({});
    filterForm.reset({});
    handleSetTableData({ pageIndex: 1, query: "" });
  };

  const handleCardClick = (status: AccountDocumentStatus) => {
    const statusOption: SelectOption[] = [{ value: status, label: status.charAt(0).toUpperCase() + status.slice(1) }];
    const newCriteria: FilterFormData = { filterStatus: statusOption };
    setFilterCriteria(newCriteria);
    filterForm.reset(newCriteria);
    handleSetTableData({ pageIndex: 1, query: "" });
  };

  const handleRemoveFilter = (key: keyof FilterFormData, valueToRemove: SelectOption) => {
    setFilterCriteria((prev) => {
      const newCriteria = cloneDeep(prev);
      const currentValues = newCriteria[key];

      if (currentValues) {
        const updatedValues = currentValues.filter(item => item.value !== valueToRemove.value);

        if (updatedValues.length > 0) {
          newCriteria[key] = updatedValues;
        } else {
          delete newCriteria[key];
        }
      }
      filterForm.reset(newCriteria);
      return newCriteria;
    });
  };

  const columns: ColumnDef<AccountDocumentListItem>[] = useMemo(() => [
    { header: "Status", accessorKey: "status", size: 120, cell: (props: CellContext<AccountDocumentListItem, any>) => (<Tag className={`${accountDocumentStatusColor[props.row.original.status as keyof typeof accountDocumentStatusColor] || 'bg-gray-100'} capitalize px-2 py-1 text-xs`}>{props.row.original.status.replace(/_/g, ' ')}</Tag>), },
    { header: "Lead / Enquiry", accessorKey: "leadNumber", size: 130, cell: (props) => { const { leadNumber, enquiryType } = props.row.original; return (<div className="flex flex-col gap-0.5 text-xs"><span>{leadNumber}</span><div><Tag className={`${enquiryTypeColor[enquiryType as keyof typeof enquiryTypeColor] || enquiryTypeColor.default} capitalize px-2 py-1 text-xs`}>{enquiryType}</Tag></div></div>); }, },
    { header: "Member / Company", accessorKey: "memberName", size: 220, cell: (props: CellContext<AccountDocumentListItem, any>) => { const { companyName, memberName, userName, companyDocumentType } = props.row.original; return (<div className="flex flex-col gap-0.5 text-xs"><b>{companyName}</b><span>Member: {memberName}</span><span>Assigned To: {userName}</span><div><b>Company Document: </b><span>{companyDocumentType}</span></div></div>); }, },
    { header: "Document Details", size: 220, cell: (props) => { const { documentType, documentNumber, invoiceNumber, formType, createdAt } = props.row.original; return (<div className="flex flex-col gap-0.5 text-xs"><div><b>Doc Type ID: </b><span>{documentType}</span></div><div><b>Doc No: </b><span>{documentNumber}</span></div><div><b>Invoice No: </b><span>{invoiceNumber}</span></div><div><b>Form: </b><span>{formType}</span></div><b>{dayjs(createdAt).format("DD MMM, YYYY HH:mm")}</b></div>); }, },
    { header: "Actions", id: "actions", size: 160, meta: { HeaderClass: "text-center" }, cell: (props: CellContext<AccountDocumentListItem, any>) => (<AccountDocumentActionColumn onDelete={() => handleDeleteClick(props.row.original)} onOpenModal={handleOpenModal} onEdit={() => handleOpenEditDrawer(props.row.original)} onView={() => handleViewClick(props.row.original)} rowData={props.row.original} />), },
  ], [handleDeleteClick, handleOpenModal, handleViewClick, handleOpenEditDrawer]);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<AccountDocumentListItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterStatus?.length) count++;
    if (filterCriteria.doc_type?.length) count++;
    if (filterCriteria.comp_doc?.length) count++;
    return count;
  }, [filterCriteria]);

  const counts = useMemo(() => {
    const apiCounts = getaccountdoc?.counts || {};
    return {
      total: apiCounts.total || 0,
      pending: apiCounts.pending || 0,
      completed: apiCounts.completed || 0,
      active: apiCounts.active || 0,
      aazovo: apiCounts.aazovo_docs || 0,
      omc: apiCounts.omc_docs || 0,
    };
  }, [getaccountdoc]);

  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"><h5 className="mb-2 sm:mb-0">Account Document</h5><Button variant="solid" icon={<TbPlus />} className="px-5" onClick={handleOpenAddDrawer}>Set New Document</Button></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
            <Tooltip title="Click to show all documents"><div onClick={onClearFilters}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-gray-200 dark:border-gray-600")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-200"><TbBrandGoogleDrive size={24} /></div><div><h6 className="text-gray-700 dark:text-gray-100">{counts.total}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show pending documents"><div onClick={() => handleCardClick('pending')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-orange-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbFileAlert size={24} /></div><div><h6 className="text-orange-500">{counts.pending}</h6><span className="font-semibold text-xs">Pending</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show completed documents"><div onClick={() => handleCardClick('completed')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-300")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbFileCertificate size={24} /></div><div><h6 className="text-green-500">{counts.completed}</h6><span className="font-semibold text-xs">Completed</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show active documents"><div onClick={() => handleCardClick('active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbTagStarred size={24} /></div><div><h6 className="text-blue-500">{counts.active}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
            <Tooltip title="Total Aazovo documents"><div className="cursor-default"><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-300")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbFileCheck size={24} /></div><div><h6 className="text-violet-500">{counts.aazovo}</h6><span className="font-semibold text-xs">Aazovo Docs</span></div></Card></div></Tooltip>
            <Tooltip title="Total OMC documents"><div className="cursor-default"><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-pink-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbFileExcel size={24} /></div><div><h6 className="text-pink-500">{counts.omc}</h6><span className="font-semibold text-xs">OMC Docs</span></div></Card></div></Tooltip>
          </div>
          <AccountDocumentTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onClearFilters={onClearFilters} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4 flex-grow overflow-y-auto"><AccountDocumentTable selectable columns={filteredColumns} data={pageData} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number, }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /></div>
        </AdaptiveCard>
      </Container>
      <AccountDocumentSelectedFooter selectedItems={selectedItems} />
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete" onClose={() => setSingleDeleteConfirmOpen(false)} loading={isProcessingDelete} onCancel={() => setSingleDeleteConfirmOpen(false)}><p>Delete <strong>{itemToDelete?.documentNumber}</strong>?</p></ConfirmDialog>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" type="button" onClick={() => { onClearFilters(); closeFilterDrawer(); }}>Clear All</Button>
            <Button size="sm" variant="solid" form="filterAccountDocumentForm" type="submit">Apply</Button>
          </div>
        }>
        <UiForm id="filterAccountDocumentForm" onSubmit={filterForm.handleSubmit(onApplyFilters)}>
          <UiFormItem label="Status">
            <Controller
              control={filterForm.control}
              name="filterStatus"
              render={({ field }) => (
                <Select {...field} placeholder="Select Status" isMulti options={filterOptions.statusOptions} />
              )}
            />
          </UiFormItem>
          <UiFormItem label="Document Type">
            <Controller
              control={filterForm.control}
              name="doc_type"
              render={({ field }) => (
                <Select {...field} placeholder="Select Document Type" isMulti options={filterOptions.docTypeOptions} />
              )}
            />
          </UiFormItem>
          <UiFormItem label="Company Document">
            <Controller
              control={filterForm.control}
              name="comp_doc"
              render={({ field }) => (
                <Select {...field} placeholder="Select Company Document" isMulti options={filterOptions.companyDocOptions} />
              )}
            />
          </UiFormItem>
        </UiForm>
      </Drawer>

      <AddEditDocumentDrawer
        isOpen={isAddEditDrawerOpen}
        onClose={handleDrawerClose}
        editingId={editingId}
      />

      <AccountDocumentModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={getAllUserDataOptions} />
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(
          handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <UiForm
          id="exportReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <UiFormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={
              exportReasonFormMethods.formState.errors.reason?.message
            }
          >
            <Controller
              name="reason"
              control={exportReasonFormMethods.control}
              render={({ field }) => (
                <Input
                  textArea
                  {...field}
                  placeholder="Enter reason..."
                  rows={3}
                />
              )}
            />
          </UiFormItem>
        </UiForm>
      </ConfirmDialog>
    </>
  );
};
export default AccountDocument;