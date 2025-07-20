// src/views/your-path/SubscribersListing.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import cloneDeep from "lodash/cloneDeep";
import React, { ChangeEvent, Ref, useCallback, useEffect, useMemo, useState } from "react";
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
import DebounceInput from "@/components/shared/DebouceInput";
import {
  Button,
  Card,
  Checkbox,
  Dialog,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Notification,
  Skeleton,
  Tag,
  Tooltip,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import DatePicker from "@/components/ui/DatePicker";
import Select from "@/components/ui/Select";
import toast from "@/components/ui/toast";

// Icons
import {
  TbBrandWhatsapp,
  TbCalendarCancel,
  TbCaravan,
  TbCloudDownload,
  TbCloudUpload,
  TbColumns,
  TbFileText,
  TbFilter,
  TbMail,
  TbMailForward,
  TbPencil,
  TbPhone,
  TbPlus,
  TbReload,
  TbSearch,
  TbTrash,
  TbUserCircle,
  TbUserStar,
  TbWorld,
  TbX
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  CellContext,
  ColumnDef,
  OnSortParam,
  RowSelectionState
} from "@/components/shared/DataTable";
import { SelectOption } from "../RequestFeedback/RequestAndFeedback"; // Adjust import path

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addNotificationAction,
  addScheduleAction,
  addSubscriberAction,
  editSubscriberAction,
  getAllUsersAction,
  getSubscribersAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { formatCustomDateTime } from "@/utils/formatCustomDateTime";
import { shallowEqual, useSelector } from "react-redux";

// --- Define Types ---
export type ApiSubscriberItem = {
  id: number | string;
  email: string;
  name?: string | null;
  mobile?: string | null;
  created_at: string;
  updated_at?: string;
  member_id?: number | string | null;
  status: string;
  subscription_types?: string[] | null;
  source?: string | null;
  note?: string | null;
  reason?: string | null;
  updated_by_user?: {
    name: string;
    roles: { display_name: string }[];
    profile_pic_path?: string | null;
  };
};

export type SubscriberItem = {
  id: number | string;
  email: string;
  name: string;
  mobile_no: string;
  subscribedDate: Date;
  subscriptionTypes: string[];
  source: string;
  status: string;
  remarks: string;
  raw_created_at: string;
  raw_updated_at?: string;
  updated_by_user?: ApiSubscriberItem["updated_by_user"];
};

export type ModalType = "notification" | "schedule";
export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data: SubscriberItem | null;
}

