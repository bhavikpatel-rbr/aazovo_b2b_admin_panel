import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom'; // Link/useNavigate not used in this pattern
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
import { Drawer, Form, FormItem, Input } from "@/components/ui";
// import { CSVLink } from 'react-csv' // Removed as custom export is used

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
  getCurrencyAction,
  addCurrencyAction, // Ensure these actions exist or are created
  editCurrencyAction, // Ensure these actions exist or are created
  deleteCurrencyAction, // Ensure these actions exist or are created
  deleteAllCurrencyAction, // Ensure these actions exist or are created
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define CurrencyItem Type ---
export type CurrencyItem = {
  id: string | number;
  currency_code: string;
  currency_symbol: string;
};

// --- Zod Schema for Add/Edit Currency Form ---
const currencyFormSchema = z.object({
  currency_code: z
    .string()
    .min(1, "Currency code is required.")
    .max(10, "Code cannot exceed 10 characters."), // Adjusted max length
  currency_symbol: z
    .string()
    .min(1, "Currency symbol is required.")
    .max(5, "Symbol cannot exceed 5 characters."), // Adjusted max length
});
type CurrencyFormData = z.infer<typeof currencyFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterCodes: z // Filter by currency_code
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterSymbols: z // Filter by currency_symbol
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_CURRENCY = ["ID", "Currency Code", "Currency Symbol"];
const CSV_KEYS_CURRENCY: (keyof CurrencyItem)[] = [
  "id",
  "currency_code",
  "currency_symbol",
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
  const separator = ",";

  const csvContent =
    CSV_HEADERS_CURRENCY.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return CSV_KEYS_CURRENCY.map((k) => {
          let cell = row[k];
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

// --- ActionColumn Component (No changes needed) ---
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
  onClearFilters: ()=> void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <CurrencySearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Button title="Clear Filters" icon={<TbReload/>} onClick={()=>onClearFilters()}></Button>
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
  selectedItems: CurrencyItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: CurrencyItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<CurrencyItem>[]) => void;
};
const CurrencyTable = ({
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
}: CurrencyTableProps) => {
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

// --- CurrencySelectedFooter Component ---
type CurrencySelectedFooterProps = {
  selectedItems: CurrencyItem[];
  onDeleteSelected: () => void;
};
const CurrencySelectedFooter = ({
  selectedItems,
  onDeleteSelected,
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
      >
        <p>
          Are you sure you want to delete the selected currency
          {selectedItems.length > 1 ? "ies" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

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
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [currencyToDelete, setCurrencyToDelete] = useState<CurrencyItem | null>(
    null
  );

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterCodes: [],
    filterSymbols: [],
  });

  const { CurrencyData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  useEffect(() => {
    dispatch(getCurrencyAction());
  }, [dispatch]);

  const addFormMethods = useForm<CurrencyFormData>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: { currency_code: "", currency_symbol: "" },
    mode: "onChange",
  });
  const editFormMethods = useForm<CurrencyFormData>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: { currency_code: "", currency_symbol: "" },
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = () => {
    addFormMethods.reset({ currency_code: "", currency_symbol: "" });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset({ currency_code: "", currency_symbol: "" });
    setIsAddDrawerOpen(false);
  };
  const onAddCurrencySubmit = async (data: CurrencyFormData) => {
    setIsSubmitting(true);
    try {
      await dispatch(addCurrencyAction(data)).unwrap(); // Pass the whole data object
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
      console.error("Add Currency Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (currency: CurrencyItem) => {
    setEditingCurrency(currency);
    editFormMethods.setValue("currency_code", currency.currency_code);
    editFormMethods.setValue("currency_symbol", currency.currency_symbol);
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingCurrency(null);
    editFormMethods.reset({ currency_code: "", currency_symbol: "" });
    setIsEditDrawerOpen(false);
  };
  const onEditCurrencySubmit = async (data: CurrencyFormData) => {
    if (
      !editingCurrency ||
      editingCurrency.id === undefined ||
      editingCurrency.id === null
    ) {
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
        editCurrencyAction({
          id: editingCurrency.id,
          ...data, // Send all fields from the form
        })
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
      console.error("Edit Currency Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (currency: CurrencyItem) => {
    if (currency.id === undefined || currency.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Currency ID is missing.
        </Notification>
      );
      return;
    }
    setCurrencyToDelete(currency);
    setSingleDeleteConfirmOpen(true);
  };

  const onConfirmSingleDelete = async () => {
    if (
      !currencyToDelete ||
      currencyToDelete.id === undefined ||
      currencyToDelete.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Currency ID is missing.
        </Notification>
      );
      setIsDeleting(false);
      setCurrencyToDelete(null);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteCurrencyAction(currencyToDelete)).unwrap();
      toast.push(
        <Notification title="Currency Deleted" type="success" duration={2000}>
          Currency "{currencyToDelete.currency_code}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== currencyToDelete!.id)
      );
      dispatch(getCurrencyAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete currency.`}
        </Notification>
      );
      console.error("Delete Currency Error:", error);
    } finally {
      setIsDeleting(false);
      setCurrencyToDelete(null);
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

    const idsToDelete = validItemsToDelete.map((item) => item.id);
    const commaSeparatedIds = idsToDelete.join(",");

    try {
      await dispatch(
        deleteAllCurrencyAction({ ids: commaSeparatedIds })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >
          {validItemsToDelete.length} currency(ies) successfully processed for
          deletion.
        </Notification>
      );
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected currencies."}
        </Notification>
      );
      console.error("Delete selected currencies error:", error);
    } finally {
      setSelectedItems([]);
      dispatch(getCurrencyAction());
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
      filterCodes: data.filterCodes || [],
      filterSymbols: data.filterSymbols || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = { filterCodes: [], filterSymbols: [] };
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
  const [selectedItems, setSelectedItems] = useState<CurrencyItem[]>([]);

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
      ? CurrencyData
      : [];
    let processedData: CurrencyItem[] = cloneDeep(sourceData);

    // Filter by currency codes
    if (filterCriteria.filterCodes && filterCriteria.filterCodes.length > 0) {
      const selectedFilterCodes = filterCriteria.filterCodes.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item: CurrencyItem) =>
        selectedFilterCodes.includes(
          item.currency_code?.trim().toLowerCase() ?? ""
        )
      );
    }

    // Filter by currency symbols
    if (
      filterCriteria.filterSymbols &&
      filterCriteria.filterSymbols.length > 0
    ) {
      const selectedFilterSymbols = filterCriteria.filterSymbols.map(
        (opt) => opt.value.toLowerCase() // Symbols might be case-sensitive, adjust if needed
      );
      processedData = processedData.filter((item: CurrencyItem) =>
        selectedFilterSymbols.includes(
          item.currency_symbol?.trim().toLowerCase() ?? ""
        )
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item: CurrencyItem) => {
        const codeLower = item.currency_code?.trim().toLowerCase() ?? "";
        const symbolLower = item.currency_symbol?.trim().toLowerCase() ?? "";
        const idString = String(item.id ?? "")
          .trim()
          .toLowerCase();
        return (
          codeLower.includes(query) ||
          symbolLower.includes(query) ||
          idString.includes(query)
        );
      });
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      (key === "id" || key === "currency_code" || key === "currency_symbol") &&
      processedData.length > 0
    ) {
      const sortedData = [...processedData];
      sortedData.sort((a, b) => {
        const aValue = String(a[key as keyof CurrencyItem] ?? "");
        const bValue = String(b[key as keyof CurrencyItem] ?? "");
        return order === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
      processedData = sortedData;
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
  }, [CurrencyData, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsvCurrency(
      "currencies_export.csv",
      allFilteredAndSortedData
    );
    if (success) {
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
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
  const handleRowSelect = useCallback((checked: boolean, row: CurrencyItem) => {
    setSelectedItems((prev) => {
      if (checked)
        return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
      return prev.filter((item) => item.id !== row.id);
    });
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<CurrencyItem>[]) => {
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

  const columns: ColumnDef<CurrencyItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 100 },
      {
        header: "Currency Code",
        accessorKey: "currency_code",
        enableSorting: true,
      },
      {
        header: "Currency Symbol",
        accessorKey: "currency_symbol",
        enableSorting: true,
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
            onExport={handleExportData}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <CurrencyTable
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

      <CurrencySelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />

      <Drawer
        title="Add Currency"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeAddDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="addCurrencyForm"
              type="submit"
              loading={isSubmitting}
              disabled={!addFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="addCurrencyForm"
          onSubmit={addFormMethods.handleSubmit(onAddCurrencySubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Currency Code"
            invalid={!!addFormMethods.formState.errors.currency_code}
            errorMessage={
              addFormMethods.formState.errors.currency_code?.message
            }
          >
            <Controller
              name="currency_code"
              control={addFormMethods.control}
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
            invalid={!!addFormMethods.formState.errors.currency_symbol}
            errorMessage={
              addFormMethods.formState.errors.currency_symbol?.message
            }
          >
            <Controller
              name="currency_symbol"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter Currency Symbol (e.g., $)"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Currency"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeEditDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="editCurrencyForm"
              type="submit"
              loading={isSubmitting}
              disabled={!editFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <Form
          id="editCurrencyForm"
          onSubmit={editFormMethods.handleSubmit(onEditCurrencySubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Currency Code"
            invalid={!!editFormMethods.formState.errors.currency_code}
            errorMessage={
              editFormMethods.formState.errors.currency_code?.message
            }
          >
            <Controller
              name="currency_code"
              control={editFormMethods.control}
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
            invalid={!!editFormMethods.formState.errors.currency_symbol}
            errorMessage={
              editFormMethods.formState.errors.currency_symbol?.message
            }
          >
            <Controller
              name="currency_symbol"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Enter Currency Symbol (e.g., $)"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

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
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Currency"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setCurrencyToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setCurrencyToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setCurrencyToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the currency "
          <strong>
            {currencyToDelete?.currency_code} (
            {currencyToDelete?.currency_symbol})
          </strong>
          "?
        </p>
      </ConfirmDialog>
    </>
  );
};

export default Currency;

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
