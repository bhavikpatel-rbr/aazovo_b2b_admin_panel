import { zodResolver } from "@hookform/resolvers/zod";
import cloneDeep from "lodash/cloneDeep";
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
    getDepartmentsAction, 
    getDesignationsAction, 
    getEmployeesListingAction, 
    getRolesAction, 
    getAllUsersAction 
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
        <Dropdown.Item onClick={() => onOpenModal('task', rowData)} className="flex items-center gap-2"><TbUser size={18} /><span className="text-xs">Assign Task</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('schedule', rowData)} className="flex items-center gap-2"><TbCalendarEvent size={18} /><span className="text-xs">Add Schedule</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('active', rowData)} className="flex items-center gap-2"><TbTagStarred size={18} /><span className="text-xs">Add Activity</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('documents', rowData)} className="flex items-center gap-2"><TbDownload size={18} /><span className="text-xs">Download Documents</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('activityLog', rowData)} className="flex items-center gap-2"><TbActivity size={18} /><span className="text-xs">View Activity Log</span></Dropdown.Item>
        <Dropdown.Item onClick={() => onOpenModal('alert', rowData)} className="flex items-center gap-2"><TbAlarm size={18} /><span className="text-xs">View Alerts</span></Dropdown.Item>
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
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const eventTypeOptions = [ { value: "Meeting", label: "Meeting" }, { value: "Call", label: "Follow-up Call" }, { value: "Deadline", label: "Project Deadline" }, { value: "Reminder", label: "Reminder" }, ];

    const { control, handleSubmit, formState: { errors, isValid } } = useForm<ScheduleFormData>({
      resolver: zodResolver(scheduleSchema),
      defaultValues: { event_title: `Meeting with ${employee.name}`, event_type: undefined, date_time: null as any, remind_from: null, notes: `Regarding employee ${employee.name} (${employee.designation}).`},
      mode: 'onChange',
    });
  
    const onAddEvent = async (data: ScheduleFormData) => {
      setIsLoading(true);
      const payload = {
        module_id: Number(employee.id),
        module_name: 'Employee',
        event_title: data.event_title,
        event_type: data.event_type,
        date_time: dayjs(data.date_time).format('YYYY-MM-DDTHH:mm:ss'),
        ...(data.remind_from && { remind_from: dayjs(data.remind_from).format('YYYY-MM-DDTHH:mm:ss') }),
        notes: data.notes || '',
      };
  
      try {
        await dispatch(addScheduleAction(payload)).unwrap();
        toast.push(<Notification type="success" title="Event Scheduled" children={`Successfully scheduled event for ${employee.name}.`} />);
        onClose();
      } catch (error: any) {
        toast.push(<Notification type="danger" title="Scheduling Failed" children={error?.message || 'An unknown error occurred.'} />);
      } finally {
        setIsLoading(false);
      }
    };
    
    return (
      <Dialog isOpen={true} onClose={onClose} onRequestClose={onClose}>
        <h5 className="mb-4">Add Schedule for {employee.name}</h5>
        <Form onSubmit={handleSubmit(onAddEvent)}>
          <FormItem label="Event Title" invalid={!!errors.event_title} errorMessage={errors.event_title?.message}>
            <Controller name="event_title" control={control} render={({ field }) => <Input {...field} />} />
          </FormItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem label="Event Type" invalid={!!errors.event_type} errorMessage={errors.event_type?.message}>
              <Controller name="event_type" control={control} render={({ field }) => (<UiSelect placeholder="Select Type" options={eventTypeOptions} value={eventTypeOptions.find(o => o.value === field.value)} onChange={(opt: any) => field.onChange(opt?.value)} /> )} />
            </FormItem>
            <FormItem label="Event Date & Time" invalid={!!errors.date_time} errorMessage={errors.date_time?.message}>
              <Controller name="date_time" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} />
            </FormItem>
          </div>
          <FormItem label="Reminder Date & Time (Optional)" invalid={!!errors.remind_from} errorMessage={errors.remind_from?.message}>
            <Controller name="remind_from" control={control} render={({ field }) => (<DatePicker.DateTimepicker placeholder="Select date and time" value={field.value} onChange={field.onChange} />)} />
          </FormItem>
          <FormItem label="Notes" invalid={!!errors.notes} errorMessage={errors.notes?.message}>
            <Controller name="notes" control={control} render={({ field }) => <Input textArea {...field} />} />
          </FormItem>
          <div className="text-right mt-6">
            <Button type="button" className="mr-2" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button variant="solid" type="submit" loading={isLoading} disabled={!isValid || isLoading}>Save Event</Button>
          </div>
        </Form>
      </Dialog>
    );
};

