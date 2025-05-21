import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom'; // useNavigate was unused, Link might be if not used in breadcrumbs
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
import Select from "@/components/ui/Select"; // Added for filter drawer
import { Drawer, Form, FormItem, Input } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
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
  addPaymentTermAction, // Ensure these actions exist or are created
  editPaymentTermAction, // Ensure these actions exist or are created
  deletePaymentTermAction, // Ensure these actions exist or are created
  deleteAllPaymentTermAction, // Ensure these actions exist or are created
} from "@/reduxtool/master/middleware"; // Adjust path and action names as needed
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define PaymentTermsItem Type ---
export type PaymentTermsItem = {
  id: string | number; // Allow number for consistency if backend might send it
  term_name: string; // Changed from 'name' to 'term_name'
};

// --- Zod Schema for Add/Edit Payment Term Form ---
const paymentTermFormSchema = z.object({
  term_name: z // Changed from 'name' to 'term_name'
    .string()
    .min(1, "Payment term name is required.")
    .max(100, "Name cannot exceed 100 characters."),
});
type PaymentTermFormData = z.infer<typeof paymentTermFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z // This will filter by 'term_name'
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_PAYMENT_TERM = ["ID", "Payment Term Name"];
const CSV_KEYS_PAYMENT_TERM: (keyof PaymentTermsItem)[] = ["id", "term_name"]; // Changed to 'term_name'

