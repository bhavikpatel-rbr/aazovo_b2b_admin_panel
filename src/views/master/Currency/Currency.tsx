// src/views/your-path/Currency.tsx

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
import ConfirmDialog from "@/components/shared/ConfirmDialog"; // Kept for export reason modal
// import StickyFooter from "@/components/shared/StickyFooter"; // Commented out
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  // TbTrash, // Commented out
  // TbChecks, // Commented out
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
  // Row, // Commented out
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useAppDispatch } from "@/reduxtool/store";
import {
  getCurrencyAction,
  addCurrencyAction,
  editCurrencyAction,
  // deleteCurrencyAction, // Commented out
  // deleteAllCurrencyAction, // Commented out
  submitExportReasonAction, // Placeholder for future action
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// Type for Select options
type SelectOption = {
  value: string | number;
  label: string;
};

// --- Define CurrencyItem Type ---
export type CurrencyItem = {
  id: string | number;
  currency_code: string;
  currency_symbol: string;
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Status Options ---
const statusOptions: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

// --- Zod Schema for Add/Edit Currency Form ---
const currencyFormSchema = z.object({
  currency_code: z
    .string()
    .min(1, "Currency code is required.")
    .max(10, "Code cannot exceed 10 characters."),
  currency_symbol: z
    .string()
    .min(1, "Currency symbol is required.")
    .max(5, "Symbol cannot exceed 5 characters."),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required.",
  }),
});
type CurrencyFormData = z.infer<typeof currencyFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterCodes: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterSymbols: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatus: z
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
const CSV_HEADERS_CURRENCY = [
  "ID",
  "Currency Code",
  "Currency Symbol",
  "Status",
  "Updated By",
  "Updated Role",
  "Updated At",
];
type CurrencyExportItem = Omit<CurrencyItem, "created_at" | "updated_at"> & {
  status: "Active" | "Inactive";
  updated_at_formatted?: string;
};
const CSV_KEYS_CURRENCY_EXPORT: (keyof CurrencyExportItem)[] = [
  "id",
  "currency_code",
  "currency_symbol",
  "status",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];

