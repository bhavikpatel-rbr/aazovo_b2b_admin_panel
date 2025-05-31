// src/views/your-path/PriceList.tsx

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
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected
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
  TbReload,
  TbUser,
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
  getPriceListAction,
  addPriceListAction,
  editPriceListAction,
  deletePriceListAction,
  deleteAllPriceListAction,
  getAllProductAction, // <<< --- ADDED ACTION
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { Link } from "react-router-dom";

// --- Define Product Master Type (what getAllProductAction fetches) ---
export type ProductMasterItem = {
  id: string | number; // Should match the type of product_id in PriceListItem
  name: string;
  // Add other fields if your product master has more data
};

// --- Define PriceList Type (Matches API Response Structure) ---
export type ApiProduct = {
  id: number;
  name: string;
  icon_full_path?: string;
  product_images_array?: any[];
};

export type PriceListItem = {
  id: number;
  product_id: string; // API returns string for product_id
  price: string;
  base_price: string;
  gst_price: string;
  usd_rate: string;
  usd: string;
  expance: string;
  interest: string;
  nlc: string;
  margin: string;
  sales_price: string;
  created_at?: string;
  updated_at?: string;
  product: ApiProduct; // Nested product details
  qty?: string;
  status?: "active" | "inactive";
};

// --- Zod Schema for SIMPLIFIED Add/Edit PriceList Form ---
const priceListFormSchema = z.object({
  product_id: z.string().min(1, "Product selection is required."),
  price: z.string().min(1, "Price is required.").regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number"),
  usd_rate: z.string().min(1, "USD Rate is required.").regex(/^\d+(\.\d{1,2})?$/, "USD Rate must be a valid number"),
  expance: z.string().min(1, "Expenses are required.").regex(/^\d+(\.\d{1,2})?$/, "Expenses must be a valid number"),
  margin: z.string().min(1, "Margin is required.").regex(/^\d+(\.\d{1,2})?$/, "Margin must be a valid number"),
});
type PriceListFormData = z.infer<typeof priceListFormSchema>;

