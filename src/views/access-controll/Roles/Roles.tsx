// src/views/your-path/RolesListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate replaced by drawer logic
import cloneDeep from "lodash/cloneDeep";
import classNames from "classnames";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Radio from '@/components/ui/Radio';
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
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Select as UiSelect,
} from "@/components/ui"; // Added Textarea, UiSelect

// Icons
import {
  TbPencil,
  TbEye,
  TbShieldLock,
  TbShare,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbUserShield,
  TbLockAccess,
  TbFileDescription,
  TbCalendarTime,
  TbReload, // Additional icons
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useNavigate } from "react-router-dom";

// --- Define Item Type ---
export type RoleItem = {
  id: string;
  displayName: string;
  roleName: string;
  description: string;
  addedDate: Date;
  isEmployee: boolean,
  isDesignation: boolean,
  isDepartment: boolean,
  isRole: boolean,
  // permissions?: string[]; // Keep for future, not in form for now
};
// --- End Item Type ---

// --- Zod Schema for Add/Edit Role Form ---
const roleFormSchema = z.object({
  displayName: z.string().min(1, "Display Name is required.").max(100),
  roleName: z
    .string()
    .min(1, "Role Name (system key) is required.")
    .max(50)
    .regex(
      /^[a-z0-9_]+$/,
      "Role Name can only contain lowercase letters, numbers, and underscores."
    ),
  description: z.string().min(1, "Description is required.").max(500),
  // addedDate is system-set
});
type RoleFormData = z.infer<typeof roleFormSchema>;

// --- Zod Schema for Filter Form ---
// For roles, filtering might be simpler, e.g., by parts of display name or role name.
// For now, let's keep it simple or allow search to handle most of it.
// If complex filtering is needed, define schema here.
const roleFilterFormSchema = z.object({
  filterDisplayName: z.string().optional(),
  // Add more filters if needed, e.g., filterByPermission: z.array(...).optional()
});
type RoleFilterFormData = z.infer<typeof roleFilterFormSchema>;

const initialDummyRoles: RoleItem[] = [
  {
    id: "admin",
    displayName: "Administrator",
    roleName: "admin",
    description: "Full access to all system features and settings.",
    addedDate: new Date(2022, 0, 1),
    isEmployee: true,
    isDesignation: true,
    isDepartment: true,
    isRole: true,
  },
  {
    id: "editor",
    displayName: "Content Editor",
    roleName: "editor",
    description: "Can create, edit, and publish content.",
    addedDate: new Date(2022, 1, 15),
    isEmployee: false,
    isDesignation: true,
    isDepartment: false,
    isRole: true,
  },
  {
    id: "support_agent",
    displayName: "Support Agent",
    roleName: "support_agent",
    description: "Can view and respond to customer support tickets.",
    addedDate: new Date(2022, 3, 10),
    isEmployee: true,
    isDesignation: false,
    isDepartment: true,
    isRole: false,
  },
  // Add more if needed...
];

// --- End Constants ---

// --- ActionColumn Component ---
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
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Permissions">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={() => navigate("/access-control/permission")}
        >
          <TbShieldLock />
        </div>
      </Tooltip>
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
    </div>
  );
};


// --- RoleSearch Component (Reused from your example) ---
type RoleSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const RoleSearch = React.forwardRef<HTMLInputElement, RoleSearchProps>(
  ({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
RoleSearch.displayName = "RoleSearch";

// --- RoleTableTools Component (Adapted) ---
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

// --- RoleSelectedFooter Component (Adapted from your example) ---
type RoleSelectedFooterProps = {
  selectedItems: RoleItem[];
  onDeleteSelected: () => void;
};
const RoleSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: RoleSelectedFooterProps) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
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
            onClick={() => setDeleteConfirmOpen(true)}
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
        onClose={() => setDeleteConfirmOpen(false)}
        onRequestClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteConfirmOpen(false);
        }}
      >
        <p>
          Are you sure you want to delete the selected role
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// CSV Export for Roles
const CSV_HEADERS_ROLE = [
  "ID",
  "Display Name",
  "Role Name (System)",
  "Description",
  "Date Added",
];
type RoleExportItem = Omit<RoleItem, "addedDate"> & { addedDateCsv: string };

