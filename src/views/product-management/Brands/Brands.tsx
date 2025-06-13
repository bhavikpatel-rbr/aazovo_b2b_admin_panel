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
  Card,
  Select as UiSelect,
  Tag,
  Dialog,
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
  // TbCloudDownload, // Assuming not used based on previous comment
  TbBuildingStore,
  TbBox,
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
  getBrandAction,
  addBrandAction,
  editBrandAction,
  deleteBrandAction,
  deleteAllBrandsAction,
  // changeBrandStatusAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";

type ApiBrandItem = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  show_header: string | number;
  status: "Active" | "Disabled";
  meta_title: string | null;
  meta_descr: string | null;
  meta_keyword: string | null;
  created_at: string;
  updated_at: string;
  mobile_no: string | null;
  icon_full_path?: string;
};

export type BrandStatus = "active" | "disabled";
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

const brandFormSchema = z.object({
  name: z
    .string()
    .min(1, "Brand name is required.")
    .max(255, "Name cannot exceed 255 chars."),
  slug: z
    .string()
    .min(1, "Slug is required.")
    .max(255, "Slug cannot exceed 255 chars."),
  mobile_no: z.string().optional().nullable(),
  icon: z
    .union([z.instanceof(File), z.null()])
    .optional()
    .nullable(),
  show_header: z
    .enum(["0", "1"], {
      errorMap: () => ({ message: "Please select if shown in header." }),
    })
    .transform((val) => Number(val)),
  status: z.enum(["Active", "Disabled"], {
    errorMap: () => ({ message: "Please select a status." }),
  }),
  meta_title: z
    .string()
    .max(255, "Meta title cannot exceed 255 chars.")
    .optional()
    .nullable(),
  meta_descr: z
    .string()
    .max(500, "Meta description cannot exceed 500 chars.")
    .optional()
    .nullable(),
  meta_keyword: z
    .string()
    .max(255, "Meta keywords cannot exceed 255 chars.")
    .optional()
    .nullable(),
});
type BrandFormData = z.infer<typeof brandFormSchema>;

const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatuses: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const CSV_HEADERS_BRAND = [
  "ID",
  "Name",
  "Slug",
  "Icon URL",
  "Show Header (1=Yes, 0=No)",
  "Status",
  "Meta Title",
  "Meta Description",
  "Meta Keywords",
  "Mobile No.",
  "Created At",
  "Updated At",
];
type BrandCsvItem = {
  id: number;
  name: string;
  slug: string;
  icon_full_path: string | null;
  showHeader: number;
  status: BrandStatus;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeyword: string | null;
  mobileNo: string | null;
  createdAt: string;
  updatedAt: string;
};

