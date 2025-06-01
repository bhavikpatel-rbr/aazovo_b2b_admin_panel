import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, FieldError } from "react-hook-form";
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
import Avatar from "@/components/ui/Avatar";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui"; // Added Tag

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbPlus,
  TbCloudUpload,
  TbPhoto,
  TbReload,
  TbUser,
} from "react-icons/tb";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import {
  getTrendingCarouselAction,
  addTrendingCarouselAction,
  editTrendingCarouselAction,
  deleteTrendingCarouselAction,
  deleteMultipleTrendingCarouselAction,
  submitExportReasonAction, // Placeholder for actual action
} from "@/reduxtool/master/middleware";

import { masterSelector } from "@/reduxtool/master/masterSlice";

// Types for DataTable
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

// --- Trending Carousel Item Data Type ---
export type TrendingCarouselItemData = {
  id: number;
  images: string;
  links: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at?: string;
  images_full_path: string;
  updated_by_name?: string; // Added
  updated_by_role?: string; // Added
  [key: string]: any;
};

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

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// --- CSV Exporter Utility ---
const CSV_CAROUSEL_HEADERS = [
  "ID",
  "Image Path (Server)",
  "Link",
  "Image Full URL",
  "Created At",
  "Updated By",
  "Updated Role",
  "Updated At",
];

type TrendingCarouselExportItem = Omit<TrendingCarouselItemData, "created_at" | "updated_at"> & {
  created_at_formatted?: string;
  updated_at_formatted?: string;
};

const CSV_CAROUSEL_KEYS_EXPORT: (keyof TrendingCarouselExportItem)[] = [
  "id",
  "images",
  "links",
  "images_full_path",
  "created_at_formatted",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];

function exportCarouselItemsToCsv(
  filename: string,
  rows: TrendingCarouselItemData[]
) {
  if (!rows || !rows.length) {
    // Toast handled by caller or handleOpenExportReasonModal
    return false;
  }
  const preparedRows: TrendingCarouselExportItem[] = rows.map((row) => ({
    ...row,
    links: row.links || "N/A",
    created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString() : "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_CAROUSEL_HEADERS.join(separator) +
    "\n" +
    preparedRows
      .map((row) =>
        CSV_CAROUSEL_KEYS_EXPORT.map((k) => {
          let cell = row[k as keyof TrendingCarouselExportItem];
          if (cell === null || cell === undefined) cell = "";
          else cell = String(cell).replace(/"/g, '""');
          if (String(cell).search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
          return cell;
        }).join(separator)
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
  toast.push(<Notification title="Export Failed" type="danger">Browser does not support this feature.</Notification>);
  return false;
}

// --- Helper: classNames ---
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// --- ActionColumn Component ---
const ActionColumn = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void; }) => {
  const iconButtonClass = "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center">
      <Tooltip title="Edit">
        <div className={classNames(iconButtonClass, hoverBgClass, "text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400")} role="button" tabIndex={0} onClick={onEdit} onKeyDown={(e) => e.key === "Enter" && onEdit()}> <TbPencil /> </div>
      </Tooltip>
      <Tooltip title="Delete">
        <div className={classNames(iconButtonClass, hoverBgClass, "text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400")} role="button" tabIndex={0} onClick={onDelete} onKeyDown={(e) => e.key === "Enter" && onDelete()}> <TbTrash /> </div>
      </Tooltip>
    </div>
  );
};
ActionColumn.displayName = "ActionColumn";

// --- Search Component ---
type ItemSearchProps = { onInputChange: (value: string) => void; placeholder: string; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange, placeholder }, ref) => (
    <DebouceInput ref={ref} className="w-full" placeholder={placeholder} suffix={<TbSearch className="text-lg" />} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onInputChange(e.target.value)} />
  )
);
ItemSearch.displayName = "ItemSearch";

// --- TableTools Component ---
type ItemTableToolsProps = {
  onSearchChange: (query: string) => void;
  onExport: () => void;
  searchPlaceholder: string;
  onClearSearch: () => void; // Renamed from onClearFilters for clarity as only search is cleared
};
const ItemTableTools = ({ onSearchChange, onExport, searchPlaceholder, onClearSearch }: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <ItemSearch onInputChange={onSearchChange} placeholder={searchPlaceholder} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button title="Clear Search" icon={<TbReload />} onClick={onClearSearch}></Button> {/* Clear Search */}
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto"> Export </Button>
    </div>
  </div>
);
ItemTableTools.displayName = "ItemTableTools";

