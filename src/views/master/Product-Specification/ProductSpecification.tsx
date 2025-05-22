import React, { useState, useMemo, useCallback, Ref, useEffect } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useForm, Controller } from "react-hook-form";
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
import DebouceInput from "@/components/shared/DebouceInput"; // Corrected typo
import Select from "@/components/ui/Select"; // For Country Dropdown
import { Drawer, Form, FormItem, Input } from "@/components/ui"; // Added Textarea for notes

// Icons
import {
  TbPencil,
  TbTrash,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
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
  // Actions for Product Specifications (ensure these are created in your middleware)
  getProductSpecificationsAction,
  addProductSpecificationAction,
  editProductSpecificationAction,
  deleteProductSpecificationAction,
  deleteAllProductSpecificationsAction,
  getCountriesAction, // Action to fetch countries for the dropdown
} from "@/reduxtool/master/middleware"; // Adjust path if necessary
import { useSelector } from "react-redux";
import { masterSelector } from "@/reduxtool/master/masterSlice";
import Textarea from "@/views/ui-components/forms/Input/Textarea";

// --- Define ProductSpecificationItem Type (based on API and display needs) ---
export type ProductSpecificationItem = {
  id: string | number;
  name: string; // Specification name
  country_id: string | number; // Will be used for edit form
  country_name: string; // For display in the table (assumed to be available)
  note_details: string | null;
  flag_icon: string | null;
  created_at?: string; // Optional, if not always needed for display
  updated_at?: string; // Optional
};

// --- Define Country Type (for the dropdown options) ---
export type CountryOption = {
  value: string | number; // Country ID
  label: string; // Country Name
};

// --- Zod Schema for Add/Edit Product Specification Form ---
const productSpecificationFormSchema = z.object({
  flag_icon: z.string().nullable().optional(), // Optional, can be empty
  name: z
    .string()
    .min(1, "Specification name is required.")
    .max(100, "Name cannot exceed 100 characters."),
  country_id: z.string().min(1, "Country is required."), // Country ID from dropdown
  note_details: z.string().nullable().optional(), // Optional
});
type ProductSpecificationFormData = z.infer<
  typeof productSpecificationFormSchema
