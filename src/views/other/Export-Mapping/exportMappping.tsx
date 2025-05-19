// src/views/your-path/ExportMapping.tsx

import React, {
  useState,
  useMemo,
  useCallback,
  Ref,
  Suspense,
  lazy,
  useEffect,
} from "react";
// import { Link, useNavigate } from 'react-router-dom' // useNavigate not used directly in this component
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";
// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
// import Dialog from '@/components/ui/Dialog' // Keep if needed for future edit modals
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";
import DebouceInput from "@/components/shared/DebouceInput";
import { IoEyeOutline } from "react-icons/io5";
import { getExportMappingsAction } from "@/reduxtool/master/middleware";
// Icons
import { TbChecks, TbSearch, TbCloudDownload, TbFilter } from "react-icons/tb";
import userIconPlaceholder from "/img/avatars/thumb-1.jpg"; // Generic placeholder
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
  // Input, // Input not directly used in this form, DebounceInput is
  Select,
  DatePicker,
} from "@/components/ui";
import { Controller, useForm } from "react-hook-form";
// import { DatePickerRangeProps } from '@/components/ui/DatePicker/DatePickerRange' // Not directly used if DatePickerRange handles its own props
import { useAppDispatch } from "@/reduxtool/store";

// --- Lazy Load CSVLink ---
const CSVLink = lazy(() =>
  import("react-csv").then((module) => ({ default: module.CSVLink }))
);

// --- API Data Structure Types ---
export type ApiUserRole = {
  id: number;
  name: string;
  display_name: string;
  pivot: {
    user_id: string;
    role_id: string;
  };
};

export type ApiUser = {
  id: number;
  name: string;
  roles: ApiUserRole[];
};

export type ApiExportMapping = {
  id: number;
  user_id: string;
  export_from: string;
  file_name: string;
  export_reason: string | null;
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
  user: ApiUser | null; // User could potentially be null
};

// --- Frontend Item Type (Transformed from API) ---
export type ExportMappingItem = {
  id: number;
  userId: number | null; // userId could be null if user data is missing
  userName: string;
  userRole: string;
  exportFrom: string;
  fileName: string;
  reason: string | null;
  exportDate: Date;
};
// --- End Item Type Definition ---

// --- Transformation Function ---
const transformApiDataToExportMappingItem = (
  apiData: ApiExportMapping
): ExportMappingItem | null => {
  if (!apiData) {
    console.error("Transform: Received null or undefined apiData object.");
    return null;
  }
  try {
    const exportDate = new Date(apiData.created_at);
    if (isNaN(exportDate.getTime())) {
      console.error(
        `Transform: Invalid created_at date for ID ${apiData.id}:`,
        apiData.created_at
      );
      // Decide: return null, or use a default date, or throw error
      // For now, let's try to proceed but log heavily or use a placeholder if critical
    }

    return {
      id: apiData.id,
      userId: apiData.user ? parseInt(apiData.user_id, 10) : null,
      userName: apiData.user?.name || "Unknown User",
      userRole:
        apiData.user?.roles && apiData.user.roles.length > 0
          ? apiData.user.roles[0].display_name
          : "N/A",
      exportFrom: apiData.export_from || "N/A",
      fileName: apiData.file_name || "N/A",
      reason: apiData.export_reason,
      exportDate: exportDate,
    };
  } catch (error) {
    console.error(
      "Error transforming API data for ID:",
      apiData.id,
      error,
      apiData
    );
    return null;
  }
};
// --- End Transformation ---

