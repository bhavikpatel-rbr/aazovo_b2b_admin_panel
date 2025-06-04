// src/views/sales-leads/LeadsListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form"; // For Filter, Assign, Change Status drawers
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useNavigate } from "react-router-dom";

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
import { Drawer, Form, Input, Select as UiSelect, DatePicker, FormItem } from "@/components/ui";
import Dropdown from "@/components/ui/Dropdown";
import classNames from "classnames";

// Icons
import {
  TbPencil, TbTrash,  TbAlertTriangle,
  TbCalendarTime, TbSubtask , TbSearch, TbCloudUpload, TbFilter, TbPlus,
  TbDotsVertical, TbEye, TbUserPlus, TbArrowsExchange, TbRocket, TbInfoCircle,
  TbBulb
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row, CellContext } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import type { LeadStatus, EnquiryType, LeadListItem, LeadSourcingDetails } from './types'; // Import from your types file
import { leadStatusOptions as leadStatusOptionsConst, enquiryTypeOptions as enquiryTypeOptionsConst, leadIntentOptions as leadIntentOptionsConst } from './types';


// Redux
import { useSelector } from 'react-redux';
import { useAppDispatch } from "@/reduxtool/store";
import {
    getLeadAction,
    deleteLeadAction,
    deleteAllLeadsAction,
    // assignLeadAction, // Make sure these are correctly defined if used
    // changeLeadStatusAction,
    // convertToOpportunityAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";


// --- Zod Schema for Filter Form (remains the same) ---
const filterFormSchema = z.object({
  filterStatuses: z.array(z.string()).optional().default([]),
  filterEnquiryTypes: z.array(z.string()).optional().default([]),
  filterIntents: z.array(z.string()).optional().default([]),
  filterProductIds: z.array(z.number()).optional().default([]),
  filterSalesPersonIds: z.array(z.union([z.string(), z.number()])).optional().default([]),
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- UI Constants (Colors remain, options imported or fetched) ---
const leadStatusColor: Record<LeadStatus | 'default', string> = { /* ... (same as your original) ... */
  New: "bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-200", Contacted: "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-200", Qualified: "bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-200", "Proposal Sent": "bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-200", Negotiation: "bg-violet-100 text-violet-700 dark:bg-violet-700/30 dark:text-violet-200", "Follow Up": "bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-200", Won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-200", Lost: "bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-200", default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};
const enquiryTypeColor: Record<EnquiryType | 'default', string> = { /* ... (same as your original) ... */
  "Product Info": "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200", "Quote Request": "bg-cyan-100 text-cyan-700 dark:bg-cyan-700/30 dark:text-cyan-200", "Demo Request": "bg-teal-100 text-teal-700 dark:bg-teal-700/30 dark:text-teal-200", Support: "bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-200", Partnership: "bg-lime-100 text-lime-700 dark:bg-lime-700/30 dark:text-lime-200", Sourcing: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-700/30 dark:text-fuchsia-200", Other: "bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-200", default: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-200",
};

// --- Dummy Data for Selects (used by filters and view dialog) ---
const dummySuppliers = [{ id: "SUP001", name: "Supplier Alpha" }, { id: "SUP002", name: "Supplier Beta" }];
const dummyProducts = [{ id: 1, name: "iPhone 15 Pro" }, { id: 2, name: "Galaxy S24 Ultra" }];
const dummySalesPersons = [{ id: "SP001", name: "Alice Wonder" }, { id: "SP002", name: "Bob Builder" }];
const dummyCartoonTypes = [{ id: 1, name: "Master Carton" }, { id: 2, name: "Inner Box" }];
const dummyPaymentTerms = [{ id: 1, name: "Net 30" }, { id: 2, name: "COD" }];

// CSV Exporter (Keep your existing function)
const CSV_LEAD_HEADERS = ["ID", "Lead Number", "Status", "Enquiry Type", "Product Name", "Member ID", "Member Name", "Intent", "Qty", "Target Price", "Sales Person", "Created At"];
const CSV_LEAD_KEYS: (keyof LeadListItem)[] = ["id", "leadNumber", "status", "enquiryType", "productName", "memberId", "memberName", "intent", "qty", "targetPrice", "salesPersonName", "createdAt"];
function exportLeadsToCsv(filename: string, rows: LeadListItem[]) { /* ... (your existing code) ... */
    if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; } const separator = ","; const csvContent = CSV_LEAD_HEADERS.join(separator) + "\n" + rows.map(row => { return CSV_LEAD_KEYS.map(k => { let cell = row[k]; if (cell === null || cell === undefined) cell = ""; else if (cell instanceof Date) cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss"); else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator); }).join("\n"); const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); const link = document.createElement("a"); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; } toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

const LeadActionColumn = ({
  onViewDetail,
  onEdit,
  onDelete,
  onAssign,
  onChangeStatus,
  onConvertToOpportunity,
}: {
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onChangeStatus: () => void;
  onConvertToOpportunity: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-0.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center justify-end gap-1">
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
        placement="bottom-end"
        renderTitle={
          <div
            className={classNames(
              "ml-0.5 mr-2 p-1 rounded-md cursor-pointer",
              hoverBgClass,
              "text-gray-500 dark:text-gray-400"
            )}
          >
            <TbDotsVertical />
          </div>
        }
      >
        <Dropdown.Item onClick={onAssign} className="flex items-center gap-2 text-xs">
          <TbUserPlus size={18} /> Assign Lead
        </Dropdown.Item>
        <Dropdown.Item onClick={onChangeStatus} className="flex items-center gap-2 text-xs">
          <TbArrowsExchange size={18} /> Change Status
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2 text-xs">
          <TbBulb size={18} /> Match Opportunity
        </Dropdown.Item>
        <Dropdown.Item onClick={onConvertToOpportunity} className="flex items-center gap-2 text-xs">
          <TbRocket size={18} /> Convert to Deal
        </Dropdown.Item>
        <Dropdown.Item onClick={onConvertToOpportunity} className="flex items-center gap-2 text-xs">
          <TbPlus size={18} /> Request For
        </Dropdown.Item>
        <Dropdown.Item onClick={onConvertToOpportunity} className="flex items-center gap-2 text-xs">
          <TbPlus size={18} /> Add in Active
        </Dropdown.Item>
        <Dropdown.Item onClick={onConvertToOpportunity} className="flex items-center gap-2 text-xs">
          <TbCalendarTime size={18} /> Add Schedule
        </Dropdown.Item>
        <Dropdown.Item onClick={onConvertToOpportunity} className="flex items-center gap-2 text-xs">
          <TbSubtask size={18} /> Add Task
        </Dropdown.Item>
        <Dropdown.Item onClick={onConvertToOpportunity} className="flex items-center gap-2 text-xs">
          <TbAlertTriangle size={18} /> View Alert
        </Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const LeadSearch = React.forwardRef<HTMLInputElement, any>((props, ref) => <DebouceInput {...props} ref={ref} />);
LeadSearch.displayName = "LeadSearch";
const LeadTableTools = ({ onSearchChange, onFilter, onExport }: any) => ( /* ... (Keep your original) ... */
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex-grow"><LeadSearch onInputChange={onSearchChange} placeholder="Search leads..." /></div>
        <div className="flex gap-2"><Button icon={<TbFilter />} onClick={onFilter}>Filter</Button><Button icon={<TbCloudUpload />} onClick={onExport}>Export</Button></div>
    </div>
);
const LeadTable = (props: any) => <DataTable {...props} />;
const LeadSelectedFooter = ({ selectedItems, onDeleteSelected }: any) => { /* ... (Keep your original) ... */
    const [open, setOpen] = useState(false); if (!selectedItems || selectedItems.length === 0) return null;
    return (<><StickyFooter className="p-4 border-t" stickyClass="-mx-4 sm:-mx-8"><div className="flex items-center justify-between"><span>{selectedItems.length} selected</span><Button size="sm" color="red-500" onClick={()=>setOpen(true)}>Delete Selected</Button></div></StickyFooter><ConfirmDialog isOpen={open} type="danger" onConfirm={()=>{onDeleteSelected(); setOpen(false)}} onClose={()=>setOpen(false)} title="Delete Selected"><p>Sure?</p></ConfirmDialog></>);
};
const DialogDetailRow: React.FC<any> = ({ label, value, isLink, preWrap, breakAll, labelClassName, valueClassName, className }) => { /* ... (Keep your original) ... */
    const defaultLabelClass = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider";
    const defaultValueClass = "text-sm text-slate-700 dark:text-slate-100 mt-0.5";
    return (<div className={`py-1.5 ${className || ''}`}><p className={`${labelClassName || defaultLabelClass}`}>{label}</p>{isLink ? <a href={typeof value === 'string' && (value.startsWith('http') ? value : `/${value}`)} target="_blank" rel="noopener noreferrer" className={`${valueClassName || defaultValueClass} hover:underline text-blue-600 dark:text-blue-400 ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</a> : <div className={`${valueClassName || defaultValueClass} ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</div>}</div>);
};


// --- Main LeadsListing Component ---
const LeadsListing = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { LeadsData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector);

  // States for Drawers & Dialogs that remain in this component
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [isChangeStatusDrawerOpen, setIsChangeStatusDrawerOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingLeadForDrawer, setEditingLeadForDrawer] = useState<LeadListItem | null>(null);
  const [leadToView, setLeadToView] = useState<LeadListItem | null>(null);
  const [isSubmittingDrawer, setIsSubmittingDrawer] = useState(false); // For Assign/Change Status

  // States for table and delete operations
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<LeadListItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(filterFormSchema.parse({}));
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "createdAt" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<LeadListItem[]>([]);

  // Form methods for drawers that remain
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const assignFormMethods = useForm<{ salesPersonId: string | number | null }>({ defaultValues: { salesPersonId: null } });
  const statusFormMethods = useForm<{ newStatus: LeadStatus }>({ defaultValues: { newStatus: "New" } });

  useEffect(() => {
    dispatch(getLeadAction());
    // You might want to fetch options for filter/assign/status drawers here if not static
    // e.g., dispatch(getSalesPersonsAction());
  }, [dispatch]);

  const mappedLeads: LeadListItem[] = useMemo(() => { /* ... (Keep your existing mapping logic) ... */
    if (!Array.isArray(LeadsData)) return [];
    return LeadsData.map((apiLead: any): LeadListItem => ({
        id: apiLead.id, leadNumber: apiLead.lead_number || `LD-${apiLead.id}`, status: apiLead.status || "New",
        enquiryType: apiLead.enquiry_type || "Other", productName: apiLead.product.name,
        memberId: String(apiLead.member_id || apiLead.user_id || 'N/A'), memberName: apiLead.member_name || apiLead.user?.name,
        intent: apiLead.intent, qty: apiLead.qty, targetPrice: apiLead.target_price,
        salesPersonId: apiLead.sales_person_id, salesPersonName: apiLead.sales_person?.name,
        createdAt: new Date(apiLead.created_at), updatedAt: apiLead.updated_at ? new Date(apiLead.updated_at) : undefined,
        sourcingDetails: apiLead.sourcing_details ? (typeof apiLead.sourcing_details === 'string' ? JSON.parse(apiLead.sourcing_details) : apiLead.sourcing_details) : undefined,
    }));
  }, [LeadsData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo((): { pageData: LeadListItem[]; total: number; allFilteredAndSortedData: LeadListItem[] } => {
    // ... (Keep your existing data processing logic) ...
    let processedData: LeadListItem[] = cloneDeep(mappedLeads);
    if (filterCriteria.dateRange?.[0] || filterCriteria.dateRange?.[1]) { const [start, end] = filterCriteria.dateRange.map(d => d ? dayjs(d) : null); processedData = processedData.filter(item => { const itemDate = dayjs(item.createdAt); if (start && end) return itemDate.isBetween(start.startOf('day'), end.endOf('day'), null, '[]'); if (start) return itemDate.isSameOrAfter(start.startOf('day')); if (end) return itemDate.isSameOrBefore(end.endOf('day')); return true; }); }
    if (filterCriteria.filterStatuses?.length) { const statuses = new Set(filterCriteria.filterStatuses); processedData = processedData.filter(item => statuses.has(item.status)); }
    if (filterCriteria.filterEnquiryTypes?.length) { const types = new Set(filterCriteria.filterEnquiryTypes); processedData = processedData.filter(item => types.has(item.enquiryType)); }
    if (filterCriteria.filterIntents?.length) { const intents = new Set(filterCriteria.filterIntents); processedData = processedData.filter(item => !!item.intent && intents.has(item.intent)); }
    if (filterCriteria.filterProductIds?.length) { const productIds = new Set(filterCriteria.filterProductIds); processedData = processedData.filter(item => !!item.sourcingDetails?.productId && productIds.has(item.sourcingDetails.productId)); }
    if (filterCriteria.filterSalesPersonIds?.length) { const spIds = new Set(filterCriteria.filterSalesPersonIds); processedData = processedData.filter(item => !!item.salesPersonId && spIds.has(String(item.salesPersonId))); }
    if (tableData.query) { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(query))); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { processedData.sort((a, b) => { let aVal = a[key as keyof LeadListItem] as any; let bVal = b[key as keyof LeadListItem] as any; if (key === 'createdAt' || key === 'updatedAt') return order === 'asc' ? dayjs(aVal).valueOf() - dayjs(bVal).valueOf() : dayjs(bVal).valueOf() - dayjs(aVal).valueOf(); if (typeof aVal === 'number') return order === 'asc' ? aVal - bVal : bVal - aVal; return order === 'asc' ? String(aVal ?? '').localeCompare(String(bVal ?? '')) : String(bVal ?? '').localeCompare(String(aVal ?? '')); }); }
    const currentTotal = processedData.length; const { pageIndex = 1, pageSize = 10 } = tableData; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [mappedLeads, tableData, filterCriteria]);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData(prev => ({ ...prev, ...data })), []);

  // --- Navigation Handlers ---
  const handleOpenAddLeadPage = useCallback(() => {
    navigate('/sales-leads/lead/add'); // Adjust your route as needed
  }, [navigate]);

  const handleOpenEditLeadPage = useCallback((lead: LeadListItem) => {
    navigate(`/sales-leads/lead/edit/${lead.id}`); // Adjust your route as needed
  }, [navigate]);
  // --- End Navigation Handlers ---

  // Delete Handlers (Single and Selected)
  const handleDeleteClick = useCallback((item: LeadListItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { /* ... (Keep your existing logic, ensure dispatch(getLeadAction()) is called on success) ... */
    if (!itemToDelete) return; setIsProcessingDelete(true);
    try { await dispatch(deleteLeadAction(itemToDelete.id as number)).unwrap(); toast.push(<Notification title="Success" type="success">Lead deleted.</Notification>); dispatch(getLeadAction()); setSelectedItems(p => p.filter(i => i.id !== itemToDelete.id)); }
    catch (e: any) { toast.push(<Notification title="Error" type="danger">{e.message || "Delete failed."}</Notification>); }
    finally { setIsProcessingDelete(false); setItemToDelete(null); setSingleDeleteConfirmOpen(false); }
  }, [dispatch, itemToDelete]);
  const onDeleteSelected = useCallback(async () => { /* ... (Keep your existing logic, ensure dispatch(getLeadAction()) is called on success) ... */
    if (!selectedItems.length) return; setIsProcessingDelete(true);
    const ids = selectedItems.map(item => item.id).join(',');
    try { await dispatch(deleteAllLeadsAction({ ids })).unwrap(); toast.push(<Notification title="Success" type="success">{selectedItems.length} leads deleted.</Notification>); dispatch(getLeadAction()); setSelectedItems([]); }
    catch (e: any) { toast.push(<Notification title="Error" type="danger">{e.message || "Bulk delete failed."}</Notification>); }
    finally { setIsProcessingDelete(false); }
  }, [dispatch, selectedItems]);

  // Drawer Handlers (Assign, Change Status - remain the same)
  const openAssignDrawer = useCallback((lead: LeadListItem) => { setEditingLeadForDrawer(lead); assignFormMethods.reset({ salesPersonId: lead.salesPersonId || null }); setIsAssignDrawerOpen(true); }, [assignFormMethods]);
  const closeAssignDrawer = useCallback(() => { setIsAssignDrawerOpen(false); setEditingLeadForDrawer(null); }, []);
  const onAssignSubmit = useCallback(async (data: { salesPersonId: string | number | null }) => { /* ... (Keep your existing logic, ensure dispatch(getLeadAction()) is called on success) ... */
    if (!editingLeadForDrawer) return; setIsSubmittingDrawer(true);
    try { /* await dispatch(assignLeadAction({ leadId: editingLeadForDrawer.id, salesPersonId: data.salesPersonId })).unwrap(); */ console.log("Simulating assign..."); await new Promise(r => setTimeout(r,500)); toast.push(<Notification title="Success" type="success">Lead assigned.</Notification>); closeAssignDrawer(); dispatch(getLeadAction()); }
    catch (error: any) { toast.push(<Notification title="Error" type="danger">Assignment failed.</Notification>); }
    finally { setIsSubmittingDrawer(false); }
  }, [dispatch, editingLeadForDrawer, closeAssignDrawer]);

  const openChangeStatusDrawer = useCallback((lead: LeadListItem) => { setEditingLeadForDrawer(lead); statusFormMethods.reset({ newStatus: lead.status }); setIsChangeStatusDrawerOpen(true); }, [statusFormMethods]);
  const closeChangeStatusDrawer = useCallback(() => { setIsChangeStatusDrawerOpen(false); setEditingLeadForDrawer(null); }, []);
  const onChangeStatusSubmit = useCallback(async (data: { newStatus: LeadStatus }) => { /* ... (Keep your existing logic, ensure dispatch(getLeadAction()) is called on success) ... */
    if (!editingLeadForDrawer) return; setIsSubmittingDrawer(true);
    try { /* await dispatch(changeLeadStatusAction({ leadId: editingLeadForDrawer.id, newStatus: data.newStatus })).unwrap(); */ console.log("Simulating status change..."); await new Promise(r => setTimeout(r,500)); toast.push(<Notification title="Success" type="success">Status updated.</Notification>); closeChangeStatusDrawer(); dispatch(getLeadAction()); }
    catch (error: any) { toast.push(<Notification title="Error" type="danger">Status update failed.</Notification>); }
    finally { setIsSubmittingDrawer(false); }
  }, [dispatch, editingLeadForDrawer, closeChangeStatusDrawer]);


  // Other Handlers (View Dialog, Export, Pagination, Sort, Search, Filter - remain the same)
  const handleConvertToOpportunity = useCallback((lead: LeadListItem) => { /* ... (Keep) ... */ toast.push(<Notification title="Info" type="info">Convert to Opportunity: Not Implemented</Notification>); }, []);
  const openViewDialog = useCallback((lead: LeadListItem) => { setLeadToView(lead); setIsViewDialogOpen(true); }, []);
  const closeViewDialog = useCallback(() => { setIsViewDialogOpen(false); setLeadToView(null);}, []); // Added setLeadToView(null)
  const handleExportData = useCallback(() => exportLeadsToCsv("leads_export.csv", allFilteredAndSortedData), [allFilteredAndSortedData]);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handlePageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: LeadListItem) => setSelectedItems(prev => checked ? (prev.some(i => i.id === row.id) ? prev : [...prev, row]) : prev.filter(i => i.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<LeadListItem>[]) => { /* ... (Keep) ... */ const originals = currentRows.map(r => r.original); if (checked) setSelectedItems(prev => { const oldIds = new Set(prev.map(i => i.id)); return [...prev, ...originals.filter(o => !oldIds.has(o.id))]; }); else { const currentIds = new Set(originals.map(o => o.id)); setSelectedItems(prev => prev.filter(i => !currentIds.has(i.id))); } }, []);
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [handleSetTableData, closeFilterDrawer]);
  const onClearFilters = useCallback(() => { const defaults = filterFormSchema.parse({}); filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);

  const columns: ColumnDef<LeadListItem>[] = useMemo(() => [
    // ... (Keep your existing column definitions) ...
    // Ensure onEdit in LeadActionColumn calls handleOpenEditLeadPage
    { header: "Status", accessorKey: "status", size: 120, cell: (props: CellContext<LeadListItem, any>) => <Tag className={`${leadStatusColor[props.row.original.status] || leadStatusColor.default} capitalize px-2 py-1 text-xs`}>{props.row.original.status}</Tag> },
    { header: "Lead", accessorKey: "leadNumber", size: 130, 
      cell: (props)=>{
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span>{props.getValue()}</span>
            <div>
              <Tag className={`${enquiryTypeColor[props.row.original.enquiryType] || enquiryTypeColor.default} capitalize px-2 py-1 text-xs`}>{props.row.original.enquiryType}</Tag>
            </div>
          </div>
        )
      }
    },
    // { header: "Enquiry Type", accessorKey: "enquiryType", size: 140, cell: (props: CellContext<LeadListItem, any>) => <Tag className={`${enquiryTypeColor[props.row.original.enquiryType] || enquiryTypeColor.default} capitalize px-2 py-1 text-xs`}>{props.row.original.enquiryType}</Tag> },
    { header: "Product", accessorKey: "productName", size: 200, cell: (props: CellContext<LeadListItem, any>) => props.row.original.productName || '-' },
    { header: "Member", accessorKey: "memberName", size: 150, 
      cell: (props: CellContext<LeadListItem, any>) => {
        // props.row.original.memberName || props.row.original.memberId
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            {/* <span>Buyer: {props.row.original.memberId}</span> */}
            <b>Buyer: {props.row.original.memberId}</b>
            <span>Dharmesh Soni</span>
            <b>Seller: 7022359</b>
            <span>Mahesh Bhatt</span>
          </div>
        )
      } 
    },
    { header: "Want To", 
      size: 220,
      cell : (props)=>{
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <div>
              <Tag>Buy</Tag>
            </div>
            <span>Qty: 400</span>
            <span>Target Price: 5000</span>
            <span>Sales Person : {props.row.original.salesPersonName || "Mukesh"}</span>
            <b>{dayjs(props.row.original.createdAt).format("DD MMM, YYYY HH:mm")}</b>
          </div>
        )
      }
    },
    // { header: "Sales Person", accessorKey: "salesPersonName", size: 140, cell: (props: CellContext<LeadListItem, any>) => props.row.original.salesPersonName || 'Unassigned' },
    // { header: "Created At", accessorKey: "createdAt", size: 160, cell: (props: CellContext<LeadListItem, any>) => dayjs(props.row.original.createdAt).format("YYYY-MM-DD HH:mm") },
    { header: "Actions", id: "actions",         meta: { HeaderClass: "text-center", cellClass: "text-center" },
        size: 80,
      cell: (props: CellContext<LeadListItem, any>) => (
        <LeadActionColumn
          onViewDetail={() => openViewDialog(props.row.original)}
          onEdit={() => handleOpenEditLeadPage(props.row.original)} // Updated to navigate
          onDelete={() => handleDeleteClick(props.row.original)}
          onAssign={() => openAssignDrawer(props.row.original)}
          onChangeStatus={() => openChangeStatusDrawer(props.row.original)}
          onConvertToOpportunity={() => handleConvertToOpportunity(props.row.original)}
        />
      )
    },
  ], [openViewDialog, handleOpenEditLeadPage, handleDeleteClick, openAssignDrawer, openChangeStatusDrawer, handleConvertToOpportunity]);

  const tableIsLoading = masterLoadingStatus === "loading" || masterLoadingStatus === 'pending' || isSubmittingDrawer || isProcessingDelete;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Leads Listing</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={handleOpenAddLeadPage}>Add New</Button> {/* Updated */}
          </div>
          <LeadTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4 flex-grow overflow-y-auto">
            <LeadTable columns={columns} data={pageData} loading={tableIsLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>
      <LeadSelectedFooter selectedItems={selectedItems} onDeleteSelected={onDeleteSelected} />

      {/* View Dialog (Keep your existing complex View Dialog) */}
      <Dialog isOpen={isViewDialogOpen} onClose={closeViewDialog} onRequestClose={closeViewDialog} size="max-w-2xl" title="" contentClassName="!p-0 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {leadToView ? (
          <div className="flex flex-col" style={{ maxHeight: '85vh' }}>
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Lead: {leadToView.leadNumber}</h2>
                <Tooltip title="Edit Lead"><Button shape="circle" variant="ghost" size="sm" icon={<TbPencil className="text-slate-500 hover:text-blue-600" />} onClick={() => { closeViewDialog(); handleOpenEditLeadPage(leadToView); }}/></Tooltip>
              </div>
            </div>
            <div className="flex-grow p-5 overflow-y-auto custom-scrollbar">
              <div className="pr-4 md:pr-6 space-y-5">
                <div> {/* Lead Overview Section */}
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
                {leadToView.sourcingDetails && (<div> {/* Sourcing Specifics Section */}
                  <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 mt-4">Sourcing Specifics</h6>
                  <div className="p-4 bg-white dark:bg-slate-700/60 rounded-lg shadow-sm space-y-2.5">
                    {leadToView.sourcingDetails.supplierId && <DialogDetailRow label="Supplier" value={dummySuppliers.find(s => s.id === leadToView.sourcingDetails?.supplierId)?.name || String(leadToView.sourcingDetails.supplierId)} />}
                    {leadToView.sourcingDetails.productId && <DialogDetailRow label="Sourced Product" value={dummyProducts.find(p => p.id === leadToView.sourcingDetails?.productId)?.name || `ID: ${leadToView.sourcingDetails.productId}`} />}
                    {/* ... Add all other sourcing details from your original dialog ... */}
                    {leadToView.sourcingDetails.qty && <DialogDetailRow label="Sourced Qty" value={String(leadToView.sourcingDetails.qty)} />}
                    {leadToView.sourcingDetails.price && <DialogDetailRow label="Sourced Price" value={`$${leadToView.sourcingDetails.price.toFixed(2)}`} />}
                    {leadToView.sourcingDetails.productStatus && <DialogDetailRow label="Product Status" value={leadToView.sourcingDetails.productStatus} />}
                    {leadToView.sourcingDetails.deviceCondition && <DialogDetailRow label="Device Condition" value={leadToView.sourcingDetails.deviceCondition} />}
                    {leadToView.sourcingDetails.color && <DialogDetailRow label="Color" value={leadToView.sourcingDetails.color} />}
                    {leadToView.sourcingDetails.cartoonTypeId && <DialogDetailRow label="Cartoon Type" value={dummyCartoonTypes.find(c => c.id === leadToView.sourcingDetails?.cartoonTypeId)?.name || '-'} />}
                    {leadToView.sourcingDetails.dispatchStatus && <DialogDetailRow label="Dispatch Status" value={leadToView.sourcingDetails.dispatchStatus} />}
                    {leadToView.sourcingDetails.paymentTermId && <DialogDetailRow label="Payment Term" value={dummyPaymentTerms.find(p => p.id === leadToView.sourcingDetails?.paymentTermId)?.name || '-'} />}
                    {leadToView.sourcingDetails.eta && <DialogDetailRow label="ETA" value={leadToView.sourcingDetails.eta ? (dayjs(leadToView.sourcingDetails.eta).isValid() ? dayjs(leadToView.sourcingDetails.eta).format('MMM D, YYYY') : String(leadToView.sourcingDetails.eta)) : '-'} />}
                    {leadToView.sourcingDetails.location && <DialogDetailRow label="Location" value={leadToView.sourcingDetails.location} />}
                    {leadToView.sourcingDetails.deviceType && <DialogDetailRow label="Device Type" value={leadToView.sourcingDetails.deviceType} />}
                    {leadToView.sourcingDetails.internalRemarks && <DialogDetailRow label="Internal Remarks" value={leadToView.sourcingDetails.internalRemarks} preWrap />}
                  </div>
                </div>)}
                <AdaptiveCard className="!mt-5 bg-white dark:bg-slate-700/60 border-slate-200 dark:border-slate-600 p-4 shadow-sm">
                  <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Activity Log</h6>
                  <div className="space-y-1.5">
                    <DialogDetailRow label="Created On" value={<><span className="text-sm">{dayjs(leadToView.createdAt).format('MMM D, YYYY')}</span><span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">{dayjs(leadToView.createdAt).format('h:mm A')}</span></>} />
                    {leadToView.updatedAt && <DialogDetailRow label="Last Updated" value={<><span className="text-sm">{dayjs(leadToView.updatedAt).format('MMM D, YYYY')}</span><span className="text-slate-500 dark:text-slate-400 text-[10px] ml-1">{dayjs(leadToView.updatedAt).format('h:mm A')}</span></>} />}
                  </div>
                </AdaptiveCard>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-2 rounded-b-xl">
              <Button variant="solid" color="blue-600" onClick={closeViewDialog} size="sm" className="font-medium min-w-[80px]">Close</Button>
            </div>
          </div>
        ) : <div className="p-10 text-center"><TbInfoCircle size={32} className="mx-auto mb-2 text-gray-400"/><p>Loading lead details...</p></div>}
      </Dialog>


      {/* Assign Lead Drawer (Keep) */}
      <Drawer title="Assign Lead" isOpen={isAssignDrawerOpen} onClose={closeAssignDrawer} width={400} footer={<div className="text-right p-4 border-t"><Button size="sm" className="mr-2" onClick={closeAssignDrawer}>Cancel</Button><Button size="sm" variant="solid" form="assignLeadForm" type="submit" loading={isSubmittingDrawer}>Assign</Button></div>}>
        <Form id="assignLeadForm" onSubmit={assignFormMethods.handleSubmit(onAssignSubmit)} className="p-4">
          <p className="mb-4">Assign lead <strong>{editingLeadForDrawer?.leadNumber}</strong>.</p>
          <FormItem label="Sales Person" error={assignFormMethods.formState.errors.salesPersonId?.message}><Controller name="salesPersonId" control={assignFormMethods.control} render={({ field }) => <UiSelect options={dummySalesPersons.map(sp => ({value: sp.id, label: sp.name}))} value={dummySalesPersons.find(sp => sp.id === field.value)} onChange={opt => field.onChange(opt?.value)} placeholder="Select Sales Person" />} /></FormItem>
        </Form>
      </Drawer>

      {/* Change Status Drawer (Keep) */}
      <Drawer title="Change Lead Status" isOpen={isChangeStatusDrawerOpen} onClose={closeChangeStatusDrawer} width={400} footer={<div className="text-right p-4 border-t"><Button size="sm" className="mr-2" onClick={closeChangeStatusDrawer}>Cancel</Button><Button size="sm" variant="solid" form="changeStatusForm" type="submit" loading={isSubmittingDrawer}>Update</Button></div>}>
        <Form id="changeStatusForm" onSubmit={statusFormMethods.handleSubmit(onChangeStatusSubmit)} className="p-4">
          <p className="mb-4">Change status for <strong>{editingLeadForDrawer?.leadNumber}</strong>.</p>
          <FormItem label="New Status" error={statusFormMethods.formState.errors.newStatus?.message}><Controller name="newStatus" control={statusFormMethods.control} render={({ field }) => <UiSelect options={leadStatusOptionsConst} value={leadStatusOptionsConst.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt?.value as LeadStatus)} placeholder="Select New Status" />} /></FormItem>
        </Form>
      </Drawer>

      {/* Filter Drawer (Keep) */}
      <Drawer title="Filter Leads" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} footer={<div className="text-right p-4 border-t"><Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterLeadForm" type="submit">Apply</Button></div>}>
        <Form id="filterLeadForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4 p-4 h-full">
            <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti options={leadStatusOptionsConst} value={leadStatusOptionsConst.filter(o=>field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Enquiry Type"><Controller name="filterEnquiryTypes" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti options={enquiryTypeOptionsConst} value={enquiryTypeOptionsConst.filter(o=>field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Intent"><Controller name="filterIntents" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti options={leadIntentOptionsConst} value={leadIntentOptionsConst.filter(o=>field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Product (Sourced)"><Controller name="filterProductIds" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti options={dummyProducts.map(p=>({value:p.id, label:p.name}))} value={dummyProducts.filter(o=>field.value?.includes(o.value)).map(p=>({value:p.id, label:p.name}))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Sales Person"><Controller name="filterSalesPersonIds" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti options={dummySalesPersons.map(p=>({value:p.id, label:p.name}))} value={dummySalesPersons.filter(o=>field.value?.includes(String(o.value))).map(p=>({value:p.id, label:p.name}))} onChange={opts => field.onChange(opts?.map(o => o.value) || [])} />} /></FormItem>
            <FormItem label="Date Range"><Controller name="dateRange" control={filterFormMethods.control} render={({ field }) => <DatePicker.DatePickerRange value={field.value as any} onChange={field.onChange} />} /></FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Lead" onClose={() => setSingleDeleteConfirmOpen(false)} onConfirm={onConfirmSingleDelete} loading={isProcessingDelete} onCancel={() => setSingleDeleteConfirmOpen(false)}><p>Delete <strong>{itemToDelete?.leadNumber}</strong>?</p></ConfirmDialog>
    </>
  );
};
export default LeadsListing;