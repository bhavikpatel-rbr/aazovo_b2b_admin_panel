// src/views/your-path/DomainManagementListing.tsx

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
import Textarea from "@/views/ui-components/forms/Input/Textarea";

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbWorldWww,
  TbSettingsCog,
  TbDotsVertical,
  TbShare,
  TbEye,
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
  getDomainsAction,
  addDomainAction,
  editDomainAction,
  deleteDomainAction,
  deleteAllDomainsAction,
  getCountriesAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";

// --- Define Types ---
export type CountryListItem = { id: string | number; name: string };
export type CountryOption = { value: string; label: string };

export type DomainItem = {
  id: string | number;
  domain: string;
  country_ids: string; // Comma-separated string of country IDs from API
  prefix?: string;
  currency_id: string | number; // API returns currency_id
  analytics_script?: string | null;
  customer_code_starting?: string;
  current_customer_code?: string;
  non_kyc_customer_code_starting?: string;
  non_kyc_current_customer_code?: string;
  created_at?: string;
  updated_at?: string;
  // For form handling, we'll have a 'countries' array and map currency_id to a code
};

// --- Constants for Form Selects (Currency) ---
const SUPPORTED_CURRENCIES = [
  { value: "1", id: 1, code: "INR", label: "INR - Indian Rupee" }, // Assuming '1' is the ID for INR
  { value: "2", id: 2, code: "USD", label: "USD - United States Dollar" }, // Example ID
  // Add other currencies with their IDs and codes
];
const currencyFormOptions = SUPPORTED_CURRENCIES.map((c) => ({
  value: String(c.id),
  label: c.label,
}));
const currencyAPIValues = SUPPORTED_CURRENCIES.map((c) => String(c.id)) as [
  string,
  ...string[]
];

// --- Zod Schema for Add/Edit Form ---
const domainFormSchema = z
  .object({
    domain: z
      .string()
      .min(1, "Domain name is required.")
      .regex(
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/,
        "Invalid domain format."
      ),
    currency_id: z.enum(currencyAPIValues, {
      errorMap: () => ({ message: "Please select a currency." }),
    }), // Form will use currency ID
    kycPrefix: z
      .string()
      .max(10, "KYC Prefix too long.")
      .optional()
      .or(z.literal("")),
    kycStartNumber: z.coerce
      .number()
      .int()
      .min(0, "KYC Start # must be non-negative."),
    kycCurrentNumber: z.coerce
      .number()
      .int()
      .min(0, "KYC Current # must be non-negative."),
    tempStartNumber: z.coerce
      .number()
      .int()
      .min(0, "Temp Start # must be non-negative."),
    tempCurrentNumber: z.coerce
      .number()
      .int()
      .min(0, "Temp Current # must be non-negative."),
    analyticsScript: z.string().optional().or(z.literal("")),
    countries: z
      .array(z.string())
      .min(1, "At least one country must be selected."), // Array of country IDs
  })
  .superRefine((data, ctx) => {
    if (data.kycCurrentNumber < data.kycStartNumber)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "KYC Current # must be ≥ Start #.",
        path: ["kycCurrentNumber"],
      });
    if (data.tempCurrentNumber < data.tempStartNumber)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Temp Current # must be ≥ Start #.",
        path: ["tempCurrentNumber"],
      });
  });
