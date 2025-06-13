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
import DebounceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import {
  Card,
  Drawer,
  Dropdown,
  Form,
  FormItem,
  Input,
  Tag,
} from "@/components/ui";

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
  TbBug,
  TbCalendarWeek,
  TbMailPlus,
  TbLoader,
  TbCircleCheck,
  TbCircleX,
  TbUser,
  TbMailShare,
  TbBrandWhatsapp,
  TbBell,
  TbTagStarred,
  TbCalendarClock,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getBugReportsAction,
  addBugReportAction,
  editBugReportAction,
  deleteBugReportAction,
  deleteAllBugReportsAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import classNames from "@/utils/classNames";
import { Link } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";

// --- Define Types ---
export type BugReportStatusApi = "Read" | "Unread" | string;
export type BugReportStatusForm = "Read" | "Unread";
export type BugReportSeverity = "Low" | "Medium" | "High"; // ADDED

export type BugReportItem = {
  id: string | number;
  name: string;
  email: string;
  mobile_no?: string;
  report: string;
  attachment?: string | null;
  status: BugReportStatusApi;
  severity?: BugReportSeverity; // ADDED
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
  updated_by_user?: {
    name: string;
    roles: { display_name: string }[];
  } | null;
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
  severity: z.enum(["Low", "Medium", "High"], {
    required_error: "Severity is required.",
  }),
  status: z.enum(["Read", "Unread"], {
    required_error: "Status is required.",
  }),
  attachment: z.any().optional(),
});
type BugReportFormData = z.infer<typeof bugReportFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterReportedBy: z.string().optional(),
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
  if (!rows || rows.length === 0) return false;

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

