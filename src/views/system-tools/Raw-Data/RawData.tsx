// src/views/your-path/RowDataListing.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect, ChangeEvent } from "react";
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
import Select from "@/components/ui/Select";
import DebounceInput from "@/components/shared/DebouceInput";
import { Drawer, Form, FormItem, Input, Tag, Dialog, Card } from "@/components/ui"; // Removed Upload as not directly used in this pattern

// Icons
import {
  TbPencil,
  TbChecks,
  TbPlus,
  TbEye,
  TbUser,
  TbBuilding,
  TbMail,
  TbPhone,
  TbSearch,
  TbCloudUpload,
  TbFilter,
  TbCloudDownload,
  TbMapPin,
  TbTrash,
  TbCategory2,
  TbBuildingArch,
  TbWorld,
  TbFileSpreadsheet,
  TbCancel,
  TbReload,
  TbUserShare,
  TbSettingsCog,
  TbDatabase,
  TbCalendarWeek,
  TbSquares, // Added for consistency if needed in drawer titles
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import classNames from "@/utils/classNames";

// Redux
import { useAppDispatch } from '@/reduxtool/store';
import { shallowEqual, useSelector } from "react-redux";
import {
  getRowDataAction,
  addRowDataAction,
  editRowDataAction,
  deleteRowDataAction,
  deleteAllRowDataAction,
  getCountriesAction,
  getCategoriesAction,
  getBrandAction,
  importRowDataAction,
  submitExportReasonAction, // Added for export reason
} from '@/reduxtool/master/middleware';
import { masterSelector } from '@/reduxtool/master/masterSlice';
import { Link } from "react-router-dom";


// --- Define Types ---
export type CountryListItem = { id: string | number; name: string; };
export type CategoryListItem = { id: string | number; name: string; };
export type BrandListItem = { id: string | number; name: string; };
export type SelectOption = { value: string; label: string };

export type RowDataItem = {
  id: string | number;
  country_id: string;
  category_id: string;
  brand_id: string;
  mobile_no: string;
  email?: string | null;
  name: string;
  company_name?: string | null;
  status: string;
  quality: string;
  city?: string;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  country?: { id: number; name: string; } | null;
  category?: { id: number; name: string; } | null;
  brand?: { id: number; name: string; } | null;
  updated_by_name?: string; // Added for "Updated Info" column
  updated_by_role?: string; // Added for "Updated Info" column
};

// --- Zod Schema for Add/Edit Form ---
const QUALITY_LEVELS_UI: SelectOption[] = [
  { value: "A", label: "Grade A (High)" },
  { value: "B", label: "Grade B (Medium)" },
  { value: "C", label: "Grade C (Low)" },
];
const qualityUIValues = QUALITY_LEVELS_UI.map((q) => q.value) as [string, ...string[]];

const STATUS_OPTIONS_UI: SelectOption[] = [
  { value: "Row", label: "Row" },
  { value: "Identified", label: "Identified" },
  { value: "Verified", label: "Verified" },
  { value: "Hold", label: "Hold" },
  { value: "Blacklist", label: "Blacklisted" },
];
const statusUIValues = STATUS_OPTIONS_UI.map((s) => s.value) as [string, ...string[]];

const statusColors: Record<string, string> = {
  Row: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  Identified: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100",
  Verified: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Hold: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  Blacklist: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

const rowDataFormSchema = z.object({
  country_id: z.string().min(1, "Country is required."),
  category_id: z.string().min(1, "Category is required."),
  brand_id: z.string().min(1, "Brand is required."),
  mobile_no: z.string().min(1, "Mobile No. is required.").max(20, "Mobile No. too long."),
  email: z.string().email("Invalid email format.").optional().or(z.literal("")),
  name: z.string().min(1, "Name is required.").max(100, "Name too long."),
  company_name: z.string().max(150).optional().or(z.literal("")),
  quality: z.enum(qualityUIValues, { errorMap: () => ({ message: "Quality is required." }), }),
  city: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(statusUIValues, { errorMap: () => ({ message: "Status is required." }), }),
  remarks: z.string().max(500, "Remarks too long.").optional().or(z.literal("")),
});
type RowDataFormData = z.infer<typeof rowDataFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterCountry: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCategory: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterBrand: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatus: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterQuality: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(1, "Reason for export is required.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- CSV Exporter ---
type RowDataExportItem = Omit<RowDataItem, 'created_at' | 'updated_at' | 'country' | 'category' | 'brand'> & {
  countryNameDisplay?: string;
  categoryNameDisplay?: string;
  brandNameDisplay?: string;
  statusDisplay?: string;
  qualityDisplay?: string;
  created_at_formatted?: string;
  // updated_by_name and updated_by_role are already optional in RowDataItem
  updated_at_formatted?: string;
};

const CSV_HEADERS_ROW_DATA = ["ID", "Country", "Category", "Brand", "Name", "Mobile No", "Email", "Company Name", "City", "Status", "Quality", "Remarks", "Created At", "Updated By", "Updated Role", "Updated At"];
const CSV_KEYS_ROW_DATA_EXPORT: (keyof RowDataExportItem)[] = [
  "id", "countryNameDisplay", "categoryNameDisplay", "brandNameDisplay", "name", "mobile_no", "email", "company_name", "city", "statusDisplay", "qualityDisplay", "remarks", "created_at_formatted", "updated_by_name", "updated_by_role", "updated_at_formatted"
];

function exportRowDataToCsvLogic(filename: string, rows: RowDataItem[], countryOptions: SelectOption[], categoryOptions: SelectOption[], brandOptions: SelectOption[]) {
  if (!rows || !rows.length) { return false; } // Caller handles toast for no data
  const preparedRows: RowDataExportItem[] = rows.map((row) => ({
    ...row, // Includes id, mobile_no, name, etc. and optional updated_by_name, updated_by_role
    email: row.email || "N/A",
    company_name: row.company_name || "N/A",
    city: row.city || "N/A",
    remarks: row.remarks || "N/A",
    updated_by_name: row.updated_by_name || "N/A", // Add N/A fallback
    updated_by_role: row.updated_by_role || "N/A", // Add N/A fallback
    countryNameDisplay: countryOptions.find(c => c.value === String(row.country_id))?.label || String(row.country_id),
    categoryNameDisplay: categoryOptions.find(c => c.value === String(row.category_id))?.label || String(row.category_id),
    brandNameDisplay: brandOptions.find(b => b.value === String(row.brand_id))?.label || String(row.brand_id),
    statusDisplay: STATUS_OPTIONS_UI.find(s => s.value === row.status)?.label || row.status,
    qualityDisplay: QUALITY_LEVELS_UI.find(q => q.value === row.quality)?.label || row.quality,
    created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString() : "N/A",
    updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
  }));
  const separator = ",";
  const csvContent = CSV_HEADERS_ROW_DATA.join(separator) + "\n" + preparedRows.map((row) => CSV_KEYS_ROW_DATA_EXPORT.map((k) => { let cell = row[k as keyof RowDataExportItem]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

// --- ActionColumn ---
const ActionColumn = ({ onEdit, onViewDetail, onDelete, onBlacklist, item }: { onEdit: () => void; onViewDetail: () => void; onDelete: () => void; onBlacklist: () => void; item: RowDataItem; }) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div>
      </Tooltip>
      <Tooltip title="View Details">
        <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={onViewDetail}><TbEye /></div>
      </Tooltip>
      <Tooltip title="Convert to Member">
        <Link to={`/business-entities/member-create?rowDataId=${item.id}`} state={{ rowData: item }} className={`text-xl cursor-pointer select-none text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400`} role="button"><TbUserShare /></Link>
      </Tooltip>
      {item.status !== "Blacklist" && (
        <Tooltip title="Blacklist">
          <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`} role="button" onClick={onBlacklist}><TbCancel size={16} /></div>
        </Tooltip>
      )}
      <Tooltip title="Delete">
        <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`} role="button" onClick={onDelete}><TbTrash /></div>
      </Tooltip>
    </div>
  );
};

type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange }, ref) => (<DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />)
);
ItemSearch.displayName = "ItemSearch";

type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onImport: () => void; onClearFilters: () => void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onImport, onClearFilters }: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button title="Clear Filters" icon={<TbReload />} onClick={onClearFilters}></Button>
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

type RowDataSelectedFooterProps = { selectedItems: RowDataItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const RowDataSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: RowDataSelectedFooterProps) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span>Item{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}>Delete Selected</Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Item${selectedItems.length > 1 ? "s" : ""}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} loading={isDeleting}>
        <p>Are you sure you want to delete the selected row data item{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};


const RowDataListing = () => {
  const dispatch = useAppDispatch();
  const {
    rowData = [],
    CountriesData = [],
    CategoriesData = [],
    BrandData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [countryOptions, setCountryOptions] = useState<SelectOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<SelectOption[]>([]);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RowDataItem | null>(null);
  const [viewingItem, setViewingItem] = useState<RowDataItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<RowDataItem | null>(null);
  const [itemToBlacklist, setItemToBlacklist] = useState<RowDataItem | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBlacklisting, setIsBlacklisting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [blacklistConfirmOpen, setBlacklistConfirmOpen] = useState(false);

  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<RowDataItem[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});

  // --- Export Reason Modal State ---
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  // --- Import Modal State ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    dispatch(getRowDataAction());
    dispatch(getCountriesAction());
    dispatch(getCategoriesAction());
    dispatch(getBrandAction());
  }, [dispatch]);

  useEffect(() => { setCountryOptions(Array.isArray(CountriesData) ? CountriesData.map((c: CountryListItem) => ({ value: String(c.id), label: c.name })) : []); }, [CountriesData]);
  useEffect(() => { setCategoryOptions(Array.isArray(CategoriesData) ? CategoriesData.map((c: CategoryListItem) => ({ value: String(c.id), label: c.name })) : []); }, [CategoriesData]);
  useEffect(() => { setBrandOptions(Array.isArray(BrandData) ? BrandData.map((b: BrandListItem) => ({ value: String(b.id), label: b.name })) : []); }, [BrandData]);


  const defaultFormValues: RowDataFormData = useMemo(() => ({
    country_id: countryOptions[0]?.value || "",
    category_id: categoryOptions[0]?.value || "",
    brand_id: brandOptions[0]?.value || "",
    mobile_no: "", email: "", name: "", company_name: "",
    quality: QUALITY_LEVELS_UI[0]?.value || "A",
    city: "",
    status: STATUS_OPTIONS_UI.find(s => s.value === "Row")?.value || "Row",
    remarks: "",
  }), [countryOptions, categoryOptions, brandOptions]);

  const formMethods = useForm<RowDataFormData>({ resolver: zodResolver(rowDataFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

  const openAddDrawer = useCallback(() => { formMethods.reset(defaultFormValues); setEditingItem(null); setIsAddDrawerOpen(true); }, [formMethods, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: RowDataItem) => {
      setEditingItem(item);
      formMethods.reset({
        country_id: String(item.country_id),
        category_id: String(item.category_id),
        brand_id: String(item.brand_id),
        mobile_no: item.mobile_no,
        email: item.email || "",
        name: item.name,
        company_name: item.company_name || "",
        quality: item.quality || "",
        city: item.city || "",
        status: item.status || "",
        remarks: item.remarks || "",
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

  const openViewDialog = useCallback((item: RowDataItem) => setViewingItem(item), []);
  const closeViewDialog = useCallback(() => setViewingItem(null), []);

  const onSubmitHandler = async (data: RowDataFormData) => {
    setIsSubmitting(true);
    const apiPayload = { ...data, email: data.email === "" ? null : data.email, company_name: data.company_name === "" ? null : data.company_name, city: data.city === "" ? null : data.city, remarks: data.remarks === "" ? null : data.remarks };
    try {
      if (editingItem) {
        await dispatch(editRowDataAction({ id: editingItem.id, ...apiPayload })).unwrap();
        toast.push(<Notification title="Raw Data Updated" type="success" duration={2000} />);
        closeEditDrawer();
      } else {
        await dispatch(addRowDataAction(apiPayload)).unwrap();
        toast.push(<Notification title="Raw Data Added" type="success" duration={2000} />);
        closeAddDrawer();
      }
      dispatch(getRowDataAction());
    } catch (e: any) {
      toast.push(<Notification title={(editingItem ? "Update" : "Add") + " Failed"} type="danger" duration={3000}>{(e as Error).message || "An error occurred."}</Notification>);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = useCallback((item: RowDataItem) => { if (!item.id) return; setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true); setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteRowDataAction({ id: String(itemToDelete.id) })).unwrap();
      toast.push(<Notification title="Raw Data Deleted" type="success" duration={2000}>{`Entry "${itemToDelete.name || itemToDelete.mobile_no}" deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getRowDataAction());
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{(e as Error).message || "Could not delete item."}</Notification>);
    } finally { setIsDeleting(false); setItemToDelete(null); }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const validItems = selectedItems.filter((item) => item.id); if (validItems.length === 0) { setIsDeleting(false); return; }
    const idsToDelete = validItems.map((item) => String(item.id));
    try {
      await dispatch(deleteAllRowDataAction({ ids: idsToDelete.join(',') })).unwrap();
      toast.push(<Notification title="Raw Data Deleted" type="success" duration={2000}>{`${validItems.length} item(s) deleted.`}</Notification>);
      setSelectedItems([]); dispatch(getRowDataAction());
    } catch (e: any) {
      toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{(e as Error).message || "Failed to delete selected items."}</Notification>);
    } finally { setIsDeleting(false); }
  }, [dispatch, selectedItems]);


  const handleBlacklistClick = useCallback((item: RowDataItem) => { setItemToBlacklist(item); setBlacklistConfirmOpen(true); }, []);
  const onConfirmBlacklist = async () => {
    if (!itemToBlacklist) return;
    setIsBlacklisting(true); setBlacklistConfirmOpen(false);
    const payload: any = { ...itemToBlacklist, status: "Blacklist", country_id: String(itemToBlacklist.country_id), category_id: String(itemToBlacklist.category_id), brand_id: String(itemToBlacklist.brand_id) };
    delete payload.country; delete payload.category; delete payload.brand;
    try {
      await dispatch(editRowDataAction(payload)).unwrap();
      toast.push(<Notification title="Raw Data Blacklisted" type="warning" duration={2000}>{`Entry "${itemToBlacklist.name || itemToBlacklist.mobile_no}" blacklisted.`}</Notification>);
      dispatch(getRowDataAction());
    } catch (e: any) {
      toast.push(<Notification title="Blacklist Failed" type="danger" duration={3000}>{(e as Error).message}</Notification>);
    } finally { setIsBlacklisting(false); setItemToBlacklist(null); }
  };

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); setTableData((prev) => ({ ...prev, pageIndex: 1 })); closeFilterDrawer(); }, [closeFilterDrawer]);
  const onClearFilters = useCallback(() => { const defaultFilters = {}; filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); }, [filterFormMethods]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: RowDataItem[] = Array.isArray(rowData) ? rowData : [];
    let processedData: RowDataItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterCountry?.length) processedData = processedData.filter(item => filterCriteria.filterCountry!.some(fc => fc.value === String(item.country_id)));
    if (filterCriteria.filterCategory?.length) processedData = processedData.filter(item => filterCriteria.filterCategory!.some(fc => fc.value === String(item.category_id)));
    if (filterCriteria.filterBrand?.length) processedData = processedData.filter(item => filterCriteria.filterBrand!.some(fb => fb.value === String(item.brand_id)));
    if (filterCriteria.filterStatus?.length) processedData = processedData.filter(item => filterCriteria.filterStatus!.some(fs => fs.value === item.status));
    if (filterCriteria.filterQuality?.length) processedData = processedData.filter(item => filterCriteria.filterQuality!.some(fq => fq.value === item.quality));

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(item =>
        String(item.id).toLowerCase().includes(query) ||
        item.mobile_no.toLowerCase().includes(query) ||
        (item.email && item.email.toLowerCase().includes(query)) ||
        item.name.toLowerCase().includes(query) ||
        (item.company_name && item.company_name.toLowerCase().includes(query)) ||
        (item.city && item.city.toLowerCase().includes(query)) ||
        (item.country?.name?.toLowerCase() || String(item.country_id)).includes(query) || // Added null check for country.name
        (item.category?.name?.toLowerCase() || String(item.category_id)).includes(query) || // Added null check for category.name
        (item.brand?.name?.toLowerCase() || String(item.brand_id)).includes(query) || // Added null check for brand.name
        (item.updated_by_name?.toLowerCase() ?? "").includes(query) // Search by updated_by_name
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    const validSortKeys: (keyof RowDataItem | 'countryName' | 'categoryName' | 'brandName')[] = ["id", "name", "mobile_no", "email", "status", "quality", "created_at", "updated_at", "country_id", "category_id", "brand_id", "updated_by_name"];

    if (order && key && validSortKeys.includes(String(key) as any)) {
      processedData.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === "created_at" || key === "updated_at") {
          const dateA = a[key as 'created_at' | 'updated_at'] ? new Date(a[key as 'created_at' | 'updated_at']!).getTime() : 0;
          const dateB = b[key as 'created_at' | 'updated_at'] ? new Date(b[key as 'created_at' | 'updated_at']!).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        } else if (key === 'country_id') { aVal = a.country?.name; bVal = b.country?.name; }
        else if (key === 'category_id') { aVal = a.category?.name; bVal = b.category?.name; }
        else if (key === 'brand_id') { aVal = a.brand?.name; bVal = b.brand?.name; }
        else { aVal = a[key as keyof RowDataItem] ?? ""; bVal = b[key as keyof RowDataItem] ?? ""; }

        if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc" ? String(aVal ?? "").localeCompare(String(bVal ?? "")) : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [rowData, tableData, filterCriteria]);

  // --- Export Functionality (Reason Modal) ---
  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Raw Data Management"; // Module name for logging
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      exportRowDataToCsvLogic("row_data_export.csv", allFilteredAndSortedData, countryOptions, categoryOptions, brandOptions);
      toast.push(<Notification title="Data Exported" type="success">Row data exported.</Notification>);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Operation Failed" type="danger" message={error.message || "Could not complete export."} />);
    } finally { setIsSubmittingExportReason(false); }
  };


  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: RowDataItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<RowDataItem>[]) => {
    const cPOR = currentRows.map((r) => r.original);
    if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => r.id && !pSIds.has(r.id)); return [...pS, ...nRTA]; }); }
    else { const cPRIds = new Set(cPOR.map((r) => r.id).filter(id => id !== undefined)); setSelectedItems((pS) => pS.filter((i) => i.id && !cPRIds.has(i.id))); }
  }, []);


  const mobileNoCount: Record<string, number> = {};
  pageData.forEach(item => {
    if (item.mobile_no) {
      mobileNoCount[item.mobile_no] = (mobileNoCount[item.mobile_no] || 0) + 1;
    }
  });

  const columns: ColumnDef<RowDataItem>[] = useMemo(() => [
    // { header: 'ID', accessorKey: 'id', enableSorting: true, size: 60, meta: { tdClass: "text-center", thClass: "text-center" } },
    { header: 'Name', accessorKey: 'name', enableSorting: true, size: 280, cell: (props) => (
      <div>
        <span className="font-semibold text-blue-600 dark:text-blue-400">{props.row.original.id}</span> <br />
        <span className="">{props.row.original.name}</span>
      </div>
  ) },
    {
      header: 'Mobile No', accessorKey: 'mobile_no', enableSorting: true, size: 130,
      cell: (props) => {
        const mobileNo = props.getValue<string>();
        const isDuplicate = mobileNo && mobileNoCount[mobileNo] > 1;
        return (
          <div className="flex flex-col gap-1">
            {mobileNo}
            {isDuplicate && (
              <Tag className="bg-red-200 text-red-600 text-xs w-fit px-2 py-0.5 rounded-md">
                Duplicate
              </Tag>
            )}
          </div>
        );
      }

    },
    { header: 'Country', accessorKey: 'country_id', enableSorting: true, size: 160, cell: props => props.row.original.country?.name || String(props.getValue()) },
    { header: 'Category', accessorKey: 'category_id', enableSorting: true, size: 170, cell: props => props.row.original.category?.name || String(props.getValue()) },
    { header: 'Brand', accessorKey: 'brand_id', enableSorting: true, size: 160, cell: props => props.row.original.brand?.name || String(props.getValue()) },
    { header: 'Quality', accessorKey: 'quality', enableSorting: true, size: 100, cell: props => { const qVal = props.getValue<string>(); const qOpt = QUALITY_LEVELS_UI.find(q => q.value === qVal); return <Tag className={classNames("capitalize", qVal === "A" && "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-100", qVal === "B" && "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100", qVal === "C" && "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100")}>Grade: {qOpt?.label.split(' ')[1] || qVal}</Tag>; } },
    { header: 'Status', accessorKey: 'status', enableSorting: true, size: 110, cell: props => { const sVal = props.getValue<string>(); const sOpt = STATUS_OPTIONS_UI.find(s => s.value === sVal); return <Tag className={classNames("capitalize", statusColors[sVal])}>{sOpt?.label || sVal}</Tag>; } },
    {
      header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 170, meta: { HeaderClass: "text-red-500" },// Matched size with Domain module
      cell: (props) => {
        const { updated_at, updated_by_name, updated_by_role } = props.row.original;
        const formattedDate = updated_at ? `${new Date(updated_at).getDate()} ${new Date(updated_at).toLocaleString("en-US", { month: "short" })} ${new Date(updated_at).getFullYear()}, ${new Date(updated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` : "N/A";
        return (<div className="text-xs"><span>{updated_by_name || "N/A"}{updated_by_role && (<><br /><b>{updated_by_role}</b></>)}</span><br /><span>{formattedDate}</span></div>);
      },
    },
    {
      header: "Actions", id: "action", size: 130, meta: { HeaderClass: "text-center", cellClass: "text-center" },
      cell: props => <ActionColumn item={props.row.original} onEdit={() => openEditDrawer(props.row.original)} onViewDetail={() => openViewDialog(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onBlacklist={() => handleBlacklistClick(props.row.original)} />
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [openEditDrawer, openViewDialog, handleDeleteClick, handleBlacklistClick, countryOptions, categoryOptions, brandOptions]); // Added dependencies

  const renderDrawerForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
      <FormItem label="Country" invalid={!!formMethods.formState.errors.country_id} errorMessage={formMethods.formState.errors.country_id?.message}><Controller name="country_id" control={formMethods.control} render={({ field }) => (<Select placeholder="Select country" options={countryOptions} value={countryOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbWorld />} />)} /></FormItem>
      <FormItem label="Category" invalid={!!formMethods.formState.errors.category_id} errorMessage={formMethods.formState.errors.category_id?.message}><Controller name="category_id" control={formMethods.control} render={({ field }) => (<Select placeholder="Select category" options={categoryOptions} value={categoryOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbCategory2 />} />)} /></FormItem>
      <FormItem label="Brand" invalid={!!formMethods.formState.errors.brand_id} errorMessage={formMethods.formState.errors.brand_id?.message}><Controller name="brand_id" control={formMethods.control} render={({ field }) => (<Select placeholder="Select brand" options={brandOptions} value={brandOptions.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbBuildingArch />} />)} /></FormItem>
      <FormItem label="Mobile No." invalid={!!formMethods.formState.errors.mobile_no} errorMessage={formMethods.formState.errors.mobile_no?.message}><Controller name="mobile_no" control={formMethods.control} render={({ field }) => (<Input {...field} prefix={<TbPhone />} placeholder="+XX-XXXXXXXXXX" />)} /></FormItem>
      <FormItem label="Email (Optional)" invalid={!!formMethods.formState.errors.email} errorMessage={formMethods.formState.errors.email?.message}><Controller name="email" control={formMethods.control} render={({ field }) => (<Input {...field} type="email" prefix={<TbMail />} placeholder="name@example.com" />)} /></FormItem>
      <FormItem label="Name" invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}><Controller name="name" control={formMethods.control} render={({ field }) => (<Input {...field} prefix={<TbUser />} placeholder="Contact Name / Lead Name" />)} /></FormItem>
      <FormItem label="Company Name (Optional)" invalid={!!formMethods.formState.errors.company_name} errorMessage={formMethods.formState.errors.company_name?.message}><Controller name="company_name" control={formMethods.control} render={({ field }) => <Input {...field} prefix={<TbBuilding />} placeholder="ABC Corp" />} /></FormItem>
      <FormItem label="Quality" invalid={!!formMethods.formState.errors.quality} errorMessage={formMethods.formState.errors.quality?.message}><Controller name="quality" control={formMethods.control} render={({ field }) => (<Select placeholder="Select quality" options={QUALITY_LEVELS_UI} value={QUALITY_LEVELS_UI.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></FormItem>
      <FormItem label="City (Optional)" invalid={!!formMethods.formState.errors.city} errorMessage={formMethods.formState.errors.city?.message}><Controller name="city" control={formMethods.control} render={({ field }) => <Input {...field} prefix={<TbMapPin />} placeholder="City Name" />} /></FormItem>
      <FormItem label="Status" invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message}><Controller name="status" control={formMethods.control} render={({ field }) => (<Select placeholder="Select status" options={editingItem?.status === "Blacklist" ? STATUS_OPTIONS_UI : STATUS_OPTIONS_UI.filter(s => s.value !== "Blacklist")} value={STATUS_OPTIONS_UI.find(o => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} disabled={editingItem?.status === "Blacklist"} />)} /></FormItem>
      <FormItem label="Remarks (Optional)" className="md:col-span-2 lg:col-span-3" invalid={!!formMethods.formState.errors.remarks} errorMessage={formMethods.formState.errors.remarks?.message}><Controller name="remarks" control={formMethods.control} render={({ field }) => <Input textArea {...field} rows={3} placeholder="Add any relevant notes or comments..." />} /></FormItem>
    </div>
  );

  // --- Import Modal Handlers & Submit ---
  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => { setIsImportModalOpen(false); setSelectedFile(null); };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { if (file.type === "text/csv" || file.name.endsWith(".csv") || file.type === "application/vnd.ms-excel" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") { setSelectedFile(file); } else { toast.push(<Notification title="Invalid File Type" type="danger" duration={3000}>Please upload a CSV or Excel file.</Notification>); setSelectedFile(null); if (e.target) e.target.value = ""; } } else { setSelectedFile(null); } };
  const handleImportSubmit = async () => { if (!selectedFile) { toast.push(<Notification title="No File Selected" type="warning" duration={2000}>Please select a file to import.</Notification>); return; } setIsImporting(true); const formData = new FormData(); formData.append('file', selectedFile); try { await dispatch(importRowDataAction(formData)).unwrap(); toast.push(<Notification title="Import Initiated" type="success" duration={2000}>File uploaded. Processing will continue.</Notification>); dispatch(getRowDataAction()); closeImportModal(); } catch (apiError: any) { toast.push(<Notification title="Import Failed" type="danger" duration={3000}>{apiError.message || "Failed to import data."}</Notification>); } finally { setIsImporting(false); } };

  const tableLoading = masterLoadingStatus === "loading" || isSubmitting || isDeleting || isBlacklisting || isImporting;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Raw Data Management</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>Add New</Button>
          </div>

          <div className="grid grid-cols-6 mb-4 gap-2">
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-blue-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbDatabase size={24} />
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
                <TbSquares size={24} />
              </div>
              <div>
                <h6 className="text-pink-500">345</h6>
                <span className="font-semibold text-xs">Duplicate</span>
              </div>
            </Card>

            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-green-300" >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <span className="text-xl">A</span>
              </div>
              <div>
                <h6 className="text-green-500">87</h6>
                <span className="font-semibold text-xs">Grade A</span>
              </div>
            </Card>
            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-orange-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <span className="text-xl">B</span>
              </div>
              <div>
                <h6 className="text-orange-500">78</h6>
                <span className="font-semibold text-xs">Grade B</span>
              </div>
            </Card>


            <Card bodyClass="flex gap-2 p-2" className="rounded-md border border-yellow-200">
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-yellow-100 text-yellow-500">
                <span className="text-xl">C</span>
              </div>
              <div>
                <h6 className="text-yellow-500">34</h6>
                <span className="font-semibold text-xs">Grade C</span>
              </div>
            </Card>
          </div>

          <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onImport={openImportModal} onClearFilters={onClearFilters} />
          <div className="mt-4 flex-grow overflow-auto w-full">
            <DataTable
              columns={columns} data={pageData} loading={tableLoading}
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectable checkboxChecked={(row: RowDataItem) => selectedItems.some((selected) => selected.id === row.id)}
              onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
              onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect}
              noData={!tableLoading && pageData.length === 0}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <RowDataSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting && selectedItems.length > 0} />

      <Drawer title={editingItem ? "Edit Raw Data" : "Add New Raw Data"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={940}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
            <Button size="sm" variant="solid" form="rowDataForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (editingItem ? "Saving..." : "Adding...") : "Save"}</Button>
          </div>
        }
      >
        <Form id="rowDataForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-4 relative pb-28">
          {renderDrawerForm()}
          {editingItem && (
            <div className="absolute bottom-[4%] w-full left-1/2 transform -translate-x-1/2">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                <div>
                  <b className="mt-3 mb-3 font-semibold text-primary">Latest Update By:</b><br />
                  <p className="text-sm font-semibold">{editingItem.updated_by_name || "N/A"}</p>
                  <p>{editingItem.updated_by_role || "N/A"}</p>
                </div>
                <div>
                  <br />
                  <span className="font-semibold">Created At:</span>{" "}
                  <span>{editingItem.created_at ? new Date(editingItem.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}</span>
                  <br />
                  <span className="font-semibold">Updated At:</span>{" "}
                  <span>{editingItem.updated_at ? new Date(editingItem.updated_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </Form>
      </Drawer>

      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={700}>
        <h5 className="mb-4 text-lg font-semibold">Raw Data Details - {viewingItem?.name || viewingItem?.mobile_no}</h5>
        {viewingItem && (
          <div className="space-y-3 text-sm">
            {(Object.keys(viewingItem) as Array<keyof RowDataItem>).filter(key => key !== 'country' && key !== 'category' && key !== 'brand').map((key) => {
              let label = key.replace(/_id$/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              let value: any = viewingItem[key as keyof RowDataItem];
              if (key === 'country_id') value = countryOptions.find(c => c.value === String(value))?.label || String(value);
              else if (key === 'category_id') value = categoryOptions.find(c => c.value === String(value))?.label || String(value);
              else if (key === 'brand_id') value = brandOptions.find(b => b.value === String(value))?.label || String(value);
              else if (key === 'quality') value = QUALITY_LEVELS_UI.find(q => q.value === value)?.label || String(value);
              else if (key === 'status') value = STATUS_OPTIONS_UI.find(s => s.value === value)?.label || String(value);
              else if ((key === 'created_at' || key === 'updated_at') && value) value = new Date(value).toLocaleString();
              value = (value === null || value === undefined || value === "") ? <span className="text-gray-400">-</span> : String(value);
              return (<div key={key} className="flex py-1.5 border-b border-gray-200 dark:border-gray-700 last:border-b-0"><span className="font-medium w-1/3 text-gray-700 dark:text-gray-300">{label}:</span><span className="w-2/3 text-gray-900 dark:text-gray-100">{value}</span></div>);
            })}
          </div>
        )}
        <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div>
      </Dialog>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400}
        footer={<div className="text-right w-full flex justify-end gap-2"> <Button size="sm" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterRowDataForm" type="submit">Apply</Button> </div>} >
        <Form id="filterRowDataForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Country" options={countryOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Category"><Controller name="filterCategory" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Category" options={categoryOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Brand"><Controller name="filterBrand" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Brand" options={brandOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Status" options={STATUS_OPTIONS_UI} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Quality"><Controller name="filterQuality" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Quality" options={QUALITY_LEVELS_UI} value={field.value || []} onChange={val => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Raw Data" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} confirmButtonColor="red-600" onConfirm={onConfirmSingleDelete} loading={isDeleting && !!itemToDelete}>
        <p>Are you sure you want to delete entry for "<strong>{itemToDelete?.name || itemToDelete?.mobile_no}</strong>"? This cannot be undone.</p>
      </ConfirmDialog>

      <ConfirmDialog isOpen={blacklistConfirmOpen} type="warning" title="Blacklist Raw Data" onClose={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }} confirmText="Yes, Blacklist" cancelText="No, Cancel" onConfirm={onConfirmBlacklist} loading={isBlacklisting} onCancel={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }} onRequestClose={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }}>
        <p>Are you sure you want to blacklist entry for "<strong>{itemToBlacklist?.name || itemToBlacklist?.mobile_no}</strong>"? This will change status to 'Blacklist'.</p>
      </ConfirmDialog>

      {/* --- Export Reason Modal --- */}
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)}
        loading={isSubmittingExportReason}
        confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"}
        cancelText="Cancel"
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}
      >
        <Form
          id="exportRowDataReasonForm" // Unique ID
          onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
          >
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>

      <Dialog isOpen={isImportModalOpen} onClose={closeImportModal} onRequestClose={closeImportModal} width={600} title="Import Raw Data from CSV/Excel" contentClass="overflow-visible">
        <div className="py-4">
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-300">Select a CSV or Excel file to import raw data.</p>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Required headers (example): <code>country_id, category_id, brand_id, mobile_no, name, ...</code></p>
          <FormItem label="Upload File" className="mb-4">
            <Input type="file" name="file" accept=".csv, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} prefix={<TbFileSpreadsheet className="text-xl text-gray-400" />} />
            {selectedFile && (<div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Selected: <span className="font-semibold">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(2)} KB)</div>)}
          </FormItem>
          <div className="mt-3 mb-4">
            <a href="/sample-import-template.csv" download="sample-row-data-import-template.csv" className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"> <TbCloudDownload /> Download Sample CSV Template </a>
          </div>
          <div className="text-right w-full flex justify-end gap-2">
            <Button variant="plain" onClick={closeImportModal} disabled={isImporting}>Cancel</Button>
            <Button variant="solid" onClick={handleImportSubmit} loading={isImporting} disabled={!selectedFile || isImporting} icon={isImporting ? null : <TbCloudUpload />}>{isImporting ? 'Importing...' : 'Upload & Import'}</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default RowDataListing;