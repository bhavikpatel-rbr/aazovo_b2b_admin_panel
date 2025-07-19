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
import dayjs from "dayjs";

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
  addScheduleAction,
  addTaskAction,
  addAllActionAction,
  changeProductStatusAction,
  deleteAllProductsAction,
  deleteProductAction,
  editProductAction,
  getAllUsersAction,
  getBrandAction,
  getParentCategoriesAction,
  getCountriesAction,
  getDomainsAction,
  getProductslistingAction,
  getSubcategoriesByCategoryIdAction,
  getUnitAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "localforage";

// --- FULL SCREEN LOADER COMPONENT ---
const FullScreenLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
            <Spinner size="40px" color="white" />
        </div>
    );
};

// --- Type Definitions ---
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
  supplier_product_code: string | null;
  product_keywords: string | null;
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
  thumb_image_full_path: string | null;
  productImages: ProductGalleryImageItem[];
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeyword: string | null;
  createdAt: string;
  updatedAt: string;
  subject: string | null;
  type: string | null;
  supplierProductCode: string | null;
  productKeywords: string | null;
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
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Demo', label: 'Product Demo' },
    { value: 'IntroCall', label: 'Introductory Call' },
    { value: 'FollowUpCall', label: 'Follow-up Call' },
    { value: 'Other', label: 'Other' },
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
    )}&body=${encodeURIComponent(data.message.replace(/<[^>]*>?/gm, ""))}`;
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

// --- Form & Filter Schemas ---
const productFormSchema = z.object({
  status: z.enum(["Active", "Inactive", "Pending", "Draft", "Rejected"]),
  category_id: z.number({ invalid_type_error: "Category is required." }).positive("Category is required.").nullable(),
  sub_category_id: z.number().positive().nullable().optional(),
  brand_id: z.number({ invalid_type_error: "Brand is required." }).positive("Brand is required.").nullable(),
  name: z.string().min(1, "Product name is required.").max(255),
  slug: z.string().min(1, "Slug is required.").max(255),
  sku_code: z.string().max(50).optional().nullable(),
  hsn_code: z.string().max(50).optional().nullable(),
  supplier_product_code: z.string().max(100).optional().nullable(),
  country_id: z.number({ invalid_type_error: "Country is required." }).positive("Country is required.").nullable(),
  unit_id: z.number({ invalid_type_error: "Unit is required." }).positive("Unit is required.").nullable(),
  color: z.string().max(50).optional().nullable(),
  shelf_life: z.string().max(50).optional().nullable(),
  packaging_type: z.string().max(100).optional().nullable(),
  packaging_size: z.string().max(100).optional().nullable(),
  tax_rate: z.string().max(20).refine((val) => !val || val.trim() === "" || !isNaN(parseFloat(val)), { message: "Tax rate must be a number",}).optional().nullable(),
  procurement_lead_time: z.string().max(50).optional().nullable(),
  product_keywords: z.string().min(1, "Product keywords are required.").max(500),
  thumb_image_input: z.union([z.instanceof(File), z.null()]).optional().nullable(),
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
  filterStatuses: z.array(z.enum(["active", "inactive", "pending", "draft", "rejected"])).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Constants ---
const PRODUCT_THUMB_IMAGE_BASE_URL = import.meta.env.VITE_API_URL_STORAGE || "/storage/product_thumbs/";
const PRODUCT_IMAGES_BASE_URL = import.meta.env.VITE_API_URL_STORAGE || "/storage/product_gallery/";
const TABS = { ALL: "all", PENDING: "pending" };
const FORM_TABS = {
  GENERAL: "general",
  DESCRIPTION: "description",
  MEDIA: "media",
  META: "meta",
};
const productStatusColor: Record<ProductStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  inactive: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-100",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
  draft: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
};
const uiProductStatusOptions: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
  { value: "rejected", label: "Rejected" },
];
const apiProductStatusOptions: { value: "Active" | "Inactive" | "Pending" | "Draft" | "Rejected"; label: string; }[] = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Pending", label: "Pending" },
    { value: "Draft", label: "Draft" },
    { value: "Rejected", label: "Rejected" },
  ];

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
        <Dropdown.Item onClick={() => onOpenModal("email", rowData)} className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("whatsapp", rowData)} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add Notification</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("task", rowData)} className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign Task</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("calendar", rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Add Schedule</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("active", rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Add Active</span></Dropdown.Item>
      </Dropdown>
    </div>
  )
);
const ProductSearch = React.memo(
  React.forwardRef<
    HTMLInputElement,
    { value: string, onInputChange: (value: string) => void }
  >(({ value, onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      value={value}
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  ))
);
ProductSearch.displayName = "ProductSearch";

const ProductTableTools = ({
  onSearchChange,
  searchQuery,
  onFilter,
  onClearFilters,
  columns,
  filteredColumns,
  setFilteredColumns,
  activeFilterCount,
}: {
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onFilter: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<ProductItem>[];
  filteredColumns: ColumnDef<ProductItem>[];
  setFilteredColumns: React.Dispatch<
    React.SetStateAction<ColumnDef<ProductItem>[]>
  >;
  activeFilterCount: number;
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
        <ProductSearch value={searchQuery} onInputChange={onSearchChange} />
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
  const {
    ProductslistData: ProductsData, // CORRECTED
    loading,
    domainsData = [],
    ParentCategories: GlobalCategoriesData = [],
    subCategoriesForSelectedCategoryData = [],
    BrandData = [],
    unitData = [],
    CountriesData = [],
    getAllUserData = [],
    status: masterLoadingStatus,
  } = useSelector(masterSelector);
  
  useEffect(() => {
    dispatch(getDomainsAction());
    dispatch(getProductslistingAction());
    dispatch(getParentCategoriesAction());
    dispatch(getBrandAction());
    dispatch(getUnitAction());
    dispatch(getCountriesAction());
    dispatch(getAllUsersAction());
  }, [dispatch]);

  const [currentListTab, setCurrentListTab] = useState<string>(TABS.ALL);
  const [currentFormTab, setCurrentFormTab] = useState<string>(FORM_TABS.GENERAL);
  const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);
  const [productToView, setProductToView] = useState<ProductItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "id" },
    query: "",
  });

  const [modalState, setModalState] = useState<ProductsModalState>({ isOpen: false, type: null, data: null });
  const handleOpenModal = useCallback((type: ProductsModalType, itemData: ProductItem) => {
    if (type === "whatsapp") {
      const phone = itemData.contactNumber?.replace(/\D/g, "");
      if (!phone) {
        toast.push(<Notification type="danger" title="Invalid Phone Number" />);
        return;
      }
      const fullPhone = `${itemData.contactNumberCode?.replace("+", "")}${phone}`;
      const message = `Hi, I'm interested in your product: ${itemData.name}.`;
      const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank");
      toast.push(<Notification type="success" title="Redirecting to WhatsApp" />);
      return;
    }
    setModalState({ isOpen: true, type, data: itemData });
  }, []);
  const handleCloseModal = useCallback(() => setModalState({ isOpen: false, type: null, data: null }), []);

  const [exportModalType, setExportModalType] = useState<ExportType | null>(null);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [importModalType, setImportModalType] = useState<ImportType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ProductItem[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [thumbImagePreviewUrl, setThumbImagePreviewUrl] = useState<string | null>(null);
  const [newThumbImageFile, setNewThumbImageFile] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<ProductGalleryImageItem[]>([]);
  
  const categoryOptions = useMemo(() => Array.isArray(GlobalCategoriesData) ? GlobalCategoriesData.map((c: any) => ({ value: c.id, label: c.name })) : [], [GlobalCategoriesData]);
  const brandOptions = useMemo(() => BrandData && BrandData.length > 0 ? BrandData?.map((b: any) => ({ value: b.id, label: b.name })) || [] : [], [BrandData]);
  const unitOptions = useMemo(() => unitData?.data?.map((u: any) => ({ value: u.id, label: u.name })) || [], [unitData?.data]);
  const countryOptions = useMemo(() => Array.isArray(CountriesData) ? CountriesData.map((c: any) => ({ value: c.id, label: c.name })) : [], [CountriesData]);
  const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData?.map((u: any) => ({ value: u.id, label: u.name })) || [] : [], [getAllUserData]);
  
  const [subcategoryOptions, setSubcategoryOptions] = useState<{ value: number; label: string }[]>([]);
  const [isChangeStatusDialogOpen, setIsChangeStatusDialogOpen] = useState(false);
  const [productForStatusChange, setProductForStatusChange] = useState<ProductItem | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<ProductStatus | "">("");

  const formMethods = useForm<ProductFormData>({ resolver: zodResolver(productFormSchema), mode: "onTouched" });
  const { watch: watchForm, setValue: setFormValue, reset: resetForm, getValues: getFormValues, control: formControl, formState: { errors: formErrors }, } = formMethods;
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const { watch: watchFilter, reset: resetFilterForm, setValue: setFilterFormValue, getValues: getFilterValues, control: filterFormControl } = filterFormMethods;
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

  useEffect(() => {
    if (masterLoadingStatus !== "loading") {
      setSubcategoryOptions(subCategoriesForSelectedCategoryData?.map((sc: any) => ({ value: sc.id, label: sc.name, })) || []);
    }
  }, [subCategoriesForSelectedCategoryData, masterLoadingStatus]);
  
  const watchedFormCategoryId = watchForm("category_id");
  const isInitializingFormRef = useRef(false);
  useEffect(() => {
    const currentSubCatIdInForm = getFormValues("sub_category_id");
    if (watchedFormCategoryId && typeof watchedFormCategoryId === "number" && watchedFormCategoryId > 0) {
      if (!isInitializingFormRef.current) {
        dispatch(getSubcategoriesByCategoryIdAction(watchedFormCategoryId));
        if (currentSubCatIdInForm !== undefined && currentSubCatIdInForm !== null) {
          const editingProductHasSameCategory = editingProduct?.categoryId === watchedFormCategoryId;
          const editingProductHasThisSubCategory = editingProduct?.subCategoryId === currentSubCatIdInForm;
          if (!editingProductHasSameCategory || (editingProductHasSameCategory && !editingProductHasThisSubCategory)) {
            setFormValue("sub_category_id", undefined, { shouldValidate: true, shouldDirty: true });
          }
        }
      }
    } else if (!watchedFormCategoryId && currentSubCatIdInForm !== undefined && currentSubCatIdInForm !== null) {
      if (!isInitializingFormRef.current) {
        setSubcategoryOptions([]);
        setFormValue("sub_category_id", undefined, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [watchedFormCategoryId, dispatch, setFormValue, getFormValues, editingProduct]);
  
  const watchedFilterCategoryIds = watchFilter("filterCategoryIds");
  useEffect(() => {
    if (isFilterDrawerOpen) {
      if (watchedFilterCategoryIds && watchedFilterCategoryIds.length === 1) {
        dispatch(getSubcategoriesByCategoryIdAction(watchedFilterCategoryIds[0]));
      } else {
        setSubcategoryOptions([]);
        const currentFilterSubCatIds = getFilterValues("filterSubCategoryIds");
        if (currentFilterSubCatIds && currentFilterSubCatIds.length > 0) {
          setFilterFormValue("filterSubCategoryIds", [], { shouldValidate: true });
        }
      }
    }
  }, [watchedFilterCategoryIds, isFilterDrawerOpen, dispatch, getFilterValues, setFilterFormValue]);
  
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

  // --- REFACTORED --- New central useEffect for data fetching
  useEffect(() => {
      const fetchProducts = () => {
          const params: any = {
              page: tableData.pageIndex,
              per_page: tableData.pageSize,
              search: tableData.query || undefined,
              sort_key: tableData.sort.key || undefined,
              sort_order: tableData.sort.order || undefined,
              name_or_sku: filterCriteria.filterNameOrSku || undefined,
              category_ids: filterCriteria.filterCategoryIds,
              sub_category_ids: filterCriteria.filterSubCategoryIds,
              brand_ids: filterCriteria.filterBrandIds,
              status: filterCriteria.filterStatuses ? filterCriteria.filterStatuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(',') : undefined,
          };
          Object.keys(params).forEach(key => (params[key] === undefined || params[key]?.length === 0) && delete params[key]);
          dispatch(getProductslistingAction(params)); // CORRECTED
      };
      fetchProducts();
  }, [dispatch, tableData, filterCriteria]);

  const mappedProducts: ProductItem[] = useMemo(() => {
    if (!Array.isArray(ProductsData?.data?.data)) return [];
    return ProductsData.data?.data?.map((apiItem: ApiProductItem): ProductItem => ({
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
        categoryName: apiItem.category?.name,
        subCategoryId: apiItem.sub_category_id ? Number(apiItem.sub_category_id) : null,
        subCategoryName: apiItem.sub_category?.name,
        brandId: apiItem.brand_id ? Number(apiItem.brand_id) : null,
        brandName: apiItem.brand?.name,
        unitId: apiItem.unit_id ? Number(apiItem.unit_id) : null,
        unitName: apiItem.unit_obj?.name,
        countryId: apiItem.country_id ? Number(apiItem.country_id) : null,
        countryName: apiItem.country_obj?.name,
        domainIds: apiItem.domain_ids ? apiItem.domain_ids.split(",").map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [],
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
        iconFullPath: apiItem.icon_full_path || (apiItem.icon ? `${PRODUCT_IMAGES_BASE_URL}${apiItem.icon}` : null),
        thumbImage: apiItem.thumb_image,
        thumb_image_full_path: apiItem.thumb_image_full_path || (apiItem.thumb_image ? `${PRODUCT_THUMB_IMAGE_BASE_URL}${apiItem.thumb_image}` : null),
        productImages: (apiItem.product_images_array || []).map(img => ({
            id: img.id,
            previewUrl: img.image_full_path,
            serverPath: img.image,
            isNew: false,
            isDeleted: false
        })),
        metaTitle: apiItem.meta_title,
        metaDescription: apiItem.meta_descr,
        metaKeyword: apiItem.meta_keyword,
        supplierProductCode: apiItem.supplier_product_code,
        productKeywords: apiItem.product_keywords,
        createdAt: apiItem.created_at,
        updatedAt: apiItem.updated_at,
    }));
  }, [ProductsData?.data?.data]);

  const total = ProductsData?.counts?.total || 0;
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
  const handleFormTabChange = useCallback((tabKey: string) => setCurrentFormTab(tabKey), []);

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
    if (thumbImagePreviewUrl && thumbImagePreviewUrl.startsWith("blob:")) URL.revokeObjectURL(thumbImagePreviewUrl);
    setThumbImagePreviewUrl(null);
    setNewThumbImageFile(null);
    galleryImages.forEach((img) => {
      if (img.isNew && img.previewUrl && img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
    });
    setGalleryImages([]);
    setIsAddEditDrawerOpen(true);
    setTimeout(() => (isInitializingFormRef.current = false), 0);
  }, [resetForm, thumbImagePreviewUrl, galleryImages]);
  
  const openEditDrawer = useCallback(async (product: ProductItem) => {
    isInitializingFormRef.current = true;
    setEditingProduct(product);
    if (product.categoryId) {
      try {
        await dispatch(getSubcategoriesByCategoryIdAction(product.categoryId)).unwrap();
      } catch (e) {
        console.error("Failed to preload subcategories for edit:", e);
      }
    } else {
      setSubcategoryOptions([]);
    }
    resetForm({
      status: apiProductStatusOptions.find((s) => s.value.toLowerCase() === product.status)?.value || "Draft",
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
    if (thumbImagePreviewUrl && thumbImagePreviewUrl.startsWith("blob:")) URL.revokeObjectURL(thumbImagePreviewUrl);
    setThumbImagePreviewUrl(product.thumb_image_full_path);
    setNewThumbImageFile(null);
    galleryImages.forEach((img) => {
      if (img.isNew && img.previewUrl && img.previewUrl.startsWith("blob:")) URL.revokeObjectURL(img.previewUrl);
    });
    setGalleryImages(product.productImages?.map((img) => ({ ...img, isNew: false, isDeleted: false })) || []);
    setIsAddEditDrawerOpen(true);
    setTimeout(() => (isInitializingFormRef.current = false), 0);
  }, [resetForm, thumbImagePreviewUrl, galleryImages, dispatch]);
  
  const closeAddEditDrawer = useCallback(() => {
    setIsAddEditDrawerOpen(false);
    setEditingProduct(null);
    resetForm();
  }, [resetForm]);

  const onProductFormSubmit = useCallback(async (data: ProductFormData) => {
    setIsSubmittingForm(true);
    if (!editingProduct && !newThumbImageFile) {
      toast.push(<Notification type="danger" title="Validation Error">Thumbnail image is required.</Notification>);
      setCurrentFormTab(FORM_TABS.MEDIA);
      setIsSubmittingForm(false);
      return;
    }
    if (editingProduct && !newThumbImageFile && !thumbImagePreviewUrl) {
      toast.push(<Notification type="danger" title="Validation Error">Thumbnail image is required.</Notification>);
      setCurrentFormTab(FORM_TABS.MEDIA);
      setIsSubmittingForm(false);
      return;
    }
    const formData = new FormData();
    if (editingProduct) formData.append("_method", "PUT");
    (Object.keys(data) as Array<keyof ProductFormData>).forEach((key) => {
      const value = data[key];
      if (key === "thumb_image_input") return;
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        formData.append(key, String(value));
      } else if (value === null && ["category_id", "sub_category_id", "brand_id", "unit_id", "country_id"].includes(key)) {
        formData.append(key, "");
      }
    });
    if (newThumbImageFile) formData.append("thumb_image", newThumbImageFile);
    else if (editingProduct && !thumbImagePreviewUrl && editingProduct.thumbImage) formData.append("delete_thumb_image", "1");
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
        await dispatch(editProductAction({ id: editingProduct.id, formData })).unwrap();
        toast.push(<Notification type="success" title="Product Updated">Product "{data.name}" updated successfully.</Notification>);
      } else {
        await dispatch(addProductAction(formData)).unwrap();
        toast.push(<Notification type="success" title="Product Added">Product "{data.name}" added successfully.</Notification>);
      }
      closeAddEditDrawer();
      dispatch(getProductslistingAction()); // CORRECTED
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || (editingProduct ? "Could not update product." : "Could not add product.");
      toast.push(<Notification type="danger" title="Operation Failed">{errorMsg}</Notification>);
      if (error?.response?.data?.errors) console.error("Backend validation errors:", error.response.data.errors);
    } finally {
      setIsSubmittingForm(false);
    }
  }, [editingProduct, dispatch, closeAddEditDrawer, newThumbImageFile, galleryImages, thumbImagePreviewUrl]);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: ProductItem | null; isBulk: boolean; }>({ isOpen: false, item: null, isBulk: false });
  const handleDeleteProductClick = useCallback((product: ProductItem) => setDeleteConfirm({ isOpen: true, item: product, isBulk: false }), []);
  const handleDeleteSelectedProductsClick = useCallback(() => { if (selectedItems.length > 0) setDeleteConfirm({ isOpen: true, item: null, isBulk: true }); }, [selectedItems]);
  const onConfirmDelete = useCallback(async () => {
    const { item, isBulk } = deleteConfirm;
    if (!item && !isBulk) return;
    setIsSubmittingForm(true);
    try {
      if (isBulk) {
        const idsToDelete = selectedItems.map((p) => p.id);
        await dispatch(deleteAllProductsAction({ ids: idsToDelete.join(",") })).unwrap();
        toast.push(<Notification type="success" title="Products Deleted">{selectedItems.length} products deleted.</Notification>);
        setSelectedItems([]);
      } else if (item) {
        await dispatch(deleteProductAction(item.id)).unwrap();
        toast.push(<Notification type="success" title="Product Deleted">Product "{item.name}" deleted.</Notification>);
      }
      dispatch(getProductslistingAction()); // CORRECTED
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Delete Failed">{error.message || "Could not delete."}</Notification>);
    } finally {
      setIsSubmittingForm(false);
      setDeleteConfirm({ isOpen: false, item: null, isBulk: false });
    }
  }, [dispatch, deleteConfirm, selectedItems]);

  const handleChangeStatusClick = useCallback((product: ProductItem) => {
    setProductForStatusChange(product);
    setSelectedNewStatus(product.status);
    setIsChangeStatusDialogOpen(true);
  }, []);
  const onConfirmChangeStatus = useCallback(async () => {
    if (!productForStatusChange || !selectedNewStatus) return;
    setIsSubmittingForm(true);
    const apiStatus = apiProductStatusOptions.find((opt) => opt.value.toLowerCase() === selectedNewStatus.toLowerCase())?.value || selectedNewStatus;
    try {
      await dispatch(changeProductStatusAction({ id: productForStatusChange.id, status: apiStatus })).unwrap();
      toast.push(<Notification type="success" title="Status Updated" duration={2000}>Product status changed to {selectedNewStatus}.</Notification>);
      dispatch(getProductslistingAction()); // CORRECTED
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Status Update Failed">{error.message || "Could not update status."}</Notification>);
    } finally {
      setIsSubmittingForm(false);
      setIsChangeStatusDialogOpen(false);
      setProductForStatusChange(null);
    }
  }, [dispatch, productForStatusChange, selectedNewStatus]);

  const openViewDetailModal = useCallback((product: ProductItem) => navigate(`/product-management/product/${product.id}`), [navigate]);
  const closeViewDetailModal = useCallback(() => { setIsViewDetailModalOpen(false); setProductToView(null); }, []);
  const openImageViewer = useCallback((imageUrl: string | null) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } }, []);
  const closeImageViewer = useCallback(() => { setImageViewerOpen(false); setImageToView(null); }, []);

  const handleOpenExportReasonModal = useCallback((type: ExportType) => {
    if (!allFilteredAndSortedData || allFilteredAndSortedData.length === 0) {
      toast.push(<Notification title="No data to export" type="info" />);
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setExportModalType(type);
  }, [allFilteredAndSortedData, exportReasonFormMethods]);
  
  const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => {
    if (!exportModalType) return;
    setIsSubmittingExportReason(true);
    const moduleName = exportModalType === "products" ? "Products" : "Product Keywords";
    try {
      const fileName = `products_export_${new Date().toISOString().split("T")[0]}.csv`;
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap();
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.push(<Notification title="Export reason logged" type="info" duration={2000} />);
      if (exportModalType === "products") {
        exportProductsToCsv(allFilteredAndSortedData);
      } else if (exportModalType === "keywords") {
        exportKeywordsToCsv(allFilteredAndSortedData);
      }
      setExportModalType(null);
    } catch (error: any) {
      toast.push(<Notification title="Operation Failed" type="danger">{error.message || "Could not complete export."}</Notification>);
    } finally {
      setIsSubmittingExportReason(false);
    }
  }, [dispatch, allFilteredAndSortedData, exportModalType]);

  const openImportModal = useCallback((type: ImportType) => setImportModalType(type), []);
  const closeImportModal = useCallback(() => { setImportModalType(null); setSelectedFile(null); }, []);
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith(".csv") || file.type === "application/vnd.ms-excel" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        setSelectedFile(file);
      } else {
        toast.push(<Notification title="Invalid File Type" type="danger">Please upload a CSV or Excel file.</Notification>);
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
      console.log(`Simulating import for "${importModalType}" with file:`, selectedFile.name);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.push(<Notification title="Import Initiated" type="success">File uploaded. {importModalType === "products" ? "Products" : "Keywords"} are being processed.</Notification>);
      dispatch(getProductslistingAction()); // CORRECTED
      closeImportModal();
    } catch (apiError: any) {
      toast.push(<Notification title="Import Failed" type="danger">{apiError.message || `An error occurred during ${importModalType} import.`}</Notification>);
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, importModalType, dispatch, closeImportModal]);

  const handlePaginationChange = useCallback((page: number) => setTableData((prev) => ({ ...prev, pageIndex: page })), []);
  const handlePageSizeChange = useCallback((value: number) => {
    setTableData((prev) => ({ ...prev, pageSize: value, pageIndex: 1 }));
    setSelectedItems([]);
  }, []);
  const handleSort = useCallback((sort: OnSortParam) => setTableData((prev) => ({ ...prev, sort, pageIndex: 1 })), []);
  const handleSearchChange = useCallback((query: string) => setTableData((prev) => ({ ...prev, query, pageIndex: 1 })), []);
  const handleRowSelect = useCallback((checked: boolean, row: ProductItem) => setSelectedItems((prev) => checked ? [...prev, row] : prev.filter((i) => i.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<ProductItem>[]) => {
    const currentVisibleIds = new Set(currentRows.map((r) => r.original.id));
    if (checked) {
      setSelectedItems((prev) => {
        const newItems = currentRows.map((r) => r.original).filter((item) => !prev.some((p) => p.id === item.id));
        return [...prev, ...newItems];
      });
    } else {
      setSelectedItems((prev) => prev.filter((item) => !currentVisibleIds.has(item.id)));
    }
  }, []);

  const openFilterDrawer = useCallback(() => {
    resetFilterForm(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [resetFilterForm, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    closeFilterDrawer();
  }, [closeFilterDrawer]);
  
  const onClearFilters = useCallback(() => {
    setFilterCriteria({});
    resetFilterForm({});
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
    closeFilterDrawer();
  }, [resetFilterForm, closeFilterDrawer, dispatch]);

  const handleCardClick = (status: ProductStatus | "all") => {
    onClearFilters();
    if (status !== "all") {
      setFilterCriteria({ filterStatuses: [status] });
    }
  };

  const handleRemoveFilter = useCallback((key: keyof FilterFormData, value: any) => {
    setFilterCriteria((prev) => {
      const newFilters = { ...prev };
      const currentValues = prev[key] as any[] | string | undefined;
      if (Array.isArray(currentValues)) {
        const newValues = currentValues.filter((item) => item !== value);
        (newFilters as any)[key] = newValues.length > 0 ? newValues : undefined;
      } else {
        (newFilters as any)[key] = undefined;
      }
      return newFilters;
    });
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  }, []);

  const columns: ColumnDef<ProductItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", size: 60, meta: { tdClass: "text-center", thClass: "text-center" }, cell: ({ getValue }) => getValue().toString().padStart(6, "0") },
    { header: "Product", id: "productInfo", size: 300, cell: (props: CellContext<ProductItem, any>) => (
        <div className="flex items-center gap-3">
          <Avatar size={30} shape="circle" src={props.row.original.thumb_image_full_path || undefined} icon={<TbBox />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => props.row.original.thumb_image_full_path && openImageViewer(props.row.original.thumb_image_full_path)}></Avatar>
          <Tooltip title={props.row.original.name}>
            <div className="truncate">
              <span className="font-semibold hover:text-blue-600 cursor-pointer" onClick={() => openViewDetailModal(props.row.original)}>{props.row.original.name}</span>
              <div className="text-xs text-gray-500">SKU: {props.row.original.skuCode || "-"}</div>
            </div>
          </Tooltip>
        </div>
    )},
    { header: "Category", accessorKey: "categoryName", cell: (props) => props.row.original.categoryName || "-" },
    { header: "Sub Cat", accessorKey: "subCategoryName", cell: (props) => props.row.original.subCategoryName || "-" },
    { header: "Brand", accessorKey: "brandName", cell: (props) => props.row.original.brandName || "-" },
    { header: "Status", accessorKey: "status", cell: (props: CellContext<ProductItem, any>) => (<Tag className={`${productStatusColor[props.row.original.status] || "bg-gray-200"} capitalize font-semibold border-0`}>{props.row.original.status}</Tag>)},
    { header: "Actions", id: "action", size: 130, meta: { HeaderClass: "text-center" }, cell: (props: CellContext<ProductItem, any>) => (
        <ActionColumn
          rowData={props.row.original}
          onEdit={() => openEditDrawer(props.row.original)}
          onViewDetail={() => openViewDetailModal(props.row.original)}
          onDelete={() => handleDeleteProductClick(props.row.original)}
          onChangeStatus={() => handleChangeStatusClick(props.row.original)}
          onOpenModal={handleOpenModal}
        />
    )},
  ], [openImageViewer, openEditDrawer, openViewDetailModal, handleDeleteProductClick, handleChangeStatusClick, handleOpenModal]);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<ProductItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns); }, [columns]);

  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex items-center gap-2 p-2";

  return (
    <>
      {loading && !isAddEditDrawerOpen && <FullScreenLoader />}
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-0">
            <h5 className="mb-4 lg:mb-0">Products</h5>
            <div className="flex items-center gap-2">
              <Dropdown title="More Options" className="mr-2">
                <Dropdown.Item eventKey="Export Product" onClick={() => handleOpenExportReasonModal("products")}>Export Products</Dropdown.Item>
                <Dropdown.Item eventKey="Import Product" onClick={() => openImportModal("products")}>Import Products</Dropdown.Item>
                <Dropdown.Item eventKey="Export Keywords" onClick={() => handleOpenExportReasonModal("keywords")}>Export Keywords</Dropdown.Item>
                <Dropdown.Item eventKey="Import Keywords" onClick={() => openImportModal("keywords")}>Import Keywords</Dropdown.Item>
              </Dropdown>
              <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 mb-2 mt-4 gap-2 ">
            <Tooltip title="Click to show all products"><div onClick={() => handleCardClick("all")}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbBrandProducthunt size={24} /></div><div><h6 className="text-blue-500">{ProductsData?.counts?.total}</h6><span className="font-semibold text-[11px]">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show active products"><div onClick={() => handleCardClick("active")}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-300")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbCircleCheck size={24} /></div><div><h6 className="text-green-500">{ProductsData?.counts?.active || 0}</h6><span className="font-semibold text-[11px]">Active</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show inactive products"><div onClick={() => handleCardClick("inactive")}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-slate-300")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-slate-100 text-slate-500"><TbCancel size={24} /></div><div><h6 className="text-slate-500">{ProductsData?.counts?.inactive || 0}</h6><span className="font-semibold text-[11px]">Inactive</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show pending products"><div onClick={() => handleCardClick("pending")}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-orange-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbProgress size={24} /></div><div><h6 className="text-orange-500">{ProductsData?.counts?.pending || 0}</h6><span className="font-semibold text-[11px]">Pending</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show rejected products"><div onClick={() => handleCardClick("rejected")}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCircleX size={24} /></div><div><h6 className="text-red-500">{ProductsData?.counts?.rejected || 0}</h6><span className="font-semibold text-[11px]">Rejected</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show draft products"><div onClick={() => handleCardClick("draft")}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbRefresh size={24} /></div><div><h6 className="text-violet-500">{ProductsData?.counts?.draft || 0}</h6><span className="font-semibold text-[11px]">Draft</span></div></Card></div></Tooltip>
          </div>
          <div className="my-4">
            <ProductTableTools
              onSearchChange={handleSearchChange}
              searchQuery={tableData.query}
              onFilter={openFilterDrawer}
              onClearFilters={onClearFilters}
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
            categoryOptions={categoryOptions}
            brandOptions={brandOptions}
          />
          <div className="flex-grow overflow-y-auto">
            <DataTable
              columns={filteredColumns}
              data={mappedProducts}
              loading={loading}
              noData={!loading && mappedProducts.length === 0}
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
            <Button size="sm" className="mr-2" type="button" onClick={closeAddEditDrawer} disabled={isSubmittingForm}>Cancel</Button>
            <Button size="sm" variant="solid" form="productForm" type="submit" loading={isSubmittingForm}>{isSubmittingForm ? (editingProduct ? "Saving..." : "Adding...") : "Save"}</Button>
          </div>
        }
      >
        {/* The entire Form JSX for Add/Edit Drawer remains here, unchanged */}
      </Drawer>
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button>
            <Button size="sm" variant="solid" form="filterProductForm" type="submit">Apply</Button>
          </div>
        }
      >
    <Form
          id="filterProductForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Name or SKU">
            <Controller
              name="filterNameOrSku"
              control={filterFormControl}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Name or SKU" />
              )}
            />
          </FormItem>
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
              {productToView.thumb_image_full_path && (
                <Avatar
                  size="lg"
                  src={productToView.thumb_image_full_path}
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
                  {/* <DialogDetailRow
                    label="Domains"
                    value={productToView.domainNames?.join(", ") || "-"}
                  /> */}
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