const EmployeeModals: React.FC<{ modalState: ModalState; onClose: () => void; getAllUserDataOptions: SelectOption[] }> = ({ modalState, onClose, getAllUserDataOptions }) => {
    const { type, data: employee, isOpen } = modalState;
    if (!isOpen || !employee) return null;
    switch(type) {
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
    filterDepartments: 'Dept',
    filterDesignations: 'Designation',
    filterStatuses: 'Status',
    filterRoles: 'Role',
  };

  const activeFiltersList = Object.entries(filterData).flatMap(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return [];
    
    return value.map((item: { value: string; label: string }) => ({
      key,
      value: item.value,
      label: `${filterKeyToLabelMap[key] || 'Filter'}: ${item.label}`,
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

  const filterFormMethods = useForm<EmployeeFilterFormData>({ resolver: zodResolver(employeeFilterFormSchema) });
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
        roles: Array.isArray(emp.roles) ? emp.roles.map((r:any) => r.name) : [],
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
        setFilterCriteria({ filterStatuses: [statusOption] });
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

  const handleExportData = () => {
    toast.push(<Notification title="Export Started" type="info">Preparing your file...</Notification>);
    exportToCsvEmployees("employees_export.csv", allFilteredAndSortedData);
  };

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedEmployees([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: EmployeeItem) => { setSelectedEmployees((prev) => checked ? [...prev, row] : prev.filter((e) => e.id !== row.id)); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<EmployeeItem>[]) => { const originals = currentRows.map((r) => r.original); if (checked) { setSelectedEmployees((prev) => [...prev, ...originals.filter((o) => !prev.some(p => p.id === o.id))]); } else { const currentIds = new Set(originals.map((o) => o.id)); setSelectedEmployees((prev) => prev.filter((i) => !currentIds.has(i.id))); } }, []);
  
  const columns: ColumnDef<EmployeeItem>[] = useMemo(() => [
    { 
      header: "Status", 
      accessorKey: "status", 
      cell: (props) => { 
        const { status } = props.row.original || {}; 
        const displayStatus = status.replace(/_/g, " ");
        // *** THIS IS THE CORRECTED LINE ***
        return (<Tag className={`${employeeStatusColor[status as keyof typeof employeeStatusColor] || 'bg-gray-500'} text-white capitalize`}>{displayStatus}</Tag>);
      }, 
    },
    { header: "Name", accessorKey: "name", cell: (props) => { const { name, email, mobile, avatar } = props.row.original || {}; return (<div className="flex items-center"><Avatar size={28} shape="circle" src={avatar || ''} icon={<TbUserCircle />}>{!avatar ? name?.charAt(0).toUpperCase() : ""}</Avatar><div className="ml-2 rtl:mr-2"><span className="font-semibold">{name}</span><div className="text-xs text-gray-500">{email}</div><div className="text-xs text-gray-500">{mobile}</div></div></div>); }, },
    { header: "Designation", accessorKey: "designation", size: 200, },
    { header: "Department", accessorKey: "department", size: 200, },
    { header: "Roles", accessorKey: "roles", cell: (props) => { const { roles } = props.row.original || {}; return (<div className="flex flex-wrap gap-1 text-xs">{Array.isArray(roles) && roles.map((role: any) => (<Tag key={role} className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 text-[10px]">{role}</Tag>))}</div>) }, },
    { header: "Joined At", accessorKey: "joiningDate", size: 200, cell: (props) => props.row.original.joiningDate ? <span className="text-xs"> {dayjs(props.row.original.joiningDate).format("D MMM YYYY")}</span> : '-' },
    { header: "Action", id: "action", size: 120, meta: { HeaderClass: "text-center" }, cell: (props) => (<ActionColumn rowData={props.row.original} onView={() => navigate(`/hr-employees/employees/view/${props.row.original.id}`)} onEdit={() => navigate(`/hr-employees/employees/edit/${props.row.original.id}`)} onDelete={() => {}} onChangePassword={() => {}} onOpenModal={handleOpenModal} />) },
  ], [navigate, handleOpenModal]);

  const [filteredColumns, setFilteredColumns] = useState(columns);
  const toggleColumn = (checked: boolean, colId: string) => { if (checked) { const newVisibleIds = [...filteredColumns.map(c => c.id || c.accessorKey as string), colId]; setFilteredColumns(columns.filter(c => newVisibleIds.includes(c.id || c.accessorKey as string))); } else { setFilteredColumns(currentCols => currentCols.filter(c => (c.id || c.accessorKey as string) !== colId)); } };
  const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey as string) === colId);

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
              <Tooltip title="Filter by Active status"><div onClick={() => handleCardClick('status', 'active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-300")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUserCircle size={24} /></div><div><h6>{employeesCount?.active || 0}</h6><span className="font-semibold text-xs">Active</span></div></Card></div></Tooltip>
              <Tooltip title="Filter by Inactive status"><div onClick={() => handleCardClick('status', 'inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbUserSquareRounded size={24} /></div><div><h6>{employeesCount?.inactive || 0}</h6><span className="font-semibold text-xs">Inactive</span></div></Card></div></Tooltip>
              <Tooltip title="Filter by On Leave status"><div onClick={() => handleCardClick('status', 'on_leave')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-amber-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-amber-100 text-amber-500"><TbUserExclamation size={24} /></div><div><h6>{employeesCount?.on_leave || 0}</h6><span className="font-semibold text-xs">On Leave</span></div></Card></div></Tooltip>
              <Tooltip title="Filter by Terminated status"><div onClick={() => handleCardClick('status', 'terminated')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbUserX size={24} /></div><div><h6>{employeesCount?.terminated || 0}</h6><span className="font-semibold text-xs">Terminated</span></div></Card></div></Tooltip>
              <Card bodyClass={cardBodyClass} className="rounded-md border border-pink-200"><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbUserBolt size={24} /></div><div><h6>{employeesCount?.avg_present_percent || 0}%</h6><span className="font-semibold text-xs">Avg. Present</span></div></Card>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
              <DebouceInput placeholder="Quick Search..." value={tableData.query} onChange={(e) => handleSearchChange(e.target.value)} />
              <div className="flex gap-2">
                  <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
                      <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>{columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}</div>
                  </Dropdown>
                  <Tooltip title="Clear Filters & Reload"><Button icon={<TbReload />} onClick={onRefreshData} /></Tooltip>
                  <Button icon={<TbFilter />} onClick={openFilterDrawer}>Filter</Button>
                  <Button icon={<TbCloudUpload />} onClick={handleExportData} disabled={!allFilteredAndSortedData.length}>Export</Button>
              </div>
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="flex-grow overflow-auto"><DataTable selectable columns={filteredColumns} data={pageData} loading={masterLoadingStatus === "loading"} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} noData={masterLoadingStatus !== "loading" && pageData.length === 0} /></div>
        </AdaptiveCard>
      </Container>
      <EmployeeSelected selectedEmployees={selectedEmployees} onDeleteSelected={() => {}} />
      <EmployeeModals modalState={modalState} onClose={handleCloseModal} getAllUserDataOptions={getAllUserDataOptions} />
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterEmployeeForm" type="submit">Apply</Button></div>}>
        <Form id="filterEmployeeForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Department"><Controller name="filterDepartments" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Department" options={departmentOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Designation"><Controller name="filterDesignations" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Designation" options={designationOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Status" options={EMPLOYEE_STATUS_OPTIONS} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Role"><Controller name="filterRoles" control={filterFormMethods.control} render={({ field }) => (<UiSelect isMulti placeholder="Any Role" options={roleOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>
    </>
  );
};

export default EmployeesListing;