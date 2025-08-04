import axiosInstance from "@/services/api/api";
import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
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
  Skeleton,
  Table,
  Select as UiSelect,
} from "@/components/ui";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbAlertTriangle,
  TbBell,
  TbBox,
  TbBrandWhatsapp,
  TbBulb,
  TbCalendar,
  TbCalendarEvent,
  TbCheck,
  TbCircleCheck,
  TbClipboardText,
  TbCloudUpload,
  TbColumns,
  TbDownload,
  TbEye,
  TbFileDescription,
  TbFileInvoice,
  TbFileText,
  TbFileZip,
  TbFilter,
  TbFlag,
  TbFlagX,
  TbInfoCircle,
  TbListDetails,
  TbMail,
  TbPencil,
  TbPennant,
  TbPlayerPlay,
  TbPlus,
  TbReload,
  TbRocket,
  TbSearch,
  TbSubtask,
  TbTagStarred,
  TbTrophy,
  TbUserSearch,
  TbX
} from "react-icons/tb";

// Types
import type { OnSortParam } from "@/@types/common";
import { CellContext, ColumnDef, Row } from "@tanstack/react-table";
import type { EnquiryType, LeadIntent, LeadStatus } from "./types";
import {
  enquiryTypeOptions as enquiryTypeOptionsConst,
  leadIntentOptions as leadIntentOptionsConst,
  leadStatusOptions as leadStatusOptionsConst,
} from "./types";

// Redux
import { DataTable } from "@/components/shared";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addAllActionAction,
  addNotificationAction,
  addScheduleAction,
  deleteAllLeadsAction,
  deleteLeadAction,
  editLeadAction,
  getAllUsersAction,
  getFormBuilderAction,
  getLeadAction,
  getLeadOpportunitiesAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "localforage";
import { shallowEqual, useSelector } from "react-redux";


// --- START: NEW COMPONENT FOR PENDING LEAD DETAILS VIEW MODAL ---
const PendingLeadViewModal = ({
  isOpen,
  onClose,
  leadData
}: {
  isOpen: boolean;
  onClose: () => void;
  leadData: any | null;
}) => {
  if (!isOpen || !leadData || !leadData.lead) return null;

  const lead = leadData.lead;
  const salesForm = leadData.sales_form;

  const renderDetail = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row py-2 border-b border-gray-200 dark:border-gray-700">
      <dt className="sm:w-1/3 font-semibold text-gray-600 dark:text-gray-300">{label}</dt>
      <dd className="sm:w-2/3 mt-1 sm:mt-0 text-gray-800 dark:text-gray-100 break-words">{value ?? 'N/A'}</dd>
    </div>
  );

  const renderSalesFormDetails = (formData: any) => {
    if (!formData || Object.keys(formData).length === 0) return <p className="text-sm text-gray-500">No form data available.</p>;

    return Object.entries(formData).map(([sectionKey, sectionValue]: [string, any]) => (
      <div key={sectionKey} className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
        <h6 className="font-semibold capitalize border-b pb-1 mb-2">{sectionKey.replace(/_/g, ' ')}</h6>
        {Object.entries(sectionValue).map(([fieldKey, fieldValue]) => (
          <div key={fieldKey} className="text-sm py-1">
            <span className="font-medium capitalize">{fieldKey.replace(/_/g, ' ')}:</span>
            <span className="ml-2 text-gray-700 dark:text-gray-200">
              {Array.isArray(fieldValue) ? fieldValue.join(', ') : String(fieldValue)}
            </span>
          </div>
        ))}
      </div>
    ));
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={800} bodyOpenClassName="overflow-hidden">
      <div className="flex flex-col h-full max-h-[85vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h5 className="mb-0">Lead Details: {lead.lead_number || `LD-${lead.id}`}</h5>
        </div>
        <div className="flex-grow overflow-y-auto px-6 py-4 custom-scrollbar">
          <Card bodyClass="p-4">
            <h6 className="mb-2 text-base font-semibold">Lead Information</h6>
            <dl>
              {renderDetail('Lead Number', lead.lead_number || `LD-${lead.id.toString().padStart(5, '0')}`)}
              {renderDetail('Product', lead.product?.name)}
              {renderDetail('Quantity', lead.qty)}
              {renderDetail('Target Price', lead.target_price ? `$${lead.target_price}` : 'N/A')}
              {renderDetail('Status', <Tag className={`${leadStatusColor[lead.status] || leadStatusColor.default} capitalize`}>{lead.status}</Tag>)}
              {renderDetail('Intent', <Tag className="capitalize">{lead.lead_intent}</Tag>)}
              {renderDetail('Created At', dayjs(lead.created_at).format('DD MMM YYYY, h:mm A'))}
            </dl>
          </Card>

          <Card bodyClass="p-4" className="mt-4">
            <h6 className="mb-2 text-base font-semibold">Member Information</h6>
            <dl>
              {renderDetail('Buyer', <span>{lead.lead_info?.buyer?.name} <span className="text-gray-500">({lead.lead_info?.buyer?.member_code})</span></span>)}
              {renderDetail('Supplier', <span>{lead.lead_info?.seller?.name} <span className="text-gray-500">({lead.lead_info?.seller?.member_code})</span></span>)}
            </dl>
          </Card>

          <Card bodyClass="p-4" className="mt-4">
            <h6 className="mb-2 text-base font-semibold">Form Submission Details</h6>
            {renderSalesFormDetails(salesForm)}
          </Card>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-right">
          <Button variant="solid" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Dialog>
  );
};
// --- END: NEW COMPONENT ---

// --- START: NEW COMPONENT FOR PENDING LEADS MODAL ---
const PendingLeadsModal = ({
  isOpen,
  onClose,
  onActionSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  onActionSuccess: () => void;
}) => {
  const [pendingLeads, setPendingLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<{ id: string | number | null, type: 'approve' | 'reject' | null }>({ id: null, type: null });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const fetchPendingLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/sales-form?per_page=99999&status=Pending');
      setPendingLeads(response.data?.data?.data || []);
    } catch (error) {
      toast.push(<Notification type="danger" title="Error">Failed to fetch pending leads.</Notification>);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPendingLeads();
    }
  }, [isOpen, fetchPendingLeads]);

  const handleAction = async (salesFormId: string | number, status: 'Approved' | 'Rejected') => {
    setActionLoading({ id: salesFormId, type: status === 'Approved' ? 'approve' : 'reject' });
    try {
      await axiosInstance.post(`/sales-form/status/${salesFormId}`, { status });
      toast.push(<Notification type="success" title={`Lead ${status}`}>{`Lead has been successfully ${status.toLowerCase()}.`}</Notification>);
      fetchPendingLeads(); // Refresh list in modal
      onActionSuccess(); // Refresh main table
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Action Failed">{error.response?.data?.message || `Could not ${status.toLowerCase()} the lead.`}</Notification>);
      console.error(error);
    } finally {
      setActionLoading({ id: null, type: null });
    }
  };

  const handleViewClick = (leadData: any) => {
    setSelectedLead(leadData);
    setIsViewModalOpen(true);
  };

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={1000} bodyOpenClassName="overflow-hidden">
        <div className="flex flex-col h-full max-h-[80vh]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h5 className="mb-0">Pending Leads for Verification</h5>
          </div>
          <div className="flex-grow overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64"><Spinner size={40} /></div>
            ) : pendingLeads.length > 0 ? (
              <Table>
                <Table.THead>
                  <Table.Tr>
                    <Table.Th>Lead Info</Table.Th>
                    <Table.Th>Product</Table.Th>
                    <Table.Th>Members (Buyer/Seller)</Table.Th>
                    <Table.Th>Details</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.THead>
                <Table.TBody>
                  {pendingLeads.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>{item.lead?.lead_number || `LD-${item.lead?.id}`}</Table.Td>
                      <Table.Td>{item.lead?.product?.name || 'N/A'}</Table.Td>
                      <Table.Td>
                        <div className="text-xs">
                          <p><strong>B:</strong> {item.lead?.lead_info?.buyer?.name || 'N/A'}</p>
                          <p><strong>S:</strong> {item.lead?.lead_info?.seller?.name || 'N/A'}</p>
                        </div>
                      </Table.Td>
                      <Table.Td>Qty: {item.lead?.qty || '-'} | Price: ${item.lead?.target_price || '-'}</Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-2">
                          <Tooltip title="View Details">
                            <Button shape="circle" size="xs" icon={<TbEye />} onClick={() => handleViewClick(item)} />
                          </Tooltip>
                          <Button
                            size="xs"
                            variant="solid"
                            color="emerald-600"
                            onClick={() => handleAction(item.id, 'Approved')}
                            loading={actionLoading.id === item.id && actionLoading.type === 'approve'}
                          >
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="solid"
                            color="red-600"
                            onClick={() => handleAction(item.id, 'Rejected')}
                            loading={actionLoading.id === item.id && actionLoading.type === 'reject'}
                          >
                            Reject
                          </Button>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.TBody>
              </Table>
            ) : (
              <div className="text-center p-10 text-gray-500">
                <p>No pending leads found.</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-right">
            <Button variant="solid" onClick={onClose}>Close</Button>
          </div>
        </div>
      </Dialog>

      <PendingLeadViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        leadData={selectedLead}
      />
    </>
  );
};
// --- END: NEW COMPONENT ---


interface CommonTableQueries {
  pageIndex?: number
  pageSize?: number
  query?: string
}

interface TableQueries extends OnSortParam, CommonTableQueries { }

// --- Form Schemas ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const filterFormSchema = z.object({
  filterStatuses: z.array(z.string()).optional().default([]),
  filterEnquiryTypes: z.array(z.string()).optional().default([]),
  filterIntents: z.array(z.string()).optional().default([]),
  filterProductIds: z.array(z.number()).optional().default([]),
  filterSalesPersonIds: z
    .array(z.union([z.string(), z.number()]))
    .optional()
    .default([]),
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// Zod Schema for Schedule Form
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z
    .string({ required_error: "Event type is required." })
    .min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// Zod Schema for Activity Form
