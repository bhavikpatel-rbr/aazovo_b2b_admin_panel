import { zodResolver } from "@hookform/resolvers/zod";
import cloneDeep from "lodash/cloneDeep";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
// import { CSVLink } from "react-csv"; // CSVLink will no longer be used directly for the button
import { Controller, useForm } from "react-hook-form";
import { /* Form, // Removed Form from react-router-dom as UiForm is used */ useNavigate } from "react-router-dom";
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
  DatePicker,
  Drawer,
  Dropdown,
  FormItem, // Already imported from @/components/ui
  Input,    // Already imported from @/components/ui
  Form as UiForm, // Already imported as UiForm
  // FormItem as FormItem, // This is a duplicate, FormItem is fine
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
  TbBell,
  TbBrandWhatsapp,
  TbBuilding,
  TbCalendarEvent,
  TbChecks,
  TbClipboardText,
  TbCloudUpload,
  TbDotsVertical,
  TbDownload,
  TbEye,
  TbFilter,
  TbMail,
  TbMessageReport,
  TbNotebook,
  TbPencil,
  TbPlus,
  TbReceipt,
  TbReload,
  TbSearch,
  TbShare,
  TbTagStarred,
  TbTrash,
  TbUser,
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
  deleteAllInquiryAction,
  getDepartmentsAction,
  getInquiriesAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import { useSelector } from "react-redux";
import { BsThreeDotsVertical } from "react-icons/bs";

// --- Export Reason Schema ---
const exportReasonSchema = z.object({
    reason: z
        .string()
        .min(1, 'Reason for export is required.')
        .max(255, 'Reason cannot exceed 255 characters.'),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- API Inquiry Item Type ---
export type ApiInquiryItem = {
  id: number;
  name: string | null; // This seems to be contact_person_name
  email: string | null; // This seems to be contact_person_email
  mobile_no: string | null; // This seems to be contact_person_phone
  company_name: string | null;
  requirements: string | null; // Used as inquiry_description if inquiry_description is null
  inquiry_type: string | null;
  inquiry_subject: string | null;
  inquiry_description: string | null;
  inquiry_priority: string | null; // API might send 'priority'
  inquiry_status: string | null; // API might send 'status'
  assigned_to: number | string | null; // ID
  inquiry_date: string | null;
  response_date: string | null;
  resolution_date: string | null;
  follow_up_date: string | null;
  feedback_status: string | null;
  inquiry_resolution: string | null;
  inquiry_attachments: string | null; // JSON string of attachment URLs
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  inquiry_id: string; // The user-facing ID
  inquiry_department: string | null; // Department ID
  inquiry_from: string | null;
  inquiry_attachments_array: string[]; // Processed from inquiry_attachments
  assigned_to_name: string; // Name of the assignee
  inquiry_department_name: string; // Name of the department

  // Fields that might be present in API but not explicitly listed:
  contact_person_name?: string | null; // Explicitly for clarity, use `name` if this is the source
  contact_person_email?: string | null; // Explicitly for clarity, use `email` if this is the source
  contact_person?: string | null; // Explicitly for clarity, use `mobile_no` if this is the source
  priority?: string | null; // Alternative for inquiry_priority
  status?: string | null; // Alternative for inquiry_status (current progress status)
};


// --- InquiryItem Type for UI ---
export type InquiryItem = {
  id: string; // DB ID
  inquiry_id: string; // User-facing ID
  company_name: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
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
  filterRecordStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterInquiryType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterInquiryPriority: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterInquiryCurrentStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterAssignedTo: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDepartment: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterFeedbackStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterInquiryDate: z.array(z.date().nullable()).optional().default([null, null]),
  filterResponseDate: z.array(z.date().nullable()).optional().default([null, null]),
  filterResolutionDate: z.array(z.date().nullable()).optional().default([null, null]),
  filterFollowUpDate: z.array(z.date().nullable()).optional().default([null, null]),
});
type InquiryFilterFormData = z.infer<typeof inquiryFilterFormSchema>;

// --- Status Colors ---
const recordStatusColor: Record<InquiryItem["status"], string> = {
  active: "bg-green-200 text-green-600 dark:bg-green-700 dark:text-green-100",
  inactive: "bg-red-200 text-red-600 dark:bg-red-700 dark:text-red-100",
};
const priorityColors: Record<string, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "N/A": "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};
const inquiryCurrentStatusColors: Record<string, string> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Closed: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  "N/A": "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};

// --- Helper to format date for display ---
const FormattedDateDisplay = ({ dateString, label }: { dateString?: string; label?: string; }) => {
  if (!dateString || dateString === "N/A") return <div className="text-[10px] text-gray-500 dark:text-gray-400">{label && <b>{label}: </b>}N/A</div>;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return <div className="text-[10px] text-red-500">{label && <b>{label}: </b>}Invalid Date</div>;
    return <div className="text-[10px] text-gray-500 dark:text-gray-400">{label && <b>{label}: </b>}{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ /g, "/")}</div>;
  } catch (e) {
    return <div className="text-[10px] text-red-500">{label && <b>{label}: </b>}Error</div>;
  }
};

