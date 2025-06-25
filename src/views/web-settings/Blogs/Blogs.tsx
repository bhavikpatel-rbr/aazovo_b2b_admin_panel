import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
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
import Avatar from "@/components/ui/Avatar";
import Tag from "@/components/ui/Tag";
import { Card, Drawer, Form, FormItem, Input } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";
import { RichTextEditor } from "@/components/shared";

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbFileText,
  TbX,
  TbReload,
  TbUser,
  TbMessageStar,
  TbMessageShare,
  TbMessageUser,
  TbMessageCheck,
  TbMessage2X,
  TbMessagePause,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// --- Redux Imports ---
import { useAppDispatch } from "@/reduxtool/store";
import {
  getBlogsAction,
  addBlogAction,
  editBlogAction,
  deleteBlogAction,
  deleteAllBlogsAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { Link } from "react-router-dom";

// --- Define Blog Type ---
export type BlogItem = {
  id: number;
  title: string;
  slug: string;
  blog_descr: any;
  author: string | null;
  tags: string | null;
  icon: string | null;
  status: "Published" | "Unpublished" | "Draft";
  meta_title: string | null;
  meta_descr: string | null;
  meta_keyword: string | null;
  created_at: string;
  updated_at: string;
  icon_full_path: string | null;
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Zod Schema for Add/Edit Blog Form ---
const blogStatusEnum = z.enum(["Published", "Unpublished", "Draft"]);
const blogFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required.")
    .max(200, "Title cannot exceed 200 characters."),
  slug: z
    .string()
    .max(255, "Slug cannot exceed 255 characters.")
    .optional()
    .nullable(),
  blog_descr: z.any().optional().nullable(),
  author: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  icon: z.preprocess(
    (arg) => (arg === "" || arg === undefined ? null : arg),
    z
      .instanceof(File, { message: "Icon must be a file." })
      .optional()
      .nullable()
  ),
  status: blogStatusEnum.default("Draft"),
  meta_title: z.string().max(70, "Meta Title too long").optional().nullable(),
  meta_descr: z
    .string()
    .max(160, "Meta Description too long")
    .optional()
    .nullable(),
  meta_keyword: z
    .string()
    .max(255, "Meta Keywords too long")
    .optional()
    .nullable(),
});
export type BlogFormData = z.infer<typeof blogFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterStatus: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(10, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Constants ---
const blogStatusOptions = [
  { value: "Published", label: "Published" },
  { value: "Unpublished", label: "Unpublished" },
  { value: "Draft", label: "Draft" },
];

const blogStatusColor: Record<BlogItem["status"], string> = {
  Published:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500 border-1",
  Unpublished:
    "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100 border-amber-300 dark:border-amber-500 border-1",
  Draft:
    "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100 border-gray-300 dark:border-gray-500 border-1",
};

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
  "ID",
  "Title",
  "Author",
  "Tags",
  "Slug",
  "Status",
  "Meta Title",
  "Meta Description",
  "Meta Keywords",
  "Icon Full Path",
  "Created At",
  "Updated By",
  "Updated Role",
  "Updated At",
];
type BlogExportItem = Omit<BlogItem, "created_at" | "updated_at"> & {
  created_at_formatted?: string;
  updated_at_formatted?: string;
};

const CSV_KEYS_EXPORT: (keyof BlogExportItem)[] = [
  "id",
  "title",
  "author",
  "tags",
  "slug",
  "status",
  "meta_title",
  "meta_descr",
  "meta_keyword",
  "icon_full_path",
  "created_at_formatted",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];

function exportToCsvBlog(filename: string, rows: BlogItem[]): boolean {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }

  const preparedRows: BlogExportItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author || "N/A",
    tags: row.tags || "N/A",
    icon_full_path: row.icon_full_path || "N/A",
    blog_descr: row.blog_descr || "N/A",
    status: row.status || "N/A",
    created_at_formatted: row.created_at
      ? new Date(row.created_at).toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS.join(separator) +
    "\n" +
    preparedRows
      .map((row: any) =>
        CSV_KEYS_EXPORT.map((k) => {
          let cell = row[k];
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

    toast.push(
      <Notification title="Export Successful" type="success">
        Data exported to {filename}.
      </Notification>
    );
    return true;
  }

  toast.push(
    <Notification title="Export Failed" type="danger">
      Browser does not support.
    </Notification>
  );
  return false;
}

// --- ActionColumn ---
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

// --- BlogsSearch ---
type BlogsSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const BlogsSearch = React.forwardRef<HTMLInputElement, BlogsSearchProps>(
  ({ onInputChange }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        className="w-full"
        placeholder="Quick Search..."
        suffix={<TbSearch className="text-lg" />}
        onChange={(e) => onInputChange(e.target.value)}
      />
    );
  }
);
BlogsSearch.displayName = "BlogsSearch";

