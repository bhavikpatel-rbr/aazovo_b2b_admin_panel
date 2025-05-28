import React, { useState, useMemo, useCallback, Ref, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CSVLink } from "react-csv";
import cloneDeep from "lodash/cloneDeep";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import Avatar from "@/components/ui/Avatar"; // Used in SelectedItems
import Tag from "@/components/ui/Tag";
import Tooltip from "@/components/ui/Tooltip";
import DataTable from "@/components/shared/DataTable";
import {
  Drawer,
  Form as UiForm,
  FormItem as UiFormItem,
  Input as UiInput,
  Select as UiSelect,
  Button,
  Dropdown,
  DatePicker, // Added for filter
} from "@/components/ui";
import StickyFooter from "@/components/shared/StickyFooter";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import RichTextEditor from "@/components/shared/RichTextEditor";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import DebouceInput from "@/components/shared/DebouceInput";

// Icons
import {
  TbPencil,
  TbEye,
  TbUserCircle, // For Avatar fallback if needed
  TbShare,
  TbCloudUpload,
  TbDotsVertical,
  TbCloudDownload,
  TbFilter,
  TbPlus,
  TbChecks,
  TbSearch,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- InquiryItem Type (Data Structure) ---
export type InquiryItem = {
  id: string;
  inquiry_id: string;
  company_name: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  inquiry_type: string;
  inquiry_subject: string;
  inquiry_description: string;
  inquiry_priority: string; // e.g., 'High', 'Medium', 'Low'
  inquiry_status: string; // e.g., 'New', 'In Progress', 'Resolved', 'Closed'
  assigned_to: string;
  department?: string;
  inquiry_date: string; // ISO date string
  response_date: string; // ISO date string
  resolution_date: string; // ISO date string
  follow_up_date: string; // ISO date string
  feedback_status: string;
  inquiry_resolution: string;
  inquiry_attachments: string[];
  status: "active" | "inactive"; // Overall status of the record in the list
};
// --- End InquiryItem Type ---

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
  filterInquiryCurrentStatus: z // Renamed from filterInquiryStatus to avoid confusion with overall 'status'
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
// --- End Inquiry Filter Schema ---

// --- Status Colors ---
const recordStatusColor: Record<InquiryItem["status"], string> = {
  active: "bg-green-200 text-green-600 dark:bg-green-700 dark:text-green-100",
  inactive: "bg-red-200 text-red-600 dark:bg-red-700 dark:text-red-100",
};

const priorityColors: Record<string, string> = {
  High: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  Low: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
};

const inquiryCurrentStatusColors: Record<string, string> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  Resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Closed: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};
// --- End Status Colors ---


// --- Initial Dummy Data ---
const initialDummyInquiries: InquiryItem[] = [
  {
    id: "F123",
    inquiry_id: "INQ001",
    company_name: "TechSoft Solutions",
    contact_person_name: "Alice Johnson",
    contact_person_email: "alice.johnson@techsoft.com",
    contact_person_phone: "+1-555-123-4567",
    inquiry_type: "Product",
    inquiry_subject: "Request for product pricing",
    inquiry_description: "We are interested in getting a quotation for your enterprise software solution. This is a detailed description that might be long and require truncation.",
    inquiry_priority: "High",
    inquiry_status: "New",
    assigned_to: "Sales Team",
    department: "Sales & Marketing",
    inquiry_date: "2025-05-01T10:00:00Z",
    response_date: "2025-05-02T11:00:00Z",
    resolution_date: "",
    follow_up_date: "2025-05-05T00:00:00Z",
    feedback_status: "Pending",
    inquiry_resolution: "",
    inquiry_attachments: ["https://example.com/attachments/inquiry001/file1.pdf", "https://example.com/attachments/inquiry001/file2.png"],
    status: "active",
  },
  {
    id: "F124",
    inquiry_id: "INQ002",
    company_name: "GreenLeaf Corp",
    contact_person_name: "Bob Smith",
    contact_person_email: "bob@greenleaf.com",
    contact_person_phone: "+44-20-7946-0958",
    inquiry_type: "Service",
    inquiry_subject: "Technical support needed",
    inquiry_description: "We are facing issues with our integration and need technical assistance. Another long description to test the line clamp feature.",
    inquiry_priority: "Medium",
    inquiry_status: "In Progress",
    assigned_to: "Tech Support",
    department: "Technical Support",
    inquiry_date: "2025-04-28T14:30:00Z",
    response_date: "2025-04-29T09:00:00Z",
    resolution_date: "",
    follow_up_date: "2025-05-03T00:00:00Z",
    feedback_status: "Pending",
    inquiry_resolution: "",
    inquiry_attachments: [],
    status: "active",
  },
  {
    id: "F125",
    inquiry_id: "INQ003",
    company_name: "BlueOcean Ltd.",
    contact_person_name: "Clara Lee",
    contact_person_email: "clara.lee@blueocean.com",
    contact_person_phone: "+91-9876543210",
    inquiry_type: "General",
    inquiry_subject: "Partnership inquiry",
    inquiry_description: "We are exploring potential partnership opportunities with your company. This inquiry has been resolved and further details are available in the resolution notes.",
    inquiry_priority: "Low",
    inquiry_status: "Resolved",
    assigned_to: "Partnership Team",
    department: "Business Development",
    inquiry_date: "2025-03-15T08:00:00Z",
    response_date: "2025-03-16T10:00:00Z",
    resolution_date: "2025-03-18T17:00:00Z",
    follow_up_date: "2025-03-25T00:00:00Z",
    feedback_status: "Received",
    inquiry_resolution: "Provided details and scheduled a follow-up call. The partnership proposal was shared and accepted.",
    inquiry_attachments: ["https://example.com/attachments/inquiry003/proposal.pdf"],
    status: "inactive",
  },
];
// --- End Dummy Data ---


