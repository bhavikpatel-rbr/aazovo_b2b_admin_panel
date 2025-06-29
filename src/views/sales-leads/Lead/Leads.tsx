// src/views/sales-leads/LeadsListing.tsx
// This is the complete and updated file with all features, including scheduling.

import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
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
  DatePicker,
  Dialog,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
  Table
} from "@/components/ui";
import Notification from "@/components/ui/Notification";
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
  TbCalendar,
  TbCalendarEvent,
  TbCircleCheck,
  TbClipboardText,
  TbCloudUpload,
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
  TbPlus,
  TbReload,
  TbRocket,
  TbSearch,
  TbSubtask,
  TbTagStarred,
  TbTrash,
  TbTrophy
} from "react-icons/tb";

// Types
import type { OnSortParam, TableQueries } from "@/@types/common";
import {
  CellContext,
  ColumnDef,
  Row
} from "@tanstack/react-table";
import type { EnquiryType, LeadIntent, LeadStatus } from "./types";
import {
  enquiryTypeOptions as enquiryTypeOptionsConst,
  leadIntentOptions as leadIntentOptionsConst,
  leadStatusOptions as leadStatusOptionsConst,
} from "./types";

// Redux
import { DataTable } from "@/components/shared";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { shallowEqual, useSelector } from "react-redux";
import { useAppDispatch } from "@/reduxtool/store";
import {
  getLeadAction,
  deleteLeadAction,
  deleteAllLeadsAction,
  addNotificationAction,
  getAllUsersAction,
  submitExportReasonAction,
  addScheduleAction
} from "@/reduxtool/master/middleware";

// --- Internal Flattened Type for component use ---
type LeadListItem = {
  id: string | number;
  lead_number: string;
  lead_status: LeadStatus;
  enquiry_type: EnquiryType;
  productId?: number;
  productName: string;
  customerId: string | number;
  customerName: string;
  lead_intent: LeadIntent;
  qty?: number | null;
  target_price?: number | null;
  assigned_sales_person_id?: string | number | null;
  salesPersonName?: string;
  createdAt: Date;
  updatedAt?: Date;
  source_supplier_id?: string | number | null;
  sourceSupplierName?: string;
  rawApiData: any;
  buyer: any;
  supplier: any;
  member_email?: string;
  member_phone?: string;
};

export type SelectOption = { value: any; label: string };

// --- Zod Schema for Filter Form ---
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

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Zod Schema for Schedule Form ---
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// --- UI Constants ---
const leadStatusColor: Record<LeadStatus | "default", string> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200",
  Contacted: "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200",
  Qualified:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-200",
  "Proposal Sent":
    "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-200",
  Negotiation:
    "bg-violet-100 text-violet-700 dark:bg-violet-700/30 dark:text-violet-200",
  "Follow Up":
    "bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200",
  Won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200",
  Lost: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};
const enquiryTypeColor: Record<EnquiryType | "default", string> = {
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
  "Manual Lead": "bg-blue-100 text-blue-700",
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
  { value: "Call", label: "Follow-up Call" },
  { value: "Deadline", label: "Project Deadline" },
  { value: "Reminder", label: "Reminder" },
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
  { id: "f1", type: "Question", subject: "Inquiry about bulk pricing", status: "Open" },
  { id: "f2", type: "Comment", subject: "Positive interaction with sales", status: "Closed" },
];
const dummyOpportunities = [
  { id: 'OPP-001', name: 'Bulk Order for Product X', stage: 'Negotiation', value: 50000, closeDate: '2024-08-30' },
  { id: 'OPP-002', name: 'Annual Service Contract', stage: 'Proposal Sent', value: 12000, closeDate: '2024-09-15' },
];
const dummyDeal = { id: 'DEAL-789', value: 75000, pipeline: 'Sales Pipeline', stage: 'Won', closeDate: '2024-07-20' };


// --- CSV Exporter ---
const CSV_LEAD_HEADERS = ["ID", "Lead Number", "Status", "Enquiry Type", "Product Name", "Customer ID", "Customer Name", "Intent", "Qty", "Target Price", "Sales Person", "Created At"];
const CSV_LEAD_KEYS: (keyof LeadListItem)[] = ["id", "lead_number", "lead_status", "enquiry_type", "productName", "customerId", "customerName", "lead_intent", "qty", "target_price", "salesPersonName", "createdAt"];
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

