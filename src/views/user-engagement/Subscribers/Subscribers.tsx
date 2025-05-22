// src/views/your-path/SubscribersListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween"; // Import isBetween plugin
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"; // Import isSameOrBefore plugin
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // Import isSameOrAfter plugin

// Extend dayjs with the plugins
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import DebouceInput from "@/components/shared/DebouceInput";
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Select,
  DatePicker,
  Tag,
} from "@/components/ui";

// Icons
import {
  TbSearch,
  TbFilter,
  TbCloudUpload, // For Export button
  TbCalendar,
  TbX,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux (Kept for eventual integration, but data is mocked locally for now)
import { useAppDispatch } from "@/reduxtool/store";
// import { getSubscribersAction } from '@/reduxtool/master/middleware'; // Adjust path/action
// import { masterSelector } from '@/reduxtool/master/masterSlice'; // Adjust path/selector
// import { useSelector } from 'react-redux';

// Type for data coming directly from API
type ApiSubscriberItem = {
  id: number | string;
  email: string;
  created_at: string; // ISO date string
  name?: string | null;
  status?: string | null;
  source?: string | null;
};

// --- Define Subscriber Item Type (Mapped for UI) ---
export type SubscriberStatus =
  | "Active"
  | "Unsubscribed"
  | "Pending"
  | "Bounced"
  | string; // Example statuses

export type SubscriberItem = {
  id: number | string;
  email: string;
  subscribedDate: Date;
  name?: string | null;
  status?: SubscriberStatus;
  source?: string | null;
};
// --- End Item Type Definition ---

// --- Status Colors ---
const statusColor: Record<SubscriberStatus, string> = {
  Active:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Unsubscribed:
    "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-100",
  Pending: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
  Bounced:
    "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100",
  // Add default or handle other statuses
};

// --- Zod Schema for Filter Form ---
const selectOptionSchema = z.object({ value: z.string(), label: z.string() });
const filterFormSchema = z.object({
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
  filterStatuses: z.array(selectOptionSchema).optional().default([]),
  filterSources: z.array(selectOptionSchema).optional().default([]),
});
type FilterFormData = z.infer<typeof filterFormSchema>;
// --- End Filter Schema ---

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
  "ID",
  "Email",
  "Name",
  "Status",
  "Source",
  "Subscribed Date",
];
const CSV_KEYS: (keyof SubscriberItem)[] = [
  "id",
  "email",
  "name",
  "status",
  "source",
  "subscribedDate",
];

