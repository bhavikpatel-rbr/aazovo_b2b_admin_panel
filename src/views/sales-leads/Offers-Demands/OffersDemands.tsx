import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput";
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
  Select,
  Tag,
  Skeleton, // Added Skeleton
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Spinner from "@/components/ui/Spinner";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbAlarm,
  TbArrowDownLeft,
  TbArrowUpRight,
  TbBell,
  TbBrandWhatsapp,
  TbCalendarDown,
  TbCalendarEvent,
  TbCalendarUp,
  TbCancel,
  TbChecks,
  TbCircleCheck,
  TbClockHour4,
  TbCloudUpload,
  TbColumns,
  TbDownload,
  TbEye,
  TbFileText,
  TbFileZip,
  TbFilter,
  TbListDetails,
  TbMail,
  TbPencil,
  TbPlus,
  TbRefresh,
  TbReload,
  TbSearch,
  TbTagStarred,
  TbTrash,
  TbUser,
  TbUserCircle,
  TbX,
  TbCheck,
  TbCopy,
  TbTag,
  TbShoppingCart,
} from "react-icons/tb";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addNotificationAction,
  addScheduleAction,
  addTaskAction,
  addAllActionAction,
  deleteAllDemandsAction,
  deleteAllOffersAction,
  deleteDemandAction,
  deleteOfferAction,
  getAllUsersAction,
  getDemandsAction,
  getOffersAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import { authSelector } from "@/reduxtool/auth/authSlice";

