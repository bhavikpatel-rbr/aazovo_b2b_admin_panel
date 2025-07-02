import React, { useState, useMemo, useCallback, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames";
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
import DebounceInput from "@/components/shared/DebouceInput";
import RichTextEditor from "@/components/shared/RichTextEditor";
import Select from "@/components/ui/Select";
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Dialog,
  Dropdown,
  Card,
  Button,
  Tooltip,
  Notification,
  DatePicker,
  Checkbox,
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";

// Icons
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbEye,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbUserCircle,
  TbMail,
  TbPhone,
  TbBuilding,
  TbMessageDots,
  TbClipboardText,
  TbStar,
  TbPaperclip,
  TbToggleRight,
  TbReload,
  TbUser,
  TbBrandWhatsapp,
  TbBell,
  TbTagStarred,
  TbCalendarEvent,
  TbAlarm,
  TbFileSearch,
  TbUserSearch,
  TbDownload,
  TbMessageReport,
  TbLink,
  TbAlertTriangle,
  TbFileText,
  TbFileZip,
  TbCalendar,
  TbUserQuestion,
  TbEyeClosed,
  TbBellMinus,
  TbPencilPin,
  TbFileTime,
  TbStars,
  TbColumns,
  TbX,
  TbMailShare,
  TbCalendarClock,
  TbAlignBoxCenterBottom,
  TbMailbox,
  TbSend,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import type {
  AccountDocumentStatus, // Placeholder
  EnquiryType, // Placeholder
  AccountDocumentListItem, // Placeholder
} from "./types"; // Adjust this path if needed

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getRequestFeedbacksAction,
  addRequestFeedbackAction,
  editRequestFeedbackAction,
  deleteRequestFeedbackAction,
  deleteAllRequestFeedbacksAction,
  submitExportReasonAction,
  addNotificationAction,
  getAllUsersAction,
  addScheduleAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define Types ---
export type SelectOption = { value: string; label: string };
export type RequestFeedbackApiStatus = "Unread" | "Read" | "In Progress" | "Resolved" | "Closed" | string;
export type RequestFeedbackFormStatus = "Unread" | "Read" | "In Progress" | "Resolved" | "Closed";
export type RequestFeedbackType = "Feedback" | "Request" | "Complaint" | "Query" | string;

export type RequestFeedbackItem = {
  id: string | number;
  customer_id: string;
  name: string;
  email: string;
  mobile_no: string;
  company_name?: string | null;
  feedback_details: string;
  attachment?: string | null;
  type: RequestFeedbackType;
  status: RequestFeedbackApiStatus;
  created_at: string;
  updated_at: string;
  subject?: string | null;
  rating?: number | string | null;
  deleted_at?: string | null;
  health_score?: number;
  updated_by_user?: { name: string; roles: [{ display_name: string }] };
};
export type ModalType = 'notification' | 'schedule';
export interface ModalState { isOpen: boolean; type: ModalType | null; data: RequestFeedbackItem | null; }

// --- Zod Schemas ---
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

const filterFormSchema = z.object({
    filterType: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    filterRating: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

export const TYPE_OPTIONS: SelectOption[] = [{ value: "Feedback", label: "Feedback" }, { value: "Request", label: "Request" }, { value: "Complaint", label: "Complaint" }, { value: "Query", label: "General Query" }];
const typeValues = TYPE_OPTIONS.map((t) => t.value) as [string, ...string[]];
export const STATUS_OPTIONS_FORM: { value: RequestFeedbackFormStatus; label: string; }[] = [{ value: "Unread", label: "Unread" }, { value: "Read", label: "Read" }, { value: "In Progress", label: "In Progress" }, { value: "Resolved", label: "Resolved" }, { value: "Closed", label: "Closed" }];
const statusFormValues = STATUS_OPTIONS_FORM.map((s) => s.value) as [RequestFeedbackFormStatus, ...RequestFeedbackFormStatus[]];
export const RATING_OPTIONS: SelectOption[] = [{ value: "1", label: "1 Star (Poor)" }, { value: "2", label: "2 Stars (Fair)" }, { value: "3", label: "3 Stars (Average)" }, { value: "4", label: "4 Stars (Good)" }, { value: "5", label: "5 Stars (Excellent)" }];
const ratingValues = RATING_OPTIONS.map((r) => r.value) as [string, ...string[]];

const requestFeedbackFormSchema = z.object({ name: z.string().min(1, "Name is required.").max(100), email: z.string().email("Invalid email address.").min(1, "Email is required."), mobile_no: z.string().min(1, "Mobile number is required.").max(20), company_name: z.string().max(150).optional().or(z.literal("")).nullable(), feedback_details: z.string().min(10, "Details must be at least 10 characters.").max(5000), type: z.enum(typeValues, { errorMap: () => ({ message: "Please select a type." }), }), status: z.enum(statusFormValues, { errorMap: () => ({ message: "Please select a status." }), }), subject: z.string().max(255).optional().or(z.literal("")).nullable(), rating: z.enum(ratingValues).optional().nullable(), attachment: z.any().optional(), });
type RequestFeedbackFormData = z.infer<typeof requestFeedbackFormSchema>;

const exportReasonSchema = z.object({ reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."), });
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

const eventTypeOptions = [{ value: 'Meeting', label: 'Review Meeting' }, { value: 'Call', label: 'Follow-up Call' }, { value: 'Deadline', label: 'Resolution Deadline' }, { value: 'Reminder', label: 'Reminder' }];

// --- Constants & Colors ---
const statusColors: Record<RequestFeedbackApiStatus, string> = { Unread: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100", Read: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100", "In Progress": "bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-100", Resolved: "bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-100", Closed: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100", default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300", };

// --- Modals, Components, and other logic...
const AddNotificationDialog = ({ document:item, onClose, getAllUserDataOptions }: { document: RequestFeedbackItem, onClose: () => void, getAllUserDataOptions: SelectOption[] }) => { /* ... */ return null; };
const AddScheduleDialog: React.FC<{ item: RequestFeedbackItem; onClose: () => void; }> = ({ item, onClose }) => { /* ... */ return null; };
const RequestFeedbackModals = ({ modalState, onClose, getAllUserDataOptions }: { modalState: ModalState, onClose: () => void, getAllUserDataOptions: SelectOption[] }) => { const { type, data: document, isOpen } = modalState; if (!isOpen || !document) return null; switch (type) { case 'notification': return <AddNotificationDialog document={document} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />; case 'schedule': return <AddScheduleDialog item={document} onClose={onClose} />; default: return null; } };
const ItemActionColumn = ({ rowData, onEdit, onViewDetail, onDelete, onOpenModal }: { rowData: RequestFeedbackItem; onEdit: () => void; onViewDetail: () => void; onDelete: () => void; onOpenModal: (type: ModalType, data: RequestFeedbackItem) => void; }) => { /* ... */ return null; };

// --- Main RequestAndFeedbackListing Component ---
const RequestAndFeedbackListing = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { requestFeedbacksData = { data: [], counts: {} }, getAllUserData = [], status: masterLoadingStatus = "idle", error: masterError = null } = useSelector(masterSelector, shallowEqual);

    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
    const [editingItem, setEditingItem] = useState<RequestFeedbackItem | null>(null);

    useEffect(() => { dispatch(getRequestFeedbacksAction()); dispatch(getAllUsersAction()); }, [dispatch]);

    const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
    const { control: filterControl, handleSubmit: handleFilterSubmit, reset: resetFilterForm } = filterFormMethods;

    const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((b: any) => ({ value: b.id, label: b.name })) : [], [getAllUserData]);
    const handleOpenModal = useCallback((type: ModalType, itemData: RequestFeedbackItem) => { setModalState({ isOpen: true, type, data: itemData }); }, []);
    const handleCloseModal = useCallback(() => { setModalState({ isOpen: false, type: null, data: null }); }, []);

    const onClearFilters = useCallback(() => { setFilterCriteria({}); resetFilterForm({}); setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); }, [resetFilterForm]);
    const handleCardClick = (status: string) => { onClearFilters(); const statusOption = STATUS_OPTIONS_FORM.find(opt => opt.value === status); if (statusOption) { setFilterCriteria({ filterStatus: [statusOption] }); } };
    const handleRemoveFilter = (key: keyof FilterFormData, value: any) => { setFilterCriteria(prev => { const newFilters = { ...prev }; const currentValues = prev[key] as SelectOption[] | undefined; if (currentValues) { (newFilters[key] as SelectOption[]) = currentValues.filter(item => item.value !== value.value); } return newFilters; }); };
    
    const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
    const openFilterDrawer = useCallback(() => setIsFilterDrawerOpen(true), []);
    const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
    const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); };

    const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
        let processedData: RequestFeedbackItem[] = cloneDeep(Array.isArray(requestFeedbacksData?.data) ? requestFeedbacksData?.data : []);
        
        // --- FILTERING LOGIC ---
        if (filterCriteria.filterType?.length) { const v = filterCriteria.filterType.map((o) => o.value); processedData = processedData.filter((item) => v.includes(item.type)); } 
        if (filterCriteria.filterStatus?.length) { const v = filterCriteria.filterStatus.map((o) => o.value); processedData = processedData.filter((item) => v.includes(item.status)); }
        if (filterCriteria.filterRating?.length) { const v = filterCriteria.filterRating.map((o) => o.value); processedData = processedData.filter((item) => v.includes(String(item.rating || ""))); }
        if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter((item) => String(item.id).toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q) || item.mobile_no.toLowerCase().includes(q) || (item.company_name && item.company_name.toLowerCase().includes(q)) || (item.subject && item.subject.toLowerCase().includes(q)) || item.feedback_details.toLowerCase().includes(q)); }

        const { order, key } = tableData.sort as OnSortParam;
        if (order && key && typeof key === "string") {
            processedData.sort((a, b) => {
                const aVal = a[key as keyof RequestFeedbackItem];
                const bVal = b[key as keyof RequestFeedbackItem];
                if (key === "created_at" || key === "updated_at") { return order === "asc" ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime(); }
                const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase();
                return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
            });
        }
        
        const currentTotal = processedData.length;
        const pageIndex = tableData.pageIndex as number;
        const pageSize = tableData.pageSize as number;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
    }, [requestFeedbacksData?.data, tableData, filterCriteria]);

    const columns: ColumnDef<RequestFeedbackItem>[] = useMemo(
        () => [
            { header: "User Info", accessorKey: "name", size: 180, cell: (props) => (<div className="flex items-center gap-2"><Avatar size="sm" shape="circle" className="mr-1">{props.getValue<string>()?.[0]?.toUpperCase()}</Avatar><div className="flex flex-col gap-0.5"><span className="font-semibold text-sm">{props.getValue<string>() || "N/A"}</span><div className="text-xs text-gray-600 dark:text-gray-400">{props.row.original.email || "N/A"}</div><div className="text-xs text-gray-600 dark:text-gray-400">{props.row.original.mobile_no || "N/A"}</div></div></div>) },
            { header: "Type", accessorKey: "type", size: 100, cell: (props) => (<Tag className="capitalize">{TYPE_OPTIONS.find((t) => t.value === props.getValue())?.label || props.getValue() || "N/A"}</Tag>), },
            { header: "Subject", accessorKey: "subject", size: 200, cell: (props) => (<div className="truncate w-48" title={props.getValue() as string}>{(props.getValue() as string) || "N/A"}</div>) },
            { header: "Status", accessorKey: "status", size: 110, cell: (props) => { const s = props.getValue<RequestFeedbackApiStatus>(); return (<Tag className={classNames("capitalize whitespace-nowrap text-center", statusColors[s] || statusColors.default)}>{STATUS_OPTIONS_FORM.find((opt) => opt.value === s)?.label || s || "N/A"}</Tag>); }, },
            { header: "Rating", accessorKey: "rating", size: 90, cell: (props) => props.getValue() ? (<span className="flex items-center gap-1"><TbStar className="text-amber-500" />{`${props.getValue()}`}</span>) : ("N/A"), },
            { header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 120, cell: (props) => { /* ... */ return null; } },
            { header: "Actions", id: "actions", meta: { headerClass: "text-center", cellClass: "text-center" }, size: 100, cell: (props) => (<ItemActionColumn rowData={props.row.original} onOpenModal={handleOpenModal} onEdit={() => {}} onViewDetail={() => {}} onDelete={() => {}} />), },
        ], []
    );
    
    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<RequestFeedbackItem>[]>(columns);
    useEffect(() => { setFilteredColumns(columns) }, [columns]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filterCriteria.filterStatus?.length) count++;
        if (filterCriteria.filterType?.length) count++;
        if (filterCriteria.filterRating?.length) count++;
        return count;
    }, [filterCriteria]);
    
    const counts = requestFeedbacksData?.counts || {};
    const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
    const cardBodyClass = "flex gap-2 p-2";

    const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount, }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; columns: ColumnDef<RequestFeedbackItem>[]; filteredColumns: ColumnDef<RequestFeedbackItem>[]; setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<RequestFeedbackItem>[]>>; activeFilterCount: number; }) => {
        const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
        const toggleColumn = (checked: boolean, colId: string) => {
          if (checked) {
            const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId);
            if (originalColumn) setFilteredColumns(prev => { const newCols = [...prev, originalColumn]; newCols.sort((a, b) => { const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey)); const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey)); return indexA - indexB; }); return newCols; });
          } else {
            setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId));
          }
        };
        return (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
                <div className="flex-grow"><DebounceInput className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onSearchChange(e.target.value)} /></div>
                <div className="flex gap-1">
                    <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
                        <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                            {columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}
                        </div>
                    </Dropdown>
                    <Button icon={<TbReload />} onClick={onClearFilters}></Button>
                    <Button icon={<TbFilter />} onClick={onFilter}>Filter {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
                    <Button icon={<TbCloudUpload />} onClick={onExport}>Export</Button>
                </div>
            </div>
        );
    };

    const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: { filterData: FilterFormData; onRemoveFilter: (key: keyof FilterFormData, value: any) => void; onClearAll: () => void; }) => {
        const filters = [
            ...(filterData.filterStatus || []).map(f => ({ key: 'filterStatus' as const, label: `Status: ${f.label}`, value: f })),
            ...(filterData.filterType || []).map(f => ({ key: 'filterType' as const, label: `Type: ${f.label}`, value: f })),
            ...(filterData.filterRating || []).map(f => ({ key: 'filterRating' as const, label: `Rating: ${f.label}`, value: f })),
        ];
        if (filters.length === 0) return null;
        return (
            <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
                {filters.map(filter => (
                    <Tag key={`${filter.key}-${filter.value.value}`} prefix>{filter.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key, filter.value)} /></Tag>
                ))}
                <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
            </div>
        );
    };

    return (
        <>
            <Container className="h-full">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"><h5 className="mb-2 sm:mb-0">Requests & Feedbacks</h5><Button variant="solid" icon={<TbPlus />} onClick={() => navigate("/create-feedback")}>Add New</Button></div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
                        <Tooltip title="Click to show all items"><div onClick={onClearFilters}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200 dark:border-blue-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-200"><TbUserQuestion size={24} /></div><div><h6 className="text-blue-500 dark:text-blue-200">{counts?.total || 0}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show 'Unread' items"><div onClick={() => handleCardClick('Unread')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-amber-200 dark:border-amber-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-amber-100 dark:bg-amber-500/20 text-amber-500 dark:text-amber-200"><TbEyeClosed size={24} /></div><div><h6 className="text-amber-500 dark:text-amber-200">{counts?.unread || 0}</h6><span className="font-semibold text-xs">Unread</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show 'Resolved' items"><div onClick={() => handleCardClick('Resolved')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-teal-200 dark:border-teal-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-teal-100 dark:bg-teal-500/20 text-teal-500 dark:text-teal-200"><TbBellMinus size={24} /></div><div><h6 className="text-teal-500 dark:text-teal-200">{counts?.resolved || 0}</h6><span className="font-semibold text-xs">Resolved</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show 'In Progress' items"><div onClick={() => handleCardClick('In Progress')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-cyan-200 dark:border-cyan-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-cyan-100 dark:bg-cyan-500/20 text-cyan-500 dark:text-cyan-200"><TbPencilPin size={24} /></div><div><h6 className="text-cyan-500 dark:text-cyan-200">{counts?.pending || 0}</h6><span className="font-semibold text-xs">In Progress</span></div></Card></div></Tooltip>
                        <Tooltip title="Average resolution time"><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-300 dark:border-violet-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 text-violet-500 dark:text-violet-200"><TbFileTime size={24} /></div><div><h6 className="text-violet-500 dark:text-violet-200">{counts?.avg_time || 0}</h6><span className="font-semibold text-xs">Avg Time</span></div></Card></Tooltip>
                        <Tooltip title="Average user rating"><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-orange-200 dark:border-orange-700/60")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 dark:bg-orange-500/20 text-orange-500 dark:text-orange-200"><TbStars size={24} /></div><div><h6 className="text-orange-500 dark:text-orange-200">{counts?.avg_rating || 0}</h6><span className="font-semibold text-xs">Avg Rating</span></div></Card></Tooltip>
                    </div>
                    <ItemTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={() => {}} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
                    <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
                    <div className="mt-4 flex-grow overflow-auto">
                        <DataTable columns={filteredColumns} data={pageData} loading={masterLoadingStatus === 'loading'} /* ... other props */ />
                    </div>
                </AdaptiveCard>
            </Container>
            <RequestFeedbackModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={getAllUserDataOptions} />
        </>
    );
};

export default RequestAndFeedbackListing;