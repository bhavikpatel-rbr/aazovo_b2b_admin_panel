import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import cloneDeep from "lodash/cloneDeep";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
import RichTextEditor from "@/components/shared/RichTextEditor";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Input,
  Select,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
} from "@/components/ui";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";


// Icons
import {
  TbAlarm,
  TbArrowDown,
  TbBell,
  TbBrandWhatsapp,
  TbCalendarEvent,
  TbChecks,
  TbCircleCheck,
  TbCircleX,
  TbCloudUpload,
  TbColumns,
  TbEye,
  TbFilter,
  TbListDetails,
  TbMail,
  TbPencil,
  TbPlus,
  TbProgress,
  TbReload,
  TbSearch,
  TbUrgent,
  TbUser,
  TbUsers,
  TbX
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";

// Redux imports
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addNotificationAction,
  addScheduleAction,
  addTaskAction,
  deleteAllInquiryAction,
  editInquiriesAction,
  getAllUsersAction, // MODIFIED: Added edit action
  getDepartmentsAction,
  getInquiriesAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import axiosInstance from '@/services/api/api'; // ADDED: For direct API calls
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";
import dayjs from "dayjs";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useSelector } from "react-redux";
import shallowEqual from "@/components/ui/utils/shallowEqual";

// --- Export Reason Schema ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Zod Schema for Schedule Form ---
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

// --- Zod Schema for Task Form ---
const taskValidationSchema = z.object({
  task_title: z.string().min(3, "Task title must be at least 3 characters."),
  assign_to: z.array(z.number()).min(1, "At least one assignee is required."),
  priority: z.string().min(1, "Please select a priority."),
  due_date: z.date().nullable().optional(),
  description: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskValidationSchema>;

// --- Zod Schema for Status Update Form ---
const statusUpdateSchema = z.object({
  status: z.string().min(1, "Status is required."),
});
type StatusUpdateFormData = z.infer<typeof statusUpdateSchema>;

const assigntoUpdateSchema = z.object({
  assigned_to: z.string().min(1, "Assign Person is required."),
});
type AssignUpdateFormData = z.infer<typeof assigntoUpdateSchema>;

// ============================================================================
// --- HELPER FUNCTIONS ---
// ============================================================================

const formatDateForApi = (date: Date | string | null | undefined): string | null => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null; // Invalid date
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
};


// ============================================================================
// --- MODALS SECTION ---
// ============================================================================

// --- Type Definitions for Modals ---
export type InquiryModalType = "notification" | "schedule" | "task" | "statusUpdate" | "assignUpdate"; // MODIFIED
export interface InquiryModalState {
  isOpen: boolean;
  type: InquiryModalType | null;
  data: InquiryItem | null;
}
export type SelectOption = { value: any; label: string };

// --- Notification Dialog ---
const AddInquiryNotificationDialog: React.FC<{
  inquiry: InquiryItem;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}> = ({ inquiry, onClose, getAllUserDataOptions }) => {
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
      notification_title: `Regarding Inquiry: ${inquiry.inquiry_id}`,
      send_users: [],
      message: `This is a notification for inquiry "${inquiry.inquiry_id}" from ${inquiry.company_name}. Please review the details.`,
    },
    mode: "onChange",
  });

  const onSend = async (formData: NotificationFormData) => {
    setIsLoading(true);
    const payload = {
      send_users: formData.send_users,
      notification_title: formData.notification_title,
      message: formData.message,
      module_id: String(inquiry.id),
      module_name: "Inquiry",
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
      <h5 className="mb-4">Notify User about: {inquiry.inquiry_id}</h5>
      <UiForm onSubmit={handleSubmit(onSend)}>
        <UiFormItem
          label="Title"
          invalid={!!errors.notification_title}
          errorMessage={errors.notification_title?.message}
        >
          <Controller
            name="notification_title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </UiFormItem>
        <UiFormItem
          label="Send To"
          invalid={!!errors.send_users}
          errorMessage={errors.send_users?.message}
        >
          <Controller
            name="send_users"
            control={control}
            render={({ field }) => (
              <UiSelect
                isMulti
                placeholder="Select User(s)"
                options={getAllUserDataOptions}
                value={getAllUserDataOptions.filter((o) =>
                  field.value?.includes(o.value)
                )}
                onChange={(options) =>
                  field.onChange(options?.map((o) => o.value) || [])
                }
              />
            )}
          />
        </UiFormItem>
        <UiFormItem
          label="Message"
          invalid={!!errors.message}
          errorMessage={errors.message?.message}
        >
          <Controller
            name="message"
            control={control}
            render={({ field }) => <Input textArea {...field} rows={4} />}
          />
        </UiFormItem>
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
            Send Notification
          </Button>
        </div>
      </UiForm>
    </Dialog>
  );
};

// --- Schedule Dialog ---
const AddInquiryScheduleDialog: React.FC<{
  inquiry: InquiryItem;
  onClose: () => void;
}> = ({ inquiry, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
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
  ];

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_title: `Follow-up on Inquiry ${inquiry.inquiry_id}`,
      event_type: undefined,
      date_time: null as any,
      remind_from: null,
      notes: `Regarding inquiry from ${inquiry.company_name} about "${inquiry.inquiry_subject}".`,
    },
    mode: "onChange",
  });

  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = {
      module_id: Number(inquiry.id),
      module_name: "Inquiry",
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
          children={`Successfully scheduled event for inquiry ${inquiry.inquiry_id}.`}
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
      <h5 className="mb-4">Add Schedule for Inquiry: {inquiry.inquiry_id}</h5>
      <UiForm onSubmit={handleSubmit(onAddEvent)}>
        <UiFormItem
          label="Event Title"
          invalid={!!errors.event_title}
          errorMessage={errors.event_title?.message}
        >
          <Controller
            name="event_title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </UiFormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiFormItem
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
          </UiFormItem>
          <UiFormItem
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
          </UiFormItem>
        </div>
        <UiFormItem
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
        </UiFormItem>
        <UiFormItem
          label="Notes"
          invalid={!!errors.notes}
          errorMessage={errors.notes?.message}
        >
          <Controller
            name="notes"
            control={control}
            render={({ field }) => <Input textArea {...field} />}
          />
        </UiFormItem>
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
      </UiForm>
    </Dialog>
  );
};

