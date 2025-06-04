// src/views/your-path/BugReportListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected spelling
import Select from "@/components/ui/Select";
import { Card, Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbMail,
  TbPhone,
  TbEye,
  TbUserCircle,
  TbFileDescription,
  TbPaperclip,
  TbCalendarEvent,
  TbInfoCircle,
  TbReload,
  TbUserPlus,
  TbBug,
  TbCalendarWeek,
  TbMailPlus,
  TbLoader,
  TbCircleCheck,
  TbCircleX,
  // TbTrash, // Already imported, no need to re-declare if ActionColumn handles it
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import type { SelectOption } from "@/@types/select"; // Assuming SelectOption type is available globally or define it

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getBugReportsAction,
  addBugReportAction,
  editBugReportAction,
  deleteBugReportAction,
  deleteAllBugReportsAction,
  submitExportReasonAction, // Added for export reason
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import classNames from "@/utils/classNames";
import { Link } from "react-router-dom";

// --- Define Types ---
export type BugReportStatusApi = "Read" | "Unread" | string;
export type BugReportStatusForm = "Read" | "Unread";

export type BugReportItem = {
  id: string | number;
  name: string;
  email: string;
  mobile_no?: string;
  report: string;
  attachment?: string | null;
  status: BugReportStatusApi;
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string; // Added
  updated_by_role?: string; // Added
};

const BUG_REPORT_STATUS_OPTIONS_FORM: {
  value: BugReportStatusForm;
  label: string;
}[] = [
    { value: "Unread", label: "Unread" },
    { value: "Read", label: "Read" },
  ];

const bugStatusColor: Record<BugReportStatusApi, string> = {
  Unread:
    "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  Read: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
};

// --- Zod Schema for Add/Edit Bug Report Form ---
const bugReportFormSchema = z.object({
  name: z.string().min(1, "Name is required.").max(100, "Name too long"),
  email: z.string().email("Invalid email format.").min(1, "Email is required."),
  mobile_no: z
    .string()
    .max(20, "Mobile number too long.")
    .optional()
    .or(z.literal("")),
  report: z
    .string()
    .min(10, "Report description must be at least 10 characters.")
    .max(5000, "Report too long"),
  attachment: z.any().optional(),
});
type BugReportFormData = z.infer<typeof bugReportFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterReportedBy: z.string().optional(), // This searches user's name/email, not updated_by_name
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter ---
const CSV_HEADERS_BUG = [
  "ID",
  "Name",
  "Email",
  "Mobile No",
  "Report",
  "Attachment",
  "Status",
  "Created At",
  "Updated By",
  "Updated Role",
  "Updated At",
];

type BugReportExportItem = Omit<BugReportItem, "created_at" | "updated_at"> & {
  created_at_formatted?: string;
  updated_at_formatted?: string;
};

const CSV_KEYS_BUG_EXPORT: (keyof BugReportExportItem)[] = [
  "id",
  "name",
  "email",
  "mobile_no",
  "report",
  "attachment",
  "status",
  "created_at_formatted",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];

function exportBugReportsToCsv(filename: string, rows: BugReportItem[]) {
  if (!rows || rows.length === 0) {
    // Toast handled by caller
    return false;
  }
  const preparedRows: BugReportExportItem[] = rows.map((row) => ({
    ...row,
    mobile_no: row.mobile_no || "N/A",
    attachment: row.attachment || "N/A",
    created_at_formatted: row.created_at
      ? new Date(row.created_at).toLocaleString()
      : "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_BUG.join(separator) +
    "\n" +
    preparedRows
      .map((row) =>
        CSV_KEYS_BUG_EXPORT.map((k) => {
          let cell = row[k as keyof BugReportExportItem];
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

// --- ActionColumn, Search, TableTools, SelectedFooter (mostly unchanged, minor adjustments if needed) ---
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
    <div className="flex items-center justify-center text-center">
      {" "}
      <Tooltip title="Edit (Admin)">
        {" "}
        <button
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </button>
      </Tooltip>{" "}
      <Tooltip title="View Details">
        {" "}
        <button
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </button>
      </Tooltip>{" "}
      <Tooltip title="Assign to task">
        {" "}
        <button
          className={`text-xl cursor-pointer mr-0.5 select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`}
          role="button"
        >
          <Link to="/task/task-list/create" >
            <TbUserPlus size={18} />
          </Link>
        </button>
      </Tooltip>{" "}
    </div>
  );
};
type ItemSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange }, ref) => (
    <DebounceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
};
const ItemTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <ItemSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button
        icon={<TbReload />}
        onClick={onClearFilters}
        title="Clear Filters"
      ></Button>
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

type BugReportsSelectedFooterProps = {
  selectedItems: BugReportItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
};
const BugReportsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: BugReportsSelectedFooterProps) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  const handleDeleteClick = () => setDeleteConfirmOpen(true);
  const handleCancelDelete = () => setDeleteConfirmOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmOpen(false);
  };
  return (
    <>
      {" "}
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        {" "}
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          {" "}
          <span className="flex items-center gap-2">
            {" "}
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>{" "}
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              {" "}
              <span className="heading-text">{selectedItems.length}</span>{" "}
              <span>Report{selectedItems.length > 1 ? "s" : ""} selected</span>{" "}
            </span>{" "}
          </span>{" "}
          <Button
            size="sm"
            variant="plain"
            className="text-red-600 hover:text-red-500"
            onClick={handleDeleteClick}
            loading={isDeleting}
          >
            Delete Selected
          </Button>{" "}
        </div>{" "}
      </StickyFooter>{" "}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Report${selectedItems.length > 1 ? "s" : ""
          }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      >
        {" "}
        <p>
          Are you sure you want to delete the selected report
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>{" "}
      </ConfirmDialog>{" "}
    </>
  );
};

// --- Main Component: BugReportListing ---
const BugReportListing = () => {
  const dispatch = useAppDispatch();
  const { bugReportsData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BugReportItem | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<BugReportItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false); // Kept for status change logic if any
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BugReportItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterStatus: [],
    filterReportedBy: "",
  });
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<BugReportItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- Export Reason Modal State ---
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  useEffect(() => {
    const currentParams = {
      ...tableData,
      filterStatus: filterCriteria.filterStatus?.map((s) => s.value),
      filterReportedBy: filterCriteria.filterReportedBy,
    };
    dispatch(getBugReportsAction({ params: currentParams }));
  }, [dispatch]); // Simplified initial fetch, detailed fetches in handlers

  const itemPath = (filename: any) => {
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
    return filename
      ? `${baseUrl}/storage/attachments/bug_reports/${filename}`
      : "#";
  };

  const defaultAddFormValues: BugReportFormData = {
    name: "",
    email: "",
    mobile_no: "",
    report: "",
    attachment: undefined,
  };

  const formMethods = useForm<BugReportFormData>({
    resolver: zodResolver(bugReportFormSchema),
    defaultValues: defaultAddFormValues,
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

  const openAddDrawer = useCallback(() => {
    formMethods.reset(defaultAddFormValues);
    setSelectedFile(null);
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [formMethods, defaultAddFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: BugReportItem) => {
      setEditingItem(item);
      setSelectedFile(null);
      formMethods.reset({
        name: item.name,
        email: item.email,
        mobile_no: item.mobile_no || "",
        report: item.report,
        attachment: undefined,
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);

  const openViewDrawer = useCallback((item: BugReportItem) => {
    setViewingItem(item);
    setIsViewDrawerOpen(true);
  }, []);
  const closeViewDrawer = useCallback(() => {
    setViewingItem(null);
    setIsViewDrawerOpen(false);
  }, []);

  const onSubmitHandler = async (data: BugReportFormData) => {
    setIsSubmitting(true);
    const formDataPayload = new FormData();
    formDataPayload.append("name", data.name);
    formDataPayload.append("email", data.email);
    if (data.mobile_no) formDataPayload.append("mobile_no", data.mobile_no);
    formDataPayload.append("report", data.report);
    if (selectedFile) formDataPayload.append("attachment", selectedFile);

    const paramsForRefetch = {
      ...tableData,
      filterStatus: filterCriteria.filterStatus?.map((s) => s.value),
      filterReportedBy: filterCriteria.filterReportedBy,
    };

    try {
      if (editingItem) {
        formDataPayload.append("status", editingItem.status); // Preserve existing status or allow change via a form field
        formDataPayload.append("_method", "PUT");
        await dispatch(
          editBugReportAction({ id: editingItem.id, formData: formDataPayload })
        ).unwrap();
        toast.push(<Notification title="Bug Report Updated" type="success" />);
        closeEditDrawer();
      } else {
        formDataPayload.append("status", "Unread"); // Default for new
        await dispatch(addBugReportAction(formDataPayload)).unwrap();
        toast.push(
          <Notification title="Bug Report Submitted" type="success">
            Thank you for your report!
          </Notification>
        );
        closeAddDrawer();
      }
      dispatch(getBugReportsAction({ params: paramsForRefetch }));
    } catch (error: any) {
      toast.push(
        <Notification
          title={editingItem ? "Update Failed" : "Submission Failed"}
          type="danger"
        >
          {(error as Error).message || "Operation failed."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Example direct status change, can be invoked from ActionColumn or a dedicated button in ViewDrawer
  const handleChangeStatus = useCallback(
    async (item: BugReportItem, newStatus: BugReportStatusForm) => {
      setIsChangingStatus(true);
      // Create a FormData object even if not sending files, as editBugReportAction expects it.
      // Or, create a separate action for status change if API supports it.
      const formData = new FormData();
      formData.append("name", item.name); // API might require all fields or just the changed ones
      formData.append("email", item.email);
      if (item.mobile_no) formData.append("mobile_no", item.mobile_no);
      formData.append("report", item.report);
      formData.append("status", newStatus);
      formData.append("_method", "PUT"); // Important for Laravel or similar backends

      const paramsForRefetch = {
        ...tableData,
        filterStatus: filterCriteria.filterStatus?.map((s) => s.value),
        filterReportedBy: filterCriteria.filterReportedBy,
      };
      try {
        await dispatch(editBugReportAction({ id: item.id, formData })).unwrap();
        toast.push(
          <Notification
            title="Status Changed"
            type="success"
          >{`Report status changed to ${newStatus}.`}</Notification>
        );
        dispatch(getBugReportsAction({ params: paramsForRefetch }));
        if (viewingItem?.id === item.id) {
          // If viewing this item, update its state too
          setViewingItem((prev) =>
            prev ? { ...prev, status: newStatus } : null
          );
        }
      } catch (error: any) {
        toast.push(
          <Notification title="Status Change Failed" type="danger">
            {(error as Error).message}
          </Notification>
        );
      } finally {
        setIsChangingStatus(false);
      }
    },
    [dispatch, tableData, filterCriteria, viewingItem]
  );

  const handleDeleteClick = useCallback((item: BugReportItem) => {
    if (!item.id) return;
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    const paramsForRefetch = {
      ...tableData,
      filterStatus: filterCriteria.filterStatus?.map((s) => s.value),
      filterReportedBy: filterCriteria.filterReportedBy,
    };
    try {
      await dispatch(deleteBugReportAction({ id: itemToDelete.id })).unwrap();
      toast.push(
        <Notification
          title="Report Deleted"
          type="success"
        >{`Report by "${itemToDelete.name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getBugReportsAction({ params: paramsForRefetch }));
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger">
          {(error as Error).message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete, tableData, filterCriteria]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
    const paramsForRefetch = {
      ...tableData,
      filterStatus: filterCriteria.filterStatus?.map((s) => s.value),
      filterReportedBy: filterCriteria.filterReportedBy,
    };
    try {
      await dispatch(
        deleteAllBugReportsAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
        >{`${idsToDelete.length} report(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getBugReportsAction({ params: paramsForRefetch }));
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger">
          {(error as Error).message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems, tableData, filterCriteria]);

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      const newFilterCriteria = {
        filterStatus: data.filterStatus || [],
        filterReportedBy: data.filterReportedBy || "",
      };
      setFilterCriteria(newFilterCriteria);
      const newPageIndex = 1;
      setTableData((prev) => ({ ...prev, pageIndex: newPageIndex }));
      dispatch(
        getBugReportsAction({
          params: {
            ...tableData,
            pageIndex: newPageIndex,
            filterStatus: newFilterCriteria.filterStatus?.map((s) => s.value),
            filterReportedBy: newFilterCriteria.filterReportedBy,
          },
        })
      );
      closeFilterDrawer();
    },
    [closeFilterDrawer, dispatch, tableData]
  );

  const onClearFilters = useCallback(() => {
    const defaultFilters: FilterFormData = {
      filterStatus: [],
      filterReportedBy: "",
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    const newPageIndex = 1;
    setTableData((prev) => ({ ...prev, pageIndex: newPageIndex, query: "" })); // Also clear search query
    dispatch(
      getBugReportsAction({
        params: {
          ...tableData,
          pageIndex: newPageIndex,
          query: "",
          filterStatus: [],
          filterReportedBy: "",
        },
      })
    );
  }, [filterFormMethods, dispatch, tableData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: BugReportItem[] = Array.isArray(bugReportsData)
      ? bugReportsData
      : [];
    let processedData: BugReportItem[] = cloneDeep(sourceData);

    // Apply filters (client-side on top of potential server-side filtering)
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const statusValues = filterCriteria.filterStatus.map((s) => s.value);
      processedData = processedData.filter((item) =>
        statusValues.includes(item.status)
      );
    }
    if (
      filterCriteria.filterReportedBy &&
      filterCriteria.filterReportedBy.trim() !== ""
    ) {
      const reportedByQuery = filterCriteria.filterReportedBy
        .toLowerCase()
        .trim();
      processedData = processedData.filter(
        (item) =>
          item.name.toLowerCase().includes(reportedByQuery) ||
          item.email.toLowerCase().includes(reportedByQuery)
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const queryLower = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.name.toLowerCase().includes(queryLower) ||
          item.email.toLowerCase().includes(queryLower) ||
          item.report.toLowerCase().includes(queryLower) ||
          (item.mobile_no &&
            item.mobile_no.toLowerCase().includes(queryLower)) ||
          (item.updated_by_name?.toLowerCase() ?? "").includes(queryLower) // Search by updated_by_name
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      [
        "name",
        "email",
        "status",
        "created_at",
        "updated_at",
        "updated_by_name",
      ].includes(String(key))
    ) {
      processedData.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === "created_at" || key === "updated_at") {
          const dateA = a[key as "created_at" | "updated_at"]
            ? new Date(a[key as "created_at" | "updated_at"]!).getTime()
            : 0;
          const dateB = b[key as "created_at" | "updated_at"]
            ? new Date(b[key as "created_at" | "updated_at"]!).getTime()
            : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          aVal = a[key as keyof BugReportItem] ?? "";
          bVal = b[key as keyof BugReportItem] ?? "";
        }
        if (typeof aVal === "number" && typeof bVal === "number")
          return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
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
  }, [bugReportsData, tableData, filterCriteria]);

  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) => {
      const newTableData = { ...tableData, ...data };
      setTableData(newTableData);
      // Only dispatch if it's a change that requires server data (sort, page, global query)
      // Filters have their own dispatch logic in onApplyFilters/onClearFilters
      if (
        data.sort ||
        data.pageIndex ||
        data.pageSize ||
        (data.query !== undefined && data.query !== tableData.query)
      ) {
        dispatch(
          getBugReportsAction({
            params: {
              ...newTableData,
              filterStatus: filterCriteria.filterStatus?.map((s) => s.value),
              filterReportedBy: filterCriteria.filterReportedBy,
            },
          })
        );
      }
    },
    [tableData, dispatch, filterCriteria]
  );

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Bug Reports"; // Module name for this export
    try {
      await dispatch(
        submitExportReasonAction({ reason: data.reason, module: moduleName })
      ).unwrap();
      // toast.push(<Notification title="Export Reason Submitted" type="success" />); // Optional: can be combined
      const success = exportBugReportsToCsv(
        "bug_reports_export.csv",
        allFilteredAndSortedData
      );
      if (success) {
        toast.push(
          <Notification title="Data Exported" type="success">
            Bug reports data exported successfully.
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
  const handleRowSelect = useCallback(
    (checked: boolean, row: BugReportItem) => {
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
    (checked: boolean, currentRows: Row<BugReportItem>[]) => {
      const cPOR = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((pS) => {
          const pSIds = new Set(pS.map((i) => i.id));
          const nRTA = cPOR.filter((r) => r.id && !pSIds.has(r.id));
          return [...pS, ...nRTA];
        });
      } else {
        const cPRIds = new Set(
          cPOR.map((r) => r.id).filter((id) => id !== undefined)
        );
        setSelectedItems((pS) => pS.filter((i) => i.id && !cPRIds.has(i.id)));
      }
    },
    []
  );

  const columns: ColumnDef<BugReportItem>[] = useMemo(
    () => [
      {
        header: "Reported By",
        accessorKey: "name",
        size: 180,
        enableSorting: true,
        cell: (props) => (
          <span className="font-semibold">{props.getValue<string>()}</span>
        ),
      },
      // { header: "", accessorKey: "email", size: 200, enableSorting: true },
      {
        header: "Contact",
        accessorKey: "mobile_no",
        size: 130,
        cell: (props) => {

          return (
            <div className="">
              <span>{props.row.original.email}</span> <br />
              <span>{props.row.original.mobile_no}</span>
            </div>
          )
        },
      },
      {
        header: "Reported On",
        accessorKey: "created_at",
        size: 200,
        enableSorting: true,
        cell: (props) => {
          return (
            <div className="text-xs">
              {`${new Date(props.getValue()).getDate()} ${new Date(
                props.getValue()
              ).toLocaleString("en-US", { month: "short" })} ${new Date(
                props.getValue()
              ).getFullYear()}, ${new Date(props.getValue()).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}`}
            </div>
          )
        }
      },
      {
        header: "Severity",
        enableSorting: true,
        meta: { HeaderClass: "text-red-500" },
        cell: (props) => {
          return <Tag className="bg-red-100 text-red-500 text-[10px]">Critical</Tag>
        }
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        size: 170,
        meta: { HeaderClass: "text-red-500" },
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } =
            props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
              updated_at
            ).toLocaleString("en-US", { month: "short" })} ${new Date(
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
        header: "Status",
        accessorKey: "status",
        size: 120,
        enableSorting: true,
        cell: (props) => {
          const statusVal = props.getValue<BugReportStatusApi>();
          return (
            <Tag
              className={classNames(
                "capitalize whitespace-nowrap min-w-[60px] text-center",
                bugStatusColor[statusVal] ||
                "bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100"
              )}
            >
              {statusVal || "N/A"}
            </Tag>
          );
        },
      },
      {
        header: "Actions",
        id: "actions",
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        size: 100, // Reduced size as one icon removed
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onViewDetail={() => openViewDrawer(props.row.original)}
            onChangeStatus={() =>
              handleChangeStatus(
                props.row.original,
                props.row.original.status === "Read" ? "Unread" : "Read"
              )
            }
          />
        ),
      },
    ],
    [openEditDrawer, openViewDrawer, handleChangeStatus]
  );

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem
        label="Name"
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.name}
        errorMessage={currentFormMethods.formState.errors.name?.message}
      >
        <Controller
          name="name"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<TbUserCircle className="text-lg" />}
              placeholder="Your Name"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Email"
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.email}
        errorMessage={currentFormMethods.formState.errors.email?.message}
      >
        <Controller
          name="email"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              type="email"
              prefix={<TbMail className="text-lg" />}
              placeholder="your.email@example.com"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Mobile No. (Optional)"
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.mobile_no}
        errorMessage={currentFormMethods.formState.errors.mobile_no?.message}
      >
        <Controller
          name="mobile_no"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              type="tel"
              prefix={<TbPhone className="text-lg" />}
              placeholder="+XX-XXXXXXXXXX"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Severity"
        className="md:col-span-1 text-red-500"
      >
        <Controller
          name="severity"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="Select Severity"
              options={[
                { label: "Low", value: "Low" },
                { label: "Medium", value: "Medium" },
                { label: "High", value: "High" },
                { label: "Critical", value: "Critical" },
              ]}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Report / Description"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.report}
        errorMessage={currentFormMethods.formState.errors.report?.message}
      >
        <Controller
          name="report"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Input
              textArea
              {...field}
              rows={6}
              prefix={<TbFileDescription className="text-lg mt-2.5" />}
              placeholder="Please describe the bug in detail..."
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Attachment (Optional)"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.attachment}
        errorMessage={
          currentFormMethods.formState.errors.attachment?.message as string
        }
      >
        <Controller
          name="attachment"
          control={currentFormMethods.control}
          render={({ field: { onChange, onBlur, name, ref } }) => (
            <Input
              type="file"
              name={name}
              ref={ref}
              onBlur={onBlur}
              onChange={(e) => {
                const file = e.target.files?.[0];
                onChange(file);
                setSelectedFile(file || null);
              }}
              prefix={<TbPaperclip className="text-lg" />}
            />
          )}
        />
        {editingItem?.attachment && !selectedFile && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Current:{" "}
            <a
              href={itemPath(editingItem.attachment)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              {editingItem.attachment}
            </a>
          </div>
        )}
      </FormItem>
    </div>
  );

  const renderViewDetails = (item: BugReportItem) => (
    <div className="p-1 space-y-5">
      <div className="flex items-center justify-between">
        {" "}
        {/* Status and change button */}
        <div className="flex items-start">
          <TbInfoCircle className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
          <div>
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Status
            </h6>
            <Tag
              className={classNames(
                "capitalize text-sm",
                bugStatusColor[item.status] ||
                "bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100"
              )}
            >
              {item.status}
            </Tag>
          </div>
        </div>
        <Button
          size="xs"
          variant="twoTone"
          onClick={() =>
            handleChangeStatus(item, item.status === "Read" ? "Unread" : "Read")
          }
          loading={isChangingStatus && viewingItem?.id === item.id}
          disabled={isChangingStatus && viewingItem?.id === item.id}
        >
          Mark as {item.status === "Read" ? "Unread" : "Read"}
        </Button>
      </div>
      <div className="flex items-start">
        {" "}
        <TbUserCircle className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />{" "}
        <div>
          {" "}
          <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Name
          </h6>{" "}
          <p className="text-gray-800 dark:text-gray-100 text-base">
            {item.name}
          </p>{" "}
        </div>{" "}
      </div>
      <div className="flex items-start">
        {" "}
        <TbMail className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />{" "}
        <div>
          {" "}
          <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Email
          </h6>{" "}
          <p className="text-gray-800 dark:text-gray-100 text-base">
            {item.email}
          </p>{" "}
        </div>{" "}
      </div>
      {item.mobile_no && (
        <div className="flex items-start">
          {" "}
          <TbPhone className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />{" "}
          <div>
            {" "}
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Mobile No.
            </h6>{" "}
            <p className="text-gray-800 dark:text-gray-100 text-base">
              {item.mobile_no}
            </p>{" "}
          </div>{" "}
        </div>
      )}
      <div className="flex items-start">
        {" "}
        <TbFileDescription className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />{" "}
        <div>
          {" "}
          <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Report Description
          </h6>{" "}
          <p className="text-gray-800 dark:text-gray-100 text-base whitespace-pre-wrap">
            {item.report}
          </p>{" "}
        </div>{" "}
      </div>
      {item.attachment && (
        <div className="flex items-start">
          {" "}
          <TbPaperclip className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />{" "}
          <div>
            {" "}
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Attachment
            </h6>{" "}
            <a
              href={itemPath(item.attachment)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline break-all text-base"
            >
              {item.attachment}
            </a>{" "}
          </div>{" "}
        </div>
      )}
      {item.created_at && (
        <div className="flex items-start">
          {" "}
          <TbCalendarEvent className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />{" "}
          <div>
            {" "}
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Reported On
            </h6>{" "}
            <p className="text-gray-800 dark:text-gray-100 text-base">
              {new Date(item.created_at).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>{" "}
          </div>{" "}
        </div>
      )}
      {item.updated_at && (
        <div className="flex items-start">
          {" "}
          <TbCalendarEvent className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />{" "}
          <div>
            {" "}
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Last Updated
            </h6>{" "}
            <p className="text-gray-800 dark:text-gray-100 text-base">
              {new Date(item.updated_at).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>{" "}
          </div>{" "}
        </div>
      )}
      {(item.updated_by_name || item.updated_by_role) && (
        <div className="flex items-start">
          <TbUserCircle className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
          <div>
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Last Updated By
            </h6>
            <p className="text-gray-800 dark:text-gray-100 text-base">
              {item.updated_by_name || "N/A"}{" "}
              {item.updated_by_role && `(${item.updated_by_role})`}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const tableLoading =
    masterLoadingStatus === "pending" ||
    isSubmitting ||
    isDeleting ||
    isChangingStatus;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Bug Reports</h5>

            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={openAddDrawer}
              disabled={tableLoading}
            >
              Add New
            </Button>
          </div>
          <div className="grid grid-cols-6 mb-4 gap-2">
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbBug size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">879</h6>
                <span className="font-semibold text-xs">Total</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-violet-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbCalendarWeek size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">23</h6>
                <span className="font-semibold text-xs">Today</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-pink-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                <TbMailPlus size={24} />
              </div>
              <div>
                <h6 className="text-pink-500">34</h6>
                <span className="font-semibold text-xs">New</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbLoader size={24} />
              </div>
              <div>
                <h6 className="text-orange-500">345</h6>
                <span className="font-semibold text-xs">Under Review</span>
              </div>
            </Card>

            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300" >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbCircleCheck size={24} />
              </div>
              <div>
                <h6 className="text-green-500">879</h6>
                <span className="font-semibold text-xs">Resolved</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-red-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbCircleX size={24} />
              </div>
              <div>
                <h6 className="text-red-500">78</h6>
                <span className="font-semibold text-xs">Unresolved</span>
              </div>
            </Card>

          </div>
          <ItemTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
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
              checkboxChecked={(row: BugReportItem) =>
                selectedItems.some((selected) => selected.id === row.id)
              }
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <BugReportsSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        isDeleting={isDeleting}
      />

      <Drawer
        title={editingItem ? "Edit Bug Report" : "Report New Bug"}
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={700}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button
              size="sm"
              className="mr-2"
              onClick={editingItem ? closeEditDrawer : closeAddDrawer}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="bugReportForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Submitting..."
                : editingItem
                  ? "Save"
                  : "Submit"}
            </Button>{" "}
          </div>
        }
      >
        <Form
          id="bugReportForm"
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-4 relative pb-28"
        >
          {" "}
          {/* Added relative pb-28 */}
          {renderDrawerForm(formMethods)}
          {editingItem && (
            <div className="absolute bottom-[4%] w-full left-1/2 transform -translate-x-1/2">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded mt-4">
                {" "}
                {/* Increased padding and mt */}
                <div>
                  <b className="mt-3 mb-3 font-semibold text-primary">
                    Latest Update:
                  </b>
                  <br />
                  <p className="text-sm font-medium mt-1">
                    {editingItem.updated_by_name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {editingItem.updated_by_role || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  {" "}
                  <br />
                  {/* Align text to right for dates */}
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    Created:
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-300">
                    {editingItem.created_at
                      ? new Date(editingItem.created_at).toLocaleString(
                        "en-US",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )
                      : "N/A"}
                  </span>
                  <br />
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    Updated:
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-300">
                    {editingItem.updated_at
                      ? new Date(editingItem.updated_at).toLocaleString(
                        "en-US",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Form>
      </Drawer>

      <Drawer
        title="Bug Report Details"
        isOpen={isViewDrawerOpen}
        onClose={closeViewDrawer}
        onRequestClose={closeViewDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            <Button size="sm" variant="solid" onClick={closeViewDrawer}>
              Close
            </Button>
          </div>
        }
      >
        {viewingItem && renderViewDetails(viewingItem)}
      </Drawer>

      <Drawer
        title="Filter Bug Reports"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button
              size="sm"
              className="mr-2"
              onClick={onClearFilters}
              type="button"
            >
              Clear
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="filterBugReportForm"
              type="submit"
            >
              Apply Filters
            </Button>{" "}
          </div>
        }
      >
        <Form
          id="filterBugReportForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Any Status"
                  options={BUG_REPORT_STATUS_OPTIONS_FORM.map((s) => ({
                    value: s.value,
                    label: s.label,
                  }))}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Reported By (Name/Email)">
            <Controller
              name="filterReportedBy"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter name or email to filter" />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Bug Report"
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
        confirmButtonColor="red-600"
      >
        <p>
          Are you sure you want to delete the report by "
          <strong>{itemToDelete?.name}</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>

      {/* --- Export Reason Modal --- */}
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Exporting Bug Reports"
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
          id="exportBugReportsReasonForm"
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

export default BugReportListing;

// function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(" "); } // Already available via import utils
