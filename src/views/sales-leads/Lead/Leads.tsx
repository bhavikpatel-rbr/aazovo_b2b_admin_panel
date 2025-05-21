// src/views/your-path/LeadsListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom';
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Tag from "@/components/ui/Tag";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Avatar from "@/components/ui/Avatar";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import InputNumber from "@/components/ui/Input/InputNumber";
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
  DatePicker,
} from "@/components/ui";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbCloudUpload,
  TbFilter,
  TbPlus,
  TbBox,
  TbDotsVertical,
  TbShare,
  TbEye,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import Textarea from "@/views/ui-components/forms/Input/Textarea";

// --- Define Lead Types ---
export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Negotiation"
  | "Follow Up"
  | "Lost"
  | "Won"
  | string;
export type EnquiryType =
  | "Product Info"
  | "Quote Request"
  | "Demo Request"
  | "Support"
  | "Partnership"
  | "Sourcing"
  | "Other"
  | string;
export type LeadIntent = "Buy" | "Sell" | "Inquire" | "Partner" | string; // For the lead itself
export type ProductCondition = "New" | "Used" | "Refurbished" | string; // For the product in the lead form

// This represents the data displayed in the LEADS LISTING table
export type LeadListItem = {
  id: string | number;
  leadNumber: string;
  status: LeadStatus;
  enquiryType: EnquiryType;
  productName?: string | null; // Product of interest for the lead
  memberId: string; // ID of the lead/member/customer associated
  memberName?: string; // Display name of the member
  intent?: LeadIntent; // Lead's primary goal
  qty?: number | null;
  targetPrice?: number | null;
  salesPersonId?: string | number | null; // ID of assigned salesperson
  salesPersonName?: string | null;
  createdAt: Date;
  // Store the detailed form data separately if needed, or flatten for display
  // This is for complex leads that might have been created via the detailed form
  sourcingDetails?: LeadFormData; // Optional: if a lead was created with the detailed form
};

// This represents the data for the ADD/EDIT LEAD form (which is more like a sourcing/supply request)
export type LeadFormData = {
  // Fields from your "add edit field" list
  supplierId?: string | number | null; // Selection
  productId?: number | null; // Selection
  qty?: number | null;
  productStatus?: string | null; // Selection (e.g., 'In Stock', 'Available on Order')
  productSpecId?: number | null; // Selection
  internalRemarks?: string | null;
  deviceType?: string | null; // Text input
  price?: number | null;
  color?: string | null;
  cartoonTypeId?: number | null; // Selection
  dispatchStatus?: string | null; // Text input
  paymentTermId?: number | null; // Selection
  deviceCondition?: ProductCondition | null; // Selection (New/Used)
  eta?: string | null; // Text input
  location?: string | null; // Text input

  // Core lead fields that might also be on this detailed form
  leadStatus?: LeadStatus; // Status of this lead/request
  enquiryType?: EnquiryType;
  leadIntent?: LeadIntent;
  targetPriceForm?: number | null; // Differentiate from listing targetPrice if needed
  assignedSalesPersonId?: string | number | null;
  // For linking to an existing member or creating a new one
  memberInfo?: {
    id?: string; // Existing member ID
    name: string;
    email: string;
    phone?: string;
  };
};

// --- Zod Schema for Add/Edit Lead Form (Detailed Form) ---
const leadFormSchema = z.object({
  supplierId: z.union([z.string(), z.number()]).nullable().optional(),
  productId: z
    .number({ errorMap: () => ({ message: "Product selection is required." }) })
    .nullable()
    .optional(),
  qty: z.number().min(1, "Quantity must be at least 1.").nullable().optional(),
  productStatus: z.string().nullable().optional(),
  productSpecId: z.number().nullable().optional(),
  internalRemarks: z.string().nullable().optional(),
  deviceType: z.string().max(100).nullable().optional(),
  price: z.number().min(0, "Price cannot be negative.").nullable().optional(),
  color: z.string().max(50).nullable().optional(),
  cartoonTypeId: z.number().nullable().optional(),
  dispatchStatus: z.string().max(100).nullable().optional(),
  paymentTermId: z.number().nullable().optional(),
  deviceCondition: z.string().nullable().optional(),
  eta: z.string().max(100).nullable().optional(),
  location: z.string().max(100).nullable().optional(),

  // Core lead fields
  leadStatus: z.string().min(1, "Lead status is required."),
  enquiryType: z.string().min(1, "Enquiry type is required."),
  leadIntent: z.string().min(1, "Lead intent is required."),
  targetPriceForm: z.number().min(0).nullable().optional(),
  assignedSalesPersonId: z
    .union([z.string(), z.number()])
    .nullable()
    .optional(),
  memberInfo: z.object({
    id: z.string().optional(), // Optional if creating new member
    name: z.string().min(1, "Member name is required."),
    email: z
      .string()
      .email("Invalid email address for member.")
      .min(1, "Member email is required."),
    phone: z.string().nullable().optional(),
  }),
});
// type LeadFormData inferred from schema is already correct