// --- SelectedFooter Component ---
type TrendingCarouselSelectedFooterProps = {
  selectedItems: TrendingCarouselItemData[];
  onDeleteSelected: () => void;
  isDeleting?: boolean; // Changed from disabled for clarity
};
const TrendingCarouselSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: TrendingCarouselSelectedFooterProps) => {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const handleDeleteClick = () => setDeleteConfirmationOpen(true);
  const handleCancelDelete = () => setDeleteConfirmationOpen(false);
  const handleConfirmDelete = () => { onDeleteSelected(); setDeleteConfirmationOpen(false); };
  if (selectedItems.length === 0) return null;
  return (
    <>
      <StickyFooter className="flex items-center justify-between py-4 bg-white dark:bg-gray-800" stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8">
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          <span className="flex items-center gap-2">
            <span className="text-lg text-primary-600 dark:text-primary-400"> <TbChecks /> </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span> Item{selectedItems.length > 1 ? "s" : ""} selected </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}> Delete Selected </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Carousel Item${selectedItems.length > 1 ? "s" : ""}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} confirmButtonColor="red-600" loading={isDeleting}>
        <p> Are you sure you want to delete the selected carousel item{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone. </p>
      </ConfirmDialog>
    </>
  );
};
TrendingCarouselSelectedFooter.displayName = "TrendingCarouselSelectedFooter";

