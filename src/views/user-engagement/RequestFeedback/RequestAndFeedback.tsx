// src/views/your-path/RequestAndFeedbackListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag, Dialog } from "@/components/ui";

// Icons
import {
  TbPencil, TbTrash, TbChecks, TbEye, TbSearch, TbFilter, TbPlus,
  TbCloudUpload, TbUserCircle, TbMail, TbPhone, TbBuilding,
  TbMessageDots, TbClipboardText, TbStar, TbPaperclip, TbToggleRight,
  TbReload,
  TbUsersPlus,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { shallowEqual, useSelector } from "react-redux";
import {
  getRequestFeedbacksAction, addRequestFeedbackAction, editRequestFeedbackAction,
  deleteRequestFeedbackAction, deleteAllRequestFeedbacksAction,
} from '@/reduxtool/master/middleware'; // Adjust path
import { masterSelector } from '@/reduxtool/master/masterSlice'; // Adjust path
import { Link } from "react-router-dom";

// --- Define Types ---
export type SelectOption = { value: string; label: string };
export type RequestFeedbackApiStatus = "unread" | "read" | "in_progress" | "resolved" | "closed" | string;
export type RequestFeedbackFormStatus = "unread" | "read" | "in_progress" | "resolved" | "closed";
export type RequestFeedbackType = "Feedback" | "Request" | "Complaint" | "Query" | string;

export type RequestFeedbackItem = {
  id: string | number; customer_id: string; name: string; email: string;
  mobile_no: string; company_name?: string | null; feedback_details: string;
  attachment?: string | null; type: RequestFeedbackType; status: RequestFeedbackApiStatus;
  created_at: string; updated_at: string; subject?: string | null;
  rating?: number | string | null; deleted_at?: string | null;
  icon_full_path?: File | string;
};

const TYPE_OPTIONS: SelectOption[] = [ { value: "Feedback", label: "Feedback" }, { value: "Request", label: "Request" }, { value: "Complaint", label: "Complaint" }, { value: "Query", label: "General Query" }];
const typeValues = TYPE_OPTIONS.map(t => t.value) as [string, ...string[]];
const STATUS_OPTIONS_FORM: { value: RequestFeedbackFormStatus; label: string }[] = [ { value: "unread", label: "Unread" }, { value: "read", label: "Read" }, { value: "in_progress", label: "In Progress" }, { value: "resolved", label: "Resolved" }, { value: "closed", label: "Closed" }];
const statusFormValues = STATUS_OPTIONS_FORM.map(s => s.value) as [RequestFeedbackFormStatus, ...RequestFeedbackFormStatus[]];
const statusColors: Record<RequestFeedbackApiStatus, string> = { unread: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100", read: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100", in_progress: "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-100", resolved: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-100", closed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100", default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"};
const RATING_OPTIONS: SelectOption[] = [ { value: "1", label: "1 Star (Poor)" }, { value: "2", label: "2 Stars (Fair)" }, { value: "3", label: "3 Stars (Average)" }, { value: "4", label: "4 Stars (Good)" }, { value: "5", label: "5 Stars (Excellent)" }];
const ratingValues = RATING_OPTIONS.map(r => r.value) as [string, ...string[]];

const requestFeedbackFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  email: z.string().email("Invalid email address.").min(1, "Email is required."),
  mobile_no: z.string().min(1, "Mobile number is required.").max(20),
  company_name: z.string().max(150).optional().or(z.literal("")),
  feedback_details: z.string().min(10, "Details must be at least 10 characters.").max(5000),
  type: z.enum(typeValues, { errorMap: () => ({ message: "Please select a type." }) }),
  status: z.enum(statusFormValues, { errorMap: () => ({ message: "Please select a status." }) }),
  subject: z.string().max(255).optional().or(z.literal("")),
  rating: z.enum(ratingValues).optional().nullable(),
  attachment: z.any().optional(),
});
type RequestFeedbackFormData = z.infer<typeof requestFeedbackFormSchema>;

