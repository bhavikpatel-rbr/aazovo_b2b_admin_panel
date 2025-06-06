// src/views/your-path/EmployeesListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react"; // Added useEffect
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate will be replaced by drawer logic for add/edit
import cloneDeep from "lodash/cloneDeep";
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from "react-hook-form"; // Added
import { zodResolver } from "@hookform/resolvers/zod"; // Added
import { z } from "zod"; // Added

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
import {
  Card,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
} from "@/components/ui"; // Added Drawer, Form, FormItem, UiSelect, Textarea

// Icons
import {
  TbPencil,
  TbDotsVertical,
  TbEye,
  TbShare,
  TbChecks,
  TbSearch,
  TbFilter,
  TbCloudUpload,
  TbPlus,
  TbUserCircle,
  TbMail,
  TbPhone,
  TbBuildingSkyscraper,
  TbBriefcase,
  TbCalendar,
  TbUsers,
  TbTrash,
  TbKey,
  TbReload,
  TbUserSquareRounded,
  TbUserBolt,
  TbUserExclamation,
  TbUserScreen,
  TbUserShare,
  TbBrandWhatsapp,
  TbUser,
  TbBell,
  TbActivity,
  TbCalendarEvent,
  TbDownload,
  TbTagStarred, // Additional icons for form
} from "react-icons/tb";
import DatePicker from "@/components/ui/DatePicker"; // Added DatePicker for date selection
import { Select } from "@/components/ui/Select"; // Added Select for dropdowns
// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { BsThreeDotsVertical } from "react-icons/bs";
import dayjs from "dayjs";

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
  // Add other fields if needed for forms, e.g., joiningDate, address, etc.
  joiningDate?: Date | null;
  bio?: string | null;
};
// --- End Item Type ---

// --- Constants ---
const EMPLOYEE_STATUS_OPTIONS: { value: EmployeeStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];
const employeeStatusValues = EMPLOYEE_STATUS_OPTIONS.map((s) => s.value) as [
  EmployeeStatus,
  ...EmployeeStatus[]
];

const employeeStatusColor: Record<EmployeeItem["status"], string> = {
  active: "bg-emerald-500",
  inactive: "bg-gray-500",
  on_leave: "bg-amber-500",
  terminated: "bg-red-500",
};

// --- Zod Schema for Add/Edit Employee Form ---
const employeeFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100),
  email: z
    .string()
    .email("Invalid email address.")
    .min(1, "Email is required."),
  mobile: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || /^\+?[1-9]\d{1,14}$/.test(val), {
      message: "Invalid phone number format.",
    }),
  department: z.string().min(1, "Department is required.").max(100),
  designation: z.string().min(1, "Designation is required.").max(100),
  status: z.enum(employeeStatusValues),
  roles: z.array(z.string()).min(1, "At least one role is required."), // Assuming roles are strings for simplicity
  // Add more fields as needed for the form
  joiningDate: z.date().nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  // For add new, password might be here. For edit, it's often separate.
  // password: z.string().min(8, "Password must be at least 8 characters").optional(), // Only for add
});
type EmployeeFormData = z.infer<typeof employeeFormSchema>;

