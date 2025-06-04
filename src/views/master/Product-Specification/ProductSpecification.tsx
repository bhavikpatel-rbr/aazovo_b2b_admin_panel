// src/views/your-path/ProductSpecification.tsx

import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Avatar from "@/components/ui/Avatar";
import classNames from "classnames";

// UI Components
import AdaptiveCard from "@/components/shared/AdaptiveCard";
import Container from "@/components/shared/Container";
import DataTable from "@/components/shared/DataTable";
import Tooltip from "@/components/ui/Tooltip";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import toast from "@/components/ui/toast";
import ConfirmDialog from "@/components/shared/ConfirmDialog"; // Kept for export reason modal
// import StickyFooter from "@/components/shared/StickyFooter"; // Commented out
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  // TbTrash, // Commented out
  // TbChecks, // Commented out
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbPhoto,
  TbReload,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  // Row, // Commented out
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";
import { useAppDispatch } from "@/reduxtool/store";
import {
  getProductSpecificationsAction,
  addProductSpecificationAction,
  editProductSpecificationAction,
  // deleteProductSpecificationAction, // Commented out
  // deleteAllProductSpecificationsAction, // Commented out
  getCountriesAction,
  submitExportReasonAction, // Placeholder for future action
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// Type for Select options
type SelectOption = {
  value: string | number;
  label: string;
};

export type ProductSpecificationItem = {
  id: string | number;
  name: string;
  country_id: string | number;
  country_name?: string;
  country?: { id: string | number; name: string };
  note_details: string | null;
  flag_icon: string | null;
  icon_full_path?: string;
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
};

// --- Status Options ---
const statusOptions: SelectOption[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export type CountryOption = {
  value: string | number;
  label: string;
};

const productSpecificationFormSchema = z.object({
  flag_icon: z
    .union([z.instanceof(File), z.null()])
    .optional()
    .nullable(),
  name: z
    .string()
    .min(1, "Specification name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  country_id: z.string().min(1, "Country is required."),
  note_details: z.string().nullable().optional(),
  status: z.enum(["Active", "Inactive"], {
    required_error: "Status is required.",
  }),
});
type ProductSpecificationFormData = z.infer<
  typeof productSpecificationFormSchema
>;

const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCountryNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterStatus: z
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

const CSV_HEADERS = [
  "ID",
  "Specification Name",
  "Country Name",
  "Status",
  "Notes",
  "Flag Icon URL",
  "Updated By",
  "Updated Role",
  "Updated At",
];

type ProductSpecificationExportItem = Omit<
  ProductSpecificationItem,
  | "country_id"
  | "country"
  | "created_at"
  | "updated_at"
  | "flag_icon"
  | "icon_full_path"
> & {
  countryNameForExport?: string;
  status: "Active" | "Inactive";
  flagIconUrlForExport?: string | null;
  updated_at_formatted?: string;
};

const CSV_KEYS_EXPORT: (keyof ProductSpecificationExportItem)[] = [
  "id",
  "name",
  "countryNameForExport",
  "status",
  "note_details",
  "flagIconUrlForExport",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];

function exportProductSpecificationsToCsv(
  filename: string,
  rows: ProductSpecificationItem[]
) {
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info">
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const transformedRows: ProductSpecificationExportItem[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    countryNameForExport:
      row.country?.name || row.country_name || String(row.country_id) || "N/A",
    status: row.status,
    note_details: row.note_details || "N/A",
    flagIconUrlForExport: row.icon_full_path || row.flag_icon || "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at
      ? new Date(row.updated_at).toLocaleString()
      : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS.join(separator) +
    "\n" +
    transformedRows
      .map((row) => {
        return CSV_KEYS_EXPORT.map((k) => {
          let cell = row[k as keyof ProductSpecificationExportItem];
          if (cell === null || cell === undefined) {
            cell = "";
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
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

const ActionColumn = ({
  onEdit,
}: // onDelete, // Commented out
{
  onEdit: () => void;
  // onDelete: () => void; // Commented out
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
          onKeyDown={(e) => e.key === "Enter" && onEdit()}
        >
          <TbPencil />
        </div>
      </Tooltip>
      {/* <Tooltip title="Delete"> // Commented out
        <div
          className={classNames(
            iconButtonClass,
            hoverBgClass,
            "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          )}
          role="button"
          tabIndex={0}
          onClick={onDelete}
          onKeyDown={(e) => e.key === "Enter" && onDelete()}
        >
          <TbTrash />
        </div>
      </Tooltip> */}
    </div>
  );
};
ActionColumn.displayName = "ActionColumn";

type ItemSearchProps = {
  onInputChange: (value: string) => void;
  placeholder: string;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange, placeholder }, ref) => {
    return (
      <DebouceInput
        ref={ref}
        className="w-full"
        placeholder={placeholder}
        suffix={<TbSearch className="text-lg" />}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onInputChange(e.target.value)
        }
      />
    );
  }
);
ItemSearch.displayName = "ItemSearch";

const ItemTableTools = ({
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
        <ItemSearch
          onInputChange={onSearchChange}
          placeholder="Quick Search..."
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
        <Button
          title="Clear Filters"
          icon={<TbReload />}
          onClick={() => onClearFilters()}
        ></Button>
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
ItemTableTools.displayName = "ItemTableTools";

/* // --- ItemSelectedFooter Component (Commented out) ---
type ItemSelectedFooterProps = {
  selectedItems: ProductSpecificationItem[];
  onDeleteSelected: () => void;
  disabled?: boolean;
};
const ItemSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  disabled,
}: ItemSelectedFooterProps) => {
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
              <span>Item{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
              disabled={disabled}
              loading={disabled}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Specification${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        loading={disabled}
      >
        <p>
          Are you sure you want to delete the selected specification
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};
ItemSelectedFooter.displayName = "ItemSelectedFooter";
*/

const ProductSpecification = () => {
  const dispatch = useAppDispatch();

  const {
    ProductSpecificationsData = [],
    CountriesData = [],
    status: masterLoadingStatus = "idle",
    error: masterError = null,
  } = useSelector(masterSelector);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<ProductSpecificationItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false); // Commented out

  // const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false); // Commented out
  // const [itemToDelete, setItemToDelete] = useState<ProductSpecificationItem | null>(null); // Commented out

  const [addFormFlagIconPreviewUrl, setAddFormFlagIconPreviewUrl] = useState<
    string | null
  >(null);
  const [editFormFlagIconPreviewUrl, setEditFormFlagIconPreviewUrl] = useState<
    string | null
  >(null);

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] =
    useState(false);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterCountryNames: [],
    filterStatus: [],
  });
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  // const [selectedItems, setSelectedItems] = useState<ProductSpecificationItem[]>([]); // Commented out
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);

  useEffect(() => {
    return () => {
      if (addFormFlagIconPreviewUrl)
        URL.revokeObjectURL(addFormFlagIconPreviewUrl);
      if (editFormFlagIconPreviewUrl)
        URL.revokeObjectURL(editFormFlagIconPreviewUrl);
    };
  }, [addFormFlagIconPreviewUrl, editFormFlagIconPreviewUrl]);

  useEffect(() => {
    dispatch(getProductSpecificationsAction());
    dispatch(getCountriesAction());
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(CountriesData)) {
      const options = CountriesData.map((country: any) => ({
        value: String(country.id),
        label: country.name,
      }));
      setCountryOptions(options);
    }
  }, [CountriesData]);

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

  const defaultFormValues: ProductSpecificationFormData = useMemo(
    () => ({
      flag_icon: null,
      name: "",
      country_id: countryOptions[0]?.value || "",
      note_details: "",
      status: "Active",
    }),
    [countryOptions]
  );

  const addFormMethods = useForm<ProductSpecificationFormData>({
    resolver: zodResolver(productSpecificationFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<ProductSpecificationFormData>({
    resolver: zodResolver(productSpecificationFormSchema),
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

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const openAddDrawer = useCallback(() => {
    addFormMethods.reset(defaultFormValues);
    if (addFormFlagIconPreviewUrl)
      URL.revokeObjectURL(addFormFlagIconPreviewUrl);
    setAddFormFlagIconPreviewUrl(null);
    setIsAddDrawerOpen(true);
  }, [addFormMethods, addFormFlagIconPreviewUrl, defaultFormValues]);

  const closeAddDrawer = useCallback(() => {
    addFormMethods.reset(defaultFormValues);
    if (addFormFlagIconPreviewUrl)
      URL.revokeObjectURL(addFormFlagIconPreviewUrl);
    setAddFormFlagIconPreviewUrl(null);
    setIsAddDrawerOpen(false);
  }, [addFormMethods, addFormFlagIconPreviewUrl, defaultFormValues]);

  const onAddSubmit = async (data: ProductSpecificationFormData) => {
    setIsSubmitting(true);
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      const formKey = key as keyof ProductSpecificationFormData;
      if (formKey === "flag_icon") {
        if (value instanceof File) formData.append(formKey, value);
      } else if (formKey === "note_details") {
        formData.append(formKey, value === null ? "" : String(value));
      } else if (value !== null && value !== undefined) {
        formData.append(formKey, String(value));
      }
    }
    try {
      await dispatch(addProductSpecificationAction(formData)).unwrap();
      toast.push(
        <Notification
          title="Specification Added"
          type="success"
          duration={2000}
        >
          Specification "{data.name}" added.
        </Notification>
      );
      closeAddDrawer();
      dispatch(getProductSpecificationsAction());
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Could not add specification.";
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {message}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = useCallback(
    (item: ProductSpecificationItem) => {
      setEditingItem(item);
      editFormMethods.reset({
        flag_icon: null,
        name: item.name,
        country_id: String(item.country_id),
        note_details: item.note_details || "",
        status: item.status || "Active",
      });
      if (editFormFlagIconPreviewUrl)
        URL.revokeObjectURL(editFormFlagIconPreviewUrl);
      setEditFormFlagIconPreviewUrl(item.icon_full_path || null);
      setIsEditDrawerOpen(true);
    },
    [editFormMethods, editFormFlagIconPreviewUrl]
  );

  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    editFormMethods.reset(defaultFormValues);
    if (editFormFlagIconPreviewUrl)
      URL.revokeObjectURL(editFormFlagIconPreviewUrl);
    setEditFormFlagIconPreviewUrl(null);
    setIsEditDrawerOpen(false);
  }, [editFormMethods, editFormFlagIconPreviewUrl, defaultFormValues]);

  const onEditSubmit = async (data: ProductSpecificationFormData) => {
    if (!editingItem?.id) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Specification ID is missing.
        </Notification>
      );
      return;
    }
    if (
      !editFormMethods.formState.isDirty &&
      !(data.flag_icon instanceof File)
    ) {
      toast.push(
        <Notification title="No Changes" type="info" duration={2000}>
          No changes detected to save.
        </Notification>
      );
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("id", String(editingItem.id));
    for (const [key, value] of Object.entries(data)) {
      const formKey = key as keyof ProductSpecificationFormData;
      if (formKey === "flag_icon") {
        if (value instanceof File) formData.append(formKey, value);
      } else if (formKey === "note_details") {
        formData.append(formKey, value === null ? "" : String(value));
      } else if (value !== null && value !== undefined) {
        if (
          editFormMethods.formState.dirtyFields[formKey] ||
          (value !== "" && value !== null) ||
          formKey === "status"
        ) {
          formData.append(formKey, String(value));
        }
      }
    }
    let hasActualChanges = false;
    for (const key of formData.keys()) {
      if (key !== "_method" && key !== "id") {
        hasActualChanges = true;
        break;
      }
    }
    if (!hasActualChanges) {
      toast.push(
        <Notification title="No Changes" type="info" duration={2000}>
          No actual data changes to submit.
        </Notification>
      );
      setIsSubmitting(false);
      return;
    }
    try {
      await dispatch(
        editProductSpecificationAction({ id: editingItem.id, formData })
      ).unwrap();
      toast.push(
        <Notification
          title="Specification Updated"
          type="success"
          duration={2000}
        >
          Specification "{String(data.name || editingItem.name)}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getProductSpecificationsAction());
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Could not update specification.";
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {message}
        </Notification>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* // --- Delete Logic (Commented out) ---
  const handleDeleteClick = useCallback((item: ProductSpecificationItem) => {
    if (item.id === undefined || item.id === null) {
      toast.push(<Notification title="Error" type="danger">Cannot delete: Specification ID is missing.</Notification>);
      return;
    }
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = async () => {
    if (!itemToDelete?.id) {
      toast.push(<Notification title="Error" type="danger">Cannot delete: Specification ID is missing.</Notification>);
      setItemToDelete(null); setSingleDeleteConfirmOpen(false); return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteProductSpecificationAction({ id: itemToDelete.id })).unwrap();
      toast.push(<Notification title="Specification Deleted" type="success" duration={2000}>Specification "{itemToDelete.name}" deleted.</Notification>);
      // setSelectedItems((prev) => prev.filter((item) => item.id !== itemToDelete!.id)); // selectedItems commented
      dispatch(getProductSpecificationsAction());
    } catch (error: any) {
      const message = error?.message || error?.data?.message || "Could not delete specification.";
      toast.push(<Notification title="Failed to Delete" type="danger" duration={3000}>{message}</Notification>);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleDeleteSelected = async () => {
    // if (selectedItems.length === 0) { // selectedItems commented
    //   toast.push(<Notification title="No Selection" type="info">Please select items to delete.</Notification>);
    //   return;
    // }
    // setIsDeleting(true); // selectedItems commented
    // const validItemsToDelete = selectedItems.filter(item => item.id !== undefined && item.id !== null); // selectedItems commented
    // if (validItemsToDelete.length !== selectedItems.length) { // selectedItems commented
    //   toast.push(<Notification title="Deletion Warning" type="warning" duration={3000}>Some selected items had missing IDs and were skipped.</Notification>);
    // }
    // if (validItemsToDelete.length === 0) { // selectedItems commented
    //   toast.push(<Notification title="No Valid Items" type="info">No valid items to delete.</Notification>);
    //   setIsDeleting(false); return;
    // }
    // const idsToDelete = validItemsToDelete.map((item) => String(item.id)); // selectedItems commented
    try {
      // await dispatch(deleteAllProductSpecificationsAction({ ids: idsToDelete.join(",") })).unwrap(); // selectedItems commented
      // toast.push(<Notification title="Deletion Successful" type="success" duration={2000}>{validItemsToDelete.length} specification(s) deleted.</Notification>); // selectedItems commented
      // setSelectedItems([]); // selectedItems commented
      dispatch(getProductSpecificationsAction());
    } catch (error: any)      {
      // const message = error?.message || error?.data?.message || "Failed to delete selected specifications."; // selectedItems commented
      // toast.push(<Notification title="Deletion Failed" type="danger" duration={3000}>{message}</Notification>); // selectedItems commented
    } finally {
      // setIsDeleting(false); // selectedItems commented
    }
  };
  */ // --- End Delete Logic ---

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);

  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterNames: data.filterNames || [],
      filterCountryNames: data.filterCountryNames || [],
      filterStatus: data.filterStatus || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };

  const onClearFilters = useCallback(() => {
    const defaultFilters = {
      filterNames: [],
      filterCountryNames: [],
      filterStatus: [],
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 });
  }, [filterFormMethods, handleSetTableData]);

  const specNameFilterOptions = useMemo(() => {
    if (!Array.isArray(ProductSpecificationsData)) return [];
    const uniqueNames = new Set(
      ProductSpecificationsData.map((item) => item.name)
    );
    return Array.from(uniqueNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [ProductSpecificationsData]);

  const countryNameFilterOptions = useMemo(() => {
    if (!Array.isArray(ProductSpecificationsData)) return [];
    const uniqueCountryNames = new Set(
      ProductSpecificationsData.map(
        (item) => item.country?.name || item.country_name
      ).filter(Boolean) as string[]
    );
    return Array.from(uniqueCountryNames).map((name) => ({
      value: name,
      label: name,
    }));
  }, [ProductSpecificationsData]);

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: ProductSpecificationItem[] = Array.isArray(
      ProductSpecificationsData
    )
      ? ProductSpecificationsData.map((item) => ({
          ...item,
          country_name: item.country?.name || item.country_name,
          status: item.status || "Inactive",
        }))
      : [];
    let processedData: ProductSpecificationItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterNames?.length) {
      const names = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter(
        (item) => item.name && names.includes(item.name.toLowerCase())
      );
    }
    if (filterCriteria.filterCountryNames?.length) {
      const countries = filterCriteria.filterCountryNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter(
        (item) =>
          item.country_name &&
          countries.includes(item.country_name.toLowerCase())
      );
    }
    if (filterCriteria.filterStatus?.length) {
      const statuses = filterCriteria.filterStatus.map((opt) => opt.value);
      processedData = processedData.filter((item) =>
        statuses.includes(item.status)
      );
    }

    if (tableData.query) {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          (item.name && item.name.toLowerCase().includes(query)) ||
          (item.country_name &&
            item.country_name.toLowerCase().includes(query)) ||
          (item.status && item.status.toLowerCase().includes(query)) ||
          (item.updated_by_name &&
            item.updated_by_name.toLowerCase().includes(query)) ||
          (item.note_details && item.note_details.toLowerCase().includes(query))
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      processedData.length > 0 &&
      (Object.prototype.hasOwnProperty.call(processedData[0], key) ||
        key === "country.name")
    ) {
      processedData.sort((a, b) => {
        let aValue = a[key as keyof ProductSpecificationItem];
        let bValue = b[key as keyof ProductSpecificationItem];
        if (key === "country.name") {
          aValue = a.country?.name || (a.country_name as any);
          bValue = b.country?.name || (b.country_name as any);
        }
        if (key === "updated_at") {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return order === "asc" ? dateA - dateB : dateB - dateA;
        }
        if (aValue === null || aValue === undefined)
          return order === "asc" ? -1 : 1;
        if (bValue === null || bValue === undefined)
          return order === "asc" ? 1 : -1;
        if (
          key === "id" &&
          typeof aValue === "number" &&
          typeof bValue === "number"
        ) {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        return order === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
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
  }, [ProductSpecificationsData, tableData, filterCriteria]);

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
    const moduleName = "Product Specification";
    try {
      await dispatch(submitExportReasonAction({
        reason: data.reason,
        module: moduleName,
      })).unwrap();
    } catch (error: any) {
      setIsSubmittingExportReason(false);
      return;
    }

    const success = exportProductSpecificationsToCsv(
      "product_specifications.csv",
      allFilteredAndSortedData
    );

    if (success) {
      toast.push(
        <Notification title="Export Successful" type="success" duration={2000}>
          Data exported from {moduleName}.
        </Notification>
      );
    }

    setIsSubmittingExportReason(false);
    setIsExportReasonModalOpen(false);
  };


  const handlePaginationChange = useCallback(
    (page: number) => handleSetTableData({ pageIndex: page }),
    [handleSetTableData]
  );
  const handleSelectChange = useCallback(
    (value: number) => {
      handleSetTableData({
        pageSize: Number(value),
        pageIndex: 1,
      }); /* setSelectedItems([]); // Commented out */
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

  /* // --- Row Select Logic (Commented out) ---
  const handleRowSelect = useCallback((checked: boolean, row: ProductSpecificationItem) => {
    // setSelectedItems((prev) => {
    //   if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
    //   return prev.filter((item) => item.id !== row.id);
    // });
  }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<ProductSpecificationItem>[]) => {
    // const originals = currentRows.map((r) => r.original);
    // if (checked) {
    //   setSelectedItems((prev) => {
    //     const prevIds = new Set(prev.map((item) => item.id));
    //     const newToAdd = originals.filter((r) => r.id !== undefined && !prevIds.has(r.id));
    //     return [...prev, ...newToAdd];
    //   });
    // } else {
    //   const currentIds = new Set(originals.map((r) => r.id).filter((id) => id !== undefined));
    //   setSelectedItems((prev) => prev.filter((item) => item.id !== undefined && !currentIds.has(item.id)));
    // }
  }, []);
  */ // --- End Row Select Logic ---

  const columns: ColumnDef<ProductSpecificationItem>[] = useMemo(
    () => [
      // { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
      {
        header: "Flag Icon",
        accessorKey: "icon_full_path",
        enableSorting: false,
        size: 100,
        cell: (props) => {
          const icon_full_path = props.row.original.icon_full_path;
          return icon_full_path ? (
            <Avatar
              src={icon_full_path}
              size={30}
              shape="circle"
              icon={<TbPhoto />}
            />
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        header: "Specification Name",
        accessorKey: "name",
        enableSorting: true,
        size:200
      },
      {
        header: "Country Name",
        accessorKey: "country.name",
        enableSorting: true,
        size: 160, // Updated accessorKey for sorting
        cell: (props) => {
          const countryName =
            props.row.original.country?.name || props.row.original.country_name;
          return countryName ? (
            <span className="text-gray-800 dark:text-gray-100">
              {countryName}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        header: "Updated Info",
        accessorKey: "updated_at",
        enableSorting: true,
        meta: { HeaderClass: "text-red-500" },
        size: 160,
        cell: (props) => {
          const { updated_at, updated_by_name, updated_by_role } =
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
                {updated_by_name || "N/A"}
                {updated_by_role && (
                  <>
                    <br />
                    <b>{updated_by_role}</b>
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
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        size: 80,
        cell: (props) => {
          const status = props.row.original.status;
          return (
            <Tag
              className={classNames(
                "capitalize font-semibold whitespace-nowrap",
                status === "Active"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 border-emerald-300 dark:border-emerald-500"
                  : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500"
              )}
            >
              {status}
            </Tag>
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
            onEdit={() =>
              openEditDrawer(props.row.original)
            } /* onDelete={() => handleDeleteClick(props.row.original)} // Commented out */
          />
        ),
      },
    ],
    [openEditDrawer /*, handleDeleteClick // Commented out */]
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Product Spec</h5>
            {/* <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={masterLoadingStatus === "idle" || isSubmitting || isDeleting /* isDeleting commented out>Add New</Button> */}
            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={openAddDrawer}
              disabled={masterLoadingStatus === "idle" || isSubmitting}
            >
              Add New
            </Button>
          </div>
          <ItemTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleOpenExportReasonModal}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={pageData}
              // loading={masterLoadingStatus === "idle" || isSubmitting || isDeleting /* isDeleting commented out */}
              loading={masterLoadingStatus === "idle" || isSubmitting}
              pagingData={{
                total: total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              // selectable // Commented out
              // checkboxChecked={(row) => selectedItems.some((selected) => selected.id === row.id)} // Commented out
              onPaginationChange={handlePaginationChange}
              onSelectChange={handleSelectChange}
              onSort={handleSort}
              // onCheckBoxChange={handleRowSelect} // Commented out
              // onIndeterminateCheckBoxChange={handleAllRowSelect} // Commented out
            />
          </div>
        </AdaptiveCard>
      </Container>

      {/* <ItemSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} disabled={isDeleting || masterLoadingStatus === "idle"}/> // Commented out */}

      {[
        {
          formMethods: addFormMethods,
          onSubmit: onAddSubmit,
          isOpen: isAddDrawerOpen,
          closeFn: closeAddDrawer,
          title: "Add Product Spec",
          formId: "addProductSpecificationForm",
          submitText: "Adding...",
          saveText: "Save",
          previewUrl: addFormFlagIconPreviewUrl,
          setPreviewUrl: setAddFormFlagIconPreviewUrl,
          currentItem: null,
        },
        {
          formMethods: editFormMethods,
          onSubmit: onEditSubmit,
          isOpen: isEditDrawerOpen,
          closeFn: closeEditDrawer,
          title: "Edit Product Spec",
          formId: "editProductSpecificationForm",
          submitText: "Saving...",
          saveText: "Save",
          previewUrl: editFormFlagIconPreviewUrl,
          setPreviewUrl: setEditFormFlagIconPreviewUrl,
          currentItem: editingItem,
        },
      ].map((drawerProps) => (
        <Drawer
          key={drawerProps.formId}
          title={drawerProps.title}
          isOpen={drawerProps.isOpen}
          onClose={drawerProps.closeFn}
          onRequestClose={drawerProps.closeFn}
          width={520}
          footer={
            <div className="text-right w-full">
              <Button
                size="sm"
                className="mr-2"
                onClick={drawerProps.closeFn}
                disabled={isSubmitting}
                type="button"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="solid"
                form={drawerProps.formId}
                type="submit"
                loading={isSubmitting}
                disabled={
                  !drawerProps.formMethods.formState.isValid ||
                  isSubmitting ||
                  (drawerProps.formId === "editProductSpecificationForm" &&
                    !drawerProps.formMethods.formState.isDirty &&
                    !drawerProps.formMethods.getValues("flag_icon"))
                }
              >
                {isSubmitting ? drawerProps.submitText : drawerProps.saveText}
              </Button>
            </div>
          }
        >
          <Form
            id={drawerProps.formId}
            onSubmit={drawerProps.formMethods.handleSubmit(
              drawerProps.onSubmit as any
            )}
            className="flex flex-col gap-y-6 relative"
          >
            <FormItem
              label="Flag Icon (Image File)"
              invalid={!!drawerProps.formMethods.formState.errors.flag_icon}
              errorMessage={
                drawerProps.formMethods.formState.errors.flag_icon
                  ?.message as string
              }
            >
              {!drawerProps.previewUrl &&
                drawerProps.currentItem?.icon_full_path &&
                drawerProps.formId === "editProductSpecificationForm" && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Current Icon:
                    </p>
                    <Avatar
                      src={drawerProps.currentItem.icon_full_path}
                      size={60}
                      shape="circle"
                      icon={<TbPhoto />}
                    />
                  </div>
                )}
              {drawerProps.previewUrl && (
                <div className="mt-2 mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {drawerProps.formId === "editProductSpecificationForm"
                      ? "New Icon Preview:"
                      : "Icon Preview:"}
                  </p>
                  <Avatar
                    src={drawerProps.previewUrl}
                    size={60}
                    shape="circle"
                    icon={<TbPhoto />}
                  />
                </div>
              )}
              <Controller
                name="flag_icon"
                control={drawerProps.formMethods.control}
                render={({
                  field: { onChange: rhfOnChange, onBlur, name, ref: fieldRef },
                }) => (
                  <Input
                    type="file"
                    name={name}
                    ref={fieldRef}
                    onBlur={onBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0] || null;
                      rhfOnChange(file);
                      if (drawerProps.previewUrl)
                        URL.revokeObjectURL(drawerProps.previewUrl);
                      drawerProps.setPreviewUrl(
                        file ? URL.createObjectURL(file) : null
                      );
                      if (file) drawerProps.formMethods.trigger("flag_icon");
                    }}
                    accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
                  />
                )}
              />
              {drawerProps.formId === "editProductSpecificationForm" && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {drawerProps.currentItem?.icon_full_path
                    ? "Leave blank to keep current icon, or select a new file to replace it."
                    : "Upload an icon."}
                </p>
              )}
            </FormItem>
            <FormItem
              label="Spec Name"
              invalid={!!drawerProps.formMethods.formState.errors.name}
              errorMessage={
                drawerProps.formMethods.formState.errors.name?.message as
                  | string
                  | undefined
              }
              isRequired
            >
              <Controller
                name="name"
                control={drawerProps.formMethods.control}
                render={({ field }) => (
                  <Input {...field} placeholder="Enter spec name" />
                )}
              />
            </FormItem>
            {
              <div className="grid grid-cols-2 gap-2">
                  <FormItem
                    label="Country"
                    invalid={!!drawerProps.formMethods.formState.errors.country_id}
                    errorMessage={
                      drawerProps.formMethods.formState.errors.country_id?.message as
                        | string
                        | undefined
                    }
                    isRequired
                  >
                    <Controller
                      name="country_id"
                      control={drawerProps.formMethods.control}
                      render={({ field }) => (
                        <Select
                          placeholder="Select country"
                          options={countryOptions}
                          value={
                            countryOptions.find(
                              (opt) => String(opt.value) === String(field.value)
                            ) || null
                          }
                          onChange={(opt) => field.onChange(opt?.value)}
                          isLoading={
                            masterLoadingStatus === "idle" &&
                            countryOptions.length === 0
                          }
                        />
                      )}
                    />
                  </FormItem>
                  <FormItem
                    label="Status"
                    invalid={!!drawerProps.formMethods.formState.errors.status}
                    errorMessage={
                      drawerProps.formMethods.formState.errors.status?.message as
                        | string
                        | undefined
                    }
                    isRequired
                  >
                    <Controller
                      name="status"
                      control={drawerProps.formMethods.control}
                      render={({ field }) => (
                        <Select
                          placeholder="Select Status"
                          options={statusOptions}
                          value={
                            statusOptions.find(
                              (option) => option.value === field.value
                            ) || null
                          }
                          onChange={(option) =>
                            field.onChange(option ? option.value : "")
                          }
                        />
                      )}
                    />
                  </FormItem>
              </div>
            }
            
            <FormItem
              label="Notes (Optional)"
              invalid={!!drawerProps.formMethods.formState.errors.note_details}
              errorMessage={
                drawerProps.formMethods.formState.errors.note_details
                  ?.message as string | undefined
              }
            >
              <Controller
                name="note_details"
                control={drawerProps.formMethods.control}
                render={({ field }) => (
                  <Input
                    textArea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Enter any relevant notes"
                    rows={3}
                  />
                )}
              />
            </FormItem>
            {drawerProps.currentItem &&
              drawerProps.formId === "editProductSpecificationForm" && (
                <div className="bottom-[0px] w-full">
                  <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                    <div>
                      <b className="font-semibold text-primary">Latest Update:</b>
                      <p className="text-sm font-semibold mt-1">
                        {drawerProps.currentItem.updated_by_name || "N/A"}
                      </p>
                      <p>{drawerProps.currentItem.updated_by_role || "N/A"}</p>
                    </div>
                    <div>
                      <br/>
                      <span className="font-semibold">Created At:</span>{" "}
                      <span>
                        {drawerProps.currentItem.created_at
                          ? new Date(drawerProps.currentItem.created_at).toLocaleString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "N/A"}
                      </span>
                      <br />
                      <span className="font-semibold">Updated At:</span>{" "}
                      <span>
                        {drawerProps.currentItem.updated_at
                          ? new Date(drawerProps.currentItem.updated_at).toLocaleString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
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
              form="filterProductSpecificationsForm"
              type="submit"
            >
              Apply
            </Button>
          </div>
        }
      >
        <Form
          id="filterProductSpecificationsForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormItem label="Spec Name">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select spec names..."
                  options={specNameFilterOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Country Name">
            <Controller
              name="filterCountryNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select country names..."
                  options={countryNameFilterOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Status">
            <Controller
              name="filterStatus"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select status..."
                  options={statusOptions}
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

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
          id="exportReasonForm"
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

      {/* <ConfirmDialog // Commented out single delete confirm dialog
        isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Specification"
        onClose={() => {setSingleDeleteConfirmOpen(false); setItemToDelete(null);}}
        onRequestClose={() => {setSingleDeleteConfirmOpen(false); setItemToDelete(null);}}
        onCancel={() => {setSingleDeleteConfirmOpen(false); setItemToDelete(null);}}
        onConfirm={onConfirmSingleDelete} loading={isDeleting}
      >
        <p>Are you sure you want to delete the specification "<strong>{itemToDelete?.name}</strong>"? This action cannot be undone.</p>
      </ConfirmDialog> */}
    </>
  );
};

export default ProductSpecification;
