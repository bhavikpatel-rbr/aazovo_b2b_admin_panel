import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, FieldError } from "react-hook-form"; // Added FieldError
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
import DebouceInput from "@/components/shared/DebouceInput"; // Corrected typo from DebouceInput
import Avatar from "@/components/ui/Avatar";
import { Drawer, Form, FormItem, Input } from "@/components/ui"; // Assuming these are correctly imported

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbPlus,
  TbCloudUpload,
  TbPhoto,
} from "react-icons/tb";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
  // Actions for Trending Carousel, assumed to be in master/middleware
  getTrendingCarouselAction,
  addTrendingCarouselAction,
  editTrendingCarouselAction,
  deleteTrendingCarouselAction,
  deleteMultipleTrendingCarouselAction,
} from "@/reduxtool/master/middleware"; // Adjust path if actions are elsewhere

// Import the single masterSelector
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Adjust path to masterSlice

// --- Type for individual carousel items ---
// This type should match the structure of items in `state.master.trendingCarouselData`
// and the API response format you provided.
export type TrendingCarouselItemData = {
  id: number; // Or string, depending on your API (using number based on API example)
  images: string; // Relative path from API, e.g., "uploads/trending-images/..."
  links: string | null;
  deleted_at?: string | null;
  created_at: string; // ISO date string, e.g., "2024-12-02T16:56:05.000000Z"
  updated_at?: string;
  images_full_path: string; // Full URL, e.g., "https://aazovo.codefriend.in/..."
  [key: string]: any; // For dynamic access in sorting/filtering if needed
};

// Types for DataTable (from shared types)
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useSelector } from "react-redux";

// --- Zod Schema for Add/Edit Form ---
const trendingCarouselFormSchema = z.object({
  imageFile: z
    .instanceof(File, { message: "Image is required." })
    .optional()
    .nullable()
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024,
      `Max file size is 5MB.`
    )
    .refine(
      (file) =>
        !file ||
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          file.type
        ),
      "Only .jpg, .jpeg, .png, .webp, .gif files are accepted."
    ),
  links: z
    .string()
    .url({ message: "Please enter a valid URL (e.g., https://example.com)." })
    .optional()
    .nullable()
    .or(z.literal("")),
});
type TrendingCarouselFormData = z.infer<typeof trendingCarouselFormSchema>;

// --- CSV Exporter Utility ---
const CSV_CAROUSEL_HEADERS = [
  "ID",
  "Image Path (Server)",
  "Link",
  "Date Created",
  "Image Full URL",
];
const CSV_CAROUSEL_KEYS: (keyof TrendingCarouselItemData | string)[] = [
  "id",
  "images",
  "links",
  "created_at",
  "images_full_path",
];

