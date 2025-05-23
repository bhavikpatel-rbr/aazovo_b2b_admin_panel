// src/views/your-path/LeadsListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useNavigate } from "react-router-dom"; // Import useNavigate

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
// import InputNumber from "@/components/ui/Input/InputNumber"; // No longer used directly in this file for lead form
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
  DatePicker,
  Card,
} from "@/components/ui";
import Dropdown from "@/components/ui/Dropdown";

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
  TbEye,
  TbUserPlus,
  TbArrowsExchange,
  TbRocket,
  TbCloudDownload,
  TbInfoCircle,
  TbLink,
  TbPhone,
  TbLayoutDashboard,
  TbWorldWww,
  TbTypography,
  TbFileText,
  TbTags,
  TbHistory,
  TbCalendarPlus,
  TbCalendarEvent,
  TbBoxOff,
  TbSettings,
  TbPhoto,
  TbClipboardText,
  TbX,
  TbBuildingStore,
  TbActivityHeartbeat,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useSelector } from 'react-redux'
import { useAppDispatch } from "@/reduxtool/store";
import {
    getLeadAction,
    // addLeadAction, // Handled by new page
    // editLeadAction, // Handled by new page
    deleteLeadAction,
    deleteAllLeadsAction,
    // assignLeadAction, // Keep if used by assign drawer
    // changeLeadStatusAction, // Keep if used by status drawer
    // convertToOpportunityAction,
    // Actions to get dropdown data for forms (you'll need to create these)
    // getSuppliersForFormAction,
    // getProductsForLeadFormAction,
    // getProductSpecsForFormAction,
    // getCartoonTypesForFormAction,
    // getPaymentTermsForFormAction,
    // getSalesPersonsForFormAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";


// --- Define Lead Types ---
export type LeadStatus =
  | "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Negotiation"
  | "Follow Up" | "Lost" | "Won" | string;
export type EnquiryType =
  | "Product Info" | "Quote Request" | "Demo Request" | "Support"
  | "Partnership" | "Sourcing" | "Other" | string;
export type LeadIntent = "Buy" | "Sell" | "Inquire" | "Partner" | string;
export type ProductCondition = "New" | "Used" | "Refurbished" | string;

export type LeadListItem = {
  id: string | number;
  leadNumber: string;
  status: LeadStatus;
  enquiryType: EnquiryType;
  productName?: string | null;
  memberId: string;
  memberName?: string;
  intent?: LeadIntent;
  qty?: number | null;
  targetPrice?: number | null;
  salesPersonId?: string | number | null;
  salesPersonName?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  sourcingDetails?: LeadFormData; // Optional detailed form data
};

// LeadFormData might still be useful for sourcingDetails, but the main form schema moves to the new page
export type LeadFormData = {
  supplierId?: string | number | null;
  productId?: number | null;
  qty?: number | null;
  productStatus?: string | null;
  productSpecId?: number | null;
  internalRemarks?: string | null;
  deviceType?: string | null;
  price?: number | null;
  color?: string | null;
  cartoonTypeId?: number | null;
  dispatchStatus?: string | null;
  paymentTermId?: number | null;
  deviceCondition?: ProductCondition | null;
  eta?: string | null;
  location?: string | null;
  // These might be part of the main lead object, not sourcingDetails in the form context
  leadStatus?: LeadStatus;
  enquiryType?: EnquiryType;
  leadIntent?: LeadIntent;
  targetPriceForm?: number | null; // Renamed from targetPrice to avoid conflict if used in form
  assignedSalesPersonId?: string | number | null;
  memberInfo?: { id?: string; name: string; email: string; phone?: string; };
};

// Zod Schema for Add/Edit Lead Form - This would move to the new AddEditLeadPage.tsx
// const leadFormSchema = z.object({ ... });


// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterStatuses: z.array(z.string()).optional().default([]),
  filterEnquiryTypes: z.array(z.string()).optional().default([]),
  filterIntents: z.array(z.string()).optional().default([]),
  filterProductIds: z.array(z.number()).optional().default([]),
  filterSalesPersonIds: z.array(z.union([z.string(), z.number()])).optional().default([]),
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;


// --- UI Constants ---
const leadStatusColor: Record<LeadStatus | 'default', string> = {
  New: "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200",
  Contacted: "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200",
  Qualified: "bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-200",
  "Proposal Sent": "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-200",
  Negotiation: "bg-violet-100 text-violet-700 dark:bg-violet-700/30 dark:text-violet-200",
  "Follow Up": "bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200",
  Won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200",
  Lost: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};
const enquiryTypeColor: Record<EnquiryType | 'default', string> = {
  "Product Info": "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
  "Quote Request": "bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-200",
  "Demo Request": "bg-teal-100 text-teal-700 dark:bg-teal-700/30 dark:text-teal-200",
  Support: "bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-200",
  Partnership: "bg-lime-100 text-lime-700 dark:bg-lime-700/30 dark:text-lime-200",
  Sourcing: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-700/30 dark:text-fuchsia-200",
  Other: "bg-stone-100 text-stone-700 dark:bg-stone-700/30 dark:text-stone-200",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};

const leadStatusOptions = Object.keys(leadStatusColor).filter(k => k !== 'default').map(s => ({ value: s, label: s }));
const enquiryTypeOptions = Object.keys(enquiryTypeColor).filter(k => k !== 'default').map(s => ({ value: s, label: s }));
const leadIntentOptions = [ { value: "Buy", label: "Buy" }, { value: "Sell", label: "Sell" }, { value: "Inquire", label: "Inquire" }, { value: "Partner", label: "Partner" }];
// const productStatusOptionsForm = [ { value: "In Stock", label: "In Stock" }, { value: "Available on Order", label: "Available on Order" }, { value: "Low Stock", label: "Low Stock" }]; // Moved to AddEditLeadPage
// const deviceConditionOptionsForm = [ { value: "New", label: "New" }, { value: "Used", label: "Used" }, { value: "Refurbished", label: "Refurbished" }]; // Moved to AddEditLeadPage

// --- Dummy Data for Selects (REPLACE/FETCH VIA REDUX) ---
// These are still used by filters and view dialog
const dummySuppliers = [{ id: "SUP001", name: "Supplier Alpha" }, { id: "SUP002", name: "Supplier Beta" }];
const dummyProducts = [{ id: 1, name: "iPhone 15 Pro" }, { id: 2, name: "Galaxy S24 Ultra" }];
const dummyProductSpecs = [{ id: 1, name: "256GB, Blue", productId: 1 }, { id: 2, name: "512GB, Black", productId: 2 }];
const dummyCartoonTypes = [{ id: 1, name: "Master Carton" }, { id: 2, name: "Inner Box" }];
const dummyPaymentTerms = [{ id: 1, name: "Net 30" }, { id: 2, name: "COD" }];
const dummySalesPersons = [{ id: "SP001", name: "Alice Wonder" }, { id: "SP002", name: "Bob The Builder" }];

// CSV Exporter (remains the same)
const CSV_LEAD_HEADERS = ["ID", "Lead Number", "Status", "Enquiry Type", "Product Name", "Member ID", "Member Name", "Intent", "Qty", "Target Price", "Sales Person", "Created At"];
const CSV_LEAD_KEYS: (keyof LeadListItem)[] = ["id", "leadNumber", "status", "enquiryType", "productName", "memberId", "memberName", "intent", "qty", "targetPrice", "salesPersonName", "createdAt"];
function exportLeadsToCsv(filename: string, rows: LeadListItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const separator = ",";
  const csvContent = CSV_LEAD_HEADERS.join(separator) + "\n" + rows.map(row => {
    return CSV_LEAD_KEYS.map(k => {
      let cell = row[k];
      if (cell === null || cell === undefined) cell = "";
      else if (cell instanceof Date) cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss");
      else cell = String(cell).replace(/"/g, '""');
      if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(separator);
  }).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", filename);
    link.style.visibility = "hidden"; document.body.appendChild(link);
    link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    return true;
  }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}


// --- Helper Components (LeadActionColumn, LeadSearch, LeadTableTools, LeadTable, LeadSelectedFooter, DialogDetailRow) remain largely the same ---
const LeadActionColumn = ({ onViewDetail, onEdit, onDelete, onAssign, onChangeStatus, onConvertToOpportunity }: {
  onViewDetail: () => void; onEdit: () => void; onDelete: () => void;
  onAssign: () => void; onChangeStatus: () => void; onConvertToOpportunity: () => void;
}) => {
  const menuItems = (
    <>
      <Dropdown.Item eventKey="assign" onClick={onAssign}><TbUserPlus /> Assign Lead</Dropdown.Item>
      <Dropdown.Item eventKey="changeStatus" onClick={onChangeStatus}><TbArrowsExchange /> Change Status</Dropdown.Item>
      <Dropdown.Item eventKey="convertToOpportunity" onClick={onConvertToOpportunity}><TbRocket /> Convert to Opportunity</Dropdown.Item>
    </>
  );
  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip title="View"><div className={`text-xl cursor-pointer text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={onViewDetail}><TbEye /></div></Tooltip>
      <Tooltip title="Edit"><div className={`text-xl cursor-pointer text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
      <Tooltip title="Delete"><div className={`text-xl cursor-pointer text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
      <Dropdown placement="bottom-end" renderTitle={<Tooltip title="More Actions"><div className="text-xl cursor-pointer text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><TbDotsVertical /></div></Tooltip>}>{menuItems}</Dropdown>
    </div>
  );
};

type LeadSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const LeadSearch = React.forwardRef<HTMLInputElement, LeadSearchProps>(({ onInputChange }, ref) => (
  <DebouceInput ref={ref} className="w-full" placeholder="Search Leads..." suffix={<TbSearch />} onChange={(e) => onInputChange(e.target.value)} />
));
LeadSearch.displayName = "LeadSearch";

const LeadTableTools = ({ onSearchChange, onFilter, onExport }: { onSearchChange: (q: string) => void; onFilter: () => void; onExport: () => void; }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow"><LeadSearch onInputChange={onSearchChange} /></div>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

type LeadTableProps = {
  columns: ColumnDef<LeadListItem>[]; data: LeadListItem[]; loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: LeadListItem[];
  onPaginationChange: (p: number) => void; onSelectChange: (v: number) => void; onSort: (s: OnSortParam) => void;
  onRowSelect: (c: boolean, r: LeadListItem) => void; onAllRowSelect: (c: boolean, rs: Row<LeadListItem>[]) => void;
};
const LeadTable = (props: LeadTableProps) => (
  <DataTable selectable columns={props.columns} data={props.data} loading={props.loading} pagingData={props.pagingData}
    checkboxChecked={(row) => props.selectedItems.some(s => s.id === row.id)}
    onPaginationChange={props.onPaginationChange} onSelectChange={props.onSelectChange}
    onSort={props.onSort} onCheckBoxChange={props.onRowSelect} onIndeterminateCheckBoxChange={props.onAllRowSelect}
    noData={!props.loading && props.data.length === 0}
  />
);

type LeadSelectedFooterProps = { selectedItems: LeadListItem[]; onDeleteSelected: () => void; };
const LeadSelectedFooter = ({ selectedItems, onDeleteSelected }: LeadSelectedFooterProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4" stickyClass="-mx-4 sm:-mx-8 border-t px-8">
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2"><TbChecks className="text-xl text-primary-500" /><span className="font-semibold">{selectedItems.length} lead{selectedItems.length > 1 ? "s" : ""} selected</span></span>
          <Button size="sm" variant="plain" className="text-red-500 hover:text-red-700" onClick={() => setDeleteOpen(true)}>Delete Selected</Button>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} leads?`}
        onClose={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }} onCancel={() => setDeleteOpen(false)}>
        <p>This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

interface DialogDetailRowProps { label: string; value: string | React.ReactNode; isLink?: boolean; preWrap?: boolean; breakAll?: boolean; labelClassName?: string; valueClassName?: string; className?: string; }
const DialogDetailRow: React.FC<DialogDetailRowProps> = ({ label, value, isLink, preWrap, breakAll, labelClassName = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider", valueClassName = "text-sm text-slate-700 dark:text-slate-100 mt-0.5", className = "" }) => (
  <div className={`py-1.5 ${className}`}>
    <p className={`${labelClassName}`}>{label}</p>
    {isLink ? (<a href={typeof value === 'string' && (value.startsWith('http') ? value : `/${value}`) || '#'} target="_blank" rel="noopener noreferrer" className={`${valueClassName} hover:underline text-blue-600 dark:text-blue-400 ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</a>
    ) : (<div className={`${valueClassName} ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</div>)}
  </div>
);

// --- Main LeadsListing Component ---
const LeadsListing = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate(); // Initialize navigate
  const { LeadsData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector);

  // const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false); // Removed
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [isChangeStatusDrawerOpen, setIsChangeStatusDrawerOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadListItem | null>(null); // Still used for Assign/ChangeStatus/Delete
  const [leadToView, setLeadToView] = useState<LeadListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Still used for Assign/ChangeStatus
  const [isProcessing, setIsProcessing] = useState(false); // Used for delete operations
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LeadListItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(filterFormSchema.parse({}));
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "createdAt" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<LeadListItem[]>([]);

  // formMethods for Add/Edit Lead are removed. The new page will handle its own form.
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const assignFormMethods = useForm<{ salesPersonId: string | number | null }>({ defaultValues: { salesPersonId: null } });
  const statusFormMethods = useForm<{ newStatus: LeadStatus }>({ defaultValues: { newStatus: "New" } });

  useEffect(() => { dispatch(getLeadAction()); }, [dispatch]);

  const mappedLeads: LeadListItem[] = useMemo(() => {
    if (!Array.isArray(LeadsData)) return [];
    return LeadsData.map((apiLead: any): LeadListItem => ({
        id: apiLead.id,
        leadNumber: apiLead.lead_number || `LD-${apiLead.id}`,
        status: apiLead.status || "New",
        enquiryType: apiLead.enquiry_type || "Other",
        productName: apiLead.product_name,
        memberId: String(apiLead.member_id || apiLead.user_id || 'N/A'),
        memberName: apiLead.member_name || apiLead.user?.name,
        intent: apiLead.intent,
        qty: apiLead.qty,
        targetPrice: apiLead.target_price,
        salesPersonId: apiLead.sales_person_id,
        salesPersonName: apiLead.sales_person?.name,
        createdAt: new Date(apiLead.created_at),
        updatedAt: apiLead.updated_at ? new Date(apiLead.updated_at) : undefined,
        sourcingDetails: apiLead.sourcing_details ? (typeof apiLead.sourcing_details === 'string' ? JSON.parse(apiLead.sourcing_details) : apiLead.sourcing_details) : undefined,
    }));
  }, [LeadsData]);

  type ProcessedDataType = { pageData: LeadListItem[]; total: number; allFilteredAndSortedData: LeadListItem[]; };
  const { pageData, total, allFilteredAndSortedData } = useMemo((): ProcessedDataType => {
    let processedData: LeadListItem[] = cloneDeep(mappedLeads);
    if (filterCriteria.dateRange && (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])) { const [startDate, endDate] = filterCriteria.dateRange; const start = startDate ? dayjs(startDate).startOf('day') : null; const end = endDate ? dayjs(endDate).endOf('day') : null; processedData = processedData.filter(item => { const itemDate = dayjs(item.createdAt); if (start && end) return itemDate.isBetween(start, end, null, '[]'); if (start) return itemDate.isSameOrAfter(start, 'day'); if (end) return itemDate.isSameOrBefore(end, 'day'); return true; }); }
    if (filterCriteria.filterStatuses && filterCriteria.filterStatuses.length > 0) { const statuses = new Set(filterCriteria.filterStatuses); processedData = processedData.filter(item => statuses.has(item.status)); }
    if (filterCriteria.filterEnquiryTypes && filterCriteria.filterEnquiryTypes.length > 0) { const types = new Set(filterCriteria.filterEnquiryTypes); processedData = processedData.filter(item => types.has(item.enquiryType)); }
    if (filterCriteria.filterIntents && filterCriteria.filterIntents.length > 0) { const intents = new Set(filterCriteria.filterIntents); processedData = processedData.filter(item => item.intent && intents.has(item.intent)); }
    if (filterCriteria.filterProductIds && filterCriteria.filterProductIds.length > 0) { const productIds = new Set(filterCriteria.filterProductIds); processedData = processedData.filter(item => item.sourcingDetails?.productId && productIds.has(item.sourcingDetails.productId)); }
    if (filterCriteria.filterSalesPersonIds && filterCriteria.filterSalesPersonIds.length > 0) { const spIds = new Set(filterCriteria.filterSalesPersonIds); processedData = processedData.filter(item => item.salesPersonId && spIds.has(String(item.salesPersonId))); }
    if (tableData.query && tableData.query.trim() !== "") { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => String(item.id).toLowerCase().includes(query) || item.leadNumber.toLowerCase().includes(query) || (item.productName && item.productName.toLowerCase().includes(query)) || (item.memberName && item.memberName.toLowerCase().includes(query)) || item.memberId.toLowerCase().includes(query) || (item.salesPersonName && item.salesPersonName.toLowerCase().includes(query)) || item.status.toLowerCase().includes(query) || item.enquiryType.toLowerCase().includes(query)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
        processedData.sort((a, b) => {
            let aVal = a[key as keyof LeadListItem]; let bVal = b[key as keyof LeadListItem];
            if (key === 'createdAt' || key === 'updatedAt') { return order === 'asc' ? dayjs(aVal as Date).valueOf() - dayjs(bVal as Date).valueOf() : dayjs(bVal as Date).valueOf() - dayjs(aVal as Date).valueOf(); }
            if (typeof aVal === 'number' && typeof bVal === 'number') return order === 'asc' ? aVal - bVal : bVal - aVal;
            return order === 'asc' ? String(aVal ?? '').localeCompare(String(bVal ?? '')) : String(bVal ?? '').localeCompare(String(aVal ?? ''));
        });
    }
    const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [mappedLeads, tableData, filterCriteria]);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);
  
  const openAddDrawer = useCallback(() => {
    // Navigate to the new lead page
    navigate('/sales-leads/lead/add'); // Or /sales-leads/lead/new
  }, [navigate]);

  const openEditDrawer = useCallback((lead: LeadListItem) => {
    // Navigate to the edit lead page with lead ID
    navigate(`/sales-leads/lead/edit/${lead.id}`);
  }, [navigate]);

  // closeAddEditDrawer is removed
  // onFormSubmit is removed

  const handleDeleteClick = useCallback((item: LeadListItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return; setIsProcessing(true); setSingleDeleteConfirmOpen(false);
    try { await dispatch(deleteLeadAction(itemToDelete.id as number)).unwrap(); toast.push(<Notification title="Deleted" type="success">Lead deleted.</Notification>); setSelectedItems(prev => prev.filter(i => i.id !== itemToDelete.id)); dispatch(getLeadAction()); }
    catch (e: any) { toast.push(<Notification title="Error" type="danger">{e.message || "Delete failed."}</Notification>); }
    finally { setIsProcessing(false); setItemToDelete(null); }
  }, [dispatch, itemToDelete]);
  const onDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return; setIsProcessing(true);
    const ids = selectedItems.map(item => item.id).join(',');
    try { await dispatch(deleteAllLeadsAction({ ids })).unwrap(); toast.push(<Notification title="Success" type="success">{selectedItems.length} leads deleted.</Notification>); setSelectedItems([]); dispatch(getLeadAction()); }
    catch (e: any) { toast.push(<Notification title="Error" type="danger">{e.message || "Bulk delete failed."}</Notification>); }
    finally { setIsProcessing(false); }
  }, [dispatch, selectedItems]);

  const openAssignDrawer = useCallback((lead: LeadListItem) => { setEditingLead(lead); assignFormMethods.reset({ salesPersonId: lead.salesPersonId || null }); setIsAssignDrawerOpen(true); }, [assignFormMethods]);
  const closeAssignDrawer = useCallback(() => { setIsAssignDrawerOpen(false); setEditingLead(null); }, []);
  const onAssignSubmit = useCallback(async (data: { salesPersonId: string | number | null }) => {
    if (!editingLead) return; setIsSubmitting(true);
    // Assuming assignLeadAction is still defined and imported
    // try { await dispatch(assignLeadAction({ leadId: editingLead.id, salesPersonId: data.salesPersonId })).unwrap(); toast.push(<Notification title="Success" type="success">Lead assigned.</Notification>); closeAssignDrawer(); dispatch(getLeadAction()); }
    try { 
        // Placeholder for actual assignLeadAction if it's not imported/defined
        console.log("Assigning lead:", editingLead.id, "to sales person:", data.salesPersonId);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        toast.push(<Notification title="Success" type="success">Lead assigned (Simulated).</Notification>); 
        closeAssignDrawer(); 
        dispatch(getLeadAction()); 
    }
    catch (error: any) { toast.push(<Notification title="Error" type="danger">Assignment failed.</Notification>); }
    finally { setIsSubmitting(false); }
  }, [dispatch, editingLead, closeAssignDrawer]);

  const openChangeStatusDrawer = useCallback((lead: LeadListItem) => { setEditingLead(lead); statusFormMethods.reset({ newStatus: lead.status }); setIsChangeStatusDrawerOpen(true); }, [statusFormMethods]);
  const closeChangeStatusDrawer = useCallback(() => { setIsChangeStatusDrawerOpen(false); setEditingLead(null); }, []);
  const onChangeStatusSubmit = useCallback(async (data: { newStatus: LeadStatus }) => {
    if (!editingLead) return; setIsSubmitting(true);
    // Assuming changeLeadStatusAction is still defined and imported
    // try { await dispatch(changeLeadStatusAction({ leadId: editingLead.id, newStatus: data.newStatus })).unwrap(); toast.push(<Notification title="Success" type="success">Status updated.</Notification>); closeChangeStatusDrawer(); dispatch(getLeadAction()); }
    try { 
        // Placeholder for actual changeLeadStatusAction if it's not imported/defined
        console.log("Changing status for lead:", editingLead.id, "to:", data.newStatus);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        toast.push(<Notification title="Success" type="success">Status updated (Simulated).</Notification>); 
        closeChangeStatusDrawer(); 
        dispatch(getLeadAction()); 
    }
    catch (error: any) { toast.push(<Notification title="Error" type="danger">Status update failed.</Notification>); }
    finally { setIsSubmitting(false); }
  }, [dispatch, editingLead, closeChangeStatusDrawer]);

  const handleConvertToOpportunity = useCallback((lead: LeadListItem) => {
    toast.push(<Notification title="Convert to Opportunity" type="info">Converting lead {lead.leadNumber}... (Not Implemented)</Notification>);
    // dispatch(convertToOpportunityAction(lead.id)).unwrap().then(...);
  }, []); // Removed dispatch dependency if convertToOpportunityAction is not used

  const openViewDialog = useCallback((lead: LeadListItem) => { setLeadToView(lead); setIsViewDialogOpen(true); }, []);
  const closeViewDialog = useCallback(() => { setIsViewDialogOpen(false); setLeadToView(null); }, []);

  const handleExportData = useCallback(() => exportLeadsToCsv("leads_export.csv", allFilteredAndSortedData), [allFilteredAndSortedData]);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handlePageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: LeadListItem) => setSelectedItems(prev => checked ? (prev.some(i => i.id === row.id) ? prev : [...prev, row]) : prev.filter(i => i.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<LeadListItem>[]) => {
    const originals = currentRows.map(r => r.original);
    if (checked) setSelectedItems(prev => { const oldIds = new Set(prev.map(i => i.id)); return [...prev, ...originals.filter(o => !oldIds.has(o.id))]; });
    else { const currentIds = new Set(originals.map(o => o.id)); setSelectedItems(prev => prev.filter(i => !currentIds.has(i.id))); }
  }, []);
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
  const onClearFilters = useCallback(() => { const defaults = filterFormSchema.parse({}); filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);

  const columns: ColumnDef<LeadListItem>[] = useMemo(() => [
    { header: "Status", accessorKey: "status", size: 120, cell: (props: CellContext<LeadListItem, any>) => <Tag className={`${leadStatusColor[props.row.original.status] || leadStatusColor.default} text-white capitalize px-2 py-1 text-xs`}>{props.row.original.status}</Tag> },
    { header: "Enquiry Type", accessorKey: "enquiryType", size: 140, cell: (props: CellContext<LeadListItem, any>) => <Tag className={`${enquiryTypeColor[props.row.original.enquiryType] || enquiryTypeColor.default} capitalize px-2 py-1 text-xs`}>{props.row.original.enquiryType}</Tag> },
    { header: "Lead Number", accessorKey: "leadNumber", size: 130 },
    { header: "Product", accessorKey: "productName", size: 180, cell: (props: CellContext<LeadListItem, any>) => props.row.original.productName || '-' },
    { header: "Member", accessorKey: "memberName", size: 150, cell: (props: CellContext<LeadListItem, any>) => props.row.original.memberName || props.row.original.memberId },
    { header: "Intent", accessorKey: "intent", size: 90, cell: (props: CellContext<LeadListItem, any>) => props.row.original.intent || '-' },
    { header: "Qty", accessorKey: "qty", size: 70, cell: (props: CellContext<LeadListItem, any>) => props.row.original.qty ?? '-' },
    { header: "Target Price", accessorKey: "targetPrice", size: 110, cell: (props: CellContext<LeadListItem, any>) => props.row.original.targetPrice !== null && props.row.original.targetPrice !== undefined ? `$${props.row.original.targetPrice}` : '-' },
    { header: "Sales Person", accessorKey: "salesPersonName", size: 140, cell: (props: CellContext<LeadListItem, any>) => props.row.original.salesPersonName || 'Unassigned' },
    { header: "Created At", accessorKey: "createdAt", size: 160, cell: (props: CellContext<LeadListItem, any>) => dayjs(props.row.original.createdAt).format("YYYY-MM-DD HH:mm") },
    { header: "Actions", id: "actions", size: 160, meta: { HeaderClass: "text-center" },
      cell: (props: CellContext<LeadListItem, any>) => (
        <LeadActionColumn
          onViewDetail={() => openViewDialog(props.row.original)}
          onEdit={() => openEditDrawer(props.row.original)} // This now navigates
          onDelete={() => handleDeleteClick(props.row.original)}
          onAssign={() => openAssignDrawer(props.row.original)}
          onChangeStatus={() => openChangeStatusDrawer(props.row.original)}
          onConvertToOpportunity={() => handleConvertToOpportunity(props.row.original)}
        />
      )
    },
  ], [openViewDialog, openEditDrawer, handleDeleteClick, openAssignDrawer, openChangeStatusDrawer, handleConvertToOpportunity]);

  // Corrected tableIsLoading logic:
  // It's true if Redux status indicates loading, or if local operations (submitting assign/status, processing delete) are active.
  const tableIsLoading = masterLoadingStatus === 'loading' || masterLoadingStatus === 'pending' || isSubmitting || isProcessing;
  // If masterLoadingStatus is 'idle' (initial) and LeadsData is empty, the DataTable's noData prop will handle it.

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Leads Listing</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}> Add New </Button>
          </div>
          <LeadTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4 flex-grow overflow-y-auto">
            <LeadTable columns={columns} data={pageData} loading={tableIsLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>
      <LeadSelectedFooter selectedItems={selectedItems} onDeleteSelected={onDeleteSelected} />

      {/* View Dialog (remains the same) */}
      <Dialog isOpen={isViewDialogOpen} onClose={closeViewDialog} onRequestClose={closeViewDialog} size="max-w-lg" title="" contentClassName="!p-0 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {leadToView ? (
          <div className="flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Lead: {leadToView.leadNumber}</h2>
                <Tooltip title="Edit Lead"><Button shape="circle" variant="ghost" size="sm" icon={<TbPencil className="text-slate-500 hover:text-blue-600" />} onClick={() => { closeViewDialog(); openEditDrawer(leadToView); }}/></Tooltip>
              </div>
            </div>
            <div className="flex-grow p-5 overflow-y-auto custom-scrollbar">
              <div className="pr-4 md:pr-6 space-y-5">
                <div>
                  <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Lead Overview</h6>
                  <div className="p-4 bg-white dark:bg-slate-700/60 rounded-lg shadow-sm space-y-2.5">
                    <DialogDetailRow label="Lead ID" value={String(leadToView.id)} />
                    <DialogDetailRow label="Member" value={leadToView.memberName || leadToView.memberId} />
                    <DialogDetailRow label="Status" value={<Tag className={`${leadStatusColor[leadToView.status] || leadStatusColor.default} capitalize font-semibold text-[10px] px-2 py-0.5 rounded-full`}>{leadToView.status}</Tag>} />
                    <DialogDetailRow label="Enquiry Type" value={<Tag className={`${enquiryTypeColor[leadToView.enquiryType] || enquiryTypeColor.default} capitalize text-[10px] px-2 py-0.5 rounded-md`}>{leadToView.enquiryType}</Tag>} />
                    <DialogDetailRow label="Intent" value={leadToView.intent || '-'} />
                    <DialogDetailRow label="Product Interest" value={leadToView.productName || '-'} />
                    <DialogDetailRow label="Quantity" value={leadToView.qty?.toString() || '-'} />
                    <DialogDetailRow label="Target Price" value={leadToView.targetPrice ? `$${leadToView.targetPrice.toFixed(2)}` : '-'} />
                    <DialogDetailRow label="Assigned To" value={leadToView.salesPersonName || 'Unassigned'} />
                  </div>
                </div>
                {leadToView.sourcingDetails && (
                  <div>
                    <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sourcing Specifics</h6>
                    <div className="p-4 bg-white dark:bg-slate-700/60 rounded-lg shadow-sm space-y-2.5">
                      {leadToView.sourcingDetails.supplierId && <DialogDetailRow label="Supplier" value={dummySuppliers.find(s => s.id === leadToView.sourcingDetails?.supplierId)?.name || String(leadToView.sourcingDetails.supplierId)} />}
                      {leadToView.sourcingDetails.productId && <DialogDetailRow label="Sourced Product" value={dummyProducts.find(p => p.id === leadToView.sourcingDetails?.productId)?.name || `ID: ${leadToView.sourcingDetails.productId}`} />}
                      {leadToView.sourcingDetails.qty && <DialogDetailRow label="Sourced Qty" value={String(leadToView.sourcingDetails.qty)} />}
                      {leadToView.sourcingDetails.price && <DialogDetailRow label="Sourced Price" value={`$${leadToView.sourcingDetails.price.toFixed(2)}`} />}
                      {leadToView.sourcingDetails.productStatus && <DialogDetailRow label="Product Status" value={leadToView.sourcingDetails.productStatus} />}
                      {leadToView.sourcingDetails.deviceCondition && <DialogDetailRow label="Device Condition" value={leadToView.sourcingDetails.deviceCondition} />}
                      {leadToView.sourcingDetails.color && <DialogDetailRow label="Color" value={leadToView.sourcingDetails.color} />}
                      {leadToView.sourcingDetails.cartoonTypeId && <DialogDetailRow label="Cartoon Type" value={dummyCartoonTypes.find(c => c.id === leadToView.sourcingDetails?.cartoonTypeId)?.name || '-'} />}
                      {leadToView.sourcingDetails.dispatchStatus && <DialogDetailRow label="Dispatch Status" value={leadToView.sourcingDetails.dispatchStatus} />}
                      {leadToView.sourcingDetails.paymentTermId && <DialogDetailRow label="Payment Term" value={dummyPaymentTerms.find(p => p.id === leadToView.sourcingDetails?.paymentTermId)?.name || '-'} />}
                      {leadToView.sourcingDetails.eta && <DialogDetailRow label="ETA" value={leadToView.sourcingDetails.eta} />}
                      {leadToView.sourcingDetails.location && <DialogDetailRow label="Location" value={leadToView.sourcingDetails.location} />}
                      {leadToView.sourcingDetails.deviceType && <DialogDetailRow label="Device Type" value={leadToView.sourcingDetails.deviceType} />}
                      {leadToView.sourcingDetails.internalRemarks && <DialogDetailRow label="Internal Remarks" value={leadToView.sourcingDetails.internalRemarks} preWrap />}
                    </div>
                  </div>
                )}
                <Card className="!mt-5 bg-white dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 p-4 shadow-sm">
                  <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Activity Log</h6>
                  <div className="space-y-1.5">
                    <DialogDetailRow label="Created On" value={<><span className="text-sm">{dayjs(leadToView.createdAt).format('MMM D, YYYY')}</span><span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">{dayjs(leadToView.createdAt).format('h:mm A')}</span></>} />
                    {leadToView.updatedAt && <DialogDetailRow label="Last Updated" value={<><span className="text-sm">{dayjs(leadToView.updatedAt).format('MMM D, YYYY')}</span><span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">{dayjs(leadToView.updatedAt).format('h:mm A')}</span></>} />}
                  </div>
                </Card>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-2 rounded-b-xl">
              <Button variant="solid" color="blue-600" onClick={closeViewDialog} size="sm" className="font-medium min-w-[80px]">Close</Button>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center flex flex-col items-center justify-center h-full" style={{minHeight: '250px'}}>
            <TbInfoCircle size={48} className="text-slate-400 dark:text-slate-500 mb-3" />
            <p className="text-md font-medium text-slate-600 dark:text-slate-400">No Lead Information</p>
            <p className="text-sm text-slate-500 mt-1">Details for this lead could not be loaded.</p>
            <div className="mt-6"><Button variant="solid" color="blue-600" onClick={closeViewDialog} size="sm">Dismiss</Button></div>
          </div>
        )}
      </Dialog>

      {/* Assign Lead Drawer (remains the same) */}
      <Drawer title="Assign Lead" isOpen={isAssignDrawerOpen} onClose={closeAssignDrawer} width={400}
        footer={ <div className="text-right p-4 border-t"><Button size="sm" className="mr-2" onClick={closeAssignDrawer}>Cancel</Button><Button size="sm" variant="solid" form="assignLeadForm" type="submit" loading={isSubmitting}>Assign</Button></div> }>
        <Form id="assignLeadForm" onSubmit={assignFormMethods.handleSubmit(onAssignSubmit)} className="p-4">
          <p className="mb-4">Assign lead <strong>{editingLead?.leadNumber}</strong> to a sales person.</p>
          <FormItem label="Sales Person">
            <Controller name="salesPersonId" control={assignFormMethods.control}
              render={({ field }) => <UiSelect options={dummySalesPersons.map(sp => ({value: sp.id, label: sp.name}))} value={dummySalesPersons.find(sp => sp.id === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Sales Person" />}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Change Status Drawer (remains the same) */}
      <Drawer title="Change Lead Status" isOpen={isChangeStatusDrawerOpen} onClose={closeChangeStatusDrawer} width={400}
        footer={ <div className="text-right p-4 border-t"><Button size="sm" className="mr-2" onClick={closeChangeStatusDrawer}>Cancel</Button><Button size="sm" variant="solid" form="changeStatusForm" type="submit" loading={isSubmitting}>Update Status</Button></div> }>
        <Form id="changeStatusForm" onSubmit={statusFormMethods.handleSubmit(onChangeStatusSubmit)} className="p-4">
          <p className="mb-4">Change status for lead <strong>{editingLead?.leadNumber}</strong>.</p>
          <FormItem label="New Status">
            <Controller name="newStatus" control={statusFormMethods.control}
              render={({ field }) => <UiSelect options={leadStatusOptions} value={leadStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value as LeadStatus)} placeholder="Select New Status" />}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Filter Drawer (remains the same) */}
      <Drawer title="Filter Leads" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer}
        footer={ <div className="text-right p-4 border-t"><Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear Filters</Button><Button size="sm" variant="solid" form="filterLeadForm" type="submit">Apply Filters</Button></div> }>
        <Form id="filterLeadForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4 h-full">
          <div className="flex-grow overflow-y-auto p-4">
            <FormItem label="Lead Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select statuses..." options={leadStatusOptions} value={leadStatusOptions.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Enquiry Type"><Controller name="filterEnquiryTypes" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select enquiry types..." options={enquiryTypeOptions} value={enquiryTypeOptions.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Lead Intent"><Controller name="filterIntents" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select intents..." options={leadIntentOptions} value={leadIntentOptions.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Product"><Controller name="filterProductIds" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select products..." options={dummyProducts.map(p => ({value: p.id, label: p.name}))} value={dummyProducts.filter(o => field.value?.includes(o.value)).map(p => ({value:p.id, label:p.name}))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Sales Person"><Controller name="filterSalesPersonIds" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select sales persons..." options={dummySalesPersons.map(p => ({value: p.id, label: p.name}))} value={dummySalesPersons.filter(o => field.value?.includes(o.value)).map(p => ({value:p.id, label:p.name}))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Created Date Range"><Controller name="dateRange" control={filterFormMethods.control} render={({ field }) => <DatePicker.DatePickerRange value={field.value as [Date | null, Date | null] | null | undefined} onChange={field.onChange} placeholder="Select date range" />} /></FormItem>
          </div>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Lead"
        onClose={() => {setSingleDeleteConfirmOpen(false); setItemToDelete(null);}}
        onConfirm={onConfirmSingleDelete} loading={isProcessing}
        onCancel={() => {setSingleDeleteConfirmOpen(false); setItemToDelete(null);}}
      ><p>Are you sure you want to delete lead <strong>{itemToDelete?.leadNumber}</strong>?</p></ConfirmDialog>
    </>
  );
};

export default LeadsListing;