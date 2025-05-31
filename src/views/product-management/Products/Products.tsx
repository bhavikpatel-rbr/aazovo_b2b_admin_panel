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
  Card,
} from "@/components/ui";
import Dropdown from "@/components/ui/Dropdown";

// Icons
import {
  TbPencil, TbTrash, TbChecks, TbSearch, TbCloudUpload, TbFilter, TbPlus, TbBox,
  TbSwitchHorizontal, TbCopy, TbCloudDownload, TbEye, TbMailForward, TbPhoto, TbFileText,
  TbSettings, TbClipboardText, TbX, TbInfoCircle, TbDotsVertical, TbLink, TbPhone,
  TbLayoutDashboard, TbWorldWww, TbTypography, TbTags, TbHistory, TbCalendarPlus,
  TbCalendarEvent, TbBoxOff, TbCategory, TbActivityHeartbeat,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row, CellContext } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
  getProductsAction, addProductAction, editProductAction, deleteProductAction,
  deleteAllProductsAction, getDomainsAction, getCategoriesAction,
  getSubcategoriesByCategoryIdAction, getBrandsAction, getUnitsAction, getCountriesAction,
  changeProductStatusAction
} from "@/reduxtool/master/middleware"; // Ensure these are correctly implemented
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Ensure clearSubcategories is implemented if needed
import { useSelector } from "react-redux";

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
  status: "Active" | "Inactive" | "Pending" | "Draft";
  licence: string | null;
  currency_id: string | number | null;
  product_specification: string | null;
  meta_title: string | null;
  meta_descr: string | null;
  meta_keyword: string | null;
  domain_ids: string | null;
  created_at: string;
  updated_at: string;
  icon_full_path?: string;
  thumb_image_full_path?: string;
  product_images_array?: { id?: number; image: string; image_full_path: string; }[];
  category?: { id: number; name: string } | null;
  sub_category?: { id: number; name: string } | null;
  brand?: { id: number; name: string } | null;
  unit_obj?: { id: number; name: string } | null;
  country_obj?: { id: number; name: string } | null;
};

export type ProductStatus = "active" | "inactive" | "pending" | "draft";

export type ProductGalleryImageItem = {
  id?: number; file?: File; previewUrl: string; serverPath?: string;
  isNew?: boolean; isDeleted?: boolean;
};

export type ProductItem = {
  id: number; name: string; slug: string; skuCode: string | null; status: ProductStatus;
  categoryId: number | null; categoryName?: string; subCategoryId: number | null; subCategoryName?: string;
  brandId: number | null; brandName?: string; unitId: number | null; unitName?: string;
  countryId: number | null; countryName?: string; domainIds: number[]; domainNames?: string[];
  color: string | null; hsnCode: string | null; shelfLife: string | null;
  packagingSize: string | null; packagingType: string | null; taxRate: string | number | null;
  procurementLeadTime: string | null; description: string | null; shortDescription: string | null;
  paymentTerm: string | null; deliveryDetails: string | null; productSpecification: string | null;
  icon: string | null; iconFullPath: string | null; thumbImage: string | null; thumbImageFullPath: string | null;
  productImages: ProductGalleryImageItem[]; metaTitle: string | null; metaDescription: string | null;
  metaKeyword: string | null; createdAt: string; updatedAt: string;
};

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required.").max(255),
  slug: z.string().min(1, "Slug is required.").max(255),
  sku_code: z.string().max(50).optional().nullable(),
  status: z.enum(["Active", "Inactive", "Pending", "Draft"]),
  domain_ids: z.array(z.number()).min(1, "Select at least one domain."),
  category_id: z.number({ invalid_type_error: "Category is required."}).positive("Category is required.").nullable(),
  sub_category_id: z.number().positive().nullable().optional(),
  brand_id: z.number({ invalid_type_error: "Brand is required."}).positive("Brand is required.").nullable(),
  unit_id: z.number({ invalid_type_error: "Unit is required."}).positive("Unit is required.").nullable(),
  country_id: z.number({ invalid_type_error: "Country is required."}).positive("Country is required.").nullable(),
  color: z.string().max(50).optional().nullable(),
  hsn_code: z.string().max(50).optional().nullable(),
  shelf_life: z.string().max(50).optional().nullable(),
  packaging_size: z.string().max(100).optional().nullable(),
  packaging_type: z.string().max(100).optional().nullable(),
  tax_rate: z.string().max(20).refine(val => !val || !isNaN(parseFloat(val)), { message: "Tax rate must be a number"}).optional().nullable(),
  procurement_lead_time: z.string().max(50).optional().nullable(),
  thumb_image_input: z.union([z.instanceof(File), z.null()]).optional().nullable(),
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

