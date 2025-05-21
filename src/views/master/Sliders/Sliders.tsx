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
  TbCopy,
  TbSwitchHorizontal,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbCloudDownload,
  TbPhoto, // Generic image icon for sliders
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
// --- Redux Imports (Ensure these paths are correct and files exist) ---
import { useAppDispatch } from "@/reduxtool/store";

import {
  getSlidersAction,
  addSliderAction,
  editSliderAction,
  deleteSliderAction,
  deleteAllSlidersAction,
  // changeSliderStatusAction // TODO: Implement if needed
} from "@/reduxtool/master/middleware"; // Ensure these actions are in master middleware
import { masterSelector } from "@/reduxtool/master/masterSlice"; // Ensure this selector exposes slidersData
import { useSelector } from "react-redux";

// --- Type Definitions ---
type ApiSliderItem = {
  id: number | string;
  title: string; // Title is still part of the data model, just not displayed as a column
  subtitle?: string | null;
  button_text?: string | null;
  image: string | null;
  image_full_path: string | null;
  display_page: string;
  link?: string | null;
  source: "web" | "mobile" | "both";
  status: "Active" | "Inactive";
  domain_ids?: string | null;
  slider_color?: string | null;
  created_at: string;
  updated_at: string;
};

export type SliderStatus = "active" | "inactive";
export type SliderItem = {
  id: number | string;
  title: string; // Title is still part of the data model
  subtitle: string | null;
  buttonText: string | null;
  image: string | null;
  imageFullPath: string | null;
  displayPage: string;
  link: string | null;
  source: "web" | "mobile" | "both";
  status: SliderStatus;
  domainIds: string | null;
  sliderColor: string | null;
  createdAt: string;
  updatedAt: string;
};

// --- Zod Schema for Add/Edit Slider Form ---
const displayPageOptionsConst = [
  { value: "home", label: "Home Page" },
  { value: "products", label: "Products Page" },
  { value: "about", label: "About Us Page" },
  { value: "blog_listing", label: "Blog Listing" },
  { value: "contact", label: "Contact Page" },
  { value: "Electronic", label: "Electronic Page" },
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
    errorMap: () => ({ message: "Please select a status." }),
  }),
  domain_ids: z.string().optional().nullable(),
  slider_color: z
    .string()
    .regex(
      /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$|^[a-zA-Z]+$/,
      "Invalid color (hex/name), e.g., #FF0000 or red"
    )
    .optional()
    .nullable()
    .or(z.literal("")),
});
type SliderFormData = z.infer<typeof sliderFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  // filterTitles: z.array(z.object({ value: z.string(), label: z.string() })).optional(), // Removed
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

// --- Constants & Configurations ---
const SLIDER_IMAGE_BASE_URL =
  import.meta.env.VITE_API_URL_STORAGE ||
  "https://your-api-domain.com/storage/";

