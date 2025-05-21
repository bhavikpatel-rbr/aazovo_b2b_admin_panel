import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
// import { Link, useNavigate } from 'react-router-dom';
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, useFieldArray } from "react-hook-form"; // Added useFieldArray
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
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import Avatar from "@/components/ui/Avatar"; // For image preview in table
import Tag from "@/components/ui/Tag";
import { Drawer, Form, FormItem, Input } from "@/components/ui";
import { Segment } from "@/components/ui"; // Assuming this exists for view switching

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
  TbCategory, // Icon for Home Categories
  TbLink, // Icon for View More Link
  TbCalendar, // Icon for Date
  TbListCheck, // Icon for Status
  TbX, // Icon for removing an image field
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
// Redux (Keep commented if using local state first)
// import { useAppDispatch } from '@/reduxtool/store';
// import { getHomeCategoriesAction, addHomeCategoryAction, ... } from '@/reduxtool/homeCategory/middleware';
// import { homeCategorySelector } from '@/reduxtool/homeCategory/homeCategorySlice';

// --- Constants ---
const MAX_IMAGES_PER_CATEGORY = 6;

const statusOptionsConst = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const statusColorsConst: Record<"active" | "inactive", string> = {
  active:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

// Predefined category names for the dropdown
const categoryNameOptionsConst = [
  { value: "electronics", label: "Electronics" },
  { value: "fashion_men", label: "Fashion - Men" },
  { value: "fashion_women", label: "Fashion - Women" },
  { value: "home_appliances", label: "Home Appliances" },
  { value: "books_stationery", label: "Books & Stationery" },
  { value: "sports_outdoors", label: "Sports & Outdoors" },
];
const categoryNameValues = categoryNameOptionsConst.map((opt) => opt.value) as [
  string,
  ...string[]
];

// --- Define HomeCategoryItem Type ---
export type HomeCategoryImageItem = {
  id: string | number;
  categoryName: string; // Key from categoryNameOptionsConst
  viewMoreLink?: string;
  images: { url: string }[]; // Array of image URLs, max 6
  date: string; // YYYY-MM-DD
  status: "active" | "inactive";
};

// --- Zod Schema for Add/Edit Home Category Form ---
const homeCategoryFormSchema = z.object({
  categoryName: z.enum(categoryNameValues, {
    errorMap: () => ({ message: "Please select a category name." }),
  }),
  viewMoreLink: z
    .string()
    .url('Invalid URL for "View More" link.')
    .optional()
    .or(z.literal("")),
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
  date: z
    .string()
    .min(1, "Date is required.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  status: z.enum(["active", "inactive"]),
});
type HomeCategoryFormData = z.infer<typeof homeCategoryFormSchema>;

// --- Initial Dummy Data ---
const initialDummyHomeCategories: HomeCategoryImageItem[] = [
  {
    id: "HCAT001",
    categoryName: "electronics",
    viewMoreLink: "/category/electronics",
    images: [
      { url: "https://via.placeholder.com/300x200/ADD8E6/000000?text=Elec1" },
      { url: "https://via.placeholder.com/300x200/ADD8E6/000000?text=Elec2" },
    ],
    date: "2024-07-29",
    status: "active",
  },
  {
    id: "HCAT002",
    categoryName: "fashion_men",
    viewMoreLink: "/category/fashion-men",
    images: [
      {
        url: "https://via.placeholder.com/300x200/FFA07A/000000?text=FashionM1",
      },
    ],
    date: "2024-07-28",
    status: "inactive",
  },
];

// --- CSV Exporter Utility ---
const CSV_HEADERS_HOME_CAT = [
  "ID",
  "Category Name",
  "View More Link",
  "Date",
  "Status",
  "Image Count",
  "Image URLs",
];
const CSV_KEYS_HOME_CAT: (
  | keyof HomeCategoryImageItem
  | "imageCount"
  | "imageUrlsString"
)[] = [
  "id",
  "categoryName",
  "viewMoreLink",
  "date",
  "status",
  "imageCount",
  "imageUrlsString",
];

function exportHomeCategoriesToCsv(
  filename: string,
  rows: HomeCategoryImageItem[]
) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const preparedRows = rows.map((row) => ({
    ...row,
    imageCount: row.images.length,
    imageUrlsString: row.images.map((img) => img.url).join("; "), // Join URLs with a semicolon
  }));

  // ... rest of the exportToCsv logic, using preparedRows, CSV_HEADERS_HOME_CAT, and CSV_KEYS_HOME_CAT
  const separator = ",";
  const csvContent =
    CSV_HEADERS_HOME_CAT.join(separator) +
    "\n" +
    preparedRows
      .map((row: any) =>
        CSV_KEYS_HOME_CAT.map((k) => {
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

// --- ActionColumn Component (Reusable) ---
const ActionColumn = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => {
  // ... (ActionColumn component remains the same)
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center gap-3">
      <Tooltip title="Edit">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
          role="button"
          onClick={onEdit}
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
          onClick={onDelete}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  );
};

// --- HomeCategorySearch and TableTools ---
type HomeCategorySearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const HomeCategorySearch = React.forwardRef<
  HTMLInputElement,
  HomeCategorySearchProps
>(({ onInputChange }, ref) => (
  <DebouceInput
    ref={ref}
    className="w-full"
    placeholder="Search categories by name..."
    suffix={<TbSearch className="text-lg" />}
    onChange={(e) => onInputChange(e.target.value)}
  />
));
HomeCategorySearch.displayName = "HomeCategorySearch";

type HomeCategoryTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
};
const HomeCategoryTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: HomeCategoryTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <HomeCategorySearch onInputChange={onSearchChange} />
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

// --- Main Component: HomeCategories ---
const HomeCategories = () => {
  const [homeCategoriesData, setHomeCategoriesData] = useState<
    HomeCategoryImageItem[]
  >(initialDummyHomeCategories);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingHomeCategory, setEditingHomeCategory] =
    useState<HomeCategoryImageItem | null>(null);
  const [itemToDelete, setItemToDelete] =
    useState<HomeCategoryImageItem | null>(null);

  const [masterLoadingStatus, setMasterLoadingStatus] = useState<
    "idle" | "loading"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<HomeCategoryImageItem[]>(
    []
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<{
    filterStatus?: any[];
    filterCategoryName?: any[];
  }>({});

  const formMethods = useForm<HomeCategoryFormData>({
    resolver: zodResolver(homeCategoryFormSchema),
    defaultValues: {
      categoryName: categoryNameValues[0],
      viewMoreLink: "",
      images: [{ url: "" }], // Start with one empty image field
      date: new Date().toISOString().split("T")[0],
      status: "active",
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

  const filterForm = useForm<{
    filterStatus?: any[];
    filterCategoryName?: any[];
  }>({ defaultValues: {} });

  // --- CRUD Handlers ---
  const openAddDrawer = () => {
    formMethods.reset({
      // Reset with one empty image field
      categoryName: categoryNameValues[0],
      viewMoreLink: "",
      images: [{ url: "" }],
      date: new Date().toISOString().split("T")[0],
      status: "active",
    });
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => setIsAddDrawerOpen(false);

  const openEditDrawer = (item: HomeCategoryImageItem) => {
    setEditingHomeCategory(item);
    formMethods.reset({
      // Map item data to form data structure
      categoryName: item.categoryName,
      viewMoreLink: item.viewMoreLink || "",
      images: item.images.length > 0 ? item.images : [{ url: "" }], // Ensure at least one field if empty
      date: item.date,
      status: item.status,
    });
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingHomeCategory(null);
  };

  const onSubmit = async (data: HomeCategoryFormData) => {
    setIsSubmitting(true);
    setMasterLoadingStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      if (editingHomeCategory) {
        // Edit mode
        const updatedItem: HomeCategoryImageItem = {
          ...editingHomeCategory,
          ...data,
        };
        setHomeCategoriesData((prev) =>
          prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        );
        toast.push(
          <Notification title="Home Category Updated" type="success">
            Category updated.
          </Notification>
        );
        closeEditDrawer();
      } else {
        // Add mode
        const newItem: HomeCategoryImageItem = {
          ...data,
          id: `HCAT${Date.now()}`,
        };
        setHomeCategoriesData((prev) => [...prev, newItem]);
        toast.push(
          <Notification title="Home Category Added" type="success">
            Category added.
          </Notification>
        );
        closeAddDrawer();
      }
    } catch (error: any) {
      toast.push(
        <Notification
          title={editingHomeCategory ? "Failed to Update" : "Failed to Add"}
          type="danger"
        >
          {error?.message || "Operation failed."}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
      setMasterLoadingStatus("idle");
    }
  };

  const handleDeleteClick = (item: HomeCategoryImageItem) => {
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  };

  const onConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setMasterLoadingStatus("loading");
    setSingleDeleteConfirmOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      setHomeCategoriesData((prev) =>
        prev.filter((item) => item.id !== itemToDelete!.id)
      );
      toast.push(
        <Notification
          title="Home Category Deleted"
          type="success"
        >{`Category "${
          categoryNameOptionsConst.find(
            (c) => c.value === itemToDelete.categoryName
          )?.label
        }" deleted.`}</Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete!.id)
      );
    } catch (error: any) {
      toast.push(
        <Notification title="Failed to Delete" type="danger">
          {error?.message || "Could not delete item."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setMasterLoadingStatus("idle");
      setItemToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    // ... (similar to previous handleDeleteSelected, adapted for homeCategoriesData)
    setIsDeleting(true);
    setMasterLoadingStatus("loading");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      const idsToDelete = selectedItems.map((item) => item.id);
      setHomeCategoriesData((prev) =>
        prev.filter((item) => !idsToDelete.includes(item.id))
      );
      toast.push(
        <Notification title="Deletion Successful" type="success">
          {selectedItems.length} item(s) deleted.
        </Notification>
      );
      setSelectedItems([]);
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger">
          {error?.message || "Failed to delete selected items."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
      setMasterLoadingStatus("idle");
    }
  };

  // --- Filter Handlers ---
  const openFilterDrawer = () => {
    filterForm.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const onApplyFiltersSubmit = (data: {
    filterStatus?: any[];
    filterCategoryName?: any[];
  }) => {
    setFilterCriteria(data);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    setIsFilterDrawerOpen(false);
  };
  const onClearFilters = () => {
    filterForm.reset({});
    setFilterCriteria({});
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  };

  // --- Data Processing (Memoized) ---
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: HomeCategoryImageItem[] = cloneDeep(homeCategoriesData);

    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterStatus.map(
        (opt: any) => opt.value
      );
      processedData = processedData.filter((item) =>
        selectedStatuses.includes(item.status)
      );
    }
    if (
      filterCriteria.filterCategoryName &&
      filterCriteria.filterCategoryName.length > 0
    ) {
      const selectedCats = filterCriteria.filterCategoryName.map(
        (opt: any) => opt.value
      );
      processedData = processedData.filter((item) =>
        selectedCats.includes(item.categoryName)
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter((item) => {
        const catLabel =
          categoryNameOptionsConst
            .find((c) => c.value === item.categoryName)
            ?.label.toLowerCase() || "";
        return (
          catLabel.includes(query) ||
          String(item.id).toLowerCase().includes(query)
        );
      });
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      ["id", "categoryName", "date", "status"].includes(key)
    ) {
      processedData.sort((a, b) => {
        const aVal =
          key === "categoryName"
            ? categoryNameOptionsConst.find((c) => c.value === a.categoryName)
                ?.label || ""
            : a[key as keyof HomeCategoryImageItem];
        const bVal =
          key === "categoryName"
            ? categoryNameOptionsConst.find((c) => c.value === b.categoryName)
                ?.label || ""
            : b[key as keyof HomeCategoryImageItem];
        const aStr = String(aVal ?? "").toLowerCase();
        const bStr = String(bVal ?? "").toLowerCase();
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }
    const dataToExport = [...processedData];
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);

    return {
      pageData: dataForPage,
      total: currentTotal,
      allFilteredAndSortedData: dataToExport,
    };
  }, [homeCategoriesData, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportHomeCategoriesToCsv(
      "home_categories.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
  };

  // --- Table Interaction Handlers ---
  const handleSetTableData = useCallback(
    (data: Partial<TableQueries>) =>
      setTableData((prev) => ({ ...prev, ...data })),
    []
  );
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
      setSelectedItems([]);
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: HomeCategoryImageItem) => {
      setSelectedItems((prev) => {
        if (checked)
          return prev.some((item) => item.id === row.id)
            ? prev
            : [...prev, row];
        return prev.filter((item) => item.id !== row.id);
      });
    },
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<HomeCategoryImageItem>[]) => {
      // ... (same as previous all row select logic)
      const originals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prev) => {
          const prevIds = new Set(prev.map((item) => item.id));
          const newToAdd = originals.filter((r) => !prevIds.has(r.id));
          return [...prev, ...newToAdd];
        });
      } else {
        const currentIds = new Set(originals.map((r) => r.id));
        setSelectedItems((prev) =>
          prev.filter((item) => !currentIds.has(item.id))
        );
      }
    },
    []
  );

  // --- Column Definitions ---
  const columns: ColumnDef<HomeCategoryImageItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
      {
        header: "Category Name",
        accessorKey: "categoryName",
        enableSorting: true,
        size: 200,
        cell: (props) => {
          const cat = categoryNameOptionsConst.find(
            (c) => c.value === props.row.original.categoryName
          );
          return (
            <span className="font-semibold">
              {cat ? cat.label : props.row.original.categoryName}
            </span>
          );
        },
      },
      {
        header: "Images",
        accessorKey: "images",
        enableSorting: false,
        size: 120,
        cell: (props) => (
          <div className="flex items-center gap-1">
            {props.row.original.images.slice(0, 3).map(
              (
                img,
                idx // Show up to 3 previews
              ) => (
                <Avatar
                  key={idx}
                  size={30}
                  shape="square"
                  src={img.url || undefined}
                  icon={<TbPhoto />}
                />
              )
            )}
            {props.row.original.images.length > 3 && (
              <span className="text-xs">
                +{props.row.original.images.length - 3}
              </span>
            )}
            {props.row.original.images.length === 0 && (
              <span className="text-xs text-gray-400">No images</span>
            )}
          </div>
        ),
      },
      { header: "Date", accessorKey: "date", enableSorting: true, size: 120 },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 100,
        cell: (props) => (
          <Tag
            className={classNames(
              "rounded-md capitalize font-semibold border-0",
              statusColorsConst[props.row.original.status]
            )}
          >
            {props.row.original.status}
          </Tag>
        ),
      },
      {
        header: "Actions",
        id: "action",
        meta: { headerClass: "text-center", cellClass: "text-center" },
        size: 100,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [] // openEditDrawer, handleDeleteClick are stable due to useCallback
  );

  // --- Render Form for Drawer ---
  const renderDrawerForm = () => (
    <>
      <FormItem
        label="Category Name"
        invalid={!!formMethods.formState.errors.categoryName}
        errorMessage={formMethods.formState.errors.categoryName?.message}
      >
        <Controller
          name="categoryName"
          control={formMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select category"
              options={categoryNameOptionsConst}
              value={categoryNameOptionsConst.find(
                (o) => o.value === field.value
              )}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <FormItem
        label="View More Link (Optional)"
        invalid={!!formMethods.formState.errors.viewMoreLink}
        errorMessage={formMethods.formState.errors.viewMoreLink?.message}
      >
        <Controller
          name="viewMoreLink"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              type="url"
              placeholder="https://example.com/category/view-all"
            />
          )}
        />
      </FormItem>

      <FormItem
        label={`Images (Up to ${MAX_IMAGES_PER_CATEGORY})`}
        invalid={!!formMethods.formState.errors.images}
        errorMessage={
          formMethods.formState.errors.images?.message ||
          (formMethods.formState.errors.images as any)?.root?.message
        }
      >
        {imageFields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2 mb-2">
            <Controller
              name={`images.${index}.url`}
              control={formMethods.control}
              render={({ field: inputField, fieldState }) => (
                <Input
                  {...inputField}
                  type="url"
                  placeholder={`Image ${index + 1} URL`}
                  className="flex-grow"
                  isInvalid={!!fieldState.error}
                />
              )}
            />
            {imageFields.length > 1 && ( // Don't allow removing the last one directly, add one if needed
              <Button
                size="xs"
                shape="circle"
                variant="plain"
                icon={<TbX />}
                onClick={() => removeImage(index)}
                aria-label="Remove image"
              />
            )}
            {formMethods.formState.errors.images?.[index]?.url && (
              <p className="text-red-500 text-xs mt-1">
                {formMethods.formState.errors.images?.[index]?.url?.message}
              </p>
            )}
          </div>
        ))}
        {imageFields.length < MAX_IMAGES_PER_CATEGORY && (
          <Button
            size="sm"
            type="button"
            variant="dashed"
            onClick={() => appendImage({ url: "" })}
          >
            Add Another Image
          </Button>
        )}
      </FormItem>

      <FormItem
        label="Date"
        invalid={!!formMethods.formState.errors.date}
        errorMessage={formMethods.formState.errors.date?.message}
      >
        <Controller
          name="date"
          control={formMethods.control}
          render={({ field }) => <Input {...field} type="date" />}
        />
      </FormItem>
      <FormItem
        label="Status"
        invalid={!!formMethods.formState.errors.status}
        errorMessage={formMethods.formState.errors.status?.message}
      >
        <Controller
          name="status"
          control={formMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select status"
              options={statusOptionsConst}
              value={statusOptionsConst.find((o) => o.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
    </>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">
              <TbCategory /> Manage Home Categories
            </h3>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New Category
            </Button>
          </div>
          <HomeCategoryTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
          />
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
              }
              pagingData={{
                total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectable
              checkboxChecked={(row: HomeCategoryImageItem) =>
                selectedItems.some((selected) => selected.id === row.id)
              }
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <StickyFooter /* For Selected Items Actions */
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
        hidden={selectedItems.length === 0}
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
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
              onClick={handleDeleteSelected}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>

      {/* Add Drawer */}
      <Drawer
        title="Add New Home Category"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeAddDrawer}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="homeCategoryFormAdd"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Category"}
            </Button>
          </div>
        }
      >
        <Form
          id="homeCategoryFormAdd"
          onSubmit={formMethods.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {renderDrawerForm()}
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Home Category"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        width={600}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={closeEditDrawer}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="homeCategoryFormEdit"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <Form
          id="homeCategoryFormEdit"
          onSubmit={formMethods.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {renderDrawerForm()}
        </Form>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filter Home Categories"
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onRequestClose={() => setIsFilterDrawerOpen(false)}
        footer={
          <div className="text-right w-full">
            <Button size="sm" onClick={onClearFilters} type="button">
              Clear All
            </Button>
            <div>
              <Button
                size="sm"
                className="mr-2"
                onClick={() => setIsFilterDrawerOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button size="sm" variant="solid" form="filterForm" type="submit">
                Apply Filters
              </Button>
            </div>
          </div>
        }
      >
        <Form
          id="filterForm"
          onSubmit={filterForm.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Filter by Status">
            <Controller
              name="filterStatus"
              control={filterForm.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select status(es)..."
                  options={statusOptionsConst}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Category Name">
            <Controller
              name="filterCategoryName"
              control={filterForm.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select category name(s)..."
                  options={categoryNameOptionsConst}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Single Delete Confirmation */}
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Home Category"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        confirmButtonColor="red-600"
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the category "
          <strong>
            {itemToDelete
              ? categoryNameOptionsConst.find(
                  (c) => c.value === itemToDelete.categoryName
                )?.label || itemToDelete.categoryName
              : ""}
          </strong>
          "? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default HomeCategories;

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