// --- Reusable ActionColumn Component ---
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
          onClick={openViewDrawer}
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
            <Button size="sm" className="mr-2" onClick={closeViewDrawer}>
              Close
            </Button>
          </div>
        }
      >
        <div className="">
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
              <span className="text-xs">{data.userRole}</span>
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
            <Tag className="border border-emerald-600 text-emerald-600 bg-transparent inline w-auto mt-1">
              {data.exportFrom}
            </Tag>
          )}

          <Card className="!mt-8 bg-gray-100 dark:bg-gray-700 border-none p-4">
            <h6 className="text-base font-semibold ">Exported Log</h6>
            <p className="mt-2">
              <span className="font-semibold  text-black  dark:text-white">
                Date:{" "}
              </span>
              <span>
                {!isNaN(data.exportDate.getTime())
                  ? data.exportDate.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Invalid Date"}
              </span>
            </p>
            <p className="mt-1">
              <span className="font-semibold text-black  dark:text-white">
                File Name:{" "}
              </span>
              <span>{data.fileName}</span>
            </p>
            {data.reason && (
              <>
                <h6 className="text-sm font-semibold text-black  dark:text-white mt-2">
                  Reason:
                </h6>
                <p>{data.reason}</p>
              </>
            )}
          </Card>
        </div>
      </Drawer>
    </div>
  );
};
// --- End ActionColumn ---

// --- ExportMappingTable Component ---
const ExportMappingTable = ({
  columns,
  data,
  loading,
  pagingData,
  selectedMappings,
  onPaginationChange,
  onSelectChange,
  onSort,
  onRowSelect,
  onAllRowSelect,
}: {
  columns: ColumnDef<ExportMappingItem>[];
  data: ExportMappingItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedMappings: ExportMappingItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: ExportMappingItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<ExportMappingItem>[]) => void;
}) => {
  return (
    <DataTable
      selectable
      columns={columns}
      data={data}
      noDataMessage={
        !loading && data.length === 0
          ? "No export records found."
          : "Loading data..."
      }
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedMappings.some((selected) => selected.id === row.id)
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
    />
  );
};
// --- End ExportMappingTable ---

// --- ExportMappingSearch Component ---
type ExportMappingSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const ExportMappingSearch = React.forwardRef<
  HTMLInputElement,
  ExportMappingSearchProps
