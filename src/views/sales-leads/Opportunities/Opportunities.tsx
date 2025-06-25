// src/views/your-path/Opportunities.tsx

import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import cloneDeep from "lodash/cloneDeep";
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
  Dialog, // Correctly imported Dialog
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Pagination,
  Select,
  Table,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbAlarm,
  TbAlertTriangle,
  TbBell,
  TbBox,
  TbBrandWhatsapp,
  TbBuilding,
  TbCalendarEvent,
  TbChecks,
  TbChecklist,
  TbCopy,
  TbEye,
  TbExchange,
  TbFilter,
  TbCloudUpload,
  TbIdBadge2,
  TbInfoCircle,
  TbLink as TbLinkIcon,
  TbMail,
  TbMinus,
  TbPencil,
  TbPhone,
  TbPlus,
  TbProgressCheck,
  TbRadar2,
  TbSearch,
  TbTargetArrow,
  TbTag,
  TbTagStarred,
  TbTrash,
  TbUser,
  TbUsers,
  TbBulb,
  TbNotebook,
  TbDiscount,
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import {
  CellContext,
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
} from "@tanstack/react-table";
import type { CheckboxProps } from "@/components/ui/Checkbox";
import type { SkeletonProps } from "@/components/ui/Skeleton";
import type { TableProps } from "@/components/ui/Table";
import type { ChangeEvent, ReactNode } from "react";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  getOpportunitiesAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";