// --- Assign Task Dialog ---
const AssignTaskDialog: React.FC<{
  inquiry: InquiryItem;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}> = ({ inquiry, onClose, getAllUserDataOptions }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const priorityOptions = [
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ];

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskValidationSchema),
    defaultValues: {
      task_title: `Follow up on Inquiry: ${inquiry.inquiry_id}`,
      assign_to: [],
      priority: "Medium",
      due_date: null,
      description: `Follow up regarding inquiry from ${inquiry.company_name} about "${inquiry.inquiry_subject}".`,
    },
    mode: "onChange",
  });

  const onAssignTask = async (data: TaskFormData) => {
    setIsLoading(true);
    const payload = {
      ...data,
      due_date: data.due_date
        ? dayjs(data.due_date).format("YYYY-MM-DD")
        : undefined,
      module_id: String(inquiry.id),
      module_name: "Inquiry",
    };

    try {
      await dispatch(addTaskAction(payload)).unwrap();
      toast.push(
        <Notification
          type="success"
          title="Task Assigned"
          children={`Successfully assigned task for inquiry ${inquiry.inquiry_id}.`}
        />
      );
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Task Assignment Failed"
          children={error?.message || "An unknown error occurred."}
        />
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for Inquiry: {inquiry.inquiry_id}</h5>
      <UiForm onSubmit={handleSubmit(onAssignTask)}>
        <UiFormItem
          label="Task Title"
          invalid={!!errors.task_title}
          errorMessage={errors.task_title?.message}
        >
          <Controller
            name="task_title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </UiFormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiFormItem
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
                  placeholder="Select User(s)"
                  options={getAllUserDataOptions}
                  value={getAllUserDataOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts: any) =>
                    field.onChange(opts?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </UiFormItem>
          <UiFormItem
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
          </UiFormItem>
        </div>
        <UiFormItem
          label="Due Date (Optional)"
          invalid={!!errors.due_date}
          errorMessage={errors.due_date?.message}
        >
          <Controller
            name="due_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                placeholder="Select a date"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </UiFormItem>
        <UiFormItem
          label="Description"
          invalid={!!errors.description}
          errorMessage={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => <Input textArea {...field} rows={4} />}
          />
        </UiFormItem>
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
            Assign Task
          </Button>
        </div>
      </UiForm>
    </Dialog>
  );
};

// --- Status Update Dialog (ADDED) ---
const StatusUpdateModal: React.FC<{
  inquiry: InquiryItem;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ inquiry, onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const statusOptions = [
    { value: "Open", label: "Open" },
    { value: "In Progress", label: "In Progress" },
    { value: "Resolved", label: "Resolved" },
    { value: "On Hold", label: "On Hold" },
    { value: "Rejected", label: "Rejected" },
    { value: "Closed", label: "Closed" }
  ];

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<StatusUpdateFormData>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: inquiry.inquiry_status || '' },
    mode: 'onChange',
  });

  const handleStatusUpdate = async (formData: StatusUpdateFormData) => {
    setIsLoading(true);
    try {
      // 1. Fetch the full, most up-to-date inquiry data
      const response = await axiosInstance.get(`/inquiry/${inquiry.id}`);
      if (!response.data?.data) {
        throw new Error("Failed to fetch latest inquiry data.");
      }
      const apiData = response.data.data;

      // 2. Construct the payload as FormData, preserving all original data
      const formDataPayload = new FormData();
      const payloadObject: { [key: string]: any } = {
        company_name: apiData.company_name,
        name: apiData.name,
        email: apiData.email,
        mobile_no: apiData.mobile_no,
        inquiry_type: apiData.inquiry_type,
        inquiry_subject: apiData.inquiry_subject,
        priority: apiData.priority || apiData.inquiry_priority,
        inquiry_description: apiData.inquiry_description,
        status: formData.status, // Use the new status from the form
        assigned_to: apiData.assigned_to,
        department_id: apiData.department_id,
        inquiry_date: formatDateForApi(apiData.inquiry_date),
        response_date: formatDateForApi(apiData.response_date),
        resolution_date: formatDateForApi(apiData.resolution_date),
        resolution_notes: apiData.resolution_notes,
        last_follow_up_date: formatDateForApi(apiData.last_follow_up_date),
        feedback_status: apiData.feedback_status,
        inquiry_from: apiData.inquiry_from,
      };

      for (const key in payloadObject) {
        if (Object.prototype.hasOwnProperty.call(payloadObject, key)) {
          const value = payloadObject[key];
          if (value !== undefined && value !== null) {
            formDataPayload.append(key, String(value));
          }
        }
      }

      formDataPayload.append('id', String(inquiry.id));
      formDataPayload.append('_method', 'PUT');

      // 3. Dispatch the edit action
      await dispatch(editInquiriesAction({ id: inquiry.id, data: formDataPayload })).unwrap();

      toast.push(<Notification type="success" title="Status Updated">Inquiry status changed successfully.</Notification>);
      onSuccess(); // This will trigger a data refresh in the parent component
      onClose();

    } catch (error: any) {
      console.error("Status Update Error:", error);
      const errorMessage = error?.payload?.message || error.message || "An unknown error occurred.";
      toast.push(<Notification type="danger" title="Update Failed">{errorMessage}</Notification>);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Change Status for: {inquiry.inquiry_id}</h5>
      <p className="mb-1 text-sm">Company: <span className="font-semibold">{inquiry.company_name}</span></p>
      <p className="mb-4 text-sm">Current Status: <span className="font-semibold">{inquiry.inquiry_status}</span></p>

      <UiForm onSubmit={handleSubmit(handleStatusUpdate)}>
        <UiFormItem
          label="New Status"
          invalid={!!errors.status}
          errorMessage={errors.status?.message}
        >
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <UiSelect
                placeholder="Select a new status"
                options={statusOptions}
                value={statusOptions.find(o => o.value === field.value)}
                onChange={opt => field.onChange(opt?.value)}
              />
            )}
          />
        </UiFormItem>

        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>
            Update Status
          </Button>
        </div>
      </UiForm>
    </Dialog>
  );
};

