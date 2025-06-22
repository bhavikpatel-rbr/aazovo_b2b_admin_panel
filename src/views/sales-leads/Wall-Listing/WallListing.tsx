// src/views/your-path/WallListing.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
// import cloneDeep from "lodash/cloneDeep"; // Not needed for main list with server-side processing
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput";
import RichTextEditor from "@/components/shared/RichTextEditor";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  // Table, // Not directly used, DataTable is used
  Card,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Select from "@/components/ui/Select"; // Ensure this is the correct Select (likely same as UiSelect)
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons (ensure all used icons are imported)
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbAlarm, TbAlertTriangle, TbBell, TbBookmark, TbBox, TbBoxOff, TbBrandWhatsapp,
  TbBulb, TbCalendar, TbCalendarEvent, TbCancel, TbChecks, TbCircleCheck,
  TbCloudDownload, TbCloudUpload, TbCopy, TbCurrencyDollar,
  TbEye,
  TbFilter,
  TbListDetails, TbMail, TbMessageCircle, TbPackageExport, TbPencil, TbPhoto, TbPlus,
  TbProgress,
  TbReload, TbSearch, TbShare, TbStack2, TbTagStarred, TbUser
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import type { CellContext, ColumnDef, OnSortParam, Row } from "@/components/shared/DataTable";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust path if slice structure changed
import {
  deleteAllWallAction,
  getBrandAction,
  getCategoriesData,
  getEmployeesAction,
  getMemberTypeAction,
  getProductsDataAsync,
  getProductSpecificationsAction,
  getSubcategoriesByCategoryIdAction,
  getWallListingAction,
} from "@/reduxtool/master/middleware"; // Adjust path to where actions are defined


import { getpWallListingAsync } from "@/reduxtool/master/services";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";
import { z } from "zod";
// --- Define Types (Local to component if not shared, or import if shared) ---
export type ApiWallItemFromSource = any; // Use the one from Redux middleware/slice

export type WallRecordStatus =
  | "Pending" | "Approved" | "Rejected" | "Expired" | "Fulfilled" | "Active" | string;
export type WallIntent = "Buy" | "Sell" | "Exchange";
export type WallProductCondition = "New" | "Used" | "Refurbished" | string;

// This is the shape of data items coming from the API
export type ApiWallItem = {
  id: number | null;
  product_name: string;
  company_name: string | null;
  company_id_from_api?: string | null;
  member_name: string;
  member_id_from_api?: string | null;
  member_email: string | null;
  member_phone: string | null;
  product_category: string | null;
  product_subcategory: string | null;
  product_description: string | null;
  product_specs: string | null;
  product_status: string; // API field for product availability status (e.g. "available", "out of stock")
  quantity: string; // API might send as string
  price: string;    // API might send as string
  want_to: string;
  listing_type: string | null;
  shipping_options: string | null;
  payment_method: string | null;
  warranty: string | null;
  return_policy: string | null;
  listing_url: string | null;
  brand: string | null;
  product_images: string[];
  created_date: string; // ISO date string
  updated_at: string;   // ISO date string
  visibility: string | null;
  priority: string | null;
  assigned_to: string | null;
  interaction_type: string | null;
  action: string | null;
  status: string; // This is the API's 'status' field, used for our 'recordStatus'
  cartoon_type_id?: number | null;
  device_condition?: string | null;
  inquiry_count: string; // API might send as string
  share_count: string;   // API might send as string
  is_bookmarked: boolean;
  updated_by_name?: string;
  updated_by_role?: string;
};


// This is the shape of data items used within the component (after mapping)
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
  product_subcategory: string;
  product_description: string;
  product_specs: string;
  product_status: string; // This is the API product status e.g. "available"
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
  product_images: string[];
  created_date: Date;
  updated_at: Date;
  visibility: string;
  priority: string;
  assigned_to: string;
  interaction_type: string;
  action: string;
  recordStatus?: WallRecordStatus; // This is the internal/workflow status e.g. "Pending", "Approved"
  cartoonTypeId?: number | null;
  deviceCondition?: WallProductCondition | null;
  inquiry_count: number;
  share_count: number;
  is_bookmarked: boolean;
  updated_by_name?: string;
  updated_by_role?: string;
  productId?: number;
  productSpecId?: number;
  customerId?: number;
  color?: string | null;
  dispatchStatus?: string | null;
  paymentTermId?: number | null;
  eta?: string | null;
  location?: string | null;
  internalRemarks?: string | null;
};

