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
import Select from "@/components/ui/Select";
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
  TbReload,
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
  getProductSpecificationsAction,
  addProductSpecificationAction,
  editProductSpecificationAction,
  deleteProductSpecificationAction,
  deleteAllProductSpecificationsAction,
  getCountriesAction,
} from "@/reduxtool/master/middleware";
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";

export type ProductSpecificationItem = {
  id: string | number;
  name: string;
  country_id: string | number;
  country_name: string;
  note_details: string | null;
  flag_icon: string | null;
  created_at?: string;
  updated_at?: string;
  icon_full_path?: string;
};

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
});
type FilterFormData = z.infer<typeof filterFormSchema>;

const CSV_HEADERS = [
  "ID",
  "Flag Icon URL",
  "Specification Name",
  "Country Name",
  "Notes",
];
const CSV_KEYS: (keyof ProductSpecificationItem)[] = [
  "id",
  "flag_icon",
  "name",
  "country_name",
  "note_details",
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
  const separator = ",";
  const csvContent =
    CSV_HEADERS.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return CSV_KEYS.map((k) => {
          let cell = row[k];
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
            "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
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
  onClearFilters: ()=> void;
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
        <Button title="Clear Filters" icon={<TbReload/>} onClick={()=>onClearFilters()}></Button>
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
  const [isDeleting, setIsDeleting] = useState(false);

  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] =
    useState<ProductSpecificationItem | null>(null);

  const [addFormFlagIconPreviewUrl, setAddFormFlagIconPreviewUrl] = useState<string | null>(null);
  const [editFormFlagIconPreviewUrl, setEditFormFlagIconPreviewUrl] = useState<string | null>(null);

  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterNames: [],
    filterCountryNames: [],
  });
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<
    ProductSpecificationItem[]
  >([]);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);

  useEffect(() => {
    return () => {
      if (addFormFlagIconPreviewUrl) URL.revokeObjectURL(addFormFlagIconPreviewUrl);
      if (editFormFlagIconPreviewUrl) URL.revokeObjectURL(editFormFlagIconPreviewUrl);
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

  const defaultFormValues: ProductSpecificationFormData = {
    flag_icon: null,
    name: "",
    country_id: "",
    note_details: "",
  };

  const addFormMethods = useForm<ProductSpecificationFormData>({
    resolver: zodResolver(productSpecificationFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });
  const editFormMethods = useForm<ProductSpecificationFormData>({
    resolver: zodResolver(productSpecificationFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange", // Important for isDirty to work correctly
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const openAddDrawer = useCallback(() => {
    addFormMethods.reset(defaultFormValues);
    if (addFormFlagIconPreviewUrl) URL.revokeObjectURL(addFormFlagIconPreviewUrl);
    setAddFormFlagIconPreviewUrl(null);
    setIsAddDrawerOpen(true);
  }, [addFormMethods, addFormFlagIconPreviewUrl]);

  const closeAddDrawer = useCallback(() => {
    addFormMethods.reset(defaultFormValues);
    if (addFormFlagIconPreviewUrl) URL.revokeObjectURL(addFormFlagIconPreviewUrl);
    setAddFormFlagIconPreviewUrl(null);
    setIsAddDrawerOpen(false);
  }, [addFormMethods, addFormFlagIconPreviewUrl]);

  const onAddSubmit = async (data: ProductSpecificationFormData) => {
    console.log("--- onAddSubmit ---");
    console.log("Data received by onAddSubmit (from RHF):", JSON.parse(JSON.stringify(data)));
    
    if (data.flag_icon instanceof File) {
      console.log("onAddSubmit: flag_icon is a File:", data.flag_icon.name, data.flag_icon.size);
    } else {
      console.log("onAddSubmit: flag_icon is NOT a File. Value:", data.flag_icon);
    }

    setIsSubmitting(true);
    const formData = new FormData();

    for (const [key, value] of Object.entries(data)) {
        const formKey = key as keyof ProductSpecificationFormData;
        if (formKey === "flag_icon") {
            if (value instanceof File) {
                formData.append(formKey, value);
                 console.log(`Appending File to FormData (ADD): ${formKey} = ${value.name}`);
            }
        } else if (formKey === 'note_details') {
            formData.append(formKey, value === null ? "" : String(value));
            console.log(`Appending to FormData (ADD): ${formKey} = ${value === null ? "" : String(value)}`);
        } else if (value !== null && value !== undefined) { // Append other fields if they have a value
            formData.append(formKey, String(value));
            console.log(`Appending to FormData (ADD): ${formKey} = ${String(value)}`);
        }
    }
    
    console.log("FormData about to be sent (ADD):");
    for (let pair of formData.entries()) {
        console.log(pair[0]+ ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}`: pair[1]));
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
      console.error("Add Specification Error:", error.response?.data || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = useCallback(
    (item: ProductSpecificationItem) => {
      setEditingItem(item);
      // Set form values for editing
      editFormMethods.reset({
        flag_icon: null, // File input should be reset; current icon shown separately
        name: item.name,
        country_id: String(item.country_id),
        note_details: item.note_details || "", // Ensure null becomes empty string for textarea if needed
      });
      if (editFormFlagIconPreviewUrl) URL.revokeObjectURL(editFormFlagIconPreviewUrl);
      setEditFormFlagIconPreviewUrl(null);
      setIsEditDrawerOpen(true);
    },
    [editFormMethods, editFormFlagIconPreviewUrl] // editFormMethods added
  );

  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    editFormMethods.reset(defaultFormValues); // Reset to default, not necessarily empty
    if (editFormFlagIconPreviewUrl) URL.revokeObjectURL(editFormFlagIconPreviewUrl);
    setEditFormFlagIconPreviewUrl(null);
    setIsEditDrawerOpen(false);
  }, [editFormMethods, editFormFlagIconPreviewUrl, defaultFormValues]);

  const onEditSubmit = async (data: ProductSpecificationFormData) => {
    console.log("--- onEditSubmit ---");
    console.log("Data received by onEditSubmit (from RHF):", JSON.parse(JSON.stringify(data)));
    
    if (data.flag_icon instanceof File) {
      console.log("onEditSubmit: flag_icon is a File:", data.flag_icon.name, data.flag_icon.size);
    } else {
      console.log("onEditSubmit: flag_icon is NOT a File. Value:", data.flag_icon);
    }

    if (!editingItem || editingItem.id === undefined || editingItem.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Specification ID is missing.
        </Notification>
      );
      return;
    }
    
    // Check if form is dirty (no fields changed) AND no new file was selected
    if (!editFormMethods.formState.isDirty && !(data.flag_icon instanceof File) ) {
        toast.push(
            <Notification title="No Changes" type="info" duration={2000}>
                No changes detected to save.
            </Notification>
        );
        // closeEditDrawer(); // Optionally close drawer if no changes
        return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("id", String(editingItem.id)); // Crucial: send ID for update

    for (const [key, value] of Object.entries(data)) {
        const formKey = key as keyof ProductSpecificationFormData;

        if (formKey === "flag_icon") {
            if (value instanceof File) { // Only append if a new file is selected
                formData.append(formKey, value);
                console.log(`Appending File to FormData (EDIT): ${formKey} = ${value.name}`);
            }
        } else if (formKey === 'note_details') {
            formData.append(formKey, value === null ? "" : String(value));
            console.log(`Appending to FormData (EDIT): ${formKey} = ${value === null ? "" : String(value)}`);
        } else if (value !== null && value !== undefined) { // Append other fields if they have a value
            // Check if the current value is different from the original editingItem's value
            // This ensures only truly changed fields (or fields that were empty and now have value) are sent
            // This part is tricky because `data` holds the current form state, not necessarily *changed* state for non-file inputs
            // RHF's `isDirty` helps, but for FormData, we often send all non-file fields that have values.
            // Let's send if the field is part of `editFormMethods.formState.dirtyFields` or if it has a value
            // and wasn't just the default `null` for flag_icon
            if (editFormMethods.formState.dirtyFields[formKey] || (value !== "" && value !== null)) {
                 formData.append(formKey, String(value));
                 console.log(`Appending to FormData (EDIT - dirty or has value): ${formKey} = ${String(value)}`);
            } else {
                 console.log(`Skipping field in FormData (EDIT - not dirty and no new value): ${formKey}`);
            }
        }
    }
    
    console.log("FormData about to be sent (EDIT for ID " + editingItem.id + "):");
    for (let pair of formData.entries()) {
        console.log(pair[0]+ ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}`: pair[1]));
    }

    // Check if formData has more than just _method and id
    let hasActualChanges = false;
    for (const key of formData.keys()) {
        if (key !== '_method' && key !== 'id') {
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
        // closeEditDrawer(); // Optionally close
        return;
    }


    try {
      await dispatch(editProductSpecificationAction({ id: editingItem.id, formData })).unwrap();
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
      console.error("Edit Specification Error:", error.response?.data || error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = useCallback((item: ProductSpecificationItem) => {
    if (item.id === undefined || item.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Specification ID is missing.
        </Notification>
      );
      return;
    }
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = async () => {
    if (!itemToDelete || itemToDelete.id === undefined || itemToDelete.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Specification ID is missing.
        </Notification>
      );
      setItemToDelete(null);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(
        deleteProductSpecificationAction({ id: itemToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Specification Deleted"
          type="success"
          duration={2000}
        >
          Specification "{itemToDelete.name}" deleted.
        </Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete!.id)
      );
      dispatch(getProductSpecificationsAction());
    } catch (error: any) {
      const message =
        error?.message ||
        error?.data?.message ||
        "Could not delete specification.";
      toast.push(
        <Notification title="Failed to Delete" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Delete Specification Error:", error);
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
          No valid items to delete.
        </Notification>
      );
      setIsDeleting(false);
      return;
    }

    const idsToDelete = validItemsToDelete.map((item) => String(item.id));
    try {
      await dispatch(
        deleteAllProductSpecificationsAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >
          {validItemsToDelete.length} specification(s) deleted.
        </Notification>
      );
      setSelectedItems([]);
      dispatch(getProductSpecificationsAction());
    } catch (error: any)      {
      const message =
        error?.message ||
        error?.data?.message ||
        "Failed to delete selected specifications.";
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Delete Selected Specifications Error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);

  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterNames: data.filterNames || [],
      filterCountryNames: data.filterCountryNames || [],
    });
    handleSetTableData({ pageIndex: 1 });
    closeFilterDrawer();
  };

  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterNames: [], filterCountryNames: [] };
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
    ProductSpecificationsData.map((item) => item.country?.name).filter(Boolean)
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
      ? ProductSpecificationsData
      : [];
    let processedData: ProductSpecificationItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterNames && filterCriteria.filterNames.length > 0) {
      const selectedNames = filterCriteria.filterNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter(
        (item) => item.name && selectedNames.includes(item.name.toLowerCase())
      );
    }
    if (
      filterCriteria.filterCountryNames &&
      filterCriteria.filterCountryNames.length > 0
    ) {
      const selectedCountries = filterCriteria.filterCountryNames.map((opt) =>
        opt.value.toLowerCase()
      );
      processedData = processedData.filter(
        (item) =>
          item.country_name &&
          selectedCountries.includes(item.country_name.toLowerCase())
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          String(item.id).toLowerCase().includes(query) ||
          (item.name && item.name.toLowerCase().includes(query)) ||
          (item.country_name &&
            item.country_name.toLowerCase().includes(query)) ||
          (item.flag_icon && item.flag_icon.toLowerCase().includes(query)) ||
          (item.note_details && item.note_details.toLowerCase().includes(query))
      );
    }

    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      processedData.length > 0 &&
      Object.prototype.hasOwnProperty.call(processedData[0], key)
    ) {
      processedData.sort((a, b) => {
        const aValue = a[key as keyof ProductSpecificationItem];
        const bValue = b[key as keyof ProductSpecificationItem];
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
  }, [ProductSpecificationsData, tableData, filterCriteria]);

  const handleExportData = () => {
    const success = exportProductSpecificationsToCsv(
      "product_specifications.csv",
      allFilteredAndSortedData
    );
    if (success) {
      toast.push(
        <Notification title="Export Successful" type="success" duration={2000}>
          Data exported.
        </Notification>
      );
    }
  };

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
    (checked: boolean, row: ProductSpecificationItem) => {
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
    (checked: boolean, currentRows: Row<ProductSpecificationItem>[]) => {
      const originals = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((prev) => {
          const prevIds = new Set(prev.map((item) => item.id));
          const newToAdd = originals.filter(
            (r) => r.id !== undefined && !prevIds.has(r.id)
          );
          return [...prev, ...newToAdd];
        });
      } else {
        const currentIds = new Set(
          originals.map((r) => r.id).filter((id) => id !== undefined)
        );
        setSelectedItems((prev) =>
          prev.filter(
            (item) => item.id !== undefined && !currentIds.has(item.id)
          )
        );
      }
    },
    []
  );

  const columns: ColumnDef<ProductSpecificationItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
      {
        header: "Flag Icon",
        accessorKey: "flag_icon",
        enableSorting: false,
        size: 100,
        cell: (props) => {
          const icon_full_path = props.row.original.icon_full_path;
          return icon_full_path ? (
            <Avatar src={icon_full_path} size={30} shape="circle" icon={<TbPhoto />} />
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      },
      {
        header: "Specification Name",
        accessorKey: "name",
        enableSorting: true,
      },
      {
        header: "Country Name",
        accessorKey: "country.name", // still needed for sorting/filtering
        enableSorting: true,
        size: 150,
        cell: (props) => {
          const countryName = props.row.original.country?.name;
          return countryName ? (
            <span className="text-gray-800">{countryName}</span>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
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
          />
        ),
      },
    ],
    [openEditDrawer, handleDeleteClick] // Added dependencies
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Product Spec</h5>
            <Button
              variant="solid"
              icon={<TbPlus />}
              onClick={openAddDrawer}
              disabled={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
              }
            >
              Add New
            </Button>
          </div>
          <ItemTableTools
            onSearchChange={handleSearchChange}
            onFilter={openFilterDrawer}
            onExport={handleExportData}
            onClearFilters={onClearFilters}
          />
          <div className="mt-4">
            <DataTable
              columns={columns}
              data={pageData}
              loading={
                masterLoadingStatus === "loading" || isSubmitting || isDeleting
              }
              pagingData={{
                total: total,
                pageIndex: tableData.pageIndex as number,
                pageSize: tableData.pageSize as number,
              }}
              selectable
              checkboxChecked={(row) =>
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

      <ItemSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        disabled={isDeleting || masterLoadingStatus === "loading"}
      />

      {/* Add Drawer */}
      <Drawer
        title="Add Product Spec"
        isOpen={isAddDrawerOpen}
        onClose={closeAddDrawer}
        onRequestClose={closeAddDrawer}
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
              form="addProductSpecificationForm"
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
          id="addProductSpecificationForm"
          onSubmit={addFormMethods.handleSubmit(onAddSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormItem
            label="Flag Icon (Image File)"
            invalid={!!addFormMethods.formState.errors.flag_icon}
            errorMessage={addFormMethods.formState.errors.flag_icon?.message as string}
          >
            <Controller
              name="flag_icon"
              control={addFormMethods.control}
              render={({ field: { onChange: rhfOnChange, onBlur, name, ref: fieldRef } }) => (
                <Input
                  type="file"
                  name={name}
                  ref={fieldRef}
                  onBlur={onBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
                    rhfOnChange(file); 
                    if (addFormFlagIconPreviewUrl) URL.revokeObjectURL(addFormFlagIconPreviewUrl);
                    setAddFormFlagIconPreviewUrl(file ? URL.createObjectURL(file) : null);
                  }}
                  accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
                />
              )}
            />
            {addFormFlagIconPreviewUrl && (
              <div className="mt-2">
                <Avatar src={addFormFlagIconPreviewUrl} size={60} shape="circle" icon={<TbPhoto />} />
              </div>
            )}
          </FormItem>
          <FormItem
            label="Spec Name"
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
            isRequired
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter spec name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Country"
            invalid={!!addFormMethods.formState.errors.country_id}
            errorMessage={addFormMethods.formState.errors.country_id?.message}
            isRequired
          >
            <Controller
              name="country_id"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select country"
                  options={countryOptions}
                  value={
                    countryOptions.find((opt) => opt.value == field.value) ||
                    null
                  }
                  onChange={(opt) => field.onChange(opt?.value)}
                  isLoading={
                    masterLoadingStatus === "loading" &&
                    countryOptions.length === 0
                  }
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Notes (Optional)"
            invalid={!!addFormMethods.formState.errors.note_details}
            errorMessage={addFormMethods.formState.errors.note_details?.message}
          >
            <Controller
              name="note_details"
              control={addFormMethods.control}
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
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Product Spec"
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
              form="editProductSpecificationForm"
              type="submit"
              loading={isSubmitting}
              disabled={
                // Disable if not valid OR submitting
                !editFormMethods.formState.isValid || 
                isSubmitting ||
                // Also disable if not dirty AND no new file is staged for upload
                (!editFormMethods.formState.isDirty && !editFormMethods.getValues('flag_icon'))
              }
            >
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="editProductSpecificationForm"
          onSubmit={editFormMethods.handleSubmit(onEditSubmit)}
          className="flex flex-col gap-y-6"
        >
           <FormItem
            label="Flag Icon (Image File)"
            invalid={!!editFormMethods.formState.errors.flag_icon}
            errorMessage={editFormMethods.formState.errors.flag_icon?.message as string}
          >
            {!editFormFlagIconPreviewUrl && editingItem?.icon_full_path && (
                <div className="mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Icon:</p>
                    <Avatar src={editingItem.icon_full_path} size={60} shape="circle" icon={<TbPhoto />} />
                </div>
            )}
            {editFormFlagIconPreviewUrl && (
              <div className="mt-2 mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">New Icon Preview:</p>
                <Avatar src={editFormFlagIconPreviewUrl} size={60} shape="circle" icon={<TbPhoto />} />
              </div>
            )}
            <Controller
              name="flag_icon"
              control={editFormMethods.control}
              render={({ field: { onChange: rhfOnChange, onBlur, name, ref: fieldRef } }) => ( 
                <Input
                  type="file"
                  name={name}
                  ref={fieldRef} 
                  onBlur={onBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
                    rhfOnChange(file); 
                    if (editFormFlagIconPreviewUrl) URL.revokeObjectURL(editFormFlagIconPreviewUrl);
                    setEditFormFlagIconPreviewUrl(file ? URL.createObjectURL(file) : null);
                    // Manually trigger validation or dirty state if needed after file change
                    if(file) editFormMethods.trigger('flag_icon'); // Or trigger for the whole form
                  }}
                  accept="image/png, image/jpeg, image/gif, image/svg+xml, image/webp"
                />
              )}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {editingItem?.flag_icon ? "Leave blank to keep current icon, or select a new file to replace it." : "Upload an icon."}
            </p>
          </FormItem>
          <FormItem
            label="Spec Name"
            invalid={!!editFormMethods.formState.errors.name}
            errorMessage={editFormMethods.formState.errors.name?.message}
            isRequired
          >
            <Controller
              name="name"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter spec name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Country"
            invalid={!!editFormMethods.formState.errors.country_id}
            errorMessage={editFormMethods.formState.errors.country_id?.message}
          >
            <Controller
              name="country_id"
              control={editFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select country"
                  options={countryOptions}
                  value={
                    countryOptions.find((opt) => opt.value == field.value) ||
                    null
                  }
                  onChange={(option) =>
                    field.onChange(option ? option.value : "")
                  }
                />
                
              )}
            />
          </FormItem>
          <FormItem
            label="Notes (Optional)"
            invalid={!!editFormMethods.formState.errors.note_details}
            errorMessage={
              editFormMethods.formState.errors.note_details?.message
            }
          >
            <Controller
              name="note_details"
              control={editFormMethods.control}
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
        </Form>
        <div className="relative w-full">
            <div className="flex justify-between gap-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
              <div className="">
                <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
                <p className="text-sm font-semibold">Tushar Joshi</p>
                <p>System Admin</p>
              </div>
              <div className="w-[210px]">
                <br />
                <span className="font-semibold">Created At:</span> <span>27 May, 2025, 2:00 PM</span><br />
                <span className="font-semibold">Updated At:</span> <span>27 May, 2025, 2:00 PM</span>
              </div>
            </div>
          </div>
      </Drawer>

      {/* Filter Drawer */}
      <Drawer
        title="Filters"
        isOpen={isFilterDrawerOpen}
        onClose={closeFilterDrawer}
        onRequestClose={closeFilterDrawer}
        footer={
          <div className="text-right w-full">
            <div>
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
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Spec"
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
        onConfirm={onConfirmSingleDelete}
        loading={isDeleting}
      >
        <p>
          Are you sure you want to delete the spec "
          <strong>{itemToDelete?.name}</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default ProductSpecification;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}