// --- Zod Schema for Filter Form ---
const priceListFilterFormSchema = z.object({
  filterProductIds: z // Changed to filter by product_id
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type PriceListFilterFormData = z.infer<typeof priceListFilterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_PRICE_LIST_HEADERS = ["ID", "Product ID", "Product Name", "Price", "Base Price", "GST Price", "USD Rate", "USD Amount", "Expense", "Interest", "NLC", "Margin", "Sales Price"];
const CSV_PRICE_LIST_KEYS: (keyof PriceListItem | 'productNameForCsv')[] = ["id", "product_id", "productNameForCsv", "price", "base_price", "gst_price", "usd_rate", "usd", "expance", "interest", "nlc", "margin", "sales_price"];

function exportPriceListToCsv(filename: string, rows: PriceListItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const separator = ",";
  const csvContent = CSV_PRICE_LIST_HEADERS.join(separator) + "\n" + rows.map((row) => {
    const flatRow = { ...row, productNameForCsv: row.product?.name || String(row.product_id) }; // Use product_id as fallback
    return CSV_PRICE_LIST_KEYS.map((k) => {
      let cell: any;
      if (k === "productNameForCsv") { cell = flatRow.productNameForCsv; }
      else { cell = flatRow[k as keyof typeof flatRow]; }
      if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""');
      if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
      return cell;
    }).join(separator);
  }).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support.</Notification>); return false;
}


// --- ActionColumn, PriceListSearch, PriceListTableTools, PriceListTable, PriceListSelectedFooter ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => { /* ... as before ... */ return (<div className="flex items-center justify-center"> <Tooltip title="Edit"> <div className={classNames("text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none", "hover:bg-gray-100 dark:hover:bg-gray-700", "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400")} role="button" onClick={onEdit}><TbPencil /></div> </Tooltip> <Tooltip title="Delete"> <div className={classNames("text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none", "hover:bg-gray-100 dark:hover:bg-gray-700", "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400")} role="button" onClick={onDelete}><TbTrash /></div> </Tooltip> </div>); };
type PriceListSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const PriceListSearch = React.forwardRef<HTMLInputElement, PriceListSearchProps>(({ onInputChange }, ref) => (<DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
PriceListSearch.displayName = "PriceListSearch";
const PriceListTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; }) => (<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> <div className="flex-grow"><PriceListSearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"> <Button title="Clear Filters" icon={<TbReload />} onClick={() => onClearFilters()}></Button><Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div>);
type PriceListTableProps = { columns: ColumnDef<PriceListItem>[]; data: PriceListItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: PriceListItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: PriceListItem) => void; onAllRowSelect: (checked: boolean, rows: Row<PriceListItem>[]) => void; };
const PriceListTable = (props: PriceListTableProps) => (<DataTable selectable columns={props.columns} data={props.data} noData={!props.loading && props.data.length === 0} loading={props.loading} pagingData={props.pagingData} checkboxChecked={(row) => props.selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={props.onPaginationChange} onSelectChange={props.onSelectChange} onSort={props.onSort} onCheckBoxChange={props.onRowSelect} onIndeterminateCheckBoxChange={props.onAllRowSelect} />);
type PriceListSelectedFooterProps = { selectedItems: PriceListItem[]; onDeleteSelected: () => void; isDeleting: boolean; }; // Added isDeleting
const PriceListSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: PriceListSelectedFooterProps) => { const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false); if (selectedItems.length === 0) return null; return (<> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold"> {selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""} selected </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteConfirmationOpen(true)} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Item(s)`} onClose={() => setDeleteConfirmationOpen(false)} onRequestClose={() => setDeleteConfirmationOpen(false)} onCancel={() => setDeleteConfirmationOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteConfirmationOpen(false); }}> <p>Are you sure you want to delete selected item(s)?</p> </ConfirmDialog> </>); };

// --- Main PriceList Component ---
const PriceList = () => {
  const dispatch = useAppDispatch();

  const {
    priceListData = [],
    productsMasterData = [], // <<< --- ADDED: Fetched products for dropdowns
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector); // Ensure masterSelector provides productsMasterData
  console.log("productsMasterData", productsMasterData);

  // Prepare options for Product Name Select in forms and filters
  const productSelectOptions = useMemo(() => {
    if (!Array.isArray(productsMasterData)) return [];
    return productsMasterData.map((p: ProductMasterItem) => ({
      value: String(p.id), // Use product ID as value
      label: p.name,
    }));
  }, [productsMasterData]);


  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingPriceListItem, setEditingPriceListItem] = useState<PriceListItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PriceListItem | null>(null);
  const [filterCriteria, setFilterCriteria] = useState<PriceListFilterFormData>({ filterProductIds: [] });

  useEffect(() => {
    dispatch(getPriceListAction());
    dispatch(getAllProductAction()); // <<< --- ADDED: Fetch products on mount
  }, [dispatch]);

  const defaultFormValues: PriceListFormData = useMemo(() => ({ // Make default values dependent on fetched options
    product_id: productSelectOptions[0]?.value || "",
    price: "", usd_rate: "", expance: "", margin: "",
  }), [productSelectOptions]);

  const addFormMethods = useForm<PriceListFormData>({ resolver: zodResolver(priceListFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const editFormMethods = useForm<PriceListFormData>({ resolver: zodResolver(priceListFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const filterFormMethods = useForm<PriceListFilterFormData>({ resolver: zodResolver(priceListFilterFormSchema), defaultValues: filterCriteria });

  const openAddDrawer = useCallback(() => { addFormMethods.reset(defaultFormValues); setIsAddDrawerOpen(true); }, [addFormMethods, defaultFormValues]);
  const closeAddDrawer = useCallback(() => { addFormMethods.reset(defaultFormValues); setIsAddDrawerOpen(false); }, [addFormMethods, defaultFormValues]);

  const onAddPriceListSubmit = async (formData: PriceListFormData) => {
    setIsSubmitting(true);
    const selectedProduct = productSelectOptions.find(p => p.value === formData.product_id);
    const productNameForNotification = selectedProduct ? selectedProduct.label : "Unknown Product";
    const apiPayload = { ...formData };
    try {
      await dispatch(addPriceListAction(apiPayload)).unwrap();
      toast.push(<Notification title="Price List Item Added" type="success">{`Item for "${productNameForNotification}" added.`}</Notification>);
      closeAddDrawer(); dispatch(getPriceListAction());
    } catch (error: any) {
      toast.push(<Notification title="Failed to Add" type="danger">{error.message || "Could not add item."}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const openEditDrawer = (item: PriceListItem) => {
    setEditingPriceListItem(item);
    editFormMethods.reset({
      product_id: String(item.product_id), // Ensure product_id is a string for Select value
      price: item.price, usd_rate: item.usd_rate, expance: item.expance, margin: item.margin,
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => { setEditingPriceListItem(null); editFormMethods.reset(defaultFormValues); setIsEditDrawerOpen(false); };

  const onEditPriceListSubmit = async (formData: PriceListFormData) => {
    if (!editingPriceListItem) return;
    setIsSubmitting(true);
    const selectedProduct = productSelectOptions.find(p => p.value === formData.product_id);
    const productNameForNotification = selectedProduct ? selectedProduct.label : (editingPriceListItem.product?.name || "Unknown");
    const apiPayload = { id: editingPriceListItem.id, ...formData };
    try {
      await dispatch(editPriceListAction(apiPayload)).unwrap();
      toast.push(<Notification title="Price List Item Updated" type="success">{`Item for "${productNameForNotification}" updated.`}</Notification>);
      closeEditDrawer(); dispatch(getPriceListAction());
    } catch (error: any) {
      toast.push(<Notification title="Failed to Update" type="danger">{error.message || "Could not update."}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = (item: PriceListItem) => { if (item.id === undefined) return; setItemToDelete(item); setSingleDeleteConfirmOpen(true); };
  const onConfirmSingleDelete = async () => {
    if (!itemToDelete?.id) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try {
      await dispatch(deletePriceListAction({ id: itemToDelete.id })).unwrap(); // Pass object with id
      toast.push(<Notification title="Item Deleted" type="success">{`"${itemToDelete.product.name}" deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((i) => i.id !== itemToDelete!.id)); dispatch(getPriceListAction());
    } catch (error: any) {
      toast.push(<Notification title="Delete Failed" type="danger">{error.message || `Could not delete.`}</Notification>);
    } finally { setIsDeleting(false); setItemToDelete(null); }
  };
  const handleDeleteSelected = async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const idsToDelete = selectedItems.map((item) => String(item.id)).join(","); try { await dispatch(deleteAllPriceListAction({ ids: idsToDelete })).unwrap(); toast.push(<Notification title="Selected Deleted" type="success">{`${selectedItems.length} item(s) deleted.`}</Notification>); setSelectedItems([]); dispatch(getPriceListAction()); } catch (error: any) { toast.push(<Notification title="Deletion Failed" type="danger">{error.message || "Failed to delete."}</Notification>); } finally { setIsDeleting(false); } };

  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); };
  const closeFilterDrawerCb = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = (data: PriceListFilterFormData) => { setFilterCriteria({ filterProductIds: data.filterProductIds || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawerCb(); };
  const onClearFilters = () => { const df = { filterProductIds: [] }; filterFormMethods.reset(df); setFilterCriteria(df); handleSetTableData({ pageIndex: 1 }); };

  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<PriceListItem[]>([]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: PriceListItem[] = Array.isArray(priceListData) ? priceListData : [];
    let processedData: PriceListItem[] = cloneDeep(sourceData);
    if (filterCriteria.filterProductIds?.length) { const selectedIds = filterCriteria.filterProductIds.map(opt => opt.value); processedData = processedData.filter(item => selectedIds.includes(String(item.product_id))); }
    if (tableData.query) { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter(item => (item.product?.name?.toLowerCase().includes(query)) || String(item.id).toLowerCase().includes(query) || String(item.product_id).toLowerCase().includes(query)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "product.name") { aValue = String(a.product?.name ?? ""); bValue = String(b.product?.name ?? ""); }
        else { aValue = String(a[key as keyof PriceListItem] ?? ""); bValue = String(b[key as keyof PriceListItem] ?? ""); }
        // Convert to number if key suggests numeric comparison
        if (['price', 'base_price', 'gst_price', 'usd_rate', 'usd', 'expance', 'interest', 'nlc', 'margin', 'sales_price'].includes(key)) {
          const numA = parseFloat(aValue);
          const numB = parseFloat(bValue);
          if (!isNaN(numA) && !isNaN(numB)) {
            return order === 'asc' ? numA - numB : numB - numA;
          }
        }
        return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      });
    }
    const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [priceListData, tableData, filterCriteria]);

  const handleExportData = () => { exportPriceListToCsv("pricelist_export.csv", allFilteredAndSortedData); };
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectPageSizeChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: PriceListItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<PriceListItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<PriceListItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", enableSorting: true, size: 70 },
    { header: "Product Name", accessorFn: (row) => row.product?.name, id: "product.name", enableSorting: true, size: 200, cell: props => props.row.original.product?.name || "N/A" },
    { header: "Price Breakup", id: "priceBreakup", size: 180, cell: ({ row }) => { const { price, base_price, gst_price, usd } = row.original; return (<div className="flex flex-col text-xs"><span>Price: {price}</span><span>Base: {base_price}</span><span>GST: {gst_price}</span><span>USD: {usd}</span></div>); } },
    { header: "Cost Split", id: "costSplit", size: 180, cell: ({ row }) => { const { expance, margin, interest, nlc } = row.original; return (<div className="flex flex-col text-xs"><span>Expense: {expance}</span><span>Margin: {margin}</span><span>Interest: {interest}</span><span>NLC: {nlc}</span></div>); } },
    { header: "Sales Price", accessorKey: "sales_price", enableSorting: true, size: 120 },
    { header: "Actions", id: "action", meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
  ], [openEditDrawer, handleDeleteClick]
  );

  const formFieldsConfig: { name: keyof PriceListFormData; label: string; type?: "text" | "number" | "select"; options?: SelectOption[]; }[] = [
    { name: "product_id", label: "Product Name", type: "select", options: productSelectOptions },
    { name: "price", label: "Price", type: "text" }, { name: "usd_rate", label: "USD Rate", type: "text" },
    { name: "expance", label: "Expenses", type: "text" }, { name: "margin", label: "Margin", type: "text" },
  ];

  const renderFormField = (fieldConfig: (typeof formFieldsConfig)[0], formControl: any) => { /* ... as before ... */ const commonProps = { name: fieldConfig.name, control: formControl }; const placeholderText = `Enter ${fieldConfig.label}`; if (fieldConfig.type === "select") { return (<Controller {...commonProps} render={({ field }) => (<Select placeholder={`Select ${fieldConfig.label}`} options={fieldConfig.options || []} value={fieldConfig.options?.find((opt) => opt.value === field.value) || null} onChange={(option) => field.onChange(option ? option.value : "")} />)} />); } return (<Controller {...commonProps} render={({ field }) => (<Input {...field} type={fieldConfig.type || "text"} placeholder={placeholderText} />)} />); };

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4"> <h5 className="mb-2 sm:mb-0">Price List</h5>
            <div>
              <Link to='/task/task-list/create'>
                <Button
                  className="mr-2"
                  icon={<TbUser />}
                  clickFeedback={false}
                  customColorClass={({ active, unclickable }) =>
                    classNames(
                      'hover:text-gray-800 dark:hover:bg-gray-600 border-0 hover:ring-0',
                      active ? 'bg-gray-200' : 'bg-gray-100',
                      unclickable && 'opacity-50 cursor-not-allowed',
                      !active && !unclickable && 'hover:bg-gray-200',
                    )
                  }
                >Assigned to Task</Button>
              </Link>
              <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
            </div>
          </div>
          <PriceListTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} onClearFilters={onClearFilters} />
          <div className="mt-4"> <PriceListTable columns={columns} data={pageData} loading={masterLoadingStatus === "idle" || isSubmitting || isDeleting} pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} /> </div>
        </AdaptiveCard>
      </Container>
      <PriceListSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} /> {/* Passed isDeleting */}
      {[
        {
          title: "Add Price List",
          isOpen: isAddDrawerOpen, closeFn: closeAddDrawer,
          formId: "addPriceListForm",
          methods: addFormMethods,
          onSubmit: onAddPriceListSubmit,
          submitText: "Adding...", saveText: "Save",
        },
        {
          title: "Edit Price List",
          isOpen: isEditDrawerOpen,
          closeFn: closeEditDrawer,
          formId: "editPriceListForm",
          methods: editFormMethods,
          onSubmit: onEditPriceListSubmit,
          submitText: "Saving...",
          saveText: "Save",
        }
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
              <Button size="sm" className="mr-2" onClick={drawerProps.closeFn} disabled={isSubmitting}>Cancel</Button>
              <Button size="sm" variant="solid" form={drawerProps.formId} type="submit" loading={isSubmitting} disabled={!drawerProps.methods.formState.isValid || isSubmitting}>
                {isSubmitting ? drawerProps.submitText : drawerProps.saveText}
              </Button>
            </div>}
        >
          <Form
            id={drawerProps.formId}
            onSubmit={drawerProps.methods.handleSubmit(drawerProps.onSubmit as any)}
            className="flex flex-col gap-4">
            {formFieldsConfig.map((fConfig) => (
              <FormItem
                key={fConfig.name}
                label={fConfig.label}
                invalid={!!drawerProps.methods.formState.errors[fConfig.name]}
                errorMessage={
                  drawerProps.methods.formState.errors[fConfig.name]?.message as string | undefined
                }
              >
                {renderFormField(fConfig, drawerProps.methods.control)}
              </FormItem>
            ))}
          </Form>
          <div className="relative bottom-[0%] w-full">
            <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
              <div className="">
                <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
                <p className="text-sm font-semibold">Tushar Joshi</p>
                <p>System Admin</p>
              </div>
              <div className=""><br />
                <span className="font-semibold">Created At:</span> <span>27 May, 2025, 2:00 PM</span><br />
                <span className="font-semibold">Updated At:</span> <span>27 May, 2025, 2:00 PM</span>
              </div>
            </div>
          </div>
          {" "}
        </Drawer>))}
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawerCb} onRequestClose={closeFilterDrawerCb} width={400} footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button> <Button size="sm" variant="solid" form="filterPriceListForm" type="submit">Apply</Button> </div>} > <Form id="filterPriceListForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4"> <FormItem label="Product Name"> <Controller name="filterProductIds" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select product names..." options={productSelectOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /> </FormItem> </Form> </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Price List Item" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isDeleting} > <p>Are you sure you want to delete item for "<strong>{itemToDelete?.product.name}</strong>"?</p> </ConfirmDialog>
    </>
  );
};

export default PriceList;