// src/views/your-path/RequestAndFeedback.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

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
  Tooltip,
} from "@/components/ui";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StickyFooter from "@/components/shared/StickyFooter";

// Icons
import {
  TbSearch,
  TbFilter,
  TbCloudUpload,
  TbCalendar,
  TbX,
  TbPencil,
  TbTrash,
  TbEye,
  TbChecks,
  TbMessageCircleQuestion,
  TbPlus,
  TbSwitchHorizontal,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable"; // Added CellContext
import type { TableQueries } from "@/@types/common";
import Textarea from "@/views/ui-components/forms/Input/Textarea";

// --- Define Item Type ---
export type RequestStatus =
  | "Open"
  | "In Progress"
  | "Resolved"
  | "Closed"
  | "Pending Review"
  | string;
export type RequestSource =
  | "Website Form"
  | "Email"
  | "Phone Call"
  | "In-App Feedback"
  | "Support Ticket"
  | string;

export type RequestFeedbackItem = {
  id: number | string;
  name: string;
  email: string;
  phone?: string | null;
  from: RequestSource;
  message: string;
  status: RequestStatus;
  date: Date;
  lastUpdated?: Date;
  assignedTo?: string | null;
};
// --- End Item Type Definition ---

// --- Status Colors ---
const statusColor: Record<RequestStatus, string> = {
  Open: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
  "In Progress":
    "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  Resolved:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Closed: "bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-100",
  "Pending Review":
    "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-100",
};

// --- Zod Schema for Edit/Status Change Form ---
const requestFeedbackEditFormSchema = z.object({
  status: z.string().min(1, "Status is required."),
  internalNotes: z.string().optional(),
});
type RequestFeedbackEditFormData = z.infer<
  typeof requestFeedbackEditFormSchema
>;

// --- Zod Schema for Filter Form ---
const selectOptionSchema = z.object({ value: z.string(), label: z.string() });
const filterFormSchema = z.object({
  dateRange: z.array(z.date().nullable()).length(2).nullable().optional(),
  filterStatuses: z.array(selectOptionSchema).optional().default([]),
  filterFrom: z.array(selectOptionSchema).optional().default([]),
});
type FilterFormData = z.infer<typeof filterFormSchema>;
// --- End Filter Schema ---

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
  "ID",
  "Name",
  "Email",
  "Phone",
  "From",
  "Status",
  "Date",
  "Message",
  "Last Updated",
  "Assigned To",
];
const CSV_KEYS: (keyof RequestFeedbackItem)[] = [
  "id",
  "name",
  "email",
  "phone",
  "from",
  "status",
  "date",
  "message",
  "lastUpdated",
  "assignedTo",
];

function exportRequestsToCsv(filename: string, rows: RequestFeedbackItem[]) {
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

// --- Search Component ---
type RequestSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const RequestSearch = React.forwardRef<HTMLInputElement, RequestSearchProps>(
  ({ onInputChange }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        className="w-full"
        placeholder="Search requests (Name, Email, Message, ID)..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
      />
    );
  }
);
RequestSearch.displayName = "RequestSearch";

