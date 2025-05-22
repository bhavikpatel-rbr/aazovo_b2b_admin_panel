// src/views/your-path/NumberSystems.tsx

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
import DebouceInput from "@/components/shared/DebouceInput";
import Select from "@/components/ui/Select";
import { Drawer, Form, FormItem, Input, Tag } from "@/components/ui";

// Icons
import {
  TbPencil,
  TbDotsVertical,
  TbShare,
  TbEye,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbTrash,
} from "react-icons/tb";

// Types
import type {
  OnSortParam,
  ColumnDef,
  Row,
} from "@/components/shared/DataTable";
import type { TableQueries } from "@/@types/common";

// Redux
import { useAppDispatch } from "@/reduxtool/store";
import { shallowEqual, useSelector } from "react-redux";
import {
  getNumberSystemsAction,
  addNumberSystemAction,
  editNumberSystemAction,
  deleteNumberSystemAction,
  deleteAllNumberSystemsAction,
  getCountriesAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define Country Type ---
export type CountryListItem = {
  id: string | number;
  name: string;
};
export type CountryOption = { value: string; label: string };

// --- Define NumberSystemItem Type (Matches your API response for the LISTING) ---
// For Add/Edit, the form will have more fields, but the API might expect a subset or all.
export type NumberSystemItem = {
  id: string | number;
  name: string;
  prefix?: string;
  country_ids: string; // Comma-separated string
  customer_code_starting?: string; // Corresponds to kycStartNumber in original schema
  current_customer_code?: string; // Corresponds to kycCurrentNumber
  non_kyc_customer_code_starting?: string; // Corresponds to tempStartNumber
  non_kyc_current_customer_code?: string; // Corresponds to tempCurrentNumber
  created_at?: string;
  updated_at?: string;
};

// --- Zod Schema for Add/Edit Form (Restored Full Fields) ---
const numberSystemFormSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required.")
      .max(100, "Name cannot exceed 100 characters."),
    prefix: z
      .string()
      .max(10, "Prefix too long (max 10 chars).")
      .optional()
      .or(z.literal("")),
    // KYC Member Numbering
    kycStartNumber: z.coerce
      .number()
      .int()
      .min(0, "KYC Start Number must be non-negative."),
    kycCurrentNumber: z.coerce
      .number()
      .int()
      .min(0, "KYC Current Number must be non-negative."),
    // Temporary Member Numbering
    tempStartNumber: z.coerce
      .number()
      .int()
      .min(0, "Temp Start Number must be non-negative."),
    tempCurrentNumber: z.coerce
      .number()
      .int()
      .min(0, "Temp Current Number must be non-negative."),
    country_ids: z
      .array(z.string())
      .min(1, "At least one country must be selected."),
  })
  .superRefine((data, ctx) => {
    // Ensure current numbers are not less than start numbers
    if (data.kycCurrentNumber < data.kycStartNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "KYC Current Number cannot be less than KYC Start Number.",
        path: ["kycCurrentNumber"],
      });
    }
    if (data.tempCurrentNumber < data.tempStartNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Temp Current Number cannot be less than Temp Start Number.",
        path: ["tempCurrentNumber"],
      });
    }
  });
type NumberSystemFormData = z.infer<typeof numberSystemFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterCountryIds: z
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- CSV Exporter Utility ---
// For CSV, we'll export based on the primary display fields + API fields
const CSV_HEADERS_NS = [
  "ID",
  "Name",
  "Prefix",
  "Country IDs",
  "KYC Start",
  "KYC Current",
  "Temp Start",
  "Temp Current",
];
const CSV_KEYS_NS: (keyof NumberSystemItem)[] = [
  "id",
  "name",
  "prefix",
  "country_ids",
  "customer_code_starting",
  "current_customer_code",
  "non_kyc_customer_code_starting",
  "non_kyc_current_customer_code",
];