// --- Inquiry List Store ---
interface InquiryListStore {
  inquiryList: InquiryItem[];
  selectedInquiries: InquiryItem[];
  inquiryListTotal: number;
  setInquiryList: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
  setSelectedInquiries: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
  setInquiryListTotal: React.Dispatch<React.SetStateAction<number>>;
  // For filter criteria to be shared if needed, though typically managed by table
  // filterCriteria: InquiryFilterFormData;
  // setFilterCriteria: React.Dispatch<React.SetStateAction<InquiryFilterFormData>>;
}

const InquiryListContext = React.createContext<InquiryListStore | undefined>(undefined);

const useInquiryList = (): InquiryListStore => {
  const context = useContext(InquiryListContext);
  if (!context) {
    throw new Error("useInquiryList must be used within a InquiryListProvider");
  }
  return context;
};

const InquiryListProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inquiryList, setInquiryList] = useState<InquiryItem[]>(initialDummyInquiries);
  const [selectedInquiries, setSelectedInquiries] = useState<InquiryItem[]>([]);
  const [inquiryListTotal, setInquiryListTotal] = useState(initialDummyInquiries.length);
  // const [filterCriteria, setFilterCriteria] = useState<InquiryFilterFormData>({}); // If filters were global

  return (
    <InquiryListContext.Provider value={{
        inquiryList, setInquiryList,
        selectedInquiries, setSelectedInquiries,
        inquiryListTotal, setInquiryListTotal,
        // filterCriteria, setFilterCriteria // If filters were global
    }}>
      {children}
    </InquiryListContext.Provider>
  );
};
// --- End Inquiry List Store ---


// --- InquiryListSearch Component ---
interface InquiryListSearchProps {
  onInputChange: (value: string) => void;
}
const InquiryListSearch: React.FC<InquiryListSearchProps> = ({ onInputChange }) => {
  return (
    <DebouceInput
      placeholder="Quick Search inquiries..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
      className="max-w-xs"
    />
  );
};
// --- End InquiryListSearch ---


// --- InquiryListActionTools Component (for Page Header) ---
const InquiryListActionTools = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Button
        variant="solid"
        icon={<TbPlus className="text-lg" />}
        onClick={() => navigate("/business-entities/create-inquiry")} // Ensure this route exists
      >
        Add New
      </Button>
    </div>
  );
};
// --- End InquiryListActionTools ---