const activitySchema = z.object({
  item: z
    .string()
    .min(3, "Activity item is required and must be at least 3 characters."),
  notes: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;

// --- START: NEW SCHEMA AND MODAL FOR START PROCESS ---
const startProcessSchema = z.object({
  formId: z.number({ required_error: 'Please select a form to begin.' }),
});
type StartProcessFormData = z.infer<typeof startProcessSchema>;

const StartProcessModal = ({
  isOpen,
  onClose,
  lead,
}: {
  isOpen: boolean
  onClose: () => void
  lead: LeadListItem | null
}) => {
  const navigate = useNavigate();
  const { formsData = [] } = useSelector(masterSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<StartProcessFormData>({
    resolver: zodResolver(startProcessSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (!isOpen) {
      reset(); // Reset form when modal closes
    }
  }, [isOpen, reset]);

  const tokenFormOptions = useMemo(
    () =>
      (formsData || []).map((form: any) => ({
        value: form.id,
        label: form.form_title || 'Untitled Form',
      })),
    [formsData]
  );

  const onSubmit = (data: StartProcessFormData) => {
    if (!lead) return;
    setIsSubmitting(true);
    navigate(`/start-process/${lead.id}/${data.formId}`);
    onClose();
  };

  if (!isOpen || !lead) return null;

    console.log(lead, 'lead');
    
  return (
    <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Start Process for Lead: {lead.lead_number}</h5>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Select a form to initiate a new process for this lead.
      </p>
      <Form id="startProcessForm" onSubmit={handleSubmit(onSubmit)}>
        <FormItem
          label="Token Form"
          invalid={!!errors.formId}
          errorMessage={errors.formId?.message}
        >
          <Controller
            name="formId"
            control={control}
            render={({ field }) => (
              <UiSelect
                placeholder="Select a form..."
                options={tokenFormOptions}
                value={tokenFormOptions.find(
                  (opt) => opt.value === field.value
                )}
                onChange={(opt: any) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>
      </Form>
      <div className="text-right mt-6">
        <Button className="mr-2" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="solid"
          type="submit"
          form="startProcessForm"
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          icon={<TbPlayerPlay />}
        >
          Proceed
        </Button>
      </div>
    </Dialog>
  );
};
// --- END: NEW SCHEMA AND MODAL ---

// --- UI Constants ---
const leadStatusColor: Record<LeadStatus | "default" | string, string> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200",
  Contacted: "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200",
  "Assignment sent": "bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-200",
  Assigned: "bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-200",
  Accepted: "bg-lime-100 text-lime-700 dark:bg-lime-700/30 dark:text-lime-200",
  "In Process": "bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-200",
  "For Approval": "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-200",
  Qualified:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-200",
  "Proposal Sent":
    "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-200",
  Negotiation:
    "bg-violet-100 text-violet-700 dark:bg-violet-700/30 dark:text-violet-200",
  "Follow Up":
    "bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200",
  Won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200",
  Lost: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200",
  Cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-700/30 dark:text-gray-400",
  Completed: "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200",
  "Deal Done": "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};

const enquiryTypeColor: Record<EnquiryType | "default" | string, string> = {
  "Product Info":
    "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
  "Quote Request":
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-200",
  "Demo Request":
    "bg-teal-100 text-teal-700 dark:bg-teal-700/30 dark:text-teal-200",
  Support: "bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-200",
  Partnership:
    "bg-lime-100 text-lime-700 dark:bg-lime-700/30 dark:text-lime-200",
  Sourcing:
    "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-700/30 dark:text-fuchsia-200",
  Other: "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200",
  "Wall Listing": "bg-gray-100 text-gray-700",
  'Manual lead': "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200",
  'Wall lead': "bg-stone-100 text-stone-700 dark:bg-stone-700/30 dark:text-stone-200",
  'Product lead': "bg-violet-100 text-violet-700 dark:bg-violet-700/30 dark:text-violet-200",
  "From Inquiry": "bg-indigo-100 text-indigo-700",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};

// --- Dummy/Static Data ---
const dummyProducts = [
  { id: 1, name: "iPhone 15 Pro" },
  { id: 2, name: "Galaxy S24 Ultra" },
];
const dummySalesPersons = [
  { id: "SP001", name: "Alice Wonder" },
  { id: "SP002", name: "Bob Builder" },
];
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
  { value: "Demo", label: "Product Demo" },
  { value: "IntroCall", label: "Introductory Call" },
  { value: "FollowUpCall", label: "Follow-up Call" },
  { value: "QBR", label: "Quarterly Business Review (QBR)" },
  { value: "CheckIn", label: "Customer Check-in" },
  { value: "LogEmail", label: "Log an Email" },
  { value: "Milestone", label: "Project Milestone" },
  { value: "Task", label: "Task" },
  { value: "FollowUp", label: "General Follow-up" },
  { value: "ProjectKickoff", label: "Project Kick-off" },
  { value: "OnboardingSession", label: "Onboarding Session" },
  { value: "Training", label: "Training Session" },
  { value: "SupportCall", label: "Support Call" },
  { value: "Reminder", label: "Reminder" },
  { value: "Note", label: "Add a Note" },
  { value: "FocusTime", label: "Focus Time (Do Not Disturb)" },
  { value: "StrategySession", label: "Strategy Session" },
  { value: "TeamMeeting", label: "Team Meeting" },
  { value: "PerformanceReview", label: "Performance Review" },
  { value: "Lunch", label: "Lunch / Break" },
  { value: "Appointment", label: "Personal Appointment" },
  { value: "Other", label: "Other" },
  { value: "ProjectKickoff", label: "Project Kick-off" },
  { value: "InternalSync", label: "Internal Team Sync" },
  { value: "ClientUpdateMeeting", label: "Client Update Meeting" },
  { value: "RequirementsGathering", label: "Requirements Gathering" },
  { value: "UAT", label: "User Acceptance Testing (UAT)" },
  { value: "GoLive", label: "Go-Live / Deployment Date" },
  { value: "ProjectSignOff", label: "Project Sign-off" },
  { value: "PrepareReport", label: "Prepare Report" },
  { value: "PresentFindings", label: "Present Findings" },
  { value: "TroubleshootingCall", label: "Troubleshooting Call" },
  { value: "BugReplication", label: "Bug Replication Session" },
  { value: "IssueEscalation", label: "Escalate Issue" },
  { value: "ProvideUpdate", label: "Provide Update on Ticket" },
  { value: "FeatureRequest", label: "Log Feature Request" },
  { value: "IntegrationSupport", label: "Integration Support Call" },
  { value: "DataMigration", label: "Data Migration/Import Task" },
  { value: "ColdCall", label: "Cold Call" },
  { value: "DiscoveryCall", label: "Discovery Call" },
  { value: "QualificationCall", label: "Qualification Call" },
  { value: "SendFollowUpEmail", label: "Send Follow-up Email" },
  { value: "LinkedInMessage", label: "Log LinkedIn Message" },
  { value: "ProposalReview", label: "Proposal Review Meeting" },
  { value: "ContractSent", label: "Contract Sent" },
  { value: "NegotiationCall", label: "Negotiation Call" },
  { value: "TrialSetup", label: "Product Trial Setup" },
  { value: "TrialCheckIn", label: "Trial Check-in Call" },
  { value: "WelcomeCall", label: "Welcome Call" },
  { value: "ImplementationSession", label: "Implementation Session" },
  { value: "UserTraining", label: "User Training Session" },
  { value: "AdminTraining", label: "Admin Training Session" },
  { value: "MonthlyCheckIn", label: "Monthly Check-in" },
  { value: "QBR", label: "Quarterly Business Review (QBR)" },
  { value: "HealthCheck", label: "Customer Health Check" },
  { value: "FeedbackSession", label: "Feedback Session" },
  { value: "RenewalDiscussion", label: "Renewal Discussion" },
  { value: "UpsellOpportunity", label: "Upsell/Cross-sell Call" },
  { value: "CaseStudyInterview", label: "Case Study Interview" },
  { value: "InvoiceDue", label: "Invoice Due" },
  { value: "SendInvoice", label: "Send Invoice" },
  { value: "PaymentReminder", label: "Send Payment Reminder" },
  { value: "ChaseOverduePayment", label: "Chase Overdue Payment" },
  { value: "ConfirmPayment", label: "Confirm Payment Received" },
  { value: "ContractRenewalDue", label: "Contract Renewal Due" },
  { value: "DiscussBilling", label: "Discuss Billing/Invoice" },
  { value: "SendQuote", label: "Send Quote/Estimate" },
];
const dummyAlerts = [
  {
    id: 1,
    severity: "danger",
    message: "Follow-up for Lead #LD-1023 is overdue.",
    time: "3 days ago",
  },
  {
    id: 2,
    severity: "warning",
    message: "Lead has been in 'New' status for 7 days.",
    time: "1 week ago",
  },
];
const dummyDocs = [
  {
    id: "doc1",
    name: "Product_Quote_LD-1023.pdf",
    type: "pdf",
    size: "1.2 MB",
  },
  { id: "doc2", name: "Lead_Requirements.zip", type: "zip", size: "8.4 MB" },
];
const dummyFeedback = [
  {
    id: "f1",
    type: "Question",
    subject: "Inquiry about bulk pricing",
    status: "Open",
  },
  {
    id: "f2",
    type: "Comment",
    subject: "Positive interaction with sales",
    status: "Closed",
  },
];

type LeadOpportunityItem = {
  id: string;
  name: string;
  stage: string;
  value: number;
  closeDate: string;
};

const dummyOpportunities: LeadOpportunityItem[] = [
  {
    id: "OPP-001",
    name: "Bulk Order for Product X",
    stage: "Negotiation",
    value: 50000,
    closeDate: "2024-08-30",
  },
  {
    id: "OPP-002",
    name: "Annual Service Contract",
    stage: "Proposal Sent",
    value: 12000,
    closeDate: "2024-09-15",
  },
];
const dummyDeal = {
  id: "DEAL-789",
  value: 75000,
  pipeline: "Sales Pipeline",
  stage: "Won",
  closeDate: "2024-07-20",
};

const CSV_LEAD_HEADERS = [
  "ID",
  "Lead Number",
  "Status",
  "Enquiry Type",
  "Product Name",
  "Customer ID",
  "Customer Name",
  "Intent",
  "Qty",
  "Target Price",
  "Sales Person",
  "Created At",
];
const CSV_LEAD_KEYS: (keyof LeadListItem)[] = [
  "id",
  "lead_number",
  "lead_status",
  "enquiry_type",
  "productName",
  "customerId",
  "customerName",
  "lead_intent",
  "qty",
  "target_price",
  "salesPersonName",
  "createdAt",
];
function exportLeadsToCsv(filename: string, rows: LeadListItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const separator = ",";
  const csvContent =
    CSV_LEAD_HEADERS.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return CSV_LEAD_KEYS.map((k) => {
          let cell = row[k];
          if (cell === null || cell === undefined) cell = "";
          else if (cell instanceof Date)
            cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss");
          else cell = String(cell).replace(/"/g, '""');
          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
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
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

type LeadListItem = {
  id: string | number;
  lead_number: string;
  lead_status: LeadStatus;
  enquiry_type: EnquiryType;
  lead_info: any;
  productId?: number;
  productName: string;
  customerId: string | number;
  customerName: string;
  lead_intent: LeadIntent;
  qty?: number | null;
  target_price?: number | null;
  assigned_sales_person_id?: string | number | null;
  sales_person_id?: string | number | null;
  assigned_saled_id?: string | number | null;
  salesPersonName?: string;
  createdAt: Date;
  updatedAt?: Date;
  source_supplier_id?: string | number | null;
  sourceSupplierName?: string;
  rawApiData: any;
  buyer: any;
  seller: any;
  member_email?: string;
  member_phone?: string;
  formId: any;
};

const assignLeadSchema = z.object({
  assigned_sales_person_id: z.coerce.number({
    required_error: "An assignee is required.",
  }),
});
type AssignLeadFormData = z.infer<typeof assignLeadSchema>;
export type SelectOption = { value: any; label: string };

export type LeadModalType =
  | "email"
  | "whatsapp"
  | "notification"
  | "task"
  | "activity"
  | "calendar"
  | "alert"
  | "document"
  | "feedback"
  | "convertToDeal"
  | "viewOpportunities"
  | "viewLeadForm"
  | "viewDeal"
  | "addAccountDocuments"
  | "assignLead";
export interface LeadModalState {
  isOpen: boolean;
  type: LeadModalType | null;
  data: LeadListItem | null;
}
interface LeadModalsProps {
  modalState: LeadModalState;
  onClose: () => void;
  onSuccess: () => void;
  getAllUserDataOptions: SelectOption[];
}

const LeadModals: React.FC<LeadModalsProps> = ({
  modalState,
  onClose,
  onSuccess,
  getAllUserDataOptions,
}) => {
  const { type, data: lead, isOpen } = modalState;
  if (!isOpen || !lead) return null;
  const renderModalContent = () => {
    switch (type) {
      case "assignLead":
        return (
          <AssignLeadDialog
            lead={lead}
            onClose={onClose}
            onSuccess={onSuccess}
            getAllUserDataOptions={getAllUserDataOptions}
          />
        );
      case "email":
        return <SendEmailDialog lead={lead} onClose={onClose} />;
      case "whatsapp":
        return <SendWhatsAppDialog lead={lead} onClose={onClose} />;
      case "notification":
        return (
          <AddNotificationDialog
            lead={lead}
            onClose={onClose}
            getAllUserDataOptions={getAllUserDataOptions}
          />
        );
      case "task":
        return <AssignTaskDialog lead={lead} onClose={onClose} />;
      case "activity":
        return <AddActivityDialog lead={lead} onClose={onClose} />;
      case "calendar":
        return <AddScheduleDialog lead={lead} onClose={onClose} />;
      case "alert":
        return <ViewAlertDialog lead={lead} onClose={onClose} />;
      case "document":
        return <DownloadDocumentDialog lead={lead} onClose={onClose} />;
      case "feedback":
        return <ViewRequestFeedbackDialog lead={lead} onClose={onClose} />;
      case "convertToDeal":
        return <ConvertLeadToDealDialog lead={lead} onClose={onClose} />;
      case "viewOpportunities":
        return <ViewOpportunitiesDialog lead={lead} onClose={onClose} />;
      case "viewLeadForm":
        return <ViewLeadFormDialog lead={lead} onClose={onClose} />;
      case "viewDeal":
        return <ViewDealDialog lead={lead} onClose={onClose} />;
      case "addAccountDocuments":
        return <AddAccountDocumentsDialog lead={lead} onClose={onClose} />;
      default:
        return (
          <GenericActionDialog type={type} lead={lead} onClose={onClose} />
        );
    }
  };
  return <>{renderModalContent()}</>;
};
const ConvertLeadToDealDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {

  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      dealValue: lead.target_price || 0,
      dealName: `${lead.productName} for ${lead.customerName}`,
    },
  });
  const onConvert = (data: any) => {
    setIsLoading(true);
    console.log(`Converting lead ${lead.lead_number} to deal with data:`, data);
    setTimeout(() => {
      toast.push(
        <Notification type="success" title="Lead Converted">
          Successfully converted to a new deal. Accounts team has been notified.
        </Notification>
      );
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={700}>
      <h5 className="mb-4">Convert Lead to Deal</h5>
      <p className="mb-4">
        You are about to convert lead <span className="font-semibold">{lead.lead_number}</span> into a new deal.
        This will initiate the Purchase Order (PO) and Sales Order (SO) process for the accounts team.
        Please confirm the details below.
      </p>
      <Card>
        <div className="p-4">
          <h6 className="mb-4">Deal Summary</h6>
          <div className="text-center font-semibold mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            {lead.productName}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <h6 className="font-bold text-gray-800 dark:text-gray-200 border-b pb-1 mb-2">Purchase From (Supplier)</h6>
              <p><strong>Name:</strong> {lead.seller?.name || 'N/A'}</p>
              <p><strong>Member ID:</strong> {lead.seller?.member_code || 'N/A'}</p>
            </div>
            <div>
              <h6 className="font-bold text-gray-800 dark:text-gray-200 border-b pb-1 mb-2">Sale To (Buyer)</h6>
              <p><strong>Name:</strong> {lead.buyer?.name || 'N/A'}</p>
              <p><strong>Member ID:</strong> {lead.buyer?.member_code || 'N/A'}</p>
            </div>
          </div>
          <hr className="my-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><strong className="block">Quantity:</strong> {lead.qty || 'N/A'}</div>
            <div><strong className="block">Target Price:</strong> ${lead.target_price || 'N/A'}</div>
          </div>
        </div>
      </Card>

      <div className="text-right mt-6">
        <Button
          type="button"
          className="mr-2"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button variant="solid" onClick={handleSubmit(onConvert)} loading={isLoading} icon={<TbRocket />}>
          Confirm & Convert
        </Button>
      </div>
    </Dialog>
  );
};
type WallIntent = 'Sell' | 'Buy' | 'Exchange';
const intentTagColor: Record<WallIntent, string> = {
  Sell: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Buy: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100",
  Exchange:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
};
const ViewOpportunitiesDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {
  const dispatch = useAppDispatch();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!lead.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const actionResult = await dispatch(getLeadOpportunitiesAction({ id: lead.id, key: lead.lead_intent })).unwrap();
        if (actionResult?.data) {
          const formattedData = actionResult.data.map((item: any) => ({
            id: item.id,
            want_to: item.want_to,
            product_name: item.product_name,
            brand_name: item.brand_name,
            qty: item.qty,
            price: item.price,
            device_condition: item.device_condition,
            color: item.color,
            member_name: item.member_name,
            customer_code: item.customer_code,
            country_name: item.country_name,
            leads_count: item.leads_count,
          }));
          setData(formattedData);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Failed to fetch opportunities:", error);
        toast.push(
          <Notification type="danger" title="Error">
            Could not load opportunities.
          </Notification>
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, [lead.id, lead.lead_intent, dispatch]);

  const columns = useMemo(() => [
    {
      header: 'Listing',
      accessorKey: 'product_name',
      cell: ({ row }: CellContext<any, any>) => {
        const { want_to, product_name, brand_name, color, device_condition } = row.original;
        const intent = want_to as WallIntent;
        return (
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{product_name}</p>
            <p className="text-xs text-gray-600 dark:text-gray-300">{brand_name}</p>
            <div className="flex items-center flex-wrap gap-1 mt-2">
              <Tag className={`capitalize text-xs font-semibold border-0 ${intentTagColor[intent] || ''}`}>{want_to}</Tag>
              <Tag className="bg-gray-100 dark:bg-gray-700 text-xs">{device_condition}</Tag>
              <Tag className="bg-gray-100 dark:bg-gray-700 text-xs">{color}</Tag>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Member',
      accessorKey: 'member_name',
      cell: ({ row }: CellContext<any, any>) => {
        const { member_name, customer_code, country_name } = row.original;
        return (
          <div>
            <p className="font-semibold">{member_name}</p>
            <p className="text-xs text-gray-500">{customer_code}</p>
            <p className="text-xs text-gray-500">{country_name}</p>
          </div>
        );
      }
    },
    {
      header: 'Details',
      accessorKey: 'qty',
      cell: ({ row }: CellContext<any, any>) => {
        const { qty, price } = row.original;
        return (
          <div>
            <p>Qty: <span className="font-semibold">{qty}</span></p>
            <p>Price: <span className="font-semibold">{price ? `$${price}` : 'N/A'}</span></p>
          </div>
        );
      }
    },
    {
      header: 'Leads',
      accessorKey: 'leads_count',
      cell: ({ row }: CellContext<any, any>) => <span className="font-semibold">{row.original.leads_count}</span>
    },
  ], []);

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={1000}
      bodyOpenClassName="overflow-hidden"
    >
      <div className="flex flex-col h-full max-h-[80vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <TbBulb className="text-2xl text-amber-500" />
            <h5 className="mb-0">Opportunities for {lead.lead_number}</h5>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size={40} />
            </div>
          ) : (
            <DataTable
              menuName={"leads"}
              columns={columns}
              data={data}
              noData={data.length === 0}
            />
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-right">
          <Button variant="solid" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Dialog>
  );
};

const ViewLeadFormDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => (
  <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
    <h5 className="mb-4">Lead Form Details: {lead.lead_number}</h5>
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <FormItem label="Product">
        <Input value={lead.productName} readOnly />
      </FormItem>
      <FormItem label="Customer">
        <Input
          value={`${lead.customerName} (ID: ${lead.customerId})`}
          readOnly
        />
      </FormItem>
      <div className="grid grid-cols-2 gap-4">
        <FormItem label="Quantity">
          <Input value={lead.qty ?? "N/A"} readOnly />
        </FormItem>
        <FormItem label="Target Price">
          <Input value={lead.target_price ?? "N/A"} readOnly />
        </FormItem>
      </div>
      <FormItem label="Assigned Sales Person">
        <Input value={lead.salesPersonName || "Unassigned"} readOnly />
      </FormItem>
      <FormItem label="Enquiry Type">
        <Input value={lead.enquiry_type} readOnly />
      </FormItem>
      <FormItem label="Lead Intent">
        <Input value={lead.lead_intent} readOnly />
      </FormItem>
    </div>
    <div className="text-right mt-6">
      <Button variant="solid" onClick={onClose}>
        Close
      </Button>
    </div>
  </Dialog>
);
const ViewDealDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({
  lead,
  onClose,
}) => (
  <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
    <h5 className="mb-4">Associated Deal for {lead.lead_number}</h5>
    <p>This lead has been converted to the following deal:</p>
    <Card bordered className="mt-4">
      <p>
        <strong>Deal ID:</strong> {dummyDeal.id}
      </p>
      <p>
        <strong>Value:</strong> ${dummyDeal.value.toLocaleString()}
      </p>
      <p>
        <strong>Pipeline:</strong> {dummyDeal.pipeline}
      </p>
      <p>
        <strong>Stage:</strong>{" "}
        <Tag className="bg-emerald-100 text-emerald-700">{dummyDeal.stage}</Tag>
      </p>
      <p>
        <strong>Close Date:</strong>{" "}
        {dayjs(dummyDeal.closeDate).format("DD MMM, YYYY")}
      </p>
    </Card>
    <div className="text-right mt-6">
      <Button variant="solid" onClick={onClose}>
        Close
      </Button>
    </div>
  </Dialog>
);
const AddAccountDocumentsDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { document: null, description: "" },
  });
  const onUpload = (data: any) => {
    setIsLoading(true);
    console.log(
      `Uploading document for lead ${lead.lead_number} with data:`,
      data
    );
    setTimeout(() => {
      toast.push(
        <Notification type="success" title="Document Uploaded"></Notification>
      );
      setIsLoading(false);
      onClose();
    }, 1200);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Account Document</h5>
      <p className="mb-4">
        Upload a document for the account associated with{" "}
        <span className="font-semibold">{lead.customerName}</span>.
      </p>
      <form onSubmit={handleSubmit(onUpload)}>
        <FormItem label="Document File">
          <Controller
            name="document"
            control={control}
            render={({ field }) => (
              <Input
                type="file"
                onChange={(e: any) => field.onChange(e.target.files?.[0])}
              />
            )}
          />
        </FormItem>
        <FormItem label="Description">
          <Controller
            name="description"
            control={control}
            render={({ field }) => <Input textArea {...field} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button
            type="button"
            className="mr-2"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading}>
            Upload
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
const SendEmailDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      subject: `Regarding Lead: ${lead.lead_number}`,
      message: "",
    },
  });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true);
    console.log(
      "Simulating email to member of",
      lead.lead_number,
      "with data:",
      data
    );
    setTimeout(() => {
      toast.push(
        <Notification type="success" title="Email Sent Successfully" />
      );
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send Email for {lead.lead_number}</h5>
      <form onSubmit={handleSubmit(onSendEmail)}>
        <FormItem label="Subject">
          <Controller
            name="subject"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormItem>
        <FormItem label="Message">
          <Controller
            name="message"
            control={control}
            render={({ field }) => (
              <RichTextEditor value={field.value} onChange={field.onChange} />
            )}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading}>
            Send
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
const SendWhatsAppDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      message: `Hi, regarding your enquiry for ${lead.productName} (Lead: ${lead.lead_number})...`,
    },
  });
  const onSendMessage = (data: { message: string }) => {
    const phone = lead.member_phone?.replace(/\D/g, "") || "1234567890";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      data.message
    )}`;
    window.open(url, "_blank");
    toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
    onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send WhatsApp for {lead.lead_number}</h5>
      <form onSubmit={handleSubmit(onSendMessage)}>
        <FormItem label="Message Template">
          <Controller
            name="message"
            control={control}
            render={({ field }) => <Input textArea {...field} rows={4} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" type="submit">
            Open WhatsApp
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const AssignLeadDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
  onSuccess: () => void;
  getAllUserDataOptions: SelectOption[];
}> = ({ lead, onClose, onSuccess, getAllUserDataOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AssignLeadFormData>({
    resolver: zodResolver(assignLeadSchema),
    defaultValues: {
      assigned_sales_person_id: lead.assigned_sales_person_id
        ? Number(lead.assigned_sales_person_id)
        : null,
    },
    mode: "onChange",
  });

  const handleAssignLead = async (formData: AssignLeadFormData) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/lead/lead/${lead.id}`);

      if (!response.data?.data) {
        throw new Error("Failed to fetch latest lead data.");
      }
      const latestLeadData = response.data.data;
      const payload = {
        ...latestLeadData,
        id: lead.id,
        assigned_saled_id: formData.assigned_sales_person_id,
        assigned_sales_person_id: formData.assigned_sales_person_id,
      };

      await dispatch(editLeadAction(payload)).unwrap();

      toast.push(
        <Notification type="success" title="Lead Assigned">
          Lead has been successfully assigned.
        </Notification>
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Assign Lead Error:", error);
      const errorMessage =
        error?.payload?.message || error.message || "An unknown error occurred.";
      toast.push(
        <Notification type="danger" title="Assignment Failed">
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Lead: {lead.lead_number}</h5>
      <p className="mb-4 text-sm">
        Lead Product:{" "}
        <span className="font-semibold">
          {lead.productName || "N/A"}
        </span>
      </p>

      <Form onSubmit={handleSubmit(handleAssignLead)}>
        <FormItem
          label="New Assignee"
          invalid={!!errors.assigned_sales_person_id}
          errorMessage={errors.assigned_sales_person_id?.message}
        >
          <Controller
            name="assigned_sales_person_id"
            control={control}
            render={({ field }) => (
              <UiSelect
                placeholder="Select a user"
                options={getAllUserDataOptions}
                value={getAllUserDataOptions.find(
                  (o) => o.value === field.value
                )}
                onChange={(opt) => field.onChange(opt?.value)}
              />
            )}
          />
        </FormItem>

        <div className="text-right mt-6">
          <Button
            type="button"
            className="mr-2"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            loading={isLoading}
            disabled={!isValid || isLoading}
          >
            Assign
          </Button>
        </div>
      </Form>
    </Dialog>
  );
};

const AddNotificationDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}> = ({ lead, onClose, getAllUserDataOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const notificationSchema = z.object({
    notification_title: z
      .string()
      .min(3, "Title must be at least 3 characters long."),
    send_users: z.array(z.number()).min(1, "Please select at least one user."),
    message: z.string().min(10, "Message must be at least 10 characters long."),
  });
  type NotificationFormData = z.infer<typeof notificationSchema>;
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      notification_title: `Update on Lead: ${lead.lead_number}`,
      send_users: [],
      message: `This is a notification regarding lead ID ${lead.lead_number} for the product "${lead.productName}".`,
    },
    mode: "onChange",
  });
  const onSend = async (formData: NotificationFormData) => {
    setIsLoading(true);
    const payload = {
      send_users: formData.send_users,
      notification_title: formData.notification_title,
      message: formData.message,
      module_id: String(lead.id),
      module_name: "Lead",
    };
    try {
      await dispatch(addNotificationAction(payload)).unwrap();
      toast.push(
        <Notification type="success" title="Notification Sent Successfully!" />
      );
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Failed to Send Notification"
          children={error?.message || "An unknown error occurred."}
        />
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for {lead.lead_number}</h5>
      <Form onSubmit={handleSubmit(onSend)}>
        <FormItem
          label="Notification Title"
          invalid={!!errors.notification_title}
          errorMessage={errors.notification_title?.message}
        >
          <Controller
            name="notification_title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormItem>
        <FormItem
          label="Send to Users"
          invalid={!!errors.send_users}
          errorMessage={errors.send_users?.message}
        >
          <Controller
            name="send_users"
            control={control}
            render={({ field }) => (
              <UiSelect
                isMulti
                placeholder="Select Users"
                options={getAllUserDataOptions}
                value={getAllUserDataOptions.filter((o) =>
                  field.value?.includes(o.value)
                )}
                onChange={(options: any) =>
                  field.onChange(options?.map((o: any) => o.value) || [])
                }
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Message"
          invalid={!!errors.message}
          errorMessage={errors.message?.message}
        >
          <Controller
            name="message"
            control={control}
            render={({ field }) => <Input textArea {...field} rows={3} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            loading={isLoading}
            disabled={!isValid || isLoading}
          >
            Send
          </Button>
        </div>
      </Form>
    </Dialog>
  );
};
const AssignTaskDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      title: `Follow up on lead ${lead.lead_number}`,
      assignee: null,
      dueDate: null,
      priority: null,
      description: "",
    },
  });
  const onAssignTask = (data: any) => {
    setIsLoading(true);
    console.log("Assigning task for", lead.lead_number, "with data:", data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Task Assigned" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for {lead.lead_number}</h5>
      <form onSubmit={handleSubmit(onAssignTask)}>
        <FormItem label="Task Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Assign To">
            <Controller
              name="assignee"
              control={control}
              render={({ field }) => (
                <UiSelect
                  placeholder="Select User"
                  options={dummyUsers}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Priority">
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <UiSelect
                  placeholder="Select Priority"
                  options={priorityOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
        </div>
        <FormItem label="Due Date">
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                placeholder="Select date"
                value={field.value ?? undefined}
                onChange={field.onChange}
              />
            )}
          />
        </FormItem>
        <FormItem label="Description">
          <Controller
            name="description"
            control={control}
            render={({ field }) => <Input textArea {...field} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading}>
            Assign Task
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
const AddScheduleDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_title: `Follow up on lead ${lead.lead_number}`,
      event_type: undefined,
      date_time: null as any,
      remind_from: null,
      notes: `Regarding lead for "${lead.productName}" from customer "${lead.customerName}".`,
    },
    mode: "onChange",
  });
  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = {
      module_id: Number(lead.id),
      module_name: "Member",
      event_title: data.event_title,
      event_type: data.event_type,
      date_time: dayjs(data.date_time).format("YYYY-MM-DDTHH:mm:ss"),
      ...(data.remind_from && {
        remind_from: dayjs(data.remind_from).format("YYYY-MM-DDTHH:mm:ss"),
      }),
      notes: data.notes || "",
    };
    try {
      await dispatch(addScheduleAction(payload)).unwrap();
      toast.push(
        <Notification
          type="success"
          title="Event Scheduled"
          children={`Successfully scheduled event for lead ${lead.lead_number}.`}
        />
      );
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Scheduling Failed"
          children={error?.message || "An unknown error occurred."}
        />
      );
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for {lead.lead_number}</h5>
      <Form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem
          label="Event Title"
          invalid={!!errors.event_title}
          errorMessage={errors.event_title?.message}
        >
          <Controller
            name="event_title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem
            label="Event Type"
            invalid={!!errors.event_type}
            errorMessage={errors.event_type?.message}
          >
            <Controller
              name="event_type"
              control={control}
              render={({ field }) => (
                <UiSelect
                  placeholder="Select Type"
                  options={eventTypeOptions}
                  value={eventTypeOptions.find((o) => o.value === field.value)}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Event Date & Time"
            invalid={!!errors.date_time}
            errorMessage={errors.date_time?.message}
          >
            <Controller
              name="date_time"
              control={control}
              render={({ field }) => (
                <DatePicker.DateTimepicker
                  placeholder="Select date and time"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormItem>
        </div>
        <FormItem
          label="Reminder Date & Time (Optional)"
          invalid={!!errors.remind_from}
          errorMessage={errors.remind_from?.message}
        >
          <Controller
            name="remind_from"
            control={control}
            render={({ field }) => (
              <DatePicker.DateTimepicker
                placeholder="Select date and time"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </FormItem>
        <FormItem
          label="Notes"
          invalid={!!errors.notes}
          errorMessage={errors.notes?.message}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => <Input textArea {...field} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button
            type="button"
            className="mr-2"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            loading={isLoading}
            disabled={!isValid || isLoading}
          >
            Save Event
          </Button>
        </div>
      </Form>
    </Dialog>
  );
};
const AddActivityDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> =
  ({ lead, onClose }) => {
    const dispatch = useAppDispatch();
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
      const { useEncryptApplicationStorage } = config;
      try { setUserData(encryptStorage.getItem("UserData", !useEncryptApplicationStorage)); }
      catch (error) { console.error("Error getting UserData:", error); }
    }, []);

    const [isLoading, setIsLoading] = useState(false);
    const {
      control,
      handleSubmit,
      formState: { errors, isValid },
    } = useForm<ActivityFormData>({
      resolver: zodResolver(activitySchema),
      defaultValues: { item: `Followed up on lead ${lead.lead_number}`, notes: "" },
      mode: "onChange",
    });

    const onAddActivity = async (data: ActivityFormData) => {
      setIsLoading(true);

      if (!userData?.id) {
        toast.push(
          <Notification type="danger" title="Error">
            Could not identify user. Please log in again.
          </Notification>
        );
        setIsLoading(false);
        return;
      }

      const payload = {
        item: data.item,
        notes: data.notes || "",
        module_id: String(lead.id),
        module_name: "Lead",
        user_id: userData.id,
      };

      try {
        await dispatch(addAllActionAction(payload)).unwrap();
        toast.push(<Notification type="success" title="Activity Added" />);
        onClose();
      } catch (error: any) {
        toast.push(
          <Notification
            type="danger"
            title="Failed to Add Activity"
            children={error?.message || "An unknown error occurred."}
          />
        );
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
        <h5 className="mb-4">Add Activity Log for "{lead.lead_number}"</h5>
        <Form onSubmit={handleSubmit(onAddActivity)}>
          <FormItem
            label="Activity"
            invalid={!!errors.item}
            errorMessage={errors.item?.message}
          >
            <Controller
              name="item"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="e.g., Followed up with member" />
              )}
            />
          </FormItem>
          <FormItem
            label="Notes (Optional)"
            invalid={!!errors.notes}
            errorMessage={errors.notes?.message}
          >
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <Input
                  textArea
                  {...field}
                  placeholder="Add relevant details..."
                />
              )}
            />
          </FormItem>
          <div className="text-right mt-6">
            <Button
              type="button"
              className="mr-2"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              type="submit"
              loading={isLoading}
              disabled={!isValid || isLoading}
              icon={<TbCheck />}
            >
              Save Activity
            </Button>
          </div>
        </Form>
      </Dialog>
    );
  };
const ViewAlertDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {
  const alertColors: Record<string, string> = {
    danger: "red",
    warning: "amber",
    info: "blue",
  };
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Alerts for {lead.lead_number}</h5>
      <div className="mt-4 flex flex-col gap-3">
        {dummyAlerts.length > 0 ? (
          dummyAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-l-4 border-${alertColors[alert.severity]
                }-500 bg-${alertColors[alert.severity]}-50 dark:bg-${alertColors[alert.severity]
                }-500/10`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <TbAlertTriangle
                    className={`text-${alertColors[alert.severity]}-500 mt-1`}
                    size={20}
                  />
                  <p className="text-sm">{alert.message}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {alert.time}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p>No active alerts.</p>
        )}
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};
const DownloadDocumentDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {
  const iconMap: Record<string, React.ReactElement> = {
    pdf: <TbFileText className="text-red-500" />,
    zip: <TbFileZip className="text-amber-500" />,
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Documents for {lead.lead_number}</h5>
      <div className="flex flex-col gap-3 mt-4">
        {dummyDocs.map((doc) => (
          <div
            key={doc.id}
            className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="flex items-center gap-3">
              {React.cloneElement(iconMap[doc.type] || <TbClipboardText />, {
                size: 28,
              })}
              <div>
                <p className="font-semibold text-sm">{doc.name}</p>
                <p className="text-xs text-gray-400">{doc.size}</p>
              </div>
            </div>
            <Tooltip title="Download">
              <Button shape="circle" size="sm" icon={<TbDownload />} />
            </Tooltip>
          </div>
        ))}
      </div>
      <div className="text-right mt-6">
        <Button onClick={onClose}>Close</Button>
      </div>
    </Dialog>
  );
};
const ViewRequestFeedbackDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
}> = ({ lead, onClose }) => {
  const statusColors: Record<string, string> = {
    Open: "bg-emerald-500",
    Closed: "bg-red-500",
  };
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={700}
    >
      <h5 className="mb-4">Requests & Feedback for {lead.lead_number}</h5>
      <div className="max-h-[400px] overflow-y-auto">
        <Table>
          <Table.THead>
            <Table.Tr>
              <Table.Th>Type</Table.Th>
              <Table.Th>Subject</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.THead>
          <Table.TBody>
            {dummyFeedback.map((fb) => (
              <Table.Tr key={fb.id}>
                <Table.Td>{fb.type}</Table.Td>
                <Table.Td>{fb.subject}</Table.Td>
                <Table.Td>
                  <Tag
                    className="text-white"
                    prefix
                    prefixClass={statusColors[fb.status]}
                  >
                    {fb.status}
                  </Tag>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.TBody>
        </Table>
      </div>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};
const GenericActionDialog: React.FC<{
  type: LeadModalType | null;
  lead: LeadListItem;
  onClose: () => void;
}> = ({ type, lead, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type
    ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}`
    : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true);
    console.log(`Action '${type}' for ${lead.lead_number}`);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Action Completed" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-2">{title}</h5>
      <p>
        Perform this action for{" "}
        <span className="font-semibold">{lead.lead_number}</span>?
      </p>
      <div className="text-right mt-6">
        <Button className="mr-2" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="solid" onClick={handleConfirm} loading={isLoading}>
          Confirm
        </Button>
      </div>
    </Dialog>
  );
};

