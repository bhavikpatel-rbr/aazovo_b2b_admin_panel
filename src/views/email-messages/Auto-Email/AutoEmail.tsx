// src/views/your-path/AutoEmailListing.tsx

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
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected component name
import Select from "@/components/ui/Select";
import Tag from "@/components/ui/Tag";
import { Drawer, Form, FormItem, Input } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  // TbEye, // Not used in this component
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbMailForward,
  TbUsers,
  TbToggleRight,
  TbReload,
  TbMailOpened,
  TbMailCode,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getAutoEmailsAction,
  addAutoEmailAction,
  editAutoEmailAction,
  deleteAutoEmailAction,
  deleteAllAutoEmailsAction,
  getUsersAction, // Keep for fetching users
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import dayjs from "dayjs";


// --- Define Types ---
export type ApiUser = { id: string | number; name: string; email?: string }; // Added email for user display
export type SelectOption = { value: string; label: string };

export type AutoEmailApiStatus = "active" | "inactive" | null | string; // Allow for other API statuses

export type AutoEmailItem = {
  id: string | number;
  email_type: string;       // This is the ID (e.g., "feedback", "testing")
  user_id: string;          // Comma-separated string of user IDs from API
  created_at: string;
  updated_at: string;
  status: AutoEmailApiStatus;
  // For display purposes, derived in useMemo
  emailTypeDisplay?: string;
  usersDisplay?: string;
};

// --- CONSTANTS for Dropdowns ---
const EMAIL_TYPE_OPTIONS: SelectOption[] = [
  { value: "1", label: "Feedback" },
  { value: "2", label: "Testing" },
  { value: "3", label: "Deal Done" },
  { value: "4", label: "Notification: Lead Inquiry" },
  { value: "5", label: "Notification: New Registration" },
  { value: "6", label: "Edit Profile Request" },
  { value: "7", label: "Wall Enquiry Store" },
  { value: "8", label: "Job Application" },
  { value: "9", label: "Assign Lead" },
  { value: "10", label: "Accept Lead" },
  { value: "11", label: "Reject Lead" },
  { value: "12", label: "Approve Waiting Lead" },
  { value: "13", label: "Approval Lead" },
  { value: "14", label: "Deal Done Lead" },
];
const emailTypeValues = EMAIL_TYPE_OPTIONS.map(et => et.value) as [string, ...string[]];


const AUTO_EMAIL_STATUS_OPTIONS: SelectOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const autoEmailStatusValues = AUTO_EMAIL_STATUS_OPTIONS.map((s) => s.value) as ["active" | "inactive", ...Array<"active" | "inactive">];

const autoEmailStatusColor: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
  default: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300", // For unknown statuses
};

// --- Zod Schema for Add/Edit Form ---
const autoEmailFormSchema = z.object({
  email_type: z.enum(emailTypeValues, {
    errorMap: () => ({ message: "Email Type is required." }),
  }),
  user_id: z.array(z.string().min(1, "User ID cannot be empty")) // Ensure individual user_id strings are not empty
    .min(1, "At least one User must be selected."),
  status: z.enum(autoEmailStatusValues, { errorMap: () => ({ message: "Please select a status." }), }),
});
type AutoEmailFormData = z.infer<typeof autoEmailFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterEmailTypes: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterUserIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter ---
const CSV_HEADERS_AE = ["ID", "Email Type", "Users (Name)", "Status", "Created At"];
const CSV_KEYS_AE: (keyof Pick<AutoEmailItem, 'id' | 'status' | 'created_at'> | 'emailTypeDisplay' | 'usersDisplay')[] = [
  "id", "emailTypeDisplay", "usersDisplay", "status", "created_at",
];

