// src/views/your-path/ChangeLogListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom';
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
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import Avatar from "@/components/ui/Avatar";
import Tag from "@/components/ui/Tag";
import Textarea from "@/views/ui-components/forms/Input/Textarea";
import DatePicker from "@/components/ui/DatePicker"; // For date fields in form & filter
import { Dialog, Drawer, Form, FormItem, Input } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbSearch,
  TbFilter,
  TbCloudUpload,
  TbEye,
  TbUserCircle,
  TbShare,
  TbDotsVertical,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Define Item Type & Constants ---
type ChangeType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "SYSTEM"
  | "OTHER";
const CHANGE_TYPE_OPTIONS = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "SYSTEM", label: "System" },
  { value: "OTHER", label: "Other" },
];
const changeTypeValues = CHANGE_TYPE_OPTIONS.map((ct) => ct.value) as [
  ChangeType,
  ...ChangeType[]
];

type EntityType =
  | "User"
  | "Product"
  | "Order"
  | "Setting"
  | "Role"
  | "Permission"
  | "System"
  | "Other";
const ENTITY_TYPE_OPTIONS = [
  { value: "User", label: "User" },
  { value: "Product", label: "Product" },
  { value: "Order", label: "Order" },
  { value: "Setting", label: "Setting" },
  { value: "Role", label: "Role" },
  { value: "Permission", label: "Permission" },
  { value: "System", label: "System" },
  { value: "Other", label: "Other" },
];
const entityTypeValues = ENTITY_TYPE_OPTIONS.map((et) => et.value) as [
  EntityType,
  ...EntityType[]
];

export type ChangeLogItem = {
  id: string | number; // Keep consistent with UnitItem
  timestamp: string; // Store as ISO string (YYYY-MM-DDTHH:mm:ss.sssZ) or YYYY-MM-DD for DatePicker
  userName: string;
  userId: string | null;
  actionType: ChangeType;
  entityType: EntityType;
  entityId: string | null;
  description: string;
  details?: string; // Simplified to string for this example, can be JSON string
};

const changeTypeColor: Record<ChangeType, string> = {
  /* ... colors ... */
  CREATE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  LOGIN: "bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-100",
  LOGOUT: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
  SYSTEM:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-100",
  OTHER: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-100",
};

// --- Zod Schema for Add/Edit ChangeLog Form ---
// Note: Adding/Editing logs is atypical. This schema is for if you enable it.
const changeLogFormSchema = z.object({
  timestamp: z.string().min(1, "Timestamp is required."), // Or z.date() if DatePicker provides Date object
  userName: z.string().min(1, "User name is required.").max(100),
  userId: z.string().max(50).nullable().optional(),
  actionType: z.enum(changeTypeValues),
  entityType: z.enum(entityTypeValues),
  entityId: z.string().max(100).nullable().optional(),
  description: z.string().min(1, "Description is required.").max(1000),
  details: z.string().max(5000).optional().or(z.literal("")),
});
type ChangeLogFormData = z.infer<typeof changeLogFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterActionType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterEntityType: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterUserName: z.string().optional(),
  filterDateRange: z
    .tuple([z.date().nullable(), z.date().nullable()])
    .optional()
    .default([null, null]),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Initial Dummy Data ---
const initialDummyChangeLogs: ChangeLogItem[] = [
  {
    id: "CL001",
    timestamp: new Date(2023, 10, 6, 14, 30, 15).toISOString(),
    userName: "Alice Admin",
    userId: "U001",
    actionType: "UPDATE",
    entityType: "Product",
    entityId: "PROD002",
    description: 'Updated product name to "Laptop Pro 15" (2023 Edition)"',
  },
  {
    id: "CL002",
    timestamp: new Date(2023, 10, 6, 11, 45, 2).toISOString(),
    userName: "George Support",
    userId: "U007",
    actionType: "LOGIN",
    entityType: "User",
    entityId: "U007",
    description: "User logged in successfully",
  },
];