const filterFormSchema = z.object({
  filterNameOrSku: z.string().optional(),
  filterCategoryIds: z.array(z.number()).optional(),
  filterSubCategoryIds: z.array(z.number()).optional(),
  filterBrandIds: z.array(z.number()).optional(),
  filterStatuses: z.array(z.enum(["active", "inactive", "pending", "draft"])).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const PRODUCT_THUMB_IMAGE_BASE_URL = import.meta.env.VITE_API_URL_STORAGE || "https://your-api-domain.com/storage/product_thumbs/";
const PRODUCT_IMAGES_BASE_URL = import.meta.env.VITE_API_URL_STORAGE || "https://your-api-domain.com/storage/product_gallery/";
const TABS = { ALL: "all", PENDING: "pending" };
const FORM_TABS = { GENERAL: "general", DESCRIPTION: "description", MEDIA: "media", META: "meta" };
const productStatusColor: Record<ProductStatus, string> = { active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100", inactive: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-100", pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100", draft: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-100"};
const uiProductStatusOptions: { value: ProductStatus; label: string }[] = [ { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "pending", label: "Pending" }, { value: "draft", label: "Draft" }];
const apiProductStatusOptions: { value: "Active" | "Inactive" | "Pending" | "Draft"; label: string }[] = [ { value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, { value: "Pending", label: "Pending" }, { value: "Draft", label: "Draft" }];

const ActionColumn = ({ onEdit, onViewDetail, onDelete, onChangeStatus }: { onEdit: () => void; onViewDetail: () => void; onDelete: () => void; onChangeStatus: () => void; }) => (
  <div className="flex items-center justify-center gap-1">
    <Tooltip title="View"><div className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" role="button" onClick={onViewDetail}><TbEye /></div></Tooltip>
    <Tooltip title="Edit"><div className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400" role="button" onClick={onEdit}><TbPencil /></div></Tooltip>
    <Tooltip title="Delete"><div className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" role="button" onClick={onDelete}><TbTrash /></div></Tooltip>
    <Dropdown placement="bottom-end" renderTitle={<Tooltip title="More"><div className="text-xl cursor-pointer p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"><TbDotsVertical /></div></Tooltip>}>
      <Dropdown.Item eventKey="changeStatus" onClick={onChangeStatus} className="text-xs flex items-center gap-2"><TbSwitchHorizontal size={16}/> Change Status</Dropdown.Item>
      <Dropdown.Item eventKey="sendLaunchMail" onClick={() => toast.push(<Notification title="Not Implemented" type="info">Send Launch Mail</Notification>)} className="text-xs flex items-center gap-2"><TbMailForward size={16} /> Send Launch Mail</Dropdown.Item>
    </Dropdown>
  </div>
);
const ProductSearch = React.forwardRef<HTMLInputElement, { onInputChange: (value: string) => void }>(({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Search Product Name, SKU..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />));
ProductSearch.displayName = "ProductSearch";
const ProductTableTools = ({ onSearchChange, onFilter }: { onSearchChange: (query: string) => void; onFilter: () => void; }) => (<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full"><div className="flex-grow"><ProductSearch onInputChange={onSearchChange} /></div><div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"><Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button></div></div>);
const ProductSelectedFooter = ({ selectedItems, onDeleteSelected }: { selectedItems: ProductItem[]; onDeleteSelected: () => void; }) => { const [deleteOpen, setDeleteOpen] = useState(false); if (selectedItems.length === 0) return null; return (<><StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"><div className="flex items-center justify-between w-full px-4 sm:px-8"><span className="flex items-center gap-2"><span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span><span className="font-semibold flex items-center gap-1 text-sm sm:text-base"><span className="heading-text">{selectedItems.length}</span><span>Product{selectedItems.length > 1 ? "s" : ""} selected</span></span></span><div className="flex items-center gap-3"><Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={() => setDeleteOpen(true)}>Delete Selected</Button></div></div></StickyFooter><ConfirmDialog isOpen={deleteOpen} type="danger" title={`Delete ${selectedItems.length} Product${selectedItems.length > 1 ? "s" : ""}`} onClose={() => setDeleteOpen(false)} onRequestClose={() => setDeleteOpen(false)} onCancel={() => setDeleteOpen(false)} onConfirm={() => { onDeleteSelected(); setDeleteOpen(false); }}><p>Are you sure you want to delete the selected product{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p></ConfirmDialog></>);};
interface DialogDetailRowProps { label: string; value: string | React.ReactNode; isLink?: boolean; preWrap?: boolean; breakAll?: boolean; labelClassName?: string; valueClassName?: string; className?: string; }
const DialogDetailRow: React.FC<DialogDetailRowProps> = ({ label, value, isLink, preWrap, breakAll, labelClassName = "text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider", valueClassName = "text-sm text-slate-700 dark:text-slate-100 mt-0.5", className = ""}) => (<div className={`py-1.5 ${className}`}><p className={`${labelClassName}`}>{label}</p>{isLink ? (<a href={typeof value === 'string' && (value.startsWith('http') ? value : `/${value}`) || '#'} target="_blank" rel="noopener noreferrer" className={`${valueClassName} hover:underline text-blue-600 dark:text-blue-400 ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</a>) : (<div className={`${valueClassName} ${breakAll ? 'break-all' : ''} ${preWrap ? 'whitespace-pre-wrap' : ''}`}>{value}</div>)}</div>);

const Products = () => {
  const dispatch = useAppDispatch();
  const {
    ProductsData = [], DomainsData = [], CategoriesData: GlobalCategoriesData = [],
    SubcategoriesData = [], BrandsData = [], UnitsData = [], CountriesData = [],
    status: masterLoadingStatus = "idle"
  } = useSelector(masterSelector);

  const [currentListTab, setCurrentListTab] = useState<string>(TABS.ALL);
  const [currentFormTab, setCurrentFormTab] = useState<string>(FORM_TABS.GENERAL);
  const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isViewDetailModalOpen, setIsViewDetailModalOpen] = useState(false);
  const [productToView, setProductToView] = useState<ProductItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({});
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "", key: "" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<ProductItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [isProcessingStatusChange, setIsProcessingStatusChange] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProductItem | null>(null);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const [importDialogType, setImportDialogType] = useState<null | "product" | "keyword">(null);

  const [thumbImagePreviewUrl, setThumbImagePreviewUrl] = useState<string | null>(null);
  const [newThumbImageFile, setNewThumbImageFile] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<ProductGalleryImageItem[]>([]);

  const [domainOptions, setDomainOptions] = useState<{ value: number; label: string }[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: number; label: string }[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<{ value: number; label: string }[]>([]);
  const [brandOptions, setBrandOptions] = useState<{ value: number; label: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<{ value: number; label: string }[]>([]);
  const [countryOptions, setCountryOptions] = useState<{ value: number; label: string }[]>([]);

  const [isChangeStatusDialogOpen, setIsChangeStatusDialogOpen] = useState(false);
  const [productForStatusChange, setProductForStatusChange] = useState<ProductItem | null>(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState<ProductStatus | ''>('');

  const formMethods = useForm<ProductFormData>({ resolver: zodResolver(productFormSchema), mode: "onChange" });
  const { watch: watchForm, setValue: setFormValue } = formMethods; // Destructure for easier use

  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const { watch: watchFilter } = filterFormMethods;


  // ONE-TIME DATA FETCH: This useEffect runs only once when the component mounts
  // because `dispatch` is a stable function reference.
  useEffect(() => {
    console.log("Products Component: Mounting - Fetching initial dropdown data and products.");
    dispatch(getProductsAction()); // Products might be fetched more often later (e.g., after add/edit)
    dispatch(getDomainsAction());
    dispatch(getCategoriesAction());
    dispatch(getBrandsAction());
    dispatch(getUnitsAction());
    dispatch(getCountriesAction());
  }, [dispatch]);

  // Populate local state options for dropdowns when Redux data changes.
  // These will run initially after the one-time fetch, and then only if Redux state itself changes.
  useEffect(() => setDomainOptions(DomainsData?.map((d: any) => ({ value: d.id, label: d.name })) || []), [DomainsData]);
  useEffect(() => setCategoryOptions(GlobalCategoriesData?.map((c: any) => ({ value: c.id, label: c.name })) || []), [GlobalCategoriesData]);
  useEffect(() => setBrandOptions(BrandsData?.map((b: any) => ({ value: b.id, label: b.name })) || []), [BrandsData]);
  useEffect(() => setUnitOptions(UnitsData?.map((u: any) => ({ value: u.id, label: u.name })) || []), [UnitsData]);
  useEffect(() => setCountryOptions(CountriesData?.map((c: any) => ({ value: c.id, label: c.name })) || []), [CountriesData]);

  // --- Subcategory Logic ---
  const watchedFormCategoryId = watchForm("category_id");

  // Effect to fetch subcategories when category_id in the FORM changes
  useEffect(() => {
    if (watchedFormCategoryId && typeof watchedFormCategoryId === 'number' && watchedFormCategoryId > 0) {
      dispatch(getSubcategoriesByCategoryIdAction(watchedFormCategoryId));
      // Reset sub_category_id field in the form when category changes,
      // but only if we are not in the process of initializing the form for an existing product
      // where 'editingProduct' would have the same categoryId as 'watchedFormCategoryId'.
      if (!editingProduct || editingProduct.categoryId !== watchedFormCategoryId) {
          setFormValue("sub_category_id", undefined, { shouldValidate: true });
      }
    } else if (!watchedFormCategoryId) {
      // If category is cleared in the form, clear the subcategories in Redux store and form field.
      // dispatch(clearSubcategories()); // Assumes clearSubcategories action exists in your slice
      setFormValue("sub_category_id", undefined, { shouldValidate: true });
    }
  }, [watchedFormCategoryId, dispatch, setFormValue, editingProduct]);

  // Effect to update local subcategoryOptions when SubcategoriesData from Redux store changes
  useEffect(() => {
    if (SubcategoriesData && SubcategoriesData.length > 0) {
      setSubcategoryOptions(SubcategoriesData.map((sc: any) => ({ value: sc.id, label: sc.name })));
    } else {
      setSubcategoryOptions([]); // Clear local options if Redux store is empty or cleared
    }
  }, [SubcategoriesData]);

  useEffect(() => { // Cleanup for image previews
    return () => {
      if (thumbImagePreviewUrl) URL.revokeObjectURL(thumbImagePreviewUrl);
      galleryImages.forEach(img => { if (img.isNew && img.previewUrl) URL.revokeObjectURL(img.previewUrl); });
    };
  }, [thumbImagePreviewUrl, galleryImages]);

  const mappedProducts: ProductItem[] = useMemo(() => {
    if (!Array.isArray(ProductsData)) return [];
    return ProductsData.map((apiItem: ApiProductItem): ProductItem => {
      let iconFullPath: string | null = null;
      if (apiItem.icon_full_path) iconFullPath = apiItem.icon_full_path;
      else if (apiItem.icon) iconFullPath = `${PRODUCT_IMAGES_BASE_URL}${apiItem.icon}`;
      let thumbImageFullPath: string | null = null;
      if (apiItem.thumb_image_full_path) thumbImageFullPath = apiItem.thumb_image_full_path;
      else if (apiItem.thumb_image) thumbImageFullPath = `${PRODUCT_THUMB_IMAGE_BASE_URL}${apiItem.thumb_image}`;
      const parsedDomainIds = apiItem.domain_ids ? apiItem.domain_ids.split(",").map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [];
      const domainNames = parsedDomainIds.map(id => domainOptions.find(d => d.value === id)?.label).filter(Boolean) as string[];
      const gallery: ProductGalleryImageItem[] = [];
      if (apiItem.product_images_array && Array.isArray(apiItem.product_images_array)) {
        apiItem.product_images_array.forEach(imgObj => gallery.push({ id: imgObj.id, serverPath: imgObj.image, previewUrl: imgObj.image_full_path, isNew: false, isDeleted: false }));
      } else if (typeof apiItem.product_images === 'string') {
        try { const imagesArray = JSON.parse(apiItem.product_images); if (Array.isArray(imagesArray)) imagesArray.forEach((imgFilename: string) => gallery.push({ serverPath: imgFilename, previewUrl: `${PRODUCT_IMAGES_BASE_URL}${imgFilename}`, isNew: false, isDeleted: false }));
        } catch (e) { /* console.error("Failed to parse product_images JSON string", e); */ }
      }
      return {
        id: apiItem.id, name: apiItem.name, slug: apiItem.slug, skuCode: apiItem.sku_code,
        status: (apiItem.status?.toLowerCase() || "draft") as ProductStatus,
        categoryId: apiItem.category_id ? Number(apiItem.category_id) : null,
        categoryName: apiItem.category?.name || categoryOptions.find(c => c.value === Number(apiItem.category_id))?.label,
        subCategoryId: apiItem.sub_category_id ? Number(apiItem.sub_category_id) : null,
        subCategoryName: apiItem.sub_category?.name || SubcategoriesData.find((sc:any) => sc.id === Number(apiItem.sub_category_id))?.name, // Prioritize SubcategoriesData from current context
        brandId: apiItem.brand_id ? Number(apiItem.brand_id) : null,
        brandName: apiItem.brand?.name || brandOptions.find(b => b.value === Number(apiItem.brand_id))?.label,
        unitId: apiItem.unit ? Number(apiItem.unit) : null,
        unitName: apiItem.unit_obj?.name || unitOptions.find(u => u.value === Number(apiItem.unit))?.label,
        countryId: apiItem.country_id ? Number(apiItem.country_id) : null,
        countryName: apiItem.country_obj?.name || countryOptions.find(c => c.value === Number(apiItem.country_id))?.label,
        domainIds: parsedDomainIds, domainNames, color: apiItem.color, hsnCode: apiItem.hsn_code, shelfLife: apiItem.shelf_life,
        packagingSize: apiItem.packaging_size, packagingType: apiItem.packaging_type, taxRate: apiItem.tax_rate,
        procurementLeadTime: apiItem.procurement_lead_time, description: apiItem.description,
        shortDescription: apiItem.short_description, paymentTerm: apiItem.payment_term,
        deliveryDetails: apiItem.delivery_details, productSpecification: apiItem.product_specification,
        icon: apiItem.icon, iconFullPath, thumbImage: apiItem.thumb_image, thumbImageFullPath,
        productImages: gallery, metaTitle: apiItem.meta_title, metaDescription: apiItem.meta_descr, metaKeyword: apiItem.meta_keyword,
        createdAt: apiItem.created_at, updatedAt: apiItem.updated_at,
      };
    });
  }, [ProductsData, domainOptions, categoryOptions, SubcategoriesData, brandOptions, unitOptions, countryOptions]); // SubcategoriesData is now a direct dependency for subCategoryName

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: ProductItem[] = cloneDeep(mappedProducts);
    if (currentListTab === TABS.PENDING) processedData = processedData.filter(p => p.status === 'pending' || p.status === 'draft');
    if (filterCriteria.filterNameOrSku) { const query = filterCriteria.filterNameOrSku.toLowerCase(); processedData = processedData.filter(p => p.name.toLowerCase().includes(query) || p.skuCode?.toLowerCase().includes(query)); }
    if (filterCriteria.filterCategoryIds?.length) { const ids = new Set(filterCriteria.filterCategoryIds); processedData = processedData.filter(p => p.categoryId && ids.has(p.categoryId)); }
    if (filterCriteria.filterSubCategoryIds?.length) { const ids = new Set(filterCriteria.filterSubCategoryIds); processedData = processedData.filter(p => p.subCategoryId && ids.has(p.subCategoryId)); }
    if (filterCriteria.filterBrandIds?.length) { const ids = new Set(filterCriteria.filterBrandIds); processedData = processedData.filter(p => p.brandId && ids.has(p.brandId)); }
    if (filterCriteria.filterStatuses?.length) { const statuses = new Set(filterCriteria.filterStatuses); processedData = processedData.filter(p => statuses.has(p.status)); }
    if (tableData.query) { const query = tableData.query.toLowerCase(); processedData = processedData.filter(p => p.name.toLowerCase().includes(query) || p.skuCode?.toLowerCase().includes(query) || p.categoryName?.toLowerCase().includes(query) || p.brandName?.toLowerCase().includes(query));}
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) { processedData.sort((a, b) => { const aVal = a[key as keyof ProductItem]; const bVal = b[key as keyof ProductItem]; if (aVal === null || aVal === undefined) return order === 'asc' ? -1 : 1; if (bVal === null || bVal === undefined) return order === 'asc' ? 1 : -1; if (typeof aVal === 'number' && typeof bVal === 'number') return order === 'asc' ? aVal - bVal : bVal - aVal; if (typeof aVal === 'string' && typeof bVal === 'string') return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal); const strA = String(aVal); const strB = String(bVal); return order === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA); });}
    const currentTotal = processedData.length; const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number; const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [mappedProducts, tableData, filterCriteria, currentListTab]);

  const handleListTabChange = useCallback((tabKey: string) => { setCurrentListTab(tabKey); setTableData(prev => ({ ...prev, pageIndex: 1, query: "" })); setSelectedItems([]); }, []);
  const handleFormTabChange = useCallback((tabKey: string) => setCurrentFormTab(tabKey), []);

  const openAddDrawer = useCallback(() => {
    setEditingProduct(null); // Important to set before reset, so subcategory logic knows it's not an edit
    // dispatch(clearSubcategories()); // Clear any existing subcategories
    formMethods.reset({ name: "", slug: "", sku_code: "", status: "Draft", domain_ids: [], category_id: null, sub_category_id: null, brand_id: null, unit_id: null, country_id: null, color: "", hsn_code: "", shelf_life: "", packaging_size: "", packaging_type: "", tax_rate: "", procurement_lead_time: "", thumb_image_input: null, description: "", short_description: "", payment_term: "", delivery_details: "", product_specification: "", meta_title: "", meta_descr: "", meta_keyword: "", });
    setCurrentFormTab(FORM_TABS.GENERAL);
    setThumbImagePreviewUrl(null); setNewThumbImageFile(null); setGalleryImages([]);
    setIsAddEditDrawerOpen(true);
  }, [formMethods, dispatch]);

  const openEditDrawer = useCallback((product: ProductItem) => {
    setEditingProduct(product); // Set editingProduct first
    // The formMethods.reset will set category_id, which then triggers the watcher useEffect
    // to fetch subcategories if product.categoryId is valid.
    formMethods.reset({
        name: product.name, slug: product.slug, sku_code: product.skuCode,
        status: apiProductStatusOptions.find(s => s.value.toLowerCase() === product.status)?.value || 'Draft',
        domain_ids: product.domainIds || [], category_id: product.categoryId, sub_category_id: product.subCategoryId,
        brand_id: product.brandId, unit_id: product.unitId, country_id: product.countryId,
        color: product.color, hsn_code: product.hsnCode, shelf_life: product.shelfLife,
        packaging_size: product.packagingSize, packaging_type: product.packagingType,
        tax_rate: String(product.taxRate || ''), procurement_lead_time: product.procurementLeadTime,
        thumb_image_input: null, description: product.description, short_description: product.shortDescription,
        payment_term: product.paymentTerm, delivery_details: product.deliveryDetails,
        product_specification: product.productSpecification, meta_title: product.metaTitle,
        meta_descr: product.metaDescription, meta_keyword: product.metaKeyword,
    });
    setCurrentFormTab(FORM_TABS.GENERAL);
    setThumbImagePreviewUrl(product.thumbImageFullPath); setNewThumbImageFile(null);
    setGalleryImages(product.productImages.map(img => ({ ...img, isNew: false, isDeleted: false })) || []);
    setIsAddEditDrawerOpen(true);
  }, [formMethods]); // dispatch removed as subcategory fetch is handled by watcher

  const closeAddEditDrawer = useCallback(() => { setIsAddEditDrawerOpen(false); setEditingProduct(null); formMethods.reset(); }, [formMethods, dispatch]);

  const onProductFormSubmit = useCallback(async (data: ProductFormData) => {
    setIsSubmitting(true); const formData = new FormData();
    if (editingProduct) formData.append("_method", "PUT");
    Object.entries(data).forEach(([key, value]) => { if (key === "thumb_image_input") return; if (key === "domain_ids" && Array.isArray(value)) { value.forEach(id => formData.append("domain_ids[]", String(id))); } else if (value !== null && value !== undefined && String(value).trim() !== "") { formData.append(key, String(value)); } else if (value === null && (key === 'category_id' || key === 'sub_category_id' || key === 'brand_id' || key === 'unit_id' || key === 'country_id')) { formData.append(key, ""); }});
    if (newThumbImageFile) formData.append("thumb_image", newThumbImageFile);
    else if (editingProduct && !thumbImagePreviewUrl && editingProduct.thumbImage) formData.append("delete_thumb_image", "1");
    let imageIndex = 0; galleryImages.forEach((img) => { if (img.file && img.isNew && !img.isDeleted) { formData.append(`product_images[${imageIndex}]`, img.file); imageIndex++; } else if (img.id && img.isDeleted) { formData.append("deleted_image_ids[]", String(img.id)); }});
    try {
        if (editingProduct) { await dispatch(editProductAction({ id: editingProduct.id, formData })).unwrap(); toast.push(<Notification type="success" title="Product Updated">Product "{data.name}" updated successfully.</Notification>); }
        else { await dispatch(addProductAction(formData)).unwrap(); toast.push(<Notification type="success" title="Product Added">Product "{data.name}" added successfully.</Notification>); }
        closeAddEditDrawer(); dispatch(getProductsAction());
    } catch (error: any) { const errorMsg = error.response?.data?.message || error.message || (editingProduct ? "Could not update product." : "Could not add product."); toast.push(<Notification type="danger" title="Operation Failed">{errorMsg}</Notification>);
    } finally { setIsSubmitting(false); }
  }, [editingProduct, dispatch, closeAddEditDrawer, newThumbImageFile, galleryImages, thumbImagePreviewUrl]);

  const handleDeleteProductClick = useCallback((product: ProductItem) => { setItemToDelete(product); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete) return; setIsProcessingDelete(true); try { await dispatch(deleteProductAction(itemToDelete.id)).unwrap(); toast.push(<Notification type="success" title="Product Deleted">Product "{itemToDelete.name}" deleted.</Notification>); dispatch(getProductsAction()); } catch (error: any) { toast.push(<Notification type="danger" title="Delete Failed">{error.message || "Could not delete product."}</Notification>); } finally { setIsProcessingDelete(false); setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}, [dispatch, itemToDelete]);
  const onDeleteSelectedProducts = useCallback(async () => { if (selectedItems.length === 0) return; setIsProcessingDelete(true); const idsToDelete = selectedItems.map(item => item.id); try { await dispatch(deleteAllProductsAction({ ids: idsToDelete.join(',') })).unwrap(); toast.push(<Notification type="success" title="Products Deleted">{selectedItems.length} products deleted.</Notification>); setSelectedItems([]); dispatch(getProductsAction()); } catch (error: any) { toast.push(<Notification type="danger" title="Bulk Delete Failed">{error.message || "Could not delete products."}</Notification>); } finally { setIsProcessingDelete(false); }}, [dispatch, selectedItems]);
  const handleChangeStatusClick = (product: ProductItem) => { setProductForStatusChange(product); setSelectedNewStatus(product.status); setIsChangeStatusDialogOpen(true); };
  const onConfirmChangeStatus = async () => { if (!productForStatusChange || !selectedNewStatus) return; setIsProcessingStatusChange(true); const apiStatus = apiProductStatusOptions.find(opt => opt.value.toLowerCase() === selectedNewStatus.toLowerCase())?.value || selectedNewStatus; try { await dispatch(changeProductStatusAction({ productId: productForStatusChange.id, status: apiStatus })).unwrap(); toast.push(<Notification type="success" title="Status Updated" duration={2000}>Product status changed to {selectedNewStatus}.</Notification>); } catch (error: any) { toast.push(<Notification type="danger" title="Status Update Failed">{error.message || "Could not update status."}</Notification>); } finally { setIsProcessingStatusChange(false); setIsChangeStatusDialogOpen(false); setProductForStatusChange(null); }};
  const openViewDetailModal = useCallback((product: ProductItem) => { setProductToView(product); setIsViewDetailModalOpen(true); }, []);
  const closeViewDetailModal = useCallback(() => { setIsViewDetailModalOpen(false); setProductToView(null); }, []);
  const openImageViewer = useCallback((imageUrl: string | null) => { if (imageUrl) { setImageToView(imageUrl); setImageViewerOpen(true); } }, []);
  const closeImageViewer = useCallback(() => { setImageViewerOpen(false); setImageToView(null); }, []);
  const handleExportProducts = useCallback(() => { toast.push(<Notification title="Export Products (Not Implemented)" />) }, []);
  const handleImportProducts = useCallback(() => setImportDialogType("product"), []);
  const closeImportDialog = useCallback(() => setImportDialogType(null), []);
  const handleImportFileSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file && importDialogType) { toast.push(<Notification title={`Importing ${importDialogType} (Not Implemented)`} message={`File: ${file.name}`} />); closeImportDialog(); } if (event.target) event.target.value = ""; }, [importDialogType, closeImportDialog]);
  const handlePaginationChange = useCallback((page: number) => setTableData(prev => ({ ...prev, pageIndex: page })), []);
  const handlePageSizeChange = useCallback((value: number) => { setTableData(prev => ({ ...prev, pageSize: value, pageIndex: 1 })); setSelectedItems([]); }, []);
  const handleSort = useCallback((sort: OnSortParam) => setTableData(prev => ({ ...prev, sort, pageIndex: 1 })), []);
  const handleSearchChange = useCallback((query: string) => setTableData(prev => ({ ...prev, query, pageIndex: 1 })), []);
  const handleRowSelect = useCallback((checked: boolean, row: ProductItem) => setSelectedItems(prev => checked ? (prev.some(i => i.id === row.id) ? prev : [...prev, row]) : prev.filter(i => i.id !== row.id)), []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<ProductItem>[]) => { const originals = currentRows.map(r => r.original); if (checked) setSelectedItems(prev => { const oldIds = new Set(prev.map(i => i.id)); return [...prev, ...originals.filter(o => !oldIds.has(o.id))]; }); else { const currentIds = new Set(originals.map(o => o.id)); setSelectedItems(prev => prev.filter(i => !currentIds.has(i.id))); }}, []);
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria(data); handlePaginationChange(1); closeFilterDrawer(); }, [handlePaginationChange, closeFilterDrawer]);
  const onClearFilters = useCallback(() => { filterFormMethods.reset({}); setFilterCriteria({}); handlePaginationChange(1); closeFilterDrawer(); }, [filterFormMethods, handlePaginationChange, closeFilterDrawer]);

  const columns: ColumnDef<ProductItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", size: 60, meta: { tdClass: "text-center", thClass: "text-center" } },
    { header: "Product", id: "productInfo", size: 300, cell: (props: CellContext<ProductItem, any>) => (<div className="flex items-center gap-3"><Avatar size="md" shape="circle" src={props.row.original.thumbImageFullPath || undefined} icon={<TbBox />} className={props.row.original.thumbImageFullPath ? "cursor-pointer" : ""} onClick={() => props.row.original.thumbImageFullPath && openImageViewer(props.row.original.thumbImageFullPath)} /><div><span className="font-semibold hover:text-blue-600 cursor-pointer" onClick={() => openViewDetailModal(props.row.original)}>{props.row.original.name}</span><div className="text-xs text-gray-500">SKU: {props.row.original.skuCode || "-"}</div></div></div>)},
    { header: "Category", accessorKey: "categoryName", cell: props => props.row.original.categoryName || "-" }, { header: "Sub Cat", accessorKey: "subCategoryName", cell: props => props.row.original.subCategoryName || "-" }, { header: "Brand", accessorKey: "brandName", cell: props => props.row.original.brandName || "-" },
    { header: "Status", accessorKey: "status", cell: (props: CellContext<ProductItem, any>) => (<Tag className={`${productStatusColor[props.row.original.status] || 'bg-gray-200'} capitalize font-semibold border-0`}>{props.row.original.status}</Tag>) },
    { header: "Actions", id: "action", size: 130, meta: { HeaderClass: "text-center" }, cell: (props: CellContext<ProductItem, any>) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} onViewDetail={() => openViewDetailModal(props.row.original)} onDelete={() => handleDeleteProductClick(props.row.original)} onChangeStatus={() => handleChangeStatusClick(props.row.original)} />) },
  ], [openImageViewer, openEditDrawer, openViewDetailModal, handleDeleteProductClick, handleChangeStatusClick]); // Dependencies should be stable

  const tableIsLoading = masterLoadingStatus === "idle" || isSubmitting || isProcessingDelete || isProcessingStatusChange;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          {/* Header and Tabs */}
          <div className="lg:flex items-center justify-between mb-0"> <h5 className="mb-4 lg:mb-0">Products</h5> <div className="flex items-center gap-2"> <Dropdown title="More Options" className="mr-2"> <Dropdown.Item eventKey="Export Product" onClick={handleExportProducts}>Export Products</Dropdown.Item> <Dropdown.Item eventKey="Import Product" onClick={handleImportProducts}>Import Products</Dropdown.Item> <Dropdown.Item eventKey="Export Keywords" onClick={() => toast.push(<Notification title="Not Implemented"/>)}>Export Keywords</Dropdown.Item> <Dropdown.Item eventKey="Import Keywords" onClick={() => setImportDialogType("keyword")}>Import Keywords</Dropdown.Item> </Dropdown> <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New</Button> </div> </div>
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700"> <nav className="-mb-px flex space-x-8" aria-label="Tabs"> {[TABS.ALL, TABS.PENDING].map(tab => (<button key={tab} onClick={() => handleListTabChange(tab)} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${currentListTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{tab.replace('_', ' ')} Products</button>))} </nav> </div>
          <ProductTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} />
          {/* Data Table */}
          <div className="mt-4 flex-grow overflow-y-auto"> <DataTable columns={columns} data={pageData} loading={tableIsLoading} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectable selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handlePageSizeChange} onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect} /> </div>
        </AdaptiveCard>
      </Container>
      <ProductSelectedFooter selectedItems={selectedItems} onDeleteSelected={onDeleteSelectedProducts} />

      {/* Add/Edit Drawer */}
      <Drawer title={editingProduct ? "Edit Product" : "Add New Product"} isOpen={isAddEditDrawerOpen} onClose={closeAddEditDrawer} onRequestClose={closeAddEditDrawer} width={800} bodyClass="flex flex-col h-full pt-0" footer={<div className="text-right w-full"><Button size="sm" className="mr-2" type="button" onClick={closeAddEditDrawer} disabled={isSubmitting}>Cancel</Button><Button size="sm" variant="solid" form="productForm" type="submit" loading={isSubmitting} disabled={isSubmitting || !formMethods.formState.isValid || (editingProduct && !formMethods.formState.isDirty && !newThumbImageFile && galleryImages.every(img => !img.isNew && !img.isDeleted) ) }>{isSubmitting ? (editingProduct ? "Saving..." : "Adding...") : "Save"}</Button></div>}>
        <Form id="productForm" onSubmit={formMethods.handleSubmit(onProductFormSubmit)} className="flex flex-col gap-y-0 h-full">
            <div className="border-b border-gray-200 dark:border-gray-700 sticky top-0 pt-3 bg-white dark:bg-gray-800 z-10 px-4"> <nav className=" flex space-x-6" aria-label="Tabs"> {[FORM_TABS.GENERAL, FORM_TABS.DESCRIPTION, FORM_TABS.MEDIA, FORM_TABS.META].map(tab => (<button key={tab} type="button" onClick={() => handleFormTabChange(tab)} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm capitalize flex items-center gap-2 ${currentFormTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{tab === FORM_TABS.GENERAL && <TbSettings/>} {tab === FORM_TABS.DESCRIPTION && <TbFileText/>}{tab === FORM_TABS.MEDIA && <TbPhoto/>}{tab === FORM_TABS.META && <TbClipboardText/>}{tab.replace('_', ' ')}</button>))} </nav> </div>
            <div className="flex-grow overflow-y-auto pt-4 px-4 pb-4">
              {currentFormTab === FORM_TABS.GENERAL && ( <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0"> <FormItem label="Product Name" isRequired invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}><Controller name="name" control={formMethods.control} render={({ field }) => <Input {...field} />} /></FormItem> {/* ... other general fields ... */} <FormItem label="Slug / Url" isRequired invalid={!!formMethods.formState.errors.slug} errorMessage={formMethods.formState.errors.slug?.message}><Controller name="slug" control={formMethods.control} render={({ field }) => <Input {...field} />} /></FormItem> <FormItem label="SKU Code" invalid={!!formMethods.formState.errors.sku_code} errorMessage={formMethods.formState.errors.sku_code?.message}><Controller name="sku_code" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem> <FormItem label="Status" isRequired invalid={!!formMethods.formState.errors.status} errorMessage={formMethods.formState.errors.status?.message}><Controller name="status" control={formMethods.control} render={({ field }) => <UiSelect options={apiProductStatusOptions} value={apiProductStatusOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} />} /></FormItem> <FormItem label="Domains" isRequired className="md:col-span-2" invalid={!!formMethods.formState.errors.domain_ids} errorMessage={formMethods.formState.errors.domain_ids?.message}><Controller name="domain_ids" control={formMethods.control} render={({ field }) => <UiSelect isMulti options={domainOptions} value={domainOptions.filter(opt => field.value?.includes(opt.value))} onChange={opts => field.onChange(opts ? opts.map(opt => opt.value) : [])} />} /></FormItem> <FormItem label="Category" isRequired invalid={!!formMethods.formState.errors.category_id} errorMessage={formMethods.formState.errors.category_id?.message}><Controller name="category_id" control={formMethods.control} render={({ field }) => <UiSelect options={categoryOptions} value={categoryOptions.find(o => o.value === field.value)} onChange={opt => { field.onChange(opt?.value); }} isClearable />} /></FormItem> <FormItem label="Sub Category" invalid={!!formMethods.formState.errors.sub_category_id} errorMessage={formMethods.formState.errors.sub_category_id?.message as string | undefined}><Controller name="sub_category_id" control={formMethods.control} render={({ field }) => <UiSelect options={subcategoryOptions} value={subcategoryOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable isDisabled={!watchedFormCategoryId || subcategoryOptions.length === 0} placeholder={!watchedFormCategoryId ? "Select category first" : (subcategoryOptions.length === 0 && !!watchedFormCategoryId ? "No subcategories" : "Select subcategory")} />} /></FormItem> {/* ... other general fields ... */} <FormItem label="Brand" isRequired invalid={!!formMethods.formState.errors.brand_id} errorMessage={formMethods.formState.errors.brand_id?.message}><Controller name="brand_id" control={formMethods.control} render={({ field }) => <UiSelect options={brandOptions} value={brandOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem> <FormItem label="Unit" isRequired invalid={!!formMethods.formState.errors.unit_id} errorMessage={formMethods.formState.errors.unit_id?.message}><Controller name="unit_id" control={formMethods.control} render={({ field }) => <UiSelect options={unitOptions} value={unitOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem> <FormItem label="Country of Origin" isRequired invalid={!!formMethods.formState.errors.country_id} errorMessage={formMethods.formState.errors.country_id?.message}><Controller name="country_id" control={formMethods.control} render={({ field }) => <UiSelect options={countryOptions} value={countryOptions.find(o => o.value === field.value)} onChange={opt => field.onChange(opt?.value)} isClearable />} /></FormItem> <FormItem label="Color" invalid={!!formMethods.formState.errors.color} errorMessage={formMethods.formState.errors.color?.message}><Controller name="color" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem> <FormItem label="HSN Code" invalid={!!formMethods.formState.errors.hsn_code} errorMessage={formMethods.formState.errors.hsn_code?.message}><Controller name="hsn_code" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem> <FormItem label="Shelf Life" invalid={!!formMethods.formState.errors.shelf_life} errorMessage={formMethods.formState.errors.shelf_life?.message}><Controller name="shelf_life" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem> <FormItem label="Packaging Size" invalid={!!formMethods.formState.errors.packaging_size} errorMessage={formMethods.formState.errors.packaging_size?.message}><Controller name="packaging_size" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem> <FormItem label="Packaging Type" invalid={!!formMethods.formState.errors.packaging_type} errorMessage={formMethods.formState.errors.packaging_type?.message}><Controller name="packaging_type" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem> <FormItem label="Tax Rate (%)" invalid={!!formMethods.formState.errors.tax_rate} errorMessage={formMethods.formState.errors.tax_rate?.message}><Controller name="tax_rate" control={formMethods.control} render={({ field }) => <Input type="number" {...field} value={field.value ?? ""} />} /></FormItem> <FormItem label="Procurement Lead Time" invalid={!!formMethods.formState.errors.procurement_lead_time} errorMessage={formMethods.formState.errors.procurement_lead_time?.message}><Controller name="procurement_lead_time" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""}/>} /></FormItem> </div> )}
              {currentFormTab === FORM_TABS.DESCRIPTION && ( <div className="flex flex-col gap-y-4"> <FormItem label="Description" invalid={!!formMethods.formState.errors.description} errorMessage={formMethods.formState.errors.description?.message}><Controller name="description" control={formMethods.control} render={({ field }) => <Input textArea {...field} rows={8} value={field.value ?? ""}/>} /></FormItem> {/* ... other description fields ... */}  <FormItem label="Short Description" invalid={!!formMethods.formState.errors.short_description} errorMessage={formMethods.formState.errors.short_description?.message}><Controller name="short_description" control={formMethods.control} render={({ field }) => <Input textArea {...field} rows={4} value={field.value ?? ""}/>} /></FormItem> <FormItem label="Payment Term" invalid={!!formMethods.formState.errors.payment_term} errorMessage={formMethods.formState.errors.payment_term?.message}><Controller name="payment_term" control={formMethods.control} render={({ field }) => <Input textArea {...field} rows={3} value={field.value ?? ""}/>} /></FormItem> <FormItem label="Delivery Details" invalid={!!formMethods.formState.errors.delivery_details} errorMessage={formMethods.formState.errors.delivery_details?.message}><Controller name="delivery_details" control={formMethods.control} render={({ field }) => <Input textArea {...field} rows={3} value={field.value ?? ""}/>} /></FormItem> <FormItem label="Product Specification" invalid={!!formMethods.formState.errors.product_specification} errorMessage={formMethods.formState.errors.product_specification?.message}><Controller name="product_specification" control={formMethods.control} render={({ field }) => <Input textArea {...field} rows={5} value={field.value ?? ""}/>} /></FormItem> </div> )}
              {currentFormTab === FORM_TABS.MEDIA && ( <div> <FormItem label="Thumbnail Image (Max 1MB, 600x600 recommended)" className="mb-4" invalid={!!formMethods.formState.errors.thumb_image_input} errorMessage={formMethods.formState.errors.thumb_image_input?.message as string | undefined}> <Controller name="thumb_image_input" control={formMethods.control} render={({ field: { onChange, onBlur, name, ref } }) => (<Input type="file" name={name} ref={ref} onBlur={onBlur} onChange={e => { const file = e.target.files?.[0] || null; onChange(file); setNewThumbImageFile(file); if (thumbImagePreviewUrl) URL.revokeObjectURL(thumbImagePreviewUrl); setThumbImagePreviewUrl(file ? URL.createObjectURL(file) : (editingProduct && editingProduct.thumbImageFullPath && !file ? editingProduct.thumbImageFullPath : null) ); }} accept="image/*" /> )} /> {(thumbImagePreviewUrl) && (<div className="mt-2 relative w-32 h-32"><Avatar src={thumbImagePreviewUrl} size={120} shape="rounded" className="w-full h-full"/> <Button size="xs" shape="circle" variant="solid" color="red-500" icon={<TbX/>} className="absolute -top-2 -right-2" onClick={() => { setNewThumbImageFile(null); if(thumbImagePreviewUrl && !editingProduct?.thumbImageFullPath?.includes(thumbImagePreviewUrl)) URL.revokeObjectURL(thumbImagePreviewUrl); setThumbImagePreviewUrl(editingProduct?.thumbImageFullPath && newThumbImageFile === null ? editingProduct.thumbImageFullPath : null); formMethods.setValue('thumb_image_input', null); }}/> </div> )} </FormItem> <label className="form-label block mb-2">Product Gallery Images (Max 5, 1024x1024 recommended)</label> <Input type="file" multiple accept="image/*" onChange={e => { const files = Array.from(e.target.files || []); const currentNonDeletedCount = galleryImages.filter(img => !img.isDeleted).length; const newImages = files.slice(0, 5 - currentNonDeletedCount).map(file => ({ file, previewUrl: URL.createObjectURL(file), isNew: true, isDeleted: false })); setGalleryImages(prev => [...prev.filter(img => !img.isDeleted), ...newImages]); if(e.target) e.target.value = ""; }} disabled={galleryImages.filter(img => !img.isDeleted).length >= 5} /> <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"> {galleryImages.filter(img => !img.isDeleted).map((image) => (<div key={image.id || image.previewUrl} className="relative group w-32 h-32"><Avatar src={image.previewUrl} size={120} shape="rounded" className="w-full h-full" /> <Button shape="circle" size="xs" icon={<TbX />} className="absolute top-1 right-1 bg-red-500 text-white opacity-75 group-hover:opacity-100" onClick={() => { if (image.isNew) { URL.revokeObjectURL(image.previewUrl); setGalleryImages(prev => prev.filter(img => img.previewUrl !== image.previewUrl)); } else { setGalleryImages(prev => prev.map(img => (img.id === image.id || img.serverPath === image.serverPath) ? { ...img, isDeleted: true } : img )); } }} /></div>))} </div> </div> )}
              {currentFormTab === FORM_TABS.META && ( <div className="flex flex-col gap-y-4"> <FormItem label="Meta Tag Title" invalid={!!formMethods.formState.errors.meta_title} errorMessage={formMethods.formState.errors.meta_title?.message}><Controller name="meta_title" control={formMethods.control} render={({ field }) => <Input {...field} value={field.value ?? ""} />} /></FormItem> {/* ... other meta fields ... */} <FormItem label="Meta Tag Description" invalid={!!formMethods.formState.errors.meta_descr} errorMessage={formMethods.formState.errors.meta_descr?.message}><Controller name="meta_descr" control={formMethods.control} render={({ field }) => <Input textArea {...field} rows={4} value={field.value ?? ""}/>} /></FormItem> <FormItem label="Meta Tag Keywords" invalid={!!formMethods.formState.errors.meta_keyword} errorMessage={formMethods.formState.errors.meta_keyword?.message}><Controller name="meta_keyword" control={formMethods.control} render={({ field }) => <Input textArea {...field} rows={3} placeholder="keyword1, keyword2" value={field.value ?? ""}/>} /></FormItem> </div> )}
            </div>
        </Form>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} footer={<div className="text-right w-full"><Button size="sm" className="mr-2" onClick={onClearFilters}>Clear</Button><Button size="sm" variant="solid" form="filterProductForm" type="submit">Apply</Button></div>}>
        <Form id="filterProductForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Name or SKU"><Controller name="filterNameOrSku" control={filterFormMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Name or SKU"/>} /></FormItem>
          <FormItem label="Categories"><Controller name="filterCategoryIds" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Categories" options={categoryOptions} value={categoryOptions.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value))} />} /></FormItem>
          <FormItem label="Sub Categories"><Controller name="filterSubCategoryIds" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Sub Categories" options={subcategoryOptions} value={subcategoryOptions.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value))} isDisabled={!watchFilter("filterCategoryIds")?.length || subcategoryOptions.length === 0} />} /></FormItem> {/* Corrected watch */}
          <FormItem label="Brands"><Controller name="filterBrandIds" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Brands" options={brandOptions} value={brandOptions.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value))} />} /></FormItem>
          <FormItem label="Status"><Controller name="filterStatuses" control={filterFormMethods.control} render={({ field }) => <UiSelect isMulti placeholder="Select Status" options={uiProductStatusOptions} value={uiProductStatusOptions.filter(o => field.value?.includes(o.value))} onChange={opts => field.onChange(opts?.map(o => o.value))} />} /></FormItem>
        </Form>
      </Drawer>

      {/* Dialogs: Delete, Status Change, Image Viewer, Import */}
      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Product" onClose={() => {setSingleDeleteConfirmOpen(false); setItemToDelete(null);}} onRequestClose={() => {setSingleDeleteConfirmOpen(false); setItemToDelete(null);}} onCancel={() => {setSingleDeleteConfirmOpen(false); setItemToDelete(null);}} onConfirm={onConfirmSingleDelete} loading={isProcessingDelete}><p>Are you sure you want to delete the product "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p></ConfirmDialog>
      <Dialog isOpen={isChangeStatusDialogOpen} onClose={() => setIsChangeStatusDialogOpen(false)} onRequestClose={() => setIsChangeStatusDialogOpen(false)} title={`Change Status for "${productForStatusChange?.name || ''}"`}> <div className="p-4"> <FormItem label="New Status" className="mb-4"> <UiSelect options={uiProductStatusOptions} value={uiProductStatusOptions.find(o => o.value === selectedNewStatus)} onChange={opt => setSelectedNewStatus(opt?.value || '')} /> </FormItem> <div className="text-right"> <Button size="sm" className="mr-2" onClick={() => setIsChangeStatusDialogOpen(false)} disabled={isProcessingStatusChange}>Cancel</Button> <Button size="sm" variant="solid" onClick={onConfirmChangeStatus} loading={isProcessingStatusChange} disabled={!selectedNewStatus}>Confirm Change</Button> </div> </div> </Dialog>
      <Dialog isOpen={isImageViewerOpen} onClose={closeImageViewer} title="View Image" width={600} footer={<Button onClick={closeImageViewer}>Close</Button>}><div className="p-4 flex justify-center items-center">{imageToView && <img src={imageToView} alt="Product view" className="max-w-full max-h-[80vh] object-contain"/>}</div></Dialog>
      <Dialog isOpen={importDialogType === 'product'} onClose={closeImportDialog} title="Import Products" footer={<Button onClick={closeImportDialog}>Cancel</Button>}><div className="p-4"><p>Upload CSV to import products.</p><Input type="file" accept=".csv" onChange={handleImportFileSelected} /></div></Dialog>
      <Dialog isOpen={importDialogType === 'keyword'} onClose={closeImportDialog} title="Import Product Keywords" footer={<Button onClick={closeImportDialog}>Cancel</Button>}><div className="p-4"><p>Upload CSV to import product keywords.</p><Input type="file" accept=".csv" onChange={handleImportFileSelected} /></div></Dialog>

      {/* Enhanced Product Detail View Modal */}
      <Dialog isOpen={isViewDetailModalOpen} onClose={closeViewDetailModal} size="lg" title="" contentClassName="!p-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden">
        {productToView ? ( <div className="max-h-[90vh] flex flex-col"> <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 sticky top-0 bg-white dark:bg-slate-800 z-10"> {productToView.thumbImageFullPath && <Avatar size="lg" src={productToView.thumbImageFullPath} icon={<TbBox />} />} <h5 className="font-semibold text-slate-700 dark:text-white truncate">{productToView.name}</h5> </div> <div className="p-5 overflow-y-auto space-y-6 text-sm"> <Card> <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">Basic Information</h6> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3"> <DialogDetailRow label="ID" value={String(productToView.id)} /> <DialogDetailRow label="SKU Code" value={productToView.skuCode || '-'} /> <DialogDetailRow label="Status" value={<Tag className={`${productStatusColor[productToView.status]} capitalize font-semibold border-0`}>{productToView.status}</Tag>} /> <DialogDetailRow label="Slug" value={productToView.slug} isLink breakAll /> <DialogDetailRow label="Color" value={productToView.color || '-'} /> <DialogDetailRow label="HSN Code" value={productToView.hsnCode || '-'} /> </div> </Card> <Card> <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">Categorization & Origin</h6> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3"> <DialogDetailRow label="Category" value={productToView.categoryName || '-'} /> <DialogDetailRow label="Sub Category" value={productToView.subCategoryName || '-'} /> <DialogDetailRow label="Brand" value={productToView.brandName || '-'} /> <DialogDetailRow label="Unit" value={productToView.unitName || '-'} /> <DialogDetailRow label="Country of Origin" value={productToView.countryName || '-'} /> <DialogDetailRow label="Domains" value={productToView.domainNames?.join(', ') || '-'} /> </div> </Card> <Card> <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">Logistics & Specifications</h6> <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3"> <DialogDetailRow label="Shelf Life" value={productToView.shelfLife || '-'} /> <DialogDetailRow label="Packaging Size" value={productToView.packagingSize || '-'} /> <DialogDetailRow label="Packaging Type" value={productToView.packagingType || '-'} /> <DialogDetailRow label="Tax Rate" value={productToView.taxRate ? `${productToView.taxRate}%` : '-'} /> <DialogDetailRow label="Procurement Lead Time" value={productToView.procurementLeadTime || '-'} /> </div> {productToView.productSpecification && <DialogDetailRow label="Product Specification" value={productToView.productSpecification} preWrap className="md:col-span-2 lg:col-span-3"/>} </Card> {(productToView.description || productToView.shortDescription || productToView.paymentTerm || productToView.deliveryDetails) && <Card> <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">Descriptions & Terms</h6> {productToView.shortDescription && <DialogDetailRow label="Short Description" value={productToView.shortDescription} preWrap />} {productToView.description && <DialogDetailRow label="Full Description" value={productToView.description} preWrap />} {productToView.paymentTerm && <DialogDetailRow label="Payment Term" value={productToView.paymentTerm} preWrap />} {productToView.deliveryDetails && <DialogDetailRow label="Delivery Details" value={productToView.deliveryDetails} preWrap />} </Card>} {productToView.productImages && productToView.productImages.length > 0 && ( <Card> <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">Product Gallery</h6> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"> {productToView.productImages.filter(img => !img.isDeleted).map((img, idx) => ( <Avatar key={idx} src={img.previewUrl} size={100} shape="rounded" className="cursor-pointer hover:ring-2 ring-indigo-500" onClick={() => openImageViewer(img.previewUrl)} /> ))} </div> </Card> )} {(productToView.metaTitle || productToView.metaDescription || productToView.metaKeyword) && <Card> <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">SEO Information</h6> {productToView.metaTitle && <DialogDetailRow label="Meta Title" value={productToView.metaTitle} />} {productToView.metaDescription && <DialogDetailRow label="Meta Description" value={productToView.metaDescription} preWrap />} {productToView.metaKeyword && <DialogDetailRow label="Meta Keywords" value={productToView.metaKeyword} />} </Card>} <Card> <h6 className="font-semibold mb-3 text-base text-slate-600 dark:text-slate-300">Timestamps</h6> <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3"> <DialogDetailRow label="Created At" value={new Date(productToView.createdAt).toLocaleString()} /> <DialogDetailRow label="Last Updated At" value={new Date(productToView.updatedAt).toLocaleString()} /> </div> </Card> </div> <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-right sticky bottom-0 bg-white dark:bg-slate-800 z-10"> <Button onClick={closeViewDetailModal}>Close</Button> </div> </div> ) : ( <div className="p-8 text-center"><TbInfoCircle size={42} className="text-slate-400 dark:text-slate-500 mb-2 mx-auto" /><p className="text-sm font-medium text-slate-600 dark:text-slate-400">No Product Information</p><p className="text-xs text-slate-500 mt-1">Details could not be loaded.</p><div className="mt-5"><Button variant="solid" color="blue-600" onClick={closeViewDetailModal} size="sm">Dismiss</Button></div></div>)}
      </Dialog>
    </>
  );
};

export default Products;