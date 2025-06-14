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

// Icons
import {
  TbPencil,
  // TbCopy, // Commented out
  // TbSwitchHorizontal, // Commented out
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  // TbCloudDownload, // Commented out
  TbPhoto,
  TbReload,
  TbUser,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useAppDispatch } from "@/reduxtool/store";

import {
  getSlidersAction,
  addSliderAction,
  editSliderAction,
  deleteSliderAction,
  deleteAllSlidersAction,
  submitExportReasonAction,
  getDomainsAction, // Placeholder for actual action
  // changeSliderStatusAction // TODO: Implement if needed
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

// --- Type Definitions ---
type ApiSliderItem = {
  id: number | string;
  title: string;
  subtitle?: string | null;
  button_text?: string | null;
  image: string | null;
  image_full_path: string | null;
  display_page: string;
  link?: string | null;
  source: "web" | "mobile" | "both";
  status: "Active" | "Inactive"; // Changed "Disabled" to "Inactive"
  domain_ids?: string | null;
  slider_color?: string | null;
  index_position?: number | null; // Added index_position
  created_at: string;
  updated_at: string;
  updated_by_name?: string; // Kept for fallback
  updated_by_role?: string; // Kept for fallback
  // ADDED: Correct type for the nested user object from the API
  updated_by_user?: {
    name: string;
    roles: { display_name: string }[];
  } | null;
};

export type SliderItem = {
  id: number | string;
  title: string;
  subtitle: string | null;
  buttonText: string | null;
  image: string | null;
  imageFullPath: string | null;
  displayPage: string;
  link: string | null;
  source: "web" | "mobile" | "both";
  status: "Active" | "Inactive"; // Changed to match API
  domainIds: any;
  sliderColor: string | null;
  indexPosition: number | null; // Added
  created_at: string;
  updated_at: string;
  updatedByName?: string; // Added
  updatedByRole?: string; // Added
};

// --- Zod Schema for Add/Edit Slider Form ---
const displayPageOptionsConst = [
  { value: "home", label: "Home Page" },
  { value: "products", label: "Products Page" },
  { value: "about", label: "About Us Page" },
  { value: "blog_listing", label: "Blog Listing" },
  { value: "contact", label: "Contact Page" },
  { value: "Electronic", label: "Electronic Page" },
  { value: "page_list", label: "Page List" },
];
const displayPageValues = displayPageOptionsConst.map((opt) => opt.value) as [
  string,
  ...string[]
];

const sourceOptionsConst = [
  { value: "web", label: "Web Only" },
  { value: "mobile", label: "Mobile Only" },
  { value: "both", label: "Web & Mobile (Both)" },
];
const sourceValues = sourceOptionsConst.map((opt) => opt.value) as [
  "web",
  "mobile",
  "both"
];

const sliderFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required.")
    .max(100, "Title cannot exceed 100 chars."),
  subtitle: z.string().max(250, "Subtitle too long").optional().nullable(),
  button_text: z.string().max(50, "Button text too long").optional().nullable(),
  image: z
    .union([z.instanceof(File), z.null()])
    .optional()
    .nullable(),
  display_page: z.enum(displayPageValues, {
    errorMap: () => ({ message: "Please select a display page." }),
  }),
  link: z
    .string()
    .url("Invalid URL. Must include http/https.")
    .optional()
    .nullable()
    .or(z.literal("")),
  source: z.enum(sourceValues, {
    errorMap: () => ({ message: "Please select a source." }),
  }),
  status: z.enum(["Active", "Inactive"], {
    // Changed "Disabled" to "Inactive"
    errorMap: () => ({ message: "Please select a status." }),
  }),
  domain_ids: z.number().optional().nullable(),
  slider_color: z
    .string()
    .regex(
      /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$|^[a-zA-Z]+$/,
      "Invalid color (hex/name), e.g., #FF0000 or red"
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  index_position: z.coerce
    .number()
    .int("Must be an integer")
    .min(0, "Cannot be negative")
    .max(5000, "Index Position cannot exceed 5 chars.")
    .nullable()
    .optional(), // Added
});
type SliderFormData = z.infer<typeof sliderFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterStatuses: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterDisplayPages: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterSources: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason for export is required.")
    .max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;

// --- Constants & Configurations ---
const SLIDER_IMAGE_BASE_URL =
  import.meta.env.VITE_API_URL_STORAGE ||
  "https://your-api-domain.com/storage/"; // Make sure this is correct