// --- Main Component: Trending Carousel ---
const TrendingCarousel = () => {
  const dispatch = useAppDispatch();

  const {
    trendingCarouselData = [],
    status: masterLoadingStatus = "idle",
    error: masterError = null,
  } = useSelector(masterSelector);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TrendingCarouselItemData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<TrendingCarouselItemData | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" }, // Default sort
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<TrendingCarouselItemData[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // --- Export Reason Modal State ---
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);


  const formMethods = useForm<TrendingCarouselFormData>({
    resolver: zodResolver(trendingCarouselFormSchema),
    defaultValues: { links: "", imageFile: null },
    mode: "onChange",
  });

  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });


  useEffect(() => {
    dispatch(getTrendingCarouselAction());
  }, [dispatch]);

  useEffect(() => {
    if (masterLoadingStatus === "failed" && masterError) {
      const errorMessage = typeof masterError === "string" ? masterError : "An unexpected error occurred.";
      toast.push(<Notification title="Operation Failed" type="danger" duration={4000}>{errorMessage}</Notification>);
    }
  }, [masterLoadingStatus, masterError]);

  useEffect(() => {
    return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); };
  }, [imagePreviewUrl]);

  const openAddDrawer = useCallback(() => {
    formMethods.reset({ links: "", imageFile: null });
    setImagePreviewUrl(null);
    setIsAddDrawerOpen(true);
  }, [formMethods]);

  const closeAddDrawer = useCallback(() => {
    setIsAddDrawerOpen(false);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    formMethods.reset({ links: "", imageFile: null });
  }, [formMethods, imagePreviewUrl]);

  const openEditDrawer = useCallback(
    (item: TrendingCarouselItemData) => {
      setEditingItem(item);
      formMethods.reset({ links: item.links || "", imageFile: null });
      setImagePreviewUrl(null);
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );

  const closeEditDrawer = useCallback(() => {
    setIsEditDrawerOpen(false);
    setEditingItem(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    formMethods.reset({ links: "", imageFile: null });
  }, [formMethods, imagePreviewUrl]);

  const onAddItemSubmit = async (data: TrendingCarouselFormData) => {
    if (!data.imageFile) {
      formMethods.setError("imageFile", { type: "manual", message: "Image is required for new items." });
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("links", data.links || "");
    if (data.imageFile) formData.append("images", data.imageFile);

    try {
      await dispatch(addTrendingCarouselAction(formData)).unwrap();
      toast.push(<Notification title="Carousel Item Added" type="success" duration={2000}>Item added successfully.</Notification>);
      closeAddDrawer();
      dispatch(getTrendingCarouselAction());
    } catch (error: any) {
      const message = error?.message || error?.data?.message || "Could not add item.";
      toast.push(<Notification title="Failed to Add" type="danger" duration={3000}>{message}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditItemSubmit = async (data: TrendingCarouselFormData) => {
    if (!editingItem) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("links", data.links || "");
    if (data.imageFile) formData.append("images", data.imageFile);

    try {
      await dispatch(editTrendingCarouselAction({ id: editingItem.id, formData })).unwrap();
      toast.push(<Notification title="Carousel Item Updated" type="success" duration={2000}>Item updated successfully.</Notification>);
      closeEditDrawer();
      dispatch(getTrendingCarouselAction());
    } catch (error: any) {
      const message = error?.message || error?.data?.message || "Could not update item.";
      toast.push(<Notification title="Failed to Update" type="danger" duration={3000}>{message}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = useCallback((item: TrendingCarouselItemData) => {
    if (item.id === undefined || item.id === null) return;
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = async () => {
    if (!itemToDelete || itemToDelete.id === undefined || itemToDelete.id === null) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteTrendingCarouselAction({ id: itemToDelete.id })).unwrap();
      toast.push(<Notification title="Item Deleted" type="success" duration={2000}>{`Carousel item (ID: ${itemToDelete.id}) deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((item) => item.id !== itemToDelete!.id));
      dispatch(getTrendingCarouselAction());
    } catch (error: any) {
      const message = error?.message || error?.data?.message || "Could not delete item.";
      toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{message}</Notification>);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => String(item.id));
    try {
      await dispatch(deleteMultipleTrendingCarouselAction({ ids: idsToDelete.join(",") })).unwrap();
      toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{selectedItems.length} item(s) deleted.</Notification>);
      setSelectedItems([]);
      dispatch(getTrendingCarouselAction());
    } catch (error: any) {
      const message = error?.message || error?.data?.message || "Failed to delete selected items.";
      toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{message}</Notification>);
    } finally {
      setIsDeleting(false);
    }
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: TrendingCarouselItemData[] = Array.isArray(trendingCarouselData) ? trendingCarouselData : [];
    let processedData: TrendingCarouselItemData[] = cloneDeep(sourceData);

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.links || "").toLowerCase().includes(query) ||
          String(item.id).toLowerCase().includes(query) ||
          (item.updated_by_name?.toLowerCase() ?? "").includes(query) || // Search by updated_by_name
          (item.created_at && new Date(item.created_at).toLocaleDateString().toLowerCase().includes(query))
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && ["id", "links", "created_at", "updated_at", "updated_by_name"].includes(key)) { // Added new sort keys
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "created_at" || key === "updated_at") {
            const dateA = a[key as 'created_at' | 'updated_at'] ? new Date(a[key as 'created_at' | 'updated_at']!).getTime() : 0;
            const dateB = b[key as 'created_at' | 'updated_at'] ? new Date(b[key as 'created_at' | 'updated_at']!).getTime() : 0;
            return order === "asc" ? dateA - dateB : dateB - dateA;
        } else {
            aValue = a[key as keyof TrendingCarouselItemData] ?? "";
            bValue = b[key as keyof TrendingCarouselItemData] ?? "";
        }
        if (typeof aValue === "number" && typeof bValue === "number") {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }
        return order === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
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
  }, [trendingCarouselData, tableData]);

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(<Notification title="No Data" type="info">Nothing to export.</Notification>);
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Trending Carousel Images";
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      
      exportCarouselItemsToCsv("trending_carousel_items.csv", allFilteredAndSortedData);
      toast.push(<Notification title="Data Exported" type="success">Carousel data has been exported.</Notification>);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Operation Failed" type="danger" message={error.message || "Could not complete the export process."} />);
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => setTableData((prev) => ({ ...prev, ...data })), []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => handleSetTableData({ sort: sort, pageIndex: 1 }), [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleClearSearch = useCallback(() => handleSetTableData({ query: '', pageIndex: 1 }), [handleSetTableData]);


  const handleRowSelect = useCallback((checked: boolean, row: TrendingCarouselItemData) => {
    setSelectedItems((prev) => {
      if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
      return prev.filter((item) => item.id !== row.id);
    });
  }, []);

  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<TrendingCarouselItemData>[]) => {
    const originals = currentRows.map((r) => r.original);
    if (checked) {
      setSelectedItems((prev) => {
        const prevIds = new Set(prev.map((item) => item.id));
        const newToAdd = originals.filter((r) => r.id !== undefined && !prevIds.has(r.id));
        return [...prev, ...newToAdd];
      });
    } else {
      const currentIds = new Set(originals.map((r) => r.id).filter((id) => id !== undefined));
      setSelectedItems((prev) => prev.filter((item) => item.id !== undefined && !currentIds.has(item.id)));
    }
  }, []);

  const columns: ColumnDef<TrendingCarouselItemData>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 80, meta: { tdClass: "text-center", thClass: "text-center" }  },
      {
        header: "Image",
        accessorKey: "images_full_path",
        enableSorting: false,
        size: 100,
        meta: { cellClass: "p-1" },
        cell: (props) => (<Avatar size={60} shape="circle" src={props.row.original.images_full_path || undefined} icon={<TbPhoto />} />),
      },
      {
        header: "Link",
        accessorKey: "links",
        enableSorting: true,
        size: 250, // Adjusted size
        cell: (props) => props.row.original.links ? (
            <a href={props.row.original.links} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-[230px]" title={props.row.original.links}> {props.row.original.links} </a>
          ) : ( <span className="text-gray-500">No Link</span> ),
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at", // Sort by updated_at
        enableSorting: true,
        meta: { HeaderClass: "text-red-500" }, // Optional styling
        size: 170,
        cell: (props) => {
            const { updated_at, updated_by_name, updated_by_role } = props.row.original;
            const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(updated_at).toLocaleString("en-US", { month: "long" })} ${new Date(updated_at).getFullYear()}, ${new Date(updated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
            : "N/A";
            return (
                <div className="text-xs">
                    <span>
                    {updated_by_name || "N/A"}
                    {updated_by_role && (<><br /><b>{updated_by_role}</b></>)}
                    </span>
                    <br />
                    <span>{formattedDate}</span>
                </div>
            );
        },
    },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        size: 120,
        cell: (props) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} onDelete={() => handleDeleteClick(props.row.original)} />),
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [openEditDrawer, handleDeleteClick]
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Trending Carousel</h5>
            <div>
              <Link to='/task/task-list/create'>
                  <Button className="mr-2" icon={<TbUser />} clickFeedback={false} customColorClass={({ active, unclickable }) => classNames('hover:text-gray-800 dark:hover:bg-gray-600 border-0 hover:ring-0', active ? 'bg-gray-200' : 'bg-gray-100', unclickable && 'opacity-50 cursor-not-allowed', !active && !unclickable && 'hover:bg-gray-200')}>
                    Assigned to Task
                </Button>
                </Link>
              <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={masterLoadingStatus === "loading" || isSubmitting || isDeleting}> Add New </Button>
            </div>
          </div>
          <ItemTableTools onSearchChange={handleSearchChange} onExport={handleOpenExportReasonModal} searchPlaceholder="Quick Search..." onClearSearch={handleClearSearch} />
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={pageData}
              loading={masterLoadingStatus === "loading" || isSubmitting || isDeleting}
              pagingData={{ total: total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectable
              checkboxChecked={(row: TrendingCarouselItemData) => selectedItems.some((selected) => selected.id === row.id)}
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              onCheckBoxChange={handleRowSelect}
              onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <TrendingCarouselSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting || masterLoadingStatus === "loading"} />

      <Drawer title="Add Trending Carousel" isOpen={isAddDrawerOpen} onClose={closeAddDrawer} onRequestClose={closeAddDrawer} width={600}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={closeAddDrawer} disabled={isSubmitting} type="button"> Cancel </Button>
            <Button size="sm" variant="solid" form="addCarouselItemForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}> {isSubmitting ? "Adding..." : "Save"} </Button>
          </div>
        }
      >
        <Form id="addCarouselItemForm" onSubmit={formMethods.handleSubmit(onAddItemSubmit)} className="flex flex-col gap-y-6">
          <FormItem label="Image" invalid={!!formMethods.formState.errors.imageFile} errorMessage={formMethods.formState.errors.imageFile?.message}>
            <Controller name="imageFile" control={formMethods.control}
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <Input type="file" name={name} ref={ref} onBlur={onBlur}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    onChange(file);
                    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                    setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
                    if (file) formMethods.clearErrors("imageFile");
                  }}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                />
              )}
            />
            {imagePreviewUrl && (<Avatar src={imagePreviewUrl} size={100} shape="square" className="mt-2 border border-gray-200 dark:border-gray-600" />)}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1"> Max file size 5MB. Accepted: .jpg, .png, .webp, .gif </p>
          </FormItem>
          <FormItem label="Link (Optional)" invalid={!!formMethods.formState.errors.links} errorMessage={formMethods.formState.errors.links?.message}>
            <Controller name="links" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value ?? ""} type="url" placeholder="https://example.com/product-page" />)} />
          </FormItem>
        </Form>
      </Drawer>

      <Drawer title="Edit Trending Carousel" isOpen={isEditDrawerOpen} onClose={closeEditDrawer} onRequestClose={closeEditDrawer} width={600}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={closeEditDrawer} disabled={isSubmitting} type="button"> Cancel </Button>
            <Button size="sm" variant="solid" form="editCarouselItemForm" type="submit" loading={isSubmitting}
              disabled={isSubmitting || (!formMethods.formState.isDirty && !imagePreviewUrl && !formMethods.formState.errors.imageFile) || !formMethods.formState.isValid }>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form id="editCarouselItemForm" onSubmit={formMethods.handleSubmit(onEditItemSubmit)} className="flex flex-col gap-y-6 relative pb-28"> {/* Added relative pb-28 */}
          <FormItem label="Current Image">
            {editingItem?.images_full_path ? (<Avatar src={editingItem.images_full_path} size={100} shape="square" className="mt-1 border border-gray-200 dark:border-gray-600" />)
            : (<p className="text-sm text-gray-500 dark:text-gray-400"> No current image. </p>)}
          </FormItem>
          <FormItem label="New Image (Optional to replace)" invalid={!!formMethods.formState.errors.imageFile} errorMessage={formMethods.formState.errors.imageFile?.message}>
            <Controller name="imageFile" control={formMethods.control}
              render={({ field: { onChange, onBlur, name, ref } }) => (
                <Input type="file" name={name} ref={ref} onBlur={onBlur}
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
            {imagePreviewUrl && (<Avatar src={imagePreviewUrl} size={100} shape="square" className="mt-2 border border-gray-200 dark:border-gray-600" />)}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1"> Upload a new image to replace the current one. Max 5MB. </p>
          </FormItem>
          <FormItem label="Link (Optional)" invalid={!!formMethods.formState.errors.links} errorMessage={formMethods.formState.errors.links?.message}>
            <Controller name="links" control={formMethods.control} render={({ field }) => (<Input {...field} value={field.value ?? ""} type="url" placeholder="https://example.com/updated-product-page" />)} />
          </FormItem>
        
          {editingItem && (
            <div className="absolute bottom-[4%] w-[92%] left-1/2 transform -translate-x-1/2"> {/* Positioned audit info */}
                <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                    <div>
                        <b className="mt-3 mb-3 font-semibold text-primary">Latest Update By:</b><br />
                        <p className="text-sm font-semibold">{editingItem.updated_by_name || "N/A"}</p>
                        <p>{editingItem.updated_by_role || "N/A"}</p>
                    </div>
                    <div>
                        <br />
                        <span className="font-semibold">Created At:</span>{" "}
                        <span>
                            {editingItem.created_at ? new Date(editingItem.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}
                        </span>
                        <br />
                        <span className="font-semibold">Updated At:</span>{" "}
                        <span>
                            {editingItem.updated_at ? new Date(editingItem.updated_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"}
                        </span>
                    </div>
                </div>
            </div>
          )}
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Carousel Item"
        onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }}
        confirmButtonColor="red-600" onConfirm={onConfirmSingleDelete} loading={isDeleting}>
        <p> Are you sure you want to delete this carousel item? {itemToDelete && ` (ID: ${itemToDelete.id})`} This action cannot be undone. </p>
      </ConfirmDialog>

      {/* --- Export Reason Modal --- */}
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
          id="exportTrendingCarouselReasonForm" // Unique ID
          onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
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
              render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default TrendingCarousel;