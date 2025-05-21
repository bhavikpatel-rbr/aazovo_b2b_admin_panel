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
// Assuming your actual actions are named like this, or stubs for now
import {
  getPriceListAction,
  addPriceListAction, // You'll need to define this if it's not a stub
  editPriceListAction,
  deletePriceListAction,
  deleteAllPriceListAction,
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Mock Product Master Data (for Product Name Select in Forms) ---
const MOCK_PRODUCTS_MASTER: { id: string; name: string }[] = [
  // Using string IDs to match API's product_id if it's a string
  { id: "44", name: "IPHONE 12 128GB" },
  { id: "prod_002", name: "Samsung Galaxy S24 Ultra" },
  { id: "prod_003", name: "Google Pixel 8 Pro" },
];

// --- Define PriceList Type (Matches API Response Structure) ---
export type ApiProduct = {
  id: number; // Or string if product_id is a string
  name: string;
  icon_full_path?: string; // Optional
  product_images_array?: any[]; // Optional
};

export type PriceListItem = {
  id: number; // API returns number for price list item ID
  product_id: string; // API returns string for product_id
  price: string;
  base_price: string;
  gst_price: string;
  usd_rate: string;
  usd: string; // USD equivalent amount
  expance: string; // Matches API 'expance'
  interest: string;
  nlc: string;
  margin: string;
  sales_price: string; // Matches API 'sales_price'
  created_at?: string; // Optional
  updated_at?: string; // Optional
  product: ApiProduct; // Nested product details
  qty?: string; // Add qty if it's part of your API response and needed for table
  status?: "active" | "inactive"; // Add status if it's part of your API and needed
};

// --- Zod Schema for SIMPLIFIED Add/Edit PriceList Form ---
// This schema ONLY defines the fields present in the Add/Edit form
const priceListFormSchema = z.object({
  product_id: z.string().min(1, "Product selection is required."),
  price: z
    .string()
    .min(1, "Price is required.")
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Price must be a valid number (e.g., 100 or 100.50)"
    ),
  usd_rate: z
    .string()
    .min(1, "USD Rate is required.")
    .regex(/^\d+(\.\d{1,2})?$/, "USD Rate must be a valid number"),
  expance: z
    .string()
    .min(1, "Expenses are required.")
    .regex(/^\d+(\.\d{1,2})?$/, "Expenses must be a valid number"),
  margin: z
    .string()
    .min(1, "Margin is required.")
    .regex(/^\d+(\.\d{1,2})?$/, "Margin must be a valid number"),
});
type PriceListFormData = z.infer<typeof priceListFormSchema>;

// --- Zod Schema for Filter Form ---
const priceListFilterFormSchema = z.object({
  filterProductNames: z // This will filter by product.name from the listing
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // Add other filters if needed (e.g., filter by status if status exists in PriceListItem)
});
type PriceListFilterFormData = z.infer<typeof priceListFilterFormSchema>;

// --- CSV Exporter Utility (Exports fields based on PriceListItem) ---
// Adjust headers and keys to match your PriceListItem and desired CSV output
const CSV_PRICE_LIST_HEADERS = [
  "ID",
  "Product ID",
  "Product Name",
  "Price",
  "Base Price",
  "GST Price",
  "USD Rate",
  "USD Amount",
  "Expense",
  "Interest",
  "NLC",
  "Margin",
  "Sales Price" /* 'Quantity', 'Status' */, // Add if present
];
const CSV_PRICE_LIST_KEYS: (keyof PriceListItem)[] = [
  "id",
  "product_id",
  /* 'product.name' - needs special handling */ "price",
  "base_price",
  "gst_price",
  "usd_rate",
  "usd",
  "expance",
  "interest",
  "nlc",
  "margin",
  "sales_price" /* 'qty', 'status' */, // Add if present
];

