import React, {
  useState,
  useMemo,
  useCallback,
  Ref,
  useEffect,
  ChangeEvent,
} from "react";
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
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Tag,
  Dialog,
  Card,
  Dropdown,
  Checkbox,
} from "@/components/ui";

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
  TbSquares,
  TbColumns,
  TbX,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import classNames from "classnames";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getRowDataAction,
  addRowDataAction,
  editRowDataAction,
  deleteRowDataAction,
  deleteAllRowDataAction,
  getCountriesAction,
  getParentCategoriesAction,
  getBrandAction,
  importRowDataAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { Link } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";

// --- Define Types ---
export type CountryListItem = { id: string | number; name: string };
export type CategoryListItem = { id: string | number; name: string };
export type BrandListItem = { id: string | number; name: string };
export type SelectOption = { value: string; label: string };

export type RowDataItem = {
  is_member: any;
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
  country?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  brand?: { id: number; name: string } | null;
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Zod Schema for Add/Edit Form ---
const QUALITY_LEVELS_UI: SelectOption[] = [
  { value: "A", label: "Grade A (Reliable)" },
  { value: "B", label: "Grade B (Productive)" },
  { value: "C", label: "Grade C (Mentoring)" },
  { value: "D", label: "Grade D (Alignment )" },
];
const qualityUIValues = QUALITY_LEVELS_UI.map((q) => q.value) as [
  string,
  ...string[]
];

const STATUS_OPTIONS_UI: SelectOption[] = [
  { value: "Row", label: "Row" },
  { value: "Identified", label: "Identified" },
  { value: "Verified", label: "Verified" },
  { value: "Hold", label: "Hold" },
  { value: "Blacklist", label: "Blacklisted" },
];
const statusUIValues = STATUS_OPTIONS_UI.map((s) => s.value) as [
  string,
  ...string[]
];

const statusColors: Record<string, string> = {
  Row: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700",
  Identified:
    "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100 border border-blue-300 dark:border-blue-700",
  Verified:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700",
  Hold: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100 border border-amber-300 dark:border-amber-700",
  Blacklist: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border border-red-300 dark:border-red-700",
};

const rowDataFormSchema = z.object({
  country_id: z.string().min(1, "Country is required."),
  category_id: z.string().min(1, "Category is required."),
  brand_id: z.string().min(1, "Brand is required."),
  mobile_no: z
    .string()
    .min(1, "Mobile No. is required.")
    .max(20, "Mobile No. too long."),
  email: z.string().email("Invalid email format.").optional().or(z.literal("")),
  name: z.string().min(1, "Name is required.").max(100, "Name too long."),
  company_name: z.string().max(150).optional().or(z.literal("")),
  quality: z.enum(qualityUIValues, {
    errorMap: () => ({ message: "Quality is required." }),
  }),
  city: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(statusUIValues, {
    errorMap: () => ({ message: "Status is required." }),
  }),
  remarks: z
    .string()
    .max(500, "Remarks too long.")
    .optional()
    .or(z.literal("")),
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
type FilterFormData = z.infer<typeof filterFormSchema> & {
  specialFilter?: 'today' | 'duplicate';
};

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Exporter ---
type RowDataExportItem = Omit<RowDataItem, "created_at" | "updated_at" | "country" | "category" | "brand"> & {
  countryNameDisplay?: string;
  categoryNameDisplay?: string;
  brandNameDisplay?: string;
  statusDisplay?: string;
  qualityDisplay?: string;
  created_at_formatted?: string;
  updated_at_formatted?: string;
};

const CSV_HEADERS_ROW_DATA = ["ID", "Country", "Category", "Brand", "Name", "Mobile No", "Email", "Company Name", "City", "Status", "Quality", "Remarks", "Created At", "Updated By", "Updated Role", "Updated At"];
const CSV_KEYS_ROW_DATA_EXPORT: (keyof RowDataExportItem)[] = ["id", "countryNameDisplay", "categoryNameDisplay", "brandNameDisplay", "name", "mobile_no", "email", "company_name", "city", "statusDisplay", "qualityDisplay", "remarks", "created_at_formatted", "updated_by_name", "updated_by_role", "updated_at_formatted"];

function exportRowDataToCsvLogic(filename: string, rows: RowDataItem[], countryOptions: SelectOption[], categoryOptions: SelectOption[], brandOptions: SelectOption[]) {
  if (!rows || !rows.length) { return false; }
  const preparedRows: RowDataExportItem[] = rows.map((row) => ({
    ...row, email: row.email || "N/A", company_name: row.company_name || "N/A", city: row.city || "N/A", remarks: row.remarks || "N/A", updated_by_name: row.updated_by_name || "N/A", updated_by_role: row.updated_by_role || "N/A",
    countryNameDisplay: countryOptions.find((c) => c.value === String(row.country_id))?.label || String(row.country_id),
    categoryNameDisplay: categoryOptions.find((c) => c.value === String(row.category_id))?.label || String(row.category_id),
    brandNameDisplay: brandOptions.find((b) => b.value === String(row.brand_id))?.label || String(row.brand_id),
    statusDisplay: STATUS_OPTIONS_UI.find((s) => s.value === row.status)?.label || row.status,
    qualityDisplay: QUALITY_LEVELS_UI.find((q) => q.value === row.quality)?.label || row.quality,
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
  return (<div className="flex items-center justify-center gap-1">
    <Tooltip title="Edit">
      <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil />
      </div></Tooltip>
    <Tooltip title="View Details"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={onViewDetail}><TbEye /></div></Tooltip>

    <Dropdown renderTitle={
      <BsThreeDotsVertical className="ml-0.5 mr-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" />}>
      <Dropdown.Item className="flex items-center gap-2" onClick={onDelete}>
        <TbTrash size={18} /><span className="text-xs">Delete</span></Dropdown.Item>
      {!item.is_member && <Dropdown.Item className="flex items-center gap-2"><TbUserShare size={18} /><Link to={`/system-tools/member-create`} state={{ rowData: item }}><span className="text-xs">Convert to Member</span></Link></Dropdown.Item>}
      {item.status !== "Blacklist" && (<Dropdown.Item className="flex items-center gap-2" onClick={onBlacklist}><TbCancel size={18} /> <span className="text-xs">Add As Blacklist</span></Dropdown.Item>)}</Dropdown></div>);
};

type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(({ onInputChange }, ref) => (<DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
ItemSearch.displayName = "ItemSearch";

const ItemTableTools = ({ onSearchChange, onFilter, onExport, onImport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onImport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<RowDataItem>[];
  filteredColumns: ColumnDef<RowDataItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<RowDataItem>[]>>;
  activeFilterCount: number;
}) => {
  const isColumnVisible = (colId: string) => filteredColumns.some(c => (c.id || c.accessorKey) === colId);
  const toggleColumn = (checked: boolean, colId: string) => {
    if (checked) {
      const originalColumn = columns.find(c => (c.id || c.accessorKey) === colId);
      if (originalColumn) {
        setFilteredColumns(prev => {
          const newCols = [...prev, originalColumn];
          newCols.sort((a, b) => {
            const indexA = columns.findIndex(c => (c.id || c.accessorKey) === (a.id || a.accessorKey));
            const indexB = columns.findIndex(c => (c.id || c.accessorKey) === (b.id || b.accessorKey));
            return indexA - indexB;
          });
          return newCols;
        });
      }
    } else {
      setFilteredColumns(prev => prev.filter(c => (c.id || c.accessorKey) !== colId));
    }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <ItemSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
          <div className="flex flex-col p-2">
            <div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
            {columns.map((col) => {
              const id = col.id || col.accessorKey as string;
              return col.header && (
                <div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2">
                  <Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>
                    {col.header as string}
                  </Checkbox>
                </div>
              );
            })}
          </div>
        </Dropdown>
        <Button title="Clear Filters" icon={<TbReload />} onClick={onClearFilters} />
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">
          Filter {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}
        </Button>
        <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
        <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
      </div>
    </div>
  );
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData;
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
  const { filterCountry, filterCategory, filterBrand, filterStatus, filterQuality, specialFilter } = filterData;
  const hasFilters = [filterCountry, filterCategory, filterBrand, filterStatus, filterQuality].some(f => f && f.length > 0) || !!specialFilter;
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {specialFilter === 'today' && <Tag prefix>Filter: Added Today <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('specialFilter', 'today')} /></Tag>}
      {specialFilter === 'duplicate' && <Tag prefix>Filter: Duplicates <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('specialFilter', 'duplicate')} /></Tag>}
      {filterCountry?.map(item => <Tag key={`country-${item.value}`} prefix>Country: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterCountry', item.value)} /></Tag>)}
      {filterCategory?.map(item => <Tag key={`cat-${item.value}`} prefix>Category: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterCategory', item.value)} /></Tag>)}
      {filterBrand?.map(item => <Tag key={`brand-${item.value}`} prefix>Brand: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterBrand', item.value)} /></Tag>)}
      {filterStatus?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatus', item.value)} /></Tag>)}
      {filterQuality?.map(item => <Tag key={`quality-${item.value}`} prefix>Quality: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterQuality', item.value)} /></Tag>)}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};


type RowDataSelectedFooterProps = { selectedItems: RowDataItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const RowDataSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: RowDataSelectedFooterProps) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };
  if (selectedItems.length === 0) return null;
  return (<><StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"><div className="flex items-center justify-between w-full px-4 sm:px-8"><span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Item{selectedItems.length > 1 ? "s" : ""} selected</span></span></span><div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}>Delete Selected</Button></div></div></StickyFooter><ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Item${selectedItems.length > 1 ? "s" : ""}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} loading={isDeleting}><p>Are you sure you want to delete the selected row data item{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p></ConfirmDialog></>);
};

const RowDataListing = () => {
  const dispatch = useAppDispatch();
  const { rowData = [], CountriesData = [], ParentCategories = [], BrandData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector, shallowEqual);
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
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString("en-US", { month: "short" })} ${date.getFullYear()}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  };

  useEffect(() => { dispatch(getRowDataAction()); dispatch(getCountriesAction()); dispatch(getParentCategoriesAction()); dispatch(getBrandAction()); }, [dispatch]);

  useEffect(() => { setCountryOptions(Array.isArray(CountriesData) ? CountriesData.map((c: CountryListItem) => ({ value: String(c.id), label: c.name })) : []) }, [CountriesData]);
  useEffect(() => { setCategoryOptions(Array.isArray(ParentCategories) ? ParentCategories.map((c: CategoryListItem) => ({ value: String(c.id), label: c.name })) : []) }, [ParentCategories]);
  useEffect(() => { setBrandOptions(Array.isArray(BrandData) ? BrandData.map((b: BrandListItem) => ({ value: String(b.id), label: b.name })) : []) }, [BrandData]);

  const defaultFormValues: RowDataFormData = useMemo(() => ({ country_id: countryOptions[0]?.value || "", category_id: categoryOptions[0]?.value || "", brand_id: brandOptions[0]?.value || "", mobile_no: "", email: "", name: "", company_name: "", quality: QUALITY_LEVELS_UI[0]?.value || "A", city: "", status: STATUS_OPTIONS_UI.find((s) => s.value === "Row")?.value || "Row", remarks: "", }), [countryOptions, categoryOptions, brandOptions]);

  const formMethods = useForm<RowDataFormData>({ resolver: zodResolver(rowDataFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

  const openAddDrawer = useCallback(() => { formMethods.reset(defaultFormValues); setEditingItem(null); setIsAddDrawerOpen(true); }, [formMethods, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback((item: RowDataItem) => { setEditingItem(item); formMethods.reset({ country_id: String(item.country_id), category_id: String(item.category_id), brand_id: String(item.brand_id), mobile_no: item.mobile_no, email: item.email || "", name: item.name, company_name: item.company_name || "", quality: item.quality || "", city: item.city || "", status: item.status || "", remarks: item.remarks || "", }); setIsEditDrawerOpen(true); }, [formMethods]);
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);
  const openViewDialog = useCallback((item: RowDataItem) => setViewingItem(item), []);
  const closeViewDialog = useCallback(() => setViewingItem(null), []);

  const onSubmitHandler = async (data: RowDataFormData) => { setIsSubmitting(true); const apiPayload = { ...data, email: data.email === "" ? null : data.email, company_name: data.company_name === "" ? null : data.company_name, city: data.city === "" ? null : data.city, remarks: data.remarks === "" ? null : data.remarks, }; try { if (editingItem) { await dispatch(editRowDataAction({ id: editingItem.id, ...apiPayload })).unwrap(); toast.push(<Notification title="Raw Data Updated" type="success" duration={2000} />); closeEditDrawer(); dispatch(getRowDataAction()); } else { await dispatch(addRowDataAction(apiPayload)).unwrap(); toast.push(<Notification title="Raw Data Added" type="success" duration={2000} />); closeAddDrawer(); dispatch(getRowDataAction()); } dispatch(getRowDataAction()); } catch (e: any) { toast.push(<Notification title={(editingItem ? "Update" : "Add") + " Failed"} type="danger" duration={3000}>{(e as Error).message || "An error occurred."}</Notification>); } finally { setIsSubmitting(false); } };
  const handleDeleteClick = useCallback((item: RowDataItem) => { if (!item.id) return; setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete?.id) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deleteRowDataAction({ id: String(itemToDelete.id) })).unwrap(); toast.push(<Notification title="Raw Data Deleted" type="success" duration={2000}>{`Entry "${itemToDelete.name || itemToDelete.mobile_no}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id)); dispatch(getRowDataAction()); } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{(e as Error).message || "Could not delete item."}</Notification>); } finally { setIsDeleting(false); setItemToDelete(null); } }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const validItems = selectedItems.filter((item) => item.id); if (validItems.length === 0) { setIsDeleting(false); return; } const idsToDelete = validItems.map((item) => String(item.id)); try { await dispatch(deleteAllRowDataAction({ ids: idsToDelete.join(",") })).unwrap(); toast.push(<Notification title="Raw Data Deleted" type="success" duration={2000}>{`${validItems.length} item(s) deleted.`}</Notification>); setSelectedItems([]); dispatch(getRowDataAction()); } catch (e: any) { toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{(e as Error).message || "Failed to delete selected items."}</Notification>); } finally { setIsDeleting(false); } }, [dispatch, selectedItems]);
  const handleBlacklistClick = useCallback((item: RowDataItem) => { setItemToBlacklist(item); setBlacklistConfirmOpen(true); }, []);
  const onConfirmBlacklist = async () => { if (!itemToBlacklist) return; setIsBlacklisting(true); setBlacklistConfirmOpen(false); const payload: any = { ...itemToBlacklist, status: "Blacklist", country_id: String(itemToBlacklist.country_id), category_id: String(itemToBlacklist.category_id), brand_id: String(itemToBlacklist.brand_id), }; delete payload.country; delete payload.category; delete payload.brand; try { await dispatch(editRowDataAction(payload)).unwrap(); toast.push(<Notification title="Raw Data Blacklisted" type="warning" duration={2000}>{`Entry "${itemToBlacklist.name || itemToBlacklist.mobile_no}" blacklisted.`}</Notification>); dispatch(getRowDataAction()); } catch (e: any) { toast.push(<Notification title="Blacklist Failed" type="danger" duration={3000}>{(e as Error).message}</Notification>); } finally { setIsBlacklisting(false); setItemToBlacklist(null); } };
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const onClearFilters = useCallback(() => {
    const defaultFilters = {};
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" }));
    setIsFilterDrawerOpen(false);
  }, [filterFormMethods]);

  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    setFilterCriteria(prev => ({ ...data, specialFilter: prev.specialFilter })); // Keep special filter if it exists
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    closeFilterDrawer();
  }, [closeFilterDrawer]);

  const handleCardClick = (value?: 'all' | 'today' | 'duplicate' | string) => {
    onClearFilters(); // Clear all existing filters first
    if (value && value !== 'all') {
      if (value === 'today' || value === 'duplicate') {
        setFilterCriteria({ specialFilter: value });
        return;
      }
      const qualityOption = QUALITY_LEVELS_UI.find(opt => opt.value === value);
      if (qualityOption) {
        setFilterCriteria({ filterQuality: [qualityOption] });
        return;
      }
      const statusOption = STATUS_OPTIONS_UI.find(opt => opt.value === value);
      if (statusOption) {
        setFilterCriteria({ filterStatus: [statusOption] });
      }
    }
  };

  const handleRemoveFilter = (key: keyof FilterFormData, value: string) => {
    setFilterCriteria(prev => {
      const newFilters = { ...prev };
      if (key === 'specialFilter') {
        delete newFilters.specialFilter;
      } else {
        const currentValues = prev[key as keyof z.infer<typeof filterFormSchema>] as { value: string; label: string }[] | undefined;
        if (currentValues) {
          const newValues = currentValues.filter(item => item.value !== value);
          (newFilters as any)[key] = newValues.length > 0 ? newValues : undefined;
        }
      }
      return newFilters;
    });
    setTableData(prev => ({ ...prev, pageIndex: 1 }));
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: RowDataItem[] = Array.isArray(rowData?.data) ? rowData?.data : [];
    let processedData: RowDataItem[] = cloneDeep(sourceData);

    // Special filters
    if (filterCriteria.specialFilter === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      processedData = processedData.filter(item => item.created_at && item.created_at.startsWith(todayStr));
    } else if (filterCriteria.specialFilter === 'duplicate') {
      const mobileCounts = sourceData.reduce((acc, item) => {
        if (item.mobile_no) {
          acc[item.mobile_no] = (acc[item.mobile_no] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      const duplicateMobiles = new Set(Object.keys(mobileCounts).filter(mobile => mobileCounts[mobile] > 1));
      processedData = processedData.filter(item => item.mobile_no && duplicateMobiles.has(item.mobile_no));
    }

    if (filterCriteria.filterCountry?.length) processedData = processedData.filter((item) => filterCriteria.filterCountry!.some((fc) => fc.value === String(item.country_id)));
    if (filterCriteria.filterCategory?.length) processedData = processedData.filter((item) => filterCriteria.filterCategory!.some((fc) => fc.value === String(item.category_id)));
    if (filterCriteria.filterBrand?.length) processedData = processedData.filter((item) => filterCriteria.filterBrand!.some((fb) => fb.value === String(item.brand_id)));
    if (filterCriteria.filterStatus?.length) processedData = processedData.filter((item) => filterCriteria.filterStatus!.some((fs) => fs.value === item.status));
    if (filterCriteria.filterQuality?.length) processedData = processedData.filter((item) => filterCriteria.filterQuality!.some((fq) => fq.value === item.quality));

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) => String(item.id).toLowerCase().includes(query) || item.mobile_no.toLowerCase().includes(query) || (item.email && item.email.toLowerCase().includes(query)) || item.name.toLowerCase().includes(query) || (item.company_name && item.company_name.toLowerCase().includes(query)) || (item.city && item.city.toLowerCase().includes(query)) || (item.country?.name?.toLowerCase() || String(item.country_id)).includes(query) || (item.category?.name?.toLowerCase() || String(item.category_id)).includes(query) || (item.brand?.name?.toLowerCase() || String(item.brand_id)).includes(query) || (item.updated_by_name?.toLowerCase() ?? "").includes(query));
    }
    const { order, key } = tableData.sort as OnSortParam;
    const validSortKeys: (keyof RowDataItem | "countryName" | "categoryName" | "brandName")[] = ["id", "name", "mobile_no", "email", "status", "quality", "created_at", "updated_at", "country_id", "category_id", "brand_id", "updated_by_name"];
    if (order && key && validSortKeys.includes(String(key) as any)) {
      processedData.sort((a, b) => {
        let aVal: any, bVal: any;
        if (key === "created_at" || key === "updated_at") { const dateA = a[key as "created_at" | "updated_at"] ? new Date(a[key as "created_at" | "updated_at"]!).getTime() : 0; const dateB = b[key as "created_at" | "updated_at"] ? new Date(b[key as "created_at" | "updated_at"]!).getTime() : 0; return order === "asc" ? dateA - dateB : dateB - dateA; }
        else if (key === "country_id") { aVal = a.country?.name; bVal = b.country?.name; }
        else if (key === "category_id") { aVal = a.category?.name; bVal = b.category?.name; }
        else if (key === "brand_id") { aVal = a.brand?.name; bVal = b.brand?.name; }
        else { aVal = a[key as keyof RowDataItem] ?? ""; bVal = b[key as keyof RowDataItem] ?? ""; }
        if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc" ? String(aVal ?? "").localeCompare(String(bVal ?? "")) : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }
    const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [rowData?.data, tableData, filterCriteria]);

  const activeFilterCount = useMemo(() => {
    const normalFilterCount = Object.values(filterCriteria)
      .filter(value => Array.isArray(value) && value.length > 0)
      .length;
    const specialFilterCount = filterCriteria.specialFilter ? 1 : 0;
    return normalFilterCount + specialFilterCount;
  }, [filterCriteria]);

  const handleOpenExportReasonModal = () => { if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return; } exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true); };
  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => { setIsSubmittingExportReason(true); const moduleName = "Raw Data Management"; const date = new Date().toISOString().split("T")[0]; const fileName = `raw-data_${date}.csv`; try { await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap(); toast.push(<Notification title="Export Reason Submitted" type="success" />); exportRowDataToCsvLogic(fileName, allFilteredAndSortedData, countryOptions, categoryOptions, brandOptions); toast.push(<Notification title="Data Exported" type="success">Row data exported.</Notification>); setIsExportReasonModalOpen(false); } catch (error: any) { toast.push(<Notification title="Operation Failed" type="danger" message={error.message || "Could not complete export."} />); } finally { setIsSubmittingExportReason(false); } };
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: RowDataItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<RowDataItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => r.id && !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id).filter((id) => id !== undefined)); setSelectedItems((pS) => pS.filter((i) => i.id && !cPRIds.has(i.id))); } }, []);

  const mobileNoCount: Record<string, number> = {};
  pageData.forEach((item) => { if (item.mobile_no) { mobileNoCount[item.mobile_no] = (mobileNoCount[item.mobile_no] || 0) + 1; } });

  const columns: ColumnDef<RowDataItem>[] = useMemo(() => [
    { header: "Name", accessorKey: "name", enableSorting: true, size: 160, cell: (props) => { const mobileNo = props.row.original.mobile_no; const isDuplicate = mobileNo && mobileNoCount[mobileNo] > 1; return (<><span className="text-xs font-semibold">ROW-{props.row.original.id.toString().padStart(7, '0')} <br/> {props.row.original.name}</span><br/><div className="text-xs">{props.row.original.mobile_no}{isDuplicate && (<Tag className="bg-red-200 text-red-600 text-xs w-fit px-2 py-0.5 rounded-md border border-red-300 dark:border-red-700">Duplicate</Tag>)}</div></>) }, },
    { header: "Country", accessorKey: "country_id", enableSorting: true, size: 160, cell: (props) => props.row.original.country?.name || String(props.getValue()), },
    { header: "Category", accessorKey: "category_id", enableSorting: true, size: 170, cell: (props) => props.row.original.category?.name || String(props.getValue()), },
    { header: "Brand", accessorKey: "brand_id", enableSorting: true, size: 160, cell: (props) => props.row.original.brand?.name || String(props.getValue()), },
    { header: "Quality", accessorKey: "quality", enableSorting: true, size: 100, cell: (props) => { const qVal = props.getValue<string>(); const qOpt = QUALITY_LEVELS_UI.find((q) => q.value === qVal); return (<Tag className={classNames("capitalize", qVal === "A" && "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-100 border border-green-300 dark:border-green-700", qVal === "B" && "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-100 border border-orange-300 dark:border-orange-700", qVal === "C" && "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700" , qVal === "D" && "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-b border-red-300 dark:border-red-700")}>Grade: {qOpt?.label.split(" ")[1] || qVal}</Tag>); }, },
    { header: "Status", accessorKey: "status", enableSorting: true, size: 110, cell: (props) => { const sVal = props.getValue<string>(); const sOpt = STATUS_OPTIONS_UI.find((s) => s.value === sVal); return (<Tag className={classNames("capitalize", statusColors[sVal])}>{sOpt?.label || sVal}</Tag>); }, },
    { header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 170, cell: (props) => { const { updated_at, name, roles } = props.row.original.updated_by_user; return (<div className="text-xs"><span>{name || "N/A"}{roles && (<><br /><b>{roles[0]?.display_name}</b></>)}</span><br /><span>{formatDate(updated_at)}</span></div>); }, },
    { header: "Actions", id: "action", size: 130, meta: { HeaderClass: "text-center", cellClass: "text-center" }, cell: (props) => (<ActionColumn item={props.row.original} onEdit={() => openEditDrawer(props.row.original)} onViewDetail={() => openViewDialog(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} onBlacklist={() => handleBlacklistClick(props.row.original)} />), },
  ], [openEditDrawer, openViewDialog, handleDeleteClick, handleBlacklistClick, countryOptions, categoryOptions, brandOptions, mobileNoCount, formatDate]);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<RowDataItem>[]>(columns);

  const renderDrawerForm = () => (<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-2"><FormItem label={<div>Contact Name<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}><Controller name="name" control={formMethods.control} render={({ field }) => (<Input {...field} prefix={<TbUser />} placeholder="Contact Name / Lead Name" />)} /></FormItem><FormItem label={<div>Company Name<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.company_name} errorMessage={formMethods.formState.errors.company_name?.message}><Controller name="company_name" control={formMethods.control} render={({ field }) => (<Input {...field} prefix={<TbBuilding />} placeholder="ABC Corp" />)} /></FormItem><FormItem label="Country" invalid={!!formMethods.formState.errors.country_id} errorMessage={formMethods.formState.errors.country_id?.message}><Controller name="country_id" control={formMethods.control} render={({ field }) => (<Select placeholder="Select country" options={countryOptions} value={countryOptions.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbWorld />} />)} /></FormItem><FormItem label="Category" invalid={!!formMethods.formState.errors.category_id} errorMessage={formMethods.formState.errors.category_id?.message}><Controller name="category_id" control={formMethods.control} render={({ field }) => (<Select placeholder="Select category" options={categoryOptions} value={categoryOptions.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbCategory2 />} />)} /></FormItem><FormItem label="Brand" invalid={!!formMethods.formState.errors.brand_id} errorMessage={formMethods.formState.errors.brand_id?.message}><Controller name="brand_id" control={formMethods.control} render={({ field }) => (<Select placeholder="Select brand" options={brandOptions} value={brandOptions.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbBuildingArch />} />)} /></FormItem><FormItem label={<div>Mobile No.<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.mobile_no} errorMessage={formMethods.formState.errors.mobile_no?.message}><Controller name="mobile_no" control={formMethods.control} render={({ field }) => (<Input {...field} prefix={<TbPhone />} placeholder="+XX-XXXXXXXXXX" />)} /></FormItem><FormItem label="Email" invalid={!!formMethods.formState.errors.email} errorMessage={formMethods.formState.errors.email?.message}><Controller name="email" control={formMethods.control} render={({ field }) => (<Input {...field} type="email" prefix={<TbMail />} placeholder="name@example.com" />)} /></FormItem><FormItem label="Quality" invalid={!!formMethods.formState.errors.quality} errorMessage={formMethods.formState.errors.quality?.message}><Controller name="quality" control={formMethods.control} render={({ field }) => (<Select placeholder="Select quality" options={QUALITY_LEVELS_UI} value={QUALITY_LEVELS_UI.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} /></FormItem><FormItem label="City" invalid={!!formMethods.formState.errors.city} errorMessage={formMethods.formState.errors.city?.message}><Controller name="city" control={formMethods.control} render={({ field }) => (<Input {...field} prefix={<TbMapPin />} placeholder="City Name" />)} /></FormItem><FormItem label="Status" invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message}><Controller name="status" control={formMethods.control} render={({ field }) => (<Select placeholder="Select status" options={editingItem?.status === "Blacklist" ? STATUS_OPTIONS_UI : STATUS_OPTIONS_UI.filter((s) => s.value !== "Blacklist")} value={STATUS_OPTIONS_UI.find((o) => o.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} disabled={editingItem?.status === "Blacklist"} />)} /></FormItem><FormItem label="Remarks" className="md:col-span-2 lg:col-span-2" invalid={!!formMethods.formState.errors.remarks} errorMessage={formMethods.formState.errors.remarks?.message}><Controller name="remarks" control={formMethods.control} render={({ field }) => (<Input textArea {...field} rows={3} placeholder="Add any relevant notes or comments..." />)} /></FormItem></div>);

  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => { setIsImportModalOpen(false); setSelectedFile(null); };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/csv" || file.name.endsWith(".csv") || file.type === "application/vnd.ms-excel" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
        setSelectedFile(file);
      } else {
        toast.push(<Notification title="Invalid File Type" type="danger" duration={3000}>Please upload a CSV or Excel file.</Notification>);
        setSelectedFile(null);
        if (e.target) e.target.value = "";
      }
    } else {
      setSelectedFile(null);
    }
  };
  const handleImportSubmit = async () => {
    if (!selectedFile) { toast.push(<Notification title="No File Selected" type="warning" duration={2000}>Please select a file to import.</Notification>); return; }
    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      await dispatch(importRowDataAction(formData)).unwrap();
      toast.push(<Notification title="Import Initiated" type="success" duration={2000}>File uploaded. Processing will continue.</Notification>);
      dispatch(getRowDataAction());
      closeImportModal();
    } catch (apiError: any) {
      toast.push(<Notification title="Import Failed" type="danger" duration={3000}>{apiError.message || "Failed to import data."}</Notification>);
    } finally {
      setIsImporting(false);
    }
  };

  const tableLoading = masterLoadingStatus === "loading" || isSubmitting || isDeleting || isBlacklisting || isImporting;
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Raw Data Management</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>Add New</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 mb-4 gap-2">
            <Tooltip title="Click to show all data"><div onClick={() => handleCardClick('all')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbDatabase size={24} /></div><div><h6 className="text-blue-500">{rowData?.counts?.total ?? "..."}</h6><span className="font-semibold text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by data added today"><div onClick={() => handleCardClick('today')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbCalendarWeek size={24} /></div><div><h6 className="text-violet-500">{rowData?.counts?.today ?? "..."}</h6><span className="font-semibold text-xs">Today</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by duplicate mobile numbers"><div onClick={() => handleCardClick('duplicate')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-pink-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbSquares size={24} /></div><div><h6 className="text-pink-500">{rowData?.counts?.duplicate ?? "..."}</h6><span className="font-semibold text-xs">Duplicate</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by Grade A"><div onClick={() => handleCardClick('A')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-300")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><span className="text-xl font-bold">A</span></div><div><h6 className="text-green-500">{rowData?.counts?.grade_a ?? "..."}</h6><span className="font-semibold text-xs">Grade A</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by Grade B"><div onClick={() => handleCardClick('B')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-orange-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><span className="text-xl font-bold">B</span></div><div><h6 className="text-orange-500">{rowData?.counts?.grade_b ?? "..."}</h6><span className="font-semibold text-xs">Grade B</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by Grade C"><div onClick={() => handleCardClick('C')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-yellow-200")}><div className="h-12 w-12 rounded-md flex items-center justify-center bg-yellow-100 text-yellow-500"><span className="text-xl font-bold">C</span></div><div><h6 className="text-yellow-500">{rowData?.counts?.grade_c ?? "..."}</h6><span className="font-semibold text-xs">Grade C</span></div></Card></div></Tooltip>
            <Tooltip title="Click to filter by Grade D">
              <div onClick={() => handleCardClick('D')}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}>
                    <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><span className="text-xl font-bold">D</span></div>
                      <div><h6 className="text-yellow-500">{rowData?.counts
                        ? rowData.counts.total - (
                            (rowData.counts.grade_a || 0) +
                            (rowData.counts.grade_b || 0) +
                            (rowData.counts.grade_c || 0)
                          )
                        : "..."}
                        </h6><span className="font-semibold text-xs">Grade D</span>
                      </div>
                  </Card>
                </div>
              </Tooltip>
          </div>
          <div className="mb-4">
            <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onImport={openImportModal} onClearFilters={onClearFilters} columns={columns} filteredColumns={filteredColumns} setFilteredColumns={setFilteredColumns} activeFilterCount={activeFilterCount} />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4 flex-grow overflow-auto w-full">
            <DataTable columns={filteredColumns} data={pageData} loading={tableLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectable checkboxChecked={(row: RowDataItem) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} noData={!tableLoading && pageData.length === 0} />
          </div>
        </AdaptiveCard>
      </Container>
      <RowDataSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting && selectedItems.length > 0} />
      <Drawer title={editingItem ? "Edit Raw Data" : "Add New Raw Data"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={520} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button><Button size="sm" variant="solid" form="rowDataForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? editingItem ? "Saving..." : "Adding..." : "Save"}</Button></div>}>
        <Form id="rowDataForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col gap-4 relative pb-28">{renderDrawerForm()}
          {editingItem && (<div className="absolute bottom-0 w-full"><div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3"><div><b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br /><p className="text-sm font-semibold">{editingItem.updated_by_user?.name || "N/A"}</p><p>{editingItem.updated_by_user?.roles?.[0].display_name || "N/A"}</p></div><div className="text-right"><br /><span className="font-semibold">Created At:</span> <span>{formatDate(editingItem.created_at)}</span><br /><span className="font-semibold">Updated At:</span> <span>{formatDate(editingItem.updated_at)}</span></div></div></div>)}
        </Form>
      </Drawer>
      <Dialog isOpen={!!viewingItem} onClose={closeViewDialog} onRequestClose={closeViewDialog} width={800}>
        <h5 className="mb-4 text-lg font-semibold">Raw Data Details - {viewingItem?.name || viewingItem?.mobile_no}</h5>
        {viewingItem && (<div className="space-y-2 text-sm max-h-[60vh] overflow-y-auto pr-1 border border-green-400 rounded-lg shadow-xl p-2 grid grid-cols-1 md:grid-cols-2" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e0 transparent" }}>
          {(Object.keys(viewingItem) as Array<keyof RowDataItem>).filter((key) => key !== "country" && key !== "category" && key !== "brand").map((key) => {
            let label = key.replace(/_id$/, "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
            let value: any = viewingItem[key as keyof RowDataItem];
            if (key === "country_id") value = countryOptions.find((c) => c.value === String(value))?.label || String(value);
            else if (key === "category_id") value = categoryOptions.find((c) => c.value === String(value))?.label || String(value);
            else if (key === "brand_id") value = brandOptions.find((b) => b.value === String(value))?.label || String(value);
            else if (key === "quality") value = QUALITY_LEVELS_UI.find((q) => q.value === value)?.label || String(value);
            else if (key === "status") value = STATUS_OPTIONS_UI.find((s) => s.value === value)?.label || String(value);
            else if ((key === "created_at" || key === "updated_at") && value) { value = formatDate(value); }
            else if (key === "created_by" || key === "updated_by" ){ return }
            else if( key === "created_by_user" ) value = value?.name
            else if( key === "updated_by_user" ) value = value?.name
            value = value === null || value === undefined || value === "" ? (<span className="text-gray-400">-</span>) : (String(value));
            return (<div key={key} className="flex py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0"><span className="font-medium w-1/3 text-gray-700 dark:text-gray-300">{label}:</span><span className="w-2/3 text-gray-900 dark:text-gray-100">{value}</span></div>);
          })}
        </div>)}
        <div className="text-right mt-6"><Button variant="solid" onClick={closeViewDialog}>Close</Button></div>
      </Dialog>
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400} footer={<div className="text-right w-full flex justify-end gap-2"><Button size="sm" onClick={onClearFilters} type="button">Clear</Button><Button size="sm" variant="solid" form="filterRowDataForm" type="submit">Apply</Button></div>}>
        <Form id="filterRowDataForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col">
          <FormItem label="Country"><Controller name="filterCountry" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Country" options={countryOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Category"><Controller name="filterCategory" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Category" options={categoryOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Brand"><Controller name="filterBrand" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Brand" options={brandOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatus" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Status" options={STATUS_OPTIONS_UI} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
          <FormItem label="Quality"><Controller name="filterQuality" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select Quality" options={QUALITY_LEVELS_UI} value={field.value || []} onChange={(val) => field.onChange(val || [])} />)} /></FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Raw Data" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} confirmButtonColor="red-600" onConfirm={onConfirmSingleDelete} loading={isDeleting && !!itemToDelete}><p>Are you sure you want to delete entry for "<strong>{itemToDelete?.name || itemToDelete?.mobile_no}</strong>"? This cannot be undone.</p></ConfirmDialog>
      <ConfirmDialog isOpen={blacklistConfirmOpen} type="warning" title="Blacklist Raw Data" onClose={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }} confirmText="Yes, Blacklist" cancelText="No, Cancel" onConfirm={onConfirmBlacklist} loading={isBlacklisting} onCancel={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }} onRequestClose={() => { setBlacklistConfirmOpen(false); setItemToBlacklist(null); }}><p>Are you sure you want to blacklist entry for "<strong>{itemToBlacklist?.name || itemToBlacklist?.mobile_no}</strong>"? This will change status to 'Blacklist'.</p></ConfirmDialog>
      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason, }}><Form id="exportRowDataReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2"><FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}><Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} /></FormItem></Form></ConfirmDialog>
      <Dialog isOpen={isImportModalOpen} onClose={closeImportModal} onRequestClose={closeImportModal} width={600} title="Import Raw Data from CSV/Excel" contentClass="overflow-visible"><div className="py-4"><p className="mb-1 text-sm text-gray-600 dark:text-gray-300">Select a CSV or Excel file to import raw data.</p><p className="mb-4 text-xs text-gray-500 dark:text-gray-400">Required headers (example):{" "}<code>country_id, category_id, brand_id, mobile_no, name, ...</code></p><FormItem label="Upload File" className="mb-4"><Input type="file" name="file" accept=".csv, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} prefix={<TbFileSpreadsheet className="text-xl text-gray-400" />} />{selectedFile && (<div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Selected:{" "}<span className="font-semibold">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(2)} KB)</div>)}</FormItem><div className="mt-3 mb-4"><a href="/sample-import-template.csv" download="sample-row-data-import-template.csv" className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1">{" "}<TbCloudDownload /> Download Sample CSV Template{" "}</a></div><div className="text-right w-full flex justify-end gap-2"><Button variant="plain" onClick={closeImportModal} disabled={isImporting}>Cancel</Button><Button variant="solid" onClick={handleImportSubmit} loading={isImporting} disabled={!selectedFile || isImporting} icon={isImporting ? null : <TbCloudUpload />}>{isImporting ? "Importing..." : "Upload & Import"}</Button></div></div></Dialog>
    </>
  );
};

export default RowDataListing;