const LeadActionColumn = ({
  data,
  onViewDetail,
  onEdit,
  onDelete,
  onAssign,
  onChangeStatus,
  onOpenModal,
  onStartProcess,
}: {
  data: any;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onChangeStatus: () => void;
  onOpenModal: (type: LeadModalType) => void;
  onStartProcess: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-0.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center justify-center">
      <Tooltip title="Edit Lead">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View Lead">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          )}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>

      <Dropdown
        renderTitle={
          <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
        }
      >


        <Dropdown.Item
          onClick={() => onOpenModal("email")}
          className="flex items-center gap-2 text-xs"
        >
          <TbMail size={18} /> Send Email
        </Dropdown.Item>
        {data.assigned_saled_id ? <Dropdown.Item
          onClick={onStartProcess}
          className="flex items-center gap-2 text-xs"
        >
          <TbPlayerPlay size={18} /> Start Process
        </Dropdown.Item> : null}
        <Dropdown.Item
          onClick={() => onOpenModal("whatsapp")}
          className="flex items-center gap-2 text-xs"
        >
          <TbBrandWhatsapp size={18} /> Send Whatsapp
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("notification")}
          className="flex items-center gap-2 text-xs"
        >
          <TbBell size={18} /> Add Notification
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("task")}
          className="flex items-center gap-2 text-xs"
        >
          <TbSubtask size={18} /> Assign Task
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("calendar")}
          className="flex items-center gap-2 text-xs"
        >
          <TbCalendarEvent size={18} /> Add Schedule
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("activity")}
          className="flex items-center gap-2 text-xs"
        >
          <TbTagStarred size={18} /> Add Activity
        </Dropdown.Item>
       {data.lead_status == 'Approved' ? <Dropdown.Item
          onClick={() => onOpenModal("convertToDeal")}
          className="flex items-center gap-2 text-xs"
        >
          <TbRocket size={18} /> Convert to Deal
        </Dropdown.Item> : null}

        <Dropdown.Item
          onClick={() => onOpenModal("viewOpportunities")}
          className="flex items-center gap-2 text-xs"
        >
          <TbTrophy size={18} /> View Opportunities
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("viewLeadForm")}
          className="flex items-center gap-2 text-xs"
        >
          <TbFileDescription size={18} /> View Lead Form
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("viewDeal")}
          className="flex items-center gap-2 text-xs"
        >
          <TbPennant size={18} /> View Deal
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("addAccountDocuments")}
          className="flex items-center gap-2 text-xs"
        >
          <TbFileInvoice size={18} /> Add Account Documents
        </Dropdown.Item>
        {!data.assigned_saled_id ? <Dropdown.Item
          onClick={() => onOpenModal("assignLead")}
          className="flex items-center gap-2 text-xs"
        >
          <TbUserSearch size={18} /> Assign Sales Person
        </Dropdown.Item> : null}
      </Dropdown>
    </div>
  );
};
const LeadSearch = React.forwardRef<
  HTMLInputElement,
  { onInputChange: (value: string) => void; placeholder?: string }
