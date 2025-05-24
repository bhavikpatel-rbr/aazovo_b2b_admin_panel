import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Avatar from "@/components/ui/Avatar";

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
  Card, // Make sure Card is imported if used in View Dialog
  Select as UiSelect,
  Tag,
  Dialog,
  Select,
} from "@/components/ui";

// Icons
import {
  TbPencil,
  TbEye,
  TbTrash, // For delete action
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbCategory, // Or TbCategory for categories
  TbBox, // Fallback icon
  TbInfoCircle, // For empty states or info
  // Icons for Detail Rows (if you add them)
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
  TbCloudDownload, // For not found
} from "react-icons/tb";

// Types for Categories (as per your first file)
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useAppDispatch } from "@/reduxtool/store"; // MODIFY_PATH
import {
  getCategoriesAction,
  addCategoryAction,
  editCategoryAction,
  deleteCategoryAction,
  deleteAllCategoriesAction,
  // changeCategoryStatusAction,
} from "@/reduxtool/master/middleware"; // MODIFY_PATH
import { masterSelector } from "@/reduxtool/master/masterSlice"; // MODIFY_PATH
import { useSelector } from "react-redux";

// --- Type Definitions (Categories) ---
type ApiCategoryItem = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  parent_category: string | number | null;
  show_home_page: string | number;
  show_header: string | number;
  show_page_name: string | null;
  status: "Active" | "Disabled"; // Changed 'Inactive' to 'Disabled' to match schema
  meta_title: string | null;
  meta_descr: string | null;
  meta_keyword: string | null;
  comingsoon?: string | number;
  created_at: string;
  updated_at: string;
  icon_full_path?: string;
  parent_category_name?: string;
};
export type CategoryStatus = "active" | "disabled";
export type CategoryItem = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  icon_full_path: string | null;
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
  icon: z.union([z.instanceof(File), z.null()]).optional().nullable(),
  show_home_page: z
    .enum(["0", "1"], { errorMap: () => ({ message: "Please select." }) })
    .transform((val) => Number(val)),
  show_header: z
    .enum(["0", "1"], { errorMap: () => ({ message: "Please select." }) })
    .transform((val) => Number(val)),
  status: z.enum(["Active", "Disabled"], {
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
type FilterCategoryFormData = z.infer<typeof filterFormCategorySchema>; // Consistent naming

// --- CSV Export (Categories) ---
const CSV_HEADERS_CATEGORY = [
  "ID", "Name", "Slug", "Icon URL", "Parent ID", "Parent Name",
  "Show Home", "Show Header", "Show Page Name", "Coming Soon", "Status",
  "Meta Title", "Meta Desc", "Meta Keyword", "Created At", "Updated At",
];
type CategoryCsvItem = {
  id: number; name: string; slug: string; icon_full_path: string | null;
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
    id: item.id, name: item.name, slug: item.slug, icon_full_path: item.icon_full_path,
    parentId: item.parentId, parentCategoryName: item.parentCategoryName,
    showHomePage: item.showHomePage, showHeader: item.showHeader, showPageName: item.showPageName,
    comingSoon: item.comingSoon, status: item.status, metaTitle: item.metaTitle,
    metaDescription: item.metaDescription, metaKeyword: item.metaKeyword,
    createdAt: new Date(item.createdAt).toLocaleString(),
    updatedAt: new Date(item.updatedAt).toLocaleString(),
  }));
  const csvKeys: (keyof CategoryCsvItem)[] = [
    "id", "name", "slug", "icon_full_path", "parentId", "parentCategoryName",
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
const CATEGORY_ICON_BASE_URL = import.meta.env.VITE_API_URL_STORAGE || "https://your-api-domain.com/storage/category_icons/";
const categoryStatusColor: Record<CategoryStatus, string> = { // Renamed for clarity
  active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  disabled: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-100", // Using rose for disabled
};
const uiCategoryStatusOptions: { value: CategoryStatus; label: string }[] = [ // Renamed
  { value: "active", label: "Active" },
  { value: "disabled", label: "Disabled" },
];
const apiCategoryStatusOptions: { value: "Active" | "Disabled"; label: string }[] = [ // Renamed
  { value: "Active", label: "Active" },
  { value: "Disabled", label: "Disabled" },
];
const yesNoOptions: { value: "0" | "1"; label: string }[] = [
  { value: "1", label: "Yes" },
  { value: "0", label: "No" },
];

// --- Helper Components (Categories) ---

// ActionColumn specific for Categories (Edit, View, Delete)
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
      <Tooltip title="Delete">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400`}
          role="button"
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip>
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
  onSearchChange, onFilter, onExport, onImport,
}: {
  onSearchChange: (query: string) => void; onFilter: () => void;
  onExport: () => void; onImport: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <CategorySearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudDownload />} onClick={onImport} className="w-full sm:w-auto">Import</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

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

// Helper for View Dialog
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
  const [statusChangeConfirmOpen, setStatusChangeConfirmOpen] = useState(false);
  const [categoryForStatusChange, setCategoryForStatusChange] = useState<CategoryItem | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterCategoryFormData>({
    filterNames: [], filterStatuses: [], filterParentIds: [],
  });

  const [addFormPreviewUrl, setAddFormPreviewUrl] = useState<string | null>(null);
  const [editFormPreviewUrl, setEditFormPreviewUrl] = useState<string | null>(null);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  // State for View Detail Modal
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);
  const [categoryToView, setCategoryToView] = useState<CategoryItem | null>(null); // Specific for category

  const { CategoriesData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector);

  useEffect(() => { dispatch(getCategoriesAction()); }, [dispatch]);
  useEffect(() => {
    return () => {
      if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl);
      if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl);
    };
  }, [addFormPreviewUrl, editFormPreviewUrl]);

  const defaultCategoryFormValues: Omit<CategoryFormData, "show_home_page" | "show_header" | "comingsoon"> &
  { show_home_page: "0" | "1"; show_header: "0" | "1"; comingsoon: "0" | "1"; icon: null; parent_category: null; } = {
    name: "", slug: "", parent_category: null, icon: null, show_home_page: "0", show_header: "0",
    status: "Active", meta_title: null, meta_descr: null, meta_keyword: null,
    comingsoon: "0", show_page_name: null,
  };

  const addFormMethods = useForm<CategoryFormData>({ resolver: zodResolver(categoryFormSchema), defaultValues: defaultCategoryFormValues, mode: "onChange" });
  const editFormMethods = useForm<CategoryFormData>({ resolver: zodResolver(categoryFormSchema), defaultValues: defaultCategoryFormValues, mode: "onChange" });
  const filterFormMethods = useForm<FilterCategoryFormData>({ resolver: zodResolver(filterFormCategorySchema), defaultValues: filterCriteria });

  const parentCategoryOptions = useMemo(() => {
    if (!Array.isArray(CategoriesData)) return [{ value: null, label: "No Parent Category" }];
    const options = CategoriesData.filter(cat => !editingCategory || cat.id !== editingCategory.id)
      .map((cat: ApiCategoryItem) => ({ value: cat.id, label: cat.name, })); // Use ApiCategoryItem here if CategoriesData is raw
    return [{ value: null, label: "No Parent Category" }, ...options];
  }, [CategoriesData, editingCategory]);

  const mappedCategories: CategoryItem[] = useMemo(() => {
    if (!Array.isArray(CategoriesData)) return [];
    const categoriesMap = new Map<number, string>();
    CategoriesData.forEach((cat: ApiCategoryItem) => categoriesMap.set(cat.id, cat.name));

    return CategoriesData.map((apiItem: ApiCategoryItem): CategoryItem => {
      let fullPath: string | null = null;
      if (apiItem.icon_full_path) fullPath = apiItem.icon_full_path;
      else if (apiItem.icon) {
        if (apiItem.icon.startsWith("http://") || apiItem.icon.startsWith("https://")) fullPath = apiItem.icon;
        else fullPath = `${CATEGORY_ICON_BASE_URL}${apiItem.icon.startsWith("/") ? apiItem.icon.substring(1) : apiItem.icon}`;
      }
      const parentId = apiItem.parent_category ? Number(apiItem.parent_category) : null;
      return {
        id: apiItem.id, name: apiItem.name, slug: apiItem.slug, icon: apiItem.icon,
        icon_full_path: fullPath, parentId: parentId,
        parentCategoryName: parentId ? categoriesMap.get(parentId) || "Unknown" : undefined,
        showHomePage: Number(apiItem.show_home_page), showHeader: Number(apiItem.show_header),
        showPageName: apiItem.show_page_name,
        status: apiItem.status === "Active" ? "active" : "disabled",
        metaTitle: apiItem.meta_title, metaDescription: apiItem.meta_descr,
        metaKeyword: apiItem.meta_keyword, comingSoon: Number(apiItem.comingsoon || 0),
        createdAt: apiItem.created_at, updatedAt: apiItem.updated_at,
      };
    });
  }, [CategoriesData]);


  const openAddCategoryDrawer = () => { addFormMethods.reset(defaultCategoryFormValues); setAddFormPreviewUrl(null); setAddDrawerOpen(true); };
  const closeAddCategoryDrawer = () => { setAddDrawerOpen(false); if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl); setAddFormPreviewUrl(null); };
  const onAddCategorySubmit = async (data: CategoryFormData) => {
    setSubmitting(true); const formData = new FormData();
    (Object.keys(data) as Array<keyof CategoryFormData>).forEach((key) => {
      const value = data[key];
      if (key === "icon") { if (value instanceof File) formData.append(key, value); }
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
      name: category.name, slug: category.slug, parent_category: category.parentId, icon: null,
      show_home_page: String(category.showHomePage) as "0" | "1",
      show_header: String(category.showHeader) as "0" | "1",
      status: category.status === "active" ? "Active" : "Disabled",
      meta_title: category.metaTitle || null, meta_descr: category.metaDescription || null,
      meta_keyword: category.metaKeyword || null,
      comingsoon: String(category.comingSoon) as "0" | "1",
      show_page_name: category.showPageName || null,
    });
    setEditFormPreviewUrl(null); setEditDrawerOpen(true);
  };
  const closeEditCategoryDrawer = () => { setEditDrawerOpen(false); setEditingCategory(null); if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl); setEditFormPreviewUrl(null); };
  const onEditCategorySubmit = async (data: CategoryFormData) => {
    if (!editingCategory) return; setSubmitting(true); const formData = new FormData(); formData.append("_method", "PUT");
    (Object.keys(data) as Array<keyof CategoryFormData>).forEach((key) => {
      const value = data[key];
      if (key === "icon") { if (value instanceof File) formData.append(key, value); }
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

  // Functions for View Detail Modal
  const openViewDetailModal = useCallback((category: CategoryItem) => {
    setCategoryToView(category);
    setIsViewDetailModalOpen(true);
  }, []);
  const closeViewDetailModal = useCallback(() => {
    setIsViewDetailModalOpen(false);
    setCategoryToView(null);
  }, []);


  const openFilterDrawer = () => { filterFormMethods.reset(filterCriteria); setFilterDrawerOpen(true); };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterCategoryFormData) => { setFilterCriteria(data); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); };
  const onClearFilters = () => { const defaultFilters = { filterNames: [], filterStatuses: [], filterParentIds: [] }; filterFormMethods.reset(defaultFilters); setFilterCriteria(defaultFilters); handleSetTableData({ pageIndex: 1 }); };

  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<CategoryItem[]>([]);
  const categoryNameOptions = useMemo(() => {
    if (!Array.isArray(mappedCategories)) return [];
    const uniqueNames = new Set(mappedCategories.map((cat) => cat.name));
    return Array.from(uniqueNames).sort((a, b) => a.localeCompare(b)).map((name) => ({ value: name, label: name }));
  }, [mappedCategories]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: CategoryItem[] = cloneDeep(mappedCategories);
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

  const handleExportData = () => { const success = exportToCsvCategory("categories_export.csv", allFilteredAndSortedData); if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>); };
  const handleImportData = () => { setImportDialogOpen(true); };
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
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
    { header: "ID", accessorKey: "id", enableSorting: true, size: 60, meta: { tdClass: "text-center", thClass: "text-center" } },
    {
      header: "Name", accessorKey: "name", enableSorting: true,
      cell: (props) => {
        const { icon_full_path, name } = props.row.original;
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <Avatar size={30} shape="circle" src={icon_full_path || undefined} icon={<TbBox />}
              className={icon_full_path ? "cursor-pointer hover:ring-2 hover:ring-indigo-500" : ""}
              onClick={() => icon_full_path && openImageViewer(icon_full_path)}
            >{!icon_full_path && name ? name.charAt(0).toUpperCase() : ""}</Avatar>
            <span>{name}</span>
          </div>
        );
      },
    },
    { header: "Parent Category", accessorKey: "parentCategoryName", enableSorting: true, cell: (props) => props.row.original.parentCategoryName || <span className="text-gray-400 dark:text-gray-500">-</span> },
    {
      header: "Status", accessorKey: "status", enableSorting: true,
      cell: (props) => { const status = props.row.original.status; return <Tag className={`${categoryStatusColor[status]} capitalize font-semibold border-0`}>{status}</Tag>; },
    },
    {
      header: "Actions", id: "action", size: 120, // Adjusted for 3 icons
      meta: { HeaderClass: "text-center" },
      cell: (props) => (
        <CategoryActionColumn
          onEdit={() => openEditCategoryDrawer(props.row.original)}
          onViewDetail={() => openViewDetailModal(props.row.original)}
          onDelete={() => handleDeleteCategoryClick(props.row.original)}
        />
      ),
    },
  ], [openImageViewer, openEditCategoryDrawer, openViewDetailModal, handleDeleteCategoryClick]); // Dependencies for memo


  const tableLoading = masterLoadingStatus === "loading" || isSubmitting || isProcessing;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Categories</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddCategoryDrawer}>Add New</Button>
          </div>
          <CategoryTableTools
            onSearchChange={handleSearchChange} onFilter={openFilterDrawer}
            onExport={handleExportData} onImport={handleImportData}
          />
          <div className="mt-4 flex-grow overflow-y-auto">
            <CategoryTable
              columns={columns} data={pageData} loading={tableLoading}
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
      <Drawer title="Add Category" isOpen={isAddDrawerOpen} onClose={closeAddCategoryDrawer} onRequestClose={closeAddCategoryDrawer}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={closeAddCategoryDrawer} disabled={isSubmitting}>Cancel</Button> <Button size="sm" variant="solid" form="addCategoryForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}> {isSubmitting ? "Adding..." : "Save"} </Button> </div>}
      >
        <Form id="addCategoryForm" onSubmit={addFormMethods.handleSubmit(onAddCategorySubmit)} className="flex flex-col gap-4">
          <FormItem label="Category Name" invalid={!!addFormMethods.formState.errors.name} errorMessage={addFormMethods.formState.errors.name?.message} isRequired> <Controller name="name" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Category Name" />} /> </FormItem>
          <FormItem label="Slug" invalid={!!addFormMethods.formState.errors.slug} errorMessage={addFormMethods.formState.errors.slug?.message} isRequired> <Controller name="slug" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter category-slug" />} /> </FormItem>
          <FormItem label="Parent Category" invalid={!!addFormMethods.formState.errors.parent_category} errorMessage={addFormMethods.formState.errors.parent_category?.message as string}> <Controller name="parent_category" control={addFormMethods.control} render={({ field }) => <UiSelect placeholder="Select Parent or None" options={parentCategoryOptions} value={parentCategoryOptions.find(opt => opt.value === field.value)} onChange={option => field.onChange(option ? option.value : null)} isClearable />} /> </FormItem>
          <FormItem label="Web Icon (467 X 250)" invalid={!!addFormMethods.formState.errors.icon} errorMessage={addFormMethods.formState.errors.icon?.message as string}> <Controller name="web-icon" control={addFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) => <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0] || null; onChange(file); if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl); setAddFormPreviewUrl(file ? URL.createObjectURL(file) : null); }} accept="image/*" />} /> {addFormPreviewUrl && <div className="mt-2"><Avatar src={addFormPreviewUrl} size={80} shape="rounded" icon={<TbCategory />} /></div>} </FormItem>
          <FormItem label="Mobile Icon (500 X 500)" invalid={!!addFormMethods.formState.errors.icon} errorMessage={addFormMethods.formState.errors.icon?.message as string}> <Controller name="mobile-icon" control={addFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) => <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0] || null; onChange(file); if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl); setAddFormPreviewUrl(file ? URL.createObjectURL(file) : null); }} accept="image/*" />} /> {addFormPreviewUrl && <div className="mt-2"><Avatar src={addFormPreviewUrl} size={80} shape="rounded" icon={<TbCategory />} /></div>} </FormItem>
          <FormItem label="Category Banner (500 X 500)" invalid={!!addFormMethods.formState.errors.icon} errorMessage={addFormMethods.formState.errors.icon?.message as string}> <Controller name="category-banner" control={addFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) => <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0] || null; onChange(file); if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl); setAddFormPreviewUrl(file ? URL.createObjectURL(file) : null); }} accept="image/*" />} /> {addFormPreviewUrl && <div className="mt-2"><Avatar src={addFormPreviewUrl} size={80} shape="rounded" icon={<TbCategory />} /></div>} </FormItem>
          <FormItem label="Show on Home Page?" invalid={!!addFormMethods.formState.errors.show_home_page} errorMessage={addFormMethods.formState.errors.show_home_page?.message} isRequired> <Controller name="show_home_page" control={addFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
          <FormItem label="Show in Header?" invalid={!!addFormMethods.formState.errors.show_header} errorMessage={addFormMethods.formState.errors.show_header?.message} isRequired> <Controller name="show_header" control={addFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
          <FormItem label="Coming Soon?" invalid={!!addFormMethods.formState.errors.comingsoon} errorMessage={addFormMethods.formState.errors.comingsoon?.message} isRequired> <Controller name="comingsoon" control={addFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
          {/* <FormItem label="Show Page Name" invalid={!!addFormMethods.formState.errors.show_page_name} errorMessage={addFormMethods.formState.errors.show_page_name?.message}> <Controller name="show_page_name" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="e.g., Electronics Page" />} /> </FormItem> */}
          <FormItem label="Status" invalid={!!addFormMethods.formState.errors.status} errorMessage={addFormMethods.formState.errors.status?.message} isRequired> <Controller name="status" control={addFormMethods.control} render={({ field }) => <UiSelect options={apiCategoryStatusOptions} value={apiCategoryStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
          <FormItem style={{ fontWeight: "bold", color: "#000" }} label="Meta Options (Optional)"></FormItem>
          <FormItem label="Meta Title" invalid={!!addFormMethods.formState.errors.meta_title} errorMessage={addFormMethods.formState.errors.meta_title?.message}> <Controller name="meta_title" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Meta Title" />} /> </FormItem>
          <FormItem label="Meta Description" invalid={!!addFormMethods.formState.errors.meta_descr} errorMessage={addFormMethods.formState.errors.meta_descr?.message}> <Controller name="meta_descr" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Meta Description" />} /> </FormItem>
          <FormItem label="Meta Keywords" invalid={!!addFormMethods.formState.errors.meta_keyword} errorMessage={addFormMethods.formState.errors.meta_keyword?.message}> <Controller name="meta_keyword" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Meta Keywords (comma-separated)" textArea/>} /> </FormItem>
        </Form>
      </Drawer>

      {/* Edit Category Drawer */}
      <Drawer title="Edit Category" isOpen={isEditDrawerOpen} onClose={closeEditCategoryDrawer} onRequestClose={closeEditCategoryDrawer}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={closeEditCategoryDrawer} disabled={isSubmitting}>Cancel</Button> <Button size="sm" variant="solid" form="editCategoryForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}> {isSubmitting ? "Saving..." : "Save Changes"} </Button> </div>}
      >
        <Form id="editCategoryForm" onSubmit={editFormMethods.handleSubmit(onEditCategorySubmit)} className="flex flex-col gap-4">
          {editingCategory?.icon_full_path && !editFormPreviewUrl && <FormItem label="Current Icon"><Avatar size={80} src={editingCategory.icon_full_path} shape="rounded" icon={<TbCategory />} /></FormItem>}
          <FormItem label="Category Name" invalid={!!editFormMethods.formState.errors.name} errorMessage={editFormMethods.formState.errors.name?.message} isRequired> <Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /> </FormItem>
          <FormItem label="Slug" invalid={!!editFormMethods.formState.errors.slug} errorMessage={editFormMethods.formState.errors.slug?.message} isRequired> <Controller name="slug" control={editFormMethods.control} render={({ field }) => <Input {...field} />} /> </FormItem>
          <FormItem label="Parent Category" invalid={!!editFormMethods.formState.errors.parent_category} errorMessage={editFormMethods.formState.errors.parent_category?.message as string}> <Controller name="parent_category" control={editFormMethods.control} render={({ field }) => <UiSelect placeholder="Select Parent or None" options={parentCategoryOptions} value={parentCategoryOptions.find(opt => opt.value === field.value)} onChange={option => field.onChange(option ? option.value : null)} isClearable />} /> </FormItem>
          <FormItem label="New Icon (Optional)" invalid={!!editFormMethods.formState.errors.icon} errorMessage={editFormMethods.formState.errors.icon?.message as string}> <Controller name="icon" control={editFormMethods.control} render={({ field: { onChange, onBlur, name, ref } }) => <Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={e => { const file = e.target.files?.[0] || null; onChange(file); if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl); setEditFormPreviewUrl(file ? URL.createObjectURL(file) : null); }} accept="image/*" />} /> {editFormPreviewUrl && <div className="mt-2"><Avatar src={editFormPreviewUrl} size={80} shape="rounded" icon={<TbCategory />} /><p className="text-xs text-gray-500 mt-1">Preview of new icon.</p></div>} <p className="text-xs text-gray-500 mt-1">Leave blank to keep current icon.</p> </FormItem>
          <FormItem label="Show on Home Page?" invalid={!!editFormMethods.formState.errors.show_home_page} errorMessage={editFormMethods.formState.errors.show_home_page?.message} isRequired> <Controller name="show_home_page" control={editFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
          <FormItem label="Show in Header?" invalid={!!editFormMethods.formState.errors.show_header} errorMessage={editFormMethods.formState.errors.show_header?.message} isRequired> <Controller name="show_header" control={editFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
          <FormItem label="Coming Soon?" invalid={!!editFormMethods.formState.errors.comingsoon} errorMessage={editFormMethods.formState.errors.comingsoon?.message} isRequired> <Controller name="comingsoon" control={editFormMethods.control} render={({ field }) => <UiSelect options={yesNoOptions} value={yesNoOptions.find(opt => opt.value === String(field.value))} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
          {/* <FormItem label="Show Page Name" invalid={!!editFormMethods.formState.errors.show_page_name} errorMessage={editFormMethods.formState.errors.show_page_name?.message}> <Controller name="show_page_name" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /> </FormItem> */}
          <FormItem label="Status" invalid={!!editFormMethods.formState.errors.status} errorMessage={editFormMethods.formState.errors.status?.message} isRequired> <Controller name="status" control={editFormMethods.control} render={({ field }) => <UiSelect options={apiCategoryStatusOptions} value={apiCategoryStatusOptions.find(opt => opt.value === field.value)} onChange={opt => field.onChange(opt ? opt.value : undefined)} />} /> </FormItem>
          <FormItem style={{ fontWeight: "bold", color: "#000" }} label="Meta Options (Optional)"></FormItem>
          <FormItem label="Meta Title" invalid={!!editFormMethods.formState.errors.meta_title} errorMessage={editFormMethods.formState.errors.meta_title?.message}> <Controller name="meta_title" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /> </FormItem>
          <FormItem label="Meta Description" invalid={!!editFormMethods.formState.errors.meta_descr} errorMessage={editFormMethods.formState.errors.meta_descr?.message}> <Controller name="meta_descr" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea />} /> </FormItem>
          <FormItem label="Meta Keywords" invalid={!!editFormMethods.formState.errors.meta_keyword} errorMessage={editFormMethods.formState.errors.meta_keyword?.message}> <Controller name="meta_keyword" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /> </FormItem>
        </Form>
      </Drawer>

      {/* Filter Categories Drawer */}
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={<div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button> <Button size="sm" variant="solid" form="filterCategoryForm" type="submit">Apply</Button> </div>}
      >
        <Form id="filterCategoryForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Name"> <Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Names" options={categoryNameOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /> </FormItem>
          <FormItem label="Parent Category"> <Controller name="filterParentIds" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Parent Categories" options={parentCategoryOptions.filter(opt => opt.value !== null)} value={field.value || []} onChange={val => field.onChange(val || [])} />} /> </FormItem>
          <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={uiCategoryStatusOptions} value={field.value || []} onChange={val => field.onChange(val || [])} />} /> </FormItem>
          <FormItem label="Show in Home">
            <Controller name="show-in-home"  control={filterFormMethods.control} render={({field})=>
              <Select
                {...field} 
                isMulti
                placeholder="Select Yes or No"
                options={[
                  {label : "Yes", value: "Yes"},
                  {label : "No", value: "No"},
                ]}
              />
            }/>
          </FormItem>
          <FormItem label="Show in Header">
            <Controller name="show-in-header"  control={filterFormMethods.control} render={({field})=>
              <Select
                {...field} 
                isMulti
                placeholder="Select Yes or No"
                options={[
                  {label : "Yes", value: "Yes"},
                  {label : "No", value: "No"},
                ]}
              />
            }/>
          </FormItem>
        </Form>
      </Drawer>

      {/* Confirmation Dialogs */}
      <ConfirmDialog isOpen={singleDeleteOpen} type="danger" title="Delete Category"
        onClose={() => { setSingleDeleteOpen(false); setCategoryToDelete(null); }}
        onRequestClose={() => { setSingleDeleteOpen(false); setCategoryToDelete(null); }}
        onCancel={() => { setSingleDeleteOpen(false); setCategoryToDelete(null); }}
        confirmButtonColor="red-600" onConfirm={onConfirmSingleDeleteCategory} loading={isProcessing}
      ><p>Are you sure you want to delete the category "<strong>{categoryToDelete?.name}</strong>"? This action cannot be undone.</p></ConfirmDialog>
      {/* Status Change Confirm Dialog - Placeholder, implement if needed */}
      {/* <ConfirmDialog isOpen={statusChangeConfirmOpen} ... /> */}


      {/* Import Drawer (Placeholder) */}
      <Drawer title="Import Categories" isOpen={importDialogOpen} onClose={() => setImportDialogOpen(false)} onRequestClose={() => setImportDialogOpen(false)}>
        <div className="p-4"> <p className="mb-4">Upload a CSV file to import categories.</p> <Input type="file" accept=".csv" className="mt-2" onChange={e => { if (e.target.files?.[0]) { console.log("File for import:", e.target.files[0].name); toast.push(<Notification title="Import" type="info">File selected. Import processing to be implemented.</Notification>); } }} /> <div className="text-right mt-6"> <Button size="sm" variant="plain" onClick={() => setImportDialogOpen(false)} className="mr-2">Cancel</Button> <Button size="sm" variant="solid" onClick={() => { toast.push(<Notification title="Import" type="info">Import submission to be implemented.</Notification>); }}>Start Import</Button> </div> </div>
      </Drawer>

      {/* Image Viewer Dialog */}
      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer} shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} title="Category Icon" width={600}>
        <div className="flex justify-center items-center p-4"> {imageToView ? <img src={imageToView} alt="Category Icon Full View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} /> : <p>No image.</p>} </div>
      </Dialog>

      <Dialog
        isOpen={isViewDetailModalOpen}
        onClose={closeViewDetailModal}
        onRequestClose={closeViewDetailModal}
        size="sm"
        title=""
        contentClassName="!p-0 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-2xl"
      >
        {categoryToView ? (
          <div className="flex flex-col max-h-[90vh]">
            {/* Body */}
            <div className="p-4 space-y-3">
              <div className="p-3 bg-white dark:bg-slate-700/60 rounded-lg space-y-3">
                {/* Header: Icon + ID + Edit */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {categoryToView.icon_full_path && (
                      <Avatar
                        size={48}
                        shape="rounded"
                        src={categoryToView.icon_full_path}
                        icon={<TbCategory />}
                        className="border-2 border-white dark:border-slate-500 shadow"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {categoryToView.name}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">ID: {categoryToView.id}</p>
                    </div>
                  </div>
                </div>

                {/* Grid of Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <DialogDetailRow
                    label="Status"
                    value={
                      <Tag className={`${categoryStatusColor[categoryToView.status]} capitalize font-semibold border-0 text-[10px] px-2 py-0.5 rounded-full`}>
                        {categoryToView.status}
                      </Tag>
                    }
                  />
                  <DialogDetailRow
                    label="Show in Header"
                    value={categoryToView.showHeader === 1 ? 'Visible' : 'Hidden'}
                    valueClassName={categoryToView.showHeader === 1 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}
                  />
                  <DialogDetailRow
                    label="Show Home Page"
                    value={categoryToView.showHomePage === 1 ? 'Yes' : 'No'}
                    valueClassName={categoryToView.showHomePage === 1 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}
                  />
                  <DialogDetailRow
                    label="Coming Soon"
                    value={categoryToView.comingSoon === 1 ? 'Yes' : 'No'}
                    valueClassName={categoryToView.comingSoon === 1 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-300'}
                  />
                  <DialogDetailRow label="Parent Category" value={categoryToView.parentCategoryName || '-'} />
                  {categoryToView.showPageName && (
                    <DialogDetailRow label="Display Page Name" value={categoryToView.showPageName} />
                  )}
                  <DialogDetailRow label="Slug / URL" value={categoryToView.slug} isLink breakAll />
                  <DialogDetailRow
                    label="Created"
                    value={new Date(categoryToView.createdAt).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  />
                  <DialogDetailRow
                    label="Last Updated"
                    value={new Date(categoryToView.updatedAt).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  />
                </div>

                {/* SEO Section */}
                {(categoryToView.metaTitle || categoryToView.metaDescription || categoryToView.metaKeyword) && (
                  <div className="pt-2">
                    <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                      SEO & Meta
                    </h6>
                    <div className="text-sm text-slate-700 dark:text-slate-200 space-y-1">
                      {categoryToView.metaTitle && (
                        <p><span className="font-medium text-slate-500 dark:text-slate-400">Title:</span> {categoryToView.metaTitle}</p>
                      )}
                      {categoryToView.metaDescription && (
                        <p className="whitespace-pre-wrap"><span className="font-medium text-slate-500 dark:text-slate-400">Description:</span> {categoryToView.metaDescription}</p>
                      )}
                      {categoryToView.metaKeyword && (
                        <p><span className="font-medium text-slate-500 dark:text-slate-400">Keywords:</span> {categoryToView.metaKeyword}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center flex flex-col items-center justify-center" style={{ minHeight: '200px' }}>
            <TbInfoCircle size={42} className="text-slate-400 dark:text-slate-500 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No Category Information</p>
            <p className="text-xs text-slate-500 mt-1">Details for this category could not be loaded.</p>
            <div className="mt-5">
              <Button variant="solid" color="blue-600" onClick={closeViewDetailModal} size="sm">
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Dialog>


    </>
  );
};
export default Categories;