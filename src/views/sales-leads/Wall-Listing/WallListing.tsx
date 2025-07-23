// src/views/your-path/WallListing.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

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
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Skeleton,
  Select as UiSelect,
} from "@/components/ui";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Spinner from "@/components/ui/Spinner";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";


// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbBell,
  TbBookmark,
  TbBox,
  TbBoxOff,
  TbBrandWhatsapp,
  TbBulb,
  TbCalendar,
  TbCalendarEvent,
  TbCancel,
  TbCheck,
  TbChecks,
  TbCircleCheck,
  TbCloudDownload,
  TbCloudUpload,
  TbColumns,
  TbCopy,
  TbEye,
  TbFilter,
  TbListDetails,
  TbMail,
  TbPackageExport,
  TbPencil,
  TbPlus,
  TbProgress,
  TbReload,
  TbSearch,
  TbShare,
  TbStack2,
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

// Redux
import { authSelector } from "@/reduxtool/auth/authSlice";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addAllActionAction,
  addNotificationAction,
  addScheduleAction,
  addTaskAction,
  deleteAllWallAction,
  getAllCompany,
  getAllUsersAction,
  getBrandAction,
  getEmployeesAction,
  getMatchingOpportunitiesAction,
  getMemberTypeAction,
  getParentCategoriesAction,
  getProductsDataAsync,
  getProductSpecificationsAction,
  getSubcategoriesByCategoryIdAction,
  getWallListingAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "localforage";
import { shallowEqual, useSelector } from "react-redux";
import { z } from "zod";

// --- Type Definitions ---
export type ApiWallItemFromSource = any;

export type WallRecordStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Expired"
  | "Fulfilled"
  | "Active"
  | string;
export type WallIntent = "Buy" | "Sell" | "Exchange";
export type WallProductCondition = "New" | "Used" | "Refurbished" | string;

export type WallItem = {
  id: number;
  product_name: string;
  company_name: string;
  companyId?: string;
  member_name: string;
  memberId?: string;
  member_email: string;
  member_phone: string;
  product_category: string;
  productCategoryId?: number;
  product_subcategory: string;
  subCategoryId?: number;
  product_description: string;
  product_specs: string;
  product_status: string;
  quantity: number;
  price: number;
  want_to: WallIntent | string;
  listing_type: string;
  shipping_options: string;
  payment_method: string;
  warranty: string;
  return_policy: string;
  listing_url: string;
  brand: string;
  brandId?: number;
  product_images: string[];
  created_date: Date;
  updated_at: Date;
  visibility: string;
  priority: string;
  assigned_to: string;
  interaction_type: string;
  action: string;
  created_from: string;
  recordStatus?: WallRecordStatus;
  cartoonTypeId?: number | null;
  deviceCondition?: WallProductCondition | null;
  inquiry_count: number;
  share_count: number;
  is_bookmarked: boolean;
  updated_by_user?: {
    name: string;
    profile_pic_path?: string | null;
    roles: { display_name: string }[];
  } | null;
  productId?: number;
  productSpecId?: number;
  memberTypeId?: number;
  createdById?: number;
  member?: any;
};

// --- NEW Type Definition for Matching Opportunity ---
type MatchingOpportunityItem = {
  id: number;
  want_to: 'Buy' | 'Sell' | string;
  product_name: string;
  brand_name: string;
  qty: string;
  price: number | null;
  device_condition: string;
  color: string;
  member_name: string;
  member_code: string;
  country_name: string;
  leads_count: number;
};