function exportSubscribersToCsv(filename: string, rows: SubscriberItem[]) {
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
    CSV_HEADERS.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return CSV_KEYS.map((k) => {
          let cell = row[k];
          if (cell === null || cell === undefined) {
            cell = "";
          } else if (cell instanceof Date) {
            cell = dayjs(cell).format("YYYY-MM-DD HH:mm:ss");
          } else {
            cell = String(cell).replace(/"/g, '""');
          }
          if (String(cell).search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
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

// --- SubscriberSearch Component ---
type SubscriberSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const SubscriberSearch = React.forwardRef<
  HTMLInputElement,
  SubscriberSearchProps
>(({ onInputChange }, ref) => {
  return (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  );
});
SubscriberSearch.displayName = "SubscriberSearch";

// --- SubscriberTableTools Component ---
const SubscriberTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
      <div className="flex-grow">
        <SubscriberSearch onInputChange={onSearchChange} />
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
};

// --- SubscriberTable Component ---
type SubscriberTableProps = {
  columns: ColumnDef<SubscriberItem>[];
  data: SubscriberItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
};
const SubscriberTable = ({
  columns,
  data,
  loading,
  pagingData,
  onPaginationChange,
  onSelectChange,
  onSort,
}: SubscriberTableProps) => {
  return (
    <DataTable
      selectable={false}
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
};

// --- FOR TESTING: Mock Raw Subscriber Data ---
const mockApiSubscriberData: ApiSubscriberItem[] = [
  {
    id: 1,
    email: "alice.johnson@example.com",
    created_at: "2023-01-15T10:30:00Z",
    name: "Alice Johnson",
    status: "Active",
    source: "Website Signup",
  },
  {
    id: 2,
    email: "bob.smith@example.com",
    created_at: "2023-02-20T14:45:00Z",
    name: "Bob Smith",
    status: "Active",
    source: "Import",
  },
  {
    id: 3,
    email: "carol.white@example.com",
    created_at: "2023-03-10T08:00:00Z",
    name: "Carol White",
    status: "Unsubscribed",
    source: "Website Signup",
  },
  {
    id: 4,
    email: "david.brown@example.com",
    created_at: "2023-04-05T16:15:00Z",
    name: "David Brown",
    status: "Active",
    source: "Event Registration",
  },
  {
    id: 5,
    email: "eve.davis@example.com",
    created_at: "2023-05-12T11:00:00Z",
    name: "Eve Davis",
    status: "Pending",
    source: "API",
  },
  {
    id: 6,
    email: "frank.miller@example.com",
    created_at: "2022-12-01T09:00:00Z",
    name: "Frank Miller",
    status: "Active",
    source: "Import",
  },
  {
    id: 7,
    email: "grace.wilson@example.com",
    created_at: "2023-06-18T13:30:00Z",
    name: "Grace Wilson",
    status: "Active",
    source: "Website Signup",
  },
  {
    id: 8,
    email: "henry.moore@example.com",
    created_at: "2023-07-22T17:00:00Z",
    name: "Henry Moore",
    status: "Unsubscribed",
    source: "Manual",
  },
  {
    id: 9,
    email: "isabel.taylor@example.com",
    created_at: "2023-08-03T10:00:00Z",
    name: "Isabel Taylor",
    status: "Active",
    source: "API",
  },
  {
    id: 10,
    email: "jack.anderson@example.com",
    created_at: "2023-09-14T12:15:00Z",
    name: "Jack Anderson",
    status: "Pending",
    source: "Event Registration",
  },
  {
    id: 11,
    email: "kathy.thomas@example.com",
    created_at: "2023-10-01T11:45:00Z",
    name: "Kathy Thomas",
    status: "Active",
    source: "Website Signup",
  },
  {
    id: 12,
    email: "leo.jackson@example.com",
    created_at: "2023-10-25T15:00:00Z",
    name: "Leo Jackson",
    status: "Active",
    source: "Import",
  },
  {
    id: 13,
    email: "mia.harris@example.com",
    created_at: "2023-11-05T09:30:00Z",
    name: "Mia Harris",
    status: "Unsubscribed",
    source: "Manual",
  },
  {
    id: 14,
    email: "noah.martin@example.com",
    created_at: "2023-11-15T14:00:00Z",
    name: "Noah Martin",
    status: "Active",
    source: "API",
  },
  {
    id: 15,
    email: "olivia.garcia@example.com",
    created_at: "2023-12-02T10:15:00Z",
    name: "Olivia Garcia",
    status: "Pending",
    source: "Website Signup",
  },
  {
    id: 16,
    email: "peter.rodriguez@example.com",
    created_at: "2024-01-05T16:30:00Z",
    name: "Peter Rodriguez",
    status: "Active",
    source: "Event Registration",
  },
  {
    id: 17,
    email: "quinn.lopez@example.com",
    created_at: "2024-01-10T11:00:00Z",
    name: null,
    status: "Active",
    source: "Import",
  },
  {
    id: 18,
    email: "ryan.lee@example.com",
    created_at: "2024-01-15T08:45:00Z",
    name: "Ryan Lee",
    status: "Bounced",
    source: "API",
  },
  {
    id: 19,
    email: "sophia.walker@example.com",
    created_at: "2024-01-20T13:15:00Z",
    name: "Sophia Walker",
    status: "Active",
    source: null,
  },
  {
    id: 20,
    email: "thomas.hall@example.com",
    created_at: "2024-01-25T17:30:00Z",
    name: "Thomas Hall",
    status: "Unsubscribed",
    source: "Website Signup",
  },
  {
    id: 21,
    email: "ursula.vega@example.com",
    created_at: "2024-02-01T09:00:00Z",
    name: "Ursula Vega",
    status: "Active",
    source: "Referral",
  },
  {
    id: 22,
    email: "victor.chen@example.com",
    created_at: "2024-02-05T14:30:00Z",
    name: "Victor Chen",
    status: "Pending",
    source: "Website Signup",
  },
  {
    id: 23,
    email: "wendy.king@example.com",
    created_at: "2024-02-10T10:45:00Z",
    name: "Wendy King",
    status: "Active",
    source: "Social Media",
  },
  {
    id: 24,
    email: "xavier.scott@example.com",
    created_at: "2024-02-15T16:00:00Z",
    name: "Xavier Scott",
    status: "Unsubscribed",
    source: "Import",
  },
  {
    id: 25,
    email: "yvonne.green@example.com",
    created_at: "2024-02-20T11:15:00Z",
    name: "Yvonne Green",
    status: "Active",
    source: "API",
  },
  {
    id: 26,
    email: "zack.adams@example.com",
    created_at: "2024-02-25T08:30:00Z",
    name: "Zack Adams",
    status: "Bounced",
    source: "Event Registration",
  },
  {
    id: 27,
    email: "anna.baker@example.net",
    created_at: "2024-03-01T13:00:00Z",
    name: "Anna Baker",
    status: "Active",
    source: "Manual",
  },
  {
    id: 28,
    email: "brian.carter@example.org",
    created_at: "2024-03-05T17:45:00Z",
    name: "Brian Carter",
    status: "Pending",
    source: "Website Signup",
  },
  {
    id: 29,
    email: "clara.diaz@example.com",
    created_at: "2024-03-10T12:00:00Z",
    name: null,
    status: "Active",
    source: "Import",
  },
  {
    id: 30,
    email: "derek.evans@example.net",
    created_at: "2024-03-15T09:15:00Z",
    name: "Derek Evans",
    status: "Unsubscribed",
    source: null,
  },
];

// --- Main SubscribersListing Component ---
const SubscribersListing = () => {
  const dispatch = useAppDispatch(); // Kept for eventual Redux integration

  // Using mocked data directly for now
  const rawSubscriberData: ApiSubscriberItem[] = mockApiSubscriberData;
  const dataLoadingStatus: "idle" | "loading" | "succeeded" | "failed" =
    "succeeded"; // Simulate loaded

  // const { subscriberData: rawSubscriberData = [], status: dataLoadingStatus = 'idle' } =
  //     useSelector(masterSelector); // Your original Redux connection

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
    filterFormSchema.parse({})
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "subscribedDate" },
    query: "",
  });

  // Effect to fetch data on mount (currently does nothing with mocked data)
  useEffect(() => {
    // When using Redux, this would dispatch the action:
    // dispatch(getSubscribersAction());
    console.log("Simulating data fetch or component mount for subscribers.");
  }, [dispatch]);

  const mappedSubscribers = useMemo(() => {
    if (!Array.isArray(rawSubscriberData)) return [];
    return rawSubscriberData.map(
      (apiItem: ApiSubscriberItem): SubscriberItem => ({
        id: apiItem.id,
        email: apiItem.email,
        subscribedDate: apiItem.created_at
          ? new Date(apiItem.created_at)
          : new Date(0),
        name: apiItem.name ?? undefined,
        status: (apiItem.status as SubscriberStatus) ?? undefined,
        source: apiItem.source ?? undefined,
      })
    );
  }, [rawSubscriberData]);

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);

  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria(data);
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [handleSetTableData, closeFilterDrawer]
  );

  const onClearFilters = useCallback(() => {
    const defaultFilters = filterFormSchema.parse({});
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  }, [filterFormMethods, handleSetTableData]);

  const availableStatuses = useMemo(() => {
    if (!Array.isArray(mappedSubscribers)) return [];
    const uniqueStatuses = new Set(
      mappedSubscribers
        .map((sub) => sub.status)
        .filter(
          Boolean as unknown as (value: string | undefined) => value is string
        )
    );
    return Array.from(uniqueStatuses)
      .sort()
      .map((status) => ({ value: status, label: status }));
  }, [mappedSubscribers]);

  const availableSources = useMemo(() => {
    if (!Array.isArray(mappedSubscribers)) return [];
    const uniqueSources = new Set(
      mappedSubscribers
        .map((sub) => sub.source)
        .filter(Boolean as any as (value: string | any) => value is string)
    );
    return Array.from(uniqueSources)
      .sort()
      .map((source) => ({ value: source, label: source }));
  }, [mappedSubscribers]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: SubscriberItem[] = cloneDeep(mappedSubscribers);

    if (
      filterCriteria.dateRange &&
      (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])
    ) {
      const [startDate, endDate] = filterCriteria.dateRange;
      const start = startDate ? dayjs(startDate).startOf("day") : null;
      const end = endDate ? dayjs(endDate).endOf("day") : null;
      processedData = processedData.filter((item) => {
        const itemDate = dayjs(item.subscribedDate);
        if (start && end) return itemDate.isBetween(start, end, null, "[]");
        if (start) return itemDate.isSameOrAfter(start, "day"); // Corrected to isSameOrAfter
        if (end) return itemDate.isSameOrBefore(end, "day"); // Corrected to isSameOrBefore
        return true;
      });
    }
    if (
      filterCriteria.filterStatuses &&
      filterCriteria.filterStatuses.length > 0
    ) {
      const statuses = new Set(
        filterCriteria.filterStatuses.map((opt) => opt.value)
      );
      processedData = processedData.filter(
        (item) => item.status && statuses.has(item.status)
      );
    }
    if (
      filterCriteria.filterSources &&
      filterCriteria.filterSources.length > 0
    ) {
      const sources = new Set(
        filterCriteria.filterSources.map((opt) => opt.value)
      );
      processedData = processedData.filter(
        (item) => item.source && sources.has(item.source)
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          (item.name && item.name.toLowerCase().includes(query))
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof SubscriberItem];
        let bVal = b[key as keyof SubscriberItem];
        if (aVal instanceof Date && bVal instanceof Date) {
          return order === "asc"
            ? aVal.getTime() - bVal.getTime()
            : bVal.getTime() - aVal.getTime();
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
        return order === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }

    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

    return {
      pageData: dataForPage,
      total: currentTotal,
      allFilteredAndSortedData: processedData,
    };
  }, [mappedSubscribers, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    const success = exportSubscribersToCsv(
      "subscribers_export.csv",
      allFilteredAndSortedData
    );
    // Toast notification is handled within exportSubscribersToCsv
  }, [allFilteredAndSortedData]);

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
    (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query, pageIndex: 1 }),
    [handleSetTableData]
  );

  const columns: ColumnDef<SubscriberItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
      { header: "Email", accessorKey: "email", enableSorting: true, size: 250 },
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        size: 180,
        cell: (props) => props.row.original.name || "-",
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 120,
        cell: (props) => {
          const status = props.row.original.status;
          if (!status) return "-";
          const colorClass =
            statusColor[status] ||
            "bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-100";
          return <Tag className={`${colorClass} capitalize`}>{status}</Tag>;
        },
      },
      {
        header: "Source",
        accessorKey: "source",
        enableSorting: true,
        size: 150,
        cell: (props) => props.row.original.source || "-",
      },
      {
        header: "Subscribed Date",
        accessorKey: "subscribedDate",
        enableSorting: true,
        size: 180,
        cell: (props) =>
          dayjs(props.row.original.subscribedDate).format("YYYY-MM-DD HH:mm"),
      },
    ],
    []
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Subscribers Listing</h5>
          </div>
          <SubscriberTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <SubscriberTable
              columns={columns}
              data={pageData}
              // loading={dataLoadingStatus === 'loading'}
              pagingData={{
                total: total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              loading={false}
            />
          </div>
        </AdaptiveCard>
      </Container>

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
              form="filterSubscriberForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterSubscriberForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Subscribed Date Range">
            <Controller
              name="dateRange"
              control={filterFormMethods.control}
              render={({ field }) => (
                <DatePicker.DatePickerRange
                  placeholder="Select date range"
                  value={
                    field.value as [Date | null, Date | null] | null | undefined
                  }
                  onChange={field.onChange}
                />
              )}
            />
          </FormItem>
          <FormItem label="Status">
            <Controller
              name="filterStatuses"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select statuses..."
                  options={availableStatuses}
                  {...field}
                />
              )}
            />
          </FormItem>
          <FormItem label="Source">
            <Controller
              name="filterSources"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select sources..."
                  options={availableSources}
                  {...field}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
    </>
  );
};

export default SubscribersListing;
