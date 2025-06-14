// src/views/your-path/RolesListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select"; // RHF-compatible Select
import Radio from '@/components/ui/Radio';
import { Card, Drawer, Form, FormItem, Input } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbEye,
  TbShieldLock,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbUserShield,
  TbLockAccess,
  TbFileDescription,
  TbReload,
  TbUsersGroup,
  TbUserCheck,
  TbUserCancel,
  TbBuilding,
  TbHierarchy2,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Redux Imports (Placeholder) ---
// In a real app, these would come from your actual Redux setup
import { useAppDispatch } from "@/reduxtool/store"; // Assuming you have this hook
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Assuming this selector exists
import {
    getRolesAction,
    addRolesAction,
    editRolesAction,
    deleteRolesAction,
    deleteAllRolessAction,
    submitExportReasonAction
} from "@/reduxtool/master/middleware"; // Assuming these actions are created

// --- Define Item Type ---
export type RoleItem = {
  id: string; // Using name as ID
  display_name: string;
  name: string;
  description: string;
  employee: boolean;
  designation	: boolean;
  department: boolean;
  display_role: boolean;
  created_at: string;
  updated_at: string;
  updated_by_user?: {
      name: string;
      roles: { display_name: string }[];
  };
};
// --- End Item Type ---

// --- Zod Schema for Add/Edit Role Form ---
const roleFormSchema = z.object({
  display_name: z.string().min(1, "Display Name is required.").max(100),
  name: z
    .string()
    .min(1, "Role Name (system key) is required.")
    .max(50)
    .regex(
      /^[a-z0-9_]+$/,
      "Role Name can only contain lowercase letters, numbers, and underscores."
    ),
  description: z.string().min(1, "Description is required.").max(500),
  // employee: z.boolean().default(false),
  // designation	: z.boolean().default(false),
  // department: z.boolean().default(false),
  // display_role: z.boolean().default(false),
});
type RoleFormData = z.infer<typeof roleFormSchema>;

// --- Zod Schema for Filter Form ---
const roleFilterFormSchema = z.object({
  filterDisplayName: z.string().optional(),
});
type RoleFilterFormData = z.infer<typeof roleFilterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Dummy Data (simulating a Redux store response) ---
// const initialDummyRoles = {
//     data: [
//         {
//           id: "admin",
//           display_name: "Administrator",
//           name: "admin",
//           description: "Full access to all system features and settings.",
//           created_at: new Date(2022, 0, 1).toISOString(),
//           updated_at: new Date(2023, 4, 28).toISOString(),
//           employee: true,
//           designation	: true,
//           department: true,
//           display_role: true,
//           updated_by_user: { name: "Tushar Joshi", roles: [{ display_name: "System Admin" }] },
//         },
//         {
//           id: "editor",
//           display_name: "Content Editor",
//           name: "editor",
//           description: "Can create, edit, and publish content.",
//           created_at: new Date(2022, 1, 15).toISOString(),
//           updated_at: new Date(2023, 3, 1).toISOString(),
//           employee: false,
//           designation	: true,
//           department: false,
//           display_role: true,
//           updated_by_user: { name: "Jane Doe", roles: [{ display_name: "Lead Editor" }] },
//         },
//         {
//           id: "support_agent",
//           display_name: "Support Agent",
//           name: "support_agent",
//           description: "Can view and respond to customer support tickets.",
//           created_at: new Date(2022, 3, 10).toISOString(),
//           updated_at: new Date(2023, 5, 20).toISOString(),
//           employee: true,
//           designation	: false,
//           department: true,
//           display_role: false,
//           updated_by_user: { name: "John Smith", roles: [{ display_name: "Support Lead" }] },
//         },
//     ],
//     counts: {
//         total: 3,
//         employeeAccess: 2,
//         designationAccess: 2,
//         departmentAccess: 2,
//         roleAccess: 2,
//     }
// };