// --- Zod Schemas ---
const selectOptionSchema = z.object({ value: z.any(), label: z.string() });
const filterFormSchema = z.object({
  filterRecordStatuses: z.array(selectOptionSchema).optional().default([]),
  filterProductIds: z.array(selectOptionSchema).optional().default([]),
  filterCompanyIds: z.array(selectOptionSchema).optional().default([]),
  filterIntents: z.array(selectOptionSchema).optional().default([]),
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
  categories: z.array(selectOptionSchema).optional().default([]),
  subcategories: z.array(selectOptionSchema).optional().default([]),
  brands: z.array(selectOptionSchema).optional().default([]),
  productStatus: z.array(selectOptionSchema).optional().default([]),
  source: z.array(selectOptionSchema).optional().default([]),
  productSpec: z.array(selectOptionSchema).optional().default([]),
  memberType: z.array(selectOptionSchema).optional().default([]),
  createdBy: z.array(selectOptionSchema).optional().default([]),
  quickFilters: z.object({ type: z.string(), value: z.string() }).nullable().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// Zod Schema for Schedule Form
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// Zod Schema for Task Form
const taskValidationSchema = z.object({
  task_title: z.string().min(3, 'Task title must be at least 3 characters.'),
  assign_to: z.array(z.number()).min(1, 'At least one assignee is required.'),
  priority: z.string().min(1, 'Please select a priority.'),
  due_date: z.date().nullable().optional(),
  description: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskValidationSchema>;

// Zod Schema for Activity Form
const activitySchema = z.object({
  item: z.string().min(3, "Activity item is required and must be at least 3 characters."),
  notes: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;


// --- Status Colors and Options ---
const recordStatusColor: Record<WallRecordStatus, string> = {
  Pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100",
  Approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  Expired: "bg-gray-100 text-gray-700 dark:bg-gray-600/20 dark:text-gray-100",
  Fulfilled: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100",
  Active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
};
const recordStatusOptions = Object.keys(recordStatusColor).map((s) => ({
  value: s,
  label: s,
}));

const intentTagColor: Record<WallIntent, string> = {
  Sell: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Buy: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100",
  Exchange:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
};
const intentOptions: { value: WallIntent; label: string }[] = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
  { value: "Exchange", label: "Exchange" },
];

const productApiStatusColor: Record<string, string> = {
  available:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-100",
  "low stock":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100",
  "out of stock":
    "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  discontinued: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  "non-active":
    "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-100",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-100",
};

export const dummyCartoonTypes = [{ id: 1, name: "Master Carton" }, { id: 2, name: "Inner Carton" }];

// ============================================================================
// --- MODALS SECTION ---
// ============================================================================
export type WallModalType = "email" | "whatsapp" | "notification" | "task" | "activity" | "calendar" | "match_opportunity" | "share";
export interface WallModalState { isOpen: boolean; type: WallModalType | null; data: WallItem | null; }
interface WallModalsProps { modalState: WallModalState; onClose: () => void; getAllUserDataOptions: { value: any, label: string }[]; user: any; }

const priorityOptions = [{ value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" },];
const taskPriorityOptions = priorityOptions;
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
];
const dummyAlerts = [{ id: 1, severity: "warning", message: "Listing will expire in 3 days.", time: "4 days ago", }, { id: 2, severity: "info", message: "New inquiry received from John Doe.", time: "2 hours ago", },];

const AddNotificationDialog: React.FC<{ wallItem: WallItem; onClose: () => void; getAllUserDataOptions: { value: any, label: string }[]; }> = ({ wallItem, onClose, getAllUserDataOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const notificationSchema = z.object({ notification_title: z.string().min(3, "Title must be at least 3 characters long."), send_users: z.array(z.number()).min(1, "Please select at least one user."), message: z.string().min(10, "Message must be at least 10 characters long."), });
  type NotificationFormData = z.infer<typeof notificationSchema>;
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(notificationSchema), defaultValues: { notification_title: `Regarding Wall Listing: ${wallItem.product_name}`, send_users: [], message: `This is a notification for the wall listing: "${wallItem.product_name}".` }, mode: 'onChange' });
  const onSend = async (formData: NotificationFormData) => {
    setIsLoading(true);
    const payload = { send_users: formData.send_users, notification_title: formData.notification_title, message: formData.message, module_id: String(wallItem.id), module_name: 'WallListing', };
    try {
      await dispatch(addNotificationAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Notification Sent Successfully!" />);
      onClose();
    } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsLoading(false); }
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for "{wallItem.product_name}"</h5>
      <Form onSubmit={handleSubmit(onSend)}>
        <FormItem label="Notification Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
        <FormItem label="Send to Users" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select Users" options={getAllUserDataOptions} value={getAllUserDataOptions.filter(o => field.value?.includes(o.value))} onChange={(options: any) => field.onChange(options?.map((o: any) => o.value) || [])} />)} /></FormItem>
        <FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={3} />} /></FormItem>
        <div className="text-right mt-6"><Button className="mr-2" onClick={onClose}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button></div>
      </Form>
    </Dialog>
  );
};
const AssignTaskDialog: React.FC<{ wallItem: WallItem; onClose: () => void; getAllUserDataOptions: { value: any, label: string }[]; }> = ({ wallItem, onClose, getAllUserDataOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<TaskFormData>({
    resolver: zodResolver(taskValidationSchema),
    defaultValues: {
      task_title: `Follow up on wall listing: ${wallItem.product_name}`,
      assign_to: [],
      priority: 'Medium',
      due_date: null,
      description: `Regarding wall item from ${wallItem.member_name} for product "${wallItem.product_name}".`,
    },
    mode: 'onChange'
  });

  const onAssignTask = async (data: TaskFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        due_date: data.due_date ? dayjs(data.due_date).format('YYYY-MM-DD') : undefined,
        module_id: String(wallItem.id),
        module_name: 'WallListing',
      };
      await dispatch(addTaskAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Task Assigned" children={`Successfully assigned task for item #${wallItem.id}.`} />);
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Failed to Assign Task" children={error?.message || 'An unknown error occurred.'} />);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for "{wallItem.product_name}"</h5>
      <Form onSubmit={handleSubmit(onAssignTask)}>
        <FormItem label="Task Title" invalid={!!errors.task_title} errorMessage={errors.task_title?.message}>
          <Controller name="task_title" control={control} render={({ field }) => <Input {...field} autoFocus />} />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Assign To" invalid={!!errors.assign_to} errorMessage={errors.assign_to?.message}>
            <Controller name="assign_to" control={control} render={({ field }) => (
              <UiSelect isMulti placeholder="Select User(s)" options={getAllUserDataOptions} value={getAllUserDataOptions.filter(o => field.value?.includes(o.value))} onChange={(opts: any) => field.onChange(opts?.map((o: any) => o.value) || [])} />
            )} />
          </FormItem>
          <FormItem label="Priority" invalid={!!errors.priority} errorMessage={errors.priority?.message}>
            <Controller name="priority" control={control} render={({ field }) => (
              <UiSelect placeholder="Select Priority" options={taskPriorityOptions} value={taskPriorityOptions.find(p => p.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />
            )} />
          </FormItem>
        </div>
        <FormItem label="Due Date (Optional)" invalid={!!errors.due_date} errorMessage={errors.due_date?.message}>
          <Controller name="due_date" control={control} render={({ field }) => <DatePicker placeholder="Select date" value={field.value as Date} onChange={field.onChange} />} />
        </FormItem>
        <FormItem label="Description" invalid={!!errors.description} errorMessage={errors.description?.message}>
          <Controller name="description" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} />
        </FormItem>
        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Assign Task</Button>
        </div>
      </Form>
    </Dialog>
  );
};
const AddScheduleDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema), defaultValues: { event_title: `Regarding Wall Item: ${wallItem.product_name}`, event_type: undefined, date_time: null as any, remind_from: null, notes: `Details for wall item "${wallItem.product_name}" (ID: ${wallItem.id}).`, }, mode: 'onChange', });
  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = { module_id: Number(wallItem.id), module_name: 'WallListing', event_title: data.event_title, event_type: data.event_type, date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'), ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }), notes: data.notes || '', };
    try {
      await dispatch(addScheduleAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for "${wallItem.product_name}".`} />);
      onClose();
    } catch (error: any) { toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsLoading(false); }
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for "{wallItem.product_name}"</h5>
      <Form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem>
          <FormItem label="Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
        </div>
        <FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
        <FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
        <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div>
      </Form>
    </Dialog>
  );
};
const AddActivityDialog: React.FC<{ wallItem: WallItem; onClose: () => void; user: any; }> = ({ wallItem, onClose, user }) => {
  const dispatch = useAppDispatch();
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const { useEncryptApplicationStorage } = config;
    try { setUserData(encryptStorage.getItem("UserData", !useEncryptApplicationStorage)); }
    catch (error) { console.error("Error getting UserData:", error); }
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: { item: `Follow up on ${wallItem.product_name}`, notes: '' },
    mode: 'onChange',
  });


  const onAddActivity = async (data: ActivityFormData) => {
    setIsLoading(true);
    const payload = {
      item: data.item,
      notes: data.notes || '',
      module_id: String(wallItem.id),
      module_name: 'WallListing',
      user_id: userData.id,
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
      <h5 className="mb-4">Add Activity Log for "{wallItem.product_name}"</h5>
      <Form onSubmit={handleSubmit(onAddActivity)}>
        <FormItem label="Activity" invalid={!!errors.item} errorMessage={errors.item?.message}>
          <Controller name="item" control={control} render={({ field }) => <Input {...field} placeholder="e.g., Followed up with member" />} />
        </FormItem>
        <FormItem label="Notes (Optional)" invalid={!!errors.notes} errorMessage={errors.notes?.message}>
          <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} placeholder="Add relevant details..." />} />
        </FormItem>
        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading} icon={<TbCheck />}>Save Activity</Button>
        </div>
      </Form>
    </Dialog>
  );
};

// --- NEW DIALOG COMPONENT ---
const MatchingOpportunitiesDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const dispatch = useAppDispatch();
  const [data, setData] = useState<MatchingOpportunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Use a local loading state

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!wallItem.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        // Correctly pass the payload as an object and unwrap the result
        const actionResult = await dispatch(getMatchingOpportunitiesAction(wallItem.id)).unwrap();

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
            member_code: item.member_code,
            country_name: item.country_name,
            leads_count: item.leads_count,
          }));
          setData(formattedData);
        } else {
          setData([]); // Ensure data is cleared if API returns nothing
        }
      } catch (error) {
        console.error("Failed to fetch matching opportunities:", error);
        toast.push(<Notification type="danger" title="Error">Could not load opportunities.</Notification>);
        setData([]); // Clear data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, [dispatch, wallItem.id]);

  const columns: ColumnDef<MatchingOpportunityItem>[] = useMemo(() => [
    {
      header: 'Listing',
      accessorKey: 'product_name',
      cell: ({ row }) => {
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
      cell: ({ row }) => {
        const { member_name, member_code, country_name } = row.original;
        return (
          <div>
            <p className="font-semibold">{member_name}</p>
            <p className="text-xs text-gray-500">{member_code}</p>
            <p className="text-xs text-gray-500">{country_name}</p>
          </div>
        );
      }
    },
    {
      header: 'Details',
      accessorKey: 'qty',
      cell: ({ row }) => {
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
      cell: ({ row }) => <span className="font-semibold">{row.original.leads_count}</span>
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
        {/* Dialog Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <TbBulb className="text-2xl text-amber-500" />
            <h5 className="mb-0">Matching Opportunities for "{wallItem.product_name}"</h5>
          </div>
        </div>

        {/* Dialog Body */}
        <div className="flex-grow overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size={40} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              noData={data.length === 0}

            />
          )}
        </div>

        {/* Dialog Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-right">
          <Button variant="solid" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Dialog>
  );
};

const ShareWallLinkDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const linkToShare = wallItem.listing_url || "No URL available for this item.";
  const handleCopy = () => { if (wallItem.listing_url) { navigator.clipboard.writeText(linkToShare).then(() => { toast.push(<Notification title="Copied to Clipboard" type="success" />); }); } };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Share Link for "{wallItem.product_name}"</h5>
      <p className="mb-2 text-sm">Use the link below to share this listing:</p>
      <div className="flex items-center gap-2"><Input readOnly value={linkToShare} /><Tooltip title="Copy Link"><Button shape="circle" icon={<TbCopy />} onClick={handleCopy} disabled={!wallItem.listing_url} /></Tooltip></div>
      <div className="text-right mt-6"><Button onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};

const WallModals: React.FC<WallModalsProps> = ({ modalState, onClose, getAllUserDataOptions, user }) => {
  const { type, data: wallItem, isOpen } = modalState;
  if (!isOpen || !wallItem) return null;
  const renderModalContent = () => {
    switch (type) {
      case "notification": return <AddNotificationDialog wallItem={wallItem} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
      case "task": return <AssignTaskDialog wallItem={wallItem} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
      case "calendar": return <AddScheduleDialog wallItem={wallItem} onClose={onClose} />;
      case "activity": return <AddActivityDialog wallItem={wallItem} onClose={onClose} user={user} />;
      case "match_opportunity": return <MatchingOpportunitiesDialog wallItem={wallItem} onClose={onClose} />;
      case "share": return <ShareWallLinkDialog wallItem={wallItem} onClose={onClose} />;
      default: return null;
    }
  };
  return <>{renderModalContent()}</>;
};

// --- CSV Export ---
const CSV_WALL_HEADERS = ["ID", "Product Name", "Company Name", "Member Name", "Category", "Subcategory", "Product Status", "Quantity", "Price", "Intent", "Created Date", "Record Status",];
const CSV_WALL_KEYS: (keyof WallItem)[] = ["id", "product_name", "company_name", "member_name", "product_category", "product_subcategory", "product_status", "quantity", "price", "want_to", "created_date", "recordStatus",];
function exportWallItemsToCsv(filename: string, rows: WallItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const separator = ",";
  const csvContent = CSV_WALL_HEADERS.join(separator) + "\n" + rows.map((row) => {
    return CSV_WALL_KEYS.map((k) => {
      let cell = row[k] as any;
      if (cell === null || cell === undefined) cell = "";
      else if (k === "created_date" && cell instanceof Date) cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss");
      else cell = String(cell).replace(/"/g, '""');
      if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(separator);
  }).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;", });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>);
    return true;
  }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- Child Components ---
const StyledActionColumn = ({
  onEdit,
  onViewDetail,
  onOpenModal,
  onSendEmail,
  onSendWhatsapp,
  rowData,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onOpenModal: (type: WallModalType, data: WallItem) => void;
  onSendEmail: () => void;
  onSendWhatsapp: () => void;
  rowData: WallItem;
}) => (
  <div className="flex items-center justify-center">
    <Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 rounded-md" role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
    <Tooltip title="View"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-md" role="button" onClick={onViewDetail}><TbEye /></div></Tooltip>
    <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
      <Dropdown.Item onClick={onSendEmail} className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
      <Dropdown.Item onClick={onSendWhatsapp} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add Notification</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("task", rowData)} className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign Task</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("calendar", rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Add Schedule</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("activity", rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Add Activity</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("match_opportunity", rowData)} className="flex items-center gap-2"><TbBulb size={18} /> <span className="text-xs">Match Opportunity</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("share", rowData)} className="flex items-center gap-2"><TbShare size={18} /> <span className="text-xs">Share Wall Link</span></Dropdown.Item>
    </Dropdown>
  </div>
);

interface WallSearchProps { onInputChange: (value: string) => void; }
const WallSearch = React.forwardRef<HTMLInputElement, WallSearchProps>(({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch />} onChange={(e) => onInputChange(e.target.value)} />));
WallSearch.displayName = "WallSearch";

const WallTableTools = ({ onSearchChange, onFilter, onExport, onImport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount, isDashboard }: {
  onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onImport: () => void; onClearFilters: () => void;
  columns: ColumnDef<WallItem>[];
  filteredColumns: ColumnDef<WallItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<WallItem>[]>>;
  isDashboard: boolean;
  activeFilterCount: number;
}) => {
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
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <WallSearch onInputChange={onSearchChange} />
      </div>
      {!isDashboard && <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
          <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
            {columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}
          </div>
        </Dropdown>
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload"></Button>
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
        <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
        <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
      </div>}
    </div>
  )
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData,
  onRemoveFilter: (key: keyof FilterFormData, value: any) => void;
  onClearAll: () => void;
}) => {
  const { filterRecordStatuses, filterIntents, quickFilters } = filterData;
  const hasFilters = filterRecordStatuses?.length || filterIntents?.length || quickFilters;
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {filterRecordStatuses?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterRecordStatuses', item)} /></Tag>)}
      {filterIntents?.map(item => <Tag key={`intent-${item.value}`} prefix>Intent: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterIntents', item)} /></Tag>)}
      {quickFilters && <Tag prefix className="capitalize">{quickFilters.type}: {quickFilters.value} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('quickFilters', quickFilters)} /></Tag>}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};
interface WallTableProps {
  columns: ColumnDef<WallItem>[]; data: WallItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: WallItem[];
  onPaginationChange: (page: number) => void; onSelectChange: (size: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: WallItem) => void; onAllRowSelect: (checked: boolean, rows: Row<WallItem>[]) => void;
  selectable?: boolean;
}
const WallTable = (props: WallTableProps) => (<DataTable selectable={props.selectable} columns={props.columns} data={props.data} loading={props.loading} pagingData={props.pagingData} checkboxChecked={(row) => props.selectedItems.some((s) => s.id === row.id)} onPaginationChange={props.onPaginationChange} onSelectChange={props.onSelectChange} onSort={props.onSort} onCheckBoxChange={props.onRowSelect} onIndeterminateCheckBoxChange={props.onAllRowSelect} noData={!props.loading && props.data.length === 0} />);
interface WallSelectedFooterProps { selectedItems: WallItem[]; deleteConfirmOpen: boolean; setDeleteConfirmOpen: (open: boolean) => void; onConfirmDelete: () => void; isDeleting: boolean; }
const WallSelectedFooter = ({ selectedItems, deleteConfirmOpen, setDeleteConfirmOpen, onConfirmDelete, isDeleting }: WallSelectedFooterProps) => {
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t px-8">
        <div className="flex items-center justify-between w-full"><span className="flex items-center gap-2"><TbChecks className="text-xl text-primary-500" /><span className="font-semibold">{selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}selected</span></span><Button size="sm" variant="plain" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirmOpen(true)}>Delete Selected</Button></div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title="Delete Selected Wall Items" onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={onConfirmDelete} loading={isDeleting}>
        <p>Are you sure you want to delete {selectedItems.length} selected item{selectedItems.length > 1 ? "s" : ""}?{" "}</p>
      </ConfirmDialog>
    </>
  );
};

const BookmarkButton = React.memo(({ is_bookmarked }: { is_bookmarked: boolean }) => (
  <Tooltip title={is_bookmarked ? "Bookmarked" : "Not Bookmarked"}>
    <button
      onClick={(e) => e.stopPropagation()}
      className="p-0 m-0 bg-transparent border-none cursor-pointer"
    >
      <TbBookmark
        size={14}
        className={is_bookmarked ? "text-amber-500 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"}
      />
    </button>
  </Tooltip>
));
BookmarkButton.displayName = 'BookmarkButton';


// --- Main Component ---
const WallListing = ({ isDashboard }: { isDashboard?: boolean }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const initialFilterState = useMemo(() => ({
    statuses: [],
    assignedTo: [],
    memberTypes: [],
    continents: [],
    countries: [],
    states: '',
    cities: '',
    pincodes: '',
    kycVerified: null as 'yes' | 'no' | null,
    categories: [],
    subCategories: [],
    brands: [],
    products: [],
    productStatuses: [],
    productSpecs: [],
    wantTo: [],
  }), []);

  const { user } = useSelector(authSelector);
  const { wallListing, AllProductsData = [], ParentCategories, subCategoriesForSelectedCategoryData, BrandData, MemberTypeData, ProductSpecificationsData, Employees, AllCompanyData, getAllUserData, status: masterLoadingStatus } = useSelector(masterSelector, shallowEqual);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WallItem | null>(null);
  const [deleteSelectedConfirmOpen, setDeleteSelectedConfirmOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [selectedItems, setSelectedItems] = useState<WallItem[]>([]);
  const [modalState, setModalState] = useState<WallModalState>({ isOpen: false, type: null, data: null });
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(filterFormSchema.parse({}));
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

  // --- ADDED for Image Viewer ---
  const [imageView, setImageView] = useState('');
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const openImageViewer = useCallback((path: string | null | undefined) => {
    if (path) {
      setImageView(path);
      setIsImageViewerOpen(true);
    } else {
      toast.push(<Notification title="No Image" type="info">User has no profile picture.</Notification>);
    }
  }, []);

  const closeImageViewer = useCallback(() => {
    setIsImageViewerOpen(false);
    setImageView('');
  }, []);


  const mapApiToWallItem = useCallback(
    (apiItem: ApiWallItemFromSource): WallItem => ({
      id: apiItem.id as number,
      productId: apiItem.product_id,
      product_name: apiItem.product?.name || 'N/A',
      company_name: apiItem.company_name || "",
      companyId: apiItem.company_id || undefined,
      member_name: apiItem.member?.name || 'N/A',
      memberId: String(apiItem.member?.id || ""),
      memberTypeId: apiItem.member_type_id,
      member_email: apiItem.member?.email || "",
      member_phone: apiItem.member?.number || "",
      product_category: apiItem.product?.category?.name || "",
      productCategoryId: apiItem.product?.category_id,
      product_subcategory: apiItem.product?.sub_category?.name || "",
      subCategoryId: apiItem.product?.sub_category_id,
      product_description: apiItem.product?.description || "",
      product_specs: apiItem.product_spec?.name || "",
      productSpecId: apiItem.product_spec_id,
      product_status: apiItem.product_status,
      quantity: Number(apiItem.qty) || 0,
      price: Number(apiItem.price) || 0,
      want_to: apiItem.want_to as WallIntent | string,
      listing_type: apiItem.listing_type || "",
      shipping_options: apiItem.shipping_options || "",
      payment_method: apiItem.payment_method || "",
      warranty: apiItem.warranty_info || "",
      return_policy: apiItem.return_policy || "",
      listing_url: apiItem.product_url || "",
      brand: apiItem.product?.brand?.name || "",
      brandId: apiItem.product?.brand_id,
      product_images: apiItem.product?.product_images_array || [],
      created_date: new Date(apiItem.created_at),
      updated_at: new Date(apiItem.updated_at),
      visibility: apiItem.visibility || "",
      priority: apiItem.priority || "",
      assigned_to: apiItem.assigned_to_name || "",
      interaction_type: apiItem.interaction_type || "",
      action: apiItem.action || "",
      recordStatus: apiItem.status as WallRecordStatus,
      cartoonTypeId: apiItem.cartoon_type_id,
      created_from: apiItem.created_from || "",
      deviceCondition: (apiItem.device_condition as WallProductCondition | null) || null,
      inquiry_count: Number(apiItem.inquiries) || 0,
      share_count: Number(apiItem.share) || 0,
      is_bookmarked: apiItem.bookmark === 1,
      updated_by_user: apiItem.updated_by_user || null,
      createdById: apiItem.created_by,
      member: apiItem?.member || null,
    }),
    []
  );

  const apiParams = useMemo(() => {
    const formatMultiSelect = (items: { value: any }[] | undefined) => { if (!items || items.length === 0) return undefined; return items.map((item) => item.value).join(","); };
    const params: any = { page: tableData.pageIndex, per_page: tableData.pageSize, search: tableData.query || undefined, sort_by: tableData.sort?.key || undefined, sort_order: tableData.sort?.order || undefined, status: formatMultiSelect(filterCriteria.filterRecordStatuses), company_ids: formatMultiSelect(filterCriteria.filterCompanyIds), want_to: formatMultiSelect(filterCriteria.filterIntents), product_ids: formatMultiSelect(filterCriteria.filterProductIds), category_ids: formatMultiSelect(filterCriteria.categories), subcategory_ids: formatMultiSelect(filterCriteria.subcategories), brand_ids: formatMultiSelect(filterCriteria.brands), product_status: formatMultiSelect(filterCriteria.productStatus), member_type_ids: formatMultiSelect(filterCriteria.memberType), created_by_ids: formatMultiSelect(filterCriteria.createdBy), product_spec_ids: formatMultiSelect(filterCriteria.productSpec), source: formatMultiSelect(filterCriteria.source) };
    if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) {
      params.start_date = filterCriteria.dateRange[0] ? dayjs(filterCriteria.dateRange[0]).format("YYYY-MM-DD") : undefined;
      params.end_date = filterCriteria.dateRange[1] ? dayjs(filterCriteria.dateRange[1]).format("YYYY-MM-DD") : undefined;
    }
    if (filterCriteria.quickFilters) {
      if (filterCriteria.quickFilters.type === 'intent') params.want_to = filterCriteria.quickFilters.value;
      if (filterCriteria.quickFilters.type === 'status') params.status = filterCriteria.quickFilters.value;
    }
    Object.keys(params).forEach((key) => { if (params[key] === undefined || params[key] === null) { delete params[key]; } });
    return params;
  }, [tableData, filterCriteria]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          dispatch(getWallListingAction(apiParams)),
          dispatch(getProductsDataAsync()),
          dispatch(getParentCategoriesAction()),
          dispatch(getSubcategoriesByCategoryIdAction(0)),
          dispatch(getBrandAction()),
          dispatch(getMemberTypeAction()),
          dispatch(getProductSpecificationsAction()),
          dispatch(getEmployeesAction()),
          dispatch(getAllCompany()),
          dispatch(getAllUsersAction())
        ]);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        toast.push(<Notification type="danger" title="Error">Could not load initial data.</Notification>);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, [dispatch]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (!initialLoading) {
        dispatch(getWallListingAction(apiParams));
      }
    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, [dispatch, apiParams, initialLoading]);

  const pageData = useMemo(() => { return Array.isArray(wallListing?.data?.data) ? wallListing.data.data.map(mapApiToWallItem) : []; }, [wallListing, mapApiToWallItem]);
  const total = wallListing?.data?.total || 0;

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const openAddDrawer = useCallback(() => navigate("/sales-leads/wall-item/add"), [navigate]);
  const openEditDrawer = useCallback((item: WallItem) => navigate("/sales-leads/wall-item/add", { state: item?.id }), [navigate]);
  const openViewDrawer = useCallback((item: WallItem) => { navigate(`/sales-leads/wall-item/${item.id}`) }, []);
  const closeViewDrawer = useCallback(() => { setIsViewDrawerOpen(false); setEditingItem(null); }, []);
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleOpenModal = useCallback((type: WallModalType, wallItem: WallItem) => {
    setModalState({ isOpen: true, type, data: wallItem });
  }, []);
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

  const handleSendEmail = useCallback((item: WallItem) => {
    if (!item.member_email) {
      toast.push(<Notification type="warning" title="No Email Address" children="This member does not have a valid email address." />);
      return;
    }
    const subject = `Regarding your wall listing: ${item.product_name}`;
    const body = `Dear ${item.member_name},\n\nI am interested in your listing for "${item.product_name}".\n\nKind regards,`;
    window.open(`mailto:${item.member_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }, []);

  const handleSendWhatsapp = useCallback((item: WallItem) => {
    const phone = item.member_phone?.replace(/\D/g, '');
    if (!phone) {
      toast.push(<Notification type="warning" title="No Mobile Number" children="This member does not have a valid phone number." />);
      return;
    }
    const message = `Hi ${item.member_name}, I'm interested in your listing for "${item.product_name}".`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  }, []);

  const onConfirmDeleteSelectedItems = useCallback(async () => {
    if (selectedItems.length === 0) { toast.push(<Notification title="No items selected" type="info">Please select items to delete.</Notification>); return; }
    setDeleteSelectedConfirmOpen(false);
    const ids = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatch(deleteAllWallAction({ ids })).unwrap();
      toast.push(<Notification title="Success" type="success">{selectedItems.length} item(s) deleted.</Notification>);
      setSelectedItems([]); dispatch(getWallListingAction(apiParams));
    } catch (error: any) { toast.push(<Notification title="Error" type="danger">{error.message || "Bulk delete failed."}</Notification>); }
  }, [dispatch, selectedItems, apiParams]);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(prev => ({ ...prev, ...data, quickFilters: null })); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
  const onClearFilters = useCallback(() => { const defaults = filterFormSchema.parse({}); filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ query: "", pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);

  const handleCardClick = (type: string, value: string) => {
    onClearFilters();
    if (type === 'status') {
      const statusOption = recordStatusOptions.find(opt => opt.value.toLowerCase() === value.toLowerCase());
      if (statusOption) setFilterCriteria({ ...initialFilterState, filterRecordStatuses: [statusOption] });
    } else if (type === 'intent') {
      const intentOption = intentOptions.find(opt => opt.value.toLowerCase() === value.toLowerCase());
      if (intentOption) setFilterCriteria({ ...initialFilterState, filterIntents: [intentOption] });
    }
  };

  const handleRemoveFilter = useCallback((key: keyof FilterFormData, value: any) => {
    setFilterCriteria(prev => {
      const newFilters = { ...prev };
      const currentValues = prev[key] as { value: any }[] | undefined;
      if (Array.isArray(currentValues)) {
        (newFilters as any)[key] = currentValues.filter(item => item.value !== value.value);
      } else {
        (newFilters as any)[key] = null; // for quickFilters
      }
      return newFilters;
    });
  }, []);

  const handleOpenExportReasonModal = useCallback(() => {
    if (total === 0) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true);
  }, [total, exportReasonFormMethods]);
  const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "WallListing"; const timestamp = dayjs().format("YYYY-MM-DD"); const fileName = `wall_listing_export_${timestamp}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName, })).unwrap();
      toast.push(<Notification title="Reason Submitted" type="info" duration={2000} message="Now fetching data for export..." />);
      const exportParams = { ...apiParams, per_page: 0, page: 1 };
      const exportDataResponse = await dispatch(getWallListingAction(exportParams)).unwrap();
      if (!exportDataResponse?.status) { throw new Error(exportDataResponse?.message || "Failed to fetch data for export."); }
      const allFilteredData = (exportDataResponse?.data?.data || []).map(mapApiToWallItem);
      const success = exportWallItemsToCsv(fileName, allFilteredData);
      if (success) { setIsExportReasonModalOpen(false); }
    } catch (error: any) { toast.push(<Notification title="Failed to Export" type="danger" message={error.message || "An unknown error occurred"} />); } finally { setIsSubmittingExportReason(false); }
  }, [apiParams, dispatch, mapApiToWallItem]);

  const handlePaginationChange = (page: number) => handleSetTableData({ pageIndex: page });
  const handlePageSizeChange = (value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]); };
  const handleSort = (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 });
  const handleSearchChange = (query: string) => handleSetTableData({ query, pageIndex: 1 });
  const handleRowSelect = (checked: boolean, row: WallItem) => setSelectedItems((prev) => checked ? [...prev, row] : prev.filter((item) => item.id !== row.id));
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<WallItem>[]) => {
    const originals = currentRows.map((r) => r.original);
    if (checked) { setSelectedItems((prev) => { const oldIds = new Set(prev.map((i) => i.id)); return [...prev, ...originals.filter((o) => !oldIds.has(o.id))]; }); } else { const currentIds = new Set(originals.map((o) => o.id)); setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id))); }
  }, []);
  const handleImportData = useCallback(() => setImportDialogOpen(true), []);
  const handleImportFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { toast.push(<Notification title="Import Started" type="info">File processing initiated. (Dummy)</Notification>); setImportDialogOpen(false); }
    if (event.target) event.target.value = "";
  }, []);

  // --- Columns Definition ---
  const columns: ColumnDef<WallItem>[] = useMemo(
    () => {
      const baseColumns: ColumnDef<WallItem>[] = [
        {
          header: "Overview", accessorKey: "product_name", size: 280, cell: ({ row }) => {
            const { product_images, product_name, id, want_to, recordStatus } = row?.original || {}; const intent = want_to as WallIntent;
            return (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold leading-normal text-xs text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">{product_name}</div>
                </div>
                {/* <span className="text-xs mt-2"><span className="font-semibold">ID :</span> {id || "N/A"}</span> */}
                <div className="flex flex-col gap-1 text-xs">
                  {recordStatus && (
                    <div className="flex items-center gap-2">
                      <Tag className={`${recordStatusColor[recordStatus] || recordStatusColor.Pending} font-semibold capitalize`}>
                        {recordStatus}
                      </Tag>
                      {want_to && (
                        <Tag className={`capitalize text-xs px-1 py-0.5 ${intentTagColor[intent] || productApiStatusColor.default}`}>
                          {want_to}
                        </Tag>
                      )}
                    </div>
                  )}
                </div>
                {/* <span className="text-xs"></span> */}
              </div>
            );
          },
        },
        {
          header: "Member", accessorKey: "member", size: 260, cell: ({ row }) => {
            const { name, member_code, email, number } = row.original?.member || {};
            return (
              <div className="flex flex-col gap-0.5 text-xs">
                <div className="mt-1 pt-1 dark:border-gray-700 w-full">
                  {member_code && (<span className="font-semibold text-gray-500 dark:text-gray-400">{member_code} </span>)}
                  {name && (<span className="font-semibold text-gray-800 dark:text-gray-100">{name}</span>)}
                  {email && (<a href={`mailto:${email}`} className="block text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">{email}</a>)}
                  {number && (<span className="block text-gray-600 dark:text-gray-300">{number}</span>)}
                </div>
              </div>
            );
          },
        },
        {
          header: "Details", accessorKey: "product_category", size: 280, cell: ({ row }) => {
            const { product_category, product_subcategory, product_specs, product_status, cartoonTypeId, created_from, deviceCondition, quantity } = row?.original || {};
            const currentProductApiStatus = product_status?.toLowerCase() || "default";
            const cartoonTypeName = dummyCartoonTypes.find((ct) => ct.id === cartoonTypeId)?.name;
            return (
              <div className="flex flex-col gap-0.5 text-xs">
                <div className="flex items-center"><TbStack2 className="text-base text-blue-500 dark:text-blue-400 ml-2" /><span className="text-gray-700 dark:text-gray-300" style={{ minWidth: 35 }}>Qty: {quantity ?? "N/A"}</span></div>
                <span>{product_category || "N/A"}{product_subcategory ? ` / ${product_subcategory}` : ""}</span>
                {product_specs && (<Tooltip title={product_specs}><span className="truncate max-w-[250px]">{product_specs.length > 30 ? product_specs.substring(0, 30) + "..." : product_specs}</span></Tooltip>)}
                {created_from && (<span><b>Created from:</b> {created_from}</span>)}
                {product_status && (<span><Tag className={`capitalize text-xs px-1 py-0.5 ${productApiStatusColor[currentProductApiStatus] || productApiStatusColor.default}`}>{product_status}</Tag></span>)}
                {cartoonTypeName && (<span>{cartoonTypeName}</span>)}
                {deviceCondition && (<span>{deviceCondition}</span>)}
              </div>
            );
          },
        },
      ];

      if (!isDashboard) {
        baseColumns.push({
          header: "Actions", id: "actions", size: 120, meta: { HeaderClass: "text-center" },
          cell: (props: CellContext<WallItem, any>) => (
            <StyledActionColumn
              onViewDetail={() => openViewDrawer(props.row.original)}
              onEdit={() => openEditDrawer(props.row.original)}
              onOpenModal={handleOpenModal}
              onSendEmail={() => handleSendEmail(props.row.original)}
              onSendWhatsapp={() => handleSendWhatsapp(props.row.original)}
              rowData={props.row.original}
            />
          ),
        });
      }

      return baseColumns;
    },
    [isDashboard, openViewDrawer, openEditDrawer, handleOpenModal, handleSendEmail, handleSendWhatsapp, openImageViewer]
  );

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<WallItem>[]>([]);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterRecordStatuses?.length) count++;
    if (filterCriteria.filterIntents?.length) count++;
    if (filterCriteria.filterProductIds?.length) count++;
    if (filterCriteria.filterCompanyIds?.length) count++;
    if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) count++;
    if (filterCriteria.quickFilters) count++;
    return count;
  }, [filterCriteria]);

  const counts = wallListing?.counts || { active: 0, buy: 0, non_active: 0, pending: 0, rejected: 0, sell: 0, today: 0, total: 0 };
  const cardClass = "rounded-sm border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";

  const renderCardContent = (content: number | undefined, colorClass: string) => {
    if (initialLoading) {
      return <Skeleton width={40} height={20} />;
    }
    return <b className={colorClass}>{content ?? 0}</b>;
  };

  const skeletonColumns: ColumnDef<WallItem>[] = useMemo(() =>
    columns.map((column) => ({
      ...column,
      cell: () => <Skeleton height={40} className="my-2" />,
    })),
    [columns]
  );

  const skeletonData = useMemo(() =>
    Array.from({ length: tableData.pageSize }, (_, i) => ({ id: `skeleton-${i}` } as any)),
    [tableData.pageSize]
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          {!isDashboard && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h5 className="mb-2 sm:mb-0">Wall Listing</h5>
              <div className="flex gap-2"><Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={initialLoading}>Add New</Button></div>
            </div>
          )}
          {!isDashboard && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-4 mt-4 gap-2 ">
              <Tooltip title="Click to show all listings"><div onClick={onClearFilters}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-blue-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbListDetails size={20} /></div><div className="flex flex-col">{renderCardContent(counts.total, "text-blue-500")}<span className="font-semibold text-[11px]">Total</span></div></Card></div></Tooltip>
              <Tooltip title="Click to show listings created today"><div onClick={() => handleCardClick('status', 'today')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-emerald-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbCalendar size={20} /></div><div className="flex flex-col">{renderCardContent(counts.today, "text-emerald-500")}<span className="font-semibold text-[11px]">Today</span></div></Card></div></Tooltip>
              <Tooltip title="Click to show 'Buy' listings"><div onClick={() => handleCardClick('intent', 'Buy')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-violet-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbBox size={20} /></div><div className="flex flex-col">{renderCardContent(counts.buy, "text-violet-500")}<span className="font-semibold text-[11px]">Buy</span></div></Card></div></Tooltip>
              <Tooltip title="Click to show 'Sell' listings"><div onClick={() => handleCardClick('intent', 'Sell')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-pink-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbPackageExport size={20} /></div><div className="flex flex-col">{renderCardContent(counts.sell, "text-pink-500")}<span className="font-semibold text-[11px]">Sell</span></div></Card></div></Tooltip>
              <Tooltip title="Click to show active listings"><div onClick={() => handleCardClick('status', 'Active')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-green-300")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbCircleCheck size={20} /></div><div className="flex flex-col">{renderCardContent(counts.active, "text-green-500")}<span className="font-semibold text-[11px]">Active</span></div></Card></div></Tooltip>
              <Tooltip title="Click to show non-active listings"><div onClick={() => handleCardClick('status', 'Non-Active')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-red-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCancel size={20} /></div><div className="flex flex-col">{renderCardContent(counts.non_active, "text-red-500")}<span className="font-semibold text-[11px]">Non Active</span></div></Card></div></Tooltip>
              <Tooltip title="Click to show pending listings"><div onClick={() => handleCardClick('status', 'Pending')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-orange-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbProgress size={20} /></div><div className="flex flex-col">{renderCardContent(counts.pending, "text-orange-500")}<span className="font-semibold text-[11px]">Pending</span></div></Card></div></Tooltip>
              <Tooltip title="Click to show rejected listings"><div onClick={() => handleCardClick('status', 'Rejected')}><Card bodyClass="flex gap-2 p-1" className={classNames(cardClass, "border-red-200")}><div className="h-9 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbBoxOff size={20} /></div><div className="flex flex-col">{renderCardContent(counts.rejected, "text-red-500")}<span className="font-semibold text-[11px]">Rejected</span></div></Card></div></Tooltip>
            </div>
          )}
          <WallTableTools isDashboard={!!isDashboard} onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onImport={handleImportData} onClearFilters={onClearFilters} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
          {!isDashboard && <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />}
          <div className="mt-4">
            {initialLoading ? (
              <WallTable
                columns={skeletonColumns}
                data={skeletonData}
                loading={false}
                selectable={false}
                pagingData={{ total: tableData.pageSize, pageIndex: 1, pageSize: tableData.pageSize }}
                onPaginationChange={() => { }} onSelectChange={() => { }} onRowSelect={() => { }} onAllRowSelect={() => { }} onSort={() => { }}
                selectedItems={[]}
              />
            ) : (
              <WallTable
                selectable={!isDashboard}
                columns={filteredColumns} data={pageData} loading={masterLoadingStatus === "loading" && !initialLoading}
                pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
                selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} onSort={handleSort} />
            )}
          </div>
        </AdaptiveCard>
      </Container>
      {!isDashboard && (
        <WallSelectedFooter selectedItems={selectedItems} deleteConfirmOpen={deleteSelectedConfirmOpen} setDeleteConfirmOpen={setDeleteSelectedConfirmOpen} onConfirmDelete={onConfirmDeleteSelectedItems} isDeleting={masterLoadingStatus === "loading"} />
      )}
      <WallModals modalState={modalState} onClose={handleCloseModal} user={user} getAllUserDataOptions={useMemo(() => getAllUserData?.map((user: any) => ({ value: user?.id, label: user?.name })), [getAllUserData])} />
      <Drawer title="View Wall Item Details" isOpen={isViewDrawerOpen} onClose={closeViewDrawer} onRequestClose={closeViewDrawer} width={700}>
        {editingItem && (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {Object.entries(editingItem).filter(([key]) => !["product_images", "product_name", "id"].includes(key)).map(([key, value]) => (
                <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <strong className="capitalize text-gray-700 dark:text-gray-200">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:</strong>{" "}
                  <span className="text-gray-600 dark:text-gray-400">{value instanceof Date ? dayjs(value).format("MMM D, YYYY h:mm A") : value !== null && value !== "" ? String(value) : "N/A"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={540}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear All</Button>
            <Button size="sm" variant="solid" form="filterWallForm" type="submit">Apply</Button>
          </div>
        }
      >
        <Form id="filterWallForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col h-full">
          <div className="overflow-y-auto p-1 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem label="Workflow Status"><Controller name="filterRecordStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status..." options={recordStatusOptions} {...field} />)} /></FormItem>
              <FormItem label="Companies"><Controller name="filterCompanyIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select companies..." options={AllCompanyData?.map((p: any) => ({ value: p.id, label: p.company_name }))} {...field} />)} /></FormItem>
              <FormItem label="Intent (Want to)"><Controller name="filterIntents" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select intents..." options={intentOptions} {...field} />)} /></FormItem>
              <FormItem label="Products"><Controller name="filterProductIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select products..." options={AllProductsData?.map((p: any) => ({ value: p.id, label: p.name })) || []} {...field} />)} /></FormItem>
              <FormItem label="Categories"><Controller name="categories" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Categories..." options={ParentCategories.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Sub Categories"><Controller name="subcategories" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Sub Cate..." options={subCategoriesForSelectedCategoryData?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Brands"><Controller name="brands" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Brands..." options={BrandData?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Availability Status"><Controller name="productStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Availability..." options={Object.keys(productApiStatusColor).filter((k) => k !== "default").map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))} {...field} />)} /></FormItem>
              <FormItem label="Created Date Range"><Controller name="dateRange" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange value={field.value as [Date | null, Date | null] | null} onChange={field.onChange} placeholder="Select date range" />)} /></FormItem>
              {/* <FormItem label="Source (Example)"><Controller name="source" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Source..." options={[{ label: "Web", value: "web" }, { label: "App", value: "app" }]} {...field} />)} /></FormItem> */}
              <FormItem label="Product Spec (Example)"><Controller name="productSpec" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Product Spec..." options={ProductSpecificationsData?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Member Type (Example)"><Controller name="memberType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Member Type..." options={MemberTypeData?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
              <FormItem label="Created By (Example)"><Controller name="createdBy" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Employee..." options={Employees?.map((p: any) => ({ value: p.id, label: p.name }))} {...field} />)} /></FormItem>
            </div>
          </div>
        </Form>
      </Drawer>
      <Dialog isOpen={importDialogOpen} onClose={() => setImportDialogOpen(false)} onRequestClose={() => setImportDialogOpen(false)} title="Import Wall Items">
        <div className="p-4">
          <p>Upload a CSV file to import Wall Items. (This is a dummy import)</p>
          <FormItem label="CSV File"><Input type="file" accept=".csv" onChange={handleImportFileSelect} /></FormItem>
          <div className="text-right mt-4"><Button size="sm" onClick={() => setImportDialogOpen(false)}>Cancel</Button></div>
        </div>
      </Dialog>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
        <Form id="exportReasonForm" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 mt-2">
          <FormItem label="Please provide a reason for exporting this data:" isRequired invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>
      {/* --- ADDED Image Viewer Dialog --- */}
      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} width={600}>
        <div className="flex justify-center items-center p-4">{imageView ? <img src={imageView} alt="User" className="max-w-full max-h-[80vh]" /> : <p>No image.</p>}</div>
      </Dialog>
    </>
  );
};

export default WallListing;