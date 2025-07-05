import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import React, {
  Fragment,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import dayjs from "dayjs";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DebouceInput from "@/components/shared/DebouceInput";
import FileNotFound from "@/assets/svg/FileNotFound";
import Loading from "@/components/shared/Loading";
import RichTextEditor from "@/components/shared/RichTextEditor";
import StickyFooter from "@/components/shared/StickyFooter";
import TableRowSkeleton from "@/components/shared/loaders/TableRowSkeleton";
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
  Pagination,
  Progress,
  Select,
  Table,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import {
  BsCheckCircleFill,
  BsThreeDotsVertical,
  BsXCircleFill,
} from "react-icons/bs";
import {
  TbAlarm,
  TbAlertTriangle,
  TbBell,
  TbBox,
  TbBrandWhatsapp,
  TbBriefcase,
  TbBuilding,
  TbBulb,
  TbCalendarEvent,
  TbChecks,
  TbChecklist,
  TbCircleCheck,
  TbClockHour4,
  TbCloudUpload,
  TbColumns,
  TbCopy,
  TbDiscount,
  TbExchange,
  TbEye,
  TbFilter,
  TbIdBadge2,
  TbInfoCircle,
  TbLink as TbLinkIcon,
  TbMail,
  TbMinus,
  TbNotebook,
  TbPhone,
  TbPlus,
  TbProgressCheck,
  TbRadar2,
  TbReload,
  TbSearch,
  TbTag,
  TbTagStarred,
  TbTargetArrow,
  TbTrash,
  TbUser,
  TbUserCheck,
  TbUsers,
  TbX,
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import {
  ColumnDef,
  ColumnSort,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import type { CheckboxProps } from "@/components/ui/Checkbox";
import type { SkeletonProps } from "@/components/ui/Skeleton";
import type { TableProps } from "@/components/ui/Table";
import type { ChangeEvent, ReactNode } from "react";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addNotificationAction,
  addScheduleAction,
  getAllUsersAction,
  getAutoMatchDataAction,
  getOpportunitiesAction,
  submitExportReasonAction,
  // Assume getAutoSpbAction is available for dispatch
  // getAutoSpbAction
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";

// --- Define API Item Type (Matches API Response Structure) ---
export type ApiOpportunityItem = {
  id: string;
  opportunity_id: string | null;
  product_name: string;
  product_image_url?: string | null;
  status: string;
  opportunity_status: string | null;
  match_score: number | null;
  created_date: string | null;
  buy_listing_id: string | null;
  sell_listing_id: string | null;
  spb_role: string | null;
  product_category: string | null;
  product_subcategory: string | null;
  brand: string | null;
  product_specs: string | null;
  quantity: string | number | null;
  product_status_listing: string | null;
  want_to: string;
  company_name: string | null;
  company_id: string | null;
  company_code?: string | null;
  company_verified?: boolean;
  company_billing_enabled?: boolean;
  member_name: string | null;
  member_id: string | null;
  member_code?: string | null;
  member_email: string | null;
  member_phone: string | null;
  member_type: string | null;
  member_country?: string | null;
  member_country_flag?: string | null;
  member_verified?: boolean;
  member_business_type?: string | null;
  price_match_type: string | null;
  quantity_match_listing: string | null;
  location_match: string | null;
  matches_found_count: number | null;
  updated_at: string | null;
  assigned_to: number | string | null;
  notes: string | null;
  listing_url: string | null;
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Define Auto SPB API Types ---
export type AutoSpbApiItem = {
  id: number;
  customer_code: string | null;
  phonecode: string | null;
  mobile_no: string | null;
  brand_name: string | null;
  product_name: string | null;
  qty: string;
  created_at: string;
  product_status: string;
  product_specs: string | null;
  device_type: string | null;
  price: string;
  color: string;
  master_cartoon: string | null;
  dispatch_status: string;
  payment_term: string | null;
  device_condition: string;
  eta_details: string;
  location: string;
  summary: any;
  unit: any;
};

export type AutoSpbApiResponse = {
  status: boolean;
  message: string;
  data: Record<
    string,
    {
      Buy?: AutoSpbApiItem[];
      Sell?: AutoSpbApiItem[];
    }
  >;
  autospbNumber: number;
};

// --- Define UI Item Type (Table Row Data) ---
export type OpportunityItem = {
  id: string;
  opportunity_id: string;
  product_name: string;
  product_image_url?: string;
  status: "pending" | "active" | "on_hold" | "closed" | string;
  opportunity_status: "New" | "Shortlisted" | "Converted" | "Rejected" | string;
  match_score: number;
  created_date: string;
  buy_listing_id?: string;
  sell_listing_id?: string;
  spb_role?: "Seller" | "Buyer" | string;
  product_category?: string;
  product_subcategory?: string;
  brand?: string;
  product_specs?: string;
  quantity?: number;
  product_status_listing?: "In Stock" | "Low Stock" | "Out of Stock" | string;
  want_to?: "Buy" | "Sell" | "Exchange" | string;
  company_name: string;
  company_id?: string;
  company_code?: string;
  company_verified?: boolean;
  company_billing_enabled?: boolean;
  member_name: string;
  member_id?: string;
  member_code?: string;
  member_email?: string;
  member_phone?: string;
  member_type: "Standard" | "Premium" | "INS-PREMIUM" | string;
  member_country?: string;
  member_country_flag?: string;
  member_verified?: boolean;
  member_business_type?: string;
  price_match_type?: "Exact" | "Range" | "Not Matched" | string;
  quantity_match_listing?: "Sufficient" | "Partial" | "Not Matched" | string;
  location_match?: "Local" | "National" | "Not Matched" | string;
  matches_found_count?: number;
  updated_at?: string;
  assigned_to?: string;
  notes?: string;
  listing_url: string | null;
  updated_by_name?: string;
  updated_by_role?: string;
  // Custom fields for Auto SPB data
  _rawSpbBuyItems?: AutoSpbApiItem[];
  _rawSpbSellItems?: AutoSpbApiItem[];
};

// --- Form Schemas ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;
export type SelectOption = { value: any; label: string };

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

// ============================================================================
// --- MODALS SECTION ---
// ============================================================================

export type OpportunityModalType =
  | "email"
  | "whatsapp"
  | "notification"
  | "task"
  | "active"
  | "calendar"
  | "alert";

export interface OpportunityModalState {
  isOpen: boolean;
  type: OpportunityModalType | null;
  data: OpportunityItem | null;
}
interface OpportunityModalsProps {
  modalState: OpportunityModalState;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}

// --- Helper Data for Modal Demos ---
const dummyUsers = [
  { value: "user1", label: "Alice Johnson" },
  { value: "user2", label: "Bob Williams" },
];
const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
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

const SendEmailDialog: React.FC<{
  opportunity: OpportunityItem;
  onClose: () => void;
}> = ({ opportunity, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { subject: "", message: "" },
  });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true);
    console.log(
      "Sending email to",
      opportunity.member_email,
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
      <h5 className="mb-4">Send Email to {opportunity.member_name}</h5>
      <form onSubmit={handleSubmit(onSendEmail)}>
        <FormItem label="Subject">
          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder={`Regarding Opportunity: ${opportunity.opportunity_id}`}
              />
            )}
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
  opportunity: OpportunityItem;
  onClose: () => void;
}> = ({ opportunity, onClose }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      message: `Hi ${opportunity.member_name}, regarding opportunity ${opportunity.opportunity_id} for "${opportunity.product_name}".`,
    },
  });
  const onSendMessage = (data: { message: string }) => {
    const phone = opportunity.member_phone?.replace(/\D/g, "");
    if (!phone) {
      toast.push(<Notification type="danger" title="Invalid Phone Number" />);
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      data.message
    )}`;
    window.open(url, "_blank");
    toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
    onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send WhatsApp to {opportunity.member_name}</h5>
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

const AddNotificationDialog: React.FC<{
  opportunity: OpportunityItem;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}> = ({ opportunity, onClose, getAllUserDataOptions }) => {
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
      notification_title: `Update on Opportunity: ${opportunity.opportunity_id}`,
      send_users: [],
      message: `This is a notification regarding opportunity ID ${opportunity.opportunity_id} for the product "${opportunity.product_name}".`,
    },
    mode: "onChange",
  });

  const onSend = async (formData: NotificationFormData) => {
    setIsLoading(true);
    const payload = {
      send_users: formData.send_users,
      notification_title: formData.notification_title,
      message: formData.message,
      module_id: String(opportunity.id),
      module_name: "Opportunity",
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
      <h5 className="mb-4">
        Add Notification for {opportunity.opportunity_id}
      </h5>
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
              <Select
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
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            loading={isLoading}
            disabled={!isValid || isLoading}
          >
            Send Notification
          </Button>
        </div>
      </Form>
    </Dialog>
  );
};

const AssignTaskDialog: React.FC<{
  opportunity: OpportunityItem;
  onClose: () => void;
}> = ({ opportunity, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: {
      title: "",
      assignee: null,
      dueDate: null,
      priority: null,
      description: "",
    },
  });
  const onAssignTask = (data: any) => {
    setIsLoading(true);
    console.log(
      "Assigning task for",
      opportunity.opportunity_id,
      "with data:",
      data
    );
    setTimeout(() => {
      toast.push(<Notification type="success" title="Task Assigned" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for {opportunity.opportunity_id}</h5>
      <form onSubmit={handleSubmit(onAssignTask)}>
        <FormItem label="Task Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Follow up on opportunity" />
            )}
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Assign To">
            <Controller
              name="assignee"
              control={control}
              render={({ field }) => (
                <Select
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
                <Select
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
                value={field.value}
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
  opportunity: OpportunityItem;
  onClose: () => void;
}> = ({ opportunity, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_title: `Regarding Opportunity: ${opportunity.opportunity_id}`,
      event_type: undefined,
      date_time: null as any,
      remind_from: null,
      notes: `Details for opportunity "${opportunity.opportunity_id}" for product "${opportunity.product_name}".`,
    },
    mode: "onChange",
  });

  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = {
      module_id: Number(opportunity.id),
      module_name: "Opportunity",
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
          children={`Successfully scheduled event for opportunity ${opportunity.opportunity_id}.`}
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
      <h5 className="mb-4">Add Schedule for {opportunity.opportunity_id}</h5>
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
                <Select
                  placeholder="Select Type"
                  options={eventTypeOptions}
                  value={eventTypeOptions.find((o) => o.value === field.value)}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Date & Time"
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

const ViewAlertDialog: React.FC<{
  opportunity: OpportunityItem;
  onClose: () => void;
}> = ({ opportunity, onClose }) => {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Alerts for {opportunity.opportunity_id}</h5>
      <div className="mt-4 flex flex-col gap-3">
        <div
          className={`p-3 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-500/10`}
        >
          <div className="flex items-start gap-2">
            <TbAlertTriangle className="text-amber-500 mt-1" size={20} />
            <p className="text-sm">Opportunity has been pending for 7 days.</p>
          </div>
        </div>
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
  type: OpportunityModalType | null;
  opportunity: OpportunityItem;
  onClose: () => void;
}> = ({ type, opportunity, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type
    ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}`
    : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true);
    console.log(
      `Performing action '${type}' for opportunity ${opportunity.opportunity_id}`
    );
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
        Are you sure you want to perform this action for{" "}
        <span className="font-semibold">{opportunity.opportunity_id}</span>?
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