const apiStatusOptions: { value: "Active" | "Inactive"; label: string }[] = [
  // Changed "Disabled" to "Inactive"
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
const statusColor: Record<SliderItem["status"], string> = {
  // Use SliderItem["status"]
  Active:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  Inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

// --- CSV Exporter Utility ---
const CSV_HEADERS_SLIDER = [
  "ID",
  "Title",
  "Subtitle",
  "Button Text",
  "Image URL",
  "Display Page",
  "Link",
  "Source",
  "Status",
  "Index Position", // Added
  "Domain IDs",
  "Slider Color",
  "Created At",
  "Updated By", // Added
  "Updated Role", // Added
  "Updated At",
];
type SliderCsvItem = Omit<SliderItem, "image"> & { imageUrl: string | null };

function exportToCsvSlider(filename: string, rows: SliderItem[]) {
  if (!rows || !rows.length) {
    // Toast handled by caller
    return false;
  }
  const transformedRows: SliderCsvItem[] = rows.map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    buttonText: item.buttonText,
    imageUrl: item.imageFullPath,
    displayPage: item.displayPage,
    link: item.link,
    source: item.source,
    status: item.status,
    indexPosition: item.indexPosition, // Added
    domainIds: item.domainIds,
    sliderColor: item.sliderColor,
    created_at: new Date(item.created_at).toLocaleString(),
    updatedByName: item.updatedByName || "N/A", // Added
    updatedByRole: item.updatedByRole || "N/A", // Added
    updated_at: new Date(item.updated_at).toLocaleString(),
  }));
  const csvKeys: (keyof SliderCsvItem)[] = [
    "id",
    "title",
    "subtitle",
    "buttonText",
    "imageUrl",
    "displayPage",
    "link",
    "source",
    "status",
    "indexPosition", // Added
    "domainIds",
    "sliderColor",
    "created_at",
    "updatedByName", // Added
    "updatedByRole", // Added
    "updated_at",
  ];
  const separator = ",";
  const csvContent =
    CSV_HEADERS_SLIDER.join(separator) +
    "\n" +
    transformedRows
      .map((row) =>
        csvKeys
          .map((k) => {
            let cellValue = row[k];
            if (cellValue === null || cellValue === undefined) cellValue = "";
            else cellValue = String(cellValue).replace(/"/g, '""');
            if (String(cellValue).search(/("|,|\n)/g) >= 0)
              cellValue = `"${cellValue}"`;
            return cellValue;
          })
          .join(separator)
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
            "text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400"
          )}
          role="button"
          tabIndex={0}
          onClick={onEdit}
          onKeyDown={(e) => e.key === "Enter" && onEdit()}
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
            "text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
          )}
          role="button"
          tabIndex={0}
          onClick={onDelete}
          onKeyDown={(e) => e.key === "Enter" && onDelete()}
        >
          {" "}
          <TbTrash />{" "}
        </div>
      </Tooltip>
    </div>
  );
};

// --- SlidersSearch Component ---
type SlidersSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const SlidersSearch = React.forwardRef<HTMLInputElement, SlidersSearchProps>(
  ({ onInputChange }, ref) => (
    <DebouceInput
      ref={ref}
      className="w-full"
      placeholder="Quick Search..."
      suffix={<TbSearch className="text-lg" />}
      onChange={(e) => onInputChange(e.target.value)}
    />
  )
);
SlidersSearch.displayName = "SlidersSearch";

// --- SlidersTableTools Component ---
const SlidersTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
  onClearFilters,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onClearFilters: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow">
      <SlidersSearch onInputChange={onSearchChange} />
    </div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button
        title="Clear Filters"
        icon={<TbReload />}
        onClick={onClearFilters}
      ></Button>{" "}
      {/* Changed onClick */}
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