// ============================================================================
// --- MODALS SECTION ---
// ============================================================================
export type LeadModalType =
  | "email"
  | "whatsapp"
  | "notification"
  | "task"
  | "active"
  | "calendar"
  | "alert"
  | "document"
  | "feedback"
  | "convertToDeal"
  | "viewOpportunities"
  | "viewLeadForm"
  | "viewDeal"
  | "addAccountDocuments";
export interface LeadModalState {
  isOpen: boolean;
  type: LeadModalType | null;
  data: LeadListItem | null;
}
interface LeadModalsProps {
  modalState: LeadModalState;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}

const LeadModals: React.FC<LeadModalsProps> = ({ modalState, onClose, getAllUserDataOptions }) => {
  const { type, data: lead, isOpen } = modalState;
  if (!isOpen || !lead) return null;

  const renderModalContent = () => {
    switch (type) {
      case "email":
        return <SendEmailDialog lead={lead} onClose={onClose} />;
      case "whatsapp":
        return <SendWhatsAppDialog lead={lead} onClose={onClose} />;
      case "notification":
        return <AddNotificationDialog lead={lead} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
      case "task":
        return <AssignTaskDialog lead={lead} onClose={onClose} />;
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
        return <GenericActionDialog type={type} lead={lead} onClose={onClose} />;
    }
  };
  return <>{renderModalContent()}</>;
};

const ConvertLeadToDealDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({ lead, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { dealValue: lead.target_price || 0, dealName: `${lead.productName} for ${lead.customerName}` }
  });
  const onConvert = (data: any) => {
    setIsLoading(true);
    console.log(`Converting lead ${lead.lead_number} to deal with data:`, data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Lead Converted">Successfully converted to a new deal.</Notification>);
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Convert Lead to Deal</h5>
      <p className="mb-4">Convert lead <span className="font-semibold">{lead.lead_number}</span> into a new deal. Please confirm the details below.</p>
      <form onSubmit={handleSubmit(onConvert)}>
        <FormItem label="Deal Name">
          <Controller name="dealName" control={control} render={({ field }) => <Input {...field} />} />
        </FormItem>
        <FormItem label="Estimated Deal Value ($)">
          <Controller name="dealValue" control={control} render={({ field }) => <Input type="number" {...field} />} />
        </FormItem>
        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading}>Confirm & Convert</Button>
        </div>
      </form>
    </Dialog>
  );
};

const ViewOpportunitiesDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({ lead, onClose }) => {
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={700}>
      <h5 className="mb-4">Opportunities for {lead.lead_number}</h5>
      <div className="max-h-[400px] overflow-y-auto">
        <Table>
          <Table.THead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Stage</Table.Th>
              <Table.Th>Value</Table.Th>
              <Table.Th>Close Date</Table.Th>
            </Table.Tr>
          </Table.THead>
          <Table.TBody>
            {dummyOpportunities.map(op => (
              <Table.Tr key={op.id}>
                <Table.Td>{op.id}</Table.Td>
                <Table.Td>{op.name}</Table.Td>
                <Table.Td><Tag className="bg-purple-100 text-purple-700">{op.stage}</Tag></Table.Td>
                <Table.Td>${op.value.toLocaleString()}</Table.Td>
                <Table.Td>{dayjs(op.closeDate).format('DD MMM, YYYY')}</Table.Td>
              </Table.Tr>
            ))}
          </Table.TBody>
        </Table>
      </div>
      <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
    </Dialog>
  );
};

const ViewLeadFormDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({ lead, onClose }) => (
  <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
    <h5 className="mb-4">Lead Form Details: {lead.lead_number}</h5>
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <FormItem label="Product"><Input value={lead.productName} readOnly /></FormItem>
      <FormItem label="Customer"><Input value={`${lead.customerName} (ID: ${lead.customerId})`} readOnly /></FormItem>
      <div className="grid grid-cols-2 gap-4">
        <FormItem label="Quantity"><Input value={lead.qty ?? 'N/A'} readOnly /></FormItem>
        <FormItem label="Target Price"><Input value={lead.target_price ?? 'N/A'} readOnly /></FormItem>
      </div>
      <FormItem label="Assigned Sales Person"><Input value={lead.salesPersonName || 'Unassigned'} readOnly /></FormItem>
      <FormItem label="Enquiry Type"><Input value={lead.enquiry_type} readOnly /></FormItem>
      <FormItem label="Lead Intent"><Input value={lead.lead_intent} readOnly /></FormItem>
    </div>
    <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
  </Dialog>
);

const ViewDealDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({ lead, onClose }) => (
  <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
    <h5 className="mb-4">Associated Deal for {lead.lead_number}</h5>
    <p>This lead has been converted to the following deal:</p>
    <Card bordered className="mt-4">
      <p><strong>Deal ID:</strong> {dummyDeal.id}</p>
      <p><strong>Value:</strong> ${dummyDeal.value.toLocaleString()}</p>
      <p><strong>Pipeline:</strong> {dummyDeal.pipeline}</p>
      <p><strong>Stage:</strong> <Tag className="bg-emerald-100 text-emerald-700">{dummyDeal.stage}</Tag></p>
      <p><strong>Close Date:</strong> {dayjs(dummyDeal.closeDate).format('DD MMM, YYYY')}</p>
    </Card>
    <div className="text-right mt-6"><Button variant="solid" onClick={onClose}>Close</Button></div>
  </Dialog>
);

const AddAccountDocumentsDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({ lead, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({ defaultValues: { document: null, description: '' } });

  const onUpload = (data: any) => {
    setIsLoading(true);
    console.log(`Uploading document for lead ${lead.lead_number} with data:`, data);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Document Uploaded"></Notification>);
      setIsLoading(false);
      onClose();
    }, 1200);
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">Add Account Document</h5>
      <p className="mb-4">Upload a document for the account associated with <span className="font-semibold">{lead.customerName}</span>.</p>
      <form onSubmit={handleSubmit(onUpload)}>
        <FormItem label="Document File">
          <Controller name="document" control={control} render={({ field }) => <Input type="file" onChange={(e: any) => field.onChange(e.target.files?.[0])} />} />
        </FormItem>
        <FormItem label="Description">
          <Controller name="description" control={control} render={({ field }) => <Input textArea {...field} />} />
        </FormItem>
        <div className="text-right mt-6">
          <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading}>Upload</Button>
        </div>
      </form>
    </Dialog>
  );
};

const SendEmailDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({
  lead,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit } = useForm({
    defaultValues: { subject: `Regarding Lead: ${lead.lead_number}`, message: "" },
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
    const phone = lead.member_phone?.replace(/\D/g, "") || "1234567890"; // Dummy phone number
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
const AddNotificationDialog: React.FC<{
  lead: LeadListItem;
  onClose: () => void;
  getAllUserDataOptions: SelectOption[];
}> = ({ lead, onClose, getAllUserDataOptions }) => {
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
    defaultValues: {
      notification_title: `Update on Lead: ${lead.lead_number}`,
      send_users: [],
      message: `This is a notification regarding lead ID ${lead.lead_number} for the product "${lead.productName}".`
    },
    mode: 'onChange'
  });

  const onSend = async (formData: NotificationFormData) => {
    setIsLoading(true);
    const payload = {
      send_users: formData.send_users,
      notification_title: formData.notification_title,
      message: formData.message,
      module_id: String(lead.id),
      module_name: 'Lead',
    };

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
      <h5 className="mb-4">Add Notification for {lead.lead_number}</h5>
      <Form onSubmit={handleSubmit(onSend)}>
        <FormItem label="Notification Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}>
          <Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} />
        </FormItem>
        <FormItem label="Send to Users" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}>
          <Controller name="send_users" control={control} render={({ field }) => (
            <Select isMulti placeholder="Select Users" options={getAllUserDataOptions} value={getAllUserDataOptions.filter(o => field.value?.includes(o.value))} onChange={(options: any) => field.onChange(options?.map((o: any) => o.value) || [])} />
          )} />
        </FormItem>
        <FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}>
          <Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={3} />} />
        </FormItem>
        <div className="text-right mt-6">
          <Button className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send</Button>
        </div>
      </Form>
    </Dialog>
  );
};
const AssignTaskDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({
  lead,
  onClose,
}) => {
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
const AddScheduleDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({
  lead,
  onClose,
}) => {
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
      date_time: null as any, // react-hook-form needs null for empty date
      remind_from: null,
      notes: `Regarding lead for "${lead.productName}" from customer "${lead.customerName}".`,
    },
    mode: "onChange",
  });

  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = {
      module_id: Number(lead.id),
      module_name: "Member", // As per prompt requirement
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
const ViewAlertDialog: React.FC<{ lead: LeadListItem; onClose: () => void }> = ({
  lead,
  onClose,
}) => {
  const alertColors: Record<string, string> = {
    danger: "red",
    warning: "amber",
    info: "blue",
  };
  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={600}>
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
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose} width={700}>
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
                  <Tag className="text-white" prefix prefixClass={statusColors[fb.status]}>
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
    console.log(`Performing action '${type}' for lead ${lead.lead_number}`);
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

// ============================================================================
// --- END MODALS SECTION ---
// ============================================================================

const LeadActionColumn = ({
  onViewDetail,
  onEdit,
  onDelete,
  onAssign,
  onChangeStatus,
  onOpenModal,
}: {
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onChangeStatus: () => void;
  onOpenModal: (type: LeadModalType) => void;
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
      <Tooltip title="Delete Lead">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          )}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip>
      <Dropdown
        renderTitle={
          <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
        }
      >
        <Dropdown.Item onClick={() => onOpenModal("email")} className="flex items-center gap-2 text-xs">
          <TbMail size={18} /> Send Email
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("whatsapp")} className="flex items-center gap-2 text-xs">
          <TbBrandWhatsapp size={18} /> Send Whatsapp
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("notification")} className="flex items-center gap-2 text-xs">
          <TbBell size={18} /> Add Notification
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("task")} className="flex items-center gap-2 text-xs">
          <TbSubtask size={18} /> Assign Task
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("calendar")} className="flex items-center gap-2 text-xs">
          <TbCalendarEvent size={18} /> Add Schedule
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("active")} className="flex items-center gap-2 text-xs">
          <TbTagStarred size={18} /> Add Active
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("convertToDeal")} className="flex items-center gap-2 text-xs">
          <TbRocket size={18} /> Convert to Deal
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("viewOpportunities")} className="flex items-center gap-2 text-xs">
          <TbTrophy size={18} /> View Opportunities
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("viewLeadForm")} className="flex items-center gap-2 text-xs">
          <TbFileDescription size={18} /> View Lead Form
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("viewDeal")} className="flex items-center gap-2 text-xs">
          <TbPennant size={18} /> View Deal
        </Dropdown.Item>

        <Dropdown.Item onClick={() => onOpenModal("addAccountDocuments")} className="flex items-center gap-2 text-xs">
          <TbFileInvoice size={18} /> Add Account Documents
        </Dropdown.Item>
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

const LeadTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: any) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <LeadSearch onInputChange={onSearchChange} placeholder="Quick Search..." />
    </div>
    <div className="flex gap-1">
      <Button icon={<TbReload />} onClick={onClearFilters}></Button>
      <Button icon={<TbFilter />} onClick={onFilter}>
        Filter
      </Button>
      <Button icon={<TbCloudUpload />} onClick={onExport}>
        Export
      </Button>
    </div>
  </div>
);
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
const LeadsListing = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { LeadsData = [], getAllUserData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector, shallowEqual);

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
  const handleOpenModal = (type: LeadModalType, leadData: LeadListItem) =>
    setModalState({ isOpen: true, type, data: leadData });
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

  const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((user: any) => ({ value: user.id, label: user.name })) : [], [getAllUserData]);

  useEffect(() => {
    dispatch(getLeadAction());
    dispatch(getAllUsersAction());
  }, [dispatch]);

  const mappedLeads: LeadListItem[] = useMemo(() => {
    if (!Array.isArray(LeadsData?.data?.data)) return [];
    return LeadsData?.data?.data.map(
      (apiLead: any): LeadListItem => ({
        id: apiLead.id,
        lead_number: apiLead.lead_number || `LD-${apiLead.id}`,
        lead_status: apiLead.lead_status || "New",
        enquiry_type: apiLead.enquiry_type || "Other",
        productId: apiLead.product?.id,
        productName: apiLead.product?.name ?? "N/A",
        customerId: String(
          apiLead.customer?.id ?? (apiLead.member_id || "N/A")
        ),
        customerName: apiLead.customer?.name ?? "N/A",
        lead_intent: apiLead.lead_intent || "Buy",
        qty: apiLead.qty,
        target_price: apiLead.target_price,
        assigned_sales_person_id: apiLead.assigned_sales_person_id,
        salesPersonName: apiLead.sales_person_name,
        createdAt: new Date(apiLead.created_at),
        updatedAt: apiLead.updated_at
          ? new Date(apiLead.updated_at)
          : undefined,
        source_supplier_id: apiLead.source_supplier_id,
        sourceSupplierName: apiLead.source_supplier?.name,
        rawApiData: apiLead,
        buyer: apiLead.buyer,
        supplier: apiLead.supplier,
        member_email: apiLead.customer?.email,
        member_phone: apiLead.customer?.mobile_no
      })
    );
  }, [LeadsData?.data?.data]);

  const { pageData, total, allFilteredAndSortedData } = useMemo((): {
    pageData: LeadListItem[];
    total: number;
    allFilteredAndSortedData: LeadListItem[];
  } => {
    let processedData: LeadListItem[] = mappedLeads;

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

  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })),
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

  const openViewDialog = useCallback((lead: LeadListItem) => setLeadToView(lead), []);
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
    const moduleName = "Leads"; // Module name for logging
    const date = new Date().toISOString().split("T")[0];
    const fileName = `leads_export_${date}.csv`; // Dynamic filename
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
          message={error.message || "Could not complete export."}
        />
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

  const columns: ColumnDef<LeadListItem>[] = useMemo(
    () => [
      {
        header: "Lead",
        accessorKey: "lead_number",
        size: 130,
        cell: (props) => (
          <div className="flex flex-col gap-0.5 text-xs">
            <span>{props.getValue() as string}</span>
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
        accessorKey: "customerName",
        size: 180, // Increased size a bit
        cell: (props: CellContext<LeadListItem, any>) => {
          // Correctly access buyer and supplier from the current row's data
          const { buyer, supplier } = props.row.original;

          // Safely render buyer information
          const buyerInfo = buyer ? (
            <>
              <b>Buyer: {buyer.id}</b>
              <span>{buyer.name}</span>
            </>
          ) : (
            <span>Buyer: N/A</span>
          );

          // Safely render supplier information
          const supplierInfo = supplier ? (
            <>
              <b>Seller: {supplier.id}</b>
              <span>{supplier.name}</span>
            </>
          ) : (
            <span>Seller: N/A</span>
          );

          return (
            <div className="flex flex-col gap-1 text-xs">{buyerInfo}</div>
          );
        },
      },
      {
        header: "Details",
        size: 220,
        cell: (props: CellContext<LeadListItem, any>) => {
          const formattedDate = props.row.original.createdAt
            ? `${new Date(props.row.original.createdAt).getDate()} ${new Date(
              props.row.original.createdAt
            ).toLocaleString("en-US", {
              month: "short",
            })} ${new Date(
              props.row.original.createdAt
            ).getFullYear()}, ${new Date(
              props.row.original.createdAt
            ).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}`
            : "N/A";

          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <div>
                <Tag>{props.row.original.lead_intent || "Buy"}</Tag>
                <span>Qty: {props.row.original.qty ?? "-"}</span>
              </div>

              <span>
                Target Price: {props.row.original.target_price ?? "-"}
              </span>
              <span>
                Sales Person : {props.row.original.salesPersonName || "Unassigned"}
              </span>
              <b>{formattedDate}</b>
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center" },
        size: 80,
        cell: (props: CellContext<LeadListItem, any>) => (
          <LeadActionColumn
            onViewDetail={() => openViewDialog(props.row.original)}
            onEdit={() => handleOpenEditLeadPage(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onAssign={() => openAssignDrawer(props.row.original)}
            onChangeStatus={() => openChangeStatusDrawer(props.row.original)}
            onOpenModal={(type) => handleOpenModal(type, props.row.original)}
          />
        ),
      },
    ],
    [
      openViewDialog,
      handleOpenEditLeadPage,
      handleDeleteClick,
      openAssignDrawer,
      openChangeStatusDrawer,
      handleOpenModal,
    ]
  );

  const tableIsLoading =
    masterLoadingStatus === "loading" ||
    masterLoadingStatus === "pending" ||
    isSubmittingDrawer ||
    isProcessingDelete;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Leads Listing</h5>
            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={handleOpenAddLeadPage}
            >
              Add New
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-8 mb-4 gap-2 ">
            <Card
              bodyClass="flex gap-2 p-1"
              className="rounded-sm border border-blue-200"
            >
              <div className="h-9 w-8 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbTrophy size={20} />
              </div>
              <div className="flex flex-col">
                <b className="text-blue-500">{LeadsData?.counts?.total}</b>
                <span className="font-semibold text-[10px]">Total</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-1"
              className="rounded-sm border border-violet-200"
            >
              <div className="h-9 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbCalendar size={20} />
              </div>
              <div className="flex flex-col">
                <b className="text-violet-500">{LeadsData?.counts?.today}</b>
                <span className="font-semibold text-[10px]">Today</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-1"
              className="rounded-sm border border-green-300"
            >
              <div className="h-9 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbCircleCheck size={20} />
              </div>
              <div className="flex flex-col">
                <b className="text-green-500">{LeadsData?.counts?.active}</b>
                <span className="font-semibold text-[10px]">Active</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-1"
              className="rounded-sm border border-green-300"
            >
              <div className="h-9 w-8 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbFlag size={20} />
              </div>
              <div className="flex flex-col">
                <b className="text-green-500">
                  {LeadsData?.counts?.deal_done}
                </b>
                <span className="font-semibold text-[10px]">Deal Done</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-1"
              className="rounded-sm border border-red-200"
            >
              <div className="h-9 w-8 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbFlagX size={20} />
              </div>
              <div className="flex flex-col">
                <b className="text-red-500">{LeadsData?.counts?.cancelled}</b>
                <span className="font-semibold text-[10px]">Cancelled</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-1"
              className="rounded-sm border border-violet-200"
            >
              <div className="h-9 w-8 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbBox size={20} />
              </div>
              <div className="flex flex-col">
                <b className="text-violet-500">
                  {LeadsData?.counts?.product_lead}
                </b>
                <span className="font-semibold text-[10px]">Product Lead</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-1"
              className="rounded-sm border border-pink-200"
            >
              <div className="h-9 w-8 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                <TbListDetails size={20} />
              </div>
              <div className="flex flex-col">
                <b className="text-pink-500">{LeadsData?.counts?.wall_lead}</b>
                <span className="font-semibold text-[10px]">Wall Lead</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-1"
              className="rounded-sm border border-orange-200"
            >
              <div className="h-9 w-8 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbPennant size={20} />
              </div>
              <div className="flex flex-col">
                <b className="text-orange-500">
                  {LeadsData?.counts?.manual_lead}
                </b>
                <span className="font-semibold text-[10px]">Manual Lead</span>
              </div>
            </Card>
          </div>
          <LeadTableTools
            onClearFilters={onClearFilters}
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportModal}
          />
          <div className="mt-4 flex-grow overflow-y-auto">
            <LeadTable
              columns={columns}
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
                  "supplier",
                  "product",
                  "customer",
                  "created_by_user",
                  "updated_by_user",
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
                    displayValue = <span className="text-gray-400">-</span>;
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
            <Button
              size="sm"
              className="mr-2"
              onClick={closeAssignDrawer}
            >
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
            Assign lead{" "}
            <strong>{editingLeadForDrawer?.lead_number}</strong>.
          </p>
          <FormItem
            label="Sales Person"
            error={assignFormMethods.formState.errors.salesPersonId?.message}
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
                  value={dummySalesPersons.find(
                    (sp) => sp.id === field.value
                  )}
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
            error={statusFormMethods.formState.errors.newStatus?.message}
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
                  onChange={(opt: any) => field.onChange(opt?.value as LeadStatus)}
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
                  value={field.value as any}
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
        </p>
      </ConfirmDialog>

      <LeadModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={getAllUserDataOptions} />

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