// --- ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
}) => {
  const navigate = useNavigate();
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Permissions">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={() => navigate("/access-control/permission")}
        >
          <TbShieldLock />
        </div>
      </Tooltip>
      <Tooltip title="Edit">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          )}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
    </div>
  );
};


// --- RoleSearch Component ---
type RoleSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const RoleSearch = React.forwardRef<HTMLInputElement, RoleSearchProps>(
  ({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
RoleSearch.display_name = "RoleSearch";

// --- RoleTableTools Component ---
const RoleTableTools = ({
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
      <RoleSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button
        title="Clear Filters"
        icon={<TbReload />}
        onClick={onClearFilters}
      />
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

// --- RoleSelectedFooter Component ---
type RoleSelectedFooterProps = {
  selectedItems: RoleItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
};
const RoleSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: RoleSelectedFooterProps) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmOpen(true);
  const handleCancelDelete = () => setDeleteConfirmOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmOpen(false);
  };

  if (selectedItems.length === 0) return null;
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
              <span className="heading-text">{selectedItems.length}</span>
              <span>Role{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-600 hover:text-red-500"
            onClick={handleDeleteClick}
            loading={isDeleting}
          >
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Role${selectedItems.length > 1 ? "s" : ""
          }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the selected role
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- CSV Exporter Utility ---
const CSV_HEADERS_ROLE = [
  "ID", "Display Name", "Role Name (System)", "Description",
  "Has Employee Access", "Has Designation Access", "Has Department Access", "Has Role Access",
  "Created At", "Updated By", "Updated Role", "Updated At",
];
type RoleExportItem = Omit<RoleItem, "created_at" | "updated_at"> & {
    created_at_formatted: string;
    updated_at_formatted: string;
    updated_by_name: string;
    updated_by_role: string;
};

function exportToCsvRoles(filename: string, rows: RoleItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const preparedRows: RoleExportItem[] = rows.map((row) => ({
    ...row,
    employee: row.employee ? 'Yes' : 'No',
    designation	: row.designation	 ? 'Yes' : 'No',
    department: row.department ? 'Yes' : 'No',
    display_role: row.display_role ? 'Yes' : 'No',
    updated_by_name: row.updated_by_user?.name || "N/A",
    updated_by_role: row.updated_by_user?.roles[0]?.display_name || "N/A",
    created_at_formatted: new Date(row.created_at).toLocaleString(),
    updated_at_formatted: new Date(row.updated_at).toLocaleString(),
  }));

  const csvKeysRoleExport: (keyof RoleExportItem)[] = [
    "id", "display_name", "name", "description",
    "employee", "designation", "department", "display_role",
    "created_at_formatted", "updated_by_name", "updated_by_role", "updated_at_formatted"
  ];
  const separator = ",";
  const csvContent =
    CSV_HEADERS_ROLE.join(separator) +
    "\n" +
    preparedRows
      .map((row) => {
        return csvKeysRoleExport
          .map((k) => {
            let cell = row[k as keyof RoleExportItem];
            cell = cell === null || cell === undefined ? "" : String(cell);
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
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

// --- Main RolesListing Component ---
const RolesListing = () => {
  const pageTitle = "System Roles & Permissions";
  const dispatch = useAppDispatch();

  // Mock Redux state
  const {
      Roles = [], // Use dummy data as default
      status: masterLoading,
  } = useSelector(masterSelector); // In a real app, this is where you'd select from the store
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isPermissionsDrawerOpen, setIsPermissionsDrawerOpen] = useState(false);
  const [currentRoleForPermissions, setCurrentRoleForPermissions] = useState<RoleItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RoleItem | null>(null);

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  const [filterCriteria, setFilterCriteria] = useState<RoleFilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<RoleItem[]>([]);

  const tableLoading = masterLoading === true || masterLoading === "loading" || isSubmitting || isDeleting;

  // Fetch data on mount
  useEffect(() => {
    dispatch(getRolesAction()); // In a real app, you would dispatch this
  }, [dispatch]);

  // Handle Redux errors
  // useEffect(() => {
  //   if (error) {
  //     toast.push(
  //       <Notification title="Error" type="danger">
  //         {error.message || "An error occurred"}
  //       </Notification>
  //     );
  //   }
  // }, [error]);

  const defaultFormValues: RoleFormData = {
    display_name: "", name: "", description: "",
    employee: false, designation	: false, department: false, display_role: false,
  };

  const addFormMethods = useForm<RoleFormData>({ resolver: zodResolver(roleFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const editFormMethods = useForm<RoleFormData>({ resolver: zodResolver(roleFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const filterFormMethods = useForm<RoleFilterFormData>({ resolver: zodResolver(roleFilterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), mode: "onChange" });


  // --- CRUD Handlers ---
  const openAddDrawer = () => {
    addFormMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => setIsAddDrawerOpen(false);

  const onAddRoleSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    // In real app, dispatch an action
    const resultAction = await dispatch(addRolesAction(data));
    // Simulating API call
    // await new Promise(res => setTimeout(res, 500));
    // const resultAction = { meta: { requestId: '123' }, type: 'master/addRole/fulfilled' }; // Mock success
    
    if (resultAction) {
        toast.push(<Notification title="Role Added" type="success">{`Role "${data.display_name}" added.`}</Notification>);
        closeAddDrawer();
        dispatch(getRolesAction());
    } else {
        toast.push(<Notification title="Add Failed" type="danger">{"Could not add role."}</Notification>);
    }
    setIsSubmitting(false);
  };

  const openEditDrawer = (role: RoleItem) => {
    setEditingRole(role);
    editFormMethods.reset({
      display_name: role.display_name,
      name: role.name,
      description: role.description,
      employee: role.employee,
      designation	: role.designation	,
      department: role.department,
      display_role: role.display_role,
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingRole(null);
    setIsEditDrawerOpen(false);
  };

  const onEditRoleSubmit = async (data: RoleFormData) => {
    if (!editingRole) return;
    setIsSubmitting(true);
    // In real app, dispatch an action
    const resultAction = await dispatch(editRolesAction({ id: editingRole.id, data }));
    // await new Promise(res => setTimeout(res, 500));
    // const resultAction = { meta: { requestId: '123' }, type: 'master/editRole/fulfilled' }; // Mock success
    // console.log(resultAction)
    if (resultAction) {
        toast.push(<Notification title="Role Updated" type="success">{`Role "${data.display_name}" updated.`}</Notification>);
        closeEditDrawer();
        dispatch(getRolesAction());
    } else {
        toast.push(<Notification title="Update Failed" type="danger">{"Could not update role."}</Notification>);
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (role: RoleItem) => {
    setItemToDelete(role);
    setSingleDeleteConfirmOpen(true);
  };

  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    // await dispatch(deleteRolesAction({ id: itemToDelete.id }));
    await new Promise(res => setTimeout(res, 500));
    toast.push(<Notification title="Role Deleted" type="success">{`Role "${itemToDelete.display_name}" deleted.`}</Notification>);
    dispatch(getRolesAction());
    setIsDeleting(false);
    setItemToDelete(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => item.id).join(",");
    // await dispatch(deleteAllRolessAction({ ids: idsToDelete }));
    await new Promise(res => setTimeout(res, 500));
    toast.push(<Notification title="Deletion Successful" type="success">{`${selectedItems.length} role(s) deleted.`}</Notification>);
    setSelectedItems([]);
    dispatch(getRolesAction());
    setIsDeleting(false);
  };

  // --- Permissions Drawer ---
  const handleViewPermissions = (role: RoleItem) => {
    setCurrentRoleForPermissions(role);
    setIsPermissionsDrawerOpen(true);
  };
  const closePermissionsDrawer = () => setIsPermissionsDrawerOpen(false);
  const onSavePermissions = async () => {
    toast.push(<Notification title="Permissions Updated (Simulated)" type="success" />);
    closePermissionsDrawer();
  };

  // --- Filter Drawer ---
  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: RoleFilterFormData) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    setFilterCriteria({});
    filterFormMethods.reset({});
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
  };

  // --- Table Interaction Handlers ---
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: RoleItem) => { setSelectedItems((prev) => checked ? [...prev, row] : prev.filter((item) => item.id !== row.id)); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<RoleItem>[]) => {
    const originals = currentRows.map((r) => r.original);
    if (checked) {
      const newItems = originals.filter(o => !selectedItems.some(s => s.id === o.id));
      setSelectedItems(prev => [...prev, ...newItems]);
    } else {
      const currentIds = new Set(originals.map((o) => o.id));
      setSelectedItems(prev => prev.filter(i => !currentIds.has(i.id)));
    }
  }, [selectedItems]);

  // --- Data Processing ---
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: RoleItem[] = cloneDeep(Roles || []);
    if (filterCriteria.filterDisplayName?.trim()) {
      const q = filterCriteria.filterDisplayName.toLowerCase().trim();
      processedData = processedData.filter(item => item.name.toLowerCase().includes(q));
    }
    if (tableData.query?.trim()) {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(q)));
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
        processedData.sort((a, b) => {
            const aVal = a[key as keyof RoleItem];
            const bVal = b[key as keyof RoleItem];
            if (key === 'created_at' || key === 'updated_at') {
                return order === 'asc' ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
            }
            return order === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
        });
    }
    const totalCount = processedData.length;
    const startIndex = (tableData.pageIndex - 1) * tableData.pageSize;
    return {
      pageData: processedData.slice(startIndex, startIndex + tableData.pageSize),
      total: totalCount,
      allFilteredAndSortedData: processedData,
    };
  }, [Roles, tableData, filterCriteria]);

  // --- Export Handlers ---
  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData.length) {
      toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const fileName = `system_roles_export_${new Date().toISOString().split('T')[0]}.csv`;
    await dispatch(submitExportReasonAction({ reason: data.reason, module: "Roles", file_name: fileName })).unwrap();
    // await new Promise(res => setTimeout(res, 500)); // Simulate API
    toast.push(
      <Notification title="Export Reason Submitted" type="success" />
    );
    exportToCsvRoles(fileName, allFilteredAndSortedData);
    // Optional:
    toast.push(
      <Notification title="Data Exported" type="success">
        Roles data exported.
      </Notification>
    );
    setIsExportReasonModalOpen(false);
    setIsSubmittingExportReason(false);
  };

  const columns: ColumnDef<RoleItem>[] = useMemo(
    () => [
      { header: "System Key", accessorKey: "name", enableSorting: true, size: 180 },
      { header: "Display Name", accessorKey: "display_name", enableSorting: true },
      {
        header: "Description",
        accessorKey: "description",
        cell: (props) => (
          <Tooltip title={props.row.original.description} wrapperClass="w-full">
            <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-sm">
              {props.row.original.description}
            </span>
          </Tooltip>
        ),
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        size: 180,
        cell: (props) => {
            const { updated_at, updated_by_user } = props.row.original;
            return (
                <div className="text-xs">
                    <span>{updated_by_user?.name || "N/A"}</span><br />
                    <b>{updated_by_user?.roles[0]?.display_name || "N/A"}</b><br />
                    <span>{new Date(updated_at).toLocaleDateString()}</span>
                </div>
            );
        },
      },
      {
        header: "Actions", id: "action", size: 120,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onViewDetail={() => handleViewPermissions(props.row.original)}
          />
        ),
      },
    ],
    []
  );

  const formDrawerConfig = [
    {
      type: 'add', title: 'Add New Role', isOpen: isAddDrawerOpen, closeFn: closeAddDrawer,
      formId: 'addRoleForm', methods: addFormMethods, onSubmit: onAddRoleSubmit,
      submitText: 'Save', submittingText: 'Saving...',
    },
    {
      type: 'edit', title: 'Edit Role', isOpen: isEditDrawerOpen, closeFn: closeEditDrawer,
      formId: 'editRoleForm', methods: editFormMethods, onSubmit: onEditRoleSubmit,
      submitText: 'Save', submittingText: 'Saving...',
    }
  ];

  const accessFields: { label: string; name: "employee" | "designation" | "department" | "display_role" }[] = [
    { label: "Employee", name: "employee" },
    { label: "Designation", name: "designation" },
    { label: "Department", name: "department" },
    { label: "Display Role", name: "display_role" },
  ];

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">{pageTitle}</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>
              Add New
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbUsersGroup size={24} /></div>
                  <div><h6 className="text-blue-500">{Roles?.counts?.total}</h6><span className="font-semibold text-xs">Total Roles</span></div>
              </Card>
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbUserCheck size={24} /></div>
                  <div><h6 className="text-green-500">{Roles?.counts?.employeeAccess}</h6><span className="font-semibold text-xs">Employee Access</span></div>
              </Card>
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbUserCancel size={24} /></div>
                  <div><h6 className="text-violet-500">{Roles?.counts?.designationAccess}</h6><span className="font-semibold text-xs">Designation Access</span></div>
              </Card>
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbBuilding size={24} /></div>
                  <div><h6 className="text-orange-500">{Roles?.counts?.departmentAccess}</h6><span className="font-semibold text-xs">Department Access</span></div>
              </Card>
              <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200">
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbHierarchy2 size={24} /></div>
                  <div><h6 className="text-red-500">{Roles?.counts?.roleAccess}</h6><span className="font-semibold text-xs">Role Access</span></div>
              </Card>
          </div>

          <RoleTableTools
            onClearFilters={onClearFilters}
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
          />
          <div className="mt-4 flex-grow overflow-auto">
            <DataTable
              selectable
              columns={columns}
              data={pageData}
              loading={tableLoading}
              pagingData={{ total, pageIndex: tableData.pageIndex, pageSize: tableData.pageSize }}
              checkboxChecked={(row) => selectedItems.some((item) => item.id === row.id)}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
              noData={!tableLoading && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <RoleSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />

      {/* --- Add/Edit Drawers --- */}
      {formDrawerConfig.map((drawer) => (
        <Drawer
          key={drawer.formId}
          title={drawer.title}
          isOpen={drawer.isOpen}
          onClose={drawer.closeFn}
          onRequestClose={drawer.closeFn}
          width={520}
          footer={
            <div className="text-right w-full">
              <Button size="sm" className="mr-2" onClick={drawer.closeFn} disabled={isSubmitting}>Cancel</Button>
              <Button size="sm" variant="solid" form={drawer.formId} type="submit" loading={isSubmitting} disabled={!drawer.methods.formState.isValid || isSubmitting}>
                {isSubmitting ? drawer.submittingText : drawer.submitText}
              </Button>
            </div>
          }
        >
        <Form
          id={drawer.formId}
          onSubmit={drawer.methods.handleSubmit(drawer.onSubmit as any)}
          className="flex flex-col gap-4"
        >
          {/* Display Name */}
          <FormItem
            label={
              <div>
                Display Name<span className="text-red-500"> *</span>
              </div>
            }
            invalid={!!drawer.methods.formState.errors.display_name}
            errorMessage={drawer.methods.formState.errors.display_name?.message as string}
          >
            <Controller
              name="display_name"
              control={drawer.methods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<TbUserShield />}
                  placeholder="e.g., Content Manager"
                />
              )}
            />
          </FormItem>

          {/* Role Name / System Key */}
          <FormItem
            label={
              <div>
                Role Name / System Key<span className="text-red-500"> *</span>
              </div>
            }
            invalid={!!drawer.methods.formState.errors.name}
            errorMessage={drawer.methods.formState.errors.name?.message as string}
          >
            <Controller
              name="name"
              control={drawer.methods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<TbLockAccess />}
                  placeholder="e.g., content_manager"
                  disabled={drawer.type === "edit"}
                />
              )}
            />
          </FormItem>

          {/* Description */}
          <FormItem
            label={
              <div>
                Description<span className="text-red-500"> *</span>
              </div>
            }
            invalid={!!drawer.methods.formState.errors.description}
            errorMessage={drawer.methods.formState.errors.description?.message as string}
          >
            <Controller
              name="description"
              control={drawer.methods.control}
              render={({ field }) => (
                <Input
                  textArea
                  {...field}
                  prefix={<TbFileDescription />}
                  placeholder="Briefly describe what this role can do."
                />
              )}
            />
          </FormItem>

          {/* Access Toggles */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            {accessFields.map(({ label, name }) => (
              <FormItem key={name} label={`${label} Access`} className="col-span-1">
                <Controller
                  name={name}
                  control={drawer.methods.control}
                  render={({ field }) => (
                    <Radio.Group value={field.value} onChange={(val) => field.onChange(val)}>
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                    </Radio.Group>
                  )}
                />
              </FormItem>
            ))}
          </div> */}

          {/* Audit Info - Only in edit mode */}
          {drawer.type === "edit" && editingRole && (
            <div className="w-full">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded mt-4 border">
                <div>
                  <b className="font-semibold text-primary">Latest Update:</b>
                  <p className="text-sm font-semibold mt-1">
                    {editingRole.updated_by_user?.name || "N/A"}
                  </p>
                  <p className="text-xs">
                    {editingRole.updated_by_user?.roles?.[0]?.display_name || "N/A"}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Created At:</span>{" "}
                  <span>
                    {editingRole.created_at
                      ? new Date(editingRole.created_at).toLocaleString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "N/A"}
                  </span>
                  <br />
                  <span className="font-semibold">Updated At:</span>{" "}
                  <span>
                    {editingRole.updated_at
                      ? new Date(editingRole.updated_at).toLocaleString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Form>
        </Drawer>
      ))}

      {/* --- Filter Drawer --- */}
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={
        <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button>
            <Button size="sm" variant="solid" form="filterRoleForm" type="submit">Apply</Button>
        </div>
      }>
        <Form id="filterRoleForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Display Name / Role Name">
            <Controller name="filterDisplayName" control={filterFormMethods.control} render={({ field }) => (<Input {...field} placeholder="Enter name to filter..." />)} />
          </FormItem>
        </Form>
      </Drawer>

      {/* --- Permissions Drawer --- */}
      <Drawer title={`Permissions for ${currentRoleForPermissions?.display_name || "Role"}`} isOpen={isPermissionsDrawerOpen} onClose={closePermissionsDrawer} onRequestClose={closePermissionsDrawer} width={700} footer={
        <div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closePermissionsDrawer}>Cancel</Button><Button size="sm" variant="solid" onClick={onSavePermissions}>Save Permissions</Button></div>
      }>
        <div className="p-4">
          <p>Configure permissions for the role: <strong>{currentRoleForPermissions?.display_name}</strong> (<code>{currentRoleForPermissions?.name}</code>)</p>
          <div className="mt-4 border p-4 rounded-md min-h-[200px] bg-gray-50 dark:bg-gray-700">
            <p className="text-gray-400 dark:text-gray-500">Permissions management UI would go here.</p>
          </div>
        </div>
      </Drawer>

      {/* --- Single Delete Confirmation --- */}
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Role"
        onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onConfirm={onConfirmSingleDelete} loading={isDeleting}>
        <p>Are you sure you want to delete role "<strong>{itemToDelete?.display_name}</strong>"?</p>
      </ConfirmDialog>
      
      {/* --- Export Reason Modal --- */}
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info" title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
        <Form id="exportRolesReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
            <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
                <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
            </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default RolesListing;