>(({ onInputChange, ...rest }, ref) => (
  <DebouceInput
    ref={ref}
    {...rest}
    suffix={<TbSearch className="text-lg" />}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
      onInputChange(e.target.value)
    }
  />
));
LeadSearch.displayName = "LeadSearch";

const LeadTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
  columns,
  filteredColumns,
  setFilteredColumns,
  activeFilterCount,
  isDashboard,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<LeadListItem>[];
  filteredColumns: ColumnDef<LeadListItem>[];
  setFilteredColumns: React.Dispatch<
    React.SetStateAction<ColumnDef<LeadListItem>[]>
  >;
  activeFilterCount: number;
  isDashboard: boolean;
}) => {
  const isColumnVisible = (colId: string) =>
    filteredColumns.some((c) => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      const originalColumn = columns.find(
        (c) => (c.id || c.accessorKey) === colId
      );
      if (originalColumn) {
        setFilteredColumns((prev) => {
          const newCols = [...prev, originalColumn];
          newCols.sort((a, b) => {
            const indexA = columns.findIndex(
              (c) => (c.id || c.accessorKey) === (a.id || a.accessorKey)
            );
            const indexB = columns.findIndex(
              (c) => (c.id || c.accessorKey) === (b.id || b.accessorKey)
            );
            return indexA - indexB;
          });
          return newCols;
        });
      }
    } else {
      setFilteredColumns((prev) =>
        prev.filter((c) => (c.id || c.accessorKey) !== colId)
      );
    }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <LeadSearch
          onInputChange={onSearchChange}
          placeholder="Quick Search..."
        />
      </div>
      {!isDashboard && (
        <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
          <Dropdown
            renderTitle={<Button icon={<TbColumns />} />}
            placement="bottom-end"
          >
            <div className="flex flex-col p-2">
              <div className="font-semibold mb-1 border-b pb-1">
                Toggle Columns
              </div>
              {columns.map((col) => {
                const id = col.id || (col.accessorKey as string);
                return (
                  col.header && (
                    <div
                      key={id}
                      className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"
                    >
                      <Checkbox
                        checked={isColumnVisible(id)}
                        onChange={(checked) => toggleColumn(checked, id)}
                      >
                        {col.header as string}
                      </Checkbox>
                    </div>
                  )
                );
              })}
            </div>
          </Dropdown>
          <Button
            icon={<TbReload />}
            onClick={onClearFilters}
            title="Clear Filters & Reload"
          ></Button>
          <Button
            icon={<TbFilter />}
            onClick={onFilter}
            className="w-full sm:w-auto"
          >
            Filter{" "}
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button icon={<TbCloudUpload />} onClick={onExport}>
            Export
          </Button>
        </div>
      )}
    </div>
  );
};