const filterFormSchema = z.object({
  filterType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterRating: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const CSV_HEADERS_RF = ["ID", "Name", "Email", "Mobile No", "Company", "Type", "Subject", "Details", "Rating", "Status", "Attachment", "Date"];
const CSV_KEYS_RF: (keyof Pick<RequestFeedbackItem, 'id' | 'name' | 'email' | 'mobile_no' | 'company_name' | 'type' | 'subject' | 'feedback_details' | 'rating' | 'status' | 'attachment' | 'created_at'>)[] = [ "id", "name", "email", "mobile_no", "company_name", "type", "subject", "feedback_details", "rating", "status", "attachment", "created_at"];
function exportRequestFeedbacksToCsv(filename: string, rows: RequestFeedbackItem[]) { if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; } const preparedRows = rows.map((row) => ({ ...row, type: TYPE_OPTIONS.find(t => t.value === row.type)?.label || row.type, status: STATUS_OPTIONS_FORM.find(s => s.value === row.status)?.label || row.status, rating: RATING_OPTIONS.find(r => r.value === String(row.rating || ''))?.label || (row.rating ? String(row.rating) : "N/A"), created_at: new Date(row.created_at).toLocaleDateString(), })); const separator = ","; const csvContent = CSV_HEADERS_RF.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_RF.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n"); const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); const link = document.createElement("a"); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; } toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false; }

const ItemActionColumn = ({ onEdit, onViewDetail, onDelete }: { onEdit: () => void; onViewDetail: () => void; onDelete: () => void; }) => ( <div className="flex items-center justify-center gap-1"> <Tooltip title="Edit"><div className="text-xl cursor-pointer text-gray-500 hover:text-emerald-600" role="button" onClick={onEdit}><TbPencil /></div></Tooltip> <Tooltip title="View"><div className="text-xl cursor-pointer text-gray-500 hover:text-blue-600" role="button" onClick={onViewDetail}><TbEye /></div></Tooltip> <Tooltip title="Assign Task"><Link to="/task/task-list/create" className="text-xl cursor-pointer text-gray-500 hover:text-red-600" role="button"><TbUsersPlus size={18} /></Link></Tooltip> <Tooltip title="Delete"><div className="text-xl cursor-pointer text-gray-500 hover:text-red-600" role="button" onClick={onDelete}><TbTrash /></div></Tooltip> </div> );
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>( ({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters : () => void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: ItemTableToolsProps) => ( <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"> <Tooltip title="Clear Filters"><Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button></Tooltip><Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div> );
type RequestFeedbacksTableProps = { columns: ColumnDef<RequestFeedbackItem>[]; data: RequestFeedbackItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: RequestFeedbackItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: RequestFeedbackItem) => void; onAllRowSelect: (checked: boolean, rows: Row<RequestFeedbackItem>[]) => void; };
const RequestFeedbacksTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: RequestFeedbacksTableProps) => ( <DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} /> );
type RequestFeedbacksSelectedFooterProps = { selectedItems: RequestFeedbackItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const RequestFeedbacksSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: RequestFeedbacksSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; return ( <> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold"> {selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""} selected </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Item(s)`} onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }}> <p>Are you sure you want to delete the selected item(s)?</p> </ConfirmDialog> </> ); };

const RequestAndFeedbackListing = () => {
  const dispatch = useAppDispatch();
  const { requestFeedbacksData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RequestFeedbackItem | null>(null);
  const [viewingItem, setViewingItem] = useState<RequestFeedbackItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RequestFeedbackItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<RequestFeedbackItem[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);

  useEffect(() => { dispatch(getRequestFeedbacksAction()); }, [dispatch]);

  const formMethods = useForm<RequestFeedbackFormData>({ resolver: zodResolver(requestFeedbackFormSchema), mode: "onChange" });
  const { control, handleSubmit, reset, formState: { errors, isValid } } = formMethods; // Destructure isValid

  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });

  const openAddDrawer = useCallback(() => {
    reset({ name: "", email: "", mobile_no: "", company_name: "", feedback_details: "", type: TYPE_OPTIONS[0]?.value, status: STATUS_OPTIONS_FORM[0]?.value, subject: "", rating: null, attachment: undefined });
    setSelectedFile(null); setRemoveExistingAttachment(false); setEditingItem(null); setIsAddDrawerOpen(true);
  }, [reset]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback((item: RequestFeedbackItem) => {
    setEditingItem(item); setSelectedFile(null); setRemoveExistingAttachment(false);
    reset({ name: item.name, email: item.email, mobile_no: item.mobile_no, company_name: item.company_name || "", feedback_details: item.feedback_details, type: item.type, status: item.status as RequestFeedbackFormStatus, subject: item.subject || "", rating: item.rating ? String(item.rating) : null, attachment: undefined });
    setIsEditDrawerOpen(true);
  }, [reset]);
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);
  const openViewDialog = useCallback((item: RequestFeedbackItem) => setViewingItem(item), []);
  const closeViewDialog = useCallback(() => setViewingItem(null), []);

  const onSubmitHandler = async (data: RequestFeedbackFormData) => {
    setIsSubmitting(true); const formData = new FormData();
    formData.append("name", data.name); formData.append("email", data.email); formData.append("mobile_no", data.mobile_no);
    if (data.company_name) formData.append("company_name", data.company_name);
    formData.append("feedback_details", data.feedback_details); formData.append("type", data.type);
    formData.append("status", data.status);
    if (data.subject) formData.append("subject", data.subject);
    if (data.rating) formData.append("rating", data.rating);

    if (editingItem) {
      formData.append("_method", "PUT");
      formData.append("customer_id", String(editingItem.customer_id));
      if (selectedFile instanceof File) { formData.append("attachment", selectedFile); }
      else if (removeExistingAttachment) { formData.append("delete_attachment", "true"); }
    } else {
      formData.append("customer_id", "0"); // Default or from logged-in user
      if (selectedFile instanceof File) { formData.append("attachment", selectedFile); }
    }

    try {
      if (editingItem) { await dispatch(editRequestFeedbackAction({ id: editingItem.id, formData })).unwrap(); toast.push(<Notification title="Entry Updated" type="success" />); closeEditDrawer(); }
      else { await dispatch(addRequestFeedbackAction(formData)).unwrap(); toast.push(<Notification title="Entry Added" type="success" />); closeAddDrawer(); }
      dispatch(getRequestFeedbacksAction());
    } catch (e: any) { 
      console.log(e)
      const errorMessage = e?.response?.data?.message || e?.message || (editingItem ? "Update Failed" : "Add Failed"); toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger">{errorMessage}</Notification>);
    } finally { setIsSubmitting(false); setRemoveExistingAttachment(false); }
  };

  const handleDeleteClick = useCallback((item: RequestFeedbackItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteRequestFeedbackAction({ id: itemToDelete.id })).unwrap(); toast.push(<Notification title="Entry Deleted" type="success">{`Entry from "${itemToDelete.name}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id)); dispatch(getRequestFeedbacksAction()); } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger">{(e as Error).message}</Notification>); } finally { setIsDeleting(false); setItemToDelete(null); } }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const idsToDelete = selectedItems.map((item) => String(item.id)); try { await dispatch(deleteAllRequestFeedbacksAction({ ids: idsToDelete.join(',') })).unwrap(); toast.push(<Notification title="Deletion Successful" type="success">{`${idsToDelete.length} item(s) deleted.`}</Notification>); setSelectedItems([]); dispatch(getRequestFeedbacksAction()); } catch (e: any) { toast.push(<Notification title="Deletion Failed" type="danger">{(e as Error).message}</Notification>); } finally { setIsDeleting(false); } }, [dispatch, selectedItems]);
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer]); // Removed filterFormMethods from deps
  const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1 })); }, [filterFormMethods]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: RequestFeedbackItem[] = cloneDeep(Array.isArray(requestFeedbacksData) ? requestFeedbacksData : []);
    if (filterCriteria.filterType?.length) { const v = filterCriteria.filterType.map(o => o.value); processedData = processedData.filter(item => v.includes(item.type)); }
    if (filterCriteria.filterStatus?.length) { const v = filterCriteria.filterStatus.map(o => o.value); processedData = processedData.filter(item => v.includes(item.status)); }
    if (filterCriteria.filterRating?.length) { const v = filterCriteria.filterRating.map(o => o.value); processedData = processedData.filter(item => v.includes(String(item.rating || ''))); }
    if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => String(item.id).toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q) || item.mobile_no.toLowerCase().includes(q) || (item.company_name && item.company_name.toLowerCase().includes(q)) || (item.subject && item.subject.toLowerCase().includes(q)) || item.feedback_details.toLowerCase().includes(q)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) { processedData.sort((a, b) => { const aVal = a[key as keyof RequestFeedbackItem]; const bVal = b[key as keyof RequestFeedbackItem]; if (key === "created_at" || key === "updated_at") { return order === "asc" ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime(); } const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase(); return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr); }); }
    const dataToExport = [...processedData]; const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [requestFeedbacksData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => { exportRequestFeedbacksToCsv("request_feedbacks.csv", allFilteredAndSortedData); }, [allFilteredAndSortedData]);
  const handlePaginationChange = useCallback((page: number) => setTableData(prev => ({ ...prev, pageIndex: page })), []);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData(prev => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleSearchInputChange = useCallback((query: string) => { setTableData(prev => ({ ...prev, query: query, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: RequestFeedbackItem) => {setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); });}, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<RequestFeedbackItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);
  const itemPath = (filename: any) => { const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000"; return filename ? `${baseUrl}/storage/${filename}` : '#'; };

  const columns: ColumnDef<RequestFeedbackItem>[] = useMemo(() => [
    { 
      header: "User Info", 
      accessorKey: "name", 
      size: 150, 
      cell: props => (
        <div className="flex flex-col gap-1 text-xs">
          <span className="font-semibold">{props.getValue<string>() || "N/A"}</span> 
          <span className="">{props.row.original.email || "N/A"}</span> 
          <span className="">{props.row.original.mobile_no || "N/A"}</span> 
        </div>
      )
    },
    // { header: "Email", accessorKey: "email", size: 180, cell: props => props.getValue() || "N/A" },
    // { header: "Mobile No", accessorKey: "mobile_no", size: 120, cell: props => props.getValue() || "N/A" },
    { header: "Type", accessorKey: "type", size: 100, cell: props => <Tag className="capitalize">{TYPE_OPTIONS.find(t => t.value === props.getValue())?.label || props.getValue() || "N/A"}</Tag> },
    { header: "Subject", accessorKey: "subject", size: 150, cell: props => <div className="truncate w-36" title={props.getValue() as string}>{props.getValue() as string || "N/A"}</div>},
    { header: "Status", accessorKey: "status", size: 100, cell: props => { const s = props.getValue<RequestFeedbackApiStatus>(); return (<Tag className={classNames("capitalize", statusColors[s] || statusColors.default)}>{STATUS_OPTIONS_FORM.find(opt => opt.value === s)?.label || s || "N/A"}</Tag> );} },
    { header: "Rating", accessorKey: "rating", size: 80, cell: props => props.getValue() ? `${props.getValue()} Star(s)` : "N/A" },
    { header: "Date", accessorKey: "created_at", size: 100, cell: props => props.getValue() ? new Date(props.getValue<string>()).toLocaleDateString() : "N/A" },
    { header: "Actions", id: "actions", meta: { HeaderClass: "text-center", cellClass: "text-center" }, size: 120, cell: (props) => <ItemActionColumn onEdit={() => openEditDrawer(props.row.original)} onViewDetail={() => openViewDialog(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
  ], [openEditDrawer, openViewDialog, handleDeleteClick]); // Ensure dependencies are stable

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem label="Name" invalid={!!errors.name} errorMessage={errors.name?.message}> <Controller name="name" control={control} render={({ field }) => (<Input {...field} prefix={<TbUserCircle />} placeholder="Full Name" />)} /> </FormItem>
      <FormItem label="Email" invalid={!!errors.email} errorMessage={errors.email?.message}> <Controller name="email" control={control} render={({ field }) => (<Input {...field} type="email" prefix={<TbMail />} placeholder="example@domain.com" />)} /> </FormItem>
      <FormItem label="Mobile No." invalid={!!errors.mobile_no} errorMessage={errors.mobile_no?.message}> <Controller name="mobile_no" control={control} render={({ field }) => (<Input {...field} type="tel" prefix={<TbPhone />} placeholder="+XX XXXXXXXXXX" />)} /> </FormItem>
      <FormItem label="Company Name (Optional)" invalid={!!errors.company_name} errorMessage={errors.company_name?.message}> <Controller name="company_name" control={control} render={({ field }) => (<Input {...field} prefix={<TbBuilding />} placeholder="Your Company" />)} /> </FormItem>
      <FormItem label="Type" invalid={!!errors.type} errorMessage={errors.type?.message}> <Controller name="type" control={control} render={({ field }) => (<Select placeholder="Select Type" options={TYPE_OPTIONS} value={TYPE_OPTIONS.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbMessageDots/>} />)} /> </FormItem>
      <FormItem label="Status" invalid={!!errors.status} errorMessage={errors.status?.message}> <Controller name="status" control={control} render={({ field }) => (<Select placeholder="Select Status" options={STATUS_OPTIONS_FORM} value={STATUS_OPTIONS_FORM.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbToggleRight/>} />)} /> </FormItem>
      <FormItem label="Subject (Optional)" className="md:col-span-2" invalid={!!errors.subject} errorMessage={errors.subject?.message}> <Controller name="subject" control={control} render={({ field }) => (<Input {...field} prefix={<TbClipboardText/>} placeholder="Brief subject of your message" />)} /> </FormItem>
      <FormItem label="Rating (Optional, for Feedback)" className="md:col-span-2" invalid={!!errors.rating} errorMessage={errors.rating?.message}> <Controller name="rating" control={control} render={({ field }) => (<Select placeholder="Select Rating" options={RATING_OPTIONS} value={RATING_OPTIONS.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} isClearable prefix={<TbStar/>} />)} /> </FormItem>
      <FormItem label="Feedback / Request Details" className="md:col-span-2" invalid={!!errors.feedback_details} errorMessage={errors.feedback_details?.message}> <Controller name="feedback_details" control={control} render={({ field }) => (<Input textArea {...field} rows={5} placeholder="Describe your feedback or request in detail..." />)} /> </FormItem>
      <FormItem label="Attachment (Optional)" className="md:col-span-2" invalid={!!errors.attachment} errorMessage={errors.attachment?.message as string}>
        <Controller name="attachment" control={control}
          render={({ field: { onChange, onBlur, name, ref } }) => (
            <Input type="file" name={name} ref={ref} onBlur={onBlur}
              onChange={(e) => { const file = e.target.files?.[0]; onChange(file); setSelectedFile(file || null); if (file) setRemoveExistingAttachment(false); }}
              prefix={<TbPaperclip />} /> )} />
        {editingItem?.attachment && !selectedFile && (
          <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
            <span> Current: <a href={editingItem?.icon_full_path} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">view current image</a> </span>
            {!removeExistingAttachment && (<Button size="xs" variant="plain" className="text-red-500 hover:text-red-700" onClick={() => { setRemoveExistingAttachment(true); formMethods.setValue('attachment', undefined); setSelectedFile(null); }}>Remove</Button>)}
            {removeExistingAttachment && (<span className="text-red-500 text-xs">Marked for removal</span>)}
          </div> )}
      </FormItem>
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"> <h5 className="mb-2 sm:mb-0">Requests & Feedbacks</h5> <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button> </div>
<<<<<<< HEAD
          <ItemTableTools onSearchChange={handleSearchInputChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4"> <RequestFeedbacksTable columns={columns} data={pageData} loading={masterLoadingStatus === "idle" || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /> </div>
=======
          <ItemTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchInputChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4"> <RequestFeedbacksTable columns={columns} data={pageData} loading={masterLoadingStatus === "idle" || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /> </div>
>>>>>>> 5106a8698a6ca509ec36ac336f7fdcc9dfe62432
        </AdaptiveCard>
      </Container>
      <RequestFeedbacksSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <Drawer title={editingItem ? "Edit Entry" : "Add New Entry"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={700}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> <Button size="sm" variant="solid" form="requestFeedbackForm" type="submit" loading={isSubmitting} disabled={!isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button> </div> } >
        <Form id="requestFeedbackForm" onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-4"> {renderDrawerForm(formMethods)} </Form>
      </Drawer>
      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={600}>
        <div className="p-1"> <h5 className="mb-6 border-b pb-4 dark:border-gray-600">Details: {viewingItem?.subject || viewingItem?.name}</h5> {viewingItem && ( <div className="space-y-3 text-sm"> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">ID:</span><span className="w-2/3">{viewingItem.id}</span></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Customer ID:</span><span className="w-2/3">{viewingItem.customer_id === "0" ? "N/A (Guest)" : viewingItem.customer_id}</span></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Name:</span><span className="w-2/3">{viewingItem.name}</span></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Email:</span><span className="w-2/3">{viewingItem.email}</span></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Mobile No:</span><span className="w-2/3">{viewingItem.mobile_no || "N/A"}</span></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Company:</span><span className="w-2/3">{viewingItem.company_name || "N/A"}</span></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Type:</span><Tag className="capitalize">{TYPE_OPTIONS.find(t => t.value === viewingItem.type)?.label || viewingItem.type}</Tag></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Subject:</span><span className="w-2/3">{viewingItem.subject || "N/A"}</span></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Status:</span><Tag className={classNames("capitalize", statusColors[viewingItem.status] || statusColors.default)}>{STATUS_OPTIONS_FORM.find(s => s.value === viewingItem.status)?.label || viewingItem.status}</Tag></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Rating:</span><span className="w-2/3">{RATING_OPTIONS.find(r => r.value === String(viewingItem.rating || ''))?.label || (viewingItem.rating ? `${viewingItem.rating} Stars` : "N/A")}</span></div> {viewingItem.attachment && (<div className="flex items-start"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200 pt-1">Attachment:</span><span className="w-2/3"><a href={itemPath(viewingItem.attachment)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{viewingItem.attachment.split('/').pop()}</a></span></div>)} <div className="flex flex-col"><span className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Details:</span><p className="w-full bg-gray-50 dark:bg-gray-700 p-2 rounded whitespace-pre-wrap break-words">{viewingItem.feedback_details}</p></div> <div className="flex"><span className="font-semibold w-1/3 text-gray-700 dark:text-gray-200">Reported On:</span><span className="w-2/3">{new Date(viewingItem.created_at).toLocaleString()}</span></div> </div>)} <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div> </div>
      </Dialog>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400} footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterReqFeedbackForm" type="submit">Apply</Button> </div> } > <Form id="filterReqFeedbackForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4"> <FormItem label="Type"><Controller name="filterType" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Type" options={TYPE_OPTIONS} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem> <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Status" options={STATUS_OPTIONS_FORM} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem> <FormItem label="Rating"><Controller name="filterRating" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Rating" options={RATING_OPTIONS} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem> </Form>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Entry" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}> <p>Are you sure you want to delete entry from "<strong>{itemToDelete?.name}</strong>"?</p> </ConfirmDialog>
    </>
  );
};

export default RequestAndFeedbackListing;