// --- Data Processing Function ---
const processApiDataToInquiryItems = (apiData: ApiInquiryItem[]): InquiryItem[] => {
  if (!Array.isArray(apiData)) return [];
  return apiData.map((apiItem) => ({
    id: String(apiItem.id),
    inquiry_id: apiItem.inquiry_id || `INQ-${apiItem.id}`,
    company_name: apiItem.company_name || "N/A",
    contact_person_name: apiItem.contact_person_name || apiItem.name || "N/A",
    contact_person_email: apiItem.contact_person_email || apiItem.email || "N/A",
    contact_person_phone: apiItem.contact_person || apiItem.mobile_no || "N/A",
    inquiry_type: apiItem.inquiry_type || "N/A",
    inquiry_subject: apiItem.inquiry_subject || "N/A",
    inquiry_description: apiItem.requirements || apiItem.inquiry_description || "N/A",
    inquiry_priority: apiItem.inquiry_priority || apiItem.priority || "N/A",
    inquiry_status: apiItem.inquiry_status || apiItem.status || "N/A", // This is current progress status
    assigned_to: apiItem.assigned_to_name || "Unassigned",
    department: apiItem.inquiry_department_name || undefined,
    inquiry_date: apiItem.inquiry_date || apiItem.created_at || "N/A",
    response_date: apiItem.response_date || "N/A",
    resolution_date: apiItem.resolution_date || "N/A",
    follow_up_date: apiItem.follow_up_date || "N/A",
    feedback_status: apiItem.feedback_status || "N/A",
    inquiry_resolution: apiItem.inquiry_resolution || "N/A",
    inquiry_attachments: apiItem.inquiry_attachments_array || [],
    status: apiItem.deleted_at ? "inactive" : "active", // This is record status (active/inactive)
  }));
};


// --- Inquiry List Store (Context API) ---
interface InquiryListStore {
  inquiryList: InquiryItem[];
  selectedInquiries: InquiryItem[];
  setSelectedInquiries: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
  departments: Department[];
  isLoading: boolean;
}
const InquiryListContext = React.createContext<InquiryListStore | undefined>(undefined);
const useInquiryList = (): InquiryListStore => {
  const context = useContext(InquiryListContext);
  if (!context) throw new Error("useInquiryList must be used within an InquiryListProvider");
  return context;
};
const InquiryListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { inquiryList1, departmentsData, status: masterLoadingStatus = "idle" } = useSelector(masterSelector);
  const [inquiryList, setInquiryList] = useState<InquiryItem[]>([]);
  const [selectedInquiries, setSelectedInquiries] = useState<InquiryItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dispatch(getDepartmentsAction());
    dispatch(getInquiriesAction());
  }, [dispatch]);

  useEffect(() => {
    setIsLoading(masterLoadingStatus === "loading"); 

    if (masterLoadingStatus === "succeeded" || masterLoadingStatus === "idle") { 
        const rawInquiries = inquiryList1?.data?.data;
        const inquiryDataFromApi = Array.isArray(rawInquiries) ? rawInquiries : (Array.isArray(inquiryList1) ? inquiryList1 : []);
        setInquiryList(processApiDataToInquiryItems(inquiryDataFromApi as ApiInquiryItem[]));

        const deptsFromApi = Array.isArray(departmentsData?.data) ? departmentsData.data : [];
        setDepartments(deptsFromApi as Department[]);
    } else if (masterLoadingStatus === "failed") {
        setInquiryList([]);
        setDepartments([]);
        toast.push(<Notification type="danger" title="Error">Failed to load data.</Notification>);
    }
}, [inquiryList1, departmentsData, masterLoadingStatus]);


  return (
    <InquiryListContext.Provider value={{ inquiryList, selectedInquiries, setSelectedInquiries, departments, isLoading }}>
      {children}
    </InquiryListContext.Provider>
  );
};

// --- InquiryListSearch Component ---
interface InquiryListSearchProps { onInputChange: (value: string) => void; }
const InquiryListSearch: React.FC<InquiryListSearchProps> = ({ onInputChange }) => (
  <DebouceInput placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
);

