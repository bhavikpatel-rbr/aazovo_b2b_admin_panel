// src/views/your-path/ExportMapping.tsx

import React, {
  useState,
  useMemo,
  useCallback,
  Suspense,
  lazy,
  useEffect,
} from "react";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";
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
import { IoEyeOutline } from "react-icons/io5";
import { getExportMappingsAction } from "@/reduxtool/master/middleware";
// Icons
import { TbChecks, TbSearch, TbCloudDownload, TbFilter, TbCloudUpload, TbCalendarUp, TbUserUp, TbBookUpload } from "react-icons/tb";
import userIconPlaceholder from "/img/avatars/thumb-1.jpg";
// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import {
  Card,
  Drawer,
  Tag,
  Form,
  FormItem,
  Select,
  DatePicker,
} from "@/components/ui";
import { Controller, useForm } from "react-hook-form";
import { useAppDispatch } from "@/reduxtool/store";

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
  import("react-csv").then((module) => ({ default: module.CSVLink }))
);

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
  user: null;               // This is always null in the new response
};

// --- Frontend Item Type (This remains the same) ---
export type ExportMappingItem = {
  id: number;
  userId: number | null;
  userName: string;
  userRole: string;
  exportFrom: string;
  fileName: string;
  reason: string | null;
  exportDate: Date;
};

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
      userName: apiData.exported_by || "System / Unknown", // Use the top-level 'exported_by' field
      userRole: "N/A", // No role information is provided, so we use a fallback
      exportFrom: apiData.exported_from || "N/A", // Handle empty strings
      fileName: "N/A", // The 'file_name' field is missing, so we use a fallback
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

