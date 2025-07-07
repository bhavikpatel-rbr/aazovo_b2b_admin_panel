import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Avatar from "@/components/ui/Avatar";
import classNames from "classnames";

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
import {
  Drawer,
  Form,
  FormItem,
  Input,
  Card,
  Select as UiSelect,
  Tag,
  Dialog,
  Checkbox,
  Dropdown,
} from "@/components/ui";

// Icons
import {
  TbPencil,
  TbEye,
  TbInfoCircle,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbBuildingStore,
  TbBox,
  TbReload,
  TbBrandReact,
  TbCircleCheck,
  TbCancel,
  TbBrandRedux,
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
import { useAppDispatch } from "@/reduxtool/store";
import {
  getBrandAction,
  addBrandAction,
  editBrandAction,
  deleteBrandAction,
  deleteAllBrandsAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";

// --- Type Definitions ---
type ApiBrandItem = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  show_header: string | number;
  status: "Active" | "Inactive";
  meta_title: string | null;
  meta_descr: string | null;
  meta_keyword: string | null;
  created_at: string;
  updated_at: string;
  mobile_no: string | null;
  icon_full_path?: string;
};

export type BrandStatus = "Active" | "Inactive";
export type BrandItem = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  icon_full_path: string | null;
  showHeader: number;
  status: BrandStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeyword: string | null;
  createdAt: string;
  updatedAt: string;
  mobileNo: string | null;
};

// --- Zod Schemas ---
const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required.").max(255, "Name cannot exceed 255 chars."),
  slug: z.string().min(1, "Slug is required.").max(255, "Slug cannot exceed 255 chars."),
  mobile_no: z.string().optional().nullable(),
  icon: z.union([z.instanceof(File), z.null()]).optional().nullable(),
  show_header: z.enum(["0", "1"], { errorMap: () => ({ message: "Please select if shown in header." }) }).transform((val) => Number(val)),
  status: z.enum(["Active", "Inactive"], { errorMap: () => ({ message: "Please select a status." }) }),
  meta_title: z.string().max(255, "Meta title cannot exceed 255 chars.").optional().nullable(),
  meta_descr: z.string().max(500, "Meta description cannot exceed 500 chars.").optional().nullable(),
  meta_keyword: z.string().max(255, "Meta keywords cannot exceed 255 chars.").optional().nullable(),
});
type BrandFormData = z.infer<typeof brandFormSchema>;

