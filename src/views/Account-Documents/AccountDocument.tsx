import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import cloneDeep from "lodash/cloneDeep";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import axiosInstance from "@/services/api/api"; // Added for done leads modal

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
  Avatar,
  Card,
  Checkbox,
  DatePicker,
  Dialog,
  Drawer,
  Input,
  Select,
  Spinner,
  Form as UiForm,
  FormItem as UiFormItem,
  Select as UiSelect,
  Table,
  Skeleton,
} from "@/components/ui";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbAlarm,
  TbBell,
  TbBellRinging,
  TbBrandGoogleDrive,
  TbBrandWhatsapp,
  TbBuildingStore,
  TbCalendarClock,
  TbCalendarEvent,
  TbCheck,
  TbChecklist,
  TbCloudDownload,
  TbCloudUpload,
  TbColumns,
  TbEye,
  TbFileAlert,
  TbFileCertificate,
  TbFileCheck,
  TbFileDescription,
  TbFileExcel,
  TbFilePlus,
  TbFilter,
  TbMailShare,
  TbNotesOff,
  TbPencil,
  TbPencilPlus,
  TbPlus,
  TbReload,
  TbTagStarred,
  TbUser,
  TbX,
  TbCircleCheck, // Icon for Verify button
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  CellContext,
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";
import {
  AccountDocumentListItem,
  AccountDocumentStatus,
  EnquiryType,
} from "./types";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addaccountdocAction,
  addAllActionAction,
  addAllAlertsAction,
  addNotificationAction,
  addScheduleAction,
  addTaskAction,
  editaccountdocAction,
  getaccountdocAction,
  getAlertsAction,
  getAllCompany,
  getAllUsersAction,
  getbyIDaccountdocAction,
  getDocumentListAction,
  getEmployeesListingAction,
  getFillUpFormAction, // IMPORTED from FillUpForm
  getFilledFormAction, // IMPORTED from FillUpForm
  getFormBuilderAction,
  getfromIDcompanymemberAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { encryptStorage } from "@/utils/secureLocalStorage";
import { config } from "localforage";
import { shallowEqual, useSelector } from "react-redux";


// --- START: Copied types and constants from LeadsListing for PendingLeadsModal ---
export type LeadStatus =
  | "New"
  | "Contacted"
  | "Assignment sent"
  | "Assigned"
  | "Accepted"
  | "In Process"
  | "For Approval"
  | "Qualified"
  | "Proposal Sent"
  | "Negotiation"
  | "Follow Up"
  | "Won"
  | "Lost"
  | "Cancelled"
  | "Completed"
  | "Deal Done"
  | "Approved"
  | "Rejected";

const leadStatusColor: Record<LeadStatus | "default" | string, string> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200",
  Contacted: "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200",
  "Assignment sent":
    "bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-200",
  Assigned:
    "bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-200",
  Accepted:
    "bg-lime-100 text-lime-700 dark:bg-lime-700/30 dark:text-lime-200",
  "In Process":
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-200",
  "For Approval":
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-200",
  Qualified:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-200",
  "Proposal Sent":
    "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-200",
  Negotiation:
    "bg-violet-100 text-violet-700 dark:bg-violet-700/30 dark:text-violet-200",
  "Follow Up":
    "bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200",
  Won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200",
  Approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200",
  Lost: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200",
  Cancelled:
    "bg-gray-100 text-gray-500 dark:bg-gray-700/30 dark:text-gray-400",
  Completed:
    "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200",
  "Deal Done":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};
// --- END: Copied types and constants ---

// --- START: NEW TYPES FOR VERIFIED LEAD MODAL ---
export type LeadMemberInfo = {
  id: number;
  name: string;
  member_code: string;
};
export type VerifiedLead = {
  id: number;
  lead_number: string | null;
  qty: number;
  target_price: number;
  color: string | null;
  device_condition: string | null;
  lead_status: string;
  product: {
    id: number;
    name: string;
  };
  product_spec: {
    id: number;
    name: string;
  } | null;
  lead_info: {
    buyer: LeadMemberInfo | null;
    seller: LeadMemberInfo | null;
  };
  customer: {
    company_actual: string | null;
  };
};
// Note: SalesFormItem type appears to be inconsistent with usage, so it is being corrected at the component level
export type SalesFormItem = {
  id: number; // This is the sales_form_id
  lead: VerifiedLead;
};
// --- END: NEW TYPES ---


// --- START: NEW REFACTORED COMPONENT FOR PENDING LEAD DETAILS VIEW MODAL ---
const StatBox: React.FC<{
  value: React.ReactNode;
  label: string;
  className?: string;
}> = ({ value, label, className }) => (
  <div className={`text-center px-4 py-2 border-dashed border-gray-200 dark:border-gray-600 ${className}`}>
    <h4 className="font-bold">{value}</h4>
    <p className="text-gray-500 text-sm">{label}</p>
  </div>
);

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
    <span className="font-semibold text-gray-700 dark:text-gray-200">{label}</span>
    <span className="text-gray-900 dark:text-gray-50 text-right">{children || '—'}</span>
  </div>
);

const HeaderCard: React.FC<{ lead: VerifiedLead }> = ({ lead }) => (
  <Card>
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="flex-grow grid grid-cols-2 sm:grid-cols-5 gap-1 w-full">
        <StatBox value={lead?.qty} label="Quantity" />
        <StatBox value={`$${lead?.target_price || '0.00'}`} label="Target Price" className="sm:border-l" />
        <StatBox
          value={<Tag className="bg-emerald-100 text-emerald-600">{lead?.lead_status}</Tag>}
          label="Lead Status"
          className="sm:border-l"
        />
        <StatBox value={lead?.lead_number || `LD-${lead?.id}`} label="Lead #" className="col-span-2 sm:col-span-1 sm:border-l" />
        <StatBox value={<div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
          <TbBuildingStore className="text-gray-500 dark:text-gray-400" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">
            {lead.customer.company_actual || 'N/A'}
          </span>
        </div>} label="Actual Company" className="col-span-2 sm:col-span-1 sm:border-l" />

      </div>
    </div>
  </Card>
);

const ProductDetailsTab: React.FC<{ lead: VerifiedLead }> = ({ lead }) => (
  <Card>
    <h5 className="font-semibold mb-4">Product Details</h5>
    <InfoRow label="Product Name">{lead?.product.name}</InfoRow>
    <InfoRow label="Quantity">{lead?.qty}</InfoRow>
    <InfoRow label="Target Price">{`$${lead?.target_price || 'N/A'}`}</InfoRow>
    <InfoRow label="Color">{lead?.color}</InfoRow>
    <InfoRow label="Device Condition">{lead?.device_condition}</InfoRow>
    <InfoRow label="Product Spec">{lead?.product_spec?.name}</InfoRow>

  </Card>
);

const MemberDetailsTab: React.FC<{ title: string; member: LeadMemberInfo | null }> = ({ title, member }) => (
  <Card>
    <h5 className="font-semibold mb-4">{title}</h5>
    {member ? (
      <>
        <InfoRow label="Name">{member?.name}</InfoRow>
        <InfoRow label="Member ID">{member?.member_code}</InfoRow>
      </>
    ) : (
      <p className="text-gray-500">No details available.</p>
    )}
  </Card>
);

const PendingLeadViewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onend: () => void;
  leadData: VerifiedLead | null; // MODIFIED: Corrected type from SalesFormItem to VerifiedLead
  onNavigateAway: (path: string) => void;
  handleOpenAddDrawer: (leadNumber?: string) => void; // MODIFIED: Changed signature
}> = ({
  isOpen,
  onClose,
  onend,
  leadData,
  onNavigateAway,
  handleOpenAddDrawer,
}) => {
    const [activeTab, setActiveTab] = useState('product_details');

    useEffect(() => {
      if (isOpen) {
        setActiveTab('product_details'); // Reset to first tab on open
      }
    }, [isOpen]);

    if (!isOpen || !leadData) {
      return null;
    }


    const tabList = [
      { key: 'product_details', label: 'Product Details' },
      { key: 'seller_details', label: 'Seller Details (From)' },
      { key: 'buyer_details', label: 'Buyer Details (To)' },
    ];

    const renderActiveTabContent = () => {
      switch (activeTab) {
        case 'product_details':
          return <ProductDetailsTab lead={leadData} />;
        case 'seller_details':
          return <MemberDetailsTab title="Purchase From (Supplier)" member={leadData?.lead_info?.seller} />;
        case 'buyer_details':
          return <MemberDetailsTab title="Sale To (Buyer)" member={leadData?.lead_info?.buyer} />;
        default:
          return <ProductDetailsTab lead={leadData} />;
      }
    };

    return (
      <Dialog isOpen={isOpen} onClose={onClose} onRequestClose={onClose} width={800}>
        <div className="mb-4">
          <h5 className="mb-1">Verify Done Lead</h5>
          <p>Review the details of the completed lead before final processing.</p>
        </div>

        <div className="mb-6">
          <HeaderCard lead={leadData} />
        </div>

        <div className="flex flex-row items-center border-b border-gray-200 dark:border-gray-600 mb-3 flex-wrap">
          {tabList.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={classNames('px-4 py-3 -mb-px font-semibold focus:outline-none whitespace-nowrap', {
                'text-indigo-600 border-b-2 border-indigo-600': activeTab === tab.key,
                'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200': activeTab !== tab.key,
              })}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[200px]">
          {renderActiveTabContent()}
        </div>

        <div className="flex justify-between items-center mt-2">
          <div>
            <Button
              variant="plain"
              icon={<TbX />}
              onClick={onClose}
            >
              Close
            </Button>
          </div>
          <div className="flex items-center gap-4">
            {!leadData?.customer?.company_actual ? (
              <Button
                variant="twoTone"
                icon={<TbBuildingStore />}
                onClick={() => onNavigateAway('/business-entities/company-create')}
              >
                Create Company Member
              </Button>
            ) : null}
            <Button
              variant="solid"
              icon={<TbFilePlus />}
              onClick={() => {
                onClose(); // Close the detail modal
                onend(); // Close the list modal
                const leadNum = leadData.lead_number || `LD-${leadData.id}`;
                handleOpenAddDrawer(leadNum); // Call with lead number
              }}
            >
              Create Account Document
            </Button>
          </div>
        </div>
      </Dialog>
    );
  };
// --- END: NEW REFACTORED COMPONENT ---


// --- START: MODIFIED COMPONENT FOR "Deal Done" LEADS MODAL ---
const PendingLeadsModal = ({
  isOpen,
  onClose,
  onActionSuccess,
  handleOpenAddDrawer,
}: {
  isOpen: boolean;
  onClose: () => void;
  onActionSuccess: () => void;
  handleOpenAddDrawer: (leadNumber?: string) => void;
}) => {
  const navigate = useNavigate();
  const { getaccountdoc } = useSelector(masterSelector);
  const [pendingLeads, setPendingLeads] = useState<VerifiedLead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<VerifiedLead | null>(null);

  const existingDocNumbers = useMemo(() => {
    if (!getaccountdoc?.data || !Array.isArray(getaccountdoc.data)) {
      return new Set<string>();
    }
    return new Set(
      getaccountdoc.data
        .map((doc: any) => doc.document_number)
        .filter(Boolean)
    );
  }, [getaccountdoc]);


  const fetchPendingLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        "/lead/lead?per_page=99999&status=Deal Done"
      );
      const allPendingLeads = response.data?.data?.data || [];

      // Filter out leads that already have an account document
      const filteredLeads = allPendingLeads.filter((lead: VerifiedLead) => {
        const leadNum = lead.lead_number || `LD-${lead.id}`;
        return !existingDocNumbers.has(leadNum);
      });

      setPendingLeads(filteredLeads);

    } catch (error) {
      toast.push(
        <Notification type="danger" title="Error">
          Failed to fetch done leads.
        </Notification>
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [existingDocNumbers]);

  useEffect(() => {
    if (isOpen) {
      fetchPendingLeads();
    }
  }, [isOpen, fetchPendingLeads]);

  const handleViewClick = (leadData: VerifiedLead) => {
    setSelectedLead(leadData);
    setIsViewModalOpen(true);
  };

  const handleNavigateAway = (path: string) => {
    setIsViewModalOpen(false);
    onClose();
    navigate(path);
  };


  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        onRequestClose={onClose}
        width={1000}
        bodyOpenClassName="overflow-hidden"
      >
        <div className="flex flex-col h-full max-h-[80vh]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h5 className="mb-0">Done Leads for Verification</h5>
          </div>
          <div className="flex-grow overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size={40} />
              </div>
            ) : pendingLeads.length > 0 ? (
              <Table>
                <Table.THead>
                  <Table.Tr>
                    <Table.Th>Lead Info</Table.Th>
                    <Table.Th>Product</Table.Th>
                    <Table.Th>Members (Buyer/Seller)</Table.Th>
                    <Table.Th>Details</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.THead>
                <Table.TBody>
                  {pendingLeads.map((item) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        {item?.lead_number || `LD-${item?.id}`}
                      </Table.Td>
                      <Table.Td>{item?.product?.name || "N/A"}</Table.Td>
                      <Table.Td>
                        <div className="text-xs">
                          <p>
                            <strong>B:</strong>{" "}
                            {item?.lead_info?.buyer?.name || "N/A"}
                          </p>
                          <p>
                            <strong>S:</strong>{" "}
                            {item?.lead_info?.seller?.name || "N/A"}
                          </p>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        Qty: {item?.qty || "-"} | Price: $
                        {item?.target_price || "-"}
                      </Table.Td>
                      <Table.Td>
                        <div className="flex items-center gap-2">
                          <Tooltip title="View Details">
                            <Button
                              shape="circle"
                              size="xs"
                              icon={<TbEye />}
                              onClick={() => handleViewClick(item)}
                            />
                          </Tooltip>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.TBody>
              </Table>
            ) : (
              <div className="text-center p-10 text-gray-500">
                <p>No done leads found to be processed.</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-right">
            <Button variant="solid" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      <PendingLeadViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        leadData={selectedLead}
        onend={onClose}
        onNavigateAway={handleNavigateAway}
        handleOpenAddDrawer={handleOpenAddDrawer}
      />
    </>
  );
};
// --- END: MODIFIED COMPONENT ---


// --- Define Types ---
export type SelectOption = { value: any; label: string };
export type ModalType =
  | "notification"
  | "schedule"
  | "view"
  | "task"
  | "alert"
  | "activity"
  | "email"
  | "whatsapp"
  | "document";

export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data: any;
}
type FilterFormData = {
  filterStatus?: SelectOption[];
  doc_type?: SelectOption[];
  comp_doc?: SelectOption[];
};
interface AlertNote {
  id: number;
  note: string; // HTML content from RichTextEditor
  created_by_user: { name: string };
  created_at: string; // ISO date string
}
// --- START: Types from FillUpForm ---
interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'date' | 'checkbox' | 'multi_checkbox';
  options?: { label: string, name: string }[];
  required: boolean;
}
interface FormSection {
  id: string;
  label: string;
  fields: FormField[];
}
interface FormStructure {
  form_title: string;
  sections: FormSection[];
}
// --- END: Types from FillUpForm ---


// --- Zod Schemas ---
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

const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const addEditDocumentSchema = z.object({
  lead_number: z.string().optional().nullable(),
  company_document: z
    .string({ required_error: "Company Document is required." })
    .min(1, "Company Document is required."),
  document_type: z
    .number({ required_error: "Document Type is required." })
    .min(1, "Document Type is required."),
  document_number: z.string().optional().nullable(),
  invoice_number: z.string().optional().nullable(),
  form_id: z.number().optional().nullable(),
  employee_id: z.number().optional().nullable(),
  member_id: z.number().optional().nullable(),
  company_id: z.string().optional().nullable(),
});
type AddEditDocumentFormData = z.infer<typeof addEditDocumentSchema>;