const OpportunityModals: React.FC<OpportunityModalsProps> = ({
  modalState,
  onClose,
  getAllUserDataOptions,
}) => {
  const { type, data: opportunity, isOpen } = modalState;
  if (!isOpen || !opportunity) return null;

  const renderModalContent = () => {
    switch (type) {
      case "email":
        return <SendEmailDialog opportunity={opportunity} onClose={onClose} />;
      case "whatsapp":
        return (
          <SendWhatsAppDialog opportunity={opportunity} onClose={onClose} />
        );
      case "notification":
        return (
          <AddNotificationDialog
            opportunity={opportunity}
            onClose={onClose}
            getAllUserDataOptions={getAllUserDataOptions}
          />
        );
      case "task":
        return <AssignTaskDialog opportunity={opportunity} onClose={onClose} />;
      case "calendar":
        return (
          <AddScheduleDialog opportunity={opportunity} onClose={onClose} />
        );
      case "alert":
        return <ViewAlertDialog opportunity={opportunity} onClose={onClose} />;
      default:
        return (
          <GenericActionDialog
            type={type}
            opportunity={opportunity}
            onClose={onClose}
          />
        );
    }
  };
  return <>{renderModalContent()}</>;
};

// ============================================================================
// --- END MODALS SECTION ---
// ============================================================================

const recordStatusTagColor: Record<OpportunityItem["status"], string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200",
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  on_hold: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
  closed: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
};
const opportunityStatusTagColor: Record<
  OpportunityItem["opportunity_status"],
  string
> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
  Shortlisted:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  Converted:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  Rejected:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-200",
};

const TABS = {
  ALL: "all",
  SELLER: "seller_opportunities",
  BUYER: "buyer_opportunities",
  AUTO_MATCH: "auto_match",
};

const statusOptionsForFilter = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "closed", label: "Closed" },
];

type OpportunityExportItem = Omit<
  OpportunityItem,
  "created_date" | "updated_at"
> & {
  created_date_formatted: string;
  updated_at_formatted: string;
};

const CSV_HEADERS_OPPORTUNITIES = [
  "ID",
  "Opportunity ID",
  "Product Name",
  "Status",
  "Opportunity Status",
  "Match Score",
  "SPB Role",
  "Want To",
  "Company Name",
  "Company ID",
  "Member Name",
  "Member ID",
  "Member Email",
  "Member Phone",
  "Member Type",
  "Quantity",
  "Product Category",
  "Product Subcategory",
  "Brand",
  "Product Specs",
  "Updated By",
  "Updated Role",
  "Last Updated",
  "Created At",
];

const CSV_KEYS_OPPORTUNITIES_EXPORT: (keyof OpportunityExportItem)[] = [
  "id",
  "opportunity_id",
  "product_name",
  "status",
  "opportunity_status",
  "match_score",
  "spb_role",
  "want_to",
  "company_name",
  "company_id",
  "member_name",
  "member_id",
  "member_email",
  "member_phone",
  "member_type",
  "quantity",
  "product_category",
  "product_subcategory",
  "brand",
  "product_specs",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
  "created_date_formatted",
];