// --- CSV Exporter Utility ---
const CSV_HEADERS_LOG = [
  "ID",
  "Timestamp",
  "User Name",
  "User ID",
  "Action Type",
  "Entity Type",
  "Entity ID",
  "Description",
  "Details",
];
const CSV_KEYS_LOG: (keyof ChangeLogItem)[] = [
  "id",
  "timestamp",
  "userName",
  "userId",
  "actionType",
  "entityType",
  "entityId",
  "description",
  "details",
];

function exportChangeLogsToCsv(filename: string, rows: ChangeLogItem[]) {
  /* ... (same as previous) ... */
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const separator = ",";
  const csvContent =
    CSV_HEADERS_LOG.join(separator) +
    "\n" +
    rows
      .map((row) =>
        CSV_KEYS_LOG.map((k) => {
          let cell: any = row[k];
          if (k === "timestamp" && cell) cell = new Date(cell).toLocaleString(); // Format timestamp for readability
          if (cell === null || cell === undefined) cell = "";
          else cell = String(cell).replace(/"/g, '""');
          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator)
      )
      .join("\n");
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    /* ... download logic ... */
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

// --- ActionColumn (can be the more comprehensive one) ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
  onChangeStatus,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onChangeStatus: () => void;
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
      <Tooltip title="Share">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
          role="button"
        >
          <TbDotsVertical />
        </div>
      </Tooltip>
    </div>
  );
};

// --- ChangeLogsSearch Component ---
type ChangeLogsSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const ChangeLogsSearch = React.forwardRef<
  HTMLInputElement,
  ChangeLogsSearchProps
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Search logs..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
ChangeLogsSearch.displayName = "ChangeLogsSearch";

// --- ChangeLogsTableTools Component ---
const ChangeLogsTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <ChangeLogsSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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

// --- ChangeLogsTable Component ---
type ChangeLogsTableProps = {
  columns: ColumnDef<ChangeLogItem>[];
  data: ChangeLogItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  // selectedItems: ChangeLogItem[]; // Selection not typical for logs
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  // onRowSelect: (checked: boolean, row: ChangeLogItem) => void; // Selection not typical
  // onAllRowSelect: (checked: boolean, rows: Row<ChangeLogItem>[]) => void; // Selection not typical
};
const ChangeLogsTable = ({
  columns,
  data,
  loading,
  pagingData,
  onPaginationChange,
  onSelectChange,
  onSort,
}: ChangeLogsTableProps) => (
  <DataTable
    // selectable={false} // Logs are usually not selectable for bulk actions
    columns={columns}
    data={data}
    loading={loading}
    pagingData={pagingData}
    onPaginationChange={onPaginationChange}
    onSelectChange={onSelectChange}
    onSort={onSort}
    noData={!loading && data.length === 0}
  />
);

// --- ChangeLogsSelectedFooter (Typically not used for logs, but kept if selection is added back) ---
// type ChangeLogsSelectedFooterProps = { selectedItems: ChangeLogItem[]; onDeleteSelected: () => void; };
// const ChangeLogsSelectedFooter = ({ selectedItems, onDeleteSelected }: ChangeLogsSelectedFooterProps) => { /* ... similar to UnitsSelectedFooter ... */ };

// --- Main ChangeLogListing Component ---
const ChangeLogListing = () => {
  const [changeLogsData, setChangeLogsData] = useState<ChangeLogItem[]>(
    initialDummyChangeLogs
  );
  const [masterLoadingStatus, setMasterLoadingStatus] = useState<
    "idle" | "loading"
  >("idle");

  // Note: Add/Edit for logs is atypical. These are included to match "Units" structure if strictly needed.
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChangeLogItem | null>(null);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<ChangeLogItem | null>(null); // For view dialog

  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false); // Deleting logs is rare
  // const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  // const [itemToDelete, setItemToDelete] = useState<ChangeLogItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
    filterFormSchema.parse({})
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "timestamp" },
    query: "",
  });
  // const [selectedItems, setSelectedItems] = useState<ChangeLogItem[]>([]); // Selection typically not needed

  const formMethods = useForm<ChangeLogFormData>({
    resolver: zodResolver(changeLogFormSchema),
    defaultValues: {
      timestamp: new Date().toISOString().split("T")[0], // Default to today for date part
      userName: "System",
      userId: null,
      actionType: "OTHER",
      entityType: "Other",
      entityId: null,
      description: "",
      details: "",
    },
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  // --- CRUD Handlers (Add/Edit are optional for logs) ---
  const openAddDrawer = useCallback(() => {
    formMethods.reset();
    setIsAddDrawerOpen(true);
  }, [formMethods]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);
  const openEditDrawer = useCallback(
    (item: ChangeLogItem) => {
      setEditingItem(item);
      // Convert timestamp string back to a format DatePicker/Input[type=datetime-local] understands if needed
      const formValues = {
        ...item,
        timestamp: item.timestamp.substring(0, 16), // For datetime-local input: YYYY-MM-DDTHH:mm
      };
      formMethods.reset(formValues);
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setIsEditDrawerOpen(false);
    setEditingItem(null);
  }, []);

  const onSubmitLog = useCallback(
    async (data: ChangeLogFormData) => {
      // This function would only be used if manual Add/Edit of logs is enabled.
      setIsSubmitting(true);
      setMasterLoadingStatus("loading");
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const payload = {
          ...data,
          timestamp: new Date(data.timestamp).toISOString(), // Ensure it's full ISO string
        };
        if (editingItem) {
          const updatedItem: ChangeLogItem = { ...payload, id: editingItem.id };
          setChangeLogsData((prev) =>
            prev.map((log) => (log.id === updatedItem.id ? updatedItem : log))
          );
          toast.push(
            <Notification
              title="Log Entry Updated"
              type="success"
              duration={2000}
            />
          );
          closeEditDrawer();
        } else {
          const newItem: ChangeLogItem = { ...payload, id: `LOG${Date.now()}` };
          setChangeLogsData((prev) => [newItem, ...prev]);
          toast.push(
            <Notification
              title="Log Entry Added"
              type="success"
              duration={2000}
            />
          );
          closeAddDrawer(); // Or reset form if "add another" is desired
        }
      } catch (e: any) {
        toast.push(
          <Notification title="Operation Failed" type="danger" duration={3000}>
            {e.message}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
        setMasterLoadingStatus("idle");
      }
    },
    [editingItem, closeAddDrawer, closeEditDrawer]
  );

  // Delete handlers typically not used for logs. If needed, implement like Units.

  // --- View Dialog Handler ---
  const openViewDialog = useCallback(
    (item: ChangeLogItem) => setViewingItem(item),
    []
  );
  const closeViewDialog = useCallback(() => setViewingItem(null), []);

  // --- Filter Handlers ---
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    setIsFilterDrawerOpen(false);
  }, []);
  const onClearFilters = useCallback(() => {
    const defaultFilters = filterFormSchema.parse({});
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  }, [filterFormMethods]);

  // --- Table Interaction Handlers ---
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({
        pageSize: Number(value),
        pageIndex: 1,
      }); /*setSelectedItems([]);*/
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => {
      handleSetTableData({ sort: sort, pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );
  // Row select and All Row select handlers removed as selection is not typical for logs.

  // --- Data Processing (Memoized) ---
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: ChangeLogItem[] = cloneDeep(changeLogsData);
    // Apply Filters
    if (filterCriteria.filterActionType?.length) {
      const actionValues = filterCriteria.filterActionType.map((a) => a.value);
      processedData = processedData.filter((log) =>
        actionValues.includes(log.actionType)
      );
    }
    if (filterCriteria.filterEntityType?.length) {
      const entityValues = filterCriteria.filterEntityType.map((e) => e.value);
      processedData = processedData.filter((log) =>
        entityValues.includes(log.entityType)
      );
    }
    if (
      filterCriteria.filterUserName &&
      filterCriteria.filterUserName.trim() !== ""
    ) {
      const userQuery = filterCriteria.filterUserName.toLowerCase().trim();
      processedData = processedData.filter((log) =>
        log.userName.toLowerCase().includes(userQuery)
      );
    }
    if (
      filterCriteria.filterDateRange &&
      (filterCriteria.filterDateRange[0] || filterCriteria.filterDateRange[1])
    ) {
      const startDate = filterCriteria.filterDateRange[0]?.getTime();
      const endDate = filterCriteria.filterDateRange[1]
        ? new Date(
            filterCriteria.filterDateRange[1].getTime() + 86399999
          ).getTime()
        : null;
      processedData = processedData.filter((log) => {
        const logTime = new Date(log.timestamp).getTime();
        const startMatch = startDate ? logTime >= startDate : true;
        const endMatch = endDate ? logTime <= endDate : true;
        return startMatch && endMatch;
      });
    }
    // Apply Search Query
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (log /* ... search logic ... */) =>
          log.id.toString().toLowerCase().includes(query) ||
          log.userName.toLowerCase().includes(query) ||
          (log.userId && log.userId.toLowerCase().includes(query)) ||
          log.actionType.toLowerCase().includes(query) ||
          log.entityType.toLowerCase().includes(query) ||
          (log.entityId && log.entityId.toLowerCase().includes(query)) ||
          log.description.toLowerCase().includes(query) ||
          (log.details && log.details.toLowerCase().includes(query))
      );
    }
    // Apply Sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        if (key === "timestamp")
          return order === "asc"
            ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        const aVal = a[key as keyof ChangeLogItem];
        const bVal = b[key as keyof ChangeLogItem];
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
  }, [changeLogsData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    const success = exportChangeLogsToCsv(
      "change_logs.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success" duration={2000}>
          Data exported.
        </Notification>
      );
  }, [allFilteredAndSortedData]);

  // --- Table Column Definitions ---
  const columns: ColumnDef<ChangeLogItem>[] = useMemo(
    () => [
      {
        header: "Timestamp",
        accessorKey: "timestamp",
        size: 180,
        enableSorting: true,
        cell: (props) => {
          const d = new Date(props.getValue<string>());
          return (
            <span>
              {d.toLocaleDateString()}{" "}
              <span className="text-xs text-gray-500">
                {d.toLocaleTimeString()}
              </span>
            </span>
          );
        },
      },
      {
        header: "User",
        accessorKey: "userName",
        size: 160,
        enableSorting: true,
        cell: (props) => (
          <div className="flex items-center gap-2">
            <Avatar size={28} shape="circle" icon={<TbUserCircle />} />
            <span>{props.getValue<string>()}</span>
          </div>
        ),
      },
      {
        header: "Action",
        accessorKey: "actionType",
        size: 110,
        enableSorting: true,
        cell: (props) => (
          <Tag
            className={classNames(
              "capitalize whitespace-nowrap font-semibold",
              changeTypeColor[props.getValue<ChangeType>()]
            )}
          >
            {
              CHANGE_TYPE_OPTIONS.find((o) => o.value === props.getValue())
                ?.label
            }
          </Tag>
        ),
      },
      {
        header: "Entity Type",
        accessorKey: "entityType",
        size: 120,
        enableSorting: true,
        cell: (props) =>
          ENTITY_TYPE_OPTIONS.find((o) => o.value === props.getValue())
            ?.label || props.getValue(),
      },
      {
        header: "Entity ID",
        accessorKey: "entityId",
        size: 130,
        enableSorting: true,
        cell: (props) => props.getValue() || "-",
      },
      {
        header: "Description",
        accessorKey: "description",
        enableSorting: false,
        cell: (props) => (
          <Tooltip title={props.getValue<string>()} wrapperClass="w-full">
            <span className="block whitespace-nowrap overflow-hidden text-ellipsis max-w-md">
              {props.getValue<string>()}
            </span>
          </Tooltip>
        ),
      },
      {
        header: "Actions",
        id: "action",
        size: 200,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onView={() => openViewDialog(props.row.original)}
            // onEdit={() => openEditDrawer(props.row.original)} // Optional: only if admin edit is allowed
          />
        ),
      },
    ],
    [openViewDialog /*openEditDrawer*/]
  );

  // --- Render Form for Drawer (Optional: if manual add/edit of logs is enabled) ---
  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem
        label="Timestamp"
        invalid={!!currentFormMethods.formState.errors.timestamp}
        errorMessage={currentFormMethods.formState.errors.timestamp?.message}
      >
        <Controller
          name="timestamp"
          control={currentFormMethods.control}
          render={({ field }) => (
            // For datetime-local, value needs to be YYYY-MM-DDTHH:MM
            // Input value will be string, Zod schema expects string
            <Input {...field} type="datetime-local" />
          )}
        />
      </FormItem>
      <FormItem
        label="User Name"
        invalid={!!currentFormMethods.formState.errors.userName}
        errorMessage={currentFormMethods.formState.errors.userName?.message}
      >
        <Controller
          name="userName"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input {...field} placeholder="Username or System" />
          )}
        />
      </FormItem>
      <FormItem
        label="User ID (Optional)"
        invalid={!!currentFormMethods.formState.errors.userId}
        errorMessage={currentFormMethods.formState.errors.userId?.message}
      >
        <Controller
          name="userId"
          control={currentFormMethods.control}
          render={({ field }) => <Input {...field} placeholder="U001" />}
        />
      </FormItem>
      <FormItem
        label="Action Type"
        invalid={!!currentFormMethods.formState.errors.actionType}
        errorMessage={currentFormMethods.formState.errors.actionType?.message}
      >
        <Controller
          name="actionType"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select action"
              options={CHANGE_TYPE_OPTIONS}
              value={CHANGE_TYPE_OPTIONS.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Entity Type"
        invalid={!!currentFormMethods.formState.errors.entityType}
        errorMessage={currentFormMethods.formState.errors.entityType?.message}
      >
        <Controller
          name="entityType"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select entity type"
              options={ENTITY_TYPE_OPTIONS}
              value={ENTITY_TYPE_OPTIONS.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Entity ID (Optional)"
        invalid={!!currentFormMethods.formState.errors.entityId}
        errorMessage={currentFormMethods.formState.errors.entityId?.message}
      >
        <Controller
          name="entityId"
          control={currentFormMethods.control}
          render={({ field }) => <Input {...field} placeholder="PROD005" />}
        />
      </FormItem>
      <FormItem
        label="Description"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.description}
        errorMessage={currentFormMethods.formState.errors.description?.message}
      >
        <Controller
          name="description"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Textarea {...field} rows={3} placeholder="Summary of the change" />
          )}
        />
      </FormItem>
      <FormItem
        label="Details (JSON or Text, Optional)"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.details}
        errorMessage={currentFormMethods.formState.errors.details?.message}
      >
        <Controller
          name="details"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Textarea
              {...field}
              rows={4}
              placeholder='e.g., {"oldValue": "X", "newValue": "Y"}'
            />
          )}
        />
      </FormItem>
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">
              Change Log Viewer
            </h5>
            {/* Add New button is typically not present for logs. Kept for structural similarity if needed. */}
            {/* <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add Log Entry (Admin)</Button> */}
          </div>
          {/* <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
                    <ActiveFiltersDisplay
                        filterData={filterCriteria}
                        onRemoveFilter={handleRemoveFilter as any}
                        onClearAll={onClearFilters}
                    /> */}
          <div className="mt-4">
            <ChangeLogsTable
              columns={columns}
              data={pageData}
              loading={masterLoadingStatus === "loading"}
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
            />
          </div>
        </AdaptiveCard>
      </Container>

      {/* View Details Dialog */}
      <Dialog
        isOpen={!!viewingItem}
        onClose={closeViewDialog}
        onRequestClose={closeViewDialog}
        width={700}
      >
        <h5 className="mb-4">Log Details (ID: {viewingItem?.id})</h5>
        {viewingItem && (
          <div className="space-y-3 text-sm">
            {(Object.keys(viewingItem) as Array<keyof ChangeLogItem>).map(
              (key) => {
                let label = key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());
                let value: any = viewingItem[key];
                if (key === "timestamp" && value)
                  value = new Date(value).toLocaleString();
                else if (key === "actionType")
                  value =
                    CHANGE_TYPE_OPTIONS.find((o) => o.value === value)?.label ||
                    value;
                else if (key === "entityType")
                  value =
                    ENTITY_TYPE_OPTIONS.find((o) => o.value === value)?.label ||
                    value;
                else if (
                  key === "details" &&
                  value &&
                  typeof value !== "string"
                ) {
                  try {
                    value = JSON.stringify(value, null, 2);
                  } catch {
                    value = String(value);
                  }
                  return (
                    <div key={key} className="flex flex-col">
                      <span className="font-semibold">{label}:</span>
                      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 whitespace-pre-wrap max-h-40 overflow-auto">
                        {value || "-"}
                      </pre>
                    </div>
                  );
                }
                return (
                  <div key={key} className="flex">
                    <span className="font-semibold w-1/3 md:w-1/4">
                      {label}:
                    </span>
                    <span className="w-2/3 md:w-3/4 break-words">
                      {value || "-"}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
        <div className="text-right mt-6">
          {" "}
          <Button variant="solid" onClick={closeViewDialog}>
            Close
          </Button>{" "}
        </div>
      </Dialog>

      {/* Optional Add/Edit Drawer for Logs (if enabled) */}
      <Drawer
        title={
          editingItem ? "Edit Log Entry (Admin)" : "Add New Log Entry (Admin)"
        }
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={700}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={editingItem ? closeEditDrawer : closeAddDrawer}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="changeLogForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Adding..."
                : editingItem
                ? "Save Changes"
                : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="changeLogForm"
          onSubmit={formMethods.handleSubmit(onSubmitLog)}
          className="flex flex-col gap-4"
        >
          {renderDrawerForm(formMethods)}
        </Form>
      </Drawer>

      <Drawer
        title="Filter Change Logs"
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onRequestClose={() => setIsFilterDrawerOpen(false)}
        width={400}
        footer={
          <div className="text-right w-full">
            <Button size="sm" onClick={onClearFilters} type="button">
              Clear All
            </Button>
            <div>
              <Button
                size="sm"
                className="mr-2"
                onClick={() => setIsFilterDrawerOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterLogForm"
                type="submit"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        }
      >
        <Form
          id="filterLogForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Action Type(s)">
            <Controller
              name="filterActionType"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Any Action Type"
                  options={CHANGE_TYPE_OPTIONS}
                  value={CHANGE_TYPE_OPTIONS.filter((opt) =>
                    field.value?.includes(opt.value)
                  )}
                  onChange={(opts) =>
                    field.onChange(opts ? opts.map((o: any) => o.value) : [])
                  }
                />
              )}
            />
          </FormItem>
          <FormItem label="Entity Type(s)">
            <Controller
              name="filterEntityType"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Any Entity Type"
                  options={ENTITY_TYPE_OPTIONS}
                  value={ENTITY_TYPE_OPTIONS.filter((opt) =>
                    field.value?.includes(opt.value)
                  )}
                  onChange={(opts) =>
                    field.onChange(opts ? opts.map((o: any) => o.value) : [])
                  }
                />
              )}
            />
          </FormItem>
          <FormItem label="User Name (contains)">
            <Controller
              name="filterUserName"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter username to filter" />
              )}
            />
          </FormItem>
          <FormItem label="Date Range">
            <Controller
              name="filterDateRange"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePicker.RangePicker
                  value={field.value as [Date | null, Date | null] | undefined}
                  onChange={(dates) => field.onChange(dates || [null, null])}
                  placeholder="Start Date - End Date"
                  inputFormat="YYYY-MM-DD"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* ConfirmDialog for delete would typically be removed for logs */}
    </>
  );
};

export default ChangeLogListing;
