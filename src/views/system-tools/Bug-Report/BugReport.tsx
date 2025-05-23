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
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";
import Textarea from "@/views/ui-components/forms/Input/Textarea"; // Ensure path is correct

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
  TbDotsVertical,
  TbShare,
  TbEye,
  TbUserCircle,
  TbFileDescription,
  TbPaperclip,
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
  getBugReportsAction, // Placeholder
  addBugReportAction, // Placeholder
  editBugReportAction, // Placeholder
  deleteBugReportAction, // Placeholder
  deleteAllBugReportsAction, // Placeholder
} from "@/reduxtool/master/middleware"; // Adjust path as necessary
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust as necessary

// --- Define Types ---
export type BugReportStatusApi = "Read" | "Unread" | string; // From your API
export type BugReportStatusForm = "Read" | "Unread"; // For form select

export type BugReportItem = {
  // Matches your API listing data
  id: string | number;
  name: string;
  email: string;
  mobile_no?: string;
  report: string; // Main description
  attachment?: string | null; // Filename or path
  status: BugReportStatusApi;
  reported_by?: string; // Internal logger
  created_by?: string; // User ID who created
  created_at?: string;
  updated_at?: string;
};

// --- Constants for Form Selects & Display ---
const BUG_REPORT_STATUS_OPTIONS_FORM: {
  value: BugReportStatusForm;
  label: string;
}[] = [
  { value: "Unread", label: "Unread" },
  { value: "Read", label: "Read" },
];
const bugReportStatusFormValues = BUG_REPORT_STATUS_OPTIONS_FORM.map(
  (s) => s.value
) as [BugReportStatusForm, ...BugReportStatusForm[]];

const bugStatusColor: Record<BugReportStatusApi, string> = {
  Unread:
    "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  Read: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
};

// --- Zod Schema for Add/Edit Bug Report Form ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
  attachment: z
    .any() // For FileList or file object
    .optional()
    .refine(
      (files) =>
        !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (files) =>
        !files ||
        files.length === 0 ||
        ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Unsupported file type."
    ),
  // Fields below are not typically in the "Add Bug Report" user form but are part of the data model
  status: z.enum(bugReportStatusFormValues).optional(), // Status might be set by system or admin
  reported_by: z.string().max(100).optional().or(z.literal("")), // Could be auto-filled
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