const filterFormSchema = z.object({
  filterNames: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatuses: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Constants & Helper Functions ---
const CSV_HEADERS_BRAND = [ "ID", "Name", "Slug", "Icon URL", "Show Header (1=Yes, 0=No)", "Status", "Meta Title", "Meta Description", "Meta Keywords", "Mobile No.", "Created At", "Updated At", ];
type BrandCsvItem = { id: number; name: string; slug: string; icon_full_path: string | null; showHeader: number; status: BrandStatus; metaTitle: string | null; metaDescription: string | null; metaKeyword: string | null; mobileNo: string | null; createdAt: string; updatedAt: string; };

function exportToCsvBrand(filename: string, rows: BrandItem[]) {
  if (!rows || !rows.length) {
    toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
    return false;
  }
  const transformedRows: BrandCsvItem[] = rows.map((item) => ({ id: item.id, name: item.name, slug: item.slug, icon_full_path: item.icon_full_path, showHeader: item.showHeader, status: item.status, metaTitle: item.metaTitle, metaDescription: item.metaDescription, metaKeyword: item.metaKeyword, mobileNo: item.mobileNo, createdAt: new Date(item.createdAt).toLocaleString(), updatedAt: new Date(item.updatedAt).toLocaleString(), }));
  const csvKeys: (keyof BrandCsvItem)[] = [ "id", "name", "slug", "icon_full_path", "showHeader", "status", "metaTitle", "metaDescription", "metaKeyword", "mobileNo", "createdAt", "updatedAt", ];
  const separator = ",";
  const csvContent = CSV_HEADERS_BRAND.join(separator) + "\n" + transformedRows.map((row) => csvKeys.map((k) => { let cellValue = row[k]; if (cellValue === null || cellValue === undefined) cellValue = ""; else cellValue = String(cellValue).replace(/"/g, '""'); if (String(cellValue).search(/("|,|\n)/g) >= 0) cellValue = `"${cellValue}"`; return cellValue; }).join(separator) ).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
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
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

const BRAND_ICON_BASE_URL = import.meta.env.VITE_API_URL_STORAGE || "https://your-api-domain.com/storage/";
const statusColor: Record<BrandStatus, string> = {
  Active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};
const uiStatusOptions: { value: BrandStatus; label: string }[] = [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, ];
const apiStatusOptions: { value: "Active" | "Inactive"; label: string }[] = [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, ];
const showHeaderOptions: { value: "1" | "0"; label: string }[] = [ { value: "1", label: "Yes" }, { value: "0", label: "No" }, ];

// --- Helper Components ---
const ActionColumn = ({ onEdit, onViewDetail, onDelete, }: { onEdit: () => void; onViewDetail: () => void; onDelete: () => void; }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip title="Edit"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
      <Tooltip title="View"><div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`} role="button" onClick={onViewDetail}><TbEye /></div></Tooltip>
    </div>
  );
};

const BrandSearch = React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void; }>(({ onInputChange }, ref) => (
    <DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />
));
BrandSearch.displayName = "BrandSearch";

const BrandTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters, columns, filteredColumns, setFilteredColumns, activeFilterCount }: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<BrandItem>[];
  filteredColumns: ColumnDef<BrandItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<BrandItem>[]>>;
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
                <BrandSearch onInputChange={onSearchChange} />
            </div>
            <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
                <Dropdown renderTitle={<Button icon={<TbColumns />} />} placement="bottom-end">
                    <div className="flex flex-col p-2"><div className='font-semibold mb-1 border-b pb-1'>Toggle Columns</div>
                        {columns.map((col) => { const id = col.id || col.accessorKey as string; return col.header && (<div key={id} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md py-1.5 px-2"><Checkbox checked={isColumnVisible(id)} onChange={(checked) => toggleColumn(checked, id)}>{col.header as string}</Checkbox></div>) })}
                    </div>
                </Dropdown>
                <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload"></Button>
                <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter {activeFilterCount > 0 && (<span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">{activeFilterCount}</span>)}</Button>
                <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
            </div>
        </div>
    )
};

const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterFormData,
  onRemoveFilter: (key: keyof FilterFormData, value: string) => void;
  onClearAll: () => void;
}) => {
    const { filterNames, filterStatuses } = filterData;
    if (!filterNames?.length && !filterStatuses?.length) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
            {filterNames?.map(item => <Tag key={`name-${item.value}`} prefix>Name: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterNames', item.value)} /></Tag>)}
            {filterStatuses?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatuses', item.value)} /></Tag>)}
            <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
        </div>
    );
}

const BrandTable = (props: BrandTableProps) => ( <DataTable selectable {...props} /> );

const BrandSelectedFooter = ({ selectedItems, onDeleteSelected }: BrandSelectedFooterProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Brand{selectedItems.length > 1 ? "s" : ""} selected</span></span></span>
          <div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)}>Delete Selected</Button></div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} Brand${selectedItems.length > 1 ? "s" : ""}`} onClose={() => setDeleteOpen(false)} onRequestClose={() => setDeleteOpen(false)} onCancel={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }}><p>Are you sure you want to delete the selected brand{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p></ConfirmDialog>
    </>
  );
};

