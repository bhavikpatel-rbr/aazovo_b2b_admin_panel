import React, { useState, useMemo, useCallback, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";

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
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import {
  Drawer,
  Form,
  Input,
  Select as UiSelect,
  DatePicker,
  FormItem,
  Select,
  Card,
  Dialog,
  Checkbox,
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
  TbDotsVertical,
  TbEye,
  TbReload,
  TbMailShare,
  TbBrandWhatsapp,
  TbTagStarred,
  TbCalendarClock,
  TbBell,
  TbChecklist,
  TbCloudDownload,
  TbBrandGoogleDrive,
  TbFileAlert,
  TbFileCertificate,
  TbFileDislike,
  TbFileCheck,
  TbFileExcel,
  TbForms,
  TbColumns,
  TbX,
  TbUser,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import {
  AccountDocumentStatus,
  EnquiryType,
  AccountDocumentListItem,
} from "./types"; // Adjust import path as needed

// Redux
import { shallowEqual, useSelector } from "react-redux";
import { useAppDispatch } from "@/reduxtool/store";
import { BsThreeDotsVertical } from "react-icons/bs";
import { addNotificationAction, addScheduleAction, getAllUsersAction } from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define Types ---
export type SelectOption = { value: any; label: string };
export type ModalType = 'notification' | 'schedule';
export interface ModalState {
    isOpen: boolean;
    type: ModalType | null;
    data: AccountDocumentListItem | null;
}

// --- Zod Schema for Schedule Form ---
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

const eventTypeOptions = [
    { value: 'Meeting', label: 'Meeting' },
    { value: 'Call', label: 'Follow-up Call' },
    { value: 'Deadline', label: 'Project Deadline' },
    { value: 'Reminder', label: 'Reminder' },
];


const dummyAccountDocumentData: AccountDocumentListItem[] = [
  {
    id: "ACC-001",
    status: "approved",
    leadNumber: "LD-202405-001",
    enquiryType: "purchase",
    memberName: "ABC Enterprise",
    companyId: "5067974",
    companyName: "ABC Enterprise",
    userId: "7039521",
    userName: "Dharmesh Soni",
    companyDocumentType: "OMC",
    documentType: "Sales Order",
    documentNumber: "ND-PO-2526-38",
    invoiceNumber: "OMC-117/25-26",
    formType: "CRM PI 1.0.2",
    createdAt: "2025-05-20T14:30:00Z",
  },
  {
    id: "ACC-002",
    status: "pending",
    leadNumber: "LD-202405-002",
    enquiryType: "sales",
    memberName: "XYZ Traders",
    companyId: "5069981",
    companyName: "XYZ Traders",
    userId: "7039123",
    userName: "Kiran Patel",
    companyDocumentType: "GST",
    documentType: "Purchase Order",
    documentNumber: "ND-PO-2632-45",
    invoiceNumber: "GST-200/25-26",
    formType: "CRM PI 1.0.3",
    createdAt: "2025-05-22T10:15:00Z",
  },
  {
    id: "ACC-003",
    status: "rejected",
    leadNumber: "LD-202405-003",
    enquiryType: "service",
    memberName: "PQR Solutions",
    companyId: "5071111",
    companyName: "PQR Solutions",
    userId: "7039333",
    userName: "Meena Shah",
    companyDocumentType: "TRN",
    documentType: "Service Invoice",
    documentNumber: "SV-IN-8899",
    invoiceNumber: "TRN-301/25-26",
    formType: "CRM SV 1.2.0",
    createdAt: "2025-05-23T08:00:00Z",
  },
];

const accountDocumentStatusColor: Record<AccountDocumentStatus, string> = {
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
  rejected: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  uploaded: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100",
  not_uploaded: "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-100",
};

const enquiryTypeColor: Record<EnquiryType | "default", string> = {
  purchase: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  sales: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  service: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300",
};

// --- Helper Components ---
const AccountDocumentActionColumn = ({ onDelete, onOpenModal, rowData }: any) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Fillup Form"><div className="text-xl cursor-pointer" onClick={() => navigate("/fill-up-form")}><TbChecklist /></div></Tooltip>
      <Tooltip title="Edit"><div className="text-xl"><TbPencil /></div></Tooltip>
      <Tooltip title="View"><div className="text-xl"><TbEye /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign to Task</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbMailShare size={18} /> <span className="text-xs">Send Email</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbBrandWhatsapp size={18} /><span className="text-xs">Send Whatsapp</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbTagStarred size={18} /><span className="text-xs">Add to Active </span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2" onClick={() => onOpenModal('schedule', rowData)}><TbCalendarClock size={18} /><span className="text-xs">Add Schedule </span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2" onClick={() => onOpenModal('notification', rowData)}><TbBell size={18} /><span className="text-xs">Add Notification </span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbChecklist size={18} /><span className="text-xs">Verify Document </span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbCloudDownload size={18} /><span className="text-xs">Download Document </span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};

const AddNotificationDialog = ({ document, onClose, getAllUserDataOptions }: { document: AccountDocumentListItem, onClose: () => void, getAllUserDataOptions: SelectOption[] }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const notificationSchema = z.object({ notification_title: z.string().min(3, "Title must be at least 3 characters long."), send_users: z.array(z.number()).min(1, "Please select at least one user."), message: z.string().min(10, "Message must be at least 10 characters long."), });
    type NotificationFormData = z.infer<typeof notificationSchema>;
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<NotificationFormData>({ resolver: zodResolver(notificationSchema), defaultValues: { notification_title: `Regarding Document: ${document.documentNumber}`, send_users: [], message: `This is a notification for document number "${document.documentNumber}" for company "${document.companyName}".` }, mode: 'onChange' });
    const onSend = async (formData: NotificationFormData) => { setIsLoading(true); const payload = { send_users: formData.send_users, notification_title: formData.notification_title, message: formData.message, module_id: String(document.id), module_name: 'AccountDocument', }; try { await dispatch(addNotificationAction(payload)).unwrap(); toast.push(<Notification type="success" title="Notification Sent Successfully!" />); onClose(); } catch (error: any) { toast.push(<Notification type="danger" title="Failed to Send Notification" children={error?.message || 'An unknown error occurred.'} />); } finally { setIsLoading(false); } };
    return (<Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}><h5 className="mb-4">Notify about: {document.documentNumber}</h5><Form onSubmit={handleSubmit(onSend)}><FormItem label="Title" invalid={!!errors.notification_title} errorMessage={errors.notification_title?.message}><Controller name="notification_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem><FormItem label="Send To" invalid={!!errors.send_users} errorMessage={errors.send_users?.message}><Controller name="send_users" control={control} render={({ field }) => (<UiSelect isMulti placeholder="Select User(s)" options={getAllUserDataOptions} value={getAllUserDataOptions.filter(o => field.value?.includes(o.value))} onChange={(options: any) => field.onChange(options?.map((o: any) => o.value) || [])} />)} /></FormItem><FormItem label="Message" invalid={!!errors.message} errorMessage={errors.message?.message}><Controller name="message" control={control} render={({ field }) => <Input textArea {...field} rows={4} />} /></FormItem><div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Send Notification</Button></div></Form></Dialog>);
};

const AddScheduleDialog: React.FC<{ document: AccountDocumentListItem; onClose: () => void; }> = ({ document, onClose }) => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            event_title: `Follow-up on Document ${document.documentNumber}`,
            event_type: undefined,
            date_time: null as any,
            remind_from: null,
            notes: `Regarding document for ${document.companyName} (Lead: ${document.leadNumber})`,
        },
        mode: 'onChange',
    });
    const onAddEvent = async (data: ScheduleFormData) => {
        setIsLoading(true);
        const payload = {
            module_id: Number(document.id.split('-')[1]), // Assuming ID is like 'ACC-001'
            module_name: 'AccountDocument',
            event_title: data.event_title,
            event_type: data.event_type,
            date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'),
            ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }),
            notes: data.notes || '',
        };
        try {
            await dispatch(addScheduleAction(payload)).unwrap();
            toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for document ${document.documentNumber}.`} />);
            onClose();
        } catch (error: any) {
            toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
            <h5 className="mb-4">Add Schedule for Document {document.documentNumber}</h5>
            <Form onSubmit={handleSubmit(onAddEvent)}>
                <FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}><Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} /></FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}><Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} />)} /></FormItem>
                    <FormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}><Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
                </div>
                <FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}><Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} /></FormItem>
                <FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}><Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} /></FormItem>
                <div className="text-right mt-6"><Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button><Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button></div>
            </Form>
        </Dialog>
    );
};

const AccountDocumentModals = ({ modalState, onClose, getAllUserDataOptions }: { modalState: ModalState, onClose: () => void, getAllUserDataOptions: SelectOption[] }) => {
    const { type, data: document, isOpen } = modalState;
    if (!isOpen || !document) return null;
    switch (type) {
        case 'notification': return <AddNotificationDialog document={document} onClose={onClose} getAllUserDataOptions={getAllUserDataOptions} />;
        case 'schedule': return <AddScheduleDialog document={document} onClose={onClose} />;
        default: return null;
    }
};

const AccountDocumentSearch = React.forwardRef<HTMLInputElement, any>((props, ref) => <DebouceInput {...props} ref={ref} />);
AccountDocumentSearch.displayName = "AccountDocumentSearch";

const AccountDocumentTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: {
  onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void;
  columns: ColumnDef<AccountDocumentListItem>[]; filteredColumns: ColumnDef<AccountDocumentListItem>[]; setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<AccountDocumentListItem>[]>>; activeFilterCount: number;
}) => {
    const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
    const toggleColumn = (checked: boolean, colId: string) => {
      if (checked) {
        const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId);
        if (originalColumn) {
          setFilteredColumns(prev => {
            const newCols = [...prev, originalColumn];
            newCols.sort((a, b) => {
              const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey));
              const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey));
              return indexA - indexB;
            });
            return newCols;
          });
        }
      } else {
        setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId));
      }
    };
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
            <div className="flex-grow"><AccountDocumentSearch onInputChange={onSearchChange} placeholder="Quick Search..." /></div>
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
    )
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: any,
  onRemoveFilter: (key: string, value: any) => void;
  onClearAll: () => void;
}) => {
    const filters = [
        ...(filterData.filterStatus || []).map((f: SelectOption) => ({ key: 'filterStatus', label: `Status: ${f.label}`, value: f })),
    ];
    if (filters.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {filters.map(filter => (
                <Tag key={`${filter.key}-${filter.value.value}`} prefix>
                    {filter.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key, filter.value)} />
                </Tag>
            ))}
            <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
        </div>
    );
};


const AccountDocumentTable = (props: any) => <DataTable {...props} />;
const AccountDocumentSelectedFooter = ({ selectedItems, onDeleteSelected, }: any) => { const [open, setOpen] = useState(false); if (!selectedItems || selectedItems.length === 0) return null; return (<><StickyFooter className="p-4 border-t" stickyClass="-mx-4 sm:-mx-8"><div className="flex items-center justify-between"><span>{selectedItems.length} selected</span><Button size="sm" color="red-500" onClick={() => setOpen(true)}>Delete Selected</Button></div></StickyFooter><ConfirmDialog isOpen={open} type="danger" onConfirm={() => { onDeleteSelected(); setOpen(false); }} onClose={() => setOpen(false)} title="Delete Selected"><p>Sure?</p></ConfirmDialog></>); };
const DialogDetailRow: React.FC<any> = ({ label, value, isLink, preWrap, breakAll, labelClassName, valueClassName, className, }) => { const defaultLabelClass = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"; const defaultValueClass = "text-sm text-slate-700 dark:text-slate-100 mt-0.5"; return (<div className={`py-1.5 ${className || ""}`}><p className={`${labelClassName || defaultLabelClass}`}>{label}</p>{isLink ? (<a href={typeof value === "string" && (value.startsWith("http") ? value : `/${value}`)} target="_blank" rel="noopener noreferrer" className={`${valueClassName || defaultValueClass} hover:underline text-blue-600 dark:text-blue-400 ${breakAll ? "break-all" : ""} ${preWrap ? "whitespace-pre-wrap" : ""}`}>{value}</a>) : (<div className={`${valueClassName || defaultValueClass} ${breakAll ? "break-all" : ""} ${preWrap ? "whitespace-pre-wrap" : ""}`}>{value}</div>)}</div>); };

// --- Main Account Document Component ---
const AccountDocument = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { getAllUserData = [] } = useSelector(masterSelector, shallowEqual);
    const [isSubmittingDrawer, setIsSubmittingDrawer] = useState(false);
    const filterForm = useForm();
    const addNewDocumentForm = useForm();
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
    const [isAddNewDocumentDrawerOpen, setIsAddNewDocumentDrawerOpen] = useState<boolean>(false);
    const [isProcessingDelete, setIsProcessingDelete] = useState(false);
    const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<AccountDocumentListItem | null>(null);
    const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "createdAt" }, query: "" });
    const [selectedItems, setSelectedItems] = useState<AccountDocumentListItem[]>([]);
    const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
    const [filterCriteria, setFilterCriteria] = useState<any>({});

    useEffect(() => { dispatch(getAllUsersAction()); }, [dispatch]);

    const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((b: any) => ({ value: b.id, label: b.name })) : [], [getAllUserData]);
    const handleOpenModal = useCallback((type: ModalType, itemData: AccountDocumentListItem) => { setModalState({ isOpen: true, type, data: itemData }); }, []);
    const handleCloseModal = useCallback(() => { setModalState({ isOpen: false, type: null, data: null }); }, []);

    const { pageData, total, allFilteredAndSortedData } = useMemo((): { pageData: AccountDocumentListItem[]; total: number; allFilteredAndSortedData: AccountDocumentListItem[]; } => {
        let processedData: AccountDocumentListItem[] = cloneDeep(dummyAccountDocumentData);
        if (tableData.query) { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter((item) => Object.values(item).some((val) => String(val).toLowerCase().includes(query))); }
        
        if(filterCriteria.filterStatus?.length) {
            const selectedStatuses = new Set(filterCriteria.filterStatus.map((s: SelectOption) => s.value));
            processedData = processedData.filter(item => selectedStatuses.has(item.status));
        }

        const { order, key } = tableData.sort as OnSortParam;
        if (order && key) { processedData.sort((a, b) => { let aVal = a[key as keyof AccountDocumentListItem] as any; let bVal = b[key as keyof AccountDocumentListItem] as any; if (key === "createdAt" || key === "updatedAt") return order === "asc" ? dayjs(aVal).valueOf() - dayjs(bVal).valueOf() : dayjs(bVal).valueOf() - dayjs(aVal).valueOf(); if (typeof aVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal; return order === "asc" ? String(aVal ?? "").localeCompare(String(bVal ?? "")) : String(bVal ?? "").localeCompare(String(aVal ?? "")); }); }
        const currentTotal = processedData.length;
        const { pageIndex = 1, pageSize = 10 } = tableData;
        const startIndex = (pageIndex - 1) * pageSize;
        return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData, };
    }, [tableData, filterCriteria]);

    const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
    const handleDeleteClick = useCallback((item: AccountDocumentListItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
    const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
    const handlePageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: value, pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
    const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
    const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
    const handleRowSelect = useCallback((checked: boolean, row: AccountDocumentListItem) => setSelectedItems((prev) => checked ? prev.some((i) => i.id === row.id) ? prev : [...prev, row] : prev.filter((i) => i.id !== row.id)), []);
    const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<AccountDocumentListItem>[]) => { const originals = currentRows.map((r) => r.original); if (checked) setSelectedItems((prev) => { const oldIds = new Set(prev.map((i) => i.id)); return [...prev, ...originals.filter((o) => !oldIds.has(o.id))]; }); else { const currentIds = new Set(originals.map((o) => o.id)); setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id))); } }, []);
    const openFilterDrawer = useCallback(() => setIsFilterDrawerOpen(true), []);
    const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
    const openAddNewDocumentDrawer = useCallback(() => setIsAddNewDocumentDrawerOpen(true), []);
    const closeAddNewDocumentDrawer = useCallback(() => setIsAddNewDocumentDrawerOpen(false), []);
    
    const onClearFilters = () => {
        setFilterCriteria({});
        filterForm.reset({});
        handleSetTableData({ pageIndex: 1, query: "" });
    };

    const handleCardClick = (status: AccountDocumentStatus) => {
        onClearFilters();
        const statusOption = [{ value: status, label: status.charAt(0).toUpperCase() + status.slice(1)}];
        setFilterCriteria({ filterStatus: statusOption });
    };

    const handleRemoveFilter = (key: string, value: any) => {
        setFilterCriteria((prev: any) => {
            const newFilters = { ...prev };
            const currentValues = prev[key] as SelectOption[] | undefined;
            if (currentValues) {
                newFilters[key] = currentValues.filter(item => item.value !== value.value);
            }
            return newFilters;
        });
    };

    const columns: ColumnDef<AccountDocumentListItem>[] = useMemo(() => [
        { header: "Status", accessorKey: "status", size: 120, cell: (props: CellContext<AccountDocumentListItem, any>) => (<Tag className={`${accountDocumentStatusColor[props.row.original.status as keyof typeof accountDocumentStatusColor] || 'bg-gray-100'} capitalize px-2 py-1 text-xs`}>{props.row.original.status}</Tag>), },
        { header: "Lead", accessorKey: "leadNumber", size: 130, cell: (props) => { return (<div className="flex flex-col gap-0.5 text-xs"><span>{props.getValue<string>()}</span><div><Tag className={`${enquiryTypeColor[props.row.original.enquiryType as keyof typeof enquiryTypeColor] || enquiryTypeColor.default} capitalize px-2 py-1 text-xs`}>{props.row.original.enquiryType}</Tag></div></div>); }, },
        { header: "Member", accessorKey: "memberName", size: 220, cell: (props: CellContext<AccountDocumentListItem, any>) => { return (<div className="flex flex-col gap-0.5 text-xs"><b>5067974</b><span>ABC Enterprise</span><b>7039521</b><span>Dharmesh Soni</span><div><b>Company Document:</b><span>OMC</span></div></div>); }, },
        { header: "Document", size: 220, cell: (props) => { return (<div className="flex flex-col gap-0.5 text-xs"><div><b>Doc Type: </b><span>Sales Order</span></div><div><b>Doc No: </b><span>ND-PO-2526-38</span></div><div><b>Invoice No: </b><span>OMC-117/25-26</span></div><div><b>Form Type: </b><span>CRM PI 1.0.2</span></div><b>{dayjs(props.row.original.createdAt).format("DD MMM, YYYY HH:mm")}</b></div>); }, },
        { header: "Actions", id: "actions", size: 160, meta: { HeaderClass: "text-center" }, cell: (props: CellContext<AccountDocumentListItem, any>) => (<AccountDocumentActionColumn onDelete={() => handleDeleteClick(props.row.original)} onOpenModal={handleOpenModal} rowData={props.row.original} />), },
    ], [handleDeleteClick, handleOpenModal]);

    const [filteredColumns, setFilteredColumns] = useState<ColumnDef<AccountDocumentListItem>[]>(columns);
    useEffect(() => { setFilteredColumns(columns) }, [columns]);

    const activeFilterCount = useMemo(() => {
      let count = 0;
      if (filterCriteria.filterStatus?.length) count++;
      return count;
    }, [filterCriteria]);
    
    const counts = useMemo(() => {
        const total = dummyAccountDocumentData.length;
        const pending = dummyAccountDocumentData.filter(d => d.status === 'pending').length;
        const approved = dummyAccountDocumentData.filter(d => d.status === 'approved').length;
        const rejected = dummyAccountDocumentData.filter(d => d.status === 'rejected').length;
        const uploaded = 0; // Placeholder
        const not_uploaded = 0; // Placeholder
        return { total, pending, approved, rejected, uploaded, not_uploaded };
    }, []);

    const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
    const cardBodyClass = "flex gap-2 p-2";

    return (
        <>
            <Container className="h-auto">
                <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"><h5 className="mb-2 sm:mb-0">Account Document</h5><Button variant="solid" icon={<TbPlus />} className="px-5" onClick={() => openAddNewDocumentDrawer()}>Set New Document</Button></div>
                    <div className="grid grid-cols-6 mb-4 gap-2">
                        <Tooltip title="Click to show all documents"><div onClick={onClearFilters}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbBrandGoogleDrive size={24} /></div><div><h6 className="text-blue-500">{counts.total}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show pending documents"><div onClick={() => handleCardClick('pending')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-orange-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbFileAlert size={24} /></div><div><h6 className="text-orange-500">{counts.pending}</h6><span className="font-semibold text-xs">Pending</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show approved documents"><div onClick={() => handleCardClick('approved')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-300")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbFileCertificate size={24} /></div><div><h6 className="text-green-500">{counts.approved}</h6><span className="font-semibold text-xs">Approved</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show rejected documents"><div onClick={() => handleCardClick('rejected')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbFileDislike size={24} /></div><div><h6 className="text-red-500">{counts.rejected}</h6><span className="font-semibold text-xs">Rejected</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show uploaded documents"><div onClick={() => handleCardClick('uploaded')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-300")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbFileCheck size={24} /></div><div><h6 className="text-violet-500">{counts.uploaded}</h6><span className="font-semibold text-xs">Uploaded</span></div></Card></div></Tooltip>
                        <Tooltip title="Click to show 'not uploaded' documents"><div onClick={() => handleCardClick('not_uploaded')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-pink-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbFileExcel size={24} /></div><div><h6 className="text-pink-500">{counts.not_uploaded}</h6><span className="font-semibold text-xs">Not Uploaded</span></div></Card></div></Tooltip>
                    </div>
                    <AccountDocumentTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={() => {}} onClearFilters={onClearFilters} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
                    <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
                    <div className="mt-4 flex-grow overflow-y-auto"><AccountDocumentTable selectable columns={filteredColumns} data={pageData} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number, }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /></div>
                </AdaptiveCard>
            </Container>
            <AccountDocumentSelectedFooter selectedItems={selectedItems} />
            <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete" onClose={() => setSingleDeleteConfirmOpen(false)} loading={isProcessingDelete} onCancel={() => setSingleDeleteConfirmOpen(false)}><p>Delete <strong></strong>?</p></ConfirmDialog>
            <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" type="button">Clear</Button><Button size="sm" variant="solid" form="filterLeadForm" type="submit">Apply</Button></div>}>
                <Form><FormItem label="Status"><Controller control={filterForm.control} name="status" render={({ field }) => (<Select {...field} placeholder="Select Status" isMulti options={[{ label: "Active", value: "Active" }, { label: "Pending", value: "Pending" }, { label: "Completed", value: "Completed" }, { label: "Force Completed", value: "Force Completed" },]} />)} /></FormItem><FormItem label="Document Type"><Controller control={filterForm.control} name="doc_type" render={({ field }) => (<Select {...field} placeholder="Select Document Type" isMulti options={[{ label: "Sales Order", value: "Sales Order" }, { label: "Purchase Order", value: "Purchase Order" }, { label: "Credit Note", value: "Credit Note" }, { label: "Debit Note", value: "Debit Note" },]} />)} /></FormItem><FormItem label="Company Document"><Controller control={filterForm.control} name="comp_doc" render={({ field }) => (<Select {...field} placeholder="Select Company Document" isMulti options={[{ label: "Aazovo", value: "Aazovo" }, { label: "OMC", value: "OMC" },]} />)} /></FormItem></Form>
            </Drawer>
            <Drawer title="Add New Document" width={520} isOpen={isAddNewDocumentDrawerOpen} onClose={closeAddNewDocumentDrawer} onRequestClose={closeAddNewDocumentDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" type="button">Cancel</Button><Button size="sm" variant="solid" form="filterLeadForm" type="submit">Save</Button></div>}>
                <Form><FormItem label={<div>Company Document<span className="text-red-500"> * </span></div>}><Controller control={addNewDocumentForm.control} name="comp_doc" render={({ field }) => (<Select {...field} placeholder="Select Company Document" options={[{ label: "Aazovo", value: "Aazovo" }, { label: "OMC", value: "OMC" },]} />)} /></FormItem><FormItem label={<div>Document Type<span className="text-red-500"> * </span></div>}><Controller control={addNewDocumentForm.control} name="doc_type" render={({ field }) => (<Select {...field} placeholder="Select Document Type" options={[{ label: "Sales Order", value: "Sales Order" }, { label: "Purchase Order", value: "Purchase Order" }, { label: "Credit Note", value: "Credit Note" }, { label: "Debit Note", value: "Debit Note" },]} />)} /></FormItem><div className="md:grid grid-cols-2 gap-3"><FormItem label={<div>Document Number<span className="text-red-500"> * </span></div>}><Controller control={addNewDocumentForm.control} name="doc_number" render={({ field }) => (<Input type="text" placeholder="Enter Document Number" {...field} />)} /></FormItem><FormItem label={<div>Invoice Number<span className="text-red-500"> * </span></div>}><Controller control={addNewDocumentForm.control} name="invoice_number" render={({ field }) => (<Input type="text" placeholder="Enter Invoice Number" {...field} />)} /></FormItem></div><div className="md:grid grid-cols-2 gap-3"><FormItem label={<div>Token Form<span className="text-red-500"> * </span></div>}><Controller control={addNewDocumentForm.control} name="token_form" render={({ field }) => (<Select {...field} placeholder="Select Form Type" options={[{ label: "CRM PI 1.0.2", value: "CRM PI 1.0.2" }, { label: "Debit Note", value: "Debit Note" }, { label: "Credit Note", value: "Credit Note" }, { label: "CRM PO 1.0.3", value: "CRM PO 1.0.3" },]} />)} /></FormItem><FormItem label={<div>Employee<span className="text-red-500"> * </span></div>}><Controller control={addNewDocumentForm.control} name="employee" render={({ field }) => (<Select {...field} placeholder="Select Employee" options={[{ label: "Hevin Patel", value: "Hevin Patel" }, { label: "Vinit Chauhan", value: "Vinit Chauhan" },]} />)} /></FormItem></div><div className="md:grid grid-cols-2 gap-3 items-center"><FormItem label={<div>Member<span className="text-red-500"> * </span></div>}><Controller control={addNewDocumentForm.control} name="member" render={({ field }) => (<Select {...field} placeholder="Select Member" options={[{ label: "Ajay Patel - 703549", value: "Ajay Patel - 703549", }, { label: "Krishnan Iyer - 703752", value: "Krishnan Iyer - 703752", },]} />)} /></FormItem><div className="text-xs mt-4"><b>5039522</b> <br /><span>XYZ Enterprise</span></div></div><span className="text-xs">Member is not associated with any company.</span></Form>
            </Drawer>
            <AccountDocumentModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={getAllUserDataOptions} />
        </>
    );
};
export default AccountDocument;