const taskValidationSchema = z.object({
  task_title: z.string().min(3, "Task title must be at least 3 characters."),
  assign_to: z.array(z.number()).min(1, "At least one assignee is required."),
  priority: z.string().min(1, "Please select a priority."),
  due_date: z.date().nullable().optional(),
  description: z.string().optional(),
});
type TaskFormData = z.infer<typeof taskValidationSchema>;
const taskPriorityOptions: SelectOption[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

const alertNoteSchema = z.object({
  newNote: z.string().min(10, "Note must contain at least 10 characters."),
});
type AlertNoteFormData = z.infer<typeof alertNoteSchema>;

const activitySchema = z.object({
  item: z
    .string()
    .min(3, "Activity item is required and must be at least 3 characters."),
  notes: z.string().optional(),
});
type ActivityFormData = z.infer<typeof activitySchema>;

// --- CSV Exporter Utility ---
const ACCOUNT_DOC_CSV_HEADERS = [
  "Lead Number",
  "Company",
  "Member",
  "Status",
  "Document Form",
  "Document Number",
  "Invoice Number",
  "Assigned To",
  "Creation Date",
];
type AccountDocExportItem = {
  leadNumber: string;
  companyName: string;
  memberName: string;
  status: string;
  formType: string;
  documentNumber: string;
  invoiceNumber: string;
  userName: string;
  createdAtFormatted: string;
};
const ACCOUNT_DOC_CSV_KEYS_EXPORT: (keyof AccountDocExportItem)[] = [
  "leadNumber",
  "companyName",
  "memberName",
  "status",
  "formType",
  "documentNumber",
  "invoiceNumber",
  "userName",
  "createdAtFormatted",
];

function exportToCsv(filename: string, rows: AccountDocumentListItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }

  const transformedRows: AccountDocExportItem[] = rows.map((row) => ({
    leadNumber: row.leadNumber || "N/A",
    companyName: row.companyName || "N/A",
    memberName: row.memberName || "N/A",
    status: row.status
      ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
      : "N/A",
    formType: row.formType || "N/A",
    documentNumber: row.documentNumber || "N/A",
    invoiceNumber: row.invoiceNumber || "N/A",
    userName: row.userName || "N/A",
    createdAtFormatted: row.createdAt
      ? dayjs(row.createdAt).format("DD/MM/YYYY HH:mm")
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    ACCOUNT_DOC_CSV_HEADERS.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return ACCOUNT_DOC_CSV_KEYS_EXPORT.map((k) => {
          let cell: any = row[k as keyof AccountDocExportItem];
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
    toast.push(
      <Notification title="Export Successful" type="success">
        Data exported to {filename}.
      </Notification>
    );
    return true;
  }

  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

const eventTypeOptions = [
  // Customer Engagement & Sales
  { value: "Meeting", label: "Meeting" },
  { value: "Demo", label: "Product Demo" },
  { value: "IntroCall", label: "Introductory Call" },
  { value: "FollowUpCall", label: "Follow-up Call" },
  { value: "QBR", label: "Quarterly Business Review (QBR)" },
  { value: "CheckIn", label: "Customer Check-in" },
  { value: "LogEmail", label: "Log an Email" },

  // Project & Task Management
  { value: "Milestone", label: "Project Milestone" },
  { value: "Task", label: "Task" },
  { value: "FollowUp", label: "General Follow-up" },
  { value: "ProjectKickoff", label: "Project Kick-off" },
];

const accountDocumentStatusColor: Record<
  AccountDocumentStatus | "verified",
  string
> = {
  approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  verified: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-100",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  uploaded:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100",
  not_uploaded:
    "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-100",
  completed:
    "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100",
  force_completed:
    "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-100",
};

const enquiryTypeColor: Record<EnquiryType | "default", string> = {
  purchase: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  sales: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  service:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};


// --- START: Helper Functions from FillUpForm ---
const sanitizeForName = (str: string): string => str.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/_$/, '');

const transformApiDataToFormStructure = (apiData: any): FormStructure | null => {
  if (!apiData || !apiData.section) return null;
  const transformedSections: FormSection[] = apiData.section.map((apiSection: any, sectionIndex: number) => {
    const sectionId = sanitizeForName(apiSection.title || `section_${sectionIndex}`);
    const transformedFields: FormField[] = apiSection.questions.flatMap((question: any) => {
      const baseFieldName = sanitizeForName(question.question);
      if (question.question_type === 'checkbox' && question.question_label) {
        const labels = question.question_label.split(',');
        return [{ name: `${sectionId}.${baseFieldName}`, label: question.question, type: 'multi_checkbox', required: question.required, options: labels.map((label: string) => ({ label: label.trim(), name: `${sectionId}.${baseFieldName}.${sanitizeForName(label)}` })) }] as FormField;
      }
      return [{ name: `${sectionId}.${baseFieldName}`, label: question.question, type: question.question_type, required: question.required }] as FormField;
    });
    return { id: sectionId, label: apiSection.title, fields: transformedFields };
  });
  return { form_title: apiData.form_name || 'Dynamic Form', sections: transformedSections };
};
// --- END: Helper Functions from FillUpForm ---


// --- Helper Components ---
const AccountDocumentActionColumn = ({
  onOpenModal,
  onView,
  onEdit,
  rowData,
}: any) => {
  const navigate = useNavigate();

  const handleFillUpClick = () => {
    if (rowData.formId && rowData.formId !== 'N/A') {
      navigate(`/fill-up-form/${rowData.id}/${rowData.formId}`);
    } else {
      toast.push(
        <Notification title="No Form to Fill" type="info">
          This document does not have an associated form.
        </Notification>
      );
    }
  };
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Fillup Form">
        <div className="text-xl cursor-pointer" onClick={handleFillUpClick}>
          <TbChecklist />
        </div>
      </Tooltip>
      <Tooltip title="Edit">
        <div className="text-xl cursor-pointer" onClick={onEdit}>
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div className="text-xl cursor-pointer" onClick={onView}>
          <TbEye />
        </div>
      </Tooltip>
      <Dropdown
        renderTitle={
          <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
        }
      >
        <Dropdown.Item
          className="flex items-center gap-2"
          onClick={() => onOpenModal("email", rowData)}
        >
          <TbMailShare size={18} /> <span className="text-xs">Send Email</span>
        </Dropdown.Item>
        <Dropdown.Item
          className="flex items-center gap-2"
          onClick={() => onOpenModal("whatsapp", rowData)}
        >
          <TbBrandWhatsapp size={18} />
          <span className="text-xs">Send Whatsapp</span>
        </Dropdown.Item>
        <Dropdown.Item
          className="flex items-center gap-2"
          onClick={() => onOpenModal("notification", rowData)}
        >
          <TbBell size={18} />
          <span className="text-xs">Add Notification</span>
        </Dropdown.Item>
        <Dropdown.Item
          className="flex items-center gap-2"
          onClick={() => onOpenModal("schedule", rowData)}
        >
          <TbCalendarClock size={18} />
          <span className="text-xs">Add Schedule </span>
        </Dropdown.Item>
        <Dropdown.Item
          className="flex items-center gap-2"
          onClick={() => onOpenModal("task", rowData)}
        >
          <TbUser size={18} /> <span className="text-xs">Assign Task</span>
        </Dropdown.Item>
        <Dropdown.Item
          className="flex items-center gap-2"
          onClick={() => onOpenModal("alert", rowData)}
        >
          <TbAlarm size={18} />{" "}
          <span className="text-xs">View/Add Alert</span>
        </Dropdown.Item>
        <Dropdown.Item
          className="flex items-center gap-2"
          onClick={() => onOpenModal("activity", rowData)}
        >
          <TbTagStarred size={18} />{" "}
          <span className="text-xs">Add Activity</span>
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const AddNotificationDialog = ({
  document,
  onClose,
  getAllUserDataOptions,
}: any) => {
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
      notification_title: `Regarding Document: ${document.documentNumber || document.document_number
        }`,
      send_users: [],
      message: `This is a notification for document number "${document.documentNumber || document.document_number
        }" for company "${document.companyName || document.company?.company_name}".`,
    },
    mode: "onChange",
  });
  const onSend = async (formData: NotificationFormData) => {
    setIsLoading(true);
    const payload = {
      send_users: formData.send_users,
      notification_title: formData.notification_title,
      message: formData.message,
      module_id: String(document.id),
      module_name: "AccountDocument",
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
        Notify about: {document.documentNumber || document.document_number}
      </h5>
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
                value={getAllUserDataOptions.filter((o: any) =>
                  field.value?.includes(o.value)
                )}
                onChange={(options: any) =>
                  field.onChange(options?.map((o: any) => o.value) || [])
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

const AddScheduleDialog: React.FC<any> = ({ document, onClose }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      event_title: `Follow-up on Document ${document.documentNumber || document.document_number
        }`,
      event_type: undefined,
      date_time: null as any,
      remind_from: null,
      notes: `Regarding document for ${document.companyName || document.company?.company_name
        } (Lead: ${document.leadNumber || "N/A"})`,
    },
    mode: "onChange",
  });
  const onAddEvent = async (data: ScheduleFormData) => {
    setIsLoading(true);
    const payload = {
      module_id: Number(document.id),
      module_name: "AccountDocument",
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
          children={`Successfully scheduled event for document ${document.documentNumber || document.document_number
            }.`}
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
      <h5 className="mb-4">
        Add Schedule for Document{" "}
        {document.documentNumber || document.document_number}
      </h5>
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

const DetailItem = ({
  label,
  value,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start mb-3">
      <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 w-full sm:w-1/3 shrink-0">
        {label}
      </span>
      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-0 w-full">
        {children || value || <span className="italic text-gray-400">N/A</span>}
      </div>
    </div>
  );
};

const InfoItem = ({
  icon,
  label,
  value,
  children,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={classNames("flex items-start gap-3", className)}>
      <div className="text-gray-400 mt-1">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {children || value || (
            <span className="italic text-gray-400">N/A</span>
          )}
        </div>
      </div>
    </div>
  );
};

// --- NEW: Filled Form Viewer Component ---
const FilledFormViewer = ({
  formStructure,
  filledData,
}: {
  formStructure: FormStructure;
  filledData: any;
}) => {
  // Helper to get value from nested filledData object
  const getFieldValue = (field: FormField, sectionId: string) => {
    const questionKey = field.name.split('.').pop() || '';
    return filledData?.[sectionId]?.[questionKey];
  };

  return (
    <div className='mt-6 space-y-6'>
      {formStructure.sections.map((section) => (
        <div key={section.id}>
          <h6 className="font-semibold text-base mb-4 border-b dark:border-gray-700 pb-3">
            {section.label}
          </h6>
          <div className="space-y-4">
            {section.fields.map((field) => {
              const value = getFieldValue(field, section.id);
              if (value === undefined || value === null || value === '') {
                return (
                  <DetailItem key={field.name} label={field.label} value="N/A" />
                );
              }

              switch (field.type) {
                case 'file':
                  return (
                    <DetailItem key={field.name} label={field.label}>
                      {value ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View/Download File
                        </a>
                      ) : ('N/A')}
                    </DetailItem>
                  );
                case 'multi_checkbox':
                  return (
                    <DetailItem key={field.name} label={field.label}>
                      {(Array.isArray(value) && value.length > 0) ? value.join(', ') : 'No selection'}
                    </DetailItem>
                  );
                case 'checkbox':
                  return (
                    <DetailItem key={field.name} label={field.label} value={value ? 'Yes' : 'No'} />
                  );
                case 'date':
                  return (
                    <DetailItem key={field.name} label={field.label} value={dayjs(value).format('DD MMM YYYY')} />
                  );
                case 'textarea':
                  return (
                    <DetailItem key={field.name} label={field.label}>
                      <p className="whitespace-pre-wrap">{value}</p>
                    </DetailItem>
                  );
                default:
                  return (
                    <DetailItem key={field.name} label={field.label} value={value} />
                  );
              }
            })}
          </div>
        </div>
      ))}
    </div>
  );
};


// --- MODIFIED: ViewDocumentDialog with Form Viewer and Verify Button ---
const ViewDocumentDialog = ({
  document,
  onClose,
  onActionSuccess,
}: {
  document: any;
  onClose: () => void;
  onActionSuccess: () => void;
}) => {
  const dispatch = useAppDispatch();

  // State for form data
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [formStructure, setFormStructure] = useState<FormStructure | null>(null);
  const [filledData, setFilledData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!document?.form?.id || !document?.id) {
      return; // No form associated with this document
    }

    const fetchFormData = async () => {
      setIsFormLoading(true);
      try {
        const structurePromise = dispatch(getFillUpFormAction(document.form.id)).unwrap();
        const dataPromise = dispatch(getFilledFormAction(document.id)).unwrap();

        const [structureResponse, dataResponse] = await Promise.all([structurePromise, dataPromise]);

        const uiStructure = transformApiDataToFormStructure(structureResponse);
        if (uiStructure) {
          setFormStructure(uiStructure);
          setFilledData(dataResponse?.form_data || {});
        }
      } catch (error: any) {
        toast.push(
          <Notification type="danger" title="Form Load Error" children={error.message || 'Could not load form data.'} />
        );
      } finally {
        setIsFormLoading(false);
      }
    };

    fetchFormData();
  }, [document, dispatch]);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      axiosInstance.post(`/account_doc/status/${document.id}`, { status: "Verified" });
      // await dispatch(editaccountdocAction({ ...document, id: document.id,company_id: String(document.company_id), status: "Verified" })).unwrap()

      toast.push(<Notification type="success" title="Document Verified!" />);
      onActionSuccess(); // Refresh the main table
      onClose();
    } catch (error: any) {
      toast.push(<Notification type="danger" title="Verification Failed" children={error?.message || 'An unknown error occurred.'} />);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!document) return null;

  const {
    status,
    document_number,
    invoice_number,
    company_document,
    created_at,
    updated_at,
    created_by_user,
    updated_by_user,
    member,
    company,
    form,
    document: docTypeInfo,
  } = document;

  const statusKey = (status?.toLowerCase().replace(/ /g, "_") ??
    "pending") as keyof typeof accountDocumentStatusColor;
  const statusColor = accountDocumentStatusColor[statusKey] || "bg-gray-100";
  const statusLabel = status?.replace(/_/g, " ") || "N/A";

  const canVerify = status && status !== 'approved' && status !== 'rejected';

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={1000} // Increased width for better form view
      bodyOpenClassName="overflow-y-hidden"
    >
      <div className="flex flex-col h-full">
        {/* --- Dialog Header --- */}
        <div className="flex justify-between items-start p-4 border-b dark:border-gray-700">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-xl mb-0">{document_number}</h4>
              <Tag className={classNames(statusColor, "capitalize")}>
                {statusLabel}
              </Tag>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Document details for{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {company?.company_name || member?.name || "N/A"}
              </span>
            </p>
          </div>
          <Button shape="circle" size="sm" icon={<TbX />} onClick={onClose} />
        </div>

        {/* --- Dialog Body --- */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {/* Main Content (2/3 width) */}
          <div className="flex flex-col gap-6">
            <Card bodyClass="p-4">
              <h6 className="font-semibold mb-4 border-b dark:border-gray-700 pb-3">
                Document Information
              </h6>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <InfoItem
                  icon={<TbFileCertificate size={20} />}
                  label="Document Type"
                  value={docTypeInfo?.name}
                />
                <InfoItem
                  icon={<TbFileCheck size={20} />}
                  label="Company Document"
                  value={company_document}
                />
                <InfoItem
                  icon={<TbFileExcel size={20} />}
                  label="Invoice Number"
                  value={invoice_number}
                />
                {form && (
                  <InfoItem
                    icon={<TbChecklist size={20} />}
                    label="Token Form"
                    value={form.form_name}
                  />
                )}
                <InfoItem
                  icon={<TbCalendarClock size={20} />}
                  label="Created On"
                  value={dayjs(created_at).format("DD MMM YYYY, hh:mm A")}
                />
                <InfoItem
                  icon={<TbUser size={20} />}
                  label="Created By"
                  value={created_by_user?.name}
                />
              </div>
            </Card>

            {/* --- NEW: Filled Form Data Viewer --- */}
            {form?.id && (
              <Card bodyClass="p-4">
                {isFormLoading ? (
                  <div className="text-center p-8">
                    <Spinner />
                    <p className="mt-2 text-sm text-gray-500">Loading form data...</p>
                  </div>
                ) : formStructure && filledData ? (
                  <FilledFormViewer formStructure={formStructure} filledData={filledData} />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-sm text-gray-500">No filled form data found for this document.</p>
                  </div>
                )}
              </Card>
            )}

          </div>
        </div>
        {/* --- Dialog Footer --- */}
        <div className="flex justify-between items-center p-4 border-t dark:border-gray-700">
          <Button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
          >
            Close
          </Button>
          {canVerify && form?.id && (
            <Button
              variant="solid"
              color="emerald"
              icon={<TbCircleCheck />}
              onClick={handleVerify}
              loading={isVerifying}
            >
              {isVerifying ? 'Verifying...' : 'Verify & Approve'}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};


const AddEditDocumentDrawer = ({ isOpen, onClose, editingId, prefilledLeadNumber }: any) => {
  const dispatch = useAppDispatch();
  const title = editingId ? "Edit Document" : "Add New Document";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedCompanyStatus, setSelectedCompanyStatus] = useState<{
    kyc: boolean;
    enable_billing: boolean;
  } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<AddEditDocumentFormData>({
    resolver: zodResolver(addEditDocumentSchema),
    mode: "onChange",
    defaultValues: {
      company_document: undefined,
      document_type: undefined,
      document_number: "",
      invoice_number: "",
      form_id: undefined,
      employee_id: undefined,
      member_id: undefined,
      company_id: undefined,
    },
  });

  const {
    DocumentListData = [],
    formsData: tokenForm = [],
    EmployeesList = [],
    AllCompanyData = [],
    getfromIDcompanymemberData = [],
  } = useSelector(masterSelector);

  const DocumentListDataOptions =
    DocumentListData.length > 0
      ? DocumentListData.map((p: any) => ({
        value: p.id,
        label: p.name,
      }))
      : [];

  const tokenFormDataOptions =
    tokenForm.length > 0
      ? tokenForm?.map((p: any) => ({
        value: p.id,
        label: p.form_title,
      }))
      : [];

  const EmployyDataOptions =
    EmployeesList?.data?.map((p: any) => ({
      value: p.id,
      label: p.name,
    }));

  const AllCompanyDataOptions =
    AllCompanyData?.map((p: any) => ({
      value: String(p.id),
      label: p.company_name,
    }));

  const companyMemberOptions = useMemo(
    () =>
      getfromIDcompanymemberData?.map((p: any) => ({
        value: p.id,
        label: p.name,
      })) || [],
    [getfromIDcompanymemberData]
  );

  useEffect(() => {
    dispatch(getDocumentListAction());
    dispatch(getFormBuilderAction());
    dispatch(getEmployeesListingAction());
    dispatch(getAllCompany());
  }, [dispatch]);

  useEffect(() => {
    if (isOpen && editingId) {
      setIsLoadingData(true);
      dispatch(getbyIDaccountdocAction(editingId))
        .unwrap()
        .then((data) => {
          const companyId = data?.data?.company_id;
          const formData = {
            company_document: data?.data?.company_document,
            document_type: parseInt(data?.data?.document_type),
            document_number: data?.data?.document_number,
            invoice_number: data?.data?.invoice_number,
            form_id: data?.data?.form_id,
            employee_id: data?.data?.employee_id,
            member_id: data?.data?.member_id,
            company_id: companyId ? String(companyId) : undefined,
          };
          reset(formData);

          if (companyId) {
            dispatch(getfromIDcompanymemberAction(companyId));
            const company = AllCompanyData.find(
              (c: any) => String(c.id) === String(companyId)
            );
            if (company) {
              setSelectedCompanyStatus({
                kyc: company.kyc_verified,
                enable_billing: company.enable_billing,
              });
            }
          } else {
            setSelectedCompanyStatus(null);
          }
        })
        .catch((err: any) => {
          toast.push(
            <Notification
              type="danger"
              title="Fetch Error"
              children={err?.message || "Could not fetch document details."}
            />
          );
          onClose();
        })
        .finally(() => {
          setIsLoadingData(false);
        });
    } else if (isOpen && !editingId) {
      reset({
        lead_number: prefilledLeadNumber || "",
        company_document: undefined,
        document_type: undefined,
        document_number: "",
        invoice_number: "",
        form_id: undefined,
        employee_id: undefined,
        member_id: undefined,
        company_id: undefined,
      });
      setSelectedCompanyStatus(null);
    }
  }, [isOpen, editingId, dispatch, reset, AllCompanyData, prefilledLeadNumber]);

  const onSave = async (data: AddEditDocumentFormData) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await dispatch(
          editaccountdocAction({ id: editingId, ...data })
        ).unwrap();
        toast.push(<Notification type="success" title="Document Updated" />);
      } else {
        await dispatch(addaccountdocAction(data)).unwrap();
        toast.push(<Notification type="success" title="Document Added" />);
      }
      dispatch(getaccountdocAction()); // Refresh the main table
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title={editingId ? "Update Failed" : "Add Failed"}
          children={error?.message || "An unknown error occurred."}
        />
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      title={title}
      width={520}
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      footer={
        <div className="text-right w-full">
          <Button
            size="sm"
            className="mr-2"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="solid"
            form="addEditDocumentForm"
            type="submit"
            loading={isSubmitting || isLoadingData}
            disabled={!isValid || isSubmitting || isLoadingData}
          >
            Save
          </Button>
        </div>
      }
    >
      {isLoadingData ? (
        <div className="p-4 text-center">Loading...</div>
      ) : (
        <UiForm id="addEditDocumentForm" onSubmit={handleSubmit(onSave)}>
          <UiFormItem
            label="Company Document"
            invalid={!!errors.company_document}
            errorMessage={errors.company_document?.message}
          >
            <Controller
              control={control}
              name="company_document"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Company Document"
                  options={[
                    { label: "Aazovo", value: "Aazovo" },
                    { label: "OMC", value: "OMC" },
                  ]}
                  value={[
                    { label: "Aazovo", value: "Aazovo" },
                    { label: "OMC", value: "OMC" },
                  ].find((o) => o.value === field.value)}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
          </UiFormItem>
          <UiFormItem
            label="Company"
            invalid={!!errors.company_id}
            errorMessage={errors.company_id?.message}
          >
            <Controller
              control={control}
              name="company_id"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Company"
                  options={AllCompanyDataOptions}
                  value={AllCompanyDataOptions?.find(
                    (o) => o.value === field.value
                  )}
                  onChange={(opt: any) => {
                    field.onChange(opt?.value);
                    if (opt?.value) {
                      dispatch(getfromIDcompanymemberAction(opt.value));
                      const company = AllCompanyData.find(
                        (c: any) => String(c.id) === opt.value
                      );
                      if (company) {
                        setSelectedCompanyStatus({
                          kyc: company.kyc_verified,
                          enable_billing: company.enable_billing,
                        });
                      }
                    } else {
                      setSelectedCompanyStatus(null);
                    }
                    setValue("member_id", undefined, { shouldValidate: true });
                  }}
                />
              )}
            />
          </UiFormItem>

          {selectedCompanyStatus &&
            (!selectedCompanyStatus.kyc ||
              !selectedCompanyStatus.enable_billing) && (
              <Notification type="warning" className="my-4">
                <div className="font-semibold mb-1">Company Status Alert</div>
                {!selectedCompanyStatus.kyc && (
                  <p className="text-sm">- Company KYC is pending.</p>
                )}
                {!selectedCompanyStatus.enable_billing && (
                  <p className="text-sm">- Company is not enable billing.</p>
                )}
              </Notification>
            )}

          <UiFormItem
            label="Document Type"
            invalid={!!errors.document_type}
            errorMessage={errors.document_type?.message}
          >
            <Controller
              control={control}
              name="document_type"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Document Type"
                  options={DocumentListDataOptions}
                  value={DocumentListDataOptions?.find(
                    (o) => o.value === field.value
                  )}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
          </UiFormItem>
          <div className="md:grid grid-cols-2 gap-3">
            <UiFormItem
              label="Document Number"
              invalid={!!errors.document_number}
              errorMessage={errors.document_number?.message}
            >
              <Controller
                control={control}
                name="document_number"
                render={({ field }) => (
                  <Input
                    type="text"
                    placeholder="Enter Document Number"
                    {...field}
                  />
                )}
              />
            </UiFormItem>
            <UiFormItem
              label="Invoice Number"
              invalid={!!errors.invoice_number}
              errorMessage={errors.invoice_number?.message}
            >
              <Controller
                control={control}
                name="invoice_number"
                render={({ field }) => (
                  <Input
                    type="text"
                    placeholder="Enter Invoice Number"
                    {...field}
                  />
                )}
              />
            </UiFormItem>
          </div>
          <UiFormItem
            label="Token Form"
            invalid={!!errors.form_id}
            errorMessage={errors.form_id?.message}
          >
            <Controller
              control={control}
              name="form_id"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Form Type"
                  options={tokenFormDataOptions}
                  value={tokenFormDataOptions?.find(
                    (o) => o.value === field.value
                  )}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
          </UiFormItem>
          <UiFormItem
            label="Employee"
            invalid={!!errors.employee_id}
            errorMessage={errors.employee_id?.message}
          >
            <Controller
              control={control}
              name="employee_id"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Employee"
                  options={EmployyDataOptions}
                  value={EmployyDataOptions?.find(
                    (o) => o.value === field.value
                  )}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
          </UiFormItem>
          <UiFormItem
            label="Member"
            invalid={!!errors.member_id}
            errorMessage={errors.member_id?.message}
          >
            <Controller
              control={control}
              name="member_id"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Member"
                  options={companyMemberOptions}
                  value={companyMemberOptions?.find(
                    (o) => o.value === field.value
                  )}
                  onChange={(opt: any) => field.onChange(opt?.value)}
                />
              )}
            />
          </UiFormItem>
        </UiForm>
      )}
    </Drawer>
  );
};

