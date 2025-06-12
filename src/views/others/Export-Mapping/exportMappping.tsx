// src/views/your-path/ExportMapping.tsx

import React, {
  useState,
  useMemo,
  useCallback,
  Suspense,
  useEffect,
  useRef,
} from "react";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CSVLink } from "react-csv";
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
import {
  Card,
  Drawer,
  Tag,
  Form,
  FormItem,
  Select,
  DatePicker,
  Input,
} from "@/components/ui";

// Redux Actions
import { getExportMappingsAction, submitExportReasonAction } from "@/reduxtool/master/middleware";
import { useAppDispatch } from "@/reduxtool/store";

// Icons
import { IoEyeOutline } from "react-icons/io5";
import { TbSearch, TbCloudDownload, TbFilter, TbCloudUpload, TbCalendarUp, TbUserUp, TbBookUpload, TbReload } from "react-icons/tb";
import userIconPlaceholder from "/img/avatars/thumb-1.jpg";

// Types
import type {
  OnSortParam,
  ColumnDef,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";


// --- 1. UPDATED API DATA STRUCTURE TYPES ---
// These types now match your new API response exactly.
export type ApiExportMapping = {
  id: number;
  created_at: string;
  updated_at: string;
  exported_by: string;      // The user's name is here
  exported_from: string;
  reason: string | null;
  deleted_at: string | null;
  user: any;
  roles: any;
  file_name: string | null;              // This is always null in the new response
};

// --- Frontend Item Type (This remains the same) ---
export type ExportMappingItem = {
  id: number;
  userId: number | null;
  userName: string;
  userRole: string;
  exportFrom: string;
  fileName: string | null;
  reason: string | null;
  exportDate: Date;
};

// --- Zod Schema for Export Reason Form (New) ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- 2. REVISED TRANSFORMATION FUNCTION ---
// This function is the core of the fix. It now correctly maps the new API fields.
const transformApiDataToExportMappingItem = (
  apiData: ApiExportMapping
): ExportMappingItem | null => {
  if (!apiData) {
    return null;
  }
  try {
    return {
      id: apiData.id,
      userId: null, // No user ID is provided in the new response
      userName: apiData.user.name || "System / Unknown", // Use the top-level 'exported_by' field
      userRole: apiData.user.roles[0]?.display_name || "N/A", // No role information is provided, so we use a fallback
      exportFrom: apiData.exported_from || "N/A", // Handle empty strings
      fileName: apiData.file_name, // The 'file_name' field is missing, so we use a fallback
      reason: apiData.reason,
      exportDate: new Date(apiData.created_at),
    };
  } catch (error) {
    console.error("Error transforming API data for ID:", apiData.id, error);
    return null;
  }
};

// --- Reusable ActionColumn Component (No changes needed) ---
const ActionColumn = ({ data }: { data: ExportMappingItem }) => {
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState<boolean>(false);
  const openViewDrawer = () => setIsViewDrawerOpen(true);
  const closeViewDrawer = () => setIsViewDrawerOpen(false);

  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";

  return (
    <div className="flex items-center justify-center">
      <Tooltip title="View Record">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          )}
          role="button"
          tabIndex={0}
          onClick={openViewDrawer}
          onKeyDown={(e) => e.key === "Enter" && openViewDrawer()}
        >
          <IoEyeOutline />
        </div>
      </Tooltip>

      <Drawer
        title="Export Mapping Details"
        isOpen={isViewDrawerOpen}
        onClose={closeViewDrawer}
        onRequestClose={closeViewDrawer}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeViewDrawer}
              type="button"
            >
              Close
            </Button>
          </div>
        }
      >
        <div className="px-1">
          <h6 className="text-base font-semibold">Exported By</h6>
          <figure className="flex gap-2 items-center mt-2">
            <img
              src={userIconPlaceholder}
              alt={data.userName}
              className="h-9 w-9 rounded-full"
            />
            <figcaption className="flex flex-col">
              <span className="font-semibold text-black dark:text-white">
                {data.userName}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {data.userRole}
              </span>
            </figcaption>
          </figure>

          <h6 className="text-base font-semibold mt-4">Exported From</h6>
          <p className="mb-2 mt-1">
            <span className="font-semibold text-black dark:text-white">
              Module:{" "}
            </span>
            <span>{data.exportFrom}</span>
          </p>
          {data.exportFrom !== "N/A" && (
            <Tag className="border border-emerald-600 text-emerald-600 bg-transparent inline-block w-auto mt-1">
              {data.exportFrom}
            </Tag>
          )}

          <Card className="!mt-8 bg-gray-100 dark:bg-gray-700 border-none p-4">
            <h6 className="text-base font-semibold">Exported Log</h6>
            <p className="mt-2">
              <span className="font-semibold text-black dark:text-white">
                Date:{" "}
              </span>
              <span>
                {!isNaN(data.exportDate.getTime())
                  ? data.exportDate.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Invalid Date"}
              </span>
            </p>
            <p className="mt-1">
              <span className="font-semibold text-black dark:text-white">
                File Name:{" "}
              </span>
              <span className="break-all">{data.fileName}</span>
            </p>
            {data.reason && (
              <>
                <h6 className="text-sm font-semibold text-black dark:text-white mt-2">
                  Reason:
                </h6>
                <p className="whitespace-pre-wrap">{data.reason}</p>
              </>
            )}
          </Card>
        </div>
      </Drawer>
    </div>
  );
};
ActionColumn.displayName = "ActionColumn";