function exportToCsvRoles(filename: string, rows: RoleItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: RoleExportItem[] = rows.map((row) => ({
    ...row,
    addedDateCsv: new Date(row.addedDate).toLocaleDateString(),
  }));
  const csvKeysRoleExport: (keyof RoleExportItem)[] = [
    "id",
    "displayName",
    "roleName",
    "description",
    "addedDateCsv",
  ];
  // ... (CSV export logic from previous examples) ...
  const separator = ",";
  const csvContent =
    CSV_HEADERS_ROLE.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return csvKeysRoleExport
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

// --- Main RolesListing Component ---
const RolesListing = () => {
  const pageTitle = "System Roles & Permissions"; // Or just "Roles Listing"

  const [roles, setRoles] = useState<RoleItem[]>(initialDummyRoles);
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<
    "idle" | "idle"
  >("idle");

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isPermissionsDrawerOpen, setIsPermissionsDrawerOpen] = useState(false); // For viewing/editing permissions
  const [currentRoleForPermissions, setCurrentRoleForPermissions] =
    useState<RoleItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RoleItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<RoleFilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<RoleItem[]>([]);

  const addFormMethods = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    mode: "onChange",
  });
  const editFormMethods = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    mode: "onChange",
  });
  const filterFormMethods = useForm<RoleFilterFormData>({
    resolver: zodResolver(roleFilterFormSchema),
    defaultValues: filterCriteria,
  });

  // --- CRUD Handlers ---
  const openAddDrawer = () => {
    addFormMethods.reset({ displayName: "", roleName: "", description: "" });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset();
    setIsAddDrawerOpen(false);
  };
  const onAddRoleSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    setMasterLoadingStatus("idle");
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Ensure roleName (which is used as ID here) is unique
    if (roles.some((r) => r.roleName === data.roleName)) {
      addFormMethods.setError("roleName", {
        type: "manual",
        message: "This Role Name (system key) already exists.",
      });
      setIsSubmitting(false);
      setMasterLoadingStatus("idle");
      return;
    }
    const newRole: RoleItem = {
      id: data.roleName,
      ...data,
      addedDate: new Date(),
    }; // Using roleName as ID
    setRoles((prev) => [newRole, ...prev]);
    toast.push(
      <Notification
        title="Role Added"
        type="success"
      >{`Role "${data.displayName}" added.`}</Notification>
    );
    closeAddDrawer();
    setIsSubmitting(false);
    setMasterLoadingStatus("idle");
  };

  const openEditDrawer = (role: RoleItem) => {
    setEditingRole(role);
    editFormMethods.reset({
      displayName: role.displayName,
      roleName: role.roleName,
      description: role.description,
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingRole(null);
    editFormMethods.reset();
    setIsEditDrawerOpen(false);
  };
  const onEditRoleSubmit = async (data: RoleFormData) => {
    if (!editingRole) return;
    setIsSubmitting(true);
    setMasterLoadingStatus("idle");
    await new Promise((resolve) => setTimeout(resolve, 500));
    // If roleName (ID) is editable and changed, check for uniqueness again (excluding current role)
    if (
      data.roleName !== editingRole.roleName &&
      roles.some((r) => r.roleName === data.roleName)
    ) {
      editFormMethods.setError("roleName", {
        type: "manual",
        message: "This Role Name (system key) already exists.",
      });
      setIsSubmitting(false);
      setMasterLoadingStatus("idle");
      return;
    }
    const updatedRole: RoleItem = {
      ...editingRole,
      ...data,
      id: data.roleName,
    }; // Update ID if roleName changed
    setRoles((prev) =>
      prev.map((r) => (r.id === editingRole.id ? updatedRole : r))
    );
    toast.push(
      <Notification
        title="Role Updated"
        type="success"
      >{`Role "${data.displayName}" updated.`}</Notification>
    );
    closeEditDrawer();
    setIsSubmitting(false);
    setMasterLoadingStatus("idle");
  };

  const handleDeleteClick = (role: RoleItem) => {
    setItemToDelete(role);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setMasterLoadingStatus("idle");
    setSingleDeleteConfirmOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRoles((prev) => prev.filter((r) => r.id !== itemToDelete!.id));
    setSelectedItems((prev) =>
      prev.filter((item) => item.id !== itemToDelete!.id)
    );
    toast.push(
      <Notification
        title="Role Deleted"
        type="success"
      >{`Role "${itemToDelete.displayName}" deleted.`}</Notification>
    );
    setIsDeleting(false);
    setMasterLoadingStatus("idle");
    setItemToDelete(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.push(
        <Notification title="No Selection" type="info">
          Please select roles to delete.
        </Notification>
      );
      return;
    }
    setIsDeleting(true);
    setMasterLoadingStatus("idle");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const idsToDelete = selectedItems.map((item) => item.id);
    setRoles((prev) => prev.filter((r) => !idsToDelete.includes(r.id)));
    toast.push(
      <Notification
        title="Deletion Successful"
        type="success"
      >{`${selectedItems.length} role(s) deleted.`}</Notification>
    );
    setSelectedItems([]);
    setIsDeleting(false);
    setMasterLoadingStatus("idle");
  };

  const handleViewPermissions = (role: RoleItem) => {
    setCurrentRoleForPermissions(role);
    setIsPermissionsDrawerOpen(true);
    // In a real app, you might fetch permissions for this role here
    console.log("Viewing/Editing permissions for:", role.displayName);
  };
  const closePermissionsDrawer = () => {
    setIsPermissionsDrawerOpen(false);
    setCurrentRoleForPermissions(null);
  };
  const onSavePermissions = async (/* permissionsData: any */) => {
    // Placeholder for saving permissions
    // Simulate saving
    toast.push(
      <Notification title="Permissions Updated (Simulated)" type="success" />
    );
    closePermissionsDrawer();
  };

  // --- Filter Drawer Handlers ---
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
    const defaultFilters = { filterDisplayName: "" };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  };

  // --- Table Interaction Handlers (Reused) ---
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
      setSelectedItems([]);
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
  const handleRowSelect = useCallback((checked: boolean, row: RoleItem) => {
    setSelectedItems((prev) =>
      checked
        ? prev.some((item) => item.id === row.id)
          ? prev
          : [...prev, row]
        : prev.filter((item) => item.id !== row.id)
    );
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<RoleItem>[]) => {
      const originals = currentRows.map((r) => r.original);
      if (checked)
        setSelectedItems((prev) => {
          const oldIds = new Set(prev.map((i) => i.id));
          return [...prev, ...originals.filter((o) => !oldIds.has(o.id))];
        });
      else {
        const currentIds = new Set(originals.map((o) => o.id));
        setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id)));
      }
    },
    []
  );

  // --- Data Processing ---
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: RoleItem[] = cloneDeep(roles);
    if (
      filterCriteria.filterDisplayName &&
      filterCriteria.filterDisplayName.trim() !== ""
    ) {
      const q = filterCriteria.filterDisplayName.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.displayName.toLowerCase().includes(q) ||
          item.roleName.toLowerCase().includes(q)
      );
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.displayName.toLowerCase().includes(q) ||
          item.roleName.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof RoleItem] as any;
        let bVal = b[key as keyof RoleItem] as any;
        if (key === "addedDate") {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
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
  }, [roles, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsvRoles(
      "system_roles_export.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
  };

  const displayNameOptionsForFilter = useMemo(() => {
    const unique = new Set(roles.map((item) => item.displayName));
    return Array.from(unique).map((name) => ({ value: name, label: name }));
  }, [roles]);

  const columns: ColumnDef<RoleItem>[] = useMemo(
    () => [
      {
        header: "ID / System Key",
        accessorKey: "id",
        enableSorting: true,
        size: 180,
      },
      {
        header: "Display Name",
        accessorKey: "displayName",
        enableSorting: true,
      },
      {
        header: "Description",
        accessorKey: "description",
        enableSorting: false,
        cell: (props) => (
          <Tooltip title={props.row.original.description} wrapperClass="w-full">
            <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-sm">
              {props.row.original.description}
            </span>
          </Tooltip>
        ),
      },
      {
        header: "Date Added",
        accessorKey: "addedDate",
        enableSorting: true,
        size: 180,
        cell: (props) => new Date(props.getValue<Date>()).toLocaleDateString(),
      },
      {
        header: "Actions",
        id: "action",
        size: 200,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <div className="flex items-center justify-center gap-2">
            <ActionColumn
              onEdit={() => openEditDrawer(props.row.original)}
              onDelete={() => handleDeleteClick(props.row.original)}
              onViewPermissions={() =>
                handleViewPermissions(props.row.original)
              }
            />
          </div>
        ),
      },
    ],
    [handleViewPermissions]
  ); // openEditDrawer, handleDeleteClick are stable

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">{pageTitle}</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <RoleTableTools
            onClearFilters={onClearFilters}
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4 flex-grow overflow-auto">
            <DataTable
              selectable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "idle" || isSubmitting || isDeleting
              }
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              checkboxChecked={(row) =>
                selectedItems.some((item) => item.id === row.id)
              }
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
              noData={!masterLoadingStatus && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <RoleSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Add Role Drawer */}
      <Drawer
        title="Add New Role"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button
              size="sm"
              className="mr-2"
              onClick={closeAddDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="addRoleForm"
              type="submit"
              loading={isSubmitting}
              disabled={!addFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>{" "}
          </div>
        }
      >
        <Form
          id="addRoleForm"
          onSubmit={addFormMethods.handleSubmit(onAddRoleSubmit)}
          className="flex flex-col gap-4 p-1"
        >
          <FormItem
            label="Display Name"
            invalid={!!addFormMethods.formState.errors.displayName}
            errorMessage={addFormMethods.formState.errors.displayName?.message}
          >
            <Controller
              name="displayName"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<TbUserShield />}
                  placeholder="e.g., Content Manager"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Role Name (System Key)"
            invalid={!!addFormMethods.formState.errors.roleName}
            errorMessage={addFormMethods.formState.errors.roleName?.message}
          >
            <Controller
              name="roleName"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<TbLockAccess />}
                  placeholder="e.g., content_manager (no spaces, lowercase)"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Description"
            invalid={!!addFormMethods.formState.errors.description}
            errorMessage={addFormMethods.formState.errors.description?.message}
          >
            <Controller
              name="description"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  textArea
                  {...field}
                  rows={4}
                  prefix={<TbFileDescription />}
                  placeholder="Briefly describe what this role can do."
                />
              )}
            />
          </FormItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* EMPLOYEE */}
            <FormItem label="Employee" className="col-span-1">
              <Controller
                name="isEmployee"
                control={addFormMethods.control}
                render={({ field }) => (
                  <div className="flex space-x-4">
                    <Radio checked={field.value === true} onChange={() => field.onChange(true)}>Yes</Radio>
                    <Radio checked={field.value === false} onChange={() => field.onChange(false)}>No</Radio>
                  </div>
                )}
              />
            </FormItem>

            {/* DESIGNATION */}
            <FormItem label="Designation" className="col-span-1">
              <Controller
                name="isDesignation"
                control={addFormMethods.control}
                render={({ field }) => (
                  <div className="flex space-x-4">
                    <Radio checked={field.value === true} onChange={() => field.onChange(true)}>Yes</Radio>
                    <Radio checked={field.value === false} onChange={() => field.onChange(false)}>No</Radio>
                  </div>
                )}
              />
            </FormItem>

            {/* DEPARTMENT */}
            <FormItem label="Department" className="col-span-1">
              <Controller
                name="isDepartment"
                control={addFormMethods.control}
                render={({ field }) => (
                  <div className="flex space-x-4">
                    <Radio checked={field.value === true} onChange={() => field.onChange(true)}>Yes</Radio>
                    <Radio checked={field.value === false} onChange={() => field.onChange(false)}>No</Radio>
                  </div>
                )}
              />
            </FormItem>

            {/* ROLE */}
            <FormItem label="Role" className="col-span-1">
              <Controller
                name="isRole"
                control={addFormMethods.control}
                render={({ field }) => (
                  <div className="flex space-x-4">
                    <Radio checked={field.value === true} onChange={() => field.onChange(true)}>Yes</Radio>
                    <Radio checked={field.value === false} onChange={() => field.onChange(false)}>No</Radio>
                  </div>
                )}
              />
            </FormItem>
          </div>
        </Form>
      </Drawer>

      {/* Edit Role Drawer */}
      <Drawer
        title="Edit Role"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button
              size="sm"
              className="mr-2"
              onClick={closeEditDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="editRoleForm"
              type="submit"
              loading={isSubmitting}
              disabled={!editFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>{" "}
          </div>
        }
      >
        <Form
          id="editRoleForm"
          onSubmit={editFormMethods.handleSubmit(onEditRoleSubmit)}
          className="flex flex-col gap-4 p-1"
        >
          <FormItem
            label="Display Name"
            invalid={!!editFormMethods.formState.errors.displayName}
            errorMessage={editFormMethods.formState.errors.displayName?.message}
          >
            <Controller
              name="displayName"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} prefix={<TbUserShield />} />
              )}
            />
          </FormItem>
          <FormItem
            label="Role Name (System Key)"
            invalid={!!editFormMethods.formState.errors.roleName}
            errorMessage={editFormMethods.formState.errors.roleName?.message}
          >
            <Controller
              name="roleName"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<TbLockAccess />}
                  disabled={
                    true /* Usually, system key/ID is not editable after creation */
                  }
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Description"
            invalid={!!editFormMethods.formState.errors.description}
            errorMessage={editFormMethods.formState.errors.description?.message}
          >
            <Controller
              name="description"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input
                  textArea
                  {...field}
                  rows={4}
                  prefix={<TbFileDescription />}
                />
              )}
            />
          </FormItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormItem label="Employee Access">
              <div className="flex gap-6">
                <Controller
                  name="isEmployee"
                  control={editFormMethods.control}
                  render={({ field }) => (
                    <>
                      <Radio
                        className="mr-4"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        name="isEmployee"
                      >
                        Yes
                      </Radio>
                      <Radio
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        name="isEmployee"
                      >
                        No
                      </Radio>
                    </>
                  )}
                />
              </div>
            </FormItem>

            <FormItem label="Designation Access">
              <div className="flex gap-6">
                <Controller
                  name="isDesignation"
                  control={editFormMethods.control}
                  render={({ field }) => (
                    <>
                      <Radio
                        className="mr-4"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        name="isDesignation"
                      >
                        Yes
                      </Radio>
                      <Radio
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        name="isDesignation"
                      >
                        No
                      </Radio>
                    </>
                  )}
                />
              </div>
            </FormItem>

            <FormItem label="Department Access">
              <div className="flex gap-6">
                <Controller
                  name="isDepartment"
                  control={editFormMethods.control}
                  render={({ field }) => (
                    <>
                      <Radio
                        className="mr-4"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        name="isDepartment"
                      >
                        Yes
                      </Radio>
                      <Radio
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        name="isDepartment"
                      >
                        No
                      </Radio>
                    </>
                  )}
                />
              </div>
            </FormItem>

            <FormItem label="Role Access">
              <div className="flex gap-6">
                <Controller
                  name="isRole"
                  control={editFormMethods.control}
                  render={({ field }) => (
                    <>
                      <Radio
                        className="mr-4"
                        checked={field.value === true}
                        onChange={() => field.onChange(true)}
                        name="isRole"
                      >
                        Yes
                      </Radio>
                      <Radio
                        checked={field.value === false}
                        onChange={() => field.onChange(false)}
                        name="isRole"
                      >
                        No
                      </Radio>
                    </>
                  )}
                />
              </div>
            </FormItem>
          </div>
        </Form>
        <div className="relative w-full">
          <div className="flex justify-between gap-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
            <div className="">
              <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
              <p className="text-sm font-semibold">Tushar Joshi</p>
              <p>System Admin</p>
            </div>
            <div className="w-[210px]">
              <br />
              <span className="font-semibold">Created At:</span> <span>27 May, 2025, 2:00 PM</span><br />
              <span className="font-semibold">Updated At:</span> <span>27 May, 2025, 2:00 PM</span>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Filter Drawer (Simple Example) */}
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
              form="filterRoleForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterRoleForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Display Name / Role Name">
            <Controller
              name="filterDisplayName"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter name to filter..." />
              )}
            />
          </FormItem>
          {/* Add more complex filters here if needed, e.g., a multi-select for permissions */}
        </Form>
      </Drawer>

      {/* Permissions Drawer (Placeholder Content) */}
      <Drawer
        title={`Permissions for ${currentRoleForPermissions?.displayName || "Role"
          }`}
        isOpen={isPermissionsDrawerOpen}
        onClose={closePermissionsDrawer}
        onRequestClose={closePermissionsDrawer}
        width={700}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={closePermissionsDrawer}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              onClick={onSavePermissions /* Pass form ID if using form */}
            >
              Save Permissions
            </Button>
          </div>
        }
      >
        <div className="p-4">
          <p>
            Configure permissions for the role:{" "}
            <strong>{currentRoleForPermissions?.displayName}</strong> (
            <code>{currentRoleForPermissions?.roleName}</code>)
          </p>
          <div className="mt-4 border p-4 rounded-md min-h-[200px] bg-gray-50 dark:bg-gray-700">
            {/* Placeholder for a permissions tree or checklist */}
            <p className="text-gray-400 dark:text-gray-500">
              Permissions management UI would go here.
            </p>
            <p className="mt-2">For example, a tree of modules and actions:</p>
            <ul className="list-disc list-inside ml-4 mt-2">
              <li>Module A: View, Create, Edit, Delete</li>
              <li>Module B: View, Export</li>
              <li>Settings: Manage Users, Configure System</li>
            </ul>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Role"
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
          Are you sure you want to delete role "
          <strong>{itemToDelete?.displayName}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default RolesListing;