function exportToCsvOpportunities(filename: string, rows: OpportunityItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: OpportunityExportItem[] = rows.map((row) => ({
    ...row,
    created_date_formatted: row.created_date
      ? new Date(row.created_date).toLocaleString()
      : "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_OPPORTUNITIES.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return CSV_KEYS_OPPORTUNITIES_EXPORT.map((k) => {
          let cell = row[k as keyof OpportunityExportItem];
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
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

export type OnSortParamTanstack = {
  order: "asc" | "desc" | "";
  key: string | number;
};

type DataTable1Props<T> = {
  columns: ColumnDef<T>[];
  customNoDataIcon?: ReactNode;
  data?: T[];
  loading?: boolean;
  noData?: boolean;
  instanceId?: string;
  onCheckBoxChange?: (checked: boolean, row: T) => void;
  onIndeterminateCheckBoxChange?: (checked: boolean, rows: Row<T>[]) => void;
  onPaginationChange?: (page: number) => void;
  onSelectChange?: (num: number) => void;
  onSort?: (sort: OnSortParamTanstack) => void;
  pageSizes?: number[];
  selectable?: boolean;
  skeletonAvatarColumns?: number[];
  skeletonAvatarProps?: SkeletonProps;
  pagingData?: {
    total: number;
    pageIndex: number;
    pageSize: number;
  };
  checkboxChecked?: (row: T) => boolean;
  getRowCanExpand?: (row: Row<T>) => boolean;
  renderRowSubComponent?: (props: { row: Row<T> }) => React.ReactNode;
  state?: { expanded?: ExpandedState; columnVisibility?: VisibilityState };
  onExpandedChange?: (updater: React.SetStateAction<ExpandedState>) => void;
  onColumnVisibilityChange?: (
    updater: React.SetStateAction<VisibilityState>
  ) => void;
  ref?: Ref<DataTableResetHandle | HTMLTableElement>;
} & TableProps;

type CheckBoxChangeEvent = ChangeEvent<HTMLInputElement>;

interface IndeterminateCheckboxProps extends Omit<CheckboxProps, "onChange"> {
  onChange: (event: CheckBoxChangeEvent) => void;
  indeterminate: boolean;
  onCheckBoxChange?: (event: CheckBoxChangeEvent) => void;
  onIndeterminateCheckBoxChange?: (event: CheckBoxChangeEvent) => void;
}

const { Tr, Th, Td, THead, TBody, Sorter } = Table;

const IndeterminateCheckbox = (props: IndeterminateCheckboxProps) => {
  const {
    indeterminate,
    onChange,
    onCheckBoxChange,
    onIndeterminateCheckBoxChange,
    ...rest
  } = props;

  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof indeterminate === "boolean" && ref.current) {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate, rest.checked]);

  const handleChange = (e: CheckBoxChangeEvent) => {
    onChange(e);
    onCheckBoxChange?.(e);
    onIndeterminateCheckBoxChange?.(e);
  };

  return (
    <Checkbox
      ref={ref}
      className="mb-0"
      onChange={(_, e) => handleChange(e)}
      {...rest}
    />
  );
};

export type DataTableResetHandle = {
  resetSorting: () => void;
  resetSelected: () => void;
};

const DataTableComponent = React.forwardRef(
  <T extends object>(
    props: DataTable1Props<T>,
    ref: Ref<DataTableResetHandle | HTMLTableElement>
  ) => {
    const {
      skeletonAvatarColumns,
      columns: columnsProp = [],
      data = [],
      customNoDataIcon,
      loading,
      noData,
      onCheckBoxChange,
      onIndeterminateCheckBoxChange,
      onPaginationChange,
      onSelectChange,
      onSort,
      pageSizes = [10, 25, 50, 100],
      selectable = false,
      skeletonAvatarProps,
      pagingData = {
        total: 0,
        pageIndex: 1,
        pageSize: 10,
      },
      checkboxChecked,
      getRowCanExpand,
      renderRowSubComponent,
      state: controlledState,
      onExpandedChange: onControlledExpandedChange,
      onColumnVisibilityChange,
      instanceId = "data-table",
      ...rest
    } = props;

    const { pageSize, pageIndex, total } = pagingData;

    const [sorting, setSorting] = useState<ColumnSort[] | []>([]);
    const isManuallyExpanded =
      controlledState?.expanded !== undefined &&
      onControlledExpandedChange !== undefined;
    const [internalExpanded, setInternalExpanded] = useState<ExpandedState>(
      {}
    );

    const expanded = isManuallyExpanded
      ? controlledState.expanded!
      : internalExpanded;
    const onExpandedChange = isManuallyExpanded
      ? onControlledExpandedChange!
      : setInternalExpanded;

    const pageSizeOption = useMemo(
      () =>
        pageSizes.map((number) => ({
          value: number,
          label: `${number} / page`,
        })),
      [pageSizes]
    );

    useEffect(() => {
      if (Array.isArray(sorting)) {
        const sortOrder =
          sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "";
        const id = sorting.length > 0 ? sorting[0].id : "";
        onSort?.({ order: sortOrder, key: id });
      }
    }, [sorting, onSort]);

    const handleIndeterminateCheckBoxChange = (
      checked: boolean,
      rows: Row<T>[]
    ) => {
      if (!loading) {
        onIndeterminateCheckBoxChange?.(checked, rows);
      }
    };

    const handleCheckBoxChange = (checked: boolean, row: T) => {
      if (!loading) {
        onCheckBoxChange?.(checked, row);
      }
    };

    const finalColumns: ColumnDef<T>[] = useMemo(() => {
      const currentColumns = [...columnsProp];

      if (selectable) {
        return [
          {
            id: "select",
            header: ({ table }) => (
              <IndeterminateCheckbox
                checked={table.getIsAllRowsSelected()}
                indeterminate={table.getIsSomeRowsSelected()}
                onChange={(e) => {
                  table.getToggleAllRowsSelectedHandler()(e as any);
                  handleIndeterminateCheckBoxChange(
                    e.target.checked,
                    table.getRowModel().rows
                  );
                }}
              />
            ),
            cell: ({ row }) => (
              <IndeterminateCheckbox
                checked={
                  checkboxChecked
                    ? checkboxChecked(row.original)
                    : row.getIsSelected()
                }
                indeterminate={row.getIsSomeSelected()}
                onChange={(e) => {
                  row.getToggleSelectedHandler()(e as any);
                  handleCheckBoxChange(e.target.checked, row.original);
                }}
              />
            ),
            size: 48,
          },
          ...currentColumns,
        ];
      }
      return currentColumns;
    }, [
      columnsProp,
      selectable,
      loading,
      checkboxChecked,
      handleCheckBoxChange,
      handleIndeterminateCheckBoxChange,
    ]);

    const table = useReactTable({
      data: data as T[],
      columns: finalColumns,
      state: {
        sorting: sorting as ColumnSort[],
        expanded,
        columnVisibility: controlledState?.columnVisibility,
      },
      onSortingChange: setSorting,
      onExpandedChange: onExpandedChange,
      onColumnVisibilityChange: onColumnVisibilityChange,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      getRowCanExpand,
      manualPagination: true,
      manualSorting: true,
    });

    const handlePaginationChangeInternal = (page: number) => {
      if (!loading) {
        table.resetRowSelection();
        onPaginationChange?.(page);
      }
    };

    const handleSelectChangeInternal = (value?: number) => {
      if (!loading && value) {
        table.setPageSize(Number(value));
        onSelectChange?.(Number(value));
        onPaginationChange?.(1);
        table.resetRowSelection();
      }
    };

    return (
      <Loading loading={Boolean(loading && data.length !== 0)} type="cover">
        <Table {...rest}>
          <THead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <Th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={classNames(
                            header.column.getCanSort() &&
                            "cursor-pointer select-none point",
                            loading && "pointer-events-none",
                            (header.column.columnDef.meta as any)?.HeaderClass
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <Sorter sort={header.column.getIsSorted()} />
                          )}
                        </div>
                      )}
                    </Th>
                  );
                })}
              </Tr>
            ))}
          </THead>
          {loading && data.length === 0 ? (
            <TableRowSkeleton
              columns={finalColumns.length}
              rows={pagingData.pageSize}
              avatarInColumns={skeletonAvatarColumns}
              avatarProps={skeletonAvatarProps}
            />
          ) : (
            <TBody>
              {noData || table.getRowModel().rows.length === 0 ? (
                <Tr>
                  <Td
                    className="hover:bg-transparent text-center"
                    colSpan={finalColumns.length}
                  >
                    <div className="flex flex-col items-center justify-center gap-4 my-10">
                      {customNoDataIcon ? (
                        customNoDataIcon
                      ) : (
                        <FileNotFound className="grayscale" />
                      )}
                      <span className="font-semibold"> No data found! </span>
                    </div>
                  </Td>
                </Tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <Tr>
                      {row.getVisibleCells().map((cell) => (
                        <Td
                          key={cell.id}
                          style={{
                            width:
                              cell.column.getSize() !== 150
                                ? cell.column.getSize()
                                : undefined,
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </Td>
                      ))}
                    </Tr>
                    {row.getIsExpanded() && renderRowSubComponent && (
                      <Tr>
                        <Td
                          colSpan={row.getVisibleCells().length}
                          className="p-0 border-b-0 hover:bg-transparent"
                        >
                          {renderRowSubComponent({ row })}
                        </Td>
                      </Tr>
                    )}
                  </Fragment>
                ))
              )}
            </TBody>
          )}
        </Table>
        {total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <Pagination
              pageSize={pageSize}
              currentPage={pageIndex}
              total={total}
              onChange={handlePaginationChangeInternal}
            />
            <div style={{ minWidth: 130 }}>
              <Select
                instanceId={`${instanceId}-page-size-select`}
                size="sm"
                menuPlacement="top"
                isSearchable={false}
                value={pageSizeOption.find(
                  (option) => option.value === pageSize
                )}
                options={pageSizeOption}
                onChange={(option) => handleSelectChangeInternal(option?.value)}
              />
            </div>
          </div>
        )}
      </Loading>
    );
  }
);
DataTableComponent.displayName = "DataTableComponent";

const FormattedDate: React.FC<{ dateString?: string; label?: string }> = ({
  dateString,
  label,
}) => {
  if (!dateString)
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {label ? `${label}: N/A` : "N/A"}
      </span>
    );
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return (
        <span className="text-xs text-red-500">
          {label ? `${label}: Invalid Date` : "Invalid Date"}
        </span>
      );
    }
    return (
      <div className="text-xs">
        {label && (
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {label}:{" "}
          </span>
        )}
        {date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </div>
    );
  } catch (e) {
    return (
      <span className="text-xs text-red-500">
        {label ? `${label}: Invalid Date` : "Invalid Date"}
      </span>
    );
  }
};
FormattedDate.defaultProps = { label: "" };

const InfoLine: React.FC<{
  icon?: React.ReactNode;
  text?: string | number | React.ReactNode | null;
  label?: string;
  title?: string;
  className?: string;
  boldText?: boolean;
}> = ({ icon, text, label, title, className, boldText }) => {
  if (text === null || text === undefined || text === "") return null;
  return (
    <div className={classNames("flex items-center gap-1.5 text-xs", className)}>
      {icon && (
        <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      )}
      {label && (
        <span className="font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {label}:
        </span>
      )}
      <span
        className={classNames("text-gray-700 dark:text-gray-200", {
          "font-semibold": boldText,
        })}
        title={
          title ||
          (typeof text === "string" || typeof text === "number"
            ? String(text)
            : undefined)
        }
      >
        {text}
      </span>
    </div>
  );
};
InfoLine.defaultProps = {
  icon: null,
  text: null,
  label: "",
  title: "",
  className: "",
  boldText: false,
};

const OpportunitySearch = React.forwardRef<
  HTMLInputElement,
  { onInputChange: (value: string) => void }
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
OpportunitySearch.displayName = "OpportunitySearch";

const OpportunityFilterDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  onClear: () => void;
  initialFilters: any;
  userOptions: SelectOption[];
}> = ({
  isOpen,
  onClose,
  onApply,
  onClear,
  initialFilters,
  userOptions,
}) => {
    const { control, handleSubmit, reset } = useForm({
      defaultValues: initialFilters,
    });

    useEffect(() => {
      reset(initialFilters);
    }, [initialFilters, reset]);

    const onSubmit = (data: any) => {
      onApply(data);
      onClose();
    };

    const handleClear = () => {
      onClear();
      onClose();
    };

    return (
      <Drawer
        title="Filters"
        isOpen={isOpen}
        onClose={onClose}
        onRequestClose={onClose}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={handleClear}>
              Clear All
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterOpportunityForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form id="filterOpportunityForm" onSubmit={handleSubmit(onSubmit)}>
          <div className="p-4 flex flex-col gap-6">
            <FormItem label="Status">
              <Controller
                name="statuses"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    placeholder="Select status..."
                    options={statusOptionsForFilter}
                    value={statusOptionsForFilter.filter((option) =>
                      field.value?.includes(option.value)
                    )}
                    onChange={(options) =>
                      field.onChange(options.map((opt) => opt.value))
                    }
                  />
                )}
              />
            </FormItem>
            <FormItem label="Created Date Range">
              <Controller
                name="dateRange"
                control={control}
                render={({ field }) => (
                  <DatePicker.RangePicker
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Assigned To">
              <Controller
                name="assignedTo"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    placeholder="Select users..."
                    options={userOptions}
                    value={userOptions.filter((option) =>
                      field.value?.includes(option.value)
                    )}
                    onChange={(options) =>
                      field.onChange(options.map((opt) => opt.value))
                    }
                  />
                )}
              />
            </FormItem>
          </div>
        </Form>
      </Drawer>
    );
  };

const ColumnToggler: React.FC<{ table: any }> = ({ table }) => (
  <Dropdown
    renderTitle={
      <Button icon={<TbColumns />}>
      </Button>
    }
    placement="bottom-end"
  >
    <div className="p-2">
      <div className="font-semibold mb-1 border-b pb-1 px-1">
        Toggle Columns
      </div>
      {table
        .getAllLeafColumns()
        .filter((col: any) => col.id !== "select" && col.id !== "expander")
        .map((column: any) => (
          <div key={column.id} className="px-1">
            <Tooltip title={column.id} placement="left">
              <label className="flex items-center gap-2 cursor-pointer py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md px-2">
                <Checkbox
                  checked={column.getIsVisible()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                <span className="text-sm">
                  {typeof column.columnDef.header === "string"
                    ? column.columnDef.header
                    : column.id.replace(/_/g, " ").replace("std", "")}
                </span>
              </label>
            </Tooltip>
          </div>
        ))}
    </div>
  </Dropdown>
);

const OpportunityTableTools = ({
  onSearchChange,
  onExport,
  onClearFilters,
  onFilter,
  columnToggler,
  activeFilterCount,
}: {
  onSearchChange: (query: string) => void;
  onExport: () => void;
  onClearFilters: () => void;
  onFilter: () => void;
  columnToggler: ReactNode;
  activeFilterCount: number;
}) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
    <div className="flex-grow w-full sm:w-auto">
      <OpportunitySearch onInputChange={onSearchChange} />
    </div>
    <div className="flex items-center gap-2">
      {columnToggler}
      <Tooltip title="Clear Filters & Reload">
        <Button icon={<TbReload />} onClick={onClearFilters}></Button>
      </Tooltip>


      <Button icon={<TbFilter />} onClick={onFilter}>
        <span className="hidden sm:inline">Filter</span>{" "}
        {activeFilterCount > 0 && (
          <span className="ml-2 bg-primary-100 text-primary-600 dark:bg-primary-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </Button>

      <Button icon={<TbCloudUpload />} onClick={onExport}>
        <span className="hidden sm:inline">Export</span>
      </Button>
    </div>
  </div>
);

const ActiveFiltersDisplay = ({
  filters,
  onRemoveFilter,
  onClearAll,
}: {
  filters: any;
  onRemoveFilter: (key: string, value: any) => void;
  onClearAll: () => void;
}) => {
  const { statuses, dateRange, assignedTo } = filters;
  const hasFilters =
    (statuses && statuses.length > 0) ||
    (dateRange && dateRange[0]) ||
    (assignedTo && assignedTo.length > 0);

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {statuses?.map((item: string) => (
        <Tag key={`status-${item}`} prefix className="capitalize">
          Status: {item.replace("_", " ")}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("statuses", item)}
          />
        </Tag>
      ))}
      {/* Add display for other filters like dateRange if needed */}
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

const OpportunitySelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: {
  selectedItems: OpportunityItem[];
  onDeleteSelected: () => void;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  const itemType = "Opportunit" + (selectedItems.length > 1 ? "ies" : "y");
  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <TbChecks className="text-lg text-primary-600 dark:text-primary-400" />
            <span className="font-semibold text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>{" "}
              {itemType} selected
            </span>
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-600 hover:text-red-500"
            onClick={() => setConfirmOpen(true)}
          >
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={confirmOpen}
        type="danger"
        title={`Delete Selected ${itemType}`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>
          Are you sure you want to delete the selected {selectedItems.length}{" "}
          {itemType.toLowerCase()}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

const MainRowActionColumn = ({
  item,
  currentTab,
  onOpenModal,
}: {
  item: OpportunityItem;
  currentTab: string;
  onOpenModal: (type: OpportunityModalType, data: OpportunityItem) => void;
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (item.id.startsWith("spb-match-")) {
      toast.push(
        <Notification title="Info" type="info" duration={4000}>
          Expand the row to see match details. A dedicated view page for match
          groups is not available.
        </Notification>
      );
      return;
    }
    let path = `/sales-leads/opportunities/`;
    if (
      item.spb_role === "Seller" ||
      (currentTab === TABS.SELLER && !item.spb_role)
    ) {
      path += `seller/detail/${item.id}`;
    } else if (
      item.spb_role === "Buyer" ||
      (currentTab === TABS.BUYER && !item.spb_role)
    ) {
      path += `buyer/detail/${item.id}`;
    } else {
      path += `detail/${item.id}`;
    }
    navigate(path);
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip title="Copy">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          role="button"
        >
          <TbCopy />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          role="button"
          onClick={handleViewDetails}
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
          onClick={() => onOpenModal("notification", item)}
          className="flex items-center gap-2"
        >
          <TbBell size={18} />{" "}
          <span className="text-xs">Add as Notification</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("active", item)}
          className="flex items-center gap-2"
        >
          <TbTagStarred size={18} />{" "}
          <span className="text-xs">Mark as Active</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("calendar", item)}
          className="flex items-center gap-2"
        >
          <TbCalendarEvent size={18} />{" "}
          <span className="text-xs">Add to Calendar</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("task", item)}
          className="flex items-center gap-2"
        >
          <TbUser size={18} /> <span className="text-xs">Assign to Task</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("alert", item)}
          className="flex items-center gap-2"
        >
          <TbAlarm size={18} /> <span className="text-xs">View Alert</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("alert", item)}
          className="flex items-center gap-2"
        >
          <TbBulb size={18} /> <span className="text-xs">View Opportunity</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("alert", item)}
          className="flex items-center gap-2"
        >
          <TbDiscount size={18} />{" "}
          <span className="text-xs">Create Offer/Demand</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("alert", item)}
          className="flex items-center gap-2"
        >
          <TbNotebook size={18} /> <span className="text-xs">Add Notes</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("email", item)}
          className="flex items-center gap-2"
        >
          <TbMail size={18} /> <span className="text-xs">Send Email</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("whatsapp", item)}
          className="flex items-center gap-2"
        >
          <TbBrandWhatsapp size={18} />{" "}
          <span className="text-xs">Send on Whatsapp</span>
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const ExpandedOpportunityDetails: React.FC<{
  row: Row<OpportunityItem>;
  currentTab: string;
}> = ({ row: { original: item } }) => {
  const opportunityType = item.spb_role
    ? `${item.spb_role} in SPB`
    : item.want_to || "General";
  return (
    <Card bordered className="m-1 my-2 rounded-lg">
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Opportunity Snapshot
          </h6>
          <InfoLine
            icon={<TbIdBadge2 size={14} />}
            label="Opp. ID"
            text={item.opportunity_id}
            className="font-medium text-sm"
          />
          <InfoLine
            icon={<TbBox size={14} />}
            label="Product"
            text={item.product_name}
            className="font-medium text-sm"
            title={item.product_name}
          />
          <InfoLine
            icon={<TbTag size={14} />}
            label="Category"
            text={`${item.product_category || "N/A"}${item.product_subcategory ? ` > ${item.product_subcategory}` : ""
              }`}
          />
          <InfoLine
            icon={<TbTag size={14} />}
            label="Brand"
            text={item.brand || "N/A"}
          />
          {item.product_specs && (
            <InfoLine
              icon={<TbInfoCircle size={14} />}
              label="Specs"
              text={item.product_specs}
            />
          )}
          <InfoLine
            icon={<TbChecklist size={14} />}
            label="Quantity"
            text={item.quantity?.toString() || "N/A"}
          />
          <InfoLine
            icon={<TbProgressCheck size={14} />}
            label="Product Status"
            text={item.product_status_listing || "N/A"}
          />
          <InfoLine
            icon={<TbExchange size={14} />}
            label="Intent/Role"
            text={opportunityType}
          />
        </div>
        <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Company & Member
          </h6>
          <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm mb-2">
            <InfoLine
              icon={<TbBuilding size={14} />}
              text={item.company_name}
              className="font-semibold"
            />
          </div>
          <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
            <InfoLine
              icon={<TbUser size={14} />}
              text={item.member_name}
              className="font-semibold"
            />
            <InfoLine
              text={item.member_type}
              className="ml-5 text-indigo-600 dark:text-indigo-400 font-medium"
            />
            {item.member_email && (
              <InfoLine
                icon={<TbMail size={14} />}
                text={
                  <a
                    href={`mailto:${item.member_email}`}
                    className="text-blue-500 hover:underline"
                  >
                    {item.member_email}
                  </a>
                }
              />
            )}
            {item.member_phone && (
              <InfoLine icon={<TbPhone size={14} />} text={item.member_phone} />
            )}
          </div>
          {item.listing_url && (
            <InfoLine
              icon={<TbLinkIcon size={14} />}
              label="Listing"
              text={
                <a
                  href={item.listing_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline truncate block max-w-[180px]"
                  title={item.listing_url}
                >
                  {item.listing_url}
                </a>
              }
            />
          )}
        </div>
        <div className="space-y-1.5">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Match & Lifecycle
          </h6>
          <InfoLine
            icon={<TbRadar2 size={14} />}
            label="Matches"
            text={item.matches_found_count || "N/A"}
          />
          <InfoLine
            icon={<TbTargetArrow size={14} />}
            label="Match Score"
            text={`${item.match_score}%`}
          />
          <div className="flex items-center gap-2">
            <InfoLine
              icon={<TbProgressCheck size={14} />}
              label="Opp. Status"
            />
            <Tag
              className={`${opportunityStatusTagColor[item.opportunity_status] ||
                opportunityStatusTagColor.default
                } capitalize`}
            >
              {item.opportunity_status}
            </Tag>
          </div>
          <FormattedDate label="Created" dateString={item.created_date} />
        </div>
      </div>
    </Card>
  );
};

// --- Modal to view SPB Item Summary ---
const SpbSummaryViewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  item: AutoSpbApiItem | null;
}> = ({ isOpen, onClose, item }) => {
  if (!item) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Listing Summary</h5>
      <div className="mt-4">
        <p className="text-gray-800 dark:text-gray-100">
          <strong>Product:</strong> {item.product_name}
        </p>
        <p className="text-gray-800 dark:text-gray-100 mt-2">
          <strong>Brand:</strong> {item.brand_name}
        </p>
        <Card bordered className="mt-4 p-4 bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {item.summary || "No summary available."}
          </p>
        </Card>
      </div>
    </Dialog>
  );
};