// --- InquiryActionColumn Component (for DataTable) ---
const InquiryActionColumn = ({
  rowData,
  onEdit,
  onViewDetail,
  onShare,
  // onMore, // 'More' actions are handled by Dropdown directly
  // For actions inside dropdown:
  // onCloneItem,
  onChangeItemStatus,
  // onDeleteItem,
}: {
  rowData: InquiryItem;
  onEdit: (id: string) => void;
  onViewDetail: (id: string) => void;
  onShare: (id: string) => void;
  onChangeItemStatus: (id: string, currentStatus: InquiryItem["status"]) => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          role="button"
          onClick={() => onEdit(rowData.id)}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          role="button"
          onClick={() => onViewDetail(rowData.id)}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className="text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400"
          role="button"
          onClick={() => onShare(rowData.id)}
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <Dropdown renderTitle={<TbDotsVertical />} style={{ fontSize: "10px" }}>
            <Dropdown.Item className="text-xs py-2" style={{height:"auto"}} onClick={() => onChangeItemStatus(rowData.id, rowData.status)}>
                Toggle Active/Inactive
            </Dropdown.Item>
            {/* <Dropdown.Separator /> */}
            <Dropdown.Item className="text-xs py-2" style={{height:"auto"}}>Request For</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{height:"auto"}}>Add in Active</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{height:"auto"}}>Add Schedule</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{height:"auto"}}>Add Task</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{height:"auto"}}>View Documents</Dropdown.Item>
            <Dropdown.Item className="text-xs py-2" style={{height:"auto"}}>View Alert</Dropdown.Item>
        </Dropdown>
      </Tooltip>
    </div>
  );
};
// --- End InquiryActionColumn ---

// --- Helper to format date for display ---
const FormattedDateDisplay = ({ dateString, label }: { dateString?: string, label?: string }) => {
    if (!dateString) return null; // Don't render if no date
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return <span className="text-xs text-red-500">{label && <b>{label}: </b>}Invalid Date</span>;
      return (
        <div className="text-[10px] text-gray-500 dark:text-gray-400">
          {label && <b>{label}: </b>}
          {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ /g, "/")}
        </div>
      );
    } catch (e) {
      return <span className="text-xs text-red-500">{label && <b>{label}: </b>}Error</span>;
    }
};