// Zod Schemas
const selectOptionSchema = z.object({ value: z.any(), label: z.string() });
const filterFormSchema = z.object({
  filterRecordStatuses: z.array(selectOptionSchema).optional().default([]), // For workflow status
  filterProductIds: z.array(selectOptionSchema).optional().default([]),
  filterCompanyIds: z.array(selectOptionSchema).optional().default([]),
  filterIntents: z.array(selectOptionSchema).optional().default([]),
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
  categories: z.array(selectOptionSchema).optional().default([]),
  subcategories: z.array(selectOptionSchema).optional().default([]),
  brands: z.array(selectOptionSchema).optional().default([]),
  productStatus: z.array(selectOptionSchema).optional().default([]), // For API product availability status
  source: z.array(selectOptionSchema).optional().default([]),
  productSpec: z.array(selectOptionSchema).optional().default([]),
  memberType: z.array(selectOptionSchema).optional().default([]),
  createdBy: z.array(selectOptionSchema).optional().default([]),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// Status Colors and Options
const recordStatusColor: Record<WallRecordStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  Expired: "bg-gray-100 text-gray-700 dark:bg-gray-600/20 dark:text-gray-100",
  Fulfilled: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100",
  Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100", // "Active" here refers to recordStatus
};
const recordStatusOptions = Object.keys(recordStatusColor).map((s) => ({ value: s, label: s }));

const intentTagColor: Record<WallIntent, string> = {
  Sell: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Buy: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-100",
  Exchange: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
};
const intentOptions: { value: WallIntent; label: string }[] = [
  { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, { value: "Exchange", label: "Exchange" },
];

const productApiStatusColor: Record<string, string> = { // For API product_status field (availability)
  available: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-100",
  "low stock": "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-100",
  "out of stock": "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  discontinued: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  "non-active": "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-100",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-100",
};

// Dummy Data (Consider fetching these from API if dynamic)
const dummyProducts = [{ id: 1, name: "iPhone 15 Pro" }, { id: 2, name: "Samsung Galaxy S24 Ultra" }, { id: 544, name: "REDMI A2 PLUS 2GB 32GB" },];
const dummyCompanies = [{ id: "COMP001", name: "TechDistributors Inc." }, { id: "COMP002", name: "Global Gadgets LLC" },];
export const dummyCartoonTypes = [{ id: 1, name: "Master Carton" }, { id: 2, name: "Inner Carton" }];


// ============================================================================
// --- MODALS SECTION ---
// ============================================================================
export type WallModalType = "email" | "whatsapp" | "notification" | "task" | "active" | "calendar" | "alert" | "share";
export interface WallModalState { isOpen: boolean; type: WallModalType | null; data: WallItem | null; }
interface WallModalsProps { modalState: WallModalState; onClose: () => void; }

const dummyUsers = [{ value: "user1", label: "Alice Johnson" }, { value: "user2", label: "Bob Williams" }, { value: "user3", label: "Charlie Brown" },];
const priorityOptions = [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" },];
const eventTypeOptions = [{ value: "meeting", label: "Meeting" }, { value: "call", label: "Follow-up Call" }, { value: "deadline", label: "Project Deadline" },];
const dummyAlerts = [{ id: 1, severity: "warning", message: "Listing will expire in 3 days.", time: "4 days ago", }, { id: 2, severity: "info", message: "New inquiry received from John Doe.", time: "2 hours ago", },];

const WallModals: React.FC<WallModalsProps> = ({ modalState, onClose }) => {
  const { type, data: wallItem, isOpen } = modalState;
  if (!isOpen || !wallItem) return null;

  const renderModalContent = () => {
    switch (type) {
      case "email": return <SendEmailDialog wallItem={wallItem} onClose={onClose} />;
      case "whatsapp": return <SendWhatsAppDialog wallItem={wallItem} onClose={onClose} />;
      case "notification": return <AddNotificationDialog wallItem={wallItem} onClose={onClose} />;
      case "task": return <AssignTaskDialog wallItem={wallItem} onClose={onClose} />;
      case "calendar": return <AddScheduleDialog wallItem={wallItem} onClose={onClose} />;
      case "alert": return <ViewAlertDialog wallItem={wallItem} onClose={onClose} />;
      case "share": return <ShareWallLinkDialog wallItem={wallItem} onClose={onClose} />;
      default: return <GenericActionDialog type={type} wallItem={wallItem} onClose={onClose} />;
    }
  };
  return <>{renderModalContent()}</>;
};

const SendEmailDialog: React.FC<{ wallItem: WallItem; onClose: () => void }> = ({ wallItem, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { subject: "", message: "" } });
  const onSendEmail = (data: { subject: string; message: string }) => {
    setIsLoading(true); console.log("Sending email to", wallItem.member_email, "with data:", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Email Sent Successfully" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send Email to {wallItem.member_name}</h5>
      <form onSubmit={handleSubmit(onSendEmail)}>
        <FormItem label="Subject">
          <Controller name="subject" control={control} render={({ field }) => (<Input {...field} placeholder={`Regarding: ${wallItem.product_name}`} />)} />
        </FormItem>
        <FormItem label="Message">
          <Controller name="message" control={control} render={({ field }) => (<RichTextEditor value={field.value} onChange={field.onChange} />)} />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading}>Send</Button>
        </div>
      </form>
    </Dialog>
  );
};

const SendWhatsAppDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const { control, handleSubmit } = useForm({ defaultValues: { message: `Hi ${wallItem.member_name}, I'm interested in your listing for "${wallItem.product_name}".` } });
  const onSendMessage = (data: { message: string }) => {
    const phone = wallItem.member_phone?.replace(/\D/g, "");
    if (!phone) { toast.push(<Notification type="danger" title="Invalid Phone Number" />); return; }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(data.message)}`;
    window.open(url, "_blank"); toast.push(<Notification type="success" title="Redirecting to WhatsApp" />); onClose();
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Send WhatsApp to {wallItem.member_name}</h5>
      <form onSubmit={handleSubmit(onSendMessage)}>
        <FormItem label="Message Template">
          <Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>Cancel</Button>
          <Button variant="solid" type="submit">Open WhatsApp</Button>
        </div>
      </form>
    </Dialog>
  );
};

const AddNotificationDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { title: "", users: [], message: "" } });
  const onSend = (data: any) => {
    setIsLoading(true); console.log("Sending in-app notification for", wallItem.product_name, "with data:", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Notification Sent" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for "{wallItem.product_name}"</h5>
      <form onSubmit={handleSubmit(onSend)}>
        <FormItem label="Notification Title"><Controller name="title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
        <FormItem label="Send to Users">
          <Controller name="users" control={control} render={({ field }) => (<Select isMulti placeholder="Select Users" options={dummyUsers} {...field} />)} />
        </FormItem>
        <FormItem label="Message"><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={3} />} /></FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading}>Send Notification</Button>
        </div>
      </form>
    </Dialog>
  );
};

const AssignTaskDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { title: "", assignee: null, dueDate: null, priority: null, description: "" } });
  const onAssignTask = (data: any) => {
    setIsLoading(true); console.log("Assigning task for", wallItem.product_name, "with data:", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Task Assigned" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Assign Task for "{wallItem.product_name}"</h5>
      <form onSubmit={handleSubmit(onAssignTask)}>
        <FormItem label="Task Title"><Controller name="title" control={control} render={({ field }) => (<Input {...field} placeholder="e.g., Follow up on listing" />)} /></FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Assign To"><Controller name="assignee" control={control} render={({ field }) => (<Select placeholder="Select User" options={dummyUsers} {...field} />)} /></FormItem>
          <FormItem label="Priority"><Controller name="priority" control={control} render={({ field }) => (<Select placeholder="Select Priority" options={priorityOptions} {...field} />)} /></FormItem>
        </div>
        <FormItem label="Due Date"><Controller name="dueDate" control={control} render={({ field }) => (<DatePicker placeholder="Select date" value={field.value} onChange={field.onChange} />)} /></FormItem>
        <FormItem label="Description"><Controller name="description" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading}>Assign Task</Button>
        </div>
      </form>
    </Dialog>
  );
};

const AddScheduleDialog: React.FC<{ wallItem: WallItem; onClose: () => void; }> = ({ wallItem, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { title: "", eventType: null, startDate: null, notes: "" } });
  const onAddEvent = (data: any) => {
    setIsLoading(true); console.log("Adding event for", wallItem.product_name, "with data:", data);
    setTimeout(() => { toast.push(<Notification type="success" title="Event Scheduled" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for "{wallItem.product_name}"</h5>
      <form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title"><Controller name="title" control={control} render={({ field }) => (<Input {...field} placeholder="e.g., Call about listing" />)} /></FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Event Type"><Controller name="eventType" control={control} render={({ field }) => (<Select placeholder="Select Type" options={eventTypeOptions} {...field} />)} /></FormItem>
          <FormItem label="Date & Time"><Controller name="startDate" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
        </div>
        <FormItem label="Notes"><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading}>Save Event</Button>
        </div>
      </form>
    </Dialog>
  );
};

const ViewAlertDialog: React.FC<{ wallItem: WallItem; onClose: () => void }> = ({ wallItem, onClose }) => {
  const alertColors: Record<string, string> = { danger: "red", warning: "amber", info: "blue", };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
      <h5 className="mb-4">Alerts for "{wallItem.product_name}"</h5>
      <div className="mt-4 flex flex-col gap-3">
        {dummyAlerts.length > 0 ? (
          dummyAlerts.map((alert) => (
            <div key={alert.id} className={`p-3 rounded-lg border-l-4 border-${alertColors[alert.severity]}-500 bg-${alertColors[alert.severity]}-50 dark:bg-${alertColors[alert.severity]}-500/10`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <TbAlertTriangle className={`text-${alertColors[alert.severity]}-500 mt-1`} size={20} />
                  <p className="text-sm">{alert.message}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">{alert.time}</span>
              </div>
            </div>
          ))
        ) : (<p>No active alerts for this item.</p>)}
      </div>
      <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
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
      <div className="flex items-center gap-2">
        <Input readOnly value={linkToShare} />
        <Tooltip title="Copy Link"><Button shape="circle" icon={<TbCopy />} onClick={handleCopy} disabled={!wallItem.listing_url} /></Tooltip>
      </div>
      <div className="text-right mt-6"><Button onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};

const GenericActionDialog: React.FC<{ type: WallModalType | null; wallItem: WallItem; onClose: () => void; }> = ({ type, wallItem, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const title = type ? `Confirm: ${type.charAt(0).toUpperCase() + type.slice(1)}` : "Confirm Action";
  const handleConfirm = () => {
    setIsLoading(true); console.log(`Performing action '${type}' for wall item ${wallItem.product_name}`);
    setTimeout(() => { toast.push(<Notification type="success" title="Action Completed" />); setIsLoading(false); onClose(); }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-2">{title}</h5>
      <p>Are you sure you want to perform this action for <span className="font-semibold">{wallItem.product_name}</span>?</p>
      <div className="text-right mt-6">
        <Button className="mr-2" onClick={onClose}>Cancel</Button>
        <Button variant="solid" onClick={handleConfirm} loading={isLoading}>Confirm</Button>
      </div>
    </Dialog>
  );
};
// ============================================================================
// --- END MODALS SECTION ---
// ============================================================================


// --- CSV Export ---
const CSV_WALL_HEADERS = ["ID", "Listing ID", "Product Name", "Company Name", "Company ID", "Member Name", "Member ID", "Member Email", "Member Phone", "Category", "Subcategory", "Description", "Specs", "Product Status", "Quantity", "Price", "Intent", "Listing Type", "Shipping", "Payment", "Warranty", "Return Policy", "URL", "Brand", "Images", "Created Date", "Last Updated", "Visibility", "Priority", "Assigned To", "Interaction Type", "Action", "Record Status", "Cartoon Type ID", "Device Condition", "Inquiry Count", "Share Count", "Bookmarked", "Updated By", "Updated Role",];
const CSV_WALL_KEYS: (keyof WallItem)[] = ["id", "id", "product_name", "company_name", "companyId", "member_name", "memberId", "member_email", "member_phone", "product_category", "product_subcategory", "product_description", "product_specs", "product_status", "quantity", "price", "want_to", "listing_type", "shipping_options", "payment_method", "warranty", "return_policy", "listing_url", "brand", "product_images", "created_date", "updated_at", "visibility", "priority", "assigned_to", "interaction_type", "action", "recordStatus", "cartoonTypeId", "deviceCondition", "inquiry_count", "share_count", "is_bookmarked", "updated_by_name", "updated_by_role",];

function exportWallItemsToCsv(filename: string, rows: WallItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const separator = ",";
  const csvContent = CSV_WALL_HEADERS.join(separator) + "\n" + rows.map((row) => {
    return CSV_WALL_KEYS.map((k) => {
      let cell = row[k] as any;
      if (cell === null || cell === undefined) cell = "";
      else if (k === "product_images" && Array.isArray(cell)) cell = cell.join(";");
      else if (cell instanceof Date) cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss");
      else if (typeof cell === "boolean") cell = cell ? "Yes" : "No";
      else cell = String(cell).replace(/"/g, '""');
      if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(separator);
  }).join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;", });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename);
    link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    return true;
  }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- Child Components ---
const StyledActionColumn = ({ onEdit, onViewDetail, onOpenModal, rowData, }: { onEdit: () => void; onViewDetail: () => void; onOpenModal: (type: WallModalType, data: WallItem) => void; rowData: WallItem; }) => (
  <div className="flex items-center justify-center">
    <Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 rounded-md" role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
    <Tooltip title="View"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-md" role="button" onClick={onViewDetail}><TbEye /></div></Tooltip>
    <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
      <Dropdown.Item onClick={() => onOpenModal("notification", rowData)} className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add as Notification</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("active", rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Mark as Active</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("calendar", rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Add to Calendar</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("task", rowData)} className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign to Task</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("alert", rowData)} className="flex items-center gap-2"><TbBulb size={18} /> <span className="text-xs">Match Opportunity</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("alert", rowData)} className="flex items-center gap-2"><TbAlarm size={18} /> <span className="text-xs">View Alert</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("share", rowData)} className="flex items-center gap-2"><TbShare size={18} /> <span className="text-xs">Share Wall Link</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("email", rowData)} className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
      <Dropdown.Item onClick={() => onOpenModal("whatsapp", rowData)} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send on Whatsapp</span></Dropdown.Item>
    </Dropdown>
  </div>
);

interface WallSearchProps { onInputChange: (value: string) => void; }
const WallSearch = React.forwardRef<HTMLInputElement, WallSearchProps>(({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch />} onChange={(e) => onInputChange(e.target.value)} />));
WallSearch.displayName = "WallSearch";

interface WallTableToolsProps { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onAddNew: () => void; onImport: () => void; onClearFilters: () => void; }
const WallTableTools = ({ onSearchChange, onFilter, onExport, onImport, onClearFilters, }: WallTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow"><WallSearch onInputChange={onSearchChange} /></div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Tooltip title="Clear Filters"><Button icon={<TbReload />} onClick={onClearFilters}></Button></Tooltip>
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

interface WallTableProps { columns: ColumnDef<WallItem>[]; data: WallItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: WallItem[]; onPaginationChange: (page: number) => void; onSelectChange: (size: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: WallItem) => void; onAllRowSelect: (checked: boolean, rows: Row<WallItem>[]) => void; }
const WallTable = (props: WallTableProps) => (
  <DataTable selectable columns={props.columns} data={props.data} loading={props.loading} pagingData={props.pagingData} checkboxChecked={(row) => props.selectedItems.some((s) => s.id === row.id)} onPaginationChange={props.onPaginationChange} onSelectChange={props.onSelectChange} onSort={props.onSort} onCheckBoxChange={props.onRowSelect} onIndeterminateCheckBoxChange={props.onAllRowSelect} noData={!props.loading && props.data.length === 0} />
);

interface WallSelectedFooterProps { selectedItems: WallItem[]; deleteConfirmOpen: boolean; setDeleteConfirmOpen: (open: boolean) => void; onConfirmDelete: () => void; isDeleting: boolean; }
const WallSelectedFooter = ({ selectedItems, deleteConfirmOpen, setDeleteConfirmOpen, onConfirmDelete, isDeleting, }: WallSelectedFooterProps) => {
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t px-8">
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2"><TbChecks className="text-xl text-primary-500" /><span className="font-semibold">{selectedItems.length} item{selectedItems.length > 1 ? "s" : ""}{" "}selected</span></span>
          <Button size="sm" variant="plain" className="text-red-500 hover:text-red-700" onClick={() => setDeleteConfirmOpen(true)}>Delete Selected</Button>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title="Delete Selected Wall Items" onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={onConfirmDelete} loading={isDeleting}>
        <p>Are you sure you want to delete {selectedItems.length} selected item{selectedItems.length > 1 ? "s" : ""}?{" "}</p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Component ---
const WallListing = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    wallListing,
    AllProductsData,
    AllCategorysData,
    subCategoriesForSelectedCategoryData,
    BrandData,
    MemberTypeData,
    ProductSpecificationsData,
    Employees,
    status: masterLoadingStatus
  } = useSelector(masterSelector);

  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WallItem | null>(null);

  const isOverallLoading = masterLoadingStatus === "loading";

  const [deleteSelectedConfirmOpen, setDeleteSelectedConfirmOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(filterFormSchema.parse({}));
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_date" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<WallItem[]>([]);

  const [modalState, setModalState] = useState<WallModalState>({ isOpen: false, type: null, data: null });
  const handleOpenModal = (type: WallModalType, wallItem: WallItem) => setModalState({ isOpen: true, type, data: wallItem });
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });

  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

  const mapApiToWallItem = useCallback((apiItem: ApiWallItemFromSource): WallItem => ({
    id: apiItem.id as number,
    product_name: apiItem.product_name,
    company_name: apiItem.company_name || "",
    companyId: apiItem.company_id_from_api || undefined,
    member_name: apiItem.member_name,
    memberId: String(apiItem.member_id_from_api || ""),
    member_email: apiItem.member_email || "",
    member_phone: apiItem.member_phone || "",
    product_category: apiItem.product_category || "",
    product_subcategory: apiItem.product_subcategory || "",
    product_description: apiItem.product_description || "",
    product_specs: apiItem.product_specs || "",
    product_status: apiItem.product_status,
    quantity: Number(apiItem.quantity) || 0,
    price: Number(apiItem.price) || 0,
    want_to: apiItem.want_to as WallIntent | string,
    listing_type: apiItem.listing_type || "",
    shipping_options: apiItem.shipping_options || "",
    payment_method: apiItem.payment_method || "",
    warranty: apiItem.warranty || "",
    return_policy: apiItem.return_policy || "",
    listing_url: apiItem.listing_url || "",
    brand: apiItem.brand || "",
    product_images: apiItem.product_images || [],
    created_date: new Date(apiItem.created_date),
    updated_at: new Date(apiItem.updated_at),
    visibility: apiItem.visibility || "",
    priority: apiItem.priority || "",
    assigned_to: apiItem.assigned_to || "",
    interaction_type: apiItem.interaction_type || "",
    action: apiItem.action || "",
    recordStatus: apiItem.status as WallRecordStatus,
    cartoonTypeId: apiItem.cartoon_type_id,
    deviceCondition: (apiItem.device_condition as WallProductCondition | null) || null,
    inquiry_count: Number(apiItem.inquiry_count) || 0,
    share_count: Number(apiItem.share_count) || 0,
    is_bookmarked: apiItem.is_bookmarked,
    updated_by_name: apiItem.updated_by_name,
    updated_by_role: apiItem.updated_by_role,
  }), []);

  const pageData = useMemo(() => {
    return Array.isArray(wallListing?.data.data) ? wallListing?.data.data.map(mapApiToWallItem) : [];
  }, [wallListing?.data.data, mapApiToWallItem]);

  const totalItems = useMemo(() => wallListing?.total || 0, [wallListing?.total]);

  const buildApiParams = useCallback((forExport: boolean = false): any => {
    const params: any = {
      page: forExport ? 1 : tableData.pageIndex as number,
      per_page: forExport ? -1 : tableData.pageSize as number, // API should handle -1 as "all"
      search: tableData.query?.trim() || undefined,
    };

    const currentSortKey = tableData.sort?.key;
    const currentSortOrder = tableData.sort?.order;

    if (!forExport && currentSortKey && currentSortOrder) {
      let apiKey = currentSortKey as string;
      if (apiKey === 'recordStatus') apiKey = 'status'; // Map internal 'recordStatus' to API's 'status' field
      // Add other mappings if table keys differ from API query keys
      // Example: if (apiKey === 'memberName') apiKey = 'member_name_api_field';
      params.sort_by = apiKey;
      params.sort_order = currentSortOrder as 'asc' | 'desc';
    } else if (forExport && currentSortKey && currentSortOrder) {
      let apiKey = currentSortKey as string;
      if (apiKey === 'recordStatus') apiKey = 'status';
      params.sort_by = apiKey;
      params.sort_order = currentSortOrder as 'asc' | 'desc';
    }


    const mapToCommaSeparated = (items: { value: any }[]) => items.length > 0 ? items.map(opt => opt.value).join(',') : undefined;

    params.status = mapToCommaSeparated(filterCriteria.filterRecordStatuses); // For workflow status (API field: status)
    params.company_id = mapToCommaSeparated(filterCriteria.filterCompanyIds);
    params.want_to = mapToCommaSeparated(filterCriteria.filterIntents);
    params.product_id = mapToCommaSeparated(filterCriteria.filterProductIds);
    params.category_id = mapToCommaSeparated(filterCriteria.categories);
    params.subcategory_id = mapToCommaSeparated(filterCriteria.subcategories);
    params.brands_id = mapToCommaSeparated(filterCriteria.brands);
    params.product_status = mapToCommaSeparated(filterCriteria.productStatus); // For API product availability
    params.source = mapToCommaSeparated(filterCriteria.source);
    params.product_spec = mapToCommaSeparated(filterCriteria.productSpec);
    params.member_type = mapToCommaSeparated(filterCriteria.memberType);
    params.created_by = mapToCommaSeparated(filterCriteria.createdBy);

    if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) {
      const start = filterCriteria.dateRange[0] ? dayjs(filterCriteria.dateRange[0]).format('YYYY-MM-DD') : '';
      const end = filterCriteria.dateRange[1] ? dayjs(filterCriteria.dateRange[1]).format('YYYY-MM-DD') : '';
      params.created_date_range = `${start},${end}`; // API needs to handle "date1," or ",date2" or "date1,date2"
    }
    return params;
  }, [tableData, filterCriteria]);

  useEffect(() => {
    const apiParams = buildApiParams();
    dispatch(getWallListingAction(apiParams));
    dispatch(getProductsDataAsync());
    dispatch(getCategoriesData());
    dispatch(getSubcategoriesByCategoryIdAction(0));
    dispatch(getBrandAction());
    dispatch(getMemberTypeAction());
    dispatch(getProductSpecificationsAction());
    dispatch(getEmployeesAction());
  }, [dispatch, buildApiParams]);


  const openAddDrawer = useCallback(() => navigate("/sales-leads/wall-item/add"), [navigate]);
  const openEditDrawer = useCallback((item: WallItem) => navigate(`/sales-leads/wall-item/edit/${item.id}`), [navigate]);
  const openViewDrawer = useCallback((item: WallItem) => { setEditingItem(item); setIsViewDrawerOpen(true); }, []);
  const closeViewDrawer = useCallback(() => { setIsViewDrawerOpen(false); setEditingItem(null); }, []);

  const onConfirmDeleteSelectedItems = useCallback(async () => {
    if (selectedItems.length === 0) { toast.push(<Notification title="No items selected" type="info" >Please select items to delete.</Notification>); return; }
    setDeleteSelectedConfirmOpen(false);
    const ids = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatch(deleteAllWallAction({ ids })).unwrap();
      toast.push(<Notification title="Success" type="success">{selectedItems.length} item(s) deleted.</Notification>);
      setSelectedItems([]);
      dispatch(getWallListingAction(buildApiParams()));
    } catch (error: any) {
      toast.push(<Notification title="Error" type="danger">{error.message || error || "Bulk delete failed."}</Notification>);
    }
  }, [dispatch, selectedItems, buildApiParams]);

  const handleChangeStatus = useCallback(async (item: WallItem) => {
    const statusesCycle: WallRecordStatus[] = ["Pending", "Approved", "Rejected", "Expired", "Fulfilled", "Active",];
    const currentRecordStatus = item.recordStatus || "Pending";
    let currentIndex = statusesCycle.indexOf(currentRecordStatus);
    if (currentIndex === -1) currentIndex = 0;
    const newStatus = statusesCycle[(currentIndex + 1) % statusesCycle.length];

    try {
      // TODO: Replace with actual API call to update status
      // await dispatch(updateWallItemStatusAction({ id: item.id, status: newStatus })).unwrap(); 
      await new Promise(res => setTimeout(res, 500)); // Simulate API
      toast.push(<Notification title="Status Updated" type="success">{`Status changed to ${newStatus}.`}</Notification>);
      dispatch(getWallListingAction(buildApiParams()));
    } catch (error: any) { toast.push(<Notification title="Error" type="danger">Failed to update status.</Notification>); }
  }, [dispatch, buildApiParams]);

  const handleToggleBookmark = useCallback(async (item: WallItem) => {
    try {
      // TODO: Replace with actual API call to toggle bookmark
      // await dispatch(toggleBookmarkAction({ id: item.id, isBookmarked: !item.is_bookmarked })).unwrap(); 
      await new Promise(res => setTimeout(res, 500)); // Simulate API
      toast.push(<Notification title="Bookmark Updated" type="success">{`Item ${!item.is_bookmarked ? "bookmarked" : "unbookmarked"}.`}</Notification>);
      dispatch(getWallListingAction(buildApiParams()));
    } catch (error: any) { toast.push(<Notification title="Error" type="danger">Failed to update bookmark.</Notification>); }
  }, [dispatch, buildApiParams]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);

  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  }, [handleSetTableData, closeFilterDrawer]);

  const onClearFilters = useCallback(() => {
    const defaults = filterFormSchema.parse({});
    filterFormMethods.reset(defaults);
    setFilterCriteria(defaults);
    setTableData(prev => ({
      ...prev,
      query: "",
      pageIndex: 1,
      // sort: { order: "desc", key: "created_date" } // Optionally reset sort
    }));
  }, [filterFormMethods]);


  const handleOpenExportReasonModal = useCallback(() => {
    if (totalItems === 0) {
      toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  }, [totalItems, exportReasonFormMethods]);

  const handleConfirmExportWithReason = useCallback(async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    // Optional: dispatch submitExportReasonAction if it's a separate logging action
    // try { await dispatch(submitExportReasonAction({ reason: data.reason, module: "Wall Listing" })).unwrap(); } catch { /* handle error if needed */ }

    const exportParams = buildApiParams(true);

    try {
      const response = await getpWallListingAsync(exportParams); // Direct API call for all data
      if (response.data?.status && response.data.data?.data) {
        const apiItemsToExport: ApiWallItemFromSource[] = response.data.data.data;
        const itemsToExport: WallItem[] = apiItemsToExport.map(mapApiToWallItem);

        const success = exportWallItemsToCsv("wall_listing_export.csv", itemsToExport);
        if (success) {
          toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
        }
      } else {
        throw new Error(response.data?.message || "Failed to fetch data for export.");
      }
    } catch (error) {
      toast.push(<Notification title="Export Failed" type="danger">{(error as Error).message || "Could not retrieve data."}</Notification>);
    } finally {
      setIsSubmittingExportReason(false);
      setIsExportReasonModalOpen(false);
    }
  }, [buildApiParams, mapApiToWallItem, dispatch]);

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handlePageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);

  const handleRowSelect = (checked: boolean, row: WallItem) => setSelectedItems((prev) => checked ? [...prev, row] : prev.filter((item) => item.id !== row.id));
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<WallItem>[]) => {
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
  }, []);
  const handleImportData = useCallback(() => setImportDialogOpen(true), []);
  const handleImportFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) { toast.push(<Notification title="Import Started" type="info">File processing initiated. (Dummy)</Notification>); setImportDialogOpen(false); }
    if (event.target) event.target.value = ""; // Reset file input
  }, []);

  const columns: ColumnDef<WallItem>[] = useMemo(() => [
    {
      header: "Overview", accessorKey: "product_name", size: 280,
      cell: ({ row }) => {
        const { product_images, product_name, id, want_to } = row?.original || {};
        const intent = want_to as WallIntent;
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Avatar size={33} shape="circle" src={product_images?.[0]} icon={!product_images?.[0] && (<TbPhoto className="text-gray-400" />)} />
              <div className="font-semibold leading-normal text-xs text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">{product_name}</div>
            </div>
            <span className="text-xs mt-2"><span className="font-semibold">ID :</span> {id || "N/A"}</span>
            <span className="text-xs">{want_to && (<span><b>Want To: </b><Tag className={`capitalize text-xs px-1 py-0.5 ${intentTagColor[intent] || productApiStatusColor.default}`}>{want_to}</Tag></span>)}</span>
          </div>
        );
      }
    },
    {
      header: "Company & Member", accessorKey: "company_name", size: 260,
      cell: ({ row }) => {
        const { companyId, company_name, member_name, memberId, member_email, member_phone, listing_url, } = row.original;
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <div className="mb-1 w-full">{companyId && (<span className="font-semibold text-gray-500 dark:text-gray-400">{companyId} | </span>)}<span className="font-semibold text-gray-800 dark:text-gray-100">{company_name || "N/A"}</span></div>
            <div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700 w-full">
              {memberId && (<span className="font-semibold text-gray-500 dark:text-gray-400">{memberId} | </span>)}
              {member_name && (<span className="font-semibold text-gray-800 dark:text-gray-100">{member_name}</span>)}
              {member_email && (<a href={`mailto:${member_email}`} className="block text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">{member_email}</a>)}
              {member_phone && (<span className="block text-gray-600 dark:text-gray-300">{member_phone}</span>)}
            </div>
            {listing_url && (<div className="mt-1 pt-1 border-t border-gray-200 dark:border-gray-700"><a href={listing_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300 truncate max-w-[200px]">Listing URL</a></div>)}
          </div>
        );
      }
    },
    {
      header: "Details", accessorKey: "product_category", size: 280,
      cell: ({ row }) => {
        const { product_category, product_subcategory, product_specs, product_status, cartoonTypeId, deviceCondition } = row?.original || {};
        const currentProductApiStatus = product_status?.toLowerCase() || "default";
        const cartoonTypeName = dummyCartoonTypes.find(ct => ct.id === cartoonTypeId)?.name;
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span><span className="font-semibold text-gray-700 dark:text-gray-300">Category:</span> {product_category || "N/A"}{product_subcategory ? ` / ${product_subcategory}` : ""}</span>
            {product_specs && (<Tooltip title={product_specs}><span className="truncate max-w-[250px]"><span className="font-semibold text-gray-700 dark:text-gray-300">Specs:</span> {product_specs.length > 30 ? product_specs.substring(0, 30) + "..." : product_specs}</span></Tooltip>)}
            {product_status && (<span><span className="font-semibold text-gray-700 dark:text-gray-300">Avail. Status:</span> <Tag className={`capitalize text-xs px-1 py-0.5 ${productApiStatusColor[currentProductApiStatus] || productApiStatusColor.default}`}>{product_status}</Tag></span>)}
            {cartoonTypeName && (<span><span className="font-semibold text-gray-700 dark:text-gray-300">Cartoon:</span> {cartoonTypeName}</span>)}
            {deviceCondition && (<span><span className="font-semibold text-gray-700 dark:text-gray-300">Condition:</span> {deviceCondition}</span>)}
          </div>
        );
      },
    },
    {
      header: "Engagement", accessorKey: "price", size: 220,
      cell: ({ row }) => {
        const { price, quantity, inquiry_count, share_count, is_bookmarked, created_date, } = row.original;
        return (
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center">
              <TbCurrencyDollar className="text-base text-emerald-500 dark:text-emerald-400" /><span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">{price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2, }) ?? "N/A"}</span>
              <TbStack2 className="text-base text-blue-500 dark:text-blue-400 ml-2" /><span className="text-gray-700 dark:text-gray-300" style={{ minWidth: 35 }}>Qty: {quantity ?? "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mt-1">
              <Tooltip title="Inquiries"><span className="flex items-center gap-0.5"><TbMessageCircle className="text-gray-500 dark:text-gray-400" />{inquiry_count}</span></Tooltip>
              <Tooltip title="Shares"><span className="flex items-center gap-0.5"><TbShare className="text-gray-500 dark:text-gray-400" />{share_count}</span></Tooltip>
              <Tooltip title={is_bookmarked ? "Bookmarked" : "Not Bookmarked"}><button onClick={() => handleToggleBookmark(row.original)} className="p-0 m-0 bg-transparent border-none cursor-pointer"><TbBookmark size={14} className={is_bookmarked ? "text-amber-500 dark:text-amber-400" : "text-gray-500 dark:text-gray-400"} /></button></Tooltip>
            </div>
            {created_date && (<span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1"><TbCalendarEvent />{dayjs(created_date).format("MMM D, YYYY")}</span>)}
          </div>
        );
      }
    },
    {
      header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 180,
      cell: (props) => {
        const { updated_at, updated_by_name, updated_by_role } = props.row.original || {};
        const formattedDate = updated_at ? dayjs(updated_at).format("MMM D, YYYY h:mm A") : "N/A";
        return (<div className="text-xs"><span>{updated_by_name || "N/A"}{updated_by_role && (<><br /><b>{updated_by_role}</b></>)}</span><br /><span>{formattedDate}</span></div>);
      }
    },
    {
      header: "Workflow Status", accessorKey: "recordStatus", enableSorting: true, size: 180,
      cell: ({ row }) => {
        const { recordStatus, visibility, priority, assigned_to } = row.original;
        return (
          <div className="flex flex-col gap-1 text-xs">
            {recordStatus && (<div><Tag onClick={() => handleChangeStatus(row.original)} className={`${recordStatusColor[recordStatus] || recordStatusColor.Pending} font-semibold capitalize cursor-pointer`}>{recordStatus}</Tag></div>)}
            {visibility && (<span><span className="font-semibold text-gray-700 dark:text-gray-300">Visibility:</span> <span className="text-gray-600 dark:text-gray-400">{visibility}</span></span>)}
            {priority && (<span><span className="font-semibold text-gray-700 dark:text-gray-300">Priority:</span> <span className="text-gray-600 dark:text-gray-400">{priority}</span></span>)}
            {assigned_to && (<span><span className="font-semibold text-gray-700 dark:text-gray-300">Assigned:</span> <span className="text-gray-600 dark:text-gray-400">{assigned_to}</span></span>)}
          </div>
        );
      },
    },
    {
      header: "Actions", id: "actions", size: 120, meta: { HeaderClass: "text-center" },
      cell: (props: CellContext<WallItem, any>) => (<StyledActionColumn onViewDetail={() => openViewDrawer(props.row.original)} onEdit={() => openEditDrawer(props.row.original)} onOpenModal={handleOpenModal} rowData={props.row.original} />),
    },
  ], [openViewDrawer, openEditDrawer, handleToggleBookmark, handleChangeStatus, handleOpenModal]);

  const counts = wallListing?.counts || {
    active: 0,
    buy: 0,
    non_active: 0,
    pending: 0,
    rejected: 0,
    sell: 0,
    today: 0,
    total: 0
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Wall Listing</h5>
            <div className="flex gap-2">
              <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
              <Button variant="solid" icon={<TbPlus />}>Add Multiple</Button> {/* TODO: Implement Add Multiple */}
            </div>
          </div>

          {/* Stats Cards - These are currently placeholders or need separate data fetching */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-4 mt-4 gap-2 ">
            <Card bodyClass="flex gap-2 p-1" className="rounded-sm border border-blue-200"><div className="h-9 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbListDetails size={20} /></div><div className="flex flex-col"><b className="text-blue-500">{counts.total}</b><span className="font-semibold text-[11px]">Total</span></div></Card>
            <Card bodyClass="flex gap-2 p-1" className="rounded-sm border border-emerald-200"><div className="h-9 w-8 rounded-md flex items-center justify-center bg-emerald-100 text-emerald-500"><TbCalendar size={20} /></div><div className="flex flex-col"><b className="text-emerald-500">{counts.today}</b><span className="font-semibold text-[11px]">Today</span></div></Card>
            <Card bodyClass="flex gap-2 p-1" className="rounded-sm border border-violet-200"><div className="h-9 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbBox size={20} /></div><div className="flex flex-col"><b className="text-violet-500">{counts.buy}</b><span className="font-semibold text-[11px]">Buy</span></div></Card>
            <Card bodyClass="flex gap-2 p-1" className="rounded-sm border border-pink-200"><div className="h-9 w-8 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbPackageExport size={20} /></div><div className="flex flex-col"><b className="text-pink-500">{counts.sell}</b><span className="font-semibold text-[11px]">Sell</span></div></Card>
            <Card bodyClass="flex gap-2 p-1" className="rounded-sm border border-green-300" ><div className="h-9 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbCircleCheck size={20} /></div><div className="flex flex-col"><b className="text-green-500">{counts.active}</b><span className="font-semibold text-[11px]">Active</span></div></Card>
            <Card bodyClass="flex gap-2 p-1" className="rounded-sm border border-red-200"><div className="h-9 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCancel size={20} /></div><div className="flex flex-col"><b className="text-red-500">{counts.non_active}</b><span className="font-semibold text-[11px]">Non Active</span></div></Card>
            <Card bodyClass="flex gap-2 p-1" className="rounded-sm border border-orange-200"><div className="h-9 w-8 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbProgress size={20} /></div><div className="flex flex-col"><b className="text-orange-500">{counts.pending}</b><span className="font-semibold text-[11px]">Pending</span></div></Card>
            <Card bodyClass="flex gap-2 p-1" className="rounded-sm border border-red-200"><div className="h-9 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbBoxOff size={20} /></div><div className="flex flex-col"><b className="text-red-500">{counts.rejected}</b><span className="font-semibold text-[11px]">Rejected</span></div></Card>
          </div>

          <WallTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onAddNew={openAddDrawer}
            onImport={handleImportData}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <WallTable
              columns={columns}
              data={pageData}
              loading={isOverallLoading}
              pagingData={{
                total: totalItems,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectedItems={selectedItems}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handlePageSizeChange}
              onRowSelect={handleRowSelect}
              onAllRowSelect={handleAllRowSelect}
              onSort={handleSort}
            />
          </div>
        </AdaptiveCard>
      </Container>
      <WallSelectedFooter selectedItems={selectedItems} deleteConfirmOpen={deleteSelectedConfirmOpen} setDeleteConfirmOpen={setDeleteSelectedConfirmOpen} onConfirmDelete={onConfirmDeleteSelectedItems} isDeleting={masterLoadingStatus === 'loading' && deleteSelectedConfirmOpen} />
      <WallModals modalState={modalState} onClose={handleCloseModal} />

      <Drawer title="View Wall Item Details" isOpen={isViewDrawerOpen} onClose={closeViewDrawer} onRequestClose={closeViewDrawer} width={700}>
        {editingItem && (
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-4 mb-4">
              {editingItem.product_images && editingItem.product_images.length > 0 && (<Avatar size={100} shape="rounded" src={editingItem.product_images?.[0]} icon={!editingItem.product_images?.[0] && (<TbPhoto className="text-gray-400" />)} />)}
              <div>
                <h5 className="font-semibold text-xl text-gray-800 dark:text-gray-100">{editingItem.product_name}</h5>
                <p className="text-gray-500 dark:text-gray-400">ID: {editingItem.id || "N/A"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {Object.entries(editingItem).filter(([key]) => !["product_images", "product_name", "id", "productId", "productSpecId", "customerId",].includes(key)).map(([key, value]) => {
                let displayValue = value;
                if (key === "cartoonTypeId" && typeof value === "number") { displayValue = dummyCartoonTypes.find((ct) => ct.id === value)?.name || value.toString(); }
                else if (key === "is_bookmarked" && typeof value === "boolean") { displayValue = value ? "Yes" : "No"; }
                return (
                  <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                    <strong className="capitalize text-gray-700 dark:text-gray-200">{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}:</strong>{" "}
                    <span className="text-gray-600 dark:text-gray-400">
                      {displayValue instanceof Date ? (dayjs(displayValue).format("MMM D, YYYY h:mm A"))
                        : Array.isArray(displayValue) ? (displayValue.join(", "))
                          : displayValue !== null && displayValue !== undefined && displayValue !== "" ? (String(displayValue))
                            : (<span className="italic text-gray-400 dark:text-gray-500">N/A</span>)}
                    </span>
                  </div>
                );
              })}
            </div>
            {editingItem.product_images && editingItem.product_images.length > 1 && (
              <div className="mt-4">
                <strong className="text-gray-700 dark:text-gray-200 text-sm">Additional Images:</strong>
                <div className="flex flex-wrap gap-2 mt-2">{editingItem.product_images.slice(1).map((img, idx) => (<Avatar key={idx} src={img} shape="rounded" size={60} />))}</div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={480}
        footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear All</Button><Button size="sm" variant="solid" form="filterWallForm" type="submit">Apply</Button></div>} >
        <Form id="filterWallForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col h-full">
          <div className="overflow-y-auto p-1 flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem label="Workflow Status"><Controller name="filterRecordStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select Status..." options={recordStatusOptions} {...field} />)} /></FormItem>

              <FormItem label="Companies"><Controller name="filterCompanyIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select companies..." options={dummyCompanies.map((p) => ({ value: p.id, label: p.name, }))} {...field} />)} /></FormItem> {/* PENDING */}

              <FormItem label="Intent (Want to)"><Controller name="filterIntents" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select intents..." options={intentOptions} {...field} />)} /></FormItem>

              <FormItem label="Products"><Controller name="filterProductIds" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select products..." options={AllProductsData?.map((p) => ({ value: p.id, label: p.name, }))} {...field} />)} /></FormItem>

              <FormItem label="Categories"><Controller name="categories" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select Categories..." options={AllCategorysData.map((p) => ({ value: p.id, label: p.name, }))} {...field} />)} /></FormItem>

              <FormItem label="Sub Categories"><Controller name="subcategories" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select Sub Categories..." options={subCategoriesForSelectedCategoryData?.map((p) => ({ value: p.id, label: p.name, }))} {...field} />)} /></FormItem>

              <FormItem label="Brands"><Controller name="brands" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select Brands..." options={BrandData?.map((p) => ({ value: p.id, label: p.name, }))} {...field} />)} /></FormItem>

              <FormItem label="Availability Status"><Controller name="productStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select Availability..." options={Object.keys(productApiStatusColor).filter((k) => k !== "default").map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s, }))} {...field} />)} /></FormItem>

              <FormItem label="Created Date Range" className="col-span-2"><Controller name="dateRange" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange value={field.value as [Date | null, Date | null] | null} onChange={field.onChange} placeholder="Select date range" />)} /></FormItem>

              <FormItem label="Source (Example)"><Controller name="source" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select Source..." options={[{ label: "Web", value: "web" }, { label: "App", value: "app" },]} {...field} />)} /></FormItem>

              <FormItem label="Product Spec (Example)"><Controller name="productSpec" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select Product Spec..." options={ProductSpecificationsData?.map((p) => ({ value: p.id, label: p.name, }))} {...field} />)} /></FormItem>

              <FormItem label="Member Type (Example)"><Controller name="memberType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select Member Type..." options={MemberTypeData?.map((p) => ({ value: p.id, label: p.name, }))} {...field} />)} /></FormItem>

              <FormItem label="Created By (Example)"><Controller name="createdBy" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti className="text-nowrap text-ellipsis" placeholder="Select Employee..." options={Employees?.map((p) => ({ value: p.id, label: p.name, }))} {...field} />)} /></FormItem>
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

      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel"
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason, }} >
        <Form id="exportReasonForm" onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 mt-2">
          <FormItem label="Please provide a reason for exporting this data:" isRequired invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default WallListing;