// --- ExportMappingTableTools Component (Modified) ---
type ExportMappingFilterSchema = {
  userRole: string[];
  exportFrom: string[];
  fileExtensions: string[];
  exportDate: [Date | null, Date | null] | null;
};

const ExportMappingTableTools = ({
  onSearchChange,
  allExportMappings,
  onApplyFilters,
  onClearFilters, // <-- Added prop
  onExport,
  isDataReady,
}: {
  onSearchChange: (query: string) => void;
  allExportMappings: ExportMappingItem[];
  onApplyFilters: (filters: Partial<ExportMappingFilterSchema>) => void;
  onClearFilters: () => void; // <-- Added prop type
  onExport: () => void;
  isDataReady: boolean;
}) => {

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const openFilterDrawer = () => setIsFilterDrawerOpen(true);

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty },
  } = useForm<ExportMappingFilterSchema>({
    defaultValues: {
      userRole: [],
      exportFrom: [],
      fileExtensions: [],
      exportDate: null,
    },
  });

  const exportFiltersSubmitHandler = (data: ExportMappingFilterSchema) => {
    onApplyFilters(data);
    closeFilterDrawer();
  };

   const handleClearFilters = () => {
    reset({
      userRole: [],
      exportFrom: [],
      fileExtensions: [],
      exportDate: null,
    });
    onApplyFilters({});
    setIsFilterDrawerOpen(false);
  };
  const handleClearInternal = () => {
    reset({
      userRole: [],
      exportFrom: [],
      fileExtensions: [],
      exportDate: null,
    });
    onApplyFilters({}); // Call parent clear function
  };

  const userRoles = useMemo(() => {
    if (!isDataReady || !allExportMappings || allExportMappings.length === 0)
      return [];
    const roles = new Set(
      allExportMappings.map((item) => item.userRole).filter(Boolean)
    );
    return Array.from(roles)
      .sort()
      .map((role) => ({ value: role, label: role }));
  }, [allExportMappings, isDataReady]);

  const exportFromOptions = useMemo(() => {
    if (!isDataReady || !allExportMappings || allExportMappings.length === 0)
      return [];
    const froms = new Set(
      allExportMappings.map((item) => item.exportFrom).filter(Boolean)
    );
    return Array.from(froms)
      .sort()
      .map((from) => ({ value: from, label: from }));
  }, [allExportMappings, isDataReady]);

  const fileExtensionsOptions = useMemo(
    () => [
      { value: ".csv", label: "CSV (.csv)" },
      { value: ".xlsx", label: "Excel (.xlsx)" },
      { value: ".json", label: "JSON (.json)" },
      { value: ".pdf", label: "PDF (.pdf)" },
      { value: ".log", label: "Log (.log)" },
      { value: ".bak", label: "Backup (.bak)" },
    ],
    []
  );

  return (
    <div className="md:flex items-center justify-between w-full gap-2">
      <div className="flex-grow mb-2 md:mb-0">
        <DebouceInput
          placeholder="Quick Search..."
          suffix={<TbSearch className="text-lg" />}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onSearchChange(e.target.value)
          }
        />
      </div>
      <div className="flex gap-2">
        <Button
        title="Clear Filters"
        icon={<TbReload />}
        onClick={onClearFilters}
        disabled={!isDataReady}
        />
        <Button
          icon={<TbFilter />}
          onClick={openFilterDrawer}
          disabled={!isDataReady}
        >
          Filter
        </Button>
        <Button
          icon={<TbCloudDownload />}
          onClick={onExport}
          disabled={!isDataReady || allExportMappings.length === 0}
        >
          Export
        </Button>
      </div>
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        bodyClass="flex flex-col overflow-hidden"
        footer={
          <div className="text-right w-full ">
            <Button
              size="sm"
              className="mr-2"
              onClick={handleClearFilters}
              type="button"
            >
              Clear
            </Button>
            <Button size="sm" variant="solid" type="submit" form="filterForm">
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterForm"
          size="sm"
          onSubmit={handleSubmit(exportFiltersSubmitHandler)}
        >
          <FormItem label="User Role">
            <Controller
              control={control}
              name="userRole"
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select roles"
                  options={userRoles}
                  value={userRoles.filter((option) =>
                    field.value?.includes(option.value)
                  )}
                  onChange={(selected) =>
                    field.onChange(
                      selected ? selected.map((opt) => opt.value) : []
                    )
                  }
                  isLoading={!isDataReady && userRoles.length === 0}
                />
              )}
            />
          </FormItem>
          <FormItem label="Exported From (Module)">
            <Controller
              control={control}
              name="exportFrom"
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select modules"
                  options={exportFromOptions}
                  value={exportFromOptions.filter((option) =>
                    field.value?.includes(option.value)
                  )}
                  onChange={(selected) =>
                    field.onChange(
                      selected ? selected.map((opt) => opt.value) : []
                    )
                  }
                  isLoading={!isDataReady && exportFromOptions.length === 0}
                />
              )}
            />
          </FormItem>
          <FormItem label="File Type (Extension)">
            <Controller
              control={control}
              name="fileExtensions"
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select file types"
                  options={fileExtensionsOptions}
                  value={fileExtensionsOptions.filter((option) =>
                    field.value?.includes(option.value)
                  )}
                  onChange={(selected) =>
                    field.onChange(
                      selected ? selected.map((opt) => opt.value) : []
                    )
                  }
                />
              )}
            />
          </FormItem>
          <FormItem label="Export Date Range">
            <Controller
              control={control}
              name="exportDate"
              render={({ field }) => (
                <DatePicker.DatePickerRange
                  placeholder="Select date range"
                  value={field.value ?? undefined} // <-- FIX: Removed incorrect type casting
                  onChange={(dateRange) => field.onChange(dateRange)}
                  inputFormat="MM/DD/YYYY"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
    </div>
  );
};
ExportMappingTableTools.displayName = "ExportMappingTableTools";


