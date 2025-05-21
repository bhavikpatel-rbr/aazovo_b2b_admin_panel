// src/views/your-path/Products.tsx

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
  Select as UiSelect,
  Tag,
  Dialog,
} from "@/components/ui";
import Dropdown from "@/components/ui/Dropdown";
// import Button from '@/components/ui/Button'
// import Dropdown from '@/components/ui/Dropdown'; // For Export/Import actions

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbCloudUpload,
  TbFilter,
  TbPlus,
  TbBox,
  TbSwitchHorizontal,
  TbCopy,
  TbCloudDownload,
  TbEye,
  TbMailForward,
  TbChevronDown,
  TbPhoto,
  TbFileDescription,
  TbSettings,
  TbClipboardText,
  TbX,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
  CellContext,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux (MODIFY_PATH and action names as needed)
import { useAppDispatch } from "@/reduxtool/store"; // MODIFY_PATH
import {
  getProductsAction,
  addProductAction,
  editProductAction,
  deleteProductAction,
  deleteAllProductsAction,
  // getDomainsAction, getCategoriesAction, getSubcategoriesByCategoryIdAction, getBrandsAction, getUnitsAction, getCountriesAction,
  // changeProductStatusAction
} from "@/reduxtool/master/middleware"; // ** CREATE/VERIFY THESE ACTIONS ** // MODIFY_PATH
import { masterSelector } from "@/reduxtool/master/masterSlice"; // MODIFY_PATH
import Textarea from "@/views/ui-components/forms/Input/Textarea";
import { useSelector } from "react-redux";
import { ActionColumn } from "../Components/component";

// --- Type Definitions ---
type ApiProductItem = {
  id: number;
  category_id: string | number | null;
  sub_category_id: string | number | null;
  brand_id: string | number | null;
  sku_code: string | null;
  name: string;
  unit: string | number | null;
  country_id: string | number | null;
  color: string | null;
  hsn_code: string | null;
  shelf_life: string | null;
  packaging_size: string | null;
  packaging_type: string | null;
  tax_rate: string | number | null;
  procurement_lead_time: string | null;
  slug: string;
  description: string | null;
  short_description: string | null;
  payment_term: string | null;
  delivery_details: string | null;
  thumb_image: string | null;
  icon: string | null;
  product_images: string | null;
  /* JSON string of image filenames */ status:
    | "Active"
    | "Inactive"
    | "Pending"
    | "Draft";
  licence: string | null;
  currency_id: string | number | null;
  product_specification: string | null;
  meta_title: string | null;
  meta_descr: string | null;
  meta_keyword: string | null;
  domain_ids: string | null;
  /* comma-separated IDs */ created_at: string;
  updated_at: string;
  icon_full_path?: string;
  thumb_image_full_path?: string;
  product_images_array?: {
    id?: number;
    image: string;
    image_full_path: string;
  }[];
  category?: { id: number; name: string } | null;
  sub_category?: { id: number; name: string } | null;
  brand?: { id: number; name: string } | null;
  unit_obj?: { id: number; name: string } | null;
  country_obj?: { id: number; name: string } | null;
};
export type ProductStatus = "active" | "inactive" | "pending" | "draft";
export type ProductGalleryImageItem = {
  id?: number; // For existing images from server
  file?: File; // For new images to upload
  previewUrl: string; // For display
  serverPath?: string; // Filename on server for existing images
  isNew?: boolean; // Flag for new uploads
  isDeleted?: boolean; // Flag for images marked for deletion
};
export type ProductItem = {
  id: number;
  name: string;
  slug: string;
  skuCode: string | null;
  status: ProductStatus;
  categoryId: number | null;
  categoryName?: string;
  subCategoryId: number | null;
  subCategoryName?: string;
  brandId: number | null;
  brandName?: string;
  unitId: number | null;
  unitName?: string;
  countryId: number | null;
  countryName?: string;
  domainIds: number[];
  color: string | null;
  hsnCode: string | null;
  shelfLife: string | null;
  packagingSize: string | null;
  packagingType: string | null;
  taxRate: string | number | null;
  procurementLeadTime: string | null;
  description: string | null;
  shortDescription: string | null;
  paymentTerm: string | null;
  deliveryDetails: string | null;
  productSpecification: string | null;
  icon: string | null;
  iconFullPath: string | null;
  thumbImage: string | null;
  thumbImageFullPath: string | null;
  productImages: ProductGalleryImageItem[];
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeyword: string | null;
  createdAt: string;
  updatedAt: string;
};
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required.").max(255),
  slug: z.string().min(1, "Slug is required.").max(255),
  sku_code: z.string().min(1, "SKU is required.").max(50).optional().nullable(),
  status: z.enum(["Active", "Inactive", "Pending", "Draft"]),
  domain_ids: z.array(z.number()).min(1, "Select at least one domain."),
  category_id: z
    .number({ invalid_type_error: "Category is required." })
    .positive()
    .nullable(),
  sub_category_id: z.number().positive().nullable().optional(),
  brand_id: z
    .number({ invalid_type_error: "Brand is required." })
    .positive()
    .nullable(),
  unit_id: z
    .number({ invalid_type_error: "Unit is required." })
    .positive()
    .nullable(),
  country_id: z
    .number({ invalid_type_error: "Country is required." })
    .positive()
    .nullable(),
  color: z.string().max(50).optional().nullable(),
  hsn_code: z.string().max(50).optional().nullable(),
  shelf_life: z.string().max(50).optional().nullable(),
  packaging_size: z.string().max(100).optional().nullable(),
  packaging_type: z.string().max(100).optional().nullable(),
  tax_rate: z.string().max(20).optional().nullable(),
  procurement_lead_time: z.string().max(50).optional().nullable(),
  thumb_image_input: z
    .union([z.instanceof(File), z.null()])
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
  short_description: z.string().optional().nullable(),
  payment_term: z.string().optional().nullable(),
  delivery_details: z.string().optional().nullable(),
  product_specification: z.string().optional().nullable(),
  meta_title: z.string().max(255).optional().nullable(),
  meta_descr: z.string().max(500).optional().nullable(),
  meta_keyword: z.string().max(255).optional().nullable(),
});
type ProductFormData = z.infer<typeof productFormSchema>;

const selectStringOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});
const filterFormSchema = z.object({
  filterNameOrSku: z.string().optional(),
  filterCategoryIds: z.array(z.number()).optional(), // Use IDs for filtering
  filterSubCategoryIds: z.array(z.number()).optional(),
  filterBrandIds: z.array(z.number()).optional(),
  filterStatuses: z.array(z.string()).optional(), // string values like 'active', 'pending'
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Constants & Options ---
const PRODUCT_THUMB_IMAGE_BASE_URL =
  import.meta.env.VITE_API_URL_STORAGE ||
  "https://your-api-domain.com/storage/product_thumbs/"; // MODIFY
const PRODUCT_IMAGES_BASE_URL =
  import.meta.env.VITE_API_URL_STORAGE ||
  "https://your-api-domain.com/storage/product_gallery/"; // MODIFY

const TABS = { ALL: "all", PENDING: "pending" };
const FORM_TABS = {
  GENERAL: "general",
  DESCRIPTION: "description",
  MEDIA: "media",
  META: "meta",
};

const statusColor: Record<ProductStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100",
  inactive: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100",
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-100",
};
const uiProductStatusOptions: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
];
const apiProductStatusOptions: { value: string; label: string }[] = [
  // For form select, value is what API expects
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Pending", label: "Pending" },
  { value: "Draft", label: "Draft" },
];