function exportToCsvPaymentTerm(filename: string, rows: PaymentTermsItem[]) {
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
    CSV_HEADERS_PAYMENT_TERM.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return CSV_KEYS_PAYMENT_TERM.map((k) => {
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
    <div className="flex items-center justify-center gap-3">
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
      placeholder="Quick search payment terms..."
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
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
      <div className="flex-grow">
        <PaymentTermSearch onInputChange={onSearchChange} />
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
};
const PaymentTermSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
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
  // const navigate = useNavigate(); // Uncomment if navigation on edit/add is needed

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingPaymentTerm, setEditingPaymentTerm] =
    useState<PaymentTermsItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [paymentTermToDelete, setPaymentTermToDelete] =
    useState<PaymentTermsItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
  });

  // Ensure PaymentTermsData is part of your masterSelector slice
  const { PaymentTermsData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  useEffect(() => {
    dispatch(getPaymentTermAction());
  }, [dispatch]);

  const addFormMethods = useForm<PaymentTermFormData>({
    resolver: zodResolver(paymentTermFormSchema),
    defaultValues: { term_name: "" }, // Use term_name
    mode: "onChange",
  });
  const editFormMethods = useForm<PaymentTermFormData>({
    resolver: zodResolver(paymentTermFormSchema),
    defaultValues: { term_name: "" }, // Use term_name
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = () => {
    addFormMethods.reset({ term_name: "" }); // Use term_name
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset({ term_name: "" }); // Use term_name
    setIsAddDrawerOpen(false);
  };
  const onAddPaymentTermSubmit = async (data: PaymentTermFormData) => {
    setIsSubmitting(true);
    try {
      // Ensure addPaymentTermAction takes { term_name: data.term_name }
      await dispatch(
        addPaymentTermAction({ term_name: data.term_name })
      ).unwrap();
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
      console.error("Add Payment Term Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (term: PaymentTermsItem) => {
    setEditingPaymentTerm(term);
    editFormMethods.setValue("term_name", term.term_name); // Use term_name
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingPaymentTerm(null);
    editFormMethods.reset({ term_name: "" }); // Use term_name
    setIsEditDrawerOpen(false);
  };
  const onEditPaymentTermSubmit = async (data: PaymentTermFormData) => {
    if (
      !editingPaymentTerm ||
      editingPaymentTerm.id === undefined ||
      editingPaymentTerm.id === null
    ) {
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
      console.log();

      // Ensure editPaymentTermAction takes { id: ..., term_name: ... }
      await dispatch(
        editPaymentTermAction({
          id: editingPaymentTerm.id,
          term_name: data.term_name,
        })
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
      console.error("Edit Payment Term Error:", error);
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
    if (
      !paymentTermToDelete ||
      paymentTermToDelete.id === undefined ||
      paymentTermToDelete.id === null
    ) {
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
      // Ensure deletePaymentTermAction takes correct payload
      await dispatch(deletePaymentTermAction(paymentTermToDelete)).unwrap();
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
      console.error("Delete Payment Term Error:", error);
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

    const idsToDelete = validItemsToDelete.map((item) => item.id);
    const commaSeparatedIds = idsToDelete.join(",");

    try {
      // Ensure deleteAllPaymentTermAction takes correct payload
      await dispatch(
        deleteAllPaymentTermAction({ ids: commaSeparatedIds })
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
      console.error("Delete selected payment terms error:", error);
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
    setFilterCriteria({ filterNames: data.filterNames || [] });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = { filterNames: [] };
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
    const uniqueNames = new Set(
      PaymentTermsData.map((term) => term.term_name) // Use term_name
    );
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [PaymentTermsData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: PaymentTermsItem[] = Array.isArray(PaymentTermsData)
      ? PaymentTermsData
      : [];
    let processedData: PaymentTermsItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedFilterNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter((item: PaymentTermsItem) =>
        selectedFilterNames.includes(
          item.term_name?.trim().toLowerCase() ?? "" // Use term_name
        )
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item: PaymentTermsItem) => {
        const itemNameLower = item.term_name?.trim().toLowerCase() ?? ""; // Use term_name
        const itemIdString = String(item.id ?? "").trim();
        const itemIdLower = itemIdString.toLowerCase();
        return itemNameLower.includes(query) || itemIdLower.includes(query);
      });
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      (key === "id" || key === "term_name") && // Use term_name for sorting key
      processedData.length > 0
    ) {
      const sortedData = [...processedData];
      sortedData.sort((a, b) => {
        const aValue = String(a[key as keyof PaymentTermsItem] ?? "");
        const bValue = String(b[key as keyof PaymentTermsItem] ?? "");
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
  }, [PaymentTermsData, tableData, filterCriteria]);

  const handleExportData = () => {
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
        header: "Payment Term Name", // Changed header
        accessorKey: "term_name", // Use term_name
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
    [] // openEditDrawer and handleDeleteClick are stable
  );

  return (
    <>
      <Container className="h-full">
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
            onExport={handleExportData}
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
      />

      {/* Add Drawer */}
      <Drawer
        title="Add Payment Term"
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
              form="addPaymentTermForm" // Ensure this matches the form id
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
          id="addPaymentTermForm" // Form id
          onSubmit={addFormMethods.handleSubmit(onAddPaymentTermSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Payment Term Name"
            invalid={!!addFormMethods.formState.errors.term_name} // Use term_name
            errorMessage={
              addFormMethods.formState.errors.term_name?.message // Use term_name
            }
          >
            <Controller
              name="term_name" // Use term_name
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Payment Term Name" />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Payment Term"
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
              form="editPaymentTermForm" // Ensure this matches the form id
              type="submit"
              loading={isSubmitting}
              disabled={!editFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="editPaymentTermForm" // Form id
          onSubmit={editFormMethods.handleSubmit(onEditPaymentTermSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem
            label="Payment Term Name"
            invalid={!!editFormMethods.formState.errors.term_name} // Use term_name
            errorMessage={
              editFormMethods.formState.errors.term_name?.message // Use term_name
            }
          >
            <Controller
              name="term_name" // Use term_name
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter Payment Term Name" />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Payment Terms"
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
              form="filterPaymentTermForm" // Ensure this matches the form id
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterPaymentTermForm" // Form id
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Filter by Payment Term Name(s)">
            <Controller
              name="filterNames" // This filters by term_name based on options
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
        </Form>
      </Drawer>

      {/* Single Delete Confirmation */}
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
        loading={isDeleting} // Add if your ConfirmDialog supports it
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

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
