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
import Select from "@/components/ui/Select"; // RHF-compatible Select
import Avatar from "@/components/ui/Avatar";
import Tag from "@/components/ui/Tag";
import Textarea from "@/views/ui-components/forms/Input/Textarea"; // YOUR TEXTAREA COMPONENT
import { Drawer, Form, FormItem, Input } from "@/components/ui";
import Dialog from "@/components/ui/Dialog";

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
  TbCopy, // Added for Clone
  TbCloudDownload,
  TbReload,
  TbUser, // Added for Import
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
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

// --- Define Blog Type (Matches API Listing Response) ---
export type BlogItem = {
  id: number;
  title: string;
  slug: string;
  blog_descr: string | null;
  icon: string | null; // Original icon name/path from API
  status: "Published" | "Unpublished" | "Draft";
  meta_title: string | null;
  meta_descr: string | null;
  meta_keyword: string | null;
  created_at: string;
  updated_at: string;
  icon_full_path: string | null; // Resolved full URL for display
};

// --- Zod Schema for Add/Edit Blog Form (ONLY TITLE IS COMPULSORY) ---
const blogStatusEnum = z.enum(["Published", "Unpublished", "Draft"]);
const blogFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required.")
    .max(200, "Title cannot exceed 200 characters."),
  slug: z
    .string()
    .max(255, "Slug cannot exceed 255 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Invalid slug format (e.g., my-blog-post)"
    )
    .optional()
    .nullable(),
  blog_descr: z.string().optional().nullable(),
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

// --- Constants ---
const blogStatusOptions = [
  { value: "Published", label: "Published" },
  { value: "Unpublished", label: "Unpublished" },
  { value: "Draft", label: "Draft" },
];

const blogStatusColor: Record<BlogItem["status"], string> = {
  Published:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Unpublished:
    "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-100",
  Draft: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-100",
};

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
  "ID",
  "Title",
  "Slug",
  "Status",
  "Meta Title",
  "Meta Description",
  "Meta Keywords",
  "Created Date",
  "Icon Full Path",
];
const CSV_KEYS: (keyof BlogItem | "icon_full_path")[] = [
  "id",
  "title",
  "slug",
  "status",
  "meta_title",
  "meta_descr",
  "meta_keyword",
  "created_at",
  "icon_full_path",
];

function exportToCsv(filename: string, rows: BlogItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        {" "}
        Nothing to export.{" "}
      </Notification>
    );
    return false;
  }
  const separator = ",";
  const csvContent =
    CSV_HEADERS.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return CSV_KEYS.map((k) => {
          let cell: any = row[k as keyof BlogItem];
          if (cell === null || cell === undefined) {
            cell = "";
          } else if (k === "created_at" || k === "updated_at") {
            cell = new Date(cell).toLocaleDateString();
          } else {
            cell = String(cell).replace(/"/g, '""');
          }
          if (String(cell).search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      })
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
      {" "}
      Browser does not support this feature.{" "}
    </Notification>
  );
  return false;
}

