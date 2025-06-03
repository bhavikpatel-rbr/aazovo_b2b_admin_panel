// src/views/your-path/ActivityLog.tsx

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
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import Avatar from "@/components/ui/Avatar";
import Tag from "@/components/ui/Tag";
import DatePicker from "@/components/ui/DatePicker";
import { Card, Dialog, Drawer, Form, FormItem, Input } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbSearch,
  TbFilter,
  TbCloudUpload,
  TbEye,
  TbUserCircle,
  TbReload,
  TbActivity,
  TbCalendarWeek,
  TbLogin,
  TbCloudNetwork,
  TbCloudExclamation,
  TbCloudPin,
  TbCloudCog,
  TbTrashX,
  TbCancel,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store"; // Assuming this path
import { shallowEqual, useSelector } from "react-redux";
// conceptual:
import { getActivityLogAction } from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Assuming this path and selector

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

type entity =
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
const entityValues = ENTITY_TYPE_OPTIONS.map((et) => et.value) as [
  entity,
  ...entity[]
];

export type ChangeLogItem = {
  id: string | number;
  timestamp: string;
  userName: string;
  userId: string | null;
  action: ChangeType;
  entity: entity;
  entityId: string | null;
  description: string;
  details?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
};

const changeTypeColor: Record<ChangeType, string> = {
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

const changeLogFormSchema = z.object({
  timestamp: z.string().min(1, "Timestamp is required."),
  userName: z.string().min(1, "User name is required.").max(100),
  userId: z.string().max(50).nullable().optional(),
  action: z.enum(changeTypeValues),
  entity: z.enum(entityValues),
  entityId: z.string().max(100).nullable().optional(),
  description: z.string().min(1, "Description is required.").max(1000),
  details: z.string().max(5000).optional().or(z.literal("")),
});
type ChangeLogFormData = z.infer<typeof changeLogFormSchema>;

const filterFormSchema = z.object({
  filteraction: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterentity: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterUserName: z.string().optional(),
  filterDateRange: z
    .tuple([z.date().nullable(), z.date().nullable()])
    .optional()
    .default([null, null]),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- MOCK Redux Action for Submit Export Reason (replace with your actual action) ---
const submitExportReasonAction = (payload: {
  reason: string;
  module: string;
}) => {
  console.log("Dispatching conceptual submitExportReasonAction with:", payload);
  return { type: "master/submitExportReason/pending" };
};

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
  "Updated At",
  "Updated By Name",
  "Updated By Role",
];
type ChangeLogExportItem = Omit<ChangeLogItem, "timestamp" | "updated_at"> & {
  timestamp_formatted?: string;
  updated_at_formatted?: string;
};
const CSV_KEYS_LOG_EXPORT: (keyof ChangeLogExportItem)[] = [
  "id",
  "timestamp_formatted",
  "userName",
  "userId",
  "action",
  "entity",
  "entityId",
  "description",
  "details",
  "updated_at_formatted",
  "updated_by_name",
  "updated_by_role",
];

function exportChangeLogsToCsv(filename: string, rows: ChangeLogItem[]) {
  if (!rows || !rows.length) return false;
  const preparedRows: ChangeLogExportItem[] = rows.map((row) => ({
    ...row,
    timestamp_formatted: row.timestamp
      ? new Date(row.timestamp).toLocaleString()
      : "N/A",
    details: row.details || "N/A",
    userId: row.userId || "N/A",
    entityId: row.entityId || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
  }));
  const separator = ",";
  const csvContent =
    CSV_HEADERS_LOG.join(separator) +
    "\n" +
    preparedRows
      .map((row) =>
        CSV_KEYS_LOG_EXPORT.map((k) => {
          let cell: any = row[k as keyof ChangeLogExportItem];
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

const ActionColumn = ({
  onViewDetail,
  onEdit,
}: {
  onViewDetail: () => void;
  onEdit?: () => void;
}) => (
  <div className="flex items-center justify-center gap-1">
    <Tooltip title="View">
      <button
        className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`}
        role="button"
        onClick={onViewDetail}
      >
        <TbEye />
      </button>
    </Tooltip>
    {onEdit && (
      <Tooltip title="Edit (Admin)">
        <button
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </button>
      </Tooltip>
    )}
    <Tooltip title="Block Activity">
        <button className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`} role="button" onClick={onEdit}>
          <TbCancel />
        </button>
      </Tooltip>
  </div>
);

const ChangeLogsSearch = React.forwardRef<
  HTMLInputElement,
  { onInputChange: (value: string) => void }
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
ChangeLogsSearch.displayName = "ChangeLogsSearch";

const ChangeLogsTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      {" "}
      <ChangeLogsSearch onInputChange={onSearchChange} />{" "}
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Tooltip title="Clear Filters"> <Button icon={<TbReload />} onClick={onClearFilters} /> </Tooltip>
      <Button icon={<TbFilter />} className="w-full sm:w-auto" onClick={onFilter}> Filter </Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto"> Export </Button>
      <Tooltip title="Previous 3 Month">
        <Button icon={<TbTrashX />} className="w-full sm:w-auto"> Clear History </Button>
      </Tooltip>
    </div>
  </div>
);

const ChangeLogsTable = ({
  columns,
  data,
  loading,
  pagingData,
  onPaginationChange,
  onSelectChange,
  onSort,
}: {
  columns: ColumnDef<ChangeLogItem>[];
  data: ChangeLogItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
}) => (
  <DataTable
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

// --- Main ActivityLog Component ---
const ActivityLog = () => {
  const dispatch = useAppDispatch();
  // Ensure your masterSelector and Redux state provide these:
  const {
    activityLogsData = [], // Default to empty array
    activityLogsTotal = 0, // Default to 0
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChangeLogItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<ChangeLogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
    filterFormSchema.parse({})
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "timestamp" },
    query: "",
  });

  const formMethods = useForm<ChangeLogFormData>({
    resolver: zodResolver(changeLogFormSchema),
    defaultValues: {
      /* default values set in openAddDrawer */
    },
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  // Fetch data
  useEffect(() => {
    const paramsToSubmit = {
      ...tableData,
      // Convert filterCriteria to params format expected by API
      filteraction: filterCriteria.filteraction?.map((f) => f.value),
      filterentity: filterCriteria.filterentity?.map((f) => f.value),
      filterUserName: filterCriteria.filterUserName,
      filterDateStart: filterCriteria.filterDateRange?.[0]?.toISOString(),
      filterDateEnd: filterCriteria.filterDateRange?.[1]?.toISOString(),
    };
    // @ts-ignore // conceptual action
    dispatch(getActivityLogAction({ params: paramsToSubmit }));
  }, [dispatch, tableData, filterCriteria]);

  const openAddDrawer = useCallback(() => {
    formMethods.reset({
      timestamp: new Date().toISOString().substring(0, 16),
      userName: "System",
      userId: null,
      action: "OTHER",
      entity: "Other",
      entityId: null,
      description: "",
      details: "",
    });
    setIsAddDrawerOpen(true);
  }, [formMethods]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: ChangeLogItem) => {
      setEditingItem(item);
      formMethods.reset({
        ...item,
        timestamp: item.timestamp.substring(0, 16),
      });
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
      setIsSubmitting(true);
      const payload = {
        ...data,
        timestamp: new Date(data.timestamp).toISOString(),
      };
      try {
        if (editingItem) {
          // conceptual: await dispatch(editChangeLogAction({ id: editingItem.id, data: payload })).unwrap();
          console.log("Simulating edit log:", {
            ...payload,
            id: editingItem.id,
          });
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API
          // Manually update local Redux store for demo if not using real backend + thunk
          // This part would be handled by the thunk and reducer in a real app
          const updatedItem: ChangeLogItem = {
            ...editingItem,
            ...payload,
            updated_at: new Date().toISOString(),
            updated_by_name: "Admin Editor",
            updated_by_role: "Administrator",
          };
          // dispatch(updateActivityLogEntryInStore(updatedItem)); // conceptual local update
          toast.push(<Notification title="Log Entry Updated" type="success" />);
          closeEditDrawer();
        } else {
          // conceptual: await dispatch(addChangeLogAction(payload)).unwrap();
          console.log("Simulating add log:", payload);
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API
          // dispatch(addActivityLogEntryToStore(newItem)); // conceptual local update
          toast.push(<Notification title="Log Entry Added" type="success" />);
          closeAddDrawer();
        }
        // Refetch list after add/edit
        const paramsToSubmit = { ...tableData /* ... filter params ... */ };
        // @ts-ignore // conceptual action
        dispatch(getActivityLogAction({ params: paramsToSubmit }));
      } catch (e: any) {
        toast.push(
          <Notification title="Operation Failed" type="danger">
            {e.message || "Error"}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      dispatch,
      editingItem,
      closeAddDrawer,
      closeEditDrawer,
      tableData,
      filterCriteria,
    ]
  ); // Added dependencies

  const openViewDialog = useCallback(
    (item: ChangeLogItem) => setViewingItem(item),
    []
  );
  const closeViewDialog = useCallback(() => setViewingItem(null), []);

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);

  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 })); // Reset to page 1 on filter change
    setIsFilterDrawerOpen(false);
    // useEffect will trigger data fetch
  }, []);

  const onClearFilters = useCallback(() => {
    const defaultFilters = filterFormSchema.parse({});
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
    // useEffect will trigger data fetch
  }, [filterFormMethods]);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
    // useEffect will trigger data fetch
  }, []);

  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) =>
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 }),
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

  // Data for table display: directly use Redux state if server paginates
  // If server sends all filtered data and client paginates/sorts, useMemo is more complex
  const pageData = useMemo(() => {
    // If activityLogsData is already paginated and sorted by server, just return it.
    // Otherwise, you might need client-side sorting/pagination here based on tableData.
    // For this example, assuming activityLogsData is the correctly paginated/sorted set from server.
    return Array.isArray(activityLogsData) ? activityLogsData : [];
  }, [activityLogsData]);

  // For export, we might need all data, not just current page.
  // This part needs careful consideration with server-side pagination.
  // Option 1: Fetch all data for export (can be slow for large datasets).
  // Option 2: Export only current view (less useful).
  // Option 3: Server-side export generation.
  // For now, this will use whatever is in `activityLogsData`, which might just be one page.
  const allFilteredAndSortedDataForExport = useMemo(() => {
    // If activityLogsData contains ALL filtered items (not just one page), this is fine.
    // If it's just one page, export will be limited.
    // A real solution might involve a separate fetch for all export data.
    let dataToExport = cloneDeep(
      Array.isArray(activityLogsData) ? activityLogsData : []
    );

    // If you need to re-apply sorting for export (if `activityLogsData` is not sorted as per `tableData.sort`)
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      dataToExport.sort((a, b) => {
        if (key === "timestamp" || key === "updated_at") {
          const dateA = a[key as "timestamp" | "updated_at"]
            ? new Date(a[key as "timestamp" | "updated_at"]!).getTime()
            : 0;
          const dateB = b[key as "timestamp" | "updated_at"]
            ? new Date(b[key as "timestamp" | "updated_at"]!).getTime()
            : 0;
          if (dateA === 0 && dateB === 0) return 0;
          if (dateA === 0) return order === "asc" ? 1 : -1;
          if (dateB === 0) return order === "asc" ? -1 : 1;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        const aVal = a[key as keyof ChangeLogItem];
        const bVal = b[key as keyof ChangeLogItem];
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }
    return dataToExport;
  }, [activityLogsData, tableData.sort]);

  const handleOpenExportReasonModal = useCallback(() => {
    if (
      !allFilteredAndSortedDataForExport ||
      !allFilteredAndSortedDataForExport.length
    ) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  }, [allFilteredAndSortedDataForExport, exportReasonFormMethods]);

  const handleConfirmExportWithReason = useCallback(
    async (data: ExportReasonFormData) => {
      setIsSubmittingExportReason(true);
      const moduleName = "Activity Log";
      try {
        // @ts-ignore // conceptual action
        await dispatch(
          submitExportReasonAction({ reason: data.reason, module: moduleName })
        ).unwrap(); // If it's a thunk
        // dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName })); // If it's a simple action

        const success = exportChangeLogsToCsv(
          "change_logs.csv",
          allFilteredAndSortedDataForExport
        );
        if (success) {
          toast.push(
            <Notification
              title="Export Successful"
              type="success"
              duration={3000}
            >
              Data exported.
            </Notification>
          );
        }
        setIsExportReasonModalOpen(false);
      } catch (error: any) {
        toast.push(
          <Notification
            title="Operation Failed"
            type="danger"
            message={error.message || "Could not complete export."}
          />
        );
      } finally {
        setIsSubmittingExportReason(false);
      }
    },
    [dispatch, allFilteredAndSortedDataForExport]
  );

  const columns: ColumnDef<ChangeLogItem>[] = useMemo(
    () => [
      {
        header: "Timestamp",
        size: 180,
        enableSorting: true,
        cell: (props) => {
          const { created_at, timestamp, updated_at } = props.row
            .original as any;
          const val = created_at || timestamp || updated_at;

          if (!val) {
            return <span className="text-xs text-gray-400">-</span>;
          }

          const d = new Date(val);
          const formattedDate = `${d.getDate()} ${d.toLocaleString("en-US", {
            month: "long",
          })} ${d.getFullYear()}, ${d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}`;

          return (
            <div className="text-xs">
              <span className="text-gray-700">{formattedDate}</span>
            </div>
          );
        },
      },
      {
        header: "User",
        size: 160,
        enableSorting: true,
        cell: (props) => {
          const { userName, userId } = props.row.original;
          return (
            <div className="flex items-center gap-2">
              <Avatar size={28} shape="circle" icon={<TbUserCircle />} />
              <div className="text-xs leading-tight">
                <b>{userName || "Unknown"}</b>
                <p className="text-gray-500">{userId || "System"}</p>
              </div>
            </div>
          );
        },
      },
      {
        header: "Action",
        size: 110,
        enableSorting: true,
        cell: (props) => {
          const action = props.row.original.action;
          return (
            <Tag
              className={classNames(
                "capitalize whitespace-nowrap font-semibold min-w-[70px] text-start",
                changeTypeColor[action]
              )}
            >
              {CHANGE_TYPE_OPTIONS.find((o) => o.value === action)?.label ||
                action}
            </Tag>
          );
        },
      },
      {
        header: "Entity",
        size: 150,
        enableSorting: true,
        cell: (props) => {
          const entity = props.row.original.entity;
          return (
            <div className="text-xs leading-tight">
              <div className="text-gray-500">{entity}</div>
            </div>
          );
        },
      },
      {
        header: "Description",
        enableSorting: false,
        cell: (props) => {
          const description = props.row.original.description || "-";
          return (
            <div className="text-xs whitespace-pre-wrap break-words max-w-[400px]">
              {description}
            </div>
          );
        },
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        size: 170,
        meta: { HeaderClass: "text-red-500" }, // Matched size with Domain module
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } =
            props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", { month: "long" })} ${new Date(
                updated_at
              ).getFullYear()}, ${new Date(updated_at).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}`
            : "N/A";
          return (
            <div className="text-xs">
              <span>
                {updated_by_name || "N/A"}
                {updated_by_role && (
                  <>
                    <br />
                    <b>{updated_by_role}</b>
                  </>
                )}
              </span>
              <br />
              <span>{formattedDate}</span>
            </div>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onViewDetail={() => openViewDialog(props.row.original)}
          />
        ),
      },
    ],
    [openViewDialog]
  );

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
          render={({ field }) => <Input {...field} type="datetime-local" />}
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
          render={({ field }) => (
            <Input {...field} value={field.value || ""} placeholder="U001" />
          )}
        />
      </FormItem>
      <FormItem
        label="Action Type"
        invalid={!!currentFormMethods.formState.errors.action}
        errorMessage={currentFormMethods.formState.errors.action?.message}
      >
        <Controller
          name="action"
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
        invalid={!!currentFormMethods.formState.errors.entity}
        errorMessage={currentFormMethods.formState.errors.entity?.message}
      >
        <Controller
          name="entity"
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
          render={({ field }) => (
            <Input {...field} value={field.value || ""} placeholder="PROD005" />
          )}
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
            <Input
              textArea
              {...field}
              rows={3}
              placeholder="Summary of the change"
            />
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
            <Input
              textArea
              {...field}
              value={field.value || ""}
              rows={4}
              placeholder='e.g., {"oldValue": "X", "newValue": "Y"}'
            />
          )}
        />
      </FormItem>
    </div>
  );

  const tableIsLoading = masterLoadingStatus === "pending" || isSubmitting;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Activity Log</h5>
            {/* <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add Log Entry (Admin)</Button> */}
          </div>
          <div className="grid grid-cols-6 mb-4 gap-2">
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbActivity size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">879</h6>
                <span className="font-semibold text-xs">Total</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbCalendarWeek size={24} />
              </div>
              <div>
                <h6 className="text-green-500">23</h6>
                <span className="font-semibold text-xs">Today</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                <TbLogin size={24} />
              </div>
              <div>
                <h6 className="text-pink-500">34</h6>
                <span className="font-semibold text-xs">Failed Login</span>
              </div>
            </Card>

            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-300" >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbCloudPin size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">9</h6>
                <span className="font-semibold text-xs">Unique IP</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbCloudCog size={24} />
              </div>
              <div>
                <h6 className="text-orange-500">23</h6>
                <span className="font-semibold text-xs">Distinct IP</span>
              </div>
            </Card>


            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbCloudExclamation size={24} />
              </div>
              <div>
                <h6 className="text-red-500">3</h6>
                <span className="font-semibold text-xs">Suspicious IP</span>
              </div>
            </Card>
          </div>
          <ChangeLogsTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <ChangeLogsTable
              columns={columns}
              data={pageData} // Use pageData from useMemo (which uses Redux state)
              loading={tableIsLoading}
              pagingData={{
                total: activityLogsTotal, // Use total from Redux state
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
                  .replace(/_/g, " ")
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());
                let value: any = viewingItem[key];
                if ((key === "timestamp" || key === "updated_at") && value)
                  value = new Date(value).toLocaleString();
                else if (key === "action")
                  value =
                    CHANGE_TYPE_OPTIONS.find((o) => o.value === value)?.label ||
                    value;
                else if (key === "entity")
                  value =
                    ENTITY_TYPE_OPTIONS.find((o) => o.value === value)?.label ||
                    value;
                else if (
                  key === "details" &&
                  value &&
                  typeof value === "string"
                ) {
                  let isJson = false;
                  try {
                    const p = JSON.parse(value);
                    if (typeof p === "object" && p !== null) {
                      value = JSON.stringify(p, null, 2);
                      isJson = true;
                    }
                  } catch {}
                  if (isJson)
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
                      {value === null || value === undefined || value === ""
                        ? "-"
                        : String(value)}
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
              {" "}
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Adding..."
                : editingItem
                ? "Save"
                : "Save"}{" "}
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
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onRequestClose={() => setIsFilterDrawerOpen(false)}
        width={400}
        footer={
          <div className="text-right w-full">
            <div>
              <Button
                size="sm"
                className="mr-2"
                onClick={onClearFilters}
                type="button"
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterLogForm"
                type="submit"
              >
                Apply
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
          <FormItem label="Action Types">
            <Controller
              name="filteraction"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Action Type"
                  options={CHANGE_TYPE_OPTIONS}
                  value={field.value || []}
                  onChange={(opts) => field.onChange(opts || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Entity Types">
            <Controller
              name="filterentity"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select Entity Type"
                  options={ENTITY_TYPE_OPTIONS}
                  value={field.value || []}
                  onChange={(opts) => field.onChange(opts || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="User Name">
            <Controller
              name="filterUserName"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value || ""}
                  placeholder="Enter user name to filter"
                />
              )}
            />
          </FormItem>
          <FormItem label="Date Range">
            <Controller
              name="filterDateRange"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePicker.DatePickerRange
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

      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Exporting Activity Logs"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(
          handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <Form
          id="exportChangeLogsReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={
              exportReasonFormMethods.formState.errors.reason?.message
            }
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

export default ActivityLog;
