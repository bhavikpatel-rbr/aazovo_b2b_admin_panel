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
// import Tag from "@/components/ui/Tag"; // Only if status or similar is reintroduced
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
  TbCategory2, // Changed icon
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux Imports
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  // These actions are for "Home Category" instances
  addHomeCategoryAction,
  deletAllHomeCategoryAction,
  deletHomeCategoryAction,
  editHomeCategoryAction,
  getHomeCategoryAction, // Fetches the list of "Home Category" instances

  // !!! YOU NEED TO CREATE THIS ACTION AND ITS REDUCER/SELECTOR !!!
  getCategoriesAction, // Action to fetch the list of general categories for dropdowns
} from "@/reduxtool/master/middleware"; // Adjust path as necessary

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const MAX_IMAGES_PER_CATEGORY = 6;

// --- Define Types ---

// Type for the general list of categories (for dropdowns)
export type GeneralCategoryListItem = {
  id: string | number; // e.g., 'cat_electronics', 123
  name: string;        // e.g., 'Electronics'
  // Add other fields if your general category items have more data
};
export type GeneralCategoryOption = { value: string; label: string }; // For Select component

// Type for a "Home Category" instance (what's listed in the table and being managed)
export type HomeCategoryItem = {
  id: string | number;            // ID of this specific home category entry
  category_id: string;         // ID of the general category it refers to (e.g., 'cat_electronics')
                                  // This field name 'category_id' should match your API
  category_name?: string;         // Display name of the category, derived for the table
  view_more?: string;        // API might send 'view_more'
  images: { url: string }[];
  // Include other fields from your API response for a home category like created_at, created_by etc.
  created_at?: string;
};

// --- Zod Schema for Add/Edit Home Category Form ---
const homeCategoryFormSchema = z.object({
  category_id: z.string().min(1, "Please select a category."), // Stores the ID of the general category
  view_more: z.string().url("View more link must be a valid URL.").optional().or(z.literal("")),
  
});
type HomeCategoryFormData = z.infer<typeof homeCategoryFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterCategoryIds: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;