function exportNumberSystemsToCsv(filename: string, rows: NumberSystemItem[]) {
  // ... (CSV export logic - same as before, ensure keys match NumberSystemItem)
  if (!rows || !rows.length) {
    toast.push(
      <Notification title="No Data" type="info" duration={2000}>
        Nothing to export.
      </Notification>
    );
    return false;
  }
  const separator = ",";
  const csvContent =
    CSV_HEADERS_NS.join(separator) +
    "\n" +
    rows
      .map((row) =>
        CSV_KEYS_NS.map((k) => {
          let cell = row[k];
          if (k === "country_ids" && typeof cell === "string") {
            cell = `"${cell.replace(/"/g, '""')}"`;
          } else if (cell === null || cell === undefined) {
            cell = "";
          } else {
            cell = String(cell).replace(/"/g, '""');
          }
          if (String(cell).search(/("|,|\n)/g) >= 0 && k !== "country_ids") {
            cell = `"${cell}"`;
          }
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
    <Notification title="Export Failed" type="danger" duration={3000}>
      Browser does not support this feature.
    </Notification>
  );
  return false;
}

// --- ActionColumn (can be the more comprehensive one) ---
const ActionColumn = ({
  onEdit,
  onViewDetail,
  onChangeStatus,
}: {
  onEdit: () => void;
  onViewDetail: () => void;
  onChangeStatus: () => void;
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`}
          role="button"
          onClick={onEdit}
        >
          <TbPencil />
        </div>
      </Tooltip>
      <Tooltip title="View">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
          onClick={onViewDetail}
        >
          <TbEye />
        </div>
      </Tooltip>
      <Tooltip title="Delete">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400`}
          role="button"
        >
          <TbTrash />
        </div>
      </Tooltip>
      {/* <Tooltip title="Share">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400`}
          role="button"
        >
          <TbShare />
        </div>
      </Tooltip>
      <Tooltip title="More">
        <div
          className={`text-xl cursor-pointer select-none text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-400`}
          role="button"
        >
          <TbDotsVertical />
        </div>
      </Tooltip> */}
    </div>
  );
};
type ItemSearchProps = {
  onInputChange: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
};
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
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
ItemSearch.displayName = "ItemSearch";
type ItemTableToolsProps = {
  onSearchChange: (query: string) => void;
  onFilter: () => void;
  onExport: () => void;
};
const ItemTableTools = ({
  onSearchChange,
  onFilter,
  onExport,
}: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
    <div className="flex-grow">
      <ItemSearch onInputChange={onSearchChange} />
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
type NumberSystemsSelectedFooterProps = {
  selectedItems: NumberSystemItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
};
const NumberSystemsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: NumberSystemsSelectedFooterProps) => {
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
              <span>System{selectedItems.length > 1 ? "s" : ""} selected</span>
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
            </Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} System${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        <p>
          Are you sure you want to delete the selected number system
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

// --- Main Component: NumberSystems ---
const NumberSystems = () => {
  const dispatch = useAppDispatch();
  const {
    numberSystemsData = [],
    CountriesData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NumberSystemItem | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<NumberSystemItem | null>(
    null
  );
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterCountryIds: [],
  });
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<NumberSystemItem[]>([]);

  useEffect(() => {
    dispatch(getNumberSystemsAction());
    dispatch(getCountriesAction());
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(CountriesData) && CountriesData.length > 0) {
      const newOptions = CountriesData.map((country: CountryListItem) => ({
        value: String(country.id),
        label: country.name,
      }));
      setCountryOptions((prevOptions) => {
        if (JSON.stringify(prevOptions) !== JSON.stringify(newOptions))
          return newOptions;
        return prevOptions;
      });
    } else if (countryOptions.length > 0) {
      setCountryOptions([]);
    }
  }, [CountriesData, countryOptions.length]);

  const defaultFormValues: NumberSystemFormData = {
    name: "",
    prefix: "",
    kycStartNumber: 0,
    kycCurrentNumber: 0,
    tempStartNumber: 0,
    tempCurrentNumber: 0,
    country_ids: [],
  };

  const formMethods = useForm<NumberSystemFormData>({
    resolver: zodResolver(numberSystemFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const filterFormMethods = useForm<FilterFormData>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: filterCriteria,
  });

  const openAddDrawer = useCallback(() => {
    formMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(true);
  }, [formMethods, defaultFormValues]); // Added defaultFormValues
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: NumberSystemItem) => {
      setEditingItem(item);
      const selectedCountryIds = item.country_ids
        ? item.country_ids
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id)
        : [];
      formMethods.reset({
        name: item.name,
        prefix: item.prefix || "",
        kycStartNumber: Number(item.customer_code_starting) || 0,
        kycCurrentNumber: Number(item.current_customer_code) || 0,
        tempStartNumber: Number(item.non_kyc_customer_code_starting) || 0,
        tempCurrentNumber: Number(item.non_kyc_current_customer_code) || 0,
        country_ids: selectedCountryIds,
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);

  const onSubmitHandler = async (data: NumberSystemFormData) => {
    setIsSubmitting(true);
    // Map form data to API payload structure
    const apiPayload = {
      name: data.name,
      prefix: data.prefix || null,
      country_ids: data.country_ids.join(","),
      customer_code_starting: String(data.kycStartNumber),
      current_customer_code: String(data.kycCurrentNumber),
      non_kyc_customer_code_starting: String(data.tempStartNumber),
      non_kyc_current_customer_code: String(data.tempCurrentNumber),
    };

    try {
      if (editingItem) {
        await dispatch(
          editNumberSystemAction({ id: editingItem.id, ...apiPayload })
        ).unwrap();
        toast.push(
          <Notification
            title="Number System Updated"
            type="success"
            duration={2000}
          >
            System updated.
          </Notification>
        );
        closeEditDrawer();
      } else {
        await dispatch(addNumberSystemAction(apiPayload)).unwrap();
        toast.push(
          <Notification
            title="Number System Added"
            type="success"
            duration={2000}
          >
            New system added.
          </Notification>
        );
        closeAddDrawer();
      }
      dispatch(getNumberSystemsAction());
    } catch (error: any) {
      toast.push(
        <Notification
          title={editingItem ? "Update Failed" : "Add Failed"}
          type="danger"
          duration={3000}
        >
          {error?.message || "Operation failed."}
        </Notification>
      );
      console.error("Submit Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... (handleDeleteClick, onConfirmSingleDelete, handleDeleteSelected - no changes in logic)
  const handleDeleteClick = useCallback((item: NumberSystemItem) => {
    if (item.id === undefined || item.id === null) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: ID is missing.
        </Notification>
      );
      return;
    }
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete?.id) {
      return;
    }
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(
        deleteNumberSystemAction({ id: itemToDelete.id })
      ).unwrap();
      toast.push(
        <Notification
          title="Number System Deleted"
          type="success"
          duration={2000}
        >{`System "${itemToDelete.name}" deleted.`}</Notification>
      );
      setSelectedItems((prev) =>
        prev.filter((item) => item.id !== itemToDelete!.id)
      );
      dispatch(getNumberSystemsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {error.message || "Could not delete system."}
        </Notification>
      );
      console.error("Delete Error:", error);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) {
      return;
    }
    setIsDeleting(true);
    const validItems = selectedItems.filter(
      (item) => item.id !== undefined && item.id !== null
    );
    if (validItems.length === 0) {
      setIsDeleting(false);
      return;
    }
    const idsToDelete = validItems.map((item) => String(item.id));
    try {
      await dispatch(
        deleteAllNumberSystemsAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Deletion Successful"
          type="success"
          duration={2000}
        >{`${validItems.length} system(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getNumberSystemsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Deletion Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected systems."}
        </Notification>
      );
      console.error("Bulk Delete Error:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  // ... (Filter Handlers - no changes in logic)
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria({ filterCountryIds: data.filterCountryIds || [] });
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterCountryIds: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  }, [filterFormMethods]);

  // ... (useMemo for pageData, total, allFilteredAndSortedData - logic for filtering and sorting remains the same)
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: NumberSystemItem[] = Array.isArray(numberSystemsData)
      ? numberSystemsData
      : [];
    let processedData: NumberSystemItem[] = cloneDeep(sourceData);

    if (
      filterCriteria.filterCountryIds &&
      filterCriteria.filterCountryIds.length > 0
    ) {
      const selectedFilterCountryOptionValues =
        filterCriteria.filterCountryIds.map((opt) => opt.value);
      processedData = processedData.filter((item) => {
        if (!item.country_ids) return false;
        const itemCountryIds = item.country_ids
          .split(",")
          .map((id) => id.trim());
        return itemCountryIds.some((id) =>
          selectedFilterCountryOptionValues.includes(id)
        );
      });
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          (item.name?.toLowerCase() ?? "").includes(query) ||
          String(item.id).toLowerCase().includes(query) ||
          (item.prefix?.toLowerCase() ?? "").includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      ["id", "name", "prefix", "countriesCount"].includes(String(key))
    ) {
      processedData.sort((a, b) => {
        let aVal, bVal;
        if (key === "countriesCount") {
          aVal = a.country_ids ? a.country_ids.split(",").length : 0;
          bVal = b.country_ids ? b.country_ids.split(",").length : 0;
        } else {
          aVal = a[key as keyof NumberSystemItem];
          bVal = b[key as keyof NumberSystemItem];
        }
        if (typeof aVal === "number" && typeof bVal === "number") {
          return order === "asc" ? aVal - bVal : bVal - aVal;
        }
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
  }, [numberSystemsData, tableData, filterCriteria]);

  // ... (handleExportData, table interaction handlers - no changes in logic)
  const handleExportData = useCallback(() => {
    const success = exportNumberSystemsToCsv(
      "number_systems_export.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success" duration={2000}>
          Data exported.
        </Notification>
      );
  }, [allFilteredAndSortedData]);
  const handleSetTableData = useCallback((data: Partial<TableQueries>) => {
    setTableData((prev) => ({ ...prev, ...data }));
  }, []);
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
    (sort: OnSortParam) => {
      handleSetTableData({ sort: sort, pageIndex: 1 });
    },
    [handleSetTableData]
  );
  const handleSearchChange = useCallback(
    (query: string) => handleSetTableData({ query: query, pageIndex: 1 }),
    [handleSetTableData]
  );
  const handleRowSelect = useCallback(
    (checked: boolean, row: NumberSystemItem) => {
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
    (checked: boolean, currentRows: Row<NumberSystemItem>[]) => {
      const cPOR = currentRows.map((r) => r.original);
      if (checked) {
        setSelectedItems((pS) => {
          const pSIds = new Set(pS.map((i) => i.id));
          const nRTA = cPOR.filter((r) => !pSIds.has(r.id));
          return [...pS, ...nRTA];
        });
      } else {
        const cPRIds = new Set(cPOR.map((r) => r.id));
        setSelectedItems((pS) => pS.filter((i) => !cPRIds.has(i.id)));
      }
    },
    []
  );

  // Column Definitions (Listing fields: ID, Name, Countries - Prefix is in API, can be added here too)
  const columns: ColumnDef<NumberSystemItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
      {
        header: "Name",
        accessorKey: "name",
        enableSorting: true,
        size: 200,
        cell: (props) => (
          <span className="font-semibold">{props.row.original.name}</span>
        ),
      },
      // { header: 'Prefix', accessorKey: 'prefix', enableSorting: true, size: 100 }, // Uncomment to display prefix
      {
        header: "Countries",
        accessorKey: "country_ids",
        id: "countriesCount",
        enableSorting: true,
        cell: (props) => {
          const countryIdString = props.row.original.country_ids;
          if (!countryIdString) return <Tag>N/A</Tag>;
          const ids = countryIdString
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id);
          if (ids.length === 0) return <Tag>None</Tag>;

          const names = ids.map((id) => {
            const country = CountriesData.find(
              (c: CountryListItem) => String(c.id) === id
            );
            return country ? country.name : `ID:${id}`;
          });

          const displayLimit = 2;
          const displayedNames = names.slice(0, displayLimit);
          const remainingCount = names.length - displayLimit;

          return (
            // <Tooltip
            //   title={names.join(", ")}
            //   wrapperClassName="whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
            // >
            <div className="flex flex-wrap gap-1">
              {displayedNames.map((name, index) => (
                <Tag
                  key={`${name}-${index}`}
                  className="bg-gray-100 dark:bg-gray-600"
                >
                  {name}
                </Tag>
              ))}
              {remainingCount > 0 && (
                <Tag className="bg-gray-200 dark:bg-gray-500">
                  +{remainingCount} more
                </Tag>
              )}
            </div>
            // </Tooltip>
          );
        },
        size: 250,
      },
      {
        header: "Actions",
        id: "action",
        size: 200,
        meta: { HeaderClass: "text-center" },
        cell: (props) => (
          <ActionColumn
            onEdit={() => openEditDrawer(props.row.original)}
            onDelete={() => handleDeleteClick(props.row.original)}
          />
        ),
      },
    ],
    [CountriesData, openEditDrawer, handleDeleteClick]
  );

  // --- Render Form for Drawer (Restored Full Fields) ---
  const renderDrawerForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
      {" "}
      {/* Adjusted gap */}
      <FormItem
        label="System Name"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.name}
        errorMessage={formMethods.formState.errors.name?.message}
      >
        <Controller
          name="name"
          control={formMethods.control}
          render={({ field }) => (
            <Input {...field} placeholder="e.g., European KYC System" />
          )}
        />
      </FormItem>
      <FormItem
        label="Prefix"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.prefix}
        errorMessage={formMethods.formState.errors.prefix?.message}
      >
        <Controller
          name="prefix"
          control={formMethods.control}
          render={({ field }) => (
            <Input {...field} placeholder="e.g., EU (Optional)" />
          )}
        />
      </FormItem>
      <div className="md:col-span-2 border-t pt-3 mt-1">
        {" "}
        {/* Adjusted padding/margin */}
        <h6 className="text-sm font-medium mb-2">
          Numbering System For KYC Member
        </h6>
      </div>
      <FormItem
        label="Member ID Starting No."
        invalid={!!formMethods.formState.errors.kycStartNumber}
        errorMessage={formMethods.formState.errors.kycStartNumber?.message}
      >
        <Controller
          name="kycStartNumber"
          control={formMethods.control}
          render={({ field }) => (
            <Input {...field} type="number" placeholder="e.g., 10001" />
          )}
        />
      </FormItem>
      <FormItem
        label="Member ID Current No."
        invalid={!!formMethods.formState.errors.kycCurrentNumber}
        errorMessage={formMethods.formState.errors.kycCurrentNumber?.message}
      >
        <Controller
          name="kycCurrentNumber"
          control={formMethods.control}
          render={({ field }) => (
            <Input {...field} type="number" placeholder="e.g., 10500" />
          )}
        />
      </FormItem>
      <div className="md:col-span-2 border-t pt-3 mt-1">
        {" "}
        {/* Adjusted padding/margin */}
        <h6 className="text-sm font-medium mb-2">
          Numbering System For Temporary Member
        </h6>
      </div>
      <FormItem
        label="Member ID Starting No."
        invalid={!!formMethods.formState.errors.tempStartNumber}
        errorMessage={formMethods.formState.errors.tempStartNumber?.message}
      >
        <Controller
          name="tempStartNumber"
          control={formMethods.control}
          render={({ field }) => (
            <Input {...field} type="number" placeholder="e.g., 5001" />
          )}
        />
      </FormItem>
      <FormItem
        label="Member ID Current No."
        invalid={!!formMethods.formState.errors.tempCurrentNumber}
        errorMessage={formMethods.formState.errors.tempCurrentNumber?.message}
      >
        <Controller
          name="tempCurrentNumber"
          control={formMethods.control}
          render={({ field }) => (
            <Input {...field} type="number" placeholder="e.g., 5250" />
          )}
        />
      </FormItem>
      <FormItem
        label="Applicable Countries"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.country_ids}
        errorMessage={
          formMethods.formState.errors.country_ids?.message as string
        }
      >
        <Controller
          name="country_ids"
          control={formMethods.control}
          render={({ field }) => (
            <Select
              isMulti
              placeholder="Select countries..."
              options={countryOptions}
              value={countryOptions.filter((option) =>
                field.value?.includes(option.value)
              )}
              onChange={(selectedOpts) =>
                field.onChange(
                  selectedOpts ? selectedOpts.map((opt) => opt.value) : []
                )
              }
            />
          )}
        />
      </FormItem>
    </div>
  );

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">
              Numbering Systems
            </h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer}>
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
                total,
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

      <NumberSystemsSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        isDeleting={isDeleting}
      />

      <Drawer
        title={editingItem ? "Edit Number System" : "Add New Number System"}
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={700} // Increased width for more fields
        footer={
          <div className="text-right w-full">
            <Button
              size="sm"
              className="mr-2"
              onClick={editingItem ? closeEditDrawer : closeAddDrawer}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              form="numberSystemForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Adding..."
                : editingItem
                ? "Save Changes"
                : "Save"}
            </Button>
          </div>
        }
      >
        <Form
          id="numberSystemForm"
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-2"
        >
          {" "}
          {/* Reduced overall gap */}
          {renderDrawerForm()}
        </Form>
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
                onClick={closeFilterDrawer}
                type="button"
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="solid"
                form="filterNumberSystemForm"
                type="submit"
              >
                Apply
              </Button>
            </div>
          </div>
        }
      >
        <Form
          id="filterNumberSystemForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Countries">
            <Controller
              name="filterCountryIds"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select countries to filter by..."
                  options={countryOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      {/* ConfirmDialog */}
      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Number System"
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
          Are you sure you want to delete the number system "
          <strong>{itemToDelete?.name}</strong>"? This action cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default NumberSystems;

// Helper
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