>(({ onInputChange }, ref) => {
  return (
    <DebouceInput
      ref={ref}
      placeholder="Search by User, Role, File, Reason..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
});
ExportMappingSearch.displayName = "ExportMappingSearch";
// --- End ExportMappingSearch ---

// --- ExportMappingTableTools Component ---
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
}: {
  onSearchChange: (query: string) => void;
  allExportMappings: ExportMappingItem[];
  onApplyFilters: (filters: ExportMappingFilterSchema) => void;
}) => {
  const { DatePickerRange } = DatePicker;
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const openFilterDrawer = () => setIsFilterDrawerOpen(true);

  const { control, handleSubmit, reset } = useForm<ExportMappingFilterSchema>({
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
    reset();
    onApplyFilters({
      userRole: [],
      exportFrom: [],
      fileExtensions: [],
      exportDate: null,
    });
    // closeFilterDrawer(); // No need to close if reset is also applying
  };

  const userRoles = useMemo(() => {
    if (!allExportMappings || allExportMappings.length === 0) return [];
    const roles = new Set(
      allExportMappings.map((item) => item.userRole).filter(Boolean)
    );
    return Array.from(roles)
      .sort()
      .map((role) => ({ value: role, label: role }));
  }, [allExportMappings]);

  const exportFromOptions = useMemo(() => {
    if (!allExportMappings || allExportMappings.length === 0) return [];
    const froms = new Set(
      allExportMappings.map((item) => item.exportFrom).filter(Boolean)
    );
    return Array.from(froms)
      .sort()
      .map((from) => ({ value: from, label: from }));
  }, [allExportMappings]);

  const fileExtensionsOptions = [
    // Renamed for clarity
    { value: ".csv", label: ".csv" },
    { value: ".xlsx", label: ".xlsx" },
    { value: ".json", label: ".json" },
    { value: ".pdf", label: ".pdf" },
    { value: ".log", label: ".log" },
    { value: ".bak", label: ".bak" },
  ];

  return (
    <div className="md:flex items-center justify-between w-full gap-2">
      <div className="flex-grow mb-2 md:mb-0">
        <ExportMappingSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex gap-2">
        <Button icon={<TbFilter />} className="" onClick={openFilterDrawer}>
          Filter
        </Button>
        <Suspense
          fallback={
            <Button loading icon={<TbCloudDownload />}>
              Export
            </Button>
          }
        >
          <ExportMappingExport allMappings={allExportMappings} />
        </Suspense>
      </div>
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        bodyClass="flex flex-col overflow-hidden" // Prevent body scroll, form will scroll
        footer={
          <div className="text-right border-t border-gray-200 dark:border-gray-700 w-full py-4 px-6 bg-white dark:bg-gray-800">
            <Button size="sm" className="mr-2" onClick={handleClearFilters}>
              Clear All
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
          className="flex-grow overflow-y-auto p-6" // Scrollable form content
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
                    field.value.includes(option.value)
                  )}
                  onChange={(selected) => {
                    field.onChange(
                      selected ? selected.map((opt) => opt.value) : []
                    );
                  }}
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
                    field.value.includes(option.value)
                  )}
                  onChange={(selected) => {
                    field.onChange(
                      selected ? selected.map((opt) => opt.value) : []
                    );
                  }}
                />
              )}
            />
          </FormItem>
          <FormItem label="File Type">
            <Controller
              control={control}
              name="fileExtensions"
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select file types"
                  options={fileExtensionsOptions}
                  value={fileExtensionsOptions.filter((option) =>
                    field.value.includes(option.value)
                  )}
                  onChange={(selected) => {
                    field.onChange(
                      selected ? selected.map((opt) => opt.value) : []
                    );
                  }}
                />
              )}
            />
          </FormItem>
          <FormItem label="Export Date Range">
            <Controller
              control={control}
              name="exportDate"
              render={({ field }) => (
                <DatePickerRange
                  placeholder="Select date range"
                  value={field.value} // Expects [Date | null, Date | null] | null
                  onChange={(dateRange) => field.onChange(dateRange)}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
    </div>
  );
};
// --- End ExportMappingTableTools ---

// --- ExportMappingActionTools (CSV Export) Component ---
const ExportMappingExport = ({
  allMappings,
}: {
  allMappings: ExportMappingItem[];
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
    { label: "Export Date", key: "exportDate" },
  ];

  return (
    <CSVLink
      filename={`export_mappings_log_${
        new Date().toISOString().split("T")[0]
      }.csv`}
      data={csvData}
      headers={csvHeaders}
      asyncOnClick={true}
    >
      <Button icon={<TbCloudDownload />} disabled={allMappings.length === 0}>
        Export All
      </Button>
    </CSVLink>
  );
};
// --- End ExportMappingActionTools ---