>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  filterCountryNames: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
  // Add filter for flag_icon if needed
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
const CSV_HEADERS = [
  "ID",
  "Flag Icon",
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

// --- ActionColumn Component (Identical to Units) ---
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

// --- Search Component (Renamed for specificity) ---
type ItemSearchProps = {
  onInputChange: (value: string) => void;
  placeholder: string;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange, placeholder }, ref) => {
    return (
      <DebouceInput // Corrected typo
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

// --- TableTools Component (Renamed for specificity) ---
const ItemTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
      <div className="flex-grow">
        <ItemSearch
          onInputChange={onSearchChange}
          placeholder="Quick Search..."
        />
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
};
ItemTableTools.displayName = "ItemTableTools";

// --- SelectedFooter Component (Renamed for specificity) ---
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
        loading={disabled} // Pass disabled state
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

// --- Main ProductSpecification Component ---
const ProductSpecification = () => {
  const dispatch = useAppDispatch();

  // Destructure product specification data and country data from masterSelector
  const {
    ProductSpecificationsData = [], // Ensure this key exists in MasterState
    CountriesData = [], // Assumes CountriesData is populated by getCountriesAction
    status: masterLoadingStatus = "idle",
    error: masterError = null, // General error from masterSlice
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

  // Fetch initial data
  useEffect(() => {
    dispatch(getProductSpecificationsAction());
    dispatch(getCountriesAction()); // Fetch countries for the dropdown
  }, [dispatch]);

  // Populate country options for dropdown
  useEffect(() => {
    if (Array.isArray(CountriesData)) {
      // Assuming CountriesData is an array of { id: any, name: string }
      const options = CountriesData.map((country: any) => ({
        value: String(country.id), // Ensure value is string for Select component consistency
        label: country.name,
      }));
      setCountryOptions(options);
    }
  }, [CountriesData]);

  // Display general API errors
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

  const addFormMethods = useForm<ProductSpecificationFormData>({
    resolver: zodResolver(productSpecificationFormSchema),
    defaultValues: {
      flag_icon: "",
      name: "",
      country_id: "",
      note_details: "",
    },
    mode: "onChange",
  });
  const editFormMethods = useForm<ProductSpecificationFormData>({
    resolver: zodResolver(productSpecificationFormSchema),
    defaultValues: {
      flag_icon: "",
      name: "",
      country_id: "",
      note_details: "",
    },
    mode: "onChange",
  });
  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria, // Initialize with current filter criteria
  });

  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);

  const openAddDrawer = useCallback(() => {
    addFormMethods.reset({
      flag_icon: "",
      name: "",
      country_id: "",
      note_details: "",
    });
    setIsAddDrawerOpen(true);
  }, [addFormMethods]);

  const closeAddDrawer = useCallback(() => {
    addFormMethods.reset({
      flag_icon: "",
      name: "",
      country_id: "",
      note_details: "",
    });
    setIsAddDrawerOpen(false);
  }, [addFormMethods]);

  const onAddSubmit = async (data: ProductSpecificationFormData) => {
    setIsSubmitting(true);
    try {
      // The payload should match what addProductSpecificationAction expects
      await dispatch(addProductSpecificationAction(data)).unwrap();
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
      dispatch(getProductSpecificationsAction()); // Refresh list
    } catch (error: any) {
      const message =
        error?.message ||
        error?.data?.message ||
        "Could not add specification.";
      toast.push(
        <Notification title="Failed to Add" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Add Specification Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDrawer = useCallback(
    (item: ProductSpecificationItem) => {
      setEditingItem(item);
      editFormMethods.reset({
        flag_icon: item.flag_icon || "",
        name: item.name,
        country_id: String(item.country_id), // Ensure country_id is a string for Select
        note_details: item.note_details || "",
      });
      setIsEditDrawerOpen(true);
    },
    [editFormMethods]
  );

  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    editFormMethods.reset({
      flag_icon: "",
      name: "",
      country_id: "",
      note_details: "",
    });
    setIsEditDrawerOpen(false);
  }, [editFormMethods]);

  const onEditSubmit = async (data: ProductSpecificationFormData) => {
    if (
      !editingItem ||
      editingItem.id === undefined ||
      editingItem.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot edit: Specification ID is missing.
        </Notification>
      );
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    try {
      // Payload for edit action
      const payload = {
        id: editingItem.id,
        ...data, // Includes flag_icon, name, country_id, note_details
      };
      await dispatch(editProductSpecificationAction(payload)).unwrap();
      toast.push(
        <Notification
          title="Specification Updated"
          type="success"
          duration={2000}
        >
          Specification "{data.name}" updated.
        </Notification>
      );
      closeEditDrawer();
      dispatch(getProductSpecificationsAction()); // Refresh list
    } catch (error: any) {
      const message =
        error?.message ||
        error?.data?.message ||
        "Could not update specification.";
      toast.push(
        <Notification title="Failed to Update" type="danger" duration={3000}>
          {message}
        </Notification>
      );
      console.error("Edit Specification Error:", error);
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
    if (
      !itemToDelete ||
      itemToDelete.id === undefined ||
      itemToDelete.id === null
    ) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Specification ID is missing.
        </Notification>
      );
      setIsDeleting(false);
      setItemToDelete(null);
      setSingleDeleteConfirmOpen(false);
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      // deleteProductSpecificationAction might expect just an ID or the full item
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
      dispatch(getProductSpecificationsAction()); // Refresh list
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
      setSelectedItems([]); // Clear selection
      dispatch(getProductSpecificationsAction()); // Refresh list
    } catch (error: any) {
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
    filterFormMethods.reset(filterCriteria); // Reset form with current criteria
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);

  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const onApplyFiltersSubmit = (data: FilterFormData) => {
    setFilterCriteria({
      filterNames: data.filterNames || [],
      filterCountryNames: data.filterCountryNames || [],
    });
    handleSetTableData({ pageIndex: 1 }); // Reset to first page on filter change
    closeFilterDrawer();
  };

  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterNames: [], filterCountryNames: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    handleSetTableData({ pageIndex: 1 }); // Reset to first page
  }, [filterFormMethods, handleSetTableData]); // Added handleSetTableData to dependencies

  // Memoized options for filter dropdowns
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
    // This should ideally use the fetched CountriesData if you want to filter by all possible countries
    // For now, using distinct country names from the ProductSpecificationsData
    if (!Array.isArray(ProductSpecificationsData)) return [];
    const uniqueCountryNames = new Set(
      ProductSpecificationsData.map((item) => item.country_name)
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

    // Apply filters
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

    // Apply search query
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

    // Apply sorting
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      processedData.length > 0 &&
      processedData[0].hasOwnProperty(key)
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
        enableSorting: true, // Or false if it's just a display string/URL
        size: 120,
        cell: (props) => (
          // If flag_icon is a URL: <img src={props.row.original.flag_icon} alt="flag" width="20" />
          // If it's a class for an icon font: <i className={props.row.original.flag_icon}></i>
          // For now, just display as text:
          <span className="truncate">
            {props.row.original.flag_icon || "-"}
          </span>
        ),
      },
      {
        header: "Specification Name",
        accessorKey: "name",
        enableSorting: true,
      },
      {
        header: "Country Name",
        accessorKey: "country_name",
        enableSorting: true,
      },
      // { header: 'Notes', accessorKey: 'note_details', enableSorting: false, size: 200, cell: props => <span className="truncate">{props.row.original.note_details || '-'}</span> },
      {
        header: "Actions",
        id: "action",
        meta: { HeaderClass: "text-center", cellClass: "text-center" }, // Corrected meta
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
  ); // Added dependencies

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Product Specifications</h5>
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

      <Drawer
        title="Add Product Specification"
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
            label="Flag Icon (URL or Class)"
            invalid={!!addFormMethods.formState.errors.flag_icon}
            errorMessage={addFormMethods.formState.errors.flag_icon?.message}
          >
            <Controller
              name="flag_icon"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="e.g., /icons/us.svg or fas fa-flag"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Specification Name"
            invalid={!!addFormMethods.formState.errors.name}
            errorMessage={addFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={addFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter specification name" />
              )}
            />
          </FormItem>
          <FormItem
            label="Country"
            invalid={!!addFormMethods.formState.errors.country_id}
            errorMessage={addFormMethods.formState.errors.country_id?.message}
          >
            <Controller
              name="country_id"
              control={addFormMethods.control}
              render={({ field }) => (
                <Select
                  placeholder="Select country"
                  options={countryOptions}
                  value={
                    countryOptions.find((opt) => opt.value === field.value) ||
                    null
                  }
                  onChange={(opt) => field.onChange(opt?.value)}
                  isLoading={
                    masterLoadingStatus === "loading" &&
                    countryOptions.length === 0
                  } // Show loading if countries are being fetched
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
                <Textarea
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

      <Drawer
        title="Edit Product Specification"
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
                !editFormMethods.formState.isValid ||
                isSubmitting ||
                !editFormMethods.formState.isDirty
              }
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
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
            label="Flag Icon (URL or Class)"
            invalid={!!editFormMethods.formState.errors.flag_icon}
            errorMessage={editFormMethods.formState.errors.flag_icon?.message}
          >
            <Controller
              name="flag_icon"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="e.g., /icons/us.svg or fas fa-flag"
                />
              )}
            />
          </FormItem>
          <FormItem
            label="Specification Name"
            invalid={!!editFormMethods.formState.errors.name}
            errorMessage={editFormMethods.formState.errors.name?.message}
          >
            <Controller
              name="name"
              control={editFormMethods.control}
              render={({ field }) => (
                <Input {...field} placeholder="Enter specification name" />
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
                    countryOptions.find((opt) => opt.value === field.value) ||
                    null
                  }
                  onChange={(opt) => field.onChange(opt?.value)}
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
                <Textarea
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
                onClick={closeFilterDrawer}
                type="button"
              >
                Cancel
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
          id="filterProductSpecificationsForm" // Corrected ID
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-y-6"
        >
          <FormItem label="Specification Name(s)">
            <Controller
              name="filterNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select specification names..."
                  options={specNameFilterOptions} // Use memoized options
                  value={field.value || []}
                  onChange={(selectedVal) => field.onChange(selectedVal || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Country Name(s)">
            <Controller
              name="filterCountryNames"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select country names..."
                  options={countryNameFilterOptions} // Use memoized options
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
        title="Delete Specification"
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
        loading={isDeleting} // Pass loading state
      >
        <p>
          Are you sure you want to delete the specification "
          <strong>{itemToDelete?.name}</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default ProductSpecification;

// Helper (Identical to Units)
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
