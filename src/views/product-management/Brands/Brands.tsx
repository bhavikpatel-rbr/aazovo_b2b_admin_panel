import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, useFieldArray } from "react-hook-form";
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
import DebounceInput from "@/components/shared/DebouceInput"; // Corrected spelling
import Select from "@/components/ui/Select";
import Avatar from "@/components/ui/Avatar";
import Tag from "@/components/ui/Tag";
// DatePicker removed as date field is removed
import { Drawer, Form, FormItem, Input } from "@/components/ui";

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
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import {
  addHomeCategoryAction,
  deletAllHomeCategoryAction,
  deletHomeCategoryAction,
  editHomeCategoryAction,
  getHomeCategoryAction,
} from "@/reduxtool/master/middleware";

// Helper for class names
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- Constants ---
const MAX_IMAGES_PER_CATEGORY = 6;

// statusOptionsConst and statusColorsConst removed

// --- Define Category Type ---
export type CategoryItem = {
  id: string | number;
  name: string;
  description?: string;
  images: { url: string }[];
  // date and status removed
};

// --- Zod Schema for Add/Edit Category Form ---
const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  description: z.string().optional().or(z.literal("")),
  images: z
    .array(
      z.object({
        url: z
          .string()
          .url("Each image must have a valid URL.")
          .min(1, "Image URL cannot be empty."),
      })
    )
    .min(1, "At least one image is required.")
    .max(
      MAX_IMAGES_PER_CATEGORY,
      `You can add up to ${MAX_IMAGES_PER_CATEGORY} images.`
    ),
  // date and status schema removed
});
type CategoryFormData = z.infer<typeof categoryFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // filterStatus schema removed
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS_CATEGORY = [
  "ID",
  "Category Name",
  "Description",
  "Image Count",
  "Image URLs",
];
const CSV_KEYS_CATEGORY: (
  | 'id'
  | 'name'
  | 'description'
  | 'imageCount'
  | 'imageUrlsString'
)[] = [
  "id",
  "name",
  "description",
  "imageCount",
  "imageUrlsString",
];

