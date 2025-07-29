
import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import cloneDeep from "lodash/cloneDeep";
import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import dayjs from "dayjs"; // Import dayjs

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput";
import { RichTextEditor } from "@/components/shared";
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
  Select as UiSelect,
  Skeleton, // ADDED
  Tag,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import {
  TbBell,
  TbBox,
  TbBrandProducthunt,
  TbBrandWhatsapp,
  TbCalendarEvent,
  TbCancel,
  TbCheck,
  TbCircleCheck,
  TbCircleX,
  TbClipboardText,
  TbCloudDownload,
  TbCloudUpload,
  TbColumns,
  TbDotsVertical,
  TbEye,
  TbFileSpreadsheet,
  TbFileText,
  TbFilter,
  TbInfoCircle,
  TbMail,
  TbMailForward,
  TbPencil,
  TbPhoto,
  TbPlus,
  TbProgress,
  TbRefresh,
  TbReload,
  TbSearch,
  TbSettings,
  TbSwitchHorizontal,
  TbTagStarred,
  TbTrash,
  TbUser,
  TbX,
} from "react-icons/tb";

// Types
import type {
  CellContext,
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { authSelector } from "@/reduxtool/auth/authSlice";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addProductAction,
  addNotificationAction,
  addScheduleAction, // Added
  addTaskAction, // Added
  addAllActionAction, // Added
  changeProductStatusAction,
  deleteAllProductsAction,
  deleteProductAction,
  editProductAction,
  getAllUsersAction,
  getBrandAction,
  getParentCategoriesAction,
  getCountriesAction,
  getDomainsAction,
  getProductslistingAction, // MODIFIED: Assuming this is your action name
  getSubcategoriesByCategoryIdAction,
  getUnitAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "localforage";

// --- Type Definitions ---
// ... (existing type definitions are correct)
type ApiProductItem = {
  id: number;
  category_id: string | number | null;
  sub_category_id: string | number | null;
  brand_id: string | number | null;
  sku_code: string | null;
  name: string;
  unit_id: string | number | null;
  country_id: string | number | null;
  color: string | null;
  hsn_code: string | null;
  shelf_life: string | null;
  packaging_size: string | null;
  packaging_type: string | null;
  tax_rate: string | number | null;
  procurement_lead_time: string | null;
  slug: string;
  description: string | null;
  short_description: string | null;
  payment_term: string | null;
  delivery_details: string | null;
  thumb_image: string | null;
  icon: string | null;
  product_images: string | null;
  status: "Active" | "Inactive" | "Pending" | "Draft" | "Rejected";
  licence: string | null;
  currency_id: string | number | null;
  product_specification: string | null;
  meta_title: string | null;
  meta_descr: string | null;
  meta_keyword: string | null;
  domain_ids: string | null;
  created_at: string;
  updated_at: string;
  icon_full_path?: string;
  thumb_image_full_path?: string;
  supplier_product_code: string | null; // New field
  product_keywords: string | null; // New field
  product_images_array?: {
    id?: number;
    image: string;
    image_full_path: string;
  }[];
  category?: { id: number; name: string } | null;
  sub_category?: { id: number; name: string } | null;
  brand?: { id: number; name: string } | null;
  unit_obj?: { id: number; name: string } | null;
  country_obj?: { id: number; name: string } | null;
};
export type ProductStatus =
  | "active"
  | "inactive"
  | "pending"
  | "draft"
  | "rejected";
export type ProductGalleryImageItem = {
  id?: number;
  file?: File;
  previewUrl: string;
  serverPath?: string;
  isNew?: boolean;
  isDeleted?: boolean;
};
export type ProductItem = {
  id: number;
  name: string;
  email: string | null;
  contactNumber: string | null;
  contactNumberCode: string | null;
  slug: string;
  skuCode: string | null;
  status: ProductStatus;
  categoryId: number | null;
  categoryName?: string;
  subCategoryId: number | null;
  subCategoryName?: string;
  brandId: number | null;
  brandName?: string;
  unitId: number | null;
  unitName?: string;
  countryId: number | null;
  countryName?: string;
  domainIds: number[];
  // domainNames?: string[];
  color: string | null;
  hsnCode: string | null;
  shelfLife: string | null;
  packagingSize: string | null;
  packagingType: string | null;
  taxRate: string | number | null;
  procurementLeadTime: string | null;
  description: string | null;
  shortDescription: string | null;
  paymentTerm: string | null;
  deliveryDetails: string | null;
  productSpecification: string | null;
  icon: string | null;
  iconFullPath: string | null;
  thumbImage: string | null;
  thumbImageFullPath: string | null;
  productImages: ProductGalleryImageItem[];
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeyword: string | null;
  createdAt: string;
  updatedAt: string;
  subject: string | null;
  type: string | null;
  supplierProductCode: string | null; // New field
  productKeywords: string | null; // New field
};
type ImportType = "products" | "keywords";
type ExportType = "products" | "keywords";

// ============================================================================
// --- MODALS SECTION ---
// ============================================================================

export type ProductsModalType =
  | "email"
  | "whatsapp"
  | "notification"
  | "task"
  | "calendar"
  | "active";
export interface ProductsModalState {
  isOpen: boolean;
  type: ProductsModalType | null;
  data: ProductItem | null;
}
interface ProductsModalsProps {
  modalState: ProductsModalState;
  onClose: () => void;
  getAllUserDataOptions: { value: any; label: string }[];
}

// --- MODAL FORM SCHEMAS (NEW) ---
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

// --- MODAL CONSTANTS ---
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

// --- MODAL DIALOG COMPONENTS (NEW/REFINED) ---
const SendEmailDialog: React.FC<{ item: ProductItem; onClose: () => void }> = ({
  item,
  onClose,
}) => {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      subject: `Re: ${item.subject || `Inquiry for Product: ${item.name}`}`,
      message: "",
    },
  });
  const onSendEmail = (data: { subject: string; message: string }) => {
    if (!item.email) {
      toast.push(
        <Notification type="warning" title="No Email Address">
          This product does not have an associated email address.
        </Notification>
      );
      return;
    }
    const mailtoLink = `mailto:${item.email}?subject=${encodeURIComponent(
      data.subject
    )}&body=${encodeURIComponent(data.message.replace(/<[^>]*>?/gm, ""))}`; // Strip HTML for body
    window.open(mailtoLink, "_self");
    toast.push(<Notification type="success" title="Opening Email Client" />);
    onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send Email about {item.name}</h5>
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
          <Button variant="solid" type="submit">
            Open Email Client
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

const AddNotificationDialog: React.FC<{
  item: ProductItem;
  onClose: () => void;
  userOptions: { value: any; label: string }[];
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
      notification_title: `Regarding Product: ${item.name}`,
      send_users: [],
      message: `This is a notification for the product: "${item.name}".`,
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
              <UiSelect
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
  item: ProductItem;
  onClose: () => void;
  userOptions: { value: any; label: string }[];
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
      task_title: `Follow up on Product: ${item.name}`,
      assign_to: [],
      priority: "Medium",
      due_date: null,
      description: `Follow up regarding product: ${item.name} (ID: ${item.id})`,
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
                <UiSelect
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
                <UiSelect
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
  item: ProductItem;
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
      event_title: `Regarding Product: ${item.name}`,
      event_type: undefined,
      date_time: null as any,
      remind_from: null,
      notes: `Details for product "${item.name}" (ID: ${item.id}).`,
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
  item: ProductItem;
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
    defaultValues: { item: `Checked product: ${item.name}`, notes: "" },
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
              <Input {...field} placeholder="e.g., Followed up with supplier" />
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

// --- CENTRAL MODAL MANAGER (NEW) ---
const ProductsModals: React.FC<ProductsModalsProps> = ({
  modalState,
  onClose,
  getAllUserDataOptions,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useSelector(authSelector);

  const { useEncryptApplicationStorage } = config;

  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const { type, data: item, isOpen } = modalState;
  const [userData, setuserData] = useState<any>(null);
  useEffect(() => {
    const getUserData = () => {
      try {
        return encryptStorage.getItem("UserData", !useEncryptApplicationStorage);
      } catch (error) {
        console.error("Error getting UserData:", error);
        return null;
      }
    };
    setuserData(getUserData());
  }, []);


  if (!isOpen || !item) return null;

  const handleConfirmNotification = async (formData: NotificationFormData) => {
    if (!item) return;
    setIsSubmittingAction(true);
    const payload = {
      send_users: formData.send_users,
      notification_title: formData.notification_title,
      message: formData.message,
      module_id: String(item.id),
      module_name: "Product",
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
        module_id: String(item.id),
        module_name: "Product",
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
      module_id: item.id,
      module_name: "Product",
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
      module_id: String(item.id),
      module_name: "Product",
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
      case "email":
        return <SendEmailDialog item={item} onClose={onClose} />;
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
      default:
        return null;
    }
  };
  return <>{renderModalContent()}</>;
};

// ... (Rest of the file remains the same)
// --- Form & Filter Schemas ---
const productFormSchema = z.object({
  // Re-ordered and updated based on new requirements
  status: z.enum(["Active", "Inactive", "Pending", "Draft", "Rejected"]),
  category_id: z
    .number({ invalid_type_error: "Category is required." })
    .positive("Category is required.")
    .nullable(),
  sub_category_id: z.number().positive().nullable().optional(),
  brand_id: z.number().nullable().optional(),
  name: z.string().min(1, "Product name is required.").max(255),
  slug: z.string().min(1, "Slug is required.").max(255),
  sku_code: z.string().max(50).optional().nullable(),
  hsn_code: z.string().max(50).optional().nullable(),
  supplier_product_code: z.string().max(100).optional().nullable(), // New field
  country_id: z.number().nullable().optional(),
  unit_id: z
    .number({ invalid_type_error: "Unit is required." })
    .positive("Unit is required.")
    .nullable(),
  color: z.string().max(50).optional().nullable(),
  shelf_life: z.string().max(50).optional().nullable(),
  packaging_type: z.string().max(100).optional().nullable(),
  packaging_size: z.string().max(100).optional().nullable(),
  tax_rate: z
    .string()
    .max(20)
    .refine((val) => !val || val.trim() === "" || !isNaN(parseFloat(val)), {
      message: "Tax rate must be a number",
    })
    .optional()
    .nullable(),
  procurement_lead_time: z.string().max(50).optional().nullable(),
  product_keywords: z.string().min(1, "Product keywords are required.").max(500), // New mandatory field

  // Media (handled via custom validation)
  thumb_image_input: z
    .union([z.instanceof(File), z.null()])
    .optional()
    .nullable(),

  // Other fields
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  payment_term: z.string().optional().nullable(),
  delivery_details: z.string().optional().nullable(),
  product_specification: z.string().optional().nullable(),
  meta_title: z.string().max(255).optional().nullable(),
  meta_descr: z.string().max(500).optional().nullable(),
  meta_keyword: z.string().max(255).optional().nullable(),
});
type ProductFormData = z.infer<typeof productFormSchema>;

const filterFormSchema = z.object({
  filterNameOrSku: z.string().optional(),
  filterCategoryIds: z.array(z.number()).optional(),
  filterSubCategoryIds: z.array(z.number()).optional(),
  filterBrandIds: z.array(z.number()).optional(),
  filterStatuses: z
    .array(z.enum(["active", "inactive", "pending", "draft", "rejected"]))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Constants ---
const PRODUCT_THUMB_IMAGE_BASE_URL =
  import.meta.env.VITE_API_URL_STORAGE || "/storage/product_thumbs/";
const PRODUCT_IMAGES_BASE_URL =
  import.meta.env.VITE_API_URL_STORAGE || "/storage/product_gallery/";
const TABS = { ALL: "all", PENDING: "pending" };
const FORM_TABS = {
  GENERAL: "general",
  DESCRIPTION: "description",
  MEDIA: "media",
  META: "meta",
};
const productStatusColor: Record<ProductStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  inactive:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-100", // Changed Inactive to Slate
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
  draft:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100", // Changed Draft to Violet
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
};
const uiProductStatusOptions: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
  { value: "rejected", label: "Rejected" },
];
const apiProductStatusOptions: {
  value: "Active" | "Inactive" | "Pending" | "Draft" | "Rejected";
  label: string;
}[] = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Pending", label: "Pending" },
    { value: "Draft", label: "Draft" },
    { value: "Rejected", label: "Rejected" },
  ];

// --- CSV Exporter Logic ---
const downloadCsv = (filename: string, csvContent: string) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
    toast.push(<Notification title="Export Successful" type="success" />);
  } else {
    toast.push(<Notification title="Export Failed" type="danger" />);
  }
};
function exportProductsToCsv(rows: ProductItem[]) {
  const CSV_HEADERS = [
    "ID",
    "Name",
    "Slug",
    "SKU",
    "Status",
    "Category",
    "Sub-Category",
    "Brand",
    "Unit",
    "Country",
    "Color",
    "HSN Code",
    "Tax Rate",
    "Short Description",
    "Description",
    "Created At",
    "Updated At",
  ];
  const csvContent = [
    CSV_HEADERS.join(","),
    ...rows.map((row) =>
      [
        row.id,
        row.name,
        row.slug,
        row.skuCode,
        row.status,
        row.categoryName,
        row.subCategoryName,
        row.brandName,
        row.unitName,
        row.countryName,
        row.color,
        row.hsnCode,
        row.taxRate,
        row.shortDescription,
        row.description,
        new Date(row.createdAt).toLocaleString(),
        new Date(row.updatedAt).toLocaleString(),
      ]
        .map((value) => {
          const strValue = String(value ?? "").replace(/"/g, '""');
          return `"${strValue}"`;
        })
        .join(",")
    ),
  ].join("\n");
  downloadCsv(
    `products-export_${new Date().toISOString().split("T")[0]}.csv`,
    csvContent
  );
}
function exportKeywordsToCsv(rows: ProductItem[]) {
  const CSV_HEADERS = ["ID", "Name", "SKU", "Meta Keywords"];
  const csvContent = [
    CSV_HEADERS.join(","),
    ...rows.map((row) =>
      [row.id, row.name, row.skuCode, row.metaKeyword]
        .map((value) => {
          const strValue = String(value ?? "").replace(/"/g, '""');
          return `"${strValue}"`;
        })
        .join(",")
    ),
  ].join("\n");
  downloadCsv(
    `product-keywords-export_${new Date().toISOString().split("T")[0]}.csv`,
    csvContent
  );
}

// --- Helper and Memoized Components ---
const ActionColumn = React.memo(
  ({
    onEdit,
    rowData,
    onViewDetail,
    onDelete,
    onChangeStatus,
    onOpenModal,
  }: {
    onEdit: () => void;
    rowData: ProductItem;
    onViewDetail: () => void;
    onDelete: () => void;
    onChangeStatus: () => void;
    onOpenModal: (type: ProductsModalType, data: ProductItem) => void;
  }) => (
    <div className="flex items-center justify-center">
      <Tooltip title="View">
        <div
          className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Dropdown
        placement="bottom-end"
        renderTitle={
          <Tooltip title="More">
            <div className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
              <TbDotsVertical />
            </div>
          </Tooltip>
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
          <span className="text-xs">Send Whatsapp</span>
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
          <span className="text-xs">Add Schedule</span>
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => onOpenModal("active", rowData)}
          className="flex items-center gap-2"
        >
          <TbTagStarred size={18} /> <span className="text-xs">Add Active</span>
        </Dropdown.Item>
      </Dropdown>
    </div>
  )
);
const ProductSearch = React.memo(
  React.forwardRef<
    HTMLInputElement,
    { onInputChange: (value: string) => void }
  >(({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  ))
);
ProductSearch.displayName = "ProductSearch";

const ProductTableTools = ({
  onSearchChange,
  onFilter,
  onClearFilters,
  columns,
  filteredColumns,
  setFilteredColumns,
  activeFilterCount,
  isDataReady, // ADDED
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<ProductItem>[];
  filteredColumns: ColumnDef<ProductItem>[];
  setFilteredColumns: React.Dispatch<
    React.SetStateAction<ColumnDef<ProductItem>[]>
  >;
  activeFilterCount: number;
  isDataReady: boolean; // ADDED
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
        <ProductSearch onInputChange={onSearchChange} />
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
          disabled={!isDataReady} // ADDED
        ></Button>
        <Button
          icon={<TbFilter />}
          onClick={onFilter}
          className="w-full sm:w-auto"
          disabled={!isDataReady} // ADDED
        >
          Filter{" "}
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
  categoryOptions,
  brandOptions,
}: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData, value: any) => void;
  onClearAll: () => void;
  categoryOptions: { value: number; label: string }[];
  brandOptions: { value: number; label: string }[];
}) => {
  const { filterNameOrSku, filterCategoryIds, filterBrandIds, filterStatuses } =
    filterData;
  if (
    !filterNameOrSku &&
    !filterCategoryIds?.length &&
    !filterBrandIds?.length &&
    !filterStatuses?.length
  )
    return null;

  return (
    <div className="flex flex-wrap items-center gap-2 my-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {filterNameOrSku && (
        <Tag prefix>
          Search: {filterNameOrSku}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("filterNameOrSku", filterNameOrSku)}
          />
        </Tag>
      )}
      {filterCategoryIds?.map((id) => (
        <Tag key={`cat-${id}`} prefix>
          Category: {categoryOptions.find((o) => o.value === id)?.label || id}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("filterCategoryIds", id)}
          />
        </Tag>
      ))}
      {filterBrandIds?.map((id) => (
        <Tag key={`brand-${id}`} prefix>
          Brand: {brandOptions.find((o) => o.value === id)?.label || id}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("filterBrandIds", id)}
          />
        </Tag>
      ))}
      {filterStatuses?.map((status) => (
        <Tag key={`status-${status}`} prefix className="capitalize">
          Status: {status}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter("filterStatuses", status)}
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

const ProductSelectedFooter = React.memo(
  ({
    selectedItems,
    onDeleteSelected,
  }: {
    selectedItems: ProductItem[];
    onDeleteSelected: () => void;
  }) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (selectedItems.length === 0) return null;
    return (
      <>
        <StickyFooter
          className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
          stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
        >
          <div className="flex items-center justify-between w-full px-4 sm:px-8">
            <span className="flex items-center gap-2">
              <span className="text-lg text-primary-600 dark:text-primary-400">
                <TbChecks />
              </span>
              <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
                <span className="heading-text">{selectedItems.length}</span>
                <span>
                  Product{selectedItems.length > 1 ? "s" : ""} selected
                </span>
              </span>
            </span>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="plain"
                className="text-red-600 hover:text-red-500"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        </StickyFooter>
        <ConfirmDialog
          isOpen={deleteOpen}
          type="danger"
          title={`Delete ${selectedItems.length} Product${selectedItems.length > 1 ? "s" : ""
            }`}
          onClose={() => setDeleteOpen(false)}
          onRequestClose={() => setDeleteOpen(false)}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            onDeleteSelected();
            setDeleteOpen(false);
          }}
        >
          <p>
            Are you sure you want to delete the selected product
            {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
          </p>
        </ConfirmDialog>
      </>
    );
  }
);
interface DialogDetailRowProps {
  label: string;
  value: string | React.ReactNode;
  isLink?: boolean;
  preWrap?: boolean;
  breakAll?: boolean;
  labelClassName?: string;
  valueClassName?: string;
  className?: string;
}
const DialogDetailRow: React.FC<DialogDetailRowProps> = React.memo(
  ({
    label,
    value,
    isLink,
    preWrap,
    breakAll,
    labelClassName = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
    valueClassName = "text-sm text-slate-700 dark:text-slate-100 mt-0.5",
    className = "",
  }) => (
    <div className={`py-1.5 ${className}`}>
      <p className={`${labelClassName}`}>{label}</p>
      {isLink ? (
        <a
          href={
            (typeof value === "string" &&
              (value.startsWith("http") ? value : `/${value}`)) ||
            "#"
          }
          target="_blank"
          rel="noopener noreferrer"
          className={`${valueClassName} hover:underline text-blue-600 dark:text-blue-400 ${breakAll ? "break-all" : ""
            } ${preWrap ? "whitespace-pre-wrap" : ""}`}
        >
          {value}
        </a>
      ) : (
        <div
          className={`${valueClassName} ${breakAll ? "break-all" : ""} ${preWrap ? "whitespace-pre-wrap" : ""
            }`}
        >
          {value}
        </div>
      )}
    </div>
  )
);