function exportToCsvBrand(filename: string, rows: BrandItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: BrandCsvItem[] = rows.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    icon_full_path: item.icon_full_path,
    showHeader: item.showHeader,
    status: item.status,
    metaTitle: item.metaTitle,
    metaDescription: item.metaDescription,
    metaKeyword: item.metaKeyword,
    mobileNo: item.mobileNo,
    createdAt: new Date(item.createdAt).toLocaleString(),
    updatedAt: new Date(item.updatedAt).toLocaleString(),
  }));
  const csvKeys: (keyof BrandCsvItem)[] = [
    "id", "name", "slug", "icon_full_path", "showHeader", "status",
    "metaTitle", "metaDescription", "metaKeyword", "mobileNo", "createdAt", "updatedAt",
  ];
  const separator = ",";
  const csvContent =
    CSV_HEADERS_BRAND.join(separator) +
    "\n" +
    transformedRows
      .map((row) =>
        csvKeys
          .map((k) => {
            let cellValue = row[k];
            if (cellValue === null || cellValue === undefined) cellValue = "";
            else cellValue = String(cellValue).replace(/"/g, '""');
            if (String(cellValue).search(/("|,|\n)/g) >= 0)
              cellValue = `"${cellValue}"`;
            return cellValue;
          })
          .join(separator)
      )
      .join("\n");
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
  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

const BRAND_ICON_BASE_URL =
  import.meta.env.VITE_API_URL_STORAGE || "https://your-api-domain.com/storage/";
const statusColor: Record<BrandStatus, string> = {
  active: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  disabled: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};
const uiStatusOptions: { value: BrandStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "disabled", label: "Inactive" },
];
const apiStatusOptions: { value: "Active" | "Disabled"; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Disabled", label: "Disabled" },
];
const showHeaderOptions: { value: "1" | "0"; label: string }[] = [
  { value: "1", label: "Yes" },
  { value: "0", label: "No" },
];

// --- ActionColumn ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
  onDelete, // Added onDelete
}: // onChangeStatus, // Kept for completeness, but not used in the simplified version
{
  onEdit: () => void;
  onViewDetail: () => void;
  onDelete: () => void; // Added onDelete
  // onChangeStatus: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-2"> {/* Adjusted gap */}
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

type BrandSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const BrandSearch = React.forwardRef<HTMLInputElement, BrandSearchProps>(
  ({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
BrandSearch.displayName = "BrandSearch";

const BrandTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onImport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onImport: () => void;
  onClearFilters: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <BrandSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Tooltip title="Clear Filters">
        <Button icon={<TbReload />} onClick={onClearFilters} title="Clear Filters"></Button>
      </Tooltip>
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">
        Filter
      </Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">
        Export
      </Button>
    </div>
  </div>
);

type BrandTableProps = {
  columns: ColumnDef<BrandItem>[];
  data: BrandItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: BrandItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: BrandItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<BrandItem>[]) => void;
};
const BrandTable = ({
  columns, data, loading, pagingData, selectedItems,
  onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect,
}: BrandTableProps) => (
  <DataTable
    selectable
    columns={columns}
    data={data}
    noData={!loading && data.length === 0}
    loading={loading}
    pagingData={pagingData}
    checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)}
    onPaginationChange={onPaginationChange}
    onSelectChange={onSelectChange}
    onSort={onSort}
    onCheckBoxChange={onRowSelect}
    onIndeterminateCheckBoxChange={onAllRowSelect}
  />
);

type BrandSelectedFooterProps = {
  selectedItems: BrandItem[];
  onDeleteSelected: () => void;
};
const BrandSelectedFooter = ({ selectedItems, onDeleteSelected }: BrandSelectedFooterProps) => {
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
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span>Brand{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={() => setDeleteOpen(true)}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Brand${selectedItems.length > 1 ? "s" : ""}`}
        onClose={() => setDeleteOpen(false)}
        onRequestClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteOpen(false);
        }}
      >
        <p>
          Are you sure you want to delete the selected brand{selectedItems.length > 1 ? "s" : ""}?
          This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

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
  const [statusChangeConfirmOpen, setStatusChangeConfirmOpen] = useState(false);
  const [brandForStatusChange, setBrandForStatusChange] = useState<BrandItem | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterStatuses: [],
  });

  const [addFormPreviewUrl, setAddFormPreviewUrl] = useState<string | null>(null);
  const [editFormPreviewUrl, setEditFormPreviewUrl] = useState<string | null>(null);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  // State for View Detail Modal
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);
  const [brandToView, setBrandToView] = useState<BrandItem | null>(null);

  const { BrandData = [], status: masterLoadingStatus = "idle" } = useSelector(masterSelector);

  useEffect(() => {
    dispatch(getBrandAction());
  }, [dispatch]); // Added dispatch to dependency array

  useEffect(() => {
    return () => {
      if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl);
      if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl);
    };
  }, [addFormPreviewUrl, editFormPreviewUrl]);

  const defaultBrandFormValues: Omit<BrandFormData, "show_header"> & {
    show_header: "0" | "1";
    icon: null;
  } = {
    name: "", slug: "", mobile_no: null, icon: null, show_header: "1",
    status: "Active", meta_title: null, meta_descr: null, meta_keyword: null,
  };

  const addFormMethods = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: defaultBrandFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: defaultBrandFormValues,
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const mappedBrands: BrandItem[] = useMemo(() => {
    if (!Array.isArray(BrandData)) return [];
    return BrandData.map((apiItem: ApiBrandItem): BrandItem => {
      let fullPath: string | null = null;
      if (apiItem.icon_full_path) {
        fullPath = apiItem.icon_full_path;
      } else if (apiItem.icon) {
        if (apiItem.icon.startsWith("http://") || apiItem.icon.startsWith("https://")) {
          fullPath = apiItem.icon;
        } else {
          fullPath = `${BRAND_ICON_BASE_URL}${apiItem.icon.startsWith("/") ? apiItem.icon.substring(1) : apiItem.icon}`;
        }
      }
      return {
        id: apiItem.id, name: apiItem.name, slug: apiItem.slug, icon: apiItem.icon,
        icon_full_path: fullPath, showHeader: Number(apiItem.show_header),
        status: apiItem.status === "Active" ? "active" : "disabled",
        metaTitle: apiItem.meta_title, metaDescription: apiItem.meta_descr,
        metaKeyword: apiItem.meta_keyword, createdAt: apiItem.created_at,
        updatedAt: apiItem.updated_at, mobileNo: apiItem.mobile_no,
      };
    });
  }, [BrandData]);

  const openAddDrawer = () => {
    addFormMethods.reset(defaultBrandFormValues);
    setAddFormPreviewUrl(null);
    setAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    setAddDrawerOpen(false);
    if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl);
    setAddFormPreviewUrl(null);
  };

  const onAddBrandSubmit = async (data: BrandFormData) => {
    setSubmitting(true);
    const formData = new FormData();
    (Object.keys(data) as Array<keyof BrandFormData>).forEach((key) => {
      const value = data[key];
      if (key === "icon") {
        if (value instanceof File) formData.append(key, value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });
    try {
      await dispatch(addBrandAction(formData)).unwrap();
      toast.push(<Notification title="Brand Added" type="success" duration={2000}>Brand "{data.name}" added.</Notification>);
      closeAddDrawer();
      dispatch(getBrandAction());
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Could not add brand.";
      toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{errorMessage}</Notification>);
      console.error("Add Brand Error:", error.response?.data || error);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDrawer = (brand: BrandItem) => {
    setEditingBrand(brand);
    editFormMethods.reset({
      name: brand.name, slug: brand.slug, mobile_no: brand.mobileNo || null, icon: null,
      show_header: String(brand.showHeader) as "0" | "1",
      status: brand.status === "active" ? "Active" : "Disabled",
      meta_title: brand.metaTitle || null, meta_descr: brand.metaDescription || null,
      meta_keyword: brand.metaKeyword || null,
    });
    setEditFormPreviewUrl(null);
    setEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditDrawerOpen(false);
    setEditingBrand(null);
    if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl);
    setEditFormPreviewUrl(null);
  };

  const onEditBrandSubmit = async (data: BrandFormData) => {
    if (!editingBrand || editingBrand.id === undefined || editingBrand.id === null) {
      toast.push(<Notification title="Error" type="danger">Cannot edit: Editing Brand ID is missing.</Notification>);
      setSubmitting(false);
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("_method", "PUT");
    (Object.keys(data) as Array<keyof BrandFormData>).forEach((key) => {
      const value = data[key];
      if (key === "icon") {
        if (value instanceof File) formData.append(key, value);
      } else {
        if (value === null) formData.append(key, "");
        else if (value !== undefined) formData.append(key, String(value));
      }
    });
    try {
      await dispatch(editBrandAction({ id: editingBrand.id, formData })).unwrap();
      toast.push(<Notification title="Brand Updated" type="success" duration={2000}>Brand "{data.name}" updated.</Notification>);
      closeEditDrawer();
      dispatch(getBrandAction());
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMessage = "Could not update brand.";
      if (responseData) {
        if (responseData.message) errorMessage = responseData.message;
        if (responseData.errors) {
          const validationErrors = Object.values(responseData.errors).flat().join(" ");
          errorMessage += ` Details: ${validationErrors}`;
        }
      } else if (error.message) errorMessage = error.message;
      toast.push(<Notification title="Failed to Update" type="danger" duration={4000}>{errorMessage}</Notification>);
      console.error("Edit Brand Error:", error.response || error, responseData);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (brand: BrandItem) => {
    setBrandToDelete(brand);
    console.log(brand);
    setSingleDeleteOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!brandToDelete) return;
    setIsProcessing(true);
    try {
      await dispatch(deleteBrandAction(brandToDelete.id)).unwrap();
      toast.push(<Notification title="Brand Deleted" type="success" duration={2000}>Brand "{brandToDelete.name}" deleted.</Notification>);
      setSelectedItems((prev) => prev.filter((item) => item.id !== brandToDelete!.id));
      dispatch(getBrandAction());
    } catch (error: any) {
      const errorMessage = error.message || `Could not delete brand.`;
      toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{errorMessage}</Notification>);
    } finally {
      setSingleDeleteOpen(false);
      setIsProcessing(false);
      setBrandToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);
    const idsToDelete = selectedItems.map((item) => item.id);
    try {
      await dispatch(deleteAllBrandsAction({ ids: idsToDelete.join(",") })).unwrap();
      toast.push(<Notification title="Brands Deleted" type="success" duration={2000}>{selectedItems.length} brand(s) deleted.</Notification>);
      setSelectedItems([]);
      dispatch(getBrandAction());
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete selected brands.";
      toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{errorMessage}</Notification>);
    } finally {
      setIsProcessing(false);
    }
  };

  const openChangeStatusDialog = (brand: BrandItem) => {
    setBrandForStatusChange(brand);
    setStatusChangeConfirmOpen(true);
  };
  const onConfirmChangeStatus = async () => {
    if (!brandForStatusChange) return;
    setIsProcessing(true);
    try {
      // await dispatch(changeBrandStatusAction({ id: brandForStatusChange.id, status: newApiStatus })).unwrap();
      toast.push(<Notification title="Status Update (Mock)" type="info" duration={2000}>Status update for "{brandForStatusChange.name}" to be implemented.</Notification>);
      // dispatch(getBrandAction());
    } catch (error: any) {
      const errorMessage = error.message || "Could not update status.";
      toast.push(<Notification title="Status Update Failed" type="danger" duration={3000}>{errorMessage}</Notification>);
    } finally {
      setStatusChangeConfirmOpen(false);
      setIsProcessing(false);
      setBrandForStatusChange(null);
    }
  };

  const handleClone = (brand: BrandItem) => {
    addFormMethods.reset({
      name: `${brand.name} (Copy)`, slug: `${brand.slug}-copy`, mobile_no: brand.mobileNo,
      icon: null, show_header: String(brand.showHeader) as "0" | "1",
      status: brand.status === "active" ? "Active" : "Disabled",
      meta_title: brand.metaTitle, meta_descr: brand.metaDescription, meta_keyword: brand.metaKeyword,
    });
    setAddFormPreviewUrl(null);
    setAddDrawerOpen(true);
    toast.push(<Notification title="Clone Brand" type="info">Cloning "{brand.name}". Please review and save.</Notification>);
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({ filterNames: data.filterNames || [], filterStatuses: data.filterStatuses || [] });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = { filterNames: [], filterStatuses: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  };

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "",
  });
  const [selectedItems, setSelectedItems] = useState<BrandItem[]>([]);

  const brandNameOptions = useMemo(() => {
    if (!Array.isArray(mappedBrands)) return [];
    const uniqueNames = new Set(mappedBrands.map((brand) => brand.name));
    return Array.from(uniqueNames).sort((a, b) => a.localeCompare(b)).map((name) => ({ value: name, label: name }));
  }, [mappedBrands]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: BrandItem[] = cloneDeep(mappedBrands);
    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedNames = filterCriteria.filterNames.map((opt) => opt.value.toLowerCase());
      processedData = processedData.filter((item) => selectedNames.includes(item.name.toLowerCase()));
    }
    if (filterCriteria.filterStatuses && filterCriteria.filterStatuses.length > 0) {
      const selectedStatuses = filterCriteria.filterStatuses.map((opt) => opt.value);
      processedData = processedData.filter((item) => selectedStatuses.includes(item.status));
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          item.slug?.toLowerCase().includes(query) ||
          String(item.id).toLowerCase().includes(query) ||
          item.mobileNo?.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      const sortKey = key as keyof BrandItem;
      processedData.sort((a, b) => {
        let aValue = a[sortKey]; let bValue = b[sortKey];
        if (sortKey === "createdAt" || sortKey === "updatedAt") {
          aValue = new Date(aValue as string).getTime(); bValue = new Date(bValue as string).getTime();
        } else if (sortKey === "id" || sortKey === "showHeader") {
          aValue = Number(aValue); bValue = Number(bValue);
        }
        if (aValue === null || aValue === undefined) aValue = "" as any;
        if (bValue === null || bValue === undefined) bValue = "" as any;
        if (typeof aValue === "string" && typeof bValue === "string")
          return order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        else if (typeof aValue === "number" && typeof bValue === "number")
          return order === "asc" ? aValue - bValue : bValue - aValue;
        return 0;
      });
    }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [mappedBrands, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsvBrand("brands_export.csv", allFilteredAndSortedData);
    if (success) toast.push(<Notification title="Export Successful" type="success">Data exported.</Notification>);
  };
  const handleImportData = () => setImportDialogOpen(true);
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => {
    handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
    setSelectedItems([]);
  }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: BrandItem) =>
    setSelectedItems((prev) => checked ? (prev.some((item) => item.id === row.id) ? prev : [...prev, row]) : prev.filter((item) => item.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<BrandItem>[]) => {
    const originals = currentRows.map((r) => r.original);
    if (checked) setSelectedItems((prev) => {
      const prevIds = new Set(prev.map((item) => item.id));
      return [...prev, ...originals.filter((r) => !prevIds.has(r.id))];
    });
    else {
      const currentIds = new Set(originals.map((r) => r.id));
      setSelectedItems((prev) => prev.filter((item) => !currentIds.has(item.id)));
    }
  }, []);

  const openImageViewer = (imageUrl: string | null) => {
    if (imageUrl) {
      setImageToView(imageUrl);
      setImageViewerOpen(true);
    }
  };
  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageToView(null);
  };

  // Open/Close View Detail Modal Functions
  const openViewDetailModal = useCallback((brand: BrandItem) => {
    setBrandToView(brand);
    setIsViewDetailModalOpen(true);
  }, []);
  const closeViewDetailModal = useCallback(() => {
    setIsViewDetailModalOpen(false);
    setBrandToView(null);
  }, []);

  const columns: ColumnDef<BrandItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 60, meta: { tdClass: "text-center", thClass: "text-center" } },
      {
        header: "Brand", accessorKey: "name", enableSorting: true,
        cell: (props) => {
          const { icon_full_path, name } = props.row.original;
          return (
            <div className="flex items-center gap-2 min-w-[200px]">
              <Avatar
                size={30} shape="circle" src={icon_full_path || undefined} icon={<TbBox />}
                className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
                onClick={() => icon_full_path && openImageViewer(icon_full_path)}
              >
                {!icon_full_path && name ? name.charAt(0).toUpperCase() : ""}
              </Avatar>
              <span>{name}</span>
            </div>
          );
        },
      },
      {
        header: "Mobile No", accessorKey: "mobileNo", enableSorting: true,
        cell: (props) => props.row.original.mobileNo ?? <span className="text-gray-400 dark:text-gray-500">-</span>,
      },
      {
        header: "Status", accessorKey: "status", enableSorting: true,
        cell: (props) => {
          const status = props.row.original.status;
          return <Tag className={`${statusColor[status]} capitalize font-semibold border-0`}>{status}</Tag>;
        },
      },
      {
        header: "Actions", id: "action", size: 120, // Adjusted size
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onViewDetail={() => openViewDetailModal(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            // onChangeStatus={() => openChangeStatusDialog(props.row.original)} // Kept if needed later
          />
        ),
      },
    ],
    [openImageViewer, openEditDrawer, openViewDetailModal, handleDeleteClick] // Removed mappedBrands, added dependencies
  );

  const tableLoading = masterLoadingStatus === "loading" || isSubmitting || isProcessing;
// Place this helper component inside your Brands.tsx file,
// or in a separate utility file and import it.

interface DialogDetailRowProps {
  label: string;
  value: string | React.ReactNode;
  isLink?: boolean;
  preWrap?: boolean;
  breakAll?: boolean;
  labelClassName?: string;
  valueClassName?: string;
  className?: string; // For the container div of each row
}

const DialogDetailRow: React.FC<DialogDetailRowProps> = ({
  label,
  value,
  isLink,
  preWrap,
  breakAll,
  labelClassName = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
  valueClassName = "text-sm text-slate-700 dark:text-slate-100 mt-0.5", // Added mt-0.5 for space below label
  className = "",
}) => (
  <div className={`py-1.5 ${className}`}> {/* Vertical padding for each row item */}
    <p className={`${labelClassName}`}>{label}</p>
    {isLink ? (
      <a
        href={typeof value === 'string' && (value.startsWith('http') ? value : `/${value}`) || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className={`${valueClassName} hover:underline text-blue-600 dark:text-blue-400 ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}
      >
        {value}
      </a>
    ) : (
      <div className={`${valueClassName} ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>
        {value}
      </div>
    )}
  </div>
);
  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Brands</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button>
          </div>
          <BrandTableTools
            onClearFilters={onClearFilters}
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onImport={handleImportData}
          />
          <div className="mt-4 flex-grow overflow-y-auto">
            <BrandTable
              columns={columns} data={pageData} loading={tableLoading}
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

      {/* Add Brand Drawer */}
      <Drawer
        title="Add Brand" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting}>Cancel</Button>
            <Button size="sm" variant="solid" form="addBrandForm" type="submit" loading={isSubmitting} disabled={!addFormMethods.formState.isValid || isSubmitting}>
              {isSubmitting ? "Adding..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form id="addBrandForm" onSubmit={addFormMethods.handleSubmit(onAddBrandSubmit)} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <FormItem 
              label={<div>Brand Icon (250 X 250)<span className="text-red-500"> * </span></div>} 
              invalid={!!addFormMethods.formState.errors.icon} 
              errorMessage={addFormMethods.formState.errors.icon?.message as string}
              className="w-full"
            >
              <Controller name="icon" control={addFormMethods.control}
                render={({ field: { onChange, onBlur, name, ref } }) => (
                  <Input type="file" name={name} ref={ref} onBlur={onBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
                      onChange(file);
                      if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl);
                      setAddFormPreviewUrl(file ? URL.createObjectURL(file) : null);
                    }}
                    accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
                  />
                )}
              />
            </FormItem>
            {addFormPreviewUrl && <div className="mt-2 text-right"><Avatar src={addFormPreviewUrl} size={70} shape="circle" /></div>}

          </div>
          <FormItem label={<div>Brand Name<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.name} errorMessage={addFormMethods.formState.errors.name?.message} isRequired>
            <Controller name="name" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Brand Name" />} />
          </FormItem>
          <FormItem label={<div>Slug/URL<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.slug} errorMessage={addFormMethods.formState.errors.slug?.message} isRequired>
            <Controller name="slug" control={addFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter brand-slug" />} />
          </FormItem>
          <FormItem label={<div>Mobile No.<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.mobile_no} errorMessage={addFormMethods.formState.errors.mobile_no?.message}>
            <Controller name="mobile_no" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Enter Mobile Number" />} />
          </FormItem>
          <div className="grid grid-cols-2 gap-2">
            <FormItem label="Show in Header?" invalid={!!addFormMethods.formState.errors.show_header} errorMessage={addFormMethods.formState.errors.show_header?.message} isRequired>
              <Controller name="show_header" control={addFormMethods.control}
                render={({ field }) => (
                  <UiSelect options={showHeaderOptions} value={showHeaderOptions.find((opt) => opt.value === field.value)} onChange={(opt) => field.onChange(opt ? opt.value : undefined)} />
                )}
              />
            </FormItem>
            <FormItem label="Status" invalid={!!addFormMethods.formState.errors.status} errorMessage={addFormMethods.formState.errors.status?.message} isRequired>
              <Controller name="status" control={addFormMethods.control}
                render={({ field }) => (
                  <UiSelect options={apiStatusOptions} value={apiStatusOptions.find((opt) => opt.value === field.value)} onChange={(opt) => field.onChange(opt ? opt.value : undefined)} />
                )}
              />
            </FormItem>
          </div>
          <FormItem style={{ fontWeight: "bold", color: "#000" }} label="Meta Options (Optional)"></FormItem>
          <FormItem label={<div>Meta Title<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.meta_title} errorMessage={addFormMethods.formState.errors.meta_title?.message}>
            <Controller name="meta_title" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Meta Title" />} />
          </FormItem>
          <FormItem label={<div>Meta Description<span className="text-red-500"> * </span></div>} invalid={!!addFormMethods.formState.errors.meta_descr} errorMessage={addFormMethods.formState.errors.meta_descr?.message}>
            <Controller name="meta_descr" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea placeholder="Meta Description" />} />
          </FormItem>
          <FormItem label="Meta Keywords" invalid={!!addFormMethods.formState.errors.meta_keyword} errorMessage={addFormMethods.formState.errors.meta_keyword?.message}>
            <Controller name="meta_keyword" control={addFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} placeholder="Meta Keywords (comma-separated)"/>} />
          </FormItem>
        </Form>
      </Drawer>

      {/* Edit Brand Drawer */}
      <Drawer
        title="Edit Brand" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer}
        width={480}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting}>Cancel</Button>
            <Button size="sm" variant="solid" form="editBrandForm" type="submit" loading={isSubmitting} disabled={!editFormMethods.formState.isValid || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form id="editBrandForm" onSubmit={editFormMethods.handleSubmit(onEditBrandSubmit)} className="flex flex-col gap-2">
          {editingBrand?.icon_full_path && !editFormPreviewUrl && (
            <FormItem label="Current Icon" ><div className="border border-gray-200 rounded-sm bg-gray-200 h-22 flex items-center justify-center w-22"><Avatar size={80} src={editingBrand.icon_full_path} icon={<TbBuildingStore />} shape="square" /></div></FormItem>
          )}
          <div className="flex items-center gap-2">
              <FormItem label="New Icon (Optional)" invalid={!!editFormMethods.formState.errors.icon} errorMessage={editFormMethods.formState.errors.icon?.message as string}>
                  <Controller name="icon" control={editFormMethods.control}
                    render={({ field: { onChange, onBlur, name, ref } }) => (
                      <Input type="file" name={name} ref={ref} onBlur={onBlur}
                      onChange={(e) => {
                        const file = e.target.files ? e.target.files[0] : null; onChange(file);
                        if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl);
                        setEditFormPreviewUrl(file ? URL.createObjectURL(file) : null);
                      }}
                      accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
                      />
                    )}
                    />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current icon. Selecting a new file will replace it.</p>
              </FormItem>
              {editFormPreviewUrl && <div className="border border-gray-200 rounded-sm bg-gray-200 p-1 flex items-center justify-center "><Avatar src={editFormPreviewUrl} size={80} shape="square" className=""/></div>}
          </div>
          <FormItem label={<div>Brand Name<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.name} errorMessage={editFormMethods.formState.errors.name?.message} isRequired>
            <Controller name="name" control={editFormMethods.control} render={({ field }) => <Input {...field} />} />
          </FormItem>
          <FormItem label={<div>Slug/URL<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.slug} errorMessage={editFormMethods.formState.errors.slug?.message} isRequired>
            <Controller name="slug" control={editFormMethods.control} render={({ field }) => <Input {...field} />} />
          </FormItem>
          <FormItem label={<div>Mobile No.<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.mobile_no} errorMessage={editFormMethods.formState.errors.mobile_no?.message}>
            <Controller name="mobile_no" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} />
          </FormItem>
          
          <div className="grid grid-cols-2 gap-2">
            <FormItem label="Show in Header?" invalid={!!editFormMethods.formState.errors.show_header} errorMessage={editFormMethods.formState.errors.show_header?.message} isRequired>
              <Controller name="show_header" control={editFormMethods.control}
                render={({ field }) => (
                  <UiSelect options={showHeaderOptions} value={showHeaderOptions.find((opt) => opt.value === field.value)} onChange={(opt) => field.onChange(opt ? opt.value : undefined)} />
                )}
              />
            </FormItem>
            <FormItem label="Status" invalid={!!editFormMethods.formState.errors.status} errorMessage={editFormMethods.formState.errors.status?.message} isRequired>
              <Controller name="status" control={editFormMethods.control}
                render={({ field }) => (
                  <UiSelect options={apiStatusOptions} value={apiStatusOptions.find((opt) => opt.value === field.value)} onChange={(opt) => field.onChange(opt ? opt.value : undefined)} />
                )}
              />
            </FormItem>
          </div>
          <FormItem style={{ fontWeight: "bold", color: "#000" }} label="Meta Options (Optional)"></FormItem>
          <FormItem label={<div>Meta Title<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.meta_title} errorMessage={editFormMethods.formState.errors.meta_title?.message}>
            <Controller name="meta_title" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} />
          </FormItem>
          <FormItem label={<div>Meta Description<span className="text-red-500"> * </span></div>} invalid={!!editFormMethods.formState.errors.meta_descr} errorMessage={editFormMethods.formState.errors.meta_descr?.message}>
            <Controller name="meta_descr" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} textArea />} />
          </FormItem>
          <FormItem label="Meta Keywords" invalid={!!editFormMethods.formState.errors.meta_keyword} errorMessage={editFormMethods.formState.errors.meta_keyword?.message}>
            <Controller name="meta_keyword" control={editFormMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} />
          </FormItem>
        </Form>
      </Drawer>

      {/* Filter Brands Drawer */}
      <Drawer
        title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button>
            <Button size="sm" variant="solid" form="filterBrandForm" type="submit">Apply</Button>
          </div>
        }
      >
        <Form id="filterBrandForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Name">
            <Controller name="filterNames" control={filterFormMethods.control}
              render={({ field }) => <UiSelect isMulti placeholder="Select Names" options={brandNameOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />}
            />
          </FormItem>
          <FormItem label="Status">
            <Controller name="filterStatuses" control={filterFormMethods.control}
              render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={uiStatusOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} />}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={singleDeleteOpen} type="danger" title="Delete Brand"
        onClose={() => { setSingleDeleteOpen(false); setBrandToDelete(null); }}
        onRequestClose={() => { setSingleDeleteOpen(false); setBrandToDelete(null); }}
        onCancel={() => { setSingleDeleteOpen(false); setBrandToDelete(null); }}
        onConfirm={onConfirmSingleDelete} loading={isProcessing}
      >
        <p>Are you sure you want to delete the brand "<strong>{brandToDelete?.name}</strong>"? This action cannot be undone.</p>
      </ConfirmDialog>

      {/* Status Change Confirm Dialog */}
      <ConfirmDialog
        isOpen={statusChangeConfirmOpen} type="warning" title="Change Brand Status"
        onClose={() => { setStatusChangeConfirmOpen(false); setBrandForStatusChange(null); }}
        onRequestClose={() => { setStatusChangeConfirmOpen(false); setBrandForStatusChange(null); }}
        onCancel={() => { setStatusChangeConfirmOpen(false); setBrandForStatusChange(null); }}
        onConfirm={onConfirmChangeStatus} loading={isProcessing}
      >
        <p>
          Are you sure you want to change the status for "<strong>{brandForStatusChange?.name}</strong>" to{" "}
          <strong>{brandForStatusChange?.status === "active" ? "Disabled" : "Active"}</strong>?
        </p>
      </ConfirmDialog>

      {/* Import Brands Drawer */}
      <Drawer title="Import Brands" isOpen={importDialogOpen} onClose={() => setImportDialogOpen(false)} onRequestClose={() => setImportDialogOpen(false)}>
        <div className="p-4">
          <p className="mb-4">Upload a CSV file to import brands. Ensure the CSV format matches the export structure.</p>
          <Input type="file" accept=".csv" className="mt-2"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                console.log("File selected for import:", e.target.files[0].name);
                toast.push(<Notification title="Import" type="info">File selected. Import processing to be implemented.</Notification>);
              }
            }}
          />
          <div className="text-right mt-6">
            <Button size="sm" variant="plain" onClick={() => setImportDialogOpen(false)} className="mr-2">Cancel</Button>
            <Button size="sm" variant="solid" onClick={() => { toast.push(<Notification title="Import" type="info">Import submission to be implemented.</Notification>); }}>Start Import</Button>
          </div>
        </div>
      </Drawer>

      {/* Image Viewer Dialog */}
      <Dialog
        isOpen={isImageViewerOpen} onClose={closeImageViewer} onRequestClose={closeImageViewer}
        shouldCloseOnOverlayClick={true} shouldCloseOnEsc={true} width={600}
      >
        <div className="flex justify-center items-center p-4">
          {imageToView ? <img src={imageToView} alt="Brand Icon Full View" style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} /> : <p>No image to display.</p>}
        </div>
      </Dialog>

<Dialog
  isOpen={isViewDetailModalOpen}
  onClose={closeViewDetailModal}
  onRequestClose={closeViewDetailModal}
  size="sm"
  title=""
  contentClassName="!p-0 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-2xl"
>
  {brandToView ? (
    <div className="flex flex-col max-h-[90vh]"> {/* Controlled height, no inner scroll */}

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="p-3 bg-white dark:bg-slate-700/60 rounded-lg space-y-3">

          {/* Brand Avatar + ID */}
          <div className="flex items-center gap-3">
            {brandToView.icon_full_path && (
              <Avatar
                size={48}
                shape="rounded"
                src={brandToView.icon_full_path}
                icon={<TbBuildingStore />}
                className="border-2 border-white dark:border-slate-500 shadow"
              />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {brandToView.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">ID: {brandToView.id}</p>
            </div>
          </div>

          {/* Grid Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2 text-sm text-slate-700 dark:text-slate-200">
            <DialogDetailRow
              label="Status"
              value={
                <Tag className={`${statusColor[brandToView.status]} capitalize font-semibold border-0 text-[10px] px-2 py-0.5 rounded-full`}>
                  {brandToView.status}
                </Tag>
              }
            />
            <DialogDetailRow
              label="Show in Header"
              value={brandToView.showHeader === 1 ? 'Visible' : 'Hidden'}
              valueClassName={brandToView.showHeader === 1 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}
            />
            <DialogDetailRow label="Mobile No." value={brandToView.mobileNo || '-'} />
            <DialogDetailRow label="Slug / URL" value={brandToView.slug} isLink breakAll />
            <DialogDetailRow
              label="Created"
              value={new Date(brandToView.createdAt).toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            />
            <DialogDetailRow
              label="Last Updated"
              value={new Date(brandToView.updatedAt).toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            />
          </div>

          {/* SEO Section (Condensed) */}
          {(brandToView.metaTitle || brandToView.metaDescription || brandToView.metaKeyword) && (
            <div className="pt-2">
              <h6 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                SEO & Meta
              </h6>
              <div className="text-sm text-slate-700 dark:text-slate-200 space-y-1">
                {brandToView.metaTitle && (
                  <p><span className="font-medium text-slate-500 dark:text-slate-400">Title:</span> {brandToView.metaTitle}</p>
                )}
                {brandToView.metaDescription && (
                  <p className="whitespace-pre-wrap"><span className="font-medium text-slate-500 dark:text-slate-400">Description:</span> {brandToView.metaDescription}</p>
                )}
                {brandToView.metaKeyword && (
                  <p><span className="font-medium text-slate-500 dark:text-slate-400">Keywords:</span> {brandToView.metaKeyword}</p>
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
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No Brand Information</p>
      <p className="text-xs text-slate-500 mt-1">Details for this brand could not be loaded.</p>
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
export default Brands;

// Helper utility (not strictly needed for this example but good practice if used elsewhere)
// function classNames(...classes: (string | boolean | undefined)[]) {
//   return classes.filter(Boolean).join(" ");
// }