// --- Zod Schemas ---
const filterFormSchema = z.object({
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
  status: z.string().optional().nullable(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

export const SUBSCRIPTION_TYPE_OPTIONS: SelectOption[] = [
  { label: "Inquiry Alerts", value: "Inquiry Alerts" },
  { label: "Newsletter", value: "Newsletter" },
  { label: "Trade Alerts", value: "Trade Alerts" },
  { label: "Promotional", value: "Promotional" },
  { label: "Product Updates", value: "Product Updates" },
];

export const STATUS_OPTIONS: SelectOption[] = [
  { label: "Subscribed", value: "Subscribed" },
  { label: "Unsubscribed", value: "Unsubscribed" },
];
const statusValues = STATUS_OPTIONS.map((opt) => opt.value) as [
  string,
  ...string[]
];

export const FILTER_STATUS_OPTIONS: SelectOption[] = [
  { label: "All Statuses", value: "" },
  ...STATUS_OPTIONS,
];

export const statusColors: Record<string, string> = {
  Subscribed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Unsubscribed: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
  default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const addEditSubscriberFormSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Invalid email address."),
  name: z.string().max(100).optional().nullable(),
  mobile_no: z.string().max(20).optional().nullable(),
  subscriptionTypes: z.array(z.string()).min(1, "At least one subscription type is required."),
  source: z.string().max(100).optional().nullable(),
  status: z.enum(statusValues, { required_error: "Status is required." }),
  remarks: z.string().max(1000).optional().nullable(),
});
type AddEditSubscriberFormData = z.infer<typeof addEditSubscriberFormSchema>;

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

const eventTypeOptions = [
  { value: "Meeting", label: "Meeting" },
  { value: "FollowUpCall", label: "Follow-up Call" },
  { value: "Other", label: "Other" },
];

// --- CSV Exporter Utility ---
const CSV_HEADERS = ["ID", "Name", "Email", "Mobile No", "Subscribed Date", "Subscription Types", "Source", "Status", "Remarks"];
const CSV_KEYS: (keyof SubscriberItem)[] = ["id", "name", "email", "mobile_no", "subscribedDate", "subscriptionTypes", "source", "status", "remarks"];
function exportSubscribersToCsv(filename: string, rows: SubscriberItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info" duration={2000}>Nothing to export.</Notification>); return false; }
  const separator = ",";
  const csvContent = CSV_HEADERS.join(separator) + "\n" + rows.map((row) => {
    return CSV_KEYS.map((k) => {
      let cell = row[k] as any;
      if (cell === null || cell === undefined) { cell = ""; }
      else if (cell instanceof Date) { cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss"); }
      else if (Array.isArray(cell)) { cell = cell.join("; "); }
      else { cell = String(cell).replace(/"/g, '""'); }
      if (String(cell).search(/("|,|\n)/g) >= 0) { cell = `"${cell}"`; }
      return cell;
    }).join(separator);
  }).join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
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
  toast.push(<Notification title="Export Failed" type="danger" duration={3000}>Browser does not support this feature.</Notification>);
  return false;
}

const AddNotificationDialog = ({ document, onClose, getAllUserDataOptions }: { document: SubscriberItem; onClose: () => void; getAllUserDataOptions: SelectOption[]; }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const notificationSchema = z.object({
        notification_title: z.string().min(3, "Title must be at least 3 characters long."),
        send_users: z.array(z.number()).min(1, "Please select at least one user."),
        message: z.string().min(10, "Message must be at least 10 characters long."),
    });
    type NotificationFormData = z.infer<typeof notificationSchema>;
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({
        resolver: zodResolver(notificationSchema),
        defaultValues: { notification_title: `Regarding Subscriber: ${document.name}`, send_users: [], message: `This is a notification regarding subscriber "${document.name}" (${document.email}).` },
        mode: 'onChange'
    });

    const onSend = async (formData: NotificationFormData) => {
        setIsLoading(true);
        const payload = { send_users: formData.send_users, notification_title: formData.notification_title, message: formData.message, module_id: String(document.id), module_name: 'Subscriber' };
        try {
            await dispatch(addNotificationAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Notification Sent Successfully!" />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || 'An unknown error occurred.'} />);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Notify about: {document.name}</h5>
            <Form onSubmit={handleSubmit(onSend)}>
                <FormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                <FormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<Select isMulti placeholder="Select User(s)" options={getAllUserDataOptions} value={getAllUserDataOptions.filter(o => field.value?.includes(o.value))} onChange={(options: any) => field.onChange(options?.map((o: any) => o.value) || [])} />)} /></FormItem>
                <FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem>
                <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button></div>
            </Form>
        </Dialog>
    );
};

const AddScheduleDialog: React.FC<{ document: SubscriberItem; onClose: () => void; }> = ({ document, onClose }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: { event_title: `Follow-up with Subscriber ${document.name}`, event_type: undefined, date_time: null as any, remind_from: null, notes: `Regarding subscriber ${document.name} (${document.email}).` },
        mode: 'onChange',
    });
    const onAddEvent = async (data: ScheduleFormData) => {
        setIsLoading(true);
        const payload = {
            module_id: Number(document.id),
            module_name: 'Subscriber',
            event_title: data.event_title,
            event_type: data.event_type,
            date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'),
            ...(data.remind_from && { remind_from: dayjs(data.remind_from).format("YYYY-MM-DDTHH:mm:ss") }),
            notes: data.notes || '',
        };
        try {
            await dispatch(addScheduleAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for ${document.name}.`} />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Add Schedule for Subscriber: {document.name}</h5>
            <Form onSubmit={handleSubmit(onAddEvent)}>
                <FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<Select placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem>
                    <FormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
                </div>
                <FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
                <FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
                <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div>
            </Form>
        </Dialog>
    );
};

const SubscriberModals = ({ modalState, onClose, getAllUserDataOptions }: { modalState: ModalState; onClose: () => void; getAllUserDataOptions: SelectOption[]; }) => {
    const { type, data: document, isOpen } = modalState;
    if (!isOpen || !document) return null;
    switch (type) {
        case 'notification': return <AddNotificationDialog document={document} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
        case 'schedule': return <AddScheduleDialog document={document} onClose={onClose} />;
        default: return null;
    }
};

type SubscriberSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const SubscriberSearch = React.forwardRef<HTMLInputElement, SubscriberSearchProps>(({ onInputChange }, ref) => (
  <DebounceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search (Email, Name, Mobile)..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e.target.value)}
  />
));
SubscriberSearch.displayName = "SubscriberSearch";

const SubscriberTableTools = ({ onSearchChange, onFilter, onExport, onImport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount, isDataReady }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onImport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<SubscriberItem>[];
  filteredColumns: ColumnDef<SubscriberItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<SubscriberItem>[]>>;
  activeFilterCount: number;
  isDataReady: boolean;
}) => {
  const isColumnVisible = (colId: string) => filteredColumns.some((c) => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      const originalColumn = columns.find((c) => (c.id || c.accessorKey) === colId);
      if (originalColumn) {
        setFilteredColumns((prev) => {
          const newCols = [...prev, originalColumn];
          newCols.sort((a, b) => {
            const indexA = columns.findIndex((c) => (c.id || c.accessorKey) === (a.id || a.accessorKey));
            const indexB = columns.findIndex((c) => (c.id || c.accessorKey) === (b.id || b.accessorKey));
            return indexA - indexB;
          });
          return newCols;
        });
      }
    } else {
      setFilteredColumns((prev) => prev.filter((c) => (c.id || c.accessorKey) !== colId));
    }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <SubscriberSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
          <div className="flex flex-col p-2">
            <div className="font-semibold mb-1 border-b pb-1">Toggle Columns</div>
            {columns.map((col) => {
              const id = col.id || (col.accessorKey as string);
              return (
                col.header && typeof col.header === "string" && (
                  <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2">
                    <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox>
                  </div>
                )
              );
            })}
          </div>
        </Dropdown>
        <Tooltip title="Clear Filters"><Button icon={<TbReload />} onClick={onClearFilters} disabled={!isDataReady}></Button></Tooltip>
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto" disabled={!isDataReady}>
          Filter{" "}
          {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}
        </Button>
        <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto" disabled={!isDataReady}>Import</Button>
        <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto" disabled={!isDataReady}>Export</Button>
      </div>
    </div>
  );
};
SubscriberTableTools.displayName = "SubscriberTableTools";

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData) => void;
  onClearAll: () => void;
}) => {
  const hasFilters = (filterData.status && filterData.status !== "") || (filterData.dateRange && (filterData.dateRange[0] || filterData.dateRange[1]));
  if (!hasFilters) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {filterData.status && (<Tag prefix>Status: {filterData.status} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter("status")} /></Tag>)}
      {filterData.dateRange && (filterData.dateRange[0] || filterData.dateRange[1]) && (
          <Tag prefix>Date: {dayjs(filterData.dateRange[0]).format("MMM D")} -{" "}{dayjs(filterData.dateRange[1]).format("MMM D, YYYY")}{" "}
            <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter("dateRange")} />
          </Tag>
        )}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};

// --- Main SubscribersListing Component ---
const SubscribersListing = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { rawApiSubscribers = { data: [], counts: {} }, getAllUserData = [], status: masterLoadingStatus = "idle", error: masterError = null, } = useSelector(masterSelector, shallowEqual);
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubscriberItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SubscriberItem | null>(null);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(filterFormSchema.parse({}));
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "subscribedDate" }, query: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
  const [imageView, setImageView] = useState("");
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const isDataReady = !initialLoading;
  const tableLoading = initialLoading || isSubmitting || isDeleting;

  const openImageViewer = useCallback((path: string | null | undefined) => {
    if (path) { setImageView(path); setIsImageViewerOpen(true); }
    else { toast.push(<Notification title="No Image" type="info">User has no profile picture.</Notification>); }
  }, []);
  const closeImageViewer = useCallback(() => { setIsImageViewerOpen(false); setImageView(""); }, []);

  useEffect(() => {
    const fetchData = async () => {
        setInitialLoading(true);
        try {
            await Promise.all([
                dispatch(getSubscribersAction()),
                dispatch(getAllUsersAction())
            ]);
        } catch (error) {
            console.error("Failed to load subscriber data", error);
            toast.push(<Notification type="danger" title="Error">Could not load subscriber data.</Notification>)
        } finally {
            setInitialLoading(false);
        }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (masterLoadingStatus === "failed" && masterError) {
      const errorMessage = typeof masterError === "string" ? masterError : "Failed to load subscribers.";
      toast.push(<Notification title="Loading Error" type="danger" duration={4000}>{errorMessage}</Notification>);
    }
  }, [masterLoadingStatus, masterError]);

  const formMethods = useForm<AddEditSubscriberFormData>({ resolver: zodResolver(addEditSubscriberFormSchema), mode: "onChange" });
  const { control, handleSubmit, reset, formState: { errors, isValid } } = formMethods;
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema) });
  const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((b: any) => ({ value: b.id, label: b.name })) : [], [getAllUserData]);
  const handleOpenModal = useCallback((type: ModalType, itemData: SubscriberItem) => { setModalState({ isOpen: true, type, data: itemData }); }, []);
  const handleCloseModal = useCallback(() => { setModalState({ isOpen: false, type: null, data: null }); }, []);

  const mappedSubscribers = useMemo((): SubscriberItem[] => {
    if (!Array.isArray(rawApiSubscribers?.data) || rawApiSubscribers?.data.length === 0) return [];
    return rawApiSubscribers.data.map((apiItem: ApiSubscriberItem): SubscriberItem | null => {
      if (!apiItem || !apiItem.created_at || !apiItem.email || !apiItem.status) return null;
      return {
        id: apiItem.id, email: apiItem.email, name: apiItem.name || "", mobile_no: apiItem.mobile || "",
        subscribedDate: new Date(apiItem.created_at), subscriptionTypes: apiItem.subscription_types || [],
        source: apiItem.source || "", status: apiItem.status, remarks: apiItem.note || "",
        raw_created_at: apiItem.created_at, raw_updated_at: apiItem.updated_at,
        updated_by_user: apiItem.updated_by_user,
      };
    }).filter((item) => item !== null) as SubscriberItem[];
  }, [rawApiSubscribers?.data]);

  const defaultFormValues: AddEditSubscriberFormData = useMemo(() => ({
    email: "", name: "", mobile_no: "", subscriptionTypes: [], source: "", status: STATUS_OPTIONS[0].value, remarks: "",
  }), []);
  const openAddDrawer = useCallback(() => { reset(defaultFormValues); setEditingItem(null); setIsAddEditDrawerOpen(true); }, [reset, defaultFormValues]);
  const openEditDrawer = useCallback((item: SubscriberItem) => {
    setEditingItem(item);
    reset({
      email: item.email, name: item.name, mobile_no: item.mobile_no,
      subscriptionTypes: item.subscriptionTypes, source: item.source,
      status: item.status, remarks: item.remarks,
    });
    setIsAddEditDrawerOpen(true);
  }, [reset]);
  const closeAddEditDrawer = useCallback(() => { setEditingItem(null); setIsAddEditDrawerOpen(false); }, []);

  const onSubmitHandler = async (data: AddEditSubscriberFormData) => {
    setIsSubmitting(true);
    let apiPayload = {
      email: data.email, name: data.name || null, mobile: data.mobile_no || null,
      subscription_types: data.subscriptionTypes, source: data.source || null,
      status: data.status, note: data.remarks || null,
    };
    try {
      if (editingItem) {
        await dispatch(editSubscriberAction({ id: editingItem.id, formData: { ...apiPayload, _method: "PUT" } })).unwrap();
        toast.push(<Notification title="Subscriber Updated" type="success" />);
      } else {
        await dispatch(addSubscriberAction(apiPayload)).unwrap();
        toast.push(<Notification title="Subscriber Added" type="success" />);
      }
      closeAddEditDrawer();
      dispatch(getSubscribersAction());
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || (editingItem ? "Update Failed" : "Add Failed");
      toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{errorMessage}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = useCallback((item: SubscriberItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.push(<Notification title="Subscriber Deleted" type="success">{`Subscriber "${itemToDelete.email}" deleted.`}</Notification>);
      dispatch(getSubscribersAction());
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
  const onClearFilters = useCallback(() => {
    const defaultFilters = filterFormSchema.parse({});
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setRowSelection({});
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
  }, [filterFormMethods]);

  const handleCardClick = (status: string) => { onClearFilters(); setFilterCriteria({ status: status }); };
  const handleRemoveFilter = (key: keyof FilterFormData) => { setFilterCriteria((prev) => ({ ...prev, [key]: undefined })); };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: SubscriberItem[] = cloneDeep(mappedSubscribers);
    if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) {
      const [startDate, endDate] = filterCriteria.dateRange;
      const start = startDate && dayjs(startDate).isValid() ? dayjs(startDate).startOf("day") : null;
      const end = endDate && dayjs(endDate).isValid() ? dayjs(endDate).endOf("day") : null;
      processedData = processedData.filter((item) => {
        if (isNaN(item.subscribedDate.getTime())) return false;
        const itemDate = dayjs(item.subscribedDate);
        if (start && end) return itemDate.isBetween(start, end, "day", "[]");
        if (start) return itemDate.isSameOrAfter(start, "day");
        if (end) return itemDate.isSameOrBefore(end, "day");
        return true;
      });
    }
    if (filterCriteria.status && filterCriteria.status !== "") { processedData = processedData.filter((item) => item.status === filterCriteria.status); }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) => String(item.id).toLowerCase().includes(query) || item.email.toLowerCase().includes(query) || item.name.toLowerCase().includes(query) || item.mobile_no.toLowerCase().includes(query));
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0 && Object.prototype.hasOwnProperty.call(processedData[0], key)) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof SubscriberItem] as any;
        let bVal = b[key as keyof SubscriberItem] as any;
        if (aVal instanceof Date && bVal instanceof Date) {
          if (isNaN(aVal.getTime())) return order === "asc" ? 1 : -1;
          if (isNaN(bVal.getTime())) return order === "asc" ? -1 : 1;
          return order === "asc" ? aVal.getTime() - bVal.getTime() : bVal.getTime() - aVal.getTime();
        }
        if (typeof aVal === "number" && typeof bVal === "number") { return order === "asc" ? aVal - bVal : bVal - aVal; }
        const strA = String(aVal ?? "").toLowerCase();
        const strB = String(bVal ?? "").toLowerCase();
        return order === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: processedData };
  }, [mappedSubscribers, tableData, filterCriteria]);

  const handleOpenExportReasonModal = useCallback(() => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  }, [allFilteredAndSortedData, exportReasonFormMethods]);
  const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Subscribers";
    const timestamp = dayjs().format("YYYYMMDD_HHmmss");
    const fileName = `subscribers_export_${timestamp}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      exportSubscribersToCsv(fileName, allFilteredAndSortedData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Operation Failed" type="danger">{(error as Error).message || "Could not complete export."}</Notification>);
    } finally { setIsSubmittingExportReason(false); }
  }, [dispatch, allFilteredAndSortedData]);

  const handleBulkEmail = () => { toast.push(<Notification title="Action Triggered" type="info">Sending email to {Object.keys(rowSelection).length} selected subscribers...</Notification>); };
  const handleBulkWhatsApp = () => { toast.push(<Notification title="Action Triggered" type="info">Sending WhatsApp to {Object.keys(rowSelection).length} selected subscribers...</Notification>); };
  const handleFileImport = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log("Selected file:", e.target.files[0]);
      toast.push(<Notification title="File Selected" type="info">{e.target.files[0].name}</Notification>);
    }
  };
  const processAndUploadImport = () => { toast.push(<Notification title="Import Started" type="success">File is being processed.</Notification>); setIsImportModalOpen(false); };

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
  const handleViewClick = useCallback((item: SubscriberItem) => { navigate(`/app/crm/subscriber-details/${item.id}`); }, [navigate]);

  const columns: ColumnDef<SubscriberItem>[] = useMemo(() => [
    {
        id: "select",
        header: ({ table }) => (<Checkbox checked={table.getIsAllRowsSelected()} indeterminate={table.getIsSomeRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />),
        cell: ({ row }) => (<Checkbox checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} />),
    },
    {
        header: "Subscriber Info", accessorKey: "email", id: "subscriberInfo",
        cell: (props) => { const rowData = props.row.original; return (<div className="flex items-center gap-2"><Avatar size="sm" shape="circle" className="mr-1">{rowData.email?.[0]?.toUpperCase()}</Avatar><div className="flex flex-col gap-0.5"><span className="font-semibold">{rowData.email}</span><div className="text-xs text-gray-500">{rowData.name || "No name provided"}</div></div></div>); },
    },
    {
        header: "Type", accessorKey: "subscriptionTypes", id: "subscriptionTypes", enableSorting: false,
        cell: (props) => { const types = props.getValue() as string[]; if (!types || types.length === 0) return "N/A"; return (<div className="flex flex-wrap gap-1 max-w-[200px]">{types.map((type) => (<Tag key={type} className="capitalize whitespace-nowrap">{type}</Tag>))}</div>); },
    },
    {
        header: "Status", accessorKey: "status", id: "status",
        cell: (props) => { const statusVal = props.getValue() as string; return (<Tag className={`capitalize whitespace-nowrap text-center ${statusColors[statusVal] || statusColors.default}`}>{statusVal || "N/A"}</Tag>); },
    },
    {
        header: "Subscription Date", accessorKey: "subscribedDate", id: "subscribedDate", enableSorting: true, size: 180,
        cell: (props) => { const date = props.row.original.subscribedDate; return !isNaN(date.getTime()) ? (<span className="text-xs">{dayjs(date).format("MMM DD, YYYY hh:mm A")}</span>) : "Invalid Date"; },
    },
    {
        header: "Updated Info", accessorKey: "raw_updated_at", enableSorting: true, size: 220,
        cell: (props: CellContext<SubscriberItem, unknown>) => {
            const { raw_updated_at, updated_by_user } = props.row.original;
            return (
                <div className="flex items-center gap-2">
                    <Tooltip title="View Profile Picture"><Avatar src={updated_by_user?.profile_pic_path} shape="circle" size="sm" icon={<TbUserCircle />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => openImageViewer(updated_by_user?.profile_pic_path)} /></Tooltip>
                    <div><span className="font-semibold">{updated_by_user?.name || "N/A"}</span><div className="text-xs">{updated_by_user?.roles?.[0]?.display_name || ""}</div><div className="text-xs text-gray-500">{formatCustomDateTime(raw_updated_at)}</div></div>
                </div>
            );
        },
    },
    {
        header: "Action", id: "action", size: 120,
        cell: (props: CellContext<SubscriberItem, unknown>) => (
            <div className="flex gap-2 items-center justify-center">
                <Tooltip title="Edit Subscriber"><div className="text-xl cursor-pointer text-gray-500 hover:text-emerald-600" onClick={() => openEditDrawer(props.row.original)} role="button"><TbPencil /></div></Tooltip>
                <Tooltip title="Delete"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600" role="button" onClick={() => handleDeleteClick(props.row.original)}><TbTrash size={18} /></div></Tooltip>
            </div>
        ),
    },
  ], [openEditDrawer, handleViewClick, handleDeleteClick, openImageViewer]);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<SubscriberItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const activeFilterCount = useMemo(() => { let count = 0; if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) count++; if (filterCriteria.status && filterCriteria.status !== "") count++; return count; }, [filterCriteria]);
  const counts = rawApiSubscribers?.counts || {};
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";
  const selectedRowCount = Object.keys(rowSelection).length;

  const renderCardContent = (content: number | undefined) => {
    if (initialLoading) {
        return <Skeleton width={40} height={20} />;
    }
    return <h6 className="font-bold">{content ?? 0}</h6>;
  };

  return (
    <>
      <Container className="h-full">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Subscribers</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={!isDataReady}>Add New</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4 gap-2">
            <Tooltip title="Click to show all subscribers"><div onClick={onClearFilters}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200 dark:border-blue-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-200"><TbCaravan size={24} /></div><div><div className="text-blue-500">{renderCardContent(counts?.total)}</div><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show new subscribers"><div onClick={() => {}}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200 dark:border-violet-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 text-violet-500 dark:text-violet-200"><TbUserStar size={24} /></div><div><div className="text-violet-500">{renderCardContent(counts?.new)}</div><span className="font-semibold text-xs">New</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show subscribed users"><div onClick={() => handleCardClick("Subscribed")}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-200 dark:border-green-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-200"><TbMailForward size={24} /></div><div><div className="text-green-500">{renderCardContent(counts?.subscribed)}</div><span className="font-semibold text-xs">Subscribed</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show unsubscribed users"><div onClick={() => handleCardClick("Unsubscribed")}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200 dark:border-red-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-200"><TbCalendarCancel size={24} /></div><div><div className="text-red-500">{renderCardContent(counts?.unsubscribed)}</div><span className="font-semibold text-xs">Unsubscribed</span></div></Card></div></Tooltip>
          </div>

          {selectedRowCount > 0 ? (
            <div className="flex justify-between items-center w-full mb-4 px-2 py-2 rounded-md bg-gray-100 dark:bg-gray-700">
              <div className="font-semibold text-sm">{selectedRowCount} item{selectedRowCount > 1 ? "s" : ""} selected</div>
              <div className="flex gap-2"><Button size="sm" icon={<TbMail />} onClick={handleBulkEmail}>Send Email</Button><Button size="sm" icon={<TbBrandWhatsapp />} onClick={handleBulkWhatsApp}>Send WhatsApp</Button></div>
            </div>
          ) : (
            <SubscriberTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onImport={() => setIsImportModalOpen(true)} onExport={handleOpenExportReasonModal} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} isDataReady={isDataReady} />
          )}

          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />

          <div className="mt-4 flex-grow overflow-auto">
            <DataTable columns={filteredColumns} data={pageData} loading={tableLoading} pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number, }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onRowSelectionChange={setRowSelection} rowSelection={rowSelection} enableRowSelection noData={!tableLoading && pageData.length === 0} />
          </div>
        </AdaptiveCard>
      </Container>

      <Drawer
        title={editingItem ? "Edit Subscriber" : "Add New Subscriber"}
        width={520}
        isOpen={isAddEditDrawerOpen}
        onClose={closeAddEditDrawer}
        onRequestClose={closeAddEditDrawer}
        footer={
          <div className="w-full flex gap-2 justify-end">
            <Button
              size="sm"
              type="button"
              onClick={closeAddEditDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              type="submit"
              form="addEditSubscriberForm"
              loading={isSubmitting}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="addEditSubscriberForm"
          onSubmit={handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-y-4"
        >
          <FormItem
            label={
              <div>
                Email<span className="text-red-500"> *</span>
              </div>
            }
            invalid={!!errors.email}
            errorMessage={errors.email?.message}
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="Enter Email Address"
                  prefix={<TbMail />}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Name"
            invalid={!!errors.name}
            errorMessage={errors.name?.message}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter Name (Optional)"
                  prefix={<TbUserCircle />}
                />
              )}
            />
          </FormItem>
          <div className="md:grid grid-cols-2 gap-3">
            <FormItem
              label="Mobile No."
              invalid={!!errors.mobile_no}
              errorMessage={errors.mobile_no?.message}
            >
              <Controller
                name="mobile_no"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="tel"
                    placeholder="Enter Mobile No. (Optional)"
                    prefix={<TbPhone />}
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Source"
              invalid={!!errors.source}
              errorMessage={errors.source?.message}
            >
              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g., Website (Optional)"
                    prefix={<TbWorld />}
                  />
                )}
              />
            </FormItem>
          </div>
          <FormItem
            label={
              <div>
                Subscription Type<span className="text-red-500"> *</span>
              </div>
            }
            invalid={!!errors.subscriptionTypes}
            errorMessage={errors.subscriptionTypes?.message}
          >
            <Controller
              name="subscriptionTypes"
              control={control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Type(s)"
                  options={SUBSCRIPTION_TYPE_OPTIONS}
                  value={SUBSCRIPTION_TYPE_OPTIONS.filter((opt) =>
                    field.value?.includes(opt.value)
                  )}
                  onChange={(options: any) =>
                    field.onChange(options?.map((o: any) => o.value) || [])
                  }
                />
              )}
            />
          </FormItem>
          <FormItem
            label={
              <div>
                Status<span className="text-red-500"> *</span>
              </div>
            }
            invalid={!!errors.status}
            errorMessage={errors.status?.message}
          >
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  placeholder="Select Status"
                  options={STATUS_OPTIONS}
                  value={STATUS_OPTIONS.find((opt) => opt.value === field.value)}
                  onChange={(opt) => field.onChange(opt?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Remarks"
            invalid={!!errors.remarks}
            errorMessage={errors.remarks?.message}
          >
            <Controller
              name="remarks"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Write a remark (Optional)"
                  textArea
                  rows={4}
                  prefix={<TbFileText />}
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
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              type="button"
              onClick={onClearFilters}
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterSubscriberForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterSubscriberForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormItem label="Subscribed Date Range">
            <Controller
              name="dateRange"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePicker.DatePickerRange
                  placeholder="Select date range"
                  value={
                    field.value as [Date | null, Date | null] | null | undefined
                  }
                  onChange={field.onChange}
                />
              )}
            />
          </FormItem>
          <FormItem label="Status">
            <Controller
              name="status"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select status"
                  options={FILTER_STATUS_OPTIONS}
                  value={FILTER_STATUS_OPTIONS.find(
                    (option) => option.value === (field.value || "")
                  )}
                  onChange={(option) => field.onChange(option?.value || "")}
                  isClearable={false}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <Dialog
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onRequestClose={() => setIsImportModalOpen(false)}
      >
        <h5 className="mb-4">Import Subscribers</h5>
        <p className="mb-4">
          Select a CSV or Excel file. Please ensure the file columns match the
          required format.
        </p>
        <div className="mb-4">
          <a
            href="/subscriber-import-template.csv"
            download
            className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
          >
            <TbCloudDownload /> Download Template
          </a>
        </div>
        <FormItem label="Upload File">
          <Input
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileImport}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={() => setIsImportModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="solid" onClick={processAndUploadImport}>
            Import Data
          </Button>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Subscriber"
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
          Are you sure you want to delete the subscriber "
          <strong>{itemToDelete?.email}</strong>"? This action cannot be
          undone.
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
        <Form
          id="exportSubscriberReasonForm"
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
                  placeholder="Enter reason..."
                  rows={3}
                />
              )}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>

      <SubscriberModals
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
              alt="User Profile"
              className="max-w-full max-h-[80vh]"
            />
          ) : (
            <p>No image available.</p>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default SubscribersListing;