// --- CSV Exporter Utility ---
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
  }));
  const separator = ",";
  const csvContent = CSV_HEADERS_HOME_CATEGORY.join(separator) + "\n" + preparedRows.map((row: any) => CSV_KEYS_HOME_CATEGORY.map((k) => { let cell: any = row[k]; if (cell === null || cell === undefined) cell = ""; else cell = String(cell).replace(/"/g, '""'); if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; return cell; }).join(separator)).join("\n");
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return true; }
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>); return false;
}

// --- ActionColumn Component --- (remains unchanged)
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => { /* ... */ return ( <div className="flex items-center justify-center"> <Tooltip title="Edit"> <div className={"text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"} role="button" tabIndex={0} onClick={onEdit} onKeyDown={(e) => e.key === 'Enter' && onEdit()}><TbPencil /></div> </Tooltip> <Tooltip title="Delete"> <div className={"text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"} role="button" tabIndex={0} onClick={onDelete} onKeyDown={(e) => e.key === 'Enter' && onDelete()}><TbTrash /></div> </Tooltip> </div> ); };

// --- HomeCategorySearch and TableTools --- (Name changed for clarity)
type HomeCategorySearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const HomeCategorySearch = React.forwardRef<HTMLInputElement, HomeCategorySearchProps>(({ onInputChange }, ref) => ( <DebounceInput ref={ref} className="w-full" placeholder="Quick Search ..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} /> ));
HomeCategorySearch.displayName = "HomeCategorySearch";

type HomeCategoryTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; };
const HomeCategoryTableTools = ({ onSearchChange, onFilter, onExport }: HomeCategoryTableToolsProps) => ( <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full"> <div className="flex-grow"><HomeCategorySearch onInputChange={onSearchChange} /></div> <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"> <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button> <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button> </div> </div> );

// --- HomeCategoryTable Component ---
type HomeCategoryTableProps = { columns: ColumnDef<HomeCategoryItem>[]; data: HomeCategoryItem[]; loading: boolean; pagingData: { total: number; pageIndex: number; pageSize: number }; selectedItems: HomeCategoryItem[]; onPaginationChange: (page: number) => void; onSelectChange: (value: number) => void; onSort: (sort: OnSortParam) => void; onRowSelect: (checked: boolean, row: HomeCategoryItem) => void; onAllRowSelect: (checked: boolean, rows: Row<HomeCategoryItem>[]) => void; };
const HomeCategoryTable = ({ columns, data, loading, pagingData, selectedItems, onPaginationChange, onSelectChange, onSort, onRowSelect, onAllRowSelect }: HomeCategoryTableProps) => ( <DataTable selectable columns={columns} data={data} noData={!loading && data.length === 0} loading={loading} pagingData={pagingData} checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} onPaginationChange={onPaginationChange} onSelectChange={onSelectChange} onSort={onSort} onCheckBoxChange={onRowSelect} onIndeterminateCheckBoxChange={onAllRowSelect} /> );

// --- HomeCategorySelectedFooter Component ---
type HomeCategorySelectedFooterProps = { selectedItems: HomeCategoryItem[]; onDeleteSelected: () => void; isDeleting: boolean };
const HomeCategorySelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: HomeCategorySelectedFooterProps) => { const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false); if (selectedItems.length === 0) return null; const handleDeleteClick = () => setDeleteConfirmOpen(true); const handleCancelDelete = () => setDeleteConfirmOpen(false); const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmOpen(false); }; return ( <> <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"> <div className="flex items-center justify-between w-full px-4 sm:px-8"> <span className="flex items-center gap-2"> <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span> <span className="font-semibold flex items-center gap-1 text-sm sm:text-base"> <span className="heading-text">{selectedItems.length}</span> <span>Categor{selectedItems.length > 1 ? "ies" : "y"} selected</span> </span> </span> <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}>Delete Selected</Button> </div> </StickyFooter> <ConfirmDialog isOpen={deleteConfirmOpen} type="danger" title={`Delete ${selectedItems.length} Categor${selectedItems.length > 1 ? "ies" : "y"}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete}> <p>Are you sure you want to delete selected entrie{selectedItems.length > 1 ? "s" : ""}? </p> </ConfirmDialog> </> ); };


// --- Main Component: HomeCategoriesListing --- (Consider renaming the file too)
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

  // Data for "Home Category" instances (the table)
  const {
    categoryData = [], // Make sure this selector name matches your slice
    status: masterLoadingStatus = "idle",
    // Selector for general categories (for dropdowns)
    // !!! YOU NEED TO CREATE THIS SELECTOR in masterSlice.ts !!!
    CategoriesData = [], // e.g., from state.master.generalCategories.data
  } = useSelector(masterSelector, shallowEqual);


  // Options for the "Category Name" Select component in Add/Edit Form & Filter
  const generalCategoryOptions = useMemo(() => {
    if (!Array.isArray(CategoriesData)) return [];
    return CategoriesData.map((cat: GeneralCategoryListItem) => ({
      value: String(cat.id), // Use ID as value
      label: cat.name,
    }));
  }, [CategoriesData]);


  useEffect(() => {
    dispatch(getHomeCategoryAction()); // Fetches home category instances for the table
    dispatch(getCategoriesAction()); // Fetches general categories for dropdowns
  }, [dispatch]);


  const defaultFormValues: HomeCategoryFormData = {
    category_id: generalCategoryOptions[0]?.value || "", // Default to first option or empty
    view_more: "",
    images: [{ url: "" }],
  };

  const formMethods = useForm<HomeCategoryFormData>({
    resolver: zodResolver(homeCategoryFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const { control, handleSubmit, reset, formState: { errors } } = formMethods;

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control, name: "images",
  });
  
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({ filterCategoryIds: [] });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<HomeCategoryItem[]>([]);
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);

  const openAddDrawer = useCallback(() => {
    reset(defaultFormValues); // Use the memoized/updated defaultFormValues
    setEditingItem(null);
    setIsAddDrawerOpen(true);
  }, [reset, defaultFormValues]); // Add defaultFormValues as dependency

  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback((item: HomeCategoryItem) => {
    setEditingItem(item);
    reset({
      category_id: String(item.category_id),
      view_more: item.view_more || "",
      images: item.images.length > 0 ? cloneDeep(item.images) : [{ url: "" }],
    });
    setIsEditDrawerOpen(true);
  }, [reset]);
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

  const onSubmitHandler = async (data: HomeCategoryFormData) => {
    setIsSubmitting(true);
    // Assuming your API expects the field names as in HomeCategoryFormData (e.g., category_id)
    // If API expects different names, map them here.
    const apiPayload = {
        ...data,
        category_id: data.category_id, // Already correct
        view_more: data.view_more, // Already correct
        images: data.images // Already correct array of {url: string}
    };

    try {
      if (editingItem) {
        if (!editingItem.id) { /* ID check */ setIsSubmitting(false); return; }
        await dispatch(editHomeCategoryAction({ id: editingItem.id, ...apiPayload })).unwrap();
        toast.push(<Notification title="Home Category Updated" type="success" duration={2000}>Entry saved.</Notification>);
        closeEditDrawer();
      } else {
        await dispatch(addHomeCategoryAction(apiPayload)).unwrap();
        toast.push(<Notification title="Home Category Added" type="success" duration={2000}>New entry created.</Notification>);
        closeAddDrawer();
      }
      dispatch(getHomeCategoryAction()); // Refresh the table
    } catch (error: any) {
      toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger" duration={3000}>{error?.message || "Operation failed."}</Notification>);
      console.error("Home Category Submit Error:", error);
    } finally { setIsSubmitting(false); }
  };

  // --- Delete, Filter, Table Interaction Callbacks ---
  const handleDeleteClick = useCallback((item: HomeCategoryItem) => { if (!item.id) return; setItemToDelete(item); setSingleDeleteConfirmOpen(true); }, []);
  const onConfirmSingleDelete = useCallback(async () => { if (!itemToDelete?.id) return; setIsDeleting(true); setSingleDeleteConfirmOpen(false); try { await dispatch(deletAllHomeCategoryAction({ ids: itemToDelete.id })).unwrap(); const catName = generalCategoryOptions.find(opt => opt.value === String(itemToDelete.category_id))?.label || itemToDelete.id; toast.push(<Notification title="Entry Deleted" type="success" duration={2000}>{`Entry for "${catName}" deleted.`}</Notification>); setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id)); dispatch(getHomeCategoryAction()); } catch (error: any) { toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{error.message}</Notification>); console.error("Delete Error:", error); } finally { setIsDeleting(false); setItemToDelete(null); } }, [dispatch, itemToDelete, generalCategoryOptions]);
  const handleDeleteSelected = useCallback(async () => { if (selectedItems.length === 0) return; setIsDeleting(true); const validItems = selectedItems.filter(item => item.id); if (validItems.length === 0) { setIsDeleting(false); return; } const idsToDelete = validItems.map(item => String(item.id)); try { await dispatch(deletAllHomeCategoryAction({ ids: idsToDelete.join(',') })).unwrap(); toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{`${validItems.length} entr(ies) deleted.`}</Notification>); setSelectedItems([]); dispatch(getHomeCategoryAction()); } catch (error: any) { toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error.message}</Notification>); console.error("Bulk Delete Error:", error); } finally { setIsDeleting(false); } }, [dispatch, selectedItems]);
  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => { setFilterCriteria({ filterCategoryIds: data.filterCategoryIds || [] }); handleSetTableData({ pageIndex: 1 }); closeFilterDrawer(); }, [closeFilterDrawer, handleSetTableData, filterFormMethods]);
  const onClearFilters = useCallback(() => { const defaults = { filterCategoryIds: [] }; filterFormMethods.reset(defaults); setFilterCriteria(defaults); handleSetTableData({ pageIndex: 1 }); }, [filterFormMethods, handleSetTableData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: HomeCategoryItem[] = Array.isArray(categoryData) ? categoryData.map(item => ({
        ...item,
        // Derive category_name for display and sorting
        category_name: generalCategoryOptions.find(opt => opt.value === String(item.category_id))?.label || `ID: ${item.category_id}`
    })) : [];

    let processedData: HomeCategoryItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterCategoryIds?.length) {
      const selectedCatIds = filterCriteria.filterCategoryIds.map(opt => opt.value);
      processedData = processedData.filter(item => selectedCatIds.includes(String(item.category_id)));
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
    if (order && key) {
      processedData.sort((a, b) => {
        const aVal = a[key as keyof HomeCategoryItem];
        const bVal = b[key as keyof HomeCategoryItem];
        if (key === "created_at") { /* ... date sort ... */ }
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number; const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return { pageData: dataForPage, total: currentTotal, allFilteredAndSortedData: dataToExport };
  }, [categoryData, generalCategoryOptions, tableData, filterCriteria]);

  const handleExportData = useCallback(() => { const success = exportHomeCategoriesToCsv("home_categories_export.csv", allFilteredAndSortedData); if (success) toast.push(<Notification title="Export Successful" type="success" duration={2000}>Data exported.</Notification>); }, [allFilteredAndSortedData]);
  const handleSetTableDataCb = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []); // Renamed to avoid conflict
  const handlePaginationChange = useCallback((page: number) => handleSetTableDataCb({ pageIndex: page }), [handleSetTableDataCb]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableDataCb({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableDataCb]);
  const handleSort = useCallback((sort: OnSortParam) => { handleSetTableDataCb({ sort: sort, pageIndex: 1 }); }, [handleSetTableDataCb]);
  const handleSearchChange = useCallback((query: string) => handleSetTableDataCb({ query: query, pageIndex: 1 }), [handleSetTableDataCb]);
  const handleRowSelect = useCallback((checked: boolean, row: HomeCategoryItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<HomeCategoryItem>[]) => { const cPOR = currentRows.map((r) => r.original); if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => !pSIds.has(r.id)); return [...pS, ...nRTA]; }); } else { const cPRIds = new Set(cPOR.map((r) => r.id)); setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id))); } }, []);

  const columns: ColumnDef<HomeCategoryItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
    {
      header: "Category Name",
      accessorKey: "category_name", // Use the derived category_name for display and sorting
      enableSorting: true,
      size: 200,
    },
    {
      header: "View More Link", accessorKey: "view_more", enableSorting: false, size: 250,
      cell: ({row}) => row.original.view_more ? <a href={row.original.view_more} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-[200px]" title={row.original.view_more}>{row.original.view_more}</a> : "-"
    },
    {
      header: "Images", accessorKey: "images", enableSorting: false, size: 120,
      cell: ({row}) => (<div className="flex items-center gap-1 flex-wrap"> {row.original.images.slice(0, 3).map((img, idx) => (<Tooltip title={img.url} key={idx}><Avatar size={30} shape="circle" src={img.url || undefined} icon={<TbPhoto />} /></Tooltip>))} {row.original.images.length > 3 && <Tag className="text-xs !bg-gray-100 !text-gray-600 dark:!bg-gray-600 dark:!text-gray-100">+ {row.original.images.length - 3}</Tag>} {row.original.images.length === 0 && <span className="text-xs text-gray-400">No images</span>} </div>),
    },
    
    { header: "Actions", id: "actions", meta: { HeaderClass: "text-center", cellClass: "text-center" }, size: 100, cell: (props) => <ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} /> },
  ], [generalCategoryOptions, openEditDrawer, handleDeleteClick]); // Added generalCategoryOptions dependency


  const renderDrawerForm = (currentFormMethods: typeof formMethods) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem
        label="Category Name"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.category_id}
        errorMessage={currentFormMethods.formState.errors.category_id?.message}
      >
        <Controller
          name="category_id"
          control={currentFormMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select Category"
              options={generalCategoryOptions}
              value={generalCategoryOptions.find(o => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
              prefix={<TbCategory2 />} // Icon for category
            />
          )}
        />
      </FormItem>
      <FormItem
        label="View More Link (Optional)"
        className="md:col-span-2"
        invalid={!!currentFormMethods.formState.errors.view_more}
        errorMessage={currentFormMethods.formState.errors.view_more?.message}
      >
        <Controller
          name="view_more"
          control={currentFormMethods.control}
          render={({ field }) => (<Input {...field} type="url" placeholder="https://example.com/category/all" />)}
        />
      </FormItem>

      <div className="md:col-span-2">
        <FormItem
            label={`Images (Up to ${MAX_IMAGES_PER_CATEGORY})`}
            invalid={!!currentFormMethods.formState.errors.images && typeof currentFormMethods.formState.errors.images !== 'object'} // General array error
            errorMessage={
                (currentFormMethods.formState.errors.images && typeof currentFormMethods.formState.errors.images !== 'object')
                ? (currentFormMethods.formState.errors.images as FieldError).message
                : undefined
            }
        >
            {imageFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 mb-3 p-2 border rounded dark:border-gray-600">
                    <Controller
                        name={`images.${index}.url`}
                        control={currentFormMethods.control}
                        render={({ field: inputField, fieldState }) => (
                            <Input
                                {...inputField}
                                type="url"
                                placeholder={`Image ${index + 1} URL`}
                                className="flex-grow"
                                prefix={<TbPhoto />}
                                isInvalid={!!fieldState.error}
                            />
                        )}
                    />
                    {imageFields.length > 1 && (
                        <Button
                            size="xs" shape="circle" variant="plain" icon={<TbX />}
                            onClick={() => removeImage(index)} aria-label="Remove image URL" type="button"
                        />
                    )}
                     {currentFormMethods.formState.errors.images?.[index]?.url && (
                        <p className="text-red-500 text-xs mt-1 col-span-full">
                            {currentFormMethods.formState.errors.images[index]?.url?.message}
                        </p>
                    )}
                </div>
            ))}
            {imageFields.length < MAX_IMAGES_PER_CATEGORY && (
                <Button size="sm" type="button" variant="dashed" onClick={() => appendImage({ url: "" })} icon={<TbPlus />}>
                    Add Another Image URL
                </Button>
            )}
        </FormItem>
      </div>
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h5 className="mb-2 sm:mb-0">Home Page Categories</h5>
                <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Entry</Button>
            </div>
          <HomeCategoryTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4">
            <HomeCategoryTable
              columns={columns} data={pageData}
              loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting}
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectedItems={selectedItems}
              onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
              onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <HomeCategorySelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />

      <Drawer
        title={editingItem ? "Edit Home Category Entry" : "Add New Home Category Entry"}
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={700}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button> <Button size="sm" variant="solid" form="homeCategoryForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (editingItem ? "Saving..." : "Adding...") : (editingItem ? "Save Changes" : "Save")}</Button> </div> }
      >
        <Form id="homeCategoryForm" onSubmit={handleSubmit(onSubmitHandler)} className="flex flex-col gap-4">
          {renderDrawerForm(formMethods)}
        </Form>
      </Drawer>

      <Drawer
        title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer}
        footer={ <div className="text-right w-full"> <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button> <Button size="sm" variant="solid" form="filterHomeCategoryForm" type="submit">Apply</Button> </div> }
      >
        <Form id="filterHomeCategoryForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Category Name">
            <Controller name="filterCategoryIds" control={filterFormMethods.control}
              render={({ field }) => ( <Select isMulti placeholder="Any Category" options={generalCategoryOptions} value={field.value || []} onChange={(val) => field.onChange(val || [])} /> )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Home Category Entry"
        onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onConfirm={onConfirmSingleDelete} loading={isDeleting}
      >
        <p>Are you sure you want to delete this entry? (Category: <strong>{itemToDelete?.category_name || itemToDelete?.id}</strong>)</p>
      </ConfirmDialog>
    </>
  );
};

export default HomeCategoriesListing;