const uiStatusOptions: { value: SliderStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const apiStatusOptions: { value: "Active" | "Inactive"; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
const statusColor: Record<SliderStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100",
  inactive: "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100",
};

// --- CSV Exporter Utility ---
const CSV_HEADERS_SLIDER = [
  "ID",
  /*'Title',*/ "Subtitle",
  "Button Text",
  "Image URL",
  "Display Page",
  "Link",
  "Source",
  "Status",
  "Domain IDs",
  "Slider Color",
  "Created At",
  "Updated At",
]; // Removed 'Title'
type SliderCsvItem = Omit<SliderItem, "image" | "title"> & {
  imageUrl: string | null;
}; // Removed 'title'

function exportToCsvSlider(filename: string, rows: SliderItem[]) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: SliderCsvItem[] = rows.map((item) => ({
    id: item.id,
    /*title: item.title,*/ subtitle: item.subtitle,
    buttonText: item.buttonText, // Removed title
    imageUrl: item.imageFullPath,
    displayPage: item.displayPage,
    link: item.link,
    source: item.source,
    status: item.status,
    domainIds: item.domainIds,
    sliderColor: item.sliderColor,
    createdAt: new Date(item.createdAt).toLocaleString(),
    updatedAt: new Date(item.updatedAt).toLocaleString(),
  }));
  const csvKeys: (keyof SliderCsvItem)[] = [
    "id",
    /*'title',*/ "subtitle",
    "buttonText",
    "imageUrl",
    "displayPage",
    "link",
    "source",
    "status",
    "domainIds",
    "sliderColor",
    "createdAt",
    "updatedAt",
  ]; // Removed 'title'
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
  onClone,
  onChangeStatus,
  onDelete,
}: {
  onEdit: () => void;
  onClone: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
}) => {
  const iconButtonClass =
    "text-lg p-1.5 rounded-md transition-colors duration-150 ease-in-out cursor-pointer select-none";
  const hoverBgClass = "hover:bg-gray-100 dark:hover:bg-gray-700";
  return (
    <div className="flex items-center justify-center gap-2">
      <Tooltip title="Clone Slider">
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
      </Tooltip>
      <Tooltip title="Change Status">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400"
          )}
          role="button"
          tabIndex={0}
          onClick={onChangeStatus}
        >
          <TbSwitchHorizontal />
        </div>
      </Tooltip>
      <Tooltip title="Edit Slider">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
          )}
          role="button"
          tabIndex={0}
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="Delete Slider">
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
          )}
          role="button"
          tabIndex={0}
          onClick={onDelete}
        >
          <TbTrash />
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
      placeholder="Search sliders (title, id)..."
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
  onImport,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
  onImport: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <SlidersSearch onInputChange={onSearchChange} />
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
        icon={<TbCloudDownload />}
        onClick={onImport}
        className="w-full sm:w-auto"
      >
        Import
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
};
const SlidersSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
}: SlidersSelectedFooterProps) => {
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
            >
              Delete Selected
            </Button>
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
      >
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
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [sliderToDelete, setSliderToDelete] = useState<SliderItem | null>(null);

  const [statusChangeConfirmOpen, setStatusChangeConfirmOpen] = useState(false);
  const [sliderForStatusChange, setSliderForStatusChange] =
    useState<SliderItem | null>(null);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    // filterTitles: [], // Removed
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
  }, [dispatch]);

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
        status: apiItem.status === "Active" ? "active" : "inactive",
        domainIds: apiItem.domain_ids || null,
        sliderColor: apiItem.slider_color || null,
        createdAt: apiItem.created_at,
        updatedAt: apiItem.updated_at,
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
    const formData = new FormData();
    (Object.keys(data) as Array<keyof SliderFormData>).forEach((key) => {
      const value = data[key];
      if (key === "image") {
        if (value instanceof File) formData.append(key, value);
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
      status: slider.status === "active" ? "Active" : "Inactive",
      domain_ids: slider.domainIds,
      slider_color: slider.sliderColor,
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
    setIsProcessing(true);
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
        <Notification title={error} type="danger" duration={3000}>
          {error.message || "Could not delete slider."}
        </Notification>
      );
    } finally {
      setIsProcessing(false);
      setSliderToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);
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
      setIsProcessing(false);
    }
  };

  const openChangeStatusDialog = (slider: SliderItem) => {
    setSliderForStatusChange(slider);
    setStatusChangeConfirmOpen(true);
  };

  const onConfirmChangeStatus = async () => {
    if (!sliderForStatusChange) return;
    setIsProcessing(true);
    // const newApiStatus = sliderForStatusChange.status === 'active' ? 'Inactive' : 'Active';
    try {
      // TODO: Implement changeSliderStatusAction
      // await dispatch(changeSliderStatusAction({ id: sliderForStatusChange.id, status: newApiStatus })).unwrap();
      // toast.push(<Notification title="Status Updated" type="success">Status for "{sliderForStatusChange.title}" changed.</Notification>);
      // dispatch(getSlidersAction());
      toast.push(
        <Notification title="Status Update (Mock)" type="info" duration={2000}>
          Status update for "{sliderForStatusChange.title}" (functionality to be
          implemented).
        </Notification>
      );
    } catch (error: any) {
      toast.push(
        <Notification title="Status Update Failed" type="danger">
          {error.message || "Could not update status."}
        </Notification>
      );
    } finally {
      setStatusChangeConfirmOpen(false);
      setIsProcessing(false);
      setSliderForStatusChange(null);
    }
  };

  const handleClone = (slider: SliderItem) => {
    addFormMethods.reset({
      title: `${slider.title} (Copy)`,
      subtitle: slider.subtitle,
      button_text: slider.buttonText,
      image: null,
      display_page: slider.displayPage,
      link: slider.link,
      source: slider.source,
      status: slider.status === "active" ? "Active" : "Inactive",
      domain_ids: slider.domainIds,
      slider_color: slider.sliderColor,
    });
    setAddFormPreviewUrl(null);
    setIsAddDrawerOpen(true);
    toast.push(
      <Notification title="Clone Slider" type="info">
        Cloning "{slider.title}". Review, upload image, and save.
      </Notification>
    );
  };

  const openFilterDrawer = () => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  };
  const closeFilterDrawer = () => setIsFilterDrawerOpen(false);
  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      // filterTitles: data.filterTitles || [], // Removed
      filterStatuses: data.filterStatuses || [],
      filterDisplayPages: data.filterDisplayPages || [],
      filterSources: data.filterSources || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };
  const onClearFilters = () => {
    const defaultFilters = {
      /*filterTitles: [],*/ filterStatuses: [],
      filterDisplayPages: [],
      filterSources: [],
    }; // Removed
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  };

  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<SliderItem[]>([]);

  // const sliderTitleOptions = useMemo(() => // Removed as title filter dropdown is removed
  //     Array.from(new Set(mappedSliders.map(s => s.title))).sort().map(title => ({ value: title, label: title })), [mappedSliders]);

  // const sliderDisplayPageOptions = useMemo(() =>
  //     Array.from(new Set(mappedSliders.map(s => s.displayPage)))
  //         .map(pageValue => {
  //             const option = displayPageOptionsConst.find(opt => opt.value === pageValue);
  //             return { value: pageValue, label: option ? option.label : pageValue };
  //         })
  //         .sort((a,b) => a.label.localeCompare(b.label)),
  // [mappedSliders]);

  // const sliderSourceOptions = useMemo(() =>
  //     Array.from(new Set(mappedSliders.map(s => s.source)))
  //         .map(sourceValue => {
  //             const option = sourceOptionsConst.find(opt => opt.value === sourceValue);
  //             return { value: sourceValue, label: option ? option.label : sourceValue };
  //         })
  //         .sort((a,b) => a.label.localeCompare(b.label)),
  // [mappedSliders]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    let processedData: SliderItem[] = cloneDeep(mappedSliders);

    // if (filterCriteria.filterTitles?.length) processedData = processedData.filter(item => filterCriteria.filterTitles!.some(f => f.value === item.title)); // Removed
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
          item.title?.toLowerCase().includes(query) || // Keep title in global search
          String(item.id).toLowerCase().includes(query) ||
          item.displayPage?.toLowerCase().includes(query) ||
          item.source?.toLowerCase().includes(query)
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (order && key) {
      processedData.sort((a, b) => {
        let aValue = a[key as keyof SliderItem];
        let bValue = b[key as keyof SliderItem];
        if (key === "createdAt" || key === "updatedAt") {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          /* default sort */
        } else {
          aValue = String(aValue ?? "").toLowerCase();
          bValue = String(bValue ?? "").toLowerCase();
        }

        if (aValue === null || aValue === undefined) aValue = "" as any;
        if (bValue === null || bValue === undefined) bValue = "" as any;

        if (typeof aValue === "string" && typeof bValue === "string")
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        if (typeof aValue === "number" && typeof bValue === "number")
          return order === "asc" ? aValue - bValue : bValue - aValue;
        return 0;
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
  }, [mappedSliders, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportToCsvSlider(
      "sliders_export.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success">
          Data exported.
        </Notification>
      );
  };
  const handleImportData = () => {
    setImportDialogOpen(true);
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
      {
        header: "ID",
        accessorKey: "id",
        enableSorting: true,
        size: 80,
        meta: { tdClass: "text-center", thClass: "text-center" },
      },
      {
        header: "Image",
        accessorKey: "imageFullPath",
        enableSorting: false,
        size: 80,
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
      // { header: 'Title', accessorKey: 'title', enableSorting: true, size: 200 }, // Removed Title column
      {
        header: "Display Page",
        accessorKey: "displayPage",
        enableSorting: true,
        cell: (props) =>
          displayPageOptionsConst.find(
            (p) => p.value === props.row.original.displayPage
          )?.label || props.row.original.displayPage,
      },
      {
        header: "Source",
        accessorKey: "source",
        enableSorting: true,
        cell: (props) =>
          sourceOptionsConst.find((s) => s.value === props.row.original.source)
            ?.label || props.row.original.source,
      },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
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
        header: "Actions",
        id: "action",
        size: 160,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onClone={() => handleClone(props.row.original)}
            onChangeStatus={() => openChangeStatusDialog(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [mappedSliders, openImageViewer]
  );

  const tableLoading =
    masterLoadingStatus === "loading" || isSubmitting || isProcessing;

  const renderFormFields = (
    formMethods: typeof addFormMethods | typeof editFormMethods,
    isEditMode: boolean,
    currentSlider?: SliderItem | null
  ) => (
    <>
      <FormItem
        label="Title"
        invalid={!!formMethods.formState.errors.title}
        errorMessage={formMethods.formState.errors.title?.message}
        isRequired
      >
        <Controller
          name="title"
          control={formMethods.control}
          render={({ field }) => (
            <Input {...field} placeholder="Enter Slider Title" />
          )}
        />
      </FormItem>
      <FormItem
        label="Subtitle (Optional)"
        invalid={!!formMethods.formState.errors.subtitle}
        errorMessage={formMethods.formState.errors.subtitle?.message}
      >
        <Controller
          name="subtitle"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="Enter Subtitle"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Button Text (Optional)"
        invalid={!!formMethods.formState.errors.button_text}
        errorMessage={formMethods.formState.errors.button_text?.message}
      >
        <Controller
          name="button_text"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="e.g., Shop Now"
            />
          )}
        />
      </FormItem>

      {isEditMode && currentSlider?.imageFullPath && !editFormPreviewUrl && (
        <FormItem label="Current Image">
          <Avatar
            size={80}
            src={currentSlider.imageFullPath}
            shape="square"
            icon={<TbPhoto />}
          />
        </FormItem>
      )}
      <FormItem
        label={isEditMode ? "New Image (Optional)" : "Image"}
        invalid={!!formMethods.formState.errors.image}
        errorMessage={formMethods.formState.errors.image?.message as string}
        isRequired={!isEditMode}
      >
        <Controller
          name="image"
          control={formMethods.control}
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
              size={80}
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

      <FormItem
        label="Display Page"
        invalid={!!formMethods.formState.errors.display_page}
        errorMessage={formMethods.formState.errors.display_page?.message}
        isRequired
      >
        <Controller
          name="display_page"
          control={formMethods.control}
          render={({ field }) => (
            <UiSelect
              options={displayPageOptionsConst}
              value={displayPageOptionsConst.find(
                (opt) => opt.value === field.value
              )}
              onChange={(opt) => field.onChange(opt ? opt.value : undefined)}
              placeholder="Select display page"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Link (Optional, include http/https)"
        invalid={!!formMethods.formState.errors.link}
        errorMessage={formMethods.formState.errors.link?.message}
      >
        <Controller
          name="link"
          control={formMethods.control}
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
        invalid={!!formMethods.formState.errors.source}
        errorMessage={formMethods.formState.errors.source?.message}
        isRequired
      >
        <Controller
          name="source"
          control={formMethods.control}
          render={({ field }) => (
            <UiSelect
              options={sourceOptionsConst}
              value={sourceOptionsConst.find(
                (opt) => opt.value === field.value
              )}
              onChange={(opt) => field.onChange(opt ? opt.value : undefined)}
              placeholder="Select source"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Status"
        invalid={!!formMethods.formState.errors.status}
        errorMessage={formMethods.formState.errors.status?.message}
        isRequired
      >
        <Controller
          name="status"
          control={formMethods.control}
          render={({ field }) => (
            <UiSelect
              options={apiStatusOptions}
              value={apiStatusOptions.find((opt) => opt.value === field.value)}
              onChange={(opt) => field.onChange(opt ? opt.value : undefined)}
              placeholder="Select status"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Domain IDs (Optional, comma-separated)"
        invalid={!!formMethods.formState.errors.domain_ids}
        errorMessage={formMethods.formState.errors.domain_ids?.message}
      >
        <Controller
          name="domain_ids"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              value={field.value ?? ""}
              placeholder="e.g., 1,2,3"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Slider Color (Optional)"
        invalid={!!formMethods.formState.errors.slider_color}
        errorMessage={formMethods.formState.errors.slider_color?.message}
      >
        <div className="flex items-center gap-2">
          <Controller
            name="slider_color"
            control={formMethods.control}
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
            control={formMethods.control}
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
    </>
  );

  return (
    <>
      <Container className="h-full">
        <AdaptiveCard className="h-full" bodyClass="h-full flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Manage Sliders</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
              Add New Slider
            </Button>
          </div>
          <SlidersTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onImport={handleImportData}
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
      />

      <Drawer
        title="Add New Slider"
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
              form="addSliderForm"
              type="submit"
              loading={isSubmitting}
              disabled={!addFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Slider"}
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
              form="editSliderForm"
              type="submit"
              loading={isSubmitting}
              disabled={!editFormMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      >
        <Form
          id="editSliderForm"
          onSubmit={editFormMethods.handleSubmit(onEditSliderSubmit)}
          className="flex flex-col gap-4"
        >
          {renderFormFields(editFormMethods, true, editingSlider)}
        </Form>
      </Drawer>

      <Drawer
        title="Filter Sliders"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="flex justify-between w-full">
            <Button size="sm" onClick={onClearFilters} type="button">
              Clear All
            </Button>
            <div>
              <Button
                size="sm"
                className="mr-2"
                onClick={closeFilterDrawer}
                type="button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterSliderForm"
                type="submit"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        }
      >
        <Form
          id="filterSliderForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          {/* <FormItem label="Filter by Title(s)"> // Removed
                        <Controller name="filterTitles" control={filterFormMethods.control}
                            render={({ field }) => <UiSelect isMulti placeholder="Select titles..." options={sliderTitleOptions}
                                                        value={field.value || []} onChange={val => field.onChange(val || [])} />} />
                    </FormItem> */}
          <FormItem label="Filter by Status(es)">
            <Controller
              name="filterStatuses"
              control={filterFormMethods.control}
              render={({ field }) => (
                <UiSelect
                  isMulti
                  placeholder="Select statuses..."
                  options={uiStatusOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          {/* <FormItem label="Filter by Display Page(s)">
                        <Controller name="filterDisplayPages" control={filterFormMethods.control}
                            render={({ field }) => <UiSelect isMulti placeholder="Select display pages..." options={sliderDisplayPageOptions}
                                                        value={field.value || []} onChange={val => field.onChange(val || [])} />} />
                    </FormItem>
                     <FormItem label="Filter by Source(s)">
                        <Controller name="filterSources" control={filterFormMethods.control}
                            render={({ field }) => <UiSelect isMulti placeholder="Select sources..." options={sliderSourceOptions}
                                                        value={field.value || []} onChange={val => field.onChange(val || [])} />} />
                    </FormItem> */}
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
        loading={isProcessing}
      >
        <p>
          Are you sure you want to delete the slider "
          <strong>{sliderToDelete?.title}</strong>"? This action cannot be
          undone.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={statusChangeConfirmOpen}
        type="warning"
        title="Change Slider Status"
        onClose={() => {
          setStatusChangeConfirmOpen(false);
          setSliderForStatusChange(null);
        }}
        onRequestClose={() => {
          setStatusChangeConfirmOpen(false);
          setSliderForStatusChange(null);
        }}
        onCancel={() => {
          setStatusChangeConfirmOpen(false);
          setSliderForStatusChange(null);
        }}
        onConfirm={onConfirmChangeStatus}
        loading={isProcessing}
      >
        <p>
          Are you sure you want to change the status for "
          <strong>{sliderForStatusChange?.title}</strong>" to{" "}
          <strong>
            {sliderForStatusChange?.status === "active" ? "Inactive" : "Active"}
          </strong>
          ?
        </p>
      </ConfirmDialog>

      <Drawer
        title="Import Sliders"
        isOpen={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onRequestClose={() => setImportDialogOpen(false)}
      >
        <div className="p-4">
          <p className="mb-4">
            Upload a CSV file to import sliders. Ensure the CSV format matches
            the export structure.
          </p>
          <Input
            type="file"
            accept=".csv"
            className="mt-2"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                toast.push(
                  <Notification title="Import" type="info">
                    File selected: {e.target.files[0].name}. Import processing
                    to be implemented.
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
    </>
  );
};

export default Sliders;

// Helper utility
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