// --- Zod Schema for Filter Form ---
const employeeFilterFormSchema = z.object({
  filterDepartments: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterDesignations: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatuses: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterRoles: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type EmployeeFilterFormData = z.infer<typeof employeeFilterFormSchema>;

// --- Initial Dummy Data (extended slightly for form example) ---
const initialDummyEmployees: EmployeeItem[] = [
  {
    id: "EMP001",
    status: "active",
    name: "Alice Wonderland",
    email: "alice.w@company.com",
    mobile: "+1-555-1001",
    department: "Engineering",
    designation: "Software Engineer II",
    roles: ["Developer", "Code Reviewer"],
    avatar: "/img/avatars/thumb-1.jpg",
    createdAt: new Date(2022, 5, 15),
    joiningDate: new Date(2022, 5, 15),
    bio: "Loves coding and tea parties.",
  },
  {
    id: "EMP002",
    status: "active",
    name: "Bob The Builder",
    email: "bob.b@company.com",
    mobile: "+1-555-1002",
    department: "Marketing",
    designation: "Marketing Manager",
    roles: ["Manager", "Campaign Planner"],
    avatar: "/img/avatars/thumb-2.jpg",
    createdAt: new Date(2021, 8, 1),
    joiningDate: new Date(2021, 8, 1),
  },
  {
    id: "EMP003",
    status: "on_leave",
    name: "Charlie Chaplin",
    email: "charlie.c@company.com",
    mobile: null,
    department: "Sales",
    designation: "Sales Representative",
    roles: ["Sales Rep"],
    avatar: "/img/avatars/thumb-3.jpg",
    createdAt: new Date(2022, 11, 10),
    joiningDate: new Date(2022, 11, 10),
  },
  // ... Add more employees from your original list
];
// --- End Constants ---

// --- Reusable ActionColumn, EmployeeTable, EmployeeSearch, EmployeeSelectedFooter (mostly unchanged, minor prop adjustments if needed) ---
// ActionColumn definition remains the same from your example.
// --- Reusable ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onDelete,
  onChangeStatus,
  onViewDetail,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: () => void;
  onViewDetail: () => void;
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
      <Tooltip title="Change Password">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
        >
          <TbKey />
        </div>
      </Tooltip>
      <Dropdown renderTitle={<BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
        <Dropdown.Item className="flex items-center gap-2"><TbMail size={18} /> <span className="text-xs"> Send Email</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbBrandWhatsapp size={18} /> <span className="text-xs">Send on Whatsapp</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbBell size={18} /> <span className="text-xs">Add as Notification</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbUser size={18} /> <span className="text-xs">Assign to Task</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbTagStarred size={18} /> <span className="text-xs">Add to Active</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbCalendarEvent size={18} /> <span className="text-xs">Schedule Meeting</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbActivity size={18} /> <span className="text-xs">View Activity Log</span></Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2"><TbDownload size={18} /> <span className="text-xs">Download Documents</span></Dropdown.Item>
      </Dropdown>
    </div>
  );
};
// EmployeeTable definition remains the same.
// --- EmployeeTable Component ---
const EmployeeTable = ({
  columns,
  data,
  loading,
  pagingData,
  selectedEmployees,
  onPaginationChange,
  onSelectChange,
  onSort,
  onRowSelect,
  onAllRowSelect,
}: {
  columns: ColumnDef<EmployeeItem>[];
  data: EmployeeItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedEmployees: EmployeeItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: EmployeeItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<EmployeeItem>[]) => void;
}) => {
  return (
    <DataTable
      selectable
      columns={columns}
      data={data}
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedEmployees.some((selected) => selected.id === row.id)
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
  );
};
// EmployeeSearch definition remains the same.
// --- EmployeeSearch Component ---
type EmployeeSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const EmployeeSearch = React.forwardRef<HTMLInputElement, EmployeeSearchProps>(
  ({ onInputChange }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        placeholder="Quick Search..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
      />
    );
  }
);
EmployeeSearch.displayName = "EmployeeSearch";
// --- End EmployeeSearch ---
// EmployeeSelected definition remains the same.
// --- EmployeeSelected Component ---
const EmployeeSelected = ({
  selectedEmployees,
  setSelectedEmployees,
  onDeleteSelected,
}: {
  selectedEmployees: EmployeeItem[];
  setSelectedEmployees: React.Dispatch<React.SetStateAction<EmployeeItem[]>>;
  onDeleteSelected: () => void;
}) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
  };

  if (selectedEmployees.length === 0) return null;

  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedEmployees.length}</span>
              <span>
                Employee
                {selectedEmployees.length > 1 ? "s" : ""} selected
              </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
            {/* Add other bulk actions like "Change Status", "Assign Role" */}
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedEmployees.length} Employee${selectedEmployees.length > 1 ? "s" : ""
          }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected employee
          {selectedEmployees.length > 1 ? "s" : ""}? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </>
  );
};
// --- End EmployeeSelected ---
// DetailViewDialog and ChangePasswordDialog remain the same.
// --- Detail/Password Change Dialogs (Example placeholders) ---
// --- Detail/Password Change Dialogs (Example placeholders) ---
const EmployeeDetailViewDialog = ({
  isOpen,
  onClose,
  employee,
}: {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeItem | null;
}) => {
  if (!employee) return null;
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      width={600}
    >
      <h5 className="mb-4">Employee Details: {employee.name}</h5>
      {/* Display employee details here */}
      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">
        {JSON.stringify(employee, null, 2)}
      </pre>
      <div className="text-right mt-6">
        <Button variant="solid" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};

