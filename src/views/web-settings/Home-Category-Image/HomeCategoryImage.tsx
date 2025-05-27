import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, useFieldArray, FieldError } from "react-hook-form";
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
import DebounceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import Avatar from "@/components/ui/Avatar";
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
  TbPhoto,
  TbX,
  TbCategory2,
  TbReload,
} from "react-icons/tb";

// Types
import type { OnSortParam, ColumnDef, Row } from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux Imports
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addHomeCategoryAction,
  deletAllHomeCategoryAction, // Corrected typo
  editHomeCategoryAction,
  getHomeCategoryAction,
  getCategoriesAction,
} from "@/reduxtool/master/middleware";

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const MAX_IMAGES_PER_CATEGORY = 6;

// --- Define Types ---
export type GeneralCategoryListItem = {
  id: string | number;
  name: string;
};
export type GeneralCategoryOption = { value: string; label: string };

export type HomeCategoryImage = {
  id?: string | number;
  url: string;
};

export type HomeCategoryItem = {
  id: string | number;
  category_id: string;
  category_name?: string; // Populated client-side for display
  view_more?: string;
  images: HomeCategoryImage[];
  created_at?: string;
};

// --- Zod Schema for Add/Edit Home Category Form ---
const imageFormEntrySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  url: z.string().optional(), // URL of existing image from backend
  file: z.instanceof(File).optional(), // For new file uploads
  preview: z.string().optional(), // Client-side preview URL for new files
}).refine(data => data.url || data.file || data.preview, {
  message: "Image entry must have an existing URL or a new file.",
});

const homeCategoryFormSchema = z.object({
  category_id: z.string().min(1, "Please select a category."),
  view_more: z.string().url("View more link must be a valid URL.").optional().or(z.literal("")).nullable(), // Allow null
  images: z.array(imageFormEntrySchema)
    .min(0) // Allow no images if needed, or set to 1
    .max(MAX_IMAGES_PER_CATEGORY, `You can upload a maximum of ${MAX_IMAGES_PER_CATEGORY} images.`)
    .optional()
    .default([]),
});
type HomeCategoryFormData = z.infer<typeof homeCategoryFormSchema>;