// --- SlidersTable Component ---
type SlidersTableProps = {
  columns: ColumnDef<SliderItem>[];
  data: SliderItem[];
  loading: boolean;
  pagingData: { total: number; pageIndex: number; pageSize: number };
  selectedItems: SliderItem[];
  onPaginationChange: (page: number) => void;
  onSelectChange: (value: number) => void;
  onSort: (sort: OnSortParam) => void;
  onRowSelect: (checked: boolean, row: SliderItem) => void;
  onAllRowSelect: (checked: boolean, rows: Row<SliderItem>[]) => void;
};
const SlidersTable = ({
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
}: SlidersTableProps) => (
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

// --- SlidersSelectedFooter Component ---
type SlidersSelectedFooterProps = {
  selectedItems: SliderItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
}; // Added isDeleting
const SlidersSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: SlidersSelectedFooterProps) => {
  // Added isDeleting
  const [deleteOpen, setDeleteOpen] = useState(false);
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
              <span>Slider{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={() => setDeleteOpen(true)}
              loading={isDeleting}
            >
              Delete Selected
            </Button>{" "}
            {/* Added loading */}
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Slider${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={() => setDeleteOpen(false)}
        onRequestClose={() => setDeleteOpen(false)}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDeleteSelected();
          setDeleteOpen(false);
        }}
        loading={isDeleting}
      >
        {" "}
        {/* Added loading */}
        <p>
          Are you sure you want to delete the selected slider
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Sliders Component ---
const Sliders = () => {
  const dispatch = useAppDispatch();
  const {
    slidersData: rawSlidersData = [],
    domainsData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Changed from isProcessing

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [sliderToDelete, setSliderToDelete] = useState<SliderItem | null>(null);

  // --- Export Reason Modal State ---
  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterStatuses: [],
    filterDisplayPages: [],
    filterSources: [],
  });

  const [addFormPreviewUrl, setAddFormPreviewUrl] = useState<string | null>(
    null
  );
  const [editFormPreviewUrl, setEditFormPreviewUrl] = useState<string | null>(
    null
  );
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageToView, setImageToView] = useState<string | null>(null);

  useEffect(() => {
    dispatch(getSlidersAction());
    dispatch(getDomainsAction());
  }, [dispatch]);
  
   const DomainsOptions = domainsData.length > 0 && domainsData?.map((sc: any) => ({
    value: sc.id,
    label: sc.domain,
  }));

  useEffect(() => {
    return () => {
      if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl);
      if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl);
    };
  }, [addFormPreviewUrl, editFormPreviewUrl]);

  const defaultSliderFormValues: SliderFormData = {
    title: "",
    subtitle: null,
    button_text: null,
    image: null,
    display_page: displayPageOptionsConst[0]?.value || "",
    link: null,
    source: sourceOptionsConst[0]?.value || "both",
    status: "Active",
    domain_ids: null,
    slider_color: "#FFFFFF",
    index_position: null, // Added
  };

  const addFormMethods = useForm<SliderFormData>({
    resolver: zodResolver(sliderFormSchema),
    defaultValues: defaultSliderFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<SliderFormData>({
    resolver: zodResolver(sliderFormSchema),
    defaultValues: defaultSliderFormValues,
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

  const mappedSliders: SliderItem[] = useMemo(() => {
    if (!Array.isArray(rawSlidersData)) return [];
    return rawSlidersData.map((apiItem: ApiSliderItem): SliderItem => {
      let fullPath: string | null = null;
      if (apiItem.image_full_path) {
        fullPath = apiItem.image_full_path;
      } else if (apiItem.image) {
        if (
          apiItem.image.startsWith("http://") ||
          apiItem.image.startsWith("https://")
        ) {
          fullPath = apiItem.image;
        } else {
          fullPath = `${SLIDER_IMAGE_BASE_URL}${
            apiItem.image.startsWith("/")
              ? apiItem.image.substring(1)
              : apiItem.image
          }`;
        }
      }
      return {
        id: apiItem.id,
        title: apiItem.title,
        subtitle: apiItem.subtitle || null,
        buttonText: apiItem.button_text || null,
        image: apiItem.image || null,
        imageFullPath: fullPath,
        displayPage: apiItem.display_page,
        link: apiItem.link || null,
        source: apiItem.source,
        status: apiItem.status, // No mapping needed, already "Active" | "Inactive"
        domainIds: Number(apiItem.domain_ids) || null,
        sliderColor: apiItem.slider_color || null,
        indexPosition:
    apiItem.index_position === undefined || apiItem.index_position === null
      ? null
      : Number(apiItem.index_position), // Handle undefined
        created_at: apiItem.created_at,
        updated_at: apiItem.updated_at,
        // CHANGED: Extract data from the nested object, with fallbacks to the old flat properties
        updatedByName:
          apiItem.updated_by_user?.name || apiItem.updated_by_name,
        updatedByRole:
          apiItem.updated_by_user?.roles?.[0]?.display_name ||
          apiItem.updated_by_role,
      };
    });
  }, [rawSlidersData]);

  const openAddDrawer = () => {
    addFormMethods.reset(defaultSliderFormValues);
    setAddFormPreviewUrl(null);
    setIsAddDrawerOpen(true);
  };
  const closeAddDrawer = () => {
    setIsAddDrawerOpen(false);
    if (addFormPreviewUrl) URL.revokeObjectURL(addFormPreviewUrl);
    setAddFormPreviewUrl(null);
  };

  const onAddSliderSubmit = async (data: SliderFormData) => {
    setIsSubmitting(true);

    if (data.index_position !== null && data.index_position !== undefined) {
      const isDuplicateIndex = mappedSliders.some(
        (slider) => slider.indexPosition === data.index_position
      );
      if (isDuplicateIndex) {
        addFormMethods.setError("index_position", {
          type: "manual",
          message: `Index position ${data.index_position} is already in use`,
        });
        toast.push(
          <Notification title="Validation Error" type="warning" duration={4000}>
            Index position {data.index_position} is already in use.
          </Notification>
        );
        setIsSubmitting(false);
        return; // Stop submission
      }
    }
    
    const formData = new FormData();
    (Object.keys(data) as Array<keyof SliderFormData>).forEach((key) => {
      const value = data[key];
      if (key === "image") {
        if (value instanceof File) formData.append(key, value);
      } else if (key === "index_position") {
        if (value !== null && value !== undefined && !isNaN(Number(value)))
          formData.append(key, String(value)); // Send only if valid number
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    try {
      await dispatch(addSliderAction(formData)).unwrap();
      toast.push(
        <Notification title="Slider Added" type="success" duration={2000}>
          Slider "{data.title}" added.
        </Notification>
      );
      closeAddDrawer();
      dispatch(getSlidersAction());
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Could not add slider.";
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {errorMessage}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = (slider: SliderItem) => {
    setEditingSlider(slider);
    editFormMethods.reset({
      title: slider.title,
      subtitle: slider.subtitle,
      button_text: slider.buttonText,
      image: null,
      display_page: slider.displayPage,
      link: slider.link,
      source: slider.source,
      status: slider.status, // Directly use "Active" | "Inactive"
      domain_ids: slider.domainIds,
      slider_color: slider.sliderColor,
      index_position:
        slider.indexPosition === null ? undefined : slider.indexPosition, // Handle null for number input
    });
    setEditFormPreviewUrl(null);
    setIsEditDrawerOpen(true);
  };
  const closeEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setEditingSlider(null);
    if (editFormPreviewUrl) URL.revokeObjectURL(editFormPreviewUrl);
    setEditFormPreviewUrl(null);
  };

  const onEditSliderSubmit = async (data: SliderFormData) => {
    if (!editingSlider?.id) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("_method", "PUT");
    (Object.keys(data) as Array<keyof SliderFormData>).forEach((key) => {
      const value = data[key];
      if (key === "image") {
        if (value instanceof File) formData.append(key, value);
      } else if (key === "index_position") {
        if (value !== null && value !== undefined && !isNaN(Number(value)))
          formData.append(key, String(value));
      } else {
        if (value === null) formData.append(key, "");
        else if (value !== undefined) formData.append(key, String(value));
      }
    });

    try {
      await dispatch(
        editSliderAction({ id: editingSlider.id, formData })
      ).unwrap();
      toast.push(
        <Notification title="Slider Updated" type="success" duration={2000}>
          Slider "{data.title}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getSlidersAction());
    } catch (error: any) {
      const responseData = error.response?.data;
      let errorMessage = "Could not update slider.";
      if (responseData) {
        if (responseData.message) errorMessage = responseData.message;
        if (responseData.errors)
          errorMessage += ` Details: ${Object.values(responseData.errors)
            .flat()
            .join(" ")}`;
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

  const handleDeleteClick = (slider: SliderItem) => {
    setSliderToDelete(slider);
    setSingleDeleteConfirmOpen(true);
  };
  const onConfirmSingleDelete = async () => {
    if (!sliderToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteSliderAction(sliderToDelete.id)).unwrap();
      toast.push(
        <Notification title="Slider Deleted" type="success" duration={2000}>
          Slider "{sliderToDelete.title}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== sliderToDelete!.id)
      );
      dispatch(getSlidersAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Could not delete slider."}
        </Notification>
      ); // Changed title
    } finally {
      setIsDeleting(false);
      setSliderToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const idsToDelete = selectedItems.map((item) => item.id);
    try {
      await dispatch(
        deleteAllSlidersAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification title="Sliders Deleted" type="success" duration={2000}>
          {selectedItems.length} slider(s) deleted.
        </Notification>
      );
      setSelectedItems([]);
      dispatch(getSlidersAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected sliders."}
        </Notification>
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterStatuses: data.filterStatuses || [],
      filterDisplayPages: data.filterDisplayPages || [],
      filterSources: data.filterSources || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = {
      filterStatuses: [],
      filterDisplayPages: [],
      filterSources: [],
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
    setIsFilterDrawerOpen(false);
  };

    const displayNameOptions = useMemo(() => {
      if (!Array.isArray(rawSlidersData)) return [];
      const uniqueNames = new Set(rawSlidersData.map((slider) => slider.display_page));
      return Array.from(uniqueNames).map((display_page) => ({
        value: display_page,
        label: display_page,
      }));
    }, [rawSlidersData]);

    const sourceNameOptions = useMemo(() => {
      if (!Array.isArray(rawSlidersData)) return [];
      const uniqueNames = new Set(rawSlidersData.map((slider) => slider.source));
      return Array.from(uniqueNames).map((source) => ({
        value: source,
        label: source,
      }));
    }, [rawSlidersData]);

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "asc", key: "indexPosition" },
    query: "",
  }); // Default sort by index
  const [selectedItems, setSelectedItems] = useState<SliderItem[]>([]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: SliderItem[] = cloneDeep(mappedSliders);
    if (filterCriteria.filterStatuses?.length)
      processedData = processedData.filter((item) =>
        filterCriteria.filterStatuses!.some((f) => f.value === item.status)
      );
    if (filterCriteria.filterDisplayPages?.length)
      processedData = processedData.filter((item) =>
        filterCriteria.filterDisplayPages!.some(
          (f) => f.value === item.displayPage
        )
      );
    if (filterCriteria.filterSources?.length)
      processedData = processedData.filter((item) =>
        filterCriteria.filterSources!.some((f) => f.value === item.source)
      );

    if (tableData.query) {
      const query = tableData.query.toLowerCase();
      processedData = processedData.filter(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          String(item.id).toLowerCase().includes(query) ||
          item.displayPage?.toLowerCase().includes(query) ||
          item.source?.toLowerCase().includes(query) ||
          (item.updatedByName?.toLowerCase() ?? "").includes(query) || // Search by updatedByName
          String(item.indexPosition ?? "").includes(query) // Search by index
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      [
        "id",
        "title",
        "displayPage",
        "source",
        "status",
        "indexPosition",
        "created_at",
        "updated_at",
        "updatedByName",
      ].includes(key)
    ) {
      // Added new sort keys
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
        } else if (key === "indexPosition") {
          aValue = a.indexPosition === null ? Infinity : a.indexPosition; // Treat null as largest for sorting
          bValue = b.indexPosition === null ? Infinity : b.indexPosition;
        } else {
          aValue = a[key as keyof SliderItem] ?? "";
          bValue = b[key as keyof SliderItem] ?? "";
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
  }, [mappedSliders, tableData, filterCriteria]);

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
    const moduleName = "Sliders";
      const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `sliders_export_${timestamp}.csv`;
    try {
      await dispatch(
        submitExportReasonAction({ reason: data.reason, module: moduleName ,file_name:fileName })
      ).unwrap();
      toast.push(
        <Notification title="Export Reason Submitted" type="success" />
      );
      exportToCsvSlider(fileName, allFilteredAndSortedData);
      Optional: toast.push(
        <Notification title="Data Exported" type="success">
          Sliders data exported.
        </Notification>
      );
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
    (checked: boolean, row: SliderItem) =>
      setSelectedItems((prev) =>
        checked
          ? prev.some((item) => item.id === row.id)
            ? prev
            : [...prev, row]
          : prev.filter((item) => item.id !== row.id)
      ),
    []
  );
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<SliderItem>[]) => {
      const originals = currentRows.map((r) => r.original);
      if (checked)
        setSelectedItems((prev) => {
          const prevIds = new Set(prev.map((item) => item.id));
          return [...prev, ...originals.filter((r) => !prevIds.has(r.id))];
        });
      else {
        const currentIds = new Set(originals.map((r) => r.id));
        setSelectedItems((prev) =>
          prev.filter((item) => !currentIds.has(item.id))
        );
      }
    },
    []
  );

  const openImageViewer = (imageUrl: string | null) => {
    if (imageUrl) {
      setImageToView(imageUrl);
      setImageViewerOpen(true);
    }
  };
  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageToView(null);
  };

  const columns: ColumnDef<SliderItem>[] = useMemo(
    () => [
      // { header: "ID", accessorKey: "id", enableSorting: true, size: 60, meta: { tdClass: "text-center", thClass: "text-center" } },
      {
        header: "Image",
        accessorKey: "imageFullPath",
        enableSorting: false,
        size: 60,
        cell: (props) => {
          const { imageFullPath, title } = props.row.original;
          return (
            <Avatar
              size={40}
              shape="circle"
              src={imageFullPath || undefined}
              icon={<TbPhoto />}
              className="cursor-pointer hover:ring-2 hover:ring-indigo-500"
              onClick={() => imageFullPath && openImageViewer(imageFullPath)}
            >
              {!imageFullPath && title ? title.charAt(0).toUpperCase() : ""}
            </Avatar>
          );
        },
      },
      {
        header: "Index",
        accessorKey: "indexPosition",
        enableSorting: true,
        size: 80,
        cell: (props) => props.row.original.indexPosition ?? "N/A",
      }, // Added Index column
      { header: "Title", accessorKey: "title", enableSorting: true, size: 220 },
      {
        header: "Display Page",
        accessorKey: "displayPage",
        enableSorting: true,
        size: 180,
        cell: (props) =>
          displayPageOptionsConst.find(
            (p) => p.value === props.row.original.displayPage
          )?.label || props.row.original.displayPage,
      },
      {
        header: "Source",
        accessorKey: "source",
        enableSorting: true,
        size: 140,
        cell: (props) =>
          sourceOptionsConst.find((s) => s.value === props.row.original.source)
            ?.label || props.row.original.source,
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 80,
        cell: (props) => (
          <Tag
            className={`${
              statusColor[props.row.original.status]
            } capitalize font-semibold border-0`}
          >
            {props.row.original.status}
          </Tag>
        ),
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        // meta: { HeaderClass: "text-red-500" },
        size: 200,
        cell: (props) => {
          const { updated_at, updatedByName, updatedByRole } =
            props.row.original;
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
                {updatedByName || "N/A"}
                {updatedByRole && (
                  <>
                    <br />
                    <b>{updatedByRole}</b>
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
        size: 80,
        meta: { HeaderClass: "text-center", cellClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ],
    [openImageViewer] // Removed mappedSliders as it's part of the outer scope's useMemo
  );

  const tableLoading =
    masterLoadingStatus === "loading" || isSubmitting || isDeleting;

  const renderFormFields = (
    formMethodsInstance: typeof addFormMethods | typeof editFormMethods,
    isEditMode: boolean,
    currentSlider?: SliderItem | null
  ) => (
    <>
      <FormItem
        label={
          <div>
            Title<span className="text-red-500"> * </span>
          </div>
        }
        invalid={!!formMethodsInstance.formState.errors.title}
        errorMessage={formMethodsInstance.formState.errors.title?.message}
        isRequired
      >
        <Controller
          name="title"
          control={formMethodsInstance.control}
          render={({ field }) => (
            <Input {...field} placeholder="Enter Slider Title" />
          )}
        />
      </FormItem>
      <FormItem
        label="Subtitle"
        invalid={!!formMethodsInstance.formState.errors.subtitle}
        errorMessage={formMethodsInstance.formState.errors.subtitle?.message}
      >
        <Controller
          name="subtitle"
          control={formMethodsInstance.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="Enter Subtitle"
            />
          )}
        />
      </FormItem>
      {
        <div className="grid grid-cols-2 gap-2">
          <FormItem
            label="Button Text"
            invalid={!!formMethodsInstance.formState.errors.button_text}
            errorMessage={
              formMethodsInstance.formState.errors.button_text?.message
            }
          >
            <Controller
              name="button_text"
              control={formMethodsInstance.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="e.g., Shop Now"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Index Position"
            invalid={!!formMethodsInstance.formState.errors.index_position}
            errorMessage={
              formMethodsInstance.formState.errors.index_position?.message
            }
          >
            <Controller
              name="index_position"
              control={formMethodsInstance.control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  placeholder="Enter position (e.g., 1)"
                  value={field.value === null ? "" : String(field.value)}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? null
                        : parseInt(e.target.value, 10)
                    )
                  }
                />
              )}
            />
          </FormItem>
        </div>
      }

      {isEditMode && currentSlider?.imageFullPath && !editFormPreviewUrl && (
        <FormItem label="Current Image">
          <Avatar
            className="w-[452px] h-[auto] border p-1 rounded-md"
            src={currentSlider.imageFullPath}
            shape="square"
            icon={<TbPhoto />}
          />
        </FormItem>
      )}
      <FormItem
        label={
          <div>
            {isEditMode ? "New Image" : "Image"}
            <span className="text-red-500"> * </span>
          </div>
        }
        invalid={!!formMethodsInstance.formState.errors.image}
        errorMessage={
          formMethodsInstance.formState.errors.image?.message as string
        }
        isRequired={!isEditMode}
      >
        <Controller
          name="image"
          control={formMethodsInstance.control}
          render={({ field: { onChange, onBlur, name, ref } }) => (
            <Input
              type="file"
              name={name}
              ref={ref}
              onBlur={onBlur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0] || null;
                onChange(file);
                const setPreviewUrl = isEditMode
                  ? setEditFormPreviewUrl
                  : setAddFormPreviewUrl;
                const currentPreviewUrl = isEditMode
                  ? editFormPreviewUrl
                  : addFormPreviewUrl;
                if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
                setPreviewUrl(file ? URL.createObjectURL(file) : null);
              }}
              accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
            />
          )}
        />
        {(isEditMode ? editFormPreviewUrl : addFormPreviewUrl) && (
          <div className="mt-2">
            <Avatar
              src={isEditMode ? editFormPreviewUrl! : addFormPreviewUrl!}
              className="w-[452px] h-[auto] border p-1 rounded-md"
              shape="square"
            />
            {isEditMode && (
              <p className="text-xs text-gray-500 mt-1">
                Preview of new image.
              </p>
            )}
          </div>
        )}
        {isEditMode && (
          <p className="text-xs text-gray-500 mt-1">
            Leave blank to keep current image. Selecting a new file will replace
            it.
          </p>
        )}
      </FormItem>
      {
        <div className="grid grid-cols-2 gap-2">
          <FormItem
            label={
              <div>
                Display Page<span className="text-red-500"> * </span>
              </div>
            }
            invalid={!!formMethodsInstance.formState.errors.display_page}
            errorMessage={
              formMethodsInstance.formState.errors.display_page?.message
            }
            isRequired
          >
            <Controller
              name="display_page"
              control={formMethodsInstance.control}
              render={({ field }) => (
                <UiSelect
                  options={displayPageOptionsConst}
                  value={displayPageOptionsConst.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(opt) =>
                    field.onChange(opt ? opt.value : undefined)
                  }
                  placeholder="Select display page"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Link"
            invalid={!!formMethodsInstance.formState.errors.link}
            errorMessage={formMethodsInstance.formState.errors.link?.message}
          >
            <Controller
              name="link"
              control={formMethodsInstance.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="url"
                  placeholder="https://example.com/target-page"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Source"
            invalid={!!formMethodsInstance.formState.errors.source}
            errorMessage={formMethodsInstance.formState.errors.source?.message}
            isRequired
          >
            <Controller
              name="source"
              control={formMethodsInstance.control}
              render={({ field }) => (
                <UiSelect
                  options={sourceOptionsConst}
                  value={sourceOptionsConst.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(opt) =>
                    field.onChange(opt ? opt.value : undefined)
                  }
                  placeholder="Select source"
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
            invalid={!!formMethodsInstance.formState.errors.status}
            errorMessage={formMethodsInstance.formState.errors.status?.message}
            isRequired
          >
            <Controller
              name="status"
              control={formMethodsInstance.control}
              render={({ field }) => (
                <UiSelect
                  options={apiStatusOptions}
                  value={apiStatusOptions.find(
                    (opt) => opt.value === field.value
                  )}
                  onChange={(opt) =>
                    field.onChange(opt ? opt.value : undefined)
                  }
                  placeholder="Select status"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Select Domain"
            invalid={!!formMethodsInstance.formState.errors.domain_ids}
            errorMessage={
              formMethodsInstance.formState.errors.domain_ids?.message
            }
          >
            <Controller
              name="domain_ids"
              control={formMethodsInstance.control}
              render={({ field }) => (
                  <UiSelect
                    options={DomainsOptions}
                    value={DomainsOptions.find(
                      (o :any) => o.value === field.value
                    )}
                    onChange={(opt) => field.onChange(opt?.value)}
                    isClearable
                  />
              )}
            />
          </FormItem>
          <FormItem
            label="Slider Color"
            invalid={!!formMethodsInstance.formState.errors.slider_color}
            errorMessage={
              formMethodsInstance.formState.errors.slider_color?.message
            }
          >
            <div className="flex items-center gap-2">
              <Controller
                name="slider_color"
                control={formMethodsInstance.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? "#FFFFFF"}
                    type="color"
                    className="w-12 h-10 p-1"
                  />
                )}
              />
              <Controller
                name="slider_color"
                control={formMethodsInstance.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="text"
                    placeholder="#RRGGBB or color name"
                    className="flex-grow"
                  />
                )}
              />
            </div>
          </FormItem>
        </div>
      }
    </>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Sliders</h5>
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
          <SlidersTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4 flex-grow overflow-y-auto">
            <SlidersTable
              columns={columns}
              data={pageData}
              loading={tableLoading}
              pagingData={{
                total,
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
      <SlidersSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        isDeleting={isDeleting}
      />

      <Drawer
        title="Add New Slider"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
        width={520}
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
              form="addSliderForm"
              type="submit"
              loading={isSubmitting}
              disabled={!addFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="addSliderForm"
          onSubmit={addFormMethods.handleSubmit(onAddSliderSubmit)}
          className="flex flex-col gap-4"
        >
          {renderFormFields(addFormMethods, false)}
        </Form>
      </Drawer>

      <Drawer
        title="Edit Slider"
        isOpen={isEditDrawerOpen}
        onClose={closeEditDrawer}
        onRequestClose={closeEditDrawer}
        width={520}
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
              form="editSliderForm"
              type="submit"
              loading={isSubmitting}
              disabled={!editFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="editSliderForm"
          onSubmit={editFormMethods.handleSubmit(onEditSliderSubmit)}
          className="flex flex-col gap-4 relative pb-28"
        >
          {" "}
          {/* Added relative pb-28 */}
          {renderFormFields(editFormMethods, true, editingSlider)}
          {editingSlider && (
            <div className="absolute bottom-0 w-full">
              <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                <div>
                  <b className="mt-3 mb-3 font-semibold text-primary">
                    Latest Update:
                  </b>
                  <br />
                  <p className="text-sm font-semibold">
                    {editingSlider.updatedByName || "N/A"}
                  </p>
                  <p>{editingSlider.updatedByRole || "N/A"}</p>
                </div>
                <div>
                  <br />
                  <span className="font-semibold">Created At:</span>{" "}
                  <span>
                    {editingSlider.created_at
                      ? `${new Date(editingSlider.created_at).getDate()} ${new Date(
                          editingSlider.created_at
                        ).toLocaleString("en-US", {
                          month: "short",
                        })} ${new Date(editingSlider.created_at).getFullYear()}, ${new Date(
                          editingSlider.created_at
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
                    {editingSlider.updated_at
                      ? `${new Date(editingSlider.updated_at).getDate()} ${new Date(
                          editingSlider.updated_at
                        ).toLocaleString("en-US", {
                          month: "short",
                        })} ${new Date(editingSlider.updated_at).getFullYear()}, ${new Date(
                          editingSlider.updated_at
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

      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        width={400} // Matched width
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={onClearFilters}
              type="button"
            >
              Clear
            </Button>{" "}
            {/* Applied onClearFilters */}
            <Button
              size="sm"
              variant="solid"
              form="filterSliderForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterSliderForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Status">
            <Controller
              name="filterStatuses"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select status..."
                  options={apiStatusOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Display Page">
            <Controller
              name="filterDisplayPages"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select display pages..."
                  options={displayNameOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Source">
            <Controller
              name="filterSources"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select sources..."
                  options={sourceNameOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Slider"
        onClose={() => {
          setSingleDeleteConfirmOpen(false);
          setSliderToDelete(null);
        }}
        onRequestClose={() => {
          setSingleDeleteConfirmOpen(false);
          setSliderToDelete(null);
        }}
        onCancel={() => {
          setSingleDeleteConfirmOpen(false);
          setSliderToDelete(null);
        }}
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the slider "
          <strong>{sliderToDelete?.title}</strong>"? This action cannot be
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

      {/* --- Export Reason Modal --- */}
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
          id="exportSlidersReasonForm" // Unique ID
          onSubmit={(e) => {
            e.preventDefault();
            exportReasonFormMethods.handleSubmit(
              handleConfirmExportWithReason
            )();
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
                <Input
                  textArea
                  {...field}
                  placeholder="Enter reason..."
                  rows={3}
                />
              )}
            />
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default Sliders;

// Helper utility
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}