// --- InquiryListTable Component ---
const InquiryListTable = () => {
  const navigate = useNavigate();
  const {
    inquiryList,
    setInquiryList,
    selectedInquiries,
    setSelectedInquiries,
    setInquiryListTotal,
  } = useInquiryList();

  const [isLoading, setIsLoading] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  // Filter Drawer State and Logic
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<InquiryFilterFormData>({
    filterInquiryDate: [null, null], // Initialize date ranges
    filterResponseDate: [null, null],
    filterResolutionDate: [null, null],
    filterFollowUpDate: [null, null],
  });

  const filterFormMethods = useForm<InquiryFilterFormData>({
    resolver: zodResolver(inquiryFilterFormSchema),
    defaultValues: filterCriteria,
  });

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
        filterInquiryDate: [null, null],
        filterResponseDate: [null, null],
        filterResolutionDate: [null, null],
        filterFollowUpDate: [null, null],
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  };

  const { pageData, total } = useMemo(() => {
    let filteredData = [...inquiryList];

    // Global query search
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      filteredData = filteredData.filter((item) =>
        Object.values(item).some((value) => {
          if (typeof value === "string") return value.toLowerCase().includes(query);
          if (Array.isArray(value)) return value.some(subVal => String(subVal).toLowerCase().includes(query));
          return false;
        })
      );
    }

    // Advanced Filters
    if (filterCriteria.filterRecordStatus && filterCriteria.filterRecordStatus.length > 0) {
      const selected = filterCriteria.filterRecordStatus.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.status));
    }
    if (filterCriteria.filterInquiryType && filterCriteria.filterInquiryType.length > 0) {
      const selected = filterCriteria.filterInquiryType.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.inquiry_type));
    }
    if (filterCriteria.filterInquiryPriority && filterCriteria.filterInquiryPriority.length > 0) {
      const selected = filterCriteria.filterInquiryPriority.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.inquiry_priority));
    }
    if (filterCriteria.filterInquiryCurrentStatus && filterCriteria.filterInquiryCurrentStatus.length > 0) {
      const selected = filterCriteria.filterInquiryCurrentStatus.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.inquiry_status));
    }
    if (filterCriteria.filterAssignedTo && filterCriteria.filterAssignedTo.length > 0) {
      const selected = filterCriteria.filterAssignedTo.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.assigned_to));
    }
    if (filterCriteria.filterDepartment && filterCriteria.filterDepartment.length > 0) {
      const selected = filterCriteria.filterDepartment.map(opt => opt.value);
      filteredData = filteredData.filter(item => item.department && selected.includes(item.department));
    }
    if (filterCriteria.filterFeedbackStatus && filterCriteria.filterFeedbackStatus.length > 0) {
      const selected = filterCriteria.filterFeedbackStatus.map(opt => opt.value);
      filteredData = filteredData.filter(item => selected.includes(item.feedback_status));
    }

    // Date Range Filters
    const checkDateRange = (dateStr: string, range: (Date | null)[] | undefined) => {
        if (!dateStr || !range || (!range[0] && !range[1])) return true;
        try {
            const itemDate = new Date(dateStr).setHours(0,0,0,0); // Normalize item date
            const from = range[0] ? new Date(range[0]).setHours(0,0,0,0) : null;
            const to = range[1] ? new Date(range[1]).setHours(0,0,0,0) : null;

            if (from && to) return itemDate >= from && itemDate <= to;
            if (from) return itemDate >= from;
            if (to) return itemDate <= to;
            return true;
        } catch (e) { return true; } // If date is invalid, don't filter out
    };

    if (filterCriteria.filterInquiryDate && (filterCriteria.filterInquiryDate[0] || filterCriteria.filterInquiryDate[1])) {
        filteredData = filteredData.filter(item => checkDateRange(item.inquiry_date, filterCriteria.filterInquiryDate));
    }
    if (filterCriteria.filterResponseDate && (filterCriteria.filterResponseDate[0] || filterCriteria.filterResponseDate[1])) {
        filteredData = filteredData.filter(item => checkDateRange(item.response_date, filterCriteria.filterResponseDate));
    }
    if (filterCriteria.filterResolutionDate && (filterCriteria.filterResolutionDate[0] || filterCriteria.filterResolutionDate[1])) {
        filteredData = filteredData.filter(item => checkDateRange(item.resolution_date, filterCriteria.filterResolutionDate));
    }
    if (filterCriteria.filterFollowUpDate && (filterCriteria.filterFollowUpDate[0] || filterCriteria.filterFollowUpDate[1])) {
        filteredData = filteredData.filter(item => checkDateRange(item.follow_up_date, filterCriteria.filterFollowUpDate));
    }


    // Sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      filteredData.sort((a, b) => {
        const aValue = a[key as keyof InquiryItem] ?? "";
        const bValue = b[key as keyof InquiryItem] ?? "";
        if (['inquiry_date', 'response_date', 'resolution_date', 'follow_up_date'].includes(key)) {
            const dateA = aValue ? new Date(aValue as string).getTime() : 0;
            const dateB = bValue ? new Date(bValue as string).getTime() : 0;
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }

    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const dataTotal = filteredData.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = filteredData.slice(startIndex, startIndex + pageSize);

    return { pageData: dataForPage, total: dataTotal };
  }, [inquiryList, tableData, filterCriteria]);


  const handleEditInquiry = (id: string) => { console.log("Edit Inquiry:", id); /* navigate(...) */ };
  const handleViewInquiryDetails = (id: string) => { console.log("View Inquiry Details:", id); /* navigate(...) */ };
  const handleShareInquiry = (id: string) => { console.log("Share Inquiry:", id); };
  const handleChangeInquiryStatus = (id: string, currentStatus: InquiryItem["status"]) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setInquiryList((currentList) =>
      currentList.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    toast.push(<Notification type="info" title="Inquiry Status Updated">{`Inquiry list status changed to ${newStatus}.`}</Notification>, { placement: "top-center" });
  };


  const columns: ColumnDef<InquiryItem>[] = useMemo(
    () => [
      {
        header: "Inquiry Overview",
        accessorKey: "inquiry_id",
        enableSorting: true,
        size: 280,
        cell: ({ row }) => {
          const { inquiry_id, company_name, inquiry_subject, inquiry_type, status } = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{inquiry_id}</span>
              <span className="text-xs text-gray-700 dark:text-gray-300">{company_name}</span>
              <Tooltip title={inquiry_subject}>
                <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{inquiry_subject}</span>
              </Tooltip>
              <div className="flex items-center gap-2 mt-1">
                <Tag className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{inquiry_type}</Tag>
                <Tag className={`${recordStatusColor[status]} capitalize text-[10px] px-1.5 py-0.5`}>{status}</Tag>
              </div>
            </div>
          );
        },
      },
      {
        header: "Contact Person",
        accessorKey: "contact_person_name",
        enableSorting: true,
        size: 240,
        cell: ({ row }) => {
          const { contact_person_name, contact_person_email, contact_person_phone } = row.original;
          return (
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-semibold text-gray-800 dark:text-gray-100">{contact_person_name}</span>
              <a href={`mailto:${contact_person_email}`} className="text-blue-600 hover:underline dark:text-blue-400">{contact_person_email}</a>
              <span className="text-gray-600 dark:text-gray-300">{contact_person_phone}</span>
            </div>
          );
        },
      },
      {
        header: "Inquiry Details",
        accessorKey: "inquiry_priority",
        enableSorting: true,
        size: 280,
        cell: ({ row }) => {
          const { inquiry_priority, inquiry_status: currentInquiryStatus, assigned_to, department, inquiry_description } = row.original;
          return (
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <Tag className={`${priorityColors[inquiry_priority] || 'bg-gray-100 text-gray-700'} capitalize text-[10px] px-1.5 py-0.5`}>
                  {inquiry_priority} Priority
                </Tag>
                <Tag className={`${inquiryCurrentStatusColors[currentInquiryStatus] || 'bg-gray-100 text-gray-700'} capitalize text-[10px] px-1.5 py-0.5`}>
                  {currentInquiryStatus}
                </Tag>
              </div>
              <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Assigned:</span> {assigned_to}</span>
              {department && <span className="text-gray-700 dark:text-gray-300"><span className="font-semibold">Dept:</span> {department}</span>}
              <Tooltip title={inquiry_description}>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{inquiry_description}</p>
              </Tooltip>
            </div>
          );
        },
      },
      {
        header: "Timeline",
        accessorKey: "inquiry_date",
        enableSorting: true,
        size: 180,
        cell: ({ row }) => {
          const { inquiry_date, response_date, resolution_date, follow_up_date } = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <FormattedDateDisplay dateString={inquiry_date} label="Inquired"/>
              <FormattedDateDisplay dateString={response_date} label="Responded"/>
              <FormattedDateDisplay dateString={resolution_date} label="Resolved"/>
              <FormattedDateDisplay dateString={follow_up_date} label="Follow-up"/>
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
            onEdit={handleEditInquiry}
            onViewDetail={handleViewInquiryDetails}
            onShare={handleShareInquiry}
            onChangeItemStatus={handleChangeInquiryStatus}
          />
        ),
      },
    ],
    []
  );

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }),[handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => handleSetTableData({ pageSize: Number(value), pageIndex: 1 }),[handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),[handleSetTableData]);

  const handleRowSelect = useCallback((checked: boolean, row: InquiryItem) => {
      setSelectedInquiries((prevSelected) => {
        if (checked) {
          return [...prevSelected, row];
        } else {
          return prevSelected.filter((item) => item.id !== row.id);
        }
      });
    }, [setSelectedInquiries]);

  const handleAllRowSelect = useCallback((checked: boolean, rows: Row<InquiryItem>[]) => {
      if (checked) {
        const allOriginalRows = rows.map(r => r.original);
        setSelectedInquiries(allOriginalRows);
      } else {
        setSelectedInquiries([]);
      }
    }, [setSelectedInquiries]);

  const handleImport = () => { console.log("Import Inquiries Clicked"); /* Implement import */ };

  const csvData = useMemo(() => {
    if (inquiryList.length === 0) return [];
    const headers = Object.keys(initialDummyInquiries[0] || {}).map(key => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        key: key
    }));
    return inquiryList.map(item => {
        const newItem: any = {...item};
        Object.keys(newItem).forEach(key => {
            if (Array.isArray(newItem[key as keyof InquiryItem])) {
                newItem[key] = (newItem[key as keyof InquiryItem] as string[]).join('; ');
            }
        });
        return newItem;
    });
  }, [inquiryList]);

  // Dynamic Filter Options
  const recordStatusOptions = useMemo(() => [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }],[]);
  const inquiryTypeOptions = useMemo(() => Array.from(new Set(inquiryList.map(item => item.inquiry_type).filter(Boolean))).map(type => ({ value: type, label: type })), [inquiryList]);
  const inquiryPriorityOptions = useMemo(() => Array.from(new Set(inquiryList.map(item => item.inquiry_priority).filter(Boolean))).map(priority => ({ value: priority, label: priority })), [inquiryList]);
  const inquiryCurrentStatusOptions = useMemo(() => Array.from(new Set(inquiryList.map(item => item.inquiry_status).filter(Boolean))).map(status => ({ value: status, label: status })), [inquiryList]);
  const assignedToOptions = useMemo(() => Array.from(new Set(inquiryList.map(item => item.assigned_to).filter(Boolean))).map(assignee => ({ value: assignee, label: assignee })), [inquiryList]);
  const departmentOptions = useMemo(() => Array.from(new Set(inquiryList.map(item => item.department).filter(Boolean) as string[])).map(dept => ({ value: dept, label: dept })), [inquiryList]);
  const feedbackStatusOptions = useMemo(() => Array.from(new Set(inquiryList.map(item => item.feedback_status).filter(Boolean))).map(status => ({ value: status, label: status })), [inquiryList]);
  const { DatePickerRange } = DatePicker;


  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <InquiryListSearch onInputChange={(val) => handleSetTableData({ query: val, pageIndex: 1 })} />
        <div className="flex gap-2">
            <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
            <Button icon={<TbCloudDownload />} onClick={handleImport}>Import</Button>
            {inquiryList.length > 0 ? (
                <CSVLink data={csvData} filename="inquiries_export.csv">
                    <Button icon={<TbCloudUpload />}>Export</Button>
                </CSVLink>
            ) : (
                <Button icon={<TbCloudUpload />} disabled>Export</Button>
            )}
        </div>
      </div>
      <DataTable
        selectable
        columns={columns}
        data={pageData}
        noData={!isLoading && inquiryList.length === 0}
        loading={isLoading}
        pagingData={{
          total: total,
          pageIndex: tableData.pageIndex as number,
          pageSize: tableData.pageSize as number,
        }}
        checkboxChecked={(row) => selectedInquiries.some((selected) => selected.id === row.id)}
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
        width={480} // Can be wider if many filters
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button>
            <Button size="sm" variant="solid" form="filterInquiryForm" type="submit">Apply</Button>
          </div>
        }
      >
        <UiForm id="filterInquiryForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}>
          <div className="sm:grid grid-cols-2 gap-x-4 gap-y-2"> {/* Adjusted gap */}
            <UiFormItem label="Record Status">
              <Controller name="filterRecordStatus" control={filterFormMethods.control}
                render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={recordStatusOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} />
            </UiFormItem>
            <UiFormItem label="Inquiry Type">
              <Controller name="filterInquiryType" control={filterFormMethods.control}
                render={({ field }) => <UiSelect isMulti placeholder="Select Type" options={inquiryTypeOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} />
            </UiFormItem>
            <UiFormItem label="Inquiry Priority">
              <Controller name="filterInquiryPriority" control={filterFormMethods.control}
                render={({ field }) => <UiSelect isMulti placeholder="Select Priority" options={inquiryPriorityOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} />
            </UiFormItem>
            <UiFormItem label="Inquiry Current Status">
              <Controller name="filterInquiryCurrentStatus" control={filterFormMethods.control}
                render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={inquiryCurrentStatusOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} />
            </UiFormItem>
            <UiFormItem label="Assigned To">
              <Controller name="filterAssignedTo" control={filterFormMethods.control}
                render={({ field }) => <UiSelect isMulti placeholder="Select Assignee" options={assignedToOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} />
            </UiFormItem>
            <UiFormItem label="Department">
              <Controller name="filterDepartment" control={filterFormMethods.control}
                render={({ field }) => <UiSelect isMulti placeholder="Select Department" options={departmentOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} />
            </UiFormItem>
            <UiFormItem label="Feedback Status">
              <Controller name="filterFeedbackStatus" control={filterFormMethods.control}
                render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={feedbackStatusOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} />
            </UiFormItem>
            <UiFormItem label="Inquiry Date Range" className="col-span-2">
              <Controller name="filterInquiryDate" control={filterFormMethods.control}
                render={({ field }) => <DatePickerRange placeholder="Select Inquiry Dates" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />} />
            </UiFormItem>
            <UiFormItem label="Response Date Range" className="col-span-2">
              <Controller name="filterResponseDate" control={filterFormMethods.control}
                render={({ field }) => <DatePickerRange placeholder="Select Response Dates" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />} />
            </UiFormItem>
            <UiFormItem label="Resolution Date Range" className="col-span-2">
              <Controller name="filterResolutionDate" control={filterFormMethods.control}
                render={({ field }) => <DatePickerRange placeholder="Select Resolution Dates" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />} />
            </UiFormItem>
            <UiFormItem label="Follow-up Date Range" className="col-span-2">
              <Controller name="filterFollowUpDate" control={filterFormMethods.control}
                render={({ field }) => <DatePickerRange placeholder="Select Follow-up Dates" value={field.value as [Date | null, Date | null]} onChange={field.onChange} />} />
            </UiFormItem>
          </div>
        </UiForm>
      </Drawer>
    </>
  );
};
// --- End InquiryListTable ---


// --- InquiryListSelected Component ---
const InquiryListSelected = () => {
  const {
    selectedInquiries,
    setSelectedInquiries,
    inquiryList,
    setInquiryList,
    setInquiryListTotal
  } = useInquiryList();

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [sendMessageLoading, setSendMessageLoading] = useState(false);

  const handleDelete = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);

  const handleConfirmDelete = () => {
    const newInquiryList = inquiryList.filter(
      (item) => !selectedInquiries.some((selected) => selected.id === item.id)
    );
    setInquiryList(newInquiryList);
    setInquiryListTotal(newInquiryList.length);
    setSelectedInquiries([]);
    setDeleteConfirmationOpen(false);
    toast.push(<Notification type="success" title="Inquiries Deleted">Selected inquiries have been removed.</Notification>, { placement: "top-center" });
  };

  const handleSend = () => {
    setSendMessageLoading(true);
    setTimeout(() => {
      toast.push(<Notification type="success" title="Message Sent">Message sent to selected inquiry contacts!</Notification>, {
        placement: "top-center",
      });
      setSendMessageLoading(false);
      setSendMessageDialogOpen(false);
      setSelectedInquiries([]);
    }, 500);
  };

  if (selectedInquiries.length === 0) {
    return null;
  }

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
                <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
                <span className="font-semibold flex items-center gap-1">
                    <span className="heading-text">{selectedInquiries.length} Inquiries</span>
                    <span>selected</span>
                </span>
                </span>
            </span>
            <div className="flex items-center">
                <Button
                    size="sm"
                    className="ltr:mr-3 rtl:ml-3"
                    type="button"
                    customColorClass={() => "border-red-500 ring-1 ring-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"}
                    onClick={handleDelete}
                >
                    Delete
                </Button>
                <Button size="sm" variant="solid" onClick={() => setSendMessageDialogOpen(true)}>
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
      >
        <p>Are you sure you want to remove these inquiries? This action can't be undone.</p>
      </ConfirmDialog>
      <Dialog
        isOpen={sendMessageDialogOpen}
        onRequestClose={() => setSendMessageDialogOpen(false)}
        onClose={() => setSendMessageDialogOpen(false)}
      >
        <h5 className="mb-2">Send Message</h5>
        <p>Send message regarding the following inquiries:</p>
        {/* Displaying inquiry subjects or IDs might be more relevant than contact person avatars here */}
        <div className="mt-4 max-h-32 overflow-y-auto">
            {selectedInquiries.map((inquiry) => (
                <div key={inquiry.id} className="text-sm p-1 border-b dark:border-gray-700">
                    <Tooltip title={`${inquiry.inquiry_id}: ${inquiry.inquiry_subject} (Contact: ${inquiry.contact_person_name})`}>
                        <span>{inquiry.inquiry_id} - {inquiry.company_name}</span>
                    </Tooltip>
                </div>
            ))}
        </div>
        <div className="my-4">
          <RichTextEditor content={""} /> {/* Manage content state if needed */}
        </div>
        <div className="ltr:justify-end flex items-center gap-2">
          <Button size="sm" onClick={() => setSendMessageDialogOpen(false)}>Cancel</Button>
          <Button size="sm" variant="solid" loading={sendMessageLoading} onClick={handleSend}>Send</Button>
        </div>
      </Dialog>
    </>
  );
};
// --- End InquiryListSelected ---


// --- Main Inquiries Page Component ---
const Inquiries = () => {
  return (
    <InquiryListProvider>
      <>
        <Container>
          <AdaptiveCard>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h5>Inquiries</h5>
                <InquiryListActionTools />
              </div>
              <InquiryListTable /> {/* Table tools (search, filter button, export/import) are inside InquiryListTable */}
            </div>
          </AdaptiveCard>
        </Container>
        <InquiryListSelected />
      </>
    </InquiryListProvider>
  );
};

export default Inquiries;