// --- ActionColumn, Search, TableTools, SelectedFooter ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
}) => {
  return (
    <div className="flex items-center justify-center text-center">
      <Tooltip title="Edit (Admin)">
        <button
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </button>
      </Tooltip>
      <Tooltip title="View Details">
        <button
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </button>
      </Tooltip>
      <Dropdown
        renderTitle={
          <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />
        }
      >
        <Dropdown.Item className="flex items-center gap-2">
          <TbBell size={18} />{" "}
          <span className="text-xs">Add Notification </span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbUser size={18} />{" "}
          <Link to="/task/task-list/create">
            <span className="text-xs">Assign to Task</span>
          </Link>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbMailShare size={18} /> <span className="text-xs">Send Email</span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbBrandWhatsapp size={18} />{" "}
          <span className="text-xs">Send Whatsapp</span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbTagStarred size={18} />{" "}
          <span className="text-xs">Add to Active </span>
        </Dropdown.Item>
        <Dropdown.Item className="flex items-center gap-2">
          <TbCalendarClock size={18} />{" "}
          <span className="text-xs">Add Schedule </span>
        </Dropdown.Item>
      </Dropdown>
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
              <span>Report{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <Button
            size="sm"
            variant="plain"
            className="text-red-600 hover:text-red-500"
            onClick={() => setDeleteConfirmOpen(true)}
            loading={isDeleting}
          >
            Delete Selected
          </Button>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Report${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={() => setDeleteConfirmOpen(false)}
        onRequestClose={() => setDeleteConfirmOpen(false)}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteConfirmOpen(false);
        }}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the selected report
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Component: BugReportListing ---
const BugReportListing = () => {
  const dispatch = useAppDispatch();
  const {
    bugReportsData: rawBugReportsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BugReportItem | null>(null);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<BugReportItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BugReportItem | null>(null);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);

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

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  useEffect(() => {
    dispatch(getBugReportsAction());
  }, [dispatch]);

  const bugReportsData: BugReportItem[] = useMemo(() => {
    if (!Array.isArray(rawBugReportsData?.data)) return [];
    return rawBugReportsData?.data.map((item: any) => ({
      ...item,
      updated_by_name: item.updated_by_user?.name || item.updated_by_name,
      updated_by_role:
        item.updated_by_user?.roles?.[0]?.display_name || item.updated_by_role,
    }));
  }, [rawBugReportsData?.data]);
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
    severity: "Low",
    status: "Unread",
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
        severity: item.severity || "Low",
        status: item.status as BugReportStatusForm,
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
    formDataPayload.append("severity", data.severity);
    formDataPayload.append("status", data.status);
    if (selectedFile) formDataPayload.append("attachment", selectedFile);

    try {
      if (editingItem) {
        formDataPayload.append("_method", "PUT");
        await dispatch(
          editBugReportAction({ id: editingItem.id, formData: formDataPayload })
        ).unwrap();
        toast.push(<Notification title="Bug Report Updated" type="success" />);
        closeEditDrawer();
      } else {
        await dispatch(addBugReportAction(formDataPayload)).unwrap();
        toast.push(
          <Notification title="Bug Report Submitted" type="success">
            Thank you for your report!
          </Notification>
        );
        closeAddDrawer();
      }
      dispatch(getBugReportsAction());
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

  const handleChangeStatus = useCallback(
    async (item: BugReportItem, newStatus: BugReportStatusForm) => {
      setIsChangingStatus(true);
      const formData = new FormData();
      formData.append("name", item.name);
      formData.append("email", item.email);
      if (item.mobile_no) formData.append("mobile_no", item.mobile_no);
      formData.append("report", item.report);
      formData.append("severity", item.severity || "Low");
      formData.append("status", newStatus);
      formData.append("_method", "PUT");

      try {
        await dispatch(editBugReportAction({ id: item.id, formData })).unwrap();
        toast.push(
          <Notification
            title="Status Changed"
            type="success"
          >{`Report status changed to ${newStatus}.`}</Notification>
        );
        dispatch(getBugReportsAction());
        if (viewingItem?.id === item.id) {
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
    [dispatch, viewingItem]
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
    try {
      await dispatch(deleteBugReportAction({ id: itemToDelete.id })).unwrap();
      toast.push(
        <Notification
          title="Report Deleted"
          type="success"
        >{`Report by "${itemToDelete.name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getBugReportsAction());
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
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
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
      dispatch(getBugReportsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger">
          {(error as Error).message}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria({
        filterStatus: data.filterStatus || [],
        filterReportedBy: data.filterReportedBy || "",
      });
      handleSetTableData({ pageIndex: 1 });
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );

  const onClearFilters = useCallback(() => {
    setFilterCriteria({ filterStatus: [], filterReportedBy: "" });
    formMethods.reset({ filterStatus: [], filterReportedBy: "" });
    handleSetTableData({ query: "", pageIndex: 1 });
    dispatch(getBugReportsAction());
  }, [formMethods]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: BugReportItem[] = cloneDeep(bugReportsData);

    if (filterCriteria.filterStatus?.length) {
      const statusValues = filterCriteria.filterStatus.map((s) => s.value);
      processedData = processedData.filter((item) =>
        statusValues.includes(item.status)
      );
    }
    if (filterCriteria.filterReportedBy) {
      const reportedByQuery = filterCriteria.filterReportedBy
        .toLowerCase()
        .trim();
      processedData = processedData.filter(
        (item) =>
          item.name.toLowerCase().includes(reportedByQuery) ||
          item.email.toLowerCase().includes(reportedByQuery)
      );
    }
    if (tableData.query) {
      const queryLower = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.name.toLowerCase().includes(queryLower) ||
          item.email.toLowerCase().includes(queryLower) ||
          item.report.toLowerCase().includes(queryLower) ||
          (item.mobile_no &&
            item.mobile_no.toLowerCase().includes(queryLower)) ||
          (item.updated_by_name?.toLowerCase() ?? "").includes(queryLower)
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
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

    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    return {
      pageData: processedData.slice(
        (pageIndex - 1) * pageSize,
        pageIndex * pageSize
      ),
      total: processedData.length,
      allFilteredAndSortedData: processedData,
    };
  }, [bugReportsData, tableData, filterCriteria]);

  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
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
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
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
    const moduleName = "Bug Reports";
    const date = new Date().toISOString().split("T")[0];
    const fileName = `bug-reports_${date}.csv`; // Dynamic filename
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName , file_name:fileName })).unwrap();
      const success = exportBugReportsToCsv(fileName, allFilteredAndSortedData);
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
      {
        header: "Contact",
        accessorKey: "mobile_no",
        size: 200,
        cell: (props) => (
          <div>
            <span>{props.row.original.email}</span> <br />
            <span>{props.row.original.mobile_no}</span>
          </div>
        ),
      },
      {
        header: "Reported On",
        accessorKey: "created_at",
        size: 200,
        enableSorting: true,
        cell: (props) => (
          <div className="text-xs">
            {new Date(props.getValue()).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </div>
        ),
      },
      {
        header: "Severity",
        accessorKey: "severity",
        size: 200,
        cell: (props) => (
          <div>
            <span>{props.row.original.severity}</span> <br />
          </div>
        ),
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        size: 200,
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } =
            props.row.original;
          const formattedDate = updated_at
            ? new Date(updated_at).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
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
        size: 100,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onViewDetail={() => openViewDrawer(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer, openViewDrawer, handleChangeStatus]
  );

  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormItem
        label={
          <div>
            Name<span className="text-red-500"> *</span>
          </div>
        }
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
        label={
          <div>
            Email<span className="text-red-500"> *</span>
          </div>
        }
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
        label="Mobile No."
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
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.severity}
        errorMessage={currentFormMethods.formState.errors.severity?.message}
      >
        <Controller
          name="severity"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select Severity"
              value={[
                { label: "Low", value: "Low" },
                { label: "Medium", value: "Medium" },
                { label: "High", value: "High" },
              ].find((opt) => opt.value === field.value)}
              options={[
                { label: "Low", value: "Low" },
                { label: "Medium", value: "Medium" },
                { label: "High", value: "High" },
              ]}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <FormItem
        label={
          <div>
            Status<span className="text-red-500"> *</span>
          </div>
        }
        className="md:col-span-1"
        invalid={!!currentFormMethods.formState.errors.status}
        errorMessage={currentFormMethods.formState.errors.status?.message}
      >
        <Controller
          name="status"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select Status"
              value={BUG_REPORT_STATUS_OPTIONS_FORM.find(
                (opt) => opt.value === field.value
              )}
              options={BUG_REPORT_STATUS_OPTIONS_FORM}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Report Description"
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
        label="Attachment"
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
        <TbUserCircle className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
        <div>
          <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Name
          </h6>
          <p className="text-gray-800 dark:text-gray-100 text-base">
            {item.name}
          </p>
        </div>
      </div>
      <div className="flex items-start">
        <TbMail className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
        <div>
          <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Email
          </h6>
          <p className="text-gray-800 dark:text-gray-100 text-base">
            {item.email}
          </p>
        </div>
      </div>
      {item.mobile_no && (
        <div className="flex items-start">
          <TbPhone className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
          <div>
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Mobile No.
            </h6>
            <p className="text-gray-800 dark:text-gray-100 text-base">
              {item.mobile_no}
            </p>
          </div>
        </div>
      )}
      <div className="flex items-start">
        <TbFileDescription className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
        <div>
          <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Report Description
          </h6>
          <p className="text-gray-800 dark:text-gray-100 text-base whitespace-pre-wrap">
            {item.report}
          </p>
        </div>
      </div>
      {item.attachment && (
        <div className="flex items-start">
          <TbPaperclip className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
          <div>
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Attachment
            </h6>
            <a
              href={itemPath(item.attachment)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline break-all text-base"
            >
              {item.attachment}
            </a>
          </div>
        </div>
      )}
      {item.created_at && (
        <div className="flex items-start">
          <TbCalendarEvent className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
          <div>
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Reported On
            </h6>
            <p className="text-gray-800 dark:text-gray-100 text-base">
              {new Date(item.created_at).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        </div>
      )}
      {item.updated_at && (
        <div className="flex items-start">
          <TbCalendarEvent className="text-xl mr-3 mt-1 text-gray-500 dark:text-gray-400" />
          <div>
            <h6 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Last Updated
            </h6>
            <p className="text-gray-800 dark:text-gray-100 text-base">
              {new Date(item.updated_at).toLocaleString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
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
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-blue-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbBug size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">
                  {rawBugReportsData?.counts?.total ?? "..."}
                </h6>
                <span className="font-semibold text-xs">Total</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-violet-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbCalendarWeek size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">
                  {rawBugReportsData?.counts?.today ?? "..."}
                </h6>
                <span className="font-semibold text-xs">Today</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-pink-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500">
                <TbMailPlus size={24} />
              </div>
              <div>
                <h6 className="text-pink-500">
                  {rawBugReportsData?.counts?.new ?? "..."}
                </h6>
                <span className="font-semibold text-xs">New</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-orange-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbLoader size={24} />
              </div>
              <div>
                <h6 className="text-orange-500">
                  {rawBugReportsData?.counts?.under_review ?? "..."}
                </h6>
                <span className="font-semibold text-xs">Under Review</span>
              </div>
            </Card>

            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-green-300"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbCircleCheck size={24} />
              </div>
              <div>
                <h6 className="text-green-500">
                  {rawBugReportsData?.counts?.resolved ?? "..."}
                </h6>
                <span className="font-semibold text-xs">Resolved</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-red-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbCircleX size={24} />
              </div>
              <div>
                <h6 className="text-red-500">
                  {rawBugReportsData?.counts?.unresolved ?? "..."}
                </h6>
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
              noData={!tableLoading && pageData.length === 0}
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
        width={520}
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
            </Button>
          </div>
        }
      >
        <Form
          id="bugReportForm"
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-4 relative pb-28"
        >
          {renderDrawerForm(formMethods)}
          {editingItem && (
            <div className="absolute bottom-[4%] w-full left-1/2 transform -translate-x-1/2">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded mt-4">
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
                  <br />
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
              form="filterBugReportForm"
              type="submit"
            >
              Apply Filters
            </Button>
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