// --- Define API Item Type (Matches API Response Structure) ---
export type ApiOpportunityItem = {
  id: string;
  opportunity_id: string | null;
  product_name: string;
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
  member_name: string | null;
  member_id: string | null;
  member_email: string | null;
  member_phone: string | null;
  member_type: string | null;
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

// --- Define UI Item Type (Table Row Data) ---
export type OpportunityItem = {
  id: string;
  opportunity_id: string;
  product_name: string;
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
  member_name: string;
  member_id?: string;
  member_email?: string;
  member_phone?: string;
  member_type: "Standard" | "Premium" | "INS-PREMIUM" | string;
  price_match_type?: "Exact" | "Range" | "Not Matched" | string;
  quantity_match_listing?: "Sufficient" | "Partial" | "Not Matched" | string;
  location_match?: "Local" | "National" | "Not Matched" | string;
  matches_found_count?: number;
  updated_at?: string;
  assigned_to?: string;
  notes?: string;
  listing_url?: string;
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Form Schemas ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// ============================================================================
// --- MODALS SECTION ---
// All modal components for Opportunities are defined here.
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
  { value: "meeting", label: "Meeting" },
  { value: "call", label: "Follow-up Call" },
];

const OpportunityModals: React.FC<OpportunityModalsProps> = ({
  modalState,
  onClose,
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
          <AddNotificationDialog opportunity={opportunity} onClose={onClose} />
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
}> = ({ opportunity, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { title: "", users: [], message: "" },
  });
  const onSend = (data: any) => {
    setIsLoading(true);
    console.log(
      "Sending in-app notification for",
      opportunity.opportunity_id,
      "with data:",
      data
    );
    setTimeout(() => {
      toast.push(<Notification type="success" title="Notification Sent" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Notification for {opportunity.opportunity_id}</h5>
      <form onSubmit={handleSubmit(onSend)}>
        <FormItem label="Notification Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => <Input {...field} />}
          />
        </FormItem>
        <FormItem label="Send to Users">
          <Controller
            name="users"
            control={control}
            render={({ field }) => (
              <Select
                isMulti
                placeholder="Select Users"
                options={dummyUsers}
                {...field}
              />
            )}
          />
        </FormItem>
        <FormItem label="Message">
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
          <Button variant="solid" type="submit" loading={isLoading}>
            Send Notification
          </Button>
        </div>
      </form>
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
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { title: "", eventType: null, startDate: null, notes: "" },
  });
  const onAddEvent = (data: any) => {
    setIsLoading(true);
    console.log(
      "Adding event for",
      opportunity.opportunity_id,
      "with data:",
      data
    );
    setTimeout(() => {
      toast.push(<Notification type="success" title="Event Scheduled" />);
      setIsLoading(false);
      onClose();
    }, 1000);
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Schedule for {opportunity.opportunity_id}</h5>
      <form onSubmit={handleSubmit(onAddEvent)}>
        <FormItem label="Event Title">
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Call with parties" />
            )}
          />
        </FormItem>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem label="Event Type">
            <Controller
              name="eventType"
              control={control}
              render={({ field }) => (
                <Select
                  placeholder="Select Type"
                  options={eventTypeOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Date & Time">
            <Controller
              name="startDate"
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
        <FormItem label="Notes">
          <Controller
            name="notes"
            control={control}
            render={({ field }) => <Input textArea {...field} />}
          />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="solid" type="submit" loading={isLoading}>
            Save Event
          </Button>
        </div>
      </form>
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
            <p className="text-sm">
              Opportunity has been pending for 7 days.
            </p>
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

// ============================================================================
// --- END MODALS SECTION ---
// ============================================================================

// --- Constants & Color Mappings ---
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

// --- CSV Export Helpers ---
type OpportunityExportItem = Omit<OpportunityItem, "created_date" | "updated_at"> & {
  created_date_formatted: string;
  updated_at_formatted: string;
};

const CSV_HEADERS_OPPORTUNITIES = [
  "ID", "Opportunity ID", "Product Name", "Status", "Opportunity Status",
  "Match Score", "SPB Role", "Want To", "Company Name", "Company ID",
  "Member Name", "Member ID", "Member Email", "Member Phone", "Member Type",
  "Quantity", "Product Category", "Product Subcategory", "Brand", "Product Specs",
  "Updated By", "Updated Role", "Last Updated", "Created At"
];

const CSV_KEYS_OPPORTUNITIES_EXPORT: (keyof OpportunityExportItem)[] = [
  "id", "opportunity_id", "product_name", "status", "opportunity_status",
  "match_score", "spb_role", "want_to", "company_name", "company_id",
  "member_name", "member_id", "member_email", "member_phone", "member_type",
  "quantity", "product_category", "product_subcategory", "brand", "product_specs",
  "updated_by_name", "updated_by_role", "updated_at_formatted", "created_date_formatted"
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

// --- DataTable1 (Your Custom DataTable Component) ---
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
  state?: { expanded?: ExpandedState };
  onExpandedChange?: (updater: React.SetStateAction<ExpandedState>) => void;
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

const DataTableComponent = React.forwardRef(<T extends object>(
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
    instanceId = "data-table",
    ...rest
  } = props;

  const { pageSize, pageIndex, total } = pagingData;

  const [sorting, setSorting] = useState<ColumnSort[] | []>([]);
  const isManuallyExpanded =
    controlledState?.expanded !== undefined &&
    onControlledExpandedChange !== undefined;
  const [internalExpanded, setInternalExpanded] = useState<ExpandedState>({});

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
    },
    onSortingChange: setSorting,
    onExpandedChange: onExpandedChange,
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
                      width: header.getSize() !== 150 ? header.getSize() : undefined,
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
                        <Td colSpan={row.getVisibleCells().length} className="p-0 border-b-0 hover:bg-transparent">
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
});
DataTableComponent.displayName = "DataTableComponent";

// --- Helper Components ---
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
            {label}:
            <br />{" "}
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
    <div className={classNames("flex items-center gap-1 text-xs", className)}>
      {icon && (
        <span className="text-gray-400 dark:text-gray-500 mr-1">{icon}</span>
      )}
      {label && (
        <span className="font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {label}:
        </span>
      )}
      <span
        className={classNames(
          "text-gray-700 dark:text-gray-200 truncate",
          { "font-semibold": boldText }
        )}
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

// --- Sub-Components for Opportunities Page ---
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

const OpportunityFilterDrawer: React.FC<any> = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const { control, handleSubmit } = useForm();
  const allOpportunitiesForFilter =
    useSelector(masterSelector).Opportunities || [];

  const onSubmitFilter = (data: any) => {
    console.log("Filter data:", data);
    closeDrawer();
  };

  return (
    <>
      <Button icon={<TbFilter />} onClick={openDrawer}>
        Filter
      </Button>
      <Drawer
        title="Filters"
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onRequestClose={closeDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={() => closeDrawer()}
            >
              Clear
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
        <Form id="filterOpportunityForm" onSubmit={handleSubmit(onSubmitFilter)}>
           {/* You can add your filter fields here as in the second provided file */}
           <p className="p-4 text-center text-gray-500">Filter controls go here.</p>
        </Form>
      </Drawer>
    </>
  );
};

const OpportunityTableTools = ({
  onSearchChange,
  onExport,
}: {
  onSearchChange: (query: string) => void;
  onExport: () => void;
}) => (
  <div className="flex-grow flex gap-2">
    <OpportunitySearch onInputChange={onSearchChange} />
    <OpportunityFilterDrawer />
    <Button icon={<TbCloudUpload />} onClick={onExport}>
      Export
    </Button>
  </div>
);

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
  onEdit,
  item,
  currentTab,
  onOpenModal,
}: {
  onEdit: () => void;
  item: OpportunityItem;
  currentTab: string;
  onOpenModal: (type: OpportunityModalType, data: OpportunityItem) => void;
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    let path = `/sales-leads/opportunities/`;
    if (item.spb_role === "Seller" || (currentTab === TABS.SELLER && !item.spb_role)) {
      path += `seller/detail/${item.id}`;
    } else if (item.spb_role === "Buyer" || (currentTab === TABS.BUYER && !item.spb_role)) {
      path += `buyer/detail/${item.id}`;
    } else if (currentTab === TABS.AUTO_MATCH) {
      path += `match/detail/${item.id}`;
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
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
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
        <Dropdown.Item onClick={() => onOpenModal("notification", item)} className="flex items-center gap-2">
          <TbBell size={18} /> <span className="text-xs">Add as Notification</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("active", item)} className="flex items-center gap-2">
          <TbTagStarred size={18} /> <span className="text-xs">Mark as Active</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("calendar", item)} className="flex items-center gap-2">
          <TbCalendarEvent size={18} /> <span className="text-xs">Add to Calendar</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("task", item)} className="flex items-center gap-2">
          <TbUser size={18} /> <span className="text-xs">Assign to Task</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("alert", item)} className="flex items-center gap-2">
          <TbAlarm size={18} /> <span className="text-xs">View Alert</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("alert", item)} className="flex items-center gap-2">
          <TbBulb size={18} /> <span className="text-xs">View Opportunity</span>
        </Dropdown.Item>
        {/* <Dropdown.Item onClick={() => onOpenModal("alert", item)} className="flex items-center gap-2">
          <TbUser size={18} /> <span className="text-xs">View Buyer/Seller</span>
        </Dropdown.Item> */}
        <Dropdown.Item onClick={() => onOpenModal("alert", item)} className="flex items-center gap-2">
          <TbDiscount size={18} /> <span className="text-xs">Create Offer/Demand</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("alert", item)} className="flex items-center gap-2">
          <TbNotebook size={18} /> <span className="text-xs">Add Notes</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("email", item)} className="flex items-center gap-2">
          <TbMail size={18} /> <span className="text-xs">Send Email</span>
        </Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal("whatsapp", item)} className="flex items-center gap-2">
          <TbBrandWhatsapp size={18} /> <span className="text-xs">Send on Whatsapp</span>
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const ExpandedOpportunityDetails: React.FC<{ row: Row<OpportunityItem>; currentTab: string; }> = ({ row: { original: item } }) => {
  const opportunityType = item.spb_role ? `${item.spb_role} in SPB` : (item.want_to || "General");
  return (
    <Card bordered className="m-1 my-2 rounded-lg">
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Opportunity Snapshot</h6>
          <InfoLine icon={<TbIdBadge2 size={14} />} label="Opp. ID" text={item.opportunity_id} className="font-medium text-sm" />
          <InfoLine icon={<TbBox size={14} />} label="Product" text={item.product_name} className="font-medium text-sm" title={item.product_name}/>
          <InfoLine icon={<TbTag size={14} />} label="Category" text={`${item.product_category || 'N/A'}${item.product_subcategory ? ` > ${item.product_subcategory}` : ''}`} />
          <InfoLine icon={<TbTag size={14} />} label="Brand" text={item.brand || 'N/A'} />
          {item.product_specs && <InfoLine icon={<TbInfoCircle size={14} />} label="Specs" text={item.product_specs} />}
          <InfoLine icon={<TbChecklist size={14} />} label="Quantity" text={item.quantity?.toString() || 'N/A'} />
          <InfoLine icon={<TbProgressCheck size={14} />} label="Product Status" text={item.product_status_listing || 'N/A'} />
          <InfoLine icon={<TbExchange size={14} />} label="Intent/Role" text={opportunityType} />
        </div>
        <div className="space-y-1.5 pr-3 md:border-r md:dark:border-gray-600">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Company & Member</h6>
          <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm mb-2">
            <InfoLine icon={<TbBuilding size={14} />} text={item.company_name} className="font-semibold" />
          </div>
          <div className="p-2 border rounded dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
            <InfoLine icon={<TbUser size={14} />} text={item.member_name} className="font-semibold" />
            <InfoLine text={item.member_type} className="ml-5 text-indigo-600 dark:text-indigo-400 font-medium" />
            {item.member_email && <InfoLine icon={<TbMail size={14} />} text={<a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a>} />}
            {item.member_phone && <InfoLine icon={<TbPhone size={14} />} text={item.member_phone} />}
          </div>
          {item.listing_url && <InfoLine icon={<TbLinkIcon size={14} />} label="Listing" text={<a href={item.listing_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate block max-w-[180px]" title={item.listing_url}>{item.listing_url}</a>} />}
        </div>
        <div className="space-y-1.5">
          <h6 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Match & Lifecycle</h6>
          <InfoLine icon={<TbRadar2 size={14} />} label="Matches" text={item.matches_found_count || 'N/A'} />
          <InfoLine icon={<TbTargetArrow size={14} />} label="Match Score" text={`${item.match_score}%`} />
          <div className="flex items-center gap-2">
            <InfoLine icon={<TbProgressCheck size={14} />} label="Opp. Status" />
            <Tag className={`${opportunityStatusTagColor[item.opportunity_status] || opportunityStatusTagColor.default} capitalize`}>{item.opportunity_status}</Tag>
          </div>
          <FormattedDate label="Created" dateString={item.created_date} />
          {/* Actions for expanded view can be added here if needed */}
        </div>
      </div>
    </Card>
  );
};

// --- Main Opportunities Component ---
const Opportunities = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { Opportunities: rawOpportunities = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [tableQueries, setTableQueries] = useState<
    Record<string, TableQueries>
  >({});
  const [selectedItems, setSelectedItems] = useState<
    Record<string, OpportunityItem[]>
  >({});
  const [currentTab, setCurrentTab] = useState<string>(TABS.ALL);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  // --- MODAL STATE AND HANDLERS ---
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
  // --- END MODAL STATE ---

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  useEffect(() => {
    dispatch(getOpportunitiesAction());
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(rawOpportunities)) {
      const mappedOpportunities = rawOpportunities.map(
        (apiItem: ApiOpportunityItem): OpportunityItem => {
          let uiStatus: OpportunityItem["status"] = "pending";
          if (apiItem.status?.toLowerCase() === "pending")
            uiStatus = "pending";
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
            product_status_listing:
              apiItem.product_status_listing || undefined,
            want_to: apiItem.want_to || undefined,
            company_name: apiItem.company_name || "N/A",
            company_id: apiItem.company_id || undefined,
            member_name: apiItem.member_name || "N/A",
            member_id: apiItem.member_id || undefined,
            member_email: apiItem.member_email || undefined,
            member_phone: apiItem.member_phone || undefined,
            member_type: apiItem.member_type || "Standard",
            price_match_type: apiItem.price_match_type || undefined,
            quantity_match_listing:
              apiItem.quantity_match_listing || undefined,
            location_match: apiItem.location_match || undefined,
            matches_found_count: apiItem.matches_found_count ?? undefined,
            updated_at: apiItem.updated_at || undefined,
            assigned_to: String(apiItem.assigned_to || ""),
            notes: apiItem.notes || undefined,
            listing_url: apiItem.listing_url || undefined,
            updated_by_name: apiItem.updated_by_name || "System",
            updated_by_role: apiItem.updated_by_role || "Auto-Update",
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

  const currentTableData = tableQueries[currentTab] || {
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_date" } as ColumnSort,
    query: "",
  };
  const currentSelectedItems = selectedItems[currentTab] || [];

  const filteredOpportunities = useMemo(() => {
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
    } else if (currentTab === TABS.AUTO_MATCH) {
      data = data.filter((op) => op.buy_listing_id && op.sell_listing_id);
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
    return data;
  }, [currentTab, opportunities, currentTableData.query]);

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
            ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
            : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
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

  const handleConfirmExportWithReason = async (
    data: ExportReasonFormData
  ) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Opportunities";
    try {
      await dispatch(
        submitExportReasonAction({ reason: data.reason, module: moduleName })
      ).unwrap();
    } catch (error: any) {}

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

  const handleSetCurrentTableData = useCallback((data: Partial<TableQueries>) => {
    setTableQueries(prev => ({ ...prev, [currentTab]: { ...prev[currentTab], ...data } }));
  }, [currentTab]);
  const handlePaginationChange = useCallback((page: number) => handleSetCurrentTableData({ pageIndex: page }), [handleSetCurrentTableData]);
  const handleSelectChange = useCallback((value: number) => {
    handleSetCurrentTableData({ pageSize: Number(value), pageIndex: 1 });
    setSelectedItems(prev => ({ ...prev, [currentTab]: [] }));
  }, [handleSetCurrentTableData, currentTab]);
  const handleSort = useCallback((sort: OnSortParamTanstack) =>
    handleSetCurrentTableData({ sort: sort as any, pageIndex: 1 }), [handleSetCurrentTableData]);
  const handleSearchChange = useCallback((query: string) =>
    handleSetCurrentTableData({ query: query, pageIndex: 1 }), [handleSetCurrentTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: OpportunityItem) => {
    setSelectedItems(prev => ({ ...prev, [currentTab]: checked ? [...(prev[currentTab] || []), row] : (prev[currentTab] || []).filter((i) => i.id !== row.id) }));
  }, [currentTab]);
  const handleAllRowSelect = useCallback((checked: boolean, rows: Row<OpportunityItem>[]) => {
    setSelectedItems(prev => ({ ...prev, [currentTab]: checked ? rows.map((r) => r.original) : [] }));
  }, [currentTab]);

  const handleEdit = useCallback((item: OpportunityItem) => {
    let path = '/sales-leads/opportunities/';
    if (item.spb_role === "Seller" || (currentTab === TABS.SELLER && !item.spb_role)) {
        path += `seller/edit/${item.id}`;
    } else if (item.spb_role === "Buyer" || (currentTab === TABS.BUYER && !item.spb_role)) {
        path += `buyer/edit/${item.id}`;
    } else if (currentTab === TABS.AUTO_MATCH) {
        path += `seller/edit/${item.id}`;
        toast.push(<Notification title="Info" type="info">Editing Seller aspect of this match.</Notification>);
    } else {
        if (item.spb_role === "Seller" || item.want_to === "Sell") path += `seller/edit/${item.id}`;
        else if (item.spb_role === "Buyer" || item.want_to === "Buy") path += `buyer/edit/${item.id}`;
        else path += `detail/${item.id}`;
    }
    if (path.includes("/edit/") || path.includes("/detail/")) navigate(path);
  }, [navigate, currentTab]);

  const handleDeleteSelected = useCallback(() => {
    const selectedIds = new Set(currentSelectedItems.map((i) => i.id));
    setOpportunities((prevAll) => prevAll.filter((i) => !selectedIds.has(i.id)));
    setSelectedItems((prev) => ({ ...prev, [currentTab]: [] }));
    toast.push(
      <Notification title="Records Deleted" type="success">
        {`${selectedIds.size} record(s) deleted.`}
      </Notification>
    );
  }, [currentSelectedItems, currentTab]);

  const handleTabChange = (tabKey: string) => {
    if (tabKey === currentTab) return;
    setCurrentTab(tabKey);
  };

  const getColumnsForStandardView = useCallback((): ColumnDef<OpportunityItem>[] => [
    {
      header: "Products",
      accessorKey: "opportunity_id",
      size: 280,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-start gap-3">
            <Avatar size={38} shape="circle" className="mt-1 bg-primary-500 text-white text-base flex-shrink-0">
              {item.product_name?.substring(0, 2).toUpperCase()}
            </Avatar>
            <div className="flex flex-col">
              <Link to={`/sales-leads/opportunities/detail/${item.id}`} className="font-semibold text-sm text-primary-600 hover:underline dark:text-primary-400 mb-0.5">
                {item.opportunity_id}
              </Link>
              <Tooltip title={item.product_name}>
                <span className="text-xs text-gray-700 dark:text-gray-200 truncate block max-w-[220px]">
                  {item.product_name}
                </span>
              </Tooltip>
              <Tag className={`${recordStatusTagColor[item.status] || recordStatusTagColor.default} capitalize text-[10px] px-1.5 py-0.5 mt-1 self-start`}>{item.status}</Tag>
            </div>
          </div>
        )
      }
    },
    {
      header: "Company & Member",
      accessorKey: "company_name",
      size: 240,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs">
            <div className="mb-1.5 flex items-center">
              <TbBuilding size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <span className="font-semibold text-gray-800 dark:text-gray-100 truncate" title={item.company_name}>{item.company_name}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5 flex items-center">
              <TbUser size={14} className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium text-gray-700 dark:text-gray-200 truncate" title={item.member_name}>{item.member_name}</span>
                <Tag className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-300 text-[9px] px-1 py-0.5 align-middle whitespace-nowrap self-start mt-1">
                  {item.member_type}
                </Tag>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      header: "Key Details",
      accessorKey: "match_score",
      size: 240,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs space-y-1">
            <InfoLine icon={<TbPhone size={13} />} text={item.member_phone || 'N/A'} />
            <InfoLine icon={<TbMail size={13} />} text={item.member_email ? <a href={`mailto:${item.member_email}`} className="text-blue-500 hover:underline">{item.member_email}</a> : 'N/A'} />
            <div className="pt-1 mt-1 border-t dark:border-gray-600">
              <InfoLine icon={<TbChecklist size={13} />} label="Qty" text={item.quantity ?? 'N/A'} />
              <InfoLine icon={<TbExchange size={13} />} label="Want To" text={item.want_to ?? 'N/A'} />
            </div>
            <div className="pt-1 mt-1 border-t dark:border-gray-600">
              <InfoLine icon={<TbRadar2 size={13} />} label="Matches" text={item.matches_found_count ?? 'N/A'} />
              <InfoLine icon={<TbTargetArrow size={13} />} label="Score" text={`${item.match_score}%`} />
            </div>
          </div>
        )
      }
    },
    {
      header: "Timestamps",
      accessorKey: "created_date",
      size: 150,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs space-y-1.5">
            <FormattedDate label="Created" dateString={item.created_date} />
            <div className="flex items-center gap-1">
              <InfoLine icon={<TbProgressCheck size={14} />} label="Opp." />
              <Tag className={`${opportunityStatusTagColor[item.opportunity_status] || opportunityStatusTagColor.default} capitalize text-[10px] px-1.5 py-0.5 whitespace-nowrap`}>{item.opportunity_status}</Tag>
            </div>
          </div>
        )
      }
    },
    {
      header: "Actions",
      id: "action_std",
      size: 120,
      cell: (props) => <MainRowActionColumn
        onEdit={() => handleEdit(props.row.original)}
        item={props.row.original}
        currentTab={currentTab}
        onOpenModal={handleOpenModal}
      />
    },
  ], [handleEdit, currentTab, handleOpenModal]);

  const getColumnsForExpandableView = useCallback((): ColumnDef<OpportunityItem>[] => [
    {
      id: 'expander',
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
      )
    },
    {
      header: "Products",
      accessorKey: "product_name",
      size: 280,
      cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-start gap-3">
              <Avatar size={38} shape="circle" className="mt-1 bg-primary-500 text-white text-base flex-shrink-0">
                {item.product_name?.substring(0, 2).toUpperCase()}
              </Avatar>
              <div className="flex flex-col">
                <Link to={`/sales-leads/opportunities/match/detail/${item.id}`} className="font-semibold text-sm text-primary-600 hover:underline dark:text-primary-400 mb-0.5">
                  {item.opportunity_id}
                </Link>
                <Tooltip title={item.product_name}><span className="text-xs text-gray-700 dark:text-gray-200 truncate block max-w-[220px]">{item.product_name}</span></Tooltip>
              </div>
            </div>
          )
      }
    },
    {
      header: "Parties",
      accessorKey: "company_name",
      size: 280,
       cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="text-xs">
            <InfoLine icon={<TbBuilding size={14}/>} text={item.company_name} boldText />
            <InfoLine icon={<TbUser size={14}/>} text={item.member_name} className="mt-1" />
            {item.spb_role && (
              <Tag className={classNames("mt-1.5 capitalize", item.spb_role === "Seller" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700")}>
                {item.spb_role}
              </Tag>
            )}
          </div>
        )
      }
    },
    {
      header: "Match Info",
      accessorKey: "match_score",
      size: 200,
      cell: ({ row }) => {
          const item = row.original;
          return (
              <div className="text-xs space-y-1">
                  <InfoLine icon={<TbRadar2 size={13} />} label="Matches" text={item.matches_found_count ?? 'N/A'} />
                  <InfoLine icon={<TbTargetArrow size={13} />} label="Score" text={`${item.match_score}%`} />
                  <div className="flex items-center gap-1">
                      <InfoLine icon={<TbProgressCheck size={14} />} label="Status" />
                      <Tag className={`${opportunityStatusTagColor[item.opportunity_status] || opportunityStatusTagColor.default} capitalize`}>{item.opportunity_status}</Tag>
                  </div>
              </div>
          )
      }
    },
    {
      header: "Timestamps",
      accessorKey: "created_date",
      size: 150,
      cell: ({ row }) => (<FormattedDate dateString={row.original.created_date} />)
    },
    {
      header: "Actions",
      id: "action_exp",
      size: 120,
      cell: (props) => <MainRowActionColumn
        onEdit={() => handleEdit(props.row.original)}
        item={props.row.original}
        currentTab={currentTab}
        onOpenModal={handleOpenModal}
      />
    },
  ], [expanded, handleEdit, currentTab, handleOpenModal]);

  const columns = useMemo(() => {
    if (currentTab === TABS.AUTO_MATCH) {
      return getColumnsForExpandableView();
    }
    return getColumnsForStandardView();
  }, [currentTab, getColumnsForStandardView, getColumnsForExpandableView]);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4">
            <h5 className="mb-4 lg:mb-0">Opportunities</h5>
          </div>

          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
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

          <div className="mb-4">
            <OpportunityTableTools
              onSearchChange={handleSearchChange}
              onExport={handleOpenExportReasonModal}
            />
          </div>

          <div className="flex-grow overflow-auto">
            <DataTableComponent
              selectable
              columns={columns}
              data={pageData}
              loading={masterLoadingStatus === "loading"}
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
              state={
                currentTab === TABS.AUTO_MATCH ? { expanded } : undefined
              }
              onExpandedChange={
                currentTab === TABS.AUTO_MATCH ? setExpanded : undefined
              }
              getRowCanExpand={
                currentTab === TABS.AUTO_MATCH ? () => true : undefined
              }
              renderRowSubComponent={
                currentTab === TABS.AUTO_MATCH
                  ? ({ row }: { row: Row<OpportunityItem> }) => (
                      <ExpandedOpportunityDetails
                        row={row}
                        currentTab={currentTab}
                      />
                    )
                  : undefined
              }
              noData={
                masterLoadingStatus !== "loading" && pageData.length === 0
              }
            />
          </div>
        </AdaptiveCard>
        <OpportunitySelectedFooter
          selectedItems={currentSelectedItems}
          onDeleteSelected={handleDeleteSelected}
        />
      </Container>
      <OpportunityModals modalState={modalState} onClose={handleCloseModal} />
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