const ChangePasswordDialog = ({
  isOpen,
  onClose,
  employee,
}: {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeItem | null;
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const handlePasswordChange = () => {
    if (!employee) return;
    if (newPassword !== confirmPassword || newPassword.length < 8) {
      toast.push(
        <Notification title="Password Error" type="danger">
          Passwords do not match or are too short.
        </Notification>
      );
      return;
    }
    setIsChanging(true);
    console.log(`Changing password for ${employee.email} to ${newPassword}`);
    // Simulate API call
    setTimeout(() => {
      toast.push(
        <Notification
          title="Password Changed"
          type="success"
        >{`Password for ${employee.name} updated.`}</Notification>
      );
      setIsChanging(false);
      onClose();
      setNewPassword("");
      setConfirmPassword("");
    }, 1000);
  };

  // Reset fields when dialog closes or employee changes
  React.useEffect(() => {
    if (!isOpen) {
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  if (!employee) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onRequestClose={onClose}
      width={400}
    >
      <h5 className="mb-4">Change Password for {employee.name}</h5>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">New Password</label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Confirm New Password
        </label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <div className="text-right mt-6">
        <Button
          size="sm"
          className="mr-2"
          onClick={onClose}
          disabled={isChanging}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          variant="solid"
          onClick={handlePasswordChange}
          loading={isChanging}
        >
          Change Password
        </Button>
      </div>
    </Dialog>
  );
};
// --- End Dialogs ---

// --- Modified EmployeeTableTools ---
const EmployeeTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <EmployeeSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Tooltip title="Clear Filters">
        <Button icon={<TbReload />} onClick={() => onClearFilters()} />
      </Tooltip>
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

// CSV Export for Employees (Adapted from Countries)
const CSV_HEADERS_EMPLOYEE = [
  "ID",
  "Name",
  "Email",
  "Mobile",
  "Department",
  "Designation",
  "Roles",
  "Status",
  "Joining Date",
  "Created At",
];
type EmployeeExportItem = Omit<
  EmployeeItem,
  "roles" | "createdAt" | "joiningDate"
> & { rolesCsv: string; createdAtCsv: string; joiningDateCsv?: string };

function exportToCsvEmployees(filename: string, rows: EmployeeItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: EmployeeExportItem[] = rows.map((row) => ({
    ...row,
    rolesCsv: row.roles.join(", "),
    joiningDateCsv: row.joiningDate
      ? new Date(row.joiningDate).toLocaleDateString()
      : "N/A",
    createdAtCsv: new Date(row.createdAt).toLocaleDateString(),
  }));
  const csvKeysEmployeeExport: (keyof EmployeeExportItem)[] = [
    "id",
    "name",
    "email",
    "mobile",
    "department",
    "designation",
    "rolesCsv",
    "status",
    "joiningDateCsv",
    "createdAtCsv",
  ];
  // ... (rest of CSV export logic from Countries.tsx, adapting headers and keys)
  const separator = ",";
  const csvContent =
    CSV_HEADERS_EMPLOYEE.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return csvKeysEmployeeExport
          .map((k) => {
            let cell = row[k];
            if (cell === null || cell === undefined) cell = "";
            else cell = String(cell).replace(/"/g, '""');
            if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator);
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

// --- Main EmployeesListing Component ---
const EmployeesListing = () => {
  const navigate = useNavigate('hr-employees/employees/add'); // Not used for add/edit if using drawers

  // --- State ---
  const [employees, setEmployees] = useState<EmployeeItem[]>(
    initialDummyEmployees
  );
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<
    "idle" | "idle"
  >("idle"); // Mimicking Redux status

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeItem | null>(
    null
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EmployeeItem | null>(null); // Renamed from countryToDelete

  const [filterCriteria, setFilterCriteria] = useState<EmployeeFilterFormData>(
    {}
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeItem[]>(
    []
  ); // Renamed from selectedItems

  // Detail/Password Dialog States (from original component)
  const [detailViewOpen, setDetailViewOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [currentItemForDialog, setCurrentItemForDialog] =
    useState<EmployeeItem | null>(null);

  // React Hook Form instances
  const addFormMethods = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    mode: "onChange",
  });
  const editFormMethods = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    mode: "onChange",
  });
  const filterFormMethods = useForm<EmployeeFilterFormData>({
    resolver: zodResolver(employeeFilterFormSchema),
    defaultValues: filterCriteria,
  });

  // --- CRUD and Drawer Handlers ---
  const openAddDrawer = () => {
    addFormMethods.reset({
      name: "",
      email: "",
      mobile: "",
      department: "",
      designation: "",
      status: "active",
      roles: [],
      joiningDate: null,
      bio: "",
    });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset();
    setIsAddDrawerOpen(false);
  };
  const onAddEmployeeSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    setMasterLoadingStatus("idle");
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API
    const newEmployee: EmployeeItem = {
      id: `EMP${Date.now()}`,
      ...data,
      avatar: null, // Default avatar or handle upload
      createdAt: new Date(),
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
    };
    setEmployees((prev) => [newEmployee, ...prev]);
    toast.push(
      <Notification
        title="Employee Added"
        type="success"
      >{`Employee "${data.name}" added.`}</Notification>
    );
    closeAddDrawer();
    setIsSubmitting(false);
    setMasterLoadingStatus("idle");
  };

  const openEditPage = (employee: EmployeeItem) => {
    console.log('test');
  };
  const closeEditDrawer = () => {
    setEditingEmployee(null);
    editFormMethods.reset();
    setIsEditDrawerOpen(false);
  };
  const onEditEmployeeSubmit = async (data: EmployeeFormData) => {
    if (!editingEmployee) return;
    setIsSubmitting(true);
    setMasterLoadingStatus("idle");
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API
    const updatedEmployee: EmployeeItem = {
      ...editingEmployee,
      ...data,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
      // Avatar update would be handled separately
    };
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === editingEmployee.id ? updatedEmployee : emp))
    );
    toast.push(
      <Notification
        title="Employee Updated"
        type="success"
      >{`Employee "${data.name}" updated.`}</Notification>
    );
    closeEditDrawer();
    setIsSubmitting(false);
    setMasterLoadingStatus("idle");
  };

  const handleDeleteClick = (employee: EmployeeItem) => {
    setItemToDelete(employee);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    // Adapted from your original handleDelete
    if (!itemToDelete) return;
    setIsDeleting(true);
    setMasterLoadingStatus("idle");
    setSingleDeleteConfirmOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setEmployees((current) => current.filter((e) => e.id !== itemToDelete.id));
    setSelectedEmployees((prev) =>
      prev.filter((e) => e.id !== itemToDelete.id)
    );
    toast.push(
      <Notification
        title="Employee Deleted"
        type="success"
      >{`Employee '${itemToDelete.name}' deleted.`}</Notification>
    );
    setIsDeleting(false);
    setMasterLoadingStatus("idle");
    setItemToDelete(null);
  };

  const handleDeleteSelected = async () => {
    // Adapted from your original
    if (selectedEmployees.length === 0) {
      toast.push(
        <Notification title="No Selection" type="info">
          Please select employees.
        </Notification>
      );
      return;
    }
    setIsDeleting(true);
    setMasterLoadingStatus("idle");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const selectedIds = new Set(selectedEmployees.map((e) => e.id));
    setEmployees((current) => current.filter((e) => !selectedIds.has(e.id)));
    toast.push(
      <Notification
        title="Employees Deleted"
        type="success"
      >{`${selectedIds.size} employee(s) deleted.`}</Notification>
    );
    setSelectedEmployees([]);
    setIsDeleting(false);
    setMasterLoadingStatus("idle");
  };

  // --- Filter Drawer Handlers ---
  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: EmployeeFilterFormData) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = {
      filterDepartments: [],
      filterDesignations: [],
      filterStatuses: [],
      filterRoles: [],
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  };

  // --- Data Processing (Filtering, Sorting, Pagination from original) ---
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData = cloneDeep(employees); // Use local employees state

    // Apply Filters from filterCriteria
    if (filterCriteria.filterDepartments?.length) {
      const v = filterCriteria.filterDepartments.map((o) =>
        o.value.toLowerCase()
      );
      processedData = processedData.filter((e) =>
        v.includes(e.department.toLowerCase())
      );
    }
    if (filterCriteria.filterDesignations?.length) {
      const v = filterCriteria.filterDesignations.map((o) =>
        o.value.toLowerCase()
      );
      processedData = processedData.filter((e) =>
        v.includes(e.designation.toLowerCase())
      );
    }
    if (filterCriteria.filterStatuses?.length) {
      const v = filterCriteria.filterStatuses.map((o) => o.value);
      processedData = processedData.filter((e) => v.includes(e.status));
    }
    if (filterCriteria.filterRoles?.length) {
      const v = filterCriteria.filterRoles.map((o) => o.value.toLowerCase());
      processedData = processedData.filter((e) =>
        e.roles.some((role) => v.includes(role.toLowerCase()))
      );
    }

    // Apply Global Search from tableData.query (from original component)
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      processedData = processedData.filter(
        (e) =>
          e.id.toLowerCase().includes(query) ||
          e.name.toLowerCase().includes(query) ||
          e.email.toLowerCase().includes(query) ||
          (e.mobile?.toLowerCase().includes(query) ?? false) ||
          e.department.toLowerCase().includes(query) ||
          e.designation.toLowerCase().includes(query) ||
          e.roles.some((role) => role.toLowerCase().includes(query)) ||
          e.status.toLowerCase().includes(query)
      );
    }
    // Apply Sorting (from original component)
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      /* ... your existing sort logic ... */
      processedData.sort((a, b) => {
        let aVal = a[key as keyof EmployeeItem] as any;
        let bVal = b[key as keyof EmployeeItem] as any;
        if (key === "createdAt" || key === "joiningDate") {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else if (key === "roles") {
          aVal = a.roles.join(", ");
          bVal = b.roles.join(", ");
        } // Simple role sort

        if (typeof aVal === "number" && typeof bVal === "number")
          return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }

    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return {
      pageData: dataForPage,
      total: currentTotal,
      allFilteredAndSortedData: dataToExport,
    };
  }, [employees, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsvEmployees(
      "employees_export.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
  };

  // --- Table Interaction Handlers (from original, ensure setSelectedEmployees is used) ---
  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
      setSelectedEmployees([]);
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback((checked: boolean, row: EmployeeItem) => {
    setSelectedEmployees((prev) =>
      checked
        ? prev.some((e) => e.id === row.id)
          ? prev
          : [...prev, row]
        : prev.filter((e) => e.id !== row.id)
    );
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<EmployeeItem>[]) => {
      const originals = currentRows.map((r) => r.original);
      if (checked)
        setSelectedEmployees((prev) => {
          const oldIds = new Set(prev.map((i) => i.id));
          return [...prev, ...originals.filter((o) => !oldIds.has(o.id))];
        });
      else {
        const currentIds = new Set(originals.map((o) => o.id));
        setSelectedEmployees((prev) =>
          prev.filter((i) => !currentIds.has(i.id))
        );
      }
    },
    []
  );

  // --- Dialog Handlers (from original) ---
  const handleViewDetails = useCallback((employee: EmployeeItem) => {
    setCurrentItemForDialog(employee);
    setDetailViewOpen(true);
  }, []);
  const handleCloseDetailView = useCallback(() => {
    setDetailViewOpen(false);
    setCurrentItemForDialog(null);
  }, []);
  const handleChangePassword = useCallback((employee: EmployeeItem) => {
    setCurrentItemForDialog(employee);
    setChangePwdOpen(true);
  }, []);
  const handleCloseChangePwd = useCallback(() => {
    setChangePwdOpen(false);
    setCurrentItemForDialog(null);
  }, []);

  // --- Define Columns (from original, ensure ActionColumn uses new handlers) ---
  const columns: ColumnDef<EmployeeItem>[] = useMemo(
    () => [
      {
        header: "Status",
        accessorKey: "status",
        /* ... (keep original cell) ... */ cell: (props) => {
          const { status } = props.row.original;
          const displayStatus = status
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          return (
            <Tag
              className={`${employeeStatusColor[status]} text-white capitalize`}
            >
              {displayStatus}
            </Tag>
          );
        },
      },
      {
        header: "Name",
        accessorKey: "name",
        /* ... (keep original cell) ... */ cell: (props) => {
          const { name, email, mobile, avatar } = props.row.original;
          return (
            <div className="flex items-center">
              <Avatar
                size={28}
                shape="circle"
                src={avatar}
                icon={<TbUserCircle />}
              >
                {!avatar ? name.charAt(0).toUpperCase() : ""}
              </Avatar>
              <div className="ml-2 rtl:mr-2">
                <span className="font-semibold">{name}</span>
                <div className="text-xs text-gray-500">{email}</div>
                <div className="text-xs text-gray-500">{mobile}</div>
              </div>
            </div>
          );
        },
      },
      { header: "Designation", accessorKey: "designation" },
      { header: "Department", accessorKey: "department", size: 200 },
      {
        header: "Roles",
        accessorKey: "roles",
        cell: (props) => (
          <div className="flex flex-wrap gap-1 text-xs">
            {props.row.original.roles.map((role) => (
              <Tag
                key={role}
                className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100"
              >
                {role}
              </Tag>
            ))}
          </div>
        ),
      },
      {
        header: "Joined At",
        accessorKey: "joiningDate",
        size:200,
        cell: (props) =>
          props.getValue() ? <span className="text-xs"> {dayjs(props.getValue()).format("D MMM YYYY, h:mm A")}</span> : '-'
      }, // Added Joining Date
      {
        header: "Action",
        id: "action",
        size: 120,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onView={() => handleViewDetails(props.row.original)}
            onEdit={() => openEditPage(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onChangePassword={() => handleChangePassword(props.row.original)}
          />
        ),
      },
    ],
    [handleViewDetails, handleChangePassword, openEditPage, handleDeleteClick]
  ); // Added openEditPage, handleDeleteClick to deps

  // Options for Filter Dropdowns
  const departmentOptions = useMemo(() => {
    const unique = new Set(employees.map((e) => e.department));
    return Array.from(unique).map((d) => ({ value: d, label: d }));
  }, [employees]);
  const designationOptions = useMemo(() => {
    const unique = new Set(employees.map((e) => e.designation));
    return Array.from(unique).map((d) => ({ value: d, label: d }));
  }, [employees]);
  const roleOptions = useMemo(() => {
    const allRoles = employees.flatMap((e) => e.roles);
    const unique = new Set(allRoles);
    return Array.from(unique).map((r) => ({ value: r, label: r }));
  }, [employees]);
  const statusOptionsForFilter = useMemo(
    () =>
      EMPLOYEE_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label })),
    []
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4">
            <h5 className="mb-4 lg:mb-0">Employees Listing</h5>
            {/* Modified "Add New" button to open drawer */}
            <Button variant="solid" icon={<TbPlus />} onClick={() => navigate('/hr-employees/employees/add')}>
              Add New
            </Button>
          </div>
          <div className="grid grid-cols-6 mb-4 gap-2">
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbUsers size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">879</h6>
                <span className="font-semibold text-xs">Total</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbUserSquareRounded size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">23</h6>
                <span className="font-semibold text-xs">This Month</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                <TbUserBolt size={24} />
              </div>
              <div>
                <h6 className="text-pink-500">34%</h6>
                <span className="font-semibold text-xs">Avg. Present</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbUserExclamation size={24} />
              </div>
              <div>
                <h6 className="text-orange-500">345</h6>
                <span className="font-semibold text-xs">Late Arrivals</span>
              </div>
            </Card>

            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300" >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbUserScreen size={24} />
              </div>
              <div>
                <h6 className="text-green-500">879</h6>
                <span className="font-semibold text-xs">Training Rate</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbUserShare size={24} />
              </div>
              <div>
                <h6 className="text-red-500">78</h6>
                <span className="font-semibold text-xs">Offboarding</span>
              </div>
            </Card>

          </div>
          <div className="mb-4">
            <EmployeeTableTools
              onClearFilters={onClearFilters}
              onSearchChange={handleSearchChange}
              onFilter={openFilterDrawer}
              onExport={handleExportData}
            />
          </div>
          <div className="flex-grow overflow-auto">
            <EmployeeTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
              }
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectedEmployees={selectedEmployees}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onRowSelect={handleRowSelect}
              onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <EmployeeSelected
        selectedEmployees={selectedEmployees}
        setSelectedEmployees={setSelectedEmployees}
        onDeleteSelected={handleDeleteSelected}
      />
      <EmployeeDetailViewDialog
        isOpen={detailViewOpen}
        onClose={handleCloseDetailView}
        employee={currentItemForDialog}
      />
      <ChangePasswordDialog
        isOpen={changePwdOpen}
        onClose={handleCloseChangePwd}
        employee={currentItemForDialog}
      />

      {/* Filter Drawer */}
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterEmployeeForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterEmployeeForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Department">
            <Controller
              name="filterDepartments"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Any Department"
                  options={departmentOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Designation">
            <Controller
              name="filterDesignations"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Any Designation"
                  options={designationOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Status">
            <Controller
              name="filterStatuses"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Any Status"
                  options={statusOptionsForFilter}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Role">
            <Controller
              name="filterRoles"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Any Role"
                  options={roleOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Single Delete Confirmation */}
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Employee"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete employee "
          <strong>{itemToDelete?.name}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default EmployeesListing;

// Helper function (if not globally available)
// function classNames(...classes: (string | boolean | undefined)[]) {
//     return classes.filter(Boolean).join(' ');
// }
