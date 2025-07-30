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
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbCategory,
  TbBox,
  TbInfoCircle,
  TbLink,
  TbPhone,
  TbLayoutDashboard,
  TbWorldWww,
  TbTypography,
  TbFileText,
  TbTags,
  TbHistory,
  TbCalendarPlus,
  TbCalendarEvent,
  TbBoxOff,
  TbCloudDownload,
  TbPhoto,
  TbReload,
  TbBrandProducthunt,
  TbCircleCheck,
  TbCancel,
  TbCategory2,
  TbCalendar,
  TbBlocks,
  TbColumns,
  TbX,
} from "react-icons/tb";

// Types for Categories
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useAppDispatch } from "@/reduxtool/store";
import {
  getCategoriesAction,
  addCategoryAction,
  editCategoryAction,
  deleteCategoryAction,
  deleteAllCategoriesAction,
  submitExportReasonAction,
  getParentCategoriesAction,
  // importCategoriesAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";

// --- Type Definitions (Categories) ---
type ApiCategoryItem = {
  id: number;
  name: string;
  slug: string;
  web_icon: string | null;
  mobile_icon: string | null;
  banner_icon: string | null;
  parent_category: string | number | null;
  show_home_page: string | number;
  show_header: string | number;
  show_page_name: string | null;
  status: "Active" | "Inactive";
  meta_title: string | null;
  meta_descr: string | null;
  meta_keyword: string | null;
  comingsoon?: string | number;
  created_at: string;
  updated_at: string;
  web_icon_full_path?: string;
  mobile_icon_full_path?: string;
  category_icon_full_path?: string;
  parent_category_name?: string;
};
export type CategoryStatus = "active" | "inactive";
export type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  webIcon: string | null;
  webIconFullPath: string | null;
  mobileIcon: string | null;
  mobileIconFullPath: string | null;
  bannerIcon: string | null;
  bannerIconFullPath: string | null;
  parentId: number | null;
  parentCategoryName?: string;
  showHomePage: number;
  showHeader: number;
  showPageName: string | null;
  status: CategoryStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeyword: string | null;
  comingSoon: number;
  createdAt: string;
  updatedAt: string;
};

// --- Zod Schemas (Categories) ---
const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required.").max(255),
  slug: z.string().min(1, "Slug is required.").max(255),
  parent_category: z
    .union([z.number().positive().nullable(), z.string().length(0)])
    .transform((val) => (val === "" ? null : val === null ? null : Number(val)))
    .optional()
    .nullable(),
  web_icon: z.union([z.instanceof(File), z.null()]).optional().nullable(),
  mobile_icon: z.union([z.instanceof(File), z.null()]).optional().nullable(),
  category_icon: z.union([z.instanceof(File), z.null()]).optional().nullable(),
  show_home_page: z
    .enum(["0", "1"], { errorMap: () => ({ message: "Please select." }) })
    .transform((val) => Number(val)),
  show_header: z
    .enum(["0", "1"], { errorMap: () => ({ message: "Please select." }) })
    .transform((val) => Number(val)),
  status: z.enum(["Active", "Inactive"], {
    errorMap: () => ({ message: "Please select a status." }),
  }),
  meta_title: z.string().max(255).optional().nullable(),
  meta_descr: z.string().max(500).optional().nullable(),
  meta_keyword: z.string().max(255).optional().nullable(),
  comingsoon: z
    .enum(["0", "1"], { errorMap: () => ({ message: "Please select." }) })
    .transform((val) => Number(val)),
  show_page_name: z.string().max(255).optional().nullable(),
});
type CategoryFormData = z.infer<typeof categoryFormSchema>;

const filterFormCategorySchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatuses: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterParentIds: z
    .array(z.object({ value: z.number(), label: z.string() }))
    .optional(),
});
type FilterCategoryFormData = z.infer<typeof filterFormCategorySchema>;

type FilterCriteria = {
  filterNames?: { value: string; label: string }[];
  filterStatuses?: { value: string; label: string }[];
  filterParentIds?: { value: number; label: string }[];
  filterSpecial?: 'main' | 'sub' | 'comingSoon' | null;
};

const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required minimum 10 characters.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- CSV Export (Categories) ---
const CSV_HEADERS_CATEGORY = [
  "ID", "Name", "Slug",
  "Web Icon URL", "Mobile Icon URL", "Banner Icon URL",
  "Parent ID", "Parent Name",
  "Show Home", "Show Header", "Show Page Name", "Coming Soon", "Status",
  "Meta Title", "Meta Desc", "Meta Keyword", "Created At", "Updated At",
];
type CategoryCsvItem = {
  id: number; name: string; slug: string;
  webIconFullPath: string | null;
  mobileIconFullPath: string | null;
  bannerIconFullPath: string | null;
  parentId: number | null; parentCategoryName?: string; showHomePage: number;
  showHeader: number; showPageName: string | null; comingSoon: number;
  status: CategoryStatus; metaTitle: string | null; metaDescription: string | null;
  metaKeyword: string | null; createdAt: string; updatedAt: string;
};