interface DialogDetailRowProps {
  label: string; value: string | React.ReactNode; isLink?: boolean;
  preWrap?: boolean; breakAll?: boolean; labelClassName?: string;
  valueClassName?: string; className?: string;
}
const DialogDetailRow: React.FC<DialogDetailRowProps> = ({ label, value, isLink, preWrap, breakAll, labelClassName = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider", valueClassName = "text-sm text-slate-700 dark:text-slate-100 mt-0.5", className = "", }) => (
  <div className={`py-1.5 ${className}`}>
    <p className={`${labelClassName}`}>{label}</p>
    {isLink ? (<a href={typeof value === 'string' && (value.startsWith('http') ? value : `/${value}`) || '#'} target="_blank" rel="noopener noreferrer" className={`${valueClassName} hover:underline text-blue-600 dark:text-blue-400 ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</a>) : (<div className={`${valueClassName} ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</div>)}
  </div>
);


// --- Main Component ---
const Brands = () => {
  const dispatch = useAppDispatch();
  const [isAddDrawerOpen, setAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<BrandItem | null>(null);
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [addFormPreviewUrl, setAddFormPreviewUrl] = useState<string | null>(null);
  const [editFormPreviewUrl, setEditFormPreviewUrl] = useState<string | null>(null);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);
  const [brandToView, setBrandToView] = useState<BrandItem | null>(null);
  const { BrandData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector);

  useEffect(() => { dispatch(getBrandAction()); }, [dispatch]);
  useEffect(() => { return () => { if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl); if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl); }; }, [addFormPreviewUrl, editFormPreviewUrl]);

  const defaultBrandFormValues: Omit<BrandFormData, "show_header"> & { show_header: "0" | "1"; icon: null; } = { name: "", slug: "", mobile_no: null, icon: null, show_header: "1", status: "Active", meta_title: null, meta_descr: null, meta_keyword: null, };
  const addFormMethods = useForm<BrandFormData>({ resolver: zodResolver(brandFormSchema), defaultValues: defaultBrandFormValues, mode: "onChange" });
  const editFormMethods = useForm<BrandFormData>({ resolver: zodResolver(brandFormSchema), defaultValues: defaultBrandFormValues, mode: "onChange" });
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria, });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

  const mappedBrands: BrandItem[] = useMemo(() => {
    if (!Array.isArray(BrandData)) return [];
    return BrandData.map((apiItem: ApiBrandItem): BrandItem => {
      let fullPath: string | null = null;
      if (apiItem.icon_full_path) fullPath = apiItem.icon_full_path;
      else if (apiItem.icon) {
        if (apiItem.icon.startsWith("http")) fullPath = apiItem.icon;
        else fullPath = `${BRAND_ICON_BASE_URL}${apiItem.icon.startsWith("/") ? apiItem.icon.substring(1) : apiItem.icon}`;
      }
      return { id: apiItem.id, name: apiItem.name, slug: apiItem.slug, icon: apiItem.icon, icon_full_path: fullPath, showHeader: Number(apiItem.show_header), status: apiItem.status === "Active" ? "Active" : "Inactive", metaTitle: apiItem.meta_title, metaDescription: apiItem.meta_descr, metaKeyword: apiItem.meta_keyword, createdAt: apiItem.created_at, updatedAt: apiItem.updated_at, mobileNo: apiItem.mobile_no, };
    });
  }, [BrandData]);

  const openAddDrawer = () => { addFormMethods.reset(defaultBrandFormValues); setAddFormPreviewUrl(null); setAddDrawerOpen(true); };
  const closeAddDrawer = () => { setAddDrawerOpen(false); if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl); setAddFormPreviewUrl(null); };

  const onAddBrandSubmit = async (data: BrandFormData) => {
    setSubmitting(true);
    const formData = new FormData();
    (Object.keys(data) as Array<keyof BrandFormData>).forEach((key) => { const value = data[key]; if (key === "icon") { if (value instanceof File) formData.append(key, value); } else if (value !== null && value !== undefined) { formData.append(key, String(value)); } });
    try {
      await dispatch(addBrandAction(formData)).unwrap();
      toast.push(<Notification title="Brand Added" type="success" duration={2000}>Brand "{data.name}" added.</Notification>);
      closeAddDrawer(); dispatch(getBrandAction());
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Could not add brand.";
      toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{errorMessage}</Notification>);
    } finally { setSubmitting(false); }
  };

  const openEditDrawer = (brand: BrandItem) => {
    setEditingBrand(brand);
    editFormMethods.reset({ name: brand.name, slug: brand.slug, mobile_no: brand.mobileNo || null, icon: null, show_header: String(brand.showHeader) as "0" | "1", status: brand.status === "Active" ? "Active" : "Inactive", meta_title: brand.metaTitle || null, meta_descr: brand.metaDescription || null, meta_keyword: brand.metaKeyword || null, });
    setEditFormPreviewUrl(null); setEditDrawerOpen(true);
  };
  const closeEditDrawer = () => { setEditDrawerOpen(false); setEditingBrand(null); if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl); setEditFormPreviewUrl(null); };

  const onEditBrandSubmit = async (data: BrandFormData) => {
    if (!editingBrand?.id) return;
    setSubmitting(true);
    const formData = new FormData(); formData.append("_method", "PUT");
    (Object.keys(data) as Array<keyof BrandFormData>).forEach((key) => { const value = data[key]; if (key === "icon") { if (value instanceof File) formData.append(key, value); } else { if (value === null) formData.append(key, ""); else if (value !== undefined) formData.append(key, String(value)); } });
    try {
      await dispatch(editBrandAction({ id: editingBrand.id, formData })).unwrap();
      toast.push(<Notification title="Brand Updated" type="success" duration={2000}>Brand "{data.name}" updated.</Notification>);
      closeEditDrawer(); dispatch(getBrandAction());
    } catch (error: any) {
      const responseData = error.response?.data; let errorMessage = "Could not update brand.";
      if (responseData) { if (responseData.message) errorMessage = responseData.message; if (responseData.errors) { const validationErrors = Object.values(responseData.errors).flat().join(" "); errorMessage += ` Details: ${validationErrors}`; } } else if (error.message) errorMessage = error.message;
      toast.push(<Notification title="Failed to Update" type="danger" duration={4000}>{errorMessage}</Notification>);
    } finally { setSubmitting(false); }
  };

  const handleDeleteClick = (brand: BrandItem) => { setBrandToDelete(brand); setSingleDeleteOpen(true); };
  const onConfirmSingleDelete = async () => {
    if (!brandToDelete) return;
    setIsProcessing(true);
    try {
      await dispatch(deleteBrandAction(brandToDelete.id)).unwrap();
      toast.push(<Notification title="Brand Deleted" type="success" duration={2000}>Brand "{brandToDelete.name}" deleted.</Notification>);
      setSelectedItems((prev) => prev.filter((item) => item.id !== brandToDelete!.id));
      dispatch(getBrandAction());
    } catch (error: any) {
      toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error.message || `Could not delete brand.`}</Notification>);
    } finally { setSingleDeleteOpen(false); setIsProcessing(false); setBrandToDelete(null); }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);
    const idsToDelete = selectedItems.map((item) => item.id);
    try {
      await dispatch(deleteAllBrandsAction({ ids: idsToDelete.join(",") })).unwrap();
      toast.push(<Notification title="Brands Deleted" type="success" duration={2000}>{selectedItems.length} brand(s) deleted.</Notification>);
      setSelectedItems([]); dispatch(getBrandAction());
    } catch (error: any) {
      toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || "Failed to delete selected brands."}</Notification>);
    } finally { setIsProcessing(false); }
  };

  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setFilterDrawerOpen(true); };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => { setFilterCriteria({ filterNames: data.filterNames || [], filterStatuses: data.filterStatuses || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); };
  
  const onClearFilters = () => {
    const defaultFilters = { filterNames: [], filterStatuses: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ query: "", pageIndex: 1 });
    dispatch(getBrandAction());
  };

  const handleCardClick = (status: BrandStatus | 'all') => {
      onClearFilters();
      if(status !== 'all') {
          const statusOption = uiStatusOptions.find(opt => opt.value === status);
          if(statusOption) {
            setFilterCriteria({ filterStatuses: [statusOption] });
          }
      }
  };

  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<BrandItem[]>([]);

  const brandNameOptions = useMemo(() => Array.isArray(mappedBrands) ? [...new Set(mappedBrands.map((brand) => brand.name))].sort((a, b) => a.localeCompare(b)).map((name) => ({ value: name, label: name })) : [], [mappedBrands]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: BrandItem[] = cloneDeep(mappedBrands);
    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) { const selectedNames = filterCriteria.filterNames.map((opt) => opt.value.toLowerCase()); processedData = processedData.filter((item) => selectedNames.includes(item.name.toLowerCase())); }
    if (filterCriteria.filterStatuses && filterCriteria.filterStatuses.length > 0) { const selectedStatuses = filterCriteria.filterStatuses.map((opt) => opt.value); processedData = processedData.filter((item) => selectedStatuses.includes(item.status)); }
    if (tableData.query && tableData.query.trim() !== "") { const query = tableData.query.toLowerCase().trim(); processedData = processedData.filter((item) => item.name?.toLowerCase().includes(query) || item.slug?.toLowerCase().includes(query) || String(item.id).toLowerCase().includes(query) || item.mobileNo?.toLowerCase().includes(query) || item.status.toLowerCase().includes(query)); }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) { const sortKey = key as keyof BrandItem; processedData.sort((a, b) => { let aValue = a[sortKey]; let bValue = b[sortKey]; if (sortKey === "createdAt" || sortKey === "updatedAt") { aValue = new Date(aValue as string).getTime(); bValue = new Date(bValue as string).getTime(); } else if (sortKey === "id" || sortKey === "showHeader") { aValue = Number(aValue); bValue = Number(bValue); } if (aValue === null || aValue === undefined) aValue = "" as any; if (bValue === null || bValue === undefined) bValue = "" as any; if (typeof aValue === "string" && typeof bValue === "string") return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue); else if (typeof aValue === "number" && typeof bValue === "number") return order === "asc" ? aValue - bValue : bValue - aValue; return 0; }); }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [mappedBrands, tableData, filterCriteria]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterNames?.length) count++;
    if (filterCriteria.filterStatuses?.length) count++;
    return count;
  }, [filterCriteria]);
  
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);

  const handleRemoveFilter = useCallback((key: keyof FilterFormData, value: string) => {
    setFilterCriteria(prev => {
        const newFilters = { ...prev };
        const currentValues = prev[key] as { value: string; label: string }[] | undefined;
        if (currentValues) {
            const newValues = currentValues.filter(item => item.value !== value);
            if (newValues.length > 0) {
                (newFilters as any)[key] = newValues;
            } else {
                delete newFilters[key];
            }
        }
        return newFilters;
    });
    handleSetTableData({ pageIndex: 1 });
  }, [handleSetTableData]);

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || allFilteredAndSortedData.length === 0) {
      toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return;
    }
    exportReasonFormMethods.reset({ reason: "" }); setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const fileName = `brands_export_${new Date().toISOString().split('T')[0]}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: "Brands", file_name: fileName })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      const exportSuccess = exportToCsvBrand(fileName, allFilteredAndSortedData);
      if (exportSuccess) setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Failed to Submit Reason" type="danger">{error.message || "Could not submit export reason."}</Notification>);
    } finally { setIsSubmittingExportReason(false); }
  };

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: BrandItem) => setSelectedItems((prev) => checked ? (prev.some((item) => item.id === row.id) ? prev : [...prev, row]) : prev.filter((item) => item.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<BrandItem>[]) => { const originals = currentRows.map((r) => r.original); if (checked) setSelectedItems((prev) => { const prevIds = new Set(prev.map((item) => item.id)); return [...prev, ...originals.filter((r) => !prevIds.has(r.id))]; }); else { const currentIds = new Set(originals.map((r) => r.id)); setSelectedItems((prev) => prev.filter((item) => !currentIds.has(item.id))); } }, []);

  const openImageViewer = (imageUrl: string | null) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
  const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };

  const openViewDetailModal = useCallback((brand: BrandItem) => { setBrandToView(brand); setIsViewDetailModalOpen(true); }, []);
  const closeViewDetailModal = useCallback(() => { setIsViewDetailModalOpen(false); setBrandToView(null); }, []);

  const columns: ColumnDef<BrandItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", size: 60, meta: { tdClass: "text-center", thClass: "text-center" }, cell: ({ getValue }) => getValue().toString().padStart(6, '0'), },
      { header: "Brand", accessorKey: "name", id: "name", enableSorting: true, cell: (props) => { const { icon_full_path, name } = props.row.original; return (<div className="flex items-center gap-2 min-w-[200px]"><Avatar size={30} shape="circle" src={icon_full_path || undefined} icon={<TbBox />} className="cursor-pointer hover:ring-2 hover:ring-indigo-500" onClick={() => icon_full_path && openImageViewer(icon_full_path)}>{!icon_full_path && name ? name.charAt(0).toUpperCase() : ""}</Avatar><span>{name}</span></div>); }, },
      { header: "Mobile No", accessorKey: "mobileNo", id: "mobileNo", enableSorting: true, cell: (props) => props.row.original.mobileNo ?? <span className="text-gray-400 dark:text-gray-500">-</span>, },
      { header: "Status", accessorKey: "status", id: "status", enableSorting: true, cell: (props) => { const status = props.row.original.status; return <Tag className={`${statusColor[status]} capitalize font-semibold border-0`}>{status}</Tag>; }, },
      { header: "Actions", id: "action", size: 120, meta: { HeaderClass: "text-center" }, cell: (props) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} onViewDetail={() => openViewDetailModal(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />) },
    ],
    []
  );
  
  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<BrandItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const tableLoading = masterLoadingStatus === "loading" || isSubmitting || isProcessing;
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex items-center gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h3 className="mb-4 sm:mb-0">Brands</h3>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} className="w-full sm:w-auto mt-2 sm:mt-0">Add Brand</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 mb-4 gap-4">
            <Tooltip title="Click to show all brands"><div onClick={() => handleCardClick('all')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}><div className="p-2 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100"><TbBrandRedux size={20} /></div><div><h6 className="text-sm">{(mappedBrands || []).length}</h6><span className="text-xs">Total</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show Active brands"><div onClick={() => handleCardClick('Active')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-emerald-200")}><div className="p-2 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100"><TbCircleCheck size={20} /></div><div><h6 className="text-sm">{(mappedBrands || []).filter(d => d.status === 'Active').length}</h6><span className="text-xs">Active</span></div></Card></div></Tooltip>
            <Tooltip title="Click to show Inactive brands"><div onClick={() => handleCardClick('Inactive')}><Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}><div className="p-2 rounded-md bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100"><TbCancel size={20} /></div><div><h6 className="text-sm">{(mappedBrands || []).filter(d => d.status === 'Inactive').length}</h6><span className="text-xs">Inactive</span></div></Card></div></Tooltip>
          </div>
          <div className="mb-4">
            <BrandTableTools
                onClearFilters={onClearFilters}
                onSearchChange={handleSearchChange}
                onFilter={openFilterDrawer}
                onExport={handleOpenExportReasonModal}
                columns={columns}
                filteredColumns={filteredColumns}
                setFilteredColumns={setFilteredColumns}
                activeFilterCount={activeFilterCount}
            />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="flex-grow overflow-auto">
            <BrandTable
              columns={filteredColumns} data={pageData} loading={tableLoading}
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
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
      <BrandSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} />
      
      <Drawer title="Add Brand" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer} width={480} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="addBrandForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Adding..." : "Save"}</Button></div>}>
        <Form id="addBrandForm" onSubmit={addFormMethods.handleSubmit(onAddBrandSubmit)} className="flex flex-col gap-2">
          <div className="flex gap-2"><FormItem label={<div>Brand Icon (250 X 250)<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.icon} errorMessage={addFormMethods.formState.errors.icon?.message as string} className="w-full"><Controller name="icon" control={addFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) => (<Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null; onChange(file); if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl); setAddFormPreviewUrl(file ? URL.createObjectURL(file) : null); }} accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp" />)} /></FormItem>{addFormPreviewUrl && <div className="mt-2 text-right"><Avatar src={addFormPreviewUrl} size={70} shape="circle" /></div>}</div>
          <FormItem label={<div>Brand Name<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.name} errorMessage={addFormMethods.formState.errors.name?.message} isRequired><Controller name="name" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Brand Name" />} /></FormItem>
          <FormItem label={<div>Slug/URL<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.slug} errorMessage={addFormMethods.formState.errors.slug?.message} isRequired><Controller name="slug" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter brand-slug" />} /></FormItem>
          <FormItem label={<div>Mobile No.<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.mobile_no} errorMessage={addFormMethods.formState.errors.mobile_no?.message}><Controller name="mobile_no" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Enter Mobile Number" />} /></FormItem>
          <div className="grid grid-cols-2 gap-2"><FormItem label="Show in Header?" invalid={!!addFormMethods.formState.errors.show_header} errorMessage={addFormMethods.formState.errors.show_header?.message} isRequired><Controller name="show_header" control={addFormMethods.control} render={({ field }) => (<UiSelect options={showHeaderOptions} value={showHeaderOptions.find((opt) => opt.value === String(field.value))} onChange={(opt) => field.onChange(opt ? opt.value : undefined)} />)} /></FormItem><FormItem label="Status" invalid={!!addFormMethods.formState.errors.status} errorMessage={addFormMethods.formState.errors.status?.message} isRequired><Controller name="status" control={addFormMethods.control} render={({ field }) => (<UiSelect options={apiStatusOptions} value={apiStatusOptions.find((opt) => opt.value === field.value)} onChange={(opt) => field.onChange(opt ? opt.value : undefined)} />)} /></FormItem></div>
          <FormItem style={{ fontWeight: "bold", color: "#000" }} label="Meta Options (Optional)"></FormItem>
          <FormItem label={<div>Meta Title<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.meta_title} errorMessage={addFormMethods.formState.errors.meta_title?.message}><Controller name="meta_title" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Meta Title" />} /></FormItem>
          <FormItem label={<div>Meta Description<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.meta_descr} errorMessage={addFormMethods.formState.errors.meta_descr?.message}><Controller name="meta_descr" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Meta Description" />} /></FormItem>
          <FormItem label="Meta Keywords" invalid={!!addFormMethods.formState.errors.meta_keyword} errorMessage={addFormMethods.formState.errors.meta_keyword?.message}><Controller name="meta_keyword" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Meta Keywords (comma-separated)"/>} /></FormItem>
        </Form>
      </Drawer>

      <Drawer title="Edit Brand" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer} width={480} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="editBrandForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button></div>}>
        <Form id="editBrandForm" onSubmit={editFormMethods.handleSubmit(onEditBrandSubmit)} className="flex flex-col gap-2">
          {editingBrand?.icon_full_path && !editFormPreviewUrl && (<FormItem label="Current Icon" ><div className="border border-gray-200 rounded-sm bg-gray-200 h-22 flex items-center justify-center w-22"><Avatar size={80} src={editingBrand.icon_full_path} icon={<TbBuildingStore />} shape="square" /></div></FormItem>)}
          <div className="flex items-center gap-2">
              <FormItem label="New Icon (Optional)" invalid={!!editFormMethods.formState.errors.icon} errorMessage={editFormMethods.formState.errors.icon?.message as string}>
                  <Controller name="icon" control={editFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) => (<Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e) => { const file = e.target.files ? e.target.files[0] : null; onChange(file); if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl); setEditFormPreviewUrl(file ? URL.createObjectURL(file) : null); }} accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp" />)} /><p className="text-xs text-gray-500 mt-1">Leave blank to keep current icon. Selecting a new file will replace it.</p>
              </FormItem>
              {editFormPreviewUrl && <div className="border border-gray-200 rounded-sm bg-gray-200 p-1 flex items-center justify-center "><Avatar src={editFormPreviewUrl} size={80} shape="square" className=""/></div>}
          </div>
          <FormItem label={<div>Brand Name<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.name} errorMessage={editFormMethods.formState.errors.name?.message} isRequired><Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
          <FormItem label={<div>Slug/URL<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.slug} errorMessage={editFormMethods.formState.errors.slug?.message} isRequired><Controller name="slug" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /></FormItem>
          <FormItem label={<div>Mobile No.<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.mobile_no} errorMessage={editFormMethods.formState.errors.mobile_no?.message}><Controller name="mobile_no" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem>
          <div className="grid grid-cols-2 gap-2"><FormItem label="Show in Header?" invalid={!!editFormMethods.formState.errors.show_header} errorMessage={editFormMethods.formState.errors.show_header?.message} isRequired><Controller name="show_header" control={editFormMethods.control} render={({ field }) => (<UiSelect options={showHeaderOptions} value={showHeaderOptions.find((opt) => opt.value === String(field.value))} onChange={(opt) => field.onChange(opt ? opt.value : undefined)} />)} /></FormItem><FormItem label="Status" invalid={!!editFormMethods.formState.errors.status} errorMessage={editFormMethods.formState.errors.status?.message} isRequired><Controller name="status" control={editFormMethods.control} render={({ field }) => (<UiSelect options={apiStatusOptions} value={apiStatusOptions.find((opt) => opt.value === field.value)} onChange={(opt) => field.onChange(opt ? opt.value : undefined)} />)} /></FormItem></div>
          <FormItem style={{ fontWeight: "bold", color: "#000" }} label="Meta Options (Optional)"></FormItem>
          <FormItem label={<div>Meta Title<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.meta_title} errorMessage={editFormMethods.formState.errors.meta_title?.message}><Controller name="meta_title" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem>
          <FormItem label={<div>Meta Description<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.meta_descr} errorMessage={editFormMethods.formState.errors.meta_descr?.message}><Controller name="meta_descr" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea />} /></FormItem>
          <FormItem label="Meta Keywords" invalid={!!editFormMethods.formState.errors.meta_keyword} errorMessage={editFormMethods.formState.errors.meta_keyword?.message}><Controller name="meta_keyword" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem>
        </Form>
      </Drawer>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterBrandForm" type="submit">Apply</Button></div>}>
        <Form id="filterBrandForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Name"><Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Names" options={brandNameOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={uiStatusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />} /></FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteOpen} type="danger" title="Delete Brand" onClose={() => { setSingleDeleteOpen(false); setBrandToDelete(null); }} onRequestClose={() => { setSingleDeleteOpen(false); setBrandToDelete(null); }} onCancel={() => { setSingleDeleteOpen(false); setBrandToDelete(null); }} onConfirm={onConfirmSingleDelete} loading={isProcessing}><p>Are you sure you want to delete the brand "<strong>{brandToDelete?.name}</strong>"? This action cannot be undone.</p></ConfirmDialog>

      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}>
        <div className="flex justify-center items-center p-4">
          {imageToView ? <img src={imageToView} alt="Brand Icon Full View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} /> : <p>No image to display.</p>}
        </div>
      </Dialog>
      
      <Dialog isOpen={isViewDetailModalOpen} onClose={closeViewDetailModal} onRequestClose={closeViewDetailModal} size="sm" title="" contentClassName="!p-0 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-2xl">
        {brandToView ? (<div className="flex flex-col max-h-[90vh]"><div className="p-4 space-y-3"><div className="p-3 bg-white dark:bg-slate-700/60 rounded-lg space-y-3"><div className="flex items-center gap-3">{brandToView.icon_full_path && (<Avatar size={48} shape="rounded" src={brandToView.icon_full_path} icon={<TbBuildingStore />} className="border-2 border-white dark:border-slate-500 shadow" />)}<div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{brandToView.name}</p><p className="text-xs text-slate-600 dark:text-slate-400">ID: {brandToView.id}</p></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2 text-sm text-slate-700 dark:text-slate-200"><DialogDetailRow label="Status" value={<Tag className={`${statusColor[brandToView.status]} capitalize font-semibold border-0 text-[10px] px-2 py-0.5 rounded-full`}>{brandToView.status}</Tag>} /><DialogDetailRow label="Show in Header" value={brandToView.showHeader === 1 ? 'Visible' : 'Hidden'} valueClassName={brandToView.showHeader === 1 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'} /><DialogDetailRow label="Mobile No." value={brandToView.mobileNo || '-'} /><DialogDetailRow label="Slug / URL" value={brandToView.slug} isLink breakAll /><DialogDetailRow label="Created" value={new Date(brandToView.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} /><DialogDetailRow label="Last Updated" value={new Date(brandToView.updatedAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} /></div>{(brandToView.metaTitle || brandToView.metaDescription || brandToView.metaKeyword) && (<div className="pt-2"><h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">SEO & Meta</h6><div className="text-sm text-slate-700 dark:text-slate-200 space-y-1">{brandToView.metaTitle && (<p><span className="font-medium text-slate-500 dark:text-slate-400">Title:</span> {brandToView.metaTitle}</p>)}{brandToView.metaDescription && (<p className="whitespace-pre-wrap"><span className="font-medium text-slate-500 dark:text-slate-400">Description:</span> {brandToView.metaDescription}</p>)}{brandToView.metaKeyword && (<p><span className="font-medium text-slate-500 dark:text-slate-400">Keywords:</span> {brandToView.metaKeyword}</p>)}</div></div>)}</div></div></div>) : (<div className="p-8 text-center flex flex-col items-center justify-center" style={{ minHeight: '200px' }}><TbInfoCircle size={42} className="text-slate-400 dark:text-slate-500 mb-2" /><p className="text-sm font-medium text-slate-600 dark:text-slate-400">No Brand Information</p><p className="text-xs text-slate-500 mt-1">Details for this brand could not be loaded.</p><div className="mt-5"><Button variant="solid" color="blue-600" onClick={closeViewDetailModal} size="sm">Dismiss</Button></div></div>)}
      </Dialog>

      <ConfirmDialog isOpen={isExportReasonModalOpen} type="info" title="Reason for Export" onClose={() => setIsExportReasonModalOpen(false)} onRequestClose={() => setIsExportReasonModalOpen(false)} onCancel={() => setIsExportReasonModalOpen(false)} onConfirm={exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)} loading={isSubmittingExportReason} confirmText={isSubmittingExportReason ? "Submitting..." : "Submit & Export"} cancelText="Cancel" confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}>
        <Form id="exportReasonForm" onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }} className="flex flex-col gap-4 mt-2">
            <FormItem label="Please provide a reason for exporting this data:" invalid={!!exportReasonFormMethods.formState.errors.reason} errorMessage={exportReasonFormMethods.formState.errors.reason?.message}>
                <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
            </FormItem>
        </Form>
      </ConfirmDialog>

    </>
  );
};
export default Brands;