// --- Main ExportMapping Component (Heavily Modified) ---
const ExportMapping = () => {
  const dispatch = useAppDispatch();
  const csvLinkRef = useRef<any>(null);

  const [exportMappings, setExportMappings] = useState<ExportMappingItem[]>([]);
  const { apiExportMappings = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);
  
  // State for the new export modal
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [exportData, setExportData] = useState<{data: any[], filename: string}>({
      data: [],
      filename: ''
  });

  // Form setup for the export reason modal
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  useEffect(() => {
    dispatch(getExportMappingsAction());
  }, [dispatch]);

  // --- 3. CORRECTED DATA LOADING LOGIC ---
  useEffect(() => {
    if (masterLoadingStatus === "idle") {
      if (!Array.isArray(apiExportMappings?.data)) {
        console.error("API Error: exportMappingData is not an array:", apiExportMappings?.data);
        toast.push(
          <Notification title="Data Error" type="danger" duration={5000}>
            Received invalid data format for export mappings.
          </Notification>
        );
        setExportMappings([]);
        return;
      }
      const transformedData = (apiExportMappings?.data as ApiExportMapping[])
        .map(transformApiDataToExportMappingItem)
        .filter((item): item is ExportMappingItem => item !== null);
      
      setExportMappings(transformedData);
    } else if (masterLoadingStatus === 'failed') {
        toast.push(
          <Notification title="Failed to Load Data" type="danger" duration={4000}>
            There was an error fetching the export logs.
          </Notification>
        );
        setExportMappings([]);
    }
  }, [apiExportMappings?.data, masterLoadingStatus]);

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });

  const [activeFilters, setActiveFilters] = useState<
    Partial<ExportMappingFilterSchema>
  >({});
    
  const tableLoading = masterLoadingStatus === 'loading';
  const isDataReady = masterLoadingStatus === 'idle';

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    if (!isDataReady) {
      return { pageData: [], total: 0, allFilteredAndSortedData: [] };
    }
    let processedData = [...exportMappings];

    // Filtering logic (no changes needed here, it works on transformed data)
    if (activeFilters.userRole && activeFilters.userRole.length > 0) {
      const roles = new Set(activeFilters.userRole);
      processedData = processedData.filter((item) => roles.has(item.userRole));
    }
    if (activeFilters.exportFrom && activeFilters.exportFrom.length > 0) {
      const froms = new Set(activeFilters.exportFrom);
      processedData = processedData.filter((item) =>
        froms.has(item.exportFrom)
      );
    }
    if (
      activeFilters.fileExtensions &&
      activeFilters.fileExtensions.length > 0
    ) {
      const extensions = new Set(
        activeFilters.fileExtensions.map((ext) => ext.toLowerCase())
      );
      processedData = processedData.filter((item) => {
        if (!item.fileName) return false;
        const fileExt = item.fileName
          .slice(item.fileName.lastIndexOf("."))
          .toLowerCase();
        return extensions.has(fileExt);
      });
    }
    if (activeFilters.exportDate) {
      const [startDate, endDate] = activeFilters.exportDate;
      processedData = processedData.filter((item) => {
        if (isNaN(item.exportDate.getTime())) return false;
        const itemTime = item.exportDate.getTime();
        const start = startDate
          ? new Date(new Date(startDate).setHours(0, 0, 0, 0)).getTime()
          : null;
        const end = endDate
          ? new Date(new Date(endDate).setHours(23, 59, 59, 999)).getTime()
          : null;
        if (start && end) return itemTime >= start && itemTime <= end;
        if (start) return itemTime >= start;
        if (end) return itemTime <= end;
        return true;
      });
    }

    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      processedData = processedData.filter(
        (item) =>
          item.id.toString().includes(query) ||
          item.userName.toLowerCase().includes(query) ||
          item.userRole.toLowerCase().includes(query) ||
          item.exportFrom.toLowerCase().includes(query) ||
          (item.fileName && item.fileName.toLowerCase().includes(query)) ||
          // item.fileName.toLowerCase().includes(query) ||
          (item.reason && item.reason.toLowerCase().includes(query))
      );
    }
    
    // Sorting logic (no changes needed)
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      processedData.length > 0 &&
      processedData[0].hasOwnProperty(key)
    ) {
      processedData.sort((a, b) => {
        let aValue = a[key as keyof ExportMappingItem];
        let bValue = b[key as keyof ExportMappingItem];

        if (key === "exportDate") {
          const timeA = !isNaN((aValue as Date)?.getTime())
            ? (aValue as Date).getTime()
            : order === "asc"
            ? Infinity
            : -Infinity;
          const timeB = !isNaN((bValue as Date)?.getTime())
            ? (bValue as Date).getTime()
            : order === "asc"
            ? Infinity
            : -Infinity;
          return order === "asc" ? timeA - timeB : timeB - timeA;
        }
        if (
          key === "id" &&
          typeof aValue === "number" &&
          typeof bValue === "number"
        ) {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }

        aValue =
          aValue === null || aValue === undefined
            ? ""
            : String(aValue).toLowerCase();
        bValue =
          bValue === null || bValue === undefined
            ? ""
            : String(bValue).toLowerCase();
        return order === "asc"
          ? (aValue as string).localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue as string);
      });
    }

    const dataTotal = processedData.length;
    const allDataForExport = [...processedData];

    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

    return {
      pageData: dataForPage,
      total: dataTotal,
      allFilteredAndSortedData: allDataForExport,
    };
  }, [exportMappings, tableData, activeFilters, isDataReady]);

  // Effect to trigger CSV download when exportData is set
  useEffect(() => {
    if (exportData.data.length > 0 && exportData.filename && csvLinkRef.current) {
        csvLinkRef.current.link.click();
        setExportData({ data: [], filename: '' }); // Reset after click
    }
  }, [exportData]);

  const handleSetTableData = useCallback(
    (
      data: Partial<TableQueries> | ((prevState: TableQueries) => TableQueries)
    ) => {
      setTableData((prev) =>
        typeof data === "function" ? data(prev) : { ...prev, ...data }
      );
    },
    []
  );

  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
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
  const handleApplyFilters = useCallback(
    (filters: Partial<ExportMappingFilterSchema>) => {
      setActiveFilters(filters);
      handleSetTableData({ pageIndex: 1 });
    },
    [handleSetTableData]
  );

  // --- Export Modal Logic (New) ---
  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(
        <Notification title="No Data" type="info">
          There is no data to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };
  
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Export Mapping Log";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `export_mappings_log_${timestamp}.csv`;
  
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: moduleName,
          file_name: fileName,
        })
      ).unwrap();
  
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      
      const dataToExport = allFilteredAndSortedData.map((item) => ({
          id: item.id,
          userName: item.userName,
          userRole: item.userRole,
          exportFrom: item.exportFrom,
          fileName: item.fileName,
          reason: item.reason || "",
          exportDate: !isNaN(item.exportDate.getTime())
              ? item.exportDate.toISOString()
              : "Invalid Date",
      }));

      setExportData({ data: dataToExport, filename: fileName });
      setIsExportReasonModalOpen(false);

    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Submit Reason" type="danger" message={error.message} />
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };
  
  const csvHeaders = useMemo(() => [
    { label: "Record ID", key: "id" },
    { label: "User Name", key: "userName" },
    { label: "User Role", key: "userRole" },
    { label: "Exported From Module", key: "exportFrom" },
    { label: "File Name", key: "fileName" },
    { label: "Reason", key: "reason" },
    { label: "Export Date (UTC)", key: "exportDate" },
  ], []);


  const columns: ColumnDef<ExportMappingItem>[] = useMemo(
    () => [
      {
        header: "Exported By",
        accessorKey: "userName",
        enableSorting: true,
        size: 200,
        cell: (props) => {
          const { userName, userRole } = props.row.original;
          return (
            <div className="flex items-center gap-2">
              <img
                src={userIconPlaceholder}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <span className="font-semibold block truncate max-w-[150px]">
                  {userName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                  {userRole}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Exported From",
        accessorKey: "exportFrom",
        enableSorting: true,
        size: 220,
        cell: (props) => {
          const { exportFrom, fileName } = props.row.original;
          return (
            <div className="flex flex-col">
              <span className="font-semibold truncate max-w-[180px]">
                {exportFrom}
              </span>
              <Tooltip title={fileName} placement="top">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px] block">
                  {fileName || "N/A"}
                </span>
              </Tooltip>
            </div>
          );
        },
      },
      {
        header: "Reason",
        accessorKey: "reason",
        enableSorting: false,
        size: 250,
        cell: (props) => (
          <Tooltip title={props.row.original.reason || ""} placement="top">
            <span className="truncate block max-w-[230px]">
              {props.row.original.reason || "–"}
            </span>
          </Tooltip>
        ),
      },
      {
        header: "Date",
        accessorKey: "exportDate",
        enableSorting: true,
        size: 180,
        cell: (props) => {
          const date = props.row.original.exportDate;
          return (
            <span>
              {!isNaN(date.getTime())
                ? date.toLocaleString([], {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Invalid Date"}
            </span>
          );
        },
      },
      {
        header: "Action",
        id: "action",
        size: 80,
        meta: { cellClass: "text-center" },
        cell: (props) => <ActionColumn data={props.row.original} />,
      },
    ],
    []
  );

  return (
    <>
    <Container className="h-auto">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Export Mapping Log</h5>
        </div>
        <div className="grid grid-cols-4 mb-4 gap-2">
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
              <TbCloudUpload size={24}/>
            </div>
            <div>
              <h6 className="text-blue-500">{apiExportMappings?.counts?.today}</h6>
              <span className="font-semibold text-xs">Total Exports</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-300" >
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
              <TbCalendarUp size={24}/>
            </div>
            <div>
              <h6 className="text-violet-500">{apiExportMappings?.counts?.today}</h6>
              <span className="font-semibold text-xs">Exports Today</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
              <TbUserUp size={24}/>
            </div>
            <div>
              <h6 className="text-pink-500">{apiExportMappings?.counts?.top_user}</h6>
              <span className="font-semibold text-xs">Top User</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
              <TbBookUpload size={24}/>
            </div>
            <div>
              <h6 className="text-green-500">{apiExportMappings?.counts?.top_module}</h6>
              <span className="font-semibold text-xs">Top Module</span>
            </div>
          </Card>
        </div>
        <div className="mb-4">
          <ExportMappingTableTools
            onSearchChange={handleSearchChange}
            allExportMappings={exportMappings}
            onApplyFilters={handleApplyFilters}
            onExport={handleOpenExportReasonModal} // <-- Pass handler to tools
            isDataReady={isDataReady}
          />
        </div>

        <div className="flex-grow overflow-auto">
          <DataTable
            columns={columns}
            data={pageData}
            loading={tableLoading}
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

        {/* Hidden CSVLink for programmatic download */}
        <CSVLink
            ref={csvLinkRef}
            data={exportData.data}
            headers={csvHeaders}
            filename={exportData.filename}
            className="hidden"
            uFEFF={true}
        />
    </Container>

    {/* Export Reason Modal */}
    <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(
            handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
        cancelText="Cancel"
        confirmButtonProps={{
            disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason,
        }}
    >
        <Form
            id="exportReasonForm"
            onSubmit={(e) => {
                e.preventDefault();
                exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)();
            }}
            className="flex flex-col gap-4 mt-2"
        >
            <FormItem
                label="Please provide a reason for exporting this data:"
                invalid={!!exportReasonFormMethods.formState.errors.reason}
                errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
            >
                <Controller
                    name="reason"
                    control={exportReasonFormMethods.control}
                    render={({ field }) => (
                        <Input textArea
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

export default ExportMapping;