// --- InquiryListActionTools Component (Page Header) ---
const InquiryListActionTools = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button variant="solid" icon={<TbPlus className="text-lg" />} onClick={() => navigate("/business-entities/create-inquiry")}>Add New</Button>
    </div>
  );
};

// --- InquiryActionColumn Component (DataTable Actions) ---
const InquiryActionColumn = ({ rowData, onViewDetail, onDeleteItem, onEdit }: { rowData: InquiryItem; onViewDetail: (id: string) => void; onDeleteItem: (item: InquiryItem) => void; onEdit?: (id: string) => void; onShare?: (id: string) => void; onChangeItemStatus?: (id: string, currentStatus: InquiryItem["status"]) => void; }) => {
  console.log("rowData",rowData);
  
  const handleEdit = () => onEdit && onEdit(rowData.id);
  return (
    <div className="flex items-center justify-center gap-1">
      {onEdit && (<Tooltip title="Edit"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400" role="button" onClick={handleEdit}><TbPencil /></div></Tooltip>)}
      <Tooltip title="View"><div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" role="button" onClick={() => onViewDetail(rowData.id)}><TbEye /></div></Tooltip>
      <Tooltip title="More">
<Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
  {/* 1. Send Email */}
  <Dropdown.Item className="flex items-center gap-2">
    <TbMail size={18} /> <span className="text-xs">Send Email</span>
  </Dropdown.Item>

  {/* 2. Send WhatsApp */}
  <Dropdown.Item className="flex items-center gap-2">
    <TbBrandWhatsapp size={18} /> <span className="text-xs">Send Whatsapp</span>
  </Dropdown.Item>

  {/* 3. Add Notification */}
  <Dropdown.Item className="flex items-center gap-2">
    <TbBell size={18} /> <span className="text-xs">Add Notification</span>
  </Dropdown.Item>

  {/* 4. Assign Task */}
  <Dropdown.Item className="flex items-center gap-2">
    <TbUser size={18} /> <span className="text-xs">Assign Task</span>
  </Dropdown.Item>

  {/* 5. Add Schedule */}
  <Dropdown.Item className="flex items-center gap-2">
    <TbCalendarEvent size={18} /> <span className="text-xs">Add Calendar</span>
  </Dropdown.Item>

  {/* 6. Add Active */}
  <Dropdown.Item className="flex items-center gap-2">
    <TbTagStarred size={18} /> <span className="text-xs">Add Active</span>
  </Dropdown.Item>

  {/* 7. Download Document */}
  <Dropdown.Item className="flex items-center gap-2">
    <TbDownload size={18} /> <span className="text-xs">Download Document</span>
  </Dropdown.Item>
</Dropdown>

      </Tooltip>
    </div>
  );
};

// Type for CSV headers, used by exportToCsv function
export type CsvHeader = {
    label: string;
    key: string; 
};

// --- exportToCsv Function ---
function exportToCsv<T extends Record<string, any>>(
    filename: string,
    rows: T[],
    headers: CsvHeader[] // Using the CsvHeader type
): boolean {
    if (!rows || !rows.length) {
        toast.push(
            <Notification title="No Data" type="info" duration={3000}>
                Nothing to export.
            </Notification>,
        );
        return false;
    }

    if (!headers || !headers.length) {
        toast.push(
            <Notification title="Configuration Error" type="danger" duration={3000}>
                CSV Headers are not defined. Cannot export.
            </Notification>,
        );
        return false;
    }

    const separator = ',';
    const headerRow = headers
        .map(header => `"${String(header.label).replace(/"/g, '""')}"`)
        .join(separator);

    const dataRows = rows.map(row => {
        return headers.map(header => {
            let cellValue = row[header.key];
            if (cellValue === null || cellValue === undefined) {
                cellValue = '';
            } else if (Array.isArray(cellValue)) {
                cellValue = cellValue.map(item => String(item).replace(/"/g, '""')).join('; ');
            } else {
                cellValue = String(cellValue).replace(/"/g, '""');
            }
            if (String(cellValue).search(/("|,|\n)/g) >= 0) {
                cellValue = `"${cellValue}"`;
            }
            return cellValue;
        }).join(separator);
    }).join('\n');

    const csvContent = '\ufeff' + headerRow + '\n' + dataRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } else {
        toast.push(
            <Notification title="Export Failed" type="danger" duration={3000}>
                Your browser does not support this feature.
            </Notification>,
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

const InquiryViewModal: React.FC<InquiryViewModalProps> = ({ isOpen, onClose, inquiry }) => {
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
          {/* Section 1: Basic Info */}
          <div>
            <h6 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Basic Information</h6>
            <div className="space-y-1 text-sm">
              <p><strong>Inquiry ID:</strong> {inquiry.inquiry_id}</p>
              <p><strong>Company:</strong> {inquiry.company_name}</p>
              <p><strong>Subject:</strong> {inquiry.inquiry_subject}</p>
              <div className="flex items-center gap-2">
                <strong>Type:</strong> <Tag className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{inquiry.inquiry_type}</Tag>
              </div>
              <div className="flex items-center gap-2">
                <strong>Record Status:</strong> <Tag className={`${recordStatusColor[inquiry.status]} capitalize text-[10px] px-1.5 py-0.5`}>{inquiry.status}</Tag>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Person */}
          <div>
            <h6 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Contact Person</h6>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {inquiry.contact_person_name}</p>
              <p><strong>Email:</strong> <a href={`mailto:${inquiry.contact_person_email}`} className="text-blue-600 hover:underline dark:text-blue-400">{inquiry.contact_person_email}</a></p>
              <p><strong>Phone:</strong> {inquiry.contact_person_phone}</p>
            </div>
          </div>

          {/* Section 3: Inquiry Details */}
          <div className="md:col-span-2">
            <h6 className="text-sm font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-200">Inquiry Specifics</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                    <strong>Priority:</strong> <Tag className={`${priorityColors[inquiry.inquiry_priority] || priorityColors["N/A"]} capitalize text-[10px] px-1.5 py-0.5`}>{inquiry.inquiry_priority}</Tag>
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <strong>Current Status:</strong> <Tag className={`${inquiryCurrentStatusColors[inquiry.inquiry_status] || inquiryCurrentStatusColors["N/A"]} capitalize text-[10px] px-1.5 py-0.5`}>{inquiry.inquiry_status}</Tag>
                </div>
                 <p><strong>Assigned To:</strong> {inquiry.assigned_to}</p>
                 {inquiry.department && <p><strong>Department:</strong> {inquiry.department}</p>}
              </div>
              <div>
                 <p><strong>Feedback Status:</strong> {inquiry.feedback_status}</p>
              </div>
            </div>
          </div>


          {/* Section 4: Description & Resolution */}
           <div className="md:col-span-2 mt-2">
             <h6 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Description</h6>
             <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md whitespace-pre-wrap max-h-40 overflow-y-auto">{inquiry.inquiry_description}</div>
           </div>
           {inquiry.inquiry_resolution && inquiry.inquiry_resolution !== "N/A" && (
             <div className="md:col-span-2 mt-2">
               <h6 className="text-sm font-semibold mb-1 text-gray-700 dark:text-gray-200">Resolution</h6>
               <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md whitespace-pre-wrap max-h-40 overflow-y-auto">{inquiry.inquiry_resolution}</div>
             </div>
           )}


          {/* Section 5: Timeline */}
          <div className="md:col-span-2">
            <h6 className="text-sm font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-200">Timeline</h6>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                <FormattedDateDisplay dateString={inquiry.inquiry_date} label="Inquired" />
                <FormattedDateDisplay dateString={inquiry.response_date} label="Responded" />
              
            </div>
          </div>

          {/* Section 6: Attachments */}
          {inquiry.inquiry_attachments && inquiry.inquiry_attachments.length > 0 && (
            <div className="md:col-span-2">
              <h6 className="text-sm font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-200">Attachments</h6>
              <ul className="list-disc list-inside text-sm space-y-1 max-h-32 overflow-y-auto">
                {inquiry.inquiry_attachments.map((attachment, index) => (
                  <li key={index}>
                    <a href={attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                      {attachment.split('/').pop()?.split('?')[0] || `Attachment ${index + 1}`} {/* Try to get a cleaner name */}
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


// --- InquiryListTable Component ---
const InquiryListTable = () => {
  const dispatch = useAppDispatch();
  const { inquiryList, departments, isLoading, selectedInquiries, setSelectedInquiries } = useInquiryList();
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<InquiryFilterFormData>({});
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InquiryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- State for Export Reason Modal ---
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  // --- State for View Details Modal ---
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [inquiryToView, setInquiryToView] = useState<InquiryItem | null>(null);


  const filterFormMethods = useForm<InquiryFilterFormData>({ resolver: zodResolver(inquiryFilterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: '' }, mode: 'onChange' });
  
  useEffect(() => { filterFormMethods.reset(filterCriteria); }, [filterCriteria, filterFormMethods]);

  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setFilterDrawerOpen(true); };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: InquiryFilterFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); };
  const onClearFilters = () => {
    const defaultFilters: InquiryFilterFormData = { filterRecordStatus: [], filterInquiryType: [], filterInquiryPriority: [], filterInquiryCurrentStatus: [], filterAssignedTo: [], filterDepartment: [], filterFeedbackStatus: [], filterInquiryDate: [null, null], filterResponseDate: [null, null], filterResolutionDate: [null, null], filterFollowUpDate: [null, null] };
    filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); handleSetTableData({ pageIndex: 1 }); dispatch(getInquiriesAction());
  };

  const handleDeleteItemClick = (item: InquiryItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true); setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteAllInquiryAction({ ids: itemToDelete.id })).unwrap();
      toast.push(<Notification title="Inquiry Deleted" type="success" duration={2000}>Inquiry "{itemToDelete.inquiry_id}" deleted.</Notification>);
      dispatch(getInquiriesAction()); setSelectedInquiries((prev) => prev.filter((si) => si.id !== itemToDelete.id));
    } catch (error: any) {
      toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error.message || `Could not delete inquiry.`}</Notification>);
    } finally {
      setIsDeleting(false); setItemToDelete(null);
    }
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let data = cloneDeep(inquiryList);
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      data = data.filter((item) => Object.values(item).some((value) => String(value).toLowerCase().includes(query)));
    }
    if (filterCriteria.filterRecordStatus?.length) { const selected = filterCriteria.filterRecordStatus.map((opt) => opt.value); data = data.filter((item) => selected.includes(item.status)); }
    if (filterCriteria.filterInquiryType?.length) { const selected = filterCriteria.filterInquiryType.map((opt) => opt.value); data = data.filter((item) => selected.includes(item.inquiry_type)); }
    if (filterCriteria.filterInquiryPriority?.length) { const selected = filterCriteria.filterInquiryPriority.map((opt) => opt.value); data = data.filter((item) => selected.includes(item.inquiry_priority)); }
    if (filterCriteria.filterInquiryCurrentStatus?.length) { const selected = filterCriteria.filterInquiryCurrentStatus.map((opt) => opt.value); data = data.filter((item) => selected.includes(item.inquiry_status)); }
    if (filterCriteria.filterAssignedTo?.length) { const selected = filterCriteria.filterAssignedTo.map((opt) => opt.value); data = data.filter((item) => selected.includes(item.assigned_to)); }
    if (filterCriteria.filterDepartment?.length) { const selected = filterCriteria.filterDepartment.map((opt) => opt.value); data = data.filter((item) => item.department && selected.includes(item.department)); }
    if (filterCriteria.filterFeedbackStatus?.length) { const selected = filterCriteria.filterFeedbackStatus.map((opt) => opt.value); data = data.filter((item) => selected.includes(item.feedback_status)); }
    const checkDateRange = (dateStr: string, range: (Date | null)[] | undefined) => {
      if (!dateStr || dateStr === "N/A" || !range || (!range[0] && !range[1])) return true;
      try { const itemDate = new Date(dateStr).setHours(0, 0, 0, 0); const from = range[0] ? new Date(range[0]).setHours(0, 0, 0, 0) : null; const to = range[1] ? new Date(range[1]).setHours(0, 0, 0, 0) : null; if (from && to) return itemDate >= from && itemDate <= to; if (from) return itemDate >= from; if (to) return itemDate <= to; return true; } catch (e) { return true; }
    };
    if (filterCriteria.filterInquiryDate?.[0] || filterCriteria.filterInquiryDate?.[1]) { data = data.filter((item) => checkDateRange(item.inquiry_date, filterCriteria.filterInquiryDate)); }
    if (filterCriteria.filterResponseDate?.[0] || filterCriteria.filterResponseDate?.[1]) { data = data.filter((item) => checkDateRange(item.response_date, filterCriteria.filterResponseDate)); }
    if (filterCriteria.filterResolutionDate?.[0] || filterCriteria.filterResolutionDate?.[1]) { data = data.filter((item) => checkDateRange(item.resolution_date, filterCriteria.filterResolutionDate)); }
    if (filterCriteria.filterFollowUpDate?.[0] || filterCriteria.filterFollowUpDate?.[1]) { data = data.filter((item) => checkDateRange(item.follow_up_date, filterCriteria.filterFollowUpDate)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      data.sort((a, b) => {
        const aVal = a[key as keyof InquiryItem] ?? ""; const bVal = b[key as keyof InquiryItem] ?? "";
        if (["inquiry_date", "response_date", "resolution_date", "follow_up_date"].includes(key)) { const dateA = aVal && aVal !== "N/A" ? new Date(aVal as string).getTime() : order === "asc" ? Infinity : -Infinity; const dateB = bVal && bVal !== "N/A" ? new Date(bVal as string).getTime() : order === "asc" ? Infinity : -Infinity; if (isNaN(dateA)) return 1; if (isNaN(dateB)) return -1; return order === "asc" ? dateA - dateB : dateB - dateA; }
        if (typeof aVal === "string" && typeof bVal === "string") return order === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
        return 0;
      });
    }
    const currentTotal = data.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: data.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: data };
  }, [inquiryList, tableData, filterCriteria]);

  const handleViewDetails = (id: string) => {
    const inquiry = allFilteredAndSortedData.find(item => item.id === id); // Use allFilteredAndSortedData for current view or inquiryList for global
    if (inquiry) {
      setInquiryToView(inquiry);
      setIsViewDetailsModalOpen(true);
    } else {
      toast.push(<Notification type="danger" title="Error">Inquiry details not found.</Notification>);
    }
  };

  const navigate = useNavigate();
  const handleEditInquiry = (id: string) => { 
    navigate("/business-entities/create-inquiry", { state: id }); }; // Pass ID in state
// navigate("/business-entities/create-inquiry", { state: id });
  const columns: ColumnDef<InquiryItem>[] = useMemo(() => [
    { header: "Inquiry Overview", accessorKey: "inquiry_id", enableSorting: true, size: 280, cell: ({ row }) => { const d = row.original; return (<div className="flex flex-col gap-0.5"><span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{d.inquiry_id}</span><span className="text-xs text-gray-700 dark:text-gray-300">{d.company_name || "Company Name"}</span><Tooltip title={d.inquiry_subject}><span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{d.inquiry_subject}</span></Tooltip><div className="flex items-center gap-2 mt-1"><Tag className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{d.inquiry_type || "Inquiry Type"}</Tag><Tag className={`${recordStatusColor[d.status]} capitalize text-[10px] px-1.5 py-0.5`}>{d.status}</Tag></div></div>); } },
    { header: "Contact Person", accessorKey: "contact_person_name", enableSorting: true, size: 240, cell: ({ row }) => { const d = row.original; return (<div className="flex flex-col gap-0.5 text-xs"><span className="font-semibold text-gray-800 dark:text-gray-100">{d.contact_person_name}</span><a href={`mailto:${d.contact_person_email}`} className="text-blue-600 hover:underline dark:text-blue-400">{d.contact_person_email}</a><span className="text-gray-600 dark:text-gray-300">{d.contact_person_phone}</span></div>); } },
    { header: "Inquiry Details", accessorKey: "inquiry_priority", enableSorting: true, size: 280, cell: ({ row }) => { const d = row.original; return (<div className="flex flex-col gap-1 text-xs"><div className="flex items-center gap-2"><Tag className={`${priorityColors[d.inquiry_priority] || priorityColors["N/A"]} capitalize text-[10px] px-1.5 py-0.5`}>{d.inquiry_priority} </Tag><Tag className={`${inquiryCurrentStatusColors[d.inquiry_status] || inquiryCurrentStatusColors["N/A"]} capitalize text-[10px] px-1.5 py-0.5`}>{d.inquiry_status}</Tag></div><span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Assigned:</span> {d.assigned_to}</span>{d.department && (<span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Dept:</span> {d.department}</span>)}<Tooltip title={d.inquiry_description}><p className="text-gray-600 dark:text-gray-400 line-clamp-2">{d.inquiry_description}</p></Tooltip></div>); } },
    { header: "Timeline", accessorKey: "inquiry_date", enableSorting: true, size: 180, cell: ({ row }) => { const d = row.original; return (<div className="flex flex-col gap-0.5"><FormattedDateDisplay dateString={d.inquiry_date} label="Inquired" /><FormattedDateDisplay dateString={d.response_date} label="Responded" /></div>); } },
    { header: "Actions", id: "action", size: 130, meta: { HeaderClass: "text-center" }, cell: (props) => (<InquiryActionColumn rowData={props.row.original} onViewDetail={handleViewDetails} onDeleteItem={handleDeleteItemClick} onEdit={handleEditInquiry} />) },
  ], [navigate, allFilteredAndSortedData]); // Added navigate and allFilteredAndSortedData dependency

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedInquiries([]); }, [handleSetTableData, setSelectedInquiries]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchInputChange = useCallback((val: string) => handleSetTableData({ query: val, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: InquiryItem) => { setSelectedInquiries((prev) => checked ? (prev.find((i) => i.id === row.id) ? prev : [...prev, row]) : prev.filter((item) => item.id !== row.id)); }, [setSelectedInquiries]);
  const handleAllRowSelect = useCallback((checked: boolean, rows: Row<InquiryItem>[]) => { const currentIds = new Set(rows.map((r) => r.original.id)); if (checked) { setSelectedInquiries((prev) => { const newItems = rows.map((r) => r.original).filter((item) => !prev.find((pi) => pi.id === item.id)); return [...prev, ...newItems]; }); } else { setSelectedInquiries((prev) => prev.filter((item) => !currentIds.has(item.id))); } }, [setSelectedInquiries]);
  
  const csvHeaders: CsvHeader[] = useMemo(() => { 
    if (allFilteredAndSortedData.length === 0) return [];
    // Ensure all keys are present, even if some objects might not have them (though InquiryItem type should enforce this)
    const allKeys = new Set<string>();
    allFilteredAndSortedData.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
    
    return Array.from(allKeys).map((key) => ({
      label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      key: key,
    }));
  }, [allFilteredAndSortedData]);

  const handleExport = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
        toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
        return;
    }
    exportReasonFormMethods.reset({ reason: '' });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = 'Inquiries'; 
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `inquiries_export_${timestamp}.csv`;
    try {
        await dispatch(
            submitExportReasonAction({
                reason: data.reason,
                module: moduleName,
                file_name: fileName,
            }),
        ).unwrap();
        toast.push(<Notification title="Export Reason Submitted" type="success" />);

        const exportSuccessful = exportToCsv(fileName, allFilteredAndSortedData, csvHeaders);
        if (exportSuccessful) {
            toast.push(<Notification title="Export Initiated" type="success">Download of {fileName} has started.</Notification>);
        }
        setIsExportReasonModalOpen(false);
    } catch (error: any) {
        toast.push(<Notification title="Operation Failed" type="danger" message={error.message || 'Could not submit reason or export data.'} />);
    } finally {
        setIsSubmittingExportReason(false);
    }
  };

  const recordStatusOptions = useMemo(() => [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }], []);
  const inquiryTypeOptions = useMemo(() => Array.from(new Set(inquiryList.map((item) => item.inquiry_type).filter((t) => t && t !== "N/A"))).map((type) => ({ value: type, label: type })), [inquiryList]);
  const inquiryPriorityOptions = useMemo(() => Array.from(new Set(inquiryList.map((item) => item.inquiry_priority).filter((p) => p && p !== "N/A"))).map((priority) => ({ value: priority, label: priority })), [inquiryList]);
  const inquiryCurrentStatusOptions = useMemo(() => Array.from(new Set(inquiryList.map((item) => item.inquiry_status).filter((s) => s && s !== "N/A"))).map((status) => ({ value: status, label: status })), [inquiryList]);
  const assignedToOptions = useMemo(() => Array.from(new Set(inquiryList.map((item) => item.assigned_to).filter((a) => a && a !== "N/A"))).map((assignee) => ({ value: assignee, label: assignee })), [inquiryList]);
  const departmentFilterOptions = useMemo(() => departments.map((dept) => ({ value: dept.name, label: dept.name })), [departments]);
  const feedbackStatusOptions = useMemo(() => Array.from(new Set(inquiryList.map((item) => item.feedback_status).filter((f) => f && f !== "N/A"))).map((status) => ({ value: status, label: status })), [inquiryList]);
  const { DatePickerRange } = DatePicker;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <InquiryListSearch onInputChange={handleSearchInputChange} />
        <div className="flex gap-2">
          <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters" />
          <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
          <Button 
            icon={<TbCloudUpload />} 
            onClick={handleExport} 
            disabled={allFilteredAndSortedData.length === 0}
          >
            Export
          </Button>
        </div>
      </div>
      <DataTable
        selectable columns={columns} data={pageData} noData={!isLoading && pageData.length === 0} loading={isLoading || isDeleting || isSubmittingExportReason}
        pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
        checkboxChecked={(row) => selectedInquiries.some((selected) => selected.id === row.id)}
        onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect}
      />
      <Drawer
        title="Inquiry Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={480}
        footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterInquiryForm" type="submit">Apply</Button></div>}
      >
        <UiForm id="filterInquiryForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2">
            <FormItem label="Record Status"><Controller name="filterRecordStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={recordStatusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
            <FormItem label="Inquiry Type"><Controller name="filterInquiryType" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Type" options={inquiryTypeOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
            <FormItem label="Inquiry Priority"><Controller name="filterInquiryPriority" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Priority" options={inquiryPriorityOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
            <FormItem label="Inquiry Current Status"><Controller name="filterInquiryCurrentStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={inquiryCurrentStatusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
            <FormItem label="Assigned To"><Controller name="filterAssignedTo" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Assignee" options={assignedToOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
            <FormItem label="Department"><Controller name="filterDepartment" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Department" options={departmentFilterOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
            <FormItem label="Feedback Status" className="col-span-2"><Controller name="filterFeedbackStatus" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Select Status" options={feedbackStatusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
            <FormItem label="Inquiry Date Range" className="col-span-2"><Controller name="filterInquiryDate" control={filterFormMethods.control} render={({ field }) => (<DatePickerRange placeholder="Select Inquiry Dates" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />)} /></FormItem>
            <FormItem label="Response Date Range" className="col-span-2"><Controller name="filterResponseDate" control={filterFormMethods.control} render={({ field }) => (<DatePickerRange placeholder="Select Response Dates" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />)} /></FormItem>
           
          </div>
        </UiForm>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Inquiry" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting}>
        <p>Are you sure you want to delete inquiry "<strong>{itemToDelete?.inquiry_id}</strong>"?</p>
      </ConfirmDialog>

      <ConfirmDialog
            isOpen={isExportReasonModalOpen}
            type="info"
            title="Reason for Export"
            onClose={() => setIsExportReasonModalOpen(false)}
            onRequestClose={() => setIsExportReasonModalOpen(false)}
            onCancel={() => setIsExportReasonModalOpen(false)}
            onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
            loading={isSubmittingExportReason}
            confirmText={isSubmittingExportReason ? 'Submitting...' : 'Submit & Export'}
            cancelText="Cancel"
            confirmButtonProps={{
                disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason,
            }}
        >
            <UiForm 
                id="exportReasonForm"
                onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
                className="flex flex-col gap-4 mt-2"
            >
                <FormItem 
                    label="Please provide a reason for exporting this data:"
                    invalid={!!exportReasonFormMethods.formState.errors.reason}
                    errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
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
            </UiForm>
        </ConfirmDialog>

        {/* View Details Modal */}
        <InquiryViewModal
            isOpen={isViewDetailsModalOpen}
            onClose={() => {
                setIsViewDetailsModalOpen(false);
                setInquiryToView(null);
            }}
            inquiry={inquiryToView}
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
    setIsBulkDeleting(true); setDeleteConfirmationOpen(false);
    const idsToDelete = selectedInquiries.map((item) => item.id);
    try {
      await dispatch(deleteAllInquiryAction({ ids: idsToDelete.join(",") })).unwrap();
      toast.push(<Notification type="success" title="Inquiries Deleted">Selected inquiries have been removed.</Notification>);
      setSelectedInquiries([]); dispatch(getInquiriesAction());
    } catch (error: any) {
      toast.push(<Notification title="Deletion Failed" type="danger">{error.message || "Failed to delete inquiries."}</Notification>);
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      setSendMessageLoading(false); setSendMessageDialogOpen(false);
      toast.push(<Notification type="success" title="Message Sent (Demo)">Message sent!</Notification>);
    }, 1000);
  };

  if (selectedInquiries.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <span><span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1"><span className="heading-text">{selectedInquiries.length} Inquiries</span><span>selected</span></span></span></span>
            <div className="flex items-center">
              <Button size="sm" className="ltr:mr-3 rtl:ml-3" type="button" customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"} onClick={handleDelete} loading={isBulkDeleting}>Delete</Button>
              <Button size="sm" variant="solid" onClick={() => setSendMessageDialogOpen(true)}>Message</Button>
            </div>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title="Remove Inquiries" onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} loading={isBulkDeleting}>
        <p>Are you sure you want to remove these inquiries? This action can't be undone.</p>
      </ConfirmDialog>
      <Dialog isOpen={sendMessageDialogOpen} onRequestClose={() => setSendMessageDialogOpen(false)} onClose={() => setSendMessageDialogOpen(false)}>
        <h5 className="mb-2">Send Message</h5>
        <p>Send message regarding the following inquiries:</p>
        <div className="mt-4 max-h-32 overflow-y-auto">{selectedInquiries.map((inquiry) => (<div key={inquiry.id} className="text-sm p-1 border-b dark:border-gray-700"><Tooltip title={`${inquiry.inquiry_id}: ${inquiry.inquiry_subject} (Contact: ${inquiry.contact_person_name})`}><span>{inquiry.inquiry_id} - {inquiry.company_name}</span></Tooltip></div>))}</div>
        <div className="my-4"><RichTextEditor content={""} /></div>
        <div className="ltr:justify-end flex items-center gap-2"><Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>Cancel</Button><Button size="sm" variant="solid" loading={sendMessageLoading} onClick={handleSend}>Send</Button></div>
      </Dialog>
    </>
  );
};

// --- Main Inquiries Page Component ---
const Inquiries = () => (
  <InquiryListProvider>
    <>
      <Container>
        <AdaptiveCard>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h5>Inquiries</h5>
              <InquiryListActionTools />
            </div>
            <InquiryListTable />
          </div>
        </AdaptiveCard>
      </Container>
      <InquiryListSelected />
    </>
  </InquiryListProvider>
);

export default Inquiries;