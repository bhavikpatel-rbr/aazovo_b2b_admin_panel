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

// Icons
import {
  TbPencil,
  TbChecks,
  TbSearch,
  TbFilter,
  TbPlus,
  TbCloudUpload,
  TbWorldWww,
  // TbSettingsCog, // Assuming not used now
  TbEye,
  TbReload,
  // TbUser, // Assuming not used now
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
  // deleteDomainAction, // Not used directly in this version's ActionColumn
  deleteAllDomainsAction,
  getCountriesAction,
  getCurrencyAction,
  submitExportReasonAction,
} from "@/reduxtool/master/middleware";
import { masterSelector } from "@/reduxtool/master/masterSlice";
// import { Link } from "react-router-dom"; // Assuming not used now

// --- Define Types ---
export type CountryListItem = { id: string | number; name: string };
export type CountryOption = { value: string; label: string };
export type CurrencyListItem = { id: string | number; currency_symbol: string, currency_code: string };
export type CurrencyOption = { value: string; label: string };


export type DomainItem = {
  id: string | number;
  domain: string;
  country_ids: string;
  prefix?: string;
  currency_id: string | number;
  analytics_script?: string | null;
  customer_code_starting?: string;
  current_customer_code?: string;
  non_kyc_customer_code_starting?: string;
  non_kyc_current_customer_code?: string;
  status: "Active" | "Inactive"; // <<<< ADDED STATUS
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_role?: string;
  updated_by_user?: { name: string, roles: [{ display_name: string }] }; // For detailed info
};