function exportAutoEmailsToCsv(filename: string, rows: AutoEmailItem[], userOptions: SelectOption[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }

  const preparedRows = rows.map((row) => {
    // emailTypeDisplay and usersDisplay are already on the row from useMemo in main component
    const statusLabel = AUTO_EMAIL_STATUS_OPTIONS.find(s => s.value === row.status)?.label || String(row.status);
    return { ...row, status: statusLabel }; // Override status with label for export
  });
  const separator = ",";
  const csvContent = CSV_HEADERS_AE.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_AE.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

// --- ActionColumn, Search, TableTools, Table, SelectedFooter (UI remains same) ---
const ActionColumn = ({ onEdit, onDelete, onChangeStatus }: { onEdit: () => void; onDelete: () => void; onChangeStatus: () => void; }) => {
  return (<div className="flex items-center justify-center gap-1.5"> 
    <Tooltip title="Edit"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div></Tooltip> 
    {/* <Tooltip title="Toggle Status"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400`} role="button" onClick={onChangeStatus}><TbToggleRight /></div></Tooltip> */}
    <Tooltip title="Send test email">
      <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600" role="button">
        <TbMailForward size={18} />
      </div>
    </Tooltip>
    <Tooltip title="View Template">
      <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600" role="button">
        <TbMailOpened size={18} />
      </div>
    </Tooltip>    
    <Tooltip title="Email Log">
      <div className="text-xl cursor-pointer select-none text-gray-500 hover:text-red-600" role="button">
        <TbMailCode size={18} />
      </div>
    </Tooltip>    
    {/* <Tooltip title="Delete"> <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`} role="button" onClick={onDelete}><TbTrash /></div></Tooltip>  */}
  </div>
  );
};
type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(({ onInputChange }, ref) => (<DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: ItemTableToolsProps) => (<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"><Tooltip title="Clear Filters"><Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button></Tooltip> <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div>);
type AutoEmailsTableProps = { columns: ColumnDef<AutoEmailItem>[]; data: AutoEmailItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: AutoEmailItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: AutoEmailItem) => void; onAllRowSelect: (checked: boolean, rows: Row<AutoEmailItem>[]) => void; };
const AutoEmailsTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: AutoEmailsTableProps) => (<DataTable selectable columns={columns} data={data} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} noData={!loading && data.length === 0} />);
type AutoEmailsSelectedFooterProps = { selectedItems: AutoEmailItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const AutoEmailsSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: AutoEmailsSelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; return (<> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold"> {selectedItems.length} Auto Email{selectedItems.length > 1 ? "s" : ""} selected </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmOpen(true)} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Auto Email(s)`} onClose={() => setDeleteConfirmOpen(false)} onRequestClose={() => setDeleteConfirmOpen(false)} onCancel={() => setDeleteConfirmOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmOpen(false); }}> <p>Are you sure you want to delete the selected auto email configuration(s)?</p> </ConfirmDialog> </>); };


// --- Main AutoEmailListing Component ---
const AutoEmailListing = () => {
  const dispatch = useAppDispatch();
  const {
    autoEmailsData = [],
    usersData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AutoEmailItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AutoEmailItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<AutoEmailItem[]>([]);

  const userOptions = useMemo(() =>
    Array.isArray(usersData) ? usersData.map((u: ApiUser) => ({
      value: String(u.id),
      label: u.name || `User ID: ${u.id}` // Fallback label
    })) : [],
    [usersData]);

  useEffect(() => {
    dispatch(getAutoEmailsAction());
    dispatch(getUsersAction());
  }, [dispatch]);

  const formMethods = useForm<AutoEmailFormData>({
    resolver: zodResolver(autoEmailFormSchema),
    defaultValues: { // Set initial default values, will be updated by openAddDrawer
      email_type: EMAIL_TYPE_OPTIONS[0]?.value || "",
      user_id: [],
      status: "active",
    },
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria, // This ensures filter drawer opens with current filters
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset({
      email_type: EMAIL_TYPE_OPTIONS[0]?.value || "",
      user_id: [],
      status: "active",
    });
    setEditingItem(null); setIsAddDrawerOpen(true);
  }, [formMethods]);

  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback((item: AutoEmailItem) => {
    setEditingItem(item);
    const userIdsArray = item.user_id ? item.user_id.split(',').map(id => id.trim()) : [];
    formMethods.reset({
      email_type: String(item.email_type), // Ensure string value for Select
      user_id: userIdsArray,
      status: (item.status === 'active' || item.status === 'inactive') ? item.status : 'inactive', // Ensure valid form status
    });
    setIsEditDrawerOpen(true);
  }, [formMethods]
  );
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

  const onSubmitHandler = async (data: AutoEmailFormData) => {
    setIsSubmitting(true);
    const apiPayload = {
      email_type: data.email_type, // This is the string value (e.g., "feedback") which acts as the ID
      user_id: data.user_id.join(','), // API expects comma-separated string
      status: data.status,
    };
    try {
      if (editingItem) {
        await dispatch(editAutoEmailAction({ id: editingItem.id, ...apiPayload })).unwrap();
        toast.push(<Notification title="Auto Email Updated" type="success" duration={2000} />);
        closeEditDrawer();
      } else {
        await dispatch(addAutoEmailAction(apiPayload)).unwrap();
        toast.push(<Notification title="Auto Email Added" type="success" duration={2000} />);
        closeAddDrawer();
      }
      dispatch(getAutoEmailsAction()); // Refresh list
    } catch (e: any) {
      toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger" duration={3000}>{(e as Error).message || "An error occurred."}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = useCallback((item: AutoEmailItem) => { setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteAutoEmailAction({ id: itemToDelete.id })).unwrap();
      const emailTypeLabel = EMAIL_TYPE_OPTIONS.find(et => et.value === itemToDelete.email_type)?.label || itemToDelete.email_type;
      toast.push(<Notification title="Auto Email Deleted" type="success" duration={2000}>{`Configuration for "${emailTypeLabel}" deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getAutoEmailsAction());
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{(e as Error).message || "Failed to delete."}</Notification>);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
    try {
      await dispatch(deleteAllAutoEmailsAction({ ids: idsToDelete.join(',') })).unwrap();
      toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{`${idsToDelete.length} auto email configuration(s) deleted.`}</Notification>);
      setSelectedItems([]);
      dispatch(getAutoEmailsAction());
    } catch (e: any) {
      toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{(e as Error).message || "Failed to delete selected items."}</Notification>);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  const handleChangeStatus = useCallback(async (item: AutoEmailItem) => {
    setIsChangingStatus(true);
    const newStatus = item.status === "active" ? "inactive" : "active";
    // API payload for edit expects all fields, even if only status is changing.
    // Ensure user_id is sent as a comma-separated string as per your add/edit logic.
    const apiPayload = {
      email_type: String(item.email_type),
      user_id: item.user_id, // Assuming item.user_id is already a comma-separated string from API
      status: newStatus
    };
    try {
      await dispatch(editAutoEmailAction({ id: item.id, ...apiPayload })).unwrap();
      toast.push(<Notification title="Status Changed" type="success" duration={2000}>{`Status changed to ${newStatus}.`}</Notification>);
      dispatch(getAutoEmailsAction());
    } catch (e: any) {
      toast.push(<Notification title="Status Change Failed" type="danger" duration={3000}>{(e as Error).message || "Failed to change status."}</Notification>);
    } finally { setIsChangingStatus(false); }
  }, [dispatch]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer]); // Removed filterFormMethods dependency, data is passed
  const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); setTableData((prev) => ({ ...prev, pageIndex: 1 })); }, [filterFormMethods]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceDataWithDisplayNames: AutoEmailItem[] =
      Array.isArray(autoEmailsData) ? autoEmailsData.map(item => {
        const emailTypeLabel = EMAIL_TYPE_OPTIONS.find(et => et.value === String(item.email_type))?.label || String(item.email_type);
        const userIdsArray = item.user_id ? String(item.user_id).split(',').map(id => id.trim()) : [];
        const usersLabel = userIdsArray.map(uid => userOptions.find(u => u.value === uid)?.label || `ID: ${uid}`).join(', '); // Fallback label for user
        return { ...item, emailTypeDisplay: emailTypeLabel, usersDisplay: usersLabel };
      }) : [];

    let processedData = cloneDeep(sourceDataWithDisplayNames);
    if (filterCriteria.filterEmailTypes?.length) { const v = filterCriteria.filterEmailTypes.map(et => et.value); processedData = processedData.filter(item => v.includes(String(item.email_type))); }
    if (filterCriteria.filterUserIds?.length) { const v = filterCriteria.filterUserIds.map(u => u.value); processedData = processedData.filter(item => String(item.user_id).split(',').some(uid => v.includes(uid.trim()))); }
    if (filterCriteria.filterStatus?.length) { const v = filterCriteria.filterStatus.map(s => s.value); processedData = processedData.filter(item => v.includes(String(item.status))); }
    if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => String(item.id).toLowerCase().includes(q) || (item.emailTypeDisplay && item.emailTypeDisplay.toLowerCase().includes(q)) || (item.usersDisplay && item.usersDisplay.toLowerCase().includes(q)) || String(item.status).toLowerCase().includes(q)); }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any, bVal: any;
        // Use display names for sorting these columns if they exist
        if (key === 'email_type' && a.emailTypeDisplay && b.emailTypeDisplay) { aVal = a.emailTypeDisplay; bVal = b.emailTypeDisplay; }
        else if (key === 'user_id' && a.usersDisplay && b.usersDisplay) { aVal = a.usersDisplay; bVal = b.usersDisplay; }
        else { aVal = a[key as keyof AutoEmailItem]; bVal = b[key as keyof AutoEmailItem]; }

        if (key === "created_at" || key === "updated_at") { return order === "asc" ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime(); }
        const aStr = String(aVal ?? "").toLowerCase(); const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    const dataToExport = [...processedData]; const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize; const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [autoEmailsData, tableData, filterCriteria, userOptions]);

  const handleExportData = useCallback(() => { exportAutoEmailsToCsv("auto_emails_export.csv", allFilteredAndSortedData, userOptions); }, [allFilteredAndSortedData, userOptions]);
  const handlePaginationChange = useCallback((page: number) => setTableData(prev => ({ ...prev, pageIndex: page })), []);
  const handleSelectPageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: Number(value), pageIndex: 1 })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => { setTableData(prev => ({ ...prev, sort: sort, pageIndex: 1 })); }, []);
  const handleSearchInputChange = useCallback((query: string) => { setTableData(prev => ({ ...prev, query: query, pageIndex: 1 })); }, []);
  const handleRowSelect = useCallback((checked: boolean, row: AutoEmailItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<AutoEmailItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<AutoEmailItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", size: 80, enableSorting: true },
    {
      header: "Email Type",
      accessorKey: "email_type", // Sorts by this raw value
      size: 250,
      enableSorting: true,
      cell: props => props.row.original.emailTypeDisplay || String(props.getValue()) // Display pre-calculated label
    },
    {
      header: "User(s)",
      accessorKey: "user_id", // Sorts by this raw value (comma-separated IDs)
      size: 250,
      enableSorting: true,
      cell: props => <Tooltip title={props.row.original.usersDisplay || ''} placement="top-start"><span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-[230px]">{props.row.original.usersDisplay || '-'}</span></Tooltip> // Display pre-calculated label with tooltip
    },
    {
      header: "Status",
      accessorKey: "status",
      size: 120,
      enableSorting: true,
      cell: props => {
        const statusVal = String(props.getValue());
        return <Tag className={classNames("capitalize whitespace-nowrap min-w-[70px] text-center", autoEmailStatusColor[statusVal] || autoEmailStatusColor.default)}>{AUTO_EMAIL_STATUS_OPTIONS.find(s => s.value === statusVal)?.label || statusVal}</Tag>
      }
    },
    // { header: "Created At", accessorKey: "created_at", size: 150, enableSorting: true, cell: props => props.getValue() ? new Date(props.getValue<string>()).toLocaleDateString() : '-' },
    { 
      header: "Created At", 
      accessorKey: "created_at", 
      size: 180, 
      enableSorting: true, 
      cell: props => {
        return (
          <span className="text-xs">{dayjs(props.getValue()).format("D MMM YYYY, h:mm A")}</span>
        )
      },
    },
    { header: "Actions", id: "actions", size: 120, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onChangeStatus={() => handleChangeStatus(props.row.original)} /> },
  ], [userOptions, openEditDrawer, handleDeleteClick, handleChangeStatus]); // userOptions dependency is important for user display in table

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem label="Email Type" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.email_type} errorMessage={currentFormMethods.formState.errors.email_type?.message}>
        <Controller name="email_type" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Email Type" options={EMAIL_TYPE_OPTIONS} value={EMAIL_TYPE_OPTIONS.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbMailForward />} />)} />
      </FormItem>
      <FormItem label="User(s)" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.user_id} errorMessage={(currentFormMethods.formState.errors.user_id as any)?.message || (currentFormMethods.formState.errors.user_id as any)?.[0]?.message}>
        <Controller name="user_id" control={currentFormMethods.control} render={({ field }) => (<Select isMulti placeholder={userOptions.length > 0 ? "Select User(s)" : "Loading Users..."} options={userOptions} value={userOptions.filter(o => field.value?.includes(o.value))} onChange={(opts) => field.onChange(opts?.map(o => o.value) || [])} prefix={<TbUsers />} disabled={userOptions.length === 0 && masterLoadingStatus === "loading"} />)} />
      </FormItem>
      <FormItem label="Status" className="md:col-span-2" invalid={!!currentFormMethods.formState.errors.status} errorMessage={currentFormMethods.formState.errors.status?.message}>
        <Controller name="status" control={currentFormMethods.control} render={({ field }) => (<Select placeholder="Select Status" options={AUTO_EMAIL_STATUS_OPTIONS} value={AUTO_EMAIL_STATUS_OPTIONS.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbToggleRight />} />)} />
      </FormItem>
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Automation Email</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
          </div>
          <ItemTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchInputChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4">
            <AutoEmailsTable columns={columns} data={pageData} loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting || isChangingStatus} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>
      <AutoEmailsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      <Drawer title={editingItem ? "Edit Automation Email" : "Add New Automation Email"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={700}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> <Button size="sm" variant="solid" form="autoEmailForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save Configuration"}</Button> </div>} >
        <Form id="autoEmailForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-4"> {renderDrawerForm(formMethods)} </Form>
      </Drawer>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={<div className="text-right w-full flex justify-end gap-2"> <Button size="sm" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterAutoEmailForm" type="submit">Apply</Button> </div>} >
        <Form id="filterAutoEmailForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Email Type"><Controller name="filterEmailTypes" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Email Type" options={EMAIL_TYPE_OPTIONS} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="User"><Controller name="filterUserIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder={userOptions.length > 0 ? "Any User" : "Loading Users..."} options={userOptions} value={field.value || []} onChange={val => field.onChange(val || [])} disabled={userOptions.length === 0 && masterLoadingStatus === "loading"} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Any Status" options={AUTO_EMAIL_STATUS_OPTIONS} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Auto Email Configuration" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} >
        <p>Are you sure you want to delete the auto email configuration for "<strong>{itemToDelete ? (itemToDelete.emailTypeDisplay || itemToDelete.email_type) : ''}</strong>"? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

export default AutoEmailListing;