// --- Helper Components ---
// ActionColumn (already defined, ensure it has all needed props)
// ProductSearch, ProductTableTools, ProductTable, ProductSelectedFooter (adapt from Categories/Brands)
const ProductSearch = React.forwardRef<
  HTMLInputElement,
  { onInputChange: (value: string) => void }
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Search by Name, SKU..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
ProductSearch.displayName = "ProductSearch";

const ProductTableTools = ({
  onSearchChange,
  onFilter,
  onExportImport,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExportImport: () => void /* Changed to single handler for dropdown */;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <ProductSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>
      {/* Placeholder for Export/Import Dropdown - Implement with your Dropdown component */}
      <Button
        icon={<TbCloudDownload />}
        onClick={onExportImport}
        className="w-full sm:w-auto"
      >
        Export/Import
      </Button>
    </div>
  </div>
);
// ... (ProductTable and ProductSelectedFooter adapted similarly)

const Products = () => {
  const dispatch = useAppDispatch();
  const { ProductsData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  // --- Core State ---
  const [currentListTab, setCurrentListTab] = useState<string>(TABS.ALL);
  const [currentFormTab, setCurrentFormTab] = useState<string>(
    FORM_TABS.GENERAL
  );
  const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null
  );
  const [viewingProduct, setViewingProduct] = useState<ProductItem | null>(
    null
  ); // For View Drawer
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false); // State for view drawer

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<ProductItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);
  const [statusChangeConfirmOpen, setStatusChangeConfirmOpen] = useState(false);
  const [itemForStatusChange, setItemForStatusChange] =
    useState<ProductItem | null>(null);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [importDialogType, setImportDialogType] = useState<
    null | "product" | "keyword"
  >(null);

  // --- Form Image Previews & Multi-Image State ---
  const [thumbImagePreviewUrl, setThumbImagePreviewUrl] = useState<
    string | null
  >(null);
  const [newThumbImageFile, setNewThumbImageFile] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<ProductGalleryImageItem[]>(
    []
  );

  // --- Dropdown Options State ---
  const [domainOptions, setDomainOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [categoryOptions, setCategoryOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [brandOptions, setBrandOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [unitOptions, setUnitOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<
    { value: number; label: string }[]
  >([]);
  const [selectedCategoryIdForForm, setSelectedCategoryIdForForm] = useState<
    number | null
  >(null); // For dynamic subcategories

  // --- React Hook Form Instances ---
  const formMethods = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  // --- Effects ---
  useEffect(() => {
    dispatch(getProductsAction());
    // Example: Fetching static options or dispatching actions
    // dispatch(getDomainsAction()).then(action => { if(action.payload) setDomainOptions(action.payload.map((d:any) => ({value: d.id, label: d.name}))) });
    // dispatch(getCategoriesAction()).then(action => { if(action.payload) setCategoryOptions(action.payload.map((c:any) => ({value: c.id, label: c.name}))) });
    // dispatch(getBrandsAction()).then(action => { if(action.payload) setBrandOptions(action.payload.map((b:any) => ({value: b.id, label: b.name}))) });
    // dispatch(getUnitsAction()).then(action => { if(action.payload) setUnitOptions(action.payload.map((u:any) => ({value: u.id, label: u.name}))) });
    // dispatch(getCountriesAction()).then(action => { if(action.payload) setCountryOptions(action.payload.map((c:any) => ({value: c.id, label: c.name}))) });
    // MOCK DATA FOR DROPDOWNS - REPLACE WITH ACTUAL FETCHING
    setDomainOptions([
      { value: 1, label: "Domain A" },
      { value: 2, label: "Domain B" },
    ]);
    setCategoryOptions([
      { value: 1, label: "Electronics" },
      { value: 2, label: "Clothing" },
    ]);
    setBrandOptions([
      { value: 1, label: "BrandX" },
      { value: 2, label: "BrandY" },
    ]);
    setUnitOptions([
      { value: 1, label: "PCS" },
      { value: 2, label: "Box" },
    ]);
    setCountryOptions([
      { value: 1, label: "USA" },
      { value: 2, label: "India" },
    ]);
  }, [dispatch]);

  useEffect(() => {
    const watchedCategoryId = formMethods.watch("category_id");
    if (watchedCategoryId && watchedCategoryId !== selectedCategoryIdForForm) {
      setSelectedCategoryIdForForm(watchedCategoryId);
      // dispatch(getSubcategoriesByCategoryIdAction(watchedCategoryId)).then(action => {
      //     if(action.payload) setSubcategoryOptions(action.payload.map((sc:any) => ({value: sc.id, label: sc.name})));
      //     formMethods.setValue('sub_category_id', null); // Reset on parent change
      // });
      // MOCK SUBCATEGORIES
      if (watchedCategoryId === 1)
        setSubcategoryOptions([
          { value: 11, label: "Mobiles" },
          { value: 12, label: "Laptops" },
        ]);
      else if (watchedCategoryId === 2)
        setSubcategoryOptions([
          { value: 21, label: "Shirts" },
          { value: 22, label: "Pants" },
        ]);
      else setSubcategoryOptions([]);
      formMethods.setValue("sub_category_id", undefined);
    } else if (!watchedCategoryId && selectedCategoryIdForForm !== null) {
      setSelectedCategoryIdForForm(null);
      setSubcategoryOptions([]);
      formMethods.setValue("sub_category_id", undefined);
    }
  }, [
    formMethods.watch("category_id"),
    dispatch,
    selectedCategoryIdForForm,
    formMethods,
  ]);

  useEffect(() => {
    /* ... Cleanup image preview URLs ... */
  }, [thumbImagePreviewUrl, galleryImages]);

  // --- Data Mapping & Filtering ---
  const [masterProducts, setMasterProducts] = useState<ProductItem[]>([]); // Store raw mapped products
  useEffect(() => {
    // Map API data once it arrives
    if (ProductsData && ProductsData.length > 0) {
      const mapped = ProductsData.map(
        (apiItem: ApiProductItem): ProductItem => {
          let iconFullPath: string | null = null;
          if (apiItem.icon_full_path) iconFullPath = apiItem.icon_full_path;
          else if (apiItem.icon)
            iconFullPath = `${PRODUCT_IMAGES_BASE_URL}${apiItem.icon}`;
          let thumbImageFullPath: string | null = null;
          if (apiItem.thumb_image_full_path)
            thumbImageFullPath = apiItem.thumb_image_full_path;
          else if (apiItem.thumb_image)
            thumbImageFullPath = `${PRODUCT_THUMB_IMAGE_BASE_URL}${apiItem.thumb_image}`;
          const parsedDomainIds = apiItem.domain_ids
            ? apiItem.domain_ids
                .split(",")
                .map((id) => parseInt(id.trim(), 10))
                .filter((id) => !isNaN(id))
            : [];
          return {
            id: apiItem.id,
            name: apiItem.name,
            slug: apiItem.slug,
            skuCode: apiItem.sku_code,
            status: (apiItem.status?.toLowerCase() || "draft") as ProductStatus,
            categoryId: apiItem.category_id
              ? Number(apiItem.category_id)
              : null,
            categoryName:
              apiItem.category?.name ||
              categoryOptions.find(
                (c) => c.value === Number(apiItem.category_id)
              )?.label,
            subCategoryId: apiItem.sub_category_id
              ? Number(apiItem.sub_category_id)
              : null,
            subCategoryName:
              apiItem.sub_category?.name ||
              subcategoryOptions.find(
                (sc) => sc.value === Number(apiItem.sub_category_id)
              )?.label,
            brandId: apiItem.brand_id ? Number(apiItem.brand_id) : null,
            brandName:
              apiItem.brand?.name ||
              brandOptions.find((b) => b.value === Number(apiItem.brand_id))
                ?.label,
            unitId: apiItem.unit ? Number(apiItem.unit) : null,
            unitName:
              apiItem.unit_obj?.name ||
              unitOptions.find((u) => u.value === Number(apiItem.unit))?.label,
            countryId: apiItem.country_id ? Number(apiItem.country_id) : null,
            countryName:
              apiItem.country_obj?.name ||
              countryOptions.find((c) => c.value === Number(apiItem.country_id))
                ?.label,
            domainIds: parsedDomainIds,
            color: apiItem.color,
            hsnCode: apiItem.hsn_code,
            shelfLife: apiItem.shelf_life,
            packagingSize: apiItem.packaging_size,
            packagingType: apiItem.packaging_type,
            taxRate: apiItem.tax_rate,
            procurementLeadTime: apiItem.procurement_lead_time,
            description: apiItem.description,
            shortDescription: apiItem.short_description,
            paymentTerm: apiItem.payment_term,
            deliveryDetails: apiItem.delivery_details,
            productSpecification: apiItem.product_specification,
            icon: apiItem.icon,
            iconFullPath,
            thumbImage: apiItem.thumb_image,
            thumbImageFullPath,
            productImages:
              apiItem.product_images_array?.map((img) => ({
                id: img.id,
                serverPath: img.image,
                previewUrl: img.image_full_path,
                isNew: false,
                isDeleted: false,
              })) || [],
            metaTitle: apiItem.meta_title,
            metaDescription: apiItem.meta_descr,
            metaKeyword: apiItem.meta_keyword,
            createdAt: apiItem.created_at,
            updatedAt: apiItem.updated_at,
          };
        }
      );
      setMasterProducts(mapped);
    } else {
      setMasterProducts([]); // Clear if no data
    }
  }, [
    ProductsData,
    categoryOptions,
    subcategoryOptions,
    brandOptions,
    unitOptions,
    countryOptions,
  ]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    /* ... Filtering logic as before ... */
    let processedData: ProductItem[] = cloneDeep(ProductsData);
    if (currentListTab === TABS.PENDING)
      processedData = processedData.filter(
        (p) => p.status === "pending" || p.status === "draft"
      );
    // Apply filterCriteria
    if (filterCriteria.filterNameOrSku) {
      const query = filterCriteria.filterNameOrSku.toLowerCase();
      processedData = processedData.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.skuCode?.toLowerCase().includes(query)
      );
    }
    if (filterCriteria.filterCategoryIds?.length) {
      const ids = new Set(filterCriteria.filterCategoryIds);
      processedData = processedData.filter(
        (p) => p.categoryId && ids.has(p.categoryId)
      );
    }
    if (filterCriteria.filterSubCategoryIds?.length) {
      const ids = new Set(filterCriteria.filterSubCategoryIds);
      processedData = processedData.filter(
        (p) => p.subCategoryId && ids.has(p.subCategoryId)
      );
    }
    if (filterCriteria.filterBrandIds?.length) {
      const ids = new Set(filterCriteria.filterBrandIds);
      processedData = processedData.filter(
        (p) => p.brandId && ids.has(p.brandId)
      );
    }
    if (filterCriteria.filterStatuses?.length) {
      const statuses = new Set(filterCriteria.filterStatuses);
      processedData = processedData.filter((p) => statuses.has(p.status));
    }
    // Apply tableData.query (global search)
    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      processedData = processedData.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.skuCode?.toLowerCase().includes(query) ||
          p.categoryName?.toLowerCase().includes(query) ||
          p.brandName?.toLowerCase().includes(query)
      );
    }
    // Apply tableData.sort
    const { order, key } = tableData.sort;
    if (order && key) {
      processedData.sort((a, b) => {
        let aVal = a[key as keyof ProductItem] as any;
        let bVal = b[key as keyof ProductItem] as any;
        if (typeof aVal === "number" && typeof bVal === "number")
          return order === "asc" ? aVal - bVal : bVal - aVal;
        return order === "asc"
          ? String(aVal ?? "").localeCompare(String(bVal ?? ""))
          : String(bVal ?? "").localeCompare(String(aVal ?? ""));
      });
    }

    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return {
      pageData: processedData.slice(startIndex, startIndex + pageSize),
      total: currentTotal,
      allFilteredAndSortedData: processedData,
    };
  }, [ProductsData, tableData, filterCriteria, currentListTab]);

  // --- Event Handlers ---
  const handleListTabChange = useCallback((tabKey: string) => {
    setCurrentListTab(tabKey);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    setSelectedItems([]);
  }, []);
  const handleFormTabChange = useCallback(
    (tabKey: string) => setCurrentFormTab(tabKey),
    []
  );

  const openAddDrawer = useCallback(() => {
    setEditingProduct(null);
    setViewingProduct(null);
    formMethods.reset({
      name: "",
      slug: "",
      sku_code: "",
      status: "Draft",
      domain_ids: [],
      category_id: null,
      sub_category_id: null,
      brand_id: null,
      unit_id: null,
      country_id: null,
      color: "",
      hsn_code: "",
      shelf_life: "",
      packaging_size: "",
      packaging_type: "",
      tax_rate: "",
      procurement_lead_time: "",
      thumb_image_input: null,
      description: "",
      short_description: "",
      payment_term: "",
      delivery_details: "",
      product_specification: "",
      meta_title: "",
      meta_descr: "",
      meta_keyword: "",
    });
    setCurrentFormTab(FORM_TABS.GENERAL);
    setThumbImagePreviewUrl(null);
    setNewThumbImageFile(null);
    setGalleryImages([]);
    setIsAddEditDrawerOpen(true);
  }, [formMethods]);

  const openEditDrawer = useCallback(
    (product: ProductItem) => {
      setEditingProduct(product);
      setViewingProduct(null);
      // formMethods.reset({
      //     name: product.name, slug: product.slug, sku_code: product.skuCode,
      //     status: apiProductStatusOptions.find(s => s.value.toLowerCase() === product.status)?.value || 'Draft', // Map to API value
      //     domain_ids: product.domainIds, category_id: product.categoryId, sub_category_id: product.subCategoryId, brand_id: product.brandId,
      //     unit_id: product.unitId, country_id: product.countryId, color: product.color, hsn_code: product.hsnCode,
      //     shelf_life: product.shelfLife, packaging_size: product.packagingSize, packaging_type: product.packagingType,
      //     tax_rate: String(product.taxRate || ''), procurement_lead_time: product.procurementLeadTime,
      //     thumb_image_input: null, description: product.description, short_description: product.shortDescription,
      //     payment_term: product.paymentTerm, delivery_details: product.deliveryDetails, product_specification: product.productSpecification,
      //     meta_title: product.metaTitle, meta_descr: product.metaDescription, meta_keyword: product.metaKeyword,
      // });
      setCurrentFormTab(FORM_TABS.GENERAL);
      setThumbImagePreviewUrl(product.thumbImageFullPath);
      setNewThumbImageFile(null);
      setGalleryImages(
        product.productImages.map((img) => ({
          ...img,
          previewUrl: img.url || img.serverPath || "",
          isNew: false,
          isDeleted: false,
        }))
      ); // Ensure previewUrl
      setIsAddEditDrawerOpen(true);
    },
    [formMethods]
  );

  const openViewProductDrawer = useCallback((product: ProductItem) => {
    setViewingProduct(product);
    setIsViewDrawerOpen(true); // Open a dedicated view drawer
  }, []);
  const closeViewProductDrawer = useCallback(
    () => setIsViewDrawerOpen(false),
    []
  );

  const closeAddEditDrawer = useCallback(() => {
    setIsAddEditDrawerOpen(false);
    setEditingProduct(null);
    formMethods.reset();
  }, [formMethods]);

  const onProductFormSubmit = useCallback(
    async (data: ProductFormData) => {
      setIsSubmitting(true);
      const formData = new FormData();
      if (editingProduct) formData.append("_method", "PUT");

      Object.entries(data).forEach(([key, value]) => {
        if (key === "thumb_image_input") return;
        if (key === "domain_ids" && Array.isArray(value)) {
          value.forEach((id) => formData.append("domain_ids[]", String(id)));
        } else if (
          value !== null &&
          value !== undefined &&
          String(value).trim() !== ""
        ) {
          formData.append(key, String(value));
        }
      });
      if (newThumbImageFile) formData.append("thumb_image", newThumbImageFile); // Use 'thumb_image' as key

      galleryImages.forEach((img, index) => {
        if (img.file && img.isNew && !img.isDeleted)
          formData.append(`product_images[${index}]`, img.file);
        // Key for new images
        else if (img.id && img.isDeleted)
          formData.append("deleted_image_ids[]", String(img.id)); // Key for deleted
      });
      // For debugging:
      // for (let pair of formData.entries()) { console.log(pair[0]+ ', ' + pair[1]); }

      try {
        if (editingProduct) {
          // await dispatch(editProductAction({ id: editingProduct.id, formData })).unwrap();
          toast.push(
            <Notification type="success" title="Product Updated (Mock)" />
          );
        } else {
          // await dispatch(addProductAction(formData)).unwrap();
          toast.push(
            <Notification type="success" title="Product Added (Mock)" />
          );
        }
        closeAddEditDrawer();
        // dispatch(getProductsAction()); // Refresh list
      } catch (error: any) {
        toast.push(
          <Notification type="danger" title="Error">
            {error.message || "Operation failed"}
          </Notification>
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      editingProduct,
      dispatch,
      closeAddEditDrawer,
      newThumbImageFile,
      galleryImages /*, getProductsAction */,
    ]
  );

  // Delete, Status Change, Clone Handlers (adapt from Categories/Brands)
  const handleDeleteProductClick = useCallback((product: ProductItem) => {
    setItemToDelete(product);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);
    /* ...dispatch deleteProductAction... */ toast.push(
      <Notification title="Deleted (Mock)" />
    );
    setIsProcessing(false);
    setSingleDeleteConfirmOpen(false);
    setItemToDelete(null);
  }, [dispatch, itemToDelete]);
  const onDeleteSelectedProducts = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);
    /* ...dispatch deleteAllProductsAction... */ toast.push(
      <Notification title="Bulk Deleted (Mock)" />
    );
    setIsProcessing(false);
    setSelectedItems([]);
  }, [dispatch, selectedItems]);
  const openChangeProductStatusDialog = useCallback((product: ProductItem) => {
    setItemForStatusChange(product);
    setStatusChangeConfirmOpen(true);
  }, []);
  const onConfirmChangeStatus = useCallback(async () => {
    if (!itemForStatusChange) return;
    setIsProcessing(true);
    /* ...dispatch changeProductStatusAction... */ toast.push(
      <Notification title="Status Changed (Mock)" />
    );
    setIsProcessing(false);
    setStatusChangeConfirmOpen(false);
    setItemForStatusChange(null);
  }, [dispatch, itemForStatusChange]);
  const handleCloneProduct = useCallback(
    (product: ProductItem) => {
      /* ...logic to prefill add form... */ toast.push(
        <Notification title="Product Cloned (Mock)" />
      );
      openAddDrawer();
    },
    [formMethods, openAddDrawer]
  );
  const handleSendLaunchMail = useCallback((product: ProductItem) => {
    toast.push(
      <Notification title={`Launch Mail for ${product.name} (Mock)`} />
    );
  }, []);

  const openImageViewer = useCallback((imageUrl: string | null) => {
    if (imageUrl) {
      setImageToView(imageUrl);
      setImageViewerOpen(true);
    }
  }, []);
  const closeImageViewer = useCallback(() => {
    setImageViewerOpen(false);
    setImageToView(null);
  }, []);

  // Export/Import Handlers
  const handleExportProducts = useCallback(() => {
    toast.push(<Notification title="Export Products (Mock)" />);
  }, [allFilteredAndSortedData]);
  const handleImportProducts = useCallback(
    () => setImportDialogType("product"),
    []
  );
  const handleExportKeywords = useCallback(
    () => toast.push(<Notification title="Export Keywords (Mock)" />),
    []
  );
  const handleImportKeywords = useCallback(
    () => setImportDialogType("keyword"),
    []
  );
  const closeImportDialog = useCallback(() => setImportDialogType(null), []);
  const handleImportFileSelected = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && importDialogType) {
        toast.push(
          <Notification
            title={`Importing ${importDialogType} (Mock)`}
            message={`File: ${file.name}`}
          />
        );
        // dispatch import action based on importDialogType
        closeImportDialog();
      }
      if (event.target) event.target.value = ""; // Reset file input
    },
    [importDialogType, dispatch, closeImportDialog]
  );
  const handleExportImportDropdown = () => {
    // This would typically open a Dropdown menu component
    // For simplicity, let's just cycle through import types or open a generic import dialog
    toast.push(<Notification title="Open Export/Import Menu (Mock)" />);
    // Example: setImportDialogType('product'); // or show a menu
  };

  // Table Data Callbacks (Pagination, Sort, Search, Select)
  const handlePaginationChange = useCallback(
    (page: number) => setTableData((prev) => ({ ...prev, pageIndex: page })),
    []
  );
  const handlePageSizeChange = useCallback((value: number) => {
    setTableData((prev) => ({ ...prev, pageSize: value, pageIndex: 1 }));
    setSelectedItems([]);
  }, []);
  const handleSort = useCallback(
    (sort: OnSortParam) =>
      setTableData((prev) => ({ ...prev, sort, pageIndex: 1 })),
    []
  );
  const handleSearchChange = useCallback(
    (query: string) =>
      setTableData((prev) => ({ ...prev, query, pageIndex: 1 })),
    []
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: ProductItem) =>
      setSelectedItems((prev) =>
        checked
          ? prev.some((i) => i.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((i) => i.id !== row.id)
      ),
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<ProductItem>[]) => {
      const originals = currentRows.map((r) => r.original);
      if (checked)
        setSelectedItems((prev) => {
          const oldIds = new Set(prev.map((i) => i.id));
          return [...prev, ...originals.filter((o) => !oldIds.has(o.id))];
        });
      else {
        const currentIds = new Set(originals.map((o) => o.id));
        setSelectedItems((prev) => prev.filter((i) => !currentIds.has(i.id)));
      }
    },
    []
  );

  // Filter Drawer
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria(data);
      handlePaginationChange(1);
      closeFilterDrawer();
    },
    [handlePaginationChange, closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    filterFormMethods.reset({});
    setFilterCriteria({});
    handlePaginationChange(1);
  }, [filterFormMethods, handlePaginationChange]);

  // Columns Definition
  const columns: ColumnDef<ProductItem>[] = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        size: 60,
        meta: { tdClass: "text-center", thClass: "text-center" },
      },
      {
        header: "Product",
        id: "productInfo",
        size: 300,
        cell: (props: CellContext<ProductItem, any>) => (
          <div className="flex items-center gap-3">
            <Avatar
              size="lg"
              shape="circle"
              src={props.row.original.thumbImageFullPath || undefined}
              icon={<TbBox />}
              className={
                props.row.original.thumbImageFullPath ? "cursor-pointer" : ""
              }
              onClick={() =>
                props.row.original.thumbImageFullPath &&
                openImageViewer(props.row.original.thumbImageFullPath)
              }
            />
            <div>
              {" "}
              <span
                className="font-semibold hover:text-blue-600 cursor-pointer"
                onClick={() => openViewProductDrawer(props.row.original)}
              >
                {props.row.original.name}
              </span>{" "}
              <div className="text-xs text-gray-500">
                SKU: {props.row.original.skuCode || "-"}
              </div>{" "}
            </div>
          </div>
        ),
      },
      {
        header: "Category",
        accessorKey: "categoryName",
        cell: (props) => props.row.original.categoryName || "-",
      },
      {
        header: "Subcategory",
        accessorKey: "subCategoryName",
        cell: (props) => props.row.original.subCategoryName || "-",
      },
      {
        header: "Brand",
        accessorKey: "brandName",
        cell: (props) => props.row.original.brandName || "-",
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: (props: CellContext<ProductItem, any>) => (
          <Tag
            className={`${
              statusColor[props.row.original.status] || "bg-gray-200"
            } capitalize`}
          >
            {props.row.original.status}
          </Tag>
        ),
      },
      {
        header: "Actions",
        id: "actions",
        meta: { thClass: "text-center", tdClass: "text-center" },
        cell: (props: CellContext<ProductItem, any>) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onView={() => openViewProductDrawer(props.row.original)}
            onDelete={() => handleDeleteProductClick(props.row.original)}
            onChangeStatus={() =>
              openChangeProductStatusDialog(props.row.original)
            }
            onSendLaunchMail={() => handleSendLaunchMail(props.row.original)}
            onClone={() => handleCloneProduct(props.row.original)}
          />
        ),
      },
    ],
    [
      ProductsData,
      openImageViewer,
      openEditDrawer,
      openViewProductDrawer,
      handleDeleteProductClick,
      openChangeProductStatusDialog,
      handleSendLaunchMail,
      handleCloneProduct,
    ]
  ); // Added masterProducts

  const tableIsLoading =
    masterLoadingStatus === "loading" || isSubmitting || isProcessing;

  // --- JSX ---
  return (
    <>
      <Container className="h-full">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          {/* Header & Tabs */}
          <div className="lg:flex items-center justify-between mb-0">
            <h5 className="mb-4 lg:mb-0">Products</h5>

            <div className="flex items-center gap-2">
              <Dropdown title="More Options" className="mr-2">
                <Dropdown.Item eventKey="Export Product">
                  Export Product
                </Dropdown.Item>
                <Dropdown.Item eventKey="Import Product">
                  Import Product
                </Dropdown.Item>
                <Dropdown.Item eventKey="Export Product Keywords">
                  Export Product Keywords
                </Dropdown.Item>
                <Dropdown.Item eventKey="Import Product Keyword">
                  Import Product Keyword
                </Dropdown.Item>
              </Dropdown>

              <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
                Add New Product
              </Button>
            </div>
          </div>

          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[TABS.ALL, TABS.PENDING].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleListTabChange(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    currentListTab === tab
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.replace("_", " ")} Products
                </button>
              ))}
            </nav>
          </div>
          <ProductTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExportImport={handleExportImportDropdown}
          />
          <div className="mt-4 flex-grow overflow-y-auto">
            <DataTable /* Adapt ProductTable props */
              columns={columns}
              data={pageData}
              loading={tableIsLoading}
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectable
              selectedItems={selectedItems} // Pass selectedItems if your DataTable handles selection
              onPaginationChange={handlePaginationChange}
              onSelectChange={handlePageSizeChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>
      {/* <ProductSelectedFooter selectedItems={selectedItems} onDeleteSelected={onDeleteSelectedProducts} /> */}

      {/* Add/Edit Drawer */}
      <Drawer
        title={
          editingProduct
            ? "Edit Product"
            : viewingProduct
            ? `View Product: ${viewingProduct.name}`
            : "Add New Product"
        }
        isOpen={isAddEditDrawerOpen || isViewDrawerOpen}
        onClose={isViewDrawerOpen ? closeViewProductDrawer : closeAddEditDrawer}
        width={800} // Wider for complex form
        bodyClass="flex flex-col h-full" // For sticky footer in drawer
        footer={
          !viewingProduct && ( // Only show footer for add/edit
            <div className="text-right">
              <Button
                size="sm"
                className="mr-2"
                type="button"
                onClick={closeAddEditDrawer}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="solid"
                form="productForm"
                type="submit"
                loading={isSubmitting}
                disabled={
                  isSubmitting ||
                  (isAddEditDrawerOpen &&
                    !editingProduct &&
                    !formMethods.formState.isValid) ||
                  (isAddEditDrawerOpen &&
                    editingProduct &&
                    !formMethods.formState.isDirty &&
                    !formMethods.formState.isValid)
                }
              >
                {isSubmitting
                  ? editingProduct
                    ? "Saving..."
                    : "Adding..."
                  : editingProduct
                  ? "Save Changes"
                  : "Add Product"}
              </Button>
            </div>
          )
        }
      >
        {isViewDrawerOpen && viewingProduct ? (
          <div className="p-4">
            {" "}
            {/* Basic View Product Layout - Enhance as needed */}
            <h3 className="text-lg font-semibold mb-2">
              {viewingProduct.name}
            </h3>
            {viewingProduct.thumbImageFullPath && (
              <Avatar
                src={viewingProduct.thumbImageFullPath}
                size={120}
                shape="rounded"
                className="mb-2"
              />
            )}
            <p>
              <strong>SKU:</strong> {viewingProduct.skuCode || "-"}
            </p>
            <p>
              <strong>Category:</strong> {viewingProduct.categoryName || "-"}
            </p>
            <p>
              <strong>Brand:</strong> {viewingProduct.brandName || "-"}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <Tag
                className={`${
                  statusColor[viewingProduct.status] || ""
                } capitalize`}
              >
                {viewingProduct.status}
              </Tag>
            </p>
            <div className="mt-2">
              <strong>Description:</strong>
              <div
                dangerouslySetInnerHTML={{
                  __html: viewingProduct.description || "<p>-</p>",
                }}
              />
            </div>
            {/* Add more fields to view */}
          </div>
        ) : (
          <Form
            id="productForm"
            onSubmit={formMethods.handleSubmit(onProductFormSubmit)}
            className="flex flex-col gap-y-3 h-full"
          >
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10 py-2">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {[
                  FORM_TABS.GENERAL,
                  FORM_TABS.DESCRIPTION,
                  FORM_TABS.MEDIA,
                  FORM_TABS.META,
                ].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleFormTabChange(tab)}
                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm capitalize flex items-center gap-2 ${
                      currentFormTab === tab
                        ? "border-indigo-500 text-indigo-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab === FORM_TABS.GENERAL && <TbSettings />}{" "}
                    {tab === FORM_TABS.DESCRIPTION && <TbFileDescription />}
                    {tab === FORM_TABS.MEDIA && <TbPhoto />}{" "}
                    {tab === FORM_TABS.META && <TbClipboardText />}
                    {tab.replace("_", " ")}
                  </button>
                ))}
              </nav>
            </div>
            {/* Tab Content - Scrollable Area */}
            <div className="flex-grow overflow-y-auto pb-2 pr-1">
              {" "}
              {/* Added padding-right for scrollbar */}
              {currentFormTab === FORM_TABS.GENERAL && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                  {/* General Tab Fields from previous detailed response */}
                  <FormItem
                    label="Product Name"
                    isRequired
                    invalid={!!formMethods.formState.errors.name}
                    errorMessage={formMethods.formState.errors.name?.message}
                  >
                    <Controller
                      name="name"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Slug / Url"
                    isRequired
                    invalid={!!formMethods.formState.errors.slug}
                    errorMessage={formMethods.formState.errors.slug?.message}
                  >
                    <Controller
                      name="slug"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="SKU Code"
                    invalid={!!formMethods.formState.errors.sku_code}
                    errorMessage={
                      formMethods.formState.errors.sku_code?.message
                    }
                  >
                    <Controller
                      name="sku_code"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Status"
                    isRequired
                    invalid={!!formMethods.formState.errors.status}
                    errorMessage={formMethods.formState.errors.status?.message}
                  >
                    <Controller
                      name="status"
                      control={formMethods.control}
                      render={({ field }) => (
                        <UiSelect
                          options={apiProductStatusOptions}
                          value={apiProductStatusOptions.find(
                            (o) => o.value === field.value
                          )}
                          onChange={(opt) => field.onChange(opt?.value)}
                        />
                      )}
                    />
                  </FormItem>
                  <FormItem
                    label="Domains"
                    isRequired
                    className="md:col-span-2"
                    invalid={!!formMethods.formState.errors.domain_ids}
                    errorMessage={
                      formMethods.formState.errors.domain_ids?.message
                    }
                  >
                    <Controller
                      name="domain_ids"
                      control={formMethods.control}
                      render={({ field }) => (
                        <UiSelect
                          isMulti
                          options={domainOptions}
                          value={domainOptions.filter((opt) =>
                            field.value?.includes(opt.value)
                          )}
                          onChange={(opts) =>
                            field.onChange(
                              opts ? opts.map((opt) => opt.value) : []
                            )
                          }
                        />
                      )}
                    />
                  </FormItem>
                  <FormItem
                    label="Category"
                    isRequired
                    invalid={!!formMethods.formState.errors.category_id}
                    errorMessage={
                      formMethods.formState.errors.category_id?.message
                    }
                  >
                    <Controller
                      name="category_id"
                      control={formMethods.control}
                      render={({ field }) => (
                        <UiSelect
                          options={categoryOptions}
                          value={categoryOptions.find(
                            (o) => o.value === field.value
                          )}
                          onChange={(opt) => {
                            field.onChange(
                              opt?.value
                            ); /* setSelectedCategoryIdForForm handled by watch */
                          }}
                          isClearable
                        />
                      )}
                    />
                  </FormItem>
                  <FormItem
                    label="Sub Category"
                    invalid={!!formMethods.formState.errors.sub_category_id}
                    errorMessage={
                      formMethods.formState.errors.sub_category_id?.message
                    }
                  >
                    <Controller
                      name="sub_category_id"
                      control={formMethods.control}
                      render={({ field }) => (
                        <UiSelect
                          options={subcategoryOptions}
                          value={subcategoryOptions.find(
                            (o) => o.value === field.value
                          )}
                          onChange={(opt) => field.onChange(opt?.value)}
                          isClearable
                          isDisabled={
                            !formMethods.watch("category_id") ||
                            subcategoryOptions.length === 0
                          }
                        />
                      )}
                    />
                  </FormItem>
                  <FormItem
                    label="Brand"
                    isRequired
                    invalid={!!formMethods.formState.errors.brand_id}
                    errorMessage={
                      formMethods.formState.errors.brand_id?.message
                    }
                  >
                    <Controller
                      name="brand_id"
                      control={formMethods.control}
                      render={({ field }) => (
                        <UiSelect
                          options={brandOptions}
                          value={brandOptions.find(
                            (o) => o.value === field.value
                          )}
                          onChange={(opt) => field.onChange(opt?.value)}
                          isClearable
                        />
                      )}
                    />
                  </FormItem>
                  <FormItem
                    label="Unit"
                    isRequired
                    invalid={!!formMethods.formState.errors.unit_id}
                    errorMessage={formMethods.formState.errors.unit_id?.message}
                  >
                    <Controller
                      name="unit_id"
                      control={formMethods.control}
                      render={({ field }) => (
                        <UiSelect
                          options={unitOptions}
                          value={unitOptions.find(
                            (o) => o.value === field.value
                          )}
                          onChange={(opt) => field.onChange(opt?.value)}
                          isClearable
                        />
                      )}
                    />
                  </FormItem>
                  <FormItem
                    label="Country of Origin"
                    isRequired
                    invalid={!!formMethods.formState.errors.country_id}
                    errorMessage={
                      formMethods.formState.errors.country_id?.message
                    }
                  >
                    <Controller
                      name="country_id"
                      control={formMethods.control}
                      render={({ field }) => (
                        <UiSelect
                          options={countryOptions}
                          value={countryOptions.find(
                            (o) => o.value === field.value
                          )}
                          onChange={(opt) => field.onChange(opt?.value)}
                          isClearable
                        />
                      )}
                    />
                  </FormItem>
                  <FormItem
                    label="Color"
                    invalid={!!formMethods.formState.errors.color}
                    errorMessage={formMethods.formState.errors.color?.message}
                  >
                    <Controller
                      name="color"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="HSN Code"
                    invalid={!!formMethods.formState.errors.hsn_code}
                    errorMessage={
                      formMethods.formState.errors.hsn_code?.message
                    }
                  >
                    <Controller
                      name="hsn_code"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Shelf Life"
                    invalid={!!formMethods.formState.errors.shelf_life}
                    errorMessage={
                      formMethods.formState.errors.shelf_life?.message
                    }
                  >
                    <Controller
                      name="shelf_life"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Packaging Size"
                    invalid={!!formMethods.formState.errors.packaging_size}
                    errorMessage={
                      formMethods.formState.errors.packaging_size?.message
                    }
                  >
                    <Controller
                      name="packaging_size"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Packaging Type"
                    invalid={!!formMethods.formState.errors.packaging_type}
                    errorMessage={
                      formMethods.formState.errors.packaging_type?.message
                    }
                  >
                    <Controller
                      name="packaging_type"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Tax Rate"
                    invalid={!!formMethods.formState.errors.tax_rate}
                    errorMessage={
                      formMethods.formState.errors.tax_rate?.message
                    }
                  >
                    <Controller
                      name="tax_rate"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Procurement Lead Time"
                    invalid={
                      !!formMethods.formState.errors.procurement_lead_time
                    }
                    errorMessage={
                      formMethods.formState.errors.procurement_lead_time
                        ?.message
                    }
                  >
                    <Controller
                      name="procurement_lead_time"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Thumbnail Image"
                    className="md:col-span-2"
                    invalid={!!formMethods.formState.errors.thumb_image_input}
                    errorMessage={
                      formMethods.formState.errors.thumb_image_input
                        ?.message as string
                    }
                  >
                    <Controller
                      name="thumb_image_input"
                      control={formMethods.control}
                      render={({ field: { onChange, onBlur, name, ref } }) => (
                        <Input
                          type="file"
                          name={name}
                          ref={ref}
                          onBlur={onBlur}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            onChange(file);
                            setNewThumbImageFile(file);
                            if (thumbImagePreviewUrl)
                              URL.revokeObjectURL(thumbImagePreviewUrl);
                            setThumbImagePreviewUrl(
                              file ? URL.createObjectURL(file) : null
                            );
                          }}
                          accept="image/*"
                        />
                      )}
                    />{" "}
                    {(thumbImagePreviewUrl ||
                      (editingProduct &&
                        editingProduct.thumbImageFullPath &&
                        !newThumbImageFile)) && (
                      <div className="mt-2">
                        <Avatar
                          src={
                            thumbImagePreviewUrl ||
                            editingProduct?.thumbImageFullPath
                          }
                          size={100}
                          shape="rounded"
                        />{" "}
                        {newThumbImageFile && (
                          <Button
                            size="xs"
                            variant="plain"
                            className="text-red-500 mt-1"
                            onClick={() => {
                              setNewThumbImageFile(null);
                              setThumbImagePreviewUrl(null);
                              formMethods.setValue("thumb_image_input", null);
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}{" "}
                  </FormItem>
                </div>
              )}
              {currentFormTab === FORM_TABS.DESCRIPTION && (
                <div className="flex flex-col gap-y-4">
                  <FormItem
                    label="Description"
                    invalid={!!formMethods.formState.errors.description}
                    errorMessage={
                      formMethods.formState.errors.description?.message
                    }
                  >
                    <Controller
                      name="description"
                      control={formMethods.control}
                      render={({ field }) => <Textarea {...field} rows={8} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Short Description"
                    invalid={!!formMethods.formState.errors.short_description}
                    errorMessage={
                      formMethods.formState.errors.short_description?.message
                    }
                  >
                    <Controller
                      name="short_description"
                      control={formMethods.control}
                      render={({ field }) => <Textarea {...field} rows={4} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Payment Term"
                    invalid={!!formMethods.formState.errors.payment_term}
                    errorMessage={
                      formMethods.formState.errors.payment_term?.message
                    }
                  >
                    <Controller
                      name="payment_term"
                      control={formMethods.control}
                      render={({ field }) => <Textarea {...field} rows={3} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Delivery Details"
                    invalid={!!formMethods.formState.errors.delivery_details}
                    errorMessage={
                      formMethods.formState.errors.delivery_details?.message
                    }
                  >
                    <Controller
                      name="delivery_details"
                      control={formMethods.control}
                      render={({ field }) => <Textarea {...field} rows={3} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Product Specification"
                    invalid={
                      !!formMethods.formState.errors.product_specification
                    }
                    errorMessage={
                      formMethods.formState.errors.product_specification
                        ?.message
                    }
                  >
                    <Controller
                      name="product_specification"
                      control={formMethods.control}
                      render={({ field }) => <Textarea {...field} rows={5} />}
                    />
                  </FormItem>
                </div>
              )}
              {currentFormTab === FORM_TABS.MEDIA && (
                <div>
                  {" "}
                  {/* Implement Multiple Image Upload UI for galleryImages state */}
                  <label className="form-label block mb-2">
                    Product Gallery Images (Max 5, 1024x1024 recommended)
                  </label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      const newImages = files
                        .slice(
                          0,
                          5 -
                            galleryImages.filter((img) => !img.isDeleted).length
                        )
                        .map((file) => ({
                          file,
                          previewUrl: URL.createObjectURL(file),
                          isNew: true,
                          isDeleted: false,
                        }));
                      setGalleryImages((prev) => [
                        ...prev.filter((img) => !img.isDeleted),
                        ...newImages,
                      ]);
                      if (e.target) e.target.value = ""; // Reset file input
                    }}
                    disabled={
                      galleryImages.filter((img) => !img.isDeleted).length >= 5
                    }
                  />
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {galleryImages
                      .filter((img) => !img.isDeleted)
                      .map((image, index) => (
                        <div
                          key={image.id || image.previewUrl}
                          className="relative group"
                        >
                          <Avatar
                            src={image.previewUrl}
                            size={120}
                            shape="rounded"
                            className="w-full"
                          />
                          <Button
                            shape="circle"
                            size="xs"
                            icon={<TbX />}
                            className="absolute top-1 right-1 bg-red-500 text-white opacity-75 group-hover:opacity-100"
                            onClick={() => {
                              if (image.isNew) {
                                // If it's a new image not yet uploaded
                                URL.revokeObjectURL(image.previewUrl);
                                setGalleryImages((prev) =>
                                  prev.filter(
                                    (img) => img.previewUrl !== image.previewUrl
                                  )
                                );
                              } else {
                                // Mark existing image for deletion
                                setGalleryImages((prev) =>
                                  prev.map((img) =>
                                    img.id === image.id ||
                                    img.serverPath === image.serverPath
                                      ? { ...img, isDeleted: true }
                                      : img
                                  )
                                );
                              }
                            }}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {currentFormTab === FORM_TABS.META && (
                <div className="flex flex-col gap-y-4">
                  <FormItem
                    label="Meta Tag Title"
                    invalid={!!formMethods.formState.errors.meta_title}
                    errorMessage={
                      formMethods.formState.errors.meta_title?.message
                    }
                  >
                    <Controller
                      name="meta_title"
                      control={formMethods.control}
                      render={({ field }) => <Input {...field} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Meta Tag Description"
                    invalid={!!formMethods.formState.errors.meta_descr}
                    errorMessage={
                      formMethods.formState.errors.meta_descr?.message
                    }
                  >
                    <Controller
                      name="meta_descr"
                      control={formMethods.control}
                      render={({ field }) => <Textarea {...field} rows={4} />}
                    />
                  </FormItem>
                  <FormItem
                    label="Meta Tag Keywords"
                    invalid={!!formMethods.formState.errors.meta_keyword}
                    errorMessage={
                      formMethods.formState.errors.meta_keyword?.message
                    }
                  >
                    <Controller
                      name="meta_keyword"
                      control={formMethods.control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      )}
                    />
                  </FormItem>
                </div>
              )}
            </div>
          </Form>
        )}
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Products"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer} /* ... footer ... */
      >
        <Form
          id="filterProductForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Name or SKU">
            <Controller
              name="filterNameOrSku"
              control={filterFormMethods.control}
              render={({ field }) => <Input {...field} />}
            />
          </FormItem>
          <FormItem label="Categories">
            <Controller
              name="filterCategoryIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  options={categoryOptions}
                  value={categoryOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) => field.onChange(opts?.map((o) => o.value))}
                />
              )}
            />
          </FormItem>
          <FormItem label="Sub Categories">
            <Controller
              name="filterSubCategoryIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  options={subcategoryOptions}
                  value={subcategoryOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) => field.onChange(opts?.map((o) => o.value))}
                  isDisabled={subcategoryOptions.length === 0}
                />
              )}
            />
          </FormItem>
          <FormItem label="Brands">
            <Controller
              name="filterBrandIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  options={brandOptions}
                  value={brandOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) => field.onChange(opts?.map((o) => o.value))}
                />
              )}
            />
          </FormItem>
          <FormItem label="Statuses">
            <Controller
              name="filterStatuses"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  options={uiProductStatusOptions}
                  value={uiProductStatusOptions.filter((o) =>
                    field.value?.includes(o.value)
                  )}
                  onChange={(opts) => field.onChange(opts?.map((o) => o.value))}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Confirmation Dialogs & Image Viewer */}
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Product" /* ... */
      >
        <p>
          Delete <strong>{itemToDelete?.name}</strong>?
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={statusChangeConfirmOpen}
        type="warning"
        title="Change Status" /* ... */
      >
        <p>
          Change status for <strong>{itemForStatusChange?.name}</strong>?
        </p>
      </ConfirmDialog>
      <Dialog
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        /* ... */ title="View Image"
      >
        {" "}
        <div className="p-4 flex justify-center items-center">
          {imageToView && (
            <img
              src={imageToView}
              alt="Product view"
              className="max-w-full max-h-[80vh] object-contain"
            />
          )}
        </div>{" "}
        <Dialog.Footer>
          <Button onClick={closeImageViewer}>Close</Button>
        </Dialog.Footer>{" "}
      </Dialog>

      {/* Import Dialogs */}
      <Dialog
        isOpen={importDialogType === "product"}
        onClose={closeImportDialog}
        title="Import Products"
      >
        <div className="p-4">
          {" "}
          <p>Upload CSV to import products.</p>{" "}
          <Input
            type="file"
            accept=".csv"
            onChange={handleImportFileSelected}
          />{" "}
          <div className="mt-4 text-right">
            <Button onClick={closeImportDialog}>Cancel</Button>
          </div>{" "}
        </div>
      </Dialog>
      <Dialog
        isOpen={importDialogType === "keyword"}
        onClose={closeImportDialog}
        title="Import Product Keywords"
      >
        <div className="p-4">
          {" "}
          <p>Upload CSV to import product keywords.</p>{" "}
          <Input
            type="file"
            accept=".csv"
            onChange={handleImportFileSelected}
          />{" "}
          <div className="mt-4 text-right">
            <Button onClick={closeImportDialog}>Cancel</Button>
          </div>{" "}
        </div>
      </Dialog>
    </>
  );
};

