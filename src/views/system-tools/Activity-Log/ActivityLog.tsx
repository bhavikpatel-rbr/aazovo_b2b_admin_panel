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
import Avatar from "@/components/ui/Avatar";
import DatePicker from "@/components/ui/DatePicker";
import {
  Card,
  Dialog,
  Drawer,
  Form,
  FormItem,
  Input,
  Select,
  Tag,
  Dropdown,
  Checkbox,
  Skeleton,
} from "@/components/ui";

// Icons
import {
  TbEye,
  TbSearch,
  TbFilter,
  TbCloudUpload,
  TbUserCircle,
  TbReload,
  TbActivity,
  TbCalendarWeek,
  TbLogin,
  TbCloudPin,
  TbCloudExclamation,
  TbCloudCog,
  TbCancel,
  TbColumns,
  TbX,
  TbShieldOff,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getActivityLogAction,
  submitExportReasonAction,
  blockUserAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useLocation } from "react-router-dom";

// --- Type Definitions & Constants ---
const CHANGE_TYPE_OPTIONS = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "Failed Login", label: "Failed Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "SYSTEM", label: "System" },
  { value: "OTHER", label: "Other" },
];
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
const BLOCK_STATUS_OPTIONS = [
  { value: "1", label: "Blocked" },
  { value: "0", label: "Not Blocked" },
];

export type User = {
  id: number;
  name: string;
  email: string;
  profile_pic_path: string | null;
  roles: { display_name: string }[];
};
export type ChangeLogItem = {
  id: string | number;
  timestamp: string;
  userName: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  ip: string | null;
  is_blocked: 0 | 1 | null;
  details?: string;
  updated_at?: string;
  user: User | null;
};

const changeTypeColor: Record<string, string> = {
  "Add": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "Update": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "Successful Login": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "Successful Logout": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "Delete": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "System": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "Unblock": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "Block": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "Others": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "Forgot Password Email": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700",
  "Failed Login": "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700", // Added for consistency
};