function exportPriceListToCsv(filename: string, rows: PriceListItem[]) {
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
    CSV_PRICE_LIST_HEADERS.join(separator) +
    "\n" +
    rows
      .map((row) => {
        // Special handling for nested product.name
        const flatRow = { ...row, productNameForCsv: row.product?.name || "" };
        return CSV_PRICE_LIST_KEYS.map((k) => {
          let cell: any;
          if (k === ("product.name" as any)) {
            // Temporary hack for typing
            cell = flatRow.productNameForCsv;
          } else {
            cell = flatRow[k as keyof typeof flatRow];
          }

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
  // ... (rest of the blob creation and download logic remains the same)
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

// --- ActionColumn, PriceListSearch, PriceListTableTools, PriceListTable, PriceListSelectedFooter ---
// No changes needed in these components themselves, they are generic.
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
      {" "}
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
      </Tooltip>{" "}
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
      </Tooltip>{" "}
    </div>
  );
};
type PriceListSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const PriceListSearch = React.forwardRef<
  HTMLInputElement,
  PriceListSearchProps
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Quick search price list..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
PriceListSearch.displayName = "PriceListSearch";
const PriceListTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    {" "}
    <div className="flex-grow">
      <PriceListSearch onInputChange={onSearchChange} />
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
type PriceListTableProps = {
  columns: ColumnDef<PriceListItem>[];
  data: PriceListItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: PriceListItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: PriceListItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<PriceListItem>[]) => void;
};
const PriceListTable = (props: PriceListTableProps) => (
  <DataTable
    selectable
    columns={props.columns}
    data={props.data}
    noData={!props.loading && props.data.length === 0}
    loading={props.loading}
    pagingData={props.pagingData}
    checkboxChecked={(row) =>
      props.selectedItems.some((selected) => selected.id === row.id)
    }
    onPaginationChange={props.onPaginationChange}
    onSelectChange={props.onSelectChange}
    onSort={props.onSort}
    onCheckBoxChange={props.onRowSelect}
    onIndeterminateCheckBoxChange={props.onAllRowSelect}
  />
);
type PriceListSelectedFooterProps = {
  selectedItems: PriceListItem[];
  onDeleteSelected: () => void;
};
const PriceListSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: PriceListSelectedFooterProps) => {
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
      {" "}
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        {" "}
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          {" "}
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span> Item{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>{" "}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
            >
              Delete Selected
            </Button>
          </div>{" "}
        </div>{" "}
      </StickyFooter>{" "}
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Price List Item${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected price list item
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>{" "}
    </>
  );
};

// --- Main PriceList Component ---
const PriceList = () => {
  const dispatch = useAppDispatch();

  // STUB: Replace with actual Redux actions if not already done
  // const addPriceListAction = (data: PriceListFormData & { /* other API fields */ }) => ({ type: 'ADD_PRICELIST_STUB', payload: data })
  // const editPriceListAction = (data: { id: number } & PriceListFormData & { /* other API fields */ }) => ({ type: 'EDIT_PRICELIST_STUB', payload: data })
  //const deletePriceListAction = (item: { id: number }) => ({ type: 'DELETE_PRICELIST_STUB', payload: item })
  //const deleteAllPriceListAction = (data: { ids: string }) => ({ type: 'DELETE_ALL_PRICELIST_STUB', payload: data })

  const productSelectOptions = useMemo(
    () => MOCK_PRODUCTS_MASTER.map((p) => ({ value: p.id, label: p.name })),
    []
  );

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingPriceListItem, setEditingPriceListItem] =
    useState<PriceListItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PriceListItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<PriceListFilterFormData>(
    { filterProductNames: [] }
  );

  // Assuming 'priceListData' in Redux store matches the 'PriceListItem[]' structure
  const { priceListData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  useEffect(() => {
    // @ts-ignore
    dispatch(getPriceListAction());
  }, [dispatch]);

  const defaultFormValues: PriceListFormData = {
    product_id: "",
    price: "",
    usd_rate: "",
    expance: "",
    margin: "",
  };

  const addFormMethods = useForm<PriceListFormData>({
    resolver: zodResolver(priceListFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<PriceListFormData>({
    resolver: zodResolver(priceListFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const filterFormMethods = useForm<PriceListFilterFormData>({
    resolver: zodResolver(priceListFilterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = () => {
    addFormMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(false);
  };

  const onAddPriceListSubmit = async (formData: PriceListFormData) => {
    setIsSubmitting(true);
    const selectedProduct = MOCK_PRODUCTS_MASTER.find(
      (p) => p.id === formData.product_id
    );
    const productNameForNotification = selectedProduct
      ? selectedProduct.name
      : "Unknown Product";

    // API payload should match what your backend expects.
    // It will take the 5 fields from formData.
    // Other fields (base_price, gst_price, etc.) might be calculated/set by the backend
    // or you might need to send them with default/calculated values if API requires.
    const apiPayload = {
      ...formData, // product_id, price, usd_rate, expance, margin
      // If API needs other fields for creation, add them here:
      // e.g. status: 'active', qty: '1', etc.
    };

    try {
      // @ts-ignore
      await dispatch(addPriceListAction(apiPayload)).unwrap();
      toast.push(
        <Notification
          title="Price List Item Added"
          type="success"
          duration={2000}
        >
          Item for "{productNameForNotification}" added.
        </Notification>
      );
      closeAddDrawer(); // @ts-ignore
      dispatch(getPriceListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {error.message || "Could not add item."}
        </Notification>
      );
      console.error("Add Price List Item Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (item: PriceListItem) => {
    setEditingPriceListItem(item);
    const formValues: PriceListFormData = {
      product_id: item.product_id,
      price: item.price,
      usd_rate: item.usd_rate,
      expance: item.expance,
      margin: item.margin,
    };
    editFormMethods.reset(formValues);
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingPriceListItem(null);
    editFormMethods.reset(defaultFormValues);
    setIsEditDrawerOpen(false);
  };

  const onEditPriceListSubmit = async (formData: PriceListFormData) => {
    if (!editingPriceListItem) {
      /* error handling */ return;
    }
    setIsSubmitting(true);
    const selectedProduct = MOCK_PRODUCTS_MASTER.find(
      (p) => p.id === formData.product_id
    );
    const productNameForNotification = selectedProduct
      ? selectedProduct.name
      : editingPriceListItem.product.name;

    const apiPayload = {
      id: editingPriceListItem.id, // ID of the item to edit
      ...formData, // The 5 editable fields
      // Include other fields if your API expects the full object on PATCH/PUT
      // e.g., base_price: editingPriceListItem.base_price (if not editable but needs to be sent)
    };

    try {
      // @ts-ignore
      await dispatch(editPriceListAction(apiPayload)).unwrap();
      toast.push(
        <Notification
          title="Price List Item Updated"
          type="success"
          duration={2000}
        >
          Item for "{productNameForNotification}" updated.
        </Notification>
      );
      closeEditDrawer(); // @ts-ignore
      dispatch(getPriceListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {error.message || "Could not update item."}
        </Notification>
      );
      console.error("Edit Price List Item Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (item: PriceListItem) => {
    if (item.id === undefined) {
      /*...*/ return;
    }
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete || itemToDelete.id === undefined) {
      /*...*/ return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      // @ts-ignore
      await dispatch(
        deleteAllPriceListAction({ ids: itemToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Price List Item Deleted"
          type="success"
          duration={2000}
        >
          Item "{itemToDelete.product.name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) => prev.filter((i) => i.id !== itemToDelete!.id)); // @ts-ignore
      dispatch(getPriceListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {error.message || `Could not delete item.`}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      /*...*/ return;
    }
    setIsDeleting(true);
    const validItemsToDelete = selectedItems.filter(
      (item) => item.id !== undefined
    );
    // ... (rest of delete selected logic as before)
    const idsToDelete = validItemsToDelete.map((item) => item.id).join(",");
    try {
      // @ts-ignore
      await dispatch(deleteAllPriceListAction({ ids: idsToDelete })).unwrap();
      toast.push(
        <Notification title="Selected Items Deleted" type="success">
          {validItemsToDelete.length} item(s) deleted.
        </Notification>
      );
      setSelectedItems([]); // @ts-ignore
      dispatch(getPriceListAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger">
          {error.message || "Failed to delete selected items."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: PriceListFilterFormData) => {
    setFilterCriteria({
      filterProductNames:
        data.filterProductNames ||
        [] /*, filterStatus: data.filterStatus || null */,
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const df = { filterProductNames: [] /*, filterStatus: null */ };
    filterFormMethods.reset(df);
    setFilterCriteria(df);
    handleSetTableData({ pageIndex: 1 });
  };

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<PriceListItem[]>([]);

  const filterProductNameOptions = useMemo(() => {
    if (!Array.isArray(priceListData)) return [];
    // Use product.name for filter options, assuming priceListData items have the nested product object
    const uniqueNames = new Set(
      priceListData
        .map((item) => item.product?.name)
        .filter(Boolean) as string[]
    );
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [priceListData]);
  // const statusOptions = useMemo(() => [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }], []) // If status is used

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: PriceListItem[] = Array.isArray(priceListData)
      ? priceListData
      : [];
    let processedData: PriceListItem[] = cloneDeep(sourceData);
    if (
      filterCriteria.filterProductNames &&
      filterCriteria.filterProductNames.length > 0
    ) {
      const selectedFilterProductValues = filterCriteria.filterProductNames.map(
        (opt) => opt.value.toLowerCase()
      );
      processedData = processedData.filter((item) =>
        selectedFilterProductValues.includes(
          item.product?.name?.trim().toLowerCase() ?? ""
        )
      );
    }
    // Add status filter logic if status field exists and is part of filterCriteria
    // if (filterCriteria.filterStatus && filterCriteria.filterStatus.value) { ... }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) => {
        const matchProductName = item.product?.name
          ?.toLowerCase()
          .includes(query);
        const matchId = String(item.id ?? "")
          .toLowerCase()
          .includes(query);
        const matchProductId = String(item.product_id ?? "")
          .toLowerCase()
          .includes(query);
        return matchProductName || matchId || matchProductId;
      });
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      const sortedData = [...processedData];
      sortedData.sort((a, b) => {
        // Handle nested product.name for sorting
        let aValue: any, bValue: any;
        if (key === "product.name") {
          aValue = String(a.product?.name ?? "");
          bValue = String(b.product?.name ?? "");
        } else {
          aValue = String(a[key as keyof PriceListItem] ?? "");
          bValue = String(b[key as keyof PriceListItem] ?? "");
        }
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
  }, [priceListData, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportPriceListToCsv(
      "pricelist_export.csv",
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
    (sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: PriceListItem) => {
      setSelectedItems((prev) =>
        checked
          ? prev.some((item) => item.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((item) => item.id !== row.id)
      );
    },
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<PriceListItem>[]) => {
      const crOriginals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prev) => {
          const pIds = new Set(prev.map((i) => i.id));
          const nRows = crOriginals.filter((r) => !pIds.has(r.id));
          return [...prev, ...nRows];
        });
      } else {
        const crIds = new Set(crOriginals.map((r) => r.id));
        setSelectedItems((prev) => prev.filter((i) => !crIds.has(i.id)));
      }
    },
    []
  );

  // Table columns definition - aligned with API response structure
  const columns: ColumnDef<PriceListItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 70 },
      {
        header: "Product Name",
        accessorFn: (row) => row.product?.name, // Access nested data
        id: "product.name", // Unique ID for the column
        enableSorting: true,
        size: 200,
      },
      {
        header: "Price Breakup",
        id: "priceBreakup",
        size: 180,
        cell: (props) => {
          const { price, base_price, gst_price, usd } = props.row.original;
          return (
            <div className="flex flex-col text-xs">
              <span className="font-semibold">Price: {price}</span>
              <span>Base: {base_price}</span>
              <span>GST: {gst_price}</span>
              <span>USD: {usd}</span>
            </div>
          );
        },
      },
      {
        header: "Cost Split",
        id: "costSplit",
        size: 180,
        cell: (props) => {
          const { expance, margin, interest, nlc } = props.row.original;
          return (
            <div className="flex flex-col text-xs">
              <span className="font-semibold">Expense: {expance}</span>
              <span>Margin: {margin}</span>
              <span>Interest: {interest}</span>
              <span>NLC: {nlc}</span>
            </div>
          );
        },
      },
      {
        header: "Sales Price",
        accessorKey: "sales_price",
        enableSorting: true,
        size: 110,
      },
      // Add 'qty' and 'status' columns if they exist in your PriceListItem and are needed
      // { header: 'Qty', accessorKey: 'qty', enableSorting: true, size: 70 },
      // {
      //     header: 'Status', accessorKey: 'status', enableSorting: true, size: 100,
      //     cell: (props) => props.row.original.status ? (<Tag className={props.row.original.status === 'active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100'}>{props.row.original.status}</Tag>) : null,
      // },
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
    [openEditDrawer, handleDeleteClick]
  );

  // SIMPLIFIED form fields config for Add/Edit Drawers
  const formFieldsConfig: {
    name: keyof PriceListFormData;
    label: string;
    type?: "text" | "number" | "select";
    options?: { value: string; label: string }[];
  }[] = [
    {
      name: "product_id",
      label: "Product Name",
      type: "select",
      options: productSelectOptions,
    },
    { name: "price", label: "Price", type: "text" },
    { name: "usd_rate", label: "USD Rate", type: "text" },
    { name: "expance", label: "Expenses", type: "text" },
    { name: "margin", label: "Margin", type: "text" },
  ];

  const renderFormField = (
    fieldConfig: (typeof formFieldsConfig)[0],
    formControl: any
  ) => {
    const commonProps = { name: fieldConfig.name, control: formControl };
    const placeholderText = `Enter ${fieldConfig.label}`;
    if (fieldConfig.type === "select") {
      return (
        <Controller
          {...commonProps}
          render={({ field }) => (
            <Select
              placeholder={`Select ${fieldConfig.label}`}
              options={fieldConfig.options || []}
              value={
                fieldConfig.options?.find((opt) => opt.value === field.value) ||
                null
              }
              onChange={(option) => field.onChange(option ? option.value : "")}
            />
          )}
        />
      );
    }
    return (
      <Controller
        {...commonProps}
        render={({ field }) => (
          <Input
            {...field}
            type={fieldConfig.type || "text"}
            placeholder={placeholderText}
          />
        )}
      />
    );
  };

  return (
    <>
      <Container className="h-full">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            {" "}
            <h5 className="mb-2 sm:mb-0">Price List</h5>{" "}
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New{" "}
            </Button>{" "}
          </div>
          <PriceListTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            {" "}
            <PriceListTable
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
            />{" "}
          </div>
        </AdaptiveCard>
      </Container>
      <PriceListSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
      />
      {[
        {
          title: "Add Price List Item",
          isOpen: isAddDrawerOpen,
          closeFn: closeAddDrawer,
          formId: "addPriceListForm",
          methods: addFormMethods,
          onSubmit: onAddPriceListSubmit,
          submitText: "Adding...",
          saveText: "Save",
        },
        {
          title: "Edit Price List Item",
          isOpen: isEditDrawerOpen,
          closeFn: closeEditDrawer,
          formId: "editPriceListForm",
          methods: editFormMethods,
          onSubmit: onEditPriceListSubmit,
          submitText: "Saving...",
          saveText: "Save",
        },
      ].map((drawerProps) => (
        <Drawer
          key={drawerProps.formId}
          title={drawerProps.title}
          isOpen={drawerProps.isOpen}
          onClose={drawerProps.closeFn}
          onRequestClose={drawerProps.closeFn}
          footer={
            <div className="text-right w-full">
              {" "}
              <Button
                size="sm"
                className="mr-2"
                onClick={drawerProps.closeFn}
                disabled={isSubmitting}
              >
                Cancel
              </Button>{" "}
              <Button
                size="sm"
                variant="solid"
                form={drawerProps.formId}
                type="submit"
                loading={isSubmitting}
                disabled={
                  !drawerProps.methods.formState.isValid || isSubmitting
                }
              >
                {isSubmitting ? drawerProps.submitText : drawerProps.saveText}
              </Button>{" "}
            </div>
          }
        >
          {" "}
          <Form
            id={drawerProps.formId}
            onSubmit={drawerProps.methods.handleSubmit(
              drawerProps.onSubmit as any
            )}
            className="flex flex-col gap-4"
          >
            {" "}
            {formFieldsConfig.map((fConfig) => (
              <FormItem
                key={fConfig.name}
                label={fConfig.label}
                invalid={!!drawerProps.methods.formState.errors[fConfig.name]}
                errorMessage={
                  drawerProps.methods.formState.errors[fConfig.name]
                    ?.message as string | undefined
                }
              >
                {" "}
                {renderFormField(fConfig, drawerProps.methods.control)}{" "}
              </FormItem>
            ))}{" "}
          </Form>{" "}
        </Drawer>
      ))}
      <Drawer
        title="Filter Price List"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button size="sm" className="mr-2" onClick={onClearFilters}>
              Clear
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="filterPriceListForm"
              type="submit"
            >
              Apply
            </Button>{" "}
          </div>
        }
      >
        {" "}
        <Form
          id="filterPriceListForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          {" "}
          <FormItem label="Filter by Product Name(s)">
            <Controller
              name="filterProductNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select product names..."
                  options={filterProductNameOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>{" "}
          {/* Add Status filter if needed */}{" "}
        </Form>{" "}
      </Drawer>
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Price List Item"
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
        {" "}
        <p>
          Are you sure you want to delete the item "
          <strong>{itemToDelete?.product.name}</strong>"?
        </p>{" "}
      </ConfirmDialog>
    </>
  );
};

export default PriceList;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
