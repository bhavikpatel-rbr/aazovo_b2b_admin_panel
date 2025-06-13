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
  TbCloudPin,
  TbCloudExclamation,
  TbCloudCog,
  TbCancel,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import { getActivityLogAction, submitExportReasonAction } from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define Item Type & Constants ---
type ChangeType =
  | "Add"
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

export type User = {
  id: number;
  name: string;
  email: string;
  profile_pic_path: string | null;
};

export type ChangeLogItem = {
  id: string | number;
  timestamp: string;
  userName: string; // Fallback if user object is null
  userId: string | null;
  action: ChangeType;
  entity: entity;
  entityId: string | null;
  description: string;
  details?: string;
  updated_at?: string;
  updated_by_user?: string;
  updated_by_role?: string;
  user: User | null;
};

const changeTypeColor: any = {
  Add: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  Update: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100",
  Delete: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  Login: "bg-lime-100 text-lime-700 dark:bg-lime-500/20 dark:text-lime-100",
  Logout: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
  System:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-100",
  Other: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-100",
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

// Corrected conceptual action to match reference
// const submitExportReasonAction = (payload: {
//   reason: string;
//   module: string;
//   file_name?: string; // Add file_name property
// }) => {
//   console.log("Dispatching conceptual submitExportReasonAction with:", payload);
//   return { type: "master/submitExportReason/pending" };
// };

// --- CSV Exporter Utility ---
const CSV_HEADERS_LOG = [
  "ID",
  "Timestamp",
  "User Name",
  "User ID",
  "User Email",
  "Action Type",
  "Entity Type",
  "Entity ID",
  "Description",
  "Details",
  "Updated At",
  "Updated By Name",
  "Updated By Role",
];
type ChangeLogExportItem = Omit<
  ChangeLogItem,
  "timestamp" | "updated_at" | "user"
> & {
  timestamp_formatted?: string;
  updated_at_formatted?: string;
  user_name_export: string;
  user_id_export: string | number;
  user_email_export: string;
};
const CSV_KEYS_LOG_EXPORT: (keyof ChangeLogExportItem)[] = [
  "id",
  "timestamp_formatted",
  "user_name_export",
  "user_id_export",
  "user_email_export",
  "action",
  "entity",
  "entityId",
  "description",
  "details",
  "updated_at_formatted",
  "updated_by_user",
  "updated_by_role",
];

function exportChangeLogsToCsv(filename: string, rows: ChangeLogItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }

  const transformedRows: ChangeLogExportItem[] = rows.map((row) => ({
    timestamp_formatted: row.timestamp
      ? new Date(row.timestamp).toLocaleString()
      : "N/A",
    details: row.details || "N/A",
    userId: row.userId || "N/A",
    entityId: row.entityId || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
    updated_by_user: row.updated_by_user || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    user_name_export: row.user?.name || row.userName || "N/A",
    user_id_export: row.user?.id || row.userId || "N/A",
    user_email_export: row.user?.email || "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_LOG.join(separator) +
    "\n" +
    transformedRows
      .map((row) =>
        CSV_KEYS_LOG_EXPORT.map((k) => {
          let cell = row[k as keyof ChangeLogExportItem];
          if (cell === null || cell === undefined) {
            cell = "";
          } else {
            cell = String(cell).replace(/"/g, '""');
          }
          if (String(cell).search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
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
  onBlock,
}: {
  onViewDetail: () => void;
  onBlock: () => void;
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
    <Tooltip title="Block Activity">
      <button
        className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`}
        role="button"
        onClick={onBlock}
      >
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
      <ChangeLogsSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Tooltip title="Clear All Filters & Search">
        <Button icon={<TbReload />} onClick={onClearFilters} />
      </Tooltip>
      <Button
        icon={<TbFilter />}
        className="w-full sm:w-auto"
        onClick={onFilter}
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
  const { activityLogsData, status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector, shallowEqual);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<ChangeLogItem | null>(null);
  const [blockItem, setBlockItem] = useState<ChangeLogItem | null>(null);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);
  const [blockConfirmationOpen, setBlockConfirmationOpen] = useState(false);
  const handleCanceBlock = () => setBlockConfirmationOpen(false);
  const [isBlock, setIsBlock] = useState(false); // Commented out
  const handleConfirmBlock = () => {
    handleBlockSelected();
    setBlockConfirmationOpen(false);
  };

  const handleBlockSelected = async () => {
    setBlockConfirmationOpen(false);
    try {
      // await dispatch(deleteAllCurrencyAction({ ids: idsToDelete.join(',') })).unwrap(); // selectedItems commented
      // toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{validItemsToDelete.length} currency(ies) successfully processed for deletion.</Notification>); // selectedItems commented
    } catch (error: any) {
      // toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || "Failed to delete selected currencies."}</Notification>);
    } finally {
      // setSelectedItems([]); // selectedItems commented
      // dispatch(getCurrencyAction());
      // setIsBlock(false);
    }
  };
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
    filterFormSchema.parse({})
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "timestamp" },
    query: "",
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

  const actionTypeOptions = useMemo(() => {
    if (!Array.isArray(activityLogsData?.data)) return [];
    const uniqueNames = new Set(
      activityLogsData?.data.map((actionType) => actionType.action)
    );
    return Array.from(uniqueNames).map((action) => ({
      value: action,
      label: action,
    }));
  }, [activityLogsData]);

  const entityTypeOptions = useMemo(() => {
    if (!Array.isArray(activityLogsData?.data)) return [];
    const uniqueNames = new Set(
      activityLogsData?.data.map((entityType) => entityType.entity)
    );
    return Array.from(uniqueNames).map((entity) => ({
      value: entity,
      label: entity,
    }));
  }, [activityLogsData]);

  useEffect(() => {
    // @ts-ignore // conceptual action
    dispatch(getActivityLogAction({ params: {} }));
  }, [dispatch]);

  const openViewDialog = useCallback(
    (item: ChangeLogItem) => setViewingItem(item),
    []
  );

  const openBlockDialog = useCallback(
    (item: ChangeLogItem) => {
      setBlockItem(item);
      setBlockConfirmationOpen(true);
    },
    []
  );
  const closeViewDialog = useCallback(() => setViewingItem(null), []);

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
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
  }, [filterFormMethods]);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
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

  // *** CENTRAL DATA PROCESSING LOGIC ***
  const { pageData, total, allFilteredAndSortedDataForExport } = useMemo(() => {
    const sourceData: ChangeLogItem[] = Array.isArray(activityLogsData?.data)
      ? activityLogsData.data
      : [];
    let processedData: ChangeLogItem[] = cloneDeep(sourceData);

    // 1. Apply Filters
    if (filterCriteria.filteraction?.length) {
      const actions = filterCriteria.filteraction.map((opt) => opt.value);
      processedData = processedData.filter((item) =>
        actions.includes(item.action)
      );
    }
    if (filterCriteria.filterentity?.length) {
      const entities = filterCriteria.filterentity.map((opt) => opt.value);
      processedData = processedData.filter((item) =>
        entities.includes(item.entity)
      );
    }
    if (filterCriteria.filterUserName) {
      const nameQuery = filterCriteria.filterUserName.toLowerCase();
      processedData = processedData.filter((item) =>
        (item.user?.name || item.userName || "")
          .toLowerCase()
          .includes(nameQuery)
      );
    }
    if (
      filterCriteria.filterDateRange &&
      (filterCriteria.filterDateRange[0] || filterCriteria.filterDateRange[1])
    ) {
      const [startDate, endDate] = filterCriteria.filterDateRange;
      const start = startDate
        ? new Date(startDate.setHours(0, 0, 0, 0)).getTime()
        : null;
      const end = endDate
        ? new Date(endDate.setHours(23, 59, 59, 999)).getTime()
        : null;
      processedData = processedData.filter((item) => {
        const itemTime = new Date(item.timestamp).getTime();
        if (start && end) return itemTime >= start && itemTime <= end;
        if (start) return itemTime >= start;
        if (end) return itemTime <= end;
        return true;
      });
    }

    // 2. Apply Search Query
    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          (item.user?.name || item.userName || "")
            .toLowerCase()
            .includes(query) ||
          (item.action || "").toLowerCase().includes(query) ||
          (item.entity || "").toLowerCase().includes(query) ||
          (item.entityId || "").toLowerCase().includes(query) ||
          (item.description || "").toLowerCase().includes(query)
      );
    }

    // 3. Apply Sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === "user") {
          aVal = a.user?.name || a.userName || "";
          bVal = b.user?.name || b.userName || "";
        } else if (key === "timestamp" || key === "updated_at") {
          const dateA = a[key] ? new Date(a[key]!).getTime() : 0;
          const dateB = b[key] ? new Date(b[key]!).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          aVal = a[key as keyof ChangeLogItem] ?? "";
          bVal = b[key as keyof ChangeLogItem] ?? "";
        }
        return order === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    // 4. Paginate
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const paginatedData = processedData.slice(
      startIndex,
      startIndex + pageSize
    );

    return {
      pageData: paginatedData,
      total: currentTotal,
      allFilteredAndSortedDataForExport: processedData,
    };
  }, [activityLogsData?.data, tableData, filterCriteria]);

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

  // --- CORRECTED EXPORT HANDLER ---
  const handleConfirmExportWithReason =
    async (data: ExportReasonFormData) => {
      setIsSubmittingExportReason(true);
      const moduleName = "Activity Log";

      // 1. Generate dynamic filename
      const timestamp = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const fileName = `activity_logs_export_${timestamp}.csv`;

      try {
        // 2. Dispatch action with the filename
        // @ts-ignore // conceptual action
        await dispatch(
          submitExportReasonAction({
            reason: data.reason,
            module: moduleName,
            file_name: fileName, // <-- Pass filename to action
          })
        ).unwrap();

        // 3. Call export utility with the same dynamic filename
        const success = exportChangeLogsToCsv(
          fileName,
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
    };

  const columns: ColumnDef<ChangeLogItem>[] = useMemo(
    () => [
      {
        header: "Timestamp",
        size: 180,
        enableSorting: true,
        cell: (props) => {
          const { updated_at } = props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", {
                month: "short"
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
      {
        header: "User",
        accessorKey: "user",
        enableSorting: true,
        size: 160,
        cell: (props) => {
          const rowData = props.row.original;
          const user = rowData.user || {};
          const userName = user.name || rowData.userName || "Unknown";
          const userRole = user.roles[0].display_name || "System";
          const avatarSrc = user.profile_pic_path;
          return (
            <div className="flex items-center gap-2">
              <Avatar
                size={28}
                shape="circle"
                src={avatarSrc}
                icon={<TbUserCircle />}
              />
              <div className="text-xs leading-tight">
                <b>{userName}</b>
                <p className="text-gray-500">{userRole}</p>
              </div>
            </div>
          );
        },
      },
      {
        header: "Action",
        accessorKey: "action",
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
        accessorKey: "entity",
        size: 150,
        enableSorting: true,
        cell: (props) => (
          <div className="text-xs leading-tight">
            <div className="text-gray-500">{props.row.original.entity}</div>
          </div>
        ),
      },
      {
        header: "Description",
        accessorKey: "description",
        enableSorting: false,
        cell: (props) => (
          <div className="text-xs whitespace-pre-wrap break-words max-w-[400px]">
            {props.row.original.description || "-"}
          </div>
        ),
      },
      {
        header: "Actions",
        id: "action",
        size: 130,
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onViewDetail={() => openViewDialog(props.row.original)}
            onBlock={() => openBlockDialog(props.row.original)}
          />
        ),
      },
    ],
    [openViewDialog, openBlockDialog]
  );

  const tableIsLoading =
    masterLoadingStatus === "loading" || masterLoadingStatus === "pending";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Activity Log</h5>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-blue-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbActivity size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">
                  {activityLogsData?.counts?.total ?? "..."}
                </h6>
                <span className="font-semibold text-xs">Total</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-green-300"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbCalendarWeek size={24} />
              </div>
              <div>
                <h6 className="text-green-500">
                  {activityLogsData?.counts?.today ?? "..."}
                </h6>
                <span className="font-semibold text-xs">Today</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-pink-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                <TbLogin size={24} />
              </div>
              <div>
                <h6 className="text-pink-500">
                  {activityLogsData?.counts?.failed_login ?? "..."}
                </h6>
                <span className="font-semibold text-xs">Failed Login</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-violet-300"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbCloudPin size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">
                  {activityLogsData?.counts?.unique_ip ?? "..."}
                </h6>
                <span className="font-semibold text-xs">Unique IP</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-orange-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbCloudCog size={24} />
              </div>
              <div>
                <h6 className="text-orange-500">
                  {activityLogsData?.counts?.distinact_ip ?? "..."}
                </h6>
                <span className="font-semibold text-xs">Distinct IP</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-red-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbCloudExclamation size={24} />
              </div>
              <div>
                <h6 className="text-red-500">
                  {activityLogsData?.counts?.suspicious_ip ?? "..."}
                </h6>
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
              data={pageData}
              loading={tableIsLoading}
              pagingData={{
                total: total,
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
                if ((key === "timestamp" || key === "updated_at" || key === "created_at") && value) {
                  const date = new Date(value);
                  const day = date.getDate();
                  const month = date.toLocaleString("en-US", { month: "short" });
                  const year = date.getFullYear();
                  const time = date.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });
                  value = `${day} ${month} ${year}, ${time}`;
                }
                else if (key === "user" && value)
                  value = `${(value as User).name} (${(value as User)?.roles[0]?.display_name})`;
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
                  try {
                    const p = JSON.parse(value);
                    if (typeof p === "object" && p !== null) {
                      return (
                        <div key={key} className="flex flex-col">
                          <span className="font-semibold">{label}:</span>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 whitespace-pre-wrap max-h-40 overflow-auto">
                            {JSON.stringify(p, null, 2) || "-"}
                          </pre>
                        </div>
                      );
                    }
                  } catch {}
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
          <Button variant="solid" onClick={closeViewDialog}>
            Close
          </Button>
        </div>
      </Dialog>
      <ConfirmDialog
        isOpen={blockConfirmationOpen}
        type="danger"
        title={`Block ${blockItem?.entity + "-" + blockItem?.action} Activity!`}
        onClose={handleCanceBlock}
        onRequestClose={handleCanceBlock}
        onCancel={handleCanceBlock}
        onConfirm={handleConfirmBlock}
        loading={isBlock}
      >
        <p>
          Are you sure you want to block this{" "}
          {blockItem?.entity + "-" + blockItem?.action} This action.
        </p>
      </ConfirmDialog>
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
                onClick={() => {
                  onClearFilters();
                  setIsFilterDrawerOpen(false);
                }}
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
                  options={actionTypeOptions}
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
                  options={entityTypeOptions}
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