function exportCarouselItemsToCsv(
  filename: string,
  rows: TrendingCarouselItemData[]
) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const separator = ",";
  const csvContent =
    CSV_CAROUSEL_HEADERS.join(separator) +
    "\n" +
    rows
      .map((row) =>
        CSV_CAROUSEL_KEYS.map((k) => {
          let cell: any = row[k as keyof TrendingCarouselItemData];
          if (k === "created_at" && typeof cell === "string") {
            try {
              cell = new Date(cell).toLocaleDateString(); // Format date for CSV
            } catch (e) {
              /* keep original if invalid date */
            }
          }
          if (cell === null || cell === undefined) cell = "";
          else cell = String(cell).replace(/"/g, '""'); // Escape double quotes
          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`; // Enclose in quotes if needed
          return cell;
        }).join(separator)
      )
      .join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  }); // UTF-8 BOM
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

// --- Helper: classNames ---
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
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
    <div className="flex items-center justify-center gap-3">
      <Tooltip title="Edit">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
          role="button"
          tabIndex={0}
          onClick={onEdit}
          onKeyDown={(e) => e.key === "Enter" && onEdit()}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Delete">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
          )}
          role="button"
          tabIndex={0}
          onClick={onDelete}
          onKeyDown={(e) => e.key === "Enter" && onDelete()}
        >
          <TbTrash />
        </div>
      </Tooltip>
    </div>
  );
};
ActionColumn.displayName = "ActionColumn";

// --- Search Component ---
type ItemSearchProps = {
  onInputChange: (value: string) => void;
  placeholder: string;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange, placeholder }, ref) => (
    <DebouceInput // Corrected component name
      ref={ref}
      className="w-full"
      placeholder={placeholder}
      suffix={<TbSearch className="text-lg" />}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
        onInputChange(e.target.value)
      }
    />
  )
);
ItemSearch.displayName = "ItemSearch";

// --- TableTools Component ---
type ItemTableToolsProps = {
  onSearchChange: (query: string) => void;
  onExport: () => void;
  searchPlaceholder: string;
};
const ItemTableTools = ({
  onSearchChange,
  onExport,
  searchPlaceholder,
}: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <ItemSearch
        onInputChange={onSearchChange}
        placeholder={searchPlaceholder}
      />
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
ItemTableTools.displayName = "ItemTableTools";

// --- SelectedFooter Component ---
type TrendingCarouselSelectedFooterProps = {
  selectedItems: TrendingCarouselItemData[];
  onDeleteSelected: () => void;
  disabled?: boolean;
};
const TrendingCarouselSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  disabled,
}: TrendingCarouselSelectedFooterProps) => {
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
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" // Added dark mode bg
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8" // Added dark mode border
      >
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          {" "}
          {/* Ensure full width and padding */}
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span> Item{selectedItems.length > 1 ? "s" : ""} selected </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500" // Consistent styling
              onClick={handleDeleteClick}
              disabled={disabled}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Carousel Item${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        confirmButtonColor="red-600" // Specific color for confirm
        loading={disabled} // Pass disabled state to loading prop of ConfirmDialog
      >
        <p>
          Are you sure you want to delete the selected carousel item
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};
TrendingCarouselSelectedFooter.displayName = "TrendingCarouselSelectedFooter";

// --- Main Component: Trending Carousel ---
const TrendingCarousel = () => {
  const dispatch = useAppDispatch();

  const {
    trendingCarouselData = [], // Ensure this is part of MasterState and populated
    status: masterLoadingStatus = "idle",
    error: masterError = null,
  } = useSelector(masterSelector);
  console.log("trendingCarouselData", trendingCarouselData);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<TrendingCarouselItemData | null>(null);
  const [itemToDelete, setItemToDelete] =
    useState<TrendingCarouselItemData | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<
    TrendingCarouselItemData[]
  >([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const formMethods = useForm<TrendingCarouselFormData>({
    resolver: zodResolver(trendingCarouselFormSchema),
    defaultValues: { links: "", imageFile: null },
    mode: "onChange", // Validate on change
  });

  useEffect(() => {
    dispatch(getTrendingCarouselAction());
  }, [dispatch]);

  useEffect(() => {
    if (masterLoadingStatus === "failed" && masterError) {
      const errorMessage =
        typeof masterError === "string"
          ? masterError
          : "An unexpected error occurred.";
      toast.push(
        <Notification title="Operation Failed" type="danger" duration={4000}>
          {errorMessage}
        </Notification>
      );
    }
  }, [masterLoadingStatus, masterError]);

  useEffect(() => {
    return () => {
      // Cleanup image preview URL on unmount or when URL changes
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const openAddDrawer = useCallback(() => {
    formMethods.reset({ links: "", imageFile: null });
    setImagePreviewUrl(null);
    setIsAddDrawerOpen(true);
  }, [formMethods]);

  const closeAddDrawer = useCallback(() => {
    setIsAddDrawerOpen(false);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); // Clean up preview URL
    setImagePreviewUrl(null);
    formMethods.reset({ links: "", imageFile: null }); // Reset form on close
  }, [formMethods, imagePreviewUrl]);

  const openEditDrawer = useCallback(
    (item: TrendingCarouselItemData) => {
      setEditingItem(item);
      formMethods.reset({ links: item.links || "", imageFile: null }); // Reset with item's data
      setImagePreviewUrl(null); // No preview for existing image initially
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );

  const closeEditDrawer = useCallback(() => {
    setIsEditDrawerOpen(false);
    setEditingItem(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); // Clean up preview URL
    setImagePreviewUrl(null);
    formMethods.reset({ links: "", imageFile: null }); // Reset form on close
  }, [formMethods, imagePreviewUrl]);

  const onAddItemSubmit = async (data: TrendingCarouselFormData) => {
    if (!data.imageFile) {
      formMethods.setError("imageFile", {
        type: "manual",
        message: "Image is required for new items.",
      });
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("links", data.links || "");
    if (data.imageFile) formData.append("images", data.imageFile); // 'images' is the key API expects

    try {
      await dispatch(addTrendingCarouselAction(formData)).unwrap();
      toast.push(
        <Notification
          title="Carousel Item Added"
          type="success"
          duration={2000}
        >
          Item added successfully.
        </Notification>
      );
      closeAddDrawer();
      dispatch(getTrendingCarouselAction()); // Refresh data
    } catch (error: any) {
      const message =
        error?.message || error?.data?.message || "Could not add item.";
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Add carousel item failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditItemSubmit = async (data: TrendingCarouselFormData) => {
    if (!editingItem) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("_method", "PUT"); // For PHP/Laravel to handle PUT with FormData
    formData.append("links", data.links || "");
    if (data.imageFile) formData.append("images", data.imageFile); // 'images' is the key

    try {
      await dispatch(
        editTrendingCarouselAction({ id: editingItem.id, formData })
      ).unwrap();
      toast.push(
        <Notification
          title="Carousel Item Updated"
          type="success"
          duration={2000}
        >
          Item updated successfully.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getTrendingCarouselAction()); // Refresh data
    } catch (error: any) {
      const message =
        error?.message || error?.data?.message || "Could not update item.";
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Update carousel item failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = useCallback((item: TrendingCarouselItemData) => {
    if (item.id === undefined || item.id === null) {
      // ID check
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Item ID is missing.
        </Notification>
      );
      return;
    }
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = async () => {
    if (
      !itemToDelete ||
      itemToDelete.id === undefined ||
      itemToDelete.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Item ID is missing.
        </Notification>
      );
      setIsDeleting(false);
      setItemToDelete(null);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false); // Close dialog before async operation
    try {
      await dispatch(
        deleteTrendingCarouselAction({ id: itemToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Item Deleted"
          type="success"
          duration={2000}
        >{`Carousel item (ID: ${itemToDelete.id}) deleted.`}</Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete!.id)
      ); // Update local selection
      dispatch(getTrendingCarouselAction()); // Refresh data
    } catch (error: any) {
      const message =
        error?.message || error?.data?.message || "Could not delete item.";
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Delete carousel item failed:", error);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.push(
        <Notification title="No Selection" type="info">
          Please select items to delete.
        </Notification>
      );
      return;
    }
    setIsDeleting(true);
    const validItemsToDelete = selectedItems.filter(
      (item) => item.id !== undefined && item.id !== null
    );

    if (validItemsToDelete.length !== selectedItems.length) {
      toast.push(
        <Notification title="Deletion Warning" type="warning" duration={3000}>
          Some selected items had missing IDs and were skipped.
        </Notification>
      );
    }
    if (validItemsToDelete.length === 0) {
      toast.push(
        <Notification title="No Valid Items" type="info">
          No valid items to delete (all selected items were missing IDs).
        </Notification>
      );
      setIsDeleting(false);
      return;
    }

    const idsToDelete = validItemsToDelete.map((item) => String(item.id)); // API might expect string IDs

    try {
      // Assumes deleteMultipleTrendingCarouselAction expects { ids: "id1,id2,id3" }
      await dispatch(
        deleteMultipleTrendingCarouselAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >
          {validItemsToDelete.length} item(s) deleted.
        </Notification>
      );
      setSelectedItems([]); // Clear selection
      dispatch(getTrendingCarouselAction()); // Refresh data
    } catch (error: any) {
      const message =
        error?.message ||
        error?.data?.message ||
        "Failed to delete selected items.";
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Delete Selected Carousel Items Error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: TrendingCarouselItemData[] = Array.isArray(
      trendingCarouselData
    )
      ? trendingCarouselData
      : [];
    let processedData: TrendingCarouselItemData[] = cloneDeep(sourceData);

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.links || "")
            .toLowerCase()
            .includes(query) ||
          String(item.id).toLowerCase().includes(query) ||
          (item.created_at &&
            new Date(item.created_at)
              .toLocaleDateString()
              .toLowerCase()
              .includes(query))
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      processedData.length > 0 &&
      processedData[0].hasOwnProperty(key)
    ) {
      processedData.sort((a, b) => {
        const aValue = a[key as keyof TrendingCarouselItemData];
        const bValue = b[key as keyof TrendingCarouselItemData];

        if (aValue === null || aValue === undefined)
          return order === "asc" ? -1 : 1;
        if (bValue === null || bValue === undefined)
          return order === "asc" ? 1 : -1;

        if (key === "created_at" || key === "updated_at") {
          // Date comparison
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }
        // Default string comparison
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }
    const dataToExport = [...processedData]; // For CSV export
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
  }, [trendingCarouselData, tableData]);

  const handleExportData = () => {
    const success = exportCarouselItemsToCsv(
      "trending_carousel_items.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success" duration={2000}>
          Data exported to CSV.
        </Notification>
      );
  };

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
    (checked: boolean, row: TrendingCarouselItemData) => {
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
    (checked: boolean, currentRows: Row<TrendingCarouselItemData>[]) => {
      const originals = currentRows.map((r) => r.original); // Get original data items
      if (checked) {
        setSelectedItems((prev) => {
          const prevIds = new Set(prev.map((item) => item.id));
          const newToAdd = originals.filter(
            (r) => r.id !== undefined && !prevIds.has(r.id)
          ); // Ensure ID exists
          return [...prev, ...newToAdd];
        });
      } else {
        const currentIds = new Set(
          originals.map((r) => r.id).filter((id) => id !== undefined)
        ); // Ensure IDs exist
        setSelectedItems((prev) =>
          prev.filter(
            (item) => item.id !== undefined && !currentIds.has(item.id)
          )
        );
      }
    },
    []
  );

  const columns: ColumnDef<TrendingCarouselItemData>[] = useMemo(
    () => [
      {
        header: "Image",
        accessorKey: "images_full_path", // Use the full path for display
        enableSorting: false,
        size: 100,
        meta: { cellClass: "p-1" }, // Padding for avatar cell
        cell: (props) => (
          <Avatar
            size={60}
            shape="circle"
            src={props.row.original.images_full_path || undefined}
            icon={<TbPhoto />}
          />
        ),
      },
      {
        header: "Link",
        accessorKey: "links",
        enableSorting: true,
        size: 300,
        cell: (props) =>
          props.row.original.links ? (
            <a
              href={props.row.original.links}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-xs"
            >
              {props.row.original.links}
            </a>
          ) : (
            <span className="text-gray-500">No Link</span>
          ),
      },
      {
        header: "Date Created",
        accessorKey: "created_at",
        enableSorting: true,
        size: 180,
        cell: (props) => {
          const date = props.row.original.created_at;
          return date ? new Date(date).toLocaleDateString() : "N/A"; // Format date for display
        },
      },
      {
        header: "Actions",
        id: "action", // Important for non-accessor columns
        meta: { headerClass: "text-center", cellClass: "text-center" },
        size: 120,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick]
  ); // Dependencies for callbacks

  return (
    <>
      <Container className="h-full">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Trending Carousel</h5>
            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={openAddDrawer}
              disabled={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
              }
            >
              Add New Carousel Item
            </Button>
          </div>

          <ItemTableTools
            onSearchChange={handleSearchChange}
            onExport={handleExportData}
            searchPlaceholder="Search by Link, Date (e.g., MM/DD/YYYY), or ID..."
          />

          <div className="mt-4">
            <DataTable
              columns={columns}
              data={pageData} // Data for the current page
              loading={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
              }
              pagingData={{
                total: total, // Total number of items after filtering
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectable
              checkboxChecked={(row: TrendingCarouselItemData) =>
                selectedItems.some((selected) => selected.id === row.id)
              }
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect} // For select/deselect all
            />
          </div>
        </AdaptiveCard>
      </Container>

      <TrendingCarouselSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        disabled={isDeleting || masterLoadingStatus === "loading"}
      />

      {/* Add Drawer */}
      <Drawer
        title="Add Trending Carousel Item"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer} // For accessibility (e.g., pressing Esc)
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
              form="addCarouselItemForm" // Links to the form ID
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
          </div>
        }
      >
        <Form
          id="addCarouselItemForm"
          onSubmit={formMethods.handleSubmit(onAddItemSubmit)}
          className="flex flex-col gap-y-6"
        >
          {" "}
          {/* Use gap-y for vertical spacing */}
          <FormItem
            label="Image"
            invalid={!!formMethods.formState.errors.imageFile}
            errorMessage={formMethods.formState.errors.imageFile?.message}
          >
            <Controller
              name="imageFile"
              control={formMethods.control}
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <Input
                  type="file"
                  name={name}
                  ref={ref}
                  onBlur={onBlur}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    onChange(file); // RHF's onChange
                    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                    setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
                    if (file) formMethods.clearErrors("imageFile"); // Clear manual error if user selects a file
                  }}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                />
              )}
            />
            {imagePreviewUrl && (
              <Avatar
                src={imagePreviewUrl}
                size={100}
                shape="square"
                className="mt-2 border border-gray-200 dark:border-gray-600"
              />
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Max file size 5MB. Accepted: .jpg, .png, .webp, .gif
            </p>
          </FormItem>
          <FormItem
            label="Link (Optional)"
            invalid={!!formMethods.formState.errors.links}
            errorMessage={formMethods.formState.errors.links?.message}
          >
            <Controller
              name="links"
              control={formMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""} // Handle null/undefined for controlled input
                  type="url"
                  placeholder="https://example.com/product-page"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Trending Carousel Item"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
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
              form="editCarouselItemForm"
              type="submit"
              loading={isSubmitting}
              disabled={
                isSubmitting ||
                (!formMethods.formState.isDirty &&
                  !imagePreviewUrl &&
                  !formMethods.formState.errors.imageFile) || // Disable if no changes and no new image unless there's an image file error
                !formMethods.formState.isValid
              }
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <Form
          id="editCarouselItemForm"
          onSubmit={formMethods.handleSubmit(onEditItemSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormItem label="Current Image">
            {editingItem?.images_full_path ? (
              <Avatar
                src={editingItem.images_full_path}
                size={100}
                shape="square"
                className="mt-1 border border-gray-200 dark:border-gray-600"
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No current image.
              </p>
            )}
          </FormItem>
          <FormItem
            label="New Image (Optional to replace)"
            invalid={!!formMethods.formState.errors.imageFile}
            errorMessage={formMethods.formState.errors.imageFile?.message}
          >
            <Controller
              name="imageFile"
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
                    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                    setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
                  }}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                />
              )}
            />
            {imagePreviewUrl && (
              <Avatar
                src={imagePreviewUrl}
                size={100}
                shape="square"
                className="mt-2 border border-gray-200 dark:border-gray-600"
              />
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Upload a new image to replace the current one. Max 5MB.
            </p>
          </FormItem>
          <FormItem
            label="Link (Optional)"
            invalid={!!formMethods.formState.errors.links}
            errorMessage={formMethods.formState.errors.links?.message}
          >
            <Controller
              name="links"
              control={formMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="url"
                  placeholder="https://example.com/updated-product-page"
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Carousel Item"
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
          Are you sure you want to delete this carousel item?
          {itemToDelete && ` (ID: ${itemToDelete.id})`} This action cannot be
          undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default TrendingCarousel;