export default Products;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Dummy initial products for standalone testing (replace with API data)
const initialDummyProducts: ApiProductItem[] = [
  {
    id: 1,
    name: "iPhone 15 Pro",
    slug: "iphone-15-pro",
    sku_code: "IP15PRO",
    status: "Active",
    category_id: 1,
    sub_category_id: 11,
    brand_id: 1,
    unit: 1,
    country_id: 1,
    domain_ids: "1,2",
    color: "Titanium Blue",
    hsn_code: "8517",
    shelf_life: null,
    packaging_size: null,
    packaging_type: "Box",
    tax_rate: 18,
    procurement_lead_time: "3 days",
    description: "<p>Latest iPhone</p>",
    short_description: "New iPhone",
    payment_term: "COD",
    delivery_details: "Express",
    product_specification: null,
    thumb_image: "thumb_iphone.jpg",
    icon: null,
    product_images: JSON.stringify([
      { image: "gallery1.jpg" },
      { image: "gallery2.jpg" },
    ]),
    licence: null,
    currency_id: 1,
    meta_title: "iPhone 15 Pro",
    meta_descr: "Buy iPhone 15 Pro",
    meta_keyword: "iphone, apple",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 1, name: "Electronics" },
    brand: { id: 1, name: "Apple" },
    sub_category: { id: 11, name: "Mobiles" },
    thumb_image_full_path:
      "https://via.placeholder.com/150/0000FF/808080?Text=iPhoneThumb",
    product_images_array: [
      {
        image: "g1.jpg",
        image_full_path:
          "https://via.placeholder.com/300/FF0000/FFFFFF?Text=Img1",
      },
      {
        image: "g2.jpg",
        image_full_path:
          "https://via.placeholder.com/300/00FF00/FFFFFF?Text=Img2",
      },
    ],
  },
  {
    id: 2,
    name: "Galaxy S24 Ultra",
    slug: "galaxy-s24-ultra",
    sku_code: "GS24ULT",
    status: "Pending",
    category_id: 1,
    sub_category_id: 11,
    brand_id: 2,
    unit: 1,
    country_id: 2,
    domain_ids: "1",
    color: "Black",
    hsn_code: "8517",
    shelf_life: null,
    packaging_size: null,
    packaging_type: "Box",
    tax_rate: 18,
    procurement_lead_time: "5 days",
    description: "<p>Samsung Flagship</p>",
    short_description: "New Samsung",
    payment_term: "Prepaid",
    delivery_details: "Standard",
    product_specification: null,
    thumb_image: "thumb_s24.jpg",
    icon: null,
    product_images: null,
    licence: null,
    currency_id: 1,
    meta_title: "Galaxy S24 Ultra",
    meta_descr: "Buy Galaxy S24",
    meta_keyword: "samsung, galaxy",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: { id: 1, name: "Electronics" },
    brand: { id: 2, name: "Samsung" },
    sub_category: { id: 11, name: "Mobiles" },
    thumb_image_full_path:
      "https://via.placeholder.com/150/00FF00/808080?Text=S24Thumb",
  },
];