// --- ExportMappingSelected Component ---
const ExportMappingSelected = ({
  selectedMappings,
  onDeleteSelected,
}: {
  selectedMappings: ExportMappingItem[];
  setSelectedMappings: React.Dispatch<
    React.SetStateAction<ExportMappingItem[]>
  >;
  onDeleteSelected: () => void;
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
        className="flex items-center m-0 justify-between py-4 bg-white dark:bg-gray-800"
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
              className="text-red-500 border-2 border-red-400 hover:text-red-500"
              onClick={handleDeleteClick}
              // Consider adding a disabled state if delete is in progress
            >
              Delete
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
// --- End ExportMappingSelected ---

// --- Main ExportMapping Component ---
const ExportMapping = () => {
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [exportMappings, setExportMappings] = useState<ExportMappingItem[]>([]);

  const {
    exportMappingData: apiExportMappings = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  useEffect(() => {
    dispatch(getExportMappingsAction());
  }, [dispatch]);

  useEffect(() => {
    console.log("Master loading status:", masterLoadingStatus);
    // console.log("API Export Mappings (raw):", JSON.stringify(apiExportMappings, null, 2)); // More readable log

    if (masterLoadingStatus === "idle") {
      if (!Array.isArray(apiExportMappings)) {
        console.error("apiExportMappings is not an array:", apiExportMappings);
        toast.push(
          <Notification title="Data Error" type="danger" duration={5000}>
            Received invalid data format for export mappings. Please contact
            support.
          </Notification>
        );
        setExportMappings([]);
        setIsLoading(false);
        return;
      }

      const transformedData = (apiExportMappings as ApiExportMapping[])
        .map(transformApiDataToExportMappingItem)
        .filter((item): item is ExportMappingItem => item !== null);

      console.log("Transformed Export Mappings:", transformedData);
      setExportMappings(transformedData);
      setIsLoading(false);
    } else if (masterLoadingStatus === "failed") {
      toast.push(
        <Notification
          title="Failed to load export mappings"
          type="danger"
          duration={5000}
        >
          There was an error fetching the data. Please try refreshing the page
          or contact support if the issue persists.
        </Notification>
      );
      setIsLoading(false);
      setExportMappings([]);
    } else if (
      masterLoadingStatus === "loading" ||
      masterLoadingStatus === "idle"
    ) {
      setIsLoading(true);
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

  const { pageData, total } = useMemo(() => {
    let processedData = [...exportMappings];

    // --- Apply Filters ---
    if (activeFilters.userRole && activeFilters.userRole.length > 0) {
      processedData = processedData.filter((item) =>
        activeFilters.userRole!.includes(item.userRole)
      );
    }
    if (activeFilters.exportFrom && activeFilters.exportFrom.length > 0) {
      processedData = processedData.filter((item) =>
        activeFilters.exportFrom!.includes(item.exportFrom)
      );
    }
    if (
      activeFilters.fileExtensions &&
      activeFilters.fileExtensions.length > 0
    ) {
      processedData = processedData.filter((item) =>
        activeFilters.fileExtensions!.some((ext) =>
          item.fileName.toLowerCase().endsWith(ext.toLowerCase())
        )
      );
    }
    if (activeFilters.exportDate) {
      const [startDate, endDate] = activeFilters.exportDate;
      processedData = processedData.filter((item) => {
        if (isNaN(item.exportDate.getTime())) return false; // Skip invalid dates
        const itemDate = item.exportDate.getTime();
        // Ensure start and end dates are at the beginning/end of their respective days
        const start = startDate
          ? new Date(new Date(startDate).setHours(0, 0, 0, 0)).getTime()
          : null;
        const end = endDate
          ? new Date(new Date(endDate).setHours(23, 59, 59, 999)).getTime()
          : null;

        if (start && end) return itemDate >= start && itemDate <= end;
        if (start) return itemDate >= start;
        if (end) return itemDate <= end;
        return true;
      });
    }

    // --- Apply Search ---
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

    // --- Apply Sorting ---
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
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

        aValue = aValue === null || aValue === undefined ? "" : String(aValue);
        bValue = bValue === null || bValue === undefined ? "" : String(bValue);

        return order === "asc"
          ? (aValue as string).localeCompare(bValue as string, undefined, {
              numeric: true,
              sensitivity: "base",
            })
          : (bValue as string).localeCompare(aValue as string, undefined, {
              numeric: true,
              sensitivity: "base",
            });
      });
    }

    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const dataTotal = processedData.length;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

    return { pageData: dataForPage, total: dataTotal };
  }, [exportMappings, tableData, activeFilters]);

  const handleSetTableData = useCallback(
    (
      data: Partial<TableQueries> | ((prevState: TableQueries) => TableQueries)
    ) => {
      setTableData((prev) =>
        typeof data === "function"
          ? data(prev)
          : { ...prev, ...data, pageIndex: data.pageIndex ?? prev.pageIndex }
      ); // Ensure pageIndex is maintained or updated
    },
    []
  );

  const handlePaginationChange = useCallback(
    (page: number) => {
      handleSetTableData({ pageIndex: page });
    },
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({
        pageSize: Number(value),
        pageIndex: 1,
      });
      setSelectedMappings([]);
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
    (query: string) => {
      handleSetTableData({ query: query, pageIndex: 1 });
    },
    [handleSetTableData]
  );

  const handleApplyFilters = useCallback(
    (filters: ExportMappingFilterSchema) => {
      setActiveFilters(filters);
      handleSetTableData({ pageIndex: 1 });
    },
    [handleSetTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: ExportMappingItem) => {
      setSelectedMappings((prev) => {
        if (checked) {
          return prev.some((i) => i.id === row.id) ? prev : [...prev, row];
        } else {
          return prev.filter((i) => i.id !== row.id);
        }
      });
    },
    []
  );

  const handleAllRowSelect = useCallback(
    (checked: boolean, rows: Row<ExportMappingItem>[]) => {
      const pageRowOriginals = rows.map((r) => r.original);
      const pageRowIds = new Set(pageRowOriginals.map((r) => r.id));

      if (checked) {
        setSelectedMappings((prev) => {
          const newItems = pageRowOriginals.filter(
            (original) => !prev.some((selected) => selected.id === original.id)
          );
          return [...prev, ...newItems];
        });
      } else {
        setSelectedMappings((prev) =>
          prev.filter((item) => !pageRowIds.has(item.id))
        );
      }
    },
    []
  );

  const handleDeleteSelected = useCallback(() => {
    const selectedIds = new Set(selectedMappings.map((i) => i.id));
    // TODO: Here you would typically dispatch an action to delete these from the backend
    // For now, we'll just filter them from the local state
    setExportMappings((currentMappings) =>
      currentMappings.filter((i) => !selectedIds.has(i.id))
    );
    setSelectedMappings([]);
    toast.push(
      <Notification
        title={`${selectedIds.size} item(s) deleted`}
        type="success"
        duration={2500}
      >
        Selected records have been removed from view.
      </Notification>
    );
  }, [selectedMappings /* dispatch */]); // Add dispatch if you implement backend delete

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
                <span className="font-semibold block"> {userName}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
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
              <span className="font-semibold"> {exportFrom}</span>
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
        enableSorting: true,
        size: 250,
        cell: (props) => (
          <Tooltip title={props.row.original.reason || ""}>
            <span className="truncate block max-w-[230px]">
              {props.row.original.reason || "-"}
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
                ? `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Invalid Date"}
            </span>
          );
        },
      },
      {
        header: "Action",
        id: "action",
        size: 80,
        cell: (props) => <ActionColumn data={props.row.original} />,
      },
    ],
    []
  );

  return (
    <Container className="h-full">
      <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
        <div className="lg:flex items-center justify-between mb-4">
          <h5 className="mb-4 lg:mb-0">Export Mapping Log</h5>
        </div>

        <div className="mb-4">
          <ExportMappingTableTools
            onSearchChange={handleSearchChange}
            allExportMappings={exportMappings}
            onApplyFilters={handleApplyFilters}
          />
        </div>

        <div className="flex-grow overflow-auto">
          {" "}
          {/* Ensure table container can scroll if content overflows */}
          <ExportMappingTable
            columns={columns}
            data={pageData}
            loading={isLoading}
            pagingData={{
              total,
              pageIndex: tableData.pageIndex as number,
              pageSize: tableData.pageSize as number,
            }}
            selectedMappings={selectedMappings}
            onPaginationChange={handlePaginationChange}
            onSelectChange={handleSelectChange}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onAllRowSelect={handleAllRowSelect}
          />
        </div>
      </AdaptiveCard>

      <ExportMappingSelected
        selectedMappings={selectedMappings}
        setSelectedMappings={setSelectedMappings} // Prop is passed, even if not used in this specific version
        onDeleteSelected={handleDeleteSelected}
      />
    </Container>
  );
};

export default ExportMapping;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