// --- CSV Exporter Utility ---
const CSV_HEADERS_BUG = [
  "ID",
  "Name",
  "Email",
  "Mobile No",
  "Report",
  "Attachment",
  "Status",
  "Reported By",
  "Created At",
];
const CSV_KEYS_BUG: (keyof BugReportItem)[] = [
  "id",
  "name",
  "email",
  "mobile_no",
  "report",
  "attachment",
  "status",
  "reported_by",
  "created_at",
];
// ... (exportBugReportsToCsv function - similar to previous, ensure keys match)
function exportBugReportsToCsv(filename: string, rows: BugReportItem[]) {
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
    CSV_HEADERS_BUG.join(separator) +
    "\n" +
    rows
      .map((row: any) =>
        CSV_KEYS_BUG.map((k) => {
          let cell: any = row[k];
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

// --- ActionColumn (can be the more comprehensive one) ---
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
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Share">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
          role="button"
        >
          <TbDotsVertical />
        </div>
      </Tooltip>
    </div>
  );
};
type ItemSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange }, ref) => (
    <DebouceInput
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
};
const ItemTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    {" "}
    <div className="flex-grow">
      <ItemSearch onInputChange={onSearchChange} />
    </div>{" "}
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {" "}
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>{" "}
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>{" "}
    </div>{" "}
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
        title={`Delete ${selectedItems.length} Report${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        {" "}
        <p>
          Are you sure you want to delete the selected report
          {selectedItems.length > 1 ? "s" : ""}?
        </p>{" "}
      </ConfirmDialog>{" "}
    </>
  );
};

// --- Main Component: BugReportListing ---
const BugReportListing = () => {
  const dispatch = useAppDispatch();
  const {
    bugReportsData = [], // Ensure this field name matches your masterSlice state
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BugReportItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<BugReportItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<BugReportItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // For file input

  useEffect(() => {
    dispatch(getBugReportsAction());
  }, [dispatch]);

  const defaultFormValues: BugReportFormData = {
    name: "",
    email: "",
    mobile_no: "",
    report: "",
    attachment: undefined, // Default for file input
    status: "Unread", // Default status for new reports
    reported_by: "", // Could be auto-filled with logged-in user's name/ID
  };

  const formMethods = useForm<BugReportFormData>({
    resolver: zodResolver(bugReportFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset(defaultFormValues);
    setSelectedFile(null); // Clear selected file for new report
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [formMethods, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: BugReportItem) => {
      setEditingItem(item);
      setSelectedFile(null); // Clear selected file, user must re-select if changing
      formMethods.reset({
        name: item.name,
        email: item.email,
        mobile_no: item.mobile_no || "",
        report: item.report,
        attachment: undefined, // File input cannot be pre-filled for security reasons
        status: item.status as BugReportStatusForm,
        reported_by: item.reported_by || "",
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);

  const onSubmitHandler = async (data: BugReportFormData) => {
    setIsSubmitting(true);
    const loggedInUser = { id: "1", name: "Admin" }; // Placeholder for actual logged-in user

    // Use FormData for file uploads
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    if (data.mobile_no) formData.append("mobile_no", data.mobile_no);
    formData.append("report", data.report);
    if (data.status) formData.append("status", data.status); // For edit, status is from form

    // For 'reported_by', if it's an admin action, it might be the admin's ID/name
    // If it's a public form, 'reported_by' might be same as 'name' or system-derived
    formData.append("reported_by", data.reported_by || loggedInUser.name); // Example

    if (selectedFile) {
      // The 'attachment' from Zod schema is for validation, use 'selectedFile' state
      formData.append("attachment", selectedFile);
    }

    // If it's an add operation, set created_by and default status if not in form
    if (!editingItem) {
      formData.append("created_by", loggedInUser.id);
      if (!data.status) formData.append("status", "Unread"); // Default for new if not in form
    } else {
      // For edit, send existing created_by if API needs it, or let backend handle
      if (editingItem.created_by)
        formData.append("created_by", editingItem.created_by);
    }

    try {
      if (editingItem) {
        // For PUT requests with FormData, some backends might need `_method: 'PUT'` if using POST to simulate PUT
        // formData.append('_method', 'PUT'); // If your backend needs this for FormData with PUT
        await dispatch(
          editBugReportAction({ id: editingItem.id, formData })
        ).unwrap();
        toast.push(
          <Notification
            title="Bug Report Updated"
            type="success"
            duration={2000}
          >
            Report updated.
          </Notification>
        );
        closeEditDrawer();
      } else {
        await dispatch(addBugReportAction(formData)).unwrap();
        toast.push(
          <Notification
            title="Bug Report Submitted"
            type="success"
            duration={2000}
          >
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
          duration={3000}
        >
          {error?.message || "Operation failed."}
        </Notification>
      );
      console.error("Bug Report Submit Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeStatus = useCallback(
    async (item: BugReportItem) => {
      setIsChangingStatus(true);
      const newStatus = item.status === "Read" ? "Unread" : "Read";

      // For status change, we also need to send other potentially required fields
      // or have a dedicated API endpoint for just status update.
      // Assuming editBugReportAction can handle partial updates or expects full object.
      const formData = new FormData();
      formData.append("name", item.name);
      formData.append("email", item.email);
      if (item.mobile_no) formData.append("mobile_no", item.mobile_no);
      formData.append("report", item.report);
      formData.append("status", newStatus);
      if (item.reported_by) formData.append("reported_by", item.reported_by);
      if (item.created_by) formData.append("created_by", item.created_by);
      // Don't resend attachment unless it's being changed.
      // If API requires attachment field even if not changing, send current attachment name/path.
      // if (item.attachment) formData.append('attachment_name', item.attachment); // Example if API needs existing name

      try {
        await dispatch(editBugReportAction({ id: item.id, formData })).unwrap();
        toast.push(
          <Notification
            title="Status Changed"
            type="success"
            duration={2000}
          >{`Report status changed to ${newStatus}.`}</Notification>
        );
        dispatch(getBugReportsAction());
      } catch (error: any) {
        toast.push(
          <Notification
            title="Status Change Failed"
            type="danger"
            duration={3000}
          >
            {error.message}
          </Notification>
        );
        console.error("Change Status Error:", error);
      } finally {
        setIsChangingStatus(false);
      }
    },
    [dispatch]
  );

  // Delete Handlers
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
          duration={2000}
        >{`Report by "${itemToDelete.name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getBugReportsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {error.message}
        </Notification>
      );
      console.error("Delete Error:", error);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const validItems = selectedItems.filter((item) => item.id);
    if (validItems.length === 0) {
      setIsDeleting(false);
      return;
    }
    const idsToDelete = validItems.map((item) => String(item.id));
    try {
      await dispatch(
        deleteAllBugReportsAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >{`${validItems.length} report(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getBugReportsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message}
        </Notification>
      );
      console.error("Bulk Delete Error:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  // Filter Handlers
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
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterStatus: [], filterReportedBy: "" };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  }, [filterFormMethods]);

  // Data Processing for Table
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: BugReportItem[] = Array.isArray(bugReportsData)
      ? bugReportsData
      : [];
    let processedData: BugReportItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterStatus?.length) {
      const v = filterCriteria.filterStatus.map((s) => s.value);
      processedData = processedData.filter((item) => v.includes(item.status));
    }
    if (filterCriteria.filterReportedBy?.trim()) {
      const rb = filterCriteria.filterReportedBy.toLowerCase();
      processedData = processedData.filter((item) =>
        item.reported_by?.toLowerCase().includes(rb)
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const q = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (b) =>
          (b.name?.toLowerCase() ?? "").includes(q) ||
          (b.email?.toLowerCase() ?? "").includes(q) ||
          (b.report?.toLowerCase() ?? "").includes(q) ||
          (b.reported_by?.toLowerCase() ?? "").includes(q) ||
          String(b.id).toLowerCase().includes(q)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof BugReportItem];
        const bVal = b[key as keyof BugReportItem];
        if (key === "created_at" || key === "updated_at") {
          const dateA = aVal ? new Date(aVal as string).getTime() : 0;
          const dateB = bVal ? new Date(bVal as string).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
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

  const handleExportData = useCallback(() => {
    const success = exportBugReportsToCsv(
      "bug_reports_export.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success" duration={2000}>
          Data exported.
        </Notification>
      );
  }, [allFilteredAndSortedData]);
  // Table interaction handlers
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);
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
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
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
          const nRTA = cPOR.filter((r) => !pSIds.has(r.id));
          return [...pS, ...nRTA];
        });
      } else {
        const cPRIds = new Set(cPOR.map((r) => r.id));
        setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id)));
      }
    },
    []
  );

  // Columns for Listing
  const columns: ColumnDef<BugReportItem>[] = useMemo(
    () => [
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
                "capitalize whitespace-nowrap",
                bugStatusColor[statusVal] || "bg-gray-100 text-gray-600"
              )}
            >
              {statusVal}
            </Tag>
          );
        },
      },
      {
        header: "Name",
        accessorKey: "name",
        size: 180,
        enableSorting: true,
        cell: (props) => (
          <span className="font-semibold">{props.getValue<string>()}</span>
        ),
      },
      { header: "Email", accessorKey: "email", size: 200, enableSorting: true },
      {
        header: "Mobile No",
        accessorKey: "mobile_no",
        size: 130,
        enableSorting: false,
        cell: (props) => props.getValue() || "-",
      },
      {
        header: "Reported By",
        accessorKey: "reported_by",
        size: 130,
        enableSorting: true,
        cell: (props) => props.getValue() || "N/A",
      },
      {
        header: "Date",
        accessorKey: "created_at",
        size: 120,
        enableSorting: true,
        cell: (props) =>
          props.getValue()
            ? new Date(props.getValue<string>()).toLocaleDateString()
            : "-",
      },
      {
        header: "Actions",
        id: "actions",
        meta: { headerClass: "text-center", cellClass: "text-center" },
        size: 140,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onChangeStatus={() => handleChangeStatus(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick, handleChangeStatus] // Dependencies for actions
  );

  // Render Form for Add/Edit Drawer
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
              prefix={<TbUserCircle />}
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
              prefix={<TbMail />}
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
              prefix={<TbPhone />}
              placeholder="+XX-XXXXXXXXXX"
            />
          )}
        />
      </FormItem>
      {/* Reported By and Status are usually set by admin or system, not by the user reporting the bug initially */}
      {(isEditDrawerOpen || (isAddDrawerOpen && false)) && ( // Only show status/reported_by in edit mode, or for admin add.
        // For a public bug report form, these might be hidden or auto-filled.
        // For this example, making them available in edit.
        <>
          <FormItem
            label="Status"
            invalid={!!currentFormMethods.formState.errors.status}
            errorMessage={currentFormMethods.formState.errors.status?.message}
          >
            <Controller
              name="status"
              control={currentFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Set Status"
                  options={BUG_REPORT_STATUS_OPTIONS_FORM}
                  value={BUG_REPORT_STATUS_OPTIONS_FORM.find(
                    (o) => o.value === field.value
                  )}
                  onChange={(opt) => field.onChange(opt?.value)}
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Reported By (Internal)"
            invalid={!!currentFormMethods.formState.errors.reported_by}
            errorMessage={
              currentFormMethods.formState.errors.reported_by?.message
            }
          >
            <Controller
              name="reported_by"
              control={currentFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="e.g., Support Team / Your Name"
                />
              )}
            />
          </FormItem>
        </>
      )}
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
            <Input textArea 
              {...field}
              rows={6}
              prefix={<TbFileDescription />}
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
                onChange(file); // RHF expects the file object or FileList
                setSelectedFile(file || null);
              }}
              prefix={<TbPaperclip />}
            />
          )}
        />
        {editingItem?.attachment &&
          !selectedFile && ( // Show current attachment if editing and no new file selected
            <div className="mt-2 text-sm text-gray-500">
              Current:{" "}
              <a
                href={itemPath(editingItem.attachment)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {editingItem.attachment}
              </a>
            </div>
          )}
      </FormItem>
    </div>
  );
  const itemPath = (filename: any) => {
    // Replace with your actual base URL for attachments
    const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
    return `${baseUrl}/storage/attachments/bug_reports/${filename}`;
  };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">
              Bug Reports
            </h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <ItemTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <DataTable
              columns={columns} // These columns are defined for BugReportItem
              data={pageData} // This data is of type BugReportItem[]
              loading={
                masterLoadingStatus === "loading" ||
                isSubmitting ||
                isDeleting ||
                isChangingStatus
              }
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectable
              checkboxChecked={(row: BugReportItem) =>
                selectedItems.some((selected) => selected.id === row.id)
              } // Type assertion for row
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect} // DataTable's prop
              onIndeterminateCheckBoxChange={handleAllRowSelect} // DataTable's prop
              // noData={!loading && pageData.length === 0}
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
              {" "}
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Submitting..."
                : editingItem
                ? "Save Changes"
                : "Save"}{" "}
            </Button>{" "}
          </div>
        }
      >
        <Form
          id="bugReportForm"
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-4"
        >
          {renderDrawerForm(formMethods)}
        </Form>
      </Drawer>

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">
              Clear
            </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterBugReportForm"
                type="submit"
              >
                Apply
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
          <FormItem label="Reported By (Internal)">
            <Controller
              name="filterReportedBy"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter username or ID to filter"
                />
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
      >
        <p>
          Are you sure you want to delete the report by "
          <strong>{itemToDelete?.name}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default BugReportListing;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
