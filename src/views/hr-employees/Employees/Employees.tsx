import { zodResolver } from "@hookform/resolvers/zod";
import React, { Ref, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from 'react-router-dom';
import { z } from "zod";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import DebouceInput from "@/components/shared/DebouceInput";
import RichTextEditor from "@/components/shared/RichTextEditor";
import StickyFooter from "@/components/shared/StickyFooter";
import {
  Card,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
  Checkbox
} from "@/components/ui";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Dialog from "@/components/ui/Dialog";
import Notification from "@/components/ui/Notification";
import Tag from "@/components/ui/Tag";
import toast from "@/components/ui/toast";
import Tooltip from "@/components/ui/Tooltip";

// Icons
import {
  TbActivity,
  TbAlarm,
  TbBell,
  TbBrandWhatsapp,
  TbCalendarEvent,
  TbChecks,
  TbCloudUpload,
  TbColumns,
  TbDownload,
  TbEye,
  TbFilter,
  TbKey,
  TbMail,
  TbPencil,
  TbPlus,
  TbReload,
  TbSearch,
  TbTagStarred,
  TbUser,
  TbUserBolt,
  TbUserCircle,
  TbUserExclamation,
  TbUsers,
  TbUserScreen,
  TbUserShare,
  TbUserSquareRounded,
  TbUserX,
  TbClipboardText,
  TbFileZip,
  TbX,
} from "react-icons/tb";

// Types
import type { TableQueries } from "@/@types/common";
import type {
  ColumnDef,
  OnSortParam,
  Row,
} from "@/components/shared/DataTable";

// Redux
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addNotificationAction,
  addScheduleAction,
  deleteEmployeesAction,
  getDepartmentsAction,
  getDesignationsAction,
  getEmployeesListingAction,
  getRolesAction,
  getAllUsersAction,
  submitExportReasonAction // Ensure this is imported if you use it
} from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";
import dayjs from "dayjs";
import { BsThreeDotsVertical } from "react-icons/bs";
import { shallowEqual, useSelector } from "react-redux";


// --- Define Item Type ---
export type EmployeeStatus = "active" | "inactive" | "on_leave" | "terminated";
export type EmployeeItem = {
  id: string;
  status: EmployeeStatus;
  name: string;
  email: string;
  mobile: string | null;
  department: string;
  designation: string;
  roles: string[];
  avatar?: string | null;
  createdAt: Date;
  role: string | null;
  joiningDate?: Date | null;
  bio?: string | null;
};

// --- Constants ---
const EMPLOYEE_STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

export const employeeStatusColor: Record<EmployeeStatus, string> = {
  active: "bg-blue-500",
  inactive: "bg-emerald-500",
  on_leave: "bg-amber-500",
  terminated: "bg-red-500",
};