type ApiLookupItem = { id: string | number; name: string;[key: string]: any; };
const AssignToUpdateModal: React.FC<{
  inquiry: InquiryItem;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ inquiry, onClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  const { usersData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);

  const [isLoading, setIsLoading] = useState(false);
  const usersDataOptions = useMemo(() => Array.isArray(usersData) ? usersData.map((sp: ApiLookupItem) => ({ value: String(sp.id), label: `(${sp.employee_id}) - ${sp.name || 'N/A'}` })) : [], [usersData]);


  const { control, handleSubmit, formState: { errors, isValid } } = useForm<AssignUpdateFormData>({
    resolver: zodResolver(assigntoUpdateSchema),
    defaultValues: { assigned_to: inquiry.assigned_to || '' },
    mode: 'onChange',
  });

  const handleAssignToUpdate = async (formData: AssignUpdateFormData) => {
    setIsLoading(true);
    try {
      // 1. Fetch the full, most up-to-date inquiry data
      const response = await axiosInstance.get(`/inquiry/${inquiry.id}`);
      if (!response.data?.data) {
        throw new Error("Failed to fetch latest inquiry data.");
      }
      const apiData = response.data.data;

      // 2. Construct the payload as FormData, preserving all original data
      const formDataPayload = new FormData();
      const payloadObject: { [key: string]: any } = {
        company_name: apiData.company_name,
        name: apiData.name,
        email: apiData.email,
        mobile_no: apiData.mobile_no,
        inquiry_type: apiData.inquiry_type,
        inquiry_subject: apiData.inquiry_subject,
        priority: apiData.priority || apiData.inquiry_priority,
        inquiry_description: apiData.inquiry_description,
        status: apiData.status, // Use the new status from the form
        assigned_to: formData.assigned_to,
        department_id: apiData.department_id,
        inquiry_date: formatDateForApi(apiData.inquiry_date),
        response_date: formatDateForApi(apiData.response_date),
        resolution_date: formatDateForApi(apiData.resolution_date),
        resolution_notes: apiData.resolution_notes,
        last_follow_up_date: formatDateForApi(apiData.last_follow_up_date),
        feedback_status: apiData.feedback_status,
        inquiry_from: apiData.inquiry_from,
      };

      for (const key in payloadObject) {
        if (Object.prototype.hasOwnProperty.call(payloadObject, key)) {
          const value = payloadObject[key];
          if (value !== undefined && value !== null) {
            formDataPayload.append(key, String(value));
          }
        }
      }

      formDataPayload.append('id', String(inquiry.id));
      formDataPayload.append('_method', 'PUT');

      // 3. Dispatch the edit action
      await dispatch(editInquiriesAction({ id: inquiry.id, data: formDataPayload })).unwrap();

      toast.push(<Notification type="success" title="Status Updated">Inquiry status changed successfully.</Notification>);
      onSuccess(); // This will trigger a data refresh in the parent component
      onClose();

    } catch (error: any) {
      console.error("Status Update Error:", error);
      const errorMessage = error?.payload?.message || error.message || "An unknown error occurred.";
      toast.push(<Notification type="danger" title="Update Failed">{errorMessage}</Notification>);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign for: {inquiry.inquiry_id}</h5>
      <p className="mb-1 text-sm">Company: <span className="font-semibold">{inquiry.company_name}</span></p>
      <p className="mb-4 text-sm">Inquiry Assigned to: <span className="font-semibold">{inquiry.assigned_to || 'N/A'}</span></p>

      <UiForm onSubmit={handleSubmit(handleAssignToUpdate)}>
        <UiFormItem
          label="Assigned To"
          invalid={!!errors.status}
          errorMessage={errors.status?.message}
        >
          <Controller name="assigned_to" control={control} render={({ field }) => (
            <Select
              placeholder="Select Assignee"
              options={usersDataOptions}
              isLoading={masterLoadingStatus === "loading" && usersDataOptions.length === 0}
              value={usersDataOptions.find(o => o.value === field.value) || null}
              onChange={opt => field.onChange(opt ? opt.value : null)}
              isClearable
            />
          )} />

        </UiFormItem>

        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>
            Update
          </Button>
        </div>
      </UiForm>
    </Dialog>
  );
};


// --- Modals Wrapper Component ---
const InquiriesModals: React.FC<{
  modalState: InquiryModalState;
  onClose: () => void;
  onSuccess: () => void; // ADDED onSuccess to refresh data
  getAllUserDataOptions: SelectOption[];
}> = ({ modalState, onClose, onSuccess, getAllUserDataOptions }) => {
  const { type, data: inquiry, isOpen } = modalState;
  if (!isOpen || !inquiry) return null;

  switch (type) {
    case "notification":
      return (
        <AddInquiryNotificationDialog
          inquiry={inquiry}
          onClose={onClose}
          getAllUserDataOptions={getAllUserDataOptions}
        />
      );
    case "schedule":
      return <AddInquiryScheduleDialog inquiry={inquiry} onClose={onClose} />;
    case "task":
      return (
        <AssignTaskDialog
          inquiry={inquiry}
          onClose={onClose}
          getAllUserDataOptions={getAllUserDataOptions}
        />
      );
    case "statusUpdate": // ADDED
      return (
        <StatusUpdateModal
          inquiry={inquiry}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );
    case "assignUpdate":
      return (
        <AssignToUpdateModal
          inquiry={inquiry}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );
    default:
      return null;
  }
};

// --- API Inquiry Item Type ---
export type ApiInquiryItem = {
  id: number;
  name: string | null;
  email: string | null;
  mobile_no: string | null;
  company_name: string | null;
  requirements: string | null;
  inquiry_type: string | null;
  inquiry_subject: string | null;
  inquiry_description: string | null;
  inquiry_priority: string | null;
  inquiry_status: string | null;
  assigned_to: number | string | null;
  inquiry_date: string | null;
  response_date: string | null;
  resolution_date: string | null;
  follow_up_date: string | null;
  feedback_status: string | null;
  inquiry_resolution: string | null;
  inquiry_attachments: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  inquiry_id: string;
  inquiry_department: string | null;
  inquiry_from: string | null;
  inquiry_attachments_array: string[];
  assigned_to_name: string;
  inquiry_department_name: string;
  name?: string | null;
  email?: string | null;
  contact_person?: string | null;
  priority?: string | null;
  status?: string | null;
};

// --- InquiryItem Type for UI ---
export type InquiryItem = {
  id: string; // DB ID
  inquiry_id: string; // User-facing ID
  company_name: string;
  name: string;
  email: string;
  mobile_no: string;
  inquiry_type: string;
  inquiry_subject: string;
  inquiry_description: string;
  inquiry_priority: string;
  inquiry_status: string; // Current progress status (New, In Progress, etc.)
  assigned_to: string; // Name of the assignee
  department?: string; // Name of the department
  inquiry_date: string;
  response_date: string;
  resolution_date: string;
  follow_up_date: string;
  feedback_status: string;
  inquiry_resolution: string;
  inquiry_attachments: string[];
  status: "active" | "inactive"; // Record status (active/soft-deleted)
};

// --- Department Type ---
export type Department = {
  id: string | number;
  name: string;
};

// --- Zod Schema for Inquiry Filter Form ---
const inquiryFilterFormSchema = z.object({
  filterRecordStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInquiryType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInquiryPriority: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInquiryCurrentStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterAssignedTo: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterDepartment: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterFeedbackStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterInquiryDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
  filterResponseDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
  filterResolutionDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
  filterFollowUpDate: z
    .array(z.date().nullable())
    .optional()
    .default([null, null]),
});
type InquiryFilterFormData = z.infer<typeof inquiryFilterFormSchema>;

// --- Status Colors ---
const recordStatusColor: Record<InquiryItem["status"], string> = {
  active: "bg-green-200 text-green-600 dark:bg-green-700 dark:text-green-100",
  inactive: "bg-red-200 text-red-600 dark:bg-red-700 dark:text-red-100",
};
const priorityColors: Record<string, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "N/A": "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};
const inquiryCurrentStatusColors: Record<string, string> = {
  Open: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "In Progress":
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Resolved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Closed: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  "N/A": "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};

// --- Helper to format date for display ---
const FormattedDateDisplay = ({
  dateString,
  label,
}: {
  dateString?: string;
  label?: string;
}) => {
  if (!dateString || dateString === "N/A")
    return (
      <div className="text-[10px] text-gray-500 dark:text-gray-400">
        {label && <b>{label}: </b>}N/A
      </div>
    );
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime()))
      return (
        <div className="text-[10px] text-red-500">
          {label && <b>{label}: </b>}Invalid Date
        </div>
      );
    return (
      <div className="text-[10px] text-gray-500 dark:text-gray-400">
        {label && <b>{label}: </b>}
        {formatCustomDateTime(dateString)}
      </div>
    );
  } catch (e) {
    return (
      <div className="text-[10px] text-red-500">
        {label && <b>{label}: </b>}Error
      </div>
    );
  }
};

// --- Data Processing Function ---
const processApiDataToInquiryItems = (
  apiData: ApiInquiryItem[]
): InquiryItem[] => {
  if (!Array.isArray(apiData)) return [];
  return apiData.map((apiItem) => ({
    id: String(apiItem.id),
    inquiry_id: apiItem.inquiry_id || `INQ-${apiItem.id}`,
    company_name: apiItem.company_name || "N/A",
    name: apiItem.name || apiItem.name || "N/A",
    email:
      apiItem.email || apiItem.email || "N/A",
    mobile_no: apiItem.contact_person || apiItem.mobile_no || "N/A",
    inquiry_type: apiItem.inquiry_type || "N/A",
    inquiry_subject: apiItem.inquiry_subject || "N/A",
    inquiry_description:
      apiItem.requirements || apiItem.inquiry_description || "N/A",
    inquiry_priority: apiItem.inquiry_priority || apiItem.priority || "N/A",
    inquiry_status: apiItem.inquiry_status || apiItem.status || "N/A",
    assigned_to: apiItem.assigned_to_name || "Unassigned",
    department: apiItem.inquiry_department_name || undefined,
    inquiry_date: apiItem.inquiry_date || apiItem.created_at || "N/A",
    response_date: apiItem.response_date || "N/A",
    resolution_date: apiItem.resolution_date || "N/A",
    follow_up_date: apiItem.follow_up_date || "N/A",
    feedback_status: apiItem.feedback_status || "N/A",
    inquiry_resolution: apiItem.inquiry_resolution || "N/A",
    inquiry_attachments: apiItem.inquiry_attachments_array || [],
    status: apiItem.deleted_at ? "inactive" : "active",
  }));
};