// --- ExportMappingTableTools Component (No changes needed) ---
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
  isDataReady,
}: {
  onSearchChange: (query: string) => void;
  allExportMappings: ExportMappingItem[];
  onApplyFilters: (filters: Partial<ExportMappingFilterSchema>) => void;
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
          icon={<TbFilter />}
          onClick={openFilterDrawer}
          disabled={!isDataReady}
        >
          Filter
        </Button>
        <Suspense
          fallback={
            <Button loading icon={<TbCloudDownload />} disabled={!isDataReady}>
              Export
            </Button>
          }
        >
          <ExportMappingExport
            allMappings={allExportMappings}
            disabled={!isDataReady || allExportMappings.length === 0}
          />
        </Suspense>
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
              disabled={
                !isDirty &&
                Object.values(getValues()).every((val) =>
                  Array.isArray(val) ? val.length === 0 : val === null
                )
              }
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
                  value={field.value as [Date, Date] | undefined}
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

// --- ExportMappingExport (CSV Export) Component (No changes needed) ---
const ExportMappingExport = ({
  allMappings,
  disabled,
}: {
  allMappings: ExportMappingItem[];
  disabled?: boolean;
}) => {
  const csvData = useMemo(() => {
    return allMappings.map((item) => ({
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
  }, [allMappings]);

  const csvHeaders = [
    { label: "Record ID", key: "id" },
    { label: "User Name", key: "userName" },
    { label: "User Role", key: "userRole" },
    { label: "Exported From Module", key: "exportFrom" },
    { label: "File Name", key: "fileName" },
    { label: "Reason", key: "reason" },
    { label: "Export Date (UTC)", key: "exportDate" },
  ];

  if (disabled || allMappings.length === 0) {
    return (
      <Button icon={<TbCloudDownload />} disabled>
        Export
      </Button>
    );
  }

  return (
    <CSVLink
      filename={`export_mappings_log_${
        new Date().toISOString().split("T")[0]
      }.csv`}
      data={csvData}
      headers={csvHeaders}
      asyncOnClick={true}
      uFEFF={true}
    >
      <Button icon={<TbCloudDownload />}>Export</Button>
    </CSVLink>
  );
};
ExportMappingExport.displayName = "ExportMappingExport";

// --- ExportMappingSelected (Sticky Footer) Component (No changes needed) ---
const ExportMappingSelected = ({
  selectedMappings,
  onDeleteSelected,
  disabled,
}: {
  selectedMappings: ExportMappingItem[];
  onDeleteSelected: () => void;
  disabled?: boolean;
}) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
  };

  if (selectedMappings.length === 0) return null;

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
              <span className="heading-text">{selectedMappings.length}</span>
              <span>
                Record{selectedMappings.length > 1 ? "s" : ""} selected
              </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
              disabled={disabled}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedMappings.length} Record${
          selectedMappings.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected item(s)? This action
          cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};
ExportMappingSelected.displayName = "ExportMappingSelected";

// --- Main ExportMapping Component ---
const ExportMapping = () => {
  const dispatch = useAppDispatch();

  const [exportMappings, setExportMappings] = useState<ExportMappingItem[]>([]);

  const { apiExportMappings = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  useEffect(() => {
    dispatch(getExportMappingsAction());
  }, [dispatch]);

  // --- 3. CORRECTED DATA LOADING LOGIC ---
  useEffect(() => {
    // Process data only when the fetch has 'succeeded'. 
    // Checking for 'idle' is incorrect as it's the initial state before fetching.
    if (masterLoadingStatus === "idle") {
      if (!Array.isArray(apiExportMappings)) {
        console.error("API Error: exportMappingData is not an array:", apiExportMappings);
        toast.push(
          <Notification title="Data Error" type="danger" duration={5000}>
            Received invalid data format for export mappings.
          </Notification>
        );
        setExportMappings([]);
        return;
      }
      const transformedData = (apiExportMappings as ApiExportMapping[])
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
  }, [apiExportMappings, masterLoadingStatus]);

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedMappings, setSelectedMappings] = useState<ExportMappingItem[]>(
    []
  );
  const [activeFilters, setActiveFilters] = useState<
    Partial<ExportMappingFilterSchema>
  >({});
    
  // Let the Redux status drive the loading state for simplicity and accuracy
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
          item.fileName.toLowerCase().includes(query) ||
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
      setSelectedMappings([]);
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

  const handleRowSelect = useCallback(
    (checked: boolean, row: ExportMappingItem) => {
      setSelectedMappings((prev) => {
        if (checked)
          return prev.some((i) => i.id === row.id) ? prev : [...prev, row];
        return prev.filter((i) => i.id !== row.id);
      });
    },
    []
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, currentTableRows: Row<ExportMappingItem>[]) => {
      const currentPageRowOriginals = currentTableRows.map((r) => r.original);
      const currentPageRowIds = new Set(
        currentPageRowOriginals.map((r) => r.id)
      );
      if (checked) {
        setSelectedMappings((prev) => {
          const newItemsToAdd = currentPageRowOriginals.filter(
            (original) => !prev.some((selected) => selected.id === original.id)
          );
          return [...prev, ...newItemsToAdd];
        });
      } else {
        setSelectedMappings((prev) =>
          prev.filter((item) => !currentPageRowIds.has(item.id))
        );
      }
    },
    []
  );

  const handleDeleteSelected = useCallback(() => {
    const idsToDelete = new Set(selectedMappings.map((item) => item.id));
    setExportMappings((prev) =>
      prev.filter((item) => !idsToDelete.has(item.id))
    );
    setSelectedMappings([]);
    toast.push(
      <Notification
        title={`${idsToDelete.size} Record(s) Marked for Deletion`}
        type="success"
        duration={2500}
      >
        This is a UI-only delete for now.
      </Notification>
    );
  }, [selectedMappings]);

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
                  {fileName}
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
              <h6 className="text-blue-500">879</h6>
              <span className="font-semibold text-xs">Total Exports</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-300" >
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
              <TbCalendarUp size={24}/>
            </div>
            <div>
              <h6 className="text-violet-500">879</h6>
              <span className="font-semibold text-xs">Exports Today</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
              <TbUserUp size={24}/>
            </div>
            <div>
              <h6 className="text-pink-500">System Admin</h6>
              <span className="font-semibold text-xs">Top User</span>
            </div>
          </Card>
          <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-200">
            <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
              <TbBookUpload size={24}/>
            </div>
            <div>
              <h6 className="text-green-500">Company</h6>
              <span className="font-semibold text-xs">Top Module</span>
            </div>
          </Card>
        </div>
        <div className="mb-4">
          <ExportMappingTableTools
            onSearchChange={handleSearchChange}
            allExportMappings={exportMappings}
            onApplyFilters={handleApplyFilters}
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
            selectable
            checkboxChecked={(row) =>
              selectedMappings.some((selected) => selected.id === row.id)
            }
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onCheckBoxChange={handleRowSelect}
            onIndeterminateCheckBoxChange={handleAllRowSelect}
          />
        </div>
      </AdaptiveCard>

      <ExportMappingSelected
        selectedMappings={selectedMappings}
        onDeleteSelected={handleDeleteSelected}
        disabled={tableLoading}
      />
    </Container>
  );
};

export default ExportMapping;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}