// --- Zod Schema for Filter Form ---
const employeeFilterFormSchema = z.object({
  filterDepartments: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterDesignations: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterRoles: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type EmployeeFilterFormData = z.infer<typeof employeeFilterFormSchema>;

// --- Zod Schema for Schedule Form ---
const scheduleSchema = z.object({
  event_title: z.string().min(3, "Title must be at least 3 characters."),
  event_type: z.string({ required_error: "Event type is required." }).min(1, "Event type is required."),
  date_time: z.date({ required_error: "Event date & time is required." }),
  remind_from: z.date().nullable().optional(),
  notes: z.string().optional(),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

// --- Zod Schema for Export Reason ---
const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter Utility ---
const EMPLOYEE_CSV_HEADERS = ["ID", "Name", "Email", "Mobile", "Status", "Department", "Designation", "Roles", "Joining Date"];

function exportEmployeesToCsv(filename: string, rows: EmployeeItem[]) {
  if (!rows || !rows.length) {
    toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
    return false;
  }

  const headerToKeyMap: Record<string, keyof EmployeeItem | string> = {
    "ID": "id", "Name": "name", "Email": "email", "Mobile": "mobile", "Status": "status",
    "Department": "department", "Designation": "designation", "Roles": "roles", "Joining Date": "joiningDate"
  };

  const transformedRows = rows.map(row => {
    const statusText = row.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      id: String(row.id) || "N/A", name: row.name || "N/A", email: row.email || "N/A", mobile: row.mobile || "N/A",
      status: statusText, department: row.department || "N/A", designation: row.designation || "N/A",
      roles: Array.isArray(row.roles) ? row.roles.join(', ') : 'N/A',
      joiningDate: row.joiningDate ? dayjs(row.joiningDate).format("DD-MMM-YYYY") : "N/A",
    };
  });
  
  const csvContent = [
    EMPLOYEE_CSV_HEADERS.join(','),
    ...transformedRows.map(row => 
      EMPLOYEE_CSV_HEADERS.map(header => 
        JSON.stringify(row[headerToKeyMap[header] as keyof typeof row] ?? '')
      ).join(',')
    )
  ].join('\n');

  const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.push(<Notification title="Export Successful" type="success">Data exported to {filename}.</Notification>);
    return true;
  }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- Modal Type Definitions ---
export type ModalType = 'email' | 'whatsapp' | 'notification' | 'task' | 'schedule' | 'active' | 'documents' | 'activityLog' | 'alert';
export interface ModalState { isOpen: boolean; type: ModalType | null; data: EmployeeItem | null; }
export type SelectOption = { value: any; label: string };

// --- Reusable ActionColumn Component ---
const ActionColumn = ({
  rowData,
  onEdit,
  onDelete,
  onChangePassword,
  onView,
  onOpenModal,
}: {
  rowData: EmployeeItem;
  onEdit: () => void;
  onDelete: () => void;
  onChangePassword: () => void;
  onView: () => void;
  onOpenModal: (type: ModalType, data: EmployeeItem) => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
      <Tooltip title="View"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={onView}><TbEye /></div></Tooltip>
      <Tooltip title="Change Password"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`} role="button" onClick={onChangePassword}><TbKey /></div></Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item onClick={() => onOpenModal('email', rowData)} className="flex items-center gap-2"><TbMail size={18} /><span className="text-xs">Send Email</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('whatsapp', rowData)} className="flex items-center gap-2"><TbBrandWhatsapp size={18} /><span className="text-xs">Send Whatsapp</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('notification', rowData)} className="flex items-center gap-2"><TbBell size={18} /><span className="text-xs">Add Notification</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('schedule', rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /><span className="text-xs">Add Schedule</span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};
const EmployeeSelected = ({ selectedEmployees, onDeleteSelected }: { selectedEmployees: EmployeeItem[]; onDeleteSelected: () => void; }) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };
  if (selectedEmployees.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedEmployees.length}</span><span>Employee{selectedEmployees.length > 1 ? "s" : ""} selected</span></span></span>
          <div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick}>Delete</Button></div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedEmployees.length} Employee${selectedEmployees.length > 1 ? "s" : ""}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete}>
        <p>Are you sure you want to delete the selected employee{selectedEmployees.length > 1 ? "s" : ""}? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};
// ============================================================================
// --- MODALS SECTION ---
// ============================================================================
const AddScheduleDialog: React.FC<{ employee: EmployeeItem; onClose: () => void }> = ({ employee, onClose }) => {
  // ... Full implementation ...
  return <Dialog isOpen={true}>...</Dialog>
};

const EmployeeModals: React.FC<{ modalState: ModalState; onClose: () => void; getAllUserDataOptions: SelectOption[] }> = ({ modalState, onClose, getAllUserDataOptions }) => {
  const { type, data: employee, isOpen } = modalState;
  if (!isOpen || !employee) return null;
  switch (type) {
    case 'schedule': return <AddScheduleDialog employee={employee} onClose={onClose} />;
    default: return <Dialog isOpen={true} onClose={onClose}><p>Modal for action: {type}</p></Dialog>
  }
};

// --- ActiveFiltersDisplay Component ---
const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: EmployeeFilterFormData;
  onRemoveFilter: (key: keyof EmployeeFilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const filterKeyToLabelMap: Record<string, string> = {
    filterDepartments: 'Dept', filterDesignations: 'Designation', filterStatuses: 'Status', filterRoles: 'Role',
  };
  const activeFiltersList = Object.entries(filterData).flatMap(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return [];

    return value.map((item: { value: string; label: string }) => ({
      key, value: item.value, label: `${filterKeyToLabelMap[key] || 'Filter'}: ${item.label}`,
    }));
  });
  if (activeFiltersList.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {activeFiltersList.map(filter => (
        <Tag key={`${filter.key}-${filter.value}`} prefix className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500">
          {filter.label}
          <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter(filter.key as keyof EmployeeFilterFormData, filter.value)} />
        </Tag>
      ))}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};


// --- Main EmployeesListing Component ---
const EmployeesListing = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { EmployeesList: Employees, Roles = [], departmentsData = [], designationsData = [], getAllUserData = [] } = useSelector(masterSelector, shallowEqual);

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [employeesCount, setEmployeesCount] = useState<any>({});
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<"idle" | "loading">("idle");

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<EmployeeFilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeItem[]>([]);

  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
  const [itemToDelete, setItemToDelete] = useState<EmployeeItem | null>(null);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  const filterFormMethods = useForm<EmployeeFilterFormData>({ resolver: zodResolver(employeeFilterFormSchema) });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), mode: 'onChange' });
  const getAllUserDataOptions = useMemo(() => Array.isArray(getAllUserData) ? getAllUserData.map((b: any) => ({ value: b.id, label: b.name })) : [], [getAllUserData]);

  useEffect(() => {
    setMasterLoadingStatus('loading');
    dispatch(getEmployeesListingAction()).finally(() => setMasterLoadingStatus('idle'));
    dispatch(getRolesAction());
    dispatch(getDepartmentsAction());
    dispatch(getDesignationsAction());
    dispatch(getAllUsersAction());
  }, [dispatch])

  useEffect(() => {
    if (Employees && Employees?.data?.data) {
      const formattedData = Employees.data.data.map((emp: any) => ({
        ...emp,
        createdAt: new Date(emp.created_at),
        joiningDate: emp.date_of_joining ? new Date(emp.date_of_joining) : null,
        roles: Array.isArray(emp.roles) ? emp.roles.map((r: any) => r.name) : [],
        department: emp.department?.name || 'N/A',
        designation: emp.designation?.name || 'N/A'
      }));
      setEmployees(formattedData);
      setEmployeesCount(Employees?.counts || {});
    }
  }, [Employees]);

  const handleOpenModal = (type: ModalType, employee: EmployeeItem) => setModalState({ isOpen: true, type, data: employee });
  const handleCloseModal = () => setModalState({ isOpen: false, type: null, data: null });
  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);

  const onApplyFiltersSubmit = (data: EmployeeFilterFormData) => {
    setFilterCriteria(data);
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };

  const onClearFilters = () => {
    const defaultFilters = { filterDepartments: [], filterDesignations: [], filterStatuses: [], filterRoles: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
  };

  const handleRemoveFilter = (key: keyof EmployeeFilterFormData, valueToRemove: string) => {
    setFilterCriteria(prev => {
      const newCriteria = { ...prev };
      const currentFilterArray = newCriteria[key] as { value: string; label: string }[] | undefined;
      if (currentFilterArray) {
        (newCriteria as any)[key] = currentFilterArray.filter(item => item.value !== valueToRemove);
      }
      return newCriteria;
    });
    handleSetTableData({ pageIndex: 1 });
  };

  const onRefreshData = () => {
    onClearFilters();
    dispatch(getEmployeesListingAction());
    toast.push(<Notification title="Data Refreshed" type="success" duration={2000} />);
  };

  const handleCardClick = (filterType: string, value: string) => {
    onClearFilters();
    if (filterType === 'status') {
      const statusOption = EMPLOYEE_STATUS_OPTIONS.find(s => s.value === value);
      if (statusOption) {
        setFilterCriteria({ ...filterCriteria, filterStatuses: [statusOption] });
      }
    }
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData = [...employees];
    if (filterCriteria.filterDepartments?.length) { const v = filterCriteria.filterDepartments.map((o) => o.label.toLowerCase()); processedData = processedData.filter((e: any) => v.includes(e.department?.toLowerCase())); }
    if (filterCriteria.filterDesignations?.length) { const v = filterCriteria.filterDesignations.map((o) => o.label.toLowerCase()); processedData = processedData.filter((e: any) => v.includes(e.designation?.toLowerCase())); }
    if (filterCriteria.filterStatuses?.length) { const v = filterCriteria.filterStatuses.map((o) => o.value); processedData = processedData.filter((e) => v.includes(e.status)); }
    if (filterCriteria.filterRoles?.length) { const v = filterCriteria.filterRoles.map((o) => o.label.toLowerCase()); processedData = processedData.filter((e: any) => e.roles.some((role: any) => v.includes(role?.toLowerCase()))); }
    if (tableData.query) { const query = tableData.query.toLowerCase(); processedData = processedData.filter((e: any) => e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a: any, b: any) => {
        let aVal = a[key as keyof EmployeeItem] as any;
        let bVal = b[key as keyof EmployeeItem] as any;
        if (key === "createdAt" || key === "joiningDate") { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0; }
        else if (key === "roles") { aVal = a.roles.join(", "); bVal = b.roles.join(", "); }
        if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc" ? String(aVal ?? "").localeCompare(String(bVal ?? "")) : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }
    return { pageData: processedData.slice((tableData.pageIndex - 1) * tableData.pageSize, tableData.pageIndex * tableData.pageSize), total: processedData.length, allFilteredAndSortedData: processedData };
  }, [employees, tableData, filterCriteria]);

  const handleOpenExportReasonModal = () => {
    if (allFilteredAndSortedData.length > 0) {
      exportReasonFormMethods.reset();
      setIsExportReasonModalOpen(true);
    } else {
        toast.push(<Notification title="No Data" type="info">There is no data to export.</Notification>);
    }
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const fileName = `employees_export_${dayjs().format('YYYY-MM-DD')}.csv`;
    try {
        await dispatch(submitExportReasonAction({ reason: data.reason, module: 'Employee', file_name: fileName })).unwrap();
        const exportSuccessful = exportEmployeesToCsv(fileName, allFilteredAndSortedData);
        if (exportSuccessful) {
            setIsExportReasonModalOpen(false);
        }
    } catch (error: any) {
        toast.push(<Notification title="Operation Failed" type="danger" message={error.message || 'Could not submit reason or export data.'} />);
    } finally {
        setIsSubmittingExportReason(false);
    }
  };
  
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedEmployees([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: EmployeeItem) => { setSelectedEmployees((prev) => checked ? [...prev, row] : prev.filter((e) => e.id !== row.id)); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<EmployeeItem>[]) => { const originals = currentRows.map((r) => r.original); if (checked) { setSelectedEmployees((prev) => [...prev, ...originals.filter((o) => !prev.some(p => p.id === o.id))]); } else { const currentIds = new Set(originals.map((o) => o.id)); setSelectedEmployees((prev) => prev.filter((i) => !currentIds.has(i.id))); } }, []);


  const columns: ColumnDef<EmployeeItem>[] = useMemo(() => [
    { header: "Status", accessorKey: "status", cell: (props) => { const { status } = props.row.original || {}; const displayStatus = status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toLowerCase()); return (<Tag className={`${employeeStatusColor[displayStatus as keyof typeof employeeStatusColor]} text-white capitalize`}>{displayStatus}</Tag>); }, },
    { header: "Name", accessorKey: "name", cell: (props) => { const { name, email, mobile, avatar } = props.row.original || {}; return (<div className="flex items-center"><Avatar size={28} shape="circle" src={avatar} icon={<TbUserCircle />}>{!avatar ? name.charAt(0).toUpperCase() : ""}</Avatar><div className="ml-2 rtl:mr-2"><span className="font-semibold">{name}</span><div className="text-xs text-gray-500">{email}</div><div className="text-xs text-gray-500">{mobile}</div></div></div>); }, },
    { header: "Designation", accessorKey: "designation", size: 200, cell: (props: any) => { const data = props.row.original || {}; return (<div className="flex items-center"><div className="ml-2 rtl:mr-2"><span className="font-semibold">{data?.designation_id ?? ""}</span></div></div>); }, },
    { header: "Department", accessorKey: "department", size: 200, cell: (props: any) => { const { department } = props.row.original || {}; return (<div className="flex items-center"><div className="ml-2 rtl:mr-2"><span className="font-semibold">{department?.name ?? ""}</span></div></div>); }, },
    { header: "Roles", accessorKey: "roles", cell: (props: any) => { const { roles } = props.row.original || {}; return (<div className="flex flex-wrap gap-1 text-xs">{props?.row?.original?.roles?.map((role: any) => (<Tag key={role} className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 text-[10px]">{role?.name || ""}</Tag>))}</div>) }, },
    { header: "Joined At", accessorKey: "joiningDate", size: 200, cell: (props: any) => props?.row?.original?.date_of_joining ? <span className="text-xs"> {dayjs(props?.row?.original?.date_of_joining).format("D MMM YYYY, h:mm A")}</span> : '-' },
    { header: "Action", id: "action", size: 120, meta: { HeaderClass: "text-center" }, cell: (props) => (<ActionColumn rowData={props.row.original} onView={() => navigate(`/hr-employees/employees/view/${props.row.original.id}`)} onEdit={() => navigate(`/hr-employees/employees/edit/${props.row.original.id}`)} onDelete={() => { }} onChangePassword={() => { }} onOpenModal={handleOpenModal} />) },
  ], [navigate, handleOpenModal]);

  const [filteredColumns, setFilteredColumns] = useState(columns);
  const toggleColumn = (checked: boolean, colId: string) => {
      if (checked) {
        setFilteredColumns(prev => [...prev, columns.find(c => (c.id || c.accessorKey) === colId)!].sort((a,b) => columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey)) - columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey))));
    } else {
        setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId));
    }
  };
  const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
  const roleOptions = useMemo(() => Array.isArray(Roles) ? Roles.map((r: any) => ({ value: String(r.id), label: r.display_name })) : [], [Roles]);
  const departmentOptions = useMemo(() => Array.isArray(departmentsData?.data) ? departmentsData?.data.map((d: any) => ({ value: d.name, label: d.name })) : [], [departmentsData?.data]);
  const designationOptions = useMemo(() => Array.isArray(designationsData?.data) ? designationsData?.data.map((d: any) => ({ value: d.name, label: d.name })) : [], [designationsData?.data]);
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4"><h5 className="mb-4 lg:mb-0">Employees Listing</h5><Button variant="solid" icon={<TbPlus />} onClick={() => navigate('/hr-employees/employees/add')}>Add New</Button></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
            <Tooltip title="Click to show all employees"><div onClick={onClearFilters}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbUsers size={24} /></div><div><h6>{employeesCount?.total || 0}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Card bodyClass={cardBodyClass} className="rounded-md border border-violet-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbUserSquareRounded size={24} /></div><div><h6>{employeesCount?.this_month || 0}</h6><span className="font-semibold text-xs">This Month</span></div></Card>
            <Card bodyClass={cardBodyClass} className="rounded-md border border-pink-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbUserBolt size={24} /></div><div><h6>{employeesCount?.avg_present_percent || 0}%</h6><span className="font-semibold text-xs">Avg. Present</span></div></Card>
            <Card bodyClass={cardBodyClass} className="rounded-md border border-orange-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbUserExclamation size={24} /></div><div><h6>{employeesCount?.late_arrivals || 0}</h6><span className="font-semibold text-xs">Late Arrivals</span></div></Card>
            <Card bodyClass={cardBodyClass} className="rounded-md border border-green-300" ><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUserScreen size={24} /></div><div><h6>{employeesCount?.training_rate || 0}</h6><span className="font-semibold text-xs">Training Rate</span></div></Card>
            <Card bodyClass={cardBodyClass} className="rounded-md border border-red-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbUserShare size={24} /></div><div><h6>{employeesCount?.offboarding || 0}</h6><span className="font-semibold text-xs">Offboarding</span></div></Card>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
            <DebouceInput placeholder="Quick Search..." value={tableData.query} onChange={(e) => handleSearchChange(e.target.value)} />
            <div className="flex gap-2">
              <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
                <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>{columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}</div>
              </Dropdown>
              <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onRefreshData} /></Tooltip>
              <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
              <Button icon={<TbCloudUpload />} onClick={handleOpenExportReasonModal} disabled={!allFilteredAndSortedData.length}>Export</Button>
            </div>
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="flex-grow overflow-auto"><DataTable selectable columns={filteredColumns} data={pageData} loading={masterLoadingStatus === "loading"} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} noData={masterLoadingStatus !== "loading" && pageData.length === 0} /></div>
        </AdaptiveCard>
      </Container>
      <EmployeeSelected selectedEmployees={selectedEmployees} onDeleteSelected={() => { }} />
      <EmployeeModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={getAllUserDataOptions} />
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterEmployeeForm" type="submit">Apply</Button></div>}>
        <Form id="filterEmployeeForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Department"><Controller name="filterDepartments" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Department" options={departmentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Designation"><Controller name="filterDesignations" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Designation" options={designationOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Status" options={EMPLOYEE_STATUS_OPTIONS} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Role"><Controller name="filterRoles" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Role" options={roleOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>
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
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}
      >
        <Form
            id="exportReasonForm"
            onSubmit={(e) => {
                e.preventDefault();
                exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)();
            }}
        >
            <FormItem
                label="Please provide a reason for exporting the data:"
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
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default EmployeesListing;