// --- Inquiry List Store (Context API) ---
interface InquiryListStore {
  inquiryList: InquiryItem[];
  selectedInquiries: InquiryItem[];
  setSelectedInquiries: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
  departments: Department[];
  isLoading: boolean;
  getAllUserDataOptions: SelectOption[];
}
const InquiryListContext = React.createContext<InquiryListStore | undefined>(
  undefined
);
const useInquiryList = (): InquiryListStore => {
  const context = useContext(InquiryListContext);
  if (!context)
    throw new Error(
      "useInquiryList must be used within an InquiryListProvider"
    );
  return context;
};
const InquiryListProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const {
    inquiryList1,
    departmentsData,
    getAllUserData,
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);
  const [inquiryList, setInquiryList] = useState<InquiryItem[]>([]);
  const [selectedInquiries, setSelectedInquiries] = useState<InquiryItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAllUserDataOptions = useMemo(
    () =>
      Array.isArray(getAllUserData)
        ? getAllUserData.map((u) => ({
          value: u.id,
          label: `(${u.employee_id}) - ${u.name || "N/A"}`,
        }))
        : [],
    [getAllUserData]
  );

  useEffect(() => {
    dispatch(getDepartmentsAction());
    dispatch(getInquiriesAction());
    dispatch(getAllUsersAction());
  }, [dispatch]);

  useEffect(() => {
    setIsLoading(masterLoadingStatus === "loading");

    if (masterLoadingStatus === "succeeded" || masterLoadingStatus === "idle") {
      const rawInquiries = inquiryList1?.data?.data;
      const inquiryDataFromApi = Array.isArray(rawInquiries)
        ? rawInquiries
        : Array.isArray(inquiryList1)
          ? inquiryList1
          : [];
      setInquiryList(
        processApiDataToInquiryItems(inquiryDataFromApi as ApiInquiryItem[])
      );

      const deptsFromApi = Array.isArray(departmentsData?.data)
        ? departmentsData.data
        : [];
      setDepartments(deptsFromApi as Department[]);
    } else if (masterLoadingStatus === "failed") {
      setInquiryList([]);
      setDepartments([]);
      toast.push(
        <Notification type="danger" title="Error">
          Failed to load data.
        </Notification>
      );
    }
  }, [inquiryList1, departmentsData, masterLoadingStatus]);

  return (
    <InquiryListContext.Provider
      value={{
        inquiryList,
        selectedInquiries,
        setSelectedInquiries,
        departments,
        isLoading,
        getAllUserDataOptions,
      }}
    >
      {children}
    </InquiryListContext.Provider>
  );
};

// --- InquiryActionColumn Component (DataTable Actions) ---
const InquiryActionColumn = ({
  rowData,
  onViewDetail,
  onDeleteItem,
  onEdit,
  onOpenModal,
  onSendEmail,
  onSendWhatsapp,
}: {
  rowData: InquiryItem;
  onViewDetail: (id: string) => void;
  onDeleteItem: (item: InquiryItem) => void;
  onEdit?: (id: string) => void;
  onOpenModal: (type: InquiryModalType, data: InquiryItem) => void;
  onSendEmail: (data: InquiryItem) => void;
  onSendWhatsapp: (data: InquiryItem) => void;
}) => {
  const handleEdit = () => onEdit && onEdit(rowData.id);
  return (
    <div className="flex items-center justify-center gap-1">
      {onEdit && (
        <Tooltip title="Edit">
          <div
            className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
            role="button"
            onClick={handleEdit}
          >
            <TbPencil />
          </div>
        </Tooltip>
      )}
      <Tooltip title="View">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          role="button"
          onClick={() => onViewDetail(rowData.id)}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <Dropdown
          renderTitle={
            <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
          }
        >
          <Dropdown.Item
            onClick={() => onOpenModal("statusUpdate", rowData)}
            className="flex items-center gap-2"
          >
            <TbProgress size={18} /> <span className="text-xs">Change Status</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onOpenModal("assignUpdate", rowData)}
            className="flex items-center gap-2"
          >
            <TbUsers size={18} /> <span className="text-xs">Assign To</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onSendEmail(rowData)}
            className="flex items-center gap-2"
          >
            <TbMail size={18} /> <span className="text-xs">Send Email</span>
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => onSendWhatsapp(rowData)}
            className="flex items-center gap-2"
          >
            <TbBrandWhatsapp size={18} />{" "}
            <span className="text-xs">Send Whatsapp</span>
          </Dropdown.Item>
          <Dropdown.Item
            className="flex items-center gap-2"
            onClick={() => onOpenModal("notification", rowData)}
          >
            <TbBell size={18} />{" "}
            <span className="text-xs">Add Notification</span>
          </Dropdown.Item>
          <Dropdown.Item
            className="flex items-center gap-2"
            onClick={() => onOpenModal("task", rowData)}
          >
            <TbUser size={18} /> <span className="text-xs">Assign Task</span>
          </Dropdown.Item>
          <Dropdown.Item
            className="flex items-center gap-2"
            onClick={() => onOpenModal("schedule", rowData)}
          >
            <TbCalendarEvent size={18} />{" "}
            <span className="text-xs">Add Schedule</span>
          </Dropdown.Item>
        </Dropdown>
      </Tooltip>
    </div>
  );
};

// --- CsvHeader Type and exportToCsv Function ---
export type CsvHeader = { label: string; key: string };

