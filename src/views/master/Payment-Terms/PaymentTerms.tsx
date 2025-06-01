// src/views/your-path/PaymentTerms.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import classNames from "classnames"; // Assuming this is imported

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
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui"; // Added Tag

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbReload,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useAppDispatch } from "@/reduxtool/store";
import {
  getPaymentTermAction,
  addPaymentTermAction,
  editPaymentTermAction,
  deletePaymentTermAction,
  deleteAllPaymentTermAction,
  submitExportReasonAction, // Placeholder for future action
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// Type for Select options
type SelectOption = {
  value: string | number;
  label: string;
};

// --- Define PaymentTermsItem Type ---
export type PaymentTermsItem = {
  id: string | number;
  term_name: string;
  status: "Active" | "Inactive"; // Added status field
  created_at?: string; // Added for audit
  updated_at?: string; // Added for audit
  updated_by_name?: string; // Added for audit
  updated_by_role?: string; // Added for audit
};

// --- Status Options ---
const statusOptions: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

// --- Zod Schema for Add/Edit Payment Term Form ---
const paymentTermFormSchema = z.object({
  term_name: z
    .string()
    .min(1, "Payment term name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required.",
  }), // Added status
});
type PaymentTermFormData = z.infer<typeof paymentTermFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatus: z // Added status filter
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
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

// --- CSV Exporter Utility ---
const CSV_HEADERS_PAYMENT_TERM = [
  "ID",
  "Payment Term Name",
  "Status",
  "Updated By",
  "Updated Role",
  "Updated At",
];
type PaymentTermExportItem = Omit<
  PaymentTermsItem,
  "created_at" | "updated_at"
> & {
  status: "Active" | "Inactive";
  updated_at_formatted?: string;
};
const CSV_KEYS_PAYMENT_TERM_EXPORT: (keyof PaymentTermExportItem)[] = [
  "id",
  "term_name",
  "status",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];