// --- ActionColumn ---
const ActionColumn = ({
  onEdit,
  onDelete,
  onClone,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center">
      {/* <Tooltip title="Clone Blog">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
          )}
          role="button"
          tabIndex={0}
          onClick={onClone}
        >
          <TbCopy />
        </div>
      </Tooltip> */}
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
          {" "}
          <TbPencil />{" "}
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
          {" "}
          <TbTrash />{" "}
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
  onImport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onImport: () => void;
  onClearFilters: () => void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
      <div className="flex-grow">
        {" "}
        <BlogsSearch onInputChange={onSearchChange} />{" "}
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Button title="Clear Filters" icon={<TbReload/>} onClick={()=>onClearFilters()}></Button>
        <Button
          icon={<TbFilter />}
          onClick={onFilter}
          className="w-full sm:w-auto"
        >
          {" "}
          Filter{" "}
        </Button>
        
        {/* <Button
          icon={<TbCloudDownload />}
          onClick={onImport}
          className="w-full sm:w-auto"
        >
          Import
        </Button>{" "} */}

        {/* Added Import */}
        <Button
          icon={<TbCloudUpload />}
          onClick={onExport}
          className="w-full sm:w-auto"
        >
          {" "}
          Export{" "}
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
};
const BlogsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
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
              {" "}
              <TbChecks />{" "}
            </span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text"> {selectedItems.length} </span>
              <span> Blog{selectedItems.length > 1 ? "s" : ""} selected </span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
            >
              {" "}
              Delete Selected{" "}
            </Button>
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
      >
        <p>
          {" "}
          Are you sure you want to delete the selected blog{" "}
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.{" "}
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
  const [importDialogOpen, setImportDialogOpen] = useState(false); // Added

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<BlogItem | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterStatus: [],
  });
  const [iconPreview, setIconPreview] = useState<string | null>(null); // Stays as single preview, managed by drawer context
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false); // Renamed
  const [imageToView, setImageToView] = useState<string | null>(null); // Renamed

  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from isFormSubmitting
  const [isProcessing, setIsProcessing] = useState(false); // Renamed from isItemDeleting, used for delete

  const {
    BlogsData = [],
    loading: masterLoading,
    error,
    itemBeingDeleted,
  } = useSelector(masterSelector) as {
    BlogsData?: BlogItem[];
    loading?: boolean | string; // Can be boolean or string like 'idle', "idle"
    error?: any;
    itemBeingDeleted?: number | null;
  };

  const tableLoading =
    masterLoading === true ||
    masterLoading === "idle" ||
    isSubmitting ||
    isProcessing;

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

  // Debugging useEffects (kept as they were in original)
  useEffect(() => {
    if (isAddDrawerOpen) {
      const subscription = addFormMethods.watch((value, { name, type }) => {
        console.log(
          "--- ADD FORM WATCH --- Field:",
          name,
          "Type:",
          type,
          "Full Value:",
          value,
          "Icon:",
          value.icon,
          "File?:",
          value.icon instanceof File,
          "Null?:",
          value.icon === null,
          "Errors:",
          addFormMethods.formState.errors,
          "Valid:",
          addFormMethods.formState.isValid
        );
      });
      return () => subscription.unsubscribe();
    }
  }, [addFormMethods, isAddDrawerOpen]);

  useEffect(() => {
    if (isEditDrawerOpen) {
      const subscription = editFormMethods.watch((value, { name, type }) => {
        console.log(
          "--- EDIT FORM WATCH --- Field:",
          name,
          "Type:",
          type,
          "Full Value:",
          value,
          "Icon:",
          value.icon,
          "File?:",
          value.icon instanceof File,
          "Null?:",
          value.icon === null,
          "Errors:",
          editFormMethods.formState.errors,
          "Valid:",
          editFormMethods.formState.isValid
        );
      });
      return () => subscription.unsubscribe();
    }
  }, [editFormMethods, isEditDrawerOpen]);

  const handleIconChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    formMethods: typeof addFormMethods | typeof editFormMethods
  ) => {
    const file = event.target.files?.[0];
    if (iconPreview) URL.revokeObjectURL(iconPreview); // Revoke previous object URL if exists

    if (file) {
      formMethods.setValue("icon", file, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      setIconPreview(URL.createObjectURL(file));
    } else {
      formMethods.setValue("icon", null, {
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
    console.log(
      "ADD BLOG SUBMIT - Data:",
      data,
      "isValid:",
      addFormMethods.formState.isValid
    );
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
    if (data.blog_descr) formDataToSend.append("blog_descr", data.blog_descr);
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
      icon: null, // Icon is handled by preview logic, not pre-filled with file path
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
          Cannot edit: Editing Brand ID is missing.
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
      } else {
        if (value === null) formData.append(key, "");
        else if (value !== undefined) formData.append(key, String(value));
      }
    });
    try {
      await dispatch(editBlogAction({ id: editingBlog.id, formData })).unwrap();
      toast.push(
        <Notification title="Brand Updated" type="success" duration={2000}>
          Brand "{data.title}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getBlogsAction());
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMessage = "Could not update brand.";
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
      console.error("Edit Brand Error:", error.response || error, responseData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloneBlog = (blog: BlogItem) => {
    addFormMethods.reset({
      title: `${blog.title} (Copy)`,
      slug: blog.slug ? `${blog.slug}-copy` : null,
      blog_descr: blog.blog_descr,
      icon: null, // Icon cannot be cloned directly, user must re-upload
      status: blog.status,
      meta_title: blog.meta_title,
      meta_descr: blog.meta_descr,
      meta_keyword: blog.meta_keyword,
    });
    if (iconPreview) URL.revokeObjectURL(iconPreview);
    setIconPreview(null); // No icon preview for cloned item unless re-uploaded
    setAddDrawerOpen(true);
    toast.push(
      <Notification title="Clone Blog" type="info">
        Cloning "{blog.title}". Please review, upload an icon if needed, and
        save.
      </Notification>
    );
  };

  const handleDeleteClick = (blog: BlogItem) => {
    setBlogToDelete(blog);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!blogToDelete?.id) return;
    setIsProcessing(true);
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
      setIsProcessing(false);
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
    setIsProcessing(true);
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
      setIsProcessing(false);
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
  };

  const handleImportData = () => setImportDialogOpen(true); // Added

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<BlogItem[]>([]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: BlogItem[] = cloneDeep(BlogsData || []);
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
          item.slug?.toLowerCase().includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (order && key && processedData.length > 0) {
      processedData.sort((a, b) => {
        let aValue: any, bValue: any;
        if (key === "created_at" || key === "updated_at") {
          aValue = new Date(a[key as "created_at" | "updated_at"]).getTime();
          bValue = new Date(b[key as "created_at" | "updated_at"]).getTime();
        } else {
          aValue = String(a[key as keyof BlogItem] ?? "").toLowerCase();
          bValue = String(b[key as keyof BlogItem] ?? "").toLowerCase();
        }
        if (isNaN(aValue) && !isNaN(bValue)) return order === "asc" ? 1 : -1;
        if (!isNaN(aValue) && isNaN(bValue)) return order === "asc" ? -1 : 1;
        return order === "asc"
          ? aValue < bValue
            ? -1
            : aValue > bValue
            ? 1
            : 0
          : bValue < aValue
          ? -1
          : bValue > aValue
          ? 1
          : 0;
      });
    }
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    const dataForPage = processedData.slice(startIndex, startIndex + pageSize);
    return {
      pageData: dataForPage,
      total: currentTotal,
      allFilteredAndSortedData: processedData,
    };
  }, [BlogsData, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsv("blogs_export.csv", allFilteredAndSortedData);
    if (success) {
      toast.push(
        <Notification title="Export Successful" type="success">
          {" "}
          Data exported.{" "}
        </Notification>
      );
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
    // Renamed
    if (src) {
      setImageToView(src);
      setIsImageViewerOpen(true);
    }
  };
  const closeImageViewer = () => {
    // Added
    setIsImageViewerOpen(false);
    setImageToView(null);
  };

  const columns: ColumnDef<BlogItem>[] = useMemo(
    () => [
      {
        header: "Icon",
        accessorKey: "icon_full_path",
        enableSorting: false,
        size: 80,
        meta: { headerClass: "text-center", cellClass: "text-center" },
        cell: (props) => {
          const iconPath = props.row.original.icon_full_path;
          const titleInitial = props.row.original.title
            ?.charAt(0)
            .toUpperCase();
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
              {" "}
              {!iconPath ? titleInitial : null}{" "}
            </Avatar>
          );
        },
      },
      // { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
      {
        header: "Title",
        accessorKey: "title",
        enableSorting: true,
        size:260,
        cell: (props) => (
          <span className="">{props.getValue<string>()}</span>
        ),
      },
      { header: "Slug", accessorKey: "slug", enableSorting: true, size: 200 },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 120,
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
        header: "Created At",
        accessorKey: "created_at",
        enableSorting: true,
        size: 130,
        cell: (props) =>
          `${new Date(props.getValue<string>()).getDate()} ${new Date(props.getValue<string>()).toLocaleString("en-US", { month: "long" })}, 
          ${new Date(props.getValue<string>()).getFullYear()},
          ${new Date(props.getValue<string>()).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
      },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        size: 120,
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
            onClone={() => handleCloneBlog(props.row.original)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      blogStatusColor,
      openImageViewer,
      openEditDrawer,
      handleDeleteClick,
      handleCloneBlog,
    ]
  );

  // Cleanup for iconPreview URL
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
            <Link to='/task/task-list/create'>
                <Button
                  className="mr-2"
                  icon={<TbUser />}
                  clickFeedback={false}
                  customColorClass={({ active, unclickable }) =>
                      classNames(
                          'hover:text-gray-800 dark:hover:bg-gray-600 border-0 hover:ring-0',
                          active ? 'bg-gray-200' : 'bg-gray-100',
                          unclickable && 'opacity-50 cursor-not-allowed',
                          !active && !unclickable && 'hover:bg-gray-200',
                      )
                  }
                >Assigned to Task</Button>
              </Link>
              <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
                Add New
              </Button>
            </div>
          </div>
          <BlogsTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onImport={handleImportData}
            onClearFilters={onClearFilters}
          />
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
      />

      {/* Add/Edit Drawer */}
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
          submitButtonText: "Save Changes",
          submittingText: "Saving...",
        },
      ].map((drawer) => (
        <Drawer
          key={drawer.formId}
          title={drawer.title}
          isOpen={drawer.isOpen}
          onClose={drawer.closeFn}
          onRequestClose={drawer.closeFn}
          width={520}
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
            className="flex flex-col gap-4"
          >
            <FormItem
              label="Title"
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
            <FormItem
              label="Slug / URL (Optional)"
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
              label="Description (Optional)"
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
                  <Input
                    textArea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Enter main blog content..."
                    rows={5}
                  />
                )}
              />
            </FormItem>
            <FormItem
              label="Status"
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

          <FormItem style={{ fontWeight: "bold", color: "#000" }} label="Meta Options (Optional)"></FormItem>

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

            <FormItem
              label={`Icon${
                drawer.type === "edit" &&
                editingBlog?.icon_full_path &&
                iconPreview === editingBlog.icon_full_path
                  ? " (Current icon below. Select new to change)"
                  : " (Optional)"
              }`}
              invalid={!!drawer.methods.formState.errors.icon}
              errorMessage={
                drawer.methods.formState.errors.icon?.message as
                  | string
                  | undefined
              }
            >
              {/* Display current icon in EDIT mode IF it's the one being previewed (i.e., no new file selected yet) */}
              {drawer.type === "edit" &&
                iconPreview &&
                editingBlog?.icon_full_path === iconPreview && (
                  <div className="mb-2 flex items-center gap-2">
                    <img
                      src={iconPreview}
                      alt="Current Icon"
                      className="h-20 w-20 object-contain border rounded"
                    />
                    <Button
                      icon={<TbX />}
                      variant="twoTone"
                      size="xs"
                      color="red"
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
                    </Button>
                  </div>
                )}
              {/* Display new icon PREVIEW if a new file is selected OR if current icon was removed and old one is gone*/}
              {iconPreview &&
                (drawer.methods.watch("icon") instanceof File ||
                  (drawer.type === "edit" &&
                    editingBlog?.icon_full_path !== iconPreview)) && (
                  <img
                    src={iconPreview}
                    alt="Icon Preview"
                    className="mt-2 mb-2 h-24 w-auto object-contain border rounded"
                  />
                )}
              {!iconPreview &&
                drawer.type === "edit" &&
                editingBlog?.icon_full_path &&
                !drawer.methods.watch("icon") && (
                  <p className="text-xs text-gray-500 mb-1">
                    Current icon will be removed as "Remove Current Icon" was
                    clicked.
                  </p>
                )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleIconChange(e, drawer.methods)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </FormItem>
          </Form>
        </Drawer>
      ))}

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
           
            <div>
              {" "}
              <Button
                size="sm"
                className="mr-2"
                onClick={closeFilterDrawer}
                type="button"
              >
                Clear
              </Button>{" "}
              <Button
                size="sm"
                variant="solid"
                form="filterBlogForm"
                type="submit"
              >
                Apply
              </Button>{" "}
            </div>{" "}
          </div>
        }
      >
        {" "}
        <Form
          id="filterBlogForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          {" "}
          <FormItem label="Status">
            {" "}
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
            />{" "}
          </FormItem>{" "}
        </Form>{" "}
      </Drawer>

      <Drawer
        title="Import Blogs"
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onRequestClose={() => setImportDialogOpen(false)}
      >
        <div className="p-4">
          <p className="mb-4">
            Upload a CSV file to import blogs. Ensure the CSV format matches the
            export structure (see Export button).
          </p>
          <Input
            type="file"
            accept=".csv"
            className="mt-2"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                console.log(
                  "File selected for import:",
                  e.target.files[0].name
                );
                toast.push(
                  <Notification title="Import" type="info">
                    File selected. Import processing to be implemented.
                  </Notification>
                );
              }
            }}
          />
          <div className="text-right mt-6">
            <Button
              size="sm"
              variant="plain"
              onClick={() => setImportDialogOpen(false)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              onClick={() => {
                toast.push(
                  <Notification title="Import" type="info">
                    Import submission to be implemented.
                  </Notification>
                );
              }}
            >
              Start Import
            </Button>
          </div>
        </div>
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
          isProcessing ||
          (masterLoading === "idle" &&
            !!itemBeingDeleted &&
            blogToDelete?.id === itemBeingDeleted)
        }
      >
        <p>
          {" "}
          Are you sure you want to delete the blog "
          <strong>{blogToDelete?.title}</strong>"? This action cannot be undone.{" "}
        </p>
      </ConfirmDialog>

      <Dialog
        isOpen={isImageViewerOpen}
        onClose={closeImageViewer}
        onRequestClose={closeImageViewer}
        bodyOpenClassName="overflow-hidden"
        title="Blog Icon"
        footer={<Button onClick={closeImageViewer}>Close</Button>}
        width={600}
      >
        {imageToView ? (
          <img
            src={imageToView}
            alt="Blog Icon Full"
            className="max-w-full max-h-[80vh] mx-auto object-contain"
          />
        ) : (
          <p>No image to display.</p>
        )}
      </Dialog>
    </>
  );
};

export default Blogs;

// Helper for classNames
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