// --- Zod Schema for Filter Form (for Leads Listing) ---
const selectOptionSchema = z.object({ value: z.any(), label: z.string() });
const filterFormSchema = z.object({
  filterStatuses: z.array(selectOptionSchema).optional().default([]),
  filterEnquiryTypes: z.array(selectOptionSchema).optional().default([]),
  filterIntents: z.array(selectOptionSchema).optional().default([]),
  filterProductIds: z.array(selectOptionSchema).optional().default([]), // Assuming product can be linked to a lead
  filterSalesPersonIds: z.array(selectOptionSchema).optional().default([]),
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- UI Constants ---
const leadStatusColor: Record<LeadStatus, string> = {
  New: "bg-sky-100 text-sky-700",
  Contacted: "bg-blue-100 text-blue-700",
  Qualified: "bg-indigo-100 text-indigo-700",
  "Proposal Sent": "bg-purple-100 text-purple-700",
  Negotiation: "bg-violet-100 text-violet-700",
  "Follow Up": "bg-amber-100 text-amber-700",
  Won: "bg-emerald-100 text-emerald-700",
  Lost: "bg-red-100 text-red-700",
};
const enquiryTypeColor: Record<EnquiryType, string> = {
  "Product Info": "bg-gray-100 text-gray-700",
  "Quote Request": "bg-cyan-100 text-cyan-700",
  "Demo Request": "bg-teal-100 text-teal-700",
  Support: "bg-pink-100 text-pink-700",
  Partnership: "bg-lime-100 text-lime-700",
  Sourcing: "bg-fuchsia-100 text-fuchsia-700",
  Other: "bg-stone-100 text-stone-700",
};
const leadStatusOptions = Object.keys(leadStatusColor).map((s) => ({
  value: s,
  label: s,
}));
const enquiryTypeOptions = Object.keys(enquiryTypeColor).map((s) => ({
  value: s,
  label: s,
}));
const leadIntentOptions = [
  { value: "Buy", label: "Buy" },
  { value: "Sell", label: "Sell" },
  { value: "Inquire", label: "Inquire" },
  { value: "Partner", label: "Partner" },
];
const productStatusOptionsForm = [
  { value: "In Stock", label: "In Stock" },
  { value: "Available on Order", label: "Available on Order" },
  { value: "Low Stock", label: "Low Stock" },
];
const deviceConditionOptionsForm = [
  { value: "New", label: "New" },
  { value: "Used", label: "Used" },
  { value: "Refurbished", label: "Refurbished" },
];

// --- Dummy Data for Selects in Form (Replace with actual data) ---
const dummySuppliers = [
  { id: "SUP001", name: "Supplier Alpha" },
  { id: "SUP002", name: "Supplier Beta" },
];
const dummyProducts = [
  { id: 1, name: "iPhone 15 Pro" },
  { id: 2, name: "Samsung Galaxy S24 Ultra" },
  { id: 3, name: "MacBook Air M3" },
];
const dummyProductSpecs = [
  { id: 1, name: "256GB, Blue", productId: 1 },
  { id: 2, name: "512GB, Black", productId: 2 },
  { id: 3, name: "16GB RAM, 512GB SSD", productId: 3 },
];
const dummyCartoonTypes = [
  { id: 1, name: "Master Carton" },
  { id: 2, name: "Inner Box" },
];
const dummyPaymentTerms = [
  { id: 1, name: "Net 30" },
  { id: 2, name: "COD" },
  { id: 3, name: "Advance" },
];
const dummySalesPersons = [
  { id: "SP001", name: "Alice Wonder" },
  { id: "SP002", name: "Bob The Builder" },
];

// --- Initial Dummy Leads Data ---
const initialDummyLeads: LeadListItem[] = [
  {
    id: "L001",
    leadNumber: "LD2024001",
    status: "New",
    enquiryType: "Quote Request",
    productName: "iPhone 15 Pro",
    memberId: "CUST101",
    memberName: "John Doe",
    intent: "Buy",
    qty: 10,
    targetPrice: 950,
    salesPersonId: "SP001",
    salesPersonName: "Alice Wonder",
    createdAt: dayjs().subtract(1, "day").toDate(),
    sourcingDetails: {
      productId: 1,
      productSpecId: 1,
      qty: 10,
      price: 950,
      deviceCondition: "New",
      internalRemarks: "Urgent request",
    },
  },
  {
    id: "L002",
    leadNumber: "LD2024002",
    status: "Contacted",
    enquiryType: "Product Info",
    productName: "Samsung S24 Ultra",
    memberId: "CUST102",
    memberName: "Jane Smith",
    intent: "Inquire",
    salesPersonId: "SP002",
    salesPersonName: "Bob The Builder",
    createdAt: dayjs().subtract(2, "day").toDate(),
  },
  {
    id: "L003",
    leadNumber: "LD2024003",
    status: "Qualified",
    enquiryType: "Sourcing",
    productName: "MacBook Air M3",
    memberId: "CUST103",
    memberName: "Alex Buyer",
    intent: "Buy",
    qty: 5,
    salesPersonId: "SP001",
    salesPersonName: "Alice Wonder",
    createdAt: dayjs().subtract(3, "day").toDate(),
    sourcingDetails: {
      productId: 3,
      productSpecId: 3,
      qty: 5,
      deviceCondition: "New",
      location: "Dubai",
    },
  },
  {
    id: "L004",
    leadNumber: "LD2024004",
    status: "Won",
    enquiryType: "Quote Request",
    productName: "iPhone 15 Pro",
    memberId: "CUST101",
    memberName: "John Doe",
    intent: "Buy",
    qty: 5,
    targetPrice: 960,
    salesPersonId: "SP001",
    salesPersonName: "Alice Wonder",
    createdAt: dayjs().subtract(10, "day").toDate(),
  },
];

// CSV Exporter
const CSV_LEAD_HEADERS = [
  "ID",
  "Lead Number",
  "Status",
  "Enquiry Type",
  "Product Name",
  "Member ID",
  "Member Name",
  "Intent",
  "Qty",
  "Target Price",
  "Sales Person",
  "Created At",
];
const CSV_LEAD_KEYS: (keyof LeadListItem)[] = [
  "id",
  "leadNumber",
  "status",
  "enquiryType",
  "productName",
  "memberId",
  "memberName",
  "intent",
  "qty",
  "targetPrice",
  "salesPersonName",
  "createdAt",
];

function exportLeadsToCsv(filename: string, rows: LeadListItem[]) {
  // ... (Standard CSV export logic, adapt keys and headers)
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

// --- ActionColumn, Search, TableTools, DataTable, SelectedFooter ---
// ActionColumn
const ActionColumn = ({
  onView,
  onDelete,
  onAssign,
  onChangeStatus,
  onConvertToOpportunity,
  onViewDetail,
  onEdit,
}: {
  onView: () => void;
  onEdit: () => void;
  onViewDetail: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onChangeStatus: () => void;
  onConvertToOpportunity: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
          role="button"
        >
          <TbDotsVertical />
        </div>
      </Tooltip>
    </div>
  );
};

// Search
type LeadSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const LeadSearch = React.forwardRef<HTMLInputElement, LeadSearchProps>(
  ({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
LeadSearch.displayName = "LeadSearch";

// TableTools
const LeadTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onAddNew,
}: {
  onSearchChange: (q: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onAddNew: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <LeadSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>
    </div>
  </div>
);

// DataTable
type LeadTableProps = {
  columns: ColumnDef<LeadListItem>[];
  data: LeadListItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: LeadListItem[];
  onPaginationChange: (p: number) => void;
  onSelectChange: (v: number) => void;
  onSort: (s: OnSortParam) => void;
  onRowSelect: (c: boolean, r: LeadListItem) => void;
  onAllRowSelect: (c: boolean, rs: Row<LeadListItem>[]) => void;
};
const LeadTable = (props: LeadTableProps) => (
  <DataTable
    selectable
    columns={props.columns}
    data={props.data}
    loading={props.loading}
    pagingData={props.pagingData}
    checkboxChecked={(row) => props.selectedItems.some((s) => s.id === row.id)}
    onPaginationChange={props.onPaginationChange}
    onSelectChange={props.onSelectChange}
    onSort={props.onSort}
    onCheckBoxChange={props.onRowSelect}
    onIndeterminateCheckBoxChange={props.onAllRowSelect}
    noData={!props.loading && props.data.length === 0}
  />
);

// SelectedFooter
type LeadSelectedFooterProps = {
  selectedItems: LeadListItem[];
  onDeleteSelected: () => void;
};
const LeadSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: LeadSelectedFooterProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4"
        stickyClass="-mx-4 sm:-mx-8 border-t px-8"
      >
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2">
            <TbChecks className="text-xl text-primary-500" />
            <span className="font-semibold">
              {selectedItems.length} lead{selectedItems.length > 1 ? "s" : ""}{" "}
              selected
            </span>
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-500 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteOpen}
        type="danger"
        title={`Delete ${selectedItems.length} leads?`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteOpen(false);
        }}
        onCancel={() => setDeleteOpen(false)}
      >
        <p>This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

// --- Main LeadsListing Component ---
const LeadsListing = () => {
  const [allLeads, setAllLeads] = useState<LeadListItem[]>(initialDummyLeads);
  const [loadingStatus, setLoadingStatus] = useState<
    "idle" | "loading" | "succeeded" | "failed"
  >("idle");

  const dispatchSimulated = useCallback(
    async (action: { type: string; payload?: any }) => {
      setLoadingStatus("loading");
      await new Promise((res) => setTimeout(res, 300));
      try {
        switch (action.type) {
          case "leads/get":
            setAllLeads(initialDummyLeads);
            break;
          case "leads/add":
            const newLead: LeadListItem = {
              id: `L${Date.now()}`,
              leadNumber: `LD${Date.now().toString().slice(-7)}`,
              status: action.payload.leadStatus,
              enquiryType: action.payload.enquiryType,
              productName: dummyProducts.find(
                (p) => p.id === action.payload.productId
              )?.name,
              memberId: action.payload.memberInfo.id || `NEW_MEM_${Date.now()}`, // Generate if new
              memberName: action.payload.memberInfo.name,
              intent: action.payload.leadIntent,
              qty: action.payload.qty,
              targetPrice: action.payload.targetPriceForm,
              salesPersonId: action.payload.assignedSalesPersonId,
              salesPersonName: dummySalesPersons.find(
                (sp) => sp.id === action.payload.assignedSalesPersonId
              )?.name,
              createdAt: new Date(),
              sourcingDetails: { ...action.payload }, // Store all form data in sourcingDetails
            };
            setAllLeads((prev) => [newLead, ...prev]);
            break;
          case "leads/edit": // Edit might be complex, focusing on status/assignment for now
            setAllLeads((prev) =>
              prev.map((lead) =>
                lead.id === action.payload.id
                  ? { ...lead, ...action.payload.data, updatedAt: new Date() }
                  : lead
              )
            );
            break;
          case "leads/delete":
            setAllLeads((prev) =>
              prev.filter((lead) => lead.id !== action.payload.id)
            );
            break;
          case "leads/deleteAll":
            const idsToDelete = new Set(
              (action.payload.ids as string).split(",")
            );
            setAllLeads((prev) =>
              prev.filter((lead) => !idsToDelete.has(String(lead.id)))
            );
            break;
          // Add cases for assign, changeStatus, convertToOpportunity
          case "leads/assign":
            setAllLeads((prev) =>
              prev.map((lead) =>
                lead.id === action.payload.id
                  ? {
                      ...lead,
                      salesPersonId: action.payload.salesPersonId,
                      salesPersonName: dummySalesPersons.find(
                        (sp) => sp.id === action.payload.salesPersonId
                      )?.name,
                      updatedAt: new Date(),
                    }
                  : lead
              )
            );
            break;
          case "leads/changeStatus":
            setAllLeads((prev) =>
              prev.map((lead) =>
                lead.id === action.payload.id
                  ? {
                      ...lead,
                      status: action.payload.newStatus,
                      updatedAt: new Date(),
                    }
                  : lead
              )
            );
            break;
          default:
            console.warn("Unknown action for leads");
        }
        setLoadingStatus("succeeded");
        return { unwrap: () => Promise.resolve() };
      } catch (e) {
        setLoadingStatus("failed");
        return { unwrap: () => Promise.reject(e) };
      }
    },
    []
  );

  useEffect(() => {
    dispatchSimulated({ type: "leads/get" });
  }, [dispatchSimulated]);

  const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [isChangeStatusDrawerOpen, setIsChangeStatusDrawerOpen] =
    useState(false);

  const [editingLead, setEditingLead] = useState<LeadListItem | null>(null); // For Add/Edit/View/Assign/StatusChange

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const formMethods = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
  });
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

  const openAddDrawer = useCallback(() => {
    setEditingLead(null);
    formMethods.reset({
      // Default values for the detailed LeadFormData
      supplierId: null,
      productId: null,
      qty: null,
      productStatus: productStatusOptionsForm[0]?.value,
      productSpecId: null,
      internalRemarks: null,
      deviceType: null,
      price: null,
      color: null,
      cartoonTypeId: null,
      dispatchStatus: null,
      paymentTermId: null,
      deviceCondition: deviceConditionOptionsForm[0]?.value,
      eta: null,
      location: null,
      leadStatus: leadStatusOptions[0]?.value,
      enquiryType: enquiryTypeOptions[0]?.value,
      leadIntent: leadIntentOptions[0]?.value,
      targetPriceForm: null,
      assignedSalesPersonId: null,
      memberInfo: { name: "", email: "", phone: "" },
    });
    setIsAddEditDrawerOpen(true);
  }, [formMethods]);

  // For EDIT: The edit form might be simpler, focusing on core lead fields rather than all sourcing details.
  // Or, it could load the sourcingDetails into the full form if a lead was created that way.
  const openEditDrawer = useCallback(
    (lead: LeadListItem) => {
      setEditingLead(lead);
      formMethods.reset({
        // Populate with existing lead data, including sourcingDetails if present
        ...(lead.sourcingDetails || {}), // Spread sourcing details first
        leadStatus: lead.status,
        enquiryType: lead.enquiryType,
        leadIntent: lead.intent,
        targetPriceForm: lead.targetPrice,
        assignedSalesPersonId: lead.salesPersonId,
        memberInfo: {
          id: lead.memberId,
          name: lead.memberName || "",
          email: "",
          phone: "",
        }, // Need to fetch/have member email/phone
      });
      setIsAddEditDrawerOpen(true);
    },
    [formMethods]
  );

  const closeAddEditDrawer = useCallback(() => {
    setIsAddEditDrawerOpen(false);
    setEditingLead(null);
  }, []);
  const openViewDrawer = useCallback((lead: LeadListItem) => {
    setEditingLead(lead);
    setIsViewDrawerOpen(true);
  }, []);
  const closeViewDrawer = useCallback(() => {
    setIsViewDrawerOpen(false);
    setEditingLead(null);
  }, []);

  const openAssignDrawer = useCallback(
    (lead: LeadListItem) => {
      setEditingLead(lead);
      assignFormMethods.reset({ salesPersonId: lead.salesPersonId || null });
      setIsAssignDrawerOpen(true);
    },
    [assignFormMethods]
  );
  const closeAssignDrawer = useCallback(() => {
    setIsAssignDrawerOpen(false);
    setEditingLead(null);
  }, []);

  const openChangeStatusDrawer = useCallback(
    (lead: LeadListItem) => {
      setEditingLead(lead);
      statusFormMethods.reset({ newStatus: lead.status });
      setIsChangeStatusDrawerOpen(true);
    },
    [statusFormMethods]
  );
  const closeChangeStatusDrawer = useCallback(() => {
    setIsChangeStatusDrawerOpen(false);
    setEditingLead(null);
  }, []);

  const onFormSubmit = useCallback(
    async (data: LeadFormData) => {
      // For Add/Edit Lead
      setIsSubmitting(true);
      try {
        if (editingLead && editingLead.id) {
          // Editing existing lead
          // For edit, decide which fields are updatable.
          // The simulated dispatch for edit is very basic currently.
          await dispatchSimulated({
            type: "leads/edit",
            payload: { id: editingLead.id, data: data },
          }).unwrap();
          toast.push(
            <Notification title="Success" type="success">
              Lead updated.
            </Notification>
          );
        } else {
          // Adding new lead
          await dispatchSimulated({
            type: "leads/add",
            payload: data,
          }).unwrap();
          toast.push(
            <Notification title="Success" type="success">
              New lead created.
            </Notification>
          );
        }
        closeAddEditDrawer();
      } catch (error: any) {
        toast.push(
          <Notification title="Error" type="danger">
            {error.message || "Operation failed."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated, editingLead, closeAddEditDrawer]
  );

  const onAssignSubmit = useCallback(
    async (data: { salesPersonId: string | number | null }) => {
      if (!editingLead) return;
      setIsSubmitting(true);
      try {
        await dispatchSimulated({
          type: "leads/assign",
          payload: { id: editingLead.id, salesPersonId: data.salesPersonId },
        }).unwrap();
        toast.push(
          <Notification title="Success" type="success">
            Lead assigned.
          </Notification>
        );
        closeAssignDrawer();
      } catch (error: any) {
        toast.push(
          <Notification title="Error" type="danger">
            Assignment failed.
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated, editingLead, closeAssignDrawer]
  );

  const onChangeStatusSubmit = useCallback(
    async (data: { newStatus: LeadStatus }) => {
      if (!editingLead) return;
      setIsSubmitting(true);
      try {
        await dispatchSimulated({
          type: "leads/changeStatus",
          payload: { id: editingLead.id, newStatus: data.newStatus },
        }).unwrap();
        toast.push(
          <Notification title="Success" type="success">
            Status updated.
          </Notification>
        );
        closeChangeStatusDrawer();
      } catch (error: any) {
        toast.push(
          <Notification title="Error" type="danger">
            Status update failed.
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated, editingLead, closeChangeStatusDrawer]
  );

  const handleConvertToOpportunity = useCallback((lead: LeadListItem) => {
    // Logic to convert lead to opportunity
    // This might involve creating a new opportunity record, updating lead status, etc.
    toast.push(
      <Notification
        title="Convert"
        type="info"
      >{`Converting lead ${lead.leadNumber} to opportunity... (Not Implemented)`}</Notification>
    );
    // Example: dispatchSimulated({ type: 'leads/convertToOpportunity', payload: { id: lead.id } });
  }, []);

  const handleDeleteClick = useCallback((item: LeadListItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatchSimulated({
        type: "leads/delete",
        payload: { id: itemToDelete.id },
      }).unwrap();
      toast.push(
        <Notification title="Deleted" type="success">
          Lead deleted.
        </Notification>
      );
      setSelectedItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
    } catch (e: any) {
      toast.push(
        <Notification title="Error" type="danger">
          {e.message || "Delete failed."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatchSimulated, itemToDelete]);

  const onDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const ids = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatchSimulated({
        type: "leads/deleteAll",
        payload: { ids },
      }).unwrap();
      toast.push(
        <Notification title="Success" type="success">
          {selectedItems.length} leads deleted.
        </Notification>
      );
      setSelectedItems([]);
    } catch (e: any) {
      toast.push(
        <Notification title="Error" type="danger">
          {e.message || "Bulk delete failed."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatchSimulated, selectedItems]);

  // Filter Drawer handlers
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
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
    handleSetTableData({ pageIndex: 1 });
  }, [filterFormMethods, handleSetTableData]);

  // Table data processing
  type ProcessedDataType = {
    pageData: LeadListItem[];
    total: number;
    allFilteredAndSortedData: LeadListItem[];
  };
  const { pageData, total, allFilteredAndSortedData } =
    useMemo((): ProcessedDataType => {
      let processedData: LeadListItem[] = cloneDeep(allLeads);
      // Apply Filters (based on LeadListItem fields)
      if (
        filterCriteria.dateRange &&
        (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])
      ) {
        const [startDate, endDate] = filterCriteria.dateRange;
        const start = startDate ? dayjs(startDate).startOf("day") : null;
        const end = endDate ? dayjs(endDate).endOf("day") : null;
        processedData = processedData.filter((item) => {
          const itemDate = dayjs(item.createdAt);
          if (start && end) return itemDate.isBetween(start, end, null, "[]");
          if (start) return itemDate.isSameOrAfter(start, "day");
          if (end) return itemDate.isSameOrBefore(end, "day");
          return true;
        });
      }
      if (
        filterCriteria.filterStatuses &&
        filterCriteria.filterStatuses.length > 0
      ) {
        const statuses = new Set(
          filterCriteria.filterStatuses.map((opt) => opt.value)
        );
        processedData = processedData.filter((item) =>
          statuses.has(item.status)
        );
      }
      if (
        filterCriteria.filterEnquiryTypes &&
        filterCriteria.filterEnquiryTypes.length > 0
      ) {
        const types = new Set(
          filterCriteria.filterEnquiryTypes.map((opt) => opt.value)
        );
        processedData = processedData.filter((item) =>
          types.has(item.enquiryType)
        );
      }
      if (
        filterCriteria.filterIntents &&
        filterCriteria.filterIntents.length > 0
      ) {
        const intents = new Set(
          filterCriteria.filterIntents.map((opt) => opt.value)
        );
        processedData = processedData.filter(
          (item) => item.intent && intents.has(item.intent)
        );
      }
      if (
        filterCriteria.filterProductIds &&
        filterCriteria.filterProductIds.length > 0
      ) {
        const productIds = new Set(
          filterCriteria.filterProductIds.map((opt) => opt.value)
        );
        processedData = processedData.filter(
          (item) =>
            item.sourcingDetails?.productId &&
            productIds.has(item.sourcingDetails.productId)
        );
      }
      if (
        filterCriteria.filterSalesPersonIds &&
        filterCriteria.filterSalesPersonIds.length > 0
      ) {
        const spIds = new Set(
          filterCriteria.filterSalesPersonIds.map((opt) => opt.value)
        );
        processedData = processedData.filter(
          (item) => item.salesPersonId && spIds.has(item.salesPersonId)
        );
      }

      if (tableData.query && tableData.query.trim() !== "") {
        const query = tableData.query.toLowerCase().trim();
        processedData = processedData.filter(
          (item) =>
            String(item.id).toLowerCase().includes(query) ||
            item.leadNumber.toLowerCase().includes(query) ||
            (item.productName &&
              item.productName.toLowerCase().includes(query)) ||
            (item.memberName &&
              item.memberName.toLowerCase().includes(query)) ||
            item.memberId.toLowerCase().includes(query) ||
            (item.salesPersonName &&
              item.salesPersonName.toLowerCase().includes(query)) ||
            item.status.toLowerCase().includes(query) ||
            item.enquiryType.toLowerCase().includes(query)
        );
      }
      const { order, key } = tableData.sort as OnSortParam;
      if (order && key && processedData.length > 0) {
        processedData.sort((a, b) => {
          let aVal = a[key as keyof LeadListItem];
          let bVal = b[key as keyof LeadListItem];
          if (key === "createdAt") {
            // Date sorting
            return order === "asc"
              ? dayjs(aVal as Date).valueOf() - dayjs(bVal as Date).valueOf()
              : dayjs(bVal as Date).valueOf() - dayjs(aVal as Date).valueOf();
          }
          if (typeof aVal === "number" && typeof bVal === "number")
            return order === "asc" ? aVal - bVal : bVal - aVal;
          return order === "asc"
            ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
            : String(bVal ?? "").localeCompare(String(aVal ?? ""));
        });
      }
      const currentTotal = processedData.length;
      const pageIndex = tableData.pageIndex as number;
      const pageSize = tableData.pageSize as number;
      const startIndex = (pageIndex - 1) * pageSize;
      return {
        pageData: processedData.slice(startIndex, startIndex + pageSize),
        total: currentTotal,
        allFilteredAndSortedData: processedData,
      };
    }, [allLeads, tableData, filterCriteria]);

  const handleExportData = useCallback(
    () => exportLeadsToCsv("leads_export.csv", allFilteredAndSortedData),
    [allFilteredAndSortedData]
  );
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

  const columns: ColumnDef<LeadListItem>[] = useMemo(
    () => [
      {
        header: "Status",
        accessorKey: "status",
        size: 120,
        cell: (props: CellContext<LeadListItem, any>) => (
          <Tag
            className={`${
              leadStatusColor[props.row.original.status] ||
              "bg-gray-200 text-gray-700"
            } text-white capitalize px-2 py-1 text-xs`}
          >
            {props.row.original.status}
          </Tag>
        ),
      },
      {
        header: "Enquiry Type",
        accessorKey: "enquiryType",
        size: 140,
        cell: (props: CellContext<LeadListItem, any>) => (
          <Tag
            className={`${
              enquiryTypeColor[props.row.original.enquiryType] || "bg-gray-100"
            } capitalize px-2 py-1 text-xs`}
          >
            {props.row.original.enquiryType}
          </Tag>
        ),
      },
      { header: "Lead Number", accessorKey: "leadNumber", size: 130 },
      {
        header: "Product",
        accessorKey: "productName",
        size: 180,
        cell: (props: CellContext<LeadListItem, any>) =>
          props.row.original.productName || "-",
      },
      {
        header: "Member",
        accessorKey: "memberName",
        size: 150,
        cell: (props: CellContext<LeadListItem, any>) =>
          props.row.original.memberName || props.row.original.memberId,
      },
      {
        header: "Intent",
        accessorKey: "intent",
        size: 90,
        cell: (props: CellContext<LeadListItem, any>) =>
          props.row.original.intent || "-",
      },
      {
        header: "Qty",
        accessorKey: "qty",
        size: 70,
        cell: (props: CellContext<LeadListItem, any>) =>
          props.row.original.qty ?? "-",
      },
      {
        header: "Target Price",
        accessorKey: "targetPrice",
        size: 110,
        cell: (props: CellContext<LeadListItem, any>) =>
          props.row.original.targetPrice !== null
            ? `$${props.row.original.targetPrice}`
            : "-",
      },
      {
        header: "Sales Person",
        accessorKey: "salesPersonName",
        size: 140,
        cell: (props: CellContext<LeadListItem, any>) =>
          props.row.original.salesPersonName || "Unassigned",
      },
      {
        header: "Created At",
        accessorKey: "createdAt",
        size: 160,
        cell: (props: CellContext<LeadListItem, any>) =>
          dayjs(props.row.original.createdAt).format("YYYY-MM-DD HH:mm"),
      },
      {
        header: "Actions",
        id: "actions",
        size: 200,
        meta: { HeaderClass: "text-center" },
        cell: (props: CellContext<LeadListItem, any>) => (
          <ActionColumn
            onView={() => openViewDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onAssign={() => openAssignDrawer(props.row.original)}
            onChangeStatus={() => openChangeStatusDrawer(props.row.original)}
            onConvertToOpportunity={() =>
              handleConvertToOpportunity(props.row.original)
            }
          />
        ),
      },
    ],
    [
      openViewDrawer,
      handleDeleteClick,
      openAssignDrawer,
      openChangeStatusDrawer,
      handleConvertToOpportunity,
    ]
  );

  return (
    <>
      <Container className="h-full">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Leads Listing</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              {" "}
              Add New{" "}
            </Button>
          </div>
          <LeadTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onAddNew={openAddDrawer}
          />
          <div className="mt-4">
            <LeadTable
              columns={columns}
              data={pageData}
              loading={
                loadingStatus === "loading" || isSubmitting || isDeleting
              }
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
      <LeadSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={onDeleteSelected}
      />

      {/* Add/Edit Lead Drawer (Detailed Form) */}
      <Drawer
        title={editingLead?.id ? "Edit Lead Details" : "Add New Lead"}
        isOpen={isAddEditDrawerOpen}
        onClose={closeAddEditDrawer}
        onRequestClose={closeAddEditDrawer}
        width={800} // Wider for the detailed form
      >
        <Form
          id="leadForm"
          onSubmit={formMethods.handleSubmit(onFormSubmit)}
          className="flex flex-col gap-y-4 h-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-1">
            {/* Member Info Section */}
            <FormItem
              label="Member Name"
              className="lg:col-span-1"
              invalid={!!formMethods.formState.errors.memberInfo?.name}
              errorMessage={
                formMethods.formState.errors.memberInfo?.name?.message
              }
            >
              <Controller
                name="memberInfo.name"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter member's full name" />
                )}
              />
            </FormItem>
            <FormItem
              label="Member Email"
              className="lg:col-span-1"
              invalid={!!formMethods.formState.errors.memberInfo?.email}
              errorMessage={
                formMethods.formState.errors.memberInfo?.email?.message
              }
            >
              <Controller
                name="memberInfo.email"
                control={formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    placeholder="member@example.com"
                  />
                )}
              />
            </FormItem>
            <FormItem label="Member Phone (Optional)" className="lg:col-span-1">
              <Controller
                name="memberInfo.phone"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter member's phone" />
                )}
              />
            </FormItem>

            {/* Lead Core Info */}
            <FormItem
              label="Lead Status"
              invalid={!!formMethods.formState.errors.leadStatus}
              errorMessage={formMethods.formState.errors.leadStatus?.message}
            >
              <Controller
                name="leadStatus"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={leadStatusOptions}
                    value={leadStatusOptions.find(
                      (opt) => opt.value === field.value
                    )}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Lead Status"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Enquiry Type"
              invalid={!!formMethods.formState.errors.enquiryType}
              errorMessage={formMethods.formState.errors.enquiryType?.message}
            >
              <Controller
                name="enquiryType"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={enquiryTypeOptions}
                    value={enquiryTypeOptions.find(
                      (opt) => opt.value === field.value
                    )}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Enquiry Type"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Lead Intent"
              invalid={!!formMethods.formState.errors.leadIntent}
              errorMessage={formMethods.formState.errors.leadIntent?.message}
            >
              <Controller
                name="leadIntent"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={leadIntentOptions}
                    value={leadIntentOptions.find(
                      (opt) => opt.value === field.value
                    )}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Lead Intent"
                  />
                )}
              />
            </FormItem>

            {/* Sourcing/Product Details Section */}
            <h6 className="md:col-span-2 lg:col-span-3 text-md font-semibold mt-3 mb-1 border-b">
              Product/Sourcing Details (Optional)
            </h6>
            <FormItem label="Supplier (Optional)">
              <Controller
                name="supplierId"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={dummySuppliers.map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))}
                    value={dummySuppliers
                      .map((s) => ({ value: s.id, label: s.name }))
                      .find((opt) => opt.value === field.value)}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Supplier"
                    isClearable
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Product (Optional)"
              invalid={!!formMethods.formState.errors.productId}
              errorMessage={formMethods.formState.errors.productId?.message}
            >
              <Controller
                name="productId"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={dummyProducts.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    value={dummyProducts
                      .map((p) => ({ value: p.id, label: p.name }))
                      .find((opt) => opt.value === field.value)}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Product"
                    isClearable
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Product Spec (Optional)"
              invalid={!!formMethods.formState.errors.productSpecId}
              errorMessage={formMethods.formState.errors.productSpecId?.message}
            >
              <Controller
                name="productSpecId"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={dummyProductSpecs
                      .filter(
                        (s) => s.productId === formMethods.watch("productId")
                      )
                      .map((s) => ({ value: s.id, label: s.name }))}
                    value={dummyProductSpecs
                      .map((s) => ({ value: s.id, label: s.name }))
                      .find((opt) => opt.value === field.value)}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Specification"
                    isDisabled={!formMethods.watch("productId")}
                    isClearable
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Quantity (Optional)"
              invalid={!!formMethods.formState.errors.qty}
              errorMessage={formMethods.formState.errors.qty?.message}
            >
              <Controller
                name="qty"
                control={formMethods.control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    placeholder="Enter Quantity"
                    min={1}
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Product Status (Optional)"
              invalid={!!formMethods.formState.errors.productStatus}
              errorMessage={formMethods.formState.errors.productStatus?.message}
            >
              <Controller
                name="productStatus"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={productStatusOptionsForm}
                    value={productStatusOptionsForm.find(
                      (opt) => opt.value === field.value
                    )}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Product Status"
                    isClearable
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Target/Quoted Price (Optional)"
              invalid={!!formMethods.formState.errors.price}
              errorMessage={formMethods.formState.errors.price?.message}
            >
              <Controller
                name="price"
                control={formMethods.control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    placeholder="Enter Price"
                    prefix="$"
                    min={0}
                    precision={2}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Color (Optional)">
              {" "}
              <Controller
                name="color"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., Blue" />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Cartoon Type (Optional)">
              {" "}
              <Controller
                name="cartoonTypeId"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={dummyCartoonTypes.map((ct) => ({
                      value: ct.id,
                      label: ct.name,
                    }))}
                    value={dummyCartoonTypes
                      .map((ct) => ({ value: ct.id, label: ct.name }))
                      .find((opt) => opt.value === field.value)}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Cartoon Type"
                    isClearable
                  />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Dispatch Status (Optional)">
              {" "}
              <Controller
                name="dispatchStatus"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., Ready, Pending" />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Payment Term (Optional)">
              {" "}
              <Controller
                name="paymentTermId"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={dummyPaymentTerms.map((pt) => ({
                      value: pt.id,
                      label: pt.name,
                    }))}
                    value={dummyPaymentTerms
                      .map((pt) => ({ value: pt.id, label: pt.name }))
                      .find((opt) => opt.value === field.value)}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Payment Term"
                    isClearable
                  />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Device Condition (Optional)">
              {" "}
              <Controller
                name="deviceCondition"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={deviceConditionOptionsForm}
                    value={deviceConditionOptionsForm.find(
                      (opt) => opt.value === field.value
                    )}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Select Device Condition"
                    isClearable
                  />
                )}
              />{" "}
            </FormItem>
            <FormItem label="ETA (Optional)">
              {" "}
              <Controller
                name="eta"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., 2-3 days" />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Location (Optional)">
              {" "}
              <Controller
                name="location"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., Dubai Warehouse" />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Device Type (Optional)">
              {" "}
              <Controller
                name="deviceType"
                control={formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="e.g., Smartphone, Laptop" />
                )}
              />{" "}
            </FormItem>
            <FormItem label="Assigned Sales Person (Optional)">
              <Controller
                name="assignedSalesPersonId"
                control={formMethods.control}
                render={({ field }) => (
                  <UiSelect
                    options={dummySalesPersons.map((sp) => ({
                      value: sp.id,
                      label: sp.name,
                    }))}
                    value={dummySalesPersons
                      .map((sp) => ({ value: sp.id, label: sp.name }))
                      .find((opt) => opt.value === field.value)}
                    onChange={(opt) => field.onChange(opt?.value)}
                    placeholder="Assign Sales Person"
                    isClearable
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Internal Remarks (Optional)"
              className="md:col-span-2 lg:col-span-3"
            >
              <Controller
                name="internalRemarks"
                control={formMethods.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="Internal notes about this lead or sourcing request..."
                  />
                )}
              />
            </FormItem>
          </div>
        </Form>
      </Drawer>

      {/* View Drawer */}
      <Drawer
        title="View Lead Details"
        isOpen={isViewDrawerOpen}
        onClose={closeViewDrawer}
        width={700}
      >
        {editingLead && (
          <div className="p-4 space-y-3">
            <h6 className="text-lg font-semibold border-b pb-2 mb-3">
              Lead #: {editingLead.leadNumber} (ID: {editingLead.id})
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <strong>Status:</strong>{" "}
                <Tag
                  className={`${
                    leadStatusColor[editingLead.status] || ""
                  } text-white capitalize px-2 py-1 text-xs`}
                >
                  {editingLead.status}
                </Tag>
              </div>
              <div>
                <strong>Enquiry Type:</strong>{" "}
                <Tag
                  className={`${
                    enquiryTypeColor[editingLead.enquiryType] || ""
                  } capitalize px-2 py-1 text-xs`}
                >
                  {editingLead.enquiryType}
                </Tag>
              </div>
              <div>
                <strong>Member:</strong>{" "}
                {editingLead.memberName || editingLead.memberId}
              </div>
              <div>
                <strong>Intent:</strong> {editingLead.intent || "-"}
              </div>
              <div>
                <strong>Product of Interest:</strong>{" "}
                {editingLead.productName || "-"}
              </div>
              <div>
                <strong>Quantity:</strong> {editingLead.qty ?? "-"}
              </div>
              <div>
                <strong>Target Price:</strong>{" "}
                {editingLead.targetPrice !== null
                  ? `$${editingLead.targetPrice}`
                  : "-"}
              </div>
              <div>
                <strong>Assigned To:</strong>{" "}
                {editingLead.salesPersonName || "Unassigned"}
              </div>
              <div>
                <strong>Created At:</strong>{" "}
                {dayjs(editingLead.createdAt).format("YYYY-MM-DD HH:mm")}
              </div>
            </div>
            {editingLead.sourcingDetails && (
              <div className="mt-3 pt-3 border-t">
                <h6 className="font-semibold mb-2">Sourcing Details:</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {editingLead.sourcingDetails.supplierId && (
                    <div>
                      <strong>Supplier:</strong>{" "}
                      {dummySuppliers.find(
                        (s) => s.id === editingLead.sourcingDetails!.supplierId
                      )?.name || editingLead.sourcingDetails.supplierId}
                    </div>
                  )}
                  {editingLead.sourcingDetails.productId && (
                    <div>
                      <strong>Product:</strong>{" "}
                      {dummyProducts.find(
                        (p) => p.id === editingLead.sourcingDetails!.productId
                      )?.name || `ID ${editingLead.sourcingDetails.productId}`}
                    </div>
                  )}
                  {editingLead.sourcingDetails.productSpecId && (
                    <div>
                      <strong>Spec:</strong>{" "}
                      {dummyProductSpecs.find(
                        (s) =>
                          s.id === editingLead.sourcingDetails!.productSpecId
                      )?.name ||
                        `ID ${editingLead.sourcingDetails.productSpecId}`}
                    </div>
                  )}
                  {editingLead.sourcingDetails.qty && (
                    <div>
                      <strong>Sourcing Qty:</strong>{" "}
                      {editingLead.sourcingDetails.qty}
                    </div>
                  )}
                  {editingLead.sourcingDetails.productStatus && (
                    <div>
                      <strong>Sourcing Product Status:</strong>{" "}
                      {editingLead.sourcingDetails.productStatus}
                    </div>
                  )}
                  {editingLead.sourcingDetails.price && (
                    <div>
                      <strong>Sourcing Price:</strong> $
                      {editingLead.sourcingDetails.price}
                    </div>
                  )}
                  {/* Add more sourcing details here */}
                </div>
                {editingLead.sourcingDetails.internalRemarks && (
                  <div className="mt-2">
                    <strong>Internal Remarks:</strong>{" "}
                    <p className="whitespace-pre-wrap text-sm">
                      {editingLead.sourcingDetails.internalRemarks}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Assign Lead Drawer */}
      <Drawer
        title="Assign Lead"
        isOpen={isAssignDrawerOpen}
        onClose={closeAssignDrawer}
        width={400}
        footer={
          <div className="text-right">
            <Button size="sm" className="mr-2" onClick={closeAssignDrawer}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="assignLeadForm"
              type="submit"
              loading={isSubmitting}
            >
              Assign
            </Button>
          </div>
        }
      >
        <Form
          id="assignLeadForm"
          onSubmit={assignFormMethods.handleSubmit(onAssignSubmit)}
          className="p-1"
        >
          <p className="mb-4">
            Assign lead <strong>{editingLead?.leadNumber}</strong> to a sales
            person.
          </p>
          <FormItem label="Sales Person">
            <Controller
              name="salesPersonId"
              control={assignFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  options={dummySalesPersons.map((sp) => ({
                    value: sp.id,
                    label: sp.name,
                  }))}
                  value={dummySalesPersons.find((sp) => sp.id === field.value)}
                  onChange={(opt) => field.onChange(opt?.value)}
                  placeholder="Select Sales Person"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Change Status Drawer */}
      <Drawer
        title="Change Lead Status"
        isOpen={isChangeStatusDrawerOpen}
        onClose={closeChangeStatusDrawer}
        width={400}
        footer={
          <div className="text-right">
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
              loading={isSubmitting}
            >
              Update Status
            </Button>
          </div>
        }
      >
        <Form
          id="changeStatusForm"
          onSubmit={statusFormMethods.handleSubmit(onChangeStatusSubmit)}
          className="p-1"
        >
          <p className="mb-4">
            Change status for lead <strong>{editingLead?.leadNumber}</strong>.
          </p>
          <FormItem label="New Status">
            <Controller
              name="newStatus"
              control={statusFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  options={leadStatusOptions}
                  value={leadStatusOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(opt) => field.onChange(opt?.value as LeadStatus)}
                  placeholder="Select New Status"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Leads"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        footer={
          <div className="text-right">
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
          <div className="flex-grow overflow-y-auto p-1">
            <FormItem label="Lead Status">
              <Controller
                name="filterStatuses"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select statuses..."
                    options={leadStatusOptions}
                    {...field}
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
                    placeholder="Select enquiry types..."
                    options={enquiryTypeOptions}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Lead Intent">
              <Controller
                name="filterIntents"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select intents..."
                    options={leadIntentOptions}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Product">
              <Controller
                name="filterProductIds"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <UiSelect
                    isMulti
                    placeholder="Select products..."
                    options={dummyProducts.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    {...field}
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
                    placeholder="Select sales persons..."
                    options={dummySalesPersons.map((p) => ({
                      value: p.id,
                      label: p.name,
                    }))}
                    {...field}
                  />
                )}
              />
            </FormItem>
            <FormItem label="Created Date Range">
              <Controller
                name="dateRange"
                control={filterFormMethods.control}
                render={({ field }) => (
                  <DatePicker.DatePickerRange
                    value={
                      field.value as
                        | [Date | null, Date | null]
                        | null
                        | undefined
                    }
                    onChange={field.onChange}
                    placeholder="Select date range"
                  />
                )}
              />
            </FormItem>
          </div>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Lead"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
      >
        <p>
          Are you sure you want to delete lead{" "}
          <strong>{itemToDelete?.leadNumber}</strong>?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default LeadsListing;