// --- START: MODALS & ACTIONS ---

const SendEmailAction = ({
  document,
  onClose,
}: {
  document: any;
  onClose: () => void;
}) => {
  useEffect(() => {
    const email =
      document?.company?.primary_email_id || document?.member?.email;
    if (!email) {
      toast.push(
        <Notification type="warning" title="Missing Email" duration={4000}>
          No primary email found for the associated company or member.
        </Notification>
      );
      onClose();
      return;
    }
    const subject = `Regarding Document: ${document.document_number}`;
    const body = `Hello,\n\nThis is regarding your document (Ref: ${document.document_number}).`;
    window.open(
      `mailto:${email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`
    );
    onClose();
  }, [document, onClose]);

  return null;
};

const SendWhatsAppAction = ({
  document,
  onClose,
}: {
  document: any;
  onClose: () => void;
}) => {
  useEffect(() => {
    const phone =
      document?.company?.primary_contact_number?.replace(/\D/g, "") ||
      document?.member?.number?.replace(/\D/g, "");
    const countryCode =
      document?.company?.primary_contact_number_code?.replace(/\D/g, "") ||
      document?.member?.customer_code?.replace(/\D/g, "");

    if (!phone || !countryCode) {
      toast.push(
        <Notification type="warning" title="Missing Number" duration={4000}>
          Primary contact number is not available for the associated company or
          member.
        </Notification>
      );
      onClose();
      return;
    }
    const fullPhoneNumber = `${countryCode}${phone}`;
    const message = `Hello,\n\nThis is regarding your document (Ref: ${document.document_number}).`;
    window.open(
      `https://wa.me/${fullPhoneNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
    onClose();
  }, [document, onClose]);

  return null;
};

const AssignTaskDialog = ({
  document,
  onClose,
  userOptions,
}: {
  document: any;
  onClose: () => void;
  userOptions: SelectOption[];
}) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskValidationSchema),
    defaultValues: {
      task_title: `Follow up on document ${document.document_number}`,
      assign_to: [],
      priority: "Medium",
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
      module_id: String(document.id),
      module_name: "AccountDocument",
    };

    try {
      await dispatch(addTaskAction(payload)).unwrap();
      toast.push(<Notification type="success" title="Task Assigned!" />);
      onClose();
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Failed to Assign Task"
          children={error?.message}
        />
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose}>
      <h5 className="mb-4">Assign Task for Doc: {document.document_number}</h5>
      <UiForm onSubmit={handleSubmit(onAssignTask)}>
        <UiFormItem
          label="Task Title"
          invalid={!!errors.task_title}
          errorMessage={errors.task_title?.message}
        >
          <Controller
            name="task_title"
            control={control}
            render={({ field }) => <Input {...field} autoFocus />}
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
                  options={userOptions}
                  value={userOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) =>
                    field.onChange(opts?.map((o) => o.value) || [])
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
                  options={taskPriorityOptions}
                  value={taskPriorityOptions.find(
                    (p) => p.value === field.value
                  )}
                  onChange={(opt) => field.onChange(opt?.value)}
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
                placeholder="Select date"
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
          <Button type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="solid"
            type="submit"
            loading={isLoading}
            disabled={!isValid || isLoading}
            className="ml-2"
          >
            Assign Task
          </Button>
        </div>
      </UiForm>
    </Dialog>
  );
};

const AddActivityDialog = ({
  document,
  onClose,
  user,
}: {
  document: any;
  onClose: () => void;
  user: any;
}) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      item: `Follow up on doc ${document.document_number}`,
      notes: "",
    },
    mode: "onChange",
  });

  const onAddActivity = async (data: ActivityFormData) => {
    if (!user?.id) {
      toast.push(
        <Notification
          type="danger"
          title="User not found. Please log in again."
        />
      );
      return;
    }
    setIsLoading(true);
    const payload = {
      item: data.item,
      notes: data.notes || "",
      module_id: String(document.id),
      module_name: "AccountDocument",
      user_id: user.id,
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
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
      <h5 className="mb-4">
        Add Activity Log for Doc "{document.document_number}"
      </h5>
      <UiForm onSubmit={handleSubmit(onAddActivity)}>
        <UiFormItem
          label="Activity"
          invalid={!!errors.item}
          errorMessage={errors.item?.message}
        >
          <Controller
            name="item"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g., Followed up with member" />
            )}
          />
        </UiFormItem>
        <UiFormItem
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
            icon={<TbCheck />}
          >
            Save Activity
          </Button>
        </div>
      </UiForm>
    </Dialog>
  );
};

const AccountDocumentAlertModal = ({
  document,
  onClose,
}: {
  document: any;
  onClose: () => void;
}) => {
  const [alerts, setAlerts] = useState<AlertNote[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<AlertNoteFormData>({
    resolver: zodResolver(alertNoteSchema),
    defaultValues: { newNote: "" },
    mode: "onChange",
  });

  const stringToColor = (str: string) => {
    let hash = 0;
    if (!str) return "#cccccc";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }
    return color;
  };

  const fetchAlerts = useCallback(() => {
    setIsFetching(true);
    dispatch(
      getAlertsAction({
        module_id: document.id,
        module_name: "AccountDocument",
      })
    )
      .unwrap()
      .then((data) => setAlerts(data.data || []))
      .catch(() =>
        toast.push(<Notification type="danger" title="Failed to fetch alerts." />)
      )
      .finally(() => setIsFetching(false));
  }, [document.id, dispatch]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const onAddNote = async (data: AlertNoteFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(
        addAllAlertsAction({
          note: data.newNote,
          module_id: document.id,
          module_name: "AccountDocument",
        })
      ).unwrap();
      toast.push(<Notification type="success" title="Alert Note Added" />);
      reset({ newNote: "" });
      fetchAlerts(); // Refresh the list
    } catch (error: any) {
      toast.push(
        <Notification
          type="danger"
          title="Failed to Add Note"
          children={error?.message}
        />
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      onRequestClose={onClose}
      width={1200}
      contentClassName="p-0 flex flex-col max-h-[90vh] h-full bg-gray-50 dark:bg-gray-900 rounded-lg"
    >
      <header className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TbBellRinging className="text-2xl text-white" />
            <h5 className="mb-0 text-white font-bold text-base sm:text-xl">
              Alerts for: {document.document_number}
            </h5>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1"
          >
            <TbX className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="flex-grow min-h-0 p-4 sm:p-6 lg:grid lg:grid-cols-2 lg:gap-x-8 overflow-hidden">
        <div className="relative flex flex-col h-full overflow-hidden">
          <h6 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">
            Activity Timeline
          </h6>
          <div className="flex-grow overflow-y-auto lg:pr-4 lg:-mr-4">
            {isFetching ? (
              <div className="flex justify-center items-center h-full">
                <Spinner size="lg" />
              </div>
            ) : alerts.length > 0 ? (
              <div className="space-y-8">
                {alerts.map((alert, index) => {
                  const userName = alert?.created_by_user?.name || "N/A";
                  const userInitial = userName.charAt(0).toUpperCase();
                  return (
                    <div
                      key={`${alert.id}-${index}`}
                      className="relative flex items-start gap-4 pl-12"
                    >
                      <div className="absolute left-0 top-0 z-10 flex flex-col items-center h-full">
                        <Avatar
                          shape="circle"
                          size="md"
                          style={{ backgroundColor: stringToColor(userName) }}
                        >
                          {userInitial}
                        </Avatar>
                        {index < alerts.length - 1 && (
                          <div className="mt-2 flex-grow w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                        )}
                      </div>
                      <Card className="flex-grow shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="p-4">
                          <header className="flex justify-between items-center mb-2">
                            <p className="font-bold text-gray-800 dark:text-gray-100">
                              {userName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <TbCalendarEvent />
                              <span>
                                {dayjs(alert.created_at).format(
                                  "DD MMM YYYY, h:mm A"
                                )}
                              </span>
                            </div>
                          </header>
                          <div
                            className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300"
                            dangerouslySetInnerHTML={{ __html: alert.note }}
                          />
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-center py-10 bg-white dark:bg-gray-800/50 rounded-lg">
                <TbNotesOff className="text-6xl text-gray-300 dark:text-gray-500 mb-4" />
                <p className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                  No Alerts Yet
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Be the first to add a note.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col mt-8 lg:mt-0 h-full">
          <Card className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
            <header className="p-4 bg-gray-100 dark:bg-gray-700/50 rounded-t-lg border-b dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <TbPencilPlus className="text-xl text-red-600 dark:text-red-400" />
                <h6 className="font-semibold text-gray-800 dark:text-gray-200 mb-0">
                  Add New Alert Note
                </h6>
              </div>
            </header>
            <UiForm
              onSubmit={handleSubmit(onAddNote)}
              className="p-4 flex-grow flex flex-col"
            >
              <UiFormItem
                invalid={!!errors.newNote}
                errorMessage={errors.newNote?.message}
                className="flex-grow flex flex-col"
              >
                <Controller
                  name="newNote"
                  control={control}
                  render={({ field }) => (
                    <div className="border dark:border-gray-700 rounded-md flex-grow flex flex-col">
                      <RichTextEditor
                        value={field.value}
                        onChange={(val) => field.onChange(val.html)}
                        className="flex-grow min-h-[150px] sm:min-h-[200px]"
                      />
                    </div>
                  )}
                />
              </UiFormItem>
              <footer className="flex items-center justify-end mt-4 pt-4 border-t dark:border-gray-700 flex-shrink-0">
                <Button
                  type="button"
                  className="mr-3"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="red"
                  type="submit"
                  loading={isSubmitting}
                  disabled={!isValid || isSubmitting}
                >
                  Submit Note
                </Button>
              </footer>
            </UiForm>
          </Card>
        </div>
      </main>
    </Dialog>
  );
};

const DownloadDocumentsDialog = ({
  document,
  onClose,
}: {
  document: any;
  onClose: () => void;
}) => {
  const documents = useMemo(() => {
    const allDocs: { name: string; url: string }[] = [];
    if (Array.isArray(document.document_files)) {
      document.document_files.forEach((file: any) => {
        if (file.name && file.url) {
          allDocs.push({ name: file.name, url: file.url });
        }
      });
    }
    if (document.file_path) {
      allDocs.push({ name: "Primary Document", url: document.file_path });
    }
    return allDocs;
  }, [document]);

  return (
    <Dialog isOpen={true} onClose={onClose} width={600}>
      <h5 className="mb-4">
        Download Documents for {document.document_number}
      </h5>
      <div className="max-h-96 overflow-y-auto">
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <a
                key={index}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <TbFileDescription className="text-lg text-gray-500" />
                  {doc.name}
                </span>
                <TbCloudDownload className="text-lg text-blue-500" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">
            No documents available for download.
          </p>
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

const AccountDocumentModals = ({
  modalState,
  onClose,
  onActionSuccess, // Pass this prop down
  getAllUserDataOptions,
  user,
}: any) => {
  const { type, data: document, isOpen } = modalState;
  if (!isOpen || !document) return null;
  switch (type) {
    case "notification":
      return (
        <AddNotificationDialog
          document={document}
          onClose={onClose}
          getAllUserDataOptions={getAllUserDataOptions}
        />
      );
    case "schedule":
      return <AddScheduleDialog document={document} onClose={onClose} />;
    case "view":
      // Pass the onActionSuccess callback to the View dialog
      return <ViewDocumentDialog document={document} onClose={onClose} onActionSuccess={onActionSuccess} />;
    case "email":
      return <SendEmailAction document={document} onClose={onClose} />;
    case "whatsapp":
      return <SendWhatsAppAction document={document} onClose={onClose} />;
    case "task":
      return (
        <AssignTaskDialog
          document={document}
          onClose={onClose}
          userOptions={getAllUserDataOptions}
        />
      );
    case "alert":
      return <AccountDocumentAlertModal document={document} onClose={onClose} />;
    case "activity":
      return (
        <AddActivityDialog document={document} onClose={onClose} user={user} />
      );
    case "document":
      return <DownloadDocumentsDialog document={document} onClose={onClose} />;
    default:
      return null;
  }
};

const AccountDocumentSearch = React.forwardRef<any, any>((props, ref) => (
  <DebouceInput {...props} ref={ref} />
));
AccountDocumentSearch.displayName = "AccountDocumentSearch";

const AccountDocumentTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
  columns,
  filteredColumns,
  setFilteredColumns,
  activeFilterCount,
  searchInputRef,
}: any) => {
  const isColumnVisible = (colId: string) =>
    filteredColumns.some((c: any) => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      const originalColumn = columns.find(
        (c: any) => (c.id || c.accessorKey) === colId
      );
      if (originalColumn) {
        setFilteredColumns((prev: any) => {
          const newCols = [...prev, originalColumn];
          newCols.sort((a, b) => {
            const indexA = columns.findIndex(
              (c: any) => (c.id || c.accessorKey) === (a.id || a.accessorKey)
            );
            const indexB = columns.findIndex(
              (c: any) => (c.id || c.accessorKey) === (b.id || b.accessorKey)
            );
            return indexA - indexB;
          });
          return newCols;
        });
      }
    } else {
      setFilteredColumns((prev: any) =>
        prev.filter((c: any) => (c.id || c.accessorKey) !== colId)
      );
    }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <AccountDocumentSearch
          ref={searchInputRef}
          onChange={onSearchChange}
          placeholder="Quick Search..."
        />
      </div>
      <div className="flex gap-1">
        <Dropdown
          renderTitle={<Button icon={<TbColumns />} />}
          placement="bottom-end"
        >
          <div className="flex flex-col p-2">
            <div className="font-semibold mb-1 border-b pb-1">
              Toggle Columns
            </div>
            {columns.map((col: any) => {
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
        <Button icon={<TbReload />} onClick={onClearFilters}></Button>
        <Button icon={<TbFilter />} onClick={onFilter}>
          Filter{" "}
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button
          menuName="account_documents" isExport={true}
          icon={<TbCloudUpload />} onClick={onExport}>
          Export
        </Button>
      </div>
    </div>
  );
};

const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
}: any) => {
  const allFilters = [
    ...(filterData.filterStatus || []).map((f: SelectOption) => ({
      key: "filterStatus",
      label: `Status: ${f.label}`,
      value: f,
    })),
    ...(filterData.doc_type || []).map((f: SelectOption) => ({
      key: "doc_type",
      label: `Doc Type: ${f.label}`,
      value: f,
    })),
    ...(filterData.comp_doc || []).map((f: SelectOption) => ({
      key: "comp_doc",
      label: `Company Doc: ${f.label}`,
      value: f,
    })),
  ];

  if (allFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {allFilters.map((filter) => (
        <Tag
          key={`${filter.key}-${filter.value.value}`}
          prefix
          className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500"
        >
          {filter.label}{" "}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
            onClick={() => onRemoveFilter(filter.key, filter.value)}
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

const AccountDocumentTable = (props: any) => <DataTable {...props} />;

const AccountDocumentSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: any) => {
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
        <p>Sure?</p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Account Document Component ---
const AccountDocument = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { getAllUserData = [], getaccountdoc } = useSelector(
    masterSelector,
    shallowEqual
  );

  const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prefilledLeadNumber, setPrefilledLeadNumber] = useState<string | null>(null);

  const searchInputRef = useRef<any>(null);

  const filterForm = useForm<FilterFormData>();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] =
    useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<AccountDocumentListItem | null>(null);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "createdAt" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<
    AccountDocumentListItem[]
  >([]);
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: null,
    data: null,
  });
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] =
    useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [activeShortcut, setActiveShortcut] = useState("Total");

  const [isPendingLeadsModalOpen, setIsPendingLeadsModalOpen] =
    useState(false);

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  useEffect(() => {
    dispatch(getAllUsersAction());
    dispatch(getaccountdocAction());
    try {
      const { useEncryptApplicationStorage } = config;
      setUserData(
        encryptStorage.getItem("UserData", !useEncryptApplicationStorage)
      );
    } catch (error) {
      console.error("Error getting UserData:", error);
    }
  }, [dispatch]);

  // Handler to refresh table data, passed to modals
  const handleActionSuccess = useCallback(() => {
    dispatch(getaccountdocAction());
  }, [dispatch]);

  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );

  const handleShortcutClick = (shortcut: string) => {
    setActiveShortcut(shortcut);
    setFilterCriteria({});
    filterForm.reset({});
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    handleSetTableData({ query: "", pageIndex: 1 });
  };

  const onClearFilters = () => {
    handleShortcutClick("Total");
  };

  const getAllUserDataOptions = useMemo(
    () =>
      Array.isArray(getAllUserData)
        ? getAllUserData.map((b: any) => ({
          value: b.id,
          label: `(${b.employee_id}) - ${b.name || "N/A"}`,
        }))
        : [],
    [getAllUserData]
  );
  const handleOpenModal = useCallback(
    (type: ModalType, itemData: AccountDocumentListItem) => {
      const typesRequiringFullData: ModalType[] = [
        "view",
        "email",
        "whatsapp",
        "task",
        "alert",
        "activity",
        "document",
      ];

      if (typesRequiringFullData.includes(type)) {
        dispatch(getbyIDaccountdocAction(itemData.id))
          .unwrap()
          .then((result) => {
            setModalState({ isOpen: true, type, data: result.data });
          })
          .catch((err) => {
            toast.push(
              <Notification
                title="Error"
                type="danger"
                children={err?.message || "Could not fetch document details."}
              />
            );
          });
      } else {
        setModalState({ isOpen: true, type, data: itemData });
      }
    },
    [dispatch]
  );
  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, type: null, data: null });
  }, []);

  const handleOpenAddDrawer = (leadNumber?: string) => {
    setEditingId(null);
    setPrefilledLeadNumber(leadNumber || null);
    setIsAddEditDrawerOpen(true);
  };


  const handleOpenEditDrawer = (rowData: AccountDocumentListItem) => {
    setEditingId(rowData.id);
    setIsAddEditDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsAddEditDrawerOpen(false);
    setEditingId(null);
    setPrefilledLeadNumber(null);
  };

  const filterOptions = useMemo(() => {
    const rawData = getaccountdoc?.data || [];
    const uniqueDocTypes = new Set<string>();
    const uniqueCompanyDocs = new Set<string>();

    rawData.forEach((item: any) => {
      const formType = item.form?.form_name;
      const companyDoc = item.company_document;

      if (formType) {
        uniqueDocTypes.add(formType);
      }
      if (companyDoc) {
        uniqueCompanyDocs.add(companyDoc);
      }
    });

    const docTypeOptions = Array.from(uniqueDocTypes)
      .sort()
      .map((doc) => ({ label: doc, value: doc }));

    const companyDocOptions = Array.from(uniqueCompanyDocs)
      .sort()
      .map((doc) => ({ label: doc, value: doc }));

    const statusOptions = Object.keys(accountDocumentStatusColor).map((s) => ({
      label: s.charAt(0).toUpperCase() + s.slice(1).replace("_", " "),
      value: s,
    }));

    return {
      docTypeOptions,
      companyDocOptions,
      statusOptions,
    };
  }, [getaccountdoc]);

  const { pageData, total, allFilteredAndSortedData } = useMemo((): {
    pageData: AccountDocumentListItem[];
    total: number;
    allFilteredAndSortedData: AccountDocumentListItem[];
  } => {
    const rawData = getaccountdoc?.data || [];

    const mappedData: AccountDocumentListItem[] = rawData.map((item: any) => ({
      id: String(item.id),
      status: (item.status?.toLowerCase() ||
        "pending") as AccountDocumentStatus,
      leadNumber: item.lead_id ? `LD-${item.lead_id}` : (item.document_number?.startsWith("LD-") ? item.document_number : "N/A"),
      enquiryType: item.member?.interested_in?.toLowerCase().includes("sell")
        ? "sales"
        : "purchase",
      memberName: item.member?.name || "Unknown Member",
      companyId: item.company_id ? String(item.company_id) : null,
      companyName:
        item.company?.company_name ||
        item.member?.company_actual ||
        item.member?.company_temp ||
        item.member?.name ||
        "Unknown Company",
      userId:
        item.created_by_user?.employee_id ||
        String(item.created_by_user?.id) ||
        null,
      userName: item.created_by_user?.name || "System",
      companyDocumentType: item.company_document || "N/A",
      documentType: String(item.document_type),
      documentNumber: item.document_number || "N/A",
      invoiceNumber: item.invoice_number || "N/A",
      formType: item.form?.form_name || "N/A",
      formId: item.form?.id || "N/A",
      createdAt: item.created_at,
    }));

    let processedData: AccountDocumentListItem[] = cloneDeep(mappedData);

    if (activeShortcut && activeShortcut !== "Total") {
      switch (activeShortcut) {
        case "Today":
          processedData = processedData.filter((item) =>
            dayjs(item.createdAt).isSame(dayjs(), "day")
          );
          break;
        case "Active":
          processedData = processedData.filter(
            (item) => item.status === "active"
          );
          break;
        case "Purchase":
          processedData = processedData.filter(
            (item) => item.enquiryType === "purchase"
          );
          break;
        case "Sales":
          processedData = processedData.filter(
            (item) => item.enquiryType === "sales"
          );
          break;
        case "Completed":
          processedData = processedData.filter(
            (item) => item.status === "completed"
          );
          break;
        case "Verified":
          processedData = processedData.filter(
            (item) => item.status === "approved"
          );
          break;
        case "Pending":
          processedData = processedData.filter(
            (item) => item.status === "pending"
          );
          break;
        case "Aazovo Docs":
          processedData = processedData.filter(
            (item) => item.companyDocumentType === "Aazovo"
          );
          break;
        case "OMC Docs":
          processedData = processedData.filter(
            (item) => item.companyDocumentType === "OMC"
          );
          break;
      }
    } else {
      if (tableData.query) {
        const query = tableData.query.toLowerCase().trim();
        processedData = processedData.filter((item) =>
          Object.values(item).some((val) =>
            String(val).toLowerCase().includes(query)
          )
        );
      }

      if (filterCriteria.filterStatus?.length) {
        const selectedStatuses = new Set(
          filterCriteria.filterStatus.map((s: SelectOption) => s.value)
        );
        processedData = processedData.filter((item) =>
          selectedStatuses.has(item.status)
        );
      }
      if (filterCriteria.comp_doc?.length) {
        const selectedCompDocs = new Set(
          filterCriteria.comp_doc.map((s: SelectOption) => s.value)
        );
        processedData = processedData.filter((item) =>
          selectedCompDocs.has(item.companyDocumentType)
        );
      }
      if (filterCriteria.doc_type?.length) {
        const selectedDocTypes = new Set(
          filterCriteria.doc_type.map((s: SelectOption) => s.value)
        );
        processedData = processedData.filter((item) =>
          selectedDocTypes.has(item.formType)
        );
      }
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof AccountDocumentListItem] as any;
        let bVal = b[key as keyof AccountDocumentListItem] as any;
        if (key === "createdAt" || key === "updatedAt") {
          return order === "asc"
            ? dayjs(aVal).valueOf() - dayjs(bVal).valueOf()
            : dayjs(bVal).valueOf() - dayjs(aVal).valueOf();
        }
        if (typeof aVal === "number") {
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
  }, [getaccountdoc, tableData, filterCriteria, activeShortcut]);

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
    const moduleName = "Account_Documents";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `${moduleName}_export_${timestamp}.csv`;
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
      exportToCsv(fileName, allFilteredAndSortedData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Failed to Submit Reason"
          type="danger"
          children={
            error.message || "An error occurred while submitting the reason."
          }
        />
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const handleDeleteClick = useCallback((item: AccountDocumentListItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
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
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setActiveShortcut(""); // Deactivate shortcuts when user types in search
      handleSetTableData({ query: query, pageIndex: 1 });
    },
    [handleSetTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: AccountDocumentListItem) =>
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
    (checked: boolean, currentRows: Row<AccountDocumentListItem>[]) => {
      const originals = currentRows.map((r) => r.original);
      if (checked)
        setSelectedItems((prev) => {
          const oldIds = new Set(prev.map((i) => i.id));
          return [...prev, ...originals.filter((o) => !oldIds.has(o.id))];
        });
      else {
        const currentIds = new Set(originals.map((o) => o.id));
        setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id)));
      }
    },
    []
  );
  const openFilterDrawer = useCallback(() => setIsFilterDrawerOpen(true), []);
  const closeFilterDrawer = useCallback(
    () => setIsFilterDrawerOpen(false),
    []
  );

  const onApplyFilters = (data: FilterFormData) => {
    setActiveShortcut(""); // Deactivate shortcuts when using advanced filters
    const newCriteria = Object.entries(data).reduce((acc, [key, value]) => {
      if (value && (!Array.isArray(value) || value.length > 0)) {
        acc[key as keyof FilterFormData] = value;
      }
      return acc;
    }, {} as FilterFormData);

    setFilterCriteria(newCriteria);
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };

  const handleRemoveFilter = (
    key: keyof FilterFormData,
    valueToRemove: SelectOption
  ) => {
    setFilterCriteria((prev) => {
      const newCriteria = cloneDeep(prev);
      const currentValues = newCriteria[key];

      if (currentValues) {
        const updatedValues = currentValues.filter(
          (item) => item.value !== valueToRemove.value
        );

        if (updatedValues.length > 0) {
          newCriteria[key] = updatedValues;
        } else {
          delete newCriteria[key];
        }
      }
      filterForm.reset(newCriteria);
      return newCriteria;
    });
  };

  const columns: ColumnDef<AccountDocumentListItem>[] = useMemo(
    () => [
      {
        header: "Status",
        accessorKey: "status",
        size: 120,
        cell: (props: CellContext<AccountDocumentListItem, any>) => (
          <Tag
            className={`${accountDocumentStatusColor[
              props.row.original
                .status as keyof typeof accountDocumentStatusColor
            ] || "bg-gray-100"
              } capitalize px-2 py-1 text-xs`}
          >
            {props.row.original.status.replace(/_/g, " ")}
          </Tag>
        ),
      },
      {
        header: "Document Type",
        accessorKey: "formType",
        size: 180,
        cell: (props) => {
          const { formType } = props.row.original;
          return (
            <span className="text-xs font-semibold">{formType || "N/A"}</span>
          );
        },
      },
      {
        header: "Deal Details",
        accessorKey: "companyName",
        size: 250,
        cell: (props: CellContext<AccountDocumentListItem, any>) => {
          const { leadNumber, companyId, companyName, userName } =
            props.row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div>
                <b>Lead:</b> {leadNumber}
              </div>
              <div>
                <b>Firm:</b> {companyName} {companyId ? `(${companyId})` : ""}
              </div>
              <div>
                <b>Sales Person:</b> {userName}
              </div>
            </div>
          );
        },
      },
      {
        header: "Document Details",
        accessorKey: "documentNumber",
        size: 220,
        cell: (props) => {
          const { documentNumber, invoiceNumber, formType, createdAt } =
            props.row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div>
                <b>Doc No: </b>
                <span>{documentNumber}</span>
              </div>
              <div>
                <b>Invoice No: </b>
                <span>{invoiceNumber}</span>
              </div>
              <div>
                <b>Form Type: </b>
                <span>{formType}</span>
              </div>
              <div>
                <b>Created: </b>
                <span>{dayjs(createdAt).format("DD MMM, YYYY")}</span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        size: 160,
        meta: { HeaderClass: "text-center" },
        cell: (props: CellContext<AccountDocumentListItem, any>) => (
          <AccountDocumentActionColumn
            onOpenModal={handleOpenModal}
            onEdit={() => handleOpenEditDrawer(props.row.original)}
            onView={() => handleOpenModal("view", props.row.original)}
            rowData={props.row.original}
          />
        ),
      },
    ],
    [handleOpenModal, handleOpenEditDrawer]
  );

  const [filteredColumns, setFilteredColumns] = useState<
    ColumnDef<AccountDocumentListItem>[]
  >(columns);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterStatus?.length) count++;
    if (filterCriteria.doc_type?.length) count++;
    if (filterCriteria.comp_doc?.length) count++;
    return count;
  }, [filterCriteria]);

  const counts = useMemo(() => {
    const apiCounts = getaccountdoc?.counts || {};
    return {
      total: apiCounts.total || 0,
      pending: apiCounts.pending || 0,
      completed: apiCounts.completed || 0,
      active: apiCounts.active || 0,
      aazovo: apiCounts.aazovo_docs || 0,
      omc: apiCounts.omc_docs || 0,
    };
  }, [getaccountdoc]);

  const shortcutButtons = [
    { label: "Total", key: "Total" },
    { label: "Today", key: "Today" },
    { label: "Active", key: "Active" },
    { label: "Purchase", key: "Purchase" },
    { label: "Sales", key: "Sales" },
    { label: "Completed", key: "Completed" },
    { label: "Verified", key: "Verified" },
    { label: "Pending", key: "Pending" },
    { label: "Aazovo Docs", key: "Aazovo Docs" },
    { label: "OMC Docs", key: "OMC Docs" },
  ];

  const cardClass =
    "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Account Document</h5>
            <div className="flex items-center gap-2">
              <Button
                variant="solid"
                color="blue-600"
                onClick={() => setIsPendingLeadsModalOpen(true)}
              >
                Done Leads
              </Button>
              <Button
                menuName="account_documents" isAdd={true}
                variant="solid"
                icon={<TbPlus />}
                className="px-5"
                onClick={() => handleOpenAddDrawer()}
              >
                Add New
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
            <Tooltip title="Click to show all documents">
              <div onClick={() => handleShortcutClick("Total")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(
                    cardClass,
                    "border-gray-200 dark:border-gray-600"
                  )}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-200">
                    <TbBrandGoogleDrive size={24} />
                  </div>
                  <div>
                    <h6 className="text-gray-700 dark:text-gray-100">
                      {counts.total}
                    </h6>
                    <span className="font-semibold text-xs">Total</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show pending documents">
              <div onClick={() => handleShortcutClick("Pending")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-orange-200")}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                    <TbFileAlert size={24} />
                  </div>
                  <div>
                    <h6 className="text-orange-500">{counts.pending}</h6>
                    <span className="font-semibold text-xs">Pending</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show completed documents">
              <div onClick={() => handleShortcutClick("Completed")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-green-300")}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                    <TbFileCertificate size={24} />
                  </div>
                  <div>
                    <h6 className="text-green-500">{counts.completed}</h6>
                    <span className="font-semibold text-xs">Completed</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show active documents">
              <div onClick={() => handleShortcutClick("Active")}>
                <Card
                  bodyClass={cardBodyClass}
                  className={classNames(cardClass, "border-blue-200")}
                >
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                    <TbTagStarred size={24} />
                  </div>
                  <div>
                    <h6 className="text-blue-500">{counts.active}</h6>
                    <span className="font-semibold text-xs">Active</span>
                  </div>
                </Card>
              </div>
            </Tooltip>
            <div className="cursor-default">
              <Card
                bodyClass={cardBodyClass}
                className={classNames(cardClass, "border-violet-300")}
              >
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                  <TbFileCheck size={24} />
                </div>
                <div>
                  <h6 className="text-violet-500">{counts.aazovo}</h6>
                  <span className="font-semibold text-xs">Aazovo Docs</span>
                </div>
              </Card>
            </div>
            <div className="cursor-default">
              <Card
                bodyClass={cardBodyClass}
                className={classNames(cardClass, "border-pink-200")}
              >
                <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                  <TbFileExcel size={24} />
                </div>
                <div>
                  <h6 className="text-pink-500">{counts.omc}</h6>
                  <span className="font-semibold text-xs">OMC Docs</span>
                </div>
              </Card>
            </div>
          </div>

          {/* --- START: Header Filter Shortcuts --- */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {shortcutButtons.map((s) => (
              <Button
                key={s.key}
                size="sm"
                variant={activeShortcut === s.key ? "solid" : "default"}
                onClick={() => handleShortcutClick(s.key)}
              >
                {s.label}
              </Button>
            ))}
          </div>
          {/* --- END: Header Filter Shortcuts --- */}

          <AccountDocumentTableTools
            searchInputRef={searchInputRef}
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
            columns={columns}
            filteredColumns={filteredColumns}
            setFilteredColumns={setFilteredColumns}
            activeFilterCount={activeFilterCount}
          />
          <ActiveFiltersDisplay
            filterData={filterCriteria}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={onClearFilters}
          />
          <div className="mt-4 flex-grow overflow-y-auto">
            <AccountDocumentTable
              selectable
              columns={filteredColumns}
              data={pageData}
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectedItems={selectedItems}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handlePageSizeChange}
              onSort={handleSort}
              onRowSelect={handleRowSelect}
              onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>
      <AccountDocumentSelectedFooter selectedItems={selectedItems} />
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete"
        onClose={() => setSingleDeleteConfirmOpen(false)}
        loading={isProcessingDelete}
        onCancel={() => setSingleDeleteConfirmOpen(false)}
      >
        <p>
          Delete <strong>{itemToDelete?.documentNumber}</strong>?
        </p>
      </ConfirmDialog>

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
              onClick={() => {
                onClearFilters();
                closeFilterDrawer();
              }}
            >
              Clear All
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterAccountDocumentForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <UiForm
          id="filterAccountDocumentForm"
          onSubmit={filterForm.handleSubmit(onApplyFilters)}
        >
          <UiFormItem label="Status">
            <Controller
              control={filterForm.control}
              name="filterStatus"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Status"
                  isMulti
                  options={filterOptions.statusOptions}
                />
              )}
            />
          </UiFormItem>
          <UiFormItem label="Document Type">
            <Controller
              control={filterForm.control}
              name="doc_type"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Document Type"
                  isMulti
                  options={filterOptions.docTypeOptions}
                />
              )}
            />
          </UiFormItem>
          <UiFormItem label="Company Document">
            <Controller
              control={filterForm.control}
              name="comp_doc"
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Company Document"
                  isMulti
                  options={filterOptions.companyDocOptions}
                />
              )}
            />
          </UiFormItem>
        </UiForm>
      </Drawer>

      <AddEditDocumentDrawer
        isOpen={isAddEditDrawerOpen}
        onClose={handleDrawerClose}
        editingId={editingId}
        prefilledLeadNumber={prefilledLeadNumber}
      />

      <AccountDocumentModals
        modalState={modalState}
        onClose={handleCloseModal}
        onActionSuccess={handleActionSuccess} // Pass callback here
        getAllUserDataOptions={getAllUserDataOptions}
        user={userData}
      />

      <PendingLeadsModal
        isOpen={isPendingLeadsModalOpen}
        onClose={() => setIsPendingLeadsModalOpen(false)}
        onActionSuccess={handleActionSuccess}
        handleOpenAddDrawer={handleOpenAddDrawer}
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
    </>
  );
};
export default AccountDocument;