// --- BlogsTableTools ---
const BlogsTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        <BlogsSearch onInputChange={onSearchChange} />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Button
          title="Clear Filters"
          icon={<TbReload />}
          onClick={onClearFilters}
        ></Button>{" "}
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
};

// --- BlogsTable ---
type BlogsTableProps = {
  columns: ColumnDef<BlogItem>[];
  data: BlogItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: BlogItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: BlogItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<BlogItem>[]) => void;
};
const BlogsTable = ({
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
}: BlogsTableProps) => {
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

// --- BlogsSelectedFooter ---
type BlogsSelectedFooterProps = {
  selectedItems: BlogItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
};
const BlogsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: BlogsSelectedFooterProps) => {
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
              <span className="heading-text">{selectedItems.length}</span>
              <span>Blog{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
              loading={isDeleting}
            >
              Delete Selected
            </Button>{" "}
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Blog${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the selected blog
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Blogs Component ---
const Blogs = () => {
  const dispatch = useAppDispatch();

  const [isAddDrawerOpen, setAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
  const [isFilterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<BlogItem | null>(null);

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterStatus: [],
  });
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    BlogsData = [],
    loading: masterLoading,
    error,
    itemBeingDeleted,
  } = useSelector(masterSelector) as {
    BlogsData?: BlogItem[];
    loading?: boolean | string;
    error?: any;
    itemBeingDeleted?: number | null;
  };

  const tableLoading =
    masterLoading === true ||
    masterLoading === "idle" ||
    isSubmitting ||
    isDeleting;

  useEffect(() => {
    dispatch(getBlogsAction());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const message =
        typeof error === "string"
          ? error
          : (error as any)?.message || "An unknown error occurred";
      toast.push(
        <Notification title="Error" type="danger">
          {message}
        </Notification>
      );
    }
  }, [error]);

  const defaultFormValues: BlogFormData = {
    title: "",
    slug: null,
    blog_descr: null,
    author: null,
    tags: null,
    icon: null,
    status: "Draft",
    meta_title: null,
    meta_descr: null,
    meta_keyword: null,
  };

  const addFormMethods = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<BlogFormData>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({
    resolver: zodResolver(exportReasonSchema),
    defaultValues: { reason: "" },
    mode: "onChange",
  });

  const handleIconChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    formMethodsInstance: typeof addFormMethods | typeof editFormMethods
  ) => {
    const file = event.target.files?.[0];
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    if (file) {
      formMethodsInstance.setValue("icon", file, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      setIconPreview(URL.createObjectURL(file));
    } else {
      formMethodsInstance.setValue("icon", null, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      setIconPreview(null);
    }
  };

  const openAddDrawer = () => {
    addFormMethods.reset(defaultFormValues);
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconPreview(null);
    setAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    addFormMethods.reset(defaultFormValues);
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconPreview(null);
    setAddDrawerOpen(false);
  };

  const onAddBlogSubmit: SubmitHandler<BlogFormData> = async (data) => {
    if (!addFormMethods.formState.isValid) {
      toast.push(
        <Notification title="Validation Error" type="danger">
          Please correct the form errors.
        </Notification>
      );
      return;
    }
    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append("title", data.title);
    if (data.slug) formDataToSend.append("slug", data.slug);
    // --- FIX START: Serialize the rich text editor content to a JSON string ---
    if (data.blog_descr) {
      formDataToSend.append("blog_descr", data.blog_descr); // <-- remove JSON.stringify()
    }

    // --- FIX END ---
    if (data.author) formDataToSend.append("author", data.author);
    if (data.tags) formDataToSend.append("tags", data.tags);
    if (data.status) formDataToSend.append("status", data.status);
    if (data.icon instanceof File) formDataToSend.append("icon", data.icon);
    if (data.meta_title) formDataToSend.append("meta_title", data.meta_title);
    if (data.meta_descr) formDataToSend.append("meta_descr", data.meta_descr);
    if (data.meta_keyword)
      formDataToSend.append("meta_keyword", data.meta_keyword);

    try {
      const resultAction = await dispatch(addBlogAction(formDataToSend));
      if (addBlogAction.fulfilled.match(resultAction)) {
        toast.push(
          <Notification title="Blog Added" type="success">
            New blog created successfully.
          </Notification>
        );
        closeAddDrawer();
        dispatch(getBlogsAction());
      } else {
        const errorMessage =
          (resultAction.payload as any)?.message ||
          resultAction.error.message ||
          "Failed to add blog.";
        toast.push(
          <Notification title="Add Failed" type="danger">
            {errorMessage}
          </Notification>
        );
      }
    } catch (e) {
      const errorMessage =
        (e as any)?.message || "An unexpected error occurred.";
      toast.push(
        <Notification title="Submission Error" type="danger">
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (blog: BlogItem) => {
    setEditingBlog(blog);
    editFormMethods.reset({
      title: blog.title,
      slug: blog.slug || null,
      blog_descr: blog.blog_descr || null,
      author: blog.author || null,
      tags: blog.tags || null,
      icon: null,
      status: blog.status,
      meta_title: blog.meta_title || null,
      meta_descr: blog.meta_descr || null,
      meta_keyword: blog.meta_keyword || null,
    });
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconPreview(blog.icon_full_path);
    setEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setEditingBlog(null);
    editFormMethods.reset(defaultFormValues);
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconPreview(null);
    setEditDrawerOpen(false);
  };

  const onEditBlogSubmit = async (data: BlogFormData) => {
    if (
      !editingBlog ||
      editingBlog.id === undefined ||
      editingBlog.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Editing Blog ID is missing.
        </Notification>
      );
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("_method", "PUT");
    (Object.keys(data) as Array<keyof BlogFormData>).forEach((key) => {
      const value = data[key];
      if (key === "icon") {
        if (value instanceof File) formData.append(key, value);
      }
      // --- FIX START: Add special handling for blog_descr to serialize it ---
      else if (key === "blog_descr") {
        if (value) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, "");
        }
      }
      // --- FIX END ---
      else {
        if (value === null) formData.append(key, "");
        else if (value !== undefined) formData.append(key, String(value));
      }
    });
    try {
      await dispatch(editBlogAction({ id: editingBlog.id, formData })).unwrap();
      toast.push(
        <Notification title="Blog Updated" type="success" duration={2000}>
          Blog "{data.title}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getBlogsAction());
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMessage = "Could not update blog.";
      if (responseData) {
        if (responseData.message) errorMessage = responseData.message;
        if (responseData.errors) {
          const validationErrors = Object.values(responseData.errors)
            .flat()
            .join(" ");
          errorMessage += ` Details: ${validationErrors}`;
        }
      } else if (error.message) errorMessage = error.message;
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={4000}>
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (blog: BlogItem) => {
    setBlogToDelete(blog);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!blogToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      const result = await dispatch(deleteBlogAction({ id: blogToDelete.id }));
      if (deleteBlogAction.fulfilled.match(result)) {
        toast.push(
          <Notification title="Blog Deleted" type="success">
            Blog "{blogToDelete.title}" deleted.
          </Notification>
        );
        dispatch(getBlogsAction());
        setBlogToDelete(null);
      } else {
        const errorMessage =
          (result.payload as any)?.message || "Failed to delete blog.";
        toast.push(
          <Notification title="Delete Failed" type="danger">
            {errorMessage}
          </Notification>
        );
      }
    } catch (e) {
      const errorMessage =
        (e as any)?.message || "An unexpected error occurred.";
      toast.push(
        <Notification title="Delete Error" type="danger">
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
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
    const idsToDelete = selectedItems.map((item) => item.id).join(",");
    try {
      const result = await dispatch(deleteAllBlogsAction({ ids: idsToDelete }));
      if (deleteAllBlogsAction.fulfilled.match(result)) {
        toast.push(
          <Notification title="Blogs Deleted" type="success">
            {selectedItems.length} blog(s) deleted.
          </Notification>
        );
        setSelectedItems([]);
        dispatch(getBlogsAction());
      } else {
        const errorMessage =
          (result.payload as any)?.message ||
          "Failed to delete selected blogs.";
        toast.push(
          <Notification title="Deletion Failed" type="danger">
            {errorMessage}
          </Notification>
        );
      }
    } catch (e) {
      const errorMessage =
        (e as any)?.message || "An unexpected error occurred.";
      toast.push(
        <Notification title="Deletion Error" type="danger">
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({ filterStatus: data.filterStatus || [] });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = { filterStatus: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
    dispatch(getBlogsAction());
    setFilterDrawerOpen(false);
  };

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "desc", key: "created_at" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<BlogItem[]>([]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: BlogItem[] = cloneDeep(BlogsData?.data || []);
    if (filterCriteria.filterStatus && filterCriteria.filterStatus.length > 0) {
      const selectedStatuses = filterCriteria.filterStatus.map(
        (opt) => opt.value
      );
      processedData = processedData.filter((item) =>
        selectedStatuses.includes(item.status)
      );
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          String(item.id).toLowerCase().includes(query) ||
          item.slug?.toLowerCase().includes(query) ||
          (item.author?.toLowerCase() ?? "").includes(query) ||
          (item.tags?.toLowerCase() ?? "").includes(query) ||
          (item.updated_by_name?.toLowerCase() ?? "").includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      [
        "id",
        "title",
        "author",
        "tags",
        "slug",
        "status",
        "created_at",
        "updated_at",
        "updated_by_name",
      ].includes(key)
    ) {
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "created_at" || key === "updated_at") {
          const dateA = a[key as "created_at" | "updated_at"]
            ? new Date(a[key as "created_at" | "updated_at"]!).getTime()
            : 0;
          const dateB = b[key as "created_at" | "updated_at"]
            ? new Date(b[key as "created_at" | "updated_at"]!).getTime()
            : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        } else {
          aValue = a[key as keyof BlogItem] ?? "";
          bValue = b[key as keyof BlogItem] ?? "";
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
  }, [BlogsData?.data, tableData, filterCriteria]);

  const handleOpenExportReasonModal = () => {
    if (!allFilteredAndSortedData || !allFilteredAndSortedData.length) {
      toast.push(
        <Notification title="No Data" type="info">
          Nothing to export.
        </Notification>
      );
      return;
    }
    exportReasonFormMethods.reset({ reason: "" });
    setIsExportReasonModalOpen(true);
  };

  const handleConfirmExportWithReason = async (data: ExportReasonFormData) => {
    setIsSubmittingExportReason(true);
    const moduleName = "Blogs";
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `blogs_export_${timestamp}.csv`;
    try {
      await dispatch(
        submitExportReasonAction({
          reason: data.reason,
          module: moduleName,
          file_name: fileName,
        })
      ).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );
      exportToCsvBlog(fileName, allFilteredAndSortedData);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(
        <Notification
          title="Operation Failed"
          type="danger"
          message={error.message || "Could not complete export."}
        />
      );
    } finally {
      setIsSubmittingExportReason(false);
    }
  };

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
    setSelectedItems([]);
  }, []);
  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({ pageSize: Number(value), pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const handleSort = useCallback(
    (sort: OnSortParam) => {
      handleSetTableData({ sort: sort, pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback((checked: boolean, row: BlogItem) => {
    setSelectedItems((prev) => {
      if (checked)
        return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
      return prev.filter((item) => item.id !== row.id);
    });
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<BlogItem>[]) => {
      const currentPageRowOriginals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prevSelected) => {
          const prevSelectedIds = new Set(prevSelected.map((item) => item.id));
          const newRowsToAdd = currentPageRowOriginals.filter(
            (r) => !prevSelectedIds.has(r.id)
          );
          return [...prevSelected, ...newRowsToAdd];
        });
      } else {
        const currentPageRowIds = new Set(
          currentPageRowOriginals.map((r) => r.id)
        );
        setSelectedItems((prevSelected) =>
          prevSelected.filter((item) => !currentPageRowIds.has(item.id))
        );
      }
    },
    []
  );

  const openImageViewer = (src: string | null) => {
    if (src) {
      setImageToView(src);
      setIsImageViewerOpen(true);
    }
  };
  const closeImageViewer = () => {
    setIsImageViewerOpen(false);
    setImageToView(null);
  };

  const columns: ColumnDef<BlogItem>[] = useMemo(
    () => [
      {
        header: "Icon",
        accessorKey: "icon_full_path",
        enableSorting: false,
        size: 60,
        meta: { headerClass: "text-center", cellClass: "text-center" },
        cell: (props) => {
          const iconPath = props.row.original.icon_full_path;
          return (
            <Avatar
              size={40}
              shape="circle"
              src={iconPath || undefined}
              icon={!iconPath ? <TbFileText /> : undefined}
              onClick={() => openImageViewer(iconPath)}
              className={
                iconPath
                  ? "cursor-pointer hover:ring-2 hover:ring-indigo-500"
                  : ""
              }
            >
              {!iconPath
                ? props.row.original.title?.charAt(0).toUpperCase()
                : null}
            </Avatar>
          );
        },
      },
      {
        header: "Title",
        accessorKey: "title",
        enableSorting: true,
        size: 240,
        cell: (props) => <span>{props.getValue<string>()}</span>,
      },
      {
        header: "Author",
        accessorKey: "author",
        enableSorting: true,
        size: 150,
        cell: (props) => <span>{props.getValue<string>() || "N/A"}</span>,
      },
      {
        header: "Tags",
        accessorKey: "tags",
        enableSorting: true,
        size: 180,
        cell: (props) => {
          const tags = props.getValue<string | null>();
          if (!tags) return <span>-</span>;
          return (
            <div className="flex flex-wrap gap-1 max-w-[170px]">
              {tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((t) => (
                  <Tag
                    key={t}
                    className="bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-100 text-xs"
                  >
                    {t}
                  </Tag>
                ))}
            </div>
          );
        },
      },
      { header: "Slug", accessorKey: "slug", enableSorting: true, size: 240 },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 80,
        cell: (props) => {
          const status = props.row.original.status;
          return (
            <Tag
              className={classNames(
                "capitalize font-semibold border-0",
                blogStatusColor[status] || blogStatusColor.Draft
              )}
            >
              {status}
            </Tag>
          );
        },
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        size: 170,
        cell: (props) => {
          const { updated_at, updated_by_user } = props.row.original;
          const formattedDate = updated_at
            ? `${new Date(updated_at).getDate()} ${new Date(
                updated_at
              ).toLocaleString("en-US", { month: "short" })} ${new Date(
                updated_at
              ).getFullYear()}, ${new Date(updated_at).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true }
              )}`
            : "N/A";
          return (
            <div className="text-xs">
              <span>
                {updated_by_user?.name || "N/A"}
                {updated_by_user?.roles[0]?.display_name && (
                  <>
                    <br />
                    <b>{updated_by_user?.roles[0]?.display_name}</b>
                  </>
                )}
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
        size: 80,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    []
  );

  useEffect(() => {
    return () => {
      if (iconPreview) {
        URL.revokeObjectURL(iconPreview);
      }
    };
  }, [iconPreview]);

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Blogs</h5>
            <div>
              <Link to="/task/task-list/create">
                <Button
                  className="mr-2"
                  icon={<TbUser />}
                  clickFeedback={false}
                  customColorClass={({ active, unclickable }) =>
                    classNames(
                      "hover:text-gray-800 dark:hover:bg-gray-600 border-0 hover:ring-0",
                      active ? "bg-gray-200" : "bg-gray-100",
                      unclickable && "opacity-50 cursor-not-allowed",
                      !active && !unclickable && "hover:bg-gray-200"
                    )
                  }
                >
                  Assign to Task
                </Button>
              </Link>
              <Button
                variant="solid"
                icon={<TbPlus />}
                onClick={openAddDrawer}
                disabled={tableLoading}
              >
                Add New
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 mb-4 gap-2">
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-blue-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-blue-100 text-blue-500">
                <TbMessageStar size={24} />
              </div>
              <div>
                <h6 className="text-blue-500">{BlogsData?.counts?.total}</h6>
                <span className="font-semibold text-xs">Total</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-violet-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-violet-100 text-violet-500">
                <TbMessageShare size={24} />
              </div>
              <div>
                <h6 className="text-violet-500">{BlogsData?.counts?.today}</h6>
                <span className="font-semibold text-xs">Today</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-orange-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-orange-100 text-orange-500">
                <TbMessageUser size={24} />
              </div>
              <div>
                <h6 className="text-orange-500">
                  {BlogsData?.counts?.total_views}
                </h6>
                <span className="font-semibold text-xs">Total Views</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-green-300"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-green-100 text-green-500">
                <TbMessageCheck size={24} />
              </div>
              <div>
                <h6 className="text-green-500">
                  {BlogsData?.counts?.published}{" "}
                </h6>
                <span className="font-semibold text-xs">Published</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-red-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-red-100 text-red-500">
                <TbMessage2X size={24} />
              </div>
              <div>
                <h6 className="text-red-500">
                  {BlogsData?.counts?.unpublished}
                </h6>
                <span className="font-semibold text-xs">Unpublished</span>
              </div>
            </Card>
            <Card
              bodyClass="flex gap-2 p-2"
              className="rounded-md border border-gray-200"
            >
              <div className="h-12 w-12 rounded-md flex items-center justify-center bg-gray-100 text-gray-500">
                <TbMessagePause size={24} />
              </div>
              <div>
                <h6 className="text-gray-500">{BlogsData?.counts?.draft}</h6>
                <span className="font-semibold text-xs">Drafts</span>
              </div>
            </Card>
          </div>
          <BlogsTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
          />{" "}
          <div className="mt-4 flex-grow overflow-y-auto">
            <BlogsTable
              columns={columns}
              data={pageData}
              loading={tableLoading}
              pagingData={{
                total: total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
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
      <BlogsSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        isDeleting={isDeleting}
      />
      {[
        {
          type: "add",
          title: "Add New Blog",
          isOpen: isAddDrawerOpen,
          closeFn: closeAddDrawer,
          formId: "addBlogForm",
          methods: addFormMethods,
          onSubmit: onAddBlogSubmit,
          submitButtonText: "Save",
          submittingText: "Adding...",
        },
        {
          type: "edit",
          title: "Edit Blog",
          isOpen: isEditDrawerOpen,
          closeFn: closeEditDrawer,
          formId: "editBlogForm",
          methods: editFormMethods,
          onSubmit: onEditBlogSubmit,
          submitButtonText: "Save",
          submittingText: "Saving...",
        },
      ].map((drawer) => (
        <Drawer
          key={drawer.formId}
          title={drawer.title}
          isOpen={drawer.isOpen}
          onClose={drawer.closeFn}
          onRequestClose={drawer.closeFn}
          width={1000}
          footer={
            <div className="text-right w-full">
              <Button
                size="sm"
                className="mr-2"
                onClick={drawer.closeFn}
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="solid"
                form={drawer.formId}
                type="submit"
                loading={isSubmitting}
                disabled={!drawer.methods.formState.isValid || isSubmitting}
              >
                {isSubmitting ? drawer.submittingText : drawer.submitButtonText}
              </Button>
            </div>
          }
        >
          <Form
            id={drawer.formId}
            onSubmit={drawer.methods.handleSubmit(drawer.onSubmit as any)}
            className="flex flex-col gap-4 relative"
          >
            <FormItem
              label={
                <div>
                  Title<span className="text-red-500"> * </span>
                </div>
              }
              invalid={!!drawer.methods.formState.errors.title}
              errorMessage={
                drawer.methods.formState.errors.title?.message as
                  | string
                  | undefined
              }
              isRequired
            >
              <Controller
                name="title"
                control={drawer.methods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter Blog Title" />
                )}
              />
            </FormItem>
            <div className="grid grid-cols-2 gap-4">
              <FormItem
                label="Slug / URL"
                invalid={!!drawer.methods.formState.errors.slug}
                errorMessage={
                  drawer.methods.formState.errors.slug?.message as
                    | string
                    | undefined
                }
              >
                <Controller
                  name="slug"
                  control={drawer.methods.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g., my-awesome-blog-post"
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label={
                  <div>
                    Status<span className="text-red-500"> * </span>
                  </div>
                }
                invalid={!!drawer.methods.formState.errors.status}
                errorMessage={
                  drawer.methods.formState.errors.status?.message as
                    | string
                    | undefined
                }
                isRequired
              >
                <Controller
                  name="status"
                  control={drawer.methods.control}
                  render={({ field }) => (
                    <Select
                      placeholder="Select Status"
                      options={blogStatusOptions}
                      value={blogStatusOptions.find(
                        (opt) => opt.value === field.value
                      )}
                      onChange={(opt) => field.onChange(opt?.value)}
                    />
                  )}
                />
              </FormItem>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormItem
                label="Author"
                invalid={!!drawer.methods.formState.errors.author}
                errorMessage={
                  drawer.methods.formState.errors.author?.message as
                    | string
                    | undefined
                }
              >
                <Controller
                  name="author"
                  control={drawer.methods.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Enter author name"
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Blog Tags (comma-separated)"
                invalid={!!drawer.methods.formState.errors.tags}
                errorMessage={
                  drawer.methods.formState.errors.tags?.message as
                    | string
                    | undefined
                }
              >
                <Controller
                  name="tags"
                  control={drawer.methods.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g., tech, react, news"
                    />
                  )}
                />
              </FormItem>
            </div>
            <FormItem
              label="Description"
              invalid={!!drawer.methods.formState.errors.blog_descr}
              errorMessage={
                drawer.methods.formState.errors.blog_descr?.message as
                  | string
                  | undefined
              }
            >
              <Controller
                name="blog_descr"
                control={drawer.methods.control}
                render={({ field }) => (
                  <RichTextEditor
                    content={field.value}
                    onChange={(val) => field.onChange(val.html)} // 👈 Store only HTML
                    placeholder="Enter main blog content..."
                  />
                )}
              />
            </FormItem>
            <div className="grid grid-cols-2 gap-4">
              <FormItem
                label="Meta Title"
                invalid={!!drawer.methods.formState.errors.meta_title}
                errorMessage={
                  drawer.methods.formState.errors.meta_title?.message as
                    | string
                    | undefined
                }
              >
                <Controller
                  name="meta_title"
                  control={drawer.methods.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="SEO Title (max 70 chars)"
                    />
                  )}
                />
              </FormItem>
              <FormItem
                label="Meta Keywords"
                invalid={!!drawer.methods.formState.errors.meta_keyword}
                errorMessage={
                  drawer.methods.formState.errors.meta_keyword?.message as
                    | string
                    | undefined
                }
              >
                <Controller
                  name="meta_keyword"
                  control={drawer.methods.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Comma-separated keywords"
                    />
                  )}
                />
              </FormItem>
            </div>
            <FormItem
              label="Meta Description"
              invalid={!!drawer.methods.formState.errors.meta_descr}
              errorMessage={
                drawer.methods.formState.errors.meta_descr?.message as
                  | string
                  | undefined
              }
            >
              <Controller
                name="meta_descr"
                control={drawer.methods.control}
                render={({ field }) => (
                  <Input
                    textArea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="SEO Description (max 160 chars)"
                    rows={3}
                  />
                )}
              />
            </FormItem>
            <FormItem
              label={`Blog Image${
                drawer.type === "edit" &&
                editingBlog?.icon_full_path &&
                iconPreview === editingBlog.icon_full_path
                  ? " (Change?)"
                  : ""
              }`}
              invalid={!!drawer.methods.formState.errors.icon}
              errorMessage={
                drawer.methods.formState.errors.icon?.message as
                  | string
                  | undefined
              }
            >
              {drawer.type === "edit" &&
                iconPreview &&
                editingBlog?.icon_full_path === iconPreview && (
                  <div className="text-right">
                    <img
                      src={iconPreview}
                      alt="Current Icon"
                      className="w-[460px] h-[auto] border p-1 rounded-md mt-2 mb-2"
                    />
                    {/* <Button
                      icon={<TbX />}
                      size="xs"
                      color="red"
                      className="mt-2 mb-2"
                      type="button"
                      onClick={() => {
                        if (iconPreview) URL.revokeObjectURL(iconPreview);
                        setIconPreview(null);
                        drawer.methods.setValue("icon", null, {
                          shouldValidate: true,
                        });
                      }}
                    >
                      Remove Current Icon
                    </Button> */}
                  </div>
                )}
              {iconPreview &&
                (drawer.methods.watch("icon") instanceof File ||
                  (drawer.type === "edit" &&
                    editingBlog?.icon_full_path !== iconPreview)) && (
                  <img
                    src={iconPreview}
                    alt="Icon Preview"
                    className="w-[460px] h-[auto] border p-1 rounded-md mt-2 mb-2"
                  />
                )}
              {!iconPreview &&
                drawer.type === "edit" &&
                editingBlog?.icon_full_path &&
                !drawer.methods.watch("icon") && (
                  <p className="text-xs text-gray-500 mb-1">
                    Current icon will be removed. Upload a new one if needed.
                  </p>
                )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleIconChange(e, drawer.methods)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </FormItem>
            {drawer.type === "edit" && editingBlog && (
              <div className="w-full">
                <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                  <div>
                    <b className="mt-3 mb-3 font-semibold text-primary">
                      Latest Update:
                    </b>
                    <br />
                    <p className="text-sm font-semibold">
                      {editingBlog.updated_by_user?.name || "N/A"}
                    </p>
                    <p>
                      {editingBlog.updated_by_user?.roles[0]?.display_name ||
                        "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <br />
                    <span className="font-semibold">Created At:</span>{" "}
                    <span>
                      {editingBlog.created_at
                        ? `${new Date(
                            editingBlog.created_at
                          ).getDate()} ${new Date(
                            editingBlog.created_at
                          ).toLocaleString("en-US", {
                            month: "short",
                          })} ${new Date(
                            editingBlog.created_at
                          ).getFullYear()}, ${new Date(
                            editingBlog.created_at
                          ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}`
                        : "N/A"}
                    </span>
                    <br />
                    <span className="font-semibold">Updated At:</span>{" "}
                    <span>
                      {editingBlog.updated_at
                        ? `${new Date(
                            editingBlog.updated_at
                          ).getDate()} ${new Date(
                            editingBlog.updated_at
                          ).toLocaleString("en-US", {
                            month: "short",
                          })} ${new Date(
                            editingBlog.updated_at
                          ).getFullYear()}, ${new Date(
                            editingBlog.updated_at
                          ).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Form>
        </Drawer>
      ))}
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={400}
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={onClearFilters}
              type="button"
            >
              Clear
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="filterBlogForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterBlogForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select status..."
                  options={blogStatusOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Blog"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setBlogToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setBlogToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setBlogToDelete(null);
        }}
        confirmButtonColor="red-600"
        onConfirm={onConfirmSingleDelete}
        loading={
          isDeleting ||
          (masterLoading === "idle" &&
            !!itemBeingDeleted &&
            blogToDelete?.id === itemBeingDeleted)
        }
      >
        <p>
          Are you sure you want to delete the blog "
          <strong>{blogToDelete?.title}</strong>"? This action cannot be
          undone.
        </p>
      </ConfirmDialog>
      <Dialog
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        onRequestClose={closeImageViewer}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        width={600}
      >
        <div className="flex justify-center items-center p-4">
          {imageToView ? (
            <img
              src={imageToView}
              alt="Slider Image Full View"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
          ) : (
            <p>No image to display.</p>
          )}
        </div>
      </Dialog>
      <ConfirmDialog
        isOpen={isExportReasonModalOpen}
        type="info"
        title="Reason for Export"
        onClose={() => setIsExportReasonModalOpen(false)}
        onRequestClose={() => setIsExportReasonModalOpen(false)}
        onCancel={() => setIsExportReasonModalOpen(false)}
        onConfirm={exportReasonFormMethods.handleSubmit(
          handleConfirmExportWithReason
        )}
        loading={isSubmittingExportReason}
        confirmText={
          isSubmittingExportReason ? "Submitting..." : "Submit & Export"
        }
        cancelText="Cancel"
        confirmButtonProps={{
          disabled:
            !exportReasonFormMethods.formState.isValid ||
            isSubmittingExportReason,
        }}
      >
        <Form
          id="exportBlogsReasonForm"
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)();
          }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={
              exportReasonFormMethods.formState.errors.reason?.message
            }
          >
            <Controller
              name="reason"
              control={exportReasonFormMethods.control}
              render={({ field }) => (
                <Input textArea {...field} placeholder="Enter reason..." rows={3} />
              )}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default Blogs;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}