function exportToCsvCurrency(filename: string, rows: CurrencyItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: CurrencyExportItem[] = rows.map((row) => ({
    id: row.id,
    currency_code: row.currency_code,
    currency_symbol: row.currency_symbol,
    status: row.status,
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_CURRENCY.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return CSV_KEYS_CURRENCY_EXPORT.map((k) => {
          let cell = row[k as keyof CurrencyExportItem];
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
}: // onDelete, // Commented out
{
  onEdit: () => void;
  // onDelete: () => void; // Commented out
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
      {/* <Tooltip title="Delete"> // Commented out
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
      </Tooltip> */}
    </div>
  );
};

// --- CurrencySearch Component ---
type CurrencySearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const CurrencySearch = React.forwardRef<HTMLInputElement, CurrencySearchProps>(
  ({ onInputChange }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        className="w-full"
        placeholder="Quick Search..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
      />
    );
  }
);
CurrencySearch.displayName = "CurrencySearch";

// --- CurrencyTableTools Component ---
const CurrencyTableTools = ({
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
        <CurrencySearch onInputChange={onSearchChange} />
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
          onClick={onExport}
          className="w-full sm:w-auto"
        >
          Export
        </Button>
      </div>
    </div>
  );
};

// --- CurrencyTable Component ---
type CurrencyTableProps = {
  columns: ColumnDef<CurrencyItem>[];
  data: CurrencyItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  // selectedItems: CurrencyItem[]; // Commented out
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  // onRowSelect: (checked: boolean, row: CurrencyItem) => void; // Commented out
  // onAllRowSelect: (checked: boolean, rows: Row<CurrencyItem>[]) => void; // Commented out
};
const CurrencyTable = ({
  columns,
  data,
  loading,
  pagingData,
  // selectedItems, // Commented out
  onPaginationChange,
  onSelectChange,
  onSort,
}: // onRowSelect, // Commented out
// onAllRowSelect, // Commented out
CurrencyTableProps) => {
  return (
    <DataTable
      // selectable // Commented out
      columns={columns}
      data={data}
      noData={!loading && data.length === 0}
      loading={loading}
      pagingData={pagingData}
      // checkboxChecked={(row) => // Commented out
      //   selectedItems.some((selected) => selected.id === row.id)
      // }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      // onCheckBoxChange={onRowSelect} // Commented out
      // onIndeterminateCheckBoxChange={onAllRowSelect} // Commented out
    />
  );
};

/* // --- CurrencySelectedFooter Component (Commented out) ---
type CurrencySelectedFooterProps = {
  selectedItems: CurrencyItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean; 
};
const CurrencySelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting, 
}: CurrencySelectedFooterProps) => {
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
              loading={isDeleting} 
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Currency${
          selectedItems.length > 1 ? "ies" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={isDeleting} 
      >
        <p>
          Are you sure you want to delete the selected currency
          {selectedItems.length > 1 ? "ies" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};
*/

// --- Main Currency Component ---
const Currency = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyItem | null>(
    null
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false); // Commented out

  // const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false); // Commented out
  // const [currencyToDelete, setCurrencyToDelete] = useState<CurrencyItem | null>(null); // Commented out

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterCodes: [],
    filterSymbols: [],
    filterStatus: [],
  });

  const { CurrencyData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  const defaultFormValues: CurrencyFormData = useMemo(
    () => ({
      currency_code: "",
      currency_symbol: "",
      status: "Active",
    }),
    []
  );

  useEffect(() => {
    dispatch(getCurrencyAction());
  }, [dispatch]);

  const addFormMethods = useForm<CurrencyFormData>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<CurrencyFormData>({
    resolver: zodResolver(currencyFormSchema),
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
  const onAddCurrencySubmit = async (data: CurrencyFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(addCurrencyAction(data)).unwrap();
      toast.push(
        <Notification title="Currency Added" type="success" duration={2000}>
          Currency "{data.currency_code}" added.
        </Notification>
      );
      closeAddDrawer();
      dispatch(getCurrencyAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {error.message || "Could not add currency."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (currency: CurrencyItem) => {
    setEditingCurrency(currency);
    editFormMethods.reset({
      currency_code: currency.currency_code,
      currency_symbol: currency.currency_symbol,
      status: currency.status || "Active",
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingCurrency(null);
    editFormMethods.reset(defaultFormValues);
    setIsEditDrawerOpen(false);
  };
  const onEditCurrencySubmit = async (data: CurrencyFormData) => {
    if (!editingCurrency?.id) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Currency ID is missing.
        </Notification>
      );
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(
        editCurrencyAction({ id: editingCurrency.id, ...data })
      ).unwrap();
      toast.push(
        <Notification title="Currency Updated" type="success" duration={2000}>
          Currency "{data.currency_code}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getCurrencyAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {error.message || "Could not update currency."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* // --- Delete Logic (Commented out) ---
  const handleDeleteClick = (currency: CurrencyItem) => {
    if (currency.id === undefined || currency.id === null) {
      toast.push(<Notification title="Error" type="danger">Cannot delete: Currency ID is missing.</Notification>);
      return;
    }
    setCurrencyToDelete(currency);
    setSingleDeleteConfirmOpen(true);
  };

  const onConfirmSingleDelete = async () => {
    if (!currencyToDelete?.id) {
      toast.push(<Notification title="Error" type="danger">Cannot delete: Currency ID is missing.</Notification>);
      setIsDeleting(false); setCurrencyToDelete(null); setSingleDeleteConfirmOpen(false); return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteCurrencyAction({id: currencyToDelete.id})).unwrap();
      toast.push(
        <Notification title="Currency Deleted" type="success" duration={2000}>
          Currency "{currencyToDelete.currency_code}" deleted.
        </Notification>
      );
      // setSelectedItems((prev) => prev.filter((item) => item.id !== currencyToDelete!.id)); // selectedItems commented
      dispatch(getCurrencyAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete currency.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setCurrencyToDelete(null);
    }
  };
  const handleDeleteSelected = async () => {
    // if (selectedItems.length === 0) { // selectedItems commented
    //   toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>);
    //   return;
    // }
    setIsDeleting(true);
    // const validItemsToDelete = selectedItems.filter(item => item.id !== undefined && item.id !== null); // selectedItems commented
    // if (validItemsToDelete.length !== selectedItems.length) { // selectedItems commented
    //   const skippedCount = selectedItems.length - validItemsToDelete.length; // selectedItems commented
    //   toast.push(<Notification title="Deletion Warning" type="warning" duration={3000}>{skippedCount} item(s) could not be processed due to missing IDs and were skipped.</Notification>);
    // }
    // if (validItemsToDelete.length === 0) { // selectedItems commented
    //   toast.push(<Notification title="No Valid Items" type="info">No valid items to delete.</Notification>);
    //   setIsDeleting(false); return;
    // }
    // const idsToDelete = validItemsToDelete.map((item) => String(item.id)); // selectedItems commented
    try {
      // await dispatch(deleteAllCurrencyAction({ ids: idsToDelete.join(',') })).unwrap(); // selectedItems commented
      // toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{validItemsToDelete.length} currency(ies) successfully processed for deletion.</Notification>); // selectedItems commented
    } catch (error: any) {
      // toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || "Failed to delete selected currencies."}</Notification>);
    } finally {
      // setSelectedItems([]); // selectedItems commented
      dispatch(getCurrencyAction());
      setIsDeleting(false);
    }
  };
  */ // --- End Delete Logic ---

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterCodes: data.filterCodes || [],
      filterSymbols: data.filterSymbols || [],
      filterStatus: data.filterStatus || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = {
      filterCodes: [],
      filterSymbols: [],
      filterStatus: [],
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
  // const [selectedItems, setSelectedItems] = useState<CurrencyItem[]>([]); // Commented out

  const currencyCodeOptions = useMemo(() => {
    if (!Array.isArray(CurrencyData)) return [];
    const uniqueCodes = new Set(
      CurrencyData.map((currency) => currency.currency_code)
    );
    return Array.from(uniqueCodes).map((code) => ({
      value: code,
      label: code,
    }));
  }, [CurrencyData]);

  const currencySymbolOptions = useMemo(() => {
    if (!Array.isArray(CurrencyData)) return [];
    const uniqueSymbols = new Set(
      CurrencyData.map((currency) => currency.currency_symbol)
    );
    return Array.from(uniqueSymbols).map((symbol) => ({
      value: symbol,
      label: symbol,
    }));
  }, [CurrencyData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: CurrencyItem[] = Array.isArray(CurrencyData)
      ? CurrencyData.map((item) => ({
          ...item,
          status: item.status || "Inactive",
        }))
      : [];
    let processedData: CurrencyItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterCodes?.length) {
      const codes = filterCriteria.filterCodes.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        codes.includes(item.currency_code?.trim().toLowerCase() ?? "")
      );
    }
    if (filterCriteria.filterSymbols?.length) {
      const symbols = filterCriteria.filterSymbols.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        symbols.includes(item.currency_symbol?.trim().toLowerCase() ?? "")
      );
    }
    if (filterCriteria.filterStatus?.length) {
      const statuses = filterCriteria.filterStatus.map((opt) => opt.value);
      processedData = processedData.filter((item) =>
        statuses.includes(item.status)
      );
    }

    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.currency_code?.trim().toLowerCase() ?? "").includes(query) ||
          (item.currency_symbol?.trim().toLowerCase() ?? "").includes(query) ||
          (item.status?.trim().toLowerCase() ?? "").includes(query) ||
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
      [
        "id",
        "currency_code",
        "currency_symbol",
        "status",
        "updated_at",
        "updated_by_name",
      ].includes(key)
    ) {
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
          aValue = a[key as keyof CurrencyItem] ?? "";
          bValue = b[key as keyof CurrencyItem] ?? "";
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
  }, [CurrencyData, tableData, filterCriteria]);

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
    const moduleName = "Currency";
    try {
      await dispatch(submitExportReasonAction({
        reason: data.reason,
        module: moduleName,
      })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      
      // Proceed with CSV export after successful reason submission
      exportToCsvCurrency("currencies_export.csv", allFilteredAndSortedData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Failed to Submit Reason"
          type="danger"
          message={error.message}
        />
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
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
      handleSetTableData({
        pageSize: Number(value),
        pageIndex: 1,
      }); /* setSelectedItems([]); // Commented out */
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

  /* // --- Row Select Logic (Commented out) ---
  const handleRowSelect = useCallback((checked: boolean, row: CurrencyItem) => {
    // setSelectedItems((prev) => {
    //   if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
    //   return prev.filter((item) => item.id !== row.id);
    // });
  }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<CurrencyItem>[]) => {
    // const currentPageRowOriginals = currentRows.map((r) => r.original);
    // if (checked) {
    //   setSelectedItems((prevSelected) => {
    //     const prevSelectedIds = new Set(prevSelected.map((item) => item.id));
    //     const newRowsToAdd = currentPageRowOriginals.filter((r) => !prevSelectedIds.has(r.id));
    //     return [...prevSelected, ...newRowsToAdd];
    //   });
    // } else {
    //   const currentPageRowIds = new Set(currentPageRowOriginals.map((r) => r.id));
    //   setSelectedItems((prevSelected) => prevSelected.filter((item) => !currentPageRowIds.has(item.id)));
    // }
  }, []);
  */ // --- End Row Select Logic ---

  const columns: ColumnDef<CurrencyItem>[] = useMemo(
    () => [
      // { header: "ID", accessorKey: "id", enableSorting: true, size: 100 },
      {
        header: "Currency Code",
        accessorKey: "currency_code",
        enableSorting: true,
        size:180
      },
      {
        header: "Currency Symbol",
        accessorKey: "currency_symbol",
        enableSorting: true,
        size:180
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        meta: { HeaderClass: "text-red-500" },
        size: 120,
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
        enableSorting: true,
        size: 80,
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
        size: 80,
        cell: (props) => (
          <ActionColumn
            onEdit={() =>
              openEditDrawer(props.row.original)
            } /* onDelete={() => handleDeleteClick(props.row.original)} // Commented out */
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openEditDrawer /*, handleDeleteClick // Commented out */]
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Currencies</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New
            </Button>
          </div>
          <CurrencyTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <CurrencyTable
              columns={columns}
              data={pageData}
              // loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting /* isDeleting commented */}
              loading={masterLoadingStatus === "loading" || isSubmitting}
              pagingData={{
                total: total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              // selectedItems={selectedItems} // Commented out
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              // onRowSelect={handleRowSelect} // Commented out
              // onAllRowSelect={handleAllRowSelect} // Commented out
            />
          </div>
        </AdaptiveCard>
      </Container>

      {/* <CurrencySelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} /> // Commented out */}

      {[
        {
          formMethods: addFormMethods,
          onSubmit: onAddCurrencySubmit,
          isOpen: isAddDrawerOpen,
          closeFn: closeAddDrawer,
          title: "Add Currency",
          formId: "addCurrencyForm",
          submitText: "Adding...",
          saveText: "Save",
          isEdit: false,
        },
        {
          formMethods: editFormMethods,
          onSubmit: onEditCurrencySubmit,
          isOpen: isEditDrawerOpen,
          closeFn: closeEditDrawer,
          title: "Edit Currency",
          formId: "editCurrencyForm",
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
          width={520}
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
            className="flex flex-col relative"
          >
            <FormItem
              label="Currency Code"
              invalid={!!drawerProps.formMethods.formState.errors.currency_code}
              errorMessage={
                drawerProps.formMethods.formState.errors.currency_code
                  ?.message as string | undefined
              }
            >
              <Controller
                name="currency_code"
                control={drawerProps.formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter Currency Code (e.g., USD)"
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Currency Symbol"
              invalid={
                !!drawerProps.formMethods.formState.errors.currency_symbol
              }
              errorMessage={
                drawerProps.formMethods.formState.errors.currency_symbol
                  ?.message as string | undefined
              }
            >
              <Controller
                name="currency_symbol"
                control={drawerProps.formMethods.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter Currency Symbol (e.g., $)"
                  />
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
          {drawerProps.isEdit && editingCurrency && (
            <div className="absolute bottom-[14%] w-[92%]">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                <div>
                  <b className="mt-3 mb-3 font-semibold text-primary">
                    Latest Update:
                  </b>
                  <br />
                  <p className="text-sm font-semibold">
                    {editingCurrency.updated_by_name || "N/A"}
                  </p>
                  <p>{editingCurrency.updated_by_role || "N/A"}</p>
                </div>
                <div>
                  <br />
                  <span className="font-semibold">Created At:</span>{" "}
                  <span>
                    {editingCurrency.created_at
                      ? new Date(editingCurrency.created_at).toLocaleString(
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
                    {editingCurrency.updated_at
                      ? new Date(editingCurrency.updated_at).toLocaleString(
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
              form="filterCurrencyForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterCurrencyForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Currency Code">
            <Controller
              name="filterCodes"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select currency codes..."
                  options={currencyCodeOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Currency Symbol">
            <Controller
              name="filterSymbols"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select currency symbols..."
                  options={currencySymbolOptions}
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

      {/* <ConfirmDialog // Commented out single delete confirm dialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Currency"
        onClose={() => {setSingleDeleteConfirmOpen(false); setCurrencyToDelete(null);}}
        onRequestClose={() => {setSingleDeleteConfirmOpen(false); setCurrencyToDelete(null);}}
        onCancel={() => {setSingleDeleteConfirmOpen(false); setCurrencyToDelete(null);}}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>Are you sure you want to delete the currency "<strong>{currencyToDelete?.currency_code} ({currencyToDelete?.currency_symbol})</strong>"?</p>
      </ConfirmDialog> */}
    </>
  );
};

export default Currency;