function exportToCsvCategory(filename: string, rows: CategoryItem[]) {
  if (!rows || !rows.length) {
    toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
    return false;
  }
  const transformedRows: CategoryCsvItem[] = rows.map((item) => ({
    id: item.id, name: item.name, slug: item.slug,
    webIconFullPath: item.webIconFullPath,
    mobileIconFullPath: item.mobileIconFullPath,
    bannerIconFullPath: item.bannerIconFullPath,
    parentId: item.parentId, parentCategoryName: item.parentCategoryName,
    showHomePage: item.showHomePage, showHeader: item.showHeader, showPageName: item.showPageName,
    comingSoon: item.comingSoon, status: item.status, metaTitle: item.metaTitle,
    metaDescription: item.metaDescription, metaKeyword: item.metaKeyword,
    createdAt: new Date(item.createdAt).toLocaleString(),
    updatedAt: new Date(item.updatedAt).toLocaleString(),
  }));
  const csvKeys: (keyof CategoryCsvItem)[] = [
    "id", "name", "slug",
    "webIconFullPath", "mobileIconFullPath", "bannerIconFullPath",
    "parentId", "parentCategoryName",
    "showHomePage", "showHeader", "showPageName", "comingSoon", "status",
    "metaTitle", "metaDescription", "metaKeyword", "createdAt", "updatedAt",
  ];
  const separator = ",";
  const csvContent =
    CSV_HEADERS_CATEGORY.join(separator) + "\n" +
    transformedRows.map((row) =>
      csvKeys.map((k) => {
        let cellValue = row[k];
        if (cellValue === null || cellValue === undefined) cellValue = "";
        else cellValue = String(cellValue).replace(/"/g, '""');
        if (String(cellValue).search(/("|,|\n)/g) >= 0) cellValue = `"${cellValue}"`;
        return cellValue;
      }).join(separator)
    ).join("\n");
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

// --- Constants & Options (Categories) ---
const CATEGORY_ICON_BASE_URL = import.meta.env.VITE_API_URL_STORAGE || "https://your-api-domain.com/storage/";
const categoryStatusColor: Record<CategoryStatus, string> = {
  active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  inactive: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-100",
};
const uiCategoryStatusOptions: { value: CategoryStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const apiCategoryStatusOptions: { value: "Active" | "Inactive"; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
const yesNoOptions: { value: "0" | "1"; label: string }[] = [
  { value: "1", label: "Yes" },
  { value: "0", label: "No" },
];

// --- Helper Components (Categories) ---

const CategoryActionColumn = ({
  onEdit,
  onViewDetail,
  onDelete,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onDelete: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-2">
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
      {/* <Tooltip title="Delete">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip> */}
    </div>
  );
};

const CategorySearch = React.forwardRef<
  HTMLInputElement, { onInputChange: (value: string) => void }
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Quick Search..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
CategorySearch.displayName = "CategorySearch";

const CategoryTableTools = ({
  onSearchChange, onFilter, onExport, onImport, onClearFilters,
  columns, filteredColumns, setFilteredColumns, activeFilterCount
}: {
  onSearchChange: (query: string) => void; onFilter: () => void;
  onExport: () => void; onImport: () => void;
  onClearFilters: () => void;
  columns: ColumnDef<CategoryItem>[];
  filteredColumns: ColumnDef<CategoryItem>[];
  setFilteredColumns: React.Dispatch<React.SetStateAction<ColumnDef<CategoryItem>[]>>;
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
        <CategorySearch onInputChange={onSearchChange} />
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
              )
            })}
          </div>
        </Dropdown>
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters & Reload"></Button>
        <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">
          Filter {activeFilterCount > 0 && (
            <span className="ml-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500 dark:text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
        <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
      </div>
    </div>
  );
};


const ActiveFiltersDisplay = ({ filterData, onRemoveFilter, onClearAll }: {
  filterData: FilterCriteria;
  onRemoveFilter: (key: keyof FilterCriteria, value: any) => void;
  onClearAll: () => void;
}) => {
  const { filterNames, filterStatuses, filterParentIds, filterSpecial } = filterData;
  const hasFilters = filterNames?.length || filterStatuses?.length || filterParentIds?.length || filterSpecial;

  if (!hasFilters) return null;

  const getSpecialFilterLabel = (key: string) => {
    switch (key) {
      case 'main': return 'Main Categories';
      case 'sub': return 'Sub Categories';
      case 'comingSoon': return 'Coming Soon';
      default: return '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      <span className="font-semibold text-sm text-gray-600 dark:text-gray-300 mr-2">Active Filters:</span>
      {filterNames?.map(item => <Tag key={`name-${item.value}`} prefix>Name: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterNames', item.value)} /></Tag>)}
      {filterStatuses?.map(item => <Tag key={`status-${item.value}`} prefix>Status: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterStatuses', item.value)} /></Tag>)}
      {filterParentIds?.map(item => <Tag key={`parent-${item.value}`} prefix>Parent: {item.label} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterParentIds', item.value)} /></Tag>)}
      {filterSpecial && <Tag prefix>{getSpecialFilterLabel(filterSpecial)} <TbX className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => onRemoveFilter('filterSpecial', filterSpecial)} /></Tag>}
      <Button size="xs" variant="plain" className="text-red-600 hover:text-red-500 hover:underline ml-auto" onClick={onClearAll}>Clear All</Button>
    </div>
  );
};


type CategoryTableProps = {
  columns: ColumnDef<CategoryItem>[]; data: CategoryItem[]; loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: CategoryItem[];
  onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: CategoryItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<CategoryItem>[]) => void;
};
const CategoryTable = ({
  columns, data, loading, pagingData, selectedItems,
  onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect,
}: CategoryTableProps) => (
  <DataTable
    selectable columns={columns} data={data}
    noData={!loading && data.length === 0} loading={loading}
    pagingData={pagingData}
    checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)}
    onPaginationChange={onPaginationChange} onSelectChange={onSelectChange}
    onSort={onSort} onCheckBoxChange={onRowSelect}
    onIndeterminateCheckBoxChange={onAllRowSelect}
  />
);

const CategorySelectedFooter = ({
  selectedItems, onDeleteSelected,
}: { selectedItems: CategoryItem[]; onDeleteSelected: () => void; }) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span>Categor{selectedItems.length > 1 ? "ies" : "y"} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)}>
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteOpen} type="danger"
        title={`Delete ${selectedItems.length} Categor${selectedItems.length > 1 ? "ies" : "y"}`}
        onClose={() => setDeleteOpen(false)} onRequestClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }}
      >
        <p>Are you sure you want to delete the selected categor{selectedItems.length > 1 ? "ies" : "y"}? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

interface DialogDetailRowProps {
  label: string; value: string | React.ReactNode; isLink?: boolean;
  preWrap?: boolean; breakAll?: boolean; labelClassName?: string;
  valueClassName?: string; className?: string;
}
const DialogDetailRow: React.FC<DialogDetailRowProps> = ({
  label, value, isLink, preWrap, breakAll,
  labelClassName = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
  valueClassName = "text-sm text-slate-700 dark:text-slate-100 mt-0.5",
  className = "",
}) => (
  <div className={`py-1.5 ${className}`}>
    <p className={`${labelClassName}`}>{label}</p>
    {isLink ? (
      <a href={typeof value === 'string' && (value.startsWith('http') ? value : `/${value}`) || '#'}
        target="_blank" rel="noopener noreferrer"
        className={`${valueClassName} hover:underline text-blue-600 dark:text-blue-400 ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}
      >{value}</a>
    ) : (
      <div className={`${valueClassName} ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</div>
    )}
  </div>
);


// --- Main Component (Categories) ---
const Categories = () => {
  const dispatch = useAppDispatch();
  const [isAddDrawerOpen, setAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [singleDeleteOpen, setSingleDeleteOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  // New States for Export/Import
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({});

  // Image Preview States
  const [addWebIconPreview, setAddWebIconPreview] = useState<string | null>(null);
  const [addMobileIconPreview, setAddMobileIconPreview] = useState<string | null>(null);
  const [addBannerIconPreview, setAddBannerIconPreview] = useState<string | null>(null);

  const [editWebIconPreview, setEditWebIconPreview] = useState<string | null>(null);
  const [editMobileIconPreview, setEditMobileIconPreview] = useState<string | null>(null);
  const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);

  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);
  const [categoryToView, setCategoryToView] = useState<CategoryItem | null>(null);

  const [activeAddTab, setActiveAddTab] = useState('general');
  const [activeEditTab, setActiveEditTab] = useState('general');

  const { CategoriesData = [], status: masterLoadingStatus = "idle", ParentCategories = [] } = useSelector(masterSelector);
  useEffect(() => { dispatch(getCategoriesAction()); dispatch(getParentCategoriesAction()); }, [dispatch]);

  useEffect(() => {
    return () => {
      if (addWebIconPreview) URL.revokeObjectURL(addWebIconPreview);
      if (addMobileIconPreview) URL.revokeObjectURL(addMobileIconPreview);
      if (addBannerIconPreview) URL.revokeObjectURL(addBannerIconPreview);
      if (editWebIconPreview) URL.revokeObjectURL(editWebIconPreview);
      if (editMobileIconPreview) URL.revokeObjectURL(editMobileIconPreview);
      if (editBannerPreview) URL.revokeObjectURL(editBannerPreview);
    };
  }, [addWebIconPreview, addMobileIconPreview, addBannerIconPreview, editWebIconPreview, editMobileIconPreview, editBannerPreview]);

  const defaultCategoryFormValues: Omit<CategoryFormData, "show_home_page" | "show_header" | "comingsoon"> &
  { show_home_page: "0" | "1"; show_header: "0" | "1"; comingsoon: "0" | "1"; web_icon: null; mobile_icon: null; category_icon: null; parent_category: null; } = {
    name: "", slug: "", parent_category: null,
    web_icon: null, mobile_icon: null, category_icon: null,
    show_home_page: "0", show_header: "0",
    status: "Active", meta_title: null, meta_descr: null, meta_keyword: null,
    comingsoon: "0", show_page_name: null,
  };

  const addFormMethods = useForm<CategoryFormData>({ resolver: zodResolver(categoryFormSchema), defaultValues: defaultCategoryFormValues, mode: "onChange" });
  const editFormMethods = useForm<CategoryFormData>({ resolver: zodResolver(categoryFormSchema), defaultValues: defaultCategoryFormValues, mode: "onChange" });
  const filterFormMethods = useForm<FilterCategoryFormData>({ resolver: zodResolver(filterFormCategorySchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });

  const parentCategoryOptions = useMemo(() => {
    if (!Array.isArray(ParentCategories)) return [{ value: null, label: "No Parent Category" }];
    const options = ParentCategories.filter(cat => !editingCategory || cat.id !== editingCategory.id)
      .map((cat: ApiCategoryItem) => ({ value: cat.id, label: cat.name, }));
    return [{ value: null, label: "No Parent Category" }, ...options];
  }, [ParentCategories, editingCategory]);

  const getFullPath = (apiPath?: string | null, filename?: string | null, typeFolder: string = 'category_icons/') => {
    if (apiPath) return apiPath;
    if (filename) {
      if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;
      return `${CATEGORY_ICON_BASE_URL}${typeFolder}${filename.startsWith("/") ? filename.substring(1) : filename}`;
    }
    return null;
  };

  const mappedCategories: CategoryItem[] = useMemo(() => {
    if (!Array.isArray(CategoriesData)) return [];
    const categoriesMap = new Map<number, string>();
    CategoriesData.forEach((cat: ApiCategoryItem) => categoriesMap.set(cat.id, cat.name));

    return CategoriesData.map((apiItem: ApiCategoryItem): CategoryItem => {
      const parentId = apiItem.parent_category ? Number(apiItem.parent_category) : null;
      return {
        id: apiItem.id, name: apiItem.name, slug: apiItem.slug,
        webIcon: apiItem.web_icon,
        webIconFullPath: getFullPath(apiItem.web_icon_full_path, apiItem.web_icon, 'category_web_icons/'),
        mobileIcon: apiItem.mobile_icon,
        mobileIconFullPath: getFullPath(apiItem.mobile_icon_full_path, apiItem.mobile_icon, 'category_mobile_icons/'),
        bannerIcon: apiItem.banner_icon,
        bannerIconFullPath: getFullPath(apiItem.category_icon_full_path, apiItem.banner_icon, 'category_icons/'),
        parentId: parentId,
        parentCategoryName: parentId ? categoriesMap.get(parentId) || "Unknown" : undefined,
        showHomePage: Number(apiItem.show_home_page), showHeader: Number(apiItem.show_header),
        showPageName: apiItem.show_page_name,
        status: apiItem.status === "Active" ? "active" : "inactive",
        metaTitle: apiItem.meta_title, metaDescription: apiItem.meta_descr,
        metaKeyword: apiItem.meta_keyword, comingSoon: Number(apiItem.comingsoon || 0),
        createdAt: apiItem.created_at, updatedAt: apiItem.updated_at,
      };
    });
  }, [CategoriesData]);

  const resetAddFormPreviews = () => {
    if (addWebIconPreview) URL.revokeObjectURL(addWebIconPreview);
    if (addMobileIconPreview) URL.revokeObjectURL(addMobileIconPreview);
    if (addBannerIconPreview) URL.revokeObjectURL(addBannerIconPreview);
    setAddWebIconPreview(null);
    setAddMobileIconPreview(null);
    setAddBannerIconPreview(null);
  };

  const resetEditFormPreviews = () => {
    if (editWebIconPreview) URL.revokeObjectURL(editWebIconPreview);
    if (editMobileIconPreview) URL.revokeObjectURL(editMobileIconPreview);
    if (editBannerPreview) URL.revokeObjectURL(editBannerPreview);
    setEditWebIconPreview(null);
    setEditMobileIconPreview(null);
    setEditBannerPreview(null);
  };

  const openAddCategoryDrawer = () => {
    addFormMethods.reset(defaultCategoryFormValues);
    resetAddFormPreviews();
    setActiveAddTab('general'); // Reset to general tab
    setAddDrawerOpen(true);
  };
  const closeAddCategoryDrawer = () => {
    setAddDrawerOpen(false);
    resetAddFormPreviews();
  };

  const onAddCategorySubmit = async (data: CategoryFormData) => {
    setSubmitting(true); const formData = new FormData();

    (Object.keys(data) as Array<keyof CategoryFormData>).forEach((key) => {
      const value = data[key];
      if (key === "web_icon" || key === "mobile_icon" || key === "category_icon") {
        if (value instanceof File) formData.append(key, value);
      }
      else if (value !== null && value !== undefined) { formData.append(key, String(value)); }
    });
    try {
      await dispatch(addCategoryAction(formData)).unwrap();
      toast.push(<Notification title="Category Added" type="success" duration={2000}>Category "{data.name}" added.</Notification>);
      closeAddCategoryDrawer(); dispatch(getCategoriesAction());
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Could not add category.";
      toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{errorMessage}</Notification>);
    } finally { setSubmitting(false); }
  };

  const openEditCategoryDrawer = (category: CategoryItem) => {
    setEditingCategory(category);
    editFormMethods.reset({
      name: category.name, slug: category.slug, parent_category: category.parentId,
      web_icon: null, mobile_icon: null, category_icon: null,
      show_home_page: String(category.showHomePage) as "0" | "1",
      show_header: String(category.showHeader) as "0" | "1",
      status: category.status === "active" ? "Active" : "Inactive",
      meta_title: category.metaTitle || null, meta_descr: category.metaDescription || null,
      meta_keyword: category.metaKeyword || null,
      comingsoon: String(category.comingSoon) as "0" | "1",
      show_page_name: category.showPageName || null,
    });

    resetEditFormPreviews();
    if (category.webIconFullPath) setEditWebIconPreview(category.webIconFullPath);
    if (category.mobileIconFullPath) setEditMobileIconPreview(category.mobileIconFullPath);
    if (category.bannerIconFullPath) setEditBannerPreview(category.bannerIconFullPath);
    
    setActiveEditTab('general'); // Reset to general tab
    setEditDrawerOpen(true);
  };
  const closeEditCategoryDrawer = () => {
    setEditDrawerOpen(false);
    setEditingCategory(null);
    resetEditFormPreviews();
  };
  const onEditCategorySubmit = async (data: CategoryFormData) => {
    if (!editingCategory) return; setSubmitting(true); const formData = new FormData(); formData.append("_method", "PUT");
    (Object.keys(data) as Array<keyof CategoryFormData>).forEach((key) => {
      const value = data[key];
      if (key === "web_icon" || key === "mobile_icon" || key === "category_icon") {
        if (value instanceof File) formData.append(key, value);
      }
      else {
        if (value === null && key !== "parent_category") formData.append(key, "");
        else if (key === "parent_category" && value === null) formData.append(key, "");
        else if (value !== undefined) formData.append(key, String(value));
      }
    });
    try {
      await dispatch(editCategoryAction({ id: editingCategory.id, formData })).unwrap();
      toast.push(<Notification title="Category Updated" type="success" duration={2000}>Category "{data.name}" updated.</Notification>);
      closeEditCategoryDrawer(); dispatch(getCategoriesAction());
    } catch (error: any) {
      const responseData = error.response?.data; let errorMessage = "Could not update category.";
      if (responseData) {
        if (responseData.message) errorMessage = responseData.message;
        if (responseData.errors) { const validationErrors = Object.values(responseData.errors).flat().join(" "); errorMessage += ` Details: ${validationErrors}`; }
      } else if (error.message) errorMessage = error.message;
      toast.push(<Notification title="Failed to Update" type="danger" duration={4000}>{errorMessage}</Notification>);
    } finally { setSubmitting(false); }
  };

  const handleDeleteCategoryClick = (category: CategoryItem) => { setCategoryToDelete(category); setSingleDeleteOpen(true); };
  const onConfirmSingleDeleteCategory = async () => {
    if (!categoryToDelete) return; setIsProcessing(true);
    try {
      await dispatch(deleteCategoryAction(categoryToDelete.id)).unwrap();
      toast.push(<Notification title="Category Deleted" type="success" duration={2000}>Category "{categoryToDelete.name}" deleted.</Notification>);
      setSelectedItems((prev) => prev.filter((item) => item.id !== categoryToDelete!.id));
      dispatch(getCategoriesAction());
    } catch (error: any) {
      const errorMessage = error.message || `Could not delete category.`;
      toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{errorMessage}</Notification>);
    } finally { setSingleDeleteOpen(false); setIsProcessing(false); setCategoryToDelete(null); }
  };
  const handleDeleteSelectedCategories = async () => {
    if (selectedItems.length === 0) return; setIsProcessing(true);
    const idsToDelete = selectedItems.map((item) => item.id);
    try {
      await dispatch(deleteAllCategoriesAction({ ids: idsToDelete.join(",") })).unwrap();
      toast.push(<Notification title="Categories Deleted" type="success" duration={2000}>{selectedItems.length} categor{selectedItems.length > 1 ? "ies" : "y"} deleted.</Notification>);
      setSelectedItems([]); dispatch(getCategoriesAction());
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete selected categories.";
      toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{errorMessage}</Notification>);
    } finally { setIsProcessing(false); }
  };

  const openViewDetailModal = useCallback((category: CategoryItem) => {
    setCategoryToView(category);
    setIsViewDetailModalOpen(true);
  }, []);
  const closeViewDetailModal = useCallback(() => {
    setIsViewDetailModalOpen(false);
    setCategoryToView(null);
  }, []);

  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<CategoryItem[]>([]);
  const categoryNameOptions = useMemo(() => {
    if (!Array.isArray(mappedCategories)) return [];
    const uniqueNames = new Set(mappedCategories.map((cat) => cat.name));
    return Array.from(uniqueNames).sort((a, b) => a.localeCompare(b)).map((name) => ({ value: name, label: name }));
  }, [mappedCategories]);

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);

  const onClearFilters = () => {
    const defaultFilters: FilterCriteria = { filterNames: [], filterStatuses: [], filterParentIds: [], filterSpecial: null };
    filterFormMethods.reset({ filterNames: [], filterStatuses: [], filterParentIds: [] });
    setFilterCriteria(defaultFilters);
    handleSetTableData({ query: "", pageIndex: 1 });
  };

  const handleCardClick = (type: 'active' | 'inactive' | 'main' | 'sub' | 'comingSoon' | 'all') => {
    onClearFilters(); // Clear all existing filters first

    if (type === 'all') return;

    if (type === 'active') {
      setFilterCriteria({ filterStatuses: [{ value: 'active', label: 'Active' }] });
    } else if (type === 'inactive') {
      setFilterCriteria({ filterStatuses: [{ value: 'inactive', label: 'Inactive' }] });
    } else if (type === 'main' || type === 'sub' || type === 'comingSoon') {
      setFilterCriteria({ filterSpecial: type });
    }
    handleSetTableData({ pageIndex: 1 });
  };

  const handleRemoveFilter = useCallback((key: keyof FilterCriteria, value: any) => {
    setFilterCriteria(prev => {
      const newFilters = { ...prev };
      if (key === 'filterSpecial') {
        newFilters.filterSpecial = null;
      } else {
        const currentValues = prev[key] as { value: any; label: string }[] | undefined;
        if (currentValues) {
          const newValues = currentValues.filter(item => item.value !== value);
          if (newValues.length > 0) {
            (newFilters as any)[key] = newValues;
          } else {
            delete newFilters[key];
          }
        }
      }
      return newFilters;
    });
    handleSetTableData({ pageIndex: 1 });
  }, [handleSetTableData]);

  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setFilterDrawerOpen(true); };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterCategoryFormData) => { setFilterCriteria(prev => ({ ...prev, ...data })); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: CategoryItem[] = cloneDeep(mappedCategories);

    if (filterCriteria.filterSpecial === 'main') {
      processedData = processedData.filter(item => item.parentId === null);
    } else if (filterCriteria.filterSpecial === 'sub') {
      processedData = processedData.filter(item => item.parentId !== null);
    } else if (filterCriteria.filterSpecial === 'comingSoon') {
      processedData = processedData.filter(item => item.comingSoon === 1);
    }

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedNames = filterCriteria.filterNames.map((opt) => opt.value.toLowerCase());
      processedData = processedData.filter((item) => selectedNames.includes(item.name.toLowerCase()));
    }
    if (filterCriteria.filterStatuses && filterCriteria.filterStatuses.length > 0) {
      const selectedStatuses = filterCriteria.filterStatuses.map((opt) => opt.value);
      processedData = processedData.filter((item) => selectedStatuses.includes(item.status));
    }
    if (filterCriteria.filterParentIds && filterCriteria.filterParentIds.length > 0) {
      const selectedParentIds = filterCriteria.filterParentIds.map((opt) => opt.value);
      processedData = processedData.filter((item) => item.parentId !== null && selectedParentIds.includes(item.parentId));
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) =>
        item.name?.toLowerCase().includes(query) ||
        item.slug?.toLowerCase().includes(query) ||
        String(item.id).toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query) ||
        item.parentCategoryName?.toLowerCase().includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      const sortKey = key as keyof CategoryItem;
      processedData.sort((a, b) => {
        let aValue = a[sortKey]; let bValue = b[sortKey];
        if (sortKey === "createdAt" || sortKey === "updatedAt") { aValue = new Date(aValue as string).getTime(); bValue = new Date(bValue as string).getTime(); }
        else if (["id", "parentId", "showHeader", "showHomePage", "comingSoon"].includes(sortKey)) { aValue = Number(aValue); bValue = Number(bValue); }
        if (aValue === null || aValue === undefined) aValue = "" as any;
        if (bValue === null || bValue === undefined) bValue = "" as any;
        if (typeof aValue === "string" && typeof bValue === "string") return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        else if (typeof aValue === "number" && typeof bValue === "number") return order === "asc" ? aValue - bValue : bValue - aValue;
        return 0;
      });
    }
    const dataToExport = [...processedData]; const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize; const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [mappedCategories, tableData, filterCriteria]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCriteria.filterNames?.length) count++;
    if (filterCriteria.filterStatuses?.length) count++;
    if (filterCriteria.filterParentIds?.length) count++;
    if (filterCriteria.filterSpecial) count++;
    return count;
  }, [filterCriteria]);


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
    const moduleName = "Categories";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `categories_export_${timestamp}.csv`;

    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );

      const exportSuccess = exportToCsvCategory(fileName, allFilteredAndSortedData);
      if (exportSuccess) {
        toast.push(
          <Notification title="Export Successful" type="success">
            Data exported to {fileName}.
          </Notification>
        );
      }

      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Operation Failed"
          type="danger"
        >
          {error.message || "Could not complete export."}
        </Notification>
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (
        file.type === "text/csv" ||
        file.name.endsWith(".csv") ||
        file.type === "application/vnd.ms-excel" ||
        file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setSelectedFile(file);
      } else {
        toast.push(
          <Notification title="Invalid File Type" type="danger" duration={3000}>
            Please upload a CSV or Excel file.
          </Notification>
        );
        setSelectedFile(null);
        if (e.target) e.target.value = "";
      }
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) {
      toast.push(
        <Notification title="No File Selected" type="warning" duration={2000}>
          Please select a file to import.
        </Notification>
      );
      return;
    }
    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      // await dispatch(importCategoriesAction(formData)).unwrap();
      toast.push(
        <Notification title="Import Initiated" type="success" duration={2000}>
          File uploaded successfully. Data is being processed.
        </Notification>
      );
      dispatch(getCategoriesAction());
      closeImportModal();
    } catch (apiError: any) {
      toast.push(
        <Notification title="Import Failed" type="danger" duration={3000}>
          {apiError.message || "Failed to import categories."}
        </Notification>
      );
    } finally {
      setIsImporting(false);
    }
  };


  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: CategoryItem) => setSelectedItems((prev) => checked ? (prev.some((item) => item.id === row.id) ? prev : [...prev, row]) : prev.filter((item) => item.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<CategoryItem>[]) => {
    const originals = currentRows.map((r) => r.original);
    if (checked) setSelectedItems((prev) => { const prevIds = new Set(prev.map((item) => item.id)); return [...prev, ...originals.filter((r) => !prevIds.has(r.id))]; });
    else { const currentIds = new Set(originals.map((r) => r.id)); setSelectedItems((prev) => prev.filter((item) => !currentIds.has(item.id))); }
  }, []);

  const openImageViewer = (imageUrl: string | null) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } };
  const closeImageViewer = () => { setImageViewerOpen(false); setImageToView(null); };

  const columns: ColumnDef<CategoryItem>[] = useMemo(() => [
    {
      header: "ID",
      accessorKey: "id",
      size: 60,
      meta: { tdClass: "text-center", thClass: "text-center" },
      cell: ({ getValue }) => getValue().toString().padStart(6, '0'),
    },
    {
      header: "Name", accessorKey: "name", id: "name", enableSorting: true,
      cell: (props) => {
        const { webIconFullPath, name } = props.row.original;
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Avatar size={30} shape="circle" src={webIconFullPath || undefined} icon={<TbCategory />}
              className={webIconFullPath ? "cursor-pointer hover:ring-2 hover:ring-indigo-500" : ""}
              onClick={() => webIconFullPath && openImageViewer(webIconFullPath)}
            >{!webIconFullPath && name ? name.charAt(0).toUpperCase() : ""}</Avatar>
            <span>{name}</span>
          </div>
        );
      },
    },
    { header: "Parent Category", accessorKey: "parentCategoryName", id: "parentCategoryName", enableSorting: true, cell: (props) => props.row.original.parentCategoryName || <span className="text-gray-400 dark:text-gray-500">-</span> },
    {
      header: "Status", accessorKey: "status", id: "status", enableSorting: true,
      cell: (props) => { const status = props.row.original.status; return <Tag className={`${categoryStatusColor[status]} capitalize font-semibold border-0`}>{status}</Tag>; },
    },
    {
      header: "Actions", id: "action", size: 120,
      meta: { HeaderClass: "text-center" },
      cell: (props) => (
        <CategoryActionColumn
          onEdit={() => openEditCategoryDrawer(props.row.original)}
          onViewDetail={() => openViewDetailModal(props.row.original)}
          onDelete={() => handleDeleteCategoryClick(props.row.original)}
        />
      ),
    },
  ], []);

  const [filteredColumns, setFilteredColumns] = useState<ColumnDef<CategoryItem>[]>(columns);
  useEffect(() => { setFilteredColumns(columns) }, [columns]);

  const tableLoading = masterLoadingStatus === "loading" || isSubmitting || isProcessing || isImporting;
  const cardClass = "rounded-md border transition-shadow duration-200 ease-in-out cursor-pointer hover:shadow-lg";
  const cardBodyClass = "flex items-center gap-2 p-2";

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Categories</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddCategoryDrawer}>Add New</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 mb-4 gap-2">
            <Tooltip title="Click to show all categories">
              <div onClick={() => handleCardClick('all')}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-blue-200")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500"><TbCategory size={24} /></div>
                  <div><h6 className="text-blue-500">{mappedCategories.length}</h6><span className="font-semibold text-[11px]">Total</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show active categories">
              <div onClick={() => handleCardClick('active')}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-green-300")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500"><TbCircleCheck size={24} /></div>
                  <div><h6 className="text-green-500">{mappedCategories.filter(c => c.status === 'active').length}</h6><span className="font-semibold text-[11px]">Active</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show inactive categories">
              <div onClick={() => handleCardClick('inactive')}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-red-200")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500"><TbCancel size={24} /></div>
                  <div><h6 className="text-red-500">{mappedCategories.filter(c => c.status === 'inactive').length}</h6><span className="font-semibold text-[11px]">Inactive</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show main categories">
              <div onClick={() => handleCardClick('main')}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-violet-200")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500"><TbCategory2 size={24} /></div>
                  <div><h6 className="text-violet-500">{mappedCategories.filter(c => c.parentId === null).length}</h6><span className="font-semibold text-[11px]">Main Category</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show sub categories">
              <div onClick={() => handleCardClick('sub')}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-pink-200")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-pink-100 text-pink-500"><TbBlocks size={24} /></div>
                  <div><h6 className="text-pink-500">{mappedCategories.filter(c => c.parentId !== null).length}</h6><span className="font-semibold text-[11px]">Sub Category</span></div>
                </Card>
              </div>
            </Tooltip>
            <Tooltip title="Click to show 'coming soon' categories">
              <div onClick={() => handleCardClick('comingSoon')}>
                <Card bodyClass={cardBodyClass} className={classNames(cardClass, "border-orange-200")}>
                  <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500"><TbCalendar size={24} /></div>
                  <div><h6 className="text-orange-500">{mappedCategories.filter(c => c.comingSoon === 1).length}</h6><span className="font-semibold text-[11px]">Coming Soon</span></div>
                </Card>
              </div>
            </Tooltip>
          </div>
          <div className="mb-4">
            <CategoryTableTools
              onClearFilters={onClearFilters}
              onSearchChange={handleSearchChange}
              onFilter={openFilterDrawer}
              onExport={handleOpenExportReasonModal}
              onImport={openImportModal}
              columns={columns}
              filteredColumns={filteredColumns}
              setFilteredColumns={setFilteredColumns}
              activeFilterCount={activeFilterCount}
            />
          </div>
          <ActiveFiltersDisplay filterData={filterCriteria} onRemoveFilter={handleRemoveFilter} onClearAll={onClearFilters} />
          <div className="mt-4 flex-grow overflow-y-auto">
            <CategoryTable
              columns={filteredColumns} data={pageData} loading={tableLoading}
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectedItems={selectedItems}
              onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
              onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>
      <CategorySelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelectedCategories} />

      {/* Add Category Drawer */}
      <Drawer
          title="Add Category"
          width={480}
          isOpen={isAddDrawerOpen}
          onClose={closeAddCategoryDrawer}
          onRequestClose={closeAddCategoryDrawer}
          bodyClass="p-0"
          footer={
              <div className="text-right w-full">
                  <Button size="sm" className="mr-2" onClick={closeAddCategoryDrawer} disabled={isSubmitting}>Cancel</Button>
                  <Button size="sm" variant="solid" form="addCategoryForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>
                      {isSubmitting ? "Adding..." : "Save"}
                  </Button>
              </div>
          }
      >
          <div className="border-b border-gray-200 dark:border-gray-600 px-4">
              <div className="flex -mb-px">
                  <button
                      type="button"
                      onClick={() => setActiveAddTab('general')}
                      className={classNames(
                          "mr-4 py-3 px-1 text-sm font-medium focus:outline-none",
                          activeAddTab === 'general'
                              ? "text-indigo-600 dark:text-indigo-300 border-b-2 border-indigo-500"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border-b-2 border-transparent"
                      )}
                  >
                      General
                  </button>
                  <button
                      type="button"
                      onClick={() => setActiveAddTab('meta')}
                      className={classNames(
                          "py-3 px-1 text-sm font-medium focus:outline-none",
                          activeAddTab === 'meta'
                              ? "text-indigo-600 dark:text-indigo-300 border-b-2 border-indigo-500"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border-b-2 border-transparent"
                      )}
                  >
                      Meta Options
                  </button>
              </div>
          </div>
          <div className="p-4 h-full overflow-y-auto">
              <Form id="addCategoryForm" onSubmit={addFormMethods.handleSubmit(onAddCategorySubmit)}>
                  <div style={{ display: activeAddTab === 'general' ? 'block' : 'none' }}>
                      <div className="flex flex-col gap-3">
                        <FormItem label={<div>Category Name<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.name} errorMessage={addFormMethods.formState.errors.name?.message} isRequired> <Controller name="name" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Category Name" />} /> </FormItem>
                        <FormItem label={<div>Slug/URL<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.slug} errorMessage={addFormMethods.formState.errors.slug?.message} isRequired> <Controller name="slug" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter category-slug" />} /> </FormItem>
                        <FormItem label="Parent Category" invalid={!!addFormMethods.formState.errors.parent_category} errorMessage={addFormMethods.formState.errors.parent_category?.message as string}> <Controller name="parent_category" control={addFormMethods.control} render={({ field }) => <UiSelect placeholder="Select Parent or None" options={parentCategoryOptions} value={parentCategoryOptions.find(opt => opt.value === field.value)} onChange={option => field.onChange(option ? option.value : null)} isClearable />} /> </FormItem>

                        <div className="flex gap-2">
                          <FormItem className="w-full" label={<div>Web Icon (467 X 250)<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.web_icon} errorMessage={addFormMethods.formState.errors.web_icon?.message as string}>
                            <Controller name="web_icon" control={addFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) =>
                              <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0] || null;
                                onChange(file);
                                if (addWebIconPreview) URL.revokeObjectURL(addWebIconPreview);
                                setAddWebIconPreview(file ? URL.createObjectURL(file) : null);
                              }} accept="image/*" />} />
                          </FormItem>
                          {addWebIconPreview && <div className="mt-2"><Avatar src={addWebIconPreview} size={70} className="rounded-sm" icon={<TbPhoto />} /></div>}
                        </div>

                        <div className="flex gap-2">
                          <FormItem className="w-full" label={<div>Mobile Icon (500 X 500)<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.mobile_icon} errorMessage={addFormMethods.formState.errors.mobile_icon?.message as string}>
                            <Controller name="mobile_icon" control={addFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) =>
                              <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0] || null;
                                onChange(file);
                                if (addMobileIconPreview) URL.revokeObjectURL(addMobileIconPreview);
                                setAddMobileIconPreview(file ? URL.createObjectURL(file) : null);
                              }} accept="image/*" />} />
                          </FormItem>
                          {addMobileIconPreview && <div className="mt-2"><Avatar src={addMobileIconPreview} size={70} className="rounded-sm" icon={<TbPhoto />} /></div>}
                        </div>

                        <FormItem
                          label={<div>Category Banner (Recommended: 1920x400)<span className="text-red-500"> * </span></div>}
                          invalid={!!addFormMethods.formState.errors.category_icon}
                          errorMessage={addFormMethods.formState.errors.category_icon?.message as string}
                        >
                          <Controller name="category_icon" control={addFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) =>
                            <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const file = e.target.files?.[0] || null;
                              onChange(file);
                              if (addBannerIconPreview) URL.revokeObjectURL(addBannerIconPreview);
                              setAddBannerIconPreview(file ? URL.createObjectURL(file) : null);
                            }} accept="image/*" />} />
                          {addBannerIconPreview && <div className="mt-2 border border-gray-200 rounded-md"><img src={addBannerIconPreview} alt="Banner Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px' }} /></div>}
                        </FormItem>

                        <div className="grid grid-cols-2 gap-2">
                          <FormItem label="Show on Home Page?" invalid={!!addFormMethods.formState.errors.show_home_page} errorMessage={addFormMethods.formState.errors.show_home_page?.message} isRequired> <Controller name="show_home_page" control={addFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
                          <FormItem label="Show in Header?" invalid={!!addFormMethods.formState.errors.show_header} errorMessage={addFormMethods.formState.errors.show_header?.message} isRequired> <Controller name="show_header" control={addFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormItem label="Coming Soon?" invalid={!!addFormMethods.formState.errors.comingsoon} errorMessage={addFormMethods.formState.errors.comingsoon?.message} isRequired> <Controller name="comingsoon" control={addFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
                          <FormItem label="Status" invalid={!!addFormMethods.formState.errors.status} errorMessage={addFormMethods.formState.errors.status?.message} isRequired> <Controller name="status" control={addFormMethods.control} render={({ field }) => <UiSelect options={apiCategoryStatusOptions} value={apiCategoryStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
                        </div>
                      </div>
                  </div>
                  <div style={{ display: activeAddTab === 'meta' ? 'block' : 'none' }}>
                    <div className="flex flex-col gap-3">
                      <FormItem label={<div>Meta Title<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.meta_title} errorMessage={addFormMethods.formState.errors.meta_title?.message}> <Controller name="meta_title" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Meta Title" />} /> </FormItem>
                      <FormItem label={<div>Meta Description<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.meta_descr} errorMessage={addFormMethods.formState.errors.meta_descr?.message}> <Controller name="meta_descr" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Meta Description" />} /> </FormItem>
                      <FormItem label="Meta Keywords" invalid={!!addFormMethods.formState.errors.meta_keyword} errorMessage={addFormMethods.formState.errors.meta_keyword?.message}> <Controller name="meta_keyword" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Meta Keywords (comma-separated)" />} /> </FormItem>
                    </div>
                  </div>
              </Form>
          </div>
      </Drawer>

      {/* Edit Category Drawer */}
      <Drawer
        title="Edit Category"
        width={480}
        isOpen={isEditDrawerOpen}
        onClose={closeEditCategoryDrawer}
        onRequestClose={closeEditCategoryDrawer}
        bodyClass="p-0"
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={closeEditCategoryDrawer} disabled={isSubmitting}>Cancel</Button>
            <Button size="sm" variant="solid" form="editCategoryForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <div className="border-b border-gray-200 dark:border-gray-600 px-4">
            <div className="flex -mb-px">
                <button
                    type="button"
                    onClick={() => setActiveEditTab('general')}
                    className={classNames(
                        "mr-4 py-3 px-1 text-sm font-medium focus:outline-none",
                        activeEditTab === 'general'
                            ? "text-indigo-600 dark:text-indigo-300 border-b-2 border-indigo-500"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border-b-2 border-transparent"
                    )}
                >
                    General
                </button>
                <button
                    type="button"
                    onClick={() => setActiveEditTab('meta')}
                    className={classNames(
                        "py-3 px-1 text-sm font-medium focus:outline-none",
                        activeEditTab === 'meta'
                            ? "text-indigo-600 dark:text-indigo-300 border-b-2 border-indigo-500"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border-b-2 border-transparent"
                    )}
                >
                    Meta Options
                </button>
            </div>
        </div>
        <div className="p-4 h-full overflow-y-auto">
          <Form id="editCategoryForm" onSubmit={editFormMethods.handleSubmit(onEditCategorySubmit)}>
            <div style={{ display: activeEditTab === 'general' ? 'block' : 'none' }}>
              <div className="flex flex-col gap-4">
                <FormItem label={<div>Category Name<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.name} errorMessage={editFormMethods.formState.errors.name?.message} isRequired> <Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /> </FormItem>
                <FormItem label={<div>Slug/URL<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.slug} errorMessage={editFormMethods.formState.errors.slug?.message} isRequired> <Controller name="slug" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /> </FormItem>
                <FormItem label="Parent Category" invalid={!!editFormMethods.formState.errors.parent_category} errorMessage={editFormMethods.formState.errors.parent_category?.message as string}> <Controller name="parent_category" control={editFormMethods.control} render={({ field }) => <UiSelect placeholder="Select Parent or None" options={parentCategoryOptions} value={parentCategoryOptions.find(opt => opt.value === field.value)} onChange={option => field.onChange(option ? option.value : null)} isClearable />} /> </FormItem>

                <div className="flex gap-2">
                  <FormItem className="w-full" label={<div>Web Icon (467 X 250)<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.web_icon} errorMessage={editFormMethods.formState.errors.web_icon?.message as string}>
                    <Controller name="web_icon" control={editFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) =>
                      <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0] || null;
                        onChange(file);
                        if (editWebIconPreview && !editingCategory?.webIconFullPath?.includes(editWebIconPreview)) URL.revokeObjectURL(editWebIconPreview);
                        setEditWebIconPreview(file ? URL.createObjectURL(file) : (editingCategory?.webIconFullPath || null));
                      }} accept="image/*" />} />
                    {!editWebIconPreview && editingCategory?.webIconFullPath && <small className="text-xs text-gray-500">Current icon will be kept if no new file is uploaded.</small>}
                  </FormItem>
                  {editWebIconPreview && <div className="mb-2"><Avatar src={editWebIconPreview} size={70} className="rounded-sm" icon={<TbPhoto />} /></div>}
                </div>
                <div className="flex gap-2">
                  <FormItem className="w-full" label={<div>Mobile Icon (500 X 500)<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.mobile_icon} errorMessage={editFormMethods.formState.errors.mobile_icon?.message as string}>
                    <Controller name="mobile_icon" control={editFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) =>
                      <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0] || null;
                        onChange(file);
                        if (editMobileIconPreview && !editingCategory?.mobileIconFullPath?.includes(editMobileIconPreview)) URL.revokeObjectURL(editMobileIconPreview);
                        setEditMobileIconPreview(file ? URL.createObjectURL(file) : (editingCategory?.mobileIconFullPath || null));
                      }} accept="image/*" />} />
                    {!editMobileIconPreview && editingCategory?.mobileIconFullPath && <small className="text-xs text-gray-500">Current icon will be kept if no new file is uploaded.</small>}
                  </FormItem>
                  {editMobileIconPreview && <div className="mb-2"><Avatar src={editMobileIconPreview} size={70} className="rounded-sm" icon={<TbPhoto />} /></div>}
                </div>

                <FormItem
                  label={<div>Category Banner (Recommended: 1920x400)<span className="text-red-500"> * </span></div>}
                  invalid={!!editFormMethods.formState.errors.category_icon}
                  errorMessage={editFormMethods.formState.errors.category_icon?.message as string}
                >
                  {editBannerPreview && <div className="mb-2 border border-gray-200 rounded-md"><img src={editBannerPreview} alt="Banner Preview" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px' }} /></div>}
                  <Controller name="category_icon" control={editFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) =>
                    <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0] || null;
                      onChange(file);
                      if (editBannerPreview && !editingCategory?.bannerIconFullPath?.includes(editBannerPreview)) URL.revokeObjectURL(editBannerPreview);
                      setEditBannerPreview(file ? URL.createObjectURL(file) : (editingCategory?.bannerIconFullPath || null));
                    }} accept="image/*" />} />
                  {!editBannerPreview && editingCategory?.bannerIconFullPath && <small className="text-xs text-gray-500">Current banner will be kept if no new file is uploaded.</small>}
                </FormItem>
                <div className="grid grid-cols-2 gap-2">
                  <FormItem label="Show on Home Page?" invalid={!!editFormMethods.formState.errors.show_home_page} errorMessage={editFormMethods.formState.errors.show_home_page?.message} isRequired> <Controller name="show_home_page" control={editFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
                  <FormItem label="Show in Header?" invalid={!!editFormMethods.formState.errors.show_header} errorMessage={editFormMethods.formState.errors.show_header?.message} isRequired> <Controller name="show_header" control={editFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormItem label="Coming Soon?" invalid={!!editFormMethods.formState.errors.comingsoon} errorMessage={editFormMethods.formState.errors.comingsoon?.message} isRequired> <Controller name="comingsoon" control={editFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
                  <FormItem label="Status" invalid={!!editFormMethods.formState.errors.status} errorMessage={editFormMethods.formState.errors.status?.message} isRequired> <Controller name="status" control={editFormMethods.control} render={({ field }) => <UiSelect options={apiCategoryStatusOptions} value={apiCategoryStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
                </div>
              </div>
            </div>
            <div style={{ display: activeEditTab === 'meta' ? 'block' : 'none' }}>
                <div className="flex flex-col gap-4">
                  <FormItem label={<div>Meta Title<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.meta_title} errorMessage={editFormMethods.formState.errors.meta_title?.message}> <Controller name="meta_title" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /> </FormItem>
                  <FormItem label={<div>Meta Description<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.meta_descr} errorMessage={editFormMethods.formState.errors.meta_descr?.message}> <Controller name="meta_descr" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea />} /> </FormItem>
                  <FormItem label="Meta Keywords" invalid={!!editFormMethods.formState.errors.meta_keyword} errorMessage={editFormMethods.formState.errors.meta_keyword?.message}> <Controller name="meta_keyword" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /> </FormItem>
                </div>
            </div>
          </Form>
        </div>
      </Drawer>

      {/* Filter Categories Drawer */}
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button> <Button size="sm" variant="solid" form="filterCategoryForm" type="submit">Apply</Button> </div>}
      >
        <Form id="filterCategoryForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          {/* <FormItem label="Name"> <Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Names" options={categoryNameOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /> </FormItem> */}
          <FormItem label="Parent Category"> <Controller name="filterParentIds" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Parent Categories" options={parentCategoryOptions.filter(opt => opt.value !== null)} value={field.value || []} onChange={val => field.onChange(val || [])} />} /> </FormItem>
          <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={uiCategoryStatusOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /> </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteOpen} type="danger" title="Delete Category"
        onClose={() => { setSingleDeleteOpen(false); setCategoryToDelete(null); }}
        onRequestClose={() => { setSingleDeleteOpen(false); setCategoryToDelete(null); }}
        onCancel={() => { setSingleDeleteOpen(false); setCategoryToDelete(null); }}
        confirmButtonColor="red-600" onConfirm={onConfirmSingleDeleteCategory} loading={isProcessing}
      ><p>Are you sure you want to delete the category "<strong>{categoryToDelete?.name}</strong>"? This action cannot be undone.</p></ConfirmDialog>

      <Dialog
        isOpen={isViewDetailModalOpen}
        onClose={closeViewDetailModal}
        onRequestClose={closeViewDetailModal}
        width={600}
        contentClassName="!p-0 bg-slate-50 dark:bg-gray-800 rounded-xl shadow-2xl"
      >
        {categoryToView ? (
          <div className="flex flex-col max-h-[90vh]">
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="p-4 bg-white dark:bg-slate-700/60 rounded-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {categoryToView.webIconFullPath && (
                      <Avatar
                        size={48}
                        shape="rounded"
                        src={categoryToView.webIconFullPath}
                        icon={<TbCategory />}
                        className="border dark:border-slate-600 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                        onClick={() => openImageViewer(categoryToView.webIconFullPath)}
                      />
                    )}
                    <div>
                      <h5 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        {categoryToView.name}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ID: {String(categoryToView.id).padStart(6, '0')}
                      </p>
                    </div>
                      <Tag className={`${categoryStatusColor[categoryToView.status]} capitalize font-semibold border-0 text-[11px] px-2.5 py-1 rounded-full`}>
                        {categoryToView.status}
                      </Tag>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                  {categoryToView.mobileIconFullPath && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mobile Icon</p>
                      <div className="flex justify-center items-center p-2 bg-slate-100 dark:bg-slate-800/50 rounded-md">
                        <Avatar
                          size={80}
                          shape="rounded"
                          src={categoryToView.mobileIconFullPath}
                          icon={<TbPhoto />}
                          className="border dark:border-slate-300 dark:border-slate-600 cursor-pointer"
                          onClick={() => openImageViewer(categoryToView.mobileIconFullPath)}
                        />
                      </div>
                    </div>
                  )}
                  {categoryToView.bannerIconFullPath && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Banner Preview</p>
                      <div className="flex justify-center items-center p-2 bg-slate-100 dark:bg-slate-800/50 rounded-md">
                        <img
                          src={categoryToView.bannerIconFullPath}
                          alt="Category Banner"
                          className="w-auto h-20 object-contain cursor-pointer"
                          onClick={() => openImageViewer(categoryToView.bannerIconFullPath)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-700/60 rounded-lg shadow-sm">
                <h6 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Settings</h6>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DialogDetailRow label="Show in Header" value={categoryToView.showHeader === 1 ? 'Yes' : 'No'} />
                  <DialogDetailRow label="Show on Home" value={categoryToView.showHomePage === 1 ? 'Yes' : 'No'} />
                  <DialogDetailRow label="Coming Soon" value={categoryToView.comingSoon === 1 ? 'Yes' : 'No'} />
                  {categoryToView.showPageName && <DialogDetailRow label="Display Page" value={categoryToView.showPageName} />}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-700/60 rounded-lg shadow-sm">
                <h6 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">Details</h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DialogDetailRow label="Parent Category" value={categoryToView.parentCategoryName || '—'} />
                  <DialogDetailRow label="Slug / URL" value={categoryToView.slug} isLink />
                  <DialogDetailRow label="Created" value={new Date(categoryToView.createdAt).toLocaleString()} />
                  <DialogDetailRow label="Last Updated" value={new Date(categoryToView.updatedAt).toLocaleString()} />
                </div>
              </div>

              {(categoryToView.metaTitle || categoryToView.metaDescription || categoryToView.metaKeyword) && (
                <div className="p-4 bg-white dark:bg-slate-700/60 rounded-lg shadow-sm">
                  <h6 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">SEO & Meta</h6>
                  <div className="space-y-3">
                    <DialogDetailRow label="Meta Title" value={categoryToView.metaTitle || '—'} />
                    <DialogDetailRow label="Meta Description" value={categoryToView.metaDescription || '—'} />
                    <DialogDetailRow label="Meta Keywords" value={categoryToView.metaKeyword || '—'} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
            <TbInfoCircle size={42} className="text-slate-400 dark:text-slate-500 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No Category Information</p>
            <p className="text-xs text-slate-500 mt-1">Details for this category could not be loaded.</p>
          </div>
        )}
      </Dialog>

      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} title="Category Image" width={600}>
        <div className="flex justify-center items-center p-4"> {imageToView ? <img src={imageToView} alt="Category Image Full View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} /> : <p>No image.</p>} </div>
      </Dialog>
      
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
        confirmButtonProps={{
          disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason,
        }}
      >
        <Form
          id="exportReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
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
      
      <Dialog
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
        onRequestClose={closeImportModal}
        width={600}
        title="Import Categories from CSV/Excel"
        contentClass="overflow-visible"
      >
        <div className="py-4">
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-300">
            Select a CSV or Excel file to import categories.
          </p>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Required headers:{" "}
            <code>name, slug, parent_category_id, show_home_page, status, etc.</code>
          </p>
          <FormItem label="Upload File" className="mb-4">
            <Input
              type="file"
              name="file"
              accept=".csv, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              prefix={<TbFileText className="text-xl text-gray-400" />}
            />
            {selectedFile && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Selected:{" "}
                <span className="font-semibold">{selectedFile.name}</span> (
                {(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </FormItem>
          <div className="mt-3 mb-4">
            <a
              href="/sample-category-import-template.csv"
              download="sample-category-import-template.csv"
              className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
            >
              <TbCloudDownload /> Download Sample CSV Template
            </a>
          </div>
          <div className="text-right w-full flex justify-end gap-2">
            <Button
              variant="plain"
              onClick={closeImportModal}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              onClick={handleImportSubmit}
              loading={isImporting}
              disabled={!selectedFile || isImporting}
              icon={isImporting ? null : <TbCloudUpload />}
            >
              {isImporting ? "Importing..." : "Upload & Import"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
export default Categories;