// Types
import type { TableQueries as CommonTableQueries } from "@/@types/common";
import type {
  CellContext,
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "localforage";

interface TableQueries extends CommonTableQueries { }

// --- Form Schemas ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const filterFormSchema = z.object({
  createdDateRange: z
    .array(z.date().nullable())
    .length(2)
    .nullable()
    .optional(),
  updatedDateRange: z
    .array(z.date().nullable())
    .length(2)
    .nullable()
    .optional(),
  itemType: z.enum(["Offer", "Demand"]).nullable().optional(),
  creatorIds: z.array(z.string()).optional().default([]),
  assigneeIds: z.array(z.string()).optional().default([]),
  quickFilters: z
    .object({ type: z.string(), value: z.string() })
    .nullable()
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

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

const taskValidationSchema = z.object({
  task_title: z.string().min(3, "Task title must be at least 3 characters."),
  assign_to: z.array(z.number()).min(1, "At least one assignee is required."),
  priority: z.string().min(1, "Please select a priority."),
  due_date: z.date().nullable().optional(),
  description: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskValidationSchema>;

const notificationSchema = z.object({
  notification_title: z
    .string()
    .min(3, "Title must be at least 3 characters long."),
  send_users: z.array(z.number()).min(1, "Please select at least one user."),
  message: z.string().min(10, "Message must be at least 10 characters long."),
});
type NotificationFormData = z.infer<typeof notificationSchema>;

const activitySchema = z.object({
  item: z
    .string()
    .min(3, "Activity item is required and must be at least 3 characters."),
  notes: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;

// --- API Item Types ---
export type ApiUserShape = {
  id: number;
  name: string;
  roles?: Array<{ display_name: string }>;
  profile_pic_path?: string | null;
};
export type ActualApiOfferShape = {
  id: number;
  generate_id: string;
  name: string;
  created_by: ApiUserShape;
  assign_user?: ApiUserShape | null;
  created_at: string;
  updated_at?: string;
  updated_by_user?: ApiUserShape | null;
  seller_section?: string | string[] | null;
  buyer_section?: string | string[] | null;
  groupA?: string | null;
  groupB?: string | null;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  seller_section_data?: Array<{ id: number; name: string }>;
  buyer_section_data?: Array<{ id: number; name: string }>;
  created_by_user?: ApiUserShape;
  assign_user_data?: ApiUserShape | null;
};
export type ActualApiDemandShape = {
  id: number;
  generate_id: string;
  name: string;
  created_by: ApiUserShape;
  assign_user?: ApiUserShape | null;
  created_at: string;
  updated_at?: string;
  updated_by_user?: ApiUserShape | null;
  seller_section?: Record<
    string,
    { questions: Record<string, { question: string }> }
  > | null;
  buyer_section?: Record<
    string,
    { questions: Record<string, { question: string }> }
  > | null;
  groupA?: string | null;
  groupB?: string | null;
  numberOfBuyers?: number;
  numberOfSellers?: number;
};
export type ApiGroupItem = { groupName: string; items: string[] };
export type OfferDemandItem = {
  id: string;
  type: "Offer" | "Demand";
  name: string;
  createdByInfo: { userId: string; userName: string; email: string };
  assignedToInfo?: { userId: string; userName: string };
  createdDate: Date;
  updated_at?: Date;
  numberOfBuyers?: number;
  numberOfSellers?: number;
  groups?: ApiGroupItem[];
  updated_by_user?: ApiUserShape | null;
  originalApiItem: ActualApiOfferShape | ActualApiDemandShape;
};

export type SelectOption = { value: any; label: string };

const TABS = { ALL: "all", OFFER: "offer", DEMAND: "demand" };

// ============================================================================
// --- MODALS SECTION ---
// ============================================================================
export type OfferDemandModalType =
  | "email"
  | "whatsapp"
  | "notification"
  | "task"
  | "active"
  | "calendar"
  | "alert"
  | "trackRecord"
  | "engagement"
  | "document"
  | "feedback"
  | "wallLink"
  | "viewDetails";
export interface OfferDemandModalState {
  isOpen: boolean;
  type: OfferDemandModalType | null;
  data: OfferDemandItem | null;
}
interface OfferDemandModalsProps {
  modalState: OfferDemandModalState;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}

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
    message: "Offer #OD123 has low engagement.",
    time: "2 days ago",
  },
  {
    id: 2,
    severity: "warning",
    message: "Demand #DD456 is approaching its expiration date.",
    time: "5 days ago",
  },
];
const dummyTimeline = [
  {
    id: 1,
    icon: <TbMail />,
    title: "Initial Offer Created",
    desc: "Offer was created and sent.",
    time: "2023-11-01",
  },
  {
    id: 2,
    icon: <TbCalendarEvent />,
    title: "Follow-up Call Scheduled",
    desc: "Scheduled a call.",
    time: "2023-10-28",
  },
  {
    id: 3,
    icon: <TbUser />,
    title: "Item Assigned",
    desc: "Assigned to team.",
    time: "2023-10-27",
  },
];
const dummyDocs = [
  { id: "doc1", name: "Offer_Details.pdf", type: "pdf", size: "1.2 MB" },
  { id: "doc2", name: "Images.zip", type: "zip", size: "8.5 MB" },
];
// --- Helper Component for View Dialogs ---
const DialogDetailRow = ({
  label,
  value,
  valueClassName,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  valueClassName?: string;
  children?: React.ReactNode;
}) => (
  <div>
    <h6 className="text-xs font-normal text-slate-500 dark:text-slate-400 mb-0.5">
      {label}
    </h6>
    <div
      className={classNames(
        "text-sm font-semibold text-slate-800 dark:text-slate-100",
        valueClassName
      )}
    >
      {children || value || <span className="font-normal italic text-slate-400 dark:text-slate-500">N/A</span>}
    </div>
  </div>
);
const ViewDetailsDialog: React.FC<{
  item: OfferDemandItem; // Make sure your OfferDemandItem type includes a 'products' array
  onClose: () => void;
}> = ({ item, onClose }) => {
  // --- MOCK DATA FOR PRODUCTS: Replace this with your actual data ---
  // I've added this to demonstrate the UI. You should get this from your `item` prop.
  const itemWithProducts = {
    ...item,
    products: item.products || [
      { id: 1, name: 'Premium Leather Sofa', qty: 2, color: 'Cognac Brown', price: '1,500.00', unit: 'piece' },
      { id: 2, name: 'Oak Wood Coffee Table', qty: 1, color: 'Natural Oak', price: '450.00', unit: 'piece' },
      { id: 3, name: 'Velvet Accent Chair', qty: 4, color: 'Emerald Green', price: '320.00', unit: 'piece' },
    ],
  };
  // --- End of Mock Data ---

console.log(item, 'item');

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={700}
      contentClassName="!p-0 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-2xl"
    >
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center justify-center h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {item.type === "Offer" ? <TbTag size={28} /> : <TbShoppingCart size={28} />}
              </div>
              <div>
                <h4 className="font-bold text-lg sm:text-xl text-slate-800 dark:text-slate-100">
                  {item.name}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ID: {String(item?.originalApiItem?.id).padStart(6, '0')}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === "Offer"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
                  }`}
              >
                {item.type}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Offer Details Card */}
          <div className="p-4 bg-white dark:bg-slate-800/60 rounded-lg">
            <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Offer Details
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <DialogDetailRow label="Created By" value={item.createdByInfo.userName} />
              <DialogDetailRow label="Assigned To" value={item.assignedToInfo?.userName} />
              <DialogDetailRow label="Created Date" value={dayjs(item.createdDate).format("D MMM YYYY, h:mm A")} />
              <DialogDetailRow label="Last Updated" value={item.updated_at ? dayjs(item.updated_at).format("D MMM YYYY, h:mm A") : 'N/A'} />
              <DialogDetailRow label="Number of Buyers" value={item.numberOfBuyers} />
              <DialogDetailRow label="Number of Sellers" value={item.numberOfSellers} />
            </div>
          </div>

          {/* Products Card - IMPORTANT: Uses simulated data */}
          {itemWithProducts.products && itemWithProducts.products.length > 0 && (
            <div className="p-4 bg-white dark:bg-slate-800/60 rounded-lg">
              <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Products ({itemWithProducts.products.length})
              </h6>
              <div className="space-y-3">
                {itemWithProducts.products.map(product => (
                  <div key={product.id} className="p-3 border dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800">
                    <h6 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">{product.name}</h6>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <p className="text-slate-500">Quantity</p>
                        <p className="font-semibold">{product.qty} {product.unit}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Color</p>
                        <p className="font-semibold">{product.color}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Price</p>
                        <p className="font-semibold">${product.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups Card */}
          {item.groups && item.groups.length > 0 && (
            <div className="p-4 bg-white dark:bg-slate-800/60 rounded-lg">
              <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Associated Groups
              </h6>
              <div className="space-y-2">
                {item.groups.map((group, index) => (
                  <div key={index} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
                    <p className="font-semibold text-sm text-slate-800 dark:text-gray-100">{group.groupName}</p>
                    <ul className="list-disc list-inside pl-2 mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {group.items.map((gItem, gIndex) => (<li key={gIndex}>{gItem}</li>))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 text-right border-t border-slate-200 dark:border-slate-700">
          <Button variant="solid" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
const AddNotificationDialog: React.FC<{
  item: OfferDemandItem;
  onClose: () => void;
  userOptions: SelectOption[];
  onSubmit: (data: NotificationFormData) => void;
  isLoading: boolean;
}> = ({ item, onClose, userOptions, onSubmit, isLoading }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      notification_title: `Regarding ${item.type}: ${item.name}`,
      send_users: [],
      message: `This is a notification for the ${item.type.toLowerCase()}: "${item.name
        }".`,
    },
    mode: "onChange",
  });
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for {item.name}</h5>
      <Form onSubmit={handleSubmit(onSubmit)}>
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
                options={userOptions}
                value={userOptions.filter((o) =>
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
  item: OfferDemandItem;
  onClose: () => void;
  userOptions: SelectOption[];
  onSubmit: (data: TaskFormData) => void;
  isLoading: boolean;
}> = ({ item, onClose, userOptions, onSubmit, isLoading }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskValidationSchema),
    defaultValues: {
      task_title: `Follow up: ${item.type} ${item.name}`,
      assign_to: [],
      priority: "Medium",
      due_date: null,
      description: `Follow up regarding ${item.type}: ${item.name} (ID: ${item.id})`,
    },
    mode: "onChange",
  });
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for {item.name}</h5>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormItem
          label="Title"
          invalid={!!errors.task_title}
          errorMessage={errors.task_title?.message}
        >
          <Controller
            name="task_title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem
            label="Assign To"
            invalid={!!errors.assign_to}
            errorMessage={errors.assign_to?.message}
          >
            <Controller
              name="assign_to"
              control={control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select User"
                  options={userOptions}
                  value={userOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts: any) =>
                    field.onChange(opts?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Priority"
            invalid={!!errors.priority}
            errorMessage={errors.priority?.message}
          >
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select
                  placeholder="Select Priority"
                  options={priorityOptions}
                  value={priorityOptions.find((p) => p.value === field.value)}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
          </FormItem>
        </div>
        <FormItem
          label="Due Date"
          invalid={!!errors.due_date}
          errorMessage={errors.due_date?.message}
        >
          <Controller
            name="due_date"
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
        <FormItem
          label="Description"
          invalid={!!errors.description}
          errorMessage={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => <Input textArea {...field} />}
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
            Assign Task
          </Button>
        </div>
      </Form>
    </Dialog>
  );
};
const AddScheduleDialog: React.FC<{
  item: OfferDemandItem;
  onClose: () => void;
  onSubmit: (data: ScheduleFormData) => void;
  isLoading: boolean;
}> = ({ item, onClose, onSubmit, isLoading }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_title: `Regarding ${item.type}: ${item.name}`,
      event_type: undefined,
      date_time: null as any,
      remind_from: null,
      notes: `Details for ${item.type.toLowerCase()} "${item.name}" (ID: ${item.id
        }).`,
    },
    mode: "onChange",
  });
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for {item.name}</h5>
      <Form onSubmit={handleSubmit(onSubmit)}>
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
                  placeholder="Select date & time"
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
const AddActivityDialog: React.FC<{
  item: OfferDemandItem;
  onClose: () => void;
  onSubmit: (data: ActivityFormData) => void;
  isLoading: boolean;
}> = ({ item, onClose, onSubmit, isLoading }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      item: `Marked ${item.type} as active: ${item.name}`,
      notes: "",
    },
    mode: "onChange",
  });
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Activity for {item.name}</h5>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormItem
          label="Activity"
          invalid={!!errors.item}
          errorMessage={errors.item?.message}
        >
          <Controller
            name="item"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Followed up with customer" />
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
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
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
      <h5 className="mb-4">Alerts for {item.name}</h5>
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
                  />{" "}
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
const TrackRecordDialog: React.FC<{
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Track Record for {item.name}</h5>
      <div className="mt-4 -ml-4">
        {dummyTimeline.map((tlItem, index) => (
          <div key={tlItem.id} className="flex gap-4 relative">
            {index < dummyTimeline.length - 1 && (
              <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-600"></div>
            )}
            <div className="flex-shrink-0 z-10 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 text-gray-500 flex items-center justify-center">
              {React.cloneElement(tlItem.icon, { size: 24 })}
            </div>
            <div className="pb-8">
              <p className="font-semibold">{tlItem.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {tlItem.desc}
              </p>
              <p className="text-xs text-gray-400 mt-1">{tlItem.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-right mt-2">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};
const DownloadDocumentDialog: React.FC<{
  item: OfferDemandItem;
  onClose: () => void;
}> = ({ item, onClose }) => {
  const iconMap: Record<string, React.ReactElement> = {
    pdf: <TbFileText className="text-red-500" />,
    zip: <TbFileZip className="text-amber-500" />,
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Documents for {item.name}</h5>
      <div className="flex flex-col gap-3 mt-4">
        {dummyDocs.map((doc) => (
          <div
            key={doc.id}
            className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="flex items-center gap-3">
              {React.cloneElement(iconMap[doc.type] || <TbFileText />, {
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

const OfferDemandModals: React.FC<OfferDemandModalsProps> = ({
  modalState,
  onClose,
  getAllUserDataOptions,
}) => {
  const dispatch = useAppDispatch();
  const [userData, setUserData] = useState<any>(null);
  useEffect(() => {
    const { useEncryptApplicationStorage } = config;
    try {
      setUserData(
        encryptStorage.getItem("UserData", !useEncryptApplicationStorage)
      );
    } catch (error) {
      console.error("Error getting UserData:", error);
    }
  }, []);
  const { user } = useSelector(authSelector);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const { type, data: item, isOpen } = modalState;

  if (!isOpen || !item) return null;

  const handleConfirmNotification = async (formData: NotificationFormData) => {
    if (!item) return;
    setIsSubmittingAction(true);
    const payload = {
      send_users: formData.send_users,
      notification_title: formData.notification_title,
      message: formData.message,
      module_id: String((item.originalApiItem as any).id),
      module_name: "OfferDemand",
    };
    try {
      await dispatch(addNotificationAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Notification Sent!" />);
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Failed to Send Notification"
          children={error?.message || "An error occurred."}
        />
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };
  const handleConfirmTask = async (data: TaskFormData) => {
    if (!item) return;
    setIsSubmittingAction(true);
    try {
      const payload = {
        ...data,
        due_date: data.due_date
          ? dayjs(data.due_date).format("YYYY-MM-DD")
          : undefined,
        module_id: String((item.originalApiItem as any).id),
        module_name: "OfferDemand",
      };
      await dispatch(addTaskAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Task Assigned!" />);
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Failed to Assign Task"
          children={error?.message || "An error occurred."}
        />
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };
  const handleConfirmSchedule = async (data: ScheduleFormData) => {
    if (!item) return;
    setIsSubmittingAction(true);
    const payload = {
      module_id: Number((item.originalApiItem as any).id),
      module_name: "OfferDemand",
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
      toast.push(<Notification type="success" title="Event Scheduled" />);
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Scheduling Failed"
          children={error?.message || "An error occurred."}
        />
      );
    } finally {
      setIsSubmittingAction(false);
    }
  };
  const handleConfirmActivity = async (data: ActivityFormData) => {
    if (!item || !userData?.id) return;
    setIsSubmittingAction(true);
    const payload = {
      item: data.item,
      notes: data.notes || "",
      module_id: String((item.originalApiItem as any).id),
      module_name: "OfferDemand",
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
      setIsSubmittingAction(false);
    }
  };

  const renderModalContent = () => {
    switch (type) {
      case "viewDetails":
        return <ViewDetailsDialog item={item} onClose={onClose} />;
      case "notification":
        return (
          <AddNotificationDialog
            item={item}
            onClose={onClose}
            userOptions={getAllUserDataOptions}
            onSubmit={handleConfirmNotification}
            isLoading={isSubmittingAction}
          />
        );
      case "task":
        return (
          <AssignTaskDialog
            item={item}
            onClose={onClose}
            userOptions={getAllUserDataOptions}
            onSubmit={handleConfirmTask}
            isLoading={isSubmittingAction}
          />
        );
      case "calendar":
        return (
          <AddScheduleDialog
            item={item}
            onClose={onClose}
            onSubmit={handleConfirmSchedule}
            isLoading={isSubmittingAction}
          />
        );
      case "active":
        return (
          <AddActivityDialog
            item={item}
            onClose={onClose}
            onSubmit={handleConfirmActivity}
            isLoading={isSubmittingAction}
          />
        );
      case "alert":
        return <ViewAlertDialog item={item} onClose={onClose} />;
      case "trackRecord":
        return <TrackRecordDialog item={item} onClose={onClose} />;
      case "document":
        return <DownloadDocumentDialog item={item} onClose={onClose} />;
      default:
        return null;
    }
  };
  return <>{renderModalContent()}</>;
};

// ============================================================================
// --- END MODALS SECTION ---
// ============================================================================

type OfferDemandExportItem = Omit<
  OfferDemandItem,
  | "createdDate"
  | "updated_at"
  | "createdByInfo"
  | "assignedToInfo"
  | "originalApiItem"
  | "groups"
  | "updated_by_user"
> & {
  created_by_name: string;
  assigned_to_name: string;
  created_date_formatted: string;
  updated_date_formatted: string;
  updated_by_name?: string;
  updated_by_role?: string;
};

const CSV_HEADERS_OFFERS_DEMANDS = [
  "ID",
  "Type",
  "Name",
  "Number of Buyers",
  "Number of Sellers",
  "Created By",
  "Assigned To",
  "Created Date",
  "Last Updated",
  "Updated By",
  "Updated By Role",
];
const CSV_KEYS_OFFERS_DEMANDS_EXPORT: (keyof OfferDemandExportItem)[] = [
  "id",
  "type",
  "name",
  "numberOfBuyers",
  "numberOfSellers",
  "created_by_name",
  "assigned_to_name",
  "created_date_formatted",
  "updated_date_formatted",
  "updated_by_name",
  "updated_by_role",
];

function exportToCsvOffersDemands(filename: string, rows: OfferDemandItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: OfferDemandExportItem[] = rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    numberOfBuyers: row.numberOfBuyers,
    numberOfSellers: row.numberOfSellers,
    created_by_name: row.createdByInfo.userName,
    assigned_to_name: row.assignedToInfo?.userName || "N/A",
    created_date_formatted: dayjs(row.createdDate).format(
      "YYYY-MM-DD HH:mm:ss"
    ),
    updated_date_formatted: row.updated_at
      ? dayjs(row.updated_at).format("YYYY-MM-DD HH:mm:ss")
      : "N/A",
    updated_by_name: row.updated_by_user?.name,
    updated_by_role: row.updated_by_user?.roles?.[0]?.display_name,
  }));
  const separator = ",";
  const csvContent =
    CSV_HEADERS_OFFERS_DEMANDS.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return CSV_KEYS_OFFERS_DEMANDS_EXPORT.map((k) => {
          let cell = row?.[k as keyof OfferDemandExportItem];
          if (cell === null || cell === undefined) cell = "";
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

const transformApiOffer = (apiOffer: ActualApiOfferShape): OfferDemandItem => {
  const offerGroups: ApiGroupItem[] = [];
  if (
    apiOffer.seller_section_data &&
    Array.isArray(apiOffer.seller_section_data)
  ) {
    const sellerItems = apiOffer.seller_section_data
      .map((user) => user.name)
      .filter(Boolean);
    if (sellerItems.length > 0)
      offerGroups.push({ groupName: "Seller Section", items: sellerItems });
  }
  if (
    apiOffer.buyer_section_data &&
    Array.isArray(apiOffer.buyer_section_data)
  ) {
    const buyerItems = apiOffer.buyer_section_data
      .map((user) => user.name)
      .filter(Boolean);
    if (buyerItems.length > 0)
      offerGroups.push({ groupName: "Buyer Section", items: buyerItems });
  }
  if (apiOffer.groupA)
    offerGroups.push({ groupName: "Group A", items: [apiOffer.groupA] });
  if (apiOffer.groupB)
    offerGroups.push({ groupName: "Group B", items: [apiOffer.groupB] });
  const creator = apiOffer.created_by_user || apiOffer.created_by;
  const assignee = apiOffer.assign_user_data || apiOffer.assign_user;

  return {
    id: apiOffer.generate_id,
    type: "Offer",
    name: apiOffer.name,
    createdByInfo: {
      userId: String(creator.id),
      userName: creator.name,
      email: `${creator.name?.replace(/\s+/g, ".").toLowerCase()}@example.com`,
    },
    assignedToInfo: assignee
      ? {
        userId: String(assignee.id),
        userName: assignee.name,
      }
      : undefined,
    createdDate: new Date(apiOffer.created_at),
    updated_at: apiOffer.updated_at ? new Date(apiOffer.updated_at) : undefined,
    numberOfBuyers: apiOffer.numberOfBuyers,
    numberOfSellers: apiOffer.numberOfSellers,
    groups: offerGroups.length > 0 ? offerGroups : undefined,
    updated_by_user: apiOffer.updated_by_user,
    originalApiItem: apiOffer,
  };
};

const transformApiDemand = (
  apiDemand: ActualApiDemandShape
): OfferDemandItem => {
  const demandGroups: ApiGroupItem[] = [];
  if (apiDemand.seller_section) {
    const i: string[] = [];
    Object.values(apiDemand.seller_section).forEach((sP) => {
      if (sP?.questions)
        Object.values(sP.questions).forEach((q) => {
          if (q?.question) i.push(q.question);
        });
    });
    if (i.length > 0)
      demandGroups.push({ groupName: "Seller Section", items: i });
  }
  if (apiDemand.buyer_section) {
    const i: string[] = [];
    Object.values(apiDemand.buyer_section).forEach((sP) => {
      if (sP?.questions)
        Object.values(sP.questions).forEach((q) => {
          if (q?.question) i.push(q.question);
        });
    });
    if (i.length > 0)
      demandGroups.push({ groupName: "Buyer Section", items: i });
  }
  if (apiDemand.groupA)
    demandGroups.push({ groupName: "Group A", items: [apiDemand.groupA] });
  if (apiDemand.groupB)
    demandGroups.push({ groupName: "Group B", items: [apiDemand.groupB] });
  return {
    id: apiDemand.generate_id,
    type: "Demand",
    name: apiDemand.name,
    createdByInfo: {
      userId: String(apiDemand?.created_by?.id),
      userName: apiDemand?.created_by?.name,
      email: `${apiDemand.created_by?.name
        ?.replace(/\s+/g, ".")
        ?.toLowerCase()}@example.com`,
    },
    assignedToInfo: apiDemand?.assign_user
      ? {
        userId: String(apiDemand.assign_user?.id),
        userName: apiDemand?.assign_user?.name,
      }
      : undefined,
    createdDate: new Date(apiDemand.created_at),
    updated_at: apiDemand.updated_at
      ? new Date(apiDemand.updated_at)
      : undefined,
    numberOfBuyers: apiDemand.numberOfBuyers,
    numberOfSellers: apiDemand.numberOfSellers,
    groups: demandGroups.length > 0 ? demandGroups : undefined,
    updated_by_user: apiDemand.updated_by_user,
    originalApiItem: apiDemand,
  };
};

const ActionColumn = React.memo(
  ({
    rowData,
    onEdit,
    onView,
    onDelete,
    onOpenModal,
  }: {
    rowData: OfferDemandItem;
    onEdit: () => void;
    onView: () => void;
    onDelete: () => void;
    onOpenModal: (type: OfferDemandModalType, data: OfferDemandItem) => void;
  }) => (
    <div className="flex items-center justify-center gap-0">
      <Tooltip title="Edit">
        <div
          role="button"
          onClick={onEdit}
          className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View Details">
        <div
          role="button"
          onClick={onView}
          className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400"
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
          onClick={() => onOpenModal("email", rowData)}
          className="flex items-center gap-2"
        >
          <TbMail size={18} /> <span className="text-xs">Send Email</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("whatsapp", rowData)}
          className="flex items-center gap-2"
        >
          <TbBrandWhatsapp size={18} />{" "}
          <span className="text-xs">Send WhatsApp</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("notification", rowData)}
          className="flex items-center gap-2"
        >
          <TbBell size={18} /> <span className="text-xs">Add Notification</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("task", rowData)}
          className="flex items-center gap-2"
        >
          <TbUser size={18} /> <span className="text-xs">Assign Task</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("calendar", rowData)}
          className="flex items-center gap-2"
        >
          <TbCalendarEvent size={18} />{" "}
          <span className="text-xs">Add to Calendar</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("active", rowData)}
          className="flex items-center gap-2"
        >
          <TbTagStarred size={18} />{" "}
          <span className="text-xs">Add Active Log</span>
        </Dropdown.Item>
      </Dropdown>
    </div>
  )
);
ActionColumn.displayName = "ActionColumn";

const ItemTable = React.memo(
  ({
    columns,
    data,
    loading,
    pagingData,
    selectedItems,
    onPaginationChange,
    onSelectChange,
    onSort,
    onRowSelect,
    onAllRowSelect,
    selectable = true,
  }: {
    columns: ColumnDef<OfferDemandItem>[];
    data: OfferDemandItem[];
    loading: boolean;
    pagingData: { total: number; pageIndex: number; pageSize: number };
    selectedItems?: OfferDemandItem[];
    onPaginationChange: (page: number) => void;
    onSelectChange: (value: number) => void;
    onSort: (sort: OnSortParam) => void;
    onRowSelect?: (checked: boolean, row: OfferDemandItem) => void;
    onAllRowSelect?: (checked: boolean, rows: Row<OfferDemandItem>[]) => void;
    selectable?: boolean;
  }) => (
    <DataTable
      selectable={selectable}
      columns={columns}
      data={data}
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedItems?.some((selected) => selected.id === row.id) ?? false
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
  )
);
ItemTable.displayName = "ItemTable";

const ItemSearch = React.memo(
  React.forwardRef<
    HTMLInputElement,
    { onInputChange: (value: string) => void; initialValue?: string }
  >(({ onInputChange, initialValue }, ref) => (
    <DebouceInput
      ref={ref}
      placeholder="Quick Search (ID, Name, Creator)..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  ))
);
ItemSearch.displayName = "ItemSearch";

const ItemTableTools = React.memo(
  ({
    onSearchChange,
    onExport,
    searchQuery,
    onOpenFilter,
    onClearFilters,
    activeFilterCount,
    columns,
    filteredColumns,
    setFilteredColumns,
  }: {
    onSearchChange: (query: string) => void;
    onExport: () => void;
    searchQuery: string;
    onOpenFilter: () => void;
    onClearFilters: () => void;
    activeFilterCount: number;
    columns: ColumnDef<OfferDemandItem>[];
    filteredColumns: ColumnDef<OfferDemandItem>[];
    setFilteredColumns: React.Dispatch<
      React.SetStateAction<ColumnDef<OfferDemandItem>[]>
    >;
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
          <ItemSearch
            onInputChange={onSearchChange}
            initialValue={searchQuery}
          />
        </div>
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
            onClick={onOpenFilter}
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
      </div>
    );
  }
);
ItemTableTools.displayName = "ItemTableTools";

const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
  allUsers,
}: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData, value?: any) => void;
  onClearAll: () => void;
  allUsers: ApiUserShape[];
}) => {
  const hasFilters = Object.values(filterData).some(
    (val) => val && (!Array.isArray(val) || val.length > 0)
  );
  const userMap = useMemo(
    () => new Map(allUsers.map((u) => [String(u.id), u.name])),
    [allUsers]
  );
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {filterData.quickFilters?.value && (
        <Tag prefix>
          Type: {filterData.quickFilters.value}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("quickFilters")}
          />
        </Tag>
      )}
      {filterData.itemType && (
        <Tag prefix>
          Type: {filterData.itemType}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("itemType")}
          />
        </Tag>
      )}
      {filterData.creatorIds?.map((id) => (
        <Tag key={`creator-${id}`} prefix>
          Creator: {userMap.get(id) || id}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("creatorIds", id)}
          />
        </Tag>
      ))}
      {filterData.assigneeIds?.map((id) => (
        <Tag key={`assignee-${id}`} prefix>
          Assignee: {userMap.get(id) || id}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("assigneeIds", id)}
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

const ItemSelected = React.memo(
  ({
    selectedItems,
    onDeleteSelected,
    activeTab,
    isDeleting,
  }: {
    selectedItems: OfferDemandItem[];
    onDeleteSelected: () => void;
    activeTab: string;
    isDeleting: boolean;
  }) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    const itemType =
      activeTab === TABS.OFFER
        ? "Offer"
        : activeTab === TABS.DEMAND
          ? "Demand"
          : "Item";
    return (
      <>
        <StickyFooter
          className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
          stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
        >
          <div className="flex items-center justify-between w-full px-4 sm:px-8">
            <span className="flex items-center gap-2">
              <TbChecks className="text-lg text-primary-600 dark:text-primary-400" />
              <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                <span className="heading-text">{selectedItems.length}</span>
                <span>
                  {itemType}
                  {selectedItems.length > 1 ? "s" : ""} selected
                </span>
              </span>
            </span>
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={() => setDeleteOpen(true)}
              loading={isDeleting}
            >
              Delete Selected
            </Button>
          </div>
        </StickyFooter>
        <ConfirmDialog
          isOpen={deleteOpen}
          type="danger"
          title={`Delete ${selectedItems.length} ${itemType}${selectedItems.length > 1 ? "s" : ""
            }`}
          onClose={() => setDeleteOpen(false)}
          onRequestClose={() => setDeleteOpen(false)}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            onDeleteSelected();
            setDeleteOpen(false);
          }}
          loading={isDeleting}
        >
          <p>
            Are you sure you want to delete the selected{" "}
            {itemType.toLowerCase()}
            {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
          </p>
        </ConfirmDialog>
      </>
    );
  }
);
ItemSelected.displayName = "ItemSelected";

const OffersDemands = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useSelector(authSelector);

  const {
    Offers: { counts: offerDemandCounts, data: offersStoreData },
    Demands: demandsStoreData,
    offersStatus,
    demandsStatus,
    offersError,
    demandsError,
    getAllUserData,
  } = useSelector(masterSelector, shallowEqual);

  const [initialLoading, setInitialLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>(TABS.ALL);
  const initialTableQueries: TableQueries = {
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  };
  const [offerTableConfig, setOfferTableConfig] =
    useState<TableQueries>(initialTableQueries);
  const [demandTableConfig, setDemandTableConfig] =
    useState<TableQueries>(initialTableQueries);
  const [allTableConfig, setAllTableConfig] =
    useState<TableQueries>(initialTableQueries);
  const [selectedOffers, setSelectedOffers] = useState<OfferDemandItem[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<OfferDemandItem[]>([]);
  const [selectedAll, setSelectedAll] = useState<OfferDemandItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDeleteConfirm, setItemToDeleteConfirm] =
    useState<OfferDemandItem | null>(null);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [dataForExportLoading, setDataForExportLoading] = useState(false);
  const [modalState, setModalState] = useState<OfferDemandModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
    filterFormSchema.parse({})
  );
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  // --- ADDED for Image Viewer ---
  const [imageView, setImageView] = useState("");
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const openImageViewer = useCallback((path: string | null | undefined) => {
    if (path) {
      setImageView(path);
      setIsImageViewerOpen(true);
    } else {
      toast.push(
        <Notification title="No Image" type="info">
          User has no profile picture.
        </Notification>
      );
    }
  }, []);

  const closeImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
    setImageView("");
  }, []);

  const formatCustomDateTime = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return "N/A";
    return dayjs(dateStr).format("D MMM YYYY, h:mm A");
  };

  const handleOpenModal = useCallback(
    (type: OfferDemandModalType, itemData: OfferDemandItem) => {
      if (type === "email") {
        const subject = `Regarding your ${itemData.type}: ${itemData.name}`;
        const body = `Dear ${itemData.createdByInfo.userName},\n\n`;
        window.open(
          `mailto:${itemData.createdByInfo.email}?subject=${encodeURIComponent(
            subject
          )}&body=${encodeURIComponent(body)}`
        );
        toast.push(
          <Notification type="success" title="Opening Email Client" />
        );
        return;
      }
      if (type === "whatsapp") {
        const phone = "1234567890"; // Placeholder phone number
        if (!phone) {
          toast.push(
            <Notification type="danger" title="Invalid Phone Number" />
          );
          return;
        }
        const message = `Hi ${itemData.createdByInfo.userName}, regarding your ${itemData.type}: "${itemData.name}"...`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(
          message
        )}`;
        window.open(url, "_blank");
        toast.push(
          <Notification type="success" title="Redirecting to WhatsApp" />
        );
        return;
      }
      setModalState({ isOpen: true, type, data: itemData });
    },
    []
  );

  const handleCloseModal = () =>
    setModalState({ isOpen: false, type: null, data: null });

  const getAllUserDataOptions = useMemo(
    () =>
      Array.isArray(getAllUserData)
        ? getAllUserData.map((user: any) => ({
          value: String(user.id),
          label: `(${user.employee_id}) - ${user.name || 'N/A'}`,
        }))
        : [],
    [getAllUserData]
  );

  const currentTableConfig = useMemo(() => {
    if (currentTab === TABS.ALL) return allTableConfig;
    if (currentTab === TABS.OFFER) return offerTableConfig;
    if (currentTab === TABS.DEMAND) return demandTableConfig;
    return allTableConfig;
  }, [currentTab, allTableConfig, offerTableConfig, demandTableConfig]);

  const setCurrentTableConfig = useMemo(() => {
    if (currentTab === TABS.ALL) return setAllTableConfig;
    if (currentTab === TABS.OFFER) return setOfferTableConfig;
    if (currentTab === TABS.DEMAND) return setDemandTableConfig;
    return setAllTableConfig;
  }, [currentTab]);

  const currentSelectedItems = useMemo(() => {
    if (currentTab === TABS.ALL) return selectedAll;
    if (currentTab === TABS.OFFER) return selectedOffers;
    if (currentTab === TABS.DEMAND) return selectedDemands;
    return [];
  }, [currentTab, selectedAll, selectedOffers, selectedDemands]);

  const setCurrentSelectedItems = useMemo(() => {
    if (currentTab === TABS.ALL) return setSelectedAll;
    if (currentTab === TABS.OFFER) return setSelectedOffers;
    if (currentTab === TABS.DEMAND) return setSelectedDemands;
    return setSelectedAll;
  }, [currentTab]);

  const prepareApiParams = useCallback(
    (
      tableConfig: TableQueries,
      filters: FilterFormData,
      forExport: boolean = false
    ) => {
      const params: any = { search: tableConfig.query };
      if (forExport) {
        params.fetch_all = true;
      } else {
        params.page = tableConfig.pageIndex;
        params.per_page = tableConfig.pageSize;
        if (tableConfig.sort.key && tableConfig.sort.order) {
          params.sortBy = tableConfig.sort.key;
          params.sortOrder = tableConfig.sort.order;
        }
      }
      if (filters.createdDateRange?.[0])
        params.created_from = dayjs(filters.createdDateRange[0]).format(
          "YYYY-MM-DD"
        );
      if (filters.createdDateRange?.[1])
        params.created_to = dayjs(filters.createdDateRange[1]).format(
          "YYYY-MM-DD"
        );
      if (filters.updatedDateRange?.[0])
        params.updated_from = dayjs(filters.updatedDateRange[0]).format(
          "YYYY-MM-DD"
        );
      if (filters.updatedDateRange?.[1])
        params.updated_to = dayjs(filters.updatedDateRange[1]).format(
          "YYYY-MM-DD"
        );
      if (filters.creatorIds?.length)
        params.created_by = filters.creatorIds.join(",");
      if (filters.assigneeIds?.length)
        params.assign_user = filters.assigneeIds.join(",");
      const itemType =
        filters.quickFilters?.type === "item"
          ? filters.quickFilters.value
          : filters.itemType;
      if (itemType) {
        params.item_type = itemType.toLowerCase();
      }
      return params;
    },
    []
  );

  const fetchData = useCallback(() => {
    const timerId = setTimeout(() => {
      const params = prepareApiParams(currentTableConfig, filterCriteria);
      const shouldFetchOffers = currentTab === TABS.OFFER || (currentTab === TABS.ALL && (!filterCriteria.itemType || filterCriteria.itemType === "Offer"));
      const shouldFetchDemands = currentTab === TABS.DEMAND || (currentTab === TABS.ALL && (!filterCriteria.itemType || filterCriteria.itemType === "Demand"));
      if (shouldFetchOffers) {
        dispatch(getOffersAction(params));
      }
      if (shouldFetchDemands) {
        dispatch(getDemandsAction(params));
      }
    }, 800);
    return () => {
      clearTimeout(timerId);
    };
  }, [
    dispatch, currentTab, currentTableConfig, filterCriteria, prepareApiParams,
  ]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          dispatch(getAllUsersAction()),
          fetchData()
        ]);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [dispatch]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (initialLoading) return;
      fetchData();

    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, [fetchData, initialLoading]);


  useEffect(() => {
    if (offersStatus === "failed" && offersError)
      toast.push(
        <Notification title="Error Fetching Offers" type="danger">
          {String(offersError)}
        </Notification>
      );
  }, [offersStatus, offersError]);
  useEffect(() => {
    if (demandsStatus === "failed" && demandsError)
      toast.push(
        <Notification title="Error Fetching Demands" type="danger">
          {String(demandsError)}
        </Notification>
      );
  }, [demandsStatus, demandsError]);

  const { pageData, totalItems } = useMemo(() => {
    let itemsToDisplay: OfferDemandItem[] = [];
    let currentTotal = 0;
    const safeOffersItems = Array.isArray(offersStoreData?.data) ? offersStoreData.data : [];
    const safeDemandsItems = Array.isArray(demandsStoreData?.data) ? demandsStoreData.data : [];
    const safeOffersTotal = typeof offersStoreData?.total === 'number' ? offersStoreData.total : 0;
    const safeDemandsTotal = typeof demandsStoreData?.total === 'number' ? demandsStoreData.total : 0;

    const itemTypeFilter =
      filterCriteria.quickFilters?.type === "item"
        ? filterCriteria.quickFilters.value
        : filterCriteria.itemType;

    if (currentTab === TABS.OFFER) {
      itemsToDisplay = safeOffersItems.map(transformApiOffer);
      currentTotal = safeOffersTotal;
    } else if (currentTab === TABS.DEMAND) {
      itemsToDisplay = safeDemandsItems.map(transformApiDemand);
      currentTotal = safeDemandsTotal;
    } else {
      let combined = [];
      if (!itemTypeFilter || itemTypeFilter === "Offer") {
        combined.push(...safeOffersItems.map(transformApiOffer));
      }
      if (!itemTypeFilter || itemTypeFilter === "Demand") {
        combined.push(...safeDemandsItems.map(transformApiDemand));
      }
      itemsToDisplay = combined;
      if (itemTypeFilter === "Offer") currentTotal = safeOffersTotal;
      else if (itemTypeFilter === "Demand") currentTotal = safeDemandsTotal;
      else currentTotal = safeOffersTotal + safeDemandsTotal;
      const { order, key } = allTableConfig.sort as OnSortParam;
      if (order && key && itemsToDisplay.length > 0) {
        itemsToDisplay.sort((a, b) => {
          let aValue: any, bValue: any;
          if (key === "createdDate" || key === "updated_at") {
            const dA = a[key] ? new Date(a[key]!).getTime() : 0;
            const dB = b[key] ? new Date(b[key]!).getTime() : 0;
            return order === "asc" ? dA - dB : dB - dA;
          } else if (key === "name" || key === "id") {
            aValue = a[key];
            bValue = b[key];
          } else if (key === "createdBy") {
            aValue = a.createdByInfo.userName;
            bValue = b.createdByInfo.userName;
          } else {
            aValue = (a as any)[key];
            bValue = (b as any)[key];
          }
          if (aValue === null || aValue === undefined) aValue = "";
          if (bValue === null || bValue === undefined) bValue = "";
          if (typeof aValue === "string" && typeof bValue === "string")
            return order === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          if (typeof aValue === "number" && typeof bValue === "number")
            return order === "asc" ? aValue - bValue : bValue - aValue;
          return 0;
        });
      }
    }
    return { pageData: itemsToDisplay, totalItems: currentTotal };
  }, [
    offersStoreData,
    demandsStoreData,
    currentTab,
    filterCriteria.itemType,
    filterCriteria.quickFilters,
    allTableConfig.sort,
  ]);

  const handleSetTableConfig = useCallback(
    (data: Partial<TableQueries>) => {
      setCurrentTableConfig((prev) => ({
        ...prev,
        ...data,
        pageIndex: data.pageIndex !== undefined ? data.pageIndex : 1,
      }));
    },
    [setCurrentTableConfig]
  );
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria({ ...data, quickFilters: null });
      handleSetTableConfig({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [handleSetTableConfig, closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const d = filterFormSchema.parse({});
    filterFormMethods.reset(d);
    setFilterCriteria(d);
    handleSetTableConfig({ pageIndex: 1, query: "" });
    closeFilterDrawer();
  }, [filterFormMethods, handleSetTableConfig, closeFilterDrawer]);
  const handleCardClick = (
    type: "item",
    value: "Offer" | "Demand" | "Today"
  ) => {
    onClearFilters();
    setFilterCriteria({ ...filterCriteria, quickFilters: { type, value } });
  };

  const handleRemoveFilter = useCallback(
    (key: keyof FilterFormData, value?: any) => {
      setFilterCriteria((prev) => {
        const newFilters = { ...prev };
        const arrayFilters: (keyof FilterFormData)[] = [
          "creatorIds",
          "assigneeIds",
        ];

        if (arrayFilters.includes(key)) {
          const currentValues = prev[key] as any[] | undefined;
          if (Array.isArray(currentValues)) {
            const newValues = currentValues.filter((item) => item !== value);
            (newFilters as any)[key] =
              newValues.length > 0 ? newValues : undefined;
          }
        } else {
          (newFilters as any)[key] = null;
        }

        return newFilters;
      });
      handleSetTableConfig({ pageIndex: 1 });
    },
    [handleSetTableConfig]
  );

  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableConfig({ pageIndex: page }),
    [handleSetTableConfig]
  );
  const handlePageSizeChange = useCallback(
    (value: number) => {
      handleSetTableConfig({ pageSize: value, pageIndex: 1 });
      setCurrentSelectedItems([]);
    },
    [handleSetTableConfig, setCurrentSelectedItems]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableConfig({ sort, pageIndex: 1 }),
    [handleSetTableConfig]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableConfig({ query, pageIndex: 1 }),
    [handleSetTableConfig]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: OfferDemandItem) => {
      setCurrentSelectedItems((prev) =>
        checked
          ? prev.some((i) => i.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((i) => i.id !== row.id)
      );
    },
    [setCurrentSelectedItems]
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentTableRows: Row<OfferDemandItem>[]) => {
      const cVIds = new Set(currentTableRows.map((r) => r.original.id));
      if (checked) {
        setCurrentSelectedItems((prev) => {
          const nI = currentTableRows
            .map((r) => r.original)
            .filter((i) => !prev.some((pI) => pI.id === i.id));
          return [...prev, ...nI];
        });
      } else {
        setCurrentSelectedItems((prev) => prev.filter((i) => !cVIds.has(i.id)));
      }
    },
    [setCurrentSelectedItems]
  );

  const handleEdit = useCallback(
    (item: OfferDemandItem) => {
      const baseRoute = item.type === "Offer" ? "offers" : "demands";
      navigate(`/sales-leads/${baseRoute}/create`, { state: item });
    },
    [navigate]
  );
  const handleView = useCallback(
    (item: OfferDemandItem) => {
      handleOpenModal("viewDetails", item);
    },
    [handleOpenModal]
  );
  const handleDeleteClick = useCallback(
    (item: OfferDemandItem) => setItemToDeleteConfirm(item),
    []
  );

  const onConfirmDelete = useCallback(async () => {
    if (!itemToDeleteConfirm) return;
    setIsDeleting(true);
    try {
      const { originalApiItem, type, name } = itemToDeleteConfirm;
      const idTD = (
        originalApiItem as ActualApiOfferShape | ActualApiDemandShape
      ).id;
      if (type === "Offer") await dispatch(deleteOfferAction(idTD)).unwrap();
      else if (type === "Demand")
        await dispatch(deleteDemandAction(idTD)).unwrap();
      toast.push(
        <Notification
          title="Deleted"
          type="success"
        >{`${name} deleted.`}</Notification>
      );
      fetchData();
      setCurrentSelectedItems((prev) =>
        prev.filter((i) => i.id !== itemToDeleteConfirm.id)
      );
    } catch (e: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger">
          {e?.message || `Failed to delete.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDeleteConfirm(null);
    }
  }, [dispatch, itemToDeleteConfirm, fetchData, setCurrentSelectedItems]);

  const handleDeleteSelected = useCallback(async () => {
    if (currentSelectedItems.length === 0) return;
    setIsDeleting(true);
    const offersToDel = currentSelectedItems
      .filter((i) => i.type === "Offer")
      .map((i) => Number((i.originalApiItem as ActualApiOfferShape).id));
    const demandsToDel = currentSelectedItems
      .filter((i) => i.type === "Demand")
      .map((i) => Number((i.originalApiItem as ActualApiDemandShape).id));
    const delPromises: Promise<any>[] = [];
    if (offersToDel.length > 0)
      delPromises.push(dispatch(deleteAllOffersAction(offersToDel)).unwrap());
    if (demandsToDel.length > 0)
      delPromises.push(dispatch(deleteAllDemandsAction(demandsToDel)).unwrap());
    try {
      await Promise.all(delPromises);
      toast.push(
        <Notification
          title="Bulk Delete OK"
          type="success"
        >{`${currentSelectedItems.length} items deleted.`}</Notification>
      );
      fetchData();
      setCurrentSelectedItems([]);
    } catch (e: any) {
      toast.push(
        <Notification title="Bulk Delete Failed" type="danger">
          {e?.message || "Error."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, currentSelectedItems, fetchData, setCurrentSelectedItems]);

  const handleTabChange = useCallback(
    (tabKey: string) => {
      if (tabKey === currentTab) return;
      setCurrentTab(tabKey);
      const d = filterFormSchema.parse({});
      filterFormMethods.reset(d);
      setFilterCriteria(d);
      setCurrentSelectedItems([]);
      if (tabKey === TABS.ALL) setAllTableConfig(initialTableQueries);
      else if (tabKey === TABS.OFFER) setOfferTableConfig(initialTableQueries);
      else if (tabKey === TABS.DEMAND)
        setDemandTableConfig(initialTableQueries);
    },
    [currentTab, filterFormMethods, setCurrentSelectedItems]
  );

  const handleOpenExportReasonModal = useCallback(async () => {
    const totalO = offersStoreData?.total ?? 0;
    const totalD = demandsStoreData?.total ?? 0;
    let exportable = false;
    if (currentTab === TABS.OFFER) exportable = totalO > 0;
    else if (currentTab === TABS.DEMAND) exportable = totalD > 0;
    else exportable = totalO + totalD > 0;
    if (
      !exportable &&
      !(
        filterCriteria.creatorIds?.length ||
        filterCriteria.assigneeIds?.length ||
        filterCriteria.createdDateRange?.[0] ||
        filterCriteria.updatedDateRange?.[0] ||
        currentTableConfig.query
      )
    ) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export based on current view.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  }, [
    offersStoreData,
    demandsStoreData,
    currentTab,
    exportReasonFormMethods,
    filterCriteria,
    currentTableConfig.query,
  ]);

  const handleConfirmExportWithReason = useCallback(
    async (data: ExportReasonFormData) => {
      setIsSubmittingExportReason(true);
      setDataForExportLoading(true);
      const moduleName = "Offers & Demands";
      const date = dayjs().format("YYYYMMDD");
      const filename = `offers_demands_export_${date}.csv`;
      try {
        await dispatch(
          submitExportReasonAction({
            reason: data.reason,
            module: moduleName,
            file_name: filename,
          })
        ).unwrap();
      } catch (e) {
        /* Optional: log reason submission error */
      }
      const exportParams = prepareApiParams(
        currentTableConfig,
        filterCriteria,
        true
      ); // true for export
      let allOffersForExport: ActualApiOfferShape[] = [];
      let allDemandsForExport: ActualApiDemandShape[] = [];
      try {
        if (
          currentTab === TABS.OFFER ||
          (currentTab === TABS.ALL &&
            (!filterCriteria.itemType || filterCriteria.itemType === "Offer"))
        ) {
          const offerRes = await dispatch(
            getOffersAction(exportParams)
          ).unwrap();
          allOffersForExport = offerRes?.data || [];
        }
        if (
          currentTab === TABS.DEMAND ||
          (currentTab === TABS.ALL &&
            (!filterCriteria.itemType || filterCriteria.itemType === "Demand"))
        ) {
          const demandRes = await dispatch(
            getDemandsAction(exportParams)
          ).unwrap();
          allDemandsForExport = demandRes?.data || [];
        }
        const transformedO = allOffersForExport.map(transformApiOffer);
        const transformedD = allDemandsForExport.map(transformApiDemand);
        let dataToExport: OfferDemandItem[] = [];
        if (currentTab === TABS.OFFER) dataToExport = transformedO;
        else if (currentTab === TABS.DEMAND) dataToExport = transformedD;
        else {
          if (!filterCriteria.itemType || filterCriteria.itemType === "Offer")
            dataToExport.push(...transformedO);
          if (!filterCriteria.itemType || filterCriteria.itemType === "Demand")
            dataToExport.push(...transformedD);
        }
        const success = exportToCsvOffersDemands(filename, dataToExport);
        if (success)
          toast.push(
            <Notification title="Export OK" type="success">
              Data exported.
            </Notification>
          );
      } catch (err) {
        toast.push(
          <Notification title="Export Failed" type="danger">
            Could not fetch all data.
          </Notification>
        );
      } finally {
        setIsSubmittingExportReason(false);
        setIsExportReasonModalOpen(false);
        setDataForExportLoading(false);
        fetchData();
      }
    },
    [
      dispatch,
      filterCriteria,
      currentTableConfig,
      currentTab,
      fetchData,
      prepareApiParams,
    ]
  );

  const handleCopy = useCallback((text: string, successMessage: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.push(
        <Notification title={successMessage} type="success" duration={2500} />
      );
    });
  }, []);

  const columns: ColumnDef<OfferDemandItem>[] = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        enableSorting: true,
        size: 70,
        cell: (props: CellContext<OfferDemandItem, any>) => (
          <span className="font-semibold text-xs">
            {props.row.original.originalApiItem.id}
          </span>
        ),
      },
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        size: 180,
        cell: (props: CellContext<OfferDemandItem, any>) => (
          <div>
            <div className="font-semibold">{props.row.original.name}</div>
            {(props.row.original.numberOfBuyers !== undefined ||
              props.row.original.numberOfSellers !== undefined) && (
                <>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Buyers: {props.row.original.numberOfBuyers ?? "N/A"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Sellers: {props.row.original.numberOfSellers ?? "N/A"}
                  </div>
                </>
              )}
          </div>
        ),
      },
      {
        header: "Section Details",
        id: "sectionDetails",
        size: 220,
        cell: ({ row }: CellContext<OfferDemandItem, any>) => {
          const { groups } = row.original;
          if (!groups || groups.length === 0) {
            return (
              <span className="text-xs text-gray-500">No group details</span>
            );
          }
          return (
            <div className="space-y-1">
              {groups.map((group, index) => {
                const isSpecialGroup =
                  group.groupName === "Group A" ||
                  group.groupName === "Group B";
                if (isSpecialGroup && group.items?.[0]) {
                  const fullText = group.items[0];
                  const messageToCopy = `Offer ID: ${row.original.originalApiItem.id}\nOffer Name: ${row.original.name}\n\nMessage:\n${fullText}`;
                  return (
                    <div
                      key={index}
                      role="button"
                      className="group p-1 -m-1 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() =>
                        handleCopy(
                          messageToCopy,
                          `${group.groupName} details copied!`
                        )
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-grow text-xs">
                          <b className="text-gray-700 dark:text-gray-200">
                            {group.groupName}:{" "}
                          </b>
                          <Tooltip title={fullText}>
                            <p className="line-clamp-2 pl-2 text-gray-600 dark:text-gray-400">
                              {fullText}
                            </p>
                          </Tooltip>
                        </div>
                        <TbCopy className="text-gray-400 group-hover:text-indigo-500 ml-2 mt-0.5 flex-shrink-0" />
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={index} className="text-xs">
                    <b className="text-gray-700 dark:text-gray-200">
                      {group.groupName}:{" "}
                    </b>
                    <div className="pl-2 flex flex-col gap-0.5 text-gray-600 dark:text-gray-400">
                      {group.items.slice(0, 3).map((item, itemIdx) => (
                        <span key={itemIdx}>{item}</span>
                      ))}
                      {group.items.length > 3 && (
                        <span className="italic">
                          ...and {group.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        },
      },
      {
        header: "Created By / Assigned",
        accessorKey: "createdByInfo.userName",
        id: "createdBy",
        enableSorting: true,
        size: 180,
        cell: (props: CellContext<OfferDemandItem, any>) => {
          const item = props.row.original;
          const fCD = dayjs(item.createdDate).format("D MMM YYYY, h:mm A");
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Avatar size={28} shape="circle" icon={<TbUserCircle />} />
                <span className="font-semibold">
                  {item.createdByInfo.userName}
                </span>
              </div>
              {item.assignedToInfo && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  <b>Assigned: </b> {item.assignedToInfo.userName}
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                <span>{fCD}</span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center" },
        size: 120,
        cell: (props: CellContext<OfferDemandItem, any>) => (
          <ActionColumn
            rowData={props.row.original}
            onEdit={() => handleEdit(props.row.original)}
            onView={() => handleOpenModal("viewDetails", props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onOpenModal={handleOpenModal}
          />
        ),
      },
    ],
    [handleEdit, handleDeleteClick, handleOpenModal, openImageViewer, handleCopy]
  );

  const [filteredColumns, setFilteredColumns] =
    useState<ColumnDef<OfferDemandItem>[]>(columns);
  useEffect(() => {
    setFilteredColumns(columns);
  }, [columns]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.itemType) count++;
    if (filterCriteria.creatorIds?.length) count++;
    if (filterCriteria.assigneeIds?.length) count++;
    if (
      filterCriteria.createdDateRange?.[0] ||
      filterCriteria.createdDateRange?.[1]
    )
      count++;
    if (
      filterCriteria.updatedDateRange?.[0] ||
      filterCriteria.updatedDateRange?.[1]
    )
      count++;
    if (filterCriteria.quickFilters) count++;
    return count;
  }, [filterCriteria]);

  const isLoadingO = offersStatus === "loading";
  const isLoadingD = demandsStatus === "loading";
  let isOverallLoading = false;
  if (currentTab === TABS.OFFER) isOverallLoading = isLoadingO;
  else if (currentTab === TABS.DEMAND) isOverallLoading = isLoadingD;
  else isOverallLoading = isLoadingO || isLoadingD;

  const itemTypeOptions = [
    { value: "Offer" as const, label: "Offer" },
    { value: "Demand" as const, label: "Demand" },
  ];
  const cardClass =
    "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  const renderCardContent = (content: number | undefined, colorClass: string) => {
    if (initialLoading) {
      return <Skeleton width={40} height={24} />;
    }
    return <h6 className={colorClass}>{content ?? 0}</h6>;
  };

  const skeletonColumns: ColumnDef<OfferDemandItem>[] = useMemo(() =>
    columns.map((column) => ({
      ...column,
      cell: () => <Skeleton height={48} className="my-2" />,
    })),
    [columns]);

  const skeletonData = useMemo(() =>
    Array.from({ length: currentTableConfig.pageSize as number }, (_, i) => ({ id: `skeleton-${i}` }) as any),
    [currentTableConfig.pageSize]);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4">
            <h5 className="mb-4 lg:mb-0">Offers & Demands</h5>
            <div className="flex flex-col md:flex-row gap-2">
              <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={() => navigate("/sales-leads/offers/create")}
                block
                disabled={initialLoading}
              >
                Add Offer
              </Button>
              <Button
                icon={<TbPlus />}
                variant="solid"
                onClick={() => navigate("/sales-leads/demands/create")}
                block
                disabled={initialLoading}
              >
                Add Demand
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <Tooltip title="Click to show all items">
              <div onClick={onClearFilters}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbListDetails size={24} /></div>
                  <div>{renderCardContent(offerDemandCounts?.total, "text-blue-500")}<span className="font-semibold text-xs">Total</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show only offers">
              <div onClick={() => handleCardClick("item", "Offer")}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-300")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbArrowUpRight size={24} /></div>
                  <div>{renderCardContent(offerDemandCounts?.offers, "text-green-500")}<span className="font-semibold text-xs">Offers</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show only demands">
              <div onClick={() => handleCardClick("item", "Demand")}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbArrowDownLeft size={24} /></div>
                  <div>{renderCardContent(offerDemandCounts?.demands, "text-violet-500")}<span className="font-semibold text-xs">Demands</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show items created today">
              <div onClick={() => handleCardClick("item", "Today")}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-amber-300")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-amber-100 text-amber-500"><TbClockHour4 size={24} /></div>
                  <div>{renderCardContent(offerDemandCounts?.today, "text-amber-500")}<span className="font-semibold text-xs">Today</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show offers created today">
              <div onClick={() => handleCardClick("item", "Today")}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-teal-200")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-teal-100 text-teal-500"><TbCalendarUp size={24} /></div>
                  <div>{renderCardContent(offerDemandCounts?.today_offers, "text-teal-500")}<span className="font-semibold text-xs">Today Offers</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show demands created today">
              <div onClick={() => handleCardClick("item", "Today")}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-rose-200")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-rose-100 text-rose-500"><TbCalendarDown size={24} /></div>
                  <div>{renderCardContent(offerDemandCounts?.today_demands, "text-rose-500")}<span className="font-semibold text-xs">Today Demands</span></div>
                </Card>
              </div>
            </Tooltip>
          </div>
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[TABS.ALL, TABS.OFFER, TABS.DEMAND].map((tabKey) => (
                <button
                  key={tabKey}
                  onClick={() => handleTabChange(tabKey)}
                  className={classNames(
                    "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize",
                    currentTab === tabKey
                      ? "border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600"
                  )}
                  disabled={initialLoading}
                >
                  {tabKey === TABS.ALL ? "All Items" : `${tabKey} Listing`}
                </button>
              ))}
            </nav>
          </div>
          <div className="mb-4">
            <ItemTableTools
              onSearchChange={handleSearchChange}
              onExport={handleOpenExportReasonModal}
              searchQuery={currentTableConfig.query}
              onOpenFilter={openFilterDrawer}
              onClearFilters={onClearFilters}
              activeFilterCount={activeFilterCount}
              columns={columns}
              filteredColumns={filteredColumns}
              setFilteredColumns={setFilteredColumns}
            />
          </div>
          <ActiveFiltersDisplay
            filterData={filterCriteria}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={onClearFilters}
            allUsers={getAllUserData || []}
          />
          <div className="flex-grow overflow-auto">
            {initialLoading ? (
              <ItemTable
                columns={skeletonColumns}
                data={skeletonData}
                loading={false}
                pagingData={{
                  total: currentTableConfig.pageSize as number,
                  pageIndex: 1,
                  pageSize: currentTableConfig.pageSize as number,
                }}
                selectable={false}
                onPaginationChange={() => { }}
                onSelectChange={() => { }}
                onSort={() => { }}
              />
            ) : (
              <ItemTable
                columns={filteredColumns}
                data={pageData}
                loading={isOverallLoading || dataForExportLoading}
                pagingData={{
                  total: totalItems,
                  pageIndex: currentTableConfig.pageIndex as number,
                  pageSize: currentTableConfig.pageSize as number,
                }}
                selectedItems={currentSelectedItems}
                onPaginationChange={handlePaginationChange}
                onSelectChange={handlePageSizeChange}
                onSort={handleSort}
                onRowSelect={handleRowSelect}
                onAllRowSelect={handleAllRowSelect}
              />
            )}
          </div>
        </AdaptiveCard>
        <ItemSelected
          selectedItems={currentSelectedItems}
          onDeleteSelected={handleDeleteSelected}
          activeTab={currentTab}
          isDeleting={isDeleting}
        />
        <ConfirmDialog
          isOpen={!!itemToDeleteConfirm}
          type="danger"
          title={`Delete ${itemToDeleteConfirm?.type || "Item"}`}
          onClose={() => setItemToDeleteConfirm(null)}
          onRequestClose={() => setItemToDeleteConfirm(null)}
          onCancel={() => setItemToDeleteConfirm(null)}
          onConfirm={onConfirmDelete}
          loading={isDeleting}
        >
          <p>
            Delete "<strong>{itemToDeleteConfirm?.name}</strong>"? Cannot be
            undone.
          </p>
        </ConfirmDialog>
      </Container>
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
        loading={isSubmittingExportReason || dataForExportLoading}
        confirmText={
          isSubmittingExportReason
            ? "Submitting..."
            : dataForExportLoading
              ? "Fetching..."
              : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason ||
            dataForExportLoading,
        }}
      >
        <Form
          id="exportReasonForm"
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Reason for exporting:"
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
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button size="sm" onClick={onClearFilters}>
              Clear All
            </Button>
            <Button size="sm" variant="solid" form="filterForm" type="submit">
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-y-6 h-full overflow-y-auto"
        >
          {currentTab === TABS.ALL && (
            <FormItem label="Type">
              <Controller
                name="itemType"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <Select
                    placeholder="Filter by Offer/Demand"
                    options={itemTypeOptions}
                    value={itemTypeOptions.find(
                      (opt) => opt.value === field.value
                    )}
                    onChange={(option: any) =>
                      field.onChange(option?.value || null)
                    }
                    isClearable
                  />
                )}
              />
            </FormItem>
          )}
          <FormItem label="Created By">
            <Controller
              name="creatorIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Filter by Creator"
                  options={getAllUserDataOptions}
                  value={getAllUserDataOptions.filter((opt) =>
                    field.value?.includes(opt.value)
                  )}
                  onChange={(options: any) =>
                    field.onChange(options?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </FormItem>
          {/* <FormItem label="Assigned To">
            <Controller
              name="assigneeIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Filter by Assignee"
                  options={getAllUserDataOptions}
                  value={getAllUserDataOptions.filter((opt) =>
                    field.value?.includes(opt.value)
                  )}
                  onChange={(options: any) =>
                    field.onChange(options?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </FormItem> */}
          <FormItem label="Created Date">
            <Controller
              name="createdDateRange"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePicker.DatePickerRange
                  value={field.value as any}
                  onChange={field.onChange}
                  placeholder="Start - End"
                  inputFormat="DD MMM YYYY"
                />
              )}
            />
          </FormItem>
          {/* <FormItem label="Updated Date">
            <Controller
              name="updatedDateRange"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePicker.DatePickerRange
                  value={field.value as any}
                  onChange={field.onChange}
                  placeholder="Start - End"
                  inputFormat="DD MMM YYYY"
                />
              )}
            />
          </FormItem> */}
        </Form>
      </Drawer>
      <OfferDemandModals
        modalState={modalState}
        onClose={handleCloseModal}
        getAllUserDataOptions={getAllUserDataOptions}
      />
      <Dialog
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        onRequestClose={closeImageViewer}
        width={600}
      >
        <div className="flex justify-center items-center p-4">
          {imageView ? (
            <img
              src={imageView}
              alt="User"
              className="max-w-full max-h-[80vh]"
            />
          ) : (
            <p>No image.</p>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default OffersDemands;