const Products = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // MODIFICATION: Changed selector to get ProductslistData
  const {
    ProductslistData,
    domainsData = [],
    ParentCategories: GlobalCategoriesData = [],
    subCategoriesForSelectedCategoryData = [],
    BrandData = [],
    unitData = [],
    CountriesData = [],
    getAllUserData = [],
    status: masterLoadingStatus,
  } = useSelector(masterSelector);

  const [initialLoading, setInitialLoading] = useState(true); // ADDED
  const isDataReady = !initialLoading; // ADDED

  const refreshData = useCallback(async () => { // ADDED
    setInitialLoading(true);
    try {
      await Promise.all([
        dispatch(getProductslistingAction({ page: 1, per_page: 10 })),
        dispatch(getDomainsAction()),
        dispatch(getParentCategoriesAction()),
        dispatch(getBrandAction()),
        dispatch(getUnitAction()),
        dispatch(getCountriesAction()),
        dispatch(getAllUsersAction()),
      ]);
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.push(
        <Notification title="Data Refresh Failed" type="danger">
          Could not reload data.
        </Notification>
      );
    } finally {
      setInitialLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { // ADDED
    refreshData();
  }, [refreshData]);

  const [currentListTab, setCurrentListTab] = useState<string>(TABS.ALL);
  const [currentFormTab, setCurrentFormTab] = useState<string>(
    FORM_TABS.GENERAL
  );
  const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null
  );
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);
  const [productToView, setProductToView] = useState<ProductItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const isMounted = useRef(false); // ADDED
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (isMounted.current) {
        const fetchData = () => {
          const apiParams: Record<string, any> = {
            page: tableData.pageIndex,
            per_page: tableData.pageSize,
            search: tableData.query,
            sort_key: tableData.sort.key,
            sort_order: tableData.sort.order,
            name_or_sku: filterCriteria.filterNameOrSku,
            "category_ids[]": filterCriteria.filterCategoryIds,
            "sub_category_ids[]": filterCriteria.filterSubCategoryIds,
            "brand_ids[]": filterCriteria.filterBrandIds,
            status:
              filterCriteria.filterStatuses
                ?.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                ?.join(",") || (currentListTab === TABS.PENDING ? "Pending" : ""),
          };

          const cleanedParams = Object.fromEntries(
            Object.entries(apiParams).filter(
              ([_, v]) =>
                v != null && v !== "" && (!Array.isArray(v) || v.length > 0)
            )
          );

          dispatch(getProductslistingAction(cleanedParams));
        };
        fetchData();
      } else {
        isMounted.current = true;
      }
    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, [dispatch, tableData, filterCriteria, currentListTab]);

  // --- MODAL STATE MANAGEMENT (NEW) ---
  const [modalState, setModalState] = useState<ProductsModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const handleOpenModal = useCallback(
    (type: ProductsModalType, itemData: ProductItem) => {
      if (type === "whatsapp") {
        const phone = itemData.contactNumber?.replace(/\D/g, "");
        if (!phone) {
          toast.push(
            <Notification type="danger" title="Invalid Phone Number" />
          );
          return;
        }
        const fullPhone = `${itemData.contactNumberCode?.replace(
          "+",
          ""
        )}${phone}`;
        const message = `Hi, I'm interested in your product: ${itemData.name}.`;
        const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(
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
  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, type: null, data: null });
  }, []);

  const [exportModalType, setExportModalType] = useState<ExportType | null>(
    null
  );
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [importModalType, setImportModalType] = useState<ImportType | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ProductItem[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [thumbImagePreviewUrl, setThumbImagePreviewUrl] = useState<
    string | null
  >(null);
  const [newThumbImageFile, setNewThumbImageFile] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<ProductGalleryImageItem[]>(
    []
  );

  const categoryOptions = useMemo(
    () =>
      Array.isArray(GlobalCategoriesData)
        ? GlobalCategoriesData.map((c: any) => ({ value: c.id, label: c.name }))
        : [],
    [GlobalCategoriesData]
  );
  const brandOptions = useMemo(
    () =>
      BrandData && BrandData.length > 0
        ? BrandData?.map((b: any) => ({ value: b.id, label: b.name })) || []
        : [],
    [BrandData]
  );
  const unitOptions = useMemo(
    () => unitData?.data?.map((u: any) => ({ value: u.id, label: u.name })) || [],
    [unitData?.data]
  );
  const countryOptions = useMemo(
    () =>
      Array.isArray(CountriesData)
        ? CountriesData.map((c: any) => ({ value: c.id, label: c.name }))
        : [],
    [CountriesData]
  );
  const getAllUserDataOptions = useMemo(
    () =>
      Array.isArray(getAllUserData)
        ? getAllUserData?.map((u: any) => ({ value: u.id, label: u.name })) ||
        []
        : [],
    [getAllUserData]
  );
  const [subcategoryOptions, setSubcategoryOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [isChangeStatusDialogOpen, setIsChangeStatusDialogOpen] =
    useState(false);
  const [productForStatusChange, setProductForStatusChange] =
    useState<ProductItem | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<
    ProductStatus | ""
  >("");

  const formMethods = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    mode: "onTouched",
  });
  const {
    watch: watchForm,
    setValue: setFormValue,
    reset: resetForm,
    getValues: getFormValues,
    control: formControl,
    formState: {
      errors: formErrors,
    },
  } = formMethods;
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });
  const {
    watch: watchFilter,
    reset: resetFilterForm,
    setValue: setFilterFormValue,
    getValues: getFilterValues,
    control: filterFormControl,
  } = filterFormMethods;
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  useEffect(() => {
    if (masterLoadingStatus !== "loading") {
      setSubcategoryOptions(
        subCategoriesForSelectedCategoryData?.map((sc: any) => ({
          value: sc.id,
          label: sc.name,
        })) || []
      );
    }
  }, [subCategoriesForSelectedCategoryData, masterLoadingStatus]);
  const watchedFormCategoryId = watchForm("category_id");
  const isInitializingFormRef = useRef(false);
  useEffect(() => {
    const currentSubCatIdInForm = getFormValues("sub_category_id");
    if (
      watchedFormCategoryId &&
      typeof watchedFormCategoryId === "number" &&
      watchedFormCategoryId > 0
    ) {
      if (!isInitializingFormRef.current) {
        dispatch(getSubcategoriesByCategoryIdAction(watchedFormCategoryId));
        if (
          currentSubCatIdInForm !== undefined &&
          currentSubCatIdInForm !== null
        ) {
          const editingProductHasSameCategory =
            editingProduct?.categoryId === watchedFormCategoryId;
          const editingProductHasThisSubCategory =
            editingProduct?.subCategoryId === currentSubCatIdInForm;
          if (
            !editingProductHasSameCategory ||
            (editingProductHasSameCategory && !editingProductHasThisSubCategory)
          ) {
            setFormValue("sub_category_id", undefined, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }
      }
    } else if (
      !watchedFormCategoryId &&
      currentSubCatIdInForm !== undefined &&
      currentSubCatIdInForm !== null
    ) {
      if (!isInitializingFormRef.current) {
        setSubcategoryOptions([]);
        setFormValue("sub_category_id", undefined, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
  }, [
    watchedFormCategoryId,
    dispatch,
    setFormValue,
    getFormValues,
    editingProduct,
  ]);
  const watchedFilterCategoryIds = watchFilter("filterCategoryIds");
  useEffect(() => {
    if (isFilterDrawerOpen) {
      if (watchedFilterCategoryIds && watchedFilterCategoryIds.length === 1) {
        dispatch(
          getSubcategoriesByCategoryIdAction(watchedFilterCategoryIds[0])
        );
      } else {
        setSubcategoryOptions([]);
        const currentFilterSubCatIds = getFilterValues("filterSubCategoryIds");
        if (currentFilterSubCatIds && currentFilterSubCatIds.length > 0) {
          setFilterFormValue("filterSubCategoryIds", [], {
            shouldValidate: true,
          });
        }
      }
    }
  }, [
    watchedFilterCategoryIds,
    isFilterDrawerOpen,
    dispatch,
    getFilterValues,
    setFilterFormValue,
  ]);
  useEffect(() => {
    return () => {
      if (thumbImagePreviewUrl && thumbImagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(thumbImagePreviewUrl);
      }
      galleryImages.forEach((img) => {
        if (img.isNew && img.previewUrl && img.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, [thumbImagePreviewUrl, galleryImages]);

  // MODIFICATION: Destructure the new, nested API response structure
  const {
    data: paginatedData = {},
    counts: countsData = {},
  } = ProductslistData || {};

  const { data: rawProductsData = [] } = paginatedData;

  const paginationInfo = useMemo(() => ({
    total: countsData.total ,
    active: countsData.active || 0,
    inactive: countsData.inactive || 0,
    pending: countsData.pending || 0,
    rejected: countsData.rejected || 0,
    draft: countsData.draft || 0,
  }), [countsData]);

  const mappedProducts: ProductItem[] = useMemo(() => {
    if (!Array.isArray(rawProductsData)) return [];
    return rawProductsData.map((apiItem: ApiProductItem): ProductItem => {
      let iconFullPath: string | null = null;
      if (apiItem.icon_full_path) iconFullPath = apiItem.icon_full_path;
      else if (apiItem.icon)
        iconFullPath = `${PRODUCT_IMAGES_BASE_URL}${apiItem.icon}`;
      let thumbImageFullPath: string | null = null;
      if (apiItem.thumb_image_full_path)
        thumbImageFullPath = apiItem.thumb_image_full_path;
      else if (apiItem.thumb_image)
        thumbImageFullPath = `${PRODUCT_THUMB_IMAGE_BASE_URL}${apiItem.thumb_image}`;
      const parsedDomainIds = apiItem.domain_ids
        ? apiItem.domain_ids
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id))
        : [];
      const gallery: ProductGalleryImageItem[] = [];
      if (
        apiItem.product_images_array &&
        Array.isArray(apiItem.product_images_array)
      ) {
        apiItem.product_images_array.forEach((imgObj) => {
          if (imgObj && imgObj) {
            gallery.push({
              serverPath: imgObj as any,
              previewUrl: imgObj as any,
              isNew: false,
              isDeleted: false,
            });
          }
        });
      } else if (
        typeof apiItem.product_images === "string" &&
        apiItem.product_images.trim() !== ""
      ) {
        try {
          const imagesData = JSON.parse(apiItem.product_images);
          if (Array.isArray(imagesData)) {
            imagesData.forEach((imgEntry: any) => {
              if (typeof imgEntry === "string") {
                gallery.push({
                  serverPath: imgEntry,
                  previewUrl: `${PRODUCT_IMAGES_BASE_URL}${imgEntry}`,
                  isNew: false,
                  isDeleted: false,
                });
              } else if (
                typeof imgEntry === "object" &&
                imgEntry.image_full_path
              ) {
                gallery.push({
                  id: imgEntry.id,
                  serverPath: imgEntry.image,
                  previewUrl: imgEntry.image_full_path,
                  isNew: false,
                  isDeleted: false,
                });
              }
            });
          }
        } catch (e) {
          console.error(
            "Failed to parse product_images JSON string for product ID:",
            apiItem.id,
            apiItem.product_images,
            e
          );
        }
      }
      const localSubcategoryOptions =
        subCategoriesForSelectedCategoryData?.map((sc: any) => ({
          value: sc.id,
          label: sc.name,
        })) || [];
      const subCategoryNameFromOptions = localSubcategoryOptions.find(
        (sc) => sc.value === Number(apiItem.sub_category_id)
      )?.label;
      return {
        id: apiItem.id,
        name: apiItem.name,
        email: "product.support@example.com",
        contactNumber: "19876543210",
        contactNumberCode: "+1",
        subject: `Inquiry about: ${apiItem.name}`,
        type: "Product Inquiry",
        slug: apiItem.slug,
        skuCode: apiItem.sku_code,
        status: (apiItem.status?.toLowerCase() || "draft") as ProductStatus,
        categoryId: apiItem.category_id ? Number(apiItem.category_id) : null,
        categoryName:
          apiItem.category?.name ||
          categoryOptions.find((c) => c.value === Number(apiItem.category_id))
            ?.label,
        subCategoryId: apiItem.sub_category_id
          ? Number(apiItem.sub_category_id)
          : null,
        subCategoryName:
          apiItem.sub_category?.name || subCategoryNameFromOptions,
        brandId: apiItem.brand_id ? Number(apiItem.brand_id) : null,
        brandName:
          apiItem.brand?.name ||
          brandOptions.find((b) => b.value === Number(apiItem.brand_id))?.label,
        unitId: apiItem.unit_id ? Number(apiItem.unit_id) : null,
        unitName:
          apiItem.unit_obj?.name ||
          unitOptions.find((u) => u.value === Number(apiItem.unit_id))?.label,
        countryId: apiItem.country_id ? Number(apiItem.country_id) : null,
        countryName:
          apiItem.country_obj?.name ||
          countryOptions.find((c) => c.value === Number(apiItem.country_id))
            ?.label,
        domainIds: parsedDomainIds,
        color: apiItem.color,
        hsnCode: apiItem.hsn_code,
        shelfLife: apiItem.shelf_life,
        packagingSize: apiItem.packaging_size,
        packagingType: apiItem.packaging_type,
        taxRate: apiItem.tax_rate,
        procurementLeadTime: apiItem.procurement_lead_time,
        description: apiItem.description,
        shortDescription: apiItem.short_description,
        paymentTerm: apiItem.payment_term,
        deliveryDetails: apiItem.delivery_details,
        productSpecification: apiItem.product_specification,
        icon: apiItem.icon,
        iconFullPath,
        thumbImage: apiItem.thumb_image,
        thumbImageFullPath,
        productImages: gallery,
        metaTitle: apiItem.meta_title,
        metaDescription: apiItem.meta_descr,
        metaKeyword: apiItem.meta_keyword,
        supplierProductCode: apiItem.supplier_product_code, // New mapping
        productKeywords: apiItem.product_keywords, // New mapping
        createdAt: apiItem.created_at,
        updatedAt: apiItem.updated_at,
      };
    });
  }, [
    rawProductsData,
    categoryOptions,
    brandOptions,
    unitOptions,
    countryOptions,
    subCategoriesForSelectedCategoryData,
  ]);

  const pageData = mappedProducts;
  const total = paginationInfo.total;
  const allFilteredAndSortedData = mappedProducts;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterNameOrSku) count++;
    if (filterCriteria.filterCategoryIds?.length) count++;
    if (filterCriteria.filterSubCategoryIds?.length) count++;
    if (filterCriteria.filterBrandIds?.length) count++;
    if (filterCriteria.filterStatuses?.length) count++;
    return count;
  }, [filterCriteria]);

  const handleListTabChange = useCallback((tabKey: string) => {
    setCurrentListTab(tabKey);
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
    setSelectedItems([]);
  }, []);
  const handleFormTabChange = useCallback(
    (tabKey: string) => setCurrentFormTab(tabKey),
    []
  );

  const openAddDrawer = useCallback(() => {
    isInitializingFormRef.current = true;
    setEditingProduct(null);
    resetForm({
      status: "Draft",
      category_id: null,
      sub_category_id: null,
      brand_id: null,
      name: "",
      slug: "",
      sku_code: "",
      hsn_code: "",
      supplier_product_code: "",
      country_id: null,
      unit_id: null,
      color: "",
      shelf_life: "",
      packaging_type: "",
      packaging_size: "",
      tax_rate: "",
      procurement_lead_time: "",
      product_keywords: "",
      thumb_image_input: null,
      description: "",
      short_description: "",
      payment_term: "",
      delivery_details: "",
      product_specification: "",
      meta_title: "",
      meta_descr: "",
      meta_keyword: "",
    });
    setSubcategoryOptions([]);
    setCurrentFormTab(FORM_TABS.GENERAL);
    if (thumbImagePreviewUrl && thumbImagePreviewUrl.startsWith("blob:"))
      URL.revokeObjectURL(thumbImagePreviewUrl);
    setThumbImagePreviewUrl(null);
    setNewThumbImageFile(null);
    galleryImages.forEach((img) => {
      if (img.isNew && img.previewUrl && img.previewUrl.startsWith("blob:"))
        URL.revokeObjectURL(img.previewUrl);
    });
    setGalleryImages([]);
    setIsAddEditDrawerOpen(true);
    setTimeout(() => (isInitializingFormRef.current = false), 0);
  }, [resetForm, thumbImagePreviewUrl, galleryImages]);
  const openEditDrawer = useCallback(
    async (product: ProductItem) => {
      isInitializingFormRef.current = true;
      setEditingProduct(product);
      if (product.categoryId) {
        try {
          await dispatch(
            getSubcategoriesByCategoryIdAction(product.categoryId)
          ).unwrap();
        } catch (e) {
          console.error("Failed to preload subcategories for edit:", e);
        }
      } else {
        setSubcategoryOptions([]);
      }
      resetForm({
        status:
          apiProductStatusOptions.find(
            (s) => s.value.toLowerCase() === product.status
          )?.value || "Draft",
        category_id: product.categoryId,
        sub_category_id: product.subCategoryId,
        brand_id: product.brandId,
        name: product.name,
        slug: product.slug,
        sku_code: product.skuCode || "",
        hsn_code: product.hsnCode || "",
        supplier_product_code: product.supplierProductCode || "",
        country_id: product.countryId,
        unit_id: product.unitId,
        color: product.color || "",
        shelf_life: product.shelfLife || "",
        packaging_type: product.packagingType || "",
        packaging_size: product.packagingSize || "",
        tax_rate: String(product.taxRate || ""),
        procurement_lead_time: product.procurementLeadTime || "",
        product_keywords: product.productKeywords || "",
        thumb_image_input: null,
        description: product.description || "",
        short_description: product.shortDescription || "",
        payment_term: product.paymentTerm || "",
        delivery_details: product.deliveryDetails || "",
        product_specification: product.productSpecification || "",
        meta_title: product.metaTitle || "",
        meta_descr: product.metaDescription || "",
        meta_keyword: product.metaKeyword || "",
      });
      setCurrentFormTab(FORM_TABS.GENERAL);
      if (thumbImagePreviewUrl && thumbImagePreviewUrl.startsWith("blob:"))
        URL.revokeObjectURL(thumbImagePreviewUrl);
      setThumbImagePreviewUrl(product.thumbImageFullPath);
      setNewThumbImageFile(null);
      galleryImages.forEach((img) => {
        if (img.isNew && img.previewUrl && img.previewUrl.startsWith("blob:"))
          URL.revokeObjectURL(img.previewUrl);
      });
      setGalleryImages(
        product.productImages?.map((img) => ({
          ...img,
          isNew: false,
          isDeleted: false,
        })) || []
      );
      setIsAddEditDrawerOpen(true);
      setTimeout(() => (isInitializingFormRef.current = false), 0);
    },
    [resetForm, thumbImagePreviewUrl, galleryImages, dispatch]
  );
  const closeAddEditDrawer = useCallback(() => {
    setIsAddEditDrawerOpen(false);
    setEditingProduct(null);
    resetForm();
  }, [resetForm]);

  const onProductFormSubmit = useCallback(
    async (data: ProductFormData) => {
      setIsSubmittingForm(true);

      // Custom validation for thumbnail image
      if (!editingProduct && !newThumbImageFile) {
        toast.push(
          <Notification type="danger" title="Validation Error">
            Thumbnail image is required.
          </Notification>
        );
        setCurrentFormTab(FORM_TABS.MEDIA);
        setIsSubmittingForm(false);
        return;
      }
      if (editingProduct && !newThumbImageFile && !thumbImagePreviewUrl) {
        toast.push(
          <Notification type="danger" title="Validation Error">
            Thumbnail image is required.
          </Notification>
        );
        setCurrentFormTab(FORM_TABS.MEDIA);
        setIsSubmittingForm(false);
        return;
      }

      const formData = new FormData();
      if (editingProduct) formData.append("_method", "PUT");
      (Object.keys(data) as Array<keyof ProductFormData>).forEach((key) => {
        const value = data[key];
        if (key === "thumb_image_input") return;
        if (
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
        ) {
          formData.append(key, String(value));
        } else if (
          value === null &&
          [
            "category_id",
            "sub_category_id",
            "brand_id",
            "unit_id",
            "country_id",
          ].includes(key)
        ) {
          formData.append(key, "");
        }
      });
      if (newThumbImageFile) formData.append("thumb_image", newThumbImageFile);
      else if (
        editingProduct &&
        !thumbImagePreviewUrl &&
        editingProduct.thumbImage
      )
        formData.append("delete_thumb_image", "1");
      let imageIndex = 0;
      galleryImages.forEach((img) => {
        if (img.file && img.isNew && !img.isDeleted) {
          formData.append(`product_images[${imageIndex}]`, img.file);
          imageIndex++;
        } else if (img.id && img.isDeleted) {
          formData.append("deleted_image_ids[]", String(img.id));
        }
      });
      try {
        if (editingProduct) {
          await dispatch(
            editProductAction({ id: editingProduct.id, formData })
          ).unwrap();
          toast.push(
            <Notification type="success" title="Product Updated">
              Product "{data.name}" updated successfully.
            </Notification>
          );
        } else {
          await dispatch(addProductAction(formData)).unwrap();
          toast.push(
            <Notification type="success" title="Product Added">
              Product "{data.name}" added successfully.
            </Notification>
          );
        }
        closeAddEditDrawer();
        refreshData(); // MODIFIED
      } catch (error: any) {
        const errorMsg =
          error?.response?.data?.message ||
          error?.message ||
          (editingProduct
            ? "Could not update product."
            : "Could not add product.");
        toast.push(
          <Notification type="danger" title="Operation Failed">
            {errorMsg}
          </Notification>
        );
        if (error?.response?.data?.errors)
          console.error(
            "Backend validation errors:",
            error.response.data.errors
          );
      } finally {
        setIsSubmittingForm(false);
      }
    },
    [
      editingProduct,
      dispatch,
      closeAddEditDrawer,
      newThumbImageFile,
      galleryImages,
      thumbImagePreviewUrl,
      refreshData, // MODIFIED
    ]
  );

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    item: ProductItem | null;
    isBulk: boolean;
  }>({ isOpen: false, item: null, isBulk: false });
  const handleDeleteProductClick = useCallback((product: ProductItem) => {
    setDeleteConfirm({ isOpen: true, item: product, isBulk: false });
  }, []);
  const handleDeleteSelectedProductsClick = useCallback(() => {
    if (selectedItems.length > 0)
      setDeleteConfirm({ isOpen: true, item: null, isBulk: true });
  }, [selectedItems]);
  const onConfirmDelete = useCallback(async () => {
    const { item, isBulk } = deleteConfirm;
    if (!item && !isBulk) return;
    setIsSubmittingForm(true);
    try {
      if (isBulk) {
        const idsToDelete = selectedItems.map((p) => p.id);
        await dispatch(
          deleteAllProductsAction({ ids: idsToDelete.join(",") })
        ).unwrap();
        toast.push(
          <Notification type="success" title="Products Deleted">
            {selectedItems.length} products deleted.
          </Notification>
        );
        setSelectedItems([]);
      } else if (item) {
        await dispatch(deleteProductAction(item.id)).unwrap();
        toast.push(
          <Notification type="success" title="Product Deleted">
            Product "{item.name}" deleted.
          </Notification>
        );
      }
      refreshData(); // MODIFIED
    } catch (error: any) {
      toast.push(
        <Notification type="danger" title="Delete Failed">
          {error.message || "Could not delete."}
        </Notification>
      );
    } finally {
      setIsSubmittingForm(false);
      setDeleteConfirm({ isOpen: false, item: null, isBulk: false });
    }
  }, [dispatch, deleteConfirm, selectedItems, refreshData]); // MODIFIED

  const handleChangeStatusClick = useCallback((product: ProductItem) => {
    setProductForStatusChange(product);
    setSelectedNewStatus(product.status);
    setIsChangeStatusDialogOpen(true);
  }, []);
  const onConfirmChangeStatus = useCallback(async () => {
    if (!productForStatusChange || !selectedNewStatus) return;
    setIsSubmittingForm(true);
    const apiStatus =
      apiProductStatusOptions.find(
        (opt) => opt.value.toLowerCase() === selectedNewStatus.toLowerCase()
      )?.value || selectedNewStatus;
    try {
      await dispatch(
        changeProductStatusAction({
          id: productForStatusChange.id,
          status: apiStatus,
        })
      ).unwrap();
      toast.push(
        <Notification type="success" title="Status Updated" duration={2000}>
          Product status changed to {selectedNewStatus}.
        </Notification>
      );
      refreshData(); // MODIFIED
    } catch (error: any) {
      toast.push(
        <Notification type="danger" title="Status Update Failed">
          {error.message || "Could not update status."}
        </Notification>
      );
    } finally {
      setIsSubmittingForm(false);
      setIsChangeStatusDialogOpen(false);
      setProductForStatusChange(null);
    }
  }, [dispatch, productForStatusChange, selectedNewStatus, refreshData]); // MODIFIED

  const openViewDetailModal = useCallback((product: ProductItem) => {
    navigate(`/product-management/product/${product.id}`);
  }, [navigate]);

  const closeViewDetailModal = useCallback(() => {
    setIsViewDetailModalOpen(false);
    setProductToView(null);
  }, []);
  const openImageViewer = useCallback((imageUrl: string | null) => {
    if (imageUrl) {
      setImageToView(imageUrl);
      setImageViewerOpen(true);
    }
  }, []);
  const closeImageViewer = useCallback(() => {
    setImageViewerOpen(false);
    setImageToView(null);
  }, []);

  const handleOpenExportReasonModal = useCallback(
    (type: ExportType) => {
      if (!allFilteredAndSortedData || allFilteredAndSortedData.length === 0) {
        toast.push(<Notification title="No data to export" type="info" />);
        return;
      }
      exportReasonFormMethods.reset({ reason: "" });
      setExportModalType(type);
    },
    [allFilteredAndSortedData, exportReasonFormMethods]
  );
  const handleConfirmExportWithReason = useCallback(
    async (data: ExportReasonFormData) => {
      if (!exportModalType) return;
      setIsSubmittingExportReason(true);
      const moduleName =
        exportModalType === "products" ? "Products" : "Product Keywords";
      try {
        const fileName = `products_export_${new Date().toISOString().split("T")[0]
          }.csv`;
        await dispatch(
          submitExportReasonAction({
            reason: data.reason,
            module: moduleName,
            file_name: fileName,
          })
        ).unwrap();
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.push(
          <Notification
            title="Export reason logged"
            type="info"
            duration={2000}
          />
        );
        if (exportModalType === "products") {
          exportProductsToCsv(allFilteredAndSortedData);
        } else if (exportModalType === "keywords") {
          exportKeywordsToCsv(allFilteredAndSortedData);
        }
        setExportModalType(null);
      } catch (error: any) {
        toast.push(
          <Notification title="Operation Failed" type="danger">
            {error.message || "Could not complete export."}
          </Notification>
        );
      } finally {
        setIsSubmittingExportReason(false);
      }
    },
    [dispatch, allFilteredAndSortedData, exportModalType]
  );

  const openImportModal = useCallback(
    (type: ImportType) => setImportModalType(type),
    []
  );
  const closeImportModal = useCallback(() => {
    setImportModalType(null);
    setSelectedFile(null);
  }, []);
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        file.type === "text/csv" ||
        file.name.endsWith(".csv") ||
        file.type === "application/vnd.ms-excel" ||
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setSelectedFile(file);
      } else {
        toast.push(
          <Notification title="Invalid File Type" type="danger">
            Please upload a CSV or Excel file.
          </Notification>
        );
        setSelectedFile(null);
        if (e.target) e.target.value = "";
      }
    }
  }, []);
  const handleImportSubmit = useCallback(async () => {
    if (!selectedFile || !importModalType) {
      toast.push(<Notification title="No File Selected" type="warning" />);
      return;
    }
    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      console.log(
        `Simulating import for "${importModalType}" with file:`,
        selectedFile.name
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.push(
        <Notification title="Import Initiated" type="success">
          File uploaded.{" "}
          {importModalType === "products" ? "Products" : "Keywords"} are being
          processed.
        </Notification>
      );
      refreshData(); // MODIFIED
      closeImportModal();
    } catch (apiError: any) {
      toast.push(
        <Notification title="Import Failed" type="danger">
          {apiError.message ||
            `An error occurred during ${importModalType} import.`}
        </Notification>
      );
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, importModalType, closeImportModal, refreshData]); // MODIFIED

  const handlePaginationChange = useCallback(
    (page: number) => setTableData((prev) => ({ ...prev, pageIndex: page })),
    []
  );
  const handlePageSizeChange = useCallback((value: number) => {
    setTableData((prev) => ({ ...prev, pageSize: value, pageIndex: 1 }));
    setSelectedItems([]);
  }, []);
  const handleSort = useCallback(
    (sort: OnSortParam) =>
      setTableData((prev) => ({ ...prev, sort, pageIndex: 1 })),
    []
  );
  const handleSearchChange = useCallback(
    (query: string) =>
      setTableData((prev) => ({ ...prev, query, pageIndex: 1 })),
    []
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: ProductItem) =>
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
    (checked: boolean, currentRows: Row<ProductItem>[]) => {
      const currentVisibleIds = new Set(currentRows.map((r) => r.original.id));
      if (checked) {
        setSelectedItems((prev) => {
          const newItems = currentRows
            .map((r) => r.original)
            .filter((item) => !prev.some((p) => p.id === item.id));
          return [...prev, ...newItems];
        });
      } else {
        setSelectedItems((prev) =>
          prev.filter((item) => !currentVisibleIds.has(item.id))
        );
      }
    },
    []
  );

  const openFilterDrawer = useCallback(() => {
    resetFilterForm(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [resetFilterForm, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria(data);
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );

  const onClearFilters = useCallback(() => {
    resetFilterForm({});
    setFilterCriteria({});
    setFilterFormValue("filterSubCategoryIds", []);
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
    closeFilterDrawer();
    refreshData(); // MODIFIED
  }, [resetFilterForm, setFilterFormValue, closeFilterDrawer, refreshData]); // MODIFIED

  const handleCardClick = (status: ProductStatus | "all") => {
    if (!isDataReady) return; // ADDED
    onClearFilters();
    if (status !== "all") {
      setFilterCriteria({ filterStatuses: [status] });
    }
    handleListTabChange(TABS.ALL); // Switch to all tab to see the filter result
  };

  const handleRemoveFilter = useCallback(
    (key: keyof FilterFormData, value: any) => {
      setFilterCriteria((prev) => {
        const newFilters = { ...prev };
        const currentValues = prev[key] as any[] | string | undefined;

        if (Array.isArray(currentValues)) {
          const newValues = currentValues.filter((item) => item !== value);
          (newFilters as any)[key] =
            newValues.length > 0 ? newValues : undefined;
        } else {
          (newFilters as any)[key] = undefined;
        }
        return newFilters;
      });
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    },
    []
  );

  const columns: ColumnDef<ProductItem>[] = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        size: 60,
        meta: { tdClass: "text-center", thClass: "text-center" },
        cell: ({ getValue }) => getValue().toString().padStart(6, "0"),
      },
      {
        header: "Product",
        id: "productInfo",
        size: 300,
        cell: (props: CellContext<ProductItem, any>) => (
          <div className="flex items-center gap-3">
            <Avatar
              size={30}
              shape="circle"
              src={props.row.original.thumbImageFullPath || undefined}
              icon={<TbBox />}
              className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
              onClick={() =>
                props.row.original.thumbImageFullPath &&
                openImageViewer(props.row.original.thumbImageFullPath)
              }
            ></Avatar>
            <Tooltip title={props.row.original.name}>
              <div className="truncate">
                <span
                  className="font-semibold hover:text-blue-600 cursor-pointer"
                  onClick={() => openViewDetailModal(props.row.original)}
                >
                  {props.row.original.name}
                </span>
                <div className="text-xs text-gray-500">
                  SKU: {props.row.original.skuCode || "-"}
                </div>
              </div>
            </Tooltip>
          </div>
        ),
      },
      {
        header: "Category",
        accessorKey: "categoryName",
        cell: (props) => props.row.original.categoryName || "-",
      },
      {
        header: "Sub Cat",
        accessorKey: "subCategoryName",
        cell: (props) => props.row.original.subCategoryName || "-",
      },
      {
        header: "Brand",
        accessorKey: "brandName",
        cell: (props) => props.row.original.brandName || "-",
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (props: CellContext<ProductItem, any>) => (
          <Tag
            className={`${productStatusColor[props.row.original.status] || "bg-gray-200"
              } capitalize font-semibold border-0`}
          >
            {props.row.original.status}
          </Tag>
        ),
      },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center" },
        cell: (props: CellContext<ProductItem, any>) => (
          <ActionColumn
            rowData={props.row.original}
            onEdit={() => openEditDrawer(props.row.original)}
            onViewDetail={() => openViewDetailModal(props.row.original)}
            onDelete={() => handleDeleteProductClick(props.row.original)}
            onChangeStatus={() => handleChangeStatusClick(props.row.original)}
            onOpenModal={handleOpenModal}
          />
        ),
      },
    ],
    [
      openImageViewer,
      openEditDrawer,
      openViewDetailModal,
      handleDeleteProductClick,
      handleChangeStatusClick,
      handleOpenModal,
    ]
  );

  const [filteredColumns, setFilteredColumns] =
    useState<ColumnDef<ProductItem>[]>(columns);
  useEffect(() => {
    setFilteredColumns(columns);
  }, [columns]);

  const isLoadingData =
    masterLoadingStatus === "pending" || masterLoadingStatus === "loading";
  const cardClass =
    "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex items-center gap-2 p-2";
  const tableLoading = initialLoading || isSubmittingForm || isLoadingData; // ADDED
  const renderCardContent = ( // ADDED
    content: string | number | undefined,
    colorClass: string
  ) => {
    if (initialLoading) {
      return <Skeleton width={40} height={24} />;
    }
    return <h6 className={colorClass}>{content ?? "..."}</h6>;
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-0">
            <h5 className="mb-4 lg:mb-0">Products</h5>
            <div className="flex items-center gap-2">
              <Dropdown title="More Options" className="mr-2">
                <Dropdown.Item
                  eventKey="Export Product"
                  onClick={() => handleOpenExportReasonModal("products")}
                  disabled={!isDataReady} // ADDED
                >
                  Export Products
                </Dropdown.Item>
                <Dropdown.Item
                  eventKey="Import Product"
                  onClick={() => openImportModal("products")}
                  disabled={!isDataReady} // ADDED
                >
                  Import Products
                </Dropdown.Item>
                <Dropdown.Item
                  eventKey="Export Keywords"
                  onClick={() => handleOpenExportReasonModal("keywords")}
                  disabled={!isDataReady} // ADDED
                >
                  Export Keywords
                </Dropdown.Item>
                <Dropdown.Item
                  eventKey="Import Keywords"
                  onClick={() => openImportModal("keywords")}
                  disabled={!isDataReady} // ADDED
                >
                  Import Keywords
                </Dropdown.Item>
              </Dropdown>
              <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={openAddDrawer}
                disabled={!isDataReady} // ADDED
              >
                Add New
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 mb-2 mt-4 gap-2 ">
            <Tooltip title="Click to show all products">
              <div onClick={() => handleCardClick("all")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-blue-200")}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                    <TbBrandProducthunt size={24} />
                  </div>
                  <div>
                    {renderCardContent(paginationInfo.total, "text-blue-500")}
                    <span className="font-semibold text-[11px]">Total</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show active products">
              <div onClick={() => handleCardClick("active")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-green-300")}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                    <TbCircleCheck size={24} />
                  </div>
                  <div>
                    {renderCardContent(paginationInfo.active, "text-green-500")}
                    <span className="font-semibold text-[11px]">Active</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show inactive products">
              <div onClick={() => handleCardClick("inactive")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-slate-300")}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-slate-100 text-slate-500">
                    <TbCancel size={24} />
                  </div>
                  <div>
                    {renderCardContent(paginationInfo.inactive, "text-slate-500")}
                    <span className="font-semibold text-[11px]">Inactive</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show pending products">
              <div onClick={() => handleCardClick("pending")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-orange-200")}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                    <TbProgress size={24} />
                  </div>
                  <div>
                    {renderCardContent(paginationInfo.pending, "text-orange-500")}
                    <span className="font-semibold text-[11px]">Pending</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show rejected products">
              <div onClick={() => handleCardClick("rejected")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-red-200")}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                    <TbCircleX size={24} />
                  </div>
                  <div>
                    {renderCardContent(paginationInfo.rejected, "text-red-500")}
                    <span className="font-semibold text-[11px]">Rejected</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show draft products">
              <div onClick={() => handleCardClick("draft")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-violet-200")}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                    <TbRefresh size={24} />
                  </div>
                  <div>
                    {renderCardContent(paginationInfo.draft, "text-violet-500")}
                    <span className="font-semibold text-[11px]">Draft</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
          </div>
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[TABS.ALL, TABS.PENDING].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleListTabChange(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${currentListTab === tab
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                >
                  {tab.replace("_", " ")} Products
                </button>
              ))}
            </nav>
          </div>
          <div className="my-4">
            <ProductTableTools
              onSearchChange={handleSearchChange}
              onFilter={openFilterDrawer}
              onClearFilters={onClearFilters}
              columns={columns}
              filteredColumns={filteredColumns}
              setFilteredColumns={setFilteredColumns}
              activeFilterCount={activeFilterCount}
              isDataReady={isDataReady} // ADDED
            />
          </div>
          <ActiveFiltersDisplay
            filterData={filterCriteria}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={onClearFilters}
            categoryOptions={categoryOptions}
            brandOptions={brandOptions}
          />
          <div className="flex-grow overflow-y-auto">
            <DataTable
              columns={filteredColumns}
              data={pageData}
              loading={tableLoading} // MODIFIED
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectable
              selectedItems={selectedItems}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handlePageSizeChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>
      <ProductSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelectedProductsClick}
      />
      <Drawer
        title={editingProduct ? "Edit Product" : "Add New Product"}
        isOpen={isAddEditDrawerOpen}
        onClose={closeAddEditDrawer}
        onRequestClose={closeAddEditDrawer}
        width={800}
        bodyClass="flex flex-col h-full pt-0"
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              type="button"
              onClick={closeAddEditDrawer}
              disabled={isSubmittingForm}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="productForm"
              type="submit"
              loading={isSubmittingForm}
            >
              {isSubmittingForm
                ? editingProduct
                  ? "Saving..."
                  : "Adding..."
                : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="productForm"
          onSubmit={formMethods.handleSubmit(onProductFormSubmit)}
          className="flex flex-col gap-y-0 h-full"
        >
          <div className="border-b border-gray-200 dark:border-gray-700 sticky top-0 pt-3 bg-white dark:bg-gray-800 z-10 px-4">
            <nav className=" flex space-x-6" aria-label="Tabs">
              {[
                FORM_TABS.GENERAL,
                FORM_TABS.DESCRIPTION,
                FORM_TABS.MEDIA,
                FORM_TABS.META,
              ].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleFormTabChange(tab)}
                  className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm capitalize flex items-center gap-2 ${currentFormTab === tab
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                >
                  {tab === FORM_TABS.GENERAL && <TbSettings />}
                  {tab === FORM_TABS.DESCRIPTION && <TbFileText />}
                  {tab === FORM_TABS.MEDIA && <TbPhoto />}
                  {tab === FORM_TABS.META && <TbClipboardText />}
                  {tab.replace("_", " ")}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-grow overflow-y-auto pt-4 px-4 pb-4">
            {currentFormTab === FORM_TABS.GENERAL && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0">
                {/* --- Field Order Changed --- */}
                <FormItem
                  label={
                    <div>
                      Status<span className="text-red-500"> * </span>
                    </div>
                  }
                  invalid={!!formErrors.status}
                  errorMessage={formErrors.status?.message}
                >
                  <Controller
                    name="status"
                    control={formControl}
                    render={({ field }) => (
                      <UiSelect
                        options={apiProductStatusOptions}
                        value={apiProductStatusOptions.find(
                          (o) => o.value === field.value
                        )}
                        onChange={(opt) => field.onChange(opt?.value)}
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label={
                    <div>
                      Category<span className="text-red-500"> * </span>
                    </div>
                  }
                  invalid={!!formErrors.category_id}
                  errorMessage={formErrors.category_id?.message}
                >
                  <Controller
                    name="category_id"
                    control={formControl}
                    render={({ field }) => (
                      <UiSelect
                        options={categoryOptions}
                        value={categoryOptions.find(
                          (o) => o.value === field.value
                        )}
                        onChange={(opt) => field.onChange(opt?.value)}
                        isClearable
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Sub Category"
                  invalid={!!formErrors.sub_category_id}
                  errorMessage={
                    formErrors.sub_category_id?.message as string | undefined
                  }
                >
                  <Controller
                    name="sub_category_id"
                    control={formControl}
                    render={({ field }) => (
                      <UiSelect
                        options={subcategoryOptions}
                        value={subcategoryOptions.find(
                          (o) => o.value === field.value
                        )}
                        onChange={(opt) => field.onChange(opt?.value)}
                        isClearable
                        isDisabled={
                          !watchedFormCategoryId ||
                          (subcategoryOptions.length === 0 &&
                            masterLoadingStatus !== "loading")
                        }
                        placeholder={
                          !watchedFormCategoryId
                            ? "Select category first"
                            : masterLoadingStatus === "loading" &&
                              !subcategoryOptions.length
                              ? "Loading subcategories..."
                              : subcategoryOptions.length === 0
                                ? "No subcategories"
                                : "Select subcategory"
                        }
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label={
                    <div>
                      Brand
                    </div>
                  }
                  invalid={!!formErrors.brand_id}
                  errorMessage={formErrors.brand_id?.message}
                >
                  <Controller
                    name="brand_id"
                    control={formControl}
                    render={({ field }) => (
                      <UiSelect
                        options={brandOptions}
                        value={brandOptions.find(
                          (o) => o.value === field.value
                        )}
                        onChange={(opt) => field.onChange(opt?.value)}
                        isClearable
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label={
                    <div>
                      Product Name<span className="text-red-500"> * </span>
                    </div>
                  }
                  invalid={!!formErrors.name}
                  errorMessage={formErrors.name?.message}
                >
                  <Controller
                    name="name"
                    control={formControl}
                    render={({ field }) => <Input {...field} />}
                  />
                </FormItem>
                <FormItem
                  label={
                    <div>
                      Slug/URL<span className="text-red-500"> * </span>
                    </div>
                  }
                  invalid={!!formErrors.slug}
                  errorMessage={formErrors.slug?.message}
                >
                  <Controller
                    name="slug"
                    control={formControl}
                    render={({ field }) => <Input {...field} />}
                  />
                </FormItem>
                <FormItem
                  label="SKU Code"
                  invalid={!!formErrors.sku_code}
                  errorMessage={formErrors.sku_code?.message}
                >
                  <Controller
                    name="sku_code"
                    control={formControl}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="HSN Code"
                  invalid={!!formErrors.hsn_code}
                  errorMessage={formErrors.hsn_code?.message}
                >
                  <Controller
                    name="hsn_code"
                    control={formControl}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Supplier Product Code (SPC)"
                  invalid={!!formErrors.supplier_product_code}
                  errorMessage={formErrors.supplier_product_code?.message}
                >
                  <Controller
                    name="supplier_product_code"
                    control={formControl}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label={
                    <div>
                      Country
                      {/* <span className="text-red-500"> * </span> */}
                    </div>
                  }
                  invalid={!!formErrors.country_id}
                  errorMessage={formErrors.country_id?.message}
                >
                  <Controller
                    name="country_id"
                    control={formControl}
                    render={({ field }) => (
                      <UiSelect
                        options={countryOptions}
                        value={countryOptions.find(
                          (o) => o.value === field.value
                        )}
                        onChange={(opt) => field.onChange(opt?.value)}
                        isClearable
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label={
                    <div>
                      Unit<span className="text-red-500"> * </span>
                    </div>
                  }
                  invalid={!!formErrors.unit_id}
                  errorMessage={formErrors.unit_id?.message}
                >
                  <Controller
                    name="unit_id"
                    control={formControl}
                    render={({ field }) => (
                      <UiSelect
                        options={unitOptions}
                        value={unitOptions.find((o) => o.value === field.value)}
                        onChange={(opt) => field.onChange(opt?.value)}
                        isClearable
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Colors Available"
                  invalid={!!formErrors.color}
                  errorMessage={formErrors.color?.message}
                >
                  <Controller
                    name="color"
                    control={formControl}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Shelf Life"
                  invalid={!!formErrors.shelf_life}
                  errorMessage={formErrors.shelf_life?.message}
                >
                  <Controller
                    name="shelf_life"
                    control={formControl}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Packaging Type"
                  invalid={!!formErrors.packaging_type}
                  errorMessage={formErrors.packaging_type?.message}
                >
                  <Controller
                    name="packaging_type"
                    control={formControl}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Packaging Size"
                  invalid={!!formErrors.packaging_size}
                  errorMessage={formErrors.packaging_size?.message}
                >
                  <Controller
                    name="packaging_size"
                    control={formControl}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Tax Rate (%)"
                  invalid={!!formErrors.tax_rate}
                  errorMessage={formErrors.tax_rate?.message}
                >
                  <Controller
                    name="tax_rate"
                    control={formControl}
                    render={({ field }) => (
                      <Input type="text" {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Procurement Lead Time"
                  invalid={!!formErrors.procurement_lead_time}
                  errorMessage={formErrors.procurement_lead_time?.message}
                >
                  <Controller
                    name="procurement_lead_time"
                    control={formControl}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label={
                    <div>
                      Product Keywords (AutoListing)
                      <span className="text-red-500"> * </span>
                    </div>
                  }
                  invalid={!!formErrors.product_keywords}
                  errorMessage={formErrors.product_keywords?.message}
                  className="md:col-span-2"
                >
                  <Controller
                    name="product_keywords"
                    control={formControl}
                    render={({ field }) => (
                      <Input
                        textArea
                        {...field}
                        rows={3}
                        placeholder="e.g., keyword one, keyword two"
                        value={field.value ?? ""}
                      />
                    )}
                  />
                </FormItem>
              </div>
            )}
            {currentFormTab === FORM_TABS.DESCRIPTION && (
              <div className="flex flex-col gap-y-4">
                <FormItem
                  label="Description"
                  invalid={!!formErrors.description}
                  errorMessage={formErrors.description?.message}
                >
                  <Controller
                    name="description"
                    control={formControl}
                    render={({ field }) => (
                      <RichTextEditor
                        content={field.value}
                        onChange={(val) => field.onChange(val.html)}
                        className="flex-grow min-h-[150px] sm:min-h-[200px]"
                      />

                    )}
                  />
                </FormItem>
                <FormItem
                  label="Short Description"
                  invalid={!!formErrors.short_description}
                  errorMessage={formErrors.short_description?.message}
                >
                  <Controller
                    name="short_description"
                    control={formControl}
                    render={({ field }) => (
                       <RichTextEditor
                        content={field.value}
                        onChange={(val) => field.onChange(val.html)}
                        className="flex-grow min-h-[150px] sm:min-h-[200px]"
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Payment Term"
                  invalid={!!formErrors.payment_term}
                  errorMessage={formErrors.payment_term?.message}
                >
                  <Controller
                    name="payment_term"
                    control={formControl}
                    render={({ field }) => (
                       <RichTextEditor
                        content={field.value}
                        onChange={(val) => field.onChange(val.html)}
                        className="flex-grow min-h-[150px] sm:min-h-[200px]"
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Delivery Details"
                  invalid={!!formErrors.delivery_details}
                  errorMessage={formErrors.delivery_details?.message}
                >
                  <Controller
                    name="delivery_details"
                    control={formControl}
                    render={({ field }) => (
                       <RichTextEditor
                        content={field.value}
                        onChange={(val) => field.onChange(val.html)}
                        className="flex-grow min-h-[150px] sm:min-h-[200px]"
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Product Specification"
                  invalid={!!formErrors.product_specification}
                  errorMessage={formErrors.product_specification?.message}
                >
                  <Controller
                    name="product_specification"
                    control={formControl}
                    render={({ field }) => (
                       <RichTextEditor
                        content={field.value}
                        onChange={(val) => field.onChange(val.html)}
                        className="flex-grow min-h-[150px] sm:min-h-[200px]"
                      />
                    )}
                  />
                </FormItem>
              </div>
            )}
            {currentFormTab === FORM_TABS.MEDIA && (
              <div>
                <FormItem
                  label={
                    <div>
                      Thumbnail Image (Max 1MB, 600x600 recommended)
                      <span className="text-red-500"> * </span>
                    </div>
                  }
                  className="mb-4"
                  invalid={!!formErrors.thumb_image_input}
                  errorMessage={
                    formErrors.thumb_image_input?.message as string | undefined
                  }
                >
                  <Controller
                    name="thumb_image_input"
                    control={formControl}
                    render={({ field: { onChange, onBlur, name, ref } }) => (
                      <Input
                        type="file"
                        name={name}
                        ref={ref}
                        onBlur={onBlur}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          onChange(file);
                          setNewThumbImageFile(file);
                          if (
                            thumbImagePreviewUrl &&
                            thumbImagePreviewUrl.startsWith("blob:")
                          )
                            URL.revokeObjectURL(thumbImagePreviewUrl);
                          setThumbImagePreviewUrl(
                            file
                              ? URL.createObjectURL(file)
                              : editingProduct?.thumbImageFullPath || null
                          );
                        }}
                        accept="image/*"
                      />
                    )}
                  />
                  {thumbImagePreviewUrl && (
                    <div className="mt-2 relative w-32 h-32">
                      <Avatar
                        src={thumbImagePreviewUrl}
                        size={120}
                        shape="rounded"
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </FormItem>
                <label className="form-label block mb-2">
                  Product Gallery Images (Max 5, 1024x1024 recommended)
                </label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const currentNonDeletedCount = galleryImages.filter(
                      (img) => !img.isDeleted
                    ).length;
                    const newImages = files
                      .slice(0, 5 - currentNonDeletedCount)
                      .map((file) => ({
                        file,
                        previewUrl: URL.createObjectURL(file),
                        isNew: true,
                        isDeleted: false,
                      }));
                    setGalleryImages((prev) => [
                      ...prev.filter((img) => !img.isDeleted),
                      ...newImages,
                    ]);
                    if (e.target) e.target.value = "";
                    setFormValue("name", getFormValues("name"), {
                      shouldDirty: true,
                    });
                  }}
                  disabled={
                    galleryImages.filter((img) => !img.isDeleted).length >= 5
                  }
                />
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {galleryImages
                    .filter((img) => !img.isDeleted)
                    .map((image) => (
                      <div
                        key={image.id || image.previewUrl}
                        className="relative group w-32 h-32"
                      >
                        <Avatar
                          src={image.previewUrl}
                          size={120}
                          shape="rounded"
                          className="w-full h-full"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
            {currentFormTab === FORM_TABS.META && (
              <div className="flex flex-col gap-y-4">
                <FormItem
                  label="Meta Tag Title"
                  invalid={!!formErrors.meta_title}
                  errorMessage={formErrors.meta_title?.message}
                >
                  <Controller
                    name="meta_title"
                    control={formControl}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ""} />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Meta Tag Description"
                  invalid={!!formErrors.meta_descr}
                  errorMessage={formErrors.meta_descr?.message}
                >
                  <Controller
                    name="meta_descr"
                    control={formControl}
                    render={({ field }) => (
                      <Input
                        textArea
                        {...field}
                        rows={4}
                        value={field.value ?? ""}
                      />
                    )}
                  />
                </FormItem>
                <FormItem
                  label="Meta Tag Keywords"
                  invalid={!!formErrors.meta_keyword}
                  errorMessage={formErrors.meta_keyword?.message}
                >
                  <Controller
                    name="meta_keyword"
                    control={formControl}
                    render={({ field }) => (
                      <Input
                        textArea
                        {...field}
                        rows={3}
                        placeholder="keyword1, keyword2"
                        value={field.value ?? ""}
                      />
                    )}
                  />
                </FormItem>
              </div>
            )}
          </div>
        </Form>
      </Drawer>
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterProductForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterProductForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          {/* <FormItem label="Name or SKU">
            <Controller
              name="filterNameOrSku"
              control={filterFormControl}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Name or SKU" />
              )}
            />
          </FormItem> */}
          <FormItem label="Categories">
            <Controller
              name="filterCategoryIds"
              control={filterFormControl}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select Categories"
                  options={categoryOptions}
                  value={categoryOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) => {
                    field.onChange(opts?.map((o) => o.value));
                    if (!opts || opts.length !== 1) {
                      const currentFilterSubCatIds = getFilterValues(
                        "filterSubCategoryIds"
                      );
                      if (
                        currentFilterSubCatIds &&
                        currentFilterSubCatIds.length > 0
                      )
                        setFilterFormValue("filterSubCategoryIds", []);
                    }
                  }}
                />
              )}
            />
          </FormItem>
          <FormItem label="Sub Categories">
            <Controller
              name="filterSubCategoryIds"
              control={filterFormControl}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder={
                    !watchedFilterCategoryIds ||
                      watchedFilterCategoryIds.length !== 1
                      ? "Select one category first"
                      : subcategoryOptions.length === 0 &&
                        masterLoadingStatus !== "loading"
                        ? "No subcategories"
                        : "Select Sub Categories"
                  }
                  options={subcategoryOptions}
                  value={subcategoryOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) => field.onChange(opts?.map((o) => o.value))}
                  isDisabled={
                    !watchedFilterCategoryIds ||
                    watchedFilterCategoryIds.length !== 1 ||
                    (subcategoryOptions.length === 0 &&
                      masterLoadingStatus !== "loading")
                  }
                />
              )}
            />
          </FormItem>
          <FormItem label="Brands">
            <Controller
              name="filterBrandIds"
              control={filterFormControl}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select Brands"
                  options={brandOptions}
                  value={brandOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) => field.onChange(opts?.map((o) => o.value))}
                />
              )}
            />
          </FormItem>
          <FormItem label="Status">
            <Controller
              name="filterStatuses"
              control={filterFormControl}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select Status"
                  options={uiProductStatusOptions}
                  value={uiProductStatusOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) => field.onChange(opts?.map((o) => o.value))}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        type="danger"
        title={
          deleteConfirm.isBulk
            ? `Delete ${selectedItems.length} Product(s)`
            : `Delete Product`
        }
        onClose={() =>
          setDeleteConfirm({ isOpen: false, item: null, isBulk: false })
        }
        onRequestClose={() =>
          setDeleteConfirm({ isOpen: false, item: null, isBulk: false })
        }
        onCancel={() =>
          setDeleteConfirm({ isOpen: false, item: null, isBulk: false })
        }
        onConfirm={onConfirmDelete}
        loading={isSubmittingForm}
      >
        <p>
          Are you sure you want to delete{" "}
          {deleteConfirm.isBulk
            ? `the selected ${selectedItems.length} product(s)`
            : `the product "${deleteConfirm.item?.name || ""}"`}
          ? This action cannot be undone.
        </p>
      </ConfirmDialog>
      <Dialog
        isOpen={isChangeStatusDialogOpen}
        onClose={() => setIsChangeStatusDialogOpen(false)}
        onRequestClose={() => setIsChangeStatusDialogOpen(false)}
        title={`Change Status for "${productForStatusChange?.name || ""}"`}
      >
        <div className="p-4">
          <FormItem label="New Status" className="mb-4">
            <UiSelect
              options={uiProductStatusOptions}
              value={uiProductStatusOptions.find(
                (o) => o.value === selectedNewStatus
              )}
              onChange={(opt) => setSelectedNewStatus(opt?.value || "")}
            />
          </FormItem>
          <div className="text-right">
            <Button
              size="sm"
              className="mr-2"
              onClick={() => setIsChangeStatusDialogOpen(false)}
              disabled={isSubmittingForm}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              onClick={onConfirmChangeStatus}
              loading={isSubmittingForm}
              disabled={!selectedNewStatus || isSubmittingForm}
            >
              Confirm Change
            </Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        isOpen={importModalType !== null}
        onClose={closeImportModal}
        onRequestClose={closeImportModal}
        title={
          importModalType === "products"
            ? "Import Products"
            : "Import Product Keywords"
        }
        width={600}
      >
        <div className="py-4">
          <p className="mb-1 text-sm">
            Select a CSV or Excel file to import {importModalType}.
          </p>
          <p className="mb-4 text-xs text-gray-500">
            {importModalType === "products" ? (
              <span>
                Required headers:{" "}
                <code>name, slug, sku_code, status, etc.</code>
              </span>
            ) : (
              <span>
                Required headers: <code>product_id, meta_keywords</code>
              </span>
            )}
          </p>
          <FormItem label="Upload File" className="mb-4">
            <Input
              type="file"
              name="file"
              accept=".csv, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              prefix={<TbFileSpreadsheet className="text-xl" />}
            />
            {selectedFile && (
              <div className="mt-2 text-xs text-gray-500">
                Selected:{" "}
                <span className="font-semibold">{selectedFile.name}</span>
              </div>
            )}
          </FormItem>
          <a
            href={
              importModalType === "products"
                ? "/sample-products-import.csv"
                : "/sample-keywords-import.csv"
            }
            download={`sample-${importModalType}-import-template.csv`}
            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-6"
          >
            <TbCloudDownload /> Download Sample CSV
          </a>
          <div className="text-right">
            <Button
              className="mr-2"
              onClick={closeImportModal}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              onClick={handleImportSubmit}
              loading={isImporting}
              disabled={!selectedFile || isImporting}
              icon={!isImporting && <TbCloudUpload />}
            >
              {isImporting ? "Importing..." : "Upload & Import"}
            </Button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog
        isOpen={exportModalType !== null}
        type="info"
        title={`Reason for ${exportModalType === "products" ? "Product" : "Keyword"
          } Export`}
        onClose={() => setExportModalType(null)}
        onRequestClose={() => setExportModalType(null)}
        onCancel={() => setExportModalType(null)}
        onConfirm={exportReasonFormMethods.handleSubmit(
          handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <Form
          id="exportReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
          }}
          className="mt-2"
        >
          <FormItem
            label="Please state the reason for this data export:"
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
                  placeholder="e.g., Monthly sales report, Partner data sync"
                  rows={3}
                />
              )}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>
      <Dialog
        width={837}
        isOpen={isViewDetailModalOpen}
        onClose={closeViewDetailModal}
        size="lg"
        title=""
        contentClassName="!p-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden"
      >
        {productToView ? (
          <div className="max-h-[79vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 sticky top-0 bg-white dark:bg-slate-800 z-10">
              {productToView.thumbImageFullPath && (
                <Avatar
                  size="lg"
                  src={productToView.thumbImageFullPath}
                  icon={<TbBox />}
                />
              )}
              <h5 className="font-semibold text-slate-700 dark:text-white truncate">
                {productToView.name}
              </h5>
            </div>
            <div className="p-5 overflow-y-auto space-y-6 text-sm">
              <Card>
                <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">
                  Basic Information
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                  <DialogDetailRow
                    label="ID"
                    value={String(productToView.id)}
                  />
                  <DialogDetailRow
                    label="SKU Code"
                    value={productToView.skuCode || "-"}
                  />
                  <DialogDetailRow
                    label="Status"
                    value={
                      <Tag
                        className={`${productStatusColor[productToView.status]
                          } capitalize font-semibold border-0`}
                      >
                        {productToView.status}
                      </Tag>
                    }
                  />
                  <DialogDetailRow
                    label="Slug"
                    value={productToView.slug}
                    isLink
                    breakAll
                  />
                  <DialogDetailRow
                    label="Color"
                    value={productToView.color || "-"}
                  />
                  <DialogDetailRow
                    label="HSN Code"
                    value={productToView.hsnCode || "-"}
                  />
                  <DialogDetailRow
                    label="Supplier Product Code (SPC)"
                    value={productToView.supplierProductCode || "-"}
                  />
                </div>
              </Card>
              <Card>
                <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">
                  Categorization & Origin
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                  <DialogDetailRow
                    label="Category"
                    value={productToView.categoryName || "-"}
                  />
                  <DialogDetailRow
                    label="Sub Category"
                    value={productToView.subCategoryName || "-"}
                  />
                  <DialogDetailRow
                    label="Brand"
                    value={productToView.brandName || "-"}
                  />
                  <DialogDetailRow
                    label="Unit"
                    value={productToView.unitName || "-"}
                  />
                  <DialogDetailRow
                    label="Country of Origin"
                    value={productToView.countryName || "-"}
                  />
                </div>
              </Card>
              <Card>
                <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">
                  Product Specification
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                  <DialogDetailRow
                    label="Shelf Life"
                    value={productToView.shelfLife || "-"}
                  />
                  <DialogDetailRow
                    label="Packaging Size"
                    value={productToView.packagingSize || "-"}
                  />
                  <DialogDetailRow
                    label="Packaging Type"
                    value={productToView.packagingType || "-"}
                  />
                  <DialogDetailRow
                    label="Tax Rate"
                    value={
                      productToView.taxRate ? `${productToView.taxRate}%` : "-"
                    }
                  />
                  <DialogDetailRow
                    label="Procurement Lead Time"
                    value={productToView.procurementLeadTime || "-"}
                  />
                  <DialogDetailRow
                    label="Product Keywords (AutoListing)"
                    value={productToView.productKeywords || "-"}
                    preWrap
                    className="md:col-span-2 lg:col-span-3"
                  />
                </div>
                {productToView.productSpecification && (
                  <DialogDetailRow
                    label="Product Specification"
                    value={productToView.productSpecification}
                    preWrap
                    className="md:col-span-2 lg:col-span-3"
                  />
                )}
              </Card>
              {(productToView.description ||
                productToView.shortDescription ||
                productToView.paymentTerm ||
                productToView.deliveryDetails) && (
                  <Card>
                    <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">
                      Descriptions & Terms
                    </h6>
                    {productToView.shortDescription && (
                      <DialogDetailRow
                        label="Short Description"
                        value={productToView.shortDescription}
                        preWrap
                      />
                    )}
                    {productToView.description && (
                      <DialogDetailRow
                        label="Full Description"
                        value={productToView.description}
                        preWrap
                      />
                    )}
                    {productToView.paymentTerm && (
                      <DialogDetailRow
                        label="Payment Term"
                        value={productToView.paymentTerm}
                        preWrap
                      />
                    )}
                    {productToView.deliveryDetails && (
                      <DialogDetailRow
                        label="Delivery Details"
                        value={productToView.deliveryDetails}
                        preWrap
                      />
                    )}
                  </Card>
                )}
              {productToView.productImages &&
                productToView.productImages.length > 0 && (
                  <Card>
                    <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">
                      Product Gallery
                    </h6>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {productToView.productImages
                        .filter((img) => !img.isDeleted)
                        .map((img, idx) => (
                          <Avatar
                            key={idx}
                            src={img.previewUrl}
                            size={100}
                            shape="rounded"
                            className="cursor-pointer hover:ring-2 ring-indigo-500"
                            onClick={() => openImageViewer(img.previewUrl)}
                          />
                        ))}
                    </div>
                  </Card>
                )}
              {(productToView.metaTitle ||
                productToView.metaDescription ||
                productToView.metaKeyword) && (
                  <Card>
                    <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">
                      SEO Information
                    </h6>
                    {productToView.metaTitle && (
                      <DialogDetailRow
                        label="Meta Title"
                        value={productToView.metaTitle}
                      />
                    )}
                    {productToView.metaDescription && (
                      <DialogDetailRow
                        label="Meta Description"
                        value={productToView.metaDescription}
                        preWrap
                      />
                    )}
                    {productToView.metaKeyword && (
                      <DialogDetailRow
                        label="Meta Keywords"
                        value={productToView.metaKeyword}
                      />
                    )}
                  </Card>
                )}
              <Card>
                <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">
                  Timestamps
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                  <DialogDetailRow
                    label="Created At"
                    value={new Date(productToView.createdAt).toLocaleString()}
                  />
                  <DialogDetailRow
                    label="Last Updated At"
                    value={new Date(productToView.updatedAt).toLocaleString()}
                  />
                </div>
              </Card>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-right sticky bottom-0 bg-white dark:bg-slate-800 z-10">
              <Button onClick={closeViewDetailModal}>Close</Button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <TbInfoCircle
              size={42}
              className="text-slate-400 dark:text-slate-500 mb-2 mx-auto"
            />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No Product Information
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Details could not be loaded.
            </p>
            <div className="mt-5">
              <Button
                variant="solid"
                color="blue-600"
                onClick={closeViewDetailModal}
                size="sm"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        title="View Image"
        width={600}
        style={{ zIndex: 100 }}
        footer={<Button onClick={closeImageViewer}>Close</Button>}
      >
        <div className="p-4 flex justify-center items-center">
          {imageToView && (
            <img
              src={imageToView}
              alt="Product view"
              className="max-w-full max-h-[80vh] object-contain"
            />
          )}
        </div>
      </Dialog>
      <ProductsModals
        modalState={modalState}
        onClose={handleCloseModal}
        getAllUserDataOptions={getAllUserDataOptions}
      />
    </>
  );
};

export default Products;