const filterFormSchema = z.object({
  filterAction: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterEntity: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterUserName: z.string().optional(),
  filterDateRange: z.tuple([z.date().nullable(), z.date().nullable()]).optional(),
  filterBlockStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Utility & Child Components ---
function exportChangeLogsToCsv(filename: string, rows: ChangeLogItem[]) {
  if (!rows || !rows.length) return false;
  const separator = ",";
  const headers = ["ID", "Timestamp", "User Name", "Email", "Role", "Action", "Entity", "Description", "IP Address", "Blocked"];
  const csvContent = [
    headers.join(separator),
    ...rows.map(row => [
      `"${row.id}"`,
      `"${new Date(row.timestamp).toLocaleString()}"`,
      `"${row.user?.name || row.userName}"`,
      `"${row.user?.email || 'N/A'}"`,
      `"${row.user?.roles?.[0]?.display_name || 'N/A'}"`,
      `"${row.action}"`,
      `"${row.entity}"`,
      `"${String(row.description || '').replace(/"/g, '""')}"`,
      `"${row.ip || 'N/A'}"`,
      `"${row.is_blocked === 1 ? 'Yes' : 'No'}"`,
    ].join(separator))
  ].join('\n');

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
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

const ActionColumn = ({
  onViewDetail,
  onBlockOrUnblock,
  isBlocked,
}: {
  onViewDetail: () => void;
  onBlockOrUnblock: () => void;
  isBlocked: boolean;
}) => (
  <div className="flex items-center justify-center gap-1">
    <Tooltip title="View Details">
      <button
        className="text-xl p-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={onViewDetail}
      >
        <TbEye />
      </button>
    </Tooltip>
    <Tooltip title={isBlocked ? "Unblock User/IP" : "Block User/IP"}>
      <button
        className={classNames("text-xl p-1 rounded-md", {
          "text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700": !isBlocked,
          "text-green-500 hover:text-green-700 hover:bg-gray-100 dark:hover:bg-gray-700": isBlocked,
        })}
        onClick={onBlockOrUnblock}
      >
        {isBlocked ? <TbShieldOff /> : <TbCancel />}
      </button>
    </Tooltip>
  </div>
);

const ActiveFiltersDisplay = ({
  filterData,
  onRemoveFilter,
  onClearAll,
}: {
  filterData: Partial<FilterFormData>;
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const keyToLabelMap: Record<keyof FilterFormData, string> = {
    filterAction: "Action",
    filterEntity: "Entity",
    filterUserName: "User",
    filterDateRange: "Date",
    filterBlockStatus: "Status",
  };

  const filters = Object.entries(filterData).flatMap(([key, values]) => {
    const typedKey = key as keyof FilterFormData;
    if (!values || (Array.isArray(values) && values.length === 0)) {
      return [];
    }
    if (key === "filterDateRange" && (values[0] || values[1])) {
      const start = values[0] ? new Date(values[0]).toLocaleDateString() : "...";
      const end = values[1] ? new Date(values[1]).toLocaleDateString() : "...";
      return [{ key: typedKey, value: "date-range", label: `${start} to ${end}` }];
    }
    if (key === "filterUserName" && typeof values === "string" && values) {
      return [{ key: typedKey, value: values, label: values }];
    }
    if (Array.isArray(values)) {
      return values.map((v) => ({ key: typedKey, ...v }));
    }
    return [];
  });


  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 pb-4 dark:border-gray-700">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">
        Active Filters:
      </span>
      {filters.map((filter, i) => (
        <Tag
          key={`${filter.key}-${i}`}
          prefix
          className="bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
        >
          {keyToLabelMap[filter.key]}: {filter.label}
          <TbX
            className="ml-1 h-3 w-3 cursor-pointer"
            onClick={() => onRemoveFilter(filter.key, filter.value)}
          />
        </Tag>
      ))}
      <Button
        size="xs"
        variant="plain"
        className="text-red-600 hover:underline ml-auto"
        onClick={onClearAll}
      >
        Clear All
      </Button>
    </div>
  );
};

const ItemTableTools = ({
  onSearchChange,
  searchValue,
  onFilter,
  onExport,
  onClearAll,
  columns,
  filteredColumns,
  setFilteredColumns,
  activeFilterCount,
  isDataReady,
}: {
  onSearchChange: (q: string) => void;
  searchValue: string;
  onFilter: () => void;
  onExport: () => void;
  onClearAll: () => void;
  columns: ColumnDef<ChangeLogItem>[];
  filteredColumns: ColumnDef<ChangeLogItem>[];
  setFilteredColumns: (cols: ColumnDef<ChangeLogItem>[]) => void;
  activeFilterCount: number;
  isDataReady: boolean;
}) => {
  const toggleColumn = (checked: boolean, colId: string | number) => {
    const id = String(colId);
    if (checked) {
      const originalColumn = columns.find(c => (c.id || c.accessorKey) === id);
      if (originalColumn) {
        setFilteredColumns([...filteredColumns, originalColumn].sort((a, b) => columns.indexOf(a) - columns.indexOf(b)));
      }
    } else {
      setFilteredColumns(filteredColumns.filter(c => (c.id || c.accessorKey) !== id));
    }
  };
  const isColumnVisible = (colId: string | number) => filteredColumns.some((c) => (c.id || c.accessorKey) === String(colId));

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <DebouceInput
          className="w-full"
          placeholder="Quick Search in results..."
          value={searchValue}
          suffix={<TbSearch className="text-lg" />}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-1.5 w-full sm:w-auto">
        <Dropdown
          renderTitle={<Button title="Toggle Columns" icon={<TbColumns />} />}
          placement="bottom-end"
        >
          <div className="flex flex-col p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="font-semibold mb-1 border-b pb-1 px-2 dark:border-gray-600">
              Toggle Columns
            </div>
            {columns
              .filter((c) => c.id !== "actions" && c.header)
              .map((col) => {
                const id = col.id || col.accessorKey as string;
                return (
                  <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2">
                    <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)} >
                      {col.header as string}
                    </Checkbox>
                  </div>
                )
              })}
          </div>
        </Dropdown>
        <Button
          title="Clear Filters & Reload"
          icon={<TbReload />}
          onClick={onClearAll}
          disabled={!isDataReady}
        />
        <Button
          icon={<TbFilter />}
          onClick={onFilter}
          className="w-full sm:w-auto"
          disabled={!isDataReady}
        >
          Filter{" "}
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-indigo-500 dark:text-gray-100">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button
          icon={<TbCloudUpload />}
          onClick={onExport}
          className="w-full sm:w-auto"
          disabled={!isDataReady}
        >
          Export
        </Button>
      </div>
    </div>
  );
};