function exportToCsvPaymentTerm(filename: string, rows: PaymentTermsItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: PaymentTermExportItem[] = rows.map((row) => ({
    id: row.id,
    term_name: row.term_name,
    status: row.status,
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_PAYMENT_TERM.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return CSV_KEYS_PAYMENT_TERM_EXPORT.map((k) => {
          let cell = row[k as keyof PaymentTermExportItem];
          if (cell === null || cell === undefined) {
            cell = "";
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
    // Success toast now handled by handleConfirmExportWithReason
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

// --- ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center">
      <Tooltip title="Edit">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Delete">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          )}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  );
};

// --- PaymentTermSearch Component ---
type PaymentTermSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const PaymentTermSearch = React.forwardRef<
  HTMLInputElement,
  PaymentTermSearchProps
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
PaymentTermSearch.displayName = "PaymentTermSearch";

// --- PaymentTermTableTools Component ---
const PaymentTermTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <PaymentTermSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Button
          title="Clear Filters"
          icon={<TbReload />}
          onClick={() => onClearFilters()}
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
          onClick={onExport} // Will open export reason modal
          className="w-full sm:w-auto"
        >
          Export
        </Button>
      </div>
    </div>
  );
};

// --- PaymentTermTable Component ---
type PaymentTermTableProps = {
  columns: ColumnDef<PaymentTermsItem>[];
  data: PaymentTermsItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: PaymentTermsItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: PaymentTermsItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<PaymentTermsItem>[]) => void;
};
const PaymentTermTable = ({
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
}: PaymentTermTableProps) => {
  return (
    <DataTable
      selectable
      columns={columns}
      data={data}
      noData={!loading && data.length === 0}
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
    />
  );
};

// --- PaymentTermSelectedFooter Component ---
type PaymentTermSelectedFooterProps = {
  selectedItems: PaymentTermsItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean; // Added for loading state
};
const PaymentTermSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting, // Added
}: PaymentTermSelectedFooterProps) => {
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
              loading={isDeleting} // Added loading state
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Payment Term${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={isDeleting} // Added loading state
      >
        <p>
          Are you sure you want to delete the selected payment term
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main PaymentTerms Component ---
const PaymentTerms = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingPaymentTerm, setEditingPaymentTerm] =
    useState<PaymentTermsItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Used for both single and multi-delete

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [paymentTermToDelete, setPaymentTermToDelete] =
    useState<PaymentTermsItem | null>(null);

  // State for export reason modal
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterStatus: [], // Added
  });

  const { PaymentTermsData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  const defaultFormValues: PaymentTermFormData = useMemo(
    () => ({
      term_name: "",
      status: "Active", // Default status
    }),
    []
  );

  useEffect(() => {
    dispatch(getPaymentTermAction());
  }, [dispatch]);

  const addFormMethods = useForm<PaymentTermFormData>({
    resolver: zodResolver(paymentTermFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<PaymentTermFormData>({
    resolver: zodResolver(paymentTermFormSchema),
    defaultValues: defaultFormValues,
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

  const openAddDrawer = () => {
    addFormMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(false);
  };
  const onAddPaymentTermSubmit = async (data: PaymentTermFormData) => {
    setIsSubmitting(true);
    try {
      // API expected to handle audit fields, only send form data
      await dispatch(addPaymentTermAction(data)).unwrap();
      toast.push(
        <Notification title="Payment Term Added" type="success" duration={2000}>
          Payment Term "{data.term_name}" added.
        </Notification>
      );
      closeAddDrawer();
      dispatch(getPaymentTermAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {error.message || "Could not add payment term."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (term: PaymentTermsItem) => {
    setEditingPaymentTerm(term);
    editFormMethods.reset({
      term_name: term.term_name,
      status: term.status || "Active", // Set status, default to Active
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingPaymentTerm(null);
    editFormMethods.reset(defaultFormValues);
    setIsEditDrawerOpen(false);
  };
  const onEditPaymentTermSubmit = async (data: PaymentTermFormData) => {
    if (!editingPaymentTerm?.id) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Payment Term ID is missing.
        </Notification>
      );
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      // API expected to handle audit fields
      await dispatch(
        editPaymentTermAction({ id: editingPaymentTerm.id, ...data })
      ).unwrap();
      toast.push(
        <Notification
          title="Payment Term Updated"
          type="success"
          duration={2000}
        >
          Payment Term "{data.term_name}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getPaymentTermAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {error.message || "Could not update payment term."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (term: PaymentTermsItem) => {
    if (term.id === undefined || term.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Payment Term ID is missing.
        </Notification>
      );
      return;
    }
    setPaymentTermToDelete(term);
    setSingleDeleteConfirmOpen(true);
  };

  const onConfirmSingleDelete = async () => {
    if (!paymentTermToDelete?.id) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Payment Term ID is missing.
        </Notification>
      );
      setIsDeleting(false);
      setPaymentTermToDelete(null);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(
        deletePaymentTermAction({ id: paymentTermToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Payment Term Deleted"
          type="success"
          duration={2000}
        >
          Payment Term "{paymentTermToDelete.term_name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== paymentTermToDelete!.id)
      );
      dispatch(getPaymentTermAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete payment term.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setPaymentTermToDelete(null);
    }
  };
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.push(
        <Notification title="No Selection" type="info">
          Please select items to delete.
        </Notification>
      );
      return;
    }
    setIsDeleting(true);
    const validItemsToDelete = selectedItems.filter(
      (item) => item.id !== undefined && item.id !== null
    );
    if (validItemsToDelete.length !== selectedItems.length) {
      const skippedCount = selectedItems.length - validItemsToDelete.length;
      toast.push(
        <Notification title="Deletion Warning" type="warning" duration={3000}>
          {skippedCount} item(s) could not be processed due to missing IDs and
          were skipped.
        </Notification>
      );
    }
    if (validItemsToDelete.length === 0) {
      toast.push(
        <Notification title="No Valid Items" type="info">
          No valid items to delete.
        </Notification>
      );
      setIsDeleting(false);
      return;
    }
    const idsToDelete = validItemsToDelete.map((item) => String(item.id));
    try {
      await dispatch(
        deleteAllPaymentTermAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >
          {validItemsToDelete.length} payment term(s) successfully processed for
          deletion.
        </Notification>
      );
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected payment terms."}
        </Notification>
      );
    } finally {
      setSelectedItems([]);
      dispatch(getPaymentTermAction());
      setIsDeleting(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterNames: data.filterNames || [],
      filterStatus: data.filterStatus || [], // Added
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = {
      filterNames: [],
      filterStatus: [], // Added
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  };

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<PaymentTermsItem[]>([]);

  const paymentTermNameOptions = useMemo(() => {
    if (!Array.isArray(PaymentTermsData)) return [];
    const uniqueNames = new Set(PaymentTermsData.map((term) => term.term_name));
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [PaymentTermsData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: PaymentTermsItem[] = Array.isArray(PaymentTermsData)
      ? PaymentTermsData.map((item) => ({
          ...item,
          status: item.status || "Inactive", // Ensure status has a default
        }))
      : [];
    let processedData: PaymentTermsItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterNames?.length) {
      const names = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        names.includes(item.term_name?.trim().toLowerCase() ?? "")
      );
    }
    if (filterCriteria.filterStatus?.length) {
      // Added status filter
      const statuses = filterCriteria.filterStatus.map((opt) => opt.value);
      processedData = processedData.filter((item) =>
        statuses.includes(item.status)
      );
    }

    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.term_name?.trim().toLowerCase() ?? "").includes(query) ||
          (item.status?.trim().toLowerCase() ?? "").includes(query) || // Search by status
          (item.updated_by_name?.trim().toLowerCase() ?? "").includes(query) ||
          String(item.id ?? "")
            .trim()
            .toLowerCase()
            .includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      ["id", "term_name", "status", "updated_at", "updated_by_name"].includes(
        key
      )
    ) {
      // Added status and audit keys
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "updated_at") {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        } else if (key === "status") {
          aValue = a.status ?? "";
          bValue = b.status ?? "";
        } else {
          aValue = a[key as keyof PaymentTermsItem] ?? "";
          bValue = b[key as keyof PaymentTermsItem] ?? "";
        }

        return order === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }

    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: processedData.slice(startIndex, startIndex + pageSize),
      total: currentTotal,
      allFilteredAndSortedData: processedData,
    };
  }, [PaymentTermsData, tableData, filterCriteria]);

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
    const moduleName = "Payment Terms";
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: moduleName,
        })
      ).unwrap();
    } catch (error: any) {
      setIsSubmittingExportReason(false);
      return;
    }
    const success = exportToCsvPaymentTerm(
      "payment_terms_export.csv",
      allFilteredAndSortedData
    );
    if (success) {
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
    }
    setIsSubmittingExportReason(false);
    setIsExportReasonModalOpen(false);
  };


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
    (checked: boolean, row: PaymentTermsItem) => {
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
    (checked: boolean, currentRows: Row<PaymentTermsItem>[]) => {
      const currentPageRowOriginals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prevSelected) => {
          const prevSelectedIds = new Set(prevSelected.map((item) => item.id));
          const newRowsToAdd = currentPageRowOriginals.filter(
            (r) => !prevSelectedIds.has(r.id)
          );
          return [...prevSelected, ...newRowsToAdd];
        });
      } else {
        const currentPageRowIds = new Set(
          currentPageRowOriginals.map((r) => r.id)
        );
        setSelectedItems((prevSelected) =>
          prevSelected.filter((item) => !currentPageRowIds.has(item.id))
        );
      }
    },
    []
  );

  const columns: ColumnDef<PaymentTermsItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 100 },
      {
        header: "Payment Term Name",
        accessorKey: "term_name",
        enableSorting: true,
      },
      {
        // Added Updated Info Column
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        meta: { HeaderClass: "text-red-500" },
        size: 170,
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } =
            props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", { month: "long" })} ${new Date(
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
        // Added Status Column
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 100,
        cell: (props) => {
          const status = props.row.original.status;
          return (
            <Tag
              className={classNames(
                "capitalize font-semibold whitespace-nowrap",
                {
                  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500":
                    status === "Active",
                  "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500":
                    status === "Inactive",
                }
              )}
            >
              {status}
            </Tag>
          );
        },
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        size: 120,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openEditDrawer, handleDeleteClick] // Added dependencies
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Payment Terms</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <PaymentTermTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal} // Changed to open reason modal
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <PaymentTermTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
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

      <PaymentTermSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        isDeleting={isDeleting}
      />

      {[
        {
          formMethods: addFormMethods,
          onSubmit: onAddPaymentTermSubmit,
          isOpen: isAddDrawerOpen,
          closeFn: closeAddDrawer,
          title: "Add Payment Term",
          formId: "addPaymentTermForm",
          submitText: "Adding...",
          saveText: "Save",
          isEdit: false,
        },
        {
          formMethods: editFormMethods,
          onSubmit: onEditPaymentTermSubmit,
          isOpen: isEditDrawerOpen,
          closeFn: closeEditDrawer,
          title: "Edit Payment Term",
          formId: "editPaymentTermForm",
          submitText: "Saving...",
          saveText: "Save",
          isEdit: true,
        },
      ].map((drawerProps) => (
        <Drawer
          key={drawerProps.formId}
          title={drawerProps.title}
          isOpen={drawerProps.isOpen}
          onClose={drawerProps.closeFn}
          onRequestClose={drawerProps.closeFn}
          width={600}
          footer={
            <div className="text-right w-full">
              <Button
                size="sm"
                className="mr-2"
                onClick={drawerProps.closeFn}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="solid"
                form={drawerProps.formId}
                type="submit"
                loading={isSubmitting}
                disabled={
                  !drawerProps.formMethods.formState.isValid || isSubmitting
                }
              >
                {isSubmitting ? drawerProps.submitText : drawerProps.saveText}
              </Button>
            </div>
          }
        >
          <Form
            id={drawerProps.formId}
            onSubmit={drawerProps.formMethods.handleSubmit(
              drawerProps.onSubmit as any
            )}
            className="flex flex-col gap-4 relative pb-28"
          >
            <FormItem
              label="Payment Term Name"
              invalid={!!drawerProps.formMethods.formState.errors.term_name}
              errorMessage={
                drawerProps.formMethods.formState.errors.term_name?.message as
                  | string
                  | undefined
              }
            >
              <Controller
                name="term_name"
                control={drawerProps.formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter Payment Term Name" />
                )}
              />
            </FormItem>
            <FormItem
              label="Status"
              invalid={!!drawerProps.formMethods.formState.errors.status}
              errorMessage={
                drawerProps.formMethods.formState.errors.status?.message as
                  | string
                  | undefined
              }
            >
              <Controller
                name="status"
                control={drawerProps.formMethods.control}
                render={({ field }) => (
                  <Select
                    placeholder="Select Status"
                    options={statusOptions}
                    value={
                      statusOptions.find(
                        (option) => option.value === field.value
                      ) || null
                    }
                    onChange={(option) =>
                      field.onChange(option ? option.value : "")
                    }
                  />
                )}
              />
            </FormItem>
          </Form>
          {drawerProps.isEdit && editingPaymentTerm && (
            <div className="absolute bottom-[14%] w-[92%]">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                <div>
                  <b className="mt-3 mb-3 font-semibold text-primary">
                    Latest Update By:
                  </b>
                  <br />
                  <p className="text-sm font-semibold">
                    {editingPaymentTerm.updated_by_name || "N/A"}
                  </p>
                  <p>{editingPaymentTerm.updated_by_role || "N/A"}</p>
                </div>
                <div>
                  <br />
                  <span className="font-semibold">Created At:</span>{" "}
                  <span>
                    {editingPaymentTerm.created_at
                      ? new Date(editingPaymentTerm.created_at).toLocaleString(
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
                  <span className="font-semibold">Updated At:</span>{" "}
                  <span>
                    {editingPaymentTerm.updated_at
                      ? new Date(editingPaymentTerm.updated_at).toLocaleString(
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
        </Drawer>
      ))}

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={400}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterPaymentTermForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterPaymentTermForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Payment Term Name">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select payment term names..."
                  options={paymentTermNameOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select status..."
                  options={statusOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

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
          id="exportReasonForm"
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

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Payment Term"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setPaymentTermToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setPaymentTermToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setPaymentTermToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the payment term "
          <strong>{paymentTermToDelete?.term_name}</strong>"?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default PaymentTerms;