function exportCategoriesToCsv(filename: string, rows: CategoryItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const preparedRows = rows.map((row) => ({
    ...row, // Contains id, name, description, images (images won't be directly used by CSV_KEYS_CATEGORY)
    imageCount: row.images.length,
    imageUrlsString: row.images.map((img) => img.url).join("; "),
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_CATEGORY.join(separator) +
    "\n" +
    preparedRows
      .map((row: any) =>
        CSV_KEYS_CATEGORY.map((k) => {
          let cell: any = row[k];
          if (cell === null || cell === undefined) cell = "";
          else cell = String(cell).replace(/"/g, '""');
          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator)
      )
      .join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
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

// --- ActionColumn Component ---
const ActionColumn = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center">
      <Tooltip title="Edit">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
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
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          )}
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
};

// --- CategorySearch and TableTools ---
type CategorySearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const CategorySearch = React.forwardRef<HTMLInputElement, CategorySearchProps>(
  ({ onInputChange }, ref) => (
    <DebounceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search (ID, Name, Description)..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
CategorySearch.displayName = "CategorySearch";

type CategoryTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
};
const CategoryTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: CategoryTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <CategorySearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>
    </div>
  </div>
);

// --- CategoryTable Component ---
type CategoryTableProps = {
  columns: ColumnDef<CategoryItem>[];
  data: CategoryItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: CategoryItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: CategoryItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<CategoryItem>[]) => void;
};
const CategoryTable = ({
  columns,
  data,
  loading,
  pagingData,
  selectedItems,
  onPaginationChange,
  onSelectChange,
  onSort,
  onRowSelect,
  onAllRowSelect,
}: CategoryTableProps) => {
  return (
    <DataTable
      selectable
      columns={columns}
      data={data}
      noData={!loading && data.length === 0}
      loading={loading}
      pagingData={pagingData}
      checkboxChecked={(row) =>
        selectedItems.some((selected) => selected.id === row.id)
      }
      onPaginationChange={onPaginationChange}
      onSelectChange={onSelectChange}
      onSort={onSort}
      onCheckBoxChange={onRowSelect}
      onIndeterminateCheckBoxChange={onAllRowSelect}
    />
  );
};

// --- CategorySelectedFooter Component ---
type CategorySelectedFooterProps = {
  selectedItems: CategoryItem[];
  onDeleteSelected: () => void;
};
const CategorySelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: CategorySelectedFooterProps) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => {
    onDeleteSelected();
    setDeleteConfirmationOpen(false);
  };
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
              <span className="heading-text"> {selectedItems.length} </span>
              <span>
                Categor{selectedItems.length > 1 ? "ies" : "y"} selected
              </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Categor${
          selectedItems.length > 1 ? "ies" : "y"
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected categor
          {selectedItems.length > 1 ? "ies" : "y"}? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Categories Component ---
const Categories = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  const { categoryData = [], status: masterLoadingStatus = "idle" } =
    useSelector(masterSelector);

  useEffect(() => {
    dispatch(getHomeCategoryAction());
  }, [dispatch]);

  const formMethods = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      images: [{ url: "" }],
    },
    mode: "onChange",
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control: formMethods.control,
    name: "images",
  });

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<CategoryItem[]>([]);


  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const openAddDrawer = useCallback(() => {
    formMethods.reset({
      name: "",
      description: "",
      images: [{ url: "" }],
    });
    setEditingCategory(null);
    setIsAddDrawerOpen(true);
  }, [formMethods]);

  const closeAddDrawer = useCallback(() => {
    // formMethods.reset(); // Resetting is done in openAddDrawer or specific needs
    setIsAddDrawerOpen(false);
  }, []);

  const openEditDrawer = useCallback((category: CategoryItem) => {
    setEditingCategory(category);
    formMethods.reset({
      name: category.name,
      description: category.description || "",
      images: category.images.length > 0 ? cloneDeep(category.images) : [{ url: "" }],
    });
    setIsEditDrawerOpen(true);
  }, [formMethods]);

  const closeEditDrawer = useCallback(() => {
    // setEditingCategory(null); // Not strictly necessary if drawer closes
    // formMethods.reset();
    setIsEditDrawerOpen(false);
  }, []);

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        if (!editingCategory.id && editingCategory.id !== 0) { // Check for valid ID
          toast.push(<Notification title="Error" type="danger">Cannot edit: Category ID is missing.</Notification>);
          setIsSubmitting(false); return;
        }
        await dispatch(editHomeCategoryAction({ id: editingCategory.id, ...data })).unwrap();
        toast.push(<Notification title="Category Updated" type="success" duration={2000}>Category "{data.name}" updated.</Notification>);
        closeEditDrawer();
      } else {
        await dispatch(addHomeCategoryAction(data)).unwrap();
        toast.push(<Notification title="Category Added" type="success" duration={2000}>Category "{data.name}" added.</Notification>);
        closeAddDrawer();
      }
      dispatch(getHomeCategoryAction());
    } catch (error: any) {
      toast.push(<Notification title={editingCategory ? "Failed to Update" : "Failed to Add"} type="danger" duration={3000}>{error?.message || `Could not ${editingCategory ? "update" : "add"} category.`}</Notification>);
      console.error(`${editingCategory ? "Edit" : "Add"} Category Error:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = useCallback((category: CategoryItem) => {
    if (category.id === undefined || category.id === null || category.id === "") {
      toast.push(<Notification title="Error" type="danger">Cannot delete: Category ID is missing.</Notification>);
      return;
    }
    setCategoryToDelete(category);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = async () => {
    if (!categoryToDelete || (categoryToDelete.id === undefined || categoryToDelete.id === null || categoryToDelete.id === "")) {
      toast.push(<Notification title="Error" type="danger">Cannot delete: Category ID is missing or invalid.</Notification>);
      setCategoryToDelete(null); setSingleDeleteConfirmOpen(false); setIsDeleting(false); return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deletHomeCategoryAction(categoryToDelete.id)).unwrap();
      toast.push(<Notification title="Category Deleted" type="success" duration={2000}>Category "{categoryToDelete.name}" deleted.</Notification>);
      setSelectedItems((prev) => prev.filter((item) => item.id !== categoryToDelete!.id));
      dispatch(getHomeCategoryAction());
    } catch (error: any) {
      toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{error?.message || `Could not delete category.`}</Notification>);
      console.error("Delete Category Error:", error);
    } finally {
      setIsDeleting(false); setCategoryToDelete(null);
    }
  };

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) {
      toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>);
      return;
    }
    setIsDeleting(true);
    const validItemsToDelete = selectedItems.filter(item => item.id !== undefined && item.id !== null && item.id !== "");
    const idsToDelete = validItemsToDelete.map((item) => item.id);

    if (validItemsToDelete.length !== selectedItems.length) {
      toast.push(<Notification title="Deletion Warning" type="warning" duration={4000}>{selectedItems.length - validItemsToDelete.length} item(s) had invalid IDs and were skipped.</Notification>);
    }
    if (idsToDelete.length === 0) {
      toast.push(<Notification title="No Valid Items" type="info">No valid items selected for deletion.</Notification>);
      setIsDeleting(false); return;
    }
    try {
      await dispatch(deletAllHomeCategoryAction({ ids: idsToDelete.join(',') })).unwrap();
      toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{idsToDelete.length} categor{idsToDelete.length > 1 ? "ies" : "y"} processed for deletion.</Notification>);
      setSelectedItems([]);
      dispatch(getHomeCategoryAction());
    } catch (error: any) {
      toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{error?.message || "Failed to delete selected categories."}</Notification>);
      console.error("Delete selected categories error:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedItems, dispatch]);


  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(cloneDeep(filterCriteria));
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);

  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    setFilterCriteria({
      filterNames: data.filterNames || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  }, [handleSetTableData, closeFilterDrawer]);

  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterNames: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  }, [filterFormMethods, handleSetTableData]);


  const categoryNameOptionsForFilter = useMemo(() => {
    if (!Array.isArray(categoryData)) return [];
    const uniqueNames = new Set(categoryData.map((cat) => cat.name?.trim()).filter(Boolean));
    return Array.from(uniqueNames).map((name) => ({ value: name, label: name }));
  }, [categoryData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: CategoryItem[] = cloneDeep(Array.isArray(categoryData) ? categoryData : []);

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedNames = filterCriteria.filterNames.map(opt => opt.value.toLowerCase());
      processedData = processedData.filter(item => selectedNames.includes(item.name?.trim().toLowerCase() ?? ""));
    }
    // Status filter logic removed

    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(item =>
        String(item.id).toLowerCase().includes(query) ||
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && ["id", "name", "description"].includes(key) && processedData.length > 0) { // Removed date, status from sortable keys
        processedData.sort((a, b) => {
        const aVal = a[key as keyof Pick<CategoryItem, 'id'|'name'|'description'>]; // Adjusted keys
        const bVal = b[key as keyof Pick<CategoryItem, 'id'|'name'|'description'>]; // Adjusted keys
        if (key === 'id' && typeof aVal === 'number' && typeof bVal === 'number') {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
        const strA = String(aVal ?? "").toLowerCase();
        const strB = String(bVal ?? "").toLowerCase();
        return order === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
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
  }, [categoryData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    if (exportCategoriesToCsv("categories_export.csv", allFilteredAndSortedData)) {
      toast.push(<Notification title="Export Successful" type="success" duration={2000}>Data exported.</Notification>);
    }
  }, [allFilteredAndSortedData]);

  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectPageSizeChange = useCallback((value: number) => {
    handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
    setSelectedItems([]);
  }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query, pageIndex: 1 }), [handleSetTableData]);

  const handleRowSelect = useCallback((checked: boolean, row: CategoryItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((item) => item.id === row.id);
      if (checked && !isSelected) return [...prev, row];
      if (!checked && isSelected) return prev.filter((item) => item.id !== row.id);
      return prev;
    });
  }, []);

  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<CategoryItem>[]) => {
    const currentPageOriginals = currentRows.map(r => r.original);
    if (checked) {
        setSelectedItems(prevSelected => {
            const prevSelectedIds = new Set(prevSelected.map(item => item.id));
            const newRowsToAdd = currentPageOriginals.filter(r => !prevSelectedIds.has(r.id));
            return [...prevSelected, ...newRowsToAdd];
        });
    } else {
        const currentPageRowIds = new Set(currentPageOriginals.map(r => r.id));
        setSelectedItems(prevSelected => prevSelected.filter(item => !currentPageRowIds.has(item.id)));
    }
  }, []);

  const columns: ColumnDef<CategoryItem>[] = useMemo(() => [
    { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
    { header: "Name", accessorKey: "name", enableSorting: true },
    { header: "Description", accessorKey: "description", enableSorting: false, cell: ({row}) => <span className="truncate block max-w-xs" title={row.original.description}>{row.original.description || "-"}</span> },
    {
      header: "Images", accessorKey: "images", enableSorting: false, size: 120,
      cell: ({row}) => (
        <div className="flex items-center gap-1 flex-wrap">
          {row.original.images.slice(0, 3).map((img, idx) => (
            <Tooltip title={img.url} key={idx}><Avatar size={30} shape="circle" src={img.url || undefined} icon={<TbPhoto />} /></Tooltip>
          ))}
          {row.original.images.length > 3 && <Tag className="text-xs !bg-gray-100 !text-gray-600 dark:!bg-gray-600 dark:!text-gray-100">+ {row.original.images.length - 3}</Tag>}
          {row.original.images.length === 0 && <span className="text-xs text-gray-400">No images</span>}
        </div>
      ),
    },
    // Date and Status columns removed
    {
      header: "Actions", id: "action", meta: { headerClass: "text-center", cellClass: "text-center" }, size: 100,
      cell: ({row}) => <ActionColumn onEdit={() => openEditDrawer(row.original)} onDelete={() => handleDeleteRequest(row.original)} />,
    },
  ], [openEditDrawer, handleDeleteRequest]);


  const renderDrawerForm = () => (
    <>
      <FormItem label="Category Name" invalid={!!formMethods.formState.errors.name} errorMessage={formMethods.formState.errors.name?.message}>
        <Controller name="name" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="Enter Category Name" />} />
      </FormItem>
      <FormItem label="Description (Optional)" invalid={!!formMethods.formState.errors.description} errorMessage={formMethods.formState.errors.description?.message}>
        <Controller name="description" control={formMethods.control} render={({ field }) => <Input.TextArea {...field} placeholder="Enter Category Description" rows={3} />} />
      </FormItem>
      <FormItem label={`Images (Up to ${MAX_IMAGES_PER_CATEGORY})`}>
        {(formMethods.formState.errors.images && 'message' in formMethods.formState.errors.images) && <p className="text-red-500 text-xs mb-2">{formMethods.formState.errors.images.message}</p>}
        {(formMethods.formState.errors.images && 'root' in formMethods.formState.errors.images && formMethods.formState.errors.images.root) && <p className="text-red-500 text-xs mb-2">{formMethods.formState.errors.images.root.message}</p>}

        {imageFields.map((field, index) => (
          <div key={field.id} className="mb-3">
            <div className="flex items-center gap-2">
              <Controller name={`images.${index}.url`} control={formMethods.control} render={({ field: inputField, fieldState }) => <Input {...inputField} placeholder={`Image ${index + 1} URL`} className="flex-grow" isInvalid={!!fieldState.error} />} />
              {imageFields.length > 1 && <Button size="xs" shape="circle" variant="plain" icon={<TbX />} onClick={() => removeImage(index)} aria-label="Remove image" type="button"/>}
            </div>
            {formMethods.formState.errors.images?.[index]?.url && <p className="text-red-500 text-xs mt-1">{formMethods.formState.errors.images[index]?.url?.message}</p>}
          </div>
        ))}
        {imageFields.length < MAX_IMAGES_PER_CATEGORY && <Button size="sm" type="button" variant="dashed" onClick={() => appendImage({ url: "" })} icon={<TbPlus />}>Add Image URL</Button>}
      </FormItem>
      {/* Date and Status FormItems removed */}
    </>
  );
  
  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Categories</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>Add New Category</Button>
          </div>
          <CategoryTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleExportData} />
          <div className="mt-4">
            <CategoryTable
              columns={columns} data={pageData}
              loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting}
              pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectedItems={selectedItems}
              onPaginationChange={handlePaginationChange} onSelectChange={handleSelectPageSizeChange}
              onSort={handleSort} onRowSelect={handleRowSelect} onAllRowSelect={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <CategorySelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} />

      {/* Add Category Drawer */}
      <Drawer
        title="Add Category"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
            <Button size="sm" variant="solid" form="addCategoryForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
              {isSubmitting ? "Adding..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form id="addCategoryForm" onSubmit={formMethods.handleSubmit(onSubmit)} className="flex flex-col gap-4">{renderDrawerForm()}</Form>
      </Drawer>

      {/* Edit Category Drawer */}
      <Drawer
        title="Edit Category"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting} type="button">Cancel</Button>
            <Button size="sm" variant="solid" form="editCategoryForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <Form id="editCategoryForm" onSubmit={formMethods.handleSubmit(onSubmit)} className="flex flex-col gap-4">{renderDrawerForm()}</Form>
      </Drawer>


      <Drawer
        title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear All</Button>
            <Button size="sm" variant="solid" form="filterCategoryForm" type="submit">Apply Filters</Button>
          </div>
        }
      >
        <Form id="filterCategoryForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
          <FormItem label="Filter by Category Name(s)">
            <Controller name="filterNames" control={filterFormMethods.control} render={({ field }) => <Select isMulti placeholder="Select category names..." options={categoryNameOptionsForFilter} value={field.value || []} onChange={val => field.onChange(val || [])} />} />
          </FormItem>
          {/* Status filter FormItem removed */}
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Category"
        onClose={() => { setSingleDeleteConfirmOpen(false); setCategoryToDelete(null); }}
        onRequestClose={() => { setSingleDeleteConfirmOpen(false); setCategoryToDelete(null); }}
        onCancel={() => { setSingleDeleteConfirmOpen(false); setCategoryToDelete(null); }}
        onConfirm={onConfirmSingleDelete} loading={isDeleting}
      >
        <p>Are you sure you want to delete the category "<strong>{categoryToDelete?.name}</strong>"? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

export default Categories;