const apiStatusOptions: { value: "Active" | "Inactive"; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const statusOptions: { value: "Active" | "Inactive"; label: string }[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

// --- Zod Schema for Add/Edit Form ---
const domainFormSchema = z
  .object({
    domain: z.string().min(1, "Domain name is required.").regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/, "Invalid domain format."),
    currency_id: z.string().min(1, "Please select a currency."),
    kycPrefix: z.string().max(10, "KYC Prefix too long.").optional().or(z.literal("")),
    kycStartNumber: z.coerce.number().int().min(0, "KYC Start # must be non-negative."),
    kycCurrentNumber: z.coerce.number().int().min(0, "KYC Current # must be non-negative."),
    tempStartNumber: z.coerce.number().int().min(0, "Temp Start # must be non-negative."),
    tempCurrentNumber: z.coerce.number().int().min(0, "Temp Current # must be non-negative."),
    analyticsScript: z.string().optional().or(z.literal("")),
    countries: z.array(z.string()).min(1, "At least one country must be selected."),
    status: z.enum(["Active", "Inactive"], { // <<<< ADDED STATUS VALIDATION
      required_error: "Status is required.",
    }),
  })
  .superRefine((data, ctx) => {
   // if (data.kycCurrentNumber < data.kycStartNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "KYC Current # must be ≥ Start #.", path: ["kycCurrentNumber"] });
    //if (data.tempCurrentNumber < data.tempStartNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Temp Current # must be ≥ Start #.", path: ["tempCurrentNumber"] });
  });
type DomainFormData = z.infer<typeof domainFormSchema>;

// --- Zod Schema for Filter Form ---
const filterFormSchema = z.object({
  filterCountries: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterCurrency: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
  filterStatuses: z // <<<< ADDED STATUS FILTER SCHEMA
    .array(z.object({ value: z.string(), label: z.string() }))
    .optional(),
});
type FilterFormData = z.infer<typeof filterFormSchema>;

// --- Zod Schema for Export Reason Form ---
const exportReasonSchema = z.object({
  reason: z.string().min(10, "Reason for export is required minimum 10 characters.").max(255, "Reason cannot exceed 255 characters."),
});
type ExportReasonFormData = z.infer<typeof exportReasonSchema>;


// CSV Exporter
const CSV_HEADERS_DOM = [
  "ID",
  "Domain",
  "Status", // <<<< ADDED
  "Currency ID",
  "KYC Prefix",
  "KYC Start",
  "KYC Current",
  "Temp Start",
  "Temp Current",
  "Country IDs",
  "Analytics Script",
  "Created At",
  "Updated By",
  "Updated Role",
  "Updated At",
];

type DomainExportItem = Omit<DomainItem, "created_at" | "updated_at"> & {
    created_at_formatted?: string;
    updated_at_formatted?: string;
    // status is already in DomainItem
};

const CSV_KEYS_DOM_EXPORT: (keyof DomainExportItem)[] = [
  "id",
  "domain",
  "status", // <<<< ADDED
  "currency_id",
  "prefix",
  "customer_code_starting",
  "current_customer_code",
  "non_kyc_customer_code_starting",
  "non_kyc_current_customer_code",
  "country_ids",
  "analytics_script",
  "created_at_formatted",
  "updated_by_name",
  "updated_by_role",
  "updated_at_formatted",
];

function exportDomainsToCsv(filename: string, rows: DomainItem[]) {
  if (!rows || !rows.length) {
    return false;
  }
   const preparedRows: DomainExportItem[] = rows.map((row) => ({
    ...row,
    prefix: row.prefix || "N/A",
    customer_code_starting: row.customer_code_starting || "0",
    current_customer_code: row.current_customer_code || "0",
    non_kyc_customer_code_starting: row.non_kyc_customer_code_starting || "0",
    non_kyc_current_customer_code: row.non_kyc_current_customer_code || "0",
    country_ids: row.country_ids || "N/A",
    analytics_script: row.analytics_script || "N/A",
    status: row.status, // <<<< ENSURE STATUS IS INCLUDED
    created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString() : "N/A",
    updated_by_name: row.updated_by_name || "N/A",
    updated_by_role: row.updated_by_role || "N/A",
    updated_at_formatted: row.updated_at ? new Date(row.updated_at).toLocaleString() : "N/A",
  }));

  const separator = ",";
  const csvContent =
    CSV_HEADERS_DOM.join(separator) +
    "\n" +
    preparedRows
      .map((row) =>
        CSV_KEYS_DOM_EXPORT.map((k) => {
          let cell = row[k as keyof DomainExportItem];
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

// --- ActionColumn ---
const ActionColumn = ({ onEdit }: { onEdit: () => void; }) => { // Removed onViewDetail as it duplicates edit
  return (
    <div className="flex items-center justify-center gap-1">
      <Tooltip title="Edit/View Details">
        <div className={`text-xl cursor-pointer select-none text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400`} role="button" onClick={onEdit}><TbPencil /></div>
      </Tooltip>
    </div>
  );
};

type ItemSearchProps = { onInputChange: (value: string) => void; ref?: Ref<HTMLInputElement>; };
const ItemSearch = React.forwardRef<HTMLInputElement, ItemSearchProps>(
  ({ onInputChange }, ref) => (<DebouceInput ref={ref} className="w-full" placeholder="Quick Search..." suffix={<TbSearch className="text-lg" />} onChange={(e) => onInputChange(e.target.value)} />)
);
ItemSearch.displayName = "ItemSearch";

type ItemTableToolsProps = { onSearchChange: (query: string) => void; onFilter: () => void; onExport: () => void; onClearFilters: () => void; };
const ItemTableTools = ({ onSearchChange, onFilter, onExport, onClearFilters }: ItemTableToolsProps) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 w-full">
    <div className="flex-grow"><ItemSearch onInputChange={onSearchChange} /></div>
    <div className="flex flex-col sm:flex-row gap-1 w-full sm:w-auto">
      <Button title="Clear Filters" icon={<TbReload/>} onClick={onClearFilters}></Button>
      <Button icon={<TbFilter />} onClick={onFilter} className="w-full sm:w-auto">Filter</Button>
      <Button icon={<TbCloudUpload />} onClick={onExport} className="w-full sm:w-auto">Export</Button>
    </div>
  </div>
);

type DomainsSelectedFooterProps = { selectedItems: DomainItem[]; onDeleteSelected: () => void; isDeleting: boolean; };
const DomainsSelectedFooter = ({ selectedItems, onDeleteSelected, isDeleting }: DomainsSelectedFooterProps) => {
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
            <span className="text-lg text-primary-600 dark:text-primary-400"><TbChecks /></span>
            <span className="font-semibold flex items-center gap-1 text-sm sm:text-base">
              <span className="heading-text">{selectedItems.length}</span>
              <span>Domain{selectedItems.length > 1 ? "s" : ""} selected</span>
            </span>
          </span>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="plain" className="text-red-600 hover:text-red-500" onClick={handleDeleteClick} loading={isDeleting}>Delete Selected</Button>
          </div>
        </div>
      </StickyFooter>
      <ConfirmDialog isOpen={deleteConfirmationOpen} type="danger" title={`Delete ${selectedItems.length} Domain${selectedItems.length > 1 ? "s" : ""}`} onClose={handleCancelDelete} onRequestClose={handleCancelDelete} onCancel={handleCancelDelete} onConfirm={handleConfirmDelete} loading={isDeleting}>
        <p>Are you sure you want to delete the selected domain{selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.</p>
      </ConfirmDialog>
    </>
  );
};

const DomainManagementListing = () => {
  const dispatch = useAppDispatch();
  const {
    domainsData = [],
    CountriesData = [],
    CurrencyData = [],
    status: masterLoadingStatus = "idle",
  } = useSelector(masterSelector, shallowEqual);

  const [allCountryOptions, setAllCountryOptions] = useState<CountryOption[]>([]);
  const [currencyFormOptions, setCurrencyFormOptions] = useState<CurrencyOption[]>([]);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DomainItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DomainItem | null>(null); // For single delete from action column if re-added
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [singleDeleteConfirmOpen, setSingleDeleteConfirmOpen] = useState(false); // For single delete from action column
  const [tableData, setTableData] = useState<TableQueries>({ pageIndex: 1, pageSize: 10, sort: { order: "desc", key: "created_at" }, query: "" });
  const [selectedItems, setSelectedItems] = useState<DomainItem[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterCriteria, setFilterCriteria] = useState<FilterFormData>({
    filterCountries: [],
    filterCurrency: [],
    filterStatuses: [], // <<<< ADDED STATUS TO INITIAL FILTER CRITERIA
  });

  const [isExportReasonModalOpen, setIsExportReasonModalOpen] = useState(false);
  const [isSubmittingExportReason, setIsSubmittingExportReason] = useState(false);

  useEffect(() => {
    dispatch(getDomainsAction());
    dispatch(getCountriesAction());
    dispatch(getCurrencyAction());
  }, [dispatch]);

  useEffect(() => {
    if (Array.isArray(CountriesData) && CountriesData.length > 0) {
      const options = CountriesData.map((country: CountryListItem) => ({ value: String(country.id), label: country.name }));
      setAllCountryOptions(options);
    } else {
      setAllCountryOptions([]);
    }
  }, [CountriesData]);

  useEffect(() => {
    if (Array.isArray(CurrencyData) && CurrencyData.length > 0) {
      const options = CurrencyData.map((currency: CurrencyListItem) => ({
        value: String(currency.id),
        label: `${currency.currency_code} - ${currency.currency_symbol}`,
      }));
      setCurrencyFormOptions(options);
    } else {
      setCurrencyFormOptions([]);
    }
  }, [CurrencyData]);


  const defaultFormValues: DomainFormData = useMemo(() => ({
    domain: "",
    currency_id: currencyFormOptions[0]?.value || "",
    kycPrefix: "",
    kycStartNumber: 0,
    kycCurrentNumber: 0,
    tempStartNumber: 0,
    tempCurrentNumber: 0,
    analyticsScript: "",
    countries: [],
    status: 'Active', // <<<< ADDED DEFAULT STATUS
  }), [currencyFormOptions]);

  const formMethods = useForm<DomainFormData>({ resolver: zodResolver(domainFormSchema), defaultValues: defaultFormValues, mode: "onChange" });
  const filterFormMethods = useForm<FilterFormData>({ resolver: zodResolver(filterFormSchema), defaultValues: filterCriteria });
  const exportReasonFormMethods = useForm<ExportReasonFormData>({ resolver: zodResolver(exportReasonSchema), defaultValues: { reason: "" }, mode: "onChange" });


  const openAddDrawer = useCallback(() => {
    setEditingItem(null);
    formMethods.reset(defaultFormValues);
    setIsAddDrawerOpen(true);
  }, [formMethods, defaultFormValues]);
  const closeAddDrawer = useCallback(() => setIsAddDrawerOpen(false), []);

  const openEditDrawer = useCallback(
    (item: DomainItem) => {
      setEditingItem(item);
      const selectedCountryIdsArray = item.country_ids ? item.country_ids.split(",").map((id) => id.trim()).filter((id) => id) : [];
      formMethods.reset({
        domain: item.domain,
        currency_id: String(item.currency_id),
        kycPrefix: item.prefix || "",
        kycStartNumber: Number(item.customer_code_starting) || 0,
        kycCurrentNumber: Number(item.current_customer_code) || 0,
        tempStartNumber: Number(item.non_kyc_customer_code_starting) || 0,
        tempCurrentNumber: Number(item.non_kyc_current_customer_code) || 0,
        analyticsScript: item.analytics_script || "",
        countries: selectedCountryIdsArray,
        status: (item.status === "Active" || item.status === "Inactive") ? item.status : 'Active', // <<<< SET STATUS FOR EDIT
      });
      setIsEditDrawerOpen(true);
    },
    [formMethods]
  );
  const closeEditDrawer = useCallback(() => { setEditingItem(null); setIsEditDrawerOpen(false); }, []);

  const onSubmitHandler = async (data: DomainFormData) => {
    setIsSubmitting(true);
    const apiPayload = {
      domain: data.domain, currency_id: data.currency_id, prefix: data.kycPrefix,
      customer_code_starting: String(data.kycStartNumber), current_customer_code: String(data.kycCurrentNumber),
      non_kyc_customer_code_starting: String(data.tempStartNumber), non_kyc_current_customer_code: String(data.tempCurrentNumber),
      analytics_script: data.analyticsScript, country_ids: data.countries.join(","),
      status: data.status, // <<<< INCLUDE STATUS IN PAYLOAD
    };

    try {
      if (editingItem) {
        await dispatch(editDomainAction({ id: editingItem.id, ...apiPayload })).unwrap();
        toast.push(<Notification title="Domain Updated" type="success" duration={2000}>Domain configuration saved.</Notification>);
        closeEditDrawer();
      } else {
        await dispatch(addDomainAction(apiPayload)).unwrap();
        toast.push(<Notification title="Domain Added" type="success" duration={2000}>New domain added.</Notification>);
        closeAddDrawer();
      }
      dispatch(getDomainsAction());
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "An unknown error occurred.";
      toast.push(<Notification title={editingItem ? "Update Failed" : "Add Failed"} type="danger" duration={3000}>{errorMsg}</Notification>);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = useCallback((item: DomainItem) => { // Re-added for potential future use if individual delete from row is needed
    if (!item.id) return;
    setItemToDelete(item);
    setSingleDeleteConfirmOpen(true);
  }, []);

  const onConfirmSingleDelete = useCallback(async () => { // For individual delete
    if (!itemToDelete?.id) return;
    setIsDeleting(true); setSingleDeleteConfirmOpen(false);
    try {
      // Assuming deleteDomainAction exists and takes {id: string | number}
      // await dispatch(deleteDomainAction({ id: itemToDelete.id })).unwrap();
      // For now, let's use deleteAllDomainsAction with a single ID for consistency if deleteDomainAction is not separate
      await dispatch(deleteAllDomainsAction({ ids: String(itemToDelete.id) })).unwrap();
      toast.push(<Notification title="Domain Deleted" type="success" duration={2000}>{`Domain "${itemToDelete.domain}" deleted.`}</Notification>);
      setSelectedItems((prev) => prev.filter((d) => d.id !== itemToDelete!.id));
      dispatch(getDomainsAction());
    } catch (error: any) {
      toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{error.message || "Could not delete domain."}</Notification>);
    } finally {
      setIsDeleting(false); setItemToDelete(null);
    }
  }, [dispatch, itemToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;
    setIsDeleting(true);
    const validItems = selectedItems.filter((item) => item.id); if (validItems.length === 0) { setIsDeleting(false); return; }
    const idsToDelete = validItems.map((item) => String(item.id));
    try {
      await dispatch(deleteAllDomainsAction({ ids: idsToDelete.join(",") })).unwrap();
      toast.push(<Notification title="Domains Deleted" type="success" duration={2000}>{`${validItems.length} domain(s) deleted.`}</Notification>);
      setSelectedItems([]); dispatch(getDomainsAction());
    } catch (error: any) {
      toast.push(<Notification title="Delete Failed" type="danger" duration={3000}>{error.message || "Failed to delete selected domains."}</Notification>);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, selectedItems]);

  const openFilterDrawer = useCallback(() => { filterFormMethods.reset(filterCriteria); setIsFilterDrawerOpen(true); }, [filterFormMethods, filterCriteria]);
  const closeFilterDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const onApplyFiltersSubmit = useCallback((data: FilterFormData) => {
    setFilterCriteria({
      filterCountries: data.filterCountries || [],
      filterCurrency: data.filterCurrency || [],
      filterStatuses: data.filterStatuses || [], // <<<< APPLY STATUS FILTER
    });
    setTableData((prev) => ({ ...prev, pageIndex: 1 }));
    closeFilterDrawer();
  }, [closeFilterDrawer]);
  
 const onClearFilters = () => {
    const defaultFilters: FilterFormData = {
      filterCountries: [],
      filterCurrency: [],
      filterStatuses: [], // <<<< CLEAR STATUS FILTER
    };
    filterFormMethods.reset(defaultFilters);
    setFilterCriteria(defaultFilters);
    setTableData((prev) => ({ ...prev, pageIndex: 1, query: "" })); // Reset query as well
    dispatch(getDomainsAction()); // Re-fetch all data
    setIsFilterDrawerOpen(false);
  };

  const { pageData, total, allFilteredAndSortedData } = useMemo(() => {
    const sourceData: DomainItem[] = Array.isArray(domainsData) ? domainsData : [];
    let processedData: DomainItem[] = cloneDeep(sourceData);

    if (filterCriteria.filterStatuses?.length) { // <<<< FILTER BY STATUS
      processedData = processedData.filter((item) =>
        filterCriteria.filterStatuses!.some((f) => f.value === item.status)
      );
    }
    if (filterCriteria.filterCountries && filterCriteria.filterCountries.length > 0) {
      const selectedCountryFilterValues = filterCriteria.filterCountries.map((opt) => opt.value);
      processedData = processedData.filter((item) => { if (!item.country_ids) return false; const itemCountryIds = item.country_ids.split(",").map((id) => id.trim()); return itemCountryIds.some((id) => selectedCountryFilterValues.includes(id)); });
    }
    if (filterCriteria.filterCurrency && filterCriteria.filterCurrency.length > 0) {
      const selectedCurrencyValues = filterCriteria.filterCurrency.map((opt) => opt.value);
      processedData = processedData.filter((item) => selectedCurrencyValues.includes(String(item.currency_id)));
    }
    if (tableData.query && tableData.query.trim() !== "") {
      const query = tableData.query.toLowerCase().trim();
      processedData = processedData.filter(
        (item) =>
          item.domain.toLowerCase().includes(query) || String(item.id).toLowerCase().includes(query) ||
          (currencyFormOptions.find(c => String(c.value) === String(item.currency_id))?.label.toLowerCase() ?? "").includes(query) ||
          (item.prefix && item.prefix.toLowerCase().includes(query)) ||
          (item.updated_by_name?.toLowerCase() ?? "").includes(query)
      );
    }
    const { order, key } = tableData.sort as OnSortParam;
    // Added "status" to sortable keys
    if (order && key && ["id", "domain", "status", "currency_id", "countriesCount", "created_at", "updated_at", "updated_by_name"].includes(String(key))) {
        processedData.sort((a, b) => {
            let aVal: any, bVal: any;
            if (key === "created_at" || key === "updated_at") {
                const dateA = a[key as 'created_at' | 'updated_at'] ? new Date(a[key as 'created_at' | 'updated_at']!).getTime() : 0;
                const dateB = b[key as 'created_at' | 'updated_at'] ? new Date(b[key as 'created_at' | 'updated_at']!).getTime() : 0;
                return order === "asc" ? dateA - dateB : dateB - dateA;
            } else if (key === "countriesCount") {
                aVal = a.country_ids?.split(",").filter((id) => id).length || 0;
                bVal = b.country_ids?.split(",").filter((id) => id).length || 0;
            } else {
                aVal = a[key as keyof DomainItem] ?? "";
                bVal = b[key as keyof DomainItem] ?? "";
            }
            if (typeof aVal === "number" && typeof bVal === "number") return order === "asc" ? aVal - bVal : bVal - aVal;
            return order === "asc"
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });
    }
    const currentTotal = processedData.length;
    const pageIndex = tableData.pageIndex as number;
    const pageSize = tableData.pageSize as number;
    const startIndex = (pageIndex - 1) * pageSize;
    return { pageData: processedData.slice(startIndex, startIndex + pageSize), total: currentTotal, allFilteredAndSortedData: processedData };
  }, [domainsData, tableData, filterCriteria, currencyFormOptions]);

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
    const moduleName = "Domain Management";
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const fileName = `domains_management_export_${timestamp}.csv`;
    try {
      await dispatch(submitExportReasonAction({ reason: data.reason, module: moduleName, file_name: fileName })).unwrap();
      toast.push(<Notification title="Export Reason Submitted" type="success" />);
      exportDomainsToCsv(fileName, allFilteredAndSortedData);
      toast.push(<Notification title="Data Exported" type="success">Domain data exported.</Notification>);
      setIsExportReasonModalOpen(false);
    } catch (error: any) {
      toast.push(<Notification title="Operation Failed" type="danger" message={error.message || "Could not complete export."} />);
    } finally {
      setIsSubmittingExportReason(false);
    }
  };


  const handleSetTableData = useCallback((data: Partial<TableQueries>) => { setTableData((prev) => ({ ...prev, ...data })); }, []);
  const handlePaginationChange = useCallback((page: number) => handleSetTableData({ pageIndex: page }), [handleSetTableData]);
  const handleSelectChange = useCallback((value: number) => { handleSetTableData({ pageSize: Number(value), pageIndex: 1 }); setSelectedItems([]); }, [handleSetTableData]);
  const handleSort = useCallback((sort: OnSortParam) => { handleSetTableData({ sort: sort, pageIndex: 1 }); }, [handleSetTableData]);
  const handleSearchChange = useCallback((query: string) => handleSetTableData({ query: query, pageIndex: 1 }), [handleSetTableData]);
  const handleRowSelect = useCallback((checked: boolean, row: DomainItem) => { setSelectedItems((prev) => { if (checked) return prev.some((item) => item.id === row.id) ? prev : [...prev, row]; return prev.filter((item) => item.id !== row.id); }); }, []);
  const handleAllRowSelect = useCallback((checked: boolean, currentRows: Row<DomainItem>[]) => {
    const cPOR = currentRows.map((r) => r.original);
    if (checked) { setSelectedItems((pS) => { const pSIds = new Set(pS.map((i) => i.id)); const nRTA = cPOR.filter((r) => r.id && !pSIds.has(r.id)); return [...pS, ...nRTA]; }); }
    else { const cPRIds = new Set(cPOR.map((r) => r.id).filter(id => id !== undefined)); setSelectedItems((pS) => pS.filter((i) => i.id && !cPRIds.has(i.id))); }
  }, []);

  const columns: ColumnDef<DomainItem>[] = useMemo(
    () => [
      { header: "Domain", accessorKey: "domain", enableSorting: true, size: 160, cell: (props) => (<span className="font-semibold text-blue-600 dark:text-blue-400">{props.row.original.domain}</span>) },
     
      { header: "Countries", accessorKey: "country_ids", id: "countriesDisplay", enableSorting: true, sortingFn: (rowA, rowB) => { const countA = rowA.original.country_ids?.split(",").filter((id) => id).length || 0; const countB = rowB.original.country_ids?.split(",").filter((id) => id).length || 0; return countA - countB; },
        cell: (props) => {
          const countryIdString = props.row.original.country_ids; if (!countryIdString) return <Tag>N/A</Tag>;
          const idsArray = countryIdString.split(",").map((id) => id.trim()).filter((id) => id); if (idsArray.length === 0) return <Tag>None</Tag>;
          const names = idsArray.map((idStr) => { const country = allCountryOptions.find((opt) => opt.value === idStr); return country ? country.label : `ID:${idStr}`; });
          const displayLimit = 2; const displayedNames = names.slice(0, displayLimit); const remainingCount = names.length - displayLimit;
          return (
            <div className="flex flex-wrap gap-1">{displayedNames.map((name, index) => (<Tag key={`${name}-${index}`} className="bg-gray-100 dark:bg-gray-600">{name}</Tag>))}{remainingCount > 0 && (<Tag className="bg-gray-200 dark:bg-gray-500">+{remainingCount} more</Tag>)}</div>
          );
        }, size: 200, // Adjusted size
      },
      { header: "Currency", accessorKey: "currency_id", enableSorting: true, size: 100,
        cell: (props) => {
            const currencyId = String(props.row.original.currency_id);
            const currency = currencyFormOptions.find(c => c.value === currencyId);
            return currency ? currency.label.split(' - ')[0] : 'N/A';
        }
      },
      { header: "Updated Info", accessorKey: "updated_at", enableSorting: true, size: 160,
        cell: (props) => {
          const { updated_at, updated_by_user } = props.row.original; // Using updated_by_user
          const formattedDate = updated_at ? `${new Date(updated_at).getDate()} ${new Date(updated_at).toLocaleString("en-US", { month: "short" })} ${new Date(updated_at).getFullYear()}, ${new Date(updated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}` : "N/A";
          return (
            <div className="text-xs">
              <span>
                {updated_by_user?.name || "N/A"}
                {updated_by_user?.roles?.[0]?.display_name && (
                    <><br /><b>{updated_by_user.roles[0].display_name}</b></>
                  )}
              </span>
              <br />
              <span>{formattedDate}</span>
            </div>
          );
        },
      },
       {
        header: "Status", // <<<< ADDED STATUS COLUMN
        accessorKey: "status",
        enableSorting: true,
        size: 100,
        cell: (props) => (
          <Tag
            className={
              props.row.original.status === 'Active'
                ? `bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-100 capitalize font-semibold border-0`
                : `bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100 border-red-300 dark:border-red-500 capitalize font-semibold border-0`
            }
          >
            {props.row.original.status}
          </Tag>
        ),
      },
      { header: "Actions", id: "action", size: 80, meta: { HeaderClass: "text-center", cellClass: "text-center" },
        cell: (props) => (<ActionColumn onEdit={() => openEditDrawer(props.row.original)} />),
      },
    ], [allCountryOptions, currencyFormOptions, openEditDrawer]
  );

  const renderDrawerForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      <FormItem label={<div>Domain Name<span className="text-red-500"> * </span></div>} invalid={!!formMethods.formState.errors.domain} errorMessage={formMethods.formState.errors.domain?.message}>
        <Controller name="domain" control={formMethods.control} render={({ field }) => (<Input {...field} prefix={<TbWorldWww className="text-lg" />} placeholder="e.g., example.com" />)} />
      </FormItem>
      <FormItem label={<div>Status<span className="text-red-500"> * </span></div>} // <<<< ADDED STATUS FORM ITEM
          invalid={!!formMethods.formState.errors.status}
          errorMessage={formMethods.formState.errors.status?.message as string | undefined}
        >
          <Controller
            name="status"
            control={formMethods.control}
            render={({ field }) => (
              <Select
                placeholder="Select Status"
                options={statusOptions}
                value={statusOptions.find((option) => option.value === field.value) || null}
                onChange={(option) => field.onChange(option ? option.value : "")}
              />
            )}
          />
        </FormItem>
      <FormItem label={<div>Currency<span className="text-red-500"> * </span></div>}  className="md:col-span-2" invalid={!!formMethods.formState.errors.currency_id} errorMessage={formMethods.formState.errors.currency_id?.message}>
        <Controller name="currency_id" control={formMethods.control} render={({ field }) => (<Select placeholder="Select currency" options={currencyFormOptions} value={currencyFormOptions.find((c) => c.value === field.value)} onChange={(opt) => field.onChange(opt?.value)} />)} />
      </FormItem>
      <FormItem label={<div>Countries<span className="text-red-500"> * </span></div>} className="md:col-span-2" invalid={!!formMethods.formState.errors.countries} errorMessage={formMethods.formState.errors.countries?.message as string}>
        <Controller name="countries" control={formMethods.control} render={({ field }) => (<Select isMulti placeholder="Select countries..." options={allCountryOptions} value={allCountryOptions.filter((opt) => field.value?.includes(opt.value))} onChange={(opts) => field.onChange(opts ? opts.map((o: any) => o.value) : [])} />)} />
      </FormItem>

      <div className="md:col-span-2 pt-2"><h6 className="text-sm font-semibold flex items-center gap-2">Numbering System For KYC Member</h6></div>
      <div className="col-span-2 md:grid md:grid-cols-3 gap-2">
        <FormItem label="Prefix For KYC" invalid={!!formMethods.formState.errors.kycPrefix} errorMessage={formMethods.formState.errors.kycPrefix?.message}>
          <Controller name="kycPrefix" control={formMethods.control} render={({ field }) => <Input {...field} placeholder="e.g., EU-K-" />} />
        </FormItem>
        <FormItem label="Starting Number" invalid={!!formMethods.formState.errors.kycStartNumber} errorMessage={formMethods.formState.errors.kycStartNumber?.message}>
          <Controller name="kycStartNumber" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 10001" />)} />
        </FormItem>
        <FormItem label="Current Number" invalid={!!formMethods.formState.errors.kycCurrentNumber} errorMessage={formMethods.formState.errors.kycCurrentNumber?.message}>
          <Controller name="kycCurrentNumber" control={formMethods.control} render={({ field }) => (<Input {...field} readOnly type="number" placeholder="e.g., 10500" />)} />
        </FormItem>
      </div>
      <div className="md:col-span-2 pt-2"><h6 className="text-sm font-semibold flex items-center gap-2">Numbering System For Temporary Member</h6></div>
      <FormItem label="Starting Number" invalid={!!formMethods.formState.errors.tempStartNumber} errorMessage={formMethods.formState.errors.tempStartNumber?.message}>
        <Controller name="tempStartNumber" control={formMethods.control} render={({ field }) => (<Input {...field} type="number" placeholder="e.g., 5001" />)} />
      </FormItem>
      <FormItem label="Current Number" invalid={!!formMethods.formState.errors.tempCurrentNumber} errorMessage={formMethods.formState.errors.tempCurrentNumber?.message}>
        <Controller name="tempCurrentNumber" control={formMethods.control} render={({ field }) => (<Input {...field} readOnly type="number" placeholder="e.g., 5250" />)} />
      </FormItem>
      <FormItem label="Analytics Script" className="md:col-span-2" invalid={!!formMethods.formState.errors.analyticsScript} errorMessage={formMethods.formState.errors.analyticsScript?.message}>
        <Controller name="analyticsScript" control={formMethods.control} render={({ field }) => (<Input {...field} rows={4} placeholder="Paste your analytics script here (e.g., Google Analytics, Hotjar)" textArea />)} />
      </FormItem>
    </div>
  );

  const tableLoading = masterLoadingStatus === "loading" || isSubmitting || isDeleting;

  return (
    <>
      <Container className="h-auto">
        <AdaptiveCard className="h-full" bodyClass="h-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h5 className="mb-2 sm:mb-0">Domain Management</h5>
            <Button variant="solid" icon={<TbPlus />} onClick={openAddDrawer} disabled={tableLoading}>Add New</Button>
          </div>
          <ItemTableTools onSearchChange={handleSearchChange} onFilter={openFilterDrawer} onExport={handleOpenExportReasonModal} onClearFilters={onClearFilters} />
          <div className="mt-4">
            <DataTable
              columns={columns} data={pageData}
              noData={!tableLoading && pageData.length === 0}
              loading={tableLoading}
              pagingData={{ total, pageIndex: tableData.pageIndex as number, pageSize: tableData.pageSize as number }}
              selectable checkboxChecked={(row: DomainItem) => selectedItems.some((selected) => selected.id === row.id)}
              onPaginationChange={handlePaginationChange} onSelectChange={handleSelectChange}
              onSort={handleSort} onCheckBoxChange={handleRowSelect} onIndeterminateCheckBoxChange={handleAllRowSelect}
            />
          </div>
        </AdaptiveCard>
      </Container>

      <DomainsSelectedFooter selectedItems={selectedItems} onDeleteSelected={handleDeleteSelected} isDeleting={isDeleting} />

      <Drawer title={editingItem ? "Edit Domain" : "Add New Domain"} isOpen={isAddDrawerOpen || isEditDrawerOpen} onClose={editingItem ? closeEditDrawer : closeAddDrawer} onRequestClose={editingItem ? closeEditDrawer : closeAddDrawer} width={700} // Increased width for more fields
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={editingItem ? closeEditDrawer : closeAddDrawer} disabled={isSubmitting} type="button">Cancel</Button>
            <Button size="sm" variant="solid" form="domainForm" type="submit" loading={isSubmitting} disabled={!formMethods.formState.isValid || isSubmitting}>{isSubmitting ? (editingItem ? "Saving..." : "Adding...") : "Save"}</Button>
          </div>
        }
      >
        <Form id="domainForm" onSubmit={formMethods.handleSubmit(onSubmitHandler)} className="flex flex-col relative p-1 pb-28">
          {renderDrawerForm()}
        
          {editingItem && (
             <div className="absolute bottom-0 left-0 right-0 px-1"> {/* Ensure full width and padding consistency */}
                <div className="grid grid-cols-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-3">
                    <div>
                        <b className="mt-3 mb-3 font-semibold text-primary">Latest Update:</b><br />
                        <p className="text-sm font-semibold">{editingItem.updated_by_user?.name || "N/A"}</p>
                        <p>{editingItem.updated_by_user?.roles?.[0]?.display_name || "N/A"}</p>
                    </div>
                    <div className='text-right'>
                        <br />
                        <span className="font-semibold">Created At:</span>{" "}
                        <span>
                          {editingItem.created_at
                            ? `${new Date(editingItem.created_at).getDate()} ${new Date(
                                editingItem.created_at
                              ).toLocaleString("en-US", {
                                month: "short",
                              })} ${new Date(editingItem.created_at).getFullYear()}, ${new Date(
                                editingItem.created_at
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
                          {editingItem.updated_at
                            ? `${new Date(editingItem.updated_at).getDate()} ${new Date(
                                editingItem.updated_at
                              ).toLocaleString("en-US", {
                                month: "short",
                              })} ${new Date(editingItem.updated_at).getFullYear()}, ${new Date(
                                editingItem.updated_at
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

      <Drawer title="Filters" isOpen={isFilterDrawerOpen} onClose={closeFilterDrawer} onRequestClose={closeFilterDrawer} width={400}
        footer={
          <div className="text-right w-full">
            <Button size="sm" className="mr-2" onClick={onClearFilters} type="button">Clear</Button>
            <Button size="sm" variant="solid" form="filterDomainsForm" type="submit">Apply</Button>
          </div>
        }
      >
        <Form id="filterDomainsForm" onSubmit={filterFormMethods.handleSubmit(onApplyFiltersSubmit)} className="flex flex-col gap-4">
           <FormItem label="Status"> {/* <<<< ADDED STATUS FILTER */}
            <Controller
              name="filterStatuses"
              control={filterFormMethods.control}
              render={({ field }) => (
                <Select
                  isMulti
                  placeholder="Select status..."
                  options={apiStatusOptions}
                  value={field.value || []}
                  onChange={(val) => field.onChange(val || [])}
                />
              )}
            />
          </FormItem>
          <FormItem label="Countries">
            <Controller name="filterCountries" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select countries..." options={allCountryOptions} value={field.value || []} onChange={(opts) => field.onChange(opts || [])} />)} />
          </FormItem>
          <FormItem label="Currency">
            <Controller name="filterCurrency" control={filterFormMethods.control} render={({ field }) => (<Select isMulti placeholder="Select currencies..." options={currencyFormOptions} value={field.value || []} onChange={(opts) => field.onChange(opts || [])} />)} />
          </FormItem>
        </Form>
      </Drawer>

      <ConfirmDialog isOpen={singleDeleteConfirmOpen} type="danger" title="Delete Domain" onClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onRequestClose={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} onCancel={() => { setSingleDeleteConfirmOpen(false); setItemToDelete(null); }} confirmButtonColor="red-600" onConfirm={onConfirmSingleDelete} loading={isDeleting}>
        <p>Are you sure you want to delete the domain "<strong>{itemToDelete?.domain}</strong>"? This cannot be undone.</p>
      </ConfirmDialog>

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
        confirmButtonProps={{ disabled: !exportReasonFormMethods.formState.isValid || isSubmittingExportReason }}
      >
        <Form
          id="exportDomainsReasonForm"
          onSubmit={(e) => { e.preventDefault(); exportReasonFormMethods.handleSubmit(handleConfirmExportWithReason)(); }}
          className="flex flex-col gap-4 mt-2"
        >
          <FormItem
            label="Please provide a reason for exporting this data:"
            invalid={!!exportReasonFormMethods.formState.errors.reason}
            errorMessage={exportReasonFormMethods.formState.errors.reason?.message}
          >
            <Controller name="reason" control={exportReasonFormMethods.control} render={({ field }) => (<Input textArea {...field} placeholder="Enter reason..." rows={3} />)} />
          </FormItem>
        </Form>
      </ConfirmDialog>
    </>
  );
};

export default DomainManagementListing;

// function classNames(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(" "); } // Not used in this file