function exportToCsv<T extends Record<string, any>>(
  filename: string,
  rows: T[],
  headers: CsvHeader[]
): boolean {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info" duration={3000}>
        Nothing to export.
      </Notification>
    );
    return false;
  }
  if (!headers || !headers.length) {
    toast.push(
      <Notification title="Configuration Error" type="danger" duration={3000}>
        CSV Headers are not defined. Cannot export.
      </Notification>
    );
    return false;
  }

  const separator = ",";
  const headerRow = headers
    .map((header) => `"${String(header.label).replace(/"/g, '""')}"`)
    .join(separator);

  const dataRows = rows
    .map((row) => {
      return headers
        .map((header) => {
          let cellValue = row[header.key];
          if (cellValue === null || cellValue === undefined) {
            cellValue = "";
          } else if (Array.isArray(cellValue)) {
            cellValue = cellValue
              .map((item) => String(item).replace(/"/g, '""'))
              .join("; ");
          } else {
            cellValue = String(cellValue).replace(/"/g, '""');
          }
          if (String(cellValue).search(/("|,|\n)/g) >= 0) {
            cellValue = `"${cellValue}"`;
          }
          return cellValue;
        })
        .join(separator);
    })
    .join("\n");

  const csvContent = "\ufeff" + headerRow + "\n" + dataRows;
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
    return true;
  } else {
    toast.push(
      <Notification title="Export Failed" type="danger" duration={3000}>
        Your browser does not support this feature.
      </Notification>
    );
    return false;
  }
}

// --- InquiryViewModal Component ---
interface InquiryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry: InquiryItem | null;
}

const InquiryViewModal: React.FC<InquiryViewModalProps> = ({
  isOpen,
  onClose,
  inquiry,
}) => {
  if (!inquiry) return null;
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      title={`Inquiry Details: ${inquiry.inquiry_id}`}
      width={700}
    >
      <div className="py-4 px-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <h6 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
              Basic Information
            </h6>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Inquiry ID:</strong> {inquiry.inquiry_id}
              </p>
              <p>
                <strong>Company:</strong> {inquiry.company_name}
              </p>
              <p>
                <strong>Subject:</strong> {inquiry.inquiry_subject}
              </p>
              <div className="flex items-center gap-2">
                <strong>Type:</strong>{" "}
                <Tag className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {inquiry.inquiry_type}
                </Tag>
              </div>
              <div className="flex items-center gap-2">
                <strong>Record Status:</strong>{" "}
                <Tag
                  className={`${recordStatusColor[inquiry.status]
                    } capitalize text-[10px] px-1.5 py-0.5`}
                >
                  {inquiry.status}
                </Tag>
              </div>
            </div>
          </div>
          <div>
            <h6 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
              Contact Person
            </h6>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Name:</strong> {inquiry.name}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a
                  href={`mailto:${inquiry.email}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {inquiry.email}
                </a>
              </p>
              <p>
                <strong>Phone:</strong> {inquiry.mobile_no}
              </p>
            </div>
          </div>
          <div className="md:col-span-2">
            <h6 className="text-sm font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-200">
              Inquiry Specifics
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <strong>Priority:</strong>{" "}
                  <Tag
                    className={`${priorityColors[inquiry.inquiry_priority] ||
                      priorityColors["N/A"]
                      } capitalize text-[10px] px-1.5 py-0.5`}
                  >
                    {inquiry.inquiry_priority}
                  </Tag>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <strong>Current Status:</strong>{" "}
                  <Tag
                    className={`${inquiryCurrentStatusColors[inquiry.inquiry_status] ||
                      inquiryCurrentStatusColors["N/A"]
                      } capitalize text-[10px] px-1.5 py-0.5`}
                  >
                    {inquiry.inquiry_status}
                  </Tag>
                </div>
                <p>
                  <strong>Assigned To:</strong> {inquiry.assigned_to}
                </p>
                {inquiry.department && (
                  <p>
                    <strong>Department:</strong> {inquiry.department}
                  </p>
                )}
              </div>
              <div>
                <p>
                  <strong>Feedback Status:</strong> {inquiry.feedback_status}
                </p>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 mt-2">
            <h6 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">
              Description
            </h6>
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md whitespace-pre-wrap max-h-40 overflow-y-auto">
              {inquiry.inquiry_description}
            </div>
          </div>
          {inquiry.inquiry_resolution &&
            inquiry.inquiry_resolution !== "N/A" && (
              <div className="md:col-span-2 mt-2">
                <h6 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">
                  Resolution
                </h6>
                <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {inquiry.inquiry_resolution}
                </div>
              </div>
            )}
          <div className="md:col-span-2">
            <h6 className="text-sm font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-200">
              Timeline
            </h6>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
              <FormattedDateDisplay
                dateString={inquiry.inquiry_date}
                label="Inquired"
              />
              <FormattedDateDisplay
                dateString={inquiry.response_date}
                label="Responded"
              />
            </div>
          </div>
          {inquiry.inquiry_attachments &&
            inquiry.inquiry_attachments.length > 0 && (
              <div className="md:col-span-2">
                <h6 className="text-sm font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-200">
                  Attachments
                </h6>
                <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                  {inquiry.inquiry_attachments.map((attachment, index) => (
                    <li key={index}>
                      <a
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {attachment.split("/").pop()?.split("?")[0] ||
                          `Attachment ${index + 1}`}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
        <div className="text-right mt-6">
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
}: {
  filterData: InquiryFilterFormData;
  onRemoveFilter: (key: keyof InquiryFilterFormData, value: any) => void;
  onClearAll: () => void;
}) => {
  const filters = [
    ...(filterData.filterRecordStatus || []).map((f) => ({
      key: "filterRecordStatus",
      label: `Status: ${f.label}`,
      value: f,
    })),
    ...(filterData.filterInquiryType || []).map((f) => ({
      key: "filterInquiryType",
      label: `Type: ${f.label}`,
      value: f,
    })),
    ...(filterData.filterInquiryPriority || []).map((f) => ({
      key: "filterInquiryPriority",
      label: `Priority: ${f.label}`,
      value: f,
    })),
    ...(filterData.filterInquiryCurrentStatus || []).map((f) => ({
      key: "filterInquiryCurrentStatus",
      label: `Current Status: ${f.label}`,
      value: f,
    })),
    ...(filterData.filterAssignedTo || []).map((f) => ({
      key: "filterAssignedTo",
      label: `Assigned: ${f.label}`,
      value: f,
    })),
    ...(filterData.filterDepartment || []).map((f) => ({
      key: "filterDepartment",
      label: `Dept: ${f.label}`,
      value: f,
    })),
  ];

  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {filters.map((filter) => (
        <Tag key={`${filter.key}-${filter.value.value}`} prefix>
          {filter.label}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter(filter.key as any, filter.value)}
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

// --- InquiryListTable Component ---
const InquiryListTable = () => {
  const dispatch = useAppDispatch();
  const {
    inquiryList,
    departments,
    isLoading,
    selectedInquiries,
    setSelectedInquiries,
    getAllUserDataOptions,
  } = useInquiryList();
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<InquiryFilterFormData>(
    {}
  );
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InquiryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [inquiryToView, setInquiryToView] = useState<InquiryItem | null>(null);
  const [modalState, setModalState] = useState<InquiryModalState>({
    isOpen: false,
    type: null,
    data: null,
  });

  const filterFormMethods = useForm<InquiryFilterFormData>({
    resolver: zodResolver(inquiryFilterFormSchema),
    defaultValues: filterCriteria,
  });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  const handleOpenModal = useCallback(
    (type: InquiryModalType, itemData: InquiryItem) => {
      setModalState({ isOpen: true, type, data: itemData });
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, type: null, data: null });
  }, []);

  const handleUpdateSuccess = useCallback(() => {
    dispatch(getInquiriesAction());
  }, [dispatch]);


  const handleSendEmail = (inquiry: InquiryItem) => {
    if (
      !inquiry.email ||
      inquiry.email === "N/A"
    ) {
      toast.push(
        <Notification type="warning" title="Missing Email">
          Contact email is not available.
        </Notification>
      );
      return;
    }
    const subject = `Regarding Your Inquiry: ${inquiry.inquiry_id}`;
    const body = `Hello ${inquiry.name},\n\nThis is a follow-up regarding your inquiry about "${inquiry.inquiry_subject}".\n\nThank you.`;
    window.open(
      `mailto:${inquiry.email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`
    );
  };

  const handleSendWhatsapp = (inquiry: InquiryItem) => {
    const phone = inquiry.mobile_no?.replace(/\D/g, "");
    if (!phone || phone === "N/A") {
      toast.push(
        <Notification type="warning" title="Missing Phone">
          Contact number is not available.
        </Notification>
      );
      return;
    }
    const message = `Hello ${inquiry.name}, we are contacting you about your inquiry: ${inquiry.inquiry_id}.`;
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  useEffect(() => {
    filterFormMethods.reset(filterCriteria);
  }, [filterCriteria, filterFormMethods]);

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: InquiryFilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters: InquiryFilterFormData = {
      filterRecordStatus: [],
      filterInquiryType: [],
      filterInquiryPriority: [],
      filterInquiryCurrentStatus: [],
      filterAssignedTo: [],
      filterDepartment: [],
      filterFeedbackStatus: [],
      filterInquiryDate: [null, null],
      filterResponseDate: [null, null],
      filterResolutionDate: [null, null],
      filterFollowUpDate: [null, null],
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1, query: "" });
    dispatch(getInquiriesAction());
  };

  const handleCardClick = (type: "status" | "priority", value: string) => {
    onClearFilters();
    if (type === "status") {
      const statusOption = inquiryCurrentStatusOptions.find(
        (opt) => opt.value === value
      );
      if (statusOption)
        setFilterCriteria({ filterInquiryCurrentStatus: [statusOption] });
    } else if (type === "priority") {
      const priorityOption = inquiryPriorityOptions.find(
        (opt) => opt.value === value
      );
      if (priorityOption)
        setFilterCriteria({ filterInquiryPriority: [priorityOption] });
    }
  };

  const handleRemoveFilter = (key: keyof InquiryFilterFormData, value: any) => {
    setFilterCriteria((prev) => {
      const newFilters = { ...prev };
      const currentValues = prev[key] as SelectOption[] | undefined;
      if (currentValues) {
        (newFilters[key] as SelectOption[]) = currentValues.filter(
          (item) => item.value !== value.value
        );
      }
      return newFilters;
    });
  };

  const handleDeleteItemClick = (item: InquiryItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteAllInquiryAction({ ids: itemToDelete.id })).unwrap();
      toast.push(
        <Notification title="Inquiry Deleted" type="success" duration={2000}>
          Inquiry "{itemToDelete.inquiry_id}" deleted.
        </Notification>
      );
      dispatch(getInquiriesAction());
      setSelectedInquiries((prev) =>
        prev.filter((si) => si.id !== itemToDelete.id)
      );
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete inquiry.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let data = cloneDeep(inquiryList);
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      data = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(query)
        )
      );
    }
    if (filterCriteria.filterRecordStatus?.length) {
      const selected = filterCriteria.filterRecordStatus.map(
        (opt) => opt.value
      );
      data = data.filter((item) => selected.includes(item.status));
    }
    if (filterCriteria.filterInquiryType?.length) {
      const selected = filterCriteria.filterInquiryType.map((opt) => opt.value);
      data = data.filter((item) => selected.includes(item.inquiry_type));
    }
    if (filterCriteria.filterInquiryPriority?.length) {
      const selected = filterCriteria.filterInquiryPriority.map(
        (opt) => opt.value
      );
      data = data.filter((item) => selected.includes(item.inquiry_priority));
    }
    if (filterCriteria.filterInquiryCurrentStatus?.length) {
      const selected = filterCriteria.filterInquiryCurrentStatus.map(
        (opt) => opt.value
      );
      data = data.filter((item) => selected.includes(item.inquiry_status));
    }
    if (filterCriteria.filterAssignedTo?.length) {
      const selected = filterCriteria.filterAssignedTo.map((opt) => opt.value);
      data = data.filter((item) => selected.includes(item.assigned_to));
    }
    if (filterCriteria.filterDepartment?.length) {
      const selected = filterCriteria.filterDepartment.map((opt) => opt.value);
      data = data.filter(
        (item) => item.department && selected.includes(item.department)
      );
    }
    if (filterCriteria.filterFeedbackStatus?.length) {
      const selected = filterCriteria.filterFeedbackStatus.map(
        (opt) => opt.value
      );
      data = data.filter((item) => selected.includes(item.feedback_status));
    }
    const checkDateRange = (
      dateStr: string,
      range: (Date | null)[] | undefined
    ) => {
      if (!dateStr || dateStr === "N/A" || !range || (!range[0] && !range[1]))
        return true;
      try {
        const itemDate = new Date(dateStr).setHours(0, 0, 0, 0);
        const from = range[0] ? new Date(range[0]).setHours(0, 0, 0, 0) : null;
        const to = range[1] ? new Date(range[1]).setHours(0, 0, 0, 0) : null;
        if (from && to) return itemDate >= from && itemDate <= to;
        if (from) return itemDate >= from;
        if (to) return itemDate <= to;
        return true;
      } catch (e) {
        return true;
      }
    };
    if (
      filterCriteria.filterInquiryDate?.[0] ||
      filterCriteria.filterInquiryDate?.[1]
    ) {
      data = data.filter((item) =>
        checkDateRange(item.inquiry_date, filterCriteria.filterInquiryDate)
      );
    }
    if (
      filterCriteria.filterResponseDate?.[0] ||
      filterCriteria.filterResponseDate?.[1]
    ) {
      data = data.filter((item) =>
        checkDateRange(item.response_date, filterCriteria.filterResponseDate)
      );
    }
    if (
      filterCriteria.filterResolutionDate?.[0] ||
      filterCriteria.filterResolutionDate?.[1]
    ) {
      data = data.filter((item) =>
        checkDateRange(
          item.resolution_date,
          filterCriteria.filterResolutionDate
        )
      );
    }
    if (
      filterCriteria.filterFollowUpDate?.[0] ||
      filterCriteria.filterFollowUpDate?.[1]
    ) {
      data = data.filter((item) =>
        checkDateRange(item.follow_up_date, filterCriteria.filterFollowUpDate)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      data.sort((a, b) => {
        const aVal = a[key as keyof InquiryItem] ?? "";
        const bVal = b[key as keyof InquiryItem] ?? "";
        if (
          [
            "inquiry_date",
            "response_date",
            "resolution_date",
            "follow_up_date",
          ].includes(key)
        ) {
          const dateA =
            aVal && aVal !== "N/A"
              ? new Date(aVal as string).getTime()
              : order === "asc"
                ? Infinity
                : -Infinity;
          const dateB =
            bVal && bVal !== "N/A"
              ? new Date(bVal as string).getTime()
              : order === "asc"
                ? Infinity
                : -Infinity;
          if (isNaN(dateA)) return 1;
          if (isNaN(dateB)) return -1;
          return order === "asc" ? dateA - dateB : dateB - aVal;
        }
        if (typeof aVal === "string" && typeof bVal === "string")
          return order === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        if (typeof aVal === "number" && typeof bVal === "number")
          return order === "asc" ? aVal - bVal : bVal - aVal;
        return 0;
      });
    }
    const currentTotal = data.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: data.slice(startIndex, startIndex + pageSize),
      total: currentTotal,
      allFilteredAndSortedData: data,
    };
  }, [inquiryList, tableData, filterCriteria]);

  const handleViewDetails = (id: string) => {
    if (id) {
      navigate(`/business-entities/inquiry-view/${id}`);
    } else {
      toast.push(
        <Notification type="danger" title="Error">
          Inquiry details not found.
        </Notification>
      );
    }
  };

  const navigate = useNavigate();
  const handleEditInquiry = (id: string) => {
    navigate("/business-entities/create-inquiry", { state: id });
  };

  const columns: ColumnDef<InquiryItem>[] = useMemo(
    () => [
      {
        header: "Inquiry Overview",
        accessorKey: "inquiry_id",
        id: "overview",
        enableSorting: true,
        size: 280,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                {d.inquiry_id}
              </span>
              <span className="text-xs text-gray-700 dark:text-gray-300">
                {d.company_name || "Company Name"}
              </span>
              <Tooltip title={d.inquiry_subject}></Tooltip>
              <div className="flex items-center gap-2 mt-1">
                <Tag className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {d.inquiry_type || "Inquiry Type"}
                </Tag>
                <Tag
                  className={`${recordStatusColor[d.status]
                    } capitalize text-[10px] px-1.5 py-0.5`}
                >
                  {d.status}
                </Tag>
              </div>
            </div>
          );
        },
      },
      {
        header: "Contact Person",
        accessorKey: "name",
        id: "contact",
        enableSorting: true,
        size: 240,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                {d.name}
              </span>
              <a
                href={`mailto:${d.email}`}
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {d.email}
              </a>
              <span className="text-gray-600 dark:text-gray-300">
                {d.mobile_no}
              </span>
            </div>
          );
        },
      },
      {
        header: "Inquiry Details",
        accessorKey: "inquiry_priority",
        id: "details",
        enableSorting: true,
        size: 280,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <Tag
                  className={`${priorityColors[d.inquiry_priority] || priorityColors["N/A"]
                    } capitalize text-[10px] px-1.5 py-0.5`}
                >
                  {d.inquiry_priority}{" "}
                </Tag>
                <Tag
                  className={`${inquiryCurrentStatusColors[d.inquiry_status] ||
                    inquiryCurrentStatusColors["N/A"]
                    } capitalize text-[10px] px-1.5 py-0.5`}
                >
                  {d.inquiry_status}
                </Tag>
              </div>
              <span className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Assigned:</span> {d.assigned_to}
              </span>
              {d.department && (
                <span className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Dept:</span> {d.department}
                </span>
              )}
              <Tooltip title={d.inquiry_description}>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                  {d.inquiry_description}
                </p>
              </Tooltip>
            </div>
          );
        },
      },
      {
        header: "Timeline",
        accessorKey: "inquiry_date",
        id: "timeline",
        enableSorting: true,
        size: 180,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <FormattedDateDisplay
                dateString={d.inquiry_date}
                label="Inquired"
              />
              <FormattedDateDisplay
                dateString={d.response_date}
                label="Responded"
              />
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <InquiryActionColumn
            rowData={props.row.original}
            onViewDetail={handleViewDetails}
            onDeleteItem={handleDeleteItemClick}
            onEdit={handleEditInquiry}
            onOpenModal={handleOpenModal}
            onSendEmail={handleSendEmail}
            onSendWhatsapp={handleSendWhatsapp}
          />
        ),
      },
    ],
    [
      navigate,
      allFilteredAndSortedData,
      handleOpenModal,
      handleSendEmail,
      handleSendWhatsapp,
      handleViewDetails,
    ]
  );

  const [filteredColumns, setFilteredColumns] =
    useState<ColumnDef<InquiryItem>[]>(columns);

  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      setFilteredColumns((currentCols) => {
        const originalColumn = columns.find(
          (c) => (c.id || c.accessorKey) === colId
        );
        if (!originalColumn) return currentCols;
        const newCols = [...currentCols, originalColumn];
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
    } else {
      setFilteredColumns((currentCols) =>
        currentCols.filter((c) => (c.id || c.accessorKey) !== colId)
      );
    }
  };

  const isColumnVisible = (colId: string) =>
    filteredColumns.some((c) => (c.id || c.accessorKey) === colId);

  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
      setSelectedInquiries([]);
    },
    [handleSetTableData, setSelectedInquiries]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchInputChange = useCallback(
    (val: string) => handleSetTableData({ query: val, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: InquiryItem) => {
      setSelectedInquiries((prev) =>
        checked
          ? prev.find((i) => i.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((item) => item.id !== row.id)
      );
    },
    [setSelectedInquiries]
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<InquiryItem>[]) => {
      const currentIds = new Set(rows.map((r) => r.original.id));
      if (checked) {
        setSelectedInquiries((prev) => {
          const newItems = rows
            .map((r) => r.original)
            .filter((item) => !prev.find((pi) => pi.id === item.id));
          return [...prev, ...newItems];
        });
      } else {
        setSelectedInquiries((prev) =>
          prev.filter((item) => !currentIds.has(item.id))
        );
      }
    },
    [setSelectedInquiries]
  );

  const csvHeaders: CsvHeader[] = useMemo(
    () => [
      { label: "Inquiry ID", key: "inquiry_id" },
      { label: "Company Name", key: "company_name" },
      { label: "Contact Name", key: "name" },
      { label: "Email", key: "email" },
      { label: "Phone", key: "mobile_no" },
      { label: "Inquiry Type", key: "inquiry_type" },
      { label: "Subject", key: "inquiry_subject" },
      { label: "Priority", key: "inquiry_priority" },
      { label: "Status", key: "inquiry_status" },
      { label: "Assigned To", key: "assigned_to" },
      { label: "Department", key: "department" },
      { label: "Inquiry Date", key: "inquiry_date" },
    ],
    []
  );

  const handleExport = () => {
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
    const moduleName = "Inquiries";
    const timestamp = dayjs().format("YYYY-MM-DD");
    const fileName = `inquiries_export_${timestamp}.csv`;
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
      const exportSuccessful = exportToCsv(
        fileName,
        allFilteredAndSortedData,
        csvHeaders
      );
      if (exportSuccessful) {
        setIsExportReasonModalOpen(false);
      }
    } catch (error: any) {
      toast.push(
        <Notification title="Operation Failed" type="danger">
          {error.message || "Could not submit reason or export data."}
        </Notification>
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const recordStatusOptions = useMemo(
    () => [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
    []
  );
  const inquiryTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          inquiryList
            .map((item) => item.inquiry_type)
            .filter((t) => t && t !== "N/A")
        )
      ).map((type) => ({ value: type, label: type })),
    [inquiryList]
  );
  const inquiryPriorityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          inquiryList
            .map((item) => item.inquiry_priority)
            .filter((p) => p && p !== "N/A")
        )
      ).map((priority) => ({ value: priority, label: priority })),
    [inquiryList]
  );
  const inquiryCurrentStatusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          inquiryList
            .map((item) => item.inquiry_status)
            .filter((s) => s && s !== "N/A")
        )
      ).map((status) => ({ value: status, label: status })),
    [inquiryList]
  );
  const assignedToOptions = useMemo(
    () =>
      Array.from(
        new Set(
          inquiryList
            .map((item) => item.assigned_to)
            .filter((a) => a && a !== "N/A")
        )
      ).map((assignee) => ({ value: assignee, label: assignee })),
    [inquiryList]
  );
  const departmentFilterOptions = useMemo(
    () => departments.map((dept) => ({ value: dept.name, label: dept.name })),
    [departments]
  );
  const feedbackStatusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          inquiryList
            .map((item) => item.feedback_status)
            .filter((f) => f && f !== "N/A")
        )
      ).map((status) => ({ value: status, label: status })),
    [inquiryList]
  );
  const { DatePickerRange } = DatePicker;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterRecordStatus?.length) count++;
    if (filterCriteria.filterInquiryType?.length) count++;
    if (filterCriteria.filterInquiryPriority?.length) count++;
    if (filterCriteria.filterInquiryCurrentStatus?.length) count++;
    if (filterCriteria.filterAssignedTo?.length) count++;
    if (filterCriteria.filterDepartment?.length) count++;
    return count;
  }, [filterCriteria]);

  const cardClass =
    "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex items-center gap-2 p-2";
  const counts = useMemo(() => {
    const total = inquiryList.length;
    const newCount = inquiryList.filter(
      (i) => i.inquiry_status === "Open"
    ).length;
    const inProgressCount = inquiryList.filter(
      (i) => i.inquiry_status === "In Progress"
    ).length;
    const resolvedCount = inquiryList.filter(
      (i) => i.inquiry_status === "Resolved"
    ).length;
    const closedCount = inquiryList.filter(
      (i) => i.inquiry_status === "Closed"
    ).length;
    const highPriority = inquiryList.filter(
      (i) => i.inquiry_priority === "High"
    ).length;
    const mediumPriority = inquiryList.filter(
      (i) => i.inquiry_priority === "Medium"
    ).length;
    const lowPriority = inquiryList.filter(
      (i) => i.inquiry_priority === "Low"
    ).length;
    return {
      total,
      newCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      highPriority,
      mediumPriority,
      lowPriority,
    };
  }, [inquiryList]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-4 gap-2">
        <Tooltip title="Click to show all inquiries">
          <div onClick={onClearFilters}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-blue-200")}
            >
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbListDetails size={20} />
              </div>
              <div>
                <h6 className="text-blue-500">{counts.total}</h6>
                <span className="font-semibold text-[11px]">Total</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show 'Open' inquiries">
          <div onClick={() => handleCardClick("status", "Open")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-sky-200")}
            >
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-sky-100 text-sky-500">
                <TbPlus size={20} />
              </div>
              <div>
                <h6 className="text-sky-500">{counts.newCount}</h6>
                <span className="font-semibold text-[11px]">Open</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show 'In Progress' inquiries">
          <div onClick={() => handleCardClick("status", "In Progress")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-amber-200")}
            >
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-amber-100 text-amber-500">
                <TbProgress size={20} />
              </div>
              <div>
                <h6 className="text-amber-500">{counts.inProgressCount}</h6>
                <span className="font-semibold text-[11px]">In Progress</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show 'Resolved' inquiries">
          <div onClick={() => handleCardClick("status", "Resolved")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-emerald-200")}
            >
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500">
                <TbCircleCheck size={20} />
              </div>
              <div>
                <h6 className="text-emerald-500">{counts.resolvedCount}</h6>
                <span className="font-semibold text-[11px]">Resolved</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show 'Closed' inquiries">
          <div onClick={() => handleCardClick("status", "Closed")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-gray-200")}
            >
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-gray-100 text-gray-500">
                <TbCircleX size={20} />
              </div>
              <div>
                <h6 className="text-gray-500">{counts.closedCount}</h6>
                <span className="font-semibold text-[11px]">Closed</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show 'High' priority inquiries">
          <div onClick={() => handleCardClick("priority", "High")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-red-200")}
            >
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbUrgent size={20} />
              </div>
              <div>
                <h6 className="text-red-500">{counts.highPriority}</h6>
                <span className="font-semibold text-[11px]">High Priority</span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show 'Medium' priority inquiries">
          <div onClick={() => handleCardClick("priority", "Medium")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-yellow-200")}
            >
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-yellow-100 text-yellow-500">
                <TbAlarm size={20} />
              </div>
              <div>
                <h6 className="text-yellow-500">{counts.mediumPriority}</h6>
                <span className="font-semibold text-[11px]">
                  Medium Priority
                </span>
              </div>
            </Card>
          </div>
        </Tooltip>
        <Tooltip title="Click to show 'Low' priority inquiries">
          <div onClick={() => handleCardClick("priority", "Low")}>
            <Card
              bodyClass={cardBodyClass}
              className={classNames(cardClass, "border-blue-200")}
            >
              <div className="h-10 w-10 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbArrowDown size={20} />
              </div>
              <div>
                <h6 className="text-blue-500">{counts.lowPriority}</h6>
                <span className="font-semibold text-[11px]">Low Priority</span>
              </div>
            </Card>
          </div>
        </Tooltip>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <DebouceInput
          placeholder="Quick Search..."
          suffix={<TbSearch className="text-lg" />}
          onChange={(e) => handleSearchInputChange(e.target.value)}
        />
        <div className="flex gap-2">
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
          <Tooltip title="Clear Filters & Reload">
            <Button icon={<TbReload />} onClick={onClearFilters} />
          </Tooltip>
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>
            Filter{" "}
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            icon={<TbCloudUpload />}
            onClick={handleExport}
            disabled={allFilteredAndSortedData.length === 0}
          >
            Export
          </Button>
        </div>
      </div>
      <ActiveFiltersDisplay
        filterData={filterCriteria}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={onClearFilters}
      />
      <DataTable
        selectable
        columns={filteredColumns}
        data={pageData}
        noData={!isLoading && pageData.length === 0}
        loading={isLoading || isDeleting || isSubmittingExportReason}
        pagingData={{
          total: total,
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        checkboxChecked={(row) =>
          selectedInquiries.some((selected) => selected.id === row.id)
        }
        onPaginationChange={handlePaginationChange}
        onSelectChange={handleSelectChange}
        onSort={handleSort}
        onCheckBoxChange={handleRowSelect}
        onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      <Drawer
        title="Inquiry Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterInquiryForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <UiForm
          id="filterInquiryForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
        >
          <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2">
            {/* <UiFormItem label="Record Status">
              <Controller
                name="filterRecordStatus"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={recordStatusOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem> */}
            <UiFormItem label="Inquiry Type">
              <Controller
                name="filterInquiryType"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Type"
                    options={inquiryTypeOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Inquiry Priority">
              <Controller
                name="filterInquiryPriority"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Priority"
                    options={inquiryPriorityOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Inquiry Current Status">
              <Controller
                name="filterInquiryCurrentStatus"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={inquiryCurrentStatusOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Assigned To">
              <Controller
                name="filterAssignedTo"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Assignee"
                    options={assignedToOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Department">
              <Controller
                name="filterDepartment"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Department"
                    options={departmentFilterOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Feedback Status" className="col-span-2">
              <Controller
                name="filterFeedbackStatus"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select Status"
                    options={feedbackStatusOptions}
                    value={field.value || []}
                    onChange={(val) => field.onChange(val || [])}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Inquiry Date Range" className="col-span-2">
              <Controller
                name="filterInquiryDate"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <DatePickerRange
                    placeholder="Select Inquiry Dates"
                    value={field.value as [Date | null, Date | null]}
                    onChange={field.onChange}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem label="Response Date Range" className="col-span-2">
              <Controller
                name="filterResponseDate"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <DatePickerRange
                    placeholder="Select Response Dates"
                    value={field.value as [Date | null, Date | null]}
                    onChange={field.onChange}
                  />
                )}
              />
            </UiFormItem>
          </div>
        </UiForm>
      </Drawer>
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Inquiry"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete inquiry "
          <strong>{itemToDelete?.inquiry_id}</strong>"?
        </p>
      </ConfirmDialog>
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
      <InquiryViewModal
        isOpen={isViewDetailsModalOpen}
        onClose={() => {
          setIsViewDetailsModalOpen(false);
          setInquiryToView(null);
        }}
        inquiry={inquiryToView}
      />
      <InquiriesModals
        modalState={modalState}
        onClose={handleCloseModal}
        onSuccess={handleUpdateSuccess}
        getAllUserDataOptions={getAllUserDataOptions}
      />
    </>
  );
};

// --- InquiryListSelected Component ---
const InquiryListSelected = () => {
  const dispatch = useAppDispatch();
  const { selectedInquiries, setSelectedInquiries } = useInquiryList();
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = async () => {
    if (selectedInquiries.length === 0) return;
    setIsBulkDeleting(true);
    setDeleteConfirmationOpen(false);
    const idsToDelete = selectedInquiries.map((item) => item.id);
    try {
      await dispatch(
        deleteAllInquiryAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification type="success" title="Inquiries Deleted">
          Selected inquiries have been removed.
        </Notification>
      );
      setSelectedInquiries([]);
      dispatch(getInquiriesAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger">
          {error.message || "Failed to delete inquiries."}
        </Notification>
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      toast.push(
        <Notification type="success" title="Message Sent (Demo)">
          Message sent!
        </Notification>
      );
    }, 1000);
  };

  if (selectedInquiries.length === 0) return null;
  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <span>
              <span className="flex items-center gap-2">
                <span className="text-lg text-primary-600 dark:text-primary-400">
                  <TbChecks />
                </span>
                <span className="font-semibold flex items-center gap-1">
                  <span className="heading-text">
                    {selectedInquiries.length} Inquiries
                  </span>
                  <span>selected</span>
                </span>
              </span>
            </span>
            <div className="flex items-center">
              <Button
                size="sm"
                className="ltr:mr-3 rtl:ml-3"
                type="button"
                customColorClass={() =>
                  "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                }
                onClick={handleDelete}
                loading={isBulkDeleting}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="solid"
                onClick={() => setSendMessageDialogOpen(true)}
              >
                Message
              </Button>
            </div>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title="Remove Inquiries"
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={isBulkDeleting}
      >
        <p>
          Are you sure you want to remove these inquiries? This action can't be
          undone.
        </p>
      </ConfirmDialog>
      <Dialog
        isOpen={sendMessageDialogOpen}
        onRequestClose={() => setSendMessageDialogOpen(false)}
        onClose={() => setSendMessageDialogOpen(false)}
      >
        <h5 className="mb-2">Send Message</h5>
        <p>Send message regarding the following inquiries:</p>
        <div className="mt-4 max-h-32 overflow-y-auto">
          {selectedInquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="text-sm p-1 border-b dark:border-gray-700"
            >
              <Tooltip
                title={`${inquiry.inquiry_id}: ${inquiry.inquiry_subject} (Contact: ${inquiry.name})`}
              >
                <span>
                  {inquiry.inquiry_id} - {inquiry.company_name}
                </span>
              </Tooltip>
            </div>
          ))}
        </div>
        <div className="my-4">
          <RichTextEditor content={""} />
        </div>
        <div className="ltr:justify-end flex items-center gap-2">
          <Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="solid"
            loading={sendMessageLoading}
            onClick={handleSend}
          >
            Send
          </Button>
        </div>
      </Dialog>
    </>
  );
};

// --- Main Inquiries Page Component ---
const Inquiries = () => {
  const navigate = useNavigate();
  return (
    <InquiryListProvider>
      <>
        <Container>
          <AdaptiveCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h5>Inquiries</h5>
                <div className="flex flex-col md:flex-row gap-3">
                  <Button
                    variant="solid"
                    icon={<TbPlus className="text-lg" />}
                    onClick={() => {
                      navigate("/business-entities/create-inquiry");
                    }}
                  >
                    Add New
                  </Button>
                </div>
              </div>
              <InquiryListTable />
            </div>
          </AdaptiveCard>
        </Container>
        <InquiryListSelected />
      </>
    </InquiryListProvider>
  );
};

export default Inquiries;