const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
}: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const hasFilters = Object.values(filterData).some(
    (v) => Array.isArray(v) && v.length > 0
  );
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {filterData.filterStatuses?.map((item) => (
        <Tag key={`status-${item}`} prefix>
          Status: {item}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("filterStatuses", item)}
          />
        </Tag>
      ))}
      {filterData.filterEnquiryTypes?.map((item) => (
        <Tag key={`enquiry-${item}`} prefix>
          Enquiry: {item}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("filterEnquiryTypes", item)}
          />
        </Tag>
      ))}
      {filterData.filterIntents?.map((item) => (
        <Tag key={`intent-${item}`} prefix>
          Intent: {item}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("filterIntents", item)}
          />
        </Tag>
      ))}
      <Button
        size="xs"
        variant="plain"
        className="text-red-600 hover:text-red-500 hover:underline ml-auto"
        onClick={onClearAll}
      >
        Clear All
      </Button>
    </div>
  );
};

const LeadTable = (props: any) => <DataTable {...props} />;
const LeadSelectedFooter = ({ selectedItems, onDeleteSelected }: any) => {
  const [open, setOpen] = useState(false);
  if (!selectedItems || selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="p-4 border-t" stickyClass="-mx-4 sm:-mx-8">
        <div className="flex items-center justify-between">
          <span>{selectedItems.length} selected</span>
          <Button size="sm" color="red-500" onClick={() => setOpen(true)}>
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={open}
        type="danger"
        onConfirm={() => {
          onDeleteSelected();
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
        title="Delete Selected"
      >
        <p>Are you sure you want to delete the selected items?</p>
      </ConfirmDialog>
    </>
  );
};

// --- Main LeadsListing Component ---
const LeadsListing = ({ isDashboard }: { isDashboard?: boolean }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    LeadsData = { data: { data: [], counts: {} } },
    getAllUserData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [initialLoading, setInitialLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [isChangeStatusDrawerOpen, setIsChangeStatusDrawerOpen] =
    useState(false);
  const [leadToView, setLeadToView] = useState<LeadListItem | null>(null);
  const [editingLeadForDrawer, setEditingLeadForDrawer] =
    useState<LeadListItem | null>(null);
  const [isSubmittingDrawer, setIsSubmittingDrawer] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [modalState, setModalState] = useState<LeadModalState>({
    isOpen: false,
    type: null,
    data: null,
  });

  // --- START: NEW STATE FOR START PROCESS MODAL ---
  const [isStartProcessModalOpen, setIsStartProcessModalOpen] = useState(false);
  const [leadForProcess, setLeadForProcess] = useState<LeadListItem | null>(null);
  // --- END: NEW STATE ---

  // --- START: NEW STATE FOR PENDING LEADS ---
  const [isPendingLeadsModalOpen, setIsPendingLeadsModalOpen] = useState(false);
  // --- END: NEW STATE ---

  const handleOpenModal = useCallback(
    (type: LeadModalType, leadData: LeadListItem) =>
      setModalState({ isOpen: true, type, data: leadData }),
    []
  );
  const handleUpdateSuccess = useCallback(() => {
    dispatch(getLeadAction());
  }, [dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          dispatch(getLeadAction()),
          dispatch(getAllUsersAction()),
          dispatch(getFormBuilderAction()), // Fetches forms for the new modal
        ]);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleCloseModal = () =>
    setModalState({ isOpen: false, type: null, data: null });
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LeadListItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
    filterFormSchema.parse({})
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "createdAt" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<LeadListItem[]>([]);

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });
  const assignFormMethods = useForm<{ salesPersonId: string | number | null }>({
    defaultValues: { salesPersonId: null },
  });
  const statusFormMethods = useForm<{ newStatus: LeadStatus }>({
    defaultValues: { newStatus: "New" },
  });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
  });
  const getAllUserDataOptions = useMemo(
    () =>
      Array.isArray(getAllUserData)
        ? getAllUserData.map((user: any) => ({
          value: user.id,
          label: `(${user.employee_id}) - ${user.name || 'N/A'}`
        }))
        : [],
    [getAllUserData]
  );

  const mappedLeads: LeadListItem[] = useMemo(() => {
    if (!Array.isArray(LeadsData?.data?.data)) return [];
    return LeadsData?.data?.data.map(
      (apiLead: any): LeadListItem => ({
        id: apiLead.id,
       
        lead_number:  apiLead.lead_number || `LD-${apiLead.id}`,
        lead_status: apiLead.status || apiLead.lead_status || "New",
        enquiry_type: apiLead.lead_type || apiLead.enquiry_type || "Other",
        lead_info: apiLead.lead_info,
        productId: apiLead.product?.id,
        productName: apiLead.product?.name ?? "N/A",
        customerId: String(apiLead.customer?.id ?? apiLead.customer_id ?? "N/A"),
        customerName: apiLead.customer?.name ?? "N/A",
        lead_intent: (apiLead.want_to as LeadIntent) || "Buy",
        qty: apiLead.qty,
        target_price: apiLead.target_price,
        assigned_sales_person_id: apiLead.sales_person_id,
        sales_person_id: apiLead.sales_person_id,
        assigned_saled_id: apiLead.assigned_saled_id,
        salesPersonName: apiLead.sales_person_name,
        createdAt: new Date(apiLead.created_at),
        updatedAt: apiLead.updated_at ? new Date(apiLead.updated_at) : undefined,
        source_supplier_id: apiLead.source_member_id,
        sourceSupplierName: apiLead.source_supplier?.name,
        rawApiData: apiLead,
        buyer: apiLead.lead_info?.buyer,
        seller: apiLead.lead_info?.seller,
        member_email: apiLead.customer?.email,
        member_phone: apiLead.customer?.mobile_no,
        formId: apiLead.form_id,
      })
    );
  }, [LeadsData?.data?.data]);

  const { pageData, total, allFilteredAndSortedData } = useMemo((): {
    pageData: LeadListItem[];
    total: number;
    allFilteredAndSortedData: LeadListItem[];
  } => {
    let processedData = mappedLeads;
    if (filterCriteria.dateRange?.[0] || filterCriteria.dateRange?.[1]) {
      const [start, end] = filterCriteria.dateRange.map((d) =>
        d ? dayjs(d) : null
      );
      processedData = processedData.filter((item) => {
        const itemDate = dayjs(item.createdAt);
        if (start && end)
          return itemDate.isBetween(
            start.startOf("day"),
            end.endOf("day"),
            null,
            "[]"
          );
        if (start) return itemDate.isSameOrAfter(start.startOf("day"));
        if (end) return itemDate.isSameOrBefore(end.endOf("day"));
        return true;
      });
    }
    if (filterCriteria.filterStatuses?.length) {
      const statuses = new Set(filterCriteria.filterStatuses);
      processedData = processedData.filter((item) =>
        statuses.has(item.lead_status)
      );
    }
    if (filterCriteria.filterEnquiryTypes?.length) {
      const types = new Set(filterCriteria.filterEnquiryTypes);
      processedData = processedData.filter((item) =>
        types.has(item.enquiry_type)
      );
    }
    if (filterCriteria.filterIntents?.length) {
      const intents = new Set(filterCriteria.filterIntents);
      processedData = processedData.filter(
        (item) => !!item.lead_intent && intents.has(item.lead_intent)
      );
    }
    if (filterCriteria.filterProductIds?.length) {
      const productIds = new Set(filterCriteria.filterProductIds);
      processedData = processedData.filter(
        (item) => !!item.productId && productIds.has(item.productId)
      );
    }
    if (filterCriteria.filterSalesPersonIds?.length) {
      const spIds = new Set(filterCriteria.filterSalesPersonIds);
      processedData = processedData.filter(
        (item) =>
          !!item.assigned_sales_person_id &&
          spIds.has(String(item.assigned_sales_person_id))
      );
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          String(item.lead_number).toLowerCase().includes(query) ||
          String(item.productName).toLowerCase().includes(query) ||
          String(item.customerName).toLowerCase().includes(query) ||
          String(item.customerId).toLowerCase().includes(query) ||
          String(item.salesPersonName).toLowerCase().includes(query) ||
          String(item.lead_status).toLowerCase().includes(query) ||
          String(item.enquiry_type).toLowerCase().includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof LeadListItem] as any;
        let bVal = b[key as keyof LeadListItem] as any;
        if (key === "createdAt" || key === "updatedAt") {
          const dateA = aVal ? dayjs(aVal).valueOf() : 0;
          const dateB = bVal ? dayjs(bVal).valueOf() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
        return order === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
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
  }, [mappedLeads, tableData, filterCriteria]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterStatuses?.length) count++;
    if (filterCriteria.filterEnquiryTypes?.length) count++;
    if (filterCriteria.filterIntents?.length) count++;
    if (filterCriteria.filterProductIds?.length) count++;
    if (filterCriteria.filterSalesPersonIds?.length) count++;
    if (
      filterCriteria.dateRange &&
      (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])
    )
      count++;
    return count;
  }, [filterCriteria]);

  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
  const handleOpenAddLeadPage = useCallback(() => {
    navigate("/sales-leads/lead/add");
  }, [navigate]);
  const handleOpenEditLeadPage = useCallback(
    (lead: LeadListItem) => {
      navigate(`/sales-leads/lead/edit/${lead.id}`);
    },
    [navigate]
  );

  // --- UPDATED: New handleStartProcess function to open the modal ---
  const handleStartProcess = useCallback((lead: LeadListItem) => {
    setLeadForProcess(lead);
    setIsStartProcessModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((item: LeadListItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsProcessingDelete(true);
    try {
      await dispatch(deleteLeadAction(itemToDelete.id as number)).unwrap();
      toast.push(
        <Notification title="Success" type="success">
          Lead deleted.
        </Notification>
      );
      dispatch(getLeadAction());
      setSelectedItems((p) => p.filter((i) => i.id !== itemToDelete.id));
    } catch (e: any) {
      toast.push(
        <Notification title="Error" type="danger">
          {e.message || "Delete failed."}
        </Notification>
      );
    } finally {
      setIsProcessingDelete(false);
      setItemToDelete(null);
      setSingleDeleteConfirmOpen(false);
    }
  }, [dispatch, itemToDelete]);

  const onDeleteSelected = useCallback(async () => {
    if (!selectedItems.length) return;
    setIsProcessingDelete(true);
    const ids = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatch(deleteAllLeadsAction({ ids })).unwrap();
      toast.push(
        <Notification title="Success" type="success">
          {selectedItems.length} leads deleted.
        </Notification>
      );
      dispatch(getLeadAction());
      setSelectedItems([]);
    } catch (e: any) {
      toast.push(
        <Notification title="Error" type="danger">
          {e.message || "Bulk delete failed."}
        </Notification>
      );
    } finally {
      setIsProcessingDelete(false);
    }
  }, [dispatch, selectedItems]);

  const openAssignDrawer = useCallback(
    (lead: LeadListItem) => {
      setEditingLeadForDrawer(lead);
      assignFormMethods.reset({
        salesPersonId: lead.assigned_sales_person_id || null,
      });
      setIsAssignDrawerOpen(true);
    },
    [assignFormMethods]
  );
  const closeAssignDrawer = useCallback(() => {
    setIsAssignDrawerOpen(false);
    setEditingLeadForDrawer(null);
  }, []);
  const onAssignSubmit = useCallback(async () => {
    if (!editingLeadForDrawer) return;
    setIsSubmittingDrawer(true);
    try {
      console.log("Simulating assign...");
      await new Promise((r) => setTimeout(r, 500));
      toast.push(
        <Notification title="Success" type="success">
          Lead assigned.
        </Notification>
      );
      closeAssignDrawer();
      dispatch(getLeadAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Error" type="danger">
          Assignment failed.
        </Notification>
      );
    } finally {
      setIsSubmittingDrawer(false);
    }
  }, [dispatch, editingLeadForDrawer, closeAssignDrawer]);

  const openChangeStatusDrawer = useCallback(
    (lead: LeadListItem) => {
      setEditingLeadForDrawer(lead);
      statusFormMethods.reset({ newStatus: lead.lead_status });
      setIsChangeStatusDrawerOpen(true);
    },
    [statusFormMethods]
  );
  const closeChangeStatusDrawer = useCallback(() => {
    setIsChangeStatusDrawerOpen(false);
    setEditingLeadForDrawer(null);
  }, []);
  const onChangeStatusSubmit = useCallback(async () => {
    if (!editingLeadForDrawer) return;
    setIsSubmittingDrawer(true);
    try {
      console.log("Simulating status change...");
      await new Promise((r) => setTimeout(r, 500));
      toast.push(
        <Notification title="Success" type="success">
          Status updated.
        </Notification>
      );
      closeChangeStatusDrawer();
      dispatch(getLeadAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Error" type="danger">
          Status update failed.
        </Notification>
      );
    } finally {
      setIsSubmittingDrawer(false);
    }
  }, [dispatch, editingLeadForDrawer, closeChangeStatusDrawer]);
  const openViewDialog = useCallback((lead: LeadListItem) => { navigate(`/sales-leads/lead/view/${lead.id}`) }, []);
  const closeViewDialog = useCallback(() => setLeadToView(null), []);

  const handleOpenExportModal = useCallback(() => {
    if (!allFilteredAndSortedData || allFilteredAndSortedData.length === 0) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  }, [allFilteredAndSortedData, exportReasonFormMethods]);
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Leads";
    const date = new Date().toISOString().split("T")[0];
    const fileName = `leads_export_${date}.csv`;
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
      exportLeadsToCsv(fileName, allFilteredAndSortedData);
      toast.push(
        <Notification title="Data Exported" type="success">
          Leads data exported.
        </Notification>
      );
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Operation Failed"
          type="danger"
        >
          {String(error.message) || "Could not complete export."}
        </Notification>
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handlePageSizeChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: value, pageIndex: 1 });
      setSelectedItems([]);
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: LeadListItem) =>
      setSelectedItems((prev) =>
        checked
          ? prev.some((i) => i.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((i) => i.id !== row.id)
      ),
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<LeadListItem>[]) => {
      const originals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prev) => {
          const oldIds = new Set(prev.map((i) => i.id));
          return [...prev, ...originals.filter((o) => !oldIds.has(o.id))];
        });
      } else {
        const currentIds = new Set(originals.map((o) => o.id));
        setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id)));
      }
    },
    []
  );

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria(data);
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [handleSetTableData, closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const defaults = filterFormSchema.parse({});
    filterFormMethods.reset(defaults);
    setFilterCriteria(defaults);
    handleSetTableData({ pageIndex: 1, query: "" });
    dispatch(getLeadAction());
    setIsFilterDrawerOpen(false);
  }, [filterFormMethods, handleSetTableData, dispatch]);
  const handleCardClick = (status: LeadStatus) => {
    onClearFilters();
    setFilterCriteria({ ...filterFormSchema.parse({}), filterStatuses: [status] });
  };
  const handleRemoveFilter = useCallback(
    (key: keyof FilterFormData, value: string) => {
      setFilterCriteria((prev) => {
        const newFilters = { ...prev };
        const currentValues = prev[key] as string[] | undefined;
        if (currentValues) {
          const newValues = currentValues.filter((item) => item !== value);
          (newFilters as any)[key] =
            newValues.length > 0 ? newValues : undefined;
        }
        return newFilters;
      });
      handleSetTableData({ pageIndex: 1 });
    },
    [handleSetTableData]
  );

  const columns: ColumnDef<LeadListItem>[] = useMemo(() => {
    const baseColumns: ColumnDef<LeadListItem>[] = [
      {
        header: "Lead",
        accessorKey: "lead_number",
        size: 130,
        cell: (props: CellContext<LeadListItem, any>) => (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold">{props.row.original.enquiry_type == "Manual lead" ? `ML-${props.row.original.id.toString().padStart(5, '0')}` : props.row.original.enquiry_type == "Product lead" ?  `PL-${props.row.original.id.toString().padStart(5, '0')}` : props.row.original.enquiry_type == "Wall lead" ? `WL-${props.row.original.id.toString().padStart(5, '0')}` : null}</span>
            <div>
              <Tag
                className={`${enquiryTypeColor[props.row.original.enquiry_type] ||
                  enquiryTypeColor.default
                  } capitalize px-2 py-1 text-xs`}
              >
                {props.row.original.enquiry_type}
              </Tag>
            </div>
          </div>
        ),
      },
      {
        header: "Product",
        accessorKey: "productName",
        size: 200,
        cell: (props: CellContext<LeadListItem, any>) =>
          props.row.original.productName || "-",
      },
      {
        header: "Status",
        accessorKey: "lead_status",
        size: 120,
        cell: (props: CellContext<LeadListItem, any>) => (
          <Tag
            className={`${leadStatusColor[props.row.original.lead_status] ||
              leadStatusColor.default
              } capitalize px-2 py-1 text-xs`}
          >
            {props.row.original.lead_status}
          </Tag>
        ),
      },
      {
        header: "Member",
        accessorKey: "lead_info",
        size: 200,
        cell: (props: CellContext<LeadListItem, any>) => {
          const { buyer, seller } = props.row.original;
          const hasBuyer = buyer && typeof buyer === 'object' && buyer.name;
          const hasSeller = seller && typeof seller === 'object' && seller.name;

          return (
            <div className="flex flex-col gap-1.5 text-xs">
              {hasBuyer ? (
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">Buyer : {buyer.member_code || ''}</div>
                  <div className="truncate">{buyer.name}</div>
                </div>
              ) : (
                <div className="text-gray-400 italic">No Buyer Info</div>
              )}

              {hasBuyer && hasSeller && <hr className="border-t border-dashed border-gray-200 dark:border-gray-600 my-1" />}

              {hasSeller ? (
                <div>
                  <div className="font-bold text-gray-800 dark:text-gray-200">Supplier : {seller.member_code || ''}</div>
                  <div className="truncate">{seller.name}</div>
                </div>
              ) : (
                <div className="text-gray-400 italic">No Supplier Info</div>
              )}
            </div>
          );
        },
      },
      {
        header: "Details",
        size: 220,
        cell: (props: CellContext<LeadListItem, any>) => {
          const formattedDate = props.row.original.createdAt
            ? dayjs(props.row.original.createdAt).format('DD MMM YYYY, h:mm A')
            : "N/A";
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <Tag className="capitalize">{props.row.original.lead_intent || "Buy"}</Tag>
                <span><strong>Qty:</strong> {props.row.original.qty ?? "-"}</span>
              </div>
              <span>
                <strong>Target Price:</strong> {props.row.original.target_price ? `$${props.row.original.target_price}` : "-"}
              </span>
              <span>
                <strong>Sales Person:</strong>{" "}
                {props.row.original.salesPersonName || "Unassigned"}
              </span>
              <b className="mt-1">{formattedDate}</b>
            </div>
          );
        },
      },
    ];

    if (!isDashboard) {
      baseColumns.push({
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center" },
        size: 80,
        cell: (props: CellContext<LeadListItem, any>) => (
          <LeadActionColumn
            data={props.row.original}
            onViewDetail={() => openViewDialog(props.row.original)}
            onEdit={() => handleOpenEditLeadPage(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onAssign={() => openAssignDrawer(props.row.original)}
            onChangeStatus={() => openChangeStatusDrawer(props.row.original)}
            onOpenModal={(type) => handleOpenModal(type, props.row.original)}
            onStartProcess={() => handleStartProcess(props.row.original)}
          />
        ),
      });
    }

    return baseColumns;
  }, [
    isDashboard,
    openViewDialog,
    handleOpenEditLeadPage,
    handleDeleteClick,
    openAssignDrawer,
    openChangeStatusDrawer,
    handleOpenModal,
    handleStartProcess,
  ]);

  const [filteredColumns, setFilteredColumns] =
    useState<ColumnDef<LeadListItem>[]>(columns);
  useEffect(() => {
    setFilteredColumns(columns);
  }, [columns]);

  const tableIsLoading =
    (masterLoadingStatus === "loading" ||
      masterLoadingStatus === "pending" ||
      isSubmittingDrawer ||
      isProcessingDelete) && !initialLoading;

  const cardClass =
    "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  const renderCardContent = (content: number | undefined, colorClass: string) => {
    if (initialLoading) {
      return <Skeleton width={40} height={20} />;
    }
    return <b className={colorClass}>{content ?? 0}</b>;
  };

  const skeletonColumns: ColumnDef<LeadListItem>[] = useMemo(() =>
    columns.map((col) => ({
      ...col,
      cell: () => <Skeleton height={40} className="my-2" />,
    })), [columns]);

  const skeletonData = useMemo(() =>
    Array.from({ length: tableData.pageSize }, (_, i) => ({ id: `skeleton-${i}` })),
    [tableData.pageSize]);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          {!isDashboard && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h5 className="mb-2 sm:mb-0">Leads Listing</h5>
              <div className="flex items-center gap-2">
                <Button
                  variant="solid"
                  color="blue-600"
                  onClick={() => setIsPendingLeadsModalOpen(true)}
                  disabled={initialLoading}
                >
                  Pending Leads
                </Button>
                <Button
                  variant="solid"
                  icon={<TbPlus />}
                  onClick={handleOpenAddLeadPage}
                  disabled={initialLoading}
                >
                  Add New
                </Button>
              </div>
            </div>
          )}
          {!isDashboard && (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-8 mb-4 gap-2 ">
              <Tooltip title="Click to show all leads">
                <div onClick={onClearFilters}>
                  <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}>
                    <div className="h-9 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbTrophy size={20} /></div>
                    <div className="flex flex-col">{renderCardContent(LeadsData?.counts?.total, "text-blue-500")}<span className="font-semibold text-[10px]">Total</span></div>
                  </Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show leads from today">
                <div onClick={() => { }}>
                  <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}>
                    <div className="h-9 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbCalendar size={20} /></div>
                    <div className="flex flex-col">{renderCardContent(LeadsData?.counts?.today, "text-violet-500")}<span className="font-semibold text-[10px]">Today</span></div>
                  </Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show active leads">
                <div onClick={() => handleCardClick("New")}>
                  <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-300")}>
                    <div className="h-9 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbCircleCheck size={20} /></div>
                    <div className="flex flex-col">{renderCardContent(LeadsData?.counts?.new, "text-green-500")}<span className="font-semibold text-[10px]">New</span></div>
                  </Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show 'Deal Done' leads">
                <div onClick={() => handleCardClick("Won")}>
                  <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-300")}>
                    <div className="h-9 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbFlag size={20} /></div>
                    <div className="flex flex-col">{renderCardContent(LeadsData?.counts?.deal_done, "text-green-500")}<span className="font-semibold text-[10px]">Deal Done</span></div>
                  </Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show 'Cancelled' leads">
                <div onClick={() => handleCardClick("Lost")}>
                  <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}>
                    <div className="h-9 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbFlagX size={20} /></div>
                    <div className="flex flex-col">{renderCardContent(LeadsData?.counts?.cancelled, "text-red-500")}<span className="font-semibold text-[10px]">Cancelled</span></div>
                  </Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show Product leads">
                <div onClick={() => handleCardClick("Product Info")}>
                  <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}>
                    <div className="h-9 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbBox size={20} /></div>
                    <div className="flex flex-col">{renderCardContent(LeadsData?.counts?.product_lead, "text-violet-500")}<span className="font-semibold text-[10px]">Product Lead</span></div>
                  </Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show Wall leads">
                <div onClick={() => handleCardClick("Wall Listing")}>
                  <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-pink-200")}>
                    <div className="h-9 w-8 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbListDetails size={20} /></div>
                    <div className="flex flex-col">{renderCardContent(LeadsData?.counts?.wall_lead, "text-pink-500")}<span className="font-semibold text-[10px]">Wall Lead</span></div>
                  </Card>
                </div>
              </Tooltip>
              <Tooltip title="Click to show Manual leads">
                <div onClick={() => handleCardClick("Manual Lead")}>
                  <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-orange-200")}>
                    <div className="h-9 w-8 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbPennant size={20} /></div>
                    <div className="flex flex-col">{renderCardContent(LeadsData?.counts?.manual_lead, "text-orange-500")}<span className="font-semibold text-[10px]">Manual Lead</span></div>
                  </Card>
                </div>
              </Tooltip>
            </div>
          )}
          <div className="mb-4">
            <LeadTableTools
              isDashboard={isDashboard}
              onClearFilters={onClearFilters}
              onSearchChange={handleSearchChange}
              onFilter={openFilterDrawer}
              onExport={handleOpenExportModal}
              columns={columns}
              filteredColumns={filteredColumns}
              setFilteredColumns={setFilteredColumns}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <ActiveFiltersDisplay
            filterData={filterCriteria}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={onClearFilters}
          />
          <div className="flex-grow overflow-auto">
            {initialLoading ? (
              <LeadTable
                menuName="leads"
                columns={skeletonColumns}
                data={skeletonData}
                selectable={false}
                pagingData={{
                  total: tableData.pageSize as number,
                  pageIndex: 1,
                  pageSize: tableData.pageSize as number,
                }}
              />
            ) : (
              <LeadTable
                menuName="leads"
                columns={filteredColumns}
                data={pageData}
                loading={tableIsLoading}
                pagingData={{
                  total,
                  pageIndex: tableData.pageIndex as number,
                  pageSize: tableData.pageSize as number,
                }}
                selectable
                noData={!tableIsLoading && pageData.length === 0}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handlePageSizeChange}
                onSort={handleSort}
                onRowSelect={handleRowSelect}
                onAllRowSelect={handleAllRowSelect}
              />
            )}
          </div>
        </AdaptiveCard>
      </Container>
      <LeadSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={onDeleteSelected}
      />
      <Dialog
        isOpen={!!leadToView}
        onClose={closeViewDialog}
        onRequestClose={closeViewDialog}
        width={700}
      >
        <h5 className="mb-4 text-lg font-semibold">
          Lead Details - {leadToView?.lead_number}
        </h5>
        {leadToView ? (
          <div className="space-y-3 text-sm max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {(Object.keys(leadToView.rawApiData) as Array<keyof any>).map(
              (key) => {
                const label = String(key)
                  .replace(/_/g, " ")
                  .replace(/([A-Z])/g, " $1")
                  .trim()
                  .replace(/\b\w/g, (l) => l.toUpperCase());
                const value: any = leadToView.rawApiData[key];
                let displayValue: React.ReactNode;
                const nameDisplayKeys = [
                  "buyer",
                  "seller",
                  "product",
                  "customer",
                  "created_by_user",
                  "updated_by_user",
                  "lead_info",
                ];
                if ((key === "created_at" || key === "updated_at") && value) {
                  displayValue = dayjs(value).format("DD MMM, YYYY h:mm A");
                } else if (nameDisplayKeys.includes(String(key))) {
                  if (
                    value &&
                    typeof value === "object" &&
                    "name" in value &&
                    value.name !== null &&
                    value.name !== undefined
                  ) {
                    displayValue = String(value.name);
                  } else {
                    return null;
                  }
                } else if (
                  typeof value === "object" &&
                  value !== null &&
                  !(value instanceof Date)
                ) {
                  return null;
                } else {
                  displayValue =
                    value === null || value === undefined || value === "" ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      String(value)
                    );
                }
                return (
                  <div
                    key={key as string}
                    className="flex py-1.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <span className="font-medium w-1/3 text-gray-700 dark:text-gray-300">
                      {label}:
                    </span>
                    <div className="w-2/3 text-gray-900 dark:text-gray-100 break-words">
                      {displayValue}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        ) : (
          <div className="p-10 text-center">
            <TbInfoCircle size={32} className="mx-auto mb-2 text-gray-400" />
            <p>No lead data to display.</p>
          </div>
        )}
        <div className="text-right mt-6">
          <Button variant="solid" onClick={closeViewDialog}>
            Close
          </Button>
        </div>
      </Dialog>
      <Drawer
        title="Assign Lead"
        isOpen={isAssignDrawerOpen}
        onClose={closeAssignDrawer}
        width={400}
        footer={
          <div className="text-right p-4 border-t">
            <Button size="sm" className="mr-2" onClick={closeAssignDrawer}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="assignLeadForm"
              type="submit"
              loading={isSubmittingDrawer}
            >
              Assign
            </Button>
          </div>
        }
      >
        <Form
          id="assignLeadForm"
          onSubmit={assignFormMethods.handleSubmit(onAssignSubmit)}
          className="p-4"
        >
          <p className="mb-4">
            Assign lead <strong>{editingLeadForDrawer?.lead_number}</strong>.
          </p>
          <FormItem
            label="Sales Person"
            errorMessage={assignFormMethods.formState.errors.salesPersonId?.message}
          >
            <Controller
              name="salesPersonId"
              control={assignFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  options={dummySalesPersons.map((sp) => ({
                    value: sp.id,
                    label: sp.name,
                  }))}
                  value={dummySalesPersons.find((sp) => sp.id === field.value) ?? null}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                  placeholder="Select Sales Person"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
      <Drawer
        title="Change Lead Status"
        isOpen={isChangeStatusDrawerOpen}
        onClose={closeChangeStatusDrawer}
        width={400}
        footer={
          <div className="text-right p-4 border-t">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeChangeStatusDrawer}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="changeStatusForm"
              type="submit"
              loading={isSubmittingDrawer}
            >
              Update
            </Button>
          </div>
        }
      >
        <Form
          id="changeStatusForm"
          onSubmit={statusFormMethods.handleSubmit(onChangeStatusSubmit)}
          className="p-4"
        >
          <p className="mb-4">
            Change status for{" "}
            <strong>{editingLeadForDrawer?.lead_number}</strong>.
          </p>
          <FormItem
            label="New Status"
            errorMessage={statusFormMethods.formState.errors.newStatus?.message}
          >
            <Controller
              name="newStatus"
              control={statusFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  options={leadStatusOptionsConst}
                  value={leadStatusOptionsConst.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(opt: any) =>
                    field.onChange(opt?.value as LeadStatus)
                  }
                  placeholder="Select New Status"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={onClearFilters}
              type="button"
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterLeadForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterLeadForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4 h-full"
        >
          <FormItem label="Status">
            <Controller
              name="filterStatuses"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  options={leadStatusOptionsConst}
                  value={leadStatusOptionsConst.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts: any) =>
                    field.onChange(opts?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </FormItem>
          <FormItem label="Enquiry Type">
            <Controller
              name="filterEnquiryTypes"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  options={enquiryTypeOptionsConst}
                  value={enquiryTypeOptionsConst.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts: any) =>
                    field.onChange(opts?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </FormItem>
          <FormItem label="Intent">
            <Controller
              name="filterIntents"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  options={leadIntentOptionsConst}
                  value={leadIntentOptionsConst.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts: any) =>
                    field.onChange(opts?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </FormItem>
          <FormItem label="Product (Sourced)">
            <Controller
              name="filterProductIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  options={dummyProducts.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  value={dummyProducts
                    .filter((o) => field.value?.includes(o.value))
                    .map((p) => ({ value: p.id, label: p.name }))}
                  onChange={(opts: any) =>
                    field.onChange(opts?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </FormItem>
          <FormItem label="Sales Person">
            <Controller
              name="filterSalesPersonIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  options={dummySalesPersons.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  value={dummySalesPersons
                    .filter((o) => field.value?.includes(String(o.value)))
                    .map((p) => ({ value: p.id, label: p.name }))}
                  onChange={(opts: any) =>
                    field.onChange(opts?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </FormItem>
          <FormItem label="Date Range">
            <Controller
              name="dateRange"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePicker.DatePickerRange
                  value={field.value as [Date | null, Date | null] | null}
                  onChange={field.onChange}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Lead"
        onClose={() => setSingleDeleteConfirmOpen(false)}
        onConfirm={onConfirmSingleDelete}
        loading={isProcessingDelete}
        onCancel={() => setSingleDeleteConfirmOpen(false)}
      >
        <p>
          Are you sure you want to delete lead{" "}
          <strong>{itemToDelete?.lead_number}</strong>? This action cannot be
          undone.
          3260032
        </p>
      </ConfirmDialog>

      {/* --- ADDED: Render the new modals --- */}
      <StartProcessModal
        isOpen={isStartProcessModalOpen}
        onClose={() => setIsStartProcessModalOpen(false)}
        lead={leadForProcess}
      />
      <LeadModals
        modalState={modalState}
        onClose={handleCloseModal}
        onSuccess={handleUpdateSuccess}
        getAllUserDataOptions={getAllUserDataOptions}
      />

      <PendingLeadsModal
        isOpen={isPendingLeadsModalOpen}
        onClose={() => setIsPendingLeadsModalOpen(false)}
        onActionSuccess={handleUpdateSuccess}
      />

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
          isSubmittingExportReason ? "Exporting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <Form
          id="exportLeadsReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
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
                  placeholder="e.g., Weekly sales report..."
                  rows={3}
                />
              )}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};
export default LeadsListing;