type DomainFormData = z.infer<typeof domainFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterCountries: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(), // <--- CORRECTED: Use z.string()
      })
    )
    .optional(),
  filterCurrency: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(), // <--- CORRECTED: Use z.string()
      })
    )
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// CSV Exporter
const CSV_HEADERS_DOM = [
  "ID",
  "Domain",
  "Currency ID",
  "KYC Prefix",
  "KYC Start",
  "KYC Current",
  "Temp Start",
  "Temp Current",
  "Country IDs",
  "Analytics Script",
];
const CSV_KEYS_DOM: (keyof DomainItem)[] = [
  "id",
  "domain",
  "currency_id",
  "prefix",
  "customer_code_starting",
  "current_customer_code",
  "non_kyc_customer_code_starting",
  "non_kyc_current_customer_code",
  "country_ids",
  "analytics_script",
];
// ... (exportDomainsToCsv function - ensure keys match DomainItem fields)
function exportDomainsToCsv(filename: string, rows: DomainItem[]) {
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
    CSV_HEADERS_DOM.join(separator) +
    "\n" +
    rows
      .map((row: any) =>
        CSV_KEYS_DOM.map((k) => {
          let cell: any = row[k];
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
    return true;
  }
  toast.push(
    <Notification title="Export Failed" type="danger">
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
      <Tooltip title="Share">
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
      </Tooltip>
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
    {" "}
    <div className="flex-grow">
      <ItemSearch onInputChange={onSearchChange} />
    </div>{" "}
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      {" "}
      <Button
        icon={<TbFilter />}
        onClick={onFilter}
        className="w-full sm:w-auto"
      >
        Filter
      </Button>{" "}
      <Button
        icon={<TbCloudUpload />}
        onClick={onExport}
        className="w-full sm:w-auto"
      >
        Export
      </Button>{" "}
    </div>{" "}
  </div>
);
type DomainsSelectedFooterProps = {
  selectedItems: DomainItem[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
};
const DomainsSelectedFooter = ({
  selectedItems,
  onDeleteSelected,
  isDeleting,
}: DomainsSelectedFooterProps) => {
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
      {" "}
      <StickyFooter
        className="flex items-center justify-between py-4 bg-white dark:bg-gray-800"
        stickyClass="-mx-4 sm:-mx-8 border-t border-gray-200 dark:border-gray-700 px-8"
      >
        {" "}
        <div className="flex items-center justify-between w-full px-4 sm:px-8">
          {" "}
          <span className="flex items-center gap-2">
            {" "}
            <span className="text-lg text-primary-600 dark:text-primary-400">
              <TbChecks />
            </span>{" "}
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              {" "}
              <span className="heading-text">{selectedItems.length}</span>{" "}
              <span>Domain{selectedItems.length > 1 ? "s" : ""} selected</span>{" "}
            </span>{" "}
          </span>{" "}
          <div className="flex items-center gap-3">
            {" "}
            <Button
              size="sm"
              variant="plain"
              className="text-red-600 hover:text-red-500"
              onClick={handleDeleteClick}
              loading={isDeleting}
            >
              Delete Selected
            </Button>{" "}
          </div>{" "}
        </div>{" "}
      </StickyFooter>{" "}
      <ConfirmDialog
        isOpen={deleteConfirmationOpen}
        type="danger"
        title={`Delete ${selectedItems.length} Domain${
          selectedItems.length > 1 ? "s" : ""
        }`}
        onClose={handleCancelDelete}
        onRequestClose={handleCancelDelete}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      >
        {" "}
        <p>
          Are you sure you want to delete the selected domain
          {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
        </p>{" "}
      </ConfirmDialog>{" "}
    </>
  );
};

const DomainManagementListing = () => {
  const dispatch = useAppDispatch();
  const {
    domainsData = [],
    CountriesData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [allCountryOptions, setAllCountryOptions] = useState<CountryOption[]>(
    []
  );
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DomainItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DomainItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false);
  const [tableData, setTableData] = useState<TableQueries>({
    pageIndex: 1,
    pageSize: 10,
    sort: { order: "", key: "" },
    query: "",
  });
  const [selectedItems, setSelectedItems] = useState<DomainItem[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterCountries: [],
    filterCurrency: [],
  });

  useEffect(() => {
    dispatch(getDomainsAction());
    dispatch(getCountriesAction());
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(CountriesData) && CountriesData.length > 0) {
      const options = CountriesData.map((country: CountryListItem) => ({
        value: String(country.id),
        label: country.name,
      }));
      setAllCountryOptions((prevOptions) => {
        if (JSON.stringify(prevOptions) !== JSON.stringify(options))
          return options;
        return prevOptions;
      });
    } else if (allCountryOptions.length > 0) {
      setAllCountryOptions([]);
    }
  }, [CountriesData, allCountryOptions.length]);

  const defaultFormValues: DomainFormData = {
    domain: "",
    currency_id: currencyAPIValues[0], // Default to first currency ID
    kycPrefix: "",
    kycStartNumber: 0,
    kycCurrentNumber: 0,
    tempStartNumber: 0,
    tempCurrentNumber: 0,
    analyticsScript: "",
    countries: [],
  };

  const formMethods = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
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
  }, [formMethods, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: DomainItem) => {
      setEditingItem(item);
      const selectedCountryIdsArray = item.country_ids
        ? item.country_ids
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id)
        : [];
      formMethods.reset({
        domain: item.domain,
        currency_id: String(item.currency_id), // API gives currency_id, form expects currency_id (string)
        kycPrefix: item.prefix || "",
        kycStartNumber: Number(item.customer_code_starting) || 0,
        kycCurrentNumber: Number(item.current_customer_code) || 0,
        tempStartNumber: Number(item.non_kyc_customer_code_starting) || 0,
        tempCurrentNumber: Number(item.non_kyc_current_customer_code) || 0,
        analyticsScript: item.analytics_script || "",
        countries: selectedCountryIdsArray,
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => {
    setEditingItem(null);
    setIsEditDrawerOpen(false);
  }, []);

  const onSubmitHandler = async (data: DomainFormData) => {
    setIsSubmitting(true);
    const apiPayload = {
      domain: data.domain,
      currency_id: data.currency_id, // Form already provides currency_id as string
      prefix: data.kycPrefix, // Form's kycPrefix maps to API's prefix
      customer_code_starting: String(data.kycStartNumber),
      current_customer_code: String(data.kycCurrentNumber),
      non_kyc_customer_code_starting: String(data.tempStartNumber),
      non_kyc_current_customer_code: String(data.tempCurrentNumber),
      analytics_script: data.analyticsScript,
      country_ids: data.countries.join(","), // Join array of country IDs
    };

    try {
      if (editingItem) {
        await dispatch(
          editDomainAction({ id: editingItem.id, ...apiPayload })
        ).unwrap();
        toast.push(
          <Notification title="Domain Updated" type="success" duration={2000}>
            Domain configuration saved.
          </Notification>
        );
        closeEditDrawer();
      } else {
        await dispatch(addDomainAction(apiPayload)).unwrap();
        toast.push(
          <Notification title="Domain Added" type="success" duration={2000}>
            New domain added.
          </Notification>
        );
        closeAddDrawer();
      }
      dispatch(getDomainsAction());
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
      console.error("Domain Submit Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Delete Handlers (no change in logic, just ensure correct action and data source)
  const handleDeleteClick = useCallback((item: DomainItem) => {
    if (!item.id) {
      toast.push(
        <Notification title="Error" type="danger">
          Cannot delete: Domain ID is missing.
        </Notification>
      );
      return;
    }
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);
  const onConfirmSingleDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;
    setIsDeleting(true);
    setSingleDeleteConfirmOpen(false);
    try {
      await dispatch(deleteDomainAction({ id: itemToDelete.id })).unwrap();
      toast.push(
        <Notification
          title="Domain Deleted"
          type="success"
          duration={2000}
        >{`Domain "${itemToDelete.domain}" deleted.`}</Notification>
      );
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getDomainsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {error.message || "Could not delete domain."}
        </Notification>
      );
      console.error("Delete Domain Error:", error);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);
  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const validItems = selectedItems.filter((item) => item.id);
    if (validItems.length === 0) {
      setIsDeleting(false);
      return;
    }
    const idsToDelete = validItems.map((item) => String(item.id));
    try {
      await dispatch(
        deleteAllDomainsAction({ ids: idsToDelete.join(",") })
      ).unwrap();
      toast.push(
        <Notification
          title="Domains Deleted"
          type="success"
          duration={2000}
        >{`${validItems.length} domain(s) deleted.`}</Notification>
      );
      setSelectedItems([]);
      dispatch(getDomainsAction());
    } catch (error: any) {
      toast.push(
        <Notification title="Delete Failed" type="danger" duration={3000}>
          {error.message || "Failed to delete selected domains."}
        </Notification>
      );
      console.error("Bulk Delete Domains Error:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  // Filter Handlers
  const openFilterDrawer = useCallback(() => {
    filterFormMethods.reset(filterCriteria);
    setIsFilterDrawerOpen(true);
  }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);
  const onApplyFiltersSubmit = useCallback(
    (data: FilterFormData) => {
      setFilterCriteria({
        filterCountries: data.filterCountries || [],
        filterCurrency: data.filterCurrency || [],
      });
      setTableData((prev) => ({ ...prev, pageIndex: 1 }));
      closeFilterDrawer();
    },
    [closeFilterDrawer]
  );
  const onClearFilters = useCallback(() => {
    const defaultFilters = { filterCountries: [], filterCurrency: [] };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
  }, [filterFormMethods]);

  // Data Processing for Table
  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: DomainItem[] = Array.isArray(domainsData)
      ? domainsData
      : [];
    let processedData: DomainItem[] = cloneDeep(sourceData);

    if (
      filterCriteria.filterCountries &&
      filterCriteria.filterCountries.length > 0
    ) {
      const selectedCountryFilterValues = filterCriteria.filterCountries.map(
        (opt) => opt.value
      );
      processedData = processedData.filter((item) => {
        if (!item.country_ids) return false;
        const itemCountryIds = item.country_ids
          .split(",")
          .map((id) => id.trim());
        return itemCountryIds.some((id) =>
          selectedCountryFilterValues.includes(id)
        );
      });
    }
    if (
      filterCriteria.filterCurrency &&
      filterCriteria.filterCurrency.length > 0
    ) {
      const selectedCurrencyValues = filterCriteria.filterCurrency.map(
        (opt) => opt.value
      ); // These are currency IDs
      processedData = processedData.filter((item) =>
        selectedCurrencyValues.includes(String(item.currency_id))
      );
    }

    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.domain.toLowerCase().includes(query) ||
          String(item.id).toLowerCase().includes(query) ||
          String(item.currency_id).toLowerCase().includes(query) || // Search by currency_id
          (item.prefix && item.prefix.toLowerCase().includes(query))
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    if (
      order &&
      key &&
      ["id", "domain", "currency_id", "countriesCount"].includes(String(key))
    ) {
      processedData.sort((a, b) => {
        let aVal, bVal;
        if (key === "countriesCount") {
          aVal = a.country_ids?.split(",").filter((id) => id).length || 0;
          bVal = b.country_ids?.split(",").filter((id) => id).length || 0;
        } else {
          aVal = a[key as keyof DomainItem];
          bVal = b[key as keyof DomainItem];
        }
        if (typeof aVal === "number" && typeof bVal === "number")
          return order === "asc" ? aVal - bVal : bVal - aVal;
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
  }, [domainsData, tableData, filterCriteria]);

  const handleExportData = useCallback(() => {
    const success = exportDomainsToCsv(
      "domains_management.csv",
      allFilteredAndSortedData
    );
    if (success)
      toast.push(
        <Notification title="Export Successful" type="success" duration={2000}>
          Data exported.
        </Notification>
      );
  }, [allFilteredAndSortedData]);
  // Table interaction handlers
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
  const handleRowSelect = useCallback((checked: boolean, row: DomainItem) => {
    setSelectedItems((prev) => {
      if (checked)
        return prev.some((item) => item.id === row.id) ? prev : [...prev, row];
      return prev.filter((item) => item.id !== row.id);
    });
  }, []);
  const handleAllRowSelect = useCallback(
    (checked: boolean, currentRows: Row<DomainItem>[]) => {
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

  // Columns for Listing: ID, Domain, Countries
  const columns: ColumnDef<DomainItem>[] = useMemo(
    () => [
      { header: "ID", accessorKey: "id", enableSorting: true, size: 80 },
      {
        header: "Domain",
        accessorKey: "domain",
        enableSorting: true,
        size: 250,
        cell: (props) => (
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {props.row.original.domain}
          </span>
        ),
      },
      {
        header: "Countries",
        accessorKey: "country_ids",
        id: "countriesDisplay",
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const countA =
            rowA.original.country_ids?.split(",").filter((id) => id).length ||
            0;
          const countB =
            rowB.original.country_ids?.split(",").filter((id) => id).length ||
            0;
          return countA - countB;
        },
        cell: (props) => {
          const countryIdString = props.row.original.country_ids;
          if (!countryIdString) return <Tag>N/A</Tag>;
          const idsArray = countryIdString
            .split(",")
            .map((id) => id.trim())
            .filter((id) => id);
          if (idsArray.length === 0) return <Tag>None</Tag>;

          const names = idsArray.map((idStr) => {
            const country = allCountryOptions.find(
              (opt) => opt.value === idStr
            );
            return country ? country.label : `ID:${idStr}`;
          });

          const displayLimit = 2;
          const displayedNames = names.slice(0, displayLimit);
          const remainingCount = names.length - displayLimit;

          return (
            <Tooltip
              title={names.join(", ")}
              wrapperClassName="whitespace-nowrap max-w-[250px] overflow-hidden text-ellipsis"
            >
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
            </Tooltip>
          );
        },
        size: 300,
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
    [allCountryOptions, openEditDrawer, handleDeleteClick]
  );

  // Render Form for Drawer (Full form)
  const renderDrawerForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem
        label="Domain Name"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.domain}
        errorMessage={formMethods.formState.errors.domain?.message}
      >
        <Controller
          name="domain"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<TbWorldWww className="text-lg" />}
              placeholder="e.g., example.com"
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Currency"
        invalid={!!formMethods.formState.errors.currency_id}
        errorMessage={formMethods.formState.errors.currency_id?.message}
      >
        <Controller
          name="currency_id"
          control={formMethods.control}
          render={({ field }) => (
            <Select
              placeholder="Select currency"
              options={currencyFormOptions} // Use options with IDs as values
              value={currencyFormOptions.find((c) => c.value === field.value)}
              onChange={(opt) => field.onChange(opt?.value)}
            />
          )}
        />
      </FormItem>
      <div /> {/* Spacer */}
      <div className="md:col-span-2 border-t pt-4 mt-2">
        <h6 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <TbSettingsCog /> Numbering System For KYC Member
        </h6>
      </div>
      <FormItem
        label="Prefix For KYC"
        invalid={!!formMethods.formState.errors.kycPrefix}
        errorMessage={formMethods.formState.errors.kycPrefix?.message}
      >
        <Controller
          name="kycPrefix"
          control={formMethods.control}
          render={({ field }) => <Input {...field} placeholder="e.g., EU-K-" />}
        />
      </FormItem>
      <div /> {/* Spacer */}
      <FormItem
        label="Member ID Starting Number"
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
        label="Member ID Current Number"
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
      <div className="md:col-span-2 border-t pt-4 mt-2">
        <h6 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <TbSettingsCog /> Numbering System For Temporary Member
        </h6>
      </div>
      <FormItem
        label="Member ID Starting Number"
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
        label="Member ID Current Number"
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
        label="Countries (Multi-select)"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.countries}
        errorMessage={formMethods.formState.errors.countries?.message as string}
      >
        <Controller
          name="countries"
          control={formMethods.control}
          render={({ field }) => (
            <Select
              isMulti
              placeholder="Select countries..."
              options={allCountryOptions}
              value={allCountryOptions.filter((opt) =>
                field.value?.includes(opt.value)
              )}
              onChange={(opts) =>
                field.onChange(opts ? opts.map((o: any) => o.value) : [])
              }
            />
          )}
        />
      </FormItem>
      <FormItem
        label="Analytics Script (Optional)"
        className="md:col-span-2"
        invalid={!!formMethods.formState.errors.analyticsScript}
        errorMessage={formMethods.formState.errors.analyticsScript?.message}
      >
        <Controller
          name="analyticsScript"
          control={formMethods.control}
          render={({ field }) => (
            <Textarea
              {...field}
              rows={4}
              placeholder="Paste your analytics script here (e.g., Google Analytics, Hotjar)"
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
              Domain Management
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
              checkboxChecked={(row: DomainItem) =>
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

      <DomainsSelectedFooter
        selectedItems={selectedItems}
        onDeleteSelected={handleDeleteSelected}
        isDeleting={isDeleting}
      />

      <Drawer
        title={editingItem ? "Edit Domain Configuration" : "Add New Domain"}
        isOpen={isAddDrawerOpen || isEditDrawerOpen}
        onClose={editingItem ? closeEditDrawer : closeAddDrawer}
        onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer}
        width={700}
        footer={
          <div className="text-right w-full">
            {" "}
            <Button
              size="sm"
              className="mr-2"
              onClick={editingItem ? closeEditDrawer : closeAddDrawer}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>{" "}
            <Button
              size="sm"
              variant="solid"
              form="domainForm"
              type="submit"
              loading={isSubmitting}
              disabled={!formMethods.formState.isValid || isSubmitting}
            >
              {" "}
              {isSubmitting
                ? editingItem
                  ? "Saving..."
                  : "Adding..."
                : editingItem
                ? "Save Changes"
                : "Save"}{" "}
            </Button>{" "}
          </div>
        }
      >
        <Form
          id="domainForm"
          onSubmit={formMethods.handleSubmit(onSubmitHandler)}
          className="flex flex-col gap-4"
        >
          {renderDrawerForm()}
        </Form>
      </Drawer>

      <Drawer
        title="Filter Domains"
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onRequestClose={() => setIsFilterDrawerOpen(false)}
        footer={
          <div className="text-right w-full">
              {" "}
              <Button
                size="sm"
                className="mr-2"
                onClick={() => setIsFilterDrawerOpen(false)}
                type="button"
              >
                Clear Filters
              </Button>{" "}
              <Button
                size="sm"
                variant="solid"
                form="filterDomainsForm"
                type="submit"
              >
                Apply Filters
              </Button>{" "}
            </div>
        }
      >
        <Form
          id="filterDomainsForm"
          onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)}
          className="flex flex-col gap-4"
        >
          <FormItem label="Filter by Countries">
            <Controller
              name="filterCountries"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select countries..."
                  options={allCountryOptions}
                  value={field.value || []} // field.value expects array of {value, label}
                  onChange={(opts) => field.onChange(opts || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Filter by Currency">
            <Controller
              name="filterCurrency"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select currencies..."
                  options={currencyFormOptions} // Use options with IDs
                  value={field.value || []}
                  onChange={(opts) => field.onChange(opts || [])}
                />
              )}
            />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog
        isOpen={singleDeleteConfirmOpen}
        type="danger"
        title="Delete Domain"
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
          Are you sure you want to delete the domain "
          <strong>{itemToDelete?.domain}</strong>"? This cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
};

export default DomainManagementListing;

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