const filterFormSchema = z.object({
  filterCategoryIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const CSV_HEADERS_HOME_CATEGORY = ["ID", "Category Name", "View More Link", "Image Count", "Image URLs", "Created At"];
const CSV_KEYS_HOME_CATEGORY: (keyof Pick<HomeCategoryItem, 'id' | 'category_name' | 'view_more' | 'created_at'> | 'imageCount' | 'imageUrlsString')[] = [
  "id", "category_name", "view_more", "imageCount", "imageUrlsString", "created_at"
];

function exportHomeCategoriesToCsv(filename: string, rows: HomeCategoryItem[]) {
  if (!rows || !rows.length) { toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>); return false; }
  const preparedRows = rows.map((row) => ({
    ...row,
    imageCount: row.images.length,
    imageUrlsString: row.images.map((img) => img.url).join("; "),
    created_at: row.created_at ? new Date(row.created_at).toLocaleString() : '-',
  }));
  const separator = ",";
  const csvContent = CSV_HEADERS_HOME_CATEGORY.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_HOME_CATEGORY.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

const ActionColumn = React.memo(({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => {
  return (
    <div className="flex items-center justify-center">
      <Tooltip title="Edit">
        <div
          className="text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          role="button"
          tabIndex={0}
          onClick={onEdit}
          onKeyDown={(e) => e.key === 'Enter' && onEdit()}
        >
          <TbPencil />
        </div>
      </Tooltip>

      <Tooltip title="Delete">
        <div
          className="text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          role="button"
          tabIndex={0}
          onClick={onDelete}
          onKeyDown={(e) => e.key === 'Enter' && onDelete()}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  );
});

type HomeCategorySearchProps = { onInputChange: (value: string) => void; };
const HomeCategoryTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: HomeCategoryTableProps) => ( <DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} /> );
const HomeCategorySearch = React.forwardRef<HTMLInputElement, HomeCategorySearchProps>(({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
HomeCategorySearch.displayName = "HomeCategorySearch";

type HomeCategoryTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void;};
const HomeCategoryTableTools = React.memo(({ onSearchChange, onFilter, onExport, onClearFilters }: HomeCategoryTableToolsProps) => ( <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full"> <div className="flex-grow"><HomeCategorySearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto"><Button title="Clear Filters" icon={<TbReload/>} onClick={()=>onClearFilters()}></Button> <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div> ));
type HomeCategorySelectedFooterProps = { selectedItems: HomeCategoryItem[]; onDeleteSelected: () => void; isDeleting: boolean };
const HomeCategorySelectedFooter = React.memo(({ selectedItems, onDeleteSelected, isDeleting }: HomeCategorySelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; const handleDeleteClick = () => setDeleteConfirmOpen(true); const handleCancelDelete = () => setDeleteConfirmOpen(false); const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmOpen(false); }; return ( <> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold flex items-center gap-1 text-sm sm:text-base"> <span className="heading-text">{selectedItems.length}</span> <span>Categor{selectedItems.length > 1 ? "ies" : "y"} selected</span> </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Categor${selectedItems.length > 1 ? "ies" : "y"}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} loading={isDeleting}> <p>Are you sure you want to delete selected entrie{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p> </ConfirmDialog> </> ); });


const HomeCategoriesListing = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomeCategoryItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HomeCategoryItem | null>(null);

  const {
    categoryData = [], // This is HomeCategoryItem[] (or similar from backend)
    status: masterLoadingStatus = "idle",
    CategoriesData = [], // This is GeneralCategoryListItem[]
  } = useSelector(masterSelector, shallowEqual);

  const generalCategoryOptions = useMemo(() => {
    if (!Array.isArray(CategoriesData)) return [];
    return CategoriesData.map((cat: GeneralCategoryListItem) => ({ value: String(cat.id), label: cat.name, }));
  }, [CategoriesData]);

  useEffect(() => {
    dispatch(getHomeCategoryAction());
    dispatch(getCategoriesAction());
  }, [dispatch]);

  const defaultFormValues: HomeCategoryFormData = useMemo(() => ({
    category_id: "", 
    view_more: "",
    images: [],
  }), []);

  const formMethods = useForm<HomeCategoryFormData>({
    resolver: zodResolver(homeCategoryFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const { control, handleSubmit, reset, formState: { errors }, watch, setValue, trigger } = formMethods;

  // imageFieldsInForm, appendImage, removeImage are from the main form's control
  const { fields: imageFieldsInForm, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: "images",
  });
  
  const watchedImages = watch("images"); // Watch the entire images array for preview updates

  // Effect to revoke object URLs for previews to prevent memory leaks
  useEffect(() => {
    const currentPreviews = watchedImages
      ?.filter(img => img.preview && img.file) // Only previews for new files
      .map(img => img.preview as string) || [];

    return () => {
      currentPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [watchedImages]);


  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterCategoryIds: [] });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<HomeCategoryItem[]>([]);
  
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);

  const cleanupPreviewsAndReset = useCallback(() => {
    watchedImages?.forEach(img => {
      if (img.preview && img.file) { // Only if it's a client-generated preview for a File
        URL.revokeObjectURL(img.preview);
      }
    });
    reset(defaultFormValues);
  }, [watchedImages, reset, defaultFormValues]);

  const openAddDrawer = useCallback(() => {
    cleanupPreviewsAndReset();
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [cleanupPreviewsAndReset]);

  const closeAddDrawer = useCallback(() => {
    setIsAddDrawerOpen(false);
    cleanupPreviewsAndReset();
  }, [cleanupPreviewsAndReset]);

  const openEditDrawer = useCallback((item: HomeCategoryItem) => {
    cleanupPreviewsAndReset(); // Clean up from any previous state
    setEditingItem(item);
    const formImages = item.images.map(img => ({
        id: img.id, 
        url: img.url, 
        file: undefined, 
        preview: img.url // Use existing URL as initial preview
    }));
    reset({
      category_id: String(item.category_id),
      view_more: item.view_more || "",
      images: formImages,
    });
    setIsEditDrawerOpen(true);
  }, [reset, cleanupPreviewsAndReset]);

  const closeEditDrawer = useCallback(() => { 
    setEditingItem(null); 
    setIsEditDrawerOpen(false); 
    cleanupPreviewsAndReset();
  }, [cleanupPreviewsAndReset]);

  const onSubmitHandler = async (data: HomeCategoryFormData) => {
    console.log("--- onSubmitHandler ---");
    console.log("Data from RHF:", JSON.parse(JSON.stringify(data))); // Deep copy for logging

    setIsSubmitting(true);
    const formDataToSubmit = new FormData();

    formDataToSubmit.append('category_id', data.category_id);
    formDataToSubmit.append('view_more', data.view_more || ""); // Send empty string if null/undefined
    
    const keepImageIds: (string|number)[] = [];

    data.images?.forEach((imgEntry, index) => {
      if (imgEntry.file instanceof File) {
        formDataToSubmit.append(`images[${index}]`, imgEntry.file, imgEntry.file.name);
        console.log(`Appending NEW FILE: images[${index}] = ${imgEntry.file.name}`);
      } else if (imgEntry.id && imgEntry.url) { // Existing image that user wants to keep
        keepImageIds.push(imgEntry.id);
        console.log(`Marking EXISTING image to KEEP (ID): ${imgEntry.id}`);
      }
      // If an entry has neither a file nor an id/url, it's an empty slot (e.g. user added slot but didn't pick file), so skip.
    });
    
    if (editingItem) {
      formDataToSubmit.append('_method', 'PUT');
      keepImageIds.forEach(id => formDataToSubmit.append('keep_image_ids[]', String(id)));
      console.log("Editing Mode - keep_image_ids[]:", keepImageIds);
    }

    for (let pair of formDataToSubmit.entries()) {
        if (pair[1] instanceof File) {
            console.log(`  ${pair[0]}: File - ${pair[1].name}, Size - ${pair[1].size}, Type - ${pair[1].type}`);
        } else {
            console.log(`  ${pair[0]}: ${pair[1]}`);
        }
    }
    
    try {
      if (editingItem) {
        if (!editingItem.id) { 
            toast.push(<Notification title="Error" type="danger">Editing item ID is missing.</Notification>);
            setIsSubmitting(false); 
            return; 
        }
        await dispatch(editHomeCategoryAction({ id: editingItem.id, formData: formDataToSubmit })).unwrap();
        toast.push(<Notification title="Home Category Updated" type="success" duration={2000}>Entry saved.</Notification>);
        closeEditDrawer();
      } else {
        await dispatch(addHomeCategoryAction({ formData: formDataToSubmit })).unwrap();
        toast.push(<Notification title="Home Category Added" type="success" duration={2000}>New entry created.</Notification>);
        closeAddDrawer();
      }
      dispatch(getHomeCategoryAction()); // Refresh data
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "An unknown error occurred.";
      toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger" duration={4000}>{errorMsg}</Notification>);
      console.error("Home Category Submit Error:", error?.response?.data || error);
    } finally { 
        setIsSubmitting(false); 
    }
  };

  const handleDeleteClick = useCallback((item: HomeCategoryItem) => { if (!item.id) return; setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  
  const onConfirmSingleDelete = useCallback(async () => { 
    if (!itemToDelete?.id) return; 
    setIsDeleting(true); 
    setSingleDeleteConfirmOpen(false); 
    try { 
      // Assuming deletAllHomeCategoryAction can take a single ID string
      await dispatch(deletAllHomeCategoryAction({ ids: String(itemToDelete.id) })).unwrap(); 
      const catName = CategoriesData.find((opt: GeneralCategoryListItem) => opt.value === String(itemToDelete.category_id))?.label || String(itemToDelete.id); 
      toast.push(<Notification title="Entry Deleted" type="success" duration={2000}>{`Entry for "${catName}" deleted.`}</Notification>); 
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id)); 
      dispatch(getHomeCategoryAction()); 
    } catch (error: any) { 
      toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{error.message || "Could not delete entry."}</Notification>); 
      console.error("Delete Error:", error); 
    } finally { 
      setIsDeleting(false); 
      setItemToDelete(null); 
    } 
  }, [dispatch, itemToDelete, CategoriesData]); // CategoriesData added

  const handleDeleteSelected = useCallback(async () => { 
    if (selectedItems.length === 0) return; 
    setIsDeleting(true); 
    const validItems = selectedItems.filter(item => item.id); 
    if (validItems.length === 0) { setIsDeleting(false); return; } 
    const idsToDelete = validItems.map(item => String(item.id)); 
    try { 
      await dispatch(deletAllHomeCategoryAction({ ids: idsToDelete.join(',') })).unwrap(); 
      toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{`${validItems.length} entr(ies) deleted.`}</Notification>); 
      setSelectedItems([]); 
      dispatch(getHomeCategoryAction()); 
    } catch (error: any) { 
      toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message || "Could not delete entries."}</Notification>); 
      console.error("Bulk Delete Error:", error); 
    } finally { 
      setIsDeleting(false); 
    } 
  }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria({ filterCategoryIds: data.filterCategoryIds || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [closeFilterDrawer, handleSetTableData]);
  const onClearFilters = useCallback(() => { const defaults = { filterCategoryIds: [] }; filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);
  
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: HomeCategoryItem[] = Array.isArray(categoryData) 
        ? categoryData.map(item => ({ 
            ...item, 
            category_name: CategoriesData.find((cat: GeneralCategoryListItem) => String(cat.id) === String(item.category_id))?.name || `ID: ${item.category_id}` 
          })) 
        : [];

    let processedData: HomeCategoryItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterCategoryIds?.length) { 
        const selectedCatIds = new Set(filterCriteria.filterCategoryIds.map(opt => opt.value)); 
        processedData = processedData.filter(item => selectedCatIds.has(String(item.category_id))); 
    }
    if (tableData.query && tableData.query.trim() !== "") { 
        const q = tableData.query.toLowerCase().trim(); 
        processedData = processedData.filter(j => 
            (j.category_name?.toLowerCase() ?? "").includes(q) || 
            (j.view_more?.toLowerCase() ?? "").includes(q) || 
            String(j.id).toLowerCase().includes(q)
        ); 
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0 && processedData[0].hasOwnProperty(key)) { 
        processedData.sort((a, b) => { 
            let aVal = a[key as keyof HomeCategoryItem]; 
            let bVal = b[key as keyof HomeCategoryItem]; 

            if (key === "created_at" && aVal && bVal) {
                 return order === "asc" ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime() : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
            }
             if (typeof aVal === 'number' && typeof bVal === 'number') {
                return order === 'asc' ? aVal - bVal : bVal - aVal;
            }
            const aStr = String(aVal ?? "").toLowerCase(); 
            const bStr = String(bVal ?? "").toLowerCase(); 
            return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr); 
        }); 
    }
    const dataToExport = [...processedData]; 
    const currentTotal = processedData.length; 
    const pageIndex = tableData.pageIndex as number; 
    const pageSize = tableData.pageSize as number; 
    const startIndex = (pageIndex - 1) * pageSize; 
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [categoryData, CategoriesData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => { const success = exportHomeCategoriesToCsv("home_categories_export.csv", allFilteredAndSortedData); if (success) toast.push(<Notification title="Export Successful" type="success" duration={2000}>Data exported.</Notification>); }, [allFilteredAndSortedData]);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: HomeCategoryItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<HomeCategoryItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => r.id && !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id).filter(id => id !== undefined)); setSelectedItems((pS) => pS.filter((i) => i.id && !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<HomeCategoryItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", enableSorting: true, size: 80, meta: { tdClass: "text-center", thClass: "text-center"} },
    { header: "Category Name", accessorKey: "category_name", enableSorting: true, size: 200 },
    { header: "View More Link", accessorKey: "view_more", enableSorting: false, size: 250, cell: ({row}) => row.original.view_more ? <a href={row.original.view_more} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-[200px]" title={row.original.view_more}>{row.original.view_more}</a> : <span className="text-gray-400">-</span> },
    { header: "Images", accessorKey: "images", enableSorting: false, size: 150, 
      cell: ({ row }) => {
        const images = Array.isArray(row.original.images) ? row.original.images : [];

        return (
          <div className="flex items-center -space-x-2">
            {images.length === 0 && (
              <span className="text-xs text-gray-400 italic">No images</span>
            )}
            {images.slice(0, 3).map((img, idx) => (
                <Avatar
                  size={30}
                  shape="circle"
                  src={img.url}
                  icon={<TbPhoto />}
                  className="ring-2 ring-white dark:ring-gray-800"
                />
            ))}
            {images.length > 3 && (
              <Avatar
                size={30}
                shape="circle"
                className="ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-xs font-semibold"
              >
                +{images.length - 3}
              </Avatar>
            )}
          </div>
        );
      },
    },
    { header: "Actions", id: "actions", meta: { HeaderClass: "text-center", cellClass: "text-center" }, size: 100, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
  ], [openEditDrawer, handleDeleteClick]);

  // This function is now defined inside HomeCategoriesListing and uses its scope
  const renderDrawerForm = () => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = event.target.files?.[0];
        if (file) {
            const oldPreview = watchedImages?.[index]?.preview;
            if (oldPreview && watchedImages?.[index]?.file) { // Revoke old client-side preview only if it was for a file
                URL.revokeObjectURL(oldPreview);
            }
            const newPreviewUrl = URL.createObjectURL(file);
            setValue(`images.${index}.file`, file, { shouldValidate: true, shouldDirty: true });
            setValue(`images.${index}.preview`, newPreviewUrl, { shouldDirty: true });
            setValue(`images.${index}.url`, undefined, { shouldDirty: true }); 
            setValue(`images.${index}.id`, undefined, { shouldDirty: true });
            trigger(`images.${index}.file`); // Trigger validation for the file field
        }
    };

    const handleRemoveImage = (index: number) => {
        const imageToRemove = watchedImages?.[index];
        if (imageToRemove?.preview && imageToRemove?.file) { // Revoke if it's a client-side preview for a File
             URL.revokeObjectURL(imageToRemove.preview);
        }
        removeImage(index);
    };

    return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem label="Category Name" className="md:col-span-2" invalid={!!errors.category_id} errorMessage={errors.category_id?.message} >
        <Controller name="category_id" control={control} render={({ field }) => (<Select placeholder="Select Category" options={generalCategoryOptions} value={generalCategoryOptions.find(o => o.value === field.value) || null} onChange={(opt) => field.onChange(opt?.value)} prefix={<TbCategory2 className="text-lg"/>} /> )} />
      </FormItem>
      <FormItem label="View More Link (Optional)" className="md:col-span-2" invalid={!!errors.view_more} errorMessage={errors.view_more?.message} >
        <Controller name="view_more" control={control} render={({ field }) => (<Input {...field} value={field.value ?? ""} type="url" placeholder="https://example.com/category/all" />)} />
      </FormItem>
      <div className="md:col-span-2">
        <FormItem 
            label={`Images (Up to ${MAX_IMAGES_PER_CATEGORY})`} 
            invalid={!!errors.images && typeof errors.images.message === 'string'} // Array-level error
            errorMessage={errors.images && typeof errors.images.message === 'string' ? errors.images.message : undefined}
        >
            {imageFieldsInForm.map((fieldEntry, index) => {
                const currentImageValue = watchedImages?.[index]; 
                const previewSrc = currentImageValue?.preview || currentImageValue?.url; 
                // @ts-ignore - RHF error typing for array fields can be tricky
                const imageEntryError = errors.images?.[index]?.message || errors.images?.[index]?.file?.message || errors.images?.[index]?.url?.message || errors.images?.[index]?.root?.message;

                return (
                    <div key={fieldEntry.id} className="flex flex-col gap-2 mb-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                        <div className="flex items-center gap-3">
                             {previewSrc ? (
                                <Avatar size={60} shape="rounded" src={previewSrc} icon={<TbPhoto />} className="mr-2 border dark:border-gray-500"/>
                            ) : (
                                <Avatar size={60} shape="rounded" icon={<TbPhoto />} className="mr-2 bg-gray-100 dark:bg-gray-700 border dark:border-gray-500"/>
                            )}
                            <div className="flex-grow">
                                <Input
                                    type="file"
                                    id={`image-upload-${index}`} // Unique ID for label association
                                    onChange={(e) => handleFileChange(e, index)}
                                    accept="image/png, image/jpeg, image/gif, image/webp"
                                />
                                {imageEntryError && (
                                    <p className="text-red-500 text-xs mt-1">{String(imageEntryError)}</p>
                                )}
                            </div>
                            <Button size="xs" shape="circle" variant="danger" icon={<TbX />} onClick={() => handleRemoveImage(index)} aria-label="Remove image" type="button" />
                        </div>
                    </div>
                );
            })}
            {imageFieldsInForm.length < MAX_IMAGES_PER_CATEGORY && (
                <Button size="sm" type="button" variant="dashed" onClick={() => appendImage({ file: undefined, url: undefined, preview: undefined, id: undefined }, {shouldFocus: false})} icon={<TbPlus />}>Add Image Slot</Button>
            )}
        </FormItem>
      </div>
    </div>
  )};

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h5 className="mb-2 sm:mb-0">Home Page Categories</h5>
                <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={masterLoadingStatus === 'loading' || isSubmitting}>Add New</Button>
            </div>
          <HomeCategoryTableTools onClearFilters={onClearFilters} onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4">
            <HomeCategoryTable columns={columns} data={pageData} loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting} pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }} selectedItems={selectedItems} onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange} onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect} />
          </div>
        </AdaptiveCard>
      </Container>
      <HomeCategorySelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />
      
      <Drawer 
        title={editingItem ? "Edit Home Category Entry" : "Add New Home Category Entry"} 
        isOpen={isAddDrawerOpen || isEditDrawerOpen} 
        onClose={editingItem ? closeEditDrawer : closeAddDrawer} 
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} 
        width={700} // Adjusted width for better form layout
        footer={ 
            <div className="text-right w-full"> 
                <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> 
                <Button 
                    size="sm" 
                    variant="solid" 
                    form="homeCategoryForm" 
                    type="submit" 
                    loading={isSubmitting} 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (editingItem ? "Saving..." : "Adding...") : (editingItem ? "Save Changes" : "Save")}
                </Button> 
            </div> 
        } 
      >
        <Form id="homeCategoryForm" onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-4 p-1"> {/* Added slight padding */}
          {renderDrawerForm()} 
        </Form>
      </Drawer>

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterHomeCategoryForm" type="submit">Apply</Button> </div> } >
        <Form id="filterHomeCategoryForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Category Name">
            <Controller name="filterCategoryIds" control={filterFormMethods.control} render={({ field }) => ( <Select isMulti placeholder="Any Category" options={generalCategoryOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} /> )} />
          </FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog 
        isOpen={singleDeleteConfirmOpen} 
        type="danger" 
        title="Delete Home Category Entry" 
        onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} 
        onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} 
        onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} 
        onConfirm={onConfirmSingleDelete} 
        loading={isDeleting} 
      >
        <p>Are you sure you want to delete this entry? (Category: <strong>{itemToDelete?.category_name || String(itemToDelete?.id)}</strong>)</p>
      </ConfirmDialog>
    </>
  );
};

export default HomeCategoriesListing;