// --- TableTools Component ---
const RequestTableTools = ({
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
        <RequestSearch onInputChange={onSearchChange} />
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

// --- DataTable Component ---
type RequestTableProps = {
  columns: ColumnDef<RequestFeedbackItem>[];
  data: RequestFeedbackItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: RequestFeedbackItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: RequestFeedbackItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<RequestFeedbackItem>[]) => void;
};
const RequestTable = ({
  columns,
  data,
  loading,
  pagingData,
  selectedItems,
  onPaginationChange,
  onSelectChange,
  onSort,
  onRowSelect,
  onAllRowSelect,
}: RequestTableProps) => {
  return (
    <DataTable
      selectable
      columns={columns}
      data={data}
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedItems.some((selected) => selected.id === row.id)
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
      noData={!loading && data.length === 0}
    />
  );
};

// --- SelectedFooter Component ---
type RequestSelectedFooterProps = {
  selectedItems: RequestFeedbackItem[];
  onDeleteSelected: () => void;
};
const RequestSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: RequestSelectedFooterProps) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
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
              <span>Item{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Item${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected item
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Mock Initial Data ---
const initialDummyRequests: RequestFeedbackItem[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "555-1234",
    from: "Website Form",
    message:
      "The website is a bit slow on mobile devices. Otherwise, great content!",
    status: "Open",
    date: dayjs().subtract(2, "day").toDate(),
    lastUpdated: dayjs().subtract(1, "hour").toDate(),
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    from: "Email",
    message: "I have a feature request: can you add dark mode?",
    status: "Pending Review",
    date: dayjs().subtract(5, "day").toDate(),
  },
  {
    id: 3,
    name: "Alice Brown",
    email: "alice.b@example.com",
    phone: "555-5678",
    from: "Support Ticket",
    message: "Login issue resolved. Thanks for the quick help!",
    status: "Resolved",
    date: dayjs().subtract(1, "week").toDate(),
    lastUpdated: dayjs().subtract(2, "day").toDate(),
    assignedTo: "Support Team B",
  },
  {
    id: 4,
    name: "Bob Green",
    email: "bob.g@example.com",
    from: "In-App Feedback",
    message: "The new UI is fantastic!",
    status: "Closed",
    date: dayjs().subtract(3, "day").toDate(),
    lastUpdated: dayjs().subtract(3, "day").toDate(),
  },
  {
    id: 5,
    name: "Charlie Black",
    email: "charlie.b@example.com",
    phone: "555-8765",
    from: "Phone Call",
    message: "User reported a billing discrepancy. Needs investigation.",
    status: "In Progress",
    date: dayjs().subtract(1, "day").toDate(),
    assignedTo: "Billing Dept",
  },
  {
    id: 6,
    name: "Diana White",
    email: "diana.w@example.com",
    from: "Website Form",
    message: 'Found a typo on the pricing page under the "Enterprise" plan.',
    status: "Open",
    date: dayjs().toDate(),
  },
  {
    id: 7,
    name: "Edward Grey",
    email: "ed.grey@example.com",
    from: "Email",
    message: "How do I reset my password? The link seems broken.",
    status: "In Progress",
    date: dayjs().subtract(4, "hour").toDate(),
    assignedTo: "Tech Support",
  },
  {
    id: 8,
    name: "Fiona Purple",
    email: "fiona.p@example.com",
    phone: "555-4321",
    from: "Support Ticket",
    message: "Request for API documentation update regarding new endpoints.",
    status: "Pending Review",
    date: dayjs().subtract(6, "day").toDate(),
  },
];

// --- Main RequestAndFeedback Component ---
const RequestAndFeedback = () => {
  const [allRequests, setAllRequests] =
    useState<RequestFeedbackItem[]>(initialDummyRequests);
  const [loadingStatus, setLoadingStatus] = useState<
    "idle" | "loading" | "succeeded" | "failed"
  >("idle");

  const dispatchSimulated = useCallback(
    async (action: { type: string; payload?: any }) => {
      setLoadingStatus("loading");
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        switch (action.type) {
          case "requests/get":
            break;
          case "requests/update":
            setAllRequests((prev) =>
              prev.map((item) =>
                item.id === action.payload.id
                  ? { ...item, ...action.payload, lastUpdated: new Date() }
                  : item
              )
            );
            break;
          case "requests/delete":
            setAllRequests((prev) =>
              prev.filter((item) => item.id !== action.payload.id)
            );
            break;
          case "requests/deleteAll":
            const idsToDelete = new Set(action.payload.ids.split(","));
            setAllRequests((prev) =>
              prev.filter((item) => !idsToDelete.has(String(item.id)))
            );
            break;
          default:
            console.warn("Unknown action:", action.type);
        }
        setLoadingStatus("succeeded");
        return { unwrap: () => Promise.resolve() };
      } catch (error) {
        setLoadingStatus("failed");
        console.error("Simulated dispatch error:", error);
        return { unwrap: () => Promise.reject(error) };
      }
    },
    []
  );

  const [isViewEditDrawerOpen, setIsViewEditDrawerOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<RequestFeedbackItem | null>(
    null
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>(
    filterFormSchema.parse({})
  );
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "date" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<RequestFeedbackItem[]>([]);

  useEffect(() => {
    dispatchSimulated({ type: "requests/get" });
  }, [dispatchSimulated]);

  const editFormMethods = useForm<RequestFeedbackEditFormData>({
    resolver: zodResolver(requestFeedbackEditFormSchema),
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openViewEditDrawer = useCallback(
    (item: RequestFeedbackItem) => {
      setCurrentItem(item);
      editFormMethods.reset({
        status: item.status,
        internalNotes: "",
      });
      setIsViewEditDrawerOpen(true);
    },
    [editFormMethods]
  );

  const closeViewEditDrawer = useCallback(() => {
    setCurrentItem(null);
    setIsViewEditDrawerOpen(false);
  }, []);

  const onViewEditSubmit = useCallback(
    async (data: RequestFeedbackEditFormData) => {
      if (!currentItem) return;
      setIsSubmitting(true);
      try {
        await dispatchSimulated({
          type: "requests/update",
          payload: { ...data, id: currentItem.id },
        }).unwrap();
        toast.push(
          <Notification title="Request Updated" type="success">
            Status changed to {data.status}.
          </Notification>
        );
        closeViewEditDrawer();
      } catch (error: any) {
        toast.push(
          <Notification title="Update Failed" type="danger">
            {error.message || "Could not update request."}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [dispatchSimulated, currentItem, closeViewEditDrawer]
  );

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RequestFeedbackItem | null>(
    null
  );

  const handleDeleteClick = useCallback((item: RequestFeedbackItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatchSimulated({
        type: "requests/delete",
        payload: { id: itemToDelete.id },
      }).unwrap();
      toast.push(
        <Notification title="Deleted" type="success">
          Request from "{itemToDelete.name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete.id)
      ); // Corrected: use itemToDelete.id
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger">
          {error.message || "Could not delete."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatchSimulated, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => item.id).join(",");
    try {
      await dispatchSimulated({
        type: "requests/deleteAll",
        payload: { ids: idsToDelete },
      }).unwrap();
      toast.push(
        <Notification title="Bulk Delete Successful" type="success">
          {selectedItems.length} items deleted.
        </Notification>
      );
      setSelectedItems([]);
    } catch (error: any) {
      toast.push(
        <Notification title="Bulk Delete Failed" type="danger">
          {error.message || "Could not delete selected items."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatchSimulated, selectedItems]);

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
    if (!Array.isArray(allRequests)) return [];
    const unique = new Set(allRequests.map((req) => req.status));
    return Array.from(unique)
      .sort()
      .map((s) => ({ value: s, label: s }));
  }, [allRequests]);

  const availableFromOptions = useMemo(() => {
    if (!Array.isArray(allRequests)) return [];
    const unique = new Set(allRequests.map((req) => req.from));
    return Array.from(unique)
      .sort()
      .map((s) => ({ value: s, label: s }));
  }, [allRequests]);

  type ProcessedDataType = {
    pageData: RequestFeedbackItem[];
    total: number;
    allFilteredAndSortedData: RequestFeedbackItem[];
  };

  const { pageData, total, allFilteredAndSortedData } =
    useMemo((): ProcessedDataType => {
      let processedData: RequestFeedbackItem[] = cloneDeep(allRequests);

      if (
        filterCriteria.dateRange &&
        (filterCriteria.dateRange[0] || filterCriteria.dateRange[1])
      ) {
        const [startDate, endDate] = filterCriteria.dateRange;
        const start = startDate ? dayjs(startDate).startOf("day") : null;
        const end = endDate ? dayjs(endDate).endOf("day") : null;
        processedData = processedData.filter((item) => {
          const itemDate = dayjs(item.date);
          if (start && end) return itemDate.isBetween(start, end, null, "[]");
          if (start) return itemDate.isSameOrAfter(start, "day");
          if (end) return itemDate.isSameOrBefore(end, "day");
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
        processedData = processedData.filter((item) =>
          statuses.has(item.status)
        );
      }
      if (filterCriteria.filterFrom && filterCriteria.filterFrom.length > 0) {
        const fromSources = new Set(
          filterCriteria.filterFrom.map((opt) => opt.value)
        );
        processedData = processedData.filter((item) =>
          fromSources.has(item.from)
        );
      }

      if (tableData.query && tableData.query.trim() !== "") {
        const query = tableData.query.toLowerCase().trim();
        processedData = processedData.filter(
          (item) =>
            String(item.id).toLowerCase().includes(query) ||
            item.name.toLowerCase().includes(query) ||
            item.email.toLowerCase().includes(query) ||
            (item.phone && item.phone.toLowerCase().includes(query)) ||
            item.from.toLowerCase().includes(query) ||
            item.message.toLowerCase().includes(query) ||
            item.status.toLowerCase().includes(query)
        );
      }

      const { order, key } = tableData.sort as OnSortParam;
      if (order && key && processedData.length > 0) {
        processedData.sort((a, b) => {
          let aVal = a[key as keyof RequestFeedbackItem];
          let bVal = b[key as keyof RequestFeedbackItem];
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
      const dataForPage = processedData.slice(
        startIndex,
        startIndex + pageSize
      );

      return {
        pageData: dataForPage,
        total: currentTotal,
        allFilteredAndSortedData: processedData,
      };
    }, [allRequests, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    exportRequestsToCsv(
      "requests_feedback_export.csv",
      allFilteredAndSortedData
    );
  }, [allFilteredAndSortedData]);

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
    (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query, pageIndex: 1 }),
    [handleSetTableData]
  );

  const handleRowSelect = useCallback(
    (checked: boolean, row: RequestFeedbackItem) => {
      setSelectedItems((prev) => {
        if (checked)
          return prev.some((item) => item.id === row.id)
            ? prev
            : [...prev, row];
        return prev.filter((item) => item.id !== row.id);
      });
    },
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<RequestFeedbackItem>[]) => {
      const currentPageOriginals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prev) => {
          const prevIds = new Set(prev.map((item) => item.id));
          const newToAdd = currentPageOriginals.filter(
            (r) => !prevIds.has(r.id)
          );
          return [...prev, ...newToAdd];
        });
      } else {
        const currentPageIds = new Set(currentPageOriginals.map((r) => r.id));
        setSelectedItems((prev) =>
          prev.filter((item) => !currentPageIds.has(item.id))
        );
      }
    },
    []
  );

  const columns: ColumnDef<RequestFeedbackItem>[] = useMemo(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        size: 150,
        cell: (
          props: CellContext<RequestFeedbackItem, unknown> // Explicitly type props
        ) => (
          <div>
            <div>{props.row.original.name}</div>
            <div className="text-xs text-gray-500">
              {props.row.original.email}
            </div>
            {props.row.original.phone && (
              <div className="text-xs text-gray-500">
                P: {props.row.original.phone}
              </div>
            )}
          </div>
        ),
      },
      { header: "From", accessorKey: "from", enableSorting: true, size: 150 },
      {
        header: "Date",
        accessorKey: "date",
        enableSorting: true,
        size: 150,
        cell: (props: CellContext<RequestFeedbackItem, unknown>) =>
          dayjs(props.row.original.date).format("YYYY-MM-DD HH:mm"),
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 130,
        cell: (props: CellContext<RequestFeedbackItem, unknown>) => {
          const status = props.row.original.status;
          const colorClass =
            statusColor[status] ||
            "bg-gray-100 text-gray-600 dark:bg-gray-600/20 dark:text-gray-100";
          return <Tag className={`${colorClass} capitalize`}>{status}</Tag>;
        },
      },
      {
        header: "Actions",
        id: "action",
        size: 120,
        meta: { HeaderClass: "text-center" },
        cell: (props: CellContext<RequestFeedbackItem, unknown>) => (
          <div className="flex items-center justify-center gap-2">
            <Tooltip title="View/Edit Status">
              <Button
                shape="circle"
                variant="plain"
                size="sm"
                icon={<TbPencil />}
                onClick={() => openViewEditDrawer(props.row.original)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                shape="circle"
                variant="plain"
                size="sm"
                icon={<TbTrash />}
                onClick={() => handleDeleteClick(props.row.original)}
                className="text-red-500 hover:text-red-700"
              />
            </Tooltip>
          </div>
        ),
      },
    ],
    [openViewEditDrawer, handleDeleteClick]
  );

  return (
    <>
      <Container className="h-full">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="lg:flex items-center justify-between mb-4">
            <h5 className="mb-4 lg:mb-0">Request and Feedback</h5>
          </div>
          <RequestTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <RequestTable
              columns={columns}
              data={pageData}
              loading={
                loadingStatus === "loading" || isSubmitting || isDeleting
              }
              pagingData={{
                total: total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectedItems={selectedItems}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onRowSelect={handleRowSelect}
              onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <RequestSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      <Drawer
        title={currentItem ? `Details: ${currentItem.name}` : "Details"}
        isOpen={isViewEditDrawerOpen}
        onClose={closeViewEditDrawer}
        onRequestClose={closeViewEditDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeViewEditDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="viewEditRequestForm"
              type="submit"
              loading={isSubmitting}
              disabled={!editFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Update Status"}
            </Button>
          </div>
        }
      >
        {currentItem && (
          <div className="flex flex-col gap-4">
            <div>
              <strong>Name:</strong> {currentItem.name}
            </div>
            <div>
              <strong>Email:</strong> {currentItem.email}
            </div>
            {currentItem.phone && (
              <div>
                <strong>Phone:</strong> {currentItem.phone}
              </div>
            )}
            <div>
              <strong>From:</strong> {currentItem.from}
            </div>
            <div>
              <strong>Date:</strong>{" "}
              {dayjs(currentItem.date).format("YYYY-MM-DD HH:mm:ss")}
            </div>
            {currentItem.lastUpdated && (
              <div>
                <strong>Last Updated:</strong>{" "}
                {dayjs(currentItem.lastUpdated).format("YYYY-MM-DD HH:mm:ss")}
              </div>
            )}
            {currentItem.assignedTo && (
              <div>
                <strong>Assigned To:</strong> {currentItem.assignedTo}
              </div>
            )}
            <div className="p-2 border rounded bg-gray-50 dark:bg-gray-700">
              <strong>Message:</strong>
              <p className="whitespace-pre-wrap">{currentItem.message}</p>
            </div>
            <hr className="my-2" />
            <Form
              id="viewEditRequestForm"
              onSubmit={editFormMethods.handleSubmit(onViewEditSubmit)}
              className="flex flex-col gap-y-4"
            >
              <FormItem
                label="Change Status"
                invalid={!!editFormMethods.formState.errors.status}
                errorMessage={editFormMethods.formState.errors.status?.message}
              >
                <Controller
                  name="status"
                  control={editFormMethods.control}
                  render={({ field }) => (
                    <Select
                      placeholder="Select new status"
                      options={availableStatuses}
                      value={availableStatuses.find(
                        (opt) => opt.value === field.value
                      )}
                      onChange={(option) => field.onChange(option?.value)}
                    />
                  )}
                />
              </FormItem>
              <FormItem label="Internal Notes (Optional)">
                <Controller
                  name="internalNotes"
                  control={editFormMethods.control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Add internal notes about this request or status change..."
                    />
                  )}
                />
              </FormItem>
            </Form>
          </div>
        )}
      </Drawer>

      <Drawer
        title="Filter Requests"
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
              form="filterRequestForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterRequestForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Date Range">
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
          <FormItem label="Filter by Status">
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
          <FormItem label="Filter by From (Source)">
            <Controller
              name="filterFrom"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select sources..."
                  options={availableFromOptions}
                  {...field}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Request/Feedback"
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
      >
        <p>
          Are you sure you want to delete the item from "
          <strong>{itemToDelete?.name}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default RequestAndFeedback;