interface SpbSummaryRowProps {
  item: AutoSpbApiItem;
  onViewSummary: (item: AutoSpbApiItem) => void;
}

const SpbSummaryRow: React.FC<SpbSummaryRowProps> = ({
  item,
  onViewSummary,
}) => {
  const memberName = `Member (ID: ${item.id})`; // Placeholder

  return (
    <div className="flex justify-between items-center w-full py-3 text-xs border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
          {memberName}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-4">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Qty: </span>
          <span className="font-bold text-gray-800 dark:text-gray-100">
            {item.qty}
          </span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Unit: </span>
          <span className="font-bold text-gray-800 dark:text-gray-100">
            {item.unit}
          </span>
        </div>
        <Tooltip title="View Summary">
          <Button
            shape="circle"
            size="sm"
            variant="plain"
            icon={<TbEye />}
            onClick={() => onViewSummary(item)}
            className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          />
        </Tooltip>
      </div>
    </div>
  );
};

interface ExpandedAutoSpbDetailsProps {
  row: Row<OpportunityItem>;
  onViewSummary: (item: AutoSpbApiItem) => void;
}

const ExpandedAutoSpbDetails: React.FC<ExpandedAutoSpbDetailsProps> = ({
  row,
  onViewSummary,
}) => {
  const buyItems = row.original._rawSpbBuyItems || [];
  const sellItems = row.original._rawSpbSellItems || [];

  return (
    <Card
      bordered
      className="m-1 my-2 rounded-lg bg-gray-50 dark:bg-gray-900/50"
    >
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h6 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
            <TbChecks /> Buyer ({buyItems.length})
          </h6>
          <div className="bg-white dark:bg-gray-800 rounded-md px-3">
            {buyItems.length > 0 ? (
              buyItems.map((item) => (
                <SpbSummaryRow
                  key={`buy-${item.id}`}
                  item={item}
                  onViewSummary={onViewSummary}
                />
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">
                No buy demand in this match.
              </p>
            )}
          </div>
        </div>
        <div>
          <h6 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
            <TbBox /> Seller ({sellItems.length})
          </h6>
          <div className="bg-white dark:bg-gray-800 rounded-md px-3">
            {sellItems.length > 0 ? (
              sellItems.map((item) => (
                <SpbSummaryRow
                  key={`sell-${item.id}`}
                  item={item}
                  onViewSummary={onViewSummary}
                />
              ))
            ) : (
              <p className="text-xs text-gray-500 py-4 text-center">
                No sell offers in this match.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================================================
// --- MAIN COMPONENT ---
// ============================================================================
const Opportunities = ({ isDashboard }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    autoMatchData,
    Opportunities: rawOpportunities = [],
    getAllUserData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);


  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [tableQueries, setTableQueries] = useState<
    Record<string, TableQueries>
  >({});
  const [selectedItems, setSelectedItems] = useState<
    Record<string, OpportunityItem[]>
  >({});
  const [currentTab, setCurrentTab] = useState<string>(TABS.ALL);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    {}
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const initialFilterState = {
    statuses: [],
    dateRange: [null, null] as [Date | null, Date | null],
    assignedTo: [],
  };
  const [filters, setFilters] = useState(initialFilterState);

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [autoSpbData, setAutoSpbData] = useState<AutoSpbApiResponse | null>(
    null
  );
  const [autoSpbStatus, setAutoSpbStatus] = useState<
    "idle" | "loading" | "succeeded" | "failed"
  >("idle");

  const [modalState, setModalState] = useState<OpportunityModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const handleOpenModal = (
    type: OpportunityModalType,
    opportunityData: OpportunityItem
  ) => setModalState({ isOpen: true, type, data: opportunityData });
  const handleCloseModal = () =>
    setModalState({ isOpen: false, type: null, data: null });

  const [summaryModalState, setSummaryModalState] = useState<{
    isOpen: boolean;
    item: AutoSpbApiItem | null;
  }>({ isOpen: false, item: null });

  const handleOpenSummaryModal = (item: AutoSpbApiItem) => {
    setSummaryModalState({ isOpen: true, item });
  };

  const handleCloseSummaryModal = () => {
    setSummaryModalState({ isOpen: false, item: null });
  };

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  const getAllUserDataOptions = useMemo(
    () =>
      Array.isArray(getAllUserData)
        ? getAllUserData.map((user: any) => ({
          value: user.id,
          label: user.name,
        }))
        : [],
    [getAllUserData]
  );

  useEffect(() => {
    if (currentTab === TABS.AUTO_MATCH) {
      if (autoSpbStatus === "idle") {
        dispatch(getAutoMatchDataAction());
        setAutoSpbStatus("loading");
        setTimeout(() => {
          setAutoSpbData(autoMatchData);
          setAutoSpbStatus("succeeded");
        }, 1500);
      }
    } else {
      // if (!rawOpportunities.length) {
      dispatch(getOpportunitiesAction());
      // }
      // if (!getAllUserData.length) {
      dispatch(getAllUsersAction());
      // }
    }
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(rawOpportunities)) {
      const mappedOpportunities = rawOpportunities.map(
        (apiItem: ApiOpportunityItem): OpportunityItem => {
          let uiStatus: OpportunityItem["status"] = "pending";
          if (apiItem.status?.toLowerCase() === "pending") uiStatus = "pending";
          else if (apiItem.status?.toLowerCase() === "active")
            uiStatus = "active";
          else if (
            apiItem.status?.toLowerCase() === "on hold" ||
            apiItem.status?.toLowerCase() === "on_hold"
          )
            uiStatus = "on_hold";
          else if (apiItem.status?.toLowerCase() === "closed")
            uiStatus = "closed";
          else if (apiItem.status) uiStatus = apiItem.status.toLowerCase();

          let uiOppStatus: OpportunityItem["opportunity_status"] = "New";
          if (apiItem.opportunity_status?.toLowerCase() === "new")
            uiOppStatus = "New";
          else if (apiItem.opportunity_status?.toLowerCase() === "shortlisted")
            uiOppStatus = "Shortlisted";
          else if (apiItem.opportunity_status?.toLowerCase() === "converted")
            uiOppStatus = "Converted";
          else if (apiItem.opportunity_status?.toLowerCase() === "rejected")
            uiOppStatus = "Rejected";
          else if (apiItem.opportunity_status)
            uiOppStatus = apiItem.opportunity_status;

          return {
            id: apiItem.id,
            opportunity_id: apiItem.opportunity_id || `OPP-${apiItem.id}`,
            product_name: apiItem.product_name || "N/A",
            status: uiStatus,
            opportunity_status: uiOppStatus,
            match_score: apiItem.match_score ?? 0,
            created_date: apiItem.created_date || new Date().toISOString(),
            buy_listing_id: apiItem.buy_listing_id || undefined,
            sell_listing_id: apiItem.sell_listing_id || undefined,
            spb_role: apiItem.spb_role || undefined,
            product_category: apiItem.product_category || undefined,
            product_subcategory: apiItem.product_subcategory || undefined,
            brand: apiItem.brand || undefined,
            product_specs: apiItem.product_specs || undefined,
            quantity:
              (typeof apiItem.quantity === "string"
                ? parseInt(apiItem.quantity, 10)
                : apiItem.quantity) ?? undefined,
            product_status_listing: apiItem.product_status_listing || undefined,
            want_to: apiItem.want_to || undefined,
            company_name: apiItem.company_name || "N/A",
            company_id: apiItem.company_id || undefined,
            member_name: apiItem.member_name || "N/A",
            member_id: apiItem.member_id || undefined,
            member_email: apiItem.member_email || undefined,
            member_phone: apiItem.member_phone || undefined,
            member_type: apiItem.member_type || "Standard",
            matches_found_count: apiItem.matches_found_count ?? undefined,
            updated_at: apiItem.updated_at || undefined,
            assigned_to: String(apiItem.assigned_to || ""),
            notes: apiItem.notes || undefined,
            listing_url: apiItem.listing_url || undefined,
            updated_by_name: apiItem.updated_by_name || "System",
            updated_by_role: apiItem.updated_by_role || "Auto-Update",
            product_image_url:
              apiItem.product_image_url ||
              `https://placehold.co/100x100/e2e8f0/64748b?text=${(
                apiItem.product_name || "P"
              )
                .substring(0, 2)
                .toUpperCase()}`,
            company_code: apiItem.company_code || `C-${apiItem.company_id}`,
            company_verified: apiItem.company_verified ?? Math.random() > 0.5,
            company_billing_enabled:
              apiItem.company_billing_enabled ?? Math.random() > 0.7,
            member_code: apiItem.member_code || `M-${apiItem.member_id}`,
            member_verified: apiItem.member_verified ?? Math.random() > 0.3,
            member_country: apiItem.member_country || "USA",
            member_country_flag:
              apiItem.member_country_flag ||
              "https://flagcdn.com/w20/us.png",
            member_business_type:
              apiItem.member_business_type || "Wholesaler",
          };
        }
      );
      setOpportunities(mappedOpportunities);
    } else {
      setOpportunities([]);
    }
  }, [rawOpportunities]);

  useEffect(() => {
    const initialTableQuery = {
      pageIndex: 1,
      pageSize: 10,
      sort: { order: "desc", key: "created_date" } as ColumnSort,
      query: "",
    };
    setTableQueries({
      [TABS.ALL]: { ...initialTableQuery },
      [TABS.SELLER]: { ...initialTableQuery },
      [TABS.BUYER]: { ...initialTableQuery },
      [TABS.AUTO_MATCH]: { ...initialTableQuery },
    });
    setSelectedItems({
      [TABS.ALL]: [],
      [TABS.SELLER]: [],
      [TABS.BUYER]: [],
      [TABS.AUTO_MATCH]: [],
    });
  }, []);

  useEffect(() => {
    setTableQueries((prev) => ({
      ...prev,
      [currentTab]: { ...prev[currentTab], pageIndex: 1 },
    }));
    setSelectedItems((prev) => ({ ...prev, [currentTab]: [] }));
    setExpanded({});
  }, [currentTab]);

  const statusCounts = useMemo(() => {
    return (opportunities || []).reduce(
      (acc, opp) => {
        acc.total++;
        if (opp.status === "active") acc.active++;
        if (opp.status === "pending") acc.pending++;
        if (opp.status === "on_hold") acc.on_hold++;
        return acc;
      },
      { total: 0, active: 0, pending: 0, on_hold: 0 }
    );
  }, [opportunities]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.statuses.length > 0) count++;
    if (filters.dateRange[0] && filters.dateRange[1]) count++;
    if (filters.assignedTo.length > 0) count++;
    return count;
  }, [filters]);

  const currentTableData = tableQueries[currentTab] || {
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_date" } as ColumnSort,
    query: "",
  };
  const currentSelectedItems = selectedItems[currentTab] || [];

  const autoSpbTableData = useMemo<OpportunityItem[]>(() => {
    if (!autoSpbData || !autoSpbData.data) return [];

    const transformedData: OpportunityItem[] = [];
    const { data: matchGroups, autospbNumber } = autoSpbData;

    for (const groupId in matchGroups) {
      const group = matchGroups[groupId];
      const buyItems = group.Buy || [];
      const sellItems = group.Sell || [];
      const allItems = [...buyItems, ...sellItems];
      if (allItems.length === 0) continue;

      const representativeItem = allItems[0];
      const totalQuantity = allItems.reduce(
        (sum, item) => sum + (parseInt(item.qty, 10) || 0),
        0
      );
      const productNames = [
        ...new Set(
          allItems.map((i) => i.product_name || i.brand_name).filter(Boolean)
        ),
      ];

      const matchRow: OpportunityItem = {
        id: `spb-match-${groupId}`,
        opportunity_id: `ASPB-${autospbNumber}-${groupId}`,
        product_name: productNames.join(", ") || `Match Group ${groupId}`,
        status: "active",
        opportunity_status: "Shortlisted",
        match_score: 88, // Placeholder value
        created_date: representativeItem.created_at,
        spb_role: "Match",
        want_to: "Exchange",
        company_name: `Buyers: ${buyItems.length}`,
        member_name: `Sellers: ${sellItems.length}`,
        member_type: "SPB Match",
        quantity: totalQuantity,
        brand: representativeItem.brand_name || undefined,
        _rawSpbBuyItems: buyItems,
        _rawSpbSellItems: sellItems,
      };
      transformedData.push(matchRow);
    }
    return transformedData;
  }, [autoSpbData]);

  const filteredOpportunities = useMemo(() => {
    if (currentTab === TABS.AUTO_MATCH) {
      let data = [...autoSpbTableData];
      if (currentTableData.query) {
        const query = currentTableData.query.toLowerCase();
        data = data.filter(
          (item) =>
            Object.values(item).some((value) =>
              String(value).toLowerCase().includes(query)
            ) ||
            item._rawSpbBuyItems?.some((subItem) =>
              Object.values(subItem).some((val) =>
                String(val).toLowerCase().includes(query)
              )
            ) ||
            item._rawSpbSellItems?.some((subItem) =>
              Object.values(subItem).some((val) =>
                String(val).toLowerCase().includes(query)
              )
            )
        );
      }
      return data;
    }

    let data = [...opportunities];
    if (currentTab === TABS.SELLER) {
      data = data.filter(
        (op) =>
          op.spb_role === "Seller" ||
          op.want_to === "Sell" ||
          (op.sell_listing_id && !op.buy_listing_id)
      );
    } else if (currentTab === TABS.BUYER) {
      data = data.filter(
        (op) =>
          op.spb_role === "Buyer" ||
          op.want_to === "Buy" ||
          (op.buy_listing_id && !op.sell_listing_id)
      );
    }

    if (currentTableData.query) {
      const query = currentTableData.query.toLowerCase();
      data = data.filter((item) =>
        Object.values(item).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(query);
        })
      );
    }

    // Advanced filter logic
    if (filters.statuses.length > 0) {
      data = data.filter((item) => filters.statuses.includes(item.status));
    }
    if (filters.dateRange[0] && filters.dateRange[1]) {
      const start = dayjs(filters.dateRange[0]).startOf("day");
      const end = dayjs(filters.dateRange[1]).endOf("day");
      data = data.filter((item) => {
        const itemDate = dayjs(item.created_date);
        return itemDate.isAfter(start) && itemDate.isBefore(end);
      });
    }
    if (filters.assignedTo.length > 0) {
      data = data.filter((item) =>
        filters.assignedTo.includes(Number(item.assigned_to))
      );
    }

    return data;
  }, [
    currentTab,
    opportunities,
    autoSpbTableData,
    currentTableData.query,
    filters,
  ]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData = [...filteredOpportunities];
    const { order, key } =
      currentTableData.sort as unknown as OnSortParamTanstack;

    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof OpportunityItem];
        const bVal = b[key as keyof OpportunityItem];
        if (key === "created_date" || key === "updated_at") {
          return order === "asc"
            ? new Date(aVal as string).getTime() -
            new Date(bVal as string).getTime()
            : new Date(bVal as string).getTime() -
            new Date(aVal as string).getTime();
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
        return order === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }

    const allData = processedData;
    const dataTotal = allData.length;
    const pageIndex = currentTableData.pageIndex as number;
    const pageSize = currentTableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;

    return {
      pageData: allData.slice(startIndex, startIndex + pageSize),
      total: dataTotal,
      allFilteredAndSortedData: allData,
    };
  }, [filteredOpportunities, currentTableData]);

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
    const moduleName = "Opportunities";
    try {
      await dispatch(
        submitExportReasonAction({ reason: data.reason, module: moduleName })
      ).unwrap();
    } catch (error: any) { }

    const success = exportToCsvOpportunities(
      "opportunities_export.csv",
      allFilteredAndSortedData
    );
    if (success) {
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
    }
    setIsSubmittingExportReason(false);
    setIsExportReasonModalOpen(false);
  };

  const handleSetCurrentTableData = useCallback(
    (data: Partial<TableQueries>) => {
      setTableQueries((prev) => ({
        ...prev,
        [currentTab]: { ...prev[currentTab], ...data },
      }));
    },
    [currentTab]
  );
  const handlePaginationChange = useCallback(
    (page: number) => handleSetCurrentTableData({ pageIndex: page }),
    [handleSetCurrentTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetCurrentTableData({ pageSize: Number(value), pageIndex: 1 });
      setSelectedItems((prev) => ({ ...prev, [currentTab]: [] }));
    },
    [handleSetCurrentTableData, currentTab]
  );
  const handleSort = useCallback(
    (sort: OnSortParamTanstack) =>
      handleSetCurrentTableData({ sort: sort as any, pageIndex: 1 }),
    [handleSetCurrentTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) =>
      handleSetCurrentTableData({ query: query, pageIndex: 1 }),
    [handleSetCurrentTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: OpportunityItem) => {
      setSelectedItems((prev) => ({
        ...prev,
        [currentTab]: checked
          ? [...(prev[currentTab] || []), row]
          : (prev[currentTab] || []).filter((i) => i.id !== row.id),
      }));
    },
    [currentTab]
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<OpportunityItem>[]) => {
      setSelectedItems((prev) => ({
        ...prev,
        [currentTab]: checked ? rows.map((r) => r.original) : [],
      }));
    },
    [currentTab]
  );

  const handleDeleteSelected = useCallback(() => {
    const selectedIds = new Set(currentSelectedItems.map((i) => i.id));
    if (currentTab !== TABS.AUTO_MATCH) {
      setOpportunities((prevAll) =>
        prevAll.filter((i) => !selectedIds.has(i.id))
      );
      toast.push(
        <Notification title="Records Deleted" type="success">
          {`${selectedIds.size} record(s) deleted.`}
        </Notification>
      );
    } else {
      toast.push(
        <Notification title="Action Not Available" type="info">
          Deleting auto-matched groups is not supported from this view.
        </Notification>
      );
    }
    setSelectedItems((prev) => ({ ...prev, [currentTab]: [] }));
  }, [currentSelectedItems, currentTab]);

  const handleTabChange = (tabKey: string) => {
    if (tabKey === currentTab) return;
    setCurrentTab(tabKey);
  };

  const handleClearFilters = () => {
    setFilters(initialFilterState);
    handleSetCurrentTableData({ query: "", pageIndex: 1 });
  };

  const handleCardClick = (status: OpportunityItem["status"] | "all") => {
    handleClearFilters();
    if (status !== "all") {
      setFilters({ ...initialFilterState, statuses: [status] });
    }
  };

  const handleRemoveFilter = (key: string, valueToRemove: any) => {
    setFilters((prev: any) => {
      const newFilters = { ...prev };
      if (Array.isArray(newFilters[key])) {
        newFilters[key] = newFilters[key].filter(
          (item: any) => item !== valueToRemove
        );
      } else {
        newFilters[key] = initialFilterState[key as keyof typeof initialFilterState];
      }
      return newFilters;
    });
  };

  const getColumnsForStandardView = useCallback(
    (): ColumnDef<OpportunityItem>[] => [
      {
        header: "Product",
        accessorKey: "product_name",
        size: 320,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-start gap-3">
              <Avatar
                size={60}
                shape="square"
                src={item.product_image_url}
                className="bg-gray-100 dark:bg-gray-700"
              />
              <div className="flex flex-col gap-0.5">
                <Tooltip title={item.product_name}>
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate block max-w-[220px]">
                    {item.product_name}
                  </span>
                </Tooltip>
                <Link
                  to={`/sales-leads/opportunities/detail/${item.id}`}
                  className="text-xs text-primary-600 hover:underline dark:text-primary-400"
                >
                  {item.opportunity_id}
                </Link>
                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                  {item.buy_listing_id && (
                    <Tooltip title={`Go to Wall Listing ${item.buy_listing_id}`}>
                      <Link
                        to={`/wall-listings/view/${item.buy_listing_id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Buy ID: {item.buy_listing_id}
                      </Link>
                    </Tooltip>
                  )}
                  {item.sell_listing_id && (
                    <Tooltip
                      title={`Go to Wall Listing ${item.sell_listing_id}`}
                    >
                      <Link
                        to={`/wall-listings/view/${item.sell_listing_id}`}
                        className="hover:underline ml-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Sell ID: {item.sell_listing_id}
                      </Link>
                    </Tooltip>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <InfoLine
                    icon={<TbChecklist size={13} />}
                    label="Qty"
                    text={item.quantity ?? "N/A"}
                  />
                  <Tag
                    className={classNames(
                      "capitalize text-[10px] px-1.5 py-0.5",
                      item.want_to === "Buy"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-teal-100 text-teal-700"
                    )}
                  >
                    {item.want_to}
                  </Tag>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Company & Member",
        accessorKey: "company_name",
        size: 280,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="text-xs space-y-2">
              <div className="flex items-center gap-2">
                <TbBuilding
                  size={14}
                  className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                />
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {item.company_name} ({item.company_code})
                </span>
                <Tooltip
                  title={item.company_verified ? "Verified" : "Not Verified"}
                >
                  {item.company_verified ? (
                    <BsCheckCircleFill className="text-emerald-500" />
                  ) : (
                    <BsXCircleFill className="text-red-500" />
                  )}
                </Tooltip>
              </div>
              <div className="pl-6 border-l ml-1.5 dark:border-gray-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <TbUserCheck
                    size={14}
                    className="text-gray-400 dark:text-gray-500 flex-shrink-0"
                  />
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {item.member_name} ({item.member_code})
                  </span>
                  <Tooltip
                    title={item.member_verified ? "Verified" : "Not Verified"}
                  >
                    {item.member_verified ? (
                      <BsCheckCircleFill className="text-emerald-500" />
                    ) : (
                      <BsXCircleFill className="text-red-500" />
                    )}
                  </Tooltip>
                </div>
                <InfoLine
                  icon={
                    <img
                      src={item.member_country_flag}
                      alt={item.member_country}
                      className="w-4 h-auto"
                    />
                  }
                  text={item.member_country}
                />
                <InfoLine
                  icon={<TbBriefcase size={13} />}
                  text={item.member_business_type}
                />
                <InfoLine
                  icon={<TbPhone size={13} />}
                  text={item.member_phone}
                />
                <InfoLine
                  icon={<TbMail size={13} />}
                  text={
                    <a
                      href={`mailto:${item.member_email}`}
                      className="text-blue-500 hover:underline"
                    >
                      {item.member_email}
                    </a>
                  }
                />
              </div>
            </div>
          );
        },
      },
      {
        header: "Specifications",
        accessorKey: "product_specs",
        size: 150,
        cell: ({ row: { original: item } }) => (
          <Tooltip title={item.product_specs || "No specs provided"}>
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-4">
              {item.product_specs || "N/A"}
            </p>
          </Tooltip>
        ),
      },
      {
        header: "Match Info",
        accessorKey: "match_score",
        size: 180,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tooltip title={`Click to filter by "${item.status}"`}>
                  <Tag
                    onClick={() => handleCardClick(item.status)}
                    className={`${recordStatusTagColor[item.status] ||
                      recordStatusTagColor.default
                      } capitalize cursor-pointer`}
                  >
                    {item.status.replace("_", " ")}
                  </Tag>
                </Tooltip>
                <Tag
                  className={`${opportunityStatusTagColor[item.opportunity_status] ||
                    opportunityStatusTagColor.default
                    } capitalize`}
                >
                  {item.opportunity_status}
                </Tag>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-xs">
                  <span>Match Score</span>
                  <span className="font-bold">{item.match_score}%</span>
                </div>
                <Progress size="sm" percent={item.match_score} />
              </div>
            </div>
          );
        },
      },
      {
        header: "Last Updated",
        accessorKey: "updated_at",
        size: 180,
        cell: ({ row: { original: item } }) => (
          <div className="text-xs space-y-1">
            <InfoLine
              icon={<TbUser size={13} />}
              text={item.updated_by_name}
            />
            <InfoLine text={item.updated_by_role} />
            <FormattedDate dateString={item.updated_at} />
          </div>
        ),
      },
      {
        header: "Actions",
        id: "action_std",
        size: 100,
        cell: (props) => (
          <MainRowActionColumn
            item={props.row.original}
            currentTab={currentTab}
            onOpenModal={handleOpenModal}
          />
        ),
      },
    ],
    [currentTab, handleOpenModal]
  );

  const getColumnsForExpandableView = useCallback(
    (): ColumnDef<OpportunityItem>[] => [
      {
        id: "expander",
        header: () => null,
        size: 40,
        cell: ({ row }) => (
          <Tooltip title={row.getIsExpanded() ? "Collapse" : "Expand Details"}>
            <Button
              shape="circle"
              size="xs"
              variant="plain"
              icon={row.getIsExpanded() ? <TbMinus /> : <TbPlus />}
              onClick={row.getToggleExpandedHandler()}
            />
          </Tooltip>
        ),
      },
      {
        header: "Match/Product",
        accessorKey: "product_name",
        size: 280,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-start gap-3">
              <Avatar
                size={38}
                shape="circle"
                className="mt-1 bg-primary-500 text-white text-base flex-shrink-0"
              >
                {item.product_name?.substring(0, 2).toUpperCase()}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-primary-600 dark:text-primary-400 mb-0.5 cursor-default">
                  {item.opportunity_id}
                </span>
                <Tooltip title={item.product_name}>
                  <span className="text-xs text-gray-700 dark:text-gray-200 truncate block max-w-[220px]">
                    {item.product_name}
                  </span>
                </Tooltip>
              </div>
            </div>
          );
        },
      },
      {
        header: "Parties",
        accessorKey: "company_name",
        size: 280,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="text-xs">
              <InfoLine
                icon={<TbBuilding size={14} />}
                text={item.company_name}
                boldText
              />
              <InfoLine
                icon={<TbUser size={14} />}
                text={item.member_name}
                className="mt-1"
              />
              {item.spb_role && (
                <Tag
                  className={classNames(
                    "mt-1.5 capitalize",
                    item.spb_role === "Seller"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  )}
                >
                  {item.spb_role}
                </Tag>
              )}
            </div>
          );
        },
      },
      {
        header: "Match Info",
        accessorKey: "match_score",
        size: 200,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="text-xs space-y-1">
              <InfoLine
                icon={<TbRadar2 size={13} />}
                label="Total Qty"
                text={item.quantity ?? "N/A"}
              />
              <InfoLine
                icon={<TbTargetArrow size={13} />}
                label="Score"
                text={`${item.match_score}%`}
              />
              <div className="flex items-center gap-1">
                <InfoLine icon={<TbProgressCheck size={14} />} label="Status" />
                <Tag
                  className={`${opportunityStatusTagColor[item.opportunity_status] ||
                    opportunityStatusTagColor.default
                    } capitalize`}
                >
                  {item.opportunity_status}
                </Tag>
              </div>
            </div>
          );
        },
      },
      {
        header: "Timestamps",
        accessorKey: "created_date",
        size: 150,
        cell: ({ row }) => (
          <FormattedDate dateString={row.original.created_date} />
        ),
      },
      {
        header: "Actions",
        id: "action_exp",
        size: 120,
        cell: (props) => (
          <MainRowActionColumn
            item={props.row.original}
            currentTab={currentTab}
            onOpenModal={handleOpenModal}
          />
        ),
      },
    ],
    [currentTab, handleOpenModal]
  );

  const columns = useMemo(() => {
    if (currentTab === TABS.AUTO_MATCH) {
      return getColumnsForExpandableView();
    }
    return getColumnsForStandardView();
  }, [currentTab, getColumnsForStandardView, getColumnsForExpandableView]);

  // ***** FIX: CREATE TABLE INSTANCE AT THE TOP LEVEL OF THE MAIN COMPONENT *****
  const table = useReactTable({
    data: pageData,
    columns,
    state: {
      expanded,
      columnVisibility,
    },
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility, // This now connects the toggler to the table state
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
    getRowCanExpand: () => true,
  });

  const isLoading =
    currentTab === TABS.AUTO_MATCH
      ? autoSpbStatus === "loading"
      : masterLoadingStatus === "loading";

  const cardClass =
    "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex items-center gap-3 p-3";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          {!isDashboard && <div className="lg:flex items-center justify-between mb-4">
            <h3 className="mb-4 lg:mb-0">Opportunities</h3>
          </div>}

          {!isDashboard && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Tooltip title="Click to show all opportunities">
              <div onClick={() => handleCardClick("all")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(
                    cardClass,
                    "border-blue-200 dark:border-blue-700"
                  )}
                >
                  <div className="p-2 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100">
                    <TbUsers size={24} />
                  </div>
                  <div>
                    <h6 className="text-base font-semibold">
                      {statusCounts.total}
                    </h6>
                    <span className="text-xs">Total</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show active opportunities">
              <div onClick={() => handleCardClick("active")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(
                    cardClass,
                    "border-emerald-200 dark:border-emerald-700"
                  )}
                >
                  <div className="p-2 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100">
                    <TbCircleCheck size={24} />
                  </div>
                  <div>
                    <h6 className="text-base font-semibold">
                      {statusCounts.active}
                    </h6>
                    <span className="text-xs">Active</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show pending opportunities">
              <div onClick={() => handleCardClick("pending")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(
                    cardClass,
                    "border-yellow-200 dark:border-yellow-700"
                  )}
                >
                  <div className="p-2 rounded-md bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100">
                    <TbClockHour4 size={24} />
                  </div>
                  <div>
                    <h6 className="text-base font-semibold">
                      {statusCounts.pending}
                    </h6>
                    <span className="text-xs">Pending</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show on-hold opportunities">
              <div onClick={() => handleCardClick("on_hold")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(
                    cardClass,
                    "border-gray-200 dark:border-gray-600"
                  )}
                >
                  <div className="p-2 rounded-md bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100">
                    <TbMinus size={24} />
                  </div>
                  <div>
                    <h6 className="text-base font-semibold">
                      {statusCounts.on_hold}
                    </h6>
                    <span className="text-xs">On Hold</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
          </div>}

          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav
              className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto"
              aria-label="Tabs"
            >
              {[TABS.ALL, TABS.SELLER, TABS.BUYER, TABS.AUTO_MATCH].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={classNames(
                      "whitespace-nowrap pb-2 mt-2 px-1 border-b-2 font-medium text-sm capitalize",
                      currentTab === tab
                        ? "border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                    )}
                  >
                    {tab.replace("_opportunities", "").replace("_", " ")}
                  </button>
                )
              )}
            </nav>
          </div>

          {!isDashboard && <div className="mb-4">
            <OpportunityTableTools
              onSearchChange={handleSearchChange}
              onExport={handleOpenExportReasonModal}
              onFilter={() => setIsDrawerOpen(true)}
              onClearFilters={handleClearFilters}
              columnToggler={<ColumnToggler table={table} />}
              activeFilterCount={activeFilterCount}
            />
          </div>}

          {!isDashboard && <ActiveFiltersDisplay
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearFilters}
          />
          }
          <div className="flex-grow overflow-auto">
            <DataTableComponent
              selectable
              columns={columns}
              data={pageData}
              loading={isLoading}
              pagingData={{
                total,
                pageIndex: currentTableData.pageIndex as number,
                pageSize: currentTableData.pageSize as number,
              }}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
              checkboxChecked={(row: OpportunityItem) =>
                currentSelectedItems.some(
                  (selected: OpportunityItem) => selected.id === row.id
                )
              }
              state={{ expanded, columnVisibility }}
              onExpandedChange={setExpanded}
              onColumnVisibilityChange={setColumnVisibility}
              getRowCanExpand={() => true}
              renderRowSubComponent={({ row }: { row: Row<OpportunityItem> }) =>
                currentTab === TABS.AUTO_MATCH ? (
                  <ExpandedAutoSpbDetails
                    row={row}
                    onViewSummary={handleOpenSummaryModal}
                  />
                ) : (
                  <ExpandedOpportunityDetails
                    row={row}
                    currentTab={currentTab}
                  />
                )
              }
              noData={!isLoading && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
        <OpportunitySelectedFooter
          selectedItems={currentSelectedItems}
          onDeleteSelected={handleDeleteSelected}
        />
      </Container>
      <OpportunityFilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApply={setFilters}
        onClear={handleClearFilters}
        initialFilters={filters}
        userOptions={getAllUserDataOptions}
      />
      <OpportunityModals
        modalState={modalState}
        onClose={handleCloseModal}
        getAllUserDataOptions={getAllUserDataOptions}
      />
      <SpbSummaryViewModal
        isOpen={summaryModalState.isOpen}
        onClose={handleCloseSummaryModal}
        item={summaryModalState.item}
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
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <Form
          id="exportReasonForm"
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            isRequired
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
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default Opportunities;