// --- Main ActivityLog Component ---
const ActivityLog = () => {
  const dispatch = useAppDispatch();
  const { activityLogsData, status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);
  const location = useLocation()

  const [initialLoading, setInitialLoading] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<ChangeLogItem | null>(null);
  const [blockItem, setBlockItem] = useState<ChangeLogItem | null>(null);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [blockConfirmationOpen, setBlockConfirmationOpen] = useState(false);
  const [isProcessingBlock, setIsProcessingBlock] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "timestamp" }, query: "" });
  const [activeFilters, setActiveFilters] = useState<Partial<FilterFormData>>({});
  const isDataReady = !initialLoading;

  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: activeFilters });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" } });

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);

  const refreshData = useCallback(async () => {
      setInitialLoading(true);
      try {
          await dispatch(getActivityLogAction(location?.state?.userId || 0));
      } catch (error) {
          console.error("Failed to fetch activity logs:", error);
          toast.push(<Notification title="Data Fetch Failed" type="danger">Could not load activity logs.</Notification>);
      } finally {
          setInitialLoading(false);
      }
  }, [dispatch, location?.state?.userId]);

  const onClearAllFilters = useCallback(() => {
    setActiveFilters({});
    filterFormMethods.reset({});
    handleSetTableData({ query: "", pageIndex: 1 });
    refreshData();
  }, [filterFormMethods, handleSetTableData, refreshData]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    filterFormMethods.reset(activeFilters);
  }, [activeFilters, filterFormMethods]);

  const mappedData: ChangeLogItem[] = useMemo(() => (Array.isArray(activityLogsData?.data) ? activityLogsData.data : []), [activityLogsData?.data]);

  const dynamicFilterOptions = useMemo(() => ({
    actions: Array.from(new Set(mappedData.map((log) => log.action))).map((action) => ({ value: action, label: CHANGE_TYPE_OPTIONS.find((o) => o.value === action)?.label || action })),
    entities: Array.from(new Set(mappedData.map((log) => log.entity))).map((entity) => ({ value: entity, label: ENTITY_TYPE_OPTIONS.find((o) => o.value === entity)?.label || entity })),
  }), [mappedData]);

  const { pageData, total, allFilteredAndSortedDataForExport, counts } = useMemo(() => {
    let processedData: ChangeLogItem[] = cloneDeep(mappedData);
    const initialCounts = activityLogsData?.counts || { total: "...", today: "...", failed_login: "...", unique_ip: "...", distinact_ip: "...", suspicious_ip: "..." };

    if (activeFilters.filterAction?.length) { const s = new Set(activeFilters.filterAction.map((o) => o.value)); processedData = processedData.filter((i) => s.has(i.action)); }
    if (activeFilters.filterEntity?.length) { const s = new Set(activeFilters.filterEntity.map((o) => o.value)); processedData = processedData.filter((i) => s.has(i.entity)); }
    if (activeFilters.filterBlockStatus?.length) { const s = new Set(activeFilters.filterBlockStatus.map((o) => parseInt(o.value, 10))); processedData = processedData.filter((i) => s.has(i.is_blocked ?? 0)); }
    if (activeFilters.filterUserName) { const q = activeFilters.filterUserName.toLowerCase(); processedData = processedData.filter((i) => (i.user?.name || i.userName || "").toLowerCase().includes(q)); }
    if (activeFilters.filterDateRange && (activeFilters.filterDateRange[0] || activeFilters.filterDateRange[1])) {
      const [start, end] = activeFilters.filterDateRange;
      const s = start ? start.getTime() : null;
      const e = end ? (() => { const d = new Date(end); d.setHours(23, 59, 59, 999); return d.getTime(); })() : null;
      processedData = processedData.filter((i) => {
        const t = new Date(i.updated_at).getTime();
        if (s && e) return t >= s && t <= e;
        if (s) return t >= s;
        if (e) return t <= e;
        return true;
      });

    }

    const allFilteredData = processedData; // Keep a copy before search
    if (tableData.query) { const q = tableData.query.toLowerCase().trim(); processedData = processedData.filter((i) => Object.values(i).some((v) => String(v ?? '').toLowerCase().includes(q))); }

    const { order, key } = tableData.sort;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any = key === "user" ? a.user?.name || a.userName : a[key as keyof ChangeLogItem];
        let bVal: any = key === "user" ? b.user?.name || b.userName : b[key as keyof ChangeLogItem];
        if (key === "timestamp") { aVal = aVal ? new Date(aVal).getTime() : 0; bVal = bVal ? new Date(bVal).getTime() : 0; }
        if (aVal < bVal) return order === "asc" ? -1 : 1;
        if (aVal > bVal) return order === "asc" ? 1 : -1;
        return 0;
      });
    }
    return {
      pageData: processedData.slice((tableData.pageIndex - 1) * tableData.pageSize, tableData.pageIndex * tableData.pageSize),
      total: processedData.length,
      allFilteredAndSortedDataForExport: allFilteredData, // Export based on filters, not search
      counts: initialCounts
    };
  }, [mappedData, tableData, activeFilters, activityLogsData?.counts]);

  const activeFilterCount = useMemo(() => Object.values(activeFilters).filter(v => v && (!Array.isArray(v) || v.length > 0)).length, [activeFilters]);
  const tableLoading = masterLoadingStatus === "pending" || isProcessingBlock;

  const handleCardClick = (filterType: "action" | "date" | "all", value?: string) => {
    let newFilters: Partial<FilterFormData> = {};
    if (filterType === "all") {
      setActiveFilters({});
      return;
    }

    if (filterType === "action") {
      const option = CHANGE_TYPE_OPTIONS.find((o) => o.value === value);
      if (option) newFilters = { filterAction: [option] };
    } else if (filterType === "date" && value === "today") {
      const now = new Date();
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      newFilters = { filterDateRange: [start, end] };

    }
    setActiveFilters(newFilters);
    handleSetTableData({ pageIndex: 1, query: "" });
  };

  const handleRemoveFilter = useCallback((key: keyof FilterFormData, valueToRemove: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      if (key === "filterDateRange" || key === "filterUserName") {
        delete newFilters[key];
      } else {
        const currentValues = (prev[key] || []) as { value: string }[];
        const newValues = currentValues.filter((item) => item.value !== valueToRemove);
        if (newValues.length > 0) {
          (newFilters as any)[key] = newValues;
        } else {
          delete (newFilters as any)[key];
        }
      }
      return newFilters;
    });
    handleSetTableData({ pageIndex: 1 });
  }, [handleSetTableData]);

  const openViewDialog = useCallback((item: ChangeLogItem) => setViewingItem(item), []);
  const openBlockOrUnblockDialog = useCallback((item: ChangeLogItem) => {
    setBlockItem(item);
    setBlockConfirmationOpen(true);
  }, []);

  const handleConfirmBlock = async () => {
    if (!blockItem?.id || !blockItem?.ip) { toast.push(<Notification title="Error" type="danger">ID or IP Address is missing.</Notification>); setBlockConfirmationOpen(false); return; }
    setIsProcessingBlock(true);
    const isUnblocking = blockItem.is_blocked === 1;
    const actionText = isUnblocking ? 'Unblock' : 'Block';
    try {
      await dispatch(blockUserAction({ activity_log_id: blockItem.id, ip: blockItem.ip })).unwrap();
      toast.push(<Notification title="Success" type="success">{`User/IP ${actionText.toLowerCase()} request sent.`}</Notification>);
      refreshData();
    }
    catch (error: any) {
      toast.push(<Notification title={`${actionText} Failed`} type="danger">{error.message || `Could not ${actionText.toLowerCase()} the user/IP.`}</Notification>);
    }
    finally {
      setIsProcessingBlock(false);
      setBlockConfirmationOpen(false);
      setBlockItem(null);
    }
  };

  const onApplyFiltersSubmit = (data: FilterFormData) => { setActiveFilters(data); handleSetTableData({ pageIndex: 1 }); setIsFilterDrawerOpen(false); };

  const handleOpenExportModal = useCallback(() => { if (!allFilteredAndSortedDataForExport?.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); }, [allFilteredAndSortedDataForExport, exportReasonFormMethods]);

  const handleConfirmExport = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const fileName = `activity_logs_${new Date().toISOString().split("T")[0]}.csv`;
    try { await dispatch(submitExportReasonAction({ reason: data.reason, module: "Activity Log", file_name: fileName })).unwrap(); exportChangeLogsToCsv(fileName, allFilteredAndSortedDataForExport); toast.push(<Notification title="Export Successful" type="success" />); setIsExportReasonModalOpen(false); }
    catch (e: any) { toast.push(<Notification title="Export Failed" type="danger">{e.message || "Error submitting reason."}</Notification>); }
    finally { setIsSubmittingExportReason(false); }
  };

  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const openImageViewer = (imageUrl: string | null | undefined) => {
    if (imageUrl) {
      setImageToView(imageUrl);
      setImageViewerOpen(true);
    }
  };
  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageToView(null);
  };
  const baseColumns: ColumnDef<ChangeLogItem>[] = useMemo(
    () => [
      {
        header: "User",
        accessorKey: "user",
        enableSorting: true,
        size: 180,
        cell: (props) => {
          const { user, userName, is_blocked } = props.row.original;
          return (
            <div className="flex items-center gap-2">
              <Avatar
                src={user?.profile_pic_path || undefined}
                shape="circle"
                size="sm"
                icon={<TbUserCircle />}
                className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                onClick={() =>
                  openImageViewer(user?.profile_pic_path || undefined)
                }
              />

              <div className="text-xs leading-tight">
                <b>{user?.name || userName}</b>
                <p className="text-gray-500">
                  {user?.roles?.[0]?.display_name || "System"}
                </p>
              </div>
              {is_blocked === 1 && (
                <Tooltip title="This IP is blocked for this user">
                  <TbShieldOff className="text-red-500 ml-auto" />
                </Tooltip>
              )}
            </div>
          );
        },
      },
      { header: "Action", accessorKey: "action", size: 120, enableSorting: true, cell: (props) => { const action = props.row.original.action; return (<Tag className={classNames("capitalize bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-b border-emerald-300 dark:border-emerald-700", changeTypeColor[action] || changeTypeColor.OTHER)}>{CHANGE_TYPE_OPTIONS.find((o) => o.value === action)?.label || action}</Tag>); }, },
      { header: "Entity", accessorKey: "entity", size: 180, enableSorting: true },
      { header: "Description", accessorKey: "description", size: 400, enableSorting: false },
      {
        header: "Timestamp",
        accessorKey: 'timestamp',
        size: 160,
        enableSorting: true,
        cell: (props) => {
          const { updated_at } = props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
              updated_at
            ).toLocaleString("en-US", {
              month: "short",
            })} ${new Date(updated_at).getFullYear()}, ${new Date(
              updated_at
            ).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}`
            : "N/A";
          return (
            <div className="text-xs">
              <span className="text-gray-700">{formattedDate}</span>
            </div>
          );
        },
      },
      { header: "Actions", id: "actions", size: 100, meta: { cellClass: "text-center" }, cell: (props) => (
      <ActionColumn onViewDetail={() => openViewDialog(props.row.original)} 
      
      onBlockOrUnblock={() => openBlockOrUnblockDialog(props.row.original)} 
      isBlocked={props.row.original.is_blocked === 1} />), },
    ],
    [openViewDialog, openBlockOrUnblockDialog]
  );

  const [filteredColumns, setFilteredColumns] = useState(baseColumns);
  useEffect(() => { setFilteredColumns(baseColumns); }, [baseColumns]);
  const cardClass = "rounded-lg transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg dark:hover:shadow-gray-900/50";

  const formatTimestamp = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getActionLabel = (actionValue: string) => {
    return CHANGE_TYPE_OPTIONS.find((o) => o.value === actionValue)?.label || actionValue;
  };

  const getEntityLabel = (entityValue: string) => {
    return ENTITY_TYPE_OPTIONS.find((o) => o.value === entityValue)?.label || entityValue;
  };
  interface DetailRowProps {
    label: string;
    children: React.ReactNode;
    className?: string;
  }
  const DetailRow: React.FC<DetailRowProps> = ({ label, children, className }) => (
    <div className={`flex py-1 ${className}`}>
      <span className="font-semibold w-1/3 md:w-1/4 text-gray-500 dark:text-gray-400">{label}:</span>
      <span className="w-2/3 md:w-3/4 break-words text-gray-800 dark:text-gray-200">
        {children === null || children === undefined || children === "" ? "-" : children}
      </span>
    </div>
  );
  interface JsonViewerProps {
    label: string;
    data: string | object | null | undefined;
  }
  const JsonViewer: React.FC<JsonViewerProps> = ({ label, data }) => {
    let content: React.ReactNode = "-";

    if (data) {
      try {
        const parsedJson = typeof data === 'string' ? JSON.parse(data) : data;
        if (typeof parsedJson === 'object' && parsedJson !== null) {
          content = (
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 whitespace-pre-wrap max-h-60 overflow-auto">
              {JSON.stringify(parsedJson, null, 2)}
            </pre>
          );
        }
      } catch {
        content = String(data);
      }
    }

    return (
      <div className="flex flex-col py-1">
        <span className="font-semibold text-gray-500 dark:text-gray-400">{label}:</span>
        {content}
      </div>
    );
  };
  
  const renderCardContent = (
    content: string | number | undefined,
    colorClass: string
  ) => {
    if (initialLoading) {
      return <Skeleton width={50} height={24} />;
    }
    return (
      <h6 className={colorClass}>
        {content ?? "..."}
      </h6>
    );
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="lg:flex items-center justify-between mb-4">
            <h5 className="mb-4 lg:mb-0">Activity Log</h5>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6 gap-3">
            <Tooltip title="Click to clear all filters"><div className={cardClass} onClick={() => handleCardClick("all")}><Card bodyClass="flex gap-2 p-3 items-center" className="rounded-lg border-blue-200 dark:border-blue-700"><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-500 dark:bg-blue-500/20 dark:text-blue-300"><TbActivity size={24} /></div><div>{renderCardContent(counts.total, "text-blue-500 dark:text-blue-300")}<span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by today's logs"><div className={cardClass} onClick={() => handleCardClick("date", "today")}><Card bodyClass="flex gap-2 p-3 items-center" className="rounded-lg border-green-300 dark:border-green-700"><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-green-100 text-green-500 dark:bg-green-500/20 dark:text-green-300"><TbCalendarWeek size={24} /></div><div>{renderCardContent(counts.today, "text-green-500 dark:text-green-300")}<span className="font-semibold text-xs">Today</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by Failed Login action"><div className={cardClass} onClick={() => handleCardClick("action", "Failed Login")}><Card bodyClass="flex gap-2 p-3 items-center" className="rounded-lg border-pink-200 dark:border-pink-700"><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-pink-100 text-pink-500 dark:bg-pink-500/20 dark:text-pink-300"><TbLogin size={24} /></div><div>{renderCardContent(counts.failed_login, "text-pink-500 dark:text-pink-300")}<span className="font-semibold text-xs">Failed Login</span></div></Card></div></Tooltip>
            <Card bodyClass="flex gap-2 p-3 items-center" className="rounded-lg border border-violet-300 dark:border-violet-700 cursor-default"><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-violet-100 text-violet-500 dark:bg-violet-500/20 dark:text-violet-300"><TbCloudPin size={24} /></div><div>{renderCardContent(counts.unique_ip, "text-violet-500 dark:text-violet-300")}<span className="font-semibold text-xs">Unique IP</span></div></Card>
            <Card bodyClass="flex gap-2 p-3 items-center" className="rounded-lg border border-orange-200 dark:border-orange-700 cursor-default"><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-orange-100 text-orange-500 dark:bg-orange-500/20 dark:text-orange-300"><TbCloudCog size={24} /></div><div>{renderCardContent(counts.distinact_ip, "text-orange-500 dark:text-orange-300")}<span className="font-semibold text-xs">Distinct IP</span></div></Card>
            <Card bodyClass="flex gap-2 p-3 items-center" className="rounded-lg border border-red-200 dark:border-red-700 cursor-default"><div className="h-12 w-12 rounded-lg flex items-center justify-center bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-300"><TbCloudExclamation size={24} /></div><div>{renderCardContent(counts.suspicious_ip, "text-red-500 dark:text-red-300")}<span className="font-semibold text-xs">Suspicious</span></div></Card>
          </div>
          <ItemTableTools onSearchChange={(q) => handleSetTableData({ query: q, pageIndex: 1 })} searchValue={tableData.query} onFilter={() => setIsFilterDrawerOpen(true)} onExport={handleOpenExportModal} onClearAll={onClearAllFilters} columns={baseColumns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} isDataReady={isDataReady}/>
          <ActiveFiltersDisplay filterData={activeFilters} onRemoveFilter={handleRemoveFilter} onClearAll={onClearAllFilters} />
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{total !== mappedData.length && (<span>Showing <strong>{total}</strong> matching results of <strong>{mappedData.length}</strong></span>)}</div>
          <div className="mt-1 flex-grow overflow-y-auto">
            <DataTable menuName="activity_log" columns={filteredColumns} data={pageData} loading={initialLoading || tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex, pageSize: tableData.pageSize }} onPaginationChange={(p) => handleSetTableData({ pageIndex: p })} onSelectChange={(s) => handleSetTableData({ pageSize: s, pageIndex: 1 })} onSort={(s) => handleSetTableData({ sort: s })} noData={!initialLoading && pageData.length === 0} />
          </div>
        </AdaptiveCard>
      </Container>

      {/* --- Dialogs & Drawers --- */}
      <Dialog isOpen={!!viewingItem} onClose={() => setViewingItem(null)} width={700} title={`Log Details (ID: ${viewingItem?.id})`}>
        <div className="mt-4">
          {viewingItem && (<div className="mt-6 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-lg border-emerald-300">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-900 dark:text-white">
              Log Details
            </h3>
            <div className="space-y-2 text-sm">
              <DetailRow label="Timestamp">{formatTimestamp(viewingItem.updated_at)}</DetailRow>
              <DetailRow label="User">
                {viewingItem.user ? (
                  <div className="flex items-center gap-2 -my-1">
                    <span>
                      {`${viewingItem.user.name} (${viewingItem.user.roles?.[0]?.display_name || 'N/A'})`}
                    </span>
                  </div>
                ) : (
                  viewingItem.userName || 'System'
                )}
              </DetailRow>
              <DetailRow label="Action">{getActionLabel(viewingItem.action)}</DetailRow>
              <DetailRow label="Entity">{getEntityLabel(viewingItem.entity)}</DetailRow>
              <DetailRow label="Description">{viewingItem.description}</DetailRow>
            </div>
          </div>)}
          <div className="text-right mt-6">
            <Button variant="solid" onClick={() => setViewingItem(null)}>Close</Button>
          </div>
        </div>
      </Dialog>
      <ConfirmDialog
        isOpen={blockConfirmationOpen}
        type={blockItem?.is_blocked === 1 ? 'success' : 'danger'}
        title={`${blockItem?.is_blocked === 1 ? 'Unblock' : 'Block'} User/IP`}
        onClose={() => setBlockConfirmationOpen(false)}
        onCancel={() => setBlockConfirmationOpen(false)}
        onConfirm={handleConfirmBlock}
        loading={isProcessingBlock}
      >
        <p>
          Are you sure you want to <strong>{blockItem?.is_blocked === 1 ? 'unblock' : 'block'}</strong> this user (ID: {blockItem?.userId}) at IP: {blockItem?.ip}?
        </p>
      </ConfirmDialog>
      <Drawer title="Filter Activity Logs" isOpen={isFilterDrawerOpen} onClose={() => setIsFilterDrawerOpen(false)} width={400} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={() => { filterFormMethods.reset({}); setIsFilterDrawerOpen(false); }}>Cancel</Button><Button size="sm" variant="solid" form="filterLogForm" type="submit">Apply</Button></div>}>
        <Form id="filterLogForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Action Types" className="mb-2"><Controller name="filterAction" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select actions..." options={dynamicFilterOptions.actions} {...field} />)} /></FormItem>
          <FormItem label="Entity Types" className="mb-2"><Controller name="filterEntity" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select entities..." options={dynamicFilterOptions.entities} {...field} />)} /></FormItem>
          <FormItem label="Block Status" className="mb-2"><Controller name="filterBlockStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Filter by block status..." options={BLOCK_STATUS_OPTIONS} {...field} />)} /></FormItem>
          <FormItem label="User Name" className="mb-2"><Controller name="filterUserName" control={filterFormMethods.control} render={({ field }) => (<Input {...field} value={field.value || ""} placeholder="Enter user name..." />)} /></FormItem>
          <FormItem label="Date Range" className="mb-2"><Controller name="filterDateRange" control={filterFormMethods.control} render={({ field }) => (<DatePicker.DatePickerRange value={field.value as [Date | null, Date | null] | undefined} onChange={(dates) => field.onChange(dates || [null, null])} placeholder="Start - End" inputFormat="YYYY-MM-DD" />)} /></FormItem>
        </Form>
      </Drawer>
      <Dialog isOpen={isExportReasonModalOpen} title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)}>
        <Form id="exportLogsReasonForm" onSubmit={exportReasonFormMethods.handleSubmit(handleConfirmExport)} className="mt-4">
          <p className="mb-4">Please provide a reason for exporting the activity logs. This action will be logged.</p>
          <FormItem label="Reason" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
        <div className="text-right mt-6">
          <Button size="sm" className="mr-2" onClick={() => setIsExportReasonModalOpen(false)}>Cancel</Button>
          <Button size="sm" variant="solid" form="exportLogsReasonForm" type="submit" loading={isSubmittingExportReason} disabled={!exportReasonFormMethods.formState.isValid}>Submit & Export</Button>
        </div>
      </Dialog>
      <Dialog
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        onRequestClose={closeImageViewer}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        width={600}
      >
        <div className="flex justify-center items-center p-4">
          {imageToView ? (
            <img
              src={imageToView}
              alt="User Profile"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          ) : (
            <p>No image to display.</p>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default ActivityLog;